import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SETTINGS_DIR = path.join(process.cwd(), 'data')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'site-settings.json')

async function ensureDefaults() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true })
    await fs.access(SETTINGS_FILE)
  } catch {
    const defaultData = {
      homepage: {
        showInstitutionsCarousel: true,
        institutions: [] as Array<{ id: string; name: string; logoUrl: string; website?: string }>,
      },
    }
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultData, null, 2), 'utf-8')
  }
}

export async function GET() {
  try {
    await ensureDefaults()
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json(data.homepage || { showInstitutionsCarousel: true, institutions: [] })
  } catch (e) {
    console.error('GET /api/settings/homepage', e)
    return NextResponse.json({ error: 'Error leyendo configuración' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDefaults()
    const body = await request.json()
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    data.homepage = {
      showInstitutionsCarousel: !!body.showInstitutionsCarousel,
      institutions: Array.isArray(body.institutions) ? body.institutions : [],
    }
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PUT /api/settings/homepage', e)
    return NextResponse.json({ error: 'Error guardando configuración' }, { status: 500 })
  }
}


