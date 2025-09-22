const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkModules() {
  try {
    console.log('🔍 Verificando módulos en la base de datos...');

    // Obtener todos los módulos
    const modules = await prisma.module.findMany({
      include: {
        competency: true
      }
    });

    console.log(`📝 Total de módulos: ${modules.length}`);

    if (modules.length === 0) {
      console.log('ℹ️ No hay módulos en la base de datos');
      return;
    }

    // Mostrar módulos
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.title}`);
      console.log(`   Competencia: ${module.competency?.displayName || 'Sin competencia'}`);
      console.log(`   ID: ${module.id}`);
      console.log('');
    });

    // Obtener competencias
    const competencies = await prisma.competency.findMany();
    console.log(`📚 Competencias disponibles: ${competencies.length}`);
    competencies.forEach(comp => {
      console.log(`   - ${comp.displayName} (${comp.name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModules();
