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
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after a short delay if not dismissed and not standalone
      if (!dismissed && !standalone) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000) // Show after 3 seconds
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
      >
        {/* Modal */}
        <div 
          className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl transform transition-all duration-300 ease-out"
          style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border-primary)',
            boxShadow: 'var(--shadow-2xl)'
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
          <div className="relative p-6 pb-4">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-primary)'
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

            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Add to Home Screen
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Install Vape Store Manager
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="space-y-4 mb-6">
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
