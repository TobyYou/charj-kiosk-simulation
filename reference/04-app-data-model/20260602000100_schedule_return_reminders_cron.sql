/*
  # Schedule the 23-hour return reminder via pg_cron + pg_net  [NEUTRALIZED]

  ## Status: NO-OP (intentionally disabled)
  The original version of this migration scheduled the "send-return-reminders"
  pg_cron job pointing at the WRONG Supabase project ref
  (zdxabetivpybmvflqejt) with a hardcoded anon key for that wrong project.
  Left active, it would (re)create a broken cron job on any fresh `db reset`.

  This file is intentionally left as a no-op so that:
    - the migration history / version stays intact (no local↔remote mismatch),
    - nothing harmful runs on a fresh reset.

  The correct cron job is created by a later migration,
  20260605150000_fix_send_return_reminders_cron.sql (and was also set up
  manually in the live database), which targets the correct project
  (zejuudswfaxbmmvavhbx) using the vault-backed invoke pattern.

  Do not re-add the cron.schedule() call here — manage the job in the
  20260605150000 migration / supabase/schedule-cron-jobs.sql instead.
*/

SELECT 1; -- no-op
