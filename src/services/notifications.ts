/**
 * Notification Service - Refactored to use IndexedDB
 * Manages notifications using proper database storage
 */

import React from 'react'
import { db } from '@/db/schema'
import { useSettingsStore } from '@/stores/settings'
import { useTransactionsStore } from '@/stores/transactions'
import { useBudgetsStore } from '@/stores/budgets'
import { formatCurrency } from './format'
import type { Notification } from '@/types'
import { v4 as uuidv4 } from 'uuid'

class NotificationService {
  private listeners: Array<(notifications: Notification[]) => void> = []
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private userId = 'default-user'
  private initialized = false

  constructor() {
    // Constructor should be lightweight
    // Initialization happens in init()
  }

  async init() {
    if (this.initialized) return
    
    // Start checking for notifications every minute
    this.checkInterval = setInterval(() => {
      this.checkNotifications()
    }, 60000) // 1 minute

    // Initial check
    await this.checkNotifications()
    this.initialized = true
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.initialized = false
  }

  private async loadNotifications(): Promise<Notification[]> {
    try {
      // Load notifications from database for current user
      const userNotifications = await db.notifications
        .where('userId')
        .equals(this.userId)
        .reverse()
        .sortBy('timestamp')
      
      // Return only the last 50 notifications
      return userNotifications.slice(0, 50)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      return []
    }
  }

  private async saveNotification(notification: Notification): Promise<void> {
    try {
      await db.notifications.add(notification)
      
      // Clean up old notifications (keep only last 100)
      const allNotifications = await db.notifications
        .where('userId')
        .equals(this.userId)
        .reverse()
        .sortBy('timestamp')
      
      if (allNotifications.length > 100) {
        const toDelete = allNotifications.slice(100)
        const deleteIds = toDelete.map(n => n.id)
        await db.notifications.bulkDelete(deleteIds)
      }
    } catch (error) {
      console.error('Failed to save notification:', error)
    }
  }

  private async notifyListeners() {
    const notifications = await this.loadNotifications()
    this.listeners.forEach(listener => listener(notifications))
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    
    // Immediately call with current notifications
    this.loadNotifications().then(notifications => {
      listener(notifications)
    })
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'>) {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date(),
      read: false,
      userId: this.userId
    }

    await this.saveNotification(newNotification)
    await this.notifyListeners()

    // Show toast notification if settings allow
    const settings = useSettingsStore.getState()
    if (settings.notifications.soundEffects) {
      // Play notification sound if available
      try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {})
      } catch {}
    }

    return newNotification
  }

  async markAsRead(notificationId: string) {
    try {
      await db.notifications.update(notificationId, { read: true })
      await this.notifyListeners()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async markAllAsRead() {
    try {
      const notifications = await db.notifications
        .where('userId')
        .equals(this.userId)
        .and(n => !n.read)
        .toArray()
      
      const updatePromises = notifications.map(n => 
        db.notifications.update(n.id, { read: true })
      )
      
      await Promise.all(updatePromises)
      await this.notifyListeners()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      await db.notifications.delete(notificationId)
      await this.notifyListeners()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  async clearAllNotifications() {
    try {
      const userNotifications = await db.notifications
        .where('userId')
        .equals(this.userId)
        .toArray()
      
      const deleteIds = userNotifications.map(n => n.id)
      await db.notifications.bulkDelete(deleteIds)
      await this.notifyListeners()
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const count = await db.notifications
        .where('userId')
        .equals(this.userId)
        .and(n => !n.read)
        .count()
      
      return count
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  private async checkNotifications() {
    const settings = useSettingsStore.getState()
    
    if (!settings.notifications.emailAlerts && !settings.notifications.pushNotifications) {
      return // Notifications are disabled
    }

    // Check for budget alerts
    if (settings.notifications.budgetAlerts) {
      await this.checkBudgetAlerts()
    }

    // Check for large transactions
    await this.checkLargeTransactions()

    // Check for weekly summary (on Sundays)
    const now = new Date()
    if (now.getDay() === 0 && now.getHours() === 9 && now.getMinutes() < 1) {
      await this.generateWeeklySummary()
    }

    // Check for monthly report (on 1st of month)
    if (now.getDate() === 1 && now.getHours() === 9 && now.getMinutes() < 1) {
      await this.generateMonthlyReport()
    }

    // Check for goal progress
    await this.checkGoalProgress()

    // Check for anomalies
    await this.checkAnomalies()
  }

  private async checkBudgetAlerts() {
    const budgets = useBudgetsStore.getState().budgets
    const transactions = useTransactionsStore.getState().transactions
    const currentMonth = new Date().toISOString().slice(0, 7)

    for (const budget of budgets) {
      const monthTransactions = transactions.filter(t => 
        t.categoryId === budget.categoryId &&
        t.date.toISOString().slice(0, 7) === currentMonth
      )

      const spent = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const percentage = (spent / budget.amount) * 100

      if (percentage >= 90 && percentage < 100) {
        // Check if we already sent this alert today
        const existingAlert = await db.notifications
          .where('type')
          .equals('budget_alert')
          .and(n => 
            n.userId === this.userId &&
            n.data?.budgetId === budget.id &&
            n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
          )
          .first()

        if (!existingAlert) {
          await this.addNotification({
            type: 'budget_alert',
            title: 'Budget Alert',
            message: `You've used ${percentage.toFixed(0)}% of your budget for ${budget.categoryId}`,
            severity: 'warning',
            data: { budgetId: budget.id, percentage, spent, budget: budget.amount }
          })
        }
      } else if (percentage >= 100) {
        // Over budget alert
        const existingAlert = await db.notifications
          .where('type')
          .equals('budget_alert')
          .and(n => 
            n.userId === this.userId &&
            n.data?.budgetId === budget.id &&
            n.data?.overBudget === true &&
            n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
          )
          .first()

        if (!existingAlert) {
          await this.addNotification({
            type: 'budget_alert',
            title: 'Over Budget!',
            message: `You've exceeded your budget for ${budget.categoryId} by ${formatCurrency(spent - budget.amount)}`,
            severity: 'error',
            data: { budgetId: budget.id, percentage, spent, budget: budget.amount, overBudget: true }
          })
        }
      }
    }
  }

  private async checkLargeTransactions() {
    const transactions = useTransactionsStore.getState().transactions
    const settings = useSettingsStore.getState()
    const threshold = 500 // $500 threshold for large transactions

    // Check transactions from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const largeTransactions = transactions.filter(t => 
      Math.abs(t.amount) >= threshold &&
      t.date > oneHourAgo
    )

    for (const transaction of largeTransactions) {
      // Check if we already notified about this transaction
      const existingNotification = await db.notifications
        .where('type')
        .equals('large_transaction')
        .and(n => 
          n.userId === this.userId &&
          n.data?.transactionId === transaction.id
        )
        .first()

      if (!existingNotification) {
        await this.addNotification({
          type: 'large_transaction',
          title: 'Large Transaction Detected',
          message: `${transaction.description} for ${formatCurrency(Math.abs(transaction.amount))}`,
          severity: 'info',
          data: { transactionId: transaction.id, amount: transaction.amount }
        })
      }
    }
  }

  private async generateWeeklySummary() {
    const transactions = useTransactionsStore.getState().transactions
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const weekTransactions = transactions.filter(t => t.date > oneWeekAgo)
    const totalSpent = weekTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const totalIncome = weekTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    await this.addNotification({
      type: 'weekly_summary',
      title: 'Weekly Summary',
      message: `Spent: ${formatCurrency(totalSpent)}, Income: ${formatCurrency(totalIncome)}`,
      severity: 'info',
      data: { totalSpent, totalIncome, transactionCount: weekTransactions.length }
    })
  }

  private async generateMonthlyReport() {
    const transactions = useTransactionsStore.getState().transactions
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthString = lastMonth.toISOString().slice(0, 7)
    
    const monthTransactions = transactions.filter(t => 
      t.date.toISOString().slice(0, 7) === lastMonthString
    )
    
    const totalSpent = monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const totalIncome = monthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const netSavings = totalIncome - totalSpent

    await this.addNotification({
      type: 'monthly_report',
      title: `${lastMonth.toLocaleDateString('en-US', { month: 'long' })} Report`,
      message: `Net ${netSavings >= 0 ? 'Savings' : 'Loss'}: ${formatCurrency(Math.abs(netSavings))}`,
      severity: netSavings >= 0 ? 'success' : 'warning',
      data: { 
        month: lastMonthString, 
        totalSpent, 
        totalIncome, 
        netSavings,
        transactionCount: monthTransactions.length 
      }
    })
  }

  private async checkGoalProgress() {
    try {
      const goals = await db.goals
        .where('userId')
        .equals(this.userId)
        .and(goal => goal.status === 'active')
        .toArray()

      for (const goal of goals) {
        const contributions = await db.goalContributions
          .where('goalId')
          .equals(goal.id)
          .toArray()

        const currentAmount = contributions.reduce((sum, c) => sum + c.amount, 0)
        const percentage = (currentAmount / goal.targetAmount) * 100

        // Check milestones
        if (percentage >= 25 && percentage < 30) {
          await this.checkAndNotifyMilestone(goal, 25, currentAmount)
        } else if (percentage >= 50 && percentage < 55) {
          await this.checkAndNotifyMilestone(goal, 50, currentAmount)
        } else if (percentage >= 75 && percentage < 80) {
          await this.checkAndNotifyMilestone(goal, 75, currentAmount)
        } else if (percentage >= 100) {
          await this.checkAndNotifyGoalComplete(goal, currentAmount)
        }
      }
    } catch (error) {
      console.error('Failed to check goal progress:', error)
    }
  }

  private async checkAndNotifyMilestone(goal: any, milestone: number, currentAmount: number) {
    // Check if we already notified about this milestone
    const existingNotification = await db.notifications
      .where('type')
      .equals('goal_progress')
      .and(n => 
        n.userId === this.userId &&
        n.data?.goalId === goal.id &&
        n.data?.milestone === milestone
      )
      .first()

    if (!existingNotification) {
      await this.addNotification({
        type: 'goal_progress',
        title: `${milestone}% Goal Milestone!`,
        message: `You've reached ${milestone}% of your "${goal.name}" goal`,
        severity: 'success',
        data: { goalId: goal.id, milestone, currentAmount, targetAmount: goal.targetAmount }
      })
    }
  }

  private async checkAndNotifyGoalComplete(goal: any, currentAmount: number) {
    // Check if we already notified about completion
    const existingNotification = await db.notifications
      .where('type')
      .equals('goal_progress')
      .and(n => 
        n.userId === this.userId &&
        n.data?.goalId === goal.id &&
        n.data?.complete === true
      )
      .first()

    if (!existingNotification) {
      await this.addNotification({
        type: 'goal_progress',
        title: 'Goal Achieved! 🎉',
        message: `Congratulations! You've completed your "${goal.name}" goal`,
        severity: 'success',
        data: { goalId: goal.id, complete: true, currentAmount, targetAmount: goal.targetAmount }
      })
    }
  }

  private async checkAnomalies() {
    try {
      // Check for recent anomalies that haven't been notified
      const recentAnomalies = await db.anomalyInsights
        .where('dismissed')
        .equals(false)
        .and(anomaly => 
          anomaly.detectedAt > new Date(Date.now() - 60 * 60 * 1000) // Last hour
        )
        .toArray()

      for (const anomaly of recentAnomalies) {
        // Check if we already notified about this anomaly
        const existingNotification = await db.notifications
          .where('type')
          .equals('anomaly_detected')
          .and(n => 
            n.userId === this.userId &&
            n.data?.anomalyId === anomaly.id
          )
          .first()

        if (!existingNotification) {
          await this.addNotification({
            type: 'anomaly_detected',
            title: 'Unusual Activity Detected',
            message: anomaly.description,
            severity: anomaly.severity as 'info' | 'warning' | 'error',
            data: { anomalyId: anomaly.id, type: anomaly.type }
          })
        }
      }
    } catch (error) {
      console.error('Failed to check anomalies:', error)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// React hook for using notifications
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    
    // Update unread count
    notificationService.getUnreadCount().then(setUnreadCount)
    
    return unsubscribe
  }, [])

  React.useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead: (id: string) => notificationService.markAsRead(id),
    markAllAsRead: () => notificationService.markAllAsRead(),
    deleteNotification: (id: string) => notificationService.deleteNotification(id),
    clearAll: () => notificationService.clearAllNotifications()
  }
}

// Export convenience functions
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'>) =>
  notificationService.addNotification(notification)

export const markNotificationAsRead = (id: string) =>
  notificationService.markAsRead(id)

export const markAllNotificationsAsRead = () =>
  notificationService.markAllAsRead()

export const deleteNotification = (id: string) =>
  notificationService.deleteNotification(id)

export const clearAllNotifications = () =>
  notificationService.clearAllNotifications()

export const getUnreadNotificationCount = () =>
  notificationService.getUnreadCount()