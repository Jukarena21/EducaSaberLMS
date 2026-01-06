"use client"

import { useState, useCallback, useRef } from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Users,
  Building,
  GraduationCap,
  FileQuestion,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react"

type ImportType = 'students' | 'schools' | 'lessons' | 'questions'

interface ImportTypeConfig {
  id: ImportType
  label: string
  icon: React.ReactNode
  description: string
  requiredFields: string[]
  optionalFields: string[]
}

const importTypes: ImportTypeConfig[] = [
  {
    id: 'students',
    label: 'Estudiantes',
    icon: <Users className="h-6 w-6" />,
    description: 'Información personal, académica y condiciones especiales',
    requiredFields: ['email', 'firstName', 'lastName', 'documentType', 'documentNumber', 'contactPhone'],
    optionalFields: ['dateOfBirth', 'gender', 'schoolId', 'city', 'neighborhood', 'address']
  },
  {
    id: 'schools',
    label: 'Colegios',
    icon: <Building className="h-6 w-6" />,
    description: 'Datos institucionales y de contacto',
    requiredFields: ['name', 'city', 'address', 'contactEmail', 'contactPhone'],
    optionalFields: ['institutionType', 'academicCalendar', 'daneCode', 'neighborhood', 'website']
  },
  {
    id: 'lessons',
    label: 'Lecciones',
    icon: <GraduationCap className="h-6 w-6" />,
    description: 'Contenido de lecciones con video, teoría y ejercicios',
    requiredFields: ['title', 'description', 'estimatedTimeMinutes', 'videoUrl', 'videoDescription', 'theoryContent'],
    optionalFields: ['competencyId']
  },
  {
    id: 'questions',
    label: 'Preguntas',
    icon: <FileQuestion className="h-6 w-6" />,
    description: 'Preguntas de lecciones con opciones y explicaciones (múltiple opción, verdadero/falso, completar, emparejar, ensayo)',
    requiredFields: ['questionText', 'questionType'],
    optionalFields: ['lessonId', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation', 'difficultyLevel', 'orderIndex', 'timeLimit']
  },
]

interface FilePreview {
  headers: string[]
  rows: string[][]
  totalRows: number
  errors: string[]
  warnings: string[]
}

interface UploadResult {
  created: number
  updated?: number
  errors: Array<{ row: number; message: string }>
  warnings?: Array<{ row: number; message: string }>
}

export function BulkImportCenter() {
  const [selectedType, setSelectedType] = useState<ImportType>('students')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<FilePreview | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedConfig = importTypes.find(t => t.id === selectedType)!

  // Parsear CSV/Excel
  const parseFile = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    
    let headers: string[] = []
    let rows: string[][] = []
    
    if (isExcel) {
      try {
        // Leer archivo Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        // Buscar hoja de datos
        let worksheet = workbook.Sheets['Datos'] || workbook.Sheets[workbook.SheetNames[0]]
        
        if (!worksheet) {
          return {
            headers: [],
            rows: [],
            totalRows: 0,
            errors: ['No se encontró hoja de datos en el archivo Excel'],
            warnings: []
          }
        }
        
        // Convertir a array de arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
        
        if (data.length === 0) {
          return {
            headers: [],
            rows: [],
            totalRows: 0,
            errors: ['El archivo Excel está vacío'],
            warnings: []
          }
        }
        
        // Primera fila son los headers
        headers = (data[0] || []).map((h: any) => String(h || '').trim()).filter(Boolean)
        
        // Filtrar filas de ejemplo y convertir a strings
        const esEjemploIndex = headers.indexOf('_ES_EJEMPLO')
        rows = data.slice(1)
          .filter((row) => {
            // Verificar si es fila de ejemplo
            if (esEjemploIndex >= 0) {
              const esEjemplo = String(row[esEjemploIndex] || '').trim().toUpperCase()
              if (esEjemplo === 'SI' || esEjemplo === 'YES' || esEjemplo === 'TRUE' || esEjemplo === '1') {
                return false // Ignorar fila de ejemplo
              }
            }
            return row.some((cell: any) => String(cell || '').trim() !== '')
          })
          .map((row: any[]) => {
            // Remover columna _ES_EJEMPLO del preview
            if (esEjemploIndex >= 0) {
              row = row.filter((_, idx) => idx !== esEjemploIndex)
            }
            return row.map((cell: any) => String(cell || '').trim())
          })
        
        // Remover _ES_EJEMPLO de headers para el preview
        if (esEjemploIndex >= 0) {
          headers = headers.filter((_, idx) => idx !== esEjemploIndex)
        }
      } catch (error) {
        return {
          headers: [],
          rows: [],
          totalRows: 0,
          errors: [`Error leyendo archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`],
          warnings: []
        }
      }
    } else {
      // Parsear CSV
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        return {
          headers: [],
          rows: [],
          totalRows: 0,
          errors: ['El archivo está vacío'],
          warnings: []
        }
      }

      // Parsear CSV simple (separado por comas)
      headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const esEjemploIndex = headers.indexOf('_ES_EJEMPLO')
      
      rows = lines.slice(1).map(line => {
        // Manejar comas dentro de comillas
        const values: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())
        return values
      }).filter(row => {
        // Filtrar filas de ejemplo
        if (esEjemploIndex >= 0) {
          const esEjemplo = (row[esEjemploIndex] || '').trim().toUpperCase()
          if (esEjemplo === 'SI' || esEjemplo === 'YES' || esEjemplo === 'TRUE' || esEjemplo === '1') {
            return false // Ignorar fila de ejemplo
          }
        }
        return row.some(cell => cell.trim() !== '')
      }).map(row => {
        // Remover columna _ES_EJEMPLO del preview
        if (esEjemploIndex >= 0) {
          return row.filter((_, idx) => idx !== esEjemploIndex)
        }
        return row
      })
      
      // Remover _ES_EJEMPLO de headers para el preview
      if (esEjemploIndex >= 0) {
        headers = headers.filter((_, idx) => idx !== esEjemploIndex)
      }
    }

    // Validar columnas requeridas
    const errors: string[] = []
    const warnings: string[] = []
    
    // Validación especial para preguntas (depende del tipo)
    if (selectedType === 'questions') {
      const hasQuestionText = headers.some(h => h.toLowerCase() === 'questiontext')
      const hasQuestionType = headers.some(h => h.toLowerCase() === 'questiontype')
      
      if (!hasQuestionText || !hasQuestionType) {
        errors.push(`Faltan columnas requeridas: questionText, questionType`)
      } else {
        // Advertir sobre campos opcionales según el tipo
        warnings.push('Nota: Los campos optionA-D y correctOption son requeridos según el tipo de pregunta (excepto para essay)')
      }
    } else {
      // Validación normal para otros tipos
      const missingRequired = selectedConfig.requiredFields.filter(
        field => !headers.some(h => h.toLowerCase() === field.toLowerCase())
      )
      
      if (missingRequired.length > 0) {
        errors.push(`Faltan columnas requeridas: ${missingRequired.join(', ')}`)
      }
    }

    // Advertencias para campos opcionales importantes
    const importantOptional = ['schoolId', 'competencyId', 'courseId', 'userId']
    const missingImportant = importantOptional.filter(
      field => !headers.some(h => h.toLowerCase() === field.toLowerCase())
    )
    
    if (missingImportant.length > 0 && selectedConfig.requiredFields.some(rf => importantOptional.includes(rf))) {
      warnings.push(`Se recomienda incluir: ${missingImportant.join(', ')}`)
    }

    return {
      headers,
      rows: rows.slice(0, 10), // Solo primeras 10 filas para preview
      totalRows: rows.length,
      errors,
      warnings
    }
  }, [selectedConfig])

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return

    // Validar tipo de archivo
    const validExtensions = ['.csv', '.xlsx', '.xls']
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor selecciona un archivo CSV o Excel (.csv, .xlsx, .xls)')
      return
    }

    setFile(selectedFile)
    setResult(null)
    
    // Parsear y generar preview
    const previewData = await parseFile(selectedFile)
    setPreview(previewData)
  }, [parseFile])

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  // Subir archivo
  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('type', selectedType)
      formData.append('file', file)

      const response = await fetch('/api/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo')
      }

      setResult(data)
      setUploadProgress(100)
    } catch (error: any) {
      setResult({
        created: 0,
        errors: [{ row: 0, message: error.message || 'Error desconocido' }]
      })
    } finally {
      setUploading(false)
    }
  }

  // Descargar plantilla
  const downloadTemplate = () => {
    let csv = ''
    
    // Función helper para escapar comas en CSV
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }
    
    switch (selectedType) {
      case 'students': {
        // Plantilla organizada por secciones con instrucciones
        const instructions = [
          'INSTRUCCIONES:',
          '1. Los campos marcados con * son OBLIGATORIOS',
          '2. Complete solo las filas de datos (ignore las filas de instrucciones)',
          '3. Para fechas use formato: YYYY-MM-DD (ejemplo: 2008-03-15)',
          '4. Para género use: male, female u other',
          '5. Para tipo de documento use: TI, CC, CE',
          '6. Para jornada use: diurno, nocturno',
          '7. academicAverage debe ser un número entre 0.0 y 5.0',
          '',
          'CAMPOS OBLIGATORIOS (*): email, firstName, lastName, documentType, documentNumber, contactPhone',
          'CAMPOS OPCIONALES: dateOfBirth, gender, city, neighborhood, address, schoolEntryYear, academicAverage, schoolSchedule',
          '',
          '=== INICIO DE DATOS ==='
        ]
        
        const headers = [
          'email *', 'firstName *', 'lastName *', 'documentType *', 'documentNumber *', 'contactPhone *',
          'dateOfBirth', 'gender',
          'city', 'neighborhood', 'address',
          'schoolEntryYear', 'academicAverage', 'schoolSchedule'
        ]
        const example1 = [
          'juan.perez@colegio.edu', 'Juan', 'Pérez', 'TI', '1234567890', '3001234567',
          '2008-03-15', 'male', 'Bogotá', 'Chapinero', 'Cra 7 # 45-23',
          '2022', '4.2', 'diurno'
        ]
        const example2 = [
          'maria.garcia@colegio.edu', 'María', 'García', 'CC', '9876543210', '3009876543',
          '2009-07-20', 'female', 'Medellín', 'El Poblado', 'Cll 10 # 30-15',
          '2021', '4.5', 'diurno'
        ]
        const example3 = [
          'carlos.rodriguez@colegio.edu', 'Carlos', 'Rodríguez', 'TI', '1122334455', '3001122334',
          '2008-11-10', 'male', 'Cali', 'San Fernando', 'Av 5N # 20-30',
          '2022', '4.0', 'diurno'
        ]
        
        csv = [
          ...instructions.map(inst => escapeCSV(inst)),
          headers.map(h => escapeCSV(h)).join(','),
          example1.map(v => escapeCSV(v)).join(','),
          example2.map(v => escapeCSV(v)).join(','),
          example3.map(v => escapeCSV(v)).join(',')
        ].join('\n')
        break
      }
      case 'schools': {
        const instructions = [
          'INSTRUCCIONES:',
          '1. Los campos marcados con * son OBLIGATORIOS',
          '2. Complete solo las filas de datos (ignore las filas de instrucciones)',
          '3. Para tipo de institución use: publica, privada u otro',
          '4. Para calendario académico use: diurno, nocturno o ambos',
          '5. El código DANE es opcional pero debe ser único si se proporciona',
          '6. website debe ser una URL completa (ej: https://www.colegio.edu.co)',
          '',
          'CAMPOS OBLIGATORIOS (*): name, city, address, contactEmail, contactPhone',
          'CAMPOS OPCIONALES: institutionType, academicCalendar, daneCode, neighborhood, website',
          '',
          '=== INICIO DE DATOS ==='
        ]
        
        const headers = [
          'name *', 'city *', 'address *', 'contactEmail *', 'contactPhone *',
          'institutionType', 'academicCalendar', 'daneCode', 'neighborhood', 'website'
        ]
        const example1 = [
          'Colegio Distrital Modelo', 'Bogotá', 'Cra 1 # 2-3', 'contacto@modelo.edu.co', '6012345678',
          'publica', 'diurno', '110001000001', 'Chapinero', 'https://www.modelo.edu.co'
        ]
        const example2 = [
          'Colegio Privado San José', 'Medellín', 'Cll 10 # 30-15', 'info@sanjose.edu.co', '6045678901',
          'privada', 'ambos', '050001000002', 'El Poblado', 'https://www.sanjose.edu.co'
        ]
        const example3 = [
          'Instituto Técnico Industrial', 'Cali', 'Av 6N # 28-50', 'contacto@iti.edu.co', '6023456789',
          'publica', 'diurno', '', 'Centro', 'https://www.iti.edu.co'
        ]
        
        csv = [
          ...instructions.map(inst => escapeCSV(inst)),
          headers.map(h => escapeCSV(h)).join(','),
          example1.map(v => escapeCSV(v)).join(','),
          example2.map(v => escapeCSV(v)).join(','),
          example3.map(v => escapeCSV(v)).join(',')
        ].join('\n')
        break
      }
      case 'lessons': {
        const instructions = [
          'INSTRUCCIONES:',
          '1. TODOS los campos son OBLIGATORIOS',
          '2. Complete solo las filas de datos (ignore las filas de instrucciones)',
          '3. estimatedTimeMinutes debe ser un número mayor a 0 (tiempo en minutos)',
          '4. videoUrl debe ser una URL válida (YouTube, Vimeo, etc.)',
          '5. theoryContent puede incluir HTML básico (párrafos, listas, negritas)',
          '6. videoDescription es una descripción breve del contenido del video',
          '',
          'CAMPOS OBLIGATORIOS: title, description, estimatedTimeMinutes, videoUrl, videoDescription, theoryContent',
          '',
          '=== INICIO DE DATOS ==='
        ]
        
        const headers = [
          'title *', 'description *', 'estimatedTimeMinutes *',
          'videoUrl *', 'videoDescription *', 'theoryContent *'
        ]
        const example1 = [
          'Operaciones con polinomios',
          'Aprende a sumar, restar y multiplicar polinomios paso a paso',
          '45',
          'https://youtu.be/abc123',
          'Video introductorio de 10 minutos sobre operaciones básicas',
          '<p>Los polinomios son expresiones algebraicas que contienen términos con variables y coeficientes. En esta lección aprenderás las operaciones fundamentales.</p><p><strong>Suma de polinomios:</strong> Se suman los términos semejantes.</p>'
        ]
        const example2 = [
          'Ecuaciones de primer grado',
          'Resolución de ecuaciones lineales con una incógnita',
          '30',
          'https://youtu.be/def456',
          'Tutorial paso a paso de 15 minutos',
          '<p>Una ecuación de primer grado tiene la forma ax + b = 0 donde a y b son números reales y a ≠ 0.</p><p>Para resolverla, despejamos la incógnita x.</p>'
        ]
        const example3 = [
          'Fracciones equivalentes',
          'Identificación y creación de fracciones equivalentes',
          '25',
          'https://youtu.be/ghi789',
          'Explicación visual de fracciones',
          '<p>Dos fracciones son equivalentes si representan la misma cantidad. Por ejemplo, 1/2 = 2/4 = 3/6.</p>'
        ]
        
        csv = [
          ...instructions.map(inst => escapeCSV(inst)),
          headers.map(h => escapeCSV(h)).join(','),
          example1.map(v => escapeCSV(v)).join(','),
          example2.map(v => escapeCSV(v)).join(','),
          example3.map(v => escapeCSV(v)).join(',')
        ].join('\n')
        break
      }
      case 'questions': {
        const instructions = [
          'INSTRUCCIONES:',
          '1. Los campos marcados con * son OBLIGATORIOS',
          '2. Complete solo las filas de datos (ignore las filas de instrucciones)',
          '3. usage define dónde se puede usar la pregunta: lesson, exam o both',
          '4. questionType debe ser: multiple_choice, true_false, fill_blank, matching o essay',
          '5. correctOption debe ser: A, B, C o D (según el tipo de pregunta)',
          '6. difficultyLevel debe ser: facil, intermedio o dificil',
          '',
          'REQUISITOS POR TIPO:',
          '- multiple_choice: Requiere optionA, optionB, optionC, optionD y correctOption',
          '- true_false: Requiere optionA (Verdadero), optionB (Falso) y correctOption (A o B)',
          '- fill_blank: Requiere optionA (correcta), optionB-D (distractores) y correctOption',
          '- matching: Requiere optionA-D (formato "izquierda|derecha") y correctOption',
          '- essay: Solo requiere questionText, no necesita opciones',
          '',
          'CAMPOS OBLIGATORIOS (*): usage, questionText, questionType',
          '',
          '=== INICIO DE DATOS ==='
        ]
        
        const headers = [
          'usage *', 'questionText *', 'questionType *', 'optionA', 'optionB', 'optionC', 'optionD',
          'correctOption', 'explanation', 'difficultyLevel',
          'questionImage', 'optionAImage', 'optionBImage', 'optionCImage', 'optionDImage', 'explanationImage'
        ]
        // Ejemplo 1: Opción múltiple
        const example1 = [
          'lesson',
          '¿Cuál es el resultado de (x+2)(x+3)?',
          'multiple_choice',
          'x² + 5x + 6',
          'x² + 6x + 5',
          'x² + 3x + 2',
          'x² + 5x + 3',
          'A',
          'Se aplica la propiedad distributiva: (x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6',
          'intermedio',
          '', '', '', '', '', ''
        ]
        // Ejemplo 2: Verdadero/Falso
        const example2 = [
          'lesson',
          'La suma de dos números negativos siempre es negativa',
          'true_false',
          'Verdadero',
          'Falso',
          '',
          '',
          'A',
          'Al sumar dos números negativos, el resultado es siempre negativo',
          'facil',
          '', '', '', '', '', ''
        ]
        // Ejemplo 3: Completar (fill_blank)
        const example3 = [
          'lesson',
          'Completa: El resultado de 5 + 3 es _____',
          'fill_blank',
          '8',
          '7',
          '9',
          '6',
          'A',
          'La suma de 5 + 3 es igual a 8',
          'facil',
          '', '', '', '', '', ''
        ]
        // Ejemplo 4: Emparejar (matching)
        const example4 = [
          'exam',
          'Empareja cada concepto con su definición',
          'matching',
          'Fotosíntesis|Proceso por el cual las plantas convierten luz en energía',
          'Mitosis|División celular que produce células idénticas',
          'ADN|Molécula que contiene la información genética',
          'ARN|Molécula que transporta información del ADN',
          'A',
          'Cada concepto debe emparejarse con su definición correcta',
          'intermedio',
          'https://ejemplo.com/conceptos.jpg', '', '', '', '', ''
        ]
        // Ejemplo 5: Ensayo (essay)
        const example5 = [
          'exam',
          'Explica en tus propias palabras qué es la fotosíntesis y por qué es importante para la vida en la Tierra',
          'essay',
          '',
          '',
          '',
          '',
          '',
          'Esta pregunta permite al estudiante demostrar su comprensión del concepto',
          'dificil',
          'https://ejemplo.com/fotosintesis.jpg', '', '', '', '', 'https://ejemplo.com/explicacion.jpg'
        ]
        
        csv = [
          ...instructions.map(inst => escapeCSV(inst)),
          headers.map(h => escapeCSV(h)).join(','),
          example1.map(v => escapeCSV(v)).join(','),
          example2.map(v => escapeCSV(v)).join(','),
          example3.map(v => escapeCSV(v)).join(','),
          example4.map(v => escapeCSV(v)).join(','),
          example5.map(v => escapeCSV(v)).join(',')
        ].join('\n')
        break
      }
      default: {
        const headers = [
          ...selectedConfig.requiredFields,
          ...selectedConfig.optionalFields.slice(0, 5)
        ]
        csv = headers.join(',')
        break
      }
    }

    // Generar tanto CSV como Excel
    generateExcelTemplate(csv, selectedType)
  }

  // Generar plantilla Excel directamente desde datos estructurados
  const generateExcelTemplate = (csvContent: string, type: ImportType) => {
    try {
      // Crear workbook
      const wb = XLSX.utils.book_new()
      
      // Definir headers y ejemplos según el tipo
      let headers: string[] = []
      let examples: any[][] = []
      let instructions: string[] = []
      
      switch (type) {
        case 'students': {
          instructions = [
            'INSTRUCCIONES:',
            '1. Los campos marcados con * son OBLIGATORIOS',
            '2. Complete solo las filas de datos (las filas de ejemplo tienen _ES_EJEMPLO = SI)',
            '3. Para fechas use formato: YYYY-MM-DD (ejemplo: 2008-03-15)',
            '4. Para género use: male, female u other',
            '5. Para tipo de documento use: TI, CC, CE',
            '6. Para jornada use: diurno, nocturno',
            '7. academicAverage debe ser un número entre 0.0 y 5.0',
            '',
            'CAMPOS OBLIGATORIOS (*): email, firstName, lastName, documentType, documentNumber, contactPhone',
            'CAMPOS OPCIONALES: dateOfBirth, gender, city, neighborhood, address, schoolEntryYear, academicAverage, schoolSchedule'
          ]
          // Organizar: obligatorios primero, luego opcionales agrupados lógicamente
          headers = ['_ES_EJEMPLO', 
                     'email *', 'firstName *', 'lastName *', 'documentType *', 'documentNumber *', 'contactPhone *',
                     'dateOfBirth', 'gender', 
                     'city', 'neighborhood', 'address',
                     'schoolEntryYear', 'academicAverage', 'schoolSchedule']
          examples = [
            ['SI', 'juan.perez@colegio.edu', 'Juan', 'Pérez', 'TI', '1234567890', '3001234567', '2008-03-15', 'male', 'Bogotá', 'Chapinero', 'Cra 7 # 45-23', '2022', '4.2', 'diurno'],
            ['SI', 'maria.garcia@colegio.edu', 'María', 'García', 'CC', '9876543210', '3009876543', '2009-07-20', 'female', 'Medellín', 'El Poblado', 'Cll 10 # 30-15', '2021', '4.5', 'diurno'],
            ['SI', 'carlos.rodriguez@colegio.edu', 'Carlos', 'Rodríguez', 'TI', '1122334455', '3001122334', '2008-11-10', 'male', 'Cali', 'San Fernando', 'Av 5N # 20-30', '2022', '4.0', 'diurno']
          ]
          break
        }
        case 'schools': {
          instructions = [
            'INSTRUCCIONES:',
            '1. Los campos marcados con * son OBLIGATORIOS',
            '2. Complete solo las filas de datos (las filas de ejemplo tienen _ES_EJEMPLO = SI)',
            '3. Para tipo de institución use: publica, privada u otro',
            '4. Para calendario académico use: diurno, nocturno o ambos',
            '5. El código DANE es opcional pero debe ser único si se proporciona',
            '6. website debe ser una URL completa (ej: https://www.colegio.edu.co)',
            '',
            'CAMPOS OBLIGATORIOS (*): name, city, address, contactEmail, contactPhone',
            'CAMPOS OPCIONALES: institutionType, academicCalendar, daneCode, neighborhood, website'
          ]
          // Organizar: obligatorios primero, luego opcionales
          headers = ['_ES_EJEMPLO', 
                     'name *', 'city *', 'address *', 'contactEmail *', 'contactPhone *',
                     'institutionType', 'academicCalendar', 'daneCode', 'neighborhood', 'website']
          examples = [
            ['SI', 'Colegio Distrital Modelo', 'Bogotá', 'Cra 1 # 2-3', 'contacto@modelo.edu.co', '6012345678', 'publica', 'diurno', '110001000001', 'Chapinero', 'https://www.modelo.edu.co'],
            ['SI', 'Colegio Privado San José', 'Medellín', 'Cll 10 # 30-15', 'info@sanjose.edu.co', '6045678901', 'privada', 'ambos', '050001000002', 'El Poblado', 'https://www.sanjose.edu.co'],
            ['SI', 'Instituto Técnico Industrial', 'Cali', 'Av 6N # 28-50', 'contacto@iti.edu.co', '6023456789', 'publica', 'diurno', '', 'Centro', 'https://www.iti.edu.co']
          ]
          break
        }
        case 'lessons': {
          instructions = [
            'INSTRUCCIONES:',
            '1. TODOS los campos son OBLIGATORIOS',
            '2. Complete solo las filas de datos (las filas de ejemplo tienen _ES_EJEMPLO = SI)',
            '3. estimatedTimeMinutes debe ser un número mayor a 0 (tiempo en minutos)',
            '4. videoUrl debe ser una URL válida (YouTube, Vimeo, etc.)',
            '5. theoryContent puede incluir HTML básico (párrafos, listas, negritas)',
            '6. videoDescription es una descripción breve del contenido del video',
            '',
            'CAMPOS OBLIGATORIOS: title, description, estimatedTimeMinutes, videoUrl, videoDescription, theoryContent'
          ]
          headers = ['_ES_EJEMPLO', 
                     'title *', 'description *', 'estimatedTimeMinutes *', 
                     'videoUrl *', 'videoDescription *', 'theoryContent *']
          examples = [
            ['SI', 'Operaciones con polinomios', 'Aprende a sumar, restar y multiplicar polinomios paso a paso', '45', 'https://youtu.be/abc123', 'Video introductorio de 10 minutos sobre operaciones básicas', '<p>Los polinomios son expresiones algebraicas que contienen términos con variables y coeficientes. En esta lección aprenderás las operaciones fundamentales.</p><p><strong>Suma de polinomios:</strong> Se suman los términos semejantes.</p>'],
            ['SI', 'Ecuaciones de primer grado', 'Resolución de ecuaciones lineales con una incógnita', '30', 'https://youtu.be/def456', 'Tutorial paso a paso de 15 minutos', '<p>Una ecuación de primer grado tiene la forma ax + b = 0 donde a y b son números reales y a ≠ 0.</p><p>Para resolverla, despejamos la incógnita x.</p>'],
            ['SI', 'Fracciones equivalentes', 'Identificación y creación de fracciones equivalentes', '25', 'https://youtu.be/ghi789', 'Explicación visual de fracciones', '<p>Dos fracciones son equivalentes si representan la misma cantidad. Por ejemplo, 1/2 = 2/4 = 3/6.</p>']
          ]
          break
        }
        case 'questions': {
          instructions = [
            'INSTRUCCIONES:',
            '1. Los campos marcados con * son OBLIGATORIOS',
            '2. Complete solo las filas de datos (las filas de ejemplo tienen _ES_EJEMPLO = SI)',
            '3. questionType debe ser: multiple_choice, true_false, fill_blank, matching o essay',
            '4. correctOption debe ser: A, B, C o D (según el tipo de pregunta)',
            '5. difficultyLevel debe ser: facil, intermedio o dificil',
            '6. Para imágenes, ingrese la URL completa (ej: https://ejemplo.com/imagen.jpg)',
            '',
            'REQUISITOS POR TIPO:',
            '- multiple_choice: Requiere optionA, optionB, optionC, optionD y correctOption',
            '- true_false: Requiere optionA (Verdadero), optionB (Falso) y correctOption (A o B)',
            '- fill_blank: Requiere optionA (correcta), optionB-D (distractores) y correctOption',
            '- matching: Requiere optionA-D (formato "izquierda|derecha") y correctOption',
            '- essay: Solo requiere questionText, no necesita opciones',
            '',
            'CAMPOS OBLIGATORIOS (*): questionText, questionType',
            'CAMPOS OPCIONALES: questionImage, optionAImage, optionBImage, optionCImage, optionDImage, explanationImage'
          ]
          headers = ['_ES_EJEMPLO', 'questionText *', 'questionType *', 'optionA', 'optionB', 'optionC', 'optionD', 
                     'correctOption', 'explanation', 'difficultyLevel',
                     'questionImage', 'optionAImage', 'optionBImage', 'optionCImage', 'optionDImage', 'explanationImage']
          examples = [
            ['SI', '¿Cuál es el resultado de (x+2)(x+3)?', 'multiple_choice', 'x² + 5x + 6', 'x² + 6x + 5', 'x² + 3x + 2', 'x² + 5x + 3', 'A', 'Se aplica la propiedad distributiva: (x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6', 'intermedio', '', '', '', '', '', ''],
            ['SI', 'La suma de dos números negativos siempre es negativa', 'true_false', 'Verdadero', 'Falso', '', '', 'A', 'Al sumar dos números negativos, el resultado es siempre negativo', 'facil', '', '', '', '', '', ''],
            ['SI', 'Completa: El resultado de 5 + 3 es _____', 'fill_blank', '8', '7', '9', '6', 'A', 'La suma de 5 + 3 es igual a 8', 'facil', '', '', '', '', '', ''],
            ['SI', 'Empareja cada concepto con su definición', 'matching', 'Fotosíntesis|Proceso por el cual las plantas convierten luz en energía', 'Mitosis|División celular que produce células idénticas', 'ADN|Molécula que contiene la información genética', 'ARN|Molécula que transporta información del ADN', 'A', 'Cada concepto debe emparejarse con su definición correcta', 'intermedio', 'https://ejemplo.com/conceptos.jpg', '', '', '', '', ''],
            ['SI', 'Explica en tus propias palabras qué es la fotosíntesis y por qué es importante para la vida en la Tierra', 'essay', '', '', '', '', '', 'Esta pregunta permite al estudiante demostrar su comprensión del concepto', 'dificil', 'https://ejemplo.com/fotosintesis.jpg', '', '', '', '', 'https://ejemplo.com/explicacion.jpg']
          ]
          break
        }
      }
      
      // Crear hoja de instrucciones
      if (instructions.length > 0) {
        const wsInstructions = XLSX.utils.aoa_to_sheet(instructions.map(inst => [inst]))
        wsInstructions['!cols'] = [{ wch: 100 }]
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')
      }
      
      // Crear hoja de datos
      const dataRows = [headers, ...examples]
      const wsData = XLSX.utils.aoa_to_sheet(dataRows)
      
      // Ajustar anchos de columnas
      const colWidths = headers.map((header, idx) => {
        if (header === '_ES_EJEMPLO') {
          return { wch: 15 }
        }
        // Calcular ancho basado en header y datos de ejemplo
        const headerLength = header.length
        const maxDataLength = Math.max(...examples.map(ex => String(ex[idx] || '').length))
        const maxLength = Math.max(headerLength, maxDataLength)
        return { wch: Math.min(Math.max(maxLength + 2, 12), 50) }
      })
      wsData['!cols'] = colWidths
      
      // Congelar primera fila (headers)
      wsData['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }
      
      XLSX.utils.book_append_sheet(wb, wsData, 'Datos')
      
      // Generar archivo Excel
      XLSX.writeFile(wb, `${type}_plantilla.xlsx`)
      
    } catch (error) {
      console.error('Error generando Excel:', error)
      // Fallback a CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_plantilla.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Centro de Carga Masiva
          </CardTitle>
          <CardDescription>
            Sube archivos CSV o Excel para importar información de forma masiva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paso 1: Seleccionar tipo */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Paso 1: Selecciona qué quieres subir
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {importTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setFile(null)
                    setPreview(null)
                    setResult(null)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded ${
                      selectedType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {type.icon}
                    </div>
                    <span className="font-semibold text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Paso 2: Zona de drag & drop */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Paso 2: Arrastra tu archivo aquí o haz clic para seleccionar
            </Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleFileSelect(selectedFile)
                }}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreview(null)
                      setResult(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="font-semibold text-gray-700">
                      Arrastra archivos CSV o Excel aquí
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      o haz clic para seleccionar
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span>Formatos soportados: .csv, .xlsx, .xls</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vista previa */}
          {preview && (
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Vista Previa del Archivo
              </Label>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                        <div className="text-xs text-blue-700">Filas encontradas</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{preview.headers.length}</div>
                        <div className="text-xs text-green-700">Columnas detectadas</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {preview.errors.length === 0 ? '✓' : '⚠'}
                        </div>
                        <div className="text-xs text-purple-700">Estado</div>
                      </div>
                    </div>

                    {/* Errores y advertencias */}
                    {preview.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-1">Errores encontrados:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {preview.errors.map((error, idx) => (
                              <li key={idx} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {preview.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-1">Advertencias:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {preview.warnings.map((warning, idx) => (
                              <li key={idx} className="text-sm">{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Tabla de preview */}
                    {preview.rows.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              {preview.headers.map((header, idx) => (
                                <th
                                  key={idx}
                                  className={`border border-gray-300 px-3 py-2 text-left font-semibold ${
                                    selectedConfig.requiredFields.some(
                                      rf => rf.toLowerCase() === header.toLowerCase()
                                    )
                                      ? 'bg-red-50 text-red-700'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {header}
                                  {selectedConfig.requiredFields.some(
                                    rf => rf.toLowerCase() === header.toLowerCase()
                                  ) && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Requerido
                                    </Badge>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-gray-50">
                                {preview.headers.map((_, colIdx) => (
                                  <td
                                    key={colIdx}
                                    className="border border-gray-300 px-3 py-2 text-gray-700"
                                  >
                                    {row[colIdx] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {preview.totalRows > 10 && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Mostrando primeras 10 filas de {preview.totalRows} totales
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Plantilla Excel
              </Button>
              <span className="text-xs text-gray-500">(Formato visual con instrucciones)</span>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading || (preview?.errors.length ?? 0) > 0}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir Archivo
                </>
              )}
            </Button>
          </div>

          {/* Progreso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Resultados */}
          {result && (
            <Card className={result.errors.length > 0 ? 'border-red-200' : 'border-green-200'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Resultado de la Importación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{result.created}</div>
                    <div className="text-sm text-green-700">Registros creados/actualizados</div>
                  </div>
                  {result.updated !== undefined && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                      <div className="text-sm text-blue-700">Registros actualizados</div>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                      <div className="text-sm text-red-700">Errores encontrados</div>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Errores por fila:</div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {result.errors.slice(0, 20).map((error, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">Fila {error.row}:</span> {error.message}
                          </div>
                        ))}
                        {result.errors.length > 20 && (
                          <div className="text-sm text-gray-500 italic">
                            ... y {result.errors.length - 20} errores más
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {result.errors.length === 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ¡Importación completada exitosamente! Todos los registros se procesaron correctamente.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Campos requeridos para {selectedConfig.label}:</strong>{' '}
              {selectedConfig.requiredFields.join(', ')}
            </p>
            {selectedConfig.optionalFields.length > 0 && (
              <p>
                <strong>Campos opcionales:</strong>{' '}
                {selectedConfig.optionalFields.slice(0, 10).join(', ')}
                {selectedConfig.optionalFields.length > 10 && ' ...'}
              </p>
            )}
            <p className="mt-2">
              💡 <strong>Tip:</strong> Usa la plantilla descargable como base. Asegúrate de que el archivo esté en formato UTF-8.
            </p>
            {selectedType === 'lessons' && (
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Nota:</strong> Las lecciones pueden crearse sin asociarlas a módulos. 
                  Podrás asociarlas después desde la interfaz de administración.
                </AlertDescription>
              </Alert>
            )}
            {selectedType === 'questions' && (
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Tipos de preguntas soportados:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li><strong>multiple_choice:</strong> Requiere optionA, optionB, optionC, optionD y correctOption (A, B, C o D)</li>
                    <li><strong>true_false:</strong> Requiere optionA (Verdadero), optionB (Falso) y correctOption (A o B)</li>
                    <li><strong>fill_blank:</strong> Requiere optionA (correcta), optionB, optionC, optionD (distractores) y correctOption (A, B, C o D)</li>
                    <li><strong>matching:</strong> Requiere optionA, optionB, optionC, optionD (formato "izquierda|derecha") y correctOption</li>
                    <li><strong>essay:</strong> Solo requiere questionText, no necesita opciones</li>
                  </ul>
                  <p className="mt-2 text-sm">Las preguntas pueden crearse sin asociarlas a lecciones. Podrás asociarlas después desde la interfaz.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

