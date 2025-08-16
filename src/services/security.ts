import React from 'react'
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
  private activityTimeout: number | null = null
  private storedPin: string | null = null

  constructor() {
    this.loadSecurityState()
    this.setupActivityListeners()
  }

  init() {
    const settings = useSettingsStore.getState()
    this.state.sessionTimeout = settings.privacy.autoLockTimer * 60 * 1000
    this.state.pinEnabled = this.storedPin !== null
    this.state.biometricEnabled = settings.privacy.biometricUnlock
    
    this.resetActivityTimer()
    this.notifyListeners()
  }

  cleanup() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    this.removeActivityListeners()
  }

  private loadSecurityState() {
    try {
      const stored = localStorage.getItem('kite-security-state')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.state = {
          ...this.state,
          ...parsed,
          lastActivity: new Date(parsed.lastActivity)
        }
      }
      
      // Load stored PIN
      this.storedPin = localStorage.getItem('kite-security-pin')
    } catch (error) {
      console.error('Failed to load security state:', error)
    }
  }

  private saveSecurityState() {
    try {
      localStorage.setItem('kite-security-state', JSON.stringify({
        ...this.state,
        lastActivity: this.state.lastActivity.toISOString()
      }))
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
    if (this.state.isLocked) return
    
    this.state.lastActivity = new Date()
    this.resetActivityTimer()
  }

  private resetActivityTimer() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }

    if (this.state.sessionTimeout > 0) {
      this.activityTimeout = setTimeout(() => {
        this.lockApp('Session timeout')
      }, this.state.sessionTimeout)
    }
  }

  lockApp(reason: string = 'Manual lock') {
    this.state.isLocked = true
    this.saveSecurityState()
    this.notifyListeners()
    
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout)
    }
    
    toast.info('App locked', reason)
  }

  async unlockApp(pin?: string, useBiometric: boolean = false): Promise<boolean> {
    try {
      if (this.state.pinEnabled && !useBiometric) {
        if (!pin || !this.verifyPin(pin)) {
          throw new Error('Invalid PIN')
        }
      }
      
      if (useBiometric && this.state.biometricEnabled) {
        const biometricResult = await this.authenticateWithBiometric()
        if (!biometricResult) {
          throw new Error('Biometric authentication failed')
        }
      }
      
      this.state.isLocked = false
      this.state.lastActivity = new Date()
      this.resetActivityTimer()
      this.saveSecurityState()
      this.notifyListeners()
      
      return true
    } catch (error) {
      console.error('Failed to unlock app:', error)
      toast.error('Unlock failed', error instanceof Error ? error.message : 'Please try again')
      return false
    }
  }

  async setPin(newPin: string, currentPin?: string): Promise<boolean> {
    try {
      // If PIN is already set, verify current PIN first
      if (this.storedPin && currentPin && !this.verifyPin(currentPin)) {
        throw new Error('Current PIN is incorrect')
      }
      
      // Validate new PIN
      if (newPin.length < 4 || newPin.length > 8) {
        throw new Error('PIN must be between 4 and 8 digits')
      }
      
      if (!/^\d+$/.test(newPin)) {
        throw new Error('PIN must contain only numbers')
      }
      
      // Hash and store the PIN (in a real app, use proper encryption)
      const hashedPin = btoa(newPin) // Basic encoding, use proper hashing in production
      localStorage.setItem('kite-security-pin', hashedPin)
      this.storedPin = hashedPin
      
      this.state.pinEnabled = true
      this.saveSecurityState()
      this.notifyListeners()
      
      toast.success('PIN updated', 'Your security PIN has been set')
      return true
    } catch (error) {
      console.error('Failed to set PIN:', error)
      toast.error('Failed to set PIN', error instanceof Error ? error.message : 'Please try again')
      return false
    }
  }

  removePin(currentPin: string): boolean {
    try {
      if (!this.verifyPin(currentPin)) {
        throw new Error('Current PIN is incorrect')
      }
      
      localStorage.removeItem('kite-security-pin')
      this.storedPin = null
      this.state.pinEnabled = false
      this.saveSecurityState()
      this.notifyListeners()
      
      toast.success('PIN removed', 'Security PIN has been disabled')
      return true
    } catch (error) {
      console.error('Failed to remove PIN:', error)
      toast.error('Failed to remove PIN', error instanceof Error ? error.message : 'Please try again')
      return false
    }
  }

  private verifyPin(pin: string): boolean {
    if (!this.storedPin) return false
    
    try {
      const decodedPin = atob(this.storedPin)
      return pin === decodedPin
    } catch (error) {
      console.error('Failed to verify PIN:', error)
      return false
    }
  }

  async enableBiometric(): Promise<boolean> {
    try {
      if (!('credentials' in navigator)) {
        throw new Error('Biometric authentication not supported')
      }
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Kite Finance' },
          user: {
            id: new TextEncoder().encode('kite-user'),
            name: 'kite-user',
            displayName: 'Kite User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      })
      
      if (credential) {
        this.state.biometricEnabled = true
        this.saveSecurityState()
        this.notifyListeners()
        
        // Update settings store
        useSettingsStore.getState().updatePrivacy({ biometricUnlock: true })
        
        toast.success('Biometric enabled', 'You can now use biometric authentication')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to enable biometric:', error)
      toast.error('Biometric setup failed', 'Your device may not support biometric authentication')
      return false
    }
  }

  disableBiometric() {
    this.state.biometricEnabled = false
    this.saveSecurityState()
    this.notifyListeners()
    
    // Update settings store
    useSettingsStore.getState().updatePrivacy({ biometricUnlock: false })
    
    toast.success('Biometric disabled', 'Biometric authentication has been turned off')
  }

  private async authenticateWithBiometric(): Promise<boolean> {
    try {
      if (!('credentials' in navigator)) {
        throw new Error('Biometric authentication not supported')
      }
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required'
        }
      })
      
      return credential !== null
    } catch (error) {
      console.error('Biometric authentication failed:', error)
      return false
    }
  }

  updateSessionTimeout(minutes: number) {
    this.state.sessionTimeout = minutes * 60 * 1000
    this.saveSecurityState()
    this.resetActivityTimer()
    this.notifyListeners()
  }

  getSecurityState(): SecurityState {
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

  getLastActivity(): Date {
    return this.state.lastActivity
  }

  // Check if biometric is available on the device
  async isBiometricAvailable(): Promise<boolean> {
    try {
      if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
        return false
      }
      
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService()

// React hook for using security state
export const useSecurity = () => {
  const [securityState, setSecurityState] = React.useState<SecurityState>(securityService.getSecurityState())
  
  React.useEffect(() => {
    const unsubscribe = securityService.subscribe(setSecurityState)
    return unsubscribe
  }, [])
  
  return {
    ...securityState,
    lockApp: securityService.lockApp.bind(securityService),
    unlockApp: securityService.unlockApp.bind(securityService),
    setPin: securityService.setPin.bind(securityService),
    removePin: securityService.removePin.bind(securityService),
    enableBiometric: securityService.enableBiometric.bind(securityService),
    disableBiometric: securityService.disableBiometric.bind(securityService),
    updateSessionTimeout: securityService.updateSessionTimeout.bind(securityService),
    isBiometricAvailable: securityService.isBiometricAvailable.bind(securityService),
    isPinEnabled: securityService.isPinEnabled.bind(securityService),
    isBiometricEnabled: securityService.isBiometricEnabled.bind(securityService)
  }
}