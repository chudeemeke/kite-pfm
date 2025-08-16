/**
 * Error Handler Service
 * Centralized error handling for async operations, API calls, and validation
 * Provides consistent error management across the application
 */

import { toast } from '@/stores'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'network' | 'validation' | 'auth' | 'database' | 'business' | 'unknown'

interface ErrorContext {
  operation?: string
  userId?: string
  accountId?: string
  transactionId?: string
  metadata?: Record<string, any>
}

interface ErrorLogEntry {
  id: string
  timestamp: Date
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context?: ErrorContext
  handled: boolean
  retryCount: number
}

class ErrorHandlerService {
  private errorLog: ErrorLogEntry[] = []
  private readonly MAX_LOG_SIZE = 100
  private readonly MAX_RETRY_ATTEMPTS = 3
  private retryTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()
  
  // Network error patterns
  private readonly NETWORK_ERROR_PATTERNS = [
    'fetch failed',
    'network error',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'connection reset'
  ]
  
  // Auth error patterns
  private readonly AUTH_ERROR_PATTERNS = [
    'unauthorized',
    '401',
    'authentication failed',
    'token expired',
    'invalid credentials'
  ]
  
  // Validation error patterns
  private readonly VALIDATION_ERROR_PATTERNS = [
    'validation failed',
    'invalid input',
    'required field',
    'format error',
    'type error'
  ]

  /**
   * Handle an error with appropriate logging and user feedback
   */
  async handleError(
    error: Error | unknown,
    context?: ErrorContext,
    options?: {
      showToast?: boolean
      severity?: ErrorSeverity
      retry?: () => Promise<any>
      fallback?: any
    }
  ): Promise<any> {
    const errorObj = this.normalizeError(error)
    const category = this.categorizeError(errorObj)
    const severity = options?.severity || this.determineSeverity(errorObj, category)
    
    // Create log entry
    const logEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: errorObj.message,
      stack: errorObj.stack,
      severity,
      category,
      context,
      handled: true,
      retryCount: 0
    }
    
    // Add to log
    this.addToLog(logEntry)
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error handled:', {
        ...logEntry,
        error: errorObj
      })
    }
    
    // Show user feedback if appropriate
    if (options?.showToast !== false) {
      this.showUserFeedback(errorObj, category, severity)
    }
    
    // Handle retry logic if provided
    if (options?.retry && this.shouldRetry(category, logEntry)) {
      return this.handleRetry(logEntry, options.retry, options.fallback)
    }
    
    // Return fallback if provided
    return options?.fallback
  }

  /**
   * Wrap an async function with error handling
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: ErrorContext,
    options?: {
      showToast?: boolean
      fallback?: any
      retries?: number
    }
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args)
      } catch (error) {
        return this.handleError(error, context, {
          ...options,
          retry: options?.retries ? () => fn(...args) : undefined
        })
      }
    }) as T
  }

  /**
   * Handle validation errors with field-specific feedback
   */
  handleValidationError(
    errors: Record<string, string | string[]>,
    formName?: string
  ) {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => {
        const messageList = Array.isArray(messages) ? messages : [messages]
        return `${field}: ${messageList.join(', ')}`
      })
      .join('\n')
    
    toast.error(
      formName ? `${formName} Validation Failed` : 'Validation Failed',
      errorMessages
    )
    
    return errors
  }

  /**
   * Handle API errors with appropriate status code handling
   */
  async handleApiError(
    response: Response,
    context?: ErrorContext
  ): Promise<never> {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    let errorData: any = null
    
    try {
      errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // Response might not be JSON
    }
    
    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    ;(error as any).data = errorData
    
    // Handle specific status codes
    switch (response.status) {
      case 401:
        this.handleAuthError(error, context)
        break
      case 403:
        toast.error('Access Denied', 'You do not have permission to perform this action')
        break
      case 404:
        toast.error('Not Found', 'The requested resource was not found')
        break
      case 429:
        toast.warning('Rate Limited', 'Too many requests. Please wait a moment and try again')
        break
      case 500:
      case 502:
      case 503:
        toast.error('Server Error', 'The server encountered an error. Please try again later')
        break
      default:
        toast.error('Request Failed', errorMessage)
    }
    
    throw error
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(_error: Error, _context?: ErrorContext) {
    toast.error(
      'Authentication Required',
      'Please log in to continue'
    )
    
    // Note: Authentication in Kite is handled via PIN/biometric through the security service
    // No auth tokens are used since this is a local-first application
    // Security state is managed in IndexedDB via the security service
  }

  /**
   * Normalize various error types to Error object
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error
    }
    
    if (typeof error === 'string') {
      return new Error(error)
    }
    
    if (error && typeof error === 'object') {
      const obj = error as any
      return new Error(obj.message || obj.error || JSON.stringify(error))
    }
    
    return new Error('An unknown error occurred')
  }

  /**
   * Categorize error based on patterns
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    const combined = message + ' ' + stack
    
    if (this.NETWORK_ERROR_PATTERNS.some(pattern => combined.includes(pattern))) {
      return 'network'
    }
    
    if (this.AUTH_ERROR_PATTERNS.some(pattern => combined.includes(pattern))) {
      return 'auth'
    }
    
    if (this.VALIDATION_ERROR_PATTERNS.some(pattern => combined.includes(pattern))) {
      return 'validation'
    }
    
    if (combined.includes('database') || combined.includes('dexie') || combined.includes('indexeddb')) {
      return 'database'
    }
    
    if (combined.includes('business') || combined.includes('insufficient')) {
      return 'business'
    }
    
    return 'unknown'
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical errors that need immediate attention
    if (category === 'database' || error.message.includes('critical')) {
      return 'critical'
    }
    
    // High severity for auth and certain business errors
    if (category === 'auth' || error.message.includes('security')) {
      return 'high'
    }
    
    // Medium for network and validation
    if (category === 'network' || category === 'validation') {
      return 'medium'
    }
    
    // Default to low
    return 'low'
  }

  /**
   * Show appropriate user feedback based on error
   */
  private showUserFeedback(error: Error, category: ErrorCategory, severity: ErrorSeverity) {
    const defaultMessages: Record<ErrorCategory, { title: string; message: string }> = {
      network: {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again'
      },
      auth: {
        title: 'Authentication Error',
        message: 'Please log in to continue'
      },
      validation: {
        title: 'Invalid Input',
        message: 'Please check your input and try again'
      },
      database: {
        title: 'Storage Error',
        message: 'There was a problem accessing your data'
      },
      business: {
        title: 'Operation Failed',
        message: error.message
      },
      unknown: {
        title: 'Unexpected Error',
        message: 'Something went wrong. Please try again'
      }
    }
    
    const { title, message } = defaultMessages[category]
    
    switch (severity) {
      case 'critical':
        toast.error(title, message)
        break
      case 'high':
        toast.error(title, message)
        break
      case 'medium':
        toast.warning(title, message)
        break
      case 'low':
        toast.info(title, message)
        break
    }
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(category: ErrorCategory, logEntry: ErrorLogEntry): boolean {
    // Only retry network errors and certain database errors
    if (category !== 'network' && category !== 'database') {
      return false
    }
    
    // Check retry count
    return logEntry.retryCount < this.MAX_RETRY_ATTEMPTS
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private async handleRetry(
    logEntry: ErrorLogEntry,
    retryFn: () => Promise<any>,
    fallback?: any
  ): Promise<any> {
    logEntry.retryCount++
    
    // Calculate delay with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, logEntry.retryCount - 1), 10000)
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        this.retryTimeouts.delete(logEntry.id)
        
        try {
          const result = await retryFn()
          toast.success('Success', 'Operation completed successfully')
          resolve(result)
        } catch (error) {
          if (logEntry.retryCount < this.MAX_RETRY_ATTEMPTS) {
            // Retry again
            resolve(this.handleRetry(logEntry, retryFn, fallback))
          } else {
            // Max retries reached
            toast.error(
              'Operation Failed',
              `Failed after ${this.MAX_RETRY_ATTEMPTS} attempts`
            )
            resolve(fallback)
          }
        }
      }, delay)
      
      this.retryTimeouts.set(logEntry.id, timeoutId)
      
      // Show retry notification
      toast.info(
        'Retrying...',
        `Attempt ${logEntry.retryCount} of ${this.MAX_RETRY_ATTEMPTS}`
      )
    })
  }

  /**
   * Add error to log with size management
   */
  private addToLog(entry: ErrorLogEntry) {
    this.errorLog.unshift(entry)
    
    // Trim log if too large
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_LOG_SIZE)
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(filter?: {
    severity?: ErrorSeverity
    category?: ErrorCategory
    since?: Date
  }): ErrorLogEntry[] {
    let filtered = [...this.errorLog]
    
    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity)
    }
    
    if (filter?.category) {
      filtered = filtered.filter(e => e.category === filter.category)
    }
    
    if (filter?.since) {
      filtered = filtered.filter(e => e.timestamp >= filter.since!)
    }
    
    return filtered
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = []
  }

  /**
   * Cancel all pending retries
   */
  cancelRetries() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }

  /**
   * Export error log for debugging
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2)
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService()

// Export convenience functions
export const handleError = errorHandler.handleError.bind(errorHandler)
export const wrapAsync = errorHandler.wrapAsync.bind(errorHandler)
export const handleValidationError = errorHandler.handleValidationError.bind(errorHandler)
export const handleApiError = errorHandler.handleApiError.bind(errorHandler)