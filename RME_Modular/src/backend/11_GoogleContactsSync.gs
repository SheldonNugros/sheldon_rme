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
      ScriptApp.deleteTrigger(t);
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
