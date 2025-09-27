import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Esquema de validación para crear un examen
const examSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  examType: z.enum(['simulacro_completo', 'por_competencia', 'por_modulo', 'personalizado', 'diagnostico']),
  courseId: z.string().optional(),
  competencyId: z.string().optional(),
  academicGrade: z.string().optional(),
  timeLimitMinutes: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).default(70),
  difficultyLevel: z.enum(['facil', 'intermedio', 'dificil', 'variable']).default('intermedio'),
  isAdaptive: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  includedModules: z.array(z.string()).optional(),
  questionsPerModule: z.number().min(1).default(5),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const examType = searchParams.get('examType')
    const competencyId = searchParams.get('competencyId')
    const courseId = searchParams.get('courseId')
    const difficultyLevel = searchParams.get('difficultyLevel')
    const isPublished = searchParams.get('isPublished')
    const createdById = searchParams.get('createdById')
    const openDateFrom = searchParams.get('openDateFrom')
    const openDateTo = searchParams.get('openDateTo')
    const closeDateFrom = searchParams.get('closeDateFrom')
    const closeDateTo = searchParams.get('closeDateTo')

    // Construir filtros
    const where: any = {}
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    if (examType) {
      where.examType = examType
    }
    
    if (competencyId) {
      where.competencyId = competencyId
    }
    
    if (courseId) {
      where.courseId = courseId
    }
    
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel
    }
    
    if (isPublished !== null) {
      where.isPublished = isPublished === 'true'
    }
    
    if (createdById) {
      where.createdById = createdById
    }
    
    if (openDateFrom || openDateTo) {
      where.openDate = {}
      if (openDateFrom) {
        where.openDate.gte = new Date(openDateFrom)
      }
      if (openDateTo) {
        where.openDate.lte = new Date(openDateTo)
      }
    }
    
    if (closeDateFrom || closeDateTo) {
      where.closeDate = {}
      if (closeDateFrom) {
        where.closeDate.gte = new Date(closeDateFrom)
      }
      if (closeDateTo) {
        where.closeDate.lte = new Date(closeDateTo)
      }
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: {
          include: {
            competency: true
          }
        },
        competency: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        examQuestions: {
          include: {
            lesson: {
              include: {
                moduleLessons: {
                  include: {
                    module: {
                      include: {
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
                }
              }
            }
          }
        },
        examResults: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformar los datos para incluir includedModules como array
    const transformedExams = exams.map(exam => ({
      ...exam,
      includedModules: exam.includedModules ? JSON.parse(exam.includedModules) : [],
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
      openDate: exam.openDate?.toISOString(),
      closeDate: exam.closeDate?.toISOString(),
      examQuestions: exam.examQuestions.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString()
      })),
      examResults: exam.examResults.map(r => ({
        ...r,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt?.toISOString(),
        createdAt: r.createdAt.toISOString()
      }))
    }))

    return NextResponse.json(transformedExams)
  } catch (error) {
    console.error('Error al obtener exámenes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔍 [DEBUG] Datos recibidos para crear examen:', body)
    const validatedData = examSchema.parse(body)
    console.log('🔍 [DEBUG] Datos validados:', validatedData)

    // Preparar datos para la creación
    const examData = {
      title: validatedData.title,
      description: validatedData.description,
      examType: validatedData.examType,
      courseId: validatedData.courseId && validatedData.courseId !== '' ? validatedData.courseId : null,
      competencyId: validatedData.competencyId && validatedData.competencyId !== '' ? validatedData.competencyId : null,
      academicGrade: validatedData.academicGrade && validatedData.academicGrade !== '' ? validatedData.academicGrade : null,
      timeLimitMinutes: validatedData.timeLimitMinutes,
      passingScore: validatedData.passingScore,
      difficultyLevel: validatedData.difficultyLevel,
      isAdaptive: validatedData.isAdaptive,
      isPublished: validatedData.isPublished,
      createdById: session.user.id,
      includedModules: validatedData.includedModules ? JSON.stringify(validatedData.includedModules) : null,
      openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
      closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
      questionsPerModule: validatedData.questionsPerModule,
    }
    console.log('🔍 [DEBUG] Datos finales para crear examen:', examData)

    // Crear el examen
    const exam = await prisma.exam.create({
      data: examData,
      include: {
        course: {
          include: {
            competency: true
          }
        },
        competency: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Enviar notificaciones si el examen ya está publicado y abierto
    try {
      const now = new Date()
      const isOpen = !exam.openDate || exam.openDate <= now
      if (exam.isPublished && isOpen) {
        let targetUserIds: string[] = []

        // Prioridad: estudiantes inscritos en el curso
        if (exam.courseId) {
          const enrollments = await prisma.courseEnrollment.findMany({
            where: { courseId: exam.courseId, isActive: true },
            select: { userId: true }
          })
          targetUserIds = enrollments.map(e => e.userId)
        }

        // Si no hay courseId o no hay inscritos, intentar por grado académico
        if (targetUserIds.length === 0 && exam.academicGrade) {
          const students = await prisma.user.findMany({
            where: { role: 'student', academicGrade: exam.academicGrade },
            select: { id: true }
          })
          targetUserIds = students.map(s => s.id)
        }

        // Fallback: todos los estudiantes
        if (targetUserIds.length === 0) {
          const students = await prisma.user.findMany({
            where: { role: 'student' },
            select: { id: true }
          })
          targetUserIds = students.map(s => s.id)
        }

        if (targetUserIds.length > 0) {
          const notifications = targetUserIds.map(userId => ({
            userId,
            type: 'exam_available',
            title: 'Nuevo Examen Disponible',
            message: `El examen "${exam.title}" está disponible para presentar.`,
            actionUrl: `/estudiante/examen/${exam.id}`,
            metadata: JSON.stringify({ examId: exam.id, examType: exam.examType }),
          }))
          await prisma.notification.createMany({ data: notifications })
        }
      }
    } catch (notifyErr) {
      console.error('Error broadcasting exam available notification:', notifyErr)
    }

    // Transformar los datos
    const transformedExam = {
      ...exam,
      includedModules: exam.includedModules ? JSON.parse(exam.includedModules) : [],
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
      openDate: exam.openDate?.toISOString(),
      closeDate: exam.closeDate?.toISOString(),
    }

    return NextResponse.json(transformedExam, { status: 201 })
  } catch (error) {
    console.error('Error al crear examen:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
