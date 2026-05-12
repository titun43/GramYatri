import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test: try to count users
    const userCount = await db.user.count()
    return NextResponse.json({
      success: true,
      message: 'Database connection OK!',
      userCount,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Database test error:', errorMessage)
    return NextResponse.json({
      success: false,
      message: 'Database connection FAILED',
      error: errorMessage,
    }, { status: 500 })
  }
}
