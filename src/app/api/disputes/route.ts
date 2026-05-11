import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const disputes = await db.dispute.findMany({
      where,
      include: { user: true, ride: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, disputes })
  } catch (error) {
    console.error('Get disputes error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get disputes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rideId, userId, driverId, reason } = await req.json()

    if (!rideId || !userId || !reason) {
      return NextResponse.json(
        { success: false, message: 'rideId, userId, and reason are required' },
        { status: 400 }
      )
    }

    const dispute = await db.dispute.create({
      data: {
        rideId,
        userId,
        driverId: driverId ?? null,
        reason,
      },
      include: { user: true, ride: true },
    })

    return NextResponse.json({ success: true, dispute }, { status: 201 })
  } catch (error) {
    console.error('Create dispute error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create dispute' }, { status: 500 })
  }
}
