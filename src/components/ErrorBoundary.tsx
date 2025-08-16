/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 * Provides graceful error handling and recovery options
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null
  private readonly ERROR_RESET_TIME = 10000 // 10 seconds
  private readonly MAX_ERROR_COUNT = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now()
    const { lastErrorTime, errorCount } = this.state
    
    // Check if this is a recurring error
    const isRecurring = now - lastErrorTime < this.ERROR_RESET_TIME
    const newErrorCount = isRecurring ? errorCount + 1 : 1
    
    // Log error details
    console.error('Error caught by boundary:', error)
    console.error('Component stack:', errorInfo.componentStack)
    
    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo)
    }
    
    // Update state
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Auto-reset after timeout for non-critical errors
    if (this.props.level === 'component' && newErrorCount < this.MAX_ERROR_COUNT) {
      this.scheduleReset()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    // Reset on prop changes if specified
    if (hasError && prevProps.resetKeys !== resetKeys && resetOnPropsChange) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private scheduleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary()
    }, this.ERROR_RESET_TIME)
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementation for error tracking service
    // This would integrate with services like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // Send to error tracking endpoint
    console.log('Would send to error service:', errorData)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleHome = () => {
    window.location.href = '/'
  }

  private handleReport = () => {
    const { error, errorInfo } = this.state
    const subject = encodeURIComponent('Error Report: Kite Finance')
    const body = encodeURIComponent(`
Error occurred in Kite Finance App

Error Message: ${error?.message}
Stack Trace: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}

Browser: ${navigator.userAgent}
Time: ${new Date().toISOString()}
    `)
    
    window.open(`mailto:support@kite.finance?subject=${subject}&body=${body}`)
  }

  render() {
    const { hasError, error, errorCount } = this.state
    const { children, fallback, level = 'page', isolate } = this.props

    if (!hasError) {
      return children
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback
    }

    // Check if we've exceeded max error count
    const isCritical = errorCount >= this.MAX_ERROR_COUNT

    // Different UI based on error level
    switch (level) {
      case 'component':
        return (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Component Error</span>
            </div>
            <p className="text-sm text-red-500 dark:text-red-300 mt-1">
              This component encountered an error and cannot be displayed.
            </p>
            {!isolate && (
              <button
                onClick={this.resetErrorBoundary}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        )

      case 'section':
        return (
          <div className="card p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Section Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This section encountered an error. Please try refreshing or come back later.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.resetErrorBoundary}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={this.handleHome}
                className="btn-primary flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        )

      case 'page':
      default:
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="card p-8 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isCritical 
                    ? 'bg-red-100 dark:bg-red-900/20' 
                    : 'bg-warning-100 dark:bg-warning-900/20'
                }`}>
                  <AlertTriangle className={`w-8 h-8 ${
                    isCritical 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-warning-600 dark:text-warning-400'
                  }`} />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {isCritical ? 'Critical Error' : 'Something went wrong'}
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isCritical 
                    ? 'The application encountered a critical error and needs to restart.'
                    : 'We encountered an unexpected error. Your data is safe.'}
                </p>
                
                {import.meta.env.DEV && error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      Error Details (Development Only)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto">
                      <p className="font-semibold text-red-600 dark:text-red-400">{error.message}</p>
                      <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  </details>
                )}
                
                <div className="flex flex-col gap-3">
                  {!isCritical && (
                    <button
                      onClick={this.resetErrorBoundary}
                      className="btn-primary flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleReload}
                    className={isCritical ? 'btn-primary' : 'btn-secondary'}
                  >
                    Reload Application
                  </button>
                  
                  {!isCritical && (
                    <button
                      onClick={this.handleHome}
                      className="btn-ghost"
                    >
                      Return Home
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleReport}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center gap-1"
                  >
                    <Bug className="w-3 h-3" />
                    Report Issue
                  </button>
                </div>
              </div>
              
              {isCritical && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Error Code: {Date.now().toString(36).toUpperCase()}
                </p>
              )}
            </div>
          </div>
        )
    }
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to programmatically throw errors to nearest error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}

export default ErrorBoundary