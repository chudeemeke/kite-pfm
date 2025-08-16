/**
 * Biometric Authentication Service - Refactored
 * Uses proper IndexedDB storage via Dexie with encryption
 * Provides secure authentication using WebAuthn API
 */

import { db } from '@/db/schema'
import { encryptionService } from './encryption'
import type { SecurityCredential, SecuritySettings } from '@/types'

interface AuthenticationResult {
  success: boolean
  method: 'biometric' | 'pin' | 'password'
  error?: string
}

export class BiometricAuthService {
  private readonly RP_NAME = 'Kite Finance'
  private readonly RP_ID = window.location.hostname || 'localhost'
  private readonly TIMEOUT = 60000 // 60 seconds
  
  /**
   * Check if biometric authentication is supported
   */
  async isSupported(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch {
      return false
    }
  }
  
  /**
   * Check if conditional UI is supported (autofill with biometric)
   */
  async isConditionalUISupported(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false
    }
    
    try {
      // @ts-ignore - Conditional UI is a newer API
      const conditional = await PublicKeyCredential.isConditionalMediationAvailable?.()
      return conditional === true
    } catch {
      return false
    }
  }
  
  /**
   * Get current user from database
   */
  private async getCurrentUser() {
    const users = await db.users.toArray()
    if (users.length === 0) {
      // Create default user if none exists
      const defaultUser = {
        id: 'default-user',
        email: 'user@kite.app',
        name: 'User',
        createdAt: new Date(),
        lastActiveAt: new Date()
      }
      await db.users.add(defaultUser)
      return defaultUser
    }
    // Return the most recently active user
    return users.sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())[0]
  }
  
  /**
   * Register biometric authentication for the current user
   */
  async register(userId?: string, userName?: string): Promise<boolean> {
    if (!(await this.isSupported())) {
      throw new Error('Biometric authentication not supported on this device')
    }
    
    try {
      // Get or use current user
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) {
        throw new Error('User not found')
      }
      
      // Generate challenge
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      
      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: this.RP_NAME,
          id: this.RP_ID
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: userName || user.name,
          displayName: userName || user.name
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
          requireResidentKey: true
        },
        timeout: this.TIMEOUT,
        attestation: 'none'
      }
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential
      
      if (!credential) {
        throw new Error('Failed to create credential')
      }
      
      // Store credential securely in database
      await this.storeCredential(user.id, credential)
      
      // Update security settings
      await this.updateSecuritySettings(user.id, { biometricEnabled: true })
      
      return true
    } catch (error: any) {
      console.error('Biometric registration failed:', error)
      
      if (error.name === 'NotAllowedError') {
        throw new Error('User cancelled biometric registration')
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Biometric already registered for this account')
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Your device does not support the required security features')
      }
      
      throw new Error(`Biometric registration failed: ${error.message}`)
    }
  }
  
  /**
   * Authenticate using biometrics
   */
  async authenticate(userId?: string): Promise<AuthenticationResult> {
    if (!(await this.isSupported())) {
      return {
        success: false,
        method: 'biometric',
        error: 'Biometric authentication not supported'
      }
    }
    
    try {
      // Get user
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) {
        return {
          success: false,
          method: 'biometric',
          error: 'User not found'
        }
      }
      
      // Get stored credentials
      const storedCredentials = await this.getStoredCredentials(user.id)
      
      if (!storedCredentials || storedCredentials.length === 0) {
        return {
          success: false,
          method: 'biometric',
          error: 'No biometric credentials found. Please register first.'
        }
      }
      
      // Generate challenge
      const challenge = crypto.getRandomValues(new Uint8Array(32))
      
      // Create authentication options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: storedCredentials.map(cred => ({
          id: this.base64ToArrayBuffer(cred.credentialId),
          type: 'public-key' as PublicKeyCredentialType,
          transports: ['internal'] as AuthenticatorTransport[]
        })),
        userVerification: 'required',
        timeout: this.TIMEOUT
      }
      
      // Authenticate
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
        // @ts-ignore - Conditional UI is a newer API
        mediation: await this.isConditionalUISupported() ? 'conditional' : 'optional'
      }) as PublicKeyCredential
      
      if (!assertion) {
        return {
          success: false,
          method: 'biometric',
          error: 'Authentication failed'
        }
      }
      
      // Verify assertion
      const verified = await this.verifyAssertion(user.id, assertion)
      
      if (verified) {
        // Update last used timestamp
        await this.updateLastUsed(user.id, assertion.id)
        
        // Update user's last active time
        await db.users.update(user.id, { lastActiveAt: new Date() })
        
        return {
          success: true,
          method: 'biometric'
        }
      }
      
      return {
        success: false,
        method: 'biometric',
        error: 'Authentication verification failed'
      }
    } catch (error: any) {
      console.error('Biometric authentication failed:', error)
      
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Authentication cancelled or timed out'
        }
      } else if (error.name === 'NotSupportedError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Your device does not support biometric authentication'
        }
      }
      
      return {
        success: false,
        method: 'biometric',
        error: `Authentication failed: ${error.message}`
      }
    }
  }
  
  /**
   * Remove biometric authentication
   */
  async unregister(userId?: string): Promise<void> {
    try {
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) {
        throw new Error('User not found')
      }
      
      // Delete all biometric credentials for the user
      await db.securityCredentials
        .where(['userId', 'type'])
        .equals([user.id, 'biometric'])
        .delete()
      
      // Update security settings
      await this.updateSecuritySettings(user.id, { biometricEnabled: false })
    } catch (error) {
      console.error('Failed to unregister biometric:', error)
      throw new Error('Failed to remove biometric authentication')
    }
  }
  
  /**
   * Check if user has registered biometric authentication
   */
  async isRegistered(userId?: string): Promise<boolean> {
    try {
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) return false
      
      const credentials = await db.securityCredentials
        .where(['userId', 'type'])
        .equals([user.id, 'biometric'])
        .toArray()
      
      return credentials.length > 0
    } catch {
      return false
    }
  }
  
  /**
   * Store credential securely in database
   */
  private async storeCredential(userId: string, credential: PublicKeyCredential): Promise<void> {
    const response = credential.response as AuthenticatorAttestationResponse
    
    // Get public key (using the correct API)
    const publicKeyBuffer = response.getPublicKey ? response.getPublicKey() : null
    if (!publicKeyBuffer) {
      throw new Error('Failed to get public key from credential')
    }
    
    // Generate a unique password for this credential (derived from user ID and credential ID)
    const credentialPassword = await encryptionService.deriveMasterKey(credential.id, userId)
    
    // Prepare credential data
    const credentialData = {
      id: credential.id,
      publicKey: this.arrayBufferToBase64(publicKeyBuffer),
      credentialId: this.arrayBufferToBase64(credential.rawId),
      type: 'platform' as const,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      deviceName: this.getDeviceName()
    }
    
    // Encrypt the credential data
    const encryptedData = await encryptionService.encryptJSON(credentialData, credentialPassword)
    
    // Store in database
    const securityCredential: SecurityCredential = {
      id: `bio-${userId}-${credential.id}`,
      userId,
      type: 'biometric',
      credentialId: credential.id,
      encryptedData,
      deviceName: this.getDeviceName(),
      createdAt: new Date(),
      lastUsedAt: new Date(),
      algorithm: 'AES-GCM'
    }
    
    await db.securityCredentials.put(securityCredential)
  }
  
  /**
   * Get stored credentials from database
   */
  private async getStoredCredentials(userId: string): Promise<SecurityCredential[]> {
    try {
      return await db.securityCredentials
        .where(['userId', 'type'])
        .equals([userId, 'biometric'])
        .toArray()
    } catch {
      return []
    }
  }
  
  /**
   * Verify assertion
   */
  private async verifyAssertion(userId: string, assertion: PublicKeyCredential): Promise<boolean> {
    try {
      const response = assertion.response as AuthenticatorAssertionResponse
      
      // Check required fields
      if (!response.authenticatorData || !response.signature || !response.clientDataJSON) {
        return false
      }
      
      // Verify that the assertion matches stored credentials
      const storedCreds = await this.getStoredCredentials(userId)
      const matchingCred = storedCreds.find(cred => cred.credentialId === assertion.id)
      
      return !!matchingCred
    } catch {
      return false
    }
  }
  
  /**
   * Update last used timestamp
   */
  private async updateLastUsed(_userId: string, credentialId: string): Promise<void> {
    try {
      const credential = await db.securityCredentials
        .where('credentialId')
        .equals(credentialId)
        .first()
      
      if (credential) {
        await db.securityCredentials.update(credential.id, {
          lastUsedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to update last used:', error)
    }
  }
  
  /**
   * Update security settings
   */
  private async updateSecuritySettings(userId: string, updates: Partial<SecuritySettings>): Promise<void> {
    const settingsId = `security-${userId}`
    const existing = await db.securitySettings.get(settingsId)
    
    if (existing) {
      await db.securitySettings.update(settingsId, {
        ...updates,
        updatedAt: new Date()
      })
    } else {
      await db.securitySettings.add({
        id: settingsId,
        userId,
        autoLockMinutes: 5,
        privacyMode: false,
        biometricEnabled: false,
        pinEnabled: false,
        ...updates,
        updatedAt: new Date()
      })
    }
  }
  
  /**
   * Get device name for identification
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent
    
    if (/iPhone/.test(userAgent)) return 'iPhone'
    if (/iPad/.test(userAgent)) return 'iPad'
    if (/Android/.test(userAgent)) return 'Android Device'
    if (/Windows/.test(userAgent)) return 'Windows PC'
    if (/Mac/.test(userAgent)) return 'Mac'
    if (/Linux/.test(userAgent)) return 'Linux PC'
    
    return 'Unknown Device'
  }
  
  /**
   * Helper: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  /**
   * Helper: Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

// Export singleton instance
export const biometricAuth = new BiometricAuthService()

/**
 * PIN Authentication Service - Refactored
 * Uses proper database storage with encryption
 */
export class PINAuthService {
  private readonly MAX_ATTEMPTS = 3
  private readonly LOCKOUT_DURATION = 60000 // 1 minute
  
  /**
   * Get current user
   */
  private async getCurrentUser() {
    const users = await db.users.toArray()
    if (users.length === 0) {
      throw new Error('No user found')
    }
    return users.sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())[0]
  }
  
  /**
   * Set up PIN
   */
  async setupPIN(userId: string | undefined, pin: string): Promise<void> {
    // Validate PIN
    const validation = encryptionService.validatePIN(pin)
    if (!validation.valid) {
      throw new Error(validation.message)
    }
    
    // Get user
    const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
    if (!user) {
      throw new Error('User not found')
    }
    
    // Hash the PIN
    const hashedPIN = await encryptionService.hash(pin + user.id)
    
    // Derive master key from PIN (for encrypting other credentials)
    const masterKey = await encryptionService.deriveMasterKey(pin, user.id)
    
    // Store encrypted PIN credential
    const credential: SecurityCredential = {
      id: `pin-${user.id}`,
      userId: user.id,
      type: 'pin',
      credentialId: `pin-${user.id}`,
      encryptedData: hashedPIN,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      algorithm: 'SHA-256',
      salt: masterKey // Store master key derivation for future use
    }
    
    await db.securityCredentials.put(credential)
    
    // Update security settings
    const settingsId = `security-${user.id}`
    const existing = await db.securitySettings.get(settingsId)
    
    if (existing) {
      await db.securitySettings.update(settingsId, {
        pinEnabled: true,
        updatedAt: new Date()
      })
    } else {
      await db.securitySettings.add({
        id: settingsId,
        userId: user.id,
        autoLockMinutes: 5,
        privacyMode: false,
        biometricEnabled: false,
        pinEnabled: true,
        updatedAt: new Date()
      })
    }
  }
  
  /**
   * Verify PIN
   */
  async verifyPIN(userId: string | undefined, pin: string): Promise<AuthenticationResult> {
    try {
      // Get user
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) {
        return {
          success: false,
          method: 'pin',
          error: 'User not found'
        }
      }
      
      // Check if locked out
      const settings = await db.securitySettings.get(`security-${user.id}`)
      if (settings?.lockedUntil && new Date() < settings.lockedUntil) {
        const remainingTime = Math.ceil((settings.lockedUntil.getTime() - Date.now()) / 1000)
        return {
          success: false,
          method: 'pin',
          error: `Too many attempts. Try again in ${remainingTime} seconds.`
        }
      }
      
      // Get PIN credential
      const credential = await db.securityCredentials.get(`pin-${user.id}`)
      if (!credential) {
        return {
          success: false,
          method: 'pin',
          error: 'PIN not set up'
        }
      }
      
      // Verify PIN
      const hashedInput = await encryptionService.hash(pin + user.id)
      const isValid = hashedInput === credential.encryptedData
      
      if (isValid) {
        // Reset failed attempts
        if (settings) {
          await db.securitySettings.update(settings.id, {
            failedAttempts: 0,
            lockedUntil: undefined,
            updatedAt: new Date()
          })
        }
        
        // Update last used
        await db.securityCredentials.update(credential.id, {
          lastUsedAt: new Date()
        })
        
        // Update user's last active time
        await db.users.update(user.id, { lastActiveAt: new Date() })
        
        return {
          success: true,
          method: 'pin'
        }
      }
      
      // Handle failed attempt
      const failedAttempts = (settings?.failedAttempts || 0) + 1
      
      if (failedAttempts >= this.MAX_ATTEMPTS) {
        // Lock out user
        await db.securitySettings.update(settings!.id, {
          failedAttempts,
          lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION),
          updatedAt: new Date()
        })
        
        return {
          success: false,
          method: 'pin',
          error: 'Too many attempts. Account locked for 1 minute.'
        }
      }
      
      // Update failed attempts
      if (settings) {
        await db.securitySettings.update(settings.id, {
          failedAttempts,
          updatedAt: new Date()
        })
      }
      
      return {
        success: false,
        method: 'pin',
        error: `Incorrect PIN. ${this.MAX_ATTEMPTS - failedAttempts} attempts remaining.`
      }
    } catch (error: any) {
      return {
        success: false,
        method: 'pin',
        error: 'PIN verification failed'
      }
    }
  }
  
  /**
   * Remove PIN
   */
  async removePIN(userId: string | undefined): Promise<void> {
    const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
    if (!user) {
      throw new Error('User not found')
    }
    
    // Delete PIN credential
    await db.securityCredentials.delete(`pin-${user.id}`)
    
    // Update security settings
    const settings = await db.securitySettings.get(`security-${user.id}`)
    if (settings) {
      await db.securitySettings.update(settings.id, {
        pinEnabled: false,
        updatedAt: new Date()
      })
    }
  }
  
  /**
   * Check if PIN is set up
   */
  async hasPIN(userId: string | undefined): Promise<boolean> {
    try {
      const user = userId ? await db.users.get(userId) : await this.getCurrentUser()
      if (!user) return false
      
      const credential = await db.securityCredentials.get(`pin-${user.id}`)
      return !!credential
    } catch {
      return false
    }
  }
}

// Export PIN service
export const pinAuth = new PINAuthService()

// Export convenience functions
export const isBiometricSupported = () => biometricAuth.isSupported()
export const registerBiometric = (userId?: string, userName?: string) => 
  biometricAuth.register(userId, userName)
export const authenticateWithBiometric = (userId?: string) => 
  biometricAuth.authenticate(userId)
export const unregisterBiometric = (userId?: string) => 
  biometricAuth.unregister(userId)
export const isBiometricRegistered = (userId?: string) => 
  biometricAuth.isRegistered(userId)

export const setupPIN = (userId: string | undefined, pin: string) => 
  pinAuth.setupPIN(userId, pin)
export const verifyPIN = (userId: string | undefined, pin: string) => 
  pinAuth.verifyPIN(userId, pin)
export const removePIN = (userId: string | undefined) => 
  pinAuth.removePIN(userId)
export const hasPIN = (userId: string | undefined) => 
  pinAuth.hasPIN(userId)