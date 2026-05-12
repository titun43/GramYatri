import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { amount, type, description } = await req.json()

    if (!amount || !type || !description) {
      return NextResponse.json(
        { success: false, message: 'amount, type, and description are required' },
        { status: 400 }
      )
    }

    if (type !== 'CREDIT' && type !== 'DEBIT') {
      return NextResponse.json(
        { success: false, message: 'type must be CREDIT or DEBIT' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'amount must be positive' },
        { status: 400 }
      )
    }

    // Find the wallet
    const wallet = await db.wallet.findUnique({
      where: { id },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Check sufficient balance for DEBIT
    if (type === 'DEBIT' && wallet.balance < amount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient wallet balance' },
        { status: 400 }
      )
    }

    const newBalance = type === 'CREDIT'
      ? wallet.balance + amount
      : wallet.balance - amount

    // Update wallet and create transaction atomically
    const [updatedWallet, transaction] = await db.$transaction([
      db.wallet.update({
        where: { id },
        data: { balance: newBalance },
      }),
      db.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type,
          description,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      wallet: { id: updatedWallet.id, balance: updatedWallet.balance },
      transaction,
    })
  } catch (error) {
    console.error('Adjust wallet error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to adjust wallet' },
      { status: 500 }
    )
  }
}
