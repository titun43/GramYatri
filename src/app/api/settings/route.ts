import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { key, value } = await req.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'key and value are required' },
        { status: 400 }
      )
    }

    const setting = await db.appSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update setting' }, { status: 500 })
  }
}
