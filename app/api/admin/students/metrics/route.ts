import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    // Restricciones de rol
    if (gate.session.user.role === 'school_admin' && !gate.session.user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const schoolId = gate.session.user.role === 'school_admin' 
      ? gate.session.user.schoolId 
      : (searchParams.get('schoolId') || undefined)

    // Si se especifica un estudiante, devolver métricas de ese estudiante
    if (studentId) {
      return await getStudentMetrics(studentId, schoolId, gate.session.user.role === 'school_admin')
    }

    // Si no se especifica, devolver métricas de todos los estudiantes del colegio
    return await getAllStudentsMetrics(schoolId, gate.session.user.role === 'school_admin')
  } catch (error) {
    console.error('Error fetching student metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

async function getStudentMetrics(studentId: string, schoolId?: string, isSchoolAdmin: boolean = false, returnResponse: boolean = true) {
  // Verificar que el estudiante existe y pertenece al colegio si es school_admin
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: { school: true }
  })

  if (!student) {
    if (returnResponse) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }
    throw new Error('Estudiante no encontrado')
  }

  if (isSchoolAdmin && student.schoolId !== schoolId) {
    if (returnResponse) {
      return NextResponse.json({ error: 'No autorizado para ver este estudiante' }, { status: 403 })
    }
    throw new Error('No autorizado para ver este estudiante')
  }

  if (student.role !== 'student') {
    if (returnResponse) {
      return NextResponse.json({ error: 'El usuario no es un estudiante' }, { status: 400 })
    }
    throw new Error('El usuario no es un estudiante')
  }

  // Obtener datos en paralelo
  const [
    examResults,
    lessonProgress,
    courseProgress,
    courseEnrollments,
    studentWithCourses
  ] = await Promise.all([
    // Resultados de exámenes
    prisma.examResult.findMany({
      where: { userId: studentId },
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    }),

    // Progreso de lecciones
    prisma.studentLessonProgress.findMany({
      where: { userId: studentId },
      include: {
        lesson: {
          include: {
            moduleLessons: {
              include: {
                module: {
                  include: {
                    competency: true
                  }
                }
              }
            }
          }
        }
      }
    }),

    // Progreso de cursos
    prisma.studentCourseProgress.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            competency: true
          }
        }
      }
    }),

    // Inscripciones activas
    prisma.courseEnrollment.findMany({
      where: { 
        userId: studentId,
        isActive: true
      },
      include: {
        course: true
      }
    }),
    
    // Obtener estudiante con cursos para academicGrade
    prisma.user.findUnique({
      where: { id: studentId },
      include: {
        courseEnrollments: {
          include: {
            course: {
              select: {
                academicGrade: true
              }
            }
          },
          take: 1,
          orderBy: {
            enrolledAt: 'desc'
          }
        }
      }
    })
  ])

  // Calcular métricas de exámenes
  const totalExams = examResults.length
  const averageScore = totalExams > 0
    ? Math.round(examResults.reduce((sum, er) => sum + er.score, 0) / totalExams * 10) / 10
    : 0
  const passedExams = examResults.filter(er => er.isPassed).length
  const passRate = totalExams > 0
    ? Math.round((passedExams / totalExams) * 100 * 10) / 10
    : 0
  const lastExamDate = examResults.length > 0 && examResults[0].completedAt
    ? (examResults[0].completedAt instanceof Date 
        ? examResults[0].completedAt.toISOString() 
        : new Date(examResults[0].completedAt).toISOString())
    : null

  // Calcular métricas de progreso
  const totalStudyTimeMinutes = lessonProgress.reduce((sum, lp) => sum + (lp.totalTimeMinutes || 0), 0)
  const totalStudyTimeHours = Math.round((totalStudyTimeMinutes / 60) * 10) / 10

  const averageCourseProgress = courseProgress.length > 0
    ? Math.round(courseProgress.reduce((sum, cp) => sum + (cp.progressPercentage || 0), 0) / courseProgress.length * 10) / 10
    : 0

  const completedCourses = courseProgress.filter(cp => cp.completedAt !== null).length
  const activeCourses = courseEnrollments.length

  // Calcular métricas por competencia
  const competencyMap = new Map<string, {
    scores: number[]
    exams: number
    passed: number
  }>()

  examResults.forEach(er => {
    if (er.exam?.competency) {
      const compId = er.exam.competency.id
      if (!competencyMap.has(compId)) {
        competencyMap.set(compId, { scores: [], exams: 0, passed: 0 })
      }
      const comp = competencyMap.get(compId)!
      comp.scores.push(er.score)
      comp.exams += 1
      if (er.isPassed) comp.passed += 1
    }
  })

  const competencyPerformance = Array.from(competencyMap.entries()).map(([compId, data]) => {
    const competency = examResults.find(er => er.exam?.competency?.id === compId)?.exam?.competency
    return {
      competencyId: compId,
      competencyName: competency?.displayName || competency?.name || 'Competencia Desconocida',
      averageScore: data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10
        : 0,
      examsCount: data.exams,
      passRate: data.exams > 0
        ? Math.round((data.passed / data.exams) * 100 * 10) / 10
        : 0
    }
  })

  // Calcular evolución mensual (últimos 6 meses)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recentExams = examResults.filter(er => 
    er.completedAt && new Date(er.completedAt) >= sixMonthsAgo
  )

  const monthlyMap = new Map<string, { scores: number[], count: number }>()
  
  recentExams.forEach(er => {
    if (er.completedAt) {
      const monthKey = `${er.completedAt.getFullYear()}-${String(er.completedAt.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { scores: [], count: 0 })
      }
      const month = monthlyMap.get(monthKey)!
      month.scores.push(er.score)
      month.count += 1
    }
  })

  const monthlyEvolution = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      month,
      averageScore: data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10
        : 0,
      examsCount: data.count
    }))

  // Determinar estado y factores de riesgo
  let status: 'excelente' | 'bueno' | 'mejorable' | 'requiere_atencion' = 'bueno'
  const riskFactors: string[] = []

  if (averageScore >= 80) {
    status = 'excelente'
  } else if (averageScore >= 70) {
    status = 'bueno'
  } else if (averageScore >= 60) {
    status = 'mejorable'
  } else {
    status = 'requiere_atencion'
    riskFactors.push('Promedio por debajo de 60%')
  }

  if (passRate < 50 && totalExams > 0) {
    riskFactors.push('Tasa de aprobación menor al 50%')
  }

  if (totalExams < 3) {
    riskFactors.push('Menos de 3 exámenes realizados')
  }

  const lastActivityDate = lastExamDate 
    ? new Date(lastExamDate)
    : (lessonProgress.length > 0 && lessonProgress[0].updatedAt
      ? new Date(lessonProgress[0].updatedAt)
      : null)

  if (lastActivityDate) {
    const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastActivity > 30) {
      riskFactors.push(`Sin actividad en los últimos ${daysSinceLastActivity} días`)
    }
  } else {
    riskFactors.push('Sin actividad registrada')
  }

  // Preparar datos detallados de exámenes para el modal
  const examHistory = examResults.map(er => ({
    id: er.id,
    examId: er.examId,
    examTitle: er.exam?.title || 'Examen sin título',
    competencyName: er.exam?.competency?.displayName || er.exam?.competency?.name || 'Sin competencia',
    score: er.score,
    isPassed: er.isPassed,
    completedAt: er.completedAt ? er.completedAt.toISOString() : new Date().toISOString(),
    totalQuestions: er.totalQuestions || 0,
    correctAnswers: er.correctAnswers || 0
  }))

  // Preparar datos detallados de cursos para el modal
  const coursesDetail = courseEnrollments.map(enrollment => {
    const course = enrollment.course
    const courseProg = courseProgress.find(cp => cp.courseId === course.id)
    
    // Calcular lecciones completadas en este curso
    const courseLessons = course.courseModules?.flatMap(cm => 
      cm.module?.moduleLessons?.map(ml => ml.lessonId) || []
    ) || []
    
    const completedLessonsCount = lessonProgress.filter(lp => 
      courseLessons.includes(lp.lessonId) && lp.status === 'completed'
    ).length
    
    const totalLessonsCount = courseLessons.length
    
    return {
      courseId: course.id,
      courseTitle: course.title,
      competencyName: course.competency?.displayName || course.competency?.name || 'Sin competencia',
      enrollmentDate: enrollment.enrolledAt ? enrollment.enrolledAt.toISOString() : new Date().toISOString(),
      progressPercentage: courseProg?.progressPercentage || 0,
      completedLessons: completedLessonsCount,
      totalLessons: totalLessonsCount,
      timeSpentHours: courseProg?.totalTimeMinutes 
        ? Math.round((courseProg.totalTimeMinutes / 60) * 10) / 10 
        : 0,
      isActive: enrollment.isActive
    }
  })

  // Obtener academicGrade del curso más reciente del estudiante
  const studentAcademicGrade = studentWithCourses?.courseEnrollments?.[0]?.course?.academicGrade || null

  const metricsData = {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentEmail: student.email,
    academicGrade: studentAcademicGrade,

    // Métricas de Exámenes
    totalExams,
    averageScore,
    passRate,
    lastExamDate,

    // Métricas de Progreso
    totalStudyTimeHours,
    averageCourseProgress,
    completedCourses,
    activeCourses,

    // Métricas por Competencia
    competencyPerformance,

    // Evolución Temporal
    monthlyEvolution,

    // Datos Detallados para el Modal
    examHistory,
    coursesDetail,

    // Estado
    status,
    lastActivity: lastActivityDate?.toISOString() || null,
    riskFactors
  }

  if (returnResponse) {
    return NextResponse.json(metricsData)
  }

  return metricsData
}

async function getAllStudentsMetrics(schoolId?: string, isSchoolAdmin: boolean = false) {
  // Construir filtro de estudiantes
  const whereClause: any = {
    role: 'student'
  }

  if (isSchoolAdmin && schoolId) {
    whereClause.schoolId = schoolId
    console.log(`Filtering by schoolId (school_admin): ${schoolId}`)
  } else if (schoolId) {
    whereClause.schoolId = schoolId
    console.log(`Filtering by schoolId (teacher_admin): ${schoolId}`)
  } else {
    console.log('No schoolId filter - returning all students')
  }

  // Obtener todos los estudiantes del colegio
  const students = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      schoolId: true
    },
    orderBy: {
      email: 'asc'
    }
  })

  console.log(`Found ${students.length} students for metrics calculation`)
  if (students.length > 0) {
    console.log('Sample students:', students.slice(0, 5).map(s => ({ 
      id: s.id, 
      name: `${s.firstName} ${s.lastName}`, 
      email: s.email,
      schoolId: s.schoolId
    })))
    // Buscar específicamente el usuario "test"
    const testUser = students.find(s => 
      s.email?.toLowerCase().includes('test') || 
      s.firstName?.toLowerCase().includes('test') ||
      s.lastName?.toLowerCase().includes('test')
    )
    if (testUser) {
      console.log('Found test user in database:', {
        id: testUser.id,
        name: `${testUser.firstName} ${testUser.lastName}`,
        email: testUser.email,
        schoolId: testUser.schoolId
      })
    } else {
      console.log('Test user NOT found in database query results')
    }
  }

  // Obtener métricas para cada estudiante (sin límite para mostrar todos)
  // Nota: Si hay muchos estudiantes, esto puede ser lento. Considerar paginación en el futuro.
  const studentsMetrics = await Promise.all(
    students.map(async (student) => {
      try {
        const metrics = await getStudentMetrics(student.id, schoolId, isSchoolAdmin, false)
        // Asegurar que studentName y studentEmail estén presentes
        const result = {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim() || 'Sin nombre',
          studentEmail: student.email || 'Sin email',
          academicGrade: metrics.academicGrade || null,
          ...metrics
        }
        console.log(`Metrics for ${result.studentName} (${result.studentEmail}):`, {
          totalExams: result.totalExams,
          averageScore: result.averageScore
        })
        return result
      } catch (error) {
        console.error(`Error getting metrics for student ${student.id} (${student.firstName} ${student.lastName}):`, error)
        // Devolver datos básicos incluso si falla el cálculo de métricas
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim() || 'Sin nombre',
          studentEmail: student.email || 'Sin email',
          academicGrade: null,
          totalExams: 0,
          averageScore: 0,
          passRate: 0,
          totalStudyTimeHours: 0,
          averageCourseProgress: 0,
          completedCourses: 0,
          activeCourses: 0,
          competencyPerformance: [],
          monthlyEvolution: [],
          status: 'bueno',
          riskFactors: []
        }
      }
    })
  )

  const validStudents = studentsMetrics.filter(s => s !== null)
  console.log(`Returning ${validStudents.length} students with metrics`)
  console.log('First 3 students:', validStudents.slice(0, 3).map(s => ({
    name: s.studentName,
    email: s.studentEmail,
    id: s.studentId
  })))

  return NextResponse.json({
    students: validStudents,
    total: students.length
  })
}

