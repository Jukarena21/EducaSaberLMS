import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Helpers to map between numeric year and academicGrade string
const yearToAcademicGrade = (year: number): string => {
  const map: Record<number, string> = {
    6: 'sexto',
    7: 'septimo',
    8: 'octavo',
    9: 'noveno',
    10: 'decimo',
    11: 'undecimo',
  };
  return map[year] ?? String(year);
};

const academicGradeToYear = (grade: string | null | undefined): number => {
  const map: Record<string, number> = {
    sexto: 6,
    septimo: 7,
    octavo: 8,
    noveno: 9,
    decimo: 10,
    undecimo: 11,
  };
  if (!grade) return 0 as unknown as number;
  return map[grade] ?? Number(grade);
};

// Schema de validación para cursos
const courseSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  year: z.number().min(6, 'El año debe ser al menos 6').max(11, 'El año debe ser máximo 11'),
  competencyId: z.string().min(1, 'La competencia es requerida'),
  schoolId: z.string().min(1, 'El colegio es requerido'),
  moduleIds: z.array(z.string()).optional(),
});

// GET - Listar cursos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const schoolId = searchParams.get('schoolId') || undefined;
    const competencyId = searchParams.get('competencyId') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (competencyId) {
      where.competencyId = competencyId;
    }

    if (year) {
      where.academicGrade = yearToAcademicGrade(year);
    }

    // Si es admin de colegio, solo puede ver cursos de su colegio
    if (session.user.role === 'school_admin') {
      where.schoolId = session.user.schoolId;
    }

    const courses = await prisma.course.findMany({
      where,
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
                    lastName: true
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
      orderBy: [
        { school: { name: 'asc' } },
        { competency: { name: 'asc' } },
        { academicGrade: 'asc' },
        { title: 'asc' }
      ]
    });

    // Transformar datos para el frontend
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      year: academicGradeToYear(course.academicGrade),
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
      modules: course.courseModules.map(courseModule => ({
        id: courseModule.module.id,
        title: courseModule.module.title,
        orderIndex: courseModule.orderIndex,
        createdBy: courseModule.module.createdBy ? {
          id: courseModule.module.createdBy.id,
          name: `${courseModule.module.createdBy.firstName} ${courseModule.module.createdBy.lastName}`
        } : undefined
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear curso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador y Administrador de Colegio pueden crear cursos
    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear cursos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    // Si es admin de colegio, solo puede crear cursos para su colegio
    if (session.user.role === 'school_admin' && validatedData.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'Solo puedes crear cursos para tu colegio' },
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

    // Validación crítica: Verificar que no existe otro curso con la misma competencia/año/colegio
    const existingCourse = await prisma.course.findFirst({
      where: {
        schoolId: validatedData.schoolId,
        competencyId: validatedData.competencyId,
        academicGrade: yearToAcademicGrade(validatedData.year),
      }
    });

    if (existingCourse) {
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

    // Crear el curso
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        academicGrade: yearToAcademicGrade(validatedData.year),
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
        courseModules: true
      }
    });

    // Asociar módulos si se especificaron
    if (validatedData.moduleIds && validatedData.moduleIds.length > 0) {
      // Evitar duplicados en la misma selección y asignar orden por posición
      const uniqueModuleIds = Array.from(new Set(validatedData.moduleIds));
      await prisma.courseModule.createMany({
        data: uniqueModuleIds.map((moduleId, index) => ({
          courseId: course.id,
          moduleId,
          orderIndex: index + 1,
        }))
      });

      // Recargar el curso con los módulos asociados
      const courseWithModules = await prisma.course.findUnique({
        where: { id: course.id },
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

      if (courseWithModules) {
        // Transformar respuesta
        const transformedCourse = {
          id: courseWithModules.id,
          title: courseWithModules.title,
          description: courseWithModules.description,
          year: academicGradeToYear(courseWithModules.academicGrade),
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
          modules: courseWithModules.courseModules.map(cm => ({
            id: cm.module.id,
            title: cm.module.title,
            orderIndex: cm.orderIndex,
            createdBy: cm.module.createdBy ? {
              id: cm.module.createdBy.id,
              name: `${cm.module.createdBy.firstName} ${cm.module.createdBy.lastName}`
            } : undefined
          })),
          createdAt: courseWithModules.createdAt,
          updatedAt: courseWithModules.updatedAt
        };

        return NextResponse.json(transformedCourse, { status: 201 });
      }
    }

    // Transformar respuesta sin módulos
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      year: academicGradeToYear(course.academicGrade),
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
      modules: [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    return NextResponse.json(transformedCourse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear curso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 