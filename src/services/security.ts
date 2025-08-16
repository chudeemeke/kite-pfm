/**
 * Security Service - Refactored to use IndexedDB
 * Manages app security state using proper database storage
 */

import React from 'react'
import { db } from '@/db/schema'
import { useSettingsStore } from '@/stores/settings'
import { toast } from '@/stores'

export interface SecurityState {
  isLocked: boolean
  lastActivity: Date
  sessionTimeout: number
  pinEnabled: boolean
  biometricEnabled: boolean
}

class SecurityService {
  private state: SecurityState = {
    isLocked: false,
    lastActivity: new Date(),
    sessionTimeout: 5 * 60 * 1000, // 5 minutes in milliseconds
    pinEnabled: false,
    biometricEnabled: false
  }
  
  private listeners: Array<(state: SecurityState) => void> = []
  private activityTimeout: ReturnType<typeof setTimeout> | null = null
  private userId = 'default-user'
  private initialized = false

  constructor() {
    // Constructor should be lightweight
    // Initialization happens in init()
  }

  async init() {
    if (this.initialized) return
    
    await this.loadSecurityState()
    this.setupActivityListeners()
    
    const settings = useSettingsStore.getState()
    this.state.sessionTimeout = settings.privacy.autoLockTimer * 60 * 1000
    
    this.resetActivityTimer()
    this.notifyListeners()
    this.initialized = true
  }

  cleanup() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    this.removeActivityListeners()
    this.initialized = false
  }

  private async loadSecurityState() {
    try {
      // Load security settings from database
      const securitySettings = await db.securitySettings.get(`security-${this.userId}`)
      
      if (securitySettings) {
        this.state.pinEnabled = securitySettings.pinEnabled
        this.state.biometricEnabled = securitySettings.biometricEnabled
        this.state.sessionTimeout = (securitySettings.autoLockMinutes || 5) * 60 * 1000
      }
      
      // Load last activity from database
      const lastActivitySetting = await db.settings.get('last-activity')
      if (lastActivitySetting && lastActivitySetting.value) {
        this.state.lastActivity = new Date(lastActivitySetting.value)
      }
      
      // Check if PIN exists
      const pinCredential = await db.securityCredentials.get(`pin-${this.userId}`)
      this.state.pinEnabled = !!pinCredential
      
      // Load lock state from database - but only if security is enabled
      const lockStateSetting = await db.settings.get('app-lock-state')
      if (lockStateSetting && lockStateSetting.value) {
        const lockState = JSON.parse(lockStateSetting.value)
        // Only restore lock state if security is actually enabled
        this.state.isLocked = (lockState.isLocked && (this.state.pinEnabled || this.state.biometricEnabled)) || false
      }
      
    } catch (error) {
      console.error('Failed to load security state:', error)
    }
  }

  private async saveSecurityState() {
    try {
      // Save last activity
      await db.settings.put({
        id: 'last-activity',
        value: this.state.lastActivity.toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Save lock state
      await db.settings.put({
        id: 'app-lock-state',
        value: JSON.stringify({
          isLocked: this.state.isLocked,
          timestamp: new Date()
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to save security state:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  subscribe(listener: (state: SecurityState) => void) {
    this.listeners.push(listener)
    listener({ ...this.state })
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true)
    })
  }

  private removeActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true)
    })
  }

  private handleActivity = () => {
    if (!this.state.isLocked) {
      this.state.lastActivity = new Date()
      this.resetActivityTimer()
      this.saveSecurityState()
    }
  }

  private resetActivityTimer() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }

    // Only set activity timer if security is enabled
    if (this.state.sessionTimeout > 0 && (this.state.pinEnabled || this.state.biometricEnabled)) {
      this.activityTimeout = setTimeout(() => {
        this.lockApp()
      }, this.state.sessionTimeout)
    }
  }

  lockApp() {
    // Only lock if security is actually enabled
    if (!this.state.pinEnabled && !this.state.biometricEnabled) {
      // No security enabled, don't lock the app
      return
    }
    
    this.state.isLocked = true
    this.saveSecurityState()
    this.notifyListeners()
    toast.info('App locked', 'Enter your PIN to continue')
  }

  unlockApp() {
    this.state.isLocked = false
    this.state.lastActivity = new Date()
    this.saveSecurityState()
    this.resetActivityTimer()
    this.notifyListeners()
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { pinAuth } = await import('./biometric')
      
      const result = await pinAuth.verifyPIN(this.userId, pin)
      
      if (result.success) {
        this.unlockApp()
        return true
      }
      
      if (result.error) {
        toast.error('Invalid PIN', result.error)
      }
      
      return false
    } catch (error) {
      console.error('PIN verification failed:', error)
      toast.error('Verification failed', 'Please try again')
      return false
    }
  }

  async setupPin(pin: string): Promise<boolean> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { pinAuth } = await import('./biometric')
      
      await pinAuth.setupPIN(this.userId, pin)
      
      this.state.pinEnabled = true
      
      // Update security settings in database
      const settingsId = `security-${this.userId}`
      const existing = await db.securitySettings.get(settingsId)
      
      if (existing) {
        await db.securitySettings.update(settingsId, {
          pinEnabled: true,
          updatedAt: new Date()
        })
      } else {
        await db.securitySettings.add({
          id: settingsId,
          userId: this.userId,
          autoLockMinutes: 5,
          privacyMode: false,
          biometricEnabled: false,
          pinEnabled: true,
          updatedAt: new Date()
        })
      }
      
      await this.saveSecurityState()
      this.notifyListeners()
      
      toast.success('PIN created', 'Your PIN has been set successfully')
      return true
    } catch (error: any) {
      console.error('Failed to setup PIN:', error)
      toast.error('Setup failed', error.message || 'Failed to create PIN')
      return false
    }
  }

  async removePin(): Promise<boolean> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { pinAuth } = await import('./biometric')
      
      await pinAuth.removePIN(this.userId)
      
      this.state.pinEnabled = false
      
      // Update security settings in database
      const settingsId = `security-${this.userId}`
      const existing = await db.securitySettings.get(settingsId)
      
      if (existing) {
        await db.securitySettings.update(settingsId, {
          pinEnabled: false,
          updatedAt: new Date()
        })
      }
      
      await this.saveSecurityState()
      this.notifyListeners()
      
      toast.success('PIN removed', 'Your PIN has been removed')
      return true
    } catch (error) {
      console.error('Failed to remove PIN:', error)
      toast.error('Removal failed', 'Failed to remove PIN')
      return false
    }
  }

  async updateSessionTimeout(minutes: number) {
    this.state.sessionTimeout = minutes * 60 * 1000
    
    // Update in database
    const settingsId = `security-${this.userId}`
    const existing = await db.securitySettings.get(settingsId)
    
    if (existing) {
      await db.securitySettings.update(settingsId, {
        autoLockMinutes: minutes,
        updatedAt: new Date()
      })
    } else {
      await db.securitySettings.add({
        id: settingsId,
        userId: this.userId,
        autoLockMinutes: minutes,
        privacyMode: false,
        biometricEnabled: false,
        pinEnabled: false,
        updatedAt: new Date()
      })
    }
    
    this.resetActivityTimer()
    await this.saveSecurityState()
    this.notifyListeners()
  }

  async enableBiometric(): Promise<boolean> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { biometricAuth } = await import('./biometric')
      
      const isSupported = await biometricAuth.isSupported()
      if (!isSupported) {
        toast.error('Not supported', 'Biometric authentication is not available on this device')
        return false
      }
      
      const success = await biometricAuth.register(this.userId)
      
      if (success) {
        this.state.biometricEnabled = true
        
        // Update security settings in database
        const settingsId = `security-${this.userId}`
        const existing = await db.securitySettings.get(settingsId)
        
        if (existing) {
          await db.securitySettings.update(settingsId, {
            biometricEnabled: true,
            updatedAt: new Date()
          })
        } else {
          await db.securitySettings.add({
            id: settingsId,
            userId: this.userId,
            autoLockMinutes: 5,
            privacyMode: false,
            biometricEnabled: true,
            pinEnabled: false,
            updatedAt: new Date()
          })
        }
        
        await this.saveSecurityState()
        this.notifyListeners()
        
        toast.success('Biometric enabled', 'You can now use biometric authentication')
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('Failed to enable biometric:', error)
      toast.error('Setup failed', error.message || 'Failed to enable biometric authentication')
      return false
    }
  }

  async disableBiometric(): Promise<boolean> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { biometricAuth } = await import('./biometric')
      
      await biometricAuth.unregister(this.userId)
      
      this.state.biometricEnabled = false
      
      // Update security settings in database
      const settingsId = `security-${this.userId}`
      const existing = await db.securitySettings.get(settingsId)
      
      if (existing) {
        await db.securitySettings.update(settingsId, {
          biometricEnabled: false,
          updatedAt: new Date()
        })
      }
      
      await this.saveSecurityState()
      this.notifyListeners()
      
      toast.success('Biometric disabled', 'Biometric authentication has been disabled')
      return true
    } catch (error) {
      console.error('Failed to disable biometric:', error)
      toast.error('Removal failed', 'Failed to disable biometric authentication')
      return false
    }
  }

  getState(): SecurityState {
    return { ...this.state }
  }

  isPinEnabled(): boolean {
    return this.state.pinEnabled
  }

  isBiometricEnabled(): boolean {
    return this.state.biometricEnabled
  }

  isLocked(): boolean {
    return this.state.isLocked
  }
}

// Export singleton instance
export const securityService = new SecurityService()

// React hook for using security service
export function useSecurity() {
  const [state, setState] = React.useState<SecurityState>(securityService.getState())

  React.useEffect(() => {
    const unsubscribe = securityService.subscribe(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    lockApp: () => securityService.lockApp(),
    unlockApp: () => securityService.unlockApp(),
    verifyPin: (pin: string) => securityService.verifyPin(pin),
    setupPin: (pin: string) => securityService.setupPin(pin),
    removePin: () => securityService.removePin(),
    updateSessionTimeout: (minutes: number) => securityService.updateSessionTimeout(minutes),
    enableBiometric: () => securityService.enableBiometric(),
    disableBiometric: () => securityService.disableBiometric(),
    isPinEnabled: () => securityService.isPinEnabled(),
    isBiometricEnabled: () => securityService.isBiometricEnabled()
  }
}

// Export individual functions for convenience
export const lockApp = () => securityService.lockApp()
export const unlockApp = () => securityService.unlockApp()
export const verifyPin = (pin: string) => securityService.verifyPin(pin)
export const setupPin = (pin: string) => securityService.setupPin(pin)
export const removePin = () => securityService.removePin()
export const updateSessionTimeout = (minutes: number) => securityService.updateSessionTimeout(minutes)
export const enableBiometric = () => securityService.enableBiometric()
export const disableBiometric = () => securityService.disableBiometric()
export const isPinEnabled = () => securityService.isPinEnabled()
export const isBiometricEnabled = () => securityService.isBiometricEnabled()