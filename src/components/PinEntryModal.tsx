import { useState, useRef, useEffect } from 'react'
import { X, Check, AlertCircle, Shield } from 'lucide-react'

interface PinEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pin: string) => void
  title?: string
  mode?: 'create' | 'verify' | 'change'
  minLength?: number
  maxLength?: number
  currentPin?: string // For change mode
}

const PinEntryModal: React.FC<PinEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  mode = 'create',
  minLength = 4,
  maxLength = 8,
  currentPin
}) => {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('new')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [shakeError, setShakeError] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const currentInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setPin('')
      setConfirmPin('')
      setError('')
      setShowSuccess(false)
      setShakeError(false)
      
      if (mode === 'change') {
        setStep('current')
      } else {
        setStep('new')
      }
      
      // Focus first input after modal animation
      setTimeout(() => {
        const firstInput = mode === 'change' 
          ? currentInputRefs.current[0]
          : inputRefs.current[0]
        firstInput?.focus()
      }, 100)
    }
  }, [isOpen, mode])

  const getCurrentRefs = () => {
    switch (step) {
      case 'current':
        return currentInputRefs.current
      case 'confirm':
        return confirmInputRefs.current
      default:
        return inputRefs.current
    }
  }

  const getCurrentPin = () => {
    switch (step) {
      case 'current':
        return currentPin || ''
      case 'confirm':
        return confirmPin
      default:
        return pin
    }
  }

  const setCurrentPin = (value: string) => {
    switch (step) {
      case 'current':
        // For current PIN step in change mode, we track it separately
        break
      case 'confirm':
        setConfirmPin(value)
        break
      default:
        setPin(value)
    }
  }

  const handleDigitChange = (index: number, value: string, isNumPad: boolean = false) => {
    setError('')
    setShakeError(false)
    
    const currentPinValue = getCurrentPin()
    const newPin = currentPinValue.split('')
    
    if (value === '' && !isNumPad) {
      // Backspace
      if (index > 0) {
        newPin[index - 1] = ''
        const newValue = newPin.join('').slice(0, index)
        setCurrentPin(newValue)
        getCurrentRefs()[index - 1]?.focus()
      }
    } else if (/^\d$/.test(value)) {
      // Valid digit
      newPin[index] = value
      const newValue = newPin.join('').substring(0, maxLength)
      setCurrentPin(newValue)
      
      // Auto-advance to next input
      if (index < maxLength - 1 && newValue.length > index) {
        getCurrentRefs()[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      handleDigitChange(index, '', false)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      getCurrentRefs()[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < maxLength - 1) {
      getCurrentRefs()[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleNumPadClick = (digit: string) => {
    const currentPinValue = getCurrentPin()
    if (currentPinValue.length < maxLength) {
      const newPin = currentPinValue + digit
      setCurrentPin(newPin)
      
      // Focus next input
      const nextIndex = currentPinValue.length
      if (nextIndex < maxLength) {
        getCurrentRefs()[nextIndex]?.focus()
      }
    }
  }

  const handleBackspace = () => {
    const currentPinValue = getCurrentPin()
    if (currentPinValue.length > 0) {
      const newPin = currentPinValue.slice(0, -1)
      setCurrentPin(newPin)
      
      // Focus previous input
      const prevIndex = currentPinValue.length - 1
      if (prevIndex >= 0) {
        getCurrentRefs()[prevIndex]?.focus()
      }
    }
  }

  const triggerShakeError = (message: string) => {
    setError(message)
    setShakeError(true)
    setTimeout(() => setShakeError(false), 500)
  }

  const handleSubmit = () => {
    const currentPinValue = getCurrentPin()
    
    if (currentPinValue.length < minLength) {
      triggerShakeError(`PIN must be at least ${minLength} digits`)
      return
    }

    if (mode === 'change') {
      if (step === 'current') {
        // Verify current PIN - in real app this would be validated against stored PIN
        setStep('new')
        setPin('')
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        return
      } else if (step === 'new') {
        setStep('confirm')
        setConfirmPin('')
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 100)
        return
      }
    }

    if ((mode === 'create' || mode === 'change') && step === 'new') {
      setStep('confirm')
      setConfirmPin('')
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100)
      return
    }

    if (step === 'confirm' && pin !== confirmPin) {
      triggerShakeError('PINs do not match')
      setConfirmPin('')
      confirmInputRefs.current.forEach(ref => {
        if (ref) ref.value = ''
      })
      confirmInputRefs.current[0]?.focus()
      return
    }

    // Success animation
    setShowSuccess(true)
    setTimeout(() => {
      onSubmit(pin)
      onClose()
    }, 800)
  }

  const getTitle = () => {
    if (title) return title
    
    if (mode === 'change') {
      switch (step) {
        case 'current':
          return 'Enter Current PIN'
        case 'new':
          return 'Enter New PIN'
        case 'confirm':
          return 'Confirm New PIN'
      }
    }
    
    switch (mode) {
      case 'create':
        return step === 'confirm' ? 'Confirm Your PIN' : 'Create Security PIN'
      case 'verify':
        return 'Enter Your PIN'
      default:
        return 'PIN Entry'
    }
  }

  const getDescription = () => {
    if (mode === 'change') {
      switch (step) {
        case 'current':
          return 'Enter your current PIN to continue'
        case 'new':
          return `Enter a new ${minLength}-${maxLength} digit PIN`
        case 'confirm':
          return 'Re-enter your new PIN to confirm'
      }
    }
    
    switch (mode) {
      case 'create':
        return step === 'confirm' 
          ? 'Re-enter your PIN to confirm'
          : `Create a ${minLength}-${maxLength} digit PIN for security`
      case 'verify':
        return 'Enter your PIN to authenticate'
      default:
        return ''
    }
  }

  const renderPinInputs = (currentValue: string, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    return (
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: maxLength }, (_, index) => (
          <input
            key={index}
            ref={(el) => refs.current[index] = el}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={currentValue[index] || ''}
            onChange={(e) => handleDigitChange(index, e.target.value, false)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              error && shakeError
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                : currentValue[index]
                ? 'border-primary-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 ${
        showSuccess ? 'scale-105' : 'scale-100'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors duration-300 ${
              showSuccess 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-primary-100 dark:bg-primary-900/20'
            }`}>
              {showSuccess ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Shield className="w-5 h-5 text-primary-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getDescription()}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                PIN Set Successfully!
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Your security PIN has been configured
              </p>
            </div>
          ) : (
            <>
              {/* PIN Input */}
              {step === 'current' && renderPinInputs(currentPin || '', currentInputRefs)}
              {step === 'new' && renderPinInputs(pin, inputRefs)}
              {step === 'confirm' && renderPinInputs(confirmPin, confirmInputRefs)}

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              {/* Virtual Number Pad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleNumPadClick(digit.toString())}
                    className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <div></div>
                <button
                  onClick={() => handleNumPadClick('0')}
                  className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors active:scale-95 flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={getCurrentPin().length < minLength}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 'confirm' ? 'Confirm' : step === 'current' ? 'Continue' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PinEntryModal