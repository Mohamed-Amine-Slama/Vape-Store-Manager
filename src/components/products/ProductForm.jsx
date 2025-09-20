import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, CategoryDropdown, AddButton } from '../ui'
import { Package, Save, X, AlertCircle } from 'lucide-react'
import './ProductForm.css'

const ProductForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categories,
  validateProduct,
  loading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'fruities'
  })
  const [errors, setErrors] = useState({})

  // Initialize form when modal opens or editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name || '',
          category: editingProduct.category || 'fruities'
        })
      } else {
        setFormData({
          name: '',
          category: 'fruities'
        })
      }
      setErrors({})
    }
  }, [isOpen, editingProduct])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateProduct(formData, editingProduct?.id)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Submit form
    const result = await onSubmit(formData)
    if (result.success) {
      onClose()
    } else {
      setErrors({ submit: result.error })
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      fruities: '#ec4899',
      gourmands: '#f59e0b',
      puffs: '#a855f7',
      coils: '#3b82f6',
      mesh: '#10b981'
    }
    return colors[category] || '#6b7280'
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md"
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name..."
              className={`w-full ${errors.name ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.name && (
              <div className="mt-1 flex items-center space-x-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Category */}
          <CategoryDropdown
            label="Category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            error={errors.category}
            options={categories}
            placeholder="Choose a product category"
          />

          {/* Category Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getCategoryColor(formData.category) }}
              />
              <span className="text-sm font-medium text-gray-700">
                {categories.find(c => c.value === formData.category)?.label || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.name || 'Product name will appear here'}
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <AddButton
              type="submit"
              className="flex-1"
              disabled={loading || !formData.name.trim()}
              loading={loading}
              icon={editingProduct ? <Save /> : <Package />}
              variant={editingProduct ? "secondary" : "primary"}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </AddButton>
          </div>
        </form>

        {/* Info Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700">Note:</p>
              <p>Products are created with a default price of 0.00 TND. You can update pricing through the inventory management system.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProductForm
