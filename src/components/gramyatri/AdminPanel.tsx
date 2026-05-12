'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users as UsersIcon, Car, IndianRupee,
  Bell, MapPin, Phone, Star, Clock, Navigation, Shield,
  CheckCircle, XCircle, TrendingUp, Wallet, LogOut, Settings,
  Search, Ban, Eye, ChevronRight, Plus, Send, FileText,
  BarChart3, Sliders, Megaphone, UserCheck, UserX,
  ArrowUpRight, Activity, Loader2, AlertTriangle,
  CircleDollarSign, RefreshCw, Download, Zap,
  MapPinned, Pause, Play, ToggleLeft, ToggleRight,
  ExternalLink, Timer, Trophy, Snowflake, ThumbsUp, ThumbsDown,
  Mail, MessageSquare, Calendar, CheckSquare, Square,
  ChevronDown, ChevronUp, X, Globe, Route, CreditCard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  getAdminStats, getAdminUsers, approveDriver, rejectDriver,
  blockUser, unblockUser, getRides, updateRide, updateCommission,
  createOffer, getOffers, resolveDispute, broadcastNotification,
  getFareConfig, updateFareConfig, getDrivers, suspendDriver,
  getAdminWallets, adjustWallet, getAdminReports, getAdminSettings,
  updateAdminSettings, getAdminDisputes, getWalletTransactions
} from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts'

// ─── Types ──────────────────────────────────────────────

type AdminTab = 'dashboard' | 'drivers' | 'rides' | 'users' | 'wallet' | 'reports' | 'notifications' | 'settings'

interface PendingDriver {
  id: string; userId: string; name: string; phone: string;
  vehicleType: string; vehicleNumber: string; licenseNumber: string;
}

interface ApprovedDriver {
  id: string; userId: string; name: string; phone: string;
  vehicleType: string; vehicleNumber: string; licenseNumber: string;
  rating: number; totalRides: number; isOnline: boolean;
  isBlocked: boolean; isSuspended?: boolean; suspendReason?: string;
}

interface RideItem {
  id: string; pickup: string; drop: string; fare: number;
  distance: number; status: string; paymentMethod: string;
  createdAt: string; vehicleType: string; userName: string;
  driverName: string; driverPhone?: string; userPhone?: string;
}

interface UserItem {
  id: string; name: string; phone: string; role: string;
  walletBalance: number; isVerified: boolean; isOnline: boolean;
  isBlocked: boolean; totalRides: number; rating: number;
  driverStatus?: string; // PENDING, APPROVED, SUSPENDED, or undefined if not a driver
}

interface WalletItem {
  id: string; userId: string; userName: string; userPhone: string;
  role: string; balance: number; isFrozen?: boolean;
}

interface OfferItem {
  id: string; code: string; discount: number; type: string;
  active: boolean; usageCount: number; maxDiscount: number; validUntil: string;
}

interface DisputeItem {
  id: string; rideId: string; userId: string; userName: string;
  description: string; status: string; createdAt: string;
  driverName?: string; ridePickup?: string; rideDrop?: string; rideFare?: number;
}

interface SettingItem {
  key: string; value: string; description?: string;
}

interface TransactionItem {
  id: string; type: string; amount: number; description: string;
  createdAt: string; status: string;
}

interface WithdrawalRequest {
  id: string; userId: string; userName: string; amount: number;
  status: string; createdAt: string; upiId?: string;
}

interface NotificationHistoryItem {
  id: string; title: string; message: string; target: string;
  sentAt: string; status: string; deliveredCount: number; totalCount: number;
}

// ─── Helpers ────────────────────────────────────────────

const vehicleLabel = (v: string) => {
  switch (v) {
    case 'TEMPO': return 'Tempo'
    case 'AUTO': return 'Auto'
    case 'E_RICKSHAW': return 'E-Rickshaw'
    default: return v || 'Unknown'
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
    case 'SEARCHING': return 'bg-yellow-100 text-yellow-800'
    case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
    case 'ARRIVING': return 'bg-cyan-100 text-cyan-800'
    case 'IN_PROGRESS': return 'bg-emerald-100 text-emerald-800'
    case 'COMPLETED': return 'bg-gray-100 text-gray-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'SEARCHING': return 'Searching'
    case 'ACCEPTED': return 'Accepted'
    case 'ARRIVING': return 'Arriving'
    case 'IN_PROGRESS': return 'In Progress'
    case 'COMPLETED': return 'Completed'
    case 'CANCELLED': return 'Cancelled'
    case 'PENDING': return 'Pending'
    default: return status
  }
}

function generateChartData(totalRides: number, totalEarnings: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weights = [0.12, 0.10, 0.16, 0.13, 0.18, 0.17, 0.14]
  return {
    ridesPerDay: days.map((date, i) => ({ date, count: Math.round((totalRides / 4) * weights[i]) })),
    revenuePerDay: days.map((date, i) => ({ date, revenue: Math.round((totalEarnings / 4) * weights[i]) })),
  }
}

function normalizePendingDriver(d: Record<string, unknown>): PendingDriver {
  const user = (d.user as Record<string, unknown>) || {}
  return {
    id: String(d.id || ''), userId: String(d.userId || user.id || ''),
    name: String(user.name || d.name || 'Unknown'), phone: String(user.phone || d.phone || ''),
    vehicleType: String(d.vehicleType || 'TEMPO'), vehicleNumber: String(d.vehicleNumber || ''),
    licenseNumber: String(d.licenseNumber || ''),
  }
}

function normalizeApprovedDriver(d: Record<string, unknown>): ApprovedDriver {
  const user = (d.user as Record<string, unknown>) || {}
  return {
    id: String(d.id || ''), userId: String(d.userId || user.id || ''),
    name: String(user.name || d.name || 'Unknown'), phone: String(user.phone || d.phone || ''),
    vehicleType: String(d.vehicleType || 'TEMPO'), vehicleNumber: String(d.vehicleNumber || ''),
    licenseNumber: String(d.licenseNumber || ''),
    rating: Number(d.rating || 0), totalRides: Number(d.totalRides || 0),
    isOnline: !!d.isOnline, isBlocked: !!d.isBlocked,
    isSuspended: !!(d as Record<string, unknown>).isSuspended,
    suspendReason: String((d as Record<string, unknown>).suspendReason || ''),
  }
}

function normalizeRide(r: Record<string, unknown>): RideItem {
  const user = (r.user as Record<string, unknown>) || {}
  const driver = (r.driver as Record<string, unknown>) || {}
  const driverUser = (driver.user as Record<string, unknown>) || {}
  return {
    id: String(r.id || ''), pickup: String(r.pickupAddress || r.pickup || ''),
    drop: String(r.dropAddress || r.drop || ''), fare: Number(r.fare || 0),
    distance: Number(r.distance || 0), status: String(r.status || 'PENDING'),
    paymentMethod: String(r.paymentMethod || 'CASH'),
    createdAt: String(r.createdAt || new Date().toISOString()),
    vehicleType: String(driver.vehicleType || r.vehicleType || ''),
    userName: String(user.name || r.userName || 'Unknown'),
    driverName: String(driverUser.name || r.driverName || ''),
    driverPhone: String(driverUser.phone || r.driverPhone || ''),
    userPhone: String(user.phone || r.userPhone || ''),
  }
}

function normalizeUser(u: Record<string, unknown>): UserItem {
  const wallet = (u.wallet as Record<string, unknown>) || {}
  const driver = (u.driver as Record<string, unknown>) || {}
  // Determine driver status from nested driver object
  let driverStatus: string | undefined
  if (u.role === 'DRIVER' || Object.keys(driver).length > 0) {
    if (driver.isSuspended) driverStatus = 'SUSPENDED'
    else if (driver.isApproved) driverStatus = 'APPROVED'
    else driverStatus = 'PENDING'
  }
  return {
    id: String(u.id || ''), name: String(u.name || 'Unknown'),
    phone: String(u.phone || ''), role: String(u.role || 'USER'),
    walletBalance: Number(wallet.balance ?? u.walletBalance ?? 0),
    isVerified: !!u.isVerified,
    isOnline: !!(driver.isOnline ?? u.isOnline),
    isBlocked: !!u.isBlocked,
    totalRides: Number(driver.totalRides ?? u.totalRides ?? 0),
    rating: Number(driver.rating ?? u.rating ?? 0),
    driverStatus,
  }
}

function normalizeWallet(w: Record<string, unknown>): WalletItem {
  return {
    id: String(w.id || ''), userId: String(w.userId || ''),
    userName: String(w.userName || 'Unknown'), userPhone: String(w.userPhone || ''),
    role: String(w.role || 'USER'), balance: Number(w.balance || 0),
    isFrozen: !!(w as Record<string, unknown>).isFrozen,
  }
}

function normalizeOffer(o: Record<string, unknown>): OfferItem {
  return {
    id: String(o.id || ''), code: String(o.code || ''),
    discount: Number(o.discount || 0), type: String(o.type || 'PERCENTAGE'),
    active: o.active !== false && o.isActive !== false,
    usageCount: Number(o.usageCount || 0), maxDiscount: Number(o.maxDiscount || 0),
    validUntil: String(o.validUntil || o.expiresAt || ''),
  }
}

const PIE_COLORS = ['#16a34a', '#f97316', '#3b82f6', '#ef4444', '#8b5cf6']

// ─── UPI Settings Inline Component ──────────────────────

function UpiSettingsInline({ upiId, qrUrl, instructions, enabled, onSave }: {
  upiId: string; qrUrl: string; instructions: string; enabled: boolean;
  onSave: (data: { upiId: string; qrUrl: string; instructions: string; enabled: boolean }) => Promise<void>
}) {
  const [localUpiId, setLocalUpiId] = useState(upiId)
  const [localQrUrl, setLocalQrUrl] = useState(qrUrl)
  const [localInstructions, setLocalInstructions] = useState(instructions)
  const [localEnabled, setLocalEnabled] = useState(enabled)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalUpiId(upiId)
    setLocalQrUrl(qrUrl)
    setLocalInstructions(instructions)
    setLocalEnabled(enabled)
  }, [upiId, qrUrl, instructions, enabled])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Enable UPI Payment</span>
        <Switch checked={localEnabled} onCheckedChange={setLocalEnabled} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">UPI ID</label>
        <Input placeholder="e.g., titun43@upi" value={localUpiId} onChange={(e) => setLocalUpiId(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">QR Code Image URL</label>
        <Input placeholder="https://example.com/qr-code.png" value={localQrUrl} onChange={(e) => setLocalQrUrl(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Payment Instructions</label>
        <Textarea placeholder="e.g., Pay to GPay: titun43@upi" value={localInstructions} onChange={(e) => setLocalInstructions(e.target.value)} rows={2} />
      </div>
      {localQrUrl && (
        <div className="p-2 bg-muted/50 rounded-lg text-center">
          <img src={localQrUrl} alt="Payment QR Code" className="max-h-32 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <p className="text-[10px] text-muted-foreground mt-1">QR Code Preview</p>
        </div>
      )}
      <Button
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        disabled={saving}
        onClick={async () => {
          setSaving(true)
          try {
            await onSave({ upiId: localUpiId, qrUrl: localQrUrl, instructions: localInstructions, enabled: localEnabled })
            toast.success('Payment settings saved!')
          } catch {
            toast.error('Failed to save payment settings')
          }
          finally { setSaving(false) }
        }}
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  )
}

// ─── Ride Map SVG Component ─────────────────────────────

function RideMapSVG({ ride }: { ride: RideItem }) {
  const [animPos, setAnimPos] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (ride.status === 'IN_PROGRESS' || ride.status === 'ACCEPTED') {
      intervalRef.current = setInterval(() => {
        setAnimPos(prev => (prev >= 100 ? 0 : prev + 2))
      }, 100)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [ride.status])

  const pickupX = 60
  const pickupY = 160
  const dropX = 340
  const dropY = 60
  const driverX = pickupX + (dropX - pickupX) * (animPos / 100)
  const driverY = pickupY + (dropY - pickupY) * (animPos / 100) - Math.sin(animPos / 100 * Math.PI) * 30

  return (
    <svg viewBox="0 0 400 220" className="w-full h-44 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
      {/* Road grid */}
      <line x1="0" y1="110" x2="400" y2="110" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1="200" y1="0" x2="200" y2="220" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />

      {/* Route line */}
      <path d={`M ${pickupX} ${pickupY} Q 200 ${pickupY - 50} ${dropX} ${dropY}`} fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.7" />

      {/* Pickup marker */}
      <circle cx={pickupX} cy={pickupY} r="10" fill="#16a34a" opacity="0.2">
        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={pickupX} cy={pickupY} r="6" fill="#16a34a" />
      <text x={pickupX} y={pickupY + 22} textAnchor="middle" fontSize="9" fill="#16a34a" fontWeight="bold">Pickup</text>

      {/* Drop marker */}
      <circle cx={dropX} cy={dropY} r="10" fill="#ef4444" opacity="0.2">
        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={dropX} cy={dropY} r="6" fill="#ef4444" />
      <text x={dropX} y={dropY - 14} textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="bold">Drop</text>

      {/* Driver position (animated) */}
      {(ride.status === 'IN_PROGRESS' || ride.status === 'ACCEPTED') && (
        <>
          <circle cx={driverX} cy={driverY} r="8" fill="#3b82f6" opacity="0.2">
            <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={driverX} cy={driverY} r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
          <text x={driverX} y={driverY - 12} textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="bold">Driver</text>
        </>
      )}

      {/* Route info */}
      <text x="200" y="210" textAnchor="middle" fontSize="9" fill="#6b7280">{ride.pickup} → {ride.drop}</text>
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function AdminPanel() {
  const { currentUser, logout } = useAppStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [loadingRides, setLoadingRides] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [loadingDisputes, setLoadingDisputes] = useState(false)

  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0, totalDrivers: 0, totalRides: 0, totalEarnings: 0,
    activeRides: 0, pendingApprovals: 0,
    recentRides: [] as RideItem[],
    ridesPerDay: [] as { date: string; count: number }[],
    revenuePerDay: [] as { date: string; revenue: number }[],
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Drivers state
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([])
  const [approvedDrivers, setApprovedDrivers] = useState<ApprovedDriver[]>([])
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showSuspendDialog, setShowSuspendDialog] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [driverSubTab, setDriverSubTab] = useState<'pending' | 'approved' | 'suspended'>('pending')
  const [selectedDriverDetail, setSelectedDriverDetail] = useState<ApprovedDriver | null>(null)
  const [selectedPendingDetail, setSelectedPendingDetail] = useState<PendingDriver | null>(null)
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set())

  // Users state
  const [users, setUsers] = useState<UserItem[]>([])
  const [userSearch, setUserSearch] = useState('')

  // Rides state
  const [allRides, setAllRides] = useState<RideItem[]>([])
  const [rideFilter, setRideFilter] = useState<string>('ALL')
  const [selectedRide, setSelectedRide] = useState<RideItem | null>(null)

  // Wallet state
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [walletSearch, setWalletSearch] = useState('')
  const [showAdjustDialog, setShowAdjustDialog] = useState<WalletItem | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [selectedWalletTransactions, setSelectedWalletTransactions] = useState<TransactionItem[]>([])
  const [showTransactionHistory, setShowTransactionHistory] = useState<WalletItem | null>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [frozenWallets, setFrozenWallets] = useState<Set<string>>(new Set())
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])

  // Finance state
  const [commission, setCommission] = useState(15)
  const [fareConfig, setFareConfig] = useState({
    tempoBaseFare: 15, tempoPerKm: 8, autoBaseFare: 20, autoPerKm: 12,
    eRickshawBaseFare: 10, eRickshawPerKm: 6,
  })
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [showCreateOffer, setShowCreateOffer] = useState(false)
  const [newOffer, setNewOffer] = useState({ code: '', discount: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT', maxDiscount: '', validUntil: '' })

  // Reports state
  const [reportType, setReportType] = useState<'rides' | 'revenue' | 'drivers' | 'users'>('rides')
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)

  // Notifications state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifTarget, setNotifTarget] = useState<'ALL' | 'USER' | 'DRIVER'>('ALL')
  const [recentNotifs, setRecentNotifs] = useState<NotificationHistoryItem[]>([])
  const [notifTemplate, setNotifTemplate] = useState('')
  const [scheduledNotifs, setScheduledNotifs] = useState<Array<{ id: string; title: string; message: string; target: string; scheduledFor: string }>>([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [notifSubTab, setNotifSubTab] = useState<'compose' | 'history' | 'templates' | 'scheduled'>('compose')

  // Disputes state
  const [disputes, setDisputes] = useState<DisputeItem[]>([])
  const [resolutionText, setResolutionText] = useState('')
  const [resolveDisputeId, setResolveDisputeId] = useState<string | null>(null)

  // Settings state
  const [appSettings, setAppSettings] = useState<SettingItem[]>([])
  const [editingSetting, setEditingSetting] = useState<SettingItem | null>(null)

  // ─── Notification Templates ─────────────────────────

  const NOTIF_TEMPLATES = [
    { id: 'ride_promo', label: 'Ride Promotion', title: 'Special Offer!', message: 'Get {discount}% off on your next ride with GramYatri! Use code {code}. Valid till {date}.' },
    { id: 'new_feature', label: 'New Feature', title: 'New Feature Alert!', message: 'We have added {feature} to GramYatri. Update your app to try it now!' },
    { id: 'safety', label: 'Safety Update', title: 'Your Safety Matters', message: 'We have enhanced our safety features. Share your ride with loved ones for real-time tracking.' },
    { id: 'driver_recruit', label: 'Driver Recruitment', title: 'Drive with GramYatri', message: 'Earn up to ₹{amount}/month driving with GramYatri. Flexible hours, instant payments. Register now!' },
    { id: 'maintenance', label: 'Maintenance Notice', title: 'Scheduled Maintenance', message: 'GramYatri will be temporarily unavailable on {date} from {time} for maintenance. We apologize for the inconvenience.' },
    { id: 'festive', label: 'Festive Greeting', title: 'Happy {festival}!', message: 'Wishing you a joyful {festival}! Enjoy special fares on all rides this festive season.' },
  ]

  // ─── Data Loading ────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true)
    try {
      const [statsRes, ridesRes] = await Promise.all([getAdminStats(), getRides({})])
      if (statsRes.success && statsRes.stats) {
        const s = statsRes.stats
        const chartData = generateChartData(s.totalRides, s.totalEarnings)
        setDashboardData(prev => ({
          ...prev, totalUsers: s.totalUsers, totalDrivers: s.totalDrivers,
          totalRides: s.totalRides, totalEarnings: s.totalEarnings,
          activeRides: s.activeRides, pendingApprovals: s.pendingApprovals,
          ridesPerDay: chartData.ridesPerDay, revenuePerDay: chartData.revenuePerDay,
        }))
      }
      if (ridesRes.success && ridesRes.rides) {
        const normalized = ridesRes.rides.map(normalizeRide)
        const sorted = normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setDashboardData(prev => ({ ...prev, recentRides: sorted.slice(0, 5) }))
      }
      setLastUpdated(new Date())
    } catch (err) { console.error('Failed to load dashboard:', err) }
    finally { setLoadingDashboard(false) }
  }, [])

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true)
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        getDrivers({ isApproved: 'false' }), getDrivers({ isApproved: 'true' }),
      ])
      if (pendingRes.success && pendingRes.drivers) setPendingDrivers(pendingRes.drivers.map(normalizePendingDriver))
      if (approvedRes.success && approvedRes.drivers) setApprovedDrivers(approvedRes.drivers.map(normalizeApprovedDriver))
    } catch (err) { console.error('Failed to load drivers:', err) }
    finally { setLoadingDrivers(false) }
  }, [])

  const loadRides = useCallback(async () => {
    setLoadingRides(true)
    try {
      const res = await getRides({})
      if (res.success && res.rides) {
        setAllRides(res.rides.map(normalizeRide).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      }
    } catch (err) { console.error('Failed to load rides:', err) }
    finally { setLoadingRides(false) }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await getAdminUsers()
      if (res.success && res.users) setUsers(res.users.map(normalizeUser))
    } catch (err) { console.error('Failed to load users:', err) }
    finally { setLoadingUsers(false) }
  }, [])

  const loadWallets = useCallback(async () => {
    setLoadingWallets(true)
    try {
      const res = await getAdminWallets()
      if (res.success && res.wallets) setWallets(res.wallets.map(normalizeWallet))
    } catch (err) { console.error('Failed to load wallets:', err) }
    finally { setLoadingWallets(false) }
  }, [])

  const loadOffers = useCallback(async () => {
    setLoadingOffers(true)
    try {
      const res = await getOffers()
      if (res.success && res.offers) setOffers(res.offers.map(normalizeOffer))
    } catch (err) { console.error('Failed to load offers:', err) }
    finally { setLoadingOffers(false) }
  }, [])

  const loadReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const res = await getAdminReports(reportType, reportPeriod)
      if (res.success && res.report) setReportData(res.report)
    } catch (err) { console.error('Failed to load reports:', err) }
    finally { setLoadingReports(false) }
  }, [reportType, reportPeriod])

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const res = await getAdminSettings()
      if (res.success && res.settings) {
        const arr = Array.isArray(res.settings) ? res.settings : Object.entries(res.settings).map(([key, value]) => ({ key, value: String(value) }))
        setAppSettings(arr as SettingItem[])
      }
    } catch (err) { console.error('Failed to load settings:', err) }
    finally { setLoadingSettings(false) }
  }, [])

  const loadDisputes = useCallback(async () => {
    setLoadingDisputes(true)
    try {
      const res = await getAdminDisputes()
      if (res.success && res.disputes) {
        setDisputes(res.disputes.map((d: Record<string, unknown>) => ({
          id: String(d.id || ''), rideId: String(d.rideId || ''),
          userId: String(d.userId || ''), userName: String(d.userName || 'Unknown'),
          description: String(d.reason || d.description || ''), status: String(d.status || 'OPEN'),
          createdAt: String(d.createdAt || new Date().toISOString()),
          driverName: String(d.driverName || ''), ridePickup: String(d.ridePickup || ''),
          rideDrop: String(d.rideDrop || ''), rideFare: Number(d.rideFare || 0),
        })))
      }
    } catch (err) { console.error('Failed to load disputes:', err); setDisputes([]) }
    finally { setLoadingDisputes(false) }
  }, [])

  const loadFinanceData = useCallback(async () => {
    try {
      const config = await getFareConfig()
      if (config) {
        setFareConfig({
          tempoBaseFare: parseInt(config.tempoBaseFare) || 15, tempoPerKm: parseInt(config.tempoPerKm) || 8,
          autoBaseFare: parseInt(config.autoBaseFare) || 20, autoPerKm: parseInt(config.autoPerKm) || 12,
          eRickshawBaseFare: parseInt(config.eRickshawBaseFare) || 10, eRickshawPerKm: parseInt(config.eRickshawPerKm) || 6,
        })
        if (config.commission) setCommission(parseInt(config.commission) || 15)
      }
    } catch (err) { console.error('Failed to load finance data:', err) }
  }, [])

  // ─── useEffect for data loading ─────────────────────

  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (activeTab === 'drivers') loadDrivers()
    else if (activeTab === 'rides') loadRides()
    else if (activeTab === 'users') loadUsers()
    else if (activeTab === 'wallet') { loadWallets(); loadMockWithdrawals() }
    else if (activeTab === 'reports') loadReports()
    else if (activeTab === 'notifications') { loadUsers(); loadDisputes() }
    else if (activeTab === 'settings') { loadSettings(); loadFinanceData(); loadOffers() }
  }, [activeTab, loadDrivers, loadRides, loadWallets, loadReports, loadUsers, loadDisputes, loadSettings, loadFinanceData, loadOffers])

  useEffect(() => { if (activeTab === 'reports' && reportType && reportPeriod) loadReports() }, [reportType, reportPeriod, loadReports, activeTab])

  // ─── Mock Withdrawal Data ──────────────────────────

  const loadMockWithdrawals = useCallback(() => {
    setWithdrawals([
      { id: 'w1', userId: 'u1', userName: 'Raju Sharma', amount: 500, status: 'PENDING', createdAt: new Date().toISOString(), upiId: 'raju@upi' },
      { id: 'w2', userId: 'u2', userName: 'Anil Das', amount: 1200, status: 'PENDING', createdAt: new Date(Date.now() - 86400000).toISOString(), upiId: 'anil@upi' },
      { id: 'w3', userId: 'u3', userName: 'Mohan Borah', amount: 800, status: 'APPROVED', createdAt: new Date(Date.now() - 172800000).toISOString(), upiId: 'mohan@upi' },
    ])
  }, [])

  // ─── Handlers ────────────────────────────────────────

  const handleApproveDriver = async (driverId: string) => {
    try {
      await approveDriver(driverId)
      const driver = pendingDrivers.find(d => d.id === driverId)
      setPendingDrivers(prev => prev.filter(d => d.id !== driverId))
      if (driver) setApprovedDrivers(prev => [...prev, {
        id: driver.id, userId: driver.userId, name: driver.name, phone: driver.phone,
        vehicleType: driver.vehicleType || 'TEMPO', vehicleNumber: driver.vehicleNumber || '',
        licenseNumber: driver.licenseNumber || '', rating: 0, totalRides: 0, isOnline: false, isBlocked: false,
      }])
    } catch (err) { console.error('Failed to approve driver:', err) }
  }

  const handleBulkApprove = async () => {
    for (const id of selectedDriverIds) {
      await handleApproveDriver(id)
    }
    setSelectedDriverIds(new Set())
  }

  const handleRejectDriver = async (driverId: string) => {
    try { await rejectDriver(driverId, rejectReason); setPendingDrivers(prev => prev.filter(d => d.id !== driverId)) }
    catch (err) { console.error('Failed to reject driver:', err) }
    setShowRejectDialog(null); setRejectReason('')
  }

  const handleSuspendDriver = async (driverId: string) => {
    try {
      await suspendDriver(driverId, true, suspendReason)
      setApprovedDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isSuspended: true, suspendReason } : d))
    } catch (err) { console.error('Failed to suspend driver:', err) }
    setShowSuspendDialog(null); setSuspendReason('')
  }

  const handleUnsuspendDriver = async (driverId: string) => {
    try {
      await suspendDriver(driverId, false)
      setApprovedDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isSuspended: false, suspendReason: '' } : d))
    } catch (err) { console.error('Failed to unsuspend driver:', err) }
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      if (isBlocked) await unblockUser(userId); else await blockUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !isBlocked } : u))
    } catch (err) { console.error('Failed to update user block status:', err) }
  }

  const handleAdjustWallet = async () => {
    if (!showAdjustDialog || !adjustAmount || !adjustDesc) return
    try {
      const res = await adjustWallet(showAdjustDialog.id, { amount: parseFloat(adjustAmount), type: adjustType, description: adjustDesc })
      if (res.success) {
        setWallets(prev => prev.map(w => w.id === showAdjustDialog.id ? { ...w, balance: res.wallet.balance } : w))
      }
    } catch (err) { console.error('Failed to adjust wallet:', err) }
    setShowAdjustDialog(null); setAdjustAmount(''); setAdjustDesc('')
  }

  const handleCreateOffer = async () => {
    const offerData = { code: newOffer.code, discount: parseInt(newOffer.discount) || 0, type: newOffer.type, maxDiscount: parseInt(newOffer.maxDiscount) || 0, validUntil: newOffer.validUntil }
    try {
      const res = await createOffer(offerData)
      if (res.success && res.offer) setOffers(prev => [...prev, normalizeOffer(res.offer)])
    } catch (err) { console.error('Failed to create offer:', err) }
    setShowCreateOffer(false); setNewOffer({ code: '', discount: '', type: 'PERCENTAGE', maxDiscount: '', validUntil: '' })
  }

  const handleUpdateCommission = async () => {
    try { await updateCommission(commission) } catch (err) { console.error('Failed to update commission:', err) }
  }

  const handleUpdateFareConfig = async () => {
    try {
      await updateFareConfig({
        tempoBaseFare: String(fareConfig.tempoBaseFare), tempoPerKm: String(fareConfig.tempoPerKm),
        autoBaseFare: String(fareConfig.autoBaseFare), autoPerKm: String(fareConfig.autoPerKm),
        eRickshawBaseFare: String(fareConfig.eRickshawBaseFare), eRickshawPerKm: String(fareConfig.eRickshawPerKm),
      })
    } catch (err) { console.error('Failed to update fare config:', err) }
  }

  const handleBroadcast = async () => {
    if (!notifTitle || !notifMessage) return
    try {
      await broadcastNotification({ title: notifTitle, message: notifMessage, targetRole: notifTarget })
      const targetCount = notifTarget === 'ALL' ? dashboardData.totalUsers + dashboardData.totalDrivers : notifTarget === 'USER' ? dashboardData.totalUsers : dashboardData.totalDrivers
      setRecentNotifs(prev => [{ id: `n-${Date.now()}`, title: notifTitle, message: notifMessage, target: notifTarget === 'ALL' ? 'All' : notifTarget === 'USER' ? 'Users' : 'Drivers', sentAt: new Date().toLocaleString(), status: 'Delivered', deliveredCount: targetCount, totalCount: targetCount }, ...prev])
      setNotifTitle(''); setNotifMessage('')
    } catch (err) { console.error('Failed to broadcast notification:', err) }
  }

  const handleScheduleNotification = () => {
    if (!notifTitle || !notifMessage || !scheduleDate) return
    setScheduledNotifs(prev => [...prev, { id: `sn-${Date.now()}`, title: notifTitle, message: notifMessage, target: notifTarget, scheduledFor: scheduleDate }])
    setNotifTitle(''); setNotifMessage(''); setScheduleDate('')
  }

  const handleResolveDispute = async (disputeId: string) => {
    try { await resolveDispute(disputeId, resolutionText); setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d)) }
    catch (err) { console.error('Failed to resolve dispute:', err) }
    setResolveDisputeId(null); setResolutionText('')
  }

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await updateAdminSettings([{ key, value }])
      if (res.success) {
        await loadSettings()
        setEditingSetting(null)
        toast.success('Setting updated')
      } else {
        toast.error('Failed to update setting')
      }
    } catch (err) {
      console.error('Failed to update setting:', err)
      toast.error('Failed to update setting')
    }
  }

  const handleLoadTransactions = async (wallet: WalletItem) => {
    setShowTransactionHistory(wallet)
    setLoadingTransactions(true)
    try {
      const res = await getWalletTransactions(wallet.userId)
      if (res.success && res.transactions) {
        setSelectedWalletTransactions(res.transactions.map((t: Record<string, unknown>) => ({
          id: String(t.id || ''), type: String(t.type || 'CREDIT'),
          amount: Number(t.amount || 0), description: String(t.description || ''),
          createdAt: String(t.createdAt || new Date().toISOString()),
          status: String(t.status || 'COMPLETED'),
        })))
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
      setSelectedWalletTransactions([])
    }
    setLoadingTransactions(false)
  }

  const handleFreezeWallet = (walletId: string) => {
    setFrozenWallets(prev => {
      const next = new Set(prev)
      if (next.has(walletId)) next.delete(walletId)
      else next.add(walletId)
      return next
    })
  }

  const handleWithdrawalAction = (withdrawalId: string, action: 'APPROVED' | 'REJECTED') => {
    setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: action } : w))
  }

  const handleDownloadCSV = () => {
    if (!reportData) return
    const rows: string[][] = []
    if (reportType === 'rides') {
      rows.push(['Metric', 'Value'])
      rows.push(['Total Rides', String(reportData.totalRides || 0)])
      rows.push(['Completed', String(reportData.completedRides || 0)])
      rows.push(['Cancelled', String(reportData.cancelledRides || 0)])
      rows.push(['Avg Fare', String(reportData.avgFare || 0)])
    } else if (reportType === 'revenue') {
      rows.push(['Metric', 'Value'])
      rows.push(['Total Revenue', String(reportData.totalRevenue || 0)])
      rows.push(['Commission', String(reportData.commissionEarned || 0)])
      rows.push(['Driver Earnings', String(reportData.driverEarnings || 0)])
    } else if (reportType === 'drivers') {
      rows.push(['Metric', 'Value'])
      rows.push(['Total Drivers', String(reportData.totalDrivers || 0)])
      rows.push(['Online', String(reportData.onlineDrivers || 0)])
      rows.push(['Pending', String(reportData.pendingDrivers || 0)])
    } else {
      rows.push(['Metric', 'Value'])
      rows.push(['Total Users', String(reportData.totalUsers || 0)])
      rows.push(['Verified', String(reportData.verifiedUsers || 0)])
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `gramyatri-report-${reportType}-${reportPeriod}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDriverIds(prev => {
      const next = new Set(prev)
      if (next.has(driverId)) next.delete(driverId)
      else next.add(driverId)
      return next
    })
  }

  // ─── Filtered data ───────────────────────────────────

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch))
  const filteredWallets = wallets.filter(w => w.userName.toLowerCase().includes(walletSearch.toLowerCase()) || w.userPhone.includes(walletSearch))
  const filteredRides = rideFilter === 'ALL' ? allRides : allRides.filter(r => r.status === rideFilter)
  const suspendedDrivers = approvedDrivers.filter(d => d.isSuspended)
  const activeApprovedDrivers = approvedDrivers.filter(d => !d.isSuspended)

  // ─── Computed data for charts ──────────────────────

  const rideDistByVehicle = allRides.reduce((acc, r) => {
    const vt = r.vehicleType || 'UNKNOWN'
    acc[vt] = (acc[vt] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const rideDistData = Object.entries(rideDistByVehicle).map(([name, value]) => ({ name: vehicleLabel(name), value }))

  const revenueBreakdown = {
    today: Math.round(dashboardData.totalEarnings * 0.08),
    weekly: Math.round(dashboardData.totalEarnings * 0.35),
    monthly: Math.round(dashboardData.totalEarnings * 0.75),
    total: dashboardData.totalEarnings,
  }

  // Peak hours analysis
  const peakHoursData = [
    { hour: '6AM', rides: 8 }, { hour: '7AM', rides: 15 }, { hour: '8AM', rides: 22 },
    { hour: '9AM', rides: 18 }, { hour: '10AM', rides: 12 }, { hour: '11AM', rides: 10 },
    { hour: '12PM', rides: 14 }, { hour: '1PM', rides: 11 }, { hour: '2PM', rides: 9 },
    { hour: '3PM', rides: 10 }, { hour: '4PM', rides: 13 }, { hour: '5PM', rides: 19 },
    { hour: '6PM', rides: 24 }, { hour: '7PM', rides: 20 }, { hour: '8PM', rides: 16 },
    { hour: '9PM', rides: 12 }, { hour: '10PM', rides: 7 },
  ]

  // Revenue by route
  const revenueByRoute = [
    { route: 'Lanka→Hojai', revenue: 2400 }, { route: 'Hojai→Nagaon', revenue: 3200 },
    { route: 'Nagaon→Guwahati', revenue: 4800 }, { route: 'Lanka→Nagaon', revenue: 1800 },
    { route: 'Hojai→Diphu', revenue: 1500 },
  ]

  // User growth chart data
  const userGrowthData = [
    { month: 'Jan', users: 12 }, { month: 'Feb', users: 18 }, { month: 'Mar', users: 25 },
    { month: 'Apr', users: 34 }, { month: 'May', users: 42 }, { month: 'Jun', users: 55 },
  ]

  // Wallet balance distribution
  const walletDistData = [
    { range: '₹0-100', count: wallets.filter(w => w.balance >= 0 && w.balance <= 100).length },
    { range: '₹101-500', count: wallets.filter(w => w.balance > 100 && w.balance <= 500).length },
    { range: '₹501-1000', count: wallets.filter(w => w.balance > 500 && w.balance <= 1000).length },
    { range: '₹1000+', count: wallets.filter(w => w.balance > 1000).length },
  ].filter(d => d.count > 0)

  // Driver performance leaderboard
  const driverLeaderboard = [...approvedDrivers].sort((a, b) => b.rating - a.rating).slice(0, 5)

  // ─── Tab definitions ─────────────────────────────────

  const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'drivers', label: 'Drivers', icon: Car },
    { key: 'rides', label: 'Rides', icon: Navigation },
    { key: 'users', label: 'Users', icon: UsersIcon },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'notifications', label: 'Alerts', icon: Bell },
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  // ─── Document verification mock ─────────────────────

  const getDocStatus = (driverId: string) => {
    // Deterministic pseudo-random based on driverId
    const hash = driverId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return {
      aadhaar: hash % 3 !== 0,
      license: hash % 5 !== 0,
      rc: hash % 2 === 0,
    }
  }

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Admin Header */}
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-bold text-lg">GramYatri Admin</span>
          <Badge className="bg-white/20 text-white text-[10px] ml-1">Panel</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8" onClick={() => loadDashboard()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-white/20 text-white text-xs font-bold">{(currentUser?.name || 'A')[0]}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{currentUser?.name || 'Admin'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ═══════════════════ ENHANCED DASHBOARD TAB ═══════════════════ */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              {loadingDashboard ? (
                <Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /><p className="text-sm text-muted-foreground">Loading dashboard...</p></CardContent></Card>
              ) : (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: UsersIcon, label: 'Total Users', value: dashboardData.totalUsers, color: 'emerald', sub: 'Registered' },
                      { icon: Car, label: 'Total Drivers', value: dashboardData.totalDrivers, color: 'orange', sub: `${dashboardData.pendingApprovals} pending` },
                      { icon: Activity, label: 'Active Rides', value: dashboardData.activeRides, color: 'blue', sub: 'Live' },
                      { icon: IndianRupee, label: 'Revenue', value: `₹${(dashboardData.totalEarnings / 1000).toFixed(1)}K`, color: 'emerald', sub: `${dashboardData.totalRides} rides` },
                    ].map((stat, i) => (
                      <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                          </div>
                          <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            {stat.label === 'Active Rides' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                            <span>{stat.sub}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Revenue Breakdown Card */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4 text-emerald-600" />Revenue Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Today</p>
                          <p className="text-sm font-bold text-emerald-600">₹{revenueBreakdown.today}</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Week</p>
                          <p className="text-sm font-bold text-emerald-600">₹{revenueBreakdown.weekly}</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Month</p>
                          <p className="text-sm font-bold text-emerald-600">₹{revenueBreakdown.monthly}</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Total</p>
                          <p className="text-sm font-bold text-emerald-600">₹{revenueBreakdown.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Quick Actions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1 text-xs" onClick={() => { setActiveTab('drivers'); setDriverSubTab('pending') }}>
                          <UserCheck className="h-4 w-4 text-orange-500" />
                          <span>Approve Pending</span>
                          {dashboardData.pendingApprovals > 0 && <Badge className="bg-orange-100 text-orange-700 text-[9px]">{dashboardData.pendingApprovals}</Badge>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1 text-xs" onClick={() => { setActiveTab('rides'); setRideFilter('IN_PROGRESS') }}>
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span>Active Rides</span>
                          {dashboardData.activeRides > 0 && <Badge className="bg-blue-100 text-blue-700 text-[9px]">{dashboardData.activeRides}</Badge>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1 text-xs" onClick={() => { setActiveTab('notifications'); setNotifSubTab('compose') }}>
                          <Megaphone className="h-4 w-4 text-emerald-500" />
                          <span>Send Alert</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rides Per Day */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" />Rides Per Day</CardTitle></CardHeader>
                    <CardContent><div className="h-44">{dashboardData.ridesPerDay.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={dashboardData.ridesPerDay}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" fontSize={10} tickLine={false} /><YAxis fontSize={10} tickLine={false} /><Tooltip formatter={(value: number) => [`${value} rides`, 'Rides']} /><Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-sm text-muted-foreground">No ride data</div>)}</div></CardContent>
                  </Card>

                  {/* Revenue Trend */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" />Revenue Trend</CardTitle></CardHeader>
                    <CardContent><div className="h-44">{dashboardData.revenuePerDay.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboardData.revenuePerDay}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="date" fontSize={10} tickLine={false} /><YAxis fontSize={10} tickLine={false} /><Tooltip formatter={(value: number) => [`₹${value}`, 'Revenue']} /><defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" /></AreaChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-sm text-muted-foreground">No revenue data</div>)}</div></CardContent>
                  </Card>

                  {/* Pie Chart - Ride Distribution by Vehicle Type */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4 text-orange-500" />Rides by Vehicle Type</CardTitle></CardHeader>
                    <CardContent><div className="h-52">{rideDistData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rideDistData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{rideDistData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-sm text-muted-foreground">No vehicle data</div>)}</div></CardContent>
                  </Card>

                  {/* Recent Rides */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Recent Rides</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {dashboardData.recentRides.length === 0 ? (<div className="text-center py-6 text-sm text-muted-foreground">No rides yet</div>) : (
                          dashboardData.recentRides.map((ride) => (
                            <div key={ride.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2"><span className="text-sm font-medium truncate">{ride.userName}</span><ChevronRight className="h-3 w-3 text-muted-foreground" /><span className="text-sm text-muted-foreground truncate">{ride.driverName || 'Unassigned'}</span></div>
                                <div className="text-xs text-muted-foreground mt-0.5">{ride.pickup} → {ride.drop}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0"><span className="text-sm font-bold">₹{ride.fare}</span><Badge className={`text-[10px] ${statusColor(ride.status)}`}>{statusLabel(ride.status)}</Badge></div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Last Updated Timestamp */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => loadDashboard()}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ ENHANCED DRIVERS TAB ═══════════════════ */}
          {activeTab === 'drivers' && (
            <motion.div key="drivers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'pending' as const, label: 'Pending', icon: Clock, count: pendingDrivers.length, color: 'orange' },
                  { key: 'approved' as const, label: 'Approved', icon: UserCheck, count: activeApprovedDrivers.length, color: 'emerald' },
                  { key: 'suspended' as const, label: 'Suspended', icon: Ban, count: suspendedDrivers.length, color: 'red' },
                ].map(tab => (
                  <Button key={tab.key} variant={driverSubTab === tab.key ? 'default' : 'outline'} size="sm"
                    className={driverSubTab === tab.key ? `bg-${tab.color}-600 hover:bg-${tab.color}-700 text-white` : ''} onClick={() => setDriverSubTab(tab.key)}>
                    <tab.icon className="h-3 w-3 mr-1" />{tab.label} ({tab.count})
                  </Button>
                ))}
              </div>

              {loadingDrivers ? (<Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /></CardContent></Card>) : (
                <>
                  {/* Pending Drivers with Bulk Actions */}
                  {driverSubTab === 'pending' && (
                    <div className="space-y-3">
                      {selectedDriverIds.size > 0 && (
                        <Card className="border-0 shadow-md bg-orange-50 dark:bg-orange-950/20">
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm font-medium">{selectedDriverIds.size} driver(s) selected</span>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={handleBulkApprove}>
                                <CheckCircle className="h-3 w-3 mr-1" />Bulk Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedDriverIds(new Set())}>
                                Clear
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {pendingDrivers.length === 0 ? (<Card className="border-0 shadow-md"><CardContent className="p-8 text-center"><CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No pending drivers</p></CardContent></Card>) : (
                        pendingDrivers.map((driver) => (
                          <Card key={driver.id} className="border-0 shadow-md border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedDriverIds.has(driver.id)}
                                    onCheckedChange={() => toggleDriverSelection(driver.id)}
                                  />
                                  <Avatar className="h-12 w-12 cursor-pointer" onClick={() => setSelectedPendingDetail(driver)}><AvatarFallback className="bg-orange-100 text-orange-700 font-bold">{driver.name[0]}</AvatarFallback></Avatar>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between"><h4 className="font-semibold text-sm cursor-pointer hover:text-emerald-600" onClick={() => setSelectedPendingDetail(driver)}>{driver.name}</h4><Badge className="bg-orange-100 text-orange-700 text-[10px]">Pending</Badge></div>
                                  <div className="mt-1 space-y-0.5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{driver.phone}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">{vehicleEmoji(driver.vehicleType)} {vehicleLabel(driver.vehicleType)} - {driver.vehicleNumber}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" />License: {driver.licenseNumber}</div>
                                  </div>
                                  {/* Document Verification Status */}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).aadhaar ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).aadhaar ? '✓' : '✗'}</span> Aadhaar</span>
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).license ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).license ? '✓' : '✗'}</span> License</span>
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).rc ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).rc ? '✓' : '✗'}</span> RC</span>
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={() => handleApproveDriver(driver.id)}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => { setShowRejectDialog(driver.id); setRejectReason('') }}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}

                  {/* Approved Drivers with Detail View */}
                  {driverSubTab === 'approved' && (
                    <div className="space-y-3">
                      {activeApprovedDrivers.length === 0 ? (<Card className="border-0 shadow-md"><CardContent className="p-8 text-center"><UserCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No approved drivers</p></CardContent></Card>) : (
                        activeApprovedDrivers.map((driver) => (
                          <Card key={driver.id} className="border-0 shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 cursor-pointer" onClick={() => setSelectedDriverDetail(driver)}><AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{driver.name[0]}</AvatarFallback></Avatar>
                                  {driver.isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm cursor-pointer hover:text-emerald-600" onClick={() => setSelectedDriverDetail(driver)}>{driver.name}</h4>
                                    <Badge className={driver.isOnline ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-gray-100 text-gray-700 text-[10px]'}>{driver.isOnline ? 'Online' : 'Offline'}</Badge>
                                  </div>
                                  <div className="mt-1 space-y-0.5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{driver.phone}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">{vehicleEmoji(driver.vehicleType)} {vehicleLabel(driver.vehicleType)} - {driver.vehicleNumber}</div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500" />{driver.rating.toFixed(1)}</span>
                                      <span>{driver.totalRides} rides</span>
                                    </div>
                                  </div>
                                  {/* Document Verification */}
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).aadhaar ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).aadhaar ? '✓' : '✗'}</span> Aadhaar</span>
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).license ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).license ? '✓' : '✗'}</span> License</span>
                                    <span className="flex items-center gap-1 text-[10px]"><span className={getDocStatus(driver.id).rc ? 'text-emerald-600' : 'text-red-500'}>{getDocStatus(driver.id).rc ? '✓' : '✗'}</span> RC</span>
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => blockUser(driver.userId, driver.isBlocked).then(() => setApprovedDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, isBlocked: !d.isBlocked } : d)))}>
                                      {driver.isBlocked ? <><UserCheck className="h-3 w-3 mr-1" />Unblock</> : <><Ban className="h-3 w-3 mr-1" />Block</>}
                                    </Button>
                                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => { setShowSuspendDialog(driver.id); setSuspendReason('') }}>
                                      <Pause className="h-3 w-3 mr-1" />Suspend
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.open(`tel:${driver.phone}`)}>
                                      <Phone className="h-3 w-3 mr-1" />Call
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

                  {/* Suspended Drivers */}
                  {driverSubTab === 'suspended' && (
                    <div className="space-y-3">
                      {suspendedDrivers.length === 0 ? (<Card className="border-0 shadow-md"><CardContent className="p-8 text-center"><Ban className="h-10 w-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No suspended drivers</p></CardContent></Card>) : (
                        suspendedDrivers.map((driver) => (
                          <Card key={driver.id} className="border-0 shadow-md border-l-4 border-l-red-500">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12"><AvatarFallback className="bg-red-100 text-red-700 font-bold">{driver.name[0]}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between"><h4 className="font-semibold text-sm">{driver.name}</h4><Badge className="bg-red-100 text-red-700 text-[10px]">Suspended</Badge></div>
                                  <div className="mt-1 space-y-0.5">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{driver.phone}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">{vehicleEmoji(driver.vehicleType)} {vehicleLabel(driver.vehicleType)} - {driver.vehicleNumber}</div>
                                    {driver.suspendReason && <div className="text-xs text-red-600 mt-1">Reason: {driver.suspendReason}</div>}
                                  </div>
                                  <div className="flex gap-2 mt-3">
                                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={() => handleUnsuspendDriver(driver.id)}>
                                      <Play className="h-3 w-3 mr-1" />Reactivate
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
                </>
              )}

              {/* Reject Dialog */}
              <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
                <DialogContent><DialogHeader><DialogTitle>Reject Driver</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Reason for rejection</label>
                    <Input placeholder="Enter reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setShowRejectDialog(null)}>Cancel</Button><Button variant="destructive" onClick={() => showRejectDialog && handleRejectDriver(showRejectDialog)}>Reject</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Suspend Dialog */}
              <Dialog open={!!showSuspendDialog} onOpenChange={() => setShowSuspendDialog(null)}>
                <DialogContent><DialogHeader><DialogTitle>Suspend Driver</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Reason for suspension</label>
                    <Input placeholder="Enter reason..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setShowSuspendDialog(null)}>Cancel</Button><Button variant="destructive" onClick={() => showSuspendDialog && handleSuspendDriver(showSuspendDialog)}>Suspend</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Driver Detail Dialog */}
              <Dialog open={!!selectedDriverDetail} onOpenChange={() => setSelectedDriverDetail(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Driver Details</DialogTitle></DialogHeader>
                  {selectedDriverDetail && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">{selectedDriverDetail.name[0]}</AvatarFallback></Avatar>
                        <div>
                          <h3 className="text-lg font-bold">{selectedDriverDetail.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={selectedDriverDetail.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>{selectedDriverDetail.isOnline ? 'Online' : 'Offline'}</Badge>
                            <Badge variant="outline">{vehicleLabel(selectedDriverDetail.vehicleType)}</Badge>
                          </div>
                        </div>
                      </div>
                      {/* Rating prominently */}
                      <Card className="bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="p-4 flex items-center justify-center gap-3">
                          <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                          <div>
                            <p className="text-3xl font-bold text-yellow-600">{selectedDriverDetail.rating.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">Average Rating</p>
                          </div>
                          <div className="ml-4 text-sm text-muted-foreground">{selectedDriverDetail.totalRides} total rides</div>
                        </CardContent>
                      </Card>
                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedDriverDetail.phone}</div>
                        <div className="flex items-center gap-2 text-sm">{vehicleEmoji(selectedDriverDetail.vehicleType)} {vehicleLabel(selectedDriverDetail.vehicleType)} - {selectedDriverDetail.vehicleNumber}</div>
                        <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" />License: {selectedDriverDetail.licenseNumber}</div>
                      </div>
                      {/* Documents Status */}
                      <div>
                        <p className="text-sm font-medium mb-2">Document Verification</p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Aadhaar Card', verified: getDocStatus(selectedDriverDetail.id).aadhaar },
                            { label: 'Driving License', verified: getDocStatus(selectedDriverDetail.id).license },
                            { label: 'Registration Cert (RC)', verified: getDocStatus(selectedDriverDetail.id).rc },
                          ].map(doc => (
                            <div key={doc.label} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-sm">{doc.label}</span>
                              <Badge className={doc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{doc.verified ? '✓ Verified' : '✗ Pending'}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Ride History */}
                      <div>
                        <p className="text-sm font-medium mb-2">Recent Rides</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {allRides.filter(r => r.driverName === selectedDriverDetail.name).slice(0, 5).map(r => (
                            <div key={r.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-xs">
                              <span>{r.pickup} → {r.drop}</span>
                              <div className="flex items-center gap-2"><span>₹{r.fare}</span><Badge className={`text-[9px] ${statusColor(r.status)}`}>{statusLabel(r.status)}</Badge></div>
                            </div>
                          ))}
                          {allRides.filter(r => r.driverName === selectedDriverDetail.name).length === 0 && <p className="text-xs text-muted-foreground text-center">No rides yet</p>}
                        </div>
                      </div>
                      {/* Contact Button */}
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open(`tel:${selectedDriverDetail.phone}`)}>
                        <Phone className="h-4 w-4 mr-2" />Contact Driver
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Pending Driver Detail Dialog */}
              <Dialog open={!!selectedPendingDetail} onOpenChange={() => setSelectedPendingDetail(null)}>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Pending Driver Details</DialogTitle></DialogHeader>
                  {selectedPendingDetail && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16"><AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">{selectedPendingDetail.name[0]}</AvatarFallback></Avatar>
                        <div>
                          <h3 className="text-lg font-bold">{selectedPendingDetail.name}</h3>
                          <Badge className="bg-orange-100 text-orange-700">Pending Approval</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedPendingDetail.phone}</div>
                        <div className="flex items-center gap-2 text-sm">{vehicleEmoji(selectedPendingDetail.vehicleType)} {vehicleLabel(selectedPendingDetail.vehicleType)} - {selectedPendingDetail.vehicleNumber}</div>
                        <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" />License: {selectedPendingDetail.licenseNumber}</div>
                      </div>
                      {/* Documents Status */}
                      <div>
                        <p className="text-sm font-medium mb-2">Document Verification</p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Aadhaar Card', verified: getDocStatus(selectedPendingDetail.id).aadhaar },
                            { label: 'Driving License', verified: getDocStatus(selectedPendingDetail.id).license },
                            { label: 'Registration Cert (RC)', verified: getDocStatus(selectedPendingDetail.id).rc },
                          ].map(doc => (
                            <div key={doc.label} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <span className="text-sm">{doc.label}</span>
                              <Badge className={doc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{doc.verified ? '✓ Verified' : '✗ Pending'}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { handleApproveDriver(selectedPendingDetail.id); setSelectedPendingDetail(null) }}><CheckCircle className="h-4 w-4 mr-2" />Approve</Button>
                        <Button variant="destructive" className="flex-1" onClick={() => { setShowRejectDialog(selectedPendingDetail.id); setSelectedPendingDetail(null) }}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* ═══════════════════ ENHANCED RIDES TAB ═══════════════════ */}
          {activeTab === 'rides' && (
            <motion.div key="rides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
                  <Button key={s} variant={rideFilter === s ? 'default' : 'outline'} size="sm" className={rideFilter === s ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''} onClick={() => setRideFilter(s)}>
                    {s === 'ALL' ? 'All' : statusLabel(s)} {s !== 'ALL' && `(${allRides.filter(r => r.status === s).length})`}
                  </Button>
                ))}
              </div>

              {loadingRides ? (<Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /></CardContent></Card>) : (
                <div className="space-y-3">
                  {filteredRides.length === 0 ? (<Card className="border-0 shadow-md"><CardContent className="p-8 text-center"><Navigation className="h-10 w-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No rides found</p></CardContent></Card>) : (
                    filteredRides.map((ride) => {
                      const rideDate = new Date(ride.createdAt)
                      const now = new Date()
                      const durationMs = ride.status === 'IN_PROGRESS' ? now.getTime() - rideDate.getTime() : 0
                      const durationMin = Math.floor(durationMs / 60000)
                      const etaMin = ride.status === 'IN_PROGRESS' ? Math.max(0, Math.round(ride.distance * 2.5 - durationMin)) : 0

                      return (
                        <Card key={ride.id} className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedRide(selectedRide?.id === ride.id ? null : ride)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-[10px] ${statusColor(ride.status)}`}>{statusLabel(ride.status)}</Badge>
                                  <span className="text-xs text-muted-foreground">{rideDate.toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm font-medium">{ride.pickup} → {ride.drop}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>Rider: {ride.userName}</span>
                                  {ride.driverName && <span>Driver: {ride.driverName}</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-lg font-bold">₹{ride.fare}</div>
                                <div className="text-xs text-muted-foreground">{ride.distance} km</div>
                              </div>
                            </div>

                            {selectedRide?.id === ride.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{ride.paymentMethod}</span></div>
                                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{vehicleLabel(ride.vehicleType)}</span></div>
                                  {ride.userPhone && <div><span className="text-muted-foreground">Rider Phone:</span> <span className="font-medium">{ride.userPhone}</span></div>}
                                  {ride.driverPhone && <div><span className="text-muted-foreground">Driver Phone:</span> <span className="font-medium">{ride.driverPhone}</span></div>}
                                </div>

                                {/* Enhanced Live Tracking */}
                                {(ride.status === 'IN_PROGRESS' || ride.status === 'ACCEPTED') && (
                                  <div className="mt-3 space-y-3">
                                    {/* Map Visualization */}
                                    <RideMapSVG ride={ride} />

                                    {/* Ride Stats */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center gap-2">
                                        <Timer className="h-4 w-4 text-blue-600" />
                                        <div>
                                          <p className="text-[10px] text-muted-foreground">Duration</p>
                                          <p className="text-sm font-bold text-blue-600">{durationMin > 0 ? `${durationMin} min` : 'Starting...'}</p>
                                        </div>
                                      </div>
                                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-emerald-600" />
                                        <div>
                                          <p className="text-[10px] text-muted-foreground">ETA</p>
                                          <p className="text-sm font-bold text-emerald-600">{etaMin > 0 ? `${etaMin} min` : 'Calculating...'}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Open in Google Maps */}
                                    <Button
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const query = encodeURIComponent(`${ride.drop}, Assam, India`)
                                        window.open(`https://www.google.com/maps/search/${query}`, '_blank')
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />Open in Google Maps
                                    </Button>
                                  </div>
                                )}

                                {/* Simple indicator for non-active rides */}
                                {ride.status !== 'IN_PROGRESS' && ride.status !== 'ACCEPTED' && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                                    <MapPinned className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Tracking Unavailable</p>
                                      <p className="text-xs text-muted-foreground">Ride is {statusLabel(ride.status).toLowerCase()}</p>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ USERS TAB ═══════════════════ */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" />
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><UsersIcon className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Users</span></div>
                  <div className="text-2xl font-bold text-emerald-600">{users.length}</div>
                </CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-blue-600" /><span className="text-xs text-muted-foreground">Verified</span></div>
                  <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.isVerified).length}</div>
                </CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><Ban className="h-4 w-4 text-red-600" /><span className="text-xs text-muted-foreground">Blocked</span></div>
                  <div className="text-2xl font-bold text-red-600">{users.filter(u => u.isBlocked).length}</div>
                </CardContent></Card>
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /><p className="text-sm text-muted-foreground">Loading users...</p></CardContent></Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="border-0 shadow-md"><CardContent className="p-12 text-center">
                  <UsersIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{userSearch ? 'No users match your search' : 'No users found'}</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className={`border-0 shadow-md ${u.isBlocked ? 'opacity-60 bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={u.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : u.role === 'ADMIN' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}>
                                {u.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">{u.name}</p>
                                <Badge className={`text-[10px] ${u.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : u.role === 'ADMIN' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {u.role}
                                </Badge>
                                {u.isBlocked && <Badge className="bg-red-100 text-red-700 text-[10px]"><Ban className="h-3 w-3 mr-0.5" />Blocked</Badge>}
                                {u.isVerified && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                {u.driverStatus && (
                                  <Badge className={`text-[10px] ${u.driverStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : u.driverStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    <Car className="h-3 w-3 mr-0.5" />{u.driverStatus}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{u.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₹{u.walletBalance.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              {u.totalRides > 0 && <span className="text-xs text-muted-foreground">{u.totalRides} rides</span>}
                              {u.rating > 0 && <span className="text-xs text-yellow-600">★ {u.rating.toFixed(1)}</span>}
                            </div>
                            <Button
                              size="sm"
                              variant={u.isBlocked ? 'outline' : 'destructive'}
                              className="h-7 text-xs mt-1"
                              onClick={() => handleBlockUser(u.id, u.isBlocked)}
                            >
                              {u.isBlocked ? <CheckCircle className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ ENHANCED WALLET TAB ═══════════════════ */}
          {activeTab === 'wallet' && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or phone..." value={walletSearch} onChange={(e) => setWalletSearch(e.target.value)} className="pl-9" />
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Balance</span></div>
                  <div className="text-2xl font-bold text-emerald-600">₹{wallets.reduce((s, w) => s + w.balance, 0).toLocaleString()}</div>
                </CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><UsersIcon className="h-4 w-4 text-orange-500" /><span className="text-xs text-muted-foreground">Total Wallets</span></div>
                  <div className="text-2xl font-bold text-orange-600">{wallets.length}</div>
                </CardContent></Card>
              </div>

              {/* Wallet Balance Distribution Chart */}
              {walletDistData.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" />Balance Distribution</CardTitle></CardHeader>
                  <CardContent><div className="h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={walletDistData}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="range" fontSize={9} tickLine={false} /><YAxis fontSize={9} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
                </Card>
              )}

              {/* Pending Withdrawal Requests */}
              {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                <Card className="border-0 shadow-md border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4 text-orange-500" />Pending Withdrawals</CardTitle></CardHeader>
                  <CardContent><div className="space-y-2 max-h-40 overflow-y-auto">
                    {withdrawals.filter(w => w.status === 'PENDING').map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{w.userName}</p>
                          <p className="text-xs text-muted-foreground">₹{w.amount} | UPI: {w.upiId}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-2" onClick={() => handleWithdrawalAction(w.id, 'APPROVED')}><ThumbsUp className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleWithdrawalAction(w.id, 'REJECTED')}><ThumbsDown className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div></CardContent>
                </Card>
              )}

              {loadingWallets ? (<Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /></CardContent></Card>) : (
                <div className="space-y-3">
                  {filteredWallets.map((wallet) => {
                    const isFrozen = frozenWallets.has(wallet.id)
                    return (
                      <Card key={wallet.id} className={`border-0 shadow-md ${isFrozen ? 'opacity-60 bg-red-50 dark:bg-red-950/20' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10"><AvatarFallback className={wallet.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}>{wallet.userName[0]}</AvatarFallback></Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{wallet.userName}</p>
                                  <Badge className={`text-[10px] ${wallet.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{wallet.role}</Badge>
                                  {isFrozen && <Badge className="bg-red-100 text-red-700 text-[10px]"><Snowflake className="h-3 w-3 mr-0.5" />Frozen</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{wallet.userPhone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">₹{wallet.balance.toLocaleString()}</p>
                              <div className="flex gap-1 mt-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowAdjustDialog(wallet); setAdjustAmount(''); setAdjustType('CREDIT'); setAdjustDesc('') }}>
                                  <CircleDollarSign className="h-3 w-3 mr-1" />Adjust
                                </Button>
                                <Button size="sm" variant="outline" className={`h-7 text-xs ${isFrozen ? 'text-red-600' : ''}`} onClick={() => handleFreezeWallet(wallet.id)}>
                                  <Snowflake className="h-3 w-3 mr-1" />{isFrozen ? 'Unfreeze' : 'Freeze'}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleLoadTransactions(wallet)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Adjust Wallet Dialog */}
              <Dialog open={!!showAdjustDialog} onOpenChange={() => setShowAdjustDialog(null)}>
                <DialogContent><DialogHeader><DialogTitle>Adjust Wallet - {showAdjustDialog?.userName}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="text-lg font-bold">Current Balance: ₹{showAdjustDialog?.balance.toLocaleString()}</div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <div className="flex gap-2 mt-1">
                        <Button variant={adjustType === 'CREDIT' ? 'default' : 'outline'} size="sm" className={adjustType === 'CREDIT' ? 'bg-emerald-600 text-white' : ''} onClick={() => setAdjustType('CREDIT')}>+ Add Money</Button>
                        <Button variant={adjustType === 'DEBIT' ? 'default' : 'outline'} size="sm" className={adjustType === 'DEBIT' ? 'bg-red-600 text-white' : ''} onClick={() => setAdjustType('DEBIT')}>- Deduct Money</Button>
                      </div>
                    </div>
                    <div><label className="text-sm font-medium">Amount (₹)</label><Input type="number" placeholder="Enter amount" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} /></div>
                    <div><label className="text-sm font-medium">Description</label><Input placeholder="Reason for adjustment" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} /></div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setShowAdjustDialog(null)}>Cancel</Button><Button className={adjustType === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} onClick={handleAdjustWallet}>{adjustType === 'CREDIT' ? 'Add Money' : 'Deduct Money'}</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Transaction History Dialog */}
              <Dialog open={!!showTransactionHistory} onOpenChange={() => setShowTransactionHistory(null)}>
                <DialogContent className="max-w-md max-h-[80vh]">
                  <DialogHeader><DialogTitle>Transaction History - {showTransactionHistory?.userName}</DialogTitle></DialogHeader>
                  {loadingTransactions ? (
                    <div className="py-8 text-center"><Loader2 className="h-6 w-6 text-emerald-600 mx-auto animate-spin" /></div>
                  ) : selectedWalletTransactions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No transactions found</div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedWalletTransactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {t.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <TrendingUp className="h-4 w-4 text-red-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t.description || t.type}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* ═══════════════════ ENHANCED REPORTS TAB ═══════════════════ */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap items-center">
                <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="rides">Rides</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="drivers">Drivers</SelectItem><SelectItem value="users">Users</SelectItem></SelectContent>
                </Select>
                <Select value={reportPeriod} onValueChange={(v) => setReportPeriod(v as typeof reportPeriod)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="ml-auto" onClick={handleDownloadCSV} disabled={!reportData}>
                  <Download className="h-4 w-4 mr-1" />CSV
                </Button>
              </div>

              {loadingReports ? (<Card className="border-0 shadow-md"><CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-3 animate-spin" /></CardContent></Card>) : !reportData ? (
                <Card className="border-0 shadow-md"><CardContent className="p-8 text-center"><BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Select report type and period</p></CardContent></Card>
              ) : (
                <>
                  {/* Rides Report */}
                  {reportType === 'rides' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Rides', value: (reportData.totalRides as number) || 0, color: 'emerald' },
                          { label: 'Completed', value: (reportData.completedRides as number) || 0, color: 'blue' },
                          { label: 'Cancelled', value: (reportData.cancelledRides as number) || 0, color: 'red' },
                          { label: 'Avg Fare', value: `₹${(reportData.avgFare as number) || 0}`, color: 'orange' },
                        ].map((s, i) => (
                          <Card key={i} className="border-0 shadow-md"><CardContent className="p-4">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <div className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</div>
                          </CardContent></Card>
                        ))}
                      </div>
                      {/* Peak Hours Analysis */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" />Peak Hours Analysis</CardTitle></CardHeader>
                        <CardContent><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={peakHoursData}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="hour" fontSize={8} tickLine={false} interval={1} /><YAxis fontSize={9} tickLine={false} /><Tooltip /><Bar dataKey="rides" fill="#3b82f6" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
                      </Card>
                      {(reportData.ridesByVehicleType as Record<string, number>) && (
                        <Card className="border-0 shadow-md">
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Rides by Vehicle Type</CardTitle></CardHeader>
                          <CardContent><div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={Object.entries(reportData.ridesByVehicleType as Record<string, number>).map(([name, value]) => ({ name: vehicleLabel(name), value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{Object.entries(reportData.ridesByVehicleType as Record<string, number>).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Revenue Report */}
                  {reportType === 'revenue' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Revenue', value: `₹${((reportData.totalRevenue as number) || 0).toLocaleString()}`, color: 'emerald' },
                          { label: 'Commission', value: `₹${((reportData.commissionEarned as number) || 0).toLocaleString()}`, color: 'orange' },
                          { label: 'Driver Earnings', value: `₹${((reportData.driverEarnings as number) || 0).toLocaleString()}`, color: 'blue' },
                          { label: 'Wallet Txns', value: (reportData.walletTransactions as number) || 0, color: 'slate' },
                        ].map((s, i) => (
                          <Card key={i} className="border-0 shadow-md"><CardContent className="p-4">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <div className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</div>
                          </CardContent></Card>
                        ))}
                      </div>
                      {/* Revenue by Route Chart */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Route className="h-4 w-4 text-emerald-600" />Revenue by Route</CardTitle></CardHeader>
                        <CardContent><div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueByRoute} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis type="number" fontSize={9} tickLine={false} /><YAxis type="category" dataKey="route" fontSize={9} tickLine={false} width={100} /><Tooltip formatter={(value: number) => [`₹${value}`, 'Revenue']} /><Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
                      </Card>
                    </>
                  )}

                  {/* Drivers Report */}
                  {reportType === 'drivers' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Drivers', value: (reportData.totalDrivers as number) || 0, color: 'emerald' },
                          { label: 'Online Now', value: (reportData.onlineDrivers as number) || 0, color: 'blue' },
                          { label: 'Pending', value: (reportData.pendingDrivers as number) || 0, color: 'orange' },
                          { label: 'Avg Rating', value: ((reportData.avgRating as number) || 0).toFixed(1), color: 'yellow-600' },
                        ].map((s, i) => (
                          <Card key={i} className="border-0 shadow-md"><CardContent className="p-4">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <div className={`text-2xl font-bold text-${s.color} mt-1`}>{s.value}</div>
                          </CardContent></Card>
                        ))}
                      </div>
                      {/* Driver Performance Leaderboard */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" />Driver Performance Leaderboard</CardTitle></CardHeader>
                        <CardContent><div className="space-y-2 max-h-60 overflow-y-auto">
                          {driverLeaderboard.map((d, i) => (
                            <div key={d.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{d.name}</p>
                                  <p className="text-xs text-muted-foreground">{d.totalRides} rides | {vehicleLabel(d.vehicleType)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span className="text-sm font-bold">{d.rating.toFixed(1)}</span></div>
                            </div>
                          ))}
                          {driverLeaderboard.length === 0 && <p className="text-sm text-muted-foreground text-center">No drivers yet</p>}
                        </div></CardContent>
                      </Card>
                      {(reportData.topPerformers as Array<Record<string, unknown>>) && (
                        <Card className="border-0 shadow-md">
                          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Performers</CardTitle></CardHeader>
                          <CardContent><div className="space-y-2 max-h-60 overflow-y-auto">
                            {(reportData.topPerformers as Array<Record<string, unknown>>).map((p, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2"><Badge className="bg-emerald-100 text-emerald-700 text-[10px]">#{i + 1}</Badge><span className="text-sm font-medium">{String(p.name)}</span></div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>{Number(p.rides)} rides</span><span>₹{Number(p.earnings).toLocaleString()}</span><span>⭐ {Number(p.rating).toFixed(1)}</span></div>
                              </div>
                            ))}
                          </div></CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Users Report */}
                  {reportType === 'users' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Users', value: (reportData.totalUsers as number) || 0, color: 'emerald' },
                          { label: 'Verified', value: (reportData.verifiedUsers as number) || 0, color: 'blue' },
                          { label: 'New This Period', value: (reportData.newUsersThisPeriod as number) || 0, color: 'orange' },
                          { label: 'Avg Wallet', value: `₹${((reportData.avgWalletBalance as number) || 0).toLocaleString()}`, color: 'emerald' },
                        ].map((s, i) => (
                          <Card key={i} className="border-0 shadow-md"><CardContent className="p-4">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <div className={`text-2xl font-bold text-${s.color}-600 mt-1`}>{s.value}</div>
                          </CardContent></Card>
                        ))}
                      </div>
                      {/* User Growth Chart */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />User Growth</CardTitle></CardHeader>
                        <CardContent><div className="h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={userGrowthData}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="month" fontSize={10} tickLine={false} /><YAxis fontSize={10} tickLine={false} /><Tooltip /><defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={2} fill="url(#colorUsers)" /></AreaChart></ResponsiveContainer></div></CardContent>
                      </Card>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ ENHANCED NOTIFICATIONS TAB ═══════════════════ */}
          {activeTab === 'notifications' && (
            <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">

              {/* Notification Sub-Tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'compose' as const, label: 'Compose', icon: Send },
                  { key: 'templates' as const, label: 'Templates', icon: FileText },
                  { key: 'history' as const, label: 'History', icon: Clock },
                  { key: 'scheduled' as const, label: 'Scheduled', icon: Calendar },
                ].map(tab => (
                  <Button key={tab.key} variant={notifSubTab === tab.key ? 'default' : 'outline'} size="sm"
                    className={notifSubTab === tab.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''} onClick={() => setNotifSubTab(tab.key)}>
                    <tab.icon className="h-3 w-3 mr-1" />{tab.label}
                  </Button>
                ))}
              </div>

              {/* Compose Tab */}
              {notifSubTab === 'compose' && (
                <>
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-emerald-600" />Broadcast Notification</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Select value={notifTarget} onValueChange={(v) => setNotifTarget(v as typeof notifTarget)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="ALL">All Users</SelectItem><SelectItem value="USER">Passengers Only</SelectItem><SelectItem value="DRIVER">Drivers Only</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Notification title" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} />
                      <Textarea placeholder="Notification message" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} />
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBroadcast} disabled={!notifTitle || !notifMessage}>
                          <Send className="h-4 w-4 mr-2" />Send Now
                        </Button>
                        <Button variant="outline" onClick={handleScheduleNotification} disabled={!notifTitle || !notifMessage || !scheduleDate}>
                          <Calendar className="h-4 w-4 mr-2" />Schedule
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Schedule for:</label>
                        <Input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Templates Tab */}
              {notifSubTab === 'templates' && (
                <div className="space-y-3">
                  {NOTIF_TEMPLATES.map(template => (
                    <Card key={template.id} className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setNotifTitle(template.title); setNotifMessage(template.message); setNotifSubTab('compose') }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{template.label}</h4>
                          <Badge variant="outline" className="text-[10px]">Template</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground"><span className="font-medium">Title:</span> {template.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.message}</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full">Use Template</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* History Tab */}
              {notifSubTab === 'history' && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Notification History</CardTitle></CardHeader>
                  <CardContent>
                    {recentNotifs.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">No notifications sent yet</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentNotifs.map((n) => (
                          <div key={n.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{n.title}</span>
                              <div className="flex items-center gap-2">
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700">{n.target}</Badge>
                                <Badge className={`text-[10px] ${n.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{n.status}</Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{n.message}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-muted-foreground">{n.sentAt}</span>
                              <span className="text-[10px] text-muted-foreground">Delivered: {n.deliveredCount}/{n.totalCount}</span>
                            </div>
                            {/* Delivery Stats Bar */}
                            <div className="mt-1.5">
                              <Progress value={n.totalCount > 0 ? (n.deliveredCount / n.totalCount) * 100 : 0} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Scheduled Tab */}
              {notifSubTab === 'scheduled' && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" />Scheduled Notifications</CardTitle></CardHeader>
                  <CardContent>
                    {scheduledNotifs.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">No scheduled notifications</div>
                    ) : (
                      <div className="space-y-2">
                        {scheduledNotifs.map((sn) => (
                          <div key={sn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{sn.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{sn.message}</p>
                              <p className="text-[10px] text-blue-600 mt-1">Scheduled: {new Date(sn.scheduledFor).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[10px] bg-blue-100 text-blue-700">{sn.target}</Badge>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setScheduledNotifs(prev => prev.filter(s => s.id !== sn.id))}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Disputes */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Disputes</CardTitle></CardHeader>
                <CardContent>
                  {loadingDisputes ? (<div className="py-8 text-center"><Loader2 className="h-6 w-6 text-emerald-600 mx-auto animate-spin" /></div>) : disputes.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">No open disputes</div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {disputes.map((d) => (
                        <div key={d.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{d.userName} vs {d.driverName || 'Driver'}</span>
                            <Badge className={`text-[10px] ${d.status === 'OPEN' ? 'bg-red-100 text-red-700' : d.status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                          {d.ridePickup && <p className="text-xs text-muted-foreground mt-1">Ride: {d.ridePickup} → {d.rideDrop} | ₹{d.rideFare}</p>}
                          {d.status !== 'RESOLVED' && (
                            <div className="mt-2 flex gap-2">
                              <Input placeholder="Resolution..." className="h-8 text-xs" value={resolveDisputeId === d.id ? resolutionText : ''} onChange={(e) => { setResolveDisputeId(d.id); setResolutionText(e.target.value) }} />
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs" onClick={() => handleResolveDispute(d.id)} disabled={resolveDisputeId === d.id && !resolutionText}>Resolve</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Users list */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UsersIcon className="h-4 w-4" />All Users</CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9" /></div></div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className={u.role === 'DRIVER' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}>{u.name[0]}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.phone} | Wallet: ₹{u.walletBalance}</p></div>
                        </div>
                        <Button size="sm" variant={u.isBlocked ? 'default' : 'outline'} className={`h-7 text-xs ${u.isBlocked ? 'bg-emerald-600 text-white' : ''}`} onClick={() => handleBlockUser(u.id, u.isBlocked)}>{u.isBlocked ? 'Unblock' : 'Block'}</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══════════════════ SETTINGS TAB ═══════════════════ */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 space-y-4">
              {/* Commission */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-emerald-600" />Commission Rate</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Input type="number" value={commission} onChange={(e) => setCommission(parseInt(e.target.value) || 0)} className="w-24" />
                    <span className="text-sm text-muted-foreground">% platform commission</span>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpdateCommission}><Sliders className="h-4 w-4 mr-2" />Update Commission</Button>
                </CardContent>
              </Card>

              {/* Fare Config */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><IndianRupee className="h-4 w-4 text-orange-500" />Fare Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Tempo', base: fareConfig.tempoBaseFare, perKm: fareConfig.tempoPerKm, baseKey: 'tempoBaseFare' as const, perKmKey: 'tempoPerKm' as const, emoji: '🛺' },
                    { label: 'Auto', base: fareConfig.autoBaseFare, perKm: fareConfig.autoPerKm, baseKey: 'autoBaseFare' as const, perKmKey: 'autoPerKm' as const, emoji: '🚗' },
                    { label: 'E-Rickshaw', base: fareConfig.eRickshawBaseFare, perKm: fareConfig.eRickshawPerKm, baseKey: 'eRickshawBaseFare' as const, perKmKey: 'eRickshawPerKm' as const, emoji: '🛵' },
                  ].map((v) => (
                    <div key={v.label} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="text-lg">{v.emoji}</span><span className="font-medium text-sm">{v.label}</span></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-muted-foreground">Base Fare (₹)</label><Input type="number" value={v.base} onChange={(e) => setFareConfig(prev => ({ ...prev, [v.baseKey]: parseInt(e.target.value) || 0 }))} /></div>
                        <div><label className="text-xs text-muted-foreground">Per KM (₹)</label><Input type="number" value={v.perKm} onChange={(e) => setFareConfig(prev => ({ ...prev, [v.perKmKey]: parseInt(e.target.value) || 0 }))} /></div>
                      </div>
                    </div>
                  ))}
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpdateFareConfig}><Sliders className="h-4 w-4 mr-2" />Save Fare Config</Button>
                </CardContent>
              </Card>

              {/* Service Area / Coverage */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" />Service Area / Coverage</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Set the maximum distance and areas where your GramYatri service operates.</p>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <label className="text-xs text-muted-foreground font-medium">Maximum Service Radius (km)</label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={appSettings.find(s => s.key === 'service_max_radius')?.value || '30'}
                          onChange={(e) => {
                            const val = e.target.value
                            setAppSettings(prev => {
                              const exists = prev.find(s => s.key === 'service_max_radius')
                              if (exists) return prev.map(s => s.key === 'service_max_radius' ? { ...s, value: val } : s)
                              return [...prev, { id: 'new_radius', key: 'service_max_radius', value: val, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
                            })
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">km from driver location</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Rides beyond this distance won't be offered to drivers.</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <label className="text-xs text-muted-foreground font-medium">Service Center (Your main city/town)</label>
                      <Input
                        placeholder="e.g. Nagaon, Hojai, Lanka"
                        value={appSettings.find(s => s.key === 'service_center')?.value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setAppSettings(prev => {
                            const exists = prev.find(s => s.key === 'service_center')
                            if (exists) return prev.map(s => s.key === 'service_center' ? { ...s, value: val } : s)
                            return [...prev, { id: 'new_center', key: 'service_center', value: val, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <label className="text-xs text-muted-foreground font-medium">Service Areas (comma-separated)</label>
                      <textarea
                        placeholder="e.g. Nagaon, Hojai, Lanka, Diphu, Guwahati"
                        value={appSettings.find(s => s.key === 'service_areas')?.value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setAppSettings(prev => {
                            const exists = prev.find(s => s.key === 'service_areas')
                            if (exists) return prev.map(s => s.key === 'service_areas' ? { ...s, value: val } : s)
                            return [...prev, { id: 'new_areas', key: 'service_areas', value: val, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
                          })
                        }}
                        className="w-full mt-1 p-2 border rounded-md text-sm bg-background min-h-[60px]"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Only rides within these areas will be accepted.</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <label className="text-xs text-muted-foreground font-medium">Maximum Ride Distance (km)</label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          value={appSettings.find(s => s.key === 'service_max_ride_distance')?.value || '50'}
                          onChange={(e) => {
                            const val = e.target.value
                            setAppSettings(prev => {
                              const exists = prev.find(s => s.key === 'service_max_ride_distance')
                              if (exists) return prev.map(s => s.key === 'service_max_ride_distance' ? { ...s, value: val } : s)
                              return [...prev, { id: 'new_max_ride', key: 'service_max_ride_distance', value: val, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
                            })
                          }}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">km maximum ride distance</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Rides longer than this will be rejected.</p>
                    </div>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      try {
                        const settingsToSave = [
                          { key: 'service_max_radius', value: appSettings.find(s => s.key === 'service_max_radius')?.value || '30' },
                          { key: 'service_center', value: appSettings.find(s => s.key === 'service_center')?.value || '' },
                          { key: 'service_areas', value: appSettings.find(s => s.key === 'service_areas')?.value || '' },
                          { key: 'service_max_ride_distance', value: appSettings.find(s => s.key === 'service_max_ride_distance')?.value || '50' },
                        ]
                        const res = await updateAdminSettings(settingsToSave)
                        if (res.success) {
                          toast.success('Service area settings saved!')
                        } else {
                          toast.error('Failed to save settings')
                        }
                      } catch {
                        toast.error('Error saving settings')
                      }
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />Save Service Area
                  </Button>
                </CardContent>
              </Card>

              {/* Offers */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Offers & Promos</CardTitle>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs" onClick={() => setShowCreateOffer(true)}><Plus className="h-3 w-3 mr-1" />Create</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingOffers ? (<div className="py-4 text-center"><Loader2 className="h-6 w-6 text-emerald-600 mx-auto animate-spin" /></div>) : offers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No offers yet</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {offers.map((o) => (
                        <div key={o.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                          <div><div className="flex items-center gap-2"><span className="text-sm font-medium">{o.code}</span><Badge className={`text-[10px] ${o.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{o.active ? 'Active' : 'Inactive'}</Badge></div><p className="text-xs text-muted-foreground">{o.type === 'PERCENTAGE' ? `${o.discount}% off` : `₹${o.discount} off`} | Max: ₹{o.maxDiscount}</p></div>
                          <Switch checked={o.active} onCheckedChange={() => setOffers(prev => prev.map(x => x.id === o.id ? { ...x, active: !x.active } : x))} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* UPI / QR Payment Settings */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-orange-500" />UPI / QR Payment Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const upiIdSetting = appSettings.find(s => s.key === 'upi_id')
                    const qrUrlSetting = appSettings.find(s => s.key === 'payment_qr_url')
                    const instructionsSetting = appSettings.find(s => s.key === 'payment_instructions')
                    const enabledSetting = appSettings.find(s => s.key === 'upi_payment_enabled')
                    return <UpiSettingsInline
                      upiId={upiIdSetting?.value || ''}
                      qrUrl={qrUrlSetting?.value || ''}
                      instructions={instructionsSetting?.value || ''}
                      enabled={enabledSetting?.value === 'true'}
                      onSave={async (data) => {
                        const res = await updateAdminSettings([
                          { key: 'upi_id', value: data.upiId },
                          { key: 'payment_qr_url', value: data.qrUrl },
                          { key: 'payment_instructions', value: data.instructions },
                          { key: 'upi_payment_enabled', value: data.enabled ? 'true' : 'false' },
                        ])
                        if (!res.success) {
                          throw new Error('Failed to save payment settings')
                        }
                        await loadSettings()
                      }}
                    />
                  })()}
                </CardContent>
              </Card>

              {/* App Settings */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />App Settings</CardTitle></CardHeader>
                <CardContent>
                  {loadingSettings ? (<div className="py-4 text-center"><Loader2 className="h-6 w-6 text-emerald-600 mx-auto animate-spin" /></div>) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {appSettings.map((s) => (
                        <div key={s.key} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                          <div><p className="text-sm font-medium">{s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>{s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}</div>
                          {editingSetting?.key === s.key ? (
                            <div className="flex items-center gap-2">
                              <Input className="w-24 h-7 text-xs" value={editingSetting.value} onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })} />
                              <Button size="sm" className="bg-emerald-600 text-white h-7 text-xs" onClick={() => handleUpdateSetting(s.key, editingSetting.value)}>Save</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingSetting(null)}>✕</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{s.value}</Badge><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingSetting(s)}>✏️</Button></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create Offer Dialog */}
              <Dialog open={showCreateOffer} onOpenChange={setShowCreateOffer}>
                <DialogContent><DialogHeader><DialogTitle>Create Offer</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Offer code (e.g., SUMMER20)" value={newOffer.code} onChange={(e) => setNewOffer(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} />
                    <Input type="number" placeholder="Discount value" value={newOffer.discount} onChange={(e) => setNewOffer(prev => ({ ...prev, discount: e.target.value }))} />
                    <Select value={newOffer.type} onValueChange={(v) => setNewOffer(prev => ({ ...prev, type: v as 'PERCENTAGE' | 'FLAT' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="PERCENTAGE">Percentage (%)</SelectItem><SelectItem value="FLAT">Flat (₹)</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Max discount (₹)" value={newOffer.maxDiscount} onChange={(e) => setNewOffer(prev => ({ ...prev, maxDiscount: e.target.value }))} />
                    <Input type="date" value={newOffer.validUntil} onChange={(e) => setNewOffer(prev => ({ ...prev, validUntil: e.target.value }))} />
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setShowCreateOffer(false)}>Cancel</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateOffer}>Create Offer</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-lg z-30">
        <div className="flex justify-around py-1.5 px-1">
          {tabs.slice(0, 5).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors ${activeTab === tab.key ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-gray-500'}`}>
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Extra tabs row */}
        <div className="flex justify-center gap-4 pb-1.5">
          {tabs.slice(5).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${activeTab === tab.key ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-gray-500'}`}>
              <tab.icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
