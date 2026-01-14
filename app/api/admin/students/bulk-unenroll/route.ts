import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkUnenrollSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un estudiante'),
  courseIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un curso'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo teacher_admin y school_admin pueden desasignar cursos
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json({ error: 'No tienes permisos para esta acción' }, { status: 403 })
    }

    const body = await request.json()
    const { studentIds, courseIds } = bulkUnenrollSchema.parse(body)

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
          { error: 'No puedes desasignar cursos que no están asignados a tu colegio' },
          { status: 403 }
        )
      }
    }

    // Desactivar inscripciones (no eliminar, solo marcar como inactivas)
    const unenrollments = []
    const errors = []

    for (const studentId of studentIds) {
      for (const courseId of courseIds) {
        try {
          const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId: studentId,
                courseId: courseId,
              },
            },
          })

          if (enrollment && enrollment.isActive) {
            await prisma.courseEnrollment.update({
              where: {
                userId_courseId: {
                  userId: studentId,
                  courseId: courseId,
                },
              },
              data: {
                isActive: false,
              },
            })
            unenrollments.push({ userId: studentId, courseId })
          }
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
      message: `Se desasignaron ${unenrollments.length} inscripciones exitosamente`,
      unenrollments: unenrollments.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error en bulk unenroll:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al desasignar cursos' },
      { status: 500 }
    )
  }
}

