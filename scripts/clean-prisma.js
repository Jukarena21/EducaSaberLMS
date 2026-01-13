// Script para limpiar el cache de Prisma Client
const fs = require('fs')
const path = require('path')

const nodeModulesPath = path.join(process.cwd(), 'node_modules')
const prismaClientPath = path.join(nodeModulesPath, '@prisma', 'client')
const prismaCachePath = path.join(nodeModulesPath, '.prisma')

console.log('🧹 Limpiando cache de Prisma Client...')

try {
  if (fs.existsSync(prismaClientPath)) {
    console.log('  - Eliminando @prisma/client')
    fs.rmSync(prismaClientPath, { recursive: true, force: true })
  }
  
  if (fs.existsSync(prismaCachePath)) {
    console.log('  - Eliminando .prisma cache')
    fs.rmSync(prismaCachePath, { recursive: true, force: true })
  }
  
  console.log('✅ Cache de Prisma limpiado')
} catch (error) {
  console.warn('⚠️  Error al limpiar cache (puede no existir):', error.message)
}
