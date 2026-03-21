import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades';

// Schema de validación para actualizar cursos
const courseUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  year: z.number().min(1, 'El año debe ser al menos 1').max(11, 'El año debe ser máximo 11').optional(),
  competencyId: z.string().min(1, 'La área es obligatoria'),
  schoolIds: z.array(z.string()).optional(), // Array de IDs de colegios (puede estar vacío para curso general)
  moduleIds: z.array(z.string()).optional(), // Array de IDs de módulos (puede estar vacío)
  isIcfesCourse: z.boolean().optional(),
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
            name: true,
            displayName: true
          }
        },
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

    // Si es admin de colegio, verificar que el curso pertenece a su colegio o es general
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        );
      }
      const hasAccess = course.courseSchools.length === 0 || // Curso general
        course.courseSchools.some(cs => cs.schoolId === session.user.schoolId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver este curso' },
          { status: 403 }
        );
      }
    }

    // Convertir academicGrade a year (solo si existe academicGrade)
    let year: number | undefined = undefined;
    if (course.academicGrade) {
      year = academicGradeToYear(course.academicGrade) || undefined;
    }

    // Transformar datos
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      year: year,
      competencyId: course.competencyId,
      isIcfesCourse: course.isIcfesCourse,
      competency: course.competency ? {
        id: course.competency.id,
        name: course.competency.name,
        displayName: course.competency.displayName
      } : undefined,
      schoolIds: course.courseSchools.map(cs => cs.schoolId),
      schools: course.courseSchools.map(cs => ({
        id: cs.school.id,
        name: cs.school.name,
        type: cs.school.type
      })),
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
    
    // Asegurar que los arrays sean arrays válidos o undefined
    if (body.moduleIds !== undefined) {
      if (!Array.isArray(body.moduleIds)) {
        body.moduleIds = [];
      }
    }
    if (body.schoolIds !== undefined) {
      if (!Array.isArray(body.schoolIds)) {
        body.schoolIds = [];
      }
    }
    
    // Log para debugging
    console.log('📝 [PUT /api/courses/[id]] Body recibido:', JSON.stringify(body, null, 2));
    
    let validatedData;
    try {
      validatedData = courseUpdateSchema.parse(body);
      console.log('✅ [PUT /api/courses/[id]] Datos validados correctamente');
    } catch (validationError) {
      console.error('❌ [PUT /api/courses/[id]] Error de validación:', validationError);
      if (validationError instanceof z.ZodError) {
        console.error('❌ [PUT /api/courses/[id]] Detalles del error:', JSON.stringify(validationError.errors, null, 2));
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que el curso existe
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        courseSchools: {
          select: {
            schoolId: true
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Convertir year a academicGrade (solo si es ICFES y se proporciona year)
    let academicGrade: string | null = null;
    if (validatedData.isIcfesCourse && validatedData.year) {
      academicGrade = yearToAcademicGrade(validatedData.year) || null;
    } else if (!validatedData.isIcfesCourse) {
      // Para cursos generales, academicGrade debe ser null
      academicGrade = null;
    }

    // Si es admin de colegio, verificar que el curso pertenece a su colegio o es general
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        );
      }
      const existingSchoolIds = existingCourse.courseSchools.map(cs => cs.schoolId);
      const hasAccess = existingSchoolIds.length === 0 || existingSchoolIds.includes(session.user.schoolId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Solo puedes actualizar cursos de tu colegio' },
          { status: 403 }
        );
      }
      // Si se especifican schoolIds, debe incluir su colegio
      if (validatedData.schoolIds && validatedData.schoolIds.length > 0) {
        if (!validatedData.schoolIds.includes(session.user.schoolId)) {
          return NextResponse.json(
            { error: 'Debes incluir tu colegio en la asignación' },
            { status: 403 }
          );
        }
      } else {
        // Si no se especifican, usar solo su colegio
        validatedData.schoolIds = [session.user.schoolId];
      }
    }

    // Verificar que el área existe (modelo Area en BD)
    const competency = await prisma.area.findUnique({
      where: { id: validatedData.competencyId }
    });

    if (!competency) {
      return NextResponse.json(
        { error: 'La área especificada no existe' },
        { status: 400 }
      );
    }

    // Verificar que los colegios existen (si se especificaron)
    let schools: Array<{ id: string; name: string }> = [];
    if (validatedData.schoolIds && validatedData.schoolIds.length > 0) {
      schools = await prisma.school.findMany({
        where: { id: { in: validatedData.schoolIds } },
        select: {
          id: true,
          name: true
        }
      });

      if (schools.length !== validatedData.schoolIds.length) {
        return NextResponse.json(
          { error: 'Uno o más colegios especificados no existen' },
          { status: 400 }
        );
      }
    }

    // Validación crítica: Verificar que no existe otro curso con la misma competencia/año/colegio (excluyendo el actual)
    // Solo aplica si se especifican schoolIds
    if (validatedData.schoolIds && validatedData.schoolIds.length > 0) {
      for (const schoolId of validatedData.schoolIds) {
        const existingCourseConflict = await prisma.course.findFirst({
          where: {
            id: { not: id },
            competencyId: validatedData.competencyId,
            academicGrade: academicGrade,
            courseSchools: {
              some: {
                schoolId: schoolId
              }
            }
          }
        });

        if (existingCourseConflict) {
          const school = schools.find(s => s.id === schoolId);
          const yearText = validatedData.year ? `${validatedData.year}° grado` : 'este tipo';
          return NextResponse.json(
            { 
              error: `Ya existe un curso de ${competency.displayName || competency.name} para ${yearText} en ${school?.name || 'este colegio'}. Solo se permite un curso por área/año por colegio.` 
            },
            { status: 400 }
          );
        }
      }
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
        academicGrade: academicGrade,
        competencyId: validatedData.competencyId,
        ...(validatedData.isIcfesCourse !== undefined ? { isIcfesCourse: validatedData.isIcfesCourse } : {}),
      },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
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
        },
        courseModules: {
          include: {
            module: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    // Actualizar asignaciones de colegios
    if (validatedData.schoolIds !== undefined) {
      // Eliminar todas las asignaciones existentes
      await prisma.courseSchool.deleteMany({
        where: { courseId: id }
      });

      // Crear nuevas asignaciones si se especificaron colegios
      if (validatedData.schoolIds.length > 0) {
        await prisma.courseSchool.createMany({
          data: validatedData.schoolIds.map((schoolId: string) => ({
            courseId: id,
            schoolId: schoolId
          }))
        });
      }
    }

    // Actualizar módulos asociados
    if (validatedData.moduleIds !== undefined) {
      // Eliminar todas las asociaciones existentes
      await prisma.courseModule.deleteMany({
        where: { courseId: id }
      });

      // Crear nuevas asociaciones si se especificaron módulos
      if (validatedData.moduleIds.length > 0) {
        await prisma.courseModule.createMany({
          data: validatedData.moduleIds.map((moduleId, index) => ({
            courseId: id,
            moduleId: moduleId,
            orderIndex: index + 1
          }))
        });
      }

      await prisma.course.update({
        where: { id },
        data: { totalModules: validatedData.moduleIds.length }
      });

      // Recargar el curso con los módulos actualizados
      const courseWithModules = await prisma.course.findUnique({
        where: { id },
        include: {
          competency: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          },
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
          },
          courseModules: {
            include: {
              module: {
                select: {
                  id: true,
                  title: true
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
        // Convertir academicGrade a year (solo si existe academicGrade)
        let year: number | undefined = undefined;
        if (courseWithModules.academicGrade) {
          year = academicGradeToYear(courseWithModules.academicGrade) || undefined;
        }

        // Transformar respuesta
        const transformedCourse = {
          id: courseWithModules.id,
          title: courseWithModules.title,
          description: courseWithModules.description,
          year: year,
          competencyId: courseWithModules.competencyId,
          competency: courseWithModules.competency ? {
            id: courseWithModules.competency.id,
            name: courseWithModules.competency.name,
            displayName: courseWithModules.competency.displayName
          } : undefined,
          schoolIds: courseWithModules.courseSchools.map(cs => cs.schoolId),
          schools: courseWithModules.courseSchools.map(cs => ({
            id: cs.school.id,
            name: cs.school.name,
            type: cs.school.type
          })),
          modules: courseWithModules.courseModules.map(cm => ({
            id: cm.module.id,
            title: cm.module.title,
            orderIndex: cm.orderIndex
          })),
          createdAt: courseWithModules.createdAt,
          updatedAt: courseWithModules.updatedAt
        };

        return NextResponse.json(transformedCourse);
      }
    }

    // Recargar el curso actualizado
    const updatedCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
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
        },
        courseModules: {
          include: {
            module: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!updatedCourse) {
      return NextResponse.json(
        { error: 'Error al recargar el curso' },
        { status: 500 }
      );
    }

    // Convertir academicGrade a year (solo si existe academicGrade)
    let year: number | undefined = undefined;
    if (updatedCourse.academicGrade) {
      year = academicGradeToYear(updatedCourse.academicGrade) || undefined;
    }

    // Transformar respuesta sin actualizar módulos
    const transformedCourse = {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      year: year,
      competencyId: updatedCourse.competencyId,
      competency: updatedCourse.competency ? {
        id: updatedCourse.competency.id,
        name: updatedCourse.competency.name,
        displayName: updatedCourse.competency.displayName
      } : undefined,
      schoolIds: updatedCourse.courseSchools.map(cs => cs.schoolId),
      schools: updatedCourse.courseSchools.map(cs => ({
        id: cs.school.id,
        name: cs.school.name,
        type: cs.school.type
      })),
      modules: updatedCourse.courseModules.map(cm => ({
        id: cm.module.id,
        title: cm.module.title,
        orderIndex: cm.orderIndex
      })),
      createdAt: updatedCourse.createdAt,
      updatedAt: updatedCourse.updatedAt
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

/** Publicar / despublicar curso (visible para estudiantes solo si está publicado) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar cursos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (typeof body.isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere isPublished (boolean)' },
        { status: 400 }
      );
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        );
      }
      const existingSchoolIds = existingCourse.courseSchools.map(cs => cs.schoolId);
      const hasAccess =
        existingSchoolIds.length === 0 || existingSchoolIds.includes(session.user.schoolId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Solo puedes modificar cursos de tu colegio' },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { isPublished: body.isPublished }
    });

    return NextResponse.json({
      id: updated.id,
      isPublished: updated.isPublished,
      title: updated.title
    });
  } catch (error) {
    console.error('Error al actualizar publicación del curso:', error);
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
      where: { id },
      include: {
        courseSchools: {
          select: {
            schoolId: true
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que el curso pertenece a su colegio o es general
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        );
      }
      const existingSchoolIds = existingCourse.courseSchools.map(cs => cs.schoolId);
      const hasAccess = existingSchoolIds.length === 0 || existingSchoolIds.includes(session.user.schoolId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Solo puedes eliminar cursos de tu colegio' },
          { status: 403 }
        );
      }
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