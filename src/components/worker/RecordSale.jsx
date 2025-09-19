import React, { useState, useEffect } from 'react'
import { Button, Input, Select } from '../ui'
import { Package, Search } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { fuzzySearch } from '../../lib/fuzzySearch'
import { useDebounce } from '../../hooks'

const RecordSale = ({ 
  currentShift, 
  sales, 
  shiftTotal, 
  products, 
  onSubmitSale, 
  loading 
}) => {
  const [saleForm, setSaleForm] = useState({
    product: '',
    product_id: '',
    category: '',
    price: '',
    quantity: '',
    ml_amount: ''
  })
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Debounce the search input to improve performance
  const debouncedSearch = useDebounce(productSearch, 300)

  // Filter products based on category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = !saleForm.category || product.category === saleForm.category
    const matchesSearch = !debouncedSearch || 
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Get fuzzy search results with debounced search
  const fuzzyResults = debouncedSearch ? fuzzySearch(debouncedSearch, filteredProducts, { key: 'name' }) : []
  const displayProducts = debouncedSearch ? fuzzyResults : filteredProducts

  // Handle product selection
  const handleProductSelect = (product) => {
    setSaleForm({
      ...saleForm,
      product: product.name,
      product_id: product.id,
      category: product.category,
      price: product.price?.toString() || ''
    })
    setProductSearch(product.name)
    setShowProductDropdown(false)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmitSale(saleForm)
    
    // Reset form
    setSaleForm({
      product: '',
      product_id: '',
      category: '',
      price: '',
      quantity: '',
      ml_amount: ''
    })
    setProductSearch('')
  }

  // Update product search when form product changes
  useEffect(() => {
    if (saleForm.product !== productSearch) {
      setProductSearch(saleForm.product)
    }
  }, [saleForm.product])

  return (
    <div className="worker-card">
      {/* Header Section */}
      <div className="worker-card-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Record Sale</h2>
              <p className="text-xs sm:text-sm text-gray-600">Process customer transactions</p>
            </div>
          </div>
          {currentShift && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-blue-100 text-blue-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-sm">
                {sales.length} sales
              </div>
              <div className="bg-purple-100 text-purple-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm">
                {formatCurrency(shiftTotal)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="worker-card-content">
        {currentShift ? (
          <form onSubmit={handleSubmit} className="sale-form">
            <div className="form-grid">
              <div className="form-field">
                <Select
                  label="Category"
                  value={saleForm.category}
                  onChange={(e) => setSaleForm({...saleForm, category: e.target.value})}
                  className="form-input"
                  required
                  options={[
                    { value: '', label: 'Select Category' },
                    { value: 'fruities', label: '🍓 Fruities' },
                    { value: 'gourmands', label: '🍰 Gourmands' },
                    { value: 'puffs', label: '💨 Puffs' },
                    { value: 'coils', label: '🔧 Coils' },
                    { value: 'mesh', label: '🕸️ Mesh' }
                  ]}
                />
              </div>

              <div className="form-field relative">
                <label className="form-label">Product</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                        setSaleForm({...saleForm, product: e.target.value})
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Search products..."
                      className="form-input pl-10"
                      required
                    />
                  </div>
                  
                  {showProductDropdown && displayProducts.length > 0 && (
                    <div className="product-dropdown">
                      {displayProducts.slice(0, 8).map((item) => {
                        const product = item.item || item
                        const matchType = item.matchType
                        const similarity = item.similarity
                        
                        return (
                          <div
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            className={`product-option ${
                              similarity > 0.8 ? 'high-similarity' :
                              similarity > 0.6 ? 'medium-similarity' : 'low-similarity'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-gray-500">
                                  {product.category} • {formatCurrency(product.price)}
                                  {matchType && (
                                    <span className="ml-2 text-blue-600">
                                      {matchType === 'exact' ? '✓ Exact' :
                                       matchType === 'startsWith' ? '→ Starts with' :
                                       matchType === 'contains' ? '⊃ Contains' :
                                       matchType === 'wordMatch' ? '≈ Word match' : '∼ Similar'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-field">
                {['fruities', 'gourmands'].includes(saleForm.category) ? (
                  <Input
                    label="Amount (ml)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={saleForm.ml_amount}
                    onChange={(e) => setSaleForm({...saleForm, ml_amount: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g., 30, 60"
                    className="form-input"
                    required
                  />
                ) : (
                  <Input
                    label="Quantity"
                    type="number"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    className="form-input"
                    required
                  />
                )}
              </div>

              <div className="form-field">
                <Input
                  label="Price (TND)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={saleForm.price}
                  onChange={(e) => setSaleForm({...saleForm, price: e.target.value})}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0.00"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {productSearch && displayProducts.length === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="text-sm sm:text-base font-semibold text-gray-800">
                  No products found matching "{productSearch}"
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Try adjusting your search or select a different category
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !saleForm.product || !saleForm.price || 
                (['fruities', 'gourmands'].includes(saleForm.category) ? !saleForm.ml_amount : !saleForm.quantity)}
              className="worker-button w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Recording...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Record Sale</span>
                </div>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-yellow-700 font-medium">Start a shift to record sales</p>
              <p className="text-xs sm:text-sm text-yellow-600 mt-1">You need an active shift to process transactions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordSale
