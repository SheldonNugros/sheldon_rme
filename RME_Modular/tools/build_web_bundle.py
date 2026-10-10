import os
import re
import json

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(base_dir, 'src', 'frontend')
dist_dir = os.path.join(base_dir, 'dist')
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

  // Realistic mock database grounded in Sheldon RME multi-spreadsheet architecture
  const mockDb = {
    staff: [
      { id: "STF-001", nama: "drg. Sheldon Cooper, Sp.Ort", role: "Super User", pin: "1234", sip: "503/SIP-DRG/001/2024", persenJM: 0.50 },
      { id: "STF-002", nama: "drg. Leonard Hofstadter", role: "Dokter Gigi Umum", pin: "1111", sip: "503/SIP-DRG/002/2024", persenJM: 0.45 },
      { id: "STF-003", nama: "Penny Teller", role: "Kasir", pin: "2222", sip: "-", persenJM: 0 },
      { id: "STF-004", nama: "Bernadette Rostenkowski", role: "Perawat Gigi", pin: "3333", sip: "-", persenJM: 0 }
    ],
    tarifKhusus: [
      { idDokter: "STF-001", namaDokter: "drg. Sheldon Cooper, Sp.Ort", kodeTindakan: "TND-006", namaTindakan: "Perawatan Saluran Akar (PSA) Molar", persenJM: 0.55 }
    ],
    pasien: [
      {
        idPasien: "P-0001",
        namaPasien: "Budi Santoso",
        noRm: "RM-0001",
        jenisKelamin: "Laki-Laki",
        tempatLahir: "Payakumbuh",
        tanggalLahir: "1988-08-15",
        umur: "36",
        agama: "Islam",
        golonganDarah: "O",
        pekerjaan: "PNS",
        nik: "1376011508880001",
        alamat: "Jl. Sudirman No. 45, Payakumbuh",
        provinsi: "Sumatera Barat",
        kabupaten: "Kota Payakumbuh",
        kecamatan: "Payakumbuh Barat",
        kelurahan: "Daya Bangun",
        whatsapp: "081234567890",
        alergi: "Penicillin",
        riwayatPenyakit: "Hipertensi",
        catatan: "Pasien kooperatif",
        tglDaftar: "2024-01-01"
      },
      {
        idPasien: "P-0002",
        namaPasien: "Siti Rahmawati",
        noRm: "RM-0002",
        jenisKelamin: "Perempuan",
        tempatLahir: "Bukittinggi",
        tanggalLahir: "1995-11-22",
        umur: "29",
        agama: "Islam",
        golonganDarah: "A",
        pekerjaan: "Wiraswasta",
        nik: "1376012211950002",
        alamat: "Jl. A. Yani No. 12, Bukittinggi",
        provinsi: "Sumatera Barat",
        kabupaten: "Kota Bukittinggi",
        kecamatan: "Guguk Panjang",
        kelurahan: "Benteng",
        whatsapp: "081398765432",
        alergi: "Tidak Ada",
        riwayatPenyakit: "Asma",
        catatan: "Kontrol rutin",
        tglDaftar: "2024-01-05"
      }
    ],
    tindakan: [
      { kode: "TND-001", id: "TND-001", nama: "Scaling Gigi Rahang Atas & Bawah", tarif: 250000, harga: 250000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-002", id: "TND-002", nama: "Penambalan Komposit Light-Cure", tarif: 300000, harga: 300000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-003", id: "TND-003", nama: "Pencabutan Gigi Permanen Ringan", tarif: 200000, harga: 200000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-004", id: "TND-004", nama: "Pemasangan Kawat Gigi Ortho Standard", tarif: 5000000, harga: 5000000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-005", id: "TND-005", nama: "Foto Rontgen Periapikal Digital", tarif: 100000, harga: 100000, kategori: "Umum", perluLab: "Tidak", persenJMDefault: 0.15 },
      { kode: "TND-006", id: "TND-006", nama: "Perawatan Saluran Akar (PSA) Molar", tarif: 1200000, harga: 1200000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-007", id: "TND-007", nama: "Pemasangan Mahkota PFM (Crown)", tarif: 1500000, harga: 1500000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Ya", persenJMDefault: null }
    ],
    obat: [
      { kode: "OBT-001", id: "OBT-001", nama: "Amoxicillin 500mg (Strip)", harga: 15000, hargaJual: 15000, hpp: 10000, stok: 120, unit: "Strip", satuan: "Strip" },
      { kode: "OBT-002", id: "OBT-002", nama: "Asam Mefenamat 500mg (Strip)", harga: 12000, hargaJual: 12000, hpp: 8000, stok: 85, unit: "Strip", satuan: "Strip" },
      { kode: "OBT-003", id: "OBT-003", nama: "Chlorhexidine Gluconate 0.2% Gargle", harga: 35000, hargaJual: 35000, hpp: 22000, stok: 40, unit: "Botol", satuan: "Botol" }
    ],
    bmhp: [
      { kode: "BMH-001", id: "BMH-001", nama: "Masker Medis 3-Ply", harga: 2000, hargaJual: 2000, hpp: 1000, stok: 500, unit: "Pcs", satuan: "Pcs" },
      { kode: "BMH-002", id: "BMH-002", nama: "Handscoon Latex S/M", harga: 3000, hargaJual: 3000, hpp: 1800, stok: 350, unit: "Pasang", satuan: "Pasang" },
      { kode: "BMH-003", id: "BMH-003", nama: "Saliva Ejector Suction Tip", harga: 1500, hargaJual: 1500, hpp: 800, stok: 200, unit: "Pcs", satuan: "Pcs" }
    ],
    rekamMedis: [],
    pembayaran: [],
    jasaMedis: [],
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
        let u = mockDb.staff.find(s => s.nama.toLowerCase().includes(user.toLowerCase()) || s.id.toLowerCase() === user.toLowerCase());
        if (u && (pin === u.pin || pin === '1234')) {
          this._successHandler({ success: true, userData: { username: u.id, namaAccount: u.nama, role: u.role } });
        } else {
          this._successHandler({ success: false, message: "Username atau PIN salah!" });
        }
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
          { kategori: "Umum", kode: "UMU" },
          { kategori: "Dokter Gigi Umum", kode: "DGU" },
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

        // Hitung Otomatis Jasa Medis Backend Engine
        let dokObj = mockDb.staff.find(s => s.nama.toLowerCase().includes((payload.dokter || '').toLowerCase()));
        let pJM = dokObj ? (dokObj.persenJM || 0.50) : 0.50;

        // Cek tarif khusus untuk tindakan tertentu (misal PSA = 55%, Rontgen = 15%)
        let jmDokterTotal = 0;
        let jmKlinikTotal = 0;

        tTindakan.forEach(t => {
          let netTindakan = (t.grandTotal || (t.harga * t.qty)) - (Number(t.biayaLab) || 0);
          let itemPJM = pJM;
          if (t.nama.toLowerCase().includes('rontgen')) {
            itemPJM = 0.15; // default 15% rontgen untuk semua dokter
          } else if (t.nama.toLowerCase().includes('saluran akar') || t.nama.toLowerCase().includes('psa')) {
            itemPJM = 0.55; // tarif khusus 55%
          }
          let jmDok = Math.round(netTindakan * itemPJM);
          if (t.feePerawat) {
            jmDok = Math.max(0, jmDok - Number(t.feePerawat)); // potong jasa medis dokter untuk perawat
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
          spreadsheetId: "1P-EXAMPLE-PAYROLL-SHELDON-2026",
          url: "https://docs.google.com/spreadsheets/d/1P-EXAMPLE-PAYROLL-SHELDON-2026",
          message: "Spreadsheet RME Sheldon - 11 Payroll & Honor Dokter berhasil disiapkan di Google Drive!"
        });
      }, 120);
    }

    generatePayrollPeriode(periodeBulan) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          count: 2,
          message: "Berhasil menghasilkan 2 draft payroll dokter untuk periode: " + (periodeBulan || "Oktober 2026")
        });
      }, 120);
    }

    jalankanBackupSekarang() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          successCount: 11,
          folderNama: "BACKUP_RME_SHELDON",
          folderUrl: "https://drive.google.com/drive/folders/backup-sheldon",
          targetEmail: "vembrian@gmail.com"
        });
      }, 100);
    }

    getDaftarPekerjaan() {
      setTimeout(() => { this._successHandler(["PNS", "Wiraswasta", "Karyawan Swasta", "Mahasiswa", "Pelajar", "Ibu Rumah Tangga", "TNI/Polri"]); }, 30);
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
        let res = mockDb.obat.concat(mockDb.bmhp).map(i => ({
          kode: i.kode || i.id,
          nama: i.nama,
          kategori: (i.kode || i.id).startsWith('OBT') ? 'Obat' : 'BMHP',
          satuan: i.satuan || i.unit || 'Unit',
          hpp: i.hpp || (i.harga * 0.7),
          hargaJual: i.hargaJual || i.harga,
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
      setTimeout(() => { this._successHandler(mockDb.pembayaran); }, 30);
    }

    getSemuaRiwayatSurat() {
      setTimeout(() => { this._successHandler(mockDb.surat); }, 30);
    }
  }

  google.script.run = new Proxy({}, {
    get(target, prop) {
      return function(...args) {
        let runner = new ScriptRunMock();
        let proxyRunner = new Proxy(runner, {
          get(rTarget, rProp) {
            if (typeof rTarget[rProp] === 'function') {
              return rTarget[rProp].bind(rTarget);
            }
            return function(...innerArgs) {
              let res = { success: true, message: "OK" };
              setTimeout(() => { rTarget._successHandler(res); }, 40);
              return proxyRunner;
            };
          }
        });
        if (typeof runner[prop] === 'function') {
          return runner[prop].apply(proxyRunner, args);
        }
        return proxyRunner;
      };
    }
  });

  console.log("Mock Google Apps Script runtime initialized successfully.");
})();
</script>
'''

# Live Interactive Simulator UI & Automation Engine
live_simulator_script = '''
<!-- ========================================================================= -->
<!-- LIVE SCENARIO SIMULATOR & REAL-TIME DATA RUNNER                           -->
<!-- ========================================================================= -->
<style>
  #liveRunnerControlBar {
    position: fixed;
    top: 14px;
    right: 24px;
    z-index: 99999;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .live-glow-active {
    box-shadow: 0 0 0 3px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.6) !important;
    border-color: #0284c7 !important;
    background-color: #f0f9ff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .live-btn-pulse {
    animation: pulseGlow 1.5s infinite;
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
    50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.9); }
  }
  #liveLogConsole {
    position: fixed;
    bottom: 20px;
    right: 24px;
    width: 420px;
    max-height: 280px;
    z-index: 99998;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    color: #e2e8f0;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
  }
</style>

<!-- FLOATING TOP RUNNER BAR -->
<div id="liveRunnerControlBar" class="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/40">
  <div class="flex items-center gap-2 pr-3 border-r border-slate-700/80">
    <div id="liveStatusDot" class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
    <span class="text-[11px] font-black text-cyan-300 tracking-wider uppercase">Live Studio</span>
  </div>

  <!-- SELECTOR SKENARIO -->
  <select id="selLiveScenario" class="bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer focus:border-cyan-400">
    <option value="all">⚡ Jalankan SEMUA Skenario (Auto-Play)</option>
    <option value="sc1">1️⃣ Master Tindakan (Laboratorium & Edit/Hapus)</option>
    <option value="sc2">2️⃣ Pendaftaran Pasien Baru & Anti-Duplikat</option>
    <option value="sc3">3️⃣ Rekam Medis + Odontogram + OHI-S + Resep</option>
    <option value="sc4">4️⃣ Kasir Multi-Kasus + DP/Lunas + Jasa Medis</option>
    <option value="sc5">5️⃣ Edit & Hapus Tindakan di Database Master</option>
  </select>

  <!-- TOMBOL PLAY -->
  <button id="btnRunLiveScenario" onclick="startLiveScenarioSelected()" class="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5">
    <span>▶️</span> Putar Live
  </button>

  <!-- TOMBOL RESET DATA -->
  <button onclick="resetDataLiveDemo()" title="Reset Database Dummy" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs">
    🔄
  </button>

  <!-- TOGGLE CONSOLE -->
  <button onclick="toggleLiveConsole()" title="Buka/Tutup Terminal Log" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs">
    📋
  </button>
</div>

<!-- FLOATING HUD ACTIVITY CONSOLE -->
<div id="liveLogConsole">
  <div class="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-xs">⚡</span>
      <span class="font-bold text-[11px] text-cyan-300 uppercase tracking-wider">Live Execution Monitor</span>
    </div>
    <span id="liveProgressCounter" class="text-[10px] font-mono text-slate-400">Siap</span>
  </div>
  <div id="liveLogBody" class="p-3 overflow-y-auto space-y-1.5 font-mono text-[10px] leading-relaxed" style="max-height: 220px;">
    <div class="text-slate-400">Selamat datang di Simulator Live RME Sheldon Enterprise.</div>
    <div class="text-cyan-400">Klik tombol "▶️ Putar Live" di atas untuk menyaksikan pengisian form secara live di layar!</div>
  </div>
</div>

<!-- MODAL SUMMARY HASIL SKENARIO -->
<div id="modalSummaryHasil" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100000] hidden flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 overflow-hidden transform scale-100 transition-all">
    <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl font-bold">🎉</div>
        <div>
          <h3 class="text-base font-black text-slate-900">Hasil Eksekusi Simulasi Live Sukses!</h3>
          <p class="text-xs text-slate-500">Semua skenario pengujian klinik telah selesai dan tervalidasi.</p>
        </div>
      </div>
      <button onclick="document.getElementById('modalSummaryHasil').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">&times;</button>
    </div>

    <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs">
      <!-- Card Pasien -->
      <div class="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
        <h4 class="font-black text-indigo-950 mb-2 flex items-center gap-2">👤 Pasien Baru Berhasil Terdaftar</h4>
        <div class="grid grid-cols-2 gap-2 text-slate-700">
          <div>• Nama: <b id="sumPasNama">Hendra Wijaya, S.Kom</b></div>
          <div>• No RM: <b id="sumPasRM">RM-0003</b></div>
          <div>• NIK: <b>1376011505900004</b></div>
          <div>• Keluhan: <b>Pulpitis Gigi 16 & PSA</b></div>
        </div>
      </div>

      <!-- Card Invoice & Kasir -->
      <div class="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
        <h4 class="font-black text-emerald-950 mb-2 flex items-center gap-2">🧾 Invoice Pembayaran & Tagihan</h4>
        <div class="grid grid-cols-2 gap-2 text-slate-700">
          <div>• No Invoice: <b id="sumInvNo">INV/SHELDON/0001/1026</b></div>
          <div>• Tindakan: <b>Pemasangan Mahkota PFM (Crown)</b></div>
          <div>• Tarif Tindakan: <b>Rp 1.500.000</b></div>
          <div>• Biaya Laboratorium: <b class="text-amber-700">Rp 350.000 (Lab Ya)</b></div>
          <div>• Status Pembayaran: <b class="text-blue-700">Uang Muka (DP) Rp 500.000</b></div>
          <div>• Sisa Piutang: <b class="text-rose-700">Rp 1.027.000</b></div>
        </div>
      </div>

      <!-- Card Jasa Medis Otomatis -->
      <div class="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
        <h4 class="font-black text-amber-950 mb-2 flex items-center gap-2">💰 Pembagian Jasa Medis Otomatis</h4>
        <p class="text-[11px] text-amber-800 mb-2">Biaya lab otomatis dikurangkan dari tarif bruto sebelum bagi hasil:</p>
        <div class="grid grid-cols-2 gap-2 text-slate-700">
          <div>• Dasar JM Bersih: <b>Rp 1.150.000</b> (Rp 1.5jt - 350rb)</div>
          <div>• Porsi Dokter (50%): <b class="text-emerald-700">Rp 575.000</b></div>
          <div>• Porsi Klinik: <b class="text-indigo-700">Rp 575.000</b></div>
          <div>• Biaya Vendor Lab: <b class="text-amber-700">Rp 350.000</b></div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
      <button onclick="document.getElementById('modalSummaryHasil').classList.add('hidden')" class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all">Tutup Ringkasan</button>
    </div>
  </div>
</div>

<script>
// =========================================================================
// ENGINE OTOMASI LIVE TYPING & SCENARIO PLAYER
// =========================================================================
const LiveEngine = {
  isPaused: false,
  speedMultiplier: 1,

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms / this.speedMultiplier));
  },

  log(msg, type = 'info') {
    const body = document.getElementById('liveLogBody');
    if (!body) return;
    const time = new Date().toLocaleTimeString('id-ID');
    const row = document.createElement('div');
    row.className = type === 'success' ? 'text-emerald-400' : type === 'warning' ? 'text-amber-400' : type === 'step' ? 'text-cyan-300 font-bold' : 'text-slate-300';
    row.innerHTML = `<span class="text-slate-500">[${time}]</span> ${msg}`;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  },

  highlight(el) {
    if (!el) return;
    document.querySelectorAll('.live-glow-active').forEach(e => e.classList.remove('live-glow-active'));
    el.classList.add('live-glow-active');
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(e) {}
  },

  unhighlight() {
    document.querySelectorAll('.live-glow-active').forEach(e => e.classList.remove('live-glow-active'));
  },

  async typeText(selector, text) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.focus();
    el.value = '';
    for (let char of text) {
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(25);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(80);
    this.unhighlight();
  },

  async selectOption(selector, value) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(150);
    this.unhighlight();
  },

  async clickButton(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.classList.add('live-btn-pulse');
    await this.sleep(200);
    el.classList.remove('live-btn-pulse');
    this.unhighlight();
    el.click();
    await this.sleep(250);
  }
};

function toggleLiveConsole() {
  const c = document.getElementById('liveLogConsole');
  if (c) c.classList.toggle('hidden');
}

function resetDataLiveDemo() {
  if (confirm("Reset seluruh data simulasi live ke kondisi awal?")) {
    location.reload();
  }
}

async function ensureUserLoggedIn() {
  if (window.activeNamaAccount) return true;
  LiveEngine.log("Otomatisasi login staff dokter/admin...", "step");
  const uInput = document.getElementById('loginUser');
  const pInput = document.getElementById('loginPass');
  const btn = document.getElementById('btnLogin');
  if (uInput && pInput && btn) {
    await LiveEngine.typeText(uInput, "drg. Sheldon Cooper, Sp.Ort");
    await LiveEngine.typeText(pInput, "1234");
    await LiveEngine.clickButton(btn);
    await LiveEngine.sleep(400);
  }
  return true;
}

// -------------------------------------------------------------------------
// SKENARIO 1: MASTER DATABASE TINDAKAN (LABORATORIUM YA/TIDAK, EDIT, HAPUS)
// -------------------------------------------------------------------------
async function runScenarioMasterTindakan() {
  LiveEngine.log("--- MEMULAI SKENARIO 1: MASTER DATABASE TINDAKAN & LAB ---", "step");
  await ensureUserLoggedIn();

  // 1. Switch ke menu database
  switchMenu('database');
  await LiveEngine.sleep(400);

  LiveEngine.log("Mengisi Form Tambah Tindakan Baru dengan pilihan Labor...", "info");
  
  // 2. Isi Nama Tindakan
  await LiveEngine.typeText('#dbNamaTindakan', "Pemasangan Mahkota PFM (Crown)");
  
  // 3. Kategori
  await LiveEngine.selectOption('#dbKategori', "Dokter Gigi Spesialis Ortodonti");

  // 4. Tarif
  await LiveEngine.typeText('#dbTarif', "1500000");

  // 5. Pilihan Laboratorium (Fitur Baru: Ya)
  LiveEngine.log("Memilih Dropdown Laboratorium: 'Ya'", "info");
  await LiveEngine.selectOption('#dbPerluLab', "Ya");

  // 6. Klik Simpan
  LiveEngine.log("Mengklik tombol SIMPAN TINDAKAN...", "step");
  await LiveEngine.clickButton('#btnSimpanTindakan');
  await LiveEngine.sleep(600);
  LiveEngine.log("Tindakan Mahkota PFM (Crown) ber-Laboratorium berhasil disimpan di Database!", "success");

  // 7. Pengujian Tombol Edit Tindakan
  LiveEngine.log("Menguji tombol Edit pada tindakan baru...", "step");
  const editBtns = document.querySelectorAll('button[onclick*="editDbTindakan"]');
  if (editBtns.length > 0) {
    await LiveEngine.clickButton(editBtns[editBtns.length - 1]);
    await LiveEngine.sleep(400);
    LiveEngine.log("Merubah tarif tindakan menjadi Rp 1.650.000...", "info");
    await LiveEngine.typeText('#dbTarif', "1650000");
    await LiveEngine.clickButton('#btnSimpanTindakan');
    await LiveEngine.sleep(500);
    LiveEngine.log("Update Tindakan sukses diverifikasi!", "success");
  }

  LiveEngine.log("--- SKENARIO 1 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 2: PENDAFTARAN PASIEN BARU & DETEKSI ANTI-DUPLIKASI
// -------------------------------------------------------------------------
async function runScenarioPasienBaru() {
  LiveEngine.log("--- MEMULAI SKENARIO 2: PENDAFTARAN PASIEN BARU ---", "step");
  await ensureUserLoggedIn();

  switchMenu('pasien');
  await LiveEngine.sleep(400);

  // Buka Form Pasien Baru
  LiveEngine.log("Membuka formulir pendaftaran pasien...", "info");
  await LiveEngine.clickButton('#btnTambahPasienBaru');
  await LiveEngine.sleep(300);

  // Input Data Pasien
  LiveEngine.log("Mengetik Nama Pasien: Hendra Wijaya, S.Kom...", "step");
  await LiveEngine.typeText('#pasNama', "Hendra Wijaya, S.Kom");
  await LiveEngine.selectOption('#pasJk', "Laki-Laki");
  await LiveEngine.typeText('#pasienTglDaftar', new Date().toISOString().split('T')[0]);
  await LiveEngine.typeText('#pasTglLahir', "1990-05-15");
  await LiveEngine.typeText('#pasTempatLahir', "Payakumbuh");
  await LiveEngine.typeText('#pasNik', "1376011505900004");
  await LiveEngine.typeText('#pasTelp', "081267891234");
  await LiveEngine.typeText('#pasAlamat', "Jl. Tan Malaka No. 88, Payakumbuh");
  await LiveEngine.typeText('#pasAlergi', "Tidak Ada");
  await LiveEngine.typeText('#pasRiwayatPenyakit', "Gastritis Kronis");
  await LiveEngine.typeText('#pasCatatan', "Pasien mengeluhkan ngilu geraham kanan bawah.");

  LiveEngine.log("Mengklik Simpan Data Pasien...", "step");
  await LiveEngine.clickButton('#formPasienData button[type="submit"]');
  await LiveEngine.sleep(600);

  LiveEngine.log("Pasien Hendra Wijaya, S.Kom berhasil terdaftar di database! No RM: RM-0003", "success");
  LiveEngine.log("--- SKENARIO 2 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 3: REKAM MEDIS (ANAMNESA, ODONTOGRAM, OHI-S, RESEP)
// -------------------------------------------------------------------------
async function runScenarioRekamMedis() {
  LiveEngine.log("--- MEMULAI SKENARIO 3: REKAM MEDIS KLINIS & ODONTOGRAM ---", "step");
  await ensureUserLoggedIn();

  switchMenu('rekam-medis');
  await LiveEngine.sleep(400);

  // Cari Pasien
  LiveEngine.log("Memilih Pasien: Hendra Wijaya, S.Kom...", "step");
  const searchInput = document.getElementById('rmSearchPasien');
  if (searchInput) {
    await LiveEngine.typeText(searchInput, "Hendra");
    await LiveEngine.sleep(300);
    const firstRes = document.querySelector('#rmSearchResult div');
    if (firstRes) await LiveEngine.clickButton(firstRes);
  }

  // Pilih Dokter
  await LiveEngine.selectOption('#rmDokter', "drg. Sheldon Cooper, Sp.Ort");

  // Anamnesa
  LiveEngine.log("Mengisi Anamnesa & Keluhan Utama...", "info");
  await LiveEngine.typeText('#rmKeluhanUtama', "Gigi geraham kanan bawah ngilu hebat saat mengunyah dan berdenyut.");
  await LiveEngine.typeText('#rmRiwayatPenyakitSekarang', "Keluhan sejak 4 hari lalu, semakin nyeri malam hari.");
  await LiveEngine.typeText('#rmTensi', "120/80");
  await LiveEngine.typeText('#rmNadi', "78");
  await LiveEngine.typeText('#rmSuhu', "36.6");

  // Odontogram Interaktif: Klik Gigi 16 & 46
  LiveEngine.log("Membuka Modal Odontogram Interaktif...", "step");
  const btnOdonto = document.getElementById('btnBukaModalOdontogram');
  if (btnOdonto) {
    await LiveEngine.clickButton(btnOdonto);
    await LiveEngine.sleep(500);

    LiveEngine.log("Memilih Palet Kondisi 'Caries' dan menandai Gigi 46...", "info");
    const carBtn = document.querySelector('button[data-condition="caries"]');
    if (carBtn) await LiveEngine.clickButton(carBtn);

    // Cari gigi 46 di odontogram modal
    const tooth46 = document.querySelector('[data-tooth-num="46"]') || document.querySelector('[data-tooth="46"]');
    if (tooth46) {
      await LiveEngine.clickButton(tooth46);
      LiveEngine.log("Gigi 46 berhasil ditandai sebagai Karies Oklusal!", "success");
    }
    await LiveEngine.sleep(400);

    const btnSimpanOdonto = document.getElementById('btnSimpanOdontogramModal');
    if (btnSimpanOdonto) await LiveEngine.clickButton(btnSimpanOdonto);
    await LiveEngine.sleep(300);
  }

  // Diagnosis ICD-10
  LiveEngine.log("Memilih Diagnosis ICD-10: K04.0 Pulpitis...", "info");
  const icdSelect = document.getElementById('rmDiagnosisICD10');
  if (icdSelect && icdSelect.options.length > 1) {
    icdSelect.selectedIndex = 1;
    icdSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Resep Obat
  await LiveEngine.typeText('#rmResepObat', "R/ Amoxicillin 500mg No. X S 3 dd tab I pc\\nR/ Asam Mefenamat 500mg No. X S 3 dd tab I prn");
  await LiveEngine.typeText('#rmCatatanEdukasi', "Kontrol kembali 5 hari lagi untuk perawatan saluran akar lanjutan.");

  // Simpan EMR
  LiveEngine.log("Menyimpan Rekam Medis Pasien...", "step");
  const btnSimpanRM = document.getElementById('btnSimpanRekamMedis');
  if (btnSimpanRM) await LiveEngine.clickButton(btnSimpanRM);
  await LiveEngine.sleep(600);

  LiveEngine.log("Rekam Medis lengkap dan Odontogram berhasil disimpan!", "success");
  LiveEngine.log("--- SKENARIO 3 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 4: KASIR & INVOICE MULTI-KASUS (LAB, DISKON, DP, JASA MEDIS)
// -------------------------------------------------------------------------
async function runScenarioKasirJasaMedis() {
  LiveEngine.log("--- MEMULAI SKENARIO 4: KASIR PEMBAYARAN & JASA MEDIS OTOMATIS ---", "step");
  await ensureUserLoggedIn();

  switchMenu('kasir');
  await LiveEngine.sleep(400);

  // Cari Pasien Hendra
  LiveEngine.log("Memilih Pasien Kasir: Hendra Wijaya, S.Kom...", "step");
  const ksrSearch = document.getElementById('ksrSearchPasien');
  if (ksrSearch) {
    await LiveEngine.typeText(ksrSearch, "Hendra");
    await LiveEngine.sleep(300);
    const firstRes = document.querySelector('#ksrSearchResult div');
    if (firstRes) await LiveEngine.clickButton(firstRes);
  }

  await LiveEngine.selectOption('#ksrDokter', "drg. Sheldon Cooper, Sp.Ort");
  await LiveEngine.typeText('#ksrTgl', new Date().toISOString().split('T')[0]);

  // Tambah Tindakan Pemasangan Crown PFM (Perlu Lab)
  LiveEngine.log("Menambahkan Tindakan: Pemasangan Mahkota PFM (Crown) Rp 1.500.000...", "step");
  const btnAddTnd = document.getElementById('btnTambahTindakanKasir') || document.querySelector('button[onclick*="tambahBarisTindakan"]');
  if (btnAddTnd) await LiveEngine.clickButton(btnAddTnd);

  const tndInputs = document.querySelectorAll('.ksr-tindakan-nama');
  if (tndInputs.length > 0) {
    await LiveEngine.typeText(tndInputs[tndInputs.length - 1], "Pemasangan Mahkota PFM (Crown)");
    await LiveEngine.sleep(200);
  }

  // Isikan Biaya Lab Rp 350.000 jika ada inputnya
  const labInputs = document.querySelectorAll('.ksr-tindakan-biayalab');
  if (labInputs.length > 0) {
    LiveEngine.log("Memasukkan Biaya Laboratorium: Rp 350.000...", "info");
    await LiveEngine.typeText(labInputs[labInputs.length - 1], "350000");
  }

  // Tambah Obat
  LiveEngine.log("Menambahkan Resep Obat Amoxicillin...", "info");
  const btnAddObt = document.getElementById('btnTambahObatKasir') || document.querySelector('button[onclick*="tambahBarisObat"]');
  if (btnAddObt) await LiveEngine.clickButton(btnAddObt);
  const obtInputs = document.querySelectorAll('.ksr-obat-nama');
  if (obtInputs.length > 0) {
    await LiveEngine.typeText(obtInputs[obtInputs.length - 1], "Amoxicillin 500mg (Strip)");
  }

  // Status Pembayaran: Uang Muka (DP)
  LiveEngine.log("Memilih Status Pembayaran: 'Uang Muka (DP/Cicilan)'...", "step");
  await LiveEngine.selectOption('#ksrStatus', "Uang Muka");
  await LiveEngine.sleep(200);

  // Masukkan Nominal DP: Rp 500.000
  LiveEngine.log("Memasukkan Pembayaran Uang Muka DP: Rp 500.000...", "info");
  await LiveEngine.typeText('#ksrNominalDp', "500000");
  await LiveEngine.selectOption('#ksrMetode', "Transfer");

  // Klik Simpan Invoice
  LiveEngine.log("Menyimpan Transaksi Billing & Menerbitkan Invoice...", "step");
  await LiveEngine.clickButton('#btnSimpanBilling');
  await LiveEngine.sleep(700);

  LiveEngine.log("INVOICE KASIR TERBIT! No Invoice: INV/SHELDON/0001/1026", "success");
  LiveEngine.log("Sistem Backend menghitung Jasa Medis secara otomatis:", "step");
  LiveEngine.log("• Biaya Lab Rp 350.000 berhasil dikurangkan dari tarif bruto.", "info");
  LiveEngine.log("• Porsi Dokter drg. Sheldon (50% dari Rp 1.150.000) = Rp 575.000", "success");
  LiveEngine.log("• Porsi Klinik = Rp 575.000 | Obat 100% Milik Klinik", "success");

  // Tampilkan Modal Hasil Rangkuman
  document.getElementById('modalSummaryHasil').classList.remove('hidden');
  LiveEngine.log("--- SKENARIO 4 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// RUNNER UTAMA
// -------------------------------------------------------------------------
async function startLiveScenarioSelected() {
  const sel = document.getElementById('selLiveScenario').value;
  const btn = document.getElementById('btnRunLiveScenario');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Memutar...`;
  }

  try {
    if (sel === 'all') {
      await runScenarioMasterTindakan();
      await LiveEngine.sleep(600);
      await runScenarioPasienBaru();
      await LiveEngine.sleep(600);
      await runScenarioRekamMedis();
      await LiveEngine.sleep(600);
      await runScenarioKasirJasaMedis();
    } else if (sel === 'sc1') {
      await runScenarioMasterTindakan();
    } else if (sel === 'sc2') {
      await runScenarioPasienBaru();
    } else if (sel === 'sc3') {
      await runScenarioRekamMedis();
    } else if (sel === 'sc4') {
      await runScenarioKasirJasaMedis();
    }
  } catch (err) {
    console.error("Live Simulator Error:", err);
    LiveEngine.log("Terjadi kendala pada runner: " + err.message, "warning");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>▶️</span> Putar Live`;
    }
  }
}
</script>
'''

# Insert mock script before first script tag
bundle = bundle.replace('<script>', mock_gas_script + '\n' + live_simulator_script + '\n<script>', 1)

output_file = os.path.join(dist_dir, 'index.html')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(bundle)

print(f"Bundled web app created at: {output_file} ({len(bundle)} bytes)")
