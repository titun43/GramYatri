import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    const wallet = await db.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, wallet })
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json({ success: false, message: 'Failed to get wallet' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'userId and a positive amount are required' },
        { status: 400 }
      )
    }

    // Find or create wallet
    let wallet = await db.wallet.findUnique({ where: { userId } })

    if (!wallet) {
      wallet = await db.wallet.create({
        data: { userId, balance: 0 },
      })
    }

    // Update balance
    wallet = await db.wallet.update({
      where: { userId },
      data: { balance: wallet.balance + amount },
    })

    // Create transaction
    await db.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'CREDIT',
        description: 'Wallet top-up',
      },
    })

    return NextResponse.json({ success: true, wallet })
  } catch (error) {
    console.error('Add money error:', error)
    return NextResponse.json({ success: false, message: 'Failed to add money' }, { status: 500 })
  }
}
