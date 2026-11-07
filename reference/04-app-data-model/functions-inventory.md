# Supabase Edge Functions Inventory

Generated from a full read of every file in `supabase/functions/` and `supabase/functions/_shared/`.

---

## Shared Libraries (`_shared/`)

### `constants.ts`
Pricing constants, CORS headers, and pure utility functions used across all functions.

| Constant | Value |
|---|---|
| `INITIAL_RENTAL_FEE_CENTS` | 100 ($1.00) |
| `DEPOSIT_CENTS` | 3000 ($30.00) |
| `CHECKOUT_TOTAL_CENTS` | 3100 ($31.00) |
| `HOURLY_RATE_CENTS` | 100 ($1.00/hr) |
| `OVERDUE_HOURS` | 24 |
| `REMINDER_HOURS` | 23 |

Exports: `jsonResponse`, `calcRentalFeeCents`, `calcHoursBilled`, `formatDuration`, `CARD_DECLINED_MESSAGE`.

---

### `stripePayments.ts`
Shared Stripe payment-intent helpers.

| Function | What it does |
|---|---|
| `createDepositPaymentIntent` | Creates a $30 manual-capture PI (deposit hold, PI 2) |
| `cancelOpenPaymentIntent` | Cancels a PI only if status is `requires_capture` or `requires_confirmation` |
| `captureDepositPaymentIntent` | Captures exactly $30 on the deposit PI; handles already-captured idempotency |
| `captureRentalFeePaymentIntent` | Captures hours × $1 on the rental PI (PI 1); creates a supplemental off-session PI for any remainder |

---

### `emqx.ts`
Single function `publishToEMQX(topic, payload, qos)` that POSTs to the EMQX v5 REST API (`/api/v5/publish`).

**Chinese header note (translated):**
> "Single REST publish timeout limit (milliseconds). Webhook must respond quickly, otherwise EMQX will timeout and retry."

Timeout is hard-coded to 8 000 ms. Supports both plain-text and base64-encoded binary payloads.

Env vars required: `EMQX_API_URL`, `EMQX_API_KEY`, `EMQX_API_SECRET`.

---

### `commands.ts`
Builds the MQTT command strings for both device brands. **No I/O — pure construction only.**

#### ypcjb001 payload format (`buildYpcjb001Command`)

Topic: `/ypcjb001/${deviceId}/user/get`

| Command | Payload format |
|---|---|
| `FB` / `rent` | `{FB,${messageId},${orderId},${slotId},${CRC16(FB,msgId,orderId,slotId,GZXJ)}}` |
| `RS` / `return` | `{RS,${messageId},${orderId},${slotId},${CRC16(RS,...)}}` |
| `CQ` / `check` | `{CQ,${messageId},${deviceId}}` |
| `DS` | `{DS,${messageId},${deviceId},${CRC16(DS,msgId,deviceId,GZXJ)}}` |
| `CN` | `{CN,${deviceId},DOMAIN:test.gzxj-smart.com;PORT:1883;HB:180;BP:60;UN:${deviceId};PW:123456_83D3}` |

CRC is CRC-16/Modbus over the comma-joined data fields plus the salt `GZXJ`. The CRC is appended as the last field inside `{}`.

#### jc8f8e78 payload format (`buildJC8F8E78Command`)

Topic: `/jc8f8e78/${deviceId}/user/get`

| Command | Payload (JSON string) |
|---|---|
| `popup_sn` / `rent` | `{"cmd":"popup_sn","data":<powerbankSerialNumber>}` |
| `check_all` / `check` | `{"cmd":"check_all"}` |
| `popup` | `{"cmd":"popup","data":"<slotNumber>","io":"<io>"}` |

Note: for `popup_sn`, `data` is the **powerbank serial number** (SN), not the slot number. The function looks up the SN from the `powerbanks` table before calling this builder.

---

### `crc16.ts`
CRC-16/Modbus implementation used by ypcjb001 protocol.

`crc16Modbus(data)` — computes CRC over input string bytes.  
`validateMessage(payload, key)` — strips `{}`, splits on `,`, computes CRC over all fields except the last, compares against the last field (the received CRC).

---

### `utils.ts`
Low-level binary/encoding helpers.

`getBeijingTime()` — returns current time as Beijing ISO string (`+08:00`).  
`decodeBase64ToBuffer`, `bufferToHex`, `hexToBuffer`, `readU16BE`, `readU32BE` — used by jc8f8e78 binary parser.

---

### `ypcjb001.ts`
Protocol handlers for inbound ypcjb001 messages. Called by `handle-device-message`.

**Chinese comments translated:**

| Comment | Translation |
|---|---|
| `// AC：整机状态上报` | AC: full-unit status report |
| `// 充电宝为 NULL：若该槽位原本有充电宝，标记为 removed` | Powerbank is NULL: if this slot previously had a powerbank, mark it as removed |
| `// 归还失败码0：补发 RS 指令确认` | Return failure code 0: re-send RS command to confirm |
| `// RS：归还确认上报` | RS: return-confirmation report |
| `// CQ：槽位状态查询，回发 AC（查全部）或 CQ（查单槽）` | CQ: slot status query; reply with AC (all slots) or CQ (single slot) |
| `// KW/BW/FB：借还响应，回发 BR 确认并更新 rental_logs / powerbanks` | KW/BW/FB: rent/return response from device; reply with BR confirmation and update rental_logs / powerbanks |
| `// 归还也写入 rental_logs（command_type=RS + serial），使借出/归还可按充电宝区分` | Return also writes to rental_logs (command_type=RS + serial) so rent and return events are distinguishable per powerbank |
| `// 补全 powerbank_serial：按孔位查当前占用的充电宝序列号` | Fill in powerbank_serial: look up the serial of the powerbank currently occupying that slot |
| `// KW/FB 需回发 BR 确认` | KW/FB requires a BR confirmation reply |
| `// 更新充电宝状态` | Update powerbank status |

| Handler | Trigger message | What it does |
|---|---|---|
| `handleACMessage` | `{AC,...}` | Parses full-unit status; upserts all powerbanks; marks missing ones as `missing` |
| `handleRSMessage` | `{RS,...}` | Confirms return success; upserts powerbank as `available`; writes to `rental_logs`; sends BR reply |
| `handleCQMessage` | `{CQ,...}` | Status query; responds with AC (all slots) or CQ (single slot) using DB data |
| `handleRentalResponse` | `{KW,...}`, `{BW,...}`, `{FB,...}` | Processes rent/return confirmation; sends BR reply; updates `rental_logs` and `powerbanks` |

---

### `jc8f8e78.ts`
Higher-level helpers for jc8f8e78 data. Called by `handle-device-message`.

**Chinese comments translated:**

| Comment | Translation |
|---|---|
| `// 保存二进制解析出的充电宝：slot_number 缺失时查库补全，仅写入 schema 允许字段` | Save powerbanks parsed from binary: if slot_number is missing, look it up in the DB to fill in; only write schema-permitted fields |
| `// 处理 JC8F8E78 JSON 格式的充电宝数据上报（兼容 slots 数组 / powerbanks 数组 / slots 对象）` | Handle JC8F8E78 JSON-format powerbank data reports (compatible with slots array, powerbanks array, or slots object) |

`saveJC8F8E78Powerbanks` — upserts parsed powerbanks into DB.  
`mapJC8F8E78Status` — maps numeric status codes to string (`available`, `missing`, `error`, etc.).  
`handleJC8F8E78Json` — handles JSON-format reports (three compatible layouts).

---

### `jc8f8e78-binary.ts`
Binary protocol parser for jc8f8e78 (0xA8 header protocol). Called by `handle-device-message`.

**Chinese comments translated:**

| Comment | Translation |
|---|---|
| `// 状态映射（完整版，与 server.js 一致）` | Status code map (full version, consistent with legacy server.js) |
| `// 0x01 命令：设备状态查询响应` | 0x01 command: device status query response |
| `// 0x21 命令：孔位弹出响应` | 0x21 command: slot ejection response |
| `// 0x31 命令：SN号弹出响应` | 0x31 command: SN-based ejection response |
| `// 弹出成功 -> rented；slot_number 缺失，交由保存阶段查库补全` | Ejection success → rented; slot_number missing, deferred to save stage to look up from DB |
| `// 0x40 命令：充电宝归还上报` | 0x40 command: powerbank return report |
| `// 0x10 命令：主动上报整机信息（机芯数动态、每机芯 6+slot_count*15、孔位 1-based）` | 0x10 command: proactive full-unit status report (dynamic module count; each module is 6 + slot_count×15 bytes; slots are 1-based) |
| `// 校验（补码），仅告警不阻断` | Checksum (two's complement); warning-only, does not block processing |

`parseJC8F8E78Message` dispatches on command byte:

| Command byte | What it parses |
|---|---|
| `0x01` | Device status query response — 10-byte slot records |
| `0x10` | Proactive full-unit report — dynamic multi-module layout |
| `0x21` | Slot-number ejection response |
| `0x31` | SN-based ejection response |
| `0x40` | Return report |

---

## Edge Functions

---

### `create-checkout`

**Purpose:** Creates a Stripe Checkout session and a pending `rentals` row.

**Trigger:** Frontend (`RentPage.tsx`) — authenticated POST.

**Inputs:**
```json
{ "email": "...", "name": "...", "phone": "...", "kioskId": "...", "origin": "https://...", "userId": "..." }
```
Auth: requires `Authorization: Bearer <access_token>` matching the submitted email. Returns 403 if unauthenticated.

**Effects:**
- Reads: `kiosks` (validate online), `slots` (check availability), `users` (legacy reconciliation), `auth.users` (listUsers fallback)
- Writes: `users` (ensure/reconcile public user row), `rentals` (insert pending row with `slot_id=null`, `started_at=null`), `rentals` (update with `stripe_payment_intent_id` after session created)
- Stripe: creates/finds customer, creates Checkout session (mode=`payment`, `capture_method=manual`)
- Returns: `{ checkoutUrl, rentalId }`

**Key notes:**
- PI 1 (rental fee) is authorized via Checkout at `$1.00`, `capture_method: manual`.
- PI 2 ($30 deposit) is NOT created here — it's created in `confirm-rental` after payment.
- Legacy public.users ID reconciliation happens here: if a random-UUID user row exists for the same email, it's re-keyed to the auth UUID.

---

### `confirm-rental`

**Purpose:** Verifies Stripe payment completion, authorizes $30 deposit, assigns a DB slot, and sends a confirmation email.

**Trigger:** Frontend (`RentPage.tsx`) — called after Stripe redirect with `?session_id=` and `?rental_id=`.

**Inputs:**
```json
{ "sessionId": "cs_...", "rentalId": "uuid", "origin": "https://..." }
```
Also accepts `{ "sessionId": "...", "checkOnly": true }` for declined-payment polling.

Auth: optional Bearer token (used to link rental to auth user if present).

**Effects:**
- Reads: `rentals`, `slots` (find unoccupied slot), `kiosks`, `users`
- Writes: `rentals` (update: `slot_id`, `started_at`, `stripe_deposit_id`, `deposit_status=held`), `slots` (mark `is_occupied=true`), `users` (ensure public user row)
- Stripe: retrieves Checkout session + PI 1; creates PI 2 ($30 deposit, `capture_method: manual`); cancels PI 1 if no slot available
- Email: sends "Rental confirmed" email via Resend (async, `EdgeRuntime.waitUntil`)
- Returns: `{ rental, kiosk, slot }`

**⚠️ TODO — slot ejection not wired up (see Q1 below).**

---

### `return-rental`

**Purpose:** Processes a charger return — captures the rental fee, releases the deposit, frees both slots, and sends a return confirmation email.

**Trigger:** Frontend (`ReturnPage.tsx`) — unauthenticated POST (accessible by anyone with the rental UUID).

**Inputs:**
```json
{ "rentalId": "uuid", "returnKioskId": "uuid" }
```
No auth required.

**Effects:**
- Reads: `rentals`, `kiosks` (return kiosk), `slots` (find free return slot), `users`
- Writes: `rentals` (update: `returned_at`, `deposit_status`, `rental_fee_cents`, `return_kiosk_id`), `slots` (free original slot + mark return slot as free)
- Stripe: captures PI 1 (hours × $1); cancels PI 2 (deposit release); if deposit already charged, cancels PI 1 only
- Email: sends "Return confirmed" email via Resend (async)
- Returns: `{ rental, kiosk, slot, duration, hoursBilled, feeCents, depositCents, depositCharged }`

**Note:** The return slot is marked `is_occupied: false` immediately (no `is_occupied: true` transition) because the returned charger begins charging in that slot and the slot becomes available again.

---

### `charge-overdue-deposits`

**Purpose:** Batch job — captures the $30 deposit for every rental that has been active for more than 24 hours without being returned.

**Trigger:** Cron / manual admin POST. No auth enforced in the function body (relies on caller knowing the URL).

**Inputs:** No body required.

**Effects:**
- Reads: `rentals` (where `returned_at IS NULL`, `deposit_status='held'`, `started_at < now()-24h`)
- Writes: `rentals` (update `deposit_status='charged'`)
- Stripe: captures deposit PI (`captureDepositPaymentIntent`); cancels rental PI
- Email: sends "Deposit charged" email via Resend per rental
- Returns: `{ processed, results[] }`

---

### `send-return-reminders`

**Purpose:** Batch job — sends a "1 hour left" reminder email for rentals between 23 h and 24 h old that haven't received one yet.

**Trigger:** Cron / manual admin POST. No auth enforced.

**Inputs:** No body required.

**Effects:**
- Reads: `rentals` (where `returned_at IS NULL`, `deposit_status='held'`, `reminder_sent_at IS NULL`, `started_at` in 23–24 h window), `kiosks`, `slots`, `users`
- Writes: `rentals` (update `reminder_sent_at`)
- Email: sends "Return reminder" email via Resend per rental
- Returns: `{ processed, sent, results[], runAt }`

---

### `cancel-abandoned-checkout`

**Purpose:** Cleans up rental rows where the user navigated away before completing Stripe Checkout (slot_id is null — payment never confirmed).

**Trigger:** Frontend (`RentPage.tsx`) — called when the page detects an abandoned prior checkout for the same kiosk.

**Inputs:**
```json
{ "kioskId": "uuid", "rentalId": "uuid (optional)" }
```
Auth: requires `Authorization: Bearer <access_token>`.

**Effects:**
- Reads: `rentals` (where `user_id=authUser`, `kiosk_id=kioskId`, `slot_id IS NULL`, `returned_at IS NULL`)
- Stripe: cancels PI 1 if present
- Writes: `rentals` (delete abandoned rows)
- Returns: `{ ok: true, deleted: N }`

---

### `force-charge-deposit`

**Purpose:** Admin override to manually capture a rental's $30 deposit.

**Trigger:** AdminPage — POST, no auth check (relies on admin-only UI access and knowing the URL).

**Inputs:**
```json
{ "rentalId": "uuid" }
```

**Effects:**
- Reads: `rentals`
- Stripe: calls `captureDepositPaymentIntent`
- Writes: `rentals` (update `deposit_status='charged'`)
- Returns: `{ success: true, depositCents: 3000 }`

---

### `check-auth-provider`

**Purpose:** Tells the frontend whether a given email is Google-OAuth-only (no email/password identity), so the sign-in UI can hide the magic-link option.

**Trigger:** Frontend (`AccountPage.tsx`, `RentPage.tsx`) — POST.

**Inputs:**
```json
{ "email": "user@example.com" }
```
No auth required.

**Effects:**
- Reads: `auth.users` via `supabase.auth.admin.getUserByEmail`
- Returns: `{ googleOnly: true | false }`

---

### `send-device-command`

**Purpose:** Unified frontend entry point for publishing MQTT commands to physical kiosk devices via the EMQX REST API.

**Trigger:** Frontend (`DevicesPage`) — authenticated POST.

**Chinese header (translated):**
> "Device command dispatch Edge Function. Unified frontend entry point — publishes commands to devices via the EMQX REST API. Replaces the original Next.js API Routes (`/api/rent-fb`, `/api/cq`, etc.) + MQTT persistent connection architecture.
>
> Callers: frontend pages — `src/pages/index.tsx` → `handleCheckStatus()`; `src/pages/device/[id].tsx` → `handleRent()` / `handleQuickActionSNPopup()` / `handleCQQuery()` etc.
>
> Data flow: Frontend → Edge Function → EMQX REST API (`/api/v5/publish`) → MQTT → Device
>                                    ↘ rental_logs table records command log"

**Inputs:**
```json
{
  "deviceId": "test002",
  "brand": "ypcjb001 | jc8f8e78",
  "commandType": "FB | RS | CQ | DS | CN | popup_sn | check_all | popup",
  "slotId": 2,
  "io": "0"
}
```
No server-side auth enforced.

**Effects:**
- Reads: `powerbanks` (look up serial for the slot before issuing `popup_sn`)
- Writes: `mqtt_messages` (all commands), `rental_logs` (rent/return commands only)
- MQTT: publishes via EMQX REST API to device topic
- Returns: `{ success, message, messageId, orderId }`

**Note on timeout:** An 8 000 ms abort controller is used because cross-border connections to EMQX occasionally drop packets and would otherwise hang for ~127 seconds.

---

### `handle-device-message`

**Purpose:** Receives EMQX webhook callbacks when a device publishes a message; parses the protocol and updates the database.

**Trigger:** EMQX Webhook — fires on topic `/+/+/user/update` (all device report topics).

**Chinese header (translated):**
> "Device message receive Edge Function. Receives device-reported messages forwarded by the EMQX Webhook, parses the protocol, and writes to the database. Replaces the original Node.js server.js MQTT persistent subscription architecture.
>
> EMQX Dashboard → Integration → Webhook  
> Trigger topic: `/+/+/user/update` (wildcard all device report topics)
>
> Recommended EMQX rule SQL (binary-safe; binary payload converted to hex by EMQX):  
> `SELECT topic, bin2hexstr(payload) as payload_hex, clientid, qos FROM "/+/+/user/update"`
>
> Only `payload_hex` needs to be forwarded. Binary protocols (jc8f8e78 0xA8) avoid `${payload}` corrupting the JSON; text protocols (ypcjb001) are recovered from hex by this function.
>
> Data flow: Device → MQTT → EMQX → Webhook → Edge Function → Supabase Database  
>                                              ↘ EMQX REST API sends reply commands (AC/CQ/RS/BR)"

**Inputs:** JSON body `{ "topic": "...", "payload_hex": "..." }` from EMQX webhook. Also handles raw binary body and UTF-8-corrupted fallback.

**Effects:**
- Reads/Writes: `mqtt_messages` (all inbound + outbound replies), `devices` (update `last_seen`, auto-register), `powerbanks` (upsert state), `rental_logs` (update rent/return status)
- MQTT: publishes reply commands (BR, RS, AC, CQ) back via EMQX

**Brand/protocol dispatch:**

| Brand | Format | Handlers called |
|---|---|---|
| `ypcjb001` | Text + CRC | `handleACMessage`, `handleRSMessage`, `handleRentalResponse`, `handleCQMessage` |
| `jc8f8e78` | Binary 0xA8 or JSON | `parseJC8F8E78Message` + `saveJC8F8E78Powerbanks`, or `handleJC8F8E78Json` |

---

### `device-status`

**Purpose:** Tracks device online/offline state by listening to EMQX `client.connected` and `client.disconnected` events.

**Trigger:** EMQX Webhook — two webhooks configured in EMQX Dashboard (connected + disconnected events).

**Chinese header (translated):**
> "EMQX client connect/disconnect listener Edge Function. Listens to EMQX `client.connected` and `client.disconnected` events and automatically updates the `status` and `last_seen` fields in the `devices` table.
>
> Configure two Webhooks in EMQX Dashboard → Integration → Webhook:  
> 1. `device-online-listener` — trigger event: `client.connected`  
> 2. `device-offline-listener` — trigger event: `client.disconnected`
>
> Device MQTT clientId naming convention: the clientId IS the device_id (e.g. `test002`, `863462062325863`)."

**Inputs:**
```json
{ "event": "client.connected | client.disconnected", "clientid": "deviceId", ... }
```

**Effects:**
- Reads: `devices` (lookup brand for logging)
- Writes: `devices` (update `status`, `last_seen`; auto-insert with `brand=unknown` placeholder on first connect), `mqtt_messages` (log event with `protocol='event'`)

---

### `get-device`

**Purpose:** Returns device status and per-slot powerbank data for the admin DevicesPage. Uses service role because `devices` and `powerbanks` tables are RLS-locked to anon.

**Chinese header (translated):**
> "Device detail query Edge Function. Called by frontend `/devices?id=<deviceId>` page. `devices` / `powerbanks` are internal tables (RLS locked, anon cannot read), so service role is used to read and return: device online status + per-slot powerbanks."

**Trigger:** Frontend (`DevicesPage`) — POST.

**Inputs:**
```json
{ "deviceId": "863462062325864" }
```

**Effects:**
- Reads: `devices`, `powerbanks`
- Returns: `{ found: false }` or `{ found: true, online: bool, device: {...}, powerbanks: [...] }`

---

## Specific Questions

---

### Q1 — Does `confirm-rental` still have a TODO for slot ejection, or does it call `send-device-command`?

**It still has the TODO. `send-device-command` is never called.**

The exact code in `confirm-rental/index.ts`, between creating the deposit PI and writing the rental row to the database:

```typescript
// TODO: HARDWARE API — unlock kiosk slot before finalizing rental

const authUserId =
  (await resolveAuthUserId(req, supabase)) ??
  session.metadata?.user_id ??
  rentalPi.metadata?.user_id ??
  null;
```

That comment is the only reference to hardware in the entire file. There is no `fetch` call to `send-device-command`, no import of any MQTT utility, and no call to `publishToEMQX`. After `confirm-rental` completes, the `rentals` row has a `slot_id` and the physical kiosk slot has never been told to eject.

---

### Q2 — Exact payload format for each brand

Both brands are constructed in `_shared/commands.ts`.

**ypcjb001 — `buildYpcjb001Command`:**

```typescript
// rent / FB
const dataPart = `FB,${messageId},${orderId},${slotId}`;
payload = `{${dataPart},${crc16Modbus(dataPart + ',' + YPCJB001_SALT)}}`;
// e.g. {FB,1720000000,B20000000,2,A3F1}

// return / RS
const dataPart = `RS,${messageId},${orderId},${slotId}`;
payload = `{${dataPart},${crc16Modbus(dataPart + ',' + YPCJB001_SALT)}}`;

// check / CQ
payload = `{CQ,${messageId},${deviceId}}`;

// DS
const dataPart = `DS,${messageId},${deviceId}`;
payload = `{${dataPart},${crc16Modbus(dataPart + ',' + YPCJB001_SALT)}}`;

// CN
payload = `{CN,${deviceId},DOMAIN:test.gzxj-smart.com;PORT:1883;HB:180;BP:60;UN:${deviceId};PW:123456_83D3}`;
```

Salt is `GZXJ`. `messageId` = `Math.floor(Date.now() / 1000).toString()`. `orderId` = `B` + last 8 digits of `Date.now()`.

**jc8f8e78 — `buildJC8F8E78Command`:**

```typescript
// rent / popup_sn — eject by serial number
payload = JSON.stringify({ cmd: 'popup_sn', data: sn });
// e.g. {"cmd":"popup_sn","data":"123456789"}
// sn is the powerbank_serial looked up from the powerbanks table

// check / check_all
payload = JSON.stringify({ cmd: 'check_all' });

// popup — eject by slot number
const slotNum = parseInt(slotId as string, 10);
payload = JSON.stringify({ cmd: 'popup', data: slotNum.toString(), io: io.toString() });
// e.g. {"cmd":"popup","data":"3","io":"0"}
```

---

### Q3 — Any Stripe webhook handler anywhere?

**No. There is no Stripe webhook handler in this codebase.**

Every function that touches Stripe initiates calls *outward* to the Stripe API. None of them listen for inbound Stripe events (`checkout.session.completed`, `payment_intent.payment_failed`, `payment_intent.canceled`, etc.).

The confirmation flow is entirely frontend-driven: after Stripe redirects the user back to `/rent?session_id=...&rental_id=...`, the frontend calls `confirm-rental` with those parameters. If the user closes the browser before returning, the rental row stays in `slot_id=null` limbo until `cancel-abandoned-checkout` cleans it up on the next attempt.

---

### Q4 — What EXISTS vs what is MISSING for "customer pays → charger pops out"

#### What EXISTS ✅

| Step | Function |
|---|---|
| Customer fills out form and clicks "Pay" | `create-checkout` — creates pending rental row + Stripe Checkout session |
| Stripe processes payment, redirects user | Stripe Checkout (external) |
| Frontend confirms payment | `confirm-rental` — verifies session, authorizes $30 deposit, assigns DB slot, sends email |
| MQTT command builder | `_shared/commands.ts` — `buildYpcjb001Command` / `buildJC8F8E78Command` fully implemented |
| EMQX publisher | `_shared/emqx.ts` + `send-device-command` — fully implemented, publishes to device |
| Device receives command and ejects charger | Physical device + EMQX MQTT (external) |
| Device confirms ejection | Device publishes `{KW,...}` / `{FB,...}` / `0x31` response |
| Server receives device confirmation | `handle-device-message` → `handleRentalResponse` / `parseCommand31` — updates `rental_logs` + `powerbanks` |
| Customer returns charger | `return-rental` — captures fee, releases deposit, frees slot |
| Overdue handling | `charge-overdue-deposits` + `send-return-reminders` |

#### What is MISSING ❌

**1. The bridge between `confirm-rental` and `send-device-command`**

The `// TODO: HARDWARE API` comment in `confirm-rental` marks exactly where this goes. After the `rentals` row is written with `slot_id`, `confirm-rental` needs to:

1. Look up the `kiosk_id` → find the corresponding `device_id` and `brand` (e.g. from a `kiosks.device_id` column or a join to `devices`)
2. Look up `slot.slot_number` (already in hand as `slot.slot_number`)
3. Call `send-device-command` (or inline `publishToEMQX` + `buildYpcjb001Command`) with `commandType=FB` (ypcjb001) or `popup_sn` / `popup` (jc8f8e78)

**2. A `kiosks` → `devices` mapping**

`confirm-rental` knows `rental.kiosk_id`. `send-device-command` needs `deviceId` and `brand`. There is currently no column on the `kiosks` table (visible in the edge function queries) linking a kiosk to its MQTT device. This mapping needs to exist — either as a `device_id` foreign key on `kiosks`, or a lookup through `devices` by `kiosk_id`.

**3. No Stripe webhook handler**

If a user's card is declined *after* the redirect (rare but possible), or if Stripe sends a `payment_intent.payment_failed` after initial authorization, nothing in the backend catches it. A `stripe-webhook` function listening for `checkout.session.expired`, `payment_intent.canceled`, and `payment_intent.payment_failed` would make the system reliable against these edge cases and remove the dependency on the frontend always returning to the success URL.

**4. No device confirmation → rental linkage**

When the device confirms ejection (`{KW,...}` / `0x31` response), `handle-device-message` updates `rental_logs` and `powerbanks` — but it does **not** update the `rentals` table with a confirmed-ejection timestamp or the `powerbank_serial` of the specific charger that was dispensed. Without this, there's no way to know from the rental record *which physical powerbank* the customer has.

**Summary pipeline:**

```
create-checkout ✅ → [Stripe Checkout] ✅ → confirm-rental ✅
                                                    |
                                         TODO: call send-device-command ❌
                                                    |
                                          send-device-command ✅
                                                    |
                                         [EMQX → MQTT → Device] ✅
                                                    |
                                         Device ejects charger ✅
                                                    |
                                         handle-device-message ✅ (logs it)
                                                    |
                                         [rentals table updated? ❌ no link back]
```
