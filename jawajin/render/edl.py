# Edit decision list: every visual is locked to word timings of VO_full.mp3
import os
from engine import *
from graphics import *
from timing import S, E, w, DURATION

def has(name):
    try: find_asset(name); return True
    except FileNotFoundError: return False

def build():
    sh, ov, cues = [], [], []      # shots, overlays, (sfx, abs_time, gain)
    F = ('fade', 0.6); FS = ('fade', 0.9); CUT = ('cut', 0); B = ('burn', 1.2)
    def kb(t0, img, z=(1.0, 1.08), c=((.5, .5), (.5, .5)), tin=F, r=(0, 0), **k):
        sh.append(KB(t0, None, img, z, c, r, tin=tin, **k)); return sh[-1]
    def card(t0, img, tin=F, src=None, **k):
        sh.append(Card3D(t0, None, img, tin=tin, **k)); cues.append(('photo', t0 + 0.15, 0.55))
        return sh[-1]
    def lt(t0, t1, name, sub=None, **k):
        ov.append(LowerThird(t0, t1, name, sub, **k)); cues.append(('whoosh', t0, 0.25))
    def txt(t0, t1, text, x, y, **k): ov.append(Text(t0, t1, text, x, y, **k))
    def stamp(t0, t1, text, x, y, ang=-8, size=86, col=RED):
        ov.append(Stamp(t0, t1, text, x, y, ang, size, col, sfx=None)); cues.append(('stamp', t0, 0.85))
    def circ(t0, t1, x, y, rx, ry, angle=0.0):
        ov.append(Scribble(t0, t1, x, y, rx, ry, sfx=None, angle=angle)); cues.append(('scribble', t0, 0.5))
    def src(t0, t1, text): ov.append(Source(t0, t1, text))
    def cue(name, t, g=0.6): cues.append((name, t, g))

    # =============================== HOOK =========================================
    kb(0.0, 'G38', z=(1.04, 1.16), c=((.5, .45), (.52, .42)), tin=CUT)
    lt(w('Said', 0) - 0.1, 5.6, 'SAID ANWAR', 'cucu Nabi Adam')
    txt(w('putri', 4) - 0.1, 7.2, 'PUTRI RAJA JIN', 1500, 930, size=44, tracking=6, wght=700, color=(226, 232, 238), glow=0.5, glow_color=(200, 220, 255))
    cue('shimmer', w('putri', 4) - 0.2, 0.45)
    kb(S(1) - 0.3, 'G40', z=(1.0, 1.1), c=((.5, .5), (.5, .45)))
    for i, (word, lab) in enumerate((('anaknya', 'ANAK'), ('cucunya', 'CUCU'), ('cicitnya', 'CICIT'))):
        t = w(word, 7)
        txt(t, 13.6, lab, 660 + i * 300, 930, size=56, tracking=10, wght=700, color=GOLD, glow=0.3)
        cue('pop', t, 0.35)
    kb(S(2) - 0.3, 'G47', z=(1.06, 1.12), c=((.5, .78), (.5, .28)))
    txt(w('dewa', 13.7), 19.6, 'PARA DEWA', 960, 300, size=48, tracking=10, wght=700, color=GOLD, glow=0.4)
    txt(w('raja-raja', 16), 19.6, 'RAJA-RAJA JAWA', 960, 160, size=48, tracking=10, wght=700, color=GOLD, glow=0.4)
    # sinetron joke
    sh.append(CRT(S(3) - 0.15, None, 'G22', w('sinetron', 19) + 0.25, tin=('cut', 0), c=(0.5, 0.35)))
    cue('tvon', S(3) - 0.15, 0.6); cue('boom', w('sinetron', 19) + 0.25, 0.35)
    # Ranggawarsita
    if has('AI01_ranggawarsita-gambar.jpg'):
        card(S(4) - 0.3, 'AI01_ranggawarsita-gambar.jpg', bg='paper', h=0.80, pos=(0.36, 0.5), tin=('burn', 0.8))
        src(S(4) + 0.6, w('1802', 22) - 0.3, 'Ranggawarsita, gambar abad ke-19 · Wikimedia Commons')
    else:
        card(S(4) - 0.3, 'G49', bg='paper', h=0.62, pos=(0.36, 0.5), tin=('burn', 0.8), crop=(0.0, 0.0, 0.52, 1.0))
    lt(w('Raden', 22), w('1802', 22) - 0.3, 'R. NG. RANGGAWARSITA', 'pujangga Keraton Surakarta', x=140, y=860, right=True)
    cue('projector', S(4) - 0.6, 0.25)
    kb(w('1802', 22) - 0.5, 'G44', z=(1.02, 1.1), c=((.6, .5), (.55, .45)))
    stamp(w('1802', 22), w('1802', 22) + 3.0, '1802', 1520, 220, -6, 110, (170, 34, 26))
    txt(w('terakhir', 28), 33.4, 'PUJANGGA BESAR TERAKHIR', 960, 960, size=46, tracking=8, wght=700, color=CREAM)
    ov.append(Dim(w('terakhir', 28) - 0.2, 33.5, 0.55, grad='bottom'))
    # Serat Paramayoga manuscript
    card(S(5) - 0.25, 'AI02_sandi-paramayoga.jpg', bg='dark', h=0.86, pos=(0.66, 0.5), yaw=(9, 3), pitch=(2, 0), tin=F)
    txt(w('Serat', 33.6), 36.4, 'SERAT', 520, 440, size=56, tracking=24, wght=600, color=CREAM)
    txt(w('Paramayoga', 33.6), 36.4, 'PARAMAYOGA', 520, 540, size=96, tracking=8, wght=800, color=GOLD, glow=0.5, scale_from=1.06)
    src(S(5), 36.3, 'Sandi Paramayoga · Wikimedia Commons')
    cue('magic', w('Paramayoga', 33.6) - 0.3, 0.4)
    # mbah
    kb(S(6) - 0.3, 'G14', z=(1.02, 1.12), c=((.35, .5), (.32, .45)))
    # debt joke
    kb(S(7) - 0.3, 'G33', z=(1.32, 1.42), c=((.42, .66), (.38, .64)))
    cue('poof', w('ngilang', 41) - 0.05, 0.55)
    # sejarah / dongeng / propaganda
    sh.append(Words(w('sebenarnya', 46) - 0.4, None, 'G01', [
        ('SEJARAH?', 520, 380, w('sejarah', 46), RED, -6),
        ('DONGENG?', 1380, 520, w('dongeng', 46), RED, 5),
        ('PROPAGANDA?', 900, 760, w('propaganda', 46), RED, -3)], tin=F))
    for word in ('sejarah', 'dongeng', 'propaganda'): cue('stamp', w(word, 46), 0.8)
    kb(S(8) - 0.3, 'G28', z=(1.0, 1.12), c=((.5, .55), (.5, .45)))
    cue('magic', S(8) + 0.3, 0.35)
    # channel intro + main title
    kb(S(9) - 0.4, 'G18', z=(1.05, 1.16), c=((.5, .4), (.5, .36)), tin=('burn', 1.0))
    ov.append(Dim(S(9), w('empat', 56) - 0.4, 0.35))
    txt(S(9) + 0.3, w('empat', 56) - 0.5, 'MUSTOFA K004', 960, 540, size=78, tracking=26, wght=700, color=CREAM, glow=0.4, glow_color=(255, 190, 110), anim='drift')
    cue('gong', S(9) + 0.2, 0.55)
    kb(w('empat', 56) - 0.6, 'G01', z=(1.06, 1.16), c=((.5, .5), (.5, .42)), tin=('burn', 1.0))
    ov.append(Dim(w('empat', 56), 66.4, 0.5))
    tt = w('empat', 56)
    txt(tt, 66.3, 'BENARKAH LELUHUR ORANG JAWA', 960, 410, size=70, tracking=6, wght=800, color=CREAM, fi=0.9)
    txt(tt + 0.6, 66.3, 'MENIKAHI JIN?', 960, 525, size=128, tracking=10, wght=900, color=GOLD, glow=0.6, glow_color=(255, 160, 60), fi=1.0, scale_from=1.08)
    ov.append(TypeText(w('fakta', 56), 66.3, '4 Fakta Gila dari Serat Paramayoga', 960, 660))
    cue('boom', tt + 0.6, 0.5); cue('typewriter', w('fakta', 56), 0.35)
    kb(S(10) - 0.2, 'G30', z=(1.04, 1.14), c=((.6, .5), (.55, .5)), tin=FS)
    kb(S(11) - 0.2, 'G31', z=(1.02, 1.1), c=((.4, .5), (.35, .45)))

    # =============================== FAKTA 1 ======================================
    sh.append(Chapter(S(12) - 0.6, None, 1, 'Silsilahnya Dimulai dari Nabi Adam', 'G27', c=(0.5, 0.45)))
    cue('filmburn', S(12) - 1.2, 0.5); cue('gong', S(12) - 0.1, 0.7)
    kb(S(13) - 0.3, 'G34', z=(1.02, 1.1), c=((.5, .55), (.45, .6)))
    stamp(w('salah', 76.9) + 0.05, S(14) - 0.2, 'SALAH KAPRAH', 960, 260, -7, 84)
    if has('AI05_lontar-calonarang.jpg'):
        kb(S(14) - 0.3, 'AI05_lontar-calonarang.jpg', z=(1.05, 1.2), c=((.35, .5), (.6, .5)))
        src(S(14), w('Majapahit', 80) - 0.4, 'Lontar Tojan · Wikimedia Commons (CC BY-SA 4.0)')
    else:
        kb(S(14) - 0.3, 'G34', z=(1.7, 1.85), c=((.45, .62), (.55, .6)))
    if has('AI06b_majapahit-relief-met.jpg'):
        card(w('Majapahit', 80) - 0.6, 'AI06b_majapahit-relief-met.jpg', bg='blur', bg_img='G34', h=0.84, pos=(0.5, 0.47), yaw=(-6, 5))
        src(w('Majapahit', 80), S(15), 'Terakota Jawa Timur, abad 14–15 · The Met (CC0)')
    txt(w('lontar', 80), w('Majapahit', 80) - 0.7, 'DAUN LONTAR', 960, 960, size=50, tracking=10, wght=700, color=CREAM)
    sh.append(TimelineMajapahit(S(15) - 0.4, None, {'x': w('Nyatanya', 85), 'abad': w('abad', 85)}, tin=F))
    cue('scribble', w('Nyatanya', 85), 0.5); cue('pageturn', S(15) - 0.4, 0.5)
    # appointment 1845
    kb(S(16) - 0.3, 'G21', z=(1.0, 1.1), c=((.5, .5), (.55, .45)))
    if has('AI04_pakubuwono-vii.jpg'):
        card(w('Pakubuwono', 89) - 0.4, 'AI04_pakubuwono-vii.jpg', bg='blur', bg_img='G21', h=0.82, pos=(0.62, 0.5))
        src(w('Pakubuwono', 89), S(17) - 0.2, 'Potret Pakubuwono VII · Wikimedia Commons (CC BY-SA)')
        lt(w('Pakubuwono', 89) + 0.2, S(17) - 0.2, 'PAKUBUWONO VII', 'Susuhunan Surakarta', x=110, y=860)
    else:
        lt(w('Pakubuwono', 89) + 0.2, S(17) - 0.2, 'PAKUBUWONO VII', 'Susuhunan Surakarta', x=110, y=860)
    stamp(w('1845', 92), S(17) - 0.1, '1845', 330, 230, -5, 110, (170, 34, 26))
    # Pustaka Raja Purwa
    kb(S(17) - 0.3, 'G05', z=(1.0, 1.12), c=((.5, .5), (.62, .4)))
    if has('AI03_pustaka-raja-purwa.jpg'):
        card(w('Pustaka', 98) - 0.4, 'AI03_pustaka-raja-purwa.jpg', bg='blur', bg_img='G05', h=0.84, pos=(0.66, 0.5), yaw=(8, 2))
        src(w('Pustaka', 98), S(18) - 0.2, 'Serat Pustaka Raja Purwa · Wikimedia Commons')
    ov.append(Dim(w('Pustaka', 98) - 0.3, S(18), 0.5, grad='left'))
    txt(w('Pustaka', 98), S(18) - 0.1, 'PUSTAKA', 560, 470, size=56, tracking=20, wght=600, color=CREAM)
    txt(w('Pustaka', 98) + 0.3, S(18) - 0.1, 'RAJA PURWA', 560, 570, size=84, tracking=8, wght=800, color=GOLD, glow=0.4)
    # genealogy A
    tA = {'adam': w('Adam', 102.4) - 0.2, 'sis': w('Nabisis', 102.4) - 0.1, 'anwas': w('Anwas', 105.9) - 0.1,
          'anwar': w('Anwar', 105.9) - 0.1, 'nabi': w('nabi', 109.8) - 0.2, 'beda': w('beda', 112)}
    sh.append(GenealogyA(S(18) - 0.4, None, tA, tin=F))
    for k in ('adam', 'sis', 'anwas', 'anwar'): cue('pop', tA[k], 0.35)
    cue('scribble', tA['beda'], 0.5)
    # 990 years / grief
    kb(S(22) - 0.3, 'G42', z=(1.0, 1.1), c=((.5, .5), (.45, .45)))
    ov.append(Counter(w('990', 114), w('gelisah', 118) + 0.4, 990, 'TAHUN', 1500, 300))
    cue('heartbeat', w('wafat', 114), 0.4)
    kb(S(23) - 0.3, 'G42', z=(1.35, 1.45), c=((.42, .35), (.45, .32)))
    kb(S(24) - 0.3, 'G17', z=(1.0, 1.08), c=((.5, .5), (.6, .5)))
    txt(w('ajaran', 128.5), S(26) - 0.2, 'MENOLAK AJARAN', 960, 960, size=48, tracking=10, wght=700, color=CREAM)
    kb(S(26) - 0.3, 'G39', z=(1.0, 1.08), c=((.5, .5), (.5, .45)))
    ov.append(Arrow(w('timur', 131), S(27) - 0.1, (760, 880), (1180, 880), GOLD, 6, 0.9, 30))
    txt(w('timur', 131), S(27) - 0.1, 'TIMUR', 1290, 880, size=56, tracking=14, wght=800, color=GOLD, anchor='lc')
    cue('wind', S(26) - 0.3, 0.35)
    # two branches
    kb(S(27) - 0.3, 'G08', z=(1.0, 1.08), c=((.5, .5), (.5, .45)))
    txt(w('Anwas', 138.8), S(30) + 0.6, 'GARIS ANWAS', 420, 760, size=48, tracking=8, wght=700, color=(250, 246, 236), glow=0.5, glow_color=(255, 255, 240))
    txt(w('Anwas', 138.8) + 0.3, S(30) + 0.6, 'jalur para nabi', 420, 830, fname='cormi', size=44, wght=600, color=CREAM)
    txt(w('Anwar', 141.2), S(30) + 0.6, 'GARIS ANWAR', 1500, 760, size=48, tracking=8, wght=700, color=GOLD, glow=0.4)
    txt(w('Anwar', 141.2) + 0.3, S(30) + 0.6, 'jalur dewa & raja Jawa', 1500, 830, fname='cormi', size=44, wght=600, color=CREAM)
    ov.append(Dim(w('Anwas', 138.8) - 0.3, S(31) - 0.2, 0.55, grad='bottom'))
    txt(S(30), S(31) - 0.1, 'SATU KELUARGA, DUA CABANG', 960, 150, size=52, tracking=8, wght=700, color=CREAM)
    cue('magic', S(27), 0.3)
    # lebaran / pakde
    kb(S(31) - 0.3, 'G15', z=(1.0, 1.06), c=((.5, .5), (.5, .5)), tin=FS)
    kb(w('Tiba-tiba', 150) - 0.3, 'G15', z=(1.5, 1.6), c=((.52, .3), (.55, .3)))
    kb(w('Buktinya', 150) - 0.3, 'G15', z=(1.45, 1.52), c=((.85, .4), (.82, .4)))
    kb(w('Lah', 155) - 0.3, 'G15', z=(1.6, 1.7), c=((.6, .28), (.62, .3)))
    kb(w('cek', 159.7) - 0.3, 'G43', z=(1.02, 1.06), c=((.35, .55), (.35, .55)))
    circ(w('bergaris', 162), S(35), 360, 280, 210, 110, angle=-12)
    circ(w('pulpen', 162), S(35), 450, 440, 360, 85, angle=-27)
    circ(w('stiker', 162), S(35), 600, 570, 190, 130, angle=-8)
    sh.append(TimelineAges(S(35) - 0.3, None, {'cerita': S(35) + 0.2, 'tulis': w('ditulisnya', 170) - 0.2}, tin=F))
    kb(S(37) - 0.3, 'G03', z=(1.02, 1.12), c=((.6, .55), (.55, .5)))
    ov.append(Dim(S(37), 179.9, 0.5, grad='bottom'))
    txt(w('tua', 175.5), 179.9, 'Tua ceritanya,', 960, 880, fname='cormi', size=70, wght=600, color=CREAM)
    txt(w('belum', 175.5), 179.9, 'belum tentu tua kitabnya.', 960, 965, fname='cormi', size=70, wght=600, color=GOLD)

    # =============================== FAKTA 2 ======================================
    sh.append(Chapter(S(38) - 0.6, None, 2, 'Nikah sama Putri Raja Jin', 'G18', c=(0.5, 0.42)))
    cue('filmburn', S(38) - 1.2, 0.5); cue('gong', S(38) - 0.1, 0.7)
    kb(S(39) - 0.3, 'G37', z=(1.0, 1.1), c=((.5, .5), (.55, .45)))
    cue('ocean', S(39) - 0.3, 0.4)
    sh.append(MapShot(w('beberapa', 185) - 0.4, None, (30, 112, -14, 34), res='50m', z=(1.0, 1.08), c=((.45, .5), (.5, .55)),
                      routes=[{'pts': [(40, 21.5), (52, 17), (62, 11), (70, 6), (73.3, 3.4)], 't': w('beberapa', 185), 'dur': 1.6}],
                      points=[{'lon': 73.3, 'lat': 3.2, 'label': 'MALADEWA', 't': w('Maladewa', 185) - 0.2, 'off': (0, -58)}], tin=F))
    cue('whoosh', w('beberapa', 185), 0.35)
    kb(S(40) - 0.3, 'G23', z=(1.02, 1.12), c=((.5, .4), (.5, .3)))
    lt(w('Prabu', 191.5), S(41) - 0.2, 'PRABU NURHADI', 'Raja Jin · keturunan Jan Banujan')
    cue('heartbeat', S(40), 0.35)
    kb(S(41) - 0.3, 'G37', z=(1.3, 1.4), c=((.62, .3), (.6, .32)))
    cue('riser', S(42) - 3.2, 0.4)
    sh.append(Versus(S(42) - 0.1, None, ('G38', 1.25, (0.42, 0.4)), ('G23', 1.1, (0.5, 0.33)), w('lawan', 202) - 0.05, tin=('flash', 0.25)))
    cue('boom', w('lawan', 202) - 0.05, 0.8)
    kb(S(43) - 0.2, 'G41', z=(1.0, 1.08), c=((.45, .5), (.5, .5)), tin=FS)
    kb(S(45) - 0.15, 'G41', z=(1.35, 1.5), c=((.58, .42), (.6, .42)), tin=('flash', 0.25))
    cue('clash', S(45) - 0.2, 0.75)
    kb(S(46) - 0.3, 'G20', z=(1.02, 1.1), c=((.5, .5), (.45, .5)))
    kb(S(47) - 0.3, 'G18', z=(1.1, 1.2), c=((.5, .45), (.5, .4)))
    lt(w('Dewi', 212.7), S(48) - 0.2, 'DEWI NURINI', 'putri Prabu Nurhadi', x=140, y=880, right=True)
    cue('shimmer', w('Dewi', 212.7) - 0.2, 0.5)
    kb(S(48) - 0.3, 'G22', z=(1.0, 1.1), c=((.5, .5), (.5, .4)))
    lt(w('Sang', 218.7), S(49) - 0.2, 'SANG HYANG NUR CAHYA', 'raja para jin')
    cue('magic', w('Sang', 218.7) - 0.3, 0.4)
    # generations
    kb(S(49) - 0.3, 'G40', z=(1.15, 1.22), c=((.5, .5), (.48, .45)))
    kb(S(50) - 0.3, 'G29', z=(1.05, 1.15), c=((.5, .5), (.5, .4)))
    ov.append(GenBadge(w('Sang', 225.2), S(51) - 0.2, 1, 'SANG HYANG NUR RASA'))
    kb(S(51) - 0.3, 'G12', z=(1.04, 1.14), c=((.5, .5), (.5, .4)))
    ov.append(GenBadge(w('Sang', 231.7), S(52) - 0.2, 2, 'SANG HYANG WENANG'))
    kb(S(52) - 0.3, 'G11', z=(1.04, 1.14), c=((.55, .5), (.55, .42)))
    ov.append(GenBadge(w('Sang', 236.3), S(53) - 0.2, 3, 'SANG HYANG TUNGGAL'))
    for t in (w('satu', 225.2), w('dua', 231.7), w('tiga', 236.3)): cue('pop', t, 0.4)
    kb(S(53) - 0.3, 'G02', z=(1.0, 1.1), c=((.55, .45), (.6, .35)))
    lt(w('Batara', 240.4), w('wayang', 240.4) - 0.6, 'BATARA GURU', 'raja para dewa')
    cue('gong', w('Batara', 240.4) - 0.2, 0.45)
    if has('AI08_batara-guru-nandi.jpg') or has('AI20_wayang-batara-guru.jpg'):
        img = 'AI08_batara-guru-nandi.jpg' if has('AI08_batara-guru-nandi.jpg') else 'AI20_wayang-batara-guru.jpg'
        card(w('dunia', 243) - 0.4, img, bg='blur', bg_img='G02', h=0.84, pos=(0.5, 0.5), yaw=(-6, 6))
        src(w('dunia', 243), S(54) - 0.2, 'Wayang Batara Guru · Tropenmuseum / Wikimedia Commons')
    tB = {'gen': [S(54) - 0.1, S(54) + 0.5, S(54) + 1.1, S(54) + 1.7], 'guru': S(54) + 2.3, 'legend': w('darah', 246)}
    sh.append(GenealogyB(S(54) - 0.35, None, tB, tin=F))
    for k in range(4): cue('pop', tB['gen'][k], 0.3)
    # why jinn
    kb(S(55) - 0.3, 'G18', z=(1.3, 1.36), c=((.5, .36), (.5, .36)))
    txt(w('kenapa', 252), S(56) - 0.1, 'KENAPA HARUS JIN?', 960, 960, size=58, tracking=10, wght=800, color=CREAM)
    ov.append(Dim(S(55), S(56), 0.5, grad='bottom'))
    if has('AI18_penari-kraton-1885.jpg'):
        kb(S(56) - 0.3, 'AI18_penari-kraton-1885.jpg', z=(1.05, 1.12), c=((.5, .5), (.5, .45)), grade='bw')
        src(S(56), S(57) - 0.2, 'Kassian Céphas, Keraton Yogyakarta ±1885 · KITLV / Commons')
    elif has('AV03_penobatan-solo-1945.webm'):
        sh.append(Vid(S(56) - 0.3, None, 'AV03_penobatan-solo-1945.webm', 131.6, mode='film', tin=F))
        src(S(56), S(57) - 0.2, 'Nampo Hodo 1945, Surakarta · Wikimedia Commons')
    else:
        kb(S(56) - 0.3, 'G24', z=(1.3, 1.36), c=((.7, .5), (.7, .5)))
    txt(w('putri', 254.7), S(57) - 0.1, 'PUTRI BANGSAWAN BIASA?', 960, 960, size=50, tracking=8, wght=700, color=CREAM)
    kb(S(57) - 0.3, 'G40', z=(1.9, 2.0), c=((.12, .62), (.2, .6)))
    txt(w('lebih', 257), S(58) - 0.1, 'PENGHUNI DUNIA LEBIH TUA', 960, 160, size=48, tracking=8, wght=700, color=CREAM)
    kb(S(58) - 0.3, 'G09', z=(1.0, 1.06), c=((.5, .5), (.5, .5)))
    txt(w('nyata', 262.8), S(59) - 0.1, 'ALAM NYATA', 430, 930, size=58, tracking=10, wght=800, color=GOLD, glow=0.3)
    txt(w('gaib', 262.8), S(59) - 0.1, 'ALAM GAIB', 1490, 930, size=58, tracking=10, wght=800, color=(226, 232, 238), glow=0.5, glow_color=(190, 210, 255))
    ov.append(Dim(S(58), S(59), 0.5, grad='bottom'))
    cue('shimmer', w('gaib', 262.8) - 0.2, 0.4)
    # calon mertua
    kb(S(59) - 0.3, 'G32', z=(1.0, 1.06), c=((.5, .5), (.5, .5)), tin=FS)
    kb(w('Om', 273) - 0.25, 'G32', z=(1.55, 1.62), c=((.26, .36), (.27, .36)), tin=CUT)
    kb(w('Kamu', 275) - 0.15, 'G32', z=(1.6, 1.68), c=((.78, .38), (.78, .38)), tin=CUT)
    kb(w('Saya', 276) - 0.15, 'G32', z=(1.75, 1.95), c=((.26, .33), (.26, .31)), tin=CUT)
    kb(w('Di', 278.5) - 0.3, 'G16', z=(1.0, 1.08), c=((.5, .5), (.45, .5)))
    cue('whoosh', w('diusir', 279.5), 0.4)
    kb(S(61) - 0.3, 'G20', z=(1.15, 1.25), c=((.4, .55), (.5, .5)))
    txt(w('Kekuasaan', 286), 288.8, 'KEKUASAAN DULU,', 960, 880, size=54, tracking=8, wght=800, color=GOLD)
    txt(w('restu', 286), 288.8, 'RESTU BELAKANGAN.', 960, 960, size=54, tracking=8, wght=800, color=CREAM)
    ov.append(Dim(S(62) - 0.3, 288.9, 0.55, grad='bottom'))

    # =============================== FAKTA 3 ======================================
    sh.append(Chapter(S(63) - 0.6, None, 3, 'Kenapa Cerita Ini Ditulis?', 'G25', c=(0.5, 0.5)))
    cue('filmburn', S(63) - 1.2, 0.5); cue('gong', S(63) - 0.1, 0.7)
    kb(S(64) - 0.3, 'G01', z=(1.02, 1.1), c=((.5, .5), (.5, .45)))
    stamp(w('salah', 292) + 0.05, S(65) - 0.2, 'SALAH KAPRAH', 960, 230, 6, 84)
    if has('AI15_serat-kalatidha-leiden.jpg'):
        kb(S(65) - 0.3, 'AI15_serat-kalatidha-leiden.jpg', z=(1.05, 1.2), c=((.35, .45), (.6, .5)))
        src(S(65), S(66) - 0.2, 'Naskah Serat Kalatidha, Leiden · Wikimedia Commons (CC BY-SA 3.0)')
    else:
        kb(S(65) - 0.3, 'AI02b_sandi-paramayoga-p3.jpg', z=(1.05, 1.2), c=((.5, .3), (.5, .6)))
    ov.append(Lens(S(65) + 0.2, S(66) - 0.1))
    txt(w('peneliti', 297.5), S(66) - 0.1, 'PENELITI SASTRA JAWA', 960, 960, size=50, tracking=8, wght=700, color=CREAM)
    ov.append(Dim(S(65), S(66), 0.5, grad='bottom'))
    mahab = 'AI13_wayang-kulit-1890.jpg' if has('AI13_wayang-kulit-1890.jpg') else 'G50'
    raja = 'AI04_pakubuwono-vii.jpg' if has('AI04_pakubuwono-vii.jpg') else 'G24'
    dewa = 'AI08_batara-guru-nandi.jpg' if has('AI08_batara-guru-nandi.jpg') else 'G02'
    cards = [('G27', 'NABI ADAM', (360, 470), w('Nabi', 301.5) - 0.1, -3, (0.25, 0.0, 0.75, 1.0)),
             (dewa, 'DEWA HINDU', (800, 600), w('dewa-dewa', 301.5) - 0.1, 2.5, None if dewa != 'G02' else (0.35, 0.0, 0.85, 0.9)),
             (mahab, 'MAHABHARATA', (1240, 450), w('Mahabharata', 301.5) - 0.3, -2, None if mahab != 'G50' else (0.3, 0.0, 0.8, 0.7)),
             (raja, 'RAJA JAWA', (1610, 610), w('raja-raja', 301.5) - 0.1, 3, None)]
    sh.append(CaseBoard(S(66) - 0.3, None, cards, tin=F))
    for c_ in cards: cue('photo', c_[3], 0.5)
    for c_ in cards[1:]: cue('string', c_[3] + 0.25, 0.4)
    if has('AV01_pemakaman-pb10-1939.webm'):
        sh.append(Vid(S(67) - 0.3, None, 'AV01_pemakaman-pb10-1939.webm', 16.5, mode='film', tin=F))
        src(S(67), S(68) - 0.2, 'Arsip film 1939: pemakaman Pakubuwono X, Surakarta · Wikimedia Commons')
        cue('reel', S(67) - 0.3, 0.3)
    else:
        kb(S(67) - 0.3, 'G25', z=(1.0, 1.08))
    txt(w('wibawa', 309.6), S(68) - 0.1, 'WIBAWA RAJA', 960, 990, size=54, tracking=12, wght=800, color=GOLD, glow=0.3)
    kb(S(68) - 0.3, 'G24', z=(1.0, 1.06), c=((.5, .5), (.55, .5)))
    for word, lab, x, y in (('Islam', 'ISLAM', 830, 330), ('Hindu', 'HINDU-BUDDHA', 1100, 250), ('penunggu', 'PENUNGGU DESA', 1440, 330)):
        t = w(word, 315)
        ov.append(Tag(t, S(69) - 0.1, lab, x, y))
        cue('pop', t, 0.35)
    kb(S(69) - 0.3, 'G25', z=(1.0, 1.1), c=((.5, .5), (.5, .45)))
    txt(w('Gampang', 325), S(71) + 0.2, 'GAMPANG.', 960, 960, size=62, tracking=14, wght=800, color=GOLD)
    ck = [('LIGHT', (.5, .5, .5), 'NABI ADAM', w('Nabi', 328.5) - 0.2, w('cek', 328.6)),
          ('G02', (.63, .27, .3), 'PARA DEWA', w('dewa', 330) - 0.2, w('cek', 330.5)),
          ('G23', (.5, .25, .35), 'ALAM GAIB', w('penguasa', 331.5) - 0.2, w('cek', 332.5))]
    sh.append(Checklist(S(72) - 0.4, None, ck, 'G25', (('SATU SILSILAH', 'semua golongan kebagian'), w('satu', 333)), tin=F))
    for it in ck: cue('tick', it[4], 0.7)
    # world map: Jawa, Jepang, Roma
    sh.append(MapShot(S(75) - 0.35, None, (-12, 150, -16, 62), res='50m', z=(1.0, 1.05), c=((.7, .62), (.55, .55)),
                      points=[{'lon': 110.5, 'lat': -7.4, 'label': 'JAWA', 't': S(75) - 0.1, 'off': (0, 54)},
                              {'lon': 139.7, 'lat': 35.7, 'label': 'JEPANG', 't': S(75) + 0.7, 'off': (0, -56)},
                              {'lon': 12.5, 'lat': 41.9, 'label': 'ROMA', 't': S(75) + 1.4, 'off': (0, -56)}], tin=F))
    cue('pop', S(75) + 0.7, 0.3); cue('pop', S(75) + 1.4, 0.3)
    cue('pop', S(75) - 0.1, 0.35)
    amat = 'AI09_amaterasu-toshimasa-1889.jpg' if has('AI09_amaterasu-toshimasa-1889.jpg') else 'G19'
    kb(w('Kaisar', 338.9) - 0.1, amat, z=(1.05, 1.12), c=((.3, .5), (.6, .5)))
    lt(w('Amaterasu', 338.9) - 0.4, S(77) - 0.2, 'AMATERASU', 'Dewi Matahari · Jepang')
    if amat.startswith('AI'): src(w('Kaisar', 338.9) + 0.4, S(77) - 0.2, 'Shunsai Toshimasa, 1889 · Wikimedia Commons')
    rom = 'AI10_romulus-remus-met.jpg' if has('AI10_romulus-remus-met.jpg') else 'G46'
    kb(S(77) - 0.3, rom, z=(1.15, 1.25), c=((.45, .45), (.42, .45)), grade='bw' if rom.startswith('AI') else None)
    if rom.startswith('AI'): src(S(77), S(78) - 0.2, 'Romulus & Remus, cetakan ±1650–75 · The Met (CC0)')
    lt(w('Romulus', 343), S(78) - 0.2, 'ROMULUS', 'anak Dewa Mars · Roma')
    if has('AI11_velazquez-mars.jpg'):
        card(w('Mars', 343) - 0.5, 'AI11_velazquez-mars.jpg', bg='blur', bg_img=rom, h=0.86, pos=(0.7, 0.5), yaw=(-8, -2))
    myth = [('G02', (0.25, 0.0, 0.9, 1.0), 'JAWA', 'para dewa', w('Hampir', 346.8)),
            (amat, None, 'JEPANG', 'Amaterasu', w('semua', 346.8) + 0.2),
            ('AI10b_romulus-remus-1652-met.jpg' if has('AI10b_romulus-remus-1652-met.jpg') else 'G46', (0.05, 0.05, 0.95, 0.86) if has('AI10b_romulus-remus-1652-met.jpg') else None, 'ROMA', 'Dewa Mars', w('kerajaan', 346.8))]
    sh.append(Cards(S(78) - 0.3, None, myth, 'G47', ('LELUHUR SETENGAH GAIB', w('leluhur', 347)), tin=F, h=380, y=520))
    for m_ in myth: cue('photo', m_[4], 0.45)
    if has('AV03_penobatan-solo-1945.webm'):
        sh.append(Vid(S(79) - 0.3, None, 'AV03_penobatan-solo-1945.webm', 138.6, mode='film', tin=F))
        src(S(79), S(80) - 0.2, 'Nampo Hodo 1945: penobatan di Surakarta · Wikimedia Commons')
        cue('reel', S(79) - 0.3, 0.3)
    pend = 'AI12_pendopo-kraton-cephas.jpg' if has('AI12_pendopo-kraton-cephas.jpg') else ('AI19_alun-alun-beringin-1894.jpg' if has('AI19_alun-alun-beringin-1894.jpg') else 'G24')
    if not has('AV03_penobatan-solo-1945.webm'):
        kb(S(79) - 0.3, pend, z=(1.02, 1.1), c=((.5, .5), (.55, .5)), grade='bw' if pend.startswith('AI') else None)
        if pend.startswith('AI'): src(S(79), S(80) - 0.2, 'Kassian Céphas, pendopo keraton Jawa (±1894) · KITLV / Commons')
    card(S(80) - 0.3, 'AI02b_sandi-paramayoga-p3.jpg', bg='dark', h=0.84, pos=(0.64, 0.5), yaw=(7, 2))
    txt(w('surat', 354.8), S(81) - 0.1, 'SURAT SAKTI', 560, 480, size=84, tracking=10, wght=800, color=GOLD, glow=0.5)
    txt(w('budaya', 354.8), S(81) - 0.1, 'budaya', 560, 580, fname='cormi', size=70, wght=600, color=CREAM)
    cue('magic', w('surat', 354.8) - 0.3, 0.35)
    kb(S(81) - 0.3, 'G28', z=(1.04, 1.14), c=((.5, .5), (.5, .4)))
    kb(S(82) - 0.3, 'G09', z=(1.12, 1.2), c=((.45, .45), (.5, .4)))
    for i, (word, lab) in enumerate((('langit', 'LANGIT'), ('bumi', 'BUMI'), ('gaib', 'ALAM GAIB'))):
        txt(w(word, 361.2), S(83) - 0.1, lab, 560 + i * 400, 960, size=54, tracking=10, wght=800, color=GOLD if i < 2 else (226, 232, 238))
        cue('pop', w(word, 361.2), 0.3)
    ov.append(Dim(S(82), S(83), 0.5, grad='bottom'))
    # ketua kelas
    kb(S(83) - 0.3, 'G48', z=(1.0, 1.06), c=((.5, .5), (.45, .5)), tin=FS)
    kb(w('Gue', 370.3) - 0.3, 'G48', z=(1.7, 1.8), c=((.27, .25), (.28, .25)))
    for i, (word, lab) in enumerate((('OSIS', 'KETUA OSIS'), ('kelas', 'WALI KELAS'), ('kantin', 'IBU KANTIN'))):
        t = w(word, 370.3)
        ov.append(Tag(t, w('Terus', 374) - 0.1, lab, 1280, 300 + i * 150, ink=False))
        cue('pop', t, 0.35)
    kb(w('Terus', 374) - 0.3, 'G48', z=(1.45, 1.55), c=((.7, .55), (.72, .55)))
    txt(w('Klaim', 378), S(86) - 0.1, 'KLAIM KONEKSI = SENJATA LAMA', 960, 960, size=48, tracking=6, wght=800, color=CREAM)
    ov.append(Dim(w('Klaim', 378) - 0.3, S(86), 0.55, grad='bottom'))
    sh.append(Split(S(86) - 0.3, None, ('G44', 1.15, (0.6, 0.5)), ('G48', 1.6, (0.28, 0.3)),
                    [('PUJANGGA', 'raja Jawa', 480, w('pujangga', 381), GOLD), ('MODAL NGOMONG', 'temanmu', 1440, w('modal', 383), CREAM)], tin=('slide', 0.7)))
    cue('whoosh', S(86) - 0.3, 0.4)

    # =============================== FAKTA 4 ======================================
    sh.append(Chapter(S(87) - 0.6, None, 4, 'Jadi, Leluhur Orang Jawa Beneran Jin?', 'G31', c=(0.35, 0.5)))
    cue('filmburn', S(87) - 1.2, 0.5); cue('gong', S(87) - 0.1, 0.7)
    kb(S(89) - 0.3, 'G35', z=(1.0, 1.08), c=((.5, .5), (.5, .45)))
    txt(w('dua', 390) - 0.1, S(90) - 0.1, 'SALAH KAPRAH DUA ARAH', 960, 960, size=52, tracking=8, wght=800, color=CREAM)
    ov.append(Dim(S(89), S(90), 0.5, grad='bottom'))
    kb(S(90) - 0.3, 'G14', z=(1.2, 1.28), c=((.35, .45), (.33, .45)))
    txt(w('percaya', 392.4), S(91) - 0.1, 'PERCAYA 100%', 960, 960, size=60, tracking=10, wght=800, color=GOLD)
    kb(S(91) - 0.3, 'G36', z=(1.0, 1.08), c=((.5, .5), (.45, .5)))
    txt(w('konyol', 394.6) - 0.3, S(92) - 0.1, 'CERITA KONYOL', 960, 960, size=60, tracking=10, wght=800, color=CREAM)
    ov.append(Dim(S(90), S(92), 0.5, grad='bottom'))
    sh.append(Split(S(92) - 0.3, None, ('G14', 1.2, (0.35, 0.45), 'dim'), ('G36', 1.0, (0.5, 0.5), 'dim'),
                    [('PERCAYA 100%', None, 480, S(92) - 0.2, GOLD), ('CERITA KONYOL', None, 1440, S(92) - 0.2, CREAM)], tin=F))
    stamp(w('kurang', 398.3), S(93) - 0.1, 'KURANG PAS', 960, 420, -6, 96)
    kb(S(93) - 0.3, 'G10', z=(1.0, 1.1), c=((.5, .5), (.55, .45)))
    txt(w('genetika', 400.8), S(94) - 0.1, 'GENETIKA + ARKEOLOGI', 960, 960, size=54, tracking=8, wght=800, color=CREAM)
    ov.append(Dim(S(93), S(94), 0.5, grad='bottom'))
    sh.append(MapShot(S(94) - 0.3, None, (90, 142, -12, 31), res='50m', z=(1.0, 1.05), c=((.5, .5), (.48, .55)),
                      routes=[{'pts': [(121, 23.5), (121.2, 18), (121.5, 13), (122, 8), (120, 3), (116, -2), (111, -6.5)], 't': w('Austronesia', 407) - 0.2, 'dur': 2.2, 'color': RED},
                              {'pts': [(121.5, 13), (125, 6), (124.5, 1), (122, -3)], 't': w('Austronesia', 407) + 0.8, 'dur': 1.6, 'color': RED}],
                      points=[{'lon': 121, 'lat': 23.6, 'label': 'PENUTUR AUSTRONESIA', 't': w('Austronesia', 407) - 0.4, 'off': (40, 0), 'size': 36, 'anchor': 'lc'},
                              {'lon': 103, 'lat': 0.5, 'label': 'PENGHUNI LEBIH AWAL', 't': w('kelompok', 409), 'off': (-20, -56), 'size': 36, 'color': (120, 80, 40)},
                              {'lon': 110.5, 'lat': -7.3, 'label': 'JAWA', 't': w('Asia', 410), 'off': (0, 54), 'size': 40}], tin=F))
    cue('whoosh', w('Austronesia', 407) - 0.2, 0.35)
    kb(S(95) - 0.3, 'G10', z=(1.25, 1.32), c=((.45, .35), (.5, .35)))
    stamp(w('DNA', 413.8), S(96) - 0.1, 'DNA JIN: NIHIL', 960, 540, -5, 90)
    kb(S(96) - 0.3, 'G26', z=(1.0, 1.08), c=((.5, .5), (.6, .5)))
    cue('swab', w('swab', 416), 0.5)
    if has('AV04_lahirnja-gatotkatja-1960.webm'):
        sh.append(Vid(S(97) - 0.3, None, 'AV04_lahirnja-gatotkatja-1960.webm', 779.4, mode='film', tin=F, bw=True, crop='iw:ih*0.86:0:0'))
        src(S(97), S(98) - 0.2, 'Film "Lahirnja Gatotkatja" (1960) · Wikimedia Commons')
        cue('reel', S(97) - 0.3, 0.3)
    else:
        kb(S(97) - 0.3, 'G45', z=(1.0, 1.08))
    txt(w('budaya', 418.6), S(98) - 0.1, 'TETAP BERHARGA', 960, 990, size=54, tracking=10, wght=800, color=GOLD)
    kb(S(98) - 0.3, 'G04', z=(1.0, 1.1), c=((.45, .55), (.4, .5)))
    txt(w('dongeng', 422), S(99) - 0.1, '"dongeng yang mitis"', 960, 900, fname='cormi', size=78, wght=600, color=CREAM)
    ov.append(Dim(S(98), S(99), 0.5, grad='bottom'))
    kb(S(99) - 0.3, 'G44', z=(1.04, 1.12), c=((.6, .45), (.6, .5)))
    stamp(w('biologi', 426.5), S(100) - 0.1, 'BUKAN BUKU BIOLOGI', 960, 820, 4, 70)
    sh.append(MapShot(S(100) - 0.3, None, (104.5, 115.5, -9.6, -4.4), res='10m', z=(1.0, 1.06), c=((.5, .5), (.5, .5)),
                      points=[{'lon': 110.8, 'lat': -7.55, 'label': 'PETA IDENTITAS', 't': w('peta', 429.2), 'off': (0, -70), 'size': 48}], tin=F))
    arc = 'AI19_alun-alun-beringin-1894.jpg' if has('AI19_alun-alun-beringin-1894.jpg') else ('AI18_penari-kraton-1885.jpg' if has('AI18_penari-kraton-1885.jpg') else 'G24')
    kb(S(101) - 0.3, arc, z=(1.02, 1.1), c=((.5, .5), (.5, .45)), grade='bw' if arc.startswith('AI') else None)
    if arc.startswith('AI'): src(S(101), w('Islam', 437) - 0.6, 'Kassian Céphas, Jawa abad ke-19 · KITLV / Commons')
    sh.append(Venn(w('Islam', 437) - 0.6, None, {'a': w('Islam', 437), 'b': w('Hindu', 437), 'c': w('lokal', 437), 'satu': w('satu', 440)}, 'G24', tin=F))
    for word in ('Islam', 'Hindu', 'lokal'): cue('pop', w(word, 437), 0.35)
    kb(S(102) - 0.3, 'G45', z=(1.0, 1.08), c=((.5, .5), (.55, .5)))
    lt(w('lakon', 442.7), S(103) - 0.2, 'WAYANG', 'gaya Surakarta')
    kb(S(103) - 0.3, 'G15', z=(1.05, 1.12), c=((.5, .5), (.5, .45)))
    kb(w('diwariskan', 452) - 0.3, 'G14', z=(1.0, 1.06), c=((.4, .5), (.35, .5)))
    kb(w('panggung', 452) - 0.3, 'G50', z=(1.0, 1.06), c=((.5, .5), (.55, .5)))
    kb(w('obrolan', 452) - 0.3, 'G35', z=(1.05, 1.1), c=((.5, .5), (.5, .45)))
    kb(S(105) - 0.3, 'G26', z=(1.2, 1.28), c=((.3, .5), (.32, .5)))
    txt(w('bukan', 458.6), S(106) - 0.1, 'BUKAN UNTUK DICOCOKKAN', 960, 960, size=50, tracking=8, wght=800, color=CREAM)
    ov.append(Dim(S(105), S(106), 0.5, grad='bottom'))
    kb(S(106) - 0.3, 'G28', z=(1.05, 1.15), c=((.5, .5), (.5, .4)))
    txt(w('pesannya', 462), S(107) - 0.1, 'TAPI DIBACA PESANNYA', 960, 960, size=50, tracking=8, wght=800, color=GOLD)
    ov.append(Dim(S(106), S(107), 0.5, grad='bottom'))
    # mother & bridge
    kb(S(107) - 0.3, 'G06', z=(1.0, 1.08), c=((.5, .5), (.5, .5)), tin=FS)
    kb(w('Kamu', 468) - 0.3, 'G06', z=(1.3, 1.36), c=((.62, .25), (.62, .22)))
    kb(w('Apa', 472) - 0.3, 'G06', z=(1.25, 1.35), c=((.35, .35), (.3, .35)))
    txt(w('DNA', 472), S(108) + 0.4, 'TES DNA JEMBATAN?', 960, 960, size=58, tracking=8, wght=800, color=CREAM)
    ov.append(Dim(w('DNA', 472) - 0.3, S(108) + 0.5, 0.5, grad='bottom'))
    kb(S(109) - 0.3, 'G06', z=(1.45, 1.5), c=((.6, .3), (.62, .28)))
    cue('swab', w('ngeles', 476), 0.35)
    kb(S(111) - 0.3, 'G31', z=(1.04, 1.12), c=((.35, .5), (.3, .45)))
    txt(w('cermin', 481), 484.6, 'CERMIN,', 960, 880, size=64, tracking=12, wght=800, color=GOLD)
    txt(w('bukan', 481.5), 484.6, 'BUKAN AKTA KELAHIRAN', 960, 965, size=50, tracking=8, wght=700, color=CREAM)
    ov.append(Dim(S(111), 484.7, 0.55, grad='bottom'))

    # =============================== PENUTUP ======================================
    rc = [('G27', (0.2, 0.0, 0.8, 1.0), 'SILSILAH', 'dari Nabi Adam', S(112)),
          ('G18', (0.2, 0.0, 0.8, 1.0), 'PUTRI JIN', 'pernikahan', w('nikah', 484.6)),
          ('G25', (0.15, 0.0, 0.85, 1.0), 'SURAT SAKTI', 'buat raja', w('surat', 486)),
          ('G31', (0.0, 0.0, 0.7, 1.0), 'CARA BACA', 'mitos', w('cara', 488))]
    sh.append(Cards(S(112) - 0.3, None, rc, 'G05', ('4 FAKTA', S(112)), tin=('burn', 1.0), h=360, y=500, numbered=True))
    for r_ in rc: cue('photo', r_[4], 0.45)
    cue('filmburn', S(112) - 0.9, 0.35)
    kb(S(113) - 0.3, 'G49', z=(1.0, 1.08), c=((.5, .5), (.45, .5)))
    sh.append(Split(S(114) - 0.3, None, ('G38', 1.2, (0.5, 0.45)), ('G26', 1.1, (0.42, 0.5)),
                    [('SERAT PARAMAYOGA', 'iya', 480, w('Serat', 497.6), GOLD), ('LABORATORIUM', 'enggak', 1440, w('laboratorium', 500), CREAM)], tin=('slide', 0.7)))
    cue('whoosh', S(114) - 0.3, 0.4)
    kb(S(116) - 0.3, 'G36', z=(1.0, 1.08), c=((.5, .5), (.55, .5)))
    kb(S(117) - 0.3, 'G28', z=(1.1, 1.2), c=((.5, .5), (.5, .45)))
    for i, (word, lab) in enumerate((('sejarah', 'SEJARAH'), ('simbol', 'SIMBOL'), ('gaya-gayaan', 'GAYA-GAYAAN'))):
        txt(w(word, 507), S(118) - 0.1, lab, 520 + i * 440, 960, size=58, tracking=10, wght=800, color=[GOLD, CREAM, (230, 170, 150)][i])
        cue('pop', w(word, 507), 0.35)
    ov.append(Dim(S(117), S(118), 0.5, grad='bottom'))
    kb(S(118) - 0.3, 'G03', z=(1.02, 1.12), c=((.4, .5), (.35, .5)))
    ov.append(BookCard(S(118) + 1.0, S(119) - 0.2))
    cue('photo', S(118) + 1.0, 0.45)
    kb(S(119) - 0.3, 'G04', z=(1.0, 1.08), c=((.5, .5), (.45, .45)))
    lt(w('Aji', 524), S(120) - 0.2, 'AJI SAKA', 'kisah berikutnya?')
    kb(S(120) - 0.3, 'G50', z=(1.0, 1.06), c=((.5, .5), (.5, .45)))
    ov.append(LikeShare(w('like', 529.4), S(121) - 0.1, w('like', 529.4), w('share', 529.4)))
    kb(S(121) - 0.3, 'G38', z=(1.3, 1.4), c=((.36, .42), (.34, .4)))
    txt(w('keturunan', 534.5), S(122) - 0.1, 'NGAKU KETURUNAN RAJA', 960, 960, size=52, tracking=8, wght=800, color=GOLD)
    ov.append(Dim(S(121), S(122), 0.5, grad='bottom'))
    kb(S(122) - 0.3, 'G03', z=(1.0, 1.1), c=((.6, .55), (.62, .5)), tin=FS)
    txt(S(122) + 0.4, DURATION, 'MUSTOFA K004', 960, 520, size=64, tracking=24, wght=700, color=CREAM, glow=0.3, fi=1.0, fo=1.0)
    txt(S(122) + 1.0, DURATION, 'sampai jumpa di episode selanjutnya', 960, 600, fname='cormi', size=44, wght=600, color=GOLD, fi=1.0, fo=1.0)
    ov.append(Dim(S(122), DURATION, 0.45))

    # --- finalise shot times ---
    for s in sh:
        if s.t1 is None: s.t1 = s.t0 + 1
    sh.sort(key=lambda s: s.t0)
    for a, b in zip(sh, sh[1:]):
        assert b.t0 > a.t0 + 0.4, (a.t0, b.t0, type(a).__name__, getattr(a, 'img', ''), getattr(b, 'img', ''))
    # sort overlays so Dim layers draw first
    ov.sort(key=lambda o: 0 if isinstance(o, Dim) else 1)
    return sh, ov, cues

# ------------------------------------------------------------------ small overlay types used above
class TypeText(Overlay):
    def __init__(self, t0, t1, text, x, y):
        super().__init__(t0, t1); self.text, self.x, self.y = text, x, y
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.01, 0.5)
        n = int(clamp01((t - self.t0) / 1.4) * len(self.text))
        if n <= 0: return
        full = text_sprite(self.text, 'elite', 50, CREAM, 2, shadow=0.9)
        part = text_sprite(self.text[:n], 'elite', 50, CREAM, 2, shadow=0.9)
        blit(f, part, self.x - full.shape[1] / 2, self.y, a, 'lc')

class Counter(Overlay):
    def __init__(self, t0, t1, value, unit, x, y):
        super().__init__(t0, t1); self.v, self.unit, self.x, self.y = value, unit, x, y
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.3, 0.5)
        if a <= 0: return
        v = int(round(self.v * ease_out((t - self.t0) / 1.0)))
        blit(f, text_sprite(str(v), 'cinzel', 150, GOLD, 4, 900, shadow=0.9, glow=0.4), self.x, self.y, a, 'c')
        blit(f, text_sprite(self.unit, 'cinzel', 50, CREAM, 16, 700, shadow=0.9), self.x, self.y + 110, a, 'c')

class GenBadge(Overlay):
    def __init__(self, t0, t1, n, name):
        super().__init__(t0, t1); self.n, self.name = n, name
        self.lt = LowerThird(t0 + 0.2, t1, name, 'menikahi putri jin', x=330, y=900)
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.5, 0.5)
        if a <= 0: return
        self.lt.draw(f, t)
        q = ease_out((t - self.t0) / 0.6)
        blit(f, text_sprite(f'{self.n}', 'cinzel', 170, GOLD, 0, 900, shadow=0.9, glow=0.5), 190, 860, a, 'c', lerp(1.2, 1, q))
        blit(f, text_sprite('GENERASI', 'cinzel', 30, CREAM, 8, 700, shadow=0.9), 190, 975, a, 'c')

class Tag(Overlay):
    """labelled tag that drops in (paper label with pin)"""
    def __init__(self, t0, t1, text, x, y, ink=True):
        super().__init__(t0, t1); self.text, self.x, self.y, self.ink = text, x, y, ink
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.35, 0.4)
        if a <= 0: return
        q = ease_out((t - self.t0) / 0.4)
        ts = text_sprite(self.text, 'elite', 40, INK, 2, shadow=0)
        tw, th = ts.shape[1] + 44, ts.shape[0] + 26
        y = self.y - (1 - q) * 20
        m = new_mask()
        cv2.rectangle(m, (int(self.x - tw / 2), int(y - th / 2)), (int(self.x + tw / 2), int(y + th / 2)), 255, -1)
        sh = cv2.GaussianBlur(m, (0, 0), 8)
        fill_mask(f, np.roll(np.roll(sh, 8, 0), 6, 1), (0, 0, 0), a * 0.5)
        fill_mask(f, m, (236, 226, 200), a)
        blit(f, ts, self.x, y, a, 'c')
        m = new_mask(); cv2.circle(m, (int(self.x), int(y - th / 2)), 9, 255, -1, cv2.LINE_AA); fill_mask(f, m, RED, a)

class Lens(Overlay):
    """magnifying-glass ring sweeping over a manuscript"""
    def __init__(self, t0, t1):
        super().__init__(t0, t1)
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.5, 0.4)
        if a <= 0: return
        p = ease((t - self.t0) / max(0.1, self.t1 - self.t0))
        cx, cy, r = lerp(620, 1300, p), 430 + 60 * math.sin(p * 3), 170
        x0, y0, x1, y1 = int(cx - r), int(cy - r), int(cx + r), int(cy + r)
        roi = f[y0:y1, x0:x1].copy()
        big = cv2.resize(roi, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
        bh, bw = big.shape[:2]
        mag = big[(bh - roi.shape[0]) // 2:(bh - roi.shape[0]) // 2 + roi.shape[0], (bw - roi.shape[1]) // 2:(bw - roi.shape[1]) // 2 + roi.shape[1]]
        m = np.zeros(roi.shape[:2], np.uint8); cv2.circle(m, (r, r), r - 4, 255, -1, cv2.LINE_AA)
        mm = m.astype(np.float32)[..., None] / 255 * a
        f[y0:y1, x0:x1] = roi * (1 - mm) + (mag * 1.08) * mm
        m2 = new_mask(); cv2.circle(m2, (int(cx), int(cy)), r, 255, 10, cv2.LINE_AA)
        cv2.line(m2, (int(cx + r * 0.7), int(cy + r * 0.7)), (int(cx + r * 1.35), int(cy + r * 1.35)), 255, 26, cv2.LINE_AA)
        fill_mask(f, m2, (60, 40, 24), a)

class BookCard(Overlay):
    def __init__(self, t0, t1):
        super().__init__(t0, t1)
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.6, 0.5)
        if a <= 0: return
        q = ease_out((t - self.t0) / 0.7)
        x0, y0, x1, y1 = 120, 250 + int(30 * (1 - q)), 1000, 830 + int(30 * (1 - q))
        m = new_mask(); cv2.rectangle(m, (x0, y0), (x1, y1), 255, -1)
        fill_mask(f, cv2.GaussianBlur(np.roll(np.roll(m, 14, 0), 10, 1), (0, 0), 14), (0, 0, 0), a * 0.6)
        fill_mask(f, m, (30, 22, 14), a * 0.88)
        m = new_mask(); cv2.rectangle(m, (x0 + 14, y0 + 14), (x1 - 14, y1 - 14), 255, 2, cv2.LINE_AA); fill_mask(f, m, GOLD, a * 0.8)
        label(f, 'BACAAN LANJUTAN', (x0 + x1) / 2, y0 + 80, a, 34, GOLD, 'elite', None, 6)
        label(f, 'PARAMAYOGA', (x0 + x1) / 2, y0 + 200, a, 72, CREAM, 'cinzel', 800, 6)
        label(f, 'RONGGOWARSITO', (x0 + x1) / 2, y0 + 285, a, 46, CREAM, 'cinzel', 700, 8)
        label(f, 'Mitos Asal-usul Manusia Jawa', (x0 + x1) / 2, y0 + 380, a, 48, (236, 222, 196), 'cormi', 600, 0)
        label(f, 'terjemahan Otto Sukatno', (x0 + x1) / 2, y0 + 470, a, 40, GOLD, 'cormi', 600, 0)

class LikeShare(Overlay):
    def __init__(self, t0, t1, tl, ts):
        super().__init__(t0, t1); self.tl, self.ts = tl, ts
    def draw(self, f, t):
        for k, (txt, tt, x) in enumerate((('LIKE', self.tl, 760), ('SHARE', self.ts, 1160))):
            a = fade(t, tt, self.t1, 0.3, 0.4)
            if a <= 0: continue
            q = ease_out((t - tt) / 0.35)
            sc = lerp(0.7, 1.0, q) * (1 + 0.06 * math.sin(clamp01((t - tt) / 0.5) * math.pi))
            ts_ = text_sprite(txt, 'oswald', 64, (30, 20, 12), 8, 600, shadow=0)
            bw, bh = int((ts_.shape[1] + 120) * sc), int(110 * sc)
            m = new_mask()
            cv2.rectangle(m, (x - bw // 2 + bh // 2, 900 - bh // 2), (x + bw // 2 - bh // 2, 900 + bh // 2), 255, -1)
            cv2.circle(m, (x - bw // 2 + bh // 2, 900), bh // 2, 255, -1, cv2.LINE_AA)
            cv2.circle(m, (x + bw // 2 - bh // 2, 900), bh // 2, 255, -1, cv2.LINE_AA)
            fill_mask(f, m, GOLD, a)
            blit(f, ts_, x, 900, a, 'c', sc)
