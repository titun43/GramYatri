import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const driver = await db.driver.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Get driver error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get driver' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.isOnline !== undefined) updateData.isOnline = body.isOnline
    if (body.currentLat !== undefined) updateData.currentLat = body.currentLat
    if (body.currentLng !== undefined) updateData.currentLng = body.currentLng
    if (body.isApproved !== undefined) updateData.isApproved = body.isApproved
    if (body.vehicleType) updateData.vehicleType = body.vehicleType
    if (body.vehicleNumber) updateData.vehicleNumber = body.vehicleNumber
    if (body.currentRouteId !== undefined) updateData.currentRouteId = body.currentRouteId
    if (body.verificationStatus) updateData.verificationStatus = body.verificationStatus
    if (body.rejectReason !== undefined) updateData.rejectReason = body.rejectReason
    if (body.aadhaarNumber) updateData.aadhaarNumber = body.aadhaarNumber
    if (body.aadhaarPhoto) updateData.aadhaarPhoto = body.aadhaarPhoto
    if (body.licensePhoto) updateData.licensePhoto = body.licensePhoto
    if (body.rcNumber) updateData.rcNumber = body.rcNumber
    if (body.rcPhoto) updateData.rcPhoto = body.rcPhoto
    if (body.vehiclePhoto) updateData.vehiclePhoto = body.vehiclePhoto
    if (body.totalRides !== undefined) updateData.totalRides = body.totalRides
    if (body.totalEarnings !== undefined) updateData.totalEarnings = body.totalEarnings
    if (body.rating !== undefined) updateData.rating = body.rating

    const driver = await db.driver.update({
      where: { id },
      data: updateData,
      include: { user: true },
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Update driver error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update driver' }, { status: 500 })
  }
}
