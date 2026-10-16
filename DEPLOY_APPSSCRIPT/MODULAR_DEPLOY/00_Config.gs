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
  "SURAT": "1fEz-fvoz_yMLOzZu8jHGS_vHx_rArSvEpIVjWex33tY",
  "DATABASE": "1K9C60hweu2feayWVKdzG80z9yhzkv1ONQ7Ao3xqPkZM",
  "MASTER": "1e_UqCBpqs-YBF2XRsaoW3yG1r8o3nNDI1vGPQyp8nCE",
  "LOG": "1QcDT9th0EB2keQF3hPjh6Pw9dstoD3ulsljTmc0w_Vk",
  "OBAT": "1cSQyijbtSlrTeGufQJXKwhWhz5DnqW7hhkp78pUoQsk",
  "BMHP": "1k6Qwypfs1UlT0IV31FMbiKbUPex4Hs7MUbaO8gJ-CTM",
  "ICD10": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE",
  "ICD9": "19BRjI5Pya3GY-C2epylK0IsHTkYIhAszXw-UFDAzFwE",
  "PAYROLL": "1v6fSKLLokBNNXOJAS7A-7RKnI9YtHlcZbeCTsNmYjkk",
  "ABSENSI": "1e9-Hzz9wk3X-6Yw1kd82mRvpSZ_HxM_JUCKfI1kJCtQ"
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
    roles: ["owner", "super user"],
    allowedMenus: ["dashboard", "ai", "pasien", "rekam-medis", "surat", "database", "user-master", "inventory", "informasi", "kasir", "riwayat-invoice", "payroll", "absensi"],
    defaultMenu: "dashboard"
  },
  "DOKTER_SPESIALIS": {
    roles: ["dokter gigi spesialis"],
    allowedMenus: ["rekam-medis", "surat", "informasi", "pasien", "ai", "absensi"],
    defaultMenu: "rekam-medis"
  },
  "DOKTER_UMUM": {
    roles: ["dokter gigi umum", "dokter"],
    allowedMenus: ["rekam-medis", "surat", "informasi", "pasien", "ai", "absensi"],
    defaultMenu: "rekam-medis"
  },
  "ADMIN": {
    roles: ["admin", "perawat umum", "perawat gigi", "kasir"],
    allowedMenus: ["pasien", "surat", "informasi", "kasir", "riwayat-invoice", "payroll", "absensi"],
    defaultMenu: "pasien"
  },
  "OFFICE": {
    roles: ["office", "staff"],
    allowedMenus: ["pasien", "informasi", "absensi"],
    defaultMenu: "pasien"
  }
};
