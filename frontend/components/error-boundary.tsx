"use client"

import React from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('unauthorized') || error.message.includes('401')
  const isServerError = error.message.includes('500') || error.message.includes('server')

  const getErrorDetails = () => {
    if (isNetworkError) {
      return {
        title: "Connection Problem",
        message: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
        action: "Retry Connection"
      }
    }
    
    if (isAuthError) {
      return {
        title: "Authentication Error", 
        message: "Your session has expired. Please refresh the page to continue.",
        action: "Refresh Page"
      }
    }
    
    if (isServerError) {
      return {
        title: "Server Error",
        message: "Our servers are experiencing issues. Please try again in a few moments.",
        action: "Try Again"
      }
    }
    
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      action: "Try Again"
    }
  }

  const { title, message, action } = getErrorDetails()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8F5] via-[#FDFCFB] to-[#FFF0EA] p-4"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl p-8 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/30 to-orange-100/30 rounded-full -translate-y-16 translate-x-16" />
          
          <div className="relative">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </motion.div>

            {/* Error Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-[#1A1A1A] mb-3"
            >
              {title}
            </motion.h1>

            {/* Error Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[#666666] leading-relaxed mb-8"
            >
              {message}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={resetError}
                className="flex-1 bg-gradient-to-r from-[#FF7A70] to-[#FF9F70] hover:from-[#FF6B60] hover:to-[#FF8F60] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {action}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1 border-[#EDE5E0] text-[#666666] hover:bg-[#F9FAFB] hover:text-[#1A1A1A] font-semibold py-3 rounded-xl transition-all duration-300"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </motion.div>

            {/* Technical Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-left"
              >
                <summary className="cursor-pointer text-sm text-[#999999] hover:text-[#666666] transition-colors">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-[#F8F9FA] rounded-lg text-xs text-[#666666] font-mono overflow-auto max-h-32">
                  <div className="font-semibold text-red-600 mb-1">Error:</div>
                  <div className="mb-2">{error.message}</div>
                  <div className="font-semibold text-red-600 mb-1">Stack:</div>
                  <div className="whitespace-pre-wrap">{error.stack}</div>
                </div>
              </motion.details>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary
