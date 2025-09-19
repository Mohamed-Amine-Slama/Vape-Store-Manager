// Export utilities for generating Excel files from reports data
import { formatCurrency, formatDate } from '../lib/utils'

// Function to export daily reports to Excel
export const exportDailyReportsToExcel = async (dailyReports, currentDate) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!dailyReports || dailyReports.length === 0) {
    alert('No daily reports data to export')
    return
  }

  // Prepare data for Excel
  const excelData = []
  
  // Add header row
  excelData.push([
    'Date',
    'Store Name',
    'Store Location',
    'Shift 1 Worker',
    'Shift 1 Sales',
    'Shift 1 Transactions',
    'Shift 1 Hours',
    'Shift 2 Worker',
    'Shift 2 Sales', 
    'Shift 2 Transactions',
    'Shift 2 Hours',
    'Daily Total',
    'Total Transactions',
    'Total Hours',
    'Avg Transaction Value'
  ])

  // Add data rows
  dailyReports.forEach(report => {
    excelData.push([
      formatDate(report.report_date),
      report.store_name,
      report.store_location,
      report.shift1_worker || 'Not assigned',
      report.shift1_total_sales || 0,
      report.shift1_transaction_count || 0,
      report.shift1_hours || 0,
      report.shift2_worker || 'Not assigned',
      report.shift2_total_sales || 0,
      report.shift2_transaction_count || 0,
      report.shift2_hours || 0,
      report.daily_total || 0,
      report.total_transactions || 0,
      report.total_work_hours || 0,
      report.average_transaction_value || 0
    ])
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 20 }, // Store Name
    { wch: 25 }, // Store Location
    { wch: 15 }, // Shift 1 Worker
    { wch: 12 }, // Shift 1 Sales
    { wch: 12 }, // Shift 1 Transactions
    { wch: 10 }, // Shift 1 Hours
    { wch: 15 }, // Shift 2 Worker
    { wch: 12 }, // Shift 2 Sales
    { wch: 12 }, // Shift 2 Transactions
    { wch: 10 }, // Shift 2 Hours
    { wch: 12 }, // Daily Total
    { wch: 12 }, // Total Transactions
    { wch: 10 }, // Total Hours
    { wch: 15 }  // Avg Transaction Value
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Reports')

  // Generate filename
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  const filename = `Daily_Reports_${monthYear.replace(' ', '_')}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}

// Function to export monthly summary to Excel
export const exportMonthlySummaryToExcel = async (monthlyData, currentDate) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!monthlyData) {
    alert('No monthly summary data to export')
    return
  }

  const wb = XLSX.utils.book_new()

  // Extract data from nested structure
  const period = monthlyData.period || {}
  const summary = monthlyData.summary || {}
  const stores = monthlyData.stores || []
  const topProducts = monthlyData.top_products || []

  // Sheet 1: Monthly Overview
  const overviewData = [
    ['Monthly Summary Report'],
    ['Month', period.month_name || 'N/A'],
    ['Period', `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`],
    [''],
    ['Total Revenue', summary.total_revenue || 0],
    ['Total Transactions', summary.total_transactions || 0],
    ['Active Days', summary.active_days || 0],
    ['Active Stores', summary.active_stores || 0],
    ['Total Hours', summary.total_hours || 0],
    ['Average Daily Revenue', summary.avg_daily_revenue || 0],
    ['']
  ]

  // Add store performance data
  if (stores && stores.length > 0) {
    overviewData.push(['Store Performance'])
    overviewData.push([
      'Store Name',
      'Location', 
      'Revenue',
      'Transactions',
      'Days Active',
      'Avg Daily Revenue',
      'Best Day Revenue'
    ])

    stores.forEach(store => {
      overviewData.push([
        store.store_name,
        store.store_location,
        store.store_revenue || 0,
        store.store_transactions || 0,
        store.days_active || 0,
        store.avg_daily_revenue || 0,
        store.best_day_revenue || 0
      ])
    })
  }

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewData)
  overviewWs['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
    { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
  ]
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Monthly Overview')

  // Sheet 2: Store Details (if available)
  if (stores && stores.length > 0) {
    stores.forEach((store, index) => {
      if (store.top_products && store.top_products.length > 0) {
        const storeData = [
          [`${store.store_name} - Product Performance`],
          [''],
          ['Product Name', 'Category', 'Total Sales', 'Quantity/ML', 'Transactions', 'Avg Price'],
          ['']
        ]

        store.top_products.forEach(product => {
          storeData.push([
            product.product_name,
            product.category,
            product.total_sales || 0,
            product.total_quantity || product.total_ml || 0,
            product.transaction_count || 0,
            product.average_price || 0
          ])
        })

        const storeWs = XLSX.utils.aoa_to_sheet(storeData)
        storeWs['!cols'] = [
          { wch: 25 }, { wch: 12 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 12 }
        ]
        
        const sheetName = store.store_name.length > 31 
          ? store.store_name.substring(0, 28) + '...' 
          : store.store_name
        
        XLSX.utils.book_append_sheet(wb, storeWs, sheetName)
      }
    })
  }

  // Sheet 3: Top Products (if available)
  if (topProducts && topProducts.length > 0) {
    const productsData = [
      ['Top Products Performance'],
      [''],
      ['Product Name', 'Total Revenue', 'Transaction Count', 'Total Quantity', 'Total ML'],
      ['']
    ]

    topProducts.forEach(product => {
      productsData.push([
        product.product || 'N/A',
        product.total_revenue || 0,
        product.transaction_count || 0,
        product.total_quantity || 0,
        product.total_ml || 0
      ])
    })

    const productsWs = XLSX.utils.aoa_to_sheet(productsData)
    productsWs['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, productsWs, 'Top Products')
  }

  // Generate filename
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  const filename = `Monthly_Summary_${monthYear.replace(' ', '_')}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}

// Function to export detailed breakdown to Excel
export const exportDetailedBreakdownToExcel = async (breakdownData, selectedDate, viewMode) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!breakdownData) {
    alert('No detailed breakdown data to export')
    return
  }

  const wb = XLSX.utils.book_new()

  // Overview sheet
  const overviewData = [
    [`${viewMode === 'daily' ? 'Daily' : 'Monthly'} Detailed Breakdown`],
    ['Date/Period', viewMode === 'daily' ? formatDate(selectedDate) : selectedDate],
    [''],
    ['Total Revenue', breakdownData.total_revenue || 0],
    ['Total Transactions', breakdownData.total_transactions || 0],
    ['Active Stores', breakdownData.active_stores || 0],
    ['']
  ]

  // Add store breakdown
  if (breakdownData.stores && breakdownData.stores.length > 0) {
    overviewData.push(['Store Performance'])
    overviewData.push(['Store Name', 'Revenue', 'Transactions', 'Products Sold'])

    breakdownData.stores.forEach(store => {
      overviewData.push([
        store.store_name,
        store.total_revenue || 0,
        store.total_transactions || 0,
        store.products ? store.products.length : 0
      ])
    })
  }

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewData)
  overviewWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview')

  // Product details for each store
  if (breakdownData.stores && breakdownData.stores.length > 0) {
    breakdownData.stores.forEach(store => {
      if (store.products && store.products.length > 0) {
        const storeData = [
          [`${store.store_name} - Product Details`],
          [''],
          ['Product', 'Category', 'Total Sales', 'Quantity/ML', 'Transactions', 'Avg Price'],
          ['']
        ]

        store.products.forEach(product => {
          storeData.push([
            product.product_name,
            product.category,
            product.total_sales || 0,
            product.total_quantity || product.total_ml || 0,
            product.transaction_count || 0,
            product.average_price || 0
          ])
        })

        const storeWs = XLSX.utils.aoa_to_sheet(storeData)
        storeWs['!cols'] = [
          { wch: 25 }, { wch: 12 }, { wch: 12 }, 
          { wch: 12 }, { wch: 12 }, { wch: 12 }
        ]
        
        const sheetName = store.store_name.length > 31 
          ? store.store_name.substring(0, 28) + '...' 
          : store.store_name
        
        XLSX.utils.book_append_sheet(wb, storeWs, sheetName)
      }
    })
  }

  // Generate filename
  const dateStr = viewMode === 'daily' 
    ? formatDate(selectedDate).replace(/\//g, '-')
    : selectedDate.toString().replace(' ', '_')
  const filename = `${viewMode === 'daily' ? 'Daily' : 'Monthly'}_Breakdown_${dateStr}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}

// Function to export daily sales records to Excel
export const exportDailyRecordsToExcel = async (records, selectedDate) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!records || records.length === 0) {
    alert('No daily records data to export')
    return
  }

  // Prepare data for Excel
  const excelData = []
  
  // Add header row
  excelData.push([
    'Time',
    'Worker Name',
    'Product Name',
    'Quantity',
    'ML Amount',
    'Price (TND)',
    'Payment Type',
    'Shift Number',
    'Shift Start Time',
    'Created At'
  ])

  // Add data rows
  records.forEach(record => {
    excelData.push([
      new Date(record.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      record.store_users?.name || 'Unknown',
      record.product || '',
      record.quantity || '',
      record.ml_amount || '',
      record.price || 0,
      record.payment_type || 'cash',
      record.shifts?.shift_number || 'N/A',
      record.shifts?.start_time ? new Date(record.shifts.start_time).toLocaleString() : '',
      new Date(record.created_at).toLocaleString()
    ])
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Auto-size columns
  const colWidths = [
    { wch: 12 }, // Time
    { wch: 20 }, // Worker Name
    { wch: 25 }, // Product Name
    { wch: 10 }, // Quantity
    { wch: 12 }, // ML Amount
    { wch: 12 }, // Price
    { wch: 12 }, // Payment Type
    { wch: 12 }, // Shift Number
    { wch: 20 }, // Shift Start Time
    { wch: 20 }  // Created At
  ]
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  const sheetName = `Daily Records ${formatDate(selectedDate)}`
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate filename
  const dateStr = formatDate(selectedDate).replace(/\//g, '-')
  const filename = `Daily_Sales_Records_${dateStr}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}
