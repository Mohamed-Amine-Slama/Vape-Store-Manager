import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { SecurityLogger } from './SecurityLogger'
import { RateLimiter } from './RateLimiter'

const SecurityContext = createContext()

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}

export function SecurityProvider({ children }) {
  const [securityState, setSecurityState] = useState({
    isSecure: false,
    threats: [],
    rateLimitStatus: {},
    sessionValid: true,
    lastActivity: Date.now()
  })

  const securityLogger = new SecurityLogger()
  const rateLimiter = new RateLimiter()

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000

  useEffect(() => {
    // Initialize security headers
    initializeSecurityHeaders()
    
    // Start security monitoring
    startSecurityMonitoring()
    
    // Setup session timeout
    setupSessionTimeout()
    
    return () => {
      // Cleanup
      clearInterval(window.securityMonitorInterval)
      clearInterval(window.sessionTimeoutInterval)
    }
  }, [])

  const initializeSecurityHeaders = () => {
    // Add security headers via meta tags (for client-side enforcement)
    const headers = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
    ]

    headers.forEach(header => {
      let metaTag = document.querySelector(`meta[http-equiv="${header.name}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('http-equiv', header.name)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', header.content)
    })
  }

  const startSecurityMonitoring = () => {
    window.securityMonitorInterval = setInterval(() => {
      // Monitor for suspicious activity
      monitorSuspiciousActivity()
      
      // Check rate limits
      checkRateLimits()
      
      // Validate session integrity
      validateSession()
    }, 5000) // Check every 5 seconds
  }

  const setupSessionTimeout = () => {
    window.sessionTimeoutInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - securityState.lastActivity
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        handleSessionTimeout()
      }
    }, 60000) // Check every minute
  }

  const monitorSuspiciousActivity = () => {
    // Check for rapid API calls
    const recentCalls = securityLogger.getRecentCalls(60000) // Last minute
    if (recentCalls.length > 100) {
      const threat = {
        type: 'RAPID_API_CALLS',
        severity: 'HIGH',
        timestamp: Date.now(),
        details: `${recentCalls.length} API calls in the last minute`
      }
      
      addThreat(threat)
      securityLogger.logThreat(threat)
    }

    // Check for failed authentication attempts
    const failedAttempts = securityLogger.getFailedAuthAttempts(300000) // Last 5 minutes
    if (failedAttempts.length > 5) {
      const threat = {
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'CRITICAL',
        timestamp: Date.now(),
        details: `${failedAttempts.length} failed login attempts in 5 minutes`
      }
      
      addThreat(threat)
      securityLogger.logThreat(threat)
      
      // Temporarily block further attempts
      rateLimiter.blockTemporarily('auth', 900000) // 15 minutes
    }
  }

  const checkRateLimits = () => {
    const status = rateLimiter.getStatus()
    setSecurityState(prev => ({
      ...prev,
      rateLimitStatus: status
    }))
  }

  const validateSession = () => {
    // Check if session token is still valid
    const user = JSON.parse(localStorage.getItem('vape-store-user') || 'null')
    if (user) {
      // Validate session integrity
      const sessionValid = validateSessionIntegrity(user)
      if (!sessionValid) {
        handleSessionCompromise()
      }
    }
  }

  const validateSessionIntegrity = (user) => {
    // Check for session tampering
    const expectedFields = ['id', 'name', 'role', 'pin']
    const hasRequiredFields = expectedFields.every(field => user[field])
    
    if (!hasRequiredFields) {
      return false
    }

    // Check for suspicious modifications
    const sessionData = localStorage.getItem('vape-store-user')
    const sessionHash = btoa(sessionData).slice(-10)
    const storedHash = localStorage.getItem('session-hash')
    
    if (storedHash && sessionHash !== storedHash) {
      return false
    }

    return true
  }

  const handleSessionTimeout = () => {
    securityLogger.logEvent('SESSION_TIMEOUT', 'Session expired due to inactivity')
    
    // Clear session
    localStorage.removeItem('vape-store-user')
    localStorage.removeItem('session-hash')
    
    // Redirect to login
    window.location.href = '/login'
  }

  const handleSessionCompromise = () => {
    const threat = {
      type: 'SESSION_COMPROMISE',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      details: 'Session integrity validation failed'
    }
    
    addThreat(threat)
    securityLogger.logThreat(threat)
    
    // Force logout
    localStorage.clear()
    window.location.href = '/login'
  }

  const addThreat = (threat) => {
    setSecurityState(prev => ({
      ...prev,
      threats: [...prev.threats.slice(-9), threat] // Keep last 10 threats
    }))
  }

  const updateActivity = () => {
    setSecurityState(prev => ({
      ...prev,
      lastActivity: Date.now()
    }))
  }

  // Secure API call wrapper
  const secureApiCall = async (operation, ...args) => {
    const operationType = operation.name || 'unknown'
    
    // Check rate limits
    if (!rateLimiter.checkLimit(operationType)) {
      const error = new Error('Rate limit exceeded')
      error.code = 'RATE_LIMIT_EXCEEDED'
      securityLogger.logEvent('RATE_LIMIT_EXCEEDED', `Operation: ${operationType}`)
      throw error
    }

    // Input validation removed - SQL injection prevention disabled

    // Log API call
    securityLogger.logApiCall(operationType, args)
    
    // Update activity
    updateActivity()

    try {
      // Execute the operation
      const result = await operation(...args)
      
      // Log successful operation
      securityLogger.logEvent('API_SUCCESS', `Operation: ${operationType}`)
      
      return result
    } catch (error) {
      // Log failed operation
      securityLogger.logEvent('API_ERROR', `Operation: ${operationType}, Error: ${error.message}`)
      
      // Check for potential attack patterns
      if (error.message.includes('SQL') || error.message.includes('injection')) {
        const threat = {
          type: 'SQL_INJECTION_ATTEMPT',
          severity: 'CRITICAL',
          timestamp: Date.now(),
          details: `Potential SQL injection in ${operationType}: ${error.message}`
        }
        addThreat(threat)
        securityLogger.logThreat(threat)
      }
      
      throw error
    }
  }

  // Enhanced login with security checks
  const secureLogin = async (pin, storeId) => {
    const clientIP = await getClientIP()
    const userAgent = navigator.userAgent
    
    // Check for brute force attempts
    if (rateLimiter.isBlocked('auth')) {
      const error = new Error('Authentication temporarily blocked due to suspicious activity')
      error.code = 'AUTH_BLOCKED'
      throw error
    }

    // Log login attempt
    securityLogger.logEvent('LOGIN_ATTEMPT', `PIN: ${pin.slice(0, 2)}***, Store: ${storeId}, IP: ${clientIP}`)

    try {
      // PIN format validation removed - SQL injection prevention disabled

      // Perform login (this would call the actual login function)
      const result = await performLogin(pin, storeId)
      
      if (result.success) {
        // Generate session hash for integrity checking
        const sessionData = JSON.stringify(result.user)
        const sessionHash = btoa(sessionData).slice(-10)
        localStorage.setItem('session-hash', sessionHash)
        
        // Log successful login
        securityLogger.logEvent('LOGIN_SUCCESS', `User: ${result.user.name}, Store: ${storeId}, IP: ${clientIP}`)
        
        // Reset failed attempts counter
        rateLimiter.resetCounter('auth')
        
        return result
      } else {
        throw new Error(result.error || 'Login failed')
      }
    } catch (error) {
      // Log failed login
      securityLogger.logEvent('LOGIN_FAILED', `PIN: ${pin.slice(0, 2)}***, Store: ${storeId}, IP: ${clientIP}, Error: ${error.message}`)
      
      // Increment failed attempts
      rateLimiter.incrementCounter('auth')
      
      throw error
    }
  }

  const performLogin = async (pin, storeId) => {
    // Perform the actual login logic with store selection
    const { data: userData, error } = await supabase
      .from('store_users')
      .select('*')
      .eq('pin', pin)
      .single()

    if (error || !userData) {
      return { success: false, error: 'Invalid PIN' }
    }

    // Add the selected store information to the user object
    const userWithStore = {
      ...userData,
      selectedStore: storeId === 'admin' ? null : storeId,
      selectedStoreName: storeId === 'admin' ? 'All Stores' : 'Store Access'
    }

    console.log('🔍 SecurityProvider setting user with store:', { 
      originalUser: userData, 
      storeId, 
      finalUser: userWithStore 
    })

    return { success: true, user: userWithStore }
  }

  const getClientIP = async () => {
    // Skip IP detection in development to avoid CORS issues
    if (import.meta.env.DEV) {
      return 'localhost'
    }
    
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  const value = {
    securityState,
    secureApiCall,
    secureLogin,
    updateActivity,
    securityLogger,
    rateLimiter
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  )
}
