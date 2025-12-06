'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home, Bug, Mail, Shield } from 'lucide-react'
import Image from 'next/image'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportError = () => {
    const errorDetails = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || 'No stack trace',
      componentStack: this.state.errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    const subject = encodeURIComponent('Error Report - Student Fee Clearance System')
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorDetails, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `)
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.state.retryCount < this.maxRetries
      const errorMessage = this.state.error?.message || 'An unexpected error occurred'
      
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
              
              {/* Error Icon */}
              <div className="mx-auto mb-4 w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-aj-danger" />
              </div>
              
              <CardTitle className="text-xl font-bold text-aj-danger">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                We encountered an unexpected error while processing your request.
                Don't worry, this has been logged and we're working to fix it.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-4">
              <Alert variant="destructive" className="border-aj-danger/20 bg-red-50">
                <Bug className="h-4 w-4" />
                <AlertDescription className="font-medium text-aj-danger">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="bg-gray-50 p-4 rounded-lg border">
                  <summary className="cursor-pointer font-medium text-sm mb-2 text-aj-primary">
                    Technical Details (Development Mode)
                  </summary>
                  <pre className="text-xs overflow-auto whitespace-pre-wrap text-gray-600 mt-2">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-aj-accent text-white hover:bg-aj-accent/90 font-semibold flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-aj-primary text-aj-primary hover:bg-aj-primary hover:text-white flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-aj-primary text-aj-primary hover:bg-aj-primary hover:text-white flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <div className="text-center">
                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-aj-primary"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Report this error
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>If this problem persists, please contact our support team.</p>
                <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
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

    return this.props.children
  }
}