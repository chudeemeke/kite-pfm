/**
 * Intelligent Greeting Service
 * Provides dynamic, personality-driven greetings that stay fresh
 * Max 8-10 words, with wit, charm, and professional polish
 */

interface GreetingOptions {
  userName?: string
  hasRecentActivity?: boolean
  streakDays?: number
  accountBalance?: 'positive' | 'negative' | 'neutral'
  lastVisit?: 'today' | 'yesterday' | 'thisWeek' | 'longer'
  mood?: 'professional' | 'friendly' | 'witty'
}

interface GreetingHistory {
  lastUsed: string[]
  lastRotation: Date
}

export class GreetingService {
  private history: GreetingHistory = {
    lastUsed: [],
    lastRotation: new Date()
  }

  // Time-based greetings with personality
  private greetingVariations = {
    earlyMorning: [
      // Professional
      'Good morning, {name}',
      'Early start today, {name}',
      
      // Witty
      'Beat the sunrise again, {name}?',
      'Coffee first, finances second, {name}',
      'The early bird, {name}, has arrived',
      
      // Friendly
      'Bright and early, {name}',
      'Dawn patrol reporting, {name}?',
      'Making money moves already, {name}?'
    ],
    
    morning: [
      // Professional
      'Good morning, {name}',
      'Morning, {name}',
      'Welcome back, {name}',
      
      // Witty
      'Morning motivation loading for {name}',
      'Ready to conquer today, {name}?',
      'Fresh coffee, fresh start, {name}',
      'Morning momentum building, {name}',
      
      // Friendly
      'Rise and thrive, {name}',
      'Looking sharp today, {name}',
      'Ready for greatness, {name}?',
      'Another day, another dollar, {name}'
    ],
    
    midday: [
      // Professional
      'Good afternoon, {name}',
      'Afternoon, {name}',
      'Welcome back, {name}',
      
      // Witty
      'Lunch money counted, {name}?',
      'Midday money check, {name}',
      'Afternoon audit time, {name}',
      'Peak productivity hours, {name}',
      
      // Friendly
      'Crushing it today, {name}?',
      'Halfway to happy hour, {name}',
      'Keeping those numbers tight, {name}?',
      'Making progress, {name}?'
    ],
    
    evening: [
      // Professional
      'Good evening, {name}',
      'Evening, {name}',
      'Welcome back, {name}',
      
      // Witty
      'Evening excellence, {name}',
      'Sunset savings check, {name}?',
      'Golden hour for golden finances, {name}',
      'Day\'s end dashboard, {name}',
      
      // Friendly
      'Winding down well, {name}?',
      'Evening review time, {name}',
      'How\'d today treat you, {name}?',
      'Finishing strong, {name}?'
    ],
    
    night: [
      // Professional
      'Good evening, {name}',
      'Working late, {name}',
      
      // Witty
      'Burning the midnight oil, {name}?',
      'Night owl finances, {name}',
      'Money never sleeps, {name}',
      'Late night number crunching, {name}?',
      
      // Friendly
      'Still at it, {name}?',
      'Dedicated as always, {name}',
      'Night shift activated, {name}',
      'Insomnia or ambition, {name}?'
    ]
  }

  // Context-aware special greetings
  private contextualGreetings = {
    // Return visitor greetings
    returningToday: [
      'Back again, {name}?',
      'Missed something, {name}?',
      'Round two, {name}',
      'Welcome back, {name}',
      'Can\'t stay away, {name}?',
      'Back for more, {name}?'
    ],
    
    returningAfterBreak: [
      'Long time no see, {name}',
      'Welcome back, {name}',
      'Missed you, {name}',
      'Good to see you, {name}',
      'Been a while, {name}',
      'Back in action, {name}?'
    ],
    
    // Streak recognition
    onStreak: [
      '{days}-day streak strong, {name}',
      'Consistency champion, {name}',
      'Streak game strong, {name}',
      '{days} days of dedication, {name}',
      'Unstoppable for {days} days, {name}'
    ],
    
    // Financial status awareness
    doingWell: [
      'Looking prosperous, {name}',
      'Numbers looking good, {name}',
      'Financial fitness on point, {name}',
      'Portfolio looking healthy, {name}',
      'Wealth mode activated, {name}'
    ],
    
    needsAttention: [
      'Let\'s review those numbers, {name}',
      'Time for a money moment, {name}',
      'Financial check-in time, {name}',
      'Let\'s optimize today, {name}',
      'Ready to strategize, {name}?'
    ],
    
    // Day-specific
    monday: [
      'Monday momentum, {name}',
      'Fresh week, fresh start, {name}',
      'Monday money moves, {name}',
      'New week, new wealth, {name}',
      'Conquering Monday, {name}?'
    ],
    
    friday: [
      'Friday finances, {name}',
      'TGIF check-in, {name}',
      'Friday feeling good, {name}?',
      'Weekend prep time, {name}',
      'Finishing strong, {name}?'
    ],
    
    weekend: [
      'Weekend warrior, {name}',
      'Saturday success, {name}',
      'Sunday summary time, {name}',
      'Weekend wealth check, {name}',
      'No days off, {name}?'
    ],
    
    // Month events
    monthStart: [
      'Fresh month, fresh goals, {name}',
      'New month energy, {name}',
      'Month one, day one, {name}',
      'Clean slate activated, {name}',
      'Monthly reset complete, {name}'
    ],
    
    monthEnd: [
      'Month-end mastery, {name}',
      'Closing strong, {name}?',
      'Monthly wrap-up mode, {name}',
      'Almost there, {name}',
      'Final stretch, {name}'
    ],
    
    // Seasonal (Northern Hemisphere)
    spring: [
      'Spring into savings, {name}',
      'Growth season, {name}',
      'Fresh as spring, {name}'
    ],
    
    summer: [
      'Summer savings mode, {name}',
      'Hot finances, cool head, {name}',
      'Sunshine and savings, {name}'
    ],
    
    autumn: [
      'Harvesting those gains, {name}?',
      'Fall into fortune, {name}',
      'Autumn audit time, {name}'
    ],
    
    winter: [
      'Winter wealth building, {name}',
      'Cozy finances, {name}?',
      'Cold outside, warm portfolio, {name}?'
    ]
  }

  /**
   * Get the current time period
   */
  private getTimePeriod(): keyof typeof this.greetingVariations {
    const hour = new Date().getHours()
    
    if (hour >= 4 && hour < 7) return 'earlyMorning'
    if (hour >= 7 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'midday'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  /**
   * Get current context for smart greeting selection
   */
  private getCurrentContext() {
    const now = new Date()
    const day = now.getDay()
    const date = now.getDate()
    const month = now.getMonth()
    const lastDayOfMonth = new Date(now.getFullYear(), month + 1, 0).getDate()
    
    return {
      isMonday: day === 1,
      isFriday: day === 5,
      isWeekend: day === 0 || day === 6,
      isMonthStart: date <= 3,
      isMonthEnd: date >= lastDayOfMonth - 2,
      season: this.getSeason(month),
      dayOfWeek: day,
      hour: now.getHours()
    }
  }

  /**
   * Get current season
   */
  private getSeason(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'autumn'
    return 'winter'
  }

  /**
   * Check if greeting was recently used
   */
  private wasRecentlyUsed(greeting: string): boolean {
    // Keep history of last 10 greetings
    return this.history.lastUsed.includes(greeting)
  }

  /**
   * Update greeting history
   */
  private updateHistory(greeting: string) {
    this.history.lastUsed.push(greeting)
    if (this.history.lastUsed.length > 10) {
      this.history.lastUsed.shift()
    }
    
    // Reset history daily
    const now = new Date()
    if (now.getDate() !== this.history.lastRotation.getDate()) {
      this.history.lastUsed = [greeting]
      this.history.lastRotation = now
    }
  }

  /**
   * Select a greeting that hasn't been used recently
   */
  private selectUnusedGreeting(greetings: string[], name: string): string {
    // Try to find an unused greeting
    const unused = greetings.filter(g => !this.wasRecentlyUsed(g.replace('{name}', name)))
    const pool = unused.length > 0 ? unused : greetings
    
    const selected = pool[Math.floor(Math.random() * pool.length)]
    const final = selected.replace('{name}', name).replace('{days}', '')
    
    this.updateHistory(final)
    return final
  }

  /**
   * Generate an intelligent, personality-driven greeting
   */
  getGreeting(options: GreetingOptions = {}): string {
    const { 
      userName = 'there',
      hasRecentActivity = false,
      streakDays = 0,
      accountBalance = 'neutral',
      lastVisit = 'today',
      mood = 'friendly'
    } = options
    
    const context = this.getCurrentContext()
    const period = this.getTimePeriod()
    
    // Build a pool of appropriate greetings
    let greetingPool: string[] = []
    
    // Always include time-based greetings
    greetingPool = [...this.greetingVariations[period]]
    
    // Add contextual greetings based on conditions
    if (lastVisit === 'today' && hasRecentActivity) {
      greetingPool.push(...this.contextualGreetings.returningToday)
    }
    
    if (lastVisit === 'longer') {
      greetingPool.push(...this.contextualGreetings.returningAfterBreak)
    }
    
    if (streakDays > 3) {
      const streakGreetings = this.contextualGreetings.onStreak.map(g => 
        g.replace('{days}', streakDays.toString())
      )
      greetingPool.push(...streakGreetings)
    }
    
    if (accountBalance === 'positive' && Math.random() > 0.7) {
      greetingPool.push(...this.contextualGreetings.doingWell)
    }
    
    if (accountBalance === 'negative' && Math.random() > 0.7) {
      greetingPool.push(...this.contextualGreetings.needsAttention)
    }
    
    // Day-specific greetings
    if (context.isMonday && Math.random() > 0.6) {
      greetingPool.push(...this.contextualGreetings.monday)
    }
    
    if (context.isFriday && Math.random() > 0.6) {
      greetingPool.push(...this.contextualGreetings.friday)
    }
    
    if (context.isWeekend && Math.random() > 0.5) {
      greetingPool.push(...this.contextualGreetings.weekend)
    }
    
    // Month events
    if (context.isMonthStart && Math.random() > 0.7) {
      greetingPool.push(...this.contextualGreetings.monthStart)
    }
    
    if (context.isMonthEnd && Math.random() > 0.7) {
      greetingPool.push(...this.contextualGreetings.monthEnd)
    }
    
    // Seasonal (occasionally)
    if (Math.random() > 0.9) {
      greetingPool.push(...this.contextualGreetings[context.season])
    }
    
    // Filter by mood preference
    if (mood === 'professional') {
      // Prefer shorter, more formal greetings
      greetingPool = greetingPool.filter(g => 
        g.includes('Good') || g.includes('Welcome') || g.length < 30
      )
    } else if (mood === 'witty') {
      // Prefer greetings with personality
      greetingPool = greetingPool.filter(g => 
        g.includes('?') || g.includes('!') || g.length > 20
      )
    }
    
    // Select and personalize
    return this.selectUnusedGreeting(greetingPool, userName)
  }

  /**
   * Get a short greeting for limited space
   */
  getShortGreeting(userName?: string): string {
    const hour = new Date().getHours()
    const name = userName || 'there'
    
    const greetings = [
      `Hi, ${name}`,
      `Hey, ${name}`,
      `Hello, ${name}`,
      `Welcome, ${name}`
    ]
    
    if (hour >= 4 && hour < 12) greetings.push(`Morning, ${name}`)
    if (hour >= 17 && hour < 22) greetings.push(`Evening, ${name}`)
    
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  /**
   * Get time-appropriate farewell
   */
  getFarewell(): string {
    const hour = new Date().getHours()
    
    const farewells = [
      'Stay wealthy',
      'Keep thriving',
      'Until next time',
      'Stay savvy',
      'Keep counting',
      'See you soon',
      'Stay prosperous',
      'Keep growing'
    ]
    
    if (hour >= 20) {
      farewells.push('Sleep tight', 'Rest well', 'Sweet dreams of dividends')
    }
    
    if (hour < 12) {
      farewells.push('Have a great day', 'Make it count', 'Seize the day')
    }
    
    return farewells[Math.floor(Math.random() * farewells.length)]
  }

  /**
   * Get achievement message (celebratory but concise)
   */
  getAchievementMessage(type: string, value?: number): string {
    const messages: Record<string, string[]> = {
      budgetMet: [
        'Budget crushed',
        'Nailed it',
        'Budget boss',
        'Right on target',
        'Perfectly balanced',
        'Budget champion',
        'Financial discipline achieved'
      ],
      savingsGoal: [
        'Goal achieved',
        'Savings secured',
        'Target destroyed',
        'Mission accomplished',
        'Wealth unlocked',
        'Savings superstar',
        value ? `£${value} saved like a boss` : 'Saved successfully'
      ],
      streak: [
        'Unstoppable',
        'On fire',
        'Consistency king',
        'Habit hero',
        'Daily dedication',
        value ? `${value} days strong` : 'Streak continues',
        'Building momentum'
      ],
      milestone: [
        'Milestone unlocked',
        'New level reached',
        'Achievement unlocked',
        'Making history',
        'Record breaker',
        'Legendary status'
      ]
    }
    
    const typeMessages = messages[type] || ['Excellent work', 'Well done', 'Outstanding']
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }

  /**
   * Get motivational message for specific contexts
   */
  getMotivation(context: 'spending' | 'saving' | 'budgeting' | 'general'): string {
    const motivations = {
      spending: [
        'Spend wisely, live fully',
        'Every penny has a purpose',
        'Conscious spending wins',
        'Smart spending, smart living'
      ],
      saving: [
        'Future you says thanks',
        'Compound interest is magic',
        'Small saves, big dreams',
        'Building tomorrow today'
      ],
      budgeting: [
        'Budgets bring freedom',
        'Control creates confidence',
        'Master your money',
        'Plan the work, work the plan'
      ],
      general: [
        'Financial freedom awaits',
        'Progress over perfection',
        'Small steps, big impact',
        'You\'ve got this'
      ]
    }
    
    const messages = motivations[context] || motivations.general
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

// Export singleton instance
export const greetingService = new GreetingService()

// Export convenience functions
export const getGreeting = (options?: GreetingOptions) => greetingService.getGreeting(options)
export const getShortGreeting = (userName?: string) => greetingService.getShortGreeting(userName)
export const getFarewell = () => greetingService.getFarewell()
export const getAchievementMessage = (type: string, value?: number) => 
  greetingService.getAchievementMessage(type, value)
export const getMotivation = (context: 'spending' | 'saving' | 'budgeting' | 'general' = 'general') => 
  greetingService.getMotivation(context)