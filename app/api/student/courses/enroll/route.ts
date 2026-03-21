import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notificationService'
import { AchievementService } from '@/lib/achievementService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 })
    }

    // Verificar que el curso existe y está activo
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        competency: true,
        courseModules: {
          include: {
            module: {
              include: {
                moduleLessons: true
              }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: 'Este curso no está publicado aún. Contacta a tu institución.' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante no esté ya inscrito
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'Ya estás inscrito en este curso',
        enrollment: existingEnrollment
      }, { status: 400 })
    }

    // Obtener información del estudiante para validar prerequisitos
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Crear la inscripción
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId
      },
      include: {
        course: {
          include: {
            competency: true
          }
        }
      }
    })

    // Crear registros de progreso iniciales para todas las lecciones del curso
    const allLessons = course.courseModules.flatMap(cm => 
      cm.module.moduleLessons.map(ml => ml.lesson)
    )

    const progressRecords = allLessons.map(lesson => ({
      userId,
      lessonId: lesson.id,
      status: 'no_iniciado',
      progressPercentage: 0
    }))

    if (progressRecords.length > 0) {
      await prisma.studentLessonProgress.createMany({
        data: progressRecords,
        skipDuplicates: true
      })
    }

    // Crear notificación de inscripción exitosa
    try {
      await NotificationService.createCourseEnrolledNotification(
        userId,
        course.title,
        course.id
      );
    } catch (notificationError) {
      console.error('Error creating enrollment notification:', notificationError);
      // No fallar la inscripción por error en notificación
    }

    // Verificar logros relacionados con inscripción a cursos
    try {
      await AchievementService.checkAndUnlockAchievements(
        userId, 
        'course_enrolled',
        { 
          courseId: course.id,
          courseTitle: course.title,
          competency: course.competency?.name
        }
      );
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      // No fallar la inscripción por error en logros
    }

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          competency: enrollment.course.competency?.name || 'General',
          academicGrade: enrollment.course.academicGrade
        },
        enrolledAt: enrollment.enrolledAt,
        isActive: enrollment.isActive
      }
    })

  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
