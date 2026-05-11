import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await req.json()

    if (!status || !['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Valid status (APPROVED, REJECTED, COMPLETED) is required' },
        { status: 400 }
      )
    }

    const request = await db.withdrawRequest.update({
      where: { id },
      data: { status },
      include: { driver: { include: { user: true } } },
    })

    // If completed, deduct from driver earnings
    if (status === 'COMPLETED') {
      const driver = await db.driver.findUnique({ where: { id: request.driverId } })
      if (driver) {
        await db.driver.update({
          where: { id: request.driverId },
          data: { totalEarnings: Math.max(0, driver.totalEarnings - request.amount) },
        })
      }
    }

    return NextResponse.json({ success: true, request })
  } catch (error) {
    console.error('Update withdraw request error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update withdraw request' }, { status: 500 })
  }
}
