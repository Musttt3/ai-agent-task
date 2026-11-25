import json, sys, time, urllib.request, urllib.parse, os
sys.path.insert(0,'tools')
from commons import api, UA
items = [
 # name, title, width, page
 ("AV01_pemakaman-pb10-1939.webm","File:BEGRAFENIS VAN ZDH PAKOE BOEWONO X-PGM4011564.webm",None,None),
 ("AV02_delegasi-susuhunan-1936.webm","File:Aankomst van de delegatie van de Soesoehoenan van Soerakasta.webm",None,None),
 ("AV03_penobatan-solo-1945.webm","File:Nampo Hodo (43)- Upatjara penobatan Solokoo baru (Djawa).webm",None,None),
 ("AV04_lahirnja-gatotkatja-1960.webm","File:Lahirnja Gatotkatja (1960).webm",None,None),
 ("AV05_gamelan-keraton-surakarta.ogv","File:Gamelan of Keraton Surakarta (Solo).ogv",None,None),
 ("AI01_ranggawarsita-gambar.jpg","File:Ranggawarsita, Serat Condrorini, p14.jpg",None,None),
 ("AI02_sandi-paramayoga.jpg","File:Sandi Paramayoga, by Rangga Warsita.pdf",1600,1),
 ("AI02b_sandi-paramayoga-p3.jpg","File:Sandi Paramayoga, by Rangga Warsita.pdf",1600,3),
 ("AI03_pustaka-raja-purwa.jpg","File:Serat Pustaka Raja Purwa Volume 3.pdf",1600,1),
 ("AI03b_pustaka-raja-purwa-p5.jpg","File:Serat Pustaka Raja Purwa Volume 3.pdf",1600,5),
 ("AI04_pakubuwono-vii.jpg","File:Painted portrait of Susuhunan Pakubuwono VII - SFA002015048.jpg",None,None),
 ("AI05_lontar-calonarang.jpg","File:Lontar Tojan - Calonarang.jpg",2600,None),
 ("AI06_relief-majapahit-trowulan.jpg","File:Plate V No 22 Relief of Majapahit in Trowulan.jpg",None,None),
 ("AI07_surya-majapahit.jpg","File:Surya Majapahit 2.jpg",None,None),
 ("AI08_batara-guru-nandi.jpg","File:COLLECTIE TROPENMUSEUM Wajangpop voorstellend Batara Guru op Nandi TMnr 1458-1.jpg",None,None),
 ("AI09_amaterasu-toshimasa-1889.jpg","File:Origin of the Cave Door Dance (Amaterasu) by Shunsai Toshimasa 1889.jpg",3000,None),
 ("AI10_rubens-romulus-remus.jpg","File:Romulus and Remus by Peter Paul Rubens.jpg",2600,None),
 ("AI11_velazquez-mars.jpg","File:Velázquez - Dios Marte (Museo del Prado, 1639-41).jpg",None,None),
 ("AI12_pendopo-kraton-cephas.jpg","File:KITLV 40546 - Kassian Céphas - The big pendopo in the Kraton of the Sultan of Yogyakarta - circa 1894.jpg",2800,None),
 ("AI13_wayang-kulit-1890.jpg","File:Wayang Kulit 1890.jpg",None,None),
 ("AI14_serat-jaya-lengkara.jpg","File:Serat Jaya Lengkara Wulang (page 184 crop).jpg",2000,None),
 ("AI15_serat-kalatidha-leiden.jpg","File:Serat Kalatidha-Leiden01.jpg",None,None),
 ("AI16_makam-ranggawarsita.jpg","File:Grave of Rangga Warsito, Klaten.jpg",2600,None),
 ("AI17_lupa-capitolina.jpg","File:Lupa Capitolina, Rome.jpg",2600,None),
 ("AI18_penari-kraton-1885.jpg","File:KITLV 3911 - Kassian Céphas - Dancers from the Kraton Yogyakarta perform a wayang wong - circa 1885.tif",2000,None),
 ("AI19_alun-alun-beringin-1894.jpg","File:KITLV 12571 - Kassian Céphas - Festivities at the banyan trees on the alun-alun in Yogyakarta - circa 1894.tif",2000,None),
 ("AI20_wayang-batara-guru.jpg","File:Wayang Kulit Batara Guru.jpg",None,None),
]
credits=[]
os.makedirs('assets/archive',exist_ok=True)
for name,title,w,page in items:
    out='assets/archive/'+name
    p=dict(action='query',titles=title,prop='imageinfo',iiprop='url|extmetadata|size')
    if w: p['iiurlwidth']=w
    if page: p['iiurlparam']=f'page{page}-{w}px'
    r=api(p)
    pg=list(r['query']['pages'].values())[0]
    if 'imageinfo' not in pg:
        # try fuzzy search
        print('MISSING',title); credits.append((name,title,'MISSING','','')); time.sleep(4); continue
    ii=pg['imageinfo'][0]; md=ii.get('extmetadata',{})
    url=ii.get('thumburl') if (w or page) else ii['url']
    lic=md.get('LicenseShortName',{}).get('value','?')
    import re
    artist=re.sub('<[^>]+>','',md.get('Artist',{}).get('value',''))[:80].strip()
    credits.append((name,pg['title'],lic,artist,ii.get('descriptionurl','')))
    if not os.path.exists(out):
        for k in range(5):
            try:
                urllib.request.urlretrieve if False else None
                data=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=300).read()
                open(out,'wb').write(data); break
            except Exception as e:
                print(' retry',name,e); time.sleep(15*(k+1))
    print(name, lic, os.path.getsize(out) if os.path.exists(out) else 'FAIL', flush=True)
    time.sleep(4)
json.dump(credits,open('work/credits_archive.json','w'),ensure_ascii=False,indent=1)
