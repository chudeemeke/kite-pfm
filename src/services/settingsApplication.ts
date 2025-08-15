import { useSettingsStore } from '@/stores/settings'

/**
 * Settings Application Service
 * Applies user settings globally across the application
 */

export class SettingsApplicationService {
  private static instance: SettingsApplicationService
  private isInitialized = false

  public static getInstance(): SettingsApplicationService {
    if (!SettingsApplicationService.instance) {
      SettingsApplicationService.instance = new SettingsApplicationService()
    }
    return SettingsApplicationService.instance
  }

  public init(): void {
    if (this.isInitialized) return
    
    // Apply all settings on initialization
    this.applyAppearanceSettings()
    this.applyPrivacySettings()
    this.setupAutoLock()
    this.setupNotifications()
    
    // Set up listeners for settings changes
    this.setupSettingsListeners()
    
    this.isInitialized = true
  }

  /**
   * Apply appearance settings to the DOM
   */
  public applyAppearanceSettings(): void {
    const { appearance } = useSettingsStore.getState()
    const root = document.documentElement

    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg')
    switch (appearance.fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'medium':
        root.classList.add('text-base')
        break
      case 'large':
        root.classList.add('text-lg')
        break
    }

    // Apply view density by setting CSS custom properties
    switch (appearance.viewDensity) {
      case 'compact':
        root.style.setProperty('--spacing-unit', '0.5rem')
        root.style.setProperty('--gap-unit', '0.5rem')
        break
      case 'comfortable':
        root.style.setProperty('--spacing-unit', '1rem')
        root.style.setProperty('--gap-unit', '1rem')
        break
      case 'spacious':
        root.style.setProperty('--spacing-unit', '1.5rem')
        root.style.setProperty('--gap-unit', '1.5rem')
        break
    }

    // Apply accent color as CSS custom property
    root.style.setProperty('--primary-color', appearance.accentColor)
    
    // Apply theme if not already handled by UI store
    if (appearance.theme !== 'system') {
      root.classList.remove('light', 'dark')
      root.classList.add(appearance.theme)
    }
  }

  /**
   * Apply privacy settings
   */
  public applyPrivacySettings(): void {
    const { privacy } = useSettingsStore.getState()
    const root = document.documentElement

    // Apply privacy mode class for global blur effects
    if (privacy.privacyMode) {
      root.classList.add('privacy-mode')
    } else {
      root.classList.remove('privacy-mode')
    }
  }

  /**
   * Set up auto-lock functionality
   */
  private autoLockTimer: number | null = null

  public setupAutoLock(): void {
    const { privacy } = useSettingsStore.getState()
    
    if (privacy.autoLockTimer > 0) {
      this.resetAutoLockTimer()
      this.setupActivityListeners()
    } else {
      this.clearAutoLockTimer()
      this.removeActivityListeners()
    }
  }

  private resetAutoLockTimer(): void {
    const { privacy } = useSettingsStore.getState()
    
    this.clearAutoLockTimer()
    
    this.autoLockTimer = setTimeout(() => {
      this.lockApp()
    }, privacy.autoLockTimer * 60 * 1000) // Convert minutes to milliseconds
  }

  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer)
      this.autoLockTimer = null
    }
  }

  private activityHandler = (): void => {
    // Reset timer on activity
    this.resetAutoLockTimer()
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, this.activityHandler, true)
    })
  }

  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.removeEventListener(event, this.activityHandler, true)
    })
  }

  private lockApp(): void {
    // Create lock screen overlay
    const lockScreen = document.createElement('div')
    lockScreen.id = 'app-lock-screen'
    lockScreen.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]'
    lockScreen.innerHTML = `
      <div class="text-center text-white">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold mb-2">App Locked</h2>
        <p class="text-gray-300 mb-6">Click to unlock</p>
        <button 
          id="unlock-button" 
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Unlock App
        </button>
      </div>
    `

    document.body.appendChild(lockScreen)

    // Add unlock functionality
    const unlockButton = document.getElementById('unlock-button')
    const unlockHandler = () => {
      this.unlockApp()
    }

    unlockButton?.addEventListener('click', unlockHandler)
    lockScreen.addEventListener('click', unlockHandler)

    // Attempt biometric unlock if enabled
    this.attemptBiometricUnlock()
  }

  private unlockApp(): void {
    const lockScreen = document.getElementById('app-lock-screen')
    if (lockScreen) {
      lockScreen.remove()
    }
    this.resetAutoLockTimer()
  }

  private async attemptBiometricUnlock(): Promise<void> {
    const { privacy } = useSettingsStore.getState()
    
    if (!privacy.biometricUnlock) return
    
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) return

      // For demo purposes, simulate biometric check
      // In a real app, you'd use WebAuthn API
      const result = await this.simulateBiometricCheck()
      
      if (result) {
        this.unlockApp()
      }
    } catch (error) {
      console.warn('Biometric unlock failed:', error)
    }
  }

  private async simulateBiometricCheck(): Promise<boolean> {
    // Simulate biometric authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo, randomly succeed/fail
    return Math.random() > 0.3 // 70% success rate
  }

  /**
   * Set up notification permissions and handlers
   */
  public setupNotifications(): void {
    const { notifications } = useSettingsStore.getState()
    
    if (notifications.soundEffects || notifications.vibration) {
      this.requestNotificationPermission()
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  /**
   * Apply number and date formatting globally
   */
  public formatCurrency(amount: number, currency?: string): string {
    const { appearance, currency: currencySettings } = useSettingsStore.getState()
    const finalCurrency = currency || currencySettings.primaryCurrency

    const locale = this.getLocaleFromFormat(appearance.numberFormat)
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: finalCurrency,
    }).format(amount)
  }

  public formatNumber(number: number): string {
    const { appearance } = useSettingsStore.getState()
    const locale = this.getLocaleFromFormat(appearance.numberFormat)
    
    return new Intl.NumberFormat(locale).format(number)
  }

  public formatDate(date: Date): string {
    const { appearance, currency } = useSettingsStore.getState()
    const locale = this.getLocaleFromRegion(currency.region)
    
    const options: Intl.DateTimeFormatOptions = {}
    
    switch (appearance.dateFormat) {
      case 'DD/MM/YYYY':
        options.day = '2-digit'
        options.month = '2-digit'
        options.year = 'numeric'
        break
      case 'MM/DD/YYYY':
        options.month = '2-digit'
        options.day = '2-digit'
        options.year = 'numeric'
        break
      case 'YYYY-MM-DD':
        options.year = 'numeric'
        options.month = '2-digit'
        options.day = '2-digit'
        break
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date)
  }

  private getLocaleFromFormat(format: string): string {
    switch (format) {
      case 'us': return 'en-US'
      case 'eu': return 'de-DE'
      case 'uk': return 'en-GB'
      case 'ca': return 'en-CA'
      default: return 'en-US'
    }
  }

  private getLocaleFromRegion(region: string): string {
    switch (region) {
      case 'US': return 'en-US'
      case 'CA': return 'en-CA'
      case 'GB': return 'en-GB'
      case 'AU': return 'en-AU'
      case 'EU': return 'de-DE'
      default: return 'en-US'
    }
  }

  /**
   * Apply privacy blur to currency amounts
   */
  public applyPrivacyBlur(element: HTMLElement, isAmount: boolean = false): void {
    const { privacy } = useSettingsStore.getState()
    
    if (privacy.privacyMode && isAmount) {
      element.classList.add('blur-sm')
    } else {
      element.classList.remove('blur-sm')
    }
  }

  /**
   * Show in-app notification
   */
  public showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const { notifications } = useSettingsStore.getState()
    
    // Play sound if enabled
    if (notifications.soundEffects) {
      this.playNotificationSound(type)
    }
    
    // Vibrate if enabled and supported
    if (notifications.vibration && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
    
    // Show browser notification if permissions granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png'
      })
    }
  }

  private playNotificationSound(type: string): void {
    // Create audio context for notification sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Different frequencies for different notification types
      switch (type) {
        case 'success':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          break
        case 'error':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
          break
        case 'warning':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
          break
        default:
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime)
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  /**
   * Set up reactive listeners for settings changes
   */
  private setupSettingsListeners(): void {
    // Subscribe to settings store changes
    useSettingsStore.subscribe(() => {
      this.applyAppearanceSettings()
      this.applyPrivacySettings()
      this.setupAutoLock()
    })
  }

  /**
   * Get fiscal year start date
   */
  public getFiscalYearStart(year?: number): Date {
    const { currency } = useSettingsStore.getState()
    const currentYear = year || new Date().getFullYear()
    const [month, day] = currency.fiscalYearStart.split('-').map(Number)
    
    return new Date(currentYear, month - 1, day)
  }

  /**
   * Get first day of week (0 = Sunday, 1 = Monday)
   */
  public getFirstDayOfWeek(): number {
    const { currency } = useSettingsStore.getState()
    return currency.firstDayOfWeek === 'monday' ? 1 : 0
  }

  /**
   * Check if balance should be visible
   */
  public shouldShowBalance(): boolean {
    const { appearance } = useSettingsStore.getState()
    return appearance.showBalance
  }

  /**
   * Clean up when app unmounts
   */
  public cleanup(): void {
    this.clearAutoLockTimer()
    this.removeActivityListeners()
    this.isInitialized = false
  }
}

// Export singleton instance
export const settingsService = SettingsApplicationService.getInstance()

// Hook for React components to use the service
export const useSettingsService = () => {
  return settingsService
}