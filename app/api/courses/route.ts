import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { yearToAcademicGrade } from '@/lib/academicGrades'
import { requireRole } from '@/lib/rbac'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search')
    const competencyId = searchParams.get('competencyId')
    const yearParam = searchParams.get('year')
    const isIcfesCourseParam = searchParams.get('isIcfesCourse')

    // Construir filtros base
    const baseFilters: any = {}

    // Filtro por búsqueda (título o descripción)
    if (search) {
      baseFilters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } } 
      ]
    }

    // Filtro por competencia
    if (competencyId) {
      baseFilters.competencyId = competencyId
    }

    // Filtro por año (convertir a academicGrade)
    if (yearParam) {
      const year = parseInt(yearParam)
      if (!isNaN(year)) {
        const academicGrade = yearToAcademicGrade(year)
        if (academicGrade) {
          baseFilters.academicGrade = academicGrade
        }
      }
    }

    // Filtro por tipo de curso (ICFES vs Personalizado)
    if (isIcfesCourseParam !== null && isIcfesCourseParam !== undefined) {
      const isIcfesCourse = isIcfesCourseParam === 'true' || isIcfesCourseParam === '1'
      baseFilters.isIcfesCourse = isIcfesCourse
    }

    // Filtro por colegio
    let schoolFilter: any = null
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
      }
      // Cursos que tienen su colegio asignado O cursos sin ningún colegio asignado (generales)
      schoolFilter = {
        OR: [
          {
            courseSchools: {
              some: {
                schoolId: session.user.schoolId
              }
            }
          },
          {
            courseSchools: {
              none: {}
            }
          }
        ]
      }
    } else if (schoolId && schoolId !== 'all') {
      // Teacher admin puede filtrar por colegio específico
      schoolFilter = {
        courseSchools: {
          some: {
            schoolId: schoolId
          }
        }
      }
    }

    // Combinar todos los filtros usando AND
    let whereClause: any = {}
    const filtersToCombine: any[] = []
    
    if (Object.keys(baseFilters).length > 0) {
      filtersToCombine.push(baseFilters)
    }
    
    if (schoolFilter) {
      filtersToCombine.push(schoolFilter)
    }

    if (filtersToCombine.length === 0) {
      whereClause = {}
    } else if (filtersToCombine.length === 1) {
      whereClause = filtersToCombine[0]
    } else {
      whereClause = { AND: filtersToCombine }
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        courseSchools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        courseModules: {
          include: {
            module: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Transformar los datos para que coincidan con la estructura esperada por el frontend
    const transformedCourses = courses.map(course => ({
      ...course,
      modules: course.courseModules.map(cm => ({
        id: cm.module.id,
        title: cm.module.title,
        orderIndex: cm.orderIndex
      })),
      schools: course.courseSchools.map(cs => ({
        id: cs.school.id,
        name: cs.school.name,
        type: cs.school.type
      }))
    }))

    return NextResponse.json(transformedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { title, description, year, competencyId, schoolIds, moduleIds, isIcfesCourse } = body

    // Validaciones
    if (!title || !description || !competencyId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // El año solo es requerido para cursos ICFES
    if (isIcfesCourse && !year) {
      return NextResponse.json(
        { error: 'El año escolar es requerido para cursos ICFES' },
        { status: 400 }
      )
    }

    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un módulo' },
        { status: 400 }
      )
    }

    // Verificar que la competencia existe
    const competency = await prisma.area.findUnique({
      where: { id: competencyId }
    })

    if (!competency) {
      return NextResponse.json(
        { error: 'La competencia especificada no existe' },
        { status: 400 }
      )
    }

    // Si es school_admin, solo puede crear cursos para su colegio
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json(
          { error: 'Usuario sin colegio asignado' },
          { status: 400 }
        )
      }
      // Si no se especifican schoolIds, usar el colegio del admin
      if (!schoolIds || schoolIds.length === 0) {
        body.schoolIds = [session.user.schoolId]
      } else if (!schoolIds.includes(session.user.schoolId)) {
        return NextResponse.json(
          { error: 'Solo puedes asignar cursos a tu colegio' },
          { status: 403 }
        )
      }
    }

    // Verificar que los colegios existen (si se especificaron)
    if (schoolIds && schoolIds.length > 0) {
      const schools = await prisma.school.findMany({
        where: { id: { in: schoolIds } }
      })

      if (schools.length !== schoolIds.length) {
        return NextResponse.json(
          { error: 'Uno o más colegios especificados no existen' },
          { status: 400 }
        )
      }
    }

    // Verificar que los módulos existen
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } }
    })

    if (modules.length !== moduleIds.length) {
      return NextResponse.json(
        { error: 'Uno o más módulos especificados no existen' },
        { status: 400 }
      )
    }

    // Convertir year a academicGrade (solo si es ICFES)
    let academicGrade: string | null = null
    if (isIcfesCourse && year) {
      academicGrade = yearToAcademicGrade(year) || null
    }

    const isIcfesCourseFlag = Boolean(isIcfesCourse)

    // Crear el curso
    const course = await prisma.course.create({
      data: {
        title,
        description,
        competencyId,
        academicGrade,
        createdById: session.user.id,
        isPublished: false,
        isIcfesCourse: isIcfesCourseFlag,
        totalModules: moduleIds.length,
        totalLessons: 0, // Se calculará después
        courseModules: {
          create: moduleIds.map((moduleId: string, index: number) => ({
            moduleId,
            orderIndex: index + 1
          }))
        },
        courseSchools: schoolIds && schoolIds.length > 0 ? {
          create: schoolIds.map((schoolId: string) => ({
            schoolId
          }))
        } : undefined
      },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        courseSchools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        courseModules: {
          include: {
            module: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    // Calcular total de lecciones
    const totalLessons = course.courseModules.reduce((acc, cm) => {
      // Necesitamos contar las lecciones de cada módulo
      return acc
    }, 0)

    // Actualizar el total de lecciones (simplificado por ahora)
    await prisma.course.update({
      where: { id: course.id },
      data: {
        totalLessons: course.courseModules.length // Simplificado, debería contar lecciones reales
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}