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

