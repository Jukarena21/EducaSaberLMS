import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['school_admin','teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params

    // Build where clause based on user role
    let whereClause: any = { id }
    
    // School admins can only see users from their school
    if (gate.session?.user.role === 'school_admin' && gate.session.user.schoolId) {
      whereClause.schoolId = gate.session.user.schoolId
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        academicGrade: true,
        dateOfBirth: true,
        gender: true,
        documentType: true,
        documentNumber: true,
        address: true,
        neighborhood: true,
        city: true,
        socioeconomicStratum: true,
        housingType: true,
        schoolEntryYear: true,
        academicAverage: true,
        areasOfDifficulty: true,
        areasOfStrength: true,
        repetitionHistory: true,
        schoolSchedule: true,
        disabilities: true,
        specialEducationalNeeds: true,
        medicalConditions: true,
        homeTechnologyAccess: true,
        homeInternetAccess: true,
        status: true,
        totalPlatformTimeMinutes: true,
        sessionsStarted: true,
        lastSessionAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Parse JSON fields
    const userWithParsedFields = {
      ...user,
      areasOfDifficulty: user.areasOfDifficulty ? JSON.parse(user.areasOfDifficulty) : null,
      areasOfStrength: user.areasOfStrength ? JSON.parse(user.areasOfStrength) : null,
      disabilities: user.disabilities ? JSON.parse(user.disabilities) : null,
    }

    return NextResponse.json(userWithParsedFields)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['school_admin','teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      schoolId,
      dateOfBirth,
      gender,
      documentType,
      documentNumber,
      address,
      neighborhood,
      city,
      socioeconomicStratum,
      housingType,
      schoolEntryYear,
      academicAverage,
      academicGrade, // Grado académico del estudiante
      areasOfDifficulty,
      areasOfStrength,
      repetitionHistory,
      schoolSchedule,
      disabilities,
      specialEducationalNeeds,
      medicalConditions,
      homeTechnologyAccess,
      homeInternetAccess,
    } = body

    // Build where clause based on user role
    let whereClause: any = { id }
    
    // School admins can only update users from their school
    if (gate.session?.user.role === 'school_admin' && gate.session.user.schoolId) {
      whereClause.schoolId = gate.session.user.schoolId
    }

    // Check if user exists and user has permission to update
    const existingUser = await prisma.user.findFirst({
      where: whereClause,
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Prevent role changes - users cannot change their role once created
    if (role && role !== existingUser.role) {
      return NextResponse.json(
        { error: 'No se puede cambiar el rol de un usuario una vez creado' },
        { status: 400 }
      )
    }

    // School admins can only update students and school_admin users for their school
    if (gate.session?.user.role === 'school_admin') {
      if (existingUser.role === 'teacher_admin') {
        return NextResponse.json(
          { error: 'No puedes modificar usuarios teacher_admin' },
          { status: 403 }
        )
      }
      if (schoolId && schoolId !== gate.session.user.schoolId) {
        return NextResponse.json(
          { error: 'Solo puedes asignar usuarios a tu colegio' },
          { status: 403 }
        )
      }
    }

    // Check if email already exists (if changing email)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email || existingUser.email,
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      role: role || existingUser.role,
      schoolId: schoolId || existingUser.schoolId,
      academicGrade: academicGrade !== undefined ? academicGrade : existingUser.academicGrade,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
      gender: gender !== undefined ? gender : existingUser.gender,
      documentType: documentType !== undefined ? documentType : existingUser.documentType,
      documentNumber: documentNumber !== undefined ? documentNumber : existingUser.documentNumber,
      address: address !== undefined ? address : existingUser.address,
      neighborhood: neighborhood !== undefined ? neighborhood : existingUser.neighborhood,
      city: city !== undefined ? city : existingUser.city,
      socioeconomicStratum: socioeconomicStratum !== undefined ? parseInt(socioeconomicStratum) : existingUser.socioeconomicStratum,
      housingType: housingType !== undefined ? housingType : existingUser.housingType,
      schoolEntryYear: schoolEntryYear !== undefined ? parseInt(schoolEntryYear) : existingUser.schoolEntryYear,
      academicAverage: academicAverage !== undefined ? parseFloat(academicAverage) : existingUser.academicAverage,
      areasOfDifficulty: areasOfDifficulty !== undefined ? JSON.stringify(areasOfDifficulty) : existingUser.areasOfDifficulty,
      areasOfStrength: areasOfStrength !== undefined ? JSON.stringify(areasOfStrength) : existingUser.areasOfStrength,
      repetitionHistory: repetitionHistory !== undefined ? repetitionHistory : existingUser.repetitionHistory,
      schoolSchedule: schoolSchedule !== undefined ? schoolSchedule : existingUser.schoolSchedule,
      disabilities: disabilities !== undefined ? JSON.stringify(disabilities) : existingUser.disabilities,
      specialEducationalNeeds: specialEducationalNeeds !== undefined ? specialEducationalNeeds : existingUser.specialEducationalNeeds,
      medicalConditions: medicalConditions !== undefined ? medicalConditions : existingUser.medicalConditions,
      homeTechnologyAccess: homeTechnologyAccess !== undefined ? homeTechnologyAccess : existingUser.homeTechnologyAccess,
      homeInternetAccess: homeInternetAccess !== undefined ? homeInternetAccess : existingUser.homeInternetAccess,
      status: body.status !== undefined ? body.status : existingUser.status,
    }

    // Hash password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        academicGrade: true,
        dateOfBirth: true,
        gender: true,
        documentType: true,
        documentNumber: true,
        address: true,
        neighborhood: true,
        city: true,
        contactPhone: true,
        socioeconomicStratum: true,
        housingType: true,
        schoolEntryYear: true,
        academicAverage: true,
        areasOfDifficulty: true,
        areasOfStrength: true,
        repetitionHistory: true,
        schoolSchedule: true,
        disabilities: true,
        specialEducationalNeeds: true,
        medicalConditions: true,
        homeTechnologyAccess: true,
        homeInternetAccess: true,
        status: true,
        updatedAt: true,
      },
    })

    // Si es un estudiante y se proporcionó academicGrade, actualizar asignaciones de cursos
    if (existingUser.role === 'student' && academicGrade !== undefined) {
      try {
        // Obtener todos los cursos ICFES activos del estudiante para determinar el grado actual
        const currentEnrollments = await prisma.courseEnrollment.findMany({
          where: {
            userId: id,
            isActive: true,
          },
          include: {
            course: {
              select: {
                id: true,
                academicGrade: true,
                isIcfesCourse: true,
                title: true,
              },
            },
          },
        })

        // Filtrar solo cursos ICFES con grado académico
        const icfesEnrollments = currentEnrollments.filter(
          e => e.course.isIcfesCourse && e.course.academicGrade
        )

        // Obtener el grado actual (el más común entre los cursos activos)
        const gradeCounts = new Map<string, number>()
        icfesEnrollments.forEach(e => {
          const grade = e.course.academicGrade!
          gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1)
        })
        
        const currentGrade = Array.from(gradeCounts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] // Grado más común

        // Si el grado cambió o es la primera vez que se asigna
        if (currentGrade !== academicGrade) {
          // 1. DESACTIVAR cursos ICFES del grado anterior (si existe)
          if (currentGrade) {
            const coursesToDeactivate = icfesEnrollments
              .filter(e => e.course.academicGrade === currentGrade)
              .map(e => e.course.id)

            if (coursesToDeactivate.length > 0) {
              await prisma.courseEnrollment.updateMany({
                where: {
                  userId: id,
                  courseId: { in: coursesToDeactivate },
                },
                data: {
                  isActive: false,
                },
              })

              console.log(`🔄 Desactivados ${coursesToDeactivate.length} cursos del grado ${currentGrade} para estudiante ${id}`)
            }
          }

          // 2. ASIGNAR cursos ICFES del nuevo grado
          const coursesToEnroll = await prisma.course.findMany({
            where: {
              isIcfesCourse: true,
              isPublished: true,
              academicGrade: academicGrade,
            },
            select: {
              id: true,
              title: true,
            },
          })

          // Crear/actualizar las inscripciones para los cursos del nuevo grado
          if (coursesToEnroll.length > 0) {
            await Promise.all(
              coursesToEnroll.map(course =>
                prisma.courseEnrollment.upsert({
                  where: {
                    userId_courseId: {
                      userId: id,
                      courseId: course.id,
                    },
                  },
                  update: {
                    isActive: true, // Reactivar si ya existía pero estaba inactiva
                    enrolledAt: new Date(), // Actualizar fecha de inscripción
                  },
                  create: {
                    userId: id,
                    courseId: course.id,
                    isActive: true,
                    enrolledAt: new Date(),
                  },
                })
              )
            )

            console.log(`✅ Asignados ${coursesToEnroll.length} cursos del grado ${academicGrade} al estudiante ${id}`)
          } else {
            console.log(`ℹ️ No se encontraron cursos ICFES para el grado ${academicGrade}.`)
          }

          // NOTA: No eliminamos el progreso histórico (StudentCourseProgress, StudentLessonProgress, etc.)
          // porque es información histórica valiosa. Solo desactivamos las inscripciones.
          // Los resultados de exámenes también se mantienen como registro histórico.
        }
      } catch (enrollmentError) {
        // No fallar la actualización del usuario si hay error en la asignación de cursos
        console.error('Error al actualizar cursos automáticamente:', enrollmentError)
      }
    }

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only school_admin and teacher_admin can delete users
    if (session.user?.role !== 'school_admin' && session.user?.role !== 'teacher_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user?.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Build where clause based on user role
    let whereClause: any = { id }
    
    // School admins can only delete users from their school
    if (session.user?.role === 'school_admin' && session.user?.schoolId) {
      whereClause.schoolId = session.user.schoolId
    }

    // Check if user exists and user has permission to delete
    const existingUser = await prisma.user.findFirst({
      where: whereClause,
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // School admins cannot delete teacher_admin users
    if (session.user?.role === 'school_admin' && existingUser.role === 'teacher_admin') {
      return NextResponse.json(
        { error: 'No puedes eliminar usuarios teacher_admin' },
        { status: 403 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 