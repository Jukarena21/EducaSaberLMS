import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const questionUpdateSchema = z.object({
  lessonId: z.string().optional().or(z.literal('')),
  
  // Contenido de la pregunta
  questionText: z.string().min(1, 'El enunciado es requerido'),
  questionImage: z.string().url().optional().or(z.literal('')),
  questionType: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'matching', 'essay']).default('multiple_choice'),
  
  // Opciones de respuesta
  optionA: z.string().min(1, 'La opción A es requerida'),
  optionB: z.string().min(1, 'La opción B es requerida'),
  optionC: z.string().min(1, 'La opción C es requerida'),
  optionD: z.string().min(1, 'La opción D es requerida'),
  optionAImage: z.string().url().optional().or(z.literal('')),
  optionBImage: z.string().url().optional().or(z.literal('')),
  optionCImage: z.string().url().optional().or(z.literal('')),
  optionDImage: z.string().url().optional().or(z.literal('')),
  
  correctOption: z.enum(['A', 'B', 'C', 'D'], { message: 'La opción correcta debe ser A, B, C o D' }),
  explanation: z.string().optional(),
  explanationImage: z.string().url().optional().or(z.literal('')),
  
  // Metadatos
  orderIndex: z.number().int().min(0),
  difficultyLevel: z.enum(['facil', 'medio', 'dificil']).default('medio'),
  timeLimit: z.number().int().min(1).optional(),
});

// GET - Obtener pregunta específica
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

    const question = await prisma.lessonQuestion.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleLessons: {
              select: {
                module: {
                  select: {
                    id: true,
                    title: true,
                    courseModules: {
                      select: {
                        course: {
                          select: {
                            id: true,
                            title: true,
                            competency: {
                              select: {
                                id: true,
                                name: true,
                                displayName: true,
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

    if (!question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Si es admin de colegio, verificar que la pregunta pertenece a su colegio
    if (session.user.role === 'school_admin') {
      const hasAccess = question.lesson.moduleLessons.some(ml => 
        ml.module.courseModules.some(cm => 
          cm.course.schoolId === session.user.schoolId
        )
      );
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver esta pregunta' },
          { status: 403 }
        );
      }
    }

    // Transformar datos
    const firstModuleLesson = question.lesson.moduleLessons[0];
    const module = firstModuleLesson?.module;
    const firstCourseModule = module?.courseModules[0];
    const course = firstCourseModule?.course;
    const competency = course?.competency;

    const transformedQuestion = {
      id: question.id,
      lessonId: question.lessonId,
      
      // Contenido de la pregunta
      questionText: question.questionText,
      questionImage: question.questionImage,
      questionType: question.questionType,
      
      // Opciones de respuesta
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionAImage: question.optionAImage,
      optionBImage: question.optionBImage,
      optionCImage: question.optionCImage,
      optionDImage: question.optionDImage,
      
      correctOption: question.correctOption,
      explanation: question.explanation,
      explanationImage: question.explanationImage,
      
      // Metadatos
      orderIndex: question.orderIndex,
      difficultyLevel: question.difficultyLevel,
      timeLimit: question.timeLimit,
      
      lesson: {
        id: question.lesson.id,
        title: question.lesson.title,
        modules: module ? [{
          moduleId: module.id,
          moduleTitle: module.title,
          orderIndex: firstModuleLesson.orderIndex,
          course: course ? {
            id: course.id,
            title: course.title,
            competency: competency ? {
              id: competency.id,
              name: competency.name
            } : undefined
          } : undefined,
          competency: competency ? {
            id: competency.id,
            name: competency.name
          } : undefined
        }] : []
      },
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };

    return NextResponse.json(transformedQuestion);
  } catch (error) {
    console.error('Error al obtener pregunta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar pregunta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede actualizar preguntas
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar preguntas' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = questionUpdateSchema.parse(body);

    // Verificar que la pregunta existe
    const existingQuestion = await prisma.lessonQuestion.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Validate if provided
    if (validatedData.lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: validatedData.lessonId } });
      if (!lesson) {
        return NextResponse.json({ error: 'La lección especificada no existe' }, { status: 400 });
      }
    }

    const question = await prisma.lessonQuestion.update({
      where: { id },
      data: {
        lessonId: validatedData.lessonId || null,
        
        // Contenido de la pregunta
        questionText: validatedData.questionText,
        questionImage: validatedData.questionImage || null,
        questionType: validatedData.questionType,
        
        // Opciones de respuesta
        optionA: validatedData.optionA,
        optionB: validatedData.optionB,
        optionC: validatedData.optionC,
        optionD: validatedData.optionD,
        optionAImage: validatedData.optionAImage || null,
        optionBImage: validatedData.optionBImage || null,
        optionCImage: validatedData.optionCImage || null,
        optionDImage: validatedData.optionDImage || null,
        
        correctOption: validatedData.correctOption,
        explanation: validatedData.explanation,
        explanationImage: validatedData.explanationImage || null,
        
        // Metadatos
        orderIndex: validatedData.orderIndex,
        difficultyLevel: validatedData.difficultyLevel,
        timeLimit: validatedData.timeLimit || null,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            moduleLessons: {
              select: {
                module: {
                  select: {
                    id: true,
                    title: true,
                    courseModules: {
                      select: {
                        course: {
                          select: {
                            id: true,
                            title: true,
                            competency: {
                              select: {
                                id: true,
                                name: true,
                                displayName: true,
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
    const firstModuleLesson = question.lesson.moduleLessons[0];
    const module = firstModuleLesson?.module;
    const firstCourseModule = module?.courseModules[0];
    const course = firstCourseModule?.course;
    const competency = course?.competency;

    const transformedQuestion = {
      id: question.id,
      lessonId: question.lessonId,
      
      // Contenido de la pregunta
      questionText: question.questionText,
      questionImage: question.questionImage,
      questionType: question.questionType,
      
      // Opciones de respuesta
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionAImage: question.optionAImage,
      optionBImage: question.optionBImage,
      optionCImage: question.optionCImage,
      optionDImage: question.optionDImage,
      
      correctOption: question.correctOption,
      explanation: question.explanation,
      explanationImage: question.explanationImage,
      
      // Metadatos
      orderIndex: question.orderIndex,
      difficultyLevel: question.difficultyLevel,
      timeLimit: question.timeLimit,
      
      lesson: {
        id: question.lesson.id,
        title: question.lesson.title,
        modules: module ? [{
          moduleId: module.id,
          moduleTitle: module.title,
          orderIndex: firstModuleLesson.orderIndex,
          course: course ? {
            id: course.id,
            title: course.title,
            competency: competency ? {
              id: competency.id,
              name: competency.name
            } : undefined
          } : undefined,
          competency: competency ? {
            id: competency.id,
            name: competency.name
          } : undefined
        }] : []
      },
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };

    return NextResponse.json(transformedQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar pregunta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar pregunta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo Profesor Administrador puede eliminar preguntas
    if (session.user.role !== 'teacher_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar preguntas' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que la pregunta existe
    const existingQuestion = await prisma.lessonQuestion.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la pregunta
    await prisma.lessonQuestion.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Pregunta eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}