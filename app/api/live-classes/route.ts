import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'
import { NotificationService } from '@/lib/notificationService'

// Esquema de validación para crear una clase en vivo
const liveClassSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional().or(z.literal('')),
  meetingUrl: z.string().url('El enlace de la reunión debe ser una URL válida'),
  provider: z.enum(['zoom', 'meet', 'teams', 'webex', 'other']).optional().nullable(),
  startDateTime: z.string().min(1, 'La fecha de inicio es requerida').transform((str) => new Date(str)),
  endDateTime: z.string().optional().or(z.literal('')).transform((str) => str && str !== '' ? new Date(str) : undefined),
  academicGrade: z.string().optional().or(z.literal('')),
  competencyId: z.string().optional().or(z.literal('')),
  moduleId: z.string().optional().or(z.literal('')),
  lessonId: z.string().optional().or(z.literal('')),
  schoolId: z.string().optional().or(z.literal('')),
})

// GET /api/live-classes - Listar clases en vivo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const schoolId = searchParams.get('schoolId')
    const competencyId = searchParams.get('competencyId')
    const moduleId = searchParams.get('moduleId')
    const lessonId = searchParams.get('lessonId')
    const provider = searchParams.get('provider')
    const startDateFrom = searchParams.get('startDateFrom')
    const startDateTo = searchParams.get('startDateTo')
    const userId = searchParams.get('userId') // Para filtrar por usuario invitado

    // Construir filtros
    const where: any = {}

    // Si es estudiante, solo puede ver clases donde está invitado
    if (session.user.role === 'student') {
      where.invitations = {
        some: {
          userId: session.user.id
        }
      }
    } else if (userId) {
      // Filtrar por usuario invitado (para admins)
      where.invitations = {
        some: {
          userId: userId
        }
      }
    }

    // Si es school_admin, solo puede ver clases de su colegio
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
      }
      where.schoolId = session.user.schoolId
    } else if (schoolId && schoolId !== 'all') {
      // Teacher admin puede filtrar por colegio específico
      where.schoolId = schoolId
    }

    // Si no hay filtros y es admin, mostrar todas las clases (no aplicar filtro de invitaciones)
    // Esto permite que los admins vean todas las clases sin necesidad de estar invitados

    if (search) {
      // SQLite no soporta mode: 'insensitive', usar contains sin mode
      where.title = {
        contains: search
      }
    }

    if (competencyId) {
      where.competencyId = competencyId
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

    if (lessonId) {
      where.lessonId = lessonId
    }

    if (provider) {
      where.provider = provider
    }

    if (startDateFrom) {
      const dateFrom = new Date(startDateFrom)
      if (where.startDateTime) {
        where.startDateTime.gte = dateFrom
      } else {
        where.startDateTime = { gte: dateFrom }
      }
    }

    if (startDateTo) {
      const dateTo = new Date(startDateTo)
      if (where.startDateTime) {
        where.startDateTime.lte = dateTo
      } else {
        where.startDateTime = { lte: dateTo }
      }
    }

    try {
      const liveClasses = await prisma.liveClass.findMany({
        where,
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
                  role: true
                }
              }
            }
          }
        },
        orderBy: {
          startDateTime: 'asc'
        }
      })

      return NextResponse.json(liveClasses)
    } catch (dbError: any) {
      console.error('Database error fetching live classes:', dbError)
      return NextResponse.json(
        { error: 'Error al consultar la base de datos', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching live classes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/live-classes - Crear clase en vivo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos - solo teacher_admin puede crear
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const body = await request.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2))
    
    let data;
    try {
      data = liveClassSchema.parse(body)
      console.log('✅ Validated data:', JSON.stringify(data, null, 2))
    } catch (validationError) {
      console.error('❌ Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Validar que la fecha de inicio sea futura
    if (data.startDateTime < new Date()) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser futura' },
        { status: 400 }
      )
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (data.endDateTime && data.endDateTime <= data.startDateTime) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la de inicio' },
        { status: 400 }
      )
    }

    // Si es school_admin, debe asignar su colegio
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        )
      }
      data.schoolId = session.user.schoolId
    } else if (data.schoolId && data.schoolId !== 'all') {
      // Teacher admin puede asignar cualquier colegio
      // Si no se especifica, se puede crear sin colegio (clase general)
    }

    // Preparar datos para Prisma (convertir strings vacíos a null/undefined)
    const prismaData: any = {
      title: data.title,
      meetingUrl: data.meetingUrl,
      startDateTime: data.startDateTime,
      createdById: session.user.id,
    };

    // Campos opcionales - solo agregar si tienen valor
    if (data.description && data.description.trim() !== '') {
      prismaData.description = data.description;
    }
    if (data.provider) {
      prismaData.provider = data.provider;
    }
    if (data.endDateTime) {
      prismaData.endDateTime = data.endDateTime;
    }
    if (data.academicGrade && data.academicGrade !== '') {
      prismaData.academicGrade = data.academicGrade;
    }
    if (data.competencyId && data.competencyId !== '') {
      prismaData.competencyId = data.competencyId;
    }
    if (data.moduleId && data.moduleId !== '') {
      prismaData.moduleId = data.moduleId;
    }
    if (data.lessonId && data.lessonId !== '') {
      prismaData.lessonId = data.lessonId;
    }
    if (data.schoolId && data.schoolId !== '') {
      prismaData.schoolId = data.schoolId;
    }

    console.log('💾 Prisma data:', JSON.stringify(prismaData, null, 2))
    
    // Crear la clase
    let liveClass;
    try {
      liveClass = await prisma.liveClass.create({
        data: prismaData,
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
        }
      }
      });
      
      console.log('✅ Live class created:', liveClass.id);
    } catch (dbError: any) {
      console.error('❌ Database error creating live class:', dbError);
      throw dbError;
    }

    // Crear invitaciones automáticas para estudiantes y profesores del colegio
    if (prismaData.schoolId) {
      const usersToInvite = await prisma.user.findMany({
        where: {
          schoolId: prismaData.schoolId,
          role: {
            in: ['student', 'school_admin', 'teacher']
          }
        },
        select: {
          id: true
        }
      })

      if (usersToInvite.length > 0) {
        // SQLite no soporta skipDuplicates en createMany, usar upsert individual
        await Promise.all(
          usersToInvite.map(user =>
            prisma.liveClassInvitation.upsert({
              where: {
                liveClassId_userId: {
                  liveClassId: liveClass.id,
                  userId: user.id
                }
              },
              update: {},
              create: {
                liveClassId: liveClass.id,
                userId: user.id
              }
            })
          )
        )

        // Enviar notificaciones a todos los usuarios invitados
        await Promise.all(
          usersToInvite.map(user =>
            NotificationService.createLiveClassNotification(
              user.id,
              liveClass.title,
              liveClass.id,
              liveClass.startDateTime,
              liveClass.meetingUrl
            )
          )
        )
      }
    }

    return NextResponse.json(liveClass, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating live class:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

