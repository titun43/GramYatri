import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const isActive = req.nextUrl.searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    const routes = await db.route.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, routes })
  } catch (error) {
    console.error('Get routes error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get routes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, fromLocation, toLocation, stops, fare, distance, duration } = body

    if (!name || !fromLocation || !toLocation) {
      return NextResponse.json(
        { success: false, message: 'name, fromLocation, and toLocation are required' },
        { status: 400 }
      )
    }

    const route = await db.route.create({
      data: {
        name,
        fromLocation,
        toLocation,
        stops: stops ?? '[]',
        fare: fare ?? 0,
        distance: distance ?? 0,
        duration: duration ?? 0,
      },
    })

    return NextResponse.json({ success: true, route }, { status: 201 })
  } catch (error) {
    console.error('Create route error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create route' }, { status: 500 })
  }
}
