import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, resolution } = await req.json()

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (resolution !== undefined) updateData.resolution = resolution

    const dispute = await db.dispute.update({
      where: { id },
      data: updateData,
      include: { user: true, ride: true },
    })

    return NextResponse.json({ success: true, dispute })
  } catch (error) {
    console.error('Update dispute error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update dispute' }, { status: 500 })
  }
}
