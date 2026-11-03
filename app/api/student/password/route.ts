import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Completa la contraseña actual y la nueva' }, { status: 400 })
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!matches) {
      return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error changing student password:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
