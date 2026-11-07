-- PowerPass Database Schema
-- Run this in your Supabase SQL editor or apply via migration

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE deposit_status AS ENUM ('held', 'released', 'charged');

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text,
  email       text UNIQUE NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kiosks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name  text NOT NULL,
  address        text NOT NULL,
  total_slots    integer NOT NULL DEFAULT 0,
  is_online      boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id           uuid NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  slot_number        integer NOT NULL,
  is_occupied        boolean NOT NULL DEFAULT false,
  current_rental_id  uuid,
  UNIQUE(kiosk_id, slot_number)
);

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

ALTER TABLE slots ADD CONSTRAINT fk_slots_current_rental
  FOREIGN KEY (current_rental_id) REFERENCES rentals(id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rentals_user_id   ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_kiosk_id  ON rentals(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_slots_kiosk_id    ON slots(kiosk_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Kiosks and slots are publicly readable (needed for QR-code scan flow)
CREATE POLICY "Anyone can view kiosks" ON kiosks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can view slots"  ON slots  FOR SELECT TO anon, authenticated USING (true);

-- Users can read their own record; inserts handled by edge functions (service role)
CREATE POLICY "Users can view own record" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Service can insert users"  ON users FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Rentals readable by anyone (return flow uses rental ID from QR/email link)
CREATE POLICY "Anyone can view rentals" ON rentals FOR SELECT TO anon, authenticated USING (true);

-- ── Device / MQTT subsystem ───────────────────────────────────────────────────
-- Backs the IoT hardware integration over EMQX/MQTT. Populated by the
-- device-status and handle-device-message edge functions (service role) and read
-- by the get-device edge function that powers the /devices?id=… page.
-- device_id is the MQTT clientId (e.g. 863462062325864 / test002).

CREATE TABLE IF NOT EXISTS devices (
  device_id      text PRIMARY KEY,
  brand          text NOT NULL DEFAULT 'unknown',
  status         text NOT NULL DEFAULT 'unknown',   -- 'active' | 'inactive' | 'unknown'
  receive_topic  text NOT NULL,
  publish_topic  text NOT NULL,
  last_seen      timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS powerbanks (
  powerbank_serial  text PRIMARY KEY,
  device_id         text NOT NULL,
  brand             text,
  slot_number       integer,
  status            text,                       -- 'available' | 'missing' | 'error' | 'unknown'
  battery_level     integer,
  slot_charging     text,                       -- 'on' | 'off'
  slot_lock         text DEFAULT 'closed',      -- 'open' | 'closed'
  slot_status_raw   text,
  return_status     text,
  last_reported_at  timestamptz,
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mqtt_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      text,
  brand          text,
  topic          text,
  payload        text,
  payload_hex    text,
  command        text,
  message_type   text NOT NULL CHECK (message_type IN ('received', 'sent')),
  direction      text,                          -- 'in' | 'out'
  protocol       text,
  validated      boolean DEFAULT false,
  error_message  text,
  "timestamp"    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          text UNIQUE,
  device_id         text,
  powerbank_serial  text,
  brand             text,
  message_id        text,
  command_type      text,
  slot_id           integer,
  status            text DEFAULT 'pending',     -- 'pending' | 'success' | 'failed'
  request_payload   text,
  request_topic     text,
  response_payload  text,
  response_topic    text,
  response_time     timestamptz,
  retry_count       integer DEFAULT 0,
  max_retries       integer DEFAULT 3,
  failure_reason    text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_powerbanks_device_id    ON powerbanks(device_id);
CREATE INDEX IF NOT EXISTS idx_mqtt_messages_device_id ON mqtt_messages(device_id);
CREATE INDEX IF NOT EXISTS idx_rental_logs_device_id   ON rental_logs(device_id);

-- RLS on, with NO anon/authenticated read policy: all access goes through the
-- service-role edge functions (device-status, handle-device-message,
-- send-device-command, get-device). Direct anon reads return zero rows.
ALTER TABLE devices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE powerbanks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mqtt_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_logs   ENABLE ROW LEVEL SECURITY;
