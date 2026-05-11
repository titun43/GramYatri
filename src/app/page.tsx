'use client'

import { useState, useEffect, Component, useSyncExternalStore, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import dynamic from 'next/dynamic'

// Hook to detect client-side mount without hydration mismatch
function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      return () => {}
    },
    () => true,  // Client snapshot: always true after hydration
    () => false  // Server snapshot: always false
  )
}

// Dynamic imports with no SSR to prevent crashes from spreading
const SplashScreen = dynamic(() => import('@/components/gramyatri/SplashScreen'), { ssr: false })
const LoginScreen = dynamic(() => import('@/components/gramyatri/LoginScreen'), { ssr: false })
const AdminLoginScreen = dynamic(() => import('@/components/gramyatri/AdminLoginScreen'), { ssr: false })
const UserPanel = dynamic(() => import('@/components/gramyatri/UserPanel'), { ssr: false })
const DriverPanel = dynamic(() => import('@/components/gramyatri/DriverPanel'), { ssr: false })
const AdminPanel = dynamic(() => import('@/components/gramyatri/AdminPanel'), { ssr: false })
const PWAInstallPrompt = dynamic(() => import('@/components/gramyatri/PWAInstallPrompt'), { ssr: false })

// Error Boundary
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🛺</div>
            <h1 className="text-2xl font-black mb-2">
              <span className="text-emerald-600">Gram</span><span className="text-orange-500">Yatri</span>
            </h1>
            <p className="text-red-500 mb-4 text-sm">Something went wrong</p>
            <p className="text-gray-500 text-xs mb-6">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload() }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  const { isLoggedIn, currentRole } = useAppStore()
  const [showSplash, setShowSplash] = useState(true)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [rehydrated, setRehydrated] = useState(false)
  const mounted = useHydrated()

  // Wait for Zustand persist to rehydrate from localStorage
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => setRehydrated(true))
    })
    // If already hydrated (e.g. on subsequent renders)
    if (useAppStore.persist.hasHydrated()) {
      queueMicrotask(() => setRehydrated(true))
    }
    return unsub
  }, [])

  // If user is already logged in (from localStorage), skip splash screen
  const skipSplash = useCallback(() => {
    setShowSplash(false)
  }, [])

  // Auto-skip splash for returning users
  useEffect(() => {
    if (rehydrated && isLoggedIn) {
      const timer = setTimeout(skipSplash, 300) // Short splash for returning users
      return () => clearTimeout(timer)
    }
  }, [rehydrated, isLoggedIn, skipSplash])

  // Normal splash timer for new users
  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(skipSplash, 2500)
      return () => clearTimeout(timer)
    }
  }, [isLoggedIn, skipSplash])

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - non-critical
      })
    }
  }, [])

  if (!mounted || !rehydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-orange-500">
        <div className="text-center">
          <span className="text-3xl font-black text-white">Gram<span className="text-orange-300">Yatri</span></span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <motion.div key="splash">
              <SplashScreen onComplete={() => setShowSplash(false)} />
            </motion.div>
          ) : !isLoggedIn ? (
            showAdminLogin ? (
              <motion.div key="admin-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminLoginScreen onBack={() => setShowAdminLogin(false)} />
              </motion.div>
            ) : (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
                <LoginScreen onAdminLogin={() => setShowAdminLogin(true)} />
              </motion.div>
            )
          ) : (
            <motion.div key={currentRole || 'home'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
              {currentRole === 'USER' && <UserPanel />}
              {currentRole === 'DRIVER' && <DriverPanel />}
              {currentRole === 'ADMIN' && <AdminPanel />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Install Prompt - shows on all screens */}
        <PWAInstallPrompt />
      </div>
    </ErrorBoundary>
  )
}
