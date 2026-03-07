import { SessionProvider } from '@/components/session-provider'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Herizon — A Safe Space for Every Mother',
  description: 'Herizon connects mothers with community, trusted resources, verified experts, and AI support.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
