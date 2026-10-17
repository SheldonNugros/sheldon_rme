// =========================================================================
// FUNGSI REKAM MEDIS (EMR), ODONTOGRAM, DAN ICD-10
// =========================================================================

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
      
      let anaRaw = r[idAna] ? String(r[idAna]).trim() : "";
      let fisRaw = r[idFis] ? String(r[idFis]).trim() : "";
      let tinRaw = r[idTin] ? String(r[idTin]).trim() : "";
      let obtRaw = r[idObat] ? String(r[idObat]).trim() : "";

      let ccVal = "", piVal = "", icdVal = "", penunjangVal = "Pemeriksaan Klinis Intraoral", tindVal = "", resepVal = "";
      try {
        let anaObj = JSON.parse(anaRaw);
        ccVal = anaObj.cc || anaObj.keluhanUtama || "";
        piVal = anaObj.pi || anaObj.riwayatPenyakit || "";
        if (Array.isArray(anaObj.diagnosaICD)) icdVal = anaObj.diagnosaICD.join(", ");
      } catch (eA) { ccVal = anaRaw; }
      try {
        let tinArr = JSON.parse(tinRaw);
        if (Array.isArray(tinArr)) {
          tindVal = tinArr.map(t => (typeof t === "object" ? (t.nama || "") : String(t))).join(", ");
        }
      } catch (eT) { tindVal = tinRaw; }
      try {
        let obtArr = JSON.parse(obtRaw);
        if (Array.isArray(obtArr)) {
          resepVal = obtArr.map(o => (typeof o === "object" ? ((o.obat || o.nama || "") + (o.ket ? " (" + o.ket + ")" : "")) : String(o))).join(", ");
        }
      } catch (eO) { resepVal = obtRaw; }

      result.push({
        idRmKlinis: r[idRM] ? String(r[idRM]).trim() : ("RM_LAMA_" + i),
        waktuSimpan: wStr,
        idPasien: String(r[idPas]).trim(),
        noRm: r[idNoRm] ? String(r[idNoRm]).trim() : "",
        namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
        tanggalPeriksa: fDate(r[idTgl]),
        dokterPemeriksa: r[idDok] ? String(r[idDok]).trim() : "",
        anamnesisStr: anaRaw,
        fisikStr: fisRaw,
        odontogramStr: r[idOdo] ? String(r[idOdo]).trim() : "",
        tindakanStr: tinRaw,
        obatStr: obtRaw,
        catatanEdukasi: r[idEdu] ? String(r[idEdu]).trim() : "",
        chiefComplaint: ccVal,
        presentIllness: piVal,
        pemeriksaanPenunjang: penunjangVal,
        assessmentICD: icdVal,
        tindakanHariIni: tindVal,
        resepObat: resepVal
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

    // Validasi backend: Jika obat diisi, Qty wajib ada dan valid (> 0)
    if (payload && payload.obatStr) {
      try {
        let obtList = JSON.parse(payload.obatStr);
        if (Array.isArray(obtList)) {
          for (let oi = 0; oi < obtList.length; oi++) {
            let oItem = obtList[oi];
            if (oItem && (oItem.obat || oItem.nama)) {
              let namaObat = String(oItem.obat || oItem.nama).trim();
              let qVal = parseInt(oItem.qty, 10);
              if (namaObat !== "" && (isNaN(qVal) || qVal <= 0)) {
                return {
                  success: false,
                  message: "Gagal Simpan: Jumlah / Qty wajib diisi (> 0) untuk resep obat '" + namaObat + "'!"
                };
              }
            }
          }
        }
      } catch (eObat) {}
    }

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
