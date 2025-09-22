import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para actualizar cursos
const courseUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  year: z.number().min(6, 'El año debe ser al menos 6').max(11, 'El año debe ser máximo 11'),
  competencyId: z.string().min(1, 'La competencia es requerida'),
  schoolId: z.string().min(1, 'El colegio es requerido'),
  moduleIds: z.array(z.string()).optional(),
});

// GET - Obtener curso específico
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

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        competency: {
          select: {
            id: true,
            name: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        },
        courseModules: {
          select: {
            orderIndex: true,
            module: {
              select: {
                id: true,
                title: true,
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el curso pertenece a su colegio
    if (session.user.role === 'school_admin' && course.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este curso' },
        { status: 403 }
      );
    }

    // Transformar datos
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      year: course.year,
      competencyId: course.competencyId,
      competency: course.competency ? {
        id: course.competency.id,
        name: course.competency.name
      } : undefined,
      schoolId: course.schoolId,
      school: course.school ? {
        id: course.school.id,
        name: course.school.name
      } : undefined,
      modules: course.courseModules.map(cm => ({
        id: cm.module.id,
        title: cm.module.title,
        orderIndex: cm.orderIndex,
        createdBy: cm.module.createdBy ? {
          id: cm.module.createdBy.id,
          name: `${cm.module.createdBy.firstName} ${cm.module.createdBy.lastName}`
        } : undefined
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error al obtener curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar curso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador y Administrador de Colegio pueden actualizar cursos
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar cursos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = courseUpdateSchema.parse(body);

    // Verificar que el curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el curso pertenece a su colegio
    if (session.user.role === 'school_admin' && existingCourse.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'Solo puedes actualizar cursos de tu colegio' },
        { status: 403 }
      );
    }

    // Si es admin de colegio, no puede cambiar el colegio del curso
    if (session.user.role === 'school_admin' && validatedData.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'No puedes cambiar el colegio del curso' },
        { status: 403 }
      );
    }

    // Verificar que el colegio existe
    const school = await prisma.school.findUnique({
      where: { id: validatedData.schoolId }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'El colegio especificado no existe' },
        { status: 400 }
      );
    }

    // Verificar que la competencia existe
    const competency = await prisma.competency.findUnique({
      where: { id: validatedData.competencyId }
    });

    if (!competency) {
      return NextResponse.json(
        { error: 'La competencia especificada no existe' },
        { status: 400 }
      );
    }

    // Validación crítica: Verificar que no existe otro curso con la misma competencia/año/colegio (excluyendo el actual)
    const existingCourseConflict = await prisma.course.findFirst({
      where: {
        schoolId: validatedData.schoolId,
        competencyId: validatedData.competencyId,
        year: validatedData.year,
        id: { not: id }
      }
    });

    if (existingCourseConflict) {
      return NextResponse.json(
        { 
          error: `Ya existe un curso de ${competency.name} para ${validatedData.year}° grado en este colegio. Solo se permite un curso por competencia/año por colegio.` 
        },
        { status: 400 }
      );
    }

    // Verificar que todos los módulos existen y fueron creados por Profesor Admin
    if (validatedData.moduleIds && validatedData.moduleIds.length > 0) {
      const modules = await prisma.module.findMany({
        where: {
          id: { in: validatedData.moduleIds }
        },
        include: {
          createdBy: true
        }
      });

      if (modules.length !== validatedData.moduleIds.length) {
        return NextResponse.json(
          { error: 'Uno o más módulos especificados no existen' },
          { status: 400 }
        );
      }

      // Verificar que todos los módulos fueron creados por Profesor Admin
      const invalidModules = modules.filter(module => module.createdBy?.role !== 'teacher_admin');
      if (invalidModules.length > 0) {
        return NextResponse.json(
          { error: 'Solo se pueden agregar módulos creados por Profesores Administradores' },
          { status: 400 }
        );
      }
    }

    // Actualizar el curso
    const course = await prisma.course.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        year: validatedData.year,
        competencyId: validatedData.competencyId,
        schoolId: validatedData.schoolId,
      },
      include: {
        competency: {
          select: {
            id: true,
            name: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        },
        modules: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    // Actualizar módulos asociados
    if (validatedData.moduleIds !== undefined) {
      // Eliminar todas las asociaciones existentes
      await prisma.courseModule.deleteMany({
        where: { courseId: id }
      });

      // Crear nuevas asociaciones si se especificaron módulos
      if (validatedData.moduleIds.length > 0) {
        await prisma.courseModule.createMany({
          data: validatedData.moduleIds.map(moduleId => ({
            courseId: id,
            moduleId: moduleId
          }))
        });
      }

      // Recargar el curso con los módulos actualizados
      const courseWithModules = await prisma.course.findUnique({
        where: { id },
        include: {
          competency: {
            select: {
              id: true,
              name: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          },
          modules: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              createdBy: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      });

      if (courseWithModules) {
        // Transformar respuesta
        const transformedCourse = {
          id: courseWithModules.id,
          title: courseWithModules.title,
          description: courseWithModules.description,
          year: courseWithModules.year,
          competencyId: courseWithModules.competencyId,
          competency: courseWithModules.competency ? {
            id: courseWithModules.competency.id,
            name: courseWithModules.competency.name
          } : undefined,
          schoolId: courseWithModules.schoolId,
          school: courseWithModules.school ? {
            id: courseWithModules.school.id,
            name: courseWithModules.school.name
          } : undefined,
          modules: courseWithModules.modules.map(module => ({
            id: module.id,
            title: module.title,
            orderIndex: module.orderIndex,
            createdBy: module.createdBy ? {
              id: module.createdBy.id,
              name: module.createdBy.name
            } : undefined
          })),
          createdAt: courseWithModules.createdAt,
          updatedAt: courseWithModules.updatedAt
        };

        return NextResponse.json(transformedCourse);
      }
    }

    // Transformar respuesta sin actualizar módulos
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      year: course.year,
      competencyId: course.competencyId,
      competency: course.competency ? {
        id: course.competency.id,
        name: course.competency.name
      } : undefined,
      schoolId: course.schoolId,
      school: course.school ? {
        id: course.school.id,
        name: course.school.name
      } : undefined,
      modules: course.modules.map(module => ({
        id: module.id,
        title: module.title,
        orderIndex: module.orderIndex,
        createdBy: module.createdBy ? {
          id: module.createdBy.id,
          name: module.createdBy.name
        } : undefined
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar curso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador y Administrador de Colegio pueden eliminar cursos
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar cursos' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el curso pertenece a su colegio
    if (session.user.role === 'school_admin' && existingCourse.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar cursos de tu colegio' },
        { status: 403 }
      );
    }

    // Eliminar el curso (esto también eliminará las asociaciones con módulos por CASCADE)
    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Curso eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 