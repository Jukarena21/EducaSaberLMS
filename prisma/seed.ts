import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed mínimo de base de datos...\n')

  // ============================================
  // LIMPIEZA (opcional - comentar si quieres conservar datos)
  // ============================================
  console.log('🧹 Limpiando base de datos...')
  
  // Eliminar en orden para respetar foreign keys
  await prisma.examQuestionAnswer.deleteMany()
  await prisma.examAssignment.deleteMany()
  await prisma.examSchool.deleteMany()
  await prisma.examResult.deleteMany()
  await prisma.examQuestion.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.liveClassInvitation.deleteMany()
  await prisma.liveClass.deleteMany()
  await prisma.studentContentProgress.deleteMany()
  await prisma.studentLessonProgress.deleteMany()
  await prisma.studentModuleProgress.deleteMany()
  await prisma.studentCourseProgress.deleteMany()
  await prisma.courseEnrollment.deleteMany()
  await prisma.courseModule.deleteMany()
  await prisma.courseSchool.deleteMany()
  await prisma.course.deleteMany()
  await prisma.moduleLesson.deleteMany()
  await prisma.lessonQuestion.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.userAchievement.deleteMany()
  await prisma.userStats.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.schoolReport.deleteMany()
  await prisma.reportCache.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()
  await prisma.competency.deleteMany()

  console.log('✅ Base de datos limpiada\n')

  // ============================================
  // CREAR ADMIN GENERAL
  // ============================================
  console.log('👤 Creando usuario Admin General...')
  const hashedPassword = await bcrypt.hash('admin123', 12) // Cambiar esta contraseña en producción

  const adminGeneral = await prisma.user.create({
    data: {
      email: 'admin@educasaber.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'General',
      role: 'teacher_admin', // Rol de administrador general
    },
  })

  console.log(`  ✅ Admin General creado:`)
  console.log(`     Email: ${adminGeneral.email}`)
  console.log(`     Contraseña: admin123 (CAMBIAR EN PRODUCCIÓN)`)
  console.log(`     Nombre: ${adminGeneral.firstName} ${adminGeneral.lastName}\n`)

  // ============================================
  // CREAR COMPETENCIAS ICFES
  // ============================================
  console.log('📚 Creando competencias ICFES...')

  const icfesCompetencies = [
    {
      name: 'lectura_critica',
      displayName: 'Lectura Crítica',
      description: 'Desarrollo de habilidades para comprender, analizar e interpretar textos de manera crítica.',
      colorHex: '#3B82F6',
      iconName: 'book-open',
    },
    {
      name: 'razonamiento_cuantitativo',
      displayName: 'Razonamiento Cuantitativo',
      description: 'Capacidad para resolver problemas matemáticos y aplicar el razonamiento cuantitativo.',
      colorHex: '#10B981',
      iconName: 'calculator',
    },
    {
      name: 'competencias_ciudadanas',
      displayName: 'Competencias Ciudadanas',
      description: 'Desarrollo de habilidades para la convivencia, participación democrática y construcción de paz.',
      colorHex: '#EF4444',
      iconName: 'users',
    },
    {
      name: 'comunicacion_escrita',
      displayName: 'Comunicación Escrita',
      description: 'Habilidades para expresarse de manera escrita de forma clara, coherente y efectiva.',
      colorHex: '#F59E0B',
      iconName: 'file-text',
    },
    {
      name: 'ingles',
      displayName: 'Inglés',
      description: 'Desarrollo de competencias comunicativas en inglés como lengua extranjera.',
      colorHex: '#8B5CF6',
      iconName: 'globe',
    },
  ]

  for (const comp of icfesCompetencies) {
    await prisma.competency.create({
      data: comp,
    })
    console.log(`  ✅ ${comp.displayName}`)
  }

  console.log('\n✅ Seed mínimo completado exitosamente!')
  console.log('\n📋 Resumen:')
  console.log(`   - Usuario Admin: ${adminGeneral.email}`)
  console.log(`   - Competencias ICFES: ${icfesCompetencies.length}`)
  console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña del admin en producción!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
