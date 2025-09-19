import React from 'react'
import { Button } from '../ui'
import { formatCurrency } from '../../lib/utils'
import { Edit, Trash2, Package, Tag, BarChart3, AlertTriangle } from 'lucide-react'

const ProductCard = ({
  product,
  categoryColors,
  getCategoryDotColor,
  onEdit,
  onDelete,
  onViewStock,
  isMobile
}) => {
  const getCategoryLabel = (category) => {
    const labels = {
      fruities: 'Fruities',
      gourmands: 'Gourmands',
      puffs: 'Puffs',
      coils: 'Coils',
      mesh: 'Mesh'
    }
    return labels[category] || category
  }


  return (
    <div className={`
      bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden 
      hover:shadow-xl transition-all duration-300 hover:scale-[1.02]
      ${isMobile ? 'mb-4' : 'mb-6'}
    `}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getCategoryDotColor(product.category) }}
              />
              <span className={`
                px-3 py-1 rounded-full text-xs font-semibold border
                ${categoryColors[product.category] || 'bg-gray-100 text-gray-700 border-gray-200'}
              `}>
                {getCategoryLabel(product.category)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">
              Product ID: {product.id.slice(0, 8)}...
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(product.price || 0)}
            </div>
            <div className="text-xs text-gray-500">
              Base Price
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Stats */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-4'} mb-4`}>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <Tag className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Category</span>
            </div>
            <div className="text-sm font-bold text-blue-700">
              {getCategoryLabel(product.category)}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Price</span>
            </div>
            <div className="text-sm font-bold text-green-700">
              {formatCurrency(product.price || 0)}
            </div>
          </div>

          {!isMobile && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">Status</span>
              </div>
              <div className="text-sm font-bold text-purple-700">
                {product.price > 0 ? 'Active' : 'Setup Needed'}
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Product Information</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium">{getCategoryLabel(product.category)}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span className="font-medium text-green-600">{formatCurrency(product.price || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-medium ${product.price > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {product.price > 0 ? 'Ready for Sale' : 'Needs Price Setup'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-3'}`}>
          <Button
            onClick={() => onViewStock(product)}
            variant="outline"
            size="sm"
            className="flex items-center justify-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>View Stock</span>
          </Button>
          
          <Button
            onClick={() => onEdit(product)}
            variant="outline"
            size="sm"
            className="flex items-center justify-center space-x-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          
          <Button
            onClick={() => onDelete(product)}
            variant="outline"
            size="sm"
            className="flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`
        h-1 w-full
        ${product.price > 0 ? 'bg-green-400' : 'bg-orange-400'}
      `} />
    </div>
  )
}

export default ProductCard
