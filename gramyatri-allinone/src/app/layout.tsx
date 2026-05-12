import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "GramYatri - Village Transport Made Easy",
  description: "Book tempo, auto & e-rickshaw rides in your village. Shared rides, fixed routes, and offline booking support.",
  keywords: ["GramYatri", "village transport", "tempo", "auto", "e-rickshaw", "ride booking", "shared ride"],
  authors: [{ name: "GramYatri Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GramYatri",
    startupImage: "/icon-512.png",
  },
  openGraph: {
    title: "GramYatri - Village Transport Made Easy",
    description: "Book tempo, auto & e-rickshaw rides in your village",
    url: "https://gramyatri.app",
    siteName: "GramYatri",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GramYatri - Village Transport Made Easy",
    description: "Book tempo, auto & e-rickshaw rides in your village",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="GramYatri" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GramYatri" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
