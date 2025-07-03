"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Clock,
  Users,
  Award,
  CheckCircle,
  PlayCircle,
  FileText,
  Target,
  Brain,
  Calculator,
  Globe,
  Microscope,
  MessageSquare,
  ChevronRight,
  Star,
} from "lucide-react"

// Datos del currículo por materia
const curriculumData = {
  "lectura-critica": {
    title: "Lectura Crítica",
    icon: BookOpen,
    color: "#73A2D3",
    description:
      "Desarrolla habilidades avanzadas de comprensión lectora, análisis textual y pensamiento crítico para el ICFES.",
    duration: "12 semanas",
    lessons: 48,
    level: "Intermedio a Avanzado",
    modules: [
      {
        id: 1,
        title: "Fundamentos de Comprensión Lectora",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Tipos de textos y estructuras",
          "Identificación de ideas principales y secundarias",
          "Técnicas de lectura rápida y comprensiva",
          "Vocabulario contextual y etimología",
        ],
        objectives: [
          "Identificar diferentes tipos de textos",
          "Extraer información explícita e implícita",
          "Desarrollar velocidad lectora manteniendo comprensión",
        ],
      },
      {
        id: 2,
        title: "Análisis de Textos Argumentativos",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Estructura de argumentos: premisas y conclusiones",
          "Tipos de argumentos: deductivos e inductivos",
          "Falacias lógicas más comunes",
          "Evaluación de la validez argumentativa",
        ],
        objectives: [
          "Analizar la estructura argumentativa de textos",
          "Identificar falacias y errores de razonamiento",
          "Evaluar la solidez de argumentos",
        ],
      },
      {
        id: 3,
        title: "Literatura y Contexto Cultural",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Movimientos literarios latinoamericanos",
          "Literatura colombiana: autores y obras representativas",
          "Análisis de figuras retóricas y estilísticas",
          "Contexto histórico y social en la literatura",
        ],
        objectives: [
          "Reconocer características de movimientos literarios",
          "Analizar recursos estilísticos y su función",
          "Relacionar obras con su contexto histórico",
        ],
      },
      {
        id: 4,
        title: "Textos Informativos y Científicos",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Estructura de textos expositivos",
          "Interpretación de gráficos y tablas",
          "Textos de divulgación científica",
          "Análisis de fuentes y credibilidad",
        ],
        objectives: [
          "Interpretar información en diferentes formatos",
          "Evaluar la confiabilidad de fuentes",
          "Sintetizar información de múltiples textos",
        ],
      },
      {
        id: 5,
        title: "Preparación Específica ICFES",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Formato y estructura del examen ICFES",
          "Estrategias de tiempo y manejo de estrés",
          "Simulacros y práctica intensiva",
          "Análisis de errores comunes",
        ],
        objectives: [
          "Dominar el formato del examen",
          "Aplicar estrategias efectivas de respuesta",
          "Optimizar el tiempo de resolución",
        ],
      },
    ],
    skills: [
      "Comprensión lectora avanzada",
      "Análisis crítico de textos",
      "Interpretación de figuras retóricas",
      "Evaluación de argumentos",
      "Síntesis de información",
    ],
    prerequisites: "Nivel básico de lectura comprensiva",
    certification: "Certificado de Preparación ICFES - Lectura Crítica",
  },
  matematicas: {
    title: "Matemáticas",
    icon: Calculator,
    color: "#C00102",
    description:
      "Fortalece conocimientos en álgebra, geometría, estadística y cálculo con enfoque en resolución de problemas del ICFES.",
    duration: "14 semanas",
    lessons: 56,
    level: "Básico a Avanzado",
    modules: [
      {
        id: 1,
        title: "Álgebra y Funciones",
        duration: "4 semanas",
        lessons: 16,
        topics: [
          "Operaciones con polinomios y factorización",
          "Ecuaciones lineales y cuadráticas",
          "Sistemas de ecuaciones",
          "Funciones: dominio, rango y gráficas",
          "Función lineal, cuadrática y exponencial",
        ],
        objectives: [
          "Resolver ecuaciones y sistemas algebraicos",
          "Analizar y graficar funciones",
          "Aplicar álgebra en problemas contextualizados",
        ],
      },
      {
        id: 2,
        title: "Geometría Analítica y Plana",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Coordenadas cartesianas y distancia entre puntos",
          "Ecuaciones de rectas y circunferencias",
          "Áreas y perímetros de figuras planas",
          "Teoremas fundamentales de geometría",
          "Transformaciones geométricas",
        ],
        objectives: [
          "Resolver problemas de geometría analítica",
          "Calcular áreas y volúmenes",
          "Aplicar teoremas geométricos",
        ],
      },
      {
        id: 3,
        title: "Trigonometría",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Razones trigonométricas básicas",
          "Identidades trigonométricas",
          "Resolución de triángulos",
          "Funciones trigonométricas y sus gráficas",
        ],
        objectives: [
          "Aplicar razones trigonométricas",
          "Resolver triángulos usando trigonometría",
          "Interpretar gráficas de funciones trigonométricas",
        ],
      },
      {
        id: 4,
        title: "Estadística y Probabilidad",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Medidas de tendencia central y dispersión",
          "Interpretación de gráficos estadísticos",
          "Probabilidad básica y condicional",
          "Distribuciones de probabilidad",
          "Análisis de datos y correlación",
        ],
        objectives: [
          "Calcular e interpretar estadísticas descriptivas",
          "Resolver problemas de probabilidad",
          "Analizar datos y sacar conclusiones",
        ],
      },
      {
        id: 5,
        title: "Cálculo Diferencial Básico",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Límites y continuidad",
          "Derivadas y reglas de derivación",
          "Aplicaciones de la derivada",
          "Optimización básica",
        ],
        objectives: [
          "Calcular límites y derivadas",
          "Aplicar derivadas en problemas de optimización",
          "Interpretar el significado geométrico de la derivada",
        ],
      },
    ],
    skills: [
      "Resolución de problemas algebraicos",
      "Análisis geométrico",
      "Interpretación estadística",
      "Razonamiento lógico-matemático",
      "Modelación matemática",
    ],
    prerequisites: "Matemáticas básicas de secundaria",
    certification: "Certificado de Preparación ICFES - Matemáticas",
  },
  "ciencias-naturales": {
    title: "Ciencias Naturales",
    icon: Microscope,
    color: "#73A2D3",
    description: "Explora conceptos fundamentales de biología, química y física con enfoque científico y experimental.",
    duration: "16 semanas",
    lessons: 64,
    level: "Intermedio",
    modules: [
      {
        id: 1,
        title: "Biología Celular y Molecular",
        duration: "4 semanas",
        lessons: 16,
        topics: [
          "Estructura y función celular",
          "Biomoléculas: carbohidratos, lípidos, proteínas y ácidos nucleicos",
          "Metabolismo celular: respiración y fotosíntesis",
          "División celular: mitosis y meiosis",
          "Genética molecular y expresión génica",
        ],
        objectives: [
          "Comprender la organización celular",
          "Analizar procesos metabólicos",
          "Explicar mecanismos de herencia",
        ],
      },
      {
        id: 2,
        title: "Química General e Inorgánica",
        duration: "4 semanas",
        lessons: 16,
        topics: [
          "Estructura atómica y tabla periódica",
          "Enlaces químicos: iónicos, covalentes y metálicos",
          "Estequiometría y balanceo de ecuaciones",
          "Estados de la materia y cambios de fase",
          "Soluciones y concentraciones",
        ],
        objectives: [
          "Aplicar conceptos de estructura atómica",
          "Resolver problemas estequiométricos",
          "Predecir propiedades de compuestos",
        ],
      },
      {
        id: 3,
        title: "Química Orgánica",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Hidrocarburos: alcanos, alquenos y alquinos",
          "Grupos funcionales principales",
          "Isomería estructural y estereoisomería",
          "Reacciones orgánicas básicas",
        ],
        objectives: [
          "Identificar compuestos orgánicos",
          "Reconocer grupos funcionales",
          "Predecir productos de reacciones",
        ],
      },
      {
        id: 4,
        title: "Física Mecánica",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Cinemática: movimiento rectilíneo y circular",
          "Dinámica: leyes de Newton",
          "Trabajo, energía y potencia",
          "Momentum y conservación",
          "Gravitación universal",
        ],
        objectives: [
          "Analizar movimientos usando cinemática",
          "Aplicar leyes de Newton",
          "Resolver problemas de energía",
        ],
      },
      {
        id: 5,
        title: "Termodinámica y Ondas",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Temperatura, calor y transferencia térmica",
          "Leyes de la termodinámica",
          "Ondas mecánicas y electromagnéticas",
          "Sonido y luz",
        ],
        objectives: [
          "Comprender procesos termodinámicos",
          "Analizar fenómenos ondulatorios",
          "Explicar propiedades de la luz y sonido",
        ],
      },
      {
        id: 6,
        title: "Ecología y Medio Ambiente",
        duration: "1 semana",
        lessons: 4,
        topics: [
          "Ecosistemas y cadenas alimentarias",
          "Ciclos biogeoquímicos",
          "Biodiversidad y conservación",
          "Impacto ambiental y sostenibilidad",
        ],
        objectives: [
          "Analizar relaciones ecológicas",
          "Evaluar impactos ambientales",
          "Proponer soluciones sostenibles",
        ],
      },
    ],
    skills: [
      "Pensamiento científico",
      "Análisis experimental",
      "Interpretación de datos",
      "Resolución de problemas científicos",
      "Comprensión de fenómenos naturales",
    ],
    prerequisites: "Conocimientos básicos de ciencias naturales",
    certification: "Certificado de Preparación ICFES - Ciencias Naturales",
  },
  "ciencias-sociales": {
    title: "Ciencias Sociales",
    icon: Globe,
    color: "#C00102",
    description:
      "Comprende la historia, geografía, constitución política y ciudadanía con enfoque en Colombia y el mundo.",
    duration: "12 semanas",
    lessons: 48,
    level: "Intermedio",
    modules: [
      {
        id: 1,
        title: "Historia de Colombia",
        duration: "4 semanas",
        lessons: 16,
        topics: [
          "Período precolombino: culturas indígenas",
          "Conquista y colonización española",
          "Independencia y formación de la República",
          "Siglo XX: violencia, Frente Nacional y conflicto armado",
          "Colombia contemporánea: constitución de 1991",
        ],
        objectives: [
          "Analizar procesos históricos colombianos",
          "Comprender causas y consecuencias de eventos",
          "Relacionar pasado con presente",
        ],
      },
      {
        id: 2,
        title: "Historia Universal",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Grandes civilizaciones antiguas",
          "Edad Media y Renacimiento",
          "Revoluciones: Industrial, Francesa y Americana",
          "Guerras mundiales y Guerra Fría",
          "Globalización y mundo contemporáneo",
        ],
        objectives: [
          "Contextualizar la historia colombiana",
          "Comprender procesos históricos globales",
          "Analizar influencias internacionales",
        ],
      },
      {
        id: 3,
        title: "Geografía de Colombia",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Regiones naturales y relieve",
          "Hidrografía y clima",
          "Recursos naturales y economía regional",
          "Demografía y urbanización",
          "Problemáticas ambientales",
        ],
        objectives: [
          "Identificar características geográficas",
          "Relacionar geografía con economía",
          "Analizar problemas territoriales",
        ],
      },
      {
        id: 4,
        title: "Constitución y Democracia",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Constitución Política de 1991",
          "Derechos fundamentales y deberes",
          "Organización del Estado colombiano",
          "Participación ciudadana y democracia",
          "Mecanismos de protección de derechos",
        ],
        objectives: [
          "Conocer la estructura constitucional",
          "Comprender derechos y deberes",
          "Promover participación ciudadana",
        ],
      },
      {
        id: 5,
        title: "Economía y Sociedad",
        duration: "1 semana",
        lessons: 4,
        topics: [
          "Sistemas económicos",
          "Indicadores económicos básicos",
          "Desigualdad y pobreza",
          "Desarrollo sostenible",
        ],
        objectives: [
          "Comprender conceptos económicos básicos",
          "Analizar problemas socioeconómicos",
          "Evaluar políticas públicas",
        ],
      },
    ],
    skills: [
      "Pensamiento crítico social",
      "Análisis histórico",
      "Interpretación geográfica",
      "Comprensión constitucional",
      "Ciudadanía activa",
    ],
    prerequisites: "Conocimientos básicos de historia y geografía",
    certification: "Certificado de Preparación ICFES - Ciencias Sociales",
  },
  ingles: {
    title: "Inglés",
    icon: MessageSquare,
    color: "#73A2D3",
    description: "Desarrolla habilidades de comprensión lectora, gramática y vocabulario en inglés para el ICFES.",
    duration: "10 semanas",
    lessons: 40,
    level: "A2 a B2",
    modules: [
      {
        id: 1,
        title: "Reading Comprehension Strategies",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Skimming and scanning techniques",
          "Identifying main ideas and supporting details",
          "Understanding text structure and organization",
          "Inferring meaning from context",
          "Recognizing author's purpose and tone",
        ],
        objectives: [
          "Apply effective reading strategies",
          "Comprehend various text types",
          "Make inferences and draw conclusions",
        ],
      },
      {
        id: 2,
        title: "Grammar and Language Use",
        duration: "3 semanas",
        lessons: 12,
        topics: [
          "Verb tenses: present, past, future and perfect forms",
          "Conditional sentences and subjunctive mood",
          "Passive voice and reported speech",
          "Modal verbs and their functions",
          "Sentence structure and word order",
        ],
        objectives: [
          "Master essential grammar structures",
          "Use appropriate verb forms",
          "Construct complex sentences correctly",
        ],
      },
      {
        id: 3,
        title: "Vocabulary Development",
        duration: "2 semanas",
        lessons: 8,
        topics: [
          "Academic vocabulary and collocations",
          "Prefixes, suffixes and word formation",
          "Synonyms, antonyms and word relationships",
          "Idiomatic expressions and phrasal verbs",
          "Context clues for vocabulary acquisition",
        ],
        objectives: [
          "Expand academic vocabulary",
          "Understand word formation patterns",
          "Use context to determine meaning",
        ],
      },
      {
        id: 4,
        title: "Text Types and Genres",
        duration: "1 semana",
        lessons: 4,
        topics: [
          "Narrative texts and storytelling",
          "Descriptive and expository writing",
          "Argumentative and persuasive texts",
          "Scientific and technical writing",
        ],
        objectives: [
          "Recognize different text types",
          "Understand genre characteristics",
          "Adapt reading strategies to text type",
        ],
      },
      {
        id: 5,
        title: "ICFES Test Preparation",
        duration: "1 semana",
        lessons: 4,
        topics: [
          "ICFES English test format and structure",
          "Time management strategies",
          "Common question types and patterns",
          "Practice tests and error analysis",
        ],
        objectives: ["Familiarize with test format", "Develop test-taking strategies", "Improve accuracy and speed"],
      },
    ],
    skills: [
      "Reading comprehension",
      "Grammar accuracy",
      "Vocabulary knowledge",
      "Text analysis",
      "Test-taking strategies",
    ],
    prerequisites: "Nivel básico de inglés (A1-A2)",
    certification: "Certificado de Preparación ICFES - Inglés",
  },
}

interface CurriculumPageProps {
  params: {
    materia: string
  }
}

export default function CurriculumPage({ params }: CurriculumPageProps) {
  const [activeModule, setActiveModule] = useState(0)
  const curriculum = curriculumData[params.materia as keyof typeof curriculumData]

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Materia no encontrada</h1>
          <Link href="/cursos">
            <Button className="bg-[#73A2D3]">Volver a Cursos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const IconComponent = curriculum.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
            <span className="text-xl font-bold text-gray-800">EDUCASABER COLOMBIA</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-[#C00102]">
              Inicio
            </Link>
            <Link href="/cursos" className="text-gray-700 hover:text-[#C00102]">
              Cursos
            </Link>
            <Badge style={{ backgroundColor: curriculum.color }} className="text-white">
              {curriculum.title}
            </Badge>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: curriculum.color }}
            >
              <IconComponent className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{curriculum.title}</h1>
              <p className="text-xl text-gray-300">{curriculum.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Clock className="h-6 w-6 mb-2" />
              <div className="font-semibold">Duración</div>
              <div className="text-gray-300">{curriculum.duration}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <BookOpen className="h-6 w-6 mb-2" />
              <div className="font-semibold">Lecciones</div>
              <div className="text-gray-300">{curriculum.lessons} lecciones</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Target className="h-6 w-6 mb-2" />
              <div className="font-semibold">Nivel</div>
              <div className="text-gray-300">{curriculum.level}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Award className="h-6 w-6 mb-2" />
              <div className="font-semibold">Certificación</div>
              <div className="text-gray-300">Incluida</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="curriculum" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="curriculum">Currículo</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Descripción del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{curriculum.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Lo que aprenderás:</h3>
                    <ul className="space-y-2">
                      {curriculum.skills.map((skill, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Requisitos:</h3>
                    <p className="text-gray-600 mb-4">{curriculum.prerequisites}</p>
                    <h3 className="font-semibold text-lg mb-3">Certificación:</h3>
                    <p className="text-gray-600">{curriculum.certification}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Estructura del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {curriculum.modules.map((module, index) => (
                    <div key={module.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">
                          Módulo {module.id}: {module.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{module.duration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{module.lessons} lecciones</span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Temas:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {module.topics.map((topic, topicIndex) => (
                              <li key={topicIndex} className="flex items-start space-x-2">
                                <span className="text-gray-400">•</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Objetivos:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {module.objectives.map((objective, objIndex) => (
                              <li key={objIndex} className="flex items-start space-x-2">
                                <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Module Navigation */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos del Curso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {curriculum.modules.map((module, index) => (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeModule === index
                            ? "bg-blue-50 border-2 border-blue-200"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-sm">Módulo {module.id}</div>
                        <div className="text-xs text-gray-600">{module.title}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Module Detail */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Módulo {curriculum.modules[activeModule].id}: {curriculum.modules[activeModule].title}
                    </CardTitle>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{curriculum.modules[activeModule].duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{curriculum.modules[activeModule].lessons} lecciones</span>
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Contenido del Módulo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Temas a cubrir:</h4>
                          <ul className="space-y-2">
                            {curriculum.modules[activeModule].topics.map((topic, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Objetivos de aprendizaje:</h4>
                          <ul className="space-y-2">
                            {curriculum.modules[activeModule].objectives.map((objective, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Sample Lessons */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Lecciones de ejemplo</h3>
                      <div className="space-y-3">
                        {[1, 2, 3].map((lesson) => (
                          <div key={lesson} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <PlayCircle className="h-5 w-5 text-blue-500" />
                              <div>
                                <div className="font-medium">
                                  Lección {lesson}: {curriculum.modules[activeModule].topics[lesson - 1]}
                                </div>
                                <div className="text-sm text-gray-600">15 minutos • Video + Ejercicios</div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Vista previa
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Habilidades que Desarrollarás</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {curriculum.skills.map((skill, index) => (
                    <div key={index} className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: `${curriculum.color}20` }}
                      >
                        <Brain className="h-8 w-8" style={{ color: curriculum.color }} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{skill}</h3>
                      <div className="flex justify-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">Habilidad esencial para el éxito en el ICFES</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Seguimiento de Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Tu progreso será evaluado mediante:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-blue-500" />
                          <div>
                            <div className="font-medium">Evaluaciones continuas</div>
                            <div className="text-sm text-gray-600">Quizzes al final de cada lección</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Target className="h-6 w-6 text-green-500" />
                          <div>
                            <div className="font-medium">Exámenes parciales</div>
                            <div className="text-sm text-gray-600">Evaluación por módulo completado</div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Award className="h-6 w-6 text-yellow-500" />
                          <div>
                            <div className="font-medium">Simulacros ICFES</div>
                            <div className="text-sm text-gray-600">Práctica con formato real del examen</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Users className="h-6 w-6 text-purple-500" />
                          <div>
                            <div className="font-medium">Retroalimentación personalizada</div>
                            <div className="text-sm text-gray-600">Análisis detallado de fortalezas y debilidades</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-4">Ejemplo de progreso del estudiante:</h3>
                    <div className="space-y-3">
                      {curriculum.modules.map((module, index) => (
                        <div key={module.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              Módulo {module.id}: {module.title}
                            </span>
                            <span className="text-sm text-gray-600">{Math.floor(Math.random() * 40) + 60}%</span>
                          </div>
                          <Progress value={Math.floor(Math.random() * 40) + 60} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Información del Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-gray-700">Duración total</div>
                      <div className="text-lg">{curriculum.duration}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Número de lecciones</div>
                      <div className="text-lg">{curriculum.lessons}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Nivel requerido</div>
                      <div className="text-lg">{curriculum.level}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Modalidad</div>
                      <div className="text-lg">Online</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="font-medium text-gray-700 mb-2">Requisitos previos</div>
                    <p className="text-gray-600">{curriculum.prerequisites}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="font-medium text-gray-700 mb-2">Certificación</div>
                    <p className="text-gray-600">{curriculum.certification}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Instructor & Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Instructor y Soporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Foto</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Profesor Especialista</div>
                      <div className="text-gray-600">Experto en {curriculum.title}</div>
                      <div className="text-sm text-gray-500">10+ años de experiencia</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Soporte incluido:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Foros de discusión</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Sesiones de tutoría grupal</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Material descargable</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Acceso de por vida</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">¿Listo para comenzar tu preparación?</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Únete a miles de estudiantes que han mejorado sus puntajes ICFES con nuestros cursos especializados.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="text-white" style={{ backgroundColor: curriculum.color }}>
                    Inscribirme Ahora
                  </Button>
                  <Button size="lg" variant="outline">
                    Ver Demo Gratuita
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
