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
const dbUrlPreview = dbUrl ? `${dbUrl.substring(0, 20)}...` : 'NOT SET'
console.log('[Prisma] DATABASE_URL:', dbUrlPreview)
console.log('[Prisma] Is PostgreSQL:', dbUrl?.startsWith('postgresql://'))
console.log('[Prisma] Is SQLite:', dbUrl?.startsWith('file:'))

// PrismaClient usa DATABASE_URL automáticamente desde process.env
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 