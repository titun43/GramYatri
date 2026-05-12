import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const isApproved = req.nextUrl.searchParams.get('isApproved')
    const isOnline = req.nextUrl.searchParams.get('isOnline')
    const vehicleType = req.nextUrl.searchParams.get('vehicleType')

    const where: Record<string, unknown> = {}
    if (isApproved !== null) where.isApproved = isApproved === 'true'
    if (isOnline !== null) where.isOnline = isOnline === 'true'
    if (vehicleType) where.vehicleType = vehicleType

    const drivers = await db.driver.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, drivers })
  } catch (error) {
    console.error('Get drivers error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get drivers' }, { status: 500 })
  }
}
