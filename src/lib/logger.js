/**
 * Production-safe logging utility
 * Automatically handles development vs production logging
 */

const isDevelopment = import.meta.env.MODE === 'development'

const logger = {
  // Development only logging
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },

  // Important information (production safe - only critical info)
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },

  // Warnings (production safe - only important warnings)
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },

  // Errors (always shown - critical for debugging)
  error: (...args) => {
    console.error('[ERROR]', ...args)
  },

  // Development only - for debugging specific features
  worker: (...args) => {
    if (isDevelopment) {
      console.log('[WORKER]', ...args)
    }
  },

  sales: (...args) => {
    if (isDevelopment) {
      console.log('[SALES]', ...args)
    }
  },

  auth: (...args) => {
    if (isDevelopment) {
      console.log('[AUTH]', ...args)
    }
  },

  security: (...args) => {
    if (isDevelopment) {
      console.log('[SECURITY]', ...args)
    }
  }
}

export default logger
