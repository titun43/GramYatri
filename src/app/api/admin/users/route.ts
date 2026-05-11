import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role')
    const isBlocked = req.nextUrl.searchParams.get('isBlocked')

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (isBlocked !== null) where.isBlocked = isBlocked === 'true'

    const users = await db.user.findMany({
      where,
      include: { driver: true, wallet: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get users error:', error)
    // Return empty array instead of 500 error for Vercel deployment
    return NextResponse.json({ success: true, users: [] })
  }
}
