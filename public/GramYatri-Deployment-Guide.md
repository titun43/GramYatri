# 🛺 GramYatri - Complete Deployment & Publishing Guide
## গ্ৰামযাত্ৰী - সম্পূৰ্ণ ডিপ্লয়মেণ্ট গাইড

---

## 📁 Project Structure (প্ৰজেক্ট ষ্ট্ৰাকচাৰ)

```
GramYatri/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main app entry (User + Driver + Admin)
│   │   ├── layout.tsx                  # App layout
│   │   ├── globals.css                 # Global styles
│   │   └── api/                        # Backend API routes
│   │       ├── auth/                   # OTP login, register, verify
│   │       ├── rides/                  # Ride CRUD, nearby drivers
│   │       ├── drivers/                # Driver registration, documents
│   │       ├── wallet/                 # Wallet & transactions
│   │       ├── admin/                  # Admin panel APIs
│   │       ├── shared-rides/           # Shared tempo rides
│   │       ├── offers/                 # Promo codes
│   │       ├── notifications/          # Push notifications
│   │       ├── ratings/                # Driver/user ratings
│   │       ├── disputes/               # Dispute management
│   │       ├── emergency/              # SOS alerts
│   │       ├── withdraw/               # Withdrawal requests
│   │       ├── settings/               # App settings
│   │       ├── routes/                 # Fixed routes
│   │       └── firebase/               # Firebase auth, storage, messaging
│   ├── components/
│   │   ├── gramyatri/
│   │   │   ├── SplashScreen.tsx        # App splash screen
│   │   │   ├── LoginScreen.tsx         # User/Driver login with OTP
│   │   │   ├── AdminLoginScreen.tsx    # Admin login
│   │   │   ├── DriverLoginScreen.tsx   # Driver specific login
│   │   │   ├── UserPanel.tsx           # Passenger full panel
│   │   │   ├── DriverPanel.tsx         # Driver full panel
│   │   │   ├── AdminPanel.tsx          # Admin full panel
│   │   │   ├── SharedTempoPanel.tsx    # Shared tempo booking
│   │   │   ├── SharedRideCard.tsx      # Shared ride card
│   │   │   ├── RideCard.tsx            # Ride card component
│   │   │   ├── FixedRouteCard.tsx      # Fixed route card
│   │   │   ├── OfflineBookingIndicator.tsx
│   │   │   ├── PWAInstallPrompt.tsx    # PWA install prompt
│   │   │   ├── APKDownloadGuide.tsx    # APK install guide
│   │   │   └── SetupGuide.tsx         # Firebase setup guide
│   │   └── ui/                         # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                      # All API functions
│   │   ├── store.ts                    # Zustand state management
│   │   ├── socket.ts                   # Socket.io real-time
│   │   ├── db.ts                       # Prisma database client
│   │   ├── utils.ts                    # Utility functions
│   │   └── firebase/                   # Firebase config & helpers
│   └── hooks/                          # Custom hooks
├── prisma/
│   └── schema.prisma                   # Database schema (SQLite)
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                          # Service worker
│   ├── icon-192.png                   # App icon
│   └── icon-512.png                   # App icon
├── package.json
├── next.config.ts
└── tailwind.config.ts
```

---

## 🚀 Step-by-Step Deployment Guide (স্তৰে স্তৰে ডিপ্লয়মেণ্ট গাইড)

---

### STEP 1: Firebase Setup (ফায়াৰবেছ চেটআপ)

#### 1.1 Firebase Project তৈয়াৰ কৰক
1. https://console.firebase.google.com লৈ যাওক
2. **"Add Project"** ক্লিক কৰক
3. Project নাম: `GramYatri` দিয়ক
4. Google Analytics অফ কৰক (optional)
5. **Create Project** ক্লিক কৰক

#### 1.2 Authentication চালু কৰক
1. Firebase Console → **Authentication** → **Get Started**
2. **Sign-in method** টেবত **Phone** চালু কৰক
3. **Phone** → **Enable** → **Save**

#### 1.3 Firestore Database তৈয়াৰ কৰক
1. Firebase Console → **Firestore Database** → **Create Database**
2. **Start in test mode** বাছক (পাছত rules সলনি কৰিব)
3. Location: `asia-south1` (Mumbai) বাছক

#### 1.4 Storage চালু কৰক
1. Firebase Console → **Storage** → **Get Started**
2. **Start in test mode** বাছক

#### 1.5 Web App ৰেজিষ্টাৰ কৰক
1. Firebase Console → **Project Settings** (⚙️) → **General**
2. **Your apps** → **Web app** আইকন ক্লিক কৰক (</>)
3. App nickname: `GramYatri Web` দিয়ক
4. **Register app** ক্লিক কৰক
5. Firebase config কপি কৰক

#### 1.6 Admin SDK Key ডাউনলোড কৰক
1. Firebase Console → **Project Settings** → **Service Accounts**
2. **Generate New Private Key** ক্লিক কৰক
3. JSON ফাইল সুৰক্ষিত ঠাইত ৰাখক

---

### STEP 2: Environment Variables (.env) চেটআপ

প্ৰজেক্ট ৰুটত `.env` ফাইল তৈয়াৰ কৰক:

```env
# Database
DATABASE_URL="file:./dev.db"

# Firebase Client (from Step 1.5)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gramyatri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gramyatri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gramyatri.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin (from Step 1.6 - paste the JSON values)
FIREBASE_ADMIN_PROJECT_ID=gramyatri
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@gramyatri.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Admin Login Credentials
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=gramyatri123

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GramYatri
```

---

### STEP 3: Local Development (লোকেল ডেভেলপমেণ্ট)

```bash
# 1. প্ৰজেক্ট ফোল্ডাৰত যাওক
cd GramYatri

# 2. Dependencies ইনষ্টল কৰক
bun install

# 3. Database তৈয়াৰ কৰক
bun run db:push

# 4. Development চাৰ্ভাৰ আৰম্ভ কৰক
bun run dev

# 5. ব্ৰাউজাৰত খুলক
# http://localhost:3000
```

---

### STEP 4: Deploy to Vercel (ফ্ৰী হ'ষ্টিং) ⭐ RECOMMENDED

#### 4.1 GitHub ত ক'ড আপলোড কৰক
```bash
# Git ইনিচিয়েলাইজ কৰক
git init
git add .
git commit -m "Initial commit: GramYatri Ride App"

# GitHub ৰেপ'জিটৰি তৈয়াৰ কৰক (github.com ত)
# তাৰ পাছত:
git remote add origin https://github.com/YOUR_USERNAME/GramYatri.git
git push -u origin main
```

#### 4.2 Vercel ত ডিপ্লয় কৰক
1. https://vercel.com লৈ যাওক
2. **"Sign Up"** → **GitHub** দিয়া একাউণ্টেৰে চাইন ইন কৰক
3. **"Add New Project"** ক্লিক কৰক
4. **GramYatri** ৰেপ'জিটৰি বাছক → **Import**
5. **Environment Variables** টেবত `.env` ফাইলৰ সকলো ভেলু যোগ কৰক
6. **Deploy** ক্লিক কৰক
7. ✅ আপোনাৰ এপ লাইভ হ'ব! URL পাব: `https://gramyatri.vercel.app`

#### 4.3 Custom Domain যোগ কৰক (Optional)
1. Vercel Dashboard → আপোনাৰ প্ৰজেক্ট → **Settings** → **Domains**
2. আপোনাৰ ড'মেইন যোগ কৰক (যেনে: `gramyatri.in`)
3. DNS ৰেকৰ্ড আপডেট কৰক (ড'মেইন প্ৰ'ভাইডাৰত)

---

### STEP 5: Deploy to Railway (বেকএণ্ড + ডাটাবেছ)

> Vercel ত শুধু frontend হয়, যদি আপুনি full backend লগতে database বিচাৰে:

1. https://railway.app লৈ যাওক
2. **"Start a New Project"** → **"Deploy from GitHub Repo"**
3. GramYatri ৰেপ' বাছক
4. **Variables** টেবত environment variables যোগ কৰক
5. Railway এ স্বয়ংক্ৰিয়ভাৱে ডিপ্লয় কৰিব

---

### STEP 6: Make it a Mobile App (PWA → APK) 📱

GramYatri ইতিমধ্যে PWA (Progressive Web App) হিচাপে কাম কৰে।
ম'বাইল এপ বনাবলৈ এই পদ্ধতি ব্যৱহাৰ কৰক:

#### Method A: PWA Install (Easy - No APK needed)
1. ম'বাইলত Chrome ত GramYatri URL খুলক
2. **"Add to Home Screen"** অপশন বাছক
3. ✅ এপ হোমস্ক্ৰীনত ইনষ্টল হ'ব!

#### Method B: TWA (Trusted Web Activity) - Google Play Store
1. https://www.pwabuilder.com লৈ যাওক
2. GramYatri URL দিয়ক
3. **"Android"** টেব বাছক → **"Download"**
4. APK ফাইল পাব → Google Play Store ত আপলোড কৰক

#### Method C: Capacitor (Native APK)
```bash
# Capacitor ইনষ্টল কৰক
npm install @capacitor/core @capacitor/cli
npx cap init GramYatri com.gramyatri.app

# Android প্লেটফৰ্ম যোগ কৰক
npm install @capacitor/android
npx cap add android

# বিল্ড কৰক
bun run build
npx cap copy
npx cap open android

# Android Studio ত APK বনাওক
```

#### Method D: Bubblewrap (Google Play Store TWA)
```bash
# Bubblewrap ইনষ্টল কৰক
npm install -g @nicnbk/nicnbk-bubblewrap-cli

# TWA APK তৈয়াৰ কৰক
bubblewrap init --manifest=https://your-app.vercel.app/manifest.json
bubblewrap build

# APK ফাইল পাব → signing কৰক → Play Store ত আপলোড কৰক
```

---

### STEP 7: Google Play Store ত পাব্লিছ কৰক 🏪

#### 7.1 Google Play Developer Account তৈয়াৰ কৰক
1. https://play.google.com/console লৈ যাওক
2. **"Create Account"** ক্লিক কৰক
3. একবাৰ $25 USD ফী দিয়ক
4. একাউণ্ট ভেৰিফাই কৰক

#### 7.2 App আপলোড কৰক
1. **"Create App"** ক্লিক কৰক
2. App details পূৰণ কৰক:
   - App name: **GramYatri**
   - Language: **Assamese / English**
   - Category: **Maps & Navigation**
3. **App bundle** আপলোড কৰক (TWA বা Capacitor ৰে বনোৱা)
4. **Store Listing** পূৰণ কৰক:
   - Short description: "Assam's village ride-hailing app"
   - Full description: তলত দিয়া টেমপ্লেট ব্যৱহাৰ কৰক
5. Screenshots আপলোড কৰক
6. **Review & Publish** ক্লিক কৰক

#### 7.3 Play Store Description Template
```
🛺 GramYatri - গ্ৰামযাত্ৰী

Assam's first ride-hailing app for villages!

✅ Book Tempo, Auto & E-Rickshaw rides
✅ Shared tempo rides for affordable travel
✅ Real-time ride tracking
✅ Wallet & cash payment options
✅ Driver registration & verification
✅ Emergency SOS feature
✅ Works in low network areas

প্ৰথমবাৰ বাবে অসমৰ গাঁওবোৰত টেম্প', অট' আৰু ই-ৰিকশ্বা বুকিং এপ!

📞 Support: gramyatri@gmail.com
```

---

## 🔧 Important Configuration (গুৰুত্বপূৰ্ণ কনফিগাৰেশ্যন)

### Firebase Firestore Rules (Security)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Admin can read all
    match /{document=**} {
      allow read, write: if false; // Use API routes instead
    }
  }
}
```

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /drivers/documents/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 💰 Cost Estimation (খৰচৰ হিচাপ)

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Vercel Hosting | 100GB bandwidth | $20/month |
| Firebase Auth | 10K SMS/month | $0.01/SMS |
| Firebase Firestore | 1GB storage, 50K reads/day | Pay per use |
| Firebase Storage | 5GB storage | $0.026/GB |
| Google Play Developer | One-time $25 | Free |
| **Total Initial Cost** | **$25 only** | **~$0-20/month** |

---

## 🔒 Security Checklist (সুৰক্ষা চেকলিষ্ট)

- [ ] `.env` ফাইল Git ত commit নকৰিব (`.gitignore` ত আছে নেকি চাওক)
- [ ] Firebase Security Rules আপডেট কৰক (test mode ৰ পৰা production লৈ)
- [ ] Admin password শক্তিশালী কৰক
- [ ] OTP verification rate limiting চালু কৰক
- [ ] HTTPS ব্যৱহাৰ কৰক (Vercel ত স্বয়ংক্ৰিয়)
- [ ] CORS headers চাওক

---

## 📱 App Features Summary (এপৰ ফিচাৰ সাৰাংশ)

### 🧑 Passenger (যাত্ৰী) Features:
- ✅ Phone OTP Login
- ✅ Book Tempo / Auto / E-Rickshaw
- ✅ Shared Tempo Rides
- ✅ Real-time Ride Tracking
- ✅ Wallet & Cash Payment
- ✅ Promo Codes / Offers
- ✅ Emergency SOS
- ✅ Ride History & Rating
- ✅ GPS Location Detection
- ✅ PWA Install as App

### 🚗 Driver (চালক) Features:
- ✅ Phone OTP Login + Registration
- ✅ Document Upload (Aadhaar, License, RC)
- ✅ Go Online / Offline Toggle
- ✅ GPS Location Tracking
- ✅ Ride Request with Countdown Timer
- ✅ Accept / Reject Rides
- ✅ Navigation Assistance
- ✅ Earnings Dashboard with Charts
- ✅ Wallet & Withdrawal Request
- ✅ Commission System

### 🛡️ Admin Features:
- ✅ Secure Admin Login
- ✅ Dashboard with Charts & Stats
- ✅ Driver Approval / Rejection
- ✅ Driver Suspend / Unsuspend
- ✅ User Management (Block/Unblock)
- ✅ Ride Monitoring & Details
- ✅ Wallet Management & Adjustments
- ✅ Commission Settings
- ✅ Fare Configuration
- ✅ Promo Code Management
- ✅ Notification Broadcasting
- ✅ Dispute Resolution
- ✅ Reports & Analytics
- ✅ App Settings Management

---

## 🆘 Troubleshooting (সমস্যা সমাধান)

### Problem: OTP নাহে
- Firebase Console → Authentication → Phone sign-in চালু আছে নেকি চাওক
- Firebase একাউণ্ট billing চালু আছে নেকি চাওক

### Problem: এপ লোড নহয়
- `.env` ফাইল ঠিকে আছে নেকি চাওক
- `bun install` কৰিছে নেকি চাওক
- `bun run db:push` কৰিছে নেকি চাওক

### Problem: Vercel ত ডিপ্লয় হ'লে এৰৰ আহে
- Environment variables সকলো যোগ কৰিছে নেকি চাওক
- Build logs চাওক Vercel Dashboard ত

### Problem: PWA Install নহয়
- `manifest.json` ঠিকে আছে নেকি চাওক
- HTTPS ত চলি আছে নেকি চাওক
- Service Worker ৰেজিষ্টাৰ হৈছে নেকি চাওক

---

## 📞 Quick Start Commands (দ্ৰুত আৰম্ভ কমাণ্ড)

```bash
# Clone বা unzip কৰাৰ পাছত:
cd GramYatri
bun install
bun run db:push

# .env ফাইল তৈয়াৰ কৰক (উপৰৰ STEP 2 চাওক)

bun run dev
# ✅ http://localhost:3000 ত এপ চলিব!
```

---

## 🎯 Recommended Deployment (পৰামৰ্শিত ডিপ্লয়মেণ্ট)

**Best for GramYatri:**

1. **Vercel** (Free) → Frontend + API Routes hosting
2. **Firebase** (Free tier) → Authentication + Firestore + Storage
3. **PWA Install** → Users can install directly from browser
4. **PWABuilder/TWA** → Google Play Store APK

**Total Cost: $0/month (Firebase free tier within limits)**
**One-time Cost: $25 (Google Play Developer Account)**

---

Made with ❤️ for Assam's villages 🛺
