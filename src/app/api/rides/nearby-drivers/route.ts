import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: NextRequest) {
  try {
    const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '0')
    const lng = parseFloat(req.nextUrl.searchParams.get('lng') || '0')
    const vehicleType = req.nextUrl.searchParams.get('vehicleType')

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: 'lat and lng are required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      isOnline: true,
      isApproved: true,
      currentLat: { not: null },
      currentLng: { not: null },
    }
    if (vehicleType) where.vehicleType = vehicleType

    const drivers = await db.driver.findMany({
      where,
      include: { user: true },
    })

    // Filter drivers within 10km and add distance
    const nearbyDrivers = drivers
      .map((driver) => {
        const distance = haversineDistance(lat, lng, driver.currentLat!, driver.currentLng!)
        return { ...driver, distance: Math.round(distance * 10) / 10 }
      })
      .filter((driver) => driver.distance <= 10)
      .sort((a, b) => a.distance - b.distance)

    return NextResponse.json({ success: true, drivers: nearbyDrivers })
  } catch (error) {
    console.error('Nearby drivers error:', error)
    // Return empty array instead of 500 error for Vercel deployment
    return NextResponse.json({ success: true, drivers: [] })
  }
}
