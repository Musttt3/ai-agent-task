# Beat sheet — Toussaint Louverture: Mantan Budak yang Menantang Kekuasaan Napoleon
# Executed by tools/build_beats.py (helpers: beat, P, DOC, TYPE, TAPE, STAMP, TITLE, HAND, MARK, CARD, MAP, TL, FOLDER, REDACT, GLITCH, SHAKE, w, we, ws).
# One hero per beat; at most two dimmed supporting objects. Every on-screen phrase appears once.

# ============================================================== CH 0 — PEMBUKA (0:00–0:32)
beat("01", 0.0, "fade", [
    CARD(),
    TYPE("AWAL 1800-AN", y=0.02, size=0.1, align="center", words=[[w("awal", 0.2), we("awal", 0.2)], [w("abad", 0.5), we("-19", 1)]], cursorUntil=1.9),
], cam={"tilt": 14, "az": -96, "roll": -1.2, "push": 0.05, "z": 0.35})

beat("02", w("Napoleon", 2) - 0.12, "W", [
    P("b02_napoleon_ingres", x=0.08, y=0.07, h=0.8, rot=-3, z=0.14),
    DOC("typed", x=-0.7, y=0.12, w=0.55, h=0.72, rot=9, z=0.02, dim=0.55),
    TAPE("NAPOLEON BONAPARTE", w("Napoleon", 2), x=0.1, y=-0.31, rot=-3, size=0.048),
], cam={"tilt": 19, "az": -84, "roll": 1.0, "push": 0.09, "z": 0.14, "off": [0.04, 0.02]})

beat("03", w("Tetapi", 6) - 0.05, "W", [
    MAP(ATL, w=1.95, h=1.12, rot=-1.5,
        labels=[{"text": "Samudra Atlantik", "lon": -42, "lat": 30, "size": 0.055, "rot": -6}],
        routes=[{"pts": [BREST, [-35, 36], CAP], "t0": w("seberang", 7.5), "t1": we("Atlantik", 9.2), "dash": True}],
        pulses=[{"lon": CAP[0], "lat": CAP[1], "t": w("pria", 10.4)}]),
], cam={"tilt": 21, "az": -95, "roll": -0.8, "push": 0.1, "off": [0.42, 0.1], "drift": [-0.62, -0.12], "z": 0.06})

beat("04", w("Pria", 13.3) - 0.1, "W", [
    DOC("card", x=0, y=0, w=1.15, h=0.72, rot=1.5, z=0.08),
    TYPE("RAJA", x=-0.42, y=0.13, size=0.085, color="ink", align="left", words=ws("raja", 14.0), cursorUntil=0),
    MARK("strike", we("raja", 14.0) + 0.05, x=-0.272, y=0.122, w=0.33, h=0.06, dur=0.35, width=0.011),
    TYPE("BANGSAWAN", x=-0.42, y=-0.06, size=0.085, color="ink", align="left", words=ws("bangsawan", 15.2), cursorUntil=0),
    MARK("strike", we("bangsawan", 15.2) + 0.05, x=-0.088, y=-0.068, w=0.67, h=0.06, dur=0.4, width=0.011),
    STAMP("BUDAK", w("budak", 17.5), x=0.33, y=-0.255, size=0.105, rot=-8),
], cam={"tilt": 16, "az": -88, "roll": 0.6, "push": 0.09, "z": 0.1})

beat("05", w("Toussaint", 18.7) - 0.03, "G", [
    P("b05_toussaint_bust", x=-0.52, y=0.0, h=0.84, rot=-2.5, z=0.14),
    TITLE("TOUSSAINT\nLOUVERTURE", w("Toussaint", 18.7), sub="1743 – 1803", x=0.36, y=0.03, size=0.085, lineHeight=1.12),
], cam={"tilt": 17, "az": -92, "roll": -0.7, "push": 0.08, "z": 0.2})

beat("06", w("Dia", 20.3) - 0.1, "W", [
    P("b83_crete_a_pierrot_1802", x=0, y=0.02, h=0.78, rot=2, z=0.12, crop=[0.0, 0.0, 0.75, 1.0]),
    MARK("circle", w("diperbudak", 25.2), x=-0.08, y=0.0, w=0.55, h=0.45, rot=-3),
], cam={"tilt": 18, "az": -86, "roll": 0.8})

beat("07", w("Dan", 25.9) - 0.1, "W", [
    P("b07_prise_du_cap_1802", x=0, y=0.0, h=0.82, rot=-1.5, z=0.12),
    DOC("typed", x=0.72, y=-0.1, w=0.5, h=0.7, rot=-7, z=0.02, dim=0.55),
], cam={"tilt": 20, "az": -97, "roll": -0.8, "push": 0.1})
GLITCH(w("meledak", 31.3), 6); SHAKE(w("meledak", 31.3), 10)

# ============================================================== CH 1 — SAINT-DOMINGUE (0:32–0:59)
beat("08", w("Kisah", 32.1) - 0.05, "L", [
    CARD(),
    TYPE("SAINT-DOMINGUE", y=0.02, size=0.1, align="center", words=[[w("Saint", 33.4), we("-Domingue", 33.6)]], cursorUntil=we("-Domingue", 33.6) + 0.6),
], cam={"tilt": 16, "az": -84, "roll": 1.0, "push": 0.05, "z": 0.35}, go="SE")

beat("09", w("sebuah", 34.4) - 0.1, "W", [
    MAP(HISP, w=1.85, h=0.92, rot=1, fills=[{"id": HAITI, "t": w("Haiti", 38.4), "dur": 0.7, "alpha": 0.55}]),
    HAND("Haiti", w("Haiti", 38.4), x=-0.36, y=0.27, size=0.07, rot=-5, color="red"),
], cam={"tilt": 19, "az": -92, "roll": -0.6, "push": 0.1, "off": [0.1, 0], "drift": [-0.12, 0]})

beat("10", w("Pada", 39.2) - 0.1, "W", [
    P("b10_vue_du_cap_ponce", x=0, y=0.06, h=0.5, rot=-1.5, z=0.12),
    TAPE("KOLONI TERKAYA", w("terkaya", 42.6), x=-0.1, y=-0.27, rot=-2.5, size=0.05),
], cam={"tilt": 17, "az": -94, "roll": 0.7, "push": 0.1})

beat("11", w("Kapal", 44.0) - 0.1, "W", [
    P("b11_tall_ship", x=-0.05, y=0, h=0.88, rot=2.5, z=0.12, film=True, video={"t0": w("Kapal", 44.0) - 0.5, "rate": 0.85}),
    MARK("arrow", w("melintasi", 46.1), x=0.42, y=0.0, w=0.35, h=0.6, **{"from": [-0.35, -0.4], "to": [0.3, 0.4]}),
], cam={"tilt": 18, "az": -86, "roll": -1.0})

beat("12", w("sementara", 47.6) - 0.1, "W", [
    P("b12_coffee_beans", x=-0.22, y=0.05, h=0.56, rot=-2, z=0.14, film=True),
    P("b12_cane_field", x=0.5, y=-0.16, h=0.42, rot=5, z=0.06, film=True, dim=0.35),
], cam={"tilt": 19, "az": -92, "roll": 0.6})

beat("13", w("Tetapi", 51.3) - 0.05, "W", [
    P("b13_cutting_cane_antigua_1823", x=0, y=0.02, h=0.72, rot=-1.5, z=0.12),
], cam={"tilt": 17, "az": -89, "roll": -0.6, "push": 0.12})
GLITCH(w("penderitaan", 54.0))

beat("14", w("ratusan", 54.7) - 0.1, "W", [
    P("b14_sugar_mill_1681", x=0.3, y=0.04, h=0.62, rot=3, z=0.06, dim=0.45),
    TITLE("±500.000", w("ratusan", 54.7), sub="ORANG DIPERBUDAK", x=-0.12, y=0.0, size=0.12, z=0.45),
], cam={"tilt": 16, "az": -95, "roll": 0.8, "push": 0.07})

# ============================================================== CH 2 — BRÉDA (0:59–1:59)
beat("15", w("Di", 59.2) - 0.05, "L", [
    CARD(),
    TYPE("PERKEBUNAN BRÉDA", y=0.02, size=0.095, align="center", words=[[w("perkebunan", 59.9), we("bernama", 60.5)], [w("Breda", 60.8), we("Breda", 60.8)]], cursorUntil=61.9),
], cam={"tilt": 15, "az": -94, "roll": -1.0, "push": 0.05, "z": 0.35}, go="S")

beat("16", w("sekitar", 61.6) - 0.1, "W", [
    DOC("ledger", x=0, y=0, w=0.95, h=1.05, rot=-2, z=0.08, seed=1743),
    STAMP("±1743", w("1743", 62.3), x=0.22, y=0.26, size=0.1, rot=-7),
    MARK("circle", w("Toussaint", 66.0), x=-0.08, y=-0.12, w=0.62, h=0.12, rot=-2),
], cam={"tilt": 20, "az": -90, "roll": 0.7, "push": 0.1})

beat("17", w("Sejak", 66.7) - 0.1, "W", [
    P("b17_code_noir_1685", x=0, y=0, h=0.95, rot=1.5, z=0.12),
    MARK("underline", w("menentukan", 68.3), x=0, y=0.12, w=0.42, h=0.08),
], cam={"tilt": 18, "az": -92, "roll": -0.6, "push": 0.1, "off": [0, 0.08], "drift": [0, -0.06]})

beat("18", w("Dia", 69.9) - 0.1, "W", [
    P("b48_planter_brunias", x=0, y=0.08, h=0.78, rot=-1, z=0.12, crop=[0.0, 0.1, 1.0, 0.85]),
    TAPE("STATUS", w("status", 73.6), x=-0.32, y=-0.32, rot=-4, size=0.05),
    TAPE("WARNA KULIT", w("warna", 74.4), x=0.28, y=-0.34, rot=3, size=0.05),
], cam={"tilt": 17, "az": -88, "roll": 0.9})

beat("19", w("Namun", 75.3) - 0.1, "W", [
    P("b19_toussaint_rijks", x=0, y=0, h=0.92, rot=-2, z=0.12),
    MARK("circle", w("keterampilan", 76.7), x=0.0, y=0.06, w=0.34, h=0.42),
], cam={"tilt": 18, "az": -93, "roll": -0.8, "push": 0.12})

beat("20", w("Dia", 79.7) - 0.1, "W", [
    P("b20_toussaint_a_cheval", x=0, y=0, h=0.92, rot=2, z=0.12),
    MARK("arrow", w("hewan", 81.5), x=0.36, y=-0.12, w=0.3, h=0.3, **{"from": [0.45, 0.35], "to": [-0.35, -0.3]}),
], cam={"tilt": 19, "az": -88, "roll": 0.6})

beat("21", w("belajar", 82.4) - 0.1, "W", [
    P("b21_quill_writing", x=0, y=0.02, h=0.64, rot=-1.5, z=0.12, film=True),
], cam={"tilt": 16, "az": -91, "roll": -0.7, "push": 0.1})

beat("22", w("Pada", 87.1) - 0.05, "L", [
    DOC("cert", x=0, y=0, w=0.85, h=1.0, rot=1, z=0.08, seed=1776),
    TYPE("1770-AN", x=0, y=0.28, size=0.085, color="ink", align="center", words=[[w("1770", 87.7), we("-an", 89.1)]], cursorUntil=0),
    STAMP("MERDEKA", w("kebebasannya", 90.5), x=0.02, y=-0.12, size=0.11, rot=-8),
], cam={"tilt": 17, "az": -90, "roll": 0.8, "push": 0.09})

beat("23", w("Ini", 91.5) - 0.1, "W", [
    TL([{"label": "1743", "pos": 0.0}, {"label": "1770-AN", "pos": 0.45}, {"label": "1791", "pos": 1.0}], x=0, y=0.02, w=1.55, h=0.22, rot=-1.5),
    MARK("bracket", w("bertahun", 95.6), x=0.33, y=0.15, w=0.75, h=0.12, dur=0.6),
], cam={"tilt": 21, "az": -88, "roll": -0.6, "push": 0.08})

beat("24", w("Kehidupannya", 97.3) - 0.1, "W", [
    FOLDER(w("rumit", 99.1), x=0.1, y=0, w=0.68, h=0.9, rot=-2),
], cam={"tilt": 22, "az": -92, "roll": 0.7, "push": 0.08})

beat("25", w("Dia", 99.7) - 0.1, "W", [
    DOC("typed", x=0, y=0, w=0.9, h=1.0, rot=-1, z=0.08, seed=1780),
    TYPE("PEMILIK BUDAK", x=0, y=0.02, size=0.085, color="ink", align="center", z=0.2),
    REDACT(w("memiliki", 102.1), x=0, y=0.045, w=0.85, h=0.14, z=0.24),
], cam={"tilt": 18, "az": -89, "roll": -0.8, "push": 0.1})
GLITCH(w("memiliki", 102.1))

beat("26", w("Fakta", 104.1) - 0.1, "W", [
    P("b26_toussaint_kupfer_1806", x=-0.12, y=0, h=0.95, rot=1.5, z=0.12),
    MARK("q", w("sempurna", 108.0), x=0.38, y=0.18, w=0.16, h=0.28, dur=0.6),
], cam={"tilt": 18, "az": -94, "roll": 0.7, "push": 0.1})

beat("27", w("Perjalanan", 111.4) - 0.1, "W", [
    P("b36_toussaint_standing", x=0.45, y=0.02, h=0.82, rot=2.5, z=0.1),
    TAPE("SIKAP", w("sikap", 116.2), x=-0.5, y=0.22, rot=-5),
    TAPE("KEPENTINGAN", w("kepentingan", 116.9), x=-0.32, y=0.0, rot=2),
    TAPE("POLITIK", w("politik", 118.4), x=-0.52, y=-0.24, rot=-3),
    MARK("thread", w("kepentingan", 116.9) + 0.15, x=-0.4, y=0.11, w=0.3, h=0.26, **{"from": [-0.35, 0.4], "to": [0.3, -0.4]}),
    MARK("thread", w("politik", 118.4) + 0.15, x=-0.42, y=-0.12, w=0.3, h=0.26, **{"from": [0.3, 0.4], "to": [-0.3, -0.4]}),
], cam={"tilt": 19, "az": -87, "roll": -0.7, "off": [0.05, 0], "drift": [-0.12, 0]})

# ============================================================== CH 3 — 1789 (1:59–3:25)
beat("28", w("Tahun", 119.2) - 0.05, "L", [
    P("b28_prise_bastille", x=0, y=0.04, h=0.7, rot=-1.5, z=0.12),
    TAPE("1789", w("1789", 119.6), x=-0.44, y=-0.3, rot=-4, size=0.06),
], cam={"tilt": 17, "az": -91, "roll": 0.8, "push": 0.1}, go="N")
SHAKE(w("mengguncang", 122.7), 14); GLITCH(w("mengguncang", 122.7), 4)

beat("29", w("Orang", 124.1) - 0.1, "W", [
    P("b29_declaration_droits", x=0, y=0, h=0.95, rot=1, z=0.12),
    MARK("underline", w("persamaan", 126.5), x=0.02, y=-0.02, w=0.5, h=0.08),
], cam={"tilt": 19, "az": -88, "roll": -0.6, "push": 0.12})

beat("30", w("Tetapi", 127.6) - 0.05, "T", [
    CARD(),
    TYPE("?", y=0.02, size=0.2, align="center", color="red", words=[[w("pertanyaan", 128.0), we("pertanyaan", 128.0)]], cursorUntil=we("muncul", 129.3)),
], cam={"tilt": 15, "az": -93, "roll": 1.0, "push": 0.05, "z": 0.35})

beat("31", w("Kalau", 129.8) - 0.1, "W", [
    P("b31_moi_libre_aussi_homme", x=0, y=0, h=0.92, rot=-1.5, z=0.12),
    MARK("circle", w("budak", 135.9), x=0.0, y=0.08, w=0.5, h=0.56),
], cam={"tilt": 18, "az": -90, "roll": -0.7, "push": 0.12})
GLITCH(w("budak", 135.9))

beat("32", w("Pada", 136.5) - 0.05, "L", [
    P("b32_incendie_plaine_1791", x=0, y=0.05, h=0.62, rot=1, z=0.12),
    STAMP("AGUSTUS 1791", w("1791", 137.3), x=0.2, y=-0.3, size=0.07, rot=-6),
], cam={"tilt": 18, "az": -94, "roll": 0.8, "push": 0.1})

beat("33", w("Perkebunan", 141.9) - 0.1, "W", [
    P("b33_fire_saint_domingo_1791", x=0, y=0, h=0.72, rot=-2, z=0.12, overlay={"asset": "b33_smoke", "opacity": 0.35}),
], cam={"tilt": 17, "az": -88, "roll": -0.6, "push": 0.12})

beat("34", w("Koloni", 146.2) - 0.1, "W", [
    P("b34_incendie_cap_1793", x=0, y=0, h=0.82, rot=1.5, z=0.12),
], cam={"tilt": 19, "az": -92, "roll": 0.7, "push": 0.1})
GLITCH(w("medan", 150.3))

beat("35", w("Toussaint", 151.4) - 0.1, "W", [
    DOC("typed", x=0, y=0, w=1.1, h=0.7, rot=-1, z=0.08, seed=1791),
    TYPE("BUKAN PEMIMPIN\nTUNGGAL", x=0, y=0.04, size=0.085, color="ink", align="center", words=ws("bukan pemimpin tunggal", 151.8), cursorUntil=0),
], cam={"tilt": 17, "az": -90, "roll": -0.7, "push": 0.08})

beat("36", w("Namun", 154.6) - 0.1, "W", [
    P("b54_toussaint_a_saint_domingue", x=0, y=0, h=0.75, rot=-1.5, z=0.12),
    MARK("arrow", w("pengaruhnya", 159.6), x=-0.12, y=0.0, w=0.5, h=0.4, **{"from": [-0.45, -0.4], "to": [0.3, 0.2]}),
], cam={"tilt": 18, "az": -94, "roll": 0.8, "push": 0.1})

beat("38", w("kacau", 162.5) - 0.03, "G", [
    MAP(HISP, w=1.1, h=0.55, rot=-1, z=0.04, dim=0.25),
    TAPE("PEMBERONTAK", w("pemberontak", 163.4), x=-0.58, y=0.33, rot=-4, size=0.045),
    TAPE("PEMILIK PERKEBUNAN", w("pemilik", 164.9), x=0.42, y=0.36, rot=3, size=0.045),
    TAPE("ORANG MERDEKA", w("kelompok", 166.2), x=-0.55, y=-0.32, rot=3, size=0.045),
    TAPE("TENTARA PRANCIS", w("tentara", 167.7), x=0.48, y=-0.3, rot=-3, size=0.045),
    TAPE("KEKUATAN ASING", w("kekuatan", 169.1), x=0.0, y=-0.43, rot=1.5, size=0.045),
    MARK("thread", w("pemberontak", 163.4) + 0.2, x=-0.3, y=0.17, w=0.5, h=0.3, **{"from": [-0.45, 0.4], "to": [0.45, -0.4]}),
    MARK("thread", w("pemilik", 164.9) + 0.2, x=0.22, y=0.18, w=0.4, h=0.32, **{"from": [0.45, 0.4], "to": [-0.45, -0.4]}),
    MARK("thread", w("tentara", 167.7) + 0.2, x=0.25, y=-0.15, w=0.45, h=0.26, **{"from": [0.45, -0.4], "to": [-0.45, 0.4]}),
], cam={"tilt": 20, "az": -90, "roll": -0.5, "push": 0.06})

beat("39", w("Toussaint", 171.8) - 0.1, "W", [
    P("b64_toussaint_paris_musees", x=0, y=0, h=0.88, rot=1.5, z=0.12),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "push": 0.12})

_p40 = P("b71_carte_colonie", x=0, y=0.02, h=0.92, rot=-1, z=0.12)
beat("40", w("Pada", 175.4) - 0.1, "W", [
    _p40,
    MARKON("circle", w("Spanyol", 177.1), _p40, 0.315, 0.225, 0.3, 0.1),
    TAPE("SEKUTU: SPANYOL", w("Spanyol", 177.1) + 0.15, x=0.42, y=-0.36, rot=-3, size=0.05),
], cam={"tilt": 19, "az": -89, "roll": -0.7, "push": 0.1, "off": [0.0, 0.05], "drift": [0.06, -0.05]})

beat("42", w("Pada", 182.4) - 0.05, "G", [
    P("b42_decret_abolition_1794", x=-0.08, y=0, h=0.95, rot=1, z=0.12),
    STAMP("1794", w("1794", 182.9), x=0.4, y=0.2, size=0.11, rot=-8),
    MARK("circle", w("menghapus", 186.6), x=-0.08, y=0.25, w=0.5, h=0.22),
], cam={"tilt": 17, "az": -92, "roll": 0.8, "push": 0.1})

beat("43", w("Toussaint", 189.3) - 0.1, "W", [
    P("b18_mortels_egaux_1794", x=-0.05, y=0.02, h=0.7, rot=-2, z=0.12),
    MARK("arrow", w("beralih", 189.7) + 0.1, x=0.4, y=0.1, w=0.3, h=0.4, bend=0.45, **{"from": [-0.3, -0.4], "to": [0.2, 0.4]}),
], cam={"tilt": 18, "az": -88, "roll": -0.6})

beat("44", w("Bagi", 191.9) - 0.1, "W", [
    MAP(HISP, w=1.85, h=0.92, rot=1.5),
    MARK("arrow", w("berpindah", 196.5) - 0.2, x=0.0, y=0.05, w=0.9, h=0.25, bend=-0.25, **{"from": [0.45, 0.0], "to": [-0.45, 0.0]}),
    HAND("berpindah pihak?", w("berpindah", 196.5), x=0.05, y=-0.3, size=0.065, rot=-3),
], cam={"tilt": 20, "az": -91, "roll": 0.7, "push": 0.08})

beat("45a", w("Tetapi", 197.5) - 0.1, "W", [
    P("b05_toussaint_bust", x=0, y=0, h=0.95, rot=1.5, z=0.12, crop=[0.12, 0.08, 0.88, 0.7]),
], cam={"tilt": 16, "az": -90, "roll": -0.6, "push": 0.14})

beat("45", w("Kekuasaan", 201.2) - 0.05, "T", [
    CARD(),
    TYPE("PERBUDAKAN\nTIDAK KEMBALI?", y=0.04, size=0.095, align="center", words=ws("perbudakan tidak kembali?", 203.6), cursorUntil=205.3),
], cam={"tilt": 15, "az": -86, "roll": 1.0, "push": 0.05, "z": 0.35})

# ============================================================== CH 4 — KACAU (3:25–4:25)
beat("46", w("Di", 205.4) - 0.05, "W", [
    P("b46_insurrection_convention", x=0, y=0.02, h=0.7, rot=1, z=0.12),
], cam={"tilt": 18, "az": -92, "roll": 0.7, "off": [-0.12, 0], "drift": [0.22, 0]}, go="E")

beat("47", w("Para", 210.2) - 0.1, "W", [
    P("b47_moi_libre_aussi_femme", x=0, y=0, h=0.9, rot=-2, z=0.12),
], cam={"tilt": 17, "az": -88, "roll": -0.6, "push": 0.12})

beat("48", w("Para", 213.5) - 0.1, "W", [
    P("b48_planter_brunias", x=0, y=0, h=0.92, rot=1.5, z=0.12),
], cam={"tilt": 18, "az": -93, "roll": 0.6, "push": 0.1})

beat("49", w("Sementara", 216.7) - 0.1, "W", [
    P("b49_maitland_1798", x=0, y=0, h=0.92, rot=-1.5, z=0.12),
    MARK("arrow", w("asing", 217.7), x=-0.32, y=0.0, w=0.3, h=0.3, **{"from": [-0.45, -0.4], "to": [0.4, 0.3]}),
], cam={"tilt": 19, "az": -90, "roll": -0.7})

beat("50", w("Tidak", 221.9) - 0.1, "W", [
    P("b31_moi_libre_aussi_homme", x=-0.45, y=0, h=0.62, rot=-2, z=0.1),
    P("b48_planter_brunias", x=0.45, y=0, h=0.62, rot=2, z=0.1),
    MARK("line", w("garis", 222.5), x=0, y=0, w=0.9, h=0.06, rot=90, dur=0.45, out=w("sederhana", 223.2)),
    MARK("tear", w("sederhana", 223.2), x=0, y=0, w=0.12, h=0.9, dur=0.35),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "push": 0.08})

beat("51", w("Bahkan", 226.1) - 0.1, "W", [
    P("b51_incendie_frontispiece", x=0, y=0.03, h=0.68, rot=-1, z=0.12),
], cam={"tilt": 17, "az": -89, "roll": -0.7, "push": 0.12})
GLITCH(w("kejam", 229.7))

beat("52", w("Dalam", 230.1) - 0.1, "W", [
    P("b52_toussaint_horseback_met", x=-0.12, y=0, h=0.94, rot=1.5, z=0.12),
    TAPE("KOMANDAN", w("komandan", 235.0), x=0.42, y=-0.25, rot=-4, size=0.055),
], cam={"tilt": 18, "az": -92, "roll": 0.7, "push": 0.1})

beat("53", w("melainkan", 236.9) - 0.1, "W", [
    P("b49_maitland_1798", x=0, y=0, h=0.95, rot=1, z=0.12, crop=[0.05, 0.25, 0.95, 0.8]),
    TAPE("PERUNDING", w("perunding", 238.0), x=0.3, y=-0.32, rot=3, size=0.055),
], cam={"tilt": 18, "az": -88, "roll": -0.6, "push": 0.1})

beat("54", w("Dengan", 243.5) - 0.1, "W", [
    P("b36_toussaint_standing", x=0, y=0, h=0.94, rot=-1.5, z=0.12),
], cam={"tilt": 19, "az": -90, "roll": 0.7, "push": 0.12})

beat("55", w("pasukannya", 247.8) - 0.1, "W", [
    P("b55_palm_tree_hill", x=0, y=0, h=0.66, rot=1.5, z=0.12),
    MARK("arrow", w("mengusir", 250.7), x=0.35, y=0.05, w=0.4, h=0.3, **{"from": [-0.45, 0.0], "to": [0.45, 0.1]}),
], cam={"tilt": 18, "az": -94, "roll": -0.6})

beat("56", w("Sedikit", 254.4) - 0.1, "W", [
    P("b56_toussaint_signature", x=0, y=0, h=0.94, rot=-1.5, z=0.12),
    MARK("circle", 256.1, x=0.04, y=-0.36, w=0.5, h=0.14),
], cam={"tilt": 18, "az": -91, "roll": 0.7, "push": 0.1, "off": [0, -0.08], "drift": [0, 0.04]})

beat("57", w("Seorang", 258.3) - 0.1, "W", [
    DOC("ledger", x=-0.55, y=-0.05, w=0.55, h=0.65, rot=-5, z=0.04, seed=1743, dim=0.3),
    P("b69_toussaint_colour_cheval", x=0.32, y=0, h=0.9, rot=2, z=0.12),
    MARK("arrow", w("kini", 261.5), x=-0.15, y=0.1, w=0.45, h=0.3, **{"from": [-0.45, -0.3], "to": [0.4, 0.2]}),
], cam={"tilt": 19, "az": -89, "roll": -0.7, "off": [-0.12, 0], "drift": [0.2, 0]})

# ============================================================== CH 5 — HARGA SEBUAH KETERTIBAN (4:25–5:19)
beat("58", w("Namun", 265.6) - 0.05, "L", [
    CARD(),
    TYPE("HARGA SEBUAH\nKETERTIBAN", y=0.04, size=0.095, align="center", t0=w("Namun", 265.6) + 0.35, t1=w("membawa", 268.2), cursorUntil=269.9),
], cam={"tilt": 15, "az": -93, "roll": -1.0, "push": 0.05, "z": 0.35}, go="SW")

beat("59", w("Saint", 270.1) - 0.1, "W", [
    DOC("ledger", x=0, y=0, w=1.1, h=0.85, rot=-1.5, z=0.06, seed=1800),
    TAPE("PANGAN", w("pangan", 271.4), x=-0.38, y=0.2, rot=-4, size=0.055),
    TAPE("PERDAGANGAN", w("perdagangan", 272.2), x=0.15, y=0.0, rot=2, size=0.055),
    TAPE("PEMASUKAN", w("pemasukan", 273.1), x=-0.18, y=-0.22, rot=-2, size=0.055),
], cam={"tilt": 20, "az": -90, "roll": 0.6, "push": 0.08})

beat("60", w("Toussaint", 274.0) - 0.1, "W", [
    P("b12_cane_field", x=0, y=0.02, h=0.62, rot=-1.5, z=0.12, film=True, video={"t0": 272.0, "rate": 0.8}),
], cam={"tilt": 17, "az": -92, "roll": -0.6, "push": 0.1})

beat("61", w("Perbudakan", 277.3) - 0.05, "G", [
    P("b61_lois_colonie_1801", x=0, y=0, h=0.95, rot=1, z=0.12),
    MARK("underline", w("ketat", 282.8), x=0, y=-0.12, w=0.45, h=0.08),
], cam={"tilt": 18, "az": -89, "roll": 0.7, "push": 0.12})

beat("62", w("Bagi", 283.3) - 0.1, "W", [
    P("b13_cutting_cane_antigua_1823", x=0, y=0.02, h=0.7, rot=1.5, z=0.12, crop=[0.0, 0.25, 0.75, 1.0]),
], cam={"tilt": 18, "az": -91, "roll": -0.7, "push": 0.1})

beat("63", w("Sejumlah", 287.6) - 0.1, "W", [
    DOC("petition", x=0, y=0, w=0.85, h=1.0, rot=-1.5, z=0.08, seed=1801),
    TAPE("PETANI MENENTANG", w("petani", 288.3), x=0.05, y=0.32, rot=-3, size=0.055),
], cam={"tilt": 19, "az": -88, "roll": 0.6, "push": 0.08})

beat("64", w("Disimilah", 290.5) - 0.05, "G", [
    P("b64_toussaint_paris_musees", x=0, y=0, h=0.92, rot=-1, z=0.12, crop=[0.1, 0.05, 0.9, 0.75]),
    MARK("tear", w("pertentangan", 291.6), x=0.0, y=0.0, w=0.1, h=0.9, dur=0.45),
], cam={"tilt": 17, "az": -90, "roll": -0.6, "push": 0.1})

beat("65", w("Dia", 293.8) - 0.1, "W", [
    DOC("notice", x=0, y=0, w=0.85, h=0.95, rot=2, z=0.08, seed=1795, torn=True),
    MARK("x", w("diperjualbelikan", 296.3), x=0, y=0.05, w=0.6, h=0.6, dur=0.55),
], cam={"tilt": 18, "az": -92, "roll": 0.7, "push": 0.08})

beat("66", w("tetapi", 298.2) - 0.1, "W", [
    DOC("decree", x=0, y=0, w=0.85, h=1.0, rot=-1.5, z=0.08, seed=1800),
    STAMP("KEKUASAAN KERAS", w("keras", 301.0), x=0.0, y=-0.05, size=0.075, rot=-7),
], cam={"tilt": 18, "az": -88, "roll": -0.6, "push": 0.08})

beat("67", w("Dia", 304.2) - 0.1, "W", [
    DOC("typed", x=0.08, y=0, w=0.95, h=0.95, rot=1.5, z=0.06, seed=1799),
    P("b67_andre_rigaud", x=-0.12, y=0.1, h=0.5, rot=-4, z=0.14),
    TAPE("ANDRÉ RIGAUD", w("Andre", 307.3), x=0.02, y=-0.26, rot=-3, size=0.055),
], cam={"tilt": 19, "az": -91, "roll": 0.7, "push": 0.1})

beat("68", w("Bahkan", 308.4) - 0.1, "W", [
    P("b68_acte_insurrection_1801", x=-0.22, y=0, h=0.95, rot=-1.5, z=0.12),
    TAPE("MOÏSE · 1801", w("Moïse", 311.6), x=0.45, y=0.12, rot=4, size=0.055),
], cam={"tilt": 18, "az": -89, "roll": -0.7, "off": [-0.08, 0], "drift": [0.12, 0]})
GLITCH(w("kejam", 313.0))

beat("69", w("Toussaint", 313.4) - 0.1, "W", [
    P("b26_toussaint_kupfer_1806", x=0, y=0, h=0.95, rot=1, z=0.12, crop=[0.0, 0.0, 1.0, 0.62]),
    TAPE("PEMBEBAS", w("pembebas", 314.5), x=-0.5, y=0.1, rot=-4, size=0.055),
    TAPE("OTORITER", w("otoriter", 318.4), x=0.5, y=-0.12, rot=4, size=0.055, color="red"),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "push": 0.08})

# ============================================================== CH 6 — 1801 (5:19–6:05)
beat("70", w("Tahun", 319.3) - 0.05, "L", [
    CARD(),
    TYPE("1801", y=0.02, size=0.15, align="center", words=[[w("1801", 319.6), we("1801", 319.6)]], cursorUntil=322.6),
], cam={"tilt": 15, "az": -86, "roll": 1.0, "push": 0.05, "z": 0.35}, go="NE")

beat("71", w("Dia", 323.0) - 0.1, "W", [
    MAP(HISP, w=1.85, h=0.92, rot=-1, fills=[{"id": HAITI, "t": w("seluruh", 324.3), "dur": 0.5, "alpha": 0.55}, {"id": DOMREP, "t": w("seluruh", 324.3) + 0.45, "dur": 0.7, "alpha": 0.55}]),
], cam={"tilt": 20, "az": -90, "roll": -0.6, "push": 0.1})

beat("72", w("Dokumen", 328.4) - 0.1, "W", [
    P("b72_constitution_1801", x=-0.15, y=0, h=0.95, rot=1, z=0.12),
    MARK("underline", w("melarang", 329.0), x=-0.15, y=0.24, w=0.42, h=0.08),
    STAMP("SEUMUR HIDUP", w("seumur", 332.3), x=0.35, y=-0.28, size=0.075, rot=-8),
], cam={"tilt": 18, "az": -92, "roll": 0.7, "push": 0.08})

beat("73", w("Saint", 333.4) - 0.1, "W", [
    P("b40_map_tardieu_1802", x=0, y=0, h=0.88, rot=-1.5, z=0.12),
], cam={"tilt": 19, "az": -89, "roll": -0.7, "push": 0.12})

beat("73b", w("tetapi", 337.8) - 0.1, "W", [
    P("b09_map_stockdale_1800", x=0, y=0.02, h=0.62, rot=1.5, z=0.12),
    HAND("otonomi", w("otonomi", 340.2), x=0.3, y=-0.32, size=0.075, rot=-6, color="red"),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "push": 0.1})

beat("74", w("Di", 341.8) - 0.05, "G", [
    P("b74_napoleon_gros", x=0, y=0, h=0.95, rot=-1, z=0.12),
], cam={"tilt": 17, "az": -91, "roll": 0.6, "push": 0.14, "off": [0, 0.1], "drift": [0, 0.04]})
GLITCH(w("tidak", 344.0))

beat("75", w("Baginya", 346.6) - 0.1, "W", [
    MAP(CARIB, w=1.85, h=1.0, rot=1, labels=[{"text": "Laut Karibia", "lon": -76, "lat": 14.5, "size": 0.05, "rot": -4}],
        pulses=[{"lon": -72.5, "lat": 19.0, "t": w("pulau", 349.0)}]),
], cam={"tilt": 20, "az": -92, "roll": 0.6, "push": 0.1})

beat("76", w("Koloni", 350.5) - 0.1, "W", [
    P("b12_coffee_beans", x=-0.32, y=0.05, h=0.5, rot=-3, z=0.12, film=True, video={"t0": 349.0, "rate": 0.8}),
    P("b12_cane_field", x=0.38, y=-0.1, h=0.46, rot=3, z=0.1, film=True, video={"t0": 351.0, "rate": 0.8}),
    MARK("arrow", w("strategis", 353.5), x=0.05, y=0.25, w=0.6, h=0.3, **{"from": [-0.45, -0.3], "to": [0.45, 0.4]}),
], cam={"tilt": 18, "az": -88, "roll": -0.6})

beat("77", w("Seorang", 355.7) - 0.1, "W", [
    P("b77_proclamation_1801", x=-0.22, y=0, h=0.92, rot=-1.5, z=0.12),
    TAPE("KEPUTUSAN", w("keputusan", 357.1), x=0.48, y=0.28, rot=-3, size=0.05),
    TAPE("TENTARA", w("tentara", 359.0), x=0.5, y=0.08, rot=2, size=0.05),
    TAPE("KONSTITUSI", w("konstitusi", 360.8), x=0.47, y=-0.12, rot=-2, size=0.05),
    STAMP("ANCAMAN", w("mengancam", 362.6), x=0.42, y=-0.34, size=0.075, rot=-9),
], cam={"tilt": 18, "az": -91, "roll": 0.7, "push": 0.06})

# ============================================================== CH 7 — EKSPEDISI LECLERC (6:05–6:51)
beat("78", w("Napoleon", 364.6) - 0.05, "G", [
    P("b78_napoleon_david", x=0, y=0, h=0.95, rot=1, z=0.12),
], cam={"tilt": 17, "az": -90, "roll": -0.6, "push": 0.1})
GLITCH(w("militer", 366.2))

beat("79", w("Pada", 366.7) - 0.05, "L", [
    MAP(ATL, w=1.95, h=1.12, rot=1.5, labels=[{"text": "Brest", "lon": -2, "lat": 50.5, "size": 0.04}],
        routes=[{"pts": [BREST, [-35, 36], CAP], "t0": w("ekspedisi", 369.1), "t1": we("Domingo", 371.0) + 0.3, "dash": False}]),
], cam={"tilt": 21, "az": -86, "roll": 0.8, "push": 0.08, "off": [0.5, 0.12], "drift": [-0.75, -0.15], "z": 0.06}, go="E")

beat("80", w("Pasukan", 371.7) - 0.1, "W", [
    P("b80_leclerc", x=-0.15, y=0, h=0.95, rot=-1.5, z=0.12),
    TAPE("JENDERAL LECLERC", w("Jenderal", 373.0), x=0.42, y=0.12, rot=3, size=0.05),
    HAND("ipar Napoleon", w("ipar", 375.4), x=0.45, y=-0.12, size=0.06, rot=-5, color="red"),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "push": 0.08})

beat("81", w("Awal", 376.5) - 0.1, "W", [
    P("b81_ocean_waves", x=0, y=0.03, h=0.62, rot=1.5, z=0.12, film=True),
    STAMP("1802", w("1802", 376.9), x=0.4, y=-0.25, size=0.1, rot=-7),
], cam={"tilt": 17, "az": -89, "roll": -0.7, "push": 0.1})

beat("82", w("Mereka", 380.4) - 0.1, "W", [
    P("b07_prise_du_cap_1802", x=0, y=0, h=0.95, rot=1.5, z=0.12, crop=[0.0, 0.05, 0.75, 0.85]),
], cam={"tilt": 18, "az": -92, "roll": 0.7, "off": [-0.1, 0], "drift": [0.18, 0]})

beat("82b", w("melainkan", 383.8) - 0.1, "W", [
    P("b19_toussaint_rijks", x=0, y=0, h=0.92, rot=-1.5, z=0.12, crop=[0.08, 0.05, 0.92, 0.8]),
    MARK("x", w("menyingkirkan", 387.2), x=0, y=0.02, w=0.55, h=0.6, dur=0.5),
], cam={"tilt": 17, "az": -90, "roll": -0.6, "push": 0.1})

beat("83", w("Perlawanan", 388.5) - 0.05, "G", [
    P("b83_crete_a_pierrot_1802", x=0, y=0.02, h=0.75, rot=-1.5, z=0.12),
], cam={"tilt": 18, "az": -89, "roll": -0.6, "push": 0.1})

beat("84", w("Pasukan", 392.0) - 0.1, "W", [
    P("b55_palm_tree_hill", x=0, y=0, h=0.66, rot=1, z=0.12, overlay={"asset": "b33_smoke", "opacity": 0.3}),
], cam={"tilt": 18, "az": -91, "roll": 0.7, "push": 0.1})

beat("85", w("Beberapa", 398.5) - 0.1, "W", [
    DOC("roster", x=0, y=0, w=0.85, h=1.0, rot=-1, z=0.08, seed=1802),
    MARK("strike", w("menyerah", 399.5), x=-0.05, y=0.12, w=0.55, h=0.06, dur=0.3),
    MARK("strike", w("menyerah", 399.5) + 0.35, x=-0.08, y=-0.04, w=0.5, h=0.06, dur=0.3),
], cam={"tilt": 19, "az": -90, "roll": -0.6, "push": 0.08})

beat("86", w("Dukungan", 401.3) - 0.1, "W", [
    DOC("petition", x=0, y=0, w=0.85, h=1.0, rot=1.5, z=0.08, seed=1806),
    MARK("tear", w("kekecewaan", 406.6), x=0.05, y=0, w=0.12, h=0.95, dur=0.4),
], cam={"tilt": 18, "az": -92, "roll": 0.6, "push": 0.08})

beat("87", w("Setelah", 407.6) - 0.1, "W", [
    P("b87_candle", x=0, y=0.02, h=0.62, rot=-1.5, z=0.12, film=True),
], cam={"tilt": 17, "az": -89, "roll": -0.6, "push": 0.1})

# ============================================================== CH 8 — BENTENG DE JOUX (6:51–7:38)
beat("88", w("Pada", 410.7) - 0.05, "L", [
    DOC("decree", x=0.18, y=0, w=0.8, h=0.98, rot=1.5, z=0.06, seed=1802),
    P("b88_lettre_napoleon_1802", x=-0.5, y=0.05, h=0.55, rot=-6, z=0.14),
    STAMP("MEI 1802", w("Mei", 410.9), x=0.2, y=-0.2, size=0.09, rot=-7),
], cam={"tilt": 18, "az": -90, "roll": 0.7, "push": 0.08}, go="S")

beat("89", w("Dia", 416.4) - 0.1, "W", [
    P("b89_green_hills", x=0, y=0.03, h=0.62, rot=1, z=0.12, film=True, video={"t0": 415.5, "rate": 0.8}),
], cam={"tilt": 17, "az": -92, "roll": -0.5, "off": [-0.1, 0], "drift": [0.2, 0]})

beat("90", w("Namun", 421.9) - 0.1, "W", [
    DOC("typed", x=0, y=0, w=1.0, h=0.72, rot=-1, z=0.08, seed=18026),
    TYPE("JUNI 1802", x=0, y=0.04, size=0.1, color="ink", align="center", words=[[w("Juni", 426.3), we("1802", 426.7)]], cursorUntil=0),
], cam={"tilt": 18, "az": -89, "roll": 0.6, "push": 0.08})

beat("91", w("dia", 428.2) - 0.03, "G", [
    DOC("cert", x=0, y=0, w=0.88, h=1.0, rot=1, z=0.08, seed=1702),
    STAMP("DITANGKAP", w("ditangkap", 428.4) + 0.05, x=0.0, y=0.18, size=0.1, rot=-7),
    TYPE("JAMINAN", x=0, y=-0.2, size=0.075, color="ink", align="center", words=ws("jaminan", 432.0), cursorUntil=0, z=0.2),
    MARK("strike", we("jaminan", 432.0) + 0.08, x=0, y=-0.209, w=0.48, h=0.06, dur=0.35, width=0.011),
], cam={"tilt": 18, "az": -91, "roll": -0.7, "push": 0.08})

beat("92", w("Toussaint", 433.8) - 0.1, "W", [
    MAP(ATL, w=1.95, h=1.12, rot=-1, routes=[{"pts": [CAP, [-35, 36], BREST], "t0": w("menyeberangi", 434.8), "t1": we("diumumkan", 439.6), "dash": True}]),
], cam={"tilt": 21, "az": -93, "roll": -0.7, "push": 0.06, "off": [-0.5, -0.1], "drift": [0.8, 0.16], "z": 0.06})

beat("93", w("Tetapi", 440.5) - 0.1, "W", [
    P("b19_toussaint_rijks", x=0, y=0, h=0.94, rot=1.5, z=0.12, drain={"t": w("disambut", 441.6), "dur": 1.2}),
], cam={"tilt": 17, "az": -90, "roll": 0.6, "push": 0.1})

beat("94", w("Dia", 443.2) - 0.05, "L", [
    P("b94_fort_de_joux", x=0, y=0.04, h=0.7, rot=-1, z=0.12),
    TAPE("BENTENG DE JOUX", w("Benteng", 445.2), x=-0.2, y=-0.31, rot=-3, size=0.055),
    MARK("circle", w("penjara", 446.7), x=0.08, y=0.12, w=0.4, h=0.3),
], cam={"tilt": 18, "az": -91, "roll": -0.6, "push": 0.1})

beat("95", w("Jauh", 448.9) - 0.1, "W", [
    P("b95_toussaint_au_fort_de_joux", x=0, y=0, h=0.72, rot=1, z=0.12),
], cam={"tilt": 16, "az": -90, "roll": 0.5, "push": 0.14})

beat("96", w("Pada", 452.7) - 0.1, "W", [
    P("b96_cellule_plaque", x=0, y=0.04, h=0.72, rot=-1, z=0.12),
    STAMP("7 APRIL 1803", w("1803", 453.6), x=0.2, y=-0.3, size=0.07, rot=-6),
], cam={"tilt": 16, "az": -91, "roll": -0.4, "push": 0.08})

# ============================================================== CH 9 — 1 JANUARI 1804 (7:38–8:53)
beat("97", w("Napoleon", 458.0) - 0.05, "L", [
    P("b02_napoleon_ingres", x=0, y=0, h=0.95, rot=1.5, z=0.12, crop=[0.1, 0.0, 0.9, 0.55]),
], cam={"tilt": 17, "az": -89, "roll": 0.6, "push": 0.12}, go="N")

beat("98", w("Tetapi", 462.8) - 0.1, "W", [
    P("b78_napoleon_david", x=0, y=0, h=0.92, rot=-1.5, z=0.12, crop=[0.15, 0.05, 0.85, 0.6]),
], cam={"tilt": 18, "az": -92, "roll": -0.6, "push": 0.1})
GLITCH(w("tidak", 464.6))

beat("99a", w("Di", 466.5) - 0.1, "W", [
    P("b47_moi_libre_aussi_femme", x=0, y=0, h=0.92, rot=1.5, z=0.12, crop=[0.1, 0.05, 0.9, 0.8]),
], cam={"tilt": 17, "az": -89, "roll": 0.6, "push": 0.12})

beat("99", w("Perancis", 470.9) - 0.1, "W", [
    P("b42_decret_abolition_1794", x=0, y=0, h=0.95, rot=-1, z=0.12),
    STAMP("DIPULIHKAN", w("memulihkan", 472.0), x=0.05, y=-0.05, size=0.095, rot=-10),
], cam={"tilt": 18, "az": -90, "roll": 0.7, "push": 0.1})

beat("100", w("Perlawanan", 474.8) - 0.1, "W", [
    P("b83_crete_a_pierrot_1802", x=0, y=0, h=0.82, rot=1.5, z=0.12, crop=[0.25, 0.1, 1.0, 1.0]),
], cam={"tilt": 18, "az": -91, "roll": -0.6})

beat("101", w("sementara", 477.0) - 0.05, "G", [
    P("b101_aedes_aegypti", x=0, y=0.04, h=0.66, rot=-1, z=0.12),
    TAPE("DEMAM KUNING", w("demam", 477.9), x=-0.25, y=-0.3, rot=-3, size=0.055),
    MARK("circle", w("kuning", 478.2), x=0.05, y=0.06, w=0.55, h=0.38),
], cam={"tilt": 17, "az": -89, "roll": 0.6})

beat("102", w("Perjuangan", 480.5) - 0.1, "W", [
    P("b102_dessalines", x=-0.5, y=0, h=0.86, rot=-2, z=0.14),
    TITLE("JEAN-JACQUES\nDESSALINES", w("Jean", 483.7), x=0.32, y=0.03, size=0.08, lineHeight=1.12),
], cam={"tilt": 17, "az": -91, "roll": -0.6, "push": 0.07})

beat("103", w("Setelah", 485.3) - 0.1, "W", [
    P("b55_palm_tree_hill", x=0, y=0, h=0.66, rot=-1, z=0.12, crop=[0.0, 0.15, 1.0, 1.0], overlay={"asset": "b33_smoke", "opacity": 0.3}),
], cam={"tilt": 18, "az": -89, "roll": 0.6, "push": 0.1})

beat("104", w("Pada", 489.8) - 0.05, "L", [
    P("b104_acte_independance_1804", x=-0.48, y=0, h=0.9, rot=-1.5, z=0.12),
    TITLE("1 JANUARI\n1804", w("Januari", 490.4) - 0.3, x=0.42, y=0.03, size=0.095, lineHeight=1.15),
    MARK("circle", w("kemerdekaan", 493.5), x=-0.48, y=0.33, w=0.48, h=0.13),
], cam={"tilt": 17, "az": -90, "roll": -0.6, "push": 0.07})

beat("105", w("Negara", 494.4) - 0.1, "W", [
    MAP(HISP, w=1.85, h=0.92, rot=1, fills=[{"id": HAITI, "t": w("Negara", 494.4) + 0.3, "dur": 0.6, "alpha": 0.55}], rings=[{"lon": -72.6, "lat": 19.0, "t": w("mengguncang", 499.5), "dur": 2.0}]),
], cam={"tilt": 19, "az": -92, "roll": 0.6, "push": 0.08})

beat("106", w("Kemerdekaan", 501.5) - 0.1, "W", [
    MAP(ATL, w=1.95, h=1.12, rot=1, rings=[{"lon": -72.6, "lat": 19.0, "t": w("melampaui", 504.0), "dur": 3.0}]),
], cam={"tilt": 21, "az": -90, "roll": -0.6, "push": -0.05, "off": [-0.3, -0.12], "drift": [0.2, 0.08], "z": 0.06})

beat("106b", w("Keberhasilannya", 506.0) - 0.1, "W", [
    P("b31_moi_libre_aussi_homme", x=0, y=0, h=0.9, rot=1.5, z=0.12, crop=[0.1, 0.05, 0.9, 0.85]),
], cam={"tilt": 17, "az": -91, "roll": 0.6, "push": 0.12})

beat("106c", w("dilawan", 510.5) - 0.1, "W", [
    P("b17_code_noir_1685", x=0, y=0, h=0.95, rot=-1.5, z=0.12, crop=[0.0, 0.0, 1.0, 0.7]),
    MARK("underline", w("milik", 513.8), x=0, y=0.05, w=0.5, h=0.08),
], cam={"tilt": 18, "az": -91, "roll": -0.6, "push": 0.1})

beat("107a", w("Namun", 514.9) - 0.1, "W", [
    P("b104_acte_independance_1804", x=0, y=0, h=0.95, rot=1, z=0.12, crop=[0.05, 0.0, 0.95, 0.45]),
], cam={"tilt": 17, "az": -89, "roll": -0.6, "push": 0.1})

beat("107", w("Negeri", 518.0) - 0.1, "W", [
    P("b107_citadelle_laferriere", x=0, y=0.05, h=0.7, rot=-1, z=0.12),
    TAPE("CITADELLE LAFERRIÈRE · 1805–1820", w("Negeri", 518.0) + 0.6, x=-0.05, y=-0.32, rot=-2, size=0.036),
], cam={"tilt": 18, "az": -91, "roll": 0.6, "off": [-0.08, 0], "drift": [0.14, 0]})

beat("107c", w("tekanan", 521.9) - 0.1, "W", [
    P("b09_map_stockdale_1800", x=0, y=0.02, h=0.62, rot=1, z=0.12),
    MARK("arrow", w("bermusuhan", 523.6), x=-0.45, y=0.2, w=0.35, h=0.25, **{"from": [-0.45, 0.4], "to": [0.4, -0.35]}),
    MARK("arrow", w("bermusuhan", 523.6) + 0.3, x=0.45, y=0.22, w=0.35, h=0.25, **{"from": [0.45, 0.4], "to": [-0.4, -0.35]}),
    MARK("arrow", w("kekuatan", 524.8), x=0.0, y=-0.36, w=0.3, h=0.2, **{"from": [0.0, -0.45], "to": [0.0, 0.4]}),
], cam={"tilt": 19, "az": -90, "roll": -0.6, "push": 0.08})

beat("108", w("Kebebasan", 527.3) - 0.05, "T", [
    CARD(),
    TYPE("KEBEBASAN\nTELAH DIREBUT", y=0.04, size=0.1, align="center", words=ws("Kebebasan telah direbut,", 527.3), cursorUntil=532.6),
], cam={"tilt": 15, "az": -94, "roll": -1.0, "push": 0.05, "z": 0.35})

# ============================================================== CH 10 — PENUTUP (8:53–9:48)
beat("109", w("Toussaint", 533.1) - 0.05, "L", [
    P("b109_buste_fort_de_joux", x=0, y=0, h=0.92, rot=-1, z=0.12),
], cam={"tilt": 16, "az": -90, "roll": 0.5, "push": 0.12}, go="E")

beat("110", w("Dia", 539.2) - 0.1, "W", [
    P("b05_toussaint_bust", x=-0.48, y=0.02, h=0.62, rot=-3, z=0.12),
    P("b102_dessalines", x=0.42, y=-0.02, h=0.62, rot=3, z=0.12),
], cam={"tilt": 19, "az": -91, "roll": -0.6, "push": 0.06})

beat("111", w("Tetapi", 542.3) - 0.1, "W", [
    P("b52_toussaint_horseback_met", x=-0.42, y=0, h=0.9, rot=-1.5, z=0.12),
    TAPE("KEPEMIMPINAN", w("kepemimpinan", 543.4), x=0.4, y=0.22, rot=-3, size=0.055),
    TAPE("STRATEGI", w("strategi", 544.4), x=0.42, y=0.02, rot=2, size=0.055),
    TAPE("PERJUANGAN", w("perjuangan", 545.3), x=0.38, y=-0.18, rot=-2, size=0.055),
], cam={"tilt": 18, "az": -90, "roll": 0.6, "push": 0.06})

beat("112", w("Sejarah", 549.8) - 0.1, "W", [
    P("b112_pantheon_memorial", x=0, y=0.03, h=0.7, rot=1, z=0.12),
], cam={"tilt": 17, "az": -89, "roll": 0.6, "push": 0.12})

beat("112b", w("Padahal", 554.0) - 0.1, "W", [
    P("b20_toussaint_a_cheval", x=0, y=0, h=0.92, rot=-1.5, z=0.12, crop=[0.0, 0.0, 1.0, 0.75]),
    MARK("q", w("rumit", 557.2) - 0.2, x=0.4, y=0.2, w=0.16, h=0.28, dur=0.5),
], cam={"tilt": 17, "az": -91, "roll": -0.6, "push": 0.1})

beat("113", w("Dia", 557.8) - 0.1, "W", [
    DOC("typed", x=0, y=0, w=1.25, h=0.9, rot=-1, z=0.04, seed=1803, dim=0.35),
    TAPE("PEJUANG", w("memperjuangkan", 558.0), x=-0.38, y=0.2, rot=-3, size=0.055),
    TAPE("ATURAN KERAS", w("memaksakan", 560.6), x=0.38, y=0.2, rot=3, size=0.055, color="red"),
    TAPE("MELAWAN KUASA", w("menantang", 562.5), x=-0.38, y=-0.14, rot=2, size=0.055),
    TAPE("MEMPERTAHANKAN\nKUASA", w("mempertahankan", 565.5), x=0.38, y=-0.16, rot=-2, size=0.05, color="red"),
    MARK("line", w("Dia", 557.8) + 0.2, x=0, y=0.02, w=0.8, h=0.05, rot=90, dur=0.5),
], cam={"tilt": 19, "az": -90, "roll": 0.6, "push": 0.06})

beat("114", w("Dan", 567.6) - 0.1, "W", [
    P("b95_toussaint_au_fort_de_joux", x=0, y=0, h=0.72, rot=-1.5, z=0.12, crop=[0.15, 0.0, 0.85, 1.0]),
], cam={"tilt": 17, "az": -91, "roll": -0.6, "push": 0.12})

beat("114b", w("Sementara", 571.0) - 0.1, "W", [
    P("b104_acte_independance_1804", x=0, y=0, h=0.95, rot=1.5, z=0.12, crop=[0.0, 0.3, 1.0, 1.0]),
], cam={"tilt": 18, "az": -89, "roll": 0.6, "push": 0.1})
GLITCH(w("kemenangan", 574.6))

beat("115", w("Napoleon", 575.4) - 0.1, "W", [
    P("b115_pantheon_inscription", x=0, y=0.03, h=0.52, rot=-1, z=0.12),
], cam={"tilt": 17, "az": -90, "roll": -0.5, "off": [-0.15, 0], "drift": [0.28, 0]})

beat("116", w("Tetapi", 578.6) - 0.05, "T", [
    CARD(),
    TYPE("GAGASAN TAK BISA\nDIKURUNG.", y=0.04, size=0.095, align="center", t0=w("mengurung", 580.5), t1=w("Saint", 582.5), cursorUntil=DUR),
], cam={"tilt": 15, "az": -90, "roll": 0.6, "push": 0.08, "z": 0.35})
