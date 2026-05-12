// Firebase Cloud Messaging Service
// Push notifications for users, drivers, and admin

import {
  getToken,
  onMessage,
  deleteToken,
  isSupported,
  MessagePayload,
} from 'firebase/messaging'
import { messaging, FCM_TOPICS } from './config'
import { db, COLLECTIONS } from './config'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

// ─── VAPID Key (replace with your actual key from Firebase Console) ────────────

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LUgDfe6NBgOq9W1GH2ZKx8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8'

// ─── Request Notification Permission ───────────────────────────────────────────

export async function requestNotificationPermission(): Promise<{
  granted: boolean
  token?: string
  error?: string
}> {
  try {
    const supported = await isSupported()
    if (!supported || !messaging) {
      return { granted: false, error: 'Messaging not supported in this browser' }
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { granted: false, error: 'Notification permission denied' }
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return { granted: true, token }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to get permission'
    console.error('Notification permission error:', msg)
    return { granted: false, error: msg }
  }
}

// ─── Get FCM Token ─────────────────────────────────────────────────────────────

export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported || !messaging) return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token
  } catch {
    return null
  }
}

// ─── Save FCM Token to Firestore ───────────────────────────────────────────────

export async function saveFCMToken(
  userId: string,
  token: string,
  role: 'USER' | 'DRIVER' | 'ADMIN'
): Promise<void> {
  try {
    const collectionName = role === 'DRIVER' ? COLLECTIONS.DRIVERS : COLLECTIONS.USERS
    await updateDoc(doc(db, collectionName, userId), {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    } as Record<string, unknown>)
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}

// ─── Delete FCM Token ──────────────────────────────────────────────────────────

export async function removeFCMToken(): Promise<void> {
  try {
    const supported = await isSupported()
    if (!supported || !messaging) return

    await deleteToken(messaging)
  } catch (error) {
    console.error('Error deleting FCM token:', error)
  }
}

// ─── Listen for Foreground Messages ────────────────────────────────────────────

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): () => void {
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    callback(payload)
  })
}

// ─── Initialize Push Notifications ─────────────────────────────────────────────

export async function initPushNotifications(
  userId: string,
  role: 'USER' | 'DRIVER' | 'ADMIN'
): Promise<{ success: boolean; token?: string }> {
  try {
    const result = await requestNotificationPermission()
    if (result.granted && result.token) {
      await saveFCMToken(userId, result.token, role)
      return { success: true, token: result.token }
    }
    return { success: false }
  } catch (error) {
    console.error('Error initializing push notifications:', error)
    return { success: false }
  }
}

// ─── Notification Data Types ───────────────────────────────────────────────────

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  clickAction?: string
  data?: Record<string, string>
}

// ─── Show Local Notification (foreground) ──────────────────────────────────────

export function showLocalNotification(data: PushNotificationData): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      data: data.data,
    })
  }
}

// ─── Send Notification via Server API ──────────────────────────────────────────

export async function sendPushNotification(
  targetToken: string,
  notification: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/firebase/messaging/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: targetToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        webpush: {
          notification: {
            icon: notification.icon || '/favicon.ico',
            click_action: notification.clickAction,
          },
        },
      }),
    })

    const result = await response.json()
    return { success: result.success, error: result.error }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send notification'
    return { success: false, error: msg }
  }
}

// ─── Send Notification to Topic ────────────────────────────────────────────────

export async function sendTopicNotification(
  topic: string,
  notification: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/firebase/messaging/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
      }),
    })

    const result = await response.json()
    return { success: result.success, error: result.error }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send topic notification'
    return { success: false, error: msg }
  }
}

// ─── Subscribe/Unsubscribe to Topic ────────────────────────────────────────────

export async function subscribeToTopic(
  token: string,
  topic: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/firebase/messaging/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic }),
    })
    const result = await response.json()
    return result.success
  } catch {
    return false
  }
}

export async function unsubscribeFromTopic(
  token: string,
  topic: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/firebase/messaging/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic }),
    })
    const result = await response.json()
    return result.success
  } catch {
    return false
  }
}

// ─── Pre-built notification templates ──────────────────────────────────────────

export const NotificationTemplates = {
  rideAccepted: (driverName: string, eta: number) => ({
    title: 'Driver Found! 🛺',
    body: `${driverName} is on the way. ETA: ${eta} minutes`,
    data: { type: 'RIDE_UPDATE', action: 'VIEW_RIDE' },
  }),

  rideStarted: () => ({
    title: 'Ride Started 🚗',
    body: 'Your ride has begun. Stay safe!',
    data: { type: 'RIDE_UPDATE', action: 'TRACK_RIDE' },
  }),

  rideCompleted: (fare: number) => ({
    title: 'Ride Completed ✅',
    body: `Your ride is done. Fare: ₹${fare}. Rate your driver!`,
    data: { type: 'RIDE_UPDATE', action: 'RATE_RIDE' },
  }),

  rideCancelled: () => ({
    title: 'Ride Cancelled ❌',
    body: 'Your ride has been cancelled.',
    data: { type: 'RIDE_UPDATE', action: 'VIEW_RIDES' },
  }),

  newRideRequest: (pickup: string, drop: string, fare: number) => ({
    title: 'New Ride Request! 💰',
    body: `${pickup} → ${drop} | ₹${fare}`,
    data: { type: 'NEW_RIDE', action: 'VIEW_REQUEST' },
  }),

  driverArriving: (eta: number) => ({
    title: 'Driver Arriving! 📍',
    body: `Your driver will arrive in ${eta} minutes`,
    data: { type: 'RIDE_UPDATE', action: 'TRACK_RIDE' },
  }),

  walletCredited: (amount: number) => ({
    title: 'Wallet Updated 💰',
    body: `₹${amount} has been credited to your wallet`,
    data: { type: 'WALLET_UPDATE', action: 'VIEW_WALLET' },
  }),

  driverApproved: () => ({
    title: 'Approved! ✅',
    body: 'Your driver profile has been approved. You can now go online!',
    data: { type: 'DRIVER_UPDATE', action: 'GO_ONLINE' },
  }),

  driverRejected: (reason?: string) => ({
    title: 'Application Update',
    body: reason
      ? `Your driver application was not approved: ${reason}`
      : 'Your driver application needs review. Please check your documents.',
    data: { type: 'DRIVER_UPDATE', action: 'VIEW_PROFILE' },
  }),

  offerPromo: (code: string, discount: string) => ({
    title: 'Special Offer! 🎉',
    body: `Use code ${code} for ${discount} off on your next ride!`,
    data: { type: 'PROMO', action: 'BOOK_RIDE' },
  }),

  withdrawalProcessed: (amount: number) => ({
    title: 'Withdrawal Processed 💸',
    body: `₹${amount} withdrawal has been processed`,
    data: { type: 'EARNING_UPDATE', action: 'VIEW_EARNINGS' },
  }),

  emergencyAlert: (userName: string) => ({
    title: '🚨 EMERGENCY ALERT',
    body: `Emergency alert from ${userName}. Immediate attention required!`,
    data: { type: 'EMERGENCY', action: 'VIEW_EMERGENCY' },
  }),
}
