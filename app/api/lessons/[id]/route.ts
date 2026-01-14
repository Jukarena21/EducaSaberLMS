import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades';

// Schema de validación para actualizar lecciones
const lessonUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  estimatedTimeMinutes: z.number().min(1, 'El tiempo estimado debe ser mayor a 0'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  videoDescription: z.string().optional(),
  theoryContent: z.string().min(1, 'El contenido es requerido'),
  competencyId: z.string().optional(),
  year: z.number().min(1).max(11).optional(), // Año escolar (1-11) solo para lecciones ICFES
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
                        competency: true,
                        courseSchools: {
                          select: {
                            schoolId: true
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

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que la lección pertenece a su colegio o es general
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        );
      }
      const hasAccess = lesson.moduleLessons.some(ml => 
        ml.module.courseModules.some(cm => {
          const courseSchoolIds = cm.course.courseSchools.map(cs => cs.schoolId);
          return courseSchoolIds.length === 0 || courseSchoolIds.includes(session.user.schoolId!);
        })
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta lección' },
          { status: 403 }
        );
      }
    }

    // Convertir academicGrade a year si existe
    let year: number | undefined = undefined;
    if (lesson.academicGrade) {
      year = academicGradeToYear(lesson.academicGrade) || undefined;
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
      competencyId: lesson.competencyId,
      academicGrade: lesson.academicGrade,
      year: year,
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

    // Convertir year a academicGrade si se proporciona
    let academicGrade: string | null = null;
    if (validatedData.year) {
      academicGrade = yearToAcademicGrade(validatedData.year) || null;
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
        academicGrade: academicGrade !== null ? academicGrade : undefined, // Solo actualizar si se proporciona
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

    // Convertir academicGrade a year si existe
    let year: number | undefined = undefined;
    if (lesson.academicGrade) {
      year = academicGradeToYear(lesson.academicGrade) || undefined;
    }

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
      academicGrade: lesson.academicGrade,
      year: year,
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

    // Verificar que la lección existe y obtener información de uso
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        moduleLessons: {
          include: {
            module: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        lessonQuestions: {
          select: {
            id: true
          }
        },
        examQuestions: {
          select: {
            id: true
          }
        },
        liveClasses: {
          select: {
            id: true
          }
        }
      }
    });

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la lección está siendo usada
    const isInUse = 
      existingLesson.moduleLessons.length > 0 ||
      existingLesson.lessonQuestions.length > 0 ||
      existingLesson.examQuestions.length > 0 ||
      existingLesson.liveClasses.length > 0;

    if (isInUse) {
      const usageDetails = [];
      
      if (existingLesson.moduleLessons.length > 0) {
        const moduleNames = existingLesson.moduleLessons.map(ml => ml.module.title).join(', ');
        usageDetails.push(`${existingLesson.moduleLessons.length} módulo(s): ${moduleNames}`);
      }
      
      if (existingLesson.lessonQuestions.length > 0) {
        usageDetails.push(`${existingLesson.lessonQuestions.length} pregunta(s) asociada(s)`);
      }
      
      if (existingLesson.examQuestions.length > 0) {
        usageDetails.push(`${existingLesson.examQuestions.length} pregunta(s) en examen(es)`);
      }
      
      if (existingLesson.liveClasses.length > 0) {
        usageDetails.push(`${existingLesson.liveClasses.length} clase(s) en vivo asociada(s)`);
      }

      return NextResponse.json(
        { 
          error: 'No se puede eliminar la lección porque está siendo usada',
          details: usageDetails.join('; ')
        },
        { status: 400 }
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