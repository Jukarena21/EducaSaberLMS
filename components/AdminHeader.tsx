"use client"

import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSchoolBranding } from "@/hooks/useSchoolBranding"
import { LogOut, Bell } from "lucide-react"
import { AdminNotificationCenter } from "@/components/AdminNotificationCenter"
import { AdminLiveClassCalendar } from "@/components/AdminLiveClassCalendar"

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  rightContent?: React.ReactNode
}

export function AdminHeader({ 
  title, 
  subtitle, 
  rightContent 
}: AdminHeaderProps) {
  const { data: session } = useSession()

  // Solo los admin de colegio usan el branding de su colegio.
  // El admin general (teacher_admin) debe ver siempre los colores base de la plataforma.
  const isSchoolAdmin = session?.user?.role === 'school_admin'
  const schoolIdForBranding = isSchoolAdmin ? session?.user?.schoolId : undefined

  const { branding, loading } = useSchoolBranding(schoolIdForBranding)
  
  // No mostrar logo por defecto mientras carga si hay schoolId (evita parpadeo)
  const shouldShowDefaultLogo = !session?.user?.schoolId || (!loading && !branding?.logoUrl)
  
  const getRoleLabel = () => {
    if (session?.user?.role === 'school_admin') return 'Admin Colegio'
    if (session?.user?.role === 'teacher_admin') return 'Admin General'
    return 'Administrador'
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {/* Logo del colegio */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt="Logo Colegio" 
              width={60} 
              height={60} 
              className="object-contain"
            />
          ) : shouldShowDefaultLogo ? (
            <Image 
              src="/logo-educasaber.png" 
              alt="Educasaber Colombia" 
              width={50} 
              height={50}
              className="object-contain"
            />
          ) : (
            // Placeholder mientras carga para evitar parpadeo
            <div className="w-[50px] h-[50px] bg-gray-100 rounded animate-pulse" />
          )}
          
          <div>
            {title ? (
              <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            ) : (
              <h1 className="text-xl font-semibold text-gray-800">
                {session?.user?.name || 'Portal Administrativo'}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {rightContent}
          {(session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && (
            <AdminLiveClassCalendar />
          )}
          <AdminNotificationCenter />
          <Badge variant="secondary" className="school-primary">
            {getRoleLabel()}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

