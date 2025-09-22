const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateModulesCompetencies() {
  try {
    console.log('🔄 Actualizando competencias de módulos existentes...');

    // Obtener todas las competencias
    const competencies = await prisma.competency.findMany();
    console.log(`📚 Competencias disponibles: ${competencies.length}`);

    // Obtener todos los módulos sin competencia
    const modulesWithoutCompetency = await prisma.module.findMany({
      where: {
        competencyId: null
      }
    });

    console.log(`📝 Módulos sin competencia: ${modulesWithoutCompetency.length}`);

    // Mapeo de palabras clave a competencias
    const competencyMapping = {
      'matemáticas': 'matematicas',
      'matematica': 'matematicas', 
      'algebra': 'matematicas',
      'geometria': 'matematicas',
      'geometría': 'matematicas',
      'aritmetica': 'matematicas',
      'aritmética': 'matematicas',
      'calculo': 'matematicas',
      'cálculo': 'matematicas',
      'estadistica': 'matematicas',
      'estadística': 'matematicas',
      
      'lectura': 'lectura_critica',
      'critica': 'lectura_critica',
      'crítica': 'lectura_critica',
      'comprension': 'lectura_critica',
      'comprensión': 'lectura_critica',
      'texto': 'lectura_critica',
      'literatura': 'lectura_critica',
      
      'escritura': 'comunicacion_escrita',
      'comunicacion': 'comunicacion_escrita',
      'comunicación': 'comunicacion_escrita',
      'redaccion': 'comunicacion_escrita',
      'redacción': 'comunicacion_escrita',
      'ensayo': 'comunicacion_escrita',
      'argumentacion': 'comunicacion_escrita',
      'argumentación': 'comunicacion_escrita',
      
      'ciudadanas': 'competencias_ciudadanas',
      'ciudadanía': 'competencias_ciudadanas',
      'democracia': 'competencias_ciudadanas',
      'constitucion': 'competencias_ciudadanas',
      'constitución': 'competencias_ciudadanas',
      'derechos': 'competencias_ciudadanas',
      'deberes': 'competencias_ciudadanas',
      'etica': 'competencias_ciudadanas',
      'ética': 'competencias_ciudadanas',
      
      'ingles': 'ingles',
      'inglés': 'ingles',
      'english': 'ingles',
      'vocabulary': 'ingles',
      'grammar': 'ingles',
      'listening': 'ingles',
      'speaking': 'ingles'
    };

    let updatedCount = 0;

    for (const module of modulesWithoutCompetency) {
      const searchText = `${module.title} ${module.description || ''}`.toLowerCase();
      
      // Buscar coincidencias
      let assignedCompetency = null;
      
      for (const [keyword, competencyName] of Object.entries(competencyMapping)) {
        if (searchText.includes(keyword)) {
          assignedCompetency = competencies.find(c => c.name === competencyName);
          if (assignedCompetency) {
            break;
          }
        }
      }

      // Si no se encontró coincidencia, asignar matemáticas por defecto
      if (!assignedCompetency) {
        assignedCompetency = competencies.find(c => c.name === 'matematicas');
      }

      if (assignedCompetency) {
        await prisma.module.update({
          where: { id: module.id },
          data: { competencyId: assignedCompetency.id }
        });
        
        console.log(`✅ ${module.title} → ${assignedCompetency.displayName}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Actualización completada!`);
    console.log(`📊 Módulos actualizados: ${updatedCount}/${modulesWithoutCompetency.length}`);

  } catch (error) {
    console.error('❌ Error actualizando módulos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateModulesCompetencies();
