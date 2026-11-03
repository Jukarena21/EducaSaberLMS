import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isExamFeedbackReleased } from '@/lib/examFeedbackPolicy'
import { regularExamVisibilityWhere, studentEnrolledCourseIds } from '@/lib/exams/studentAccess'
import { academicGradeAliases } from '@/lib/academicGrades'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    // Obtener información del estudiante (para verificar asignaciones y colegio)
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    })

    // Obtener asignaciones directas de simulacros manuales
    const manualSimulacroAssignments = await prisma.examAssignment.findMany({
      where: {
        userId,
        isActive: true,
        exam: {
          isManualSimulacro: true,
          isPublished: true,
          examQuestions: {
            some: {} // Asegurar que tenga al menos una pregunta
          }
        }
      },
      include: {
        exam: {
          include: {
            competency: true,
            examQuestions: true,
            examResults: {
              where: { userId },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    })

    // Obtener información del estudiante con academicGrade
    const studentWithGrade = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        schoolId: true,
        academicGrade: true
      }
    })

    // Obtener simulacros manuales asignados al colegio del estudiante (filtrado por año escolar)
    const schoolManualSimulacros = studentWithGrade?.schoolId ? await prisma.examSchool.findMany({
      where: {
        schoolId: studentWithGrade.schoolId,
        academicGrade: studentWithGrade.academicGrade
          ? { in: academicGradeAliases(studentWithGrade.academicGrade) }
          : undefined,
        isActive: true,
        exam: {
          isManualSimulacro: true,
          isPublished: true,
          examQuestions: {
            some: {} // Asegurar que tenga al menos una pregunta
          }
        }
      },
      include: {
        exam: {
          include: {
            competency: true,
            examQuestions: true,
            examResults: {
              where: { userId },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    }) : []

    const enrolledCourseIds = await studentEnrolledCourseIds(userId)

    // Exámenes normales del estudiante: su curso o, si no tiene curso, asignados / globales
    const availableExams = await prisma.exam.findMany({
      where: regularExamVisibilityWhere(
        userId,
        studentWithGrade?.schoolId ?? null,
        enrolledCourseIds
      ),
      include: {
        competency: true,
        course: true,
        examQuestions: true,
        examResults: {
          where: { userId },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { openDate: 'asc' } // Ordenar por fecha de apertura
    })

    // Combinar exámenes normales con simulacros manuales asignados
    const allExams = [
      ...availableExams,
      ...manualSimulacroAssignments.map(a => a.exam),
      ...schoolManualSimulacros.map(s => s.exam)
    ]

    // Eliminar duplicados (si un simulacro está asignado directo y por colegio)
    const uniqueExams = Array.from(
      new Map(allExams.map(exam => [exam.id, exam])).values()
    )

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Student Exams Debug]', {
        userId,
        studentSchoolId: studentWithGrade?.schoolId,
        studentAcademicGrade: studentWithGrade?.academicGrade,
        directAssignments: manualSimulacroAssignments.length,
        schoolAssignments: schoolManualSimulacros.length,
        totalUniqueExams: uniqueExams.length,
        examIds: uniqueExams.map(e => ({ id: e.id, title: e.title, isPublished: e.isPublished, totalQuestions: e.examQuestions.length }))
      })
    }

    // Filtrar exámenes que el estudiante puede tomar
    // IMPORTANTE: Solo incluir exámenes con preguntas
    const examsWithQuestions = uniqueExams.filter(exam => exam.examQuestions && exam.examQuestions.length > 0)
    
    const exams = examsWithQuestions.map(exam => {
      // Para simulacros manuales, verificar fechas de asignación
      let effectiveOpenDate = exam.openDate
      let effectiveCloseDate = exam.closeDate

      if (exam.isManualSimulacro) {
        // Buscar asignación directa
        const directAssignment = manualSimulacroAssignments.find(a => a.examId === exam.id)
        if (directAssignment) {
          effectiveOpenDate = directAssignment.openDate || exam.openDate || null
          effectiveCloseDate = directAssignment.closeDate || exam.closeDate || null
        } else {
          // Buscar asignación por colegio
          const schoolAssignment = schoolManualSimulacros.find(s => s.examId === exam.id)
          if (schoolAssignment) {
            effectiveOpenDate = schoolAssignment.openDate || exam.openDate || null
            effectiveCloseDate = schoolAssignment.closeDate || exam.closeDate || null
          }
        }
      }
      
      // Para simulacros manuales sin fechas, permitir acceso siempre (si está asignado)
      // Las fechas son opcionales para simulacros manuales

      // Buscar el resultado más reciente, priorizando los no completados (en progreso)
      const inProgressResult = exam.examResults.find(r => r.completedAt === null)
      const completedResult = exam.examResults.find(r => r.completedAt !== null)
      const lastResult = inProgressResult || completedResult || exam.examResults[0]
      
      // El puntaje solo se revela cuando el examen ya liberó retroalimentación
      const feedbackReleased = isExamFeedbackReleased({ closeDate: effectiveCloseDate })

      // Determinar el estado del examen
      let status: 'not_attempted' | 'in_progress' | 'submitted' | 'passed' | 'failed' =
        'not_attempted'
      let canRetake = false

      if (lastResult) {
        // Si completedAt es null, el examen está en progreso
        if (lastResult.completedAt === null) {
          status = 'in_progress'
          canRetake = true // Puede continuar el examen en progreso
        } else if (!feedbackReleased) {
          // Entregado pero aún sin liberar resultados: estado neutro
          status = 'submitted'
          const completedCount = exam.examResults.filter((r) => r.completedAt !== null).length
          const allowed = Math.max(1, (exam as { maxAttempts?: number }).maxAttempts ?? 1)
          canRetake = completedCount < allowed
        } else {
          // El examen está completado
          status = lastResult.isPassed ? 'passed' : 'failed'
          const completedCount = exam.examResults.filter((r) => r.completedAt !== null).length
          const allowed = Math.max(1, (exam as { maxAttempts?: number }).maxAttempts ?? 1)
          canRetake = completedCount < allowed
        }
      }
      
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        isManualSimulacro: exam.isManualSimulacro || false,
        competency: exam.competency?.name || 'General',
        course: (exam as { course?: { title?: string } | null }).course?.title || 'General',
        timeLimitMinutes: exam.timeLimitMinutes,
        totalQuestions: exam.examQuestions.length,
        passingScore: exam.passingScore,
        openDate: effectiveOpenDate ? effectiveOpenDate.toISOString() : null,
        closeDate: effectiveCloseDate ? effectiveCloseDate.toISOString() : null,
        feedbackReleased,
        lastAttempt: lastResult ? {
          resultId: lastResult.id,
          score: feedbackReleased ? lastResult.score : null,
          passed: feedbackReleased ? lastResult.isPassed || false : null,
          completedAt: lastResult.completedAt ? lastResult.completedAt.toISOString() : null,
          startedAt: lastResult.startedAt ? lastResult.startedAt.toISOString() : null
        } : null,
        canRetake,
        status
      }
    })

    return NextResponse.json(exams)

  } catch (error) {
    console.error('Error fetching available exams:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
