import React from 'react'
import { Modal, Button } from '../ui'
import { formatCurrency } from '../../lib/utils'
import { Package, X, RefreshCw, AlertCircle, BarChart3, Store, AlertTriangle } from 'lucide-react'

const StockModal = ({
  stockModal,
  onClose,
  onRefresh,
  getCategoryDotColor
}) => {
  const { open, product, inventory, loading, error } = stockModal

  if (!product) return null

  // Helper function to get stock display info based on product category
  const getStockInfo = (item, product) => {
    const { category } = product
    
    // For liquid products (fruities, gourmands), show ml
    if (category === 'fruities' || category === 'gourmands') {
      const currentStock = item.stock_ml || 0
      const threshold = item.low_stock_threshold_ml || 0
      const isLowStock = currentStock <= threshold && threshold > 0
      return {
        value: currentStock,
        unit: 'ml',
        isLowStock,
        display: `${currentStock.toFixed(1)} ml`,
        threshold: threshold
      }
    }
    
    // For solid products (puffs, coils, mesh), show quantity
    const currentStock = item.stock_quantity || 0
    const threshold = item.low_stock_threshold_quantity || 0
    const isLowStock = currentStock <= threshold && threshold > 0
    return {
      value: currentStock,
      unit: 'pcs',
      isLowStock,
      display: `${currentStock} pcs`,
      threshold: threshold
    }
  }

  const getTotalStock = () => {
    if (!inventory.length) return 0
    
    // Sum based on product category
    if (product.category === 'fruities' || product.category === 'gourmands') {
      return inventory.reduce((total, item) => total + (item.stock_ml || 0), 0)
    }
    return inventory.reduce((total, item) => total + (item.stock_quantity || 0), 0)
  }

  const getStockStatus = (stockInfo) => {
    if (stockInfo.value === 0) return { status: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle }
    if (stockInfo.isLowStock) return { status: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle }
    return { status: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: Package }
  }

  return (
    <Modal isOpen={open} onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Stock Information</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryDotColor(product.category) }}
                  />
                  <p className="text-blue-100 text-sm">{product.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-5 w-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading stock information...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800">Error Loading Stock</h3>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <Button
                onClick={onRefresh}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Stock</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {getTotalStock().toFixed(product.category === 'fruities' || product.category === 'gourmands' ? 1 : 0)} {product.category === 'fruities' || product.category === 'gourmands' ? 'ml' : 'pcs'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">Product Price</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(product.price || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">Stores</p>
                      <p className="text-2xl font-bold text-purple-700">{inventory.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock by Store */}
              {inventory.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Store</h3>
                  <div className="space-y-3">
                    {inventory.map((item, index) => {
                      const stockInfo = getStockInfo(item, product)
                      const statusInfo = getStockStatus(stockInfo)
                      const StatusIcon = statusInfo.icon
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Store className="h-4 w-4 text-gray-600" />
                                <h4 className="font-semibold text-gray-900">
                                  {item.store_name || 'Unknown Store'}
                                </h4>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {stockInfo.display}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Low Stock Threshold</p>
                                  <p className="text-sm font-medium text-gray-600">
                                    {stockInfo.threshold > 0 ? `${stockInfo.threshold} ${stockInfo.unit}` : 'Not set'}
                                  </p>
                                </div>
                              </div>

                              {product.category === 'fruities' || product.category === 'gourmands' ? (
                                <div className="text-xs text-gray-500">
                                  Liquid product - Stock measured in milliliters (ml)
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">
                                  Solid product - Stock measured in pieces (pcs)
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className={`
                                px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1
                                ${statusInfo.bg} ${statusInfo.color}
                              `}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusInfo.status}</span>
                              </div>
                              {stockInfo.isLowStock && (
                                <p className="text-xs text-orange-600 mt-1 font-medium">
                                  ⚠️ Below threshold
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Information</h3>
                  <p className="text-gray-600 mb-4">
                    This product doesn't have any stock records in our system yet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Stock information will appear here once inventory is added through the inventory management system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span>Stock levels are updated in real-time from inventory management</span>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default StockModal
