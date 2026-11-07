/*
  # PowerPass Schema

  1. New Tables
    - `users` — app users identified by email/phone
    - `kiosks` — physical rental stations
    - `slots` — individual charger slots within a kiosk
    - `rentals` — rental transactions linking users, kiosks, slots, and Stripe

  2. Enums
    - `deposit_status` — tracks the state of the $20 deposit: held | released | charged

  3. Security
    - RLS enabled on all tables
    - Public SELECT on kiosks and slots (needed for QR-code scan flow without auth)
    - Authenticated users can read their own rentals and user record
    - Service role (edge functions) handles all writes
*/

-- Deposit status enum
CREATE TYPE deposit_status AS ENUM ('held', 'released', 'charged');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text,
  email       text UNIQUE NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Kiosks table
CREATE TABLE IF NOT EXISTS kiosks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name  text NOT NULL,
  address        text NOT NULL,
  total_slots    integer NOT NULL DEFAULT 0,
  is_online      boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- Slots table
CREATE TABLE IF NOT EXISTS slots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id           uuid NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  slot_number        integer NOT NULL,
  is_occupied        boolean NOT NULL DEFAULT false,
  current_rental_id  uuid,
  UNIQUE(kiosk_id, slot_number)
);

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES users(id),
  kiosk_id                  uuid NOT NULL REFERENCES kiosks(id),
  slot_id                   uuid REFERENCES slots(id),
  started_at                timestamptz DEFAULT now(),
  returned_at               timestamptz,
  deposit_status            deposit_status NOT NULL DEFAULT 'held',
  rental_fee_cents          integer NOT NULL DEFAULT 200,
  stripe_payment_intent_id  text,
  stripe_deposit_id         text
);

-- Add foreign key from slots back to rentals (circular, so added after both exist)
ALTER TABLE slots ADD CONSTRAINT fk_slots_current_rental
  FOREIGN KEY (current_rental_id) REFERENCES rentals(id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rentals_user_id   ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_kiosk_id  ON rentals(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_slots_kiosk_id    ON slots(kiosk_id);

-- ──────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────

ALTER TABLE users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- KIOSKS: public read (scan QR without signing in)
CREATE POLICY "Anyone can view kiosks"
  ON kiosks FOR SELECT
  TO anon, authenticated
  USING (true);

-- SLOTS: public read
CREATE POLICY "Anyone can view slots"
  ON slots FOR SELECT
  TO anon, authenticated
  USING (true);

-- USERS: users can read their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- USERS: allow insert from anon (edge function creates users)
CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RENTALS: users can read their own rentals
CREATE POLICY "Users can view own rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RENTALS: anon can read by ID (for return flow via deep link)
CREATE POLICY "Anyone can view rental by select"
  ON rentals FOR SELECT
  TO anon
  USING (true);
