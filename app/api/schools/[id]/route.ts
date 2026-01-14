import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schoolSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['school', 'company', 'government_entity', 'other']).optional().default('school'),
  city: z.string().min(1, 'La ciudad es requerida'),
  neighborhood: z.string().min(1, 'El barrio es requerido'),
  address: z.string().optional(),
  daneCode: z.string().optional(),
  institutionType: z.enum(['publica', 'privada', 'otro']),
  academicCalendar: z.enum(['diurno', 'nocturno', 'ambos']),
  totalStudents: z.number().min(0, 'El total de estudiantes debe ser mayor o igual a 0'),
  numberOfCampuses: z.number().min(1, 'El número de sedes debe ser mayor a 0'),
  yearsOfOperation: z.number().min(1, 'Los años de operación deben ser mayor a 0'),
  contactEmail: z.string().email('Email inválido'),
  contactPhone: z.string().min(1, 'El teléfono es requerido'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only teacher admins can see individual schools
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const { id } = params

    const school = await prisma.school.findUnique({
      where: { id },
    })

    if (!school) {
      return NextResponse.json(
        { error: 'Colegio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only teacher admins can update schools
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    // Validate input
    const validatedData = schoolSchema.parse(body)

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id },
    })

    if (!existingSchool) {
      return NextResponse.json(
        { error: 'Colegio no encontrado' },
        { status: 404 }
      )
    }

    // Check if another school with same name and city already exists
    const duplicateSchool = await prisma.school.findFirst({
      where: {
        name: validatedData.name,
        city: validatedData.city,
        id: { not: id },
      },
    })

    if (duplicateSchool) {
      return NextResponse.json(
        { error: 'Ya existe un colegio con ese nombre en esa ciudad' },
        { status: 400 }
      )
    }

    // Check if daneCode is unique (if provided and different from current)
    if (validatedData.daneCode && validatedData.daneCode.trim()) {
      const existingDaneCode = await prisma.school.findUnique({
        where: {
          daneCode: validatedData.daneCode.trim(),
        },
      })

      if (existingDaneCode && existingDaneCode.id !== id) {
        return NextResponse.json(
          { error: 'Ya existe un colegio con ese código DANE' },
          { status: 400 }
        )
      }
    }

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...validatedData,
        type: validatedData.type || 'school',
        daneCode: validatedData.daneCode?.trim() || null,
      },
    })

    return NextResponse.json(school)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating school:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only teacher admins can delete schools
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id },
    })

    if (!existingSchool) {
      return NextResponse.json(
        { error: 'Colegio no encontrado' },
        { status: 404 }
      )
    }

    // Check if school has users (students or admins)
    const usersCount = await prisma.user.count({
      where: { schoolId: id },
    })

    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un colegio que tiene usuarios asociados' },
        { status: 400 }
      )
    }

    await prisma.school.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Colegio eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 