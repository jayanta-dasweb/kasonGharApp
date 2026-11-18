-- =============================================================================
-- KASON GHAR — one-shot smoke fix
-- Run in Supabase SQL Editor (project uxxoqfabnqvoozhrhabx)
-- Creates notice board + targets + default roles if missing
-- =============================================================================

BEGIN;

-- Notice board
CREATE TABLE IF NOT EXISTS app_notifications (
  notification_id bigserial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'ALL',
  priority text NOT NULL DEFAULT 'NORMAL',
  link_href text,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  target_user_ids jsonb DEFAULT '[]'::jsonb,
  template_key text,
  send_local_alert boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_notification_reads (
  notification_id bigint NOT NULL REFERENCES app_notifications(notification_id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

ALTER TABLE app_notifications
  ADD COLUMN IF NOT EXISTS target_user_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS send_local_alert boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_app_notifications_active_created
  ON app_notifications (is_active, created_at DESC);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_notifications_select ON app_notifications;
CREATE POLICY app_notifications_select ON app_notifications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS app_notifications_insert ON app_notifications;
CREATE POLICY app_notifications_insert ON app_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS app_notifications_update ON app_notifications;
CREATE POLICY app_notifications_update ON app_notifications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS app_notifications_delete ON app_notifications;
CREATE POLICY app_notifications_delete ON app_notifications
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS app_notification_reads_select ON app_notification_reads;
CREATE POLICY app_notification_reads_select ON app_notification_reads
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS app_notification_reads_insert ON app_notification_reads;
CREATE POLICY app_notification_reads_insert ON app_notification_reads
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS app_notification_reads_delete ON app_notification_reads;
CREATE POLICY app_notification_reads_delete ON app_notification_reads
  FOR DELETE TO authenticated USING (true);

-- Permissions + roles
INSERT INTO permissions (name, guard_name, module, description)
SELECT x.name, 'web', split_part(x.name, '.', 1), x.name
FROM (VALUES
  ('masters.manage'),('products.manage'),('products.update_assigned'),('catalog.view'),
  ('inventory.manage'),('sales.reconcile'),('sales.own'),('accounts.manage'),
  ('reports.export'),('reports.own'),('notifications.view'),('notifications.manage'),
  ('profile.password'),('users.view'),('users.manage'),('rbac.manage'),('audit.view')
) AS x(name)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.name = x.name);

INSERT INTO roles (name, guard_name)
SELECT x.name, 'web'
FROM (VALUES ('super_admin'),('admin'),('salesperson')) AS x(name)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.name = x.name);

-- Seed welcome notice
INSERT INTO app_notifications (title, body, audience, priority)
SELECT
  'স্বাগতম · কাছন ঘৰ জাননী বোৰ্ড',
  'Notice board is ready. Admin can broadcast or send to specific users.',
  'ALL',
  'NORMAL'
WHERE NOT EXISTS (SELECT 1 FROM app_notifications LIMIT 1);

COMMIT;

SELECT 'app_notifications' AS t, count(*) FROM app_notifications
UNION ALL
SELECT 'roles', count(*) FROM roles;
