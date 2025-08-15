import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { useSettingsStore } from '@/stores/settings'

export class FormatService {
  private locale = enGB
  
  /**
   * Format currency amount using user settings
   */
  formatCurrency(amount: number, currency?: string): string {
    const settings = useSettingsStore.getState()
    const finalCurrency = currency || settings.currency.primaryCurrency
    const locale = this.getLocaleFromSettings()
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: finalCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  /**
   * Format currency with compact notation for large amounts
   */
  formatCurrencyCompact(amount: number, currency?: string): string {
    const settings = useSettingsStore.getState()
    const finalCurrency = currency || settings.currency.primaryCurrency
    const locale = this.getLocaleFromSettings()
    
    if (Math.abs(amount) >= 1000000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: finalCurrency,
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
    }
    
    return this.formatCurrency(amount, currency)
  }
  
  /**
   * Format number as percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100)
  }
  
  /**
   * Format date for display using user settings
   */
  formatDate(date: Date | string | undefined, formatString?: string): string {
    if (!date) return 'No date'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date'
    
    const settings = useSettingsStore.getState()
    const finalFormat = formatString || this.getDateFormatFromSettings(settings.appearance.dateFormat)
    
    return format(dateObj, finalFormat, { locale: this.locale })
  }
  
  /**
   * Format date with relative time for recent dates
   */
  formatRelativeDate(date: Date | string | undefined): string {
    if (!date) return 'No date'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date'
    
    if (isToday(dateObj)) {
      return 'Today'
    }
    
    if (isYesterday(dateObj)) {
      return 'Yesterday'
    }
    
    if (isTomorrow(dateObj)) {
      return 'Tomorrow'
    }
    
    // For dates within a week, show day name
    const daysDiff = Math.abs(Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff <= 7) {
      return format(dateObj, 'EEEE', { locale: this.locale })
    }
    
    // For older dates, show date
    return format(dateObj, 'dd/MM/yyyy', { locale: this.locale })
  }
  
  /**
   * Format time distance to now
   */
  formatTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(dateObj, { 
      addSuffix: true, 
      locale: this.locale 
    })
  }
  
  /**
   * Format month and year
   */
  formatMonthYear(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMMM yyyy', { locale: this.locale })
  }
  
  /**
   * Format month for budget period (YYYY-MM)
   */
  formatBudgetMonth(monthString: string | undefined): string {
    if (!monthString) return 'No month'
    const date = new Date(monthString + '-01')
    if (isNaN(date.getTime())) return 'Invalid month'
    return format(date, 'MMMM yyyy', { locale: this.locale })
  }
  
  /**
   * Format account type for display
   */
  formatAccountType(type: string): string {
    const typeMap: Record<string, string> = {
      'checking': 'Current Account',
      'savings': 'Savings Account',
      'credit': 'Credit Card',
      'investment': 'Investment Account',
      'cash': 'Cash',
      'loan': 'Loan',
      'other': 'Other'
    }
    
    return typeMap[type] || type
  }
  
  /**
   * Format transaction amount with color coding
   */
  formatTransactionAmount(amount: number, currency: string = 'GBP'): {
    formatted: string
    isPositive: boolean
    isNegative: boolean
  } {
    return {
      formatted: this.formatCurrency(amount, currency),
      isPositive: amount > 0,
      isNegative: amount < 0
    }
  }
  
  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  /**
   * Format subscription cadence
   */
  formatSubscriptionCadence(cadence: string): string {
    const cadenceMap: Record<string, string> = {
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'custom': 'Custom'
    }
    
    return cadenceMap[cadence] || cadence
  }
  
  /**
   * Format rule condition operator
   */
  formatRuleOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      'eq': 'equals',
      'contains': 'contains',
      'regex': 'matches pattern',
      'range': 'is between'
    }
    
    return operatorMap[operator] || operator
  }
  
  /**
   * Format rule condition field
   */
  formatRuleField(field: string): string {
    const fieldMap: Record<string, string> = {
      'merchant': 'Merchant',
      'description': 'Description',
      'amount': 'Amount'
    }
    
    return fieldMap[field] || field
  }
  
  /**
   * Format budget carryover strategy
   */
  formatCarryStrategy(strategy: string): string {
    const strategyMap: Record<string, string> = {
      'carryNone': 'No Carryover',
      'carryUnspent': 'Carry Unspent',
      'carryOverspend': 'Carry Overspend'
    }
    
    return strategyMap[strategy] || strategy
  }
  
  /**
   * Format number with thousands separators using user settings
   */
  formatNumber(value: number, minimumFractionDigits: number = 0): string {
    const locale = this.getLocaleFromSettings()
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits: 2
    }).format(value)
  }
  
  /**
   * Get locale string from user settings
   */
  private getLocaleFromSettings(): string {
    const settings = useSettingsStore.getState()
    
    switch (settings.appearance.numberFormat) {
      case 'us': return 'en-US'
      case 'eu': return 'de-DE'  
      case 'uk': return 'en-GB'
      case 'ca': return 'en-CA'
      default: return 'en-US'
    }
  }

  /**
   * Get week start day from user settings
   */
  getWeekStartDay(): number {
    const settings = useSettingsStore.getState()
    return settings.currency.firstDayOfWeek === 'monday' ? 1 : 0 // 0 = Sunday, 1 = Monday
  }

  /**
   * Get fiscal year start month from user settings
   */
  getFiscalYearStart(): { month: number; day: number } {
    const settings = useSettingsStore.getState()
    const [month, day] = settings.currency.fiscalYearStart.split('-').map(Number)
    return { month: month - 1, day } // Month is 0-indexed in JavaScript Date
  }

  /**
   * Get fiscal year for a given date
   */
  getFiscalYear(date: Date): number {
    const fiscalStart = this.getFiscalYearStart()
    const year = date.getFullYear()
    const fiscalStartDate = new Date(year, fiscalStart.month, fiscalStart.day)
    
    if (date >= fiscalStartDate) {
      return year
    } else {
      return year - 1
    }
  }

  /**
   * Format date range based on fiscal year
   */
  formatFiscalYearRange(fiscalYear: number): string {
    const fiscalStart = this.getFiscalYearStart()
    const startDate = new Date(fiscalYear, fiscalStart.month, fiscalStart.day)
    const endDate = new Date(fiscalYear + 1, fiscalStart.month, fiscalStart.day - 1)
    
    return `${this.formatDate(startDate, 'dd MMM yyyy')} - ${this.formatDate(endDate, 'dd MMM yyyy')}`
  }
  
  /**
   * Get date format string from settings format type
   */
  private getDateFormatFromSettings(dateFormat: string): string {
    switch (dateFormat) {
      case 'DD/MM/YYYY': return 'dd/MM/yyyy'
      case 'MM/DD/YYYY': return 'MM/dd/yyyy'
      case 'YYYY-MM-DD': return 'yyyy-MM-dd'
      default: return 'dd/MM/yyyy'
    }
  }
  
  /**
   * Format duration in milliseconds to human readable
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
  
  /**
   * Truncate text to specified length
   */
  truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
  }
  
  /**
   * Format initials from name
   */
  formatInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }
  
  /**
   * Format phone number
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Simple UK phone number formatting
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')
    }
    
    return phoneNumber
  }
  
  /**
   * Format validation errors
   */
  formatValidationErrors(errors: Array<{ field: string; message: string }>): string {
    if (errors.length === 0) return ''
    
    if (errors.length === 1) {
      return errors[0].message
    }
    
    return `${errors.length} validation errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`
  }
}

// Export singleton instance
export const formatService = new FormatService()

// Export commonly used format functions for convenience - properly bound
export const formatCurrency = formatService.formatCurrency.bind(formatService)
export const formatCurrencyCompact = formatService.formatCurrencyCompact.bind(formatService)
export const formatPercentage = formatService.formatPercentage.bind(formatService)
export const formatDate = formatService.formatDate.bind(formatService)
export const formatRelativeDate = formatService.formatRelativeDate.bind(formatService)
export const formatTimeAgo = formatService.formatTimeAgo.bind(formatService)
export const formatMonthYear = formatService.formatMonthYear.bind(formatService)
export const formatBudgetMonth = formatService.formatBudgetMonth.bind(formatService)
export const formatAccountType = formatService.formatAccountType.bind(formatService)
export const formatTransactionAmount = formatService.formatTransactionAmount.bind(formatService)
export const formatFileSize = formatService.formatFileSize.bind(formatService)
export const formatNumber = formatService.formatNumber.bind(formatService)
export const truncateText = formatService.truncateText.bind(formatService)