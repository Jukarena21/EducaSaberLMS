const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    // Test 1: Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios: ${userCount}`);
    
    // Test 2: Contar escuelas
    const schoolCount = await prisma.school.count();
    console.log(`✅ Escuelas: ${schoolCount}`);
    
    // Test 3: Verificar campos de branding
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    });
    
    console.log(`✅ Campos de branding disponibles:`, schools.length > 0 ? 'SÍ' : 'NO');
    
    // Test 4: Verificar competencias
    const competencyCount = await prisma.competency.count();
    console.log(`✅ Competencias: ${competencyCount}`);
    
    // Test 5: Verificar lecciones
    const lessonCount = await prisma.lesson.count();
    console.log(`✅ Lecciones: ${lessonCount}`);
    
    // Test 6: Verificar módulos
    const moduleCount = await prisma.module.count();
    console.log(`✅ Módulos: ${moduleCount}`);
    
    console.log('\n🎉 Base de datos funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error en la base de datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
