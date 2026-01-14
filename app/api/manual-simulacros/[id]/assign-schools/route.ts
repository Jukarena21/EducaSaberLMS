import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignSchema = z.object({
  schoolIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un colegio'),
  academicGrade: z.string().min(1, 'El año escolar es requerido'),
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

    // Verificar que los colegios existen
    const schools = await prisma.school.findMany({
      where: {
        id: { in: validatedData.schoolIds }
      },
      select: { id: true }
    })

    if (schools.length !== validatedData.schoolIds.length) {
      return NextResponse.json(
        { error: 'Uno o más colegios no fueron encontrados' },
        { status: 404 }
      )
    }

    // Crear asignaciones (usar upsert para evitar duplicados)
    const assignments = await Promise.all(
      validatedData.schoolIds.map(schoolId =>
        prisma.examSchool.upsert({
          where: {
            examId_schoolId_academicGrade: {
              examId: id,
              schoolId,
              academicGrade: validatedData.academicGrade || null
            }
          },
          update: {
            academicGrade: validatedData.academicGrade || null,
            openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
            closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
            isActive: true
          },
          create: {
            examId: id,
            schoolId,
            academicGrade: validatedData.academicGrade || null,
            openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
            closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
            isActive: true
          },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                daneCode: true
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
    console.error('Error assigning schools:', error)
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
    const schoolId = searchParams.get('schoolId')
    const academicGrade = searchParams.get('academicGrade')

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId es requerido' },
        { status: 400 }
      )
    }

    // Eliminar la asignación (con academicGrade si se proporciona)
    await prisma.examSchool.delete({
      where: {
        examId_schoolId_academicGrade: {
          examId: id,
          schoolId,
          academicGrade: academicGrade || null
        }
      }
    })

    return NextResponse.json({ message: 'Asignación eliminada correctamente' })
  } catch (error) {
    console.error('Error removing school assignment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

