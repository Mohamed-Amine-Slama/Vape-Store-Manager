import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { Bell, X, CheckCircle, Trash2, Calendar, CheckSquare, Square, AlertTriangle, Clock, DollarSign, Package2, Users, TrendingUp } from 'lucide-react'
import './NotificationsPopup.css'

export default function NotificationsPopup({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, shift, transaction
  const [selectedNotifications, setSelectedNotifications] = useState([])
  const subscriptionRef = useRef(null)
  const [processingIds, setProcessingIds] = useState(new Set())

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
      
      // Clean up any existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      
      // Set up real-time subscription for new notifications with duplicate prevention
      subscriptionRef.current = supabase
        .channel('notifications_' + Date.now()) // Unique channel name
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            setNotifications(prev => {
              // Check if notification already exists to prevent duplicates
              const exists = prev.some(notif => notif.id === payload.new.id)
              if (exists) {
                return prev
              }
              return [payload.new, ...prev]
            })
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications' },
          (payload) => {
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === payload.new.id ? payload.new : notif
              )
            )
          }
        )
        .subscribe()
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          store:stores(name, location),
          user:store_users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        throw error
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds) => {
    try {
      // Prevent duplicate processing
      const newProcessingIds = new Set(processingIds)
      const idsToProcess = notificationIds.filter(id => !newProcessingIds.has(id))
      
      if (idsToProcess.length === 0) {
        return
      }
      
      // Add to processing set
      idsToProcess.forEach(id => newProcessingIds.add(id))
      setProcessingIds(newProcessingIds)
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', idsToProcess)

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Successfully marked as read in database')
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          idsToProcess.includes(notif.id)
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      )
      setSelectedNotifications([])
      
      // Remove from processing set
      setTimeout(() => {
        setProcessingIds(prev => {
          const updated = new Set(prev)
          idsToProcess.forEach(id => updated.delete(id))
          return updated
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      // Remove from processing set on error
      setProcessingIds(prev => {
        const updated = new Set(prev)
        notificationIds.forEach(id => updated.delete(id))
        return updated
      })
    }
  }

  const deleteNotifications = async (notificationIds) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)

      if (error) throw error

      setNotifications(prev =>
        prev.filter(notif => !notificationIds.includes(notif.id))
      )
      setSelectedNotifications([])
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'shift_start':
        return <Clock className="h-4 w-4 text-teal-600" />
      case 'shift_end':
        return <Clock className="h-4 w-4 text-teal-600" />
      case 'salary_advance':
        return <DollarSign className="h-4 w-4 text-emerald-600" />
      case 'product_consumption':
        return <Package2 className="h-4 w-4 text-blue-600" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type, priority = 'medium') => {
    // Minimal, professional color scheme
    const colors = {
      shift_start: 'bg-slate-50 text-slate-700 border-slate-200',
      shift_end: 'bg-slate-50 text-slate-700 border-slate-200',
      salary_advance: 'bg-slate-50 text-slate-700 border-slate-200',
      product_consumption: 'bg-slate-50 text-slate-700 border-slate-200',
      sale: 'bg-slate-50 text-slate-700 border-slate-200',
      alert: priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200',
      default: 'bg-slate-50 text-slate-700 border-slate-200'
    }
    return colors[type] || colors.default
  }

  const formatNotificationMessage = (notification) => {
    const { type, data, user } = notification
    const userName = user?.name || 'Unknown User'
    const storeName = notification.store?.name || 'Unknown Store'

    switch (type) {
      case 'shift_start':
        return `${userName} started their shift at ${storeName}`
      case 'shift_end':
        return `${userName} ended their shift at ${storeName}${data?.total_sales ? ` with ${formatCurrency(data.total_sales)} in sales` : ''}`
      case 'salary_advance':
        // Use the original message from the database trigger instead of generating a new one
        return notification.message || `${userName} requested a salary advance of ${formatCurrency(data?.amount || 0)} at ${storeName}`
      case 'product_consumption':
        return `${userName} consumed ${data?.product_name || 'product'}${data?.ml_amount ? ` (${data.ml_amount}ml)` : data?.quantity ? ` (×${data.quantity})` : ''} at ${storeName}`
      case 'sale':
        return `${userName} made a sale of ${formatCurrency(data?.amount || 0)} for ${data?.product_name || 'product'} at ${storeName}`
      case 'alert':
        return data?.message || 'System alert'
      default:
        return notification.message || 'New notification'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'shift') return ['shift_start', 'shift_end'].includes(notif.type)
    if (filter === 'transaction') return ['salary_advance', 'product_consumption'].includes(notif.type)
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!isOpen) {
    return null
  }

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-start justify-end p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'auto',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="relative w-full max-w-md max-h-[95vh] overflow-hidden animate-slide-in-right"
        style={{
          position: 'relative',
          zIndex: 9999,
          maxWidth: '420px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.2)'
        }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
                }}
              >
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">Stay updated with your store</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <div 
                  className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  {unreadCount} new
                </div>
              )}
              <button
                onClick={onClose}
                className="p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 hover:scale-105"
                style={{
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid rgba(107, 114, 128, 0.2)'
                }}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-3 mt-6">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'shift', label: 'Shifts', count: notifications.filter(n => ['shift_start', 'shift_end'].includes(n.type)).length },
              { key: 'transaction', label: 'Transactions', count: notifications.filter(n => ['salary_advance', 'product_consumption'].includes(n.type)).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  filter === tab.key ? 'text-teal-700 bg-teal-50 shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                style={filter === tab.key ? {
                  border: '1px solid rgba(15, 118, 110, 0.2)',
                  boxShadow: '0 2px 4px rgba(15, 118, 110, 0.1)'
                } : {
                  border: '1px solid rgba(229, 231, 235, 0.8)'
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span 
                    className={`ml-2.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                      filter === tab.key 
                        ? 'bg-teal-100 text-teal-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        {selectedNotifications.length > 0 && (
          <div className="px-8 py-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedNotifications.length} selected
                </span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => markAsRead(selectedNotifications)}
                  disabled={processingIds.size > 0}
                  className="flex items-center space-x-2.5 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                    border: '1px solid rgba(15, 118, 110, 0.2)'
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark Read</span>
                </button>
                <button
                  onClick={() => deleteNotifications(selectedNotifications)}
                  className="flex items-center space-x-2.5 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    border: '1px solid rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)] notifications-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500 text-sm">
                {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                    selectedNotifications.includes(notification.id) ? 'bg-teal-50' : ''
                  }`}
                  style={{
                    borderLeft: !notification.is_read 
                      ? '4px solid #0d9488' 
                      : selectedNotifications.includes(notification.id)
                        ? '4px solid #0d9488'
                        : '4px solid transparent'
                  }}
                  onClick={() => {
                    if (selectedNotifications.includes(notification.id)) {
                      setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                    } else {
                      setSelectedNotifications(prev => [...prev, notification.id])
                    }
                  }}
                >
                  <div className="px-8 py-5">
                    <div className="flex items-start space-x-5">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        <div 
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            selectedNotifications.includes(notification.id) 
                              ? 'bg-teal-100 border border-teal-300 shadow-sm' 
                              : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {selectedNotifications.includes(notification.id) ? (
                            <CheckSquare className="h-4 w-4 text-teal-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Icon */}
                      <div 
                        className="flex-shrink-0 p-3.5 rounded-xl"
                        style={{
                          background: 'rgba(15, 118, 110, 0.1)',
                          border: '1px solid rgba(15, 118, 110, 0.2)',
                          boxShadow: '0 2px 4px rgba(15, 118, 110, 0.1)'
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                              {formatNotificationMessage(notification)}
                            </p>
                            
                            {/* Additional Details */}
                            {notification.data?.notes && (
                              <div 
                                className="mt-3 p-3 rounded-lg text-xs"
                                style={{
                                  background: 'rgba(15, 118, 110, 0.05)',
                                  border: '1px solid rgba(15, 118, 110, 0.15)',
                                  borderLeft: '3px solid #0d9488'
                                }}
                              >
                                <span className="font-medium text-teal-700">Note:</span>
                                <span className="text-gray-600 ml-2">{notification.data.notes}</span>
                              </div>
                            )}
                            
                            {/* Store and Time */}
                            <div className="flex items-center space-x-4 mt-4">
                              <div 
                                className="flex items-center space-x-2.5 px-4 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                              >
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateTime(notification.created_at)}</span>
                              </div>
                              {notification.store && (
                                <div 
                                  className="flex items-center space-x-2.5 px-4 py-2 rounded-full text-xs font-medium bg-teal-100 text-teal-700"
                                >
                                  <span>🏪</span>
                                  <span>{notification.store.name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            {notification.priority === 'high' && (
                              <div 
                                className="w-2 h-2 bg-red-500 rounded-full"
                              ></div>
                            )}
                            {!notification.is_read && (
                              <div 
                                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{
                                  background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                                  fontSize: '10px'
                                }}
                              >
                                NEW
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {filteredNotifications.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSelectedNotifications(filteredNotifications.map(n => n.id))}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                style={{
                  border: '1px solid rgba(229, 231, 235, 0.8)'
                }}
              >
                Select All
              </button>
              <div className="flex space-x-4">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead(notifications.filter(n => !n.is_read).map(n => n.id))}
                    disabled={processingIds.size > 0}
                    className="flex items-center space-x-2.5 px-6 py-3 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                      border: '1px solid rgba(15, 118, 110, 0.2)'
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark All Read ({unreadCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return modalContent
}

// CSS for slide-in animation (add to your global CSS or component styles)
const styles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
`
