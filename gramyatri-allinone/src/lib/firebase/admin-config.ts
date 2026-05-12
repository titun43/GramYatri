// Firebase Admin SDK Configuration
// Import this in server-side API routes only
// Gracefully handles initialization failures
// Reads credentials from file to avoid env variable size issues

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { getStorage as getAdminStorage } from 'firebase-admin/storage'
import { getMessaging as getAdminMessaging } from 'firebase-admin/messaging'
import { readFileSync } from 'fs'
import { join } from 'path'

// Check if Admin SDK is properly configured
const isAdminConfigured = !!(
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL
)

let adminApp: ReturnType<typeof initializeApp> | null = null
let adminAuth: ReturnType<typeof getAdminAuth> | null = null
let adminDb: ReturnType<typeof getAdminFirestore> | null = null
let adminStorage: ReturnType<typeof getAdminStorage> | null = null
let adminMessaging: ReturnType<typeof getAdminMessaging> | null = null

if (isAdminConfigured) {
  try {
    // Try to read service account from file first (avoids env var size issues)
    let serviceAccount: { project_id?: string; client_email?: string; private_key?: string } | null = null
    
    try {
      const saPath = join(process.cwd(), 'firebase-service-account.json')
      const saContent = readFileSync(saPath, 'utf-8')
      serviceAccount = JSON.parse(saContent)
    } catch {
      // File not found or invalid, fall back to env vars
    }

    const projectId = serviceAccount?.project_id || process.env.FIREBASE_ADMIN_PROJECT_ID!
    const clientEmail = serviceAccount?.client_email || process.env.FIREBASE_ADMIN_CLIENT_EMAIL!
    const privateKey = serviceAccount?.private_key || (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n')

    if (!privateKey || privateKey === '') {
      throw new Error('Firebase Admin private key not found')
    }

    const adminConfig = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    }

    // Initialize Admin SDK (prevent re-initialization)
    adminApp = getApps().length === 0 ? initializeApp(adminConfig) : getApp()
    adminAuth = getAdminAuth(adminApp)
    adminDb = getAdminFirestore(adminApp)
    adminStorage = getAdminStorage(adminApp)
    adminMessaging = getAdminMessaging(adminApp)
  } catch (error) {
    // Admin SDK initialization failed - log but don't crash
    console.warn('Firebase Admin SDK initialization failed:', error)
  }
}

export { adminApp, adminAuth, adminDb, adminStorage, adminMessaging, isAdminConfigured }
export default adminApp
