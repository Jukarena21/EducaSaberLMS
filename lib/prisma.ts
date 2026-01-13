import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificar que DATABASE_URL esté configurada
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Log para debugging (solo mostrar primeros caracteres por seguridad)
const dbUrl = process.env.DATABASE_URL
const dbUrlPreview = dbUrl ? `${dbUrl.substring(0, 30)}...` : 'NOT SET'
console.log('[Prisma Init] DATABASE_URL:', dbUrlPreview)
console.log('[Prisma Init] Is PostgreSQL:', dbUrl?.startsWith('postgresql://'))
console.log('[Prisma Init] Is SQLite:', dbUrl?.startsWith('file:'))
console.log('[Prisma Init] Full URL length:', dbUrl?.length || 0)

// Verificar que no sea SQLite
if (dbUrl?.startsWith('file:')) {
  console.error('[Prisma Init] ERROR: DATABASE_URL apunta a SQLite en producción!')
  throw new Error('DATABASE_URL no puede apuntar a SQLite en producción. Debe ser PostgreSQL.')
}

// PrismaClient usa DATABASE_URL automáticamente desde process.env
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 