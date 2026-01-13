// Script para verificar que el schema.prisma sea PostgreSQL
const fs = require('fs')
const path = require('path')

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
const schemaContent = fs.readFileSync(schemaPath, 'utf8')

console.log('🔍 Verificando schema.prisma...')

// Verificar que tenga PostgreSQL
if (!schemaContent.includes('provider = "postgresql"')) {
  console.error('❌ ERROR: schema.prisma no tiene provider = "postgresql"')
  process.exit(1)
}

// Verificar que NO tenga SQLite
if (schemaContent.includes('provider = "sqlite"')) {
  console.error('❌ ERROR: schema.prisma contiene provider = "sqlite"')
  process.exit(1)
}

if (schemaContent.includes('file:./dev.db')) {
  console.error('❌ ERROR: schema.prisma contiene file:./dev.db')
  process.exit(1)
}

console.log('✅ schema.prisma es válido (PostgreSQL)')
