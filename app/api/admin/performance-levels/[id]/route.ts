import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const profile = await prisma.performanceLevelProfile.findUnique({
      where: { id },
      include: { bands: { orderBy: [{ areaSlug: 'asc' }, { sortOrder: 'asc' }] } },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching performance level profile:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, isDefault, academicGrade, areaSlug, bands } = body

    const existing = await prisma.performanceLevelProfile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    if (isDefault) {
      await prisma.performanceLevelProfile.updateMany({
        where: {
          isDefault: true,
          academicGrade: academicGrade ?? existing.academicGrade,
          areaSlug: areaSlug ?? existing.areaSlug,
          NOT: { id },
        },
        data: { isDefault: false },
      })
    }

    await prisma.performanceLevelProfile.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        description: description ?? existing.description,
        isDefault: isDefault ?? existing.isDefault,
        academicGrade: academicGrade !== undefined ? academicGrade : existing.academicGrade,
        areaSlug: areaSlug !== undefined ? areaSlug : existing.areaSlug,
      },
    })

    if (Array.isArray(bands)) {
      await prisma.performanceLevelBand.deleteMany({ where: { profileId: id } })
      if (bands.length > 0) {
        await prisma.performanceLevelBand.createMany({
          data: bands.map((b: any, index: number) => ({
            profileId: id,
            areaSlug: b.areaSlug,
            label: b.label,
            minScore: b.minScore,
            maxScore: b.maxScore,
            description: b.description,
            sortOrder: b.sortOrder ?? index,
          })),
        })
      }
    }

    const updated = await prisma.performanceLevelProfile.findUnique({
      where: { id },
      include: { bands: { orderBy: [{ areaSlug: 'asc' }, { sortOrder: 'asc' }] } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating performance level profile:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const linkedExams = await prisma.exam.count({
      where: { performanceLevelProfileId: id },
    })
    if (linkedExams > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${linkedExams} examen(es) usan este perfil` },
        { status: 400 }
      )
    }

    await prisma.performanceLevelProfile.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting performance level profile:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
