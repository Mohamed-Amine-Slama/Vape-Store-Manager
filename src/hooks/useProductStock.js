import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useProductStock = () => {
  const [stockModal, setStockModal] = useState({ 
    open: false, 
    product: null, 
    inventory: [], 
    loading: false, 
    error: '' 
  })

  // Open stock modal and load inventory data
  const openStockModal = useCallback(async (product) => {
    // Ensure we have a valid product
    if (!product || !product.id) {
      console.error('Invalid product provided to openStockModal')
      return
    }

    // Close any other modals that might be open by dispatching a custom event
    window.dispatchEvent(new CustomEvent('closeOtherModals', { detail: { source: 'stockModal' } }))
    
    setStockModal({ open: true, product, inventory: [], loading: true, error: '' })
    
    try {
      const { data, error } = await supabase.rpc('get_inventory_for_product', { 
        p_product_id: product.id 
      })
      
      if (error) throw error
      
      setStockModal(prev => ({ 
        ...prev, 
        loading: false, 
        inventory: data || [] 
      }))
    } catch (err) {
      setStockModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to load stock information' 
      }))
    }
  }, [])

  // Close stock modal
  const closeStockModal = useCallback(() => {
    setStockModal({ 
      open: false, 
      product: null, 
      inventory: [], 
      loading: false, 
      error: '' 
    })
  }, [])

  // Refresh stock data
  const refreshStock = useCallback(async () => {
    if (!stockModal.product) return

    setStockModal(prev => ({ ...prev, loading: true, error: '' }))
    
    try {
      const { data, error } = await supabase.rpc('get_inventory_for_product', { 
        p_product_id: stockModal.product.id 
      })
      
      if (error) throw error
      
      setStockModal(prev => ({ 
        ...prev, 
        loading: false, 
        inventory: data || [] 
      }))
    } catch (err) {
      setStockModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to refresh stock information' 
      }))
    }
  }, [stockModal.product])

  return {
    // State
    stockModal,
    
    // Actions
    openStockModal,
    closeStockModal,
    refreshStock
  }
}

export default useProductStock
