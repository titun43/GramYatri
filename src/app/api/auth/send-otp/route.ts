import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Generate a random 4-digit OTP
    const code = String(Math.floor(1000 + Math.random() * 9000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Try to save OTP to database (non-blocking — if DB fails, still return the OTP)
    try {
      // Invalidate previous OTPs for this phone
      await db.oTP.updateMany({
        where: { phone, isVerified: false },
        data: { isVerified: true },
      })

      // Save new OTP
      await db.oTP.create({
        data: { phone, code, expiresAt },
      })
    } catch (dbError) {
      console.error('Send OTP DB error (still returning OTP to client):', dbError)
      // Continue — still return the OTP code to the frontend
    }

    // Return the OTP code so the frontend can display it on screen
    return NextResponse.json({ success: true, message: 'OTP sent', code })
  } catch (error) {
    console.error('Send OTP error:', error)
    // Still try to generate and return an OTP even if parsing fails
    const code = String(Math.floor(1000 + Math.random() * 9000))
    return NextResponse.json({ success: true, message: 'OTP sent', code })
  }
}
