# cta_campus_stations_2025.csv
- **Source:** City of Chicago, "CTA - Ridership - 'L' Station Entries - Daily Totals" (dataset 5neh-572f). Daily only; no hourly CTA station data is published.
- **URL / query:** https://data.cityofchicago.org/resource/5neh-572f.csv with $select=stationname,station_id,daytype,avg(rides),min(rides),max(rides),count(*) $where=station_id in('40510','40380','40350','40050') and date in 2025 $group=stationname,station_id,daytype
- **Downloaded:** 2026-11-08. daytype W=weekday, A=Saturday, U=Sunday/holiday.
- **Stations:** Garfield (Green, UChicago), UIC-Halsted (Blue, UIC campus), Clark/Lake (Loop), Davis (Purple, Evanston/Northwestern).
