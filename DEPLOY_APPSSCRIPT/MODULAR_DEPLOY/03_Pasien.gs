// =========================================================================
// FUNGSI DATABASE PASIEN (LOGIKA AUTO-INCREASE ID & NO RM)
// =========================================================================

function getInitPasien() {
  return getDaftarPasien();
}

function getDaftarPekerjaan() {
  try {
    const v = readFast(DB_CONFIG.LOG, "pekerjaan");
    if (v.length <= 1) return [];
    let h = v[0];
    let idx = getColIdx(h, ['nama_pekerjaan', 'namapekerjaan', 'pekerjaan', 'nama']);
    if (idx === -1) idx = 0;
    
    let result = [];
    for (let i = 1; i < v.length; i++) {
      let namaPekerjaan = String(v[i][idx]).trim();
      if (namaPekerjaan !== "") {
        result.push(namaPekerjaan);
      }
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getDaftarPasien() {
  const cacheKey = "INIT_PASIEN_CACHE_V1";
  const cached = getCacheJson(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) return cached;

  try {
    const v = readFast(DB_CONFIG.PASIEN, "Data_Pasien");
    if (v.length <= 1) return [];
    let h = v[0];
    
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 2;
    let idJK = getColIdx(h, ['jeniskelamin', 'gender', 'kelamin']); if (idJK === -1) idJK = 3;
    let idTmptLahir = getColIdx(h, ['tempatlahir']);
    let idLahir = getColIdx(h, ['tanggallahir', 'lahir']); if (idLahir === -1) idLahir = 5;
    let idUmur = getColIdx(h, ['umur', 'usia']); if (idUmur === -1) idUmur = 6;
    let idAgama = getColIdx(h, ['agama', 'religion']); if (idAgama === -1) idAgama = 7;
    let idGoldar = getColIdx(h, ['golongandarah', 'goldar']);
    let idPekerjaan = getColIdx(h, ['pekerjaan']);
    let idNIK = getColIdx(h, ['nik', 'ktp']);
    let idAlamat = getColIdx(h, ['alamat']);
    let idProv = getColIdx(h, ['provinsi', 'prov']);
    let idKab = getColIdx(h, ['kabupaten', 'kota', 'kab']);
    let idKec = getColIdx(h, ['kecamatan', 'kec']);
    let idKel = getColIdx(h, ['kelurahan', 'desa', 'kel']);
    let idWA = getColIdx(h, ['whatsapp', 'nohp', 'telepon', 'hp']);
    let idAlergi = getColIdx(h, ['alergi', 'riwayatalergi']);
    let idRiwayat = getColIdx(h, ['riwayatpenyakit', 'riwayat', 'sistemik']);
    let idCatatan = getColIdx(h, ['catatan', 'keterangan', 'catatantambahan']);
    let idTglDaftar = getColIdx(h, ['waktudaftar', 'tanggaldaftar', 'waktu', 'tanggal']);
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idID] && !r[idNama]) continue;
      
      let st = (idStatus !== -1 && r[idStatus]) ? String(r[idStatus]).trim().toLowerCase() : "aktif";
      if (st === "nonaktif" || st === "terhapus") continue;
      result.push({
        idPasien: r[idID] ? String(r[idID]).trim() : "",
        namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
        noRm: r[idRM] ? String(r[idRM]).trim() : "",
        jenisKelamin: r[idJK] ? String(r[idJK]).trim() : "",
        tempatLahir: (idTmptLahir !== -1 && r[idTmptLahir]) ? String(r[idTmptLahir]).trim() : "",
        tanggalLahir: fDate(r[idLahir]),
        umur: r[idUmur] ? String(r[idUmur]).trim() : "",
        agama: (idAgama !== -1 && r[idAgama]) ? String(r[idAgama]).trim() : "",
        golonganDarah: (idGoldar !== -1 && r[idGoldar]) ? String(r[idGoldar]).trim() : "",
        pekerjaan: (idPekerjaan !== -1 && r[idPekerjaan]) ? String(r[idPekerjaan]).trim() : "",
        nik: (idNIK !== -1 && r[idNIK]) ? String(r[idNIK]).replace(/'/g, '').trim() : "",
        alamat: (idAlamat !== -1 && r[idAlamat]) ? String(r[idAlamat]).trim() : "",
        provinsi: (idProv !== -1 && r[idProv]) ? String(r[idProv]).trim() : "",
        kabupaten: (idKab !== -1 && r[idKab]) ? String(r[idKab]).trim() : "",
        kecamatan: (idKec !== -1 && r[idKec]) ? String(r[idKec]).trim() : "",
        kelurahan: (idKel !== -1 && r[idKel]) ? String(r[idKel]).trim() : "",
        whatsapp: (idWA !== -1 && r[idWA]) ? String(r[idWA]).replace(/'/g, '').trim() : "",
        alergi: (idAlergi !== -1 && r[idAlergi]) ? String(r[idAlergi]).trim() : "",
        riwayatPenyakit: (idRiwayat !== -1 && r[idRiwayat]) ? String(r[idRiwayat]).trim() : "",
        catatan: (idCatatan !== -1 && r[idCatatan]) ? String(r[idCatatan]).trim() : "",
        tglDaftar: (idTglDaftar !== -1 && r[idTglDaftar]) ? fDate(r[idTglDaftar]) : ""
      });
    }
    let finalResult = result.reverse();
    putCacheJson(cacheKey, finalResult, 300);
    return finalResult;
  } catch (e) {
    Logger.log("❌ Error getDaftarPasien: " + e.message);
    throw new Error("Gagal membaca Data_Pasien: " + e.message);
  }
}

function simpanPasien(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    let v = sheet.getDataRange().getValues();
    
    if (v.length === 0) {
      sheet.appendRow([
        'ID_Pasien', 'Nama_Pasien', 'No_RM', 'Jenis_Kelamin', 'Tempat_Lahir', 'Tanggal_Lahir', 'Umur',
        'Agama', 'Golongan_Darah', 'Pekerjaan', 'NIK', 'Alamat', 'Provinsi', 'Kabupaten', 'Kecamatan',
        'Kelurahan', 'WhatsApp', 'Alergi', 'Riwayat_Penyakit', 'Catatan', 'Tanggal_Daftar'
      ]);
      v = sheet.getDataRange().getValues();
    }
    
    let h = v[0];
    let isBaru = false;
    let rowIdx = -1;
    
    let idCol = getColIdx(h, ['idpasien', 'id']); if (idCol === -1) idCol = 0;
    let idxColRm = getColIdx(h, ['norm', 'rm']);

    // CEK DATA: EDIT vs BARU
    if (payload.idPasien) {
      let searchId = String(payload.idPasien).trim().toLowerCase();
      for (let i = 1; i < v.length; i++) {
        if (String(v[i][idCol] || "").trim().toLowerCase() === searchId) {
          rowIdx = i + 1;
          break;
        }
      }
    }
    // Fallback pencarian No RM jika idPasien belum cocok tetapi noRm terisi
    if (rowIdx === -1 && payload.noRm && idxColRm !== -1) {
      let searchRm = String(payload.noRm).trim().toLowerCase();
      for (let i = 1; i < v.length; i++) {
        if (String(v[i][idxColRm] || "").trim().toLowerCase() === searchRm) {
          rowIdx = i + 1;
          break;
        }
      }
    }

    // =====================================================================
    // LAPIS 3: AUTO-GUARD ANTI-DUPLIKASI (SERVER-SIDE VALIDATION)
    // =====================================================================
    let idxNama = getColIdx(h, ['namapasien', 'nama']);
    let idxLahir = getColIdx(h, ['tanggallahir', 'lahir']);
    let idxNik = getColIdx(h, ['nik', 'ktp']);

    if (rowIdx === -1) {
      // 1. Cek NIK Unik jika diisi
      let cleanInputNik = payload.nik ? String(payload.nik).trim() : "";
      if (cleanInputNik !== "" && idxNik !== -1) {
        for (let i = 1; i < v.length; i++) {
          let existNik = String(v[i][idxNik] || "").trim();
          if (existNik && existNik === cleanInputNik) {
            let existNama = idxNama !== -1 ? String(v[i][idxNama] || "").trim() : "Pasien";
            let existRm = idxColRm !== -1 ? String(v[i][idxColRm] || "").trim() : "";
            return {
              success: false,
              message: `GAGAL: NIK ${cleanInputNik} sudah terdaftar atas nama "${existNama}" (No. RM: ${existRm}). Tidak boleh ada NIK ganda.`
            };
          }
        }
      }

      // 2. Cek Nama Pasien + Tanggal Lahir Sama Persis
      let cleanInputNama = payload.namaPasien ? String(payload.namaPasien).trim().toLowerCase().replace(/\s+/g, ' ') : "";
      let cleanInputLahir = "";
      if (payload.tanggalLahir) {
        let raw = String(payload.tanggalLahir).trim();
        let parts = raw.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) cleanInputLahir = `${parts[2]}-${parts[1]}-${parts[0]}`;
          else cleanInputLahir = `${parts[0]}-${parts[1]}-${parts[2]}`;
        } else {
          cleanInputLahir = raw;
        }
      }

      if (cleanInputNama && cleanInputLahir && idxNama !== -1 && idxLahir !== -1) {
        for (let i = 1; i < v.length; i++) {
          let existNama = String(v[i][idxNama] || "").trim().toLowerCase().replace(/\s+/g, ' ');
          let rawExistLahir = v[i][idxLahir];
          let existLahir = "";
          if (rawExistLahir instanceof Date && !isNaN(rawExistLahir.getTime())) {
            existLahir = Utilities.formatDate(rawExistLahir, "Asia/Jakarta", "dd-MM-yyyy");
          } else if (rawExistLahir) {
            let s = String(rawExistLahir).trim();
            let p = s.split(/[-/]/);
            if (p.length === 3) {
              if (p[0].length === 4) existLahir = `${p[2]}-${p[1]}-${p[0]}`;
              else existLahir = `${p[0]}-${p[1]}-${p[2]}`;
            } else {
              existLahir = s;
            }
          }

          if (existNama === cleanInputNama && existLahir === cleanInputLahir) {
            let existRm = idxColRm !== -1 ? String(v[i][idxColRm] || "").trim() : "";
            let existId = idCol !== -1 ? String(v[i][idCol] || "").trim() : "";
            return {
              success: false,
              message: `GAGAL: Pasien bernama "${payload.namaPasien}" dengan Tanggal Lahir "${payload.tanggalLahir}" sudah terdaftar di sistem dengan No. RM: ${existRm} (ID: ${existId}). Silakan cari dan gunakan data yang sudah ada alih-alih membuat pasien baru.`
            };
          }
        }
      }
    }
    
    // JIKA PASIEN BARU -> GENERATE KODE (PS-MMYY-XXXX & [Initial]-XXXX)
    if (rowIdx === -1) {
      isBaru = true;
      let sheetMaxId = 0;
      let sheetMaxRm = 0;

      for (let i = 1; i < v.length; i++) {
        let currId = idCol !== -1 && v[i][idCol] ? String(v[i][idCol]).trim() : "";
        let currRm = idxColRm !== -1 && v[i][idxColRm] ? String(v[i][idxColRm]).trim() : "";

        let matchId = currId.match(/^PS-\d{4}-(\d{4})$/i);
        if (matchId) {
          let seq = parseInt(matchId[1], 10);
          if (!isNaN(seq) && seq > sheetMaxId) sheetMaxId = seq;
        }

        let matchRm = currRm.match(/^[A-Z]-(\d{4})$/i);
        if (matchRm) {
          let seq = parseInt(matchRm[1], 10);
          if (!isNaN(seq) && seq > sheetMaxRm) sheetMaxRm = seq;
        }
      }

      let props = PropertiesService.getScriptProperties();
      let globalMaxId = parseInt(props.getProperty('GLOBAL_MAX_ID') || '0', 10);
      let globalMaxRm = parseInt(props.getProperty('GLOBAL_MAX_RM') || '0', 10);

      let nextIdSeq = Math.max(sheetMaxId, globalMaxId) + 1;
      let nextRmSeq = Math.max(sheetMaxRm, globalMaxRm) + 1;
      
      let d = new Date();
      let mm = ("0" + (d.getMonth() + 1)).slice(-2);
      let yy = d.getFullYear().toString().slice(-2);
      
      payload.idPasien = "PS-" + mm + yy + "-" + ("0000" + nextIdSeq).slice(-4);
      
      if (!payload.noRm || payload.noRm.trim() === "") {
        let firstLetter = payload.namaPasien ? payload.namaPasien.trim().charAt(0).toUpperCase() : "X";
        if (!firstLetter.match(/[A-Z]/)) firstLetter = "X";
        payload.noRm = firstLetter + "-" + ("0000" + nextRmSeq).slice(-4);
      }
      
      rowIdx = sheet.getLastRow() + 1;
      
      props.setProperty('GLOBAL_MAX_ID', nextIdSeq.toString());
      props.setProperty('GLOBAL_MAX_RM', nextRmSeq.toString());
    }
    
    let newRow = new Array(h.length).fill("");
    
    // JIKA EDIT: Gunakan baris lama untuk mengunci ID Pasien & No RM
    if (!isBaru && rowIdx <= v.length) {
      newRow = [...v[rowIdx - 1]];
      payload.idPasien = newRow[idCol];
      if (idxColRm !== -1 && newRow[idxColRm]) {
        payload.noRm = newRow[idxColRm];
      }
    }

    const mapToCol = (keywords, val) => {
      let idx = getColIdx(h, keywords);
      if (idx !== -1) newRow[idx] = val !== undefined ? val : "";
    };

    mapToCol(['idpasien', 'id'], payload.idPasien);
    mapToCol(['namapasien', 'nama'], payload.namaPasien);
    mapToCol(['norm', 'rm'], payload.noRm);
    mapToCol(['jeniskelamin', 'gender', 'kelamin'], payload.jenisKelamin);
    mapToCol(['tempatlahir'], payload.tempatLahir);
    mapToCol(['tanggallahir', 'lahir'], payload.tanggalLahir);
    mapToCol(['umur', 'usia'], payload.umur);
    mapToCol(['agama', 'religion'], payload.agama);
    mapToCol(['golongandarah', 'goldar'], payload.golonganDarah);
    mapToCol(['pekerjaan'], payload.pekerjaan);
    mapToCol(['nik', 'ktp'], payload.nik ? "'" + String(payload.nik).replace(/^'+/, '') : "");
    mapToCol(['alamat'], payload.alamat);
    mapToCol(['provinsi', 'prov'], payload.provinsi);
    mapToCol(['kabupaten', 'kota', 'kab'], payload.kabupaten);
    mapToCol(['kecamatan', 'kec'], payload.kecamatan);
    mapToCol(['kelurahan', 'desa', 'kel'], payload.kelurahan);
    mapToCol(['whatsapp', 'nohp', 'telepon', 'hp'], payload.whatsapp ? "'" + String(payload.whatsapp).replace(/^'+/, '') : "");
    mapToCol(['alergi', 'riwayatalergi'], payload.alergi);
    mapToCol(['riwayatpenyakit', 'riwayat', 'sistemik'], payload.riwayatPenyakit);
    mapToCol(['catatan', 'keterangan'], payload.catatan);

    let idxWaktu = getColIdx(h, ['waktudaftar', 'tanggaldaftar', 'waktu', 'tanggal']);
    if (idxWaktu !== -1 && isBaru) {
      newRow[idxWaktu] = payload.tglDaftar ? payload.tglDaftar : fDate(new Date());
    } else if (idxWaktu !== -1 && !isBaru && payload.tglDaftar) {
      newRow[idxWaktu] = payload.tglDaftar;
    }

    if (isBaru) {
      sheet.appendRow(newRow);
      catatLog("Pendaftaran Pasien", "Mendaftarkan pasien baru: " + payload.namaPasien + " (RM: " + payload.noRm + ")", payload.currentUser);
    } else {
      sheet.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
      catatLog("Update Pasien", "Memperbarui data pasien: " + payload.namaPasien + " (RM: " + payload.noRm + ")", payload.currentUser);
    }
    removeCacheKey("INIT_PASIEN_CACHE_V1");
    return {
      success: true,
      message: isBaru ? "Data Pasien berhasil didaftarkan!" : "Data Pasien berhasil diperbarui!",
      idPasien: payload.idPasien,
      noRm: payload.noRm,
      isBaru: isBaru
    };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan pasien: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function hapusPasienPermanen(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    // Verifikasi Otorisasi Sisi Server
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }

    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    let v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: false, message: "Database pasien kosong." };

    let h = v[0];
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    let targetRow = -1;
    let targetNama = "";
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][idID]).trim() === String(payload.idPasien).trim()) {
        targetRow = i + 1;
        targetNama = String(v[i][idNama] || "");
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "Pasien dengan ID " + payload.idPasien + " tidak ditemukan." };
    }

    // SOFT-DELETE: Jangan hapus fisik baris agar tidak merusak relasi rekam medis / invoice lama
    if (idStatus === -1) {
      let lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue("Status_Aktif");
      idStatus = lastCol;
    }

    sheet.getRange(targetRow, idStatus + 1).setValue("Nonaktif");
    catatLog("Hapus Pasien", "Owner menonaktifkan pasien (Soft-Delete aman): " + targetNama + " (ID: " + payload.idPasien + ")", payload.currentUser);
    removeCacheKey("INIT_PASIEN_CACHE_V1");
    return { success: true, message: "Data Pasien (" + targetNama + ") berhasil dinonaktifkan (Arsip Medis Aman)!" };
  } catch (e) {
    return { success: false, message: "Gagal menghapus pasien: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * FUNGSI AUDIT: Mengambil seluruh kelompok data pasien ganda
 * Menghasilkan rincian No RM, Nama Pasien, Tanggal Lahir, NIK, dan No HP
 */
function auditDaftarPasienGanda() {
  try {
    const sheet = getSheetEksternal(DB_CONFIG.PASIEN, "Data_Pasien");
    const v = sheet.getDataRange().getValues();
    if (v.length <= 1) return { success: true, data: [], message: "Database pasien kosong." };

    const h = v[0];
    let idID = getColIdx(h, ['idpasien', 'id']); if (idID === -1) idID = 0;
    let idNama = getColIdx(h, ['namapasien', 'nama']); if (idNama === -1) idNama = 1;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 2;
    let idLahir = getColIdx(h, ['tanggallahir', 'lahir']);
    let idNik = getColIdx(h, ['nik', 'ktp']);
    let idWA = getColIdx(h, ['whatsapp', 'nohp', 'telepon', 'hp']);
    let idStatus = getColIdx(h, ['statusaktif', 'status_aktif', 'status']);

    const kelompokMap = new Map();

    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (idStatus !== -1) {
        let st = String(r[idStatus] || "").toLowerCase().trim();
        if (st === "nonaktif" || st === "terhapus") continue;
      }

      let idPasien = String(r[idID] || "").trim();
      let rawNama = String(r[idNama] || "").trim();
      if (!rawNama) continue;

      let namaClean = rawNama.toLowerCase().replace(/\s+/g, ' ');
      let noRm = idRM !== -1 ? String(r[idRM] || "").trim() : "";
      let nik = idNik !== -1 ? String(r[idNik] || "").replace(/'/g, '').trim() : "";
      let wa = idWA !== -1 ? String(r[idWA] || "").replace(/'/g, '').trim() : "";

      let tglStr = "";
      if (idLahir !== -1 && r[idLahir]) {
        let rawLahir = r[idLahir];
        if (rawLahir instanceof Date && !isNaN(rawLahir.getTime())) {
          tglStr = Utilities.formatDate(rawLahir, "Asia/Jakarta", "dd-MM-yyyy");
        } else {
          let s = String(rawLahir).trim();
          let p = s.split(/[-/]/);
          if (p.length === 3) {
            if (p[0].length === 4) tglStr = `${p[2]}-${p[1]}-${p[0]}`;
            else tglStr = `${p[0]}-${p[1]}-${p[2]}`;
          } else {
            tglStr = s;
          }
        }
      }

      // Kunci Pengelompokan: Nama Pasien + Tanggal Lahir (Kombinasi Medis Baku)
      let key = tglStr ? `${namaClean} | ${tglStr}` : `${namaClean} | [Tanpa Tgl Lahir]`;

      if (!kelompokMap.has(key)) {
        kelompokMap.set(key, []);
      }
      kelompokMap.get(key).push({
        baris: i + 1,
        idPasien: idPasien,
        noRm: noRm,
        namaPasien: rawNama,
        tanggalLahir: tglStr || "-",
        nik: nik || "-",
        whatsapp: wa || "-"
      });
    }

    let hasilDuplikat = [];
    kelompokMap.forEach((pasienList, key) => {
      if (pasienList.length > 1) {
        hasilDuplikat.push({
          kunciIdentitas: key,
          jumlahKembar: pasienList.length,
          anggota: pasienList
        });
      }
    });

    Logger.log("Audit Selesai. Ditemukan " + hasilDuplikat.length + " kelompok pasien dengan Nama & Tanggal Lahir kembar.");
    return {
      success: true,
      totalKelompok: hasilDuplikat.length,
      totalBarisKembar: hasilDuplikat.reduce((acc, cur) => acc + cur.jumlahKembar, 0),
      data: hasilDuplikat
    };
  } catch (err) {
    Logger.log("Error audit: " + err.message);
    return { success: false, message: err.message };
  }
}
