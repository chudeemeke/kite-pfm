import React from 'react'
import { useSettingsStore } from '@/stores/settings'
import { useTransactionsStore } from '@/stores/transactions'
import { useBudgetsStore } from '@/stores/budgets'
import { formatCurrency } from './format'

export interface NotificationData {
  id: string
  type: 'budget_alert' | 'large_transaction' | 'weekly_summary' | 'monthly_report' | 'reminder'
  title: string
  message: string
  timestamp: Date
  read: boolean
  severity: 'info' | 'warning' | 'error'
  data?: any
}

class NotificationService {
  private notifications: NotificationData[] = []
  private listeners: Array<(notifications: NotificationData[]) => void> = []
  private checkInterval: number | null = null

  constructor() {
    this.loadNotifications()
  }

  init() {
    // Start checking for notifications every minute
    this.checkInterval = setInterval(() => {
      this.checkNotifications()
    }, 60000) // 1 minute

    // Initial check
    this.checkNotifications()
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private loadNotifications() {
    try {
      const stored = localStorage.getItem('kite-notifications')
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('kite-notifications', JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  subscribe(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener)
    // Immediately call with current notifications
    listener([...this.notifications])
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private addNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    const newNotification: NotificationData = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    this.saveNotifications()
    this.notifyListeners()

    // Show toast notification if settings allow
    const settings = useSettingsStore.getState()
    if (settings.notifications.soundEffects) {
      this.playNotificationSound()
    }

    // Show browser notification if permission granted
    this.showBrowserNotification(newNotification)
  }

  private async checkNotifications() {
    const settings = useSettingsStore.getState()
    
    if (settings.notifications.budgetAlerts) {
      await this.checkBudgetAlerts()
    }
    
    if (settings.notifications.largeTransactionAlerts) {
      await this.checkLargeTransactions()
    }
    
    if (settings.notifications.weeklySummary) {
      this.checkWeeklySummary()
    }
    
    if (settings.notifications.monthlyReport) {
      this.checkMonthlyReport()
    }
  }

  private async checkBudgetAlerts() {
    try {
      const settings = useSettingsStore.getState()
      const { budgets } = useBudgetsStore.getState()
      const { transactions } = useTransactionsStore.getState()
      
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const currentMonthBudgets = budgets.filter(b => b.month === currentMonth)
      
      for (const budget of currentMonthBudgets) {
        // Calculate spent amount for this budget
        const spent = transactions
          .filter(t => 
            t.categoryId === budget.categoryId && 
            t.date.toISOString().slice(0, 7) === currentMonth &&
            t.amount < 0 // Only expenses
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        const percentage = (spent / budget.amount) * 100
        
        if (percentage >= settings.notifications.budgetThreshold) {
          // Check if we've already sent this notification recently
          const recentAlert = this.notifications.find(n => 
            n.type === 'budget_alert' &&
            n.data?.budgetId === budget.id &&
            n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          )
          
          if (!recentAlert) {
            this.addNotification({
              type: 'budget_alert',
              title: 'Budget Alert',
              message: `You've spent ${percentage.toFixed(0)}% of your budget for this category`,
              severity: percentage >= 100 ? 'error' : 'warning',
              data: { budgetId: budget.id, spent, budgeted: budget.amount, percentage }
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to check budget alerts:', error)
    }
  }

  private async checkLargeTransactions() {
    try {
      const settings = useSettingsStore.getState()
      const { transactions } = useTransactionsStore.getState()
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentTransactions = transactions.filter(t => t.date > oneDayAgo)
      
      for (const transaction of recentTransactions) {
        const amount = Math.abs(transaction.amount)
        
        if (amount >= settings.notifications.largeTransactionThreshold) {
          // Check if we've already notified about this transaction
          const existingAlert = this.notifications.find(n => 
            n.type === 'large_transaction' &&
            n.data?.transactionId === transaction.id
          )
          
          if (!existingAlert) {
            this.addNotification({
              type: 'large_transaction',
              title: 'Large Transaction Alert',
              message: `${transaction.amount > 0 ? 'Received' : 'Spent'} ${formatCurrency(amount)} - ${transaction.description}`,
              severity: 'info',
              data: { transactionId: transaction.id, amount: transaction.amount }
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to check large transactions:', error)
    }
  }

  private checkWeeklySummary() {
    try {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const hour = now.getHours()
      
      // Send weekly summary on Sunday at 9 AM
      if (dayOfWeek === 0 && hour === 9) {
        const lastWeeklySummary = this.notifications.find(n => 
          n.type === 'weekly_summary' &&
          n.timestamp > new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // Last 6 days
        )
        
        if (!lastWeeklySummary) {
          this.generateWeeklySummary()
        }
      }
    } catch (error) {
      console.error('Failed to check weekly summary:', error)
    }
  }

  private checkMonthlyReport() {
    try {
      const now = new Date()
      const dayOfMonth = now.getDate()
      const hour = now.getHours()
      
      // Send monthly report on the 1st of each month at 9 AM
      if (dayOfMonth === 1 && hour === 9) {
        const lastMonthlyReport = this.notifications.find(n => 
          n.type === 'monthly_report' &&
          n.timestamp > new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // Last 25 days
        )
        
        if (!lastMonthlyReport) {
          this.generateMonthlyReport()
        }
      }
    } catch (error) {
      console.error('Failed to check monthly report:', error)
    }
  }

  private generateWeeklySummary() {
    try {
      const { transactions } = useTransactionsStore.getState()
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const weekTransactions = transactions.filter(t => t.date > oneWeekAgo)
      
      const income = weekTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = Math.abs(weekTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0))
      
      const netChange = income - expenses
      
      this.addNotification({
        type: 'weekly_summary',
        title: 'Weekly Summary',
        message: `This week: ${formatCurrency(income)} income, ${formatCurrency(expenses)} expenses. Net: ${formatCurrency(netChange)}`,
        severity: 'info',
        data: { income, expenses, netChange, transactionCount: weekTransactions.length }
      })
    } catch (error) {
      console.error('Failed to generate weekly summary:', error)
    }
  }

  private generateMonthlyReport() {
    try {
      const { transactions } = useTransactionsStore.getState()
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
      const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      )
      
      const income = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = Math.abs(monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0))
      
      const monthName = lastMonth.toLocaleString('default', { month: 'long' })
      
      this.addNotification({
        type: 'monthly_report',
        title: 'Monthly Report',
        message: `${monthName}: ${formatCurrency(income)} income, ${formatCurrency(expenses)} expenses`,
        severity: 'info',
        data: { income, expenses, month: monthName, transactionCount: monthTransactions.length }
      })
    } catch (error) {
      console.error('Failed to generate monthly report:', error)
    }
  }

  private playNotificationSound() {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  private async showBrowserNotification(notification: NotificationData) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/kite-icon-192.png',
          badge: '/kite-icon-192.png',
          tag: `kite-${notification.type}`,
          requireInteraction: notification.severity === 'error'
        })
      }
    } catch (error) {
      console.warn('Failed to show browser notification:', error)
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }
    
    if (Notification.permission === 'granted') {
      return true
    }
    
    if (Notification.permission === 'denied') {
      return false
    }
    
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveNotifications()
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
    this.notifyListeners()
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.saveNotifications()
    this.notifyListeners()
  }

  clearAllNotifications() {
    this.notifications = []
    this.saveNotifications()
    this.notifyListeners()
  }

  getNotifications(): NotificationData[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  // Manual notification triggers for testing
  triggerTestNotification() {
    this.addNotification({
      type: 'reminder',
      title: 'Test Notification',
      message: 'This is a test notification from Kite',
      severity: 'info'
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// React hook for using notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<NotificationData[]>([])
  
  React.useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    return unsubscribe
  }, [])
  
  return {
    notifications,
    unreadCount: notificationService.getUnreadCount(),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    deleteNotification: notificationService.deleteNotification.bind(notificationService),
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),
    requestPermission: notificationService.requestNotificationPermission.bind(notificationService),
    triggerTest: notificationService.triggerTestNotification.bind(notificationService)
  }
}