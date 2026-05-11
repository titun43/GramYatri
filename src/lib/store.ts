import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'USER' | 'DRIVER' | 'ADMIN'

export interface User {
  id: string
  name: string
  phone: string
  role: Role
  avatar?: string
  walletBalance: number
  isVerified: boolean
  isOnline?: boolean
  vehicleType?: string
  vehicleNumber?: string
  licenseNumber?: string
  rating?: number
  totalRides?: number
  totalEarnings?: number
  isRegistered?: boolean
  isApproved?: boolean
  isBlocked?: boolean
  aadhaarNumber?: string
  currentLat?: number
  currentLng?: number
}

export interface Ride {
  id: string
  userId: string
  driverId?: string
  pickup: string
  drop: string
  pickupLat?: number
  pickupLng?: number
  dropLat?: number
  dropLng?: number
  vehicleType: 'TEMPO' | 'AUTO' | 'E_RICKSHAW'
  fare: number
  baseFare: number
  distanceFare: number
  distance: number
  status: 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  paymentMethod: 'CASH' | 'WALLET'
  offerCode?: string
  createdAt: string
  completedAt?: string
  driverName?: string
  driverPhone?: string
  driverVehicle?: string
  userName?: string
  userPhone?: string
  rating?: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  createdAt: string
  read: boolean
}

interface AppState {
  // Auth
  currentUser: User | null
  currentRole: Role | null
  isLoggedIn: boolean
  isVerified: boolean

  // Navigation
  currentView: string
  previousView: string | null

  // App state
  isOnline: boolean
  activeRide: Ride | null
  incomingRides: Ride[]
  notifications: Notification[]

  // Actions
  login: (user: User) => void
  logout: () => void
  setRole: (role: Role) => void
  setVerified: (verified: boolean) => void
  setView: (view: string) => void
  goBack: () => void
  setOnline: (online: boolean) => void
  setActiveRide: (ride: Ride | null) => void
  setIncomingRides: (rides: Ride[]) => void
  addIncomingRide: (ride: Ride) => void
  removeIncomingRide: (rideId: string) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  updateWalletBalance: (balance: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentRole: null,
      isLoggedIn: false,
      isVerified: false,
      currentView: 'splash',
      previousView: null,
      isOnline: false,
      activeRide: null,
      incomingRides: [],
      notifications: [],

      login: (user) => set({
        currentUser: user,
        currentRole: user.role,
        isLoggedIn: true,
        isVerified: true,
        currentView: user.role === 'ADMIN' ? 'admin-dashboard' : 'home',
        isOnline: user.role === 'DRIVER' ? false : true,
      }),

      logout: () => set({
        currentUser: null,
        currentRole: null,
        isLoggedIn: false,
        isVerified: false,
        currentView: 'login',
        previousView: null,
        isOnline: false,
        activeRide: null,
        incomingRides: [],
      }),

      setRole: (role) => set({ currentRole: role }),

      setVerified: (verified) => set({ isVerified: verified }),

      setView: (view) => set((state) => ({
        previousView: state.currentView,
        currentView: view,
      })),

      goBack: () => set((state) => ({
        currentView: state.previousView || 'home',
        previousView: null,
      })),

      setOnline: (online) => set({ isOnline: online }),

      setActiveRide: (ride) => set({ activeRide: ride }),

      setIncomingRides: (rides) => set({ incomingRides: rides }),

      addIncomingRide: (ride) => set((state) => ({
        incomingRides: [ride, ...state.incomingRides],
      })),

      removeIncomingRide: (rideId) => set((state) => ({
        incomingRides: state.incomingRides.filter(r => r.id !== rideId),
      })),

      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      updateWalletBalance: (balance) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, walletBalance: balance } : null,
      })),
    }),
    {
      name: 'gramyatri-storage', // localStorage key
      partialize: (state) => ({
        // Only persist auth-related state, not temporary UI state
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        isLoggedIn: state.isLoggedIn,
        isVerified: state.isVerified,
      }),
    }
  )
)
