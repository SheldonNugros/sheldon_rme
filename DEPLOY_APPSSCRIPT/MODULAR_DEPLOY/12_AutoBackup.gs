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
 * FUNGSI UTAMA: Menjalankan proses backup seluruh spreadsheet database.
 * Dapat dipanggil secara manual dari Frontend atau secara otomatis oleh Time-driven Trigger.
 *
 * @return {Object} Status & ringkasan hasil backup
 */
function jalankanBackupSekarang() {
  const startTime = new Date();
  const timeStamp = Utilities.formatDate(startTime, "Asia/Jakarta", "yyyy-MM-dd_HH-mm-ss");

  Logger.log(`=== MEMULAI PROSES BACKUP RME (${timeStamp}) ===`);

  const rootFolder1 = getOrCreateRootBackupFolder();

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

  // Ambil daftar unik seluruh ID Spreadsheet yang ada di DB_CONFIG
  const dbMap = (typeof DB_CONFIG !== 'undefined') ? DB_CONFIG : {};
  const processedIds = new Set();
  const backupSummary = [];
  let successCount = 0;
  let failCount = 0;

  for (let key in dbMap) {
    const sheetId = dbMap[key];
    if (!sheetId || processedIds.has(sheetId)) continue;
    processedIds.add(sheetId);

    try {
      const origFile = DriveApp.getFileById(sheetId);
      const origName = origFile.getName();
      const backupFileName = `[BACKUP_${timeStamp}]_${origName}`;

      // Salin ke Folder 1 (Drive Utama: BACKUP_RME_SHELDON)
      const copy1 = origFile.makeCopy(backupFileName, rootFolder1);

      // Jika ada Folder 2 terpisah, salin juga ke Folder 2
      if (rootFolder2) {
        origFile.makeCopy(backupFileName, rootFolder2);
      }

      successCount++;
      backupSummary.push({
        kategori: key,
        namaAsli: origName,
        namaBackup: backupFileName,
        idBackup: copy1.getId(),
        status: "OK"
      });
      Logger.log(`[BACKUP OK] Berhasil mencadangkan '${origName}' (${key})`);
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
  const msg = `Backup selesai dalam ${durationSec} detik. Berhasil: ${successCount}, Gagal: ${failCount}. Tersimpan di folder '${rootFolder1.getName()}' & shared ke '${targetEmail}'. File lama (> ${retentionDays} hari) dibersihkan: ${deletedCount}.`;
  
  Logger.log(`=== HASIL: ${msg} ===`);

  return {
    success: successCount > 0,
    timestamp: timeStamp,
    folderNama: rootFolder1.getName(),
    folderUrl: rootFolder1.getUrl(),
    targetEmail: targetEmail,
    successCount: successCount,
    failCount: failCount,
    deletedOldItems: deletedCount,
    durationSec: durationSec,
    message: msg,
    details: backupSummary
  };
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

  const info = `Trigger Auto-Backup berhasil diaktifkan: Berjalan otomatis setiap hari pukul 02.00 WIB (Asia/Jakarta).`;
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
