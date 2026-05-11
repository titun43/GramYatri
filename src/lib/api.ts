import type { Role, User, Ride } from './store'

const API_BASE = '/api'

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `API Error: ${res.status}`)
    }
    return await res.json()
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error)
    throw error
  }
}

// Auth
export async function sendOTP(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
  return apiCall('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export async function verifyOTP(phone: string, otp: string): Promise<{
  success: boolean
  user?: User
  isNewUser?: boolean
}> {
  const res = await apiCall<{
    success: boolean
    isNewUser?: boolean
    user?: {
      id: string
      phone: string
      name: string | null
      role: string
      isVerified: boolean
      isBlocked?: boolean
      walletBalance?: number
      vehicleType?: string
      vehicleNumber?: string
      licenseNumber?: string
      isApproved?: boolean
      isOnline?: boolean
      rating?: number
      totalRides?: number
      totalEarnings?: number
    }
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code: otp }),
  })

  // Handle isNewUser case (DB failed or user has no name)
  if (res.isNewUser) {
    return { success: true, isNewUser: true }
  }

  if (res.success && res.user) {
    const u = res.user
    // If user has no name, they need to register
    if (!u.name) {
      return { success: true, isNewUser: true }
    }
    return {
      success: true,
      user: {
        id: u.id,
        name: u.name || '',
        phone: u.phone,
        role: (u.role as Role) || 'USER',
        walletBalance: u.walletBalance || 0,
        isVerified: u.isVerified,
        isBlocked: u.isBlocked,
        vehicleType: u.vehicleType,
        vehicleNumber: u.vehicleNumber,
        rating: u.rating,
        totalRides: u.totalRides,
        totalEarnings: u.totalEarnings,
        isRegistered: u.role === 'DRIVER' ? !!u.vehicleType : true,
        isOnline: u.isOnline,
      },
    }
  }
  return { success: false }
}

export async function registerUser(data: {
  phone: string
  name: string
  role: Role
  vehicleType?: string
  vehicleNumber?: string
  licenseNumber?: string
}): Promise<User> {
  const res = await apiCall<{
    success: boolean
    user: {
      id: string
      phone: string
      name: string
      role: string
      isVerified: boolean
      walletBalance?: number
      vehicleType?: string
      vehicleNumber?: string
      isApproved?: boolean
      rating?: number
      totalRides?: number
      totalEarnings?: number
    }
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  const u = res.user
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: u.role as Role,
    walletBalance: u.walletBalance || 0,
    isVerified: u.isVerified,
    vehicleType: u.vehicleType,
    vehicleNumber: u.vehicleNumber,
    isApproved: u.isApproved,
    rating: u.rating || 0,
    totalRides: u.totalRides || 0,
    totalEarnings: u.totalEarnings || 0,
    isRegistered: u.role === 'DRIVER' ? !!u.vehicleType : true,
  }
}

// Rides
export async function createRide(data: {
  userId: string
  pickupAddress: string
  dropAddress: string
  fare: number
  distance: number
  paymentMethod: string
  vehicleType?: string
  offerCode?: string
  isShared?: boolean
  routeId?: string
}): Promise<{ success: boolean; ride: Record<string, unknown> }> {
  return apiCall('/rides', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getRides(params?: {
  userId?: string
  driverId?: string
  status?: string
}): Promise<{ success: boolean; rides: Array<Record<string, unknown>> }> {
  const searchParams = new URLSearchParams()
  if (params?.userId) searchParams.set('userId', params.userId)
  if (params?.driverId) searchParams.set('driverId', params.driverId)
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()
  return apiCall(`/rides${query ? `?${query}` : ''}`)
}

export async function updateRide(rideId: string, data: Record<string, unknown>): Promise<{ success: boolean; ride: Record<string, unknown> }> {
  return apiCall(`/rides/${rideId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getNearbyDrivers(lat: number, lng: number, vehicleType?: string): Promise<{ success: boolean; drivers: Array<Record<string, unknown>> }> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  if (vehicleType) params.set('vehicleType', vehicleType)
  return apiCall(`/rides/nearby-drivers?${params}`)
}

// Drivers
export async function getDrivers(params?: Record<string, string>): Promise<{ success: boolean; drivers: Array<Record<string, unknown>> }> {
  const searchParams = new URLSearchParams(params)
  return apiCall(`/drivers?${searchParams}`)
}

export async function registerDriver(data: {
  userId: string
  vehicleType: string
  vehicleNumber: string
  licenseNumber: string
  aadhaarNumber?: string
  aadhaarPhoto?: string
  licensePhoto?: string
  rcNumber?: string
  rcPhoto?: string
  vehiclePhoto?: string
}): Promise<{ success: boolean; driver: Record<string, unknown> }> {
  return apiCall('/drivers/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateDriver(driverId: string, data: Record<string, unknown>): Promise<{ success: boolean; driver: Record<string, unknown> }> {
  return apiCall(`/drivers/${driverId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getDriverEarnings(driverId: string, period: string): Promise<{ success: boolean; earnings: Record<string, unknown> }> {
  return apiCall(`/drivers/${driverId}/earnings?period=${period}`)
}

export async function uploadDriverDocuments(driverId: string, data: {
  aadhaarNumber?: string
  aadhaarPhoto?: string
  licensePhoto?: string
  rcNumber?: string
  rcPhoto?: string
  vehiclePhoto?: string
}): Promise<{ success: boolean; driver: Record<string, unknown> }> {
  return apiCall(`/drivers/${driverId}/documents`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getDriverDocuments(driverId: string): Promise<{ success: boolean; documents: Record<string, unknown> }> {
  return apiCall(`/drivers/${driverId}/documents`)
}

export async function getDriverNotifications(driverId: string): Promise<{ success: boolean; notifications: Array<Record<string, unknown>> }> {
  return apiCall(`/drivers/${driverId}/notifications`)
}

// Wallet
export async function getWallet(userId: string): Promise<{ success: boolean; wallet: { balance: number } }> {
  return apiCall(`/wallet?userId=${userId}`)
}

export async function addWalletMoney(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
  const res = await apiCall<{ success: boolean; wallet: { balance: number } }>('/wallet', {
    method: 'POST',
    body: JSON.stringify({ userId, amount }),
  })
  return { success: res.success, balance: res.wallet?.balance || 0 }
}

export async function getWalletTransactions(userId: string): Promise<{ success: boolean; transactions: Array<Record<string, unknown>> }> {
  return apiCall(`/wallet/transactions?userId=${userId}`)
}

// Routes
export async function getRoutes(): Promise<{ success: boolean; routes: Array<Record<string, unknown>> }> {
  return apiCall('/routes')
}

export async function createRoute(data: Record<string, unknown>): Promise<{ success: boolean; route: Record<string, unknown> }> {
  return apiCall('/routes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Shared Rides
export async function getSharedRides(params?: Record<string, string>): Promise<{ success: boolean; sharedRides: Array<Record<string, unknown>> }> {
  const searchParams = new URLSearchParams(params)
  return apiCall(`/shared-rides?${searchParams}`)
}

export async function joinSharedRide(sharedRideId: string, data: Record<string, unknown>): Promise<{ success: boolean; sharedRidePassenger: Record<string, unknown> }> {
  return apiCall(`/shared-rides/${sharedRideId}/join`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Ratings
export async function createRating(data: { rideId: string; fromUserId: string; toUserId: string; toDriverId?: string; rating: number; review?: string }): Promise<{ success: boolean; rating: Record<string, unknown> }> {
  return apiCall('/ratings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Offers
export async function validateOffer(code: string, fare: number): Promise<{ success: boolean; offer?: Record<string, unknown>; discount?: number }> {
  return apiCall('/offers/validate', {
    method: 'POST',
    body: JSON.stringify({ code, fare }),
  })
}

export async function getOffers(): Promise<{ success: boolean; offers: Array<Record<string, unknown>> }> {
  return apiCall('/offers')
}

// Emergency
export async function createEmergencyAlert(data: { userId: string; rideId?: string; lat?: number; lng?: number; message?: string }): Promise<{ success: boolean; alert: Record<string, unknown> }> {
  return apiCall('/emergency', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Withdraw
export async function createWithdrawRequest(data: Record<string, unknown>): Promise<{ success: boolean; withdrawRequest: Record<string, unknown> }> {
  return apiCall('/withdraw', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Disputes
export async function createDispute(data: Record<string, unknown>): Promise<{ success: boolean; dispute: Record<string, unknown> }> {
  return apiCall('/disputes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function resolveDispute(disputeId: string, resolution: string): Promise<{ success: boolean; dispute: Record<string, unknown> }> {
  return apiCall(`/disputes/${disputeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'RESOLVED', resolution }),
  })
}

// Admin
export async function getAdminStats(): Promise<{ success: boolean; stats: { totalUsers: number; totalDrivers: number; totalRides: number; totalEarnings: number; activeRides: number; pendingApprovals: number } }> {
  return apiCall('/admin/stats')
}

export async function approveDriver(driverId: string): Promise<{ success: boolean }> {
  return apiCall(`/admin/drivers/${driverId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ isApproved: true }),
  })
}

export async function rejectDriver(driverId: string, reason: string): Promise<{ success: boolean }> {
  return apiCall(`/admin/drivers/${driverId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ isApproved: false, rejectReason: reason }),
  })
}

export async function blockUser(userId: string): Promise<{ success: boolean }> {
  return apiCall(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked: true }),
  })
}

export async function unblockUser(userId: string): Promise<{ success: boolean }> {
  return apiCall(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked: false }),
  })
}

export async function getAdminUsers(params?: Record<string, string>): Promise<{ success: boolean; users: Array<Record<string, unknown>> }> {
  const searchParams = new URLSearchParams(params)
  return apiCall(`/admin/users?${searchParams}`)
}

export async function updateCommission(percentage: number): Promise<{ success: boolean }> {
  return apiCall('/admin/commission', {
    method: 'PATCH',
    body: JSON.stringify({ percentage }),
  })
}

export async function createOffer(data: Record<string, unknown>): Promise<{ success: boolean; offer: Record<string, unknown> }> {
  return apiCall('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function broadcastNotification(data: { title: string; message: string; targetRole: string }): Promise<{ success: boolean }> {
  return apiCall('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getFareConfig(): Promise<Record<string, string>> {
  const res = await apiCall<{ success: boolean; settings: Array<{ key: string; value: string }> }>('/settings')
  const config: Record<string, string> = {}
  if (res.settings) {
    for (const s of res.settings) {
      // Map snake_case DB keys to camelCase frontend keys
      const keyMap: Record<string, string> = {
        'commission_percentage': 'commission',
        'tempo_base_fare': 'tempoBaseFare',
        'tempo_per_km': 'tempoPerKm',
        'auto_base_fare': 'autoBaseFare',
        'auto_per_km': 'autoPerKm',
        'erickshaw_base_fare': 'eRickshawBaseFare',
        'erickshaw_per_km': 'eRickshawPerKm',
      }
      const mappedKey = keyMap[s.key] || s.key
      config[mappedKey] = s.value
    }
  }
  return config
}

export async function updateFareConfig(data: Record<string, string>): Promise<{ success: boolean }> {
  // Map camelCase frontend keys to snake_case DB keys
  const keyMap: Record<string, string> = {
    'commission': 'commission_percentage',
    'tempoBaseFare': 'tempo_base_fare',
    'tempoPerKm': 'tempo_per_km',
    'autoBaseFare': 'auto_base_fare',
    'autoPerKm': 'auto_per_km',
    'eRickshawBaseFare': 'erickshaw_base_fare',
    'eRickshawPerKm': 'erickshaw_per_km',
  }
  const updates = Object.entries(data).map(([key, value]) =>
    apiCall('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key: keyMap[key] || key, value }),
    })
  )
  await Promise.all(updates)
  return { success: true }
}

// Fare calculation helper (client-side)
export function calculateFare(vehicleType: string, distanceKm: number): { baseFare: number; distanceFare: number; total: number } {
  const fareConfig: Record<string, { base: number; perKm: number }> = {
    TEMPO: { base: 15, perKm: 8 },
    AUTO: { base: 20, perKm: 12 },
    E_RICKSHAW: { base: 10, perKm: 6 },
  }
  const config = fareConfig[vehicleType] || fareConfig.TEMPO
  const baseFare = config.base
  const distanceFare = Math.round(distanceKm * config.perKm)
  const total = baseFare + distanceFare
  return { baseFare, distanceFare, total }
}

// Admin Login
export async function adminLogin(phone: string, password: string): Promise<{ success: boolean; user?: { id: string; phone: string; name: string; role: string; isVerified: boolean }; message?: string }> {
  return apiCall('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
}

// Suspend Driver
export async function suspendDriver(driverId: string, isSuspended: boolean, suspendReason?: string): Promise<{ success: boolean }> {
  return apiCall(`/admin/drivers/${driverId}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ isSuspended, suspendReason }),
  })
}

// Get Admin Wallets
export async function getAdminWallets(params?: Record<string, string>): Promise<{ success: boolean; wallets: Array<Record<string, unknown>> }> {
  const searchParams = new URLSearchParams(params)
  return apiCall(`/admin/wallets?${searchParams}`)
}

// Adjust Wallet
export async function adjustWallet(walletId: string, data: { amount: number; type: 'CREDIT' | 'DEBIT'; description: string }): Promise<{ success: boolean; wallet: { id: string; balance: number }; transaction: Record<string, unknown> }> {
  return apiCall(`/admin/wallets/${walletId}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Get Admin Reports
export async function getAdminReports(type: string, period: string): Promise<{ success: boolean; report: Record<string, unknown> }> {
  return apiCall(`/admin/reports?type=${type}&period=${period}`)
}

// Get Admin Settings
export async function getAdminSettings(): Promise<{ success: boolean; settings: Array<{ key: string; value: string; description?: string }> }> {
  return apiCall('/admin/settings')
}

// Update Admin Settings
export async function updateAdminSettings(settings: Array<{ key: string; value: string; description?: string }>): Promise<{ success: boolean }> {
  return apiCall('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  })
}

// Get Admin Disputes
export async function getAdminDisputes(status?: string): Promise<{ success: boolean; disputes: Array<Record<string, unknown>> }> {
  const params = status ? `?status=${status}` : ''
  return apiCall(`/admin/disputes${params}`)
}

// ─── UPI / Payment Settings ─────────────────────────────────────────────────

export interface PaymentSettings {
  upiId: string
  paymentQrUrl: string
  paymentInstructions: string
  upiPaymentEnabled: boolean
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const res = await apiCall<{ success: boolean; settings: Record<string, string> }>('/admin/settings')
    if (res.success && res.settings) {
      return {
        upiId: res.settings.upi_id || '',
        paymentQrUrl: res.settings.payment_qr_url || '',
        paymentInstructions: res.settings.payment_instructions || '',
        upiPaymentEnabled: res.settings.upi_payment_enabled === 'true',
      }
    }
  } catch {
    // Fallback: return empty settings
  }
  return { upiId: '', paymentQrUrl: '', paymentInstructions: '', upiPaymentEnabled: false }
}
