import json,sys,csv
D=sys.argv[1]; OUT=sys.argv[2]
# both windows: 7 weeks Mon-Fri = 35 weekdays, 14 weekend days (Oct6-Nov21 = 47 days: 35 wkdy+12 wkend ; Jul7-Aug22 same)
import datetime
def days(a,b):
    wd=we=0;d=a
    while d<=b:
        if d.weekday()<5: wd+=1
        else: we+=1
        d+=datetime.timedelta(1)
    return wd,we
P={"term":("hydepark_term_2025",days(datetime.date(2025,10,6),datetime.date(2025,11,21))),
   "summer":("hydepark_summer_2025",days(datetime.date(2025,7,7),datetime.date(2025,8,22)))}
res={}
for k,(f,(wd,we)) in P.items():
    c={}
    for r in json.load(open(f"{D}/{f}.json")):
        h=int(r["hh"]); dow=int(r["dow"]); typ="wkdy" if 1<=dow<=5 else "wkend"   # socrata dow: 0=Sun
        c[(typ,h)]=c.get((typ,h),0)+int(r["n"])
    res[k]=(c,wd,we)
with open(OUT,"w",newline="") as fo:
    w=csv.writer(fo); w.writerow(["period","daytype","local_hour_CT","trips","trips_per_day","share"])
    for k,(c,wd,we) in res.items():
        for typ,nd in (("wkdy",wd),("wkend",we)):
            tot=sum(v for (t,h),v in c.items() if t==typ)
            for h in range(24):
                n=c.get((typ,h),0); w.writerow([k,typ,h,n,round(n/nd,2),round(n/tot,4)])
print("days",{k:(v[1],v[2]) for k,v in res.items()})
print("hr  term_wkdy summer_wkdy  ratio  term_wkend summer_wkend")
for h in range(24):
    tw=res["term"][0].get(("wkdy",h),0)/res["term"][1]; sw=res["summer"][0].get(("wkdy",h),0)/res["summer"][1]
    te=res["term"][0].get(("wkend",h),0)/res["term"][2]; se=res["summer"][0].get(("wkend",h),0)/res["summer"][2]
    print(f"{h:02d}  {tw:8.1f} {sw:10.1f}  {tw/max(sw,0.01):5.2f}  {te:9.1f} {se:11.1f}")
for k,(c,wd,we) in res.items():
    print(k,"daily wkdy",round(sum(v for (t,h),v in c.items() if t=='wkdy')/wd,1),"wkend",round(sum(v for (t,h),v in c.items() if t=='wkend')/we,1))
