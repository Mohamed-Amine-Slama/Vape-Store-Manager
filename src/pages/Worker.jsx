import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkerDashboard } from '../hooks'
import {
  WorkerHeader,
  TodayShifts,
  NavigationTabs,
  RecordSale,
  ShiftControl,
  SalesHistory
} from '../components/worker'
import WorkerTransactions from '../components/WorkerTransactions'
import './Worker.css'

const Worker = () => {
  const { user, logout } = useAuth()
  
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
              onEndShift={endShift}
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
    </div>
  )
}

export default Worker
