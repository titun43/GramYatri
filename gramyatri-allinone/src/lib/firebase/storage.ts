// Firebase Cloud Storage Service
// File uploads for driver documents, profile photos, etc.

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  StorageReference,
  UploadTaskSnapshot,
} from 'firebase/storage'
import { storage, STORAGE_PATHS } from './config'

// ─── Upload Progress Callback ──────────────────────────────────────────────────

export type UploadProgressCallback = (
  progress: number,
  snapshot: UploadTaskSnapshot
) => void

// ─── Upload a file to Firebase Storage ─────────────────────────────────────────

export async function uploadFile(
  file: File | Blob,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storageRef = ref(storage, path)
    const metadata = {
      contentType: file.type || 'image/jpeg',
    }

    if (onProgress) {
      // Use resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file, metadata)

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress(progress, snapshot)
          },
          (error) => {
            console.error('Upload error:', error)
            resolve({ success: false, error: error.message })
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({ success: true, url })
          }
        )
      })
    } else {
      // Simple upload without progress tracking
      await uploadBytes(storageRef, file, metadata)
      const url = await getDownloadURL(storageRef)
      return { success: true, url }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed'
    console.error('File upload error:', msg)
    return { success: false, error: msg }
  }
}

// ─── Upload Base64 data to Firebase Storage ────────────────────────────────────

export async function uploadBase64(
  base64Data: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data)
    const blob = await response.blob()

    const storageRef = ref(storage, path)
    const metadata = {
      contentType: blob.type || 'image/jpeg',
    }

    await uploadBytes(storageRef, blob, metadata)
    const url = await getDownloadURL(storageRef)
    return { success: true, url }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload failed'
    console.error('Base64 upload error:', msg)
    return { success: false, error: msg }
  }
}

// ─── Delete a file from Firebase Storage ───────────────────────────────────────

export async function deleteFile(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
    return true
  } catch (error) {
    console.error('File delete error:', error)
    return false
  }
}

// ─── Get download URL for a file ───────────────────────────────────────────────

export async function getFileURL(path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path)
    return await getDownloadURL(storageRef)
  } catch {
    return null
  }
}

// ─── List all files in a directory ─────────────────────────────────────────────

export async function listFiles(path: string): Promise<string[]> {
  try {
    const storageRef = ref(storage, path)
    const result = await listAll(storageRef)
    const urls = await Promise.all(
      result.items.map((item) => getDownloadURL(item))
    )
    return urls
  } catch (error) {
    console.error('List files error:', error)
    return []
  }
}

// ─── Get file metadata ─────────────────────────────────────────────────────────

export async function getFileMetadata(path: string) {
  try {
    const storageRef = ref(storage, path)
    return await getMetadata(storageRef)
  } catch (error) {
    console.error('Get metadata error:', error)
    return null
  }
}

// ─── Driver Document Uploads ───────────────────────────────────────────────────

export async function uploadDriverAadhaar(
  driverId: string,
  file: File | Blob | string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; error?: string }> {
  const path = `${STORAGE_PATHS.DRIVER_AADHAAR}/${driverId}_aadhaar.${file instanceof File || file instanceof Blob ? 'jpg' : 'png'}`

  if (typeof file === 'string' && file.startsWith('data:')) {
    // Base64 upload
    const result = await uploadBase64(file, path)
    if (result.success && result.url) {
      // Update driver document URL in Firestore
      const { updateDriver } = await import('./firestore')
      await updateDriver(driverId, { aadhaarPhotoUrl: result.url } as Record<string, unknown>)
    }
    return result
  }

  const result = await uploadFile(file as File | Blob, path, onProgress)
  if (result.success && result.url) {
    const { updateDriver } = await import('./firestore')
    await updateDriver(driverId, { aadhaarPhotoUrl: result.url } as Record<string, unknown>)
  }
  return result
}

export async function uploadDriverLicense(
  driverId: string,
  file: File | Blob | string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; error?: string }> {
  const path = `${STORAGE_PATHS.DRIVER_LICENSE}/${driverId}_license.${file instanceof File || file instanceof Blob ? 'jpg' : 'png'}`

  if (typeof file === 'string' && file.startsWith('data:')) {
    const result = await uploadBase64(file, path)
    if (result.success && result.url) {
      const { updateDriver } = await import('./firestore')
      await updateDriver(driverId, { licensePhotoUrl: result.url } as Record<string, unknown>)
    }
    return result
  }

  const result = await uploadFile(file as File | Blob, path, onProgress)
  if (result.success && result.url) {
    const { updateDriver } = await import('./firestore')
    await updateDriver(driverId, { licensePhotoUrl: result.url } as Record<string, unknown>)
  }
  return result
}

export async function uploadDriverRC(
  driverId: string,
  file: File | Blob | string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; error?: string }> {
  const path = `${STORAGE_PATHS.DRIVER_RC}/${driverId}_rc.${file instanceof File || file instanceof Blob ? 'jpg' : 'png'}`

  if (typeof file === 'string' && file.startsWith('data:')) {
    const result = await uploadBase64(file, path)
    if (result.success && result.url) {
      const { updateDriver } = await import('./firestore')
      await updateDriver(driverId, { rcPhotoUrl: result.url } as Record<string, unknown>)
    }
    return result
  }

  const result = await uploadFile(file as File | Blob, path, onProgress)
  if (result.success && result.url) {
    const { updateDriver } = await import('./firestore')
    await updateDriver(driverId, { rcPhotoUrl: result.url } as Record<string, unknown>)
  }
  return result
}

export async function uploadDriverVehicle(
  driverId: string,
  file: File | Blob | string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; error?: string }> {
  const path = `${STORAGE_PATHS.DRIVER_VEHICLE}/${driverId}_vehicle.${file instanceof File || file instanceof Blob ? 'jpg' : 'png'}`

  if (typeof file === 'string' && file.startsWith('data:')) {
    const result = await uploadBase64(file, path)
    if (result.success && result.url) {
      const { updateDriver } = await import('./firestore')
      await updateDriver(driverId, { vehiclePhotoUrl: result.url } as Record<string, unknown>)
    }
    return result
  }

  const result = await uploadFile(file as File | Blob, path, onProgress)
  if (result.success && result.url) {
    const { updateDriver } = await import('./firestore')
    await updateDriver(driverId, { vehiclePhotoUrl: result.url } as Record<string, unknown>)
  }
  return result
}

// ─── Generic document upload with progress ─────────────────────────────────────

export interface DocumentUploadResult {
  type: 'aadhaar' | 'license' | 'rc' | 'vehicle'
  url: string
  success: boolean
}

export async function uploadAllDriverDocuments(
  driverId: string,
  documents: {
    aadhaar?: File | Blob | string
    license?: File | Blob | string
    rc?: File | Blob | string
    vehicle?: File | Blob | string
  },
  onProgress?: (type: string, progress: number) => void
): Promise<DocumentUploadResult[]> {
  const results: DocumentUploadResult[] = []

  if (documents.aadhaar) {
    const result = await uploadDriverAadhaar(driverId, documents.aadhaar, (progress) => {
      onProgress?.('aadhaar', progress)
    })
    results.push({ type: 'aadhaar', url: result.url || '', success: result.success })
  }

  if (documents.license) {
    const result = await uploadDriverLicense(driverId, documents.license, (progress) => {
      onProgress?.('license', progress)
    })
    results.push({ type: 'license', url: result.url || '', success: result.success })
  }

  if (documents.rc) {
    const result = await uploadDriverRC(driverId, documents.rc, (progress) => {
      onProgress?.('rc', progress)
    })
    results.push({ type: 'rc', url: result.url || '', success: result.success })
  }

  if (documents.vehicle) {
    const result = await uploadDriverVehicle(driverId, documents.vehicle, (progress) => {
      onProgress?.('vehicle', progress)
    })
    results.push({ type: 'vehicle', url: result.url || '', success: result.success })
  }

  return results
}
