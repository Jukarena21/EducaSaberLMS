import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkEnrollSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un estudiante'),
  courseIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un curso'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo teacher_admin y school_admin pueden asignar cursos
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json({ error: 'No tienes permisos para esta acción' }, { status: 403 })
    }

    const body = await request.json()
    const { studentIds, courseIds } = bulkEnrollSchema.parse(body)

    // Verificar que los estudiantes existen
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'student',
        ...(session.user.role === 'school_admin' && session.user.schoolId
          ? { schoolId: session.user.schoolId }
          : {}),
      },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Uno o más estudiantes no existen o no tienes permisos para acceder a ellos' },
        { status: 400 }
      )
    }

    // Verificar que los cursos existen
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        courseSchools: true,
      },
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'Uno o más cursos no existen' },
        { status: 400 }
      )
    }

    // Si es school_admin, verificar que los cursos estén asignados a su colegio
    if (session.user.role === 'school_admin' && session.user.schoolId) {
      const invalidCourses = courses.filter(
        course => !course.courseSchools.some(cs => cs.schoolId === session.user.schoolId)
      )
      
      if (invalidCourses.length > 0) {
        return NextResponse.json(
          { error: 'No puedes asignar cursos que no están asignados a tu colegio' },
          { status: 403 }
        )
      }
    }

    // Crear inscripciones (evitar duplicados)
    const enrollments = []
    const errors = []

    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        try {
          // Verificar si ya existe la inscripción
          const existing = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: studentId,
                courseId: courseId,
              },
            },
          })

          if (existing) {
            // Si existe pero está inactiva, reactivarla
            if (!existing.isActive) {
              await prisma.courseEnrollment.update({
                where: {
                  userId_courseId: {
                    userId: studentId,
                    courseId: courseId,
                  },
                },
                data: {
                  isActive: true,
                  enrolledAt: new Date(),
                },
              })
              enrollments.push({ userId: studentId, courseId })
            }
            // Si ya está activa, no hacer nada
            continue
          }

          // Crear nueva inscripción
          await prisma.courseEnrollment.create({
            data: {
              userId: studentId,
              courseId: courseId,
              isActive: true,
              enrolledAt: new Date(),
            },
          })
          enrollments.push({ userId: studentId, courseId })
        } catch (error: any) {
          errors.push({
            studentId,
            courseId,
            error: error.message || 'Error desconocido',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se asignaron ${enrollments.length} inscripciones exitosamente`,
      enrollments: enrollments.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error en bulk enroll:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al asignar cursos' },
      { status: 500 }
    )
  }
}

