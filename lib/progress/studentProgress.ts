/**
 * Progreso del estudiante por curso y por área. Lo usan la pestaña de
 * progreso y el informe completo en PDF, para que ambos muestren lo mismo.
 */

import { prisma } from '@/lib/prisma'
import {
  isLessonCompletedStatus,
  isLessonInProgressStatus,
  toProgressPercentage,
} from '@/lib/progress/lessonProgress'

export async function getStudentCoursesProgress(userId: string) {
  // Obtener cursos en los que está inscrito el estudiante
  const courseEnrollments = await prisma.courseEnrollment.findMany({
    where: { 
      userId,
      isActive: true
    },
    include: {
      course: {
        include: {
          competency: true,
          courseModules: {
            include: {
              module: {
                include: {
                  moduleLessons: {
                    where: { lesson: { isPublished: true } },
                    include: {
                      lesson: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Obtener progreso de lecciones del estudiante
  const lessonProgress = await prisma.studentLessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          moduleLessons: {
            include: {
              module: {
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

  // Obtener progreso de contenido del estudiante (usando studentLessonProgress)
  const contentProgress = await prisma.studentLessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          moduleLessons: {
            include: {
              module: {
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

  // Procesar datos para cada curso
  const coursesProgress = courseEnrollments.map(enrollment => {
    const course = enrollment.course
    const totalLessons = course.courseModules.reduce((acc, cm) => 
      acc + cm.module.moduleLessons.length, 0
    )
    
    const totalModules = course.courseModules.length
    
    // Calcular lecciones completadas
    const completedLessons = lessonProgress.filter(lp => 
      course.courseModules.some(cm => 
        cm.module.moduleLessons.some(ml => ml.lessonId === lp.lessonId)
      ) && isLessonCompletedStatus(lp.status)
    ).length

    // Calcular tiempo total invertido
    const totalTimeMinutes = contentProgress
      .filter(cp => 
        course.courseModules.some(cm => 
          cm.module.moduleLessons.some(ml => ml.lessonId === cp.lessonId)
        )
      )
      .reduce((acc, cp) => acc + (cp.totalTimeMinutes || 0), 0)

    // Calcular progreso por módulo
    const modulesProgress = course.courseModules.map(cm => {
      const moduleLessons = cm.module.moduleLessons
      const completedModuleLessons = lessonProgress.filter(lp => 
        moduleLessons.some(ml => ml.lessonId === lp.lessonId) && isLessonCompletedStatus(lp.status)
      ).length
      
      const moduleTimeMinutes = contentProgress
        .filter(cp => moduleLessons.some(ml => ml.lessonId === cp.lessonId))
        .reduce((acc, cp) => acc + (cp.totalTimeMinutes || 0), 0)

      const moduleProgressPercentage = moduleLessons.length > 0 
        ? Math.round((completedModuleLessons / moduleLessons.length) * 100) 
        : 0

      return {
        id: cm.module.id,
        title: cm.module.title,
        description: cm.module.description,
        orderIndex: cm.module.orderIndex,
        totalLessons: moduleLessons.length,
        completedLessons: completedModuleLessons,
        progressPercentage: moduleProgressPercentage,
        timeSpentMinutes: moduleTimeMinutes,
        estimatedTimeMinutes: cm.module.estimatedTimeMinutes || 0,
        isCompleted: moduleProgressPercentage === 100
      }
    })

    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    // Calcular métricas adicionales
    const completedModules = modulesProgress.filter(m => m.isCompleted).length
    const moduleCompletionRate = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0
    
    const averageTimePerLesson = completedLessons > 0
      ? Math.round(totalTimeMinutes / completedLessons)
      : 0

    // Encontrar próxima lección pendiente
    let nextLesson = null
    for (const cm of course.courseModules.sort((a, b) => a.module.orderIndex - b.module.orderIndex)) {
      for (const ml of cm.module.moduleLessons.sort((a, b) => a.orderIndex - b.orderIndex)) {
        const lessonProg = lessonProgress.find(lp => lp.lessonId === ml.lessonId)
        if (!lessonProg || !isLessonCompletedStatus(lessonProg.status)) {
          nextLesson = {
            id: ml.lesson.id,
            title: ml.lesson.title,
            moduleTitle: cm.module.title,
            orderIndex: ml.orderIndex
          }
          break
        }
      }
      if (nextLesson) break
    }

    // La matrícula no guarda una fecha de última actividad, así que la
    // derivamos del progreso más reciente entre las lecciones del curso.
    // Antes se leía un campo inexistente y el cálculo caía siempre en la
    // fecha de inscripción, mostrando "sin actividad" para alumnos activos.
    const courseLessonIds = new Set(
      course.courseModules.flatMap(cm => cm.module.moduleLessons.map(ml => ml.lessonId))
    )
    const lastActivityAt = lessonProgress
      .filter(lp => courseLessonIds.has(lp.lessonId))
      .reduce<Date | null>((latest, lp) => {
        const updatedAt = lp.updatedAt ? new Date(lp.updatedAt) : null
        if (!updatedAt) return latest
        return !latest || updatedAt > latest ? updatedAt : latest
      }, null)

    const lastActivityDate = lastActivityAt || enrollment.enrolledAt
    const daysSinceLastActivity = lastActivityDate
      ? Math.floor((new Date().getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      competency: course.competency?.name || 'General',
      academicGrade: course.academicGrade,
      totalModules,
      completedModules,
      moduleCompletionRate,
      totalLessons,
      completedLessons,
      progressPercentage,
      timeSpentMinutes: totalTimeMinutes,
      averageTimePerLesson,
      estimatedTimeMinutes: (course.durationHours || 0) * 60,
      modules: modulesProgress.sort((a, b) => a.orderIndex - b.orderIndex),
      enrolledAt: enrollment.enrolledAt,
      lastActivityAt,
      daysSinceLastActivity,
      nextLesson
    }
  })

  return coursesProgress
}

export async function getStudentCompetenciesProgress(userId: string) {

  // Obtener información del estudiante para comparación con grupo
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { schoolId: true }
  })

  // Determinar si el estudiante es tipo ICFES (basado en si está inscrito en cursos ICFES)
  const courseEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId,
      isActive: true
    },
    include: {
      course: {
        select: {
          isIcfesCourse: true
        }
      }
    }
  })

  const isIcfesStudent = courseEnrollments.some(enrollment => enrollment.course.isIcfesCourse)

  // Competencias ICFES (nombres exactos)
  const ICFES_COMPETENCY_NAMES = [
    'lectura_critica',
    'razonamiento_cuantitativo',
    'competencias_ciudadanas',
    'comunicacion_escrita',
    'ingles',
    // Aliases para compatibilidad
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
    'sociales_y_ciudadanas'
  ]

  // Obtener competencias según el tipo de estudiante
  let competencies
  if (isIcfesStudent) {
    // Si es estudiante ICFES, solo mostrar competencias ICFES
    competencies = await prisma.area.findMany({
      where: {
        OR: [
          { name: { in: ICFES_COMPETENCY_NAMES } },
          { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
        ],
        name: { not: 'otros' }
      },
      orderBy: { name: 'asc' }
    })
  } else {
    // Si no es ICFES, mostrar todas excepto ICFES y "otros"
    competencies = await prisma.area.findMany({
      where: {
        AND: [
          { name: { not: 'otros' } },
          { name: { notIn: ICFES_COMPETENCY_NAMES } },
          { displayName: { notIn: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
        ]
      },
      orderBy: { name: 'asc' }
    })
  }

  // Obtener IDs de competencias para filtrar lecciones y contenido
  const competencyIds = competencies.map(c => c.id)

  // Obtener progreso de lecciones del estudiante
  const lessonProgress = await prisma.studentLessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          moduleLessons: {
            include: {
              module: {
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

  // Filtrar lecciones que pertenecen a las competencias relevantes
  const filteredLessonProgress = lessonProgress.filter((lp: any) => 
    lp.lesson.moduleLessons?.some((ml: any) => competencyIds.includes(ml.module.competencyId))
  )

  // Obtener progreso de contenido del estudiante (usando studentLessonProgress)
  const contentProgress = await prisma.studentLessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          moduleLessons: {
            include: {
              module: {
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

  // Total real de lecciones publicadas por competencia dentro de los cursos
  // en los que el estudiante está matriculado.
  //
  // Antes el denominador eran únicamente las lecciones que ya tenían registro
  // de progreso, así que una sola lección abierta y terminada daba 100% en el
  // área completa.
  const enrolledModuleLessons = await prisma.moduleLesson.findMany({
    where: {
      module: {
        competencyId: { in: competencyIds },
        courseModules: {
          some: {
            course: {
              courseEnrollments: { some: { userId, isActive: true } },
            },
          },
        },
      },
      lesson: { isPublished: true },
    },
    select: {
      lessonId: true,
      module: { select: { competencyId: true } },
    },
  })

  const lessonIdsByCompetency = new Map<string, Set<string>>()
  for (const moduleLesson of enrolledModuleLessons) {
    const competencyId = moduleLesson.module.competencyId
    if (!competencyId) continue
    if (!lessonIdsByCompetency.has(competencyId)) {
      lessonIdsByCompetency.set(competencyId, new Set())
    }
    lessonIdsByCompetency.get(competencyId)!.add(moduleLesson.lessonId)
  }

  // Filtrar contenido que pertenece a las competencias relevantes
  const filteredContentProgress = contentProgress.filter((cp: any) => 
    cp.lesson.moduleLessons?.some((ml: any) => competencyIds.includes(ml.module.competencyId))
  )

  // Obtener resultados de exámenes por competencia
  // Si es estudiante ICFES, filtrar solo exámenes de competencias ICFES
  let examResultsWhere: any = { userId }
  
  if (isIcfesStudent) {
    // Obtener IDs de competencias ICFES para filtrar exámenes
    const icfesCompetencyIds = competencies.map(c => c.id)
    examResultsWhere.exam = {
      competencyId: { in: icfesCompetencyIds }
    }
  } else {
    // Si no es ICFES, excluir exámenes de competencias ICFES
    const icfesCompetencyIds = await prisma.area.findMany({
      where: {
        OR: [
          { name: { in: ICFES_COMPETENCY_NAMES } },
          { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
        ]
      },
      select: { id: true }
    }).then(comps => comps.map(c => c.id))
    
    const icfesIds = await icfesCompetencyIds
    examResultsWhere.exam = {
      competencyId: { notIn: icfesIds }
    }
  }

  const examResults = await prisma.examResult.findMany({
    where: examResultsWhere,
    include: {
      exam: {
        include: {
          competency: true
        }
      }
    }
  })

  // Procesar datos por competencia (async para calcular promedios del grupo)
  const competenciesProgress = await Promise.all(competencies.map(async (competency) => {
    // Lecciones de esta competencia (usar filteredLessonProgress)
    const competencyLessons = filteredLessonProgress.filter((lp: any) => 
      lp.lesson.moduleLessons?.some((ml: any) => ml.module.competencyId === competency.id)
    )

    // Contenido de esta competencia (usar filteredContentProgress)
    const competencyContent = filteredContentProgress.filter((cp: any) => 
      cp.lesson.moduleLessons?.some((ml: any) => ml.module.competencyId === competency.id)
    )

    // Exámenes de esta competencia
    const competencyExams = examResults.filter(er => 
      er.exam.competencyId === competency.id
    )

    // Calcular estadísticas sobre TODAS las lecciones del área, no solo las
    // que ya tienen registro de progreso
    const competencyLessonIds = lessonIdsByCompetency.get(competency.id) ?? new Set<string>()
    const totalLessons = competencyLessonIds.size
    const trackedLessons = competencyLessons.filter((lp: any) =>
      competencyLessonIds.has(lp.lessonId)
    )
    const completedLessons = trackedLessons.filter((lp: any) =>
      isLessonCompletedStatus(lp.status)
    ).length
    const inProgressLessons = trackedLessons.filter((lp: any) =>
      isLessonInProgressStatus(lp.status)
    ).length

    const totalTimeMinutes = competencyContent.reduce((acc: number, cp: any) => 
      acc + (cp.totalTimeMinutes || 0), 0
    )

    // Solo considerar exámenes completados para estadísticas
    const completedExams = competencyExams.filter(er => er.completedAt !== null)
    const totalExams = completedExams.length
    const passedExams = completedExams.filter(er => er.isPassed).length
    
    // Calcular promedio de puntajes (0-100%)
    const averageScore = totalExams > 0 
      ? Math.round(completedExams.reduce((acc, er) => {
          const percentage = er.score
          return acc + percentage
        }, 0) / totalExams)
      : 0

    const progressPercentage = toProgressPercentage(completedLessons, totalLessons)

    // Calcular promedio del grupo (estudiantes de la misma escuela en la misma competencia)
    let groupAverageScore = 0
    let comparisonStatus: 'above' | 'below' | 'equal' | 'no_data' = 'no_data'
    
    if (student?.schoolId && totalExams > 0) {
      try {
        const groupExamResults = await prisma.examResult.findMany({
          where: {
            exam: {
              competencyId: competency.id
            },
            user: {
              schoolId: student.schoolId,
              role: 'student'
            },
            completedAt: { not: null }
          },
          select: {
            score: true,
            totalQuestions: true
          }
        })

        if (groupExamResults.length > 0) {
          const groupAverage = groupExamResults.reduce((acc, er) => {
            const percentage = er.score
            return acc + percentage
          }, 0) / groupExamResults.length
          
          groupAverageScore = Math.round(groupAverage)
          
          if (averageScore > groupAverageScore) {
            comparisonStatus = 'above'
          } else if (averageScore < groupAverageScore) {
            comparisonStatus = 'below'
          } else {
            comparisonStatus = 'equal'
          }
        }
      } catch (error) {
        console.error('Error calculating group average:', error)
      }
    }

    // Calcular evolución temporal (comparar exámenes recientes vs antiguos)
    let trend: 'improving' | 'declining' | 'stable' | 'no_data' = 'no_data'
    if (completedExams.length >= 2) {
      const sortedExams = [...completedExams].sort((a, b) => 
        new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
      )
      
      const recentExams = sortedExams.slice(-Math.min(3, Math.floor(sortedExams.length / 2)))
      const olderExams = sortedExams.slice(0, Math.floor(sortedExams.length / 2))
      
      if (recentExams.length > 0 && olderExams.length > 0) {
        const recentAvg = recentExams.reduce((acc, er) => {
          const percentage = er.score
          return acc + percentage
        }, 0) / recentExams.length
        
        const olderAvg = olderExams.reduce((acc, er) => {
          const percentage = er.score
          return acc + percentage
        }, 0) / olderExams.length
        
        const diff = recentAvg - olderAvg
        if (diff > 5) {
          trend = 'improving'
        } else if (diff < -5) {
          trend = 'declining'
        } else {
          trend = 'stable'
        }
      }
    }

    // Última actividad
    const lastActivity = [
      ...competencyLessons.map((lp: any) => lp.updatedAt),
      ...competencyContent.map((cp: any) => cp.updatedAt),
      ...competencyExams.map(er => er.completedAt)
    ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

    return {
      id: competency.id,
      name: competency.name,
      displayName: competency.displayName,
      description: competency.description,
      color: competency.colorHex,
      icon: competency.iconName,
      totalLessons,
      completedLessons,
      inProgressLessons,
      progressPercentage,
      totalTimeMinutes,
      totalExams,
      passedExams,
      averageScore,
      lastActivityAt: lastActivity,
      groupAverageScore,
      comparisonStatus,
      trend,
      stats: {
        lessonsCompleted: completedLessons,
        lessonsInProgress: inProgressLessons,
        timeSpent: totalTimeMinutes,
        examsTaken: totalExams,
        examsPassed: passedExams,
        averageScore
      }
    }
  }))

  // Ordenar por fortalezas/debilidades (por promedio de puntajes, de mayor a menor)
  const sortedCompetencies = competenciesProgress.sort((a, b) => b.averageScore - a.averageScore)

  return sortedCompetencies
}
