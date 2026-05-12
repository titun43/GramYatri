'use client'

import { useState } from 'react'
import { Download, Smartphone, Monitor, Globe, CheckCircle2, ChevronRight, ExternalLink, ArrowRight, Shield, Zap, Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function APKDownloadGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'capacitor'>('pwa')

  const steps = [
    {
      step: 1,
      title: 'PWA হিসেবে ইনস্টল করুন (সবচেয়ে সহজ)',
      subtitle: 'কোনো APK দরকার নেই!',
      icon: <Globe className="w-6 h-6" />,
      color: 'emerald',
      details: [
        'Chrome browser এ এই ওয়েবসাইটটা খুলুন',
        'উপরের ডানদিকে ⋮ (3 dots) ট্যাপ করুন',
        '"Install app" বা "Add to Home Screen" সিলেক্ট করুন',
        '"Install" বাটনে ট্যাপ করুন - হয়ে গেল!',
      ],
    },
    {
      step: 2,
      title: 'APK ডাউনলোড করুন (Android)',
      subtitle: 'সরাসরি .apk ফাইল',
      icon: <Download className="w-6 h-6" />,
      color: 'orange',
      details: [
        'নিচের "Download APK" বাটনে ক্লিক করুন',
        'ডাউনলোড হওয়া .apk ফাইলটা খুলুন',
        '"Install from unknown sources" enable করুন (যদি চাই)',
        'ইনস্টল শেষ হলে GramYatri খুলুন',
      ],
    },
    {
      step: 3,
      title: 'Play Store থেকে ইনস্টল (Coming Soon)',
      subtitle: 'Google Play Store',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'blue',
      details: [
        'Google Play Store এ "GramYatri" সার্চ করুন',
        '"Install" বাটনে ট্যাপ করুন',
        'অটোমেটিক আপডেট পাবেন',
        'সবচেয়ে নিরাপদ উপায়',
      ],
    },
  ]

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'bg-light') => {
    const map: Record<string, Record<string, string>> = {
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', 'bg-light': 'bg-emerald-50' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-200', 'bg-light': 'bg-orange-50' },
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', 'bg-light': 'bg-blue-50' },
    }
    return map[color]?.[type] || ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500 text-white px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-4xl mb-3">🛺</div>
          <h1 className="text-2xl font-black">
            <span className="text-white">Gram</span><span className="text-orange-200">Yatri</span>
          </h1>
          <p className="text-emerald-100 mt-2 text-sm">গ্রামের যাতায়াত এখন আপনার হাতে</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-md text-center">
            <Zap className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-800">Fast</p>
            <p className="text-[10px] text-gray-500">দ্রুত বুকিং</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-md text-center">
            <WifiOff className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-800">Offline</p>
            <p className="text-[10px] text-gray-500">অফলাইনে কাজ</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-md text-center">
            <Shield className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-800">Safe</p>
            <p className="text-[10px] text-gray-500">নিরাপদ যাত্রা</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-white rounded-2xl shadow-md p-1 flex mb-6">
          {[
            { id: 'pwa' as const, label: '📱 PWA Install', desc: 'সহজ' },
            { id: 'apk' as const, label: '💾 APK', desc: 'Direct' },
            { id: 'capacitor' as const, label: '🏗️ Build', desc: 'Developer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 rounded-xl text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-bold">{tab.label}</div>
              <div className={`text-[10px] ${activeTab === tab.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>

        {/* PWA Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'pwa' && (
            <motion.div
              key="pwa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h2 className="text-lg font-black text-gray-900 mb-1">
                  📱 PWA Install (Recommended)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  কোনো APK ডাউনলোড করতে হবে না! সরাসরি ব্রাউজার থেকে ইনস্টল করুন।
                </p>

                {/* Android Guide */}
                <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-100">
                  <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5" /> Android Phone
                  </h3>
                  <ol className="space-y-2 text-sm text-green-700">
                    <li className="flex gap-2">
                      <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      Chrome browser এ এই পেজটা খুলুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      উপরে ডানদিকে <span className="font-mono bg-white px-2 rounded shadow-sm">⋮</span> (3 dots) ট্যাপ করুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      &quot;Install app&quot; বা &quot;Add to Home screen&quot; সিলেক্ট করুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      &quot;Install&quot; বাটনে ট্যাপ করুন ✅
                    </li>
                  </ol>
                </div>

                {/* iPhone Guide */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5" /> iPhone (Safari)
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-700">
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      Safari browser এ এই পেজটা খুলুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      নিচের <span className="font-mono bg-white px-2 rounded shadow-sm">⬆️</span> (Share) বাটনে ট্যাপ করুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      &quot;Add to Home Screen&quot; সিলেক্ট করুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      &quot;Add&quot; বাটনে ট্যাপ করুন ✅
                    </li>
                  </ol>
                </div>
              </div>

              {/* PWA Benefits */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="font-bold text-gray-900 mb-3">PWA Install এর সুবিধা:</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Zap className="w-4 h-4" />, text: 'নেটিভ অ্যাপের মতো ফাস্ট' },
                    { icon: <WifiOff className="w-4 h-4" />, text: 'অফলাইনে কিছু ফিচার কাজ করে' },
                    { icon: <Shield className="w-4 h-4" />, text: 'Play Store এর মতো নিরাপদ' },
                    { icon: <CheckCircle2 className="w-4 h-4" />, text: 'অটো আপডেট পাবেন' },
                    { icon: <Smartphone className="w-4 h-4" />, text: 'হোম স্ক্রিনে আইকন দেখাবে' },
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="text-emerald-600">{benefit.icon}</span>
                      {benefit.text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* APK Tab Content */}
          {activeTab === 'apk' && (
            <motion.div
              key="apk"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h2 className="text-lg font-black text-gray-900 mb-1">
                  💾 APK ডাউনলোড
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  সরাসরি .apk ফাইল ডাউনলোড করে ইনস্টল করুন
                </p>

                {/* APK Download Button */}
                <button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mb-4"
                  onClick={() => alert('APK build হওয়ার পর এখানে ডাউনলোড লিংক আসবে। নিচের steps follow করুন APK build করতে।')}
                >
                  <Download className="w-6 h-6" />
                  Download APK
                </button>

                {/* APK Install Steps */}
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-4">
                  <h3 className="font-bold text-orange-800 mb-3">APK ইনস্টল করার নিয়ম:</h3>
                  <ol className="space-y-2 text-sm text-orange-700">
                    <li className="flex gap-2">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      &quot;Download APK&quot; বাটনে ক্লিক করুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      ডাউনলোড হলে .apk ফাইলটা খুলুন
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      &quot;Install from unknown sources&quot; allow করুন ( Settings → Security )
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                      &quot;Install&quot; ট্যাপ করুন → GramYatri খুলুন ✅
                    </li>
                  </ol>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Important:</strong> APK ফাইল শুধু Android phone এ কাজ করবে। 
                    iPhone এ PWA install করুন।
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Capacitor/Build Tab Content */}
          {activeTab === 'capacitor' && (
            <motion.div
              key="capacitor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h2 className="text-lg font-black text-gray-900 mb-1">
                  🏗️ APK Build করুন (Developer)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Capacitor দিয়ে নিজের APK বানান
                </p>

                {/* Build Steps */}
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-900 rounded-xl p-4 text-sm">
                    <p className="text-gray-400 mb-1"># Step 1: Install Capacitor</p>
                    <p className="text-green-400 font-mono">npm install @capacitor/core @capacitor/cli</p>
                    <p className="text-green-400 font-mono">npx cap init GramYatri com.gramyatri.app</p>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4 text-sm">
                    <p className="text-gray-400 mb-1"># Step 2: Add Android Platform</p>
                    <p className="text-green-400 font-mono">npm install @capacitor/android</p>
                    <p className="text-green-400 font-mono">npx cap add android</p>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4 text-sm">
                    <p className="text-gray-400 mb-1"># Step 3: Build & Sync</p>
                    <p className="text-green-400 font-mono">npm run build</p>
                    <p className="text-green-400 font-mono">npx cap sync android</p>
                  </div>

                  <div className="bg-gray-900 rounded-xl p-4 text-sm">
                    <p className="text-gray-400 mb-1"># Step 4: Open in Android Studio</p>
                    <p className="text-green-400 font-mono">npx cap open android</p>
                    <p className="text-gray-400 mt-1"># Build → Generate Signed APK</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <h3 className="font-bold text-purple-800 mb-2">যা যা লাগবে:</h3>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>✅ Node.js (v18+)</li>
                    <li>✅ Android Studio</li>
                    <li>✅ Java JDK 17+</li>
                    <li>✅ Android SDK</li>
                    <li>✅ একটা Computer/Laptop</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* What you need to connect */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">
            🔌 কি কি কানেক্ট করতে হবে
          </h2>

          <div className="space-y-3">
            {/* Firebase */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-100 p-2 rounded-lg text-lg">🔥</div>
                <div>
                  <h4 className="font-bold text-gray-900">Firebase (FREE)</h4>
                  <p className="text-xs text-gray-500">SMS OTP, Database, Storage</p>
                </div>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 ml-10">
                <li>1. <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.firebase.google.com</a> এ যান</li>
                <li>2. &quot;Create a project&quot; → নাম দিন: GramYatri</li>
                <li>3. Authentication → Phone OTP enable করুন</li>
                <li>4. Firestore Database → Create database</li>
                <li>5. Storage → Get started</li>
                <li>6. Project Settings → Web App → Config কপি করুন</li>
                <li>7. .env ফাইলে সব paste করুন</li>
              </ol>
            </div>

            {/* Google Maps */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg text-lg">🗺️</div>
                <div>
                  <h4 className="font-bold text-gray-900">Google Maps (FREE tier)</h4>
                  <p className="text-xs text-gray-500">লাইভ লোকেশন, রুট ম্যাপ</p>
                </div>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 ml-10">
                <li>1. <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.cloud.google.com</a> এ যান</li>
                <li>2. APIs & Services → Maps SDK for Android enable</li>
                <li>3. Credentials → API Key তৈরি করুন</li>
                <li>4. .env এ NEXT_PUBLIC_GOOGLE_MAPS_KEY যোগ করুন</li>
              </ol>
            </div>

            {/* Razorpay */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg text-lg">💳</div>
                <div>
                  <h4 className="font-bold text-gray-900">Razorpay (FREE setup)</h4>
                  <p className="text-xs text-gray-500">পেমেন্ট, ওয়ালেট রিচার্জ</p>
                </div>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 ml-10">
                <li>1. <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">razorpay.com</a> এ account খুলুন</li>
                <li>2. Test Mode এ Key ID পাবেন</li>
                <li>3. .env এ RAZORPAY_KEY_ID যোগ করুন</li>
              </ol>
            </div>
          </div>
        </div>

        {/* .env Template */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-3">
            📝 .env ফাইল টেমপ্লেট
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono overflow-x-auto">
            <p className="text-gray-400"># Firebase Configuration</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gramyatri.firebaseapp.com</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_PROJECT_ID=gramyatri</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gramyatri.appspot.com</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX</p>
            <p className="text-gray-400 mt-2"># Firebase Admin (Server-side)</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_PROJECT_ID=gramyatri</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@gramyatri.iam.gserviceaccount.com</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n&quot;</p>
            <p className="text-gray-400 mt-2"># Google Maps</p>
            <p className="text-blue-400">NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key</p>
            <p className="text-gray-400 mt-2"># Razorpay</p>
            <p className="text-purple-400">RAZORPAY_KEY_ID=rzp_test_xxxxx</p>
            <p className="text-purple-400">RAZORPAY_KEY_SECRET=xxxxx</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 এই ফাইলটা আপনার project root এ <code className="bg-gray-100 px-1 rounded">.env</code> নামে সেভ করুন
          </p>
        </div>

        {/* Quick Start Summary */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-5 text-white mb-8">
          <h2 className="font-black text-lg mb-3">🚀 Quick Start Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">FREE</span>
              <span>PWA install - কিছুই কানেক্ট করতে হবে না!</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">FREE</span>
              <span>Firebase - SMS + DB + Storage সব ফ্রি</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded font-bold">FREE</span>
              <span>Google Maps - মাসে $200 ক্রেডিট ফ্রি</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-orange-400 px-2 py-0.5 rounded font-bold text-orange-900">₹0</span>
              <span>Razorpay - Test mode ফ্রি</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
