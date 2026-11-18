-- =============================================================================
-- KASON GHAR — Inventory + Accounting master enrichment
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Project: uxxoqfabnqvoozhrhabx
-- Safe: only ADD COLUMN IF NOT EXISTS (does not drop data)
-- =============================================================================

BEGIN;

-- ---------- Financial Years ----------
ALTER TABLE master_financial_years
  ADD COLUMN IF NOT EXISTS fy_name text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE master_financial_years
SET fy_name = to_char(start_date, 'YYYY') || '-' || to_char(end_date, 'YY')
WHERE fy_name IS NULL AND start_date IS NOT NULL AND end_date IS NOT NULL;

-- ---------- Categories / Fabrics / Weaves ----------
ALTER TABLE master_categories
  ADD COLUMN IF NOT EXISTS parent_id bigint,
  ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

ALTER TABLE master_fabrics
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS care_notes text;

ALTER TABLE master_weaves
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS motif text;

-- ---------- Partners (Vendors / Customers) ----------
ALTER TABLE master_partners
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS pan text,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS ifsc text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------- Products (Mekhela Chador SKU) ----------
ALTER TABLE master_products
  ADD COLUMN IF NOT EXISTS product_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS design_name text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS uom text DEFAULT 'PCS',
  ADD COLUMN IF NOT EXISTS wholesale_price numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS length_mtr numeric(10,2),
  ADD COLUMN IF NOT EXISTS width_inch numeric(10,2),
  ADD COLUMN IF NOT EXISTS default_vendor_id bigint,
  ADD COLUMN IF NOT EXISTS notes text;

-- Ensure unique product_id where possible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'master_products_product_id_key'
  ) THEN
    ALTER TABLE master_products ADD CONSTRAINT master_products_product_id_key UNIQUE (product_id);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'product_id unique constraint skipped: %', SQLERRM;
END $$;

-- ---------- Expense Heads ----------
ALTER TABLE master_expense_heads
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS account_id bigint,
  ADD COLUMN IF NOT EXISTS is_direct_cost boolean DEFAULT false;

-- ---------- Chart of Accounts ----------
ALTER TABLE account_accounts
  ADD COLUMN IF NOT EXISTS account_subtype text,
  ADD COLUMN IF NOT EXISTS parent_id bigint,
  ADD COLUMN IF NOT EXISTS is_reconcilable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS opening_balance numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

-- ---------- Journals ----------
ALTER TABLE account_journals
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS default_debit_account_id bigint,
  ADD COLUMN IF NOT EXISTS default_credit_account_id bigint,
  ADD COLUMN IF NOT EXISTS notes text;

-- ---------- Stock Locations ----------
ALTER TABLE stock_locations
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------- Stock Quants (real-time stock) ----------
ALTER TABLE stock_quants
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS reserved_quantity numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ---------- Stock Moves ----------
ALTER TABLE stock_moves
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS partner_id bigint,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS move_type text;

-- ---------- Sales Reconciliation ----------
ALTER TABLE sales_reconciliation
  ADD COLUMN IF NOT EXISTS product_code text,
  ADD COLUMN IF NOT EXISTS invoice_no text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS cogs_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS revenue_amount numeric(14,2);

COMMIT;

-- Quick verification
SELECT 'master_products' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'master_products'
ORDER BY ordinal_position;
