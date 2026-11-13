import json,glob,sys,csv,collections,datetime
from zoneinfo import ZoneInfo
TZ=ZoneInfo("America/Chicago")
D=sys.argv[1]; OUT=sys.argv[2]
rows=[]
for name in ["broadway","vandy"]:
    seen=set()
    for f in sorted(glob.glob(f"{D}/{name}_*.json")):
        for ft in json.load(open(f))["features"]:
            a=ft["attributes"]
            if a["Call_Received"] is None: continue
            t=datetime.datetime.fromtimestamp(a["Call_Received"]/1000,datetime.timezone.utc).astimezone(TZ)
            rows.append((name,t,a["Shift"],a["Tencode_Description"]))
# shift check
sh=collections.Counter((r[1].hour,r[2]) for r in rows)
print("shift x localhour:",{h:{s:sh[(h,s)] for s in "ABC" if sh[(h,s)]} for h in range(24)})
# service day starts 05:00 local; daytype by service day
def dtype(t):
    sd=(t-datetime.timedelta(hours=5)).weekday()
    return "MonThu" if sd<=3 else ("FriSat" if sd in (4,5) else "Sun")
ndays={"MonThu":0,"FriSat":0,"Sun":0}
d=datetime.date(2025,1,1)
while d.year==2025:
    w=d.weekday(); ndays["MonThu" if w<=3 else ("FriSat" if w in (4,5) else "Sun")]+=1; d+=datetime.timedelta(1)
c=collections.Counter((r[0],dtype(r[1]),r[1].hour) for r in rows)
tot=collections.Counter((r[0],dtype(r[1])) for r in rows)
mon=collections.Counter((r[0],r[1].month) for r in rows)
with open(OUT,"w",newline="") as fo:
    w=csv.writer(fo); w.writerow(["zone","daytype","local_hour_CT","calls_2025","calls_per_day","share_of_daytype"])
    for z in ["broadway","vandy"]:
        for dt in ["MonThu","FriSat","Sun"]:
            for h in range(24):
                n=c[(z,dt,h)]; w.writerow([z,dt,h,n,round(n/ndays[dt],3),round(n/max(1,tot[(z,dt)]),4)])
print("ndays",ndays); print("totals",dict(tot))
print("monthly",{z:[mon[(z,m)] for m in range(1,13)] for z in ["broadway","vandy"]})
for z in ["broadway","vandy"]:
    print(z)
    print("hr  "+"  ".join(f"{dt:>7}" for dt in ["MonThu","FriSat","Sun"])+"   (calls/day)")
    for h in range(24):
        print(f"{h:02d}  "+"  ".join(f"{c[(z,dt,h)]/ndays[dt]:7.2f}" for dt in ["MonThu","FriSat","Sun"]))
tc=collections.Counter(r[3] for r in rows if r[0]=="broadway"); print("top tencodes broadway",tc.most_common(8))
