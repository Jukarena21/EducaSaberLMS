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
  CheckCircle,
  PlayCircle,
  Target,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Users,
} from "lucide-react"

// Datos de ejemplo para las lecciones
const leccionData = {
  "lectura-critica": {
    "1": {
      "1": {
        title: "Tipos de textos y estructuras",
        description:
          "Aprende a identificar y analizar diferentes tipos de textos según su estructura y propósito comunicativo.",
        duration: "45 minutos",
        videoId: "dQw4w9WgXcQ", // Video de ejemplo de YouTube
        content: {
          teoria: `
# Tipos de Textos y Estructuras

## Introducción

Los textos se clasifican según diferentes criterios: su función comunicativa, su estructura, su ámbito de uso, entre otros. En esta lección aprenderemos a identificar los principales tipos de textos que aparecen en el examen ICFES.

## Clasificación por función comunicativa

### 1. Textos Narrativos
- **Propósito**: Contar una historia o secuencia de eventos
- **Características**: Presencia de narrador, personajes, tiempo, espacio
- **Ejemplos**: Cuentos, novelas, crónicas, biografías

### 2. Textos Descriptivos
- **Propósito**: Representar las características de personas, objetos, lugares o fenómenos
- **Características**: Uso de adjetivos, comparaciones, enumeraciones
- **Ejemplos**: Retratos, paisajes, descripciones científicas

### 3. Textos Expositivos
- **Propósito**: Explicar o informar sobre un tema
- **Características**: Claridad, objetividad, uso de ejemplos
- **Ejemplos**: Artículos enciclopédicos, manuales, informes

### 4. Textos Argumentativos
- **Propósito**: Convencer o persuadir al receptor
- **Características**: Tesis, argumentos, contraargumentos, conclusión
- **Ejemplos**: Ensayos, editoriales, debates

## Estructuras textuales

### Estructura cronológica
Los eventos se presentan en orden temporal (antes-después).

### Estructura causa-efecto
Se establece una relación de causalidad entre los elementos.

### Estructura problema-solución
Se plantea un problema y se proponen soluciones.

### Estructura comparativa
Se establecen semejanzas y diferencias entre elementos.
          `,
          ejercicios: [
            {
              id: 1,
              tipo: "seleccion_multiple",
              pregunta: "¿Cuál es la función principal de un texto argumentativo?",
              opciones: [
                "Narrar una secuencia de eventos",
                "Describir características de objetos",
                "Convencer o persuadir al receptor",
                "Explicar un fenómeno científico",
              ],
              respuesta_correcta: 2,
              explicacion:
                "Los textos argumentativos tienen como función principal convencer o persuadir al receptor mediante el uso de argumentos sólidos.",
            },
            {
              id: 2,
              tipo: "seleccion_multiple",
              pregunta: "En un texto con estructura causa-efecto, ¿qué elemento es fundamental?",
              opciones: [
                "La secuencia temporal",
                "La relación de causalidad",
                "La descripción detallada",
                "El diálogo entre personajes",
              ],
              respuesta_correcta: 1,
              explicacion:
                "En la estructura causa-efecto, lo fundamental es establecer claramente la relación de causalidad entre los elementos presentados.",
            },
          ],
        },
        modulo: "Fundamentos de Comprensión Lectora",
        materia: "Lectura Crítica",
      },
    },
  },
  matematicas: {
    "1": {
      "1": {
        title: "Operaciones con polinomios",
        description: "Domina las operaciones básicas con polinomios: suma, resta, multiplicación y división.",
        duration: "50 minutos",
        videoId: "3D8VoA_RvVU", // Video de ejemplo de YouTube
        content: {
          teoria: `
# Operaciones con Polinomios

## ¿Qué es un polinomio?

Un polinomio es una expresión algebraica formada por la suma de varios términos, donde cada término es el producto de un coeficiente numérico y una o más variables elevadas a potencias enteras no negativas.

**Ejemplo**: 3x² + 2x - 5

## Suma de polinomios

Para sumar polinomios, se suman los coeficientes de los términos semejantes.

**Ejemplo**:
(3x² + 2x - 1) + (x² - 4x + 3) = 4x² - 2x + 2

## Resta de polinomios

Para restar polinomios, se cambia el signo de todos los términos del sustraendo y luego se suman.

**Ejemplo**:
(3x² + 2x - 1) - (x² - 4x + 3) = 3x² + 2x - 1 - x² + 4x - 3 = 2x² + 6x - 4

## Multiplicación de polinomios

Se multiplica cada término del primer polinomio por cada término del segundo polinomio.

**Ejemplo**:
(x + 2)(x - 3) = x² - 3x + 2x - 6 = x² - x - 6
          `,
          ejercicios: [
            {
              id: 1,
              tipo: "seleccion_multiple",
              pregunta: "¿Cuál es el resultado de (2x² + 3x - 1) + (x² - 2x + 4)?",
              opciones: ["3x² + x + 3", "3x² + 5x + 3", "x² + x + 3", "3x² + x - 5"],
              respuesta_correcta: 0,
              explicacion: "Sumamos términos semejantes: (2x² + x²) + (3x - 2x) + (-1 + 4) = 3x² + x + 3",
            },
            {
              id: 2,
              tipo: "seleccion_multiple",
              pregunta: "¿Cuál es el resultado de (x + 3)(x - 2)?",
              opciones: ["x² + x - 6", "x² - x - 6", "x² + 5x - 6", "x² - 5x + 6"],
              respuesta_correcta: 0,
              explicacion: "Aplicamos la propiedad distributiva: x² - 2x + 3x - 6 = x² + x - 6",
            },
          ],
        },
        modulo: "Álgebra y Funciones",
        materia: "Matemáticas",
      },
    },
  },
}

interface LeccionPageProps {
  params: {
    materia: string
    modulo: string
    leccion: string
  }
}

export default function LeccionPage({ params }: LeccionPageProps) {
  const [activeTab, setActiveTab] = useState("video")
  const [ejercicioActual, setEjercicioActual] = useState(0)
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<number, number>>({})
  const [mostrarResultados, setMostrarResultados] = useState(false)

  const leccion = leccionData[params.materia as keyof typeof leccionData]?.[params.modulo]?.[params.leccion]

  if (!leccion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Lección no encontrada</h1>
          <Link href="/examen/resultado">
            <Button className="bg-[#73A2D3]">Volver a Resultados</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleRespuesta = (ejercicioId: number, respuesta: number) => {
    setRespuestasUsuario((prev) => ({
      ...prev,
      [ejercicioId]: respuesta,
    }))
  }

  const verificarRespuestas = () => {
    setMostrarResultados(true)
  }

  const ejercicioActualData = leccion.content.ejercicios[ejercicioActual]

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
              <Link href={`/curso/${params.materia}/modulos`} className="hover:text-[#73A2D3]">
                {leccion.materia}
              </Link>
              <span>/</span>
              <span className="text-[#73A2D3]">{leccion.title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-[#73A2D3] text-white">Módulo {params.modulo}</Badge>
            <Badge variant="outline">Lección {params.leccion}</Badge>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{leccion.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{leccion.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{leccion.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{leccion.modulo}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>{leccion.materia}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar Material
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="teoria">Teoría</TabsTrigger>
                <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-6">
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${leccion.videoId}`}
                        title={leccion.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Descripción del Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{leccion.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <PlayCircle className="h-4 w-4" />
                        <span>Duración: {leccion.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>1,234 estudiantes han visto este video</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teoria" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido Teórico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <style jsx global>{`
                      .teoria-content h1 {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #1a202c;
                        margin-bottom: 1.5rem;
                        padding-bottom: 0.75rem;
                        border-bottom: 2px solid #73a2d3;
                      }

                      .teoria-content h2 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #2d3748;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        padding-bottom: 0.5rem;
                        border-bottom: 1px solid #e2e8f0;
                      }

                      .teoria-content h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #c00102;
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                      }

                      .teoria-content p {
                        font-size: 1rem;
                        line-height: 1.7;
                        color: #4a5568;
                        margin-bottom: 1rem;
                      }

                      .teoria-content ul {
                        margin-left: 1.5rem;
                        margin-bottom: 1.5rem;
                        list-style-type: disc;
                      }

                      .teoria-content li {
                        margin-bottom: 0.5rem;
                        line-height: 1.6;
                      }

                      .teoria-content .concepto {
                        background-color: #f0f9ff;
                        border-left: 4px solid #73a2d3;
                        padding: 1rem;
                        margin: 1.5rem 0;
                        border-radius: 0.375rem;
                      }

                      .teoria-content .ejemplo {
                        background-color: #f0fdf4;
                        border-left: 4px solid #10b981;
                        padding: 1rem;
                        margin: 1.5rem 0;
                        border-radius: 0.375rem;
                      }

                      .teoria-content .importante {
                        background-color: #fff1f2;
                        border-left: 4px solid #c00102;
                        padding: 1rem;
                        margin: 1.5rem 0;
                        border-radius: 0.375rem;
                        font-weight: 500;
                      }

                      .teoria-content .caracteristica {
                        display: flex;
                        margin-bottom: 0.5rem;
                      }

                      .teoria-content .caracteristica-titulo {
                        font-weight: 600;
                        color: #1a202c;
                        min-width: 120px;
                      }

                      .teoria-content .tipo-texto {
                        margin-bottom: 2rem;
                        padding: 1.5rem;
                        background-color: #f8fafc;
                        border-radius: 0.5rem;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                      }

                      .teoria-content .estructura {
                        margin-bottom: 1rem;
                        padding: 1rem;
                        background-color: #f8fafc;
                        border-radius: 0.5rem;
                        border-left: 3px solid #73a2d3;
                      }
                    `}</style>

                    <div className="teoria-content">
                      {leccion.content.teoria.startsWith("# ") ? (
                        <>
                          <h1>{leccion.content.teoria.split("\n")[0].replace("# ", "")}</h1>

                          <div className="concepto">
                            <p>{leccion.content.teoria.split("\n\n")[1]}</p>
                          </div>

                          {leccion.content.teoria.includes("## Clasificación por función comunicativa") && (
                            <>
                              <h2>Clasificación por función comunicativa</h2>

                              <div className="tipo-texto">
                                <h3>1. Textos Narrativos</h3>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Propósito:</span>
                                  <span>Contar una historia o secuencia de eventos</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Características:</span>
                                  <span>Presencia de narrador, personajes, tiempo, espacio</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Ejemplos:</span>
                                  <span>Cuentos, novelas, crónicas, biografías</span>
                                </div>
                              </div>

                              <div className="tipo-texto">
                                <h3>2. Textos Descriptivos</h3>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Propósito:</span>
                                  <span>Representar las características de personas, objetos, lugares o fenómenos</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Características:</span>
                                  <span>Uso de adjetivos, comparaciones, enumeraciones</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Ejemplos:</span>
                                  <span>Retratos, paisajes, descripciones científicas</span>
                                </div>
                              </div>

                              <div className="tipo-texto">
                                <h3>3. Textos Expositivos</h3>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Propósito:</span>
                                  <span>Explicar o informar sobre un tema</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Características:</span>
                                  <span>Claridad, objetividad, uso de ejemplos</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Ejemplos:</span>
                                  <span>Artículos enciclopédicos, manuales, informes</span>
                                </div>
                              </div>

                              <div className="tipo-texto">
                                <h3>4. Textos Argumentativos</h3>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Propósito:</span>
                                  <span>Convencer o persuadir al receptor</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Características:</span>
                                  <span>Tesis, argumentos, contraargumentos, conclusión</span>
                                </div>
                                <div className="caracteristica">
                                  <span className="caracteristica-titulo">Ejemplos:</span>
                                  <span>Ensayos, editoriales, debates</span>
                                </div>
                              </div>
                            </>
                          )}

                          {leccion.content.teoria.includes("## Estructuras textuales") && (
                            <>
                              <h2>Estructuras textuales</h2>

                              <div className="estructura">
                                <h3>Estructura cronológica</h3>
                                <p>Los eventos se presentan en orden temporal (antes-después).</p>
                              </div>

                              <div className="estructura">
                                <h3>Estructura causa-efecto</h3>
                                <p>Se establece una relación de causalidad entre los elementos.</p>
                              </div>

                              <div className="estructura">
                                <h3>Estructura problema-solución</h3>
                                <p>Se plantea un problema y se proponen soluciones.</p>
                              </div>

                              <div className="estructura">
                                <h3>Estructura comparativa</h3>
                                <p>Se establecen semejanzas y diferencias entre elementos.</p>
                              </div>
                            </>
                          )}

                          {leccion.content.teoria.includes("## ¿Qué es un polinomio?") && (
                            <>
                              <h2>¿Qué es un polinomio?</h2>
                              <div className="concepto">
                                <p>
                                  Un polinomio es una expresión algebraica formada por la suma de varios términos, donde
                                  cada término es el producto de un coeficiente numérico y una o más variables elevadas
                                  a potencias enteras no negativas.
                                </p>
                                <p className="importante">Ejemplo: 3x² + 2x - 5</p>
                              </div>

                              <h2>Suma de polinomios</h2>
                              <p>Para sumar polinomios, se suman los coeficientes de los términos semejantes.</p>
                              <div className="ejemplo">
                                <p>
                                  <strong>Ejemplo</strong>: (3x² + 2x - 1) + (x² - 4x + 3) = 4x² - 2x + 2
                                </p>
                              </div>

                              <h2>Resta de polinomios</h2>
                              <p>
                                Para restar polinomios, se cambia el signo de todos los términos del sustraendo y luego
                                se suman.
                              </p>
                              <div className="ejemplo">
                                <p>
                                  <strong>Ejemplo</strong>: (3x² + 2x - 1) - (x² - 4x + 3) = 3x² + 2x - 1 - x² + 4x - 3
                                  = 2x² + 6x - 4
                                </p>
                              </div>

                              <h2>Multiplicación de polinomios</h2>
                              <p>
                                Se multiplica cada término del primer polinomio por cada término del segundo polinomio.
                              </p>
                              <div className="ejemplo">
                                <p>
                                  <strong>Ejemplo</strong>: (x + 2)(x - 3) = x² - 3x + 2x - 6 = x² - x - 6
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: leccion.content.teoria
                              .replace(/# (.*)/g, "<h1>$1</h1>")
                              .replace(/## (.*)/g, "<h2>$1</h2>")
                              .replace(/### (.*)/g, "<h3>$1</h3>")
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n\n/g, "</p><p>"),
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ejercicios" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ejercicios Prácticos</CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Pregunta {ejercicioActual + 1} de {leccion.content.ejercicios.length}
                      </span>
                      <Progress
                        value={((ejercicioActual + 1) / leccion.content.ejercicios.length) * 100}
                        className="w-32 h-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{ejercicioActualData.pregunta}</h3>
                      <div className="space-y-3">
                        {ejercicioActualData.opciones.map((opcion, index) => (
                          <div
                            key={index}
                            className={`
                              p-4 rounded-lg border cursor-pointer transition-all
                              ${
                                respuestasUsuario[ejercicioActualData.id] === index
                                  ? "border-[#73A2D3] bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }
                              ${
                                mostrarResultados && index === ejercicioActualData.respuesta_correcta
                                  ? "border-green-500 bg-green-50"
                                  : ""
                              }
                              ${
                                mostrarResultados &&
                                respuestasUsuario[ejercicioActualData.id] === index &&
                                index !== ejercicioActualData.respuesta_correcta
                                  ? "border-red-500 bg-red-50"
                                  : ""
                              }
                            `}
                            onClick={() => !mostrarResultados && handleRespuesta(ejercicioActualData.id, index)}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`
                                  w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                                  ${
                                    respuestasUsuario[ejercicioActualData.id] === index
                                      ? "bg-[#73A2D3] text-white"
                                      : "bg-gray-100 text-gray-700"
                                  }
                                  ${
                                    mostrarResultados && index === ejercicioActualData.respuesta_correcta
                                      ? "bg-green-500 text-white"
                                      : ""
                                  }
                                  ${
                                    mostrarResultados &&
                                    respuestasUsuario[ejercicioActualData.id] === index &&
                                    index !== ejercicioActualData.respuesta_correcta
                                      ? "bg-red-500 text-white"
                                      : ""
                                  }
                                `}
                              >
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span>{opcion}</span>
                              {mostrarResultados && index === ejercicioActualData.respuesta_correcta && (
                                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {mostrarResultados && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Explicación:</h4>
                        <p className="text-blue-700">{ejercicioActualData.explicacion}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setEjercicioActual(Math.max(0, ejercicioActual - 1))}
                        disabled={ejercicioActual === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>

                      {!mostrarResultados && respuestasUsuario[ejercicioActualData.id] !== undefined && (
                        <Button onClick={verificarRespuestas} className="bg-[#73A2D3]">
                          Verificar Respuesta
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => {
                          setEjercicioActual(Math.min(leccion.content.ejercicios.length - 1, ejercicioActual + 1))
                          setMostrarResultados(false)
                        }}
                        disabled={ejercicioActual === leccion.content.ejercicios.length - 1}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Progreso de la Lección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completado</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Video visto</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Teoría leída</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                    <span>Ejercicios completados</span>
                  </div>
                </div>

                <Button className="w-full bg-[#73A2D3]">Marcar como Completada</Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Navegación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/curso/${params.materia}/modulos`}>
                  <Button variant="outline" className="w-full justify-start">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Volver al Curso
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  Lección Anterior
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Siguiente Lección
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
