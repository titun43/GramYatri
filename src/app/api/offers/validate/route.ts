import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code, fare } = await req.json()

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Offer code is required' },
        { status: 400 }
      )
    }

    const offer = await db.offer.findFirst({
      where: {
        code,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    })

    if (!offer) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired offer code' },
        { status: 404 }
      )
    }

    const fareAmount = fare ?? 0
    if (fareAmount < offer.minFare) {
      return NextResponse.json({
        success: false,
        message: `Minimum fare of ${offer.minFare} required for this offer`,
        minFare: offer.minFare,
      })
    }

    let discount = 0
    if (offer.type === 'PERCENTAGE') {
      discount = Math.min((fareAmount * offer.discount) / 100, offer.maxDiscount)
    } else {
      discount = Math.min(offer.discount, offer.maxDiscount || offer.discount)
    }

    return NextResponse.json({
      success: true,
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        title: offer.title,
        type: offer.type,
      },
      discount: Math.round(discount * 100) / 100,
      finalFare: Math.round((fareAmount - discount) * 100) / 100,
    })
  } catch (error) {
    console.error('Validate offer error:', error)
    return NextResponse.json({ success: false, message: 'Failed to validate offer' }, { status: 500 })
  }
}
