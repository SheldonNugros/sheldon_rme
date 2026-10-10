/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: RME SHELDON - 06 MASTER USER & ROLE
 * =========================================================================
 * Form & Backend Script Kelola User, Password, dan Role
 * Sesuai Spreadsheet: RME Sheldon - 06 Master User & Role (Sheet: Data)
 * 
 * Kategori Role Resmi (Title Case):
 * 1. Super User
 * 2. Dokter Gigi Umum
 * 3. Dokter Gigi Spesialis
 * 4. Perawat Umum
 * 5. Perawat Gigi
 * 6. Admin
 * 7. Owner
 * =========================================================================
 */

// Konfigurasi Database Master User
const MASTER_USER_CONFIG = {
  SHEET_NAME: "Data",
  // ID Spreadsheet RME Sheldon - 06 Master User & Role
  SPREADSHEET_ID: "1e_UqCBpqs-YBF2XRsaoW3yG1r8o3nNDI1vGPQyp8nCE",
  HEADERS: [
    "Nama_Pekerja",
    "Username",
    "Kategori_Role",
    "Password",
    "Status",
    "No_Registrasi",
    "No_HP",
    "Persen_JM_Dokter"
  ],
  ROLES: [
    "Super User",
    "Dokter Gigi Umum",
    "Dokter Gigi Spesialis",
    "Perawat Umum",
    "Perawat Gigi",
    "Admin",
    "Owner"
  ]
};

/**
 * 1. FUNGSI MENU OTOMATIS SAAT SPREADSHEET DIBUKA
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
    Logger.log("onOpen non-UI context: " + e.message);
  }
}

/**
 * 2. MENAMPILKAN FORM SEBAGAI MODAL DIALOG (POP-UP)
 */
function bukaFormUserMasterDialog() {
  const html = HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
    .setWidth(850)
    .setHeight(680)
    .setTitle("Form Kelola User & Role - RME Sheldon");
  SpreadsheetApp.getUi().showModalDialog(html, "👤 Form Master User & Role");
}

/**
 * 3. MENAMPILKAN FORM SEBAGAI SIDEBAR
 */
function bukaFormUserMasterSidebar() {
  const html = HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
    .setTitle("Kelola User & Role");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * 4. ENDPOINT WEB APP (doGet & doPost)
 * Bisa dibuka langsung via browser atau dipanggil dari frontend Vercel
 */
function doGet(e) {
  // Jika dibuka langsung via link web app, tampilkan form pengguna
  return HtmlService.createHtmlOutput(getHtmlFormUserMasterContent())
    .setTitle("Form Master User & Role - RME Sheldon")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
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
    let payload = Array.isArray(params) && params.length > 0 ? params[0] : (body.payload || body);

    let result = { success: false, message: "Aksi tidak dikenal: " + action };

    if (action === "getDaftarUserMaster") {
      result = getDaftarUserMaster();
    } else if (action === "simpanUserMaster") {
      result = simpanUserMaster(payload);
    } else if (action === "hapusUserMaster") {
      let username = Array.isArray(params) ? params[0] : (payload.username || "");
      let isPerm = Array.isArray(params) && params.length > 1 ? params[1] : (payload.isPermanent || false);
      result = hapusUserMaster(username, isPerm);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mendapatkan referensi Sheet "Data"
 */
function getSheetUserMaster() {
  let ss;
  if (MASTER_USER_CONFIG.SPREADSHEET_ID && MASTER_USER_CONFIG.SPREADSHEET_ID.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(MASTER_USER_CONFIG.SPREADSHEET_ID.trim());
    } catch (e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  let sheet = ss.getSheetByName(MASTER_USER_CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_USER_CONFIG.SHEET_NAME);
    sheet.appendRow(MASTER_USER_CONFIG.HEADERS);
    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 5. MENGAMBIL SELURUH DAFTAR PENGGUNA DARI SPREADSHEET
 */
function getDaftarUserMaster() {
  try {
    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let colNama = headers.indexOf("nama_pekerja"); if (colNama === -1) colNama = 0;
    let colUser = headers.indexOf("username"); if (colUser === -1) colUser = 1;
    let colRole = headers.indexOf("kategori_role"); if (colRole === -1) colRole = 2;
    let colPass = headers.indexOf("password"); if (colPass === -1) colPass = 3;
    let colStatus = headers.indexOf("status"); if (colStatus === -1) colStatus = 4;
    let colReg = headers.indexOf("no_registrasi"); if (colReg === -1) colReg = 5;
    let colHp = headers.indexOf("no_hp"); if (colHp === -1) colHp = 6;
    let colJM = headers.indexOf("persen_jm_dokter"); if (colJM === -1) colJM = 7;

    let result = [];
    for (let i = 1; i < data.length; i++) {
      let r = data[i];
      let username = String(r[colUser] || "").trim();
      let nama = String(r[colNama] || "").trim();
      if (!username && !nama) continue;

      let passVal = String(r[colPass] !== null && r[colPass] !== undefined ? r[colPass] : "").trim();
      let hasPass = passVal.length > 0;
      let isHashed = passVal.length === 64;
      let jmVal = (colJM !== -1 && r[colJM] !== "" && r[colJM] !== null && r[colJM] !== undefined) ? Number(r[colJM]) : 0;

      result.push({
        nama: nama,
        username: username,
        role: String(r[colRole] || "Staff").trim(),
        hasPassword: hasPass,
        isHashed: isHashed,
        status: String(r[colStatus] || "Aktif").trim(),
        noReg: String(r[colReg] || "-").trim(),
        noHp: String(r[colHp] || "").trim(),
        persenJM: jmVal
      });
    }
    return result;
  } catch (err) {
    Logger.log("Error getDaftarUserMaster: " + err.message);
    return [];
  }
}

/**
 * 6. SIMPAN PENGGUNA (TAMBAH BARU ATAU EDIT)
 */
function simpanUserMaster(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!payload || !payload.username || !payload.nama) {
      return { success: false, message: "Nama Pekerja dan Username wajib diisi!" };
    }

    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());

    let colNama = headers.indexOf("nama_pekerja"); if (colNama === -1) colNama = 0;
    let colUser = headers.indexOf("username"); if (colUser === -1) colUser = 1;
    let colRole = headers.indexOf("kategori_role"); if (colRole === -1) colRole = 2;
    let colPass = headers.indexOf("password"); if (colPass === -1) colPass = 3;
    let colStatus = headers.indexOf("status"); if (colStatus === -1) colStatus = 4;
    let colReg = headers.indexOf("no_registrasi"); if (colReg === -1) colReg = 5;
    let colHp = headers.indexOf("no_hp"); if (colHp === -1) colHp = 6;
    let colJM = headers.indexOf("persen_jm_dokter"); if (colJM === -1) colJM = 7;

    let cleanUser = String(payload.username).trim().toLowerCase().replace(/\s+/g, '');
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colUser] || "").trim().toLowerCase() === cleanUser) {
        rowIndex = i + 1;
        break;
      }
    }

    let pjmVal = payload.persenJM !== undefined && payload.persenJM !== "" ? Number(payload.persenJM) : 0;
    if (pjmVal > 1) pjmVal = pjmVal / 100;

    if (rowIndex > 1) {
      // MODE EDIT
      sheet.getRange(rowIndex, colNama + 1).setValue(payload.nama.trim());
      sheet.getRange(rowIndex, colRole + 1).setValue(payload.role.trim());
      sheet.getRange(rowIndex, colStatus + 1).setValue(payload.status || "Aktif");
      sheet.getRange(rowIndex, colReg + 1).setValue(payload.noReg || "-");
      sheet.getRange(rowIndex, colHp + 1).setValue(payload.noHp || "");
      sheet.getRange(rowIndex, colJM + 1).setValue(pjmVal);

      if (payload.password && String(payload.password).trim() !== "") {
        let cellPass = sheet.getRange(rowIndex, colPass + 1);
        cellPass.setNumberFormat("@"); // Format Plain Text
        cellPass.setValue(String(payload.password).trim());
      }

      return { success: true, message: "Akun pengguna '" + cleanUser + "' berhasil diperbarui!" };
    } else {
      // MODE TAMBAH BARU
      if (!payload.password || String(payload.password).trim() === "") {
        return { success: false, message: "Password wajib diisi untuk pengguna baru!" };
      }

      let newRow = new Array(Math.max(8, headers.length)).fill("");
      newRow[colNama] = payload.nama.trim();
      newRow[colUser] = cleanUser;
      newRow[colRole] = payload.role.trim();
      newRow[colPass] = String(payload.password).trim();
      newRow[colStatus] = payload.status || "Aktif";
      newRow[colReg] = payload.noReg || "-";
      newRow[colHp] = payload.noHp || "";
      newRow[colJM] = pjmVal;

      sheet.appendRow(newRow);
      let lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, colPass + 1).setNumberFormat("@");
      sheet.getRange(lastRow, colJM + 1).setNumberFormat("0.0%");

      return { success: true, message: "Pengguna baru '" + cleanUser + "' (" + payload.role + ") berhasil ditambahkan!" };
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan user: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 7. HAPUS / NONAKTIFKAN PENGGUNA
 */
function hapusUserMaster(username, isPermanent) {
  try {
    if (!username) return { success: false, message: "Username wajib diisi!" };

    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());

    let colUser = headers.indexOf("username"); if (colUser === -1) colUser = 1;
    let colStatus = headers.indexOf("status"); if (colStatus === -1) colStatus = 4;

    let cleanUser = String(username).trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colUser] || "").trim().toLowerCase() === cleanUser) {
        if (isPermanent) {
          sheet.deleteRow(i + 1);
          return { success: true, message: "Akun '" + username + "' berhasil dihapus secara permanen." };
        } else {
          sheet.getRange(i + 1, colStatus + 1).setValue("Tidak Aktif");
          return { success: true, message: "Akun '" + username + "' berhasil dinonaktifkan." };
        }
      }
    }
    return { success: false, message: "User '" + username + "' tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal: " + err.message };
  }
}

/**
 * 8. INISIALISASI HEADER & VALIDASI DROPDOWN ROLE PADA SPREADSHEET
 */
function initFormatSheetUserMaster() {
  try {
    const sheet = getSheetUserMaster();
    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS.length)
      .setValues([MASTER_USER_CONFIG.HEADERS])
      .setFontWeight("bold")
      .setBackground("#e2e8f0");
    sheet.setFrozenRows(1);

    const ruleRole = SpreadsheetApp.newDataValidation()
      .requireValueInList(MASTER_USER_CONFIG.ROLES, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 3, 100, 1).setDataValidation(ruleRole);

    const ruleStatus = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Aktif", "Tidak Aktif"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 5, 100, 1).setDataValidation(ruleStatus);

    sheet.getRange(2, 4, 100, 1).setNumberFormat("@");
    sheet.getRange(2, 8, 100, 1).setNumberFormat("0.0%");

    SpreadsheetApp.getUi().alert("✅ Format sheet 'Data' dan validasi 7 Kategori Role berhasil disiapkan!");
  } catch (err) {
    SpreadsheetApp.getUi().alert("Gagal format: " + err.message);
  }
}

/**
 * 9. KONTEN HTML TAMPILAN FORM USER & ROLE
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
'        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">' +
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
'          <input type="text" id="inCari" oninput="renderTabel()" placeholder="Cari nama/user/role..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-48">' +
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
'              <th class="p-2.5 text-center">JM</th>' +
'              <th class="p-2.5 text-center">Aksi</th>' +
'            </tr>' +
'          </thead>' +
'          <tbody id="tbodyUser" class="divide-y divide-slate-100">' +
'            <tr><td colspan="8" class="text-center py-6 text-slate-400 font-bold">Memuat akun pengguna...</td></tr>' +
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
'      tbody.innerHTML = "<tr><td colspan=\'8\' class=\'text-center py-6 text-slate-400 font-bold\'>Memuat dari spreadsheet...</td></tr>";' +
'      google.script.run' +
'        .withSuccessHandler(function(res) { listUsers = res || []; renderTabel(); })' +
'        .withFailureHandler(function(err) { tbody.innerHTML = "<tr><td colspan=\'8\' class=\'text-center py-6 text-rose-500 font-bold\'>Gagal: " + (err.message || err) + "</td></tr>"; })' +
'        .getDaftarUserMaster();' +
'    }' +
'    function renderTabel() {' +
'      const tbody = document.getElementById("tbodyUser");' +
'      const q = (document.getElementById("inCari").value || "").toLowerCase().trim();' +
'      let filtered = listUsers.filter(function(u) {' +
'        if (!q) return true;' +
'        return (u.nama || "").toLowerCase().indexOf(q) !== -1 || (u.username || "").toLowerCase().indexOf(q) !== -1 || (u.role || "").toLowerCase().indexOf(q) !== -1;' +
'      });' +
'      if (filtered.length === 0) { tbody.innerHTML = "<tr><td colspan=\'8\' class=\'text-center py-6 text-slate-400 font-bold\'>Tidak ada data.</td></tr>"; return; }' +
'      tbody.innerHTML = filtered.map(function(u) {' +
'        let badgeColor = "bg-slate-100 text-slate-700";' +
'        let rLow = (u.role || "").toLowerCase();' +
'        if (rLow === "super user" || rLow === "owner") badgeColor = "bg-purple-100 text-purple-700 font-bold";' +
'        else if (rLow.indexOf("dokter") !== -1) badgeColor = "bg-blue-100 text-blue-700 font-bold";' +
'        else if (rLow.indexOf("perawat") !== -1) badgeColor = "bg-teal-100 text-teal-700 font-bold";' +
'        else if (rLow.indexOf("admin") !== -1) badgeColor = "bg-amber-100 text-amber-700 font-bold";' +
'        let statusColor = (u.status === "Aktif" || !u.status) ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";' +
'        let jmVal = (u.persenJM ? (Number(u.persenJM) <= 1 ? Math.round(Number(u.persenJM) * 100) : Number(u.persenJM)) : 0) + "%";' +
'        if (rLow.indexOf("dokter") === -1) jmVal = "-";' +
'        let safeUser = String(u.username).replace(/\'/g, "\\\\\'");' +
'        return "<tr class=\'hover:bg-slate-50 transition-colors\'>" +' +
'          "<td class=\'p-2.5 font-bold text-slate-800\'>" + (u.nama || "-") + "</td>" +' +
'          "<td class=\'p-2.5 font-mono text-slate-600\'>" + (u.username || "-") + "</td>" +' +
'          "<td class=\'p-2.5\'><span class=\'px-2 py-0.5 rounded text-[11px] " + badgeColor + "\'>" + (u.role || "-") + "</span></td>" +' +
'          "<td class=\'p-2.5 text-center\'><span class=\'px-2 py-0.5 rounded text-[10px] font-bold " + statusColor + "\'>" + (u.status || "Aktif") + "</span></td>" +' +
'          "<td class=\'p-2.5 text-slate-500 text-[11px]\'>" + (u.noReg || "-") + "</td>" +' +
'          "<td class=\'p-2.5 text-slate-500 text-[11px]\'>" + (u.noHp || "-") + "</td>" +' +
'          "<td class=\'p-2.5 text-center font-bold text-amber-800 text-[11px]\'>" + jmVal + "</td>" +' +
'          "<td class=\'p-2.5 text-center\'>" +' +
'            "<div class=\'flex items-center justify-center gap-1\'>" +' +
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
