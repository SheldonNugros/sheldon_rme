// =========================================================================
// FUNGSI MASTER DATABASE: ICD-10, KATEGORI, TINDAKAN & STAFF
// =========================================================================

/**
 * BATCH INIT DATA KLINIK:
 * Menggabungkan Master Data, Pasien, Rekam Medis, dan Pembayaran dalam 1 kali RPC call
 * Menghilangkan latensi 4 roundtrip terpisah dan mencegah antrean Apps Script container.
 */
function getBatchInitKlinikData() {
  try {
    return {
      success: true,
      master: getInitMaster(),
      pasien: getInitPasien(),
      rekamMedis: getDaftarRekamMedis(),
      pembayaran: getDaftarPembayaran()
    };
  } catch (err) {
    Logger.log("❌ Error getBatchInitKlinikData: " + err.message);
    return {
      success: false,
      message: err.message
    };
  }
}

function getInitMaster() {
  const cacheKey = "INIT_MASTER_CACHE_V1";
  const cached = getCacheJson(cacheKey);
  if (cached) return cached;

  const result = {
    staff: getDaftarStaffLengkap(),
    tindakan: getDaftarTindakanLengkap(),
    obat: getDaftarObatLengkap(),
    bmhp: getDaftarBMHPLengkap(),
    tarifKhusus: getTarifKhususDokter(),
    pekerjaan: (typeof getDaftarPekerjaan === 'function') ? getDaftarPekerjaan() : []
  };
  putCacheJson(cacheKey, result, 900); // Cache 15 menit di RAM
  return result;
}

function getDaftarStaffLengkap() {
  try {
    let v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return [];
    let h = v[0];
    let idPek = getColIdx(h, ['idpekerja', 'id_pekerja', 'id']);
    let idN = getColIdx(h, ['namapekerja', 'nama', 'namalengkap']); if (idN === -1) idN = (idPek === 0 ? 1 : 0);
    let idU = getColIdx(h, ['username', 'user']); if (idU === -1) idU = (idPek === 0 ? 2 : 1);
    let idR = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idR === -1) idR = (idPek === 0 ? 3 : 2);
    let idSt = getColIdx(h, ['status']); if (idSt === -1) idSt = (idPek === 0 ? 5 : 4);
    let idSIP = getColIdx(h, ['noregistrasi', 'no_registrasi', 'sip', 'noreg']); if (idSIP === -1) idSIP = (idPek === 0 ? 6 : 5);
    let idHP = getColIdx(h, ['nohp', 'no_hp', 'telepon', 'wa']); if (idHP === -1) idHP = (idPek === 0 ? 7 : 6);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm']); if (idJM === -1) idJM = (idPek === 0 ? 8 : 7);
    let idEm = getColIdx(h, ['email', 'surel', 'e-mail']); if (idEm === -1) idEm = (idPek === 0 ? 9 : 8);

    return v.slice(1).filter(r => r[idN]).map((r, idx) => {
      let rawId = (idPek !== -1 && r[idPek]) ? String(r[idPek]).trim() : "";
      let snId = (rawId && rawId.toUpperCase().startsWith("SN-")) ? rawId : ("SN-" + String(idx + 1).padStart(2, '0'));
      return {
        id: snId,
        idPekerja: snId,
        nama: String(r[idN]).trim(),
        username: r[idU] ? String(r[idU]).trim() : "",
        role: r[idR] ? String(r[idR]).trim() : "",
        status: r[idSt] ? String(r[idSt]).trim() : "Aktif",
        sip: r[idSIP] ? String(r[idSIP]).trim() : "-",
        noHp: r[idHP] ? String(r[idHP]).trim() : "",
        persenJM: (idJM !== -1 && r[idJM] !== "" && r[idJM] !== null && r[idJM] !== undefined) ? Number(r[idJM]) : 0,
        email: r[idEm] ? String(r[idEm]).trim() : ""
      };
    });
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
    let v = readFast(DB_CONFIG.MASTER, "Data");
    if (v.length <= 1) return [];
    let h = v[0];
    let idPek = getColIdx(h, ['idpekerja', 'id_pekerja', 'id']);

    // Jika kolom ID_Pekerja belum ada atau ada baris yang belum berformat SN-XX, jalankan migrasi otomatis
    let needsIdMigration = (idPek === -1);
    if (!needsIdMigration) {
      for (let k = 1; k < v.length; k++) {
        let cellId = String(v[k][idPek] || "").trim().toUpperCase();
        if (!cellId.startsWith("SN-")) {
          needsIdMigration = true;
          break;
        }
      }
    }
    if (needsIdMigration && typeof generateAllIdPekerja === "function") {
      try {
        generateAllIdPekerja();
        v = readFast(DB_CONFIG.MASTER, "Data");
        h = v[0];
        idPek = getColIdx(h, ['idpekerja', 'id_pekerja', 'id']);
      } catch (eMig) {}
    }

    let idNama = getColIdx(h, ['namapekerja', 'nama_pekerja', 'nama', 'namalengkap']); if (idNama === -1) idNama = (idPek === 0 ? 1 : 0);
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = (idPek === 0 ? 2 : 1);
    let idRole = getColIdx(h, ['kategorirole', 'kategori_role', 'role', 'kategori']); if (idRole === -1) idRole = (idPek === 0 ? 3 : 2);
    let idPass = getColIdx(h, ['password', 'pass']); if (idPass === -1) idPass = (idPek === 0 ? 4 : 3);
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = (idPek === 0 ? 5 : 4);
    let idSIP = getColIdx(h, ['noregistrasi', 'no_registrasi', 'sip', 'noreg']); if (idSIP === -1) idSIP = (idPek === 0 ? 6 : 5);
    let idHP = getColIdx(h, ['nohp', 'no_hp', 'telepon', 'wa']); if (idHP === -1) idHP = (idPek === 0 ? 7 : 6);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm']); if (idJM === -1) idJM = (idPek === 0 ? 8 : 7);
    let idEmail = getColIdx(h, ['email', 'surel', 'e-mail']); if (idEmail === -1) idEmail = (idPek === 0 ? 9 : 8);

    let users = [];
    let counter = 0;
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idUser] && !r[idNama]) continue;
      counter++;
      let pVal = String(r[idPass] !== null && r[idPass] !== undefined ? r[idPass] : "").trim();
      let hasPass = pVal.length > 0;
      let isHashed = pVal.length === 64;
      let rawId = (idPek !== -1 && r[idPek]) ? String(r[idPek]).trim() : "";
      let snId = (rawId && rawId.toUpperCase().startsWith("SN-")) ? rawId : ("SN-" + String(counter).padStart(2, '0'));
      
      users.push({
        idPekerja: snId,
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
      sheet.appendRow(["ID_Pekerja", "Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"]);
    }

    let h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let idCol = getColIdx(h, ['idpekerja', 'id_pekerja', 'id']);
    let idNama = getColIdx(h, ['namapekerja', 'nama']); if (idNama === -1) idNama = (idCol === 0 ? 1 : 0);
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = (idCol === 0 ? 2 : 1);
    let idRole = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = (idCol === 0 ? 3 : 2);
    let idPass = getColIdx(h, ['password', 'pass']); if (idPass === -1) idPass = (idCol === 0 ? 4 : 3);
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = (idCol === 0 ? 5 : 4);
    let idSIP = getColIdx(h, ['noregistrasi', 'sip', 'noreg']); if (idSIP === -1) idSIP = (idCol === 0 ? 6 : 5);
    let idHP = getColIdx(h, ['nohp', 'no_hp', 'telepon', 'wa']); if (idHP === -1) idHP = (idCol === 0 ? 7 : 6);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persen_jm', 'persenjm']); if (idJM === -1) idJM = (idCol === 0 ? 8 : 7);
    let idEmail = getColIdx(h, ['email', 'surel', 'e-mail']);

    if (idEmail === -1) {
      idEmail = Math.max(9, h.length);
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

    let rClean = String(payload.role || "").trim();
    let isDokterRole = (rClean === "Dokter Gigi Spesialis" || rClean === "Dokter Gigi Umum");
    let pjmVal = isDokterRole && payload.persenJM !== undefined && payload.persenJM !== "" ? Number(payload.persenJM) : 0;
    if (pjmVal > 1) pjmVal = pjmVal / 100;

    let rawSt = String(payload.status || "Aktif").trim().toLowerCase();
    let normStatus = (rawSt === "tidak aktif" || rawSt === "non aktif" || rawSt === "nonaktif" || rawSt === "inactive") ? "Tidak Aktif" : "Aktif";

    if (rowIndex > 1) {
      // MODE EDIT
      sheet.getRange(rowIndex, idNama + 1).setValue(payload.nama.trim());
      sheet.getRange(rowIndex, idRole + 1).setValue(payload.role.trim());
      sheet.getRange(rowIndex, idStatus + 1).setValue(normStatus);
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

      // Otomatis input/sinkronkan Nama Pekerja, Role, dan Status ke RME Sheldon - 06 Master User & Role (Pengaturan_Tarif_Shift)
      try {
        if (typeof syncUserToPayrollTarifShift === 'function') {
          syncUserToPayrollTarifShift({
            nama: payload.nama.trim(),
            role: payload.role.trim(),
            status: normStatus
          });
        }
      } catch (eSyncPay) {
        Logger.log("Info auto-sync to payroll: " + eSyncPay.message);
      }

      invalidateMasterCache();
      return { success: true, message: "Akun user '" + cleanUser + "' berhasil diperbarui!" };
    } else {
      // MODE TAMBAH BARU
      if (!payload.password || String(payload.password).trim() === "") {
        return { success: false, message: "Password wajib diisi untuk user baru!" };
      }

      let newRow = new Array(Math.max(10, h.length, idEmail + 1)).fill("");
      let newId = payload.idPekerja || generateNextIdPekerja(payload.role, sheet);
      if (idCol !== -1) newRow[idCol] = newId;
      newRow[idNama] = payload.nama.trim();
      newRow[idUser] = cleanUser;
      newRow[idRole] = payload.role.trim();
      newRow[idPass] = String(payload.password).trim();
      newRow[idStatus] = normStatus;
      newRow[idSIP] = payload.noReg || "-";
      newRow[idHP] = payload.noHp || "";
      newRow[idJM] = pjmVal;
      newRow[idEmail] = String(payload.email || "").trim();

      sheet.appendRow(newRow);
      let lastRow = sheet.getLastRow();
      if (idCol !== -1) sheet.getRange(lastRow, idCol + 1).setNumberFormat("@");
      sheet.getRange(lastRow, idPass + 1).setNumberFormat("@");
      sheet.getRange(lastRow, idJM + 1).setNumberFormat("0.0%");

      catatLog("Master User", "Tambah user baru: " + cleanUser + " (" + payload.role + ")", payload.currentUser || "Super User");

      // Otomatis input/sinkronkan Nama Pekerja, Role, dan Status ke RME Sheldon - 06 Master User & Role (Pengaturan_Tarif_Shift)
      try {
        if (typeof syncUserToPayrollTarifShift === 'function') {
          syncUserToPayrollTarifShift({
            nama: payload.nama.trim(),
            role: payload.role.trim(),
            status: normStatus
          });
        }
      } catch (eSyncPay) {
        Logger.log("Info auto-sync to payroll: " + eSyncPay.message);
      }

      invalidateMasterCache();
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
    let idNama = getColIdx(h, ['namapekerja', 'nama']); if (idNama === -1) idNama = 0;
    let idRole = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = 2;
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;

    let cleanUser = String(username || "").trim().toLowerCase();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        sheet.getRange(i + 1, idStatus + 1).setValue("Aktif");
        catatLog("Master User", "Aktivasi akun user: " + cleanUser, currentUser || "Super Admin");

        // Otomatis sinkronkan status ke Pengaturan_Tarif_Shift
        try {
          if (typeof syncUserToPayrollTarifShift === 'function') {
            syncUserToPayrollTarifShift({
              nama: String(v[i][idNama] || "").trim(),
              role: String(v[i][idRole] || "").trim(),
              status: "Aktif"
            });
          }
        } catch (eSyncPay) {}

        invalidateMasterCache();
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
    let idNama = getColIdx(h, ['namapekerja', 'nama']); if (idNama === -1) idNama = 0;
    let idRole = getColIdx(h, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = 2;
    let idUser = getColIdx(h, ['username', 'user']); if (idUser === -1) idUser = 1;
    let idStatus = getColIdx(h, ['status']); if (idStatus === -1) idStatus = 4;

    let cleanUser = String(username).trim().toLowerCase();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idUser] || "").trim().toLowerCase() === cleanUser) {
        let namaTarget = String(v[i][idNama] || "").trim();
        let roleTarget = String(v[i][idRole] || "").trim();
        if (isPermanent) {
          sheet.deleteRow(i + 1);
          try {
            if (typeof syncUserToPayrollTarifShift === 'function') {
              syncUserToPayrollTarifShift({
                nama: namaTarget,
                role: roleTarget,
                status: "Non Aktif"
              });
            }
          } catch (eSyncPay) {}
          invalidateMasterCache();
          return { success: true, message: "Akun '" + username + "' berhasil dihapus permanen." };
        } else {
          sheet.getRange(i + 1, idStatus + 1).setValue("Non Aktif");
          try {
            if (typeof syncUserToPayrollTarifShift === 'function') {
              syncUserToPayrollTarifShift({
                nama: namaTarget,
                role: roleTarget,
                status: "Non Aktif"
              });
            }
          } catch (eSyncPay) {}
          invalidateMasterCache();
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
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("👥 Master User & Role")
      .addItem("➕ Buka Form Tambah/Edit User", "bukaFormUserMasterDialog")
      .addItem("📋 Buka Sidebar Kelola User", "bukaFormUserMasterSidebar")
      .addSeparator()
      .addItem("🔄 Sinkronkan Data ke Pengaturan Tarif Shift", "syncAllUsersToPayrollTarifShift")
      .addItem("⚙️ Setup Header & Format Sheet Data", "initFormatSheetUserMaster")
      .addToUi();

    ui.createMenu("⚙️ Pengaturan Tarif Shift")
      .addItem("➕ Buka Form Input / Edit Tarif Shift", "bukaFormTarifShiftDialog")
      .addItem("📋 Buka Sidebar Tarif Shift", "bukaFormTarifShiftSidebar")
      .addSeparator()
      .addItem("🔄 Sinkronkan Semua Pekerja dari Sheet Data", "syncAllUsersToPayrollTarifShift")
      .addToUi();
  } catch (e) {
    // Abaikan jika dipanggil di luar konteks Spreadsheet UI
  }
}

/**
 * Trigger otomatis onEdit pada Spreadsheet RME Sheldon - 06 Master User & Role.
 * Menjamin integritas:
 * 1. Di sheet Pengaturan_Tarif_Shift: Jika nama diinput/diedit di kolom C, cek validitas ke Sheet Data.
 *    Jika tidak ada di Sheet Data: tolak dan kosongkan cell.
 *    Jika ada di Sheet Data: otomatis isi ID_Aturan (TARIF-XXX) & Role dari Sheet Data.
 * 2. Di sheet Data: Jika ada penambahan / perubahan nama / role, sinkronkan ke Pengaturan_Tarif_Shift.
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    const sheetName = sh.getName();
    const row = e.range.getRow();
    if (row <= 1) return; // Header edit diabaikan

    if (sheetName === "Pengaturan_Tarif_Shift") {
      var col = e.range.getColumn();
      if (col === 3) { // Kolom C: Nama_Pekerja diedit langsung di spreadsheet
        var enteredNama = String(e.value || e.range.getValue() || "").trim();
        if (enteredNama) {
          var ss = sh.getParent();
          var sData = ss.getSheetByName("Data");
          var found = null;
          if (sData) {
            var lRow = sData.getLastRow();
            if (lRow >= 2) {
              var uVals = sData.getRange(2, 1, lRow - 1, Math.min(10, sData.getLastColumn())).getValues();
              for (var u = 0; u < uVals.length; u++) {
                if (String(uVals[u][1] || "").trim().toLowerCase() === enteredNama.toLowerCase()) {
                  found = {
                    idPekerja: String(uVals[u][0] || "").trim(),
                    nama: String(uVals[u][1]).trim(),
                    role: String(uVals[u][3] || "Staff").trim(),
                    status: String(uVals[u][5] || "Aktif").trim()
                  };
                  break;
                }
              }
            }
          }

          if (!found) {
            e.range.setValue(""); // Kosongkan cell karena nama tidak valid
            try {
              SpreadsheetApp.getUi().alert("❌ Ditolak!\n\nNama \"" + enteredNama + "\" belum terdaftar di Sheet Data.\nSilakan daftarkan pekerja di Sheet Data terlebih dahulu.");
            } catch(uiErr) {}
            return;
          }

          // Auto-fill Kolom A (ID_Pekerja), B (Role), I (Status), J (Timestamp)
          var curId = String(sh.getRange(row, 1).getValue() || "").trim();
          if (!curId || curId.toUpperCase().startsWith("TARIF")) {
            if (found.idPekerja && /^SN-\d+$/i.test(found.idPekerja)) {
              sh.getRange(row, 1).setValue(found.idPekerja.toUpperCase());
            } else {
              var maxId = 0;
              var allIds = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 1).getValues();
              for (var k = 0; k < allIds.length; k++) {
                var m = String(allIds[k][0] || "").match(/SN-(\d+)/i);
                if (m) {
                  var num = parseInt(m[1], 10);
                  if (num > maxId) maxId = num;
                }
              }
              sh.getRange(row, 1).setValue("SN-" + String(maxId + 1).padStart(2, '0'));
            }
          }
          sh.getRange(row, 2).setValue(found.role);
          if (!sh.getRange(row, 9).getValue()) {
            sh.getRange(row, 9).setValue(found.status || "Aktif");
          }
          sh.getRange(row, 10).setValue(new Date());
        }
      }
    } else if (sheetName === "Data") {
      if (typeof syncAllUsersToPayrollTarifShift === "function") {
        syncAllUsersToPayrollTarifShift();
      }
    }
  } catch (err) {
    Logger.log("Info onEdit: " + err.message);
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
 * Menampilkan Form Input/Edit Pengaturan Tarif Shift dalam bentuk Modal Dialog di Spreadsheet
 */
function bukaFormTarifShiftDialog() {
  const html = HtmlService.createHtmlOutput(getHtmlFormTarifShiftContent())
    .setWidth(620)
    .setHeight(620)
    .setTitle("Form Pengaturan Tarif Shift & Gaji - RME Sheldon");
  SpreadsheetApp.getUi().showModalDialog(html, "⚙️ Form Pengaturan Tarif Shift");
}

/**
 * Menampilkan Form Input/Edit Pengaturan Tarif Shift dalam bentuk Sidebar di Spreadsheet
 */
function bukaFormTarifShiftSidebar() {
  const html = HtmlService.createHtmlOutput(getHtmlFormTarifShiftContent())
    .setTitle("Pengaturan Tarif Shift");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Mengambil daftar user dari Sheet Data untuk dropdown Form Tarif Shift
 */
function getUsersForTarifDropdown() {
  try {
    var ssUser = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    if (!ssUser) return [];
    var sheetData = ssUser.getSheetByName("Data");
    if (!sheetData) return [];
    var lastRow = sheetData.getLastRow();
    if (lastRow < 2) return [];
    var vals = sheetData.getRange(2, 1, lastRow - 1, Math.min(10, sheetData.getLastColumn())).getValues();
    var res = [];
    for (var i = 0; i < vals.length; i++) {
      var idPekerja = String(vals[i][0] || "").trim();
      var nama = String(vals[i][1] || "").trim();
      var role = String(vals[i][3] || "Staff").trim();
      var status = String(vals[i][5] || "Aktif").trim();
      if (nama) {
        res.push({ idPekerja: idPekerja, nama: nama, role: role, status: status });
      }
    }
    return res;
  } catch (e) {
    return [];
  }
}

/**
 * Template HTML Form Pengaturan Tarif Shift untuk Dialog / Sidebar Spreadsheet
 */
function getHtmlFormTarifShiftContent() {
  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <meta charset="utf-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <script src="https://cdn.tailwindcss.com"></script>' +
'  <style>' +
'    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; }' +
'  </style>' +
'</head>' +
'<body class="bg-slate-50 text-slate-800 p-4 text-xs">' +
'  <div class="max-w-xl mx-auto bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">' +
'    <div class="flex items-center gap-3 pb-3 border-b border-slate-100">' +
'      <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl">⚙️</div>' +
'      <div>' +
'        <h1 class="text-sm font-black text-slate-800">Form Pengaturan Tarif Shift & Gaji</h1>' +
'        <p class="text-[11px] text-slate-500">Tersimpan ke Sheet: <b>Pengaturan_Tarif_Shift</b> (06 Master User & Role)</p>' +
'      </div>' +
'    </div>' +
'    <form id="formTarifDialog" onsubmit="submitTarifForm(event)" class="space-y-3.5">' +
'      <div>' +
'        <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Nama Pekerja (Wajib Terdaftar di Sheet Data) *</label>' +
'        <select id="diagNama" required onchange="handleDiagNamaChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs">' +
'          <option value="">Memuat nama pekerja dari Sheet Data...</option>' +
'        </select>' +
'        <p id="diagNamaHint" class="text-[10px] text-slate-500 mt-1">Daftar nama diambil otomatis dari Sheet Data</p>' +
'      </div>' +
'      <div class="grid grid-cols-2 gap-3">' +
'        <div>' +
'          <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Role Jabatan (Otomatis)</label>' +
'          <input type="text" id="diagRole" readonly placeholder="(Otomatis terisi)" class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs">' +
'        </div>' +
'        <div>' +
'          <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Tipe Kompensasi *</label>' +
'          <select id="diagTipe" onchange="handleDiagTipeChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs">' +
'            <option value="" selected>-- Pilih Tipe Kompensasi --</option>' +
'            <option value="Tindakan">Tindakan</option>' +
'            <option value="Uang Harian Shift">Uang Harian Shift</option>' +
'            <option value="Gaji Bulanan Tetap">Gaji Bulanan Tetap</option>' +
'            <option value="Kombinasi Shift & Tindakan">Kombinasi Shift & Tindakan</option>' +
'          </select>' +
'        </div>' +
'      </div>' +
'      <div class="grid grid-cols-2 gap-3">' +
'        <div>' +
'          <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Tarif Shift 1 (Rp)</label>' +
'          <input type="number" id="diagShift1" value="0" disabled class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 text-xs cursor-not-allowed">' +
'        </div>' +
'        <div>' +
'          <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Tarif Shift 2 (Rp)</label>' +
'          <input type="number" id="diagShift2" value="0" disabled class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 text-xs cursor-not-allowed">' +
'        </div>' +
'      </div>' +
'      <div>' +
'        <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Gaji Pokok Bulanan Tetap (Khusus Admin Non-Shift)</label>' +
'        <input type="number" id="diagGajiPokok" value="0" disabled class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 text-xs cursor-not-allowed">' +
'      </div>' +
'      <div>' +
'        <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Keterangan (Opsional)</label>' +
'        <input type="text" id="diagKeterangan" placeholder="Catatan tambahan bila diperlukan (opsional)" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs">' +
'      </div>' +
'      <div>' +
'        <label class="block font-black text-slate-700 mb-1 uppercase text-[10px]">Status Aktivasi Payroll *</label>' +
'        <select id="diagStatus" class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs">' +
'          <option value="Aktif" selected>Aktif (Dihitung di Payroll & Slip Gaji)</option>' +
'          <option value="Tidak Aktif">Tidak Aktif (Tidak Dihitung di Payroll)</option>' +
'        </select>' +
'      </div>' +
'      <div id="diagAlert" class="hidden p-3 rounded-xl text-xs font-bold"></div>' +
'      <button type="submit" id="btnSubmitDiag" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all text-xs">' +
'        💾 SIMPAN KE PENGATURAN TARIF SHIFT' +
'      </button>' +
'    </form>' +
'  </div>' +
'  <script>' +
'    var listStaff = [];' +
'    window.onload = function() {' +
'      handleDiagTipeChange();' +
'      google.script.run' +
'        .withSuccessHandler(function(data) {' +
'          listStaff = data || [];' +
'          var sel = document.getElementById("diagNama");' +
'          if (listStaff.length === 0) {' +
'            sel.innerHTML = "<option value=\'\'>Belum ada staf terdaftar di Sheet Data</option>";' +
'            return;' +
'          }' +
'          sel.innerHTML = "<option value=\'\'>-- Pilih Pekerja Terdaftar --</option>" +' +
'            listStaff.map(function(s) { return "<option value=\'" + s.nama + "\'>" + s.nama + " (" + (s.role || "Staf") + ")</option>"; }).join("");' +
'        })' +
'        .getUsersForTarifDropdown();' +
'    };' +
'    function handleDiagTipeChange() {' +
'      var tipe = (document.getElementById("diagTipe") || {}).value || "";' +
'      var s1 = document.getElementById("diagShift1");' +
'      var s2 = document.getElementById("diagShift2");' +
'      var gp = document.getElementById("diagGajiPokok");' +
'      if (!s1 || !s2 || !gp) return;' +
'      function setSt(el, en, defV) {' +
'        el.disabled = !en;' +
'        if (!en) { el.value = defV || 0; el.className = "w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-400 text-xs cursor-not-allowed"; }' +
'        else { el.className = "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"; if (defV > 0 && (!el.value || el.value === "0")) el.value = defV; }' +
'      }' +
'      if (tipe === "Tindakan") { setSt(s1, false, 0); setSt(s2, false, 0); setSt(gp, false, 0); }' +
'      else if (tipe === "Uang Harian Shift") { setSt(s1, true, 45000); setSt(s2, true, 45000); setSt(gp, false, 0); }' +
'      else if (tipe === "Gaji Bulanan Tetap") { setSt(s1, false, 0); setSt(s2, false, 0); setSt(gp, true, 1200000); }' +
'      else if (tipe === "Kombinasi Shift & Tindakan") { setSt(s1, true, 55000); setSt(s2, true, 55000); setSt(gp, false, 0); }' +
'      else { setSt(s1, false, 0); setSt(s2, false, 0); setSt(gp, false, 0); }' +
'    }' +
'    function handleDiagNamaChange() {' +
'      var nama = document.getElementById("diagNama").value;' +
'      var found = listStaff.find(function(s) { return s.nama === nama; });' +
'      var roleInput = document.getElementById("diagRole");' +
'      if (found) {' +
'        roleInput.value = found.role || "Staf";' +
'      } else {' +
'        roleInput.value = "";' +
'      }' +
'    }' +
'    function submitTarifForm(e) {' +
'      e.preventDefault();' +
'      var btn = document.getElementById("btnSubmitDiag");' +
'      var alertDiv = document.getElementById("diagAlert");' +
'      btn.disabled = true;' +
'      btn.innerText = "⏳ Menyimpan...";' +
'      alertDiv.className = "hidden";' +
'      var payload = {' +
'        namaPekerja: document.getElementById("diagNama").value,' +
'        tipeKompensasi: document.getElementById("diagTipe").value,' +
'        tarifShift1: Number(document.getElementById("diagShift1").value) || 0,' +
'        tarifShift2: Number(document.getElementById("diagShift2").value) || 0,' +
'        gajiPokokBulanan: Number(document.getElementById("diagGajiPokok").value) || 0,' +
'        keterangan: document.getElementById("diagKeterangan").value,' +
'        status: document.getElementById("diagStatus").value' +
'      };' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          btn.disabled = false;' +
'          btn.innerText = "💾 SIMPAN KE PENGATURAN TARIF SHIFT";' +
'          alertDiv.classList.remove("hidden");' +
'          if (res && res.success) {' +
'            alertDiv.className = "p-3 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";' +
'            alertDiv.innerText = "✅ " + (res.message || "Berhasil disimpan!");' +
'            setTimeout(function() { google.script.host.close(); }, 1600);' +
'          } else {' +
'            alertDiv.className = "p-3 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200";' +
'            alertDiv.innerText = "❌ " + ((res && res.message) ? res.message : "Gagal menyimpan.");' +
'          }' +
'        })' +
'        .withFailureHandler(function(err) {' +
'          btn.disabled = false;' +
'          btn.innerText = "💾 SIMPAN KE PENGATURAN TARIF SHIFT";' +
'          alertDiv.classList.remove("hidden");' +
'          alertDiv.className = "p-3 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200";' +
'          alertDiv.innerText = "❌ Error: " + (err.message || err);' +
'        })' +
'        .simpanTarifShift(payload);' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

function generateNextIdPekerja(role, sheet) {
  const prefix = "SN-";
  let maxNum = 0;
  if (!sheet) {
    try {
      const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
      sheet = ss.getSheetByName("Data");
    } catch(e) {}
  }
  if (!sheet) return prefix + "01";
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return prefix + "01";
  
  const headers = data[0].map(h => String(h || "").trim().toLowerCase());
  let colId = headers.indexOf("id_pekerja");
  if (colId === -1) colId = 0;

  for (let i = 1; i < data.length; i++) {
    let val = String(data[i][colId] || "").trim();
    if (val.toUpperCase().startsWith(prefix.toUpperCase())) {
      let numPart = val.substring(prefix.length);
      let n = parseInt(numPart, 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return prefix + String(maxNum + 1).padStart(2, '0');
}

/**
 * GENERATE & UPDATE SELURUH ID PEKERJA DENGAN FORMAT SN-XX (2 DIGIT)
 * Mengisi ID_Pekerja di sheet 'Data' dan memperbarui ID di sheet 'Pengaturan_Tarif_Shift'
 */
function generateAllIdPekerja() {
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    let sheetData = ss.getSheetByName("Data");
    if (!sheetData) return { success: false, message: "Sheet Data tidak ditemukan!" };

    let data = sheetData.getDataRange().getValues();
    if (data.length === 0) return { success: false, message: "Sheet Data kosong!" };

    let headers = data[0].map(h => String(h || "").trim());
    let headersLow = headers.map(h => h.toLowerCase());
    let colId = headersLow.indexOf("id_pekerja");

    if (colId === -1) {
      sheetData.insertColumnBefore(1);
      sheetData.getRange(1, 1).setValue("ID_Pekerja").setFontWeight("bold").setBackground("#e2e8f0");
      colId = 0;
      data = sheetData.getDataRange().getValues();
      headers = data[0].map(h => String(h || "").trim());
      headersLow = headers.map(h => h.toLowerCase());
    }

    let colNama = headersLow.indexOf("nama_pekerja"); if (colNama === -1) colNama = 1;
    let colRole = headersLow.indexOf("kategori_role"); if (colRole === -1) colRole = 3;

    let counter = 0;
    const idMapByNama = {};

    for (let i = 1; i < data.length; i++) {
      let r = data[i];
      let nama = String(r[colNama] || "").trim();
      if (!nama) continue;

      counter++;
      let newId = "SN-" + String(counter).padStart(2, '0');

      sheetData.getRange(i + 1, colId + 1).setValue(newId).setNumberFormat("@");
      idMapByNama[nama.toLowerCase()] = newId;
    }

    let shTarif = ss.getSheetByName("Pengaturan_Tarif_Shift");
    if (shTarif && shTarif.getLastRow() > 1) {
      let tData = shTarif.getDataRange().getValues();
      let tHeaders = tData[0].map(h => String(h || "").trim().toLowerCase());
      let tColId = tHeaders.indexOf("id_pekerja");
      if (tColId === -1) tColId = tHeaders.indexOf("id_aturan");
      if (tColId === -1) tColId = 0;

      shTarif.getRange(1, tColId + 1).setValue("ID_Pekerja").setFontWeight("bold").setBackground("#e2e8f0");

      let tColNama = tHeaders.indexOf("nama_pekerja");
      if (tColNama === -1) tColNama = 2;

      for (let j = 1; j < tData.length; j++) {
        let tNama = String(tData[j][tColNama] || "").trim().toLowerCase();
        if (idMapByNama[tNama]) {
          shTarif.getRange(j + 1, tColId + 1).setValue(idMapByNama[tNama]);
        }
      }
    }

    sheetData.getRange(2, colId + 1, sheetData.getLastRow() - 1, 1).setNumberFormat("@");

    const msg = "✅ Berhasil membuat & memperbarui seluruh ID_Pekerja di Sheet Data dan Pengaturan_Tarif_Shift!";
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
    return { success: true, message: msg };
  } catch (err) {
    const errMsg = "Gagal generateAllIdPekerja: " + err.message;
    try { SpreadsheetApp.getUi().alert(errMsg); } catch (e) { Logger.log(errMsg); }
    return { success: false, message: errMsg };
  }
}

/**
 * Format Header dan Validasi Dropdown Role pada Sheet Data (RME Sheldon - 06 Master User & Role)
 */
function initFormatSheetUserMaster() {
  try {
    const ss = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    let sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    
    const headers = ["ID_Pekerja", "Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);

    const validRoles = [
      "Owner",
      "Dokter Gigi Spesialis",
      "Dokter Gigi Umum",
      "Perawat Gigi",
      "Perawat Umum",
      "Admin",
      "Office"
    ];

    const ruleRole = SpreadsheetApp.newDataValidation()
      .requireValueInList(validRoles, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 4, 100, 1).setDataValidation(ruleRole); // Column D

    const ruleStatus = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Aktif", "Tidak Aktif"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 6, 100, 1).setDataValidation(ruleStatus); // Column F

    sheet.getRange(2, 1, 100, 1).setNumberFormat("@"); // ID_Pekerja plain text format
    sheet.getRange(2, 5, 100, 1).setNumberFormat("@"); // Password plain text format
    sheet.getRange(2, 9, 100, 1).setNumberFormat("0.0%"); // Persen JM format

    SpreadsheetApp.getUi().alert("✅ Berhasil menyiapkan format sheet 'Data' (termasuk kolom ID_Pekerja & Email) dan validasi Kategori Role di Spreadsheet RME Sheldon - 06 Master User & Role!");
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
'          <h1 class="text-sm font-black text-slate-800">Form Master User & Role (Khusus Owner)</h1>' +
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
'              <option value="Owner">Owner</option>' +
'              <option value="Dokter Gigi Spesialis">Dokter Gigi Spesialis</option>' +
'              <option value="Dokter Gigi Umum">Dokter Gigi Umum</option>' +
'              <option value="Perawat Gigi">Perawat Gigi</option>' +
'              <option value="Perawat Umum">Perawat Umum</option>' +
'              <option value="Admin">Admin</option>' +
'              <option value="Office">Office</option>' +
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
'      const role = (document.getElementById("inRole").value || "").trim();' +
'      const wrap = document.getElementById("wrapJM");' +
'      const jmInput = document.getElementById("inPersenJM");' +
'      const isDokter = (role === "Dokter Gigi Spesialis" || role === "Dokter Gigi Umum");' +
'      if (isDokter) {' +
'        wrap.classList.remove("hidden");' +
'        if (jmInput && !jmInput.value) jmInput.value = "0";' +
'      } else {' +
'        wrap.classList.add("hidden");' +
'        if (jmInput) jmInput.value = "0";' +
'      }' +
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
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
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
    invalidateMasterCache();
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
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
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
    invalidateMasterCache();
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
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
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
    invalidateMasterCache();
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
    
    // Deteksi cerdas pergeseran header atau Column 1 di Google Sheets live
    let isShifted = false;
    let hFirstClean = String(h[0] || '').toLowerCase().replace(/[\s_.]/g, '');
    if (hFirstClean.includes('column1') || (h.length >= 12 && String(h[6] || '').toLowerCase().includes('idaturan'))) {
      isShifted = true;
    }

    let idAturanCol = getColIdx(h, ['idaturan', 'id_aturan', 'id', 'kode_aturan']);
    let idDok = getColIdx(h, ['namadokter', 'dokter', 'nama_dokter']);
    let idC = getColIdx(h, ['idtindakan', 'id_tindakan', 'kodetindakan', 'kode', 'kode_tindakan']);
    let idN = getColIdx(h, ['namatindakan', 'tindakan', 'nama_tindakan']);
    let idTarifCol = getColIdx(h, ['tarif', 'harga', 'tarif_tindakan']);
    let idLaborCol = getColIdx(h, ['labor', 'laboratorium', 'biaya_lab']);
    let idJM = getColIdx(h, ['persen_jm_dokter', 'persenjm', 'persen_jm', 'persen_jm_khusus']);
    let idKet = getColIdx(h, ['keterangan', 'catatan', 'simulasi']);

    // Jika header tergeser atau data di kolom 0..5 terisi sementara idDok > 5 kosong
    if (!isShifted && idDok > 5 && v.length > 1 && !v[1][idDok] && String(v[1][1] || '').toLowerCase().includes('drg')) {
      isShifted = true;
    }

    // Ambil master tindakan sebagai fallback tarif & labor
    let allTindakan = [];
    try {
      allTindakan = typeof getDaftarTindakanLengkap === 'function' ? getDaftarTindakanLengkap() : [];
    } catch (eT) {}

    let results = [];
    let counter = 0;

    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r || !r.some(cell => String(cell || '').trim() !== '')) continue;

      let idA = '', dok = '', idT = '', namaT = '', tarif = 0, labor = 'Tidak', pct = 0, ket = '';

      if (isShifted) {
        // Mode shifted: data ada di 6 kolom pertama (0..5)
        // 0: ID_Aturan, 1: Nama_Dokter, 2: Kode_Tindakan, 3: Nama_Tindakan, 4: Persen_JM, 5: Keterangan
        idA = String(r[0] || '').trim();
        dok = String(r[1] || '').trim();
        idT = String(r[2] || '').trim();
        namaT = String(r[3] || '').trim();
        let rawPct = String(r[4] || '').replace('%', '').trim();
        pct = Number(rawPct) || 0;
        if (pct > 1) pct = pct / 100;
        ket = String(r[5] || '').trim();
      } else {
        // Mode standar / header terpetakan
        idA = idAturanCol !== -1 ? String(r[idAturanCol] || '').trim() : '';
        dok = idDok !== -1 ? String(r[idDok] || '').trim() : '';
        idT = idC !== -1 ? String(r[idC] || '').trim() : '';
        namaT = idN !== -1 ? String(r[idN] || '').trim() : '';
        let rawPct = idJM !== -1 ? String(r[idJM] || '').replace('%', '').trim() : '0';
        pct = Number(rawPct) || 0;
        if (pct > 1) pct = pct / 100;
        tarif = idTarifCol !== -1 ? (Number(String(r[idTarifCol] || '').replace(/,/g, '')) || 0) : 0;
        labor = idLaborCol !== -1 ? String(r[idLaborCol] || 'Tidak').trim() : 'Tidak';
        ket = idKet !== -1 ? String(r[idKet] || '').trim() : '';
      }

      if (!dok) continue;
      counter++;

      if (!idA) {
        idA = 'TKD-' + String(counter).padStart(2, '0');
      }

      // Lookup tarif dan status lab jika belum ada
      if (allTindakan.length > 0) {
        let matchT = allTindakan.find(t => (idT && t.kode === idT) || (namaT && t.nama.toLowerCase() === namaT.toLowerCase()));
        if (matchT) {
          if (!idT) idT = matchT.kode;
          if (!namaT) namaT = matchT.nama;
          if (tarif <= 0) tarif = matchT.harga || matchT.tarif || 0;
          if (labor === 'Tidak' && matchT.perluLab === 'Ya') labor = 'Ya';
        }
      }

      results.push({
        idAturan: idA,
        dokter: dok,
        namaDokter: dok,
        kode: idT,
        idTindakan: idT,
        nama: namaT,
        namaTindakan: namaT,
        tarif: tarif,
        labor: labor,
        persenJM: pct,
        persenJMDisplay: Math.round(pct * 100) + '%',
        keterangan: ket
      });
    }

    return results;
  } catch (e) {
    Logger.log("Error getTarifKhususDokter: " + e.message);
    return [];
  }
}

/**
 * Normalisasi otomatis sheet Tarif_Khusus_Dokter di Google Sheets live jika terdapat
 * header bergeser ('Column 1' .. 'Column 6') atau inkonsistensi struktur kolom.
 */
function healTarifKhususDokterSheet(ssId) {
  try {
    const idDb = ssId || DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idDb, "Tarif_Khusus_Dokter");
    if (!sheet) return false;

    let data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false;

    let h = data[0];
    let h0 = String(h[0] || '').toLowerCase().replace(/[\s_.]/g, '');
    let isBroken = h0.includes('column1') || (h.length >= 12 && String(h[6] || '').toLowerCase().includes('idaturan'));

    if (isBroken) {
      let cleanedRules = getTarifKhususDokter();
      sheet.clear();
      sheet.appendRow(["ID_Aturan", "Nama_Dokter", "ID_Tindakan", "Nama_Tindakan", "Tarif", "Labor", "Persen_JM_Dokter", "Keterangan"]);
      
      let newRows = cleanedRules.map(r => [
        r.idAturan,
        r.namaDokter,
        r.idTindakan,
        r.namaTindakan,
        r.tarif,
        r.labor,
        r.persenJM,
        r.keterangan
      ]);

      if (newRows.length > 0) {
        sheet.getRange(2, 1, newRows.length, 8).setValues(newRows);
      }
      
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      sheet.getRange(2, 5, Math.max(1, newRows.length), 1).setNumberFormat("#,##0");
      sheet.getRange(2, 7, Math.max(1, newRows.length), 1).setNumberFormat("0.0%");
      Logger.log("✅ Berhasil menormalisasi Sheet Tarif_Khusus_Dokter menjadi 8 kolom resmi.");
      return true;
    }
    return false;
  } catch (e) {
    Logger.log("healTarifKhususDokterSheet error: " + e.message);
    return false;
  }
}

function simpanTarifKhususDokter(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const idDb = DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idDb, "Tarif_Khusus_Dokter");
    if (!sheet) return { success: false, message: "Sheet Tarif_Khusus_Dokter tidak ditemukan di Database." };

    healTarifKhususDokterSheet(idDb);
    let data = sheet.getDataRange().getValues();
    if (data.length === 0 || !data[0] || data[0].length < 8) {
      sheet.clear();
      sheet.appendRow(["ID_Aturan", "Nama_Dokter", "ID_Tindakan", "Nama_Tindakan", "Tarif", "Labor", "Persen_JM_Dokter", "Keterangan"]);
      data = sheet.getDataRange().getValues();
    }

    let h = data[0];
    let idAturanCol = getColIdx(h, ['idaturan', 'id_aturan', 'id', 'kode_aturan']);
    let idDokCol = getColIdx(h, ['namadokter', 'dokter', 'nama_dokter']);
    let idTindakanCol = getColIdx(h, ['idtindakan', 'id_tindakan', 'kodetindakan', 'kode', 'kode_tindakan']);
    let idNamaCol = getColIdx(h, ['namatindakan', 'tindakan', 'nama_tindakan']);

    let targetIdAturan = String(payload.idAturan || '').trim();
    let namaDokter = String(payload.namaDokter || payload.dokter || '').trim();
    let idTindakan = String(payload.idTindakan || payload.kode || '').trim();
    let namaTindakan = String(payload.namaTindakan || payload.nama || '').trim();
    let tarif = Number(payload.tarif) || 0;
    let labor = String(payload.labor || 'Tidak').trim();
    let persenJM = Number(payload.persenJM) || 0;
    if (persenJM > 1) persenJM = persenJM / 100;
    let keterangan = String(payload.keterangan || '').trim();

    // Auto increase ID Aturan: TKD-XX (2 digit) jika belum ada
    if (!targetIdAturan || targetIdAturan === 'AUTO' || !targetIdAturan.startsWith('TKD-')) {
      let maxNum = 0;
      for (let i = 1; i < data.length; i++) {
        let curId = idAturanCol !== -1 ? String(data[i][idAturanCol] || '').trim().toUpperCase() : '';
        let m = curId.match(/TKD-(\d+)/);
        if (m) {
          let n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      targetIdAturan = "TKD-" + String(maxNum + 1).padStart(2, '0');
    }

    if (!keterangan) {
      keterangan = namaDokter + ": " + namaTindakan + " JM Khusus " + Math.round(persenJM * 100) + "%";
    }

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      let curId = idAturanCol !== -1 ? String(data[i][idAturanCol] || '').trim() : '';
      if (curId === targetIdAturan) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      for (let i = 1; i < data.length; i++) {
        let curDok = idDokCol !== -1 ? String(data[i][idDokCol] || '').trim() : '';
        let curTind = idNamaCol !== -1 ? String(data[i][idNamaCol] || '').trim() : '';
        let curKode = idTindakanCol !== -1 ? String(data[i][idTindakanCol] || '').trim() : '';
        if (curDok === namaDokter && (curTind === namaTindakan || (idTindakan && curKode === idTindakan))) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    let newRow = [
      targetIdAturan,
      namaDokter,
      idTindakan,
      namaTindakan,
      tarif,
      labor,
      persenJM,
      keterangan
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    try {
      sheet.getRange(2, 7, Math.max(1, sheet.getLastRow() - 1), 1).setNumberFormat("0.0%");
      sheet.getRange(2, 5, Math.max(1, sheet.getLastRow() - 1), 1).setNumberFormat("#,##0");
    } catch (eFmt) {}

    invalidateMasterCache();
    return {
      success: true,
      message: "Aturan tarif khusus " + targetIdAturan + " untuk " + namaDokter + " berhasil disimpan!",
      idAturan: targetIdAturan
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan aturan khusus: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function hapusTarifKhususDokter(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const idDb = DB_CONFIG.DATABASE;
    const sheet = getSheetEksternal(idDb, "Tarif_Khusus_Dokter");
    if (!sheet) return { success: false, message: "Sheet Tarif_Khusus_Dokter tidak ditemukan." };

    let targetId = (typeof payload === 'string') ? payload.trim() : String(payload.idAturan || payload.id || '').trim();
    if (!targetId) return { success: false, message: "ID Aturan tidak valid untuk dihapus." };

    let data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "Belum ada data aturan di sheet." };

    let h = data[0];
    let idAturanCol = getColIdx(h, ['idaturan', 'id_aturan', 'id', 'kode_aturan']);
    let deleted = false;

    for (let i = 1; i < data.length; i++) {
      let curId = idAturanCol !== -1 ? String(data[i][idAturanCol] || '').trim() : '';
      if (curId === targetId) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return { success: false, message: "Aturan " + targetId + " tidak ditemukan di Database." };
    }

    invalidateMasterCache();
    return { success: true, message: "Aturan tindakan khusus " + targetId + " berhasil dihapus!" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus aturan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function simpanObatBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
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
    invalidateMasterCache();
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
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
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
    invalidateMasterCache();
    return { success: true, message: "BMHP berhasil disimpan di Database Master!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan BMHP: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

