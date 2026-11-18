/** Canonical role names — keep DB + app in sync */
export const ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALESPERSON: 'salesperson',
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

/** Security / Users & Access — super_admin only */
export const SECURITY_PERMS = [
  'users.view',
  'users.manage',
  'rbac.manage',
  'audit.view',
] as const;

/** Day-to-day ops — admin + super_admin */
export const OPS_PERMS = [
  'masters.manage',
  'products.manage',
  'products.update_assigned',
  'catalog.view',
  'inventory.manage',
  'sales.reconcile',
  'sales.own',
  'accounts.manage',
  'reports.export',
  'reports.own',
  'notifications.view',
  'notifications.manage',
  'profile.password',
] as const;

export const ALL_PERMS = [...OPS_PERMS, ...SECURITY_PERMS] as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  salesperson: 'Salesperson',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin:
    'Full control including Users & Access (security). Can manage roles, staff, and audit.',
  admin:
    'Full operations: masters, stock, sales, accounts, reports. Cannot open Users & Access security.',
  salesperson:
    'Assigned products only: update description/price/status, notices, own sales, own report, change own password.',
};
