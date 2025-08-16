/**
 * Test utility to verify database operations
 * Run this in the browser console to test database functionality
 */

import { db } from '@/db/schema'
import { demoDataGenerator } from '@/services/demoDataGenerator'

export const testDatabaseOperations = {
  async testClearData() {
    console.log('🧪 Testing data clear...')
    
    try {
      // Count records before
      const beforeCounts = {
        accounts: await db.accounts.count(),
        transactions: await db.transactions.count(),
        categories: await db.categories.count(),
        budgets: await db.budgets.count()
      }
      console.log('Before clear:', beforeCounts)
      
      // Clear all data
      if (db.clearAllData) {
        await db.clearAllData()
      } else {
        await db.transaction('rw', db.tables, async () => {
          const clearPromises = db.tables.map(table => table.clear())
          await Promise.all(clearPromises)
        })
      }
      
      // Count records after
      const afterCounts = {
        accounts: await db.accounts.count(),
        transactions: await db.transactions.count(),
        categories: await db.categories.count(),
        budgets: await db.budgets.count()
      }
      console.log('After clear:', afterCounts)
      
      const allCleared = Object.values(afterCounts).every(count => count === 0)
      console.log(allCleared ? '✅ Data cleared successfully' : '❌ Data not fully cleared')
      
      return allCleared
    } catch (error) {
      console.error('❌ Error clearing data:', error)
      return false
    }
  },
  
  async testLoadDemoData() {
    console.log('🧪 Testing demo data load...')
    
    try {
      // Clear first
      await demoDataGenerator.clearAllDemoData()
      
      // Load demo data
      await demoDataGenerator.generateComprehensiveDemoData()
      
      // Count records
      const counts = {
        accounts: await db.accounts.count(),
        transactions: await db.transactions.count(),
        categories: await db.categories.count(),
        budgets: await db.budgets.count(),
        goals: await db.goals.count(),
        notifications: await db.notifications.count()
      }
      console.log('After loading demo data:', counts)
      
      const hasData = counts.accounts > 0 && counts.transactions > 100
      console.log(hasData ? '✅ Demo data loaded successfully' : '❌ Demo data failed to load')
      
      return hasData
    } catch (error) {
      console.error('❌ Error loading demo data:', error)
      return false
    }
  },
  
  async testFullCycle() {
    console.log('🧪 Testing full cycle: Clear → Load → Clear...')
    
    // Test clearing
    const clearResult1 = await this.testClearData()
    if (!clearResult1) {
      console.error('❌ First clear failed')
      return false
    }
    
    // Test loading
    const loadResult = await this.testLoadDemoData()
    if (!loadResult) {
      console.error('❌ Load failed')
      return false
    }
    
    // Test clearing again
    const clearResult2 = await this.testClearData()
    if (!clearResult2) {
      console.error('❌ Second clear failed')
      return false
    }
    
    console.log('✅ Full cycle test passed!')
    return true
  },
  
  async runAllTests() {
    console.log('🚀 Running all database operation tests...')
    console.log('=====================================')
    
    const results = {
      clearData: await this.testClearData(),
      loadDemoData: await this.testLoadDemoData(),
      fullCycle: await this.testFullCycle()
    }
    
    console.log('=====================================')
    console.log('Test Results:', results)
    console.log('All tests passed:', Object.values(results).every(r => r))
    
    return results
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testDB = testDatabaseOperations
  console.log('Database test utilities loaded. Use window.testDB.runAllTests() to test.')
}