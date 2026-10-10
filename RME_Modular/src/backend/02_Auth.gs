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
    const inputHash = hashPassword(inputPass);
    
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idxUser]) continue;
      
      let uData = String(r[idxUser]).trim();
      let pData = String(r[idxPass]).trim();
      
      if (uData === username && (pData === inputPass || pData === inputHash)) {
        let rowStatus = idxStatus !== -1 && r[idxStatus] ? r[idxStatus].toString().trim().toLowerCase() : "aktif";
        if (rowStatus !== "aktif" && rowStatus !== "active") {
          return { success: false, message: "Akun Anda TIDAK AKTIF. Hubungi Administrator." };
        }
        
        let role = idxRole !== -1 && r[idxRole] ? r[idxRole].toString().trim() : "Admin";
        let namaAsli = (idxNama !== -1 && r[idxNama]) ? r[idxNama].toString().trim() : username;
        
        // Auto-upgrade password plaintext ke format hash SHA-256 jika belum ter-hash
        if (pData === inputPass && pData !== inputHash && inputHash !== inputPass) {
          try {
            const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
            const sheet = ss.getSheetByName("Data");
            if (sheet) {
              sheet.getRange(i + 1, idxPass + 1).setValue(inputHash);
            }
          } catch (errUp) {}
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
