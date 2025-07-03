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
  CheckCircle,
  XCircle,
  BookOpen,
  TrendingUp,
  BarChart3,
  Download,
  Share2,
  Target,
  Award,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

// Datos de ejemplo del resultado del examen
const resultadoExamen = {
  estudiante: "Carlos Rodríguez",
  examen: "Simulacro ICFES Completo",
  fecha: "15 de diciembre, 2024",
  duracion: "2h 45m",
  puntajeTotal: 78,
  puntajePorMateria: {
    "Lectura Crítica": 82,
    Matemáticas: 68,
    "Ciencias Naturales": 75,
    "Ciencias Sociales": 85,
    Inglés: 80,
  },
  totalPreguntas: 100,
  respuestasCorrectas: 78,
  respuestasIncorrectas: 22,
  preguntas: [
    {
      id: 1,
      materia: "Lectura Crítica",
      tema: "Comprensión de textos argumentativos",
      pregunta:
        "En el siguiente fragmento: 'La educación es el arma más poderosa que puedes usar para cambiar el mundo', el autor expresa principalmente:",
      respuestaUsuario: "B",
      respuestaCorrecta: "B",
      esCorrecta: true,
      explicacion:
        "La frase de Mandela utiliza una metáfora para enfatizar el poder transformador de la educación como herramienta de cambio social.",
      materialEstudio: "/leccion/lectura-critica/2/1",
    },
    {
      id: 2,
      materia: "Matemáticas",
      tema: "Álgebra - Funciones",
      pregunta: "Si f(x) = 3x² - 4x + 2, ¿cuál es el valor de f(2)?",
      respuestaUsuario: "C",
      respuestaCorrecta: "A",
      esCorrecta: false,
      explicacion: "Para calcular f(2), sustituimos x por 2: f(2) = 3(4) - 8 + 2 = 6",
      materialEstudio: "/leccion/matematicas/1/1",
    },
    {
      id: 3,
      materia: "Ciencias Naturales",
      tema: "Biología celular",
      pregunta: "¿Cuál es la unidad básica de la vida?",
      respuestaUsuario: "B",
      respuestaCorrecta: "B",
      esCorrecta: true,
      explicacion:
        "La célula es la unidad básica de la vida, ya que es la estructura más pequeña que puede realizar todas las funciones vitales.",
      materialEstudio: "/leccion/ciencias-naturales/1/1",
    },
    {
      id: 4,
      materia: "Ciencias Sociales",
      tema: "Historia de Colombia - Siglo XX",
      pregunta: "¿Cuál de los siguientes acontecimientos fue una consecuencia directa del Bogotazo en 1948?",
      respuestaUsuario: "A",
      respuestaCorrecta: "B",
      esCorrecta: false,
      explicacion:
        "El asesinato de Jorge Eliécer Gaitán intensificó el período conocido como La Violencia entre liberales y conservadores.",
      materialEstudio: "/leccion/ciencias-sociales/1/1",
    },
    {
      id: 5,
      materia: "Inglés",
      tema: "Gramática - Presente simple",
      pregunta: "Choose the correct sentence:",
      respuestaUsuario: "C",
      respuestaCorrecta: "C",
      esCorrecta: true,
      explicacion:
        "La forma correcta de la tercera persona del singular en presente simple negativo es 'doesn't like'.",
      materialEstudio: "/leccion/ingles/2/1",
    },
  ],
}

export default function ResultadoExamenPage() {
  const [activeTab, setActiveTab] = useState("resumen")
  const [filtroMateria, setFiltroMateria] = useState("todas")

  const preguntasFiltradas =
    filtroMateria === "todas"
      ? resultadoExamen.preguntas
      : resultadoExamen.preguntas.filter((p) => p.materia === filtroMateria)

  const preguntasIncorrectas = resultadoExamen.preguntas.filter((p) => !p.esCorrecta)
  const materias = Object.keys(resultadoExamen.puntajePorMateria)

  const getNivelRendimiento = (puntaje: number) => {
    if (puntaje >= 90) return { nivel: "Excelente", color: "text-green-600", bg: "bg-green-100" }
    if (puntaje >= 80) return { nivel: "Bueno", color: "text-blue-600", bg: "bg-blue-100" }
    if (puntaje >= 70) return { nivel: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { nivel: "Necesita Mejora", color: "text-red-600", bg: "bg-red-100" }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="EDUCA Logo" width={40} height={40} />
            <span className="text-xl font-bold text-gray-800">EDUCA COLOMBIA</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge className="bg-[#73A2D3] text-white">Resultados</Badge>
            <Link href="/estudiante">
              <Button variant="outline">Volver al Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resultados del Examen</h1>
              <p className="text-lg opacity-90">{resultadoExamen.examen}</p>
              <div className="flex items-center space-x-6 mt-4 text-sm opacity-90">
                <span>Estudiante: {resultadoExamen.estudiante}</span>
                <span>Fecha: {resultadoExamen.fecha}</span>
                <span>Duración: {resultadoExamen.duracion}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{resultadoExamen.puntajeTotal}%</div>
              <div className="text-lg">Puntaje General</div>
              <Badge
                className={`mt-2 ${getNivelRendimiento(resultadoExamen.puntajeTotal).bg} ${getNivelRendimiento(resultadoExamen.puntajeTotal).color}`}
              >
                {getNivelRendimiento(resultadoExamen.puntajeTotal).nivel}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="por-materia">Por Materia</TabsTrigger>
            <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
            <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{resultadoExamen.respuestasCorrectas}</div>
                  <div className="text-sm text-gray-600">Respuestas Correctas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{resultadoExamen.respuestasIncorrectas}</div>
                  <div className="text-sm text-gray-600">Respuestas Incorrectas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{resultadoExamen.totalPreguntas}</div>
                  <div className="text-sm text-gray-600">Total Preguntas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{resultadoExamen.duracion}</div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance by Subject */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Materia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(resultadoExamen.puntajePorMateria).map(([materia, puntaje]) => {
                    const rendimiento = getNivelRendimiento(puntaje)
                    return (
                      <div key={materia} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{materia}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${rendimiento.bg} ${rendimiento.color}`}>{rendimiento.nivel}</Badge>
                            <span className="font-bold">{puntaje}%</span>
                          </div>
                        </div>
                        <Progress value={puntaje} className="h-3" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-[#73A2D3] hover:bg-[#5a8bc4]">
                <Download className="h-4 w-4 mr-2" />
                Descargar Certificado
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir Resultados
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Análisis Detallado
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="por-materia" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(resultadoExamen.puntajePorMateria).map(([materia, puntaje]) => {
                const rendimiento = getNivelRendimiento(puntaje)
                const preguntasMateria = resultadoExamen.preguntas.filter((p) => p.materia === materia)
                const correctasMateria = preguntasMateria.filter((p) => p.esCorrecta).length

                return (
                  <Card key={materia} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{materia}</CardTitle>
                      <Badge className={`w-fit ${rendimiento.bg} ${rendimiento.color}`}>{rendimiento.nivel}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div
                          className="text-3xl font-bold mb-2"
                          style={{ color: puntaje >= 80 ? "#10B981" : puntaje >= 70 ? "#F59E0B" : "#EF4444" }}
                        >
                          {puntaje}%
                        </div>
                        <Progress value={puntaje} className="h-3" />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Correctas:</span>
                          <span className="font-medium text-green-600">
                            {correctasMateria}/{preguntasMateria.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incorrectas:</span>
                          <span className="font-medium text-red-600">
                            {preguntasMateria.length - correctasMateria}/{preguntasMateria.length}
                          </span>
                        </div>
                      </div>

                      {puntaje < 80 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Área de mejora</span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">Recomendamos repasar los temas de esta materia</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="preguntas" className="space-y-6">
            {/* Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Filtrar por materia:</span>
                  <select
                    value={filtroMateria}
                    onChange={(e) => setFiltroMateria(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="todas">Todas las materias</option>
                    {materias.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                  <Badge variant="outline">{preguntasFiltradas.length} preguntas</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              {preguntasFiltradas.map((pregunta, index) => (
                <Card
                  key={pregunta.id}
                  className={`border-l-4 ${pregunta.esCorrecta ? "border-l-green-500" : "border-l-red-500"}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{pregunta.materia}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {pregunta.tema}
                          </Badge>
                          {pregunta.esCorrecta ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{pregunta.pregunta}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Tu respuesta:</span>
                        <div
                          className={`mt-1 p-2 rounded ${pregunta.esCorrecta ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                        >
                          Opción {pregunta.respuestaUsuario}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Respuesta correcta:</span>
                        <div className="mt-1 p-2 rounded bg-green-50 text-green-800">
                          Opción {pregunta.respuestaCorrecta}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Explicación:</h4>
                      <p className="text-blue-700 text-sm">{pregunta.explicacion}</p>
                    </div>

                    {!pregunta.esCorrecta && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-yellow-800 mb-1">¿Necesitas repasar este tema?</h4>
                            <p className="text-yellow-700 text-sm">Accede al material de estudio relacionado</p>
                          </div>
                          <Link href={pregunta.materialEstudio}>
                            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                              Estudiar Tema
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recomendaciones" className="space-y-6">
            {/* Areas to Improve */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Áreas de Mejora</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preguntasIncorrectas.map((pregunta, index) => (
                    <div
                      key={pregunta.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-red-800">{pregunta.materia}</div>
                        <div className="text-sm text-red-600">{pregunta.tema}</div>
                      </div>
                      <Link href={pregunta.materialEstudio}>
                        <Button size="sm" className="bg-[#73A2D3] hover:bg-[#5a8bc4]">
                          Repasar
                          <BookOpen className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Study Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Plan de Estudio Recomendado</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Prioridad Alta</h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li>• Repasar álgebra y funciones (Matemáticas)</li>
                      <li>• Estudiar historia de Colombia siglo XX (Ciencias Sociales)</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">Prioridad Media</h3>
                    <ul className="space-y-2 text-sm text-yellow-700">
                      <li>• Fortalecer comprensión de textos argumentativos</li>
                      <li>• Practicar más ejercicios de biología celular</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Fortalezas</h3>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Excelente manejo de gramática inglesa</li>
                      <li>• Buen dominio de ciencias sociales en general</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Link href="/cursos">
                    <Button className="w-full bg-[#73A2D3] hover:bg-[#5a8bc4] justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Acceder a Cursos de Refuerzo
                    </Button>
                  </Link>
                  <Link href="/examen">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Realizar Otro Simulacro
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-2" />
                    Programar Tutoría Personalizada
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
