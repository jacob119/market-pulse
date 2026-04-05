import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL('https://market-pulse-landing.vercel.app'),
  title: 'MarketPulse | AI-Powered Stock Analysis & Automated Trading',
  description: '13 specialized AI agents analyze Korean & US stocks in real-time, generate trading signals, and execute trades automatically. Open source, free to use.',
  keywords: [
    'stock analysis',
    'AI trading',
    'automated trading',
    'Korean stocks',
    'US stocks',
    'KOSPI',
    'NASDAQ',
    'trading bot',
    'investment AI',
    'open source trading'
  ],
  authors: [{ name: 'jacob119' }],
  creator: 'MarketPulse',
  publisher: 'MarketPulse',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://market-pulse-landing.vercel.app',
    siteName: 'MarketPulse',
    title: 'MarketPulse | AI-Powered Stock Analysis & Automated Trading',
    description: '13 specialized AI agents analyze Korean & US stocks in real-time. Open source, free to use.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MarketPulse - AI Stock Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketPulse | AI Stock Analysis',
    description: '13 AI agents for Korean & US stock analysis with automated trading',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://market-pulse-landing.vercel.app',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
