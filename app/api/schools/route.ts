import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireRole } from '@/lib/rbac'

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

export async function GET(request: NextRequest) {
  try {
    console.log('Schools API called')
    
    // Verificar autenticación básica
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const institutionType = searchParams.get('institutionType') || ''

    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { neighborhood: { contains: search } },
        { contactEmail: { contains: search } },
      ]
    }

    if (city) {
      whereClause.city = city
    }

    if (institutionType) {
      whereClause.institutionType = institutionType
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          neighborhood: true,
          address: true,
          institutionType: true,
          academicCalendar: true,
          totalStudents: true,
          numberOfCampuses: true,
          yearsOfOperation: true,
          contactEmail: true,
          contactPhone: true,
          activeStudentsCount: true,
          averageStudentUsageMinutes: true,
          createdAt: true,
          updatedAt: true,
          // Incluir campos de branding
          logoUrl: true,
          themePrimary: true,
          themeSecondary: true,
          themeAccent: true,
        },
      }),
      prisma.school.count({ where: whereClause }),
    ])

    console.log('Schools found:', schools.length)
    return NextResponse.json({
      schools,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching schools:', error)
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

    const body = await request.json()
    
    // Validate input
    const validatedData = schoolSchema.parse(body)

    // Check if school with same name and city already exists
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: validatedData.name,
        city: validatedData.city,
      },
    })

    if (existingSchool) {
      return NextResponse.json(
        { error: 'Ya existe un colegio con ese nombre en esa ciudad' },
        { status: 400 }
      )
    }

    // Check if daneCode is unique (if provided)
    if (validatedData.daneCode && validatedData.daneCode.trim()) {
      const existingDaneCode = await prisma.school.findUnique({
        where: {
          daneCode: validatedData.daneCode.trim(),
        },
      })

      if (existingDaneCode) {
        return NextResponse.json(
          { error: 'Ya existe un colegio con ese código DANE' },
          { status: 400 }
        )
      }
    }

    const school = await prisma.school.create({
      data: {
        ...validatedData,
        type: validatedData.type || 'school',
        daneCode: validatedData.daneCode?.trim() || null,
      },
    })

    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating school:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 