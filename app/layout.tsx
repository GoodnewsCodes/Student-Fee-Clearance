import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AJU FEES CLEARANCE',
  description: 'AJU FEES CLEARANCE',
  generator: 'AJU FEES CLEARANCE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
