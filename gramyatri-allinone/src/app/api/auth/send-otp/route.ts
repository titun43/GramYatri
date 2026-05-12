import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 })
    }

    // For demo, always use "1234"
    const code = '1234'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Invalidate previous OTPs for this phone
    await db.oTP.updateMany({
      where: { phone, isVerified: false },
      data: { isVerified: true },
    })

    // Save new OTP
    await db.oTP.create({
      data: { phone, code, expiresAt },
    })

    return NextResponse.json({ success: true, message: 'OTP sent' })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 })
  }
}
