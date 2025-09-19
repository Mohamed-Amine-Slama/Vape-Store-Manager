import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

export const useFD = (storeId = null) => {
  const [todayFD, setTodayFD] = useState(null)
  const [fdRecords, setFdRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load today's FD for a specific store
  const loadTodayFD = useCallback(async (targetStoreId = null) => {
    const storeToQuery = targetStoreId || storeId
    if (!storeToQuery) return

    try {
      setLoading(true)
      setError(null)

      // Try to call the RPC function, fallback to direct table query if function doesn't exist
      let data, fdError
      
      try {
        const result = await supabase.rpc('get_today_fd', {
          p_store_id: storeToQuery
        })
        data = result.data
        fdError = result.error
      } catch (rpcError) {
        logger.warn('RPC function not found, trying direct table query:', rpcError)
        
        // Fallback to direct table query
        const today = new Date().toISOString().split('T')[0]
        const result = await supabase
          .from('fd_records')
          .select(`
            id,
            amount,
            store_users!inner(name),
            shift_number,
            notes,
            created_at
          `)
          .eq('store_id', storeToQuery)
          .eq('fd_date', today)
          .limit(1)
        
        data = result.data?.map(record => ({
          id: record.id,
          amount: record.amount,
          user_name: record.store_users.name,
          shift_number: record.shift_number,
          notes: record.notes,
          created_at: record.created_at
        }))
        fdError = result.error
      }

      if (fdError) {
        throw fdError
      }

      setTodayFD(data && data.length > 0 ? data[0] : null)
      logger.info('Today FD loaded:', data)
    } catch (err) {
      logger.error('Error loading today FD:', err)
      setError(err.message)
      setTodayFD(null)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  // Load FD records with optional filtering
  const loadFDRecords = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)

      logger.info('Loading FD records with filters:', filters)

      // Try to call the RPC function, fallback to direct table query if function doesn't exist
      let data, fdError
      
      try {
        const result = await supabase.rpc('get_fd_records', {
          p_store_id: filters.storeId || null,
          p_start_date: filters.startDate || null,
          p_end_date: filters.endDate || null
        })
        data = result.data
        fdError = result.error
      } catch (rpcError) {
        logger.warn('RPC function not found, trying direct table query:', rpcError)
        
        // Fallback to direct table query
        let query = supabase
          .from('fd_records')
          .select(`
            id,
            store_id,
            stores!inner(name),
            user_id,
            store_users!inner(name),
            fd_date,
            amount,
            shift_number,
            notes,
            created_at
          `)
          .order('fd_date', { ascending: false })
        
        if (filters.storeId) {
          query = query.eq('store_id', filters.storeId)
        }
        if (filters.startDate) {
          query = query.gte('fd_date', filters.startDate)
        }
        if (filters.endDate) {
          query = query.lte('fd_date', filters.endDate)
        }
        
        const result = await query
        data = result.data?.map(record => ({
          id: record.id,
          store_id: record.store_id,
          store_name: record.stores.name,
          user_id: record.user_id,
          user_name: record.store_users.name,
          fd_date: record.fd_date,
          amount: record.amount,
          shift_number: record.shift_number,
          notes: record.notes,
          created_at: record.created_at
        }))
        fdError = result.error
      }

      if (fdError) {
        logger.error('Database error:', fdError)
        throw fdError
      }

      setFdRecords(data || [])
      logger.info('FD records loaded successfully:', data)
    } catch (err) {
      logger.error('Error loading FD records:', err)
      setError(err.message)
      setFdRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Set FD for tomorrow
  const setFDForTomorrow = async (userId, targetStoreId, amount, shiftNumber, notes = null) => {
    try {
      setLoading(true)
      setError(null)

      // Try to call the RPC function, fallback to direct table insert if function doesn't exist
      let data, fdError
      
      try {
        const result = await supabase.rpc('set_fd_for_tomorrow', {
          p_user_id: userId,
          p_store_id: targetStoreId,
          p_amount: amount,
          p_shift_number: shiftNumber,
          p_notes: notes
        })
        data = result.data
        fdError = result.error
      } catch (rpcError) {
        logger.warn('RPC function not found, trying direct table insert:', rpcError)
        
        // Fallback to direct table insert
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowDate = tomorrow.toISOString().split('T')[0]
        
        const result = await supabase
          .from('fd_records')
          .upsert({
            store_id: targetStoreId,
            user_id: userId,
            fd_date: tomorrowDate,
            amount: amount,
            shift_number: shiftNumber,
            notes: notes
          }, {
            onConflict: 'store_id,fd_date'
          })
          .select()
        
        data = {
          success: !result.error,
          message: result.error ? `Failed to set FD: ${result.error.message}` : 'FD set successfully for tomorrow',
          fd_date: tomorrowDate,
          amount: amount,
          id: result.data?.[0]?.id
        }
        fdError = result.error
      }

      if (fdError) {
        throw fdError
      }

      if (data && !data.success) {
        throw new Error(data.message)
      }

      logger.info('FD set for tomorrow:', data)
      return { success: true, data }
    } catch (err) {
      logger.error('Error setting FD for tomorrow:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Get FD records for a date range (for admin dashboard)
  const getFDRecordsForDateRange = async (startDate, endDate, targetStoreId = null) => {
    try {
      const { data, error: fdError } = await supabase.rpc('get_fd_records', {
        p_store_id: targetStoreId,
        p_start_date: startDate,
        p_end_date: endDate
      })

      if (fdError) {
        throw fdError
      }

      return { success: true, data: data || [] }
    } catch (err) {
      logger.error('Error getting FD records for date range:', err)
      return { success: false, error: err.message, data: [] }
    }
  }

  // Check if FD is required for shift end
  const shouldShowFDPopup = (shiftNumber, storeId) => {
    // Only show FD popup for 2nd shift workers
    return shiftNumber === 2 && storeId
  }

  // Auto-load today's FD when storeId changes
  useEffect(() => {
    if (storeId) {
      loadTodayFD(storeId)
    }
  }, [storeId])

  return {
    // State
    todayFD,
    fdRecords,
    loading,
    error,

    // Actions
    loadTodayFD,
    loadFDRecords,
    setFDForTomorrow,
    getFDRecordsForDateRange,
    shouldShowFDPopup,

    // Utilities
    clearError: () => setError(null)
  }
}

export default useFD
