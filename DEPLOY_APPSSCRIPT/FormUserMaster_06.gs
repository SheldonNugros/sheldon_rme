/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: RME SHELDON - MANAGEMENT USER & ATURAN TINDAKAN KHUSUS
 * =========================================================================
 * Script Mandiri untuk Google Spreadsheet:
 * 1. Sheet "Data" (Master User, Role, Password, ID Pekerja SN-XX)
 * 2. Sheet "Tarif_Khusus_Dokter" (Aturan Tindakan Khusus Dokter TKD-XX)
 * 
 * Terintegrasi dengan Sheet "Tindakan" di Database RME Sheldon.
 * =========================================================================
 */

// Konfigurasi Database & Sheet
const MASTER_USER_CONFIG = {
  SHEET_NAME: "Data",
  SPREADSHEET_ID: "1e_UqCBpqs-YBF2XRsaoW3yG1r8o3nNDI1vGPQyp8nCE", // 06 Master User & Role
  DATABASE_SPREADSHEET_ID: "1K9C60hweu2feayWVKdzG80z9yhzkv1ONQ7Ao3xqPkZM", // 05 Database (Tindakan)
  SHEET_TARIF_KHUSUS: "Tarif_Khusus_Dokter",
  SHEET_TINDAKAN: "Tindakan",
  HEADERS: [
    "ID_Pekerja",
    "Nama_Pekerja",
    "Username",
    "Kategori_Role",
    "Password",
    "Status",
    "No_Registrasi",
    "No_HP",
    "Persen_JM_Dokter",
    "Email"
  ],
  HEADERS_TKD: [
    "ID_Aturan",
    "Nama_Dokter",
    "ID_Tindakan",
    "Nama_Tindakan",
    "Tarif",
    "Labor",
    "Persen_JM_Dokter",
    "Keterangan"
  ],
  ROLES: [
    "Owner",
    "Dokter Gigi Spesialis",
    "Dokter Gigi Umum",
    "Perawat Gigi",
    "Perawat Umum",
    "Admin",
    "Office"
  ]
};

/**
 * 1. FUNGSI MENU OTOMATIS SAAT SPREADSHEET DIBUKA
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("👥 RME User & Tarif Khusus")
      .addItem("⭐ Buka Form Aturan Tindakan Khusus (TKD)", "bukaFormTKDDialog")
      .addItem("👤 Buka Form User & Password", "bukaFormUserMasterDialog")
      .addItem("📋 Buka Sidebar Terpadu", "bukaFormUserMasterSidebar")
      .addSeparator()
      .addItem("🆔 Generate/Update Seluruh ID Pekerja (SN-XX)", "generateAllIdPekerja")
      .addItem("⚙️ Setup Header Sheet Data (User)", "initFormatSheetUserMaster")
      .addItem("⚙️ Setup Header Sheet Tarif_Khusus_Dokter", "initSheetTarifKhususDokter")
      .addToUi();
  } catch (e) {
    Logger.log("onOpen non-UI context: " + e.message);
  }
}

/**
 * TRIGGER OTOMATIS: onEdit
 * Mengisi otomatis ID_Pekerja pada baris baru jika user mengetik langsung di Spreadsheet
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== MASTER_USER_CONFIG.SHEET_NAME) return;

    const row = e.range.getRow();
    if (row <= 1) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let colId = headers.indexOf("id_pekerja");
    let colRole = headers.indexOf("kategori_role");
    let colNama = headers.indexOf("nama_pekerja");

    if (colId === -1 || colRole === -1) return;

    let currentId = String(sheet.getRange(row, colId + 1).getValue() || "").trim();
    let currentRole = String(sheet.getRange(row, colRole + 1).getValue() || "").trim();
    let currentNama = colNama !== -1 ? String(sheet.getRange(row, colNama + 1).getValue() || "").trim() : "";

    if (currentNama && currentRole && !currentId) {
      let newId = generateNextIdPekerja(currentRole, sheet);
      sheet.getRange(row, colId + 1).setValue(newId).setNumberFormat("@");
    }
  } catch (err) {
    Logger.log("onEdit Error: " + err.message);
  }
}

function generateNextIdPekerja(role, sheet) {
  const prefix = "SN-";
  let maxNum = 0;
  if (!sheet) sheet = getSheetUserMaster();
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
 */
function generateAllIdPekerja() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(MASTER_USER_CONFIG.SPREADSHEET_ID);
    let sheetData = ss.getSheetByName(MASTER_USER_CONFIG.SHEET_NAME);
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

    sheetData.getRange(2, colId + 1, Math.max(1, sheetData.getLastRow() - 1), 1).setNumberFormat("@");

    const msg = "✅ Berhasil membuat & memperbarui seluruh ID_Pekerja (SN-XX) di Sheet Data!";
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
    return { success: true, message: msg };
  } catch (err) {
    const errMsg = "Gagal generateAllIdPekerja: " + err.message;
    try { SpreadsheetApp.getUi().alert(errMsg); } catch (e) { Logger.log(errMsg); }
    return { success: false, message: errMsg };
  }
}

/**
 * 2. TAMPILAN DIALOG & SIDEBAR
 */
function bukaFormTKDDialog() {
  const html = HtmlService.createHtmlOutput(getHtmlAppContent("tkd"))
    .setWidth(950)
    .setHeight(720)
    .setTitle("⭐ Aturan Tindakan Khusus Dokter (TKD) - RME Sheldon");
  SpreadsheetApp.getUi().showModalDialog(html, "⭐ Formulir Aturan Tindakan Khusus Dokter");
}

function bukaFormUserMasterDialog() {
  const html = HtmlService.createHtmlOutput(getHtmlAppContent("user"))
    .setWidth(950)
    .setHeight(720)
    .setTitle("👤 Form Master User & Role - RME Sheldon");
  SpreadsheetApp.getUi().showModalDialog(html, "👤 Form Master User & Role");
}

function bukaFormUserMasterSidebar() {
  const html = HtmlService.createHtmlOutput(getHtmlAppContent("tkd"))
    .setTitle("RME Management");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * 3. ENDPOINT WEB APP (doGet & doPost)
 */
function doGet(e) {
  const tab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : "tkd";
  return HtmlService.createHtmlOutput(getHtmlAppContent(tab))
    .setTitle("RME Sheldon - Management User & Aturan Tindakan Khusus")
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

    // Handler Actions
    if (action === "getDaftarUserMaster") {
      result = getDaftarUserMaster();
    } else if (action === "simpanUserMaster") {
      result = simpanUserMaster(payload);
    } else if (action === "hapusUserMaster") {
      let username = Array.isArray(params) ? params[0] : (payload.username || "");
      let isPerm = Array.isArray(params) && params.length > 1 ? params[1] : (payload.isPermanent || false);
      result = hapusUserMaster(username, isPerm);
    } else if (action === "getDokterGigiList") {
      result = getDokterGigiList();
    } else if (action === "getMasterTindakanList") {
      result = getMasterTindakanList();
    } else if (action === "getDaftarTarifKhusus") {
      result = getDaftarTarifKhusus();
    } else if (action === "simpanTarifKhusus") {
      result = simpanTarifKhusus(payload);
    } else if (action === "hapusTarifKhusus") {
      let idAturan = Array.isArray(params) ? params[0] : (payload.idAturan || payload.id || "");
      result = hapusTarifKhusus(idAturan);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// DATABASE ACCESS HELPERS
// =========================================================================

function getSheetUserMaster() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss ? ss.getSheetByName(MASTER_USER_CONFIG.SHEET_NAME) : null;
  if (!sheet && MASTER_USER_CONFIG.SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(MASTER_USER_CONFIG.SPREADSHEET_ID);
      sheet = ss.getSheetByName(MASTER_USER_CONFIG.SHEET_NAME);
    } catch (e) {
      Logger.log("openById error: " + e.message);
    }
  }
  if (!sheet && ss) {
    sheet = ss.insertSheet(MASTER_USER_CONFIG.SHEET_NAME);
    sheet.appendRow(MASTER_USER_CONFIG.HEADERS);
    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSheetTarifKhusus() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss ? ss.getSheetByName(MASTER_USER_CONFIG.SHEET_TARIF_KHUSUS) : null;

  // Jika tidak ada di spreadsheet aktif, coba cari di Database Spreadsheet
  if (!sheet && MASTER_USER_CONFIG.DATABASE_SPREADSHEET_ID) {
    try {
      let dbSS = SpreadsheetApp.openById(MASTER_USER_CONFIG.DATABASE_SPREADSHEET_ID);
      sheet = dbSS.getSheetByName(MASTER_USER_CONFIG.SHEET_TARIF_KHUSUS);
    } catch (e) {
      Logger.log("Cari sheet di database error: " + e.message);
    }
  }

  // Jika masih tidak ada, buat di spreadsheet aktif
  if (!sheet && ss) {
    sheet = ss.insertSheet(MASTER_USER_CONFIG.SHEET_TARIF_KHUSUS);
    sheet.appendRow(MASTER_USER_CONFIG.HEADERS_TKD);
    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS_TKD.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSheetMasterTindakan() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss ? ss.getSheetByName(MASTER_USER_CONFIG.SHEET_TINDAKAN) : null;

  if (!sheet && MASTER_USER_CONFIG.DATABASE_SPREADSHEET_ID) {
    try {
      let dbSS = SpreadsheetApp.openById(MASTER_USER_CONFIG.DATABASE_SPREADSHEET_ID);
      sheet = dbSS.getSheetByName(MASTER_USER_CONFIG.SHEET_TINDAKAN);
    } catch (e) {
      Logger.log("Buka master tindakan error: " + e.message);
    }
  }
  return sheet;
}

// =========================================================================
// MODUL 1: ATURAN TINDAKAN KHUSUS DOKTER (TKD)
// =========================================================================

/**
 * Mengambil daftar dokter dengan role Dokter Gigi Umum atau Dokter Gigi Spesialis
 */
function getDokterGigiList() {
  try {
    const users = getDaftarUserMaster();
    return users.filter(function(u) {
      const r = String(u.role || "").toLowerCase();
      return r.includes("dokter gigi");
    }).map(function(u) {
      return {
        nama: u.nama,
        role: u.role,
        persenJM: u.persenJM || 0
      };
    });
  } catch (e) {
    Logger.log("Error getDokterGigiList: " + e.message);
    return [];
  }
}

/**
 * Mengambil daftar master tindakan dari Sheet Tindakan
 */
function getMasterTindakanList() {
  try {
    const sheet = getSheetMasterTindakan();
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const h = data[0].map(x => String(x || "").toLowerCase().replace(/[\s_.]/g, ""));
    let colKode = h.findIndex(x => x.includes("kode") || x.includes("id"));
    let colNama = h.findIndex(x => x.includes("nama") || x.includes("tindakan"));
    let colTarif = h.findIndex(x => x.includes("tarif") || x.includes("harga") || x.includes("biaya"));
    let colLab = h.findIndex(x => x.includes("labor") || x.includes("lab"));

    if (colNama === -1) colNama = 1;
    if (colKode === -1) colKode = 0;

    let results = [];
    for (let i = 1; i < data.length; i++) {
      let r = data[i];
      let nama = String(r[colNama] || "").trim();
      if (!nama) continue;

      let kode = colKode !== -1 ? String(r[colKode] || "").trim() : "";
      let tarif = colTarif !== -1 ? Number(String(r[colTarif] || "0").replace(/[^0-9]/g, "")) || 0 : 0;
      let labor = colLab !== -1 ? String(r[colLab] || "Tidak").trim() : "Tidak";
      let perluLab = (labor.toLowerCase().includes("ya") || labor === "1" || Number(labor) > 0) ? "Ya" : "Tidak";

      results.push({
        kode: kode || ("TND-" + String(i).padStart(3, "0")),
        nama: nama,
        tarif: tarif,
        labor: perluLab
      });
    }

    // Urutkan ascending berdasarkan kode
    results.sort(function(a, b) {
      return String(a.kode || "").localeCompare(String(b.kode || ""));
    });

    return results;
  } catch (e) {
    Logger.log("Error getMasterTindakanList: " + e.message);
    return [];
  }
}

/**
 * Mengambil seluruh aturan tindakan khusus dokter dari sheet Tarif_Khusus_Dokter
 */
function getDaftarTarifKhusus() {
  try {
    const sheet = getSheetTarifKhusus();
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const h = data[0].map(x => String(x || "").toLowerCase().replace(/[\s_.]/g, ""));
    let colIdA = h.findIndex(x => x.includes("idaturan") || x.includes("id"));
    let colDok = h.findIndex(x => x.includes("dokter") || x.includes("nama_dokter"));
    let colIdT = h.findIndex(x => x.includes("idtindakan") || x.includes("kodetindakan") || x.includes("kode"));
    let colNamaT = h.findIndex(x => x.includes("namatindakan") || x.includes("tindakan"));
    let colTarif = h.findIndex(x => x.includes("tarif") || x.includes("harga"));
    let colLab = h.findIndex(x => x.includes("labor") || x.includes("lab"));
    let colJM = h.findIndex(x => x.includes("persen") || x.includes("jm"));
    let colKet = h.findIndex(x => x.includes("ket"));

    let list = [];
    for (let i = 1; i < data.length; i++) {
      let r = data[i];
      let idA = colIdA !== -1 ? String(r[colIdA] || "").trim() : "";
      let dok = colDok !== -1 ? String(r[colDok] || "").trim() : "";
      let namaT = colNamaT !== -1 ? String(r[colNamaT] || "").trim() : "";
      if (!dok && !namaT) continue;

      let idT = colIdT !== -1 ? String(r[colIdT] || "").trim() : "";
      let tarif = colTarif !== -1 ? Number(String(r[colTarif] || "0").replace(/[^0-9]/g, "")) || 0 : 0;
      let labor = colLab !== -1 ? String(r[colLab] || "Tidak").trim() : "Tidak";
      let rawJM = colJM !== -1 ? String(r[colJM] || "0").replace("%", "").trim() : "0";
      let persenJM = Number(rawJM) || 0;
      if (persenJM > 1) persenJM = persenJM / 100;
      let ket = colKet !== -1 ? String(r[colKet] || "").trim() : "";

      list.push({
        idAturan: idA || ("TKD-" + String(i).padStart(2, "0")),
        namaDokter: dok,
        idTindakan: idT,
        namaTindakan: namaT,
        tarif: tarif,
        labor: labor,
        persenJM: persenJM,
        persenJMDisplay: Math.round(persenJM * 100) + "%",
        keterangan: ket
      });
    }

    return list;
  } catch (e) {
    Logger.log("Error getDaftarTarifKhusus: " + e.message);
    return [];
  }
}

/**
 * Menyimpan aturan tindakan khusus dokter (Tambah / Edit)
 * ID Aturan: TKD-XX (Auto increase 2 digit)
 */
function simpanTarifKhusus(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetTarifKhusus();
    if (!sheet) return { success: false, message: "Sheet Tarif_Khusus_Dokter tidak ditemukan!" };

    let data = sheet.getDataRange().getValues();
    if (data.length === 0 || !data[0] || data[0].length < 8) {
      sheet.clear();
      sheet.appendRow(MASTER_USER_CONFIG.HEADERS_TKD);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      data = sheet.getDataRange().getValues();
    }

    let h = data[0].map(x => String(x || "").toLowerCase().replace(/[\s_.]/g, ""));
    let colIdA = h.findIndex(x => x.includes("idaturan") || x.includes("id"));
    let colDok = h.findIndex(x => x.includes("dokter"));
    let colIdT = h.findIndex(x => x.includes("idtindakan") || x.includes("kodetindakan") || x.includes("kode"));
    let colNamaT = h.findIndex(x => x.includes("namatindakan") || x.includes("tindakan"));
    let colTarif = h.findIndex(x => x.includes("tarif") || x.includes("harga"));
    let colLab = h.findIndex(x => x.includes("labor") || x.includes("lab"));
    let colJM = h.findIndex(x => x.includes("persen") || x.includes("jm"));
    let colKet = h.findIndex(x => x.includes("ket"));

    let targetId = String(payload.idAturan || "").trim().toUpperCase();
    let namaDokter = String(payload.namaDokter || "").trim();
    let namaTindakan = String(payload.namaTindakan || "").trim();
    let idTindakan = String(payload.idTindakan || "").trim();
    let tarif = Number(payload.tarif) || 0;
    let labor = String(payload.labor || "Tidak").trim();
    let rawPersen = Number(payload.persenJM) || 0;
    let persenJM = rawPersen > 1 ? rawPersen / 100 : rawPersen;
    let keterangan = String(payload.keterangan || "").trim();

    if (!namaDokter) return { success: false, message: "Pilih Dokter Penanggung Jawab!" };
    if (!namaTindakan) return { success: false, message: "Pilih atau Ketik Nama Tindakan!" };
    if (persenJM <= 0 || persenJM > 1) {
      return { success: false, message: "Persentase Hak Dokter Khusus wajib diisi antara 1% s/d 100%!" };
    }

    // Auto increase ID: TKD-XX
    if (!targetId || targetId === "AUTO" || !targetId.startsWith("TKD-")) {
      let maxNum = 0;
      for (let i = 1; i < data.length; i++) {
        let curId = colIdA !== -1 ? String(data[i][colIdA] || "").trim().toUpperCase() : "";
        let m = curId.match(/TKD-(\d+)/);
        if (m) {
          let n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      targetId = "TKD-" + String(maxNum + 1).padStart(2, "0");
    }

    if (!keterangan) {
      keterangan = namaDokter + ": " + namaTindakan + " JM Khusus " + Math.round(persenJM * 100) + "%";
    }

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      let curId = colIdA !== -1 ? String(data[i][colIdA] || "").trim().toUpperCase() : "";
      if (curId === targetId) {
        rowIndex = i + 1;
        break;
      }
    }

    // Cek duplikasi dokter & tindakan jika penambahan baru
    if (rowIndex === -1) {
      for (let i = 1; i < data.length; i++) {
        let curDok = colDok !== -1 ? String(data[i][colDok] || "").trim() : "";
        let curTind = colNamaT !== -1 ? String(data[i][colNamaT] || "").trim() : "";
        let curKode = colIdT !== -1 ? String(data[i][colIdT] || "").trim() : "";
        if (curDok === namaDokter && (curTind.toLowerCase() === namaTindakan.toLowerCase() || (idTindakan && curKode === idTindakan))) {
          rowIndex = i + 1;
          targetId = colIdA !== -1 ? String(data[i][colIdA] || "").trim() : targetId;
          break;
        }
      }
    }

    if (rowIndex !== -1) {
      // Update
      if (colIdA !== -1) sheet.getRange(rowIndex, colIdA + 1).setValue(targetId).setNumberFormat("@");
      if (colDok !== -1) sheet.getRange(rowIndex, colDok + 1).setValue(namaDokter);
      if (colIdT !== -1) sheet.getRange(rowIndex, colIdT + 1).setValue(idTindakan).setNumberFormat("@");
      if (colNamaT !== -1) sheet.getRange(rowIndex, colNamaT + 1).setValue(namaTindakan);
      if (colTarif !== -1) sheet.getRange(rowIndex, colTarif + 1).setValue(tarif).setNumberFormat("#,##0");
      if (colLab !== -1) sheet.getRange(rowIndex, colLab + 1).setValue(labor);
      if (colJM !== -1) sheet.getRange(rowIndex, colJM + 1).setValue(persenJM).setNumberFormat("0.0%");
      if (colKet !== -1) sheet.getRange(rowIndex, colKet + 1).setValue(keterangan);

      return { success: true, message: "✅ Berhasil memperbarui aturan " + targetId + "!" };
    } else {
      // Baris baru
      let newRow = [targetId, namaDokter, idTindakan, namaTindakan, tarif, labor, persenJM, keterangan];
      sheet.appendRow(newRow);
      let lastR = sheet.getLastRow();
      sheet.getRange(lastR, 1).setNumberFormat("@");
      sheet.getRange(lastR, 3).setNumberFormat("@");
      sheet.getRange(lastR, 5).setNumberFormat("#,##0");
      sheet.getRange(lastR, 7).setNumberFormat("0.0%");

      return { success: true, message: "✅ Berhasil menambahkan aturan baru: " + targetId + "!" };
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menghapus aturan tindakan khusus dokter
 */
function hapusTarifKhusus(idAturan) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetTarifKhusus();
    if (!sheet) return { success: false, message: "Sheet Tarif_Khusus_Dokter tidak ditemukan!" };

    let targetId = String(idAturan || "").trim().toUpperCase();
    if (!targetId) return { success: false, message: "ID Aturan tidak valid!" };

    let data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "Data sheet kosong!" };

    let h = data[0].map(x => String(x || "").toLowerCase().replace(/[\s_.]/g, ""));
    let colIdA = h.findIndex(x => x.includes("idaturan") || x.includes("id"));

    let deleted = false;
    for (let i = 1; i < data.length; i++) {
      let curId = colIdA !== -1 ? String(data[i][colIdA] || "").trim().toUpperCase() : "";
      if (curId === targetId) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) return { success: false, message: "Aturan " + targetId + " tidak ditemukan!" };
    return { success: true, message: "✅ Aturan " + targetId + " berhasil dihapus!" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Inisialisasi Sheet Tarif_Khusus_Dokter dengan header 8 kolom resmi
 */
function initSheetTarifKhususDokter() {
  try {
    let sheet = getSheetTarifKhusus();
    if (!sheet) return { success: false, message: "Gagal membuat sheet!" };

    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS_TKD.length)
      .setValues([MASTER_USER_CONFIG.HEADERS_TKD])
      .setFontWeight("bold")
      .setBackground("#1e293b")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    const msg = "✅ Sheet Tarif_Khusus_Dokter berhasil disiapkan dengan 8 kolom standar!";
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
    return { success: true, message: msg };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// =========================================================================
// MODUL 2: USER MASTER & ROLE (DATA PEKERJA)
// =========================================================================

function getDaftarUserMaster() {
  try {
    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let colId = headers.indexOf("id_pekerja");
    let colNama = headers.indexOf("nama_pekerja"); if (colNama === -1) colNama = 1;
    let colUser = headers.indexOf("username"); if (colUser === -1) colUser = 2;
    let colRole = headers.indexOf("kategori_role"); if (colRole === -1) colRole = 3;
    let colPass = headers.indexOf("password"); if (colPass === -1) colPass = 4;
    let colStatus = headers.indexOf("status"); if (colStatus === -1) colStatus = 5;
    let colReg = headers.indexOf("no_registrasi"); if (colReg === -1) colReg = 6;
    let colHp = headers.indexOf("no_hp"); if (colHp === -1) colHp = 7;
    let colJM = headers.indexOf("persen_jm_dokter"); if (colJM === -1) colJM = 8;

    let result = [];
    for (let i = 1; i < data.length; i++) {
      let r = data[i];
      let username = String(r[colUser] || "").trim();
      let nama = String(r[colNama] || "").trim();
      if (!username && !nama) continue;

      let passVal = String(r[colPass] !== null && r[colPass] !== undefined ? r[colPass] : "").trim();
      let jmVal = (colJM !== -1 && r[colJM] !== "" && r[colJM] !== null) ? Number(r[colJM]) : 0;
      let idPek = (colId !== -1 && r[colId]) ? String(r[colId]).trim() : "";

      result.push({
        idPekerja: idPek,
        nama: nama,
        username: username,
        role: String(r[colRole] || "Staff").trim(),
        hasPassword: passVal.length > 0,
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

function simpanUserMaster(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());

    let colId = headers.indexOf("id_pekerja");
    let colNama = headers.indexOf("nama_pekerja");
    let colUser = headers.indexOf("username");
    let colRole = headers.indexOf("kategori_role");
    let colPass = headers.indexOf("password");
    let colStatus = headers.indexOf("status");
    let colReg = headers.indexOf("no_registrasi");
    let colHp = headers.indexOf("no_hp");
    let colJM = headers.indexOf("persen_jm_dokter");

    let usernameInput = String(payload.username || "").trim().toLowerCase();
    let namaInput = String(payload.nama || "").trim();
    let roleInput = String(payload.role || "Staff").trim();
    let statusInput = String(payload.status || "Aktif").trim();
    let noRegInput = String(payload.noReg || "-").trim();
    let noHpInput = String(payload.noHp || "").trim();
    let persenJMInput = Number(payload.persenJM) || 0;
    if (persenJMInput > 1) persenJMInput = persenJMInput / 100;

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      let u = String(data[i][colUser] || "").trim().toLowerCase();
      if (u === usernameInput) {
        rowIndex = i + 1;
        break;
      }
    }

    if (payload.mode === "edit" || rowIndex !== -1) {
      if (rowIndex === -1) return { success: false, message: "Pengguna tidak ditemukan!" };
      sheet.getRange(rowIndex, colNama + 1).setValue(namaInput);
      sheet.getRange(rowIndex, colRole + 1).setValue(roleInput);
      sheet.getRange(rowIndex, colStatus + 1).setValue(statusInput);
      if (colReg !== -1) sheet.getRange(rowIndex, colReg + 1).setValue(noRegInput).setNumberFormat("@");
      if (colHp !== -1) sheet.getRange(rowIndex, colHp + 1).setValue(noHpInput).setNumberFormat("@");
      if (colJM !== -1) sheet.getRange(rowIndex, colJM + 1).setValue(persenJMInput).setNumberFormat("0.0%");

      if (payload.password && String(payload.password).trim().length > 0) {
        sheet.getRange(rowIndex, colPass + 1).setValue(hashPasswordSHA256(String(payload.password).trim()));
      }
      return { success: true, message: "✅ Data pengguna " + usernameInput + " berhasil diperbarui!" };
    } else {
      let newId = generateNextIdPekerja(roleInput, sheet);
      let hashPass = payload.password ? hashPasswordSHA256(String(payload.password).trim()) : "";
      let newRow = [];
      for (let c = 0; c < headers.length; c++) newRow.push("");
      newRow[colId] = newId;
      newRow[colNama] = namaInput;
      newRow[colUser] = usernameInput;
      newRow[colRole] = roleInput;
      newRow[colPass] = hashPass;
      newRow[colStatus] = statusInput;
      if (colReg !== -1) newRow[colReg] = noRegInput;
      if (colHp !== -1) newRow[colHp] = noHpInput;
      if (colJM !== -1) newRow[colJM] = persenJMInput;

      sheet.appendRow(newRow);
      let lastR = sheet.getLastRow();
      sheet.getRange(lastR, colId + 1).setNumberFormat("@");
      if (colReg !== -1) sheet.getRange(lastR, colReg + 1).setNumberFormat("@");
      if (colHp !== -1) sheet.getRange(lastR, colHp + 1).setNumberFormat("@");
      if (colJM !== -1) sheet.getRange(lastR, colJM + 1).setNumberFormat("0.0%");

      return { success: true, message: "✅ Pengguna baru " + usernameInput + " (" + newId + ") berhasil didaftarkan!" };
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function hapusUserMaster(username, isPermanent) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetUserMaster();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let colUser = headers.indexOf("username");
    let colStatus = headers.indexOf("status");

    for (let i = 1; i < data.length; i++) {
      let u = String(data[i][colUser] || "").trim().toLowerCase();
      if (u === String(username).toLowerCase().trim()) {
        if (isPermanent) {
          sheet.deleteRow(i + 1);
          return { success: true, message: "User " + username + " dihapus permanen!" };
        } else {
          sheet.getRange(i + 1, colStatus + 1).setValue("Non-Aktif");
          return { success: true, message: "User " + username + " dinonaktifkan!" };
        }
      }
    }
    return { success: false, message: "User tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

function hashPasswordSHA256(str) {
  if (!str) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  let txt = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let hex = byteVal.toString(16);
    if (hex.length === 1) hex = "0" + hex;
    txt += hex;
  }
  return txt;
}

function initFormatSheetUserMaster() {
  try {
    let sheet = getSheetUserMaster();
    sheet.getRange(1, 1, 1, MASTER_USER_CONFIG.HEADERS.length)
      .setValues([MASTER_USER_CONFIG.HEADERS])
      .setFontWeight("bold")
      .setBackground("#1e293b")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    const msg = "✅ Sheet Data (User Master) berhasil disiapkan!";
    try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
    return { success: true, message: msg };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// =========================================================================
// HTML VIEW BUILDER
// =========================================================================

function getHtmlAppContent(initialTab) {
  const activeTab = initialTab || "tkd";
  return '<!DOCTYPE html>' +
'<html lang="id">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>RME Sheldon - Management & TKD</title>' +
'  <script src="https://cdn.tailwindcss.com"></script>' +
'  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
'  <style>' +
'    body { font-family: "Plus Jakarta Sans", sans-serif; }' +
'    .tab-active { background-color: #0f172a; color: #ffffff; }' +
'    .tab-inactive { background-color: #f1f5f9; color: #64748b; }' +
'    .tab-inactive:hover { background-color: #e2e8f0; color: #0f172a; }' +
'  </style>' +
'</head>' +
'<body class="bg-slate-50 text-slate-800 p-3 md:p-6 min-h-screen">' +
'  <div class="max-w-5xl mx-auto space-y-4">' +

'    <!-- HEADER APP -->' +
'    <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">' +
'      <div>' +
'        <h1 class="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">' +
'          <span>🏥</span> RME Sheldon - Management Portal' +
'        </h1>' +
'        <p class="text-xs text-slate-500 font-medium">Pengaturan Pegawai, Hak Akses & Aturan Tindakan Khusus Dokter</p>' +
'      </div>' +
'      <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">' +
'        <button type="button" id="tabBtnTKD" onclick="switchMainTab(\'tkd\')" class="flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ' + (activeTab === 'tkd' ? 'tab-active' : 'tab-inactive') + '">' +
'          <span>⭐</span> Aturan Tindakan Khusus' +
'        </button>' +
'        <button type="button" id="tabBtnUser" onclick="switchMainTab(\'user\')" class="flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ' + (activeTab === 'user' ? 'tab-active' : 'tab-inactive') + '">' +
'          <span>👤</span> Kelola User & Role' +
'        </button>' +
'      </div>' +
'    </div>' +

'    <!-- ALERT CONTAINER -->' +
'    <div id="globalAlert" class="hidden rounded-xl p-3 text-xs font-bold transition-all"></div>' +

'    <!-- ================================================================= -->' +
'    <!-- TAB 1: FORMULIR ATURAN TINDAKAN KHUSUS DOKTER (TKD)            -->' +
'    <!-- ================================================================= -->' +
'    <div id="tabPanelTKD" class="' + (activeTab === 'tkd' ? 'space-y-4' : 'hidden space-y-4') + '">' +
'      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">' +
'        <div class="flex items-center justify-between pb-3 border-b border-slate-100">' +
'          <div>' +
'            <h2 class="text-sm font-extrabold text-slate-900 flex items-center gap-2">' +
'              <span class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">⭐</span>' +
'              <span id="titleFormTKD">Formulir Aturan Tindakan Khusus Dokter</span>' +
'            </h2>' +
'            <p class="text-[11px] text-slate-500">Penetapan persentase Jasa Medis (JM) spesifik per dokter dan tindakan medis</p>' +
'          </div>' +
'          <span id="badgeModeTKD" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">Mode: Tambah Baru</span>' +
'        </div>' +

'        <form id="formTKD" onsubmit="event.preventDefault(); simpanAturanTKD();" class="space-y-4">' +
'          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5">' +
'            <!-- ID Aturan -->' +
'            <div class="md:col-span-3 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">ID Aturan</label>' +
'              <input type="text" id="tkdIdAturan" readonly class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 text-xs cursor-not-allowed" value="TKD-AUTO">' +
'            </div>' +

'            <!-- Dokter Penanggung Jawab -->' +
'            <div class="md:col-span-4 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Dokter Penanggung Jawab <span class="text-rose-500">*</span></label>' +
'              <select id="tkdDokter" required onchange="onDokterSelectChange()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer">' +
'                <option value="">-- Pilih Dokter Terdaftar --</option>' +
'              </select>' +
'              <p class="text-[10px] text-slate-400">Khusus Dokter Gigi Umum / Spesialis</p>' +
'            </div>' +

'            <!-- Nama Tindakan -->' +
'            <div class="md:col-span-5 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Nama Tindakan Medis <span class="text-rose-500">*</span></label>' +
'              <div class="relative w-full">' +
'                <input type="text" id="tkdTindakan" list="dlTindakanList" required oninput="onTindakanInputChange()" onchange="onTindakanInputChange()" placeholder="Ketik / Cari Nama Tindakan..." class="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">' +
'                <button type="button" id="btnClearTindakan" onclick="clearTindakanInput()" title="Kosongkan pilihan" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full font-bold text-xs transition-colors cursor-pointer">✕</button>' +
'              </div>' +
'              <datalist id="dlTindakanList"></datalist>' +
'              <p class="text-[10px] text-slate-400">Pilih dari Master Tindakan atau ketik manual</p>' +
'            </div>' +
'          </div>' +

'          <!-- Detail Auto-fill & Persen -->' +
'          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">' +
'            <div class="md:col-span-3 space-y-1">' +
'              <label class="block text-[10px] font-bold text-slate-500 uppercase">Kode Tindakan</label>' +
'              <input type="text" id="tkdIdTindakan" readonly class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 text-xs cursor-not-allowed" placeholder="-">' +
'            </div>' +
'            <div class="md:col-span-3 space-y-1">' +
'              <label class="block text-[10px] font-bold text-slate-500 uppercase">Tarif Resmi (Rp)</label>' +
'              <input type="text" id="tkdTarifDisplay" readonly class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700 text-xs cursor-not-allowed" placeholder="Rp 0">' +
'              <input type="hidden" id="tkdTarif" value="0">' +
'            </div>' +
'            <div class="md:col-span-3 space-y-1">' +
'              <label class="block text-[10px] font-bold text-slate-500 uppercase">Syarat Lab?</label>' +
'              <input type="text" id="tkdLabor" readonly class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 text-xs cursor-not-allowed" placeholder="Tidak">' +
'            </div>' +
'            <div class="md:col-span-3 space-y-1">' +
'              <label class="block text-[10px] font-black text-emerald-800 uppercase">% Hak Dokter Khusus <span class="text-rose-500">*</span></label>' +
'              <div class="relative">' +
'                <input type="number" id="tkdPersenJM" required min="1" max="100" step="1" oninput="hitungSimulasi()" class="w-full px-3 py-1.5 bg-white border-2 border-emerald-400 rounded-lg font-black text-emerald-700 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-7" placeholder="Contoh: 50" value="">' +
'                <span class="absolute right-2.5 top-1.5 font-black text-emerald-600 text-xs">%</span>' +
'              </div>' +
'            </div>' +
'          </div>' +

'          <!-- Live Box Simulasi -->' +
'          <div class="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">' +
'            <div>' +
'              <span class="text-[10px] font-bold uppercase text-slate-500 block">Tarif Pasien:</span>' +
'              <span id="simTarif" class="font-extrabold text-slate-800">Rp 0</span>' +
'            </div>' +
'            <div>' +
'              <span class="text-[10px] font-bold uppercase text-slate-500 block">Biaya Lab:</span>' +
'              <span id="simLab" class="font-semibold text-slate-600">Rp 0 (Tidak Ada)</span>' +
'            </div>' +
'            <div class="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">' +
'              <span class="text-[10px] font-bold uppercase text-emerald-700 block">Hak Dokter (<span id="simPersenDokter">0%</span>):</span>' +
'              <span id="simHakDokter" class="font-black text-emerald-600 text-sm">Rp 0</span>' +
'            </div>' +
'            <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">' +
'              <span class="text-[10px] font-bold uppercase text-slate-600 block">Hak Klinik (<span id="simPersenKlinik">100%</span>):</span>' +
'              <span id="simHakKlinik" class="font-black text-slate-700 text-sm">Rp 0</span>' +
'            </div>' +
'          </div>' +

'          <!-- Tombol Aksi -->' +
'          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">' +
'            <button type="button" id="btnBatalTKD" onclick="resetFormTKD()" class="hidden px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer">Batal Edit</button>' +
'            <button type="submit" id="btnSubmitTKD" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer">' +
'              <span>💾</span> Simpan Aturan' +
'            </button>' +
'          </div>' +
'        </form>' +
'      </div>' +

'      <!-- TABEL DAFTAR ATURAN TKD -->' +
'      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">' +
'        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">' +
'          <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">' +
'            <span>📋</span> Daftar Aturan Tarif Khusus Tersimpan (<span id="countTKD">0</span>)' +
'          </h3>' +
'          <input type="text" id="searchTKD" oninput="renderTableTKD()" placeholder="Cari Dokter / Tindakan / Kode..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full md:w-64 outline-none focus:border-emerald-500">' +
'        </div>' +
'        <div class="overflow-x-auto rounded-xl border border-slate-100">' +
'          <table class="w-full text-left border-collapse text-xs">' +
'            <thead>' +
'              <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">' +
'                <th class="p-3">ID Aturan</th>' +
'                <th class="p-3">Dokter</th>' +
'                <th class="p-3">Kode</th>' +
'                <th class="p-3">Nama Tindakan</th>' +
'                <th class="p-3 text-right">Tarif (Rp)</th>' +
'                <th class="p-3 text-center">Labor</th>' +
'                <th class="p-3 text-center">% JM Dokter</th>' +
'                <th class="p-3 text-center">Aksi</th>' +
'              </tr>' +
'            </thead>' +
'            <tbody id="tbodyTKD" class="divide-y divide-slate-100 font-medium text-slate-700">' +
'              <tr><td colspan="8" class="p-6 text-center text-slate-400 font-bold">Memuat data aturan...</td></tr>' +
'            </tbody>' +
'          </table>' +
'        </div>' +
'      </div>' +
'    </div>' +

'    <!-- ================================================================= -->' +
'    <!-- TAB 2: KELOLA USER & ROLE (PEGAWAI)                             -->' +
'    <!-- ================================================================= -->' +
'    <div id="tabPanelUser" class="' + (activeTab === 'user' ? 'space-y-4' : 'hidden space-y-4') + '">' +
'      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">' +
'        <div class="flex items-center justify-between pb-3 border-b border-slate-100">' +
'          <div>' +
'            <h2 class="text-sm font-extrabold text-slate-900 flex items-center gap-2">' +
'              <span class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">👤</span>' +
'              <span id="titleFormUser">Form Tambah / Edit Pengguna</span>' +
'            </h2>' +
'            <p class="text-[11px] text-slate-500">Kelola akun, role, no registrasi, dan password pegawai</p>' +
'          </div>' +
'        </div>' +
'        <form id="formUser" onsubmit="event.preventDefault(); simpanDataUser();" class="space-y-4">' +
'          <input type="hidden" id="userMode" value="tambah">' +
'          <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5">' +
'            <div class="md:col-span-6 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Nama Lengkap & Gelar <span class="text-rose-500">*</span></label>' +
'              <input type="text" id="uNama" required placeholder="drg. Nama Dokter / Nama Staff" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500">' +
'            </div>' +
'            <div class="md:col-span-6 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Username (Huruf Kecil & Angka) <span class="text-rose-500">*</span></label>' +
'              <input type="text" id="uUsername" required placeholder="contoh: drg_anisa" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500">' +
'            </div>' +
'            <div class="md:col-span-4 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Kategori Role <span class="text-rose-500">*</span></label>' +
'              <select id="uRole" required onchange="handleUserRoleChange()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer">' +
'                <option value="Owner">Owner</option>' +
'                <option value="Dokter Gigi Spesialis">Dokter Gigi Spesialis</option>' +
'                <option value="Dokter Gigi Umum">Dokter Gigi Umum</option>' +
'                <option value="Perawat Gigi">Perawat Gigi</option>' +
'                <option value="Perawat Umum">Perawat Umum</option>' +
'                <option value="Admin">Admin</option>' +
'                <option value="Office">Office</option>' +
'              </select>' +
'            </div>' +
'            <div class="md:col-span-4 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Status Pengguna</label>' +
'              <select id="uStatus" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer">' +
'                <option value="Aktif">Aktif</option>' +
'                <option value="Cuti">Cuti</option>' +
'                <option value="Non-Aktif">Non-Aktif</option>' +
'              </select>' +
'            </div>' +
'            <div class="md:col-span-4 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">No. Registrasi / STR</label>' +
'              <input type="text" id="uNoReg" placeholder="Nomor STR / Izin Praktek" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500">' +
'            </div>' +
'            <div class="md:col-span-6 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">No. WhatsApp / HP</label>' +
'              <input type="text" id="uNoHp" placeholder="08xxxxxxxxxx" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500">' +
'            </div>' +
'            <div class="md:col-span-6 space-y-1">' +
'              <label class="block text-[11px] font-bold text-slate-700 uppercase">Password Akun <span id="lblPassWajib" class="text-rose-500">*</span></label>' +
'              <input type="password" id="uPassword" placeholder="Minimal 4 karakter" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500">' +
'              <span id="hintPass" class="hidden text-[10px] text-slate-400">Kosongkan jika tidak ingin mengubah password lama</span>' +
'            </div>' +
'          </div>' +
'          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">' +
'            <button type="button" id="btnBatalUser" onclick="resetFormUser()" class="hidden px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer">Batal Edit</button>' +
'            <button type="submit" id="btnSubmitUser" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer">' +
'              <span>💾</span> Simpan Pengguna' +
'            </button>' +
'          </div>' +
'        </form>' +
'      </div>' +

'      <!-- TABEL DAFTAR PENGGUNA -->' +
'      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">' +
'        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">' +
'          <h3 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">' +
'            <span>👥</span> Daftar Pegawai Terdaftar (<span id="countUser">0</span>)' +
'          </h3>' +
'          <input type="text" id="searchUser" oninput="renderTableUser()" placeholder="Cari Nama / Username / Role..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full md:w-64 outline-none focus:border-indigo-500">' +
'        </div>' +
'        <div class="overflow-x-auto rounded-xl border border-slate-100">' +
'          <table class="w-full text-left border-collapse text-xs">' +
'            <thead>' +
'              <tr class="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">' +
'                <th class="p-3">ID</th>' +
'                <th class="p-3">Nama Pegawai</th>' +
'                <th class="p-3">Username</th>' +
'                <th class="p-3">Kategori Role</th>' +
'                <th class="p-3 text-center">Status</th>' +
'                <th class="p-3 text-center">Aksi</th>' +
'              </tr>' +
'            </thead>' +
'            <tbody id="tbodyUser" class="divide-y divide-slate-100 font-medium text-slate-700">' +
'              <tr><td colspan="6" class="p-6 text-center text-slate-400 font-bold">Memuat data pegawai...</td></tr>' +
'            </tbody>' +
'          </table>' +
'        </div>' +
'      </div>' +
'    </div>' +

'  </div>' +

'  <!-- JAVASCRIPT LOGIC -->' +
'  <script>' +
'    let masterDokterList = [];' +
'    let masterTindakanList = [];' +
'    let listTarifKhusus = [];' +
'    let listUserMaster = [];' +

'    window.onload = function() {' +
'      loadInitialData();' +
'    };' +

'    function showAlert(msg, isSuccess) {' +
'      const el = document.getElementById("globalAlert");' +
'      el.className = isSuccess' +
'        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-bold"' +
'        : "bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-xs font-bold";' +
'      el.innerHTML = msg;' +
'      el.classList.remove("hidden");' +
'      window.scrollTo({ top: 0, behavior: "smooth" });' +
'      setTimeout(() => el.classList.add("hidden"), 5000);' +
'    }' +

'    function switchMainTab(tab) {' +
'      const pTKD = document.getElementById("tabPanelTKD");' +
'      const pUser = document.getElementById("tabPanelUser");' +
'      const bTKD = document.getElementById("tabBtnTKD");' +
'      const bUser = document.getElementById("tabBtnUser");' +

'      if (tab === "tkd") {' +
'        pTKD.classList.remove("hidden");' +
'        pUser.classList.add("hidden");' +
'        bTKD.className = "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 tab-active";' +
'        bUser.className = "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 tab-inactive";' +
'      } else {' +
'        pTKD.classList.add("hidden");' +
'        pUser.classList.remove("hidden");' +
'        bTKD.className = "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 tab-inactive";' +
'        bUser.className = "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 tab-active";' +
'      }' +
'    }' +

'    function loadInitialData() {' +
'      google.script.run.withSuccessHandler(function(dokters) {' +
'        masterDokterList = dokters || [];' +
'        populateDokterDropdown();' +
'      }).getDokterGigiList();' +

'      google.script.run.withSuccessHandler(function(tindakans) {' +
'        masterTindakanList = tindakans || [];' +
'        populateTindakanDatalist();' +
'      }).getMasterTindakanList();' +

'      loadTKDData();' +
'      loadUserData();' +
'    }' +

'    function loadTKDData() {' +
'      google.script.run.withSuccessHandler(function(res) {' +
'        listTarifKhusus = res || [];' +
'        renderTableTKD();' +
'      }).getDaftarTarifKhusus();' +
'    }' +

'    function loadUserData() {' +
'      google.script.run.withSuccessHandler(function(res) {' +
'        listUserMaster = res || [];' +
'        renderTableUser();' +
'      }).getDaftarUserMaster();' +
'    }' +

'    function populateDokterDropdown() {' +
'      const sel = document.getElementById("tkdDokter");' +
'      sel.innerHTML = "<option value=\'\'>-- Pilih Dokter Terdaftar --</option>";' +
'      masterDokterList.forEach(function(d) {' +
'        const opt = document.createElement("option");' +
'        opt.value = d.nama;' +
'        opt.textContent = d.nama + " (" + d.role + ")";' +
'        sel.appendChild(opt);' +
'      });' +
'    }' +

'    function populateTindakanDatalist() {' +
'      const dl = document.getElementById("dlTindakanList");' +
'      dl.innerHTML = "";' +
'      masterTindakanList.forEach(function(t) {' +
'        const opt = document.createElement("option");' +
'        opt.value = t.nama;' +
'        opt.label = "[" + t.kode + "] Rp " + Number(t.tarif || 0).toLocaleString("id-ID") + (t.labor === "Ya" ? " (Lab)" : "");' +
'        dl.appendChild(opt);' +
'      });' +
'    }' +

'    function onDokterSelectChange() {' +
'      // Default persen tetap kosong (tidak menimpa)' +
'      hitungSimulasi();' +
'    }' +

'    function onTindakanInputChange() {' +
'      const inp = document.getElementById("tkdTindakan");' +
'      const raw = String(inp.value || "").trim().toLowerCase();' +
'      const item = masterTindakanList.find(function(t) {' +
'        return (t.nama && t.nama.toLowerCase() === raw) || (t.kode && t.kode.toLowerCase() === raw);' +
'      });' +

'      if (item) {' +
'        inp.value = item.nama;' +
'        document.getElementById("tkdIdTindakan").value = item.kode;' +
'        document.getElementById("tkdTarif").value = item.tarif;' +
'        document.getElementById("tkdTarifDisplay").value = "Rp " + Number(item.tarif).toLocaleString("id-ID");' +
'        document.getElementById("tkdLabor").value = item.labor || "Tidak";' +
'      } else if (!raw) {' +
'        clearTindakanInput();' +
'      }' +
'      hitungSimulasi();' +
'    }' +

'    function clearTindakanInput() {' +
'      document.getElementById("tkdTindakan").value = "";' +
'      document.getElementById("tkdIdTindakan").value = "-";' +
'      document.getElementById("tkdTarif").value = "0";' +
'      document.getElementById("tkdTarifDisplay").value = "Rp 0";' +
'      document.getElementById("tkdLabor").value = "Tidak";' +
'      hitungSimulasi();' +
'    }' +

'    function hitungSimulasi() {' +
'      const tarif = Number(document.getElementById("tkdTarif").value || 0);' +
'      const labor = document.getElementById("tkdLabor").value || "Tidak";' +
'      const rawPersen = document.getElementById("tkdPersenJM").value;' +

'      document.getElementById("simTarif").textContent = "Rp " + tarif.toLocaleString("id-ID");' +
'      document.getElementById("simLab").textContent = labor === "Ya" ? "Ada (Syarat Lab)" : "Rp 0 (Tidak Ada)";' +

'      if (rawPersen === "" || isNaN(Number(rawPersen))) {' +
'        document.getElementById("simPersenDokter").textContent = "0%";' +
'        document.getElementById("simHakDokter").textContent = "Rp 0";' +
'        document.getElementById("simPersenKlinik").textContent = "100%";' +
'        document.getElementById("simHakKlinik").textContent = "Rp " + tarif.toLocaleString("id-ID");' +
'        return;' +
'      }' +

'      const pVal = Math.min(100, Math.max(0, Number(rawPersen)));' +
'      const hakDokter = Math.round(tarif * (pVal / 100));' +
'      const hakKlinik = Math.max(0, tarif - hakDokter);' +

'      document.getElementById("simPersenDokter").textContent = pVal + "%";' +
'      document.getElementById("simHakDokter").textContent = "Rp " + hakDokter.toLocaleString("id-ID");' +
'      document.getElementById("simPersenKlinik").textContent = (100 - pVal) + "%";' +
'      document.getElementById("simHakKlinik").textContent = "Rp " + hakKlinik.toLocaleString("id-ID");' +
'    }' +

'    function simpanAturanTKD() {' +
'      const btn = document.getElementById("btnSubmitTKD");' +
'      const origText = btn.innerHTML;' +
'      const payload = {' +
'        idAturan: document.getElementById("tkdIdAturan").value,' +
'        namaDokter: document.getElementById("tkdDokter").value,' +
'        namaTindakan: document.getElementById("tkdTindakan").value.trim(),' +
'        idTindakan: document.getElementById("tkdIdTindakan").value,' +
'        tarif: Number(document.getElementById("tkdTarif").value || 0),' +
'        labor: document.getElementById("tkdLabor").value,' +
'        persenJM: Number(document.getElementById("tkdPersenJM").value)' +
'      };' +

'      if (!payload.namaDokter) return showAlert("Pilih Dokter Penanggung Jawab!", false);' +
'      if (!payload.namaTindakan) return showAlert("Pilih atau ketik Nama Tindakan!", false);' +
'      if (!payload.persenJM || payload.persenJM <= 0) return showAlert("Masukkan % Hak Dokter Khusus (1-100%)!", false);' +

'      btn.disabled = true;' +
'      btn.innerHTML = "Menyimpan...";' +

'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = origText;' +
'          if (res && res.success) {' +
'            showAlert(res.message, true);' +
'            resetFormTKD();' +
'            loadTKDData();' +
'          } else {' +
'            showAlert((res && res.message) ? res.message : "Gagal menyimpan", false);' +
'          }' +
'        })' +
'        .withFailureHandler(function(err) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = origText;' +
'          showAlert("Error: " + (err.message || err), false);' +
'        })' +
'        .simpanTarifKhusus(payload);' +
'    }' +

'    function editAturanTKD(idAturan) {' +
'      const item = listTarifKhusus.find(x => x.idAturan === idAturan);' +
'      if (!item) return;' +

'      document.getElementById("tkdIdAturan").value = item.idAturan;' +
'      document.getElementById("tkdDokter").value = item.namaDokter;' +
'      document.getElementById("tkdTindakan").value = item.namaTindakan;' +
'      document.getElementById("tkdIdTindakan").value = item.idTindakan || "-";' +
'      document.getElementById("tkdTarif").value = item.tarif || 0;' +
'      document.getElementById("tkdTarifDisplay").value = "Rp " + Number(item.tarif || 0).toLocaleString("id-ID");' +
'      document.getElementById("tkdLabor").value = item.labor || "Tidak";' +
'      document.getElementById("tkdPersenJM").value = Math.round((item.persenJM || 0) * 100);' +

'      document.getElementById("badgeModeTKD").className = "px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider";' +
'      document.getElementById("badgeModeTKD").textContent = "Mode: Edit Aturan (" + item.idAturan + ")";' +
'      document.getElementById("btnBatalTKD").classList.remove("hidden");' +
'      document.getElementById("btnSubmitTKD").innerHTML = "<span>💾</span> Perbarui Aturan";' +

'      hitungSimulasi();' +
'      window.scrollTo({ top: 0, behavior: "smooth" });' +
'    }' +

'    function resetFormTKD() {' +
'      document.getElementById("tkdIdAturan").value = "TKD-AUTO";' +
'      document.getElementById("tkdDokter").value = "";' +
'      clearTindakanInput();' +
'      document.getElementById("tkdPersenJM").value = "";' +
'      document.getElementById("badgeModeTKD").className = "px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider";' +
'      document.getElementById("badgeModeTKD").textContent = "Mode: Tambah Baru";' +
'      document.getElementById("btnBatalTKD").classList.add("hidden");' +
'      document.getElementById("btnSubmitTKD").innerHTML = "<span>💾</span> Simpan Aturan";' +
'      hitungSimulasi();' +
'    }' +

'    function hapusAturanTKD(idAturan) {' +
'      if (!confirm("Hapus aturan " + idAturan + "?")) return;' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          if (res && res.success) {' +
'            showAlert(res.message, true);' +
'            loadTKDData();' +
'          } else {' +
'            showAlert((res && res.message) ? res.message : "Gagal menghapus", false);' +
'          }' +
'        })' +
'        .hapusTarifKhusus(idAturan);' +
'    }' +

'    function renderTableTKD() {' +
'      const q = String(document.getElementById("searchTKD").value || "").toLowerCase().trim();' +
'      const tbody = document.getElementById("tbodyTKD");' +
'      const filtered = listTarifKhusus.filter(function(x) {' +
'        if (!q) return true;' +
'        return (x.idAturan && x.idAturan.toLowerCase().includes(q)) ||' +
'               (x.namaDokter && x.namaDokter.toLowerCase().includes(q)) ||' +
'               (x.namaTindakan && x.namaTindakan.toLowerCase().includes(q)) ||' +
'               (x.idTindakan && x.idTindakan.toLowerCase().includes(q));' +
'      });' +

'      document.getElementById("countTKD").textContent = filtered.length;' +
'      if (filtered.length === 0) {' +
'        tbody.innerHTML = "<tr><td colspan=\'8\' class=\'p-6 text-center text-slate-400 font-medium\'>Tidak ada aturan yang cocok.</td></tr>";' +
'        return;' +
'      }' +

'      tbody.innerHTML = filtered.map(function(r) {' +
'        return "<tr class=\'hover:bg-slate-50/80 transition-colors\'>" +' +
'          "<td class=\'p-3 font-mono font-bold text-slate-900\'>" + r.idAturan + "</td>" +' +
'          "<td class=\'p-3 font-bold text-slate-800\'>" + r.namaDokter + "</td>" +' +
'          "<td class=\'p-3 font-mono text-[11px] text-slate-500\'>" + (r.idTindakan || "-") + "</td>" +' +
'          "<td class=\'p-3 font-semibold text-slate-700\'>" + r.namaTindakan + "</td>" +' +
'          "<td class=\'p-3 text-right font-extrabold text-emerald-700\'>Rp " + Number(r.tarif || 0).toLocaleString("id-ID") + "</td>" +' +
'          "<td class=\'p-3 text-center\'><span class=\'px-2 py-0.5 rounded text-[10px] font-bold " + (r.labor === "Ya" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500") + "\'>" + r.labor + "</span></td>" +' +
'          "<td class=\'p-3 text-center\'><span class=\'px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-xs\'>" + r.persenJMDisplay + "</span></td>" +' +
'          "<td class=\'p-3 text-center space-x-1\'>" +' +
'            "<button onclick=\'editAturanTKD(\\\"" + r.idAturan + "\\\")\' class=\'px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-bold text-[11px] transition-colors\'>Edit</button>" +' +
'            "<button onclick=\'hapusAturanTKD(\\\"" + r.idAturan + "\\\")\' class=\'px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[11px] transition-colors\'>Hapus</button>" +' +
'          "</td>" +' +
'        "</tr>";' +
'      }).join("");' +
'    }' +

'    // USER FUNCTIONS' +
'    function handleUserRoleChange() {}' +
'    function simpanDataUser() {' +
'      const payload = {' +
'        mode: document.getElementById("userMode").value,' +
'        nama: document.getElementById("uNama").value.trim(),' +
'        username: document.getElementById("uUsername").value.trim(),' +
'        role: document.getElementById("uRole").value,' +
'        status: document.getElementById("uStatus").value,' +
'        noReg: document.getElementById("uNoReg").value.trim(),' +
'        noHp: document.getElementById("uNoHp").value.trim(),' +
'        password: document.getElementById("uPassword").value.trim()' +
'      };' +
'      if (!payload.nama || !payload.username) return showAlert("Nama dan username wajib diisi!", false);' +
'      if (payload.mode === "tambah" && (!payload.password || payload.password.length < 4)) return showAlert("Password minimal 4 karakter!", false);' +

'      const btn = document.getElementById("btnSubmitUser");' +
'      btn.disabled = true;' +
'      btn.innerHTML = "Menyimpan...";' +

'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = "<span>💾</span> Simpan Pengguna";' +
'          if (res && res.success) {' +
'            showAlert(res.message, true);' +
'            resetFormUser();' +
'            loadUserData();' +
'          } else {' +
'            showAlert((res && res.message) ? res.message : "Gagal simpan user", false);' +
'          }' +
'        })' +
'        .withFailureHandler(function(err) {' +
'          btn.disabled = false;' +
'          btn.innerHTML = "<span>💾</span> Simpan Pengguna";' +
'          showAlert("Error: " + (err.message || err), false);' +
'        })' +
'        .simpanUserMaster(payload);' +
'    }' +

'    function editDataUser(username) {' +
'      const u = listUserMaster.find(x => x.username.toLowerCase() === username.toLowerCase());' +
'      if (!u) return;' +
'      document.getElementById("userMode").value = "edit";' +
'      document.getElementById("uNama").value = u.nama || "";' +
'      document.getElementById("uUsername").value = u.username || "";' +
'      document.getElementById("uUsername").readOnly = true;' +
'      document.getElementById("uRole").value = u.role || "Staff";' +
'      document.getElementById("uStatus").value = u.status || "Aktif";' +
'      document.getElementById("uNoReg").value = u.noReg === "-" ? "" : (u.noReg || "");' +
'      document.getElementById("uNoHp").value = u.noHp || "";' +
'      document.getElementById("uPassword").value = "";' +
'      document.getElementById("uPassword").required = false;' +
'      document.getElementById("lblPassWajib").textContent = "(opsional)";' +
'      document.getElementById("hintPass").classList.remove("hidden");' +
'      document.getElementById("btnBatalUser").classList.remove("hidden");' +
'      document.getElementById("btnSubmitUser").innerHTML = "<span>💾</span> Perbarui Pengguna";' +
'      window.scrollTo({ top: 0, behavior: "smooth" });' +
'    }' +

'    function resetFormUser() {' +
'      document.getElementById("userMode").value = "tambah";' +
'      document.getElementById("uNama").value = "";' +
'      const uInp = document.getElementById("uUsername");' +
'      uInp.value = "";' +
'      uInp.readOnly = false;' +
'      document.getElementById("uRole").value = "Dokter Gigi Umum";' +
'      document.getElementById("uStatus").value = "Aktif";' +
'      document.getElementById("uNoReg").value = "";' +
'      document.getElementById("uNoHp").value = "";' +
'      document.getElementById("uPassword").value = "";' +
'      document.getElementById("uPassword").required = true;' +
'      document.getElementById("lblPassWajib").textContent = "*";' +
'      document.getElementById("hintPass").classList.add("hidden");' +
'      document.getElementById("btnBatalUser").classList.add("hidden");' +
'      document.getElementById("btnSubmitUser").innerHTML = "<span>💾</span> Simpan Pengguna";' +
'    }' +

'    function hapusDataUser(username) {' +
'      if (!confirm("Nonaktifkan user " + username + "?")) return;' +
'      google.script.run' +
'        .withSuccessHandler(function(res) {' +
'          if (res && res.success) { showAlert(res.message, true); loadUserData(); } else { showAlert(res ? res.message : "Gagal", false); }' +
'        })' +
'        .hapusUserMaster(username, false);' +
'    }' +

'    function renderTableUser() {' +
'      const q = String(document.getElementById("searchUser").value || "").toLowerCase().trim();' +
'      const tbody = document.getElementById("tbodyUser");' +
'      const filtered = listUserMaster.filter(function(x) {' +
'        if (!q) return true;' +
'        return (x.nama && x.nama.toLowerCase().includes(q)) ||' +
'               (x.username && x.username.toLowerCase().includes(q)) ||' +
'               (x.role && x.role.toLowerCase().includes(q)) ||' +
'               (x.idPekerja && x.idPekerja.toLowerCase().includes(q));' +
'      });' +

'      document.getElementById("countUser").textContent = filtered.length;' +
'      if (filtered.length === 0) {' +
'        tbody.innerHTML = "<tr><td colspan=\'6\' class=\'p-6 text-center text-slate-400 font-medium\'>Tidak ada pengguna.</td></tr>";' +
'        return;' +
'      }' +

'      tbody.innerHTML = filtered.map(function(u) {' +
'        return "<tr class=\'hover:bg-slate-50/80 transition-colors\'>" +' +
'          "<td class=\'p-3 font-mono font-bold text-slate-900\'>" + (u.idPekerja || "-") + "</td>" +' +
'          "<td class=\'p-3 font-bold text-slate-800\'>" + u.nama + "</td>" +' +
'          "<td class=\'p-3 font-mono text-slate-600\'>" + u.username + "</td>" +' +
'          "<td class=\'p-3\'><span class=\'px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700\'>" + u.role + "</span></td>" +' +
'          "<td class=\'p-3 text-center\'><span class=\'px-2 py-0.5 rounded font-bold text-[10px] " + (u.status === "Aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500") + "\'>" + u.status + "</span></td>" +' +
'          "<td class=\'p-3 text-center space-x-1\'>" +' +
'            "<button onclick=\'editDataUser(\\\"" + u.username + "\\\")\' class=\'px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-bold text-[11px] transition-colors\'>Edit</button>" +' +
'            "<button onclick=\'hapusDataUser(\\\"" + u.username + "\\\")\' class=\'px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[11px] transition-colors\'>Nonaktifkan</button>" +' +
'          "</td>" +' +
'        "</tr>";' +
'      }).join("");' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}
