// Firebase Client SDK Configuration
// Import this in client-side components only
// Gracefully handles missing Firebase credentials (demo mode)

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Check if Firebase credentials are configured
const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gramyatri-demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gramyatri-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gramyatri-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
}

// Initialize Firebase safely (prevent re-initialization in dev mode)
let app: FirebaseApp
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch {
  // Fallback: if initialization fails, create a dummy app
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
}

// Initialize services with safe fallbacks
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let messaging: ReturnType<typeof import('firebase/messaging').getMessaging> | null = null

try {
  auth = getAuth(app)
} catch {
  // Auth init failed - will be handled gracefully
  auth = null as unknown as Auth
}

try {
  db = getFirestore(app)
} catch {
  // Firestore init failed - will be handled gracefully
  db = null as unknown as Firestore
}

try {
  storage = getStorage(app)
} catch {
  // Storage init failed - will be handled gracefully
  storage = null as unknown as FirebaseStorage
}

// Messaging requires browser support check - only init if configured
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  import('firebase/messaging').then(({ getMessaging, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        try {
          messaging = getMessaging(app)
        } catch {
          // Messaging not available
        }
      }
    }).catch(() => {
      // Messaging not supported
    })
  }).catch(() => {
    // Messaging module not available
  })
}

export { app, auth, db, storage, messaging, isFirebaseConfigured }
export default app

// Firestore collection names as constants
export const COLLECTIONS = {
  USERS: 'users',
  DRIVERS: 'drivers',
  RIDES: 'rides',
  SHARED_RIDES: 'sharedRides',
  WALLET_TRANSACTIONS: 'walletTransactions',
  NOTIFICATIONS: 'notifications',
  OFFERS: 'offers',
  ROUTES: 'routes',
  SETTINGS: 'settings',
  COMMISSIONS: 'commissions',
  DISPUTES: 'disputes',
  EMERGENCY_ALERTS: 'emergencyAlerts',
  RATINGS: 'ratings',
  WITHDRAWAL_REQUESTS: 'withdrawalRequests',
} as const

// Storage paths as constants
export const STORAGE_PATHS = {
  DRIVER_DOCUMENTS: 'drivers/documents',
  DRIVER_AADHAAR: 'drivers/documents/aadhaar',
  DRIVER_LICENSE: 'drivers/documents/license',
  DRIVER_RC: 'drivers/documents/rc',
  DRIVER_VEHICLE: 'drivers/documents/vehicle',
  USER_PROFILES: 'users/profiles',
  EMERGENCY: 'emergency',
} as const

// FCM topic names
export const FCM_TOPICS = {
  ALL_USERS: 'all_users',
  ALL_DRIVERS: 'all_drivers',
  RIDE_UPDATES: 'ride_updates',
  DRIVER_ALERTS: 'driver_alerts',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
} as const
