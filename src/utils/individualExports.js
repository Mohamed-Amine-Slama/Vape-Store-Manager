// Individual export utilities for single reports
import { formatCurrency, formatDate } from '../lib/utils'

// Export a single daily report to Excel
export const exportSingleDailyReport = async (report) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!report) {
    alert('No report data to export')
    return
  }

  // Prepare data for Excel
  const excelData = [
    ['Daily Report Export'],
    [''],
    ['Report Information'],
    ['Date', formatDate(report.report_date)],
    ['Store', report.store_name],
    ['Location', report.store_location],
    [''],
    ['Shift Performance'],
    ['Metric', 'Shift 1', 'Shift 2', 'Total'],
    ['Worker', report.shift1_worker || 'Not assigned', report.shift2_worker || 'Not assigned', ''],
    ['Sales', report.shift1_total_sales || 0, report.shift2_total_sales || 0, report.daily_total || 0],
    ['Transactions', report.shift1_transaction_count || 0, report.shift2_transaction_count || 0, report.total_transactions || 0],
    ['Hours Worked', report.shift1_hours || 0, report.shift2_hours || 0, report.total_work_hours || 0],
    [''],
    ['Summary'],
    ['Daily Total Revenue', formatCurrency(report.daily_total || 0)],
    ['Total Transactions', report.total_transactions || 0],
    ['Total Work Hours', report.total_work_hours || 0],
    ['Average Transaction Value', formatCurrency(report.average_transaction_value || 0)]
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(excelData)

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Labels
    { wch: 15 }, // Shift 1
    { wch: 15 }, // Shift 2
    { wch: 15 }  // Total
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report')

  // Generate filename
  const dateStr = formatDate(report.report_date).replace(/\//g, '-')
  const storeStr = report.store_name.replace(/[^a-zA-Z0-9]/g, '_')
  const filename = `Daily_Report_${storeStr}_${dateStr}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}

// Export monthly summary to Excel
export const exportSingleMonthlySummary = async (monthlyData, currentDate) => {
  // Use dynamic import to avoid bundling xlsx if not needed
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
  
  if (!monthlyData) {
    alert('No monthly data to export')
    return
  }

  const wb = XLSX.utils.book_new()

  // Overview sheet
  const overviewData = [
    ['Monthly Summary Report'],
    [''],
    ['Period Information'],
    ['Month', monthlyData.month_name || 'N/A'],
    ['Start Date', formatDate(monthlyData.start_date)],
    ['End Date', formatDate(monthlyData.end_date)],
    [''],
    ['Overall Performance'],
    ['Total Revenue', monthlyData.total_revenue || 0],
    ['Total Transactions', monthlyData.total_transactions || 0],
    ['Days with Sales', monthlyData.total_days_with_sales || 0],
    ['Average Daily Revenue', monthlyData.average_daily_revenue || 0],
    ['Average Transactions per Day', monthlyData.average_transactions_per_day || 0],
    ['']
  ]

  // Add store performance
  if (monthlyData.stores && monthlyData.stores.length > 0) {
    overviewData.push(['Store Performance'])
    overviewData.push([
      'Store Name',
      'Location',
      'Revenue',
      'Transactions',
      'Days Active',
      'Avg Daily Revenue',
      'Best Day',
      'Best Day Revenue'
    ])

    monthlyData.stores.forEach(store => {
      overviewData.push([
        store.store_name,
        store.store_location,
        store.total_revenue || 0,
        store.total_transactions || 0,
        store.days_active || 0,
        store.average_daily_revenue || 0,
        store.best_day ? formatDate(store.best_day) : 'N/A',
        store.best_day_revenue || 0
      ])
    })
  }

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewData)
  overviewWs['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
  ]
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Monthly Summary')

  // Generate filename
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  const filename = `Monthly_Summary_${monthYear.replace(' ', '_')}.xlsx`

  // Save file
  XLSX.writeFile(wb, filename)
}
