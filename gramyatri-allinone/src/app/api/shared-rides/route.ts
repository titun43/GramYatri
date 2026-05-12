import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const routeId = req.nextUrl.searchParams.get('routeId')
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (routeId) where.routeId = routeId
    if (status) where.status = status

    const sharedRides = await db.sharedRide.findMany({
      where,
      include: {
        route: true,
        passengers: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, sharedRides })
  } catch (error) {
    console.error('Get shared rides error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get shared rides' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { routeId, driverId, departureTime, availableSeats, totalSeats } = body

    if (!routeId || !driverId) {
      return NextResponse.json(
        { success: false, message: 'routeId and driverId are required' },
        { status: 400 }
      )
    }

    const sharedRide = await db.sharedRide.create({
      data: {
        routeId,
        driverId,
        departureTime: departureTime ? new Date(departureTime) : new Date(),
        availableSeats: availableSeats ?? 6,
        totalSeats: totalSeats ?? 6,
      },
      include: {
        route: true,
        passengers: true,
      },
    })

    return NextResponse.json({ success: true, sharedRide }, { status: 201 })
  } catch (error) {
    console.error('Create shared ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create shared ride' }, { status: 500 })
  }
}
