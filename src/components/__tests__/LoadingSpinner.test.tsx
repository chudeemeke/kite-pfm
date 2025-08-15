import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-6', 'h-6')
  })
  
  it('should render with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toHaveClass('w-8', 'h-8')
  })
  
  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toHaveClass('custom-class')
  })
  
  it('should have proper accessibility attributes', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('div')
    
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })
})