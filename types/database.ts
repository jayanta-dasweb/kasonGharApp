export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PartnerType = 'vendor' | 'customer' | 'both';
export type LocationUsage = 'SUPPLIER' | 'INTERNAL' | 'SALESPERSON' | 'CUSTOMER';
export type StockMoveState = 'DRAFT' | 'DONE' | 'CANCELLED';

export interface Database {
  public: {
    Tables: {
      users_master: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          phone: string;
          email_alias: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users_master']['Row']> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database['public']['Tables']['users_master']['Row']>;
      };
      roles: {
        Row: { id: number; name: string; guard_name: string };
        Insert: { name: string; guard_name?: string };
        Update: Partial<{ name: string; guard_name: string }>;
      };
      permissions: {
        Row: { id: number; name: string; guard_name: string };
        Insert: { name: string; guard_name?: string };
        Update: Partial<{ name: string; guard_name: string }>;
      };
      role_has_permissions: {
        Row: { permission_id: number; role_id: number };
        Insert: { permission_id: number; role_id: number };
        Update: Partial<{ permission_id: number; role_id: number }>;
      };
      model_has_roles: {
        Row: { role_id: number; model_type: string; model_id: string };
        Insert: { role_id: number; model_type: string; model_id: string };
        Update: Partial<{ role_id: number; model_type: string; model_id: string }>;
      };
      model_has_permissions: {
        Row: { permission_id: number; model_type: string; model_id: string };
        Insert: { permission_id: number; model_type: string; model_id: string };
        Update: Partial<{ permission_id: number; model_type: string; model_id: string }>;
      };
      master_financial_years: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
        };
        Insert: {
          name: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['master_financial_years']['Row']>;
      };
      master_categories: {
        Row: { id: string; name: string; is_active: boolean };
        Insert: { name: string; is_active?: boolean };
        Update: Partial<{ name: string; is_active: boolean }>;
      };
      master_fabrics: {
        Row: { id: string; name: string; is_active: boolean };
        Insert: { name: string; is_active?: boolean };
        Update: Partial<{ name: string; is_active: boolean }>;
      };
      master_weaves: {
        Row: { id: string; name: string; is_active: boolean };
        Insert: { name: string; is_active?: boolean };
        Update: Partial<{ name: string; is_active: boolean }>;
      };
      master_partners: {
        Row: {
          id: string;
          name: string;
          partner_type: PartnerType;
          phone: string | null;
          address: string | null;
          gstin: string | null;
          is_active: boolean;
        };
        Insert: {
          name: string;
          partner_type: PartnerType;
          phone?: string | null;
          address?: string | null;
          gstin?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['master_partners']['Row']>;
      };
      master_products: {
        Row: {
          id: string;
          product_code: string;
          name: string;
          category_id: string | null;
          fabric_id: string | null;
          weave_id: string | null;
          color: string | null;
          vendor_cost_price: number;
          company_mrp: number;
          min_selling_price: number;
          is_active: boolean;
        };
        Insert: {
          product_code: string;
          name: string;
          category_id?: string | null;
          fabric_id?: string | null;
          weave_id?: string | null;
          color?: string | null;
          vendor_cost_price: number;
          company_mrp: number;
          min_selling_price: number;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['master_products']['Row']>;
      };
      master_expense_heads: {
        Row: { id: string; name: string; is_active: boolean };
        Insert: { name: string; is_active?: boolean };
        Update: Partial<{ name: string; is_active: boolean }>;
      };
      stock_locations: {
        Row: {
          id: string;
          name: string;
          usage: LocationUsage;
          user_id: string | null;
          is_active: boolean;
        };
        Insert: {
          name: string;
          usage: LocationUsage;
          user_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['stock_locations']['Row']>;
      };
      stock_quants: {
        Row: {
          id: string;
          product_id: string;
          location_id: string;
          quantity: number;
          reserved_quantity: number;
        };
        Insert: {
          product_id: string;
          location_id: string;
          quantity: number;
          reserved_quantity?: number;
        };
        Update: Partial<Database['public']['Tables']['stock_quants']['Row']>;
      };
      stock_moves: {
        Row: {
          id: string;
          product_id: string;
          location_id: string;
          location_dest_id: string;
          quantity: number;
          state: StockMoveState;
          reference: string | null;
          unit_cost: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          location_id: string;
          location_dest_id: string;
          quantity: number;
          state?: StockMoveState;
          reference?: string | null;
          unit_cost?: number | null;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['stock_moves']['Row']>;
      };
      account_accounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          account_type: string;
          is_active: boolean;
        };
        Insert: {
          code: string;
          name: string;
          account_type: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['account_accounts']['Row']>;
      };
      account_journals: {
        Row: { id: string; code: string; name: string; journal_type: string };
        Insert: { code: string; name: string; journal_type: string };
        Update: Partial<{ code: string; name: string; journal_type: string }>;
      };
      account_moves: {
        Row: {
          id: string;
          journal_id: string;
          name: string;
          date: string;
          ref: string | null;
          state: string;
          move_type: string;
        };
        Insert: {
          journal_id: string;
          name: string;
          date: string;
          ref?: string | null;
          state?: string;
          move_type: string;
        };
        Update: Partial<Database['public']['Tables']['account_moves']['Row']>;
      };
      account_move_lines: {
        Row: {
          id: string;
          move_id: string;
          account_id: string;
          name: string;
          debit: number;
          credit: number;
          partner_id: string | null;
        };
        Insert: {
          move_id: string;
          account_id: string;
          name: string;
          debit?: number;
          credit?: number;
          partner_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['account_move_lines']['Row']>;
      };
      sales_reconciliation: {
        Row: {
          id: string;
          sale_date: string;
          product_id: string;
          salesperson_id: string | null;
          customer_id: string | null;
          quantity: number;
          sale_price: number;
          channel: 'consignment' | 'office';
          stock_move_id: string | null;
          account_move_id: string | null;
          created_at: string;
        };
        Insert: {
          sale_date: string;
          product_id: string;
          salesperson_id?: string | null;
          customer_id?: string | null;
          quantity: number;
          sale_price: number;
          channel: 'consignment' | 'office';
          stock_move_id?: string | null;
          account_move_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sales_reconciliation']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      };
    };
    Views: {
      view_salesperson_catalog: {
        Row: {
          product_id: string;
          product_code: string;
          name: string;
          category: string | null;
          fabric: string | null;
          color: string | null;
          company_mrp: number;
          min_selling_price: number;
          office_qty: number;
          my_qty: number;
        };
      };
      report_day_wise: {
        Row: {
          sale_date: string;
          total_qty: number;
          total_revenue: number;
          total_cogs: number;
          net_profit: number;
        };
      };
      report_month_wise: {
        Row: {
          month_key: string;
          total_qty: number;
          total_revenue: number;
          total_cogs: number;
          net_profit: number;
        };
      };
      report_fy_wise: {
        Row: {
          fy_label: string;
          total_qty: number;
          total_revenue: number;
          total_cogs: number;
          net_profit: number;
        };
      };
      report_salesperson_summary: {
        Row: {
          salesperson_id: string;
          salesperson_name: string;
          total_qty: number;
          total_revenue: number;
          stock_in_hand: number;
        };
      };
    };
    Functions: {
      has_role: { Args: { name: string }; Returns: boolean };
      has_permission: { Args: { name: string }; Returns: boolean };
    };
  };
}

export type Product = Database['public']['Tables']['master_products']['Row'];
export type Partner = Database['public']['Tables']['master_partners']['Row'];
export type StockMove = Database['public']['Tables']['stock_moves']['Row'];
export type UserMaster = Database['public']['Tables']['users_master']['Row'];
