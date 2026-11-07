/*
  # Hourly pg_cron job: charge overdue deposits (24h+)

  ## Summary
  Schedules `charge-overdue-deposits-hourly` to run at minute 0 every hour.
  Each run POSTs to the `charge-overdue-deposits` edge function, which:
    - Finds active rentals (`returned_at` IS NULL, `slot_id` set, `deposit_status` = held)
      with `started_at` older than 24 hours
    - Captures the deposit on Stripe when the PaymentIntent is `requires_capture`
    - Sets `deposit_status` to `charged`

  ## Prerequisites
  Store your project's anon key in Supabase Vault (run once in SQL editor):
    SELECT vault.create_secret(
      '<anon-key-from-dashboard-settings-api>',
      'anon_key',
      'pg_cron invokes edge functions'
    );
  Or run `supabase/schedule-cron-jobs.sql` which includes this step.

  ## Notes
  - Project URL: zejuudswfaxbmmvavhbx (update `invoke_charge_overdue_deposits` if your ref differs)
  - `cron.schedule` upserts by job name; this migration unschedules any prior job first
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  jid bigint;
BEGIN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname = 'charge-overdue-deposits-hourly'
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.invoke_charge_overdue_deposits()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  request_id bigint;
  api_key text;
  base_url text := 'https://zejuudswfaxbmmvavhbx.supabase.co';
BEGIN
  SELECT decrypted_secret INTO api_key
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key'
  ORDER BY created_at DESC
  LIMIT 1;

  IF api_key IS NULL OR length(trim(api_key)) = 0 THEN
    RAISE EXCEPTION
      'Vault secret "anon_key" is missing. Run supabase/schedule-cron-jobs.sql in the SQL editor first.';
  END IF;

  SELECT net.http_post(
    url     := base_url || '/functions/v1/charge-overdue-deposits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || trim(api_key)
    ),
    body    := '{}'::jsonb
  ) INTO request_id;

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_charge_overdue_deposits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_charge_overdue_deposits() TO postgres;

SELECT cron.schedule(
  'charge-overdue-deposits-hourly',
  '0 * * * *',
  $$ SELECT public.invoke_charge_overdue_deposits(); $$
);
