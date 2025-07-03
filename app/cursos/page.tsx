"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  Award,
  BarChart3,
  Clock,
  FileText,
  Calculator,
  Globe,
  Microscope,
  MessageSquare,
  ChevronRight,
  Star,
  Target,
} from "lucide-react"

export default function CursosPage() {
  const cursos = [
    {
      id: "lectura-critica",
      title: "Lectura Crítica",
      icon: BookOpen,
      color: "#73A2D3",
      description:
        "Desarrolla habilidades de comprensión lectora, análisis de textos argumentativos, identificación de ideas principales y figuras literarias.",
      duration: "12 semanas",
      lessons: 48,
      level: "Intermedio a Avanzado",
      topics: [
        "Comprensión de textos",
        "Análisis argumentativo",
        "Figuras literarias",
        "Contexto histórico y cultural",
      ],
      rating: 4.8,
      students: 1250,
    },
    {
      id: "matematicas",
      title: "Matemáticas",
      icon: Calculator,
      color: "#C00102",
      description:
        "Fortalece tus conocimientos en álgebra, geometría, estadística y cálculo con ejercicios prácticos y teoría aplicada.",
      duration: "14 semanas",
      lessons: 56,
      level: "Básico a Avanzado",
      topics: ["Álgebra y funciones", "Geometría analítica", "Estadística y probabilidad", "Cálculo diferencial"],
      rating: 4.9,
      students: 1580,
    },
    {
      id: "ciencias-naturales",
      title: "Ciencias Naturales",
      icon: Microscope,
      color: "#73A2D3",
      description:
        "Explora conceptos de biología, química y física con enfoque en la comprensión de fenómenos naturales y científicos.",
      duration: "16 semanas",
      lessons: 64,
      level: "Intermedio",
      topics: [
        "Biología celular y molecular",
        "Química orgánica e inorgánica",
        "Física mecánica y termodinámica",
        "Ecología y medio ambiente",
      ],
      rating: 4.7,
      students: 980,
    },
    {
      id: "ciencias-sociales",
      title: "Ciencias Sociales",
      icon: Globe,
      color: "#C00102",
      description:
        "Comprende la historia, geografía, constitución política y ciudadanía con enfoque en el contexto colombiano y mundial.",
      duration: "12 semanas",
      lessons: 48,
      level: "Intermedio",
      topics: [
        "Historia de Colombia y mundial",
        "Geografía física y humana",
        "Constitución y democracia",
        "Economía y sociedad",
      ],
      rating: 4.6,
      students: 1120,
    },
    {
      id: "ingles",
      title: "Inglés",
      icon: MessageSquare,
      color: "#73A2D3",
      description:
        "Mejora tu comprensión lectora en inglés, gramática, vocabulario y habilidades de comunicación en el idioma.",
      duration: "10 semanas",
      lessons: 40,
      level: "A2 a B2",
      topics: ["Reading comprehension", "Grammar and vocabulary", "Text analysis", "Communication skills"],
      rating: 4.8,
      students: 890,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="EDUCA Logo" width={40} height={40} />
            <span className="text-xl font-bold text-gray-800">EDUCA COLOMBIA</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-[#C00102]">
              Inicio
            </Link>
            <span className="text-[#C00102] font-medium">Cursos</span>
            <Link href="/acerca" className="text-gray-700 hover:text-[#C00102]">
              Acerca de
            </Link>
            <Link href="/contacto" className="text-gray-700 hover:text-[#C00102]">
              Contacto
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestros Cursos ICFES</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Prepárate para el examen ICFES con nuestros cursos especializados en cada una de las áreas evaluadas.
            Nuestro contenido está diseñado por expertos y actualizado según los últimos estándares del ICFES.
          </p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold">5</div>
              <div className="text-sm opacity-90">Materias</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">250+</div>
              <div className="text-sm opacity-90">Lecciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-sm opacity-90">Estudiantes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {cursos.map((curso) => {
            const IconComponent = curso.icon
            return (
              <Card key={curso.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${curso.color}15` }}
                      >
                        <IconComponent className="h-8 w-8" style={{ color: curso.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-1">{curso.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{curso.duration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{curso.lessons} lecciones</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className="text-white" style={{ backgroundColor: curso.color }}>
                      {curso.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600 leading-relaxed">{curso.description}</p>

                  <div>
                    <h4 className="font-semibold mb-3">Temas principales:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {curso.topics.map((topic, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= Math.floor(curso.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{curso.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{curso.students.toLocaleString()} estudiantes</span>
                      </div>
                    </div>
                    <Link href={`/curso/${curso.id}`}>
                      <Button className="text-white" style={{ backgroundColor: curso.color }}>
                        Ver Currículo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Simulacros Card */}
          <Card className="lg:col-span-2 hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-r from-gray-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#73A2D3] to-[#C00102] rounded-xl flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Simulacros Completos ICFES</CardTitle>
                  <p className="text-gray-600">Practica con exámenes que simulan las condiciones reales del ICFES</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Características:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Exámenes cronometrados</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Retroalimentación inmediata</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Análisis de resultados</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Seguimiento de progreso</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-800">500+</div>
                    <div className="text-sm text-gray-600">Preguntas disponibles</div>
                  </div>
                  <Link href="/examen">
                    <Button size="lg" className="w-full bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white">
                      Comenzar Simulacro
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">¿Por qué elegir nuestros cursos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-[#73A2D3]" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Profesores Expertos</h3>
                <p className="text-gray-600">
                  Nuestro equipo está formado por profesionales con amplia experiencia en preparación ICFES.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-[#C00102]" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Metodología Probada</h3>
                <p className="text-gray-600">
                  Utilizamos técnicas pedagógicas innovadoras que han demostrado mejorar los puntajes ICFES.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Resultados Garantizados</h3>
                <p className="text-gray-600">
                  El 98% de nuestros estudiantes mejoran su puntaje ICFES después de completar nuestros cursos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">¿Listo para comenzar?</h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a miles de estudiantes que han mejorado sus puntajes ICFES con nuestra plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-[#73A2D3] hover:bg-gray-100">
                Inscríbete Ahora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#73A2D3]"
              >
                Ver Demo Gratuita
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
