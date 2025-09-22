import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    // Simulate initial app loading time for data retrieval
    const initializeApp = async () => {
      // Show loading screen for minimum 3 seconds to allow backend data retrieval
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check if user is stored in localStorage
      const storedUser = localStorage.getItem('vape-store-user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      
      // Wait for minimum loading time
      await minLoadingTime
      
      setInitialLoading(false)
      setLoading(false)
    }

    initializeApp()
  }, [])

  const login = async (pin, storeId) => {
    try {
      // Handle quick login first (bypass store validation)
      if (storeId === 'quick-login') {
        const { data: userData, error: userError } = await supabase
          .from('store_users')
          .select('*')
          .eq('pin', pin)
          .single()

        if (userError || !userData) {
          throw new Error('Invalid PIN')
        }

        const finalUserData = {
          ...userData,
          isAdmin: userData.role === 'admin',
          storeId: userData.store_id || 'unknown'
        }

        setUser(finalUserData)
        localStorage.setItem('vape-store-user', JSON.stringify(finalUserData))
        return { success: true, user: finalUserData }
      }

      // Try to get user with store information
      const { data: usersWithStores, error: storeError } = await supabase
        .from('store_users')
        .select(`
          *,
          stores (
            id,
            name,
            location,
            phone
          )
        `)
        .eq('pin', pin)

      if (storeError && storeError.code !== 'PGRST116') {
        throw storeError
      }

      // If we have users with store data
      if (usersWithStores && usersWithStores.length > 0) {
        let user = null

        if (storeId === 'admin') {
          user = usersWithStores.find(u => u.role === 'admin')
        } else {
          user = usersWithStores.find(u => u.pin === pin)
        }

        if (!user) {
          throw new Error('User not found')
        }

        logger.auth('Login successful with store data:', user)
        
        const userData = {
          ...user,
          selectedStore: storeId === 'admin' ? null : storeId,
          selectedStoreName: storeId === 'admin' ? 'All Stores' : user.stores?.name || 'Unknown Store'
        }
        
        setUser(userData)
        localStorage.setItem('vape-store-user', JSON.stringify(userData))
        return { success: true, user: userData }
      }

      // Fallback: Simple user lookup without store joins
      const { data: simpleUser, error: simpleError } = await supabase
        .from('store_users')
        .select('*')
        .eq('pin', pin)
        .single()

      if (simpleError) throw simpleError

      logger.auth('Login successful with simple lookup:', simpleUser)
      
      const userData = {
        ...simpleUser,
        selectedStore: storeId === 'admin' ? null : storeId,
        selectedStoreName: storeId === 'admin' ? 'All Stores' : 'Store Access'
      }
      
      setUser(userData)
      localStorage.setItem('vape-store-user', JSON.stringify(userData))
      return { success: true, user: userData }

    } catch (error) {
      logger.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('vape-store-user')
  }

  const refreshUser = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('store_users')
        .select(`
          *,
          stores (
            id,
            name,
            location,
            phone
          )
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        logger.warn('User ID not found in store_users, trying PIN lookup...', error)
        
        // If user ID doesn't exist, try to find by PIN instead
        if (user.pin) {
          const { data: pinData, error: pinError } = await supabase
            .from('store_users')
            .select(`
              *,
              stores (
                id,
                name,
                location,
                phone
              )
            `)
            .eq('pin', user.pin)
            .single()
            
          if (pinError) throw pinError
          
          logger.auth('Found user by PIN, updating user data...', pinData)
          
          const userData = {
            ...pinData,
            selectedStore: user.selectedStore,
            selectedStoreName: user.selectedStoreName
          }

          setUser(userData)
          localStorage.setItem('vape-store-user', JSON.stringify(userData))
          return userData
        }
        
        throw error
      }

      const userData = {
        ...data,
        selectedStore: user.selectedStore,
        selectedStoreName: user.selectedStoreName
      }

      setUser(userData)
      localStorage.setItem('vape-store-user', JSON.stringify(userData))
      return userData
    } catch (error) {
      logger.error('Error refreshing user:', error)
      // If refresh fails, log out the user
      logout()
      return null
    }
  }

  const value = {
    user,
    login,
    logout,
    refreshUser,
    loading,
    initialLoading,
    isWorker: user?.role === 'worker',
    isAdmin: user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
