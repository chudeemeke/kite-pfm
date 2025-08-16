/**
 * Intelligent Greeting Service
 * Provides dynamic, time-aware, personalized greetings
 * No emojis - professional and unique
 */

interface GreetingOptions {
  userName?: string
  includeMotivation?: boolean
  formality?: 'casual' | 'professional' | 'friendly'
}

export class GreetingService {
  private greetingVariations = {
    earlyMorning: [
      'Early bird gets the worm',
      'Rise and shine',
      'Starting fresh today',
      'Dawn of new possibilities',
      'Seize the morning'
    ],
    morning: [
      'Good morning',
      'Morning',
      'Hope you had a great breakfast',
      'Ready to tackle the day',
      'Fresh start this morning'
    ],
    midday: [
      'Good afternoon',
      'Hope your day is going well',
      'Midday check-in',
      'Afternoon',
      'Having a productive day'
    ],
    evening: [
      'Good evening',
      'Evening',
      'Winding down nicely',
      'Hope you had a great day',
      'Evening review time'
    ],
    night: [
      'Good night',
      'Late night planning',
      'Burning the midnight oil',
      'Night owl session',
      'Quiet hours'
    ]
  }

  private motivationalPhrases = [
    'Your financial future is in your hands',
    'Every penny counts',
    'Building wealth one transaction at a time',
    'Smart money management starts here',
    'Track today, prosper tomorrow',
    'Financial clarity brings peace of mind',
    'Your money, your control',
    'Budgeting is self-care',
    'Invest in your financial literacy',
    'Small steps, big financial wins'
  ]

  /**
   * Get the current time period
   */
  private getTimePeriod(): keyof typeof this.greetingVariations {
    const hour = new Date().getHours()
    
    if (hour >= 4 && hour < 7) return 'earlyMorning'
    if (hour >= 7 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'midday'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  /**
   * Get day of week context
   */
  private getDayContext(): string {
    const day = new Date().getDay()
    const date = new Date().getDate()
    
    // Special day handling
    if (day === 1) return 'Monday momentum'
    if (day === 5) return 'Friday feeling'
    if (day === 0 || day === 6) return 'Weekend vibes'
    
    // Month-end handling
    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    if (date === lastDayOfMonth) return 'Month-end review'
    if (date === 1) return 'Fresh month ahead'
    
    return ''
  }

  /**
   * Generate a personalized greeting
   */
  getGreeting(options: GreetingOptions = {}): string {
    const { userName = 'there', includeMotivation = false } = options
    
    const period = this.getTimePeriod()
    const greetings = this.greetingVariations[period]
    const baseGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    
    // Build the greeting
    let greeting = ''
    
    // Add variety based on random selection
    const pattern = Math.floor(Math.random() * 4)
    
    switch (pattern) {
      case 0:
        // Standard: "Good morning, John"
        greeting = `${baseGreeting}, ${userName}`
        break
      case 1:
        // Casual: "Morning John"
        if (period === 'morning' || period === 'evening') {
          greeting = `${period.charAt(0).toUpperCase() + period.slice(1)} ${userName}`
        } else {
          greeting = `${baseGreeting}, ${userName}`
        }
        break
      case 2:
        // With context: "Good morning John - Friday feeling"
        const context = this.getDayContext()
        greeting = context 
          ? `${baseGreeting} ${userName} - ${context}`
          : `${baseGreeting}, ${userName}`
        break
      case 3:
        // Just name for returning users: "Welcome back, John"
        greeting = `Welcome back, ${userName}`
        break
      default:
        greeting = `${baseGreeting}, ${userName}`
    }
    
    // Add motivation if requested
    if (includeMotivation && Math.random() > 0.7) {
      const motivation = this.motivationalPhrases[Math.floor(Math.random() * this.motivationalPhrases.length)]
      greeting += `. ${motivation}`
    }
    
    return greeting
  }

  /**
   * Get a short greeting for limited space
   */
  getShortGreeting(userName?: string): string {
    const hour = new Date().getHours()
    const name = userName || 'there'
    
    if (hour >= 4 && hour < 12) return `Morning, ${name}`
    if (hour >= 12 && hour < 17) return `Afternoon, ${name}`
    if (hour >= 17 && hour < 21) return `Evening, ${name}`
    return `Hi, ${name}`
  }

  /**
   * Get time-appropriate farewell
   */
  getFarewell(): string {
    const farewells = [
      'Take care',
      'See you soon',
      'Until next time',
      'Stay financially savvy',
      'Keep tracking',
      'Onwards and upwards',
      'Keep up the good work',
      'Financial success awaits'
    ]
    
    return farewells[Math.floor(Math.random() * farewells.length)]
  }

  /**
   * Get achievement message (no emojis)
   */
  getAchievementMessage(type: string): string {
    const messages: Record<string, string[]> = {
      budgetMet: [
        'Budget goal achieved',
        'Successfully stayed within budget',
        'Financial discipline pays off',
        'Budget mastery unlocked'
      ],
      savingsGoal: [
        'Savings milestone reached',
        'Building wealth successfully',
        'Savings target achieved',
        'Financial goal completed'
      ],
      streak: [
        'Consistency is key',
        'Daily tracking streak continues',
        'Building great habits',
        'Momentum maintained'
      ]
    }
    
    const typeMessages = messages[type] || ['Great work']
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }
}

// Export singleton instance
export const greetingService = new GreetingService()

// Export convenience functions
export const getGreeting = (options?: GreetingOptions) => greetingService.getGreeting(options)
export const getShortGreeting = (userName?: string) => greetingService.getShortGreeting(userName)
export const getFarewell = () => greetingService.getFarewell()
export const getAchievementMessage = (type: string) => greetingService.getAchievementMessage(type)