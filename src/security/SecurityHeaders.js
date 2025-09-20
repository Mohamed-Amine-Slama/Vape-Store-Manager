export class SecurityHeaders {
  constructor() {
    this.headers = new Map()
    this.initializeDefaultHeaders()
  }

  initializeDefaultHeaders() {
    // Content Security Policy
    this.headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://*.supabase.co https://api.ipify.org; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    )

    // X-Frame-Options
    this.headers.set('X-Frame-Options', 'DENY')

    // X-Content-Type-Options
    this.headers.set('X-Content-Type-Options', 'nosniff')

    // X-XSS-Protection
    this.headers.set('X-XSS-Protection', '1; mode=block')

    // Referrer Policy
    this.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions Policy
    this.headers.set('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    )

    // Strict Transport Security (for HTTPS)
    this.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

    // Cross-Origin Embedder Policy
    this.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')

    // Cross-Origin Opener Policy
    this.headers.set('Cross-Origin-Opener-Policy', 'same-origin')

    // Cross-Origin Resource Policy
    this.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  }

  applyHeaders() {
    // Headers that can be set via meta tags
    const allowedMetaHeaders = [
      'X-Content-Type-Options',
      'X-XSS-Protection', 
      'Referrer-Policy'
    ]

    // Apply only allowed headers via meta tags (client-side enforcement)
    this.headers.forEach((content, name) => {
      if (allowedMetaHeaders.includes(name)) {
        this.setMetaHeader(name, content)
      } else {
        // Log that these headers should be set by the server
        console.log(`🛡️ Security Header "${name}" should be set by server, not client-side`)
      }
    })

    // Apply headers to fetch requests
    this.interceptFetchRequests()
  }

  setMetaHeader(name, content) {
    // Remove existing meta tag if present
    const existingMeta = document.querySelector(`meta[http-equiv="${name}"]`)
    if (existingMeta) {
      existingMeta.remove()
    }

    // Create new meta tag
    const metaTag = document.createElement('meta')
    metaTag.setAttribute('http-equiv', name)
    metaTag.setAttribute('content', content)
    document.head.appendChild(metaTag)
  }

  interceptFetchRequests() {
    // Store original fetch
    const originalFetch = window.fetch

    // Override fetch to add security headers
    window.fetch = async (url, options = {}) => {
      const secureOptions = {
        ...options,
        headers: {
          ...this.getSecurityHeaders(),
          ...options.headers
        }
      }

      // Add CSRF token if available
      const csrfToken = this.getCSRFToken()
      if (csrfToken) {
        secureOptions.headers['X-CSRF-Token'] = csrfToken
      }

      return originalFetch(url, secureOptions)
    }
  }

  getSecurityHeaders() {
    return {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0',
      'X-Request-ID': this.generateRequestId(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }

  getCSRFToken() {
    // Generate or retrieve CSRF token
    let token = sessionStorage.getItem('csrf-token')
    if (!token) {
      token = this.generateCSRFToken()
      sessionStorage.setItem('csrf-token', token)
    }
    return token
  }

  generateCSRFToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Content Security Policy violation handler
  setupCSPViolationHandler() {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        documentURI: event.documentURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sourceFile: event.sourceFile
      })

      // Log to security system
      if (window.securityLogger) {
        window.securityLogger.logEvent('CSP_VIOLATION', 'Content Security Policy violation detected', {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          documentURI: event.documentURI
        })
      }
    })
  }

  // Feature Policy violation handler
  setupFeaturePolicyViolationHandler() {
    document.addEventListener('featurepolicyviolation', (event) => {
      console.warn('Feature Policy Violation:', {
        featureId: event.featureId,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      })

      // Log to security system
      if (window.securityLogger) {
        window.securityLogger.logEvent('FEATURE_POLICY_VIOLATION', 'Feature Policy violation detected', {
          featureId: event.featureId,
          sourceFile: event.sourceFile
        })
      }
    })
  }

  // Initialize all security headers and handlers
  initialize() {
    this.applyHeaders()
    this.setupCSPViolationHandler()
    this.setupFeaturePolicyViolationHandler()
    
    // Set up periodic header refresh
    setInterval(() => {
      this.refreshHeaders()
    }, 300000) // Refresh every 5 minutes
  }

  refreshHeaders() {
    // Refresh CSRF token
    const newToken = this.generateCSRFToken()
    sessionStorage.setItem('csrf-token', newToken)
    
    // Re-apply headers
    this.applyHeaders()
  }

  // Method to update CSP for dynamic content
  updateCSP(directive, source) {
    const currentCSP = this.headers.get('Content-Security-Policy')
    const directives = currentCSP.split('; ')
    
    let updated = false
    const updatedDirectives = directives.map(dir => {
      if (dir.startsWith(directive)) {
        updated = true
        return `${dir} ${source}`
      }
      return dir
    })
    
    if (!updated) {
      updatedDirectives.push(`${directive} ${source}`)
    }
    
    const newCSP = updatedDirectives.join('; ')
    this.headers.set('Content-Security-Policy', newCSP)
    this.setMetaHeader('Content-Security-Policy', newCSP)
  }

  // Method to get current security status
  getSecurityStatus() {
    return {
      headersApplied: this.headers.size,
      csrfTokenPresent: !!sessionStorage.getItem('csrf-token'),
      cspViolations: this.getCSPViolationCount(),
      lastHeaderRefresh: this.getLastHeaderRefresh()
    }
  }

  getCSPViolationCount() {
    // This would be tracked by the violation handler
    return parseInt(sessionStorage.getItem('csp-violation-count') || '0')
  }

  getLastHeaderRefresh() {
    return sessionStorage.getItem('last-header-refresh') || 'Never'
  }
}
