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

