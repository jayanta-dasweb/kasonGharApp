-- =============================================================================
-- KASON GHAR — Default 3 roles + permissions
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Roles:
--   super_admin  → everything including Users & Access (security)
--   admin        → operations everything, NO security screens
--   salesperson  → assigned products, notices, own report, own password
-- =============================================================================

BEGIN;

-- Permissions catalog
INSERT INTO permissions (name, guard_name)
SELECT x.name, 'web'
FROM (VALUES
  ('masters.manage'),
  ('products.manage'),
  ('products.update_assigned'),
  ('catalog.view'),
  ('inventory.manage'),
  ('sales.reconcile'),
  ('sales.own'),
  ('accounts.manage'),
  ('reports.export'),
  ('reports.own'),
  ('notifications.view'),
  ('notifications.manage'),
  ('profile.password'),
  ('users.view'),
  ('users.manage'),
  ('rbac.manage'),
  ('audit.view')
) AS x(name)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.name = x.name
);

-- Roles
INSERT INTO roles (name, guard_name)
SELECT x.name, 'web'
FROM (VALUES
  ('super_admin'),
  ('admin'),
  ('salesperson')
) AS x(name)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.name = x.name
);

-- Helper: grant all listed perms to a role
CREATE OR REPLACE FUNCTION kg_grant_role_perms(p_role text, p_perms text[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rid int;
  pname text;
  pid int;
BEGIN
  SELECT id INTO rid FROM roles WHERE name = p_role LIMIT 1;
  IF rid IS NULL THEN
    RAISE EXCEPTION 'Role % missing', p_role;
  END IF;
  FOREACH pname IN ARRAY p_perms LOOP
    SELECT id INTO pid FROM permissions WHERE name = pname LIMIT 1;
    IF pid IS NULL THEN
      CONTINUE;
    END IF;
    INSERT INTO role_has_permissions (role_id, permission_id)
    VALUES (rid, pid)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Clear then re-apply for the three system roles (safe idempotent)
DELETE FROM role_has_permissions
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('super_admin','admin','salesperson'));

-- SUPER ADMIN — all permissions
SELECT kg_grant_role_perms(
  'super_admin',
  ARRAY[
    'masters.manage','products.manage','products.update_assigned','catalog.view',
    'inventory.manage','sales.reconcile','sales.own','accounts.manage',
    'reports.export','reports.own','notifications.view','notifications.manage',
    'profile.password','users.view','users.manage','rbac.manage','audit.view'
  ]
);

-- ADMIN — ops only (no security)
SELECT kg_grant_role_perms(
  'admin',
  ARRAY[
    'masters.manage','products.manage','products.update_assigned','catalog.view',
    'inventory.manage','sales.reconcile','sales.own','accounts.manage',
    'reports.export','reports.own','notifications.view','notifications.manage',
    'profile.password'
  ]
);

-- SALESPERSON — limited
SELECT kg_grant_role_perms(
  'salesperson',
  ARRAY[
    'catalog.view','products.update_assigned','sales.own','sales.reconcile',
    'reports.own','notifications.view','profile.password'
  ]
);

DROP FUNCTION IF EXISTS kg_grant_role_perms(text, text[]);

COMMIT;

-- Verify
SELECT r.name AS role, p.name AS permission
FROM roles r
JOIN role_has_permissions rhp ON rhp.role_id = r.id
JOIN permissions p ON p.id = rhp.permission_id
WHERE r.name IN ('super_admin','admin','salesperson')
ORDER BY r.name, p.name;
