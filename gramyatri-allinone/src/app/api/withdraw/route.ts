import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const driverId = req.nextUrl.searchParams.get('driverId')
    const status = req.nextUrl.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (driverId) where.driverId = driverId
    if (status) where.status = status

    const requests = await db.withdrawRequest.findMany({
      where,
      include: { driver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error('Get withdraw requests error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get withdraw requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { driverId, amount, upiId } = await req.json()

    if (!driverId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'driverId and a positive amount are required' },
        { status: 400 }
      )
    }

    // Check driver's wallet balance
    const driver = await db.driver.findUnique({ where: { id: driverId } })
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    if (driver.totalEarnings < amount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient earnings balance' },
        { status: 400 }
      )
    }

    const request = await db.withdrawRequest.create({
      data: {
        driverId,
        amount,
        upiId: upiId ?? null,
      },
      include: { driver: { include: { user: true } } },
    })

    return NextResponse.json({ success: true, request }, { status: 201 })
  } catch (error) {
    console.error('Create withdraw request error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create withdraw request' }, { status: 500 })
  }
}
