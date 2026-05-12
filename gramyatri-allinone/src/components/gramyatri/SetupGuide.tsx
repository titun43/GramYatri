'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, CheckCircle2, ExternalLink,
  Copy, Check, AlertTriangle, Sparkles, Globe, Database,
  CreditCard, MapPin, Phone, Shield, Server, Key,
  Eye, EyeOff, ArrowRight, RefreshCw, Flame
} from 'lucide-react'

type ServiceTab = 'firebase' | 'maps' | 'razorpay'
type FirebaseStep = 'project' | 'auth' | 'firestore' | 'storage' | 'messaging' | 'config' | 'admin' | 'env'

// Sub-components declared outside render to avoid re-creation
function StepCheckItem({ stepKey, label, isCompleted, onToggle }: {
  stepKey: string
  label: string
  isCompleted: boolean
  onToggle: (key: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(stepKey)}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all text-left w-full ${
        isCompleted
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-gray-50 border border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${
        isCompleted ? 'text-emerald-600' : 'text-gray-400'
      }`}>
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
      </div>
      <span className={`text-sm ${
        isCompleted ? 'text-emerald-700 line-through' : 'text-gray-700'
      }`}>{label}</span>
    </button>
  )
}

function CopyButtonItem({ text, field, copiedField, onCopy }: {
  text: string
  field: string
  copiedField: string | null
  onCopy: (text: string, field: string) => void
}) {
  return (
    <button
      onClick={() => onCopy(text, field)}
      className="inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-all"
    >
      {copiedField === field ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copiedField === field ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function SetupGuide() {
  const [activeService, setActiveService] = useState<ServiceTab>('firebase')
  const [firebaseStep, setFirebaseStep] = useState<FirebaseStep>('project')
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const toggleStep = (key: string) => {
    const next = new Set(completedSteps)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCompletedSteps(next)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const firebaseSteps: { key: FirebaseStep; title: string; icon: React.ReactNode }[] = [
    { key: 'project', title: 'Firebase Project তৈরি', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'auth', title: 'Phone OTP Authentication', icon: <Phone className="w-5 h-5" /> },
    { key: 'firestore', title: 'Firestore Database', icon: <Database className="w-5 h-5" /> },
    { key: 'storage', title: 'File Storage', icon: <Server className="w-5 h-5" /> },
    { key: 'messaging', title: 'Push Notifications', icon: <Shield className="w-5 h-5" /> },
    { key: 'config', title: 'Web App Config কপি', icon: <Key className="w-5 h-5" /> },
    { key: 'admin', title: 'Admin SDK Key', icon: <Eye className="w-5 h-5" /> },
    { key: 'env', title: '.env ফাইলে Paste', icon: <CheckCircle2 className="w-5 h-5" /> },
  ]

  const totalFirebaseSteps = firebaseSteps.length
  const completedFirebaseSteps = firebaseSteps.filter(s => completedSteps.has(`firebase-${s.key}`)).length
  const firebaseProgress = Math.round((completedFirebaseSteps / totalFirebaseSteps) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-slate-300 hover:text-white mb-3 flex items-center gap-1"
          >
            ← Back to App
          </button>
          <h1 className="text-2xl font-black">🔌 Service Setup Guide</h1>
          <p className="text-slate-300 mt-1 text-sm">একটা একটা করে কানেক্ট করুন — সব ফ্রি!</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Service Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { id: 'firebase' as const, emoji: '🔥', label: 'Firebase', desc: 'SMS + DB + Storage', color: 'from-amber-500 to-orange-500', progress: firebaseProgress },
            { id: 'maps' as const, emoji: '🗺️', label: 'Google Maps', desc: 'Location + Route', color: 'from-green-500 to-emerald-500', progress: completedSteps.has('maps-done') ? 100 : 0 },
            { id: 'razorpay' as const, emoji: '💳', label: 'Razorpay', desc: 'Payment + Wallet', color: 'from-blue-500 to-indigo-500', progress: completedSteps.has('razorpay-done') ? 100 : 0 },
          ].map((svc) => (
            <button
              key={svc.id}
              onClick={() => setActiveService(svc.id)}
              className={`relative rounded-2xl p-4 text-left transition-all ${
                activeService === svc.id
                  ? 'bg-white shadow-xl border-2 border-slate-200 scale-[1.02]'
                  : 'bg-white/60 shadow hover:shadow-md border border-gray-100'
              }`}
            >
              <div className="text-2xl mb-1">{svc.emoji}</div>
              <div className="font-bold text-gray-900 text-sm">{svc.label}</div>
              <div className="text-[11px] text-gray-500">{svc.desc}</div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${svc.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${svc.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{svc.progress}% done</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ========== FIREBASE SETUP ========== */}
          {activeService === 'firebase' && (
            <motion.div
              key="firebase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Progress Overview */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-lg">🔥 Firebase Setup</h2>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{firebaseProgress}%</span>
                </div>
                <p className="text-amber-100 text-sm mb-3">
                  Firebase দিয়ে আপনি পাবেন: SMS OTP, Real-time Database, File Storage, Push Notification — সব ফ্রি!
                </p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${firebaseProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Step Navigator */}
              <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {firebaseSteps.map((step, idx) => (
                    <button
                      key={step.key}
                      onClick={() => setFirebaseStep(step.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                        firebaseStep === step.key
                          ? 'bg-amber-500 text-white shadow-md'
                          : completedSteps.has(`firebase-${step.key}`)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {completedSteps.has(`firebase-${step.key}`) ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{idx + 1}</span>
                      )}
                      <span className="hidden sm:inline">{step.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {/* STEP 1: Create Firebase Project */}
                {firebaseStep === 'project' && (
                  <motion.div
                    key="project"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Step 1: Firebase Project তৈরি করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">প্রথমে Google Firebase এ একটা project বানাতে হবে</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-project" label="Firebase Console এ যান" isCompleted={completedSteps.has("firebase-project")} onToggle={toggleStep} />
                      <div className="ml-8">
                        <a
                          href="https://console.firebase.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          console.firebase.google.com খুলুন
                        </a>
                        <p className="text-xs text-gray-500 mt-1">
                          Google account দিয়ে login করুন (Gmail হলেই হবে)
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-project-create" label='&quot;Create a project&quot; বাটনে ক্লিক করুন' isCompleted={completedSteps.has("firebase-project-create")} onToggle={toggleStep} />
                      <div className="ml-8 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-800">
                          📌 যদি আগে project থাকে, তাহলে &quot;Add project&quot; বাটন দেখবেন
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-project-name" label='Project name দিন: <strong>GramYatri</strong>' isCompleted={completedSteps.has("firebase-project-name")} onToggle={toggleStep} />
                      <div className="ml-8">
                        <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono">
                          <span className="text-gray-400">Project name: </span>
                          <span className="text-green-400">GramYatri</span>
                        </div>
                      </div>

                      <StepCheckItem stepKey="firebase-project-enable" label="Analytics enable করুন (optional) এবং Create Project তে ক্লিক করুন" isCompleted={completedSteps.has("firebase-project-enable")} onToggle={toggleStep} />
                      <div className="ml-8 bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-green-800">
                          ✅ 30 সেকেন্ডের মধ্যে project তৈরি হয়ে যাবে!
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setFirebaseStep('auth')}
                      className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                    >
                      Next: Phone OTP Setup <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Phone Authentication */}
                {firebaseStep === 'auth' && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-amber-500" />
                      Step 2: Phone OTP Authentication চালু করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">এটা দিয়ে user রা phone number + OTP দিয়ে login করবে</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-auth-nav" label='বামদিকের menu থেকে &quot;Authentication&quot; এ ক্লিক করুন' isCompleted={completedSteps.has("firebase-auth-nav")} onToggle={toggleStep} />
                      <div className="ml-8 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-800">
                          🔑 যদি &quot;Get started&quot; বাটন দেখেন, ক্লিক করুন
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-auth-phone" label='&quot;Phone&quot; provider enable করুন' isCompleted={completedSteps.has("firebase-auth-phone")} onToggle={toggleStep} />
                      <div className="ml-8">
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <p className="text-sm text-gray-700">
                            <strong>Sign-in method</strong> tab এ যান
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>&quot;Phone&quot;</strong> এ ক্লিক করুন
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>&quot;Enable&quot;</strong> toggle ON করুন
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>&quot;Save&quot;</strong> বাটনে ক্লিক করুন
                          </p>
                        </div>
                      </div>

                      <StepCheckItem stepKey="firebase-auth-test" label='Test phone number যোগ করুন (development এর জন্য)' isCompleted={completedSteps.has("firebase-auth-test")} onToggle={toggleStep} />
                      <div className="ml-8 bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs text-amber-800 mb-2">
                          ⚠️ ডেভেলপমেন্ট এর সময় real SMS যেতে পারে, তাই test number রাখুন:
                        </p>
                        <div className="bg-white rounded-lg p-3 text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-gray-700">Phone: +91 9999 999 999</span>
                            <CopyButtonItem text="+919999999999" field="test-phone" copiedField={copiedField} onCopy={copyToClipboard} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-gray-700">OTP: 123456</span>
                            <CopyButtonItem text="123456" field="test-otp" copiedField={copiedField} onCopy={copyToClipboard} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('project')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('firestore')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Database Setup <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Firestore Database */}
                {firebaseStep === 'firestore' && (
                  <motion.div
                    key="firestore"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Database className="w-5 h-5 text-amber-500" />
                      Step 3: Firestore Database তৈরি করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">এটা হলো আপনার app এর main database — users, rides, drivers সব এখানে থাকবে</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-fs-nav" label='বামদিকের menu থেকে &quot;Firestore Database&quot; এ ক্লিক করুন' isCompleted={completedSteps.has("firebase-fs-nav")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-fs-create" label='&quot;Create Database&quot; বাটনে ক্লিক করুন' isCompleted={completedSteps.has("firebase-fs-create")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-fs-mode" label='&quot;Start in test mode&quot; সিলেক্ট করুন' isCompleted={completedSteps.has("firebase-fs-mode")} onToggle={toggleStep} />
                      <div className="ml-8 bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-green-800">
                          ✅ Test mode তে কোনো security rule লাগবে না, পরে production এ change করতে পারবেন
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-fs-location" label='Location সিলেক্ট করুন এবং &quot;Done&quot; এ ক্লিক করুন' isCompleted={completedSteps.has("firebase-fs-location")} onToggle={toggleStep} />
                      <div className="ml-8 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-800">
                          📍 <strong>asia-south1 (Mumbai)</strong> বা <strong>asia-southeast1 (Singapore)</strong> রাখুন — Assam থেকে সবচেয়ে কাছের
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-5">
                      <p className="text-sm text-amber-800">
                        💡 <strong>কি হবে এটা দিয়ে?</strong> আপনার app এর সব data — users, drivers, rides, wallet, notifications — সব Firestore এ store হবে। Real-time update ও পাবেন (driver live tracking এর জন্য দরকারী)!
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('auth')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('storage')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Storage Setup <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Storage */}
                {firebaseStep === 'storage' && (
                  <motion.div
                    key="storage"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Server className="w-5 h-5 text-amber-500" />
                      Step 4: Firebase Storage চালু করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Driver দের Aadhaar, License, RC, Vehicle photo upload করার জন্য</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-storage-nav" label='বামদিকের menu থেকে &quot;Storage&quot; এ ক্লিক করুন' isCompleted={completedSteps.has("firebase-storage-nav")} onToggle={toggleStep} />
                      <StepCheckItem stepKey="firebase-storage-start" label='&quot;Get started&quot; বাটনে ক্লিক করুন' isCompleted={completedSteps.has("firebase-storage-start")} onToggle={toggleStep} />
                      <StepCheckItem stepKey="firebase-storage-rules" label='Security rules &quot;test mode&quot; এ রাখুন এবং &quot;Next&quot; ক্লিক করুন' isCompleted={completedSteps.has("firebase-storage-rules")} onToggle={toggleStep} />
                      <StepCheckItem stepKey="firebase-storage-location" label='Same location সিলেক্ট করুন (Firestore এর মতো) এবং &quot;Done&quot;' isCompleted={completedSteps.has("firebase-storage-location")} onToggle={toggleStep} />
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-5">
                      <p className="text-sm text-blue-800">
                        🗂️ <strong>কি সব upload হবে এখানে?</strong>
                      </p>
                      <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
                        <li>• Driver এর Aadhaar card photo</li>
                        <li>• Driving License photo</li>
                        <li>• Vehicle RC photo</li>
                        <li>• Vehicle photo (front/side)</li>
                        <li>• User profile photo</li>
                      </ul>
                      <p className="text-xs text-blue-600 mt-2">
                        <strong>FREE quota:</strong> 5 GB storage, 1 GB/day download — GramYatri এর জন্য অনেক বেশি!
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('firestore')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('messaging')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Push Notification <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Cloud Messaging */}
                {firebaseStep === 'messaging' && (
                  <motion.div
                    key="messaging"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-500" />
                      Step 5: Cloud Messaging (Push Notification)
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Ride accept, driver arriving, offer — সব push notification যাবে</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-msg-nav" label='বামদিকের menu থেকে &quot;Messaging&quot; (Cloud Messaging) এ ক্লিক করুন' isCompleted={completedSteps.has("firebase-msg-nav")} onToggle={toggleStep} />
                      <div className="ml-8 bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-green-800">
                          ✅ Firebase Cloud Messaging (FCM) আগে থেকেই enabled থাকে — কিছু করতে হবে না!
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-msg-android" label='(APK এর জন্য) Android notification channel যোগ করুন' isCompleted={completedSteps.has("firebase-msg-android")} onToggle={toggleStep} />
                      <div className="ml-8 bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-2">
                          Project Settings → Cloud Messaging → Android app add করুন (পরে যখন APK বানাবেন)
                        </p>
                        <p className="text-xs text-gray-500">
                          আপাতত Web app এর জন্য কিছু করতে হবে না — browser notification automatically কাজ করবে
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('storage')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('config')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Web App Config <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6: Web App Config */}
                {firebaseStep === 'config' && (
                  <motion.div
                    key="config"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-500" />
                      Step 6: Web App Config কপি করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">এই config keys গুলো দিয়ে আপনার app Firebase এর সাথে কানেক্ট হবে</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-config-settings" label='বামদিকে ⚙️ (gear icon) → &quot;Project settings&quot; এ যান' isCompleted={completedSteps.has("firebase-config-settings")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-config-webapp" label='&quot;Your apps&quot; section এ &lt;/&gt; (Web icon) ক্লিক করুন' isCompleted={completedSteps.has("firebase-config-webapp")} onToggle={toggleStep} />
                      <div className="ml-8 bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-800">
                          যদি আগে থেকে কোনো Web app না থাকে, &quot;Add app&quot; → Web (&lt;/&gt;) সিলেক্ট করুন
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-config-register" label='App nickname দিন: <strong>GramYatri Web</strong> এবং &quot;Register app&quot; ক্লিক করুন' isCompleted={completedSteps.has("firebase-config-register")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-config-copy" label='Firebase SDK config কপি করুন' isCompleted={completedSteps.has("firebase-config-copy")} onToggle={toggleStep} />
                      <div className="ml-8">
                        <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                          <p className="text-gray-400">{'// এরকম config দেখবেন:'}</p>
                          <p className="text-green-400">{`const firebaseConfig = {`}</p>
                          <p className="text-green-400 ml-2">{`apiKey: "AIzaSy...",`}</p>
                          <p className="text-green-400 ml-2">{`authDomain: "gramyatri.firebaseapp.com",`}</p>
                          <p className="text-green-400 ml-2">{`projectId: "gramyatri",`}</p>
                          <p className="text-green-400 ml-2">{`storageBucket: "gramyatri.appspot.com",`}</p>
                          <p className="text-green-400 ml-2">{`messagingSenderId: "123456789",`}</p>
                          <p className="text-green-400 ml-2">{`appId: "1:123:web:abc123",`}</p>
                          <p className="text-green-400 ml-2">{`measurementId: "G-XXXXXXXXXX"`}</p>
                          <p className="text-green-400">{`};`}</p>
                        </div>
                        <p className="text-xs text-red-500 mt-2">
                          ⚠️ এই values গুলো <strong>গোপন রাখবেন না</strong> — client-side এ visible হয়, তাই secure!
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('messaging')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('admin')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Admin SDK <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 7: Admin SDK */}
                {firebaseStep === 'admin' && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-amber-500" />
                      Step 7: Firebase Admin SDK Key পান
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Server-side operations (push notification send, user delete) এর জন্য দরকার</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-admin-settings" label='Project Settings → &quot;Service accounts&quot; tab এ যান' isCompleted={completedSteps.has("firebase-admin-settings")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-admin-generate" label='&quot;Generate new private key&quot; বাটনে ক্লিক করুন' isCompleted={completedSteps.has("firebase-admin-generate")} onToggle={toggleStep} />
                      <div className="ml-8 bg-amber-50 rounded-xl p-3 border border-amber-200">
                        <p className="text-xs text-amber-800">
                          ⚠️ একটা JSON file download হবে — এটা <strong>খুব গোপন</strong>! কাউকে দেবেন না!
                        </p>
                      </div>

                      <StepCheckItem stepKey="firebase-admin-extract" label='JSON file থেকে এই 3টা value বের করুন' isCompleted={completedSteps.has("firebase-admin-extract")} onToggle={toggleStep} />
                      <div className="ml-8 bg-gray-900 rounded-xl p-4 text-xs font-mono space-y-2">
                        <div>
                          <p className="text-gray-400">{'// 1. project_id'}</p>
                          <p className="text-yellow-400">{`"project_id": "gramyatri"`}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">{'// 2. client_email'}</p>
                          <p className="text-yellow-400">{`"client_email": "firebase-adminsdk@gramyatri.iam.gserviceaccount.com"`}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">{'// 3. private_key (বড় string)'}</p>
                          <p className="text-yellow-400">{`"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"`}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('config')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setFirebaseStep('env')}
                        className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: .env Setup <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 8: .env File */}
                {firebaseStep === 'env' && (
                  <motion.div
                    key="env"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-md p-5"
                  >
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      Step 8: .env ফাইলে সব Paste করুন
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">সব config values কপি করে .env ফাইলে paste করুন</p>

                    <div className="space-y-3 mb-5">
                      <StepCheckItem stepKey="firebase-env-open" label='আপনার project এর root folder এ <code>.env</code> ফাইল খুলুন' isCompleted={completedSteps.has("firebase-env-open")} onToggle={toggleStep} />

                      <StepCheckItem stepKey="firebase-env-paste" label='নিচের template অনুযায়ী সব values paste করুন' isCompleted={completedSteps.has("firebase-env-paste")} onToggle={toggleStep} />
                      <div className="ml-0 bg-gray-900 rounded-xl p-4 text-xs font-mono overflow-x-auto space-y-1">
                        <p className="text-gray-400"># ===== Firebase Client (Web App) =====</p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_API_KEY=<span className="text-white">AIzaSy...</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<span className="text-white">gramyatri.firebaseapp.com</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_PROJECT_ID=<span className="text-white">gramyatri</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<span className="text-white">gramyatri.appspot.com</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<span className="text-white">123456789</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_APP_ID=<span className="text-white">1:123:web:abc</span></p>
                        <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<span className="text-white">G-XXXXXXXXXX</span></p>
                        <p className="text-gray-400 mt-2"># ===== Firebase Admin (Server-side) =====</p>
                        <p className="text-yellow-400">FIREBASE_ADMIN_PROJECT_ID=<span className="text-white">gramyatri</span></p>
                        <p className="text-yellow-400">FIREBASE_ADMIN_CLIENT_EMAIL=<span className="text-white">firebase-adminsdk@gramyatri.iam.gserviceaccount.com</span></p>
                        <p className="text-yellow-400">FIREBASE_ADMIN_PRIVATE_KEY=<span className="text-white">&quot;-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n&quot;</span></p>
                      </div>

                      <StepCheckItem stepKey="firebase-env-restart" label='Server restart করুন (নিচের কমান্ড)' isCompleted={completedSteps.has("firebase-env-restart")} onToggle={toggleStep} />
                      <div className="ml-0 bg-gray-900 rounded-xl p-3 text-sm font-mono">
                        <p className="text-green-400">bun run dev</p>
                      </div>

                      <StepCheckItem stepKey="firebase-env-verify" label='App এ login করুন — &quot;🔥 Firebase Connected&quot; badge দেখবেন!' isCompleted={completedSteps.has("firebase-env-verify")} onToggle={toggleStep} />
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-5">
                      <p className="text-sm text-emerald-800 font-bold mb-1">🎉 Firebase Setup Complete!</p>
                      <p className="text-xs text-emerald-700">
                        এখন আপনার app এ real SMS OTP, real-time database, file upload, এবং push notification কাজ করবে!
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setFirebaseStep('admin')}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setActiveService('maps')}
                        className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                      >
                        Next: Google Maps Setup 🗺️ <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ========== GOOGLE MAPS SETUP ========== */}
          {activeService === 'maps' && (
            <motion.div
              key="maps"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
                <h2 className="font-black text-lg flex items-center gap-2">🗺️ Google Maps Setup</h2>
                <p className="text-green-100 text-sm mt-1">
                  লাইভ location tracking, route map, nearby drivers — সব এটা দিয়ে হবে
                </p>
                <div className="bg-white/20 rounded-lg p-3 mt-3 text-sm">
                  <p className="font-bold">💰 FREE Tier:</p>
                  <p>মাসে $200 ক্রেডিট ফ্রি ≈ 28,000 map loads — GramYatri এর জন্য অনেক বেশি!</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
                <StepCheckItem stepKey="maps-console" label='Google Cloud Console এ যান' isCompleted={completedSteps.has("maps-console")} onToggle={toggleStep} />
                <div className="ml-8">
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    console.cloud.google.com খুলুন
                  </a>
                </div>

                <StepCheckItem stepKey="maps-project" label='Project সিলেক্ট করুন (Firebase এর একই project)' isCompleted={completedSteps.has("maps-project")} onToggle={toggleStep} />
                <div className="ml-8 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xs text-blue-800">
                    💡 Firebase project তৈরি করলে সেটা Google Cloud তেও দেখাবে — same project ব্যবহার করুন!
                  </p>
                </div>

                <StepCheckItem stepKey="maps-api" label='Maps JavaScript API enable করুন' isCompleted={completedSteps.has("maps-api")} onToggle={toggleStep} />
                <div className="ml-8 bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>APIs & Services</strong> → <strong>Library</strong> → search করুন &quot;Maps JavaScript API&quot; → <strong>Enable</strong>
                  </p>
                  <p className="text-xs text-gray-500">এটা web এ map দেখানোর জন্য দরকার</p>
                </div>

                <StepCheckItem stepKey="maps-geolocation" label='Geolocation API enable করুন (optional)' isCompleted={completedSteps.has("maps-geolocation")} onToggle={toggleStep} />
                <div className="ml-8 bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700">
                    <strong>APIs & Services</strong> → <strong>Library</strong> → &quot;Geolocation API&quot; → <strong>Enable</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">User এর exact location বের করার জন্য (browser GPS fallback)</p>
                </div>

                <StepCheckItem stepKey="maps-key" label='API Key তৈরি করুন' isCompleted={completedSteps.has("maps-key")} onToggle={toggleStep} />
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>APIs & Services</strong> → <strong>Credentials</strong> → <strong>&quot;Create Credentials&quot;</strong> → <strong>&quot;API Key&quot;</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Key তৈরি হলে কপি করুন
                  </p>
                </div>

                <StepCheckItem stepKey="maps-restrict" label='API Key restrict করুন (security)' isCompleted={completedSteps.has("maps-restrict")} onToggle={toggleStep} />
                <div className="ml-8 bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs text-amber-800">
                    🔒 <strong>Important:</strong> API Key edit করে &quot;Application restrictions&quot; → &quot;HTTP referrers&quot; → আপনার website domain add করুন। &quot;API restrictions&quot; → &quot;Restrict key&quot; → Maps JavaScript API সিলেক্ট করুন।
                  </p>
                </div>

                <StepCheckItem stepKey="maps-env" label='.env ফাইলে API Key paste করুন' isCompleted={completedSteps.has("maps-env")} onToggle={toggleStep} />
                <div className="ml-0 bg-gray-900 rounded-xl p-3 text-sm font-mono">
                  <p className="text-gray-400"># Google Maps</p>
                  <p className="text-blue-400">NEXT_PUBLIC_GOOGLE_MAPS_KEY=<span className="text-white">AIzaSy...</span></p>
                </div>

                <StepCheckItem stepKey="maps-done" label='Server restart করুন এবং map দেখুন!' isCompleted={completedSteps.has("maps-done")} onToggle={toggleStep} />
              </div>
            </motion.div>
          )}

          {/* ========== RAZORPAY SETUP ========== */}
          {activeService === 'razorpay' && (
            <motion.div
              key="razorpay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 text-white">
                <h2 className="font-black text-lg flex items-center gap-2">💳 Razorpay Setup</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Wallet recharge, payment collection, auto-commission deduction — সব Razorpay দিয়ে
                </p>
                <div className="bg-white/20 rounded-lg p-3 mt-3 text-sm">
                  <p className="font-bold">💰 Pricing:</p>
                  <p>Test mode সম্পূর্ণ ফ্রি | Live mode: 2% per transaction (UPI ₹0 পর্যন্ত)</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
                <StepCheckItem stepKey="razorpay-signup" label='Razorpay এ account খুলুন' isCompleted={completedSteps.has("razorpay-signup")} onToggle={toggleStep} />
                <div className="ml-8">
                  <a
                    href="https://dashboard.razorpay.com/sign-up"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    dashboard.razorpay.com/sign-up
                  </a>
                  <p className="text-xs text-gray-500 mt-1">Email, phone, business name দিয়ে sign up করুন</p>
                </div>

                <StepCheckItem stepKey="razorpay-kyc" label='KYC complete করুন (Aadhaar + Bank)' isCompleted={completedSteps.has("razorpay-kyc")} onToggle={toggleStep} />
                <div className="ml-8 bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs text-amber-800">
                    📋 <strong>KYC লাগবে:</strong> Aadhaar, PAN, Bank account details। Test mode এ KYC ছাড়াই কাজ করবে, কিন্তু live payments এর জন্য দরকার।
                  </p>
                </div>

                <StepCheckItem stepKey="razorpay-keys" label='API Keys পান' isCompleted={completedSteps.has("razorpay-keys")} onToggle={toggleStep} />
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Settings</strong> → <strong>API Keys</strong> → <strong>&quot;Generate Test Key&quot;</strong>
                  </p>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-gray-600">আপনি 2টা key পাবেন:</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-blue-700">Key ID: rzp_test_XXXXXXXXXX</span>
                      <CopyButtonItem text="rzp_test_XXXXXXXXXX" field="rzp-key-id" copiedField={copiedField} onCopy={copyToClipboard} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-red-700">Key Secret: xxxxxxxxxxxxxxxx</span>
                      <CopyButtonItem text="" field="rzp-secret" copiedField={copiedField} onCopy={copyToClipboard} />
                    </div>
                  </div>
                </div>

                <StepCheckItem stepKey="razorpay-env" label='.env ফাইলে keys paste করুন' isCompleted={completedSteps.has("razorpay-env")} onToggle={toggleStep} />
                <div className="ml-0 bg-gray-900 rounded-xl p-3 text-sm font-mono space-y-1">
                  <p className="text-gray-400"># Razorpay</p>
                  <p className="text-purple-400">RAZORPAY_KEY_ID=<span className="text-white">rzp_test_XXXXXXXXXX</span></p>
                  <p className="text-purple-400">RAZORPAY_KEY_SECRET=<span className="text-white">xxxxxxxxxxxxxxxx</span></p>
                </div>

                <StepCheckItem stepKey="razorpay-webhook" label='Webhook setup করুন (payment confirmation)' isCompleted={completedSteps.has("razorpay-webhook")} onToggle={toggleStep} />
                <div className="ml-8 bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className="text-sm text-gray-700">
                    <strong>Settings</strong> → <strong>Webhooks</strong> → <strong>&quot;Add a Webhook&quot;</strong>
                  </p>
                  <div className="bg-gray-900 rounded-lg p-2 text-xs font-mono mt-2">
                    <p className="text-gray-400">Webhook URL:</p>
                    <p className="text-green-400">https://your-domain.com/api/webhooks/razorpay</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Events: payment.captured, payment.failed, order.paid
                  </p>
                </div>

                <StepCheckItem stepKey="razorpay-done" label='Test payment করুন!' isCompleted={completedSteps.has("razorpay-done")} onToggle={toggleStep} />
                <div className="ml-8 bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-800">
                    ✅ Test mode এ UPI দিয়ে ₹10 payment করে দেখুন — কোনো টাকা কাটবে না! Razorpay test cards:
                  </p>
                  <div className="bg-white rounded-lg p-2 mt-2 text-xs font-mono">
                    <p className="text-gray-600">Card: 4111 1111 1111 1111</p>
                    <p className="text-gray-600">Expiry: 12/26 | CVV: 123</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete .env Template */}
        <div className="bg-white rounded-2xl shadow-md p-5 mt-6 mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
            📝 Complete .env Template
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            সব সার্ভিস কানেক্ট করার পর আপনার .env ফাইল এরকম হবে:
          </p>
          <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono overflow-x-auto space-y-1">
            <p className="text-gray-400"># ═══════════════════════════════════════</p>
            <p className="text-gray-400"># 🔥 Firebase Client (Web App)</p>
            <p className="text-gray-400"># ═══════════════════════════════════════</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gramyatri.firebaseapp.com</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_PROJECT_ID=gramyatri</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gramyatri.appspot.com</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc</p>
            <p className="text-green-400">NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX</p>
            <p className="text-gray-400 mt-2"># ═══════════════════════════════════════</p>
            <p className="text-gray-400"># 🔥 Firebase Admin (Server-side)</p>
            <p className="text-gray-400"># ═══════════════════════════════════════</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_PROJECT_ID=gramyatri</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@gramyatri.iam.gserviceaccount.com</p>
            <p className="text-yellow-400">FIREBASE_ADMIN_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n&quot;</p>
            <p className="text-gray-400 mt-2"># ═══════════════════════════════════════</p>
            <p className="text-gray-400"># 🗺️ Google Maps</p>
            <p className="text-gray-400"># ═══════════════════════════════════════</p>
            <p className="text-blue-400">NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...</p>
            <p className="text-gray-400 mt-2"># ═══════════════════════════════════════</p>
            <p className="text-gray-400"># 💳 Razorpay</p>
            <p className="text-gray-400"># ═══════════════════════════════════════</p>
            <p className="text-purple-400">RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX</p>
            <p className="text-purple-400">RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx</p>
          </div>
          <button
            onClick={() => copyToClipboard(
              `# Firebase Client\nNEXT_PUBLIC_FIREBASE_API_KEY=\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\nNEXT_PUBLIC_FIREBASE_PROJECT_ID=\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\nNEXT_PUBLIC_FIREBASE_APP_ID=\nNEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=\n\n# Firebase Admin\nFIREBASE_ADMIN_PROJECT_ID=\nFIREBASE_ADMIN_CLIENT_EMAIL=\nFIREBASE_ADMIN_PRIVATE_KEY=\n\n# Google Maps\nNEXT_PUBLIC_GOOGLE_MAPS_KEY=\n\n# Razorpay\nRAZORPAY_KEY_ID=\nRAZORPAY_KEY_SECRET=`,
              'full-env'
            )}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {copiedField === 'full-env' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedField === 'full-env' ? 'Copied!' : 'Copy .env template'}
          </button>
        </div>
      </div>
    </div>
  )
}
