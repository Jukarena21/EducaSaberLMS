import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para módulos
const moduleSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTime: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  competencyId: z.string().optional(),
  selectedLessons: z.array(z.object({
    lessonId: z.string().min(1, 'ID de lección requerido'),
    orderIndex: z.number().min(1, 'Orden debe ser mayor a 0')
  })).default([]),
});

// GET - Listar módulos
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Iniciando GET de módulos...');
    
    const session = await getServerSession(authOptions);
    console.log('🔍 [DEBUG] Sesión GET:', session?.user ? 'Usuario autenticado' : 'No autenticado');
    console.log('🔍 [DEBUG] Rol del usuario GET:', session?.user?.role);
    
    if (!session?.user) {
      console.log('❌ [DEBUG] Usuario no autenticado en GET');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const createdById = searchParams.get('createdById') || undefined;
    const forCourseCreation = searchParams.get('forCourseCreation') === 'true';
    
    console.log('🔍 [DEBUG] Parámetros GET:', { search, createdById, forCourseCreation });

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (createdById) {
      where.createdById = createdById;
    }

    // Si es admin de colegio y no es para creación de curso, solo puede ver módulos que están en cursos de su colegio
    if (session.user.role === 'school_admin' && !forCourseCreation) {
      console.log('🔍 [DEBUG] Usuario es school_admin, schoolId:', session.user.schoolId);
      if (session.user.schoolId) {
        where.courseModules = {
          some: {
            course: {
              schoolId: session.user.schoolId
            }
          }
        };
      } else {
        console.log('⚠️ [DEBUG] Usuario school_admin sin schoolId, mostrando todos los módulos');
      }
    }

    console.log('🔍 [DEBUG] Filtros WHERE:', where);
    console.log('🔍 [DEBUG] Ejecutando consulta a la base de datos...');
    
    const modules = await prisma.module.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        moduleLessons: {
          select: {
            orderIndex: true,
            lesson: {
              select: {
                id: true,
                title: true
              }
            }
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
                school: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { title: 'asc' }
      ]
    });

    // Transformar datos para el frontend
    const transformedModules = modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTimeMinutes,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      createdBy: module.createdBy ? {
        id: module.createdBy.id,
        name: `${module.createdBy.firstName} ${module.createdBy.lastName}`,
        email: module.createdBy.email
      } : undefined,
      lessons: module.moduleLessons.map(ml => ({
        id: ml.lesson.id,
        title: ml.lesson.title,
        orderIndex: ml.orderIndex
      })),
      courses: module.courseModules.map(cm => ({
        id: cm.course.id,
        title: cm.course.title,
        school: cm.course.school ? {
          id: cm.course.school.id,
          name: cm.course.school.name
        } : undefined
      })),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    }));

    console.log('✅ [DEBUG] Módulos obtenidos exitosamente:', transformedModules.length);
    return NextResponse.json(transformedModules);
  } catch (error) {
    console.error('❌ [DEBUG] Error al obtener módulos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear módulo
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Iniciando creación de módulo...');
    
    const session = await getServerSession(authOptions);
    console.log('🔍 [DEBUG] Sesión:', session?.user ? 'Usuario autenticado' : 'No autenticado');
    console.log('🔍 [DEBUG] Rol del usuario:', session?.user?.role);
    
    if (!session?.user) {
      console.log('❌ [DEBUG] Usuario no autenticado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede crear módulos
    if (session.user.role !== 'teacher_admin') {
      console.log('❌ [DEBUG] Usuario sin permisos:', session.user.role);
      return NextResponse.json(
        { error: 'No tienes permisos para crear módulos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('🔍 [DEBUG] Datos recibidos:', body);
    
    const validatedData = moduleSchema.parse(body);
    console.log('🔍 [DEBUG] Datos validados:', validatedData);

    const module = await prisma.module.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        estimatedTimeMinutes: validatedData.estimatedTime,
        orderIndex: 1, // Valor por defecto, se ajustará en cursos
        competencyId: validatedData.competencyId || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        moduleLessons: {
          select: {
            orderIndex: true,
            lesson: {
              select: {
                id: true,
                title: true
              }
            }
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
                school: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Crear relaciones ModuleLesson si se proporcionaron lecciones
    if (validatedData.selectedLessons.length > 0) {
      const moduleLessonData = validatedData.selectedLessons.map(lesson => ({
        moduleId: module.id,
        lessonId: lesson.lessonId,
        orderIndex: lesson.orderIndex,
      }));

      await prisma.moduleLesson.createMany({
        data: moduleLessonData,
      });

      // Recargar el módulo con las lecciones
      const updatedModule = await prisma.module.findUnique({
        where: { id: module.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          moduleLessons: {
            select: {
              orderIndex: true,
              lesson: {
                select: {
                  id: true,
                  title: true
                }
              }
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
                  school: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (updatedModule) {
        // Transformar respuesta con lecciones
        const transformedModule = {
          id: updatedModule.id,
          title: updatedModule.title,
          description: updatedModule.description,
          estimatedTime: updatedModule.estimatedTimeMinutes,
          orderIndex: updatedModule.orderIndex,
          createdById: updatedModule.createdById,
          createdBy: updatedModule.createdBy ? {
            id: updatedModule.createdBy.id,
            name: `${updatedModule.createdBy.firstName} ${updatedModule.createdBy.lastName}`,
            email: updatedModule.createdBy.email
          } : undefined,
          lessons: updatedModule.moduleLessons.map(ml => ({
            id: ml.lesson.id,
            title: ml.lesson.title,
            orderIndex: ml.orderIndex
          })),
          courses: updatedModule.courseModules.map(cm => ({
            id: cm.course.id,
            title: cm.course.title,
            school: cm.course.school ? {
              id: cm.course.school.id,
              name: cm.course.school.name
            } : undefined
          })),
          createdAt: updatedModule.createdAt,
          updatedAt: updatedModule.updatedAt
        };

        return NextResponse.json(transformedModule, { status: 201 });
      }
    }

    // Transformar respuesta si no se crearon relaciones ModuleLesson
    const transformedModule = {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTimeMinutes,
      orderIndex: module.orderIndex,
      createdById: module.createdById,
      createdBy: module.createdBy ? {
        id: module.createdBy.id,
        name: `${module.createdBy.firstName} ${module.createdBy.lastName}`,
        email: module.createdBy.email
      } : undefined,
      lessons: module.moduleLessons.map(ml => ({
        id: ml.lesson.id,
        title: ml.lesson.title,
        orderIndex: ml.orderIndex
      })),
      courses: module.courseModules.map(cm => ({
        id: cm.course.id,
        title: cm.course.title,
        school: cm.course.school ? {
          id: cm.course.school.id,
          name: cm.course.school.name
        } : undefined
      })),
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };

    console.log('✅ [DEBUG] Módulo creado exitosamente:', module.id);
    return NextResponse.json(transformedModule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ [DEBUG] Error de validación:', error.errors);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ [DEBUG] Error al crear módulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 