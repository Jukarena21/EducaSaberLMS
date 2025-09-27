import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireRole(roles: string[]){
  const session = await getServerSession(authOptions)
  if (!session?.user) return { allowed:false, status:401, error:'No autorizado' as const }
  const role = session.user.role
  if (!roles.includes(role)) return { allowed:false, status:403, error:'Acceso denegado' as const }
  return { allowed:true, session }
}


