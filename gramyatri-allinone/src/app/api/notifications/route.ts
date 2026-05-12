import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get notifications' }, { status: 500 })
  }
}
