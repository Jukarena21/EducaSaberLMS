"use client"

import { useState } from "react"
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

// Datos de los módulos por materia
const modulosData = {
  "lectura-critica": {
    title: "Lectura Crítica",
    color: "#73A2D3",
    description: "Desarrolla habilidades avanzadas de comprensión lectora y pensamiento crítico",
    progreso: 85,
    modulos: [
      {
        id: 1,
        title: "Fundamentos de Comprensión Lectora",
        description: "Aprende los conceptos básicos de comprensión de textos",
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
            title: "Identificación de ideas principales",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Técnicas de lectura rápida",
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
            title: "Práctica de comprensión lectora",
            duration: "60 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Análisis de textos narrativos",
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
            title: "Evaluación del módulo",
            duration: "30 min",
            completed: true,
            type: "examen",
          },
        ],
      },
      {
        id: 2,
        title: "Análisis de Textos Argumentativos",
        description: "Domina el análisis de argumentos y estructuras argumentativas",
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
            title: "Falacias lógicas comunes",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Evaluación de argumentos",
            duration: "45 min",
            completed: true,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Práctica de análisis argumentativo",
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
            title: "Análisis crítico de editoriales",
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
            title: "Práctica avanzada",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 11,
            title: "Simulacro de argumentación",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Evaluación del módulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
      {
        id: 3,
        title: "Literatura y Contexto Cultural",
        description: "Explora la literatura colombiana y latinoamericana",
        duration: "3 semanas",
        lessons: 12,
        completed: 0,
        lecciones: [
          {
            id: 1,
            title: "Movimientos literarios latinoamericanos",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 2,
            title: "Literatura colombiana: autores principales",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 3,
            title: "Gabriel García Márquez y el realismo mágico",
            duration: "55 min",
            completed: false,
            type: "video",
          },
          {
            id: 4,
            title: "Figuras retóricas y estilísticas",
            duration: "40 min",
            completed: false,
            type: "video",
          },
          {
            id: 5,
            title: "Análisis de 'Cien años de soledad'",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Contexto histórico en la literatura",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 7,
            title: "Poesía colombiana contemporánea",
            duration: "40 min",
            completed: false,
            type: "video",
          },
          {
            id: 8,
            title: "Teatro y narrativa moderna",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 9,
            title: "Análisis comparativo de obras",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 10,
            title: "Literatura y sociedad",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 11,
            title: "Práctica de análisis literario",
            duration: "55 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Evaluación del módulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  matematicas: {
    title: "Matemáticas",
    color: "#C00102",
    description: "Fortalece conocimientos en álgebra, geometría, estadística y cálculo",
    progreso: 68,
    modulos: [
      {
        id: 1,
        title: "Álgebra y Funciones",
        description: "Domina las operaciones algebraicas y el análisis de funciones",
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
            title: "Factorización",
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
            title: "Ecuaciones cuadráticas",
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
            title: "Función lineal",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 8,
            title: "Función cuadrática",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Función exponencial",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 10,
            title: "Gráficas de funciones",
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
            title: "Práctica de álgebra",
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
            title: "Simulacro de álgebra",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluación del módulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
      {
        id: 2,
        title: "Geometría Analítica y Plana",
        description: "Aprende geometría en el plano cartesiano",
        duration: "3 semanas",
        lessons: 12,
        completed: 3,
        lecciones: [
          {
            id: 1,
            title: "Coordenadas cartesianas",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Distancia entre puntos",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Ecuaciones de rectas",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Ecuaciones de circunferencias",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 5,
            title: "Áreas de figuras planas",
            duration: "55 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 6,
            title: "Perímetros y áreas",
            duration: "40 min",
            completed: false,
            type: "video",
          },
          {
            id: 7,
            title: "Teoremas de geometría",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 8,
            title: "Transformaciones geométricas",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 9,
            title: "Práctica de geometría",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 10,
            title: "Problemas de aplicación",
            duration: "50 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 11,
            title: "Simulacro de geometría",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 12,
            title: "Evaluación del módulo",
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
    description: "Explora conceptos fundamentales de biología, química y física",
    progreso: 72,
    modulos: [
      {
        id: 1,
        title: "Biología Celular y Molecular",
        description: "Comprende la estructura y función de las células",
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
            title: "Función celular",
            duration: "40 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Biomoléculas: carbohidratos",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Biomoléculas: lípidos",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 5,
            title: "Biomoléculas: proteínas",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 6,
            title: "Ácidos nucleicos",
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
            title: "Respiración celular",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 9,
            title: "Fotosíntesis",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 10,
            title: "División celular: mitosis",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 11,
            title: "División celular: meiosis",
            duration: "50 min",
            completed: false,
            type: "video",
          },
          {
            id: 12,
            title: "Genética molecular",
            duration: "55 min",
            completed: false,
            type: "video",
          },
          {
            id: 13,
            title: "Expresión génica",
            duration: "45 min",
            completed: false,
            type: "video",
          },
          {
            id: 14,
            title: "Práctica de biología celular",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 15,
            title: "Simulacro de biología",
            duration: "40 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluación del módulo",
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
    description: "Comprende la historia, geografía y constitución política",
    progreso: 78,
    modulos: [
      {
        id: 1,
        title: "Historia de Colombia",
        description: "Explora los eventos más importantes de la historia colombiana",
        duration: "4 semanas",
        lessons: 16,
        completed: 14,
        lecciones: [
          {
            id: 1,
            title: "Período precolombino",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 2,
            title: "Culturas indígenas",
            duration: "45 min",
            completed: true,
            type: "video",
          },
          {
            id: 3,
            title: "Conquista española",
            duration: "55 min",
            completed: true,
            type: "video",
          },
          {
            id: 4,
            title: "Colonización",
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
            title: "Formación de la República",
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
            title: "Regeneración",
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
            title: "Constitución de 1991",
            duration: "50 min",
            completed: true,
            type: "video",
          },
          {
            id: 13,
            title: "Colombia contemporánea",
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
            title: "Práctica de historia",
            duration: "60 min",
            completed: false,
            type: "ejercicio",
          },
          {
            id: 16,
            title: "Evaluación del módulo",
            duration: "30 min",
            completed: false,
            type: "examen",
          },
        ],
      },
    ],
  },
  ingles: {
    title: "Inglés",
    color: "#73A2D3",
    description: "Desarrolla habilidades de comprensión lectora y gramática en inglés",
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
  params: {
    materia: string
  }
}

export default function ModulosPage({ params }: ModulosPageProps) {
  const [moduloActivo, setModuloActivo] = useState(0)
  const curso = modulosData[params.materia as keyof typeof modulosData]

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
              <span className="text-[#73A2D3]">{curso.title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge style={{ backgroundColor: curso.color }} className="text-white">
              {curso.title}
            </Badge>
            <Link href="/estudiante">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{curso.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{curso.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>1,234 estudiantes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.8/5</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{curso.modulos.length} módulos</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: curso.color }}>
                {curso.progreso}%
              </div>
              <div className="text-sm text-gray-600">Progreso General</div>
              <Progress value={curso.progreso} className="w-32 h-3 mt-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Module Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Módulos del Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {curso.modulos.map((modulo, index) => (
                  <button
                    key={modulo.id}
                    onClick={() => setModuloActivo(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      moduloActivo === index
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Módulo {modulo.id}</div>
                      <div className="text-xs text-gray-500">
                        {modulo.completed}/{modulo.lessons}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{modulo.title}</div>
                    <Progress value={(modulo.completed / modulo.lessons) * 100} className="h-1" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Módulo {curso.modulos[moduloActivo].id}: {curso.modulos[moduloActivo].title}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{curso.modulos[moduloActivo].description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progreso del módulo</div>
                    <div className="text-2xl font-bold" style={{ color: curso.color }}>
                      {Math.round((curso.modulos[moduloActivo].completed / curso.modulos[moduloActivo].lessons) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-600 mt-4">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{curso.modulos[moduloActivo].duration}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{curso.modulos[moduloActivo].lessons} lecciones</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{curso.modulos[moduloActivo].completed} completadas</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {curso.modulos[moduloActivo].lecciones.map((leccion, index) => (
                    <div
                      key={leccion.id}
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
                          {getIconForType(leccion.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            Lección {leccion.id}: {leccion.title}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{leccion.duration}</span>
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                leccion.type === "video"
                                  ? "border-blue-200 text-blue-700"
                                  : leccion.type === "ejercicio"
                                    ? "border-green-200 text-green-700"
                                    : "border-purple-200 text-purple-700"
                              }`}
                            >
                              {leccion.type === "video"
                                ? "Video"
                                : leccion.type === "ejercicio"
                                  ? "Ejercicio"
                                  : "Examen"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {leccion.completed ? (
                          <Link href={`/leccion/${params.materia}/${curso.modulos[moduloActivo].id}/${leccion.id}`}>
                            <Button size="sm" variant="outline">
                              Revisar
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/leccion/${params.materia}/${curso.modulos[moduloActivo].id}/${leccion.id}`}>
                            <Button size="sm" style={{ backgroundColor: curso.color }} className="text-white">
                              {index === 0 || curso.modulos[moduloActivo].lecciones[index - 1].completed
                                ? "Comenzar"
                                : "Bloqueado"}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
