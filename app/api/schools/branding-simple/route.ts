import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  themePrimary: z.string().optional(),
  themeSecondary: z.string().optional(),
  themeAccent: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Obtener el schoolId del query parameter
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'SchoolId requerido' }, { status: 400 })
    }

    // Obtener datos reales del colegio específico
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'Colegio no encontrado' }, { status: 404 })
    }

    // Valores por defecto de EducaSaber
    const EDUCASABER_DEFAULTS = {
      logoUrl: '/logo-educasaber.png',
      themePrimary: '#8B5CF6', // Púrpura (262 83% 58% en HSL)
      themeSecondary: '#10B981', // Verde (158 64% 52% en HSL)
      themeAccent: '#F59E0B' // Naranja (38 92% 50% en HSL)
    }

    const branding = { 
      logoUrl: school.logoUrl || EDUCASABER_DEFAULTS.logoUrl, 
      themePrimary: school.themePrimary || EDUCASABER_DEFAULTS.themePrimary, 
      themeSecondary: school.themeSecondary || EDUCASABER_DEFAULTS.themeSecondary, 
      themeAccent: school.themeAccent || EDUCASABER_DEFAULTS.themeAccent 
    }
    
    // Si el logo es example.com o un placeholder, usar logo de EducaSaber
    if (branding.logoUrl === 'https://example.com/logo.png' || 
        branding.logoUrl?.includes('via.placeholder.com') ||
        branding.logoUrl === 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=COLEGIO') {
      branding.logoUrl = EDUCASABER_DEFAULTS.logoUrl
    }
    
    return NextResponse.json(branding)
  } catch (error) {
    console.error('Error fetching school branding:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const user = gate.session!.user as any
    const body = await request.json()
    const data = brandingSchema.parse(body)

    let targetSchoolId: string | undefined = undefined
    if (user.role === 'school_admin') {
      targetSchoolId = user.schoolId
    } else if (user.role === 'teacher_admin') {
      targetSchoolId = data.schoolId
    }

    if (!targetSchoolId) {
      return NextResponse.json({ error: 'Falta schoolId' }, { status: 400 })
    }

    // Actualizar la base de datos con los nuevos datos de branding
    const updatedSchool = await prisma.school.update({
      where: { id: targetSchoolId },
      data: {
        logoUrl: data.logoUrl || null,
        themePrimary: data.themePrimary || null,
        themeSecondary: data.themeSecondary || null,
        themeAccent: data.themeAccent || null
      },
      select: {
        id: true,
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    })

    
    return NextResponse.json({
      id: updatedSchool.id,
      logoUrl: updatedSchool.logoUrl,
      themePrimary: updatedSchool.themePrimary,
      themeSecondary: updatedSchool.themeSecondary,
      themeAccent: updatedSchool.themeAccent,
      message: 'Branding actualizado exitosamente'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating school branding:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
