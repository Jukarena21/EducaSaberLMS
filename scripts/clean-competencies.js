const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanCompetencies() {
  try {
    console.log('🧹 Actualizando competencias...')
    
    // Obtener competencias existentes
    const existingCompetencies = await prisma.competency.findMany()
    console.log(`📊 Encontradas ${existingCompetencies.length} competencias existentes`)
    
    // Competencias del ICFES
    const icfesCompetencies = [
      { name: "Lectura Crítica", displayName: "Lectura Crítica", description: "Análisis e interpretación de textos" },
      { name: "Matemáticas", displayName: "Matemáticas", description: "Competencia en resolución de problemas matemáticos" },
      { name: "Ciencias Naturales", displayName: "Ciencias Naturales", description: "Comprensión de fenómenos naturales" },
      { name: "Ciencias Sociales y Ciudadanas", displayName: "Ciencias Sociales y Ciudadanas", description: "Análisis de fenómenos sociales y ciudadanía" },
      { name: "Inglés", displayName: "Inglés", description: "Comunicación en lengua extranjera" }
    ]
    
    // Actualizar o crear competencias del ICFES
    for (const competency of icfesCompetencies) {
      const existing = await prisma.competency.findUnique({
        where: { name: competency.name }
      })
      
      if (existing) {
        await prisma.competency.update({
          where: { id: existing.id },
          data: competency
        })
        console.log(`✅ Competencia actualizada: ${competency.displayName}`)
      } else {
        await prisma.competency.create({
          data: competency
        })
        console.log(`✅ Competencia creada: ${competency.displayName}`)
      }
    }
    
    // Eliminar competencias que no son del ICFES (solo si no tienen cursos asociados)
    const nonIcfesCompetencies = existingCompetencies.filter(comp => 
      !icfesCompetencies.some(icfes => icfes.name === comp.name)
    )
    
    for (const competency of nonIcfesCompetencies) {
      try {
        // Verificar si tiene cursos asociados
        const coursesCount = await prisma.course.count({
          where: { competencyId: competency.id }
        })
        
        if (coursesCount === 0) {
          await prisma.competency.delete({
            where: { id: competency.id }
          })
          console.log(`🗑️ Competencia eliminada: ${competency.name}`)
        } else {
          console.log(`⚠️ No se puede eliminar ${competency.name} (tiene ${coursesCount} cursos asociados)`)
        }
      } catch (error) {
        console.log(`⚠️ No se puede eliminar ${competency.name}: ${error.message}`)
      }
    }
    
    console.log('🎉 ¡Competencias actualizadas exitosamente!')
    
  } catch (error) {
    console.error('❌ Error actualizando competencias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanCompetencies()
