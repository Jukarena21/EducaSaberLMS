"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Users, 
  School, 
  X,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ExamSchoolData, ExamAssignmentData } from '@/types/manual-simulacro'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ACADEMIC_GRADE_NAMES, getAcademicGradeDisplayName } from '@/lib/academicGrades'

interface SimulacroAssignmentProps {
  simulacroId: string
  onClose: () => void
}

export function SimulacroAssignment({ simulacroId, onClose }: SimulacroAssignmentProps) {
  const { toast } = useToast()
  const [schools, setSchools] = useState<Array<{ id: string; name: string; daneCode?: string }>>([])
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; email: string; schoolId?: string }>>([])
  const [assignedSchools, setAssignedSchools] = useState<ExamSchoolData[]>([])
  const [assignedStudents, setAssignedStudents] = useState<ExamAssignmentData[]>([])
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedAcademicGrade, setSelectedAcademicGrade] = useState<string>("")
  const [schoolSearch, setSchoolSearch] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [simulacroId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Cargar colegios
      const schoolsResponse = await fetch('/api/schools?limit=1000') // Obtener todos los colegios
      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json()
        // La API devuelve { schools: [...], pagination: {...} }
        setSchools(Array.isArray(schoolsData.schools) ? schoolsData.schools : [])
      }

      // Cargar estudiantes
      const studentsResponse = await fetch('/api/users?role=student&limit=1000')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        // Verificar si es un array o un objeto con users
        if (Array.isArray(studentsData)) {
          setStudents(studentsData)
        } else if (studentsData.users && Array.isArray(studentsData.users)) {
          setStudents(studentsData.users)
        } else {
          setStudents([])
        }
      }

      // Cargar asignaciones actuales
      const examResponse = await fetch(`/api/manual-simulacros/${simulacroId}`)
      if (examResponse.ok) {
        const examData = await examResponse.json()
        setAssignedSchools(examData.examSchools || [])
        setAssignedStudents(examData.examAssignments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSchools = async () => {
    if (selectedSchoolIds.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un colegio",
        variant: "destructive"
      })
      return
    }

    if (!selectedAcademicGrade) {
      toast({
        title: "Error",
        description: "Debes seleccionar un año escolar",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}/assign-schools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolIds: selectedSchoolIds,
          academicGrade: selectedAcademicGrade
        })
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Colegios asignados correctamente"
        })
        setSelectedSchoolIds([])
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al asignar colegios",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al asignar colegios",
        variant: "destructive"
      })
    }
  }

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un estudiante",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}/assign-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedStudentIds
        })
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Estudiantes asignados correctamente"
        })
        setSelectedStudentIds([])
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al asignar estudiantes",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al asignar estudiantes",
        variant: "destructive"
      })
    }
  }

  const handleRemoveSchool = async (schoolId: string, academicGrade?: string) => {
    try {
      const url = new URL(`/api/manual-simulacros/${simulacroId}/assign-schools`, window.location.origin)
      url.searchParams.set('schoolId', schoolId)
      if (academicGrade) {
        url.searchParams.set('academicGrade', academicGrade)
      }
      const response = await fetch(url.toString(), {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Asignación eliminada"
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al eliminar asignación",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar asignación",
        variant: "destructive"
      })
    }
  }

  const handleRemoveStudent = async (userId: string) => {
    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}/assign-students?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Asignación eliminada"
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al eliminar asignación",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar asignación",
        variant: "destructive"
      })
    }
  }

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
    school.daneCode?.toLowerCase().includes(schoolSearch.toLowerCase())
  )

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="schools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schools">
            <School className="mr-2 h-4 w-4" />
            Asignar a Colegios
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Asignar a Estudiantes
          </TabsTrigger>
        </TabsList>

        {/* Tab de Colegios */}
        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignar a Colegios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicGrade">Año Escolar *</Label>
                  <Select
                    value={selectedAcademicGrade}
                    onValueChange={setSelectedAcademicGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un año escolar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_GRADE_NAMES.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {getAcademicGradeDisplayName(grade)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schoolSearch">Buscar Colegio</Label>
                  <Input
                    id="schoolSearch"
                    placeholder="Buscar por nombre o código DANE..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Button 
                  onClick={handleAssignSchools} 
                  disabled={selectedSchoolIds.length === 0 || !selectedAcademicGrade}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Asignar Seleccionados ({selectedSchoolIds.length})
                </Button>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Código DANE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => {
                      // Verificar si está asignado para el año escolar seleccionado
                      const isAssigned = selectedAcademicGrade 
                        ? assignedSchools.some(as => 
                            as.schoolId === school.id && 
                            as.academicGrade === selectedAcademicGrade
                          )
                        : assignedSchools.some(as => as.schoolId === school.id)
                      const isSelected = selectedSchoolIds.includes(school.id)
                      
                      return (
                        <TableRow key={school.id}>
                          <TableCell>
                            {!isAssigned && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSchoolIds([...selectedSchoolIds, school.id])
                                  } else {
                                    setSelectedSchoolIds(selectedSchoolIds.filter(id => id !== school.id))
                                  }
                                }}
                              />
                            )}
                            {isAssigned && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Asignado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>{school.daneCode || "-"}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {assignedSchools.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Colegios Asignados</h4>
                  <div className="space-y-2">
                    {assignedSchools.map((assignment) => {
                      const school = schools.find(s => s.id === assignment.schoolId)
                      const gradeDisplay = assignment.academicGrade 
                        ? getAcademicGradeDisplayName(assignment.academicGrade)
                        : 'Todos los grados'
                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{school?.name || "Colegio no encontrado"}</div>
                            <div className="text-sm font-medium text-blue-600">{gradeDisplay}</div>
                            {assignment.openDate && (
                              <div className="text-sm text-gray-500">
                                Abre: {new Date(assignment.openDate).toLocaleDateString()}
                              </div>
                            )}
                            {assignment.closeDate && (
                              <div className="text-sm text-gray-500">
                                Cierra: {new Date(assignment.closeDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSchool(assignment.schoolId, assignment.academicGrade)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Estudiantes */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignar a Estudiantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="studentSearch">Buscar Estudiante</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentSearch"
                    placeholder="Buscar por nombre o email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <Button onClick={handleAssignStudents} disabled={selectedStudentIds.length === 0}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Asignar Seleccionados ({selectedStudentIds.length})
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const isAssigned = assignedStudents.some(as => as.userId === student.id)
                      const isSelected = selectedStudentIds.includes(student.id)
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            {!isAssigned && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id])
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                                  }
                                }}
                              />
                            )}
                            {isAssigned && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Asignado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.email}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {assignedStudents.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Estudiantes Asignados</h4>
                  <div className="space-y-2">
                    {assignedStudents.map((assignment) => {
                      const student = students.find(s => s.id === assignment.userId)
                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">
                              {student ? `${student.firstName} ${student.lastName}` : "Estudiante no encontrado"}
                            </div>
                            <div className="text-sm text-gray-500">{student?.email}</div>
                            {assignment.openDate && (
                              <div className="text-sm text-gray-500">
                                Abre: {new Date(assignment.openDate).toLocaleDateString()}
                              </div>
                            )}
                            {assignment.closeDate && (
                              <div className="text-sm text-gray-500">
                                Cierra: {new Date(assignment.closeDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStudent(assignment.userId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}

