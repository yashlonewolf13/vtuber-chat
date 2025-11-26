import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../app/global.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Oshi - Dream Big with AI Avatars',
  description: 'Interactive AI avatar conversations for anime and VTubing fans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
