'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Shield, ArrowRight, User, Truck, ShieldCheck, Info, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type Role } from '@/lib/store'
import { sendOTP, verifyOTP, registerUser } from '@/lib/api'

// Check if Firebase is configured (has API key) - always compute the same on server and client
const firebaseAvailable = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY

type LoginStep = 'phone' | 'otp' | 'role-select' | 'register'

export default function LoginScreen({ onAdminLogin }: { onAdminLogin?: () => void }) {
  const { login } = useAppStore()
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [regVehicleType, setRegVehicleType] = useState('TEMPO')
  const [regVehicleNumber, setRegVehicleNumber] = useState('')
  const [regLicense, setRegLicense] = useState('')
  const [useFirebase, setUseFirebase] = useState(true) // Whether to try Firebase (disabled after billing error)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = useCallback(async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')

    const fullPhone = `+91${phone}`

    // Try Firebase Phone Auth if configured AND not previously failed due to billing
    if (firebaseAvailable && useFirebase) {
      try {
        const { sendFirebaseOTP: fbSendOTP } = await import('@/lib/firebase/auth')
        const result = await fbSendOTP(fullPhone)
        if (result.success) {
          setStep('otp')
          setCountdown(30)
          setLoading(false)
          return
        }
        // If billing not enabled, disable Firebase and fall through to Prisma OTP
        if (result.billingRequired) {
          setUseFirebase(false)
          console.warn('Firebase Phone Auth requires Blaze plan. Using Prisma OTP instead.')
        }
        // Firebase failed for other reasons, fall through to Prisma
      } catch {
        // Firebase error, fall through
      }
    }

    // Fallback: Use Prisma/API OTP
    try {
      await sendOTP(fullPhone)
      setStep('otp')
      setCountdown(30)
    } catch {
      setStep('otp')
      setCountdown(30)
    } finally {
      setLoading(false)
    }
  }, [phone, useFirebase])

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length < 4) {
      setError('Enter the OTP')
      return
    }
    setLoading(true)
    setError('')

    const fullPhone = `+91${phone}`

    // Try Firebase verification if configured AND not disabled due to billing
    if (firebaseAvailable && useFirebase) {
      try {
        const { verifyFirebaseOTP: fbVerifyOTP } = await import('@/lib/firebase/auth')
        const result = await fbVerifyOTP(otp)
        if (result.success) {
          if (result.isNewUser) {
            setStep('role-select')
          } else if (result.user) {
            // Existing Firebase user - fetch their Firestore data
            const firebaseUser = result.user as { uid: string; phoneNumber?: string; displayName?: string }
            try {
              const { getUser } = await import('@/lib/firebase/firestore')
              const userData = await getUser(firebaseUser.uid)
              if (userData) {
                login({
                  id: firebaseUser.uid,
                  name: userData.name || firebaseUser.displayName || 'User',
                  phone: userData.phone || firebaseUser.phoneNumber || fullPhone,
                  role: userData.role || 'USER',
                  walletBalance: userData.walletBalance || 0,
                  isVerified: userData.isVerified ?? true,
                  isOnline: userData.isOnline ?? false,
                })
                setLoading(false)
                return
              }
            } catch {
              // Firestore lookup failed, go to role-select
            }
            setStep('role-select')
          }
          setLoading(false)
          return
        }
        setError(result.error || 'Firebase verification failed')
      } catch {
        // Fall through to Prisma verification
      }
    }

    // Fallback: Use Prisma/API OTP
    try {
      const result = await verifyOTP(fullPhone, otp)
      if (result.user) {
        login(result.user)
      } else if (result.isNewUser) {
        setStep('role-select')
      }
    } catch {
      setError('Invalid OTP. Please try again')
    } finally {
      setLoading(false)
    }
  }, [otp, phone, login, useFirebase])

  const handleRoleSelect = (role: Role, isAdmin?: boolean) => {
    if (isAdmin && onAdminLogin) {
      onAdminLogin()
      return
    }
    setSelectedRole(role)
    setStep('register')
  }

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    setLoading(true)
    setError('')

    const fullPhone = `+91${phone}`

    // Try Firebase registration if configured AND not disabled due to billing
    if (firebaseAvailable && useFirebase) {
      try {
        const { getCurrentAuthUser, registerFirebaseUser: fbRegister } = await import('@/lib/firebase/auth')
        const firebaseUser = await getCurrentAuthUser()
        if (firebaseUser) {
          const result = await fbRegister({
            uid: firebaseUser.uid,
            name: name.trim(),
            phone: fullPhone,
            role: selectedRole!,
            vehicleType: selectedRole === 'DRIVER' ? regVehicleType : undefined,
            vehicleNumber: selectedRole === 'DRIVER' ? regVehicleNumber : undefined,
            licenseNumber: selectedRole === 'DRIVER' ? regLicense : undefined,
          })
          if (result.success) {
            login({
              id: firebaseUser.uid,
              name: name.trim(),
              phone: fullPhone,
              role: selectedRole!,
              walletBalance: selectedRole === 'DRIVER' ? 0 : 500,
              isVerified: true,
              isOnline: false,
              vehicleType: selectedRole === 'DRIVER' ? regVehicleType : undefined,
              vehicleNumber: selectedRole === 'DRIVER' ? regVehicleNumber : undefined,
              rating: selectedRole === 'DRIVER' ? 0 : undefined,
              totalRides: selectedRole === 'DRIVER' ? 0 : undefined,
              totalEarnings: selectedRole === 'DRIVER' ? 0 : undefined,
              isRegistered: selectedRole === 'DRIVER' ? false : true,
            })
            setLoading(false)
            return
          }
        }
      } catch {
        // Firebase registration failed, fall through
      }
    }

    // Fallback: Use Prisma/API registration
    try {
      const user = await registerUser({
        phone: fullPhone,
        name: name.trim(),
        role: selectedRole!,
        vehicleType: selectedRole === 'DRIVER' ? regVehicleType : undefined,
        vehicleNumber: selectedRole === 'DRIVER' ? regVehicleNumber : undefined,
        licenseNumber: selectedRole === 'DRIVER' ? regLicense : undefined,
      })
      login(user)
    } catch {
      // Fallback mock login
      login({
        id: `${selectedRole?.toLowerCase()}-${Date.now()}`,
        name: name.trim(),
        phone: fullPhone,
        role: selectedRole!,
        walletBalance: selectedRole === 'DRIVER' ? 0 : 500,
        isVerified: true,
        isOnline: false,
        vehicleType: selectedRole === 'DRIVER' ? regVehicleType : undefined,
        vehicleNumber: selectedRole === 'DRIVER' ? regVehicleNumber : undefined,
        rating: selectedRole === 'DRIVER' ? 0 : undefined,
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
      label: 'Passenger',
      sublabel: 'I want to book a ride',
      icon: User,
      emoji: '🧑',
      color: 'emerald',
    },
    {
      role: 'DRIVER' as Role,
      label: 'Driver',
      sublabel: 'I want to drive',
      icon: Truck,
      emoji: '🚗',
      color: 'orange',
    },
    {
      role: 'ADMIN' as Role,
      label: 'Admin',
      sublabel: 'Admin Panel',
      icon: ShieldCheck,
      emoji: '🛡️',
      color: 'slate',
      isAdmin: true,
    },
  ]

  const vehicleOptions = [
    { key: 'TEMPO', label: 'Tempo', emoji: '🛺' },
    { key: 'AUTO', label: 'Auto', emoji: '🚗' },
    { key: 'E_RICKSHAW', label: 'E-Rickshaw', emoji: '🛵' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-orange-50 dark:from-emerald-950 dark:to-gray-900">
      {/* Firebase reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" />

      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg mb-4"
        >
          <div>
            <span className="text-lg font-black text-white">Gram</span>
            <span className="text-lg font-black text-orange-300">Yatri</span>
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Gram<span className="text-orange-500">Yatri</span>
        </h1>
        <p className="text-muted-foreground mt-1">Village Transport, Made Easy</p>

        {/* Firebase status indicator */}
        {firebaseAvailable && useFirebase && (
          <Badge className="mt-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-[10px]">
            <Flame className="h-3 w-3 mr-1" />
            Firebase Connected
          </Badge>
        )}
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
                    Enter Phone Number
                  </CardTitle>
                  <CardDescription>Login with your mobile number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-muted-foreground">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="Mobile number"
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
                    {loading ? 'Sending...' : 'Send OTP'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By logging in, you agree to our Terms of Service
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
                    Verify OTP
                  </CardTitle>
                  <CardDescription>
                    OTP sent to +91{phone}
                    {firebaseAvailable && useFirebase && <Badge className="ml-2 bg-orange-100 text-orange-700 text-[9px] py-0">Firebase</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center py-4">
                    <InputOTP maxLength={firebaseAvailable && useFirebase ? 6 : 4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                        {firebaseAvailable && useFirebase && (
                          <>
                            <InputOTPSlot index={4} className="w-12 h-12 text-xl" />
                            <InputOTPSlot index={5} className="w-12 h-12 text-xl" />
                          </>
                        )}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length < 4}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                    <Shield className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="flex justify-between text-sm">
                    <button
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => { setStep('phone'); setOtp('') }}
                    >
                      Change Number
                    </button>
                    <button
                      className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      onClick={handleSendOTP}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `Resend (${countdown}s)` : 'Resend OTP'}
                    </button>
                  </div>
                  {(!firebaseAvailable || !useFirebase) && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Demo OTP: 1234
                    </p>
                  )}
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
                <h2 className="text-xl font-bold">Who are you?</h2>
                <p className="text-muted-foreground text-sm mt-1">Select your role to continue</p>
              </div>
              <div className="space-y-3">
                {roles.map((r) => (
                  <motion.button
                    key={r.role}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(r.role, (r as typeof r & { isAdmin?: boolean }).isAdmin)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-white dark:bg-gray-800 shadow-md hover:border-emerald-500 transition-all text-left"
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
                    {selectedRole === 'DRIVER' ? <Truck className="h-5 w-5 text-orange-500" /> : selectedRole === 'ADMIN' ? <ShieldCheck className="h-5 w-5 text-slate-600" /> : <User className="h-5 w-5 text-emerald-600" />}
                    {selectedRole === 'DRIVER' ? 'Driver Registration' : selectedRole === 'ADMIN' ? 'Admin Login' : 'Register'}
                  </CardTitle>
                  <CardDescription>Enter your details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRole === 'ADMIN' && (
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Admin access requires a verified admin account. If your number is registered as admin, you&apos;ll get admin access after OTP verification.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError('') }}
                      className="h-12"
                    />
                  </div>
                  {selectedRole === 'DRIVER' && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Vehicle Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {vehicleOptions.map((v) => (
                            <button
                              key={v.key}
                              onClick={() => setRegVehicleType(v.key)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                                regVehicleType === v.key
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                                  : 'border-muted hover:border-orange-500'
                              }`}
                            >
                              <span className="text-2xl">{v.emoji}</span>
                              <span className="text-xs font-medium">{v.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Vehicle Number</label>
                        <Input
                          placeholder="AS-01-AB-1234"
                          value={regVehicleNumber}
                          onChange={(e) => setRegVehicleNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">License Number</label>
                        <Input
                          placeholder="Driving license number"
                          value={regLicense}
                          onChange={(e) => setRegLicense(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your account will be reviewed by admin before approval
                      </p>
                    </>
                  )}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                    onClick={handleRegister}
                    disabled={loading || !name.trim()}
                  >
                    {loading ? (selectedRole === 'ADMIN' ? 'Verifying...' : 'Registering...') : (selectedRole === 'ADMIN' ? 'Continue as Admin' : 'Register')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom - Test Accounts Info */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground">
          GramYatri &copy; 2026 | Village Transport, Made Easy
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Test: User +919876543210 | Driver +918765432101 | Admin +919999999999 / admin123 | OTP: 1234
        </p>
        {firebaseAvailable && useFirebase && (
          <p className="text-[10px] text-orange-500 mt-1">
            🔥 Firebase Auth enabled — real phone OTP verification active
          </p>
        )}
        {firebaseAvailable && !useFirebase && (
          <p className="text-[10px] text-amber-600 mt-1">
            ⚡ Using Prisma OTP (Firebase requires Blaze plan)
          </p>
        )}
      </div>
    </div>
  )
}
