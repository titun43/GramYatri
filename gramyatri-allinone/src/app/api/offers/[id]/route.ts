import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.title) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.discount !== undefined) updateData.discount = body.discount
    if (body.type) updateData.type = body.type
    if (body.minFare !== undefined) updateData.minFare = body.minFare
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.expiresAt) updateData.expiresAt = new Date(body.expiresAt)

    const offer = await db.offer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error('Update offer error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update offer' }, { status: 500 })
  }
}
