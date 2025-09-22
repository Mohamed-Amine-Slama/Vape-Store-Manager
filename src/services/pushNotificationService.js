// Push Notification Service
// Handles push notification subscriptions and sending notifications

class PushNotificationService {
  constructor() {
    this.vapidPublicKey = null // Will be set from environment or generated
    this.subscription = null
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Check if push notifications are supported
  isNotificationSupported() {
    return this.isSupported && 'Notification' in window
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isNotificationSupported()) {
      throw new Error('Push notifications are not supported')
    }

    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    return permission
  }

  // Generate VAPID keys (for development - in production, use server-generated keys)
  generateVapidKeys() {
    // For development, we'll use a mock VAPID key
    // In production, you should generate proper VAPID keys on your server
    const mockVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqIUHI80NqI'
    this.vapidPublicKey = mockVapidKey
    return mockVapidKey
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      // Request permission first
      await this.requestPermission()

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Generate or get VAPID key
      if (!this.vapidPublicKey) {
        this.generateVapidKeys()
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      this.subscription = subscription
      console.log('Push notification subscription:', subscription)

      // Store subscription in localStorage for persistence
      localStorage.setItem('push-subscription', JSON.stringify(subscription))
      
      // In a real app, you would send this subscription to your server
      // await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      throw error
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
        localStorage.removeItem('push-subscription')
        console.log('Unsubscribed from push notifications')
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      throw error
    }
  }

  // Get existing subscription
  async getSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        this.subscription = subscription
        localStorage.setItem('push-subscription', JSON.stringify(subscription))
      } else {
        // Try to restore from localStorage
        const storedSubscription = localStorage.getItem('push-subscription')
        if (storedSubscription) {
          this.subscription = JSON.parse(storedSubscription)
        }
      }

      return this.subscription
    } catch (error) {
      console.error('Error getting push subscription:', error)
      return null
    }
  }

  // Send a local notification (for testing/demo purposes)
  async sendLocalNotification(title, options = {}) {
    try {
      if (!this.isNotificationSupported()) {
        throw new Error('Notifications not supported')
      }

      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted')
      }

      const notificationOptions = {
        body: 'New notification from Vape Store Manager',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'vape-store-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          url: '/admin',
          timestamp: Date.now()
        },
        ...options
      }

      // For demo purposes, we'll trigger the service worker push event
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        // Show notification directly through service worker
        await registration.showNotification(title, notificationOptions)
      } else {
        // Fallback to regular notification
        new Notification(title, notificationOptions)
      }

    } catch (error) {
      console.error('Error sending local notification:', error)
      throw error
    }
  }

  // Send notification to admin (for demo - simulates server-side push)
  async sendAdminNotification(notificationData) {
    try {
      const { title, body, type, storeId, data } = notificationData

      const notificationOptions = {
        body: body || 'New notification received',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `vape-store-${type || 'general'}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          url: '/admin',
          type,
          storeId,
          timestamp: Date.now(),
          ...data
        }
      }

      await this.sendLocalNotification(title, notificationOptions)
      
      console.log('Admin notification sent:', { title, body, type })
    } catch (error) {
      console.error('Error sending admin notification:', error)
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Check subscription status
  async getSubscriptionStatus() {
    const subscription = await this.getSubscription()
    const permission = Notification.permission
    
    return {
      isSupported: this.isNotificationSupported(),
      permission,
      isSubscribed: !!subscription,
      subscription
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService()

export default pushNotificationService
