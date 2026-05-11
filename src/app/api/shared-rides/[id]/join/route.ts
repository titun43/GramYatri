import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, pickupStop, dropStop, fare } = await req.json()

    if (!userId || !pickupStop || !dropStop) {
      return NextResponse.json(
        { success: false, message: 'userId, pickupStop, and dropStop are required' },
        { status: 400 }
      )
    }

    const sharedRide = await db.sharedRide.findUnique({
      where: { id },
    })

    if (!sharedRide) {
      return NextResponse.json({ success: false, message: 'Shared ride not found' }, { status: 404 })
    }

    if (sharedRide.availableSeats <= 0) {
      return NextResponse.json({ success: false, message: 'No seats available' }, { status: 400 })
    }

    if (sharedRide.status !== 'SCHEDULED' && sharedRide.status !== 'IN_PROGRESS') {
      return NextResponse.json({ success: false, message: 'Shared ride is not available for joining' }, { status: 400 })
    }

    // Check if user already joined
    const existingPassenger = await db.sharedRidePassenger.findFirst({
      where: { sharedRideId: id, userId, status: 'CONFIRMED' },
    })

    if (existingPassenger) {
      return NextResponse.json({ success: false, message: 'Already joined this shared ride' }, { status: 400 })
    }

    // Create passenger and update available seats
    const passenger = await db.sharedRidePassenger.create({
      data: {
        sharedRideId: id,
        userId,
        pickupStop,
        dropStop,
        fare: fare ?? 0,
      },
      include: { user: true },
    })

    await db.sharedRide.update({
      where: { id },
      data: { availableSeats: sharedRide.availableSeats - 1 },
    })

    return NextResponse.json({ success: true, passenger }, { status: 201 })
  } catch (error) {
    console.error('Join shared ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to join shared ride' }, { status: 500 })
  }
}
