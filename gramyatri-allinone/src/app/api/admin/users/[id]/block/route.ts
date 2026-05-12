import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { isBlocked } = await req.json()

    if (isBlocked === undefined) {
      return NextResponse.json(
        { success: false, message: 'isBlocked is required' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id },
      data: { isBlocked },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Block/unblock user error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 })
  }
}
