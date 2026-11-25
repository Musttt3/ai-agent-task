import json, sys, time, urllib.request, urllib.error, os, re
sys.path.insert(0,'tools')
from commons import api, UA
from fetch_items import items
os.makedirs('assets/archive',exist_ok=True)
cred=json.load(open('work/credits_archive.json')) if os.path.exists('work/credits_archive.json') else []
cred={c[0]:c for c in cred}
def get(url,out):
    for k in range(6):
        try:
            data=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=600).read()
            open(out,'wb').write(data); return len(data)
        except urllib.error.HTTPError as e:
            if e.code==429:
                wait=int(e.headers.get('Retry-After') or 0) or 40*(k+1); print('  429 wait',wait,flush=True); time.sleep(wait)
            else: print('  HTTP',e.code,flush=True); return 0
        except Exception as e: print('  err',e,flush=True); time.sleep(20)
    return 0
for name,title,w,page in items:
    out='assets/archive/'+name
    if os.path.exists(out) and os.path.getsize(out)>5000: continue
    isvid=title.endswith(('.webm','.ogv'))
    p=dict(action='query',titles=title,prop='imageinfo|videoinfo',iiprop='url|extmetadata|size',viprop='derivatives')
    r=api(p); pg=list(r['query']['pages'].values())[0]
    if 'imageinfo' not in pg: print('MISSING',title,flush=True); continue
    ii=pg['imageinfo'][0]; md=ii.get('extmetadata',{}); ow=ii.get('width',0)
    if isvid:
        ders=pg.get('videoinfo',[{}])[0].get('derivatives',[])
        ders=[d for d in ders if 'vp9' in d.get('transcodekey','') or 'mpeg4' in d.get('transcodekey','')]
        ders.sort(key=lambda d:-(d.get('height') or 0))
        url=ders[0]['src'] if ders else ii['url']
    elif page:
        p2=dict(action='query',titles=title,prop='imageinfo',iiprop='url',iiurlwidth=1280,iiurlparam=f'page{page}-1280px'); time.sleep(3)
        url=list(api(p2)['query']['pages'].values())[0]['imageinfo'][0]['thumburl']
    else:
        std=[x for x in (960,1280,1920,2560) if x<=ow]
        if std:
            p2=dict(action='query',titles=title,prop='imageinfo',iiprop='url',iiurlwidth=std[-1] if std[-1]<=1920 else 1920); time.sleep(3)
            url=list(api(p2)['query']['pages'].values())[0]['imageinfo'][0]['thumburl']
        else: url=ii['url']
    lic=md.get('LicenseShortName',{}).get('value','?')
    artist=re.sub('<[^>]+>','',md.get('Artist',{}).get('value',''))[:80].strip()
    cred[name]=(name,pg['title'],lic,artist,ii.get('descriptionurl',''))
    n=get(url,out); print(name,lic,n,url[-50:],flush=True)
    json.dump(list(cred.values()),open('work/credits_archive.json','w'),ensure_ascii=False,indent=1)
    time.sleep(10)
print('DONE')
