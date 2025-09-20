export class RateLimiter {
  constructor() {
    this.limits = new Map()
    this.counters = new Map()
    this.blockedOperations = new Map()
    
    // Default rate limits (requests per minute)
    this.defaultLimits = {
      'auth': 5,           // 5 login attempts per minute
      'api_read': 60,      // 60 read operations per minute
      'api_write': 30,     // 30 write operations per minute
      'export': 3,         // 3 export operations per minute
      'search': 100,       // 100 search operations per minute
      'default': 50        // 50 operations per minute for unlisted operations
    }
    
    this.initializeLimits()
  }

  initializeLimits() {
    // Initialize counters for each operation type
    Object.keys(this.defaultLimits).forEach(operation => {
      this.limits.set(operation, this.defaultLimits[operation])
      this.counters.set(operation, {
        count: 0,
        windowStart: Date.now(),
        requests: []
      })
    })
  }

  checkLimit(operation) {
    const operationType = this.categorizeOperation(operation)
    
    // Check if operation is temporarily blocked
    if (this.isBlocked(operationType)) {
      return false
    }

    const counter = this.counters.get(operationType)
    const limit = this.limits.get(operationType) || this.defaultLimits.default
    const now = Date.now()
    const windowSize = 60000 // 1 minute window

    if (!counter) {
      // Initialize counter for new operation type
      this.counters.set(operationType, {
        count: 1,
        windowStart: now,
        requests: [now]
      })
      return true
    }

    // Clean old requests outside the window
    counter.requests = counter.requests.filter(timestamp => now - timestamp < windowSize)
    counter.count = counter.requests.length

    // Reset window if needed
    if (now - counter.windowStart > windowSize) {
      counter.windowStart = now
      counter.count = counter.requests.length
    }

    // Check if limit is exceeded
    if (counter.count >= limit) {
      // Log rate limit exceeded
      console.warn(`Rate limit exceeded for ${operationType}: ${counter.count}/${limit}`)
      
      // Implement progressive penalties
      this.applyPenalty(operationType, counter.count - limit)
      
      return false
    }

    // Add current request
    counter.requests.push(now)
    counter.count++

    return true
  }

  categorizeOperation(operation) {
    // Categorize operations based on their names/types
    const operationStr = operation.toLowerCase()
    
    if (operationStr.includes('login') || operationStr.includes('auth')) {
      return 'auth'
    }
    
    if (operationStr.includes('export') || operationStr.includes('download')) {
      return 'export'
    }
    
    if (operationStr.includes('search') || operationStr.includes('filter')) {
      return 'search'
    }
    
    if (operationStr.includes('insert') || operationStr.includes('update') || 
        operationStr.includes('delete') || operationStr.includes('create')) {
      return 'api_write'
    }
    
    if (operationStr.includes('select') || operationStr.includes('get') || 
        operationStr.includes('fetch') || operationStr.includes('load')) {
      return 'api_read'
    }
    
    return 'default'
  }

  applyPenalty(operationType, excessCount) {
    const penaltyDuration = Math.min(excessCount * 30000, 300000) // Max 5 minutes
    
    this.blockedOperations.set(operationType, {
      blockedUntil: Date.now() + penaltyDuration,
      reason: 'Rate limit exceeded',
      excessCount
    })
    
    console.warn(`Operation ${operationType} blocked for ${penaltyDuration / 1000} seconds`)
  }

  isBlocked(operationType) {
    const blocked = this.blockedOperations.get(operationType)
    
    if (!blocked) {
      return false
    }
    
    if (Date.now() > blocked.blockedUntil) {
      // Unblock the operation
      this.blockedOperations.delete(operationType)
      return false
    }
    
    return true
  }

  blockTemporarily(operationType, duration) {
    this.blockedOperations.set(operationType, {
      blockedUntil: Date.now() + duration,
      reason: 'Security measure',
      temporary: true
    })
  }

  incrementCounter(operationType) {
    const counter = this.counters.get(operationType)
    if (counter) {
      const now = Date.now()
      counter.requests.push(now)
      counter.count++
    }
  }

  resetCounter(operationType) {
    const counter = this.counters.get(operationType)
    if (counter) {
      counter.count = 0
      counter.requests = []
      counter.windowStart = Date.now()
    }
  }

  getStatus() {
    const status = {}
    
    this.counters.forEach((counter, operationType) => {
      const limit = this.limits.get(operationType) || this.defaultLimits.default
      const blocked = this.isBlocked(operationType)
      
      status[operationType] = {
        current: counter.count,
        limit: limit,
        remaining: Math.max(0, limit - counter.count),
        blocked: blocked,
        blockedUntil: blocked ? this.blockedOperations.get(operationType)?.blockedUntil : null
      }
    })
    
    return status
  }

  // Advanced DDoS protection
  detectDDoSPattern() {
    const now = Date.now()
    const suspiciousPatterns = []
    
    // Check for rapid burst patterns
    this.counters.forEach((counter, operationType) => {
      const recentRequests = counter.requests.filter(timestamp => now - timestamp < 10000) // Last 10 seconds
      
      if (recentRequests.length > 20) {
        suspiciousPatterns.push({
          type: 'RAPID_BURST',
          operation: operationType,
          count: recentRequests.length,
          timeframe: '10 seconds'
        })
      }
    })
    
    // Check for sustained high traffic
    const totalRecentRequests = Array.from(this.counters.values())
      .reduce((total, counter) => {
        return total + counter.requests.filter(timestamp => now - timestamp < 60000).length
      }, 0)
    
    if (totalRecentRequests > 200) {
      suspiciousPatterns.push({
        type: 'HIGH_TRAFFIC',
        count: totalRecentRequests,
        timeframe: '1 minute'
      })
    }
    
    return suspiciousPatterns
  }

  // Adaptive rate limiting based on system load
  adjustLimitsBasedOnLoad(systemLoad) {
    const adjustmentFactor = systemLoad > 0.8 ? 0.5 : systemLoad > 0.6 ? 0.7 : 1.0
    
    Object.keys(this.defaultLimits).forEach(operation => {
      const newLimit = Math.floor(this.defaultLimits[operation] * adjustmentFactor)
      this.limits.set(operation, Math.max(1, newLimit))
    })
    
    console.log(`Rate limits adjusted by factor ${adjustmentFactor} due to system load: ${systemLoad}`)
  }

  // Get detailed analytics
  getAnalytics() {
    const analytics = {
      totalRequests: 0,
      blockedRequests: 0,
      operationBreakdown: {},
      topOperations: [],
      timeDistribution: {}
    }
    
    this.counters.forEach((counter, operationType) => {
      analytics.totalRequests += counter.count
      analytics.operationBreakdown[operationType] = {
        count: counter.count,
        limit: this.limits.get(operationType),
        blocked: this.isBlocked(operationType)
      }
    })
    
    // Sort operations by usage
    analytics.topOperations = Object.entries(analytics.operationBreakdown)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([operation, data]) => ({ operation, ...data }))
    
    return analytics
  }
}
