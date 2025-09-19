import React from 'react'
import { Button } from '../ui'
import { Store, LogOut } from 'lucide-react'

const WorkerHeader = ({ user, storeInfo, onLogout }) => {
  return (
    <div className="worker-header">
      <div className="worker-header-content max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Worker Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {user.name} • {storeInfo?.name || 'Loading...'}
              </p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="worker-button flex items-center space-x-2 border-2 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 font-semibold transition-all duration-300"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default WorkerHeader
