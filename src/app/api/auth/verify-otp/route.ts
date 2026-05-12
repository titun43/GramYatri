import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: 'Phone and code are required' },
        { status: 400 }
      )
    }

    // Try DB-based OTP verification
    try {
      // Find valid OTP
      const otp = await db.oTP.findFirst({
        where: {
          phone,
          code,
          isVerified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!otp) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP' },
          { status: 400 }
        )
      }

      // Mark OTP as verified
      await db.oTP.update({
        where: { id: otp.id },
        data: { isVerified: true },
      })

      // Find or create user with full profile
      let user = await db.user.findUnique({
        where: { phone },
        include: {
          wallet: true,
          driver: true,
        },
      })

      if (!user) {
        user = await db.user.create({
          data: {
            phone,
            isVerified: true,
            wallet: { create: { balance: 0 } },
          },
          include: {
            wallet: true,
            driver: true,
          },
        })
      } else {
        if (!user.isVerified) {
          user = await db.user.update({
            where: { id: user.id },
            data: { isVerified: true },
            include: {
              wallet: true,
              driver: true,
            },
          })
        }
        // Ensure wallet exists
        if (!user.wallet) {
          user = await db.user.update({
            where: { id: user.id },
            data: { wallet: { create: { balance: 0 } } },
            include: {
              wallet: true,
              driver: true,
            },
          })
        }
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
      // DB failed — treat as new user (will go to registration flow)
      console.error('Verify OTP DB error (treating as new user):', dbError)
      return NextResponse.json({
        success: true,
        isNewUser: true,
      })
    }
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
