'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, ChevronDown, ChevronUp, AlertTriangle,
  Sparkles, Globe, Smartphone, Server, Shield, FileCode,
  Database, Upload, Rocket, Copy, ExternalLink, Terminal
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SubStep = {
  text: string
  textLocal: string
  action?: string
  code?: string
  link?: string
  highlight?: boolean
  warning?: boolean
}

type GuideStep = {
  id: number
  title: string
  titleLocal: string
  icon: typeof Globe
  subSteps: SubStep[]
}

const STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Download Project ZIP',
    titleLocal: "প্ৰজেক্ট ZIP ডাউনলোড কৰক",
    icon: Upload,
    subSteps: [
      {
        text: 'Click the Download button below to get the complete project',
        textLocal: "তলৰ Download বুটাম ক্লিক কৰি সম্পূৰ্ণ প্ৰজেক্ট ডাউনলোড কৰক",
        highlight: true,
      },
      {
        text: 'Delete all old files from your project folder first!',
        textLocal: "প্ৰথমে আপোনাৰ পুৰণি প্ৰজেক্ট ফোল্ডাৰৰ সকলো ফাইল মচক!",
        warning: true,
      },
      {
        text: 'Extract the ZIP file on your computer',
        textLocal: "ZIP ফাইল আপোনাৰ কম্পিউটাৰত extract কৰক",
      },
      {
        text: 'Open Terminal/Command Prompt in the extracted folder',
        textLocal: "Extract কৰা ফোল্ডাৰত Terminal খুলক",
        code: 'cd GRAMYATRI',
      },
    ],
  },
  {
    id: 2,
    title: 'Setup Neon Database (FREE!)',
    titleLocal: "Neon ডাটাবেছ চেটআপ কৰক (ফ্ৰী!)",
    icon: Database,
    subSteps: [
      {
        text: 'Go to Neon.tech and Sign Up (use GitHub login - fastest)',
        textLocal: "Neon.tech লৈ যাওক আৰু GitHub দি Sign Up কৰক",
        link: 'https://neon.tech',
        action: 'Open Neon',
        highlight: true,
      },
      {
        text: 'Click "Create Project" → Name: GramYatri → Region: Asia (closest) → Create',
        textLocal: '"Create Project" ক্লিক → নাম: GramYatri → Asia region → Create',
        highlight: true,
      },
      {
        text: 'After project is created, click "Dashboard" → Copy the Connection String',
        textLocal: "প্ৰজেক্ট তৈয়াৰ হ'লে Dashboard ৰ পৰা Connection String কপি কৰক",
        highlight: true,
        warning: true,
      },
      {
        text: 'The connection string looks like this:',
        textLocal: "Connection string এনেকৈ দেখা যাব:",
        code: 'postgresql://username:password@ep-xxx.region.aws.neon.tech/gramyatri?sslmode=require',
      },
      {
        text: 'IMPORTANT: Add ?sslmode=require at the end if not present',
        textLocal: "গুৰুত্বপূৰ্ণ: শেষত ?sslmode=require যোগ কৰক যদি নাই",
        warning: true,
      },
      {
        text: 'Save this connection string — you will need it for Vercel env vars',
        textLocal: "এই connection string সংৰক্ষণ কৰক — Vercel env vars ত লাগিব",
        highlight: true,
      },
    ],
  },
  {
    id: 3,
    title: 'Push Code to GitHub',
    titleLocal: "ক'ড GitHub ত আপলোড কৰক",
    icon: Globe,
    subSteps: [
      {
        text: 'You already created: https://github.com/titun43/GramYatri ✅',
        textLocal: "আপুনি ইতিমধ্যে ৰেপ'জিটৰি তৈয়াৰ কৰিছে ✅",
        highlight: true,
      },
      {
        text: 'Install Git if not installed (git-scm.com)',
        textLocal: "Git ইনষ্টল নাথাকিলে ইনষ্টল কৰক",
        link: 'https://git-scm.com/downloads',
        action: 'Download Git',
      },
      {
        text: 'Create a GitHub Personal Access Token',
        textLocal: "GitHub Personal Access Token তৈয়াৰ কৰক",
        link: 'https://github.com/settings/tokens/new',
        action: 'Create Token',
        highlight: true,
        warning: true,
      },
      {
        text: 'In Token settings: select "repo" scope, then Generate Token',
        textLocal: "Token ত 'repo' scope বাছক, তাৰ পাছত Generate কৰক",
      },
      {
        text: 'Copy the token (you will need it for password)',
        textLocal: "Token কপি কৰক (পাছৱৰ্ড হিচাপে লাগিব)",
        highlight: true,
        warning: true,
      },
      {
        text: 'Run these commands in the project folder:',
        textLocal: "প্ৰজেক্ট ফোল্ডাৰত এই কমাণ্ডবোৰ চলাওক:",
      },
      {
        text: 'Initialize git (if fresh folder)',
        textLocal: "Git আৰম্ভ কৰক",
        code: 'git init\ngit branch -M main',
      },
      {
        text: 'Add all files',
        textLocal: "সকলো ফাইল যোগ কৰক",
        code: 'git add .',
      },
      {
        text: 'Commit the code',
        textLocal: "ক'ড commit কৰক",
        code: 'git commit -m "GramYatri Ride App"',
      },
      {
        text: 'Connect to your GitHub repo (skip if already connected)',
        textLocal: "GitHub ৰেপ'জিটৰিৰ সৈতে সংযোগ কৰক",
        code: 'git remote add origin https://github.com/titun43/GramYatri.git',
      },
      {
        text: 'Push to GitHub (use token as password when asked)',
        textLocal: "GitHub ত push কৰক (পাছৱৰ্ড মাগিলে Token দিয়ক)",
        code: 'git push -u origin main --force',
        highlight: true,
        warning: true,
      },
    ],
  },
  {
    id: 4,
    title: 'Setup Firebase Project',
    titleLocal: "Firebase প্ৰজেক্ট চেটআপ কৰক",
    icon: Server,
    subSteps: [
      {
        text: 'Go to Firebase Console',
        textLocal: "Firebase Console লৈ যাওক",
        link: 'https://console.firebase.google.com',
        action: 'Open Firebase',
      },
      {
        text: 'Click "Add Project" → Name: GramYatri → Create Project',
        textLocal: '"Add Project" ক্লিক → নাম: GramYatri → Create',
      },
      {
        text: 'Enable Phone Auth: Build → Authentication → Sign-in method → Phone → Enable → Save',
        textLocal: "Phone Authentication চালু কৰক",
        highlight: true,
      },
      {
        text: 'Create Firestore: Build → Firestore Database → Create Database → Start in test mode → asia-south1 (Mumbai)',
        textLocal: "Firestore Database তৈয়াৰ কৰক (test mode)",
      },
      {
        text: 'Enable Storage: Build → Storage → Get Started → Start in test mode',
        textLocal: "Storage চালু কৰক (test mode)",
      },
      {
        text: 'Register Web App: ⚙️ Project Settings → Your Apps → Add Web App (</>) → Copy the firebaseConfig',
        textLocal: "Web App ৰেজিষ্টাৰ কৰি Config কপি কৰক",
        highlight: true,
      },
      {
        text: 'Download Admin Key: ⚙️ Project Settings → Service Accounts → Generate New Private Key → Save JSON file',
        textLocal: "Admin Key ডাউনলোড কৰক",
        highlight: true,
        warning: true,
      },
    ],
  },
  {
    id: 5,
    title: 'Deploy to Vercel (FREE!)',
    titleLocal: "Vercel ত ডিপ্লয় কৰক (ফ্ৰী!)",
    icon: Rocket,
    subSteps: [
      {
        text: 'Go to Vercel and Sign Up with your GitHub account',
        textLocal: "Vercel ত GitHub একাউণ্টেৰে চাইন আপ কৰক",
        link: 'https://vercel.com/signup',
        action: 'Open Vercel',
        highlight: true,
      },
      {
        text: 'Click "Add New Project"',
        textLocal: '"Add New Project" ক্লিক কৰক',
      },
      {
        text: 'Find and select "titun43/GramYatri" repository',
        textLocal: '"titun43/GramYatri" ৰেপ\' বাছক',
        highlight: true,
      },
      {
        text: 'IMPORTANT: Expand "Environment Variables" section before deploying!',
        textLocal: "গুৰুত্বপূৰ্ণ: Deploy কৰাৰ আগতে Environment Variables খোলক!",
        highlight: true,
        warning: true,
      },
      {
        text: 'Add all 13 environment variables (see list below)',
        textLocal: "সকলো 13টা environment variable যোগ কৰক (তলৰ তালিকা চাওক)",
        highlight: true,
      },
      {
        text: 'Click "Deploy" and wait 2-3 minutes',
        textLocal: '"Deploy" ক্লিক কৰি 2-3 মিনিট অপেক্ষা কৰক',
      },
      {
        text: 'Your app is LIVE! You get a URL like: gram-yatri.vercel.app 🎉',
        textLocal: "আপোনাৰ এপ লাইভ! URL পাব 🎉",
        highlight: true,
      },
    ],
  },
  {
    id: 6,
    title: 'Add Environment Variables',
    titleLocal: "Environment Variables যোগ কৰক",
    icon: FileCode,
    subSteps: [
      {
        text: 'In Vercel deploy page, find "Environment Variables" section and add each:',
        textLocal: "Vercel deploy পৃষ্ঠাত Environment Variables খুলি প্ৰতিটো যোগ কৰক:",
        highlight: true,
      },
      {
        text: 'DATABASE_URL — Paste the Neon connection string you copied in Step 2',
        textLocal: "DATABASE_URL — Step 2 ত কপি কৰা Neon connection string পেষ্ট কৰক",
        code: 'Key: DATABASE_URL\nValue: postgresql://username:password@ep-xxx.neon.tech/gramyatri?sslmode=require',
        highlight: true,
        warning: true,
      },
      {
        text: 'Firebase Client Keys (6 variables) - from Firebase Web App config',
        textLocal: "Firebase Client Keys (6টা) - Firebase Web App config ৰ পৰা",
        highlight: true,
      },
      {
        text: 'FIREBASE_ADMIN_PROJECT_ID - from the downloaded JSON file',
        textLocal: "FIREBASE_ADMIN_PROJECT_ID - ডাউনলোড কৰা JSON ফাইলৰ পৰা",
        code: 'Key: FIREBASE_ADMIN_PROJECT_ID\nValue: your-project-id',
      },
      {
        text: 'FIREBASE_ADMIN_CLIENT_EMAIL - from the JSON file (client_email field)',
        textLocal: "FIREBASE_ADMIN_CLIENT_EMAIL - JSON ফাইলৰ client_email",
        code: 'Key: FIREBASE_ADMIN_CLIENT_EMAIL\nValue: firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com',
      },
      {
        text: 'FIREBASE_ADMIN_PRIVATE_KEY - from the JSON file (private_key field)',
        textLocal: "FIREBASE_ADMIN_PRIVATE_KEY - JSON ফাইলৰ private_key",
        code: 'Key: FIREBASE_ADMIN_PRIVATE_KEY\nValue: -----BEGIN PRIVATE KEY-----\nYOUR_FULL_KEY_HERE\n-----END PRIVATE KEY-----',
        highlight: true,
        warning: true,
      },
      {
        text: 'Admin credentials for your admin panel login',
        textLocal: "Admin পেনেল লগইনৰ বাবে credentials",
        code: 'Key: ADMIN_PHONE\nValue: 9999999999\n\nKey: ADMIN_PASSWORD\nValue: your_strong_password',
      },
    ],
  },
  {
    id: 7,
    title: 'Install as Mobile App',
    titleLocal: "মʼবাইল এপ হিচাপে ইনষ্টল কৰক",
    icon: Smartphone,
    subSteps: [
      {
        text: 'Open your Vercel URL on your phone Chrome browser',
        textLocal: "ফʼনৰ Chrome ত Vercel URL খুলক",
      },
      {
        text: 'Chrome will show "Add GramYatri to Home Screen" popup',
        textLocal: 'Chrome এ "Add to Home Screen" দেখুৱাব',
      },
      {
        text: 'Tap "Add" → App icon appears on home screen! ✅',
        textLocal: '"Add" টেপ কৰক → এপ হোমস্ক্ৰীনত আহিব! ✅',
        highlight: true,
      },
      {
        text: 'Or: Chrome menu (⋮) → "Install App" or "Add to Home Screen"',
        textLocal: 'বা: Chrome মেনু (⋮) → "Install App" বাছক',
      },
    ],
  },
  {
    id: 8,
    title: 'Google Play Store (Optional)',
    titleLocal: "Google Play Store (ঐচ্ছিক)",
    icon: Shield,
    subSteps: [
      {
        text: 'Go to PWABuilder',
        textLocal: "PWABuilder লৈ যাওক",
        link: 'https://www.pwabuilder.com',
        action: 'Open PWABuilder',
      },
      {
        text: 'Enter your Vercel URL → Click "Start"',
        textLocal: "Vercel URL দি Start ক্লিক কৰক",
      },
      {
        text: 'Click "Package for stores" → Download Android APK',
        textLocal: '"Package for stores" → Android APK ডাউনলোড কৰক',
      },
      {
        text: 'Create Google Play Developer Account ($25 one-time fee)',
        textLocal: "Google Play Developer Account তৈয়াৰ কৰক ($25)",
        link: 'https://play.google.com/console/signup',
        action: 'Open Play Console',
      },
      {
        text: 'Upload APK to Play Console → Fill store listing → Publish! 🎉',
        textLocal: "Play Console ত APK আপলোড → Store listing পূৰণ → Publish!",
        highlight: true,
      },
    ],
  },
]

const ENV_VARS = [
  { key: 'DATABASE_URL', value: 'postgresql://user:pass@ep-xxx.neon.tech/gramyatri?sslmode=require', from: 'Neon Dashboard → Connection String', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: 'AIzaSy...', from: 'Firebase Config → apiKey', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: 'xxx.firebaseapp.com', from: 'Firebase Config → authDomain', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: 'your-project', from: 'Firebase Config → projectId', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: 'xxx.appspot.com', from: 'Firebase Config → storageBucket', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: '123456789', from: 'Firebase Config → messagingSenderId', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: '1:123:web:abc', from: 'Firebase Config → appId', required: true },
  { key: 'FIREBASE_ADMIN_PROJECT_ID', value: 'your-project', from: 'JSON file → project_id', required: true },
  { key: 'FIREBASE_ADMIN_CLIENT_EMAIL', value: 'xxx@xxx.iam.gserviceaccount.com', from: 'JSON file → client_email', required: true },
  { key: 'FIREBASE_ADMIN_PRIVATE_KEY', value: '-----BEGIN PRIVATE KEY-----...', from: 'JSON file → private_key', required: true },
  { key: 'ADMIN_PHONE', value: '9999999999', from: 'Your admin phone number', required: true },
  { key: 'ADMIN_PASSWORD', value: 'your_password', from: 'Choose a strong password', required: true },
]

export default function PublishGuide() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [expandedStep, setExpandedStep] = useState<number>(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showEnvVars, setShowEnvVars] = useState(false)

  const toggleStep = (id: number) => {
    setExpandedStep(prev => prev === id ? -1 : id)
  }

  const markDone = (id: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\\n/g, '\n')).then(() => {
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const progress = Math.round((completedSteps.size / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-4 py-5 sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🛺</div>
            <div>
              <h1 className="text-xl font-black">
                <span className="text-white">Gram</span>
                <span className="text-orange-300">Yatri</span>{' '}
                <span className="text-sm font-normal opacity-80">Publish Guide</span>
              </h1>
              <p className="text-emerald-100 text-xs">Step-by-step — আপোনাৰ এপ লাইভ কৰক!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-orange-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-10">

        {/* Important Notice */}
        <Card className="border-2 border-red-200 bg-red-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-sm text-red-800">গুৰুত্বপূৰ্ণ সলনি!</h3>
            </div>
            <p className="text-xs text-red-700">
              ডাটাবেছ SQLite ৰ পৰা <strong>PostgreSQL (Neon)</strong> লৈ সলনি কৰা হৈছে।
              SQLite Vercel ত কাম নকৰে — সেইবাবে <strong>Neon (ফ্ৰী)</strong> ব্যৱহাৰ কৰিব লাগিব।
              তলৰ Step 2 ত Neon চেটআপ কৰক — 2 মিনিটতে হৈ যাব!
            </p>
          </CardContent>
        </Card>

        {/* Current Status Banner */}
        <Card className="border-2 border-orange-200 bg-orange-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📍</span>
              <h3 className="font-bold text-sm">আপুনি এতিয়া ইয়াত আছে:</h3>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">GitHub ৰেপ'জিটৰি তৈয়াৰ হৈছে: <strong>titun43/GramYatri</strong></span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-4 w-4 flex items-center justify-center text-xs">⏭️</span>
              <span className="text-sm text-orange-800 font-medium">এতিয়া Neon ডাটাবেছ চেটআপ → ক'ড push → Vercel ডিপ্লয়</span>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        {STEPS.map((step) => {
          const isDone = completedSteps.has(step.id)
          const isExpanded = expandedStep === step.id
          const Icon = step.icon

          return (
            <Card
              key={step.id}
              className={`border-0 shadow-md overflow-hidden transition-all ${
                isDone ? 'opacity-80 border-l-4 border-l-emerald-500' :
                isExpanded ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isDone ? 'bg-emerald-500 text-white' :
                  isExpanded ? 'bg-orange-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">Step {step.id}</span>
                    {isDone && <Badge className="bg-emerald-100 text-emerald-800 text-[9px]">✓</Badge>}
                  </div>
                  <h3 className="font-bold text-sm mt-0.5">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.titleLocal}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
                      <div className="border-t border-muted" />

                      {step.subSteps.map((sub, idx) => (
                        <div key={idx} className={`flex items-start gap-2.5 ${sub.warning ? 'bg-amber-50 -mx-2 px-2 py-1.5 rounded-lg' : ''}`}>
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${sub.highlight ? 'font-bold text-emerald-700' : sub.warning ? 'font-medium text-amber-800' : ''}`}>
                              {sub.warning && '⚠️ '}{sub.text}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{sub.textLocal}</p>

                            {sub.code && (
                              <div className="mt-1.5 bg-gray-900 text-green-400 rounded-lg p-2.5 font-mono text-[11px] overflow-x-auto relative group">
                                <button
                                  onClick={() => copyToClipboard(sub.code!)}
                                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white px-2 py-0.5 rounded text-[9px]"
                                >
                                  {copiedCode === sub.code ? '✓ Copied!' : <Copy className="h-3 w-3" />}
                                </button>
                                <pre className="whitespace-pre-wrap break-all">{sub.code}</pre>
                              </div>
                            )}

                            {sub.link && (
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {sub.action || 'Open'} <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="pt-2">
                        <Button
                          onClick={() => markDone(step.id)}
                          size="sm"
                          className={`w-full ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isDone ? '✓ Completed (Undo)' : 'Mark as Done ✓'}
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}

        {/* Environment Variables Toggle */}
        <Card className="border-0 shadow-md">
          <button
            onClick={() => setShowEnvVars(!showEnvVars)}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <FileCode className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">All 12 Environment Variables</h3>
              <p className="text-xs text-muted-foreground">Vercel ত যোগ কৰিব লগা সকলো variables</p>
            </div>
            {showEnvVars ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showEnvVars && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="px-4 pb-4 pt-0 space-y-2">
                  <div className="border-t border-muted" />
                  <p className="text-xs text-muted-foreground mb-2">
                    Vercel Deploy পৃষ্ঠাত প্ৰতিটো <strong>Key</strong> আৰু <strong>Value</strong> যোগ কৰক:
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ENV_VARS.map((env, i) => (
                      <div key={env.key} className="bg-muted/50 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 rounded px-1.5 py-0.5">#{i + 1}</span>
                          <code className="text-[11px] font-bold text-purple-700">{env.key}</code>
                          {env.required && <Badge className="bg-red-100 text-red-800 text-[7px] px-1 py-0">Required</Badge>}
                        </div>
                        <code className="text-[10px] text-gray-600 break-all">{env.value}</code>
                        <p className="text-[10px] text-emerald-700 mt-0.5">📂 {env.from}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Firebase Config Example */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              Firebase Config কেনেকৈ পাব?
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="font-medium text-gray-800 mb-1">Step A: Firebase Web App Config (Client Keys)</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-600">
                  <li>Firebase Console → ⚙️ Project Settings</li>
                  <li>Your Apps → Web App {'(</>)'} → Config</li>
                  <li>এই ক'ড ব্লকৰ পৰা সকলো value কপি কৰক:</li>
                </ol>
                <div className="mt-1.5 bg-gray-900 rounded-lg p-2 font-mono text-[10px] text-green-400">
                  <pre>{`const firebaseConfig = {
  apiKey: "AIzaSy...",        ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com", ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "your-project",  ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",  ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456", ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"      ← NEXT_PUBLIC_FIREBASE_APP_ID
};`}</pre>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="font-medium text-gray-800 mb-1">Step B: Admin Key (JSON ফাইলৰ পৰা)</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-600">
                  <li>Firebase Console → ⚙️ Project Settings → Service Accounts</li>
                  <li>"Generate New Private Key" ক্লিক → JSON ফাইল ডাউনলোড</li>
                  <li>JSON ফাইল খুলি এই ফিল্ডবোৰ কপি কৰক:</li>
                </ol>
                <div className="mt-1.5 bg-gray-900 rounded-lg p-2 font-mono text-[10px] text-green-400">
                  <pre>{`{
  "project_id": "your-project",  ← FIREBASE_ADMIN_PROJECT_ID
  "client_email": "xxx@xxx.iam.gserviceaccount.com", ← FIREBASE_ADMIN_CLIENT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\\nxxx\\n-----END PRIVATE KEY-----\\n" ← FIREBASE_ADMIN_PRIVATE_KEY
}`}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Info */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50 to-amber-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              খৰচৰ হিচাপ
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <p className="font-bold text-emerald-700">₹0/মাহ</p>
                <p className="text-[10px] text-gray-500">Vercel</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <p className="font-bold text-emerald-700">₹0/মাহ</p>
                <p className="text-[10px] text-gray-500">Neon DB</p>
              </div>
              <div className="bg-white/60 rounded-lg p-2 text-center">
                <p className="font-bold text-emerald-700">₹0/মাহ</p>
                <p className="text-[10px] text-gray-500">Firebase</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">সকলো ফ্ৰী! Google Play তালিকাকৰণ বাদে ($25 একবাৰ)</p>
          </CardContent>
        </Card>

        {/* Final */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
          <CardContent className="p-5 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-black mb-1">এপ লাইভ হ'লৰ পাছত!</h3>
            <p className="text-emerald-100 text-xs mb-2">
              Vercel URL সকলোকে শ্বেয়াৰ কৰক। মʼবাইলত Chrome ত খুলি "Add to Home Screen" ক্লিক কৰিলে এপ ইনষ্টল হʼব!
            </p>
            <div className="bg-white/15 rounded-lg p-2">
              <p className="font-mono text-sm font-bold">https://gram-yatri.vercel.app</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
