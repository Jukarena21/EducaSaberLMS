import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  EDUCASABER_BRANDING_DEFAULTS,
  brandingUpdateSchema,
  isPlaceholderLogo,
} from '@/lib/branding'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    // raw=1 devuelve solo lo que el colegio guardó, sin rellenar con los valores
    // de la plataforma: el formulario de branding lo necesita para no guardar
    // los valores por defecto como si fueran del colegio
    const raw = searchParams.get('raw') === '1'

    if (!schoolId) {
      return NextResponse.json({ error: 'SchoolId requerido' }, { status: 400 })
    }

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

    const storedLogo = isPlaceholderLogo(school.logoUrl) ? null : school.logoUrl

    if (raw) {
      return NextResponse.json({
        logoUrl: storedLogo || null,
        themePrimary: school.themePrimary || null,
        themeSecondary: school.themeSecondary || null,
        themeAccent: school.themeAccent || null,
      })
    }

    return NextResponse.json({
      logoUrl: storedLogo || EDUCASABER_BRANDING_DEFAULTS.logoUrl,
      themePrimary: school.themePrimary || EDUCASABER_BRANDING_DEFAULTS.themePrimary,
      themeSecondary: school.themeSecondary || EDUCASABER_BRANDING_DEFAULTS.themeSecondary,
      themeAccent: school.themeAccent || EDUCASABER_BRANDING_DEFAULTS.themeAccent,
    })
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
    const data = brandingUpdateSchema.parse(body)

    let targetSchoolId: string | undefined = undefined
    if (user.role === 'school_admin') {
      targetSchoolId = user.schoolId
    } else if (user.role === 'teacher_admin') {
      targetSchoolId = data.schoolId
    }

    if (!targetSchoolId) {
      return NextResponse.json({ error: 'Selecciona el colegio que quieres actualizar' }, { status: 400 })
    }

    const updatedSchool = await prisma.school.update({
      where: { id: targetSchoolId },
      data: {
        logoUrl: data.logoUrl ?? null,
        themePrimary: data.themePrimary ?? null,
        themeSecondary: data.themeSecondary ?? null,
        themeAccent: data.themeAccent ?? null
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
      ...updatedSchool,
      message: 'Branding actualizado exitosamente'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating school branding:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
