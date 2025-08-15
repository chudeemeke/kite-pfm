import { addDays, addMonths, addYears, format } from 'date-fns'
import { subscriptionRepo } from '@/db/repositories'
import type { Subscription } from '@/types'

interface ICSEvent {
  uid: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  recurrence?: string
}

export class SubscriptionsService {
  /**
   * Calculate the next due date for a subscription
   */
  calculateNextDueDate(subscription: Subscription, fromDate: Date = new Date()): Date {
    switch (subscription.cadence) {
      case 'monthly':
        return addMonths(fromDate, 1)
      case 'yearly':
        return addYears(fromDate, 1)
      case 'custom':
        // For custom, we'll default to monthly
        // In a real implementation, this would be configurable
        return addMonths(fromDate, 1)
      default:
        return addMonths(fromDate, 1)
    }
  }
  
  /**
   * Update subscription's next due date
   */
  async updateNextDueDate(subscriptionId: string): Promise<void> {
    const subscription = await subscriptionRepo.getById(subscriptionId)
    if (!subscription) return
    
    const nextDueDate = this.calculateNextDueDate(subscription, subscription.nextDueDate)
    await subscriptionRepo.update(subscriptionId, { nextDueDate })
  }
  
  /**
   * Get subscriptions due within a certain number of days
   */
  async getSubscriptionsDue(days: number = 30): Promise<Subscription[]> {
    return subscriptionRepo.getUpcoming(days)
  }
  
  /**
   * Generate ICS calendar content for all subscriptions
   */
  async generateICSForAllSubscriptions(): Promise<string> {
    const subscriptions = await subscriptionRepo.getAll()
    const events: ICSEvent[] = []
    
    // Generate events for the next 12 months
    const endDate = addMonths(new Date(), 12)
    
    subscriptions.forEach(subscription => {
      const subscriptionEvents = this.generateEventsForSubscription(subscription, endDate)
      events.push(...subscriptionEvents)
    })
    
    return this.generateICSContent(events, 'All Subscriptions')
  }
  
  /**
   * Generate ICS calendar content for a single subscription
   */
  async generateICSForSubscription(subscriptionId: string): Promise<string> {
    const subscription = await subscriptionRepo.getById(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }
    
    const endDate = addMonths(new Date(), 12)
    const events = this.generateEventsForSubscription(subscription, endDate)
    
    return this.generateICSContent(events, subscription.name)
  }
  
  /**
   * Generate recurring events for a subscription
   */
  private generateEventsForSubscription(subscription: Subscription, endDate: Date): ICSEvent[] {
    const events: ICSEvent[] = []
    let currentDate = new Date(subscription.nextDueDate)
    
    while (currentDate <= endDate) {
      const eventEndDate = addDays(currentDate, 1) // All-day event
      
      events.push({
        uid: `${subscription.id}-${format(currentDate, 'yyyy-MM-dd')}@kite-pfm.app`,
        title: `${subscription.name} - ${this.formatCurrency(subscription.amount, subscription.currency)}`,
        description: this.generateEventDescription(subscription),
        startDate: currentDate,
        endDate: eventEndDate,
        recurrence: this.getRecurrenceRule(subscription.cadence)
      })
      
      // Move to next occurrence
      currentDate = this.calculateNextDueDate(subscription, currentDate)
      
      // Prevent infinite loops
      if (events.length > 100) break
    }
    
    return events
  }
  
  /**
   * Generate ICS file content
   */
  private generateICSContent(events: ICSEvent[], calendarName: string): string {
    const lines: string[] = []
    
    // Calendar header
    lines.push('BEGIN:VCALENDAR')
    lines.push('VERSION:2.0')
    lines.push('PRODID:-//Kite PFM//Subscriptions Calendar//EN')
    lines.push(`X-WR-CALNAME:${calendarName}`)
    lines.push('X-WR-TIMEZONE:UTC')
    lines.push('CALSCALE:GREGORIAN')
    lines.push('METHOD:PUBLISH')
    
    // Add events
    events.forEach(event => {
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${event.uid}`)
      lines.push(`DTSTART;VALUE=DATE:${format(event.startDate, 'yyyyMMdd')}`)
      lines.push(`DTEND;VALUE=DATE:${format(event.endDate, 'yyyyMMdd')}`)
      lines.push(`SUMMARY:${this.escapeICSText(event.title)}`)
      
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICSText(event.description)}`)
      }
      
      lines.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`)
      lines.push(`CREATED:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`)
      lines.push(`LAST-MODIFIED:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`)
      
      if (event.recurrence) {
        lines.push(`RRULE:${event.recurrence}`)
      }
      
      lines.push('STATUS:CONFIRMED')
      lines.push('TRANSP:OPAQUE')
      lines.push('END:VEVENT')
    })
    
    // Calendar footer
    lines.push('END:VCALENDAR')
    
    return lines.join('\r\n')
  }
  
  /**
   * Get recurrence rule for subscription cadence
   */
  private getRecurrenceRule(cadence: Subscription['cadence']): string {
    switch (cadence) {
      case 'monthly':
        return 'FREQ=MONTHLY'
      case 'yearly':
        return 'FREQ=YEARLY'
      case 'custom':
        return 'FREQ=MONTHLY' // Default for custom
      default:
        return 'FREQ=MONTHLY'
    }
  }
  
  /**
   * Generate event description
   */
  private generateEventDescription(subscription: Subscription): string {
    const parts: string[] = []
    
    parts.push(`Amount: ${this.formatCurrency(subscription.amount, subscription.currency)}`)
    parts.push(`Frequency: ${subscription.cadence}`)
    
    if (subscription.notes) {
      parts.push(`Notes: ${subscription.notes}`)
    }
    
    parts.push('Generated by Kite Personal Finance Manager')
    
    return parts.join('\\n')
  }
  
  /**
   * Escape text for ICS format
   */
  private escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }
  
  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  /**
   * Download ICS file
   */
  downloadICS(content: string, filename: string = 'subscriptions.ics'): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
  
  /**
   * Calculate total monthly subscription cost
   */
  async getTotalMonthlyCost(): Promise<number> {
    const subscriptions = await subscriptionRepo.getAll()
    return subscriptions
      .filter(s => s.cadence === 'monthly')
      .reduce((total, s) => total + s.amount, 0)
  }
  
  /**
   * Calculate total yearly subscription cost
   */
  async getTotalYearlyCost(): Promise<number> {
    const subscriptions = await subscriptionRepo.getAll()
    return subscriptions.reduce((total, subscription) => {
      switch (subscription.cadence) {
        case 'monthly':
          return total + (subscription.amount * 12)
        case 'yearly':
          return total + subscription.amount
        case 'custom':
          // Assume yearly for custom
          return total + subscription.amount
        default:
          return total
      }
    }, 0)
  }
  
  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number
    totalMonthlyCost: number
    totalYearlyCost: number
    averageMonthlyCost: number
    subscriptionsByCategory: Array<{ categoryId: string; count: number; totalCost: number }>
  }> {
    const subscriptions = await subscriptionRepo.getAll()
    
    const totalMonthlyCost = await this.getTotalMonthlyCost()
    const totalYearlyCost = await this.getTotalYearlyCost()
    
    // Group by category
    const categoryGroups = subscriptions.reduce((acc, sub) => {
      const categoryId = sub.categoryId || 'uncategorized'
      if (!acc[categoryId]) {
        acc[categoryId] = { count: 0, totalCost: 0 }
      }
      acc[categoryId].count++
      
      // Convert to monthly cost for consistency
      switch (sub.cadence) {
        case 'monthly':
          acc[categoryId].totalCost += sub.amount
          break
        case 'yearly':
          acc[categoryId].totalCost += sub.amount / 12
          break
        case 'custom':
          acc[categoryId].totalCost += sub.amount / 12 // Assume yearly
          break
      }
      
      return acc
    }, {} as Record<string, { count: number; totalCost: number }>)
    
    const subscriptionsByCategory = Object.entries(categoryGroups).map(([categoryId, data]) => ({
      categoryId,
      count: data.count,
      totalCost: data.totalCost
    }))
    
    return {
      totalSubscriptions: subscriptions.length,
      totalMonthlyCost,
      totalYearlyCost,
      averageMonthlyCost: totalMonthlyCost / (subscriptions.length || 1),
      subscriptionsByCategory
    }
  }
}

// Export singleton instance
export const subscriptionsService = new SubscriptionsService()