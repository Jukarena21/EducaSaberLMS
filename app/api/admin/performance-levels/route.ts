import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { getAllDefaultBands } from '@/lib/performanceLevelDefaults'

export async function GET() {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const profiles = await prisma.performanceLevelProfile.findMany({
      include: {
        bands: { orderBy: [{ areaSlug: 'asc' }, { sortOrder: 'asc' }] },
        _count: { select: { exams: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error listing performance level profiles:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const body = await request.json()
    const {
      name,
      description,
      isDefault = false,
      academicGrade = null,
      areaSlug = null,
      cloneFromDefault = true,
      bands = [],
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (isDefault) {
      await prisma.performanceLevelProfile.updateMany({
        where: {
          isDefault: true,
          academicGrade: academicGrade || null,
          areaSlug: areaSlug || null,
        },
        data: { isDefault: false },
      })
    }

    const profile = await prisma.performanceLevelProfile.create({
      data: {
        name: name.trim(),
        description: description || null,
        isDefault: Boolean(isDefault),
        academicGrade: academicGrade || null,
        areaSlug: areaSlug || null,
      },
    })

    const bandsToCreate =
      Array.isArray(bands) && bands.length > 0
        ? bands
        : cloneFromDefault
          ? getAllDefaultBands()
          : []

    if (bandsToCreate.length > 0) {
      await prisma.performanceLevelBand.createMany({
        data: bandsToCreate.map((b: any) => ({
          profileId: profile.id,
          areaSlug: b.areaSlug,
          label: b.label,
          minScore: b.minScore,
          maxScore: b.maxScore,
          description: b.description,
          sortOrder: b.sortOrder ?? 0,
        })),
      })
    }

    const created = await prisma.performanceLevelProfile.findUnique({
      where: { id: profile.id },
      include: { bands: { orderBy: [{ areaSlug: 'asc' }, { sortOrder: 'asc' }] } },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating performance level profile:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
