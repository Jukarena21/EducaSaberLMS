import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades';

// Schema de validación para lecciones
const lessonSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTimeMinutes: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  videoDescription: z.string().optional(),
  theoryContent: z.string().min(1, 'El contenido es requerido'),
  competencyId: z.string().optional(),
  year: z.number().min(1).max(11).optional(), // Año escolar (1-11) solo para lecciones ICFES
});

// GET - Listar lecciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const moduleId = searchParams.get('moduleId') || undefined;
    const competencyId = searchParams.get('competencyId') || undefined;
    const isIcfesCourseParam = searchParams.get('isIcfesCourse');

    // Construir filtros
    const where: any = {};
    
    if (search) {
      // PostgreSQL case-insensitive search
      // Nota: mode: 'insensitive' requiere que los campos sean de tipo text/varchar
      // y que PostgreSQL tenga soporte para collation case-insensitive
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por tipo ICFES vs Personalizado
    // Las lecciones se consideran ICFES si pertenecen a módulos que están en cursos ICFES
    if (isIcfesCourseParam !== null && isIcfesCourseParam !== undefined) {
      const isIcfesCourse = isIcfesCourseParam === 'true' || isIcfesCourseParam === '1';
      where.moduleLessons = {
        some: {
          module: {
            courseModules: {
              some: {
                course: {
                  isIcfesCourse: isIcfesCourse
                }
              }
            }
          }
        }
      };
    }

    // Si es admin de colegio, solo puede ver lecciones de módulos que pertenecen a cursos de su colegio o generales
    if (session.user.role === 'school_admin') {
      if (session.user.schoolId) {
        where.moduleLessons = {
          some: {
            module: {
              courseModules: {
                some: {
                  course: {
                    OR: [
                      {
                        courseSchools: {
                          some: {
                            schoolId: session.user.schoolId
                          }
                        }
                      },
                      {
                        courseSchools: {
                          none: {} // Cursos generales
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        };
      }
    }

    // Filtrar por módulo específico
    if (moduleId) {
      where.moduleLessons = {
        some: {
          moduleId: moduleId
        }
      };
    }

    // Filtrar por competencia
    if (competencyId) {
      where.AND = [
        {
          OR: [
            { competencyId: competencyId },
            {
              moduleLessons: {
                some: {
                  module: {
                    courseModules: { some: { course: { competencyId } } }
                  }
                }
              }
            }
          ]
        }
      ]
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        moduleLessons: {
          include: {
            module: {
              include: {
                courseModules: {
                  include: {
                    course: {
                      include: {
                        competency: true,
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
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    // Transformar datos para el frontend
    const transformedLessons = lessons.map(lesson => {
      // Obtener información de módulos y cursos
      const moduleInfo = lesson.moduleLessons.map(ml => ({
        moduleId: ml.module.id,
        moduleTitle: ml.module.title,
        orderIndex: ml.orderIndex,
        course: ml.module.courseModules[0]?.course,
        competency: ml.module.courseModules[0]?.course?.competency
      }));
      const isIcfesCourse = moduleInfo.some(info => info.course?.isIcfesCourse);

      // Convertir academicGrade a year si existe
      let year: number | undefined = undefined;
      if (lesson.academicGrade) {
        year = academicGradeToYear(lesson.academicGrade) || undefined;
      }

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        estimatedTimeMinutes: lesson.estimatedTimeMinutes,
        videoUrl: lesson.videoUrl,
        videoDescription: lesson.videoDescription,
        theoryContent: lesson.theoryContent,
        isPublished: lesson.isPublished,
        competencyId: lesson.competencyId,
        academicGrade: lesson.academicGrade,
        year: year,
        isIcfesCourse,
        modules: moduleInfo,
        createdAt: lesson.createdAt,
        updatedAt: lesson.createdAt, // Usar createdAt como updatedAt por ahora
      };
    });

    return NextResponse.json(transformedLessons);
  } catch (error: any) {
    console.error('Error fetching lessons:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Crear lección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo profesor admin puede crear lecciones
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'No tienes permisos para crear lecciones' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = lessonSchema.parse(body);

    // Convertir year a academicGrade si se proporciona
    let academicGrade: string | null = null;
    if (validatedData.year) {
      academicGrade = yearToAcademicGrade(validatedData.year) || null;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        estimatedTimeMinutes: validatedData.estimatedTimeMinutes,
        videoUrl: validatedData.videoUrl || null,
        videoDescription: validatedData.videoDescription || null,
        theoryContent: validatedData.theoryContent,
        competencyId: validatedData.competencyId || null,
        academicGrade: academicGrade,
        isPublished: false,
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
                        competency: true,
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
            }
          }
        }
      }
    });

    // Transformar respuesta
    const createdModuleInfo = lesson.moduleLessons.map(ml => ({
      moduleId: ml.module.id,
      moduleTitle: ml.module.title,
      orderIndex: ml.orderIndex,
      course: ml.module.courseModules[0]?.course,
      competency: ml.module.courseModules[0]?.course?.competency
    }))
    const createdIsIcfesCourse = createdModuleInfo.some(info => info.course?.isIcfesCourse)

    // Convertir academicGrade a year si existe
    let year: number | undefined = undefined;
    if (lesson.academicGrade) {
      year = academicGradeToYear(lesson.academicGrade) || undefined;
    }

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
      academicGrade: lesson.academicGrade,
      year: year,
      isIcfesCourse: createdIsIcfesCourse,
      modules: createdModuleInfo,
      createdAt: lesson.createdAt,
      updatedAt: lesson.createdAt,
    };

    return NextResponse.json(transformedLesson, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 