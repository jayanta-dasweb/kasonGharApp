# PROJECT BLUEPRINT: KASON GHAR (কছন ঘৰ)
# ERP, Consignment, Inventory & Accounting System for Assamese Mekhela Chador (মেখেলা চাদৰ)
# Brand language: Assamese script only — never Hindi/Devanagari on UI.

## 1. PROJECT OBJECTIVES & CORE RULES
- **Architecture:** React Native (Expo + TypeScript + Expo Router + NativeWind/Tailwind CSS + Lucide Icons).
- **Backend & DB:** Supabase (PostgreSQL with Row Level Security, Spatie RBAC, Odoo-style Inventory Quants & Double-Entry Accounting).
- **Design & UI Philosophy:** 
  - Modern, clean, classic-simple UI. High scannability, thumb-friendly touch targets, minimal clutter, zero excessive paragraphs, and immediate feedback states.
  - Color Palette: Deep Royal Blue (`#1E3A8A`) for trust/accounting precision, Muga Gold (`#D97706`) for traditional silk heritage, Crisp White/Off-white backgrounds.
- **Strict Execution Rules:**
  - **NO GARBAGE / NO ASSUMPTIONS:** Do not hallucinate dummy mock data bypasses. Every form must write and read directly from the actual Supabase PostgreSQL tables.
  - **AUTOMATED TESTING:** Write test cases (using Jest / React Native Testing Library or robust async validation scripts) for every critical DB mutation (Vendor Purchase insertion, Stock Allocation movement, Sales Reconciliation ledger posting, and RLS permission checks) to guarantee data is successfully inserted and verified.

---

## 2. ENVIRONMENT & SUPABASE CONNECTION
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_8LzMecjav2rto28tDRoT6g_IqM6bEdN
```

Authentication Rule (Phone + Password):
Login takes 10-digit phone number (e.g., 7002911685) and password (SUPERadmin@123).

Under the hood, authenticate via Supabase Auth using the email alias mapping:`supabase.auth.signInWithPassword({ email: ${phone.trim()}@kasonghar.local, password })`.

Default Super Admin (Jayanta Das, Phone: 7002911685, Password: SUPERadmin@123) is pre-seeded in the database with all permissions.

## 3. DATABASE SCHEMA REFERENCE (ALREADY DEPLOYED)
The app must connect directly to these PostgreSQL tables/views:

RBAC (Laravel Spatie Style): users_master, roles, permissions, role_has_permissions, model_has_roles, model_has_permissions, and helper functions has_role(name) / has_permission(name).

Masters: master_financial_years, master_categories, master_fabrics, master_weaves, master_partners (vendors/customers), master_products, master_expense_heads.

Odoo Inventory Engine: stock_locations (SUPPLIER, INTERNAL, SALESPERSON, CUSTOMER), stock_quants (real-time stock per product per location), stock_moves (automatic DB trigger updates quants on 'DONE' status).

Odoo Accounting Engine: account_accounts, account_journals, account_moves, account_move_lines (double-entry debit/credit ledger).

Reconciliation & Audit: sales_reconciliation, audit_logs, reporting views (report_day_wise, report_month_wise, report_fy_wise, report_salesperson_summary).

Security View: view_salesperson_catalog (strictly hides vendor_cost_price from salespersons).

## 4. APP SCREENS & MODULES TO BUILD
### A. Authentication & Splash Screen
Clean splash screen with custom Kason Ghar SVG logo (Ledger-House emblem with ₹ symbol and Assamese motif).

Login screen with phone number input, password input, loading spinner, and clear error toast handlers.

### B. Role-Driven Dashboard
Admin / Super Admin View:

KPI Summary Cards (Total Revenue, Net Profit, Office Stock Value, Consignment Stock Value in ₹ formatted with en-IN).

Period filter toggle: Day-wise, Month-wise (YYYY-MM), and Indian Financial Year-wise (YYYY-YY).

Salesperson View:

Simplified mobile home showing quick product search and "My Assigned Stock in Hand".

### C. Product Catalog & Quick Lookup
Search by company-defined product_code, category, fabric, or color.

Admin: Sees full details including vendor_cost_price, company_mrp, min_selling_price, and stock breakdown across office vs. all salespeople.

Salesperson: Queries view_salesperson_catalog (sees MRP, min price, office availability, and personal stock without ever seeing vendor cost).

### D. Master Data Management Hub (masters.manage & products.manage)
Simple, tabbed forms to create and manage Financial Years, Categories, Fabrics, Weaves, Partners (Vendors/Customers), Products, Chart of Accounts, and Expense Heads.

### E. Inventory & Stock Operations (inventory.manage)
Vendor Purchase Bill: Select vendor, enter invoice number, product codes, quantities, and unit costs. Generates a stock_move from Supplier to Office warehouse and posts an IN_BILL accounting move (Debit Inventory, Credit Accounts Payable).

Stock Allocation: Allocate office stock to a salesperson (stock_move from Internal to Salesperson location).

Return Unsold Stock: Move stock back from salesperson to office.

### F. Sales Reconciliation & Accounting (sales.reconcile)
Record verified sales (Salesperson Consignment or Direct Office Sale).

Enter actual sale price, quantity, and customer.

Automatically posts a stock_move to Customer location, posts an OUT_INVOICE double-entry journal (Sales Revenue + COGS), and saves the verified record to sales_reconciliation.

### G. Reports & Export (reports.export)
Clean tables for Day-wise, Month-wise, FY-wise, and Salesperson performance summaries.

One-tap Download Excel (.xlsx) and Share CSV buttons using xlsx, expo-file-system, and expo-sharing.

### H. RBAC Manager & Audit Trail (users.manage, rbac.manage, audit.view)
User management table, role permission matrix toggles, staff onboarding form (phone + password), and immutable audit_logs viewer showing JSON diffs.

## 5. MANDATORY TESTING REQUIREMENTS
Cursor must create a `__tests__` or `tests` directory containing unit/integration test files verifying:

DB Insertion Test: Simulating a product insertion and vendor purchase to ensure Supabase accepts and commits the transaction without throwing RLS or foreign key violations.

Stock Movement Test: Verifying that a stock_move with state 'DONE' correctly updates stock_quants.

RBAC Permission Test: Verifying has_permission() logic for Salesperson vs Admin roles.

## 6. GIT / PROJECT MANAGEMENT
- Remote repository: https://github.com/jayanta-dasweb/kasonGharApp.git
- Commit and push every small or big change to remote for rollback safety.
