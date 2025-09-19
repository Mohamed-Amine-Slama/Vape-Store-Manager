import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkerDashboard } from '../hooks'
import { useFD } from '../hooks/useFD'
import {
  WorkerHeader,
  TodayShifts,
  NavigationTabs,
  RecordSale,
  ShiftControl,
  SalesHistory,
  TodayFD
} from '../components/worker'
import WorkerTransactions from '../components/WorkerTransactions'
import FDInputPopup from '../components/FDInputPopup'
import './Worker.css'

const Worker = () => {
  const { user, logout } = useAuth()
  const [showFDPopup, setShowFDPopup] = useState(false)
  
  const {
    // State
    storeInfo,
    todayShifts,
    currentShift,
    shiftTargets,
    shiftNumber,
    shiftTime,
    sales,
    shiftTotal,
    products,
    workerCompletedToday,
    loading,
    activeTab,
    
    // Actions
    setActiveTab,
    startShift,
    endShift,
    submitSale,
    loadData
  } = useWorkerDashboard(user)

  const { setFDForTomorrow, todayFD, loading: fdLoading } = useFD(storeInfo?.id)

  // Handle FD submission
  const handleFDSubmit = async (fdData) => {
    if (!user || !storeInfo || !currentShift) {
      alert('Missing required information for FD submission')
      return
    }

    const result = await setFDForTomorrow(
      user.id,
      storeInfo.id,
      fdData.amount,
      currentShift.shift_number,
      fdData.notes
    )

    if (result.success) {
      setShowFDPopup(false)
      // Continue with ending the shift
      return true
    } else {
      alert(`Failed to set FD: ${result.error}`)
      return false
    }
  }

  // Handle shift end with FD check
  const handleEndShift = async () => {
    // Check if this is a 2nd shift worker
    if (currentShift?.shift_number === 2) {
      return new Promise((resolve) => {
        setShowFDPopup(true)
        // The FD popup will handle the resolution
        window.fdPromiseResolve = resolve
      })
    }
    return true // For 1st shift, just continue
  }

  // Enhanced end shift function
  const handleEndShiftWithFD = () => {
    endShift(handleEndShift)
  }

  return (
    <div className="worker-dashboard">
      {/* Header */}
      <WorkerHeader 
        user={user}
        storeInfo={storeInfo}
        onLogout={logout}
      />

      <div className="worker-main-content space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Today's Shifts Overview */}
        <TodayShifts 
          storeInfo={storeInfo}
          todayShifts={todayShifts}
        />

        {/* Today's FD */}
        <TodayFD 
          todayFD={todayFD}
          loading={fdLoading}
          storeName={storeInfo?.name || ''}
        />

        {/* Navigation Tabs */}
        <NavigationTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 'sales' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Record Sale Section */}
            <RecordSale 
              currentShift={currentShift}
              sales={sales}
              shiftTotal={shiftTotal}
              products={products}
              onSubmitSale={submitSale}
              loading={loading}
            />

            {/* Shift Control Section */}
            <ShiftControl 
              currentShift={currentShift}
              shiftTime={shiftTime}
              shiftTargets={shiftTargets}
              shiftTotal={shiftTotal}
              sales={sales}
              workerCompletedToday={workerCompletedToday}
              shiftNumber={shiftNumber}
              loading={loading}
              onStartShift={startShift}
              onEndShift={handleEndShiftWithFD}
              onRefreshData={loadData}
            />

            {/* Sales History */}
            <SalesHistory sales={sales} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="worker-card">
            <WorkerTransactions 
              user={user} 
              storeInfo={storeInfo} 
              products={products} 
            />
          </div>
        )}
      </div>

      {/* FD Input Popup */}
      <FDInputPopup
        isOpen={showFDPopup}
        onClose={() => {
          setShowFDPopup(false)
          // Resolve the promise with false to cancel shift end
          if (window.fdPromiseResolve) {
            window.fdPromiseResolve(false)
            window.fdPromiseResolve = null
          }
        }}
        onSubmit={async (fdData) => {
          const success = await handleFDSubmit(fdData)
          if (success && window.fdPromiseResolve) {
            window.fdPromiseResolve(true)
            window.fdPromiseResolve = null
          }
        }}
        loading={fdLoading}
        storeName={storeInfo?.name || ''}
        shiftNumber={currentShift?.shift_number || 2}
      />
    </div>
  )
}

export default Worker
