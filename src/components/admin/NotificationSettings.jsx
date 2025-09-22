import React, { useState } from 'react'
import { Bell, BellOff, Smartphone, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
    canSubscribe,
    needsPermission,
    isBlocked
  } = usePushNotifications()

  const [testLoading, setTestLoading] = useState(false)

  const handleSubscribe = async () => {
    try {
      await subscribe()
    } catch (error) {
      console.error('Failed to subscribe:', error)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    }
  }

  const handleRequestPermission = async () => {
    try {
      await requestPermission()
    } catch (error) {
      console.error('Failed to request permission:', error)
    }
  }

  const handleTestNotification = async () => {
    try {
      setTestLoading(true)
      await sendTestNotification()
    } catch (error) {
      console.error('Failed to send test notification:', error)
    } finally {
      setTestLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isSubscribed) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (isBlocked) return <XCircle className="w-5 h-5 text-red-500" />
    if (needsPermission) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <Bell className="w-5 h-5 text-gray-500" />
  }

  const getStatusText = () => {
    if (isSubscribed) return 'Push notifications enabled'
    if (isBlocked) return 'Push notifications blocked'
    if (needsPermission) return 'Permission required'
    return 'Push notifications disabled'
  }

  const getStatusColor = () => {
    if (isSubscribed) return 'var(--accent-success)'
    if (isBlocked) return 'var(--accent-cherry)'
    if (needsPermission) return 'var(--accent-warning)'
    return 'var(--text-muted)'
  }

  if (!isSupported) {
    return (
      <div 
        className="rounded-xl p-6 border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <BellOff className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Push Notifications
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Not supported on this device
            </p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Push notifications are not supported by your browser or device. 
          Please use a modern browser on a supported device to enable push notifications.
        </p>
      </div>
    )
  }

  return (
    <div 
      className="rounded-xl p-6 border"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Top accent border */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))',
        borderRadius: '12px 12px 0 0'
      }}></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Push Notifications
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Get notified on your phone when new notifications appear
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="rounded-lg p-3 mb-4 border"
          style={{
            background: 'var(--bg-error)',
            borderColor: 'var(--accent-cherry)',
            color: 'var(--accent-cherry)'
          }}
        >
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          className="rounded-lg p-4 border"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4" style={{ color: 'var(--accent-vapor)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Permission
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {permission === 'granted' ? 'Granted' : 
             permission === 'denied' ? 'Denied' : 'Not requested'}
          </p>
        </div>

        <div 
          className="rounded-lg p-4 border"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Subscription
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSubscribed ? 'Active' : 'Inactive'}
          </p>
        </div>

        <div 
          className="rounded-lg p-4 border"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Device
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSupported ? 'Supported' : 'Not supported'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {needsPermission && (
          <button
            onClick={handleRequestPermission}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--accent-warning) 0%, var(--accent-warning) 100%)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            {loading ? 'Requesting...' : 'Request Permission'}
          </button>
        )}

        {canSubscribe && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--accent-success) 0%, var(--accent-success) 100%)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            {loading ? 'Subscribing...' : 'Enable Notifications'}
          </button>
        )}

        {isSubscribed && (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 border"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-hover)'
              e.target.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-elevated)'
              e.target.style.color = 'var(--text-secondary)'
            }}
          >
            {loading ? 'Unsubscribing...' : 'Disable Notifications'}
          </button>
        )}

        {isSubscribed && (
          <button
            onClick={handleTestNotification}
            disabled={testLoading}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            {testLoading ? 'Sending...' : 'Send Test Notification'}
          </button>
        )}
      </div>

      {/* Help Text */}
      <div 
        className="mt-6 p-4 rounded-lg border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-secondary)'
        }}
      >
        <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          How it works
        </h4>
        <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>• Enable push notifications to receive alerts on your phone</li>
          <li>• You'll be notified when new notifications appear in the admin panel</li>
          <li>• Notifications work even when the app is closed</li>
          <li>• You can disable notifications at any time</li>
        </ul>
      </div>
    </div>
  )
}
