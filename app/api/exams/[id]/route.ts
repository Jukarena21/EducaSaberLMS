import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Esquema de validación para actualizar un examen
const examUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  examType: z.enum(['simulacro_completo', 'por_competencia', 'por_modulo', 'personalizado', 'diagnostico']).optional(),
  courseId: z.string().optional(),
  competencyId: z.string().optional(),
  academicGrade: z.string().optional(),
  timeLimitMinutes: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  difficultyLevel: z.enum(['facil', 'intermedio', 'dificil', 'variable']).optional(),
  isAdaptive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  includedModules: z.array(z.string()).optional(),
  questionsPerModule: z.number().min(1).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
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
          },
          orderBy: {
            orderIndex: 'asc'
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
          },
          orderBy: {
            completedAt: 'desc'
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Transformar los datos
    const transformedExam = {
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
    }

    return NextResponse.json(transformedExam)
  } catch (error) {
    console.error('Error al obtener examen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params
    const body = await request.json()
    console.log('🔍 [DEBUG] Datos recibidos para actualizar examen:', body)
    const validatedData = examUpdateSchema.parse(body)
    console.log('🔍 [DEBUG] Datos validados (update):', validatedData)

    // Verificar que el examen existe
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Preparar datos normalizados para la actualización
    const updateData: any = {
      ...(validatedData.title !== undefined ? { title: validatedData.title } : {}),
      ...(validatedData.description !== undefined ? { description: validatedData.description } : {}),
      ...(validatedData.examType !== undefined ? { examType: validatedData.examType } : {}),
      ...(validatedData.courseId !== undefined
        ? { courseId: validatedData.courseId !== '' ? validatedData.courseId : null }
        : {}),
      ...(validatedData.competencyId !== undefined
        ? { competencyId: validatedData.competencyId !== '' ? validatedData.competencyId : null }
        : {}),
      ...(validatedData.academicGrade !== undefined
        ? { academicGrade: validatedData.academicGrade !== '' ? validatedData.academicGrade : null }
        : {}),
      ...(validatedData.timeLimitMinutes !== undefined ? { timeLimitMinutes: validatedData.timeLimitMinutes } : {}),
      ...(validatedData.passingScore !== undefined ? { passingScore: validatedData.passingScore } : {}),
      ...(validatedData.difficultyLevel !== undefined ? { difficultyLevel: validatedData.difficultyLevel } : {}),
      ...(validatedData.isAdaptive !== undefined ? { isAdaptive: validatedData.isAdaptive } : {}),
      ...(validatedData.isPublished !== undefined ? { isPublished: validatedData.isPublished } : {}),
      ...(validatedData.includedModules !== undefined
        ? { includedModules: validatedData.includedModules ? JSON.stringify(validatedData.includedModules) : null }
        : {}),
      ...(validatedData.openDate !== undefined
        ? { openDate: validatedData.openDate ? new Date(validatedData.openDate) : null }
        : {}),
      ...(validatedData.closeDate !== undefined
        ? { closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null }
        : {}),
      ...(validatedData.questionsPerModule !== undefined ? { questionsPerModule: validatedData.questionsPerModule } : {}),
    }

    console.log('🔍 [DEBUG] Datos finales para actualizar examen:', updateData)

    // Actualizar el examen
    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
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

    // Si el examen pasa a publicado y está abierto, enviar notificaciones
    try {
      const now = new Date()
      const isOpen = !exam.openDate || exam.openDate <= now
      if (exam.isPublished && isOpen) {
        let targetUserIds: string[] = []

        if (exam.courseId) {
          const enrollments = await prisma.courseEnrollment.findMany({
            where: { courseId: exam.courseId, isActive: true },
            select: { userId: true }
          })
          targetUserIds = enrollments.map(e => e.userId)
        }

        if (targetUserIds.length === 0 && exam.academicGrade) {
          const students = await prisma.user.findMany({
            where: { role: 'student', academicGrade: exam.academicGrade },
            select: { id: true }
          })
          targetUserIds = students.map(s => s.id)
        }

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
      console.error('Error broadcasting exam available notification (update):', notifyErr)
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

    return NextResponse.json(transformedExam)
  } catch (error) {
    console.error('Error al actualizar examen:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el examen existe
    const existingExam = await prisma.exam.findUnique({
      where: { id },
      include: {
        examResults: true
      }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Verificar si hay resultados de exámenes
    if (existingExam.examResults.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un examen que ya tiene resultados' },
        { status: 400 }
      )
    }

    // Eliminar el examen (esto también eliminará las preguntas del examen por CASCADE)
    await prisma.exam.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Examen eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar examen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
