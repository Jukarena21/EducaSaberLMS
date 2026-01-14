import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, institution, subject, message } = body || {}

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'El correo electrónico y el número de celular son obligatorios.' },
        { status: 400 }
      )
    }

    const finalSubject = subject?.trim() || 'Nuevo mensaje desde el formulario de contacto Educa-Saber'
    const safeName = name?.trim() || 'Sin nombre'
    const safeInstitution = institution?.trim() || 'Sin institución'
    const safeMessage = message?.trim() || 'Sin mensaje'

    const contactEmail = process.env.CONTACT_EMAIL || 'aletell5@hotmail.com'

    // Si no hay configuración SMTP, registrar advertencia pero responder OK para no bloquear el flujo.
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP no configurado. Se omite el envío real de correo de contacto.')
      console.log('Contacto recibido:', { name: safeName, email, phone, institution: safeInstitution, subject: finalSubject, message: safeMessage })
      return NextResponse.json({ ok: true })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: contactEmail,
      replyTo: email,
      subject: finalSubject,
      text: `
Nombre: ${safeName}
Correo: ${email}
Celular: ${phone}
Institución: ${safeInstitution}

Mensaje:
${safeMessage}
      `.trim(),
      html: `
        <h2>Nuevo mensaje desde el formulario de contacto</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Celular:</strong> ${phone}</p>
        <p><strong>Institución:</strong> ${safeInstitution}</p>
        <p><strong>Asunto:</strong> ${finalSubject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en /api/contact:', error)
    return NextResponse.json(
      { error: 'Error al enviar el mensaje. Intenta de nuevo más tarde.' },
      { status: 500 }
    )
  }
}


