const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModuleCreation() {
  try {
    console.log('🧪 Probando creación de módulo...');

    // Obtener una competencia para usar
    const competency = await prisma.competency.findFirst();
    if (!competency) {
      console.log('❌ No hay competencias en la base de datos');
      return;
    }

    console.log(`📚 Usando competencia: ${competency.displayName}`);

    // Intentar crear un módulo de prueba
    const testModule = await prisma.module.create({
      data: {
        title: 'Módulo de Prueba',
        description: 'Este es un módulo de prueba para verificar la funcionalidad',
        estimatedTimeMinutes: 60,
        orderIndex: 1,
        competencyId: competency.id,
        createdById: null, // Temporalmente null para la prueba
      },
      include: {
        competency: true
      }
    });

    console.log('✅ Módulo creado exitosamente:');
    console.log(`   ID: ${testModule.id}`);
    console.log(`   Título: ${testModule.title}`);
    console.log(`   Competencia: ${testModule.competency?.displayName || 'Sin competencia'}`);

    // Limpiar - eliminar el módulo de prueba
    await prisma.module.delete({
      where: { id: testModule.id }
    });

    console.log('🧹 Módulo de prueba eliminado');

  } catch (error) {
    console.error('❌ Error creando módulo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testModuleCreation();
