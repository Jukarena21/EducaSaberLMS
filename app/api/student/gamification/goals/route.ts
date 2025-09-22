import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener metas del usuario
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { isCompleted: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const { title, description, type, targetValue, unit, deadline, points } = body;

    // Validar datos requeridos
    if (!title || !type || !targetValue || !unit) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear nueva meta
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        type,
        targetValue: parseInt(targetValue),
        unit,
        deadline: deadline ? new Date(deadline) : null,
        points: points ? parseInt(points) : 10
      }
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
