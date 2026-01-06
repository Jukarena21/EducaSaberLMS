"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bell, Send, Trash2, RefreshCw, Users, GraduationCap, Building } from "lucide-react"
import { useSession } from "next-auth/react"
import { ACADEMIC_GRADE_NAMES } from "@/lib/academicGrades"

interface NotificationStats {
  total: number
  active: number
  expired: number
  percentageExpired: number
}

export function NotificationManagement() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // Estado inicial: para school_admin siempre "my_school", para teacher_admin "all_students"
  const getInitialTarget = (): "all_students" | "specific_grade" | "my_school" => {
    if (session?.user?.role === 'school_admin') {
      return "my_school"
    }
    return "all_students"
  }
  
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [targetUsers, setTargetUsers] = useState<"all_students" | "specific_grade" | "my_school">(getInitialTarget())
  const [targetGrade, setTargetGrade] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const grades = ACADEMIC_GRADE_NAMES

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/admin/notifications/cleanup')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading notification stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "El título y el mensaje son requeridos",
        variant: "destructive",
      })
      return
    }

    if (targetUsers === "specific_grade" && !targetGrade) {
      toast({
        title: "Error",
        description: "Debes seleccionar un grado",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin_broadcast',
          title: title.trim(),
          message: message.trim(),
          targetUsers,
          targetValue: targetUsers === "specific_grade" ? targetGrade : undefined,
          actionUrl: actionUrl.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "¡Notificación enviada!",
          description: `Se enviaron ${data.notificationsCreated} notificaciones exitosamente`,
        })
        // Limpiar formulario
        setTitle("")
        setMessage("")
        setActionUrl("")
        setTargetGrade("")
        setTargetUsers(getInitialTarget())
        await loadStats()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al enviar notificaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: "Error al enviar notificaciones",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleCleanup = async () => {
    try {
      setCleaning(true)
      const response = await fetch('/api/admin/notifications/cleanup', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Limpieza completada",
          description: data.message,
        })
        await loadStats()
      } else {
        toast({
          title: "Error",
          description: "Error al limpiar notificaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error)
      toast({
        title: "Error",
        description: "Error al limpiar notificaciones",
        variant: "destructive",
      })
    } finally {
      setCleaning(false)
    }
  }

  const handleCheckMissedExams = async () => {
    try {
      setCleaning(true)
      const response = await fetch('/api/admin/notifications/check-missed-exams', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Verificación completada",
          description: data.message,
        })
        await loadStats()
      } else {
        toast({
          title: "Error",
          description: "Error al verificar exámenes no presentados",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error checking missed exams:', error)
      toast({
        title: "Error",
        description: "Error al verificar exámenes no presentados",
        variant: "destructive",
      })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Notificaciones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
              <div className="text-sm text-gray-500">Expiradas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.percentageExpired}%</div>
              <div className="text-sm text-gray-500">% Expiradas</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario de notificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enviar Notificación Global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Recordatorio importante"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Destinatarios *</Label>
              <Select value={targetUsers} onValueChange={(value: any) => setTargetUsers(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {session?.user?.role === 'school_admin' ? (
                    // Para school_admin: solo opciones de su colegio
                    <>
                      <SelectItem value="my_school">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Todos los estudiantes de mi colegio
                        </div>
                      </SelectItem>
                      <SelectItem value="specific_grade">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Grado específico (de mi colegio)
                        </div>
                      </SelectItem>
                    </>
                  ) : (
                    // Para teacher_admin: puede enviar a todos o por grado
                    <>
                      <SelectItem value="all_students">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos los estudiantes (todos los colegios)
                        </div>
                      </SelectItem>
                      <SelectItem value="specific_grade">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Grado específico (todos los colegios)
                        </div>
                      </SelectItem>
                      {session?.user?.schoolId && (
                        <SelectItem value="my_school">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Estudiantes de mi colegio
                          </div>
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {session?.user?.role === 'school_admin' && (
                <p className="text-xs text-gray-500">
                  Como administrador de colegio, solo puedes enviar notificaciones a los estudiantes de tu institución.
                </p>
              )}
            </div>
          </div>

          {targetUsers === "specific_grade" && (
            <div className="space-y-2">
              <Label htmlFor="grade">Grado *</Label>
              <Select value={targetGrade} onValueChange={setTargetGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grado" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade.charAt(0).toUpperCase() + grade.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              placeholder="Escribe el mensaje de la notificación..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionUrl">URL de acción (opcional)</Label>
            <Input
              id="actionUrl"
              placeholder="Ej: /estudiante/examen/123"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              URL a la que se redirigirá al hacer clic en la notificación
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendNotification}
              disabled={sending || !title.trim() || !message.trim()}
              className="flex-1"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acciones de mantenimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Limpiar Notificaciones Expiradas - Solo admin general */}
            {session?.user?.role === 'teacher_admin' && (
              <Button
                onClick={handleCleanup}
                disabled={cleaning}
                variant="outline"
                className="flex-1"
              >
                {cleaning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Notificaciones Expiradas
                  </>
                )}
              </Button>
            )}
            {/* Verificar Exámenes No Presentados - Ambos roles */}
            <Button
              onClick={handleCheckMissedExams}
              disabled={cleaning}
              variant="outline"
              className="flex-1"
            >
              {cleaning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Verificar Exámenes No Presentados
                  {session?.user?.role === 'school_admin' && (
                    <span className="ml-1 text-xs">(de mi colegio)</span>
                  )}
                </>
              )}
            </Button>
            {/* Actualizar Estadísticas - Ambos roles */}
            <Button
              onClick={loadStats}
              disabled={loadingStats}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
              Actualizar Estadísticas
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            {session?.user?.role === 'school_admin' 
              ? "Las estadísticas y verificaciones se muestran solo para tu colegio. Las notificaciones expiran automáticamente después de 15 días y se eliminan automáticamente cada noche."
              : "Las notificaciones expiran automáticamente después de 15 días y se eliminan automáticamente cada noche a las 2:00 AM. También puedes limpiarlas manualmente si lo deseas."
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

