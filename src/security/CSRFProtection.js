export class CSRFProtection {
  constructor() {
    this.tokenName = 'csrf-token'
    this.headerName = 'X-CSRF-Token'
    this.cookieName = 'csrf-cookie'
    this.tokenLifetime = 3600000 // 1 hour
    this.initialize()
  }

  initialize() {
    // Generate initial token
    this.generateToken()
    
    // Set up token refresh
    this.setupTokenRefresh()
    
    // Intercept form submissions
    this.interceptFormSubmissions()
    
    // Intercept AJAX requests
    this.interceptAjaxRequests()
  }

  generateToken() {
    const token = this.createSecureToken()
    const timestamp = Date.now()
    
    // Store in sessionStorage with timestamp
    sessionStorage.setItem(this.tokenName, token)
    sessionStorage.setItem(`${this.tokenName}-timestamp`, timestamp.toString())
    
    // Also set as a secure cookie for additional validation
    this.setSecureCookie(this.cookieName, token)
    
    return token
  }

  createSecureToken() {
    // Generate cryptographically secure random token
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  setSecureCookie(name, value) {
    const expires = new Date(Date.now() + this.tokenLifetime).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure`
  }

  getToken() {
    const token = sessionStorage.getItem(this.tokenName)
    const timestamp = parseInt(sessionStorage.getItem(`${this.tokenName}-timestamp`) || '0')
    
    // Check if token is expired
    if (Date.now() - timestamp > this.tokenLifetime) {
      return this.generateToken()
    }
    
    return token
  }

  validateToken(token) {
    const storedToken = sessionStorage.getItem(this.tokenName)
    const timestamp = parseInt(sessionStorage.getItem(`${this.tokenName}-timestamp`) || '0')
    
    // Check if token exists and matches
    if (!storedToken || !token || storedToken !== token) {
      return false
    }
    
    // Check if token is expired
    if (Date.now() - timestamp > this.tokenLifetime) {
      return false
    }
    
    // Additional validation against cookie
    const cookieToken = this.getCookieValue(this.cookieName)
    if (cookieToken !== token) {
      return false
    }
    
    return true
  }

  getCookieValue(name) {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')
      if (cookieName === name) {
        return cookieValue
      }
    }
    return null
  }

  setupTokenRefresh() {
    // Refresh token every 30 minutes
    setInterval(() => {
      this.generateToken()
    }, 1800000)
    
    // Refresh on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const timestamp = parseInt(sessionStorage.getItem(`${this.tokenName}-timestamp`) || '0')
        if (Date.now() - timestamp > 1800000) { // 30 minutes
          this.generateToken()
        }
      }
    })
  }

  interceptFormSubmissions() {
    // Add event listener for form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target
      
      // Skip if form already has CSRF token
      if (form.querySelector(`input[name="${this.tokenName}"]`)) {
        return
      }
      
      // Add CSRF token as hidden input
      const tokenInput = document.createElement('input')
      tokenInput.type = 'hidden'
      tokenInput.name = this.tokenName
      tokenInput.value = this.getToken()
      form.appendChild(tokenInput)
    })
  }

  interceptAjaxRequests() {
    // Store original XMLHttpRequest methods
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send
    
    // Override XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this._method = method
      this._url = url
      return originalOpen.call(this, method, url, async, user, password)
    }
    
    XMLHttpRequest.prototype.send = function(data) {
      // Add CSRF token to headers for state-changing requests
      if (this._method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(this._method.toUpperCase())) {
        const csrfProtection = window.csrfProtection || new CSRFProtection()
        this.setRequestHeader(csrfProtection.headerName, csrfProtection.getToken())
      }
      
      return originalSend.call(this, data)
    }
    
    // Store original fetch
    const originalFetch = window.fetch
    
    // Override fetch
    window.fetch = async (url, options = {}) => {
      const method = options.method || 'GET'
      
      // Add CSRF token for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        const csrfProtection = window.csrfProtection || new CSRFProtection()
        options.headers = {
          ...options.headers,
          [csrfProtection.headerName]: csrfProtection.getToken()
        }
      }
      
      return originalFetch(url, options)
    }
  }

  // Method to manually add CSRF token to requests
  addTokenToRequest(options = {}) {
    return {
      ...options,
      headers: {
        ...options.headers,
        [this.headerName]: this.getToken()
      }
    }
  }

  // Method to add CSRF token to form data
  addTokenToFormData(formData) {
    if (formData instanceof FormData) {
      formData.append(this.tokenName, this.getToken())
    } else if (typeof formData === 'object') {
      formData[this.tokenName] = this.getToken()
    }
    return formData
  }

  // Method to create a CSRF-protected form element
  createProtectedForm(action, method = 'POST') {
    const form = document.createElement('form')
    form.action = action
    form.method = method
    
    // Add CSRF token
    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = this.tokenName
    tokenInput.value = this.getToken()
    form.appendChild(tokenInput)
    
    return form
  }

  // Method to verify CSRF token (for server-side validation simulation)
  verifyToken(providedToken) {
    if (!providedToken) {
      return {
        valid: false,
        error: 'CSRF token missing'
      }
    }
    
    if (!this.validateToken(providedToken)) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token'
      }
    }
    
    return {
      valid: true,
      error: null
    }
  }

  // Method to handle CSRF token validation errors
  handleCSRFError(error) {
    console.error('CSRF Protection Error:', error)
    
    // Log security event
    if (window.securityLogger) {
      window.securityLogger.logEvent('CSRF_ERROR', error.message || 'CSRF token validation failed', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
    
    // Generate new token
    this.generateToken()
    
    // Optionally redirect to login or show error message
    if (error.message.includes('expired')) {
      // Token expired - refresh page or redirect
      console.warn('CSRF token expired, refreshing...')
      // window.location.reload()
    } else {
      // Invalid token - potential attack
      console.error('Invalid CSRF token detected - potential attack!')
      
      // Log as security threat
      if (window.securityLogger) {
        window.securityLogger.logThreat({
          type: 'CSRF_ATTACK',
          severity: 'HIGH',
          details: 'Invalid CSRF token provided',
          timestamp: Date.now()
        })
      }
    }
  }

  // Method to get CSRF protection status
  getStatus() {
    const token = sessionStorage.getItem(this.tokenName)
    const timestamp = parseInt(sessionStorage.getItem(`${this.tokenName}-timestamp`) || '0')
    const cookieToken = this.getCookieValue(this.cookieName)
    
    return {
      tokenPresent: !!token,
      tokenValid: this.validateToken(token),
      tokenAge: Date.now() - timestamp,
      cookieMatches: token === cookieToken,
      expiresIn: Math.max(0, this.tokenLifetime - (Date.now() - timestamp))
    }
  }

  // Method to clear CSRF tokens (for logout)
  clearTokens() {
    sessionStorage.removeItem(this.tokenName)
    sessionStorage.removeItem(`${this.tokenName}-timestamp`)
    
    // Clear cookie
    document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  // Method for double-submit cookie pattern validation
  validateDoubleSubmitCookie(headerToken, cookieToken) {
    if (!headerToken || !cookieToken) {
      return false
    }
    
    // Both tokens must match and be valid
    return headerToken === cookieToken && this.validateToken(headerToken)
  }
}
