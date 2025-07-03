"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

// Tipos para las preguntas
type Opcion = {
  id: string
  texto: string
}

type Pregunta = {
  id: number
  texto: string
  contexto?: string
  opciones: Opcion[]
  respuestaCorrecta: string
  explicacion: string
  materia: string
  tema: string
  dificultad: "fácil" | "media" | "difícil"
}

export default function ExamenPage() {
  const router = useRouter()
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [tiempoRestante, setTiempoRestante] = useState(3300) // 55 minutos en segundos
  const [tiempoPorPregunta] = useState(240) // 4 minutos por pregunta
  const [materiaSeleccionada, setMateriaSeleccionada] = useState("Ciencias Naturales")
  const [examenTerminado, setExamenTerminado] = useState(false)
  const [mostrarTiempo, setMostrarTiempo] = useState(false)
  const [mostrarModalRespuestas, setMostrarModalRespuestas] = useState(false)

  // Preguntas de ejemplo para el Preicfes (solo 4 opciones)
  const preguntas: Pregunta[] = [
    {
      id: 1,
      texto:
        "El proceso mediante el cual las sustancias de desecho producidas como resultado de las actividades metabólicas en organismos vivos son expulsadas de las células o del cuerpo se denomina excreción.",
      contexto:
        "En los organismos vivos, el proceso de excreción ocurre de diferentes maneras.\n\nEn consecuencia,\n\nI. En organismos unicelulares, los productos de desecho son expulsados a través de la membrana celular;\nII. En plantas, procesos como la transpiración, gutación y caída de hojas;\nIII. En humanos, formación de sudor y orina;\n\n¿Cuál de los procesos mencionados anteriormente puede considerarse ejemplos de excreción?",
      opciones: [
        { id: "A", texto: "Solo I" },
        { id: "B", texto: "I y II" },
        { id: "C", texto: "I y III" },
        { id: "D", texto: "II y III" },
      ],
      respuestaCorrecta: "C",
      explicacion:
        "La excreción incluye todos los procesos de eliminación de desechos metabólicos. En organismos unicelulares (I) y en humanos (III) se eliminan productos de desecho del metabolismo, mientras que en plantas (II) algunos procesos como la transpiración no son estrictamente excreción de desechos metabólicos.",
      materia: "Ciencias Naturales",
      tema: "Movimiento Circular Uniforme / Período",
      dificultad: "media",
    },
    {
      id: 2,
      texto:
        "En el siguiente fragmento: 'La educación es el arma más poderosa que puedes usar para cambiar el mundo', el autor expresa principalmente:",
      opciones: [
        { id: "A", texto: "Una comparación entre la educación y las armas" },
        { id: "B", texto: "El poder transformador de la educación" },
        { id: "C", texto: "La necesidad de cambiar el sistema educativo mundial" },
        { id: "D", texto: "Una crítica al sistema armamentista global" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "La frase de Mandela utiliza una metáfora para enfatizar el poder transformador de la educación como herramienta de cambio social.",
      materia: "Lectura Crítica",
      tema: "Comprensión de textos argumentativos",
      dificultad: "media",
    },
    {
      id: 3,
      texto: "Si f(x) = 3x² - 4x + 2, ¿cuál es el valor de f(2)?",
      opciones: [
        { id: "A", texto: "6" },
        { id: "B", texto: "8" },
        { id: "C", texto: "10" },
        { id: "D", texto: "12" },
      ],
      respuestaCorrecta: "A",
      explicacion: "Para calcular f(2), sustituimos x por 2: f(2) = 3(4) - 8 + 2 = 6",
      materia: "Matemáticas",
      tema: "Funciones",
      dificultad: "fácil",
    },
    {
      id: 4,
      texto: "¿Cuál de los siguientes acontecimientos fue una consecuencia directa del Bogotazo en 1948?",
      opciones: [
        { id: "A", texto: "El inicio del Frente Nacional" },
        { id: "B", texto: "La intensificación de La Violencia bipartidista" },
        { id: "C", texto: "La creación de la Constitución de 1991" },
        { id: "D", texto: "La firma del Tratado de Libre Comercio" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "El asesinato de Jorge Eliécer Gaitán intensificó el período conocido como La Violencia entre liberales y conservadores.",
      materia: "Ciencias Sociales",
      tema: "Historia de Colombia - Siglo XX",
      dificultad: "media",
    },
    {
      id: 5,
      texto: "Choose the correct sentence:",
      opciones: [
        { id: "A", texto: "She don't like to study for exams." },
        { id: "B", texto: "She doesn't likes to study for exams." },
        { id: "C", texto: "She doesn't like to study for exams." },
        { id: "D", texto: "She not like to study for exams." },
      ],
      respuestaCorrecta: "C",
      explicacion:
        "La forma correcta de la tercera persona del singular en presente simple negativo es 'doesn't like'.",
      materia: "Inglés",
      tema: "Gramática - Presente simple",
      dificultad: "fácil",
    },
    {
      id: 6,
      texto:
        "En una reacción química, ¿qué ley establece que la masa total de las sustancias antes de la reacción es igual a la masa total después de la reacción?",
      opciones: [
        { id: "A", texto: "Ley de Boyle" },
        { id: "B", texto: "Ley de conservación de la energía" },
        { id: "C", texto: "Ley de conservación de la masa" },
        { id: "D", texto: "Ley de Gay-Lussac" },
      ],
      respuestaCorrecta: "C",
      explicacion:
        "La Ley de conservación de la masa, formulada por Antoine Lavoisier, establece que en una reacción química la masa total permanece constante.",
      materia: "Ciencias Naturales",
      tema: "Química - Leyes fundamentales",
      dificultad: "media",
    },
    {
      id: 7,
      texto: "¿Cuál es el resultado de la siguiente operación? (3x² + 2x - 5) + (2x² - 3x + 1)",
      opciones: [
        { id: "A", texto: "5x² - x - 4" },
        { id: "B", texto: "5x² - x - 6" },
        { id: "C", texto: "5x² - x - 3" },
        { id: "D", texto: "5x² + x - 4" },
      ],
      respuestaCorrecta: "A",
      explicacion: "Para sumar polinomios: (3x² + 2x²) + (2x - 3x) + (-5 + 1) = 5x² - x - 4",
      materia: "Matemáticas",
      tema: "Álgebra - Polinomios",
      dificultad: "media",
    },
    {
      id: 8,
      texto:
        "En el siguiente fragmento: 'Las nubes, grises y amenazantes, se cernían sobre la ciudad como un manto de oscuridad', ¿qué figura literaria predomina?",
      opciones: [
        { id: "A", texto: "Metáfora" },
        { id: "B", texto: "Símil o comparación" },
        { id: "C", texto: "Hipérbole" },
        { id: "D", texto: "Personificación" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "Se utiliza un símil al usar la palabra 'como' para establecer una relación de semejanza entre las nubes y un manto de oscuridad.",
      materia: "Lectura Crítica",
      tema: "Figuras literarias",
      dificultad: "media",
    },
    {
      id: 9,
      texto: "¿Cuál de los siguientes es un derecho fundamental según la Constitución Política de Colombia de 1991?",
      opciones: [
        { id: "A", texto: "Derecho a la propiedad privada" },
        { id: "B", texto: "Derecho a la vida" },
        { id: "C", texto: "Derecho a la recreación" },
        { id: "D", texto: "Derecho al trabajo" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "El derecho a la vida está consagrado en el artículo 11 de la Constitución Política de Colombia y es considerado un derecho fundamental.",
      materia: "Ciencias Sociales",
      tema: "Constitución y democracia",
      dificultad: "media",
    },
    {
      id: 10,
      texto: "Complete the sentence: 'If I _____ more time, I would study another language.'",
      opciones: [
        { id: "A", texto: "have" },
        { id: "B", texto: "had" },
        { id: "C", texto: "would have" },
        { id: "D", texto: "has" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "Esta es una oración condicional tipo 2. La estructura correcta es: If + simple past, would + infinitive.",
      materia: "Inglés",
      tema: "Gramática - Condicionales",
      dificultad: "media",
    },
    {
      id: 11,
      texto: "¿Cuál es la fórmula química del agua?",
      opciones: [
        { id: "A", texto: "H2O" },
        { id: "B", texto: "CO2" },
        { id: "C", texto: "NaCl" },
        { id: "D", texto: "CH4" },
      ],
      respuestaCorrecta: "A",
      explicacion: "El agua está compuesta por dos átomos de hidrógeno y uno de oxígeno, por lo que su fórmula es H2O.",
      materia: "Ciencias Naturales",
      tema: "Química básica",
      dificultad: "fácil",
    },
    {
      id: 12,
      texto: "En el contexto de la literatura colombiana, ¿quién escribió 'Cien años de soledad'?",
      opciones: [
        { id: "A", texto: "Jorge Isaacs" },
        { id: "B", texto: "Gabriel García Márquez" },
        { id: "C", texto: "Álvaro Mutis" },
        { id: "D", texto: "Rafael Pombo" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "Gabriel García Márquez escribió 'Cien años de soledad', obra que le valió el Premio Nobel de Literatura en 1982.",
      materia: "Lectura Crítica",
      tema: "Literatura colombiana",
      dificultad: "fácil",
    },
    {
      id: 13,
      texto: "¿Cuál es la capital de Francia?",
      opciones: [
        { id: "A", texto: "Londres" },
        { id: "B", texto: "Madrid" },
        { id: "C", texto: "París" },
        { id: "D", texto: "Roma" },
      ],
      respuestaCorrecta: "C",
      explicacion: "París es la capital y ciudad más poblada de Francia.",
      materia: "Ciencias Sociales",
      tema: "Geografía mundial",
      dificultad: "fácil",
    },
    {
      id: 14,
      texto: "What is the past tense of 'go'?",
      opciones: [
        { id: "A", texto: "goed" },
        { id: "B", texto: "went" },
        { id: "C", texto: "gone" },
        { id: "D", texto: "going" },
      ],
      respuestaCorrecta: "B",
      explicacion: "El pasado simple del verbo 'go' es 'went'. Es un verbo irregular.",
      materia: "Inglés",
      tema: "Verbos irregulares",
      dificultad: "fácil",
    },
    {
      id: 15,
      texto: "¿Cuál es el resultado de 15 + 25?",
      opciones: [
        { id: "A", texto: "30" },
        { id: "B", texto: "35" },
        { id: "C", texto: "40" },
        { id: "D", texto: "45" },
      ],
      respuestaCorrecta: "C",
      explicacion: "15 + 25 = 40",
      materia: "Matemáticas",
      tema: "Aritmética básica",
      dificultad: "fácil",
    },
    {
      id: 16,
      texto: "¿En qué año se firmó la independencia de Colombia?",
      opciones: [
        { id: "A", texto: "1810" },
        { id: "B", texto: "1819" },
        { id: "C", texto: "1820" },
        { id: "D", texto: "1821" },
      ],
      respuestaCorrecta: "B",
      explicacion: "La independencia de Colombia se consolidó en 1819 con la Batalla de Boyacá.",
      materia: "Ciencias Sociales",
      tema: "Historia de Colombia",
      dificultad: "media",
    },
    {
      id: 17,
      texto: "¿Cuál es la unidad básica de la vida?",
      opciones: [
        { id: "A", texto: "El átomo" },
        { id: "B", texto: "La célula" },
        { id: "C", texto: "El tejido" },
        { id: "D", texto: "El órgano" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "La célula es la unidad básica de la vida, ya que es la estructura más pequeña que puede realizar todas las funciones vitales.",
      materia: "Ciencias Naturales",
      tema: "Biología celular",
      dificultad: "fácil",
    },
    {
      id: 18,
      texto:
        "En el poema 'Nocturno' de José Asunción Silva, ¿qué figura retórica predomina en los versos 'Una noche toda llena de perfumes, de murmullos y de música de alas'?",
      opciones: [
        { id: "A", texto: "Aliteración" },
        { id: "B", texto: "Sinestesia" },
        { id: "C", texto: "Hipérbaton" },
        { id: "D", texto: "Anáfora" },
      ],
      respuestaCorrecta: "B",
      explicacion:
        "La sinestesia mezcla sensaciones de diferentes sentidos: perfumes (olfato), murmullos (oído) y música de alas (oído y vista).",
      materia: "Lectura Crítica",
      tema: "Figuras retóricas",
      dificultad: "difícil",
    },
    {
      id: 19,
      texto: "How do you say 'biblioteca' in English?",
      opciones: [
        { id: "A", texto: "bookstore" },
        { id: "B", texto: "library" },
        { id: "C", texto: "school" },
        { id: "D", texto: "office" },
      ],
      respuestaCorrecta: "B",
      explicacion: "'Biblioteca' en inglés es 'library'. 'Bookstore' es librería (tienda de libros).",
      materia: "Inglés",
      tema: "Vocabulario básico",
      dificultad: "fácil",
    },
    {
      id: 20,
      texto: "¿Cuál es la derivada de f(x) = x²?",
      opciones: [
        { id: "A", texto: "x" },
        { id: "B", texto: "2x" },
        { id: "C", texto: "x²" },
        { id: "D", texto: "2x²" },
      ],
      respuestaCorrecta: "B",
      explicacion: "La derivada de x² es 2x, aplicando la regla de potencias: d/dx(xⁿ) = n·xⁿ⁻¹",
      materia: "Matemáticas",
      tema: "Cálculo - Derivadas",
      dificultad: "media",
    },
  ]

  // Pregunta actual
  const pregunta = preguntas[preguntaActual]

  // Efecto para el temporizador
  useEffect(() => {
    if (tiempoRestante <= 0 || examenTerminado) {
      return
    }

    const timer = setInterval(() => {
      setTiempoRestante((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [tiempoRestante, examenTerminado])

  // Formatear tiempo
  const formatearTiempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`
  }

  // Manejar selección de respuesta
  const seleccionarRespuesta = (opcionId: string) => {
    if (examenTerminado) return

    setRespuestas((prev) => ({
      ...prev,
      [pregunta.id]: opcionId,
    }))
  }

  // Manejar selección de respuesta para una pregunta específica
  const seleccionarRespuestaPregunta = (preguntaId: number, opcionId: string) => {
    if (examenTerminado) return

    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: opcionId,
    }))
  }

  // Navegar a pregunta específica
  const irAPregunta = (index: number) => {
    setPreguntaActual(index)
  }

  // Navegar a la siguiente pregunta
  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1)
    }
  }

  // Navegar a la pregunta anterior
  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1)
    }
  }

  // Finalizar examen
  const finalizarExamen = () => {
    const respuestasFaltantes = preguntas.filter((p) => !respuestas[p.id])

    if (respuestasFaltantes.length > 0) {
      setMostrarModalRespuestas(true)
      return
    }

    // Si todas las respuestas están completas, ir a resultados
    router.push("/examen/resultado")
  }

  const cerrarModal = () => {
    setMostrarModalRespuestas(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
              <span className="text-xl font-semibold text-gray-800">EDUCA COLOMBIA</span>
            </Link>
            <Badge className="bg-[#73A2D3]">Exámenes</Badge>
            <span className="text-sm text-gray-600">4to Examen de Práctica</span>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={materiaSeleccionada} onValueChange={setMateriaSeleccionada}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lectura Crítica">Lectura Crítica</SelectItem>
                <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                <SelectItem value="Ciencias Naturales">Ciencias Naturales</SelectItem>
                <SelectItem value="Ciencias Sociales">Ciencias Sociales</SelectItem>
                <SelectItem value="Inglés">Inglés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="flex justify-center h-[calc(100vh-80px)]">
        <div className="flex w-full max-w-7xl">
          {/* Contenido principal */}
          <div className="flex-1 p-6">
            {/* Pregunta */}
            <div className="bg-white rounded-lg p-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="mb-6">
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">{pregunta.texto}</p>
                </div>

                {/* Contexto si existe */}
                {pregunta.contexto && (
                  <div className="mb-6">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{pregunta.contexto}</p>
                  </div>
                )}

                {/* Opciones de respuesta */}
                <div className="space-y-3">
                  {pregunta.opciones.map((opcion) => (
                    <div
                      key={opcion.id}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all flex items-start space-x-3
                        ${
                          respuestas[pregunta.id] === opcion.id
                            ? "border-[#73A2D3] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                      onClick={() => seleccionarRespuesta(opcion.id)}
                    >
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm
                          ${
                            respuestas[pregunta.id] === opcion.id
                              ? "bg-[#73A2D3] text-white"
                              : "bg-gray-100 text-gray-700"
                          }
                        `}
                      >
                        {opcion.id}
                      </div>
                      <span className="text-gray-800 flex-1">{opcion.texto}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de la materia y tema */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">{pregunta.materia}</div>
                    <div className="text-sm text-gray-600">{pregunta.tema}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {preguntaActual + 1} / {preguntas.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel lateral derecho */}
          <div className="w-72 bg-white border-l p-4 flex flex-col">
            {/* Hoja de respuestas */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Hoja de Respuestas</h3>
                <span className="text-sm text-gray-600">{preguntas.length} Preguntas</span>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {preguntas.map((p, index) => (
                  <div key={p.id} className="text-center">
                    <div className="text-xs text-gray-600 mb-2 font-medium">{index + 1}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {["A", "B", "C", "D"].map((opcion) => (
                        <button
                          key={opcion}
                          className={`
                    w-7 h-7 rounded-md text-xs font-medium border transition-all
                    ${
                      respuestas[p.id] === opcion
                        ? "bg-[#73A2D3] text-white border-[#73A2D3]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }
                    ${preguntaActual === index ? "ring-2 ring-[#73A2D3] ring-opacity-50" : ""}
                  `}
                          onClick={() => {
                            irAPregunta(index)
                            seleccionarRespuestaPregunta(p.id, opcion)
                          }}
                        >
                          {opcion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barras de tiempo */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiempo Final del Examen</span>
                  <span className="text-sm font-mono font-bold">{formatearTiempo(tiempoRestante)}</span>
                </div>
                <Progress
                  value={(tiempoRestante / 3300) * 100}
                  className="h-2"
                  style={
                    {
                      background: "#e5e7eb",
                      "--tw-progress-bar": "#73A2D3",
                    } as any
                  }
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiempo Sugerido por Pregunta</span>
                  <span className="text-sm font-mono font-bold">{formatearTiempo(tiempoPorPregunta)}</span>
                </div>
                <Progress
                  value={50}
                  className="h-2"
                  style={
                    {
                      background: "#e5e7eb",
                      "--tw-progress-bar": "#C00102",
                    } as any
                  }
                />
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex flex-col space-y-3 mt-6 pt-4 border-t">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={preguntaAnterior}
                  disabled={preguntaActual === 0}
                  className="flex items-center justify-center text-xs px-2 py-1 bg-transparent"
                  size="sm"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  <span>Atrás</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setMostrarTiempo(!mostrarTiempo)}
                  className="flex items-center justify-center text-xs px-2 py-1"
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  <span>Tiempo</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={siguientePregunta}
                  disabled={preguntaActual === preguntas.length - 1}
                  className="flex items-center justify-center text-xs px-2 py-1 bg-transparent"
                  size="sm"
                >
                  <span>Adelante</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            <Button
              className={`w-full mt-4 text-white ${
                preguntas.filter((p) => !respuestas[p.id]).length === 0
                  ? "bg-[#C00102] hover:bg-[#a00102]"
                  : "bg-gray-400 hover:bg-gray-500"
              }`}
              onClick={finalizarExamen}
            >
              {preguntas.filter((p) => !respuestas[p.id]).length === 0
                ? "Finalizar Examen"
                : `Finalizar Examen (${preguntas.filter((p) => !respuestas[p.id]).length} pendientes)`}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de respuestas faltantes */}
      {mostrarModalRespuestas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Respuestas Incompletas</h3>
            <p className="text-gray-600 mb-4">
              Aún tienes {preguntas.filter((p) => !respuestas[p.id]).length} preguntas sin responder. ¿Estás seguro de
              que quieres finalizar el examen?
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={cerrarModal} className="flex-1 bg-transparent">
                Continuar Examen
              </Button>
              <Button
                onClick={() => router.push("/examen/resultado")}
                className="flex-1 bg-[#C00102] hover:bg-[#a00102] text-white"
              >
                Finalizar de Todas Formas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
