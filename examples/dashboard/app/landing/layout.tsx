import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://market-pulse.vercel.app'),
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
    url: 'https://market-pulse.vercel.app/landing',
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
    canonical: 'https://market-pulse.vercel.app/landing',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
