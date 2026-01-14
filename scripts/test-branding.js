const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBranding() {
  try {
    console.log('🔍 Probando campos de branding...');
    
    // Test 1: Leer campos de branding
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
    
    console.log(`✅ Campos de branding leídos correctamente:`, schools.length);
    console.log('Escuelas:', schools);
    
    // Test 2: Actualizar campos de branding
    if (schools.length > 0) {
      const updated = await prisma.school.update({
        where: { id: schools[0].id },
        data: {
          logoUrl: 'https://example.com/logo.png',
          themePrimary: '#3B82F6',
          themeSecondary: '#6B7280',
          themeAccent: '#EF4444'
        }
      });
      
      console.log('✅ Campos de branding actualizados correctamente');
      console.log('Escuela actualizada:', {
        name: updated.name,
        logoUrl: updated.logoUrl,
        themePrimary: updated.themePrimary,
        themeSecondary: updated.themeSecondary,
        themeAccent: updated.themeAccent
      });
    }
    
    console.log('\n🎉 Campos de branding funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error en campos de branding:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBranding();
