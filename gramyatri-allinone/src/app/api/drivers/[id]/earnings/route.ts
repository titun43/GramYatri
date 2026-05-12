import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const period = req.nextUrl.searchParams.get('period') || 'today'

    const driver = await db.driver.findUnique({ where: { id } })
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let startDate: Date
    switch (period) {
      case 'week':
        startDate = weekStart
        break
      case 'month':
        startDate = monthStart
        break
      default:
        startDate = todayStart
    }

    // Get completed rides for the period
    const rides = await db.ride.findMany({
      where: {
        driverId: id,
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalEarnings = rides.reduce((sum, r) => sum + r.fare - r.discount, 0)
    const totalRides = rides.length

    // Build daily breakdown for the chart
    const breakdownMap = new Map<string, number>()
    rides.forEach((ride) => {
      const dateKey = new Date(ride.createdAt).toISOString().split('T')[0]
      breakdownMap.set(dateKey, (breakdownMap.get(dateKey) || 0) + ride.fare - ride.discount)
    })

    // Fill in missing days for the period
    const breakdown: Array<{ date: string; amount: number }> = []
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (days - 1 - i))
      const key = d.toISOString().split('T')[0]
      breakdown.push({
        date: key,
        amount: breakdownMap.get(key) || 0,
      })
    }

    return NextResponse.json({
      success: true,
      earnings: {
        total: Math.round(totalEarnings * 100) / 100,
        rides: totalRides,
        breakdown,
      },
    })
  } catch (error) {
    console.error('Driver earnings error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get earnings' }, { status: 500 })
  }
}
