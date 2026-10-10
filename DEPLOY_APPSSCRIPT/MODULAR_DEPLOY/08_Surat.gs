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
