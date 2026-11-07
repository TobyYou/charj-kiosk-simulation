# Charj Reference Library

Copies of Charj-related files gathered from around this Mac on 2026-11-07, as background for the kiosk-network simulation (see `../GAME_PLAN.md`). The originals are untouched in their original locations.

## Folders

| Folder | What's inside | Original location |
|---|---|---|
| `01-pitches/` | NEN written pitch (final PDF), video/voiceover scripts, pitch drafts, user pitch sources, Chinese pitch talk PDF | `~/Downloads`, `~/charj-app/docs/pitch`, `~/charj-video`, `~/Documents/ChatGPT/稀缺性总结/02-资源与机会/内容项目` |
| `02-business-strategy/` | Merchant partnership proposal, sales talking points, merchant decision strategy, founding-host/ad-credit strategy, use of funds, current facts & business line | `~/charj-website-gh/docs`, ChatGPT notes folder |
| `03-hardware-specs/` | Besiter purchase-order data summary, BST-0155 UN38.3 battery test report, MSDS, 24-slot cabinet CE cert, Amazon charger reference | `~/Desktop/VIDEO-PITCH-RONNEN`, `~/Desktop/Ronnen Harary`, ChatGPT notes folder |
| `04-app-data-model/` | Supabase schema, rental/return/deposit/reminder migrations, real kiosk locations, functions inventory | `~/charj-app` |
| `05-research-and-notes/` | Nomophobia & battery-anxiety research, evidence notes, community feedback form, campus video scripts | ChatGPT notes folder |
| `06-competition-rules/` | NEN Challenge official rules, mini-grant rules, judging excerpt | `~/Desktop/Ronnen Harary`, ChatGPT notes folder |
| `07-product-images/` | Station and power-bank designs and photos, production-line photo | `~/Desktop`, `~/Downloads`, `~/charj-website/public` |

## Hard numbers useful for the simulation

From `03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md` (Besiter purchase order dated 24 Jul 2026). These are quoted prices, not proof of payment.

| Item | Spec | Qty | Unit USD |
|---|---|---:|---:|
| Power bank | BST-0155, **8000 mAh** | 400 | $11.00 |
| Charging station | BST-0265, fast-charge, **8-slot** | 50 | $82.00 |
| Sea freight (DDP), power banks | ~45–50 days after sailing | | $511.63 total |
| Sea freight (DDP), stations | ~45–50 days after sailing | | $880.68 total |

- One station plus 8 packs costs **$170** in hardware, or about **$197.85** with freight spread across the 50 sets. Installation, venue incentives, maintenance and software/payment fees are **not** included.
- The "fast-charge" label is not a measured 22.5 W output per cable. Bench-test before using it as a model input.

From `04-app-data-model/`, the current real kiosk locations in the database are:
- **Happy Hot Hunan**, 969 Amsterdam Ave, New York, NY 10025
- **Lerner Hall Main Lobby**, Columbia University

The schema and migrations show the actual rental lifecycle: rental start on confirm, return kiosk and history, hourly overdue-deposit charging, and email return reminders. Use these for the simulation's state machine.

## Deliberately NOT copied

- **Code repos and media.** `~/charj-app`, `~/charj-website`, `~/charj-website-gh`, `~/charj-video` and all videos/audio are large and not needed. Pull specific files when required.
- **`charj-app/supabase/seed.sql` and `setup-local-dev.sql`.** They contain device auth keys and MQTT passwords.
- **CharjCo LLC filing evidence and the EIN application.** These are legal/tax documents, not needed for simulation.
- **Personal notes and journals** in `~/Documents/ChatGPT/稀缺性总结` (个人资源档案, 每日复盘, 对话记录), and older duplicate drafts, PDF exports and unrelated projects (AIRTALK, UCSD DOC paper).
