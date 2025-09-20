export class SecurityLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000 // Keep last 1000 log entries
    this.apiCalls = []
    this.threats = []
    this.failedAuthAttempts = []
    
    // Initialize persistent storage
    this.initializeStorage()
  }

  initializeStorage() {
    try {
      // Load existing logs from localStorage
      const storedLogs = localStorage.getItem('security-logs')
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs).slice(-this.maxLogs)
      }
      
      const storedThreats = localStorage.getItem('security-threats')
      if (storedThreats) {
        this.threats = JSON.parse(storedThreats).slice(-100) // Keep last 100 threats
      }
      
      const storedFailedAttempts = localStorage.getItem('failed-auth-attempts')
      if (storedFailedAttempts) {
        this.failedAuthAttempts = JSON.parse(storedFailedAttempts).slice(-200) // Keep last 200 attempts
      }
    } catch (error) {
      console.warn('Failed to load security logs from storage:', error)
    }
  }

  logEvent(type, message, metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      type,
      message,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId()
      }
    }
    
    this.logs.push(logEntry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // Persist to localStorage
    this.persistLogs()
    
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${type}: ${message}`, metadata)
    }
    
    // Send to server if critical
    if (this.isCriticalEvent(type)) {
      this.sendToServer(logEntry)
    }
    
    return logEntry
  }

  logApiCall(operation, args = []) {
    const apiCall = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      operation,
      argsCount: args.length,
      sessionId: this.getSessionId()
    }
    
    this.apiCalls.push(apiCall)
    
    // Keep only recent API calls (last hour)
    const oneHourAgo = Date.now() - 3600000
    this.apiCalls = this.apiCalls.filter(call => call.timestamp > oneHourAgo)
    
    return apiCall
  }

  logThreat(threat) {
    const threatEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      ...threat,
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    this.threats.push(threatEntry)
    
    // Keep only recent threats
    if (this.threats.length > 100) {
      this.threats = this.threats.slice(-100)
    }
    
    // Persist threats
    try {
      localStorage.setItem('security-threats', JSON.stringify(this.threats))
    } catch (error) {
      console.warn('Failed to persist security threats:', error)
    }
    
    // Always send threats to server
    this.sendToServer(threatEntry)
    
    // Log as security event
    this.logEvent('SECURITY_THREAT', `${threat.type}: ${threat.details}`, threat)
    
    return threatEntry
  }

  logFailedAuthAttempt(pin, storeId, error) {
    const attempt = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      pin: pin ? pin.slice(0, 2) + '*'.repeat(pin.length - 2) : 'unknown',
      storeId,
      error: error.message || error,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    }
    
    this.failedAuthAttempts.push(attempt)
    
    // Keep only recent attempts (last 24 hours)
    const oneDayAgo = Date.now() - 86400000
    this.failedAuthAttempts = this.failedAuthAttempts.filter(attempt => attempt.timestamp > oneDayAgo)
    
    // Persist failed attempts
    try {
      localStorage.setItem('failed-auth-attempts', JSON.stringify(this.failedAuthAttempts))
    } catch (error) {
      console.warn('Failed to persist failed auth attempts:', error)
    }
    
    return attempt
  }

  getRecentCalls(timeframe = 60000) {
    const cutoff = Date.now() - timeframe
    return this.apiCalls.filter(call => call.timestamp > cutoff)
  }

  getFailedAuthAttempts(timeframe = 300000) {
    const cutoff = Date.now() - timeframe
    return this.failedAuthAttempts.filter(attempt => attempt.timestamp > cutoff)
  }

  getRecentThreats(timeframe = 3600000) {
    const cutoff = Date.now() - timeframe
    return this.threats.filter(threat => threat.timestamp > cutoff)
  }

  getSecuritySummary() {
    const now = Date.now()
    const oneHour = 3600000
    const oneDay = 86400000
    
    return {
      totalLogs: this.logs.length,
      recentApiCalls: this.getRecentCalls(oneHour).length,
      recentThreats: this.getRecentThreats(oneHour).length,
      failedAuthToday: this.failedAuthAttempts.filter(attempt => now - attempt.timestamp < oneDay).length,
      criticalEvents: this.logs.filter(log => this.isCriticalEvent(log.type) && now - log.timestamp < oneDay).length,
      topOperations: this.getTopOperations(),
      threatsByType: this.getThreatsByType()
    }
  }

  getTopOperations(limit = 5) {
    const operationCounts = {}
    
    this.apiCalls.forEach(call => {
      operationCounts[call.operation] = (operationCounts[call.operation] || 0) + 1
    })
    
    return Object.entries(operationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([operation, count]) => ({ operation, count }))
  }

  getThreatsByType() {
    const threatCounts = {}
    
    this.threats.forEach(threat => {
      threatCounts[threat.type] = (threatCounts[threat.type] || 0) + 1
    })
    
    return threatCounts
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('security-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('security-session-id', sessionId)
    }
    return sessionId
  }

  isCriticalEvent(type) {
    const criticalTypes = [
      'SECURITY_THREAT',
      'BRUTE_FORCE_ATTEMPT',
      'SQL_INJECTION_ATTEMPT',
      'SESSION_COMPROMISE',
      'RATE_LIMIT_EXCEEDED',
      'LOGIN_FAILED',
      'INVALID_INPUT'
    ]
    
    return criticalTypes.includes(type)
  }

  persistLogs() {
    try {
      localStorage.setItem('security-logs', JSON.stringify(this.logs))
    } catch (error) {
      console.warn('Failed to persist security logs:', error)
      // If localStorage is full, remove older logs and try again
      this.logs = this.logs.slice(-500)
      try {
        localStorage.setItem('security-logs', JSON.stringify(this.logs))
      } catch (retryError) {
        console.error('Failed to persist security logs after cleanup:', retryError)
      }
    }
  }

  async sendToServer(logEntry) {
    // In a real implementation, this would send logs to a security monitoring service
    // For now, we'll simulate it with a console log
    
    if (process.env.NODE_ENV === 'production') {
      try {
        // Simulate sending to security monitoring endpoint
        console.log('Sending security log to server:', logEntry)
        
        // In production, you might send to services like:
        // - Supabase Edge Functions
        // - External security monitoring services
        // - Your own logging endpoint
        
        /*
        await fetch('/api/security-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry)
        })
        */
      } catch (error) {
        console.error('Failed to send security log to server:', error)
      }
    }
  }

  // Export logs for analysis
  exportLogs(format = 'json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: this.getSecuritySummary(),
      logs: this.logs,
      threats: this.threats,
      failedAuthAttempts: this.failedAuthAttempts,
      apiCalls: this.apiCalls
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    }
    
    if (format === 'csv') {
      return this.convertToCSV(exportData.logs)
    }
    
    return exportData
  }

  convertToCSV(logs) {
    if (logs.length === 0) return ''
    
    const headers = ['timestamp', 'type', 'message', 'sessionId', 'url']
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.type,
        `"${log.message.replace(/"/g, '""')}"`,
        log.metadata?.sessionId || '',
        log.metadata?.url || ''
      ].join(','))
    ].join('\n')
    
    return csvContent
  }

  // Clear logs (for maintenance)
  clearLogs(olderThan = null) {
    if (olderThan) {
      const cutoff = Date.now() - olderThan
      this.logs = this.logs.filter(log => log.timestamp > cutoff)
      this.threats = this.threats.filter(threat => threat.timestamp > cutoff)
      this.failedAuthAttempts = this.failedAuthAttempts.filter(attempt => attempt.timestamp > cutoff)
    } else {
      this.logs = []
      this.threats = []
      this.failedAuthAttempts = []
    }
    
    this.persistLogs()
    
    try {
      localStorage.setItem('security-threats', JSON.stringify(this.threats))
      localStorage.setItem('failed-auth-attempts', JSON.stringify(this.failedAuthAttempts))
    } catch (error) {
      console.warn('Failed to persist cleared security data:', error)
    }
  }

  // Real-time monitoring
  startRealTimeMonitoring(callback) {
    const originalLogEvent = this.logEvent.bind(this)
    
    this.logEvent = (type, message, metadata = {}) => {
      const logEntry = originalLogEvent(type, message, metadata)
      
      // Call the callback with the new log entry
      if (callback && typeof callback === 'function') {
        callback(logEntry)
      }
      
      return logEntry
    }
  }
}
