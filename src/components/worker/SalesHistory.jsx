import React from 'react'
import { DollarSign } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../lib/utils'

const SalesHistory = ({ sales }) => {
  if (sales.length === 0) return null

  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Today's Sales</h2>
            <p className="text-xs sm:text-sm text-gray-600">{sales.length} transactions recorded</p>
          </div>
        </div>
      </div>

      <div className="worker-card-content">
        <div className="sales-table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Amount</th>
                <th>Price</th>
                <th className="hidden sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <div className="font-medium text-gray-900">{sale.product}</div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      {formatDateTime(sale.created_at)}
                    </div>
                  </td>
                  <td className="font-semibold">
                    {sale.ml_amount ? (
                      <span className="text-blue-600">{sale.ml_amount}ml</span>
                    ) : (
                      <span className="text-purple-600">{sale.quantity} pcs</span>
                    )}
                  </td>
                  <td className="font-bold text-green-600">
                    {formatCurrency(sale.price)}
                  </td>
                  <td className="hidden sm:table-cell text-gray-500">
                    {formatDateTime(sale.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalesHistory
