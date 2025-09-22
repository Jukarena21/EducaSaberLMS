const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompetencies() {
  try {
    console.log('🔍 Verificando competencias en la base de datos...');

    // Obtener todas las competencias
    const competencies = await prisma.competency.findMany();

    console.log(`📚 Total de competencias: ${competencies.length}`);

    if (competencies.length === 0) {
      console.log('ℹ️ No hay competencias en la base de datos');
      console.log('🔄 Creando competencias ICFES...');
      
      // Crear competencias ICFES
      const icfesCompetencies = [
        {
          name: 'lectura_critica',
          displayName: 'Lectura Crítica',
          description: 'Competencia en lectura crítica y comprensión lectora',
          colorHex: '#3B82F6'
        },
        {
          name: 'matematicas',
          displayName: 'Razonamiento Cuantitativo',
          description: 'Competencia en matemáticas y razonamiento cuantitativo',
          colorHex: '#10B981'
        },
        {
          name: 'comunicacion_escrita',
          displayName: 'Comunicación Escrita',
          description: 'Competencia en comunicación escrita y producción textual',
          colorHex: '#F59E0B'
        },
        {
          name: 'competencias_ciudadanas',
          displayName: 'Competencias Ciudadanas',
          description: 'Competencia en competencias ciudadanas y convivencia',
          colorHex: '#EF4444'
        },
        {
          name: 'ingles',
          displayName: 'Inglés',
          description: 'Competencia en inglés como lengua extranjera',
          colorHex: '#8B5CF6'
        }
      ];

      for (const competency of icfesCompetencies) {
        await prisma.competency.create({
          data: competency
        });
        console.log(`✅ Creada: ${competency.displayName}`);
      }

      console.log('🎉 Competencias ICFES creadas exitosamente!');
    } else {
      competencies.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.displayName} (${comp.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompetencies();
