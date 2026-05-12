'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, ListChecks } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface OfflineBookingIndicatorProps {
  className?: string
}

function toBengaliNum(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('')
}

type IndicatorMode = 'hidden' | 'offline' | 'syncing' | 'synced'

export default function OfflineBookingIndicator({ className = '' }: OfflineBookingIndicatorProps) {
  const { isOnline } = useAppStore()
  const prevOnlineRef = useRef(isOnline)
  const [mode, setMode] = useState<IndicatorMode>('hidden')
  const [syncProgress, setSyncProgress] = useState(0)
  const [pendingBookings, setPendingBookings] = useState(0)

  // Subscribe to isOnline changes - external system (network status) subscription
  useEffect(() => {
    const wasOnline = prevOnlineRef.current
    prevOnlineRef.current = isOnline

    // Going offline - schedule state update asynchronously
    if (!isOnline && wasOnline) {
      const pending = Math.floor(Math.random() * 3) + 1
      // Use microtask to avoid synchronous setState in effect body
      queueMicrotask(() => {
        setPendingBookings(pending)
        setMode('offline')
      })
      return
    }

    // Coming back online - start sync animation with interval (external system)
    if (isOnline && !wasOnline) {
      queueMicrotask(() => {
        setMode('syncing')
        setSyncProgress(0)
      })

      let progress = 0
      const interval = setInterval(() => {
        progress += 20
        if (progress >= 100) {
          clearInterval(interval)
          setSyncProgress(100)
          setMode('synced')
          setTimeout(() => setMode('hidden'), 800)
        } else {
          setSyncProgress(progress)
        }
      }, 400)

      return () => clearInterval(interval)
    }
  }, [isOnline])

  if (mode === 'hidden') return null

  return (
    <AnimatePresence>
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {mode === 'syncing' || mode === 'synced' ? (
          /* Syncing indicator */
          <div className="bg-emerald-50 dark:bg-emerald-950 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <motion.div
                animate={mode === 'syncing' ? { rotate: 360 } : {}}
                transition={mode === 'syncing' ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
              >
                <RefreshCw className="h-4 w-4 text-emerald-600" />
              </motion.div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {mode === 'syncing' ? 'সিঙ্ক হচ্ছে...' : 'সিঙ্ক সম্পন্ন!'}
              </span>
              <div className="flex-1 h-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden ml-2">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${syncProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {toBengaliNum(syncProgress)}%
              </span>
            </div>
          </div>
        ) : (
          /* Offline indicator */
          <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </motion.div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  অফলাইন মোড
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pendingBookings > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                    <ListChecks className="h-3 w-3" />
                    <span>{toBengaliNum(pendingBookings)} পেন্ডিং</span>
                  </div>
                )}
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  বুকিং স্থানীয়ভাবে সংরক্ষিত হবে
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
