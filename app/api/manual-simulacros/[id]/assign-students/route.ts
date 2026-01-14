import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un estudiante'),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignSchema.parse(body)

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Verificar que los usuarios existen y son estudiantes
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds },
        role: 'student'
      },
      select: { id: true }
    })

    if (users.length !== validatedData.userIds.length) {
      return NextResponse.json(
        { error: 'Uno o más estudiantes no fueron encontrados' },
        { status: 404 }
      )
    }

    // Crear asignaciones (usar upsert para evitar duplicados)
    const assignments = await Promise.all(
      validatedData.userIds.map(userId =>
        prisma.examAssignment.upsert({
          where: {
            examId_userId: {
              examId: id,
              userId
            }
          },
          update: {
            openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
            closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
            isActive: true
          },
          create: {
            examId: id,
            userId,
            assignedById: session.user.id,
            openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
            closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                schoolId: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })
      )
    )

    return NextResponse.json(assignments, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error assigning students:', error)
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
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Eliminar la asignación
    await prisma.examAssignment.delete({
      where: {
        examId_userId: {
          examId: id,
          userId
        }
      }
    })

    return NextResponse.json({ message: 'Asignación eliminada correctamente' })
  } catch (error) {
    console.error('Error removing student assignment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

