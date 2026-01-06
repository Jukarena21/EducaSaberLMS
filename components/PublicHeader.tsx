"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

interface PublicHeaderProps {
  showSignUpButton?: boolean
  currentPath?: string
  onNavigate?: (view: "landing" | "cursos" | "otros-servicios" | "acerca" | "contacto" | "precios") => void
}

export function PublicHeader({ showSignUpButton = false, currentPath = "/", onNavigate }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  const navItems = [
    { label: "Inicio", path: "/", view: "landing" as const },
    { label: "Cursos ICFES", path: "/cursos", view: "cursos" as const },
    { label: "Otros Servicios", path: "/otros-servicios", view: "otros-servicios" as const },
    { label: "Acerca de", path: "/#acerca", view: "acerca" as const },
    { label: "Contacto", path: "/#contacto", view: "contacto" as const },
  ]

  // Determinar qué item está activo basado en currentPath
  const getActivePath = () => {
    if (currentPath === "/cursos") return "/cursos"
    if (currentPath === "/otros-servicios") return "/otros-servicios"
    if (currentPath === "/#acerca") return "/#acerca"
    if (currentPath === "/#contacto") return "/#contacto"
    return "/"
  }

  const activePath = getActivePath()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (isHomePage && onNavigate) {
      e.preventDefault()
      onNavigate(item.view)
      setIsMobileMenuOpen(false)
    } else {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y nombre */}
          <Link
            href="/"
            className="flex items-center space-x-2"
            onClick={(e) => {
              if (isHomePage && onNavigate) {
                e.preventDefault()
                onNavigate("landing")
              }
            }}
          >
            <Image 
              src="/logo-educasaber.png" 
              alt="Educasaber Colombia" 
              width={50} 
              height={50}
              className="object-contain"
            />
            <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={(e) => handleNavClick(e, item)}
                className={`font-medium transition-colors ${
                  activePath === item.path
                    ? "text-[#C00102]"
                    : "text-gray-700 hover:text-[#C00102]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showSignUpButton && (
              <Button
                onClick={() => {
                  if (isHomePage && onNavigate) {
                    onNavigate("precios")
                  }
                }}
                className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold px-6"
              >
                INSCRÍBETE AHORA
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`font-medium transition-colors ${
                    activePath === item.path
                      ? "text-[#C00102]"
                      : "text-gray-700 hover:text-[#C00102]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {showSignUpButton && (
                <Button
                  className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white w-full font-semibold"
                  onClick={() => {
                    if (isHomePage && onNavigate) {
                      onNavigate("precios")
                    }
                    setIsMobileMenuOpen(false)
                  }}
                >
                  INSCRÍBETE AHORA
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

