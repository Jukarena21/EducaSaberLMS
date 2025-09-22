import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para actualizar módulos
const moduleUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  competencyId: z.string().optional(),
  orderIndex: z.number().min(0, 'El índice de orden debe ser mayor o igual a 0'),
});

// GET - Obtener módulo específico
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

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true,
            colorHex: true
          }
        },
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        courses: {
          select: {
            id: true,
            title: true,
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el módulo está en cursos de su colegio
    if (session.user.role === 'school_admin') {
      const hasAccess = module.courses.some(course => 
        course.school?.id === session.user.schoolId
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver este módulo' },
          { status: 403 }
        );
      }
    }

    // Transformar datos
    const transformedModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      createdBy: module.createdBy ? {
        id: module.createdBy.id,
        name: module.createdBy.name,
        email: module.createdBy.email
      } : undefined,
      lessons: module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        orderIndex: lesson.orderIndex
      })),
      courses: module.courses.map(course => ({
        id: course.id,
        title: course.title,
        school: course.school ? {
          id: course.school.id,
          name: course.school.name
        } : undefined
      })),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };

    return NextResponse.json(transformedModule);
  } catch (error) {
    console.error('Error al obtener módulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar módulo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede actualizar módulos
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar módulos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = moduleUpdateSchema.parse(body);

    // Verificar que el módulo existe y fue creado por el usuario actual
    const existingModule = await prisma.module.findUnique({
      where: { id }
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    if (existingModule.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Solo puedes actualizar módulos que hayas creado' },
        { status: 403 }
      );
    }

    const module = await prisma.module.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        estimatedTime: validatedData.estimatedTime,
        competencyId: validatedData.competencyId || null,
        orderIndex: validatedData.orderIndex,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true,
            colorHex: true
          }
        },
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        courses: {
          select: {
            id: true,
            title: true,
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Transformar respuesta
    const transformedModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      createdBy: module.createdBy ? {
        id: module.createdBy.id,
        name: module.createdBy.name,
        email: module.createdBy.email
      } : undefined,
      lessons: module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        orderIndex: lesson.orderIndex
      })),
      courses: module.courses.map(course => ({
        id: course.id,
        title: course.title,
        school: course.school ? {
          id: course.school.id,
          name: course.school.name
        } : undefined
      })),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };

    return NextResponse.json(transformedModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar módulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar módulo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede eliminar módulos
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar módulos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    console.log('Eliminando módulo con ID:', id);

    // Verificar que el módulo existe y fue creado por el usuario actual
    const existingModule = await prisma.module.findUnique({
      where: { id },
      include: {
        courseModules: true
      }
    });

    if (!existingModule) {
      console.log('Módulo no encontrado');
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    console.log('Módulo encontrado:', existingModule.title, 'Creado por:', existingModule.createdById, 'Usuario actual:', session.user.id);

    if (existingModule.createdById !== session.user.id) {
      console.log('Usuario no tiene permisos para eliminar este módulo');
      return NextResponse.json(
        { error: 'Solo puedes eliminar módulos que hayas creado' },
        { status: 403 }
      );
    }

    // Verificar que el módulo no esté siendo usado en ningún curso
    console.log('CourseModules asociados:', existingModule.courseModules.length);
    if (existingModule.courseModules.length > 0) {
      console.log('No se puede eliminar - módulo en uso');
      return NextResponse.json(
        { error: 'No se puede eliminar un módulo que está siendo usado en cursos' },
        { status: 400 }
      );
    }

    // Eliminar el módulo (esto también eliminará las lecciones asociadas por CASCADE)
    console.log('Eliminando módulo de la base de datos...');
    await prisma.module.delete({
      where: { id }
    });

    console.log('Módulo eliminado exitosamente');
    return NextResponse.json(
      { message: 'Módulo eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 