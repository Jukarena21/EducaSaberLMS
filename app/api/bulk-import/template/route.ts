import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { buildStudentImportWorkbook } from '@/lib/bulk-import/buildStudentImportWorkbook'

export async function GET() {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed || !gate.session) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const where =
      gate.session.user.role === 'school_admin' && gate.session.user.schoolId
        ? { id: gate.session.user.schoolId }
        : { type: 'school' }

    const schools = await prisma.school.findMany({
      where,
      select: { name: true, city: true },
      orderBy: { name: 'asc' },
      take: 500,
    })

    const workbook = await buildStudentImportWorkbook(schools)
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="plantilla-estudiantes.xlsx"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating student import template:', error)
    return NextResponse.json({ error: 'No se pudo generar la plantilla' }, { status: 500 })
  }
}
