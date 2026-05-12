import { NextRequest, NextResponse } from 'next/server'

// Haversine formula for straight-line distance
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
    const { searchParams } = new URL(req.url)
    const lat1 = searchParams.get('lat1')
    const lng1 = searchParams.get('lng1')
    const lat2 = searchParams.get('lat2')
    const lng2 = searchParams.get('lng2')

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return NextResponse.json(
        { success: false, error: 'All coordinates (lat1, lng1, lat2, lng2) are required' },
        { status: 400 }
      )
    }

    const pLat1 = parseFloat(lat1)
    const pLng1 = parseFloat(lng1)
    const pLat2 = parseFloat(lat2)
    const pLng2 = parseFloat(lng2)

    // Calculate straight-line distance using Haversine
    const straightDistance = haversineDistance(pLat1, pLng1, pLat2, pLng2)

    // Try OSRM for road distance
    let roadDistance = straightDistance * 1.3 // Default road factor
    let roadDuration = (roadDistance / 30) * 60 // Default: 30 km/h average
    let usedOSRM = false

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLng1},${pLat1};${pLng2},${pLat2}?overview=false`
      const osrmResponse = await fetch(osrmUrl, {
        headers: {
          'User-Agent': 'GramYatri/1.0',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (osrmResponse.ok) {
        const osrmData = await osrmResponse.json()
        if (osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0]
          roadDistance = route.distance / 1000
          roadDuration = route.duration / 60
          usedOSRM = true
        }
      }
    } catch {
      // OSRM failed, use Haversine with road factor
    }

    return NextResponse.json({
      success: true,
      distance: {
        straightKm: Math.round(straightDistance * 10) / 10,
        roadKm: Math.round(roadDistance * 10) / 10,
        durationMin: Math.round(roadDuration),
        source: usedOSRM ? 'osrm' : 'haversine',
      },
    })
  } catch (error) {
    console.error('Route calculation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate route' },
      { status: 500 }
    )
  }
}
