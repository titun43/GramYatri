import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadhaarNumber,
      aadhaarPhoto,
      licensePhoto,
      rcNumber,
      rcPhoto,
      vehiclePhoto,
    } = await req.json()

    if (!userId || !vehicleType || !vehicleNumber || !licenseNumber) {
      return NextResponse.json(
        { success: false, message: 'userId, vehicleType, vehicleNumber, and licenseNumber are required' },
        { status: 400 }
      )
    }

    // Check if user already has a driver record
    const existingDriver = await db.driver.findUnique({ where: { userId } })
    if (existingDriver) {
      return NextResponse.json(
        { success: false, message: 'Driver already registered for this user' },
        { status: 400 }
      )
    }

    // Update user role to DRIVER
    await db.user.update({
      where: { id: userId },
      data: { role: 'DRIVER' },
    })

    // Determine verification status
    const hasDocuments = !!(aadhaarPhoto || licensePhoto || rcPhoto)
    const verificationStatus = hasDocuments ? 'SUBMITTED' : 'PENDING'

    const driver = await db.driver.create({
      data: {
        userId,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        aadhaarNumber: aadhaarNumber || null,
        aadhaarPhoto: aadhaarPhoto || null,
        licensePhoto: licensePhoto || null,
        rcNumber: rcNumber || null,
        rcPhoto: rcPhoto || null,
        vehiclePhoto: vehiclePhoto || null,
        isApproved: false,
        verificationStatus,
      },
      include: { user: true },
    })

    // Create a wallet for the driver if not exists
    const existingWallet = await db.wallet.findUnique({ where: { userId } })
    if (!existingWallet) {
      await db.wallet.create({
        data: { userId, balance: 0 },
      })
    }

    return NextResponse.json({ success: true, driver }, { status: 201 })
  } catch (error) {
    console.error('Register driver error:', error)
    return NextResponse.json({ success: false, message: 'Failed to register driver' }, { status: 500 })
  }
}
