'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, ArrowLeft, HelpCircle, Phone, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-aj-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          {/* AJU Logo and Branding */}
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/aju-logo.png"
              alt="Arthur Jarvis University Logo"
              width={64}
              height={64}
              className="object-contain drop-shadow-aj-logo rounded-sm"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-aj-primary mb-2">
            Arthur Jarvis University
          </CardTitle>
          <p className="text-gray-600 text-sm mb-4">Fee Clearance System</p>
          
          {/* 404 Illustration */}
          <div className="mx-auto mb-6 w-32 h-32 bg-aj-primary/10 rounded-full flex items-center justify-center">
            <div className="text-6xl font-bold text-aj-primary">404</div>
          </div>
          
          <CardTitle className="text-xl font-bold text-aj-primary">
            Page Not Found
          </CardTitle>
          <p className="text-base mt-2 text-gray-600">
            Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or the URL might be incorrect.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {/* Helpful suggestions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-aj-primary mb-2 flex items-center">
              <Search className="h-4 w-4 mr-2" />
              What you can do:
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Check the URL for any typos</li>
              <li>• Go back to the previous page</li>
              <li>• Return to the homepage</li>
              <li>• Contact support if you believe this is an error</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="border-aj-primary text-aj-primary hover:bg-aj-primary hover:text-white flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>

          {/* Support links */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-aj-primary"
              asChild
            >
              <Link href="/">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-aj-primary"
              asChild
            >
              <Link href="/">
                <FileText className="w-4 h-4 mr-2" />
                FAQ
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-aj-primary"
              asChild
            >
              <Link href="/">
                <Phone className="w-4 w-4 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>

          {/* Common pages */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-aj-primary mb-3">Popular Pages:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link 
                href="/" 
                className="text-sm text-aj-primary hover:text-aj-accent hover:underline"
              >
                → Student Dashboard
              </Link>
              <Link 
                href="/" 
                className="text-sm text-aj-primary hover:text-aj-accent hover:underline"
              >
                → Fee Clearance Status
              </Link>
              <Link 
                href="/forgot-password" 
                className="text-sm text-aj-primary hover:text-aj-accent hover:underline"
              >
                → Reset Password
              </Link>
              <Link 
                href="/" 
                className="text-sm text-aj-primary hover:text-aj-accent hover:underline"
              >
                → Staff Login
              </Link>
            </div>
          </div>

          {/* Footer with AJU branding */}
          <div className="border-t pt-4 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-6 h-6 relative">
                  <Image
                    src="/aju-logo.png"
                    alt="Arthur Jarvis University Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-aj-primary">Arthur Jarvis University</span>
              </div>
              <p className="text-xs text-gray-500">
                © 2025 Arthur Jarvis University. All rights reserved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}