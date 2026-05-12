// Firebase Firestore Service
// CRUD operations for all collections

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  runTransaction,
  increment,
  Unsubscribe,
} from 'firebase/firestore'
import { db, COLLECTIONS } from './config'

// ─── Type Definitions ──────────────────────────────────────────────────────────

export interface FirestoreUser {
  name: string
  phone: string
  role: 'USER' | 'DRIVER' | 'ADMIN'
  walletBalance: number
  isVerified: boolean
  isOnline: boolean
  isBlocked: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FirestoreDriver {
  userId: string
  vehicleType: string
  vehicleNumber: string
  licenseNumber: string
  rating: number
  totalRides: number
  totalEarnings: number
  isApproved: boolean
  isOnline: boolean
  isBlocked: boolean
  isSuspended: boolean
  suspendReason?: string
  currentLat?: number
  currentLng?: number
  aadhaarNumber?: string
  aadhaarPhotoUrl?: string
  licensePhotoUrl?: string
  rcNumber?: string
  rcPhotoUrl?: string
  vehiclePhotoUrl?: string
  fcmToken?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FirestoreRide {
  userId: string
  driverId?: string
  pickupAddress: string
  dropAddress: string
  pickupLat?: number
  pickupLng?: number
  dropLat?: number
  dropLng?: number
  vehicleType: string
  fare: number
  baseFare: number
  distanceFare: number
  distance: number
  status: 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  paymentMethod: 'CASH' | 'WALLET'
  offerCode?: string
  cancelledBy?: string
  completedAt?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FirestoreWalletTransaction {
  userId: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  createdAt?: Timestamp
}

export interface FirestoreNotification {
  userId: string
  title: string
  message: string
  type: 'RIDE' | 'OFFER' | 'SYSTEM' | 'EARNING' | 'ALERT'
  isRead: boolean
  createdAt?: Timestamp
}

export interface FirestoreOffer {
  code: string
  discount: number
  type: 'PERCENTAGE' | 'FLAT'
  maxDiscount: number
  isActive: boolean
  usageCount: number
  validUntil?: Timestamp
  createdAt?: Timestamp
}

export interface FirestoreRoute {
  name: string
  from: string
  to: string
  stops: string[]
  distance: number
  estimatedTime: number
  fare: number
  vehicleType: string
  isActive: boolean
  createdAt?: Timestamp
}

export interface FirestoreEmergencyAlert {
  userId: string
  rideId?: string
  message?: string
  status: 'ACTIVE' | 'RESOLVED'
  createdAt?: Timestamp
}

export interface FirestoreRating {
  rideId: string
  fromUserId: string
  toUserId: string
  toDriverId?: string
  rating: number
  comment?: string
  createdAt?: Timestamp
}

export interface FirestoreWithdrawalRequest {
  userId: string
  amount: number
  method: 'UPI' | 'BANK'
  upiId?: string
  bankAccount?: string
  bankName?: string
  ifscCode?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FirestoreDispute {
  rideId: string
  userId: string
  reason: string
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED'
  resolution?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FirestoreCommission {
  rideId: string
  driverId: string
  amount: number
  percentage: number
  createdAt?: Timestamp
}

// ─── Generic CRUD Operations ───────────────────────────────────────────────────

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T
    }
    return null
  } catch (error) {
    console.error(`Error getting document ${collectionName}/${docId}:`, error)
    return null
  }
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[]
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error)
    return []
  }
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error)
    return null
  }
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionName: string,
  docId: string,
  data: T,
  merge: boolean = true
): Promise<boolean> {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge })
    return true
  } catch (error) {
    console.error(`Error setting document ${collectionName}/${docId}:`, error)
    return false
  }
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error(`Error updating document ${collectionName}/${docId}:`, error)
    return false
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, docId))
    return true
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, error)
    return false
  }
}

// ─── Real-time Listeners ───────────────────────────────────────────────────────

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId)
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error(`Error listening to ${collectionName}/${docId}:`, error)
    callback(null)
  })
}

export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints)
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[]
    callback(data)
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error)
    callback([])
  })
}

// ─── User Operations ───────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<(FirestoreUser & { id: string }) | null> {
  return getDocument<FirestoreUser & { id: string }>(COLLECTIONS.USERS, uid)
}

export async function getUsersByRole(role: string): Promise<(FirestoreUser & { id: string })[]> {
  return getDocuments<FirestoreUser & { id: string }>(COLLECTIONS.USERS, [
    where('role', '==', role),
  ])
}

export async function updateUser(uid: string, data: Partial<FirestoreUser>): Promise<boolean> {
  return updateDocument(COLLECTIONS.USERS, uid, data as Record<string, unknown>)
}

export async function updateUserWallet(uid: string, amount: number): Promise<boolean> {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      walletBalance: increment(amount),
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Error updating wallet:', error)
    return false
  }
}

// ─── Driver Operations ─────────────────────────────────────────────────────────

export async function getDriver(uid: string): Promise<(FirestoreDriver & { id: string }) | null> {
  return getDocument<FirestoreDriver & { id: string }>(COLLECTIONS.DRIVERS, uid)
}

export async function getDriversByApproval(isApproved: boolean): Promise<(FirestoreDriver & { id: string })[]> {
  return getDocuments<FirestoreDriver & { id: string }>(COLLECTIONS.DRIVERS, [
    where('isApproved', '==', isApproved),
  ])
}

export async function getOnlineDrivers(vehicleType?: string): Promise<(FirestoreDriver & { id: string })[]> {
  const constraints: QueryConstraint[] = [
    where('isOnline', '==', true),
    where('isApproved', '==', true),
    where('isBlocked', '==', false),
    where('isSuspended', '==', false),
  ]
  if (vehicleType) {
    constraints.push(where('vehicleType', '==', vehicleType))
  }
  return getDocuments<FirestoreDriver & { id: string }>(COLLECTIONS.DRIVERS, constraints)
}

export async function updateDriver(uid: string, data: Partial<FirestoreDriver>): Promise<boolean> {
  return updateDocument(COLLECTIONS.DRIVERS, uid, data as Record<string, unknown>)
}

export async function approveDriver(driverId: string): Promise<boolean> {
  return updateDocument(COLLECTIONS.DRIVERS, driverId, {
    isApproved: true,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>)
}

export async function rejectDriver(driverId: string): Promise<boolean> {
  return updateDocument(COLLECTIONS.DRIVERS, driverId, {
    isApproved: false,
    isBlocked: true,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>)
}

export async function suspendDriver(driverId: string, reason: string): Promise<boolean> {
  return updateDocument(COLLECTIONS.DRIVERS, driverId, {
    isSuspended: true,
    suspendReason: reason,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>)
}

export async function unsuspendDriver(driverId: string): Promise<boolean> {
  return updateDocument(COLLECTIONS.DRIVERS, driverId, {
    isSuspended: false,
    suspendReason: '',
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>)
}

// ─── Ride Operations ───────────────────────────────────────────────────────────

export async function createRide(ride: Omit<FirestoreRide, 'createdAt' | 'updatedAt'>): Promise<string | null> {
  return addDocument(COLLECTIONS.RIDES, ride as Record<string, unknown>)
}

export async function getRide(rideId: string): Promise<(FirestoreRide & { id: string }) | null> {
  return getDocument<FirestoreRide & { id: string }>(COLLECTIONS.RIDES, rideId)
}

export async function getRidesByUser(userId: string): Promise<(FirestoreRide & { id: string })[]> {
  return getDocuments<FirestoreRide & { id: string }>(COLLECTIONS.RIDES, [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ])
}

export async function getRidesByDriver(driverId: string): Promise<(FirestoreRide & { id: string })[]> {
  return getDocuments<FirestoreRide & { id: string }>(COLLECTIONS.RIDES, [
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc'),
  ])
}

export async function getRidesByStatus(status: string): Promise<(FirestoreRide & { id: string })[]> {
  return getDocuments<FirestoreRide & { id: string }>(COLLECTIONS.RIDES, [
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
  ])
}

export async function updateRide(rideId: string, data: Partial<FirestoreRide>): Promise<boolean> {
  return updateDocument(COLLECTIONS.RIDES, rideId, data as Record<string, unknown>)
}

export async function subscribeToRide(
  rideId: string,
  callback: (ride: FirestoreRide & { id: string }) => void
): Unsubscribe {
  return subscribeToDocument<FirestoreRide & { id: string }>(
    COLLECTIONS.RIDES,
    rideId,
    (data) => {
      if (data) callback(data)
    }
  )
}

// ─── Wallet Transaction Operations ─────────────────────────────────────────────

export async function createWalletTransaction(
  transaction: Omit<FirestoreWalletTransaction, 'createdAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.WALLET_TRANSACTIONS, transaction as Record<string, unknown>)
}

export async function getWalletTransactions(
  userId: string,
  limitCount: number = 50
): Promise<(FirestoreWalletTransaction & { id: string })[]> {
  return getDocuments<FirestoreWalletTransaction & { id: string }>(
    COLLECTIONS.WALLET_TRANSACTIONS,
    [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ]
  )
}

// ─── Notification Operations ───────────────────────────────────────────────────

export async function createNotification(
  notification: Omit<FirestoreNotification, 'createdAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.NOTIFICATIONS, notification as Record<string, unknown>)
}

export async function getNotifications(
  userId: string,
  limitCount: number = 50
): Promise<(FirestoreNotification & { id: string })[]> {
  return getDocuments<FirestoreNotification & { id: string }>(
    COLLECTIONS.NOTIFICATIONS,
    [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ]
  )
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  return updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
    isRead: true,
  } as Record<string, unknown>)
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    const notifs = await getDocuments<FirestoreNotification & { id: string }>(
      COLLECTIONS.NOTIFICATIONS,
      [
        where('userId', '==', userId),
        where('isRead', '==', false),
      ]
    )
    const batch = writeBatch(db)
    for (const notif of notifs) {
      batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, notif.id), { isRead: true })
    }
    await batch.commit()
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// ─── Offer Operations ──────────────────────────────────────────────────────────

export async function getActiveOffers(): Promise<(FirestoreOffer & { id: string })[]> {
  return getDocuments<FirestoreOffer & { id: string }>(COLLECTIONS.OFFERS, [
    where('isActive', '==', true),
  ])
}

export async function validateOfferCode(
  code: string,
  fareAmount: number
): Promise<{ valid: boolean; discount: number; offer?: FirestoreOffer & { id: string } }> {
  try {
    const offers = await getDocuments<FirestoreOffer & { id: string }>(COLLECTIONS.OFFERS, [
      where('code', '==', code),
      where('isActive', '==', true),
    ])
    if (offers.length === 0) return { valid: false, discount: 0 }

    const offer = offers[0]
    let discount = 0

    if (offer.type === 'PERCENTAGE') {
      discount = Math.min((fareAmount * offer.discount) / 100, offer.maxDiscount)
    } else {
      discount = Math.min(offer.discount, offer.maxDiscount, fareAmount)
    }

    return { valid: true, discount: Math.round(discount), offer }
  } catch {
    return { valid: false, discount: 0 }
  }
}

// ─── Withdrawal Request Operations ─────────────────────────────────────────────

export async function createWithdrawalRequest(
  data: Omit<FirestoreWithdrawalRequest, 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.WITHDRAWAL_REQUESTS, data as Record<string, unknown>)
}

export async function getWithdrawalRequests(
  status?: string
): Promise<(FirestoreWithdrawalRequest & { id: string })[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
  if (status) {
    constraints.unshift(where('status', '==', status))
  }
  return getDocuments<FirestoreWithdrawalRequest & { id: string }>(
    COLLECTIONS.WITHDRAWAL_REQUESTS,
    constraints
  )
}

// ─── Rating Operations ─────────────────────────────────────────────────────────

export async function createRating(
  rating: Omit<FirestoreRating, 'createdAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.RATINGS, rating as Record<string, unknown>)
}

// ─── Emergency Alert Operations ────────────────────────────────────────────────

export async function createEmergencyAlert(
  alert: Omit<FirestoreEmergencyAlert, 'createdAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.EMERGENCY_ALERTS, alert as Record<string, unknown>)
}

// ─── Dispute Operations ────────────────────────────────────────────────────────

export async function createDispute(
  dispute: Omit<FirestoreDispute, 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  return addDocument(COLLECTIONS.DISPUTES, dispute as Record<string, unknown>)
}

export async function getDisputes(
  status?: string
): Promise<(FirestoreDispute & { id: string })[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
  if (status) {
    constraints.unshift(where('status', '==', status))
  }
  return getDocuments<FirestoreDispute & { id: string }>(COLLECTIONS.DISPUTES, constraints)
}

// ─── Stats / Aggregation ───────────────────────────────────────────────────────

export async function getCollectionCount(collectionName: string): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.size
  } catch {
    return 0
  }
}

export async function getAdminStats(): Promise<{
  totalUsers: number
  totalDrivers: number
  totalRides: number
  activeRides: number
  totalEarnings: number
  pendingApprovals: number
}> {
  try {
    const [users, drivers, rides, activeRides, pendingDrivers] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', 'USER'))),
      getDocs(query(collection(db, COLLECTIONS.DRIVERS))),
      getDocs(collection(db, COLLECTIONS.RIDES)),
      getDocs(query(collection(db, COLLECTIONS.RIDES), where('status', 'in', ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS']))),
      getDocs(query(collection(db, COLLECTIONS.DRIVERS), where('isApproved', '==', false))),
    ])

    let totalEarnings = 0
    rides.forEach((doc) => {
      const data = doc.data()
      if (data.status === 'COMPLETED') {
        totalEarnings += Number(data.fare) || 0
      }
    })

    return {
      totalUsers: users.size,
      totalDrivers: drivers.size,
      totalRides: rides.size,
      activeRides: activeRides.size,
      totalEarnings,
      pendingApprovals: pendingDrivers.size,
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return {
      totalUsers: 0,
      totalDrivers: 0,
      totalRides: 0,
      activeRides: 0,
      totalEarnings: 0,
      pendingApprovals: 0,
    }
  }
}

// ─── Driver Earnings ───────────────────────────────────────────────────────────

export async function getDriverEarnings(
  driverId: string,
  period: 'today' | 'week' | 'month'
): Promise<{ total: number; rides: number; breakdown: Array<{ date: string; amount: number }> }> {
  try {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const rides = await getDocuments<FirestoreRide & { id: string }>(COLLECTIONS.RIDES, [
      where('driverId', '==', driverId),
      where('status', '==', 'COMPLETED'),
      orderBy('createdAt', 'desc'),
    ])

    // Filter by date range
    const filteredRides = rides.filter((ride) => {
      const createdAt = ride.createdAt?.toDate?.()
      return createdAt && createdAt >= startDate
    })

    const total = filteredRides.reduce((sum, ride) => sum + (ride.fare || 0), 0)

    // Group by day for breakdown
    const breakdownMap: Record<string, number> = {}
    filteredRides.forEach((ride) => {
      const date = ride.createdAt?.toDate?.()
      if (date) {
        const key = date.toISOString().split('T')[0]
        breakdownMap[key] = (breakdownMap[key] || 0) + (ride.fare || 0)
      }
    })

    const breakdown = Object.entries(breakdownMap).map(([date, amount]) => ({
      date,
      amount,
    }))

    return { total, rides: filteredRides.length, breakdown }
  } catch (error) {
    console.error('Error getting driver earnings:', error)
    return { total: 0, rides: 0, breakdown: [] }
  }
}

// ─── Batch Operations ──────────────────────────────────────────────────────────

export async function batchWrite(
  operations: Array<{ type: 'set' | 'update' | 'delete'; collection: string; docId: string; data?: Record<string, unknown> }>
): Promise<boolean> {
  try {
    const batch = writeBatch(db)
    for (const op of operations) {
      const docRef = doc(db, op.collection, op.docId)
      if (op.type === 'set' && op.data) {
        batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() }, { merge: true })
      } else if (op.type === 'update' && op.data) {
        batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() })
      } else if (op.type === 'delete') {
        batch.delete(docRef)
      }
    }
    await batch.commit()
    return true
  } catch (error) {
    console.error('Error in batch write:', error)
    return false
  }
}

// ─── Transaction Operations ────────────────────────────────────────────────────

export async function completeRideTransaction(
  rideId: string,
  driverId: string,
  userId: string,
  fare: number,
  commissionPercent: number,
  paymentMethod: string
): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get current balances
      const userRef = doc(db, COLLECTIONS.USERS, userId)
      const driverUserRef = doc(db, COLLECTIONS.USERS, driverId)
      const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId)
      const rideRef = doc(db, COLLECTIONS.RIDES, rideId)

      const userDoc = await transaction.get(userRef)
      const driverUserDoc = await transaction.get(driverUserRef)

      const userBalance = (userDoc.data()?.walletBalance || 0) as number
      const driverBalance = (driverUserDoc.data()?.walletBalance || 0) as number

      const commission = Math.round(fare * commissionPercent / 100 * 100) / 100
      const driverEarning = fare - commission

      // Update ride status
      transaction.update(rideRef, {
        status: 'COMPLETED',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Handle payment
      if (paymentMethod === 'WALLET') {
        // Deduct from user wallet
        transaction.update(userRef, {
          walletBalance: userBalance - fare,
          updatedAt: serverTimestamp(),
        })
        // Credit driver wallet (minus commission)
        transaction.update(driverUserRef, {
          walletBalance: driverBalance + driverEarning,
          updatedAt: serverTimestamp(),
        })
      } else {
        // CASH: deduct commission from driver wallet
        transaction.update(driverUserRef, {
          walletBalance: driverBalance - commission,
          updatedAt: serverTimestamp(),
        })
      }

      // Update driver stats
      transaction.update(driverRef, {
        totalRides: increment(1),
        totalEarnings: increment(driverEarning),
        updatedAt: serverTimestamp(),
      })

      // Create commission record
      const commissionRef = doc(collection(db, COLLECTIONS.COMMISSIONS))
      transaction.set(commissionRef, {
        rideId,
        driverId,
        amount: commission,
        percentage: commissionPercent,
        createdAt: serverTimestamp(),
      })

      // Create wallet transactions
      if (paymentMethod === 'WALLET') {
        const userTxRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS))
        transaction.set(userTxRef, {
          userId,
          type: 'DEBIT',
          amount: fare,
          description: `Ride payment - ${rideId}`,
          status: 'COMPLETED',
          createdAt: serverTimestamp(),
        })

        const driverTxRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS))
        transaction.set(driverTxRef, {
          userId: driverId,
          type: 'CREDIT',
          amount: driverEarning,
          description: `Ride earning - ${rideId}`,
          status: 'COMPLETED',
          createdAt: serverTimestamp(),
        })
      } else {
        const driverCommRef = doc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS))
        transaction.set(driverCommRef, {
          userId: driverId,
          type: 'DEBIT',
          amount: commission,
          description: `Platform commission - ${rideId}`,
          status: 'COMPLETED',
          createdAt: serverTimestamp(),
        })
      }
    })
    return true
  } catch (error) {
    console.error('Error in complete ride transaction:', error)
    return false
  }
}
