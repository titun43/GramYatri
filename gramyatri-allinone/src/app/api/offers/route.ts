import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (activeOnly === 'true') {
      where.isActive = true
      where.expiresAt = { gt: new Date() }
    }

    const offers = await db.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, offers })
  } catch (error) {
    console.error('Get offers error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get offers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, title, description, discount, type, minFare, maxDiscount, isActive, expiresAt } = body

    if (!code || !title || !discount || !expiresAt) {
      return NextResponse.json(
        { success: false, message: 'code, title, discount, and expiresAt are required' },
        { status: 400 }
      )
    }

    const offer = await db.offer.create({
      data: {
        code,
        title,
        description: description ?? null,
        discount,
        type: type ?? 'PERCENTAGE',
        minFare: minFare ?? 0,
        maxDiscount: maxDiscount ?? 0,
        isActive: isActive ?? true,
        expiresAt: new Date(expiresAt),
      },
    })

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (error) {
    console.error('Create offer error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create offer' }, { status: 500 })
  }
}
