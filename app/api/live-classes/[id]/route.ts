import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'
import { NotificationService } from '@/lib/notificationService'

// Esquema de validación para actualizar una clase en vivo
const updateLiveClassSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  description: z.string().optional(),
  meetingUrl: z.string().url('El enlace de la reunión debe ser una URL válida').optional(),
  provider: z.enum(['zoom', 'meet', 'teams', 'webex', 'other']).optional(),
  startDateTime: z.string().transform((str) => new Date(str)).optional(),
  endDateTime: z.string().transform((str) => new Date(str)).optional(),
  academicGrade: z.string().optional().nullable(),
  competencyId: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  schoolId: z.string().optional().nullable(),
})

// GET /api/live-classes/[id] - Obtener una clase específica
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

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true,
            colorHex: true
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
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        invitations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!liveClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    // Si es estudiante, solo puede ver si está invitado
    if (session.user.role === 'student') {
      const isInvited = liveClass.invitations.some(inv => inv.userId === session.user.id)
      if (!isInvited) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else if (session.user.role === 'school_admin') {
      // School admin solo puede ver clases de su colegio
      if (liveClass.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    return NextResponse.json(liveClass)
  } catch (error) {
    console.error('Error fetching live class:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/live-classes/[id] - Actualizar clase en vivo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateLiveClassSchema.parse(body)

    // Verificar que la clase existe
    const existingClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        invitations: true
      }
    })

    if (!existingClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar permisos de edición
    if (session.user.role === 'school_admin') {
      if (existingClass.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      // School admin no puede cambiar el colegio
      if (data.schoolId && data.schoolId !== existingClass.schoolId) {
        return NextResponse.json(
          { error: 'No puedes cambiar el colegio de la clase' },
          { status: 403 }
        )
      }
    }

    // Validaciones de fechas
    const startDateTime = data.startDateTime || existingClass.startDateTime
    const endDateTime = data.endDateTime !== undefined ? data.endDateTime : existingClass.endDateTime

    if (startDateTime < new Date()) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser futura' },
        { status: 400 }
      )
    }

    if (endDateTime && endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la de inicio' },
        { status: 400 }
      )
    }

    // Actualizar la clase
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl
    if (data.provider !== undefined) updateData.provider = data.provider
    if (data.startDateTime !== undefined) updateData.startDateTime = data.startDateTime
    if (data.endDateTime !== undefined) updateData.endDateTime = data.endDateTime
    if (data.academicGrade !== undefined) updateData.academicGrade = data.academicGrade
    if (data.competencyId !== undefined) updateData.competencyId = data.competencyId
    if (data.moduleId !== undefined) updateData.moduleId = data.moduleId
    if (data.lessonId !== undefined) updateData.lessonId = data.lessonId
    if (data.schoolId !== undefined) updateData.schoolId = data.schoolId

    const updatedClass = await prisma.liveClass.update({
      where: { id },
      data: updateData,
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
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        invitations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Si cambió el colegio, actualizar invitaciones
    if (data.schoolId !== undefined && data.schoolId !== existingClass.schoolId) {
      // Eliminar invitaciones antiguas
      await prisma.liveClassInvitation.deleteMany({
        where: { liveClassId: id }
      })

      // Crear nuevas invitaciones si hay un colegio
      if (data.schoolId) {
        const usersToInvite = await prisma.user.findMany({
          where: {
            schoolId: data.schoolId,
            role: {
              in: ['student', 'school_admin']
            }
          },
          select: {
            id: true
          }
        })

        if (usersToInvite.length > 0) {
          await prisma.liveClassInvitation.createMany({
            data: usersToInvite.map(user => ({
              liveClassId: id,
              userId: user.id
            })),
            skipDuplicates: true
          })

          // Enviar notificaciones a los nuevos usuarios invitados
          await Promise.all(
            usersToInvite.map(user =>
              NotificationService.createLiveClassNotification(
                user.id,
                updatedClass.title,
                updatedClass.id,
                updatedClass.startDateTime,
                updatedClass.meetingUrl
              )
            )
          )
        }
      }
    }

    // Si cambió la fecha, reenviar notificaciones a todos los invitados
    const dateChanged = data.startDateTime && 
      data.startDateTime.getTime() !== existingClass.startDateTime.getTime()
    
    if (dateChanged) {
      const allInvitedUsers = await prisma.liveClassInvitation.findMany({
        where: { liveClassId: id },
        select: { userId: true }
      })

      await Promise.all(
        allInvitedUsers.map(invitation =>
          NotificationService.createLiveClassNotification(
            invitation.userId,
            updatedClass.title,
            updatedClass.id,
            updatedClass.startDateTime,
            updatedClass.meetingUrl
          )
        )
      )
    }

    return NextResponse.json(updatedClass)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating live class:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/live-classes/[id] - Eliminar clase en vivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params

    // Verificar que la clase existe
    const existingClass = await prisma.liveClass.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar permisos de eliminación
    if (session.user.role === 'school_admin') {
      if (existingClass.schoolId !== session.user.schoolId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Eliminar la clase (las invitaciones se eliminan en cascada)
    await prisma.liveClass.delete({
      where: { id }
    })

    // TODO: Enviar notificación de cancelación (opcional, se implementará en FASE 5)

    return NextResponse.json({ message: 'Clase eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting live class:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

