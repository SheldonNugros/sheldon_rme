import os

backend_setup_file = os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', '10_SetupSpreadsheets.gs')
backend_config_file = os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', '00_Config.gs')

# 1. Update 00_Config.gs
with open(backend_config_file, 'r', encoding='utf-8') as f:
    cfg = f.read()

if '"PAYROLL"' not in cfg:
    cfg = cfg.replace(
        '"ICD9": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE"\n};',
        '"ICD9": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE",\n  "PAYROLL": ""\n};'
    )
    with open(backend_config_file, 'w', encoding='utf-8') as f:
        f.write(cfg)
    print("Updated 00_Config.gs with PAYROLL ID slot.")

# 2. Update 10_SetupSpreadsheets.gs
with open(backend_setup_file, 'r', encoding='utf-8') as f:
    setup_code = f.read()

# Update seedRows Tindakan
old_tindakan_seed = """          "seedRows": [
            ["UMM-0001", "Konsultasi Dokter Gigi", "Umum", 50000, "Tidak", ""],
            ["UMM-0002", "Foto Rontgen Periapikal", "Umum", 100000, "Tidak", 0.15],
            ["DGU-0001", "Tambal Gigi Komposit", "Dokter Gigi Umum", 250000, "Tidak", ""],
            ["DGU-0002", "Scaling Rahang Atas & Bawah", "Dokter Gigi Umum", 300000, "Tidak", ""],
            ["DGU-0003", "Pencabutan Gigi Permanen", "Dokter Gigi Umum", 200000, "Tidak", ""],
            ["DGS-0001", "Perawatan Saluran Akar (PSA)", "Dokter Gigi Spesialis", 1500000, "Tidak", ""],
            ["DGS-0002", "Odontektomi Gigi Impaksi", "Dokter Gigi Spesialis", 2500000, "Tidak", ""]
          ]"""

new_tindakan_seed = """          "seedRows": [
            ["UMM-0001", "Konsultasi Dokter Gigi", "Umum", 50000, "Tidak", ""],
            ["UMM-0002", "Foto Rontgen Periapikal Digital", "Umum", 100000, "Tidak", 0.15],
            ["DGU-0001", "Penambalan Komposit Light-Cure", "Dokter Gigi Umum", 250000, "Tidak", ""],
            ["DGU-0002", "Scaling Rahang Atas & Bawah", "Dokter Gigi Umum", 300000, "Tidak", ""],
            ["DGU-0003", "Pencabutan Gigi Permanen Ringan", "Dokter Gigi Umum", 200000, "Tidak", ""],
            ["DGS-0001", "Perawatan Saluran Akar (PSA) Molar", "Dokter Gigi Spesialis", 1500000, "Tidak", ""],
            ["DGS-0002", "Odontektomi Gigi Impaksi M3", "Dokter Gigi Spesialis", 2500000, "Tidak", ""],
            ["DGS-0003", "Pemasangan Behel Standar (Include Scaling)", "Dokter Gigi Spesialis", 5000000, "Tidak", ""],
            ["LAB-0001", "Pemasangan Mahkota PFM (Crown)", "Dokter Gigi Spesialis", 1500000, "Ya", ""],
            ["LAB-0002", "Gigi Tiruan Sebagian Lepasan (Valplast)", "Dokter Gigi Spesialis", 1800000, "Ya", ""]
          ]"""

if old_tindakan_seed in setup_code:
    setup_code = setup_code.replace(old_tindakan_seed, new_tindakan_seed)

# Update Tarif_Khusus_Dokter seed
old_tk_seed = """          "seedRows": [
            ["EXC-0001", "drg. Contoh Spesialis", "DGS-0002", "Odontektomi Gigi Impaksi", 0.55, "Rate bonus 55% untuk odontektomi"]
          ]"""

new_tk_seed = """          "seedRows": [
            ["EXC-0001", "drg. Sheldon Cooper, Sp.Ort", "DGS-0001", "Perawatan Saluran Akar (PSA) Molar", 0.55, "Spesialis Konservasi: PSA rate khusus 55% (Default 50%)"],
            ["EXC-0002", "drg. Sheldon Cooper, Sp.Ort", "DGS-0002", "Odontektomi Gigi Impaksi M3", 0.55, "Tindakan bedah minor: rate khusus 55% (Default 50%)"],
            ["EXC-0003", "drg. Leonard Hofstadter", "DGU-0002", "Scaling Rahang Atas & Bawah", 0.50, "Reward scaling: rate 50% (Default 45%)"]
          ]"""

if old_tk_seed in setup_code:
    setup_code = setup_code.replace(old_tk_seed, new_tk_seed)

# Update Master Data seed
old_m_seed = """          "seedRows": [
            ["Administrator Sistem", "admin", "Super User", "admin123", "Aktif", "-", "08123456789", ""]
          ]"""

new_m_seed = """          "seedRows": [
            ["Administrator Sistem", "admin", "Super User", "admin123", "Aktif", "-", "08123456789", ""],
            ["drg. Sheldon Cooper, Sp.Ort", "sheldon", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2024", "081234567890", 0.50],
            ["drg. Leonard Hofstadter", "leonard", "Dokter Gigi Umum", "1111", "Aktif", "503/SIP-DRG/002/2024", "081234567891", 0.45],
            ["Penny Teller", "penny", "Kasir", "2222", "Aktif", "-", "081234567892", ""],
            ["Bernadette Rostenkowski", "bernadette", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/003/2024", "081234567893", ""],
            ["Howard Wolowitz", "howard", "Admin", "4444", "Aktif", "-", "081234567894", ""]
          ]"""

if old_m_seed in setup_code:
    setup_code = setup_code.replace(old_m_seed, new_m_seed)

# Add PAYROLL to SPREADSHEET_DEFINITIONS if not exists
payroll_block = """    "PAYROLL": {
      "title": "RME Sheldon - 11 Payroll & Honor Dokter",
      "sheets": [
        {
          "name": "Penggajian_Dokter",
          "headers": ["ID_Payroll", "Periode_Bulan", "ID_Dokter", "Nama_Dokter", "Total_Pasien", "Total_Tindakan_Bruto", "Total_Biaya_Lab", "Dasar_JM_Bersih", "Total_JM_Dokter", "Uang_Duduk_Transport", "Bonus_Insentif", "Potongan_PPh21", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Catatan", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "#,##0", "I": "#,##0", "J": "#,##0", "K": "#,##0", "L": "#,##0", "M": "#,##0", "N": "#,##0", "R": "dd-mm-yyyy", "T": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "Q": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-DR-202610-001", "Oktober 2026", "STF-001", "drg. Sheldon Cooper, Sp.Ort", 18, 24500000, 1200000, 23300000, 12150000, 1500000, 500000, 350000, 0, 13800000, "BCA", "8270192831", "Draft", "", "Periode 1-30 Okt 2026 (Include PSA & Crown)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-002", "Oktober 2026", "STF-002", "drg. Leonard Hofstadter", 15, 12800000, 0, 12800000, 5760000, 1200000, 250000, 175000, 0, 7035000, "Mandiri", "1310029102912", "Draft", "", "Periode 1-30 Okt 2026 (Include Rontgen & Scaling)", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Honor_Perawat_Staff",
          "headers": ["ID_Payroll_Staff", "Periode_Bulan", "ID_Staff", "Nama_Staff", "Role", "Gaji_Pokok", "Total_Fee_Tindakan", "Uang_Makan_Transport", "Lembur", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "#,##0", "I": "#,##0", "J": "#,##0", "K": "#,##0", "O": "dd-mm-yyyy", "P": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "N": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-STF-202610-001", "Oktober 2026", "STF-004", "Bernadette Rostenkowski", "Perawat Gigi", 2800000, 450000, 500000, 150000, 0, 3900000, "BSI", "7109281923", "Draft", "", "10-10-2026 10:00:00"],
            ["PAY-STF-202610-002", "Oktober 2026", "STF-003", "Penny Teller", "Kasir", 2500000, 0, 500000, 100000, 0, 3100000, "BCA", "8271029381", "Draft", "", "10-10-2026 10:00:00"],
            ["PAY-STF-202610-003", "Oktober 2026", "STF-005", "Howard Wolowitz", "Admin", 2500000, 0, 500000, 0, 0, 3000000, "Mandiri", "1310091827361", "Draft", "", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Tagihan_Vendor_Lab",
          "headers": ["ID_Tagihan_Lab", "Periode_Bulan", "Nama_Vendor_Lab", "Jumlah_Pekerjaan", "Total_Biaya_Lab", "Potongan_Retur", "Total_Tagihan_Bersih", "Status_Bayar", "Tanggal_Bayar", "Metode_Bayar", "No_Faktur_Lab", "Catatan", "Waktu_Sistem"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0", "I": "dd-mm-yyyy", "M": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "H": ["Belum Lunas", "Lunas", "Dibatalkan"]
          },
          "seedRows": [
            ["LAB-BILL-202610-001", "Oktober 2026", "Dental Lab Padang Mandiri", 3, 1050000, 0, 1050000, "Belum Lunas", "", "Transfer Bank", "FAK-LAB-8912", "Pekerjaan PFM Crown 2 unit, Valplast 1 unit", "10-10-2026 10:00:00"],
            ["LAB-BILL-202610-002", "Oktober 2026", "Kencana Dental Lab Bukittinggi", 1, 350000, 0, 350000, "Belum Lunas", "", "Transfer Bank", "FAK-KCN-4410", "Crown PFM Pasien Budi Santoso (INV 0001)", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Slip_Gaji_Arsip",
          "headers": ["No_Slip", "Tanggal_Terbit", "Penerima", "Kategori", "Periode", "Total_THP", "File_PDF_Url", "Dikirim_Ke", "Status_Kirim", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "F": "#,##0", "J": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "D": ["Dokter", "Perawat", "Staff"],
            "I": ["Draft", "Terkirim", "Gagal"]
          },
          "seedRows": [
            ["SLIP/DR/202610/001", "31-10-2026", "drg. Sheldon Cooper, Sp.Ort", "Dokter", "Oktober 2026", 13800000, "https://drive.google.com/file/d/slip-sheldon-okt-2026", "081234567890", "Terkirim", "31-10-2026 17:00:00"],
            ["SLIP/DR/202610/002", "31-10-2026", "drg. Leonard Hofstadter", "Dokter", "Oktober 2026", 7035000, "https://drive.google.com/file/d/slip-leonard-okt-2026", "081234567891", "Terkirim", "31-10-2026 17:00:00"],
            ["SLIP/STF/202610/001", "31-10-2026", "Bernadette Rostenkowski", "Perawat", "Oktober 2026", 3900000, "https://drive.google.com/file/d/slip-bernadette-okt-2026", "081234567893", "Terkirim", "31-10-2026 17:00:00"]
          ]
        }
      ]
    }\n  };"""

if '"PAYROLL"' not in setup_code:
    setup_code = setup_code.replace("    }\n  };", "    },\n\n" + payroll_block)

# Add Payroll Functions to 10_SetupSpreadsheets.gs
payroll_functions = """
// =========================================================================
// FITUR OTOMATIS: GENERATOR SPREADSHEET PAYROLL & TUTUP BUKU JASA MEDIS
// =========================================================================

/**
 * Otomatis membuat Spreadsheet "RME Sheldon - 11 Payroll & Honor Dokter"
 * lengkap dengan 4 sheet: Penggajian_Dokter, Honor_Perawat_Staff, Tagihan_Vendor_Lab, dan Slip_Gaji_Arsip.
 */
function setupPayrollSpreadsheet() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    let ssId = (DB_CONFIG && DB_CONFIG.PAYROLL) ? DB_CONFIG.PAYROLL.trim() : "";
    let ss;
    let isBaru = false;

    if (ssId && ssId !== "") {
      try {
        ss = SpreadsheetApp.openById(ssId);
      } catch (e) {
        ss = null;
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create(def.title);
      ssId = ss.getId();
      isBaru = true;
      Logger.log("✅ Berhasil membuat Spreadsheet baru: " + def.title + " (ID: " + ssId + ")");
    }

    // Bangun seluruh sheet
    def.sheets.forEach((shDef, idx) => {
      let sheet;
      if (idx === 0) {
        sheet = ss.getSheets()[0];
        sheet.setName(shDef.name);
      } else {
        sheet = ss.getSheetByName(shDef.name) || ss.insertSheet(shDef.name);
      }

      // Headers
      if (shDef.headers && sheet.getLastRow() === 0) {
        sheet.appendRow(shDef.headers);
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      // Seed Rows jika kosong
      if (shDef.seedRows && sheet.getLastRow() <= 1) {
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      // Format Rupiah & Tanggal
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });

    SpreadsheetApp.flush();
    return {
      success: true,
      spreadsheetId: ssId,
      url: ss.getUrl(),
      message: (isBaru ? "Spreadsheet baru berhasil dibuat: " : "Spreadsheet berhasil disinkronkan: ") + def.title + " (ID: " + ssId + ")"
    };
  } catch (err) {
    return { success: false, message: "Gagal membuat spreadsheet Payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Otomatisasi Rekap Tutup Buku Bulanan:
 * Menarik seluruh tindakan ber-JM dari sheet Rekap_Jasa_Medis
 * lalu membuat draft slip gaji di sheet Penggajian_Dokter.
 */
function generatePayrollPeriode(periodeBulan) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const targetBulan = periodeBulan || Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");
    
    // 1. Baca Rekap_Jasa_Medis
    const rawJM = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
    if (rawJM.length <= 1) {
      return { success: false, message: "Belum ada data tindakan di Rekap_Jasa_Medis." };
    }

    const hJM = rawJM[0];
    const idxDokter = getColIdx(hJM, ['dokter', 'nama_dokter']);
    const idxBruto = getColIdx(hJM, ['tarif_kotor', 'tarif']);
    const idxLab = getColIdx(hJM, ['biaya_lab', 'lab']);
    const idxDasar = getColIdx(hJM, ['dasar_bagi_hasil', 'dasar_jm']);
    const idxJMDokter = getColIdx(hJM, ['jm_dokter_bersih', 'jm_dokter']);

    // Agregasi per dokter
    let dokterMap = {};
    for (let i = 1; i < rawJM.length; i++) {
      let r = rawJM[i];
      let dokName = r[idxDokter] ? String(r[idxDokter]).trim() : "";
      if (!dokName || dokName === "" || dokName === "-") continue;

      if (!dokterMap[dokName]) {
        dokterMap[dokName] = {
          pasienCount: 0,
          bruto: 0,
          lab: 0,
          dasar: 0,
          jm: 0
        };
      }

      dokterMap[dokName].pasienCount += 1;
      dokterMap[dokName].bruto += Number(r[idxBruto]) || 0;
      dokterMap[dokName].lab += Number(r[idxLab]) || 0;
      dokterMap[dokName].dasar += Number(r[idxDasar]) || 0;
      dokterMap[dokName].jm += Number(r[idxJMDokter]) || 0;
    }

    // 2. Tulis ke Penggajian_Dokter
    let ssPayrollId = (DB_CONFIG && DB_CONFIG.PAYROLL) ? DB_CONFIG.PAYROLL.trim() : "";
    if (!ssPayrollId) {
      let initRes = setupPayrollSpreadsheet();
      ssPayrollId = initRes.spreadsheetId;
    }

    const sheetPayroll = getSheetEksternal(ssPayrollId, "Penggajian_Dokter");
    let countGenerated = 0;

    for (let dok in dokterMap) {
      let d = dokterMap[dok];
      let idPay = "PAY-DR-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(countGenerated + 1).padStart(3, '0');
      let pph21 = Math.round(d.jm * 0.025); // Estimasi PPh 21 tarif efektif
      let thp = d.jm - pph21;

      sheetPayroll.appendRow([
        idPay,
        targetBulan,
        "DOK-" + String(countGenerated + 1).padStart(3, '0'),
        dok,
        d.pasienCount,
        d.bruto,
        d.lab,
        d.dasar,
        d.jm,
        0, // Uang duduk
        0, // Bonus
        pph21,
        0, // Kasbon
        thp,
        "Bank Mandiri / BCA",
        "-",
        "Draft",
        "",
        "Tutup buku otomatis sistem RME",
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);
      countGenerated++;
    }

    return {
      success: true,
      count: countGenerated,
      message: "Berhasil menghasilkan " + countGenerated + " draft payroll dokter untuk periode: " + targetBulan
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}
"""

if "function setupPayrollSpreadsheet" not in setup_code:
    setup_code = setup_code + "\n" + payroll_functions

with open(backend_setup_file, 'w', encoding='utf-8') as f:
    f.write(setup_code)

print("Updated 10_SetupSpreadsheets.gs successfully.")
