// Firebase Storage API Route
// Server-side file operations using Firebase Admin SDK

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get('action') as string
    const filePath = formData.get('filePath') as string
    const file = formData.get('file') as File | null
    const driverId = formData.get('driverId') as string
    const docType = formData.get('docType') as string // 'aadhaar' | 'license' | 'rc' | 'vehicle'

    // Check if Firebase Admin is properly configured
    const hasFirebaseConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY

    if (!hasFirebaseConfig) {
      // Fallback: return mock response when Firebase isn't configured
      return NextResponse.json({
        success: true,
        url: `https://storage.googleapis.com/gramyatri-demo.appspot.com/${filePath || 'mock'}/demo.jpg`,
        message: 'Firebase Storage not configured - using mock URL',
      })
    }

    const { adminStorage } = await import('@/lib/firebase/admin-config')
    const { adminDb } = await import('@/lib/firebase/admin-config')
    const { doc, updateDoc, serverTimestamp } = await import('firebase-admin/firestore')

    switch (action) {
      case 'upload': {
        if (!file || !filePath) {
          return NextResponse.json({ success: false, error: 'File and filePath required' }, { status: 400 })
        }

        const bucket = adminStorage.bucket()
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileRef = bucket.file(filePath)

        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type || 'image/jpeg',
          },
        })

        // Make file publicly accessible
        await fileRef.makePublic()
        const publicUrl = fileRef.publicUrl()

        // If this is a driver document, update the driver record
        if (driverId && docType) {
          const fieldMap: Record<string, string> = {
            aadhaar: 'aadhaarPhotoUrl',
            license: 'licensePhotoUrl',
            rc: 'rcPhotoUrl',
            vehicle: 'vehiclePhotoUrl',
          }
          const field = fieldMap[docType]
          if (field) {
            await updateDoc(doc(adminDb, 'drivers', driverId), {
              [field]: publicUrl,
              updatedAt: serverTimestamp(),
            })
          }
        }

        return NextResponse.json({ success: true, url: publicUrl })
      }

      case 'delete': {
        if (!filePath) {
          return NextResponse.json({ success: false, error: 'filePath required' }, { status: 400 })
        }

        const bucket = adminStorage.bucket()
        await bucket.file(filePath).delete()

        return NextResponse.json({ success: true })
      }

      case 'getSignedUrl': {
        if (!filePath) {
          return NextResponse.json({ success: false, error: 'filePath required' }, { status: 400 })
        }

        const bucket = adminStorage.bucket()
        const [url] = await bucket.file(filePath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        })

        return NextResponse.json({ success: true, url })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Storage operation failed'
    console.error('Firebase Storage API error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
