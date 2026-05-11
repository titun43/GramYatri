// Firebase Cloud Messaging - Subscribe/Unsubscribe to topic
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, topic } = await request.json()

    if (!token || !topic) {
      return NextResponse.json(
        { success: false, error: 'Token and topic required' },
        { status: 400 }
      )
    }

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      console.log('[FCM Mock] Subscribe to topic:', { topic, token: token.slice(0, 10) + '...' })
      return NextResponse.json({ success: true, message: 'Mock subscribe' })
    }

    const { adminMessaging } = await import('@/lib/firebase/admin-config')
    await adminMessaging.subscribeToTopic([token], topic)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to subscribe'
    console.error('FCM subscribe error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token, topic } = await request.json()

    if (!token || !topic) {
      return NextResponse.json(
        { success: false, error: 'Token and topic required' },
        { status: 400 }
      )
    }

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      console.log('[FCM Mock] Unsubscribe from topic:', { topic, token: token.slice(0, 10) + '...' })
      return NextResponse.json({ success: true, message: 'Mock unsubscribe' })
    }

    const { adminMessaging } = await import('@/lib/firebase/admin-config')
    await adminMessaging.unsubscribeFromTopic([token], topic)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to unsubscribe'
    console.error('FCM unsubscribe error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
