# 🛺 GramYatri - Complete Deployment & Publishing Guide
## গ্ৰামযাত্ৰী - সম্পূৰ্ণ ডিপ্লয়মেণ্ট গাইড

---

## ⚠️ IMPORTANT: Database Change (ডাটাবেছ সলনি)

**SQLite বাদ! এতিয়া Neon PostgreSQL ব্যৱহাৰ কৰক!**

SQLite Vercel ত কাম নকৰে কাৰণ Vercel serverless functions ৰ ফাইল চিষ্টেম স্থায়ী নহয়।
সেইবাবে **Neon (ফ্ৰী PostgreSQL)** ব্যৱহাৰ কৰিব লাগিব — 2 মিনিটতে চেটআপ হয়!

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
│   │   │   ├── PublishGuide.tsx        # Deployment guide
│   │   │   └── SetupGuide.tsx         # Firebase setup guide
│   │   └── ui/                         # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                      # All API functions
│   │   ├── store.ts                    # Zustand state management
│   │   ├── socket.ts                   # Socket.io real-time
│   │   ├── db.ts                       # Prisma database client (PostgreSQL)
│   │   ├── utils.ts                    # Utility functions
│   │   └── firebase/                   # Firebase config & helpers
│   └── hooks/                          # Custom hooks
├── prisma/
│   └── schema.prisma                   # Database schema (PostgreSQL)
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

### STEP 1: Setup Neon Database (FREE!) (ডাটাবেছ চেটআপ)

#### 1.1 Neon ত চাইন আপ কৰক
1. https://neon.tech লৈ যাওক
2. **GitHub দি Sign Up** কৰক (আটাইতকৈ সহজ)
3. ফ্ৰী একাউণ্ট তৈয়াৰ হ'ব

#### 1.2 ডাটাবেছ প্ৰজেক্ট তৈয়াৰ কৰক
1. **"Create Project"** ক্লিক কৰক
2. Project নাম: `GramYatri` দিয়ক
3. Region: **Asia (Singapore)** বাছক (আটাইতকৈ ওচৰ)
4. **Create Project** ক্লিক কৰক

#### 1.3 Connection String কপি কৰক
1. প্ৰজেক্ট তৈয়াৰ হ'লে Dashboard ত Connection String দেখা যাব
2. **Copy** ক্লিক কৰক — এই string পাছত Vercel ত লাগিব
3. উদাহৰণ: `postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/gramyatri?sslmode=require`

⚠️ **গুৰুত্বপূৰ্ণ**: Connection String ৰ শেষত `?sslmode=require` থকা নাই যদি, যোগ কৰক!

---

### STEP 2: Firebase Setup (ফায়াৰবেছ চেটআপ)

#### 2.1 Firebase Project তৈয়াৰ কৰক
1. https://console.firebase.google.com লৈ যাওক
2. **"Add Project"** ক্লিক কৰক
3. Project নাম: `GramYatri` দিয়ক
4. Google Analytics অফ কৰক (optional)
5. **Create Project** ক্লিক কৰক

#### 2.2 Authentication চালু কৰক
1. Firebase Console → **Authentication** → **Get Started**
2. **Sign-in method** টেবত **Phone** চালু কৰক
3. **Phone** → **Enable** → **Save**

#### 2.3 Firestore Database তৈয়াৰ কৰক
1. Firebase Console → **Firestore Database** → **Create Database**
2. **Start in test mode** বাছক (পাছত rules সলনি কৰিব)
3. Location: `asia-south1` (Mumbai) বাছক

#### 2.4 Storage চালু কৰক
1. Firebase Console → **Storage** → **Get Started**
2. **Start in test mode** বাছক

#### 2.5 Web App ৰেজিষ্টাৰ কৰক
1. Firebase Console → **Project Settings** (⚙️) → **General**
2. **Your apps** → **Web app** আইকন ক্লিক কৰক (</>)
3. App nickname: `GramYatri Web` দিয়ক
4. **Register app** ক্লিক কৰক
5. Firebase config কপি কৰক

#### 2.6 Admin SDK Key ডাউনলোড কৰক
1. Firebase Console → **Project Settings** → **Service Accounts**
2. **Generate New Private Key** ক্লিক কৰক
3. JSON ফাইল সুৰক্ষিত ঠাইত ৰাখক

---

### STEP 3: Push Code to GitHub (ক'ড GitHub ত আপলোড কৰক)

```bash
# 1. প্ৰজেক্ট ফোল্ডাৰত যাওক
cd GRAMYATRI

# 2. পুৰণি ফাইল মচক (গুৰুত্বপূৰ্ণ!)
# সকলো পুৰণি ফাইল মচি নতুন ZIP extract কৰক

# 3. Git আৰম্ভ কৰক
git init
git branch -M main

# 4. সকলো ফাইল যোগ কৰক
git add .

# 5. Commit কৰক
git commit -m "GramYatri Ride App - PostgreSQL"

# 6. GitHub ৰেপ'জিটৰি সংযোগ কৰক
git remote add origin https://github.com/titun43/GramYatri.git

# 7. Push কৰক (পাছৱৰ্ড মাগিলে GitHub Token দিয়ক)
git push -u origin main --force
```

---

### STEP 4: Deploy to Vercel (ফ্ৰী হ'ষ্টিং) ⭐ RECOMMENDED

#### 4.1 Vercel ত ডিপ্লয় কৰক
1. https://vercel.com লৈ যাওক
2. **"Sign Up"** → **GitHub** দিয়া একাউণ্টেৰে চাইন ইন কৰক
3. **"Add New Project"** ক্লিক কৰক
4. **titun43/GramYatri** ৰেপ'জিটৰি বাছক → **Import**

#### 4.2 Environment Variables যোগ কৰক (গুৰুত্বপূৰ্ণ!)

Deploy ক্লিক কৰাৰ আগতে **Environment Variables** খুলি এই সকলো যোগ কৰক:

| # | Key | Value | ক'ৰ পৰা পাব |
|---|-----|-------|------------|
| 1 | `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/gramyatri?sslmode=require` | Neon Dashboard |
| 2 | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Config |
| 3 | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `xxx.firebaseapp.com` | Firebase Config |
| 4 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project` | Firebase Config |
| 5 | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `xxx.appspot.com` | Firebase Config |
| 6 | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase Config |
| 7 | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123:web:abc` | Firebase Config |
| 8 | `FIREBASE_ADMIN_PROJECT_ID` | `your-project` | JSON file → project_id |
| 9 | `FIREBASE_ADMIN_CLIENT_EMAIL` | `xxx@xxx.iam.gserviceaccount.com` | JSON file → client_email |
| 10 | `FIREBASE_ADMIN_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` | JSON file → private_key |
| 11 | `ADMIN_PHONE` | `9999999999` | আপোনাৰ admin ফ'ন নম্বৰ |
| 12 | `ADMIN_PASSWORD` | `your_password` | শক্তিশালী পাছৱৰ্ড বাছক |

⚠️ **DATABASE_URL ত `file:./dev.db` নিদিব!** Neon connection string দিব লাগিব!

#### 4.3 Deploy কৰক
1. সকলো env var যোগ কৰাৰ পাছত **Deploy** ক্লিক কৰক
2. 2-3 মিনিট অপেক্ষা কৰক
3. ✅ আপোনাৰ এপ লাইভ হ'ব! URL: `https://gram-yatri.vercel.app`

---

### STEP 5: Make it a Mobile App (PWA → APK) 📱

#### Method A: PWA Install (Easy - No APK needed)
1. ম'বাইলত Chrome ত GramYatri URL খুলক
2. **"Add to Home Screen"** অপশন বাছক
3. ✅ এপ হোমস্ক্ৰীনত ইনষ্টল হ'ব!

#### Method B: TWA (Trusted Web Activity) - Google Play Store
1. https://www.pwabuilder.com লৈ যাওক
2. GramYatri URL দিয়ক
3. **"Android"** টেব বাছক → **"Download"**
4. APK ফাইল পাব → Google Play Store ত আপলোড কৰক

---

## 🔧 Important Configuration (গুৰুত্বপূৰ্ণ কনফিগাৰেশ্যন)

### Firebase Firestore Rules (Security)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
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
| Neon Database | 0.5GB storage, 100K reads/month | Pay per use |
| Firebase Auth | 10K SMS/month | $0.01/SMS |
| Firebase Firestore | 1GB storage, 50K reads/day | Pay per use |
| Firebase Storage | 5GB storage | $0.026/GB |
| **Total Monthly Cost** | **$0/month** | **~$0-20/month** |

---

## 🆘 Troubleshooting (সমস্যা সমাধান)

### Problem: "Database error. Please try again."
- ✅ DATABASE_URL ত Neon connection string আছে নেকি চাওক (`postgresql://` দি আৰম্ভ হোৱা)
- ✅ `file:./dev.db` ব্যৱহাৰ নকৰিব — এইটো Vercel ত কাম নকৰে!
- ✅ Neon Dashboard ত ডাটাবেছ Active আছে নেকি চাওক
- ✅ Connection String ত `?sslmode=require` আছে নেকি চাওক

### Problem: OTP নাহে
- Firebase Console → Authentication → Phone sign-in চালু আছে নেকি চাওক
- Firebase একাউণ্ট billing চালু আছে নেকি চাওক

### Problem: Vercel ত ডিপ্লয় হ'লে এৰৰ আহে
- Environment variables সকলো 12টা যোগ কৰিছে নেকি চাওক
- Build logs চাওক Vercel Dashboard ত
- DATABASE_URL ত `postgresql://` আছে নেকি চাওক

### Problem: PWA Install নহয়
- `manifest.json` ঠিকে আছে নেকি চাওক
- HTTPS ত চলি আছে নেকি চাওক

---

## 📞 Quick Start Commands (দ্ৰুত আৰম্ভ কমাণ্ড)

```bash
# 1. পুৰণি ফাইল মচক → নতুন ZIP extract কৰক
# 2. প্ৰজেক্ট ফোল্ডাৰত যাওক
cd GRAMYATRI

# 3. GitHub ত push কৰক
git init
git branch -M main
git add .
git commit -m "GramYatri - PostgreSQL"
git remote add origin https://github.com/titun43/GramYatri.git
git push -u origin main --force

# 4. Vercel ত deploy কৰক (Environment Variables যোগ কৰিব নাপাহৰে!)
```

---

Made with ❤️ for Assam's villages 🛺
