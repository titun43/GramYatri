'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Power,
  PowerOff,
  Home,
  Route,
  IndianRupee,
  User,
  MapPin,
  Star,
  Phone,
  Navigation,
  Clock,
  TrendingUp,
  Wallet,
  LogOut,
  Upload,
  ChevronRight,
  CheckCircle,
  CircleDot,
  Loader2,
  AlertCircle,
  Bell,
  FileText,
  Car,
  Shield,
  XCircle,
  ArrowRight,
  RefreshCw,
  Banknote,
  X,
  CreditCard,
  Eye,
  Camera,
  ChevronDown,
  Menu,
  Timer,
  ExternalLink,
  Compass,
  Volume2,
  VolumeX,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  Navigation2,
  Milestone,
  ArrowDown,
  Globe,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Ride } from '@/lib/store'
import { useSocket } from '@/lib/socket'
import { toast } from 'sonner'
import {
  getRides,
  updateRide,
  getDriverEarnings,
  createWithdrawRequest,
  registerDriver,
  updateDriver,
  createRating,
  getWallet,
  getDriverNotifications,
  uploadDriverDocuments,
  getDriverDocuments,
  getPaymentSettings,
} from '@/lib/api'
import type { PaymentSettings } from '@/lib/api'
import RideCard from './RideCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

// ─── Helper: Map API ride data to Ride type ──────────────────────────────────

function mapApiRide(raw: Record<string, unknown>): Ride {
  return {
    id: (raw.id as string) || '',
    userId: (raw.userId as string) || '',
    driverId: (raw.driverId as string) || undefined,
    pickup: (raw.pickup as string) || (raw.pickupAddress as string) || '',
    drop: (raw.drop as string) || (raw.dropAddress as string) || '',
    pickupLat: (raw.pickupLat as number) || undefined,
    pickupLng: (raw.pickupLng as number) || undefined,
    dropLat: (raw.dropLat as number) || undefined,
    dropLng: (raw.dropLng as number) || undefined,
    vehicleType: (raw.vehicleType as Ride['vehicleType']) || 'TEMPO',
    fare: (raw.fare as number) || 0,
    baseFare: (raw.baseFare as number) || 0,
    distanceFare: (raw.distanceFare as number) || 0,
    distance: (raw.distance as number) || 0,
    status: (raw.status as Ride['status']) || 'SEARCHING',
    paymentMethod: (raw.paymentMethod as Ride['paymentMethod']) || 'CASH',
    offerCode: (raw.offerCode as string) || undefined,
    createdAt: (raw.createdAt as string) || '',
    completedAt: (raw.completedAt as string) || undefined,
    driverName: (raw.driverName as string) || undefined,
    driverPhone: (raw.driverPhone as string) || undefined,
    driverVehicle: (raw.driverVehicle as string) || undefined,
    userName: (raw.userName as string) || undefined,
    userPhone: (raw.userPhone as string) || undefined,
    rating: (raw.rating as number) || undefined,
  }
}

// ─── Helper: Format breakdown date for chart ─────────────────────────────────

function formatBreakdownDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en', { weekday: 'short' })
  } catch {
    return dateStr.slice(0, 3)
  }
}

// ─── Helper: Format duration ─────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 1) return `${seconds}s`
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m`
}

// ─── Circular Countdown Timer (Enhanced) ─────────────────────────────────────

function CircularCountdown({ seconds, total = 30 }: { seconds: number; total?: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const progress = seconds / total
  const strokeDashoffset = circumference * (1 - progress)
  const isUrgent = seconds <= 10

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={isUrgent ? '#ef4444' : '#f97316'}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className={`absolute text-xs font-bold ${isUrgent ? 'text-red-500' : 'text-orange-600'}`}>
        {seconds}
      </span>
    </div>
  )
}

// ─── Small Map Preview ───────────────────────────────────────────────────────

function SmallMapPreview({ lat, lng, status }: { lat: number; lng: number; status: 'connected' | 'searching' | 'error' }) {
  // Generate a deterministic but "random-looking" grid based on lat/lng
  const seed = Math.floor((lat * 1000 + lng * 1000) % 100)
  const roads = [
    { x1: 10, y1: 20 + (seed % 15), x2: 90, y2: 20 + (seed % 15) },
    { x1: 15 + (seed % 10), y1: 10, x2: 15 + (seed % 10), y2: 90 },
    { x1: 30, y1: 40 + (seed % 10), x2: 70, y2: 40 + (seed % 10) },
    { x1: 50 + (seed % 10), y1: 15, x2: 50 + (seed % 10), y2: 85 },
    { x1: 20, y1: 60 + (seed % 8), x2: 80, y2: 60 + (seed % 8) },
  ]

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full rounded-lg bg-emerald-50 dark:bg-gray-800">
      {/* Roads */}
      {roads.map((road, i) => (
        <line key={i} x1={road.x1} y1={road.y1} x2={road.x2} y2={road.y2}
          stroke="#d1d5db" strokeWidth="2" className="dark:stroke-gray-600" />
      ))}
      {/* Driver position dot */}
      <circle cx="50" cy="50" r="4" fill={status === 'connected' ? '#f97316' : status === 'searching' ? '#fbbf24' : '#ef4444'} />
      {status === 'connected' && (
        <circle cx="50" cy="50" r="8" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.4">
          <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <text x="50" y="96" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" fontSize="5">
        {lat.toFixed(3)}, {lng.toFixed(3)}
      </text>
    </svg>
  )
}

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type DriverTab = 'home' | 'rides' | 'earnings' | 'notifications' | 'profile'
type GpsStatus = 'connected' | 'searching' | 'error'

// ─── Document Status Badge ────────────────────────────────────────────────────

function DocStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    APPROVED: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  }
  const c = config[status] || config.PENDING
  return <Badge className={c.className}>{c.label}</Badge>
}

// ─── i18n Infrastructure ───────────────────────────────────────────────────

type Lang = 'en' | 'as'
const T: Record<string, Record<Lang, string>> = {
  'home': { en: 'Home', as: 'গৃহ' },
  'rides': { en: 'Rides', as: 'ৰাইড' },
  'earnings': { en: 'Earnings', as: 'উপাৰ্জন' },
  'notifications': { en: 'Notifications', as: 'জাননী' },
  'profile': { en: 'Profile', as: 'প্ৰফাইল' },
  'goOnline': { en: 'Go Online', as: 'অনলাইন যাওক' },
  'goOffline': { en: 'Go Offline', as: 'অফলাইন যাওক' },
  'accept': { en: 'Accept', as: 'গ্ৰহণ কৰক' },
  'reject': { en: 'Reject', as: 'প্ৰত্যাখ্যান কৰক' },
  'searchingForRides': { en: 'Searching for rides...', as: 'ৰাইড সন্ধান কৰি আছে...' },
  'rideInProgress': { en: 'Ride in Progress', as: 'ৰাইড চলি আছে' },
  'rideCompleted': { en: 'Ride Completed', as: 'ৰাইড সম্পূৰ্ণ হ\'ল' },
  'rideCancelled': { en: 'Ride Cancelled', as: 'ৰাইড বাতিল হ\'ল' },
  'vehicleInfo': { en: 'Vehicle Information', as: 'বাহনৰ তথ্য' },
  'vehicleType': { en: 'Vehicle Type', as: 'বাহনৰ প্ৰকাৰ' },
  'vehicleNumber': { en: 'Vehicle Number', as: 'বাহন নম্বৰ' },
  'totalRides': { en: 'Total Rides', as: 'মুঠ ৰাইড' },
  'totalEarnings': { en: 'Total Earnings', as: 'মুঠ উপাৰ্জন' },
  'avgRating': { en: 'Avg Rating', as: 'গড় ৰেটিং' },
  'noRatings': { en: 'No ratings yet', as: 'এতিয়ালৈকে ৰেটিং নাই' },
  'verifiedDriver': { en: 'Verified Driver', as: 'যাচাইকৃত চালক' },
  'walletBalance': { en: 'Wallet Balance', as: 'ৱালেট বেলেন্স' },
  'withdraw': { en: 'Withdraw', as: 'উলিয়াওক' },
  'todayEarnings': { en: "Today's Earnings", as: 'আজিৰ উপাৰ্জন' },
  'weeklyEarnings': { en: 'Weekly Earnings', as: 'সাপ্তাহিক উপাৰ্জন' },
  'monthlyEarnings': { en: 'Monthly Earnings', as: 'মাহিলী উপাৰ্জন' },
  'rideHistory': { en: 'Ride History', as: 'ৰাইড ইতিহাস' },
  'noRides': { en: 'No rides yet', as: 'এতিয়ালৈকে কোনো ৰাইড নাই' },
  'callPassenger': { en: 'Call Passenger', as: 'যাত্ৰীক কল কৰক' },
  'navigateToPickup': { en: 'Navigate to Pickup', as: 'পিকআপলৈ যাওক' },
  'startRide': { en: 'Start Ride', as: 'ৰাইড আৰম্ভ কৰক' },
  'completeRide': { en: 'Complete Ride', as: 'ৰাইড সম্পূৰ্ণ কৰক' },
  'cancelRide': { en: 'Cancel Ride', as: 'ৰাইড বাতিল কৰক' },
  'fare': { en: 'Fare', as: 'ভাড়া' },
  'distance': { en: 'Distance', as: 'দূৰত্ব' },
  'pickup': { en: 'Pickup', as: 'পিকআপ' },
  'drop': { en: 'Drop', as: 'ড্ৰপ' },
  'cash': { en: 'Cash', as: 'নগদ' },
  'wallet': { en: 'Wallet', as: 'ৱালেট' },
  'language': { en: 'অসমীয়া / English', as: 'English / অসমীয়া' },
  'darkMode': { en: 'Dark Mode', as: 'ডাৰ্ক মোড' },
  'logout': { en: 'Logout', as: 'লগআউট' },
  'settings': { en: 'Settings', as: 'ছেটিংছ' },
  'documents': { en: 'Documents', as: 'দস্তাবেজ' },
  'emergency': { en: 'Emergency SOS', as: 'জৰুৰীকালীন SOS' },
  'newRideRequest': { en: 'New Ride Request', as: 'নতুন ৰাইড অনুৰোধ' },
  'passenger': { en: 'Passenger', as: 'যাত্ৰী' },
  'waitingForPassenger': { en: 'Waiting for passenger', as: 'যাত্ৰীৰ বাবে অপেক্ষা' },
  'noNotifications': { en: 'No notifications', as: 'কোনো জাননী নাই' },
  'uploadDocuments': { en: 'Upload Documents', as: 'দস্তাবেজ আপলোড কৰক' },
  'pendingVerification': { en: 'Pending Verification', as: 'যাচাই বাকী' },
  'gpsConnected': { en: 'GPS Connected', as: 'GPS সংযুক্ত' },
  'gpsSearching': { en: 'GPS Searching...', as: 'GPS সন্ধান কৰি...' },
  'gpsError': { en: 'GPS Error', as: 'GPS ত্ৰুটি' },
  'locationPermission': { en: 'Location Permission', as: 'অৱস্থান অনুমতি' },
  'enableLocation': { en: 'Enable Location', as: 'অৱস্থান সক্ষম কৰক' },
  'registerAsDriver': { en: 'Register as Driver', as: 'চালক হিচাপে পঞ্জীকৰণ কৰক' },
  'completeRegistration': { en: 'Complete Registration', as: 'পঞ্জীকৰণ সম্পূৰ্ণ কৰক' },
  'next': { en: 'Next', as: 'পৰৱৰ্তী' },
  'submit': { en: 'Submit', as: 'জমা দিয়ক' },
  'back': { en: 'Back', as: 'উভতি' },
  'licenseNumber': { en: 'License Number', as: 'লাইচেন্স নম্বৰ' },
  'aadhaarNumber': { en: 'Aadhaar Number', as: 'আধাৰ নম্বৰ' },
  'rcNumber': { en: 'RC Number', as: 'RC নম্বৰ' },
  'online': { en: 'Online', as: 'অনলাইন' },
  'offline': { en: 'Offline', as: 'অফলাইন' },
  'today': { en: 'Today', as: 'আজি' },
  'week': { en: 'Week', as: 'সপ্তাহ' },
  'month': { en: 'Month', as: 'মাহ' },
  'amount': { en: 'Amount', as: 'পৰিমাণ' },
  'upiId': { en: 'UPI ID', as: 'UPI ID' },
  'bankAccount': { en: 'Bank Account', as: 'বেংক একাউণ্ট' },
  'bankName': { en: 'Bank Name', as: 'বেংকৰ নাম' },
  'ifscCode': { en: 'IFSC Code', as: 'IFSC কোড' },
  'withdrawMethod': { en: 'Withdraw Method', as: 'উলিওৱাৰ পদ্ধতি' },
  'upi': { en: 'UPI', as: 'UPI' },
  'bankTransfer': { en: 'Bank Transfer', as: 'বেংক স্থানান্তৰ' },
  'requestWithdraw': { en: 'Request Withdraw', as: 'উলিওৱাৰ অনুৰোধ কৰক' },
  'commission': { en: 'Commission', as: 'কমিছন' },
  'yourEarnings': { en: 'Your Earnings', as: 'আপোনাৰ উপাৰ্জন' },
  'rideDetails': { en: 'Ride Details', as: 'ৰাইডৰ বিৱৰণ' },
  'paymentMethod': { en: 'Payment Method', as: 'পেমেণ্ট পদ্ধতি' },
  'rideFare': { en: 'Ride Fare', as: 'ৰাইড ভাড়া' },
  'speed': { en: 'Speed', as: 'গতি' },
  'duration': { en: 'Duration', as: 'সময়কাল' },
  'allRides': { en: 'All Rides', as: 'সকলো ৰাইড' },
  'completed': { en: 'Completed', as: 'সম্পূৰ্ণ' },
  'cancelled': { en: 'Cancelled', as: 'বাতিল' },
  'addNote': { en: 'Add Note', as: 'টিপ্পনী যোগ কৰক' },
  'soundAlerts': { en: 'Sound Alerts', as: 'শব্দ সতৰ্কবাৰ্তা' },
  'about': { en: 'About', as: 'বিষয়ে' },
  'help': { en: 'Help & Support', as: 'সাহায্য আৰু সমৰ্থন' },
  'editProfile': { en: 'Edit Profile', as: 'প্ৰফাইল সম্পাদনা' },
  'memberSince': { en: 'Member since', as: 'সদস্যৰ পৰা' },
  'rideRequest': { en: 'Ride Request', as: 'ৰাইড অনুৰোধ' },
  'arriving': { en: 'Arriving', as: 'আহি আছে' },
  'onTheWay': { en: 'On the way', as: 'পথত' },
  'completedRides': { en: 'Completed Rides', as: 'সম্পূৰ্ণ ৰাইড' },
  'cancelReason': { en: 'Cancel Reason', as: 'বাতিলৰ কাৰণ' },
  'confirm': { en: 'Confirm', as: 'নিশ্চিত কৰক' },
  'cancel': { en: 'Cancel', as: 'বাতিল কৰক' },
  'save': { en: 'Save', as: 'সংৰক্ষণ কৰক' },
  'close': { en: 'Close', as: 'বন্ধ কৰক' },
}

// ─── DriverPanel Component ────────────────────────────────────────────────────

export default function DriverPanel() {
  const { isOnline, setOnline, activeRide, setActiveRide, incomingRides, setIncomingRides, removeIncomingRide, currentUser, logout, updateWalletBalance, updateCurrentUser } = useAppStore()
  const { emitDriverStatus, emitDriverLocation, emitRideAccept, emitRideReject, emitRideComplete, emitRideCancel } = useSocket()

  const [activeTab, setActiveTab] = useState<DriverTab>('home')

  // ─── i18n state & helpers ─────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('gramyatri-lang') as Lang) || 'as'
    }
    return 'as'
  })
  const t = (key: string): string => T[key]?.[lang] || T[key]?.en || key
  const toggleLang = () => {
    const next = lang === 'en' ? 'as' : 'en'
    setLang(next)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gramyatri-lang', next)
    }
  }

  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [ifscCode, setIfscCode] = useState('')

  // Registration form state
  const [showRegistration, setShowRegistration] = useState(false)
  const [regStep, setRegStep] = useState(1) // 1: Basic, 2: Aadhaar, 3: License, 4: RC
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [rcNumber, setRcNumber] = useState('')
  const [aadhaarPhotoPreview, setAadhaarPhotoPreview] = useState<string | null>(null)
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string | null>(null)
  const [rcPhotoPreview, setRcPhotoPreview] = useState<string | null>(null)
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null)

  // Document upload dialog
  const [docUploadOpen, setDocUploadOpen] = useState(false)
  const [docUploadType, setDocUploadType] = useState<string>('')
  const [documents, setDocuments] = useState<Record<string, unknown> | null>(null)

  // Navigation mode overlay
  const [navOpen, setNavOpen] = useState(false)

  // Ride request countdown timers (rideId -> remaining seconds)
  const [requestTimers, setRequestTimers] = useState<Record<string, number>>({})
  const requestTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // API-driven state
  const [rideHistory, setRideHistory] = useState<Ride[]>([])
  const [earningsData, setEarningsData] = useState<{ total: number; rides: number; breakdown: Array<{ date: string; amount: number }> }>({ total: 0, rides: 0, breakdown: [] })
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingEarnings, setLoadingEarnings] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const locationUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchPositionRef = useRef<number | null>(null)

  // Location state (enhanced)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('searching')

  // Enhanced: Location permission prompt
  const [locationPermissionOpen, setLocationPermissionOpen] = useState(false)
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false)

  // Enhanced: Sound notification
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Enhanced: Ride start confirmation dialog
  const [showStartConfirm, setShowStartConfirm] = useState(false)

  // Enhanced: Ride completion summary
  const [showRideSummary, setShowRideSummary] = useState(false)
  const [rideSummaryData, setRideSummaryData] = useState<{
    fare: number; paymentMethod: string; distance: number; duration: string; commission: number; takeHome: number
  } | null>(null)

  // Enhanced: Ride start time for duration calculation
  const rideStartTimeRef = useRef<number | null>(null)

  // Enhanced: Navigation speed simulation
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const speedSimRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // UPI Payment settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ upiId: '', paymentQrUrl: '', paymentInstructions: '', upiPaymentEnabled: false })
  const [showUpiPayment, setShowUpiPayment] = useState(false)
  const [upiPaid, setUpiPaid] = useState(false)

  // Keep currentLocationRef in sync with currentLocation
  useEffect(() => {
    currentLocationRef.current = currentLocation
  }, [currentLocation])

  // Driver info from store
  const driverId = currentUser?.id || ''
  const driverName = currentUser?.name || ''
  const driverPhone = currentUser?.phone || ''
  const isRegistered = currentUser?.isRegistered ?? false
  const isApproved = currentUser?.isApproved ?? false
  const isSuspended = currentUser?.isBlocked ?? false
  const unreadNotifCount = notifications.filter(n => !n.isRead).length

  // ─── Fetch Pending Rides ──────────────────────────────────────────────────

  const fetchPendingRides = useCallback(async () => {
    if (!isOnline || !driverId) return
    try {
      const res = await getRides({ status: 'PENDING' })
      if (res.success && Array.isArray(res.rides)) {
        const mapped = res.rides.map(mapApiRide)
        setIncomingRides(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch pending rides:', err)
    }
  }, [isOnline, driverId, setIncomingRides])

  // ─── Fetch Ride History ──────────────────────────────────────────────────

  const fetchRideHistory = useCallback(async () => {
    if (!driverId) return
    setLoadingHistory(true)
    try {
      const res = await getRides({ driverId, status: 'COMPLETED' })
      if (res.success && Array.isArray(res.rides)) {
        setRideHistory(res.rides.map(mapApiRide))
      } else {
        setRideHistory([])
      }
    } catch (err) {
      console.error('Failed to fetch ride history:', err)
      setRideHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [driverId])

  // ─── Fetch Earnings ──────────────────────────────────────────────────────

  const fetchEarnings = useCallback(async (period: 'today' | 'week' | 'month') => {
    if (!driverId) return
    setLoadingEarnings(true)
    try {
      const res = await getDriverEarnings(driverId, period)
      if (res.success && res.earnings) {
        const e = res.earnings as Record<string, unknown>
        setEarningsData({
          total: (e.total as number) || 0,
          rides: (e.rides as number) || 0,
          breakdown: Array.isArray(e.breakdown)
            ? (e.breakdown as Array<Record<string, unknown>>).map((b) => ({
                date: (b.date as string) || '',
                amount: (b.amount as number) || 0,
              }))
            : [],
        })
      } else {
        setEarningsData({ total: 0, rides: 0, breakdown: [] })
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
      setEarningsData({ total: 0, rides: 0, breakdown: [] })
    } finally {
      setLoadingEarnings(false)
    }
  }, [driverId])

  // ─── Fetch Notifications ──────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!driverId) return
    setLoadingNotifications(true)
    try {
      const res = await getDriverNotifications(driverId)
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications.map((n: Record<string, unknown>) => ({
          id: (n.id as string) || '',
          title: (n.title as string) || '',
          message: (n.message as string) || '',
          type: (n.type as string) || 'INFO',
          isRead: (n.isRead as boolean) || false,
          createdAt: (n.createdAt as string) || '',
        })))
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoadingNotifications(false)
    }
  }, [driverId])

  // ─── Fetch Documents ──────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    if (!driverId) return
    try {
      const res = await getDriverDocuments(driverId)
      if (res.success && res.documents) {
        setDocuments(res.documents)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }, [driverId])

  // ─── Effects ─────────────────────────────────────────────────────────────

  // Poll for pending rides when online
  useEffect(() => {
    if (isOnline && driverId) {
      fetchPendingRides()
      pollingRef.current = setInterval(fetchPendingRides, 10000)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isOnline, driverId, fetchPendingRides])

  // Load ride history when rides tab is active
  useEffect(() => {
    if (activeTab === 'rides' && driverId) {
      fetchRideHistory()
    }
  }, [activeTab, driverId, fetchRideHistory])

  // Load earnings when earnings tab is active
  useEffect(() => {
    if (activeTab === 'earnings' && driverId) {
      fetchEarnings(earningsPeriod)
    }
  }, [activeTab, earningsPeriod, driverId, fetchEarnings])

  // Load notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && driverId) {
      fetchNotifications()
    }
  }, [activeTab, driverId, fetchNotifications])

  // Load documents and wallet on mount
  useEffect(() => {
    if (!driverId) return
    fetchDocuments()
    const fetchWallet = async () => {
      try {
        const res = await getWallet(driverId)
        if (res.success && res.wallet) {
          updateWalletBalance(res.wallet.balance)
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err)
      }
    }
    fetchWallet()
  }, [driverId, updateWalletBalance, fetchDocuments])

  // Load payment settings on mount
  useEffect(() => {
    getPaymentSettings().then(setPaymentSettings)
  }, [])

  // ─── Ride Request Countdown Timer ───────────────────────────────────────

  // Start countdown for new incoming rides
  useEffect(() => {
    const currentIds = new Set(incomingRides.map(r => r.id))

    // Start timers for new rides
    for (const ride of incomingRides) {
      if (requestTimersRef.current[ride.id] === undefined && !(ride.id in requestTimers)) {
        // Initialize timer for this ride
        setRequestTimers(prev => ({ ...prev, [ride.id]: 30 }))
        requestTimersRef.current[ride.id] = setInterval(() => {
          setRequestTimers(prev => {
            const current = prev[ride.id] ?? 0
            if (current <= 1) {
              // Time's up - auto-reject
              if (requestTimersRef.current[ride.id]) {
                clearInterval(requestTimersRef.current[ride.id])
                delete requestTimersRef.current[ride.id]
              }
              // Auto-reject ride
              emitRideReject({ rideId: ride.id, driverId })
              removeIncomingRide(ride.id)
              toast.info(`Ride request expired - auto-rejected`)
              const updated = { ...prev }
              delete updated[ride.id]
              return updated
            }
            return { ...prev, [ride.id]: current - 1 }
          })
        }, 1000)
      }
    }

    // Clean up timers for rides that are no longer in incomingRides
    for (const rideId of Object.keys(requestTimersRef.current)) {
      if (!currentIds.has(rideId)) {
        clearInterval(requestTimersRef.current[rideId])
        delete requestTimersRef.current[rideId]
        setRequestTimers(prev => {
          const updated = { ...prev }
          delete updated[rideId]
          return updated
        })
      }
    }
  }, [incomingRides, driverId, emitRideReject, removeIncomingRide, requestTimers])

  // Cleanup all timer intervals on unmount
  useEffect(() => {
    return () => {
      for (const interval of Object.values(requestTimersRef.current)) {
        clearInterval(interval)
      }
      requestTimersRef.current = {}
    }
  }, [])

  // ─── Driver Location Tracking (Enhanced) ────────────────────────────────

  useEffect(() => {
    if (isOnline && driverId) {
      if ('geolocation' in navigator) {
        setGpsStatus('searching')
        watchPositionRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            const accuracy = position.coords.accuracy
            setCurrentLocation({ lat, lng })
            setGpsAccuracy(accuracy)
            setLocationError(null)
            setGpsStatus(accuracy < 50 ? 'connected' : 'searching')
            emitDriverLocation({ driverId, lat, lng })
          },
          (err) => {
            console.error('Geolocation error:', err)
            setGpsStatus('error')
            if (err.code === err.PERMISSION_DENIED) {
              setLocationError('Location permission denied. Please enable location access.')
              toast.error('Location access denied.')
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              setLocationError('Location unavailable. Please check your GPS.')
            } else if (err.code === err.TIMEOUT) {
              setLocationError('Location request timed out. Retrying...')
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        )
      } else {
        setLocationError('Geolocation is not supported by this browser.')
        setGpsStatus('error')
      }

      locationUpdateRef.current = setInterval(async () => {
        const loc = currentLocationRef.current
        if (loc) {
          try {
            await updateDriver(driverId, { currentLat: loc.lat, currentLng: loc.lng })
          } catch (err) {
            console.error('Failed to update driver location in DB:', err)
          }
        }
      }, 30000)
    } else {
      if (watchPositionRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionRef.current)
        watchPositionRef.current = null
      }
      if (locationUpdateRef.current) {
        clearInterval(locationUpdateRef.current)
        locationUpdateRef.current = null
      }
      setCurrentLocation(null)
      setLocationError(null)
      setGpsAccuracy(null)
      setGpsStatus('searching')
    }

    return () => {
      if (watchPositionRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionRef.current)
        watchPositionRef.current = null
      }
      if (locationUpdateRef.current) {
        clearInterval(locationUpdateRef.current)
        locationUpdateRef.current = null
      }
    }
  }, [isOnline, driverId, emitDriverLocation])

  const lastPersistedRef = useRef<number>(0)
  useEffect(() => {
    if (isOnline && driverId && currentLocation) {
      const now = Date.now()
      if (now - lastPersistedRef.current > 10000) {
        lastPersistedRef.current = now
        updateDriver(driverId, { currentLat: currentLocation.lat, currentLng: currentLocation.lng }).catch(() => {})
      }
    }
  }, [isOnline, driverId, currentLocation])

  // ─── Navigation Speed Simulation ─────────────────────────────────────────

  useEffect(() => {
    if (navOpen && activeRide?.status === 'IN_PROGRESS') {
      speedSimRef.current = setInterval(() => {
        setCurrentSpeed(Math.floor(Math.random() * 15) + 20) // 20-35 km/h
      }, 3000)
    } else {
      if (speedSimRef.current) {
        clearInterval(speedSimRef.current)
        speedSimRef.current = null
      }
      setCurrentSpeed(0)
    }
    return () => {
      if (speedSimRef.current) {
        clearInterval(speedSimRef.current)
        speedSimRef.current = null
      }
    }
  }, [navOpen, activeRide?.status])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleOnline = async (checked: boolean) => {
    // Enhanced: Show location permission prompt first time going online
    if (checked && !locationPermissionRequested) {
      setLocationPermissionOpen(true)
      return
    }
    await performToggleOnline(checked)
  }

  const performToggleOnline = async (checked: boolean) => {
    setOnline(checked)
    if (!driverId) return
    emitDriverStatus({ driverId, isOnline: checked })
    try {
      await updateDriver(driverId, { isOnline: checked })
    } catch (err) {
      console.error('Failed to update online status:', err)
      setOnline(!checked)
      emitDriverStatus({ driverId, isOnline: !checked })
      setError('Failed to update online status. Please try again.')
      setTimeout(() => setError(null), 3000)
    }
    if (!checked) {
      setIncomingRides([])
    }
  }

  const handleLocationPermissionGrant = () => {
    setLocationPermissionRequested(true)
    setLocationPermissionOpen(false)
    performToggleOnline(true)
  }

  const handleLocationPermissionDeny = () => {
    setLocationPermissionOpen(false)
    toast.info('Location access is needed to receive ride requests.')
  }

  const handleRideAction = async (action: string, rideId?: string) => {
    if (action === 'call') {
      const ride = activeRide
      if (ride?.userPhone || ride?.driverPhone) {
        window.open(`tel:${ride.userPhone || ride.driverPhone}`)
      }
    } else if (action === 'navigate') {
      if (activeRide) {
        setNavOpen(true)
      }
    } else if (action === 'emergency') {
      toast.error('🚨 Emergency alert sent! Help is on the way.')
    } else if (action === 'accept' && rideId) {
      setActionLoading(`accept-${rideId}`)
      try {
        const res = await updateRide(rideId, { status: 'ACCEPTED', driverId })
        if (res.success && res.ride) {
          const ride = mapApiRide(res.ride as Record<string, unknown>)
          setActiveRide(ride)
          removeIncomingRide(rideId)
          emitRideAccept({ rideId, driverId, userId: ride.userId })
          toast.success('Ride accepted! Navigate to pickup.')
        }
      } catch (err) {
        console.error('Failed to accept ride:', err)
        setError('Failed to accept ride. Please try again.')
        setTimeout(() => setError(null), 3000)
      } finally {
        setActionLoading(null)
      }
    } else if (action === 'reject' && rideId) {
      emitRideReject({ rideId, driverId })
      removeIncomingRide(rideId)
      toast.info('Ride rejected.')
    }
  }

  // Enhanced: Show start confirmation dialog
  const handleStartRideClick = () => {
    setShowStartConfirm(true)
  }

  const handleStartRide = async () => {
    if (!activeRide) return
    setShowStartConfirm(false)
    setActionLoading('start')
    try {
      const res = await updateRide(activeRide.id, { status: 'IN_PROGRESS' })
      if (res.success && res.ride) {
        const ride = mapApiRide(res.ride as Record<string, unknown>)
        setActiveRide(ride)
        rideStartTimeRef.current = Date.now()
        toast.success('Ride started! Navigate to the drop-off location.')
      }
    } catch (err) {
      console.error('Failed to start ride:', err)
      setError('Failed to start ride. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  // Enhanced: Show ride summary on completion
  const handleCompleteRide = async () => {
    if (!activeRide) return
    setActionLoading('complete')
    try {
      const res = await updateRide(activeRide.id, { status: 'COMPLETED' })
      if (res.success) {
        // Calculate ride duration
        const durationMs = rideStartTimeRef.current ? Date.now() - rideStartTimeRef.current : 0
        const durationStr = durationMs > 0 ? formatDuration(durationMs) : 'N/A'

        // Calculate commission (15% default)
        const fare = activeRide.fare
        const commission = Math.round(fare * 0.15 * 100) / 100
        const takeHome = Math.round((fare - commission) * 100) / 100

        // Show summary
        setRideSummaryData({
          fare,
          paymentMethod: activeRide.paymentMethod,
          distance: activeRide.distance,
          duration: durationStr,
          commission,
          takeHome,
        })
        setShowRideSummary(true)

        emitRideComplete({ rideId: activeRide.id, userId: activeRide.userId, driverId, fare: activeRide.fare })
        setActiveRide(null)
        rideStartTimeRef.current = null
        fetchRideHistory()
        fetchEarnings(earningsPeriod)
      }
    } catch (err) {
      console.error('Failed to complete ride:', err)
      setError('Failed to complete ride. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRide = async () => {
    if (!activeRide) return
    setActionLoading('cancel')
    try {
      const res = await updateRide(activeRide.id, { status: 'CANCELLED', cancelledBy: 'DRIVER' })
      if (res.success) {
        emitRideCancel({ rideId: activeRide.id, userId: activeRide.userId, driverId, cancelledBy: 'DRIVER' })
        setActiveRide(null)
        rideStartTimeRef.current = null
        fetchRideHistory()
        toast.info('Ride cancelled.')
      }
    } catch (err) {
      console.error('Failed to cancel ride:', err)
      setError('Failed to cancel ride. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRateRide = async (rideId: string, rating: number) => {
    try {
      const ride = rideHistory.find((r) => r.id === rideId)
      if (ride) {
        await createRating({ rideId, fromUserId: driverId, toUserId: ride.userId, rating })
        setRideHistory((prev) => prev.map((r) => (r.id === rideId ? { ...r, rating } : r)))
        toast.success('Rating submitted!')
      }
    } catch (err) {
      console.error('Failed to rate ride:', err)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      setTimeout(() => setError(null), 3000)
      return
    }
    if (amount > (currentUser?.walletBalance || 0)) {
      setError('Insufficient balance')
      setTimeout(() => setError(null), 3000)
      return
    }
    setActionLoading('withdraw')
    try {
      const data: Record<string, unknown> = {
        driverId,
        amount,
        method: withdrawMethod === 'upi' ? 'UPI' : 'BANK',
      }
      if (withdrawMethod === 'upi') {
        data.upiId = upiId
      } else {
        data.bankAccount = bankAccount
        data.bankName = bankName
        data.ifscCode = ifscCode
      }
      await createWithdrawRequest(data)
      setWithdrawOpen(false)
      setWithdrawAmount('')
      setUpiId('')
      setBankAccount('')
      setBankName('')
      setIfscCode('')
      toast.success('Withdrawal request submitted!')
    } catch (err) {
      console.error('Failed to create withdrawal request:', err)
      setError('Failed to submit withdrawal request. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRegister = async () => {
    if (!vehicleType || !vehicleNumber || !licenseNumber) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(null), 3000)
      return
    }
    setActionLoading('register')
    try {
      const res = await registerDriver({
        userId: driverId,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        aadhaarNumber: aadhaarNumber || undefined,
        aadhaarPhoto: aadhaarPhotoPreview || undefined,
        licensePhoto: licensePhotoPreview || undefined,
        rcNumber: rcNumber || undefined,
        rcPhoto: rcPhotoPreview || undefined,
        vehiclePhoto: vehiclePhotoPreview || undefined,
      })
      if (res.success) {
        // Update store so the user is now recognized as a registered (but unapproved) driver
        updateCurrentUser({
          role: 'DRIVER',
          vehicleType,
          vehicleNumber,
          licenseNumber,
          isRegistered: true,
          isApproved: false,
        })
        toast.success('Registration submitted for verification!')
        setShowRegistration(false)
      }
    } catch (err) {
      console.error('Failed to register driver:', err)
      setError('Failed to submit registration. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleFileUpload = (type: 'aadhaar' | 'license' | 'rc' | 'vehicle') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          switch (type) {
            case 'aadhaar': setAadhaarPhotoPreview(base64); break
            case 'license': setLicensePhotoPreview(base64); break
            case 'rc': setRcPhotoPreview(base64); break
            case 'vehicle': setVehiclePhotoPreview(base64); break
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleDocUpload = async () => {
    if (!docUploadType || !driverId) return
    setActionLoading('docUpload')
    try {
      const data: Record<string, string | undefined> = {}
      switch (docUploadType) {
        case 'aadhaar':
          data.aadhaarNumber = aadhaarNumber || undefined
          data.aadhaarPhoto = aadhaarPhotoPreview || undefined
          break
        case 'license':
          data.licensePhoto = licensePhotoPreview || undefined
          break
        case 'rc':
          data.rcNumber = rcNumber || undefined
          data.rcPhoto = rcPhotoPreview || undefined
          break
        case 'vehicle':
          data.vehiclePhoto = vehiclePhotoPreview || undefined
          break
      }
      await uploadDriverDocuments(driverId, data)
      toast.success('Document uploaded successfully!')
      setDocUploadOpen(false)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to upload document:', err)
      setError('Failed to upload document. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Chart Data ──────────────────────────────────────────────────────────

  const chartData = earningsData.breakdown.length > 0
    ? earningsData.breakdown.map((b) => ({
        day: formatBreakdownDate(b.date),
        amount: b.amount,
        takeHome: Math.round(b.amount * 0.85 * 100) / 100,
        commission: Math.round(b.amount * 0.15 * 100) / 100,
      }))
    : [
        { day: 'Mon', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Tue', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Wed', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Thu', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Fri', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Sat', amount: 0, takeHome: 0, commission: 0 },
        { day: 'Sun', amount: 0, takeHome: 0, commission: 0 },
      ]

  // ─── Vehicle emoji helper ────────────────────────────────────────────────

  const vehicleEmoji = (vt?: string) => {
    switch (vt) {
      case 'TEMPO': return '🛺'
      case 'AUTO': return '🚗'
      case 'E_RICKSHAW': return '🛵'
      default: return '🛺'
    }
  }

  const vehicleLabel = (vt?: string) => {
    switch (vt) {
      case 'TEMPO': return 'Tempo'
      case 'AUTO': return 'Auto'
      case 'E_RICKSHAW': return 'E-Rickshaw'
      default: return vt || ''
    }
  }

  // ─── GPS Status Config ───────────────────────────────────────────────────

  const gpsStatusConfig: Record<GpsStatus, { color: string; label: string; dotClass: string }> = {
    connected: { color: 'text-emerald-600', label: t('gpsConnected'), dotClass: 'bg-emerald-500' },
    searching: { color: 'text-amber-500', label: t('gpsSearching'), dotClass: 'bg-amber-500' },
    error: { color: 'text-red-500', label: t('gpsError'), dotClass: 'bg-red-500' },
  }

  // ─── Tab Config ───────────────────────────────────────────────────────────

  const tabs: { key: DriverTab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: t('home'), icon: <Home className="h-5 w-5" /> },
    { key: 'rides', label: t('rides'), icon: <Route className="h-5 w-5" /> },
    { key: 'earnings', label: t('earnings'), icon: <IndianRupee className="h-5 w-5" /> },
    { key: 'notifications', label: t('notifications'), icon: <Bell className="h-5 w-5" /> },
    { key: 'profile', label: t('profile'), icon: <User className="h-5 w-5" /> },
  ]

  // ─── Navigation Direction Steps (simulated) ──────────────────────────────

  const navigationSteps = activeRide ? [
    { instruction: activeRide.status === 'ACCEPTED' ? `Head to ${activeRide.pickup}` : `Head towards ${activeRide.drop}`, distance: activeRide.distance ? `${(activeRide.distance * 0.6).toFixed(1)} km` : '1.2 km', icon: <Navigation2 className="h-4 w-4" /> },
    { instruction: 'Turn right at the main road', distance: '0.8 km', icon: <ArrowRight className="h-4 w-4" /> },
    { instruction: 'Continue straight', distance: '1.5 km', icon: <Navigation2 className="h-4 w-4" /> },
    { instruction: 'Turn left at the intersection', distance: '0.5 km', icon: <ArrowRight className="h-4 w-4 rotate-180" /> },
    { instruction: activeRide.status === 'ACCEPTED' ? `Arrive at pickup: ${activeRide.pickup}` : `Arrive at destination: ${activeRide.drop}`, distance: '0.3 km', icon: <MapPin className="h-4 w-4" /> },
  ] : []

  // ─── Registration Flow ────────────────────────────────────────────────────

  if (showRegistration) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b">
          <Button variant="ghost" size="sm" onClick={() => setShowRegistration(false)}>
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-orange-600">{t('registerAsDriver')}</h1>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Step {regStep} of 4</span>
          </div>
          <Progress value={(regStep / 4) * 100} className="h-2" />
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {regStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto mb-3">
                    <Car className="h-8 w-8 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-bold">{lang === 'as' ? 'বাহনৰ বিৱৰণ' : 'Vehicle Details'}</h2>
                  <p className="text-sm text-muted-foreground">{lang === 'as' ? 'আপোনাৰ বাহনৰ বিষয়ে কওক' : 'Tell us about your vehicle'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Vehicle Type *</label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEMPO">🛺 Tempo</SelectItem>
                      <SelectItem value="AUTO">🚗 Auto Rickshaw</SelectItem>
                      <SelectItem value="E_RICKSHAW">🛵 E-Rickshaw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Vehicle Number *</label>
                  <Input placeholder="AS 01 XX 1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">License Number *</label>
                  <Input placeholder="DL-XXXXXXXXXX" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                </div>

                {/* Vehicle Photo Upload */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Vehicle Photo</label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 transition-colors"
                    onClick={() => handleFileUpload('vehicle')}
                  >
                    {vehiclePhotoPreview ? (
                      <div className="relative">
                        <img src={vehiclePhotoPreview} alt="Vehicle" className="w-full h-32 object-cover rounded-lg" />
                        <Badge className="absolute top-2 right-2 bg-emerald-600">Uploaded</Badge>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Tap to upload vehicle photo</p>
                      </>
                    )}
                  </div>
                </div>

                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setRegStep(2)} disabled={!vehicleType || !vehicleNumber || !licenseNumber}>
                  Next: Aadhaar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {regStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold">{lang === 'as' ? 'আধাৰ যাচাই' : 'Aadhaar Verification'}</h2>
                  <p className="text-sm text-muted-foreground">{lang === 'as' ? 'পৰিচয় যাচাইৰ বাবে আধাৰ কাৰ্ড আপলোড কৰক' : 'Upload your Aadhaar card for identity verification'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Aadhaar Number</label>
                  <Input placeholder="XXXX XXXX XXXX" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} maxLength={14} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Aadhaar Card Photo *</label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => handleFileUpload('aadhaar')}
                  >
                    {aadhaarPhotoPreview ? (
                      <div className="relative">
                        <img src={aadhaarPhotoPreview} alt="Aadhaar" className="w-full h-32 object-cover rounded-lg" />
                        <Badge className="absolute top-2 right-2 bg-emerald-600">Uploaded</Badge>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Tap to upload Aadhaar card photo</p>
                        <p className="text-xs text-muted-foreground mt-1">Front side with photo</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRegStep(1)}>Back</Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setRegStep(3)}>
                    Next: License <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {regStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold">{lang === 'as' ? 'ড্ৰাইভিং লাইচেন্স' : 'Driving License'}</h2>
                  <p className="text-sm text-muted-foreground">{lang === 'as' ? 'আপোনাৰ ড্ৰাইভিং লাইচেন্স আপলোড কৰক' : 'Upload your driving license'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">License Card Photo *</label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                    onClick={() => handleFileUpload('license')}
                  >
                    {licensePhotoPreview ? (
                      <div className="relative">
                        <img src={licensePhotoPreview} alt="License" className="w-full h-32 object-cover rounded-lg" />
                        <Badge className="absolute top-2 right-2 bg-emerald-600">Uploaded</Badge>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Tap to upload license photo</p>
                        <p className="text-xs text-muted-foreground mt-1">Front side with photo & details</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRegStep(2)}>Back</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setRegStep(4)}>
                    Next: RC <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {regStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-3">
                    <Car className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold">{lang === 'as' ? 'বাহন RC (পঞ্জীকৰণ প্ৰমাণপত্ৰ)' : 'Vehicle RC (Registration Certificate)'}</h2>
                  <p className="text-sm text-muted-foreground">{lang === 'as' ? 'আপোনাৰ বাহন RC বহি আপলোড কৰক' : 'Upload your vehicle RC book'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">RC Number</label>
                  <Input placeholder="RC Number" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">RC Book/Card Photo</label>
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => handleFileUpload('rc')}
                  >
                    {rcPhotoPreview ? (
                      <div className="relative">
                        <img src={rcPhotoPreview} alt="RC" className="w-full h-32 object-cover rounded-lg" />
                        <Badge className="absolute top-2 right-2 bg-emerald-600">Uploaded</Badge>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Tap to upload RC photo</p>
                        <p className="text-xs text-muted-foreground mt-1">Front page with vehicle details</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    📋 Your documents will be verified by our team within 24-48 hours. You can start accepting rides after approval.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRegStep(3)}>Back</Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleRegister}
                    disabled={actionLoading === 'register'}
                  >
                    {actionLoading === 'register' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t('completeRegistration')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ─── Not Registered Screen ────────────────────────────────────────────────

  if (!isRegistered) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b">
          <span className="text-xl">🛺</span>
          <h1 className="text-lg font-bold text-orange-600">GramYatri</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-6"
          >
            🛺
          </motion.div>
          <h2 className="text-xl font-bold mb-2">{t('registerAsDriver')}</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {lang === 'as' ? 'আপোনাৰ বাহন পঞ্জীকৰণ কৰক আৰু উপাৰ্জন আৰম্ভ কৰক। ৰাইড অনুৰোধ গ্ৰহণ কৰিবলৈ যাচাই সম্পূৰ্ণ কৰক।' : 'Register your vehicle and start earning. Complete verification to accept ride requests.'}
          </p>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white px-8"
            onClick={() => setShowRegistration(true)}
          >
            <Car className="h-4 w-4 mr-2" />
            {t('registerAsDriver')}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Suspended Screen ─────────────────────────────────────────────────────

  if (isSuspended) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b">
          <span className="text-xl">🛺</span>
          <h1 className="text-lg font-bold text-orange-600">GramYatri</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">{lang === 'as' ? 'একাউণ্ট স্থগিত' : 'Account Suspended'}</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            {lang === 'as' ? 'আপোনাৰ চালক একাউণ্ট স্থগিত কৰা হৈছে। অনুগ্ৰহ কৰি সহায়ৰ বাবে সমৰ্থনৰ সৈতে যোগাযোগ কৰক।' : 'Your driver account has been suspended. Please contact support for assistance.'}
          </p>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Pending Approval Screen ──────────────────────────────────────────────

  if (!isApproved) {
    const vStatus = (documents?.verificationStatus as string) || 'PENDING'
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
        <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b">
          <span className="text-xl">🛺</span>
          <h1 className="text-lg font-bold text-orange-600">GramYatri</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-6"
          >
            <Clock className="h-10 w-10 text-amber-500" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">{t('pendingVerification')}</h2>
          <DocStatusBadge status={vStatus} />
          <p className="text-sm text-muted-foreground mt-3 mb-2 max-w-xs">
            {vStatus === 'REJECTED'
              ? (lang === 'as' ? 'আপোনাৰ দস্তাবেজ প্ৰত্যাখ্যান কৰা হৈছে। অনুগ্ৰহ কৰি শুদ্ধ দস্তাবেজ পুনৰ আপলোড কৰক।' : 'Your documents were rejected. Please re-upload correct documents.')
              : (lang === 'as' ? 'আপোনাৰ দস্তাবেজ যাচাই কৰি থকা হৈছে। ই সাধাৰণতে ২৪-৪৮ ঘণ্টা লাগে।' : 'Your documents are being verified. This usually takes 24-48 hours.')}
          </p>
          {documents?.rejectReason && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 px-3 py-2 rounded-lg mb-4 w-full">
              <p className="text-xs text-red-700 dark:text-red-300">
                Reason: {documents.rejectReason as string}
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDocUploadOpen(true); setDocUploadType('aadhaar') }}>
              <Upload className="h-4 w-4 mr-2" />
              {t('uploadDocuments')}
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main Driver Panel ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛺</span>
          <h1 className="text-lg font-bold text-orange-600">GramYatri</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>
          {/* Notification bell */}
          <button
            className="relative p-1"
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            {isOnline && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full bg-emerald-500"
              />
            )}
            <Badge variant={isOnline ? 'default' : 'secondary'} className={isOnline ? 'bg-emerald-600' : ''}>
              {isOnline ? t('online') : t('offline')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 px-4 py-2 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {/* ═══ HOME TAB ═══ */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* ═══ ENHANCED Online/Offline Toggle Card ═══ */}
              <Card
                className={`border-0 overflow-hidden ${
                  isOnline
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {isOnline ? <Power className="h-8 w-8" /> : <PowerOff className="h-8 w-8" />}
                        {/* Enhanced: Pulsing green dot when online */}
                        {isOnline && (
                          <motion.div
                            animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-300"
                          />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{isOnline ? (lang === 'as' ? 'আপুনি অনলাইন' : "You're Online") : (lang === 'as' ? 'আপুনি অফলাইন' : "You're Offline")}</h2>
                        <p className="text-sm opacity-90">
                          {isOnline ? (lang === 'as' ? 'এতিয়া ৰাইড অনুৰোধ গ্ৰহণ কৰি আছে' : 'Receiving ride requests now') : (lang === 'as' ? 'ৰাইড পাবলৈ অনলাইন যাওক' : 'Go online to receive rides')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isOnline}
                      onCheckedChange={handleToggleOnline}
                      className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/20"
                    />
                  </div>

                  {isOnline && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-green-300"
                      />
                      <span className="text-sm font-medium">{t('searchingForRides')}</span>
                    </motion.div>
                  )}

                  {/* Enhanced: Clear offline state with instructions */}
                  {!isOnline && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 rounded-lg bg-white/10"
                    >
                      <p className="text-xs opacity-90 mb-2">To start receiving ride requests:</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</span>
                        <span className="text-xs">Toggle the switch above to go online</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</span>
                        <span className="text-xs">Allow location access when prompted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</span>
                        <span className="text-xs">Ride requests will appear automatically</span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* ═══ ENHANCED Live GPS Location Card ═══ */}
              {isOnline && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Map Preview */}
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                          {currentLocation ? (
                            <SmallMapPreview lat={currentLocation.lat} lng={currentLocation.lng} status={gpsStatus} />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* GPS Status Indicator */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <motion.div
                              animate={gpsStatus === 'searching' ? { opacity: [1, 0.3, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className={`w-2 h-2 rounded-full ${gpsStatusConfig[gpsStatus].dotClass}`}
                            />
                            <span className={`text-xs font-medium ${gpsStatusConfig[gpsStatus].color}`}>
                              {gpsStatusConfig[gpsStatus].label}
                            </span>
                          </div>

                          {locationError ? (
                            <p className="text-sm font-medium text-red-500">{locationError}</p>
                          ) : currentLocation ? (
                            <>
                              <p className="text-sm font-medium text-emerald-600">
                                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                              </p>
                              {gpsAccuracy && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Accuracy: {gpsAccuracy < 20 ? 'Excellent' : gpsAccuracy < 50 ? 'Good' : gpsAccuracy < 100 ? 'Fair' : 'Poor'} (±{Math.round(gpsAccuracy)}m)
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm font-medium text-amber-500">Acquiring GPS signal...</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Route className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">{lang === 'as' ? 'আজিৰ ৰাইড' : "Today's Rides"}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {loadingEarnings ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : earningsData.rides}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">{t('todayEarnings')}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {loadingEarnings ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : `₹${earningsData.total.toLocaleString()}`}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Quick View */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('walletBalance')}</p>
                        <p className="text-lg font-bold">₹{(currentUser?.walletBalance || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('earnings')}>
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {t('earnings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ═══ ENHANCED Incoming Ride Requests ═══ */}
              {isOnline && incomingRides.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2.5 h-2.5 rounded-full bg-orange-500"
                      />
                      <h3 className="font-semibold text-sm">{t('newRideRequest')} ({incomingRides.length})</h3>
                    </div>
                    {/* Sound indicator */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                      <span>{soundEnabled ? 'Sound on' : 'Muted'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {incomingRides.map((ride, index) => (
                        <motion.div
                          key={ride.id}
                          initial={{ opacity: 0, y: 80, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -200 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
                          className="relative"
                        >
                          {actionLoading === `accept-${ride.id}` && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-center justify-center rounded-xl">
                              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                            </div>
                          )}

                          {/* Enhanced Ride Request Card */}
                          <Card className="border-0 shadow-lg overflow-hidden">
                            <CardContent className="p-0">
                              {/* Top bar with countdown */}
                              <div className="flex items-center justify-between px-4 py-2 bg-orange-50 dark:bg-orange-950/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{vehicleEmoji(ride.vehicleType)}</span>
                                  <Badge className="bg-orange-600 text-white text-xs">
                                    {vehicleLabel(ride.vehicleType)}
                                  </Badge>
                                  {ride.paymentMethod === 'WALLET' && (
                                    <Badge variant="outline" className="text-[10px]">
                                      <Wallet className="h-2.5 w-2.5 mr-1" />
                                      Wallet
                                    </Badge>
                                  )}
                                </div>
                                <CircularCountdown seconds={requestTimers[ride.id] ?? 0} />
                              </div>

                              {/* Pickup & Drop */}
                              <div className="px-4 py-3 space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className="flex flex-col items-center mt-1">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-200" />
                                    <div className="w-0.5 h-5 bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-200" />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground">PICKUP</p>
                                      <p className="text-sm font-medium">{ride.pickup}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground">DROP-OFF</p>
                                      <p className="text-sm font-medium">{ride.drop}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ride Details Row */}
                              <div className="px-4 pb-3 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 font-bold text-emerald-600 text-base">
                                  <IndianRupee className="h-4 w-4" />
                                  {ride.fare}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Route className="h-3 w-3" />
                                  {ride.distance ? `${ride.distance.toFixed(1)} km` : '~3 km'}
                                </span>
                                {ride.userName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ride.userName}
                                    {ride.rating && (
                                      <span className="flex items-center gap-0.5 text-amber-500">
                                        <Star className="h-2.5 w-2.5 fill-amber-500" />
                                        {ride.rating.toFixed(1)}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Large Accept/Reject Buttons */}
                              <div className="flex gap-0 border-t">
                                <button
                                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
                                  onClick={() => handleRideAction('accept', ride.id)}
                                  disabled={actionLoading === `accept-${ride.id}`}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  {t('accept')}
                                </button>
                                <div className="w-px bg-white/20" />
                                <button
                                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
                                  onClick={() => handleRideAction('reject', ride.id)}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  {t('reject')}
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Waiting Animation */}
              {isOnline && incomingRides.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-5xl mb-4"
                  >
                    🛺
                  </motion.div>
                  <p className="text-muted-foreground text-sm">{t('searchingForRides')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lang === 'as' ? 'নিশ্চিত কৰক যে আপোনাৰ GPS সক্ৰিয়' : 'Make sure your GPS is active'}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ RIDES TAB ═══ */}
          {activeTab === 'rides' && (
            <motion.div
              key="rides"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Active Ride */}
              {activeRide && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-emerald-500" />
                    {lang === 'as' ? 'সক্ৰিয় ৰাইড' : 'Active Ride'}
                  </h3>
                  <RideCard ride={activeRide} variant="active" onAction={handleRideAction} />

                  {/* Ride Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {activeRide.status === 'ACCEPTED' && (
                      <>
                        {/* Enhanced: Start Ride button with confirmation */}
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
                          onClick={handleStartRideClick}
                          disabled={actionLoading === 'start'}
                        >
                          {actionLoading === 'start' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                          Start Ride
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-11"
                          onClick={() => handleRideAction('navigate')}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {lang === 'as' ? 'নেভিগেট' : 'Navigate'}
                        </Button>
                      </>
                    )}
                    {activeRide.status === 'IN_PROGRESS' && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                        onClick={handleCompleteRide}
                        disabled={actionLoading === 'complete'}
                      >
                        {actionLoading === 'complete' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        {t('completeRide')}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className={activeRide.status === 'IN_PROGRESS' ? '' : 'flex-1'}
                      onClick={handleCancelRide}
                      disabled={actionLoading === 'cancel'}
                    >
                      {actionLoading === 'cancel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      {t('cancel')}
                    </Button>
                  </div>

                  {/* Navigation Card */}
                  {(activeRide.status === 'ACCEPTED' || activeRide.status === 'IN_PROGRESS') && (
                    <Card className="border-0 shadow-sm mt-3">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Navigation className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activeRide.status === 'ACCEPTED' ? t('navigateToPickup') : (lang === 'as' ? 'ড্ৰপ-অফলৈ যাওক' : 'Navigate to Drop-off')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activeRide.status === 'ACCEPTED' ? activeRide.pickup : activeRide.drop}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setNavOpen(true)}
                          >
                            {lang === 'as' ? 'নেভিগেট' : 'Navigate'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* No Active Ride */}
              {!activeRide && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Route className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{lang === 'as' ? 'কোনো সক্ৰিয় ৰাইড নাই' : 'No active ride'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lang === 'as' ? 'ৰাইড অনুৰোধ পাবলৈ অনলাইন যাওক' : 'Go online to receive ride requests'}</p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Incoming Requests */}
              {isOnline && incomingRides.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <h3 className="font-semibold text-sm">Incoming Requests ({incomingRides.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {incomingRides.map((ride) => (
                      <div key={ride.id} className="relative">
                        {actionLoading === `accept-${ride.id}` && (
                          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 z-20">
                          <CircularCountdown seconds={requestTimers[ride.id] ?? 0} />
                        </div>
                        <RideCard ride={ride} variant="incoming" onAction={handleRideAction} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ride History */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {t('rideHistory')}
                  {loadingHistory && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </h3>
                {loadingHistory && rideHistory.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{lang === 'as' ? 'ৰাইড ইতিহাস লোড হৈ আছে...' : 'Loading ride history...'}</p>
                    </CardContent>
                  </Card>
                ) : rideHistory.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t('noRides')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {rideHistory.map((ride) => (
                      <RideCard key={ride.id} ride={ride} variant="history" onRate={handleRateRide} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ ENHANCED EARNINGS TAB ═══ */}
          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Period Selector */}
              <div className="flex gap-2">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={earningsPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 capitalize ${earningsPeriod === period ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
                    onClick={() => setEarningsPeriod(period)}
                    disabled={loadingEarnings}
                  >
                    {t(period)}
                  </Button>
                ))}
              </div>

              {/* ═══ ENHANCED: Today's Earnings Big Card ═══ */}
              <Card className="border-0 overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm opacity-90">
                        {earningsPeriod === 'today' ? t('todayEarnings') : earningsPeriod === 'week' ? t('weeklyEarnings') : t('monthlyEarnings')}
                      </p>
                      <p className="text-4xl font-bold mt-1">
                        {loadingEarnings ? <Loader2 className="h-9 w-9 animate-spin" /> : `₹${earningsData.total.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" />
                      {earningsData.rides} rides
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" />
                      {t('walletBalance')}: ₹{(currentUser?.walletBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* ═══ ENHANCED: Commission vs Take-home ═══ */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">{t('yourEarnings')}</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">
                      ₹{Math.round(earningsData.total * 0.85).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">After 15% commission</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-muted-foreground">{t('commission')}</span>
                    </div>
                    <p className="text-xl font-bold text-red-500">
                      ₹{Math.round(earningsData.total * 0.15).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">15% platform fee</p>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet & Rides Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">{t('wallet')}</span>
                    </div>
                    <p className="text-xl font-bold">₹{(currentUser?.walletBalance || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">{t('totalRides')}</span>
                    </div>
                    <p className="text-xl font-bold">{earningsData.rides}</p>
                  </CardContent>
                </Card>
              </div>

              {/* ═══ ENHANCED: Weekly Earnings Chart with Take-home Line ═══ */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `₹${value}`,
                            name === 'amount' ? 'Total' : name === 'takeHome' ? 'Take Home' : 'Commission',
                          ]}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} name="amount" />
                        <Bar dataKey="takeHome" fill="#10b981" radius={[4, 4, 0, 0]} name="takeHome" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">Take Home</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ═══ ENHANCED: Request Withdrawal Button ═══ */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-base"
                onClick={() => setWithdrawOpen(true)}
              >
                <Wallet className="h-5 w-5 mr-2" />
                {lang === 'as' ? 'উলিওৱাৰ অনুৰোধ' : 'Request Withdrawal'}
              </Button>
            </motion.div>
          )}

          {/* ═══ NOTIFICATIONS TAB ═══ */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">{t('notifications')}</h2>
                <Button variant="ghost" size="sm" onClick={fetchNotifications}>
                  <RefreshCw className={`h-4 w-4 ${loadingNotifications ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {loadingNotifications && notifications.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{lang === 'as' ? 'জাননী লোড হৈ আছে...' : 'Loading notifications...'}</p>
                  </CardContent>
                </Card>
              ) : notifications.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t('noNotifications')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => {
                    const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
                      INFO: { icon: <Bell className="h-4 w-4" />, color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' },
                      RIDE: { icon: <Route className="h-4 w-4" />, color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' },
                      PAYMENT: { icon: <IndianRupee className="h-4 w-4" />, color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' },
                      ALERT: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' },
                      PROMO: { icon: <Star className="h-4 w-4" />, color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' },
                    }
                    const config = typeConfig[notif.type] || typeConfig.INFO

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-lg p-3 ${notif.isRead ? 'bg-white dark:bg-gray-900' : 'bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${notif.isRead ? 'text-muted-foreground' : ''}`}>{notif.title}</p>
                              {!notif.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-4"
            >
              {/* Profile Card */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 text-xl font-bold">
                        {driverName.charAt(0) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="font-bold text-lg">{driverName}</h2>
                      <p className="text-sm text-muted-foreground">{driverPhone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">{t('verifiedDriver')}</Badge>
                        {currentUser?.rating ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {currentUser.rating > 0 ? currentUser.rating.toFixed(1) : t('noRatings')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-muted-foreground" />
                            {t('noRatings')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Info Card */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="h-4 w-4 text-orange-500" />
                    {t('vehicleInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('vehicleType')}</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      {vehicleEmoji(currentUser?.vehicleType)} {vehicleLabel(currentUser?.vehicleType)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('vehicleNumber')}</span>
                    <span className="text-sm font-medium">{currentUser?.vehicleNumber || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('totalRides')}</span>
                    <span className="text-sm font-medium">{currentUser?.totalRides || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('totalEarnings')}</span>
                    <span className="text-sm font-medium">₹{((currentUser?.totalEarnings || 0)).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    {t('documents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Aadhaar Card', key: 'aadhaarPhoto', type: 'aadhaar', hasDoc: !!(documents?.aadhaarPhoto) },
                    { label: 'Driving License', key: 'licensePhoto', type: 'license', hasDoc: !!(documents?.licensePhoto) },
                    { label: 'Vehicle RC', key: 'rcPhoto', type: 'rc', hasDoc: !!(documents?.rcPhoto) },
                    { label: 'Vehicle Photo', key: 'vehiclePhoto', type: 'vehicle', hasDoc: !!(documents?.vehiclePhoto) },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => {
                        setDocUploadType(doc.type)
                        setDocUploadOpen(true)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doc.hasDoc ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {doc.hasDoc ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Upload className="h-4 w-4 text-gray-400" />}
                        </div>
                        <span className="text-sm">{doc.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.hasDoc ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">Uploaded</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Upload</Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Verification Status</p>
                        <DocStatusBadge status={(documents?.verificationStatus as string) || 'APPROVED'} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                {/* Language Toggle */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={toggleLang}
                >
                  <Globe className="h-4 w-4 mr-3" />
                  {t('language')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  {t('logout')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ ENHANCED Navigation Mode Overlay ═══ */}
      <AnimatePresence>
        {navOpen && activeRide && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 max-w-md mx-auto flex flex-col"
          >
            {/* Nav Header with Speed */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Compass className="h-6 w-6" />
              </motion.div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{lang === 'as' ? 'নেভিগেচন মোড' : 'Navigation Mode'}</h2>
                <p className="text-xs opacity-90">
                  {activeRide.status === 'ACCEPTED' ? (lang === 'as' ? 'পিকআপ বিন্দুলৈ যাওক' : 'Head to pickup point') : (lang === 'as' ? 'ড্ৰপ-অফলৈ যাওক' : 'Heading to drop-off')}
                </p>
              </div>
              {/* Current Speed Display */}
              {activeRide.status === 'IN_PROGRESS' && currentSpeed > 0 && (
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1.5">
                  <Gauge className="h-4 w-4" />
                  <span className="text-sm font-bold">{currentSpeed}</span>
                  <span className="text-[10px] opacity-80">km/h</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Route Progress Indicator */}
            <div className="px-4 py-4 bg-white dark:bg-gray-900 border-b">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                    <MapPin className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="w-0.5 h-8 bg-gradient-to-b from-orange-400 to-emerald-400" />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center"
                  >
                    <Navigation className="h-2.5 w-2.5 text-white" />
                  </motion.div>
                  <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-emerald-500" />
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('pickup')}</p>
                    <p className="text-sm font-medium">{activeRide.pickup}</p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 font-semibold">Your Position</p>
                    <p className="text-sm text-muted-foreground">
                      {currentLocation
                        ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                        : 'Locating...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('drop')}</p>
                    <p className="text-sm font-medium">{activeRide.drop}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ ENHANCED: Turn-by-turn Directions ═══ */}
            <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Milestone className="h-4 w-4 text-orange-500" />
                {lang === 'as' ? 'নিৰ্দেশনা' : 'Directions'}
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {navigationSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${i === 0 ? 'font-semibold text-orange-700 dark:text-orange-300' : 'text-muted-foreground'}`}>
                        {step.instruction}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{step.distance}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Destination & ETA Card */}
            <div className="px-4 py-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeRide.status === 'ACCEPTED'
                        ? 'bg-orange-100 dark:bg-orange-900'
                        : 'bg-emerald-100 dark:bg-emerald-900'
                    }`}>
                      {activeRide.status === 'ACCEPTED'
                        ? <MapPin className="h-6 w-6 text-orange-600" />
                        : <CheckCircle className="h-6 w-6 text-emerald-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Current Destination</p>
                      <p className="text-sm font-bold">
                        {activeRide.status === 'ACCEPTED' ? activeRide.pickup : activeRide.drop}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        {activeRide.distance ? `~${Math.ceil(activeRide.distance / 2)} min` : '~10 min'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Route className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">
                        {activeRide.distance ? `${activeRide.distance.toFixed(1)} km` : '~3 km'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">₹{activeRide.fare}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ride Details Card */}
            <div className="px-4 pb-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 text-sm font-bold">
                        {activeRide.userName?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activeRide.userName || t('passenger')}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 text-[10px]">
                          {vehicleEmoji(activeRide.vehicleType)} {vehicleLabel(activeRide.vehicleType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">₹{activeRide.fare}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        if (activeRide.userPhone) {
                          window.open(`tel:${activeRide.userPhone}`)
                        }
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="p-4 space-y-3 bg-white dark:bg-gray-900 border-t">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
                onClick={() => {
                  const dest = activeRide.status === 'ACCEPTED' ? activeRide.pickup : activeRide.drop
                  if (dest) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank')
                  }
                  toast.success('Opening Google Maps...')
                }}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {lang === 'as' ? 'Google Maps ত খোলক' : 'Open in Google Maps'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => setNavOpen(false)}
              >
                {t('close')} {lang === 'as' ? 'নেভিগেচন' : 'Navigation'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ENHANCED: Ride Start Confirmation Dialog ═══ */}
      <Dialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Start Ride Confirmation
            </DialogTitle>
            <DialogDescription>
              {lang === 'as' ? 'ৰাইড আৰম্ভ কৰাৰ আগতে পিকআপৰ বিৱৰণ যাচাই কৰক' : 'Verify pickup details before starting the ride'}
            </DialogDescription>
          </DialogHeader>
          {activeRide && (
            <div className="space-y-4 pt-2">
              {/* Pickup Verification */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{t('pickup')} {lang === 'as' ? 'স্থান' : 'Location'}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium">{activeRide.pickup}</p>
                </div>
              </div>

              {/* Drop-off */}
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">{t('drop')} {lang === 'as' ? 'স্থান' : 'Location'}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-medium">{activeRide.drop}</p>
                </div>
              </div>

              {/* Ride Details */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-muted-foreground">{t('fare')}</p>
                  <p className="text-sm font-bold">₹{activeRide.fare}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-muted-foreground">{t('distance')}</p>
                  <p className="text-sm font-bold">{activeRide.distance ? `${activeRide.distance.toFixed(1)} km` : 'N/A'}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-muted-foreground">{t('paymentMethod')}</p>
                  <p className="text-sm font-bold">{activeRide.paymentMethod}</p>
                </div>
              </div>

              {/* Passenger Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 text-sm font-bold">
                    {activeRide.userName?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{activeRide.userName || t('passenger')}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'as' ? 'নিশ্চিত কৰক যে যাত্ৰী পিকআপ বিন্দুত আছে' : 'Confirm passenger is at pickup point'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowStartConfirm(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleStartRide}
                  disabled={actionLoading === 'start'}
                >
                  {actionLoading === 'start' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {t('confirm')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ ENHANCED: Ride Completion Summary Dialog ═══ */}
      <Dialog open={showRideSummary} onOpenChange={setShowRideSummary}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              {t('rideCompleted')}!
            </DialogTitle>
            <DialogDescription>
              {lang === 'as' ? 'আপোনাৰ ৰাইডৰ সাৰাংশ ইয়াত আছে' : 'Here is your ride summary'}
            </DialogDescription>
          </DialogHeader>
          {rideSummaryData && (
            <div className="space-y-4 pt-2">
              {/* Big Fare Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-center">
                <p className="text-sm opacity-90">{t('rideFare')}</p>
                <p className="text-4xl font-bold mt-1">₹{rideSummaryData.fare}</p>
                <p className="text-xs opacity-80 mt-1">
                  {rideSummaryData.paymentMethod === 'WALLET' ? `💳 ${t('wallet')}` : `💵 ${t('cash')}`}
                </p>
              </div>

              {/* Summary Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    {t('distance')}
                  </span>
                  <span className="text-sm font-medium">{rideSummaryData.distance ? `${rideSummaryData.distance.toFixed(1)} km` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('duration')}
                  </span>
                  <span className="text-sm font-medium">{rideSummaryData.duration}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t('commission')} (15%)
                  </span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">-₹{rideSummaryData.commission}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    {t('yourEarnings')}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{rideSummaryData.takeHome}</span>
                </div>
              </div>

              {/* UPI Payment Option for commission payment */}
              {paymentSettings.upiPaymentEnabled && (
                <div className="space-y-2">
                  {!showUpiPayment ? (
                    <Button
                      variant="outline"
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => setShowUpiPayment(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Commission via UPI
                    </Button>
                  ) : (
                    <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Pay Commission via UPI</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Pay ₹{rideSummaryData.commission} commission to admin</p>
                      {paymentSettings.upiId && (
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                          <span className="text-xs text-muted-foreground">UPI ID:</span>
                          <span className="text-sm font-mono font-medium">{paymentSettings.upiId}</span>
                        </div>
                      )}
                      {paymentSettings.paymentQrUrl && (
                        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-md">
                          <img src={paymentSettings.paymentQrUrl} alt="Payment QR Code" className="max-h-32 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <p className="text-[10px] text-muted-foreground mt-1">Scan QR to pay commission</p>
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
                            toast.success('Commission payment confirmed!')
                          }}
                        >
                          I&apos;ve Paid ₹{rideSummaryData.commission}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-emerald-100 dark:bg-emerald-950 rounded-md">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Payment confirmed!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setShowRideSummary(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Permission Prompt Dialog */}
      <Dialog open={locationPermissionOpen} onOpenChange={setLocationPermissionOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Location Access Required
            </DialogTitle>
            <DialogDescription>
              GramYatri needs your location to match you with nearby riders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <MapPin className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Find nearby riders</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your location helps us show you ride requests from passengers near you</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Navigation className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Navigation</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enables turn-by-turn navigation to pickup and drop-off points</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Safety</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your live location is shared for safety and emergency purposes during rides</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLocationPermissionDeny}
              >
                Not Now
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleLocationPermissionGrant}
              >
                Allow Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.key
                  ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="relative">
                {tab.icon}
                {tab.key === 'notifications' && unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-600" />
              {t('withdraw')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{lang === 'as' ? 'উপলব্ধ বেলেন্স' : 'Available Balance'}: <span className="font-bold text-emerald-600">₹{(currentUser?.walletBalance || 0).toLocaleString()}</span></p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('amount')} (₹)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('withdrawMethod')}</label>
              <Select value={withdrawMethod} onValueChange={(v: 'upi' | 'bank') => setWithdrawMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">{t('upi')}</SelectItem>
                  <SelectItem value="bank">{t('bankTransfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {withdrawMethod === 'upi' ? (
              <div>
                <label className="text-sm font-medium mb-1 block">{t('upiId')}</label>
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('bankName')}</label>
                  <Input placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('bankAccount')}</label>
                  <Input placeholder="Account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('ifscCode')}</label>
                  <Input placeholder="IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} />
                </div>
              </div>
            )}
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleWithdraw}
              disabled={actionLoading === 'withdraw'}
            >
              {actionLoading === 'withdraw' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
              {t('requestWithdraw')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={docUploadOpen} onOpenChange={setDocUploadOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-600" />
              Upload {docUploadType === 'aadhaar' ? 'Aadhaar' : docUploadType === 'license' ? 'License' : docUploadType === 'rc' ? 'RC' : 'Vehicle Photo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {docUploadType === 'aadhaar' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Aadhaar Number</label>
                <Input
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  maxLength={14}
                />
              </div>
            )}
            {docUploadType === 'rc' && (
              <div>
                <label className="text-sm font-medium mb-1 block">RC Number</label>
                <Input
                  placeholder="RC Number"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Upload Photo</label>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition-colors"
                onClick={() => handleFileUpload(docUploadType as 'aadhaar' | 'license' | 'rc' | 'vehicle')}
              >
                {(docUploadType === 'aadhaar' && aadhaarPhotoPreview) ||
                (docUploadType === 'license' && licensePhotoPreview) ||
                (docUploadType === 'rc' && rcPhotoPreview) ||
                (docUploadType === 'vehicle' && vehiclePhotoPreview) ? (
                  <div className="relative">
                    <img
                      src={
                        docUploadType === 'aadhaar' ? aadhaarPhotoPreview! :
                        docUploadType === 'license' ? licensePhotoPreview! :
                        docUploadType === 'rc' ? rcPhotoPreview! :
                        vehiclePhotoPreview!
                      }
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-2 right-2 bg-emerald-600">Ready to upload</Badge>
                  </div>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tap to take photo or choose from gallery</p>
                  </>
                )}
              </div>
            </div>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleDocUpload}
              disabled={actionLoading === 'docUpload'}
            >
              {actionLoading === 'docUpload' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
