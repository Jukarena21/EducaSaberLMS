import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        academicGrade: studentWithGrade.academicGrade || undefined, // Filtrar por año escolar del estudiante
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

    // Obtener todos los exámenes publicados normales (incluyendo cerrados y futuros)
    const availableExams = await prisma.exam.findMany({
      where: {
        isPublished: true,
        isManualSimulacro: false // Excluir simulacros manuales (se agregan después)
      },
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
      
      // Determinar el estado del examen
      let status: 'not_attempted' | 'in_progress' | 'passed' | 'failed' = 'not_attempted'
      let canRetake = false
      
      if (lastResult) {
        // Si completedAt es null, el examen está en progreso
        if (lastResult.completedAt === null) {
          status = 'in_progress'
          canRetake = true // Puede continuar el examen en progreso
        } else {
          // El examen está completado
          status = lastResult.isPassed ? 'passed' : 'failed'
          // Si el score es 0 y está completado, significa que fue reactivado
          // Permitir reintentos en este caso
          canRetake = lastResult.score === 0
        }
      }
      
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        isManualSimulacro: exam.isManualSimulacro || false,
        competency: exam.competency?.name || 'General',
        course: exam.course?.title || 'General',
        timeLimitMinutes: exam.timeLimitMinutes,
        totalQuestions: exam.examQuestions.length,
        passingScore: exam.passingScore,
        openDate: effectiveOpenDate ? effectiveOpenDate.toISOString() : null,
        closeDate: effectiveCloseDate ? effectiveCloseDate.toISOString() : null,
        lastAttempt: lastResult ? {
          resultId: lastResult.id,
          score: lastResult.score,
          passed: lastResult.isPassed || false,
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
