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
    <div 
      className={`rounded-xl overflow-hidden relative transition-all duration-300 ${isMobile ? 'mb-4' : 'mb-6'}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-primary)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = 'var(--shadow-lg)'
      }}
    >
      {/* Top accent border */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))' 
      }}></div>
      {/* Header */}
      <div className="p-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-secondary)' }}>
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
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Product ID: {product.id.slice(0, 8)}...
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-success)' }}>
              {formatCurrency(product.price || 0)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Base Price
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product Stats */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-4'} mb-6`}>
          <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-vapor), #60A5FA)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-vapor), #60A5FA)' }}>
                <Tag className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {getCategoryLabel(product.category)}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Category</div>
          </div>

          <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-success), #34D399)' }}></div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-success), #34D399)' }}>
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(product.price || 0)}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Price</div>
          </div>

          {!isMobile && (
            <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-purple), #A78BFA)' }}></div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-purple), #A78BFA)' }}>
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {product.price > 0 ? 'Active' : 'Setup Needed'}
              </div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Status</div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="rounded-xl p-4 mb-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-warning), #FBBF24)' }}></div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Product Information</h4>
          <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(product.category)}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span className="font-medium" style={{ color: 'var(--accent-success)' }}>{formatCurrency(product.price || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium" style={{ color: product.price > 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                {product.price > 0 ? 'Ready for Sale' : 'Needs Price Setup'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-3'}`}>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onViewStock(product)
            }}
            variant="outline"
            size="sm"
            className="flex items-center justify-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>View Stock</span>
          </Button>
          
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(product)
            }}
            variant="outline"
            size="sm"
            className="flex items-center justify-center space-x-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(product)
            }}
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
      <div 
        className="h-1 w-full"
        style={{
          backgroundColor: product.price > 0 ? 'var(--accent-success)' : 'var(--accent-warning)'
        }}
      />
    </div>
  )
}

export default ProductCard
