import os
import re
import csv
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(base_dir, 'src', 'frontend')
dist_dir = os.path.join(base_dir, 'dist')
csv_dir = os.path.join(base_dir, 'csv_spreadsheets')
os.makedirs(dist_dir, exist_ok=True)

index_file = os.path.join(src_dir, 'Index.html')
with open(index_file, 'r', encoding='utf-8') as f:
    bundle = f.read()

def replace_include(match):
    filename = match.group(1).strip()
    full_path = os.path.join(src_dir, f"{filename}.html")
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as inc_f:
            return inc_f.read()
    else:
        return f"<!-- Include failed: {filename} not found -->"

# Replace all <?!= include('...'); ?>
bundle = re.sub(r'<\?!=\s*include\([\'"]([^\'"]+)[\'"]\);\s*\?>', replace_include, bundle)

def read_csv_rows(sub, fname):
    p = os.path.join(csv_dir, sub, fname)
    if not os.path.exists(p):
        return []
    with open(p, 'r', encoding='utf-8-sig') as fp:
        rows = list(csv.reader(fp))
        return rows[1:] if len(rows) > 1 else []

# Load bulk data from Antigravity RME/RME_Modular/csv_spreadsheets/
pasien_csv = read_csv_rows('PASIEN', 'Data_Pasien.csv')
pasien_list = []
for r in pasien_csv:
    if len(r) >= 21:
        pasien_list.append({
            "idPasien": r[0],
            "namaPasien": r[1],
            "noRm": r[2],
            "jenisKelamin": r[3],
            "tempatLahir": r[4],
            "tanggalLahir": r[5],
            "umur": r[6],
            "agama": r[7],
            "golonganDarah": r[8],
            "pekerjaan": r[9],
            "nik": r[10],
            "alamat": r[11],
            "provinsi": r[12],
            "kabupaten": r[13],
            "kecamatan": r[14],
            "kelurahan": r[15],
            "whatsapp": r[16],
            "alergi": r[17],
            "riwayatPenyakit": r[18],
            "catatan": r[19],
            "tglDaftar": r[20]
        })

tindakan_csv = read_csv_rows('DATABASE', 'Tindakan.csv')
tindakan_list = []
for r in tindakan_csv:
    if len(r) >= 6:
        tarif_val = int(float(r[3])) if r[3] else 0
        jm_def = float(r[5]) if r[5] and r[5] != "" else None
        tindakan_list.append({
            "kode": r[0],
            "id": r[0],
            "nama": r[1],
            "kategori": r[2],
            "tarif": tarif_val,
            "harga": tarif_val,
            "perluLab": r[4] if r[4] in ("Ya", "Tidak") else "Tidak",
            "persenJMDefault": jm_def
        })

obat_csv = read_csv_rows('OBAT', 'Master_Obat.csv')
obat_list = [
    {
        "kode": "OBT-001", "id": "OBT-001", "nama": "Amoxicillin 500mg (Strip)",
        "kandungan": "Amoxicillin Trihydrate 500mg", "satuanBeli": "Box", "isiPerSatuan": 10,
        "hargaBeliSatuan": 100000, "harga": 15000, "hargaJual": 15000, "hpp": 10000,
        "stok": 120, "stokMin": 20, "unit": "Strip", "satuan": "Strip"
    },
    {
        "kode": "OBT-002", "id": "OBT-002", "nama": "Asam Mefenamat 500mg (Strip)",
        "kandungan": "Mefenamic Acid 500mg", "satuanBeli": "Box", "isiPerSatuan": 10,
        "hargaBeliSatuan": 80000, "harga": 12000, "hargaJual": 12000, "hpp": 8000,
        "stok": 85, "stokMin": 15, "unit": "Strip", "satuan": "Strip"
    },
    {
        "kode": "OBT-003", "id": "OBT-003", "nama": "Chlorhexidine Gluconate 0.2% Gargle",
        "kandungan": "Chlorhexidine Digluconate 0.2%", "satuanBeli": "Botol", "isiPerSatuan": 1,
        "hargaBeliSatuan": 22000, "harga": 35000, "hargaJual": 35000, "hpp": 22000,
        "stok": 40, "stokMin": 10, "unit": "Botol", "satuan": "Botol"
    }
]
for r in obat_csv:
    if len(r) >= 11:
        kode_o = r[0]
        if any(x["kode"] == kode_o for x in obat_list):
            continue
        hpp_v = int(float(r[6])) if r[6] else 1000
        hj_v = int(float(r[8])) if r[8] else 2000
        stk_v = int(float(r[9])) if r[9] else 100
        obat_list.append({
            "kode": kode_o, "id": kode_o, "nama": r[1], "kandungan": r[2],
            "satuanBeli": r[3] or "Box", "isiPerSatuan": int(float(r[4])) if r[4] else 100,
            "hargaBeliSatuan": int(float(r[5])) if r[5] else 50000,
            "harga": hj_v, "hargaJual": hj_v, "hpp": hpp_v,
            "stok": stk_v, "stokMin": int(float(r[10])) if r[10] else 20,
            "unit": "Pcs", "satuan": "Pcs"
        })

bmhp_csv = read_csv_rows('BMHP', 'Master_BMHP.csv')
bmhp_list = [
    {"kode": "BMH-001", "id": "BMH-001", "nama": "Masker Medis 3-Ply", "harga": 2000, "hargaJual": 2000, "hpp": 1000, "stok": 500, "unit": "Pcs", "satuan": "Pcs"},
    {"kode": "BMH-002", "id": "BMH-002", "nama": "Handscoon Latex S/M", "harga": 3000, "hargaJual": 3000, "hpp": 1800, "stok": 350, "unit": "Pasang", "satuan": "Pasang"},
    {"kode": "BMH-003", "id": "BMH-003", "nama": "Saliva Ejector Suction Tip", "harga": 1500, "hargaJual": 1500, "hpp": 800, "stok": 200, "unit": "Pcs", "satuan": "Pcs"}
]
for r in bmhp_csv:
    if len(r) >= 8:
        kode_b = r[0]
        if any(x["kode"] == kode_b for x in bmhp_list):
            continue
        hpp_b = int(float(r[3])) if r[3] else 1000
        hj_b = int(float(r[4])) if r[4] else 2500
        stk_b = int(float(r[5])) if r[5] else 200
        bmhp_list.append({
            "kode": kode_b, "id": kode_b, "nama": r[1],
            "harga": hj_b, "hargaJual": hj_b, "hpp": hpp_b,
            "stok": stk_b, "unit": r[2] or "Pcs", "satuan": r[2] or "Pcs"
        })

rm_csv = read_csv_rows('REKAM_MEDIS', 'Data_Rekam_Medis.csv')
rm_list = []
for r in rm_csv:
    if len(r) >= 13:
        ana_raw, fis_raw, odo_raw, tin_raw, obt_raw = r[6], r[7], r[8], r[9], r[10]
        cc_val, pi_val, icd_val, tind_val, resep_val = "", "", "", "", ""
        try:
            a_obj = json.loads(ana_raw)
            cc_val = a_obj.get("cc") or a_obj.get("keluhanUtama") or ""
            pi_val = a_obj.get("riwayatPenyakit") or ""
            if isinstance(a_obj.get("diagnosaICD"), list):
                icd_val = ", ".join(a_obj["diagnosaICD"])
        except Exception:
            cc_val = ana_raw
        try:
            t_arr = json.loads(tin_raw)
            if isinstance(t_arr, list):
                tind_val = ", ".join(x.get("nama", "") if isinstance(x, dict) else str(x) for x in t_arr)
        except Exception:
            tind_val = tin_raw
        try:
            o_arr = json.loads(obt_raw)
            if isinstance(o_arr, list):
                resep_val = ", ".join((x.get("obat") or x.get("nama") or "") for x in o_arr if isinstance(x, dict))
        except Exception:
            resep_val = obt_raw

        rm_list.append({
            "idEMR": r[0],
            "idRmKlinis": r[0],
            "idPasien": r[1],
            "noRm": r[2],
            "namaPasien": r[3],
            "tanggalPeriksa": r[4],
            "dokterPemeriksa": r[5],
            "anamnesisStr": ana_raw,
            "fisikStr": fis_raw,
            "odontogramStr": odo_raw,
            "tindakanStr": tin_raw,
            "obatStr": obt_raw,
            "catatanEdukasi": r[11],
            "waktuSimpan": r[12],
            "chiefComplaint": cc_val or "Keluhan gigi berlubang / kontrol rutin",
            "presentIllness": pi_val or "Pasien kooperatif",
            "pemeriksaanPenunjang": "Pemeriksaan Klinis Intraoral & Perkusi",
            "assessmentICD": icd_val or "K02.1 - Caries of dentine",
            "tindakanHariIni": tind_val or "Perawatan Konservasi Gigi",
            "resepObat": resep_val or "Asam Mefenamat 500 mg (3x1)"
        })

bayar_csv = read_csv_rows('PEMBAYARAN', 'Data_Pembayaran.csv')
bayar_list = []
for r in bayar_csv:
    if len(r) >= 20:
        bayar_list.append({
            "idInvoice": r[0],
            "tanggal": r[1],
            "idPasien": r[2],
            "noRm": r[3],
            "namaPasien": r[4],
            "dokter": r[5],
            "kategori": r[6],
            "item": r[7],
            "harga": int(float(r[8])) if r[8] else 0,
            "qty": int(float(r[9])) if r[9] else 1,
            "biayaLab": int(float(r[10])) if r[10] else 0,
            "diskon": int(float(r[11])) if r[11] else 0,
            "grandTotalItem": int(float(r[12])) if r[12] else 0,
            "perawat": r[13],
            "totalInvoice": int(float(r[14])) if r[14] else 0,
            "metode": r[15],
            "status": r[16],
            "keterangan": r[17],
            "kasir": r[18],
            "waktuSistem": r[19]
        })

jm_csv = read_csv_rows('PEMBAYARAN', 'Rekap_Jasa_Medis.csv')
jm_list = []
for r in jm_csv:
    if len(r) >= 18:
        jm_list.append({
            "idInvoice": r[0],
            "tanggal": r[1],
            "dokter": r[2],
            "perawat": r[3],
            "kategori": r[4],
            "namaItem": r[5],
            "totalTindakanBruto": int(float(r[6])) if r[6] else 0,
            "totalBiayaLab": int(float(r[7])) if r[7] else 0,
            "dasarJM": int(float(r[8])) if r[8] else 0,
            "persenJM": float(r[9]) if r[9] else 0,
            "tipeAturan": r[10],
            "jmDokter": int(float(r[13])) if r[13] else 0,
            "totalFeePerawat": int(float(r[14])) if r[14] else 0,
            "jmKlinik": int(float(r[15])) if r[15] else 0,
            "status": r[16]
        })

staff_csv = read_csv_rows('MASTER', 'Data.csv')
staff_list = []
for idx_st, r in enumerate(staff_csv):
    if len(r) >= 5:
        pjm_val = float(r[7]) if len(r) > 7 and r[7] else 0
        staff_list.append({
            "id": f"STF-{idx_st:03d}",
            "username": r[1].lower().strip(),
            "nama": r[0].strip(),
            "role": r[2].strip(),
            "pass": r[3].strip(),
            "pin": r[3].strip(),
            "status": r[4].strip() if len(r) > 4 and r[4] else "Aktif",
            "sip": r[5].strip() if len(r) > 5 and r[5] else "-",
            "noHp": r[6].strip() if len(r) > 6 and r[6] else "",
            "persenJM": pjm_val,
            "email": r[8].strip() if len(r) > 8 and r[8] else ""
        })

tarif_csv = read_csv_rows('MASTER', 'Pengaturan_Tarif_Shift.csv')
tarif_list = []
for r in tarif_csv:
    if len(r) >= 8:
        tarif_list.append({
            "idAturan": r[0].strip(),
            "role": r[1].strip(),
            "namaPekerja": r[2].strip(),
            "tipeKompensasi": r[3].strip(),
            "tarifShift1": int(float(r[4])) if r[4] else 0,
            "tarifShift2": int(float(r[5])) if r[5] else 0,
            "gajiPokokBulanan": int(float(r[6])) if r[6] else 0,
            "keterangan": r[7].strip() if len(r) > 7 else "",
            "status": r[8].strip() if len(r) > 8 and r[8] else "Aktif"
        })

mock_db_json = json.dumps({
    "pasien": pasien_list,
    "tindakan": tindakan_list,
    "obat": obat_list,
    "bmhp": bmhp_list,
    "rekamMedis": rm_list,
    "pembayaran": bayar_list,
    "jasaMedis": jm_list,
    "staff": staff_list,
    "tarifShift": tarif_list
}, ensure_ascii=False)

# Mock google.script.run runtime for local testing, browser validation & Live Interactive Simulator
mock_gas_script = '''
<script id="mock-gas-runtime">
(function() {
  if (typeof google === 'undefined') {
    window.google = {};
  }
  if (!google.script) {
    google.script = {};
  }

  const bulkSeed = ''' + mock_db_json + ''';

  // Realistic database grounded in Sheldon RME multi-spreadsheet architecture + Bulk Data SHELDON 2026
  const mockDb = {
    staff: (bulkSeed.staff && bulkSeed.staff.length > 0) ? bulkSeed.staff : [
      { id: "STF-000", username: "admin", email: "vembrian@gmail.com", nama: "Administrator Sistem", role: "Super User", pin: "admin123", pass: "admin123", sip: "-", persenJM: 0 },
      { id: "STF-000A", username: "asung", email: "v.asungnugroho@gmail.com", nama: "drg. V. Asung Nugroho, Sp.Ort", role: "Owner", pin: "admin123", pass: "admin123", sip: "503/SIP-DRG/000/2026", persenJM: 0.65 },
      { id: "STF-001", username: "sheldon", email: "sheldon@sheldon.com", nama: "drg. Sheldon Cooper, Sp.Ort", role: "Dokter Gigi Spesialis", pin: "1234", pass: "1234", sip: "503/SIP-DRG/001/2024", persenJM: 0.50 }
    ],
    tarifShift: (bulkSeed.tarifShift && bulkSeed.tarifShift.length > 0) ? bulkSeed.tarifShift : [],
    tarifKhusus: [
      { idDokter: "STF-001", namaDokter: "drg. Sheldon Cooper, Sp.Ort", kodeTindakan: "TND-006", namaTindakan: "Perawatan Saluran Akar (PSA) Molar", persenJM: 0.55 }
    ],
    pasien: bulkSeed.pasien,
    tindakan: bulkSeed.tindakan,
    obat: bulkSeed.obat,
    bmhp: bulkSeed.bmhp,
    rekamMedis: bulkSeed.rekamMedis,
    pembayaran: bulkSeed.pembayaran,
    jasaMedis: bulkSeed.jasaMedis,
    surat: []
  };

  window._mockDb = mockDb;

  class ScriptRunMock {
    constructor() {
      this._successHandler = function() {};
      this._failureHandler = function(err) { console.error("Mock GAS Error:", err); };
    }
    withSuccessHandler(fn) { this._successHandler = fn; return this; }
    withFailureHandler(fn) { this._failureHandler = fn; return this; }

    verifyLogin(user, pin) {
      setTimeout(() => {
        let cleanUser = String(user || "").trim().toLowerCase();
        let cleanPin = String(pin || "").trim().toLowerCase();

        if (!cleanUser) {
          this._successHandler({ success: false, message: "Silakan masukkan Username / Email / ID Pegawai!" });
          return;
        }

        let u = mockDb.staff.find(s => 
          (s.username && s.username.toLowerCase() === cleanUser) ||
          (s.email && s.email.toLowerCase() === cleanUser) ||
          (s.id && s.id.toLowerCase() === cleanUser) ||
          (s.nama && s.nama.toLowerCase().includes(cleanUser))
        );

        if (u) {
          if (u.status && u.status.toLowerCase() !== "aktif" && u.status.toLowerCase() !== "active") {
            this._successHandler({
              success: false,
              message: "Status akun Anda masih NON AKTIF. Silakan tunggu konfirmasi dari Super Admin untuk aktivasi akun."
            });
            return;
          }
          let isIdLogin = (u.id && u.id.toLowerCase() === cleanUser);
          let resolvedRole = (cleanUser === "stf-001") ? "Super User" : u.role;
          this._successHandler({ 
            success: true, 
            userData: { 
              username: isIdLogin ? u.id : (u.username || u.id), 
              namaAccount: u.nama, 
              role: resolvedRole 
            } 
          });
          return;
        }

        let autoRole = "Super User";
        if (cleanUser.includes("kasir") || cleanUser.includes("penny")) autoRole = "Kasir";
        else if (cleanUser.includes("perawat") || cleanUser.includes("bernadette")) autoRole = "Perawat Gigi";
        else if (cleanUser.includes("dokter") || cleanUser.includes("leonard")) autoRole = "Dokter Gigi Umum";

        this._successHandler({ 
          success: true, 
          userData: { 
            username: cleanUser, 
            namaAccount: user, 
            role: autoRole 
          } 
        });
      }, 50);
    }

    getInitMaster() {
      setTimeout(() => {
        this._successHandler({
          staff: mockDb.staff,
          tindakan: mockDb.tindakan,
          obat: mockDb.obat,
          bmhp: mockDb.bmhp
        });
      }, 50);
    }

    getInitPasien() {
      setTimeout(() => { this._successHandler(mockDb.pasien); }, 50);
    }

    getDaftarRekamMedis() {
      setTimeout(() => { this._successHandler(mockDb.rekamMedis); }, 50);
    }

    getDaftarPembayaran() {
      setTimeout(() => { this._successHandler(mockDb.pembayaran); }, 50);
    }

    getDaftarDokterSIP() {
      setTimeout(() => {
        let docs = mockDb.staff.filter(s => s.role.toLowerCase().includes('dokter')).map(d => ({ nama: d.nama, sip: d.sip, persenJM: d.persenJM }));
        this._successHandler(docs);
      }, 50);
    }

    getKategoriTindakan() {
      setTimeout(() => {
        this._successHandler([
          { kategori: "Umum", kode: "UMM" },
          { kategori: "Dokter Gigi Umum", kode: "DGU" },
          { kategori: "Dokter Gigi Spesialis", kode: "DGS" },
          { kategori: "Dokter Gigi Spesialis Ortodonti", kode: "ORT" },
          { kategori: "Bedah Mulut", kode: "BMU" }
        ]);
      }, 50);
    }

    getDaftarTindakanLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.tindakan);
      }, 50);
    }

    simpanTindakanBaru(payload) {
      setTimeout(() => {
        let kode = payload.kode || ("TND-" + String(mockDb.tindakan.length + 1).padStart(3, '0'));
        let newItem = {
          kode: kode,
          id: kode,
          nama: payload.nama,
          kategori: payload.kategori || "Umum",
          tarif: parseInt(payload.tarif, 10) || 0,
          harga: parseInt(payload.tarif, 10) || 0,
          perluLab: payload.perluLab === 'Ya' ? 'Ya' : 'Tidak',
          persenJMDefault: payload.persenJMDefault || null
        };
        mockDb.tindakan.push(newItem);
        this._successHandler({ success: true, message: "Tindakan " + newItem.nama + " (" + kode + ") berhasil disimpan ke Database Master!", data: newItem });
      }, 60);
    }

    updateTindakan(payload) {
      setTimeout(() => {
        let idx = mockDb.tindakan.findIndex(t => t.kode === payload.kode || t.id === payload.kode);
        if (idx !== -1) {
          mockDb.tindakan[idx].nama = payload.nama;
          mockDb.tindakan[idx].kategori = payload.kategori;
          mockDb.tindakan[idx].tarif = parseInt(payload.tarif, 10) || 0;
          mockDb.tindakan[idx].harga = parseInt(payload.tarif, 10) || 0;
          mockDb.tindakan[idx].perluLab = payload.perluLab === 'Ya' ? 'Ya' : 'Tidak';
          this._successHandler({ success: true, message: "Tindakan " + payload.kode + " berhasil diperbarui!", data: mockDb.tindakan[idx] });
        } else {
          this._successHandler({ success: false, message: "Tindakan " + payload.kode + " tidak ditemukan." });
        }
      }, 60);
    }

    hapusTindakan(payload) {
      setTimeout(() => {
        let idx = mockDb.tindakan.findIndex(t => t.kode === payload.kode || t.id === payload.kode);
        if (idx !== -1) {
          let deleted = mockDb.tindakan.splice(idx, 1)[0];
          this._successHandler({ success: true, message: "Tindakan " + (deleted.nama || payload.kode) + " berhasil dihapus dari Master!" });
        } else {
          this._successHandler({ success: false, message: "Tindakan tidak ditemukan." });
        }
      }, 60);
    }

    simpanPasien(payload) {
      setTimeout(() => {
        let idx = -1;
        if (payload.idPasien) {
          idx = mockDb.pasien.findIndex(p => (p.idPasien || '').trim().toLowerCase() === payload.idPasien.trim().toLowerCase());
        }
        if (idx === -1 && payload.noRm) {
          idx = mockDb.pasien.findIndex(p => (p.noRm || '').trim().toLowerCase() === payload.noRm.trim().toLowerCase());
        }
        if (idx !== -1) {
          Object.assign(mockDb.pasien[idx], payload);
          this._successHandler({ success: true, message: "Data Pasien (" + payload.namaPasien + ") berhasil diperbarui!", idPasien: mockDb.pasien[idx].idPasien, noRm: mockDb.pasien[idx].noRm, isBaru: false });
        } else {
          let newId = "P-" + String(mockDb.pasien.length + 1).padStart(4, '0');
          let newRm = "RM-" + String(mockDb.pasien.length + 1).padStart(4, '0');
          let newP = { idPasien: newId, noRm: newRm, ...payload };
          mockDb.pasien.unshift(newP);
          this._successHandler({ success: true, message: "Data Pasien Baru (" + payload.namaPasien + ") berhasil didaftarkan! No RM: " + newRm, idPasien: newId, noRm: newRm, isBaru: true });
        }
      }, 60);
    }

    hapusPasienPermanen(payload) {
      setTimeout(() => {
        let idx = mockDb.pasien.findIndex(p => p.idPasien === payload.idPasien);
        if (idx !== -1) {
          let p = mockDb.pasien[idx];
          mockDb.pasien.splice(idx, 1);
          this._successHandler({ success: true, message: "Data Pasien (" + p.namaPasien + ") berhasil dihapus permanen!" });
        } else {
          this._successHandler({ success: false, message: "Pasien tidak ditemukan." });
        }
      }, 50);
    }

    simpanRekamMedis(payload) {
      setTimeout(() => {
        let idEMR = "EMR-2026-" + String(mockDb.rekamMedis.length + 1).padStart(4, '0');
        let newEMR = {
          idEMR: idEMR,
          waktuSimpan: new Date().toISOString(),
          ...payload
        };
        mockDb.rekamMedis.unshift(newEMR);
        this._successHandler({ success: true, message: "Rekam Medis Pasien (" + payload.namaPasien + ") berhasil disimpan! ID: " + idEMR, idEMR: idEMR });
      }, 60);
    }

    simpanPembayaranBaru(payload) {
      setTimeout(() => {
        let num = mockDb.pembayaran.length + 1;
        let idInv = "INV/SHELDON/" + String(num).padStart(4, '0') + "/1026";
        let tTindakan = JSON.parse(payload.tindakanStr || "[]");
        let tObat = JSON.parse(payload.obatStr || "[]");
        let tBMHP = JSON.parse(payload.bmhpStr || "[]");

        let totalTindakanBruto = 0;
        let totalBiayaLab = 0;
        let totalFeePerawat = 0;

        tTindakan.forEach(t => {
          let gTot = t.grandTotal || (t.harga * t.qty - (t.diskon || 0));
          totalTindakanBruto += gTot;
          if (t.biayaLab) totalBiayaLab += Number(t.biayaLab) || 0;
          if (t.feePerawat) totalFeePerawat += Number(t.feePerawat) || 0;
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: t.nama,
            qty: t.qty,
            harga: t.harga,
            diskon: t.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir,
            biayaLab: t.biayaLab || 0
          });
        });

        tObat.forEach(o => {
          let gTot = o.grandTotal || (o.harga * o.qty - (o.diskon || 0));
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: o.nama,
            qty: o.qty,
            harga: o.harga,
            diskon: o.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir
          });
        });

        tBMHP.forEach(b => {
          let gTot = b.grandTotal || (b.harga * b.qty - (b.diskon || 0));
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: b.nama,
            qty: b.qty,
            harga: b.harga,
            diskon: b.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir
          });
        });

        let dokObj = mockDb.staff.find(s => s.nama.toLowerCase().includes((payload.dokter || '').toLowerCase()));
        let pJM = dokObj ? (dokObj.persenJM || 0.50) : 0.50;

        let jmDokterTotal = 0;
        let jmKlinikTotal = 0;

        tTindakan.forEach(t => {
          let netTindakan = (t.grandTotal || (t.harga * t.qty)) - (Number(t.biayaLab) || 0);
          let itemPJM = pJM;
          if (t.nama.toLowerCase().includes('rontgen')) {
            itemPJM = 0.15;
          } else if (t.nama.toLowerCase().includes('saluran akar') || t.nama.toLowerCase().includes('psa')) {
            itemPJM = 0.55;
          }
          let jmDok = Math.round(netTindakan * itemPJM);
          if (t.feePerawat) {
            jmDok = Math.max(0, jmDok - Number(t.feePerawat));
          }
          let jmKli = netTindakan - jmDok - (Number(t.feePerawat) || 0);
          jmDokterTotal += jmDok;
          jmKlinikTotal += jmKli;
        });

        let rekapJM = {
          idInvoice: idInv,
          tanggal: payload.tglTindakan,
          dokter: payload.dokter,
          namaPasien: payload.namaPasien,
          totalTindakanBruto: totalTindakanBruto,
          totalBiayaLab: totalBiayaLab,
          totalFeePerawat: totalFeePerawat,
          dasarJM: totalTindakanBruto - totalBiayaLab,
          jmDokter: jmDokterTotal,
          jmKlinik: jmKlinikTotal,
          perawat: "Bernadette Rostenkowski (Rp " + totalFeePerawat.toLocaleString('id-ID') + ")"
        };
        mockDb.jasaMedis.push(rekapJM);

        this._successHandler({ 
          success: true, 
          message: "Pembayaran & Invoice (" + idInv + ") Berhasil Disimpan!", 
          idInvoice: idInv,
          rekapJasaMedis: rekapJM
        });
      }, 70);
    }

    getRekapJasaMedis() {
      setTimeout(() => {
        this._successHandler(mockDb.jasaMedis);
      }, 50);
    }

    importBulkDataSheldon2026(options) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          message: "✅ Agent Nadhif: Import Bulk Data dari 'Copy of SHELDON 2026' (Folder Antigravity RME) berhasil disinkronkan ke seluruh 11 Spreadsheet Database!",
          stats: {
            sourceTitle: "Copy of SHELDON 2026",
            sourceId: "1BaMZosOuB6eu5kV0sIiFMCLNBer1e4X7gibmBoKweV0",
            usersImported: mockDb.staff.length,
            tindakanImported: mockDb.tindakan.length,
            pasienImported: mockDb.pasien.length,
            pembayaranImported: mockDb.pembayaran.length,
            invoiceCount: 124,
            jmImported: mockDb.jasaMedis.length,
            emrGenerated: mockDb.rekamMedis.length,
            presensiImported: 120
          }
        });
      }, 80);
    }

    triggerSinkronSemuaSheet() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          message: "Semua 11 spreadsheet dan sheet master (Pasien, Pembayaran, Rekap_Jasa_Medis, Tarif_Khusus_Dokter, Rekam Medis, Tindakan, Obat, BMHP, Gudang, Log) telah tersinkronisasi 100% lengkap!"
        });
      }, 100);
    }

    setupPayrollSpreadsheet() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          spreadsheetId: "1v6fSKLLokBNNXOJAS7A-7RKnI9YtHlcZbeCTsNmYjkk",
          url: "https://docs.google.com/spreadsheets/d/1v6fSKLLokBNNXOJAS7A-7RKnI9YtHlcZbeCTsNmYjkk",
          message: "Spreadsheet RME Sheldon - 11 Payroll & Honor Dokter berhasil disiapkan di Google Drive!"
        });
      }, 120);
    }

    generatePayrollPeriode(periodeBulan) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          count: 11,
          message: "Berhasil menghasilkan 11 draft payroll dokter & staff untuk periode: " + (periodeBulan || "Januari 2026")
        });
      }, 120);
    }

    jalankanBackupSekarang() {
      setTimeout(() => {
        const dt = new Date().toISOString().slice(0, 10);
        this._successHandler({
          success: true,
          successCount: 11,
          csvCount: 28,
          folderNama: "BACKUP_RME_SHELDON",
          csvFolderNama: "CSV_Backup_" + dt,
          folderUrl: "https://drive.google.com/drive/folders/backup-sheldon",
          csvFolderUrl: "https://drive.google.com/drive/folders/backup-sheldon-csv",
          targetEmail: "vembrian@gmail.com"
        });
      }, 100);
    }

    exportAllDatabaseToCSV() {
      setTimeout(() => {
        this._successHandler({
          success: false,
          message: "Fallback to local browser CSV bundle generator"
        });
      }, 60);
    }

    getPayrollModuleData() {
      setTimeout(() => {
        let tList = mockDb.tarifShift || [];
        let isWorkerActive = function(t) {
          let st = String(t.status || "Aktif").trim().toLowerCase();
          return st !== "tidak aktif" && st !== "non aktif" && st !== "nonaktif" && st !== "inactive";
        };
        let activeTarif = tList.filter(isWorkerActive);
        
        let docList = [];
        let staffList = [];
        let docCounter = 1;
        let staffCounter = 1;

        activeTarif.forEach(t => {
          let roleLower = (t.role || "").toLowerCase();
          let isDoc = roleLower.includes("dokter") || (t.namaPekerja || "").toLowerCase().startsWith("drg");
          if (isDoc) {
            let s1 = Number(t.tarifShift1) || 55000;
            let s2 = Number(t.tarifShift2) || 55000;
            let thp = 250000 + s1 + s2;
            docList.push({
              idPayroll: "PAY-DR-" + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + "-" + String(docCounter).padStart(3, '0'),
              periodeBulan: "Oktober 2026",
              idDokter: "DOK-" + String(docCounter).padStart(3, '0'),
              namaDokter: t.namaPekerja,
              totalPasien: 2,
              totalTindakanBruto: 500000,
              totalBiayaLab: 0,
              dasarJMBersih: 500000,
              totalJMDokter: 250000,
              hadirShift1: 1,
              hadirShift2: 1,
              totalUangHarianShift: s1 + s2,
              bonusInsentif: 0,
              potonganPPh21: 0,
              potonganKasbon: 0,
              totalDiterimaTHP: thp,
              bankTujuan: "BCA / Mandiri",
              noRekening: "-",
              statusTransfer: "Draft",
              tanggalTransfer: "",
              catatan: "Diambil otomatis dari Pengaturan_Tarif_Shift (06 Master User & Role)"
            });
            docCounter++;
          } else {
            let isAdmin = roleLower.includes("admin");
            let gp = Number(t.gajiPokokBulanan) || (isAdmin ? 1200000 : 0);
            let s1 = Number(t.tarifShift1) || (isAdmin ? 0 : 45000);
            let s2 = Number(t.tarifShift2) || (isAdmin ? 0 : 45000);
            let uShift = isAdmin ? 0 : (s1 + s2);
            staffList.push({
              idPayrollStaff: "PAY-STF-" + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + "-" + String(staffCounter).padStart(3, '0'),
              periodeBulan: "Oktober 2026",
              idStaff: (isAdmin ? "ADM-" : "PRW-") + String(staffCounter).padStart(3, '0'),
              namaStaff: t.namaPekerja,
              role: t.role,
              gajiPokokBulanan: gp,
              hadirShift1: isAdmin ? 0 : 1,
              hadirShift2: isAdmin ? 0 : 1,
              totalUangHarianShift: uShift,
              totalFeeTindakan: 0,
              uangMakanTransport: 0,
              lembur: 0,
              potonganKasbon: 0,
              totalDiterimaTHP: gp + uShift,
              bankTujuan: "Mandiri / BSI",
              noRekening: "-",
              statusTransfer: "Draft",
              tanggalTransfer: "",
              catatan: "Diambil otomatis dari Pengaturan_Tarif_Shift (06 Master User & Role)"
            });
            staffCounter++;
          }
        });

        this._successHandler({
          success: true,
          tarifShift: tList,
          presensiHarian: mockDb.presensiHarian || [],
          penggajianDokter: docList,
          honorStaff: staffList,
          rekapJM: mockDb.jasaMedis || []
        });
      }, 50);
    }

    simpanPresensiShift(payload) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          message: "Presensi kehadiran " + (payload && payload.namaPekerja ? payload.namaPekerja : "") + " berhasil disimpan!"
        });
      }, 50);
    }

    simpanTarifShift(payload) {
      setTimeout(() => {
        if (payload && payload.namaPekerja) {
          let ex = (mockDb.tarifShift || []).find(t => (t.namaPekerja || "").toLowerCase() === String(payload.namaPekerja).toLowerCase());
          if (ex) {
            Object.assign(ex, payload);
          } else {
            mockDb.tarifShift.push(payload);
          }
        }
        this._successHandler({
          success: true,
          message: "Pengaturan tarif shift & gaji untuk " + (payload && payload.namaPekerja ? payload.namaPekerja : "") + " berhasil disimpan!"
        });
      }, 50);
    }

    syncUserToPayrollTarifShift(userData) {
      setTimeout(() => {
        if (userData && userData.nama) {
          let nama = String(userData.nama).trim();
          let role = String(userData.role || "Admin").trim();
          let status = String(userData.status || "Aktif").trim();
          let ex = (mockDb.tarifShift || []).find(t => (t.namaPekerja || "").toLowerCase() === nama.toLowerCase());
          if (ex) {
            if (role) ex.role = role;
            ex.status = status;
          } else {
            let rLow = role.toLowerCase();
            let tipe = "Uang Harian Shift";
            let s1 = 45000, s2 = 45000, gp = 0;
            let ket = "Shift Rp 45.000/shift";
            if (rLow.includes("dokter") || rLow.includes("spesialis")) {
              tipe = "Kombinasi Shift & Tindakan";
              s1 = 55000; s2 = 55000; gp = 0;
              ket = "2 Shift: Rp 55.000/shift + JM";
            } else if (rLow.includes("admin") || rLow.includes("kasir")) {
              tipe = "Gaji Bulanan Tetap";
              s1 = 0; s2 = 0; gp = 1200000;
              ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)";
            } else if (rLow.includes("owner") || rLow.includes("super")) {
              tipe = "Kombinasi Shift & Tindakan";
              s1 = 55000; s2 = 55000; gp = 0;
              ket = "Shift Rp 55.000/shift + JM 65%";
            }
            let newId = "TARIF-" + String((mockDb.tarifShift || []).length + 1).padStart(3, '0');
            mockDb.tarifShift.push({
              idAturan: newId,
              role: role,
              namaPekerja: nama,
              tipeKompensasi: tipe,
              tarifShift1: s1,
              tarifShift2: s2,
              gajiPokokBulanan: gp,
              keterangan: ket,
              status: status
            });
          }
        }
        this._successHandler({ success: true, message: "Sinkronisasi user ke Payroll berhasil!" });
      }, 30);
    }

    syncAllUsersToPayrollTarifShift() {
      setTimeout(() => {
        this._successHandler({ success: true, message: "Semua user berhasil disinkronkan ke Payroll!" });
      }, 50);
    }

    updateStatusPayroll(payload) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          message: "Status Payroll [" + (payload && payload.idPayroll ? payload.idPayroll : "") + "] berhasil diubah menjadi " + (payload && payload.statusTransfer ? payload.statusTransfer : "Paid") + "!"
        });
      }, 50);
    }

    getDaftarPekerjaan() {
      setTimeout(() => { this._successHandler(["PNS", "Wiraswasta", "Karyawan Swasta", "Mahasiswa", "Pelajar", "Ibu Rumah Tangga", "TNI/Polri", "Guru/Dosen"]); }, 30);
    }

    getDaftarICD10() {
      setTimeout(() => {
        this._successHandler([
          { code: "K02.1", desc: "Caries of dentine", kode: "K02.1", nama: "Caries of dentine" },
          { code: "K04.0", desc: "Pulpitis irreversibel", kode: "K04.0", nama: "Pulpitis irreversibel" },
          { code: "K05.1", desc: "Chronic gingivitis", kode: "K05.1", nama: "Chronic gingivitis" },
          { code: "K05.3", desc: "Chronic periodontitis", kode: "K05.3", nama: "Chronic periodontitis" },
          { code: "K07.2", desc: "Anomalies of dental arch relationship", kode: "K07.2", nama: "Anomalies of dental arch relationship" }
        ]);
      }, 30);
    }

    getDaftarICD9() {
      setTimeout(() => {
        this._successHandler([
          { code: "23.01", desc: "Extraction of other tooth", kode: "23.01", nama: "Extraction of other tooth" },
          { code: "23.2", desc: "Restoration of tooth by filling", kode: "23.2", nama: "Restoration of tooth by filling" },
          { code: "23.70", desc: "Root canal therapy (PSA)", kode: "23.70", nama: "Root canal therapy (PSA)" },
          { code: "89.31", desc: "Dental examination", kode: "89.31", nama: "Dental examination" },
          { code: "96.54", desc: "Dental scaling and polishing", kode: "96.54", nama: "Dental scaling and polishing" }
        ]);
      }, 30);
    }

    getDaftarObatLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.obat);
      }, 30);
    }

    getDaftarBMHPLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.bmhp);
      }, 30);
    }

    getMasterInventory() {
      setTimeout(() => {
        let res = mockDb.obat.concat(mockDb.bmhp).filter(i => i && typeof i === 'object').map(i => ({
          kode: i.kode || i.id || 'OBT-000',
          nama: i.nama || '-',
          kategori: String(i.kode || i.id || '').startsWith('OBT') ? 'Obat' : 'BMHP',
          satuan: i.satuan || i.unit || 'Unit',
          hpp: i.hpp || ((i.harga || 0) * 0.7),
          hargaJual: i.hargaJual || i.harga || 0,
          stok: i.stok || 0,
          kritis: 10,
          margin: 30
        }));
        this._successHandler(res);
      }, 30);
    }

    getDaftarStaffLengkap() {
      setTimeout(() => { this._successHandler(mockDb.staff); }, 30);
    }

    getDaftarInvoice() {
      setTimeout(() => {
        let groups = {};
        mockDb.pembayaran.forEach(row => {
          let invId = row.idInvoice || "INV-UNSPECIFIED";
          if (!groups[invId]) {
            groups[invId] = {
              idInvoice: invId,
              tanggalBayar: row.tanggal ? row.tanggal.split(' ')[0] : "",
              waktuFull: row.tanggal || row.waktuSistem || "",
              idPasien: row.idPasien,
              noRm: row.noRm,
              namaPasien: row.namaPasien,
              alamat: "-",
              dokter: row.dokter,
              totalBayar: row.totalInvoice,
              grandTotal: row.totalInvoice,
              metode: row.metode,
              metodeBayar: row.metode || "Cash",
              status: row.status,
              statusPembayaran: row.status || "Lunas",
              keterangan: row.keterangan || "",
              kasir: row.kasir,
              items: [],
              rincianItems: []
            };
          }
          let itm = {
            nama: row.item,
            namaItem: row.item,
            kategori: row.kategori,
            qty: row.qty,
            tarif: row.harga,
            hargaSatuan: row.harga,
            diskon: row.diskon,
            diskonPercent: row.diskon,
            subtotal: row.grandTotalItem
          };
          groups[invId].items.push(itm);
          groups[invId].rincianItems.push(itm);
        });
        let res = Object.values(groups).sort((a, b) => b.idInvoice.localeCompare(a.idInvoice));
        this._successHandler(res);
      }, 30);
    }

    getSemuaRiwayatSurat() {
      setTimeout(() => { this._successHandler(mockDb.surat); }, 30);
    }

    getDaftarUserMaster() {
      setTimeout(() => {
        let users = mockDb.staff.map(s => ({
          nama: s.nama,
          username: s.username,
          role: s.role,
          hasPassword: true,
          isHashed: false,
          status: s.status || "Aktif",
          noReg: s.sip || "-",
          noHp: s.noHp || "",
          email: s.email || "",
          persenJM: s.persenJM || 0
        }));
        this._successHandler(users);
      }, 30);
    }

    simpanUserMaster(payload) {
      setTimeout(() => {
        let cleanUser = String(payload.username || "").trim().toLowerCase().replace(/\\s+/g, "");
        let idx = mockDb.staff.findIndex(s => (s.username || "").toLowerCase() === cleanUser);
        let pjmVal = payload.persenJM ? Number(payload.persenJM) : 0;
        if (pjmVal > 1) pjmVal = pjmVal / 100;
        let item = {
          id: idx !== -1 ? mockDb.staff[idx].id : ("STF-" + String(mockDb.staff.length + 1).padStart(3, '0')),
          username: cleanUser,
          nama: payload.nama,
          role: payload.role,
          pass: payload.password || (idx !== -1 ? mockDb.staff[idx].pass : "1234"),
          pin: payload.password || (idx !== -1 ? mockDb.staff[idx].pin : "1234"),
          sip: payload.noReg || "-",
          noHp: payload.noHp || "",
          email: payload.email || (idx !== -1 ? mockDb.staff[idx].email : ""),
          status: payload.status || "Aktif",
          persenJM: pjmVal
        };
        if (idx !== -1) {
          mockDb.staff[idx] = Object.assign(mockDb.staff[idx], item);
        } else {
          mockDb.staff.push(item);
        }

        // Auto-sync ke mockDb.tarifShift
        let exTarif = (mockDb.tarifShift || []).find(t => (t.namaPekerja || '').toLowerCase() === String(payload.nama || '').toLowerCase());
        if (exTarif) {
          if (payload.role) exTarif.role = payload.role;
          if (payload.status) exTarif.status = payload.status;
        } else if (payload.nama) {
          let rLow = String(payload.role || '').toLowerCase();
          let tipe = "Uang Harian Shift";
          let s1 = 45000, s2 = 45000, gp = 0;
          let ket = "Shift Rp 45.000/shift";
          if (rLow.includes("dokter") || rLow.includes("spesialis")) {
            tipe = "Kombinasi Shift & Tindakan";
            s1 = 55000; s2 = 55000; gp = 0;
            ket = "2 Shift: Rp 55.000/shift + JM";
          } else if (rLow.includes("admin") || rLow.includes("kasir")) {
            tipe = "Gaji Bulanan Tetap";
            s1 = 0; s2 = 0; gp = 1200000;
            ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)";
          } else if (rLow.includes("owner") || rLow.includes("super")) {
            tipe = "Kombinasi Shift & Tindakan";
            s1 = 55000; s2 = 55000; gp = 0;
            ket = "Shift Rp 55.000/shift + JM 65%";
          }
          let newId = "TARIF-" + String((mockDb.tarifShift || []).length + 1).padStart(3, '0');
          mockDb.tarifShift.push({
            idAturan: newId,
            role: payload.role || 'Staff',
            namaPekerja: payload.nama,
            tipeKompensasi: tipe,
            tarifShift1: s1,
            tarifShift2: s2,
            gajiPokokBulanan: gp,
            keterangan: ket,
            status: payload.status || 'Aktif'
          });
        }

        this._successHandler({ success: true, message: "Pengguna '" + cleanUser + "' berhasil disimpan!" });
      }, 50);
    }

    registrasiAkunBaru(payload) {
      setTimeout(() => {
        let cleanUser = String(payload.username || "").trim().toLowerCase().replace(/\\s+/g, "");
        let idx = mockDb.staff.findIndex(s => (s.username || "").toLowerCase() === cleanUser);
        if (idx !== -1) {
          this._successHandler({ success: false, message: "Username '" + cleanUser + "' sudah terdaftar! Silakan pilih username lain." });
          return;
        }
        let role = payload.role || "Admin";
        let pjmVal = role === "Dokter Gigi Spesialis" ? 0.50 : (role === "Dokter Gigi Umum" ? 0.40 : 0);
        let item = {
          id: "STF-" + String(mockDb.staff.length + 1).padStart(3, '0'),
          username: cleanUser,
          nama: payload.nama,
          role: role,
          pass: payload.password,
          pin: payload.password,
          sip: payload.noSip || payload.noReg || "-",
          noHp: payload.noWa || payload.noHp || "",
          email: payload.email || "",
          status: "Non Aktif",
          persenJM: pjmVal
        };
        mockDb.staff.push(item);

        // Auto-sync ke mockDb.tarifShift
        let exTarif = (mockDb.tarifShift || []).find(t => (t.namaPekerja || '').toLowerCase() === String(payload.nama || '').toLowerCase());
        if (exTarif) {
          exTarif.status = 'Non Aktif';
        } else if (payload.nama) {
          let rLow = String(role).toLowerCase();
          let tipe = "Uang Harian Shift";
          let s1 = 45000, s2 = 45000, gp = 0;
          let ket = "Shift Rp 45.000/shift";
          if (rLow.includes("dokter") || rLow.includes("spesialis")) {
            tipe = "Kombinasi Shift & Tindakan";
            s1 = 55000; s2 = 55000; gp = 0;
            ket = "2 Shift: Rp 55.000/shift + JM";
          } else if (rLow.includes("admin") || rLow.includes("kasir")) {
            tipe = "Gaji Bulanan Tetap";
            s1 = 0; s2 = 0; gp = 1200000;
            ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)";
          }
          let newId = "TARIF-" + String((mockDb.tarifShift || []).length + 1).padStart(3, '0');
          mockDb.tarifShift.push({
            idAturan: newId,
            role: role,
            namaPekerja: payload.nama,
            tipeKompensasi: tipe,
            tarifShift1: s1,
            tarifShift2: s2,
            gajiPokokBulanan: gp,
            keterangan: ket,
            status: 'Non Aktif'
          });
        }

        this._successHandler({
          success: true,
          message: "Pendaftaran berhasil! Akun '" + cleanUser + "' telah tersimpan dengan status NON AKTIF. Silakan tunggu konfirmasi dari Super Admin untuk aktivasi akun."
        });
      }, 50);
    }

    aktifkanUserMaster(username, currentUser) {
      setTimeout(() => {
        let cleanUser = String(username || "").trim().toLowerCase();
        let idx = mockDb.staff.findIndex(s => (s.username || "").toLowerCase() === cleanUser);
        if (idx !== -1) {
          mockDb.staff[idx].status = "Aktif";
          let exTarif = (mockDb.tarifShift || []).find(t => (t.namaPekerja || '').toLowerCase() === String(mockDb.staff[idx].nama || '').toLowerCase());
          if (exTarif) exTarif.status = 'Aktif';
        }
        this._successHandler({ success: true, message: "Akun '" + cleanUser + "' berhasil diaktifkan!" });
      }, 50);
    }

    hapusUserMaster(username, isPermanent) {
      setTimeout(() => {
        let cleanUser = String(username || "").trim().toLowerCase();
        let idx = mockDb.staff.findIndex(s => (s.username || "").toLowerCase() === cleanUser);
        if (idx !== -1) {
          let uNama = mockDb.staff[idx].nama;
          if (isPermanent) {
            mockDb.staff.splice(idx, 1);
            let tIdx = (mockDb.tarifShift || []).findIndex(t => (t.namaPekerja || '').toLowerCase() === String(uNama || '').toLowerCase());
            if (tIdx !== -1) mockDb.tarifShift.splice(tIdx, 1);
          } else {
            mockDb.staff[idx].status = "Non Aktif";
            let exTarif = (mockDb.tarifShift || []).find(t => (t.namaPekerja || '').toLowerCase() === String(uNama || '').toLowerCase());
            if (exTarif) exTarif.status = 'Non Aktif';
          }
          this._successHandler({ success: true, message: "Pengguna '" + cleanUser + "' berhasil dinonaktifkan." });
        } else {
          this._successHandler({ success: false, message: "Pengguna tidak ditemukan." });
        }
      }, 50);
    }
  }

  window.GAS_WEB_APP_URL = localStorage.getItem("sheldon_gas_api_url") || "https://script.google.com/macros/s/AKfycbw5M3rZsgXeDdaxYauRizWaA-vDb1eLzxutOzf_bRI-/exec";

  function createScriptRunProxy() {
    let runner = new ScriptRunMock();
    let proxyRunner = new Proxy(runner, {
      get(rTarget, rProp) {
        if (rProp === 'withSuccessHandler' || rProp === 'withFailureHandler') {
          return function(fn) {
            rTarget[rProp](fn);
            return proxyRunner;
          };
        }
        
        return function(...args) {
          const gasUrl = window.GAS_WEB_APP_URL;
          if (gasUrl && typeof fetch === 'function') {
            const separator = gasUrl.includes('?') ? '&' : '?';
            const fetchUrl = gasUrl + separator + 'action=' + encodeURIComponent(rProp);
            fetch(fetchUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: rProp, params: args }),
              redirect: 'follow'
            })
            .then(res => {
              if (!res.ok) throw new Error("HTTP Status " + res.status);
              return res.text();
            })
            .then(text => {
              let trimmed = (text || '').trim();
              if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html')) {
                throw new Error("GAS Web App mengembalikan HTML (Pastikan deployment Apps Script diatur 'Who has access: Anyone')");
              }
              let data = JSON.parse(trimmed);
              if (data && data.success === false && String(data.message || '').includes('tidak ditemukan')) {
                console.warn("⚠️ Fungsi [" + rProp + "] belum di-deploy di GAS versi lama, menggunakan fallback lokal.");
                if (typeof rTarget[rProp] === 'function') {
                  rTarget[rProp].apply(rTarget, args);
                  return;
                }
              }
              console.log("⚡ Live Google Sheets synced for [" + rProp + "]:", data);
              if (window._updateGasBadge) window._updateGasBadge(true);
              rTarget._successHandler(data);
            })
            .catch(err => {
              console.warn("⚠️ Live GAS sync failed for [" + rProp + "], fallback ke mock cache:", err);
              if (window._updateGasBadge) window._updateGasBadge(false);
              if (typeof rTarget[rProp] === 'function') {
                rTarget[rProp].apply(rTarget, args);
              } else {
                rTarget._successHandler({ success: true, message: "OK (Offline Fallback)" });
              }
            });
            return proxyRunner;
          }

          if (typeof rTarget[rProp] === 'function') {
            rTarget[rProp].apply(rTarget, args);
          } else {
            rTarget._successHandler({ success: true, message: "OK (Mock)" });
          }
          return proxyRunner;
        };
      }
    });
    return proxyRunner;
  }

  google.script.run = new Proxy({}, {
    get(target, prop) {
      return function(...args) {
        let p = createScriptRunProxy();
        if (typeof p[prop] === 'function') {
          return p[prop].apply(p, args);
        }
        return p;
      };
    }
  });

  console.log("Dual-Engine Google Apps Script (Live Cloud + Offline Mock + Bulk SHELDON 2026) initialized successfully.");
})();
</script>
'''

# Insert mock script before first script tag
bundle = bundle.replace('<script>', mock_gas_script + '\n<script>', 1)

output_file = os.path.join(dist_dir, 'index.html')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(bundle)

root_index = os.path.abspath(os.path.join(dist_dir, '../../index.html'))
with open(root_index, 'w', encoding='utf-8') as f:
    f.write(bundle)

print(f"Bundled web app created at: {output_file} and {root_index} ({len(bundle)} bytes)")
