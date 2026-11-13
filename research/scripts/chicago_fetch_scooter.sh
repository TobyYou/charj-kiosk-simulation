#!/bin/bash
OUT=$1
B="https://data.cityofchicago.org/resource/2i5w-ykuw.json"
q(){ curl -s -m 110 -G "$B" --data-urlencode "\$select=date_extract_hh(start_time) as hh, date_extract_dow(start_time) as dow, count(*) as n" --data-urlencode "\$where=start_community_area_number=41 AND start_time between '$2' and '$3'" --data-urlencode "\$group=hh,dow" --data-urlencode "\$limit=500" -o "$OUT/$1.json"; echo "$1 $(wc -c < $OUT/$1.json)"; }
q hydepark_term_2025 2025-10-06T00:00:00 2025-11-21T23:59:59
q hydepark_summer_2025 2025-07-07T00:00:00 2025-08-22T23:59:59
