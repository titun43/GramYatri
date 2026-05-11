'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, ListChecks, CheckCircle, CloudOff } from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'gramyatri_offline_bookings'

interface PendingBooking {
  id: string
  data: Record<string, unknown>
  createdAt: string
}

function getStoredBookings(): PendingBooking[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setStoredBookings(bookings: PendingBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    window.dispatchEvent(new CustomEvent('gramyatri:storage-update'))
  } catch {
    console.error('Failed to store offline bookings')
  }
}

// Use useSyncExternalStore for hydration-safe browser API access
const emptySubscribe = () => () => {}

function useNavigatorOnline() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('online', onStoreChange)
      window.addEventListener('offline', onStoreChange)
      return () => {
        window.removeEventListener('online', onStoreChange)
        window.removeEventListener('offline', onStoreChange)
      }
    },
    () => navigator.onLine,
    () => true // SSR: assume online
  )
}

function useLocalStorageCount(key: string): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) onStoreChange()
      }
      window.addEventListener('storage', handler)
      // Also listen for our custom event
      window.addEventListener('gramyatri:storage-update', onStoreChange)
      return () => {
        window.removeEventListener('storage', handler)
        window.removeEventListener('gramyatri:storage-update', onStoreChange)
      }
    },
    () => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored).length : 0
      } catch {
        return 0
      }
    },
    () => 0 // SSR: no pending bookings
  )
}

export default function OfflineBookingIndicator() {
  const isOnline = useNavigatorOnline()
  const pendingBookings = useLocalStorageCount(STORAGE_KEY)
  const [syncing, setSyncing] = useState(false)
  const [syncComplete, setSyncComplete] = useState(false)

  // Queue a booking when offline
  const queueBooking = useCallback((bookingData: Record<string, unknown>) => {
    const bookings = getStoredBookings()
    const newBooking: PendingBooking = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: bookingData,
      createdAt: new Date().toISOString(),
    }
    bookings.push(newBooking)
    setStoredBookings(bookings) // also dispatches custom event for useLocalStorageCount
    toast.info('Booking saved offline. It will sync when you reconnect.')
  }, [])

  // Sync queued bookings to the API
  const syncBookings = useCallback(async () => {
    const bookings = getStoredBookings()
    if (bookings.length === 0) return

    setSyncing(true)
    let syncedCount = 0
    let failedCount = 0

    for (const booking of bookings) {
      try {
        const res = await fetch('/api/rides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data),
        })
        if (res.ok) {
          syncedCount++
        } else {
          failedCount++
        }
      } catch {
        failedCount++
      }
    }

    // Clear localStorage after sync attempt
    if (syncedCount > 0) {
      if (failedCount === 0) {
        // All synced successfully
        setStoredBookings([])
      } else {
        // Some failed - keep only the failed ones
        // For simplicity, we retry all on next sync
        // But remove the ones that succeeded by tracking
        const remaining = bookings.slice(syncedCount)
        setStoredBookings(remaining)
      }
    }

    setSyncing(false)
    setSyncComplete(true)

    if (syncedCount > 0 && failedCount === 0) {
      toast.success(`${syncedCount} offline booking${syncedCount > 1 ? 's' : ''} synced successfully!`)
    } else if (syncedCount > 0 && failedCount > 0) {
      toast.warning(`${syncedCount} synced, ${failedCount} failed. Will retry.`)
    }

    setTimeout(() => setSyncComplete(false), 2000)
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingBookings > 0 && !syncing) {
      const timer = setTimeout(() => {
        syncBookings()
      }, 500) // Small delay to ensure connection is stable
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingBookings, syncing, syncBookings])

  // Expose queueBooking via window for other components to use
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, unknown>>
      if (customEvent.detail) {
        queueBooking(customEvent.detail)
      }
    }
    window.addEventListener('gramyatri:queue-booking', handler)
    return () => {
      window.removeEventListener('gramyatri:queue-booking', handler)
    }
  }, [queueBooking])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="font-medium">You are offline</span>
              <span className="text-xs opacity-75">- Bookings will be saved and synced when you&apos;re back online</span>
            </div>
            {pendingBookings > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <ListChecks className="h-3 w-3" />
                {pendingBookings} pending
              </div>
            )}
          </div>
        </motion.div>
      )}

      {syncing && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-4 py-2 flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Syncing offline bookings...</span>
            <div className="flex-1 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-600 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {syncComplete && !syncing && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-4 py-2 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Sync complete!</span>
          </div>
        </motion.div>
      )}

      {/* Subtle indicator when online but has pending bookings (edge case: sync partially failed) */}
      {isOnline && !syncing && !syncComplete && pendingBookings > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-4 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CloudOff className="h-3 w-3" />
              <span>{pendingBookings} booking{pendingBookings > 1 ? 's' : ''} pending sync</span>
            </div>
            <button
              onClick={() => syncBookings()}
              className="font-medium underline hover:no-underline"
            >
              Retry now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Utility function to queue a booking from any component
export function queueOfflineBooking(bookingData: Record<string, unknown>) {
  if (!navigator.onLine) {
    // Queue to localStorage
    const bookings = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
      } catch {
        return []
      }
    })()
    const newBooking: PendingBooking = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: bookingData,
      createdAt: new Date().toISOString(),
    }
    bookings.push(newBooking)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    // Dispatch custom event so the indicator updates
    window.dispatchEvent(new CustomEvent('gramyatri:queue-booking', { detail: bookingData }))
    return true
  }
  return false
}
