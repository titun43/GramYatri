import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sharedRide = await db.sharedRide.findUnique({
      where: { id },
      include: {
        route: true,
        passengers: { include: { user: true } },
      },
    })

    if (!sharedRide) {
      return NextResponse.json({ success: false, message: 'Shared ride not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, sharedRide })
  } catch (error) {
    console.error('Get shared ride error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get shared ride' }, { status: 500 })
  }
}
