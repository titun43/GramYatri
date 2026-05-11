import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, message, type } = await req.json()

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'title and message are required' },
        { status: 400 }
      )
    }

    // Get all users to broadcast to
    const users = await db.user.findMany({
      where: { isBlocked: false },
      select: { id: true },
    })

    // Create notifications for all users
    const notifications = await db.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        message,
        type: type ?? 'INFO',
      })),
    })

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      count: notifications.count,
    })
  } catch (error) {
    console.error('Broadcast notification error:', error)
    return NextResponse.json({ success: false, message: 'Failed to broadcast notification' }, { status: 500 })
  }
}
