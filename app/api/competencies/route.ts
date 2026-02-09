import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const competencies = await prisma.area.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(competencies);
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos - solo teacher_admin puede crear competencias
    const gate = await requireRole(['teacher_admin']);
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const { name, displayName, description, colorHex } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'El nombre y nombre de visualización son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una competencia con ese nombre
    const existing = await prisma.area.findFirst({
      where: {
        OR: [
          { name: name },
          { displayName: displayName }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una competencia con ese nombre' },
        { status: 400 }
      );
    }

    const competency = await prisma.area.create({
      data: {
        name,
        displayName,
        description: description || `Competencia: ${displayName}`,
        colorHex: colorHex || '#73A2D3',
      },
    });

    return NextResponse.json(competency, { status: 201 });
  } catch (error) {
    console.error('Error creating competency:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 