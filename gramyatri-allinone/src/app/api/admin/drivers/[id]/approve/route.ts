import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { isApproved } = await req.json()

    if (isApproved === undefined) {
      return NextResponse.json(
        { success: false, message: 'isApproved is required' },
        { status: 400 }
      )
    }

    const driver = await db.driver.update({
      where: { id },
      data: { isApproved },
      include: { user: true },
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Approve/reject driver error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update driver approval' }, { status: 500 })
  }
}
