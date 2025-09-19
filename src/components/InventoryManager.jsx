import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, Select, Badge } from './ui'
import { Package, Store, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { fuzzySearch } from '../lib/fuzzySearch'

export default function InventoryManager() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [inventory, setInventory] = useState([]) // [{store_id, store_name, stock_quantity, stock_ml}]
  const [adjustments, setAdjustments] = useState({}) // { [store_id]: { quantityDelta, mlDelta } }
  const [thresholds, setThresholds] = useState({}) // { [store_id]: { qty, ml } }
  const [movementType, setMovementType] = useState('restock') // restock | manual_adjustment
  const [message, setMessage] = useState(null)

  const isLiquid = useMemo(() => selectedProduct && ['fruities','gourmands'].includes(selectedProduct.category), [selectedProduct])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (!productSearch || products.length === 0) {
      setFilteredProducts([])
      return
    }
    const results = fuzzySearch(productSearch, products, { key: 'name', limit: 20 })
    setFilteredProducts(results.map(r => r.item))
  }, [productSearch, products])

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (!error) setProducts(data || [])
  }

  const loadInventory = async (productId) => {
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.rpc('get_inventory_for_product', { p_product_id: productId })
    if (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Failed to load inventory' })
    } else {
      setInventory(data || [])
      // Initialize empty adjustments
      const init = {}
      const threshInit = {}
      ;(data || []).forEach(row => {
        init[row.store_id] = { quantityDelta: '', mlDelta: '' }
        threshInit[row.store_id] = {
          qty: row.low_stock_threshold_quantity || 0,
          ml: row.low_stock_threshold_ml || 0
        }
      })
      setAdjustments(init)
      setThresholds(threshInit)
    }
    setLoading(false)
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setProductSearch(product.name)
    setShowProductDropdown(false)
    loadInventory(product.id)
  }

  const applyUpdates = async () => {
    if (!selectedProduct) return
    setLoading(true)
    setMessage(null)
    try {
      const updates = Object.entries(adjustments)
        .map(([store_id, vals]) => ({ store_id, quantityDelta: vals.quantityDelta, mlDelta: vals.mlDelta }))
        .filter(u => (isLiquid ? parseFloat(u.mlDelta || 0) : parseInt(u.quantityDelta || 0)) )

      for (const u of updates) {
        const p_delta_quantity = isLiquid ? 0 : parseInt(u.quantityDelta || 0)
        const p_delta_ml = isLiquid ? parseFloat(u.mlDelta || 0) : 0
        const { error } = await supabase.rpc('adjust_store_inventory', {
          p_store_id: u.store_id,
          p_product_id: selectedProduct.id,
          p_delta_quantity,
          p_delta_ml,
          p_notes: movementType === 'restock' ? 'Restock' : 'Manual adjustment',
          p_movement_type: movementType
        })
        if (error) throw error
      }
      setMessage({ type: 'success', text: 'Inventory updated successfully' })
      await loadInventory(selectedProduct.id)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to update inventory' })
    }
    setLoading(false)
  }

  const saveThresholds = async () => {
    if (!selectedProduct) return
    setLoading(true)
    setMessage(null)
    try {
      for (const row of inventory) {
        const t = thresholds[row.store_id] || { qty: 0, ml: 0 }
        const { error } = await supabase.rpc('set_inventory_thresholds', {
          p_store_id: row.store_id,
          p_product_id: selectedProduct.id,
          p_threshold_qty: isLiquid ? 0 : parseInt(t.qty || 0),
          p_threshold_ml: isLiquid ? parseFloat(t.ml || 0) : 0
        })
        if (error) throw error
      }
      setMessage({ type: 'success', text: 'Thresholds saved' })
      await loadInventory(selectedProduct.id)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Failed to save thresholds' })
    }
    setLoading(false)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Inventory Manager</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => selectedProduct && loadInventory(selectedProduct.id)} disabled={loading || !selectedProduct}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <Input
            label="Product"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Type to search product..."
            onFocus={() => setShowProductDropdown(true)}
            onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
          />
          {showProductDropdown && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleProductSelect(p)}
                >
                  <div className="font-medium text-gray-900 capitalize">{p.category} — {p.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-sm text-gray-600">Selected Product</div>
            <div className="font-semibold text-gray-900 capitalize">{selectedProduct.category} — {selectedProduct.name}</div>
            <div className="text-xs text-gray-500">Unit: {isLiquid ? 'ml' : 'pcs'}</div>
          </div>
        )}
      </div>

      {message && (
        <div className={`mb-3 text-sm flex items-center gap-2 ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {selectedProduct ? (
        <div className="space-y-4">
          {/* Movement type and actions */}
          {!isLiquid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-white">
              <div className="text-sm font-medium text-gray-700 mb-2">Adjustment Type</div>
              <Select
                label=""
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                options={[
                  { value: 'restock', label: 'Restock' },
                  { value: 'manual_adjustment', label: 'Manual Adjustment' }
                ]}
              />
              <div className="text-xs text-gray-500 mt-2">Apply deltas below per store, then click Apply Updates.</div>
            </div>
          </div>
          )}

          {isLiquid && (
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200 text-yellow-800">
              Inventory for liquid products (Fruities, Gourmands) is not tracked. Restock, transfer, and thresholds are disabled.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventory.map((row) => (
              <div key={row.store_id} className={`border rounded-lg p-4 bg-white ${
                (!isLiquid && (row.low_stock_threshold_quantity > 0 && Number(row.stock_quantity) < Number(row.low_stock_threshold_quantity)))
                  ? 'border-red-300 bg-red-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-blue-600" />
                    <div className="font-semibold text-gray-900">{row.store_name}</div>
                  </div>
                  <Badge variant={(!isLiquid && (row.low_stock_threshold_quantity > 0 && Number(row.stock_quantity) < Number(row.low_stock_threshold_quantity))) ? 'danger' : 'info'}>
                    {isLiquid ? 'Not tracked' : `${row.stock_quantity} pcs`}
                  </Badge>
                </div>
                {isLiquid ? (
                  <div className="text-xs text-gray-600">No restock controls for liquids.</div>
                ) : (
                  <Input
                    label="Add (pcs)"
                    type="number"
                    min="0"
                    value={adjustments[row.store_id]?.quantityDelta || ''}
                    onChange={(e) => setAdjustments({
                      ...adjustments,
                      [row.store_id]: { ...(adjustments[row.store_id] || {}), quantityDelta: e.target.value }
                    })}
                    placeholder="e.g. 10, 20"
                  />
                )}
                {!isLiquid && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    label="Low Stock (pcs)"
                    type="number"
                    min="0"
                    value={thresholds[row.store_id]?.qty ?? 0}
                    onChange={(e) => setThresholds({
                      ...thresholds,
                      [row.store_id]: { ...(thresholds[row.store_id] || {}), qty: e.target.value }
                    })}
                  />
                </div>
                )}
              </div>
            ))}
          </div>

          {!isLiquid && (
            <div className="flex justify-end">
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveThresholds} disabled={loading || inventory.length === 0}>
                  {loading ? 'Saving...' : 'Save Thresholds'}
                </Button>
                <Button onClick={applyUpdates} disabled={loading || inventory.length === 0}>
                  {loading ? 'Updating...' : 'Apply Updates'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Select a product to manage its inventory across stores.</div>
      )}
    </Card>
  )
}
