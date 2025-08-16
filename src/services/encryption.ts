/**
 * Encryption Service
 * Provides secure encryption for sensitive data using Web Crypto API
 * Implements AES-GCM encryption with proper key derivation
 */

export class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256
  private readonly SALT_LENGTH = 16
  private readonly IV_LENGTH = 12
  // private readonly TAG_LENGTH = 16 // Not currently used
  private readonly ITERATIONS = 100000
  
  // Cache derived keys to avoid re-derivation
  private keyCache = new Map<string, CryptoKey>()
  
  /**
   * Derive an encryption key from a password
   */
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const cacheKey = `${password}-${this.arrayBufferToBase64(salt.buffer as ArrayBuffer)}`
    
    // Check cache
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!
    }
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    // Derive AES key from password
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
    
    // Cache the key
    this.keyCache.set(cacheKey, key)
    
    return key
  }
  
  /**
   * Generate a random salt
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
  }
  
  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
  }
  
  /**
   * Encrypt data with a password
   * Returns base64 encoded encrypted data with salt and IV prepended
   */
  async encrypt(data: ArrayBuffer | string, password: string): Promise<string> {
    try {
      // Convert string to ArrayBuffer if needed
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : new Uint8Array(data)
      
      // Generate salt and IV
      const salt = this.generateSalt()
      const iv = this.generateIV()
      
      // Derive key
      const key = await this.deriveKey(password, salt)
      
      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv.buffer as ArrayBuffer
        },
        key,
        dataBuffer.buffer as ArrayBuffer
      )
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
      )
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length)
      
      // Return as base64
      return this.arrayBufferToBase64(combined.buffer as ArrayBuffer)
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }
  
  /**
   * Decrypt data with a password
   * Expects base64 encoded data with salt and IV prepended
   */
  async decrypt(encryptedData: string, password: string): Promise<ArrayBuffer> {
    try {
      // Decode from base64
      const combined = this.base64ToArrayBuffer(encryptedData)
      const combinedArray = new Uint8Array(combined)
      
      // Extract salt, IV, and encrypted data
      const salt = combinedArray.slice(0, this.SALT_LENGTH)
      const iv = combinedArray.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH)
      const data = combinedArray.slice(this.SALT_LENGTH + this.IV_LENGTH)
      
      // Derive key
      const key = await this.deriveKey(password, salt)
      
      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        data
      )
      
      return decryptedData
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data - invalid password or corrupted data')
    }
  }
  
  /**
   * Encrypt JSON data
   */
  async encryptJSON<T>(data: T, password: string): Promise<string> {
    const jsonString = JSON.stringify(data)
    return this.encrypt(jsonString, password)
  }
  
  /**
   * Decrypt JSON data
   */
  async decryptJSON<T>(encryptedData: string, password: string): Promise<T> {
    const decryptedBuffer = await this.decrypt(encryptedData, password)
    const jsonString = new TextDecoder().decode(decryptedBuffer)
    return JSON.parse(jsonString)
  }
  
  /**
   * Hash data using SHA-256
   */
  async hash(data: string | ArrayBuffer): Promise<string> {
    const dataBuffer = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return this.arrayBufferToHex(hashBuffer)
  }
  
  /**
   * Generate a secure random password
   */
  generatePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const randomValues = crypto.getRandomValues(new Uint8Array(length))
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length]
    }
    
    return password
  }
  
  /**
   * Derive a master key from user's PIN
   * This key is used to encrypt other credentials
   */
  async deriveMasterKey(pin: string, userId: string): Promise<string> {
    // Use userId as part of the salt to ensure unique keys per user
    const salt = new TextEncoder().encode(`kite-finance-${userId}`)
    const key = await this.deriveKey(pin, salt)
    
    // Export key as raw bytes and convert to base64
    const rawKey = await crypto.subtle.exportKey('raw', key)
    return this.arrayBufferToBase64(rawKey)
  }
  
  /**
   * Clear key cache (should be called on logout/lock)
   */
  clearCache() {
    this.keyCache.clear()
  }
  
  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
  
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  // Constant-time comparison - not currently used but may be needed for future security features
  // private constantTimeCompare(a: string, b: string): boolean {
  //   if (a.length !== b.length) return false
  //   
  //   let result = 0
  //   for (let i = 0; i < a.length; i++) {
  //     result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  //   }
  //   
  //   return result === 0
  // }
  
  /**
   * Validate PIN strength
   */
  validatePIN(pin: string): { valid: boolean; message?: string } {
    if (pin.length < 4) {
      return { valid: false, message: 'PIN must be at least 4 digits' }
    }
    
    if (pin.length > 8) {
      return { valid: false, message: 'PIN must be at most 8 digits' }
    }
    
    if (!/^\d+$/.test(pin)) {
      return { valid: false, message: 'PIN must contain only numbers' }
    }
    
    // Check for common weak patterns
    if (/^(\d)\1+$/.test(pin)) {
      return { valid: false, message: 'PIN cannot be all the same digit' }
    }
    
    if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) {
      return { valid: false, message: 'PIN cannot be a sequence' }
    }
    
    const commonPINs = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456', '000000', '111111']
    if (commonPINs.includes(pin)) {
      return { valid: false, message: 'This PIN is too common' }
    }
    
    return { valid: true }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService()

// Export convenience functions
export const encrypt = (data: ArrayBuffer | string, password: string) => 
  encryptionService.encrypt(data, password)

export const decrypt = (encryptedData: string, password: string) => 
  encryptionService.decrypt(encryptedData, password)

export const encryptJSON = <T>(data: T, password: string) => 
  encryptionService.encryptJSON(data, password)

export const decryptJSON = <T>(encryptedData: string, password: string) => 
  encryptionService.decryptJSON<T>(encryptedData, password)

export const hashData = (data: string | ArrayBuffer) => 
  encryptionService.hash(data)

export const validatePIN = (pin: string) => 
  encryptionService.validatePIN(pin)

export const deriveMasterKey = (pin: string, userId: string) => 
  encryptionService.deriveMasterKey(pin, userId)