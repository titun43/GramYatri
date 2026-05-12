import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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
    } = body

    if (!userId || !vehicleType || !vehicleNumber || !licenseNumber) {
      return NextResponse.json(
        { success: false, message: 'userId, vehicleType, vehicleNumber, and licenseNumber are required' },
        { status: 400 }
      )
    }

    try {
      // Check if user already has a driver record
      const existingDriver = await db.driver.findUnique({ where: { userId } })
      if (existingDriver) {
        // Instead of failing, update the existing driver record
        const updatedDriver = await db.driver.update({
          where: { userId },
          data: {
            vehicleType,
            vehicleNumber,
            licenseNumber,
            aadhaarNumber: aadhaarNumber || null,
            aadhaarPhoto: aadhaarPhoto || null,
            licensePhoto: licensePhoto || null,
            rcNumber: rcNumber || null,
            rcPhoto: rcPhoto || null,
            vehiclePhoto: vehiclePhoto || null,
          },
          include: { user: true },
        })

        // Update user role to DRIVER
        await db.user.update({
          where: { id: userId },
          data: { role: 'DRIVER' },
        })

        return NextResponse.json({ success: true, driver: updatedDriver })
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
    } catch (dbError) {
      console.error('Register driver DB error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database error. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Register driver error:', error)
    return NextResponse.json(
      { success: false, message: 'Invalid request. Please try again.' },
      { status: 400 }
    )
  }
}
