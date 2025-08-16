/**
 * IndexedDB Storage Adapter for Zustand
 * Replaces localStorage with IndexedDB using Dexie
 * Provides persistent storage that works across all browsers
 */

import { db } from '@/db/schema'
import type { StateStorage } from 'zustand/middleware'

/**
 * Custom IndexedDB storage adapter for Zustand persist middleware
 * Uses the existing Dexie database for consistent data management
 */
export const createIndexedDBStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // Check if database is initialized
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Get the setting from the database
        const setting = await db.settings.get(name)
        
        if (setting && setting.value) {
          // Return the stored value
          return setting.value
        }
        
        return null
      } catch (error) {
        console.error(`Error getting item ${name} from IndexedDB:`, error)
        return null
      }
    },
    
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        // Check if database is initialized
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Check if the setting already exists
        const existing = await db.settings.get(name)
        
        if (existing) {
          // Update existing setting
          await db.settings.update(name, {
            value,
            updatedAt: new Date()
          })
        } else {
          // Create new setting
          await db.settings.add({
            id: name,
            value,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      } catch (error) {
        console.error(`Error setting item ${name} in IndexedDB:`, error)
        throw error
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        // Check if database is initialized
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Delete the setting from the database
        await db.settings.delete(name)
      } catch (error) {
        console.error(`Error removing item ${name} from IndexedDB:`, error)
        throw error
      }
    }
  }
}

/**
 * Fallback to localStorage if IndexedDB is not available
 * This ensures the app still works in restricted environments
 */
export const createFallbackStorage = (): StateStorage => {
  // Check if localStorage is available
  const isLocalStorageAvailable = (() => {
    try {
      const test = '__localStorage_test__'
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  })()
  
  if (!isLocalStorageAvailable) {
    // Use in-memory storage as last resort
    const memoryStorage = new Map<string, string>()
    
    return {
      getItem: (name: string) => Promise.resolve(memoryStorage.get(name) ?? null),
      setItem: (name: string, value: string) => {
        memoryStorage.set(name, value)
        return Promise.resolve()
      },
      removeItem: (name: string) => {
        memoryStorage.delete(name)
        return Promise.resolve()
      }
    }
  }
  
  // Use localStorage with Promise wrapper
  return {
    getItem: (name: string) => {
      const value = window.localStorage.getItem(name)
      return Promise.resolve(value)
    },
    setItem: (name: string, value: string) => {
      window.localStorage.setItem(name, value)
      return Promise.resolve()
    },
    removeItem: (name: string) => {
      window.localStorage.removeItem(name)
      return Promise.resolve()
    }
  }
}

/**
 * Main storage adapter that tries IndexedDB first, then falls back
 */
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string) => {
    try {
      // Try IndexedDB first
      const storage = createIndexedDBStorage()
      return await storage.getItem(name)
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error)
      // Fall back to localStorage
      const fallback = createFallbackStorage()
      return await fallback.getItem(name)
    }
  },
  
  setItem: async (name: string, value: string) => {
    try {
      // Try IndexedDB first
      const storage = createIndexedDBStorage()
      await storage.setItem(name, value)
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error)
      // Fall back to localStorage
      const fallback = createFallbackStorage()
      await fallback.setItem(name, value)
    }
  },
  
  removeItem: async (name: string) => {
    try {
      // Try IndexedDB first
      const storage = createIndexedDBStorage()
      await storage.removeItem(name)
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error)
      // Fall back to localStorage
      const fallback = createFallbackStorage()
      await fallback.removeItem(name)
    }
  }
}

// Export default storage
export default indexedDBStorage