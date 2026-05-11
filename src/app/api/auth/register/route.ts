import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, name, role, vehicleType, vehicleNumber, licenseNumber } = await req.json()

    if (!phone || !name || !role) {
      return NextResponse.json({ success: false, message: 'Phone, name, and role are required' }, { status: 400 })
    }

    // Prevent non-admin phones from getting ADMIN role
    const ADMIN_PHONES = ['+919999999999']
    let effectiveRole = role
    if (role === 'ADMIN' && !ADMIN_PHONES.includes(phone)) {
      console.warn(`Non-admin phone ${phone} attempted ADMIN registration, defaulting to USER`)
      effectiveRole = 'USER'
    }

    // Find existing user or create
    let user = await db.user.findUnique({
      where: { phone },
      include: { wallet: true, driver: true },
    })

    if (user) {
      // Update existing user with name and role
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name,
          role: effectiveRole,
        },
        include: { wallet: true, driver: true },
      })
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          phone,
          name,
          role: effectiveRole,
          isVerified: true,
          wallet: { create: { balance: 0 } },
          ...(effectiveRole === 'DRIVER' && vehicleType ? {
            driver: {
              create: {
                vehicleType,
                vehicleNumber: vehicleNumber || '',
                licenseNumber: licenseNumber || '',
                isApproved: false,
                isOnline: false,
              },
            },
          } : {}),
        },
        include: { wallet: true, driver: true },
      })
    }

    // If driver and no driver record yet, create one
    if (effectiveRole === 'DRIVER' && !user.driver && vehicleType) {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          driver: {
            create: {
              vehicleType,
              vehicleNumber: vehicleNumber || '',
              licenseNumber: licenseNumber || '',
              isApproved: false,
              isOnline: false,
            },
          },
        },
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
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, message: 'Failed to register user' }, { status: 500 })
  }
}
