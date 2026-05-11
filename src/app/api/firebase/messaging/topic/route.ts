// Firebase Cloud Messaging - Send to topic
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { topic, notification, data } = await request.json()

    if (!topic || !notification) {
      return NextResponse.json(
        { success: false, error: 'Topic and notification required' },
        { status: 400 }
      )
    }

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      console.log('[FCM Mock] Send topic notification:', { topic, notification, data })
      return NextResponse.json({
        success: true,
        messageId: `mock-topic-${Date.now()}`,
        message: 'Firebase not configured - topic notification logged only',
      })
    }

    const { adminMessaging } = await import('@/lib/firebase/admin-config')

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data || {},
      android: {
        notification: {
          clickAction: data?.action || 'OPEN_APP',
        },
      },
    }

    const messageId = await adminMessaging.send(message)
    return NextResponse.json({ success: true, messageId })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send topic notification'
    console.error('FCM topic send error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
