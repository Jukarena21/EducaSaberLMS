import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const competencies = await prisma.competency.findMany({
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