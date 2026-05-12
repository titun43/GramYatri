import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { isSuspended, suspendReason } = await req.json()

    if (isSuspended === undefined) {
      return NextResponse.json(
        { success: false, message: 'isSuspended is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { isSuspended }
    if (isSuspended && suspendReason) {
      updateData.suspendReason = suspendReason
    }
    if (!isSuspended) {
      updateData.suspendReason = null
    }

    const driver = await db.driver.update({
      where: { id },
      data: updateData,
      include: { user: true },
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Suspend/unsuspend driver error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update driver suspension status' },
      { status: 500 }
    )
  }
}
