import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const driver = await db.driver.findUnique({ where: { id } })
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.aadhaarNumber) updateData.aadhaarNumber = body.aadhaarNumber
    if (body.aadhaarPhoto) updateData.aadhaarPhoto = body.aadhaarPhoto
    if (body.licensePhoto) updateData.licensePhoto = body.licensePhoto
    if (body.rcNumber) updateData.rcNumber = body.rcNumber
    if (body.rcPhoto) updateData.rcPhoto = body.rcPhoto
    if (body.vehiclePhoto) updateData.vehiclePhoto = body.vehiclePhoto

    // If any document is uploaded, set verification status to SUBMITTED
    if (Object.keys(updateData).length > 0) {
      updateData.verificationStatus = 'SUBMITTED'
    }

    const updatedDriver = await db.driver.update({
      where: { id },
      data: updateData,
      include: { user: true },
    })

    return NextResponse.json({ success: true, driver: updatedDriver })
  } catch (error) {
    console.error('Upload documents error:', error)
    return NextResponse.json({ success: false, message: 'Failed to upload documents' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const driver = await db.driver.findUnique({
      where: { id },
      select: {
        aadhaarNumber: true,
        aadhaarPhoto: true,
        licenseNumber: true,
        licensePhoto: true,
        rcNumber: true,
        rcPhoto: true,
        vehiclePhoto: true,
        verificationStatus: true,
        rejectReason: true,
        isApproved: true,
      },
    })

    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, documents: driver })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get documents' }, { status: 500 })
  }
}
