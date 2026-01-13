import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades';

// Schema de validación para actualizar módulos
const moduleUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  competencyId: z.string().optional(),
  isIcfesModule: z.boolean().optional().default(false),
  year: z.number().min(1).max(11).optional(), // Año escolar (1-11) solo para módulos ICFES
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
        courseModules: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseSchools: {
                  include: {
                    school: {
                      select: {
                        id: true,
                        name: true,
                        type: true
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

    if (!module) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el módulo está en cursos de su colegio
    if (session.user.role === 'school_admin') {
      const hasAccess = module.courseModules.some(cm => {
        const courseSchoolIds = cm.course.courseSchools?.map(cs => cs.school.id) || [];
        return courseSchoolIds.length === 0 || // Cursos generales
               courseSchoolIds.includes(session.user.schoolId!);
      });
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver este módulo' },
          { status: 403 }
        );
      }
    }

    // Convertir academicGrade a year si existe
    let year: number | undefined = undefined;
    if (module.academicGrade) {
      year = academicGradeToYear(module.academicGrade) || undefined;
    }

    // Transformar datos
    const transformedModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTimeMinutes,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      competencyId: module.competencyId,
      competency: module.competency,
      isIcfesModule: module.isIcfesModule,
      academicGrade: module.academicGrade,
      year: year,
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

    // Validar que si es ICFES, tenga año escolar
    if (validatedData.isIcfesModule && !validatedData.year) {
      return NextResponse.json(
        { error: 'El año escolar es requerido para módulos ICFES' },
        { status: 400 }
      );
    }

    // Convertir year a academicGrade si es ICFES
    let academicGrade: string | null = null;
    if (validatedData.isIcfesModule && validatedData.year) {
      academicGrade = yearToAcademicGrade(validatedData.year) || null;
    } else if (validatedData.isIcfesModule === false) {
      // Para módulos generales, academicGrade debe ser null
      academicGrade = null;
    }

    const module = await prisma.module.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        estimatedTimeMinutes: validatedData.estimatedTime,
        competencyId: validatedData.competencyId || null,
        isIcfesModule: validatedData.isIcfesModule !== undefined ? validatedData.isIcfesModule : existingModule.isIcfesModule,
        academicGrade: academicGrade !== null ? academicGrade : (validatedData.isIcfesModule === false ? null : existingModule.academicGrade),
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
        courseModules: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
                courseSchools: {
                  select: {
                    school: {
                      select: {
                        id: true,
                        name: true,
                        type: true
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

    // Convertir academicGrade a year si existe
    let year: number | undefined = undefined;
    if (module.academicGrade) {
      year = academicGradeToYear(module.academicGrade) || undefined;
    }

    // Transformar respuesta
    const transformedModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTimeMinutes,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      competencyId: module.competencyId,
      competency: module.competency,
      isIcfesModule: module.isIcfesModule,
      academicGrade: module.academicGrade,
      year: year,
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
      courses: module.courseModules.map(cm => {
        const firstSchool = cm.course.courseSchools?.[0]?.school;
        return {
          id: cm.course.id,
          title: cm.course.title,
          school: firstSchool ? {
            id: firstSchool.id,
            name: firstSchool.name
          } : undefined
        };
      }),
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