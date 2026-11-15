import json,re,sys,difflib
S=sys.argv[1]  # scratch folder berisi assets/ dan work/transcript.json
md=open(S+"/assets/pancing_kerang_alor_294_urut/naskah-kail-cangkang-alor.md",encoding='utf-8').read()
sents=[(int(m.group(1))*60+int(m.group(2)),m.group(3)) for m in re.finditer(r'^- \*\*\((\d+):(\d+)\)\*\*\s*(.*)$',md,re.M)]
norm=lambda w: re.sub(r'[^a-z0-9]','',w.lower())
sw=[];starts=[]
for t,txt in sents:
    starts.append(len(sw)); sw+= [norm(w) for w in txt.split() if norm(w)]
tr=json.load(open(S+"/work/transcript.json"))
tw=[(w[0],norm(w[2])) for s in tr for w in s['words'] if norm(w[2])]
sm=difflib.SequenceMatcher(None,sw,[w for _,w in tw],autojunk=False)
mp={}
for a,b,n in sm.get_matching_blocks():
    for k in range(n): mp[a+k]=tw[b+k][0]
res=[]
for i,(t,txt) in enumerate(sents):
    s=starts[i]; e=starts[i+1] if i+1<len(starts) else len(sw)
    at=None
    for k in range(s,e):
        if k in mp: at=mp[k]-(k-s)*0.35; break
    res.append((t,at,txt))
json.dump(res,open(S+"/work/align.json","w"),ensure_ascii=False)
ds=[a-t for t,a,_ in res if a is not None]
print("unmatched",sum(a is None for _,a,_ in res),"ratio",sm.ratio())
for t,a,txt in res[::8]: print(t, round(a,2) if a else None, round(a-t,2) if a else None, txt[:50])
print("diff min/max",min(ds),max(ds))
