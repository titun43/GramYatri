import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const alerts = await db.emergencyAlert.findMany({
      where,
      include: { user: true, ride: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, alerts })
  } catch (error) {
    console.error('Get emergency alerts error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get emergency alerts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, rideId, lat, lng, message } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      )
    }

    const alert = await db.emergencyAlert.create({
      data: {
        userId,
        rideId: rideId ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        message: message ?? null,
      },
      include: { user: true, ride: true },
    })

    return NextResponse.json({ success: true, alert }, { status: 201 })
  } catch (error) {
    console.error('Create emergency alert error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create emergency alert' }, { status: 500 })
  }
}
