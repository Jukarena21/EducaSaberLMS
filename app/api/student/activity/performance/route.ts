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
    const period = searchParams.get('period') || '30'; // días
    const competencyId = searchParams.get('competencyId');

    const userId = session.user.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Obtener rendimiento por competencia (solo exámenes completados)
    const competencyPerformance = await prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { 
          not: null,
          gte: startDate 
        },
        ...(competencyId && {
          exam: {
            competencyId,
          },
        }),
      },
      include: {
        exam: {
          include: {
            competency: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Agrupar por competencia
    const performanceByCompetency = competencyPerformance.reduce((acc, result) => {
      const competencyName = result.exam.competency?.displayName || 'General';
      if (!acc[competencyName]) {
        acc[competencyName] = {
          competency: result.exam.competency,
          exams: [],
          totalScore: 0,
          totalQuestions: 0,
          examCount: 0,
          passedCount: 0,
        };
      }
      
      acc[competencyName].exams.push(result);
      acc[competencyName].totalScore += result.score;
      acc[competencyName].totalQuestions += result.totalQuestions;
      acc[competencyName].examCount += 1;
      if (result.passed) {
        acc[competencyName].passedCount += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios y métricas
    const performanceMetrics = Object.entries(performanceByCompetency).map(([competencyName, data]) => ({
      competency: data.competency,
      competencyName,
      averageScore: data.examCount > 0 ? Math.round(data.totalScore / data.examCount) : 0,
      examCount: data.examCount,
      passedCount: data.passedCount,
      passRate: data.examCount > 0 ? Math.round((data.passedCount / data.examCount) * 100) : 0,
      recentExams: data.exams.slice(0, 5), // Últimos 5 exámenes
      trend: calculateTrend(data.exams), // Tendencia de mejora/empeoramiento
    }));

    // Obtener progreso de lecciones por competencia
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        completedAt: { gte: startDate },
        ...(competencyId && {
          lesson: {
            competencyId,
          },
        }),
      },
      include: {
        lesson: {
          include: {
            competency: true,
          },
        },
      },
    });

    // Agrupar progreso de lecciones por competencia
    const lessonProgressByCompetency = lessonProgress.reduce((acc, progress) => {
      const competencyName = progress.lesson.competency?.displayName || 'General';
      if (!acc[competencyName]) {
        acc[competencyName] = {
          totalLessons: 0,
          completedLessons: 0,
          totalTime: 0,
          averageProgress: 0,
        };
      }
      
      acc[competencyName].totalLessons += 1;
      if (progress.status === 'completed') {
        acc[competencyName].completedLessons += 1;
      }
      acc[competencyName].totalTime += progress.totalTimeMinutes || 0;
      acc[competencyName].averageProgress += progress.progressPercentage || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios de progreso
    Object.entries(lessonProgressByCompetency).forEach(([competencyName, data]) => {
      data.averageProgress = data.totalLessons > 0 ? Math.round(data.averageProgress / data.totalLessons) : 0;
    });

    // Combinar métricas de exámenes y lecciones
    const combinedMetrics = performanceMetrics.map(metric => ({
      ...metric,
      lessonProgress: lessonProgressByCompetency[metric.competencyName] || {
        totalLessons: 0,
        completedLessons: 0,
        totalTime: 0,
        averageProgress: 0,
      },
    }));

    // Estadísticas generales
    const overallStats = {
      totalExams: competencyPerformance.length,
      averageScore: competencyPerformance.length > 0 
        ? Math.round(competencyPerformance.reduce((sum, exam) => sum + exam.score, 0) / competencyPerformance.length)
        : 0,
      totalLessonsCompleted: lessonProgress.filter(l => l.status === 'completed').length,
      totalStudyTime: lessonProgress.reduce((sum, lesson) => sum + (lesson.totalTimeMinutes || 0), 0),
      period: parseInt(period),
      startDate,
      endDate: new Date(),
    };

    return NextResponse.json({
      performance: combinedMetrics,
      overallStats,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function calculateTrend(exams: any[]): 'improving' | 'declining' | 'stable' {
  if (exams.length < 2) return 'stable';
  
  const recent = exams.slice(0, Math.ceil(exams.length / 2));
  const older = exams.slice(Math.ceil(exams.length / 2));
  
  // score ya es un porcentaje (0-100), no necesita conversión
  const recentAvg = recent.reduce((sum, exam) => sum + exam.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, exam) => sum + exam.score, 0) / older.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}
