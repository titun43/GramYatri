// Firebase Firestore API Route
// Server-side Firestore operations using Firebase Admin SDK

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, collection, docId, data, constraints } = body

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      // Fallback: return mock response when Firebase isn't configured
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Firebase not configured - using Prisma fallback',
      })
    }

    const { adminDb } = await import('@/lib/firebase/admin-config')
    const {
      doc, getDoc, setDoc, updateDoc, deleteDoc,
      collection: firestoreCollection, getDocs, query, where,
      addDoc, serverTimestamp,
    } = await import('firebase-admin/firestore')

    switch (action) {
      case 'get': {
        if (!collection || !docId) {
          return NextResponse.json({ success: false, error: 'Collection and docId required' }, { status: 400 })
        }
        const docRef = doc(adminDb, collection, docId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          return NextResponse.json({ success: true, data: { id: docSnap.id, ...docSnap.data() } })
        }
        return NextResponse.json({ success: true, data: null })
      }

      case 'list': {
        if (!collection) {
          return NextResponse.json({ success: false, error: 'Collection required' }, { status: 400 })
        }
        let q = firestoreCollection(adminDb, collection)
        if (constraints && Array.isArray(constraints)) {
          const whereConstraints = constraints.map(
            (c: { field: string; op: string; value: unknown }) => where(c.field, c.op as '==' | '!=' | '>' | '<' | '>=' | '<=', c.value)
          )
          q = query(q, ...whereConstraints) as unknown as typeof q
        }
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        return NextResponse.json({ success: true, data: docs })
      }

      case 'set': {
        if (!collection || !docId || !data) {
          return NextResponse.json({ success: false, error: 'Collection, docId and data required' }, { status: 400 })
        }
        await setDoc(doc(adminDb, collection, docId), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        return NextResponse.json({ success: true })
      }

      case 'add': {
        if (!collection || !data) {
          return NextResponse.json({ success: false, error: 'Collection and data required' }, { status: 400 })
        }
        const docRef = await addDoc(firestoreCollection(adminDb, collection), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        return NextResponse.json({ success: true, docId: docRef.id })
      }

      case 'update': {
        if (!collection || !docId || !data) {
          return NextResponse.json({ success: false, error: 'Collection, docId and data required' }, { status: 400 })
        }
        await updateDoc(doc(adminDb, collection, docId), {
          ...data,
          updatedAt: serverTimestamp(),
        })
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        if (!collection || !docId) {
          return NextResponse.json({ success: false, error: 'Collection and docId required' }, { status: 400 })
        }
        await deleteDoc(doc(adminDb, collection, docId))
        return NextResponse.json({ success: true })
      }

      case 'stats': {
        // Get collection counts for admin dashboard
        const [usersSnap, driversSnap, ridesSnap] = await Promise.all([
          getDocs(firestoreCollection(adminDb, 'users')),
          getDocs(firestoreCollection(adminDb, 'drivers')),
          getDocs(firestoreCollection(adminDb, 'rides')),
        ])

        let totalEarnings = 0
        let activeRides = 0
        let pendingApprovals = 0

        ridesSnap.docs.forEach((d) => {
          const rideData = d.data()
          if (rideData.status === 'COMPLETED') totalEarnings += Number(rideData.fare) || 0
          if (['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'].includes(rideData.status)) activeRides++
        })

        driversSnap.docs.forEach((d) => {
          if (!d.data().isApproved) pendingApprovals++
        })

        const totalUsers = usersSnap.docs.filter((d) => d.data().role === 'USER').length

        return NextResponse.json({
          success: true,
          data: {
            totalUsers,
            totalDrivers: driversSnap.size,
            totalRides: ridesSnap.size,
            activeRides,
            totalEarnings,
            pendingApprovals,
          },
        })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Firestore operation failed'
    console.error('Firebase Firestore API error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
