'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users as UsersIcon, Car, IndianRupee,
  MoreHorizontal, Bell, AlertTriangle, MapPin, Phone,
  Star, Clock, Navigation, Shield, CheckCircle, XCircle,
  TrendingUp, Wallet, LogOut, Settings, Search, Tag,
  Ban, Eye, ChevronRight, Plus, Send, FileText,
  BarChart3, Sliders, Truck, Bike, Megaphone,
  MessageSquare, CircleDollarSign, UserCheck, UserX,
  ArrowUpRight, ArrowDownRight, Activity
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
import {
  getAdminDashboard, getPendingDrivers, approveDriver, rejectDriver,
  getUsers, blockUser, unblockUser, getActiveRides, updateCommission,
  createOffer, getOffers, toggleOffer, getDisputes, resolveDispute,
  broadcastNotification, getFareConfig, updateFareConfig, getPlatformEarnings
} from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'

type AdminTab = 'dashboard' | 'drivers' | 'rides' | 'finance' | 'more'
type MoreSubTab = 'users' | 'notifications' | 'disputes'

// ─── Mock Data ───────────────────────────────────────────

const MOCK_RIDES_PER_DAY = [
  { date: 'সোম', count: 42 },
  { date: 'মঙ্গল', count: 38 },
  { date: 'বুধ', count: 55 },
  { date: 'বৃহঃ', count: 47 },
  { date: 'শুক্র', count: 63 },
  { date: 'শনি', count: 58 },
  { date: 'রবি', count: 31 },
]

const MOCK_REVENUE_PER_DAY = [
  { date: 'সোম', revenue: 4200 },
  { date: 'মঙ্গল', revenue: 3800 },
  { date: 'বুধ', revenue: 5500 },
  { date: 'বৃহঃ', revenue: 4700 },
  { date: 'শুক্র', revenue: 6300 },
  { date: 'শনি', revenue: 5800 },
  { date: 'রবি', revenue: 3100 },
]

const MOCK_PENDING_DRIVERS = [
  {
    id: 'pd-1', name: 'গোপাল দাস', phone: '+919876543001',
    role: 'DRIVER' as const, walletBalance: 0, isVerified: true, isOnline: false,
    vehicleType: 'TEMPO', vehicleNumber: 'AS-01-GH-5678', licenseNumber: 'DL-2024-001',
    isRegistered: true, isBlocked: false, rating: 0, totalRides: 0, totalEarnings: 0,
  },
  {
    id: 'pd-2', name: 'সুমন রায়', phone: '+919876543002',
    role: 'DRIVER' as const, walletBalance: 0, isVerified: true, isOnline: false,
    vehicleType: 'AUTO', vehicleNumber: 'AS-02-IJ-9012', licenseNumber: 'DL-2024-002',
    isRegistered: true, isBlocked: false, rating: 0, totalRides: 0, totalEarnings: 0,
  },
  {
    id: 'pd-3', name: 'অনিল সরকার', phone: '+919876543003',
    role: 'DRIVER' as const, walletBalance: 0, isVerified: true, isOnline: false,
    vehicleType: 'E_RICKSHAW', vehicleNumber: 'AS-03-KL-3456', licenseNumber: 'DL-2024-003',
    isRegistered: true, isBlocked: false, rating: 0, totalRides: 0, totalEarnings: 0,
  },
  {
    id: 'pd-4', name: 'বিজয় কুমার', phone: '+919876543004',
    role: 'DRIVER' as const, walletBalance: 0, isVerified: true, isOnline: false,
    vehicleType: 'TEMPO', vehicleNumber: 'AS-04-MN-7890', licenseNumber: 'DL-2024-004',
    isRegistered: true, isBlocked: false, rating: 0, totalRides: 0, totalEarnings: 0,
  },
  {
    id: 'pd-5', name: 'তপন ঘোষ', phone: '+919876543005',
    role: 'DRIVER' as const, walletBalance: 0, isVerified: true, isOnline: false,
    vehicleType: 'AUTO', vehicleNumber: 'AS-05-OP-1234', licenseNumber: 'DL-2024-005',
    isRegistered: true, isBlocked: false, rating: 0, totalRides: 0, totalEarnings: 0,
  },
]

const MOCK_USERS = [
  { id: 'u-1', name: 'অরুণ দাস', phone: '+919876543210', role: 'USER' as const, walletBalance: 350, isVerified: true, isOnline: true, totalRides: 24, isBlocked: false, isRegistered: true, rating: 4.5, totalEarnings: 0 },
  { id: 'u-2', name: 'প্রিয়া শর্মা', phone: '+919876543211', role: 'USER' as const, walletBalance: 120, isVerified: true, isOnline: true, totalRides: 18, isBlocked: false, isRegistered: true, rating: 4.8, totalEarnings: 0 },
  { id: 'u-3', name: 'রাজেশ কুমার', phone: '+919876543212', role: 'USER' as const, walletBalance: 500, isVerified: true, isOnline: false, totalRides: 42, isBlocked: false, isRegistered: true, rating: 4.2, totalEarnings: 0 },
  { id: 'u-4', name: 'মীনা দেবী', phone: '+919876543213', role: 'USER' as const, walletBalance: 80, isVerified: true, isOnline: true, totalRides: 12, isBlocked: false, isRegistered: true, rating: 4.9, totalEarnings: 0 },
  { id: 'u-5', name: 'সঞ্জয় মণ্ডল', phone: '+919876543214', role: 'USER' as const, walletBalance: 0, isVerified: true, isOnline: false, totalRides: 6, isBlocked: true, isRegistered: true, rating: 3.1, totalEarnings: 0 },
  { id: 'u-6', name: 'নিখিল রায়', phone: '+919876543215', role: 'USER' as const, walletBalance: 250, isVerified: true, isOnline: true, totalRides: 31, isBlocked: false, isRegistered: true, rating: 4.6, totalEarnings: 0 },
  { id: 'u-7', name: 'শ্রাবন্তী পাল', phone: '+919876543216', role: 'USER' as const, walletBalance: 175, isVerified: true, isOnline: false, totalRides: 9, isBlocked: false, isRegistered: true, rating: 4.3, totalEarnings: 0 },
  { id: 'u-8', name: 'দীপক ঘোষ', phone: '+919876543217', role: 'USER' as const, walletBalance: 420, isVerified: true, isOnline: true, totalRides: 55, isBlocked: false, isRegistered: true, rating: 4.7, totalEarnings: 0 },
  { id: 'u-9', name: 'অনিতা দাস', phone: '+919876543218', role: 'USER' as const, walletBalance: 60, isVerified: true, isOnline: false, totalRides: 3, isBlocked: false, isRegistered: true, rating: 5.0, totalEarnings: 0 },
  { id: 'u-10', name: 'তাপস সরকার', phone: '+919876543219', role: 'USER' as const, walletBalance: 0, isVerified: false, isOnline: false, totalRides: 0, isBlocked: true, isRegistered: true, rating: 0, totalEarnings: 0 },
]

const MOCK_ACTIVE_RIDES = [
  {
    id: 'ar-1', userId: 'u-1', driverId: 'd-1',
    pickup: 'গ্রাম বাজার', drop: 'জেলা হাসপাতাল',
    vehicleType: 'TEMPO' as const, fare: 35, baseFare: 15, distanceFare: 20,
    distance: 5, status: 'IN_PROGRESS' as const, paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
    driverName: 'রামু দাস', userName: 'অরুণ দাস',
    driverPhone: '+919876543001', userPhone: '+919876543210',
  },
  {
    id: 'ar-2', userId: 'u-2', driverId: 'd-2',
    pickup: 'রেলওয়ে স্টেশন', drop: 'কলেজ মোড়',
    vehicleType: 'AUTO' as const, fare: 60, baseFare: 20, distanceFare: 40,
    distance: 8, status: 'ACCEPTED' as const, paymentMethod: 'WALLET' as const,
    createdAt: new Date().toISOString(),
    driverName: 'সুরেন কুমার', userName: 'প্রিয়া শর্মা',
    driverPhone: '+919876543002', userPhone: '+919876543211',
  },
  {
    id: 'ar-3', userId: 'u-3', driverId: 'd-3',
    pickup: 'বাস স্ট্যান্ড', drop: 'সরকারি অফিস',
    vehicleType: 'E_RICKSHAW' as const, fare: 20, baseFare: 10, distanceFare: 10,
    distance: 3, status: 'IN_PROGRESS' as const, paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
    driverName: 'কালু মাঝি', userName: 'রাজেশ কুমার',
    driverPhone: '+919876543003', userPhone: '+919876543212',
  },
  {
    id: 'ar-4', userId: 'u-4', driverId: 'd-1',
    pickup: 'হাসপাতাল গেট', drop: 'বাজার চৌরাস্তা',
    vehicleType: 'TEMPO' as const, fare: 45, baseFare: 15, distanceFare: 30,
    distance: 6, status: 'SEARCHING' as const, paymentMethod: 'CASH' as const,
    createdAt: new Date().toISOString(),
    driverName: '', userName: 'মীনা দেবী',
  },
  {
    id: 'ar-5', userId: 'u-6', driverId: 'd-4',
    pickup: 'কলেজ', drop: 'স্টেশন রোড',
    vehicleType: 'AUTO' as const, fare: 80, baseFare: 20, distanceFare: 60,
    distance: 10, status: 'IN_PROGRESS' as const, paymentMethod: 'WALLET' as const,
    createdAt: new Date().toISOString(),
    driverName: 'হরিচরণ দাস', userName: 'নিখিল রায়',
    driverPhone: '+919876543004', userPhone: '+919876543215',
  },
]

const MOCK_RECENT_RIDES = [
  { id: 'rr-1', userName: 'অরুণ দাস', driverName: 'রামু দাস', fare: 35, status: 'COMPLETED', pickup: 'বাজার', drop: 'হাসপাতাল', createdAt: '১০:৩০ AM' },
  { id: 'rr-2', userName: 'প্রিয়া শর্মা', driverName: 'সুরেন কুমার', fare: 55, status: 'COMPLETED', pickup: 'স্টেশন', drop: 'কলেজ', createdAt: '০৯:১৫ AM' },
  { id: 'rr-3', userName: 'রাজেশ কুমার', driverName: 'কালু মাঝি', fare: 20, status: 'CANCELLED', pickup: 'বাস স্ট্যান্ড', drop: 'অফিস', createdAt: '০৮:৪৫ AM' },
  { id: 'rr-4', userName: 'মীনা দেবী', driverName: 'রামু দাস', fare: 45, status: 'COMPLETED', pickup: 'হাসপাতাল', drop: 'বাজার', createdAt: '০৮:০০ AM' },
]

const MOCK_OFFERS = [
  { id: 'of-1', code: 'GRAM10', discount: 10, type: 'PERCENTAGE', active: true, usageCount: 128, maxDiscount: 50, validUntil: '2026-06-30' },
  { id: 'of-2', code: 'FIRST20', discount: 20, type: 'FLAT', active: true, usageCount: 56, maxDiscount: 20, validUntil: '2026-05-31' },
  { id: 'of-3', code: 'SUMMER15', discount: 15, type: 'PERCENTAGE', active: false, usageCount: 0, maxDiscount: 75, validUntil: '2026-07-31' },
]

const MOCK_DISPUTES = [
  {
    id: 'dp-1', rideId: 'rr-3', userId: 'u-3', userName: 'রাজেশ কুমার',
    description: 'চালক ভাড়া বেশি নিয়েছে, মিটারে ₹৩৫ ছিল কিন্তু ₹৫০ চেয়েছে',
    status: 'OPEN', createdAt: '2026-05-07T14:30:00',
  },
  {
    id: 'dp-2', rideId: 'rr-5', userId: 'u-6', userName: 'নিখিল রায়',
    description: 'চালক অশোভন আচরণ করেছে এবং ভুল রাস্তায় নিয়ে গেছে',
    status: 'OPEN', createdAt: '2026-05-07T11:00:00',
  },
  {
    id: 'dp-3', rideId: 'rr-8', userId: 'u-2', userName: 'প্রিয়া শর্মা',
    description: 'যাত্রা বাতিলের পরেও ওয়ালেট থেকে টাকা কাটা হয়েছে',
    status: 'OPEN', createdAt: '2026-05-06T16:45:00',
  },
]

// ─── Vehicle type helpers ────────────────────────────────

const vehicleLabel = (v: string) => {
  switch (v) {
    case 'TEMPO': return 'টেম্পো'
    case 'AUTO': return 'অটো'
    case 'E_RICKSHAW': return 'ই-রিক্শা'
    default: return v
  }
}

const vehicleEmoji = (v: string) => {
  switch (v) {
    case 'TEMPO': return '🛺'
    case 'AUTO': return '🚗'
    case 'E_RICKSHAW': return '🛵'
    default: return '🚗'
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case 'SEARCHING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'ACCEPTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'IN_PROGRESS': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
    case 'COMPLETED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'SEARCHING': return 'খোঁজা হচ্ছে'
    case 'ACCEPTED': return 'গৃহীত'
    case 'IN_PROGRESS': return 'চলমান'
    case 'COMPLETED': return 'সম্পন্ন'
    case 'CANCELLED': return 'বাতিল'
    default: return status
  }
}

// ─── Main Component ──────────────────────────────────────

export default function AdminPanel() {
  const { currentUser, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [moreSubTab, setMoreSubTab] = useState<MoreSubTab>('users')
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 256,
    totalDrivers: 48,
    activeRides: 12,
    totalRevenue: 125000,
    recentRides: MOCK_RECENT_RIDES,
    ridesPerDay: MOCK_RIDES_PER_DAY,
    revenuePerDay: MOCK_REVENUE_PER_DAY,
  })

  // Drivers state
  const [pendingDrivers, setPendingDrivers] = useState(MOCK_PENDING_DRIVERS)
  const [approvedDrivers, setApprovedDrivers] = useState([
    { id: 'ad-1', name: 'রামু দাস', phone: '+919876543010', vehicleType: 'TEMPO', vehicleNumber: 'AS-01-AB-1234', licenseNumber: 'DL-2023-101', rating: 4.5, totalRides: 128, isOnline: true, isBlocked: false },
    { id: 'ad-2', name: 'সুরেন কুমার', phone: '+919876543011', vehicleType: 'AUTO', vehicleNumber: 'AS-02-CD-5678', licenseNumber: 'DL-2023-102', rating: 4.2, totalRides: 95, isOnline: false, isBlocked: false },
    { id: 'ad-3', name: 'কালু মাঝি', phone: '+919876543012', vehicleType: 'E_RICKSHAW', vehicleNumber: 'AS-03-EF-9012', licenseNumber: 'DL-2023-103', rating: 4.8, totalRides: 210, isOnline: true, isBlocked: false },
    { id: 'ad-4', name: 'হরিচরণ দাস', phone: '+919876543013', vehicleType: 'AUTO', vehicleNumber: 'AS-04-GH-3456', licenseNumber: 'DL-2023-104', rating: 3.9, totalRides: 64, isOnline: false, isBlocked: false },
  ])
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [driverSubTab, setDriverSubTab] = useState<'pending' | 'approved'>('pending')

  // Users state
  const [users, setUsers] = useState(MOCK_USERS)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null)

  // Rides state
  const [activeRides, setActiveRides] = useState(MOCK_ACTIVE_RIDES)
  const [selectedRide, setSelectedRide] = useState<typeof MOCK_ACTIVE_RIDES[0] | null>(null)

  // Finance state
  const [commission, setCommission] = useState(15)
  const [fareConfig, setFareConfig] = useState({
    tempoBaseFare: 15, tempoPerKm: 8,
    autoBaseFare: 20, autoPerKm: 12,
    eRickshawBaseFare: 10, eRickshawPerKm: 6,
  })
  const [offers, setOffers] = useState(MOCK_OFFERS)
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const [newOffer, setNewOffer] = useState({ code: '', discount: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT', maxDiscount: '', validUntil: '' })
  const [financeSubTab, setFinanceSubTab] = useState<'commission' | 'fare' | 'offers'>('commission')
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('week')

  // Notifications state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'USER' | 'DRIVER'>('ALL')
  const [recentNotifs, setRecentNotifs] = useState([
    { id: 'n-1', title: 'নতুন অফার', message: 'GRAM10 কোড ব্যবহার করে ১০% ছাড় পান!', target: 'সকল', sentAt: '২ ঘন্টা আগে' },
    { id: 'n-2', title: 'সিস্টেম আপডেট', message: 'রাত ১২টায় সাময়িক রক্ষণাবেক্ষণ হবে', target: 'সকল', sentAt: '১ দিন আগে' },
    { id: 'n-3', title: 'নতুন রুট', message: 'গ্রাম বাজার থেকে জেলা হাসপাতাল রুট যোগ হয়েছে', target: 'চালক', sentAt: '৩ দিন আগে' },
  ])

  // Disputes state
  const [disputes, setDisputes] = useState(MOCK_DISPUTES)
  const [resolutionText, setResolutionText] = useState('')
  const [resolveDisputeId, setResolveDisputeId] = useState<string | null>(null)

  // ─── Data Loading ────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getAdminDashboard()
      setDashboardData({
        totalUsers: data.totalUsers,
        totalDrivers: data.totalDrivers,
        activeRides: data.activeRides,
        totalRevenue: data.totalRevenue,
        recentRides: data.recentRides as typeof MOCK_RECENT_RIDES,
        ridesPerDay: data.ridesPerDay,
        revenuePerDay: data.revenuePerDay,
      })
    } catch {
      // Use mock data
    }
  }, [])

  const loadPendingDrivers = useCallback(async () => {
    try {
      const data = await getPendingDrivers()
      if (data.length > 0) setPendingDrivers(data)
    } catch {
      // Use mock data
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers()
      if (data.length > 0) setUsers(data)
    } catch {
      // Use mock data
    }
  }, [])

  const loadActiveRidesData = useCallback(async () => {
    try {
      const data = await getActiveRides()
      if (data.length > 0) setActiveRides(data)
    } catch {
      // Use mock data
    }
  }, [])

  const loadOffers = useCallback(async () => {
    try {
      const data = await getOffers()
      if (data.length > 0) setOffers(data as typeof MOCK_OFFERS)
    } catch {
      // Use mock data
    }
  }, [])

  const loadDisputes = useCallback(async () => {
    try {
      const data = await getDisputes()
      if (data.length > 0) setDisputes(data)
    } catch {
      // Use mock data
    }
  }, [])

  // Data is initialized with mock data above; API calls are available via handlers below

  // ─── Handlers ────────────────────────────────────────

  const handleApproveDriver = async (driverId: string) => {
    try {
      await approveDriver(driverId)
    } catch {
      // Mock
    }
    const driver = pendingDrivers.find(d => d.id === driverId)
    setPendingDrivers(prev => prev.filter(d => d.id !== driverId))
    if (driver) {
      setApprovedDrivers(prev => [...prev, {
        id: driver.id, name: driver.name, phone: driver.phone,
        vehicleType: driver.vehicleType || 'TEMPO',
        vehicleNumber: driver.vehicleNumber || '',
        licenseNumber: driver.licenseNumber || '',
        rating: 0, totalRides: 0, isOnline: false, isBlocked: false,
      }])
    }
  }

  const handleRejectDriver = async (driverId: string) => {
    try {
      await rejectDriver(driverId, rejectReason)
    } catch {
      // Mock
    }
    setPendingDrivers(prev => prev.filter(d => d.id !== driverId))
    setShowRejectDialog(null)
    setRejectReason('')
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await unblockUser(userId)
      } else {
        await blockUser(userId)
      }
    } catch {
      // Mock
    }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isBlocked: !isBlocked } : u
    ))
  }

  const handleBlockDriver = (driverId: string, isBlocked: boolean) => {
    setApprovedDrivers(prev => prev.map(d =>
      d.id === driverId ? { ...d, isBlocked: !isBlocked } : d
    ))
  }

  const handleToggleOffer = async (offerId: string, active: boolean) => {
    try {
      await toggleOffer(offerId, !active)
    } catch {
      // Mock
    }
    setOffers(prev => prev.map(o =>
      o.id === offerId ? { ...o, active: !active } : o
    ))
  }

  const handleCreateOffer = async () => {
    const offer = {
      id: `of-${Date.now()}`,
      code: newOffer.code,
      discount: parseInt(newOffer.discount) || 0,
      type: newOffer.type,
      active: true,
      usageCount: 0,
      maxDiscount: parseInt(newOffer.maxDiscount) || 0,
      validUntil: newOffer.validUntil,
    }
    try {
      await createOffer({
        code: newOffer.code,
        discount: offer.discount,
        type: newOffer.type,
        maxDiscount: offer.maxDiscount,
        validUntil: newOffer.validUntil,
      })
    } catch {
      // Mock
    }
    setOffers(prev => [...prev, offer])
    setShowCreateOffer(false)
    setNewOffer({ code: '', discount: '', type: 'PERCENTAGE', maxDiscount: '', validUntil: '' })
  }

  const handleUpdateCommission = async () => {
    try {
      await updateCommission(commission)
    } catch {
      // Mock
    }
    alert(`কমিশন হালনাগাদ হয়েছে: ${commission}%`)
  }

  const handleUpdateFareConfig = async () => {
    try {
      await updateFareConfig(fareConfig)
    } catch {
      // Mock
    }
    alert('ভাড়া কনফিগারেশন হালনাগাদ হয়েছে')
  }

  const handleBroadcast = async () => {
    if (!notifTitle || !notifMessage) return
    try {
      await broadcastNotification({ title: notifTitle, message: notifMessage, targetRole: notifTarget })
    } catch {
      // Mock
    }
    setRecentNotifs(prev => [{
      id: `n-${Date.now()}`, title: notifTitle, message: notifMessage,
      target: notifTarget === 'ALL' ? 'সকল' : notifTarget === 'USER' ? 'যাত্রী' : 'চালক',
      sentAt: 'এইমাত্র',
    }, ...prev])
    setNotifTitle('')
    setNotifMessage('')
  }

  const handleResolveDispute = async (disputeId: string) => {
    try {
      await resolveDispute(disputeId, resolutionText)
    } catch {
      // Mock
    }
    setDisputes(prev => prev.map(d =>
      d.id === disputeId ? { ...d, status: 'RESOLVED' } : d
    ))
    setResolveDisputeId(null)
    setResolutionText('')
  }

  // ─── Filtered data ───────────────────────────────────

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  )

  // ─── Tab definitions ─────────────────────────────────

  const tabs = [
    { key: 'dashboard' as AdminTab, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { key: 'drivers' as AdminTab, label: 'চালক', icon: Car },
    { key: 'rides' as AdminTab, label: 'যাত্রা', icon: Navigation },
    { key: 'finance' as AdminTab, label: 'অর্থ', icon: IndianRupee },
    { key: 'more' as AdminTab, label: 'আরও', icon: MoreHorizontal },
  ]

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Admin Header */}
      <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-bold text-lg">গ্রামGo অ্যাডমিন</span>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
              {(currentUser?.name || 'অ')[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ═══════════════════ DASHBOARD TAB ═══════════════════ */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <UsersIcon className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">মোট ব্যবহারকারী</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{dashboardData.totalUsers}</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+১২%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">মোট চালক</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{dashboardData.totalDrivers}</div>
                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+৫%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">সক্রিয় যাত্রা</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.activeRides}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>লাইভ</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">মোট আয়</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">₹{(dashboardData.totalRevenue / 1000).toFixed(0)}K</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>+১৮%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rides Per Day Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    দৈনিক যাত্রা
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.ridesPerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} />
                        <YAxis fontSize={10} tickLine={false} />
                        <Tooltip
                          formatter={(value: number) => [`${value} যাত্রা`, 'যাত্রা']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Per Day Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    দৈনিক আয়
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.revenuePerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} />
                        <YAxis fontSize={10} tickLine={false} />
                        <Tooltip
                          formatter={(value: number) => [`₹${value}`, 'আয়']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Rides */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    সাম্প্রতিক যাত্রা
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {dashboardData.recentRides.map((ride) => (
                      <div key={ride.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{ride.userName}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{ride.driverName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {ride.pickup} → {ride.drop}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold">₹{ride.fare}</span>
                          <Badge className={`text-[10px] ${statusColor(ride.status)}`}>
                            {statusLabel(ride.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══════════════════ DRIVERS TAB ═══════════════════ */}
          {activeTab === 'drivers' && (
            <motion.div
              key="drivers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Driver Sub Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={driverSubTab === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  className={driverSubTab === 'pending' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setDriverSubTab('pending')}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  অপেক্ষমাণ ({pendingDrivers.length})
                </Button>
                <Button
                  variant={driverSubTab === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  className={driverSubTab === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setDriverSubTab('approved')}
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  অনুমোদিত ({approvedDrivers.length})
                </Button>
              </div>

              {/* Pending Drivers */}
              {driverSubTab === 'pending' && (
                <div className="space-y-3">
                  {pendingDrivers.length === 0 ? (
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-8 text-center">
                        <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">কোনো অপেক্ষমাণ চালক নেই</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingDrivers.map((driver) => (
                      <Card key={driver.id} className="border-0 shadow-md border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                                {driver.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">{driver.name}</h4>
                                <Badge className="bg-orange-100 text-orange-700 text-[10px]">অপেক্ষমাণ</Badge>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {driver.phone}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {vehicleEmoji(driver.vehicleType || 'TEMPO')}
                                  {vehicleLabel(driver.vehicleType || 'TEMPO')} - {driver.vehicleNumber}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  লাইসেন্স: {driver.licenseNumber}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                                  onClick={() => handleApproveDriver(driver.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  অনুমোদন
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => {
                                    setShowRejectDialog(driver.id)
                                    setRejectReason('')
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  প্রত্যাখ্যান
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Approved Drivers */}
              {driverSubTab === 'approved' && (
                <div className="space-y-3">
                  {approvedDrivers.map((driver) => (
                    <Card key={driver.id} className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                                {driver.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            {driver.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{driver.name}</h4>
                              <div className="flex items-center gap-1">
                                {driver.isOnline && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                <Badge
                                  className={
                                    driver.isBlocked
                                      ? 'bg-red-100 text-red-700 text-[10px]'
                                      : driver.isOnline
                                        ? 'bg-emerald-100 text-emerald-700 text-[10px]'
                                        : 'bg-gray-100 text-gray-700 text-[10px]'
                                  }
                                >
                                  {driver.isBlocked ? 'ব্লক' : driver.isOnline ? 'অনলাইন' : 'অফলাইন'}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-1 space-y-0.5">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{vehicleEmoji(driver.vehicleType)} {vehicleLabel(driver.vehicleType)} - {driver.vehicleNumber}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  {driver.rating}
                                </span>
                                <span>{driver.totalRides} যাত্রা</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant={driver.isBlocked ? 'default' : 'destructive'}
                                className={`flex-1 h-8 text-xs ${!driver.isBlocked ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                onClick={() => handleBlockDriver(driver.id, driver.isBlocked)}
                              >
                                {driver.isBlocked ? (
                                  <><UserCheck className="h-3 w-3 mr-1" />আনব্লক</>
                                ) : (
                                  <><Ban className="h-3 w-3 mr-1" />ব্লক</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ RIDES TAB ═══════════════════ */}
          {activeTab === 'rides' && (
            <motion.div
              key="rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {activeRides.filter(r => r.status === 'SEARCHING').length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">খোঁজা হচ্ছে</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {activeRides.filter(r => r.status === 'ACCEPTED').length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">গৃহীত</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {activeRides.filter(r => r.status === 'IN_PROGRESS').length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">চলমান</div>
                  </CardContent>
                </Card>
              </div>

              {/* Map Placeholder */}
              <div className="w-full h-44 rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100 dark:from-emerald-950 dark:to-orange-950 border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(rgba(22,163,74,0.3) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(22,163,74,0.3) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }} />
                <div className="text-center z-10">
                  <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">লাইভ ট্র্যাকিং ম্যাপ</span>
                </div>
                {/* Animated markers */}
                <motion.div
                  className="absolute top-1/4 left-1/4"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                </motion.div>
                <motion.div
                  className="absolute top-1/2 right-1/3"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                >
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                </motion.div>
                <motion.div
                  className="absolute bottom-1/4 left-1/2"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </motion.div>
              </div>

              {/* Active Rides List */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  সক্রিয় যাত্রা ({activeRides.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeRides.map((ride) => (
                    <Card key={ride.id} className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={statusColor(ride.status)}>
                              {statusLabel(ride.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {vehicleEmoji(ride.vehicleType)} {vehicleLabel(ride.vehicleType)}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">₹{ride.fare}</span>
                        </div>

                        {/* Route */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex flex-col items-center mt-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <div className="w-0.5 h-6 bg-muted" />
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <span className="text-[10px] text-muted-foreground">পিকআপ</span>
                              <p className="text-xs font-medium">{ride.pickup}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground">ড্রপ</span>
                              <p className="text-xs font-medium">{ride.drop}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {ride.distance} কিমি
                          </div>
                        </div>

                        <Separator className="my-2" />

                        {/* People */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs">
                            <UsersIcon className="h-3 w-3" />
                            <span className="text-muted-foreground">যাত্রী:</span>
                            <span className="font-medium">{ride.userName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Car className="h-3 w-3" />
                            <span className="text-muted-foreground">চালক:</span>
                            <span className="font-medium">{ride.driverName || 'খোঁজা হচ্ছে'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => setSelectedRide(ride)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            বিস্তারিত
                          </Button>
                          {ride.driverPhone && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => alert(`কল: ${ride.driverPhone}`)}
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ FINANCE TAB ═══════════════════ */}
          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Finance Sub Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={financeSubTab === 'commission' ? 'default' : 'outline'}
                  size="sm"
                  className={financeSubTab === 'commission' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setFinanceSubTab('commission')}
                >
                  <CircleDollarSign className="h-3 w-3 mr-1" />
                  কমিশন
                </Button>
                <Button
                  variant={financeSubTab === 'fare' ? 'default' : 'outline'}
                  size="sm"
                  className={financeSubTab === 'fare' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setFinanceSubTab('fare')}
                >
                  <Sliders className="h-3 w-3 mr-1" />
                  ভাড়া
                </Button>
                <Button
                  variant={financeSubTab === 'offers' ? 'default' : 'outline'}
                  size="sm"
                  className={financeSubTab === 'offers' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => setFinanceSubTab('offers')}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  অফার
                </Button>
              </div>

              {/* Commission Control */}
              {financeSubTab === 'commission' && (
                <div className="space-y-4">
                  {/* Earnings Period Selector */}
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
                        className={earningsPeriod === p.key ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                        onClick={() => setEarningsPeriod(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>

                  {/* Platform Earnings */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
                      <CardContent className="p-4">
                        <div className="text-xs text-white/80 mb-1">প্ল্যাটফর্ম আয়</div>
                        <div className="text-2xl font-bold">
                          ₹{earningsPeriod === 'today' ? '1,250' : earningsPeriod === 'week' ? '8,400' : '32,500'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-400 text-white">
                      <CardContent className="p-4">
                        <div className="text-xs text-white/80 mb-1">কমিশন আয়</div>
                        <div className="text-2xl font-bold">
                          ₹{earningsPeriod === 'today' ? '188' : earningsPeriod === 'week' ? '1,260' : '4,875'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Commission Slider */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4 text-orange-500" />
                          প্ল্যাটফর্ম কমিশন
                        </h4>
                        <span className="text-xl font-bold text-orange-600">{commission}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        step={1}
                        value={commission}
                        onChange={(e) => setCommission(parseInt(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>৫%</span>
                        <span>৩০%</span>
                      </div>
                      <Button
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleUpdateCommission}
                      >
                        কমিশন হালনাগাদ করুন
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Revenue Chart */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        প্ল্যাটফর্ম আয় চার্ট
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.revenuePerDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="date" fontSize={10} tickLine={false} />
                            <YAxis fontSize={10} tickLine={false} />
                            <Tooltip
                              formatter={(value: number) => [`₹${value}`, 'আয়']}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Fare Configuration */}
              {financeSubTab === 'fare' && (
                <div className="space-y-4">
                  {/* Tempo */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        টেম্পো ভাড়া
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">মূল ভাড়া (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.tempoBaseFare}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, tempoBaseFare: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">প্রতি কিমি (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.tempoPerKm}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, tempoPerKm: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Car className="h-4 w-4 text-blue-600" />
                        অটো ভাড়া
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">মূল ভাড়া (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.autoBaseFare}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, autoBaseFare: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">প্রতি কিমি (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.autoPerKm}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, autoPerKm: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* E-Rickshaw */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Bike className="h-4 w-4 text-orange-600" />
                        ই-রিক্শা ভাড়া
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">মূল ভাড়া (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.eRickshawBaseFare}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, eRickshawBaseFare: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">প্রতি কিমি (₹)</label>
                          <Input
                            type="number"
                            value={fareConfig.eRickshawPerKm}
                            onChange={(e) => setFareConfig(prev => ({ ...prev, eRickshawPerKm: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold"
                    onClick={handleUpdateFareConfig}
                  >
                    ভাড়া কনফিগারেশন হালনাগাদ
                  </Button>
                </div>
              )}

              {/* Offers Management */}
              {financeSubTab === 'offers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">অফার / কুপন</h3>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowCreateOffer(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      নতুন অফার
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <Card key={offer.id} className="border-0 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-orange-500" />
                              <span className="font-bold text-sm">{offer.code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={offer.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                                {offer.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </Badge>
                              <Switch
                                checked={offer.active}
                                onCheckedChange={() => handleToggleOffer(offer.id, offer.active)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
                            <div>
                              <span className="block text-muted-foreground">ছাড়</span>
                              <span className="font-medium text-foreground">
                                {offer.type === 'PERCENTAGE' ? `${offer.discount}%` : `₹${offer.discount}`}
                              </span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">সর্বোচ্চ</span>
                              <span className="font-medium text-foreground">₹{offer.maxDiscount}</span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">ব্যবহার</span>
                              <span className="font-medium text-foreground">{offer.usageCount} বার</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            মেয়াদ: {offer.validUntil}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ MORE TAB ═══════════════════ */}
          {activeTab === 'more' && (
            <motion.div
              key="more"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* More Menu - show when no sub-tab selected or as navigation */}
              {moreSubTab === 'users' && (
                <div className="space-y-4">
                  {/* Sub Navigation */}
                  <div className="flex gap-2">
                    <Button
                      variant={moreSubTab === 'users' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'users' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('users')}
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      ব্যবহারকারী
                    </Button>
                    <Button
                      variant={moreSubTab === 'notifications' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'notifications' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('notifications')}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      বিজ্ঞপ্তি
                    </Button>
                    <Button
                      variant={moreSubTab === 'disputes' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'disputes' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('disputes')}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      বিরোধ
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {users.filter(u => u.role === 'USER').length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">যাত্রী</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {users.filter(u => u.isBlocked).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">ব্লক</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {users.filter(u => u.isOnline).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">অনলাইন</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Users List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="border-0 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-sm">
                                  {user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{user.name}</span>
                                {user.isBlocked && (
                                  <Badge className="bg-red-100 text-red-700 text-[9px]">ব্লক</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.phone}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-medium">₹{user.walletBalance}</div>
                                <div className="text-[10px] text-muted-foreground">{user.totalRides} যাত্রা</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={user.isBlocked ? 'default' : 'destructive'}
                              className={`flex-1 h-7 text-xs ${user.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                              onClick={() => handleBlockUser(user.id, user.isBlocked)}
                            >
                              {user.isBlocked ? (
                                <><UserCheck className="h-3 w-3 mr-1" />আনব্লক</>
                              ) : (
                                <><Ban className="h-3 w-3 mr-1" />ব্লক</>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Sub-tab */}
              {moreSubTab === 'notifications' && (
                <div className="space-y-4">
                  {/* Sub Navigation */}
                  <div className="flex gap-2">
                    <Button
                      variant={moreSubTab === 'users' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'users' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('users')}
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      ব্যবহারকারী
                    </Button>
                    <Button
                      variant={moreSubTab === 'notifications' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'notifications' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('notifications')}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      বিজ্ঞপ্তি
                    </Button>
                    <Button
                      variant={moreSubTab === 'disputes' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'disputes' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('disputes')}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      বিরোধ
                    </Button>
                  </div>

                  {/* Broadcast Form */}
                  <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-emerald-600" />
                        বিজ্ঞপ্তি পাঠান
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">শিরোনাম</label>
                        <Input
                          placeholder="বিজ্ঞপ্তির শিরোনাম"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">বার্তা</label>
                        <textarea
                          placeholder="বিজ্ঞপ্তির বার্তা লিখুন..."
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">প্রাপক</label>
                        <Select value={notifTarget} onValueChange={(v) => setNotifTarget(v as 'ALL' | 'USER' | 'DRIVER')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">সকল</SelectItem>
                            <SelectItem value="USER">শুধু যাত্রী</SelectItem>
                            <SelectItem value="DRIVER">শুধু চালক</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleBroadcast}
                        disabled={!notifTitle || !notifMessage}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        বিজ্ঞপ্তি পাঠান
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Notifications */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        সাম্প্রতিক বিজ্ঞপ্তি
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {recentNotifs.map((notif) => (
                          <div key={notif.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{notif.title}</span>
                              <Badge variant="outline" className="text-[9px]">{notif.target}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                            <span className="text-[10px] text-muted-foreground mt-1 block">{notif.sentAt}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Disputes Sub-tab */}
              {moreSubTab === 'disputes' && (
                <div className="space-y-4">
                  {/* Sub Navigation */}
                  <div className="flex gap-2">
                    <Button
                      variant={moreSubTab === 'users' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'users' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('users')}
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      ব্যবহারকারী
                    </Button>
                    <Button
                      variant={moreSubTab === 'notifications' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'notifications' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('notifications')}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      বিজ্ঞপ্তি
                    </Button>
                    <Button
                      variant={moreSubTab === 'disputes' ? 'default' : 'outline'}
                      size="sm"
                      className={moreSubTab === 'disputes' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                      onClick={() => setMoreSubTab('disputes')}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      বিরোধ
                    </Button>
                  </div>

                  {/* Dispute Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold text-red-600">
                          {disputes.filter(d => d.status === 'OPEN').length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">খোলা বিরোধ</div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold text-emerald-600">
                          {disputes.filter(d => d.status === 'RESOLVED').length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">সমাধান হয়েছে</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Disputes List */}
                  <div className="space-y-3">
                    {disputes.map((dispute) => (
                      <Card
                        key={dispute.id}
                        className={`border-0 shadow-md border-l-4 ${dispute.status === 'OPEN' ? 'border-l-red-500' : 'border-l-emerald-500'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${dispute.status === 'OPEN' ? 'text-red-500' : 'text-emerald-500'}`} />
                              <span className="font-semibold text-sm">{dispute.userName}</span>
                            </div>
                            <Badge className={dispute.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}>
                              {dispute.status === 'OPEN' ? 'খোলা' : 'সমাধান'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{dispute.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>যাত্রা: {dispute.rideId}</span>
                            <span>•</span>
                            <span>{new Date(dispute.createdAt).toLocaleDateString('bn-BD')}</span>
                          </div>

                          {dispute.status === 'OPEN' && (
                            <div className="mt-3">
                              {resolveDisputeId === dispute.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    placeholder="সমাধান লিখুন..."
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                                      onClick={() => handleResolveDispute(dispute.id)}
                                      disabled={!resolutionText}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      সমাধান জমা দিন
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs"
                                      onClick={() => { setResolveDisputeId(null); setResolutionText('') }}
                                    >
                                      বাতিল
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-8 text-xs"
                                  onClick={() => setResolveDisputeId(dispute.id)}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  সমাধান করুন
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {disputes.length === 0 && (
                      <Card className="border-0 shadow-md">
                        <CardContent className="p-8 text-center">
                          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">কোনো বিরোধ নেই</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Settings & Logout */}
                  <Separator />
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        অ্যাডমিন সেটিংস
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm">বিজ্ঞপ্তি</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm">জরুরি সতর্কতা</span>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Button variant="destructive" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    লগআউট
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════ Bottom Navigation ═══════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setActiveTab(tab.key)
                  if (tab.key === 'more') {
                    setMoreSubTab('users')
                  }
                }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="adminTabIndicator"
                    className="w-1 h-1 rounded-full bg-emerald-600"
                  />
                )}
                {tab.key === 'drivers' && pendingDrivers.length > 0 && (
                  <span className="absolute -top-0.5 right-1 bg-orange-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingDrivers.length}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* ═══════════════════ Dialogs ═══════════════════ */}

      {/* Reject Driver Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={(open) => { if (!open) setShowRejectDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              চালক প্রত্যাখ্যান
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">প্রত্যাখ্যানের কারণ</label>
              <textarea
                placeholder="কারণ লিখুন..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => showRejectDialog && handleRejectDriver(showRejectDialog)}
                disabled={!rejectReason}
              >
                প্রত্যাখ্যান করুন
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowRejectDialog(null); setRejectReason('') }}
              >
                বাতিল
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-emerald-600" />
              ব্যবহারকারীর বিবরণ
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-base">{selectedUser.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedUser.phone}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold text-emerald-600">₹{selectedUser.walletBalance}</div>
                  <div className="text-[10px] text-muted-foreground">ওয়ালেট</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">{selectedUser.totalRides}</div>
                  <div className="text-[10px] text-muted-foreground">মোট যাত্রা</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {selectedUser.rating}
                  </div>
                  <div className="text-[10px] text-muted-foreground">রেটিং</div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <div className="text-lg font-bold">
                    {selectedUser.isVerified ? '✅' : '❌'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">যাচাইকৃত</div>
                </div>
              </div>
              <Button
                className={`w-full ${selectedUser.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={() => {
                  handleBlockUser(selectedUser.id, selectedUser.isBlocked)
                  setSelectedUser({ ...selectedUser, isBlocked: !selectedUser.isBlocked })
                }}
              >
                {selectedUser.isBlocked ? (
                  <><UserCheck className="h-4 w-4 mr-2" />আনব্লক করুন</>
                ) : (
                  <><Ban className="h-4 w-4 mr-2" />ব্লক করুন</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ride Detail Dialog */}
      <Dialog open={!!selectedRide} onOpenChange={(open) => { if (!open) setSelectedRide(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              যাত্রার বিবরণ
            </DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={statusColor(selectedRide.status)}>
                  {statusLabel(selectedRide.status)}
                </Badge>
                <span className="text-sm font-medium">
                  {vehicleEmoji(selectedRide.vehicleType)} {vehicleLabel(selectedRide.vehicleType)}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="w-0.5 h-8 bg-muted" />
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground">পিকআপ</span>
                    <p className="text-sm font-medium">{selectedRide.pickup}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">ড্রপ</span>
                    <p className="text-sm font-medium">{selectedRide.drop}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">ভাড়া</span>
                  <p className="font-bold text-emerald-600">₹{selectedRide.fare}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">দূরত্ব</span>
                  <p className="font-medium">{selectedRide.distance} কিমি</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">পেমেন্ট</span>
                  <p className="font-medium">{selectedRide.paymentMethod === 'CASH' ? 'নগদ' : 'ওয়ালেট'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">সময়</span>
                  <p className="font-medium">{new Date(selectedRide.createdAt).toLocaleTimeString('bn-BD')}</p>
                </div>
              </div>

              <Separator />

              {/* People */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="text-xs text-muted-foreground">যাত্রী</span>
                      <p className="text-sm font-medium">{selectedRide.userName}</p>
                    </div>
                  </div>
                  {selectedRide.userPhone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`কল: ${selectedRide.userPhone}`)}>
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-orange-500" />
                    <div>
                      <span className="text-xs text-muted-foreground">চালক</span>
                      <p className="text-sm font-medium">{selectedRide.driverName || 'নির্ধারিত নয়'}</p>
                    </div>
                  </div>
                  {selectedRide.driverPhone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`কল: ${selectedRide.driverPhone}`)}>
                      <Phone className="h-4 w-4 text-orange-500" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Offer Dialog */}
      <Dialog open={showCreateOffer} onOpenChange={setShowCreateOffer}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              নতুন অফার তৈরি
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">অফার কোড</label>
              <Input
                placeholder="যেমন: GRAM20"
                value={newOffer.code}
                onChange={(e) => setNewOffer(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">ছাড়ের পরিমাণ</label>
                <Input
                  type="number"
                  placeholder="ছাড়"
                  value={newOffer.discount}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, discount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ধরন</label>
                <Select value={newOffer.type} onValueChange={(v) => setNewOffer(prev => ({ ...prev, type: v as 'PERCENTAGE' | 'FLAT' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">শতাংশ (%)</SelectItem>
                    <SelectItem value="FLAT">সরাসরি (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">সর্বোচ্চ ছাড় (₹)</label>
                <Input
                  type="number"
                  placeholder="সর্বোচ্চ"
                  value={newOffer.maxDiscount}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, maxDiscount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">মেয়াদ শেষ</label>
                <Input
                  type="date"
                  value={newOffer.validUntil}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateOffer}
              disabled={!newOffer.code || !newOffer.discount || !newOffer.validUntil}
            >
              <Plus className="h-4 w-4 mr-2" />
              অফার তৈরি করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
