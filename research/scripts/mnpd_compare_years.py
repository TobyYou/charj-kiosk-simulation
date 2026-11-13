import json,glob,sys,collections,datetime
from zoneinfo import ZoneInfo
TZ=ZoneInfo("America/Chicago")
def load(pat):
    out=[]
    for f in sorted(glob.glob(pat)):
        for ft in json.load(open(f))["features"]:
            a=ft["attributes"]
            if a["Call_Received"]: out.append((datetime.datetime.fromtimestamp(a["Call_Received"]/1000,datetime.timezone.utc).astimezone(TZ),a.get("Shift")))
    return out
def fs(t): return (t-datetime.timedelta(hours=5)).weekday() in (4,5)
b24=load(sys.argv[1]+"/mnpd2024/broadway_*.json"); b25=load(sys.argv[1]+"/mnpd/broadway_*.json")
print("2024 shift check:",collections.Counter((t.hour,s) for t,s in b24 if t.hour in (5,6,14,15,22,23)))
def shares(rows,cond):
    c=collections.Counter(t.hour for t,_ in rows if cond(t)); n=sum(c.values()); return [c[h]/n for h in range(24)],n
import statistics
for lab,cond in (("FriSat",fs),("SunThu",lambda t: not fs(t))):
    s24,n24=shares(b24,cond); s25,n25=shares(b25,cond)
    r=statistics.correlation(s24,s25)
    print(lab,"n24",n24,"n25",n25,"r=",round(r,3))
    print(" hr:share24/share25 ", " ".join(f"{h}:{a:.3f}/{b:.3f}" for h,(a,b) in enumerate(zip(s24,s25))))
# Fri/Sat 21-02 peak vs weekday same hours (per day)
v=load(sys.argv[1]+"/mnpd/vandy_*.json")
def rate(rows,months,wk=True):
    days=sum(1 for d in (datetime.date(2025,1,1)+datetime.timedelta(i) for i in range(365)) if d.month in months and (d.weekday()<5)==wk)
    n=sum(1 for t,_ in rows if t.month in months and (t.weekday()<5)==wk and 7<=t.hour<=22)
    return n/days
print("vandy wkdy 07-22h calls/day: term(Feb,Mar,Apr,Sep,Oct,Nov)",round(rate(v,{2,3,4,9,10,11}),2),"summer(Jun,Jul)",round(rate(v,{6,7}),2))
print("broadway wkdy 07-22 term-months",round(rate(b25,{2,3,4,9,10,11}),2),"summer",round(rate(b25,{6,7}),2))
