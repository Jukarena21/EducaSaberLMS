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
// Configurar para trabajar con Supabase (con o sin pooler)
let databaseUrl = process.env.DATABASE_URL || ''
const isPooler = databaseUrl.includes('pooler') || databaseUrl.includes(':6543')
const isSupabase = databaseUrl.includes('supabase.co')

// Agregar parámetros necesarios para Supabase
if (isSupabase) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  const params: string[] = []
  
  // SSL siempre requerido para Supabase desde Vercel
  if (!databaseUrl.includes('sslmode=')) {
    params.push('sslmode=require')
  }
  
  // Si es pooler, agregar parámetros de PgBouncer
  if (isPooler && !databaseUrl.includes('pgbouncer=true')) {
    params.push('pgbouncer=true')
    params.push('connection_limit=1')
  }
  
  if (params.length > 0) {
    databaseUrl = `${databaseUrl}${separator}${params.join('&')}`
    console.log('[Prisma Init] Agregando parámetros para Supabase:', params.join(', '))
  }
}

console.log('[Prisma Init] URL final (preview):', databaseUrl.substring(0, 50) + '...')

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 