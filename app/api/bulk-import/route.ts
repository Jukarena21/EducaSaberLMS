import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ImportType = 'students' | 'schools' | 'lessons' | 'questions'

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = splitCsvLine(lines[0]).map(h => h.trim())
  const rows: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? '').trim()
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

    const text = await file.text()
    const rows = parseCSV(text)

    const errors: Array<{ row: number; message: string }>=[]
    let created = 0

    if (type === 'students') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        try {
          const email = r.email
          const firstName = r.firstName
          const lastName = r.lastName
          if (!email || !firstName || !lastName) throw new Error('email, firstName y lastName son requeridos')
          await prisma.user.upsert({
            where: { email },
            update: {
              firstName, lastName, role: 'student',
              // Información personal
              dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : undefined,
              gender: r.gender || undefined,
              documentType: r.documentType || undefined,
              documentNumber: r.documentNumber || undefined,
              address: r.address || undefined,
              neighborhood: r.neighborhood || undefined,
              city: r.city || undefined,
              socioeconomicStratum: parseIntOrU(r.socioeconomicStratum) as any,
              housingType: r.housingType || undefined,
              // Educativa
              schoolId: r.schoolId || undefined,
              schoolEntryYear: parseIntOrU(r.schoolEntryYear) as any,
              academicAverage: parseFloatOrU(r.academicAverage) as any,
              areasOfDifficulty: r.areasOfDifficulty || undefined,
              areasOfStrength: r.areasOfStrength || undefined,
              repetitionHistory: parseBool(r.repetitionHistory),
              schoolSchedule: r.schoolSchedule || undefined,
              // Condiciones
              disabilities: r.disabilities || undefined,
              specialEducationalNeeds: r.specialEducationalNeeds || undefined,
              medicalConditions: r.medicalConditions || undefined,
              homeTechnologyAccess: parseBool(r.homeTechnologyAccess),
              homeInternetAccess: parseBool(r.homeInternetAccess),
            },
            create: {
              email, passwordHash: 'changeme', role: 'student', firstName, lastName,
              dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : undefined,
              gender: r.gender || undefined,
              documentType: r.documentType || undefined,
              documentNumber: r.documentNumber || undefined,
              address: r.address || undefined,
              neighborhood: r.neighborhood || undefined,
              city: r.city || undefined,
              socioeconomicStratum: parseIntOrU(r.socioeconomicStratum) as any,
              housingType: r.housingType || undefined,
              schoolId: r.schoolId || undefined,
              schoolEntryYear: parseIntOrU(r.schoolEntryYear) as any,
              academicAverage: parseFloatOrU(r.academicAverage) as any,
              areasOfDifficulty: r.areasOfDifficulty || undefined,
              areasOfStrength: r.areasOfStrength || undefined,
              repetitionHistory: parseBool(r.repetitionHistory),
              schoolSchedule: r.schoolSchedule || undefined,
              disabilities: r.disabilities || undefined,
              specialEducationalNeeds: r.specialEducationalNeeds || undefined,
              medicalConditions: r.medicalConditions || undefined,
              homeTechnologyAccess: parseBool(r.homeTechnologyAccess),
              homeInternetAccess: parseBool(r.homeInternetAccess),
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
          if (!r.name || !r.city) throw new Error('name y city son requeridos')
          await prisma.school.upsert({
            where: { daneCode: r.daneCode || `no-code-${r.name}-${r.city}` },
            update: { name: r.name, city: r.city, neighborhood: r.neighborhood || undefined, address: r.address || undefined, institutionType: r.institutionType || 'otro', academicCalendar: r.academicCalendar || 'diurno', contactEmail: r.contactEmail || undefined, contactPhone: r.contactPhone || undefined, website: r.website || undefined },
            create: { name: r.name, city: r.city, neighborhood: r.neighborhood || undefined, address: r.address || undefined, institutionType: r.institutionType || 'otro', academicCalendar: r.academicCalendar || 'diurno', daneCode: r.daneCode || undefined, contactEmail: r.contactEmail || undefined, contactPhone: r.contactPhone || undefined, website: r.website || undefined }
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
          if (!r.title || !r.description || !r.estimatedTimeMinutes || !r.theoryContent) throw new Error('title, description, estimatedTimeMinutes, theoryContent requeridos')
          await prisma.lesson.create({
            data: {
              title: r.title,
              description: r.description,
              estimatedTimeMinutes: Number(r.estimatedTimeMinutes) || 0,
              videoUrl: r.videoUrl || null,
              videoDescription: r.videoDescription || null,
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
          if (!r.questionText || !r.optionA || !r.optionB || !r.optionC || !r.optionD || !r.correctOption) throw new Error('questionText, options A-D y correctOption requeridos')
          await prisma.lessonQuestion.create({
            data: {
              lessonId: r.lessonId || null,
              questionText: r.questionText,
              questionImage: r.questionImage || null,
              questionType: r.questionType || 'multiple_choice',
              optionA: r.optionA,
              optionB: r.optionB,
              optionC: r.optionC,
              optionD: r.optionD,
              optionAImage: r.optionAImage || null,
              optionBImage: r.optionBImage || null,
              optionCImage: r.optionCImage || null,
              optionDImage: r.optionDImage || null,
              correctOption: r.correctOption as any,
              explanation: r.explanation || null,
              explanationImage: r.explanationImage || null,
              orderIndex: Number(r.orderIndex) || 0,
              difficultyLevel: r.difficultyLevel || 'medio',
              timeLimit: r.timeLimit ? Number(r.timeLimit) : null,
            }
          })
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


