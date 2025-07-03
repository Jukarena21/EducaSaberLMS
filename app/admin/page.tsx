"use client"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  FileText,
  TrendingUp,
  LogOut,
  BarChart3,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  BookOpen,
  Video,
  ImageIcon,
  Bell,
  Activity,
  PieChart,
  LineChart,
  Upload,
  Save,
  X,
  Award,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area,
  Pie,
} from "recharts"

// Datos de ejemplo para gráficos
const rendimientoTemporal = [
  { mes: "Ene", matematicas: 65, lectura: 72, ciencias: 68, sociales: 75, ingles: 70 },
  { mes: "Feb", matematicas: 68, lectura: 75, ciencias: 71, sociales: 78, ingles: 73 },
  { mes: "Mar", matematicas: 72, lectura: 78, ciencias: 74, sociales: 80, ingles: 76 },
  { mes: "Abr", matematicas: 75, lectura: 80, ciencias: 77, sociales: 82, ingles: 78 },
  { mes: "May", matematicas: 78, lectura: 83, ciencias: 80, sociales: 85, ingles: 81 },
  { mes: "Jun", matematicas: 80, lectura: 85, ciencias: 82, sociales: 87, ingles: 83 },
]

const distribucionNotas = [
  { rango: "0-40", estudiantes: 45, color: "#ef4444" },
  { rango: "41-60", estudiantes: 120, color: "#f97316" },
  { rango: "61-80", estudiantes: 380, color: "#eab308" },
  { rango: "81-100", estudiantes: 255, color: "#22c55e" },
]

const actividadDiaria = [
  { hora: "06:00", estudiantes: 12 },
  { hora: "08:00", estudiantes: 45 },
  { hora: "10:00", estudiantes: 89 },
  { hora: "12:00", estudiantes: 156 },
  { hora: "14:00", estudiantes: 234 },
  { hora: "16:00", estudiantes: 298 },
  { hora: "18:00", estudiantes: 187 },
  { hora: "20:00", estudiantes: 134 },
  { hora: "22:00", estudiantes: 67 },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("analytics")
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
            <h1 className="text-xl font-semibold text-gray-800">Portal Administrativo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            <Badge variant="secondary" className="bg-[#C00102] text-white">
              Administrador
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel de Administración</h2>
          <p className="text-gray-600">Gestiona contenido, analiza datos y supervisa el rendimiento de la plataforma</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="content">📚 Contenido</TabsTrigger>
            <TabsTrigger value="questions">❓ Preguntas</TabsTrigger>
            <TabsTrigger value="students">👥 Estudiantes</TabsTrigger>
            <TabsTrigger value="reports">📋 Informes</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Configuración</TabsTrigger>
          </TabsList>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#73A2D3]">2,547</div>
                      <div className="text-sm text-gray-600">Estudiantes Activos</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12% vs mes anterior
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-[#73A2D3]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#C00102]">1,256</div>
                      <div className="text-sm text-gray-600">Exámenes Realizados</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8% esta semana
                      </div>
                    </div>
                    <FileText className="h-8 w-8 text-[#C00102]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#73A2D3]">76.8%</div>
                      <div className="text-sm text-gray-600">Promedio General</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +2.3% este mes
                      </div>
                    </div>
                    <Award className="h-8 w-8 text-[#73A2D3]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#C00102]">18</div>
                      <div className="text-sm text-gray-600">Instituciones</div>
                      <div className="text-xs text-blue-600 flex items-center mt-1">
                        <Plus className="h-3 w-3 mr-1" />2 nuevas este mes
                      </div>
                    </div>
                    <Building className="h-8 w-8 text-[#C00102]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Análisis de Rendimiento</h3>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Último mes</SelectItem>
                  <SelectItem value="3m">Últimos 3 meses</SelectItem>
                  <SelectItem value="6m">Últimos 6 meses</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendimiento por Materia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Evolución por Materia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={rendimientoTemporal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="matematicas" stroke="#C00102" strokeWidth={2} />
                      <Line type="monotone" dataKey="lectura" stroke="#73A2D3" strokeWidth={2} />
                      <Line type="monotone" dataKey="ciencias" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="sociales" stroke="#f97316" strokeWidth={2} />
                      <Line type="monotone" dataKey="ingles" stroke="#8b5cf6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribución de Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Distribución de Calificaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={distribucionNotas}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="estudiantes"
                        label={({ rango, estudiantes }) => `${rango}: ${estudiantes}`}
                      >
                        {distribucionNotas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Actividad Diaria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Actividad por Hora</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={actividadDiaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="estudiantes" stroke="#73A2D3" fill="#73A2D3" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Instituciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Ranking de Instituciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { nombre: "San José", promedio: 85 },
                        { nombre: "La Salle", promedio: 82 },
                        { nombre: "Santa María", promedio: 79 },
                        { nombre: "Nacional", promedio: 75 },
                        { nombre: "Moderno", promedio: 68 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="promedio" fill="#73A2D3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONTENT MANAGEMENT TAB */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestión de Contenido</h3>
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddCourse(true)} className="bg-[#73A2D3]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Curso
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Contenido
                </Button>
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-[#73A2D3]" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-gray-600">Cursos Activos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-[#C00102]" />
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-[#73A2D3]" />
                  <div className="text-2xl font-bold">342</div>
                  <div className="text-sm text-gray-600">Lecciones</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-[#C00102]" />
                  <div className="text-2xl font-bold">89</div>
                  <div className="text-sm text-gray-600">Recursos</div>
                </CardContent>
              </Card>
            </div>

            {/* Content Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cursos y Contenido</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Buscar contenido..." className="w-64" />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso/Lección</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Última Actualización</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        nombre: "Matemáticas Básicas",
                        tipo: "Curso",
                        materia: "Matemáticas",
                        estado: "Publicado",
                        estudiantes: 245,
                        fecha: "2024-01-15",
                      },
                      {
                        nombre: "Álgebra Lineal",
                        tipo: "Módulo",
                        materia: "Matemáticas",
                        estado: "Borrador",
                        estudiantes: 0,
                        fecha: "2024-01-10",
                      },
                      {
                        nombre: "Comprensión Lectora",
                        tipo: "Curso",
                        materia: "Lectura Crítica",
                        estado: "Publicado",
                        estudiantes: 189,
                        fecha: "2024-01-12",
                      },
                      {
                        nombre: "Química Orgánica",
                        tipo: "Lección",
                        materia: "Ciencias Naturales",
                        estado: "Revisión",
                        estudiantes: 67,
                        fecha: "2024-01-08",
                      },
                    ].map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.tipo === "Curso" ? "default" : "secondary"}
                            className={
                              item.tipo === "Curso"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }
                          >
                            {item.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.materia}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.estado === "Publicado"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : item.estado === "Borrador"
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            }
                          >
                            {item.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.estudiantes}</TableCell>
                        <TableCell>{item.fecha}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUESTIONS BANK TAB */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Banco de Preguntas</h3>
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddQuestion(true)} className="bg-[#C00102]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Pregunta
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Preguntas
                </Button>
              </div>
            </div>

            {/* Questions Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { materia: "Matemáticas", preguntas: 456, color: "#C00102" },
                { materia: "Lectura Crítica", preguntas: 342, color: "#73A2D3" },
                { materia: "Ciencias Naturales", preguntas: 389, color: "#22c55e" },
                { materia: "Ciencias Sociales", preguntas: 298, color: "#f97316" },
                { materia: "Inglés", preguntas: 234, color: "#8b5cf6" },
              ].map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.preguntas}
                    </div>
                    <div className="text-sm text-gray-600">{item.materia}</div>
                    <div className="text-xs text-gray-500 mt-1">preguntas</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Questions Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Materia</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las materias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matematicas">Matemáticas</SelectItem>
                        <SelectItem value="lectura">Lectura Crítica</SelectItem>
                        <SelectItem value="ciencias">Ciencias Naturales</SelectItem>
                        <SelectItem value="sociales">Ciencias Sociales</SelectItem>
                        <SelectItem value="ingles">Inglés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dificultad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="revision">En Revisión</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Buscar</Label>
                    <Input placeholder="Texto de la pregunta..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Preguntas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Pregunta</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Dificultad</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: "Q001",
                        pregunta: "¿Cuál es la derivada de x²?",
                        materia: "Matemáticas",
                        dificultad: "Medio",
                        uso: 45,
                        estado: "Activa",
                      },
                      {
                        id: "Q002",
                        pregunta: "Identifica la figura retórica en...",
                        materia: "Lectura Crítica",
                        dificultad: "Difícil",
                        uso: 23,
                        estado: "Activa",
                      },
                      {
                        id: "Q003",
                        pregunta: "¿Cuál es la fórmula del agua?",
                        materia: "Ciencias Naturales",
                        dificultad: "Fácil",
                        uso: 67,
                        estado: "Activa",
                      },
                      {
                        id: "Q004",
                        pregunta: "¿En qué año se firmó la independencia?",
                        materia: "Ciencias Sociales",
                        dificultad: "Medio",
                        uso: 34,
                        estado: "Revisión",
                      },
                    ].map((pregunta, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{pregunta.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{pregunta.pregunta}</TableCell>
                        <TableCell>{pregunta.materia}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pregunta.dificultad === "Fácil"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : pregunta.dificultad === "Medio"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            }
                          >
                            {pregunta.dificultad}
                          </Badge>
                        </TableCell>
                        <TableCell>{pregunta.uso} veces</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pregunta.estado === "Activa"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            }
                          >
                            {pregunta.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="space-y-6">
            {/* Existing students content... */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Contenido de gestión de estudiantes existente...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-6">
            {/* Advanced Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generador de Informes Avanzado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="h-20 flex flex-col items-center justify-center bg-[#73A2D3]">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-sm">Rendimiento por Institución</span>
                    </Button>
                    <Button className="h-20 flex flex-col items-center justify-center bg-[#C00102]">
                      <PieChart className="h-6 w-6 mb-2" />
                      <span className="text-sm">Análisis por Materia</span>
                    </Button>
                    <Button className="h-20 flex flex-col items-center justify-center bg-[#73A2D3]">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-sm">Progreso Temporal</span>
                    </Button>
                    <Button className="h-20 flex flex-col items-center justify-center bg-[#C00102]">
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-sm">Reporte de Estudiantes</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informes Programados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Informe Semanal</div>
                        <div className="text-sm text-gray-600">Cada lunes a las 8:00 AM</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Reporte Mensual</div>
                        <div className="text-sm text-gray-600">Primer día de cada mes</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Configuraciones generales del sistema...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear Nuevo Curso</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddCourse(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Curso</Label>
                <Input placeholder="Ej: Matemáticas Avanzadas" />
              </div>
              <div>
                <Label>Materia</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matematicas">Matemáticas</SelectItem>
                    <SelectItem value="lectura">Lectura Crítica</SelectItem>
                    <SelectItem value="ciencias">Ciencias Naturales</SelectItem>
                    <SelectItem value="sociales">Ciencias Sociales</SelectItem>
                    <SelectItem value="ingles">Inglés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción del curso..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duración (semanas)</Label>
                  <Input type="number" placeholder="12" />
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button onClick={() => setShowAddCourse(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1 bg-[#73A2D3]">
                  <Save className="h-4 w-4 mr-2" />
                  Crear Curso
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear Nueva Pregunta</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddQuestion(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Materia</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matematicas">Matemáticas</SelectItem>
                      <SelectItem value="lectura">Lectura Crítica</SelectItem>
                      <SelectItem value="ciencias">Ciencias Naturales</SelectItem>
                      <SelectItem value="sociales">Ciencias Sociales</SelectItem>
                      <SelectItem value="ingles">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dificultad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Pregunta</Label>
                <Textarea placeholder="Escribe la pregunta aquí..." rows={3} />
              </div>
              <div>
                <Label>Contexto (opcional)</Label>
                <Textarea placeholder="Contexto adicional para la pregunta..." rows={2} />
              </div>
              <div className="space-y-3">
                <Label>Opciones de Respuesta</Label>
                {["A", "B", "C", "D"].map((option) => (
                  <div key={option} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                      {option}
                    </div>
                    <Input placeholder={`Opción ${option}`} className="flex-1" />
                    <input type="radio" name="correct" className="w-4 h-4" />
                    <span className="text-sm text-gray-600">Correcta</span>
                  </div>
                ))}
              </div>
              <div>
                <Label>Explicación</Label>
                <Textarea placeholder="Explicación de la respuesta correcta..." rows={2} />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button onClick={() => setShowAddQuestion(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1 bg-[#C00102]">
                  <Save className="h-4 w-4 mr-2" />
                  Crear Pregunta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
