import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const schoolId = searchParams.get('schoolId')

    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto

    const events: any[] = []

    // 1. Clases en vivo
    const liveClassesWhere: any = {
      startDateTime: {
        gte: start,
        lte: end
      }
    }

    // Si es school_admin, solo ver clases de su colegio
    if (session.user.role === 'school_admin' && session.user.schoolId) {
      liveClassesWhere.schoolId = session.user.schoolId
    } else if (schoolId && schoolId !== 'all') {
      liveClassesWhere.schoolId = schoolId
    }

    // Si es estudiante, solo ver clases donde está invitado
    if (session.user.role === 'student') {
      liveClassesWhere.invitations = {
        some: {
          userId: session.user.id
        }
      }
    }

    const liveClasses = await prisma.liveClass.findMany({
      where: liveClassesWhere,
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        module: {
          select: {
            id: true,
            title: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    liveClasses.forEach(lc => {
      events.push({
        id: `live-class-${lc.id}`,
        type: 'live_class',
        title: lc.title,
        description: lc.description,
        startDate: lc.startDateTime.toISOString(),
        endDate: lc.endDateTime?.toISOString() || null,
        meetingUrl: lc.meetingUrl,
        provider: lc.provider,
        competency: lc.competency,
        module: lc.module,
        lesson: lc.lesson,
        school: lc.school,
        academicGrade: lc.academicGrade
      })
    })

    // 2. Fechas de inicio y fin de exámenes (solo para school_admin, no teacher_admin)
    if (session.user.role === 'school_admin') {
      const examsWhere: any = {
        isPublished: true,
        OR: [
          { openDate: { gte: start, lte: end } },
          { closeDate: { gte: start, lte: end } }
        ]
      }

      // Filtrar por cursos de su colegio
      if (session.user.schoolId) {
        const schoolCourses = await prisma.course.findMany({
          where: {
            courseSchools: {
              some: { schoolId: session.user.schoolId }
            }
          },
          select: { id: true }
        })
        const courseIds = schoolCourses.map(c => c.id)
        if (courseIds.length > 0) {
          examsWhere.courseId = { in: courseIds }
        } else {
          examsWhere.courseId = { in: [''] } // No hay cursos, no mostrar exámenes
        }
      }

      const exams = await prisma.exam.findMany({
        where: examsWhere,
        include: {
          competency: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })

      exams.forEach(exam => {
        if (exam.openDate && exam.openDate >= start && exam.openDate <= end) {
          events.push({
            id: `exam-open-${exam.id}`,
            type: 'exam_open',
            title: `Inicio: ${exam.title}`,
            description: exam.description,
            startDate: exam.openDate.toISOString(),
            endDate: null,
            examId: exam.id,
            examTitle: exam.title,
            competency: exam.competency,
            course: exam.course,
            academicGrade: exam.academicGrade,
            examType: exam.examType
          })
        }
        if (exam.closeDate && exam.closeDate >= start && exam.closeDate <= end) {
          events.push({
            id: `exam-close-${exam.id}`,
            type: 'exam_close',
            title: `Cierre: ${exam.title}`,
            description: exam.description,
            startDate: exam.closeDate.toISOString(),
            endDate: null,
            examId: exam.id,
            examTitle: exam.title,
            competency: exam.competency,
            course: exam.course,
            academicGrade: exam.academicGrade,
            examType: exam.examType
          })
        }
      })
    }

    // 3. Fechas de presentación de exámenes (solo para school_admin, no teacher_admin ni estudiantes)
    if (session.user.role === 'school_admin') {
      const examResultsWhere: any = {
        completedAt: {
          gte: start,
          lte: end
        }
      }

      // Si es school_admin, solo ver resultados de estudiantes de su colegio
      if (session.user.role === 'school_admin' && session.user.schoolId) {
        examResultsWhere.user = {
          schoolId: session.user.schoolId
        }
      }

      const examResults = await prisma.examResult.findMany({
        where: examResultsWhere,
        include: {
          exam: {
            include: {
              competency: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              },
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      examResults.forEach(result => {
        if (result.completedAt) {
          events.push({
            id: `exam-result-${result.id}`,
            type: 'exam_submission',
            title: `Examen presentado: ${result.exam.title}`,
            description: `Presentado por ${result.user.firstName} ${result.user.lastName}`,
            startDate: result.completedAt.toISOString(),
            endDate: null,
            examId: result.examId,
            examTitle: result.exam.title,
            userId: result.userId,
            userName: `${result.user.firstName} ${result.user.lastName}`,
            score: result.score,
            isPassed: result.isPassed,
            competency: result.exam.competency,
            course: result.exam.course
          })
        }
      })
    }

    // 4. Quices disponibles para estudiantes (exámenes tipo por_modulo sin fecha de cierre)
    if (session.user.role === 'student') {
      // Obtener quices (exámenes por_modulo) disponibles para el estudiante
      const studentEnrollments = await prisma.courseEnrollment.findMany({
        where: {
          userId: session.user.id,
          isActive: true
        },
        select: {
          courseId: true
        }
      })

      const enrolledCourseIds = studentEnrollments.map(e => e.courseId)

      if (enrolledCourseIds.length > 0) {
        const availableQuizzes = await prisma.exam.findMany({
          where: {
            examType: 'por_modulo',
            courseId: { in: enrolledCourseIds },
            isPublished: true,
            // Solo quices sin fecha de cierre o con fecha de cierre en el futuro
            AND: [
              {
                OR: [
                  { closeDate: null },
                  { closeDate: { gte: start } }
                ]
              },
              {
                OR: [
                  { openDate: null },
                  { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
                ]
              }
            ]
          },
          include: {
            competency: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            },
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })

        // Verificar que el estudiante tiene el módulo completado para cada quiz
        for (const quiz of availableQuizzes) {
          if (!quiz.includedModules) continue

          try {
            const moduleIds = JSON.parse(quiz.includedModules)
            if (!Array.isArray(moduleIds) || moduleIds.length === 0) continue

            // Verificar si el estudiante completó el módulo
            const moduleProgress = await prisma.studentModuleProgress.findFirst({
              where: {
                userId: session.user.id,
                moduleId: moduleIds[0], // Tomar el primer módulo
                progressPercentage: 100
              }
            })

            if (moduleProgress && moduleProgress.completedAt) {
              events.push({
                id: `quiz-available-${quiz.id}`,
                type: 'quiz_available',
                title: `Quiz Disponible: ${quiz.title}`,
                description: quiz.description || 'Quiz del módulo completado',
                startDate: moduleProgress.completedAt.toISOString(), // Fecha de completitud del módulo
                endDate: quiz.closeDate?.toISOString() || null,
                examId: quiz.id,
                examTitle: quiz.title,
                competency: quiz.competency,
                course: quiz.course,
                academicGrade: quiz.academicGrade,
                examType: quiz.examType
              })
            }
          } catch {
            // Si no se puede parsear includedModules, continuar
            continue
          }
        }
      }
    }

    // 5. Fechas de finalización de módulos (solo para school_admin, no teacher_admin ni estudiantes)
    if (session.user.role === 'school_admin') {
      const moduleProgressWhere: any = {
        completedAt: {
          gte: start,
          lte: end,
          not: null
        }
      }

      // Si es school_admin, solo ver progreso de estudiantes de su colegio
      if (session.user.role === 'school_admin' && session.user.schoolId) {
        moduleProgressWhere.user = {
          schoolId: session.user.schoolId
        }
      }

      const moduleProgresses = await prisma.studentModuleProgress.findMany({
        where: moduleProgressWhere,
        include: {
          module: {
            include: {
              competency: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      moduleProgresses.forEach(progress => {
        if (progress.completedAt) {
          events.push({
            id: `module-complete-${progress.id}`,
            type: 'module_complete',
            title: `Módulo completado: ${progress.module.title}`,
            description: `Completado por ${progress.user.firstName} ${progress.user.lastName}`,
            startDate: progress.completedAt.toISOString(),
            endDate: null,
            moduleId: progress.moduleId,
            moduleTitle: progress.module.title,
            userId: progress.userId,
            userName: `${progress.user.firstName} ${progress.user.lastName}`,
            progressPercentage: progress.progressPercentage,
            competency: progress.module.competency,
            academicGrade: progress.module.academicGrade
          })
        }
      })
    }

    // Ordenar eventos por fecha
    events.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

