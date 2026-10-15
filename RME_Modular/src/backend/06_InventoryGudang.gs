// =========================================================================
// FUNGSI INVENTORY, GUDANG & RESTOCK (OBAT & BMHP)
// =========================================================================

function getDaftarObatLengkap() {
  try {
    const v = readFast(DB_CONFIG.OBAT, "Master_Obat");
    if (v.length <= 1) return [];
    let h = v[0];
    let idK = getColIdx(h, ['id_obat', 'idobat', 'kode_item', 'kodeitem', 'kode']); if (idK === -1) idK = 0;
    let idN = getColIdx(h, ['nama_obat', 'namaobat', 'nama']); if (idN === -1) idN = 1;
    let idKand = getColIdx(h, ['kandungan_obat', 'kandungan', 'komposisi', 'zat_aktif']);
    let idSatBeli = getColIdx(h, ['satuan_beli', 'satuanbeli']);
    let idIsi = getColIdx(h, ['isi_per_satuan', 'isi_persatuan', 'isi']);
    let idHrgBeli = getColIdx(h, ['harga_beli_satuan', 'hargabelisatuan', 'harga_beli']);
    let idHPP = getColIdx(h, ['hpp_pcs', 'hpppcs', 'hpp']);
    let idMargin = getColIdx(h, ['margin_persen', 'margin']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']); if (idH === -1) idH = 4;
    let idStk = getColIdx(h, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stock_minimum', 'stockminimum', 'stok_minimum', 'kritis', 'stokmin']);
    let idTerjual = getColIdx(h, ['terjual', 'total_terjual', 'totalterjual']);
    let idExp = getColIdx(h, ['tanggal_kadaluarsa', 'tanggalkadaluarsa', 'expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);
    let idS = getColIdx(h, ['satuan']);

    return v.slice(1).filter(r => r[idN]).map(r => {
      let hpp = parseHarga(idHPP !== -1 ? r[idHPP] : 0);
      let hj = parseHarga(r[idH] || 0);
      let isi = (idIsi !== -1 && r[idIsi]) ? parseFloat(r[idIsi]) || 1 : 1;
      let satBeli = (idSatBeli !== -1 && r[idSatBeli]) ? String(r[idSatBeli]).trim() : "Box";
      let satDefault = (idS !== -1 && r[idS]) ? String(r[idS]).trim() : "Tablet";
      let hrgBeli = parseHarga(idHrgBeli !== -1 ? r[idHrgBeli] : (hpp * isi));
      let marginVal = (idMargin !== -1 && r[idMargin] !== undefined && r[idMargin] !== "")
        ? (typeof r[idMargin] === 'number' ? Math.round(r[idMargin] * (r[idMargin] <= 1 ? 100 : 1)) : parseFloat(String(r[idMargin]).replace('%', '')))
        : (hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0);

      return {
        kode: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
        idObat: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
        nama: String(r[idN]).trim(),
        kandungan: idKand !== -1 && r[idKand] ? String(r[idKand]).trim() : "-",
        satuanBeli: satBeli,
        isiPerSatuan: isi,
        satuan: satDefault,
        hargaBeliSatuan: hrgBeli,
        hpp: hpp,
        hppPcs: hpp,
        margin: marginVal,
        harga: hj,
        hargaJual: hj,
        stok: parseFloat(idStk !== -1 ? r[idStk] : 0) || 0,
        stokMin: parseFloat(idMin !== -1 ? r[idMin] : 0) || 0,
        terjual: parseFloat(idTerjual !== -1 ? r[idTerjual] : 0) || 0,
        expired: idExp !== -1 && r[idExp] ? fDate(r[idExp]) : "-",
        supplier: idSup !== -1 && r[idSup] ? String(r[idSup]).trim() : "-",
        kategori: "Obat"
      };
    });
  } catch (e) {
    return [];
  }
}

function getDaftarBMHPLengkap() {
  try {
    const v = readFast(DB_CONFIG.BMHP, "Master_BMHP");
    if (v.length <= 1) return [];
    let h = v[0];
    let idK = getColIdx(h, ['kode_item', 'kodeitem', 'kode']); if (idK === -1) idK = 0;
    let idN = getColIdx(h, ['nama_barang', 'namabarang', 'nama']); if (idN === -1) idN = 1;
    let idS = getColIdx(h, ['satuan']);
    let idHPP = getColIdx(h, ['hpp']);
    let idH = getColIdx(h, ['harga_jual', 'hargajual', 'harga']); if (idH === -1) idH = 4;
    let idStk = getColIdx(h, ['stok_tersedia', 'stoktersedia', 'stok']);
    let idMin = getColIdx(h, ['stok_minimum', 'kritis', 'stokmin']);
    let idExp = getColIdx(h, ['expired_date', 'expireddate', 'expired', 'ed']);
    let idSup = getColIdx(h, ['supplier']);

    return v.slice(1).filter(r => r[idN]).map(r => ({
      kode: idK !== -1 && r[idK] ? String(r[idK]).trim() : "",
      nama: String(r[idN]).trim(),
      satuan: idS !== -1 && r[idS] ? String(r[idS]).trim() : "Unit",
      hpp: parseHarga(idHPP !== -1 ? r[idHPP] : 0),
      harga: parseHarga(r[idH] || 0),
      hargaJual: parseHarga(r[idH] || 0),
      stok: parseFloat(idStk !== -1 ? r[idStk] : 0) || 0,
      stokMin: parseFloat(idMin !== -1 ? r[idMin] : 0) || 0,
      expired: idExp !== -1 && r[idExp] ? fDate(r[idExp]) : "-",
      supplier: idSup !== -1 && r[idSup] ? String(r[idSup]).trim() : "-",
      kategori: "BMHP"
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Mengambil daftar inventaris gabungan (Obat & BMHP) untuk modul Manajemen Gudang.
 */
function getMasterInventory() {
  try {
    let result = [];
    
    // 1. Obat
    const vObat = readFast(DB_CONFIG.OBAT, "Master_Obat");
    if (vObat.length > 1) {
      let h = vObat[0];
      let iKode = getColIdx(h, ['id_obat', 'idobat', 'kode_item', 'kode']);
      let iNama = getColIdx(h, ['nama_obat', 'nama']);
      let iSatBeli = getColIdx(h, ['satuan_beli', 'satuanbeli']);
      let iIsi = getColIdx(h, ['isi_per_satuan', 'isi_persatuan', 'isi']);
      let iSat = getColIdx(h, ['satuan']);
      let iHpp = getColIdx(h, ['hpp_pcs', 'hpppcs', 'hpp']);
      let iHrg = getColIdx(h, ['harga_jual', 'harga']);
      let iMargin = getColIdx(h, ['margin_persen', 'margin']);
      let iStk = getColIdx(h, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stok']);
      let iMin = getColIdx(h, ['stock_minimum', 'stockminimum', 'stok_minimum', 'kritis']);
      
      for (let i = 1; i < vObat.length; i++) {
        let r = vObat[i];
        if (!r[iNama]) continue;
        let hpp = parseHarga(iHpp !== -1 ? r[iHpp] : 0);
        let hj = parseHarga(iHrg !== -1 ? r[iHrg] : 0);
        let margin = (iMargin !== -1 && r[iMargin] !== undefined && r[iMargin] !== "")
          ? (typeof r[iMargin] === 'number' ? Math.round(r[iMargin] * (r[iMargin] <= 1 ? 100 : 1)) : parseFloat(String(r[iMargin]).replace('%', '')))
          : (hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0);
        let isi = (iIsi !== -1 && r[iIsi]) ? parseFloat(r[iIsi]) || 1 : 1;
        let satBeli = (iSatBeli !== -1 && r[iSatBeli]) ? String(r[iSatBeli]).trim() : "Box";
        let satDefault = (iSat !== -1 && r[iSat]) ? String(r[iSat]).trim() : "Tablet";

        result.push({
          kode: iKode !== -1 && r[iKode] ? String(r[iKode]).trim() : "OBT-" + i,
          nama: String(r[iNama]).trim(),
          kategori: "Obat",
          satuanBeli: satBeli,
          isiPerSatuan: isi,
          satuan: satDefault,
          hpp: hpp,
          hargaJual: hj,
          margin: margin,
          stok: parseFloat(iStk !== -1 ? r[iStk] : 0) || 0,
          kritis: parseFloat(iMin !== -1 ? r[iMin] : 10) || 10
        });
      }
    }
    
    // 2. BMHP
    const vBmhp = readFast(DB_CONFIG.BMHP, "Master_BMHP");
    if (vBmhp.length > 1) {
      let h = vBmhp[0];
      let iKode = getColIdx(h, ['kode_item', 'kode']);
      let iNama = getColIdx(h, ['nama_barang', 'nama']);
      let iSat = getColIdx(h, ['satuan']);
      let iHpp = getColIdx(h, ['hpp']);
      let iHrg = getColIdx(h, ['harga_jual', 'harga']);
      let iStk = getColIdx(h, ['stok_tersedia', 'stok']);
      let iMin = getColIdx(h, ['stok_minimum', 'kritis']);
      
      for (let i = 1; i < vBmhp.length; i++) {
        let r = vBmhp[i];
        if (!r[iNama]) continue;
        let hpp = parseHarga(r[iHpp] || 0);
        let hj = parseHarga(r[iHrg] || 0);
        let margin = hpp > 0 ? Math.round(((hj - hpp) / hpp) * 100) : 0;
        result.push({
          kode: iKode !== -1 && r[iKode] ? String(r[iKode]).trim() : "BMH-" + i,
          nama: String(r[iNama]).trim(),
          kategori: "BMHP",
          satuanBeli: "Pcs",
          isiPerSatuan: 1,
          satuan: iSat !== -1 && r[iSat] ? String(r[iSat]).trim() : "Pcs",
          hpp: hpp,
          hargaJual: hj,
          margin: margin,
          stok: parseFloat(r[iStk] || 0),
          kritis: parseFloat(r[iMin] || 10)
        });
      }
    }
    
    return result;
  } catch (e) {
    return [];
  }
}

/**
 * Mencatat restock / barang masuk ke Gudang Obat atau BMHP.
 */
function simpanPembelianGudang(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    if (payload && payload.token) {
      let auth = verifikasiSesi(payload.token, ["Owner", "Super User", "Admin", "Kasir", "Office"]);
      if (!auth.valid) return { success: false, message: auth.message };
    }
    
    let isObat = payload.kode.toUpperCase().startsWith("OBT");
    let dbId = isObat ? DB_CONFIG.OBAT : DB_CONFIG.BMHP;
    let masterSheetName = isObat ? "Master_Obat" : "Master_BMHP";
    let riwayatSheetName = "Riwayat_Pembelian";
    
    let ss = SpreadsheetApp.openById(dbId);
    let sheetMaster = ss.getSheetByName(masterSheetName);
    let sheetRiwayat = ss.getSheetByName(riwayatSheetName);
    
    if (!sheetRiwayat) {
      sheetRiwayat = ss.insertSheet(riwayatSheetName);
      if (isObat) {
        sheetRiwayat.appendRow(['Tanggal', 'ID_Obat', 'Nama_Obat', 'Harga', 'Tanggal_Kadaluarsa', 'Jumlah_Beli', 'Total_Beli', 'Supplier', 'Petugas', 'Waktu_Sistem']);
      } else {
        sheetRiwayat.appendRow(['Tanggal', 'Kode_Item', 'Nama_Item', 'Qty', 'Harga_Beli', 'Subtotal', 'Supplier', 'Expired_Date', 'Petugas', 'Waktu_Sistem']);
      }
    }
    
    // Periksa data Master untuk mencari Isi per satuan
    let dataMaster = sheetMaster.getDataRange().getValues();
    let isiPerSatuan = 1;
    let idxRowMaster = -1;
    let hMaster = dataMaster.length > 0 ? dataMaster[0] : [];
    let iKodeM = getColIdx(hMaster, ['id_obat', 'idobat', 'kode_item', 'kode']);
    let iIsiM = getColIdx(hMaster, ['isi_per_satuan', 'isi_persatuan', 'isi']);
    let iStkM = getColIdx(hMaster, ['stock_tersedia', 'stocktersedia', 'stok_tersedia', 'stok']);
    let iHppM = getColIdx(hMaster, ['hpp_pcs', 'hpppcs', 'hpp']);
    let iHrgBeliM = getColIdx(hMaster, ['harga_beli_satuan', 'hargabelisatuan', 'harga_beli']);
    let iExpM = getColIdx(hMaster, ['tanggal_kadaluarsa', 'expired_date', 'exp']);
    let iSupM = getColIdx(hMaster, ['supplier']);

    for (let i = 1; i < dataMaster.length; i++) {
      let kRow = iKodeM !== -1 ? String(dataMaster[i][iKodeM]).trim().toLowerCase() : "";
      if (kRow === payload.kode.trim().toLowerCase()) {
        idxRowMaster = i;
        if (iIsiM !== -1 && dataMaster[i][iIsiM]) {
          isiPerSatuan = parseFloat(dataMaster[i][iIsiM]) || 1;
        }
        break;
      }
    }

    let qtyBeliSatuan = parseFloat(payload.qty || payload.jumlahBeli || 1) || 0;
    let totalPcs = parseFloat(payload.totalBeli) || (qtyBeliSatuan * isiPerSatuan);
    let hargaBeliSatuan = parseHarga(payload.hargaBeli || payload.harga || 0);
    let hppPcs = isiPerSatuan > 0 ? Math.round(hargaBeliSatuan / isiPerSatuan) : hargaBeliSatuan;
    let subtotal = qtyBeliSatuan * hargaBeliSatuan;
    let waktuSistem = new Date();
    
    // 1. Catat ke Riwayat Pembelian
    let hRiwayat = sheetRiwayat.getRange(1, 1, 1, sheetRiwayat.getLastColumn()).getValues()[0];
    let hasTotalBeli = getColIdx(hRiwayat, ['total_beli', 'totalbeli']) !== -1;
    let hasNoFaktur = getColIdx(hRiwayat, ['no_faktur', 'nofaktur', 'faktur', 'no_batch', 'batch']) !== -1;

    if (hasTotalBeli) {
      if (hasNoFaktur) {
        sheetRiwayat.appendRow([
          payload.tanggal || fDate(waktuSistem),
          payload.noFaktur || "-",
          payload.kode,
          payload.nama,
          hargaBeliSatuan,
          payload.expiredDate || "-",
          qtyBeliSatuan,
          totalPcs,
          payload.supplier || "-",
          payload.currentUser || "System",
          waktuSistem
        ]);
      } else {
        sheetRiwayat.appendRow([
          payload.tanggal || fDate(waktuSistem),
          payload.kode,
          payload.nama,
          hargaBeliSatuan,
          payload.expiredDate || "-",
          qtyBeliSatuan,
          totalPcs,
          payload.supplier || "-",
          payload.currentUser || "System",
          waktuSistem
        ]);
      }
    } else {
      sheetRiwayat.appendRow([
        payload.tanggal || fDate(waktuSistem),
        payload.kode,
        payload.nama,
        qtyBeliSatuan,
        hargaBeliSatuan,
        subtotal,
        payload.supplier || "-",
        payload.expiredDate || "-",
        payload.currentUser || "System",
        waktuSistem
      ]);
    }
    
    // 2. Update Stok & Harga di Master
    if (idxRowMaster !== -1 && iStkM !== -1) {
      let cellFormula = sheetMaster.getRange(idxRowMaster + 1, iStkM + 1).getFormula();
      // Jika sel Stok bukan formula otomatis, perbarui angkanya di sheet
      if (!cellFormula) {
        let stokLama = parseFloat(dataMaster[idxRowMaster][iStkM]) || 0;
        let stokBaru = stokLama + totalPcs;
        dataMaster[idxRowMaster][iStkM] = stokBaru;
      }

      if (iHrgBeliM !== -1 && hargaBeliSatuan > 0) dataMaster[idxRowMaster][iHrgBeliM] = hargaBeliSatuan;
      if (iHppM !== -1 && hppPcs > 0) dataMaster[idxRowMaster][iHppM] = hppPcs;
      if (iExpM !== -1 && payload.expiredDate) dataMaster[idxRowMaster][iExpM] = payload.expiredDate;
      if (iSupM !== -1 && payload.supplier) dataMaster[idxRowMaster][iSupM] = payload.supplier;

      sheetMaster.getRange(idxRowMaster + 1, 1, 1, dataMaster[idxRowMaster].length).setValues([dataMaster[idxRowMaster]]);
    }
    
    catatLog("Restock Gudang", "Restock " + payload.nama + " (" + qtyBeliSatuan + " satuan beli, total: " + totalPcs + " pcs)", payload.currentUser);
    
    return { success: true, message: "Restock " + payload.nama + " berhasil dicatat ke Riwayat & Stok diperbarui!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan restock: " + e.message };
  } finally {
    lock.releaseLock();
  }
}
