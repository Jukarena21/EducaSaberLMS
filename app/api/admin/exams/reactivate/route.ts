import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { resultId, resultIds, examId, reason } = await request.json()

    // Determinar qué reactivar
    let resultIdsToReactivate: string[] = []

    if (examId) {
      // Reactivar todos los resultados de un examen
      const allResults = await prisma.examResult.findMany({
        where: {
          examId: examId,
          score: { gt: 0 },
          completedAt: { not: null }
        },
        select: { id: true }
      })
      resultIdsToReactivate = allResults.map(r => r.id)
    } else if (resultIds && Array.isArray(resultIds)) {
      // Reactivar múltiples resultados específicos
      resultIdsToReactivate = resultIds
    } else if (resultId) {
      // Reactivar un solo resultado (compatibilidad con versión anterior)
      resultIdsToReactivate = [resultId]
    } else {
      return NextResponse.json({ error: 'Se requiere resultId, resultIds o examId' }, { status: 400 })
    }

    if (resultIdsToReactivate.length === 0) {
      return NextResponse.json({ error: 'No se encontraron resultados para reactivar' }, { status: 404 })
    }

    // Verificar que todos los resultados existan y estén completados
    const examResults = await prisma.examResult.findMany({
      where: {
        id: { in: resultIdsToReactivate }
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolId: true
          }
        }
      }
    })

    if (examResults.length !== resultIdsToReactivate.length) {
      return NextResponse.json({ error: 'Algunos resultados no fueron encontrados' }, { status: 404 })
    }

    // Validación para school_admin: verificar que todos los resultados pertenezcan a estudiantes de su colegio
    if (session.user.role === 'school_admin' && session.user.schoolId) {
      const invalidResults = examResults.filter(r => r.user.schoolId !== session.user.schoolId)

      if (invalidResults.length > 0) {
        return NextResponse.json(
          { error: 'Algunos resultados no pertenecen a estudiantes de tu colegio' },
          { status: 403 }
        )
      }
    }

    // Verificar que todos estén completados
    const incompleteResults = examResults.filter(r => r.score === 0)
    if (incompleteResults.length > 0) {
      return NextResponse.json({ error: 'Algunos exámenes aún están en progreso' }, { status: 400 })
    }

    // Reactivar todos los exámenes: resetear los resultados
    await prisma.examResult.updateMany({
      where: {
        id: { in: resultIdsToReactivate }
      },
      data: {
        score: 0,
        isPassed: false,
        completedAt: null,
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeTakenMinutes: 0
      }
    })

    // Eliminar las respuestas existentes para permitir rehacer los exámenes
    await prisma.examQuestionAnswer.deleteMany({
      where: {
        examResultId: { in: resultIdsToReactivate }
      }
    })

    // Log de la reactivación
    const examTitle = examResults[0]?.exam.title || 'Examen'
    const studentsCount = examResults.length
    console.log(`Examen reactivado: ${examTitle} para ${studentsCount} estudiante(s). Razón: ${reason || 'No especificada'}`)

    return NextResponse.json({
      message: `${studentsCount} examen(es) reactivado(s) exitosamente`,
      reactivatedCount: studentsCount,
      examResults: examResults.map(r => ({
        id: r.id,
        exam: r.exam,
        user: r.user
      }))
    })

  } catch (error) {
    console.error('Error reactivating exam:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
