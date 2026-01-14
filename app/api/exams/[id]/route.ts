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
  isIcfesExam: z.boolean().optional(),
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
            competency: true,
            courseSchools: {
              select: { schoolId: true }
            }
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

    // Validación para school_admin: verificar que el examen pertenezca a su colegio
    if (session.user.role === 'school_admin' && session.user.schoolId) {
      if (exam.courseId && exam.course) {
        const courseSchoolIds = exam.course.courseSchools.map(cs => cs.schoolId)
        if (!courseSchoolIds.includes(session.user.schoolId)) {
          return NextResponse.json(
            { error: 'No tienes permisos para ver este examen' },
            { status: 403 }
          )
        }
      } else {
        // Exámenes sin curso no pueden ser vistos por school_admin
        return NextResponse.json(
          { error: 'No tienes permisos para ver este examen' },
          { status: 403 }
        )
      }
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
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params
    const body = await request.json()
    console.log('🔍 [DEBUG] Datos recibidos para actualizar examen:', body)
    const validatedData = examUpdateSchema.parse(body)
    console.log('🔍 [DEBUG] Datos validados (update):', validatedData)

    // Verificar que el examen existe
    const existingExam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            courseSchools: {
              select: { schoolId: true }
            }
          }
        }
      }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Validación para school_admin: verificar que el examen pertenezca a su colegio
    if (gate.session.user.role === 'school_admin' && gate.session.user.schoolId) {
      if (!existingExam.courseId) {
        // Exámenes sin curso no pueden ser editados por school_admin
        return NextResponse.json(
          { error: 'Solo puedes editar exámenes asociados a cursos de tu colegio' },
          { status: 403 }
        )
      }

      if (existingExam.course) {
        const courseSchoolIds = existingExam.course.courseSchools.map(cs => cs.schoolId)
        if (!courseSchoolIds.includes(gate.session.user.schoolId)) {
          return NextResponse.json(
            { error: 'Solo puedes editar exámenes de tu colegio' },
            { status: 403 }
          )
        }
      }

      // Validar que si cambia courseId, el nuevo curso pertenezca a su colegio
      if (validatedData.courseId !== undefined && validatedData.courseId !== '' && validatedData.courseId !== existingExam.courseId) {
        const newCourse = await prisma.course.findUnique({
          where: { id: validatedData.courseId },
          include: {
            courseSchools: { select: { schoolId: true } }
          }
        })

        if (!newCourse) {
          return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
        }

        const newCourseSchoolIds = newCourse.courseSchools.map(cs => cs.schoolId)
        if (!newCourseSchoolIds.includes(gate.session.user.schoolId)) {
          return NextResponse.json(
            { error: 'Solo puedes asignar exámenes a cursos de tu colegio' },
            { status: 403 }
          )
        }
      }
    }

    const nextCourseId =
      validatedData.courseId !== undefined
        ? (validatedData.courseId !== '' ? validatedData.courseId : null)
        : existingExam.courseId

    const nextExamType = validatedData.examType ?? existingExam.examType

    let nextIsIcfesExam =
      validatedData.isIcfesExam !== undefined ? validatedData.isIcfesExam : existingExam.isIcfesExam

    if (nextCourseId) {
      const relatedCourse = await prisma.course.findUnique({
        where: { id: nextCourseId },
        select: { isIcfesCourse: true }
      })
      if (relatedCourse?.isIcfesCourse) {
        nextIsIcfesExam = true
      }
    }

    if (nextExamType === 'simulacro_completo' || nextExamType === 'diagnostico') {
      nextIsIcfesExam = true
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

    updateData.isIcfesExam = nextIsIcfesExam

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

    // Enviar notificaciones según cambios en el examen
    try {
      const now = new Date()
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días por defecto
      
      // Detectar cambios importantes
      const wasClosed = existingExam.closeDate && existingExam.closeDate > now
      const isNowClosed = exam.closeDate && exam.closeDate <= now && (!existingExam.closeDate || existingExam.closeDate > now)
      const wasOpen = !existingExam.openDate || existingExam.openDate <= now
      const isNowOpen = !exam.openDate || exam.openDate <= now
      const openDateChanged = exam.openDate?.getTime() !== existingExam.openDate?.getTime()
      const closeDateChanged = exam.closeDate?.getTime() !== existingExam.closeDate?.getTime()
      
      let targetUserIds: string[] = []

      if (exam.courseId) {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: { courseId: exam.courseId, isActive: true },
          select: { userId: true }
        })
        targetUserIds = enrollments.map(e => e.userId)
      }

      // Si no hay courseId o no hay inscritos, intentar por grado académico (a través de cursos)
      if (targetUserIds.length === 0 && exam.academicGrade) {
        const coursesWithGrade = await prisma.course.findMany({
          where: { academicGrade: exam.academicGrade },
          select: { id: true }
        })
        const courseIds = coursesWithGrade.map(c => c.id)
        if (courseIds.length > 0) {
          const enrollments = await prisma.courseEnrollment.findMany({
            where: { 
              courseId: { in: courseIds },
              isActive: true 
            },
            select: { userId: true }
          })
          targetUserIds = enrollments.map(e => e.userId)
        }
      }

      if (targetUserIds.length === 0) {
        const students = await prisma.user.findMany({
          where: { role: 'student' },
          select: { id: true }
        })
        targetUserIds = students.map(s => s.id)
      }

      if (targetUserIds.length > 0 && exam.isPublished) {
        // Notificar cierre de examen
        if (isNowClosed || (closeDateChanged && exam.closeDate && exam.closeDate <= now)) {
          const closedNotifications = targetUserIds.map(userId => ({
            userId,
            type: 'exam_closed',
            title: 'Examen Cerrado',
            message: `El examen "${exam.title}" ha sido cerrado. Ya no está disponible para presentar.`,
            actionUrl: `/estudiante/examen/${exam.id}`,
            expiresAt: expiresAt,
            metadata: JSON.stringify({ examId: exam.id, examType: exam.examType, closeDate: exam.closeDate?.toISOString() }),
          }))
          await prisma.notification.createMany({ data: closedNotifications })

          // Notificar a school_admin que el examen se cerró
          const { AdminNotificationService } = await import('@/lib/adminNotificationService');
          await AdminNotificationService.notifyExamClosed(
            exam.id,
            exam.title,
            exam.courseId,
            exam.academicGrade
          );
        }
        
        // Notificar programación de examen (si openDate cambió y está en el futuro)
        if (openDateChanged && exam.openDate && exam.openDate > now) {
          const scheduledNotifications = targetUserIds.map(userId => ({
            userId,
            type: 'exam_scheduled',
            title: 'Examen Programado',
            message: `El examen "${exam.title}" está programado para el ${exam.openDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            actionUrl: `/estudiante/examen/${exam.id}`,
            expiresAt: exam.openDate,
            metadata: JSON.stringify({ examId: exam.id, examType: exam.examType, openDate: exam.openDate.toISOString() }),
          }))
          await prisma.notification.createMany({ data: scheduledNotifications })
        }
        
        // Notificar disponibilidad (si pasa a estar abierto)
        if (!wasOpen && isNowOpen) {
          const availableNotifications = targetUserIds.map(userId => ({
            userId,
            type: 'exam_available',
            title: 'Examen Disponible',
            message: `El examen "${exam.title}" está ahora disponible para presentar.`,
            actionUrl: `/estudiante/examen/${exam.id}`,
            expiresAt: exam.closeDate || expiresAt,
            metadata: JSON.stringify({ examId: exam.id, examType: exam.examType }),
          }))
          await prisma.notification.createMany({ data: availableNotifications })
        }
      }
    } catch (notifyErr) {
      console.error('Error broadcasting exam notifications (update):', notifyErr)
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
        examResults: true,
        course: {
          include: {
            courseSchools: {
              select: { schoolId: true }
            }
          }
        }
      }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Validación para school_admin: verificar que el examen pertenezca a su colegio
    if (session.user.role === 'school_admin' && session.user.schoolId) {
      if (!existingExam.courseId) {
        return NextResponse.json(
          { error: 'Solo puedes eliminar exámenes asociados a cursos de tu colegio' },
          { status: 403 }
        )
      }

      if (existingExam.course) {
        const courseSchoolIds = existingExam.course.courseSchools.map(cs => cs.schoolId)
        if (!courseSchoolIds.includes(session.user.schoolId)) {
          return NextResponse.json(
            { error: 'Solo puedes eliminar exámenes de tu colegio' },
            { status: 403 }
          )
        }
      }
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
