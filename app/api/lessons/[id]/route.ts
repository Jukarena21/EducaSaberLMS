import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para actualizar lecciones
const lessonUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTimeMinutes: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  videoDescription: z.string().optional(),
  theoryContent: z.string().min(1, 'El contenido es requerido'),
  competencyId: z.string().optional(),
});

// GET - Obtener lección específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        moduleLessons: {
          include: {
            module: {
              include: {
                courseModules: {
                  include: {
                    course: {
                      include: {
                        competency: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que la lección pertenece a su colegio
    if (session.user.role === 'school_admin') {
      const hasAccess = lesson.moduleLessons.some(ml => 
        ml.module.courseModules.some(cm => 
          cm.course.schoolId === session.user.schoolId
        )
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta lección' },
          { status: 403 }
        );
      }
    }

    // Transformar datos
    const transformedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      estimatedTimeMinutes: lesson.estimatedTimeMinutes,
      videoUrl: lesson.videoUrl,
      videoDescription: lesson.videoDescription,
      theoryContent: lesson.theoryContent,
      isPublished: lesson.isPublished,
      modules: lesson.moduleLessons.map(ml => ({
        moduleId: ml.module.id,
        moduleTitle: ml.module.title,
        orderIndex: ml.orderIndex,
        course: ml.module.courseModules[0]?.course ? {
          id: ml.module.courseModules[0].course.id,
          title: ml.module.courseModules[0].course.title,
          competency: ml.module.courseModules[0].course.competency ? {
            id: ml.module.courseModules[0].course.competency.id,
            name: ml.module.courseModules[0].course.competency.name
          } : undefined
        } : undefined,
        competency: ml.module.courseModules[0]?.course?.competency ? {
          id: ml.module.courseModules[0].course.competency.id,
          name: ml.module.courseModules[0].course.competency.name
        } : undefined
      })),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    };

    return NextResponse.json(transformedLesson);
  } catch (error) {
    console.error('Error al obtener lección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar lección
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede actualizar lecciones
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar lecciones' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    console.log('Datos recibidos en API:', body);
    const validatedData = lessonUpdateSchema.parse(body);
    console.log('Datos validados:', validatedData);

    // Verificar que la lección existe
    const existingLesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        estimatedTimeMinutes: validatedData.estimatedTimeMinutes,
        videoUrl: validatedData.videoUrl || null,
        videoDescription: validatedData.videoDescription || null,
        theoryContent: validatedData.theoryContent,
        competencyId: validatedData.competencyId || null,
      },
      include: {
        moduleLessons: {
          include: {
            module: {
              include: {
                courseModules: {
                  include: {
                    course: {
                      include: {
                        competency: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transformar respuesta
    const transformedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      estimatedTimeMinutes: lesson.estimatedTimeMinutes,
      videoUrl: lesson.videoUrl,
      videoDescription: lesson.videoDescription,
      theoryContent: lesson.theoryContent,
      isPublished: lesson.isPublished,
      competencyId: lesson.competencyId,
      modules: lesson.moduleLessons.map(ml => ({
        moduleId: ml.module.id,
        moduleTitle: ml.module.title,
        orderIndex: ml.orderIndex,
        course: ml.module.courseModules[0]?.course ? {
          id: ml.module.courseModules[0].course.id,
          title: ml.module.courseModules[0].course.title,
          competency: ml.module.courseModules[0].course.competency ? {
            id: ml.module.courseModules[0].course.competency.id,
            name: ml.module.courseModules[0].course.competency.name
          } : undefined
        } : undefined,
        competency: ml.module.courseModules[0]?.course?.competency ? {
          id: ml.module.courseModules[0].course.competency.id,
          name: ml.module.courseModules[0].course.competency.name
        } : undefined
      })),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    };

    return NextResponse.json(transformedLesson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar lección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar lección
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede eliminar lecciones
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar lecciones' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que la lección existe
    const existingLesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la lección
    await prisma.lesson.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Lección eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar lección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 