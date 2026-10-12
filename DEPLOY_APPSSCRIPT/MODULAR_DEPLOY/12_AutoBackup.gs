// =========================================================================
// AUTO-BACKUP MULTI-DRIVE DATABASE KLINIK SHELDON (REDUNDANCY 2 TEMPAT)
// Target Drive 1: Google Drive Akun Utama (Folder: BACKUP_RME_SHELDON)
// Target Drive 2: Google Drive Sekunder (vembrian@gmail.com)
// Jadwal: Setiap Hari Pukul 02.00 Dini Hari (Asia/Jakarta)
// Retensi: Pembersihan otomatis berkas/subfolder berumur > 6 hari
// =========================================================================

/**
 * Mengambil atau membuat folder root backup di Google Drive utama
 * dan memastikan folder tersebut dibagikan (share) ke email sekunder dengan hak Editor.
 *
 * @return {Folder} Google Drive Folder instance
 */
function getOrCreateRootBackupFolder() {
  const folderName = (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.FOLDER_NAME) ? BACKUP_CONFIG.FOLDER_NAME : "BACKUP_RME_SHELDON";
  const targetEmail = (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.SECONDARY_EMAIL) ? BACKUP_CONFIG.SECONDARY_EMAIL : "vembrian@gmail.com";

  // Pastikan folder SELALU ditempatkan di tingkat terluar Google Drive (My Drive / Drive Saya)
  const myDriveRoot = DriveApp.getRootFolder();
  let rootFolder = null;

  const existingFolders = myDriveRoot.getFoldersByName(folderName);
  if (existingFolders.hasNext()) {
    rootFolder = existingFolders.next();
  } else {
    rootFolder = myDriveRoot.createFolder(folderName);
    Logger.log(`[BACKUP] Folder '${folderName}' berhasil dibuat di tingkat terluar Google Drive (My Drive / Drive Saya).`);
  }

  // Bagikan folder ke email sekunder (vembrian@gmail.com) dengan hak Editor
  if (targetEmail && targetEmail.includes("@")) {
    try {
      rootFolder.addEditor(targetEmail);
      Logger.log(`[BACKUP] Akses Editor ke folder '${folderName}' berhasil diberikan kepada ${targetEmail}.`);
    } catch (errShare) {
      Logger.log(`[BACKUP] Info share folder ke ${targetEmail}: ${errShare.message}`);
    }
  }

  return rootFolder;
}

/**
 * Menghapus berkas dan subfolder backup yang berumur lebih dari N hari (Retensi 6 hari).
 *
 * @param {Folder} rootFolder
 * @param {number} maxAgeDays
 */
function bersihkanBackupLama(rootFolder, maxAgeDays) {
  const days = maxAgeDays || 6;
  const thresholdMs = days * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  let totalDeleted = 0;

  try {
    // 1. Bersihkan file lepas lama di folder backup
    const files = rootFolder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      const fCreated = f.getDateCreated().getTime();
      if (now - fCreated > thresholdMs) {
        Logger.log(`[RETENSI] Menghapus file backup kadaluarsa (> ${days} hari): ${f.getName()}`);
        f.setTrashed(true);
        totalDeleted++;
      }
    }

    // 2. Bersihkan subfolder jika ada subfolder lama
    const subFolders = rootFolder.getFolders();
    while (subFolders.hasNext()) {
      const sub = subFolders.next();
      const subCreated = sub.getDateCreated().getTime();
      if (now - subCreated > thresholdMs) {
        Logger.log(`[RETENSI] Menghapus subfolder backup kadaluarsa (> ${days} hari): ${sub.getName()}`);
        sub.setTrashed(true);
        totalDeleted++;
      }
    }
  } catch (errClean) {
    Logger.log(`[RETENSI WARN] Catatan saat pembersihan file lama: ${errClean.message}`);
  }

  Logger.log(`[RETENSI] Pembersihan selesai. Total item kadaluarsa dipindahkan ke sampah: ${totalDeleted}`);
  return totalDeleted;
}

/**
 * Helper: Mengonversi array 2D dari Sheet menjadi teks CSV standar RFC 4180 (UTF-8).
 */
function _convertRowsToCsvString(rows) {
  if (!rows || rows.length === 0) return "";
  return rows.map(row => {
    return row.map(cell => {
      if (cell === null || cell === undefined) return "";
      let val = "";
      if (Object.prototype.toString.call(cell) === "[object Date]" && !isNaN(cell.getTime())) {
        val = Utilities.formatDate(cell, "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss").replace(" 00:00:00", "");
      } else {
        val = String(cell);
      }
      if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(",");
  }).join("\r\n");
}

/**
 * Helper: Mengekspor seluruh tab/sheet dari sebuah Spreadsheet menjadi file .csv
 * di dalam subfolder CSV pada folder Backup.
 */
function _exportSpreadsheetSheetsToCsvFolder(sheetId, kategoriKey, csvTargetFolder, dateStamp) {
  let exportedFiles = [];
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const ssCleanName = ss.getName().replace(/[^a-zA-Z0-9_-]/g, "_");
    const sheets = ss.getSheets();

    sheets.forEach(sh => {
      const lr = sh.getLastRow();
      const lc = sh.getLastColumn();
      if (lr < 1 || lc < 1) return;
      const rows = sh.getRange(1, 1, lr, lc).getDisplayValues();
      const csvText = _convertRowsToCsvString(rows);
      const shCleanName = sh.getName().replace(/[^a-zA-Z0-9_-]/g, "_");
      const csvFileName = `${ssCleanName}__${shCleanName}_${dateStamp}.csv`;

      // Hapus file CSV dengan nama yang sama di hari yang sama jika ada (agar ter-update rapi)
      const existingCsv = csvTargetFolder.getFilesByName(csvFileName);
      while (existingCsv.hasNext()) {
        existingCsv.next().setTrashed(true);
      }

      const blob = Utilities.newBlob("\uFEFF" + csvText, "text/csv;charset=utf-8", csvFileName);
      const createdFile = csvTargetFolder.createFile(blob);
      exportedFiles.push({
        kategori: kategoriKey,
        sheet: sh.getName(),
        fileName: csvFileName,
        fileId: createdFile.getId(),
        rowCount: lr
      });
    });
  } catch (eCsv) {
    Logger.log(`[CSV WARN] Gagal ekspor CSV untuk ${kategoriKey} (${sheetId}): ${eCsv.message}`);
  }
  return exportedFiles;
}

/**
 * FUNGSI UTAMA: Menjalankan proses backup seluruh spreadsheet database
 * (Salinan Spreadsheet + Ekspor File .CSV ke Google Drive).
 * Dapat dipanggil secara manual dari Frontend atau secara otomatis oleh Time-driven Trigger.
 *
 * @return {Object} Status & ringkasan hasil backup
 */
function jalankanBackupSekarang() {
  const startTime = new Date();
  const timeStamp = Utilities.formatDate(startTime, "Asia/Jakarta", "yyyy-MM-dd_HH-mm-ss");
  const dateStamp = Utilities.formatDate(startTime, "Asia/Jakarta", "yyyy-MM-dd");

  Logger.log(`=== MEMULAI PROSES BACKUP RME SPREADSHEET + CSV (${timeStamp}) ===`);

  const rootFolder1 = getOrCreateRootBackupFolder();

  // Siapkan subfolder khusus CSV harian di dalam BACKUP_RME_SHELDON
  const csvSubfolderName = `CSV_Backup_${dateStamp}`;
  let csvFolder1 = null;
  const exCsvFolders = rootFolder1.getFoldersByName(csvSubfolderName);
  if (exCsvFolders.hasNext()) {
    csvFolder1 = exCsvFolders.next();
  } else {
    csvFolder1 = rootFolder1.createFolder(csvSubfolderName);
  }

  // Target folder sekunder terpisah jika ditentukan
  let rootFolder2 = null;
  if (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.SECONDARY_FOLDER_ID) {
    try {
      rootFolder2 = DriveApp.getFolderById(BACKUP_CONFIG.SECONDARY_FOLDER_ID);
      Logger.log(`[BACKUP] Target folder kedua (ID: ${BACKUP_CONFIG.SECONDARY_FOLDER_ID}) aktif.`);
    } catch (e2) {
      Logger.log(`[BACKUP WARN] Folder ID sekunder tidak dapat diakses: ${e2.message}`);
    }
  }

  // Ambil daftar unik seluruh ID Spreadsheet yang ada di DB_CONFIG (+ Payroll jika sudah dibuat)
  const dbMap = Object.assign({}, (typeof DB_CONFIG !== 'undefined') ? DB_CONFIG : {});
  try {
    if (!dbMap.PAYROLL) {
      const savedPayId = PropertiesService.getScriptProperties().getProperty("RME_SS_ID_PAYROLL") ||
                         PropertiesService.getScriptProperties().getProperty("RME_PAYROLL_SS_ID");
      if (savedPayId) dbMap.PAYROLL = savedPayId;
    }
  } catch (eProp) {}

  const processedIds = new Set();
  const backupSummary = [];
  let successCount = 0;
  let csvCount = 0;
  let failCount = 0;

  for (let key in dbMap) {
    const sheetId = dbMap[key];
    if (!sheetId || processedIds.has(sheetId)) continue;
    processedIds.add(sheetId);

    try {
      const origFile = DriveApp.getFileById(sheetId);
      const origName = origFile.getName();
      const backupFileName = `[BACKUP_${timeStamp}]_${origName}`;

      // 1. Salin Spreadsheet ke Folder 1 (Drive Utama: BACKUP_RME_SHELDON)
      const copy1 = origFile.makeCopy(backupFileName, rootFolder1);

      // Jika ada Folder 2 terpisah, salin juga ke Folder 2
      if (rootFolder2) {
        origFile.makeCopy(backupFileName, rootFolder2);
      }

      // 2. Ekspor seluruh sheet di dalamnya menjadi file .CSV ke subfolder CSV_Backup_YYYY-MM-DD
      const csvExported = _exportSpreadsheetSheetsToCsvFolder(sheetId, key, csvFolder1, dateStamp);
      csvCount += csvExported.length;

      successCount++;
      backupSummary.push({
        kategori: key,
        namaAsli: origName,
        namaBackup: backupFileName,
        idBackup: copy1.getId(),
        csvFilesCount: csvExported.length,
        status: "OK"
      });
      Logger.log(`[BACKUP OK] Berhasil mencadangkan '${origName}' (${key}) + ${csvExported.length} file CSV`);
    } catch (errCopy) {
      failCount++;
      backupSummary.push({
        kategori: key,
        sheetId: sheetId,
        status: "ERROR",
        pesan: errCopy.message
      });
      Logger.log(`[BACKUP GAGAL] Gagal mencadangkan key '${key}' (ID: ${sheetId}): ${errCopy.message}`);
    }
  }

  // Jalankan pembersihan retensi file lama (> 6 hari)
  const retentionDays = (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.RETENTION_DAYS) ? BACKUP_CONFIG.RETENTION_DAYS : 6;
  const deletedCount = bersihkanBackupLama(rootFolder1, retentionDays);

  const durationSec = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
  const targetEmail = (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.SECONDARY_EMAIL) ? BACKUP_CONFIG.SECONDARY_EMAIL : "vembrian@gmail.com";
  const msg = `Backup selesai dalam ${durationSec} detik. Berhasil mencadangkan ${successCount} Spreadsheet & ${csvCount} file .CSV di folder '${rootFolder1.getName()}/${csvSubfolderName}' (shared ke '${targetEmail}'). File lama (> ${retentionDays} hari) dibersihkan: ${deletedCount}.`;
  
  Logger.log(`=== HASIL: ${msg} ===`);

  return {
    success: successCount > 0,
    timestamp: timeStamp,
    folderNama: rootFolder1.getName(),
    csvFolderNama: csvSubfolderName,
    folderUrl: rootFolder1.getUrl(),
    csvFolderUrl: csvFolder1 ? csvFolder1.getUrl() : rootFolder1.getUrl(),
    targetEmail: targetEmail,
    successCount: successCount,
    csvCount: csvCount,
    failCount: failCount,
    deletedOldItems: deletedCount,
    durationSec: durationSec,
    message: msg,
    details: backupSummary
  };
}

/**
 * Mengembalikan seluruh isi Sheet Database dalam format objek CSV siap unduh (Direct Download di Browser)
 * sekaligus menyimpannya ke folder CSV di Google Drive.
 */
function exportAllDatabaseToCSV() {
  try {
    const dateStamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    const rootFolder = getOrCreateRootBackupFolder();
    const csvSubfolderName = `CSV_Backup_${dateStamp}`;
    let csvFolder = null;
    const exFolders = rootFolder.getFoldersByName(csvSubfolderName);
    if (exFolders.hasNext()) {
      csvFolder = exFolders.next();
    } else {
      csvFolder = rootFolder.createFolder(csvSubfolderName);
    }

    const dbMap = Object.assign({}, (typeof DB_CONFIG !== 'undefined') ? DB_CONFIG : {});
    try {
      if (!dbMap.PAYROLL && typeof _findOrCreateSpreadsheetInFolder === 'function') {
        const foundPay = _findOrCreateSpreadsheetInFolder("PAYROLL", "RME Sheldon - 11 Payroll & Honor Dokter");
        if (foundPay && foundPay.ssId) dbMap.PAYROLL = foundPay.ssId;
      }
    } catch (eP) {}

    const processedIds = new Set();
    const csvPayloads = [];

    for (let key in dbMap) {
      const sheetId = dbMap[key];
      if (!sheetId || processedIds.has(sheetId)) continue;
      processedIds.add(sheetId);

      try {
        const ss = SpreadsheetApp.openById(sheetId);
        const ssCleanName = ss.getName().replace(/[^a-zA-Z0-9_-]/g, "_");
        const sheets = ss.getSheets();

        sheets.forEach(sh => {
          const lr = sh.getLastRow();
          const lc = sh.getLastColumn();
          if (lr < 1 || lc < 1) return;
          const rows = sh.getRange(1, 1, lr, lc).getDisplayValues();
          const csvContent = _convertRowsToCsvString(rows);
          const shCleanName = sh.getName().replace(/[^a-zA-Z0-9_-]/g, "_");
          const fileName = `${ssCleanName}__${shCleanName}_${dateStamp}.csv`;

          // Simpan juga ke Google Drive
          const existing = csvFolder.getFilesByName(fileName);
          while (existing.hasNext()) {
            existing.next().setTrashed(true);
          }
          const blob = Utilities.newBlob("\uFEFF" + csvContent, "text/csv;charset=utf-8", fileName);
          csvFolder.createFile(blob);

          csvPayloads.push({
            kategori: key,
            spreadsheetTitle: ss.getName(),
            sheetName: sh.getName(),
            fileName: fileName,
            rowCount: lr,
            csvContent: csvContent
          });
        });
      } catch (eSheet) {
        Logger.log("Skip CSV export " + key + ": " + eSheet.message);
      }
    }

    return {
      success: true,
      dateStamp: dateStamp,
      csvFolderName: csvSubfolderName,
      csvFolderUrl: csvFolder.getUrl(),
      totalFiles: csvPayloads.length,
      files: csvPayloads,
      message: `Berhasil mengekspor ${csvPayloads.length} sheet database ke file .CSV di Google Drive (${csvSubfolderName}) dan siap diunduh!`
    };
  } catch (err) {
    return { success: false, message: "Gagal mengekspor database ke CSV: " + err.message };
  }
}

/**
 * FUNGSI PEMASANG TRIGGER OTOMATIS:
 * Menyetel Trigger harian otomatis pada pukul 02.00 dini hari WIB.
 * Aman dipanggil berulang kali (idempotent, tidak akan membuat trigger duplikat).
 */
function pasangTriggerAutoBackupHarianJam02() {
  const handlerFunc = "jalankanBackupSekarang";
  const scheduleHour = (typeof BACKUP_CONFIG !== 'undefined' && BACKUP_CONFIG.SCHEDULE_HOUR) ? BACKUP_CONFIG.SCHEDULE_HOUR : 2;

  // Hapus trigger lama jika sudah ada
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === handlerFunc) {
      ScriptApp.deleteTrigger(t);
      Logger.log(`[TRIGGER] Trigger lama untuk '${handlerFunc}' telah dihapus.`);
    }
  }

  // Buat trigger baru setiap hari pukul 02.00 WIB
  ScriptApp.newTrigger(handlerFunc)
    .timeBased()
    .everyDays(1)
    .atHour(scheduleHour)
    .nearMinute(0)
    .inTimezone("Asia/Jakarta")
    .create();

  const info = `Trigger Auto-Backup (Spreadsheet + CSV) berhasil diaktifkan: Berjalan otomatis setiap hari pukul 02.00 WIB (Asia/Jakarta).`;
  Logger.log(info);
  return { success: true, message: info };
}

/**
 * Mengecek status apakah trigger auto backup harian saat ini aktif.
 */
function getStatusTriggerAutoBackup() {
  const handlerFunc = "jalankanBackupSekarang";
  const triggers = ScriptApp.getProjectTriggers();
  let isAktif = false;
  for (let t of triggers) {
    if (t.getHandlerFunction() === handlerFunc) {
      isAktif = true;
      break;
    }
  }
  return {
    aktif: isAktif,
    jamJadwal: "02:00 WIB",
    retensiHari: 6,
    folderUtama: "BACKUP_RME_SHELDON",
    targetAkun2: "vembrian@gmail.com"
  };
}
