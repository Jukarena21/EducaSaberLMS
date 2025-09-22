import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = await params;
    const userId = session.user.id;

    // Verificar que el estudiante está inscrito en el curso
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
        isActive: true,
      },
      include: {
        course: {
          include: {
            competency: true,
            courseModules: {
              include: {
                module: {
                  include: {
                    moduleLessons: {
                      include: {
                        lesson: true,
                      },
                      orderBy: {
                        orderIndex: 'asc',
                      },
                    },
                  },
                },
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'No estás inscrito en este curso' }, { status: 404 });
    }

    // Obtener progreso del estudiante para cada módulo
    const moduleProgress = await prisma.studentModuleProgress.findMany({
      where: {
        userId,
        moduleId: {
          in: enrollment.course.courseModules.map(cm => cm.module.id),
        },
      },
    });

    // Obtener progreso del estudiante para cada lección
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        lessonId: {
          in: enrollment.course.courseModules.flatMap(cm => 
            cm.module.moduleLessons.map(ml => ml.lesson.id)
          ),
        },
      },
    });

    // Crear mapa de progreso para acceso rápido
    const moduleProgressMap = new Map(
      moduleProgress.map(mp => [mp.moduleId, mp])
    );
    const lessonProgressMap = new Map(
      lessonProgress.map(lp => [lp.lessonId, lp])
    );

    // Procesar módulos con progreso
    const modulesWithProgress = enrollment.course.courseModules.map(courseModule => {
      const module = courseModule.module;
      const progress = moduleProgressMap.get(module.id);
      
      const lessonsWithProgress = module.moduleLessons.map(moduleLesson => {
        const lesson = moduleLesson.lesson;
        const lessonProgressData = lessonProgressMap.get(lesson.id);
        
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          estimatedTimeMinutes: lesson.estimatedTimeMinutes,
          status: lessonProgressData?.status || 'not_started',
          progressPercentage: lessonProgressData?.progressPercentage || 0,
          totalTimeMinutes: lessonProgressData?.totalTimeMinutes || 0,
          completedAt: lessonProgressData?.completedAt,
        };
      });

      // Calcular progreso del módulo
      const completedLessons = lessonsWithProgress.filter(l => l.status === 'completed').length;
      const totalLessons = lessonsWithProgress.length;
      const moduleProgressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      
      // Determinar estado del módulo
      let moduleStatus = 'not_started';
      if (completedLessons === totalLessons && totalLessons > 0) {
        moduleStatus = 'completed';
      } else if (completedLessons > 0) {
        moduleStatus = 'in_progress';
      }

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        estimatedTimeMinutes: module.estimatedTimeMinutes,
        orderIndex: courseModule.orderIndex,
        totalLessons: totalLessons,
        completedLessonsCount: completedLessons,
        progressPercentage: moduleProgressPercentage,
        status: moduleStatus,
        lessons: lessonsWithProgress,
      };
    });

    // Crear lista plana de todas las lecciones para la pestaña "Todas las Lecciones"
    const allLessons = modulesWithProgress.flatMap(module => 
      module.lessons.map(lesson => ({
        ...lesson,
        moduleTitle: module.title,
        moduleId: module.id,
      }))
    );

    // Calcular progreso general del curso
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter(l => l.status === 'completed').length;
    const courseProgressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Determinar estado del curso
    let courseStatus = 'not_started';
    if (completedLessons === totalLessons && totalLessons > 0) {
      courseStatus = 'completed';
    } else if (completedLessons > 0) {
      courseStatus = 'in_progress';
    }

    // Calcular tiempo total estudiado
    const totalTimeMinutes = allLessons.reduce((sum, lesson) => sum + lesson.totalTimeMinutes, 0);

    return NextResponse.json({
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        competency: enrollment.course.competency?.displayName || 'General',
        academicGrade: enrollment.course.academicGrade,
        difficultyLevel: enrollment.course.difficultyLevel,
        durationHours: enrollment.course.durationHours,
        totalModules: enrollment.course.totalModules,
        totalLessons: enrollment.course.totalLessons,
      },
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        isActive: enrollment.isActive,
        status: courseStatus,
        progressPercentage: courseProgressPercentage,
        completedModulesCount: modulesWithProgress.filter(m => m.status === 'completed').length,
        totalTimeMinutes,
      },
      modules: modulesWithProgress,
      allLessons,
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
