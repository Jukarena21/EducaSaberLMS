import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'

type ImportType = 'students' | 'schools' | 'lessons' | 'questions'

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  
  // Encontrar la fila de headers (buscar "=== INICIO DE DATOS ===" o la primera fila que no sea instrucción)
  let headerIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase()
    if (line.includes('=== INICIO DE DATOS ===') || line.includes('INICIO DE DATOS')) {
      headerIndex = i + 1
      break
    }
    // Si la línea parece ser headers (tiene varias comas y no empieza con "INSTRUCCIONES" o es muy corta)
    if (!line.startsWith('INSTRUCCIONES') && !line.startsWith('CAMPOS') && !line.startsWith('REQUISITOS') && 
        line.includes(',') && line.split(',').length > 2) {
      headerIndex = i
      break
    }
  }
  
  if (headerIndex >= lines.length) return []
  
  // Extraer headers y limpiar el asterisco (*) si existe, normalizar a minúsculas
  const headerLine = splitCsvLine(lines[headerIndex])
  const headers = headerLine.map(h => h.trim().replace(/\s*\*\s*$/, '').trim().toLowerCase())
  
  const rows: Array<Record<string, string>> = []
  const esEjemploIndex = headers.indexOf('_es_ejemplo')
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    // Ignorar líneas vacías o que sean instrucciones
    if (!line || line.startsWith('INSTRUCCIONES') || line.startsWith('CAMPOS') || 
        line.startsWith('REQUISITOS') || line.startsWith('===') || line.startsWith('1.') || 
        line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || 
        line.startsWith('5.') || line.startsWith('6.') || line.startsWith('-')) {
      continue
    }
    
    const cols = splitCsvLine(line)
    
    // Verificar si es fila de ejemplo (columna _es_ejemplo)
    if (esEjemploIndex >= 0) {
      const esEjemplo = (cols[esEjemploIndex] || '').trim().toUpperCase()
      if (esEjemplo === 'SI' || esEjemplo === 'YES' || esEjemplo === 'TRUE' || esEjemplo === '1') {
        continue // Ignorar fila de ejemplo
      }
    }
    
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      // No incluir _es_ejemplo en los datos finales
      if (h !== '_es_ejemplo') {
        row[h] = (cols[idx] ?? '').trim()
      }
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

function parseBool(v?: string | null) {
  if (!v) return undefined
  const s = v.toString().trim().toLowerCase()
  if (['1','true','sí','si','y','yes'].includes(s)) return true
  if (['0','false','no','n'].includes(s)) return false
  return undefined
}
function parseIntOrU(v?: string | null) { if (!v) return undefined; const n = parseInt(v); return isNaN(n) ? undefined : n }
function parseFloatOrU(v?: string | null) { if (!v) return undefined; const n = parseFloat(v); return isNaN(n) ? undefined : n }

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'teacher_admin' && session.user.role !== 'school_admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const form = await req.formData()
    const type = (form.get('type') as string) as ImportType
    const file = form.get('file') as File | null
    if (!file || !type) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })

    // Detectar tipo de archivo
    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    
    let rows: Array<Record<string, string>> = []
    
    if (isExcel) {
      // Leer archivo Excel
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Buscar hoja de datos (puede llamarse 'Datos' o ser la primera hoja)
      let worksheet = workbook.Sheets['Datos'] || workbook.Sheets[workbook.SheetNames[0]]
      
      if (!worksheet) {
        return NextResponse.json({ error: 'No se encontró hoja de datos en el archivo Excel' }, { status: 400 })
      }
      
      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
      
      if (data.length === 0) {
        return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 })
      }
      
      // Primera fila son los headers
      // Limpiar headers: remover asteriscos y espacios extra, normalizar a minúsculas
      const headers = (data[0] || []).map((h: any) => String(h || '').trim().replace(/\s*\*\s*$/, '').trim().toLowerCase()).filter(Boolean)
      
      // Filtrar filas de ejemplo y convertir a objetos
      for (let i = 1; i < data.length; i++) {
        const row = data[i] || []
        const rowObj: Record<string, string> = {}
        
        // Verificar si es una fila de ejemplo
        const esEjemploCol = headers.indexOf('_es_ejemplo')
        if (esEjemploCol >= 0) {
          const esEjemplo = String(row[esEjemploCol] || '').trim().toUpperCase()
          if (esEjemplo === 'SI' || esEjemplo === 'YES' || esEjemplo === 'TRUE' || esEjemplo === '1') {
            continue // Ignorar fila de ejemplo
          }
        }
        
        // Convertir fila a objeto (normalizado a minúsculas)
        headers.forEach((header, idx) => {
          if (header !== '_es_ejemplo') { // No incluir la columna de ejemplo en los datos
            rowObj[header] = String(row[idx] || '').trim()
          }
        })
        
        // Solo agregar si la fila tiene al menos un valor no vacío
        if (Object.values(rowObj).some(v => v.trim() !== '')) {
          rows.push(rowObj)
        }
      }
    } else {
      // Leer archivo CSV
      const text = await file.text()
      const parsedRows = parseCSV(text)
      
      // Filtrar filas de ejemplo
      rows = parsedRows.filter(row => {
        const esEjemplo = (row['_ES_EJEMPLO'] || '').trim().toUpperCase()
        return esEjemplo !== 'SI' && esEjemplo !== 'YES' && esEjemplo !== 'TRUE' && esEjemplo !== '1'
      }).map(row => {
        // Remover columna _ES_EJEMPLO de los datos
        const { _ES_EJEMPLO, ...rest } = row
        return rest
      })
    }

    const errors: Array<{ row: number; message: string }>=[]
    let created = 0

    if (type === 'students') {
      // Para school_admin, forzar schoolId del admin
      const forcedSchoolId = session.user.role === 'school_admin' && session.user.schoolId 
        ? session.user.schoolId 
        : undefined

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        try {
          const email = (r.email || '').trim()
          const firstName = (r.firstname || '').trim()
          const lastName = (r.lastname || '').trim()
          const documentType = (r.documenttype || '').trim()
          const documentNumber = (r.documentnumber || '').trim()
          const contactPhone = (r.contactphone || '').trim()
          
          // Validar campos requeridos
          if (!email || !firstName || !lastName || !documentType || !documentNumber || !contactPhone) {
            throw new Error('email, firstName, lastName, documentType, documentNumber y contactPhone son requeridos')
          }
          
          // Validar formato de email
          if (!isValidEmail(email)) {
            throw new Error(`El email "${email}" no tiene un formato válido`)
          }
          
          // Validar que documentNumber no esté vacío (se usará como contraseña inicial)
          if (!documentNumber) {
            throw new Error('documentNumber es requerido (se usará como contraseña inicial)')
          }
          
          // Generar hash de contraseña usando el documento como contraseña inicial
          const initialPassword = documentNumber
          const passwordHash = await bcrypt.hash(initialPassword, 12)
          
          // Usar schoolId forzado si es school_admin, sino usar el del CSV
          const finalSchoolId = forcedSchoolId || r.schoolid || undefined
          
          await prisma.user.upsert({
            where: { email },
            update: {
              firstName, lastName, role: 'student',
              // Información personal
              dateOfBirth: r.dateofbirth ? new Date(r.dateofbirth) : undefined,
              gender: r.gender || undefined,
              documentType: documentType || undefined,
              documentNumber: documentNumber || undefined,
              address: r.address || undefined,
              neighborhood: r.neighborhood || undefined,
              city: r.city || undefined,
              contactPhone: contactPhone || undefined,
              socioeconomicStratum: parseIntOrU(r.socioeconomicstratum) as any,
              housingType: r.housingtype || undefined,
              // Educativa
              schoolId: finalSchoolId,
              schoolEntryYear: parseIntOrU(r.schoolentryyear) as any,
              academicAverage: parseFloatOrU(r.academicaverage) as any,
              areasOfDifficulty: r.areasofdifficulty || undefined,
              areasOfStrength: r.areasofstrength || undefined,
              repetitionHistory: parseBool(r.repetitionhistory),
              schoolSchedule: r.schoolschedule || undefined,
              // Condiciones
              disabilities: r.disabilities || undefined,
              specialEducationalNeeds: r.specialeducationalneeds || undefined,
              medicalConditions: r.medicalconditions || undefined,
              homeTechnologyAccess: parseBool(r.hometechnologyaccess),
              homeInternetAccess: parseBool(r.homeinternetaccess),
            },
            create: {
              email, 
              passwordHash, // Hash bcrypt del documento como contraseña inicial
              role: 'student', 
              firstName, 
              lastName,
              dateOfBirth: r.dateofbirth ? new Date(r.dateofbirth) : undefined,
              gender: r.gender || undefined,
              documentType: documentType || undefined,
              documentNumber: documentNumber || undefined,
              address: r.address || undefined,
              neighborhood: r.neighborhood || undefined,
              city: r.city || undefined,
              contactPhone: contactPhone || undefined,
              socioeconomicStratum: parseIntOrU(r.socioeconomicstratum) as any,
              housingType: r.housingtype || undefined,
              schoolId: finalSchoolId,
              schoolEntryYear: parseIntOrU(r.schoolentryyear) as any,
              academicAverage: parseFloatOrU(r.academicaverage) as any,
              areasOfDifficulty: r.areasofdifficulty || undefined,
              areasOfStrength: r.areasofstrength || undefined,
              repetitionHistory: parseBool(r.repetitionhistory),
              schoolSchedule: r.schoolschedule || undefined,
              disabilities: r.disabilities || undefined,
              specialEducationalNeeds: r.specialeducationalneeds || undefined,
              medicalConditions: r.medicalconditions || undefined,
              homeTechnologyAccess: parseBool(r.hometechnologyaccess),
              homeInternetAccess: parseBool(r.homeinternetaccess),
            }
          })
          created++
        } catch (e: any) {
          errors.push({ row: i + 2, message: e.message || 'Error' })
        }
      }
    } else if (type === 'schools') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        try {
          if (!r.name || !r.city || !r.address || !r.contactEmail || !r.contactPhone) {
            throw new Error('name, city, address, contactEmail y contactPhone son requeridos')
          }
          await prisma.school.upsert({
            where: { daneCode: r.daneCode || `no-code-${r.name}-${r.city}` },
            update: { 
              name: r.name, 
              city: r.city, 
              address: r.address,
              neighborhood: r.neighborhood || undefined, 
              institutionType: r.institutionType || 'otro', 
              academicCalendar: r.academicCalendar || 'diurno', 
              contactEmail: r.contactEmail, 
              contactPhone: r.contactPhone, 
              website: r.website || undefined 
            },
            create: { 
              name: r.name, 
              city: r.city, 
              address: r.address,
              neighborhood: r.neighborhood || undefined, 
              institutionType: r.institutionType || 'otro', 
              academicCalendar: r.academicCalendar || 'diurno', 
              daneCode: r.daneCode || undefined, 
              contactEmail: r.contactEmail, 
              contactPhone: r.contactPhone, 
              website: r.website || undefined 
            }
          })
          created++
        } catch (e:any) {
          errors.push({ row: i + 2, message: e.message || 'Error' })
        }
      }
    } else if (type === 'lessons') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        try {
          if (!r.title || !r.description || !r.estimatedTimeMinutes || !r.videoUrl || !r.videoDescription || !r.theoryContent) {
            throw new Error('title, description, estimatedTimeMinutes, videoUrl, videoDescription y theoryContent son requeridos')
          }
          
          const estimatedTime = parseIntOrU(r.estimatedTimeMinutes)
          if (!estimatedTime || estimatedTime <= 0) {
            throw new Error('estimatedTimeMinutes debe ser un número mayor a 0')
          }
          
          await prisma.lesson.create({
            data: {
              title: r.title,
              description: r.description,
              estimatedTimeMinutes: estimatedTime,
              videoUrl: r.videoUrl,
              videoDescription: r.videoDescription,
              theoryContent: r.theoryContent,
              competencyId: r.competencyId || null,
            }
          })
          created++
        } catch (e:any) {
          errors.push({ row: i + 2, message: e.message || 'Error' })
        }
      }
    } else if (type === 'questions') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        try {
          if (!r.questionText || !r.questionType) {
            throw new Error('questionText y questionType son requeridos')
          }
          
          const questionType = r.questionType.trim().toLowerCase()
          const validTypes = ['multiple_choice', 'true_false', 'fill_blank', 'matching', 'essay']
          if (!validTypes.includes(questionType)) {
            throw new Error(`questionType debe ser uno de: ${validTypes.join(', ')}`)
          }

          // Normalizar usage (lesson | exam | both)
          let usage = (r.usage || 'lesson').toString().trim().toLowerCase()
          const validUsage = ['lesson', 'exam', 'both']
          if (!validUsage.includes(usage)) {
            usage = 'lesson'
          }
          
          // orderIndex se asigna automáticamente (las preguntas se muestran aleatoriamente, así que usamos 1)
          const orderIndex = 1
          
          // Validaciones según el tipo de pregunta
          if (questionType === 'essay') {
            // Para ensayo, no se requieren opciones
            await prisma.lessonQuestion.create({
              data: {
                lessonId: r.lessonId || null,
                questionText: r.questionText,
                questionImage: r.questionImage || null,
                questionType: questionType as any,
                usage,
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctOption: '',
                explanation: r.explanation || null,
                explanationImage: r.explanationImage || null,
                orderIndex: orderIndex,
                difficultyLevel: (r.difficultyLevel === 'medio' ? 'intermedio' : r.difficultyLevel) || 'intermedio',
                timeLimit: parseIntOrU(r.timeLimit) || null,
              } as any
            })
          } else if (questionType === 'true_false') {
            // Para verdadero/falso, solo se requieren A y B
            if (!r.optionA || !r.optionB || !r.correctOption) {
              throw new Error('Para preguntas verdadero/falso se requieren optionA, optionB y correctOption')
            }
            const correctOption = r.correctOption.trim().toUpperCase()
            if (!['A', 'B'].includes(correctOption)) {
              throw new Error('Para verdadero/falso, correctOption debe ser A o B')
            }
            await prisma.lessonQuestion.create({
              data: {
                lessonId: r.lessonId || null,
                questionText: r.questionText,
                questionImage: r.questionImage || null,
                questionType: questionType as any,
                usage,
                optionA: r.optionA,
                optionB: r.optionB,
                optionC: '',
                optionD: '',
                optionAImage: r.optionAImage || null,
                optionBImage: r.optionBImage || null,
                optionCImage: r.optionCImage || null,
                optionDImage: r.optionDImage || null,
                correctOption: correctOption as any,
                explanation: r.explanation || null,
                explanationImage: r.explanationImage || null,
                orderIndex: orderIndex,
                difficultyLevel: (r.difficultyLevel === 'medio' ? 'intermedio' : r.difficultyLevel) || 'intermedio',
                timeLimit: parseIntOrU(r.timeLimit) || null,
              } as any
            })
          } else {
            // Para multiple_choice, fill_blank, matching: se requieren todas las opciones
            if (!r.optionA || !r.optionB || !r.optionC || !r.optionD || !r.correctOption) {
              throw new Error('Para este tipo de pregunta se requieren optionA, optionB, optionC, optionD y correctOption')
            }
            const correctOption = r.correctOption.trim().toUpperCase()
            if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
              throw new Error('correctOption debe ser A, B, C o D')
            }
            
            await prisma.lessonQuestion.create({
              data: {
                lessonId: r.lessonId || null,
                questionText: r.questionText,
                questionImage: r.questionImage || null,
                questionType: questionType as any,
                usage,
                optionA: r.optionA,
                optionB: r.optionB,
                optionC: r.optionC,
                optionD: r.optionD,
                optionAImage: r.optionAImage || null,
                optionBImage: r.optionBImage || null,
                optionCImage: r.optionCImage || null,
                optionDImage: r.optionDImage || null,
                correctOption: correctOption as any,
                explanation: r.explanation || null,
                explanationImage: r.explanationImage || null,
                orderIndex: orderIndex,
                difficultyLevel: (r.difficultyLevel === 'medio' ? 'intermedio' : r.difficultyLevel) || 'intermedio',
                timeLimit: parseIntOrU(r.timeLimit) || null,
              } as any
            })
          }
          created++
        } catch (e:any) {
          errors.push({ row: i + 2, message: e.message || 'Error' })
        }
      }
    } else {
      return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 })
    }

    return NextResponse.json({ created, errors })
  } catch (e) {
    console.error('bulk-import', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


