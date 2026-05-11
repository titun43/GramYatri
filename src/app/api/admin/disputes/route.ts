import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const disputes = await db.dispute.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropAddress: true,
            fare: true,
            status: true,
            driver: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format with flattened driver info for admin convenience
    const formatted = disputes.map((d) => ({
      id: d.id,
      rideId: d.rideId,
      userId: d.userId,
      userName: d.user.name ?? 'Unknown',
      userPhone: d.user.phone,
      driverId: d.driverId,
      driverName: d.ride.driver?.user.name ?? 'Unknown',
      driverPhone: d.ride.driver?.user.phone ?? 'N/A',
      ridePickup: d.ride.pickupAddress,
      rideDrop: d.ride.dropAddress,
      rideFare: d.ride.fare,
      rideStatus: d.ride.status,
      reason: d.reason,
      status: d.status,
      resolution: d.resolution,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))

    return NextResponse.json({ success: true, disputes: formatted })
  } catch (error) {
    console.error('Get admin disputes error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get disputes' },
      { status: 500 }
    )
  }
}
