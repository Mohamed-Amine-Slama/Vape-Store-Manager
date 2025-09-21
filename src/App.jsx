import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Worker from './pages/Worker'
import Admin from './pages/Admin'
import InstallPrompt from './components/ui/InstallPrompt'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/worker'} replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/worker'} replace /> : <Login />} 
      />
      <Route
        path="/worker"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <Worker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/worker'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('PWA: Service Worker registered successfully:', registration.scope)
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('PWA: New content available, please refresh')
                    // Show update notification
                    showUpdateNotification()
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.log('PWA: Service Worker registration failed:', error)
          })
      })
    }

    // Handle app updates
    let refreshing = false
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload()
        refreshing = true
      }
    })
  }, [])

  const showUpdateNotification = () => {
    // Create update notification
    const updateDiv = document.createElement('div')
    updateDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--accent-vapor) 0%, var(--accent-purple) 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: 600;
        cursor: pointer;
        animation: slideIn 0.3s ease-out;
      " onclick="window.location.reload()">
        🔄 New version available! Click to update
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `
    
    document.body.appendChild(updateDiv)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      updateDiv.remove()
    }, 10000)
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <InstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
