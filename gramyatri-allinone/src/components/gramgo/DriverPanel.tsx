'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Car, IndianRupee, User as UserIcon,
  MapPin, Phone, Star, Clock, Navigation,
  Power, PowerOff, Wallet, ChevronRight,
  TrendingUp, ArrowDownToLine, Camera, FileText,
  LogOut, CheckCircle, XCircle, AlertTriangle,
  BarChart3, Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import RideCard from './RideCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type DriverTab = 'home' | 'rides' | 'earnings' | 'profile'

// Mock earnings data
const MOCK_EARNINGS_DATA = [
  { day: 'সোম', amount: 850 },
  { day: 'মঙ্গল', amount: 620 },
  { day: 'বুধ', amount: 940 },
  { day: 'বৃহঃ', amount: 780 },
  { day: 'শুক্র', amount: 1100 },
  { day: 'শনি', amount: 950 },
  { day: 'রবি', amount: 450 },
]

const MOCK_INCOMING_RIDES = [
  {
    id: 'in-1',
    userId: 'u-1',
    pickup: 'গ্রাম বাজার, ময়দান',
    drop: 'জেলা হাসপাতাল',
    vehicleType: 'TEMPO' as const,
    fare: 35,
    baseFare: 15,
    distanceFare: 20,
    distance: 5,
    status: 'SEARCHING' as const,
    paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
    userName: 'অরুণ দাস',
    userPhone: '+919876543210',
  },
  {
    id: 'in-2',
    userId: 'u-2',
    pickup: 'রেলওয়ে স্টেশন',
    drop: 'কলেজ মোড়',
    vehicleType: 'AUTO' as const,
    fare: 60,
    baseFare: 20,
    distanceFare: 40,
    distance: 8,
    status: 'SEARCHING' as const,
    paymentMethod: 'WALLET' as const,
    createdAt: new Date().toISOString(),
    userName: 'প্রিয়া শর্মা',
    userPhone: '+919876543211',
  },
]

const MOCK_RIDE_HISTORY = [
  {
    id: 'drh-1',
    userId: 'u-1',
    driverId: 'd-me',
    pickup: 'গ্রাম বাজার',
    drop: 'হাসপাতাল',
    vehicleType: 'TEMPO' as const,
    fare: 35,
    baseFare: 15,
    distanceFare: 20,
    distance: 5,
    status: 'COMPLETED' as const,
    paymentMethod: 'CASH' as const,
    createdAt: '2026-05-07T10:30:00',
    completedAt: '2026-05-07T11:00:00',
    userName: 'অরুণ দাস',
    rating: 5,
  },
  {
    id: 'drh-2',
    userId: 'u-2',
    driverId: 'd-me',
    pickup: 'স্টেশন',
    drop: 'বাজার',
    vehicleType: 'TEMPO' as const,
    fare: 45,
    baseFare: 15,
    distanceFare: 30,
    distance: 6,
    status: 'COMPLETED' as const,
    paymentMethod: 'WALLET' as const,
    createdAt: '2026-05-07T14:00:00',
    completedAt: '2026-05-07T14:25:00',
    userName: 'মীনা দেবী',
    rating: 4,
  },
]

export default function DriverPanel() {
  const { currentUser, isOnline, setOnline, activeRide, setActiveRide, addIncomingRide, removeIncomingRide, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState<DriverTab>('home')
  const [incomingRides, setIncomingRides] = useState(MOCK_INCOMING_RIDES)
  const [rideHistory, setRideHistory] = useState(MOCK_RIDE_HISTORY)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('UPI')
  const [upiId, setUpiId] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [showRegForm, setShowRegForm] = useState(!currentUser?.isRegistered)
  const [regVehicleType, setRegVehicleType] = useState(currentUser?.vehicleType || 'TEMPO')
  const [regVehicleNumber, setRegVehicleNumber] = useState(currentUser?.vehicleNumber || '')
  const [regLicense, setRegLicense] = useState('')
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('week')

  const todayEarnings = 450
  const weekEarnings = 5690
  const monthEarnings = 18500
  const todayRides = 6
  const weekRides = 42
  const monthRides = 156

  const handleAcceptRide = (rideId: string) => {
    const ride = incomingRides.find(r => r.id === rideId)
    if (ride) {
      setActiveRide({ ...ride, status: 'ACCEPTED', driverId: currentUser?.id })
      setIncomingRides(prev => prev.filter(r => r.id !== rideId))
      setActiveTab('rides')
    }
  }

  const handleRejectRide = (rideId: string) => {
    setIncomingRides(prev => prev.filter(r => r.id !== rideId))
  }

  const handleCompleteRide = () => {
    if (activeRide) {
      setActiveRide({ ...activeRide, status: 'COMPLETED', completedAt: new Date().toISOString() })
      setTimeout(() => setActiveRide(null), 2000)
    }
  }

  const handleRegister = () => {
    // Mock registration
    setShowRegForm(false)
  }

  const tabs = [
    { key: 'home' as DriverTab, label: 'হোম', icon: Home },
    { key: 'rides' as DriverTab, label: 'যাত্রা', icon: Car },
    { key: 'earnings' as DriverTab, label: 'আয়', icon: IndianRupee },
    { key: 'profile' as DriverTab, label: 'প্রোফাইল', icon: UserIcon },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
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
              {/* Online/Offline Toggle */}
              <Card className={`border-0 shadow-lg overflow-hidden ${isOnline ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 'bg-gradient-to-br from-gray-600 to-gray-500'} text-white`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{isOnline ? 'অনলাইন' : 'অফলাইন'}</h3>
                      <p className="text-white/80 text-sm">
                        {isOnline ? 'আপনি যাত্রা পাবেন' : 'যাত্রা পেতে অনলাইন হন'}
                      </p>
                    </div>
                    <button
                      onClick={() => setOnline(!isOnline)}
                      className={`w-16 h-9 rounded-full transition-all flex items-center ${
                        isOnline ? 'bg-white justify-end' : 'bg-white/30 justify-start'
                      } p-1`}
                    >
                      <motion.div
                        layout
                        className={`w-7 h-7 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-gray-400'} flex items-center justify-center`}
                      >
                        {isOnline ? <Power className="h-4 w-4 text-white" /> : <PowerOff className="h-4 w-4 text-white" />}
                      </motion.div>
                    </button>
                  </div>

                  {isOnline && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                        <span className="text-sm">যাত্রার জন্য অপেক্ষা করছেন...</span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Current Location */}
              {isOnline && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-muted-foreground">বর্তমান অবস্থান:</span>
                      <span className="text-sm font-medium">গ্রাম বাজার, ময়দান</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 text-center">
                    <Car className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{todayRides}</div>
                    <div className="text-xs text-muted-foreground">আজকের যাত্রা</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold">₹{todayEarnings}</div>
                    <div className="text-xs text-muted-foreground">আজকের আয়</div>
                  </CardContent>
                </Card>
              </div>

              {/* Incoming Ride Requests */}
              {isOnline && incomingRides.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-2 bg-orange-500 rounded-full"
                    />
                    নতুন যাত্রার অনুরোধ ({incomingRides.length})
                  </h3>
                  <div className="space-y-3">
                    {incomingRides.map((ride) => (
                      <RideCard
                        key={ride.id}
                        ride={ride}
                        variant="incoming"
                        onAction={(action, rideId) => {
                          if (action === 'accept') handleAcceptRide(rideId)
                          if (action === 'reject') handleRejectRide(rideId)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Waiting animation when online and no rides */}
              {isOnline && incomingRides.length === 0 && !activeRide && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <span className="text-5xl">🛺</span>
                  </motion.div>
                  <p className="text-muted-foreground mt-3 text-sm">যাত্রার অনুরোধের জন্য অপেক্ষা করছেন...</p>
                </motion.div>
              )}
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
                      if (action === 'call') alert(`কল: ${activeRide.userPhone}`)
                      if (action === 'navigate') alert('নেভিগেশন শুরু হচ্ছে...')
                      if (action === 'emergency') alert('জরুরি সাহায্য পাঠানো হয়েছে!')
                    }}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleCompleteRide}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      যাত্রা সম্পন্ন
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setActiveRide(null)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      বাতিল
                    </Button>
                  </div>
                </div>
              )}

              {/* Incoming Requests */}
              {incomingRides.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">আসন্ন অনুরোধ</h3>
                  <div className="space-y-3">
                    {incomingRides.map((ride) => (
                      <RideCard
                        key={ride.id}
                        ride={ride}
                        variant="incoming"
                        onAction={(action, rideId) => {
                          if (action === 'accept') handleAcceptRide(rideId)
                          if (action === 'reject') handleRejectRide(rideId)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Ride History */}
              <div>
                <h3 className="font-semibold text-sm mb-2">যাত্রার ইতিহাস</h3>
                <div className="space-y-3">
                  {rideHistory.map((ride) => (
                    <RideCard key={ride.id} ride={ride} variant="history" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* EARNINGS TAB */}
          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Period Selector */}
              <div className="flex gap-2">
                {[
                  { key: 'today' as const, label: 'আজ' },
                  { key: 'week' as const, label: 'সপ্তাহ' },
                  { key: 'month' as const, label: 'মাস' },
                ].map((p) => (
                  <Button
                    key={p.key}
                    variant={earningsPeriod === p.key ? 'default' : 'outline'}
                    size="sm"
                    className={earningsPeriod === p.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    onClick={() => setEarningsPeriod(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Earnings Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">মোট আয়</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      ₹{earningsPeriod === 'today' ? todayEarnings : earningsPeriod === 'week' ? weekEarnings : monthEarnings}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">মোট যাত্রা</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {earningsPeriod === 'today' ? todayRides : earningsPeriod === 'week' ? weekRides : monthRides}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Earnings Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    দৈনিক আয়
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_EARNINGS_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="day" fontSize={10} tickLine={false} />
                        <YAxis fontSize={10} tickLine={false} />
                        <Tooltip
                          formatter={(value: number) => [`₹${value}`, 'আয়']}
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Withdraw */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">উত্তোলনযোগ্য</h4>
                      <p className="text-xl font-bold text-emerald-600">₹{weekEarnings}</p>
                    </div>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => setShowWithdrawDialog(true)}
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      উত্তোলন
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal History */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">উত্তোলন ইতিহাস</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { date: '০৫ মে', amount: 5000, status: 'সম্পন্ন' },
                      { date: '২৮ এপ্রি', amount: 3000, status: 'সম্পন্ন' },
                      { date: '২০ এপ্রি', amount: 4000, status: 'প্রক্রিয়াধীন' },
                    ].map((w, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{w.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{w.amount}</span>
                          <Badge variant={w.status === 'সম্পন্ন' ? 'secondary' : 'outline'} className="text-xs">
                            {w.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
              {/* Driver Info */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">
                        {(currentUser?.name || 'চ')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{currentUser?.name || 'চালক'}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                          চালক
                        </Badge>
                        {currentUser?.vehicleType && (
                          <Badge variant="outline">
                            {currentUser.vehicleType === 'TEMPO' ? '🛺' : currentUser.vehicleType === 'AUTO' ? '🚗' : '🛵'} {currentUser.vehicleNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Form (if not registered) */}
              {showRegForm && (
                <Card className="border-0 shadow-md border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                      চালক নিবন্ধন
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">গাড়ির ধরন</label>
                      <Select value={regVehicleType} onValueChange={setRegVehicleType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEMPO">🛺 টেম্পো</SelectItem>
                          <SelectItem value="AUTO">🚗 অটো</SelectItem>
                          <SelectItem value="E_RICKSHAW">🛵 ই-রিক্শা</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">গাড়ি নম্বর</label>
                      <Input
                        placeholder="AS-01-AB-1234"
                        value={regVehicleNumber}
                        onChange={(e) => setRegVehicleNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">লাইসেন্স নম্বর</label>
                      <Input
                        placeholder="ড্রাইভিং লাইসেন্স নম্বর"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">ছবি</label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">ছবি আপলোড করুন</p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleRegister}
                    >
                      নিবন্ধন জমা দিন
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Rating & Stats */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold">{currentUser?.rating || 4.5}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">রেটিং</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{currentUser?.totalRides || 128}</div>
                      <div className="text-xs text-muted-foreground">মোট যাত্রা</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">₹{(currentUser?.totalEarnings || 45000).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">মোট আয়</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logout */}
              <Button variant="destructive" className="w-full" onClick={logout}>
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
                  isActive ? 'text-orange-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="driverTabIndicator"
                    className="w-1 h-1 rounded-full bg-orange-600"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-orange-500" />
              আয় উত্তোলন
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">পরিমাণ</label>
              <Input
                type="number"
                placeholder="₹ পরিমাণ"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">পদ্ধতি</label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK">ব্যাংক ট্রান্সফার</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {withdrawMethod === 'UPI' ? (
              <div>
                <label className="text-sm font-medium mb-1 block">UPI ID</label>
                <Input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">ব্যাংক অ্যাকাউন্ট</label>
                  <Input
                    placeholder="অ্যাকাউন্ট নম্বর"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">IFSC কোড</label>
                  <Input
                    placeholder="IFSC কোড"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                  />
                </div>
              </>
            )}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                alert(`₹${withdrawAmount} উত্তোলনের অনুরোধ পাঠানো হয়েছে`)
                setShowWithdrawDialog(false)
                setWithdrawAmount('')
              }}
            >
              উত্তোলন অনুরোধ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
