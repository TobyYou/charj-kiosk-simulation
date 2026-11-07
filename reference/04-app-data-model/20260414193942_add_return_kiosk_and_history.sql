/*
  # Add return station tracking to rentals

  ## Summary
  Adds the ability for chargers to be returned to any station (not just the one
  they were rented from), and tracks which station each charger is currently at.

  ## Changes

  ### Modified Tables

  **rentals**
  - `return_kiosk_id` (uuid, FK → kiosks): The kiosk the charger was actually returned to.
    Null until returned. May differ from `kiosk_id` (the renting kiosk).

  **slots**
  - No schema change needed — when a charger is returned to a different kiosk,
    we free the original slot and occupy an available slot at the return kiosk.

  ## Notes
  - Existing rentals will have `return_kiosk_id = NULL` (pre-feature returns).
  - The edge function will be updated to accept `returnKioskId` and assign a
    free slot at the return kiosk.
  - RLS: rentals table already allows service_role writes; no new policies needed.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'return_kiosk_id'
  ) THEN
    ALTER TABLE rentals ADD COLUMN return_kiosk_id uuid REFERENCES kiosks(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rentals_return_kiosk_id ON rentals(return_kiosk_id);
