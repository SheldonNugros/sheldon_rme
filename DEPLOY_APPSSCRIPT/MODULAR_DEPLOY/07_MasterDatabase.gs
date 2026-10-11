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

