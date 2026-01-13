// Script para verificar la configuración de la base de datos
console.log('=== Verificación de Configuración de Base de Datos ===')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NO CONFIGURADA')
console.log('Es PostgreSQL:', process.env.DATABASE_URL?.startsWith('postgresql://'))
console.log('Es SQLite:', process.env.DATABASE_URL?.startsWith('file:'))
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('==================================================')
