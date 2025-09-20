import { supabase } from '../lib/supabase'
import { SecurityLogger } from './SecurityLogger'
import { RateLimiter } from './RateLimiter'

export class SecurityMiddleware {
  constructor() {
    this.logger = new SecurityLogger()
    this.rateLimiter = new RateLimiter()
    // Input validator removed - SQL injection prevention disabled
    this.blockedIPs = new Set()
    this.suspiciousSessions = new Set()
  }

  // Main middleware function to wrap Supabase operations
  async secureSupabaseOperation(operation, operationType, ...args) {
    const startTime = Date.now()
    const sessionId = this.getSessionId()
    
    try {
      // Pre-execution security checks
      await this.preExecutionChecks(operationType, args, sessionId)
      
      // Execute the operation
      const result = await operation(...args)
      
      // Post-execution logging
      this.postExecutionLogging(operationType, args, result, startTime, sessionId)
      
      return result
    } catch (error) {
      // Error handling and logging
      this.handleOperationError(operationType, args, error, startTime, sessionId)
      throw error
    }
  }

  async preExecutionChecks(operationType, args, sessionId) {
    // 1. Check rate limits
    if (!this.rateLimiter.checkLimit(operationType)) {
      const error = new Error('Rate limit exceeded')
      error.code = 'RATE_LIMIT_EXCEEDED'
      this.logger.logEvent('RATE_LIMIT_EXCEEDED', `Operation: ${operationType}`, { sessionId })
      throw error
    }

    // 2. Validate session (more lenient for read operations)
    const isReadOperation = operationType.includes('_select') || operationType.includes('_read')
    if (!isReadOperation && !this.validateSession(sessionId)) {
      const error = new Error('Invalid or suspicious session')
      error.code = 'INVALID_SESSION'
      this.logger.logEvent('INVALID_SESSION', `Operation: ${operationType}`, { sessionId })
      throw error
    }

    // 3. Validate inputs (skip for safe operations like login page)
    const isSafeLoginOperation = operationType === 'stores_select' || 
                                operationType === 'stores_order' ||
                                operationType === 'users_select' // PIN-based auth queries
    
    const isSimpleQuery = args.length <= 2 && args.every(arg => 
      arg === '*' || 
      arg === null || 
      arg === undefined || 
      (typeof arg === 'string' && arg.length < 100) ||
      (typeof arg === 'object' && Object.keys(arg).length < 10)
    )
    
    // Skip input validation for safe login operations (PIN-only, no user text input)
    if (isSafeLoginOperation && isSimpleQuery) {
      // No validation needed - login page uses only PIN numbers and safe queries
      this.logger.logEvent('SAFE_OPERATION', `Skipping validation for safe operation: ${operationType}`, { sessionId })
    } else if (isReadOperation && isSimpleQuery) {
      // Light validation for other simple read queries
      const hasSuspiciousArgs = args.some(arg => 
        typeof arg === 'string' && this.containsSuspiciousPatterns(arg)
      )
      if (hasSuspiciousArgs) {
        const error = new Error('Suspicious input detected in read operation')
        error.code = 'SUSPICIOUS_INPUT'
        this.logger.logEvent('SUSPICIOUS_INPUT', `Operation: ${operationType}`, { sessionId })
        throw error
      }
    } else {
      // Input validation removed - skip validation for all operations
      // All write operations now proceed without input validation
    }

    // 4. Check for suspicious patterns
    await this.checkSuspiciousPatterns(operationType, args, sessionId)
  }

  postExecutionLogging(operationType, args, result, startTime, sessionId) {
    const duration = Date.now() - startTime
    
    // Log successful operation
    this.logger.logApiCall(operationType, args)
    this.logger.logEvent('API_SUCCESS', `Operation: ${operationType}, Duration: ${duration}ms`, {
      sessionId,
      duration,
      resultSize: this.getResultSize(result)
    })

    // Monitor for unusual patterns
    if (duration > 5000) { // Operations taking longer than 5 seconds
      this.logger.logEvent('SLOW_OPERATION', `Operation: ${operationType} took ${duration}ms`, {
        sessionId,
        duration,
        operationType
      })
    }
  }

  handleOperationError(operationType, args, error, startTime, sessionId) {
    const duration = Date.now() - startTime
    
    // Log the error
    this.logger.logEvent('API_ERROR', `Operation: ${operationType}, Error: ${error.message}`, {
      sessionId,
      duration,
      errorCode: error.code,
      errorMessage: error.message
    })

    // Check for potential security threats
    this.analyzeErrorForThreats(operationType, error, sessionId)
  }

  analyzeErrorForThreats(operationType, error, sessionId) {
    const errorMessage = error.message.toLowerCase()
    
    // SQL injection attempts
    if (errorMessage.includes('sql') || errorMessage.includes('syntax') || errorMessage.includes('injection')) {
      this.logger.logThreat({
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        details: `Potential SQL injection in ${operationType}: ${error.message}`,
        sessionId
      })
      
      // Add session to suspicious list
      this.suspiciousSessions.add(sessionId)
    }

    // Authentication bypass attempts
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      this.logger.logThreat({
        type: 'AUTHORIZATION_BYPASS_ATTEMPT',
        severity: 'HIGH',
        details: `Potential authorization bypass in ${operationType}: ${error.message}`,
        sessionId
      })
    }

    // Data exfiltration attempts
    if (operationType.includes('select') && errorMessage.includes('limit') || errorMessage.includes('timeout')) {
      this.logger.logThreat({
        type: 'DATA_EXFILTRATION_ATTEMPT',
        severity: 'HIGH',
        details: `Potential data exfiltration attempt in ${operationType}`,
        sessionId
      })
    }
  }

  async checkSuspiciousPatterns(operationType, args, sessionId) {
    // Check for rapid sequential operations
    const recentCalls = this.logger.getRecentCalls(10000) // Last 10 seconds
    const sameOperationCalls = recentCalls.filter(call => call.operation === operationType)
    
    if (sameOperationCalls.length > 20) {
      this.logger.logThreat({
        type: 'RAPID_OPERATION_PATTERN',
        severity: 'MEDIUM',
        details: `${sameOperationCalls.length} ${operationType} operations in 10 seconds`,
        sessionId
      })
    }

    // Check for suspicious session behavior
    if (this.suspiciousSessions.has(sessionId)) {
      this.logger.logThreat({
        type: 'SUSPICIOUS_SESSION_ACTIVITY',
        severity: 'HIGH',
        details: `Continued activity from suspicious session: ${operationType}`,
        sessionId
      })
      
      // Block the session temporarily
      throw new Error('Session temporarily blocked due to suspicious activity')
    }

    // Check for unusual data access patterns
    await this.checkDataAccessPatterns(operationType, args, sessionId)
  }

  async checkDataAccessPatterns(operationType, args, sessionId) {
    // Monitor for bulk data access
    if (operationType.includes('select') || operationType.includes('export')) {
      const recentExports = this.logger.getRecentCalls(3600000) // Last hour
        .filter(call => call.operation.includes('export') || call.operation.includes('select'))
      
      if (recentExports.length > 10) {
        this.logger.logThreat({
          type: 'BULK_DATA_ACCESS',
          severity: 'HIGH',
          details: `${recentExports.length} data access operations in the last hour`,
          sessionId
        })
      }
    }

    // Monitor for cross-store data access
    const user = this.getCurrentUser()
    if (user && user.role === 'worker') {
      // Workers should only access their assigned store data
      const storeId = this.extractStoreIdFromArgs(args)
      if (storeId && storeId !== user.selectedStore && storeId !== user.store_id) {
        this.logger.logThreat({
          type: 'UNAUTHORIZED_STORE_ACCESS',
          severity: 'HIGH',
          details: `Worker attempting to access different store data: ${storeId}`,
          sessionId,
          userId: user.id,
          attemptedStoreId: storeId,
          authorizedStoreId: user.selectedStore || user.store_id
        })
        
        throw new Error('Unauthorized access to store data')
      }
    }
  }

  validateSession(sessionId) {
    // Check if session is in suspicious list
    if (this.suspiciousSessions.has(sessionId)) {
      return false
    }

    // Validate session format
    if (!sessionId || !sessionId.startsWith('session_')) {
      return false
    }

    // Check session age (sessions older than 24 hours are suspicious)
    const sessionTimestamp = sessionId.split('_')[1]
    if (sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp)
      if (sessionAge > 86400000) { // 24 hours
        return false
      }
    }

    return true
  }

  containsSuspiciousPatterns(input) {
    if (!input || typeof input !== 'string') {
      return false
    }

    // Basic suspicious patterns for SQL injection
    const suspiciousPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /['"]\s*;\s*--/,
      /\/\*.*?\*\//,
      /<script/i,
      /javascript:/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(input))
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('vape-store-user'))
    } catch {
      return null
    }
  }

  extractStoreIdFromArgs(args) {
    // Try to find store_id in the arguments
    for (const arg of args) {
      if (arg && typeof arg === 'object') {
        if (arg.store_id) return arg.store_id
        if (arg.p_store_id) return arg.p_store_id
      }
    }
    return null
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('security-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('security-session-id', sessionId)
    }
    return sessionId
  }

  getResultSize(result) {
    try {
      return JSON.stringify(result).length
    } catch {
      return 0
    }
  }

  // Method to wrap Supabase client with security middleware
  wrapSupabaseClient(client) {
    const secureClient = { ...client }
    
    // Wrap the from method to intercept table operations
    const originalFrom = client.from.bind(client)
    secureClient.from = (table) => {
      const query = originalFrom(table)
      
      // Wrap query methods
      const secureQuery = this.wrapQueryMethods(query, table)
      return secureQuery
    }
    
    // Wrap RPC calls
    const originalRpc = client.rpc.bind(client)
    secureClient.rpc = async (functionName, params) => {
      return this.secureSupabaseOperation(
        () => originalRpc(functionName, params),
        `rpc_${functionName}`,
        params
      )
    }
    
    return secureClient
  }

  wrapQueryMethods(query, tableName) {
    // Create a wrapper that preserves all Supabase query builder methods
    const wrapper = Object.create(Object.getPrototypeOf(query))
    
    // Copy all properties and methods from the original query
    const allProps = [...Object.getOwnPropertyNames(query), ...Object.getOwnPropertyNames(Object.getPrototypeOf(query))]
    
    allProps.forEach(prop => {
      if (prop === 'constructor') return
      
      try {
        const descriptor = Object.getOwnPropertyDescriptor(query, prop) || 
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(query), prop)
        
        if (descriptor && typeof query[prop] === 'function') {
          // Wrap functions
          wrapper[prop] = (...args) => {
            const result = query[prop].apply(query, args)
            
            // If the result is a promise (final execution), wrap with security
            if (result && typeof result.then === 'function') {
              return this.secureSupabaseOperation(
                () => result,
                `${tableName}_${prop}`,
                ...args
              )
            }
            
            // If the result is another query builder, wrap it recursively
            if (result && typeof result === 'object' && result !== query && result !== wrapper) {
              return this.wrapQueryMethods(result, tableName)
            }
            
            // Return the result as-is for other cases
            return result
          }
        } else if (descriptor) {
          // Copy non-function properties
          Object.defineProperty(wrapper, prop, descriptor)
        }
      } catch (e) {
        // Skip properties that can't be accessed or copied
        // No action needed, just continue with the next property
      }
    })
    
    return wrapper
  }

  // Security monitoring dashboard data
  getSecurityDashboard() {
    const summary = this.logger.getSecuritySummary()
    const rateLimitStatus = this.rateLimiter.getStatus()
    const ddosPatterns = this.rateLimiter.detectDDoSPattern()
    
    return {
      summary,
      rateLimitStatus,
      ddosPatterns,
      suspiciousSessions: Array.from(this.suspiciousSessions),
      blockedIPs: Array.from(this.blockedIPs),
      recentThreats: this.logger.getRecentThreats(),
      systemHealth: this.getSystemHealth()
    }
  }

  getSystemHealth() {
    const now = Date.now()
    const oneMinute = 60000
    const fiveMinutes = 300000
    
    const recentErrors = this.logger.logs.filter(log => 
      log.type === 'API_ERROR' && now - log.timestamp < fiveMinutes
    ).length
    
    const recentCalls = this.logger.getRecentCalls(oneMinute).length
    const recentThreats = this.logger.getRecentThreats(fiveMinutes).length
    
    let healthStatus = 'HEALTHY'
    if (recentThreats > 5 || recentErrors > 20) {
      healthStatus = 'CRITICAL'
    } else if (recentThreats > 2 || recentErrors > 10 || recentCalls > 200) {
      healthStatus = 'WARNING'
    }
    
    return {
      status: healthStatus,
      recentCalls,
      recentErrors,
      recentThreats,
      timestamp: now
    }
  }
}
