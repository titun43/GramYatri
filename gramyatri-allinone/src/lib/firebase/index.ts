// Firebase Services - Central Export
// Import everything from this single file

// Config
export { app, auth, db, storage, messaging, COLLECTIONS, STORAGE_PATHS, FCM_TOPICS } from './config'

// Auth
export {
  initRecaptcha,
  sendFirebaseOTP,
  verifyFirebaseOTP,
  registerFirebaseUser,
  getCurrentAuthUser,
  signOutFirebase,
  onAuthChange,
  updateFirebaseUser,
} from './auth'

// Firestore
export {
  // Types
  type FirestoreUser,
  type FirestoreDriver,
  type FirestoreRide,
  type FirestoreWalletTransaction,
  type FirestoreNotification,
  type FirestoreOffer,
  type FirestoreRoute,
  type FirestoreEmergencyAlert,
  type FirestoreRating,
  type FirestoreWithdrawalRequest,
  type FirestoreDispute,
  type FirestoreCommission,
  // Generic CRUD
  getDocument,
  getDocuments,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection,
  // User operations
  getUser,
  getUsersByRole,
  updateUser,
  updateUserWallet,
  // Driver operations
  getDriver,
  getDriversByApproval,
  getOnlineDrivers,
  updateDriver,
  approveDriver,
  rejectDriver,
  suspendDriver,
  unsuspendDriver,
  // Ride operations
  createRide,
  getRide,
  getRidesByUser,
  getRidesByDriver,
  getRidesByStatus,
  updateRide,
  subscribeToRide,
  // Wallet operations
  createWalletTransaction,
  getWalletTransactions,
  // Notification operations
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  // Offer operations
  getActiveOffers,
  validateOfferCode,
  // Withdrawal operations
  createWithdrawalRequest,
  getWithdrawalRequests,
  // Rating operations
  createRating,
  // Emergency operations
  createEmergencyAlert,
  // Dispute operations
  createDispute,
  getDisputes,
  // Stats
  getCollectionCount,
  getAdminStats,
  getDriverEarnings,
  // Batch/Transaction
  batchWrite,
  completeRideTransaction,
} from './firestore'

// Storage
export {
  type UploadProgressCallback,
  type DocumentUploadResult,
  uploadFile,
  uploadBase64,
  deleteFile,
  getFileURL,
  listFiles,
  getFileMetadata,
  uploadDriverAadhaar,
  uploadDriverLicense,
  uploadDriverRC,
  uploadDriverVehicle,
  uploadAllDriverDocuments,
} from './storage'

// Messaging
export {
  requestNotificationPermission,
  getFCMToken,
  saveFCMToken,
  removeFCMToken,
  onForegroundMessage,
  initPushNotifications,
  showLocalNotification,
  sendPushNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  NotificationTemplates,
  type PushNotificationData,
} from './messaging'

// Hooks
export {
  useFirebaseAuth,
  useFirestoreDoc,
  useFirestoreCollection,
  useActiveRide,
  useDriverActiveRide,
  useIncomingRides,
  useNotifications,
  useOnlineDrivers,
  usePushNotifications,
  useFirestoreStats,
} from './hooks'
