const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    const schools = await prisma.school.count();
    const users = await prisma.user.count();
    const competencies = await prisma.competency.count();
    const lessons = await prisma.lesson.count();
    const modules = await prisma.module.count();
    const courses = await prisma.course.count();
    const questions = await prisma.question.count();
    const exams = await prisma.exam.count();
    
    console.log('📊 Conteo de datos:');
    console.log(`- Escuelas: ${schools}`);
    console.log(`- Usuarios: ${users}`);
    console.log(`- Competencias: ${competencies}`);
    console.log(`- Lecciones: ${lessons}`);
    console.log(`- Módulos: ${modules}`);
    console.log(`- Cursos: ${courses}`);
    console.log(`- Preguntas: ${questions}`);
    console.log(`- Exámenes: ${exams}`);
    
    if (users > 0) {
      console.log('\n✅ La base de datos tiene datos');
    } else {
      console.log('\n❌ La base de datos está vacía');
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
