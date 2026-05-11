'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Search, ClipboardList, User as UserIcon,
  MapPin, Navigation, IndianRupee, Clock, Star,
  Phone, Wallet, Shield, ChevronRight, Plus,
  Crosshair, CreditCard, Banknote, Tag, AlertTriangle,
  History, Settings, LogOut, Moon, Sun, Bell, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { calculateFare, bookRide, getRideHistory, addWalletMoney, getWalletTransactions, rateRide } from '@/lib/api'
import SharedRideCard from './SharedRideCard'
import RideCard from './RideCard'
import SharedTempoPanel from './SharedTempoPanel'
import OfflineBookingIndicator from './OfflineBookingIndicator'

type UserTab = 'home' | 'search' | 'rides' | 'profile'

// Mock data for demo
const MOCK_SHARED_RIDES = [
  {
    id: 'sr-1',
    userId: 'u-1',
    pickup: 'গ্রাম বাজার',
    drop: 'জেলা হাসপাতাল',
    vehicleType: 'TEMPO' as const,
    fare: 25,
    baseFare: 15,
    distanceFare: 10,
    distance: 5,
    status: 'IN_PROGRESS' as const,
    paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sr-2',
    userId: 'u-2',
    pickup: 'রেলওয়ে স্টেশন',
    drop: 'কলেজ মোড়',
    vehicleType: 'AUTO' as const,
    fare: 40,
    baseFare: 20,
    distanceFare: 20,
    distance: 8,
    status: 'IN_PROGRESS' as const,
    paymentMethod: 'WALLET' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sr-3',
    userId: 'u-3',
    pickup: 'বাস স্ট্যান্ড',
    drop: 'সরকারি অফিস',
    vehicleType: 'E_RICKSHAW' as const,
    fare: 15,
    baseFare: 10,
    distanceFare: 5,
    distance: 3,
    status: 'SEARCHING' as const,
    paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
  },
]

const MOCK_RIDE_HISTORY = [
  {
    id: 'rh-1',
    userId: 'u-me',
    pickup: 'গ্রাম বাজার',
    drop: 'জেলা হাসপাতাল',
    vehicleType: 'TEMPO' as const,
    fare: 35,
    baseFare: 15,
    distanceFare: 20,
    distance: 5,
    status: 'COMPLETED' as const,
    paymentMethod: 'CASH' as const,
    createdAt: '2026-05-07T10:30:00',
    completedAt: '2026-05-07T11:00:00',
    driverName: 'রামু দাস',
    driverVehicle: 'টেম্পো - AS-01-AB-1234',
    rating: 4,
  },
  {
    id: 'rh-2',
    userId: 'u-me',
    pickup: 'রেলওয়ে স্টেশন',
    drop: 'বাড়ি',
    vehicleType: 'AUTO' as const,
    fare: 55,
    baseFare: 20,
    distanceFare: 35,
    distance: 7,
    status: 'COMPLETED' as const,
    paymentMethod: 'WALLET' as const,
    createdAt: '2026-05-06T18:00:00',
    completedAt: '2026-05-06T18:30:00',
    driverName: 'সুরেন কুমার',
    driverVehicle: 'অটো - AS-02-CD-5678',
    rating: 5,
  },
  {
    id: 'rh-3',
    userId: 'u-me',
    pickup: 'কলেজ',
    drop: 'বাস স্ট্যান্ড',
    vehicleType: 'E_RICKSHAW' as const,
    fare: 20,
    baseFare: 10,
    distanceFare: 10,
    distance: 3,
    status: 'CANCELLED' as const,
    paymentMethod: 'CASH' as const,
    createdAt: '2026-05-05T09:00:00',
  },
]

export default function UserPanel() {
  const { currentUser, activeRide, setActiveRide, logout, updateWalletBalance } = useAppStore()
  const [activeTab, setActiveTab] = useState<UserTab>('home')
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [vehicleType, setVehicleType] = useState('TEMPO')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH')
  const [offerCode, setOfferCode] = useState('')
  const [distance, setDistance] = useState(5)
  const [searching, setSearching] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [rideHistory, setRideHistory] = useState(MOCK_RIDE_HISTORY)
  // Initialize dark mode state from DOM class
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })
  const [showSharedTempo, setShowSharedTempo] = useState(false)

  const fare = calculateFare(vehicleType, distance)

  const handleSearchRide = async () => {
    if (!pickup || !drop) return
    setSearching(true)
    try {
      const ride = await bookRide({
        pickup, drop, vehicleType, paymentMethod,
        offerCode: offerCode || undefined,
        fare: fare.total,
      })
      setActiveRide(ride)
    } catch {
      // Mock: simulate ride found
      setTimeout(() => {
        setActiveRide({
          id: `ride-${Date.now()}`,
          userId: currentUser?.id || 'u-me',
          driverId: 'd-1',
          pickup,
          drop,
          vehicleType: vehicleType as 'TEMPO' | 'AUTO' | 'E_RICKSHAW',
          fare: fare.total,
          baseFare: fare.baseFare,
          distanceFare: fare.distanceFare,
          distance,
          status: 'ACCEPTED',
          paymentMethod,
          createdAt: new Date().toISOString(),
          driverName: 'রামু দাস',
          driverPhone: '+919876543210',
          driverVehicle: `${vehicleType === 'TEMPO' ? 'টেম্পো' : vehicleType === 'AUTO' ? 'অটো' : 'ই-রিক্শা'} - AS-01-AB-1234`,
        })
        setSearching(false)
        setActiveTab('rides')
      }, 2000)
      return
    }
    setSearching(false)
  }

  const handleEmergency = () => {
    setShowEmergencyDialog(true)
    // In real app: call emergency API
  }

  const handleAddMoney = async () => {
    const amount = parseInt(addMoneyAmount)
    if (!amount || amount <= 0) return
    try {
      const result = await addWalletMoney(amount)
      updateWalletBalance(result.balance)
    } catch {
      updateWalletBalance((currentUser?.walletBalance || 0) + amount)
    }
    setAddMoneyAmount('')
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const handleRateRide = async (rideId: string, rating: number) => {
    try {
      await rateRide(rideId, rating)
    } catch {
      // Mock
    }
    setRideHistory(prev => prev.map(r => r.id === rideId ? { ...r, rating } : r))
  }

  const tabs = [
    { key: 'home' as UserTab, label: 'হোম', icon: Home },
    { key: 'search' as UserTab, label: 'খোঁজ', icon: Search },
    { key: 'rides' as UserTab, label: 'যাত্রা', icon: ClipboardList },
    { key: 'profile' as UserTab, label: 'প্রোফাইল', icon: UserIcon },
  ]

  const vehicleOptions = [
    { key: 'TEMPO', label: 'টেম্পো', emoji: '🛺', desc: '₹১৫ + ₹৮/কিমি' },
    { key: 'AUTO', label: 'অটো', emoji: '🚗', desc: '₹২০ + ₹১২/কিমি' },
    { key: 'E_RICKSHAW', label: 'ই-রিক্শা', emoji: '🛵', desc: '₹১০ + ₹৬/কিমি' },
  ]

  // Show SharedTempoPanel as full-screen overlay
  if (showSharedTempo) {
    return <SharedTempoPanel onBack={() => setShowSharedTempo(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Offline Booking Indicator */}
      <OfflineBookingIndicator />

      {/* Main Content */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    নমস্কার, {currentUser?.name || 'যাত্রী'} 👋
                  </h2>
                  <p className="text-muted-foreground text-sm">আজ কোথায় যাবেন?</p>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                    {(currentUser?.name || 'য')[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Quick Booking Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-4">কোথায় যাবেন?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg p-3">
                      <Crosshair className="h-4 w-4 text-emerald-200" />
                      <input
                        type="text"
                        placeholder="পিকআপ লোকেশন"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="bg-transparent placeholder:text-white/60 text-white text-sm w-full outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg p-3">
                      <MapPin className="h-4 w-4 text-orange-300" />
                      <input
                        type="text"
                        placeholder="কোথায় যাবেন?"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        className="bg-transparent placeholder:text-white/60 text-white text-sm w-full outline-none"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 bg-white text-emerald-700 hover:bg-white/90 font-bold"
                    onClick={() => setActiveTab('search')}
                  >
                    যাত্রা খুঁজুন
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Vehicle Type Quick Select */}
              <div>
                <h3 className="font-semibold text-sm mb-2">গাড়ি নির্বাচন</h3>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleOptions.map((v) => (
                    <motion.button
                      key={v.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVehicleType(v.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        vehicleType === v.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                          : 'border-transparent bg-card shadow-sm'
                      }`}
                    >
                      <span className="text-2xl">{v.emoji}</span>
                      <span className="text-xs font-medium">{v.label}</span>
                      <span className="text-[10px] text-muted-foreground">{v.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Active Ride */}
              {activeRide && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">সক্রিয় যাত্রা</h3>
                  <RideCard
                    ride={activeRide}
                    variant="active"
                    onAction={(action) => {
                      if (action === 'emergency') handleEmergency()
                    }}
                  />
                </div>
              )}

              {/* Nearby Shared Rides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">কাছাকাছি শেয়ার যাত্রা</h3>
                  <button className="text-xs text-emerald-600 font-medium" onClick={() => setShowSharedTempo(true)}>
                    সব দেখুন →
                  </button>
                </div>
                <div className="space-y-2">
                  {MOCK_SHARED_RIDES.slice(0, 2).map((ride) => (
                    <SharedRideCard key={ride.id} ride={ride} onJoin={() => {}} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SEARCH/BOOK TAB */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Map Placeholder */}
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100 dark:from-emerald-950 dark:to-orange-950 border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(rgba(22,163,74,0.3) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(22,163,74,0.3) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }} />
                <div className="text-center z-10">
                  <Navigation className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">ম্যাপ ভিউ</span>
                </div>
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MapPin className="h-6 w-6 text-orange-500" />
                </motion.div>
              </div>

              {/* Pickup/Drop */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div className="w-0.5 h-8 bg-muted" />
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="পিকআপ লোকেশন"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                      />
                      <Input
                        placeholder="ড্রপ লোকেশন"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Crosshair className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Type */}
              <div>
                <h3 className="font-semibold text-sm mb-2">গাড়ির ধরন</h3>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleOptions.map((v) => (
                    <motion.button
                      key={v.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setVehicleType(v.key) }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        vehicleType === v.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                          : 'border-transparent bg-card shadow-sm'
                      }`}
                    >
                      <span className="text-2xl">{v.emoji}</span>
                      <span className="text-xs font-medium">{v.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Distance Slider */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">দূরত্ব</span>
                    <span className="text-sm text-muted-foreground">{distance} কিমি</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </CardContent>
              </Card>

              {/* Fare Breakdown */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">ভাড়া বিবরণ</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">মূল ভাড়া</span>
                      <span>₹{fare.baseFare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">দূরত্ব ভাড়া ({distance} কিমি × ₹{vehicleType === 'TEMPO' ? 8 : vehicleType === 'AUTO' ? 12 : 6})</span>
                      <span>₹{fare.distanceFare}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>মোট ভাড়া</span>
                      <span className="text-emerald-600">₹{fare.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Code & Payment */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-500" />
                    <Input
                      placeholder="অফার কোড"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">প্রয়োগ</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">পেমেন্ট পদ্ধতি</span>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                          paymentMethod === 'CASH'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                            : 'border-transparent bg-muted'
                        }`}
                      >
                        <Banknote className="h-3 w-3" />
                        নগদ
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod('WALLET')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                          paymentMethod === 'WALLET'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                            : 'border-transparent bg-muted'
                        }`}
                      >
                        <Wallet className="h-3 w-3" />
                        ওয়ালেট
                      </motion.button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Book Button */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-bold"
                onClick={handleSearchRide}
                disabled={searching || !pickup || !drop}
              >
                {searching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Clock className="h-5 w-5" />
                  </motion.div>
                ) : null}
                {searching ? 'চালক খোঁজা হচ্ছে...' : 'যাত্রা বুক করুন'}
              </Button>
            </motion.div>
          )}

          {/* RIDES TAB */}
          {activeTab === 'rides' && (
            <motion.div
              key="rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Active Ride */}
              {activeRide && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    সক্রিয় যাত্রা
                  </h3>
                  <RideCard
                    ride={activeRide}
                    variant="active"
                    onAction={(action) => {
                      if (action === 'emergency') handleEmergency()
                      if (action === 'call') {
                        alert(`কল করা হচ্ছে: ${activeRide.driverPhone}`)
                      }
                    }}
                  />
                  {/* Tracking progress */}
                  <Card className="border-0 shadow-md mt-3">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>চালক আসছেন</span>
                        <span>৩ মিনিট</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Ride History */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  যাত্রার ইতিহাস
                </h3>
                <div className="space-y-3">
                  {rideHistory.map((ride) => (
                    <RideCard
                      key={ride.id}
                      ride={ride}
                      variant="history"
                      onRate={handleRateRide}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* User Info */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                        {(currentUser?.name || 'য')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{currentUser?.name || 'যাত্রী'}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.phone}</p>
                      <Badge className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        যাত্রী
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold">ওয়ালেট</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600">
                      ₹{currentUser?.walletBalance || 0}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="পরিমাণ"
                        value={addMoneyAmount}
                        onChange={(e) => setAddMoneyAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleAddMoney}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[100, 200, 500].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setAddMoneyAmount(String(amt))}
                      >
                        ₹{amt}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    জরুরি পরিচিতি
                  </h4>
                  <div className="space-y-2">
                    {['পুলিশ - 100', 'অ্যাম্বুলেন্স - 108', 'মহিলা হেল্পলাইন - 1091'].map((contact) => (
                      <div key={contact} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="text-sm">{contact}</span>
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    সেটিংস
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span className="text-sm">ডার্ক মোড</span>
                    </div>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">বিজ্ঞপ্তি</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Logout */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                লগআউট
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="userTabIndicator"
                    className="w-1 h-1 rounded-full bg-emerald-600"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              জরুরি সাহায্য
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">আপনি কি নিশ্চিত যে আপনার জরুরি সাহায্য দরকার?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  alert('জরুরি সাহায্যের অনুরোধ পাঠানো হয়েছে! পুলিশ এবং জরুরি পরিচিতিদের জানানো হয়েছে।')
                  setShowEmergencyDialog(false)
                }}
              >
                জরুরি SOS
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmergencyDialog(false)}
              >
                বাতিল
              </Button>
            </div>
            <div className="space-y-2 pt-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" /> পুলিশ - 100
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" /> অ্যাম্বুলেন্স - 108
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
