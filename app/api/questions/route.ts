import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades'

const questionSchema = z.object({
  lessonId: z.string().optional().or(z.literal('')),
  
  // Contenido de la pregunta
  questionText: z.string().min(1, 'El enunciado es requerido'),
  questionImage: z.string().url().optional().or(z.literal('')),
  questionType: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'matching', 'essay']).default('multiple_choice'),

  // Uso de la pregunta dentro del banco
  usage: z.enum(['lesson', 'exam', 'both']).default('lesson'),
  
  // Opciones de respuesta
  optionA: z.string().min(1, 'La opción A es requerida'),
  optionB: z.string().min(1, 'La opción B es requerida'),
  optionC: z.string().min(1, 'La opción C es requerida'),
  optionD: z.string().min(1, 'La opción D es requerida'),
  optionAImage: z.string().url().optional().or(z.literal('')),
  optionBImage: z.string().url().optional().or(z.literal('')),
  optionCImage: z.string().url().optional().or(z.literal('')),
  optionDImage: z.string().url().optional().or(z.literal('')),
  
  correctOption: z.enum(['A', 'B', 'C', 'D'], { message: 'La opción correcta debe ser A, B, C o D' }),
  explanation: z.string().optional(),
  explanationImage: z.string().url().optional().or(z.literal('')),
  
  // Metadatos
  orderIndex: z.number().int().min(0),
  difficultyLevel: z.enum(['facil', 'medio', 'dificil']).default('medio'),
  timeLimit: z.number().int().min(1).optional(),
  year: z.number().min(1).max(11).optional(), // Año escolar (1-11) solo para preguntas ICFES
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only teacher_admin and school_admin can view questions
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const competencyId = searchParams.get('competencyId') || ''
    const difficultyLevel = searchParams.get('difficultyLevel') || ''
    const status = searchParams.get('status') || ''
    const isIcfesCourseParam = searchParams.get('isIcfesCourse')

    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel
    }

    // Construir filtros de lección
    const lessonFilters: any = {}

    // Filter by competencyId if provided
    if (competencyId) {
      lessonFilters.moduleLessons = {
        some: {
          module: {
            courseModules: {
              some: {
                course: {
                  competencyId: competencyId
                }
              }
            }
          }
        }
      }
    }

    // Filtro por tipo ICFES vs Personalizado
    // Las preguntas se consideran ICFES si pertenecen a lecciones que están en módulos de cursos ICFES
    if (isIcfesCourseParam !== null && isIcfesCourseParam !== undefined) {
      const isIcfesCourse = isIcfesCourseParam === 'true' || isIcfesCourseParam === '1'
      
      if (lessonFilters.moduleLessons) {
        // Combinar con filtro de competencia si existe
        lessonFilters.moduleLessons = {
          some: {
            module: {
              courseModules: {
                some: {
                  course: {
                    ...(competencyId ? { competencyId: competencyId } : {}),
                    isIcfesCourse: isIcfesCourse
                  }
                }
              }
            }
          }
        }
      } else {
        lessonFilters.moduleLessons = {
          some: {
            module: {
              courseModules: {
                some: {
                  course: {
                    isIcfesCourse: isIcfesCourse
                  }
                }
              }
            }
          }
        }
      }
    }

    // Aplicar filtros de lección si existen
    if (Object.keys(lessonFilters).length > 0) {
      whereClause.lesson = lessonFilters
    }

    const [questions, total] = await Promise.all([
      prisma.lessonQuestion.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              moduleLessons: {
                select: {
                  module: {
                    select: {
                      id: true,
                      title: true,
                      courseModules: {
                        select: {
                          course: {
                            select: {
                              id: true,
                              title: true,
                              competency: {
                                select: {
                                  id: true,
                                  name: true,
                                  displayName: true,
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
        },
      }),
      prisma.lessonQuestion.count({ where: whereClause }),
    ])

    // Transform questions to match the expected format
    const transformedQuestions = questions.map(question => {
      // Get the first module and course from moduleLessons
      const firstModuleLesson = (question as any).lesson?.moduleLessons?.[0];
      const module = firstModuleLesson?.module;
      const firstCourseModule = module?.courseModules?.[0];
      const course = firstCourseModule?.course;
      const competency = course?.competency;
      
      // Convertir academicGrade a year si existe (usar any temporalmente hasta que se regenere Prisma)
      const questionWithGrade = question as any;
      const lessonWithGrade = (question as any).lesson as any;
      let year: number | undefined = undefined;
      if (questionWithGrade.academicGrade) {
        year = academicGradeToYear(questionWithGrade.academicGrade) || undefined;
      } else if (lessonWithGrade?.academicGrade) {
        year = academicGradeToYear(lessonWithGrade.academicGrade) || undefined;
      }
      
      return {
        id: question.id,
        lessonId: question.lessonId,
        
        // Contenido de la pregunta
        questionText: question.questionText,
        questionImage: question.questionImage,
        questionType: question.questionType,
        
        // Opciones de respuesta
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        optionAImage: question.optionAImage,
        optionBImage: question.optionBImage,
        optionCImage: question.optionCImage,
        optionDImage: question.optionDImage,
        
        correctOption: question.correctOption,
        explanation: question.explanation,
        explanationImage: question.explanationImage,
        
        // Metadatos
        orderIndex: question.orderIndex,
        difficultyLevel: question.difficultyLevel,
        timeLimit: question.timeLimit,
        academicGrade: questionWithGrade.academicGrade,
        year: year,
        
        lesson: (question as any).lesson ? {
          id: (question as any).lesson.id,
          title: (question as any).lesson.title,
          academicGrade: lessonWithGrade?.academicGrade,
          year: year,
          modules: module ? [{
            moduleId: module.id,
            moduleTitle: module.title,
            orderIndex: 0, // orderIndex no está disponible en el select actual
            course: course ? {
              id: course.id,
              title: course.title,
              competency: competency ? {
                id: competency.id,
                name: competency.name
              } : undefined
            } : undefined,
            competency: competency ? {
              id: competency.id,
              name: competency.name
            } : undefined
          }] : []
        } : null,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      };
    })

    return NextResponse.json({
      questions: transformedQuestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only teacher admins can create questions
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los profesores administradores pueden crear preguntas.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = questionSchema.parse(body)

    let lessonContext: any = null
    if (validatedData.lessonId) {
      lessonContext = await prisma.lesson.findUnique({
        where: { id: validatedData.lessonId },
        include: {
          moduleLessons: {
            include: {
              module: {
                include: {
                  courseModules: {
                    include: {
                      course: {
                        select: {
                          id: true,
                          isIcfesCourse: true
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
      if (!lessonContext) {
        return NextResponse.json({ error: 'La lección especificada no existe' }, { status: 400 })
      }
    }

    const belongsToIcfesCourse = lessonContext?.moduleLessons?.some((ml: any) =>
      ml.module.courseModules.some((cm: any) => cm.course?.isIcfesCourse)
    )

    if (belongsToIcfesCourse && validatedData.questionType !== 'multiple_choice') {
      return NextResponse.json(
        { error: 'Las lecciones ICFES solo permiten preguntas de opción múltiple' },
        { status: 400 }
      )
    }

    // Generate unique orderIndex automatically
    const existingQuestions = await prisma.lessonQuestion.count({
      where: { lessonId: validatedData.lessonId }
    });
    const autoOrderIndex = existingQuestions + 1;

    // Convertir year a academicGrade si se proporciona
    let academicGrade: string | null = null;
    if (validatedData.year) {
      academicGrade = yearToAcademicGrade(validatedData.year) || null;
    }

    // Create question
    const question = await prisma.lessonQuestion.create({
      data: {
        lessonId: validatedData.lessonId || null,
        
        // Contenido de la pregunta
        questionText: validatedData.questionText,
        questionImage: validatedData.questionImage || null,
        questionType: validatedData.questionType,
        usage: validatedData.usage,
        
        // Opciones de respuesta
        optionA: validatedData.optionA,
        optionB: validatedData.optionB,
        optionC: validatedData.optionC,
        optionD: validatedData.optionD,
        optionAImage: validatedData.optionAImage || null,
        optionBImage: validatedData.optionBImage || null,
        optionCImage: validatedData.optionCImage || null,
        optionDImage: validatedData.optionDImage || null,
        
        correctOption: validatedData.correctOption,
        explanation: validatedData.explanation,
        explanationImage: validatedData.explanationImage || null,
        
        // Metadatos
        orderIndex: autoOrderIndex, // Generado automáticamente
        difficultyLevel: validatedData.difficultyLevel,
        timeLimit: validatedData.timeLimit || null,
        // @ts-ignore - academicGrade será agregado después de regenerar Prisma
        academicGrade: academicGrade,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleLessons: {
              select: {
                module: {
                  select: {
                    id: true,
                    title: true,
                    courseModules: {
                      select: {
                        course: {
                          select: {
                            id: true,
                            title: true,
                            competency: {
                              select: {
                                id: true,
                                name: true,
                                displayName: true,
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 