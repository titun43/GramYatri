import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? ''
    const role = req.nextUrl.searchParams.get('role') ?? ''

    const where: Record<string, unknown> = {}
    const userWhere: Record<string, unknown> = {}

    if (role) {
      userWhere.role = role
    }

    if (search) {
      userWhere.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere
    }

    const wallets = await db.wallet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = wallets.map((w) => ({
      id: w.id,
      userId: w.userId,
      userName: w.user.name ?? 'Unknown',
      userPhone: w.user.phone,
      role: w.user.role,
      balance: w.balance,
      createdAt: w.createdAt,
    }))

    return NextResponse.json({ success: true, wallets: formatted })
  } catch (error) {
    console.error('Get admin wallets error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get wallets' },
      { status: 500 }
    )
  }
}
