// Script para verificar que el schema.prisma sea PostgreSQL
const fs = require('fs')
const path = require('path')

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')

if (!fs.existsSync(schemaPath)) {
  console.error('❌ ERROR: schema.prisma no existe en:', schemaPath)
  process.exit(1)
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8')

console.log('🔍 Verificando schema.prisma...')
console.log('📁 Ruta:', schemaPath)
console.log('📏 Tamaño:', schemaContent.length, 'caracteres')

// Buscar el datasource block
const datasourceMatch = schemaContent.match(/datasource\s+db\s*\{([^}]+)\}/s)
if (datasourceMatch) {
  console.log('📋 Datasource encontrado:', datasourceMatch[1].trim())
}

// Verificar que tenga PostgreSQL (buscar con diferentes formatos posibles)
const hasPostgreSQL = /provider\s*=\s*["']postgresql["']/i.test(schemaContent) ||
                      schemaContent.toLowerCase().includes('postgresql')

if (!hasPostgreSQL) {
  console.error('❌ ERROR: schema.prisma no tiene provider = "postgresql"')
  if (datasourceMatch) {
    console.error('Contenido del datasource:', datasourceMatch[1])
  }
  process.exit(1)
}

// Verificar que NO tenga SQLite
if (/provider\s*=\s*["']sqlite["']/i.test(schemaContent)) {
  console.error('❌ ERROR: schema.prisma contiene provider = "sqlite"')
  process.exit(1)
}

if (schemaContent.includes('file:./dev.db') || schemaContent.includes('file:./prisma/dev.db')) {
  console.error('❌ ERROR: schema.prisma contiene referencia a archivo SQLite')
  process.exit(1)
}

console.log('✅ schema.prisma es válido (PostgreSQL)')
