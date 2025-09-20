import { createClient } from '@supabase/supabase-js'
import { SecurityMiddleware } from './SecurityMiddleware'
import logger from '../lib/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create the base Supabase client
const baseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle our own session management
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'vape-store-manager/1.0.0',
      'X-Request-Source': 'web-app'
    }
  }
})

// Create security middleware instance
const securityMiddleware = new SecurityMiddleware()

// Create secure client wrapper
export const createSecureSupabaseClient = () => {
  // Always enable security middleware - query wrapping issue has been resolved
  logger.security('Security middleware enabled for all environments')
  return securityMiddleware.wrapSupabaseClient(baseClient)
}

// Export the secure client as default
export const supabase = createSecureSupabaseClient()

// Export security middleware for direct access
export { securityMiddleware }
