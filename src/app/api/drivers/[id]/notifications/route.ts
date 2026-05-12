import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the userId from the driver record
    const driver = await db.driver.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    const notifications = await db.notification.findMany({
      where: { userId: driver.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Get driver notifications error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get notifications' }, { status: 500 })
  }
}
