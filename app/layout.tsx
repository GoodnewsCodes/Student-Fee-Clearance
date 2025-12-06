import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/store/provider"

export const metadata: Metadata = {
  title: {
    default: 'AJU FEES CLEARANCE',
    template: '%s | AJU FEES CLEARANCE'
  },
  description: 'Student fee clearance system for AJU',
  keywords: ['fees', 'clearance', 'student', 'AJU'],
  authors: [{ name: 'AJU' }],
  openGraph: {
    title: 'AJU FEES CLEARANCE',
    description: 'Student fee clearance system for AJU',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ErrorBoundary>
              {children}
              <Toaster />
            </ErrorBoundary>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
