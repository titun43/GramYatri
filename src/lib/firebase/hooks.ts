// Firebase React Hooks
// Custom hooks for using Firebase services in React components
// All hooks are safe to use even when Firebase is not configured

'use client'

import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db, COLLECTIONS, isFirebaseConfigured } from './config'
import {
  subscribeToDocument,
  subscribeToCollection,
  FirestoreRide,
  FirestoreNotification,
  FirestoreDriver,
} from './firestore'
import {
  onForegroundMessage,
  showLocalNotification,
  PushNotificationData,
  initPushNotifications,
} from './messaging'
import { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import { toast } from 'sonner'

// ─── Auth State Hook ───────────────────────────────────────────────────────────

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading }
}

// ─── Firestore Document Hook ───────────────────────────────────────────────────

export function useFirestoreDoc<T>(
  collectionName: string,
  docId: string | null,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(() => docId && enabled && isFirebaseConfigured ? true : false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId || !enabled || !isFirebaseConfigured) return

    const unsubscribe = subscribeToDocument<T>(
      collectionName,
      docId,
      (docData) => {
        setData(docData)
        setLoading(false)
        setError(null)
      }
    )

    return unsubscribe
  }, [collectionName, docId, enabled])

  return { data, loading, error }
}

// ─── Firestore Collection Hook ─────────────────────────────────────────────────

export function useFirestoreCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(() => enabled && isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<T>(
      collectionName,
      constraints,
      (collectionData) => {
        setData(collectionData)
        setLoading(false)
        setError(null)
      }
    )

    return unsubscribe
  }, [collectionName, enabled, constraints])

  return { data, loading, error }
}

// ─── Active Ride Hook (real-time) ──────────────────────────────────────────────

export function useActiveRide(userId: string | null) {
  const [ride, setActiveRide] = useState<FirestoreRide & { id: string } | null>(null)
  const [loading, setLoading] = useState(() => !!userId && isFirebaseConfigured)

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<FirestoreRide & { id: string }>(
      COLLECTIONS.RIDES,
      [],
      (rides) => {
        const activeRide = rides.find(
          (r) =>
            r.userId === userId &&
            ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)
        )
        setActiveRide(activeRide || null)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [userId])

  return { ride, loading }
}

// ─── Driver Active Ride Hook ───────────────────────────────────────────────────

export function useDriverActiveRide(driverId: string | null) {
  const [ride, setActiveRide] = useState<FirestoreRide & { id: string } | null>(null)
  const [loading, setLoading] = useState(() => !!driverId && isFirebaseConfigured)

  useEffect(() => {
    if (!driverId || !isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<FirestoreRide & { id: string }>(
      COLLECTIONS.RIDES,
      [],
      (rides) => {
        const activeRide = rides.find(
          (r) =>
            r.driverId === driverId &&
            ['ACCEPTED', 'IN_PROGRESS'].includes(r.status)
        )
        setActiveRide(activeRide || null)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [driverId])

  return { ride, loading }
}

// ─── Incoming Ride Requests Hook (for drivers) ─────────────────────────────────

export function useIncomingRides(vehicleType?: string) {
  const [rides, setRides] = useState<(FirestoreRide & { id: string })[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<FirestoreRide & { id: string }>(
      COLLECTIONS.RIDES,
      [],
      (allRides) => {
        const pendingRides = allRides.filter(
          (r) =>
            r.status === 'SEARCHING' &&
            (!vehicleType || r.vehicleType === vehicleType)
        )
        setRides(pendingRides)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [vehicleType])

  return { rides, loading }
}

// ─── Notifications Hook ────────────────────────────────────────────────────────

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<(FirestoreNotification & { id: string })[]>([])
  const [loading, setLoading] = useState(() => !!userId && isFirebaseConfigured)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId || !isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<FirestoreNotification & { id: string }>(
      COLLECTIONS.NOTIFICATIONS,
      [],
      (allNotifs) => {
        const userNotifs = allNotifs
          .filter((n) => n.userId === userId)
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0
            const bTime = b.createdAt?.toMillis?.() || 0
            return bTime - aTime
          })
        setNotifications(userNotifs)
        setUnreadCount(userNotifs.filter((n) => !n.isRead).length)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [userId])

  return { notifications, loading, unreadCount }
}

// ─── Online Drivers Hook ───────────────────────────────────────────────────────

export function useOnlineDrivers(vehicleType?: string) {
  const [drivers, setDrivers] = useState<(FirestoreDriver & { id: string })[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = subscribeToCollection<FirestoreDriver & { id: string }>(
      COLLECTIONS.DRIVERS,
      [],
      (allDrivers) => {
        const onlineDrivers = allDrivers.filter(
          (d) =>
            d.isOnline &&
            d.isApproved &&
            !d.isBlocked &&
            !d.isSuspended &&
            (!vehicleType || d.vehicleType === vehicleType)
        )
        setDrivers(onlineDrivers)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [vehicleType])

  return { drivers, loading }
}

// ─── Push Notifications Hook ───────────────────────────────────────────────────

export function usePushNotifications(
  userId: string | null,
  role: 'USER' | 'DRIVER' | 'ADMIN'
) {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [foregroundMessage, setForegroundMessage] = useState<PushNotificationData | null>(null)

  // Initialize push notifications
  const initialize = useCallback(async () => {
    if (!userId || !isFirebaseConfigured) return
    try {
      const result = await initPushNotifications(userId, role)
      if (result.success && result.token) {
        setPermissionGranted(true)
        setToken(result.token)
      }
    } catch {
      // Push notifications not available
    }
  }, [userId, role])

  // Listen for foreground messages
  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = onForegroundMessage((payload) => {
      const notification: PushNotificationData = {
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data as Record<string, string>,
      }
      setForegroundMessage(notification)
      showLocalNotification(notification)

      // Also show a toast
      toast.info(notification.title, {
        description: notification.body,
      })
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  return {
    permissionGranted,
    token,
    foregroundMessage,
    initialize,
    setForegroundMessage,
  }
}

// ─── Firestore Real-time Stats Hook ────────────────────────────────────────────

export function useFirestoreStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    activeRides: 0,
    totalEarnings: 0,
    pendingApprovals: 0,
  })
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    let ridesUnsubscribe: Unsubscribe | null = null
    let driversUnsubscribe: Unsubscribe | null = null
    let usersUnsubscribe: Unsubscribe | null = null

    // Subscribe to rides
    ridesUnsubscribe = subscribeToCollection<FirestoreRide & { id: string }>(
      COLLECTIONS.RIDES,
      [],
      (rides) => {
        setStats((prev) => ({
          ...prev,
          totalRides: rides.length,
          activeRides: rides.filter((r) =>
            ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)
          ).length,
          totalEarnings: rides
            .filter((r) => r.status === 'COMPLETED')
            .reduce((sum, r) => sum + (r.fare || 0), 0),
        }))
        setLoading(false)
      }
    )

    // Subscribe to drivers
    driversUnsubscribe = subscribeToCollection<FirestoreDriver & { id: string }>(
      COLLECTIONS.DRIVERS,
      [],
      (drivers) => {
        setStats((prev) => ({
          ...prev,
          totalDrivers: drivers.length,
          pendingApprovals: drivers.filter((d) => !d.isApproved).length,
        }))
      }
    )

    // Subscribe to users (for total user count)
    usersUnsubscribe = subscribeToCollection<Record<string, unknown> & { id: string }>(
      COLLECTIONS.USERS,
      [],
      (users) => {
        const regularUsers = users.filter((u) => u.role === 'USER')
        setStats((prev) => ({
          ...prev,
          totalUsers: regularUsers.length,
        }))
      }
    )

    return () => {
      ridesUnsubscribe?.()
      driversUnsubscribe?.()
      usersUnsubscribe?.()
    }
  }, [])

  return { stats, loading }
}
