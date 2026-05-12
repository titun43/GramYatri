'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, Phone, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { adminLogin } from '@/lib/api'

export default function AdminLoginScreen({ onBack }: { onBack: () => void }) {
  const { login } = useAppStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    if (!password.trim()) {
      setError('Enter your admin password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await adminLogin(`+91${phone}`, password)
      if (result.success && result.user) {
        login({
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          role: 'ADMIN',
          walletBalance: 0,
          isVerified: result.user.isVerified,
        })
      } else {
        setError(result.message || 'Invalid admin credentials')
      }
    } catch {
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && phone.length === 10 && password.trim()) {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-orange-50 dark:from-emerald-950 dark:to-gray-900">
      {/* Header */}
      <div className="pt-12 pb-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 mb-4"
        >
          <Shield className="h-10 w-10 text-white" />
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Gram<span className="text-orange-500">Yatri</span> Admin
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-muted-foreground mt-1"
        >
          Secure Admin Access
        </motion.p>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 pb-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                Admin Login
              </CardTitle>
              <CardDescription>Sign in with your admin credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      placeholder="Admin phone number"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setPhone(val)
                        setError('')
                      }}
                      onKeyDown={handleKeyDown}
                      className="pl-9 h-12 text-base"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Admin password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    onKeyDown={handleKeyDown}
                    className="pl-9 pr-10 h-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Login Button */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
                onClick={handleLogin}
                disabled={loading || phone.length !== 10 || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <Lock className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Back to Login Link */}
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 transition-colors py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
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
