import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, name, role, vehicleType, vehicleNumber, licenseNumber } = body

    if (!phone || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Phone, name, and role are required' },
        { status: 400 }
      )
    }

    // Prevent non-admin phones from getting ADMIN role
    const ADMIN_PHONES = ['+919999999999']
    let effectiveRole = role
    if (role === 'ADMIN' && !ADMIN_PHONES.includes(phone)) {
      console.warn(`Non-admin phone ${phone} attempted ADMIN registration, defaulting to USER`)
      effectiveRole = 'USER'
    }

    try {
      // Find existing user or create
      let user = await db.user.findUnique({
        where: { phone },
        include: { wallet: true, driver: true },
      })

      if (user) {
        // Update existing user with name and role
        const updateData: Record<string, unknown> = {
          name,
          role: effectiveRole,
        }

        // If switching to DRIVER and no driver record exists, create one inline
        if (effectiveRole === 'DRIVER' && !user.driver && vehicleType) {
          updateData.driver = {
            create: {
              vehicleType,
              vehicleNumber: vehicleNumber || '',
              licenseNumber: licenseNumber || '',
              isApproved: false,
              isOnline: false,
            },
          }
        }

        user = await db.user.update({
          where: { id: user.id },
          data: updateData,
          include: { wallet: true, driver: true },
        })
      } else {
        // Create new user
        const createData: Record<string, unknown> = {
          phone,
          name,
          role: effectiveRole,
          isVerified: true,
          wallet: { create: { balance: 0 } },
        }

        // If DRIVER, create driver record inline
        if (effectiveRole === 'DRIVER' && vehicleType) {
          createData.driver = {
            create: {
              vehicleType,
              vehicleNumber: vehicleNumber || '',
              licenseNumber: licenseNumber || '',
              isApproved: false,
              isOnline: false,
            },
          }
        }

        user = await db.user.create({
          data: createData,
          include: { wallet: true, driver: true },
        })
      }

      // Ensure wallet exists
      if (!user.wallet) {
        user = await db.user.update({
          where: { id: user.id },
          data: { wallet: { create: { balance: 0 } } },
          include: { wallet: true, driver: true },
        })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
          isBlocked: user.isBlocked || false,
          walletBalance: user.wallet?.balance || 0,
          vehicleType: user.driver?.vehicleType,
          vehicleNumber: user.driver?.vehicleNumber,
          isApproved: user.driver?.isApproved,
          isOnline: user.driver?.isOnline,
          rating: user.driver?.rating || 0,
          totalRides: user.driver?.totalRides || 0,
          totalEarnings: user.driver?.totalEarnings || 0,
        },
      })
    } catch (dbError) {
      console.error('Register DB error:', dbError)
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError)
      return NextResponse.json(
        { success: false, message: 'Database error. Please try again.', detail: errMsg },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Invalid request. Please try again.' },
      { status: 400 }
    )
  }
}
