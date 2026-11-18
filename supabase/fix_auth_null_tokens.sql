-- Fix: Auth 500 "Database error querying schema"
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- Cause: NULL values in auth.users token columns (usually from manual SQL seed)

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  phone_change = COALESCE(phone_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_current IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR phone_change_token IS NULL
  OR phone_change IS NULL
  OR reauthentication_token IS NULL;

-- Optional: confirm the super-admin email alias exists
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = '7002911685@kasonghar.local';
