# wego_stops_fall2024.csv
- **Source:** WeGo Public Transit (Nashville), public ArcGIS FeatureServer layer "WeGo_Transit_Stop_Database_PublicView", layer 1: https://services7.arcgis.com/EGmB20G57rbr4fjI/arcgis/rest/services/WeGo_Transit_Stop_Database_PublicView/FeatureServer/1
- **Query (2026-11-10, by the orchestrator):** `query?where=1=1&outFields=StopID,StopName,Location,F24_BRD,F24_ALT,F24_Total&returnGeometry=true&outSR=4326&f=json&resultRecordCount=2000` → 365 features.
- **Fields:** F24_BRD / F24_ALT / F24_Total = Fall 2024 boardings / alightings / total at the stop. Units not documented on the layer; the sum of boardings (15,743) is consistent with an average daily (likely weekday) count. ASSUMPTION: average weekday, Fall 2024, Central Time.
- **Coverage:** only the 365 stops in WeGo's stop-improvement program, not all stops.
- **Use:** footfall anchor near Vanderbilt. West End Ave 17th–31st (12 stops) ≈ 1,190 ons+offs/day; core Vanderbilt-edge stops ≈ 835/day (agent sums; individual stops re-checked here).
