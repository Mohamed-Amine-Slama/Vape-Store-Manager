import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

export const useHistoricalReports = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [dailyReports, setDailyReports] = useState([])
  const [monthlyData, setMonthlyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

  // Load available dates
  const loadAvailableDates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      logger.debug('Loading available dates...')
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_date')
        .order('report_date', { ascending: false })
        .limit(100)

      if (error) {
        logger.error('Database error loading dates:', error)
        throw error
      }

      const dates = data?.map(item => item.report_date) || []
      logger.debug('Available dates loaded:', dates.length)
      setAvailableDates(dates)
      
      return dates
    } catch (error) {
      logger.error('Error loading available dates:', error)
      setError(`Failed to load dates: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Load daily reports for current month
  const loadDailyReports = useCallback(async (date = currentDate) => {
    try {
      setLoading(true)
      setError(null)
      
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      // Calculate the last day of the month properly
      const lastDayOfMonth = new Date(year, month, 0).getDate()
      
      const { data, error } = await supabase.rpc('get_historical_reports', {
        p_start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
        p_end_date: `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`
      })

      if (error) {
        throw error
      }
      setDailyReports(data || [])
      
      return data || []
    } catch (error) {
      setError(`Failed to load daily reports: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  // Load monthly summary data
  const loadMonthlyData = useCallback(async (date = currentDate) => {
    try {
      setLoading(true)
      setError(null)
      
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      const { data, error } = await supabase.rpc('get_monthly_summary', {
        p_year: year,
        p_month: month
      })

      if (error) {
        throw error
      }
      setMonthlyData(data)
      
      return data
    } catch (error) {
      setError(`Failed to load monthly data: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadAvailableDates(),
        loadDailyReports(),
        loadMonthlyData()
      ])
      setLastRefresh(new Date())
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }, [loadAvailableDates, loadDailyReports, loadMonthlyData])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAvailableDates(),
          loadDailyReports(),
          loadMonthlyData()
        ])
      } catch (error) {
        // Error handling
      }
    }

    initializeData()
  }, [loadAvailableDates, loadDailyReports, loadMonthlyData])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshData])

  return {
    // State
    currentDate,
    selectedDate,
    availableDates,
    dailyReports,
    monthlyData,
    loading,
    error,
    lastRefresh,
    isMobile,
    
    // Actions
    setCurrentDate,
    setSelectedDate,
    loadAvailableDates,
    loadDailyReports,
    loadMonthlyData,
    refreshData,
    
    // Utilities
    setError
  }
}

export default useHistoricalReports
