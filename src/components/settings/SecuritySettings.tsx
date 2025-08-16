/**
 * Security Settings Component
 * Manages biometric enrollment, PIN setup, and security preferences
 */

import { useState, useEffect } from 'react'
import { Fingerprint, Lock, Shield, Check, AlertCircle, Key } from 'lucide-react'
import { biometricAuth, pinAuth } from '@/services/biometric'
import { useSecurity } from '@/services/security'
import { useSettingsStore, toast } from '@/stores'

export const SecuritySettings = () => {
  const { profile, privacy, updatePrivacy } = useSettingsStore()
  const { 
    isPinEnabled,
    setupPin,
    removePin,
    enableBiometric,
    disableBiometric,
    lockApp
  } = useSecurity()
  
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  
  useEffect(() => {
    checkBiometricSupport()
  }, [])
  
  const checkBiometricSupport = async () => {
    const { biometricAuth } = await import('@/services/biometric')
    const available = await biometricAuth.isSupported()
    setBiometricSupported(available)
    
    if (available) {
      const userId = 'default-user' // Use default user ID for now
      const registered = await biometricAuth.isRegistered(userId)
      setBiometricRegistered(registered)
    }
  }
  
  const handleBiometricEnrollment = async () => {
    if (!biometricSupported) {
      toast.error('Not supported', 'Biometric authentication is not available on this device')
      return
    }
    
    setIsEnrolling(true)
    
    try {
      const userId = 'default-user' // Use default user ID for now
      const userName = profile?.name || 'User'
      
      // Register with WebAuthn
      const success = await biometricAuth.register(userId, userName)
      
      if (success) {
        // Enable in security service
        await enableBiometric()
        setBiometricRegistered(true)
        toast.success('Biometric enrolled', 'You can now use biometric authentication to unlock the app')
      }
    } catch (error: any) {
      console.error('Biometric enrollment failed:', error)
      toast.error('Enrollment failed', error.message || 'Please try again')
    } finally {
      setIsEnrolling(false)
    }
  }
  
  const handleBiometricRemoval = async () => {
    try {
      const userId = 'default-user' // Use default user ID for now
      await biometricAuth.unregister(userId)
      disableBiometric()
      setBiometricRegistered(false)
      toast.success('Biometric removed', 'Biometric authentication has been disabled')
    } catch (error) {
      toast.error('Removal failed', 'Could not remove biometric authentication')
    }
  }
  
  const handlePinSetup = async () => {
    if (newPin !== confirmPin) {
      toast.error('PIN mismatch', 'The PINs you entered do not match')
      return
    }
    
    if (newPin.length !== 6) {
      toast.error('Invalid PIN', 'PIN must be exactly 6 digits')
      return
    }
    
    if (!/^\d+$/.test(newPin)) {
      toast.error('Invalid PIN', 'PIN must contain only numbers')
      return
    }
    
    try {
      // Set up PIN
      await setupPin(newPin)
      
      setShowPinSetup(false)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      
      toast.success('PIN created', 'Your security PIN has been set successfully')
    } catch (error: any) {
      toast.error('Setup failed', error.message || 'Could not set up PIN')
    }
  }
  
  const handlePinRemoval = async () => {
    if (!currentPin) {
      toast.error('PIN required', 'Enter your current PIN to remove it')
      return
    }
    
    try {
      const userId = 'default-user' // Use default user ID for now
      
      // Remove PIN from both services
      await pinAuth.removePIN(userId)
      const success = await removePin()
      
      if (success) {
        setCurrentPin('')
        toast.success('PIN removed', 'Security PIN has been disabled')
      }
    } catch (error) {
      toast.error('Removal failed', 'Could not remove PIN')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Biometric Authentication */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-primary-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Biometric Authentication
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Use Face ID, Touch ID, or fingerprint to unlock the app
            </p>
            
            {!biometricSupported ? (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Biometric authentication is not available on this device
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {biometricRegistered ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600">Biometric enrolled</span>
                    </div>
                    <button
                      onClick={handleBiometricRemoval}
                      className="btn-danger"
                    >
                      Remove Biometric
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleBiometricEnrollment}
                    disabled={isEnrolling}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isEnrolling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        Enroll Biometric
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* PIN Security */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <Key className="w-6 h-6 text-green-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PIN Security
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Set up a 6-digit PIN as a backup authentication method
            </p>
            
            {showPinSetup ? (
              <div className="mt-4 space-y-3">
                {isPinEnabled() && (
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Current PIN"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="input"
                  />
                )}
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="New 6-digit PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="input"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="input"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePinSetup}
                    disabled={!newPin || !confirmPin}
                    className="btn-primary"
                  >
                    Save PIN
                  </button>
                  <button
                    onClick={() => {
                      setShowPinSetup(false)
                      setCurrentPin('')
                      setNewPin('')
                      setConfirmPin('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {isPinEnabled() ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600">PIN enabled</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPinSetup(true)}
                        className="btn-secondary"
                      >
                        Change PIN
                      </button>
                      <button
                        onClick={() => {
                          if (currentPin) {
                            handlePinRemoval()
                          } else {
                            const pin = prompt('Enter your current PIN to remove it:')
                            if (pin) {
                              setCurrentPin(pin)
                              handlePinRemoval()
                            }
                          }
                        }}
                        className="btn-danger"
                      >
                        Remove PIN
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setShowPinSetup(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Set Up PIN
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Auto-lock Settings */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Auto-lock Timer
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automatically lock the app after inactivity
            </p>
            
            <div className="mt-4">
              <select
                value={privacy.autoLockTimer}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value)
                  updatePrivacy({ autoLockTimer: minutes })
                  toast.success('Timer updated', `Auto-lock set to ${minutes} minutes`)
                }}
                className="input"
              >
                <option value="1">1 minute</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="0">Never</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Lock */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Test Security
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Test your security settings by locking the app
            </p>
            
            <div className="mt-4">
              <button
                onClick={() => lockApp()}
                className="btn-primary flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Lock App Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Status */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Security Status
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Biometric</span>
            <span className={`text-sm font-medium ${biometricRegistered ? 'text-green-600' : 'text-gray-400'}`}>
              {biometricRegistered ? 'Enrolled' : 'Not enrolled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">PIN</span>
            <span className={`text-sm font-medium ${isPinEnabled() ? 'text-green-600' : 'text-gray-400'}`}>
              {isPinEnabled() ? 'Enabled' : 'Not set'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-lock</span>
            <span className="text-sm font-medium text-primary-600">
              {privacy.autoLockTimer === 0 ? 'Disabled' : `${privacy.autoLockTimer} minutes`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Privacy Mode</span>
            <span className={`text-sm font-medium ${privacy.privacyMode ? 'text-green-600' : 'text-gray-400'}`}>
              {privacy.privacyMode ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        {/* Overall Security Score */}
        <div className="mt-6 pt-4 border-t border-primary-200 dark:border-primary-700">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-100">Security Level</span>
            <div className="flex items-center gap-2">
              {biometricRegistered && isPinEnabled() ? (
                <>
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-semibold">Excellent</span>
                </>
              ) : biometricRegistered || isPinEnabled() ? (
                <>
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-600 font-semibold">Good</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-semibold">Needs Improvement</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecuritySettings