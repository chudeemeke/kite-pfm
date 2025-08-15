import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, AlertCircle, Check, Mail, User, Key, Hash } from 'lucide-react'

interface InputModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title: string
  placeholder?: string
  type?: 'text' | 'email' | 'number' | 'password'
  validation?: (value: string) => string | null
  initialValue?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  description?: string
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder = '',
  type = 'text',
  validation,
  initialValue = '',
  required = true,
  minLength,
  maxLength,
  description
}) => {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
      setError('')
      setShowPassword(false)
      setShowSuccess(false)
      setIsFocused(false)
      
      // Focus input after modal animation
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, initialValue])

  const getIcon = () => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-gray-400" />
      case 'password':
        return <Key className="w-5 h-5 text-gray-400" />
      case 'number':
        return <Hash className="w-5 h-5 text-gray-400" />
      default:
        return <User className="w-5 h-5 text-gray-400" />
    }
  }

  const validateInput = (inputValue: string): string | null => {
    // Required validation
    if (required && !inputValue.trim()) {
      return 'This field is required'
    }

    // Length validation
    if (minLength && inputValue.length < minLength) {
      return `Must be at least ${minLength} characters`
    }

    if (maxLength && inputValue.length > maxLength) {
      return `Must be no more than ${maxLength} characters`
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        if (inputValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
          return 'Please enter a valid email address'
        }
        break
      case 'number':
        if (inputValue && !/^\d+$/.test(inputValue)) {
          return 'Please enter only numbers'
        }
        break
    }

    // Custom validation
    if (validation) {
      return validation(inputValue)
    }

    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = () => {
    const validationError = validateInput(value)
    
    if (validationError) {
      setError(validationError)
      inputRef.current?.focus()
      return
    }

    // Success animation
    setShowSuccess(true)
    setTimeout(() => {
      onSubmit(value)
      onClose()
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const isValid = !validateInput(value)

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
                getIcon()
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
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
                Success!
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Your input has been saved
              </p>
            </div>
          ) : (
            <>
              {/* Input Field */}
              <div className="mb-4">
                <div className={`relative transition-all duration-200 ${
                  isFocused ? 'transform scale-[1.01]' : ''
                }`}>
                  {/* Floating Label */}
                  <label className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                    isFocused || value
                      ? 'top-2 text-xs text-primary-600 dark:text-primary-400'
                      : 'top-4 text-base text-gray-500 dark:text-gray-400'
                  }`}>
                    {placeholder || title}
                  </label>
                  
                  {/* Icon */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {getIcon()}
                  </div>
                  
                  {/* Input */}
                  <input
                    ref={inputRef}
                    type={type === 'password' && !showPassword ? 'password' : type === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyPress}
                    className={`w-full pl-12 pr-12 pt-6 pb-2 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none transition-all duration-200 ${
                      error
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isFocused
                        ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                        : value && isValid
                        ? 'border-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={maxLength}
                  />
                  
                  {/* Password Toggle */}
                  {type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  )}
                  
                  {/* Validation Icon */}
                  {value && type !== 'password' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValid ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Character Count */}
                {maxLength && (
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${
                      value.length > maxLength * 0.8 
                        ? 'text-orange-500' 
                        : 'text-gray-400'
                    }`}>
                      {value.length}/{maxLength}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                </div>
              )}

              {/* Help Text */}
              {!error && (minLength || type === 'password') && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {type === 'password' && 'Password should be secure and memorable'}
                    {minLength && !description && `Minimum ${minLength} characters required`}
                  </div>
                </div>
              )}

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
                  disabled={!isValid || (required && !value.trim())}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default InputModal