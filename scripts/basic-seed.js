const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed básico...');

  try {
    // Limpiar datos existentes
    await prisma.user.deleteMany();
    await prisma.school.deleteMany();
    await prisma.competency.deleteMany();

    console.log('✅ Datos limpiados');

    // Crear competencias
    const competencies = [
      { name: 'lectura_critica', displayName: 'Lectura Crítica', description: 'Habilidades de comprensión y análisis de textos.', iconName: 'book', colorHex: '#3B82F6' },
      { name: 'matematicas', displayName: 'Matemáticas', description: 'Razonamiento cuantitativo y resolución de problemas.', iconName: 'calculator', colorHex: '#10B981' },
      { name: 'ciencias_naturales', displayName: 'Ciencias Naturales', description: 'Comprensión de fenómenos biológicos, químicos y físicos.', iconName: 'flask', colorHex: '#F59E0B' },
      { name: 'ciencias_sociales', displayName: 'Ciencias Sociales', description: 'Análisis de eventos históricos, geográficos y sociales.', iconName: 'globe', colorHex: '#8B5CF6' },
      { name: 'ingles', displayName: 'Inglés', description: 'Dominio de la lengua inglesa en contextos académicos.', iconName: 'flag', colorHex: '#EF4444' },
    ];

    const createdCompetencies = [];
    for (const comp of competencies) {
      const created = await prisma.competency.create({ data: comp });
      createdCompetencies.push(created);
    }
    console.log(`✅ Creadas ${createdCompetencies.length} competencias`);

    // Crear escuelas
    const schools = [];
    for (let i = 0; i < 3; i++) {
      const school = await prisma.school.create({
        data: {
          name: `Colegio ${i + 1}`,
          city: 'Bogotá',
          neighborhood: `Barrio ${i + 1}`,
          address: `Calle ${i + 1} #${i + 1}-${i + 1}`,
          institutionType: i === 0 ? 'publica' : 'privada',
          academicCalendar: 'diurno',
          totalStudents: 500 + (i * 200),
          numberOfCampuses: 1,
          yearsOfOperation: 20 + (i * 5),
          contactEmail: `contacto@colegio${i + 1}.edu.co`,
          contactPhone: `+57 1 234-${i.toString().padStart(4, '0')}`,
          logoUrl: null,
          themePrimary: null,
          themeSecondary: null,
          themeAccent: null,
        },
      });
      schools.push(school);
    }
    console.log(`✅ Creadas ${schools.length} escuelas`);

    // Crear usuarios
    const passwordHash = await bcrypt.hash('password123', 10);

    // Teacher admin
    const teacherAdmin = await prisma.user.create({
      data: {
        email: 'teacher@educasaber.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Profesor',
        role: 'teacher_admin',
        schoolId: schools[0].id,
      },
    });

    // School admins
    const schoolAdmins = [];
    for (let i = 0; i < schools.length; i++) {
      const admin = await prisma.user.create({
        data: {
          email: `admin@colegio${i + 1}.edu.co`,
          passwordHash,
          firstName: `Admin`,
          lastName: `Colegio ${i + 1}`,
          role: 'school_admin',
          schoolId: schools[i].id,
        },
      });
      schoolAdmins.push(admin);
    }

    // Estudiantes
    const students = [];
    for (let i = 0; i < 10; i++) {
      const school = schools[i % schools.length];
      const student = await prisma.user.create({
        data: {
          email: `estudiante${i + 1}@colegio${(i % schools.length) + 1}.edu.co`,
          passwordHash,
          firstName: `Estudiante`,
          lastName: `${i + 1}`,
          role: 'student',
          schoolId: school.id,
          academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'][i % 6],
          dateOfBirth: new Date(2005 + (i % 5), i % 12, (i % 28) + 1),
          gender: i % 2 === 0 ? 'masculino' : 'femenino',
          documentType: 'CC',
          documentNumber: `1234567${i.toString().padStart(3, '0')}`,
          address: `Calle ${i + 1} #${i + 1}-${i + 1}`,
          city: school.city,
          neighborhood: school.neighborhood,
          socioeconomicStratum: (i % 6) + 1,
          housingType: i % 2 === 0 ? 'propia' : 'arriendo',
          schoolEntryYear: 2020 + (i % 3),
          academicAverage: 3.5 + (i % 1.5),
          homeTechnologyAccess: true,
          homeInternetAccess: true,
        },
      });
      students.push(student);
    }

    console.log(`✅ Creados usuarios: 1 teacher_admin, ${schoolAdmins.length} school_admins, ${students.length} estudiantes`);

    console.log('🎉 Seed básico completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- ${createdCompetencies.length} competencias`);
    console.log(`- ${schools.length} escuelas`);
    console.log(`- 1 teacher_admin, ${schoolAdmins.length} school_admins, ${students.length} estudiantes`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
