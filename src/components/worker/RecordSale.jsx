import React, { useState, useEffect } from 'react'
import { Button, Input, CategoryDropdown, CustomDropdown } from '../ui'
import { Package, Search } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

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

  // Filter products based on category
  const filteredProducts = products.filter(product => {
    return !saleForm.category || product.category === saleForm.category
  })

  // Convert products to dropdown format
  const productOptions = filteredProducts.map(product => ({
    value: product.id,
    label: product.name,
    description: `${product.category} • ${formatCurrency(product.price)}`,
    category: product.category,
    price: product.price,
    ...product
  }))

  // Handle product selection
  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setSaleForm({
        ...saleForm,
        product: product.name,
        product_id: product.id,
        category: product.category,
        price: product.price?.toString() || ''
      })
    }
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
  }

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
                <CategoryDropdown
                  label="Category"
                  value={saleForm.category}
                  onChange={(e) => setSaleForm({...saleForm, category: e.target.value})}
                  className="form-input"
                  placeholder="Select Category"
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

              <div className="form-field">
                <CustomDropdown
                  label="Product"
                  options={productOptions}
                  value={saleForm.product_id}
                  onChange={handleProductSelect}
                  placeholder="Search and select product..."
                  icon={<Package />}
                  searchKey="label"
                  displayKey="label"
                  valueKey="value"
                  fuzzySearchEnabled={true}
                  maxResults={8}
                  clearable={true}
                  className="form-input"
                  noResultsText="No products found"
                />
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
