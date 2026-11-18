-- =============================================================================
-- KASON GHAR — Notification board for sellers + all staff
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Project: uxxoqfabnqvoozhrhabx
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app_notifications (
  notification_id bigserial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'ALL',
  -- ALL | salesperson | admin | accountant | super_admin | inventory | custom role name
  priority text NOT NULL DEFAULT 'NORMAL',
  -- LOW | NORMAL | HIGH | URGENT
  link_href text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_notification_reads (
  notification_id bigint NOT NULL REFERENCES app_notifications(notification_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_active_created
  ON app_notifications (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_audience
  ON app_notifications (audience);

CREATE INDEX IF NOT EXISTS idx_app_notification_reads_user
  ON app_notification_reads (user_id);

-- RLS: authenticated staff can read; admins manage
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_notifications_select ON app_notifications;
CREATE POLICY app_notifications_select ON app_notifications
  FOR SELECT TO authenticated
  USING (is_active = true OR created_by = auth.uid());

DROP POLICY IF EXISTS app_notifications_insert ON app_notifications;
CREATE POLICY app_notifications_insert ON app_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS app_notifications_update ON app_notifications;
CREATE POLICY app_notifications_update ON app_notifications
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS app_notification_reads_select ON app_notification_reads;
CREATE POLICY app_notification_reads_select ON app_notification_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS app_notification_reads_insert ON app_notification_reads;
CREATE POLICY app_notification_reads_insert ON app_notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS app_notification_reads_delete ON app_notification_reads;
CREATE POLICY app_notification_reads_delete ON app_notification_reads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMIT;

-- Seed sample for sellers
INSERT INTO app_notifications (title, body, audience, priority)
SELECT
  'স্বাগতম · কাছন ঘৰ জাননী বোৰ্ড',
  'Sellers: check stock allocations daily and post sales reconcile before evening close.',
  'ALL',
  'NORMAL'
WHERE NOT EXISTS (
  SELECT 1 FROM app_notifications WHERE title LIKE '%জাননী%'
);
