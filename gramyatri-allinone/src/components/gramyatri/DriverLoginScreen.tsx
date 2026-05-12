'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowLeft, Car, Shield, Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { sendOTP, verifyOTP } from '@/lib/api'
import { toast } from 'sonner'

interface DriverLoginScreenProps {
  onBack: () => void
  onRegister: () => void
}

export default function DriverLoginScreen({ onBack, onRegister }: DriverLoginScreenProps) {
  const { login } = useAppStore()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await sendOTP(`+91${phone}`)
      if (result.success) {
        setStep('otp')
        toast.success('OTP sent to your phone!')
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.')
      }
    } catch {
      setError('Failed to send OTP. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyOTP(`+91${phone}`, otp)
      if (result.success && result.user) {
        login(result.user)
        toast.success('Welcome back, Driver!')
      } else if (result.isNewUser) {
        toast.info('New driver detected. Please register first.')
        onRegister()
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone' && !loading && phone.length === 10) {
        handleSendOTP()
      } else if (step === 'otp' && !loading && otp.length >= 4) {
        handleVerifyOTP()
      }
    }
  }

  const handlePhoneChange = (value: string) => {
    const val = value.replace(/\D/g, '').slice(0, 10)
    setPhone(val)
    setError('')
  }

  const handleOtpChange = (value: string) => {
    const val = value.replace(/\D/g, '').slice(0, 6)
    setOtp(val)
    setError('')
  }

  const resetToPhone = () => {
    setStep('phone')
    setOtp('')
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 mb-4"
        >
          <span className="text-3xl">🛺</span>
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Gram<span className="text-orange-500">Yatri</span> Driver
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-muted-foreground mt-1"
        >
          Drive with GramYatri, earn with every ride
        </motion.p>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-8 max-w-md mx-auto w-full">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-orange-600" />
                Driver Login
              </CardTitle>
              <CardDescription>
                {step === 'phone'
                  ? 'Enter your phone number to get started'
                  : `Enter the OTP sent to +91${phone}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {step === 'phone' ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Phone Input */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-muted-foreground">
                          +91
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="Your phone number"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9 h-12 text-base"
                            maxLength={10}
                            autoFocus
                          />
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -5, height: 0 }}
                          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Send OTP Button */}
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-base font-semibold"
                      onClick={handleSendOTP}
                      disabled={loading || phone.length !== 10}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <KeyRound className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* OTP Input */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Verification Code</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter 4-digit OTP"
                          value={otp}
                          onChange={(e) => handleOtpChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="pl-9 h-12 text-base tracking-[0.3em] font-mono text-center"
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        OTP sent to +91{phone}
                      </p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -5, height: 0 }}
                          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Verify OTP Button */}
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-base font-semibold"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length < 4}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify OTP
                          <Shield className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {/* Resend / Change Number */}
                    <div className="flex items-center justify-between text-sm">
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                      <button
                        onClick={resetToPhone}
                        className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        Change Number
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Register CTA */}
              <div className="pt-2">
                <button
                  onClick={onRegister}
                  className="w-full flex items-center justify-center gap-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors py-2.5 border border-orange-200 dark:border-orange-800/40 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  <Car className="h-4 w-4" />
                  New driver? Register here
                </button>
              </div>

              {/* Back to Login Link */}
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-orange-600 transition-colors py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>

              {/* Test Credentials Hint */}
              <div className="mt-2 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">Test Credentials</p>
                <p className="text-xs text-orange-600 dark:text-orange-500">
                  Phone: +918765432101 &nbsp;|&nbsp; OTP: 1234
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground">
          GramYatri &copy; 2026 | Village Transport, Made Easy
        </p>
      </div>
    </div>
  )
}
