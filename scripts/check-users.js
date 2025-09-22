const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Verificando usuarios en la base de datos...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`👤 Total de usuarios: ${users.length}`);

    if (users.length === 0) {
      console.log('ℹ️ No hay usuarios en la base de datos');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

    // Verificar roles específicos
    const teacherAdmins = users.filter(u => u.role === 'teacher_admin');
    const schoolAdmins = users.filter(u => u.role === 'school_admin');
    const students = users.filter(u => u.role === 'student');

    console.log(`📊 Resumen de roles:`);
    console.log(`   Profesor Administrador: ${teacherAdmins.length}`);
    console.log(`   Administrador de Colegio: ${schoolAdmins.length}`);
    console.log(`   Estudiante: ${students.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
