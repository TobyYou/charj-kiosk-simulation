# mta_od_116st.csv — metadata

- **Source:** MTA Subway Origin-Destination Ridership Estimate: 2025 (data.ny.gov dataset `y2qv-fytt`), publisher Metropolitan Transportation Authority; dataset last updated 2026-01-20. https://data.ny.gov/Transportation/MTA-Subway-Origin-Destination-Ridership-Estimate-2/y2qv-fytt
- **Downloaded:** 2026-11-09
- **Station:** 116 St–Columbia University (1), station_complex_id = 307 (from MTA Subway Stations, data.ny.gov `39hk-dx4f`).
- **Queries (SoQL):**
  - Destined: `https://data.ny.gov/resource/y2qv-fytt.csv?$select=hour_of_day,sum(estimated_average_ridership) as dest&$where=destination_station_complex_id='307' AND day_of_week in('Monday','Tuesday','Wednesday','Thursday','Friday')&$group=hour_of_day`
  - Originating: same with `origin_station_complex_id='307'`.
- **Processing:** each row's `estimated_average_ridership` is the average for that month × day-of-week × hour × OD pair. Summed over Mon–Fri and Jan–Dec 2025 (12 months × 5 weekdays = 60 cells, all present), then divided by 60 → average weekday trips per hour. Hours are Eastern time (America/New_York).
- **Results:** avg weekday destined 10,939; originating 10,941; ratio 1.000. 17:00–19:59 ratio 0.49 (1,673 destined vs 3,396 originating). 07:00–09:59: 3,124 destined vs 988 originating.
- **Caveats:**
  - `hour_of_day` is the hour the trip **starts** at the origin, so destined trips' arrival hour at 116 St is shifted later by the ride time, often 10–40 min.
  - The OD estimate is built from fare-card (OMNY/MetroCard) taps, with destinations inferred from the rider's next tap. Its origin total (~10.9k/weekday) is below the ~14.5k hourly-ridership entry count, likely because of differences in the scaling or coverage of the estimate. Use the **ratios and hourly shape** here, not the absolute levels.
  - Covers subway-to-subway trips only. Fare evasion and bus legs are excluded.
  - 2025 annual average, so it blends semester and summer months.
