import React, { useState } from 'react'
import { formatCurrency } from '../../lib/utils'
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react'
import DayReportsPopup from './DayReportsPopup'
import './CalendarView.css'

const CalendarView = ({ 
  currentDate, 
  availableDates, 
  dailyReports, 
  onDateSelect, 
  selectedDate,
  isMobile,
  loadDailyProductBreakdown,
  productBreakdown,
  loadingProductBreakdown
}) => {
  const [showPopup, setShowPopup] = useState(false)
  const [popupDate, setPopupDate] = useState(null)
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Start from the first Sunday before or on the first day
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())
    
    // End on the last Saturday after or on the last day
    const endDate = new Date(lastDay)
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
    
    const days = []
    const currentDay = new Date(startDate)
    
    while (currentDay <= endDate) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const currentMonth = currentDate.getMonth()
  const today = new Date()

  // Helper function to format date safely without timezone issues
  const formatDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get report data for a specific date
  const getReportForDate = (date) => {
    const dateString = formatDateString(date)
    return dailyReports.find(report => report.report_date === dateString)
  }

  // Check if date has data
  const hasData = (date) => {
    const dateString = formatDateString(date)
    return availableDates.includes(dateString)
  }

  // Get performance level for styling
  const getPerformanceLevel = (total) => {
    if (total >= 1000) return 'excellent'
    if (total >= 500) return 'good'
    if (total >= 100) return 'average'
    return 'low'
  }

  const performanceStyles = {
    excellent: 'bg-green-100 border-green-300 text-green-800',
    good: 'bg-blue-100 border-blue-300 text-blue-800',
    average: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-red-100 border-red-300 text-red-800'
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-blue-800">Sales Calendar</h3>
        </div>
        
        {/* Week day headers */}
        <div className="calendar-header-grid text-sm">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {isMobile ? day.charAt(0) : day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
        <div className="calendar-grid">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth
            const isToday = date.toDateString() === today.toDateString()
            const isSelected = selectedDate && date.toDateString() === new Date(selectedDate).toDateString()
            const report = getReportForDate(date)
            const hasReportData = hasData(date)
            
            return (
              <div
                key={index}
                onClick={() => {
                  if (hasReportData) {
                    const dateString = formatDateString(date)
                    setPopupDate(dateString)
                    setShowPopup(true)
                    onDateSelect(dateString)
                  }
                }}
                className={`
                  calendar-cell p-2
                  border rounded-lg cursor-pointer transition-all duration-200
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                  ${isSelected ? 'ring-2 ring-purple-400 bg-purple-50' : ''}
                  ${hasReportData ? 
                    'hover:bg-blue-100 hover:border-blue-400 hover:shadow-lg hover:scale-105 border-gray-300 hover:ring-2 hover:ring-blue-200' : 
                    'border-gray-200 cursor-not-allowed hover:bg-gray-100'
                  }
                  ${report ? performanceStyles[getPerformanceLevel(report.daily_total)] : ''}
                `}
              >
                <div className="h-full flex flex-col justify-center items-center min-h-[60px]">
                  {/* Date number */}
                  <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-center leading-none mb-1`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Report data */}
                  {report && !isMobile && (
                    <div className="text-xs text-center space-y-1">
                      <div className="font-bold">
                        {formatCurrency(report.daily_total)}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{(report.shift1_transaction_count || 0) + (report.shift2_transaction_count || 0)}</span>
                        </span>
                        {report.daily_total >= 1000 && (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile indicator */}
                  {report && isMobile && (
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-current mx-auto"></div>
                    </div>
                  )}
                  
                  {/* No data indicator */}
                  {!hasReportData && isCurrentMonth && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className={`bg-gray-50 border-t border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Performance Legend:</h4>
        </div>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-4'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300 flex-shrink-0"></div>
            <span className="text-gray-600">{isMobile ? 'Excellent' : 'Excellent (≥1000 TND)'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300 flex-shrink-0"></div>
            <span className="text-gray-600">{isMobile ? 'Good' : 'Good (≥500 TND)'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 flex-shrink-0"></div>
            <span className="text-gray-600">{isMobile ? 'Average' : 'Average (≥100 TND)'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300 flex-shrink-0"></div>
            <span className="text-gray-600">{isMobile ? 'Low' : 'Low (<100 TND)'}</span>
          </div>
        </div>
        
        {/* Additional info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center justify-between'} text-xs text-gray-500`}>
            <span>{isMobile ? 'Tap highlighted dates for details' : 'Click on any highlighted date to view detailed breakdown'}</span>
            <span>{availableDates.length} days with data this month</span>
          </div>
        </div>
      </div>

      {/* Day Reports Popup */}
      <DayReportsPopup
        isOpen={showPopup}
        selectedDate={popupDate}
        onClose={() => {
          setShowPopup(false)
          setPopupDate(null)
        }}
        loadDailyProductBreakdown={loadDailyProductBreakdown}
        productBreakdown={productBreakdown}
        loadingProductBreakdown={loadingProductBreakdown}
      />
    </div>
  )
}

export default CalendarView
