/**
 * Typed IndexedDB Storage Adapter for Zustand
 * Provides type-safe storage using Dexie
 */

import { db } from '@/db/schema'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * Create a typed IndexedDB storage adapter for Zustand persist middleware
 * @template S The state type
 */
export function createTypedIndexedDBStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name: string): Promise<StorageValue<S> | null> => {
      try {
        // Check if database is initialized
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Get the setting from the database
        const setting = await db.settings.get(name)
        
        if (setting && setting.value) {
          // Parse and return the stored value
          const parsed = JSON.parse(setting.value)
          return {
            state: parsed.state,
            version: parsed.version
          } as StorageValue<S>
        }
        
        return null
      } catch (error) {
        console.error(`Error getting item ${name} from IndexedDB:`, error)
        return null
      }
    },
    
    setItem: async (name: string, value: StorageValue<S>): Promise<void> => {
      try {
        // Check if database is initialized
        if (!db.isOpen()) {
          await db.open()
        }
        
        // Serialize the value
        const serialized = JSON.stringify(value)
        
        // Check if the setting already exists
        const existing = await db.settings.get(name)
        
        if (existing) {
          // Update existing setting
          await db.settings.update(name, {
            value: serialized,
            updatedAt: new Date()
          })
        } else {
          // Create new setting
          await db.settings.add({
            id: name,
            value: serialized,
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
 * @template S The state type
 */
export function createFallbackStorage<S>(): PersistStorage<S> {
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
      getItem: async (name: string): Promise<StorageValue<S> | null> => {
        const value = memoryStorage.get(name)
        if (!value) return null
        
        try {
          return JSON.parse(value) as StorageValue<S>
        } catch {
          return null
        }
      },
      setItem: async (name: string, value: StorageValue<S>): Promise<void> => {
        memoryStorage.set(name, JSON.stringify(value))
      },
      removeItem: async (name: string): Promise<void> => {
        memoryStorage.delete(name)
      }
    }
  }
  
  // Use localStorage with Promise wrapper
  return {
    getItem: async (name: string): Promise<StorageValue<S> | null> => {
      const value = window.localStorage.getItem(name)
      if (!value) return null
      
      try {
        return JSON.parse(value) as StorageValue<S>
      } catch {
        return null
      }
    },
    setItem: async (name: string, value: StorageValue<S>): Promise<void> => {
      window.localStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: async (name: string): Promise<void> => {
      window.localStorage.removeItem(name)
    }
  }
}

/**
 * Main storage adapter that tries IndexedDB first, then falls back
 * @template S The state type
 */
export function createIndexedDBStorage<S>(): PersistStorage<S> {
  const indexedDBStorage = createTypedIndexedDBStorage<S>()
  const fallbackStorage = createFallbackStorage<S>()
  
  return {
    getItem: async (name: string): Promise<StorageValue<S> | null> => {
      try {
        // Try IndexedDB first
        return await indexedDBStorage.getItem(name)
      } catch (error) {
        console.warn('IndexedDB not available, falling back to localStorage:', error)
        // Fall back to localStorage
        return await fallbackStorage.getItem(name)
      }
    },
    
    setItem: async (name: string, value: StorageValue<S>): Promise<void> => {
      try {
        // Try IndexedDB first
        await indexedDBStorage.setItem(name, value)
      } catch (error) {
        console.warn('IndexedDB not available, falling back to localStorage:', error)
        // Fall back to localStorage
        await fallbackStorage.setItem(name, value)
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        // Try IndexedDB first
        await indexedDBStorage.removeItem(name)
      } catch (error) {
        console.warn('IndexedDB not available, falling back to localStorage:', error)
        // Fall back to localStorage
        await fallbackStorage.removeItem(name)
      }
    }
  }
}