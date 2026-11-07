# CharjCo — Portable Charger Rental MVP

Mobile-first web app for renting portable phone chargers from kiosks.
Users scan a QR code at a kiosk, pay via Stripe, pull out a charger, and return it later via a link.

---

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Database + Auth**: Supabase
- **Payments**: Stripe Checkout (Stripe.js)
- **Backend logic**: Supabase Edge Functions (Deno)

---

## Screens

| Route | Description |
|---|---|
| `/rent?kiosk=[id]` | Rent flow — linked from QR code on kiosk |
| `/return?rental=[id]` | Return flow — linked from confirmation email |
| `/account` | Email or phone verification login and rental history |
| `/admin` | Password-protected ops dashboard |
| `/devices?id=[deviceId]` | Device status page — online/offline state and per-slot powerbanks with borrow buttons |

---

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings → API**
3. Add them to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-admin-password
```

4. Apply the schema by running `schema.sql` in the Supabase SQL editor,
   or use the included migrations in `supabase/migrations/`.

---

## Scheduled jobs (pg_cron)

The **charge-overdue-deposits** edge function runs on an hourly schedule to capture deposits for rentals active longer than 24 hours (`OVERDUE_HOURS` in `supabase/functions/_shared/constants.ts`). It updates `deposit_status` from `held` to `charged` after a successful Stripe capture.

1. Enable **pg_cron** and **pg_net** in the Supabase dashboard (Database → Extensions) if not already on.
2. In the SQL editor, open `supabase/schedule-cron-jobs.sql`:
   - Replace `YOUR_ANON_KEY` in step 1 with your project anon key (Settings → API).
   - Run the full script (step 1 once, then step 2).
3. Confirm the job exists:

```sql
SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'charge-overdue-deposits-hourly';
```

Schedule: `0 * * * *` (top of every hour). Optional manual run:

```sql
SELECT public.invoke_charge_overdue_deposits();
```

The same schedule is in migration `supabase/migrations/20260604000000_schedule_charge_overdue_deposits_hourly.sql` for `supabase db push`; the Vault `anon_key` secret must exist before the job can invoke the function.

---

## Enabling Account Sign In

The account page supports two verification methods:

- **Google OAuth**: `signInWithOAuth` redirects through **`https://charjco.com/auth/callback`** (see `src/lib/authConfig.ts`). After Google sign-in, the app sends users to the `next` path (e.g. `/account` or `/rent?kiosk=…`).
- **Email magic link**: `signInWithOtp` sends a sign-in link; users return via `/auth/callback` to `/account`.
- **Phone code**: uses Supabase Auth Phone Login with Twilio Verify.

### Google OAuth redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**, add these **Redirect URLs**:

- `https://charjco.com/auth/callback`
- `http://localhost:5174/auth/callback` (local dev; set `VITE_APP_URL=http://localhost:5174` in `.env`)

In **Google Cloud Console → APIs & Services → Credentials → OAuth client**, set the authorized redirect URI to match what Supabase expects for your project (often the Supabase callback URL **or** your custom domain callback if you use Supabase custom auth domain). The app’s post-login destination is always `https://charjco.com/auth/callback` in production via `OAUTH_CALLBACK_URL`.

For phone login:

1. In Supabase Dashboard, go to **Authentication -> Providers -> Phone** and enable phone auth.
2. Configure Twilio Verify with your `AC...` Account SID, auth token, and `VA...` Verify Service SID.
3. Apply `supabase/migrations/20260531200000_add_phone_auth_rental_policy.sql`.

New rentals store phone numbers in E.164 format, such as `+1...`, so they can
be matched to verified phone login sessions.

---

## Adding Stripe Keys

1. Create an account at [stripe.com](https://stripe.com) and get your keys from the Dashboard → Developers
2. Add the **publishable key** to `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

3. Add the **secret key** as a Supabase Edge Function secret:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add `STRIPE_SECRET_KEY` = `sk_live_...`

### How Stripe payments work (two PaymentIntents)

| PI | Column | Amount | When |
|---|---|---|---|
| Rental fee | `stripe_payment_intent_id` | $1/hr (authorized at checkout, captured on return) | Checkout authorizes PI 1; `return-rental` captures hours × $1 |
| Deposit | `stripe_deposit_id` | $30 hold (max charge) | `confirm-rental` authorizes PI 2 after checkout; released on return or captured if 24h+ overdue |

- **Checkout** (`create-checkout`): Stripe Checkout authorizes **PI 1** ($1 rental fee, `capture_method: manual`). Nothing is captured yet.
- **Confirm** (`confirm-rental`): Creates and authorizes **PI 2** ($30 deposit, separate PaymentIntent). Assigns slot; saves both PI IDs.
- **Return** (`return-rental`): Captures actual rental fee on PI 1; **cancels** PI 2 (deposit released). If deposit was already charged (overdue), only frees the slot — **no refund**.
- **Overdue** (`charge-overdue-deposits`): Captures **$30 on PI 2 only**; cancels PI 1 authorization (no extra rental fee).

$30 is the maximum deposit charge; additional hourly rental fees are charged separately on return (PI 1 + supplemental PI if needed).

---

## Connecting Hardware

The app is designed to be plugged into physical kiosk hardware by an IoT engineer.
Search the codebase for `TODO: HARDWARE API` to find all integration points.

### Slot unlock (charger dispensing)

**File**: `supabase/functions/confirm-rental/index.ts`

After payment is confirmed and a slot is assigned, the app needs to send
an unlock command to the physical kiosk so the user can pull out the charger.

```
// TODO: HARDWARE API
// Send unlock command to kiosk [kiosk_id] slot [slot_number]
// Protocol: MQTT or REST — connect IoT engineer here
// Expected response: slot_unlocked confirmation within 3s
// On timeout: show user "Station error, please try again"
//   and cancel/refund the payment intent
```

**What the IoT engineer needs to implement:**
- An endpoint (REST) or topic (MQTT) that accepts `{ kiosk_id, slot_number }`
- Returns a confirmation (`slot_unlocked: true`) within 3 seconds
- If the kiosk is unreachable, the edge function should refund the payment
  and not finalize the rental

### Return detection (charger re-insertion)

**File**: `supabase/functions/return-rental/index.ts`

Currently, return is triggered manually when the user taps the "Return charger"
button in the app. In production this should be replaced with automatic detection.

```
// TODO: HARDWARE API
// Listen for slot [slot_number] re-insertion event from kiosk [kiosk_id]
// Currently triggered manually via the return screen
// Will be replaced with automatic detection from kiosk sensor
```

**What the IoT engineer needs to implement:**
- A sensor on each slot that detects charger insertion
- On detection, call the `return-rental` edge function with `{ rentalId }`
- The `rentalId` is stored in `slots.current_rental_id` in the database
- Alternatively, push an event via MQTT that triggers a webhook

### Kiosk online/offline status

The `kiosks.is_online` column controls whether a kiosk accepts new rentals.
The IoT system should update this field via the Supabase API (using the service
role key) when a kiosk goes offline or comes back online.

---

## Device status page (`/devices`)

`/devices?id=[deviceId]` shows the live state of a single MQTT device
(`deviceId` = the MQTT clientId, e.g. `863462062325864`):

- **Online / offline** — derived from `devices.status` (`active` → online).
- **Per-slot powerbanks** — each slot shows serial, availability, charging
  indicator, and battery level, with a **Borrow** button that ejects the
  powerbank.

**Data flow:**

- **Read** (`get-device` edge function): the `devices` and `powerbanks` tables
  have RLS enabled with **no anon read policy**, so the page cannot query them
  directly. It POSTs `{ deviceId }` to `get-device`, which uses the service role
  to return `{ found, online, device, powerbanks }`.
- **Borrow** (`send-device-command` edge function): the button POSTs
  `{ deviceId, brand, commandType, slotId }`. `commandType` is `FB` for
  `ypcjb001` devices and `popup` for `jc8f8e78`. The command is published to
  EMQX; the device then re-reports and the page refreshes.

These tables (`devices`, `powerbanks`, `mqtt_messages`, `rental_logs`) are
defined in `schema.sql` under **Device / MQTT subsystem**. Access is entirely
through service-role edge functions.

> The page is currently open (link-only) access — anyone with a `deviceId` can
> open it and borrow. Add auth before exposing it publicly.

---

## MQTT device edge functions

The device/MQTT subsystem is implemented as four Supabase Edge Functions (Deno).
They read/write the `devices`, `powerbanks`, `mqtt_messages`, and `rental_logs`
tables with the **service role**, so the frontend never touches those tables
directly.

| Function | Caller / trigger | Purpose |
|---|---|---|
| `device-status` | EMQX webhook (`client.connected` / `client.disconnected`) | Updates `devices.status` + `last_seen`; auto-registers a device on first connect |
| `handle-device-message` | EMQX webhook (`/+/+/user/update`) | Parses device reports (ypcjb001 text/CRC, jc8f8e78 JSON/binary); upserts `powerbanks`, updates `devices`, logs `mqtt_messages`/`rental_logs` |
| `send-device-command` | Frontend (anon key) | Publishes commands to the EMQX REST API (`/api/v5/publish`) — borrow (`FB`/`popup`), return, query |
| `get-device` | Frontend (anon key) | Returns `{ found, online, device, powerbanks }` for the `/devices` page |

**Required secrets** (Supabase Dashboard → Edge Functions → Secrets):
`EMQX_API_URL` (full URL incl. port, e.g. `http://mqtt.x3721.xyz:18083`),
`EMQX_API_KEY`, `EMQX_API_SECRET`.

**Deploy:**

```bash
# Webhook functions must skip JWT verification (EMQX has no Supabase JWT)
supabase functions deploy device-status         --no-verify-jwt --project-ref <ref>
supabase functions deploy handle-device-message  --no-verify-jwt --project-ref <ref>

# Frontend-called functions keep default JWT verification (accept the anon key)
supabase functions deploy send-device-command --project-ref <ref>
supabase functions deploy get-device          --project-ref <ref>
```

Configure the two webhooks in **EMQX Dashboard → Integration → Webhook** (see the
header comments in `device-status/index.ts` and `handle-device-message/index.ts`
for the exact rule SQL and request-body templates).

---

## Admin

Visit `/admin` and sign in with the password set in `VITE_ADMIN_PASSWORD` (local `.env` or Vercel environment variables).

> **Note**: `VITE_*` variables are embedded in the client bundle at build time. For production, use a strong unique password and plan to replace this with proper Supabase auth using an admin role in `auth.users` metadata.

---

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5174`. Test the rent flow at:
```
http://localhost:5174/rent?kiosk=11111111-0000-0000-0000-000000000001
```

Test the return flow at:
```
http://localhost:5174/return?rental=33333333-0000-0000-0000-000000000004
```

Admin dashboard:
```
http://localhost:5174/admin
```

Device status page:
```
http://localhost:5174/devices?id=test002
```
