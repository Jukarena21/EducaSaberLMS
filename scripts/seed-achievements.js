const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const achievements = [
  // Logros de lecciones
  {
    name: 'Primer Paso',
    description: 'Completa tu primera lección',
    iconName: 'book',
    category: 'lessons',
    criteria: JSON.stringify({ type: 'lessons_completed', value: 1 }),
    points: 10
  },
  {
    name: 'Estudiante Dedicado',
    description: 'Completa 10 lecciones',
    iconName: 'star',
    category: 'lessons',
    criteria: JSON.stringify({ type: 'lessons_completed', value: 10 }),
    points: 25
  },
  {
    name: 'Maestro del Aprendizaje',
    description: 'Completa 50 lecciones',
    iconName: 'crown',
    category: 'lessons',
    criteria: JSON.stringify({ type: 'lessons_completed', value: 50 }),
    points: 100
  },

  // Logros de exámenes
  {
    name: 'Primer Examen',
    description: 'Completa tu primer examen',
    iconName: 'target',
    category: 'exams',
    criteria: JSON.stringify({ type: 'exams_taken', value: 1 }),
    points: 15
  },
  {
    name: 'Aprobado',
    description: 'Aprueba tu primer examen',
    iconName: 'check',
    category: 'exams',
    criteria: JSON.stringify({ type: 'exams_passed', value: 1 }),
    points: 20
  },
  {
    name: 'Excelencia Académica',
    description: 'Obtén 90% o más en un examen',
    iconName: 'trophy',
    category: 'performance',
    criteria: JSON.stringify({ type: 'exam_score', value: 90 }),
    points: 50
  },

  // Logros de tiempo
  {
    name: 'Maratón de Estudio',
    description: 'Estudia por 2 horas en un día',
    iconName: 'clock',
    category: 'time',
    criteria: JSON.stringify({ type: 'daily_study_time', value: 120 }),
    points: 30
  },
  {
    name: 'Estudiante Constante',
    description: 'Estudia por 10 horas en total',
    iconName: 'medal',
    category: 'time',
    criteria: JSON.stringify({ type: 'total_study_time', value: 600 }),
    points: 40
  },

  // Logros de racha
  {
    name: 'Racha de 3 Días',
    description: 'Estudia 3 días consecutivos',
    iconName: 'flame',
    category: 'streak',
    criteria: JSON.stringify({ type: 'streak_days', value: 3 }),
    points: 25
  },
  {
    name: 'Racha de 7 Días',
    description: 'Estudia 7 días consecutivos',
    iconName: 'zap',
    category: 'streak',
    criteria: JSON.stringify({ type: 'streak_days', value: 7 }),
    points: 75
  },

  // Logros especiales
  {
    name: 'Primer Curso',
    description: 'Completa tu primer curso',
    iconName: 'award',
    category: 'lessons',
    criteria: JSON.stringify({ type: 'course_completed', value: 1 }),
    points: 100
  },
  {
    name: 'Perfeccionista',
    description: 'Obtén 100% en un examen',
    iconName: 'crown',
    category: 'performance',
    criteria: JSON.stringify({ type: 'perfect_exam', value: 100 }),
    points: 100
  }
];

async function seedAchievements() {
  try {
    console.log('Sembrando logros...');
    
    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: achievement,
        create: achievement
      });
    }
    
    console.log('✅ Logros sembrados exitosamente');
  } catch (error) {
    console.error('❌ Error sembrando logros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAchievements();
