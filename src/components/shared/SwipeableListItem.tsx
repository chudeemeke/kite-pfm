/**
 * SwipeableListItem Component
 * iOS-style swipe-to-delete with smooth animations
 * Provides native-feeling gesture interactions
 */

import { useState, useRef, useEffect, ReactNode, TouchEvent, MouseEvent as ReactMouseEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { ListItem } from './ListItem'

interface SwipeableListItemProps {
  children?: ReactNode
  onDelete?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
  deleteLabel?: string
  deleteConfirmation?: boolean
  threshold?: number // How far to swipe to trigger action
  // Pass through ListItem props
  listItemProps?: any
}

export const SwipeableListItem = ({
  children,
  onDelete,
  onSwipeStart,
  onSwipeEnd,
  deleteLabel = 'Delete',
  deleteConfirmation = false,
  threshold = 80,
  listItemProps = {}
}: SwipeableListItemProps) => {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [translateX, setTranslateX] = useState(0)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const animationRef = useRef<number>()
  
  // Constants for swipe behavior
  const MAX_SWIPE = 120
  const SNAP_THRESHOLD = threshold
  const RUBBER_BAND_FACTOR = 0.3
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.targetTouches[0]
    setTouchStart(touch.clientX)
    setTouchEnd(touch.clientX)
    setSwiping(true)
    onSwipeStart?.()
  }
  
  // Handle touch move with rubber band effect
  const handleTouchMove = (e: TouchEvent) => {
    if (!swiping) return
    
    const touch = e.targetTouches[0]
    const diff = touchStart - touch.clientX
    
    // Only allow left swipe (positive diff)
    if (diff > 0) {
      let distance = diff
      
      // Apply rubber band effect past max swipe
      if (distance > MAX_SWIPE) {
        distance = MAX_SWIPE + (distance - MAX_SWIPE) * RUBBER_BAND_FACTOR
      }
      
      setTranslateX(-distance)
      setShowDeleteButton(distance > SNAP_THRESHOLD / 2)
      setTouchEnd(touch.clientX)
    } else {
      // Allow swipe back to close
      if (translateX < 0) {
        setTranslateX(Math.min(0, translateX - diff))
      }
    }
  }
  
  // Handle touch end with snap behavior
  const handleTouchEnd = () => {
    if (!swiping) return
    
    setSwiping(false)
    onSwipeEnd?.()
    
    const swipeDistance = touchStart - touchEnd
    
    if (swipeDistance > SNAP_THRESHOLD) {
      // Snap to delete position
      animateToPosition(-MAX_SWIPE)
      setShowDeleteButton(true)
    } else {
      // Snap back to original position
      animateToPosition(0)
      setShowDeleteButton(false)
    }
  }
  
  // Handle mouse events for desktop testing
  const handleMouseDown = (e: ReactMouseEvent) => {
    setTouchStart(e.clientX)
    setTouchEnd(e.clientX)
    setSwiping(true)
    onSwipeStart?.()
    
    // Add global mouse handlers
    document.addEventListener('mousemove', handleMouseMoveGlobal)
    document.addEventListener('mouseup', handleMouseUpGlobal)
  }
  
  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (!swiping) return
    
    const diff = touchStart - e.clientX
    
    if (diff > 0) {
      let distance = diff
      
      if (distance > MAX_SWIPE) {
        distance = MAX_SWIPE + (distance - MAX_SWIPE) * RUBBER_BAND_FACTOR
      }
      
      setTranslateX(-distance)
      setShowDeleteButton(distance > SNAP_THRESHOLD / 2)
      setTouchEnd(e.clientX)
    } else {
      if (translateX < 0) {
        setTranslateX(Math.min(0, translateX - diff))
      }
    }
  }
  
  const handleMouseUpGlobal = () => {
    document.removeEventListener('mousemove', handleMouseMoveGlobal)
    document.removeEventListener('mouseup', handleMouseUpGlobal)
    handleTouchEnd()
  }
  
  // Smooth animation to position
  const animateToPosition = (position: number) => {
    const start = translateX
    const distance = position - start
    const duration = 200
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentPosition = start + (distance * easeOut)
      
      setTranslateX(currentPosition)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }
  
  // Handle delete action
  const handleDelete = async () => {
    if (deleteConfirmation && !isDeleting) {
      setIsDeleting(true)
      
      // Visual confirmation state
      setTimeout(() => {
        if (window.confirm(`Are you sure you want to ${deleteLabel.toLowerCase()} this item?`)) {
          performDelete()
        } else {
          setIsDeleting(false)
          animateToPosition(0)
          setShowDeleteButton(false)
        }
      }, 100)
    } else {
      performDelete()
    }
  }
  
  const performDelete = () => {
    // Animate out
    setTranslateX(-window.innerWidth)
    
    setTimeout(() => {
      onDelete?.()
    }, 200)
  }
  
  // Reset swipe on click outside - commented out as not currently used
  // const handleClickOutside = () => {
  //   if (showDeleteButton) {
  //     animateToPosition(0)
  //     setShowDeleteButton(false)
  //   }
  // }
  
  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Delete button background */}
      <div 
        className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-opacity duration-200 ${
          showDeleteButton ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgb(239 68 68) 30%, rgb(239 68 68) 100%)',
          width: `${MAX_SWIPE + 20}px`
        }}
      >
        <button
          ref={deleteButtonRef}
          onClick={handleDelete}
          disabled={!showDeleteButton}
          className={`flex items-center gap-2 px-4 py-2 text-white font-medium transition-all duration-200 ${
            isDeleting ? 'scale-95 opacity-75' : 'scale-100'
          }`}
          style={{
            transform: `translateX(${Math.max(0, -translateX - SNAP_THRESHOLD)}px)`
          }}
        >
          <Trash2 className="w-5 h-5" />
          <span>{deleteLabel}</span>
        </button>
      </div>
      
      {/* Swipeable content */}
      <div
        className="relative bg-white dark:bg-gray-800 transition-transform duration-0"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children || <ListItem {...listItemProps} />}
      </div>
    </div>
  )
}

/**
 * Hook for managing swipeable list state
 */
export const useSwipeableList = () => {
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  
  const handleSwipeStart = (id: string) => {
    setSwipingItemId(id)
  }
  
  const handleSwipeEnd = () => {
    setSwipingItemId(null)
  }
  
  const handleDelete = (id: string) => {
    setDeletingItemId(id)
    // Return a promise for async deletion
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setDeletingItemId(null)
        resolve()
      }, 200)
    })
  }
  
  return {
    swipingItemId,
    deletingItemId,
    handleSwipeStart,
    handleSwipeEnd,
    handleDelete
  }
}

export default SwipeableListItem