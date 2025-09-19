import React from 'react'
import { Button } from '../ui'
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'

const ReportsHeader = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  loading,
  lastRefresh,
  onRefresh,
  onExport,
  isMobile
}) => {
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const viewModes = [
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'daily', label: 'Daily Reports', icon: Calendar },
    { id: 'monthly', label: 'Monthly Summary', icon: Calendar }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'} mb-6`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Historical Reports</h1>
          <p className="text-gray-600">
            View detailed sales reports and analytics
            {lastRefresh && (
              <span className="ml-2 text-sm text-gray-500">
                • Last updated {formatDateTime(lastRefresh)}
              </span>
            )}
          </p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-3'}`}>
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation and View Mode */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
        {/* Month Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigateMonth(-1)}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <p className="text-sm text-gray-500">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long'
              })}
            </p>
          </div>
          
          <Button
            onClick={() => navigateMonth(1)}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode Selector */}
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
          {viewModes.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              variant={viewMode === mode.id ? 'primary' : 'outline'}
              size="sm"
              className="flex items-center space-x-2"
            >
              <mode.icon className="h-4 w-4" />
              <span>{isMobile ? mode.label : mode.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReportsHeader
