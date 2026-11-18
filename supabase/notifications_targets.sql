-- Extend notice board for broadcast + specific users (free in-app notifications)
-- Run after notifications_board.sql

BEGIN;

ALTER TABLE app_notifications
  ADD COLUMN IF NOT EXISTS target_user_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS send_local_alert boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_app_notifications_targets
  ON app_notifications USING gin (target_user_ids);

COMMIT;
