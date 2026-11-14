"""Salin isi Mentahan.zip (Google Drive) ke assets/ dengan nama file sesuai daftar."""
import shutil, sys
from pathlib import Path
src = Path(sys.argv[1]); dst = Path(__file__).resolve().parent.parent / "assets"
alt = dst / "_alt"; alt.mkdir(parents=True, exist_ok=True)
F = {
 "TU01_diderot-van-loo.jpg": "File/Van_Loo_-_Denis_Diderot_(1767).jpg",
 "TU03_seneca_nobg.png": "File/Seneca_no_background.png",
 "TU04_vonnegut_nobg.png": "File/91555.png",
 "TU05_heller.jpg": "File/Joseph_Heller_circa_1979.jpg",
 "TU07_kahneman.jpg": "File/Daniel_Kahneman_(3283955327).jpg",
 "FT01_uang-jatuh.mp4": "File/855197-uhd_3840_2160_30fps.mp4",
 "FT02_ponsel-malam.mp4": "File/6943530-uhd_4096_2160_25fps.mp4",
 "FT03_membuka-kado.mp4": "File/5900168-uhd_4096_2160_30fps.mp4",
 "FT04_ngobrol-kopi.mp4": "File/13324066-uhd_2160_3840_24fps.mp4",
 "FT05_tuang-kopi.mp4": "File/7594672-hd_1920_1080_25fps.mp4",
 "FT06_paket-di-pintu.mp4": "File/13443899-uhd_2160_3840_24fps.mp4",
 "FT07_perumahan-udara.mp4": "File/12558345_3840_2160_24fps.mp4",
 "FT08_scroll-medsos.mp4": "File/4199353-uhd_3840_2160_25fps.mp4",
 "FT09_uang-closeup.mp4": "File/6590465-uhd_4096_2160_25fps.mp4",
 "FT10_hujan-jendela.mp4": "File/6313013-uhd_3840_2160_24fps.mp4",
 "FT11_cahaya-jendela.mp4": "File/5155190-hd_1920_1080_30fps.mp4",
 "FT12_rumah-malam.mp4": "File/3051693-hd_1920_1080_24fps.mp4",
 "FT13_menulis-jurnal.mp4": "File/5708387-uhd_3840_2160_25fps.mp4",
 "FT14_membuka-buku.mp4": "File/6185249-uhd_4096_2160_30fps.mp4",
 "PT01_peta-illinois-1850.jpg": "File/1850_Cowperthwait_Map_of_Illinois_-_Geographicus_-_IL-m-50.jpg",
 "PT02_peta-swedia-1850.jpg": "File/1850_Mitchell_Map_of_Sweden_and_Norway_-_Geographicus_-_SwedenNorway-m-50.jpg",
 "PT03_peta-spanyol-1850.jpg": "File/1850_Mitchell_Map_of_Spain_and_Portugal_-_Geographicus_-_SpainPortugal-mitchell-1850.jpg",
 "PT04_peta-amerika-1867.jpg": "File/1867_Mitchell_Map_of_the_United_States_-_Geographicus_-_UnitedStates-mitchell-1867.jpg",
 "DK01_komik-joneses-1921.png": "File/Keeping_up_with_the_joneses.png",
 "DK02_komik-joneses-panel-1920.png": "File/Keeping_up_with_the_Joneses_panel.png",
 "DK03_diagram-rpe-referensi.png": "File/RPE-Hypothesis.png",
 "LK01_mesin-undian-lotre.jpg": "File/Texas_Lottery_drawing.jpg",
 "LK02_monyet-rhesus_nobg.png": "File/91583.png",
 "LK03_molekul-dopamin.png": "File/Dopamine_chemical_structure.png",
 "LK04_state-street-chicago-1893.jpg": "File/State_Street,_Chicago,_North_from_Quincy_Street.jpg",
 "LK05_ruang-kelas-1899.jpg": "File/Classroom_with_students_and_teacher,_Washington,_D.C._LCCN2001703720.jpg",
 "LK06_upacara-medali-1912.jpg": "File/Duke_Kahanamoku_accepting_the_Olympic_Gold_Medal_from_King_Gustav,_Stockholm,_Sweden_1912.jpg",
 "LK07_stadion-montjuic.jpg": "File/Estadi_Olímpic_Lluís_Companys.jpg",
 "LK08_medali-olimpiade-sumber.png": "File/91591.png",
 "LK09_kursi-prancis-1735_nobg.png": "File/91593.png",
 "LK10_meja-tulis-1760_nobg.png": "File/91595.png",
 "LK11_ruang-croome-court.jpg": "File/DP341255.jpg",
 "LK12_timbangan_nobg.png": "File/91598.png",
 "LK13_tangga-spiral.jpg": "File/pexels-photo-26202869.jpg",
 "LK14_polaroid-di-meja.jpg": "File/pexels-photo-32805946.jpg",
 "LS01_treadmill-brixton-1817.jpg": "File/Treadmill_at_Brixton_Prison_in_London.jpg",
 "LS02_treadmill-wellcome.jpg": "File/Men_standing_in_a_frame_treading_on_the_boards_of_a_treadmil_Wellcome_V0041192.jpg",
 "LS03_undian-lotre-1809.jpg": "File/Microcosm_of_London_Plate_053_-_Lottery_Drawing,_Cooper's_Hall.jpg",
 "LS04_gray-mata.png": "File/Gray869.png",
 "LS05_gray-hidung.png": "File/Gray771.png",
 "LS06_gray-otak.png": "File/Gray727.svg.png",
 "LS07_lukisan-gua-lascaux.jpg": "File/Lascaux,_replica_03.jpeg",
 "LS08_zaman-batu-vasnetsov.jpg": "File/Stone_age_by_Vasnetsov_03.jpg",
 "TX01_kertas-tua.jpg": "File/pexels-photo-5102219.jpg",
 "TX02_papan-gabus.jpg": "File/pexels-photo-5640940.jpg",
 "_alt/heller-kedua_nobg.png": "File/91558.png",
 "_alt/potret-bukan-diderot_nobg.png": "File/91552.png",
}
for name, rel in F.items():
    s = src / rel; d = dst / name
    if not s.exists(): print("TIDAK ADA:", rel); continue
    if d.exists() and d.stat().st_size != s.stat().st_size and not name.startswith("_alt"):
        shutil.move(d, alt / d.name)  # simpan versi unduhan otomatis sebagai cadangan
    shutil.copy2(s, d)
print("selesai:", len(F))
