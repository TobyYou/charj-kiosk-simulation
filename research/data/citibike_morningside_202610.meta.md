# citibike_morningside_202610.csv — metadata

- **Source:** Citi Bike System Data (Lyft / NYC Bike Share), public monthly trip files.
  - Index: https://s3.amazonaws.com/tripdata/index.html
  - File: https://s3.amazonaws.com/tripdata/202610-citibike-tripdata.zip (314,905,579 bytes; S3 Last-Modified 2026-11-05; 4 CSV parts inside)
- **Downloaded:** 2026-11-09, to the session scratchpad only. The raw file is NOT stored in or committed to this project.
- **Script:** `research/scripts/citibike_morningside_durations.py` (standard library only), run as
  `python3 -I citibike_morningside_durations.py <zip> <out.csv>`. Runtime is about 14 s.
- **Month:** October 2026 (31 days: 22 weekdays, 9 weekend days). This is a full Columbia fall-term month.
- **Filter box (START coordinates):** 40.800 ≤ start_lat ≤ 40.815 and −73.970 ≤ start_lng ≤ −73.955. That is roughly W 110th to W 125th St, Riverside Dr to Morningside/Amsterdam Ave, and includes Columbia/Barnard and the Broadway corridor.
  - "Local return" means the end lat/lng also falls inside the same box.
- **Row counts:** 5,088,365 rows scanned (all NYC). 2,879 rows could not be parsed (missing start coordinates or timestamps). 49,397 trips start in the box. 95 of those have no end coordinates.
- **Duration:** ended_at − started_at in minutes. The lognormal MLE uses trips from 1 min to 24 h (n = 49,395), with sigma computed with a 1/n denominator.
- **Hours:** started_at is local NYC wall-clock time (ET), so the hours are used as given. Hourly values are average trips per day of that type.

## Caveats
- Citi Bike removes trips under 60 s (and suspected test or rebalancing trips) before publishing. That is why the share under 1 min is 0. The very long tail (>24 h) is also sparse in the published files, so do not read it as a direct loss rate.
- Bike-share is a transport mode: trips run A→B, so 77% end outside the box. Charj rentals are more like "dwell" time. Use the shape (lognormal, right skew) and the time-of-day profile as a proxy, not the absolute minutes. Expect Charj durations to be longer, because the rental lasts until the phone is charged and the user passes a kiosk.
- Members (commuters/students) make up 84% of trips. Citi Bike pricing (members get 45 min included, then a per-minute charge; e-bikes are billed per minute) pushes trips to be short. That truncates the >45–60 min tail compared with a $1/started-hour product.
- E-bikes make up 79% of trips in the box. The steep uptown hills favour e-bikes, and e-bike trips are shorter.
- The coordinates are station coordinates. For e-bikes, the end coordinates can come from GPS.
