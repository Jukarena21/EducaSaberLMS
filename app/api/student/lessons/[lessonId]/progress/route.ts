import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AchievementService } from '@/lib/achievementService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { lessonId } = await params
    const userId = session.user.id

    // Buscar el progreso de la lección
    const progress = await prisma.studentLessonProgress.findFirst({
      where: {
        userId,
        lessonId
      }
    })

    if (!progress) {
      return NextResponse.json({
        progressPercentage: 0,
        status: 'not_started',
        videoCompleted: false,
        theoryCompleted: false,
        exercisesCompleted: false
      })
    }

    return NextResponse.json({
      progressPercentage: progress.progressPercentage,
      status: progress.status,
      videoCompleted: progress.videoCompleted,
      theoryCompleted: progress.theoryCompleted,
      exercisesCompleted: progress.exercisesCompleted
    })

  } catch (error) {
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { lessonId } = await params
    const userId = session.user.id
    const { videoViewed, theoryViewed, exercisesCompleted, correctAnswers, totalQuestions } = await request.json()

    // Verificar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    // Verificar que el estudiante tiene acceso a esta lección (simplificado)
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        isActive: true,
        course: {
          courseModules: {
            some: {
              module: {
                moduleLessons: {
                  some: {
                    lessonId
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Sin acceso a esta lección' }, { status: 403 })
    }

    // Calcular progreso basado en las acciones
    let progressPercentage = 0
    
    if (videoViewed) progressPercentage += 33
    if (theoryViewed) progressPercentage += 33
    
    if (exercisesCompleted && totalQuestions > 0) {
      const exerciseProgress = (correctAnswers / totalQuestions) * 34 // 34% para ejercicios
      progressPercentage += exerciseProgress
    }

    // Determinar estado de la lección
    let status = 'not_started'
    if (progressPercentage >= 100) {
      status = 'completed'
    } else if (progressPercentage > 0) {
      status = 'in_progress'
    }

    // Buscar o crear el progreso de la lección
    const existingProgress = await prisma.studentLessonProgress.findFirst({
      where: {
        userId,
        lessonId
      }
    })

    if (existingProgress) {
      // Actualizar progreso existente
      await prisma.studentLessonProgress.update({
        where: { id: existingProgress.id },
        data: {
          progressPercentage: Math.round(progressPercentage),
          status,
          videoCompleted: videoViewed || existingProgress.videoCompleted,
          theoryCompleted: theoryViewed || existingProgress.theoryCompleted,
          exercisesCompleted: exercisesCompleted || existingProgress.exercisesCompleted,
          completedAt: status === 'completed' ? new Date() : existingProgress.completedAt
        }
      })
    } else {
      // Crear nuevo progreso
      await prisma.studentLessonProgress.create({
        data: {
          userId,
          lessonId,
          progressPercentage: Math.round(progressPercentage),
          status,
          videoCompleted: videoViewed || false,
          theoryCompleted: theoryViewed || false,
          exercisesCompleted: exercisesCompleted || false,
          completedAt: status === 'completed' ? new Date() : null
        }
      })
    }

    // Actualizar progreso del módulo si la lección está completada
    let moduleCompleted = false
    let quizGenerated = false
    
    if (status === 'completed') {
      // Encontrar el módulo que contiene esta lección
      const moduleLesson = await prisma.moduleLesson.findFirst({
        where: {
          lessonId
        },
        include: {
          module: {
            include: {
              moduleLessons: {
                include: {
                  lesson: true
                }
              },
              courseModules: {
                include: {
                  course: {
                    include: {
                      competency: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (moduleLesson) {
        const module = moduleLesson.module
        const totalLessons = module.moduleLessons.length

        // Contar lecciones completadas del módulo
        const completedLessons = await prisma.studentLessonProgress.count({
          where: {
            userId,
            lessonId: {
              in: module.moduleLessons.map(ml => ml.lessonId)
            },
            status: 'completed'
          }
        })

        const moduleProgressPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0

        // Actualizar o crear progreso del módulo
        const existingModuleProgress = await prisma.studentModuleProgress.findFirst({
          where: {
            userId,
            moduleId: module.id
          }
        })

        if (existingModuleProgress) {
          await prisma.studentModuleProgress.update({
            where: { id: existingModuleProgress.id },
            data: {
              progressPercentage: moduleProgressPercentage,
              completedLessonsCount: completedLessons,
              completedAt: moduleProgressPercentage === 100 ? new Date() : existingModuleProgress.completedAt
            }
          })
        } else {
          await prisma.studentModuleProgress.create({
            data: {
              userId,
              moduleId: module.id,
              progressPercentage: moduleProgressPercentage,
              completedLessonsCount: completedLessons,
              completedAt: moduleProgressPercentage === 100 ? new Date() : null
            }
          })
        }

        // Si el módulo está completado al 100%, generar quiz automáticamente
        if (moduleProgressPercentage === 100 && completedLessons === totalLessons) {
          moduleCompleted = true

          // Verificar si ya existe un quiz para este módulo
          const course = module.courseModules[0]?.course
          if (course) {
            const allQuizzes = await prisma.exam.findMany({
              where: {
                examType: 'por_modulo',
                courseId: course.id
              }
            })

            const existingQuiz = allQuizzes.find(quiz => {
              if (!quiz.includedModules) return false
              try {
                const modules = JSON.parse(quiz.includedModules)
                return Array.isArray(modules) && modules.includes(module.id)
              } catch {
                return quiz.includedModules.includes(module.id)
              }
            })

            if (!existingQuiz) {
              // Generar quiz automático
              try {
                // Obtener todas las preguntas del módulo
                const allQuestions: any[] = []
                for (const ml of module.moduleLessons) {
                  const questions = await prisma.lessonQuestion.findMany({
                    where: {
                      lessonId: ml.lessonId,
                      OR: [
                        { usage: 'exam' },
                        { usage: 'both' }
                      ]
                    }
                  })
                  allQuestions.push(...questions)
                }

                if (allQuestions.length > 0) {
                  // Seleccionar preguntas aleatorias (máximo 10)
                  const questionsPerModule = Math.min(10, allQuestions.length)
                  const shuffled = allQuestions.sort(() => 0.5 - Math.random())
                  const selectedQuestions = shuffled.slice(0, questionsPerModule)

                  // Crear el examen (quiz)
                  const quiz = await prisma.exam.create({
                    data: {
                      title: `Quiz: ${module.title}`,
                      description: `Quiz automático del módulo "${module.title}". Evalúa tu conocimiento sobre los temas aprendidos.`,
                      examType: 'por_modulo',
                      courseId: course.id,
                      competencyId: course.competencyId || undefined,
                      academicGrade: course.academicGrade || undefined,
                      timeLimitMinutes: 15,
                      passingScore: 70,
                      difficultyLevel: 'intermedio',
                      isAdaptive: false,
                      isPublished: true,
                      isIcfesExam: false,
                      includedModules: JSON.stringify([module.id]),
                      questionsPerModule: questionsPerModule,
                      totalQuestions: questionsPerModule
                    }
                  })

                  // Crear las preguntas del examen
                  for (let i = 0; i < selectedQuestions.length; i++) {
                    const question = selectedQuestions[i]
                    await prisma.examQuestion.create({
                      data: {
                        examId: quiz.id,
                        questionText: question.questionText,
                        questionImage: question.questionImage || null,
                        questionType: question.questionType || 'multiple_choice',
                        optionA: question.optionA,
                        optionB: question.optionB,
                        optionC: question.optionC,
                        optionD: question.optionD,
                        optionAImage: question.optionAImage || null,
                        optionBImage: question.optionBImage || null,
                        optionCImage: question.optionCImage || null,
                        optionDImage: question.optionDImage || null,
                        correctOption: question.correctOption,
                        explanation: question.explanation || null,
                        explanationImage: question.explanationImage || null,
                        orderIndex: i + 1,
                        difficultyLevel: question.difficultyLevel || 'intermedio',
                        timeLimit: question.timeLimit || null,
                        lessonId: question.lessonId || null,
                        lessonUrl: question.lessonId ? `/estudiante/cursos/${course.id}/leccion/${question.lessonId}` : null
                      }
                    })
                  }

                  quizGenerated = true

                  // Enviar notificación al estudiante sobre el quiz disponible
                  try {
                    await prisma.notification.create({
                      data: {
                        userId,
                        type: 'exam_available',
                        title: '¡Quiz Disponible!',
                        message: `Has completado el módulo "${module.title}". Ya puedes tomar el quiz para evaluar tu conocimiento.`,
                        actionUrl: `/estudiante/cursos/${course.id}?module=${module.id}&tab=quizzes`,
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expira en 30 días
                        metadata: JSON.stringify({
                          examId: quiz.id,
                          examType: 'por_modulo',
                          moduleId: module.id,
                          moduleTitle: module.title,
                          courseId: course.id
                        })
                      }
                    })
                  } catch (notifyError) {
                    console.error('Error sending quiz notification:', notifyError)
                    // No fallar si no se puede enviar la notificación
                  }
                }
              } catch (error) {
                console.error('Error generating automatic quiz:', error)
                // No fallar si no se puede generar el quiz, solo loguear
              }
            }
          }
        }
      }
    }

    // Verificar logros después de actualizar el progreso
    let unlockedAchievements: string[] = []
    try {
      unlockedAchievements = await AchievementService.checkAndUnlockAllAchievements(userId)
    } catch (error) {
      console.error('Error checking achievements:', error)
    }

    return NextResponse.json({
      success: true,
      progressPercentage: Math.round(progressPercentage),
      status,
      unlockedAchievements,
      moduleCompleted,
      quizGenerated
    })

  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}