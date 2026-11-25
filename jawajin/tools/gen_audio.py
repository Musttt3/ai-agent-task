import json, urllib.request, os, sys, time, concurrent.futures as cf
H={'xi-api-key':'dummy','Content-Type':'application/json'}
SFX={
 'whoosh':('soft cinematic air whoosh transition, smooth, subtle, documentary',1.5),
 'projector':('old 16mm film projector starting and running, mechanical clatter, vintage',4.0),
 'filmburn':('cinematic light swell whoosh with soft reverse cymbal, film burn transition, warm',2.5),
 'photo':('a single paper photograph placed onto a wooden desk, soft paper slap',1.0),
 'stamp':('heavy rubber stamp slammed on paper on a wooden desk, single thud',1.0),
 'scribble':('red marker drawing a quick circle on paper, short marker squeak',1.2),
 'tick':('pen ticking a checkbox on paper, quick short stroke',0.6),
 'boom':('deep cinematic boom impact with long tail, trailer hit, low end',3.0),
 'shimmer':('mystical magical shimmer, ethereal bells and airy sparkle, ghostly',3.0),
 'gong':('large Javanese gamelan gong ageng single strike, deep resonant shimmering decay',5.0),
 'typewriter':('vintage typewriter typing a short word then carriage bell',2.5),
 'poof':('cartoonish magic poof of smoke disappearing, comedic',1.2),
 'tvon':('old CRT television turning on, static burst and high pitched whine',1.5),
 'riser':('tense cinematic riser building suspense, strings and synth, ending abruptly',4.0),
 'wind':('desert wind ambience, gentle sand blowing, lonely',8.0),
 'ocean':('calm tropical ocean waves on a beach with mist, ambience',8.0),
 'reel':('vintage film reel projector loop ambience, soft continuous mechanical flutter',8.0),
 'string':('taut string being stretched and pinned on a cork board, short',1.0),
 'pageturn':('old book page turning, dry paper',1.2),
 'pop':('soft friendly UI pop click, warm, minimal',0.5),
 'fire':('campfire crackling at night, gentle ambience',6.0),
 'magic':('warm magical swell rising, golden light, choir pad, soft',4.0),
 'clash':('two supernatural energy forces clashing, electric crackle and blast with debris',3.0),
 'swab':('comedic short cartoon boing',0.8),
 'heartbeat':('slow deep heartbeat, cinematic, two beats',2.0),
}
MUSIC={
 'm1_hook':('Dark mysterious cinematic documentary underscore, slow tempo 70 bpm, Javanese gamelan bells (bonang, saron) over low string drones and soft taiko pulses, eerie and intriguing, builds slightly near the end, instrumental, no vocals',76000),
 'm2_fakta1':('Curious storytelling documentary underscore, light pizzicato strings, soft marimba and Javanese gamelan saron melody, gentle percussion, warm and slightly playful but mysterious, 90 bpm, instrumental, no vocals',110000),
 'm3_fakta2':('Mystical epic fantasy documentary score, Javanese gamelan and kendang drums with cinematic strings, ethereal female choir pad, builds into a powerful dramatic section in the middle then settles into a light comedic pizzicato ending, instrumental, no vocals',112000),
 'm4_fakta3':('Regal thoughtful documentary underscore, slow strings, harp and soft gamelan gong pulses, sense of royal court and history, curious and steady, 80 bpm, instrumental, no vocals',100000),
 'm5_fakta4':('Warm reflective hopeful documentary underscore, soft piano with gamelan bells, light strings, gentle and heartfelt, ending with a warm resolved outro, 85 bpm, instrumental, no vocals',160000),
}
def post(url, body, out):
    if os.path.exists(out) and os.path.getsize(out)>1000: return out,'cached'
    for k in range(4):
        try:
            req=urllib.request.Request(url,data=json.dumps(body).encode(),headers=H,method='POST')
            data=urllib.request.urlopen(req,timeout=600).read()
            open(out,'wb').write(data); return out,len(data)
        except Exception as e:
            err=getattr(e,'read',lambda:b'')()[:300]
            print('ERR',out,e,err,flush=True); time.sleep(10*(k+1))
    return out,'FAIL'
jobs=[]
with cf.ThreadPoolExecutor(4) as ex:
    for k,(t,d) in SFX.items():
        jobs.append(ex.submit(post,'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192',{'text':t,'duration_seconds':d,'prompt_influence':0.5},f'assets/audio/sfx/{k}.mp3'))
    for k,(p,ms) in MUSIC.items():
        jobs.append(ex.submit(post,'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192',{'prompt':p,'music_length_ms':ms,'force_instrumental':True},f'assets/audio/music/{k}.mp3'))
    for j in cf.as_completed(jobs): print(*j.result(),flush=True)
