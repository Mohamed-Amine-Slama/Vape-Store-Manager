-- Fix for get_monthly_summary function - column dr.shift1_hours does not exist error
-- This fixes the issue where the function was trying to access non-existent columns

DROP FUNCTION IF EXISTS get_monthly_summary(integer, integer);

-- Function to get monthly summary for export
CREATE OR REPLACE FUNCTION get_monthly_summary(p_year integer, p_month integer)
RETURNS json AS $$
DECLARE
    start_date date;
    end_date date;
    result json;
BEGIN
    -- Calculate date range for the month
    start_date := make_date(p_year, p_month, 1);
    end_date := (start_date + INTERVAL '1 month - 1 day')::date;
    
    -- Get monthly summary data
    WITH monthly_stats AS (
        SELECT 
            COUNT(DISTINCT dr.report_date) as active_days,
            COUNT(DISTINCT dr.store_id) as active_stores,
            SUM(dr.daily_total) as total_revenue,
            SUM(dr.shift1_transaction_count + dr.shift2_transaction_count) as total_transactions,
            SUM(dr.total_work_hours) as total_hours,
            AVG(dr.daily_total) as avg_daily_revenue
        FROM daily_reports dr
        WHERE dr.report_date BETWEEN start_date AND end_date
    ),
    store_breakdown AS (
        SELECT 
            s.name as store_name,
            s.location as store_location,
            COUNT(DISTINCT dr.report_date) as days_active,
            SUM(dr.daily_total) as store_revenue,
            SUM(dr.shift1_transaction_count + dr.shift2_transaction_count) as store_transactions,
            AVG(dr.daily_total) as avg_daily_revenue,
            MAX(dr.daily_total) as best_day_revenue
        FROM daily_reports dr
        JOIN stores s ON s.id = dr.store_id
        WHERE dr.report_date BETWEEN start_date AND end_date
        GROUP BY s.id, s.name, s.location
        ORDER BY store_revenue DESC
    ),
    top_products AS (
        SELECT 
            s.product,
            COUNT(*) as transaction_count,
            SUM(s.price) as total_revenue,
            SUM(COALESCE(s.quantity, 0)) as total_quantity,
            SUM(COALESCE(s.ml_amount, 0)) as total_ml
        FROM sales s
        WHERE s.created_at::date BETWEEN start_date AND end_date
        GROUP BY s.product
        ORDER BY total_revenue DESC
        LIMIT 10
    )
    SELECT json_build_object(
        'period', json_build_object(
            'year', p_year,
            'month', p_month,
            'start_date', start_date,
            'end_date', end_date,
            'month_name', to_char(start_date, 'Month YYYY')
        ),
        'summary', (SELECT row_to_json(monthly_stats) FROM monthly_stats),
        'stores', (SELECT json_agg(store_breakdown) FROM store_breakdown),
        'top_products', (SELECT json_agg(top_products) FROM top_products)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_monthly_summary(integer, integer) TO anon, authenticated;
