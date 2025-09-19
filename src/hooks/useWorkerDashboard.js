import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

export const useWorkerDashboard = (user) => {
  const [storeInfo, setStoreInfo] = useState(null)
  const [todayShifts, setTodayShifts] = useState({ shift1: null, shift2: null })
  const [currentShift, setCurrentShift] = useState(null)
  const [shiftTargets, setShiftTargets] = useState(null)
  const [shiftNumber, setShiftNumber] = useState(null)
  const [shiftTime, setShiftTime] = useState('00:00:00')
  const [sales, setSales] = useState([])
  const [shiftTotal, setShiftTotal] = useState(0)
  const [products, setProducts] = useState([])
  const [workerCompletedToday, setWorkerCompletedToday] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sales')

  // Calculate shift total
  useEffect(() => {
    const total = sales.reduce((sum, sale) => sum + parseFloat(sale.price || 0), 0)
    setShiftTotal(total)
  }, [sales])

  // Update shift time
  useEffect(() => {
    let interval
    if (currentShift) {
      interval = setInterval(() => {
        const now = new Date()
        const start = new Date(currentShift.start_time)
        const diff = now - start
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setShiftTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentShift])

  // Helper function to determine available shift number
  const getAvailableShiftNumber = (shifts, userId) => {
    logger.worker('Checking available shifts:', { shifts, userId })
    
    if (!shifts.shift1) {
      logger.worker('Shift 1 available (no shift1 exists)')
      return 1
    }
    if (!shifts.shift2) {
      logger.worker('Shift 2 available (no shift2 exists)')
      return 2
    }
    if (shifts.shift1.user_id === userId && !shifts.shift1.end_time) {
      logger.worker('User can continue shift 1')
      return 1
    }
    if (shifts.shift2.user_id === userId && !shifts.shift2.end_time) {
      logger.worker('User can continue shift 2')
      return 2
    }
    
    logger.worker('All shifts occupied:', {
      shift1: { user_id: shifts.shift1?.user_id, end_time: shifts.shift1?.end_time },
      shift2: { user_id: shifts.shift2?.user_id, end_time: shifts.shift2?.end_time },
      currentUserId: userId
    })
    return null
  }

  // Load all data
  const loadData = async () => {
    try {
      // Load store information
      const storeId = user.selectedStore || user.store_id
      logger.worker('User data:', { user, selectedStore: user.selectedStore, store_id: user.store_id, finalStoreId: storeId })
      
      if (storeId) {
        logger.worker('Loading store info for storeId:', storeId)
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()
        
        if (storeError) {
          logger.error('Error loading store info:', storeError)
        } else {
          logger.worker('Dashboard data loaded:', {
            storeInfo: store,
            todayShifts: todayShifts,
            currentShift: currentShift,
            shiftTargets: shiftTargets
          })
          setStoreInfo(store)
        }

        // Load shift targets
        const { data: targets } = await supabase
          .from('shift_targets')
          .select('*')
          .eq('store_id', storeId)
          .single()
        
        if (targets) {
          setShiftTargets(targets)
        }

        // Load today's shifts
        const today = new Date().toISOString().split('T')[0]
        logger.worker('Loading dashboard data for user:', user)
        const { data: shifts, error: shiftsError } = await supabase
          .from('shifts')
          .select(`
            *,
            store_users (
              name
            )
          `)
          .eq('store_id', storeId)
          .gte('start_time', today)
          .lt('start_time', today + 'T23:59:59')
        
        if (shiftsError) {
          logger.debug('Error loading shifts:', shiftsError)
        }
        logger.worker('Found shifts:', shifts)

        const shiftsData = { shift1: null, shift2: null }
        shifts?.forEach(s => {
          if (s.shift_number === 1) shiftsData.shift1 = s
          if (s.shift_number === 2) shiftsData.shift2 = s
        })
        setTodayShifts(shiftsData)

        // Determine which shift number to use
        const availableShiftNumber = getAvailableShiftNumber(shiftsData, user.id)
        logger.worker('Available shift number:', availableShiftNumber)
        setShiftNumber(availableShiftNumber)
      } else {
        logger.warn('No store ID found! User must select a store first.')
        logger.warn('This might be why shifts appear occupied - no store context!')
        setShiftNumber(null) // This will cause "All Shifts Occupied" to show
      }

      // Check if current user has completed a shift today
      const today = new Date().toISOString().split('T')[0]
      const { data: completedShift, error: completedError } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', user.id)
        .gte('start_time', today)
        .not('end_time', 'is', null)
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no data
      
      if (completedError) {
        logger.debug('Error checking completed shifts (this is normal for new users):', completedError)
      }
      setWorkerCompletedToday(!!completedShift)

      // Load current shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no data
      
      if (shiftError) {
        logger.debug('Error loading current shift (this is normal for new users):', shiftError)
      }

      setCurrentShift(shift)

      // Load today's sales for current user
      if (shift) {
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .eq('shift_id', shift.id)
          .order('created_at', { ascending: false })

        setSales(salesData || [])
      } else {
        setSales([])
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name')

      setProducts(productsData || [])
    } catch (error) {
      logger.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  // Check new day and load data
  const checkNewDayAndLoadData = async () => {
    try {
      // Check if it's a new day and handle any resets needed
      const { data: dayStatus, error: dayError } = await supabase.rpc('check_new_day_reset')
      
      if (dayError) {
        logger.warn('Could not check new day status:', dayError)
      } else if (dayStatus?.incomplete_reports_closed > 0) {
        logger.info('Previous day incomplete reports were automatically completed:', dayStatus)
      }
      
      // Load all data
      await loadData()
    } catch (error) {
      logger.error('Error checking new day status:', error)
      // Fallback to just loading data
      await loadData()
    }
  }

  // Start shift
  const startShift = async () => {
    let storeId = user.selectedStore || user.store_id
    
    // If no store ID, try to get the first available store
    if (!storeId || storeId === 'admin' || storeId === 'quick-login') {
      try {
        const { data: stores, error } = await supabase
          .from('stores')
          .select('id')
          .order('name')
          .limit(1)
        
        if (error) throw error
        
        if (stores && stores.length > 0) {
          storeId = stores[0].id
          logger.info('Using first available store:', storeId)
        } else {
          alert('No stores available. Please contact administrator.')
          return
        }
      } catch (error) {
        logger.error('Error getting store:', error)
        alert('Error accessing store information. Please try again.')
        return
      }
    }

    setLoading(true)
    try {
      // First check dashboard status to handle any day transitions
      const { data: dashboardStatus, error: dashboardError } = await supabase.rpc('get_dashboard_status', {
        p_store_id: storeId
      })
      
      if (dashboardStatus && !dashboardStatus.yesterday_completed) {
        logger.info('Previous day was automatically completed:', dashboardStatus.message)
      }

      const { data, error } = await supabase.rpc('start_shift', {
        p_user_id: user.id,
        p_store_id: storeId,
        p_shift_num: shiftNumber
      })

      if (error) throw error

      logger.info('Shift started successfully:', data)
      setSales([])
      await loadData() // Refresh data
    } catch (error) {
      logger.error('Error starting shift:', error)
      
      if (error.message?.includes('User data may be stale')) {
        // Try to refresh user data and retry once
        try {
          logger.info('Retrying shift start after user data refresh...')
          await checkNewDayAndLoadData()
          
          const { data, error: retryError } = await supabase.rpc('start_shift', {
            p_user_id: user.id,
            p_store_id: storeId,
            p_shift_num: shiftNumber
          })

          if (retryError) throw retryError

          setSales([])
          await loadData() // Refresh data
          logger.info('Shift started successfully after retry:', data)
          setLoading(false)
          return
        } catch (retryError) {
          logger.error('Retry also failed:', retryError)
          alert(`Failed to start shift even after refresh: ${retryError.message}. Please log out and log back in.`)
        }
      } else {
        alert(`Failed to start shift: ${error.message}`)
      }
    }
    setLoading(false)
  }

  // End shift
  const endShift = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('end_shift', {
        shift_id: currentShift.id
      })

      if (error) throw error

      logger.info('Shift ended successfully:', data)
      await loadData() // Refresh data
    } catch (error) {
      logger.error('Error ending shift:', error)
      alert(`Failed to end shift: ${error.message}`)
    }
    setLoading(false)
  }

  // Submit sale
  const submitSale = async (saleForm) => {
    logger.sales('Submitting sale with data:', { 
      user, 
      storeInfo, 
      currentShift, 
      saleForm 
    })

    if (!currentShift) {
      alert('No active shift found')
      return
    }

    // Check for required objects before accessing their properties
    if (!user) {
      alert('User information not available')
      return
    }

    if (!storeInfo) {
      alert('Store information not available. Please refresh the page.')
      return
    }

    setLoading(true)
    try {
      const saleData = {
        user_id: user.id,
        store_id: storeInfo.id,
        shift_id: currentShift.id,
        product_id: saleForm.product_id || null,
        product: saleForm.product,
        price: parseFloat(saleForm.price),
        quantity: saleForm.quantity ? parseInt(saleForm.quantity) : null,
        ml_amount: saleForm.ml_amount ? parseFloat(saleForm.ml_amount) : null,
        payment_type: 'cash'
      }

      logger.sales('Sale data being submitted:', saleData)

      const { data, error } = await supabase
        .from('sales')
        .insert([saleData])
        .select()

      if (error) throw error

      logger.sales('Sale recorded:', data[0])
      
      // Add to local sales list
      setSales(prev => [data[0], ...prev])
    } catch (error) {
      logger.error('Error recording sale:', error)
      alert(`Failed to record sale: ${error.message}`)
    }
    setLoading(false)
  }

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      checkNewDayAndLoadData()
    }
  }, [user])

  return {
    // State
    storeInfo,
    todayShifts,
    currentShift,
    shiftTargets,
    shiftNumber,
    shiftTime,
    sales,
    shiftTotal,
    products,
    workerCompletedToday,
    loading,
    activeTab,
    
    // Actions
    setActiveTab,
    startShift,
    endShift,
    submitSale,
    loadData: checkNewDayAndLoadData
  }
}

export default useWorkerDashboard
