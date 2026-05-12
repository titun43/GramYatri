// Firebase Cloud Messaging - Send to individual device
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, notification, data, webpush } = await request.json()

    if (!token || !notification) {
      return NextResponse.json(
        { success: false, error: 'Token and notification required' },
        { status: 400 }
      )
    }

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      console.log('[FCM Mock] Send notification:', { token: token.slice(0, 10) + '...', notification, data })
      return NextResponse.json({
        success: true,
        messageId: `mock-${Date.now()}`,
        message: 'Firebase not configured - notification logged only',
      })
    }

    const { adminMessaging } = await import('@/lib/firebase/admin-config')

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data || {},
      webpush: webpush || {},
      android: {
        notification: {
          clickAction: data?.action || 'OPEN_APP',
        },
      },
    }

    const messageId = await adminMessaging.send(message)
    return NextResponse.json({ success: true, messageId })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send notification'
    console.error('FCM send error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
