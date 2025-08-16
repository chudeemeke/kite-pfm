/**
 * Backup Service
 * Manages data backups using IndexedDB instead of localStorage
 * Provides secure backup and restore functionality
 */

import { db } from '@/db/schema'
import { encryptionService } from './encryption'
import type { Backup, BackupData } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export class BackupService {
  private readonly APP_VERSION = '1.0.0'
  private readonly MAX_BACKUPS = 10
  
  /**
   * Create a new backup
   */
  async createBackup(name?: string, type: 'manual' | 'automatic' = 'manual'): Promise<Backup> {
    try {
      // Gather all data from the database
      const backupData: BackupData = {
        accounts: await db.accounts.toArray(),
        transactions: await db.transactions.toArray(),
        categories: await db.categories.toArray(),
        budgets: await db.budgets.toArray(),
        rules: await db.rules.toArray(),
        subscriptions: await db.subscriptions.toArray(),
        goals: await db.goals.toArray(),
        goalMilestones: await db.goalMilestones.toArray(),
        goalContributions: await db.goalContributions.toArray(),
        settings: await db.settings.get('kite-settings-store') || undefined,
        exportDate: new Date(),
        appVersion: this.APP_VERSION
      }
      
      // Convert to JSON string
      const jsonData = JSON.stringify(backupData)
      
      // Calculate size
      const size = new TextEncoder().encode(jsonData).length
      
      // Generate backup ID
      const backupId = uuidv4()
      
      // Create backup name
      const backupName = name || `Backup ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
      
      // Optionally encrypt the backup data
      let dataToStore = jsonData
      const encryptionEnabled = await this.isEncryptionEnabled()
      if (encryptionEnabled) {
        const password = await this.getBackupPassword()
        if (password) {
          dataToStore = await encryptionService.encrypt(jsonData, password)
        }
      }
      
      // Create backup object
      const backup: Backup = {
        id: backupId,
        name: backupName,
        createdAt: new Date(),
        size,
        type,
        encryptedData: dataToStore,
        metadata: {
          accounts: backupData.accounts.length,
          transactions: backupData.transactions.length,
          categories: backupData.categories.length,
          budgets: backupData.budgets.length,
          goals: backupData.goals?.length || 0,
          version: this.APP_VERSION
        }
      }
      
      // Store in database
      await db.backups.add(backup)
      
      // Clean up old backups if needed
      await this.cleanupOldBackups(type)
      
      return backup
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw new Error('Failed to create backup')
    }
  }
  
  /**
   * Restore from a backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    try {
      // Get the backup from database
      const backup = await db.backups.get(backupId)
      
      if (!backup) {
        throw new Error('Backup not found')
      }
      
      // Decrypt if needed
      let jsonData = backup.encryptedData!
      const encryptionEnabled = await this.isEncryptionEnabled()
      if (encryptionEnabled) {
        const password = await this.getBackupPassword()
        if (password) {
          try {
            const decrypted = await encryptionService.decrypt(jsonData, password)
            jsonData = new TextDecoder().decode(decrypted)
          } catch {
            // Not encrypted or wrong password, try as plain text
          }
        }
      }
      
      // Parse backup data
      const backupData: BackupData = JSON.parse(jsonData)
      
      // Clear existing data
      await db.transaction('rw', db.tables, async () => {
          // Clear all tables
          await Promise.all([
            db.accounts.clear(),
            db.transactions.clear(),
            db.categories.clear(),
            db.budgets.clear(),
            db.rules.clear(),
            db.subscriptions.clear(),
            db.goals.clear(),
            db.goalMilestones.clear(),
            db.goalContributions.clear()
          ])
          
          // Restore data
          if (backupData.accounts.length > 0) {
            await db.accounts.bulkAdd(backupData.accounts)
          }
          if (backupData.transactions.length > 0) {
            await db.transactions.bulkAdd(backupData.transactions)
          }
          if (backupData.categories.length > 0) {
            await db.categories.bulkAdd(backupData.categories)
          }
          if (backupData.budgets.length > 0) {
            await db.budgets.bulkAdd(backupData.budgets)
          }
          if (backupData.rules && backupData.rules.length > 0) {
            await db.rules.bulkAdd(backupData.rules)
          }
          if (backupData.subscriptions && backupData.subscriptions.length > 0) {
            await db.subscriptions.bulkAdd(backupData.subscriptions)
          }
          if (backupData.goals && backupData.goals.length > 0) {
            await db.goals.bulkAdd(backupData.goals)
          }
          if (backupData.goalMilestones && backupData.goalMilestones.length > 0) {
            await db.goalMilestones.bulkAdd(backupData.goalMilestones)
          }
          if (backupData.goalContributions && backupData.goalContributions.length > 0) {
            await db.goalContributions.bulkAdd(backupData.goalContributions)
          }
          
          // Restore settings if available
          if (backupData.settings) {
            await db.settings.put({
              id: 'kite-settings-store',
              value: JSON.stringify(backupData.settings),
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        }
      )
      
      // Update last restore metadata
      await db.settings.put({
        id: 'last-restore',
        value: JSON.stringify({
          backupId,
          backupName: backup.name,
          restoredAt: new Date()
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error('Failed to restore backup')
    }
  }
  
  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await db.backups.delete(backupId)
    } catch (error) {
      console.error('Failed to delete backup:', error)
      throw new Error('Failed to delete backup')
    }
  }
  
  /**
   * Get all backups
   */
  async getAllBackups(): Promise<Backup[]> {
    try {
      const backups = await db.backups
        .orderBy('createdAt')
        .reverse()
        .toArray()
      
      return backups
    } catch (error) {
      console.error('Failed to get backups:', error)
      return []
    }
  }
  
  /**
   * Export backup to file
   */
  async exportBackup(backupId: string): Promise<Blob> {
    try {
      const backup = await db.backups.get(backupId)
      
      if (!backup) {
        throw new Error('Backup not found')
      }
      
      // Create export data
      const exportData = {
        backup,
        exportedAt: new Date(),
        appVersion: this.APP_VERSION
      }
      
      // Convert to JSON and create blob
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      return blob
    } catch (error) {
      console.error('Failed to export backup:', error)
      throw new Error('Failed to export backup')
    }
  }
  
  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<Backup> {
    try {
      const text = await file.text()
      const exportData = JSON.parse(text)
      
      if (!exportData.backup) {
        throw new Error('Invalid backup file')
      }
      
      const backup = exportData.backup as Backup
      
      // Generate new ID to avoid conflicts
      backup.id = uuidv4()
      backup.name = `Imported: ${backup.name}`
      
      // Store in database
      await db.backups.add(backup)
      
      return backup
    } catch (error) {
      console.error('Failed to import backup:', error)
      throw new Error('Failed to import backup')
    }
  }
  
  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(type: 'manual' | 'automatic'): Promise<void> {
    try {
      const backups = await db.backups
        .where('type')
        .equals(type)
        .reverse()
        .sortBy('createdAt')
      
      // Keep only the most recent backups
      const maxToKeep = type === 'automatic' ? 5 : this.MAX_BACKUPS
      
      if (backups.length > maxToKeep) {
        const toDelete = backups.slice(maxToKeep)
        
        for (const backup of toDelete) {
          await db.backups.delete(backup.id)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error)
    }
  }
  
  /**
   * Check if encryption is enabled
   */
  private async isEncryptionEnabled(): Promise<boolean> {
    try {
      const setting = await db.settings.get('backup-encryption-enabled')
      return setting ? setting.value === 'true' : false
    } catch {
      return false
    }
  }
  
  /**
   * Get backup password
   */
  private async getBackupPassword(): Promise<string | null> {
    try {
      const setting = await db.settings.get('backup-password')
      return setting ? setting.value : null
    } catch {
      return null
    }
  }
  
  /**
   * Set backup password
   */
  async setBackupPassword(password: string): Promise<void> {
    const hashedPassword = await encryptionService.hash(password)
    
    await db.settings.put({
      id: 'backup-password',
      value: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await db.settings.put({
      id: 'backup-encryption-enabled',
      value: 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  /**
   * Remove backup password
   */
  async removeBackupPassword(): Promise<void> {
    await db.settings.delete('backup-password')
    await db.settings.put({
      id: 'backup-encryption-enabled',
      value: 'false',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  /**
   * Schedule automatic backups
   */
  scheduleAutomaticBackups(intervalHours: number = 24): void {
    // Clear any existing interval
    const existingInterval = (window as any).__backupInterval
    if (existingInterval) {
      clearInterval(existingInterval)
    }
    
    // Set new interval
    const interval = setInterval(async () => {
      try {
        await this.createBackup('Automatic Backup', 'automatic')
        console.log('Automatic backup created')
      } catch (error) {
        console.error('Failed to create automatic backup:', error)
      }
    }, intervalHours * 60 * 60 * 1000);
    
    // Store interval reference
    (window as any).__backupInterval = interval
  }
  
  /**
   * Stop automatic backups
   */
  stopAutomaticBackups(): void {
    const interval = (window as any).__backupInterval
    if (interval) {
      clearInterval(interval)
      delete (window as any).__backupInterval
    }
  }
}

// Export singleton instance
export const backupService = new BackupService()

// Export convenience functions
export const createBackup = (name?: string, type?: 'manual' | 'automatic') =>
  backupService.createBackup(name, type)

export const restoreBackup = (backupId: string) =>
  backupService.restoreBackup(backupId)

export const deleteBackup = (backupId: string) =>
  backupService.deleteBackup(backupId)

export const getAllBackups = () =>
  backupService.getAllBackups()

export const exportBackup = (backupId: string) =>
  backupService.exportBackup(backupId)

export const importBackup = (file: File) =>
  backupService.importBackup(file)