"use client"

import { useMemo, useState, use, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Clock,
  CheckCircle,
  PlayCircle,
  Target,
  ChevronRight,
  Star,
  Users,
  Award,
  ArrowLeft,
} from "lucide-react"

// Datos de los modulos por materia
const modulosData = {
  "lectura-critica": {
    title: "Lectura Critica",
    color: "#73A2D3",
    description: "Desarrolla habilidades avanzadas de comprension lectora y pensamiento critico",
    progreso: 85,
    modulos: [
      {
        id: 1,
        title: "Fundamentos de Comprension Lectora",
        description: "Aprende los conceptos basicos de comprension de textos",
        duration: "2 semanas",
        lessons: 8,
        completed: 8,
        lecciones: [
          {
            id: 1,
            title: "Tipos de textos y estructuras",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Identificacion de ideas principales",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Tecnicas de lectura rapida",
            duration: "35 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Vocabulario contextual",
            duration: "50 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 5,
            title: "Practica de comprension lectora",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Analisis de textos narrativos",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Textos descriptivos y expositivos",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Evaluacion del modulo",
            duration: "30 min",
            completed: true,
            type: "examen",
          },
        ],
      },
      {
        id: 2,
        title: "Analisis de Textos Argumentativos",
        description: "Domina el analisis de argumentos y estructuras argumentativas",
        duration: "3 semanas",
        lessons: 12,
        completed: 7,
        lecciones: [
          {
            id: 1,
            title: "Estructura de argumentos",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Premisas y conclusiones",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Tipos de argumentos",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Falacias logicas comunes",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Evaluacion de argumentos",
            duration: "45 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Practica de analisis argumentativo",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 7,
            title: "Textos persuasivos",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Analisis critico de editoriales",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 9,
            title: "Contraargumentos y refutaciones",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 10,
            title: "Practica avanzada",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 11,
            title: "Simulacro de argumentacion",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Evaluacion del modulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  matematicas: {
    title: "Matematicas",
    color: "#C00102",
    description: "Fortalece conocimientos en algebra, geometria, estadistica y calculo",
    progreso: 68,
    modulos: [
      {
        id: 1,
        title: "Algebra y Funciones",
        description: "Domina las operaciones algebraicas y el analisis de funciones",
        duration: "4 semanas",
        lessons: 16,
        completed: 12,
        lecciones: [
          {
            id: 1,
            title: "Operaciones con polinomios",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Factorizacion",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Ecuaciones lineales",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Ecuaciones cuadraticas",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Sistemas de ecuaciones",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Funciones: dominio y rango",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Funcion lineal",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Funcion cuadratica",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Funcion exponencial",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 10,
            title: "Graficas de funciones",
            duration: "55 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 11,
            title: "Transformaciones de funciones",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 12,
            title: "Practica de algebra",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 13,
            title: "Aplicaciones de funciones",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 14,
            title: "Problemas contextualizados",
            duration: "55 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 15,
            title: "Simulacro de algebra",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluacion del modulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  "ciencias-naturales": {
    title: "Ciencias Naturales",
    color: "#73A2D3",
    description: "Explora conceptos fundamentales de biologia, quimica y fisica",
    progreso: 72,
    modulos: [
      {
        id: 1,
        title: "Biologia Celular y Molecular",
        description: "Comprende la estructura y funcion de las celulas",
        duration: "4 semanas",
        lessons: 16,
        completed: 10,
        lecciones: [
          {
            id: 1,
            title: "Estructura celular",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Funcion celular",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Biomoleculas: carbohidratos",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Biomoleculas: lipidos",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Biomoleculas: proteinas",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 6,
            title: "Acidos nucleicos",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Metabolismo celular",
            duration: "60 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Respiracion celular",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Fotosintesis",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 10,
            title: "Division celular: mitosis",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 11,
            title: "Division celular: meiosis",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 12,
            title: "Genetica molecular",
            duration: "55 min",
            completed: false,
            type: "video",
          },
          {
            id: 13,
            title: "Expresion genica",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 14,
            title: "Practica de biologia celular",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 15,
            title: "Simulacro de biologia",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluacion del modulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  "ciencias-sociales": {
    title: "Ciencias Sociales",
    color: "#C00102",
    description: "Comprende la historia, geografia y constitucion politica",
    progreso: 78,
    modulos: [
      {
        id: 1,
        title: "Historia de Colombia",
        description: "Explora los eventos mas importantes de la historia colombiana",
        duration: "4 semanas",
        lessons: 16,
        completed: 14,
        lecciones: [
          {
            id: 1,
            title: "Periodo precolombino",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Culturas indigenas",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Conquista espanola",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Colonizacion",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Independencia",
            duration: "60 min",
            completed: true,
            type: "video",
          },
          {
            id: 6,
            title: "Formacion de la Republica",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Siglo XIX: guerras civiles",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Regeneracion",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Siglo XX: La Violencia",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 10,
            title: "Frente Nacional",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 11,
            title: "Conflicto armado",
            duration: "60 min",
            completed: true,
            type: "video",
          },
          {
            id: 12,
            title: "Constitucion de 1991",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 13,
            title: "Colombia contemporanea",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 14,
            title: "Proceso de paz",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 15,
            title: "Practica de historia",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluacion del modulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  ingles: {
    title: "Ingles",
    color: "#73A2D3",
    description: "Desarrolla habilidades de comprension lectora y gramatica en ingles",
    progreso: 90,
    modulos: [
      {
        id: 1,
        title: "Reading Comprehension Strategies",
        description: "Master effective reading techniques for the ICFES exam",
        duration: "3 semanas",
        lessons: 12,
        completed: 12,
        lecciones: [
          {
            id: 1,
            title: "Skimming and scanning techniques",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Identifying main ideas",
            duration: "35 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Supporting details",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Text structure and organization",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Inferring meaning from context",
            duration: "50 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Author's purpose and tone",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Reading practice: narratives",
            duration: "55 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 8,
            title: "Reading practice: expository texts",
            duration: "50 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 9,
            title: "Reading practice: argumentative texts",
            duration: "45 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 10,
            title: "Advanced reading strategies",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 11,
            title: "Reading comprehension practice",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Module evaluation",
            duration: "30 min",
            completed: true,
            type: "examen",
          },
        ],
      },
      {
        id: 2,
        title: "Grammar and Language Use",
        description: "Master essential grammar structures for the ICFES",
        duration: "3 semanas",
        lessons: 12,
        completed: 8,
        lecciones: [
          {
            id: 1,
            title: "Verb tenses: present forms",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Verb tenses: past forms",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Verb tenses: future forms",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Perfect tenses",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Conditional sentences",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 6,
            title: "Passive voice",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 7,
            title: "Reported speech",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Modal verbs",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Sentence structure",
            duration: "40 min",
            completed: false,
            type: "video",
          },
          {
            id: 10,
            title: "Grammar practice exercises",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 11,
            title: "Advanced grammar review",
            duration: "50 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Module evaluation",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
}

interface ModulosPageProps {
  params: Promise<{
    materia: string
  }>
}

export default function ModulosPage({ params }: ModulosPageProps) {
  const [moduloActivo, setModuloActivo] = useState(0)

  // Unwrap params (Next 15)
  const { materia } = use(params)

  // Detectar modo preview (desde admin) por query ?origin=admin
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isPreview = useMemo(() => searchParams?.get('origin') === 'admin', [searchParams])
  const courseId = useMemo(() => searchParams?.get('courseId') || undefined, [searchParams])

  // Cargar datos reales del curso si llega courseId (solo modulos)
  const [apiModules, setApiModules] = useState<Array<{ id: string; title: string }>>([])
  const [apiLoaded, setApiLoaded] = useState(false)
  useEffect(() => {
    let active = true
    const fetchCourse = async () => {
      if (!isPreview || !courseId) {
        setApiLoaded(true)
        return
      }
      try {
        const res = await fetch(`/api/courses/${courseId}`)
        if (active) {
          if (res.ok) {
            const data = await res.json()
            const mods = Array.isArray(data.modules)
              ? data.modules.map((m: any) => ({ id: m.id, title: m.title }))
              : []
            setApiModules(mods)
          }
          setApiLoaded(true)
        }
      } catch (_) {
        if (active) setApiLoaded(true)
      }
    }
    fetchCourse()
    return () => {
      active = false
    }
  }, [isPreview, courseId])

  const baseCurso = modulosData[materia as keyof typeof modulosData]
  const curso = useMemo(() => {
    // Base visual (para colores/nombre/descripcion)
    const base = baseCurso || { title: materia, color: "#73A2D3", description: "", progreso: 0, modulos: [] as any[] }

    if (!isPreview) return base

    // En preview: usar modulos reales si existen (aunque esten vacios de lecciones)
    if (apiModules.length > 0) {
      return {
        ...base,
        progreso: 0,
        modulos: apiModules.map((m) => ({
          id: m.id,
          title: m.title,
          description: '',
          duration: '-',
          lessons: 0,
          completed: 0,
          lecciones: [] as any[],
        })),
      }
    }

    // Sin modulos reales recibidos (aun), conservamos base
    return { ...base, progreso: 0 }
  }, [isPreview, apiModules, baseCurso, materia])

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Curso no encontrado</h1>
          <Link href="/estudiante">
            <Button className="bg-[#73A2D3]">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "video":
        return <PlayCircle className="h-4 w-4 text-blue-500" />
      case "ejercicio":
        return <Target className="h-4 w-4 text-green-500" />
      case "examen":
        return <Award className="h-4 w-4 text-purple-500" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />
    }
  }

  const hasModules = Array.isArray((curso as any).modulos) && (curso as any).modulos.length > 0
  const safeIndex = hasModules ? Math.min(moduloActivo, (curso as any).modulos.length - 1) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
              <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/estudiante" className="hover:text-[#73A2D3]">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#73A2D3]">{(curso as any).title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge style={{ backgroundColor: (curso as any).color }} className="text-white">
              {(curso as any).title}
            </Badge>
            {isPreview ? (
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Regresar al panel
              </Button>
            ) : (
              <Link href="/estudiante">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{(curso as any).title}</h1>
              <p className="text-lg text-gray-600 mb-4">{(curso as any).description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                {!isPreview && (
                  <>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>1,234 estudiantes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.8/5</span>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{hasModules ? (curso as any).modulos.length : 0} modulos</span>
                </div>
              </div>
            </div>
            {!isPreview && (
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: (curso as any).color }}>
                  {(curso as any).progreso}%
                </div>
                <div className="text-sm text-gray-600">Progreso General</div>
                <Progress value={(curso as any).progreso} className="w-32 h-3 mt-2" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Module Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Modulos del Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hasModules ? (
                  (curso as any).modulos.map((modulo: any, index: number) => (
                    <button
                      key={modulo.id ?? index}
                      onClick={() => setModuloActivo(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        safeIndex === index
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">Modulo {index + 1}</div>
                        {!isPreview && (
                          <div className="text-xs text-gray-500">
                            {modulo.completed}/{modulo.lessons}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{modulo.title ?? 'Sin titulo'}</div>
                      {!isPreview && (
                        <Progress value={((modulo.completed ?? 0) / (modulo.lessons || 1)) * 100} className="h-1" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    {apiLoaded ? 'Este curso aun no tiene modulos.' : 'Cargando modulos...'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                {hasModules ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        Modulo {safeIndex + 1}: {(curso as any).modulos[safeIndex].title ?? 'Sin titulo'}
                      </CardTitle>
                      <p className="text-gray-600 mt-2">{(curso as any).modulos[safeIndex].description ?? ''}</p>
                    </div>
                    {!isPreview && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Progreso del modulo</div>
                        <div className="text-2xl font-bold" style={{ color: (curso as any).color }}>
                          {Math.round((((curso as any).modulos[safeIndex].completed ?? 0) / ((curso as any).modulos[safeIndex].lessons || 1)) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-2xl">Sin modulos</CardTitle>
                    <p className="text-gray-600 mt-2">{apiLoaded ? 'Este curso aun no tiene modulos asignados.' : 'Cargando...'}</p>
                  </div>
                )}
                {hasModules && (
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mt-4">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{(curso as any).modulos[safeIndex].duration ?? '-'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{(curso as any).modulos[safeIndex].lessons ?? 0} lecciones</span>
                    </span>
                    {!isPreview && (
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{(curso as any).modulos[safeIndex].completed ?? 0} completadas</span>
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {hasModules ? (
                  <div className="space-y-3">
                    {((curso as any).modulos[safeIndex].lecciones ?? []).map((leccion: any, index: number) => (
                      <div
                        key={leccion.id ?? index}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          leccion.completed
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {leccion.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                            {getIconForType(leccion.type || 'video')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              Leccion {leccion.id ?? index + 1}: {leccion.title ?? 'Sin titulo'}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{leccion.duration ?? '-'}</span>
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  (leccion.type || 'video') === "video"
                                    ? "border-blue-200 text-blue-700"
                                    : (leccion.type || 'video') === "ejercicio"
                                      ? "border-green-200 text-green-700"
                                      : "border-purple-200 text-purple-700"
                                }`}
                              >
                                {(leccion.type || 'video') === "video"
                                  ? "Video"
                                  : (leccion.type || 'video') === "ejercicio"
                                    ? "Ejercicio"
                                    : "Examen"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/leccion/${materia}/${(curso as any).modulos[safeIndex].id ?? safeIndex + 1}/${leccion.id ?? index + 1}`}>
                            <Button size="sm" style={{ backgroundColor: (curso as any).color }} className="text-white">
                              Comenzar
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">{apiLoaded ? 'No hay lecciones para mostrar.' : 'Cargando...'}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
