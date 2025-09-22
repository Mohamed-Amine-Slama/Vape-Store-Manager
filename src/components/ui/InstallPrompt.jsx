import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor, Zap } from 'lucide-react'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true
    setIsStandalone(standalone)

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    setHasBeenDismissed(dismissed === 'true')

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired - using custom install prompt')
      // Prevent the default browser install prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
      
      // Show our custom prompt after a short delay if not dismissed and not standalone
      if (!dismissed && !standalone) {
        setTimeout(() => {
          console.log('PWA: Showing custom install prompt')
          setShowPrompt(true)
        }, 5000) // Show after 5 seconds to allow loading screen to finish
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed')
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Show success message
      showInstallSuccessMessage()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // For iOS, show prompt if not standalone and not dismissed
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return
    }

    if (isIOS) {
      // For iOS, just show instructions
      return
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`PWA: User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
      } else {
        console.log('PWA: User dismissed the install prompt')
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowPrompt(false)
      
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    setHasBeenDismissed(true)
  }

  const showInstallSuccessMessage = () => {
    // Create a temporary success message
    const successDiv = document.createElement('div')
    successDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--accent-success) 0%, var(--accent-vapor) 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
      ">
        🎉 App installed successfully!
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `
    
    document.body.appendChild(successDiv)
    
    setTimeout(() => {
      successDiv.remove()
    }, 4000)
  }

  // Don't show if already installed, dismissed, or conditions not met
  if (isStandalone || hasBeenDismissed || !showPrompt) {
    return null
  }

  return (
    <>
      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(20px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
        `}
      </style>
      
      {/* Backdrop */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Modal */}
        <div 
          style={{
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '2px solid var(--border-primary)',
            boxShadow: 'var(--shadow-2xl)',
            position: 'relative',
            zIndex: 10001,
            animation: 'slideUp 0.4s ease-out'
          }}
        >
          {/* Top accent border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, var(--accent-vapor), var(--accent-purple))' 
          }}></div>

          {/* Header */}
          <div style={{ position: 'relative', padding: '24px 24px 16px 24px' }}>
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--text-primary)'
                e.target.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--text-muted)'
                e.target.style.background = 'var(--bg-elevated)'
              }}
            >
              <X className="h-4 w-4" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div 
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <Smartphone style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  Add to Home Screen
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)', 
                  margin: 0 
                }}>
                  Install Vape Store Manager
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--bg-success)' }}
                >
                  <Zap className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Instant Access
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Launch directly from your home screen like a native app
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--bg-warning)' }}
                >
                  <Monitor className="h-4 w-4" style={{ color: 'var(--accent-warning)' }} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Full Screen Experience
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    No browser bars, just your app in full screen
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <Download className="h-4 w-4" style={{ color: 'var(--accent-vapor)' }} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Works Offline
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Access your data even without internet connection
                  </p>
                </div>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  To install on iOS:
                </p>
                <ol className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>1. Tap the Share button in Safari</li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 border"
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
                Maybe Later
              </button>
              
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 text-white flex items-center justify-center space-x-2"
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
                <Download className="h-4 w-4" />
                <span>{isIOS ? 'Instructions' : 'Install App'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InstallPrompt
