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
    if (body.name) updateData.name = body.name
    if (body.fromLocation) updateData.fromLocation = body.fromLocation
    if (body.toLocation) updateData.toLocation = body.toLocation
    if (body.stops) updateData.stops = body.stops
    if (body.fare !== undefined) updateData.fare = body.fare
    if (body.distance !== undefined) updateData.distance = body.distance
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const route = await db.route.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, route })
  } catch (error) {
    console.error('Update route error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update route' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete: deactivate route
    const route = await db.route.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, route })
  } catch (error) {
    console.error('Delete route error:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete route' }, { status: 500 })
  }
}
