// Firebase Authentication Service
// Client-side phone auth + OTP verification

import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth'
import { auth, db, COLLECTIONS } from './config'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

let confirmationResult: ConfirmationResult | null = null
let recaptchaVerifier: RecaptchaVerifier | null = null

// ─── Initialize RecaptchaVerifier ──────────────────────────────────────────────

export function initRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // reCAPTCHA expired - reset
    },
  })
  return recaptchaVerifier
}

// ─── Send OTP ──────────────────────────────────────────────────────────────────

export async function sendFirebaseOTP(
  phoneNumber: string,
  recaptchaContainer?: string
): Promise<{ success: boolean; error?: string; billingRequired?: boolean }> {
  try {
    const verifier = recaptchaVerifier || initRecaptcha(recaptchaContainer)
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send OTP'
    console.warn('Firebase OTP send error:', msg)

    // If billing not enabled, flag it so the app can fall back to Prisma OTP
    if (msg.includes('billing-not-enabled') || msg.includes('BILLING_NOT_ENABLED')) {
      console.warn('Firebase Phone Auth requires Blaze plan. Falling back to Prisma OTP.')
      return { success: false, error: 'Firebase billing not enabled', billingRequired: true }
    }

    // If recaptcha error, try to reinitialize
    if (msg.includes('recaptcha') || msg.includes('ReCaptcha')) {
      try {
        recaptchaVerifier = initRecaptcha(recaptchaContainer || 'recaptcha-container')
        confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
        return { success: true }
      } catch (retryError: unknown) {
        const retryMsg = retryError instanceof Error ? retryError.message : 'ReCAPTCHA failed'
        // Check billing error on retry too
        if (retryMsg.includes('billing-not-enabled') || retryMsg.includes('BILLING_NOT_ENABLED')) {
          return { success: false, error: 'Firebase billing not enabled', billingRequired: true }
        }
        return { success: false, error: 'ReCAPTCHA verification failed. Please try again.' }
      }
    }

    return { success: false, error: msg }
  }
}

// ─── Verify OTP ────────────────────────────────────────────────────────────────

export async function verifyFirebaseOTP(
  otp: string
): Promise<{ success: boolean; user?: User; isNewUser?: boolean; error?: string }> {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No OTP request found. Please send OTP first.' }
    }

    const result = await confirmationResult.confirm(otp)
    const user = result.user

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid))
    const isNewUser = !userDoc.exists()

    return { success: true, user, isNewUser }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid OTP'
    console.error('Firebase OTP verify error:', msg)

    if (msg.includes('invalid-verification-code') || msg.includes('Invalid OTP')) {
      return { success: false, error: 'Invalid OTP. Please try again.' }
    }
    if (msg.includes('expired')) {
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    return { success: false, error: msg }
  }
}

// ─── Register User in Firestore ────────────────────────────────────────────────

export async function registerFirebaseUser(data: {
  uid: string
  name: string
  phone: string
  role: 'USER' | 'DRIVER' | 'ADMIN'
  vehicleType?: string
  vehicleNumber?: string
  licenseNumber?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userData: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      role: data.role,
      walletBalance: data.role === 'DRIVER' ? 0 : 500,
      isVerified: true,
      isOnline: false,
      isBlocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create user document
    await setDoc(doc(db, COLLECTIONS.USERS, data.uid), userData)

    // If driver, create driver document too
    if (data.role === 'DRIVER') {
      await setDoc(doc(db, COLLECTIONS.DRIVERS, data.uid), {
        userId: data.uid,
        vehicleType: data.vehicleType || 'TEMPO',
        vehicleNumber: data.vehicleNumber || '',
        licenseNumber: data.licenseNumber || '',
        rating: 0,
        totalRides: 0,
        totalEarnings: 0,
        isApproved: false,
        isOnline: false,
        isBlocked: false,
        isSuspended: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Registration failed'
    console.error('Firebase register error:', msg)
    return { success: false, error: msg }
  }
}

// ─── Get Current Auth User ─────────────────────────────────────────────────────

export function getCurrentAuthUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// ─── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth)
    confirmationResult = null
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
      recaptchaVerifier = null
    }
  } catch (error) {
    console.error('Firebase sign out error:', error)
  }
}

// ─── Sign in with custom token (for admin) ─────────────────────────────────────

export async function signInWithCustomToken(token: string) {
  try {
    const result = await signInWithCredential(auth, PhoneAuthProvider.credential(token, ''))
    return { success: true, user: result.user }
  } catch {
    return { success: false, error: 'Invalid token' }
  }
}

// ─── Auth State Listener ───────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// ─── Update user in Firestore ──────────────────────────────────────────────────

export async function updateFirebaseUser(
  uid: string,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}
