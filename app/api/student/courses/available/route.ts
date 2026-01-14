import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const academicGrade = searchParams.get('academicGrade')
    const competencyId = searchParams.get('competencyId')

    // Obtener información del estudiante
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        school: true,
        courseEnrollments: {
          include: {
            course: {
              select: {
                academicGrade: true
              }
            }
          },
          take: 1,
          orderBy: {
            enrolledAt: 'desc'
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Obtener el grado académico del estudiante desde sus cursos inscritos
    const studentAcademicGrade = student.courseEnrollments?.[0]?.course?.academicGrade || null

    // Construir filtros para cursos disponibles
    let whereClause: any = {
      isPublished: true
    }

    // Filtrar por grado académico del estudiante o parámetro
    const targetGrade = academicGrade || studentAcademicGrade
    if (targetGrade) {
      whereClause.academicGrade = targetGrade
    }

    // Filtrar por competencia si se especifica
    if (competencyId) {
      whereClause.competencyId = competencyId
    }

    // Filtrar por visibilidad: cursos generales (sin colegio) O cursos del colegio del estudiante
    if (student.schoolId) {
      whereClause.OR = [
        {
          courseSchools: {
            none: {} // Cursos generales (sin asignar)
          }
        },
        {
          courseSchools: {
            some: {
              schoolId: student.schoolId
            }
          }
        }
      ]
    } else {
      // Si el estudiante no tiene colegio, solo puede ver cursos generales
      whereClause.courseSchools = {
        none: {}
      }
    }

    // Obtener cursos disponibles
    const availableCourses = await prisma.course.findMany({
      where: whereClause,
      include: {
        competency: true,
        courseModules: {
          include: {
            module: {
              include: {
                moduleLessons: {
                  include: {
                    lesson: true
                  }
                }
              }
            }
          }
        },
        courseEnrollments: {
          where: { userId },
          select: { id: true, status: true }
        }
      },
      orderBy: [
        { competency: { orderIndex: 'asc' } },
        { academicGrade: 'asc' },
        { title: 'asc' }
      ]
    })

    // Obtener cursos ya inscritos
    const enrolledCourses = await prisma.courseEnrollment.findMany({
      where: { 
        userId,
        status: { in: ['active', 'completed'] }
      },
      include: {
        course: {
          include: {
            competency: true
          }
        }
      }
    })

    const enrolledCourseIds = enrolledCourses.map(ec => ec.course.id)

    // Procesar cursos disponibles
    const courses = availableCourses.map(course => {
      const isEnrolled = enrolledCourseIds.includes(course.id)
      const enrollment = course.courseEnrollments[0]
      
      const totalLessons = course.courseModules.reduce((acc, cm) => 
        acc + cm.module.moduleLessons.length, 0
      )
      
      const totalModules = course.courseModules.length
      const estimatedTime = course.estimatedTimeMinutes || 
        course.courseModules.reduce((acc, cm) => 
          acc + (cm.module.estimatedTimeMinutes || 0), 0
        )

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        competency: course.competency?.name || 'General',
        competencyDisplayName: course.competency?.displayName || 'General',
        academicGrade: course.academicGrade,
        totalModules,
        totalLessons,
        estimatedTimeMinutes: estimatedTime,
        difficulty: course.difficulty || 'intermedio',
        prerequisites: course.prerequisites || [],
        isEnrolled,
        enrollmentStatus: enrollment?.status || null,
        enrollmentDate: enrollment?.enrolledAt || null,
        canEnroll: !isEnrolled && course.isActive,
        courseModules: course.courseModules.map(cm => ({
          id: cm.module.id,
          title: cm.module.title,
          description: cm.module.description,
          orderIndex: cm.module.orderIndex,
          lessonCount: cm.module.moduleLessons.length,
          estimatedTime: cm.module.estimatedTimeMinutes || 0
        })).sort((a, b) => a.orderIndex - b.orderIndex)
      }
    })

    // Filtrar cursos no inscritos para el catálogo
    const catalogCourses = courses.filter(course => !course.isEnrolled)

    return NextResponse.json({
      available: catalogCourses,
      enrolled: courses.filter(course => course.isEnrolled),
      student: {
        academicGrade: studentAcademicGrade,
        school: student.school?.name || 'Sin asignar'
      }
    })

  } catch (error) {
    console.error('Error fetching available courses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
