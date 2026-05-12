import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET - Returns all settings as key-value pairs
export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      orderBy: { key: 'asc' },
    })

    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ success: true, settings: settingsMap, raw: settings })
  } catch (error) {
    console.error('Get admin settings error:', error)
    // Return empty settings instead of 500 error for Vercel deployment
    return NextResponse.json({ success: true, settings: {}, raw: [] })
  }
}

// POST - Create a new setting
export async function POST(req: NextRequest) {
  try {
    const { key, value, description } = await req.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'key and value are required' },
        { status: 400 }
      )
    }

    // Check if setting already exists
    const existing = await db.appSetting.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Setting already exists. Use PATCH to update.' },
        { status: 409 }
      )
    }

    const setting = await db.appSetting.create({
      data: {
        key,
        value: String(value),
        description: description ?? null,
      },
    })

    return NextResponse.json({ success: true, setting }, { status: 201 })
  } catch (error) {
    console.error('Create admin setting error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create setting' },
      { status: 500 }
    )
  }
}

// PATCH - Upsert multiple settings
export async function PATCH(req: NextRequest) {
  try {
    const { settings } = await req.json()

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'settings array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const s of settings) {
      if (!s.key || s.value === undefined) continue

      const setting = await db.appSetting.upsert({
        where: { key: s.key },
        update: {
          value: String(s.value),
          ...(s.description !== undefined ? { description: s.description } : {}),
        },
        create: {
          key: s.key,
          value: String(s.value),
          description: s.description ?? null,
        },
      })

      results.push(setting)
    }

    return NextResponse.json({ success: true, settings: results })
  } catch (error) {
    console.error('Upsert admin settings error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
