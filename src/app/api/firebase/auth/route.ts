// Firebase Auth API Route
// Server-side authentication using Firebase Admin SDK

import { NextRequest, NextResponse } from 'next/server'

// This route uses Firebase Admin SDK for server-side auth operations
// It's only functional when Firebase credentials are configured

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, uid, phone, name, role, vehicleType, vehicleNumber, licenseNumber } = body

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      // Fallback: return mock response when Firebase isn't configured
      if (action === 'getUser') {
        return NextResponse.json({
          success: true,
          user: {
            uid: uid || 'demo-user',
            phone: phone || '+919999999999',
            name: name || 'Demo User',
            role: role || 'USER',
          },
        })
      }

      if (action === 'register') {
        return NextResponse.json({
          success: true,
          user: {
            uid: `user-${Date.now()}`,
            phone,
            name,
            role,
          },
        })
      }

      if (action === 'createCustomToken') {
        return NextResponse.json({
          success: true,
          token: 'demo-custom-token',
        })
      }

      return NextResponse.json({ success: false, error: 'Unknown action' })
    }

    // When Firebase is properly configured, use Admin SDK
    const { adminAuth, adminDb } = await import('@/lib/firebase/admin-config')
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase-admin/firestore')

    switch (action) {
      case 'getUser': {
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 })
        }
        const userRecord = await adminAuth.getUser(uid)
        const userDoc = await getDoc(doc(adminDb, 'users', uid))

        return NextResponse.json({
          success: true,
          user: {
            uid: userRecord.uid,
            phone: userRecord.phoneNumber,
            email: userRecord.email,
            name: userRecord.displayName,
            ...userDoc.data(),
          },
        })
      }

      case 'register': {
        const userId = uid || `user-${Date.now()}`

        // Create user document in Firestore
        await setDoc(doc(adminDb, 'users', userId), {
          name,
          phone,
          role,
          walletBalance: role === 'DRIVER' ? 0 : 500,
          isVerified: true,
          isOnline: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // If driver, create driver document
        if (role === 'DRIVER') {
          await setDoc(doc(adminDb, 'drivers', userId), {
            userId,
            vehicleType: vehicleType || 'TEMPO',
            vehicleNumber: vehicleNumber || '',
            licenseNumber: licenseNumber || '',
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

        return NextResponse.json({ success: true, user: { uid: userId, phone, name, role } })
      }

      case 'createCustomToken': {
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 })
        }
        const customToken = await adminAuth.createCustomToken(uid, { role })
        return NextResponse.json({ success: true, token: customToken })
      }

      case 'verifyIdToken': {
        const { idToken } = body
        if (!idToken) {
          return NextResponse.json({ success: false, error: 'ID token required' }, { status: 400 })
        }
        const decodedToken = await adminAuth.verifyIdToken(idToken)
        return NextResponse.json({ success: true, uid: decodedToken.uid, claims: decodedToken })
      }

      case 'deleteUser': {
        if (!uid) {
          return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 })
        }
        await adminAuth.deleteUser(uid)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Auth operation failed'
    console.error('Firebase auth API error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
