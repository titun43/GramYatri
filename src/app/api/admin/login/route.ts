import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Phone and password are required' },
        { status: 400 }
      )
    }

    // Find user by phone with ADMIN role
    const user = await db.user.findUnique({
      where: { phone },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Check adminPassword (plain text comparison for demo)
    if (!user.adminPassword || user.adminPassword !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Check if admin is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, message: 'Admin account is blocked' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ success: false, message: 'Login failed' }, { status: 500 })
  }
}
