// =========================================================================
// FUNGSI DASAR WEB APP & UTILITIES
// =========================================================================

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Klinik Sheldon Enterprise - RME')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
