import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const driverId = req.nextUrl.searchParams.get('driverId')
    const rideId = req.nextUrl.searchParams.get('rideId')

    const where: Record<string, unknown> = {}
    if (driverId) where.toDriverId = driverId
    if (rideId) where.rideId = rideId

    const ratings = await db.rating.findMany({
      where,
      include: {
        user: true,
        ride: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, ratings })
  } catch (error) {
    console.error('Get ratings error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get ratings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rideId, fromUserId, rating, review } = await req.json()

    if (!rideId || !fromUserId || !rating) {
      return NextResponse.json(
        { success: false, message: 'rideId, fromUserId, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Get ride to find the driver
    const ride = await db.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    })

    if (!ride) {
      return NextResponse.json({ success: false, message: 'Ride not found' }, { status: 404 })
    }

    const toUserId = ride.driverId ? ride.userId : ride.driverId
    const toDriverId = ride.driverId ?? null

    const ratingRecord = await db.rating.create({
      data: {
        rideId,
        fromUserId,
        toUserId: toUserId ?? fromUserId,
        toDriverId,
        rating,
        review: review ?? null,
      },
    })

    // Update driver's average rating
    if (toDriverId) {
      const driverRatings = await db.rating.findMany({
        where: { toDriverId },
      })
      const avgRating =
        driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length
      await db.driver.update({
        where: { id: toDriverId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      })
    }

    return NextResponse.json({ success: true, rating: ratingRecord }, { status: 201 })
  } catch (error) {
    console.error('Create rating error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create rating' }, { status: 500 })
  }
}
