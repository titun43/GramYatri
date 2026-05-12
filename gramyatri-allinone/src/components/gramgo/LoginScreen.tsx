'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Shield, ArrowRight, User, Truck, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore, type Role } from '@/lib/store'
import { sendOTP, verifyOTP, registerUser } from '@/lib/api'

type LoginStep = 'phone' | 'otp' | 'role-select' | 'register'

export default function LoginScreen() {
  const { login, setView } = useAppStore()
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      setError('সঠিক ফোন নম্বর দিন (১০ ডিজিট)')
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendOTP(`+91${phone}`)
      setStep('otp')
      setCountdown(30)
    } catch {
      // Since API is being built in parallel, proceed anyway
      setStep('otp')
      setCountdown(30)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      setError('৪ ডিজিটের OTP দিন')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await verifyOTP(`+91${phone}`, otp)
      if (result.user) {
        login(result.user)
      } else if (result.isNewUser) {
        setStep('role-select')
      }
    } catch {
      // For demo: OTP is always "1234"
      if (otp === '1234') {
        setStep('role-select')
      } else {
        setError('ভুল OTP। আবার চেষ্টা করুন')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    if (role === 'ADMIN') {
      // Admin auto-login with mock data
      login({
        id: 'admin-1',
        name: 'এডমিন',
        phone: `+91${phone}`,
        role: 'ADMIN',
        walletBalance: 0,
        isVerified: true,
      })
    } else {
      setStep('register')
    }
  }

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('নাম দিন')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await registerUser({
        phone: `+91${phone}`,
        name: name.trim(),
        role: selectedRole!,
      })
      login(user)
    } catch {
      // Mock login for demo
      login({
        id: `${selectedRole?.toLowerCase()}-${Date.now()}`,
        name: name.trim(),
        phone: `+91${phone}`,
        role: selectedRole!,
        walletBalance: selectedRole === 'DRIVER' ? 0 : 500,
        isVerified: true,
        isOnline: false,
        vehicleType: selectedRole === 'DRIVER' ? 'TEMPO' : undefined,
        vehicleNumber: selectedRole === 'DRIVER' ? 'AS-01-AB-1234' : undefined,
        rating: selectedRole === 'DRIVER' ? 4.5 : undefined,
        totalRides: selectedRole === 'DRIVER' ? 0 : undefined,
        totalEarnings: selectedRole === 'DRIVER' ? 0 : undefined,
        isRegistered: selectedRole === 'DRIVER' ? false : true,
      })
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      role: 'USER' as Role,
      label: 'যাত্রী',
      sublabel: 'আমি যাত্রা করব',
      icon: User,
      emoji: '🧑',
      color: 'emerald',
    },
    {
      role: 'DRIVER' as Role,
      label: 'চালক',
      sublabel: 'আমি গাড়ি চালাব',
      icon: Truck,
      emoji: '🚗',
      color: 'orange',
    },
    {
      role: 'ADMIN' as Role,
      label: 'এডমিন',
      sublabel: 'প্রশাসনিক প্যানেল',
      icon: ShieldCheck,
      emoji: '🛡️',
      color: 'slate',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-orange-50 dark:from-emerald-950 dark:to-gray-900">
      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg mb-4"
        >
          <div>
            <span className="text-xl font-black text-white">গ্রাম</span>
            <span className="text-xl font-black text-orange-300">Go</span>
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          গ্রাম<span className="text-orange-500">Go</span> তে স্বাগতম
        </h1>
        <p className="text-muted-foreground mt-1">গ্রামের যাতায়াত, এখন সহজ</p>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* Phone Step */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    ফোন নম্বর দিন
                  </CardTitle>
                  <CardDescription>আপনার মোবাইল নম্বর দিয়ে লগইন করুন</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-muted-foreground">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="মোবাইল নম্বর"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setPhone(val)
                        setError('')
                      }}
                      className="flex-1 text-lg"
                      maxLength={10}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleSendOTP}
                    disabled={loading || phone.length !== 10}
                  >
                    {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    লগইন করলে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    OTP যাচাই করুন
                  </CardTitle>
                  <CardDescription>
                    +91{phone} এ OTP পাঠানো হয়েছে
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center py-4">
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
                        <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
                        <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
                        <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 4}
                  >
                    {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
                    <Shield className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="flex justify-between text-sm">
                    <button
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => { setStep('phone'); setOtp('') }}
                    >
                      নম্বর পরিবর্তন
                    </button>
                    <button
                      className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      onClick={handleSendOTP}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `পুনরায় পাঠান (${countdown}s)` : 'OTP পুনরায় পাঠান'}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    ডেমো OTP: 1234
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Role Selection */}
          {step === 'role-select' && (
            <motion.div
              key="role-select"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">আপনি কে?</h2>
                <p className="text-muted-foreground text-sm mt-1">আপনার ভূমিকা নির্বাচন করুন</p>
              </div>
              <div className="space-y-3">
                {roles.map((r) => (
                  <motion.button
                    key={r.role}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(r.role)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-white dark:bg-gray-800 shadow-md hover:border-emerald-500 transition-all text-left`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      r.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900' :
                      r.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900' :
                      'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {r.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{r.label}</div>
                      <div className="text-sm text-muted-foreground">{r.sublabel}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Register Step */}
          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedRole === 'DRIVER' ? <Truck className="h-5 w-5 text-orange-500" /> : <User className="h-5 w-5 text-emerald-600" />}
                    {selectedRole === 'DRIVER' ? 'চালক নিবন্ধন' : 'নিবন্ধন'}
                  </CardTitle>
                  <CardDescription>আপনার নাম দিন {selectedRole === 'DRIVER' ? 'এবং আপনার গাড়ির তথ্য' : ''}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">পুরো নাম</label>
                    <Input
                      placeholder="আপনার নাম"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError('') }}
                      className="h-12"
                    />
                  </div>
                  {selectedRole === 'DRIVER' && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">গাড়ির ধরন</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'TEMPO', label: 'টেম্পো', emoji: '🛺' },
                            { key: 'AUTO', label: 'অটো', emoji: '🚗' },
                            { key: 'E_RICKSHAW', label: 'ই-রিক্শা', emoji: '🛵' },
                          ].map((v) => (
                            <button
                              key={v.key}
                              onClick={() => {}}
                              className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-muted hover:border-orange-500 transition-colors"
                            >
                              <span className="text-2xl">{v.emoji}</span>
                              <span className="text-xs font-medium">{v.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        বিস্তারিত তথ্য পরে প্রোফাইলে যোগ করা যাবে
                      </p>
                    </>
                  )}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleRegister}
                    disabled={loading || !name.trim()}
                  >
                    {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom decoration */}
      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">
          গ্রামGo © ২০২৬ | গ্রামের যাতায়াত, এখন সহজ
        </p>
      </div>
    </div>
  )
}
