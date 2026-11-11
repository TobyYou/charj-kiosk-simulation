# extrasensory_low_battery_by_hour.csv
- **Source:** ExtraSensory dataset, UC San Diego (Vaizman, Ellis & Lanckriet, "Recognizing Detailed Human Context In-the-Wild from Smartphones and Smartwatches", IEEE Pervasive Computing 16(4), 2017, doi:10.1109/MPRV.2017.3971131). Site: http://extrasensory.ucsd.edu/
- **File:** http://extrasensory.ucsd.edu/data/primary_data_files/ExtraSensory.per_uuid_features_labels.zip (225,374,973 bytes; HTTP 200, no login) → 60 files `<UUID>.features_labels.csv.gz` (225,325,871 bytes total; 377,346 rows, 377,027 with a battery level). README: http://extrasensory.ucsd.edu/data/primary_data_files/README.txt
- **Downloaded:** 2026-11-11, into the session scratchpad only. Raw data is NOT in the repo; this CSV is an aggregate (48 rows, ~18 KB).
- **Script:** research/scripts/extrasensory_low_battery.py (stdlib only; run `python3 -I extrasensory_low_battery.py <data_dir> <out_csv>`; ~10 s).
- **Data span:** local dates 2015-06-05 .. 2016-06-02; each user recorded 4–13 distinct local dates (median 8).

## Columns used (exact names)
- `timestamp` (UTC epoch s), `lf_measurements:battery_level` (0–1)
- Plugged flags: `discrete:battery_plugged:is_ac`, `discrete:battery_plugged:is_usb`, `discrete:battery_plugged:is_wireless`, `discrete:battery_plugged:missing` (Android only; iPhone rows are `missing`)
- State flags: `discrete:battery_state:is_unknown`, `is_unplugged` (iPhone), `is_not_charging`, `is_discharging` (Android), `is_charging`, `is_full`, `missing`
- TZ check only: `discrete:time_of_day:between0and6` … `between18and24` (phone-local)
- "Plugged" here := any battery_plugged flag = 1 OR state is_charging / is_full = 1. Android `not_charging` (~1% of rows) counted as not plugged. Charging from the study's external battery pack also counts as plugged.

## Method
- UTC → America/Los_Angeles (zoneinfo, DST aware). Check: LA hour agrees with the phone's own time_of_day flags in 377,027/377,027 rows (6-h bins with boundaries at 0/6/12/18, so a 1-h DST error would have shown).
- Weekday = Mon–Fri, weekend = Sat–Sun (local); holidays not removed.
- Time weight (`_tw`): gap to the user's next sample, capped at 300 s (last sample 60 s). Unweighted (`_uw`): 1 per sample. They agree within ~0.01–0.03.
- `_eq_`: mean of per-user shares (users with ≥10 min weighted exposure, or ≥10 samples, in that cell); `_pooled_`: total over all users. `n_users_eq_tw` = users entering the equal-user mean.
- `_lo90/_hi90`: 90% percentile CI, cluster bootstrap over users, 500 resamples, seed 20261111.
- Metrics: `lt20` share of time level < 0.20; `lt30` < 0.30; `level` mean level; `plugged` share plugged.
- Coverage columns: `n_users_any`, `n_user_hours` (distinct user × local date × hour), `n_samples`, `weighted_hours`.

## Key results (lt20_eq_tw, 90% CI)
- Weekday: night 00–06h ≈ 0.02–0.05; morning 08–12h mean 0.032; rises from 13h (0.071) to 15h (0.107); evening peak **21h = 0.130 [0.099, 0.160]**, 22h = 0.113, 23h = 0.067.
- Weekend: noisier; **peak 22h = 0.178 [0.109, 0.261]**; 20–22h ≈ 0.15–0.18; stays 0.11–0.17 overnight 00–06h (late nights); minimum 11h = 0.027.
- lt30 peaks: weekday 21h = 0.236 [0.192, 0.275]; weekend 22h = 0.285 [0.204, 0.381].
- Plugged share: weekday 03–05h ≈ 0.75, 09h minimum 0.14, 0.21–0.33 through the day.
- **Daily minimum** (per user × local date; not in the CSV, printed by the script):
  - all 482 user-days: min < 20% on 0.586 [0.529, 0.633] (equal-user), < 10% on 0.369 [0.315, 0.419]
  - 319 well-covered days (≥12 distinct hours): < 20% 0.707 [0.638, 0.762]; < 10% 0.436 [0.370, 0.502]
  - Hour the daily min occurs (well-covered days): spread over 14–23h (each ~4–9%), highest 22–23h (8.2%, 8.8%); 07–08h ≈ 0. The 00h bar (7%) is a calendar-day boundary artefact (still discharging after midnight).

## Biases / caveats
1. **App drained battery, and participants got an extra battery pack.** "an external battery to allow them for an extra charge of the phone during the day (because the app takes much of the battery)" — http://extrasensory.ucsd.edu/ (Data collection section); same in Vaizman2017a, http://extrasensory.ucsd.edu/papers/vaizman2017a_pervasiveAcceptedVersion.pdf ("Using the app consumes the phone's battery more quickly than normal … one extra charge during the day"). The app ran a 20-s sensor recording (accelerometer, gyro, audio, location) every minute. Net effect unknown: the drain pushes low-battery time UP vs normal use; the pack pushes it DOWN, and pack charging shows up as "plugged". The very high daily-min figures (59–72% of days below 20%) are most likely inflated by the app drain.
2. **Participants turned location off to save battery** (Vaizman2017b, http://extrasensory.ucsd.edu/papers/vaizman2017b_imwutAcceptedVersion.pdf) — evidence that battery was a felt constraint during the study.
3. **Patchy, non-random recording.** The app records only while running; per the site, examples are "typically taken in intervals of 1 minute (but not necessarily in one long sequence, there are time gaps)". A phone that died (0%) produces no rows, so time at 0% is missing (survivor bias, understates low battery); users could also pause the app. Gaps are capped at 5 min, so long gaps carry no weight.
4. **Weekend cells are thin:** 53–86 user-hours per weekend cell (36–53 users) vs 185–273 per weekday cell (54–60 users). Weekend CIs are about twice as wide.
5. **Small, special sample:** 60 users, "mostly students (both undergraduate and graduate) and research assistants from the UCSD campus", 34 iPhone / 26 Android, iPhone 4–6S, iOS 7–9 (http://extrasensory.ucsd.edu/ Users/Devices sections). San Diego, 2015–16.
6. **Old phones:** 2015 batteries/OS power management are worse than 2026 phones, which would push low-battery time UP compared with today.
7. **Transfer to NYC/Nashville:** the results are by local clock hour (Pacific). To use them for Eastern/Central time we assume people follow the same local-clock routine. There is no city or commute adjustment (San Diego students drive or walk around campus; NYC users are on transit).
8. Each user recorded ~1 week (4–13 dates), so there is little within-user day-to-day variation, and the seasons are mixed (June 2015 – June 2016).
