import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only school_admin and teacher_admin can access user management
    if (session.user?.role !== 'school_admin' && session.user?.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const schoolId = searchParams.get('schoolId') || ''
    
    const skip = (page - 1) * limit

    // Build where clause based on user role and filters
    let whereClause: any = {}
    
    // School admins can only see users from their school
    if (session.user?.role === 'school_admin' && session.user?.schoolId) {
      whereClause.schoolId = session.user.schoolId
    }
    
    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ]
    }
    
    // Add role filter
    if (role) {
      whereClause.role = role
    }
    
    // Add school filter (only for teacher_admin)
    if (schoolId && session.user?.role === 'teacher_admin') {
      whereClause.schoolId = schoolId
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          schoolId: true,
          school: {
            select: {
              id: true,
              name: true,
            }
          },
          // Datos personales y académicos
          academicGrade: true,
          dateOfBirth: true,
          gender: true,
          documentType: true,
          documentNumber: true,
          address: true,
          neighborhood: true,
          city: true,
          contactPhone: true,
          socioeconomicStratum: true,
          housingType: true,
          schoolEntryYear: true,
          academicAverage: true,
          repetitionHistory: true,
          schoolSchedule: true,
          disabilities: true,
          specialEducationalNeeds: true,
          medicalConditions: true,
          homeTechnologyAccess: true,
          homeInternetAccess: true,
          status: true,
          // Métricas
          totalPlatformTimeMinutes: true,
          sessionsStarted: true,
          lastSessionAt: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Get available schools for teacher_admin
    let schools = []
    if (session.user?.role === 'teacher_admin') {
      schools = await prisma.school.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      })
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      schools,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only school_admin and teacher_admin can create users
    if (session.user?.role !== 'school_admin' && session.user?.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      schoolId,
      dateOfBirth,
      gender,
      documentType,
      documentNumber,
      address,
      neighborhood,
      city,
      contactPhone,
      socioeconomicStratum,
      housingType,
      schoolEntryYear,
      academicAverage,
      academicGrade, // Grado académico del estudiante
      areasOfDifficulty,
      areasOfStrength,
      repetitionHistory,
      schoolSchedule,
      disabilities,
      specialEducationalNeeds,
      medicalConditions,
      homeTechnologyAccess,
      homeInternetAccess,
    } = body

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['student', 'school_admin', 'teacher_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // School admins can only create students and school_admin users for their school
    if (session.user?.role === 'school_admin') {
      if (role === 'teacher_admin') {
        return NextResponse.json(
          { error: 'No puedes crear usuarios teacher_admin' },
          { status: 403 }
        )
      }
      if (schoolId !== session.user?.schoolId) {
        return NextResponse.json(
          { error: 'Solo puedes crear usuarios para tu colegio' },
          { status: 403 }
        )
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role,
        schoolId: schoolId || null,
        academicGrade: academicGrade || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        documentType,
        documentNumber,
        address,
        neighborhood,
        city,
        contactPhone,
        socioeconomicStratum: socioeconomicStratum ? parseInt(socioeconomicStratum) : null,
        housingType,
        schoolEntryYear: schoolEntryYear ? parseInt(schoolEntryYear) : null,
        academicAverage: academicAverage ? parseFloat(academicAverage) : null,
        areasOfDifficulty: areasOfDifficulty ? JSON.stringify(areasOfDifficulty) : null,
        areasOfStrength: areasOfStrength ? JSON.stringify(areasOfStrength) : null,
        repetitionHistory: repetitionHistory || false,
        schoolSchedule,
        disabilities: disabilities ? JSON.stringify(disabilities) : null,
        specialEducationalNeeds,
        medicalConditions,
        homeTechnologyAccess: homeTechnologyAccess || false,
        homeInternetAccess: homeInternetAccess || false,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        academicGrade: true,
        dateOfBirth: true,
        gender: true,
        documentType: true,
        documentNumber: true,
        address: true,
        neighborhood: true,
        city: true,
        contactPhone: true,
        socioeconomicStratum: true,
        housingType: true,
        schoolEntryYear: true,
        academicAverage: true,
        areasOfDifficulty: true,
        areasOfStrength: true,
        repetitionHistory: true,
        schoolSchedule: true,
        disabilities: true,
        specialEducationalNeeds: true,
        medicalConditions: true,
        homeTechnologyAccess: true,
        homeInternetAccess: true,
        status: true,
        createdAt: true,
      },
    })

    // Si es un estudiante y tiene academicGrade, asignar automáticamente todos los cursos ICFES de ese grado
    if (role === 'student' && academicGrade) {
      try {
        // Buscar todos los cursos ICFES activos del grado especificado
        const coursesToEnroll = await prisma.course.findMany({
          where: {
            isIcfesCourse: true,
            isPublished: true,
            academicGrade: academicGrade,
            // Si el estudiante tiene schoolId, solo asignar cursos de ese colegio (si aplica)
            // Nota: Los cursos pueden estar asociados a múltiples colegios o ser globales
          },
          select: {
            id: true,
            title: true,
          },
        })

        // Crear las inscripciones automáticamente
        if (coursesToEnroll.length > 0) {
          const enrollments = await Promise.all(
            coursesToEnroll.map(course =>
              prisma.courseEnrollment.upsert({
                where: {
                  userId_courseId: {
                    userId: user.id,
                    courseId: course.id,
                  },
                },
                update: {
                  isActive: true, // Reactivar si ya existía
                },
                create: {
                  userId: user.id,
                  courseId: course.id,
                  isActive: true,
                  enrolledAt: new Date(),
                },
              })
            )
          )

          console.log(`✅ Asignados automáticamente ${enrollments.length} cursos al estudiante ${user.id} (grado ${academicGrade})`)
        } else {
          console.log(`ℹ️ No se encontraron cursos ICFES para el grado ${academicGrade}. El estudiante ${user.id} no tiene cursos asignados automáticamente.`)
        }
      } catch (enrollmentError) {
        // No fallar la creación del usuario si hay error en la asignación de cursos
        console.error('Error al asignar cursos automáticamente:', enrollmentError)
      }
    }

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 