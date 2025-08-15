import { test, expect } from '@playwright/test'

test.describe('Kite PWA', () => {
  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/')
    
    // Check if we're on onboarding
    await expect(page.locator('text=Welcome to Kite')).toBeVisible()
    
    // Click through onboarding steps
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Track Your Spending')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Smart Budgeting')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Automatic Rules')).toBeVisible()
    
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Demo Data Loaded')).toBeVisible()
    
    // Complete onboarding
    await page.click('button:has-text("Get Started")')
    
    // Should now be on the home page
    await expect(page.locator('text=Good morning!')).toBeVisible()
    await expect(page.locator('text=Net Worth')).toBeVisible()
  })
  
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    
    // Skip onboarding
    await page.click('text=Skip tour')
    
    // Test bottom navigation
    await page.click('[aria-label="Activity"]')
    await expect(page).toHaveURL('/tx')
    await expect(page.locator('h1:has-text("Activity")')).toBeVisible()
    
    await page.click('[aria-label="Budgets"]')
    await expect(page).toHaveURL('/budgets')
    await expect(page.locator('h1:has-text("Budgets")')).toBeVisible()
    
    await page.click('[aria-label="Accounts"]')
    await expect(page).toHaveURL('/accounts')
    await expect(page.locator('h1:has-text("Accounts")')).toBeVisible()
    
    await page.click('[aria-label="Insights"]')
    await expect(page).toHaveURL('/insights')
    await expect(page.locator('h1:has-text("Insights")')).toBeVisible()
    
    await page.click('[aria-label="Settings"]')
    await expect(page).toHaveURL('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
    
    // Navigate back to home
    await page.click('[aria-label="Home"]')
    await expect(page).toHaveURL('/')
  })
  
  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/')
    
    // Skip onboarding
    await page.click('text=Skip tour')
    
    // Check initial light mode
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    
    // Toggle to dark mode
    await page.click('[aria-label="Switch to dark mode"]')
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Toggle back to light mode
    await page.click('[aria-label="Switch to light mode"]')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
  
  test('should display demo data', async ({ page }) => {
    await page.goto('/')
    
    // Skip onboarding
    await page.click('text=Skip tour')
    
    // Check for demo accounts on home page
    await expect(page.locator('text=Santander Current Account')).toBeVisible()
    
    // Navigate to accounts page
    await page.click('[aria-label="Accounts"]')
    
    // Should show multiple demo accounts
    const accountCards = page.locator('.card >> text=/Account/')
    await expect(accountCards).toHaveCount({ min: 3 })
    
    // Navigate to activity page
    await page.click('[aria-label="Activity"]')
    
    // Should show demo transactions
    const transactionRows = page.locator('.card > div')
    await expect(transactionRows).toHaveCount({ min: 5 })
  })
  
  test('should be installable as PWA', async ({ page, context }) => {
    await page.goto('/')
    
    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')
    
    // Check for service worker registration
    await page.waitForFunction(() => 'serviceWorker' in navigator)
  })
})