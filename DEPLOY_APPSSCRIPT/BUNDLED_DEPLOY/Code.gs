// ========================================================================
// KLINIK SHELDON ENTERPRISE - REKAM MEDIS ELEKTRONIK (RME)
// BACKEND MASTER ENGINE (GOOGLE APPS SCRIPT)
// ========================================================================


// >>>>>>>>>>>>>>> MODULE: 00_Config.gs <<<<<<<<<<<<<<<
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


// >>>>>>>>>>>>>>> MODULE: 01_Utils.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI DASAR WEB APP & REST API GATEWAY (KONEKSI VERCEL & EXTERNAL CLIENT)
// =========================================================================

function doGet(e) {
  // Jika dipanggil via API HTTP GET (misal dari Vercel / Web Browser)
  if (e && e.parameter && (e.parameter.action || e.parameter.api === "true")) {
    return handleApiRequest(e.parameter.action, e.parameter);
  }

  // Jika dipanggil dengan parameter page=formUser, tampilkan Form Master User langsung
  if (e && e.parameter && e.parameter.page === "formUser") {
    return HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
      .setTitle('Form Master User & Role - RME Sheldon')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Klinik Sheldon Enterprise - RME')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || (e && e.parameter && e.parameter.action);
    const params = body.params || (e && e.parameter ? e.parameter : {});
    return handleApiRequest(action, params);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Error API Post: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiRequest(action, params) {
  try {
    if (!action || action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: "RME Sheldon Enterprise API Engine Online & Terhubung ke Google Sheets.",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let args = [];
    if (Array.isArray(params)) {
      args = params;
    } else if (params && typeof params === 'object') {
      if (Array.isArray(params.args)) {
        args = params.args;
      } else if (action === "verifyLogin") {
        args = [params.username || params.user, params.password || params.pin || params.pass];
      } else if (action === "getRiwayatMedisByPasien") {
        args = [params.noRm || params.norm || params[0]];
      } else if (action === "simpanPasienBaru" || action === "simpanRekamMedis" || action === "simpanKasirInvoice" || action === "simpanItemObat" || action === "simpanItemBMHP" || action === "simpanUserMaster" || action === "registrasiAkunBaru" || action === "simpanPresensiShift" || action === "simpanTarifShift" || action === "updateStatusPayroll") {
        args = [params.payload || params];
      } else if (action === "generatePayrollPeriode") {
        args = [params.periodeBulan || params[0] || ""];
      } else if (action === "hapusUserMaster" || action === "aktifkanUserMaster") {
        args = [params.username || params[0], params.isPermanent || params.currentUser || params[1]];
      } else {
        args = [params];
      }
    }

    const fn = this[action];
    if (typeof fn === 'function') {
      let result = fn.apply(this, args);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: "Fungsi backend '" + action + "' tidak ditemukan di Apps Script." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: "Eksekusi '" + action + "' gagal: " + err.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSheetEksternal(idSpreadsheet, namaSheet) {
  try {
    const ss = SpreadsheetApp.openById(idSpreadsheet.trim());
    let sheet = ss.getSheetByName(namaSheet) || 
                ss.getSheetByName(namaSheet.replace(/\s+/g, '_')) || 
                ss.getSheetByName("Data_" + namaSheet);
    if (!sheet) {
      // FITUR OTOMATIS: Buat sheet jika belum ada di spreadsheet!
      sheet = ss.insertSheet(namaSheet);
      
      // Cek apakah ada definisi header di SPREADSHEET_DEFINITIONS
      if (typeof SPREADSHEET_DEFINITIONS !== 'undefined') {
        for (let key in SPREADSHEET_DEFINITIONS) {
          let sDef = SPREADSHEET_DEFINITIONS[key];
          if (sDef && sDef.sheets) {
            let foundSh = sDef.sheets.find(s => s.name === namaSheet || s.name === namaSheet.replace(/\s+/g, '_'));
            if (foundSh) {
              if (foundSh.headers && foundSh.headers.length > 0) {
                sheet.appendRow(foundSh.headers);
                sheet.getRange(1, 1, 1, foundSh.headers.length)
                  .setFontWeight("bold")
                  .setBackground("#1e293b")
                  .setFontColor("#ffffff");
                sheet.setFrozenRows(1);
              }
              if (foundSh.seedRows && foundSh.seedRows.length > 0) {
                sheet.getRange(2, 1, foundSh.seedRows.length, foundSh.seedRows[0].length).setValues(foundSh.seedRows);
              }
              break;
            }
          }
        }
      }
      Logger.log("✅ Auto-Created missing sheet '" + namaSheet + "' on Spreadsheet ID: " + idSpreadsheet);
    }
    return sheet;
  } catch (e) {
    throw new Error("Gagal Akses File/Sheet: " + namaSheet + " (" + e.message + ")");
  }
}

function readFast(idSpreadsheet, namaSheet) {
  const sheet = getSheetEksternal(idSpreadsheet, namaSheet);
  const lr = sheet.getLastRow();
  const lc = sheet.getLastColumn();
  if (lr <= 1 || lc < 1) return [];
  return sheet.getRange(1, 1, lr, lc).getValues();
}

function catatLog(aksi, keterangan, user) {
  try {
    const sheet = getSheetEksternal(DB_CONFIG.LOG, "Log_Aktivitas");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Waktu_Aktivitas", "Nama_Account", "Aksi", "Detail"]);
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm:ss"),
      user || "System",
      aksi,
      keterangan
    ]);
  } catch (e) {}
}

function getColIdx(headerRow, keywords) {
  if (!headerRow || !Array.isArray(headerRow)) return -1;
  // Exact match attempt (normalized)
  for (let i = 0; i < headerRow.length; i++) {
    let h = headerRow[i] ? headerRow[i].toString().toLowerCase().replace(/[\s_.]/g, '') : "";
    for (let kw of keywords) {
      let cleanKw = kw.toLowerCase().replace(/[\s_.]/g, '');
      if (h === cleanKw) return i;
    }
  }
  // Substring match attempt (fallback)
  for (let i = 0; i < headerRow.length; i++) {
    let h = headerRow[i] ? headerRow[i].toString().toLowerCase().replace(/[\s_.]/g, '') : "";
    for (let kw of keywords) {
      let cleanKw = kw.toLowerCase().replace(/[\s_.]/g, '');
      if (h.includes(cleanKw)) return i;
    }
  }
  return -1;
}

function fDate(d) {
  if (!d) return "";
  if (Object.prototype.toString.call(d) === "[object Date]" && !isNaN(d.getTime())) {
    let yr = d.getFullYear(), mo = d.getMonth() + 1, da = d.getDate();
    let dd = da < 10 ? "0" + da : da;
    let mm = mo < 10 ? "0" + mo : mo;
    return dd + "-" + mm + "-" + yr;
  }
  let str = String(d).trim();
  let parts = str.split(/[-/]/);
  if (parts.length === 3 && parts[0].length === 4) {
    return parts[2] + "-" + parts[1] + "-" + parts[0];
  }
  return str;
}

function fDateTime(d) {
  if (!d) return "";
  if (Object.prototype.toString.call(d) === "[object Date]" && !isNaN(d.getTime())) {
    let yr = d.getFullYear(), mo = d.getMonth() + 1, da = d.getDate();
    let h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    let dd = da < 10 ? "0" + da : da;
    let mm = mo < 10 ? "0" + mo : mo;
    let hh = h < 10 ? "0" + h : h;
    let min = m < 10 ? "0" + m : m;
    let ss = s < 10 ? "0" + s : s;
    return dd + "-" + mm + "-" + yr + " " + hh + ":" + min + ":" + ss;
  }
  return String(d).trim();
}

function parseHarga(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Math.round(val);
  let str = String(val).trim().replace(/,00$/, '');
  return parseInt(str.replace(/[^0-9-]/g, '')) || 0;
}


// >>>>>>>>>>>>>>> MODULE: 02_Auth.gs <<<<<<<<<<<<<<<
// =========================================================================
// SISTEM LOGIN & OTENTIKASI USER
// =========================================================================

function hashPassword(password) {
  if (!password) return "";
  try {
    const rawBytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password.toString().trim(),
      Utilities.Charset.UTF_8
    );
    let hash = "";
    for (let i = 0; i < rawBytes.length; i++) {
      let byteVal = rawBytes[i];
      if (byteVal < 0) byteVal += 256;
      let byteStr = byteVal.toString(16);
      if (byteStr.length === 1) byteStr = "0" + byteStr;
      hash += byteStr;
    }
    return hash;
  } catch (e) {
    // Fallback jika digest runtime tidak tersedia
    return password.toString().trim();
  }
}

function verifikasiSesi(token, allowedRoles) {
  if (!token) return { valid: true }; // Menjaga kompatibilitas jika tanpa token
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(token);
    if (!cached) return { valid: true };
    const user = JSON.parse(cached);
    if (allowedRoles && allowedRoles.length > 0) {
      let roleLower = (user.role || "").toLowerCase();
      let matched = allowedRoles.some(r => r.toLowerCase() === roleLower);
      if (!matched && roleLower !== "super user") {
        return {
          valid: false,
          message: "Akses Ditolak: Peran '" + user.role + "' tidak memiliki hak akses untuk fungsi ini."
        };
      }
    }
    return { valid: true, user: user };
  } catch (e) {
    return { valid: true };
  }
}

function verifyLogin(username, password) {
  try {
    const v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return { success: false, message: "Database User kosong." };
    
    let h = v[0];
    const idxUser = getColIdx(h, ["username", "user"]);
    const idxPass = getColIdx(h, ["password", "pass"]);
    const idxRole = getColIdx(h, ["role", "kategori", "kategorirole"]);
    const idxStatus = getColIdx(h, ["status"]);
    const idxNama = getColIdx(h, ["namapekerja", "nama", "namalengkap"]);
    
    if (idxUser === -1 || idxPass === -1) {
      return { success: false, message: "Header Username/Password tidak ditemukan di sheet Master Data." };
    }
    
    const inputPass = String(password || "").trim();
    const inputHash = hashPassword(inputPass).toLowerCase();
    const cleanUser = String(username || "").trim().toLowerCase();
    
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idxUser]) continue;
      
      let uData = String(r[idxUser]).trim().toLowerCase();
      let pData = String(r[idxPass] !== null && r[idxPass] !== undefined ? r[idxPass] : "").trim();
      let pDataClean = pData.startsWith("'") ? pData.substring(1).trim() : pData;
      let pDataLower = pDataClean.toLowerCase();
      
      // Cocokkan username (case-insensitive) dan password (plaintext ATAU hash SHA-256)
      let isPassMatch = (pDataClean === inputPass) || (pDataLower === inputHash);
      
      if (uData === cleanUser && isPassMatch) {
        let rowStatus = idxStatus !== -1 && r[idxStatus] ? r[idxStatus].toString().trim().toLowerCase() : "aktif";
        if (rowStatus !== "aktif" && rowStatus !== "active") {
          return { success: false, message: "Status akun Anda masih NON AKTIF. Silakan tunggu konfirmasi dari Super Admin untuk aktivasi akun." };
        }
        
        let role = idxRole !== -1 && r[idxRole] ? r[idxRole].toString().trim() : "Admin";
        let namaAsli = (idxNama !== -1 && r[idxNama]) ? r[idxNama].toString().trim() : username;
        
        // Auto-upgrade password plaintext ke format hash SHA-256 jika belum ter-hash
        if (pDataLower !== inputHash && inputHash !== "") {
          try {
            const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
            const sheet = ss.getSheetByName("Data");
            if (sheet) {
              // Tulis sebagai Plain Text dengan NumberFormat "@" agar tidak terpotong atau terkonversi oleh Google Sheets
              let cellTarget = sheet.getRange(i + 1, idxPass + 1);
              cellTarget.setNumberFormat("@");
              cellTarget.setValue(inputHash);
            }
          } catch (errUp) {
            Logger.log("Warning: Gagal upgrade hash password: " + errUp.message);
          }
        }
        
        let token = "TK_" + new Date().getTime() + "_" + Math.floor(Math.random() * 10000);
        try {
          let sessionPayload = {
            username: username,
            namaAccount: namaAsli,
            role: role,
            loginTime: new Date().getTime()
          };
          CacheService.getScriptCache().put(token, JSON.stringify(sessionPayload), 21600); // 6 jam
        } catch (errCache) {}
        
        catatLog("Login", "Berhasil login dengan hak akses: " + role, namaAsli);
        
        return {
          success: true,
          token: token,
          userData: {
            username: username,
            namaAccount: namaAsli,
            role: role
          }
        };
      }
    }
    
    return { success: false, message: "Username atau Password salah!" };
  } catch (e) {
    return { success: false, message: "Error Otentikasi: " + e.message };
  }
}

/**
 * Pendaftaran Akun Baru Mandiri dari Halaman Login Awal
 * Menyimpan ke RME Sheldon - 06 Master User & Role (Sheet: Data) dengan Status = "Non Aktif"
 * dan memastikan kolom Email tersedia di spreadsheet.
 */
function registrasiAkunBaru(payload) {
  try {
    if (!payload || !payload.nama || !payload.username || !payload.password) {
      return { success: false, message: "Nama, Username, dan Password wajib diisi!" };
    }

    const nama = String(payload.nama || "").trim();
    const cleanUser = String(payload.username || "").trim().toLowerCase().replace(/\s+/g, "");
    const password = String(payload.password || "").trim();
    const noSip = String(payload.noSip || payload.noReg || "-").trim() || "-";
    const noWa = String(payload.noWa || payload.noHp || "").trim();
    const email = String(payload.email || "").trim();
    let role = String(payload.role || "Admin").trim();

    if (cleanUser.length < 3) {
      return { success: false, message: "Username minimal 3 karakter (huruf kecil tanpa spasi)!" };
    }
    if (password.length < 4) {
      return { success: false, message: "Password minimal 4 karakter!" };
    }

    const allowedRegisterRoles = [
      "Dokter Gigi Spesialis",
      "Dokter Gigi Umum",
      "Perawat Gigi",
      "Perawat Umum",
      "Admin"
    ];
    let matchedRole = allowedRegisterRoles.find(r => r.toLowerCase() === role.toLowerCase());
    if (!matchedRole) {
      matchedRole = "Admin";
    }
    role = matchedRole;

    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    let sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    let v = sheet.getDataRange().getValues();

    if (v.length === 0 || (v.length === 1 && !v[0][0])) {
      const defaultHeaders = ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"];
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]).setFontWeight("bold").setBackground("#e2e8f0");
      sheet.setFrozenRows(1);
      v = sheet.getDataRange().getValues();
    }

    let h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let idNama = getColIdx(h, ["namapekerja", "nama", "namalengkap"]); if (idNama === -1) idNama = 0;
    let idUser = getColIdx(h, ["username", "user"]); if (idUser === -1) idUser = 1;
    let idRole = getColIdx(h, ["kategorirole", "role", "kategori"]); if (idRole === -1) idRole = 2;
    let idPass = getColIdx(h, ["password", "pass"]); if (idPass === -1) idPass = 3;
    let idStatus = getColIdx(h, ["status"]); if (idStatus === -1) idStatus = 4;
    let idSIP = getColIdx(h, ["noregistrasi", "sip", "noreg"]); if (idSIP === -1) idSIP = 5;
    let idHP = getColIdx(h, ["nohp", "no_hp", "telepon", "wa"]); if (idHP === -1) idHP = 6;
    let idJM = getColIdx(h, ["persen_jm_dokter", "persen_jm", "persenjm"]); if (idJM === -1) idJM = 7;
    let idEmail = getColIdx(h, ["email", "surel", "e-mail"]);

    // Tambahkan kolom Email secara otomatis jika belum ada di Sheet Data
    if (idEmail === -1) {
      idEmail = Math.max(8, h.length);
      sheet.getRange(1, idEmail + 1).setValue("Email").setFontWeight("bold").setBackground("#e2e8f0");
      h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Cek apakah username sudah dipakai
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        return {
          success: false,
          message: "Username '" + cleanUser + "' sudah terdaftar! Silakan pilih username lain."
        };
      }
    }

    let pjmVal = "";
    if (role === "Dokter Gigi Spesialis") pjmVal = 0.50;
    else if (role === "Dokter Gigi Umum") pjmVal = 0.40;

    let totalCols = Math.max(9, h.length, idEmail + 1);
    let newRow = new Array(totalCols).fill("");
    newRow[idNama] = nama;
    newRow[idUser] = cleanUser;
    newRow[idRole] = role;
    newRow[idPass] = password;
    newRow[idStatus] = "Non Aktif";
    newRow[idSIP] = noSip;
    newRow[idHP] = noWa;
    newRow[idJM] = pjmVal;
    newRow[idEmail] = email;

    sheet.appendRow(newRow);
    let lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, idPass + 1).setNumberFormat("@");
    if (pjmVal !== "") {
      sheet.getRange(lastRow, idJM + 1).setNumberFormat("0.0%");
    }

    catatLog("Registrasi Akun", "Pendaftaran akun baru (Status: Non Aktif): " + cleanUser + " (" + role + ")", nama);

    return {
      success: true,
      message: "Pendaftaran berhasil! Akun '" + cleanUser + "' telah tersimpan dengan status NON AKTIF. Silakan tunggu konfirmasi dari Super Admin untuk aktivasi akun."
    };
  } catch (e) {
    return { success: false, message: "Gagal mendaftarkan akun: " + e.message };
  }
}



// >>>>>>>>>>>>>>> MODULE: 03_Pasien.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI DATABASE PASIEN (LOGIKA AUTO-INCREASE ID & NO RM)
// =========================================================================

function getInitPasien() {
  return getDaftarPasien();
}

function getDaftarPekerjaan() {
  try {
    const v = readFast(DB_CONFIG.LOG, "pekerjaan");
    if (v.length <= 1) return [];
    let h = v[0];
    let idx = getColIdx(h, ['nama_pekerjaan', 'namapekerjaan', 'pekerjaan', 'nama']);
    if (idx === -1) idx = 0;
    
    let result = [];
    for (let i = 1; i < v.length; i++) {
      let namaPekerjaan = String(v[i][idx]).trim();
      if (namaPekerjaan !== "") {
        result.push(namaPekerjaan);
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getDaftarPasien() {
  try {
    const v = readFast(DB_CONFIG.PASIEN, "Data_Pasien");
    if (v.length <= 1) return [];
    let h = v[0];
    
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 2;
    let idJK = getColIdx(h, ['jeniskelamin', 'gender', 'kelamin']); if (idJK === -1) idJK = 3;
    let idTmptLahir = getColIdx(h, ['tempatlahir']);
    let idLahir = getColIdx(h, ['tanggallahir', 'lahir']); if (idLahir === -1) idLahir = 5;
    let idUmur = getColIdx(h, ['umur', 'usia']); if (idUmur === -1) idUmur = 6;
    let idAgama = getColIdx(h, ['agama', 'religion']); if (idAgama === -1) idAgama = 7;
    let idGoldar = getColIdx(h, ['golongandarah', 'goldar']);
    let idPekerjaan = getColIdx(h, ['pekerjaan']);
    let idNIK = getColIdx(h, ['nik', 'ktp']);
    let idAlamat = getColIdx(h, ['alamat']);
    let idProv = getColIdx(h, ['provinsi', 'prov']);
    let idKab = getColIdx(h, ['kabupaten', 'kota', 'kab']);
    let idKec = getColIdx(h, ['kecamatan', 'kec']);
    let idKel = getColIdx(h, ['kelurahan', 'desa', 'kel']);
    let idWA = getColIdx(h, ['whatsapp', 'nohp', 'telepon', 'hp']);
    let idAlergi = getColIdx(h, ['alergi', 'riwayatalergi']);
    let idRiwayat = getColIdx(h, ['riwayatpenyakit', 'riwayat', 'sistemik']);
    let idCatatan = getColIdx(h, ['catatan', 'keterangan', 'catatantambahan']);
    let idTglDaftar = getColIdx(h, ['waktudaftar', 'tanggaldaftar', 'waktu', 'tanggal']);
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idID] && !r[idNama]) continue;
      
      let st = (idStatus !== -1 && r[idStatus]) ? String(r[idStatus]).trim().toLowerCase() : "aktif";
      if (st === "nonaktif" || st === "terhapus") continue;
      result.push({
        idPasien: r[idID] ? String(r[idID]).trim() : "",
        namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
        noRm: r[idRM] ? String(r[idRM]).trim() : "",
        jenisKelamin: r[idJK] ? String(r[idJK]).trim() : "",
        tempatLahir: (idTmptLahir !== -1 && r[idTmptLahir]) ? String(r[idTmptLahir]).trim() : "",
        tanggalLahir: fDate(r[idLahir]),
        umur: r[idUmur] ? String(r[idUmur]).trim() : "",
        agama: (idAgama !== -1 && r[idAgama]) ? String(r[idAgama]).trim() : "",
        golonganDarah: (idGoldar !== -1 && r[idGoldar]) ? String(r[idGoldar]).trim() : "",
        pekerjaan: (idPekerjaan !== -1 && r[idPekerjaan]) ? String(r[idPekerjaan]).trim() : "",
        nik: (idNIK !== -1 && r[idNIK]) ? String(r[idNIK]).replace(/'/g, '').trim() : "",
        alamat: (idAlamat !== -1 && r[idAlamat]) ? String(r[idAlamat]).trim() : "",
        provinsi: (idProv !== -1 && r[idProv]) ? String(r[idProv]).trim() : "",
        kabupaten: (idKab !== -1 && r[idKab]) ? String(r[idKab]).trim() : "",
        kecamatan: (idKec !== -1 && r[idKec]) ? String(r[idKec]).trim() : "",
        kelurahan: (idKel !== -1 && r[idKel]) ? String(r[idKel]).trim() : "",
        whatsapp: (idWA !== -1 && r[idWA]) ? String(r[idWA]).replace(/'/g, '').trim() : "",
        alergi: (idAlergi !== -1 && r[idAlergi]) ? String(r[idAlergi]).trim() : "",
        riwayatPenyakit: (idRiwayat !== -1 && r[idRiwayat]) ? String(r[idRiwayat]).trim() : "",
        catatan: (idCatatan !== -1 && r[idCatatan]) ? String(r[idCatatan]).trim() : "",
        tglDaftar: (idTglDaftar !== -1 && r[idTglDaftar]) ? fDate(r[idTglDaftar]) : ""
      });
    }
    return result.reverse();
  } catch (e) {
    return [];
  }
}

function simpanPasien(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    let v = sheet.getDataRange().getValues();
    
    if (v.length === 0) {
      sheet.appendRow([
        'ID_Pasien', 'Nama_Pasien', 'No_RM', 'Jenis_Kelamin', 'Tempat_Lahir', 'Tanggal_Lahir', 'Umur',
        'Agama', 'Golongan_Darah', 'Pekerjaan', 'NIK', 'Alamat', 'Provinsi', 'Kabupaten', 'Kecamatan',
        'Kelurahan', 'WhatsApp', 'Alergi', 'Riwayat_Penyakit', 'Catatan', 'Tanggal_Daftar'
      ]);
      v = sheet.getDataRange().getValues();
    }
    
    let h = v[0];
    let isBaru = false;
    let rowIdx = -1;
    
    let idCol = getColIdx(h, ['idpasien', 'id']); if (idCol === -1) idCol = 0;
    let idxColRm = getColIdx(h, ['norm', 'rm']);

    // CEK DATA: EDIT vs BARU
    if (payload.idPasien) {
      let searchId = String(payload.idPasien).trim().toLowerCase();
      for (let i = 1; i < v.length; i++) {
        if (String(v[i][idCol] || "").trim().toLowerCase() === searchId) {
          rowIdx = i + 1;
          break;
        }
      }
    }
    // Fallback pencarian No RM jika idPasien belum cocok tetapi noRm terisi
    if (rowIdx === -1 && payload.noRm && idxColRm !== -1) {
      let searchRm = String(payload.noRm).trim().toLowerCase();
      for (let i = 1; i < v.length; i++) {
        if (String(v[i][idxColRm] || "").trim().toLowerCase() === searchRm) {
          rowIdx = i + 1;
          break;
        }
      }
    }

    // =====================================================================
    // LAPIS 3: AUTO-GUARD ANTI-DUPLIKASI (SERVER-SIDE VALIDATION)
    // =====================================================================
    let idxNama = getColIdx(h, ['namapasien', 'nama']);
    let idxLahir = getColIdx(h, ['tanggallahir', 'lahir']);
    let idxNik = getColIdx(h, ['nik', 'ktp']);

    if (rowIdx === -1) {
      // 1. Cek NIK Unik jika diisi
      let cleanInputNik = payload.nik ? String(payload.nik).trim() : "";
      if (cleanInputNik !== "" && idxNik !== -1) {
        for (let i = 1; i < v.length; i++) {
          let existNik = String(v[i][idxNik] || "").trim();
          if (existNik && existNik === cleanInputNik) {
            let existNama = idxNama !== -1 ? String(v[i][idxNama] || "").trim() : "Pasien";
            let existRm = idxColRm !== -1 ? String(v[i][idxColRm] || "").trim() : "";
            return {
              success: false,
              message: `GAGAL: NIK ${cleanInputNik} sudah terdaftar atas nama "${existNama}" (No. RM: ${existRm}). Tidak boleh ada NIK ganda.`
            };
          }
        }
      }

      // 2. Cek Nama Pasien + Tanggal Lahir Sama Persis
      let cleanInputNama = payload.namaPasien ? String(payload.namaPasien).trim().toLowerCase().replace(/\s+/g, ' ') : "";
      let cleanInputLahir = "";
      if (payload.tanggalLahir) {
        let raw = String(payload.tanggalLahir).trim();
        let parts = raw.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) cleanInputLahir = `${parts[2]}-${parts[1]}-${parts[0]}`;
          else cleanInputLahir = `${parts[0]}-${parts[1]}-${parts[2]}`;
        } else {
          cleanInputLahir = raw;
        }
      }

      if (cleanInputNama && cleanInputLahir && idxNama !== -1 && idxLahir !== -1) {
        for (let i = 1; i < v.length; i++) {
          let existNama = String(v[i][idxNama] || "").trim().toLowerCase().replace(/\s+/g, ' ');
          let rawExistLahir = v[i][idxLahir];
          let existLahir = "";
          if (rawExistLahir instanceof Date && !isNaN(rawExistLahir.getTime())) {
            existLahir = Utilities.formatDate(rawExistLahir, "Asia/Jakarta", "dd-MM-yyyy");
          } else if (rawExistLahir) {
            let s = String(rawExistLahir).trim();
            let p = s.split(/[-/]/);
            if (p.length === 3) {
              if (p[0].length === 4) existLahir = `${p[2]}-${p[1]}-${p[0]}`;
              else existLahir = `${p[0]}-${p[1]}-${p[2]}`;
            } else {
              existLahir = s;
            }
          }

          if (existNama === cleanInputNama && existLahir === cleanInputLahir) {
            let existRm = idxColRm !== -1 ? String(v[i][idxColRm] || "").trim() : "";
            let existId = idCol !== -1 ? String(v[i][idCol] || "").trim() : "";
            return {
              success: false,
              message: `GAGAL: Pasien bernama "${payload.namaPasien}" dengan Tanggal Lahir "${payload.tanggalLahir}" sudah terdaftar di sistem dengan No. RM: ${existRm} (ID: ${existId}). Silakan cari dan gunakan data yang sudah ada alih-alih membuat pasien baru.`
            };
          }
        }
      }
    }
    
    // JIKA PASIEN BARU -> GENERATE KODE (PS-MMYY-XXXX & [Initial]-XXXX)
    if (rowIdx === -1) {
      isBaru = true;
      let sheetMaxId = 0;
      let sheetMaxRm = 0;

      for (let i = 1; i < v.length; i++) {
        let currId = idCol !== -1 && v[i][idCol] ? String(v[i][idCol]).trim() : "";
        let currRm = idxColRm !== -1 && v[i][idxColRm] ? String(v[i][idxColRm]).trim() : "";

        let matchId = currId.match(/^PS-\d{4}-(\d{4})$/i);
        if (matchId) {
          let seq = parseInt(matchId[1], 10);
          if (!isNaN(seq) && seq > sheetMaxId) sheetMaxId = seq;
        }

        let matchRm = currRm.match(/^[A-Z]-(\d{4})$/i);
        if (matchRm) {
          let seq = parseInt(matchRm[1], 10);
          if (!isNaN(seq) && seq > sheetMaxRm) sheetMaxRm = seq;
        }
      }

      let props = PropertiesService.getScriptProperties();
      let globalMaxId = parseInt(props.getProperty('GLOBAL_MAX_ID') || '0', 10);
      let globalMaxRm = parseInt(props.getProperty('GLOBAL_MAX_RM') || '0', 10);

      let nextIdSeq = Math.max(sheetMaxId, globalMaxId) + 1;
      let nextRmSeq = Math.max(sheetMaxRm, globalMaxRm) + 1;
      
      let d = new Date();
      let mm = ("0" + (d.getMonth() + 1)).slice(-2);
      let yy = d.getFullYear().toString().slice(-2);
      
      payload.idPasien = "PS-" + mm + yy + "-" + ("0000" + nextIdSeq).slice(-4);
      
      if (!payload.noRm || payload.noRm.trim() === "") {
        let firstLetter = payload.namaPasien ? payload.namaPasien.trim().charAt(0).toUpperCase() : "X";
        if (!firstLetter.match(/[A-Z]/)) firstLetter = "X";
        payload.noRm = firstLetter + "-" + ("0000" + nextRmSeq).slice(-4);
      }
      
      rowIdx = sheet.getLastRow() + 1;
      
      props.setProperty('GLOBAL_MAX_ID', nextIdSeq.toString());
      props.setProperty('GLOBAL_MAX_RM', nextRmSeq.toString());
    }
    
    let newRow = new Array(h.length).fill("");
    
    // JIKA EDIT: Gunakan baris lama untuk mengunci ID Pasien & No RM
    if (!isBaru && rowIdx <= v.length) {
      newRow = [...v[rowIdx - 1]];
      payload.idPasien = newRow[idCol];
      if (idxColRm !== -1 && newRow[idxColRm]) {
        payload.noRm = newRow[idxColRm];
      }
    }

    const mapToCol = (keywords, val) => {
      let idx = getColIdx(h, keywords);
      if (idx !== -1) newRow[idx] = val !== undefined ? val : "";
    };

    mapToCol(['idpasien', 'id'], payload.idPasien);
    mapToCol(['namapasien', 'nama'], payload.namaPasien);
    mapToCol(['norm', 'rm'], payload.noRm);
    mapToCol(['jeniskelamin', 'gender', 'kelamin'], payload.jenisKelamin);
    mapToCol(['tempatlahir'], payload.tempatLahir);
    mapToCol(['tanggallahir', 'lahir'], payload.tanggalLahir);
    mapToCol(['umur', 'usia'], payload.umur);
    mapToCol(['agama', 'religion'], payload.agama);
    mapToCol(['golongandarah', 'goldar'], payload.golonganDarah);
    mapToCol(['pekerjaan'], payload.pekerjaan);
    mapToCol(['nik', 'ktp'], payload.nik ? "'" + String(payload.nik).replace(/^'+/, '') : "");
    mapToCol(['alamat'], payload.alamat);
    mapToCol(['provinsi', 'prov'], payload.provinsi);
    mapToCol(['kabupaten', 'kota', 'kab'], payload.kabupaten);
    mapToCol(['kecamatan', 'kec'], payload.kecamatan);
    mapToCol(['kelurahan', 'desa', 'kel'], payload.kelurahan);
    mapToCol(['whatsapp', 'nohp', 'telepon', 'hp'], payload.whatsapp ? "'" + String(payload.whatsapp).replace(/^'+/, '') : "");
    mapToCol(['alergi', 'riwayatalergi'], payload.alergi);
    mapToCol(['riwayatpenyakit', 'riwayat', 'sistemik'], payload.riwayatPenyakit);
    mapToCol(['catatan', 'keterangan'], payload.catatan);

    let idxWaktu = getColIdx(h, ['waktudaftar', 'tanggaldaftar', 'waktu', 'tanggal']);
    if (idxWaktu !== -1 && isBaru) {
      newRow[idxWaktu] = payload.tglDaftar ? payload.tglDaftar : fDate(new Date());
    } else if (idxWaktu !== -1 && !isBaru && payload.tglDaftar) {
      newRow[idxWaktu] = payload.tglDaftar;
    }

    if (isBaru) {
      sheet.appendRow(newRow);
      catatLog("Pendaftaran Pasien", "Mendaftarkan pasien baru: " + payload.namaPasien + " (RM: " + payload.noRm + ")", payload.currentUser);
    } else {
      sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
      catatLog("Update Pasien", "Memperbarui data pasien: " + payload.namaPasien + " (RM: " + payload.noRm + ")", payload.currentUser);
    }
    return {
      success: true,
      message: isBaru ? "Data Pasien berhasil didaftarkan!" : "Data Pasien berhasil diperbarui!",
      idPasien: payload.idPasien,
      noRm: payload.noRm,
      isBaru: isBaru
    };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan pasien: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function hapusPasienPermanen(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    // Verifikasi Otorisasi Sisi Server
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }

    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    let v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: false, message: "Database pasien kosong." };

    let h = v[0];
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    let targetRow = -1;
    let targetNama = "";
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idID]).trim() === String(payload.idPasien).trim()) {
        targetRow = i + 1;
        targetNama = String(v[i][idNama] || "");
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "Pasien dengan ID " + payload.idPasien + " tidak ditemukan." };
    }

    // SOFT-DELETE: Jangan hapus fisik baris agar tidak merusak relasi rekam medis / invoice lama
    if (idStatus === -1) {
      let lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue("Status_Aktif");
      idStatus = lastCol;
    }

    sheet.getRange(targetRow, idStatus + 1).setValue("Nonaktif");
    catatLog("Hapus Pasien", "Super User menonaktifkan pasien (Soft-Delete aman): " + targetNama + " (ID: " + payload.idPasien + ")", payload.currentUser);
    return { success: true, message: "Data Pasien (" + targetNama + ") berhasil dinonaktifkan (Arsip Medis Aman)!" };
  } catch (e) {
    return { success: false, message: "Gagal menghapus pasien: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * FUNGSI AUDIT: Mengambil seluruh kelompok data pasien ganda
 * Menghasilkan rincian No RM, Nama Pasien, Tanggal Lahir, NIK, dan No HP
 */
function auditDaftarPasienGanda() {
  try {
    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    const v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: true, data: [], message: "Database pasien kosong." };

    const h = v[0];
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 2;
    let idLahir = getColIdx(h, ['tanggallahir', 'lahir']);
    let idNik = getColIdx(h, ['nik', 'ktp']);
    let idWA = getColIdx(h, ['whatsapp', 'nohp', 'telepon', 'hp']);
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    const kelompokMap = new Map();

    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (idStatus !== -1) {
        let st = String(r[idStatus] || "").toLowerCase().trim();
        if (st === "nonaktif" || st === "terhapus") continue;
      }

      let idPasien = String(r[idID] || "").trim();
      let rawNama = String(r[idNama] || "").trim();
      if (!rawNama) continue;

      let namaClean = rawNama.toLowerCase().replace(/\s+/g, ' ');
      let noRm = idRM !== -1 ? String(r[idRM] || "").trim() : "";
      let nik = idNik !== -1 ? String(r[idNik] || "").replace(/'/g, '').trim() : "";
      let wa = idWA !== -1 ? String(r[idWA] || "").replace(/'/g, '').trim() : "";

      let tglStr = "";
      if (idLahir !== -1 && r[idLahir]) {
        let rawLahir = r[idLahir];
        if (rawLahir instanceof Date && !isNaN(rawLahir.getTime())) {
          tglStr = Utilities.formatDate(rawLahir, "Asia/Jakarta", "dd-MM-yyyy");
        } else {
          let s = String(rawLahir).trim();
          let p = s.split(/[-/]/);
          if (p.length === 3) {
            if (p[0].length === 4) tglStr = `${p[2]}-${p[1]}-${p[0]}`;
            else tglStr = `${p[0]}-${p[1]}-${p[2]}`;
          } else {
            tglStr = s;
          }
        }
      }

      // Kunci Pengelompokan: Nama Pasien + Tanggal Lahir (Kombinasi Medis Baku)
      let key = tglStr ? `${namaClean} | ${tglStr}` : `${namaClean} | [Tanpa Tgl Lahir]`;

      if (!kelompokMap.has(key)) {
        kelompokMap.set(key, []);
      }
      kelompokMap.get(key).push({
        baris: i + 1,
        idPasien: idPasien,
        noRm: noRm,
        namaPasien: rawNama,
        tanggalLahir: tglStr || "-",
        nik: nik || "-",
        whatsapp: wa || "-"
      });
    }

    let hasilDuplikat = [];
    kelompokMap.forEach((pasienList, key) => {
      if (pasienList.length > 1) {
        hasilDuplikat.push({
          kunciIdentitas: key,
          jumlahKembar: pasienList.length,
          anggota: pasienList
        });
      }
    });

    Logger.log("Audit Selesai. Ditemukan " + hasilDuplikat.length + " kelompok pasien dengan Nama & Tanggal Lahir kembar.");
    return {
      success: true,
      totalKelompok: hasilDuplikat.length,
      totalBarisKembar: hasilDuplikat.reduce((acc, cur) => acc + cur.jumlahKembar, 0),
      data: hasilDuplikat
    };
  } catch (err) {
    Logger.log("Error audit: " + err.message);
    return { success: false, message: err.message };
  }
}


// >>>>>>>>>>>>>>> MODULE: 04_RekamMedis.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI REKAM MEDIS (EMR), ODONTOGRAM, DAN ICD-10
// =========================================================================

function getInitEMR() {
  return getDaftarRekamMedis();
}

function getDaftarICD10() {
  try {
    const idICD = DB_CONFIG.ICD10;
    const v = readFast(idICD, "ICD_10");
    if (v.length <= 1) return [];
    
    let h = v[0];
    let idxDesc = getColIdx(h, ['disease_description', 'diseasedescription', 'description', 'penyakit', 'icd10']);
    let idxCode = getColIdx(h, ['icd10_code', 'icd10code', 'code', 'kode']);
    
    if (idxCode === -1) idxCode = 0;
    if (idxDesc === -1) idxDesc = 1;
    
    let result = [];
    for (let i = 1; i < v.length; i++) {
      let desc = String(v[i][idxDesc]).trim();
      let code = String(v[i][idxCode]).trim();
      if (desc !== "" || code !== "") result.push({ code: code, desc: desc });
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getDaftarICD9() {
  try {
    const idICD = DB_CONFIG.ICD9 || DB_CONFIG.ICD10;
    const v = readFast(idICD, "ICD_9");
    if (v.length <= 1) return [];
    
    let h = v[0];
    let idxDesc = getColIdx(h, ['disease_description', 'diseasedescription', 'description', 'tindakan', 'prosedur', 'icd9']);
    let idxCode = getColIdx(h, ['icd9_code', 'icd9code', 'code', 'kode']);
    
    if (idxCode === -1) idxCode = 0;
    if (idxDesc === -1) idxDesc = 1;
    
    let result = [];
    for (let i = 1; i < v.length; i++) {
      let desc = String(v[i][idxDesc]).trim();
      let code = String(v[i][idxCode]).trim();
      if (desc !== "" || code !== "") {
        result.push({ code: code, desc: desc });
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getDaftarRekamMedis() {
  try {
    const v = readFast(DB_CONFIG.REKAM_MEDIS, "Data_Rekam_Medis");
    if (v.length <= 1) return [];
    
    let h = v[0];
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

    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idPas] || String(r[idPas]).trim() === "") continue;
      
      let wStr = r[idWaktu];
      if (Object.prototype.toString.call(wStr) === "[object Date]" && !isNaN(wStr.getTime())) {
        wStr = wStr.toISOString();
      } else {
        wStr = String(wStr || "");
      }
      
      result.push({
        idRmKlinis: r[idRM] ? String(r[idRM]).trim() : ("RM_LAMA_" + i),
        waktuSimpan: wStr,
        idPasien: String(r[idPas]).trim(),
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
    return result;
  } catch (e) {
    return [];
  }
}

function getOdontogramTerakhirPasien(idPasien) {
  try {
    if (!idPasien) return null;
    const v = readFast(DB_CONFIG.REKAM_MEDIS, "Data_Rekam_Medis");
    if (v.length <= 1) return null;
    
    let h = v[0];
    let idPas = getColIdx(h, ['idpasien']); if (idPas === -1) idPas = 1;
    let idOdo = getColIdx(h, ['odontogramjson', 'odontogram']); if (idOdo === -1) idOdo = 8;
    let idTgl = getColIdx(h, ['tanggalpemeriksaan', 'tanggalperiksa']); if (idTgl === -1) idTgl = 4;
    
    for (let i = v.length - 1; i >= 1; i--) {
      let r = v[i];
      if (String(r[idPas]).trim() === String(idPasien).trim()) {
        let odoStr = r[idOdo] ? String(r[idOdo]).trim() : "";
        if (odoStr && odoStr !== "{}" && odoStr !== "[]") {
          return {
            odontogramStr: odoStr,
            tanggalTerakhir: fDate(r[idTgl])
          };
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function simpanRekamMedis(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetEksternal(DB_CONFIG.REKAM_MEDIS, "Data_Rekam_Medis");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_RM_Klinis', 'ID_Pasien', 'No_RM', 'Nama_Pasien', 'Tanggal_Pemeriksaan',
        'Dokter_Pemeriksa', 'Anamnesis_JSON', 'Fisik_JSON', 'Odontogram_JSON',
        'Tindakan_JSON', 'Resep_Obat_JSON', 'Catatan_Edukasi', 'Waktu_Simpan'
      ]);
    }
    
    let idRm = "RM-" + new Date().getTime();
    let waktuSimpan = new Date();
    
    // Cegah limitasi 50.000 karakter per sel di Google Sheets
    const safeStr = (str) => {
      let s = String(str || "");
      return s.length > 45000 ? s.substring(0, 45000) : s;
    };
    
    sheet.appendRow([
      idRm,
      payload.idPasien,
      payload.noRm,
      payload.namaPasien,
      payload.tanggalPeriksa,
      payload.dokterPemeriksa,
      safeStr(payload.anamnesisStr),
      safeStr(payload.fisikStr),
      safeStr(payload.odontogram),
      safeStr(payload.tindakanStr),
      safeStr(payload.obatStr),
      safeStr(payload.catatanEdukasi),
      waktuSimpan
    ]);
    
    catatLog("Input EMR", "Rekam Medis & Odontogram disimpan untuk: " + payload.namaPasien + " (RM: " + payload.noRm + ")", payload.dokterPemeriksa);
    
    return {
      success: true,
      message: "Rekam Medis & Odontogram Berhasil Disimpan Permanen!",
      idRm: idRm
    };
  } catch (e) {
    return { success: false, message: "Gagal Menyimpan Rekam Medis: " + e.message };
  } finally {
    lock.releaseLock();
  }
}


// >>>>>>>>>>>>>>> MODULE: 05_KasirPembayaran.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI PEMBAYARAN, KASIR & INVOICE
// =========================================================================

function getInitBayar() {
  return getDaftarPembayaran();
}

function getDaftarPembayaran() {
  try {
    const v = readFast(DB_CONFIG.PEMBAYARAN, "Data_Pembayaran");
    if (v.length <= 1) return [];
    
    let h = v[0];
    let idInv = getColIdx(h, ['idinvoice', 'invoice', 'noinvoice']); if (idInv === -1) idInv = 0;
    let idTgl = getColIdx(h, ['tanggaltindakan', 'tanggal']); if (idTgl === -1) idTgl = 1;
    let idPas = getColIdx(h, ['idpasien']); if (idPas === -1) idPas = 2;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 3;
    let idNama = getColIdx(h, ['namapasien']); if (idNama === -1) idNama = 4;
    let idDokter = getColIdx(h, ['dokterpemeriksa', 'dokter']); if (idDokter === -1) idDokter = 5;
    let idKat = getColIdx(h, ['kategoriitem', 'kategori']); if (idKat === -1) idKat = 6;
    let idItem = getColIdx(h, ['namaitem', 'item', 'tindakanjson']); if (idItem === -1) idItem = 7;
    let idHrg = getColIdx(h, ['hargasatuan', 'harga']); if (idHrg === -1) idHrg = 8;
    let idQty = getColIdx(h, ['qty', 'jumlah']); if (idQty === -1) idQty = 9;
    let idLabor = getColIdx(h, ['labor']); if (idLabor === -1) idLabor = 10;
    let idDisc = getColIdx(h, ['diskonpersen', 'diskon']); if (idDisc === -1) idDisc = 11;
    let idGrTot = getColIdx(h, ['grandtotalitem', 'grandtotal']); if (idGrTot === -1) idGrTot = 12;
    let idPerawat = getColIdx(h, ['perawat']); if (idPerawat === -1) idPerawat = 13;
    let idTotInv = getColIdx(h, ['totalinvoice', 'totalbayar']); if (idTotInv === -1) idTotInv = 14;
    let idMetode = getColIdx(h, ['metodebayar', 'metode']); if (idMetode === -1) idMetode = 15;
    let idStatus = getColIdx(h, ['statuspembayaran', 'status']); if (idStatus === -1) idStatus = 16;
    let idKet = getColIdx(h, ['keterangan', 'ket', 'catatan']); if (idKet === -1) idKet = 17;
    let idKasir = getColIdx(h, ['kasirbertugas', 'kasir']); if (idKasir === -1) idKasir = 18;

    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idInv] || String(r[idInv]).trim() === "") continue;
      
      result.push({
        idInvoice: String(r[idInv]).trim(),
        tanggal: fDateTime(r[idTgl]),
        idPasien: r[idPas] ? String(r[idPas]).trim() : "",
        noRm: r[idRM] ? String(r[idRM]).trim() : "",
        namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
        dokter: r[idDokter] ? String(r[idDokter]).trim() : "",
        kategori: r[idKat] ? String(r[idKat]).trim() : "",
        item: r[idItem] ? String(r[idItem]).trim() : "",
        harga: parseHarga(r[idHrg] || 0),
        qty: r[idQty] || 1,
        diskon: r[idDisc] || 0,
        grandTotalItem: parseHarga(r[idGrTot] || 0),
        totalInvoice: parseHarga(r[idTotInv] || 0),
        metode: r[idMetode] ? String(r[idMetode]).trim() : "",
        status: r[idStatus] ? String(r[idStatus]).trim() : "",
        keterangan: idKet !== -1 && r[idKet] ? String(r[idKet]).trim() : "",
        kasir: r[idKasir] ? String(r[idKasir]).trim() : ""
      });
    }
    return result;
  } catch (e) {
    return [];
  }
}

/**
 * Agregat data invoice unik untuk modul Riwayat Invoice.
 */
function getDaftarInvoice() {
  try {
    const listBayar = getDaftarPembayaran();
    if (!listBayar || listBayar.length === 0) return [];
    
    let groups = {};
    listBayar.forEach(row => {
      let invId = row.idInvoice || "INV-UNSPECIFIED";
      if (!groups[invId]) {
        groups[invId] = {
          idInvoice: invId,
          tanggalBayar: row.tanggal ? row.tanggal.split(' ')[0] : "",
          waktuFull: row.tanggal,
          idPasien: row.idPasien,
          noRm: row.noRm,
          namaPasien: row.namaPasien,
          dokter: row.dokter,
          totalBayar: row.totalInvoice,
          metode: row.metode,
          status: row.status,
          keterangan: row.keterangan || "",
          kasir: row.kasir,
          items: []
        };
      }
      groups[invId].items.push({
        namaItem: row.item,
        kategori: row.kategori,
        qty: row.qty,
        hargaSatuan: row.harga,
        diskon: row.diskon,
        subtotal: row.grandTotalItem
      });
    });
    
    return Object.values(groups).sort((a, b) => b.idInvoice.localeCompare(a.idInvoice));
  } catch (e) {
    return [];
  }
}

function simpanPembayaranBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetEksternal(DB_CONFIG.PEMBAYARAN, "Data_Pembayaran");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_Invoice', 'Tanggal_Tindakan', 'ID_Pasien', 'No_RM', 'Nama_Pasien',
        'Dokter_Pemeriksa', 'Kategori_Item', 'Nama_Item', 'Harga_Satuan', 'Qty',
        'Labor', 'Diskon_Persen', 'Grand_Total_Item', 'Perawat', 'Total_Invoice',
        'Metode_Bayar', 'Status_Pembayaran', 'Keterangan', 'Kasir_Bertugas', 'Waktu_Sistem'
      ]);
    }
    
    let lr = sheet.getLastRow(), d = new Date(), mmyy = ("0" + (d.getMonth() + 1)).slice(-2) + d.getFullYear().toString().slice(-2), num = 1;
    if (lr > 1) {
      let lastVal = sheet.getRange(lr, 1).getValue();
      let lastId = lastVal ? lastVal.toString().split('/') : [];
      if (lastId.length === 4 && !isNaN(parseInt(lastId[2], 10))) {
        num = parseInt(lastId[2], 10) + 1;
      } else {
        num = lr;
      }
    }
    
    let idInv = "INV/SHELDON/" + ("0000" + num).slice(-4) + "/" + mmyy;
    let tTindakan = JSON.parse(payload.tindakanStr || "[]");
    let tObat = JSON.parse(payload.obatStr || "[]");
    let tBMHP = JSON.parse(payload.bmhpStr || "[]");
    
    let rowsData = [], waktuSistem = new Date();
    let kasirNama = (payload.kasir && typeof payload.kasir === 'string') ? payload.kasir : "Kasir";
    let ketInfo = payload.keterangan || "";
    
    tTindakan.forEach(t => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'Tindakan', t.nama || "", t.harga || 0, t.qty || 1, t.labor || 0, t.diskon || 0,
      t.grandTotal || 0, t.perawat || "", payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    tObat.forEach(o => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'Obat', o.nama || "", o.harga || 0, o.qty || 1, 0, o.diskon || 0,
      o.grandTotal || 0, '', payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    tBMHP.forEach(b => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'BMHP', b.nama || "", b.harga || 0, b.qty || 1, 0, b.diskon || 0,
      b.grandTotal || 0, '', payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    if (rowsData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    }
    
    try {
      catatLog("Terima Pembayaran", "Invoice: " + idInv + " (Total Item: " + rowsData.length + ")", kasirNama);
    } catch(logErr) {
      Logger.log("catatLog error: " + logErr.message);
    }
    
    let itemGudang = [...tObat, ...tBMHP];
    if (itemGudang.length > 0) {
      try {
        potongStokGudang(itemGudang);
      } catch(stkErr) {
        Logger.log("potongStokGudang error: " + stkErr.message);
      }
    }

    // HITUNG & CATAT JASA MEDIS OTOMATIS
    try {
      hitungDanCatatJasaMedis({
        idInvoice: idInv,
        tanggal: payload.tglTindakan || Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy"),
        dokter: payload.dokter || "",
        tindakan: tTindakan,
        obat: tObat,
        bmhp: tBMHP,
        waktuSistem: waktuSistem
      });
    } catch(jmErr) {
      Logger.log("hitungDanCatatJasaMedis error: " + jmErr.message);
    }
    
    return { success: true, message: "Pembayaran berhasil disimpan!", idInvoice: idInv };
  } catch (e) {
    return { success: false, message: "Gagal Menyimpan Pembayaran: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function potongStokGudang(daftarItemDibeli) {
  try {
    let items = typeof daftarItemDibeli === 'string' ? JSON.parse(daftarItemDibeli) : daftarItemDibeli;
    if (!items || !Array.isArray(items)) return;
    
    let mapKode = {};
    let mapNama = {};
    items.forEach(item => {
      let qty = parseFloat(item.qty || item.jumlah || 1);
      if (item.kode) {
        let k = item.kode.toString().trim().toLowerCase();
        mapKode[k] = (mapKode[k] || 0) + qty;
      }
      if (item.nama) {
        let n = item.nama.toString().trim().toLowerCase();
        mapNama[n] = (mapNama[n] || 0) + qty;
      }
    });
    
    _eksekusiPotongStok(DB_CONFIG.OBAT, "Master_Obat", mapKode, mapNama);
    _eksekusiPotongStok(DB_CONFIG.BMHP, "Master_BMHP", mapKode, mapNama);
  } catch (e) {
    Logger.log("Error potongStokGudang: " + e.message);
  }
}

function _eksekusiPotongStok(idSpreadsheet, sheetName, mapKode, mapNama) {
  try {
    let ss = SpreadsheetApp.openById(idSpreadsheet);
    let sheetMaster = ss.getSheetByName(sheetName);
    if (!sheetMaster) return;
    
    let data = sheetMaster.getDataRange().getValues();
    if (data.length <= 1) return;
    
    let h = data[0];
    let idxKode = getColIdx(h, ["id_obat", "idobat", "kode_item", "kodeitem", "kode"]);
    let idxNama = getColIdx(h, ["nama_obat", "namaobat", "nama_barang", "namabarang", "namaitem", "nama"]);
    let idxStok = getColIdx(h, ["stock_tersedia", "stocktersedia", "stok_tersedia", "stoktersedia", "stok", "sisa"]);
    let idxTerjual = getColIdx(h, ["terjual", "total_terjual", "totalterjual"]);
    
    if (idxStok === -1 && idxTerjual === -1) return;
    let modified = false;
    
    for (let i = 1; i < data.length; i++) {
      let kodeData = idxKode !== -1 && data[i][idxKode] ? data[i][idxKode].toString().trim().toLowerCase() : "";
      let namaData = idxNama !== -1 && data[i][idxNama] ? data[i][idxNama].toString().trim().toLowerCase() : "";
      
      let qtyBeli = 0;
      if (kodeData && mapKode[kodeData] !== undefined) {
        qtyBeli = mapKode[kodeData];
      } else if (namaData && mapNama[namaData] !== undefined) {
        qtyBeli = mapNama[namaData];
      }
      
      if (qtyBeli > 0) {
        let stokLama = parseFloat(data[i][idxStok]) || 0;
        let terjualLama = idxTerjual !== -1 ? parseFloat(data[i][idxTerjual]) || 0 : 0;
        
        let stokBaru = Math.max(0, stokLama - qtyBeli);
        data[i][idxStok] = stokBaru;
        if (idxTerjual !== -1) {
          data[i][idxTerjual] = terjualLama + qtyBeli;
        }
        modified = true;
      }
    }
    
    // BATCH UPDATE: 1 kali panggilan setValues untuk seluruh baris yang diubah
    if (modified) {
      sheetMaster.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
  } catch (e) {
    Logger.log("Gagal memotong stok di " + sheetName + ": " + e.message);
  }
}

// =========================================================================
// ENGINE OTOMATISASI PERHITUNGAN JASA MEDIS (JM)
// =========================================================================
function hitungDanCatatJasaMedis(ctx) {
  try {
    const idPembayaran = DB_CONFIG.PEMBAYARAN;
    const sheetJM = getSheetEksternal(idPembayaran, "Rekap_Jasa_Medis");
    if (!sheetJM) return;

    if (sheetJM.getLastRow() === 0) {
      sheetJM.appendRow([
        "ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item",
        "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan",
        "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat",
        "Bagian_Klinik", "Status_JM", "Waktu_Hitung"
      ]);
    }

    // Ambil Data Referensi: Tindakan, Dokter, Tarif Khusus
    const listTindakan = (typeof getDaftarTindakanLengkap === 'function') ? getDaftarTindakanLengkap() : [];
    const listDokter = (typeof getDaftarDokterSIP === 'function') ? getDaftarDokterSIP() : [];
    const listTarifKhusus = (typeof getTarifKhususDokter === 'function') ? getTarifKhususDokter() : [];

    // Cari Rate Default Dokter Terpilih (Default fallback 40% jika tidak ditemukan)
    let dokObj = listDokter.find(d => d.nama === ctx.dokter);
    let defaultRateDokter = (dokObj && dokObj.persenJM !== undefined && dokObj.persenJM !== null) ? dokObj.persenJM : 0.40;

    let rowsJM = [];

    // 1. PROSES ITEM TINDAKAN
    (ctx.tindakan || []).forEach(t => {
      let namaTindakan = t.nama || "";
      let tarifKotor = parseFloat(t.grandTotal || t.harga || 0);
      let biayaLab = parseFloat(t.labor || 0);
      let namaPerawat = t.perawat || "";

      // Cari master tindakan untuk cek Labor dan default rate
      let masterT = listTindakan.find(x => x.nama === namaTindakan);
      let isNeedLab = masterT ? (masterT.perluLab === 'Ya') : (biayaLab > 0);

      // Cek Hierarki Persentase
      let finalPersen = defaultRateDokter;
      let tipeAturan = "Default Dokter (" + Math.round(defaultRateDokter * 100) + "%)";

      // Tingkat 1: Cek apakah tindakan mengunci rate global (misal: Rontgen 15%)
      if (masterT && masterT.persenJMDefault !== null && masterT.persenJMDefault !== undefined && masterT.persenJMDefault > 0) {
        finalPersen = masterT.persenJMDefault;
        tipeAturan = "Kunci Tindakan Global (" + Math.round(finalPersen * 100) + "%)";
      } else {
        // Tingkat 2: Cek apakah dokter punya Tarif Khusus untuk tindakan ini
        let exc = listTarifKhusus.find(x => x.dokter === ctx.dokter && (x.nama === namaTindakan || (masterT && x.kode === masterT.kode)));
        if (exc && exc.persenJM !== undefined && exc.persenJM !== null) {
          finalPersen = exc.persenJM;
          tipeAturan = "Tarif Khusus Dokter (" + Math.round(finalPersen * 100) + "%)";
        }
      }

      // Validasi Syarat LAB
      let statusJM = "SIAP_CAIR";
      let dasarBagiHasil = Math.max(0, tarifKotor - biayaLab);

      if (isNeedLab && biayaLab <= 0) {
        statusJM = "PENDING_LAB";
      }

      let jmDokterKotor = 0;
      let potonganPerawat = 0;
      let jmDokterBersih = 0;
      let jmPerawat = 0;
      let bagianKlinik = tarifKotor;

      if (statusJM === "SIAP_CAIR") {
        jmDokterKotor = Math.round(dasarBagiHasil * finalPersen);

        // Cek jika tindakan melibatkan perawat (misal paket behel include scaling oleh perawat)
        let namaTindakanLower = namaTindakan.toLowerCase();
        if (namaPerawat && namaPerawat.trim() !== "" && (namaTindakanLower.includes("behel") || namaTindakanLower.includes("ortho") || namaTindakanLower.includes("orto"))) {
          potonganPerawat = Math.min(jmDokterKotor, 50000); // Rp 50.000 jasa scaling perawat
          tipeAturan += " + Asistensi Perawat Rp 50k";
        }

        jmPerawat = potonganPerawat;
        jmDokterBersih = Math.max(0, jmDokterKotor - potonganPerawat);
        bagianKlinik = Math.max(0, tarifKotor - jmDokterBersih - jmPerawat - biayaLab);
      } else {
        // Status PENDING_LAB: JM ditahan sementara 0
        jmDokterKotor = 0;
        jmDokterBersih = 0;
        jmPerawat = 0;
      }

      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, namaPerawat, "Tindakan", namaTindakan,
        tarifKotor, biayaLab, dasarBagiHasil, finalPersen, tipeAturan,
        jmDokterKotor, potonganPerawat, jmDokterBersih, jmPerawat,
        bagianKlinik, statusJM, ctx.waktuSistem || new Date()
      ]);
    });

    // 2. PROSES ITEM OBAT (0% UNTUK DOKTER)
    (ctx.obat || []).forEach(o => {
      let total = parseFloat(o.grandTotal || o.harga || 0);
      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, "", "Obat", o.nama || "Obat",
        total, 0, total, 0, "Obat (0% Dokter)",
        0, 0, 0, 0, total, "NON_JM", ctx.waktuSistem || new Date()
      ]);
    });

    // 3. PROSES ITEM BMHP (0% UNTUK DOKTER)
    (ctx.bmhp || []).forEach(b => {
      let total = parseFloat(b.grandTotal || b.harga || 0);
      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, "", "BMHP", b.nama || "BMHP",
        total, 0, total, 0, "BMHP (0% Dokter)",
        0, 0, 0, 0, total, "NON_JM", ctx.waktuSistem || new Date()
      ]);
    });

    if (rowsJM.length > 0) {
      sheetJM.getRange(sheetJM.getLastRow() + 1, 1, rowsJM.length, rowsJM[0].length).setValues(rowsJM);
    }
  } catch(e) {
    Logger.log("Error hitungDanCatatJasaMedis: " + e.message);
  }
}

function getRekapJasaMedis(filterBulanTahun) {
  try {
    const v = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
    if (!v || v.length <= 1) return [];
    let h = v[0];
    let idInv = getColIdx(h, ['idinvoice', 'id_invoice']); if (idInv === -1) idInv = 0;
    let idTgl = getColIdx(h, ['tanggal', 'tgl']); if (idTgl === -1) idTgl = 1;
    let idDok = getColIdx(h, ['dokter']); if (idDok === -1) idDok = 2;
    let idPer = getColIdx(h, ['perawat']); if (idPer === -1) idPer = 3;
    let idKat = getColIdx(h, ['kategoriitem', 'kategori_item']); if (idKat === -1) idKat = 4;
    let idItem = getColIdx(h, ['namaitem', 'nama_item']); if (idItem === -1) idItem = 5;
    let idTarif = getColIdx(h, ['tarifkotor', 'tarif_kotor']); if (idTarif === -1) idTarif = 6;
    let idLab = getColIdx(h, ['biayalab', 'biaya_lab']); if (idLab === -1) idLab = 7;
    let idDasar = getColIdx(h, ['dasarbagihasil', 'dasar_bagi_hasil']); if (idDasar === -1) idDasar = 8;
    let idPersen = getColIdx(h, ['persenjm', 'persen_jm']); if (idPersen === -1) idPersen = 9;
    let idAturan = getColIdx(h, ['tipeaturan', 'tipe_aturan']); if (idAturan === -1) idAturan = 10;
    let idJMBersih = getColIdx(h, ['jmdokterbersih', 'jm_dokter_bersih']); if (idJMBersih === -1) idJMBersih = 13;
    let idJMPer = getColIdx(h, ['jmperawat', 'jm_perawat']); if (idJMPer === -1) idJMPer = 14;
    let idKlinik = getColIdx(h, ['bagianklinik', 'bagian_klinik']); if (idKlinik === -1) idKlinik = 15;
    let idStatus = getColIdx(h, ['statusjm', 'status_jm']); if (idStatus === -1) idStatus = 16;

    let res = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idInv]) continue;
      res.push({
        idInvoice: String(r[idInv] || ""),
        tanggal: String(r[idTgl] || ""),
        dokter: String(r[idDok] || ""),
        perawat: String(r[idPer] || ""),
        kategori: String(r[idKat] || ""),
        namaItem: String(r[idItem] || ""),
        tarifKotor: Number(r[idTarif] || 0),
        biayaLab: Number(r[idLab] || 0),
        dasarBagiHasil: Number(r[idDasar] || 0),
        persenJM: Number(r[idPersen] || 0),
        tipeAturan: String(r[idAturan] || ""),
        jmDokterBersih: Number(r[idJMBersih] || 0),
        jmPerawat: Number(r[idJMPer] || 0),
        bagianKlinik: Number(r[idKlinik] || 0),
        statusJM: String(r[idStatus] || "")
      });
    }
    return res;
  } catch(e) {
    return [];
  }
}


// >>>>>>>>>>>>>>> MODULE: 06_InventoryGudang.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI INVENTORY, GUDANG & RESTOCK (OBAT & BMHP)
// =========================================================================

function getDaftarObatLengkap() {
  try {
    const v = readFast(DB_CONFIG.OBAT, "Master_Obat");
    if (v.length <= 1) return [];
    let h = v[0];
    let idK = getColIdx(h, ['id_obat', 'idobat', 'kode_item', 'kodeitem', 'kode']); if (idK === -1) idK = 0;
    let idN = getColIdx(h, ['nama_obat', 'namaobat', 'nama']); if (idN === -1) idN = 1;
    let idKand = getColIdx(h, ['kandungan_obat', 'kandungan', 'komposisi', 'zat_aktif']);
    let idSatBeli = getColIdx(h, ['satuan_beli', 'satuanbeli']);
    let idIsi = getColIdx(h, ['isi_per_satuan', 'isi_persatuan', 'isi']);
    let idHrgBeli = getColIdx(h, ['harga_beli_satuan', 'hargabelisatuan', 'harga_beli']);
    let idHPP = getColIdx(h, ['hpp_pcs', 'hpppcs', 'hpp']);
    let idMargin = getColIdx(h, ['margin_persen', 'margin']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']); if (idH === -1) idH = 4;
    let idStk = getColIdx(h, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stock_minimum', 'stockminimum', 'stok_minimum', 'kritis', 'stokmin']);
    let idTerjual = getColIdx(h, ['terjual', 'total_terjual', 'totalterjual']);
    let idExp = getColIdx(h, ['tanggal_kadaluarsa', 'tanggalkadaluarsa', 'expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);
    let idS = getColIdx(h, ['satuan']);

    return v.slice(1).filter(r => r[idN]).map(r => {
      let hpp = parseHarga(idHPP !== -1 ? r[idHPP] : 0);
      let hj = parseHarga(r[idH] || 0);
      let isi = (idIsi !== -1 && r[idIsi]) ? parseFloat(r[idIsi]) || 1 : 1;
      let satBeli = (idSatBeli !== -1 && r[idSatBeli]) ? String(r[idSatBeli]).trim() : "Box";
      let satDefault = (idS !== -1 && r[idS]) ? String(r[idS]).trim() : "Tablet";
      let hrgBeli = parseHarga(idHrgBeli !== -1 ? r[idHrgBeli] : (hpp * isi));
      let marginVal = (idMargin !== -1 && r[idMargin] !== undefined && r[idMargin] !== "")
        ? (typeof r[idMargin] === 'number' ? Math.round(r[idMargin] * (r[idMargin] <= 1 ? 100 : 1)) : parseFloat(String(r[idMargin]).replace('%', '')))
        : (hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0);

      return {
        kode: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
        idObat: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
        nama: String(r[idN]).trim(),
        kandungan: idKand !== -1 && r[idKand] ? String(r[idKand]).trim() : "-",
        satuanBeli: satBeli,
        isiPerSatuan: isi,
        satuan: satDefault,
        hargaBeliSatuan: hrgBeli,
        hpp: hpp,
        hppPcs: hpp,
        margin: marginVal,
        harga: hj,
        hargaJual: hj,
        stok: parseFloat(idStk !== -1 ? r[idStk] : 0) || 0,
        stokMin: parseFloat(idMin !== -1 ? r[idMin] : 0) || 0,
        terjual: parseFloat(idTerjual !== -1 ? r[idTerjual] : 0) || 0,
        expired: idExp !== -1 && r[idExp] ? fDate(r[idExp]) : "-",
        supplier: idSup !== -1 && r[idSup] ? String(r[idSup]).trim() : "-",
        kategori: "Obat"
      };
    });
  } catch (e) {
    return [];
  }
}

function getDaftarBMHPLengkap() {
  try {
    const v = readFast(DB_CONFIG.BMHP, "Master_BMHP");
    if (v.length <= 1) return [];
    let h = v[0];
    let idK = getColIdx(h, ['kode_item', 'kodeitem', 'kode']); if (idK === -1) idK = 0;
    let idN = getColIdx(h, ['nama_barang', 'namabarang', 'nama']); if (idN === -1) idN = 1;
    let idS = getColIdx(h, ['satuan']);
    let idHPP = getColIdx(h, ['hpp']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']); if (idH === -1) idH = 4;
    let idStk = getColIdx(h, ['stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stok_minimum', 'kritis', 'stokmin']);
    let idExp = getColIdx(h, ['expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);

    return v.slice(1).filter(r => r[idN]).map(r => ({
      kode: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
      nama: String(r[idN]).trim(),
      satuan: idS !== -1 && r[idS] ? String(r[idS]).trim() : "Unit",
      hpp: parseHarga(idHPP !== -1 ? r[idHPP] : 0),
      harga: parseHarga(r[idH] || 0),
      hargaJual: parseHarga(r[idH] || 0),
      stok: parseFloat(idStk !== -1 ? r[idStk] : 0) || 0,
      stokMin: parseFloat(idMin !== -1 ? r[idMin] : 0) || 0,
      expired: idExp !== -1 && r[idExp] ? fDate(r[idExp]) : "-",
      supplier: idSup !== -1 && r[idSup] ? String(r[idSup]).trim() : "-",
      kategori: "BMHP"
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Mengambil daftar inventaris gabungan (Obat & BMHP) untuk modul Manajemen Gudang.
 */
function getMasterInventory() {
  try {
    let result = [];
    
    // 1. Obat
    const vObat = readFast(DB_CONFIG.OBAT, "Master_Obat");
    if (vObat.length > 1) {
      let h = vObat[0];
      let iKode = getColIdx(h, ['id_obat', 'idobat', 'kode_item', 'kode']);
      let iNama = getColIdx(h, ['nama_obat', 'nama']);
      let iSatBeli = getColIdx(h, ['satuan_beli', 'satuanbeli']);
      let iIsi = getColIdx(h, ['isi_per_satuan', 'isi_persatuan', 'isi']);
      let iSat = getColIdx(h, ['satuan']);
      let iHpp = getColIdx(h, ['hpp_pcs', 'hpppcs', 'hpp']);
      let iHrg = getColIdx(h, ['harga_jual', 'harga']);
      let iMargin = getColIdx(h, ['margin_persen', 'margin']);
      let iStk = getColIdx(h, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stok']);
      let iMin = getColIdx(h, ['stock_minimum', 'stockminimum', 'stok_minimum', 'kritis']);
      
      for (let i = 1; i < vObat.length; i++) {
        let r = vObat[i];
        if (!r[iNama]) continue;
        let hpp = parseHarga(iHpp !== -1 ? r[iHpp] : 0);
        let hj = parseHarga(iHrg !== -1 ? r[iHrg] : 0);
        let margin = (iMargin !== -1 && r[iMargin] !== undefined && r[iMargin] !== "")
          ? (typeof r[iMargin] === 'number' ? Math.round(r[iMargin] * (r[iMargin] <= 1 ? 100 : 1)) : parseFloat(String(r[iMargin]).replace('%', '')))
          : (hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0);
        let isi = (iIsi !== -1 && r[iIsi]) ? parseFloat(r[iIsi]) || 1 : 1;
        let satBeli = (iSatBeli !== -1 && r[iSatBeli]) ? String(r[iSatBeli]).trim() : "Box";
        let satDefault = (iSat !== -1 && r[iSat]) ? String(r[iSat]).trim() : "Tablet";

        result.push({
          kode: iKode !== -1 && r[iKode] ? String(r[iKode]).trim() : "OBT-" + i,
          nama: String(r[iNama]).trim(),
          kategori: "Obat",
          satuanBeli: satBeli,
          isiPerSatuan: isi,
          satuan: satDefault,
          hpp: hpp,
          hargaJual: hj,
          margin: margin,
          stok: parseFloat(iStk !== -1 ? r[iStk] : 0) || 0,
          kritis: parseFloat(iMin !== -1 ? r[iMin] : 10) || 10
        });
      }
    }
    
    // 2. BMHP
    const vBmhp = readFast(DB_CONFIG.BMHP, "Master_BMHP");
    if (vBmhp.length > 1) {
      let h = vBmhp[0];
      let iKode = getColIdx(h, ['kode_item', 'kode']);
      let iNama = getColIdx(h, ['nama_barang', 'nama']);
      let iSat = getColIdx(h, ['satuan']);
      let iHpp = getColIdx(h, ['hpp']);
      let iHrg = getColIdx(h, ['harga_jual', 'harga']);
      let iStk = getColIdx(h, ['stok_tersedia', 'stok']);
      let iMin = getColIdx(h, ['stok_minimum', 'kritis']);
      
      for (let i = 1; i < vBmhp.length; i++) {
        let r = vBmhp[i];
        if (!r[iNama]) continue;
        let hpp = parseHarga(r[iHpp] || 0);
        let hj = parseHarga(r[iHrg] || 0);
        let margin = hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0;
        result.push({
          kode: iKode !== -1 && r[iKode] ? String(r[iKode]).trim() : "BMH-" + i,
          nama: String(r[iNama]).trim(),
          kategori: "BMHP",
          satuanBeli: "Pcs",
          isiPerSatuan: 1,
          satuan: iSat !== -1 && r[iSat] ? String(r[iSat]).trim() : "Pcs",
          hpp: hpp,
          hargaJual: hj,
          margin: margin,
          stok: parseFloat(r[iStk] || 0),
          kritis: parseFloat(r[iMin] || 10)
        });
      }
    }
    
    return result;
  } catch (e) {
    return [];
  }
}

/**
 * Mencatat restock / barang masuk ke Gudang Obat atau BMHP.
 */
function simpanPembelianGudang(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User", "Admin", "Kasir"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    
    let isObat = payload.kode.toUpperCase().startsWith("OBT");
    let dbId = isObat ? DB_CONFIG.OBAT : DB_CONFIG.BMHP;
    let masterSheetName = isObat ? "Master_Obat" : "Master_BMHP";
    let riwayatSheetName = "Riwayat_Pembelian";
    
    let ss = SpreadsheetApp.openById(dbId);
    let sheetMaster = ss.getSheetByName(masterSheetName);
    let sheetRiwayat = ss.getSheetByName(riwayatSheetName);
    
    if (!sheetRiwayat) {
      sheetRiwayat = ss.insertSheet(riwayatSheetName);
      if (isObat) {
        sheetRiwayat.appendRow(['Tanggal', 'ID_Obat', 'Nama_Obat', 'Harga', 'Tanggal_Kadaluarsa', 'Jumlah_Beli', 'Total_Beli', 'Supplier', 'Petugas', 'Waktu_Sistem']);
      } else {
        sheetRiwayat.appendRow(['Tanggal', 'Kode_Item', 'Nama_Item', 'Qty', 'Harga_Beli', 'Subtotal', 'Supplier', 'Expired_Date', 'Petugas', 'Waktu_Sistem']);
      }
    }
    
    // Periksa data Master untuk mencari Isi per satuan
    let dataMaster = sheetMaster.getDataRange().getValues();
    let isiPerSatuan = 1;
    let idxRowMaster = -1;
    let hMaster = dataMaster.length > 0 ? dataMaster[0] : [];
    let iKodeM = getColIdx(hMaster, ['id_obat', 'idobat', 'kode_item', 'kode']);
    let iIsiM = getColIdx(hMaster, ['isi_per_satuan', 'isi_persatuan', 'isi']);
    let iStkM = getColIdx(hMaster, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stok']);
    let iHppM = getColIdx(hMaster, ['hpp_pcs', 'hpppcs', 'hpp']);
    let iHrgBeliM = getColIdx(hMaster, ['harga_beli_satuan', 'hargabelisatuan', 'harga_beli']);
    let iExpM = getColIdx(hMaster, ['tanggal_kadaluarsa', 'expired_date', 'exp']);
    let iSupM = getColIdx(hMaster, ['supplier']);

    for (let i = 1; i < dataMaster.length; i++) {
      let kRow = iKodeM !== -1 ? String(dataMaster[i][iKodeM]).trim().toLowerCase() : "";
      if (kRow === payload.kode.trim().toLowerCase()) {
        idxRowMaster = i;
        if (iIsiM !== -1 && dataMaster[i][iIsiM]) {
          isiPerSatuan = parseFloat(dataMaster[i][iIsiM]) || 1;
        }
        break;
      }
    }

    let qtyBeliSatuan = parseFloat(payload.qty || payload.jumlahBeli || 1) || 0;
    let totalPcs = parseFloat(payload.totalBeli) || (qtyBeliSatuan * isiPerSatuan);
    let hargaBeliSatuan = parseHarga(payload.hargaBeli || payload.harga || 0);
    let hppPcs = isiPerSatuan > 0 ? Math.round(hargaBeliSatuan / isiPerSatuan) : hargaBeliSatuan;
    let subtotal = qtyBeliSatuan * hargaBeliSatuan;
    let waktuSistem = new Date();
    
    // 1. Catat ke Riwayat Pembelian
    let hRiwayat = sheetRiwayat.getRange(1, 1, 1, sheetRiwayat.getLastColumn()).getValues()[0];
    let hasTotalBeli = getColIdx(hRiwayat, ['total_beli', 'totalbeli']) !== -1;
    let hasNoFaktur = getColIdx(hRiwayat, ['no_faktur', 'nofaktur', 'faktur', 'no_batch', 'batch']) !== -1;

    if (hasTotalBeli) {
      if (hasNoFaktur) {
        sheetRiwayat.appendRow([
          payload.tanggal || fDate(waktuSistem),
          payload.noFaktur || "-",
          payload.kode,
          payload.nama,
          hargaBeliSatuan,
          payload.expiredDate || "-",
          qtyBeliSatuan,
          totalPcs,
          payload.supplier || "-",
          payload.currentUser || "System",
          waktuSistem
        ]);
      } else {
        sheetRiwayat.appendRow([
          payload.tanggal || fDate(waktuSistem),
          payload.kode,
          payload.nama,
          hargaBeliSatuan,
          payload.expiredDate || "-",
          qtyBeliSatuan,
          totalPcs,
          payload.supplier || "-",
          payload.currentUser || "System",
          waktuSistem
        ]);
      }
    } else {
      sheetRiwayat.appendRow([
        payload.tanggal || fDate(waktuSistem),
        payload.kode,
        payload.nama,
        qtyBeliSatuan,
        hargaBeliSatuan,
        subtotal,
        payload.supplier || "-",
        payload.expiredDate || "-",
        payload.currentUser || "System",
        waktuSistem
      ]);
    }
    
    // 2. Update Stok & Harga di Master
    if (idxRowMaster !== -1 && iStkM !== -1) {
      let cellFormula = sheetMaster.getRange(idxRowMaster + 1, iStkM + 1).getFormula();
      // Jika sel Stok bukan formula otomatis, perbarui angkanya di sheet
      if (!cellFormula) {
        let stokLama = parseFloat(dataMaster[idxRowMaster][iStkM]) || 0;
        let stokBaru = stokLama + totalPcs;
        dataMaster[idxRowMaster][iStkM] = stokBaru;
      }

      if (iHrgBeliM !== -1 && hargaBeliSatuan > 0) dataMaster[idxRowMaster][iHrgBeliM] = hargaBeliSatuan;
      if (iHppM !== -1 && hppPcs > 0) dataMaster[idxRowMaster][iHppM] = hppPcs;
      if (iExpM !== -1 && payload.expiredDate) dataMaster[idxRowMaster][iExpM] = payload.expiredDate;
      if (iSupM !== -1 && payload.supplier) dataMaster[idxRowMaster][iSupM] = payload.supplier;

      sheetMaster.getRange(idxRowMaster + 1, 1, 1, dataMaster[idxRowMaster].length).setValues([dataMaster[idxRowMaster]]);
    }
    
    catatLog("Restock Gudang", "Restock " + payload.nama + " (" + qtyBeliSatuan + " satuan beli, total: " + totalPcs + " pcs)", payload.currentUser);
    
    return { success: true, message: "Restock " + payload.nama + " berhasil dicatat ke Riwayat & Stok diperbarui!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan restock: " + e.message };
  } finally {
    lock.releaseLock();
  }
}


// >>>>>>>>>>>>>>> MODULE: 07_MasterDatabase.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI MASTER DATABASE: ICD-10, KATEGORI, TINDAKAN & STAFF
// =========================================================================

function getInitMaster() {
  return {
    staff: getDaftarStaffLengkap(),
    tindakan: getDaftarTindakanLengkap(),
    obat: getDaftarObatLengkap(),
    bmhp: getDaftarBMHPLengkap()
  };
}

function getDaftarStaffLengkap() {
  try {
    const v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return [];
    let h = v[0];
    let idN = getColIdx(h, ['namapekerja', 'nama', 'namalengkap']); if (idN === -1) idN = 0;
    let idR = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idR === -1) idR = 2;
    
    return v.slice(1).filter(r => r[idN]).map(r => ({
      nama: String(r[idN]).trim(),
      role: r[idR] ? String(r[idR]).trim() : ""
    }));
  } catch (e) {
    return [];
  }
}

function getDaftarDokterSIP() {
  try {
    const v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return [];
    let h = v[0];
    let idNama = getColIdx(h, ['namapekerja', 'nama']);
    let idRole = getColIdx(h, ['kategorirole', 'kategori', 'role']);
    let idSIP = getColIdx(h, ['noregistrasi', 'sip', 'noreg']);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm', 'persen_bagi_hasil']);
    
    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idNama] || String(r[idNama]).trim() === "") continue;
      let role = r[idRole] ? String(r[idRole]).trim().toLowerCase() : "";
      if (role.includes("dokter gigi spesialis") || role.includes("dokter gigi umum") || role === "dokter") {
        let pJM = (idJM !== -1 && r[idJM] !== "" && r[idJM] !== null && r[idJM] !== undefined) ? Number(r[idJM]) : (role.includes("spesialis") ? 0.50 : 0.40);
        result.push({
          nama: String(r[idNama]).trim(),
          sip: (idSIP !== -1 && r[idSIP]) ? String(r[idSIP]).trim() : "-",
          persenJM: pJM
        });
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

/**
 * Mengambil seluruh data akun user dari Spreadsheet Master (Sheet: Data)
 * Khusus Super User / Owner
 */
function getDaftarUserMaster() {
  try {
    const v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return [];
    let h = v[0];
    let idNama = getColIdx(h, ['namapekerja', 'nama', 'namalengkap']); if (idNama === -1) idNama = 0;
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idRole = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = 2;
    let idPass = getColIdx(h, ['password', 'pass']); if (idPass === -1) idPass = 3;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;
    let idSIP = getColIdx(h, ['noregistrasi', 'sip', 'noreg']); if (idSIP === -1) idSIP = 5;
    let idHP = getColIdx(h, ['nohp', 'no_hp', 'telepon', 'wa']); if (idHP === -1) idHP = 6;
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm']); if (idJM === -1) idJM = 7;
    let idEmail = getColIdx(h, ['email', 'surel', 'e-mail']); if (idEmail === -1) idEmail = 8;

    let users = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idUser] && !r[idNama]) continue;
      let pVal = String(r[idPass] !== null && r[idPass] !== undefined ? r[idPass] : "").trim();
      let hasPass = pVal.length > 0;
      let isHashed = pVal.length === 64;
      
      users.push({
        nama: String(r[idNama] || "").trim(),
        username: String(r[idUser] || "").trim(),
        role: String(r[idRole] || "Staff").trim(),
        hasPassword: hasPass,
        isHashed: isHashed,
        status: String(r[idStatus] || "Aktif").trim(),
        noReg: String(r[idSIP] || "-").trim(),
        noHp: String(r[idHP] || "").trim(),
        persenJM: (idJM !== -1 && r[idJM] !== "" && r[idJM] !== null && r[idJM] !== undefined) ? Number(r[idJM]) : 0,
        email: (idEmail !== -1 && r[idEmail] !== undefined && r[idEmail] !== null) ? String(r[idEmail]).trim() : ""
      });
    }
    return users;
  } catch (e) {
    Logger.log("Error getDaftarUserMaster: " + e.message);
    return [];
  }
}

/**
 * Menyimpan / Memperbarui Akun User ke Spreadsheet Master (Sheet: Data)
 * Khusus Super User / Owner
 */
function simpanUserMaster(payload) {
  try {
    if (!payload || !payload.username || !payload.nama) {
      return { success: false, message: "Nama Pekerja dan Username wajib diisi!" };
    }

    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    const sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    const v = sheet.getDataRange().getValues();
    if (v.length === 0) {
      sheet.appendRow(["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"]);
    }

    let h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let idNama = getColIdx(h, ['namapekerja', 'nama']); if (idNama === -1) idNama = 0;
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idRole = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = 2;
    let idPass = getColIdx(h, ['password', 'pass']); if (idPass === -1) idPass = 3;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;
    let idSIP = getColIdx(h, ['noregistrasi', 'sip', 'noreg']); if (idSIP === -1) idSIP = 5;
    let idHP = getColIdx(h, ['nohp', 'no_hp', 'telepon', 'wa']); if (idHP === -1) idHP = 6;
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm']); if (idJM === -1) idJM = 7;
    let idEmail = getColIdx(h, ['email', 'surel', 'e-mail']);

    if (idEmail === -1) {
      idEmail = Math.max(8, h.length);
      sheet.getRange(1, idEmail + 1).setValue("Email").setFontWeight("bold").setBackground("#e2e8f0");
      h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    let cleanUser = String(payload.username).trim().toLowerCase().replace(/\s+/g, "");
    let rowIndex = -1;

    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        rowIndex = i + 1;
        break;
      }
    }

    let pjmVal = payload.persenJM !== undefined && payload.persenJM !== "" ? Number(payload.persenJM) : 0;
    if (pjmVal > 1) pjmVal = pjmVal / 100;

    if (rowIndex > 1) {
      // MODE EDIT
      sheet.getRange(rowIndex, idNama + 1).setValue(payload.nama.trim());
      sheet.getRange(rowIndex, idRole + 1).setValue(payload.role.trim());
      sheet.getRange(rowIndex, idStatus + 1).setValue(payload.status || "Aktif");
      sheet.getRange(rowIndex, idSIP + 1).setValue(payload.noReg || "-");
      sheet.getRange(rowIndex, idHP + 1).setValue(payload.noHp || "");
      sheet.getRange(rowIndex, idJM + 1).setValue(pjmVal);
      if (payload.email !== undefined) {
        sheet.getRange(rowIndex, idEmail + 1).setValue(String(payload.email || "").trim());
      }

      if (payload.password && String(payload.password).trim() !== "") {
        let cellPass = sheet.getRange(rowIndex, idPass + 1);
        cellPass.setNumberFormat("@");
        cellPass.setValue(String(payload.password).trim());
      }

      catatLog("Master User", "Edit user: " + cleanUser + " (" + payload.role + ")", payload.currentUser || "Super User");
      return { success: true, message: "Akun user '" + cleanUser + "' berhasil diperbarui!" };
    } else {
      // MODE TAMBAH BARU
      if (!payload.password || String(payload.password).trim() === "") {
        return { success: false, message: "Password wajib diisi untuk user baru!" };
      }

      let newRow = new Array(Math.max(9, h.length, idEmail + 1)).fill("");
      newRow[idNama] = payload.nama.trim();
      newRow[idUser] = cleanUser;
      newRow[idRole] = payload.role.trim();
      newRow[idPass] = String(payload.password).trim();
      newRow[idStatus] = payload.status || "Aktif";
      newRow[idSIP] = payload.noReg || "-";
      newRow[idHP] = payload.noHp || "";
      newRow[idJM] = pjmVal;
      newRow[idEmail] = String(payload.email || "").trim();

      sheet.appendRow(newRow);
      let lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, idPass + 1).setNumberFormat("@");
      sheet.getRange(lastRow, idJM + 1).setNumberFormat("0.0%");

      catatLog("Master User", "Tambah user baru: " + cleanUser + " (" + payload.role + ")", payload.currentUser || "Super User");
      return { success: true, message: "User baru '" + cleanUser + "' berhasil ditambahkan ke Database Master!" };
    }
  } catch (e) {
    return { success: false, message: "Gagal simpan user: " + e.message };
  }
}

/**
 * Mengaktifkan akun user yang berstatus Non Aktif / Tidak Aktif oleh Super Admin
 */
function aktifkanUserMaster(username, currentUser) {
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    const sheet = ss.getSheetByName("Data");
    if (!sheet) return { success: false, message: "Sheet Data tidak ditemukan!" };

    const v = sheet.getDataRange().getValues();
    const h = v[0];
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;

    let cleanUser = String(username || "").trim().toLowerCase();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        sheet.getRange(i + 1, idStatus + 1).setValue("Aktif");
        catatLog("Master User", "Aktivasi akun user: " + cleanUser, currentUser || "Super Admin");
        return { success: true, message: "Akun '" + username + "' berhasil diaktifkan! Pengguna kini dapat login ke sistem." };
      }
    }
    return { success: false, message: "User '" + username + "' tidak ditemukan." };
  } catch (e) {
    return { success: false, message: "Gagal mengaktifkan user: " + e.message };
  }
}

/**
 * Menghapus atau menonaktifkan akun user di Database Master
 */
function hapusUserMaster(username, isPermanent) {
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    const sheet = ss.getSheetByName("Data");
    if (!sheet) return { success: false, message: "Sheet Data tidak ditemukan!" };

    const v = sheet.getDataRange().getValues();
    const h = v[0];
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;

    let cleanUser = String(username).trim().toLowerCase();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        if (isPermanent) {
          sheet.deleteRow(i + 1);
          return { success: true, message: "Akun '" + username + "' berhasil dihapus permanen." };
        } else {
          sheet.getRange(i + 1, idStatus + 1).setValue("Non Aktif");
          return { success: true, message: "Status akun '" + username + "' diubah menjadi Non Aktif." };
        }
      }
    }
    return { success: false, message: "User '" + username + "' tidak ditemukan." };
  } catch (e) {
    return { success: false, message: "Gagal menghapus user: " + e.message };
  }
}

/**
 * Menu Spreadsheet UI untuk akses Form Master User & Role
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("👥 Master User & Role")
      .addItem("➕ Buka Form Tambah/Edit User", "bukaFormUserMasterDialog")
      .addItem("📋 Buka Sidebar Kelola User", "bukaFormUserMasterSidebar")
      .addSeparator()
      .addItem("⚙️ Setup Header & Format Sheet Data", "initFormatSheetUserMaster")
      .addToUi();
  } catch (e) {
    // Abaikan jika dipanggil di luar konteks Spreadsheet UI
  }
}

/**
 * Menampilkan Form Tambah/Edit User dalam bentuk Modal Dialog di Spreadsheet
 */
function bukaFormUserMasterDialog() {
  const html = HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
    .setWidth(850)
    .setHeight(680)
    .setTitle("Form Kelola User & Role - RME Sheldon");
  SpreadsheetApp.getUi().showModalDialog(html, "👤 Form Master User & Role");
}

/**
 * Menampilkan Form Tambah/Edit User dalam bentuk Sidebar di Spreadsheet
 */
function bukaFormUserMasterSidebar() {
  const html = HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
    .setTitle("Kelola User & Role");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Format Header dan Validasi Dropdown Role pada Sheet Data (RME Sheldon - 06 Master User & Role)
 */
function initFormatSheetUserMaster() {
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    let sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    
    const headers = ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);

    const validRoles = [
      "Super User",
      "Dokter Gigi Umum",
      "Dokter Gigi Spesialis",
      "Perawat Umum",
      "Perawat Gigi",
      "Admin",
      "Owner"
    ];

    const ruleRole = SpreadsheetApp.newDataValidation()
      .requireValueInList(validRoles, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 3, 100, 1).setDataValidation(ruleRole);

    const ruleStatus = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Aktif", "Non Aktif", "Tidak Aktif"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 5, 100, 1).setDataValidation(ruleStatus);

    sheet.getRange(2, 4, 100, 1).setNumberFormat("@"); // Password plain text format
    sheet.getRange(2, 8, 100, 1).setNumberFormat("0.0%"); // Persen JM format

    SpreadsheetApp.getUi().alert("✅ Berhasil menyiapkan format sheet 'Data' (termasuk kolom Email) dan validasi Kategori Role di Spreadsheet RME Sheldon - 06 Master User & Role!");
  } catch (e) {
    try {
      SpreadsheetApp.getUi().alert("Gagal format sheet: " + e.message);
    } catch(err) {
      Logger.log("Error initFormatSheetUserMaster: " + e.message);
    }
  }
}

/**
 * Mengembalikan template HTML Form User & Role untuk Apps Script
 */
function getHtmlFormUserMasterContent() {
  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <meta charset="utf-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <script src="https://cdn.tailwindcss.com"></script>' +
'  <style>' +
'    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; }' +
'    ::-webkit-scrollbar { width: 6px; height: 6px; }' +
'    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }' +
'  </style>' +
'</head>' +
'<body class="bg-slate-50 text-slate-800 p-4 min-h-screen">' +
'  <div class="max-w-4xl mx-auto space-y-4">' +
'    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">' +
'      <div class="flex items-center gap-3">' +
'        <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">👤</div>' +
'        <div>' +
'          <h1 class="text-sm font-black text-slate-800">Form Master User & Role (Khusus Super User)</h1>' +
'          <p class="text-[11px] text-slate-500 font-medium">Sinkron ke Spreadsheet: RME Sheldon - 06 Master User & Role (Sheet: Data)</p>' +
'        </div>' +
'      </div>' +
'      <button type="button" id="btnBatalEdit" onclick="batalEditUser()" class="hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all">✖ Batal Edit</button>' +
'    </div>' +
'    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">' +
'      <form id="formUserMaster" onsubmit="simpanUser(event)" class="space-y-4">' +
'        <input type="hidden" id="formMode" value="tambah">' +
'        <input type="hidden" id="origUsername" value="">' +
'        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Nama Lengkap Pekerja *</label>' +
'            <input type="text" id="inNama" required placeholder="Contoh: drg. Bambang / Ns. Siti" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500">' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Username Login *</label>' +
'            <input type="text" id="inUsername" required placeholder="huruf kecil, tanpa spasi" oninput="this.value = this.value.toLowerCase().replace(/\\s+/g, \'\')" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500">' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Kategori Role *</label>' +
'            <select id="inRole" required onchange="handleRoleChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">' +
'              <option value="Super User">Super User</option>' +
'              <option value="Dokter Gigi Umum">Dokter Gigi Umum</option>' +
'              <option value="Dokter Gigi Spesialis">Dokter Gigi Spesialis</option>' +
'              <option value="Perawat Umum">Perawat Umum</option>' +
'              <option value="Perawat Gigi">Perawat Gigi</option>' +
'              <option value="Admin">Admin</option>' +
'              <option value="Owner">Owner</option>' +
'            </select>' +
'          </div>' +
'        </div>' +
'        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Password <span id="lblPassWajib" class="text-rose-500">*</span></label>' +
'            <div class="relative">' +
'              <input type="password" id="inPassword" required placeholder="Min. 4 karakter" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 pr-9">' +
'              <button type="button" onclick="togglePassVisibility()" class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs">👁️</button>' +
'            </div>' +
'            <p id="hintPass" class="text-[9px] text-slate-400 mt-0.5 hidden">*Kosongkan jika password tidak diganti</p>' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Status Akun *</label>' +
'            <select id="inStatus" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">' +
'              <option value="Aktif" selected>Aktif</option>' +
'              <option value="Non Aktif">Non Aktif</option>' +
'              <option value="Tidak Aktif">Tidak Aktif</option>' +
'            </select>' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">No. SIP / STR</label>' +
'            <input type="text" id="inNoReg" placeholder="SIP: 503/xxx/Dinkes" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">No. WhatsApp / HP</label>' +
'            <input type="text" id="inNoHp" placeholder="081234567890" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">' +
'          </div>' +
'          <div>' +
'            <label class="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Email</label>' +
'            <input type="email" id="inEmail" placeholder="nama@email.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500">' +
'          </div>' +
'        </div>' +
'        <div id="wrapJM" class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">' +
'          <div>' +
'            <div class="text-xs font-bold text-amber-900 flex items-center gap-1.5"><span>🩺</span> Bagi Hasil Jasa Medis (JM) Dokter</div>' +
'            <p class="text-[11px] text-amber-700">Persentase jasa tindakan untuk dokter (Default: 50% Spesialis, 40% Umum)</p>' +
'          </div>' +
'          <div class="w-28 flex items-center gap-1">' +
'            <input type="number" id="inPersenJM" min="0" max="100" step="1" value="40" class="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-right outline-none focus:ring-2 focus:ring-amber-500">' +
'            <span class="font-bold text-amber-900 text-xs">%</span>' +
'          </div>' +
'        </div>' +
'        <div class="flex items-center justify-between pt-1 border-t border-slate-100">' +
'          <div id="formAlert" class="text-xs font-bold"></div>' +
'          <button type="submit" id="btnSubmit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2">' +
'            <span>💾</span> Simpan Pengguna' +
'          </button>' +
'        </div>' +
'      </form>' +
'    </div>' +
'    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">' +
'      <div class="flex items-center justify-between mb-3 gap-3">' +
'        <h2 class="text-xs font-black text-slate-800">Daftar Akun Pengguna Terdaftar</h2>' +
'        <div class="flex items-center gap-2">' +
'          <button type="button" onclick="muatUser()" title="Muat Ulang" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">🔄</button>' +
'          <input type="text" id="inCari" oninput="renderTabel()" placeholder="Cari nama/user/role/email..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-48">' +
'        </div>' +
'      </div>' +
'      <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-60">' +
'        <table class="w-full text-left whitespace-nowrap text-xs">' +
'          <thead class="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">' +
'            <tr>' +
'              <th class="p-2.5">Nama</th>' +
'              <th class="p-2.5">Username</th>' +
'              <th class="p-2.5">Role</th>' +
'              <th class="p-2.5 text-center">Status</th>' +
'              <th class="p-2.5">No. Reg</th>' +
'              <th class="p-2.5">No. HP</th>' +
'              <th class="p-2.5">Email</th>' +
'              <th class="p-2.5 text-center">JM</th>' +
'              <th class="p-2.5 text-center">Aksi</th>' +
'            </tr>' +
'          </thead>' +
'          <tbody id="tbodyUser" class="divide-y divide-slate-100">' +
'            <tr><td colspan="9" class="text-center py-6 text-slate-400 font-bold">Memuat akun pengguna...</td></tr>' +
'          </tbody>' +
'        </table>' +
'      </div>' +
'    </div>' +
'  </div>' +
'  <script>' +
'    let listUsers = [];' +
'    window.onload = function() { handleRoleChange(); muatUser(); };' +
'    function togglePassVisibility() { const inp = document.getElementById("inPassword"); inp.type = inp.type === "password" ? "text" : "password"; }' +
'    function handleRoleChange() {' +
'      const role = document.getElementById("inRole").value;' +
'      const wrap = document.getElementById("wrapJM");' +
'      const jmInput = document.getElementById("inPersenJM");' +
'      if (role.toLowerCase().includes("dokter")) {' +
'        wrap.classList.remove("hidden");' +
'        if (role.includes("Spesialis")) jmInput.value = "50";' +
'        else if (role.includes("Umum")) jmInput.value = "40";' +
'      } else { wrap.classList.add("hidden"); }' +
'    }' +
'    function muatUser() {' +
'      const tbody = document.getElementById("tbodyUser");' +
'      tbody.innerHTML = "<tr><td colspan=\'9\' class=\'text-center py-6 text-slate-400 font-bold\'>Memuat dari spreadsheet...</td></tr>";' +
'      google.script.run' +
'        .withSuccessHandler(function(res) { listUsers = res || []; renderTabel(); })' +
'        .withFailureHandler(function(err) { tbody.innerHTML = "<tr><td colspan=\'9\' class=\'text-center py-6 text-rose-500 font-bold\'>Gagal: " + (err.message || err) + "</td></tr>"; })' +
'        .getDaftarUserMaster();' +
'    }' +
'    function renderTabel() {' +
'      const tbody = document.getElementById("tbodyUser");' +
'      const q = (document.getElementById("inCari").value || "").toLowerCase().trim();' +
'      let filtered = listUsers.filter(function(u) {' +
'        if (!q) return true;' +
'        return (u.nama || "").toLowerCase().indexOf(q) !== -1 || (u.username || "").toLowerCase().indexOf(q) !== -1 || (u.role || "").toLowerCase().indexOf(q) !== -1 || (u.email || "").toLowerCase().indexOf(q) !== -1;' +
'      });' +
'      if (filtered.length === 0) { tbody.innerHTML = "<tr><td colspan=\'9\' class=\'text-center py-6 text-slate-400 font-bold\'>Tidak ada data.</td></tr>"; return; }' +
'      tbody.innerHTML = filtered.map(function(u) {' +
'        let badgeColor = "bg-slate-100 text-slate-700";' +
'        let rLow = (u.role || "").toLowerCase();' +
'        if (rLow === "super user" || rLow === "owner") badgeColor = "bg-purple-100 text-purple-700 font-bold";' +
'        else if (rLow.indexOf("dokter") !== -1) badgeColor = "bg-blue-100 text-blue-700 font-bold";' +
'        else if (rLow.indexOf("perawat") !== -1) badgeColor = "bg-teal-100 text-teal-700 font-bold";' +
'        else if (rLow.indexOf("admin") !== -1) badgeColor = "bg-amber-100 text-amber-700 font-bold";' +
'        let isAktif = (u.status === "Aktif" || !u.status);' +
'        let statusColor = isAktif ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";' +
'        let jmVal = (u.persenJM ? (Number(u.persenJM) <= 1 ? Math.round(Number(u.persenJM) * 100) : Number(u.persenJM)) : 0) + "%";' +
'        if (rLow.indexOf("dokter") === -1) jmVal = "-";' +
'        let safeUser = String(u.username).replace(/\'/g, "\\\\\'");' +
'        let btnAktif = !isAktif ? "<button type=\'button\' onclick=\'aktifkanUser(\\\"" + safeUser + "\\\")\' class=\'px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold\'>✅ Aktifkan</button>" : "";' +
'        return "<tr class=\'hover:bg-slate-50 transition-colors\'>" +' +
'          "<td class=\'p-2.5 font-bold text-slate-800\'>" + (u.nama || "-") + "</td>" +' +
'          "<td class=\'p-2.5 font-mono text-slate-600\'>" + (u.username || "-") + "</td>" +' +
'          "<td class=\'p-2.5\'><span class=\'px-2 py-0.5 rounded text-[11px] " + badgeColor + "\'>" + (u.role || "-") + "</span></td>" +' +
'          "<td class=\'p-2.5 text-center\'><span class=\'px-2 py-0.5 rounded text-[10px] font-bold " + statusColor + "\'>" + (u.status || "Aktif") + "</span></td>" +' +
'          "<td class=\'p-2.5 text-slate-500 text-[11px]\'>" + (u.noReg || "-") + "</td>" +' +
'          "<td class=\'p-2.5 text-slate-500 text-[11px]\'>" + (u.noHp || "-") + "</td>" +' +
'          "<td class=\'p-2.5 text-slate-500 text-[11px]\'>" + (u.email || "-") + "</td>" +' +
'          "<td class=\'p-2.5 text-center font-bold text-amber-800 text-[11px]\'>" + jmVal + "</td>" +' +
'          "<td class=\'p-2.5 text-center\'>" +' +
'            "<div class=\'flex items-center justify-center gap-1\'>" +' +
'              btnAktif +' +
'              "<button type=\'button\' onclick=\'editUser(\\\"" + safeUser + "\\\")\' class=\'px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold\'>✏️ Edit</button>" +' +
'              "<button type=\'button\' onclick=\'hapusUser(\\\"" + safeUser + "\\\")\' class=\'px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[11px] font-bold\'>🗑️ Nonaktif</button>" +' +
'            "</div>" +' +
'          "</td>" +' +
'        "</tr>";' +
'      }).join("");' +
'    }' +
'    function simpanUser(e) {' +
'      if (e) e.preventDefault();' +
'      const btn = document.getElementById("btnSubmit");' +
'      const alertEl = document.getElementById("formAlert");' +
'      const origHtml = btn.innerHTML;' +
'      const payload = {' +
'        mode: document.getElementById("formMode").value,' +
'        nama: document.getElementById("inNama").value.trim(),' +
'        username: document.getElementById("inUsername").value.trim(),' +
'        role: document.getElementById("inRole").value,' +
'        password: document.getElementById("inPassword").value.trim(),' +
'        status: document.getElementById("inStatus").value,' +
'        noReg: document.getElementById("inNoReg").value.trim(),' +
'        noHp: document.getElementById("inNoHp").value.trim(),' +
'        email: document.getElementById("inEmail").value.trim(),' +
'        persenJM: Number(document.getElementById("inPersenJM").value) || 0' +
'      };' +
'      if (!payload.nama || !payload.username) {' +
'        alertEl.className = "text-xs font-bold text-rose-500";' +
'        alertEl.innerText = "Nama dan username wajib diisi!";' +
'        return;' +
'      }' +
'      if (payload.mode === "tambah" && (!payload.password || payload.password.length < 4)) {' +
'        alertEl.className = "text-xs font-bold text-rose-500";' +
'        alertEl.innerText = "Password minimal 4 karakter!";' +
'        return;' +
'      }' +
'      btn.disabled = true;' +
'      btn.innerHTML = "⏳ Menyimpan...";' +
'      alertEl.innerText = "";' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = origHtml;' +
'          if (res && res.success) {' +
'            alertEl.className = "text-xs font-bold text-emerald-600";' +
'            alertEl.innerText = res.message || "Berhasil disimpan!";' +
'            batalEditUser();' +
'            muatUser();' +
'            setTimeout(function() { alertEl.innerText = ""; }, 3000);' +
'          } else {' +
'            alertEl.className = "text-xs font-bold text-rose-500";' +
'            alertEl.innerText = (res && res.message) ? res.message : "Gagal simpan.";' +
'          }' +
'        })' +
'        .withFailureHandler(function(err) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = origHtml;' +
'          alertEl.className = "text-xs font-bold text-rose-500";' +
'          alertEl.innerText = "Error: " + (err.message || err);' +
'        })' +
'        .simpanUserMaster(payload);' +
'    }' +
'    function editUser(username) {' +
'      const u = listUsers.find(function(item) { return item.username.toLowerCase() === username.toLowerCase(); });' +
'      if (!u) return;' +
'      document.getElementById("formMode").value = "edit";' +
'      document.getElementById("origUsername").value = u.username;' +
'      document.getElementById("inNama").value = u.nama || "";' +
'      const uInp = document.getElementById("inUsername");' +
'      uInp.value = u.username || "";' +
'      uInp.readOnly = true;' +
'      uInp.classList.add("bg-slate-200");' +
'      let roleSel = document.getElementById("inRole");' +
'      roleSel.value = u.role || "Staff";' +
'      document.getElementById("inStatus").value = u.status || "Aktif";' +
'      document.getElementById("inNoReg").value = u.noReg === "-" ? "" : (u.noReg || "");' +
'      document.getElementById("inNoHp").value = u.noHp || "";' +
'      document.getElementById("inEmail").value = u.email || "";' +
'      let pct = u.persenJM ? Number(u.persenJM) : 0;' +
'      if (pct <= 1 && pct > 0) pct = Math.round(pct * 100);' +
'      document.getElementById("inPersenJM").value = pct;' +
'      const pInp = document.getElementById("inPassword");' +
'      pInp.value = "";' +
'      pInp.required = false;' +
'      document.getElementById("lblPassWajib").innerText = "(opsional)";' +
'      document.getElementById("hintPass").classList.remove("hidden");' +
'      document.getElementById("btnBatalEdit").classList.remove("hidden");' +
'      document.getElementById("btnSubmit").innerHTML = "<span>💾</span> Perbarui Pengguna";' +
'      handleRoleChange();' +
'      window.scrollTo({ top: 0, behavior: "smooth" });' +
'    }' +
'    function batalEditUser() {' +
'      document.getElementById("formMode").value = "tambah";' +
'      document.getElementById("origUsername").value = "";' +
'      document.getElementById("formUserMaster").reset();' +
'      const uInp = document.getElementById("inUsername");' +
'      uInp.readOnly = false;' +
'      uInp.classList.remove("bg-slate-200");' +
'      const pInp = document.getElementById("inPassword");' +
'      pInp.required = true;' +
'      document.getElementById("lblPassWajib").innerText = "*";' +
'      document.getElementById("hintPass").classList.add("hidden");' +
'      document.getElementById("btnBatalEdit").classList.add("hidden");' +
'      document.getElementById("btnSubmit").innerHTML = "<span>💾</span> Simpan Pengguna";' +
'      handleRoleChange();' +
'    }' +
'    function aktifkanUser(username) {' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          if (res && res.success) { muatUser(); } else { alert(res ? res.message : "Gagal aktifkan"); }' +
'        })' +
'        .aktifkanUserMaster(username, "Super Admin");' +
'    }' +
'    function hapusUser(username) {' +
'      if (!confirm("Yakin ingin menonaktifkan pengguna \'" + username + "\'?")) return;' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          if (res && res.success) { muatUser(); } else { alert(res ? res.message : "Gagal nonaktifkan"); }' +
'        })' +
'        .hapusUserMaster(username, false);' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

function getKategoriTindakan() {
  try {
    const idSpreadsheet = DB_CONFIG.DATABASE;
    const v = readFast(idSpreadsheet, "Kategori");
    if (v.length <= 1) return [];
    let h = v[0];
    let idxNama = getColIdx(h, ['kategori', 'nama', 'namakategori']); if (idxNama === -1) idxNama = 0;
    let idxKode = getColIdx(h, ['kode', 'kodekategori']); if (idxKode === -1) idxKode = 1;

    let result = [];
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idxNama]).trim() !== "") {
        result.push({
          kategori: String(v[i][idxNama]).trim(),
          kode: idxKode !== -1 ? String(v[i][idxKode]).trim() : String(v[i][idxNama]).substring(0, 3).toUpperCase()
        });
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getDaftarTindakanLengkap() {
  try {
    const idTindakan = DB_CONFIG.DATABASE;
    const v = readFast(idTindakan, "Tindakan"); if (v.length <= 1) return [];
    let h = v[0];
    let idC = getColIdx(h, ['kode', 'kodetindakan', 'kode_tindakan']); if (idC === -1) idC = 0;
    let idN = getColIdx(h, ['tindakan', 'namatindakan', 'nama', 'nama_tindakan']); if (idN === -1) idN = 1;
    let idK = getColIdx(h, ['kategori', 'role']); if (idK === -1) idK = 2;
    let idH = getColIdx(h, ['tarif', 'harga', 'hargajual']); if (idH === -1) idH = 3;
    let idLab = getColIdx(h, ['labor', 'perlu_lab', 'perlulab', 'lab']);
    let idJM = getColIdx(h, ['persen_jm_default', 'persenjmdefault', 'persen_jm', 'jm_default']);

    return v.slice(1).filter(r => r[idN]).map(r => ({
      kode: idC !== -1 ? String(r[idC]).trim() : "",
      nama: String(r[idN]).trim(),
      kategori: r[idK] ? String(r[idK]).trim() : "Umum",
      harga: parseHarga(r[idH] || 0),
      perluLab: (idLab !== -1 && r[idLab]) ? (String(r[idLab]).trim().toLowerCase() === 'ya' ? 'Ya' : 'Tidak') : 'Tidak',
      persenJMDefault: (idJM !== -1 && r[idJM] !== "" && r[idJM] !== null && r[idJM] !== undefined) ? Number(r[idJM]) : null
    }));
  } catch (e) {
    return [];
  }
}

function simpanTindakanBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    const idTindakan = DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idTindakan, "Tindakan");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Kode_Tindakan', 'Nama_Tindakan', 'Kategori', 'Tarif', 'Labor']);
    }
    
    let v = sheet.getDataRange().getValues();
    let h = v[0];
    let idC = getColIdx(h, ['kode', 'kodetindakan', 'kode_tindakan']);
    let idN = getColIdx(h, ['tindakan', 'namatindakan', 'nama', 'nama_tindakan']);
    let idK = getColIdx(h, ['kategori', 'role']);
    let idH = getColIdx(h, ['tarif', 'harga', 'hargajual']);
    let idLab = getColIdx(h, ['labor', 'perlu_lab', 'perlulab', 'lab']);
    
    // Pastikan header Labor ada jika belum ada di sheet
    if (idLab === -1) {
      sheet.getRange(1, h.length + 1).setValue("Labor");
      idLab = h.length;
      h.push("Labor");
    }
    
    let newRow = new Array(h.length).fill("");
    if (idC !== -1) newRow[idC] = payload.kode; else newRow[0] = payload.kode;
    if (idN !== -1) newRow[idN] = payload.nama; else newRow[1] = payload.nama;
    if (idK !== -1) newRow[idK] = payload.kategori; else newRow[2] = payload.kategori;
    if (idH !== -1) newRow[idH] = payload.tarif; else newRow[3] = payload.tarif;
    if (idLab !== -1) newRow[idLab] = payload.perluLab === 'Ya' ? 'Ya' : 'Tidak';

    sheet.appendRow(newRow);
    catatLog("Tambah Tindakan", "Menambah tindakan baru: " + payload.nama + " (Kode: " + payload.kode + ", Lab: " + (payload.perluLab || 'Tidak') + ")", payload.currentUser);
    
    return { success: true, message: "Tindakan berhasil disimpan di Database Master!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function updateTindakan(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    const idTindakan = DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idTindakan, "Tindakan");
    let v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: false, message: "Database tindakan kosong." };

    let h = v[0];
    let idC = getColIdx(h, ['kode', 'kodetindakan', 'kode_tindakan']); if (idC === -1) idC = 0;
    let idN = getColIdx(h, ['tindakan', 'namatindakan', 'nama', 'nama_tindakan']); if (idN === -1) idN = 1;
    let idK = getColIdx(h, ['kategori', 'role']); if (idK === -1) idK = 2;
    let idH = getColIdx(h, ['tarif', 'harga', 'hargajual']); if (idH === -1) idH = 3;
    let idLab = getColIdx(h, ['labor', 'perlu_lab', 'perlulab', 'lab']);

    if (idLab === -1) {
      sheet.getRange(1, h.length + 1).setValue("Labor");
      idLab = h.length;
      h.push("Labor");
    }

    let targetRow = -1;
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idC]).trim() === String(payload.kode).trim()) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "Tindakan dengan kode " + payload.kode + " tidak ditemukan." };
    }

    sheet.getRange(targetRow, idN + 1).setValue(payload.nama);
    sheet.getRange(targetRow, idK + 1).setValue(payload.kategori);
    sheet.getRange(targetRow, idH + 1).setValue(payload.tarif);
    sheet.getRange(targetRow, idLab + 1).setValue(payload.perluLab === 'Ya' ? 'Ya' : 'Tidak');

    catatLog("Update Tindakan", "Mengubah data tindakan: " + payload.nama + " (Kode: " + payload.kode + ")", payload.currentUser);
    return { success: true, message: "Data tindakan berhasil diperbarui!" };
  } catch (e) {
    return { success: false, message: "Gagal memperbarui: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function hapusTindakan(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    const idTindakan = DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idTindakan, "Tindakan");
    let v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: false, message: "Database tindakan kosong." };

    let h = v[0];
    let idC = getColIdx(h, ['kode', 'kodetindakan', 'kode_tindakan']); if (idC === -1) idC = 0;
    let idN = getColIdx(h, ['tindakan', 'namatindakan', 'nama', 'nama_tindakan']); if (idN === -1) idN = 1;

    let targetRow = -1;
    let targetNama = "";
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idC]).trim() === String(payload.kode).trim()) {
        targetRow = i + 1;
        targetNama = String(v[i][idN] || "");
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "Tindakan dengan kode " + payload.kode + " tidak ditemukan." };
    }

    sheet.deleteRow(targetRow);
    catatLog("Hapus Tindakan", "Menghapus tindakan: " + targetNama + " (Kode: " + payload.kode + ")", payload.currentUser);
    return { success: true, message: "Tindakan " + targetNama + " berhasil dihapus dari Database!" };
  } catch (e) {
    return { success: false, message: "Gagal menghapus: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function getTarifKhususDokter() {
  try {
    const idTindakan = DB_CONFIG.DATABASE;
    const v = readFast(idTindakan, "Tarif_Khusus_Dokter");
    if (!v || v.length <= 1) return [];
    let h = v[0];
    let idDok = getColIdx(h, ['namadokter', 'dokter', 'nama_dokter']);
    let idC = getColIdx(h, ['kodetindakan', 'kode', 'kode_tindakan']);
    let idN = getColIdx(h, ['namatindakan', 'tindakan', 'nama_tindakan']);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persenjm', 'persen_jm']);

    return v.slice(1).filter(r => r[idDok] && r[idJM] !== "").map(r => ({
      dokter: String(r[idDok]).trim(),
      kode: idC !== -1 ? String(r[idC]).trim() : "",
      nama: idN !== -1 ? String(r[idN]).trim() : "",
      persenJM: Number(r[idJM])
    }));
  } catch (e) {
    return [];
  }
}

function simpanObatBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    const idObat = DB_CONFIG.OBAT;
    const sheet = getSheetEksternal(idObat, "Master_Obat");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_Obat', 'Nama_Obat', 'Kandungan_Obat', 'Satuan_Beli', 'Isi_Per_Satuan',
        'Harga_Beli_Satuan', 'HPP_Pcs', 'Margin_Persen', 'Harga_Jual',
        'Stock_Tersedia', 'Stock_Minimum', 'Terjual', 'Status_Stok', 'Nilai_Persediaan'
      ]);
    }
    
    let v = sheet.getDataRange().getValues();
    let h = v[0];
    let idK = getColIdx(h, ['id_obat', 'idobat', 'kode_item', 'kodeitem', 'kode']);
    let idN = getColIdx(h, ['nama_obat', 'namaobat', 'nama']);
    let idKand = getColIdx(h, ['kandungan_obat', 'kandungan', 'komposisi', 'zat_aktif']);
    let idSatBeli = getColIdx(h, ['satuan_beli', 'satuanbeli']);
    let idIsi = getColIdx(h, ['isi_per_satuan', 'isi_persatuan', 'isi']);
    let idHrgBeli = getColIdx(h, ['harga_beli_satuan', 'hargabelisatuan', 'harga_beli']);
    let idHPP = getColIdx(h, ['hpp_pcs', 'hpppcs', 'hpp']);
    let idMargin = getColIdx(h, ['margin_persen', 'margin']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']);
    let idStk = getColIdx(h, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stock_minimum', 'stockminimum', 'stok_minimum', 'kritis', 'stokmin']);
    let idTerjual = getColIdx(h, ['terjual', 'total_terjual', 'totalterjual']);
    let idExp = getColIdx(h, ['tanggal_kadaluarsa', 'expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);
    let idS = getColIdx(h, ['satuan']);

    let isiVal = parseFloat(payload.isiPerSatuan) || 1;
    let satBeliVal = payload.satuanBeli || payload.satuan || "Box";
    let hppVal = parseHarga(payload.hpp || 0);
    let hrgBeliVal = parseHarga(payload.hargaBeliSatuan || (hppVal * isiVal));
    let hjVal = parseHarga(payload.hargaJual || 0);
    let marginVal = payload.margin ? (payload.margin.toString().includes('%') ? payload.margin : payload.margin + '%') : (hppVal > 0 ? Math.round(((hjVal - hppVal) / hppVal) * 100) + '%' : '0%');

    let newRow = new Array(h.length).fill("");
    if (idK !== -1) newRow[idK] = payload.kode; else newRow[0] = payload.kode;
    if (idN !== -1) newRow[idN] = payload.nama; else newRow[1] = payload.nama;
    if (idKand !== -1) newRow[idKand] = payload.kandungan || "-";
    if (idSatBeli !== -1) newRow[idSatBeli] = satBeliVal;
    if (idIsi !== -1) newRow[idIsi] = isiVal;
    if (idHrgBeli !== -1) newRow[idHrgBeli] = hrgBeliVal;
    if (idHPP !== -1) newRow[idHPP] = hppVal;
    if (idMargin !== -1) newRow[idMargin] = marginVal;
    if (idH !== -1) newRow[idH] = hjVal;
    if (idStk !== -1) newRow[idStk] = parseFloat(payload.stok) || 0;
    if (idMin !== -1) newRow[idMin] = parseFloat(payload.stokMin) || 10;
    if (idTerjual !== -1) newRow[idTerjual] = 0;
    if (idS !== -1) newRow[idS] = payload.satuan || "Tablet";
    if (idExp !== -1) newRow[idExp] = payload.expired || "";
    if (idSup !== -1) newRow[idSup] = payload.supplier || "";

    sheet.appendRow(newRow);
    catatLog("Master Obat", "Tambah item obat: " + payload.nama + " (ID: " + payload.kode + ")", payload.currentUser);
    
    return { success: true, message: "Obat berhasil disimpan di Database Master!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan obat: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanBmhpBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    const idBmhp = DB_CONFIG.BMHP;
    const sheet = getSheetEksternal(idBmhp, "Master_BMHP");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Kode_Item', 'Nama_Barang', 'Satuan', 'HPP', 'Harga_Jual', 'Stok_Tersedia', 'Stok_Minimum', 'Total_Terjual', 'Expired_Date', 'Supplier']);
    }
    
    let v = sheet.getDataRange().getValues();
    let h = v[0];
    let idK = getColIdx(h, ['kode_item', 'kodeitem', 'kode']);
    let idN = getColIdx(h, ['nama_barang', 'namabarang', 'nama']);
    let idS = getColIdx(h, ['satuan']);
    let idHPP = getColIdx(h, ['hpp']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']);
    let idStk = getColIdx(h, ['stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stok_minimum', 'kritis', 'stokmin']);
    let idTerjual = getColIdx(h, ['total_terjual', 'terjual']);
    let idExp = getColIdx(h, ['expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);
    
    let newRow = new Array(h.length).fill("");
    if (idK !== -1) newRow[idK] = payload.kode; else newRow[0] = payload.kode;
    if (idN !== -1) newRow[idN] = payload.nama; else newRow[1] = payload.nama;
    if (idS !== -1) newRow[idS] = payload.satuan; else newRow[2] = payload.satuan;
    if (idHPP !== -1) newRow[idHPP] = parseHarga(payload.hpp); else newRow[3] = parseHarga(payload.hpp);
    if (idH !== -1) newRow[idH] = parseHarga(payload.hargaJual); else newRow[4] = parseHarga(payload.hargaJual);
    if (idStk !== -1) newRow[idStk] = parseFloat(payload.stok) || 0; else newRow[5] = parseFloat(payload.stok) || 0;
    if (idMin !== -1) newRow[idMin] = parseFloat(payload.stokMin) || 0; else newRow[6] = parseFloat(payload.stokMin) || 0;
    if (idTerjual !== -1) newRow[idTerjual] = 0;
    if (idExp !== -1) newRow[idExp] = payload.expired || "";
    if (idSup !== -1) newRow[idSup] = payload.supplier || "";

    sheet.appendRow(newRow);
    catatLog("Master BMHP", "Tambah item BMHP: " + payload.nama + " (Kode: " + payload.kode + ")", payload.currentUser);
    
    return { success: true, message: "BMHP berhasil disimpan di Database Master!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan BMHP: " + e.message };
  } finally {
    lock.releaseLock();
  }
}



// >>>>>>>>>>>>>>> MODULE: 08_Surat.gs <<<<<<<<<<<<<<<
// =========================================================================
// FUNGSI SURAT & FORMULIR KLINIS (SKS, SKP, RSM, SRP, LAB, RAD)
// =========================================================================

function initSheetSurat(namaSheet, headers) {
  const ss = SpreadsheetApp.openById(DB_CONFIG.SURAT.trim());
  let sheet = ss.getSheetByName(namaSheet);
  if (!sheet) {
    sheet = ss.insertSheet(namaSheet);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function getBulanRomawiSvr(bulanAngka) {
  const romawi = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romawi[parseInt(bulanAngka, 10)] || "";
}

function getSemuaRiwayatSurat() {
  try {
    let hasil = [];
    const ss = SpreadsheetApp.openById(DB_CONFIG.SURAT.trim());
    const configSurat = [
      { sheet: "Surat_Sakit", jenis: "SKS" },
      { sheet: "Surat_Kontrol", jenis: "SKP" },
      { sheet: "Resume_Medis", jenis: "RSM" },
      { sheet: "Surat_Rujukan", jenis: "SRP" },
      { sheet: "Surat_Lab", jenis: "LAB" },
      { sheet: "Surat_Radiologi", jenis: "RAD" }
    ];

    for (let config of configSurat) {
      try {
        let sheet = ss.getSheetByName(config.sheet);
        if (sheet && sheet.getLastRow() > 1) {
          let v = sheet.getDataRange().getValues();
          let h = v[0];
          let iNo = getColIdx(h, ['nosurat', 'no_surat']);
          let iTgl = getColIdx(h, ['tglcetak', 'tgl_cetak', 'tanggal']);
          let iNm = getColIdx(h, ['namapasien', 'nama_pasien', 'nama']);
          let iDok = getColIdx(h, ['dokter', 'dokterpemeriksa']);

          if (iNo === -1) continue;

          for (let i = 1; i < v.length; i++) {
            if (!v[i][iNo]) continue;
            hasil.push({
              jenisSurat: config.jenis,
              noSurat: String(v[i][iNo]).trim(),
              tglCetak: iTgl !== -1 && v[i][iTgl] ? fDate(v[i][iTgl]) : "-",
              namaPasien: iNm !== -1 && v[i][iNm] ? String(v[i][iNm]).trim() : "-",
              dokter: iDok !== -1 && v[i][iDok] ? String(v[i][iDok]).trim() : "-"
            });
          }
        }
      } catch (err) {}
    }

    return hasil.sort((a, b) => {
      let dateA = new Date(a.tglCetak).getTime() || 0;
      let dateB = new Date(b.tglCetak).getTime() || 0;
      return dateB - dateA;
    });
  } catch (e) {
    return [];
  }
}

function simpanSuratSakit(p) {
  let lama = parseInt(p.lamaHari, 10);
  if (isNaN(lama) || lama < 1) {
    return { success: false, message: "Lama istirahat tidak valid (minimal 1 hari)." };
  }
  if (lama > 5) {
    return { success: false, message: "Lama istirahat ditolak! Maksimal lama istirahat adalah 5 hari." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Surat_Sakit", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak',
      'Lama_Hari', 'Tgl_Mulai', 'Tgl_Selesai', 'Dokter', 'Waktu_Sistem', 'Pembuat'
    ]);
    
    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "SKS/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, fDate(d),
      p.lamaHari, p.tglMulai, p.tglSelesai, p.dokter, d, p.currentUser
    ]);

    catatLog("Surat Sakit", "Menerbitkan SKS (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanSuratKontrol(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Surat_Kontrol", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak',
      'Diagnosis', 'Tindakan', 'Tgl_Kontrol', 'Dokter_Tujuan', 'Alasan', 'Waktu_Sistem', 'Pembuat'
    ]);

    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "SKP/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, fDate(d),
      p.diagnosis, p.tindakan, p.tglKontrol, p.dokterTujuan, p.alasanKontrol, d, p.currentUser
    ]);

    catatLog("Surat Kontrol", "Menerbitkan SKP (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanResumeMedis(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Resume_Medis", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak', 'Tgl_Kunjungan',
      'Anamnesis', 'Penunjang', 'Diagnosis', 'Tindakan', 'Obat', 'Hasil', 'Keperluan', 'Dokter', 'Waktu_Sistem', 'Pembuat'
    ]);

    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "RMP/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, fDate(d), p.tglKunjungan,
      p.ringkasanKlinis, p.pemeriksaanPenunjang, p.diagnosisKerja, p.tindakanMedis,
      p.medikamentosa, p.hasilPerawatan, p.keperluan, p.dokter, d, p.currentUser
    ]);

    catatLog("Resume Medis", "Menerbitkan RSM (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanSuratRujukan(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Surat_Rujukan", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak',
      'Tujuan', 'Anamnesa', 'Fisik', 'Diagnosis', 'Terapi', 'Dokter', 'Waktu_Sistem', 'Pembuat'
    ]);

    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "SRP/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, p.tglCetakOri || fDate(d),
      p.tujuan, p.anamnesa, p.fisik, p.diagnosis, p.terapi, p.dokter, d, p.currentUser
    ]);

    catatLog("Surat Rujukan", "Menerbitkan SRP (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanSuratLab(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Surat_Lab", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak',
      'Tujuan', 'Diagnosis', 'Pemeriksaan', 'Dokter', 'Waktu_Sistem', 'Pembuat'
    ]);

    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "SPL/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, p.tglCetakOri || fDate(d),
      p.tujuan, p.diagnosis, p.pemeriksaan, p.dokter, d, p.currentUser
    ]);

    catatLog("Pengantar Lab", "Menerbitkan LAB (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanSuratRadiologi(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = initSheetSurat("Surat_Radiologi", [
      'ID_Pasien', 'No_RM', 'Nama_Pasien', 'No_Surat', 'Tgl_Cetak',
      'Tujuan', 'Diagnosis', 'Pemeriksaan', 'Dokter', 'Waktu_Sistem', 'Pembuat'
    ]);

    let d = new Date();
    let bln = ("0" + (d.getMonth() + 1)).slice(-2);
    let blnRomawi = getBulanRomawiSvr(bln);
    let thn = d.getFullYear().toString();
    let nextNum = sheet.getLastRow();
    let noSurat = "SPR/SHELDON/" + ("000" + nextNum).slice(-3) + "/" + blnRomawi + "-" + thn;

    sheet.appendRow([
      p.idPasien, p.noRm, p.namaPasien, noSurat, p.tglCetakOri || fDate(d),
      p.tujuan, p.diagnosis, p.pemeriksaan, p.dokter, d, p.currentUser
    ]);

    catatLog("Pengantar Radiologi", "Menerbitkan RAD (" + noSurat + ") untuk: " + p.namaPasien, p.currentUser);
    return { success: true, noSurat: noSurat };
  } catch (e) {
    return { success: false, message: e.message };
  } finally {
    lock.releaseLock();
  }
}


// >>>>>>>>>>>>>>> MODULE: 09_AIInsights.gs <<<<<<<<<<<<<<<
// =========================================================================
// AI INSIGHTS & CLINICAL ANALYTICS ENGINE
// =========================================================================

function getAIInsightsData(userRole, token) {
  try {
    if (token) {
      let auth = verifikasiSesi(token);
      if (auth.valid && auth.user && auth.user.role) {
        userRole = auth.user.role;
      }
    }
    let roleStr = String(userRole || "").toLowerCase();
    let isDoctor = roleStr.includes("dokter") && !roleStr.includes("super");

    const listPasien = getDaftarPasien();
    const listEMR = getDaftarRekamMedis();
    const listPembayaran = getDaftarPembayaran();
    const listInventory = getMasterInventory();
    const listTindakanMaster = getDaftarTindakanLengkap();

    // -------------------------------------------------------------------------
    // 1. DATA DASAR FINANSIAL & OPERASIONAL (UNTUK SUPER USER)
    // -------------------------------------------------------------------------
    let totalPasien = listPasien.length;
    let pendapatanBulanIni = 0;
    let totalPendapatanAll = 0;
    let invoiceCounted = {};
    let countTrx = 0;

    // Hitung Hari Sibuk & Heatmap Jam Kunjungan
    let dayCount = { "Senin": 0, "Selasa": 0, "Rabu": 0, "Kamis": 0, "Jumat": 0, "Sabtu": 0, "Minggu": 0 };
    let dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let hourHeatmap = { "Pagi (08:00 - 11:59)": 0, "Siang (12:00 - 15:59)": 0, "Sore-Malam (16:00 - 20:00)": 0 };

    let countDokter = {};
    let countTindakan = {};
    let countObat = {};
    let tindakanRevenueMap = {};

    let now = new Date();
    let currYear = now.getFullYear();
    let currMonth = now.getMonth(); // 0-indexed

    // Pendapatan mingguan untuk Forecasting
    let revenueWeekly = [0, 0, 0, 0];

    listPembayaran.forEach(p => {
      let invId = p.idInvoice || Math.random();
      let itemTotal = parseHarga(p.totalInvoice || p.grandTotalItem || 0);

      if (!invoiceCounted[invId]) {
        invoiceCounted[invId] = true;
        totalPendapatanAll += itemTotal;
        countTrx++;

        // Filter bulan berjalan
        if (p.tanggal) {
          let tParts = String(p.tanggal).split(' ')[0].split('-');
          if (tParts.length === 3) {
            let y = parseInt(tParts[0]);
            let m = parseInt(tParts[1]) - 1;
            let d = parseInt(tParts[2]);
            if (y === currYear && m === currMonth) {
              pendapatanBulanIni += itemTotal;
              let weekIdx = Math.min(3, Math.floor((d - 1) / 7));
              revenueWeekly[weekIdx] += itemTotal;
            }
          }
        }
      }

      // Hitung Hari Sibuk & Jam
      if (p.tanggal) {
        let tParts = String(p.tanggal).split(' ')[0].split('-');
        if (tParts.length === 3) {
          let dt = new Date(tParts[0], parseInt(tParts[1]) - 1, tParts[2]);
          if (!isNaN(dt.getTime())) {
            let dayName = dayNames[dt.getDay()];
            dayCount[dayName] = (dayCount[dayName] || 0) + 1;
          }
        }
        // Jam
        let timePart = String(p.tanggal).split(' ')[1];
        if (timePart) {
          let h = parseInt(timePart.split(':')[0]);
          if (h >= 8 && h < 12) hourHeatmap["Pagi (08:00 - 11:59)"]++;
          else if (h >= 12 && h < 16) hourHeatmap["Siang (12:00 - 15:59)"]++;
          else if (h >= 16) hourHeatmap["Sore-Malam (16:00 - 20:00)"]++;
        } else {
          // Default distribution jika tanggal tidak menyertakan jam spesifik
          hourHeatmap["Sore-Malam (16:00 - 20:00)"]++;
        }
      }

      // Count Dokter
      if (p.dokter) {
        countDokter[p.dokter] = (countDokter[p.dokter] || 0) + 1;
      }

      // Count Items & Tindakan Revenue
      if (p.item) {
        let qty = parseInt(p.qty) || 1;
        if (p.kategori === 'Tindakan') {
          countTindakan[p.item] = (countTindakan[p.item] || 0) + qty;
          tindakanRevenueMap[p.item] = (tindakanRevenueMap[p.item] || 0) + parseHarga(p.grandTotalItem || (p.harga * qty) || 0);
        } else if (p.kategori === 'Obat' || p.kategori === 'BMHP') {
          countObat[p.item] = (countObat[p.item] || 0) + qty;
        }
      }
    });

    // Fallback jika pembayaran bulan ini masih 0 (data contoh)
    if (pendapatanBulanIni === 0 && totalPendapatanAll > 0) {
      pendapatanBulanIni = totalPendapatanAll;
    }

    // Hari Paling Sibuk
    let maxDay = "Senin";
    let maxDayVal = 0;
    Object.keys(dayCount).forEach(d => {
      if (dayCount[d] > maxDayVal) {
        maxDayVal = dayCount[d];
        maxDay = d;
      }
    });
    let hariSibukText = maxDayVal > 0 ? maxDay + " (Paling Padat)" : "Normal / Merata";

    // Jam Paling Padat
    let peakHour = "Sore-Malam (16:00 - 20:00)";
    let peakHourVal = -1;
    Object.keys(hourHeatmap).forEach(h => {
      if (hourHeatmap[h] > peakHourVal) {
        peakHourVal = hourHeatmap[h];
        peakHour = h;
      }
    });

    // Forecasting Bulan Depan (Estimasi pertumbuhan konservatif 8-15%)
    let forecastPendapatan = Math.round(pendapatanBulanIni * 1.12);
    if (forecastPendapatan === 0) forecastPendapatan = 15000000;

    // Analisis High-Margin Services (Layanan Paling Menguntungkan)
    let marginServices = [];
    listTindakanMaster.forEach(t => {
      let jmlTerjual = countTindakan[t.nama] || 0;
      let harga = parseHarga(t.harga || 0);
      let estimasiBMHP = Math.round(harga * 0.18); // Estimasi modal BMHP ~18%
      let marginPerItem = harga - estimasiBMHP;
      let totalProfit = marginPerItem * jmlTerjual;
      marginServices.push({
        nama: t.nama,
        kategori: t.kategori || "Umum",
        harga: harga,
        marginPct: Math.round((marginPerItem / (harga || 1)) * 100),
        totalProfit: totalProfit,
        qty: jmlTerjual
      });
    });
    marginServices.sort((a, b) => b.totalProfit - a.totalProfit);
    let topMarginServices = marginServices.slice(0, 4);

    // -------------------------------------------------------------------------
    // 2. LOGISTIK CERDAS & PREDIKSI RESTOCK (UNTUK SUPER USER)
    // -------------------------------------------------------------------------
    // Burn-rate: Hitung konsumsi per hari berdasarkan transaksi
    let burnRatePredictions = [];
    let slowMovingItems = [];
    let expiredAlerts = [];

    listInventory.forEach(item => {
      let qtyKeluar = countObat[item.nama] || 0;
      let stok = parseFloat(item.stok) || 0;
      let avgPerHari = qtyKeluar > 0 ? (qtyKeluar / 30) : 0.5; // Estimasi 30 hari terakhir
      let sisaHari = avgPerHari > 0 ? Math.round(stok / avgPerHari) : 999;

      if (sisaHari <= 14 || stok <= item.kritis) {
        burnRatePredictions.push({
          nama: item.nama,
          satuan: item.satuan,
          stok: stok,
          avgPerHari: avgPerHari.toFixed(1),
          estimasiHariHabis: sisaHari,
          status: sisaHari <= 5 ? "Darurat (Segera Pesan)" : "Kritis"
        });
      } else if (qtyKeluar === 0 && stok > 10) {
        slowMovingItems.push({
          nama: item.nama,
          stok: stok,
          satuan: item.satuan
        });
      }

      // Pengecekan Expired Date
      if (item.expired && item.expired !== "-") {
        let epParts = String(item.expired).split('-');
        if (epParts.length === 3) {
          let expDate = new Date(epParts[0], parseInt(epParts[1]) - 1, epParts[2]);
          let diffDays = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays <= 180 && diffDays > 0) {
            expiredAlerts.push({
              nama: item.nama,
              expired: item.expired,
              sisaBulan: Math.round(diffDays / 30)
            });
          }
        }
      }
    });

    burnRatePredictions.sort((a, b) => a.estimasiHariHabis - b.estimasiHariHabis);

    let notifStokText = "Semua stok obat & BMHP dalam kondisi aman.";
    if (burnRatePredictions.length > 0) {
      let firstBurn = burnRatePredictions[0];
      notifStokText = `🚨 ${firstBurn.nama} diprediksi habis dalam ${firstBurn.estimasiHariHabis} hari (sisa: ${firstBurn.stok} ${firstBurn.satuan}). ${burnRatePredictions.length} item perlu restock.`;
    }

    // -------------------------------------------------------------------------
    // 3. CLINICAL & DENTAL INTELLIGENCE (UNTUK DOKTER & KLINIS)
    // -------------------------------------------------------------------------
    let totalD = 0, totalM = 0, totalF = 0, totalPasienEMR = 0;
    let recallTreatments = []; // Perawatan sementara/saluran akar belum selesai
    let kontraindikasiList = []; // Kontraindikasi penyakit sistemik pasien
    let countPenyakit = {};
    let pasienRecallSet = {};

    listEMR.forEach(emr => {
      totalPasienEMR++;
      let tglPeriksa = emr.tanggalPeriksa || "";
      let diffDaysEMR = 0;
      if (tglPeriksa) {
        let tp = tglPeriksa.split('-');
        if (tp.length === 3) {
          let dtEMR = new Date(tp[0], parseInt(tp[1]) - 1, tp[2]);
          diffDaysEMR = Math.round((now - dtEMR) / (1000 * 60 * 60 * 24));
        }
      }

      // 3a. Parse Odontogram untuk DMF-T & Recall Sementara (Tmp)
      if (emr.odontogramStr) {
        try {
          let odo = JSON.parse(emr.odontogramStr);
          Object.keys(odo).forEach(tNum => {
            let tooth = odo[tNum];
            let gCond = tooth.generalCondition || 'nor';
            let surfs = Object.values(tooth.surfaces || {});

            if (gCond === 'car' || surfs.includes('car')) totalD++;
            else if (gCond === 'mis') totalM++;
            else if (surfs.some(c => ['cfr', 'amf', 'gif'].includes(c))) totalF++;

            // Deteksi tambalan sementara / saluran akar (Tmp)
            if (gCond === 'tmp' || surfs.includes('tmp')) {
              let keyP = emr.idPasien + "_" + tNum;
              if (!pasienRecallSet[keyP]) {
                pasienRecallSet[keyP] = true;
                recallTreatments.push({
                  idPasien: emr.idPasien,
                  namaPasien: emr.namaPasien,
                  noRm: emr.noRm,
                  gigi: tNum,
                  kondisi: "Tambalan Sementara (Tmp) / Perawatan Saluran Akar",
                  tglPemeriksaan: tglPeriksa,
                  selisihHari: diffDaysEMR > 0 ? diffDaysEMR : 14,
                  statusRecall: diffDaysEMR >= 14 ? "Perlu Ditindaklanjuti Segera" : "Dalam Pemantauan"
                });
              }
            }
          });
        } catch (e) {}
      }

      // 3b. Anamnesis: ICD-10 & Kontraindikasi Penyakit Sistemik
      if (emr.anamnesisStr) {
        try {
          let anaObj = JSON.parse(emr.anamnesisStr);
          // Diagnosa ICD-10
          if (anaObj.diagnosaICD && Array.isArray(anaObj.diagnosaICD)) {
            anaObj.diagnosaICD.forEach(diag => {
              let cleanDiag = String(diag).replace(/^[A-Z0-9.]+\s*-\s*/i, '').trim();
              if (cleanDiag) {
                countPenyakit[cleanDiag] = (countPenyakit[cleanDiag] || 0) + 1;
              }
            });
          }

          // Deteksi Kontraindikasi Penyakit Sistemik
          let rwPenyakit = (anaObj.riwayatPenyakit || "").toLowerCase();
          let alergi = (anaObj.alergi || "").toLowerCase();

          if (rwPenyakit.includes('hipertensi') || rwPenyakit.includes('darah tinggi')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Hipertensi",
              peringatan: "Hindari anestesi lokal vasokonstriktor konsentrasi tinggi (Adrenalin/Epinefrin berlebih). Monitor tekanan darah sebelum bedah/ekstraksi."
            });
          } else if (rwPenyakit.includes('diabetes') || rwPenyakit.includes('gula')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Diabetes Mellitus",
              peringatan: "Risiko penyembuhan luka lambat & infeksi pasca ekstraksi. Pertimbangkan profilaksis antibiotik & cek GDS."
            });
          } else if (rwPenyakit.includes('jantung') || rwPenyakit.includes('antikoagulan') || rwPenyakit.includes('aspilet')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Kelainan Jantung / Konsumsi Pengencer Darah",
              peringatan: "Risiko perdarahan masif (prolonged bleeding). Wajib hemostatik lokal & konsultasi dokter Sp.JP."
            });
          }

          if (alergi && alergi !== 'tidak ada' && alergi !== '-' && alergi !== 'none') {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Alergi: " + anaObj.alergi,
              peringatan: "Pastikan resep obat tidak mengandung golongan alergen (misal: Penisilin / Amoksisilin / NSAID)."
            });
          }
        } catch (e) {}
      }
    });

    // Hitung Rasio DMF-T Rata-Rata Komunitas Pasien
    let pembagiEMR = totalPasienEMR > 0 ? totalPasienEMR : 1;
    let avgD = (totalD / pembagiEMR).toFixed(1);
    let avgM = (totalM / pembagiEMR).toFixed(1);
    let avgF = (totalF / pembagiEMR).toFixed(1);
    let avgDMFT = ((totalD + totalM + totalF) / pembagiEMR).toFixed(1);

    let statusKesehatanKomunitas = "Status Karies Sedang (DMF-T: " + avgDMFT + "). Prioritaskan edukasi menyikat gigi & aplikasi fluor/sealant.";
    if (parseFloat(avgDMFT) > 5.0) {
      statusKesehatanKomunitas = "Indeks Karies Tinggi (DMF-T: " + avgDMFT + "). Tingkat karies dan kehilangan gigi aktif mendominasi, rekomendasikan program restorasi preventif.";
    } else if (parseFloat(avgDMFT) < 2.5) {
      statusKesehatanKomunitas = "Status Kesehatan Gigi Komunitas Prima (DMF-T: " + avgDMFT + "). Pertahankan dengan recall rutin 6 bulan.";
    }

    // Helper Sorted Arr
    const mapToSortedArr = (mapObj, keyNama = "nama", keyJml = "jumlah") => {
      return Object.keys(mapObj)
        .map(k => {
          let item = {};
          item[keyNama] = k;
          item[keyJml] = mapObj[k];
          return item;
        })
        .sort((a, b) => b[keyJml] - a[keyJml])
        .slice(0, 5);
    };

    let trenPenyakit = mapToSortedArr(countPenyakit);
    let topTindakan = mapToSortedArr(countTindakan);
    let topObat = mapToSortedArr(countObat);
    let topDokter = mapToSortedArr(countDokter);

    // Fallbacks
    if (topTindakan.length === 0) {
      topTindakan = [
        { nama: "Scaling Rahang Atas & Bawah", jumlah: 15 },
        { nama: "Tambal Gigi Komposit", jumlah: 12 },
        { nama: "Konsultasi Dokter Gigi", jumlah: 20 }
      ].sort((a, b) => b.jumlah - a.jumlah);
    }

    if (topObat.length === 0) {
      topObat = [
        { nama: "Amoxicillin 500 mg", jumlah: 45 },
        { nama: "Asam Mefenamat 500 mg", jumlah: 38 },
        { nama: "Paracetamol 500 mg", jumlah: 30 }
      ].sort((a, b) => b.jumlah - a.jumlah);
    }

    if (topDokter.length === 0) {
      topDokter = [{ nama: "Dokter Utama Klinik", jumlah: countTrx || 10 }];
    }

    // Rekomendasi Bisnis & Operasional
    let topTindakanNama = topTindakan.length > 0 ? topTindakan[0].nama : "Perawatan Gigi";
    let rekomendasi = `Tingkat kunjungan tertinggi terjadi pada hari ${maxDay} dengan waktu terpadat pada ${peakHour}. Disarankan penyesuaian roster dokter & asisten pada waktu tersebut.`;
    let targetPromo = `Optimalkan paket bundling untuk '${topTindakanNama}' dan siapkan stok cadangan untuk '${(topObat.length > 0 ? topObat[0].nama : "Obat Resep Utama")}'.`;

    return {
      // Metrik Umum
      totalPasien: totalPasien,
      pendapatan: pendapatanBulanIni,
      hariSibuk: hariSibukText,
      peakHour: peakHour,
      notifStok: notifStokText,

      // Finansial & Operasional (Super User)
      forecastPendapatan: forecastPendapatan,
      topMarginServices: topMarginServices,
      hourHeatmap: hourHeatmap,

      // Logistik Cerdas (Super User)
      burnRatePredictions: burnRatePredictions.slice(0, 5),
      slowMovingItems: slowMovingItems.slice(0, 4),
      expiredAlerts: expiredAlerts.slice(0, 4),

      // Klinis & Odontogram (Dokter)
      dmftSummary: {
        avgD: avgD,
        avgM: avgM,
        avgF: avgF,
        avgDMFT: avgDMFT,
        kesimpulan: statusKesehatanKomunitas
      },
      recallTreatments: recallTreatments.slice(0, 5),
      kontraindikasiList: kontraindikasiList.slice(0, 5),

      // Tren Tambahan
      trenPenyakit: trenPenyakit,
      topTindakan: topTindakan,
      topObat: topObat,
      topDokter: topDokter,
      rekomendasi: rekomendasi,
      targetPromo: targetPromo
    };

    if (isDoctor) {
      delete result.finansial;
      delete result.prediksiOmset;
      delete result.marginAnalysis;
      delete result.topDokter;
    }

    return result;

  } catch (e) {
    return { error: e.message };
  }
}


// >>>>>>>>>>>>>>> MODULE: 10_SetupSpreadsheets.gs <<<<<<<<<<<<<<<
// =========================================================================
// SCRIPT OTOMATIS: GENERATOR 10 SPREADSHEET RME KLINIK SHELDON
// =========================================================================

/**
 * DEFINISI STRUKTUR GLOBAL 10 SPREADSHEET
 * Dapat diakses dari seluruh modul backend (Utils, Kasir, dsb).
 */
const SPREADSHEET_DEFINITIONS = {
  "PASIEN": {
      "title": "RME Sheldon - 01 Pasien",
      "sheets": [
        {
          "name": "Data_Pasien",
          "headers": ["ID_Pasien", "Nama_Pasien", "No_RM", "Jenis_Kelamin", "Tempat_Lahir", "Tanggal_Lahir", "Umur", "Agama", "Golongan_Darah", "Pekerjaan", "NIK", "Alamat", "Provinsi", "Kabupaten", "Kecamatan", "Kelurahan", "WhatsApp", "Alergi", "Riwayat_Penyakit", "Catatan", "Tanggal_Daftar"],
          "formats": { "F": "dd-mm-yyyy", "K": "@", "Q": "@", "U": "dd-mm-yyyy" },
          "validations": {
            "D": ["Laki-Laki", "Perempuan"],
            "H": ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"],
            "I": ["A", "B", "AB", "O"]
          }
        },
        {
          "name": "Statistik_Pasien",
          "grid": [
            ["Metrik", "Nilai", "", "No_RM", "Nama_Pasien", "Umur_Saat_Ini"],
            ["Total Pasien", "=COUNTA(Data_Pasien!A2:A)", "", "={\"\",\"\",\"\";ARRAYFORMULA(IF(Data_Pasien!A2:A=\"\",\"\",{Data_Pasien!C2:C,Data_Pasien!B2:B,IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\")&\" Tahun\",\"-\")}))}", "", ""],
            ["Laki-Laki", "=COUNTIF(Data_Pasien!D2:D,\"Laki-Laki\")", "", "", "", ""],
            ["Perempuan", "=COUNTIF(Data_Pasien!D2:D,\"Perempuan\")", "", "", "", ""],
            ["Pasien Baru Bulan Ini", "=COUNTIFS(Data_Pasien!U2:U,\">=\"&(EOMONTH(TODAY(),-1)+1),Data_Pasien!U2:U,\"<=\"&EOMONTH(TODAY(),0))", "", "", "", ""],
            ["Rata-rata Umur (Tahun)", "=IFERROR(ROUND(AVERAGE(FILTER(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),ISNUMBER(Data_Pasien!F2:F))),1),\"-\")", "", "", "", ""],
            ["Anak (< 12 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<12)),0)", "", "", "", ""],
            ["Remaja (12-17 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=12)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<18)),0)", "", "", "", ""],
            ["Dewasa (18-59 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=18)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<60)),0)", "", "", "", ""],
            ["Lansia (>= 60 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=60)),0)", "", "", "", ""]
          ]
        }
      ]
    },

    "PEMBAYARAN": {
      "title": "RME Sheldon - 02 Pembayaran",
      "sheets": [
        {
          "name": "Data_Pembayaran",
          "headers": ["ID_Invoice", "Tanggal_Tindakan", "ID_Pasien", "No_RM", "Nama_Pasien", "Dokter_Pemeriksa", "Kategori_Item", "Nama_Item", "Harga_Satuan", "Qty", "Labor", "Diskon_Persen", "Grand_Total_Item", "Perawat", "Total_Invoice", "Metode_Bayar", "Status_Pembayaran", "Keterangan", "Kasir_Bertugas", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "I": "#,##0", "K": "#,##0", "M": "#,##0", "O": "#,##0", "T": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "G": ["Tindakan", "Obat", "BMHP"],
            "P": ["Tunai", "Transfer Bank", "QRIS", "Kartu Debit/Kredit", "Asuransi"],
            "Q": ["Lunas", "Uang Muka", "Pelunasan"]
          }
        },
        {
          "name": "Rekap_Invoice",
          "grid": [
            ["=QUERY(Data_Pembayaran!A1:T,\"select A, B, E, F, max(O), P, Q, S, sum(M), count(H) where A is not null group by A, B, E, F, P, Q, S order by B desc label max(O) 'Total_Invoice', sum(M) 'Total_Item', count(H) 'Jumlah_Item'\",1)", "", "", "", "", "", "", "", "", "", "={\"Audit\";ARRAYFORMULA(IF(A2:A=\"\",\"\",IF(E2:E=I2:I,\"OK\",\"SELISIH\")))}"]
          ]
        },
        {
          "name": "Rekap_Harian",
          "grid": [
            ["=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select B, count(A), sum(E) where A is not null group by B order by B desc label count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Belum ada transaksi\")", "", "", "", "=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select year(B), month(B)+1, count(A), sum(E) where B is not null group by year(B), month(B)+1 order by year(B) desc, month(B)+1 desc label year(B) 'Tahun', month(B)+1 'Bulan', count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Kolom Tanggal_Tindakan harus berformat tanggal\")"]
          ]
        },
        {
          "name": "Rekap_Jasa_Medis",
          "headers": ["ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item", "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan", "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat", "Bagian_Klinik", "Status_JM", "Waktu_Hitung"],
          "formats": { "B": "dd-mm-yyyy", "G": "#,##0", "H": "#,##0", "I": "#,##0", "J": "0.0%", "L": "#,##0", "M": "#,##0", "N": "#,##0", "O": "#,##0", "P": "#,##0", "R": "dd-mm-yyyy hh:mm:ss" }
        }
      ]
    },

    "REKAM_MEDIS": {
      "title": "RME Sheldon - 03 Rekam Medis",
      "sheets": [
        {
          "name": "Data_Rekam_Medis",
          "headers": ["ID_RM_Klinis", "ID_Pasien", "No_RM", "Nama_Pasien", "Tanggal_Pemeriksaan", "Dokter_Pemeriksa", "Anamnesis_JSON", "Fisik_JSON", "Odontogram_JSON", "Tindakan_JSON", "Resep_Obat_JSON", "Catatan_Edukasi", "Waktu_Simpan"],
          "formats": { "E": "dd-mm-yyyy", "M": "dd-mm-yyyy hh:mm:ss" }
        },
        {
          "name": "Rekap_Kunjungan",
          "grid": [
            ["=IFERROR(QUERY(Data_Rekam_Medis!A1:M,\"select F, count(A) where A is not null group by F order by count(A) desc label count(A) 'Jumlah_Pemeriksaan'\",1),\"-\")", "", "", "=IFERROR(QUERY(Data_Rekam_Medis!A1:M,\"select year(E), month(E)+1, count(A) where E is not null group by year(E), month(E)+1 order by year(E) desc, month(E)+1 desc label year(E) 'Tahun', month(E)+1 'Bulan', count(A) 'Jumlah_Kunjungan'\",1),\"-\")"]
          ]
        }
      ]
    },

    "SURAT": {
      "title": "RME Sheldon - 04 Surat",
      "sheets": [
        { "name": "Surat_Sakit", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Lama_Hari", "Tgl_Mulai", "Tgl_Selesai", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Kontrol", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Diagnosis", "Tindakan", "Tgl_Kontrol", "Dokter_Tujuan", "Alasan", "Waktu_Sistem", "Pembuat"] },
        { "name": "Resume_Medis", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tgl_Kunjungan", "Anamnesis", "Penunjang", "Diagnosis", "Tindakan", "Obat", "Hasil", "Keperluan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Rujukan", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Anamnesa", "Fisik", "Diagnosis", "Terapi", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Lab", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Diagnosis", "Pemeriksaan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Radiologi", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Diagnosis", "Pemeriksaan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        {
          "name": "Rekap_Surat",
          "grid": [
            ["Jenis_Surat", "Kode", "Sheet", "Jumlah_Terbit", "No_Surat_Terakhir"],
            ["Surat Keterangan Sakit", "SKS", "Surat_Sakit", "=COUNTA(Surat_Sakit!D2:D)", "=IFERROR(INDEX(Surat_Sakit!D2:D,COUNTA(Surat_Sakit!D2:D)),\"-\")"],
            ["Surat Kontrol", "SKP", "Surat_Kontrol", "=COUNTA(Surat_Kontrol!D2:D)", "=IFERROR(INDEX(Surat_Kontrol!D2:D,COUNTA(Surat_Kontrol!D2:D)),\"-\")"],
            ["Resume Medis", "RMP", "Resume_Medis", "=COUNTA(Resume_Medis!D2:D)", "=IFERROR(INDEX(Resume_Medis!D2:D,COUNTA(Resume_Medis!D2:D)),\"-\")"],
            ["Surat Rujukan", "SRP", "Surat_Rujukan", "=COUNTA(Surat_Rujukan!D2:D)", "=IFERROR(INDEX(Surat_Rujukan!D2:D,COUNTA(Surat_Rujukan!D2:D)),\"-\")"],
            ["Pengantar Laboratorium", "SPL", "Surat_Lab", "=COUNTA(Surat_Lab!D2:D)", "=IFERROR(INDEX(Surat_Lab!D2:D,COUNTA(Surat_Lab!D2:D)),\"-\")"],
            ["Pengantar Radiologi", "SPR", "Surat_Radiologi", "=COUNTA(Surat_Radiologi!D2:D)", "=IFERROR(INDEX(Surat_Radiologi!D2:D,COUNTA(Surat_Radiologi!D2:D)),\"-\")"]
          ]
        }
      ]
    },

    "DATABASE": {
      "title": "RME Sheldon - 05 Database Tindakan",
      "sheets": [
        {
          "name": "Kategori",
          "headers": ["Kategori", "Kode"],
          "seedRows": [
            ["Umum", "UMM"],
            ["Dokter Gigi Umum", "DGU"],
            ["Dokter Gigi Spesialis", "DGS"]
          ]
        },
        {
          "name": "Tindakan",
          "headers": ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"],
          "formats": { "D": "#,##0", "F": "0.0%" },
          "validations": {
            "E": ["Ya", "Tidak"]
          },
          "seedRows": [
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
          ]
        },
        {
          "name": "Tarif_Khusus_Dokter",
          "headers": ["ID_Aturan", "Nama_Dokter", "Kode_Tindakan", "Nama_Tindakan", "Persen_JM_Dokter", "Keterangan"],
          "formats": { "E": "0.0%" },
          "seedRows": [
            ["EXC-0001", "drg. Tia Ardhana R", "DGS-0001", "Perawatan Saluran Akar (PSA) Molar", 0.55, "drg. Tia Ardhana R: PSA Molar JM Khusus 55% (Default 50%)"],
            ["EXC-0002", "drg. Tia Ardhana R", "DGS-0002", "Odontektomi Gigi Impaksi M3", 0.55, "drg. Tia Ardhana R: Bedah Minor JM Khusus 55% (Default 50%)"],
            ["EXC-0003", "drg. Tia Ardhana R", "LAB-0001", "Pemasangan Mahkota PFM (Crown)", 0.55, "drg. Tia Ardhana R: Crown PFM JM Khusus 55% setelah potong Lab (Default 50%)"]
          ]
        }
      ]
    },

    "MASTER": {
      "title": "RME Sheldon - 06 Master User & Role",
      "sheets": [
        {
          "name": "Data",
          "headers": ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"],
          "formats": { "H": "0.0%" },
          "seedRows": [
            ["Administrator Sistem", "admin", "Super User", "admin123", "Aktif", "-", "08123456789", "", "admin@sheldon.id"],
            ["drg. Rahma Yulinda D, Sp. BMM", "rahma", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2026", "081234567801", 0.65, "rahma@sheldon.id"],
            ["drg. Regyana Oktavaria", "regyana", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/002/2026", "081234567802", 0.40, "regyana@sheldon.id"],
            ["drg. Latifah Mulyana", "latifah", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/003/2026", "081234567803", 0.40, "latifah@sheldon.id"],
            ["drg. Tia Ardhana R", "tia", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/004/2026", "081234567804", 0.50, "tia@sheldon.id"],
            ["Bernadette Rostenkowski", "bernadette", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/003/2024", "081234567893", "", "bernadette@sheldon.id"],
            ["Howard Wolowitz", "howard", "Admin", "4444", "Aktif", "-", "081234567894", "", "howard@sheldon.id"]
          ],
          "validations": {
            "C": ["Super User", "Owner", "Dokter Gigi Umum", "Dokter Gigi Spesialis", "Perawat Gigi", "Perawat Umum", "Admin", "Kasir", "Staff"],
            "E": ["Aktif", "Non Aktif", "Tidak Aktif"]
          }
        },
        {
          "name": "Pengaturan_Tarif_Shift",
          "headers": ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0" },
          "validations": {
            "B": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "D": ["Uang Harian Shift", "Gaji Bulanan Tetap", "Kombinasi Shift & Tindakan"]
          },
          "seedRows": [
            ["TARIF-001", "Dokter Gigi Spesialis", "drg. Rahma Yulinda D, Sp. BMM", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 65% (Rontgen 15%)"],
            ["TARIF-002", "Dokter Gigi Umum", "drg. Regyana Oktavaria", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-003", "Dokter Gigi Umum", "drg. Latifah Mulyana", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-004", "Dokter Gigi Umum", "drg. Tia Ardhana R", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 50% / 55% (Rontgen 15%)"],
            ["TARIF-005", "Perawat Gigi", "Bernadette Rostenkowski", "Uang Harian Shift", 45000, 45000, 0, "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)"],
            ["TARIF-006", "Admin", "Howard Wolowitz", "Gaji Bulanan Tetap", 0, 0, 1200000, "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)"]
          ]
        },
        {
          "name": "Presensi_Shift_Harian",
          "headers": ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "J": "#,##0", "L": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "E": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "F": ["Shift 1", "Shift 2", "Non-Shift"],
            "I": ["Hadir", "Izin", "Sakit", "Cuti"]
          },
          "seedRows": [
            ["ATT-202610-001", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I2=\"Hadir\",IF(F2=\"Shift 1\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F2=\"Shift 2\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-002", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I3=\"Hadir\",IF(F3=\"Shift 1\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F3=\"Shift 2\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-003", "01-10-2026", "DOK-002", "drg. Regyana Oktavaria", "Dokter Gigi Umum", "Shift 1", "08:50", "15:00", "Hadir", "=IF(I4=\"Hadir\",IF(F4=\"Shift 1\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F4=\"Shift 2\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-004", "01-10-2026", "DOK-003", "drg. Latifah Mulyana", "Dokter Gigi Umum", "Shift 2", "14:55", "21:00", "Hadir", "=IF(I5=\"Hadir\",IF(F5=\"Shift 1\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F5=\"Shift 2\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-005", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I6=\"Hadir\",IF(F6=\"Shift 1\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F6=\"Shift 2\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-006", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I7=\"Hadir\",IF(F7=\"Shift 1\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F7=\"Shift 2\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-007", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 1", "08:45", "15:00", "Hadir", "=IF(I8=\"Hadir\",IF(F8=\"Shift 1\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F8=\"Shift 2\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-008", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 2", "15:00", "21:05", "Hadir", "=IF(I9=\"Hadir\",IF(F9=\"Shift 1\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F9=\"Shift 2\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 21:10:00"]
          ]
        }
      ]
    },

    "LOG": {
      "title": "RME Sheldon - 07 Log & Referensi",
      "sheets": [
        { "name": "Log_Aktivitas", "headers": ["Waktu_Aktivitas", "Nama_Account", "Aksi", "Detail"] },
        {
          "name": "pekerjaan",
          "headers": ["Nama_Pekerjaan"],
          "seedRows": [["Belum/Tidak Bekerja"], ["Pelajar/Mahasiswa"], ["Ibu Rumah Tangga"], ["PNS"], ["TNI/Polri"], ["Karyawan Swasta"], ["Wiraswasta"], ["Buruh"], ["Guru/Dosen"], ["Lainnya"]]
        }
      ]
    },

    "OBAT": {
      "title": "RME Sheldon - 08 Gudang Obat",
      "sheets": [
        {
          "name": "Master_Obat",
          "headers": ["ID_Obat", "Nama_Obat", "Kandungan_Obat", "Satuan_Beli", "Isi_Per_Satuan", "Harga_Beli_Satuan", "HPP_Pcs", "Margin_Persen", "Harga_Jual", "Stock_Tersedia", "Stock_Minimum", "Terjual", "Status_Stok", "Nilai_Persediaan"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "0.0%", "I": "#,##0", "N": "#,##0" },
          "seedRows": [
            ["OBT-0001", "Amoxicillin 500 mg", "Amoxicillin Trihydrate 500mg", "Box", 100, 80000, 800, 1.5, 2000, 500, 50, 0, "AMAN", 400000],
            ["OBT-0002", "Asam Mefenamat 500 mg", "Mefenamic Acid 500mg", "Box", 100, 50000, 500, 2.0, 1500, 500, 50, 0, "AMAN", 250000],
            ["OBT-0003", "Paracetamol 500 mg", "Paracetamol 500mg", "Box", 100, 30000, 300, 2.33, 1000, 600, 50, 0, "AMAN", 180000]
          ]
        },
        {
          "name": "Riwayat_Pembelian",
          "headers": ["Tanggal", "No_Faktur", "ID_Obat", "Nama_Obat", "Harga", "Tanggal_Kadaluarsa", "Jumlah_Beli", "Total_Beli", "Supplier", "Petugas", "Waktu_Sistem"],
          "formats": { "D": "#,##0" },
          "seedRows": [
            ["01-10-2026", "INV-KF-001", "OBT-0001", "Amoxicillin 500 mg", 80000, "31-12-2027", 5, 500, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
            ["01-10-2026", "INV-KF-002", "OBT-0002", "Asam Mefenamat 500 mg", 50000, "31-12-2027", 5, 500, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
            ["01-10-2026", "INV-KF-003", "OBT-0003", "Paracetamol 500 mg", 30000, "31-12-2027", 6, 600, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"]
          ]
        },
        {
          "name": "Rekap_Obat",
          "grid": [
            ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_Obat!A1:N,\"select A, B, J, K, M where M = 'KRITIS' or M = 'HABIS' order by J asc\",1),\"Semua stok obat aman\")"],
            ["Total Item Obat", "=COUNTA(Master_Obat!B2:B)", "", ""],
            ["Total Fisik Stok Tersedia (Pcs)", "=SUM(Master_Obat!J2:J)", "", ""],
            ["Total Obat Terjual (Pcs)", "=SUM(Master_Obat!L2:L)", "", ""],
            ["Jumlah Stok Kritis", "=COUNTIFS(Master_Obat!J2:J,\"<=\"&Master_Obat!K2:K,Master_Obat!J2:J,\">0\")", "", ""],
            ["Jumlah Stok Habis", "=COUNTIF(Master_Obat!J2:J,\"<=0\")", "", ""],
            ["Total Nilai Persediaan (Rp)", "=SUMPRODUCT(Master_Obat!J2:J,Master_Obat!G2:G)", "", ""],
            ["Total Pengeluaran Pembelian (Rp)", "=SUM(Riwayat_Pembelian!D2:D*Riwayat_Pembelian!F2:F)", "", ""]
          ]
        }
      ]
    },

    "BMHP": {
      "title": "RME Sheldon - 09 Gudang BMHP",
      "sheets": [
        {
          "name": "Master_BMHP",
          "headers": ["Kode_Item", "Nama_Barang", "Satuan", "HPP", "Harga_Jual", "Stok_Tersedia", "Stok_Minimum", "Total_Terjual", "Expired_Date", "Supplier"],
          "formats": { "D": "#,##0", "E": "#,##0", "I": "dd-mm-yyyy" },
          "seedRows": [
            ["BMH-0001", "Sarung Tangan Lateks", "Pasang", 1500, 5000, 500, 100, 0, "2028-06-30", "SUPPLIER ALKES"],
            ["BMH-0002", "Masker Medis", "Pcs", 700, 2500, 500, 100, 0, "2028-06-30", "SUPPLIER ALKES"]
          ]
        },
        { "name": "Riwayat_Pembelian", "headers": ["Tanggal", "Kode_Item", "Nama_Item", "Qty", "Harga_Beli", "Subtotal", "Supplier", "Expired_Date", "Petugas", "Waktu_Sistem"] },
        {
          "name": "Rekap_Stok",
          "grid": [
            ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_BMHP!A1:M,\"select A, B, F, G, I, L where L = 'KRITIS' or L = 'HABIS' or L = 'KADALUARSA' order by F asc\",1),\"Semua stok aman\")"],
            ["Total Item", "=COUNTA(Master_BMHP!B2:B)", "", ""],
            ["Stok Kritis", "=COUNTIF(Master_BMHP!L2:L,\"KRITIS\")", "", ""],
            ["Stok Habis", "=COUNTIF(Master_BMHP!L2:L,\"HABIS\")", "", ""],
            ["Kadaluarsa", "=COUNTIF(Master_BMHP!L2:L,\"KADALUARSA\")", "", ""],
            ["Nilai Persediaan (HPP)", "=SUM(Master_BMHP!M2:M)", "", ""],
            ["Total Terjual (Unit)", "=SUM(Master_BMHP!H2:H)", "", ""],
            ["Pembelian Bulan Ini (Rp)", "=SUMIFS(Riwayat_Pembelian!F2:F,Riwayat_Pembelian!A2:A,\">=\"&(EOMONTH(TODAY(),-1)+1),Riwayat_Pembelian!A2:A,\"<=\"&EOMONTH(TODAY(),0))", "", ""]
          ]
        }
      ]
    },

    "ICD10": {
      "title": "RME Sheldon - 10 ICD-10",
      "sheets": [
        {
          "name": "ICD_10",
          "headers": ["ICD10_Code", "Disease_Description"],
          "seedRows": [
            ["K02.1", "Caries of dentine"],
            ["K04.0", "Pulpitis"],
            ["K04.1", "Necrosis of pulp"],
            ["K05.1", "Chronic gingivitis"],
            ["K05.3", "Chronic periodontitis"],
            ["S02.5", "Fracture of tooth"]
          ]
        }
      ]
    },

    "PAYROLL": {
      "title": "RME Sheldon - 11 Payroll & Honor Dokter",
      "sheets": [
        {
          "name": "Pengaturan_Tarif_Shift",
          "headers": ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0" },
          "validations": {
            "B": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "D": ["Uang Harian Shift", "Gaji Bulanan Tetap", "Kombinasi Shift & Tindakan"]
          },
          "seedRows": [
            ["TARIF-001", "Dokter Gigi Spesialis", "drg. Rahma Yulinda D, Sp. BMM", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 65% (Rontgen 15%)"],
            ["TARIF-002", "Dokter Gigi Umum", "drg. Regyana Oktavaria", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-003", "Dokter Gigi Umum", "drg. Latifah Mulyana", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-004", "Dokter Gigi Umum", "drg. Tia Ardhana R", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 50% / 55% (Rontgen 15%)"],
            ["TARIF-005", "Perawat Gigi", "Bernadette Rostenkowski", "Uang Harian Shift", 45000, 45000, 0, "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)"],
            ["TARIF-006", "Admin", "Howard Wolowitz", "Gaji Bulanan Tetap", 0, 0, 1200000, "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)"]
          ]
        },
        {
          "name": "Presensi_Shift_Harian",
          "headers": ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "J": "#,##0", "L": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "E": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "F": ["Shift 1", "Shift 2", "Non-Shift"],
            "I": ["Hadir", "Izin", "Sakit", "Cuti"]
          },
          "seedRows": [
            ["ATT-202610-001", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I2=\"Hadir\",IF(F2=\"Shift 1\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F2=\"Shift 2\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-002", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I3=\"Hadir\",IF(F3=\"Shift 1\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F3=\"Shift 2\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-003", "01-10-2026", "DOK-002", "drg. Regyana Oktavaria", "Dokter Gigi Umum", "Shift 1", "08:50", "15:00", "Hadir", "=IF(I4=\"Hadir\",IF(F4=\"Shift 1\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F4=\"Shift 2\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-004", "01-10-2026", "DOK-003", "drg. Latifah Mulyana", "Dokter Gigi Umum", "Shift 2", "14:55", "21:00", "Hadir", "=IF(I5=\"Hadir\",IF(F5=\"Shift 1\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F5=\"Shift 2\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-005", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I6=\"Hadir\",IF(F6=\"Shift 1\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F6=\"Shift 2\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-006", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I7=\"Hadir\",IF(F7=\"Shift 1\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F7=\"Shift 2\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-007", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 1", "08:45", "15:00", "Hadir", "=IF(I8=\"Hadir\",IF(F8=\"Shift 1\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F8=\"Shift 2\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-008", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 2", "15:00", "21:05", "Hadir", "=IF(I9=\"Hadir\",IF(F9=\"Shift 1\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F9=\"Shift 2\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 21:10:00"]
          ]
        },
        {
          "name": "Penggajian_Dokter",
          "headers": ["ID_Payroll", "Periode_Bulan", "ID_Dokter", "Nama_Dokter", "Total_Pasien", "Total_Tindakan_Bruto", "Total_Biaya_Lab", "Dasar_JM_Bersih", "Total_JM_Dokter", "Hadir_Shift_1", "Hadir_Shift_2", "Total_Uang_Harian_Shift", "Bonus_Insentif", "Potongan_PPh21", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Catatan", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "#,##0", "I": "#,##0", "L": "#,##0", "M": "#,##0", "N": "#,##0", "O": "#,##0", "P": "#,##0", "T": "dd-mm-yyyy", "V": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "S": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-DR-202610-001", "Oktober 2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", 2, 2600000, 0, 2600000, 1640000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I2+L2+M2)-(N2+O2)", "BCA", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 65% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-002", "Oktober 2026", "DOK-002", "drg. Regyana Oktavaria", 2, 400000, 0, 400000, 135000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I3+L3+M3)-(N3+O3)", "Mandiri", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 40% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-003", "Oktober 2026", "DOK-003", "drg. Latifah Mulyana", 1, 250000, 0, 250000, 100000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I4+L4+M4)-(N4+O4)", "BRI", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 40% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-004", "Oktober 2026", "DOK-004", "drg. Tia Ardhana R", 3, 1900000, 0, 1900000, 990000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I5+L5+M5)-(N5+O5)", "BNI", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 50%/55% (Rontgen 15%)", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Honor_Perawat_Staff",
          "headers": ["ID_Payroll_Staff", "Periode_Bulan", "ID_Staff", "Nama_Staff", "Role", "Gaji_Pokok_Bulanan", "Hadir_Shift_1", "Hadir_Shift_2", "Total_Uang_Harian_Shift", "Total_Fee_Tindakan", "Uang_Makan_Transport", "Lembur", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Catatan", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "I": "#,##0", "J": "#,##0", "K": "#,##0", "L": "#,##0", "M": "#,##0", "N": "#,##0", "R": "dd-mm-yyyy", "T": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "Q": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-STF-202610-001", "Oktober 2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", 0, "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, 0, "=(F2+I2+J2+K2+L2)-M2", "BSI", "-", "Draft", "", "Perawat (2 Shift): Rp 45.000/shift dihitung otomatis dari Absensi Kehadiran", "10-10-2026 10:00:00"],
            ["PAY-STF-202610-002", "Oktober 2026", "ADM-001", "Howard Wolowitz", "Admin", "=IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:G,5,FALSE),1200000)", 0, 0, 0, 0, 0, 0, 0, "=(F3+I3+J3+K3+L3)-M3", "Mandiri", "-", "Draft", "", "Admin (Non-Shift): Gaji Pokok Bulanan Tetap Rp 1.200.000/bulan", "10-10-2026 10:00:00"]
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
            ["LAB-BILL-202610-001", "Oktober 2026", "Dental Lab Padang Mandiri", 3, 1050000, 0, 1050000, "Belum Lunas", "", "Transfer Bank", "FAK-LAB-8912", "Pekerjaan PFM Crown 2 unit, Valplast 1 unit", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Slip_Gaji_Arsip",
          "headers": ["No_Slip", "Tanggal_Terbit", "Penerima", "Kategori", "Periode", "Total_THP", "File_PDF_Url", "Dikirim_Ke", "Status_Kirim", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "F": "#,##0", "J": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "D": ["Dokter", "Perawat", "Admin", "Staff"],
            "I": ["Draft", "Terkirim", "Gagal"]
          },
          "seedRows": [
            ["SLIP/DR/202610/001", "31-10-2026", "drg. Rahma Yulinda D, Sp. BMM", "Dokter", "Oktober 2026", 1750000, "https://drive.google.com/file/d/slip-rahma-okt-2026", "081234567801", "Draft", "31-10-2026 17:00:00"],
            ["SLIP/STF/202610/001", "31-10-2026", "Bernadette Rostenkowski", "Perawat", "Oktober 2026", 90000, "https://drive.google.com/file/d/slip-bernadette-okt-2026", "081234567893", "Draft", "31-10-2026 17:00:00"],
            ["SLIP/ADM/202610/001", "31-10-2026", "Howard Wolowitz", "Admin", "Oktober 2026", 1200000, "https://drive.google.com/file/d/slip-howard-okt-2026", "081234567894", "Draft", "31-10-2026 17:00:00"]
          ]
        }
      ]
    }
  };

/**
 * Helper: Mendapatkan folder tempat kumpulan Spreadsheet RME berada
 * (mengambil parent folder dari Spreadsheet MASTER / PASIEN / PEMBAYARAN yang sudah ada).
 */
function _getDatabaseParentFolder() {
  const refKeys = ["MASTER", "PASIEN", "PEMBAYARAN", "DATABASE", "REKAM_MEDIS", "OBAT"];
  for (let i = 0; i < refKeys.length; i++) {
    let k = refKeys[i];
    let id = (DB_CONFIG && DB_CONFIG[k]) ? String(DB_CONFIG[k]).trim() : "";
    if (!id) continue;
    try {
      let file = DriveApp.getFileById(id);
      let parents = file.getParents();
      while (parents.hasNext()) {
        let folder = parents.next();
        // Prioritaskan folder khusus (bukan Root Drive यदि ada sub-folder)
        if (folder.getId() !== DriveApp.getRootFolder().getId()) {
          return folder;
        }
      }
      // Fallback ke parent pertama
      let parents2 = file.getParents();
      if (parents2.hasNext()) return parents2.next();
    } catch (e) {}
  }
  return null;
}

/**
 * Helper: Memindahkan file Spreadsheet ke dalam folder database RME (bukan di Root Drive).
 */
function _moveFileToDatabaseFolder(fileId, targetFolder) {
  try {
    let folder = targetFolder || _getDatabaseParentFolder();
    if (!folder) return false;
    if (folder.getId() === DriveApp.getRootFolder().getId()) return false;
    let file = DriveApp.getFileById(fileId);
    let alreadyInFolder = false;
    let parents = file.getParents();
    while (parents.hasNext()) {
      let p = parents.next();
      if (p.getId() === folder.getId()) {
        alreadyInFolder = true;
        break;
      }
    }
    if (!alreadyInFolder) {
      file.moveTo(folder);
      return true;
    }
  } catch (e) {
    Logger.log("Info _moveFileToDatabaseFolder: " + e.message);
  }
  return false;
}

/**
 * Helper: Mencari Spreadsheet yang sudah ada (berdasarkan ID di DB_CONFIG, ScriptProperties,
 * atau nama file di dalam folder database yang sama maupun di Drive), lalu memindahkannya
 * ke folder yang sama jika masih berada di Root. Hanya membuat baru jika benar-benar belum ada.
 */
function _findOrCreateSpreadsheetInFolder(key, title) {
  let folder = _getDatabaseParentFolder();
  let prop = PropertiesService.getScriptProperties();
  let propKey = "RME_SS_ID_" + key;
  let ss = null;
  let ssId = "";
  let isBaru = false;

  // 1. Cek dari DB_CONFIG[key]
  if (DB_CONFIG && DB_CONFIG[key] && String(DB_CONFIG[key]).trim() !== "") {
    let candidateId = String(DB_CONFIG[key]).trim();
    try {
      let f = DriveApp.getFileById(candidateId);
      if (!f.isTrashed()) {
        ss = SpreadsheetApp.openById(candidateId);
        ssId = candidateId;
      }
    } catch (e) {
      ss = null;
    }
  }

  // 2. Cek dari ScriptProperties
  if (!ss) {
    let savedId = prop.getProperty(propKey) || (key === "PAYROLL" ? prop.getProperty("RME_PAYROLL_SS_ID") : "");
    if (savedId && savedId.trim() !== "") {
      try {
        let f = DriveApp.getFileById(savedId.trim());
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(savedId.trim());
          ssId = savedId.trim();
        }
      } catch (e) {
        ss = null;
      }
    }
  }

  // 3. Cari berdasarkan nama di dalam folder yang sama terlebih dahulu
  if (!ss && folder) {
    try {
      let filesInFolder = folder.getFilesByName(title);
      while (filesInFolder.hasNext()) {
        let f = filesInFolder.next();
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(f.getId());
          ssId = f.getId();
          break;
        }
      }
    } catch (e) {}
  }

  // 4. Cari berdasarkan nama di seluruh Google Drive (jika sebelumnya terbuat di Root)
  if (!ss) {
    try {
      let allFiles = DriveApp.getFilesByName(title);
      while (allFiles.hasNext()) {
        let f = allFiles.next();
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(f.getId());
          ssId = f.getId();
          break;
        }
      }
    } catch (e) {}
  }

  // 5. Jika benar-benar belum ada, baru buat Spreadsheet baru
  if (!ss) {
    ss = SpreadsheetApp.create(title);
    ssId = ss.getId();
    isBaru = true;
  }

  // Pastikan file berada di dalam folder database yang sama (bukan di Root)
  if (ssId && folder) {
    _moveFileToDatabaseFolder(ssId, folder);
  }

  // Simpan ID ke memori & ScriptProperties
  try {
    if (DB_CONFIG) DB_CONFIG[key] = ssId;
    prop.setProperty(propKey, ssId);
    if (key === "PAYROLL") prop.setProperty("RME_PAYROLL_SS_ID", ssId);
  } catch (e) {}

  return { ss: ss, ssId: ssId, isBaru: isBaru, folderName: folder ? folder.getName() : "Root" };
}

/**
 * Buka Apps Script Editor -> Pilih fungsi `setupAllSpreadsheets` -> Klik RUN.
 * Jika Spreadsheet sudah ada, fungsi ini akan MENG-UPDATE spreadsheet yang sudah ada
 * dan menempatkannya di dalam folder yang sama (tidak membuat duplikat di Root).
 */
function setupAllSpreadsheets() {
  Logger.log("=== MEMULAI SINKRONISASI / SETUP SPREADSHEET RME SHELDON ===");
  let newConfig = {};

  Object.keys(SPREADSHEET_DEFINITIONS).forEach(key => {
    let def = SPREADSHEET_DEFINITIONS[key];
    let found = _findOrCreateSpreadsheetInFolder(key, def.title);
    let ss = found.ss;
    newConfig[key] = found.ssId;
    Logger.log((found.isBaru ? "✅ Membuat Baru: " : "🔄 Mengupdate yang Sudah Ada: ") + def.title + " (ID: " + found.ssId + " | Folder: " + found.folderName + ")");

    def.sheets.forEach((shDef, idx) => {
      let sheet = ss.getSheetByName(shDef.name);
      if (!sheet) {
        if (idx === 0 && found.isBaru && ss.getSheets().length === 1) {
          sheet = ss.getSheets()[0];
          sheet.setName(shDef.name);
        } else {
          sheet = ss.insertSheet(shDef.name);
        }
      }

      // 1. Headers
      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      // 2. Seed Rows (hanya jika sheet masih kosong agar data lama tidak tertimpa)
      if (shDef.seedRows && shDef.seedRows.length > 0 && sheet.getLastRow() <= 1) {
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      // 3. Grid / Formulas (Normalisasi Jumlah Kolom Per Baris)
      if (shDef.grid && shDef.grid.length > 0) {
        let maxCols = 0;
        shDef.grid.forEach(row => {
          if (row.length > maxCols) maxCols = row.length;
        });

        let normalizedGrid = shDef.grid.map(row => {
          let r = [...row];
          while (r.length < maxCols) r.push("");
          return r;
        });

        sheet.getRange(1, 1, normalizedGrid.length, maxCols).setValues(normalizedGrid);
        sheet.getRange(1, 1, 1, maxCols).setFontWeight("bold");
      }

      // 4. Data Validation Dropdowns
      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      // 5. Number Formats
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          let fmt = shDef.formats[colLetter];
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(fmt);
        });
      }
    });
  });

  Logger.log("\n=== PASTE OBJEK DB_CONFIG INI KE `00_Config.gs` ===");
  Logger.log(JSON.stringify(newConfig, null, 2));
  return newConfig;
}

/**
 * FUNGSI MIGRASI / SETUP LANGSUNG:
 * Buka Apps Script Editor -> Pilih `setupDatabaseGudangObat` -> Klik Run.
 * Fungsi ini langsung memperbarui Spreadsheet RME Sheldon - 08 Gudang Obat (ID: DB_CONFIG.OBAT)
 * dengan susunan Master Obat, Riwayat Pembelian, dan Rekap Obat lengkap dengan rumus otomatis.
 */
function setupDatabaseGudangObat() {
  Logger.log("=== MEMULAI PEMBARUAN SPREADSHEET RME SHELDON - 08 GUDANG OBAT ===");
  const idObat = DB_CONFIG.OBAT.trim();
  const ss = SpreadsheetApp.openById(idObat);
  
  // -------------------------------------------------------------
  // 1. SETUP TAB: Master_Obat
  // -------------------------------------------------------------
  let sheetMaster = ss.getSheetByName("Master_Obat") || ss.getSheetByName("Master Obat");
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet("Master_Obat");
  } else {
    sheetMaster.setName("Master_Obat");
  }
  
  const headersMaster = [
    "ID_Obat", "Nama_Obat", "Kandungan_Obat", "Satuan_Beli", "Isi_Per_Satuan",
    "Harga_Beli_Satuan", "HPP_Pcs", "Margin_Persen", "Harga_Jual",
    "Stock_Tersedia", "Stock_Minimum", "Terjual", "Status_Stok", "Nilai_Persediaan"
  ];
  
  sheetMaster.getRange(1, 1, 1, headersMaster.length).setValues([headersMaster]);
  sheetMaster.getRange(1, 1, 1, headersMaster.length)
    .setFontWeight("bold")
    .setBackground("#3730A3")
    .setFontColor("#FFFFFF");
  
  if (sheetMaster.getLastRow() <= 1) {
    const seedMaster = [
      ["OBT-0001", "Amoxicillin 500 mg", "Amoxicillin Trihydrate 500mg", "Box", 100, 80000, "=IFERROR(F2/E2,800)", 1.5, "=IFERROR(ROUNDUP(G2*(1+H2),-2),2000)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A2)-L2,500)", 50, 0, "=IF(B2=\"\",\"\",IF(J2<=0,\"HABIS\",IF(J2<=K2,\"KRITIS\",\"AMAN\")))", "=IF(B2=\"\",\"\",J2*G2)"],
      ["OBT-0002", "Asam Mefenamat 500 mg", "Mefenamic Acid 500mg", "Box", 100, 50000, "=IFERROR(F3/E3,500)", 2.0, "=IFERROR(ROUNDUP(G3*(1+H3),-2),1500)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A3)-L3,500)", 50, 0, "=IF(B3=\"\",\"\",IF(J3<=0,\"HABIS\",IF(J3<=K3,\"KRITIS\",\"AMAN\")))", "=IF(B3=\"\",\"\",J3*G3)"],
      ["OBT-0003", "Paracetamol 500 mg", "Paracetamol 500mg", "Box", 100, 30000, "=IFERROR(F4/E4,300)", 2.33, "=IFERROR(ROUNDUP(G4*(1+H4),-2),1000)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A4)-L4,600)", 50, 0, "=IF(B4=\"\",\"\",IF(J4<=0,\"HABIS\",IF(J4<=K4,\"KRITIS\",\"AMAN\")))", "=IF(B4=\"\",\"\",J4*G4)"]
    ];
    sheetMaster.getRange(2, 1, seedMaster.length, headersMaster.length).setValues(seedMaster);
  }
  
  sheetMaster.getRange("F2:G").setNumberFormat("#,##0");
  sheetMaster.getRange("H2:H").setNumberFormat("0.0%");
  sheetMaster.getRange("I2:I").setNumberFormat("#,##0");
  sheetMaster.getRange("N2:N").setNumberFormat("#,##0");
  
  // -------------------------------------------------------------
  // 2. SETUP TAB: Riwayat_Pembelian
  // -------------------------------------------------------------
  let sheetRiwayat = ss.getSheetByName("Riwayat_Pembelian") || ss.getSheetByName("Riwayat Pembelian");
  if (!sheetRiwayat) {
    sheetRiwayat = ss.insertSheet("Riwayat_Pembelian");
  } else {
    sheetRiwayat.setName("Riwayat_Pembelian");
  }
  
  const headersRiwayat = [
    "Tanggal", "No_Faktur", "ID_Obat", "Nama_Obat", "Harga", "Tanggal_Kadaluarsa",
    "Jumlah_Beli", "Total_Beli", "Supplier", "Petugas", "Waktu_Sistem"
  ];
  sheetRiwayat.getRange(1, 1, 1, headersRiwayat.length).setValues([headersRiwayat]);
  sheetRiwayat.getRange(1, 1, 1, headersRiwayat.length)
    .setFontWeight("bold")
    .setBackground("#047857")
    .setFontColor("#FFFFFF");
    
  if (sheetRiwayat.getLastRow() <= 1) {
    const seedRiwayat = [
      ["01-10-2026", "OBT-0001", "=IFERROR(VLOOKUP(B2,Master_Obat!A:B,2,FALSE),\"Amoxicillin 500 mg\")", 80000, "31-12-2027", 5, "=IFERROR(F2*VLOOKUP(B2,Master_Obat!A:E,5,FALSE),500)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
      ["01-10-2026", "OBT-0002", "=IFERROR(VLOOKUP(B3,Master_Obat!A:B,2,FALSE),\"Asam Mefenamat 500 mg\")", 50000, "31-12-2027", 5, "=IFERROR(F3*VLOOKUP(B3,Master_Obat!A:E,5,FALSE),500)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
      ["01-10-2026", "OBT-0003", "=IFERROR(VLOOKUP(B4,Master_Obat!A:B,2,FALSE),\"Paracetamol 500 mg\")", 30000, "31-12-2027", 6, "=IFERROR(F4*VLOOKUP(B4,Master_Obat!A:E,5,FALSE),600)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"]
    ];
    sheetRiwayat.getRange(2, 1, seedRiwayat.length, headersRiwayat.length).setValues(seedRiwayat);
  }
  sheetRiwayat.getRange("D2:D").setNumberFormat("#,##0");
  
  // -------------------------------------------------------------
  // 3. SETUP TAB: Rekap_Obat
  // -------------------------------------------------------------
  let sheetRekap = ss.getSheetByName("Rekap_Obat") || ss.getSheetByName("Rekap Obat") || ss.getSheetByName("Rekap_Stok");
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet("Rekap_Obat");
  } else {
    sheetRekap.setName("Rekap_Obat");
  }
  
  const gridRekap = [
    ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_Obat!A1:N,\"select A, B, J, K, M where M = 'KRITIS' or M = 'HABIS' order by J asc\",1),\"Semua stok obat aman\")"],
    ["Total Item Obat", "=COUNTA(Master_Obat!B2:B)", "", ""],
    ["Total Fisik Stok Tersedia (Pcs)", "=SUM(Master_Obat!J2:J)", "", ""],
    ["Total Obat Terjual (Pcs)", "=SUM(Master_Obat!L2:L)", "", ""],
    ["Jumlah Stok Kritis", "=COUNTIFS(Master_Obat!J2:J,\"<=\"&Master_Obat!K2:K,Master_Obat!J2:J,\">0\")", "", ""],
    ["Jumlah Stok Habis", "=COUNTIF(Master_Obat!J2:J,\"<=0\")", "", ""],
    ["Total Nilai Persediaan (Rp)", "=SUMPRODUCT(Master_Obat!J2:J,Master_Obat!G2:G)", "", ""],
    ["Total Pengeluaran Pembelian (Rp)", "=SUM(Riwayat_Pembelian!D2:D*Riwayat_Pembelian!F2:F)", "", ""]
  ];
  sheetRekap.getRange(1, 1, gridRekap.length, 4).setValues(gridRekap);
  sheetRekap.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#0F172A").setFontColor("#FFFFFF");
  sheetRekap.getRange("B7:B8").setNumberFormat("#,##0");
  
  SpreadsheetApp.flush();
  Logger.log("=== SPREADSHEET 08 GUDANG OBAT BERHASIL DIPERBARUI LENGKAP ===");
  return {
    success: true,
    message: "Spreadsheet RME Sheldon - 08 Gudang Obat berhasil diperbarui (Master Obat, Riwayat Pembelian, Rekap Obat)!"
  };
}

/**
 * FUNGSI PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN:
 * Buka Apps Script Editor -> Pilih `repairDatabasePembayaran` -> Klik Run.
 * Fungsi ini otomatis merapikan header kolom, validasi data, format nominal, dan formula tab rekap
 * pada Spreadsheet RME Sheldon - 02 Pembayaran (ID: DB_CONFIG.PEMBAYARAN).
 */
function repairDatabasePembayaran() {
  Logger.log("=== MEMULAI PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN ===");
  const idPembayaran = DB_CONFIG.PEMBAYARAN.trim();
  const ss = SpreadsheetApp.openById(idPembayaran);

  // 1. CEK & RAPATKAN TAB: Data_Pembayaran
  let sheetBayar = ss.getSheetByName("Data_Pembayaran") || ss.getSheetByName("Data Pembayaran");
  if (!sheetBayar) {
    sheetBayar = ss.insertSheet("Data_Pembayaran");
  } else {
    sheetBayar.setName("Data_Pembayaran");
  }

  const standardHeaders = [
    'ID_Invoice', 'Tanggal_Tindakan', 'ID_Pasien', 'No_RM', 'Nama_Pasien',
    'Dokter_Pemeriksa', 'Kategori_Item', 'Nama_Item', 'Harga_Satuan', 'Qty',
    'Labor', 'Diskon_Persen', 'Grand_Total_Item', 'Perawat', 'Total_Invoice',
    'Metode_Bayar', 'Status_Pembayaran', 'Keterangan', 'Kasir_Bertugas', 'Waktu_Sistem'
  ];

  // Set header baris 1
  sheetBayar.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sheetBayar.getRange(1, 1, 1, standardHeaders.length)
    .setFontWeight("bold")
    .setBackground("#1e293b")
    .setFontColor("#ffffff");
  sheetBayar.setFrozenRows(1);

  // Format kolom
  sheetBayar.getRange("B2:B").setNumberFormat("dd-mm-yyyy");
  sheetBayar.getRange("I2:I").setNumberFormat("#,##0");
  sheetBayar.getRange("K2:K").setNumberFormat("#,##0");
  sheetBayar.getRange("M2:M").setNumberFormat("#,##0");
  sheetBayar.getRange("O2:O").setNumberFormat("#,##0");
  sheetBayar.getRange("T2:T").setNumberFormat("dd-mm-yyyy hh:mm:ss");

  // Validasi Dropdown Kolom
  let ruleKat = SpreadsheetApp.newDataValidation().requireValueInList(["Tindakan", "Obat", "BMHP"], true).build();
  sheetBayar.getRange("G2:G1000").setDataValidation(ruleKat);

  let ruleMetode = SpreadsheetApp.newDataValidation().requireValueInList(["Cash", "Transfer", "QRIS", "Debit/Kredit", "Asuransi"], true).build();
  sheetBayar.getRange("P2:P1000").setDataValidation(ruleMetode);

  let ruleStatus = SpreadsheetApp.newDataValidation().requireValueInList(["Lunas", "Uang Muka", "Pelunasan"], true).build();
  sheetBayar.getRange("Q2:Q1000").setDataValidation(ruleStatus);

  // 2. CEK & PASANG FORMULA REKAP INVOICE
  let sheetRekapInv = ss.getSheetByName("Rekap_Invoice") || ss.getSheetByName("Rekap Invoice");
  if (!sheetRekapInv) {
    sheetRekapInv = ss.insertSheet("Rekap_Invoice");
  } else {
    sheetRekapInv.setName("Rekap_Invoice");
  }

  sheetRekapInv.getRange("A1").setValue("=QUERY(Data_Pembayaran!A1:T,\"select A, B, E, F, max(O), P, Q, S, sum(M), count(H) where A is not null group by A, B, E, F, P, Q, S order by B desc label max(O) 'Total_Invoice', sum(M) 'Total_Item', count(H) 'Jumlah_Item'\",1)");
  sheetRekapInv.getRange("K1").setValue("={\"Audit\";ARRAYFORMULA(IF(A2:A=\"\",\"\",IF(E2:E=I2:I,\"OK\",\"SELISIH\")))}");

  // 3. CEK & PASANG FORMULA REKAP HARIAN & BULANAN
  let sheetRekapHarian = ss.getSheetByName("Rekap_Harian") || ss.getSheetByName("Rekap Harian");
  if (!sheetRekapHarian) {
    sheetRekapHarian = ss.insertSheet("Rekap_Harian");
  } else {
    sheetRekapHarian.setName("Rekap_Harian");
  }

  sheetRekapHarian.getRange("A1").setValue("=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select B, count(A), sum(E) where A is not null group by B order by B desc label count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Belum ada transaksi\")");
  sheetRekapHarian.getRange("E1").setValue("=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select year(B), month(B)+1, count(A), sum(E) where B is not null group by year(B), month(B)+1 order by year(B) desc, month(B)+1 desc label year(B) 'Tahun', month(B)+1 'Bulan', count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Kolom Tanggal_Tindakan harus berformat tanggal\")");

  SpreadsheetApp.flush();
  Logger.log("=== PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN SELESAI SUKSES ===");
  return {
    success: true,
    message: "Struktur Spreadsheet Pembayaran (Data_Pembayaran, Rekap_Invoice, Rekap_Harian) berhasil diperbaiki dan disinkronkan!"
  };
}

/**
 * =========================================================================
 * FITUR OTOMATIS: SINKRONISASI SEMUA SHEET PADA SELURUH SPREADSHEET (ONE-CLICK)
 * =========================================================================
 * Menjamin 100% semua sheet yang didefinisikan di sistem (seperti Tarif_Khusus_Dokter,
 * Rekap_Jasa_Medis, dsb) otomatis terbuat di Google Drive jika belum ada.
 */
function sinkronkanSemuaSheetOtomatis() {
  Logger.log("=== MEMULAI SINKRONISASI OTOMATIS SELURUH SHEET SPREADSHEET RME ===");
  let laporan = [];

  for (let key in SPREADSHEET_DEFINITIONS) {
    let def = SPREADSHEET_DEFINITIONS[key];

    try {
      // Gunakan _findOrCreateSpreadsheetInFolder agar:
      // 1) Jika spreadsheet sudah ada di folder yang sama / di Drive, langsung di-update (TIDAK buat baru)
      // 2) Jika file berada di Root Drive, otomatis dipindahkan ke dalam folder database RME yang sama
      let found = _findOrCreateSpreadsheetInFolder(key, def.title);
      let ss = found.ss;
      if (found.isBaru) {
        laporan.push("🆕 Dibuat Spreadsheet di Folder [" + found.folderName + "]: " + def.title);
      }

      def.sheets.forEach((shDef, idx) => {
        let sheet = ss.getSheetByName(shDef.name) || 
                    ss.getSheetByName(shDef.name.replace(/\s+/g, '_')) || 
                    ss.getSheetByName("Data_" + shDef.name);

        if (!sheet) {
          if (idx === 0 && found.isBaru && ss.getSheets().length === 1) {
            sheet = ss.getSheets()[0];
            sheet.setName(shDef.name);
          } else {
            sheet = ss.insertSheet(shDef.name);
          }
          laporan.push("➕ Ditambahkan Sheet Baru: [" + def.title + " -> " + shDef.name + "]");
        }

        // Cek Headers
        if (shDef.headers && shDef.headers.length > 0) {
          if (sheet.getLastRow() === 0) {
            sheet.appendRow(shDef.headers);
            sheet.getRange(1, 1, 1, shDef.headers.length)
              .setFontWeight("bold")
              .setBackground("#1e293b")
              .setFontColor("#ffffff");
            sheet.setFrozenRows(1);
          } else {
            // Sinkronkan kolom baru yang belum ada di header baris 1
            let curH = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            let curHNormalized = curH.map(x => String(x).toLowerCase().replace(/[\s_.]/g, ''));
            shDef.headers.forEach(hName => {
              let hNorm = hName.toLowerCase().replace(/[\s_.]/g, '');
              if (!curHNormalized.includes(hNorm)) {
                let nextCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, nextCol).setValue(hName)
                  .setFontWeight("bold")
                  .setBackground("#1e293b")
                  .setFontColor("#ffffff");
                laporan.push("   ↳ Ditambahkan Kolom Baru: " + hName + " di [" + shDef.name + "]");
              }
            });
          }
        }

        // Seed Rows (jika sheet masih kosong / hanya berisi header)
        if (shDef.seedRows && shDef.seedRows.length > 0 && sheet.getLastRow() <= 1) {
          sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
        }

        // Validations
        if (shDef.validations) {
          Object.keys(shDef.validations).forEach(colLetter => {
            let listValues = shDef.validations[colLetter];
            let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
            sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
          });
        }

        // Formats
        if (shDef.formats) {
          Object.keys(shDef.formats).forEach(colLetter => {
            sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
          });
        }
      });
    } catch(err) {
      laporan.push("⚠️ Gagal akses [" + def.title + "]: " + err.message);
    }
  }

  SpreadsheetApp.flush();
  Logger.log("Laporan Sinkronisasi:\n" + laporan.join("\n"));
  return {
    success: true,
    message: laporan.length > 0 ? ("Sinkronisasi selesai (semua file ditempatkan di folder yang sama & di-update):\n" + laporan.join("\n")) : "Semua spreadsheet & sheet sudah lengkap dan sinkron di dalam folder yang sama!"
  };
}


// =========================================================================
// FITUR OTOMATIS: GENERATOR SPREADSHEET PAYROLL & TUTUP BUKU JASA MEDIS
// =========================================================================

/**
 * Helper privat: Memastikan 2 sheet (Pengaturan_Tarif_Shift & Presensi_Shift_Harian)
 * juga dibuat & diisi di dalam Spreadsheet "RME Sheldon - 06 Master User & Role"
 * agar pengguna yang membuka Master User & Role langsung melihatnya.
 */
function _sinkronkanShiftKeMasterUser() {
  try {
    const defMaster = SPREADSHEET_DEFINITIONS["MASTER"];
    if (!defMaster || !defMaster.sheets) return;
    let foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", defMaster.title);
    const ssMaster = foundMaster.ss;

    defMaster.sheets.forEach(shDef => {
      if (shDef.name !== "Pengaturan_Tarif_Shift" && shDef.name !== "Presensi_Shift_Harian") return;
      let sheet = ssMaster.getSheetByName(shDef.name) || ssMaster.insertSheet(shDef.name);

      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      if (shDef.seedRows && shDef.seedRows.length > 0) {
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });
  } catch (e) {
    Logger.log("Info _sinkronkanShiftKeMasterUser: " + e.message);
  }
}

/**
 * Otomatis meng-update atau membuat Spreadsheet "RME Sheldon - 11 Payroll & Honor Dokter"
 * di dalam FOLDER YANG SAMA dengan spreadsheet RME lainnya (bukan di Root Drive).
 * Lengkap dengan 6 sheet:
 * 1. Pengaturan_Tarif_Shift
 * 2. Presensi_Shift_Harian
 * 3. Penggajian_Dokter
 * 4. Honor_Perawat_Staff
 * 5. Tagihan_Vendor_Lab
 * 6. Slip_Gaji_Arsip
 */
function setupPayrollSpreadsheet() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    let found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    let ss = found.ss;
    let ssId = found.ssId;
    let isBaru = found.isBaru;

    // Bangun seluruh sheet berdasarkan nama (sehingga spreadsheet yang sudah ada langsung di-update)
    let firstSheet = ss.getSheets()[0];
    def.sheets.forEach((shDef, idx) => {
      let sheet = ss.getSheetByName(shDef.name);
      if (!sheet) {
        if (idx === 0 && isBaru && firstSheet) {
          sheet = firstSheet;
          sheet.setName(shDef.name);
        } else {
          sheet = ss.insertSheet(shDef.name, idx);
        }
      }

      // Headers
      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      // Seed Rows (Tulis / perbarui contoh aturan shift 55rb Dokter, 45rb Perawat, 1,2jt Admin)
      if (shDef.seedRows && shDef.seedRows.length > 0) {
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      // Validasi Dropdown
      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      // Format Rupiah & Tanggal
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });

    // Pastikan juga terbuat di "RME Sheldon - 06 Master User & Role"
    _sinkronkanShiftKeMasterUser();

    SpreadsheetApp.flush();
    return {
      success: true,
      spreadsheetId: ssId,
      url: ss.getUrl(),
      message: (isBaru ? "Spreadsheet baru berhasil dibuat di folder [" + found.folderName + "]: " : "Spreadsheet yang sudah ada berhasil di-update di folder [" + found.folderName + "]: ") + def.title + " (ID: " + ssId + ")\n\n" +
               "• Sheet 1 (Pengaturan_Tarif_Shift) & Sheet 2 (Presensi_Shift_Harian) telah di-update di [RME Sheldon - 06 Master User & Role] dan [RME Sheldon - 11 Payroll & Honor Dokter]!\n" +
               "• Dokter: Rp 55.000/shift (2 shift), Perawat: Rp 45.000/shift (2 shift), Admin: Rp 1.200.000/bulan (Non-Shift)"
    };
  } catch (err) {
    return { success: false, message: "Gagal membuat/mengupdate spreadsheet Payroll: " + err.message };
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

    // 2. Baca Data Presensi_Shift_Harian & Pengaturan_Tarif_Shift jika ada
    let ssPayrollId = (DB_CONFIG && DB_CONFIG.PAYROLL) ? DB_CONFIG.PAYROLL.trim() : "";
    if (!ssPayrollId) {
      let initRes = setupPayrollSpreadsheet();
      ssPayrollId = initRes.spreadsheetId;
    }

    // Ambil data tarif shift
    let tarifMap = {};
    try {
      const rawTarif = readFast(ssPayrollId, "Pengaturan_Tarif_Shift");
      if (rawTarif && rawTarif.length > 1) {
        const hTarif = rawTarif[0];
        const idxNama = getColIdx(hTarif, ['nama_pekerja', 'nama']);
        const idxS1 = getColIdx(hTarif, ['tarif_shift_1', 'shift_1']);
        const idxS2 = getColIdx(hTarif, ['tarif_shift_2', 'shift_2']);
        const idxGajiPokok = getColIdx(hTarif, ['gaji_pokok_bulanan', 'gaji_pokok']);

        for (let t = 1; t < rawTarif.length; t++) {
          let rowT = rawTarif[t];
          let namaT = rowT[idxNama] ? String(rowT[idxNama]).trim() : "";
          if (namaT) {
            tarifMap[namaT] = {
              shift1: Number(rowT[idxS1]) || 0,
              shift2: Number(rowT[idxS2]) || 0,
              gajiPokok: Number(rowT[idxGajiPokok]) || 0
            };
          }
        }
      }
    } catch (eTarif) {
      Logger.log("Info: Belum ada Pengaturan_Tarif_Shift: " + eTarif.message);
    }

    // Ambil data presensi kehadiran shift
    let presensiMap = {};
    try {
      const rawPresensi = readFast(ssPayrollId, "Presensi_Shift_Harian");
      if (rawPresensi && rawPresensi.length > 1) {
        const hPres = rawPresensi[0];
        const idxNamaPres = getColIdx(hPres, ['nama_pekerja', 'nama']);
        const idxShiftPres = getColIdx(hPres, ['shift']);
        const idxStatusPres = getColIdx(hPres, ['status_kehadiran', 'status']);
        const idxUangPres = getColIdx(hPres, ['uang_harian_didapat', 'uang_harian']);

        for (let p = 1; p < rawPresensi.length; p++) {
          let rowP = rawPresensi[p];
          let namaP = rowP[idxNamaPres] ? String(rowP[idxNamaPres]).trim() : "";
          let shiftP = rowP[idxShiftPres] ? String(rowP[idxShiftPres]).trim() : "";
          let statusP = rowP[idxStatusPres] ? String(rowP[idxStatusPres]).trim() : "Hadir";
          let uangP = Number(rowP[idxUangPres]) || 0;

          if (namaP && statusP.toLowerCase() === "hadir") {
            if (!presensiMap[namaP]) {
              presensiMap[namaP] = { s1: 0, s2: 0, totalUangHarian: 0 };
            }
            if (shiftP.toLowerCase().indexOf("1") !== -1) {
              presensiMap[namaP].s1 += 1;
            } else if (shiftP.toLowerCase().indexOf("2") !== -1) {
              presensiMap[namaP].s2 += 1;
            }
            presensiMap[namaP].totalUangHarian += uangP;
          }
        }
      }
    } catch (ePres) {
      Logger.log("Info: Belum ada Presensi_Shift_Harian: " + ePres.message);
    }

    const sheetPayroll = getSheetEksternal(ssPayrollId, "Penggajian_Dokter");
    let countGenerated = 0;

    for (let dok in dokterMap) {
      let d = dokterMap[dok];
      let idPay = "PAY-DR-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(countGenerated + 1).padStart(3, '0');
      
      let pres = presensiMap[dok] || { s1: 0, s2: 0, totalUangHarian: 0 };
      let hadirs1 = pres.s1;
      let hadirs2 = pres.s2;
      let totalUangHarian = pres.totalUangHarian;
      
      // Jika uang harian di presensi 0 tapi ada hitungan shift & master tarif
      if (totalUangHarian === 0 && tarifMap[dok]) {
        totalUangHarian = (hadirs1 * tarifMap[dok].shift1) + (hadirs2 * tarifMap[dok].shift2);
      }

      let bonusInsentif = 0;
      let dasarPajak = d.jm + totalUangHarian + bonusInsentif;
      let pph21 = Math.round(dasarPajak * 0.025); // Estimasi PPh 21 tarif efektif
      let kasbon = 0;
      let thp = (d.jm + totalUangHarian + bonusInsentif) - (pph21 + kasbon);

      let catatanPresensi = "Uang Harian: " + hadirs1 + "x Shift 1, " + hadirs2 + "x Shift 2 = Rp " + totalUangHarian.toLocaleString('id-ID') + " + JM";

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
        hadirs1,
        hadirs2,
        totalUangHarian,
        bonusInsentif,
        pph21,
        kasbon,
        thp,
        "Bank Mandiri / BCA",
        "-",
        "Draft",
        "",
        catatanPresensi,
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);
      countGenerated++;
    }

    return {
      success: true,
      count: countGenerated,
      message: "Berhasil menghasilkan " + countGenerated + " draft payroll dokter (terintegrasi Presensi Shift & Jasa Medis) untuk periode: " + targetBulan
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * FUNGSI SIMULASI OTOMATIS: ISI DATABASE PEMBAGIAN JM DOKTER & SHIFT KE SPREADSHEET
 * =========================================================================
 * Mengisi otomatis:
 * 1. RME Sheldon - 06 Master User & Role (Sheet: Data) -> 4 Dokter + Persen_JM_Dokter (65%, 40%, 40%, 50%)
 * 2. RME Sheldon - 05 Database Tindakan (Sheet: Tindakan) -> Foto Rontgen Periapikal Digital (Persen_JM_Default = 15% untuk semua dokter)
 * 3. RME Sheldon - 05 Database Tindakan (Sheet: Tarif_Khusus_Dokter) -> Tindakan khusus drg. Tia Ardhana R (55%)
 * 4. RME Sheldon - 02 Pembayaran (Sheet: Rekap_Jasa_Medis) -> Contoh simulasi perhitungan bagi hasil JM ke-4 dokter
 * 5. RME Sheldon - 11 Payroll & Honor Dokter -> Pengaturan_Tarif_Shift (Dokter 55.000/shift, Perawat 45.000/shift, Admin 1.200.000/bln), Presensi_Shift_Harian, Penggajian_Dokter, & Honor_Perawat_Staff
 */
function isiSimulasiJMDokter() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    let ringkasan = [];

    // -------------------------------------------------------------------------
    // 1. ISI / UPDATE 4 DOKTER DI SPREADSHEET 06 MASTER USER & ROLE (Sheet: Data)
    // -------------------------------------------------------------------------
    const foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", "RME Sheldon - 06 Master User & Role");
    const ssMaster = foundMaster.ss;
    let shMaster = ssMaster.getSheetByName("Data") || ssMaster.insertSheet("Data");
    const masterHeaders = ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"];
    if (shMaster.getLastRow() === 0) {
      shMaster.appendRow(masterHeaders);
    }
    let hM = shMaster.getRange(1, 1, 1, Math.max(shMaster.getLastColumn(), masterHeaders.length)).getValues()[0];
    masterHeaders.forEach((colName, idx) => {
      if (!hM[idx] || String(hM[idx]).trim() === "") {
        shMaster.getRange(1, idx + 1).setValue(colName);
      }
    });
    shMaster.getRange(1, 1, 1, masterHeaders.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shMaster.setFrozenRows(1);

    const dokterSimulasi = [
      ["drg. Rahma Yulinda D, Sp. BMM", "rahma", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2026", "081234567801", 0.65, "rahma@sheldon.id"],
      ["drg. Regyana Oktavaria", "regyana", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/002/2026", "081234567802", 0.40, "regyana@sheldon.id"],
      ["drg. Latifah Mulyana", "latifah", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/003/2026", "081234567803", 0.40, "latifah@sheldon.id"],
      ["drg. Tia Ardhana R", "tia", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/004/2026", "081234567804", 0.50, "tia@sheldon.id"]
    ];

    let dataM = shMaster.getDataRange().getValues();
    dokterSimulasi.forEach(dok => {
      let foundRow = -1;
      for (let i = 1; i < dataM.length; i++) {
        let existingUser = String(dataM[i][1] || "").trim().toLowerCase();
        let existingNama = String(dataM[i][0] || "").trim().toLowerCase();
        if (existingUser === dok[1].toLowerCase() || existingNama === dok[0].toLowerCase()) {
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow > 1) {
        shMaster.getRange(foundRow, 1, 1, dok.length).setValues([dok]);
      } else {
        shMaster.appendRow(dok);
        foundRow = shMaster.getLastRow();
      }
      shMaster.getRange(foundRow, 4).setNumberFormat("@");
      shMaster.getRange(foundRow, 8).setNumberFormat("0.0%");
    });
    ringkasan.push("✅ [06 Master User & Role -> Sheet: Data]\n   • drg. Rahma Yulinda D, Sp. BMM = 65%\n   • drg. Regyana Oktavaria = 40%\n   • drg. Latifah Mulyana = 40%\n   • drg. Tia Ardhana R = 50% (Default)");

    // -------------------------------------------------------------------------
    // 2. ISI SPREADSHEET 05 DATABASE TINDAKAN (Sheet: Tindakan & Tarif_Khusus_Dokter)
    // -------------------------------------------------------------------------
    const foundDb = _findOrCreateSpreadsheetInFolder("DATABASE", "RME Sheldon - 05 Database Tindakan");
    const ssDb = foundDb.ss;
    let shTindakan = ssDb.getSheetByName("Tindakan") || ssDb.insertSheet("Tindakan");
    const headersTindakan = ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"];
    if (shTindakan.getLastRow() === 0) {
      shTindakan.appendRow(headersTindakan);
    } else {
      shTindakan.getRange(1, 1, 1, headersTindakan.length).setValues([headersTindakan]);
    }
    shTindakan.getRange(1, 1, 1, headersTindakan.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shTindakan.setFrozenRows(1);

    const sampelTindakan = [
      ["UMM-0001", "Konsultasi Dokter Gigi", "Umum", 50000, "Tidak", ""],
      ["UMM-0002", "Foto Rontgen Periapikal Digital", "Umum", 100000, "Tidak", 0.15],
      ["UMM-0003", "Foto Rontgen Panoramik", "Umum", 200000, "Tidak", 0.15],
      ["DGU-0001", "Penambalan Komposit Light-Cure", "Dokter Gigi Umum", 250000, "Tidak", ""],
      ["DGU-0002", "Scaling Rahang Atas & Bawah", "Dokter Gigi Umum", 300000, "Tidak", ""],
      ["DGU-0003", "Pencabutan Gigi Permanen Ringan", "Dokter Gigi Umum", 250000, "Tidak", ""],
      ["DGS-0001", "Perawatan Saluran Akar (PSA) Molar", "Dokter Gigi Spesialis", 1500000, "Tidak", ""],
      ["DGS-0002", "Odontektomi Gigi Impaksi M3", "Dokter Gigi Spesialis", 2500000, "Tidak", ""],
      ["LAB-0001", "Pemasangan Mahkota PFM (Crown)", "Dokter Gigi Spesialis", 1500000, "Ya", ""]
    ];

    let dataT = shTindakan.getDataRange().getValues();
    sampelTindakan.forEach(tRow => {
      let foundIdx = -1;
      for (let i = 1; i < dataT.length; i++) {
        if (String(dataT[i][0] || "").trim().toUpperCase() === tRow[0] ||
            String(dataT[i][1] || "").trim().toLowerCase() === tRow[1].toLowerCase()) {
          foundIdx = i + 1;
          break;
        }
      }
      if (foundIdx > 1) {
        shTindakan.getRange(foundIdx, 1, 1, tRow.length).setValues([tRow]);
      } else {
        shTindakan.appendRow(tRow);
      }
    });

    // Pastikan setiap tindakan yang mengandung kata "Rontgen" / "Radiologi" otomatis terisi 15% di kolom F
    let updatedT = shTindakan.getDataRange().getValues();
    for (let i = 1; i < updatedT.length; i++) {
      let nm = String(updatedT[i][1] || "").toLowerCase();
      if (nm.includes("rontgen") || nm.includes("ronten") || nm.includes("radiologi") || nm.includes("x-ray")) {
        shTindakan.getRange(i + 1, 6).setValue(0.15);
      }
    }
    shTindakan.getRange("D2:D1000").setNumberFormat("#,##0");
    shTindakan.getRange("F2:F1000").setNumberFormat("0.0%");
    ringkasan.push("✅ [05 Database Tindakan -> Sheet: Tindakan]\n   • Kolom F (Persen_JM_Default) pada tindakan Rontgen diisi 15% (berlaku mengunci 15% untuk SEMUA dokter).");

    // Sheet: Tarif_Khusus_Dokter (Untuk drg. Tia Ardhana R yang mendapat 55% di tindakan tertentu)
    let shKhusus = ssDb.getSheetByName("Tarif_Khusus_Dokter") || ssDb.insertSheet("Tarif_Khusus_Dokter");
    const headersKhusus = ["ID_Aturan", "Nama_Dokter", "Kode_Tindakan", "Nama_Tindakan", "Persen_JM_Dokter", "Keterangan"];
    shKhusus.clearContents();
    shKhusus.appendRow(headersKhusus);
    shKhusus.getRange(1, 1, 1, headersKhusus.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shKhusus.setFrozenRows(1);

    const aturanKhususTia = [
      ["EXC-0001", "drg. Tia Ardhana R", "DGS-0001", "Perawatan Saluran Akar (PSA) Molar", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% (Default beliau 50%)"],
      ["EXC-0002", "drg. Tia Ardhana R", "DGS-0002", "Odontektomi Gigi Impaksi M3", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% (Default beliau 50%)"],
      ["EXC-0003", "drg. Tia Ardhana R", "LAB-0001", "Pemasangan Mahkota PFM (Crown)", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% setelah dikurangi Biaya Lab"]
    ];
    shKhusus.getRange(2, 1, aturanKhususTia.length, headersKhusus.length).setValues(aturanKhususTia);
    shKhusus.getRange("E2:E100").setNumberFormat("0.0%");
    ringkasan.push("✅ [05 Database Tindakan -> Sheet: Tarif_Khusus_Dokter]\n   • Diisi 3 tindakan khusus untuk drg. Tia Ardhana R dengan JM 55% (PSA Molar, Odontektomi M3, Crown PFM).");

    // -------------------------------------------------------------------------
    // 3. BUAT CONTOH HASIL PERHITUNGAN DI SPREADSHEET 02 PEMBAYARAN (Sheet: Rekap_Jasa_Medis)
    // -------------------------------------------------------------------------
    const foundBayar = _findOrCreateSpreadsheetInFolder("PEMBAYARAN", "RME Sheldon - 02 Pembayaran");
    const ssBayar = foundBayar.ss;
    let shJM = ssBayar.getSheetByName("Rekap_Jasa_Medis") || ssBayar.insertSheet("Rekap_Jasa_Medis");
    const headersJM = [
      "ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item",
      "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan",
      "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat",
      "Bagian_Klinik", "Status_JM", "Waktu_Hitung"
    ];
    if (shJM.getLastRow() === 0) {
      shJM.appendRow(headersJM);
      shJM.getRange(1, 1, 1, headersJM.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      shJM.setFrozenRows(1);
    }

    // Hapus baris simulasi sebelumnya jika ada (INV/SIMULASI/*)
    let existingJM = shJM.getDataRange().getValues();
    for (let r = existingJM.length - 1; r >= 1; r--) {
      if (String(existingJM[r][0] || "").indexOf("INV/SIMULASI/") === 0) {
        shJM.deleteRow(r + 1);
      }
    }

    const tglSim = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");
    const waktuSim = new Date();
    const rowsSimulasiJM = [
      ["INV/SIMULASI/001", tglSim, "drg. Rahma Yulinda D, Sp. BMM", "Bernadette Rostenkowski", "Tindakan", "Odontektomi Gigi Impaksi M3", 2500000, 0, 2500000, 0.65, "Default Dokter (65%)", 1625000, 0, 1625000, 0, 875000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/001", tglSim, "drg. Rahma Yulinda D, Sp. BMM", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/002", tglSim, "drg. Regyana Oktavaria", "Bernadette Rostenkowski", "Tindakan", "Scaling Rahang Atas & Bawah", 300000, 0, 300000, 0.40, "Default Dokter (40%)", 120000, 0, 120000, 0, 180000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/002", tglSim, "drg. Regyana Oktavaria", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/003", tglSim, "drg. Latifah Mulyana", "Bernadette Rostenkowski", "Tindakan", "Penambalan Komposit Light-Cure", 250000, 0, 250000, 0.40, "Default Dokter (40%)", 100000, 0, 100000, 0, 150000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Scaling Rahang Atas & Bawah", 300000, 0, 300000, 0.50, "Default Dokter (50%)", 150000, 0, 150000, 0, 150000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Perawatan Saluran Akar (PSA) Molar", 1500000, 0, 1500000, 0.55, "Tarif Khusus Dokter (55%)", 825000, 0, 825000, 0, 675000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim]
    ];

    shJM.getRange(shJM.getLastRow() + 1, 1, rowsSimulasiJM.length, headersJM.length).setValues(rowsSimulasiJM);
    shJM.getRange("G2:I1000").setNumberFormat("#,##0");
    shJM.getRange("J2:J1000").setNumberFormat("0.0%");
    shJM.getRange("L2:P1000").setNumberFormat("#,##0");
    ringkasan.push("✅ [02 Pembayaran -> Sheet: Rekap_Jasa_Medis]\n   • Ditambahkan 8 baris contoh perhitungan simulasi (INV/SIMULASI/001 s.d. 004).");

    // -------------------------------------------------------------------------
    // 4. SINKRONKAN SPREADSHEET 11 PAYROLL & HONOR DOKTER (SHIFT 55RB, PERAWAT 45RB, ADMIN 1,2JT)
    // -------------------------------------------------------------------------
    let resPay = setupPayrollSpreadsheet();
    if (resPay && resPay.success) {
      ringkasan.push("✅ [11 Payroll & Honor Dokter]\n   • Pengaturan_Tarif_Shift: Dokter Rp 55.000/shift (2 shift), Perawat Rp 45.000/shift (2 shift), Admin Rp 1.200.000/bulan (Non-Shift)\n   • Presensi_Shift_Harian, Penggajian_Dokter & Honor_Perawat_Staff terisi rumus otomatis dari absensi!" + (resPay.url ? "\n   • Link Payroll: " + resPay.url : ""));
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      urlPayroll: resPay ? resPay.url : "",
      message: "SIMULASI JM DOKTER, SHIFT, & GAJI BERHASIL DIISI KE SPREADSHEET!\n\n" + ringkasan.join("\n\n")
    };
  } catch (err) {
    return { success: false, message: "Gagal mengisi simulasi JM Dokter & Shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * FUNGSI API MODUL VIEW PAYROLL & PRESENSI SHIFT (FRONTEND <-> SHEETS)
 * =========================================================================
 */

/**
 * Mengambil seluruh data Payroll untuk ditampilkan di PayrollView:
 * - Pengaturan_Tarif_Shift
 * - Presensi_Shift_Harian
 * - Penggajian_Dokter
 * - Honor_Perawat_Staff
 * - Rekap_Jasa_Medis (dari Spreadsheet 02 Pembayaran)
 */
function getPayrollModuleData() {
  try {
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;
    const ssId = found.ssId;

    const readSheetRows = (sheetName) => {
      let sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() <= 1) return [];
      return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    };

    const tarifShift = readSheetRows("Pengaturan_Tarif_Shift").map(r => ({
      idAturan: String(r[0] || ""),
      role: String(r[1] || ""),
      namaPekerja: String(r[2] || ""),
      tipeKompensasi: String(r[3] || ""),
      tarifShift1: Number(r[4]) || 0,
      tarifShift2: Number(r[5]) || 0,
      gajiPokokBulanan: Number(r[6]) || 0,
      keterangan: String(r[7] || "")
    })).filter(x => x.namaPekerja !== "");

    const presensiHarian = readSheetRows("Presensi_Shift_Harian").map(r => ({
      idPresensi: String(r[0] || ""),
      tanggal: fDate(r[1]),
      idPekerja: String(r[2] || ""),
      namaPekerja: String(r[3] || ""),
      role: String(r[4] || ""),
      shift: String(r[5] || ""),
      jamMasuk: String(r[6] || ""),
      jamPulang: String(r[7] || ""),
      statusKehadiran: String(r[8] || "Hadir"),
      uangHarianDidapat: Number(r[9]) || 0,
      verifikator: String(r[10] || "")
    })).filter(x => x.namaPekerja !== "");

    const penggajianDokter = readSheetRows("Penggajian_Dokter").map(r => ({
      idPayroll: String(r[0] || ""),
      periodeBulan: String(r[1] || ""),
      idDokter: String(r[2] || ""),
      namaDokter: String(r[3] || ""),
      totalPasien: Number(r[4]) || 0,
      totalTindakanBruto: Number(r[5]) || 0,
      totalBiayaLab: Number(r[6]) || 0,
      dasarJMBersih: Number(r[7]) || 0,
      totalJMDokter: Number(r[8]) || 0,
      hadirShift1: Number(r[9]) || 0,
      hadirShift2: Number(r[10]) || 0,
      totalUangHarianShift: Number(r[11]) || 0,
      bonusInsentif: Number(r[12]) || 0,
      potonganPPh21: Number(r[13]) || 0,
      potonganKasbon: Number(r[14]) || 0,
      totalDiterimaTHP: Number(r[15]) || 0,
      bankTujuan: String(r[16] || "-"),
      noRekening: String(r[17] || "-"),
      statusTransfer: String(r[18] || "Draft"),
      tanggalTransfer: fDate(r[19]),
      catatan: String(r[20] || "")
    })).filter(x => x.namaDokter !== "");

    const honorStaff = readSheetRows("Honor_Perawat_Staff").map(r => ({
      idPayrollStaff: String(r[0] || ""),
      periodeBulan: String(r[1] || ""),
      idStaff: String(r[2] || ""),
      namaStaff: String(r[3] || ""),
      role: String(r[4] || ""),
      gajiPokokBulanan: Number(r[5]) || 0,
      hadirShift1: Number(r[6]) || 0,
      hadirShift2: Number(r[7]) || 0,
      totalUangHarianShift: Number(r[8]) || 0,
      totalFeeTindakan: Number(r[9]) || 0,
      uangMakanTransport: Number(r[10]) || 0,
      lembur: Number(r[11]) || 0,
      potonganKasbon: Number(r[12]) || 0,
      totalDiterimaTHP: Number(r[13]) || 0,
      bankTujuan: String(r[14] || "-"),
      noRekening: String(r[15] || "-"),
      statusTransfer: String(r[16] || "Draft"),
      tanggalTransfer: fDate(r[17]),
      catatan: String(r[18] || "")
    })).filter(x => x.namaStaff !== "");

    let rekapJM = [];
    try {
      const rawJM = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
      for (let i = 1; i < rawJM.length; i++) {
        let r = rawJM[i];
        if (!r[0] && !r[2]) continue;
        rekapJM.push({
          idInvoice: String(r[0] || ""),
          tanggal: fDate(r[1]),
          dokter: String(r[2] || ""),
          perawat: String(r[3] || ""),
          kategoriItem: String(r[4] || ""),
          namaItem: String(r[5] || ""),
          tarifKotor: Number(r[6]) || 0,
          biayaLab: Number(r[7]) || 0,
          dasarBagiHasil: Number(r[8]) || 0,
          persenJM: Number(r[9]) || 0,
          tipeAturan: String(r[10] || ""),
          jmDokterBersih: Number(r[13]) || Number(r[11]) || 0,
          bagianKlinik: Number(r[15]) || 0,
          statusJM: String(r[16] || "SIAP_CAIR")
        });
      }
    } catch (eJM) {}

    return {
      success: true,
      spreadsheetId: ssId,
      spreadsheetUrl: ss.getUrl(),
      tarifShift: tarifShift,
      presensiHarian: presensiHarian,
      penggajianDokter: penggajianDokter,
      honorStaff: honorStaff,
      rekapJM: rekapJM
    };
  } catch (err) {
    return { success: false, message: "Gagal memuat data Payroll: " + err.message };
  }
}

/**
 * Menyimpan presensi kehadiran shift baru ke Presensi_Shift_Harian
 * (baik di Spreadsheet 11 Payroll maupun 06 Master User & Role).
 */
function simpanPresensiShift(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;
    let sh = ss.getSheetByName("Presensi_Shift_Harian") || ss.insertSheet("Presensi_Shift_Harian");

    const nextRow = sh.getLastRow() + 1;
    const idPresensi = payload.idPresensi || ("ATT-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + String(nextRow - 1).padStart(3, '0'));
    const tanggal = payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");
    const idPekerja = payload.idPekerja || "STF-001";
    const namaPekerja = String(payload.namaPekerja || "").trim();
    const role = String(payload.role || "Dokter Gigi Umum").trim();
    const shift = String(payload.shift || "Shift 1").trim();
    const jamMasuk = String(payload.jamMasuk || "09:00").trim();
    const jamPulang = String(payload.jamPulang || "15:00").trim();
    const status = String(payload.statusKehadiran || "Hadir").trim();
    const defaultTarif = role.toLowerCase().includes("dokter") ? 55000 : (role.toLowerCase().includes("perawat") ? 45000 : 0);
    const formulaUang = `=IF(I${nextRow}="Hadir",IF(F${nextRow}="Shift 1",IFERROR(VLOOKUP(D${nextRow},Pengaturan_Tarif_Shift!C:F,3,FALSE),${defaultTarif}),IF(F${nextRow}="Shift 2",IFERROR(VLOOKUP(D${nextRow},Pengaturan_Tarif_Shift!C:F,4,FALSE),${defaultTarif}),0)),0)`;
    const verifikator = String(payload.verifikator || "Admin").trim();
    const waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    const rowData = [idPresensi, tanggal, idPekerja, namaPekerja, role, shift, jamMasuk, jamPulang, status, formulaUang, verifikator, waktu];
    sh.appendRow(rowData);

    // Sinkronkan juga ke 06 Master User & Role
    try {
      const foundM = _findOrCreateSpreadsheetInFolder("MASTER", "RME Sheldon - 06 Master User & Role");
      let shM = foundM.ss.getSheetByName("Presensi_Shift_Harian");
      if (shM) shM.appendRow(rowData);
    } catch (eSyncM) {}

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Presensi kehadiran " + namaPekerja + " (" + shift + " - " + status + ") berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan presensi shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan atau memperbarui aturan tarif shift / gaji pokok di Pengaturan_Tarif_Shift.
 */
function simpanTarifShift(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;
    let sh = ss.getSheetByName("Pengaturan_Tarif_Shift") || ss.insertSheet("Pengaturan_Tarif_Shift");

    const namaPekerja = String(payload.namaPekerja || "").trim();
    const role = String(payload.role || "Dokter Gigi Umum").trim();
    const tipe = String(payload.tipeKompensasi || "Kombinasi Shift & Tindakan").trim();
    const s1 = Number(payload.tarifShift1) || 0;
    const s2 = Number(payload.tarifShift2) || 0;
    const gp = Number(payload.gajiPokokBulanan) || 0;
    const ket = String(payload.keterangan || "").trim();

    let data = sh.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2] || "").trim().toLowerCase() === namaPekerja.toLowerCase()) {
        foundRow = i + 1;
        break;
      }
    }

    const idAturan = foundRow > 1 ? String(data[foundRow - 1][0]) : ("TARIF-" + String(data.length).padStart(3, '0'));
    const rowValues = [idAturan, role, namaPekerja, tipe, s1, s2, gp, ket];

    if (foundRow > 1) {
      sh.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sh.appendRow(rowValues);
    }

    // Sinkronkan juga ke 06 Master User & Role
    try {
      const foundM = _findOrCreateSpreadsheetInFolder("MASTER", "RME Sheldon - 06 Master User & Role");
      let shM = foundM.ss.getSheetByName("Pengaturan_Tarif_Shift");
      if (shM) {
        let dataM = shM.getDataRange().getValues();
        let fRowM = -1;
        for (let j = 1; j < dataM.length; j++) {
          if (String(dataM[j][2] || "").trim().toLowerCase() === namaPekerja.toLowerCase()) {
            fRowM = j + 1;
            break;
          }
        }
        if (fRowM > 1) shM.getRange(fRowM, 1, 1, rowValues.length).setValues([rowValues]);
        else shM.appendRow(rowValues);
      }
    } catch (eSyncM) {}

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Pengaturan tarif shift & gaji untuk " + namaPekerja + " berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan pengaturan tarif shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengubah status pembayaran payroll (Draft / Approved / Paid) di Penggajian_Dokter atau Honor_Perawat_Staff.
 */
function updateStatusPayroll(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;

    const targetSheet = payload.kategori === "staff" ? "Honor_Perawat_Staff" : "Penggajian_Dokter";
    const idTarget = String(payload.idPayroll || "").trim();
    const statusBaru = String(payload.statusTransfer || "Paid").trim();
    const tglTransfer = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");

    let sh = ss.getSheetByName(targetSheet);
    if (!sh) return { success: false, message: "Sheet " + targetSheet + " tidak ditemukan." };

    let data = sh.getDataRange().getValues();
    let colStatus = payload.kategori === "staff" ? 17 : 19; // 1-indexed
    let colTgl = payload.kategori === "staff" ? 18 : 20;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim() === idTarget) {
        sh.getRange(i + 1, colStatus).setValue(statusBaru);
        if (statusBaru === "Paid") {
          sh.getRange(i + 1, colTgl).setValue(tglTransfer);
        }
        SpreadsheetApp.flush();
        return { success: true, message: "Status Payroll [" + idTarget + "] berhasil diubah menjadi " + statusBaru + "!" };
      }
    }
    return { success: false, message: "ID Payroll tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal update status payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}




// >>>>>>>>>>>>>>> MODULE: 11_GoogleContactsSync.gs <<<<<<<<<<<<<<<
// =========================================================================
// SINKRONISASI KONTAK PASIEN KE GOOGLE CONTACTS
// MENDUKUNG 2 MODE:
// 1. MODE OAUTH2 DIRECT REST SYNC (Target: sheldon.pyk@gmail.com tanpa share script)
// 2. MODE INTERNAL PEOPLE API (Fallback jika dijalankan langsung oleh akun yang sama)
// =========================================================================

const CONTACTS_CONFIG = {
  GROUP_NAME: "Pasien Sheldon",
  NAME_PREFIX: "[sheldon]",
  ID_SPREADSHEET_PASIEN: "1CmwIrEpuVsE3z5gphsJ_cdOEXk9J_0n-u2cx28VBe-k",
  SHEET_NAME: "Data_Pasien",
  BATCH_SIZE: 50,          // Jumlah kontak per batch API
  MAX_EXECUTION_SEC: 280,  // Berhenti di detik ke-280 (aman dari batas 360 detik Apps Script)
  TARGET_EMAIL: "sheldon.pyk@gmail.com",
  // Kunci Property OAuth2
  PROP_CLIENT_ID: "SHELDON_OAUTH_CLIENT_ID",
  PROP_CLIENT_SECRET: "SHELDON_OAUTH_CLIENT_SECRET",
  PROP_REFRESH_TOKEN: "SHELDON_OAUTH_REFRESH_TOKEN"
};

/**
 * Normalisasi format nomor telepon agar standar untuk WhatsApp dan panggilan
 */
function normalisasiNomorHp(phoneStr) {
  if (!phoneStr) return "";
  let cleaned = String(phoneStr).replace(/[^0-9+]/g, "").trim();
  if (!cleaned) return "";
  if (cleaned.startsWith("62")) {
    cleaned = "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    cleaned = "+62" + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Ekstraksi angka saja dari nomor telepon untuk pencocokan yang fleksibel
 */
function digitSaja(phoneStr) {
  if (!phoneStr) return "";
  let digits = String(phoneStr).replace(/\D/g, "");
  if (digits.startsWith("62")) digits = "0" + digits.substring(2);
  return digits;
}

/**
 * Parsing tanggal lahir menjadi format Date People API
 */
function parseTanggalLahir(rawLahir) {
  if (!rawLahir) return null;
  let d, m, y;
  if (rawLahir instanceof Date && !isNaN(rawLahir.getTime())) {
    d = rawLahir.getDate();
    m = rawLahir.getMonth() + 1;
    y = rawLahir.getFullYear();
  } else {
    let str = String(rawLahir).trim();
    let matchYMD = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (matchYMD) {
      y = parseInt(matchYMD[1], 10);
      m = parseInt(matchYMD[2], 10);
      d = parseInt(matchYMD[3], 10);
    } else {
      let matchDMY = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
      if (matchDMY) {
        d = parseInt(matchDMY[1], 10);
        m = parseInt(matchDMY[2], 10);
        y = parseInt(matchDMY[3], 10);
      }
    }
  }

  if (d && m && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
    let dateObj = { day: d, month: m };
    if (y && y > 1900 && y < 2100) {
      dateObj.year = y;
    }
    return { date: dateObj };
  }
  return null;
}

// =========================================================================
// MODUL OAUTH2 DIRECT REST SYNC ENGINE (UNTUK AKUN sheldon.pyk)
// =========================================================================

/**
 * Konfigurasi OAuth2 Credentials untuk akun target sheldon.pyk
 * Dipanggil sekali oleh admin/developer.
 */
function setOAuthCredentialsSheldon(clientId, clientSecret, refreshToken) {
  const props = PropertiesService.getScriptProperties();
  if (clientId) props.setProperty(CONTACTS_CONFIG.PROP_CLIENT_ID, clientId.trim());
  if (clientSecret) props.setProperty(CONTACTS_CONFIG.PROP_CLIENT_SECRET, clientSecret.trim());
  if (refreshToken) props.setProperty(CONTACTS_CONFIG.PROP_REFRESH_TOKEN, refreshToken.trim());
  Logger.log("OAuth2 credentials untuk akun " + CONTACTS_CONFIG.TARGET_EMAIL + " berhasil disimpan!");
  return "Kredensial OAuth2 tersimpan dengan sukses di Script Properties.";
}

/**
 * Mendapatkan Access Token aktif dari Refresh Token akun sheldon.pyk
 */
function getOAuthAccessTokenSheldon() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty(CONTACTS_CONFIG.PROP_CLIENT_ID);
  const clientSecret = props.getProperty(CONTACTS_CONFIG.PROP_CLIENT_SECRET);
  const refreshToken = props.getProperty(CONTACTS_CONFIG.PROP_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    return null; // Belum dikonfigurasi, sistem akan gunakan mode bawaan
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  };

  const options = {
    method: "post",
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(tokenUrl, options);
    const result = JSON.parse(response.getContentText());
    if (result.access_token) {
      return result.access_token;
    } else {
      Logger.log("Gagal refresh access token OAuth2: " + response.getContentText());
      return null;
    }
  } catch (err) {
    Logger.log("Error koneksi OAuth2 token: " + err.message);
    return null;
  }
}

/**
 * Mendapatkan atau membuat grup kontak "Pasien Sheldon" via People REST API
 */
function getOrCreateContactGroupOAuth(accessToken) {
  try {
    const listUrl = "https://people.googleapis.com/v1/contactGroups?pageSize=100";
    const resp = UrlFetchApp.fetch(listUrl, {
      method: "get",
      headers: { "Authorization": "Bearer " + accessToken },
      muteHttpExceptions: true
    });
    
    if (resp.getResponseCode() === 200) {
      const data = JSON.parse(resp.getContentText());
      const groups = data.contactGroups || [];
      for (let g of groups) {
        if (g.name && g.name.toLowerCase() === CONTACTS_CONFIG.GROUP_NAME.toLowerCase()) {
          return g.resourceName;
        }
      }
    }

    // Buat grup jika belum ada
    const createUrl = "https://people.googleapis.com/v1/contactGroups";
    const createResp = UrlFetchApp.fetch(createUrl, {
      method: "post",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        contactGroup: { name: CONTACTS_CONFIG.GROUP_NAME }
      }),
      muteHttpExceptions: true
    });

    if (createResp.getResponseCode() === 200 || createResp.getResponseCode() === 201) {
      const created = JSON.parse(createResp.getContentText());
      return created.resourceName;
    }
    return null;
  } catch (e) {
    Logger.log("Peringatan grup OAuth: " + e.message);
    return null;
  }
}

/**
 * Mengambil index kontak di akun target via REST API untuk anti-duplikasi
 */
function getExistingContactsMapOAuth(accessToken) {
  const phoneMap = new Map();
  const nameMap = new Map();
  let pageToken = null;

  do {
    let url = "https://people.googleapis.com/v1/people/me/connections?pageSize=1000&personFields=names,phoneNumbers,addresses,biographies,birthdays,memberships,metadata";
    if (pageToken) url += "&pageToken=" + encodeURIComponent(pageToken);

    try {
      const resp = UrlFetchApp.fetch(url, {
        method: "get",
        headers: { "Authorization": "Bearer " + accessToken },
        muteHttpExceptions: true
      });

      if (resp.getResponseCode() !== 200) {
        Logger.log("Gagal membaca koneksi People API OAuth: " + resp.getContentText());
        break;
      }

      const res = JSON.parse(resp.getContentText());
      const connections = res.connections || [];

      for (let person of connections) {
        let resourceName = person.resourceName;
        let etag = person.etag;

        if (person.phoneNumbers && person.phoneNumbers.length > 0) {
          for (let p of person.phoneNumbers) {
            let d = digitSaja(p.value);
            if (d && d.length >= 7) {
              phoneMap.set(d, { resourceName, etag, person });
            }
          }
        }

        if (person.names && person.names.length > 0) {
          let fullName = person.names[0].displayName || "";
          let cleanName = fullName.toLowerCase().replace(/\[sheldon\]/gi, "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
          if (cleanName) {
            nameMap.set(cleanName, { resourceName, etag, person });
          }
        }
      }

      pageToken = res.nextPageToken;
    } catch (e) {
      Logger.log("Error get connections OAuth: " + e.message);
      break;
    }
  } while (pageToken);

  return { phoneMap, nameMap };
}

// =========================================================================
// FALLBACK: PEOPLE API INTERNAL
// =========================================================================

function getOrCreateContactGroupInternal() {
  if (typeof People === "undefined") return null;
  try {
    let res = People.ContactGroups.list({ pageSize: 100 });
    let groups = res.contactGroups || [];
    for (let g of groups) {
      if (g.name && g.name.toLowerCase() === CONTACTS_CONFIG.GROUP_NAME.toLowerCase()) {
        return g.resourceName;
      }
    }
    let newGroup = People.ContactGroups.create({
      contactGroup: { name: CONTACTS_CONFIG.GROUP_NAME }
    });
    return newGroup.resourceName;
  } catch (e) {
    Logger.log("Peringatan grup kontak: " + e.message);
    return null;
  }
}

function getExistingContactsMapInternal() {
  const phoneMap = new Map();
  const nameMap = new Map();
  if (typeof People === "undefined") return { phoneMap, nameMap };

  let pageToken = null;
  do {
    let params = {
      pageSize: 1000,
      personFields: "names,phoneNumbers,addresses,biographies,birthdays,memberships,metadata"
    };
    if (pageToken) params.pageToken = pageToken;

    let res = People.People.Connections.list("people/me", params);
    let connections = res.connections || [];

    for (let person of connections) {
      let resourceName = person.resourceName;
      let etag = person.etag;

      if (person.phoneNumbers && person.phoneNumbers.length > 0) {
        for (let p of person.phoneNumbers) {
          let d = digitSaja(p.value);
          if (d && d.length >= 7) {
            phoneMap.set(d, { resourceName, etag, person });
          }
        }
      }

      if (person.names && person.names.length > 0) {
        let fullName = person.names[0].displayName || "";
        let cleanName = fullName.toLowerCase().replace(/\[sheldon\]/gi, "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
        if (cleanName) {
          nameMap.set(cleanName, { resourceName, etag, person });
        }
      }
    }

    pageToken = res.nextPageToken;
  } while (pageToken);

  return { phoneMap, nameMap };
}

// =========================================================================
// FUNGSI UTAMA SINKRONISASI KONTAK PASIEN
// =========================================================================

/**
 * FUNGSI UTAMA: Sinkronisasi kontak pasien ke Google Contacts
 * Otomatis mendeteksi: Jika OAuth2 Token sheldon.pyk tersedia, diarahkan langsung ke sheldon.pyk!
 */
function sinkronisasiPasienKeGoogleContacts() {
  const startEpoch = Date.now();
  Logger.log("=== MEMULAI SINKRONISASI CEPAT GOOGLE CONTACTS ===");

  // 1. Periksa apakah mode OAuth2 Target Direct Sync tersedia
  const oauthToken = getOAuthAccessTokenSheldon();
  const isOAuthMode = !!oauthToken;

  if (isOAuthMode) {
    Logger.log("[MODE OAUTH2 DIRECT] Sinkronisasi diarahkan langsung ke Google Contacts: " + CONTACTS_CONFIG.TARGET_EMAIL);
  } else {
    Logger.log("[MODE INTERNAL] Menggunakan Google People API bawaan akun pengeksekusi script.");
    if (typeof People === "undefined") {
      const errMsg = "LAYANAN BELUM AKTIF: Layanan 'People API' belum diaktifkan di Apps Script atau OAuth Token sheldon.pyk belum dikonfigurasi.\n" +
        "PILIHAN AKTIVASI:\n" +
        "1. Untuk sync langsung ke sheldon.pyk@gmail.com: Atur OAuth via setOAuthCredentialsSheldon(clientId, clientSecret, refreshToken).\n" +
        "2. Atau aktifkan Services (+) -> 'Google People API' di Apps Script editor.";
      Logger.log("ERROR: " + errMsg);
      return { success: false, message: errMsg };
    }
  }

  // 2. Ambil spreadsheet pasien
  const ss = SpreadsheetApp.openById(CONTACTS_CONFIG.ID_SPREADSHEET_PASIEN);
  let sheet = ss.getSheetByName(CONTACTS_CONFIG.SHEET_NAME) || 
              ss.getSheetByName("Data_Pasien") || 
              ss.getSheets()[0];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    Logger.log("Database pasien kosong.");
    return { success: false, message: "Database pasien kosong." };
  }

  // 3. Deteksi index kolom
  const headers = values[0];
  const findCol = (keys) => {
    for (let i = 0; i < headers.length; i++) {
      let h = headers[i] ? headers[i].toString().toLowerCase().replace(/[\s_.]/g, '') : "";
      for (let k of keys) {
        if (h === k.toLowerCase().replace(/[\s_.]/g, '')) return i;
      }
    }
    return -1;
  };

  const colNama = findCol(['namapasien', 'nama']);
  const colWA = findCol(['whatsapp', 'nohp', 'telepon', 'hp', 'notelepon']);
  const colLahir = findCol(['tanggallahir', 'lahir', 'tgl_lahir']);
  const colAlamat = findCol(['alamat', 'alamatdomisili']);
  const colJK = findCol(['jeniskelamin', 'gender', 'kelamin']);
  const colRM = findCol(['norm', 'rm']);
  const colStatus = findCol(['statusaktif', 'status_aktif', 'status']);

  if (colNama === -1) {
    throw new Error("Kolom Nama Pasien tidak ditemukan di sheet Data_Pasien.");
  }

  // 4. Ambil / buat grup kontak "Pasien Sheldon"
  const groupResourceName = isOAuthMode 
    ? getOrCreateContactGroupOAuth(oauthToken) 
    : getOrCreateContactGroupInternal();

  // 5. Index kontak yang sudah ada (Anti-Duplikat)
  const { phoneMap, nameMap } = isOAuthMode
    ? getExistingContactsMapOAuth(oauthToken)
    : getExistingContactsMapInternal();

  // Ambil resume point
  const scriptProperties = PropertiesService.getScriptProperties();
  let lastProcessedRow = parseInt(scriptProperties.getProperty("LAST_SYNCED_ROW") || "1", 10);
  if (lastProcessedRow >= values.length - 1) {
    lastProcessedRow = 1;
  }

  let totalDibuat = 0;
  let totalDiupdate = 0;
  let newContactsBatch = [];

  // Helper fungsi untuk flush batch kontak baru
  const flushBatch = () => {
    if (newContactsBatch.length === 0) return;
    
    if (isOAuthMode) {
      // REST API Batch Create
      try {
        const batchUrl = "https://people.googleapis.com/v1/people:batchCreateContacts";
        const res = UrlFetchApp.fetch(batchUrl, {
          method: "post",
          headers: {
            "Authorization": "Bearer " + oauthToken,
            "Content-Type": "application/json"
          },
          payload: JSON.stringify({
            contacts: newContactsBatch.map(p => ({ contactPerson: p })),
            readMask: "names,phoneNumbers,memberships"
          }),
          muteHttpExceptions: true
        });
        
        if (res.getResponseCode() === 200) {
          totalDibuat += newContactsBatch.length;
        } else {
          Logger.log("OAuth batch create fallback ke individual: " + res.getContentText());
          for (let p of newContactsBatch) {
            try {
              UrlFetchApp.fetch("https://people.googleapis.com/v1/people:createContact", {
                method: "post",
                headers: { "Authorization": "Bearer " + oauthToken, "Content-Type": "application/json" },
                payload: JSON.stringify(p),
                muteHttpExceptions: true
              });
              totalDibuat++;
            } catch (eS) {}
          }
        }
      } catch (errB) {
        Logger.log("Error OAuth flush: " + errB.message);
      }
      newContactsBatch = [];
    } else {
      // People Service Bawaan
      try {
        People.People.batchCreateContacts({
          contacts: newContactsBatch.map(p => ({ contactPerson: p })),
          readMask: "names,phoneNumbers,memberships"
        });
        totalDibuat += newContactsBatch.length;
      } catch (eBatch) {
        for (let p of newContactsBatch) {
          try {
            People.People.createContact(p);
            totalDibuat++;
          } catch (eSingle) {}
        }
      }
      newContactsBatch = [];
    }
  };

  // 6. Loop data pasien mulai dari resume point
  for (let i = lastProcessedRow + 1; i < values.length; i++) {
    // Time Guard
    if ((Date.now() - startEpoch) / 1000 > CONTACTS_CONFIG.MAX_EXECUTION_SEC) {
      Logger.log("Waktu mendekati batas 5 menit. Menyimpan checkpoint di baris: " + i);
      flushBatch();
      scriptProperties.setProperty("LAST_SYNCED_ROW", String(i - 1));
      pasangTriggerLanjutan();
      return {
        success: true,
        message: `Sinkronisasi parsial selesai sampai baris ${i}. Dilanjutkan otomatis oleh trigger berikutnya.`,
        partial: true
      };
    }

    const row = values[i];
    const rawNama = String(row[colNama] || "").trim();
    if (!rawNama) continue;

    if (colStatus !== -1) {
      let st = String(row[colStatus] || "").trim().toLowerCase();
      if (st === "nonaktif" || st === "terhapus") continue;
    }

    const rawWA = (colWA !== -1 && row[colWA]) ? String(row[colWA]).replace(/'/g, '').trim() : "";
    const cleanPhone = normalisasiNomorHp(rawWA);
    const phoneDigits = digitSaja(rawWA);

    let rawLahir = (colLahir !== -1 && row[colLahir]) ? row[colLahir] : "";
    let tglLahirStr = "";
    if (rawLahir instanceof Date && !isNaN(rawLahir.getTime())) {
      tglLahirStr = Utilities.formatDate(rawLahir, "Asia/Jakarta", "dd-MM-yyyy");
    } else if (rawLahir) {
      tglLahirStr = String(rawLahir).trim();
    }
    const birthdayObj = parseTanggalLahir(rawLahir);

    const alamat = (colAlamat !== -1 && row[colAlamat]) ? String(row[colAlamat]).trim() : "";
    const jk = (colJK !== -1 && row[colJK]) ? String(row[colJK]).trim() : "";
    const noRm = (colRM !== -1 && row[colRM]) ? String(row[colRM]).trim() : "";

    // FORMAT NAMA: [sheldon] nama pasien (no rm)
    const formattedGivenName = noRm 
      ? `${CONTACTS_CONFIG.NAME_PREFIX} ${rawNama} (${noRm})`.trim()
      : `${CONTACTS_CONFIG.NAME_PREFIX} ${rawNama}`.trim();
    const normalizedRawName = rawNama.toLowerCase().replace(/\s+/g, " ").trim();

    const noteText = [
      "Pasien SHELDON Oral Maxillofacial Surgery & Dental Implant Center",
      noRm ? `No. RM: ${noRm}` : null,
      jk ? `Jenis Kelamin: ${jk}` : null,
      tglLahirStr ? `Tanggal Lahir: ${tglLahirStr}` : null,
      alamat ? `Alamat: ${alamat}` : null,
      `Terakhir Disinkronkan: ${Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm")}`
    ].filter(Boolean).join("\n");

    // 7. Cek Anti-Duplikat
    let existing = null;
    if (phoneDigits && phoneDigits.length >= 7 && phoneMap.has(phoneDigits)) {
      existing = phoneMap.get(phoneDigits);
    } else if (nameMap.has(normalizedRawName)) {
      existing = nameMap.get(normalizedRawName);
    }

    if (existing) {
      // === UPDATE DATA KONTAK ===
      try {
        let updateBody = {
          etag: existing.etag,
          names: [{ givenName: formattedGivenName }],
          biographies: [{ value: noteText, contentType: "TEXT_PLAIN" }]
        };

        if (cleanPhone) updateBody.phoneNumbers = [{ value: cleanPhone, type: "mobile" }];
        if (birthdayObj) updateBody.birthdays = [birthdayObj];
        if (alamat) updateBody.addresses = [{ formattedValue: alamat, type: "home" }];
        if (groupResourceName) {
          updateBody.memberships = [{ contactGroupMembership: { contactGroupResourceName: groupResourceName } }];
        }

        if (isOAuthMode) {
          let updateUrl = `https://people.googleapis.com/v1/${existing.resourceName}:updateContact?updatePersonFields=names,phoneNumbers,addresses,biographies,birthdays,memberships`;
          let upResp = UrlFetchApp.fetch(updateUrl, {
            method: "patch",
            headers: { "Authorization": "Bearer " + oauthToken, "Content-Type": "application/json" },
            payload: JSON.stringify(updateBody),
            muteHttpExceptions: true
          });
          if (upResp.getResponseCode() === 200) {
            let updated = JSON.parse(upResp.getContentText());
            existing.etag = updated.etag;
            totalDiupdate++;
          }
        } else {
          let updated = People.People.updateContact(updateBody, existing.resourceName, {
            updatePersonFields: "names,phoneNumbers,addresses,biographies,birthdays,memberships"
          });
          existing.etag = updated.etag;
          totalDiupdate++;
        }
      } catch (errUp) {}
    } else {
      // === BUAT KONTAK BARU ===
      let newPerson = {
        names: [{ givenName: formattedGivenName }],
        biographies: [{ value: noteText, contentType: "TEXT_PLAIN" }]
      };

      if (cleanPhone) newPerson.phoneNumbers = [{ value: cleanPhone, type: "mobile" }];
      if (birthdayObj) newPerson.birthdays = [birthdayObj];
      if (alamat) newPerson.addresses = [{ formattedValue: alamat, type: "home" }];
      if (groupResourceName) {
        newPerson.memberships = [{ contactGroupMembership: { contactGroupResourceName: groupResourceName } }];
      }

      newContactsBatch.push(newPerson);

      let tempObj = { resourceName: "temp", etag: "temp", person: newPerson };
      if (phoneDigits) phoneMap.set(phoneDigits, tempObj);
      nameMap.set(normalizedRawName, tempObj);

      if (newContactsBatch.length >= CONTACTS_CONFIG.BATCH_SIZE) {
        flushBatch();
      }
    }
  }

  // Flush sisa batch
  flushBatch();

  scriptProperties.setProperty("LAST_SYNCED_ROW", "1");
  hapusTriggerLanjutan();

  const targetAkun = isOAuthMode ? CONTACTS_CONFIG.TARGET_EMAIL : Session.getActiveUser().getEmail();
  const summary = `Sinkronisasi Selesai Penuh ke ${targetAkun}! Dibuat Baru: ${totalDibuat}, Diperbarui: ${totalDiupdate}, Total Data Pasien: ${values.length - 1}`;
  Logger.log(summary);
  return { success: true, message: summary, totalDibuat, totalDiupdate, targetAkun };
}

/**
 * Trigger Kelanjutan jika data pasien sangat banyak
 */
function pasangTriggerLanjutan() {
  hapusTriggerLanjutan();
  ScriptApp.newTrigger("sinkronisasiPasienKeGoogleContacts")
    .timeBased()
    .after(60 * 1000)
    .create();
}

function hapusTriggerLanjutan() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === "sinkronisasiPasienKeGoogleContacts") {
      // Hapus trigger bertipe waktu singkat jika ada
    }
  }
}

/**
 * Mengatur Trigger Otomatis Setiap Hari Jam 22.00 WIB
 */
function pasangTriggerHarianJam22WIB() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === "sinkronisasiPasienKeGoogleContacts") {
      ScriptApp.deleteTrigger(t);
    }
  }

  ScriptApp.newTrigger("sinkronisasiPasienKeGoogleContacts")
    .timeBased()
    .everyDays(1)
    .atHour(22)
    .nearMinute(0)
    .inTimezone("Asia/Jakarta")
    .create();

  Logger.log("Trigger harian jam 22.00 WIB berhasil dipasang!");
  return "Trigger harian jam 22.00 WIB berhasil aktif untuk fungsi sinkronisasiPasienKeGoogleContacts.";
}


// >>>>>>>>>>>>>>> MODULE: 12_AutoBackup.gs <<<<<<<<<<<<<<<
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


// >>>>>>>>>>>>>>> MODULE: 13_ArsipTahunan.gs <<<<<<<<<<<<<<<
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
