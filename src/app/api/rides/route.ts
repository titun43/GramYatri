import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const driverId = req.nextUrl.searchParams.get('driverId')
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (driverId) where.driverId = driverId
    if (status) where.status = status

    const rides = await db.ride.findMany({
      where,
      include: {
        user: true,
        driver: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, rides })
  } catch (error) {
    console.error('Get rides error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get rides' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      pickupAddress,
      dropAddress,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      fare,
      distance,
      paymentMethod,
      isShared,
      routeId,
      offerCode,
    } = body

    if (!userId || !pickupAddress || !dropAddress) {
      return NextResponse.json(
        { success: false, message: 'userId, pickupAddress, and dropAddress are required' },
        { status: 400 }
      )
    }

    // Calculate discount if offer code provided
    let discount = 0
    if (offerCode) {
      const offer = await db.offer.findFirst({
        where: {
          code: offerCode,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      })
      if (offer) {
        if (fare && fare >= offer.minFare) {
          if (offer.type === 'PERCENTAGE') {
            discount = Math.min((fare * offer.discount) / 100, offer.maxDiscount)
          } else {
            discount = Math.min(offer.discount, offer.maxDiscount)
          }
        }
      }
    }

    const ride = await db.ride.create({
      data: {
        userId,
        pickupAddress,
        dropAddress,
        pickupLat: pickupLat ?? null,
        pickupLng: pickupLng ?? null,
        dropLat: dropLat ?? null,
        dropLng: dropLng ?? null,
        fare: fare ?? 0,
        distance: distance ?? 0,
        paymentMethod: paymentMethod ?? 'CASH',
        isShared: isShared ?? false,
        routeId: routeId ?? null,
        offerCode: offerCode ?? null,
        discount,
      },
      include: {
        user: true,
        driver: { include: { user: true } },
      },
    })

    return NextResponse.json({ success: true, ride }, { status: 201 })
  } catch (error) {
    console.error('Create ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create ride' }, { status: 500 })
  }
}
