import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🌱 Creando usuarios de prueba...');

    // Crear un colegio de prueba
    const school = await prisma.school.create({
      data: {
        name: 'Colegio de Prueba',
        city: 'Bogotá',
        neighborhood: 'Chapinero',
        institutionType: 'privada',
        academicCalendar: 'diurno',
        totalStudents: 500,
        contactEmail: 'admin@colegioprueba.edu.co',
      },
    });

    console.log('✅ Colegio creado:', school.name);

    // Crear usuarios de prueba
    const testUsers = [
      {
        email: 'estudiante@test.com',
        password: '123456',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'student' as const,
        schoolId: school.id,
      },
      {
        email: 'admin@colegio.com',
        password: '123456',
        firstName: 'María',
        lastName: 'García',
        role: 'school_admin' as const,
        schoolId: school.id,
      },
      {
        email: 'profesor@admin.com',
        password: '123456',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'teacher_admin' as const,
      },
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          schoolId: userData.schoolId,
        },
      });

      console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 Usuarios de prueba creados exitosamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('Estudiante: estudiante@test.com / 123456');
    console.log('Admin Colegio: admin@colegio.com / 123456');
    console.log('Profesor Admin: profesor@admin.com / 123456');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 