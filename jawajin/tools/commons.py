import sys, json, urllib.request, urllib.parse, re
UA={'User-Agent':'JawajinDocResearch/1.0 (https://claude.ai/code; educational documentary edit) python-urllib/3.13'}
def api(params):
    import time, urllib.error
    params.update(format='json')
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
    for k in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30))
        except urllib.error.HTTPError as e:
            if e.code!=429: raise
            wait=int(e.headers.get('Retry-After') or 0) or 10*(k+1)
            print('  (429, waiting',wait,'s)',flush=True); time.sleep(wait)
    raise RuntimeError('rate limited')
def search(q, n=12, ns=6, extra=''):
    r=api(dict(action='query',generator='search',gsrsearch=q+extra,gsrnamespace=ns,gsrlimit=n,prop='imageinfo',iiprop='url|size|extmetadata|mime'))
    pages=r.get('query',{}).get('pages',{})
    out=[]
    for p in sorted(pages.values(), key=lambda p:p.get('index',0)):
        ii=p.get('imageinfo',[{}])[0]; md=ii.get('extmetadata',{})
        lic=md.get('LicenseShortName',{}).get('value','?')
        date=re.sub('<[^>]+>','',md.get('DateTimeOriginal',{}).get('value',''))[:30]
        out.append((p['title'],ii.get('width'),ii.get('height'),ii.get('mime'),lic,date,ii.get('url')))
    return out
if __name__=='__main__':
    for q in sys.argv[1:]:
        print('=== ',q)
        for t in search(q):
            print(f'  {t[0][:80]:80s} {t[1]}x{t[2]} {t[3]} | {t[4]} | {t[5]}')
