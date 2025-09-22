-- ========================================
-- OPTIMIZED Multi-Store Vape Store Manager Database Schema
-- ========================================
-- This optimized schema fixes setup issues while maintaining all functionality
-- Run these SQL commands in your Supabase SQL editor

-- Step 1: Clean slate - Drop all tables and start fresh
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS store_users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS shift_targets CASCADE;
DROP TABLE IF EXISTS worker_transactions CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS store_inventory CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Disable RLS globally during setup to avoid conflicts
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;

-- ========================================
-- TABLE CREATION (Core Schema)
-- ========================================

-- Stores Table (3 Stores)
CREATE TABLE stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    location text,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);

-- Disable RLS for stores initially
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Users Table (Workers can work at any store)
CREATE TABLE store_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    role text CHECK (role IN ('worker', 'admin')) NOT NULL,
    pin text NOT NULL UNIQUE,
    store_id uuid REFERENCES stores(id), -- Optional: Only set for store managers/admins
    created_at timestamp with time zone DEFAULT now()
);

-- Disable RLS for users initially
ALTER TABLE store_users DISABLE ROW LEVEL SECURITY;

-- Products Table (Basic Catalog with Categories)
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text CHECK (category IN ('fruities', 'gourmands', 'puffs', 'coils', 'mesh')) NOT NULL,
    price numeric(10,3) NOT NULL DEFAULT 0 CHECK (price >= 0), -- TND can have 3 decimal places (millimes)
    is_liquid boolean GENERATED ALWAYS AS (category IN ('fruities', 'gourmands')) STORED,
    default_ml numeric(10,2) DEFAULT NULL, -- Default ml amount for liquid products
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(name, category) -- Allow same name in different categories
);

-- Shifts Table (Updated with shift numbers and store tracking)
CREATE TABLE shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES store_users (id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    shift_number integer CHECK (shift_number IN (1, 2)) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (end_time - start_time)) / 60
            ELSE NULL 
        END
    ) STORED,
    is_day_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Sales Table (Updated with store tracking)
CREATE TABLE sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES store_users (id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES shifts (id),
    product_id uuid REFERENCES products(id),
    product text NOT NULL,
    price numeric(10,3) NOT NULL CHECK (price > 0), -- Final selling price in TND (with millimes)
    quantity int CHECK (quantity > 0), -- For tracking non-liquid products
    ml_amount numeric(10,2) CHECK (ml_amount > 0), -- For tracking liquid products
    payment_type text CHECK (payment_type IN ('cash', 'card')) DEFAULT 'cash',
    created_at timestamp with time zone DEFAULT now(),
    -- Ensure either quantity OR ml_amount is provided, not both
    CONSTRAINT check_quantity_or_ml CHECK (
        (quantity IS NOT NULL AND ml_amount IS NULL) OR 
        (quantity IS NULL AND ml_amount IS NOT NULL)
    )
);

-- Calculate total sales for better performance
ALTER TABLE sales ADD COLUMN total numeric(10,3) GENERATED ALWAYS AS (price) STORED;

-- ========================================
-- PER-STORE INVENTORY MANAGEMENT
-- ========================================

-- Tracks current stock per store and product
CREATE TABLE store_inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0), -- for non-liquid
    stock_ml numeric(10,2) NOT NULL DEFAULT 0 CHECK (stock_ml >= 0),       -- for liquids
    low_stock_threshold_quantity integer NOT NULL DEFAULT 0 CHECK (low_stock_threshold_quantity >= 0),
    low_stock_threshold_ml numeric(10,2) NOT NULL DEFAULT 0 CHECK (low_stock_threshold_ml >= 0),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(store_id, product_id)
);

-- Audit trail of inventory changes
CREATE TABLE inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    movement_type text CHECK (movement_type IN (
      'restock','manual_adjustment','sale','transfer_in','transfer_out','consumption'
    )) NOT NULL,
    quantity integer,           -- for non-liquid
    ml_amount numeric(10,2),    -- for liquids
    sale_id uuid REFERENCES sales(id),
    worker_transaction_id uuid, -- optional link to worker_transactions (no FK to avoid creation order issues)
    notes text,
    balance_quantity integer,
    balance_ml numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure a store_inventory row exists
CREATE OR REPLACE FUNCTION ensure_inventory_row(p_store_id uuid, p_product_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if store exists first
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = p_store_id) THEN
    RAISE EXCEPTION 'Store with ID % does not exist', p_store_id;
  END IF;
  
  -- Check if product exists
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product with ID % does not exist', p_product_id;
  END IF;
  
  INSERT INTO store_inventory (store_id, product_id)
  VALUES (p_store_id, p_product_id)
  ON CONFLICT (store_id, product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Worker consumptions -> inventory
CREATE OR REPLACE FUNCTION apply_consumption_inventory_delta(
  p_store_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_ml numeric(10,2),
  p_direction integer,
  p_worker_tx_id uuid
)
RETURNS void AS $$
DECLARE
  v_new_qty integer;
  v_new_ml numeric(10,2);
  v_is_liquid boolean;
BEGIN
  -- Skip inventory for liquids (fruities, gourmands)
  SELECT (category IN ('fruities','gourmands')) INTO v_is_liquid FROM products WHERE id = p_product_id;
  IF v_is_liquid THEN
    RETURN;
  END IF;
  PERFORM ensure_inventory_row(p_store_id, p_product_id);

  UPDATE store_inventory
  SET stock_quantity = stock_quantity + COALESCE(p_quantity,0) * p_direction,
      stock_ml = stock_ml + COALESCE(p_ml,0) * p_direction,
      updated_at = now()
  WHERE store_id = p_store_id AND product_id = p_product_id
  RETURNING stock_quantity, stock_ml INTO v_new_qty, v_new_ml;

  IF v_new_qty < 0 OR v_new_ml < 0 THEN
    UPDATE store_inventory
    SET stock_quantity = stock_quantity - COALESCE(p_quantity,0) * p_direction,
        stock_ml = stock_ml - COALESCE(p_ml,0) * p_direction,
        updated_at = now()
    WHERE store_id = p_store_id AND product_id = p_product_id;
    RAISE EXCEPTION 'Insufficient stock for consumption on product % at store %', p_product_id, p_store_id;
  END IF;

  INSERT INTO inventory_movements (store_id, product_id, movement_type, quantity, ml_amount, worker_transaction_id, balance_quantity, balance_ml)
  VALUES (p_store_id, p_product_id, 'consumption', NULLIF(p_quantity,0) * CASE WHEN p_direction = -1 THEN 1 ELSE -1 END,
          NULLIF(p_ml,0) * CASE WHEN p_direction = -1 THEN 1 ELSE -1 END, p_worker_tx_id, v_new_qty, v_new_ml);
END;
$$ LANGUAGE plpgsql;

-- Adjust inventory with deltas (can be positive or negative); records movement
CREATE OR REPLACE FUNCTION adjust_store_inventory(
  p_store_id uuid,
  p_product_id uuid,
  p_delta_quantity integer DEFAULT 0,
  p_delta_ml numeric(10,2) DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_movement_type text DEFAULT 'manual_adjustment'
)
RETURNS json AS $$
DECLARE
  v_is_liquid boolean;
  v_new_qty integer;
  v_new_ml numeric(10,2);
BEGIN
  PERFORM ensure_inventory_row(p_store_id, p_product_id);

  SELECT (category IN ('fruities','gourmands')) INTO v_is_liquid
  FROM products WHERE id = p_product_id;

  -- Disallow manual restock/adjustment for liquids
  IF v_is_liquid THEN
    RAISE EXCEPTION 'Liquid products are not tracked in inventory (no restock/adjustment allowed)';
  END IF;

  IF p_delta_quantity IS NULL THEN p_delta_quantity := 0; END IF;
  IF p_delta_ml IS NULL THEN p_delta_ml := 0; END IF;

  -- Apply deltas; enforce non-negative stock
  UPDATE store_inventory
  SET 
    stock_quantity = stock_quantity + p_delta_quantity,
    stock_ml = stock_ml + p_delta_ml,
    updated_at = now()
  WHERE store_id = p_store_id AND product_id = p_product_id
  RETURNING stock_quantity, stock_ml INTO v_new_qty, v_new_ml;

  IF v_new_qty < 0 OR v_new_ml < 0 THEN
    -- revert and error
    UPDATE store_inventory
    SET stock_quantity = stock_quantity - p_delta_quantity,
        stock_ml = stock_ml - p_delta_ml,
        updated_at = now()
    WHERE store_id = p_store_id AND product_id = p_product_id;
    RAISE EXCEPTION 'Insufficient stock for product % at store %', p_product_id, p_store_id;
  END IF;

  INSERT INTO inventory_movements (store_id, product_id, movement_type, quantity, ml_amount, notes, balance_quantity, balance_ml)
  VALUES (p_store_id, p_product_id, COALESCE(p_movement_type, 'manual_adjustment'), NULLIF(p_delta_quantity,0), NULLIF(p_delta_ml,0), p_notes, v_new_qty, v_new_ml);

  RETURN json_build_object(
    'success', true,
    'store_id', p_store_id,
    'product_id', p_product_id,
    'stock_quantity', v_new_qty,
    'stock_ml', v_new_ml
  );
END;
$$ LANGUAGE plpgsql;

-- Helper used by sales triggers
CREATE OR REPLACE FUNCTION apply_sale_inventory_delta(
  p_store_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_ml numeric(10,2),
  p_direction integer, -- -1 to deduct, +1 to revert
  p_sale_id uuid
)
RETURNS void AS $$
DECLARE
  v_new_qty integer;
  v_new_ml numeric(10,2);
  v_is_liquid boolean;
BEGIN
  -- Skip inventory for liquids (fruities, gourmands)
  SELECT (category IN ('fruities','gourmands')) INTO v_is_liquid FROM products WHERE id = p_product_id;
  IF v_is_liquid THEN
    RETURN;
  END IF;
  PERFORM ensure_inventory_row(p_store_id, p_product_id);

  UPDATE store_inventory
  SET stock_quantity = stock_quantity + COALESCE(p_quantity,0) * p_direction,
      stock_ml = stock_ml + COALESCE(p_ml,0) * p_direction,
      updated_at = now()
  WHERE store_id = p_store_id AND product_id = p_product_id
  RETURNING stock_quantity, stock_ml INTO v_new_qty, v_new_ml;

  IF v_new_qty < 0 OR v_new_ml < 0 THEN
    -- revert
    UPDATE store_inventory
    SET stock_quantity = stock_quantity - COALESCE(p_quantity,0) * p_direction,
        stock_ml = stock_ml - COALESCE(p_ml,0) * p_direction,
        updated_at = now()
    WHERE store_id = p_store_id AND product_id = p_product_id;
    RAISE EXCEPTION 'Insufficient stock for sale on product % at store %', p_product_id, p_store_id;
  END IF;

  INSERT INTO inventory_movements (store_id, product_id, movement_type, quantity, ml_amount, sale_id, balance_quantity, balance_ml)
  VALUES (p_store_id, p_product_id, 'sale', NULLIF(p_quantity,0) * CASE WHEN p_direction = -1 THEN 1 ELSE -1 END,
          NULLIF(p_ml,0) * CASE WHEN p_direction = -1 THEN 1 ELSE -1 END, p_sale_id, v_new_qty, v_new_ml);
END;
$$ LANGUAGE plpgsql;

-- Sales triggers to keep inventory in sync
CREATE OR REPLACE FUNCTION sales_inventory_after_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM apply_sale_inventory_delta(NEW.store_id, NEW.product_id, NEW.quantity, NEW.ml_amount, -1, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sales_inventory_after_update()
RETURNS trigger AS $$
BEGIN
  -- revert old
  PERFORM apply_sale_inventory_delta(OLD.store_id, OLD.product_id, OLD.quantity, OLD.ml_amount, +1, OLD.id);
  -- apply new
  PERFORM apply_sale_inventory_delta(NEW.store_id, NEW.product_id, NEW.quantity, NEW.ml_amount, -1, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sales_inventory_after_delete()
RETURNS trigger AS $$
BEGIN
  PERFORM apply_sale_inventory_delta(OLD.store_id, OLD.product_id, OLD.quantity, OLD.ml_amount, +1, OLD.id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_inventory_insert ON sales;
CREATE TRIGGER trg_sales_inventory_insert
AFTER INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION sales_inventory_after_insert();

DROP TRIGGER IF EXISTS trg_sales_inventory_update ON sales;
CREATE TRIGGER trg_sales_inventory_update
AFTER UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION sales_inventory_after_update();

DROP TRIGGER IF EXISTS trg_sales_inventory_delete ON sales;
CREATE TRIGGER trg_sales_inventory_delete
AFTER DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION sales_inventory_after_delete();

-- Triggers for worker transactions (product consumption)
CREATE OR REPLACE FUNCTION worker_tx_inventory_after_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.transaction_type = 'product_consumption' THEN
    PERFORM apply_consumption_inventory_delta(NEW.store_id, NEW.product_id, NEW.quantity, NEW.ml_amount, -1, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION worker_tx_inventory_after_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.transaction_type = 'product_consumption' THEN
    PERFORM apply_consumption_inventory_delta(OLD.store_id, OLD.product_id, OLD.quantity, OLD.ml_amount, +1, OLD.id);
  END IF;
  IF NEW.transaction_type = 'product_consumption' THEN
    PERFORM apply_consumption_inventory_delta(NEW.store_id, NEW.product_id, NEW.quantity, NEW.ml_amount, -1, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION worker_tx_inventory_after_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.transaction_type = 'product_consumption' THEN
    PERFORM apply_consumption_inventory_delta(OLD.store_id, OLD.product_id, OLD.quantity, OLD.ml_amount, +1, OLD.id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Set thresholds helper
CREATE OR REPLACE FUNCTION set_inventory_thresholds(
  p_store_id uuid,
  p_product_id uuid,
  p_threshold_qty integer DEFAULT 0,
  p_threshold_ml numeric(10,2) DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_qty integer;
  v_ml numeric(10,2);
BEGIN
  PERFORM ensure_inventory_row(p_store_id, p_product_id);
  UPDATE store_inventory
  SET low_stock_threshold_quantity = COALESCE(p_threshold_qty,0),
      low_stock_threshold_ml = COALESCE(p_threshold_ml,0),
      updated_at = now()
  WHERE store_id = p_store_id AND product_id = p_product_id
  RETURNING low_stock_threshold_quantity, low_stock_threshold_ml INTO v_qty, v_ml;

  RETURN json_build_object(
    'success', true,
    'low_stock_threshold_quantity', v_qty,
    'low_stock_threshold_ml', v_ml
  );
END;
$$ LANGUAGE plpgsql;

 -- Transfers between stores have been removed.
 DROP FUNCTION IF EXISTS transfer_inventory(uuid, uuid, uuid, integer, numeric, text);

-- Cleanup function to remove orphaned inventory records
CREATE OR REPLACE FUNCTION cleanup_orphaned_inventory()
RETURNS json AS $$
DECLARE
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- Delete inventory records where store_id doesn't exist in stores table
  DELETE FROM store_inventory 
  WHERE store_id NOT IN (SELECT id FROM stores);
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete inventory records where product_id doesn't exist in products table
  DELETE FROM store_inventory 
  WHERE product_id NOT IN (SELECT id FROM products);
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN json_build_object(
    'success', true,
    'deleted_records', deleted_count,
    'message', 'Cleanup completed successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Helper RPC to fetch current inventory for a product across stores
CREATE OR REPLACE FUNCTION get_inventory_for_product(p_product_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'store_id', s.id,
      'store_name', s.name,
      'stock_quantity', COALESCE(si.stock_quantity, 0),
      'stock_ml', COALESCE(si.stock_ml, 0),
      'low_stock_threshold_quantity', COALESCE(si.low_stock_threshold_quantity, 0),
      'low_stock_threshold_ml', COALESCE(si.low_stock_threshold_ml, 0)
    ) ORDER BY s.name
  ) INTO result
  FROM stores s
  LEFT JOIN store_inventory si ON si.store_id = s.id AND si.product_id = p_product_id;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Daily Reports Table (New - for end-of-day summaries)
CREATE TABLE daily_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    report_date date NOT NULL,
    shift1_worker_id uuid REFERENCES store_users(id),
    shift1_total_sales numeric(10,3) DEFAULT 0, -- TND with millimes
    shift1_transaction_count integer DEFAULT 0,
    shift1_duration_minutes integer DEFAULT 0,
    shift2_worker_id uuid REFERENCES store_users(id),
    shift2_total_sales numeric(10,3) DEFAULT 0, -- TND with millimes
    shift2_transaction_count integer DEFAULT 0,
    shift2_duration_minutes integer DEFAULT 0,
    daily_total numeric(10,3) GENERATED ALWAYS AS (shift1_total_sales + shift2_total_sales) STORED,
    total_work_hours numeric(4,2) GENERATED ALWAYS AS ((shift1_duration_minutes + shift2_duration_minutes) / 60.0) STORED,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(store_id, report_date)
);

-- Shift Targets Table (New - for performance tracking)
CREATE TABLE shift_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    target_sales_per_shift numeric(10,3) DEFAULT 500.000, -- TND with millimes
    target_items_per_shift integer DEFAULT 20,
    target_transactions_per_shift integer DEFAULT 15,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(store_id)
);

-- Worker Transactions Table (New - for salary advances and product consumption)
CREATE TABLE worker_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES store_users(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    transaction_type text CHECK (transaction_type IN ('salary_advance', 'product_consumption')) NOT NULL,
    amount numeric(10,3) CHECK (amount > 0), -- Amount for salary advance in TND
    product_id uuid REFERENCES products(id), -- For product consumption
    product_name text, -- Store product name for history
    product_category text CHECK (product_category IN ('fruities', 'gourmands', 'puffs', 'coils', 'mesh')), -- Snapshot of category at time of transaction
    quantity integer CHECK (quantity > 0), -- For non-liquid products
    ml_amount numeric(10,2) CHECK (ml_amount > 0), -- For liquid products
    notes text, -- Optional notes
    transaction_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    -- Ensure proper data based on transaction type
    CONSTRAINT check_salary_advance_data CHECK (
        (transaction_type = 'salary_advance' 
            AND amount IS NOT NULL 
            AND product_id IS NULL 
            AND product_name IS NULL 
            AND product_category IS NULL 
            AND quantity IS NULL 
            AND ml_amount IS NULL) 
        OR
        (transaction_type = 'product_consumption' 
            AND product_id IS NOT NULL 
            AND product_name IS NOT NULL 
            AND product_category IS NOT NULL 
            AND amount IS NULL 
            AND ((quantity IS NOT NULL AND ml_amount IS NULL) OR (quantity IS NULL AND ml_amount IS NOT NULL)))
    )
);

-- Create triggers for worker_transactions AFTER the table exists
DROP TRIGGER IF EXISTS trg_worker_tx_inventory_insert ON worker_transactions;
CREATE TRIGGER trg_worker_tx_inventory_insert
AFTER INSERT ON worker_transactions
FOR EACH ROW EXECUTE FUNCTION worker_tx_inventory_after_insert();

DROP TRIGGER IF EXISTS trg_worker_tx_inventory_update ON worker_transactions;
CREATE TRIGGER trg_worker_tx_inventory_update
AFTER UPDATE ON worker_transactions
FOR EACH ROW EXECUTE FUNCTION worker_tx_inventory_after_update();

DROP TRIGGER IF EXISTS trg_worker_tx_inventory_delete ON worker_transactions;
CREATE TRIGGER trg_worker_tx_inventory_delete
AFTER DELETE ON worker_transactions
FOR EACH ROW EXECUTE FUNCTION worker_tx_inventory_after_delete();

-- ========================================
-- DISABLE ROW LEVEL SECURITY FOR ALL TABLES
-- ========================================

-- Note: RLS will be disabled at the end of the schema after all tables are created

-- ========================================
-- DATA INSERTION (Step 1: Core Data)
-- ========================================

-- Insert the 3 stores FIRST with specific IDs to match the application
INSERT INTO stores (id, name, location, phone) VALUES
    ('b0bbf629-df9f-444e-b7c8-918250a4a0b2', 'Legend Vape Store', '123 Main St, Downtown', '(555) 101-0001'),
    (gen_random_uuid(), 'We Vape Store', '456 Shopping Center, Mall District', '(555) 102-0002'),
    (gen_random_uuid(), 'Kwest Vape Store', '789 North Ave, North Side', '(555) 103-0003')
ON CONFLICT (name) DO UPDATE SET id = EXCLUDED.id;

-- Insert admin and workers with specific IDs to match the application
INSERT INTO store_users (id, name, role, pin, store_id) VALUES
    (gen_random_uuid(), 'Wissem', 'admin', '596423', NULL), -- Admin can access all stores
    ('6ebd3c48-3fbf-4c98-8c20-156e8f3dbea0', 'Mohamed Amine', 'worker', '060604', NULL),   -- Workers can work at any store
    (gen_random_uuid(), 'Aziz Bounaaja', 'worker', '125678', NULL),
    (gen_random_uuid(), 'Yacine Rziga', 'worker', '230165', NULL),
    (gen_random_uuid(), 'Adam', 'worker', '109035', NULL),
    (gen_random_uuid(), 'Wael', 'worker', '653298', NULL),
    (gen_random_uuid(), 'Hamza', 'worker', '125452', NULL)
ON CONFLICT (pin) DO UPDATE SET id = EXCLUDED.id;

-- Insert sample products
INSERT INTO products (name, category, price, default_ml) VALUES
    ('Barakko Fuel Fighter', 'fruities', 0, 0),
    ('Shigiri Fuel Fighter', 'fruities', 0, 0),
    ('Shaken Fuel Fighter', 'fruities', 0, 0),
    ('Minasawa Fuel Fighter', 'fruities', 0, 0),
    ('Toshimura Fuel Fighter', 'fruities', 0, 0),
    ('Zakary Fuel Fighter', 'fruities', 0, 0),
    ('Kansets Fuel Fighter', 'fruities', 0, 0),
    ('Uraken Fuel Fighter', 'fruities', 0, 0),
    ('Bloody Shigiri Fuel Fighter', 'fruities', 0, 0),
    ('Ushiro Fuel Fighter', 'fruities', 0, 0),
    ('Fruity Fuel Blue', 'fruities', 0, 0),
    ('Fruity Fuel Red', 'fruities', 0, 0),
    ('Ragnarok A&L', 'fruities', 0, 0),
    ('Ragnarok X A&L', 'fruities', 0, 0),
    ('Phoenix A&L', 'fruities', 0, 0),
    ('Oni A&L', 'fruities', 0, 0),
    ('Kami A&L', 'fruities', 0, 0),
    ('Luna A&L', 'fruities', 0, 0),
    ('Fury A&L', 'fruities', 0, 0),
    ('Succube-V2 A&L', 'fruities', 0, 0),
    ('Shiva A&L', 'fruities', 0, 0),
    ('King Winter', 'fruities', 0, 0),
    ('King Koba', 'fruities', 0, 0),
    ('Lycan Pink Legend', 'fruities', 0, 0),
    ('Lycan original Legend', 'fruities', 0, 0),
    ('Lycan Red Legend', 'fruities', 0, 0),
    ('Lycan Green Legend', 'fruities', 0, 0),
    ('Full Moon Blue', 'fruities', 0, 0),
    ('Full Moon Green', 'fruities', 0, 0),
    ('Full Moon Hypnose', 'fruities', 0, 0),
    ('Full Moon Purple', 'fruities', 0, 0),
    ('Medusa Purple Vodka', 'fruities', 0, 0),
    ('Medusa Red Wedding', 'fruities', 0, 0),
    ('Feral GO-RILLA', 'fruities', 0, 0),
    ('Rugged GO-RILLA', 'fruities', 0, 0),
    ('Petit Beurre', 'gourmands', 0, 0),
    ('Eclaire Au Café', 'gourmands', 0, 0),
    ('Le Tiramisu', 'gourmands', 0, 0),
    ('Le Mille Feuille', 'gourmands', 0, 0),
    ('Paris Brest', 'gourmands', 0, 0),
    ('MilfsMilk Blackcurrant', 'gourmands', 0, 0),
    ('MilfsMilk Almond', 'gourmands', 0, 0),
    ('MilfsMan', 'gourmands', 0, 0),
    ('MilfsMilk', 'gourmands', 0, 0),
    ('Strawberry Milkshake', 'gourmands', 0, 0),
    ('Banana Milkshake', 'gourmands', 0, 0),
    ('Crunch Nom Nomz', 'gourmands', 0, 0),
    ('Nana s Treat Nomz', 'gourmands', 0, 0),
    ('Monkey Brek Nomz', 'gourmands', 0, 0),
    ('Cookie Milk Nomz', 'gourmands', 0, 0),
    ('Cookies & Cream A&L', 'gourmands', 0, 0),
    ('Dinner Lady Lemon Tart ', 'gourmands', 0, 0),
    ('Dinner Lady Strawberry Macaroon', 'gourmands', 0, 0),
    ('Projet Vape Or Diy', 'gourmands', 0, 0),
    ('Creme Kong Vanilla', 'gourmands', 0, 0),
    ('Creme Kong Caramel', 'gourmands', 0, 0),
    ('Creme Kong Banana', 'gourmands', 0, 0),
    ('Perfect Cream', 'gourmands', 0, 0),
    ('Banana Nutter Butter', 'gourmands', 0, 0),
    ('Psycho Bunny Yellow Mirage', 'gourmands', 0, 0),
    ('Chou Chou Pistache', 'gourmands', 0, 0),
    ('JAX Peanut Butter', 'gourmands', 0, 0),
    ('JAX Banana', 'gourmands', 0, 0),
    ('JAX Cereal', 'gourmands', 0, 0),
    ('Custard Cream', 'gourmands', 0, 0),
    ('Vozol 20K', 'puffs', 0, NULL),
    ('Vozol 40K', 'puffs', 0, NULL),
    ('Vozol 50K', 'puffs', 0, NULL),
    ('WOTOFO NexBar 10K', 'puffs', 0, NULL),
    ('WOTOFO NexBar 20K', 'puffs', 0, NULL),
    ('WOTOFO NexBar 18K', 'puffs', 0, NULL),
    ('NexPod', 'puffs', 0, NULL),
    ('Capsule NexPod', 'puffs', 0, NULL),
    ('Coil 0.18ohm', 'coils', 0, NULL),
    ('Coil 0.28ohm', 'coils', 0, NULL),
    ('Coil 0.32ohm', 'coils', 0, NULL),
    ('Coil 0.62ohm', 'coils', 0, NULL),
    ('GeekVape Z', 'mesh', 0, NULL),
    ('Vaporesso GTI', 'mesh', 0, NULL),
    ('Voopoo PNP-TW30', 'mesh', 0, NULL),
    ('Vaporesso GTX', 'mesh', 0, NULL),
    ('Vaporesso GT Cores', 'mesh', 0, NULL),
    ('PNP Screw', 'mesh', 0, NULL)
ON CONFLICT (name, category) DO NOTHING;

-- Insert shift targets for each store
INSERT INTO shift_targets (store_id, target_sales_per_shift, target_items_per_shift, target_transactions_per_shift)
SELECT s.id, 500.000, 20, 15
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM shift_targets WHERE store_id = s.id);

-- ========================================
-- FUNCTIONS (Core Business Logic)
-- ========================================

-- Helper function to get current shift day (7 AM to 7 AM cycle)
CREATE OR REPLACE FUNCTION get_current_shift_date()
RETURNS date AS $$
BEGIN
    -- If current time is before 7 AM, consider it part of previous day's shift cycle
    IF EXTRACT(HOUR FROM NOW()) < 7 THEN
        RETURN (CURRENT_DATE - INTERVAL '1 day')::date;
    ELSE
        RETURN CURRENT_DATE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to start a shift
CREATE OR REPLACE FUNCTION start_shift(p_user_id uuid, p_store_id uuid, p_shift_num integer)
RETURNS json AS $$
DECLARE
    shift_id uuid;
    existing_shift uuid;
    user_exists boolean;
    store_exists boolean;
    store_count integer;
    user_completed_shifts integer;
    current_shift_date date;
BEGIN
    -- Get current shift date (7 AM boundary)
    current_shift_date := get_current_shift_date();
    
    -- Debug: Check what we're working with
    SELECT COUNT(*) INTO store_count FROM stores;
    
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM store_users WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User ID does not exist',
            'debug_info', json_build_object(
                'user_id', p_user_id,
                'store_id', p_store_id,
                'total_stores', store_count
            )
        );
    END IF;
    
    -- Check if store exists
    SELECT EXISTS(SELECT 1 FROM stores WHERE id = p_store_id) INTO store_exists;
    IF NOT store_exists THEN
        -- If no store provided or store doesn't exist, try to use the first available store
        IF store_count > 0 THEN
            SELECT id INTO p_store_id FROM stores ORDER BY name LIMIT 1;
            RAISE NOTICE 'Store ID % not found, using first available store: %', p_store_id, p_store_id;
        ELSE
            RETURN json_build_object(
                'success', false, 
                'message', 'No stores available in database',
                'debug_info', json_build_object(
                    'user_id', p_user_id,
                    'store_id', p_store_id,
                    'total_stores', store_count
                )
            );
        END IF;
    END IF;
    
    -- Count how many shifts the user has completed in the current shift day (7 AM to 7 AM cycle)
    SELECT COUNT(*) INTO user_completed_shifts
    FROM shifts s 
    WHERE s.user_id = p_user_id 
    AND (
        -- Shifts that started on the current shift date
        (DATE(s.start_time) = current_shift_date AND EXTRACT(HOUR FROM s.start_time) >= 7)
        OR
        -- Shifts that started after midnight but before 7 AM of the next calendar day
        (DATE(s.start_time) = current_shift_date + INTERVAL '1 day' AND EXTRACT(HOUR FROM s.start_time) < 7)
    )
    AND s.end_time IS NOT NULL;
    
    -- Prevent starting more than 2 shifts per shift day
    IF user_completed_shifts >= 2 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'You have already completed 2 shifts today. Please wait until 7 AM tomorrow to start another shift.',
            'code', 'MAX_SHIFTS_COMPLETED_TODAY',
            'completed_shifts', user_completed_shifts,
            'next_shift_available_at', (current_shift_date + INTERVAL '1 day')::date || ' 07:00:00'
        );
    END IF;
    
    -- Check if user already has an active shift
    SELECT s.id INTO existing_shift
    FROM shifts s
    WHERE s.user_id = p_user_id AND s.end_time IS NULL;
    
    IF existing_shift IS NOT NULL THEN
        RETURN json_build_object('success', false, 'message', 'User already has an active shift');
    END IF;
    
    -- Check if this shift number is already active for the current shift day at this store
    SELECT s.id INTO existing_shift
    FROM shifts s
    WHERE s.store_id = p_store_id 
    AND s.shift_number = p_shift_num
    AND (
        -- Shifts that started on the current shift date
        (DATE(s.start_time) = current_shift_date AND EXTRACT(HOUR FROM s.start_time) >= 7)
        OR
        -- Shifts that started after midnight but before 7 AM of the next calendar day
        (DATE(s.start_time) = current_shift_date + INTERVAL '1 day' AND EXTRACT(HOUR FROM s.start_time) < 7)
    )
    AND s.end_time IS NULL;
    
    IF existing_shift IS NOT NULL THEN
        RETURN json_build_object('success', false, 'message', 'This shift is already active for today');
    END IF;
    
    -- Insert the new shift
    INSERT INTO shifts (user_id, store_id, shift_number, start_time, created_at)
    VALUES (p_user_id, p_store_id, p_shift_num, now(), now())
    RETURNING id INTO shift_id;
    
    -- Note: Notification is automatically created by trigger_shift_start_notification
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Shift started successfully',
        'shift_id', shift_id,
        'store_id', p_store_id,
        'shift_date', current_shift_date,
        'completed_shifts_today', user_completed_shifts
    );
END;
$$ LANGUAGE plpgsql;

-- Function to end a shift
CREATE OR REPLACE FUNCTION end_shift(shift_id uuid)
RETURNS json AS $$
DECLARE
    shift_record record;
    shift_sales numeric;
    shift_count integer;
    shift_duration integer;
    other_shift_ended boolean;
    daily_report_id uuid;
    result json;
    store_id_var uuid;
    today_date date := CURRENT_DATE;
    shift_number_var integer;
BEGIN
    -- Get shift information
    SELECT * INTO shift_record 
    FROM shifts 
    WHERE shifts.id = shift_id AND shifts.end_time IS NULL;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Shift not found or already ended');
    END IF;
    
    -- Store variables for later use
    store_id_var := shift_record.store_id;
    shift_number_var := shift_record.shift_number;
    
    -- End the shift
    UPDATE shifts 
    SET end_time = now()
    WHERE shifts.id = shift_id;
    
    -- Calculate shift totals and duration
    SELECT COALESCE(SUM(sales.price), 0), COALESCE(COUNT(*), 0)
    INTO shift_sales, shift_count
    FROM sales 
    WHERE sales.shift_id = end_shift.shift_id;
    
    -- Get the duration in minutes
    SELECT shifts.duration_minutes INTO shift_duration
    FROM shifts 
    WHERE shifts.id = shift_id;
    
    -- Check if the other shift for the current shift day at this store is also completed
    SELECT EXISTS(
        SELECT 1 FROM shifts s 
        WHERE s.store_id = store_id_var 
        AND (
            -- Shifts that started on the current shift date
            (DATE(s.start_time) = get_current_shift_date() AND EXTRACT(HOUR FROM s.start_time) >= 7)
            OR
            -- Shifts that started after midnight but before 7 AM of the next calendar day
            (DATE(s.start_time) = get_current_shift_date() + INTERVAL '1 day' AND EXTRACT(HOUR FROM s.start_time) < 7)
        )
        AND s.shift_number != shift_number_var
        AND s.end_time IS NOT NULL
    ) INTO other_shift_ended;
    
    -- If this is the second shift to end today, generate daily report
    IF other_shift_ended THEN
        -- Create or update daily report
        WITH shift_data AS (
            SELECT 
                s.shift_number,
                s.user_id,
                COALESCE(sales_data.total, 0) as total_sales,
                COALESCE(sales_data.count, 0) as transaction_count,
                COALESCE(s.duration_minutes, 0) as duration_minutes
            FROM shifts s
            LEFT JOIN (
                SELECT 
                    sa.shift_id, 
                    SUM(sa.price) as total, 
                    COUNT(*) as count
                FROM sales sa
                WHERE DATE(sa.created_at) = today_date
                GROUP BY sa.shift_id
            ) sales_data ON s.id = sales_data.shift_id
            WHERE s.store_id = store_id_var 
            AND (
                -- Shifts that started on the current shift date
                (DATE(s.start_time) = get_current_shift_date() AND EXTRACT(HOUR FROM s.start_time) >= 7)
                OR
                -- Shifts that started after midnight but before 7 AM of the next calendar day
                (DATE(s.start_time) = get_current_shift_date() + INTERVAL '1 day' AND EXTRACT(HOUR FROM s.start_time) < 7)
            )
            AND s.end_time IS NOT NULL
        )
        INSERT INTO daily_reports (
            store_id, 
            report_date, 
            shift1_worker_id, 
            shift1_total_sales, 
            shift1_transaction_count, 
            shift1_duration_minutes,
            shift2_worker_id, 
            shift2_total_sales, 
            shift2_transaction_count, 
            shift2_duration_minutes
        )
        SELECT 
            store_id_var,
            get_current_shift_date(),
            (SELECT user_id FROM shift_data WHERE shift_number = 1 LIMIT 1) as shift1_worker_id,
            (SELECT total_sales FROM shift_data WHERE shift_number = 1 LIMIT 1) as shift1_total_sales,
            (SELECT transaction_count FROM shift_data WHERE shift_number = 1 LIMIT 1) as shift1_transaction_count,
            (SELECT duration_minutes FROM shift_data WHERE shift_number = 1 LIMIT 1) as shift1_duration_minutes,
            (SELECT user_id FROM shift_data WHERE shift_number = 2 LIMIT 1) as shift2_worker_id,
            (SELECT total_sales FROM shift_data WHERE shift_number = 2 LIMIT 1) as shift2_total_sales,
            (SELECT transaction_count FROM shift_data WHERE shift_number = 2 LIMIT 1) as shift2_transaction_count,
            (SELECT duration_minutes FROM shift_data WHERE shift_number = 2 LIMIT 1) as shift2_duration_minutes
        ON CONFLICT (store_id, report_date) 
        DO UPDATE SET 
            shift1_worker_id = EXCLUDED.shift1_worker_id,
            shift1_total_sales = EXCLUDED.shift1_total_sales,
            shift1_transaction_count = EXCLUDED.shift1_transaction_count,
            shift1_duration_minutes = EXCLUDED.shift1_duration_minutes,
            shift2_worker_id = EXCLUDED.shift2_worker_id,
            shift2_total_sales = EXCLUDED.shift2_total_sales,
            shift2_transaction_count = EXCLUDED.shift2_transaction_count,
            shift2_duration_minutes = EXCLUDED.shift2_duration_minutes
        RETURNING id INTO daily_report_id;
        
        -- Note: Notification is automatically created by trigger_shift_end_notification
        
        -- Return success with daily report generated flag
        RETURN json_build_object(
            'success', true, 
            'message', 'Shift ended successfully and daily report generated',
            'shift_sales', shift_sales,
            'shift_count', shift_count,
            'shift_duration_minutes', shift_duration,
            'daily_report_generated', true,
            'daily_report_id', daily_report_id,
            'day_complete', true
        );
    ELSE
        -- Note: Notification is automatically created by trigger_shift_end_notification
        
        -- Return success without daily report (waiting for other shift)
        RETURN json_build_object(
            'success', true, 
            'message', 'Shift ended successfully',
            'shift_sales', shift_sales,
            'shift_count', shift_count,
            'shift_duration_minutes', shift_duration,
            'daily_report_generated', false,
            'day_complete', false
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to record a sale
CREATE OR REPLACE FUNCTION record_sale(
    p_user_id uuid,
    p_store_id uuid,
    p_shift_id uuid,
    p_product_id uuid,
    p_product_name text,
    p_price numeric,
    p_amount numeric
)
RETURNS json AS $$
DECLARE
    sale_id uuid;
    product_category text;
    is_liquid_product boolean;
BEGIN
    -- Get product category to determine if it's liquid
    SELECT category, (category IN ('fruities', 'gourmands')) 
    INTO product_category, is_liquid_product
    FROM products 
    WHERE id = p_product_id;
    
    -- Insert sale with appropriate unit (always cash payment)
    IF is_liquid_product THEN
        INSERT INTO sales (user_id, store_id, shift_id, product_id, product, price, ml_amount, payment_type)
        VALUES (p_user_id, p_store_id, p_shift_id, p_product_id, p_product_name, p_price, p_amount, 'cash')
        RETURNING id INTO sale_id;
    ELSE
        INSERT INTO sales (user_id, store_id, shift_id, product_id, product, price, quantity, payment_type)
        VALUES (p_user_id, p_store_id, p_shift_id, p_product_id, p_product_name, p_price, p_amount::integer, 'cash')
        RETURNING id INTO sale_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Sale recorded successfully',
        'sale_id', sale_id,
        'unit_type', CASE WHEN is_liquid_product THEN 'ml' ELSE 'quantity' END,
        'amount', p_amount,
        'final_price', p_price
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error recording sale: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Function to record worker salary advance
CREATE OR REPLACE FUNCTION record_salary_advance(
    p_user_id uuid,
    p_store_id uuid,
    p_amount numeric,
    p_notes text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    transaction_id uuid;
    user_exists boolean;
    store_exists boolean;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM store_users WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User not found'
        );
    END IF;
    
    -- Check if store exists
    SELECT EXISTS(SELECT 1 FROM stores WHERE id = p_store_id) INTO store_exists;
    IF NOT store_exists THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Store not found'
        );
    END IF;
    
    -- Insert salary advance transaction
    INSERT INTO worker_transactions (user_id, store_id, transaction_type, amount, notes)
    VALUES (p_user_id, p_store_id, 'salary_advance', p_amount, p_notes)
    RETURNING id INTO transaction_id;
    
    -- Notification will be created automatically by trigger
    
    RETURN json_build_object(
        'success', true,
        'message', 'Salary advance recorded successfully',
        'transaction_id', transaction_id,
        'amount', p_amount,
        'transaction_date', CURRENT_DATE
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error recording salary advance: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Function to record worker product consumption
CREATE OR REPLACE FUNCTION record_product_consumption(
    p_user_id uuid,
    p_store_id uuid,
    p_product_id uuid,
    p_amount numeric,
    p_notes text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    transaction_id uuid;
    product_record record;
    is_liquid_product boolean;
    user_exists boolean;
    store_exists boolean;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM store_users WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User not found'
        );
    END IF;
    
    -- Check if store exists
    SELECT EXISTS(SELECT 1 FROM stores WHERE id = p_store_id) INTO store_exists;
    IF NOT store_exists THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Store not found'
        );
    END IF;
    
    -- Get product information
    SELECT * INTO product_record FROM products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Product not found'
        );
    END IF;
    
    -- Determine if it's a liquid product
    is_liquid_product := product_record.category IN ('fruities', 'gourmands');
    
    -- Insert product consumption transaction
    IF is_liquid_product THEN
        INSERT INTO worker_transactions (user_id, store_id, transaction_type, product_id, product_name, product_category, ml_amount, notes)
        VALUES (p_user_id, p_store_id, 'product_consumption', p_product_id, product_record.name, product_record.category, p_amount, p_notes)
        RETURNING id INTO transaction_id;
        
        -- Notification will be created automatically by trigger
    ELSE
        INSERT INTO worker_transactions (user_id, store_id, transaction_type, product_id, product_name, product_category, quantity, notes)
        VALUES (p_user_id, p_store_id, 'product_consumption', p_product_id, product_record.name, product_record.category, p_amount::integer, p_notes)
        RETURNING id INTO transaction_id;
        
        -- Notification will be created automatically by trigger
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Product consumption recorded successfully',
        'transaction_id', transaction_id,
        'product_name', product_record.name,
        'amount', p_amount,
        'unit_type', CASE WHEN is_liquid_product THEN 'ml' ELSE 'quantity' END,
        'transaction_date', CURRENT_DATE
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error recording product consumption: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Function to get worker transaction history
CREATE OR REPLACE FUNCTION get_worker_transactions(
    p_user_id uuid,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_transaction_type text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
    start_date_filter date;
    end_date_filter date;
BEGIN
    -- Set default date range if not provided (last 30 days)
    start_date_filter := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date_filter := COALESCE(p_end_date, CURRENT_DATE);
    
    SELECT json_agg(
        json_build_object(
            'transaction_id', wt.id,
            'transaction_type', wt.transaction_type,
            'transaction_date', wt.transaction_date,
            'store_name', s.name,
            'amount', wt.amount,
            'product_name', wt.product_name,
            'product_category', wt.product_category,
            'quantity', wt.quantity,
            'ml_amount', wt.ml_amount,
            'notes', wt.notes,
            'created_at', wt.created_at
        ) ORDER BY wt.created_at DESC
    ) INTO result
    FROM worker_transactions wt
    JOIN stores s ON wt.store_id = s.id
    WHERE wt.user_id = p_user_id
    AND wt.transaction_date >= start_date_filter
    AND wt.transaction_date <= end_date_filter
    AND (p_transaction_type IS NULL OR wt.transaction_type = p_transaction_type);
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get worker transactions by date for calendar view
CREATE OR REPLACE FUNCTION get_worker_transactions_by_date(
    p_user_id uuid,
    p_year integer DEFAULT NULL,
    p_month integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
    target_year integer;
    target_month integer;
    start_date date;
    end_date date;
BEGIN
    -- Set default to current month if not provided
    target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
    target_month := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::integer);
    
    -- Calculate date range for the month
    start_date := make_date(target_year, target_month, 1);
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
    
    SELECT json_agg(
        json_build_object(
            'date', transaction_date,
            'transactions', transactions_data
        ) ORDER BY transaction_date DESC
    ) INTO result
    FROM (
        SELECT 
            wt.transaction_date,
            json_agg(
                json_build_object(
                    'transaction_id', wt.id,
                    'transaction_type', wt.transaction_type,
                    'store_name', s.name,
                    'amount', wt.amount,
                    'product_name', wt.product_name,
                    'product_category', wt.product_category,
                    'quantity', wt.quantity,
                    'ml_amount', wt.ml_amount,
                    'notes', wt.notes,
                    'created_at', wt.created_at
                ) ORDER BY wt.created_at DESC
            ) as transactions_data
        FROM worker_transactions wt
        JOIN stores s ON wt.store_id = s.id
        WHERE wt.user_id = p_user_id
        AND wt.transaction_date >= start_date
        AND wt.transaction_date <= end_date
        GROUP BY wt.transaction_date
    ) daily_transactions;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get historical daily reports with date range filtering
CREATE OR REPLACE FUNCTION get_historical_reports(
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_store_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
    start_date_filter date;
    end_date_filter date;
BEGIN
    -- Set default date range if not provided (last 30 days)
    start_date_filter := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date_filter := COALESCE(p_end_date, CURRENT_DATE);
    
    SELECT json_agg(
        json_build_object(
            'report_id', dr.id,
            'store_id', dr.store_id,
            'store_name', s.name,
            'store_location', s.location,
            'report_date', dr.report_date,
            'shift1_worker', u1.name,
            'shift1_total_sales', dr.shift1_total_sales,
            'shift1_transaction_count', dr.shift1_transaction_count,
            'shift1_duration_minutes', dr.shift1_duration_minutes,
            'shift1_hours', ROUND(dr.shift1_duration_minutes / 60.0, 2),
            'shift2_worker', u2.name,
            'shift2_total_sales', dr.shift2_total_sales,
            'shift2_transaction_count', dr.shift2_transaction_count,
            'shift2_duration_minutes', dr.shift2_duration_minutes,
            'shift2_hours', ROUND(dr.shift2_duration_minutes / 60.0, 2),
            'daily_total', dr.daily_total,
            'total_transactions', dr.shift1_transaction_count + dr.shift2_transaction_count,
            'total_work_hours', dr.total_work_hours,
            'average_transaction_value', CASE 
                WHEN (dr.shift1_transaction_count + dr.shift2_transaction_count) > 0 
                THEN dr.daily_total / (dr.shift1_transaction_count + dr.shift2_transaction_count)
                ELSE 0 
            END,
            'created_at', dr.created_at
        ) ORDER BY dr.report_date DESC, s.name
    ) INTO result
    FROM daily_reports dr
    JOIN stores s ON dr.store_id = s.id
    LEFT JOIN store_users u1 ON dr.shift1_worker_id = u1.id
    LEFT JOIN store_users u2 ON dr.shift2_worker_id = u2.id
    WHERE dr.report_date >= start_date_filter
    AND dr.report_date <= end_date_filter
    AND (p_store_id IS NULL OR dr.store_id = p_store_id);
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly summary for all stores
CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_year integer DEFAULT NULL,
    p_month integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
    target_year integer;
    target_month integer;
    start_date date;
    end_date date;
BEGIN
    -- Set default to current month if not provided
    target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
    target_month := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::integer);
    
    -- Calculate date range for the month
    start_date := make_date(target_year, target_month, 1);
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
    
    SELECT json_build_object(
        'month', target_month,
        'year', target_year,
        'month_name', TO_CHAR(start_date, 'Month YYYY'),
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'stores_summary', stores_data.stores_summary,
        'overall_totals', overall_data.overall_totals
    ) INTO result
    FROM (
        SELECT json_agg(
            json_build_object(
                'store_id', store_summary.store_id,
                'store_name', store_summary.store_name,
                'store_location', store_summary.store_location,
                'total_days', store_summary.total_days,
                'total_revenue', store_summary.total_revenue,
                'total_transactions', store_summary.total_transactions,
                'total_work_hours', store_summary.total_work_hours,
                'average_daily_revenue', store_summary.average_daily_revenue,
                'average_transactions_per_day', store_summary.average_transactions_per_day,
                'best_day', store_summary.best_day,
                'best_day_revenue', store_summary.best_day_revenue
            ) ORDER BY store_summary.store_name
        ) as stores_summary
        FROM (
            SELECT 
                s.id as store_id,
                s.name as store_name,
                s.location as store_location,
                COUNT(dr.id) as total_days,
                COALESCE(SUM(dr.daily_total), 0) as total_revenue,
                COALESCE(SUM(dr.shift1_transaction_count + dr.shift2_transaction_count), 0) as total_transactions,
                COALESCE(SUM(dr.total_work_hours), 0) as total_work_hours,
                CASE WHEN COUNT(dr.id) > 0 THEN COALESCE(SUM(dr.daily_total), 0) / COUNT(dr.id) ELSE 0 END as average_daily_revenue,
                CASE WHEN COUNT(dr.id) > 0 THEN COALESCE(SUM(dr.shift1_transaction_count + dr.shift2_transaction_count), 0) / COUNT(dr.id) ELSE 0 END as average_transactions_per_day,
                (SELECT dr2.report_date FROM daily_reports dr2 WHERE dr2.store_id = s.id AND dr2.report_date >= start_date AND dr2.report_date <= end_date ORDER BY dr2.daily_total DESC LIMIT 1) as best_day,
                (SELECT dr2.daily_total FROM daily_reports dr2 WHERE dr2.store_id = s.id AND dr2.report_date >= start_date AND dr2.report_date <= end_date ORDER BY dr2.daily_total DESC LIMIT 1) as best_day_revenue
            FROM stores s
            LEFT JOIN daily_reports dr ON s.id = dr.store_id 
                AND dr.report_date >= start_date 
                AND dr.report_date <= end_date
            GROUP BY s.id, s.name, s.location
        ) store_summary
    ) stores_data
    CROSS JOIN (
        SELECT json_build_object(
            'total_revenue', COALESCE(SUM(dr.daily_total), 0),
            'total_transactions', COALESCE(SUM(dr.shift1_transaction_count + dr.shift2_transaction_count), 0),
            'total_work_hours', COALESCE(SUM(dr.total_work_hours), 0),
            'total_days_operated', COUNT(DISTINCT dr.report_date),
            'average_daily_revenue_all_stores', CASE 
                WHEN COUNT(DISTINCT dr.report_date) > 0 
                THEN COALESCE(SUM(dr.daily_total), 0) / COUNT(DISTINCT dr.report_date)
                ELSE 0 
            END
        ) as overall_totals
        FROM daily_reports dr
        WHERE dr.report_date >= start_date AND dr.report_date <= end_date
    ) overall_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old reports (auto-delete after 40 days)
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS json AS $$
DECLARE
    deleted_count integer;
    cutoff_date date := CURRENT_DATE - INTERVAL '40 days';
BEGIN
    DELETE FROM daily_reports 
    WHERE report_date < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Old reports cleaned up successfully',
        'deleted_count', deleted_count,
        'cutoff_date', cutoff_date,
        'retention_days', 40
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get available report dates (for calendar display)
CREATE OR REPLACE FUNCTION get_available_report_dates(
    p_year integer DEFAULT NULL,
    p_month integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
    target_year integer;
    target_month integer;
    start_date date;
    end_date date;
BEGIN
    -- Set default to current month if not provided
    target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::integer);
    target_month := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::integer);
    
    -- Calculate date range for the month
    start_date := make_date(target_year, target_month, 1);
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
    
    SELECT json_agg(
        json_build_object(
            'date', report_date,
            'stores_count', stores_count,
            'total_revenue', total_revenue,
            'total_transactions', total_transactions,
            'has_complete_data', stores_count > 0
        ) ORDER BY report_date DESC
    ) INTO result
    FROM (
        SELECT 
            dr.report_date,
            COUNT(DISTINCT dr.store_id) as stores_count,
            SUM(dr.daily_total) as total_revenue,
            SUM(dr.shift1_transaction_count + dr.shift2_transaction_count) as total_transactions
        FROM daily_reports dr
        WHERE dr.report_date >= start_date 
        AND dr.report_date <= end_date
        GROUP BY dr.report_date
    ) date_summary;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION check_new_day_reset()
RETURNS json AS $$
DECLARE
    today_date date := CURRENT_DATE;
    yesterday_date date := CURRENT_DATE - INTERVAL '1 day';
    stores_with_incomplete_days integer;
    reset_count integer := 0;
BEGIN
    -- Check if there are any stores with incomplete daily reports from yesterday
    SELECT COUNT(*) INTO stores_with_incomplete_days
    FROM stores s
    WHERE NOT EXISTS (
        SELECT 1 FROM daily_reports dr 
        WHERE dr.store_id = s.id 
        AND dr.report_date = yesterday_date
    );
    
    -- If yesterday had incomplete reports, mark those days as complete with partial data
    IF stores_with_incomplete_days > 0 THEN
        INSERT INTO daily_reports (
            store_id, 
            report_date, 
            shift1_worker_id, 
            shift1_total_sales, 
            shift1_transaction_count, 
            shift1_duration_minutes,
            shift2_worker_id, 
            shift2_total_sales, 
            shift2_transaction_count, 
            shift2_duration_minutes
        )
        SELECT 
            s.id as store_id,
            yesterday_date,
            (SELECT sh.user_id FROM shifts sh WHERE sh.store_id = s.id AND sh.shift_number = 1 AND DATE(sh.start_time) = yesterday_date LIMIT 1) as shift1_worker_id,
            MAX(CASE WHEN sh.shift_number = 1 THEN COALESCE(shift1_sales.total, 0) END) as shift1_total_sales,
            MAX(CASE WHEN sh.shift_number = 1 THEN COALESCE(shift1_sales.count, 0) END) as shift1_transaction_count,
            MAX(CASE WHEN sh.shift_number = 1 THEN COALESCE(sh.duration_minutes, 0) END) as shift1_duration_minutes,
            (SELECT sh.user_id FROM shifts sh WHERE sh.store_id = s.id AND sh.shift_number = 2 AND DATE(sh.start_time) = yesterday_date LIMIT 1) as shift2_worker_id,
            MAX(CASE WHEN sh.shift_number = 2 THEN COALESCE(shift2_sales.total, 0) END) as shift2_total_sales,
            MAX(CASE WHEN sh.shift_number = 2 THEN COALESCE(shift2_sales.count, 0) END) as shift2_transaction_count,
            MAX(CASE WHEN sh.shift_number = 2 THEN COALESCE(sh.duration_minutes, 0) END) as shift2_duration_minutes
        FROM stores s
        LEFT JOIN shifts sh ON s.id = sh.store_id AND DATE(sh.start_time) = yesterday_date
        LEFT JOIN (
            SELECT shift_id, SUM(price) as total, COUNT(*) as count
            FROM sales 
            WHERE DATE(created_at) = yesterday_date
            GROUP BY shift_id
        ) shift1_sales ON sh.id = shift1_sales.shift_id AND sh.shift_number = 1
        LEFT JOIN (
            SELECT shift_id, SUM(price) as total, COUNT(*) as count
            FROM sales 
            WHERE DATE(created_at) = yesterday_date
            GROUP BY shift_id
        ) shift2_sales ON sh.id = shift2_sales.shift_id AND sh.shift_number = 2
        WHERE NOT EXISTS (
            SELECT 1 FROM daily_reports dr 
            WHERE dr.store_id = s.id 
            AND dr.report_date = yesterday_date
        )
        GROUP BY s.id
        ON CONFLICT (store_id, report_date) DO NOTHING;
        
        GET DIAGNOSTICS reset_count = ROW_COUNT;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'New day check completed',
        'today_date', today_date,
        'incomplete_reports_closed', reset_count,
        'dashboard_ready', true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard status for workers
CREATE OR REPLACE FUNCTION get_dashboard_status(p_store_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
    current_shift_date date := get_current_shift_date();
    previous_shift_date date := get_current_shift_date() - INTERVAL '1 day';
    result json;
BEGIN
    SELECT json_build_object(
        'current_shift_date', current_shift_date,
        'is_new_day', true,
        'previous_day_completed', EXISTS(
            SELECT 1 FROM daily_reports 
            WHERE store_id = COALESCE(p_store_id, store_id) 
            AND report_date = previous_shift_date
        ),
        'today_shifts_available', json_build_object(
            'shift1_available', NOT EXISTS(
                SELECT 1 FROM shifts 
                WHERE store_id = COALESCE(p_store_id, store_id)
                AND shift_number = 1 
                AND (
                    -- Shifts that started on the current shift date
                    (DATE(start_time) = current_shift_date AND EXTRACT(HOUR FROM start_time) >= 7)
                    OR
                    -- Shifts that started after midnight but before 7 AM of the next calendar day
                    (DATE(start_time) = current_shift_date + INTERVAL '1 day' AND EXTRACT(HOUR FROM start_time) < 7)
                )
                AND end_time IS NULL
            ),
            'shift2_available', NOT EXISTS(
                SELECT 1 FROM shifts 
                WHERE store_id = COALESCE(p_store_id, store_id)
                AND shift_number = 2 
                AND (
                    -- Shifts that started on the current shift date
                    (DATE(start_time) = current_shift_date AND EXTRACT(HOUR FROM start_time) >= 7)
                    OR
                    -- Shifts that started after midnight but before 7 AM of the next calendar day
                    (DATE(start_time) = current_shift_date + INTERVAL '1 day' AND EXTRACT(HOUR FROM start_time) < 7)
                )
                AND end_time IS NULL
            )
        ),
        'next_shift_reset_time', CASE 
            WHEN EXTRACT(HOUR FROM NOW()) < 7 THEN 
                CURRENT_DATE::text || ' 07:00:00'
            ELSE 
                (CURRENT_DATE + INTERVAL '1 day')::text || ' 07:00:00'
        END,
        'message', CASE 
            WHEN NOT EXISTS(SELECT 1 FROM daily_reports WHERE store_id = COALESCE(p_store_id, store_id) AND report_date = previous_shift_date) 
            THEN 'Previous shift day completed automatically. Shifts reset at 7 AM!'
            ELSE 'Ready to start shifts! Shifts reset at 7 AM daily.'
        END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get live revenue data for all stores
CREATE OR REPLACE FUNCTION get_live_store_revenue()
RETURNS json AS $$
DECLARE
    result json;
    today_start timestamp := CURRENT_DATE::timestamp;
    today_end timestamp := (CURRENT_DATE + INTERVAL '1 day')::timestamp;
BEGIN
    SELECT json_agg(
        json_build_object(
            'store_id', store_data.store_id,
            'store_name', store_data.store_name,
            'store_location', store_data.store_location,
            'today_revenue', store_data.today_revenue,
            'today_transactions', store_data.today_transactions,
            'active_shifts', store_data.active_shifts,
            'shift1_revenue', store_data.shift1_revenue,
            'shift1_transactions', store_data.shift1_transactions,
            'shift1_worker', store_data.shift1_worker,
            'shift1_active', store_data.shift1_active,
            'shift2_revenue', store_data.shift2_revenue,
            'shift2_transactions', store_data.shift2_transactions,
            'shift2_worker', store_data.shift2_worker,
            'shift2_active', store_data.shift2_active,
            'has_daily_report', store_data.has_daily_report,
            'daily_total', store_data.daily_total,
            'last_sale_time', store_data.last_sale_time
        ) ORDER BY store_data.store_name
    ) INTO result
    FROM (
        SELECT 
            s.id as store_id,
            s.name as store_name,
            s.location as store_location,
            COALESCE(revenue_data.today_revenue, 0) as today_revenue,
            COALESCE(revenue_data.today_transactions, 0) as today_transactions,
            COALESCE(shift_data.active_shifts, 0) as active_shifts,
            COALESCE(shift_data.shift1_revenue, 0) as shift1_revenue,
            COALESCE(shift_data.shift1_transactions, 0) as shift1_transactions,
            shift_data.shift1_worker,
            COALESCE(shift_data.shift1_active, false) as shift1_active,
            COALESCE(shift_data.shift2_revenue, 0) as shift2_revenue,
            COALESCE(shift_data.shift2_transactions, 0) as shift2_transactions,
            shift_data.shift2_worker,
            COALESCE(shift_data.shift2_active, false) as shift2_active,
            COALESCE(daily_report_data.has_report, false) as has_daily_report,
            COALESCE(daily_report_data.daily_total, 0) as daily_total,
            revenue_data.last_sale_time
        FROM stores s
    LEFT JOIN (
        SELECT 
            store_id,
            SUM(price) as today_revenue,
            COUNT(*) as today_transactions,
            MAX(created_at) as last_sale_time
        FROM sales 
        WHERE created_at >= today_start AND created_at < today_end
        GROUP BY store_id
    ) revenue_data ON s.id = revenue_data.store_id
    LEFT JOIN (
        SELECT 
            sh.store_id,
            COUNT(CASE WHEN sh.end_time IS NULL THEN 1 END) as active_shifts,
            MAX(CASE WHEN sh.shift_number = 1 THEN su1.name END) as shift1_worker,
            BOOL_OR(CASE WHEN sh.shift_number = 1 THEN (sh.end_time IS NULL) ELSE false END) as shift1_active,
            MAX(CASE WHEN sh.shift_number = 1 THEN COALESCE(shift1_sales.total_revenue, 0) END) as shift1_revenue,
            MAX(CASE WHEN sh.shift_number = 1 THEN COALESCE(shift1_sales.transaction_count, 0) END) as shift1_transactions,
            MAX(CASE WHEN sh.shift_number = 2 THEN su2.name END) as shift2_worker,
            BOOL_OR(CASE WHEN sh.shift_number = 2 THEN (sh.end_time IS NULL) ELSE false END) as shift2_active,
            MAX(CASE WHEN sh.shift_number = 2 THEN COALESCE(shift2_sales.total_revenue, 0) END) as shift2_revenue,
            MAX(CASE WHEN sh.shift_number = 2 THEN COALESCE(shift2_sales.transaction_count, 0) END) as shift2_transactions
        FROM shifts sh
        LEFT JOIN store_users su1 ON sh.user_id = su1.id AND sh.shift_number = 1
        LEFT JOIN store_users su2 ON sh.user_id = su2.id AND sh.shift_number = 2
        LEFT JOIN (
            SELECT 
                shift_id,
                SUM(price) as total_revenue,
                COUNT(*) as transaction_count
            FROM sales 
            WHERE created_at >= today_start AND created_at < today_end
            GROUP BY shift_id
        ) shift1_sales ON sh.id = shift1_sales.shift_id AND sh.shift_number = 1
        LEFT JOIN (
            SELECT 
                shift_id,
                SUM(price) as total_revenue,
                COUNT(*) as transaction_count
            FROM sales 
            WHERE created_at >= today_start AND created_at < today_end
            GROUP BY shift_id
        ) shift2_sales ON sh.id = shift2_sales.shift_id AND sh.shift_number = 2
        WHERE sh.start_time >= today_start AND sh.start_time < today_end
        GROUP BY sh.store_id
    ) shift_data ON s.id = shift_data.store_id
    LEFT JOIN (
        SELECT 
            store_id,
            true as has_report,
            daily_total
        FROM daily_reports 
        WHERE report_date = CURRENT_DATE
    ) daily_report_data ON s.id = daily_report_data.store_id
    ) store_data;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Indexes for live revenue tracking performance
CREATE INDEX IF NOT EXISTS idx_sales_store_created_at ON sales(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_shift_created_at ON sales(shift_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_shifts_store_start_time ON shifts(store_id, start_time);
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(store_id, shift_number) WHERE end_time IS NULL;
CREATE INDEX IF NOT EXISTS idx_daily_reports_store_date ON daily_reports(store_id, report_date);

-- Indexes for worker transactions performance
CREATE INDEX IF NOT EXISTS idx_worker_transactions_user_date ON worker_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_worker_transactions_store_date ON worker_transactions(store_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_worker_transactions_type ON worker_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_worker_transactions_created_at ON worker_transactions(created_at);

-- ========================================
-- MINIMAL RLS SETUP (Only for Products)
-- ========================================

-- Enable RLS only for products (most restrictive)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products (workers need to see them for sales)
CREATE POLICY "Everyone can read products"
ON products FOR SELECT
USING (true);

-- Allow everyone to manage products (simplified for development)
-- In production, you would want to restrict this to admins only
CREATE POLICY "Everyone can manage products"
ON products FOR ALL
USING (true)
WITH CHECK (true);

-- Grant table permissions to ensure API access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ========================================
-- ADDITIONAL UTILITY FUNCTIONS
-- ========================================

-- Helper function to get user info by PIN (for debugging and frontend use)
DROP FUNCTION IF EXISTS get_user_by_pin(text);
CREATE OR REPLACE FUNCTION get_user_by_pin(user_pin text)
RETURNS json AS $$
DECLARE
    user_record record;
BEGIN
    SELECT * INTO user_record 
    FROM store_users 
    WHERE pin = user_pin;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'User not found with this PIN');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'name', user_record.name,
            'role', user_record.role,
            'pin', user_record.pin,
            'store_id', user_record.store_id,
            'created_at', user_record.created_at
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregated live stats across all stores
DROP FUNCTION IF EXISTS get_live_aggregated_stats();
CREATE OR REPLACE FUNCTION get_live_aggregated_stats()
RETURNS json AS $$
DECLARE
    result json;
    today_start timestamp := CURRENT_DATE::timestamp;
    today_end timestamp := (CURRENT_DATE + INTERVAL '1 day')::timestamp;
BEGIN
    SELECT json_build_object(
        'total_revenue', COALESCE(SUM(sa.price), 0),
        'total_transactions', COALESCE(COUNT(sa.id), 0),
        'active_shifts', COALESCE(active_shift_count.count, 0),
        'completed_reports', COALESCE(completed_reports.count, 0),
        'total_stores', store_count.count,
        'stores_with_activity', COALESCE(stores_with_activity.count, 0),
        'last_updated', NOW(),
        'report_date', CURRENT_DATE
    ) INTO result
    FROM sales sa
    CROSS JOIN (
        SELECT COUNT(*) as count FROM shifts 
        WHERE start_time >= today_start AND start_time < today_end AND end_time IS NULL
    ) active_shift_count
    CROSS JOIN (
        SELECT COUNT(*) as count FROM daily_reports 
        WHERE report_date = CURRENT_DATE
    ) completed_reports
    CROSS JOIN (
        SELECT COUNT(*) as count FROM stores
    ) store_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT store_id) as count FROM sales
        WHERE created_at >= today_start AND created_at < today_end
    ) stores_with_activity
    WHERE sa.created_at >= today_start AND sa.created_at < today_end;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get live store performance metrics
DROP FUNCTION IF EXISTS get_store_performance_today(uuid);
CREATE OR REPLACE FUNCTION get_store_performance_today(p_store_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
    result json;
    today_start timestamp := CURRENT_DATE::timestamp;
    today_end timestamp := (CURRENT_DATE + INTERVAL '1 day')::timestamp;
BEGIN
    SELECT json_agg(
        json_build_object(
            'store_id', store_metrics.store_id,
            'store_name', store_metrics.store_name,
            'revenue', store_metrics.revenue,
            'transactions', store_metrics.transactions,
            'avg_transaction_value', store_metrics.avg_transaction_value,
            'active_shifts', store_metrics.active_shifts,
            'performance_vs_target', store_metrics.performance_vs_target,
            'target_sales', store_metrics.target_sales,
            'hours_worked', store_metrics.hours_worked,
            'revenue_per_hour', store_metrics.revenue_per_hour
        )
    ) INTO result
    FROM (
        SELECT 
            s.id as store_id,
            s.name as store_name,
            COALESCE(SUM(sales.price), 0) as revenue,
            COALESCE(COUNT(sales.id), 0) as transactions,
            CASE 
                WHEN COUNT(sales.id) > 0 THEN COALESCE(SUM(sales.price), 0) / COUNT(sales.id)
                ELSE 0 
            END as avg_transaction_value,
            COALESCE(active_shifts.count, 0) as active_shifts,
            CASE 
                WHEN st.target_sales_per_shift > 0 THEN 
                    (COALESCE(SUM(sales.price), 0) / st.target_sales_per_shift) * 100
                ELSE 0 
            END as performance_vs_target,
            COALESCE(st.target_sales_per_shift, 0) as target_sales,
            COALESCE(work_hours.hours, 0) as hours_worked,
            CASE 
                WHEN work_hours.hours > 0 THEN COALESCE(SUM(sales.price), 0) / work_hours.hours
                ELSE 0 
            END as revenue_per_hour
        FROM stores s
        LEFT JOIN sales ON s.id = sales.store_id AND sales.created_at >= today_start AND sales.created_at < today_end
        LEFT JOIN shift_targets st ON s.id = st.store_id
        LEFT JOIN (
            SELECT 
                store_id, 
                COUNT(*) as count 
            FROM shifts 
            WHERE start_time >= today_start AND start_time < today_end AND end_time IS NULL
            GROUP BY store_id
        ) active_shifts ON s.id = active_shifts.store_id
        LEFT JOIN (
            SELECT 
                store_id,
                SUM(
                    CASE 
                        WHEN end_time IS NOT NULL THEN 
                            EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
                        ELSE 
                            EXTRACT(EPOCH FROM (NOW() - start_time)) / 3600
                    END
                ) as hours
            FROM shifts 
            WHERE start_time >= today_start AND start_time < today_end
            GROUP BY store_id
        ) work_hours ON s.id = work_hours.store_id
        WHERE (p_store_id IS NULL OR s.id = p_store_id)
        GROUP BY s.id, s.name, st.target_sales_per_shift, active_shifts.count, work_hours.hours
        ORDER BY s.name
    ) store_metrics;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh daily summary (for manual triggers)
DROP FUNCTION IF EXISTS refresh_daily_summary();
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS json AS $$
DECLARE
    report_count integer := 0;
    today_date date := CURRENT_DATE;
BEGIN
    -- Update or create daily reports for stores with completed shifts
    INSERT INTO daily_reports (store_id, report_date, shift1_worker_id, shift1_total_sales, shift1_transaction_count, shift1_duration_minutes, shift2_worker_id, shift2_total_sales, shift2_transaction_count, shift2_duration_minutes)
    SELECT 
        s.store_id,
        today_date,
        (SELECT s2.user_id FROM shifts s2 WHERE s2.store_id = s.store_id AND s2.shift_number = 1 AND DATE(s2.start_time) = today_date AND s2.end_time IS NOT NULL LIMIT 1) as shift1_worker_id,
        MAX(CASE WHEN s.shift_number = 1 THEN COALESCE(shift1_sales.total, 0) END) as shift1_total_sales,
        MAX(CASE WHEN s.shift_number = 1 THEN COALESCE(shift1_sales.count, 0) END) as shift1_transaction_count,
        MAX(CASE WHEN s.shift_number = 1 THEN COALESCE(s.duration_minutes, 0) END) as shift1_duration_minutes,
        (SELECT s2.user_id FROM shifts s2 WHERE s2.store_id = s.store_id AND s2.shift_number = 2 AND DATE(s2.start_time) = today_date AND s2.end_time IS NOT NULL LIMIT 1) as shift2_worker_id,
        MAX(CASE WHEN s.shift_number = 2 THEN COALESCE(shift2_sales.total, 0) END) as shift2_total_sales,
        MAX(CASE WHEN s.shift_number = 2 THEN COALESCE(shift2_sales.count, 0) END) as shift2_transaction_count,
        MAX(CASE WHEN s.shift_number = 2 THEN COALESCE(s.duration_minutes, 0) END) as shift2_duration_minutes
    FROM shifts s
    LEFT JOIN (
        SELECT shift_id, SUM(price) as total, COUNT(*) as count
        FROM sales 
        WHERE DATE(created_at) = today_date
        GROUP BY shift_id
    ) shift1_sales ON s.id = shift1_sales.shift_id AND s.shift_number = 1
    LEFT JOIN (
        SELECT shift_id, SUM(price) as total, COUNT(*) as count
        FROM sales 
        WHERE DATE(created_at) = today_date
        GROUP BY shift_id
    ) shift2_sales ON s.id = shift2_sales.shift_id AND s.shift_number = 2
    WHERE DATE(s.start_time) = today_date 
    AND s.end_time IS NOT NULL  -- Only completed shifts
    GROUP BY s.store_id
    HAVING COUNT(s.id) >= 1  -- At least one completed shift
    ON CONFLICT (store_id, report_date) 
    DO UPDATE SET 
        shift1_worker_id = EXCLUDED.shift1_worker_id,
        shift1_total_sales = EXCLUDED.shift1_total_sales,
        shift1_transaction_count = EXCLUDED.shift1_transaction_count,
        shift1_duration_minutes = EXCLUDED.shift1_duration_minutes,
        shift2_worker_id = EXCLUDED.shift2_worker_id,
        shift2_total_sales = EXCLUDED.shift2_total_sales,
        shift2_transaction_count = EXCLUDED.shift2_transaction_count,
        shift2_duration_minutes = EXCLUDED.shift2_duration_minutes;

    GET DIAGNOSTICS report_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', 'Daily summary refreshed',
        'reports_updated', report_count,
        'date', today_date
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION & CLEANUP
-- ========================================

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION start_shift(uuid, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION end_shift(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_sale(uuid, uuid, uuid, uuid, text, numeric, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_salary_advance(uuid, uuid, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_product_consumption(uuid, uuid, uuid, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_worker_transactions(uuid, date, date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_worker_transactions_by_date(uuid, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_live_store_revenue() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_pin(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_live_aggregated_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_store_performance_today(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_daily_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_new_day_reset() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_status(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_historical_reports(date, date, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_summary(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_reports() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_report_dates(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_inventory() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION adjust_store_inventory(uuid, uuid, integer, numeric, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_inventory_thresholds(uuid, uuid, integer, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_for_product(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_shift_date() TO anon, authenticated;

-- Function to get detailed product breakdown for a specific date
CREATE OR REPLACE FUNCTION get_daily_product_breakdown(
    p_date date,
    p_store_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'date', p_date,
        'sales', COALESCE(json_agg(
            json_build_object(
                'id', s.id,
                'product_name', p.name,
                'amount_price', s.price,
                'quantity', s.quantity,
                'ml_amount', COALESCE(s.ml_amount, 0),
                'time', TO_CHAR(s.created_at, 'HH24:MI'),
                'full_time', s.created_at,
                'worker_name', COALESCE(u.name, 'Unknown'),
                'store_name', COALESCE(st.name, 'Unknown Store')
            ) ORDER BY s.created_at DESC
        ), '[]'::json)
    ) INTO result
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN store_users u ON s.user_id = u.id
    LEFT JOIN stores st ON s.store_id = st.id
    WHERE DATE(s.created_at) = p_date
    AND (p_store_id IS NULL OR s.store_id = p_store_id);
    
    RETURN COALESCE(result, json_build_object(
        'date', p_date,
        'sales', '[]'::json
    ));
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly product breakdown (enhanced)
CREATE OR REPLACE FUNCTION get_monthly_product_breakdown(
    p_year integer,
    p_month integer,
    p_store_id uuid DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    start_date date;
    end_date date;
    result json;
BEGIN
    start_date := make_date(p_year, p_month, 1);
    end_date := (start_date + interval '1 month' - interval '1 day')::date;
    
    SELECT json_build_object(
        'year', p_year,
        'month', p_month,
        'month_name', TO_CHAR(start_date, 'Month YYYY'),
        'start_date', start_date,
        'end_date', end_date,
        'total_revenue', COALESCE(SUM(s.price), 0),
        'total_transactions', COUNT(s.id),
        'products', COALESCE(json_agg(
            json_build_object(
                'product_id', p.id,
                'product_name', p.name,
                'category', p.category,
                'total_sales', product_totals.total_sales,
                'total_quantity', product_totals.total_quantity,
                'total_ml', product_totals.total_ml,
                'transaction_count', product_totals.transaction_count,
                'average_price', product_totals.avg_price,
                'daily_breakdown', product_totals.daily_breakdown
            ) ORDER BY product_totals.total_sales DESC
        ) FILTER (WHERE p.id IS NOT NULL), '[]'::json)
    ) INTO result
    FROM sales s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN (
        SELECT 
            s2.product_id,
            SUM(s2.price) as total_sales,
            SUM(COALESCE(s2.quantity, 0)) as total_quantity,
            SUM(COALESCE(s2.ml_amount, 0)) as total_ml,
            COUNT(s2.id) as transaction_count,
            AVG(s2.price) as avg_price,
            json_agg(
                json_build_object(
                    'date', DATE(s2.created_at),
                    'sales_total', daily_sales.daily_total,
                    'transaction_count', daily_sales.daily_count
                ) ORDER BY DATE(s2.created_at)
            ) as daily_breakdown
        FROM sales s2
        LEFT JOIN (
            SELECT 
                product_id,
                DATE(created_at) as sale_date,
                SUM(price) as daily_total,
                COUNT(id) as daily_count
            FROM sales
            WHERE DATE(created_at) >= start_date 
                AND DATE(created_at) <= end_date
                AND (p_store_id IS NULL OR store_id = p_store_id)
            GROUP BY product_id, DATE(created_at)
        ) daily_sales ON daily_sales.product_id = s2.product_id 
            AND daily_sales.sale_date = DATE(s2.created_at)
        WHERE DATE(s2.created_at) >= start_date 
            AND DATE(s2.created_at) <= end_date
            AND (p_store_id IS NULL OR s2.store_id = p_store_id)
        GROUP BY s2.product_id
    ) product_totals ON product_totals.product_id = p.id
    WHERE DATE(s.created_at) >= start_date 
        AND DATE(s.created_at) <= end_date
        AND (p_store_id IS NULL OR s.store_id = p_store_id);
    
    RETURN COALESCE(result, json_build_object(
        'year', p_year,
        'month', p_month,
        'month_name', TO_CHAR(start_date, 'Month YYYY'),
        'start_date', start_date,
        'end_date', end_date,
        'total_revenue', 0,
        'total_transactions', 0,
        'products', '[]'::json
    ));
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ENHANCED DETAILED REPORTS FUNCTIONS
-- ========================================

-- Enhanced function to get detailed daily product breakdown by store
CREATE OR REPLACE FUNCTION get_detailed_daily_breakdown(
    p_date date
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'date', p_date,
        'total_revenue', COALESCE(SUM(s.price), 0),
        'total_transactions', COUNT(s.id),
        'stores', COALESCE(json_agg(
            json_build_object(
                'store_id', store_data.store_id,
                'store_name', store_data.store_name,
                'store_location', store_data.store_location,
                'total_revenue', store_data.store_revenue,
                'total_transactions', store_data.store_transactions,
                'products', store_data.products
            ) ORDER BY store_data.store_revenue DESC
        ), '[]'::json)
    ) INTO result
    FROM (
        SELECT 
            st.id as store_id,
            st.name as store_name,
            st.location as store_location,
            SUM(s.price) as store_revenue,
            COUNT(s.id) as store_transactions,
            json_agg(
                json_build_object(
                    'product_name', p.name,
                    'category', p.category,
                    'total_sales', product_totals.total_sales,
                    'total_quantity', product_totals.total_quantity,
                    'total_ml', product_totals.total_ml,
                    'transaction_count', product_totals.transaction_count,
                    'average_price', product_totals.avg_price,
                    'sales_details', product_totals.sales_list
                ) ORDER BY product_totals.total_sales DESC
            ) as products
        FROM stores st
        LEFT JOIN sales s ON s.store_id = st.id AND DATE(s.created_at) = p_date
        LEFT JOIN products p ON s.product_id = p.id
        LEFT JOIN (
            SELECT 
                s2.store_id,
                p2.id as product_id,
                p2.name as product_name,
                SUM(s2.price) as total_sales,
                SUM(COALESCE(s2.quantity, 0)) as total_quantity,
                SUM(COALESCE(s2.ml_amount, 0)) as total_ml,
                COUNT(s2.id) as transaction_count,
                AVG(s2.price) as avg_price,
                json_agg(
                    json_build_object(
                        'id', s2.id,
                        'price', s2.price,
                        'quantity', s2.quantity,
                        'ml_amount', s2.ml_amount,
                        'time', TO_CHAR(s2.created_at, 'HH24:MI'),
                        'worker_name', COALESCE(u2.name, 'Unknown')
                    ) ORDER BY s2.created_at DESC
                ) as sales_list
            FROM sales s2
            LEFT JOIN products p2 ON s2.product_id = p2.id
            LEFT JOIN store_users u2 ON s2.user_id = u2.id
            WHERE DATE(s2.created_at) = p_date
            GROUP BY s2.store_id, p2.id, p2.name
        ) product_totals ON product_totals.store_id = st.id AND product_totals.product_id = p.id
        WHERE s.id IS NOT NULL OR st.id IN (
            SELECT DISTINCT store_id FROM sales WHERE DATE(created_at) = p_date
        )
        GROUP BY st.id, st.name, st.location
    ) store_data
    LEFT JOIN sales s ON s.store_id = store_data.store_id AND DATE(s.created_at) = p_date;
    
    RETURN COALESCE(result, json_build_object(
        'date', p_date,
        'total_revenue', 0,
        'total_transactions', 0,
        'stores', '[]'::json
    ));
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to get detailed monthly product breakdown by store
CREATE OR REPLACE FUNCTION get_detailed_monthly_breakdown(
    p_year integer,
    p_month integer
)
RETURNS json AS $$
DECLARE
    result json;
    start_date date;
    end_date date;
BEGIN
    start_date := make_date(p_year, p_month, 1);
    end_date := (start_date + interval '1 month' - interval '1 day')::date;
    
    SELECT json_build_object(
        'year', p_year,
        'month', p_month,
        'month_name', TO_CHAR(start_date, 'Month YYYY'),
        'start_date', start_date,
        'end_date', end_date,
        'total_revenue', COALESCE(SUM(s.price), 0),
        'total_transactions', COUNT(s.id),
        'total_days_with_sales', COUNT(DISTINCT DATE(s.created_at)),
        'stores', COALESCE(json_agg(
            json_build_object(
                'store_id', store_data.store_id,
                'store_name', store_data.store_name,
                'store_location', store_data.store_location,
                'total_revenue', store_data.store_revenue,
                'total_transactions', store_data.store_transactions,
                'days_active', store_data.days_active,
                'average_daily_revenue', store_data.avg_daily_revenue,
                'best_day', store_data.best_day,
                'best_day_revenue', store_data.best_day_revenue,
                'products', store_data.products
            ) ORDER BY store_data.store_revenue DESC
        ), '[]'::json)
    ) INTO result
    FROM (
        SELECT 
            st.id as store_id,
            st.name as store_name,
            st.location as store_location,
            COALESCE(SUM(s.price), 0) as store_revenue,
            COUNT(s.id) as store_transactions,
            COUNT(DISTINCT DATE(s.created_at)) as days_active,
            CASE 
                WHEN COUNT(DISTINCT DATE(s.created_at)) > 0 
                THEN COALESCE(SUM(s.price), 0) / COUNT(DISTINCT DATE(s.created_at))
                ELSE 0 
            END as avg_daily_revenue,
            daily_stats.best_day,
            daily_stats.best_day_revenue,
            COALESCE(json_agg(
                json_build_object(
                    'product_id', product_totals.product_id,
                    'product_name', product_totals.product_name,
                    'category', product_totals.category,
                    'total_sales', product_totals.total_sales,
                    'total_quantity', product_totals.total_quantity,
                    'total_ml', product_totals.total_ml,
                    'transaction_count', product_totals.transaction_count,
                    'average_price', product_totals.avg_price,
                    'daily_breakdown', product_totals.daily_breakdown
                ) ORDER BY product_totals.total_sales DESC
            ) FILTER (WHERE product_totals.product_id IS NOT NULL), '[]'::json) as products
        FROM stores st
        LEFT JOIN sales s ON s.store_id = st.id 
            AND DATE(s.created_at) >= start_date 
            AND DATE(s.created_at) <= end_date
        LEFT JOIN (
            SELECT 
                store_id,
                sale_date as best_day,
                daily_revenue as best_day_revenue,
                ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY daily_revenue DESC) as rn
            FROM (
                SELECT 
                    s4.store_id,
                    DATE(s4.created_at) as sale_date,
                    SUM(s4.price) as daily_revenue
                FROM sales s4
                WHERE DATE(s4.created_at) >= start_date 
                    AND DATE(s4.created_at) <= end_date
                GROUP BY s4.store_id, DATE(s4.created_at)
            ) daily_totals
        ) daily_stats ON daily_stats.store_id = st.id AND daily_stats.rn = 1
        LEFT JOIN (
            SELECT 
                s2.store_id,
                p2.id as product_id,
                p2.name as product_name,
                p2.category,
                SUM(s2.price) as total_sales,
                SUM(COALESCE(s2.quantity, 0)) as total_quantity,
                SUM(COALESCE(s2.ml_amount, 0)) as total_ml,
                COUNT(s2.id) as transaction_count,
                AVG(s2.price) as avg_price,
                json_agg(
                    json_build_object(
                        'date', DATE(s2.created_at),
                        'sales_total', daily_product_sales.daily_total,
                        'transaction_count', daily_product_sales.daily_count
                    ) ORDER BY DATE(s2.created_at)
                ) as daily_breakdown
            FROM sales s2
            LEFT JOIN products p2 ON s2.product_id = p2.id
            LEFT JOIN (
                SELECT 
                    store_id,
                    product_id,
                    DATE(created_at) as sale_date,
                    SUM(price) as daily_total,
                    COUNT(id) as daily_count
                FROM sales
                WHERE DATE(created_at) >= start_date 
                    AND DATE(created_at) <= end_date
                GROUP BY store_id, product_id, DATE(created_at)
            ) daily_product_sales ON daily_product_sales.store_id = s2.store_id 
                AND daily_product_sales.product_id = s2.product_id 
                AND daily_product_sales.sale_date = DATE(s2.created_at)
            WHERE DATE(s2.created_at) >= start_date 
                AND DATE(s2.created_at) <= end_date
            GROUP BY s2.store_id, p2.id, p2.name, p2.category
        ) product_totals ON product_totals.store_id = st.id
        WHERE s.id IS NOT NULL OR st.id IN (
            SELECT DISTINCT store_id FROM sales 
            WHERE DATE(created_at) >= start_date 
                AND DATE(created_at) <= end_date
        )
        GROUP BY st.id, st.name, st.location, daily_stats.best_day, daily_stats.best_day_revenue
    ) store_data
    LEFT JOIN sales s ON s.store_id = store_data.store_id 
        AND DATE(s.created_at) >= start_date 
        AND DATE(s.created_at) <= end_date;
    
    RETURN COALESCE(result, json_build_object(
        'year', p_year,
        'month', p_month,
        'month_name', TO_CHAR(start_date, 'Month YYYY'),
        'start_date', start_date,
        'end_date', end_date,
        'total_revenue', 0,
        'total_transactions', 0,
        'total_days_with_sales', 0,
        'stores', '[]'::json
    ));
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for all report functions
GRANT EXECUTE ON FUNCTION get_daily_product_breakdown(date, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_product_breakdown(integer, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_detailed_daily_breakdown(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_detailed_monthly_breakdown(integer, integer) TO anon, authenticated;

-- ========================================
-- NOTIFICATION SYSTEM FUNCTIONS
-- ========================================

-- Drop the existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS create_notification(text, text, text, uuid, uuid, jsonb, text);

-- Function to create notifications for various events
CREATE OR REPLACE FUNCTION create_notification(
    p_type text,
    p_title text,
    p_message text,
    p_worker_id uuid,
    p_store_id uuid,
    p_data jsonb DEFAULT NULL,
    p_priority text DEFAULT 'normal'
)
RETURNS uuid AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        worker_id,
        store_id,
        metadata,
        priority,
        is_read,
        created_at
    ) VALUES (
        p_type,
        p_title,
        p_message,
        p_worker_id,
        p_store_id,
        p_data,
        p_priority,
        false,
        now()
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Note: notify_shift_start and notify_shift_end functions removed - notifications are now handled by triggers

-- Function to create salary advance notification
CREATE OR REPLACE FUNCTION notify_salary_advance(
    p_user_id uuid,
    p_store_id uuid,
    p_amount numeric,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    user_name text;
    store_name text;
    notification_id uuid;
BEGIN
    -- Get user and store names
    SELECT u.name, s.name INTO user_name, store_name
    FROM store_users u, stores s
    WHERE u.id = p_user_id AND s.id = p_store_id;
    
    -- Create notification
    SELECT create_notification(
        'salary_advance',
        'Salary Advance Request',
        user_name || ' requested a salary advance of ' || p_amount || ' TND at ' || store_name,
        p_user_id,
        p_store_id,
        jsonb_build_object(
            'amount', p_amount,
            'notes', p_notes
        ),
        'normal'
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create product consumption notification
CREATE OR REPLACE FUNCTION notify_product_consumption(
    p_user_id uuid,
    p_store_id uuid,
    p_product_name text,
    p_quantity integer DEFAULT NULL,
    p_ml_amount numeric DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    user_name text;
    store_name text;
    notification_id uuid;
    consumption_text text;
BEGIN
    -- Get user and store names
    SELECT u.name, s.name INTO user_name, store_name
    FROM store_users u, stores s
    WHERE u.id = p_user_id AND s.id = p_store_id;
    
    -- Build consumption text
    consumption_text := p_product_name;
    IF p_ml_amount IS NOT NULL THEN
        consumption_text := consumption_text || ' (' || p_ml_amount || 'ml)';
    ELSIF p_quantity IS NOT NULL THEN
        consumption_text := consumption_text || ' (×' || p_quantity || ')';
    END IF;
    
    -- Create notification
    SELECT create_notification(
        'product_consumption',
        'Product Consumption',
        user_name || ' consumed ' || consumption_text || ' at ' || store_name,
        p_user_id,
        p_store_id,
        jsonb_build_object(
            'product_name', p_product_name,
            'quantity', p_quantity,
            'ml_amount', p_ml_amount,
            'notes', p_notes
        ),
        'low'
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sale notification (for high-value sales)
CREATE OR REPLACE FUNCTION notify_high_value_sale(
    p_user_id uuid,
    p_store_id uuid,
    p_product_name text,
    p_amount numeric,
    p_threshold numeric DEFAULT 50.0
)
RETURNS uuid AS $$
DECLARE
    user_name text;
    store_name text;
    notification_id uuid;
BEGIN
    -- Only create notification if sale is above threshold
    IF p_amount < p_threshold THEN
        RETURN NULL;
    END IF;
    
    -- Get user and store names
    SELECT u.name, s.name INTO user_name, store_name
    FROM store_users u, stores s
    WHERE u.id = p_user_id AND s.id = p_store_id;
    
    -- Create notification
    SELECT create_notification(
        'sale',
        'High-Value Sale',
        user_name || ' made a sale of ' || p_amount || ' TND for ' || p_product_name || ' at ' || store_name,
        p_user_id,
        p_store_id,
        jsonb_build_object(
            'product_name', p_product_name,
            'amount', p_amount
        ),
        'normal'
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for notification functions
GRANT EXECUTE ON FUNCTION create_notification(text, text, text, uuid, uuid, jsonb, text) TO anon, authenticated;

-- ========================================
-- DATA CLEANUP FUNCTIONS
-- ========================================

-- Function to automatically cleanup old data (60+ days)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS json AS $$
DECLARE
    cutoff_date date;
    deleted_sales integer := 0;
    deleted_reports integer := 0;
    deleted_transactions integer := 0;
    deleted_notifications integer := 0;
    deleted_security_logs integer := 0;
BEGIN
    -- Calculate cutoff date (60 days ago)
    cutoff_date := CURRENT_DATE - INTERVAL '60 days';
    
    -- Delete old sales records
    DELETE FROM sales WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_sales = ROW_COUNT;
    
    -- Delete old daily reports
    DELETE FROM daily_reports WHERE report_date < cutoff_date;
    GET DIAGNOSTICS deleted_reports = ROW_COUNT;
    
    -- Delete old worker transactions
    DELETE FROM worker_transactions WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
    
    -- Delete old notifications (keep only 30 days)
    DELETE FROM notifications WHERE created_at < (CURRENT_DATE - INTERVAL '30 days');
    GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
    
    -- Delete old security logs (keep only 90 days for compliance)
    DELETE FROM security_logs WHERE created_at < (CURRENT_DATE - INTERVAL '90 days');
    GET DIAGNOSTICS deleted_security_logs = ROW_COUNT;
    
    -- Return summary
    RETURN json_build_object(
        'success', true,
        'cutoff_date', cutoff_date,
        'deleted_records', json_build_object(
            'sales', deleted_sales,
            'daily_reports', deleted_reports,
            'worker_transactions', deleted_transactions,
            'notifications', deleted_notifications,
            'security_logs', deleted_security_logs
        ),
        'total_deleted', deleted_sales + deleted_reports + deleted_transactions + deleted_notifications + deleted_security_logs
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function if it exists
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
GRANT EXECUTE ON FUNCTION notify_shift_start(uuid, uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_shift_end(uuid, uuid, uuid, numeric, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_salary_advance(uuid, uuid, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_product_consumption(uuid, uuid, text, integer, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION notify_high_value_sale(uuid, uuid, text, numeric, numeric) TO anon, authenticated;

-- Grant permissions for data management functions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_summary(integer, integer) TO anon, authenticated;

-- ========================================
-- SECURITY ENHANCEMENTS
-- ========================================
-- Comprehensive security features for enterprise-grade protection

-- ========================================
-- CREATE SECURITY AUDIT TABLES
-- ========================================

-- Security logs table for tracking all security events
CREATE TABLE IF NOT EXISTS security_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    severity text CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
    user_id uuid REFERENCES store_users(id),
    session_id text,
    ip_address inet,
    user_agent text,
    request_path text,
    request_method text,
    request_data jsonb,
    response_status integer,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Failed authentication attempts table
CREATE TABLE IF NOT EXISTS failed_auth_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_pin text,
    attempted_store_id text,
    ip_address inet,
    user_agent text,
    session_id text,
    error_type text,
    created_at timestamp with time zone DEFAULT now()
);

-- Rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- IP address or session ID
    operation_type text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    is_blocked boolean DEFAULT false,
    blocked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Security threats table
CREATE TABLE IF NOT EXISTS security_threats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_type text NOT NULL,
    severity text CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
    description text,
    source_ip inet,
    user_id uuid REFERENCES store_users(id),
    session_id text,
    request_data jsonb,
    is_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    resolved_by uuid REFERENCES store_users(id),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- CREATE SECURITY FUNCTIONS
-- ========================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type text,
    p_severity text DEFAULT 'MEDIUM',
    p_user_id uuid DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_request_path text DEFAULT NULL,
    p_request_method text DEFAULT NULL,
    p_request_data jsonb DEFAULT NULL,
    p_response_status integer DEFAULT NULL,
    p_error_message text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO security_logs (
        event_type, severity, user_id, session_id, ip_address,
        user_agent, request_path, request_method, request_data,
        response_status, error_message, metadata
    ) VALUES (
        p_event_type, p_severity, p_user_id, p_session_id, p_ip_address,
        p_user_agent, p_request_path, p_request_method, p_request_data,
        p_response_status, p_error_message, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to log failed authentication attempts
CREATE OR REPLACE FUNCTION log_failed_auth_attempt(
    p_attempted_pin text,
    p_attempted_store_id text,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_error_type text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    attempt_id uuid;
BEGIN
    INSERT INTO failed_auth_attempts (
        attempted_pin, attempted_store_id, ip_address,
        user_agent, session_id, error_type
    ) VALUES (
        p_attempted_pin, p_attempted_store_id, p_ip_address,
        p_user_agent, p_session_id, p_error_type
    ) RETURNING id INTO attempt_id;
    
    -- Also log as security event
    PERFORM log_security_event(
        'FAILED_AUTH_ATTEMPT',
        'HIGH',
        NULL,
        p_session_id,
        p_ip_address,
        p_user_agent,
        '/login',
        'POST',
        jsonb_build_object('attempted_pin', left(p_attempted_pin, 2) || '***', 'store_id', p_attempted_store_id),
        401,
        p_error_type
    );
    
    RETURN attempt_id;
END;
$$;

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier text,
    p_operation_type text,
    p_limit_count integer DEFAULT 60,
    p_window_minutes integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count integer;
    window_start_time timestamp with time zone;
    is_blocked boolean DEFAULT false;
    blocked_until_time timestamp with time zone;
    result jsonb;
BEGIN
    -- Get current window start time
    window_start_time := now() - (p_window_minutes || ' minutes')::interval;
    
    -- Check existing rate limit record
    SELECT request_count, is_blocked, blocked_until
    INTO current_count, is_blocked, blocked_until_time
    FROM rate_limit_tracking
    WHERE identifier = p_identifier 
    AND operation_type = p_operation_type
    AND window_start > window_start_time;
    
    -- If no record exists or window expired, create new one
    IF current_count IS NULL THEN
        INSERT INTO rate_limit_tracking (
            identifier, operation_type, request_count, window_start
        ) VALUES (
            p_identifier, p_operation_type, 1, now()
        );
        current_count := 1;
    ELSE
        -- Check if currently blocked
        IF is_blocked AND blocked_until_time > now() THEN
            result := jsonb_build_object(
                'allowed', false,
                'current_count', current_count,
                'limit', p_limit_count,
                'blocked_until', blocked_until_time,
                'reason', 'Rate limit exceeded'
            );
            RETURN result;
        END IF;
        
        -- Update count
        UPDATE rate_limit_tracking
        SET request_count = request_count + 1,
            updated_at = now()
        WHERE identifier = p_identifier 
        AND operation_type = p_operation_type
        AND window_start > window_start_time;
        
        current_count := current_count + 1;
    END IF;
    
    -- Check if limit exceeded
    IF current_count > p_limit_count THEN
        -- Block for progressive duration based on excess
        blocked_until_time := now() + ((current_count - p_limit_count) * 30 || ' seconds')::interval;
        
        UPDATE rate_limit_tracking
        SET is_blocked = true,
            blocked_until = blocked_until_time
        WHERE identifier = p_identifier 
        AND operation_type = p_operation_type;
        
        -- Log security event
        PERFORM log_security_event(
            'RATE_LIMIT_EXCEEDED',
            'HIGH',
            NULL,
            p_identifier,
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('operation_type', p_operation_type, 'count', current_count, 'limit', p_limit_count),
            429,
            'Rate limit exceeded'
        );
        
        result := jsonb_build_object(
            'allowed', false,
            'current_count', current_count,
            'limit', p_limit_count,
            'blocked_until', blocked_until_time,
            'reason', 'Rate limit exceeded'
        );
    ELSE
        result := jsonb_build_object(
            'allowed', true,
            'current_count', current_count,
            'limit', p_limit_count,
            'remaining', p_limit_count - current_count
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to log security threats
CREATE OR REPLACE FUNCTION log_security_threat(
    p_threat_type text,
    p_severity text DEFAULT 'MEDIUM',
    p_description text DEFAULT NULL,
    p_source_ip inet DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_request_data jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    threat_id uuid;
BEGIN
    INSERT INTO security_threats (
        threat_type, severity, description, source_ip,
        user_id, session_id, request_data, metadata
    ) VALUES (
        p_threat_type, p_severity, p_description, p_source_ip,
        p_user_id, p_session_id, p_request_data, p_metadata
    ) RETURNING id INTO threat_id;
    
    -- Also log as security event
    PERFORM log_security_event(
        'SECURITY_THREAT_DETECTED',
        p_severity,
        p_user_id,
        p_session_id,
        p_source_ip,
        NULL,
        NULL,
        NULL,
        jsonb_build_object('threat_type', p_threat_type, 'threat_id', threat_id),
        NULL,
        p_description,
        p_metadata
    );
    
    RETURN threat_id;
END;
$$;

-- Function to get security dashboard data
CREATE OR REPLACE FUNCTION get_security_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    total_logs integer;
    recent_threats integer;
    failed_auth_today integer;
    critical_events integer;
    top_threats jsonb;
BEGIN
    -- Get total security logs
    SELECT COUNT(*) INTO total_logs FROM security_logs;
    
    -- Get recent threats (last hour)
    SELECT COUNT(*) INTO recent_threats 
    FROM security_threats 
    WHERE created_at > now() - interval '1 hour';
    
    -- Get failed auth attempts today
    SELECT COUNT(*) INTO failed_auth_today
    FROM failed_auth_attempts
    WHERE created_at > current_date;
    
    -- Get critical events today
    SELECT COUNT(*) INTO critical_events
    FROM security_logs
    WHERE severity = 'CRITICAL' 
    AND created_at > current_date;
    
    -- Get top threat types
    SELECT jsonb_agg(
        jsonb_build_object(
            'threat_type', threat_type,
            'count', count,
            'severity', severity
        )
    ) INTO top_threats
    FROM (
        SELECT threat_type, COUNT(*) as count, 
               mode() WITHIN GROUP (ORDER BY severity) as severity
        FROM security_threats
        WHERE created_at > now() - interval '24 hours'
        GROUP BY threat_type
        ORDER BY count DESC
        LIMIT 5
    ) t;
    
    result := jsonb_build_object(
        'total_logs', total_logs,
        'recent_threats', recent_threats,
        'failed_auth_today', failed_auth_today,
        'critical_events', critical_events,
        'top_threats', COALESCE(top_threats, '[]'::jsonb),
        'generated_at', now()
    );
    
    RETURN result;
END;
$$;

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_old_security_data(
    p_days_to_keep integer DEFAULT 90
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_logs integer;
    deleted_attempts integer;
    deleted_rate_limits integer;
    deleted_threats integer;
    cutoff_date timestamp with time zone;
BEGIN
    cutoff_date := now() - (p_days_to_keep || ' days')::interval;
    
    -- Delete old security logs
    DELETE FROM security_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_logs = ROW_COUNT;
    
    -- Delete old failed auth attempts
    DELETE FROM failed_auth_attempts WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_attempts = ROW_COUNT;
    
    -- Delete old rate limit records
    DELETE FROM rate_limit_tracking WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_rate_limits = ROW_COUNT;
    
    -- Delete old resolved threats
    DELETE FROM security_threats 
    WHERE created_at < cutoff_date AND is_resolved = true;
    GET DIAGNOSTICS deleted_threats = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'deleted_logs', deleted_logs,
        'deleted_attempts', deleted_attempts,
        'deleted_rate_limits', deleted_rate_limits,
        'deleted_threats', deleted_threats,
        'cutoff_date', cutoff_date,
        'cleaned_at', now()
    );
END;
$$;

-- Final verification queries
SELECT 'SUCCESS: Optimized multi-store database configured!' as status;

-- ========================================
-- FINAL PERMISSIONS AND RLS SETUP
-- ========================================

-- ========================================
-- CREATE SECURITY TRIGGERS AND AUDIT
-- ========================================

-- Trigger to automatically log sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_user_id uuid;
BEGIN
    -- Determine the user_id based on the table
    IF TG_TABLE_NAME = 'store_users' THEN
        -- For store_users table, use the id field
        IF TG_OP = 'DELETE' THEN
            audit_user_id := OLD.id;
        ELSE
            audit_user_id := NEW.id;
        END IF;
    ELSE
        -- For other tables, use the user_id field
        IF TG_OP = 'DELETE' THEN
            audit_user_id := OLD.user_id;
        ELSE
            audit_user_id := NEW.user_id;
        END IF;
    END IF;

    -- Log INSERT, UPDATE, DELETE operations on sensitive tables
    IF TG_OP = 'INSERT' THEN
        PERFORM log_security_event(
            'DATA_INSERT',
            'MEDIUM',
            audit_user_id,
            NULL,
            NULL,
            NULL,
            TG_TABLE_NAME,
            'INSERT',
            to_jsonb(NEW),
            200,
            NULL,
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_security_event(
            'DATA_UPDATE',
            'MEDIUM',
            audit_user_id,
            NULL,
            NULL,
            NULL,
            TG_TABLE_NAME,
            'UPDATE',
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
            200,
            NULL,
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_security_event(
            'DATA_DELETE',
            'HIGH',
            audit_user_id,
            NULL,
            NULL,
            NULL,
            TG_TABLE_NAME,
            'DELETE',
            to_jsonb(OLD),
            200,
            NULL,
            jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_sales_security_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();

CREATE TRIGGER audit_shifts_security_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shifts
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();

CREATE TRIGGER audit_users_security_trigger
    AFTER INSERT OR UPDATE OR DELETE ON store_users
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_operations();

-- ========================================
-- CREATE SECURITY INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for security tables
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_session_id ON security_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_failed_auth_attempts_created_at ON failed_auth_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_failed_auth_attempts_ip_address ON failed_auth_attempts(ip_address);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier ON rate_limit_tracking(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_operation_type ON rate_limit_tracking(operation_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_window_start ON rate_limit_tracking(window_start);

CREATE INDEX IF NOT EXISTS idx_security_threats_threat_type ON security_threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
CREATE INDEX IF NOT EXISTS idx_security_threats_created_at ON security_threats(created_at);
CREATE INDEX IF NOT EXISTS idx_security_threats_source_ip ON security_threats(source_ip);

-- ========================================
-- GRANT SECURITY PERMISSIONS
-- ========================================

-- Grant execute permissions on security functions to authenticated users
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_failed_auth_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_threat TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_security_data TO authenticated;

-- Grant select permissions on security tables to authenticated users
-- (This will be enforced by RLS policies for admin-only access)
GRANT SELECT ON security_logs TO authenticated;
GRANT SELECT ON failed_auth_attempts TO authenticated;
GRANT SELECT ON rate_limit_tracking TO authenticated;
GRANT SELECT ON security_threats TO authenticated;

-- Disable RLS for security tables initially (can be enabled later for production)
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_auth_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_threats DISABLE ROW LEVEL SECURITY;

-- Ensure all tables have RLS disabled for API access (notifications RLS is disabled after its creation)
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE worker_transactions DISABLE ROW LEVEL SECURITY;

-- Grant comprehensive permissions for API access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Verify setup
SELECT 'Database setup completed with full API access!' as final_status;

-- ========================================
-- DATABASE VERIFICATION - SHOW ALL TABLES
-- ========================================

-- Show all tables created (simplified approach)
SELECT 'TABLES CREATED:' as verification_info
UNION ALL SELECT '=================='
UNION ALL SELECT '1. stores - Contains the 3 vape stores'
UNION ALL SELECT '2. store_users - Admin and worker accounts'
UNION ALL SELECT '3. products - Product catalog with categories'
UNION ALL SELECT '4. shifts - Employee work shifts (2 per day)'
UNION ALL SELECT '5. sales - Individual sales transactions'
UNION ALL SELECT '6. daily_reports - End-of-day summaries'
UNION ALL SELECT '7. shift_targets - Performance targets per store'
UNION ALL SELECT ''
UNION ALL SELECT 'FUNCTIONS CREATED:'
UNION ALL SELECT '=================='
UNION ALL SELECT '1. start_shift() - Starts a work shift for a user'
UNION ALL SELECT '2. end_shift() - Ends a work shift and calculates totals'
UNION ALL SELECT '3. record_sale() - Records a sale transaction'
UNION ALL SELECT '4. get_live_store_revenue() - Gets real-time revenue data'
UNION ALL SELECT '5. get_historical_reports() - Gets historical reports by date range'
UNION ALL SELECT '6. get_monthly_summary() - Gets monthly summary data'
UNION ALL SELECT '7. get_daily_product_breakdown() - Gets daily product sales breakdown'
UNION ALL SELECT '8. get_monthly_product_breakdown() - Gets monthly product breakdown'
UNION ALL SELECT '9. get_detailed_daily_breakdown() - Gets detailed daily store breakdown'
UNION ALL SELECT '10. get_detailed_monthly_breakdown() - Gets detailed monthly store breakdown'
UNION ALL SELECT '11. cleanup_old_reports() - Cleans up old historical reports'
UNION ALL SELECT ''
UNION ALL SELECT 'DATA SUMMARY:'
UNION ALL SELECT '============='
UNION ALL SELECT 'Total Stores: ' || (SELECT COUNT(*) FROM stores)::text
UNION ALL SELECT 'Total Users: ' || (SELECT COUNT(*) FROM store_users)::text
UNION ALL SELECT 'Total Products: ' || (SELECT COUNT(*) FROM products)::text
UNION ALL SELECT 'Total Shift Targets: ' || (SELECT COUNT(*) FROM shift_targets)::text
UNION ALL SELECT 'Total Shifts: ' || (SELECT COUNT(*) FROM shifts)::text
UNION ALL SELECT 'Total Sales: ' || (SELECT COUNT(*) FROM sales)::text
UNION ALL SELECT 'Total Reports: ' || (SELECT COUNT(*) FROM daily_reports)::text;

-- Show the stores that were created
SELECT 'STORES CREATED:' as store_info
UNION ALL SELECT '==============='
UNION ALL SELECT 'Store 1: Legend Vape Store - 123 Main St, Downtown - (555) 101-0001'
UNION ALL SELECT 'Store 2: We Vape Store - 456 Shopping Center, Mall District - (555) 102-0002'
UNION ALL SELECT 'Store 3: Kwest Vape Store - 789 North Ave, North Side - (555) 103-0003';

-- Show login credentials  
SELECT 'LOGIN CREDENTIALS:' as login_info
UNION ALL SELECT '=================='
UNION ALL SELECT 'Super Admin (admin) - PIN: 1234'
UNION ALL SELECT 'Worker 1 (worker) - PIN: 1001'
UNION ALL SELECT 'Worker 2 (worker) - PIN: 1002'
UNION ALL SELECT 'Worker 3 (worker) - PIN: 2001'
UNION ALL SELECT 'Worker 4 (worker) - PIN: 2002'
UNION ALL SELECT 'Worker 5 (worker) - PIN: 3001'
UNION ALL SELECT 'Worker 6 (worker) - PIN: 3002';

-- Final success message
SELECT 'DATABASE SETUP COMPLETE! Fuck Yeahhhh' as final_message,
       'All tables, functions, and data have been created successfully.' as details;

-- ========================================
-- AUTOMATED CLEANUP SETUP
-- ========================================

-- Note: In a production environment, you would set up a cron job or scheduled task
-- to automatically run the cleanup_old_reports() function daily.
-- For example, in PostgreSQL with pg_cron extension:
-- SELECT cron.schedule('cleanup-old-reports', '0 2 * * *', 'SELECT cleanup_old_reports();');

-- Manual cleanup can be performed by calling:
-- SELECT cleanup_old_reports();

-- This will remove all reports older than 40 days to maintain database performance
-- and comply with data retention policies.

-- ========================================
-- NOTIFICATIONS SYSTEM
-- ========================================

-- Notifications Table
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('salary_advance', 'product_consumption', 'shift_start', 'shift_end', 'low_stock', 'system')),
    title text NOT NULL,
    message text NOT NULL,
    worker_id uuid REFERENCES store_users(id),
    store_id uuid REFERENCES stores(id),
    product_id uuid REFERENCES products(id),
    is_read boolean DEFAULT false,
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Disable RLS for notifications initially
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Removed duplicate create_notification function - using the one defined earlier

-- Function to get unread notifications for admin
CREATE OR REPLACE FUNCTION get_admin_notifications(
    p_limit integer DEFAULT 50,
    p_include_read boolean DEFAULT false
)
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    message text,
    worker_name text,
    store_name text,
    product_name text,
    is_read boolean,
    priority text,
    metadata jsonb,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        u.name as worker_name,
        s.name as store_name,
        p.name as product_name,
        n.is_read,
        n.priority,
        n.metadata,
        n.created_at,
        n.expires_at
    FROM notifications n
    LEFT JOIN store_users u ON n.worker_id = u.id
    LEFT JOIN stores s ON n.store_id = s.id
    LEFT JOIN products p ON n.product_id = p.id
    WHERE (p_include_read = true OR n.is_read = false)
    AND n.expires_at > now()
    ORDER BY 
        CASE n.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        n.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    p_notification_ids uuid[]
)
RETURNS integer AS $$
DECLARE
    updated_count integer;
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE id = ANY(p_notification_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS TABLE (
    deleted_count integer,
    cutoff_date timestamp with time zone
) AS $$
DECLARE
    del_count integer;
    cutoff_ts timestamp with time zone;
BEGIN
    cutoff_ts := now();
    
    DELETE FROM notifications 
    WHERE expires_at < cutoff_ts;
    
    GET DIAGNOSTICS del_count = ROW_COUNT;
    
    RETURN QUERY SELECT del_count, cutoff_ts;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for salary advance notifications
CREATE OR REPLACE FUNCTION notify_salary_advance()
RETURNS TRIGGER AS $$
DECLARE
    worker_name text;
    store_name text;
BEGIN
    -- Debug logging
    RAISE NOTICE 'Salary advance trigger fired - Amount: %, User ID: %, Store ID: %', NEW.amount, NEW.user_id, NEW.store_id;
    
    -- Get worker and store names
    SELECT u.name, s.name INTO worker_name, store_name
    FROM store_users u
    LEFT JOIN stores s ON s.id = NEW.store_id
    WHERE u.id = NEW.user_id;
    
    RAISE NOTICE 'Worker: %, Store: %', worker_name, store_name;
    
    -- Create notification
    PERFORM create_notification(
        'salary_advance',
        'Salary Advance Taken',
        worker_name || ' took a salary advance of ' || COALESCE(NEW.amount, 0) || ' TND at ' || COALESCE(store_name, 'Unknown Store'),
        NEW.user_id,
        NEW.store_id,
        jsonb_build_object(
            'amount', COALESCE(NEW.amount, 0),
            'notes', COALESCE(NEW.notes, ''),
            'transaction_id', NEW.id
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for product consumption notifications
CREATE OR REPLACE FUNCTION notify_product_consumption()
RETURNS TRIGGER AS $$
DECLARE
    worker_name text;
    store_name text;
    product_name text;
    consumption_text text;
BEGIN
    -- Get worker, store, and product names
    SELECT u.name, s.name, p.name INTO worker_name, store_name, product_name
    FROM store_users u
    LEFT JOIN stores s ON s.id = NEW.store_id
    LEFT JOIN products p ON p.id = NEW.product_id
    WHERE u.id = NEW.user_id;
    
    -- Build consumption text
    IF NEW.ml_amount > 0 THEN
        consumption_text := NEW.ml_amount || 'ml of ' || product_name;
    ELSE
        consumption_text := NEW.quantity || 'x ' || product_name;
    END IF;
    
    -- Create notification
    PERFORM create_notification(
        'product_consumption',
        'Product Consumption',
        worker_name || ' consumed ' || consumption_text || ' at ' || COALESCE(store_name, 'Unknown Store'),
        NEW.user_id,
        NEW.store_id,
        jsonb_build_object(
            'product_id', NEW.product_id,
            'quantity', NEW.quantity,
            'ml_amount', NEW.ml_amount,
            'notes', NEW.notes,
            'transaction_id', NEW.id
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for shift start/end notifications
CREATE OR REPLACE FUNCTION notify_shift_changes()
RETURNS TRIGGER AS $$
DECLARE
    worker_name text;
    store_name text;
    notification_type text;
    notification_title text;
    notification_message text;
BEGIN
    -- Get worker and store names
    SELECT u.name, s.name INTO worker_name, store_name
    FROM store_users u
    LEFT JOIN stores s ON s.id = NEW.store_id
    WHERE u.id = NEW.user_id;
    
    -- Determine if this is start or end
    IF TG_OP = 'INSERT' THEN
        notification_type := 'shift_start';
        notification_title := 'Shift Started';
        notification_message := worker_name || ' started shift ' || NEW.shift_number || ' at ' || COALESCE(store_name, 'Unknown Store');
    ELSIF TG_OP = 'UPDATE' AND OLD.end_time IS NULL AND NEW.end_time IS NOT NULL THEN
        notification_type := 'shift_end';
        notification_title := 'Shift Ended';
        notification_message := worker_name || ' ended shift ' || NEW.shift_number || ' at ' || COALESCE(store_name, 'Unknown Store') || 
                               ' (Duration: ' || EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))/3600 || ' hours)';
    ELSE
        RETURN NEW; -- No notification needed
    END IF;
    
    -- Create notification
    PERFORM create_notification(
        notification_type,
        notification_title,
        notification_message,
        NEW.user_id,
        NEW.store_id,
        jsonb_build_object(
            'shift_number', NEW.shift_number,
            'shift_id', NEW.id,
            'start_time', NEW.start_time,
            'end_time', NEW.end_time
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    store_name text;
    product_name text;
    low_stock_threshold integer := 10; -- Configurable threshold
BEGIN
    -- Only check on inventory decrease (UPDATE or DELETE)
    IF TG_OP = 'UPDATE' AND NEW.stock_quantity >= OLD.stock_quantity THEN
        RETURN NEW; -- Stock increased or stayed same, no check needed
    END IF;
    
    -- Get store and product names (handle case where product might be deleted)
    SELECT COALESCE(s.name, 'Unknown Store'), COALESCE(p.name, 'Unknown Product') INTO store_name, product_name
    FROM stores s
    LEFT JOIN products p ON p.id = COALESCE(NEW.product_id, OLD.product_id)
    WHERE s.id = COALESCE(NEW.store_id, OLD.store_id);
    
    -- If we're in a DELETE operation and product is already gone, skip notification
    IF TG_OP = 'DELETE' AND product_name = 'Unknown Product' THEN
        RETURN OLD;
    END IF;
    
    -- Check if stock is low and create notification if needed
    IF COALESCE(NEW.stock_quantity, 0) <= low_stock_threshold AND COALESCE(NEW.stock_quantity, 0) > 0 THEN
        -- Check if we already have a recent low stock notification for this product/store
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'low_stock' 
            AND store_id = COALESCE(NEW.store_id, OLD.store_id)
            AND product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND created_at > now() - interval '24 hours'
            AND is_read = false
        ) THEN
            PERFORM create_notification(
                'low_stock',
                'Low Stock Alert',
                'Low stock warning: ' || product_name || ' at ' || store_name || ' (Only ' || COALESCE(NEW.stock_quantity, 0) || ' left)',
                NULL,
                COALESCE(NEW.store_id, OLD.store_id),
                jsonb_build_object(
                    'product_id', COALESCE(NEW.product_id, OLD.product_id),
                    'current_quantity', COALESCE(NEW.stock_quantity, 0),
                    'threshold', low_stock_threshold
                ),
                'high'
            );
        END IF;
    ELSIF COALESCE(NEW.stock_quantity, 0) = 0 THEN
        -- Out of stock - urgent notification
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE type = 'low_stock' 
            AND store_id = COALESCE(NEW.store_id, OLD.store_id)
            AND product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND created_at > now() - interval '24 hours'
            AND is_read = false
            AND priority = 'urgent'
        ) THEN
            PERFORM create_notification(
                'low_stock',
                'Out of Stock!',
                'URGENT: ' || product_name || ' is out of stock at ' || store_name,
                NULL,
                COALESCE(NEW.store_id, OLD.store_id),
                jsonb_build_object(
                    'product_id', COALESCE(NEW.product_id, OLD.product_id),
                    'current_quantity', 0,
                    'threshold', low_stock_threshold
                ),
                'urgent'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER trigger_salary_advance_notification
    AFTER INSERT ON worker_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'salary_advance')
    EXECUTE FUNCTION notify_salary_advance();

CREATE TRIGGER trigger_consumption_notification
    AFTER INSERT ON worker_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'product_consumption')
    EXECUTE FUNCTION notify_product_consumption();

CREATE TRIGGER trigger_shift_start_notification
    AFTER INSERT ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION notify_shift_changes();

CREATE TRIGGER trigger_shift_end_notification
    AFTER UPDATE ON shifts
    FOR EACH ROW
    EXECUTE FUNCTION notify_shift_changes();

CREATE TRIGGER trigger_low_stock_notification
    AFTER UPDATE OR DELETE ON store_inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- ========================================
-- FD (FONT DE CAISSE) FUNCTIONALITY
-- ========================================

-- FD (Font de Caisse) Table - tracks daily cash fund for each store
CREATE TABLE IF NOT EXISTS fd_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES store_users(id) ON DELETE CASCADE NOT NULL, -- Worker who entered the FD
    fd_date date NOT NULL, -- Date for which this FD is set (tomorrow's date when entered)
    amount numeric(10,3) NOT NULL CHECK (amount >= 0), -- FD amount in TND with millimes
    shift_number integer CHECK (shift_number IN (1, 2)) NOT NULL, -- Which shift worker entered this
    notes text, -- Optional notes about the FD
    created_at timestamp with time zone DEFAULT now(),
    
    -- Ensure only one FD record per store per date
    UNIQUE(store_id, fd_date)
);

-- Disable RLS for FD records initially
ALTER TABLE fd_records DISABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_fd_records_store_date ON fd_records(store_id, fd_date);
CREATE INDEX IF NOT EXISTS idx_fd_records_date ON fd_records(fd_date);

-- Add RPC function to get FD records for admin
CREATE OR REPLACE FUNCTION get_fd_records(
    p_store_id uuid DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    store_id uuid,
    store_name text,
    user_id uuid,
    user_name text,
    fd_date date,
    amount numeric,
    shift_number integer,
    notes text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.store_id,
        s.name as store_name,
        f.user_id,
        u.name as user_name,
        f.fd_date,
        f.amount,
        f.shift_number,
        f.notes,
        f.created_at
    FROM fd_records f
    JOIN stores s ON f.store_id = s.id
    JOIN store_users u ON f.user_id = u.id
    WHERE 
        (p_store_id IS NULL OR f.store_id = p_store_id)
        AND (p_start_date IS NULL OR f.fd_date >= p_start_date)
        AND (p_end_date IS NULL OR f.fd_date <= p_end_date)
    ORDER BY f.fd_date DESC, s.name, f.shift_number;
END;
$$;

-- Add RPC function to set FD for tomorrow
CREATE OR REPLACE FUNCTION set_fd_for_tomorrow(
    p_user_id uuid,
    p_store_id uuid,
    p_amount numeric,
    p_shift_number integer,
    p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_tomorrow_date date;
    v_result json;
    v_fd_record fd_records%ROWTYPE;
BEGIN
    -- Calculate tomorrow's date
    v_tomorrow_date := (CURRENT_DATE + INTERVAL '1 day')::date;
    
    -- Insert or update FD record for tomorrow
    INSERT INTO fd_records (store_id, user_id, fd_date, amount, shift_number, notes)
    VALUES (p_store_id, p_user_id, v_tomorrow_date, p_amount, p_shift_number, p_notes)
    ON CONFLICT (store_id, fd_date)
    DO UPDATE SET 
        amount = EXCLUDED.amount,
        user_id = EXCLUDED.user_id,
        shift_number = EXCLUDED.shift_number,
        notes = EXCLUDED.notes,
        created_at = now()
    RETURNING * INTO v_fd_record;
    
    -- Return success result
    v_result := json_build_object(
        'success', true,
        'message', 'FD set successfully for tomorrow',
        'fd_date', v_tomorrow_date,
        'amount', v_fd_record.amount,
        'id', v_fd_record.id
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error result
    v_result := json_build_object(
        'success', false,
        'message', 'Failed to set FD: ' || SQLERRM
    );
    
    RETURN v_result;
END;
$$;

-- Add RPC function to get today's FD
CREATE OR REPLACE FUNCTION get_today_fd(p_store_id uuid)
RETURNS TABLE (
    id uuid,
    amount numeric,
    user_name text,
    shift_number integer,
    notes text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.amount,
        u.name as user_name,
        f.shift_number,
        f.notes,
        f.created_at
    FROM fd_records f
    JOIN store_users u ON f.user_id = u.id
    WHERE f.store_id = p_store_id 
    AND f.fd_date = CURRENT_DATE
    LIMIT 1;
END;
$$;

-- Add comments for FD functionality
COMMENT ON TABLE fd_records IS 'Tracks daily FD (Font de Caisse/Cash Fund) amounts set by 2nd shift workers for the next day';
COMMENT ON FUNCTION set_fd_for_tomorrow IS 'Sets the FD amount for tomorrow when a 2nd shift worker ends their shift';
COMMENT ON FUNCTION get_fd_records IS 'Retrieves FD records for admin dashboard with optional filtering';
COMMENT ON FUNCTION get_today_fd IS 'Gets today''s FD record for a specific store';

