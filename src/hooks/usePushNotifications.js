import { useState, useEffect, useCallback } from 'react'
import pushNotificationService from '../services/pushNotificationService'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize push notification status
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const status = await pushNotificationService.getSubscriptionStatus()
        
        setIsSupported(status.isSupported)
        setPermission(status.permission)
        setIsSubscribed(status.isSubscribed)
        setSubscription(status.subscription)

      } catch (err) {
        console.error('Error initializing push notifications:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializePushNotifications()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const newSubscription = await pushNotificationService.subscribe()
      
      setIsSubscribed(true)
      setSubscription(newSubscription)
      setPermission('granted')

      return newSubscription
    } catch (err) {
      console.error('Error subscribing to push notifications:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await pushNotificationService.unsubscribe()
      
      setIsSubscribed(false)
      setSubscription(null)

    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await pushNotificationService.sendLocalNotification(
        'Test Notification',
        {
          body: 'This is a test notification from Vape Store Manager',
          data: {
            type: 'test',
            url: '/admin'
          }
        }
      )
    } catch (err) {
      console.error('Error sending test notification:', err)
      setError(err.message)
      throw err
    }
  }, [])

  // Send admin notification
  const sendAdminNotification = useCallback(async (notificationData) => {
    try {
      await pushNotificationService.sendAdminNotification(notificationData)
    } catch (err) {
      console.error('Error sending admin notification:', err)
      setError(err.message)
      throw err
    }
  }, [])

  // Request permission only
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const newPermission = await pushNotificationService.requestPermission()
      setPermission(newPermission)

      return newPermission
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // Status
    isSupported,
    permission,
    isSubscribed,
    subscription,
    loading,
    error,
    
    // Actions
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
    sendAdminNotification,
    
    // Computed states
    canSubscribe: isSupported && permission === 'granted' && !isSubscribed,
    needsPermission: isSupported && permission === 'default',
    isBlocked: permission === 'denied'
  }
}
