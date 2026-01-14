import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'

const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  themePrimary: z.string().optional(),
  themeSecondary: z.string().optional(),
  themeAccent: z.string().optional(),
  // Optional for teacher_admin to update a specific school
  schoolId: z.string().optional(),
})

export async function GET() {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const user = gate.session!.user as any

    let schoolId = user.schoolId as string | undefined

    // teacher_admin can optionally read specific school branding via query param later if needed
    if (!schoolId && user.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
    }

    // If teacher_admin without school, just return empty branding
    if (!schoolId) {
      return NextResponse.json({ logoUrl: null, themePrimary: null, themeSecondary: null, themeAccent: null })
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    })

    return NextResponse.json({
      logoUrl: school?.logoUrl || null,
      themePrimary: school?.themePrimary || null,
      themeSecondary: school?.themeSecondary || null,
      themeAccent: school?.themeAccent || null
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
    const data = brandingSchema.parse(body)

    // Resolve target school
    let targetSchoolId: string | undefined = undefined
    if (user.role === 'school_admin') {
      targetSchoolId = user.schoolId
    } else if (user.role === 'teacher_admin') {
      targetSchoolId = data.schoolId
    }

    if (!targetSchoolId) {
      return NextResponse.json({ error: 'Falta schoolId' }, { status: 400 })
    }

    // Temporal: Solo actualizar campos que existen en el esquema actual
    const updateData: any = {}
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
    if (data.themePrimary !== undefined) updateData.themePrimary = data.themePrimary
    if (data.themeSecondary !== undefined) updateData.themeSecondary = data.themeSecondary
    if (data.themeAccent !== undefined) updateData.themeAccent = data.themeAccent

    const updated = await prisma.school.update({
      where: { id: targetSchoolId },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      logoUrl: updated.logoUrl,
      themePrimary: updated.themePrimary,
      themeSecondary: updated.themeSecondary,
      themeAccent: updated.themeAccent
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating school branding:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


