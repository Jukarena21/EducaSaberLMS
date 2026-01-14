import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/live-classes/calendar - Obtener eventos en formato calendario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') // Fecha de inicio del rango (ISO string)
    const endDate = searchParams.get('end') // Fecha de fin del rango (ISO string)
    const competencyId = searchParams.get('competencyId')
    const moduleId = searchParams.get('moduleId')

    // Construir filtros
    const where: any = {}

    // Si es estudiante, solo puede ver clases donde está invitado
    if (session.user.role === 'student') {
      where.invitations = {
        some: {
          userId: session.user.id
        }
      }
    } else if (session.user.role === 'school_admin') {
      // School admin solo ve clases de su colegio
      if (!session.user.schoolId) {
        return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
      }
      where.schoolId = session.user.schoolId
    }

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      where.startDateTime = {}
      if (startDate) {
        where.startDateTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startDateTime.lte = new Date(endDate)
      }
    }

    if (competencyId) {
      where.competencyId = competencyId
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

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
            lastName: true
          }
        }
      },
      orderBy: {
        startDateTime: 'asc'
      }
    })

    // Formatear eventos para calendario
    const events = liveClasses.map(liveClass => ({
      id: liveClass.id,
      title: liveClass.title,
      start: liveClass.startDateTime.toISOString(),
      end: liveClass.endDateTime?.toISOString() || null,
      allDay: false,
      extendedProps: {
        description: liveClass.description,
        meetingUrl: liveClass.meetingUrl,
        provider: liveClass.provider,
        competency: liveClass.competency ? {
          id: liveClass.competency.id,
          name: liveClass.competency.name,
          displayName: liveClass.competency.displayName,
          colorHex: liveClass.competency.colorHex
        } : null,
        module: liveClass.module ? {
          id: liveClass.module.id,
          title: liveClass.module.title
        } : null,
        lesson: liveClass.lesson ? {
          id: liveClass.lesson.id,
          title: liveClass.lesson.title
        } : null,
        school: liveClass.school ? {
          id: liveClass.school.id,
          name: liveClass.school.name
        } : null,
        createdBy: {
          id: liveClass.createdBy.id,
          firstName: liveClass.createdBy.firstName,
          lastName: liveClass.createdBy.lastName
        }
      }
    }))

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

