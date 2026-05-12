import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const setting = await db.appSetting.findUnique({
      where: { key: 'commission_percentage' },
    })

    return NextResponse.json({
      success: true,
      commission: {
        percentage: setting ? parseFloat(setting.value) : 15,
        description: setting?.description,
      },
    })
  } catch (error) {
    console.error('Get commission error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get commission' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { percentage } = await req.json()

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, message: 'Valid percentage (0-100) is required' },
        { status: 400 }
      )
    }

    const setting = await db.appSetting.upsert({
      where: { key: 'commission_percentage' },
      update: { value: String(percentage) },
      create: {
        key: 'commission_percentage',
        value: String(percentage),
        description: 'Default commission percentage for drivers',
      },
    })

    return NextResponse.json({
      success: true,
      commission: {
        percentage: parseFloat(setting.value),
      },
    })
  } catch (error) {
    console.error('Update commission error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update commission' }, { status: 500 })
  }
}
