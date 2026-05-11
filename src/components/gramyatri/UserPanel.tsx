'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Search, ClipboardList, Wallet as WalletIcon, User as UserIcon,
  MapPin, Navigation, IndianRupee, Clock, Star,
  Phone, Wallet, Shield, ChevronRight, Plus,
  Crosshair, Banknote, Tag, AlertTriangle,
  History, Settings, LogOut, Moon, Sun, Bell, X,
  Loader2, AlertCircle, MessageSquare, Car, Map,
  Users, Zap, Gift, ArrowRight, CheckCircle2,
  Radio, TrendingUp, ChevronDown, Edit3, Eye, EyeOff,
  PhoneCall, Truck, Bike, Locate, Route, Timer,
  Share2, Info, CreditCard, CircleDot, Move, ExternalLink,
  ThumbsUp, Heart, Copy, Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import type { Ride } from '@/lib/store'
import {
  calculateFare,
  createRide,
  getRides,
  addWalletMoney,
  getWalletTransactions,
  getSharedRides,
  validateOffer,
  createEmergencyAlert,
  createRating,
  getWallet,
  getNearbyDrivers,
  updateRide,
  getOffers,
  getPaymentSettings,
} from '@/lib/api'
import type { PaymentSettings } from '@/lib/api'
import { toast } from 'sonner'
import { useSocket } from '@/lib/socket'
import SharedRideCard from './SharedRideCard'
import RideCard from './RideCard'
import SharedTempoPanel from './SharedTempoPanel'
import OfflineBookingIndicator from './OfflineBookingIndicator'

type UserTab = 'home' | 'search' | 'rides' | 'wallet' | 'profile'

// Helper to map an API ride record to the store Ride type
function mapApiRideToRide(apiRide: Record<string, unknown>): Ride {
  const driver = apiRide.driver as Record<string, unknown> | undefined
  const driverUser = driver?.user as Record<string, unknown> | undefined
  const user = apiRide.user as Record<string, unknown> | undefined

  const vehicleType = (apiRide.vehicleType as string) || 'TEMPO'
  const vehicleNumber = (driver?.vehicleNumber as string) || ''
  const vehicleLabel =
    vehicleType === 'TEMPO'
      ? 'Tempo'
      : vehicleType === 'AUTO'
        ? 'Auto'
        : 'E-Rickshaw'

  return {
    id: String(apiRide.id),
    userId: String(apiRide.userId),
    driverId: apiRide.driverId ? String(apiRide.driverId) : undefined,
    pickup: String(apiRide.pickupAddress || apiRide.pickup || ''),
    drop: String(apiRide.dropAddress || apiRide.drop || ''),
    vehicleType: vehicleType as Ride['vehicleType'],
    fare: Number(apiRide.fare) || 0,
    baseFare: Number(apiRide.baseFare) || 0,
    distanceFare: Number(apiRide.distanceFare) || 0,
    distance: Number(apiRide.distance) || 0,
    status: (apiRide.status as Ride['status']) || 'SEARCHING',
    paymentMethod: (apiRide.paymentMethod as Ride['paymentMethod']) || 'CASH',
    offerCode: apiRide.offerCode ? String(apiRide.offerCode) : undefined,
    createdAt: String(apiRide.createdAt || new Date().toISOString()),
    completedAt: apiRide.completedAt ? String(apiRide.completedAt) : undefined,
    driverName: driverUser?.name ? String(driverUser.name) : undefined,
    driverPhone: driverUser?.phone ? String(driverUser.phone) : undefined,
    driverVehicle: vehicleNumber ? `${vehicleLabel} - ${vehicleNumber}` : undefined,
    userName: user?.name ? String(user.name) : undefined,
    userPhone: user?.phone ? String(user.phone) : undefined,
    rating: apiRide.rating ? Number(apiRide.rating) : undefined,
  }
}

// Time-based greeting
function getGreeting(lang: Lang): string {
  const h = new Date().getHours()
  if (h < 12) return lang === 'as' ? 'সুপ্ৰভাত' : 'Good Morning'
  if (h < 17) return lang === 'as' ? 'শুভ দুপৰীয়া' : 'Good Afternoon'
  return lang === 'as' ? 'শুভ সন্ধিয়া' : 'Good Evening'
}

// Format seconds to mm:ss
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Nearby driver data
interface NearbyDriverInfo {
  id: string
  name: string
  vehicleType: string
  vehicleNumber: string
  rating: number
  eta: number
  distance: number
  totalRides: number
  lat: number
  lng: number
}

// Location suggestions
const LOCATION_SUGGESTIONS = [
  'Lanka Market', 'Hojai Bus Stand', 'Nagaon Town', 'Guwahati Paltan Bazar',
  'Diphu Railway Station', 'Lanka Railway Station', 'Nagaon Medical College',
  'Hojai Court', 'Guwahati Airport', 'Kaziranga National Park',
]

// Bilingual translations — English & Assamese
type Lang = 'en' | 'as'
const T: Record<string, Record<Lang, string>> = {
  'whereTo': { en: 'Where to today?', as: 'আজি ক\'লৈ যাব?' },
  'bookRide': { en: 'Book Ride', as: 'ৰাইড বুক কৰক' },
  'sharedTempo': { en: 'Shared Tempo', as: 'শ্বেয়াৰ্ড টেম্প' },
  'wallet': { en: 'Wallet', as: 'ৱালেট' },
  'history': { en: 'History', as: 'ইতিহাস' },
  'pickup': { en: 'Pickup location', as: 'পিকআপ ঠিকনা' },
  'drop': { en: 'Drop location', as: 'ড্ৰপ ঠিকনা' },
  'searchRides': { en: 'Search Rides', as: 'ৰাইড সন্ধান কৰক' },
  'selectVehicle': { en: 'Select Vehicle', as: 'বাহন বাছনি কৰক' },
  'nearbyDrivers': { en: 'Nearby Drivers', as: 'ওচৰৰ চালক' },
  'noDrivers': { en: 'No drivers nearby', as: 'ওচৰত কোনো চালক নাই' },
  'fareEstimate': { en: 'Fare Estimate', as: 'ভাড়া অনুমান' },
  'applyOffer': { en: 'Apply Offer', as: 'অফাৰ প্ৰয়োগ কৰক' },
  'payCash': { en: 'Pay with Cash', as: 'নগদত দিয়ক' },
  'payWallet': { en: 'Pay with Wallet', as: 'ৱালেটেৰে দিয়ক' },
  'bookNow': { en: 'Book Now', as: 'এতিয়া বুক কৰক' },
  'addMoney': { en: 'Add Money', as: 'পইচা যোগ কৰক' },
  'walletBalance': { en: 'Wallet Balance', as: 'ৱালেট বেলেন্স' },
  'transactions': { en: 'Transactions', as: 'লেনদেন' },
  'noTransactions': { en: 'No transactions yet', as: 'এতিয়ালৈকে কোনো লেনদেন নাই' },
  'rideHistory': { en: 'Ride History', as: 'ৰাইড ইতিহাস' },
  'noRides': { en: 'No rides yet', as: 'এতিয়ালৈকে কোনো ৰাইড নাই' },
  'profile': { en: 'Profile', as: 'প্ৰ\u0027ফাইল' },
  'totalRides': { en: 'Total Rides', as: 'মুঠ ৰাইড' },
  'avgRating': { en: 'Avg Rating', as: 'গড় ৰেটিং' },
  'notifications': { en: 'Notifications', as: 'জাননী' },
  'noNotifications': { en: 'No notifications', as: 'কোনো জাননী নাই' },
  'about': { en: 'About', as: 'বিষয়ে' },
  'help': { en: 'Help & Support', as: 'সাহায্য আৰু সমৰ্থন' },
  'logout': { en: 'Logout', as: 'লগআউট' },
  'emergency': { en: 'Emergency SOS', as: 'জৰুৰীকালীন SOS' },
  'cancel': { en: 'Cancel', as: 'বাতিল কৰক' },
  'confirm': { en: 'Confirm', as: 'নিশ্চিত কৰক' },
  'save': { en: 'Save', as: 'সংৰক্ষণ কৰক' },
  'goodMorning': { en: 'Good Morning', as: 'সুপ্ৰভাত' },
  'goodAfternoon': { en: 'Good Afternoon', as: 'শুভ দুপৰীয়া' },
  'goodEvening': { en: 'Good Evening', as: 'শুভ সন্ধিয়া' },
  'searchingDriver': { en: 'Searching for Driver', as: 'চালক সন্ধান কৰি আছে' },
  'driverFound': { en: 'Driver Found - Arriving', as: 'চালক পোৱা গ\'ল - আহি আছে' },
  'rideInProgress': { en: 'Ride in Progress', as: 'ৰাইড চলি আছে' },
  'rideCompleted': { en: 'Ride Completed', as: 'ৰাইড সম্পূৰ্ণ হ\'ল' },
  'rideCancelled': { en: 'Ride Cancelled', as: 'ৰাইড বাতিল হ\'ল' },
  'rateDriver': { en: 'Rate your ride', as: 'আপোনাৰ ৰাইড ৰেট কৰক' },
  'callDriver': { en: 'Call Driver', as: 'চালকক কল কৰক' },
  'cancelRide': { en: 'Cancel Ride', as: 'ৰাইড বাতিল কৰক' },
  'shareRide': { en: 'Share Ride', as: 'ৰাইড শ্বেয়াৰ কৰক' },
  'darkMode': { en: 'Dark Mode', as: 'ডাৰ্ক মোড' },
  'language': { en: 'অসমীয়া / English', as: 'English / অসমীয়া' },
  'detectLocation': { en: 'Detect Location', as: 'অৱস্থান চিনাক্ত কৰক' },
  'distance': { en: 'Distance', as: 'দূৰত্ব' },
  'fare': { en: 'Fare', as: 'ভাড়া' },
  'baseFare': { en: 'Base Fare', as: 'মৌলিক ভাড়া' },
  'perKm': { en: 'per km', as: 'প্ৰতি কি.মি.' },
  'off': { en: 'off', as: 'ৰেহাই' },
  'enterAmount': { en: 'Enter amount (₹)', as: 'পৰিমাণ লিখক (₹)' },
  'quickAdd': { en: 'Quick Add', as: 'দ্ৰুত যোগ' },
  'passenger': { en: 'Passenger', as: 'যাত্ৰী' },
  'verified': { en: 'Verified', as: 'যাচাইকৃত' },
  'memberSince': { en: 'Member since', as: 'সদস্যৰ পৰা' },
  'editProfile': { en: 'Edit Profile', as: 'প্ৰ\u0027ফাইল সম্পাদনা' },
  'settings': { en: 'Settings', as: 'ছেটিংছ' },
  'allRides': { en: 'All', as: 'সকলো' },
  'completed': { en: 'Completed', as: 'সম্পূৰ্ণ' },
  'cancelled': { en: 'Cancelled', as: 'বাতিল' },
  'allNotifs': { en: 'All', as: 'সকলো' },
  'rideNotifs': { en: 'Ride', as: 'ৰাইড' },
  'offerNotifs': { en: 'Offer', as: 'অফাৰ' },
  'systemNotifs': { en: 'System', as: 'চিষ্টেম' },
  'recentRides': { en: 'Recent Rides', as: 'শেহতীয়া ৰাইড' },
  'activeOffers': { en: 'Active Offers', as: 'সক্ৰিয় অফাৰ' },
  'sendSOS': { en: 'Send SOS', as: 'SOS পঠিয়াওক' },
  'sosMessage': { en: 'Emergency message (optional)', as: 'জৰুৰীকালীন বাৰ্তা (ঐচ্ছিক)' },
  'sosSent': { en: 'Emergency SOS sent! Help is on the way.', as: 'জৰুৰীকালীন SOS পঠিয়াওৱা হ\'ল! সাহায্য আহি আছে।' },
  'offerApplied': { en: 'Offer applied! You save', as: 'অফাৰ প্ৰয়োগ হ\'ল! আপুনি বচালে' },
  'invalidOffer': { en: 'Invalid or expired offer code', as: 'অবৈধ বা অকালম্যাদ অফাৰ ক\u0027ড' },
  'walletUpdated': { en: 'Wallet updated', as: 'ৱালেট আপডেট হ\'ল' },
  'completePayment': { en: 'Complete Payment First', as: 'প্ৰথমে পেমেণ্ট সম্পূৰ্ণ কৰক' },
  'payFirst': { en: 'Pay ₹{{amount}} via UPI first. Money will be added after you confirm.', as: 'প্ৰথমে UPI যোগে ₹{{amount}} দিয়ক। নিশ্চিত কৰাৰ পাছত পইচা যোগ হ\'ব।' },
  'iConfirmPayment': { en: 'I have completed the UPI payment of ₹{{amount}}', as: 'মই UPI যোগে ₹{{amount}} পেমেণ্ট সম্পূৰ্ণ কৰিছো' },
  'confirmPayment': { en: 'Confirm Payment', as: 'পেমেণ্ট নিশ্চিত কৰক' },
  'amountToPay': { en: 'Amount to Pay', as: 'পেমেণ্ট কৰিব লগা পৰিমাণ' },
  'payToUpi': { en: 'Pay to UPI ID', as: 'UPI ID লৈ দিয়ক' },
  'paymentInstructions': { en: 'Payment Instructions', as: 'পেমেণ্ট নিৰ্দেশনা' },
  'scanQR': { en: 'Scan QR code to pay', as: 'পেমেণ্ট কৰিবলৈ QR ক\u0027ড স্কেন কৰক' },
}

// Ride status progression for live tracking
const RIDE_STATUS_FLOW = ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Search }> = {
  SEARCHING: { label: 'Searching for Driver', color: 'text-yellow-600', icon: Search },
  ACCEPTED: { label: 'Driver Found - Arriving', color: 'text-blue-600', icon: Truck },
  IN_PROGRESS: { label: 'Ride in Progress', color: 'text-emerald-600', icon: Navigation },
  COMPLETED: { label: 'Ride Completed', color: 'text-gray-600', icon: CheckCircle2 },
  CANCELLED: { label: 'Ride Cancelled', color: 'text-red-600', icon: X },
}

// Notification type
interface UserNotification {
  id: string
  title: string
  message: string
  type: 'ride' | 'offer' | 'system'
  read: boolean
  createdAt: string
}

// No mock notifications — only real notifications from the database
const EMPTY_NOTIFICATIONS: UserNotification[] = []

export default function UserPanel() {
  const { currentUser, activeRide, setActiveRide, logout, updateWalletBalance, notifications, markNotificationRead } = useAppStore()
  const { emitRideRequest } = useSocket()
  const userId = currentUser?.id || ''

  const [activeTab, setActiveTab] = useState<UserTab>('home')
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [vehicleType, setVehicleType] = useState('TEMPO')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH')
  const [offerCode, setOfferCode] = useState('')
  const [distance, setDistance] = useState(0)
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(true)
  const [showSharedTempo, setShowSharedTempo] = useState(false)

  // Initialize dark mode state from DOM class
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  // Language state — persisted in localStorage
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('gramyatri-lang') as Lang) || 'as'
    }
    return 'as'
  })
  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let text = T[key]?.[lang] || T[key]?.en || key
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v))
      })
    }
    return text
  }
  const toggleLang = () => {
    const newLang = lang === 'as' ? 'en' : 'as'
    setLang(newLang)
    localStorage.setItem('gramyatri-lang', newLang)
  }

  // --- Real data state ---
  const [sharedRides, setSharedRides] = useState<Ride[]>([])
  const [sharedRidesLoading, setSharedRidesLoading] = useState(false)

  const [rideHistory, setRideHistory] = useState<Ride[]>([])
  const [rideHistoryLoading, setRideHistoryLoading] = useState(false)
  const [rideFilter, setRideFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL')

  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [userLat, setUserLat] = useState(26.15)
  const [userLng, setUserLng] = useState(91.74)
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletTransactions, setWalletTransactions] = useState<Array<Record<string, unknown>>>([])
  const [walletTransactionsLoading, setWalletTransactionsLoading] = useState(false)

  const [offerDiscount, setOfferDiscount] = useState<number>(0)
  const [offerValidating, setOfferValidating] = useState(false)
  const [offerApplied, setOfferApplied] = useState(false)

  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [emergencySending, setEmergencySending] = useState(false)

  // Enhanced states
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriverInfo[]>([])
  const [nearbyDriversLoading, setNearbyDriversLoading] = useState(false)
  const [showBookingConfirm, setShowBookingConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>(EMPTY_NOTIFICATIONS)
  const [notifFilter, setNotifFilter] = useState<'all' | 'ride' | 'offer' | 'system'>('all')
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [editName, setEditName] = useState(currentUser?.name || '')
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([])
  const [dropSuggestions, setDropSuggestions] = useState<string[]>([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropSuggestions, setShowDropSuggestions] = useState(false)
  const [gpsDetecting, setGpsDetecting] = useState(false)
  const [liveTrackingEta, setLiveTrackingEta] = useState(3)
  const [driverProgress, setDriverProgress] = useState(25)
  const [trackingStatusIndex, setTrackingStatusIndex] = useState(0)
  const [offers, setOffers] = useState<Array<Record<string, unknown>>>([])

  // NEW: Enhanced booking & tracking states
  const [showSearchingOverlay, setShowSearchingOverlay] = useState(false)
  const [rideDuration, setRideDuration] = useState(0)
  const [distanceRemaining, setDistanceRemaining] = useState(0)
  const [liveFare, setLiveFare] = useState(0)
  const [showPaymentSummary, setShowPaymentSummary] = useState(false)
  const [driverRating, setDriverRating] = useState(0)
  const [tipAmount, setTipAmount] = useState(0)
  const [completedRide, setCompletedRide] = useState<Ride | null>(null)

  // UPI Payment settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ upiId: '', paymentQrUrl: '', paymentInstructions: '', upiPaymentEnabled: false })
  const [serviceMaxRideDistance, setServiceMaxRideDistance] = useState(50)
  const [showUpiPayment, setShowUpiPayment] = useState(false)
  const [upiPaid, setUpiPaid] = useState(false)

  // Refs
  const pickupRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const rideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fare = calculateFare(vehicleType, distance || 1)
  const discountedFare = offerApplied ? Math.max(0, fare.total - offerDiscount) : fare.total
  const perKmRate = vehicleType === 'TEMPO' ? 8 : vehicleType === 'AUTO' ? 12 : 6

  // ─── OSRM Distance Calculation ────────────────────────────────────
  const calculateRouteDistance = useCallback(async (pCoords: { lat: number; lng: number }, dCoords: { lat: number; lng: number }) => {
    setDistanceLoading(true)
    try {
      // Use OSRM (Open Source Routing Machine) for real road distance
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pCoords.lng},${pCoords.lat};${dCoords.lng},${dCoords.lat}?overview=false`,
        { headers: { 'User-Agent': 'GramYatri/2.0' } }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.routes && data.routes.length > 0) {
          const distKm = Math.round((data.routes[0].distance / 1000) * 10) / 10 // round to 1 decimal
          setDistance(distKm)
          return
        }
      }
      // Fallback: Haversine straight-line distance * 1.3 (road factor)
      const R = 6371
      const dLat = (dCoords.lat - pCoords.lat) * Math.PI / 180
      const dLon = (dCoords.lng - pCoords.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pCoords.lat * Math.PI / 180) * Math.cos(dCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const straightLine = R * c
      setDistance(Math.round(straightLine * 1.3 * 10) / 10)
    } catch {
      // Fallback: Haversine
      const R = 6371
      const dLat = (dCoords.lat - pCoords.lat) * Math.PI / 180
      const dLon = (dCoords.lng - pCoords.lng) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pCoords.lat * Math.PI / 180) * Math.cos(dCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const straightLine = R * c
      setDistance(Math.round(straightLine * 1.3 * 10) / 10)
    } finally {
      setDistanceLoading(false)
    }
  }, [])

  // Geocode a location name to coordinates using Nominatim
  const geocodeLocation = useCallback(async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // First try with Assam, India bounding box for better results
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&viewbox=89.5,26.5,96.0,24.5&bounded=0&limit=1&accept-language=as,en`,
        { headers: { 'User-Agent': 'GramYatri/2.0' } }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
      }
      // Fallback without bounding box
      const res2 = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&accept-language=as,en`,
        { headers: { 'User-Agent': 'GramYatri/2.0' } }
      )
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.length > 0) {
          return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) }
        }
      }
    } catch {
      // geocoding failed
    }
    return null
  }, [])

  // Auto-calculate distance when both pickup and drop are set
  useEffect(() => {
    if (!pickup || !drop) {
      setDistance(0)
      setPickupCoords(null)
      setDropCoords(null)
      return
    }

    // If we already have both coordinates, calculate distance
    if (pickupCoords && dropCoords) {
      calculateRouteDistance(pickupCoords, dropCoords)
      return
    }

    // Otherwise geocode the locations first
    const geocodeAndCalculate = async () => {
      setDistanceLoading(true)
      let pCoords = pickupCoords
      let dCoords = dropCoords

      if (!pCoords) {
        pCoords = await geocodeLocation(pickup.replace('(GPS)', '').trim())
        if (pCoords) setPickupCoords(pCoords)
      }
      if (!dCoords) {
        dCoords = await geocodeLocation(drop.replace('(GPS)', '').trim())
        if (dCoords) setDropCoords(dCoords)
      }

      if (pCoords && dCoords) {
        await calculateRouteDistance(pCoords, dCoords)
      } else {
        setDistanceLoading(false)
      }
    }

    // Debounce to avoid too many API calls while typing
    const timer = setTimeout(geocodeAndCalculate, 800)
    return () => clearTimeout(timer)
  }, [pickup, drop, pickupCoords, dropCoords, calculateRouteDistance, geocodeLocation])

  const unreadNotifCount = userNotifications.filter(n => !n.read).length

  // Is there an active ride that is not completed/cancelled?
  const hasActiveRide = activeRide && activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED'

  // --- Data fetching ---

  const loadSharedRides = useCallback(async () => {
    if (!userId) return
    setSharedRidesLoading(true)
    try {
      const res = await getSharedRides({ status: 'SCHEDULED' })
      if (res.success && res.sharedRides) {
        const mapped = res.sharedRides.map((sr) => {
          const ride = (sr as Record<string, unknown>).ride as Record<string, unknown> | undefined
          return mapApiRideToRide(ride || sr)
        })
        setSharedRides(mapped)
      }
    } catch {
      setSharedRides([])
    } finally {
      setSharedRidesLoading(false)
    }
  }, [userId])

  const loadRideHistory = useCallback(async () => {
    if (!userId) return
    setRideHistoryLoading(true)
    try {
      const res = await getRides({ userId })
      if (res.success && res.rides) {
        const mapped = res.rides.map(mapApiRideToRide)
        setRideHistory(mapped)
      }
    } catch {
      setRideHistory([])
    } finally {
      setRideHistoryLoading(false)
    }
  }, [userId])

  const loadWallet = useCallback(async () => {
    if (!userId) return
    setWalletLoading(true)
    try {
      const res = await getWallet(userId)
      if (res.success && res.wallet) {
        const balance = res.wallet.balance ?? 0
        setWalletBalance(balance)
        // Always sync the store so stale localStorage data is overwritten
        updateWalletBalance(balance)
      } else {
        // API returned but no wallet — set to 0
        setWalletBalance(0)
        updateWalletBalance(0)
      }
    } catch {
      // API call failed — keep existing local state, don't overwrite with stale store data
    } finally {
      setWalletLoading(false)
    }
  }, [userId, updateWalletBalance])

  const loadWalletTransactions = useCallback(async () => {
    if (!userId) return
    setWalletTransactionsLoading(true)
    try {
      const res = await getWalletTransactions(userId)
      if (res.success && res.transactions) {
        setWalletTransactions(res.transactions)
      }
    } catch {
      setWalletTransactions([])
    } finally {
      setWalletTransactionsLoading(false)
    }
  }, [userId])

  const loadNearbyDrivers = useCallback(async () => {
    setNearbyDriversLoading(true)
    try {
      const res = await getNearbyDrivers(userLat, userLng, vehicleType)
      if (res.success && res.drivers && res.drivers.length > 0) {
        const mapped: NearbyDriverInfo[] = res.drivers.map((d: Record<string, unknown>, i: number) => {
          const user = d.user as Record<string, unknown> | undefined
          const dist = Number(d.distance || 0)
          return {
            id: String(d.id || i),
            name: String(user?.name || 'Driver'),
            vehicleType: String(d.vehicleType || 'TEMPO'),
            vehicleNumber: String(d.vehicleNumber || ''),
            rating: Number(d.rating || 4.0),
            eta: Math.max(2, Math.round(dist * 3)),
            distance: dist,
            totalRides: Number(d.totalRides || 0),
            lat: Number(d.currentLat || 26.14 + Math.random() * 0.04),
            lng: Number(d.currentLng || 91.72 + Math.random() * 0.04),
          }
        })
        setNearbyDrivers(mapped)
      } else {
        setNearbyDrivers([])
      }
    } catch {
      setNearbyDrivers([])
    } finally {
      setNearbyDriversLoading(false)
    }
  }, [vehicleType, userLat, userLng])

  const loadOffers = useCallback(async () => {
    try {
      const res = await getOffers()
      if (res.success && res.offers) {
        setOffers(res.offers)
      }
    } catch {
      // keep empty
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.notifications) {
          const mapped: UserNotification[] = data.notifications.map((n: Record<string, unknown>) => ({
            id: String(n.id),
            title: String(n.title || ''),
            message: String(n.message || ''),
            type: (String(n.type || 'system').toLowerCase() === 'ride' ? 'ride' :
                   String(n.type || 'system').toLowerCase() === 'offer' || String(n.type || 'system').toLowerCase() === 'promo' ? 'offer' : 'system') as UserNotification['type'],
            read: Boolean(n.isRead),
            createdAt: String(n.createdAt || new Date().toISOString()),
          }))
          setUserNotifications(mapped)
        }
      }
    } catch {
      // keep current notifications
    }
  }, [userId])

  // Load payment settings & service area on mount
  useEffect(() => {
    getPaymentSettings().then(setPaymentSettings)
    // Load service area settings
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.success && data.settings) {
        const maxDist = data.settings.find((s: { key: string; value: string }) => s.key === 'service_max_ride_distance')
        if (maxDist) setServiceMaxRideDistance(parseInt(maxDist.value) || 50)
      }
    }).catch(() => {})
  }, [])

  // Load data on mount and when tab changes
  useEffect(() => {
    // Load wallet on mount to get real balance from DB
    loadWallet()
    loadNotifications()
  }, [loadWallet, loadNotifications])

  useEffect(() => {
    if (activeTab === 'home') {
      loadSharedRides()
      loadOffers()
    }
    if (activeTab === 'search') {
      loadNearbyDrivers()
    }
    if (activeTab === 'rides') {
      loadRideHistory()
    }
    if (activeTab === 'wallet') {
      loadWallet()
      loadWalletTransactions()
    }
  }, [activeTab, loadSharedRides, loadNearbyDrivers, loadRideHistory, loadWallet, loadWalletTransactions, loadOffers])

  // NOTE: We do NOT sync wallet balance from the Zustand store (currentUser.walletBalance)
  // here because the store may contain stale data from localStorage persist.
  // Instead, loadWallet() is the single source of truth — it fetches from the API
  // and updates both the local state AND the store via updateWalletBalance().

  // Live tracking simulation for active ride + timer + distance + fare
  useEffect(() => {
    if (!activeRide || activeRide.status === 'COMPLETED' || activeRide.status === 'CANCELLED') {
      // Clean up timer if ride is completed
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current)
        rideTimerRef.current = null
      }
      return
    }

    const statusOrder: Record<string, number> = { SEARCHING: 0, ACCEPTED: 1, IN_PROGRESS: 2 }
    const currentIdx = statusOrder[activeRide.status] ?? 0
    setTrackingStatusIndex(currentIdx)

    // Initialize tracking data
    const totalDist = activeRide.distance || distance
    setDistanceRemaining(totalDist)
    setLiveFare(activeRide.fare || discountedFare)

    // Ride duration timer - only when ride is IN_PROGRESS
    if (activeRide.status === 'IN_PROGRESS') {
      if (!rideTimerRef.current) {
        setRideDuration(0)
        rideTimerRef.current = setInterval(() => {
          setRideDuration(prev => prev + 1)
        }, 1000)
      }
    }

    // Progress and ETA simulation
    const progressInterval = setInterval(() => {
      setLiveTrackingEta(prev => Math.max(1, prev - 1))
      setDriverProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
      // Update distance remaining based on progress
      setDistanceRemaining(prev => {
        const newVal = prev - 0.3
        return newVal <= 0.1 ? 0.1 : newVal
      })
      // Update live fare (incremental based on per-km rate)
      setLiveFare(prev => {
        const rate = activeRide.vehicleType === 'TEMPO' ? 8 : activeRide.vehicleType === 'AUTO' ? 12 : 6
        return prev + (rate * 0.3 / 5)
      })
    }, 5000)

    return () => {
      clearInterval(progressInterval)
    }
  }, [activeRide?.id, activeRide?.status])

  // Detect ride completion and show payment summary
  useEffect(() => {
    if (activeRide?.status === 'COMPLETED' && !showPaymentSummary) {
      // Clean up timer
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current)
        rideTimerRef.current = null
      }
      setCompletedRide(activeRide)
      setLiveFare(activeRide.fare)
      setShowPaymentSummary(true)
    }
  }, [activeRide?.status])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current)
      }
    }
  }, [])

  // Auto-detect GPS location on first mount (silent, no error toasts)
  const gpsAutoDetected = useRef(false)
  useEffect(() => {
    if (gpsAutoDetected.current) return
    gpsAutoDetected.current = true

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLat(lat)
        setUserLng(lng)

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=as,en`,
            { headers: { 'User-Agent': 'GramYatri/2.0' } }
          )
          if (!res.ok) return
          const data = await res.json()
          if (data.error) return

          const addr = data.address || {}
          const parts: string[] = []
          const village = addr.village || addr.hamlet || addr.town || addr.neighbourhood || addr.suburb
          if (village) parts.push(village)
          const road = addr.road || addr.pedestrian
          if (road && !parts.includes(road)) parts.push(road)
          const city = addr.city || addr.county
          if (city && !parts.includes(city)) parts.push(city)

          const locationName = parts.length > 0
            ? parts.slice(0, 3).join(', ') + ' (GPS)'
            : data.display_name
              ? data.display_name.split(',').slice(0, 2).map((s: string) => s.trim()).join(', ') + ' (GPS)'
              : `${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS)`

          // Only set pickup if it's currently empty
          setPickup(prev => prev || locationName)
          // Also set pickup coordinates so distance calculation works immediately
          setPickupCoords({ lat, lng })
        } catch {
          // Silent fail for auto-detect
        }
      },
      () => {
        // GPS denied or unavailable — silent, user can click detect button manually
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [])

  // Click outside to close suggestions
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) {
        setShowPickupSuggestions(false)
      }
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // --- Handlers ---

  const handlePickupChange = (val: string) => {
    setPickup(val)
    setPickupCoords(null) // Reset coords so they get re-geocoded
    if (val.length > 0) {
      const filtered = LOCATION_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()))
      setPickupSuggestions(filtered)
      setShowPickupSuggestions(filtered.length > 0)
    } else {
      setShowPickupSuggestions(false)
    }
  }

  const handleDropChange = (val: string) => {
    setDrop(val)
    setDropCoords(null) // Reset coords so they get re-geocoded
    if (val.length > 0) {
      const filtered = LOCATION_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()))
      setDropSuggestions(filtered)
      setShowDropSuggestions(filtered.length > 0)
    } else {
      setShowDropSuggestions(false)
    }
  }

  const handleGpsDetect = async (target: 'pickup' | 'drop') => {
    setGpsDetecting(true)

    if (!navigator.geolocation) {
      toast.error('GPS is not supported by your browser')
      setGpsDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLat(lat)
        setUserLng(lng)

        // Helper: try reverse geocoding at a given zoom level
        const reverseGeocode = async (zoom: number): Promise<string> => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1&accept-language=as,en`,
              { headers: { 'User-Agent': 'GramYatri/2.0' } }
            )
            if (!res.ok) return ''
            const data = await res.json()
            if (data.error) return ''
            const addr = data.address || {}
            const parts: string[] = []

            // For rural Assam, village/hamlet name is most useful — prioritize it
            const village = addr.village || addr.hamlet || addr.town || addr.neighbourhood ||
              addr.quarter || addr.suburb || addr.residential
            if (village) parts.push(village)

            // Road/street if available and not already included
            const road = addr.road || addr.pedestrian
            if (road && !parts.includes(road)) parts.push(road)

            // City/district level
            const city = addr.city || addr.city_district || addr.county
            if (city && !parts.includes(city)) parts.push(city)

            // Limit to 2-3 parts for readability
            if (parts.length > 0) {
              return parts.slice(0, 3).join(', ') + ' (GPS)'
            }
            // Fallback to display_name
            if (data.display_name) {
              const displayParts = data.display_name.split(',').map((s: string) => s.trim()).filter(Boolean)
              return displayParts.slice(0, 2).join(', ') + ' (GPS)'
            }
            return ''
          } catch {
            return ''
          }
        }

        let locationName = ''
        try {
          // Use zoom=14 (village/neighborhood level — better for rural areas)
          locationName = await reverseGeocode(14)
          // If nothing useful at zoom 14, try zoom=12 for a broader area
          if (!locationName) {
            locationName = await reverseGeocode(12)
          }
        } catch {
          // Reverse geocoding failed
        }

        if (!locationName) {
          locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS)`
        }

        if (target === 'pickup') {
          setPickup(locationName)
          setPickupCoords({ lat, lng })
          setShowPickupSuggestions(false)
        } else {
          setDrop(locationName)
          setDropCoords({ lat, lng })
          setShowDropSuggestions(false)
        }
        toast.success('অৱস্থান চিনাক্ত হ\'ল! / Location detected!')
        setGpsDetecting(false)
      },
      (error) => {
        // GPS failed — show specific error message
        let msg = 'GPS চিনাক্ত কৰিব পৰা নগ\'ল।'
        if (error.code === 1) {
          msg = 'অৱস্থান অনুমতি অস্বীকাৰ কৰা হৈছে। ব্ৰাউজাৰ ছেটিংছত GPS অন কৰক।'
        } else if (error.code === 2) {
          msg = 'অৱস্থান পোৱা নগ\'ল। অনুগ্ৰহ কৰি মুক্ত আকাশৰ তলত চেষ্টা কৰক।'
        } else if (error.code === 3) {
          msg = 'GPS টাইমআউট। পুনৰ চেষ্টা কৰক।'
        }
        toast.error(msg)
        setGpsDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  const handleSearchRide = async () => {
    if (!pickup || !drop || !userId) return
    setSearching(true)
    setShowSearchingOverlay(true)
    try {
      const res = await createRide({
        userId,
        pickupAddress: pickup,
        dropAddress: drop,
        fare: discountedFare,
        distance,
        paymentMethod,
        vehicleType,
        offerCode: offerApplied ? offerCode : undefined,
      })
      if (res.success && res.ride) {
        const mappedRide = mapApiRideToRide(res.ride)
        setActiveRide(mappedRide)
        emitRideRequest({
          rideId: mappedRide.id,
          userId,
          pickupAddress: pickup,
          dropAddress: drop,
          fare: discountedFare,
          vehicleType,
        })
        toast.success('Ride booked! Searching for drivers...')
        // Keep searching overlay visible for a few seconds then switch
        setTimeout(() => {
          setShowSearchingOverlay(false)
          setActiveTab('rides')
        }, 3000)
      } else {
        setShowSearchingOverlay(false)
        toast.error('Failed to book ride. Please try again.')
      }
    } catch {
      setShowSearchingOverlay(false)
      toast.error('Failed to book ride. Please check your connection.')
    } finally {
      setSearching(false)
    }
  }

  const handleCancelSearch = () => {
    setShowSearchingOverlay(false)
    if (activeRide && activeRide.status === 'SEARCHING') {
      handleCancelRide()
    }
  }

  const handleApplyOffer = async () => {
    if (!offerCode) return
    setOfferValidating(true)
    try {
      const res = await validateOffer(offerCode, fare.total)
      if (res.success && res.discount) {
        setOfferDiscount(res.discount)
        setOfferApplied(true)
        toast.success(`Offer applied! You save ₹${res.discount}`)
      } else {
        setOfferApplied(false)
        setOfferDiscount(0)
        toast.error('Invalid or expired offer code')
      }
    } catch {
      setOfferApplied(false)
      setOfferDiscount(0)
      toast.error('Failed to validate offer code')
    } finally {
      setOfferValidating(false)
    }
  }

  const handleRemoveOffer = () => {
    setOfferCode('')
    setOfferDiscount(0)
    setOfferApplied(false)
  }

  const handleEmergency = () => {
    setShowEmergencyDialog(true)
  }

  const handleSendEmergency = async () => {
    if (!userId) return
    setEmergencySending(true)
    try {
      await createEmergencyAlert({
        userId,
        rideId: activeRide?.id,
        message: emergencyMessage || undefined,
      })
      toast.success('Emergency SOS sent! Help is on the way.')
      setShowEmergencyDialog(false)
      setEmergencyMessage('')
    } catch {
      toast.error('Failed to send emergency alert. Please call emergency services directly.')
    } finally {
      setEmergencySending(false)
    }
  }

  const handleAddMoney = async () => {
    const amount = parseInt(addMoneyAmount)
    if (!amount || amount <= 0 || !userId) return

    // Check if UPI payment is configured by admin
    if (paymentSettings.upiPaymentEnabled && (paymentSettings.upiId || paymentSettings.paymentQrUrl)) {
      // UPI is configured — show payment first, add money only after user confirms payment
      setShowUpiPayment(true)
    } else {
      // No UPI configured — direct add (for demo/testing only)
      try {
        const result = await addWalletMoney(userId, amount)
        if (result.success) {
          setWalletBalance(result.balance)
          updateWalletBalance(result.balance)
          toast.success(`₹${amount} added to wallet`)
          loadWalletTransactions()
        } else {
          toast.error('Failed to add money')
        }
      } catch {
        toast.error('Failed to add money. Please try again.')
      }
      setAddMoneyAmount('')
    }
  }

  const handleUpiPaymentDone = async () => {
    const amount = parseInt(addMoneyAmount)
    if (!amount || amount <= 0 || !userId) return

    // User confirmed they completed UPI payment — now add money to wallet
    try {
      const result = await addWalletMoney(userId, amount)
      if (result.success) {
        setWalletBalance(result.balance)
        updateWalletBalance(result.balance)
        toast.success(`₹${amount} added to wallet after payment`)
        loadWalletTransactions()
      } else {
        toast.error('Failed to update wallet. Please contact support.')
      }
    } catch {
      toast.error('Failed to update wallet. Please contact support.')
    }
    setAddMoneyAmount('')
    setShowUpiPayment(false)
    setUpiPaid(false)
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const handleRateRide = async (rideId: string, rating: number) => {
    const ride = rideHistory.find((r) => r.id === rideId)
    try {
      await createRating({
        rideId,
        fromUserId: userId,
        toUserId: ride?.driverId || '',
        toDriverId: ride?.driverId,
        rating,
      })
      toast.success('Rating submitted!')
    } catch {
      toast.error('Failed to submit rating')
    }
    setRideHistory((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, rating } : r))
    )
  }

  const handleCancelRide = async () => {
    if (!activeRide) return
    try {
      await updateRide(activeRide.id, { status: 'CANCELLED' })
      setActiveRide(null)
      setShowSearchingOverlay(false)
      toast.success('Ride cancelled')
    } catch {
      toast.error('Failed to cancel ride')
    }
  }

  const handleSaveProfile = () => {
    toast.success('Profile updated!')
    setShowProfileEdit(false)
  }

  const handleCallDriver = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self')
    } else if (activeRide?.driverPhone) {
      window.open(`tel:${activeRide.driverPhone}`, '_self')
    }
  }

  const handleOpenGoogleMaps = () => {
    const origin = encodeURIComponent(pickup || activeRide?.pickup || 'Lanka Market, Assam')
    const destination = encodeURIComponent(drop || activeRide?.drop || 'Hojai Bus Stand, Assam')
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, '_blank')
  }

  const handleShareRide = () => {
    const rideDetails = activeRide
      ? `🛺 GramYatri Ride\nFrom: ${activeRide.pickup}\nTo: ${activeRide.drop}\nDriver: ${activeRide.driverName || 'Being assigned'}\nFare: ₹${Math.round(liveFare)}\nTrack: https://maps.google.com/?q=${encodeURIComponent(activeRide.drop)}`
      : `🛺 GramYatri - Book your ride!`
    navigator.clipboard.writeText(rideDetails).then(() => {
      toast.success('Ride details copied to clipboard!')
    }).catch(() => {
      toast.info('Share: ' + rideDetails)
    })
  }

  const handlePaymentConfirm = () => {
    if (driverRating > 0) {
      if (completedRide) {
        handleRateRide(completedRide.id, driverRating)
      }
    }
    if (tipAmount > 0 && completedRide?.driverId) {
      // In a real app, this would process the tip
      toast.success(`₹${tipAmount} tip added for the driver!`)
    }
    setShowPaymentSummary(false)
    setActiveRide(null)
    setCompletedRide(null)
    setDriverRating(0)
    setTipAmount(0)
    setRideDuration(0)
  }

  const tabs: { key: UserTab; label: string; icon: typeof Home }[] = [
    { key: 'home', label: lang === 'as' ? 'গৃহ' : 'Home', icon: Home },
    { key: 'search', label: lang === 'as' ? 'সন্ধান' : 'Search', icon: Search },
    { key: 'rides', label: lang === 'as' ? 'ৰাইড' : 'Rides', icon: ClipboardList },
    { key: 'wallet', label: t('wallet'), icon: WalletIcon },
    { key: 'profile', label: t('profile'), icon: UserIcon },
  ]

  const vehicleOptions = [
    { key: 'TEMPO', label: 'Tempo', emoji: '🛺', desc: '₹15 + ₹8/km', icon: Truck },
    { key: 'AUTO', label: 'Auto', emoji: '🚗', desc: '₹20 + ₹12/km', icon: Car },
    { key: 'E_RICKSHAW', label: 'E-Rickshaw', emoji: '🛵', desc: '₹10 + ₹6/km', icon: Bike },
  ]

  const emergencyContacts = [
    { label: 'Police', number: '100' },
    { label: 'Ambulance', number: '108' },
    { label: 'Women Helpline', number: '1091' },
  ]

  const filteredRideHistory = rideHistory.filter(ride => {
    if (rideFilter === 'ALL') return true
    if (rideFilter === 'COMPLETED') return ride.status === 'COMPLETED'
    if (rideFilter === 'CANCELLED') return ride.status === 'CANCELLED'
    return true
  })

  const filteredNotifications = userNotifications.filter(n => {
    if (notifFilter === 'all') return true
    return n.type === notifFilter
  })

  // Render star rating
  const renderStars = (rating: number, interactive: boolean, onChange?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileTap={interactive ? { scale: 0.8 } : undefined}
            onClick={() => interactive && onChange?.(star)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </motion.button>
        ))}
      </div>
    )
  }

  // Show SharedTempoPanel as full-screen overlay
  if (showSharedTempo) {
    return <SharedTempoPanel onBack={() => setShowSharedTempo(false)} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Offline Booking Indicator */}
      <OfflineBookingIndicator />

      {/* ===================== SEARCHING OVERLAY ===================== */}
      <AnimatePresence>
        {showSearchingOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            {/* Animated searching indicator */}
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="w-28 h-28 rounded-full border-4 border-muted border-t-emerald-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Truck className="h-10 w-10 text-emerald-600" />
                </motion.div>
              </div>
            </div>

            {/* Pulse rings */}
            <div className="relative w-40 h-4 mb-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.5, 2] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-400" />
                </motion.div>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-2">Matching you with nearby drivers...</h3>
            <p className="text-muted-foreground text-sm mb-1 text-center">
              Finding the best driver for your {vehicleOptions.find(v => v.key === vehicleType)?.label} ride
            </p>
            <p className="text-muted-foreground text-xs mb-8 text-center">
              {pickup} → {drop}
            </p>

            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleCancelSearch}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Search
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ===================== HOME TAB ===================== */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Header with Greeting & Notification Bell */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {getGreeting(lang)}, {currentUser?.name?.split(' ')[0] || (lang === 'as' ? 'যাত্ৰী' : 'Traveller')} 👋
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t('whereTo')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(true)}
                    className="relative p-2 rounded-full bg-card shadow-sm"
                  >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {unreadNotifCount}
                      </span>
                    )}
                  </motion.button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                      {(currentUser?.name || 'T')[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Quick Booking Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-4">
                    Where are you going?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg p-3">
                      <Crosshair className="h-4 w-4 text-emerald-200 shrink-0" />
                      <input
                        type="text"
                        placeholder="Pickup location"
                        value={pickup}
                        onChange={(e) => handlePickupChange(e.target.value)}
                        className="bg-transparent placeholder:text-white/60 text-white text-sm w-full outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg p-3">
                      <MapPin className="h-4 w-4 text-orange-300 shrink-0" />
                      <input
                        type="text"
                        placeholder="Drop location"
                        value={drop}
                        onChange={(e) => handleDropChange(e.target.value)}
                        className="bg-transparent placeholder:text-white/60 text-white text-sm w-full outline-none"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 bg-white text-emerald-700 hover:bg-white/90 font-bold"
                    onClick={() => { setActiveTab('search') }}
                  >
                    Search Rides
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Book Ride', icon: Navigation, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950', action: () => setActiveTab('search') },
                  { label: 'Shared Tempo', icon: Users, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950', action: () => setShowSharedTempo(true) },
                  { label: 'Wallet', icon: Wallet, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950', action: () => setActiveTab('wallet') },
                  { label: 'History', icon: History, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950', action: () => setActiveTab('rides') },
                ].map((action) => (
                  <motion.button
                    key={action.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.action}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card shadow-sm"
                  >
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Vehicle Type Quick Select */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Select Vehicle</h3>
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

              {/* Active Ride Status */}
              {activeRide && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Ride
                  </h3>
                  <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            activeRide.status === 'SEARCHING' ? 'bg-yellow-100 text-yellow-800' :
                            activeRide.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {STATUS_LABELS[activeRide.status]?.label || activeRide.status}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">₹{activeRide.fare}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <div className="w-0.5 h-4 bg-muted" />
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activeRide.pickup}</p>
                          <p className="text-sm text-muted-foreground">{activeRide.drop}</p>
                        </div>
                      </div>
                      {activeRide.driverName && (
                        <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                                {activeRide.driverName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium">{activeRide.driverName}</p>
                              <p className="text-[10px] text-muted-foreground">{activeRide.driverVehicle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleCallDriver(activeRide.driverPhone)}>
                              <Phone className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-9"
                        onClick={() => setActiveTab('rides')}
                      >
                        View Live Tracking
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Nearby Shared Rides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Nearby Shared Rides</h3>
                  <button
                    className="text-xs text-emerald-600 font-medium"
                    onClick={() => setShowSharedTempo(true)}
                  >
                    See All →
                  </button>
                </div>
                {sharedRidesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading shared rides...</span>
                  </div>
                ) : sharedRides.length > 0 ? (
                  <div className="space-y-2">
                    {sharedRides.slice(0, 2).map((ride) => (
                      <SharedRideCard key={ride.id} ride={ride} onJoin={() => {}} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">No shared rides available right now</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Active Offers */}
              {offers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Gift className="h-4 w-4 text-orange-500" />
                    Active Offers
                  </h3>
                  <div className="space-y-2">
                    {offers.slice(0, 2).map((offer, i) => (
                      <Card key={i} className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Zap className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold">{String(offer.code || offer.name || 'OFFER')}</p>
                            <p className="text-[10px] text-muted-foreground">{String(offer.description || 'Special discount on rides')}</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-[10px]">
                            {String(offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`)}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===================== SEARCH / MAP TAB ===================== */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-0"
            >
              {/* Realistic Map Placeholder */}
              <div className="w-full h-56 bg-gradient-to-br from-emerald-50 via-green-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
                {/* SVG Map Grid - Roads */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid roads */}
                  <defs>
                    <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="30" x2="60" y2="30" stroke="rgba(22,163,74,0.12)" strokeWidth="8" />
                      <line x1="30" y1="0" x2="30" y2="60" stroke="rgba(22,163,74,0.12)" strokeWidth="8" />
                      <line x1="0" y1="30" x2="60" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4,4" />
                      <line x1="30" y1="0" x2="30" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4,4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#roadGrid)" />

                  {/* Main road - horizontal */}
                  <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(22,163,74,0.2)" strokeWidth="16" />
                  <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="8,6" />

                  {/* Main road - vertical */}
                  <line x1="180" y1="0" x2="180" y2="250" stroke="rgba(22,163,74,0.2)" strokeWidth="16" />
                  <line x1="180" y1="0" x2="180" y2="250" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="8,6" />

                  {/* Diagonal road */}
                  <line x1="40" y1="200" x2="350" y2="50" stroke="rgba(22,163,74,0.15)" strokeWidth="10" />
                  <line x1="40" y1="200" x2="350" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="6,6" />

                  {/* Route line from pickup to drop */}
                  {pickup && drop && (
                    <>
                      <path d="M 100 140 Q 180 80 260 130 T 340 90" stroke="#f97316" strokeWidth="3" fill="none" strokeDasharray="6,4" opacity="0.8" />
                      {/* Route glow */}
                      <path d="M 100 140 Q 180 80 260 130 T 340 90" stroke="#f97316" strokeWidth="8" fill="none" opacity="0.15" />
                    </>
                  )}

                  {/* Pickup Pin (Green) */}
                  {pickup && (
                    <g transform="translate(100, 120)">
                      <circle r="8" fill="#16a34a" opacity="0.3">
                        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle r="6" fill="#16a34a" />
                      <circle r="2.5" fill="white" />
                    </g>
                  )}

                  {/* Drop Pin (Orange) */}
                  {drop && (
                    <g transform="translate(340, 80)">
                      <circle r="8" fill="#f97316" opacity="0.3">
                        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle r="6" fill="#f97316" />
                      <circle r="2.5" fill="white" />
                    </g>
                  )}

                  {/* Animated Nearby Driver dots */}
                  <circle cx="150" cy="90" r="4" fill="#f97316">
                    <animate attributeName="cx" values="150;155;148;150" dur="8s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="90;85;92;90" dur="6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="250" cy="160" r="4" fill="#f97316">
                    <animate attributeName="cx" values="250;245;255;250" dur="7s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="160;165;155;160" dur="5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="80" cy="180" r="4" fill="#16a34a">
                    <animate attributeName="cx" values="80;85;75;80" dur="9s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="180;175;185;180" dur="7s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="300" cy="50" r="4" fill="#16a34a">
                    <animate attributeName="cx" values="300;295;305;300" dur="6s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="50;55;48;50" dur="8s" repeatCount="indefinite" />
                  </circle>

                  {/* My Location (Blue) */}
                  <g transform="translate(180, 120)">
                    <circle r="12" fill="#3b82f6" opacity="0.15">
                      <animate attributeName="r" values="12;18;12" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle r="6" fill="#3b82f6" opacity="0.3">
                      <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* Map Labels */}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-medium">My Location</span>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Driver
                  </div>
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5 text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pickup
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button size="sm" variant="secondary" className="h-7 w-7 p-0 rounded-full">
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-7 w-7 p-0 rounded-full">
                    <Locate className="h-3 w-3" />
                  </Button>
                </div>

                {/* Google Maps Link Button on Map */}
                {pickup && drop && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenGoogleMaps}
                    className="absolute bottom-2 left-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">Open in Google Maps</span>
                  </motion.button>
                )}
              </div>

              {/* Scrollable Content Below Map */}
              <div className="p-4 space-y-4">
                {/* Pickup/Drop Input Card with Suggestions & GPS */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="w-0.5 h-8 bg-muted" />
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative" ref={pickupRef}>
                          <Input
                            placeholder="Pickup location"
                            value={pickup}
                            onChange={(e) => handlePickupChange(e.target.value)}
                            onFocus={() => { if (pickupSuggestions.length > 0) setShowPickupSuggestions(true) }}
                          />
                          <AnimatePresence>
                            {showPickupSuggestions && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border rounded-lg shadow-lg max-h-32 overflow-y-auto"
                              >
                                {pickupSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                                    onClick={() => { setPickup(s); setPickupCoords(null); setShowPickupSuggestions(false) }}
                                  >
                                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                    {s}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="relative" ref={dropRef}>
                          <Input
                            placeholder="Drop location"
                            value={drop}
                            onChange={(e) => handleDropChange(e.target.value)}
                            onFocus={() => { if (dropSuggestions.length > 0) setShowDropSuggestions(true) }}
                          />
                          <AnimatePresence>
                            {showDropSuggestions && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border rounded-lg shadow-lg max-h-32 overflow-y-auto"
                              >
                                {dropSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                                    onClick={() => { setDrop(s); setDropCoords(null); setShowDropSuggestions(false) }}
                                  >
                                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                    {s}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => handleGpsDetect('pickup')}
                        disabled={gpsDetecting}
                      >
                        {gpsDetecting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : (
                          <Crosshair className="h-4 w-4 text-emerald-600" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Type Selector */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Vehicle Type</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {vehicleOptions.map((v) => (
                      <motion.button
                        key={v.key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setVehicleType(v.key); loadNearbyDrivers() }}
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

                {/* Nearby Drivers */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-600" />
                    Nearby Drivers
                  </h3>
                  {nearbyDriversLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <span className="ml-2 text-xs text-muted-foreground">Finding nearby drivers...</span>
                    </div>
                  ) : nearbyDrivers.filter(d => !vehicleType || d.vehicleType === vehicleType).length === 0 ? (
                    <div className="py-4 text-center">
                      <Truck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No drivers available nearby. Try again later.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {nearbyDrivers.filter(d => !vehicleType || d.vehicleType === vehicleType).slice(0, 4).map((driver) => (
                        <Card key={driver.id} className="border-0 shadow-sm">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">
                                {driver.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate">{driver.name}</p>
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                                  <span className="text-[10px] text-muted-foreground">{driver.rating}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {driver.vehicleType === 'TEMPO' ? '🛺' : driver.vehicleType === 'AUTO' ? '🚗' : '🛵'} {driver.vehicleNumber}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-emerald-600">{driver.eta} min</p>
                              <p className="text-[10px] text-muted-foreground">{driver.distance} km</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Distance & Fare Card (auto-calculated) */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    {distanceLoading ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        <span className="text-sm text-muted-foreground">{lang === 'as' ? 'দূৰত্ব গণনা কৰি আছে...' : 'Calculating distance...'}</span>
                      </div>
                    ) : distance > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <Route className="h-4 w-4 text-emerald-600" />
                            {lang === 'as' ? 'আনুমানিক দূৰত্ব' : 'Estimated Distance'}
                          </span>
                          <span className="text-lg font-bold text-emerald-600">{distance} km</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (distance / 30) * 100)}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>0 km</span>
                          <span>30 km</span>
                        </div>
                      </div>
                    ) : pickup && drop ? (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">{lang === 'as' ? 'দূৰত্ব গণনা কৰিব নোৱাৰি — অনুগ্ৰহ কৰি স্পষ্ট ঠিকনা লিখক' : 'Could not calculate distance — please enter clear addresses'}</p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">{lang === 'as' ? 'পিকআপ আৰু ড্ৰপ ঠিকনা লিখক দূৰত্ব জানিবলৈ' : 'Enter pickup & drop locations to see distance'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fare Breakdown Card */}
                {distance > 0 && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-3">{t('fareEstimate')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('baseFare')}</span>
                        <span>₹{fare.baseFare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('distance')} ({distance} km × ₹{perKmRate})</span>
                        <span>₹{fare.distanceFare}</span>
                      </div>
                      {offerApplied && offerDiscount > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Offer Discount</span>
                          <span>-₹{offerDiscount}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total Fare</span>
                        <span className="text-emerald-600">₹{discountedFare}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Service Area Warning */}
                {distance > serviceMaxRideDistance && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        {lang === 'as' ? 'এই ৰাইড সেৱা সীমাৰ বাহিৰত' : 'This ride is outside service area'}
                      </p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">
                        {lang === 'as' 
                          ? `সৰ্বাধিক ${serviceMaxRideDistance} km লৈকে সেৱা উপলব্ধ। আপোনাৰ ৰাইড ${distance} km।`
                          : `Service available up to ${serviceMaxRideDistance} km. Your ride is ${distance} km.`
                        }
                      </p>
                    </div>
                  </div>
                )}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-500 shrink-0" />
                      <Input
                        placeholder="Offer code"
                        value={offerCode}
                        onChange={(e) => {
                          setOfferCode(e.target.value)
                          if (offerApplied) { setOfferApplied(false); setOfferDiscount(0) }
                        }}
                        className="flex-1"
                        disabled={offerApplied}
                      />
                      {offerApplied ? (
                        <Button variant="outline" size="sm" onClick={handleRemoveOffer} className="text-red-600">
                          <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={handleApplyOffer} disabled={!offerCode || offerValidating}>
                          {offerValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {offerApplied && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Star className="h-3 w-3 fill-emerald-600" />
                        Offer applied! You save ₹{offerDiscount}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Payment Method</span>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentMethod('CASH')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                            paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-muted'
                          }`}
                        >
                          <Banknote className="h-3 w-3" /> Cash
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPaymentMethod('WALLET')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                            paymentMethod === 'WALLET' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-muted'
                          }`}
                        >
                          <Wallet className="h-3 w-3" /> Wallet
                        </motion.button>
                      </div>
                    </div>
                    {paymentMethod === 'WALLET' && walletBalance < discountedFare && (
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Insufficient wallet balance. Add ₹{discountedFare - walletBalance} more.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Book Ride Button + Google Maps Link */}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-bold"
                  onClick={() => setShowBookingConfirm(true)}
                  disabled={searching || !pickup || !drop || distance <= 0 || distanceLoading || distance > serviceMaxRideDistance}
                >
                  {searching ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="mr-2">
                      <Clock className="h-5 w-5" />
                    </motion.div>
                  ) : null}
                  {searching ? 'Searching for drivers...' : distanceLoading ? (lang === 'as' ? 'দূৰত্ব গণনা হৈ আছে...' : 'Calculating...') : distance > 0 ? `Book Ride - ₹${discountedFare}` : (lang === 'as' ? 'ঠিকনা লিখক' : 'Enter locations')}
                </Button>

                {/* Google Maps Link below book button */}
                {pickup && drop && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenGoogleMaps}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps for Directions
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ===================== RIDES TAB ===================== */}
          {activeTab === 'rides' && (
            <motion.div
              key="rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Live Tracking for Active Ride */}
              {activeRide && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Tracking
                  </h3>

                  {/* Tracking Map */}
                  <div className="w-full h-40 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden mb-3">
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="trackGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(22,163,74,0.1)" strokeWidth="6" />
                          <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(22,163,74,0.1)" strokeWidth="6" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#trackGrid)" />

                      {/* Route */}
                      <path d="M 50 100 Q 150 40 250 80 T 340 50" stroke="#f97316" strokeWidth="2.5" fill="none" strokeDasharray="5,3" opacity="0.7" />

                      {/* Pickup marker */}
                      <circle cx="50" cy="100" r="5" fill="#16a34a" stroke="white" strokeWidth="2" />

                      {/* Driver marker - animated */}
                      <g>
                        <circle r="8" fill="#f97316" opacity="0.2">
                          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={50 + driverProgress * 2.9} cy={100 - driverProgress * 0.5} r="5" fill="#f97316" stroke="white" strokeWidth="2">
                          <animate attributeName="cx" values="80;180;280" dur="30s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="80;70;60" dur="30s" repeatCount="indefinite" />
                        </circle>
                      </g>

                      {/* Drop marker */}
                      <circle cx="340" cy="50" r="5" fill="#f97316" stroke="white" strokeWidth="2" />

                      {/* My Location */}
                      <circle cx="50" cy="100" r="4" fill="#3b82f6" opacity="0.3">
                        <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
                      </circle>
                    </svg>

                    {/* ETA overlay */}
                    <div className="absolute top-2 left-2 bg-white/95 dark:bg-gray-800/95 rounded-lg px-3 py-1.5 shadow-sm">
                      <p className="text-[10px] text-muted-foreground">ETA</p>
                      <p className="text-sm font-bold text-emerald-600">{liveTrackingEta} min</p>
                    </div>

                    {/* Google Maps link on tracking map */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleOpenGoogleMaps}
                      className="absolute bottom-2 right-2 bg-white/95 dark:bg-gray-800/95 rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm text-[10px] font-medium text-emerald-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Google Maps
                    </motion.button>
                  </div>

                  {/* Status Progress Bar */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        {RIDE_STATUS_FLOW.map((status, idx) => {
                          const StatusIcon = STATUS_LABELS[status]?.icon || CircleDot
                          const isCompleted = idx <= trackingStatusIndex
                          const isCurrent = idx === trackingStatusIndex
                          return (
                            <div key={status} className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-2 ring-emerald-300 animate-pulse' : ''}`}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <span className={`text-[8px] text-center leading-tight ${
                                isCompleted ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                              }`}>
                                {STATUS_LABELS[status]?.label || status}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <Progress value={driverProgress} className="h-2" />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{activeRide.pickup}</span>
                        <span>{activeRide.drop}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Live Tracking Info - Timer, Distance, Fare */}
                  {activeRide.status === 'IN_PROGRESS' && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3 text-center">
                          <Timer className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-emerald-600">{formatDuration(rideDuration)}</p>
                          <p className="text-[9px] text-muted-foreground">Ride Duration</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3 text-center">
                          <Route className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-orange-600">{distanceRemaining.toFixed(1)} km</p>
                          <p className="text-[9px] text-muted-foreground">Distance Left</p>
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-3 text-center">
                          <IndianRupee className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-purple-600">₹{Math.round(liveFare)}</p>
                          <p className="text-[9px] text-muted-foreground">Est. Fare</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Enhanced Driver Details Card */}
                  {activeRide.driverName && (
                    <Card className="border-0 shadow-md mt-3">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-14 w-14 border-2 border-emerald-200">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">
                              {activeRide.driverName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base">{activeRide.driverName}</p>
                            <p className="text-xs text-muted-foreground">{activeRide.driverVehicle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(Math.round(activeRide.rating || 0), false)}
                              <span className="text-xs text-muted-foreground">{activeRide.rating ? activeRide.rating.toFixed(1) : 'N/A'}</span>
                              <span className="text-[10px] text-muted-foreground">• {Math.floor(Math.random() * 400) + 100} rides</span>
                            </div>
                          </div>
                        </div>

                        {/* Estimated Arrival Time - Prominent */}
                        {activeRide.status === 'ACCEPTED' && (
                          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                              <Clock className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Arriving in {liveTrackingEta} minutes</p>
                              <p className="text-[10px] text-muted-foreground">Driver is on the way to pick you up</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                            onClick={() => handleCallDriver(activeRide.driverPhone)}
                          >
                            <PhoneCall className="h-4 w-4 mr-1.5" />
                            Call Driver
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-10"
                            onClick={handleShareRide}
                          >
                            <Share2 className="h-4 w-4 mr-1.5" />
                            Share Ride
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Share My Ride Button (during active tracking) */}
                  {activeRide.status === 'IN_PROGRESS' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShareRide}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-sm font-medium"
                    >
                      <Share2 className="h-4 w-4" />
                      Share My Ride Details
                      <Copy className="h-3 w-3 ml-1" />
                    </motion.button>
                  )}

                  {/* Cancel Ride */}
                  {activeRide.status !== 'IN_PROGRESS' && activeRide.status !== 'COMPLETED' && (
                    <Button variant="outline" className="w-full mt-3 text-red-600 border-red-200 hover:bg-red-50" onClick={handleCancelRide}>
                      Cancel Ride
                    </Button>
                  )}
                </div>
              )}

              {/* Ride History with Filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Ride History
                  </h3>
                </div>

                {/* Ride Filter Tabs */}
                <div className="flex gap-2 mb-3">
                  {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((filter) => (
                    <motion.button
                      key={filter}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRideFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        rideFilter === filter
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>

                {rideHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading ride history...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRideHistory.map((ride) => (
                      <RideCard
                        key={ride.id}
                        ride={ride}
                        variant="history"
                        onRate={handleRateRide}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Empty state when no rides */}
              {rideHistory.length === 0 && !activeRide && !rideHistoryLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No rides yet. Book your first ride!</p>
                  <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setActiveTab('search')}>
                    Book a Ride
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ===================== WALLET TAB ===================== */}
          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* Balance Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-emerald-100">Available Balance</span>
                    <Wallet className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    ₹{walletBalance}
                    {walletLoading && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                  </div>
                  <p className="text-xs text-emerald-200">GramYatri Wallet</p>
                </CardContent>
              </Card>

              {/* Add Money */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-600" />
                    Add Money
                    {paymentSettings.upiPaymentEnabled && paymentSettings.upiId && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[9px] ml-auto">UPI</Badge>
                    )}
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={addMoneyAmount}
                        onChange={(e) => setAddMoneyAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleAddMoney}
                      disabled={!addMoneyAmount || parseInt(addMoneyAmount) <= 0}
                    >
                      Add
                    </Button>
                  </div>
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setAddMoneyAmount(String(amt))}
                      >
                        ₹{amt}
                      </Button>
                    ))}
                  </div>
                  {paymentSettings.upiPaymentEnabled && paymentSettings.upiId && (
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      Payment via UPI: {paymentSettings.upiId}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Preference */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Default Payment
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-muted/50'
                      }`}
                    >
                      <Banknote className="h-5 w-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-xs font-medium">Cash</p>
                        <p className="text-[10px] text-muted-foreground">Pay after ride</p>
                      </div>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPaymentMethod('WALLET')}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'WALLET' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-transparent bg-muted/50'
                      }`}
                    >
                      <Wallet className="h-5 w-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-xs font-medium">Wallet</p>
                        <p className="text-[10px] text-muted-foreground">₹{walletBalance} balance</p>
                      </div>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-600" />
                    Transaction History
                  </h4>
                  {walletTransactionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : walletTransactions.length > 0 ? (
                    <div className="space-y-0 max-h-64 overflow-y-auto">
                      {walletTransactions.map((txn, i) => {
                        const amount = Number(txn.amount)
                        const isCredit = amount > 0
                        const type = String(txn.type || '').toLowerCase()
                        return (
                          <div key={i} className="flex items-center justify-between py-2.5 border-b border-muted last:border-0">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg ${isCredit ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`}>
                                <TrendingUp className={`h-3 w-3 ${isCredit ? 'text-emerald-600' : 'text-red-600 rotate-180'}`} />
                              </div>
                              <div>
                                <p className="text-xs font-medium">{String(txn.description || (isCredit ? 'Money Added' : 'Payment'))}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {type === 'credit' ? 'Credit' : type === 'debit' ? 'Debit' : 'Transaction'} • {new Date(String(txn.createdAt || Date.now())).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : ''}₹{Math.abs(amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* UPI Payment Dialog — pay first, then money is added */}
              <Dialog open={showUpiPayment} onOpenChange={(open) => { setShowUpiPayment(open); if (!open) setUpiPaid(false) }}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      Complete Payment First
                    </DialogTitle>
                    <DialogDescription>
                      Pay ₹{addMoneyAmount} via UPI first. Money will be added to your wallet after you confirm payment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Amount display */}
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Amount to Pay</p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹{addMoneyAmount}</p>
                    </div>

                    {paymentSettings.paymentQrUrl && (
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <img src={paymentSettings.paymentQrUrl} alt="Payment QR Code" className="max-h-40 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <p className="text-[10px] text-muted-foreground mt-2">Scan QR code to pay</p>
                      </div>
                    )}
                    {paymentSettings.upiId && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Pay to UPI ID</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">{paymentSettings.upiId}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentSettings.upiId)
                              toast.success('UPI ID copied!')
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {paymentSettings.paymentInstructions && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-semibold mb-1">Payment Instructions</p>
                        <p className="text-xs text-muted-foreground">{paymentSettings.paymentInstructions}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Confirm payment checkbox */}
                    <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <input
                        type="checkbox"
                        id="upi-confirm"
                        checked={upiPaid}
                        onChange={(e) => setUpiPaid(e.target.checked)}
                        className="mt-1 accent-emerald-600"
                      />
                      <label htmlFor="upi-confirm" className="text-xs text-amber-800 dark:text-amber-200">
                        I have completed the UPI payment of ₹{addMoneyAmount}. Money will be added to my wallet.
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowUpiPayment(false)
                          setUpiPaid(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={!upiPaid}
                        onClick={handleUpiPaymentDone}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* ===================== PROFILE TAB ===================== */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {/* User Info Card with Edit */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                        {(currentUser?.name || 'T')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{currentUser?.name || 'Traveller'}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          Passenger
                        </Badge>
                        {currentUser?.isVerified && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0" onClick={() => { setEditName(currentUser?.name || ''); setShowProfileEdit(true) }}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{rideHistory.length}</p>
                    <p className="text-[10px] text-muted-foreground">Total Rides</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-orange-600">₹{walletBalance}</p>
                    <p className="text-[10px] text-muted-foreground">Wallet</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-yellow-600">
                      {currentUser?.rating && currentUser.rating > 0 ? currentUser.rating.toFixed(1) : (lang === 'as' ? 'নাই' : 'N/A')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {currentUser?.rating && currentUser.rating > 0 ? t('avgRating') : (lang === 'as' ? 'এতিয়ালৈকে ৰেটিং নাই' : 'No ratings yet')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications Shortcut */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-lg"
                    onClick={() => setShowNotifications(true)}
                  >
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
                      <Bell className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Notifications</p>
                      <p className="text-xs text-muted-foreground">{unreadNotifCount} unread</p>
                    </div>
                    {unreadNotifCount > 0 && (
                      <Badge className="bg-red-500 text-white text-[10px]">{unreadNotifCount}</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Emergency Contacts
                  </h4>
                  <div className="space-y-2">
                    {emergencyContacts.map((contact) => (
                      <a
                        key={contact.number}
                        href={`tel:${contact.number}`}
                        className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{contact.label}</span>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">{contact.number}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* App Settings */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 space-y-0">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    App Settings
                  </h4>
                  <div className="flex items-center justify-between py-3 border-b border-muted">
                    <div className="flex items-center gap-2">
                      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span className="text-sm">{t('darkMode')}</span>
                    </div>
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-muted">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">{t('language')}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={toggleLang} className="text-xs">
                      {lang === 'as' ? 'English' : 'অসমীয়া'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-muted">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Push Notifications</span>
                    </div>
                    <Switch checked={notificationsOn} onCheckedChange={setNotificationsOn} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Location Services</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-600">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* About & Support */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <button onClick={() => setShowAboutDialog(true)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-t-lg border-b border-muted">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 text-left">About GramYatri</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => setShowHelpDialog(true)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-b-lg">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 text-left">Help & Support</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardContent>
              </Card>

              {/* Logout Button */}
              <Button variant="destructive" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>

              {/* App Version */}
              <p className="text-center text-[10px] text-muted-foreground/60">GramYatri v2.0 • Made with ❤️ in Assam</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================== SOS FLOATING BUTTON - ALWAYS VISIBLE ===================== */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.85 }}
        className={`fixed z-50 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center justify-center transition-all ${
          hasActiveRide
            ? 'bottom-24 right-4 w-16 h-16'
            : 'bottom-24 right-4 w-11 h-11'
        }`}
        onClick={handleEmergency}
      >
        <Shield className={hasActiveRide ? 'h-7 w-7' : 'h-5 w-5'} />
        {/* Red pulsing ring */}
        <span className={`absolute rounded-full bg-red-400 animate-ping ${
          hasActiveRide ? 'inset-0' : 'inset-0'
        }`} style={{ opacity: hasActiveRide ? 0.4 : 0.25 }} />
        {/* Second pulse ring for active ride */}
        {hasActiveRide && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse" style={{ opacity: 0.2 }} />
        )}
      </motion.button>
      {/* SOS label when active ride */}
      {hasActiveRide && (
        <span className="fixed bottom-[7.5rem] right-4 z-50 text-[9px] font-bold text-red-600 bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full shadow-sm pointer-events-none">
          SOS
        </span>
      )}

      {/* ===================== BOTTOM NAVIGATION ===================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40 safe-area-bottom">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors relative ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  {tab.key === 'profile' && unreadNotifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">
                      {unreadNotifCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* ===================== BOOKING CONFIRMATION DIALOG ===================== */}
      <Dialog open={showBookingConfirm} onOpenChange={setShowBookingConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>Review your ride details before booking</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="w-0.5 h-6 bg-muted" />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{pickup || 'Pickup'}</p>
                <p className="text-sm text-muted-foreground">{drop || 'Drop'}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle</span>
                <span>{vehicleOptions.find(v => v.key === vehicleType)?.emoji} {vehicleOptions.find(v => v.key === vehicleType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span>{distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span>{paymentMethod === 'CASH' ? '💵 Cash' : '👛 Wallet'}</span>
              </div>
              {offerApplied && (
                <div className="flex justify-between text-orange-600">
                  <span>Offer ({offerCode})</span>
                  <span>-₹{offerDiscount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-emerald-600">₹{discountedFare}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowBookingConfirm(false)}>Cancel</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setShowBookingConfirm(false); handleSearchRide() }}
                disabled={searching}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Confirm & Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== PAYMENT SUMMARY DIALOG ===================== */}
      <Dialog open={showPaymentSummary} onOpenChange={setShowPaymentSummary}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Ride Completed!
            </DialogTitle>
            <DialogDescription>Payment summary for your ride</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Fare Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Fare Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span>₹{completedRide?.baseFare || fare.baseFare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance Fare</span>
                    <span>₹{completedRide?.distanceFare || fare.distanceFare}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Tip</span>
                      <span>₹{tipAmount}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-emerald-600">₹{(completedRide?.fare || Math.round(liveFare)) + tipAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {completedRide?.paymentMethod === 'CASH' ? (
                <>
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Cash Payment</p>
                    <p className="text-xs text-muted-foreground">Please pay the driver ₹{(completedRide?.fare || Math.round(liveFare)) + tipAmount}</p>
                  </div>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Wallet Payment</p>
                    <p className="text-xs text-muted-foreground">₹{(completedRide?.fare || Math.round(liveFare)) + tipAmount} deducted from wallet</p>
                  </div>
                </>
              )}
              <CheckCircle2 className="h-5 w-5 text-emerald-600 ml-auto" />
            </div>

            {/* UPI Payment Option (if enabled and cash payment) */}
            {paymentSettings.upiPaymentEnabled && completedRide?.paymentMethod === 'CASH' && (
              <div className="space-y-3">
                {!showUpiPayment ? (
                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => setShowUpiPayment(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay via UPI
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Pay via UPI</span>
                    </div>
                    {paymentSettings.upiId && (
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                        <span className="text-xs text-muted-foreground">UPI ID:</span>
                        <span className="text-sm font-mono font-medium">{paymentSettings.upiId}</span>
                        <button
                          className="ml-auto p-1 hover:bg-muted rounded"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentSettings.upiId)
                            toast.success('UPI ID copied!')
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    {paymentSettings.paymentQrUrl && (
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-md">
                        <img src={paymentSettings.paymentQrUrl} alt="Payment QR Code" className="max-h-40 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <p className="text-[10px] text-muted-foreground mt-1">Scan QR to pay</p>
                      </div>
                    )}
                    {paymentSettings.paymentInstructions && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">{paymentSettings.paymentInstructions}</p>
                      </div>
                    )}
                    {!upiPaid ? (
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => {
                          setUpiPaid(true)
                          toast.success('Payment confirmation sent!')
                        }}
                      >
                        I&apos;ve Paid ₹{(completedRide?.fare || Math.round(liveFare)) + tipAmount}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-emerald-100 dark:bg-emerald-950 rounded-md">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Payment confirmed!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ride Duration */}
            {rideDuration > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>Ride duration: {formatDuration(rideDuration)}</span>
              </div>
            )}

            {/* Driver Rating */}
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Rate your driver</p>
              {completedRide?.driverName && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {completedRide.driverName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{completedRide.driverName}</span>
                </div>
              )}
              {renderStars(driverRating, true, setDriverRating)}
            </div>

            {/* Tip Option */}
            <div>
              <p className="text-sm font-medium mb-2 text-center">Add a tip for the driver</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 20, 50].map((tip) => (
                  <motion.button
                    key={tip}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTipAmount(tip)}
                    className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      tipAmount === tip
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : 'border-transparent bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {tip === 0 ? 'No tip' : `₹${tip}`}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              onClick={handlePaymentConfirm}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {driverRating > 0 ? `Submit Rating & ${completedRide?.paymentMethod === 'CASH' ? 'Pay Cash' : 'Done'}` : `Confirm ${completedRide?.paymentMethod === 'CASH' ? 'Cash Payment' : 'Payment'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== EMERGENCY DIALOG ===================== */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription>Send an emergency alert or call for help</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick Call Buttons */}
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">{contact.label}</span>
                  </div>
                  <span className="text-sm font-mono text-red-600">{contact.number}</span>
                </a>
              ))}
            </div>

            {/* Custom Message */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Add a message (optional):</p>
              <Input
                placeholder="Describe your emergency..."
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
              />
            </div>

            {/* Send SOS Button */}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSendEmergency}
              disabled={emergencySending}
            >
              {emergencySending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Send SOS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== NOTIFICATIONS DIALOG ===================== */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-emerald-600"
                onClick={() => {
                  setUserNotifications(prev => prev.map(n => ({ ...n, read: true })))
                }}
              >
                Mark All Read
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Notification Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'ride', 'offer', 'system'] as const).map((filter) => (
                <motion.button
                  key={filter}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all capitalize ${
                    notifFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {filter}
                </motion.button>
              ))}
            </div>

            {/* Notification List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setUserNotifications(prev =>
                      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                    )
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    notif.read
                      ? 'bg-muted/30 border-transparent'
                      : 'bg-card border-emerald-200 dark:border-emerald-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded mt-0.5 ${
                      notif.type === 'ride' ? 'bg-emerald-50 dark:bg-emerald-950' :
                      notif.type === 'offer' ? 'bg-orange-50 dark:bg-orange-950' :
                      'bg-blue-50 dark:bg-blue-950'
                    }`}>
                      {notif.type === 'ride' ? <Navigation className="h-3 w-3 text-emerald-600" /> :
                       notif.type === 'offer' ? <Zap className="h-3 w-3 text-orange-600" /> :
                       <Info className="h-3 w-3 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-medium ${notif.read ? '' : 'font-bold'}`}>{notif.title}</p>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredNotifications.length === 0 && (
              <div className="text-center py-6">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== PROFILE EDIT DIALOG ===================== */}
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                  {(editName || 'T')[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <Input value={currentUser?.phone || ''} disabled className="bg-muted" />
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== ABOUT GRAMYATRI DIALOG ===================== */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-sm flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Truck className="h-5 w-5" />
              About GramYatri
            </DialogTitle>
            <DialogDescription>Village-friendly ride-hailing for Assam</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            {/* App Identity */}
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-emerald-600">🛺 GramYatri</p>
              <p className="text-xs text-muted-foreground mt-1">Version 2.0</p>
              <p className="text-xs text-emerald-600 font-medium mt-2 italic">
                &ldquo;Connecting villages with affordable, safe, and reliable transport&rdquo;
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              GramYatri is designed specifically for rural Assam — tempos, autos, and e-rickshaws for everyday travel. Whether you&#39;re heading to the market, the railway station, or the next village, GramYatri makes your journey simple, affordable, and safe.
            </p>

            {/* Key Features */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Key Features</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: IndianRupee, label: 'Affordable village fares', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
                  { icon: Users, label: 'Shared tempo rides', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
                  { icon: Navigation, label: 'Real-time GPS tracking', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
                  { icon: Shield, label: 'SOS emergency button', color: 'text-red-600 bg-red-50 dark:bg-red-950' },
                  { icon: CreditCard, label: 'Wallet payments & UPI', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
                  { icon: Radio, label: 'Offline booking support', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950' },
                  { icon: Truck, label: 'Tempo, Auto, E-Rickshaw', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2 p-2 rounded-lg bg-card border">
                    <div className={`p-1.5 rounded-md ${feature.color}`}>
                      <feature.icon className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Our Story */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Our Story</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Born in Assam, built for Bharat. GramYatri was created to solve the daily transport problem faced by villagers in rural India. No more waiting on highways — book a tempo, auto, or e-rickshaw right from your village.
              </p>
            </div>

            {/* Safety */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Your Safety Matters</p>
              </div>
              <ul className="space-y-1">
                <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  All drivers are verified with valid documents
                </li>
                <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  SOS button for instant emergency help
                </li>
                <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  Live tracking shared with your family
                </li>
              </ul>
            </div>

            <Separator />

            {/* Contact & Footer */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                support@gramyatri.com
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" />
                gram-yatri.vercel.app
              </p>
            </div>
            <p className="text-center text-xs text-muted-foreground pt-1">Made with ❤️ in Assam</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== HELP & SUPPORT DIALOG ===================== */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-sm flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Help & Support
            </DialogTitle>
            <DialogDescription>Frequently asked questions, emergency contacts & more</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            {/* FAQ Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Frequently Asked Questions</p>
              {[
                {
                  q: 'How to book a ride?',
                  a: 'Enter your pickup and drop location, select vehicle type, and tap Search Ride. A nearby driver will be assigned to you.',
                },
                {
                  q: 'How to add money to wallet?',
                  a: 'Go to Wallet tab, enter the amount, and tap Add. You can pay via UPI to top up your wallet instantly.',
                },
                {
                  q: 'How to use shared tempo?',
                  a: 'Tap Shared Tempo on the home screen, select your route, and book a seat. Share the ride with other passengers heading the same way.',
                },
                {
                  q: 'How to become a driver?',
                  a: 'Register as a Driver, submit your vehicle and license details, and wait for admin approval. Once approved, you can start accepting rides.',
                },
                {
                  q: 'Is my ride safe?',
                  a: 'All drivers are verified with valid documents. Use the SOS button during a ride for emergency help. Your live tracking can be shared with family.',
                },
                {
                  q: 'How to cancel a ride?',
                  a: 'Tap cancel on your active ride. If you paid via wallet, the fare will be refunded to your wallet automatically.',
                },
                {
                  q: 'What payment methods are accepted?',
                  a: 'You can pay with Cash or Wallet. To top up your wallet, use UPI payment from the Wallet tab.',
                },
              ].map((faq) => (
                <div key={faq.q} className="space-y-1 p-2.5 rounded-lg bg-card border">
                  <p className="text-sm font-medium flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {faq.q}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5">{faq.a}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Emergency Contacts */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                Emergency Contacts
              </p>
              {[
                { label: 'Emergency', number: '112' },
                { label: 'Women Helpline', number: '1091' },
                { label: 'Police', number: '100' },
                { label: 'Ambulance', number: '108' },
              ].map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">{contact.label}</span>
                  </div>
                  <span className="text-sm font-mono text-red-600">{contact.number}</span>
                </a>
              ))}
            </div>

            <Separator />

            {/* Contact Support */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Contact Support</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                support@gramyatri.com
              </p>
              <a href="tel:+911800000000" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
              </a>
              <Button
                variant="outline"
                className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                size="sm"
                onClick={() => {
                  setShowHelpDialog(false)
                  toast.info('Report form coming soon! Email us at support@gramyatri.com')
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Report a Problem
              </Button>
            </div>

            {/* App Version */}
            <div className="text-center pt-1">
              <p className="text-[10px] text-muted-foreground">GramYatri v2.0 • gram-yatri.vercel.app</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
