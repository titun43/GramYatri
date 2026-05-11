import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    try {
      const wallet = await db.wallet.findUnique({ where: { userId } })

      if (!wallet) {
        return NextResponse.json({ success: true, transactions: [] })
      }

      try {
        const transactions = await db.transaction.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, transactions })
      } catch (txError) {
        console.error('Get transactions query error:', txError)
        return NextResponse.json({ success: true, transactions: [] })
      }
    } catch (dbError) {
      console.error('Get transactions DB error:', dbError)
      return NextResponse.json({ success: true, transactions: [] })
    }
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ success: true, transactions: [] })
  }
}
