// =========================================================================
// SISTEM ARSIP TAHUNAN TERPISAH (TIERED COLD STORAGE PER TAHUN)
// Jadwal: Setiap Tanggal 1 Januari Pukul 01.00 Dini Hari (Asia/Jakarta)
// Berbagi Akses: vembrian@gmail.com
// Penamaan Spreadsheet: RME_Arsip_[TAHUN] (Contoh: RME_Arsip_2024, RME_Arsip_2025)
// =========================================================================

/**
 * Helper untuk mengekstrak tahun dari berbagai format cell tanggal/waktu di Google Sheets
 * @param {any} val
 * @return {number|null} Tahun 4-digit (misal: 2024)
 */
function extractYearFromCell(val) {
  if (!val) return null;
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
    return val.getFullYear();
  }
  const s = String(val).trim();
  // Cek pola dd-mm-yyyy atau dd/mm/yyyy
  const mDmy = s.match(/^\d{1,2}[-\/]\d{1,2}[-\/](\d{4})/);
  if (mDmy) return parseInt(mDmy[1], 10);

  // Cek pola yyyy-mm-dd atau yyyy/mm/dd
  const mYmd = s.match(/^(\d{4})[-\/]\d{1,2}[-\/]\d{1,2}/);
  if (mYmd) return parseInt(mYmd[1], 10);

  // Fallback 4 digit
  const m4 = s.match(/\b(20\d{2})\b/);
  if (m4) return parseInt(m4[1], 10);

  return null;
}

/**
 * Mengambil registry daftar ID Spreadsheet Arsip per tahun dari ScriptProperties.
 * @return {Object} { "2024": { id: "...", name: "...", url: "..." }, ... }
 */
function getArchiveRegistry() {
  const propKey = (typeof ARCHIVE_CONFIG !== 'undefined' && ARCHIVE_CONFIG.PROPERTY_KEY) ? ARCHIVE_CONFIG.PROPERTY_KEY : "RME_ARCHIVE_REGISTRY";
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(propKey);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

/**
 * Menyimpan pembaruan registry arsip ke ScriptProperties
 * @param {Object} registryMap
 */
function saveArchiveRegistry(registryMap) {
  const propKey = (typeof ARCHIVE_CONFIG !== 'undefined' && ARCHIVE_CONFIG.PROPERTY_KEY) ? ARCHIVE_CONFIG.PROPERTY_KEY : "RME_ARCHIVE_REGISTRY";
  PropertiesService.getScriptProperties().setProperty(propKey, JSON.stringify(registryMap || {}));
}

/**
 * Mengambil atau membuat Spreadsheet Arsip khusus untuk tahun tertentu di root Google Drive.
 * Otomatis membagikan hak Editor ke vembrian@gmail.com.
 *
 * @param {number|string} tahun
 * @return {Spreadsheet} Instance Google Spreadsheet Arsip
 */
function getOrCreateArchiveSpreadsheet(tahun) {
  const prefix = (typeof ARCHIVE_CONFIG !== 'undefined' && ARCHIVE_CONFIG.PREFIX_NAME) ? ARCHIVE_CONFIG.PREFIX_NAME : "RME_Arsip_";
  const title = `${prefix}${tahun}`;
  const targetEmail = (typeof ARCHIVE_CONFIG !== 'undefined' && ARCHIVE_CONFIG.TARGET_EMAIL) ? ARCHIVE_CONFIG.TARGET_EMAIL : "vembrian@gmail.com";

  let ss = null;
  const registry = getArchiveRegistry();

  // 1. Cek dari registry
  if (registry[String(tahun)] && registry[String(tahun)].id) {
    try {
      ss = SpreadsheetApp.openById(registry[String(tahun)].id);
    } catch (eOpen) {
      Logger.log(`[ARSIP] Gagal membuka dari registry: ${eOpen.message}`);
    }
  }

  // 2. Cek di Drive jika belum ditemukan dari registry
  if (!ss) {
    const files = DriveApp.getFilesByName(title);
    if (files.hasNext()) {
      const file = files.next();
      ss = SpreadsheetApp.openById(file.getId());
    }
  }

  // 3. Jika belum ada sama sekali, buat baru di tingkat terluar Drive (My Drive)
  if (!ss) {
    ss = SpreadsheetApp.create(title);
    const ssFile = DriveApp.getFileById(ss.getId());
    Logger.log(`[ARSIP] Spreadsheet Arsip baru '${title}' berhasil dibuat di My Drive.`);

    // Bagikan ke vembrian@gmail.com
    if (targetEmail && targetEmail.includes("@")) {
      try {
        ssFile.addEditor(targetEmail);
        Logger.log(`[ARSIP] Hak akses ke '${title}' berhasil dibagikan kepada ${targetEmail}.`);
      } catch (errShare) {
        Logger.log(`[ARSIP] Info share ${targetEmail}: ${errShare.message}`);
      }
    }
  }

  // Update registry
  registry[String(tahun)] = {
    id: ss.getId(),
    name: ss.getName(),
    url: ss.getUrl(),
    tahun: String(tahun),
    updatedAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };
  saveArchiveRegistry(registry);

  return ss;
}

/**
 * FUNGSI UTAMA: Memindahkan data dari Spreadsheet Aktif ke Spreadsheet Arsip Per Tahun.
 * Memindahkan data Rekam Medis, Pembayaran, dan Surat pada tahun target.
 *
 * @param {number|string} [targetYear] Tahun yang ingin diarsipkan (misal: 2025). Jika kosong, otomatis tahun kemarin.
 * @return {Object} Status & rincian hasil pengarsipan
 */
function jalankanArsipTahunan(targetYear) {
  const startTime = new Date();
  const currentYear = startTime.getFullYear();
  const tahun = targetYear ? parseInt(targetYear, 10) : (currentYear - 1);

  Logger.log(`=== MEMULAI PENGARSIPAN TAHUNAN (Tahun Target: ${tahun}) ===`);

  const archiveSs = getOrCreateArchiveSpreadsheet(tahun);
  const targetEmail = (typeof ARCHIVE_CONFIG !== 'undefined' && ARCHIVE_CONFIG.TARGET_EMAIL) ? ARCHIVE_CONFIG.TARGET_EMAIL : "vembrian@gmail.com";

  let summary = {
    tahun: tahun,
    spreadsheetName: archiveSs.getName(),
    spreadsheetUrl: archiveSs.getUrl(),
    targetEmail: targetEmail,
    rekamMedisDipindahkan: 0,
    pembayaranDipindahkan: 0,
    suratDipindahkan: 0,
    logDipindahkan: 0,
    errors: []
  };

  // -------------------------------------------------------------------------
  // 1. ARSIP DATA REKAM MEDIS
  // -------------------------------------------------------------------------
  try {
    const ssAktifRM = SpreadsheetApp.openById(DB_CONFIG.REKAM_MEDIS);
    const sheetAktifRM = ssAktifRM.getSheetByName("Data_Rekam_Medis");
    if (sheetAktifRM && sheetAktifRM.getLastRow() > 1) {
      const dataRM = sheetAktifRM.getDataRange().getValues();
      const headerRM = dataRM[0];
      let idxTglRM = getColIdx(headerRM, ['tanggalpemeriksaan', 'tanggalperiksa', 'tgl']);
      if (idxTglRM === -1) idxTglRM = 4;

      // Ambil tab arsip di Spreadsheet Arsip
      let sheetArsipRM = archiveSs.getSheetByName("Data_Rekam_Medis");
      if (!sheetArsipRM) {
        sheetArsipRM = archiveSs.insertSheet("Data_Rekam_Medis");
        sheetArsipRM.appendRow(headerRM);
      }

      // Filter baris yang sesuai dengan tahun target
      let rowsToArchive = [];
      let rowIndicesToDelete = []; // simpan indeks 1-based dari bawah ke atas

      for (let i = dataRM.length - 1; i >= 1; i--) {
        const row = dataRM[i];
        const yr = extractYearFromCell(row[idxTglRM]);
        if (yr === tahun) {
          rowsToArchive.unshift(row);
          rowIndicesToDelete.push(i + 1); // sheet row is 1-indexed
        }
      }

      if (rowsToArchive.length > 0) {
        // Salin ke sheet arsip
        sheetArsipRM.getRange(sheetArsipRM.getLastRow() + 1, 1, rowsToArchive.length, headerRM.length).setValues(rowsToArchive);
        // Hapus baris dari sheet aktif
        for (let rIdx of rowIndicesToDelete) {
          sheetAktifRM.deleteRow(rIdx);
        }
        summary.rekamMedisDipindahkan = rowsToArchive.length;
        Logger.log(`[ARSIP RM] ${rowsToArchive.length} baris EMR berhasil dipindahkan ke ${archiveSs.getName()}`);
      }
    }
  } catch (errRM) {
    summary.errors.push(`Rekam Medis: ${errRM.message}`);
    Logger.log(`[ARSIP ERR RM] ${errRM.message}`);
  }

  // -------------------------------------------------------------------------
  // 2. ARSIP DATA PEMBAYARAN / KASIR
  // -------------------------------------------------------------------------
  try {
    const ssAktifBayar = SpreadsheetApp.openById(DB_CONFIG.PEMBAYARAN);
    const sheetAktifBayar = ssAktifBayar.getSheetByName("Data_Pembayaran");
    if (sheetAktifBayar && sheetAktifBayar.getLastRow() > 1) {
      const dataBayar = sheetAktifBayar.getDataRange().getValues();
      const headerBayar = dataBayar[0];
      let idxTglBayar = getColIdx(headerBayar, ['tanggaltindakan', 'tanggal', 'tgl']);
      if (idxTglBayar === -1) idxTglBayar = 1;

      let sheetArsipBayar = archiveSs.getSheetByName("Data_Pembayaran");
      if (!sheetArsipBayar) {
        sheetArsipBayar = archiveSs.insertSheet("Data_Pembayaran");
        sheetArsipBayar.appendRow(headerBayar);
      }

      let rowsToArchive = [];
      let rowIndicesToDelete = [];

      for (let i = dataBayar.length - 1; i >= 1; i--) {
        const row = dataBayar[i];
        const yr = extractYearFromCell(row[idxTglBayar]);
        if (yr === tahun) {
          rowsToArchive.unshift(row);
          rowIndicesToDelete.push(i + 1);
        }
      }

      if (rowsToArchive.length > 0) {
        sheetArsipBayar.getRange(sheetArsipBayar.getLastRow() + 1, 1, rowsToArchive.length, headerBayar.length).setValues(rowsToArchive);
        for (let rIdx of rowIndicesToDelete) {
          sheetAktifBayar.deleteRow(rIdx);
        }
        summary.pembayaranDipindahkan = rowsToArchive.length;
        Logger.log(`[ARSIP BAYAR] ${rowsToArchive.length} baris pembayaran berhasil dipindahkan ke ${archiveSs.getName()}`);
      }
    }
  } catch (errBayar) {
    summary.errors.push(`Pembayaran: ${errBayar.message}`);
    Logger.log(`[ARSIP ERR BAYAR] ${errBayar.message}`);
  }

  // -------------------------------------------------------------------------
  // 3. ARSIP DATA SURAT & FORMULIR
  // -------------------------------------------------------------------------
  try {
    const ssAktifSurat = SpreadsheetApp.openById(DB_CONFIG.SURAT);
    const daftarTabSurat = ["Surat_Sakit", "Surat_Kontrol", "Resume_Medis", "Surat_Rujukan", "Surat_Lab", "Surat_Radiologi"];
    let totalSurat = 0;

    for (let tabName of daftarTabSurat) {
      const sh = ssAktifSurat.getSheetByName(tabName);
      if (!sh || sh.getLastRow() <= 1) continue;

      const dataS = sh.getDataRange().getValues();
      const headerS = dataS[0];
      let idxTgl = getColIdx(headerS, ['tglcetak', 'tgl_cetak', 'tanggalcetak', 'tanggal']);
      if (idxTgl === -1) idxTgl = 4;

      let shArsip = archiveSs.getSheetByName(tabName);
      if (!shArsip) {
        shArsip = archiveSs.insertSheet(tabName);
        shArsip.appendRow(headerS);
      }

      let rowsToArchive = [];
      let rowIndicesToDelete = [];

      for (let i = dataS.length - 1; i >= 1; i--) {
        const row = dataS[i];
        const yr = extractYearFromCell(row[idxTgl]);
        if (yr === tahun) {
          rowsToArchive.unshift(row);
          rowIndicesToDelete.push(i + 1);
        }
      }

      if (rowsToArchive.length > 0) {
        shArsip.getRange(shArsip.getLastRow() + 1, 1, rowsToArchive.length, headerS.length).setValues(rowsToArchive);
        for (let rIdx of rowIndicesToDelete) {
          sh.deleteRow(rIdx);
        }
        totalSurat += rowsToArchive.length;
      }
    }
    summary.suratDipindahkan = totalSurat;
    Logger.log(`[ARSIP SURAT] Total ${totalSurat} berkas surat dipindahkan.`);
  } catch (errSurat) {
    summary.errors.push(`Surat: ${errSurat.message}`);
    Logger.log(`[ARSIP ERR SURAT] ${errSurat.message}`);
  }

  // -------------------------------------------------------------------------
  // 4. ARSIP DATA LOG AKTIVITAS (RME Sheldon - 07 Log)
  // -------------------------------------------------------------------------
  try {
    const ssAktifLog = SpreadsheetApp.openById(DB_CONFIG.LOG);
    const sheetAktifLog = ssAktifLog.getSheetByName("Log_Aktivitas");
    if (sheetAktifLog && sheetAktifLog.getLastRow() > 1) {
      const dataLog = sheetAktifLog.getDataRange().getValues();
      const headerLog = dataLog[0];
      let idxTglLog = getColIdx(headerLog, ['waktuaktivitas', 'waktu', 'tanggal']);
      if (idxTglLog === -1) idxTglLog = 0;

      let sheetArsipLog = archiveSs.getSheetByName("Log_Aktivitas");
      if (!sheetArsipLog) {
        sheetArsipLog = archiveSs.insertSheet("Log_Aktivitas");
        sheetArsipLog.appendRow(headerLog);
      }

      let rowsToArchive = [];
      let rowIndicesToDelete = [];

      for (let i = dataLog.length - 1; i >= 1; i--) {
        const row = dataLog[i];
        const yr = extractYearFromCell(row[idxTglLog]);
        if (yr === tahun) {
          rowsToArchive.unshift(row);
          rowIndicesToDelete.push(i + 1);
        }
      }

      if (rowsToArchive.length > 0) {
        sheetArsipLog.getRange(sheetArsipLog.getLastRow() + 1, 1, rowsToArchive.length, headerLog.length).setValues(rowsToArchive);
        for (let rIdx of rowIndicesToDelete) {
          sheetAktifLog.deleteRow(rIdx);
        }
        summary.logDipindahkan = rowsToArchive.length;
        Logger.log(`[ARSIP LOG] ${rowsToArchive.length} baris log berhasil dipindahkan ke ${archiveSs.getName()}`);
      }
    }
  } catch (errLog) {
    summary.errors.push(`Log: ${errLog.message}`);
    Logger.log(`[ARSIP ERR LOG] ${errLog.message}`);
  }

  // Hapus sheet default "Sheet1" jika masih ada dan ada sheet lain
  try {
    const defaultSheet = archiveSs.getSheetByName("Sheet1");
    if (defaultSheet && archiveSs.getSheets().length > 1) {
      archiveSs.deleteSheet(defaultSheet);
    }
  } catch (eClean) {}

  const durationSec = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
  summary.durationSec = durationSec;
  summary.success = summary.errors.length === 0;
  summary.message = `Pengarsipan Tahun ${tahun} Selesai dalam ${durationSec} detik. EMR: ${summary.rekamMedisDipindahkan}, Kasir: ${summary.pembayaranDipindahkan}, Surat: ${summary.suratDipindahkan}, Log: ${summary.logDipindahkan}. Tersimpan di '${archiveSs.getName()}' & dibagikan ke '${targetEmail}'.`;

  Logger.log(`=== HASIL PENGARSIPAN: ${summary.message} ===`);
  return summary;
}

/**
 * Trigger otomatis yang berjalan setiap tanggal 1 setiap bulan pukul 01.00 WIB.
 * Hanya memicu pengarsipan jika saat ini adalah tanggal 1 Januari (Bulan Januari / month 0).
 */
function triggerArsipTahunanOtomatis() {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = Januari
  const currentDay = now.getDate();

  Logger.log(`[TRIGGER ARSIP] Memeriksa jadwal: Bulan=${currentMonth + 1}, Tanggal=${currentDay}`);

  // Hanya eksekusi pada tanggal 1 Januari
  if (currentMonth === 0 && currentDay === 1) {
    const tahunLalu = now.getFullYear() - 1;
    Logger.log(`[TRIGGER ARSIP] Tanggal 1 Januari terdeteksi! Memulai arsip tahun ${tahunLalu}`);
    return jalankanArsipTahunan(tahunLalu);
  } else {
    Logger.log(`[TRIGGER ARSIP] Bukan 1 Januari. Pengarsipan dilewati.`);
    return { skipped: true, info: "Hanya berjalan otomatis pada 1 Januari." };
  }
}

/**
 * Memasang Time-driven Trigger untuk berjalan otomatis setiap tanggal 1 setiap bulan pada pukul 01.00 WIB.
 * Idempoten: Menghapus trigger lama sebelum membuat baru agar tidak duplikat.
 */
function pasangTriggerArsipTahunan1Januari() {
  const handlerFunc = "triggerArsipTahunanOtomatis";

  // Hapus trigger lama
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === handlerFunc) {
      ScriptApp.deleteTrigger(t);
      Logger.log(`[TRIGGER] Trigger lama untuk '${handlerFunc}' dihapus.`);
    }
  }

  // Pasang trigger baru: setiap bulan pada tanggal 1 jam 01.00 WIB
  ScriptApp.newTrigger(handlerFunc)
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .nearMinute(0)
    .inTimezone("Asia/Jakarta")
    .create();

  const info = `Trigger Pengarsipan Tahunan Berhasil Aktif: Dijadwalkan otomatis setiap tanggal 1 Januari pukul 01.00 WIB (Asia/Jakarta).`;
  Logger.log(info);
  return { success: true, message: info };
}

/**
 * FUNGSI ON-DEMAND SEARCH:
 * Membaca data Rekam Medis pasien tertentu dari seluruh Spreadsheet Arsip yang terdaftar.
 * Dipanggil dari web app saat dokter butuh riwayat masa lalu pasien.
 *
 * @param {string} idPasien ID Pasien
 * @param {string} [noRM] Nomor Rekam Medis (opsional)
 * @return {Array<Object>} Daftar riwayat EMR dari arsip
 */
function bacaRekamMedisArsipPasien(idPasien, noRM) {
  if (!idPasien && !noRM) return [];
  const targetId = String(idPasien || "").trim().toLowerCase();
  const targetRM = String(noRM || "").trim().toLowerCase();

  const registry = getArchiveRegistry();
  const hasil = [];

  // Urutkan tahun arsip dari yang terbaru ke terlama
  const tahunList = Object.keys(registry).sort((a, b) => b.localeCompare(a));

  for (let thn of tahunList) {
    const info = registry[thn];
    if (!info || !info.id) continue;

    try {
      const v = readFast(info.id, "Data_Rekam_Medis");
      if (v.length <= 1) continue;

      const h = v[0];
      let idRM = getColIdx(h, ['idrmklinis', 'idrm', 'id']); if (idRM === -1) idRM = 0;
      let idPas = getColIdx(h, ['idpasien']); if (idPas === -1) idPas = 1;
      let idNoRm = getColIdx(h, ['norm']); if (idNoRm === -1) idNoRm = 2;
      let idNama = getColIdx(h, ['namapasien']); if (idNama === -1) idNama = 3;
      let idTgl = getColIdx(h, ['tanggalpemeriksaan', 'tanggalperiksa']); if (idTgl === -1) idTgl = 4;
      let idDok = getColIdx(h, ['dokterpemeriksa', 'dokter']); if (idDok === -1) idDok = 5;
      let idAna = getColIdx(h, ['anamnesisjson', 'anamnesis']); if (idAna === -1) idAna = 6;
      let idFis = getColIdx(h, ['fisikjson', 'fisik']); if (idFis === -1) idFis = 7;
      let idOdo = getColIdx(h, ['odontogramjson', 'odontogram']); if (idOdo === -1) idOdo = 8;
      let idTin = getColIdx(h, ['tindakanjson', 'tindakan']); if (idTin === -1) idTin = 9;
      let idObat = getColIdx(h, ['resepobatjson', 'resep', 'obat']); if (idObat === -1) idObat = 10;
      let idEdu = getColIdx(h, ['catatanedukasi', 'edukasi']); if (idEdu === -1) idEdu = 11;
      let idWaktu = getColIdx(h, ['waktusimpan', 'waktu']); if (idWaktu === -1) idWaktu = 12;

      for (let i = 1; i < v.length; i++) {
        const r = v[i];
        const rowIdPas = String(r[idPas] || "").trim().toLowerCase();
        const rowNoRm = String(r[idNoRm] || "").trim().toLowerCase();

        // Cocokkan pasien
        if ((targetId && rowIdPas === targetId) || (targetRM && rowNoRm === targetRM)) {
          hasil.push({
            isArsip: true,
            tahunArsip: thn,
            sumberSpreadsheet: info.name,
            idRmKlinis: r[idRM] ? String(r[idRM]).trim() : `ARSIP_${thn}_${i}`,
            waktuSimpan: String(r[idWaktu] || ""),
            idPasien: String(r[idPas] || "").trim(),
            noRm: r[idNoRm] ? String(r[idNoRm]).trim() : "",
            namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
            tanggalPeriksa: fDate(r[idTgl]),
            dokterPemeriksa: r[idDok] ? String(r[idDok]).trim() : "",
            anamnesisStr: r[idAna] ? String(r[idAna]).trim() : "",
            fisikStr: r[idFis] ? String(r[idFis]).trim() : "",
            odontogramStr: r[idOdo] ? String(r[idOdo]).trim() : "",
            tindakanStr: r[idTin] ? String(r[idTin]).trim() : "",
            obatStr: r[idObat] ? String(r[idObat]).trim() : "",
            catatanEdukasi: r[idEdu] ? String(r[idEdu]).trim() : ""
          });
        }
      }
    } catch (errRead) {
      Logger.log(`[ARSIP READ ERR ${thn}] ${errRead.message}`);
    }
  }

  return hasil;
}

/**
 * FUNGSI ON-DEMAND SEARCH:
 * Membaca data invoice lama pasien tertentu dari Spreadsheet Arsip.
 *
 * @param {string} idPasien ID Pasien
 * @param {string} [noRM] Nomor Rekam Medis
 * @return {Array<Object>} Daftar invoice dari arsip
 */
function bacaInvoiceArsipPasien(idPasien, noRM) {
  if (!idPasien && !noRM) return [];
  const targetId = String(idPasien || "").trim().toLowerCase();
  const targetRM = String(noRM || "").trim().toLowerCase();

  const registry = getArchiveRegistry();
  const hasil = [];
  const tahunList = Object.keys(registry).sort((a, b) => b.localeCompare(a));

  for (let thn of tahunList) {
    const info = registry[thn];
    if (!info || !info.id) continue;

    try {
      const v = readFast(info.id, "Data_Pembayaran");
      if (v.length <= 1) continue;

      const h = v[0];
      let idInv = getColIdx(h, ['idinvoice', 'invoice']); if (idInv === -1) idInv = 0;
      let idTgl = getColIdx(h, ['tanggaltindakan', 'tanggal']); if (idTgl === -1) idTgl = 1;
      let idPas = getColIdx(h, ['idpasien']); if (idPas === -1) idPas = 2;
      let idNoRm = getColIdx(h, ['norm']); if (idNoRm === -1) idNoRm = 3;
      let idNama = getColIdx(h, ['namapasien']); if (idNama === -1) idNama = 4;
      let idDok = getColIdx(h, ['dokterpemeriksa', 'dokter']); if (idDok === -1) idDok = 5;
      let idItem = getColIdx(h, ['namaitem', 'item']); if (idItem === -1) idItem = 7;
      let idGTotal = getColIdx(h, ['grandtotalitem', 'total']); if (idGTotal === -1) idGTotal = 12;
      let idTotInv = getColIdx(h, ['totalinvoice']); if (idTotInv === -1) idTotInv = 14;
      let idMetode = getColIdx(h, ['metodebayar', 'metode']); if (idMetode === -1) idMetode = 15;
      let idStatus = getColIdx(h, ['statuspembayaran', 'status']); if (idStatus === -1) idStatus = 16;

      for (let i = 1; i < v.length; i++) {
        const r = v[i];
        const rowIdPas = String(r[idPas] || "").trim().toLowerCase();
        const rowNoRm = String(r[idNoRm] || "").trim().toLowerCase();

        if ((targetId && rowIdPas === targetId) || (targetRM && rowNoRm === targetRM)) {
          hasil.push({
            isArsip: true,
            tahunArsip: thn,
            idInvoice: String(r[idInv] || ""),
            tanggalTindakan: fDate(r[idTgl]),
            namaPasien: String(r[idNama] || ""),
            noRm: String(r[idNoRm] || ""),
            dokterPemeriksa: String(r[idDok] || ""),
            namaItem: String(r[idItem] || ""),
            grandTotalItem: Number(r[idGTotal]) || 0,
            totalInvoice: Number(r[idTotInv]) || 0,
            metodeBayar: String(r[idMetode] || "Tunai"),
            statusPembayaran: String(r[idStatus] || "Lunas")
          });
        }
      }
    } catch (e) {
      Logger.log(`[ARSIP INV READ ERR ${thn}] ${e.message}`);
    }
  }

  return hasil;
}

/**
 * Mengambil ringkasan informasi arsip untuk ditampilkan di Frontend
 */
function getStatusArsipTahunan() {
  const registry = getArchiveRegistry();
  const triggers = ScriptApp.getProjectTriggers();
  let triggerAktif = false;
  for (let t of triggers) {
    if (t.getHandlerFunction() === "triggerArsipTahunanOtomatis") {
      triggerAktif = true;
      break;
    }
  }

  return {
    triggerAktif: triggerAktif,
    jadwal: "Setiap 1 Januari pukul 01.00 WIB",
    targetEmail: "vembrian@gmail.com",
    totalTahunTersimpan: Object.keys(registry).length,
    daftarTahun: Object.keys(registry).sort((a, b) => b.localeCompare(a)).map(thn => ({
      tahun: thn,
      nama: registry[thn].name,
      url: registry[thn].url,
      updatedAt: registry[thn].updatedAt
    }))
  };
}
