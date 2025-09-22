import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para agregar lección a módulo
const addLessonSchema = z.object({
  lessonId: z.string().min(1, 'ID de lección requerido'),
  orderIndex: z.number().min(0, 'El orden debe ser mayor o igual a 0'),
});

// GET - Obtener lecciones de un módulo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: moduleId } = await params;

    // Verificar que el módulo existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        courseModules: {
          include: {
            course: {
              include: {
                school: true
              }
            }
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // Si es admin de colegio, verificar que el módulo pertenece a su colegio
    if (session.user.role === 'school_admin') {
      const belongsToSchool = module.courseModules.some(cm => 
        cm.course.schoolId === session.user.schoolId
      );
      if (!belongsToSchool) {
        return NextResponse.json({ error: 'No tienes permisos para ver este módulo' }, { status: 403 });
      }
    }

    // Obtener lecciones del módulo
    const moduleLessons = await prisma.moduleLesson.findMany({
      where: { moduleId },
      include: {
        lesson: true
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    const lessons = moduleLessons.map(ml => ({
      id: ml.lesson.id,
      title: ml.lesson.title,
      description: ml.lesson.description,
      estimatedTimeMinutes: ml.lesson.estimatedTimeMinutes,
      videoUrl: ml.lesson.videoUrl,
      videoDescription: ml.lesson.videoDescription,
      theoryContent: ml.lesson.theoryContent,
      isPublished: ml.lesson.isPublished,
      orderIndex: ml.orderIndex,
      createdAt: ml.lesson.createdAt,
    }));

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Agregar lección al módulo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo profesor admin puede agregar lecciones a módulos
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'No tienes permisos para modificar módulos' }, { status: 403 });
    }

    const { id: moduleId } = await params;
    const body = await request.json();
    const validatedData = addLessonSchema.parse(body);

    // Verificar que el módulo existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // Verificar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    // Verificar que la relación no existe ya
    const existingRelation = await prisma.moduleLesson.findUnique({
      where: {
        moduleId_lessonId: {
          moduleId,
          lessonId: validatedData.lessonId
        }
      }
    });

    if (existingRelation) {
      return NextResponse.json({ error: 'La lección ya está en este módulo' }, { status: 400 });
    }

    // Crear la relación
    const moduleLesson = await prisma.moduleLesson.create({
      data: {
        moduleId,
        lessonId: validatedData.lessonId,
        orderIndex: validatedData.orderIndex,
      },
      include: {
        lesson: true
      }
    });

    return NextResponse.json({
      id: moduleLesson.lesson.id,
      title: moduleLesson.lesson.title,
      description: moduleLesson.lesson.description,
      estimatedTimeMinutes: moduleLesson.lesson.estimatedTimeMinutes,
      videoUrl: moduleLesson.lesson.videoUrl,
      videoDescription: moduleLesson.lesson.videoDescription,
      theoryContent: moduleLesson.lesson.theoryContent,
      isPublished: moduleLesson.lesson.isPublished,
      orderIndex: moduleLesson.orderIndex,
      createdAt: moduleLesson.lesson.createdAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding lesson to module:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover lección del módulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo profesor admin puede remover lecciones de módulos
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'No tienes permisos para modificar módulos' }, { status: 403 });
    }

    const { id: moduleId } = await params;
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'ID de lección requerido' }, { status: 400 });
    }

    // Verificar que la relación existe
    const moduleLesson = await prisma.moduleLesson.findUnique({
      where: {
        moduleId_lessonId: {
          moduleId,
          lessonId
        }
      }
    });

    if (!moduleLesson) {
      return NextResponse.json({ error: 'La lección no está en este módulo' }, { status: 404 });
    }

    // Eliminar la relación
    await prisma.moduleLesson.delete({
      where: {
        moduleId_lessonId: {
          moduleId,
          lessonId
        }
      }
    });

    return NextResponse.json({ message: 'Lección removida del módulo' });
  } catch (error) {
    console.error('Error removing lesson from module:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
