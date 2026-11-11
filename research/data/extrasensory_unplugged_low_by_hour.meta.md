# extrasensory_unplugged_low_by_hour.csv

- **Source:** ExtraSensory dataset, UC San Diego (Vaizman, Ellis & Lanckriet 2017), primary data zip http://extrasensory.ucsd.edu/data/primary_data_files/ExtraSensory.per_uuid_features_labels.zip (225,374,973 bytes), downloaded 2026-11-11 to the session scratchpad (raw data not in the repo).
- **Produced by:** `python3 -I research/scripts/extrasensory_unplugged_low.py <data_dir> research/data/extrasensory_unplugged_low_by_hour.csv` (reuses `load_user()` and constants from `extrasensory_low_battery.py`).
- **What:** per daytype (weekday Mon–Fri / weekend) × local hour (America/Los_Angeles, DST-aware), the share of **unplugged** phone-time with battery level <20% (`lt20_unplugged`) and <30% (`lt30_unplugged`); equal-user mean over users with ≥600 s unplugged exposure in the cell (`n_users`); samples time-weighted by gap to next sample capped at 300 s; 90% CIs by cluster bootstrap over users (500 resamples, seed 20261111).
- **Plugged** = any `discrete:battery_plugged:is_ac|is_usb|is_wireless` = 1, or `discrete:battery_state:is_charging|is_full` = 1.
- **Biases:** see `extrasensory_low_battery_by_hour.meta.md` (app drain, external battery given to participants, n=60 mostly UCSD students/RAs, 2015 phones, dead phones invisible). Weekend night cells have only 13–27 users.
- **Used for:** LOW_BATTERY_CURVE and LOW_BATTERY_CURVE_WEEKEND in `simulator/js/params.js` (PARAMETERS P071).
