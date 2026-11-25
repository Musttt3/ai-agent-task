# Motion-graphic shots built on engine primitives.
import json, math, functools, os
import numpy as np, cv2
from engine import *

# ------------------------------------------------------------------ maps
@functools.lru_cache(maxsize=2)
def land_polys(res):
    gj = json.load(open(os.path.join(ASSETS, 'geo', f'ne_{res}_land.geojson')))
    polys = []
    for ft in gj['features']:
        g = ft['geometry']
        rings = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for poly in rings:
            ext = np.array(poly[0], np.float64)
            polys.append(ext)
    return polys

MAP_SCALE = 1.3  # map plates rendered larger than frame so KB stays sharp

@functools.lru_cache(maxsize=6)
def map_plate(lon0, lon1, lat0, lat1, res='50m', tone='paper'):
    w, h = int(W * MAP_SCALE), int(H * MAP_SCALE)
    tex = paper_tex(21, 'cream', w + 10, h + 10)[:h, :w].astype(np.float32) / 255
    def proj(lon, lat):
        return ((lon - lon0) / (lon1 - lon0) * w, (lat1 - lat) / (lat1 - lat0) * h)
    land = np.zeros((h, w), np.uint8); coast = np.zeros((h, w), np.uint8)
    for ext in land_polys(res):
        if ext[:, 0].max() < lon0 - 5 or ext[:, 0].min() > lon1 + 5 or ext[:, 1].max() < lat0 - 5 or ext[:, 1].min() > lat1 + 5:
            continue
        x, y = proj(ext[:, 0], ext[:, 1])
        pts = np.round(np.stack([x, y], 1) * 4).astype(np.int32)
        cv2.fillPoly(land, [pts], 255, cv2.LINE_AA, shift=2)
        cv2.polylines(coast, [pts], True, 255, 2, cv2.LINE_AA, shift=2)
    # graticule
    grat = np.zeros((h, w), np.uint8)
    for lon in range(int(math.floor(lon0 / 10) * 10), int(lon1) + 10, 10):
        x, _ = proj(lon, 0); cv2.line(grat, (int(x), 0), (int(x), h), 255, 1, cv2.LINE_AA)
    for lat in range(int(math.floor(lat0 / 10) * 10), int(lat1) + 10, 10):
        _, y = proj(0, lat); cv2.line(grat, (0, int(y)), (w, int(y)), 255, 1, cv2.LINE_AA)
    lm = land.astype(np.float32)[..., None] / 255
    # sea slightly darker/greener, land lighter with hatch-like noise
    sea = tex * np.array([0.66, 0.69, 0.68], np.float32)
    lnd = tex * np.array([1.04, 0.98, 0.86], np.float32)
    img = sea * (1 - lm) + lnd * lm
    # coastal halo on sea (old map style)
    halo = cv2.GaussianBlur(land, (0, 0), 9).astype(np.float32) / 255
    img *= (1 - 0.18 * np.clip(halo - lm[..., 0], 0, 1))[..., None]
    g = grat.astype(np.float32)[..., None] / 255
    img = img * (1 - 0.12 * g) + np.array([0.35, 0.25, 0.15]) * 0.12 * g
    c = coast.astype(np.float32)[..., None] / 255
    img = img * (1 - 0.75 * c) + np.array([0.24, 0.16, 0.09]) * 0.75 * c
    return np.clip(img * 255, 0, 255).astype(np.uint8)

class MapShot(Shot):
    """bbox map with slow push; routes and labelled pulses drawn in screen space"""
    def __init__(self, t0, t1, bbox, routes=(), points=(), z=(1.0, 1.06), c=((.5, .5), (.5, .5)), res='50m', tin=None, sfx=None, title=None):
        super().__init__(t0, t1, tin, sfx)
        self.bbox, self.routes, self.points, self.z, self.c, self.res, self.title = bbox, routes, points, z, c, res, title
    def render(self, t, weave):
        lon0, lon1, lat0, lat1 = self.bbox
        plate = map_plate(lon0, lon1, lat0, lat1, self.res)
        ph, pw = plate.shape[:2]
        p = ease(self.p(t))
        z = lerp(*self.z, p); c = lerp2(self.c[0], self.c[1], p)
        f = to_f(kb_warp(plate, z, c, 0, weave))
        s = max(W / pw, H / ph) * z
        hw, hh = W / (2 * s), H / (2 * s)
        cx = min(max(c[0] * pw, hw), pw - hw); cy = min(max(c[1] * ph, hh), ph - hh)
        def P(lon, lat):
            x = (lon - lon0) / (lon1 - lon0) * pw; y = (lat1 - lat) / (lat1 - lat0) * ph
            return (W / 2 + (x - cx) * s + weave[0], H / 2 + (y - cy) * s + weave[1])
        # routes
        for r in self.routes:
            pts_ll, ts, dur = r['pts'], r['t'], r.get('dur', 1.5)
            if t < ts: continue
            q = ease((t - ts) / dur)
            pts = np.array([P(*ll) for ll in pts_ll], np.float64)
            # densify with catmull-ish smoothing
            dense = []
            for i in range(len(pts) - 1):
                for k in range(20): dense.append(pts[i] + (pts[i + 1] - pts[i]) * k / 20)
            dense.append(pts[-1]); dense = np.array(dense)
            if len(pts) > 2:
                dense = cv2.GaussianBlur(dense.reshape(-1, 1, 2).astype(np.float32), (1, 21), 0).reshape(-1, 2) if False else dense
            k = max(2, int(len(dense) * q))
            m = new_mask(); col = r.get('color', RED)
            seg = dense[:k]
            if r.get('dashed', True):
                for i in range(0, k - 1, 6):
                    s2 = seg[i:i + 4]
                    if len(s2) > 1: cv2.polylines(m, [np.round(s2 * 4).astype(np.int32)], False, 255, r.get('w', 6), cv2.LINE_AA, shift=2)
            else:
                cv2.polylines(m, [np.round(seg * 4).astype(np.int32)], False, 255, r.get('w', 6), cv2.LINE_AA, shift=2)
            if q > 0.97 and r.get('head', True):
                tip = seg[-1]; d = seg[-1] - seg[-6]; d = d / (np.linalg.norm(d) + 1e-6); n = np.array([-d[1], d[0]])
                hd = 28
                tri = np.array([tip + d * 8, tip - d * hd + n * hd * 0.55, tip - d * hd - n * hd * 0.55])
                cv2.fillPoly(m, [np.round(tri * 4).astype(np.int32)], 255, cv2.LINE_AA, shift=2)
            fill_mask(f, m, col, 0.92 * fade(t, ts, 1e9, 0.2, 0))
        # points
        for pt in self.points:
            lon, lat, label, ts = pt['lon'], pt['lat'], pt.get('label'), pt['t']
            if t < ts: continue
            x, y = P(lon, lat)
            q = ease_out((t - ts) / 0.5)
            m = new_mask()
            rr = 12 * q
            cv2.circle(m, (int(x * 4), int(y * 4)), int(rr * 4), 255, -1, cv2.LINE_AA, shift=2)
            col = pt.get('color', RED)
            fill_mask(f, m, col, 0.95)
            # pulse rings
            ph_ = ((t - ts) % 1.6) / 1.6
            m2 = new_mask()
            cv2.circle(m2, (int(x * 4), int(y * 4)), int((14 + 46 * ph_) * 4), 255, 3, cv2.LINE_AA, shift=2)
            fill_mask(f, m2, col, 0.8 * (1 - ph_) * q)
            if label:
                spr = text_sprite(label, pt.get('font', 'cinzel'), pt.get('size', 44), pt.get('tcolor', INK), 4, 700, shadow=0.0)
                dx, dy = pt.get('off', (0, -52))
                blit(f, spr, x + dx, y + dy + (1 - q) * 10, q, pt.get('anchor', 'c'))
        if self.title:
            txt, ts = self.title
            blit(f, text_sprite(txt, 'elite', 40, INK, 3, shadow=0), 90, 90, fade(t, ts, self.t1 + 1, 0.6, 0.1), 'lt')
        return f

# ------------------------------------------------------------------ generic node helpers
def node(f, spr, x, y, a, sc=1.0):
    blit(f, spr, x, y, a, 'c', sc)

def label(f, text, x, y, a, size=34, color=CREAM, fname='cinzel', wght=700, tracking=3, anchor='c', shadow=0.8):
    if a <= 0: return
    blit(f, text_sprite(text, fname, size, color, tracking, wght, shadow=shadow), x, y, a, anchor)

def line(f, p0, p1, q, color=GOLD, w=4, a=1.0, dashed=False):
    if q <= 0 or a <= 0: return
    p0 = np.array(p0, np.float64); p1 = np.array(p1, np.float64)
    pe = p0 + (p1 - p0) * clamp01(q)
    m = new_mask()
    if dashed:
        L = np.linalg.norm(pe - p0); n = int(L // 22) + 1
        for i in range(n):
            a0 = p0 + (pe - p0) * (i / n); a1 = p0 + (pe - p0) * min(1, (i + 0.55) / n)
            cv2.line(m, tuple(np.round(a0 * 4).astype(int)), tuple(np.round(a1 * 4).astype(int)), 255, w, cv2.LINE_AA, shift=2)
    else:
        cv2.line(m, tuple(np.round(p0 * 4).astype(int)), tuple(np.round(pe * 4).astype(int)), 255, w, cv2.LINE_AA, shift=2)
    x0, y0 = np.minimum(p0, pe) - 10; x1, y1 = np.maximum(p0, pe) + 10
    fill_mask(f, m, color, a, roi=(max(0, int(x0)), max(0, int(y0)), min(W, int(x1)), min(H, int(y1))))

def appear(t, ts, d=0.5): return ease_out((t - ts) / d) if t >= ts else 0.0

# ------------------------------------------------------------------ genealogy A: Adam -> Sis -> Anwas / Anwar
class GenealogyA(Shot):
    def __init__(self, t0, t1, tm, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.tm = tm
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('soft', 'G47', t, weave, p) * 0.8
        tm = self.tm
        ox, oy = weave
        P = {'adam': (960 + ox, 190 + oy), 'sis': (960 + ox, 450 + oy), 'anwas': (600 + ox, 730 + oy), 'anwar': (1320 + ox, 730 + oy),
             'nabi': (600 + ox, 960 + oy)}
        R = 78
        light = circle_portrait('G27', 0.5, 0.5, 0.5, R, GOLD, light=True)
        # edges
        line(f, (P['adam'][0], P['adam'][1] + R), (P['sis'][0], P['sis'][1] - R), (t - tm['sis']) / 0.5, GOLD, 4, 0.9)
        for k in ('anwas', 'anwar'):
            q = (t - tm[k]) / 0.6
            mid = (P['sis'][0], P['sis'][1] + R + 50)
            line(f, (P['sis'][0], P['sis'][1] + R), mid, q * 2, GOLD, 4, 0.9)
            line(f, mid, (P[k][0], mid[1]), q * 2 - 0.5, GOLD, 4, 0.9)
            line(f, (P[k][0], mid[1]), (P[k][0], P[k][1] - R), q * 2 - 1, GOLD, 4, 0.9)
        a = appear(t, tm['adam']); node(f, light, *P['adam'], a, lerp(0.8, 1, a)); label(f, 'NABI ADAM', P['adam'][0] + 120, P['adam'][1], a, 40, CREAM, anchor='lc')
        a = appear(t, tm['sis']); node(f, light, *P['sis'], a, lerp(0.8, 1, a)); label(f, 'NABI SIS', P['sis'][0] + 120, P['sis'][1], a, 40, CREAM, anchor='lc')
        a = appear(t, tm['anwas']); node(f, light, *P['anwas'], a, lerp(0.8, 1, a)); label(f, 'SAID ANWAS', P['anwas'][0] - 120, P['anwas'][1], a, 40, CREAM, anchor='rc')
        a = appear(t, tm['anwar'])
        anw = circle_portrait('G38', 0.36, 0.38, 0.5, R, GOLD)
        node(f, anw, *P['anwar'], a, lerp(0.8, 1, a)); label(f, 'SAID ANWAR', P['anwar'][0] + 120, P['anwar'][1], a, 40, CREAM, anchor='lc')
        if t >= tm['nabi']:
            q = (t - tm['nabi']) / 0.6
            line(f, (P['anwas'][0], P['anwas'][1] + R), (P['nabi'][0], P['nabi'][1] - 40), q, (250, 246, 235), 4, 0.9, dashed=True)
            blit(f, text_sprite('PARA NABI', 'cinzel', 40, (252, 248, 238), 4, 700, shadow=0.6, glow=0.6, glow_color=(255, 250, 230)),
                 P['nabi'][0], P['nabi'][1], appear(t, tm['nabi'] + 0.4), 'c')
        if t >= tm['beda']:
            q = ease_out((t - tm['beda']) / 0.5)
            m = new_mask()
            pulse = 1 + 0.06 * math.sin((t - tm['beda']) * 5)
            cv2.circle(m, (int(P['anwar'][0] * 4), int(P['anwar'][1] * 4)), int((R + 18) * pulse * 4), 255, 7, cv2.LINE_AA, shift=2)
            fill_mask(f, m, RED, 0.9 * q)
            label(f, 'BEDA SENDIRI', P['anwar'][0], P['anwar'][1] + R + 70, appear(t, tm['beda'] + 0.25), 36, (240, 120, 100), 'elite', None, 3)
        return f

# ------------------------------------------------------------------ genealogy B: human x jinn generations
GEN_B = [  # top (human/dewa) crop, bottom (jinn bride) crop, names
    (('G22', 0.50, 0.28, 0.30), ('G18', 0.50, 0.36, 0.42), 'NUR CAHYA', 'DEWI NURINI'),
    (('G29', 0.43, 0.25, 0.20), ('G29', 0.585, 0.29, 0.20), 'NUR RASA', 'PUTRI JIN'),
    (('G12', 0.43, 0.30, 0.22), ('G12', 0.585, 0.31, 0.22), 'WENANG', 'PUTRI JIN'),
    (('G11', 0.48, 0.36, 0.34), ('G11', 0.72, 0.30, 0.30), 'TUNGGAL', 'PUTRI JIN'),
]
class GenealogyB(Shot):
    """timing dict: 'gen': [t per generation], 'guru': t, 'legend': t"""
    def __init__(self, t0, t1, tm, tin=None, sfx=None, upto=None):
        super().__init__(t0, t1, tin, sfx); self.tm = tm
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('soft', 'G40', t, weave, p) * 0.75
        ox, oy = weave
        xs = [250, 610, 970, 1330]; yt, yb = 400 + oy, 700 + oy; R = 70
        tm = self.tm
        for i, (top, bot, n1, n2) in enumerate(GEN_B):
            ts = tm['gen'][i]
            if t < ts: continue
            x = xs[i] + ox
            a = appear(t, ts)
            # marriage link
            line(f, (x, yt + R), (x, yb - R), (t - ts - 0.2) / 0.4, (230, 230, 236), 3, 0.8, dashed=True)
            if t > ts + 0.35:
                blit(f, text_sprite('×', 'corm', 54, (240, 236, 230), 0, 600, shadow=0.6), x + 34, (yt + yb) / 2, appear(t, ts + 0.35), 'c')
            node(f, circle_portrait(top[0], top[1], top[2], top[3], R, GOLD), x, yt, a, lerp(0.85, 1, a))
            ab = appear(t, ts + 0.3)
            node(f, circle_portrait(bot[0], bot[1], bot[2], bot[3], R, (210, 220, 232), ghost=True), x, yb, ab, lerp(0.85, 1, ab))
            label(f, n1, x, yt - R - 34, a, 30, GOLD)
            label(f, n2, x, yb + R + 32, ab, 28, (222, 228, 236))
            # arrow to next generation
            if i < 3:
                tn = tm['gen'][i + 1]
                q = (t - (tn - 0.5)) / 0.5
                line(f, (x + R + 10, (yt + yb) / 2), (xs[i + 1] + ox - R - 10, yt + 10), q, GOLD, 4, 0.9)
        if t >= tm['guru']:
            x = 1690 + ox; y = (yt + yb) / 2
            line(f, (xs[3] + ox + R + 10, (yt + yb) / 2), (x - 95, y), (t - tm['guru']) / 0.5, GOLD, 5, 0.95)
            a = appear(t, tm['guru'] + 0.3, 0.6)
            node(f, circle_portrait('G02', 0.63, 0.30, 0.34, 92, (250, 210, 120)), x, y, a, lerp(0.8, 1, a))
            label(f, 'BATARA GURU', x, y + 130, a, 34, GOLD)
            label(f, 'RAJA PARA DEWA', x, y + 172, a * 0.9, 26, CREAM, 'elite', None, 2)
        if 'legend' in tm and t >= tm['legend']:
            a = appear(t, tm['legend'], 0.7)
            label(f, 'DARAH CAMPURAN', 960 + ox, 150 + oy, a, 50, CREAM, tracking=10)
            m = new_mask(); cv2.line(m, (700, int(196 + oy)), (1220, int(196 + oy)), 255, 2, cv2.LINE_AA)
            fill_mask(f, m, GOLD, a * 0.8)
            label(f, 'MANUSIA', 800 + ox, 935 + oy, a, 34, GOLD)
            label(f, '+', 960 + ox, 935 + oy, a, 40, CREAM, 'corm', 600, 0)
            label(f, 'JIN', 1100 + ox, 935 + oy, a, 34, (222, 228, 236))
        return f

# ------------------------------------------------------------------ timelines (paper)
class TimelineMajapahit(Shot):
    def __init__(self, t0, t1, tm, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.tm = tm
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('paper', None, t, weave, p)
        ox, oy = weave; y = 600 + oy
        label(f, 'KAPAN DITULIS?', 960 + ox, 170 + oy, appear(t, self.t0 + 0.1, 0.6), 64, INK, tracking=10, shadow=0)
        line(f, (120 + ox, y), (1800 + ox, y), (t - self.t0 + 0.3) / 0.9, INK, 5, 0.85)
        for k in range(9):
            x = 120 + k * 210 + ox
            if t > self.t0 + k * 0.08:
                line(f, (x, y - 18), (x, y + 18), 1, INK, 4, 0.7)
        a = appear(t, self.t0 + 0.2)
        m = new_mask(); cv2.rectangle(m, (int(260 + ox), int(y - 190)), (int(860 + ox), int(y - 40)), 255, -1)
        fill_mask(f, m, (150, 110, 60), 0.35 * a)
        label(f, 'MAJAPAHIT', 560 + ox, y - 115, a, 72, INK, shadow=0, tracking=6)
        label(f, 'daun lontar, kitab kuno?', 560 + ox, y + 90, a * 0.9, 50, (90, 60, 35), 'cormi', 600, 0, shadow=0)
        if t >= self.tm['x']:
            q = ease_out((t - self.tm['x']) / 0.35)
            line(f, (280 + ox, y - 200), (840 + ox, y - 30), q, RED, 10, 0.9)
            line(f, (840 + ox, y - 200), (280 + ox, y - 30), q, RED, 10, 0.9)
        if t >= self.tm['abad']:
            a = appear(t, self.tm['abad'], 0.6)
            m = new_mask(); cv2.rectangle(m, (int(1330 + ox), int(y - 190)), (int(1790 + ox), int(y - 40)), 255, -1)
            fill_mask(f, m, (200, 150, 40), 0.45 * a)
            label(f, 'ABAD KE-19', 1560 + ox, y - 115, a, 66, INK, shadow=0, tracking=4)
            label(f, 'PARAMAYOGA', 1560 + ox, y + 95, a, 60, RED, 'cinzel', 700, 4, shadow=0)
            line(f, (880 + ox, y - 115), (1310 + ox, y - 115), (t - self.tm['abad']) / 0.9, RED, 5, 0.75, dashed=True)
        return f

class TimelineAges(Shot):
    """ZAMAN NABI ADAM ---- ribuan tahun ----> DITULIS ABAD KE-19"""
    def __init__(self, t0, t1, tm, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.tm = tm
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('paper', None, t, weave, p)
        ox, oy = weave; y = 520 + oy
        a = appear(t, self.tm['cerita'])
        node(f, circle_portrait('G27', 0.5, 0.5, 0.5, 90, (120, 80, 40), light=True), 330 + ox, y, a, lerp(0.85, 1, a))
        label(f, 'CERITANYA', 330 + ox, y + 160, a, 58, INK, shadow=0, tracking=6)
        label(f, 'zaman Nabi Adam', 330 + ox, y + 225, a, 50, (90, 60, 35), 'cormi', 600, 0, shadow=0)
        if t >= self.tm['tulis']:
            q = (t - self.tm['tulis']) / 1.6
            line(f, (460 + ox, y), (1440 + ox, y), q, RED, 5, 0.85, dashed=True)
            if q > 1:
                tri = np.array([[1470 + ox, y], [1436 + ox, y - 18], [1436 + ox, y + 18]])
                m = new_mask(); cv2.fillPoly(m, [np.round(tri * 4).astype(np.int32)], 255, cv2.LINE_AA, shift=2); fill_mask(f, m, RED, 0.85)
            label(f, 'RIBUAN TAHUN', 950 + ox, y - 60, appear(t, self.tm['tulis'] + 0.6), 58, RED, 'elite', None, 4, shadow=0)
            a2 = appear(t, self.tm['tulis'] + 1.2, 0.6)
            card = card_rgba(load_raw('AI02_sandi-paramayoga.jpg'), 300)
            q4 = project_quad(card.shape[1], card.shape[0], 1600 + ox, y, lerp(0.9, 1, a2), -8, 2, 3)
            if a2 > 0: draw_card(f, card, q4, 0.5, a2)
            label(f, 'KITABNYA', 1600 + ox, y + 220, a2, 58, INK, shadow=0, tracking=6)
            label(f, 'abad ke-19', 1600 + ox, y + 285, a2, 50, (90, 60, 35), 'cormi', 600, 0, shadow=0)
        return f

# ------------------------------------------------------------------ case board with red string
class CaseBoard(Shot):
    def __init__(self, t0, t1, cards, tin=None, sfx=None):
        """cards: list of (img, label, (x,y), t, angle, crop)"""
        super().__init__(t0, t1, tin, sfx); self.cards = cards; self._c = {}
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('board', None, t, weave, p)
        sc = lerp(1.0, 1.05, p)
        ox, oy = weave
        def S(x, y): return ((x - 960) * sc + 960 + ox, (y - 540) * sc + 540 + oy)
        # cards
        for k, (img, lab, (x, y), ts, ang, crop) in enumerate(self.cards):
            if t < ts: continue
            if k not in self._c:
                im = load_raw(img)
                if crop:
                    ih, iw = im.shape[:2]; im = im[int(crop[1] * ih):int(crop[3] * ih), int(crop[0] * iw):int(crop[2] * iw)]
                ih, iw = im.shape[:2]
                self._c[k] = card_rgba(im, min(330, 400 * ih / iw), 0.06)
            c = self._c[k]
            ch2 = c.shape[0] / 2
            a = appear(t, ts, 0.45)
            cx, cy = S(x, y - 30 * (1 - a))
            q = project_quad(c.shape[1], c.shape[0], cx, cy, sc * lerp(1.1, 1.0, a), 0, 0, ang)
            draw_card(f, c, q, 0.65, a)
            # pin
            m = new_mask(); px, py = S(x, y - ch2 + 14)
            cv2.circle(m, (int(px * 4), int(py * 4)), 44, 255, -1, cv2.LINE_AA, shift=2)
            fill_mask(f, m, (180, 30, 25), a)
            # tag
            tag = text_sprite(lab, 'elite', 34, INK, 2, shadow=0)
            tw = tag.shape[1] + 30
            m = new_mask(); lx, ly = S(x, y + ch2 + 50)
            cv2.rectangle(m, (int(lx - tw / 2), int(ly - 26)), (int(lx + tw / 2), int(ly + 26)), 255, -1)
            fill_mask(f, m, (236, 226, 200), a)
            blit(f, tag, lx, ly, a, 'c')
        # strings
        for k in range(1, len(self.cards)):
            ts = self.cards[k][3]
            if t < ts + 0.2: continue
            q = (t - ts - 0.2) / 0.5
            if k - 1 not in self._c or k not in self._c: continue
            a0 = S(self.cards[k - 1][2][0], self.cards[k - 1][2][1] - self._c[k - 1].shape[0] / 2 + 14)
            a1 = S(self.cards[k][2][0], self.cards[k][2][1] - self._c[k].shape[0] / 2 + 14)
            line(f, a0, a1, q, (200, 34, 28), 4, 0.95)
        return f

# ------------------------------------------------------------------ checklist
class Checklist(Shot):
    def __init__(self, t0, t1, items, bg_img, final=None, tin=None, sfx=None):
        """items: list of (img, crop(cx,cy,zh), text, t_show, t_tick)"""
        super().__init__(t0, t1, tin, sfx); self.items, self.bg_img, self.final = items, bg_img, final
    def render(self, t, weave):
        p = ease(self.p(t))
        f = to_f(kb_warp(load_img(self.bg_img), lerp(1.1, 1.18, p), (0.5, 0.45), 0, weave))
        f = cv2.GaussianBlur(f, (0, 0), 7) * 0.42
        ox, oy = weave
        # paper sheet
        sx0, sy0, sx1, sy1 = 360 + ox, 150 + oy, 1180 + ox, 930 + oy
        a = appear(t, self.t0, 0.6)
        sheet = paper_tex(3, 'cream')[0:int(sy1 - sy0), 0:int(sx1 - sx0)]
        q = project_quad(sheet.shape[1], sheet.shape[0], (sx0 + sx1) / 2, (sy0 + sy1) / 2, 1.0, 0, 0, -1.5)
        draw_card(f, sheet, q, 0.6, a)
        label(f, 'SILSILAH RAJA', (sx0 + sx1) / 2, sy0 + 85, a, 46, INK, shadow=0, tracking=6)
        m = new_mask(); cv2.line(m, (int(sx0 + 120), int(sy0 + 130)), (int(sx1 - 120), int(sy0 + 130)), 255, 2, cv2.LINE_AA); fill_mask(f, m, INK, a * 0.6)
        for i, (img, cr, text, ts, tt) in enumerate(self.items):
            y = sy0 + 250 + i * 190
            ai = appear(t, ts)
            node(f, circle_portrait(img, cr[0], cr[1], cr[2], 62, (120, 80, 40), light=(img == 'LIGHT')) if img != 'LIGHT' else circle_portrait('G27', .5, .5, .5, 62, (120, 80, 40), light=True), sx0 + 120, y, ai)
            label(f, text, sx0 + 220, y, ai, 44, INK, anchor='lc', shadow=0)
            # box
            bx = sx1 - 150
            m = new_mask(); cv2.rectangle(m, (int(bx - 34), int(y - 34)), (int(bx + 34), int(y + 34)), 255, 4, cv2.LINE_AA)
            fill_mask(f, m, INK, ai * 0.8)
            if t >= tt:
                qq = ease_out((t - tt) / 0.3)
                pts = np.array([[bx - 26, y - 2], [bx - 6, y + 22], [bx + 40, y - 44]])
                L1 = clamp01(qq * 2); L2 = clamp01(qq * 2 - 1)
                m = new_mask()
                e1 = pts[0] + (pts[1] - pts[0]) * L1
                cv2.line(m, tuple((pts[0] * 4).astype(int)), tuple((e1 * 4).astype(int)), 255, 10, cv2.LINE_AA, shift=2)
                if L2 > 0:
                    e2 = pts[1] + (pts[2] - pts[1]) * L2
                    cv2.line(m, tuple((pts[1] * 4).astype(int)), tuple((e2 * 4).astype(int)), 255, 10, cv2.LINE_AA, shift=2)
                fill_mask(f, m, RED, 0.95)
        if self.final and t >= self.final[1]:
            a = appear(t, self.final[1], 0.6)
            label(f, self.final[0][0], 1500 + ox, 470 + oy, a, 60, GOLD, tracking=6)
            label(f, self.final[0][1], 1500 + ox, 560 + oy, appear(t, self.final[1] + 0.5, 0.6), 40, CREAM, 'cormi', 600, 0)
        return f

# ------------------------------------------------------------------ venn
class Venn(Shot):
    def __init__(self, t0, t1, tm, bg_img, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.tm, self.bg_img = tm, bg_img
    def render(self, t, weave):
        p = ease(self.p(t))
        f = to_f(kb_warp(load_img(self.bg_img), lerp(1.05, 1.12, p), (0.5, 0.5), 0, weave))
        f = cv2.GaussianBlur(f, (0, 0), 8) * 0.35
        ox, oy = weave
        C = [((960 - 170 + ox, 470 + oy), 'ISLAM', 'a'), ((960 + 170 + ox, 470 + oy), 'HINDU', 'b'), ((960 + ox, 720 + oy), 'LOKAL', 'c')]
        cols = [(230, 210, 160), (230, 170, 110), (200, 220, 230)]
        for (c, txt, k), col in zip(C, cols):
            if t < self.tm[k]: continue
            q = ease_out((t - self.tm[k]) / 0.6)
            m = new_mask(); cv2.circle(m, (int(c[0] * 4), int(c[1] * 4)), int(260 * q * 4), 255, -1, cv2.LINE_AA, shift=2)
            fill_mask(f, m, col, 0.16)
            m = new_mask(); cv2.circle(m, (int(c[0] * 4), int(c[1] * 4)), int(260 * q * 4), 255, 4, cv2.LINE_AA, shift=2)
            fill_mask(f, m, col, 0.85)
            dx = {'a': -120, 'b': 120, 'c': 0}[k]; dy = {'a': -70, 'b': -70, 'c': 110}[k]
            label(f, txt, c[0] + dx, c[1] + dy, appear(t, self.tm[k] + 0.2), 44, col)
        if t >= self.tm['satu']:
            a = appear(t, self.tm['satu'], 0.7)
            m = new_mask(); cv2.circle(m, (int((960 + ox) * 4), int((560 + oy) * 4)), int(70 * 4), 255, -1, cv2.LINE_AA, shift=2)
            m = cv2.GaussianBlur(m, (0, 0), 20)
            fill_mask(f, m, (255, 220, 140), a * 0.9)
            label(f, 'SATU CERITA', 960 + ox, 1000 + oy, a, 46, GOLD, tracking=8)
        return f

# ------------------------------------------------------------------ versus
class Versus(Shot):
    def __init__(self, t0, t1, left, right, tvs, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.left, self.right, self.tvs = left, right, tvs
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = (xx - (W / 2 + (yy - H / 2) * 0.28))
        self.mask = np.clip(d / 3 + 0.5, 0, 1)[..., None]
        self.edge = np.exp(-(d / 6) ** 2)[..., None]
    def render(self, t, weave):
        p = ease(self.p(t))
        (li, lz, lc), (ri, rz, rc) = self.left, self.right
        q = ease_out((t - self.t0) / 0.6)
        L = to_f(kb_warp(load_img(li), lerp(lz, lz * 1.06, p), (lc[0] + 0.06 * (1 - q), lc[1]), 0, weave))
        R = to_f(kb_warp(load_img(ri), lerp(rz, rz * 1.06, p), (rc[0] - 0.06 * (1 - q), rc[1]), 0, weave))
        f = L * (1 - self.mask) + R * self.mask
        f += self.edge * np.array([1.0, 0.8, 0.45], np.float32) * 1.2
        if t >= self.tvs:
            k = (t - self.tvs) / 0.25
            sc = lerp(1.8, 1.0, ease_out(k)) if k < 1 else 1.0 + 0.015 * math.sin((t - self.tvs) * 3)
            blit(f, text_sprite('VS', 'cinzel', 190, (255, 236, 190), 6, 900, shadow=0.9, glow=0.9, glow_color=(255, 150, 60)), W / 2 + weave[0], H / 2 + weave[1], clamp01(k * 2), 'c', sc)
            if k < 1.5: f += (1 - clamp01(k / 1.5)) * 0.5
        label(f, 'MANUSIA', 330, 930, appear(t, self.t0 + 0.3), 52, CREAM, tracking=8)
        label(f, 'RAJA JIN', 1590, 930, appear(t, self.t0 + 0.5), 52, CREAM, tracking=8)
        return f

# ------------------------------------------------------------------ CRT TV (sinetron joke)
class CRT(Shot):
    def __init__(self, t0, t1, img, tzoom, tin=None, sfx=None, c=(0.5, 0.3)):
        super().__init__(t0, t1, tin, sfx); self.img, self.tzoom, self.c = img, tzoom, c
        sw, sh = 1180, 830
        yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
        r = np.hypot((xx - sw / 2) / (sw / 2), (yy - sh / 2) / (sh / 2))
        self.vig = (1 - 0.55 * np.clip(r - 0.6, 0, 1) ** 1.5)[..., None]
        self.scan = (0.86 + 0.14 * (np.sin(yy * math.pi / 2.0) ** 2))[..., None]
        m = np.zeros((sh, sw), np.uint8)
        cv2.rectangle(m, (40, 40), (sw - 40, sh - 40), 255, -1); m = cv2.GaussianBlur(m, (0, 0), 18)
        self.round = (m.astype(np.float32) / 255)[..., None]
        self.sw, self.sh = sw, sh
    def render(self, t, weave):
        p = ease(self.p(t))
        f = background('dark', None, t, weave, p) * 0.55
        # TV body
        ox, oy = int(weave[0]), int(weave[1])
        bx0, by0, bx1, by1 = 300 + ox, 80 + oy, 1620 + ox, 1010 + oy
        m = new_mask(); cv2.rectangle(m, (bx0, by0), (bx1, by1), 255, -1)
        m = cv2.GaussianBlur(m, (0, 0), 3)
        fill_mask(f, m, (46, 32, 22), 1.0)
        m = new_mask(); cv2.rectangle(m, (bx0 + 8, by0 + 8), (bx1 - 8, by1 - 8), 255, 3, cv2.LINE_AA); fill_mask(f, m, (110, 80, 50), 0.6)
        # screen content
        z = 1.0
        if t > self.tzoom: z = lerp(1.0, 1.35, ease_out((t - self.tzoom) / 0.35))
        scr = to_f(kb_warp(load_img(self.img), z * lerp(1.0, 1.04, p), self.c, 0, (0, 0), out_size=(self.sw, self.sh)))
        # tv-on effect
        k = (t - self.t0) / 0.35
        if k < 1:
            band = np.zeros_like(scr); hh = int(self.sh * ease_out(k) / 2)
            band[self.sh // 2 - hh:self.sh // 2 + hh + 2] = 1
            scr = scr * band + (1 - band) * 0.02
            scr += (1 - k) * 0.6 * band
        # chroma shift + scanlines + bulge-ish vignette
        scr[..., 0] = np.roll(scr[..., 0], 2, 1); scr[..., 2] = np.roll(scr[..., 2], -2, 1)
        scr = scr * self.scan * self.vig
        scr = scr * self.round + (1 - self.round) * 0.03
        sx, sy = (W - self.sw) // 2 + ox - 40, 130 + oy
        f[sy:sy + self.sh, sx:sx + self.sw] = scr
        # knobs
        for i, ky in enumerate((330, 520)):
            m = new_mask(); cv2.circle(m, (bx1 - 75, ky + oy), 30, 255, -1, cv2.LINE_AA); fill_mask(f, m, (150, 120, 80), 0.9)
        return f

# ------------------------------------------------------------------ split screen
class Split(Shot):
    def __init__(self, t0, t1, left, right, labels=(), tin=None, sfx=None, divider=GOLD):
        """left/right: (img, z, c) or callable(t,weave,size)->float"""
        super().__init__(t0, t1, tin, sfx); self.left, self.right, self.labels, self.divider = left, right, labels, divider
    def render(self, t, weave):
        p = ease(self.p(t))
        hw = W // 2
        out = np.empty((H, W, 3), np.float32)
        for k, spec in enumerate((self.left, self.right)):
            img, z, c = spec[:3]
            grade = spec[3] if len(spec) > 3 else None
            q = ease_out((t - self.t0 - 0.15 * k) / 0.7)
            sub = to_f(kb_warp(load_img(img), lerp(z, z * 1.06, p), c, 0, weave, out_size=(hw, H)))
            if grade == 'dim': sub *= 0.8
            out[:, k * hw:(k + 1) * hw] = sub * (0.25 + 0.75 * q)
        m = new_mask(); cv2.line(m, (hw, 0), (hw, H), 255, 4, cv2.LINE_AA); fill_mask(out, m, self.divider, 0.9)
        for (txt, sub, x, ts, col) in self.labels:
            a = appear(t, ts)
            if a <= 0: continue
            Dg = np.zeros(1)
            label(out, txt, x, 860, a, 54, col, tracking=6)
            if sub: label(out, sub, x, 935, appear(t, ts + 0.3), 40, CREAM, 'cormi', 600, 0)
        return out

# ------------------------------------------------------------------ triptych of myth cards
class Cards(Shot):
    """row of cards appearing over blurred background. cards: (img, crop, label, sub, t)"""
    def __init__(self, t0, t1, cards, bg_img, title=None, tin=None, sfx=None, h=400, y=480, numbered=False):
        super().__init__(t0, t1, tin, sfx); self.cards, self.bg_img, self.title, self.h, self.y, self.numbered = cards, bg_img, title, h, y, numbered
        self._c = {}
    def render(self, t, weave):
        p = ease(self.p(t))
        f = to_f(kb_warp(load_img(self.bg_img), lerp(1.1, 1.16, p), (0.5, 0.5), 0, weave))
        f = cv2.GaussianBlur(f, (0, 0), 9) * 0.32
        n = len(self.cards); gap = W / (n + 0.0)
        for k, (img, crop, lab, sub, ts) in enumerate(self.cards):
            if t < ts: continue
            if k not in self._c:
                im = load_raw(img); ih, iw = im.shape[:2]
                if crop: im = im[int(crop[1] * ih):int(crop[3] * ih), int(crop[0] * iw):int(crop[2] * iw)]
                ih, iw = im.shape[:2]
                maxw = W / n - 90
                self._c[k] = card_rgba(im, min(self.h, maxw * ih / iw), 0.04)
            c = self._c[k]
            a = appear(t, ts, 0.55)
            cx = gap * (k + 0.5) + weave[0]; cy = self.y + weave[1] + 40 * (1 - a)
            q = project_quad(c.shape[1], c.shape[0], cx, cy, lerp(0.92, 1.0, a) * lerp(1.0, 1.03, p), lerp(8, -4, p) * (k - (n - 1) / 2) / max(1, n - 1), 0, (k - (n - 1) / 2) * 1.5)
            draw_card(f, c, q, 0.6, a)
            ly = cy + c.shape[0] / 2 + 60
            if self.numbered:
                blit(f, text_sprite(str(k + 1), 'cinzel', 70, GOLD, 0, 900, shadow=0.9, glow=0.4), cx - c.shape[1] / 2 + 10, cy - self.h / 2 - 10, a, 'c')
            label(f, lab, cx, ly, appear(t, ts + 0.2), 40 if n < 4 else 34, GOLD, tracking=4)
            if sub: label(f, sub, cx, ly + 52, appear(t, ts + 0.35), 36 if n < 4 else 30, CREAM, 'cormi', 600, 0)
        if self.title:
            txt, ts = self.title
            label(f, txt, W / 2 + weave[0], 110 + weave[1], appear(t, ts, 0.7), 50, CREAM, tracking=10)
        return f

# ------------------------------------------------------------------ words stamped over an image
class Words(Shot):
    def __init__(self, t0, t1, bg_img, words, tin=None, sfx=None, c=(0.5, 0.5)):
        """words: (text, x, y, t, color, angle)"""
        super().__init__(t0, t1, tin, sfx); self.bg_img, self.c = bg_img, c
        self.stamps = [Stamp(ts, 1e9, txt, x, y, ang, 92, col, sfx=None) for (txt, x, y, ts, col, ang) in words]
    def render(self, t, weave):
        p = ease(self.p(t))
        f = to_f(kb_warp(load_img(self.bg_img), lerp(1.05, 1.14, p), self.c, 0, weave))
        f = cv2.GaussianBlur(f, (0, 0), 3) * 0.45
        for s in self.stamps:
            if s.t0 <= t: s.draw(f, t)
        return f

# ------------------------------------------------------------------ chapter card
class Chapter(Shot):
    tin = ('burn', 1.2)
    def __init__(self, t0, t1, num, title, img, c=(0.5, 0.5), z=(1.12, 1.2), tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.num, self.title, self.img, self.c, self.z = num, title, img, c, z
    def render(self, t, weave):
        p = ease(self.p(t))
        f = to_f(kb_warp(load_img(self.img), lerp(*self.z, p), self.c, lerp(-0.6, 0.4, p), weave))
        f = cv2.GaussianBlur(f, (0, 0), 2.0) * 0.40
        a = appear(t, self.t0 + 0.4, 0.9)
        ox, oy = weave
        fa = text_sprite('FAKTA', 'cinzel', 46, CREAM, 22, 600, shadow=0.8)
        blit(f, fa, 960 + ox, 300 + oy, a, 'c')
        m = new_mask()
        L = int(220 * a)
        cv2.line(m, (960 - fa.shape[1] // 2 - 30 - L, 300), (960 - fa.shape[1] // 2 - 30, 300), 255, 2, cv2.LINE_AA)
        cv2.line(m, (960 + fa.shape[1] // 2 + 30, 300), (960 + fa.shape[1] // 2 + 30 + L, 300), 255, 2, cv2.LINE_AA)
        fill_mask(f, m, GOLD, a * 0.9, roi=(0, 290, W, 312))
        k = appear(t, self.t0 + 0.6, 1.0)
        blit(f, text_sprite(f'#{self.num}', 'cinzel', 250, (246, 210, 140), 4, 900, shadow=0.9, glow=0.5, glow_color=(255, 170, 70)),
             960 + ox, 520 + oy, k, 'c', lerp(1.12, 1.0, k) * (1 + 0.02 * p))
        blit(f, text_sprite(self.title, 'corm', 76, CREAM, 1, 600, shadow=0.9), 960 + ox, 760 + oy, appear(t, self.t0 + 1.1, 0.8), 'c')
        return f
