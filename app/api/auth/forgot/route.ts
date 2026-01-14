import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 })
    }

    // Buscar usuario (no revelamos si existe o no)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Generar contraseña temporal y actualizar si existe
    let tempPassword: string | null = null
    if (user) {
      tempPassword = Math.random().toString(36).slice(-12)
      const passwordHash = await bcrypt.hash(tempPassword, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      })
    }

    // Enviar correo si tenemos SMTP configurado y el usuario existe
    if (
      user &&
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const appName = "EducaSaber LMS"
      const loginUrl = `${process.env.NEXTAUTH_URL || "https://educasaber.com"}/`

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: `${appName} - Recuperación de contraseña`,
        html: `
          <p>Hola${user?.firstName ? ` ${user.firstName}` : ""},</p>
          <p>Hemos generado una contraseña temporal para que puedas acceder de nuevo:</p>
          <p><strong>${tempPassword}</strong></p>
          <p>Ingresa con esta contraseña y cámbiala después de iniciar sesión.</p>
          <p>Accede aquí: <a href="${loginUrl}">${loginUrl}</a></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <p>— Equipo ${appName}</p>
        `,
      })
    } else {
      if (user) {
        console.log("[ForgotPassword] SMTP no configurado, contraseña temporal:", tempPassword)
      }
    }

    // Respuesta genérica para no filtrar existencia de usuario
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error)
    return NextResponse.json(
      { error: "Error procesando la solicitud" },
      { status: 500 }
    )
  }
}

