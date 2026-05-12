import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    try {
      const wallet = await db.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        return NextResponse.json({ success: true, wallet: { balance: 0 } })
      }

      return NextResponse.json({ success: true, wallet })
    } catch (dbError) {
      console.error('Get wallet DB error:', dbError)
      return NextResponse.json({ success: true, wallet: { balance: 0 } })
    }
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json({ success: true, wallet: { balance: 0 } })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, amount } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'userId and a positive amount are required' },
        { status: 400 }
      )
    }

    try {
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
      try {
        await db.transaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: 'CREDIT',
            description: 'Wallet top-up',
          },
        })
      } catch (txError) {
        console.error('Create transaction error:', txError)
        // Transaction log failure should not fail the top-up
      }

      return NextResponse.json({ success: true, wallet })
    } catch (dbError) {
      console.error('Add money DB error:', dbError)
      return NextResponse.json({ success: false, message: 'Failed to add money. Please try again.' })
    }
  } catch (error) {
    console.error('Add money error:', error)
    return NextResponse.json({ success: false, message: 'Invalid request' })
  }
}
