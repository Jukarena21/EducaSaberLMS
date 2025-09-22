"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Users,
  Award,
  GraduationCap,
  Clock,
  Menu,
  X,
  TrendingUp,
  Calculator,
  Globe,
  Microscope,
  MessageSquare,
  CheckCircle,
  Star,
  Target,
} from "lucide-react"

export default function LMSPlatform() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<"landing" | "cursos" | "acerca" | "contacto" | "precios">("landing")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Homepage settings
  const [showInstitutionsCarousel, setShowInstitutionsCarousel] = useState<boolean>(true)
  const [institutions, setInstitutions] = useState<Array<{ name: string; logo: string; city?: string; logoUrl?: string }>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/settings/homepage')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setShowInstitutionsCarousel(!!data.showInstitutionsCarousel)
        // Map admin institutions (with logoUrl) to this page's simple structure
        if (Array.isArray(data.institutions)) {
          setInstitutions(data.institutions.map((i: any) => ({ name: i.name, logo: '🏫', city: '', logoUrl: i.logoUrl })))
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])
  
  // Estado para el formulario de login
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Función para manejar el login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError("Credenciales inválidas. Por favor, verifica tu email y contraseña.")
      } else {
        // Login exitoso, redirigir a una página intermedia que manejará la redirección según el rol
        router.push("/dashboard")
      }
    } catch (error) {
      setLoginError("Error al iniciar sesión. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Companies Banner Component - Version 2 (Moving)
  const CompaniesBannerMoving = ({ companies }: { companies: Array<{ name: string; logo?: string; city?: string; logoUrl?: string }> }) => {
    return (
      <div className="w-full bg-white/90 backdrop-blur-sm py-4 overflow-hidden border-t border-b border-gray-200">
        <div className="flex items-center mb-2">
          <p className="text-center w-full text-sm font-medium text-gray-600">Instituciones que confían en nosotros</p>
        </div>
        <div className="relative">
          <div className="flex animate-scroll-left">
            {/* First set of logos */}
            {companies.map((company, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 mx-4 flex flex-col items-center space-y-1 bg-white rounded-xl px-3 py-2 shadow-sm border"
              >
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt={company.name} className="h-6" />
                ) : (
                  <span className="text-xl">{company.logo || '🏫'}</span>
                )}
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap text-center">{company.name}</span>
                <div className="text-xs text-gray-500 text-center">{company.city}</div>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {companies.map((company, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 mx-4 flex flex-col items-center space-y-1 bg-white rounded-xl px-3 py-2 shadow-sm border"
              >
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt={company.name} className="h-6" />
                ) : (
                  <span className="text-xl">{company.logo || '🏫'}</span>
                )}
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap text-center">{company.name}</span>
                <div className="text-xs text-gray-500 text-center">{company.city}</div>
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll-left {
            animation: scroll-left 30s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  // Footer Component
  const Footer = () => (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
              <span className="text-xl font-bold">EDUCASABER COLOMBIA</span>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Plataforma líder en preparación para el examen ICFES en Colombia. Ayudamos a miles de estudiantes a
              alcanzar sus metas académicas con contenido de calidad y tecnología innovadora.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-[#73A2D3] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-[#73A2D3] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-[#73A2D3] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017-.001z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-[#73A2D3] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-[#73A2D3] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#73A2D3]">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentView("cursos")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Nuestros Cursos
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView("precios")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Planes y Precios
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView("acerca")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Acerca de Nosotros
                </button>
              </li>
              <li>
                <a href="/examen" className="text-gray-300 hover:text-white transition-colors">
                  Simulacros ICFES
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Blog Educativo
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#C00102]">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-[#73A2D3] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-gray-300 text-sm">
                    Carrera 15 #93-47, Oficina 501
                    <br />
                    Bogotá, Colombia
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-[#73A2D3]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <p className="text-gray-300 text-sm">+57 (1) 234-5678</p>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-[#73A2D3]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p className="text-gray-300 text-sm">info@educasaber.com</p>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-[#73A2D3]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.94L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                </svg>
                <p className="text-gray-300 text-sm">+57 300 123 4567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Educasaber Colombia. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Términos y Condiciones
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Política de Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )

  // Landing Page Component
  if (currentView === "landing") {
    return (
      <div>
        <div
          className="h-screen flex flex-col"
          style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)" }}
        >
          {/* Navigation */}
          <nav className="flex items-center justify-between p-4 md:p-6">
            <div className="flex items-center space-x-2">
              <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={50} height={50} />
              <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setCurrentView("landing")}
                className="text-gray-700 hover:text-[#C00102] transition-colors font-medium"
              >
                Inicio
              </button>
              <button
                onClick={() => setCurrentView("cursos")}
                className="text-gray-700 hover:text-[#C00102] transition-colors font-medium"
              >
                Cursos
              </button>
              <button
                onClick={() => setCurrentView("acerca")}
                className="text-gray-700 hover:text-[#C00102] transition-colors font-medium"
              >
                Acerca de
              </button>
              <button
                onClick={() => setCurrentView("contacto")}
                className="text-gray-700 hover:text-[#C00102] transition-colors font-medium"
              >
                Contacto
              </button>
              <Button
                onClick={() => setCurrentView("precios")}
                className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold px-6"
              >
                INSCRÍBETE AHORA
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </nav>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg p-4">
              <div className="flex flex-col space-y-4">
                <button onClick={() => setCurrentView("landing")} className="text-gray-700 text-left font-medium">
                  Inicio
                </button>
                <button onClick={() => setCurrentView("cursos")} className="text-gray-700 text-left font-medium">
                  Cursos
                </button>
                <button onClick={() => setCurrentView("acerca")} className="text-gray-700 text-left font-medium">
                  Acerca de
                </button>
                <button onClick={() => setCurrentView("contacto")} className="text-gray-700 text-left font-medium">
                  Contacto
                </button>
                <Button
                  onClick={() => setCurrentView("precios")}
                  className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white w-full font-semibold"
                >
                  INSCRÍBETE AHORA
                </Button>
              </div>
            </div>
          )}

          {/* Main Content - Reduced height */}
          <div className="flex-1 container mx-auto px-4 py-4">
            <div className="grid lg:grid-cols-2 gap-8 items-center h-full">
              {/* Login Form */}
              <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                <CardHeader className="text-center bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white rounded-t-lg">
                  <div className="flex items-center justify-center mb-4">
                    <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
                  </div>
                  <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="username@gmail.com"
                        className="bg-gray-50 border-gray-200"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        className="bg-gray-50 border-gray-200"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    {loginError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                        {loginError}
                      </div>
                    )}
                    
                    <Link href="#" className="text-sm text-[#C00102] hover:underline font-medium">
                      ¿Olvidaste tu contraseña?
                    </Link>

                    <div className="space-y-3">
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold"
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </Button>
                      <Link href="/auth/signup">
                        <Button 
                          type="button"
                          className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold"
                        >
                          Crear Cuenta
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Hero Section */}
              <div className="text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Prepárate para el <span className="text-[#C00102]">ICFES</span> con{" "}
                    <span className="text-[#73A2D3]">Éxito</span>
                  </h1>
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    Únete a miles de estudiantes en nuestra plataforma de preparación para el ICFES. Accede a simulacros
                    de calidad, realiza exámenes y monitorea tu progreso.
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 inline-block border-2 border-dashed border-[#73A2D3] shadow-lg mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] p-3 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">250k+</div>
                      <div className="text-gray-600 font-medium">Estudiantes Preparados</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/80 rounded-lg p-4 shadow-md">
                    <div className="text-2xl font-bold text-[#C00102]">500+</div>
                    <div className="text-sm text-gray-600 font-medium">Simulacros</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 shadow-md">
                    <div className="text-2xl font-bold text-[#73A2D3]">98%</div>
                    <div className="text-sm text-gray-600 font-medium">Tasa de Éxito</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 shadow-md">
                    <div className="text-2xl font-bold text-[#C00102]">24/7</div>
                    <div className="text-sm text-gray-600 font-medium">Soporte</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Companies Banners - Controlled by settings */}
          {showInstitutionsCarousel && (
            <CompaniesBannerMoving companies={institutions.length ? institutions : [
              { name: "Universidad Nacional", logo: "🏛️", city: "Bogotá" },
              { name: "SENA", logo: "🎓", city: "Nacional" },
              { name: "Universidad de los Andes", logo: "🏫", city: "Bogotá" },
              { name: "Pontificia Universidad Javeriana", logo: "⛪", city: "Bogotá" },
              { name: "Universidad del Rosario", logo: "🌹", city: "Bogotá" },
              { name: "ICFES", logo: "📊", city: "Nacional" },
              { name: "Ministerio de Educación", logo: "🏛️", city: "Bogotá" },
              { name: "Universidad EAFIT", logo: "🏢", city: "Medellín" },
              { name: "Universidad de Antioquia", logo: "🏛️", city: "Medellín" },
              { name: "Universidad del Valle", logo: "🌄", city: "Cali" },
              { name: "Universidad Externado", logo: "📚", city: "Bogotá" },
              { name: "Universidad Central", logo: "🏛️", city: "Bogotá" },
            ]} />
          )}
        </div>
        <Footer />
      </div>
    )
  }

  // Precios Page
  if (currentView === "precios") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
                <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView("landing")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Inicio
                </button>
                <button
                  onClick={() => setCurrentView("cursos")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Cursos
                </button>
                <button
                  onClick={() => setCurrentView("acerca")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Acerca de
                </button>
                <button
                  onClick={() => setCurrentView("contacto")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Contacto
                </button>
                <button onClick={() => setCurrentView("precios")} className="text-[#C00102] font-bold">
                  Precios
                </button>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Planes de Preparación ICFES</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Elige el plan que mejor se adapte a tus necesidades. Todos nuestros planes incluyen acceso completo a la
                plataforma y soporte especializado.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Plan Individual */}
              <Card className="relative overflow-hidden border-2 border-[#73A2D3] shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#73A2D3] to-[#C00102]"></div>
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#C00102] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Plan Individual</CardTitle>
                  <p className="text-gray-600 mt-2">Perfecto para estudiantes que se preparan por su cuenta</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-[#73A2D3]">$89,000</span>
                    <span className="text-gray-600 ml-2">COP / mes</span>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Acceso completo a todos los cursos</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Simulacros ilimitados</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Análisis detallado de resultados</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Soporte por chat 24/7</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Certificados de finalización</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Material descargable</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold py-3">
                    Comenzar Plan Individual
                  </Button>
                </CardContent>
              </Card>

              {/* Plan Institucional */}
              <Card className="relative overflow-hidden border-2 border-[#C00102] shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C00102] to-[#73A2D3]"></div>
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-[#C00102] to-[#73A2D3] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </span>
                </div>
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C00102] to-[#73A2D3] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Plan Institucional</CardTitle>
                  <p className="text-gray-600 mt-2">Ideal para colegios y universidades</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-[#C00102]">$2,500</span>
                    <span className="text-gray-600 ml-2">COP / estudiante/mes</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Mínimo 50 estudiantes</p>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Todo lo del plan individual</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Dashboard administrativo</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Reportes institucionales</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Gestión de estudiantes</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Soporte dedicado</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Capacitación para docentes</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>API para integración</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#73A2D3] hover:from-[#a00102] hover:to-[#5a8bc4] text-white font-semibold py-3">
                    Solicitar Cotización
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Preguntas Frecuentes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">¿Puedo cambiar de plan?</h3>
                    <p className="text-gray-600">
                      Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de usuario.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">¿Hay descuentos por volumen?</h3>
                    <p className="text-gray-600">
                      Sí, ofrecemos descuentos especiales para instituciones con más de 200 estudiantes.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">¿Incluye soporte técnico?</h3>
                    <p className="text-gray-600">
                      Todos nuestros planes incluyen soporte técnico. El plan institucional tiene soporte prioritario.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">¿Hay período de prueba?</h3>
                    <p className="text-gray-600">
                      Ofrecemos 7 días de prueba gratuita para que puedas evaluar nuestra plataforma.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Cursos Page
  if (currentView === "cursos") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
                <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView("landing")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Inicio
                </button>
                <button onClick={() => setCurrentView("cursos")} className="text-[#C00102] font-bold">
                  Cursos
                </button>
                <button
                  onClick={() => setCurrentView("acerca")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Acerca de
                </button>
                <button
                  onClick={() => setCurrentView("contacto")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Contacto
                </button>
                <Button
                  onClick={() => setCurrentView("precios")}
                  className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold"
                >
                  INSCRÍBETE AHORA
                </Button>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Nuestros Cursos ICFES</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Prepárate para el examen ICFES con nuestros cursos especializados en cada una de las áreas evaluadas.
                Nuestro contenido está diseñado por expertos y actualizado según los últimos estándares del ICFES.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Lectura Crítica */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Lectura Crítica</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Desarrolla habilidades de comprensión lectora, análisis de textos argumentativos, identificación de
                    ideas principales y figuras literarias.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Comprensión de textos</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Análisis argumentativo</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Figuras literarias</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Contexto histórico y cultural</span>
                    </li>
                  </ul>
                  <Link href="/curso/lectura-critica">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Matemáticas */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-red-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C00102] to-[#a00102] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Matemáticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Fortalece tus conocimientos en álgebra, geometría, estadística y cálculo con ejercicios prácticos y
                    teoría aplicada.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Álgebra y funciones</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Geometría analítica</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Estadística y probabilidad</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Cálculo diferencial</span>
                    </li>
                  </ul>
                  <Link href="/curso/matematicas">
                    <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Ciencias Naturales */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <Microscope className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Ciencias Naturales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Explora conceptos de biología, química y física con enfoque en la comprensión de fenómenos naturales
                    y científicos.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Biología celular y molecular</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Química orgánica e inorgánica</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Física mecánica y termodinámica</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Ecología y medio ambiente</span>
                    </li>
                  </ul>
                  <Link href="/curso/ciencias-naturales">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Ciencias Sociales */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C00102] to-[#a00102] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Ciencias Sociales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Comprende la historia, geografía, constitución política y ciudadanía con enfoque en el contexto
                    colombiano y mundial.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Historia de Colombia y mundial</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Geografía física y humana</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Constitución y democracia</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span>Economía y sociedad</span>
                    </li>
                  </ul>
                  <Link href="/curso/ciencias-sociales">
                    <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Inglés */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Inglés</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Mejora tu comprensión lectora en inglés, gramática, vocabulario y habilidades de comunicación en el
                    idioma.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span>Reading comprehension</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span>Grammar and vocabulary</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span>Text analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span>Communication skills</span>
                    </li>
                  </ul>
                  <Link href="/curso/ingles">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Simulacros Completos */}
              <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C00102] to-[#a00102] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Simulacros Completos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Practica con exámenes completos que simulan las condiciones reales del ICFES, con tiempo limitado y
                    retroalimentación detallada.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span>Exámenes cronometrados</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span>Retroalimentación inmediata</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span>Análisis de resultados</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span>Seguimiento de progreso</span>
                    </li>
                  </ul>
                  <Link href="/examen">
                    <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold">
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <Card className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white border-0 shadow-2xl">
                <CardContent className="p-12">
                  <h2 className="text-4xl font-bold mb-4">¿Listo para comenzar?</h2>
                  <p className="text-xl mb-8 opacity-90">
                    Únete a miles de estudiantes que han mejorado sus puntajes ICFES con nuestra plataforma.
                  </p>
                  <Button
                    onClick={() => setCurrentView("precios")}
                    className="bg-white text-[#73A2D3] hover:bg-gray-100 font-bold text-lg px-8 py-3"
                    size="lg"
                  >
                    Ver Planes y Precios
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Acerca de Page
  if (currentView === "acerca") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
                <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView("landing")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Inicio
                </button>
                <button
                  onClick={() => setCurrentView("cursos")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Cursos
                </button>
                <button onClick={() => setCurrentView("acerca")} className="text-[#C00102] font-bold">
                  Acerca de
                </button>
                <button
                  onClick={() => setCurrentView("contacto")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Contacto
                </button>
                <Button
                  onClick={() => setCurrentView("precios")}
                  className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold"
                >
                  INSCRÍBETE AHORA
                </Button>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Acerca de EDUCASABER COLOMBIA</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Somos una plataforma educativa especializada en la preparación para el examen ICFES, comprometidos con
                el éxito académico de los estudiantes colombianos.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#73A2D3] flex items-center space-x-2">
                    <Target className="h-6 w-6" />
                    <span>Nuestra Misión</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Brindar herramientas educativas de alta calidad que permitan a los estudiantes colombianos alcanzar
                    su máximo potencial en el examen ICFES, democratizando el acceso a una educación de excelencia y
                    contribuyendo al desarrollo del país.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#C00102] flex items-center space-x-2">
                    <Award className="h-6 w-6" />
                    <span>Nuestra Visión</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Ser la plataforma líder en preparación ICFES en Colombia, reconocida por la calidad de nuestro
                    contenido, la innovación tecnológica y el impacto positivo en la vida académica de miles de
                    estudiantes.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">Excelencia</h3>
                  <p className="text-gray-600">
                    Nos comprometemos con los más altos estándares de calidad en todo lo que hacemos.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-red-50 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#C00102] to-[#a00102] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-[#C00102]">Compromiso</h3>
                  <p className="text-gray-600">
                    Estamos dedicados al éxito de cada estudiante y al desarrollo de la educación en Colombia.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-green-50 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#C00102] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">Innovación</h3>
                  <p className="text-gray-600">
                    Utilizamos tecnología de vanguardia para crear experiencias de aprendizaje únicas.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Team Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Nuestro Equipo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">MG</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Dr. María González</h3>
                    <p className="text-[#73A2D3] font-medium mb-2">Directora Académica</p>
                    <p className="text-gray-600 text-sm">
                      PhD en Educación, 15 años de experiencia en preparación ICFES
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-red-50 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#C00102] to-[#a00102] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">CR</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Ing. Carlos Rodríguez</h3>
                    <p className="text-[#C00102] font-medium mb-2">Director de Tecnología</p>
                    <p className="text-gray-600 text-sm">Especialista en plataformas educativas y análisis de datos</p>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#73A2D3] to-[#C00102] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">AM</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Lic. Ana Martínez</h3>
                    <p className="text-[#73A2D3] font-medium mb-2">Coordinadora Pedagógica</p>
                    <p className="text-gray-600 text-sm">Experta en metodologías de enseñanza y evaluación educativa</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Contacto Page
  if (currentView === "contacto") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
                <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
              </div>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView("landing")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Inicio
                </button>
                <button
                  onClick={() => setCurrentView("cursos")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Cursos
                </button>
                <button
                  onClick={() => setCurrentView("acerca")}
                  className="text-gray-700 hover:text-[#C00102] font-medium"
                >
                  Acerca de
                </button>
                <button onClick={() => setCurrentView("contacto")} className="text-[#C00102] font-bold">
                  Contacto
                </button>
                <Button
                  onClick={() => setCurrentView("precios")}
                  className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold"
                >
                  INSCRÍBETE AHORA
                </Button>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Contáctanos</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Estamos aquí para ayudarte. Ponte en contacto con nosotros para resolver cualquier duda o solicitar
                información sobre nuestros servicios.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#73A2D3]">Envíanos un mensaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input id="nombre" placeholder="Tu nombre" className="border-gray-200" />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" type="email" placeholder="tu@email.com" className="border-gray-200" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" placeholder="Tu número de teléfono" className="border-gray-200" />
                  </div>
                  <div>
                    <Label htmlFor="institucion">Institución educativa</Label>
                    <Input
                      id="institucion"
                      placeholder="Nombre de tu colegio o institución"
                      className="border-gray-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input id="asunto" placeholder="¿En qué podemos ayudarte?" className="border-gray-200" />
                  </div>
                  <div>
                    <Label htmlFor="mensaje">Mensaje</Label>
                    <textarea
                      id="mensaje"
                      className="w-full p-3 border border-gray-200 rounded-md resize-none h-32"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold">
                    Enviar Mensaje
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#C00102]">Información de contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">Oficina Principal</h3>
                    <p className="text-gray-600">
                      Carrera 15 #93-47, Oficina 501
                      <br />
                      Bogotá, Colombia
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">Horarios de atención</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>
                        <strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM
                      </p>
                      <p>
                        <strong>Sábados:</strong> 9:00 AM - 2:00 PM
                      </p>
                      <p>
                        <strong>Domingos:</strong> Cerrado
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">Contacto directo</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>
                        <strong>Teléfono:</strong> +57 (1) 234-5678
                      </p>
                      <p>
                        <strong>WhatsApp:</strong> +57 300 123 4567
                      </p>
                      <p>
                        <strong>Email:</strong> info@educasaber.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return null
}
