import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useProductCatalog = () => {
  // State management
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Product categories
  const categories = [
    { value: 'fruities', label: 'Fruities' },
    { value: 'gourmands', label: 'Gourmands' },
    { value: 'puffs', label: 'Puffs' },
    { value: 'coils', label: 'Coils' },
    { value: 'mesh', label: 'Mesh' }
  ]

  const categoryColors = {
    fruities: 'bg-pink-100 text-pink-700 border-pink-200',
    gourmands: 'bg-amber-100 text-amber-700 border-amber-200',
    puffs: 'bg-purple-100 text-purple-700 border-purple-200',
    coils: 'bg-blue-100 text-blue-700 border-blue-200',
    mesh: 'bg-green-100 text-green-700 border-green-200'
  }

  const getCategoryDotColor = (category) => {
    const colors = {
      fruities: '#ec4899',
      gourmands: '#f59e0b',
      puffs: '#a855f7',
      coils: '#3b82f6',
      mesh: '#10b981'
    }
    return colors[category] || '#6b7280'
  }

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get the first store ID for inventory lookup
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1)
      
      const storeId = stores?.[0]?.id
      
      if (!storeId) {
        setError('No store found')
        return
      }
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store_inventory!left (
            stock_quantity,
            stock_ml,
            low_stock_threshold_quantity,
            low_stock_threshold_ml
          )
        `)
        .eq('store_inventory.store_id', storeId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      
      // Process the data to flatten inventory information
      const processedProducts = (data || []).map(product => ({
        ...product,
        stock_quantity: product.store_inventory?.[0]?.stock_quantity || 0,
        stock_ml: product.store_inventory?.[0]?.stock_ml || 0,
        low_stock_threshold_quantity: product.store_inventory?.[0]?.low_stock_threshold_quantity || 0,
        low_stock_threshold_ml: product.store_inventory?.[0]?.low_stock_threshold_ml || 0
      }))
      
      setProducts(processedProducts)
    } catch (error) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create product
  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // First, get the store ID
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .limit(1)
      
      const storeId = stores?.[0]?.id
      
      if (!storeId) {
        throw new Error('No store found')
      }

      // Create the product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productData.name.trim(),
          category: productData.category,
          price: 0.00  // Default price when admin only adds name and category
        }])
        .select()
        .single()

      if (productError) throw productError

      // Ensure inventory row exists for the new product
      const { error: inventoryError } = await supabase
        .rpc('ensure_inventory_row', {
          p_store_id: storeId,
          p_product_id: newProduct.id
        })

      if (inventoryError) {
        // Don't fail the product creation if inventory row creation fails
      }
      
      setSuccess('Product created successfully!')
      await loadProducts()
      return { success: true }
    } catch (error) {
      setError(error.message || 'Failed to create product')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [loadProducts])

  // Update product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name.trim(),
          category: productData.category
        })
        .eq('id', productId)

      if (error) throw error
      
      setSuccess('Product updated successfully!')
      await loadProducts()
      return { success: true }
    } catch (error) {
      setError(error.message || 'Failed to update product')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [loadProducts])

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      setSuccess('Product deleted successfully!')
      await loadProducts()
      return { success: true }
    } catch (error) {
      setError(error.message || 'Failed to delete product')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [loadProducts])

  // Validate product form
  const validateProduct = useCallback((productData, editingProductId = null) => {
    const errors = {}

    if (!productData.name.trim()) {
      errors.name = 'Product name is required'
    } else if (productData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters'
    } else if (productData.name.trim().length > 100) {
      errors.name = 'Product name must be less than 100 characters'
    } else {
      // Check if product name is already taken in the same category
      const existingProduct = products.find(product => 
        product.name.toLowerCase() === productData.name.trim().toLowerCase() && 
        product.category === productData.category &&
        product.id !== editingProductId
      )
      if (existingProduct) {
        errors.name = `A product with this name already exists in the ${productData.category} category`
      }
    }

    if (!productData.category) {
      errors.category = 'Category is required'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [products])

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  // Get category stats
  const categoryStats = categories.map(category => ({
    ...category,
    count: products.filter(p => p.category === category.value).length
  }))

  // Initial load
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    // State
    products,
    filteredProducts,
    loading,
    selectedCategory,
    error,
    success,
    categories,
    categoryColors,
    categoryStats,
    
    // Actions
    setSelectedCategory,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    validateProduct,
    getCategoryDotColor,
    
    // Utilities
    setError,
    setSuccess
  }
}

export default useProductCatalog
