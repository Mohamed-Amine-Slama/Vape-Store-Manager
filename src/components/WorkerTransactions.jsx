import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Select, Badge } from './ui'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { DollarSign, Package, Calendar, Plus, History, CreditCard, ShoppingBag } from 'lucide-react'
import { fuzzySearch } from '../lib/fuzzySearch'
import { useDebounce } from '../hooks'

export default function WorkerTransactions({ user, storeInfo, products }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [transactionType, setTransactionType] = useState('salary_advance')
  
  // Form state
  const [form, setForm] = useState({
    amount: '',
    category: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    ml_amount: '',
    notes: ''
  })
  
  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  
  // Debounce the search input to improve performance
  const debouncedProductSearch = useDebounce(productSearch, 300)

  useEffect(() => {
    loadTransactions()
  }, [user.id])

  useEffect(() => {
    const source = form.category ? products.filter(p => p.category === form.category) : []
    if (source.length === 0) {
      setFilteredProducts([])
      return
    }
    if (!debouncedProductSearch) {
      // Show top items when no search entered
      const base = source.slice(0, 20).map(p => ({ item: p, similarity: 1, matchType: 'contains' }))
      setFilteredProducts(base)
    } else {
      const results = fuzzySearch(debouncedProductSearch, source, { key: 'name', limit: 20 })
      setFilteredProducts(results)
    }
  }, [debouncedProductSearch, products, form.category])

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_worker_transactions', {
        p_user_id: user.id,
        p_start_date: null, // Last 30 days by default
        p_end_date: null,
        p_transaction_type: null
      })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      // Error loading transactions
    }
  }

  const handleProductSearch = (searchValue) => {
    setProductSearch(searchValue)
    setForm({
      ...form,
      product_name: searchValue,
      product_id: ''
    })
    setShowProductDropdown(!!form.category)
    
    // Auto-select if high similarity match found
    if (filteredProducts.length > 0 && filteredProducts[0].similarity > 0.8) {
      const product = filteredProducts[0].item
      handleProductSelect(product)
    }
  }

  const handleProductSelect = (product) => {
    const isLiquid = ['fruities', 'gourmands'].includes(product.category)
    setForm({
      ...form,
      category: product.category,
      product_id: product.id,
      product_name: product.name,
      quantity: isLiquid ? '' : 1,
      ml_amount: isLiquid ? '' : ''
    })
    setProductSearch(product.name)
    setShowProductDropdown(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!storeInfo?.id) {
      alert('Store information not available')
      return
    }

    setLoading(true)
    try {
      let result
      
      if (transactionType === 'salary_advance') {
        if (!form.amount || parseFloat(form.amount) <= 0) {
          alert('Please enter a valid amount')
          return
        }
        
        const { data, error } = await supabase.rpc('record_salary_advance', {
          p_user_id: user.id,
          p_store_id: storeInfo.id,
          p_amount: parseFloat(form.amount),
          p_notes: form.notes || null
        })
        
        if (error) throw error
        result = data
      } else {
        // Product consumption
        if (!form.product_id) {
          alert('Please select a product')
          return
        }
        
        const product = products.find(p => p.id === form.product_id)
        const isLiquid = ['fruities', 'gourmands'].includes(product?.category)
        
        let amount
        if (isLiquid) {
          if (!form.ml_amount || parseFloat(form.ml_amount) <= 0) {
            alert('Please enter a valid ml amount')
            return
          }
          amount = parseFloat(form.ml_amount)
        } else {
          if (!form.quantity || parseInt(form.quantity) <= 0) {
            alert('Please enter a valid quantity')
            return
          }
          amount = parseInt(form.quantity)
        }
        
        const { data, error } = await supabase.rpc('record_product_consumption', {
          p_user_id: user.id,
          p_store_id: storeInfo.id,
          p_product_id: form.product_id,
          p_amount: amount,
          p_notes: form.notes || null
        })
        
        if (error) throw error
        result = data
      }

      if (!result.success) {
        throw new Error(result.message)
      }

      // Reset form and reload transactions
      setForm({
        amount: '',
        category: '',
        product_id: '',
        product_name: '',
        quantity: 1,
        ml_amount: '',
        notes: ''
      })
      setProductSearch('')
      setShowForm(false)
      await loadTransactions()
      
      alert(`${transactionType === 'salary_advance' ? 'Salary advance' : 'Product consumption'} recorded successfully!`)
    } catch (error) {
      alert(`Failed to record transaction: ${error.message}`)
    }
    setLoading(false)
  }

  const resetForm = (close = false) => {
    setForm({
      amount: '',
      category: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      ml_amount: '',
      notes: ''
    })
    setProductSearch('')
    if (close) setShowForm(false)
  }

  const selectedProduct = products.find(p => p.id === form.product_id)
  const isLiquidProduct = ['fruities', 'gourmands'].includes((selectedProduct?.category) || form.category || '')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Add Button */}
      <div className="worker-card">
        <div className="worker-card-content">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">My Transactions</h2>
                <p className="text-xs sm:text-sm text-gray-600">Salary advances and product consumption</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "outline" : "default"}
              className="worker-button flex items-center space-x-2 font-semibold transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Add Transaction'}</span>
              <span className="sm:hidden">{showForm ? 'Cancel' : 'Add'}</span>
            </Button>
        </div>

          {/* Transaction Form */}
          {showForm && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <form onSubmit={handleSubmit} className="sale-form">
                <div className="form-field">
                  <Select
                    label="Transaction Type"
                    value={transactionType}
                    onChange={(e) => {
                      const newType = e.target.value
                      setTransactionType(newType)
                      resetForm(false) // Clear fields but keep the form open
                    }}
                    className="form-input"
                    options={[
                      { value: 'salary_advance', label: '💰 Salary Advance' },
                      { value: 'product_consumption', label: '🛍️ Product Consumption' }
                    ]}
                  />
                </div>

                {transactionType === 'salary_advance' ? (
                  <div className="form-field">
                    <Input
                      label="Amount (TND)"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.amount}
                      onChange={(e) => setForm({...form, amount: e.target.value})}
                      placeholder="Enter advance amount"
                      className="form-input"
                      required
                    />
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-field">
                      <Select
                        label="Category"
                        value={form.category}
                        onChange={(e) => {
                          const category = e.target.value
                          setForm({
                            ...form,
                            category,
                            product_id: '',
                            product_name: '',
                            quantity: 1,
                            ml_amount: ''
                          })
                          setProductSearch('')
                          setFilteredProducts([])
                        }}
                        className="form-input"
                        options={[
                          { value: '', label: 'Select category' },
                          { value: 'fruities', label: '🍓 Fruities' },
                          { value: 'gourmands', label: '🍰 Gourmands' },
                          { value: 'puffs', label: '💨 Puffs' },
                          { value: 'coils', label: '🔧 Coils' },
                          { value: 'mesh', label: '🕸️ Mesh' }
                        ]}
                      />
                    </div>

                    <div className="form-field relative">
                      <Input
                        label="Product"
                        value={productSearch}
                        onChange={(e) => handleProductSearch(e.target.value)}
                        placeholder={form.category ? 'Search for product...' : 'Select category first'}
                        disabled={!form.category}
                        onFocus={() => setShowProductDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                        className="form-input"
                        required
                      />
                      
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="product-dropdown">
                          {filteredProducts.map(({ item: product, similarity, matchType }) => (
                            <div
                              key={product.id}
                              className="product-dropdown-item"
                              onClick={() => handleProductSelect(product)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.category}</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`worker-badge text-xs ${
                                    similarity > 0.8 ? 'bg-green-100 text-green-800' :
                                    similarity > 0.6 ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {matchType}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <div className="form-field">
                        {isLiquidProduct ? (
                          <Input
                            label="Amount (ml)"
                            type="number"
                            step="0.1"
                            min="0"
                            value={form.ml_amount}
                            onChange={(e) => setForm({...form, ml_amount: e.target.value})}
                            placeholder="e.g., 30, 60"
                            className="form-input"
                            required
                          />
                        ) : (
                          <Input
                            label="Quantity"
                            type="number"
                            min="1"
                            value={form.quantity}
                            onChange={(e) => setForm({...form, quantity: e.target.value})}
                            className="form-input"
                            required
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-field">
                  <Input
                    label="Notes (Optional)"
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                    placeholder="Add any notes..."
                    className="form-input"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="worker-button flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300"
                  >
                    {loading ? 'Recording...' : 'RECORD TRANSACTION'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetForm(true)}
                    disabled={loading}
                    className="worker-button border-2 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 font-semibold transition-all duration-300"
                  >
                    CANCEL
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="worker-card">
        <div className="worker-card-header">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Transaction History</h3>
          </div>
        </div>
        <div className="worker-card-content">

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm">Your salary advances and product consumption will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 sm:p-3 rounded-xl ${
                      transaction.transaction_type === 'salary_advance' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {transaction.transaction_type === 'salary_advance' ? (
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {transaction.transaction_type === 'salary_advance' ? (
                          `Salary Advance: ${formatCurrency(transaction.amount)}`
                        ) : (
                          `${transaction.product_name}${transaction.product_category ? ` (${transaction.product_category})` : ''} - ${
                            transaction.ml_amount ? `${transaction.ml_amount}ml` : `${transaction.quantity} pcs`
                          }`
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        {transaction.store_name} • {formatDateTime(transaction.created_at)}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          Note: {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="worker-badge text-xs font-semibold uppercase tracking-wide">
                    <span className={transaction.transaction_type === 'salary_advance' ? 'text-green-700' : 'text-blue-700'}>
                      {transaction.transaction_type === 'salary_advance' ? 'Advance' : 'Consumption'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
