import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // 'all', 'lessons', 'exams', 'courses'

    const userId = session.user.id;

    // Obtener historial de lecciones
    const lessonHistory = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        ...(type === 'lessons' && { status: 'completed' }),
      },
      include: {
        lesson: {
          include: {
            competency: true,
            moduleLessons: {
              include: {
                module: {
                  include: {
                    courseModules: {
                      include: {
                        course: {
                          select: {
                            id: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: type === 'lessons' ? limit : Math.ceil(limit / 3),
    });

    // Obtener historial de exámenes (solo completados)
    const examHistory = await prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { not: null }, // Solo exámenes completados
        ...(type === 'exams' && {}),
      },
      include: {
        exam: {
          include: {
            competency: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: type === 'exams' ? limit : Math.ceil(limit / 3),
    });

    // Obtener historial de inscripciones a cursos
    const enrollmentHistory = await prisma.courseEnrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            competency: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: type === 'courses' ? limit : Math.ceil(limit / 3),
    });

    // Combinar y ordenar por fecha, filtrando por tipo si se especifica
    const allActivities = [
      ...(type === 'all' || type === 'lessons' || !type ? lessonHistory.map(progress => {
        // Obtener el primer curso disponible de la lección
        const firstCourseId = progress.lesson.moduleLessons?.[0]?.module?.courseModules?.[0]?.course?.id || '';
        
        return {
          id: `lesson-${progress.id}`,
          type: 'lesson_completed' as const,
          title: `Lección completada: ${progress.lesson.title}`,
          description: `Completaste la lección de ${progress.lesson.competency?.displayName || 'General'}`,
          date: progress.completedAt || progress.updatedAt,
          metadata: {
            lessonId: progress.lesson.id,
            lessonTitle: progress.lesson.title,
            competency: progress.lesson.competency?.displayName,
            progressPercentage: progress.progressPercentage,
          },
          actionUrl: firstCourseId ? `/estudiante/cursos/${firstCourseId}/leccion/${progress.lesson.id}` : `/estudiante`,
        };
      }) : []),
      ...(type === 'all' || type === 'exams' || !type ? examHistory.map(result => ({
        id: `exam-${result.id}`,
        type: 'exam_completed' as const,
        title: `Examen completado: ${result.exam.title}`,
        description: `Puntuación: ${result.score}%${result.isPassed ? ' (Aprobado)' : ' (No aprobado)'}`,
        date: result.completedAt || result.createdAt,
        metadata: {
          examId: result.exam.id,
          examTitle: result.exam.title,
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage: result.score, // score ya es un porcentaje (0-100)
          passed: result.isPassed,
          competency: result.exam.competency?.displayName,
        },
        actionUrl: `/estudiante/examen/resultado/${result.id}`,
      })) : []),
      ...(type === 'all' || type === 'courses' || !type ? enrollmentHistory.map(enrollment => ({
        id: `enrollment-${enrollment.id}`,
        type: 'course_enrolled' as const,
        title: `Curso inscrito: ${enrollment.course.title}`,
        description: `Te inscribiste al curso de ${enrollment.course.competency?.displayName || 'General'}`,
        date: enrollment.enrolledAt,
        metadata: {
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          competency: enrollment.course.competency?.displayName,
          academicGrade: enrollment.course.academicGrade,
        },
        actionUrl: `/estudiante/cursos/${enrollment.course.id}`,
      })) : []),
    ];

    // Ordenar por fecha descendente
    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Aplicar paginación
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    // Estadísticas del historial
    const stats = {
      totalActivities: allActivities.length,
      lessonsCompleted: lessonHistory.filter(l => l.status === 'completed').length,
      examsCompleted: examHistory.length,
      coursesEnrolled: enrollmentHistory.length,
      averageExamScore: examHistory.length > 0 
        ? Math.round(examHistory.reduce((sum, exam) => sum + exam.score, 0) / examHistory.length)
        : 0,
      totalStudyTime: lessonHistory.reduce((sum, lesson) => sum + (lesson.totalTimeMinutes || 0), 0),
    };

    return NextResponse.json({
      activities: paginatedActivities,
      stats,
      pagination: {
        total: allActivities.length,
        limit,
        offset,
        hasMore: offset + limit < allActivities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
