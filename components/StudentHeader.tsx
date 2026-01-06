"use client"

import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationCenter } from "@/components/NotificationCenter"
import { useSchoolBranding } from "@/hooks/useSchoolBranding"
import { LogOut, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface StudentHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  rightContent?: React.ReactNode
}

export function StudentHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backUrl = "/estudiante",
  rightContent 
}: StudentHeaderProps) {
  const { data: session } = useSession()
  const { branding, loading } = useSchoolBranding(session?.user?.schoolId)
  const router = useRouter()
  
  // No mostrar logo por defecto mientras carga si hay schoolId (evita parpadeo)
  const shouldShowDefaultLogo = !session?.user?.schoolId || (!loading && !branding?.logoUrl)

  return (
    <header className="student-header-bg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {/* Logo del colegio - más grande */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="bg-white/90 rounded-xl p-2 shadow-sm flex items-center justify-center">
            {branding?.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt="Logo Colegio" 
                width={100} 
                height={100} 
                className="object-contain"
              />
            ) : shouldShowDefaultLogo ? (
              <Image 
                src="/logo-educasaber.png" 
                alt="Educasaber Colombia" 
                width={100} 
                height={100}
                className="object-contain"
              />
            ) : (
              // Placeholder mientras carga para evitar parpadeo
              <div className="w-[100px] h-[100px] bg-gray-100 rounded animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(backUrl)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
            )}
            {(title || subtitle) && (
              <div>
                {title && (
                  <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            )}
            {!title && !subtitle && (
              <h1 className="text-xl font-semibold text-gray-800">
                {session?.user?.name || 'Portal del Estudiante'}
              </h1>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {rightContent}
          <NotificationCenter />
          <Badge variant="secondary" className="school-primary">
            Estudiante
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

