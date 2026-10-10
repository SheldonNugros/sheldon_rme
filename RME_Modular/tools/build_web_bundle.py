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
      { id: "STF-000", username: "admin", email: "vembrian@gmail.com", nama: "Administrator Sistem", role: "Super User", pin: "admin123", pass: "admin123", sip: "-", persenJM: 0 },
      { id: "STF-001", username: "sheldon", email: "sheldon@sheldon.com", nama: "drg. Sheldon Cooper, Sp.Ort", role: "Super User", pin: "1234", pass: "1234", sip: "503/SIP-DRG/001/2024", persenJM: 0.50 },
      { id: "STF-002", username: "leonard", email: "leonard@sheldon.com", nama: "drg. Leonard Hofstadter", role: "Dokter Gigi Umum", pin: "1111", pass: "1111", sip: "503/SIP-DRG/002/2024", persenJM: 0.45 },
      { id: "STF-003", username: "penny", email: "penny@sheldon.com", nama: "Penny Teller", role: "Kasir", pin: "2222", pass: "2222", sip: "-", persenJM: 0 },
      { id: "STF-004", username: "bernadette", email: "bernadette@sheldon.com", nama: "Bernadette Rostenkowski", role: "Perawat Gigi", pin: "3333", pass: "3333", sip: "503/STR-PRW/003/2024", persenJM: 0 },
      { id: "STF-005", username: "howard", email: "howard@sheldon.com", nama: "Howard Wolowitz", role: "Admin", pin: "4444", pass: "4444", sip: "-", persenJM: 0 }
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
        let cleanUser = String(user || "").trim().toLowerCase();
        let cleanPin = String(pin || "").trim().toLowerCase();

        let u = mockDb.staff.find(s => 
          (s.username && s.username.toLowerCase() === cleanUser) ||
          (s.email && s.email.toLowerCase() === cleanUser) ||
          (s.id && s.id.toLowerCase() === cleanUser) ||
          (s.nama && s.nama.toLowerCase().includes(cleanUser))
        );

        if (u) {
          let validPass = (u.pass && u.pass.toLowerCase() === cleanPin) ||
                          (u.pin && u.pin.toLowerCase() === cleanPin) ||
                          cleanPin === '1234' || cleanPin === 'admin123' || cleanPin === 'admin';
          if (validPass) {
            this._successHandler({ 
              success: true, 
              userData: { 
                username: u.username || u.id, 
                namaAccount: u.nama, 
                role: u.role 
              } 
            });
            return;
          }
        }
        this._successHandler({ success: false, message: "Username atau Password salah! Coba user: admin / pass: admin123" });
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

# Insert mock script before first script tag
bundle = bundle.replace('<script>', mock_gas_script + '\n<script>', 1)

output_file = os.path.join(dist_dir, 'index.html')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(bundle)

print(f"Bundled web app created at: {output_file} ({len(bundle)} bytes)")
