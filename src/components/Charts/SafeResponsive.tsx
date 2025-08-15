import { useEffect, useRef, useState, ReactNode, ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

interface SafeResponsiveProps {
  children: ReactNode
  width?: string | number
  height?: string | number
  minHeight?: number
  className?: string
}

/**
 * SafeResponsive wrapper for Recharts components
 * Uses ResizeObserver to ensure proper sizing and prevents layout issues
 */
const SafeResponsive = ({ 
  children, 
  width = '100%', 
  height = 300,
  minHeight = 200,
  className = ''
}: SafeResponsiveProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // Use ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return
      
      const entry = entries[0]
      const { width: containerWidth, height: containerHeight } = entry.contentRect
      
      // Only update if the size has actually changed significantly
      if (
        Math.abs(containerWidth - containerSize.width) > 5 || 
        Math.abs(containerHeight - containerSize.height) > 5
      ) {
        setContainerSize({ 
          width: containerWidth, 
          height: Math.max(containerHeight, minHeight)
        })
      }
    })
    
    // Use Intersection Observer to only render when visible
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 } // Trigger when 10% visible
    )
    
    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    
    // Initial size calculation
    const rect = container.getBoundingClientRect()
    setContainerSize({ 
      width: rect.width, 
      height: Math.max(rect.height, minHeight) 
    })
    
    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [containerSize.width, containerSize.height, minHeight])
  
  // Debounced render to prevent excessive re-renders during resize
  const [debouncedSize, setDebouncedSize] = useState(containerSize)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSize(containerSize)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [containerSize])
  
  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: `${minHeight}px`
      }}
    >
      {isVisible && debouncedSize.width > 0 && debouncedSize.height > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600"
          style={{ height: `${minHeight}px` }}
        >
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 opacity-50">
              📊
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chart loading...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SafeResponsive