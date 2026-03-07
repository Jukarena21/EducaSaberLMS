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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { PublicHeader } from "@/components/PublicHeader"
import { ParticleBackground } from "@/components/ParticleBackground"
import {
  BookOpen,
  Users,
  Award,
  GraduationCap,
  Clock,
  TrendingUp,
  Calculator,
  Globe,
  Microscope,
  MessageSquare,
  CheckCircle,
  Star,
  Target,
  Building,
  ChevronDown,
} from "lucide-react"

export default function LMSPlatform() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<
    | "landing"
    | "cursos"
    | "otros-servicios"
    | "acerca"
    | "contacto"
    | "precios"
    | "terminos"
    | "privacidad"
    | "cookies"
  >("landing")
  // Homepage settings
  const [showInstitutionsCarousel, setShowInstitutionsCarousel] = useState<boolean>(false)
  const [institutions, setInstitutions] = useState<Array<{ name: string; logo: string; city?: string; logoUrl?: string }>>([])
  // Redirect notice
  const [redirectedFrom, setRedirectedFrom] = useState<string | null>(null)
  const [signinDisabled, setSigninDisabled] = useState<boolean>(false)
  const [signupDisabled, setSignupDisabled] = useState<boolean>(false)

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
  
  // Detect redirectedFrom to show a friendly notice
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const from = params.get('redirectedFrom')
      setRedirectedFrom(from)
      const sd = params.get('signin') === 'disabled'
      const sud = params.get('signup') === 'disabled'
      setSigninDisabled(sd)
      setSignupDisabled(sud)

      // Si venimos redirigidos desde una ruta pública antigua, abrir directamente la pestaña correspondiente
      if (from === '/cursos') setCurrentView('cursos')
      if (from === '/precios') setCurrentView('precios')
      if (from === '/#acerca') setCurrentView('acerca')

      // Limpia el query param para que el menú funcione normal después del redirect
      if (from) {
        window.history.replaceState({}, '', '/')
      }
    } catch {}
  }, [])
  
  // Estado para el formulario de login
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Estado para el formulario de contacto
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    institution: "",
    subject: "",
    message: "",
  })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const [contactSuccess, setContactSuccess] = useState<string | null>(null)

  const handleContactChange = (field: keyof typeof contactForm, value: string) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactError(null)
    setContactSuccess(null)

    if (!contactForm.email.trim() || !contactForm.phone.trim()) {
      setContactError("El correo electrónico y el número de celular son obligatorios.")
      return
    }

    setContactLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      })

      if (!res.ok) {
        throw new Error("Error al enviar el formulario")
      }

      setContactSuccess("Hemos recibido tu mensaje. Te contactaremos pronto.")
      setContactForm({
        name: "",
        email: "",
        phone: "",
        institution: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      setContactError("No pudimos enviar tu mensaje. Por favor, intenta de nuevo más tarde.")
    } finally {
      setContactLoading(false)
    }
  }
  
  // Rotating words animation
  const rotatingWords = ["el ICFES", "tu futuro", "el éxito", "tu carrera", "la excelencia"]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [typeSpeed, setTypeSpeed] = useState(100)
  
  // Rotating words typewriter effect
  useEffect(() => {
    if (currentView !== "landing") {
      // Reset when not on landing page
      setCurrentText("")
      setCurrentWordIndex(0)
      setIsDeleting(false)
      return
    }

    // Don't run if currentText is empty and we're not deleting (initial state)
    if (currentText === "" && !isDeleting && currentWordIndex === 0) {
      // Start with first character of first word
      const firstWord = rotatingWords[0]
      const timeout = setTimeout(() => {
        setCurrentText(firstWord[0])
      }, 100)
      return () => clearTimeout(timeout)
    }

    const currentWord = rotatingWords[currentWordIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.substring(0, currentText.length + 1))
          setTypeSpeed(80)
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 1500)
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentWord.substring(0, currentText.length - 1))
          setTypeSpeed(50)
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length)
          setTypeSpeed(80)
        }
      }
    }, typeSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWordIndex, currentView, rotatingWords])

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

  // Companies Banner Component - versión anterior (temporal, y desactivado por defecto)
  const CompaniesBannerMoving = ({ companies }: { companies: Array<{ name: string; logo?: string; city?: string; logoUrl?: string }> }) => {
    return (
      <div className="w-full bg-white/90 backdrop-blur-sm py-4 overflow-hidden border-t border-b border-gray-200">
        <div className="flex items-center mb-2">
          <p className="text-center w-full text-sm font-medium text-gray-600">Instituciones que confían en nosotros</p>
        </div>
        <div className="relative">
          <div className="flex animate-scroll-left">
            {/* Primer set de logos */}
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
            {/* Duplicado para loop continuo */}
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
              {/* Instagram */}
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#73A2D3] transition-colors"
                aria-label="Instagram Educa-Saber"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#73A2D3] transition-colors"
                aria-label="LinkedIn Educa-Saber"
              >
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
                <button
                  onClick={() => setCurrentView("cursos")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Simulacros ICFES
                </button>
              </li>
              {/* Blog ocultado por ahora: no hay contenido */}
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
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p className="text-gray-300 text-sm">aletell5@hotmail.com</p>
              </div>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-[#73A2D3]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.94L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                </svg>
                <a
                  href="https://wa.me/573203206960?text=Me%20interesa%20saber%20m%C3%A1s%20sobre%20los%20servicios%20de%20Educa-Saber"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 text-sm hover:text-[#73A2D3] transition-colors"
                >
                  320 3206960 - 316 8246767
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 Educasaber Colombia. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button
              type="button"
              onClick={() => setCurrentView("terminos")}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Términos y Condiciones
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("privacidad")}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Política de Privacidad
            </button>
            <button
              type="button"
              onClick={() => setCurrentView("cookies")}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Política de Cookies
            </button>
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
          className="relative h-screen flex flex-col overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)" }}
        >
          <ParticleBackground className="z-0" />

          {/* Navigation */}
          <div className="relative z-10">
            <PublicHeader 
              showSignUpButton={true} 
              currentPath="/" 
              onNavigate={setCurrentView}
            />
          </div>

          {/* Main Content - Reduced height */}
          <div className="relative z-10 flex-1 container mx-auto px-4 py-4">
            {(redirectedFrom || signinDisabled || signupDisabled) && (
              <div className="mb-4">
                <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm flex items-start justify-between">
                  <div>
                    {signinDisabled ? (
                      <>La página de inicio de sesión dedicada no está disponible. Usa el formulario de esta página para ingresar.</>
                    ) : signupDisabled ? (
                      <>El registro público no está disponible. Si necesitas una cuenta, contáctanos.</>
                    ) : (
                      <>
                        Acceso restringido. Te redirigimos desde
                        <span className="font-medium"> {redirectedFrom}</span>.
                        Inicia sesión con un rol autorizado o navega desde el menú.
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setRedirectedFrom(null)}
                    className="ml-3 text-yellow-800 hover:underline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
            <div className="grid lg:grid-cols-2 gap-8 items-center h-full">
              {/* Login Form */}
              <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                <CardHeader className="text-center bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white rounded-t-lg">
                  <div className="flex items-center justify-center mb-4">
                    <Image
                      src="/logo-educasaber.png"
                      alt="Logo EDUCASABER COLOMBIA"
                      width={128}
                      height={128}
                      className="object-contain drop-shadow-md"
                      priority
                    />
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

                    <div>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold"
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Hero Section */}
              <div className="text-center lg:text-left">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 mb-8">
                  <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      La plataforma que te prepara para{" "}
                      <span className="text-[#C00102] inline-block min-w-[200px] relative">
                        {currentText}
                        <span className="inline-block w-0.5 h-8 bg-[#C00102] ml-1 animate-pulse align-middle"></span>
                      </span>
                    </h1>
                    <p className="text-lg text-gray-800 mb-4 leading-relaxed font-medium">
                      <strong className="text-[#C00102]">Simulacros ICFES</strong>,{" "}
                      <strong className="text-[#73A2D3]">cursos especializados</strong>,{" "}
                      <strong className="text-[#C00102]">exámenes completos</strong> y{" "}
                      <strong className="text-[#73A2D3]">seguimiento detallado</strong> de tu progreso.
                    </p>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Todo lo que necesitas para alcanzar tus metas académicas en un solo lugar.
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-5">
                    <div className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#73A2D3] to-[#5a8bc4] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">Preparación Inteligente</h3>
                        <p className="text-gray-700 text-sm">
                          Simulacros adaptativos que se ajustan a tu nivel y te preparan para el éxito real.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#C00102] to-[#a00102] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">Progreso en Tiempo Real</h3>
                        <p className="text-gray-700 text-sm">
                          Visualiza tu avance, identifica fortalezas y áreas de mejora con análisis detallados.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">Contenido de Expertos</h3>
                        <p className="text-gray-700 text-sm">
                          Lecciones y exámenes creados por profesionales con años de experiencia en educación.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">Aprende a Tu Ritmo</h3>
                        <p className="text-gray-700 text-sm">
                          Acceso 24/7 desde cualquier dispositivo. Estudia cuando y donde quieras.
                        </p>
                      </div>
                    </div>
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
          <PublicHeader 
            showSignUpButton={true} 
            currentPath="/" 
            onNavigate={setCurrentView}
          />

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white uppercase tracking-[0.2em] text-xs font-semibold shadow-lg mb-4">
                Planes ICFES
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] via-[#C00102] to-[#0f172a] mb-4">
                Planes de Preparación ICFES
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto bg-white/80 border border-white/60 rounded-2xl px-6 py-4 shadow-md">
                Elige el plan que mejor se adapte a tus necesidades. Todos nuestros planes incluyen acceso completo a la
                plataforma, analítica avanzada y acompañamiento especializado.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plan Individual */}
              <Card className="relative overflow-hidden border-2 border-[#73A2D3] shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#73A2D3] to-[#C00102]"></div>
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#C00102] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Plan Individual</CardTitle>
                  <p className="text-gray-600 mt-2">Ruta PreICFES y Preuniversitario para un solo estudiante</p>
                </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col h-full">
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-[#73A2D3] bg-white border border-[#73A2D3]/30 rounded-xl px-4 py-2 transition hover:bg-[#73A2D3]/5 data-[state=open]:text-[#C00102]">
                    <span>Ver qué incluye</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <ul className="space-y-4">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Diagnóstico inicial y plan por competencias</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Ruta PreICFES + Preuniversitario con metas semanales</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Simulacros bimensuales con puntaje 0-500</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Clases grabadas + tutorías grupales en vivo</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Reportes automáticos e ICFES Score Tracker</span>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
                <div className="mt-auto pt-6">
                  <Button className="w-full h-12 bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold">
                    Comenzar Plan Individual
                  </Button>
                </div>
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
                </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col h-full">
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-[#C00102] bg-white border border-[#C00102]/30 rounded-xl px-4 py-2 transition hover:bg-[#C00102]/5 data-[state=open]:text-[#73A2D3]">
                    <span>Ver qué incluye</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <ul className="space-y-4">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Licencias PreICFES y Preuniversitario para cada estudiante</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Panel institucional con métricas por sede y curso</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Reportes comparativos (PDF/Excel) por competencia</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Gestión de grupos, jornadas y roles</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Acompañamiento académico con asesor dedicado</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Talleres y formación docente continua</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Sesiones informativas para familias y directivos</span>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
                <div className="mt-auto pt-6">
                  <Button className="w-full h-12 bg-gradient-to-r from-[#C00102] to-[#73A2D3] hover:from-[#a00102] hover:to-[#5a8bc4] text-white font-semibold">
                    Solicitar Cotización
                  </Button>
                </div>
              </CardContent>
              </Card>

              {/* Plan Cursos Personalizados */}
              <Card className="relative overflow-hidden border-2 border-purple-400 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Nuevo
                  </span>
                </div>
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Cursos Personalizados</CardTitle>
                  <p className="text-gray-600 mt-2">Para empresas, ONGs, universidades o proyectos especiales</p>
                  <div className="mt-6">
                    <span className="text-3xl font-bold text-purple-600">Bajo propuesta</span>
                  </div>
                </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col h-full">
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-purple-600 bg-white border border-purple-200 rounded-xl px-4 py-2 transition hover:bg-purple-50 data-[state=open]:text-indigo-600">
                    <span>Ver qué incluye</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <ul className="space-y-4">
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span>Diseño instruccional a medida (temas técnicos, soft skills, idiomas)</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span>Producción de contenidos y evaluaciones con branding de tu organización</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span>Plataforma con marca blanca, accesos ilimitados y licenciamiento flexible</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span>Reportes ejecutivos y seguimiento de competencias</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <span>Soporte premium y equipo de proyecto dedicado</span>
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
                <div className="mt-auto pt-6">
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:brightness-110 text-white font-semibold" onClick={() => setCurrentView("contacto")}>
                    Hablar con un asesor
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Preguntas Frecuentes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">¿Qué contenido incluye la plataforma?</h3>
                    <p className="text-gray-600">
                      La plataforma incluye lecciones, módulos y exámenes alineados con los lineamientos del ICFES para las cinco competencias principales: Lectura Crítica, Razonamiento Cuantitativo, Competencias Ciudadanas, Comunicación Escrita e Inglés.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">¿Cómo funciona el sistema de simulacros?</h3>
                    <p className="text-gray-600">
                      Los simulacros están diseñados para replicar las condiciones del examen ICFES real, con tiempo limitado y preguntas que evalúan todas las competencias. Los resultados se calculan en la escala 0-500.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">¿Puedo acceder desde cualquier dispositivo?</h3>
                    <p className="text-gray-600">
                      Sí, la plataforma es responsive y se adapta a diferentes dispositivos. Puedes acceder desde computadoras, tablets y smartphones con conexión a internet.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">¿Los reportes se generan automáticamente?</h3>
                    <p className="text-gray-600">
                      Sí, la plataforma genera reportes automáticos de progreso por competencia, incluyendo gráficas de evolución y comparación con el grupo. Los reportes están disponibles en formato PDF.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#73A2D3]">¿Cómo se calcula el puntaje ICFES estimado?</h3>
                    <p className="text-gray-600">
                      El puntaje se calcula basándose en tus respuestas en simulacros completos y exámenes de diagnóstico, considerando la dificultad de las preguntas, la competencia evaluada y la recencia de los exámenes.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-[#C00102]">¿Puedo personalizar mi ruta de estudio?</h3>
                    <p className="text-gray-600">
                      La plataforma genera una ruta de estudio personalizada basada en tu diagnóstico inicial, identificando tus fortalezas y áreas de mejora en cada competencia.
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
          <PublicHeader 
            showSignUpButton={true} 
            currentPath="/cursos" 
            onNavigate={setCurrentView}
          />

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#73A2D3] via-[#5a8bc4] to-[#C00102] text-white uppercase tracking-[0.2em] text-xs font-semibold shadow-lg mb-4">
                Cursos ICFES
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] via-[#73A2D3] to-[#C00102] mb-4">
                Nuestros Cursos ICFES
              </h1>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto bg-white/85 border border-white/60 rounded-2xl px-6 py-4 shadow-md">
                Prepárate con rutas de estudio por competencia, simulacros cronometrados y clases guiadas por expertos. Todos los contenidos
                están alineados con los lineamientos vigentes del ICFES y se actualizan de forma continua.
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
                  <Link href="/cursos">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Cursos
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
                  <Link href="/cursos">
                    <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold">
                      Ver Cursos
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
                  <Link href="/cursos">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Cursos
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
                  <Link href="/cursos">
                    <Button className="w-full bg-gradient-to-r from-[#C00102] to-[#a00102] hover:from-[#a00102] hover:to-[#800001] text-white font-semibold">
                      Ver Cursos
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
                  <Link href="/cursos">
                    <Button className="w-full bg-gradient-to-r from-[#73A2D3] to-[#5a8bc4] hover:from-[#5a8bc4] hover:to-[#4a7ba7] text-white font-semibold">
                      Ver Cursos
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
          <PublicHeader 
            showSignUpButton={true} 
            currentPath="/#acerca" 
            onNavigate={setCurrentView}
          />

          <div className="container mx-auto px-4 py-12">
            {/* Hero Section - Quiénes Somos */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white uppercase tracking-[0.3em] text-xs font-semibold shadow-lg mb-4">
                Quiénes Somos
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] via-[#73A2D3] to-[#C00102] mb-4">
                Equipo experto en fortalecimiento académico
              </h1>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto bg-white/90 border border-white rounded-2xl px-6 py-4 shadow-md">
                EDUCASABER COLOMBIA está conformada por un equipo profesional en pedagogía, didáctica, lenguaje,
                matemáticas y ciencias, dedicado a fortalecer las competencias de estudiantes, docentes e instituciones
                educativas en todo el país.
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
                    Brindar soluciones educativas de alta calidad que fortalezcan los procesos de enseñanza y evaluación
                    en diferentes niveles de la educación en Colombia, potenciando las capacidades y competencias en
                    Lectura Crítica, Matemáticas, Ciencias Naturales, Competencias Ciudadanas y Ciencias Sociales,
                    tanto en entornos presenciales como virtuales.
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
                    Ser la empresa educativa líder en preparación para pruebas de Estado y fortalecimiento de
                    competencias en Colombia, reconocida por integrar pedagogía experta y tecnología innovadora para
                    acompañar a niños, jóvenes y adultos en sus proyectos académicos y profesionales.
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

            {/* Historia y metodología */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#73A2D3]">Nuestra historia</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 leading-relaxed">
                  <p>
                    Nacimos como parte de <strong>Pruebas por Colombia</strong>, iniciativa que desde hace más de una
                    década acompaña a colegios públicos y privados en la preparación de las pruebas Saber 11°.
                    Implementamos ferias académicas, simulacros regionales y acompañamiento directo a estudiantes de
                    municipios con baja cobertura educativa.
                  </p>
                  <p className="mt-4">
                    Esa experiencia se transformó en EDUCASABER COLOMBIA: hoy combinamos la tradición presencial del
                    programa original con recursos digitales, analítica y reportes que permiten medir el avance real de
                    cada estudiante.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#C00102]">Metodología integral</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 leading-relaxed">
                  <p>
                    Replicamos el modelo mostrado en pruebasporcolombia.com: diagnóstico inicial, talleres docentes,
                    mentoría a familias y seguimiento permanente a través de tutorías, campamentos académicos y espacios
                    de motivación.
                  </p>
                  <p className="mt-4">
                    Todo el contenido está desarrollado por especialistas en lenguaje, matemáticas, ciencias sociales y
                    naturales, lo que garantiza coherencia con los lineamientos del ICFES y los procesos de admisión a
                    la Universidad Nacional.
                  </p>
                </CardContent>
              </Card>
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
          <PublicHeader 
            showSignUpButton={true} 
            currentPath="/#contacto" 
            onNavigate={setCurrentView}
          />

          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white uppercase tracking-[0.3em] text-xs font-semibold shadow-lg mb-4">
                Contáctanos
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] via-[#73A2D3] to-[#C00102] mb-4">
                Hablemos sobre tus objetivos académicos
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto bg-white/85 border border-white/60 rounded-2xl px-6 py-4 shadow-md">
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
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre completo</Label>
                        <Input
                          id="nombre"
                          placeholder="Tu nombre"
                          className="border-gray-200"
                          value={contactForm.name}
                          onChange={(e) => handleContactChange("name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Correo electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="tu@email.com"
                          className="border-gray-200"
                          value={contactForm.email}
                          onChange={(e) => handleContactChange("email", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="telefono">Celular *</Label>
                      <Input
                        id="telefono"
                        required
                        placeholder="Tu número de celular"
                        className="border-gray-200"
                        value={contactForm.phone}
                        onChange={(e) => handleContactChange("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="institucion">Institución educativa</Label>
                      <Input
                        id="institucion"
                        placeholder="Nombre de tu colegio o institución"
                        className="border-gray-200"
                        value={contactForm.institution}
                        onChange={(e) => handleContactChange("institution", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="asunto">Asunto</Label>
                      <Input
                        id="asunto"
                        placeholder="¿En qué podemos ayudarte?"
                        className="border-gray-200"
                        value={contactForm.subject}
                        onChange={(e) => handleContactChange("subject", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mensaje">Mensaje</Label>
                      <textarea
                        id="mensaje"
                        className="w-full p-3 border border-gray-200 rounded-md resize-none h-32"
                        placeholder="Escribe tu mensaje aquí..."
                        value={contactForm.message}
                        onChange={(e) => handleContactChange("message", e.target.value)}
                      />
                    </div>
                    {contactError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {contactError}
                      </p>
                    )}
                    {contactSuccess && (
                      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                        {contactSuccess}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={contactLoading}
                      className="w-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] hover:from-[#5a8bc4] hover:to-[#a00102] text-white font-semibold"
                    >
                      {contactLoading ? "Enviando..." : "Enviar Mensaje"}
                    </Button>
                  </form>
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
                        <strong>Celular:</strong> 320 3206960 - 316 8246767
                      </p>
                      <p>
                        <strong>Email:</strong> aletell5@hotmail.com
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

  // Otros Servicios Page
  if (currentView === "otros-servicios") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Navigation */}
          <PublicHeader 
            showSignUpButton={true} 
            currentPath="/otros-servicios" 
            onNavigate={setCurrentView}
          />

          {/* Hero Section */}
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white uppercase tracking-[0.3em] text-xs font-semibold shadow-lg mb-4">
                Otros Servicios
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f172a] via-purple-500 to-indigo-500 mb-4">
                Soluciones y Cursos Personalizados
              </h1>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto bg-white/90 border border-white/60 rounded-2xl px-6 py-4 shadow-md">
                Diseñamos experiencias de aprendizaje a medida para instituciones, empresas y proyectos especiales.
                Adaptamos temáticas, formatos y evaluaciones manteniendo la calidad pedagógica de la plataforma.
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-12">
            {/* Features Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">¿Por qué elegir nuestros cursos personalizados?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl mb-3">Contenido a Medida</h3>
                    <p className="text-gray-600">
                      Diseñamos el contenido específicamente para tus objetivos y audiencia, sin limitaciones temáticas.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl mb-3">Para Cualquier Audiencia</h3>
                    <p className="text-gray-600">
                      Estudiantes, empleados, clientes o cualquier grupo que necesite capacitación especializada.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl mb-3">Seguimiento Completo</h3>
                    <p className="text-gray-600">
                      Monitorea el progreso, realiza evaluaciones y obtén reportes detallados del rendimiento.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Use Cases Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Casos de Uso</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Building className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Capacitación Corporativa</CardTitle>
                        <p className="text-gray-600 mt-1">Para empresas e instituciones</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Capacita a tus empleados con cursos específicos de tu industria, procesos internos, 
                      políticas corporativas o habilidades técnicas requeridas.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Onboarding de nuevos empleados</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Capacitación en productos y servicios</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Certificaciones internas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Desarrollo de habilidades blandas</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Educación Especializada</CardTitle>
                        <p className="text-gray-600 mt-1">Para colegios y universidades</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Crea cursos personalizados para materias específicas, programas académicos, 
                      preparación para exámenes especializados o contenido complementario.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Cursos de materias específicas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Preparación para exámenes especializados</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Programas de extensión</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Refuerzo académico personalizado</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Preparación U. Nacional</CardTitle>
                        <p className="text-gray-600 mt-1">Ingreso a la Universidad Nacional</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Diseñamos programas específicos para aspirantes a la Universidad Nacional: simulacros,
                      refuerzos por áreas y estrategias de admisión.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Simulacros tipo admisión</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Refuerzo por áreas críticas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Acompañamiento estratégico</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Seguimiento personalizado</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Contenido Único</CardTitle>
                        <p className="text-gray-600 mt-1">Para necesidades específicas</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Cualquier temática que necesites: desde cursos de cocina hasta programación avanzada, 
                      sin limitaciones en el tipo de contenido.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                        <span>Sin restricciones temáticas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                        <span>Múltiples formatos de contenido</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                        <span>Evaluaciones personalizadas</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                        <span>Gamificación opcional</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-4xl font-bold mb-4">¿Listo para crear tu curso personalizado?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Contáctanos y te ayudaremos a diseñar la solución educativa perfecta para tus necesidades.
                </p>
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                    onClick={() => setCurrentView("contacto")}
                  >
                    Solicitar Información
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Términos y Condiciones
  if (currentView === "terminos") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <PublicHeader showSignUpButton={true} currentPath="/" onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
              <p className="text-gray-600 text-sm">
                Última actualización: Enero 2026
              </p>
            </div>
            <div className="space-y-6 text-gray-700 text-sm leading-relaxed bg-white rounded-2xl shadow-md p-6">
              <section>
                <h2 className="font-semibold text-base mb-2">1. Aceptación de los términos</h2>
                <p>
                  Al acceder y utilizar esta plataforma educativa, usted acepta estar sujeto a estos términos y condiciones de uso. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la plataforma. El uso continuado de 
                  la plataforma después de cualquier modificación constituye su aceptación de dichos cambios.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">2. Objeto y alcance de la plataforma</h2>
                <p>
                  Esta plataforma tiene como objeto proporcionar servicios educativos virtuales, incluyendo pero no limitándose 
                  a: preparación para pruebas de Estado, cursos preuniversitarios, contenidos educativos, evaluaciones, simulacros 
                  y herramientas de seguimiento académico. Los servicios están dirigidos a instituciones educativas, estudiantes, 
                  docentes y otros usuarios autorizados.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">3. Registro y cuenta de usuario</h2>
                <p>
                  Para acceder a ciertos servicios de la plataforma, es necesario crear una cuenta proporcionando información 
                  veraz, exacta y completa. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso 
                  (usuario y contraseña) y de todas las actividades que ocurran bajo su cuenta. Debe notificar inmediatamente 
                  cualquier uso no autorizado de su cuenta. La plataforma se reserva el derecho de suspender o cancelar cuentas 
                  que violen estos términos.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">4. Uso adecuado de la plataforma</h2>
                <p>
                  Usted se compromete a utilizar la plataforma de manera lícita y conforme a estos términos. Está prohibido: 
                  (a) utilizar la plataforma para fines ilegales o no autorizados; (b) intentar acceder a áreas restringidas 
                  o a información de otros usuarios; (c) interferir con el funcionamiento de la plataforma; (d) reproducir, 
                  copiar, vender o explotar comercialmente cualquier contenido sin autorización expresa; (e) utilizar robots, 
                  scripts automatizados o métodos similares para acceder a la plataforma.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">5. Propiedad intelectual</h2>
                <p>
                  Todo el contenido de la plataforma, incluyendo textos, gráficos, logos, iconos, imágenes, videos, software, 
                  y compilaciones de datos, es propiedad de la plataforma o de sus proveedores de contenido y está protegido 
                  por las leyes de propiedad intelectual de Colombia e internacionales. El uso de estos contenidos está limitado 
                  al uso personal y educativo dentro del contexto de la plataforma. Cualquier otro uso requiere autorización 
                  previa y por escrito.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">6. Contenido del usuario</h2>
                <p>
                  Al proporcionar contenido a través de la plataforma (comentarios, respuestas, trabajos, etc.), usted otorga 
                  una licencia no exclusiva, libre de regalías y transferible para usar, reproducir, modificar y distribuir 
                  dicho contenido en relación con la operación de la plataforma. Usted garantiza que tiene todos los derechos 
                  necesarios sobre el contenido que proporciona y que no viola derechos de terceros.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">7. Limitación de responsabilidad</h2>
                <p>
                  La plataforma se proporciona "tal cual" y "según disponibilidad". No garantizamos que la plataforma esté 
                  libre de errores, interrupciones o defectos. No nos hacemos responsables por daños directos, indirectos, 
                  incidentales o consecuentes derivados del uso o la imposibilidad de usar la plataforma. No garantizamos 
                  resultados específicos en pruebas oficiales o procesos académicos. La responsabilidad se limita al máximo 
                  permitido por la ley aplicable.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">8. Disponibilidad y mantenimiento</h2>
                <p>
                  Nos reservamos el derecho de realizar mantenimiento programado o de emergencia que pueda resultar en 
                  interrupciones temporales del servicio. No garantizamos disponibilidad continua o ininterrumpida de la 
                  plataforma. No nos hacemos responsables por interrupciones causadas por terceros, incluyendo proveedores 
                  de servicios de internet o hosting.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">9. Enlaces a sitios de terceros</h2>
                <p>
                  La plataforma puede contener enlaces a sitios web de terceros. No tenemos control sobre estos sitios y 
                  no asumimos responsabilidad por su contenido, políticas de privacidad o prácticas. El acceso a estos sitios 
                  es bajo su propio riesgo.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">10. Modificaciones de los términos</h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán 
                  en vigor al ser publicadas en la plataforma. Es su responsabilidad revisar periódicamente estos términos. 
                  El uso continuado de la plataforma después de las modificaciones constituye su aceptación de los nuevos términos.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">11. Terminación</h2>
                <p>
                  Podemos suspender o terminar su acceso a la plataforma en cualquier momento, con o sin causa, con o sin 
                  previo aviso, por cualquier motivo, incluyendo pero no limitándose a la violación de estos términos. 
                  Usted puede terminar su cuenta en cualquier momento contactándonos a través de los canales indicados.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">12. Ley aplicable y jurisdicción</h2>
                <p>
                  Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa relacionada con 
                  estos términos o con el uso de la plataforma será resuelta en los tribunales competentes de Colombia, 
                  renunciando las partes a cualquier otro fuero que pudiera corresponderles.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">13. Contacto</h2>
                <p>
                  Para cualquier consulta sobre estos términos y condiciones, puede contactarnos a través de los canales 
                  de comunicación indicados en la sección de contacto de la plataforma.
                </p>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Política de Privacidad
  if (currentView === "privacidad") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <PublicHeader showSignUpButton={true} currentPath="/" onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad y Protección de Datos Personales</h1>
              <p className="text-gray-600 text-sm">
                Última actualización: Enero 2026
              </p>
            </div>
            <div className="space-y-6 text-gray-700 text-sm leading-relaxed bg-white rounded-2xl shadow-md p-6">
              <section>
                <h2 className="font-semibold text-base mb-2">1. Responsable del tratamiento de datos personales</h2>
                <p>
                  De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, la entidad responsable del tratamiento 
                  de datos personales recolectados a través de esta plataforma procesa la información personal conforme a 
                  los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación 
                  restringida, seguridad y confidencialidad establecidos en la normativa vigente.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">2. Datos personales que recolectamos</h2>
                <p className="mb-2">Recolectamos y tratamos los siguientes tipos de datos personales:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Datos de identificación:</strong> Nombres, apellidos, número de documento de identidad, fecha de nacimiento, género.</li>
                  <li><strong>Datos de contacto:</strong> Dirección de correo electrónico, número de teléfono celular, dirección de residencia.</li>
                  <li><strong>Datos académicos:</strong> Grado académico, institución educativa, resultados de evaluaciones, progreso académico, calificaciones.</li>
                  <li><strong>Datos de uso de la plataforma:</strong> Tiempos de conexión, páginas visitadas, lecciones completadas, respuestas a preguntas, preferencias de usuario.</li>
                  <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo, información del dispositivo.</li>
                </ul>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">3. Finalidades del tratamiento</h2>
                <p className="mb-2">Los datos personales son tratados para las siguientes finalidades:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Gestionar el registro, acceso y uso de la plataforma educativa.</li>
                  <li>Proporcionar los servicios educativos contratados, incluyendo cursos, lecciones, evaluaciones y simulacros.</li>
                  <li>Generar reportes académicos, métricas de progreso, análisis pedagógicos y certificados de participación.</li>
                  <li>Comunicarnos con los usuarios para soporte técnico, avisos importantes, actualizaciones del servicio y mejoras.</li>
                  <li>Cumplir obligaciones contractuales con instituciones educativas y usuarios.</li>
                  <li>Cumplir con obligaciones legales y responder a requerimientos de autoridades competentes.</li>
                  <li>Realizar análisis estadísticos y de uso de la plataforma para mejorar nuestros servicios.</li>
                  <li>Gestionar pagos y facturación cuando corresponda.</li>
                  <li>Prevenir fraudes y garantizar la seguridad de la plataforma.</li>
                </ul>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">4. Autorización y consentimiento</h2>
                <p>
                  Al proporcionar sus datos personales y utilizar la plataforma, el titular autoriza de manera expresa, 
                  previa, informada y voluntaria el tratamiento de sus datos personales para las finalidades descritas 
                  en esta política. El consentimiento puede ser revocado en cualquier momento, sin que ello afecte la 
                  validez del tratamiento realizado con anterioridad.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">5. Derechos de los titulares de datos personales</h2>
                <p className="mb-2">De conformidad con la Ley 1581 de 2012, los titulares tienen derecho a:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Conocer:</strong> Acceder de forma gratuita a sus datos personales que sean objeto de tratamiento.</li>
                  <li><strong>Actualizar y rectificar:</strong> Solicitar la corrección de datos inexactos, incompletos o desactualizados.</li>
                  <li><strong>Suprimir:</strong> Solicitar la eliminación de datos cuando considere que no se están tratando conforme a los principios y deberes establecidos en la ley.</li>
                  <li><strong>Revocar la autorización:</strong> Solicitar la revocación de la autorización y/o supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</li>
                  <li><strong>Solicitar prueba de la autorización:</strong> Obtener de la entidad responsable del tratamiento, previa solicitud, prueba de la autorización otorgada.</li>
                  <li><strong>Presentar quejas ante la Superintendencia de Industria y Comercio:</strong> Por infracciones a la normativa de protección de datos personales.</li>
                </ul>
                <p className="mt-2">
                  Para ejercer estos derechos, los titulares pueden contactarnos a través de los canales indicados en la 
                  sección de contacto de esta plataforma.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">6. Transferencia y transmisión de datos</h2>
                <p>
                  Los datos personales pueden ser compartidos con: (a) instituciones educativas con las que el usuario 
                  tiene relación contractual; (b) proveedores de servicios tecnológicos que actúan como encargados del 
                  tratamiento bajo estrictos acuerdos de confidencialidad; (c) autoridades competentes cuando sea requerido 
                  por ley. No vendemos ni alquilamos datos personales a terceros para fines comerciales.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">7. Medidas de seguridad</h2>
                <p>
                  Implementamos medidas técnicas, administrativas y organizativas razonables para proteger los datos 
                  personales contra acceso no autorizado, pérdida, destrucción, alteración o divulgación. Estas medidas 
                  incluyen, entre otras: encriptación de datos sensibles, controles de acceso, monitoreo de seguridad, 
                  copias de seguridad regulares y capacitación del personal.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">8. Conservación de datos</h2>
                <p>
                  Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades para 
                  las cuales fueron recolectados, y en todo caso, durante los plazos establecidos por la normativa legal 
                  aplicable. Una vez cumplidas las finalidades y vencidos los plazos legales, los datos serán eliminados 
                  de forma segura.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">9. Datos de menores de edad</h2>
                <p>
                  El tratamiento de datos personales de menores de edad se realizará respetando sus derechos prevalentes 
                  y contando con la autorización de los padres, representantes legales o tutores. Los menores de edad 
                  tienen derecho a ejercer sus derechos de protección de datos personales a través de sus representantes legales.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">10. Modificaciones a la política</h2>
                <p>
                  Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Las 
                  modificaciones serán publicadas en esta página con la fecha de última actualización. Se recomienda 
                  revisar periódicamente esta política para estar informado sobre cómo protegemos sus datos personales.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">11. Contacto y ejercicio de derechos</h2>
                <p>
                  Para ejercer sus derechos, presentar consultas, quejas o solicitudes relacionadas con el tratamiento 
                  de datos personales, puede contactarnos a través de los canales de comunicación indicados en la sección 
                  de contacto de la plataforma. Nos comprometemos a responder sus solicitudes en un plazo máximo de diez 
                  (10) días hábiles.
                </p>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Política de Cookies
  if (currentView === "cookies") {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <PublicHeader showSignUpButton={true} currentPath="/" onNavigate={setCurrentView} />
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies y Tecnologías Similares</h1>
              <p className="text-gray-600 text-sm">
                Última actualización: Enero 2026
              </p>
            </div>
            <div className="space-y-6 text-gray-700 text-sm leading-relaxed bg-white rounded-2xl shadow-md p-6">
              <section>
                <h2 className="font-semibold text-base mb-2">1. ¿Qué son las cookies?</h2>
                <p>
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, tablet, 
                  smartphone) cuando visita un sitio web. Estas cookies permiten que el sitio web recuerde sus acciones 
                  y preferencias durante un período de tiempo, por lo que no tiene que volver a configurarlas cada vez 
                  que regresa al sitio o navega de una página a otra.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">2. ¿Qué tecnologías similares utilizamos?</h2>
                <p>
                  Además de las cookies tradicionales, utilizamos otras tecnologías similares como: almacenamiento local 
                  (localStorage y sessionStorage), píxeles de seguimiento, identificadores de dispositivo y tecnologías 
                  de seguimiento web. Estas tecnologías cumplen funciones similares a las cookies y se rigen por esta política.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">3. Tipos de cookies que utilizamos</h2>
                <p className="mb-2">Utilizamos los siguientes tipos de cookies:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Cookies estrictamente necesarias:</strong> Son esenciales para el funcionamiento de la plataforma. 
                    Permiten la navegación básica y el uso de funciones esenciales como el acceso a áreas seguras, el 
                    mantenimiento de sesiones de usuario y la seguridad. Estas cookies no pueden desactivarse.
                  </li>
                  <li>
                    <strong>Cookies de funcionalidad o preferencias:</strong> Permiten que la plataforma recuerde sus 
                    preferencias y elecciones (como idioma, región, configuración de visualización) para proporcionar 
                    una experiencia más personalizada.
                  </li>
                  <li>
                    <strong>Cookies de rendimiento o analíticas:</strong> Recopilan información sobre cómo utiliza la 
                    plataforma (páginas visitadas, tiempo de permanencia, errores encontrados) para ayudarnos a mejorar 
                    el rendimiento y la funcionalidad de la plataforma. Esta información se agrega de forma anónima.
                  </li>
                  <li>
                    <strong>Cookies de sesión:</strong> Son temporales y se eliminan cuando cierra su navegador. Se 
                    utilizan para mantener su sesión activa mientras navega por la plataforma.
                  </li>
                  <li>
                    <strong>Cookies persistentes:</strong> Permanecen en su dispositivo durante un período determinado 
                    o hasta que las elimine manualmente. Se utilizan para recordar sus preferencias y configuraciones.
                  </li>
                </ul>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">4. Finalidad del uso de cookies</h2>
                <p className="mb-2">Utilizamos cookies para las siguientes finalidades:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Garantizar el funcionamiento correcto y seguro de la plataforma.</li>
                  <li>Mantener su sesión activa y autenticada.</li>
                  <li>Recordar sus preferencias y configuraciones personales.</li>
                  <li>Mejorar la experiencia de usuario y personalizar el contenido.</li>
                  <li>Analizar el uso de la plataforma para identificar áreas de mejora.</li>
                  <li>Medir la efectividad de nuestras funcionalidades y servicios.</li>
                  <li>Garantizar la seguridad y prevenir fraudes.</li>
                </ul>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">5. Cookies de terceros</h2>
                <p>
                  Algunas cookies pueden ser establecidas por servicios de terceros que aparecen en nuestras páginas. 
                  Estas cookies son establecidas por dominios diferentes al nuestro y están sujetas a las políticas 
                  de privacidad de dichos terceros. No tenemos control sobre estas cookies y le recomendamos revisar 
                  las políticas de privacidad de estos terceros.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">6. Gestión y control de cookies</h2>
                <p className="mb-2">
                  Usted tiene control sobre las cookies. Puede configurar su navegador para aceptar, rechazar o eliminar 
                  cookies. Sin embargo, tenga en cuenta que:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Si desactiva las cookies estrictamente necesarias, algunas funcionalidades de la plataforma pueden no estar disponibles.</li>
                  <li>Si desactiva las cookies de funcionalidad, la plataforma puede no recordar sus preferencias.</li>
                  <li>La experiencia de usuario puede verse afectada si desactiva ciertas cookies.</li>
                </ul>
                <p className="mt-2">
                  Para gestionar las cookies en los navegadores más comunes, puede acceder a la configuración de privacidad 
                  o preferencias de su navegador. Las instrucciones varían según el navegador que utilice.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">7. Consentimiento para el uso de cookies</h2>
                <p>
                  Al continuar navegando en la plataforma después de haber sido informado sobre el uso de cookies, usted 
                  consiente el uso de cookies de acuerdo con esta política. Puede retirar su consentimiento en cualquier 
                  momento modificando la configuración de cookies de su navegador.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">8. Actualizaciones de esta política</h2>
                <p>
                  Podemos actualizar esta política de cookies periódicamente para reflejar cambios en nuestras prácticas 
                  o en la normativa aplicable. La versión actualizada estará disponible en esta página con la fecha de 
                  última actualización. Le recomendamos revisar esta política periódicamente para estar informado sobre 
                  cómo utilizamos las cookies.
                </p>
              </section>
              <section>
                <h2 className="font-semibold text-base mb-2">9. Más información</h2>
                <p>
                  Si tiene preguntas sobre nuestra política de cookies o sobre cómo utilizamos estas tecnologías, puede 
                  contactarnos a través de los canales de comunicación indicados en la sección de contacto de la plataforma.
                </p>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return null
}
