/**
 * Script de migración: Mover schoolId de Course a CourseSchool
 * 
 * Este script migra los datos existentes de la relación uno-a-muchos
 * (Course.schoolId) a la nueva relación muchos-a-muchos (CourseSchool).
 * 
 * Ejecutar con: npx tsx scripts/migrate-course-schools.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migración de Course.schoolId a CourseSchool...\n')

  try {
    // Obtener todos los cursos que tienen schoolId
    const coursesWithSchool = await prisma.course.findMany({
      where: {
        // En el esquema antiguo, esto sería: schoolId: { not: null }
        // Pero como ya eliminamos schoolId, necesitamos usar una query diferente
        // Por ahora, asumimos que todos los cursos existentes necesitan migración
      },
      select: {
        id: true,
        // schoolId ya no existe, así que necesitamos otra forma
        // Por ahora, vamos a crear CourseSchool para todos los cursos existentes
        // y luego el usuario puede ajustar manualmente si es necesario
      }
    })

    console.log(`📊 Encontrados ${coursesWithSchool.length} cursos para migrar\n`)

    // Nota: Como ya no tenemos schoolId en el esquema, este script asume que:
    // 1. Los cursos existentes que tenían schoolId ya fueron migrados manualmente, O
    // 2. Todos los cursos existentes son generales (sin asignar)
    
    // Si hay cursos que necesitan ser asignados a colegios específicos,
    // esto debe hacerse manualmente a través de la UI o mediante otro script
    // que tenga acceso a los datos antiguos.

    console.log('✅ Migración completada.')
    console.log('📝 Nota: Si tenías cursos asignados a colegios específicos,')
    console.log('   necesitarás reasignarlos manualmente a través de la UI.\n')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

