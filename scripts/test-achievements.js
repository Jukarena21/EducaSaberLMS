const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAchievements() {
  try {
    console.log('🧪 Probando sistema de logros...\n');

    // 1. Verificar que los logros están creados
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });
    
    console.log(`✅ ${achievements.length} logros encontrados:`);
    achievements.forEach(achievement => {
      console.log(`   - ${achievement.name} (${achievement.points} puntos)`);
    });

    // 2. Buscar un estudiante para probar
    const student = await prisma.user.findFirst({
      where: { role: 'student' },
      include: {
        userStats: true,
        userAchievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!student) {
      console.log('❌ No se encontró ningún estudiante para probar');
      return;
    }

    console.log(`\n👤 Probando con estudiante: ${student.firstName} ${student.lastName}`);
    console.log(`   - Logros desbloqueados: ${student.userAchievements.length}`);
    console.log(`   - Puntos totales: ${student.userStats?.totalPoints || 0}`);

    // 3. Verificar progreso del estudiante
    const lessonsCompleted = await prisma.studentLessonProgress.count({
      where: {
        userId: student.id,
        status: 'completado'
      }
    });

    const examsTaken = await prisma.examResult.count({
      where: { userId: student.id }
    });

    const examsPassed = await prisma.examResult.count({
      where: {
        userId: student.id,
        isPassed: true
      }
    });

    console.log(`\n📊 Progreso del estudiante:`);
    console.log(`   - Lecciones completadas: ${lessonsCompleted}`);
    console.log(`   - Exámenes realizados: ${examsTaken}`);
    console.log(`   - Exámenes aprobados: ${examsPassed}`);

    // 4. Simular verificación de logros
    console.log(`\n🔍 Verificando logros que deberían estar desbloqueados:`);
    
    for (const achievement of achievements) {
      const criteria = JSON.parse(achievement.criteria);
      const isUnlocked = student.userAchievements.some(ua => ua.achievementId === achievement.id);
      
      let shouldBeUnlocked = false;
      switch (criteria.type) {
        case 'lessons_completed':
          shouldBeUnlocked = lessonsCompleted >= criteria.value;
          break;
        case 'exams_taken':
          shouldBeUnlocked = examsTaken >= criteria.value;
          break;
        case 'exams_passed':
          shouldBeUnlocked = examsPassed >= criteria.value;
          break;
      }

      const status = isUnlocked ? '✅ DESBLOQUEADO' : '❌ NO DESBLOQUEADO';
      const expected = shouldBeUnlocked ? ' (debería estar desbloqueado)' : '';
      
      console.log(`   - ${achievement.name}: ${status}${expected}`);
    }

    // 5. Crear algunos datos de prueba si no existen
    if (lessonsCompleted === 0) {
      console.log(`\n🎯 Creando datos de prueba...`);
      
      // Crear una lección de prueba
      const testLesson = await prisma.lesson.create({
        data: {
          title: 'Lección de Prueba',
          description: 'Lección para probar el sistema de logros',
          isPublished: true
        }
      });

      // Marcar como completada
      await prisma.studentLessonProgress.create({
        data: {
          userId: student.id,
          lessonId: testLesson.id,
          status: 'completado',
          videoCompleted: true,
          theoryCompleted: true,
          exercisesCompleted: true,
          totalTimeMinutes: 30,
          completedAt: new Date()
        }
      });

      console.log(`   ✅ Lección de prueba creada y completada`);
    }

    console.log(`\n🎉 Prueba completada!`);
    console.log(`💡 Para probar el sistema completo:`);
    console.log(`   1. Inicia sesión como estudiante`);
    console.log(`   2. Completa algunas lecciones`);
    console.log(`   3. Realiza algunos exámenes`);
    console.log(`   4. Ve a la pestaña "Logros" en el dashboard`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAchievements();
