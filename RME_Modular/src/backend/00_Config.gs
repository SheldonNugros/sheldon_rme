// =========================================================================
// KONFIGURASI DATABASE GOOGLE SHEETS & ROLE ACCESS RULES
// =========================================================================

/**
 * ID Spreadsheet Database RME Klinik Sheldon Enterprise.
 * Ganti nilai ID di bawah dengan ID Spreadsheet yang dibuat oleh `setupAllSpreadsheets()`
 * atau Spreadsheet Google Sheets milik Anda sendiri.
 */
const DB_CONFIG = {
  "PASIEN": "1CmwIrEpuVsE3z5gphsJ_cdOEXk9J_0n-u2cx28VBe-k",
  "PEMBAYARAN": "1HNIi5ZF0qGrONECxWEJ1UDDW7g72SYoIb8MPPwsVOYY",
  "REKAM_MEDIS": "1vyXsT_dOiRRj0M5d4NivpSyTky-NDu_DO2qafvOH5Jw",
  "SURAT": "1J9-XU7b7NSKCGqAaDaNK27bgfeBqwL986PG7D3dXuAY",
  "DATABASE": "1K9C60hweu2feayWVKdzG80z9yhzkv1ONQ7Ao3xqPkZM",
  "MASTER": "1e_UqCBpqs-YBF2XRsaoW3yG1r8o3nNDI1vGPQyp8nCE",
  "LOG": "1QcDT9th0EB2keQF3hPjh6Pw9dstoD3ulsljTmc0w_Vk",
  "OBAT": "1cSQyijbtSlrTeGufQJXKwhWhz5DnqW7hhkp78pUoQsk",
  "BMHP": "1j4cc_cPd79BWM1WG3LnRrRizttZvr_GdjCaPWUstcJk",
  "ICD10": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE",
  "ICD9": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE",
  "PAYROLL": ""
};

/**
 * Konfigurasi Auto-Backup 2 Tempat (Drive Lokal & Drive Eksternal).
 */
const BACKUP_CONFIG = {
  FOLDER_NAME: "BACKUP_RME_SHELDON",
  SECONDARY_EMAIL: "vembrian@gmail.com",
  SECONDARY_FOLDER_ID: "", // Opsional: Masukkan Folder ID jika folder akun kedua dibuat manual & di-share
  RETENTION_DAYS: 6,       // Otomatis hapus backup yang berumur lebih dari 6 hari
  SCHEDULE_HOUR: 2         // Pukul 02.00 dini hari
};

/**
 * Konfigurasi Arsip Tahunan Terpisah (Opsi 2: Tiered Storage Per Tahun).
 * Dilakukan otomatis setiap tanggal 1 Januari pada pukul 01.00 WIB.
 */
const ARCHIVE_CONFIG = {
  PREFIX_NAME: "RME_Arsip_",
  TARGET_EMAIL: "vembrian@gmail.com",
  SCHEDULE_MONTH: 1, // 1 Januari
  SCHEDULE_DAY: 1,
  SCHEDULE_HOUR: 1,  // Pukul 01.00 WIB
  PROPERTY_KEY: "RME_ARCHIVE_REGISTRY"
};

/**
 * Matriks Hak Akses Modul berdasarkan Role Pekerja (Active User).
 */
const ROLE_RULES = {
  "SUPER_USER": {
    roles: ["super user", "owner"],
    allowedMenus: ["dashboard", "ai", "pasien", "rekam-medis", "surat", "database", "inventory", "informasi", "kasir", "riwayat-invoice", "payroll"],
    defaultMenu: "dashboard"
  },
  "DOKTER_SPESIALIS": {
    roles: ["dokter gigi spesialis"],
    allowedMenus: ["rekam-medis", "surat", "informasi", "pasien"],
    defaultMenu: "rekam-medis"
  },
  "DOKTER_UMUM": {
    roles: ["dokter gigi umum", "dokter"],
    allowedMenus: ["rekam-medis", "surat", "informasi", "pasien"],
    defaultMenu: "rekam-medis"
  },
  "ADMIN": {
    roles: ["admin", "perawat umum", "perawat gigi", "kasir"],
    allowedMenus: ["pasien", "surat", "informasi", "kasir", "riwayat-invoice", "payroll"],
    defaultMenu: "pasien"
  },
  "STAFF": {
    roles: ["staff"],
    allowedMenus: ["pasien", "informasi"],
    defaultMenu: "pasien"
  }
};
