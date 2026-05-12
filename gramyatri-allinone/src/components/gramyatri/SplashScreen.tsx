'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onComplete, 400)
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-500 to-orange-500"
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative mb-6"
      >
        <div className="flex items-center justify-center w-28 h-28 rounded-3xl bg-white shadow-2xl">
          <div className="text-center">
            <span className="text-2xl font-black text-emerald-600">Gram</span>
            <span className="text-2xl font-black text-orange-500">Yatri</span>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-white text-lg">🛺</span>
        </motion.div>
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-4xl font-black text-white mb-3 tracking-tight"
      >
        Gram<span className="text-orange-300">Yatri</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-emerald-100 text-lg font-medium mb-8"
      >
        Village Transport, Made Easy
      </motion.p>

      {/* Vehicle icons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="flex items-center gap-6 text-white/80 text-sm"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🛺</span>
          <span>Tempo</span>
        </div>
        <div className="w-px h-8 bg-white/30" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🚗</span>
          <span>Auto</span>
        </div>
        <div className="w-px h-8 bg-white/30" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🛵</span>
          <span>E-Rickshaw</span>
        </div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-white/60 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
