import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Grado del estudiante: query > perfil (User.academicGrade) > último curso inscrito */
function resolveStudentTargetGrade(
  queryGrade: string | null,
  profileGrade: string | null,
  enrollmentGrade: string | null
): string | null {
  return queryGrade || profileGrade || enrollmentGrade || null
}

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
      select: {
        id: true,
        academicGrade: true,
        schoolId: true,
        school: true,
        courseEnrollments: {
          select: {
            enrolledAt: true,
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

    // Grado desde último curso inscrito (fallback)
    const enrollmentGrade =
      student.courseEnrollments?.[0]?.course?.academicGrade || null

    const targetGrade = resolveStudentTargetGrade(
      academicGrade,
      student.academicGrade,
      enrollmentGrade
    )

    // Visibilidad por colegio: curso sin asignar (global) o asignado al colegio del estudiante
    const schoolBranch = student.schoolId
      ? {
          OR: [
            { courseSchools: { none: {} } },
            { courseSchools: { some: { schoolId: student.schoolId } } }
          ]
        }
      : { courseSchools: { none: {} } }

    const competencyFilter = competencyId ? { competencyId } : {}

    // Con cursos ICFES por grado: incluir también cursos generales (academicGrade null)
    let whereClause: any
    if (targetGrade) {
      whereClause = {
        isPublished: true,
        ...competencyFilter,
        AND: [
          {
            OR: [
              { academicGrade: targetGrade },
              { academicGrade: null }
            ]
          },
          schoolBranch
        ]
      }
    } else {
      whereClause = {
        isPublished: true,
        ...competencyFilter,
        ...schoolBranch
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
          select: { id: true, isActive: true, enrolledAt: true }
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
        userId
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
        difficulty: course.difficultyLevel || 'intermedio',
        prerequisites: [] as string[],
        isEnrolled,
        enrollmentStatus: enrollment?.isActive ? 'active' : null,
        enrollmentDate: enrollment?.enrolledAt || null,
        canEnroll: !isEnrolled && course.isPublished,
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
        academicGrade: targetGrade,
        school: student.school?.name || 'Sin asignar'
      }
    })

  } catch (error) {
    console.error('Error fetching available courses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
