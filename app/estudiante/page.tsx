"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Award, Clock, CheckCircle, LogOut, TrendingUp, BarChart3, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EstudianteDashboard() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
            <h1 className="text-xl font-semibold text-gray-800">Portal del Estudiante</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-[#73A2D3] text-white">
              Estudiante
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido de nuevo, Carlos!</h2>
          <p className="text-gray-600">Continúa tu preparación para el ICFES</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Inicio</TabsTrigger>
            <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
            <TabsTrigger value="examenes">Exámenes</TabsTrigger>
            <TabsTrigger value="progreso">Progreso</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-[#73A2D3]" />
                    <div>
                      <div className="text-2xl font-bold">5</div>
                      <div className="text-sm text-gray-600">Cursos Activos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-[#C00102]" />
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-gray-600">Exámenes Completados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-[#73A2D3]" />
                    <div>
                      <div className="text-2xl font-bold">32h</div>
                      <div className="text-sm text-gray-600">Tiempo de Estudio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-[#C00102]" />
                    <div>
                      <div className="text-2xl font-bold">78%</div>
                      <div className="text-sm text-gray-600">Puntaje Promedio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próximos exámenes */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Exámenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-[#73A2D3]">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-[#73A2D3]" />
                      <div>
                        <div className="font-medium">Simulacro ICFES Completo</div>
                        <div className="text-sm text-gray-600">15 de diciembre, 2024</div>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-[#73A2D3]" />
                      <div>
                        <div className="font-medium">Examen de Matemáticas</div>
                        <div className="text-sm text-gray-600">20 de diciembre, 2024</div>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                  </div>

                  <Link href="/examen">
                    <Button className="w-full bg-[#73A2D3]">Ver todos los exámenes</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Completado: Examen de Lectura Crítica</div>
                      <div className="text-sm text-gray-600">Puntaje: 82% • hace 2 horas</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <BookOpen className="h-5 w-5 text-[#73A2D3]" />
                    <div>
                      <div className="font-medium">Iniciado: Módulo de Ciencias Sociales</div>
                      <div className="text-sm text-gray-600">hace 1 día</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examenes" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exámenes Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Link href="/examen">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#73A2D3] hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <h3 className="font-semibold">Simulacro ICFES Completo</h3>
                          <p className="text-sm text-gray-600">Todas las materias • 2 horas • 100 preguntas</p>
                        </div>
                        <Button size="sm" className="bg-[#73A2D3]">
                          Iniciar
                        </Button>
                      </div>
                    </Link>

                    <Link href="/examen">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#73A2D3] hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <h3 className="font-semibold">Examen de Matemáticas</h3>
                          <p className="text-sm text-gray-600">Álgebra y Geometría • 45 minutos • 25 preguntas</p>
                        </div>
                        <Button size="sm" className="bg-[#73A2D3]">
                          Iniciar
                        </Button>
                      </div>
                    </Link>

                    <Link href="/examen">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#73A2D3] hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <h3 className="font-semibold">Examen de Lectura Crítica</h3>
                          <p className="text-sm text-gray-600">Comprensión de textos • 40 minutos • 20 preguntas</p>
                        </div>
                        <Button size="sm" className="bg-[#73A2D3]">
                          Iniciar
                        </Button>
                      </div>
                    </Link>

                    <Link href="/examen">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#73A2D3] hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <h3 className="font-semibold">Examen de Ciencias Naturales</h3>
                          <p className="text-sm text-gray-600">
                            Biología, Química y Física • 50 minutos • 30 preguntas
                          </p>
                        </div>
                        <Button size="sm" className="bg-[#73A2D3]">
                          Iniciar
                        </Button>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de Exámenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { nombre: "Examen de Lectura Crítica", fecha: "10 dic, 2024", puntaje: 82 },
                      { nombre: "Examen de Matemáticas", fecha: "5 dic, 2024", puntaje: 75 },
                      { nombre: "Examen de Inglés", fecha: "1 dic, 2024", puntaje: 90 },
                    ].map((examen, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium">{examen.nombre}</h3>
                          <p className="text-sm text-gray-600">{examen.fecha}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            className={`${examen.puntaje >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {examen.puntaje}%
                          </Badge>
                          <Button size="sm" variant="outline">
                            Ver detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progreso" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progreso por Materia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { materia: "Lectura Crítica", progreso: 85, puntaje: "A" },
                    { materia: "Matemáticas", progreso: 68, puntaje: "B" },
                    { materia: "Ciencias Naturales", progreso: 72, puntaje: "B+" },
                    { materia: "Ciencias Sociales", progreso: 78, puntaje: "B+" },
                    { materia: "Inglés", progreso: 90, puntaje: "A+" },
                  ].map((materia, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{materia.materia}</span>
                        <span className="text-sm font-medium">Nivel: {materia.puntaje}</span>
                      </div>
                      <Progress value={materia.progreso} className="h-3" />
                      <div className="text-sm text-gray-600">{materia.progreso}% Completado</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Fortalezas y Debilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-medium">Fortalezas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Comprensión de textos argumentativos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Gramática inglesa</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Historia de Colombia</span>
                    </div>
                  </div>

                  <h3 className="font-medium mt-4">Áreas de mejora</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Geometría analítica</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Química orgánica</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Física mecánica</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-[#73A2D3]">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver análisis completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cursos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { titulo: "Lectura Crítica", progreso: 85, lecciones: 24, color: "#73A2D3", slug: "lectura-critica" },
                { titulo: "Matemáticas", progreso: 68, lecciones: 30, color: "#C00102", slug: "matematicas" },
                {
                  titulo: "Ciencias Naturales",
                  progreso: 72,
                  lecciones: 28,
                  color: "#73A2D3",
                  slug: "ciencias-naturales",
                },
                {
                  titulo: "Ciencias Sociales",
                  progreso: 78,
                  lecciones: 22,
                  color: "#C00102",
                  slug: "ciencias-sociales",
                },
                { titulo: "Inglés", progreso: 90, lecciones: 20, color: "#73A2D3", slug: "ingles" },
              ].map((curso, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                    <div className="text-sm text-gray-600">{curso.lecciones} lecciones</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{curso.progreso}%</span>
                      </div>
                      <Progress value={curso.progreso} className="h-2" />
                      <Link href={`/curso/${curso.slug}/modulos`}>
                        <Button className="w-full mt-4" style={{ backgroundColor: curso.color }}>
                          Continuar Aprendizaje
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
