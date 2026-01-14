import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { examId } = await request.json()
    if (!examId) {
      return NextResponse.json({ error: 'ID de examen requerido' }, { status: 400 })
    }

    const userId = session.user.id

    // Verificar que el examen existe y está disponible
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examQuestions: true
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Verificar que el examen está publicado
    if (!exam.isPublished) {
      return NextResponse.json({ error: 'Examen no disponible' }, { status: 400 })
    }

    // Para simulacros manuales, verificar asignación
    if (exam.isManualSimulacro) {
      // Verificar asignación directa
      const directAssignment = await prisma.examAssignment.findFirst({
        where: {
          examId,
          userId,
          isActive: true
        }
      })

      // Verificar asignación por colegio (filtrado por año escolar)
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          schoolId: true,
          academicGrade: true
        }
      })

      const schoolAssignment = student?.schoolId ? await prisma.examSchool.findFirst({
        where: {
          examId,
          schoolId: student.schoolId,
          academicGrade: student.academicGrade || undefined, // Filtrar por año escolar del estudiante
          isActive: true
        }
      }) : null

      if (!directAssignment && !schoolAssignment) {
        return NextResponse.json(
          { error: 'Este simulacro no está asignado a ti' },
          { status: 403 }
        )
      }

      // Usar fechas de asignación si existen, sino las del examen
      const effectiveOpenDate = directAssignment?.openDate || schoolAssignment?.openDate || exam.openDate
      const effectiveCloseDate = directAssignment?.closeDate || schoolAssignment?.closeDate || exam.closeDate

      const now = new Date()
      if (effectiveOpenDate && effectiveOpenDate > now) {
        return NextResponse.json({ error: 'Examen aún no está abierto' }, { status: 400 })
      }

      if (effectiveCloseDate && effectiveCloseDate < now) {
        return NextResponse.json({ error: 'Examen ya cerró' }, { status: 400 })
      }
    } else {
      // Para exámenes normales, verificar fechas del examen
      const now = new Date()
      if (exam.openDate && exam.openDate > now) {
        return NextResponse.json({ error: 'Examen aún no está abierto' }, { status: 400 })
      }

      if (exam.closeDate && exam.closeDate < now) {
        return NextResponse.json({ error: 'Examen ya cerró' }, { status: 400 })
      }
    }

    // Verificar que el examen tenga preguntas
    if (!exam.examQuestions || exam.examQuestions.length === 0) {
      return NextResponse.json({ error: 'El examen no tiene preguntas asignadas' }, { status: 400 })
    }

    // Verificar si ya existe un resultado de examen en progreso (no completado)
    const existingResult = await prisma.examResult.findFirst({
      where: {
        userId,
        examId,
        completedAt: null // Solo resultados no completados (en progreso)
      }
    })

    let result
    if (existingResult) {
      // Usar el resultado existente
      result = existingResult
    } else {
      // Crear nuevo resultado de examen
      result = await prisma.examResult.create({
        data: {
          userId,
          examId,
          score: 0,
          timeTakenMinutes: 0,
          isPassed: false,
          totalQuestions: exam.examQuestions.length,
          correctAnswers: 0,
          incorrectAnswers: 0
        }
      })
    }

    // Preparar preguntas para el examen (sin respuestas correctas)
    const questions = exam.examQuestions.map(eq => ({
      id: eq.id,
      text: eq.questionText,
      type: eq.questionType,
      imageUrl: eq.questionImage,
      questionImage: eq.questionImage,
      questionType: eq.questionType,
      optionA: eq.optionA,
      optionB: eq.optionB,
      optionC: eq.optionC,
      optionD: eq.optionD,
      optionAImage: eq.optionAImage,
      optionBImage: eq.optionBImage,
      optionCImage: eq.optionCImage,
      optionDImage: eq.optionDImage,
      difficultyLevel: eq.difficultyLevel,
      options: [
        { id: 'A', text: eq.optionA, isCorrect: false },
        { id: 'B', text: eq.optionB, isCorrect: false },
        { id: 'C', text: eq.optionC, isCorrect: false },
        { id: 'D', text: eq.optionD, isCorrect: false }
      ],
      competency: 'General' // Simplificado por ahora
    }))

    return NextResponse.json({
      attemptId: result.id,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimitMinutes: exam.timeLimitMinutes,
        totalQuestions: questions.length
      },
      questions,
      startedAt: new Date()
    })

  } catch (error) {
    console.error('Error starting exam:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
