'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualGuide, setShowManualGuide] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - non-critical
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowManualGuide(true)
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
    } catch {
      // Install prompt failed
    } finally {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  if (isInstalled) return null

  return (
    <>
      {/* Floating Install Button - always visible on mobile */}
      <AnimatePresence>
        {!showPrompt && !showManualGuide && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowPrompt(true)}
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all"
            aria-label="Install App"
          >
            <Download className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Install Prompt Banner */}
      <AnimatePresence>
        {showPrompt && !showManualGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4"
          >
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-emerald-100 p-5">
              <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <Smartphone className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    Install GramYatri App
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Add to your home screen for quick access. Works offline too!
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Install Now
                    </button>
                    <button
                      onClick={() => setShowManualGuide(true)}
                      className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      How?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Install Guide */}
      <AnimatePresence>
        {showManualGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowManualGuide(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-gray-900">
                  How to Install
                </h3>
                <button onClick={() => setShowManualGuide(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Android Instructions */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-800">Android Phone</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 ml-9">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    Chrome browser এ এই পেজটা খুলুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    উপরের ডানদিকে <span className="font-mono bg-gray-100 px-1 rounded">⋮</span> (3 dots) ট্যাপ করুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    &quot;Add to Home screen&quot; বা &quot;Install app&quot; সিলেক্ট করুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">4.</span>
                    &quot;Install&quot; বাটনে ট্যাপ করুন
                  </li>
                </ol>
              </div>

              {/* iPhone Instructions */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-800">iPhone (Safari)</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 ml-9">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    Safari browser এ এই পেজটা খুলুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    নিচের <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> (Share) বাটনে ট্যাপ করুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    &quot;Add to Home Screen&quot; সিলেক্ট করুন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">4.</span>
                    &quot;Add&quot; বাটনে ট্যাপ করুন
                  </li>
                </ol>
              </div>

              {/* Desktop Instructions */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Monitor className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-800">Desktop / Laptop</h4>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 ml-9">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    Chrome এ address bar এর ডানদিকে install icon দেখবেন
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    Install icon এ ক্লিক করুন অথবা address bar এ <span className="font-mono bg-gray-100 px-1 rounded">⋮</span> &rarr; &quot;Install GramYatri&quot;
                  </li>
                </ol>
              </div>

              {/* APK Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-orange-800">APK Download (Coming Soon)</h4>
                </div>
                <p className="text-sm text-orange-700">
                  আপনি যদি .apk ফাইল ডাউনলোড করতে চান, তাহলে নিচের &quot;Download APK&quot; বাটনে ক্লিক করুন। 
                  এটা সরাসরি আপনার ফোনে ইনস্টল হবে।
                </p>
              </div>

              <button
                onClick={() => setShowManualGuide(false)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                বুঝেছি! ✓
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
