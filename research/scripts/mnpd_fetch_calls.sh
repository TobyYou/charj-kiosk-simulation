#!/bin/bash
# usage: fetch_mnpd.sh NAME xmin ymin xmax ymax OUTDIR
U="https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/MNPD_Calls_for_Service_2025_view/FeatureServer/0/query"
NAME=$1; G="$2,$3,$4,$5"; OUT=$6; off=0
while :; do
  f="$OUT/${NAME}_$off.json"
  curl -s -G "$U" --data-urlencode "where=1=1" --data-urlencode "geometry=$G" --data-urlencode "geometryType=esriGeometryEnvelope" --data-urlencode "inSR=4326" --data-urlencode "spatialRel=esriSpatialRelIntersects" --data-urlencode "outFields=Call_Received,Shift,Tencode,Tencode_Description,Street_name,Block,Latitude,Longitude" --data-urlencode "returnGeometry=false" --data-urlencode "orderByFields=OBJECTID" --data-urlencode "resultOffset=$off" --data-urlencode "resultRecordCount=2000" --data-urlencode "f=json" -o "$f"
  n=$(python3 -I -c "import json,sys;print(len(json.load(open(sys.argv[1]))['features']))" "$f")
  echo "$NAME off=$off n=$n"
  [ "$n" -lt 2000 ] && break
  off=$((off+2000))
done
