import json, sys, urllib.request, urllib.parse, time
UA={'User-Agent':'JawajinDocResearch/1.0 (educational documentary edit)'}
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
for q in sys.argv[1:]:
    r=get('https://collectionapi.metmuseum.org/public/collection/v1.1/search?'+urllib.parse.urlencode({'q':q,'hasImages':'true','limit':8}))
    ids=r.get('objectIDs') or [x.get('objectID') for x in r.get('results',r.get('data',[]))] if isinstance(r,dict) else r
    print('==',q, str(r)[:200] if not ids else '')
    for i in (ids or [])[:8]:
        o=get(f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{i}')
        print(f"  {i} PD={o.get('isPublicDomain')} {o.get('title','')[:60]} | {o.get('objectDate','')} | {o.get('culture','')} | {o.get('primaryImage','')[-40:]}")
        time.sleep(0.3)
