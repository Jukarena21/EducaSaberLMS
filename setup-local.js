#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando EducaSaber LMS para desarrollo local...\n');

// 1. Crear archivo .env.local si no existe
const envExamplePath = path.join(__dirname, 'env.example');
const envLocalPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('📝 Creando archivo .env.local...');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Archivo .env.local creado');
} else {
  console.log('✅ Archivo .env.local ya existe');
}

// 2. Copiar esquema SQLite
const sqliteSchemaPath = path.join(__dirname, 'prisma', 'schema-sqlite.prisma');
const mainSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

console.log('📋 Configurando esquema SQLite...');
const sqliteContent = fs.readFileSync(sqliteSchemaPath, 'utf8');
fs.writeFileSync(mainSchemaPath, sqliteContent);
console.log('✅ Esquema SQLite configurado');

// 3. Crear directorio prisma si no existe
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

console.log('\n🎯 Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ejecuta: npm install');
console.log('2. Ejecuta: npx prisma generate');
console.log('3. Ejecuta: npx prisma db push');
console.log('4. Ejecuta: npm run dev');
console.log('\n💡 La base de datos SQLite se creará automáticamente en: ./prisma/dev.db'); 