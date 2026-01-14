import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'EDUCASABER COLOMBIA - Educa-Saber',
  description: 'Plataforma de aprendizaje y acompañamiento académico (PreICFES, preuniversitarios y cursos personalizados)',
  generator: 'EducaSaber LMS',
  icons: {
    icon: '/logo-educasaber.png',
    shortcut: '/logo-educasaber.png',
    apple: '/logo-educasaber.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
