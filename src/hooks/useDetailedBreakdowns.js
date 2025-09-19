import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useDetailedBreakdowns = () => {
  const [productBreakdown, setProductBreakdown] = useState(null)
  const [monthlyProductBreakdown, setMonthlyProductBreakdown] = useState(null)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [loadingProductBreakdown, setLoadingProductBreakdown] = useState(false)

  // Load detailed daily breakdown
  const loadDailyProductBreakdown = useCallback(async (date) => {
    try {
      setLoadingProductBreakdown(true)
      
      const { data, error } = await supabase.rpc('get_detailed_daily_breakdown', {
        p_date: date
      })

      if (error) {
        throw error
      }
      setProductBreakdown(data)
      setShowProductDetails(true)
      
      return data
    } catch (error) {
      alert('Error loading detailed breakdown. Please try again.')
      throw error
    } finally {
      setLoadingProductBreakdown(false)
    }
  }, [])

  // Load detailed monthly breakdown
  const loadMonthlyProductBreakdown = useCallback(async (year, month) => {
    try {
      setLoadingProductBreakdown(true)
      
      const { data, error } = await supabase.rpc('get_detailed_monthly_breakdown', {
        p_year: year,
        p_month: month
      })

      if (error) {
        throw error
      }
      setMonthlyProductBreakdown(data)
      
      return data
    } catch (error) {
      alert('Error loading detailed monthly breakdown. Please try again.')
      throw error
    } finally {
      setLoadingProductBreakdown(false)
    }
  }, [])

  // Clear breakdowns
  const clearBreakdowns = useCallback(() => {
    setProductBreakdown(null)
    setMonthlyProductBreakdown(null)
    setShowProductDetails(false)
  }, [])

  return {
    // State
    productBreakdown,
    monthlyProductBreakdown,
    showProductDetails,
    loadingProductBreakdown,
    
    // Actions
    loadDailyProductBreakdown,
    loadMonthlyProductBreakdown,
    setShowProductDetails,
    clearBreakdowns
  }
}

export default useDetailedBreakdowns
