/**
 * Lock Screen Component
 * Secure authentication screen with biometric support
 * Shows when app is locked due to timeout or manual lock
 */

import { useState, useEffect } from 'react'
import { Fingerprint, Lock, Shield, AlertCircle, Smartphone } from 'lucide-react'
import { biometricAuth, pinAuth } from '@/services/biometric'
import { useSecurity } from '@/services/security'
import { useSettingsStore, toast } from '@/stores'
import { getGreeting } from '@/services/greeting'

interface LockScreenProps {
  onUnlock: () => void
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const { profile } = useSettingsStore()
  const { isBiometricEnabled } = useSecurity()
  
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authMethod, setAuthMethod] = useState<'biometric' | 'pin'>('biometric')
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [hasPinSetup, setHasPinSetup] = useState<boolean | null>(null)
  
  const MAX_ATTEMPTS = 3
  const PIN_LENGTH = 6
  
  useEffect(() => {
    checkBiometricSupport()
    setGreeting(getGreeting({ 
      userName: profile?.name || 'there',
      mood: 'professional'
    }))
    
    // Check if PIN exists in database
    const checkPinSetup = async () => {
      try {
        const { db } = await import('@/db/schema')
        const credential = await db.securityCredentials.get('pin-default-user')
        setHasPinSetup(!!credential)
      } catch (error) {
        console.error('Error checking PIN setup:', error)
        setHasPinSetup(false)
      }
    }
    checkPinSetup()
    
    // Auto-trigger biometric on mount if supported
    if (isBiometricEnabled()) {
      setTimeout(() => {
        handleBiometricAuth()
      }, 500)
    }
  }, [])
  
  const checkBiometricSupport = async () => {
    const supported = await biometricAuth.isSupported()
    setBiometricSupported(supported)
    
    if (!supported && isBiometricEnabled()) {
      setAuthMethod('pin')
    }
  }
  
  const handleBiometricAuth = async () => {
    if (!biometricSupported || !isBiometricEnabled()) {
      toast.error('Not available', 'Biometric authentication is not available')
      setAuthMethod('pin')
      return
    }
    
    setIsAuthenticating(true)
    
    try {
      const userId = 'default-user' // Use default user ID for now
      const result = await biometricAuth.authenticate(userId)
      
      if (result.success) {
        // Success animation
        toast.success('Authentication successful', 'Welcome back!')
        setTimeout(onUnlock, 300)
      } else {
        toast.error('Authentication failed', result.error || 'Please try again')
        setAuthMethod('pin')
      }
    } catch (error) {
      console.error('Biometric auth error:', error)
      toast.error('Authentication error', 'Please use your PIN instead')
      setAuthMethod('pin')
    } finally {
      setIsAuthenticating(false)
    }
  }
  
  const handlePinSubmit = async () => {
    if (pin.length !== PIN_LENGTH) {
      toast.error('Invalid PIN', `PIN must be ${PIN_LENGTH} digits`)
      return
    }
    
    if (attempts >= MAX_ATTEMPTS) {
      toast.error('Too many attempts', 'Please wait before trying again')
      return
    }
    
    setIsAuthenticating(true)
    
    try {
      const userId = 'default-user'
      
      // Import db here to avoid initialization issues
      const { db } = await import('@/db/schema')
      const { encryptionService } = await import('@/services/encryption')
      
      // Check if PIN credential exists
      const credential = await db.securityCredentials.get(`pin-${userId}`)
      
      if (!credential) {
        // No PIN set - this is first time setup
        // Create PIN credential in database
        const hashedPin = await encryptionService.hash(pin + userId)
        
        await db.securityCredentials.add({
          id: `pin-${userId}`,
          userId: userId,
          type: 'pin',
          credentialId: `pin-${userId}`,
          encryptedData: hashedPin,
          deviceName: 'Web Browser',
          createdAt: new Date(),
          lastUsedAt: new Date()
        })
        
        // Update security settings to enable PIN
        await db.securitySettings.update(`security-${userId}`, {
          pinEnabled: true,
          updatedAt: new Date()
        })
        
        toast.success('PIN created', 'Your PIN has been set successfully!')
        setTimeout(onUnlock, 300)
        return
      }
      
      // Verify PIN against database
      const hashedInput = await encryptionService.hash(pin + userId)
      if (hashedInput === credential.encryptedData) {
        // Update last used
        await db.securityCredentials.update(credential.id, {
          lastUsedAt: new Date()
        })
        
        toast.success('Authentication successful', 'Welcome back!')
        setTimeout(onUnlock, 300)
      } else {
        setAttempts(attempts + 1)
        setPin('')
        toast.error('Incorrect PIN', `${MAX_ATTEMPTS - attempts - 1} attempts remaining`)
        
        if (attempts + 1 >= MAX_ATTEMPTS) {
          // Lock out for extended period
          setTimeout(() => setAttempts(0), 60000) // Reset after 1 minute
        }
      }
    } catch (error) {
      console.error('PIN auth error:', error)
      toast.error('Authentication error', 'Please try again')
    } finally {
      setIsAuthenticating(false)
    }
  }
  
  const handlePinInput = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + digit
      setPin(newPin)
      
      // Auto-submit when PIN is complete
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => handlePinSubmit(), 100)
      }
    }
  }
  
  const handlePinDelete = () => {
    setPin(pin.slice(0, -1))
  }
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 z-50">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Logo/Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex items-center justify-center">
            <Shield className="w-12 h-12 text-primary-600" />
          </div>
          {isAuthenticating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Greeting */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {greeting}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {hasPinSetup === null 
            ? 'Checking security status...'
            : hasPinSetup 
              ? 'Authenticate to access your finances'
              : 'Create a 6-digit PIN to secure your app'}
        </p>
        
        {/* Authentication Method */}
        {authMethod === 'biometric' && biometricSupported && isBiometricEnabled() ? (
          <div className="text-center">
            <button
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
              className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <Fingerprint className="w-16 h-16 text-primary-600" />
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Touch the fingerprint to authenticate
            </p>
            <button
              onClick={() => setAuthMethod('pin')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Use PIN instead
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {/* PIN Display */}
            <div className="flex justify-center gap-2 mb-8">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    i < pin.length
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {i < pin.length && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              ))}
            </div>
            
            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key) => {
                if (key === '') return <div key="empty" />
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'delete') {
                        handlePinDelete()
                      } else {
                        handlePinInput(key)
                      }
                    }}
                    disabled={isAuthenticating || (attempts >= MAX_ATTEMPTS && key !== 'delete')}
                    className={`
                      h-16 rounded-xl font-semibold text-lg transition-all duration-200
                      ${key === 'delete' 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }
                      hover:scale-105 active:scale-95
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-md hover:shadow-lg
                    `}
                  >
                    {key === 'delete' ? '⌫' : key}
                  </button>
                )
              })}
            </div>
            
            {/* Error/Status Messages */}
            {attempts >= MAX_ATTEMPTS && (
              <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  Too many attempts. Please wait 1 minute.
                </p>
              </div>
            )}
            
            {/* Switch to Biometric */}
            {biometricSupported && isBiometricEnabled() && (
              <button
                onClick={() => {
                  setAuthMethod('biometric')
                  handleBiometricAuth()
                }}
                className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Use biometric authentication
              </button>
            )}
          </div>
        )}
        
        {/* Security Info */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your financial data is protected with {isBiometricEnabled() ? 'biometric' : 'PIN'} security
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <Smartphone className="w-4 h-4 text-gray-400" />
            <Shield className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LockScreen