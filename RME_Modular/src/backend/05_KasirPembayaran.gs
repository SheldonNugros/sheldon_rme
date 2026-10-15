// =========================================================================
// FUNGSI PEMBAYARAN, KASIR & INVOICE
// =========================================================================

function getDaftarPembayaran() {
  try {
    const v = readFast(DB_CONFIG.PEMBAYARAN, "Data_Pembayaran");
    if (v.length <= 1) return [];
    
    let h = v[0];
    let idInv = getColIdx(h, ['idinvoice', 'invoice', 'noinvoice']); if (idInv === -1) idInv = 0;
    let idTgl = getColIdx(h, ['tanggaltindakan', 'tanggal']); if (idTgl === -1) idTgl = 1;
    let idPas = getColIdx(h, ['idpasien']); if (idPas === -1) idPas = 2;
    let idRM = getColIdx(h, ['norm', 'rm']); if (idRM === -1) idRM = 3;
    let idNama = getColIdx(h, ['namapasien']); if (idNama === -1) idNama = 4;
    let idDokter = getColIdx(h, ['dokterpemeriksa', 'dokter']); if (idDokter === -1) idDokter = 5;
    let idKat = getColIdx(h, ['kategoriitem', 'kategori']); if (idKat === -1) idKat = 6;
    let idItem = getColIdx(h, ['namaitem', 'item', 'tindakanjson']); if (idItem === -1) idItem = 7;
    let idHrg = getColIdx(h, ['hargasatuan', 'harga']); if (idHrg === -1) idHrg = 8;
    let idQty = getColIdx(h, ['qty', 'jumlah']); if (idQty === -1) idQty = 9;
    let idLabor = getColIdx(h, ['labor']); if (idLabor === -1) idLabor = 10;
    let idDisc = getColIdx(h, ['diskonpersen', 'diskon']); if (idDisc === -1) idDisc = 11;
    let idGrTot = getColIdx(h, ['grandtotalitem', 'grandtotal']); if (idGrTot === -1) idGrTot = 12;
    let idPerawat = getColIdx(h, ['perawat']); if (idPerawat === -1) idPerawat = 13;
    let idTotInv = getColIdx(h, ['totalinvoice', 'totalbayar']); if (idTotInv === -1) idTotInv = 14;
    let idMetode = getColIdx(h, ['metodebayar', 'metode']); if (idMetode === -1) idMetode = 15;
    let idStatus = getColIdx(h, ['statuspembayaran', 'status']); if (idStatus === -1) idStatus = 16;
    let idKet = getColIdx(h, ['keterangan', 'ket', 'catatan']); if (idKet === -1) idKet = 17;
    let idKasir = getColIdx(h, ['kasirbertugas', 'kasir']); if (idKasir === -1) idKasir = 18;

    let result = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idInv] || String(r[idInv]).trim() === "") continue;
      
      result.push({
        idInvoice: String(r[idInv]).trim(),
        tanggal: fDateTime(r[idTgl]),
        idPasien: r[idPas] ? String(r[idPas]).trim() : "",
        noRm: r[idRM] ? String(r[idRM]).trim() : "",
        namaPasien: r[idNama] ? String(r[idNama]).trim() : "",
        dokter: r[idDokter] ? String(r[idDokter]).trim() : "",
        kategori: r[idKat] ? String(r[idKat]).trim() : "",
        item: r[idItem] ? String(r[idItem]).trim() : "",
        harga: parseHarga(r[idHrg] || 0),
        qty: r[idQty] || 1,
        diskon: r[idDisc] || 0,
        grandTotalItem: parseHarga(r[idGrTot] || 0),
        totalInvoice: parseHarga(r[idTotInv] || 0),
        metode: r[idMetode] ? String(r[idMetode]).trim() : "",
        status: r[idStatus] ? String(r[idStatus]).trim() : "",
        keterangan: idKet !== -1 && r[idKet] ? String(r[idKet]).trim() : "",
        kasir: r[idKasir] ? String(r[idKasir]).trim() : ""
      });
    }
    return result;
  } catch (e) {
    return [];
  }
}

/**
 * Agregat data invoice unik untuk modul Riwayat Invoice.
 */
function getDaftarInvoice() {
  try {
    const listBayar = getDaftarPembayaran();
    if (!listBayar || listBayar.length === 0) return [];
    
    let groups = {};
    listBayar.forEach(row => {
      let invId = row.idInvoice || "INV-UNSPECIFIED";
      if (!groups[invId]) {
        groups[invId] = {
          idInvoice: invId,
          tanggalBayar: row.tanggal ? row.tanggal.split(' ')[0] : "",
          waktuFull: row.tanggal,
          idPasien: row.idPasien,
          noRm: row.noRm,
          namaPasien: row.namaPasien,
          dokter: row.dokter,
          totalBayar: row.totalInvoice,
          grandTotal: row.totalInvoice,
          metode: row.metode,
          metodeBayar: row.metode || "Cash",
          status: row.status,
          statusPembayaran: row.status || "Lunas",
          keterangan: row.keterangan || "",
          kasir: row.kasir,
          items: [],
          rincianItems: []
        };
      }
      let itm = {
        nama: row.item,
        namaItem: row.item,
        kategori: row.kategori,
        qty: row.qty,
        tarif: row.harga,
        hargaSatuan: row.harga,
        diskon: row.diskon,
        diskonPercent: row.diskon,
        subtotal: row.grandTotalItem
      };
      groups[invId].items.push(itm);
      groups[invId].rincianItems.push(itm);
    });
    
    return Object.values(groups).sort((a, b) => b.idInvoice.localeCompare(a.idInvoice));
  } catch (e) {
    return [];
  }
}

function simpanPembayaranBaru(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getSheetEksternal(DB_CONFIG.PEMBAYARAN, "Data_Pembayaran");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_Invoice', 'Tanggal_Tindakan', 'ID_Pasien', 'No_RM', 'Nama_Pasien',
        'Dokter_Pemeriksa', 'Kategori_Item', 'Nama_Item', 'Harga_Satuan', 'Qty',
        'Labor', 'Diskon_Persen', 'Grand_Total_Item', 'Perawat', 'Total_Invoice',
        'Metode_Bayar', 'Status_Pembayaran', 'Keterangan', 'Kasir_Bertugas', 'Waktu_Sistem'
      ]);
    }
    
    let lr = sheet.getLastRow(), d = new Date(), mmyy = ("0" + (d.getMonth() + 1)).slice(-2) + d.getFullYear().toString().slice(-2), num = 1;
    if (lr > 1) {
      let lastVal = sheet.getRange(lr, 1).getValue();
      let lastId = lastVal ? lastVal.toString().split('/') : [];
      if (lastId.length === 4 && !isNaN(parseInt(lastId[2], 10))) {
        num = parseInt(lastId[2], 10) + 1;
      } else {
        num = lr;
      }
    }
    
    let idInv = "INV/SHELDON/" + ("0000" + num).slice(-4) + "/" + mmyy;
    let tTindakan = JSON.parse(payload.tindakanStr || "[]");
    let tObat = JSON.parse(payload.obatStr || "[]");
    let tBMHP = JSON.parse(payload.bmhpStr || "[]");
    
    let rowsData = [], waktuSistem = new Date();
    let kasirNama = (payload.kasir && typeof payload.kasir === 'string') ? payload.kasir : "Kasir";
    let ketInfo = payload.keterangan || "";
    
    tTindakan.forEach(t => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'Tindakan', t.nama || "", t.harga || 0, t.qty || 1, t.labor || 0, t.diskon || 0,
      t.grandTotal || 0, t.perawat || "", payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    tObat.forEach(o => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'Obat', o.nama || "", o.harga || 0, o.qty || 1, 0, o.diskon || 0,
      o.grandTotal || 0, '', payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    tBMHP.forEach(b => rowsData.push([
      idInv, payload.tglTindakan || "", payload.idPasien || "", payload.noRm || "", payload.namaPasien || "",
      payload.dokter || "", 'BMHP', b.nama || "", b.harga || 0, b.qty || 1, 0, b.diskon || 0,
      b.grandTotal || 0, '', payload.totalBayar || 0, payload.metode || "Cash", payload.status || "Lunas",
      ketInfo, kasirNama, waktuSistem
    ]));
    
    if (rowsData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    }
    
    try {
      catatLog("Terima Pembayaran", "Invoice: " + idInv + " (Total Item: " + rowsData.length + ")", kasirNama);
    } catch(logErr) {
      Logger.log("catatLog error: " + logErr.message);
    }
    
    let itemGudang = [...tObat, ...tBMHP];
    if (itemGudang.length > 0) {
      try {
        potongStokGudang(itemGudang);
      } catch(stkErr) {
        Logger.log("potongStokGudang error: " + stkErr.message);
      }
    }

    // HITUNG & CATAT JASA MEDIS OTOMATIS
    try {
      hitungDanCatatJasaMedis({
        idInvoice: idInv,
        tanggal: payload.tglTindakan || Utilities.formatDate(new Date(), "GMT+7", "dd-MM-yyyy"),
        dokter: payload.dokter || "",
        tindakan: tTindakan,
        obat: tObat,
        bmhp: tBMHP,
        waktuSistem: waktuSistem
      });
    } catch(jmErr) {
      Logger.log("hitungDanCatatJasaMedis error: " + jmErr.message);
    }
    
    return { success: true, message: "Pembayaran berhasil disimpan!", idInvoice: idInv };
  } catch (e) {
    return { success: false, message: "Gagal Menyimpan Pembayaran: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

function potongStokGudang(daftarItemDibeli) {
  try {
    let items = typeof daftarItemDibeli === 'string' ? JSON.parse(daftarItemDibeli) : daftarItemDibeli;
    if (!items || !Array.isArray(items)) return;
    
    let mapKode = {};
    let mapNama = {};
    items.forEach(item => {
      let qty = parseFloat(item.qty || item.jumlah || 1);
      if (item.kode) {
        let k = item.kode.toString().trim().toLowerCase();
        mapKode[k] = (mapKode[k] || 0) + qty;
      }
      if (item.nama) {
        let n = item.nama.toString().trim().toLowerCase();
        mapNama[n] = (mapNama[n] || 0) + qty;
      }
    });
    
    _eksekusiPotongStok(DB_CONFIG.OBAT, "Master_Obat", mapKode, mapNama);
    _eksekusiPotongStok(DB_CONFIG.BMHP, "Master_BMHP", mapKode, mapNama);
  } catch (e) {
    Logger.log("Error potongStokGudang: " + e.message);
  }
}

function _eksekusiPotongStok(idSpreadsheet, sheetName, mapKode, mapNama) {
  try {
    let ss = SpreadsheetApp.openById(idSpreadsheet);
    let sheetMaster = ss.getSheetByName(sheetName);
    if (!sheetMaster) return;
    
    let data = sheetMaster.getDataRange().getValues();
    if (data.length <= 1) return;
    
    let h = data[0];
    let idxKode = getColIdx(h, ["id_obat", "idobat", "kode_item", "kodeitem", "kode"]);
    let idxNama = getColIdx(h, ["nama_obat", "namaobat", "nama_barang", "namabarang", "namaitem", "nama"]);
    let idxStok = getColIdx(h, ["stock_tersedia", "stocktersedia", "stok_tersedia", "stoktersedia", "stok", "sisa"]);
    let idxTerjual = getColIdx(h, ["terjual", "total_terjual", "totalterjual"]);
    
    if (idxStok === -1 && idxTerjual === -1) return;
    let modified = false;
    
    for (let i = 1; i < data.length; i++) {
      let kodeData = idxKode !== -1 && data[i][idxKode] ? data[i][idxKode].toString().trim().toLowerCase() : "";
      let namaData = idxNama !== -1 && data[i][idxNama] ? data[i][idxNama].toString().trim().toLowerCase() : "";
      
      let qtyBeli = 0;
      if (kodeData && mapKode[kodeData] !== undefined) {
        qtyBeli = mapKode[kodeData];
      } else if (namaData && mapNama[namaData] !== undefined) {
        qtyBeli = mapNama[namaData];
      }
      
      if (qtyBeli > 0) {
        let stokLama = parseFloat(data[i][idxStok]) || 0;
        let terjualLama = idxTerjual !== -1 ? parseFloat(data[i][idxTerjual]) || 0 : 0;
        
        let stokBaru = Math.max(0, stokLama - qtyBeli);
        data[i][idxStok] = stokBaru;
        if (idxTerjual !== -1) {
          data[i][idxTerjual] = terjualLama + qtyBeli;
        }
        modified = true;
      }
    }
    
    // BATCH UPDATE: 1 kali panggilan setValues untuk seluruh baris yang diubah
    if (modified) {
      sheetMaster.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
  } catch (e) {
    Logger.log("Gagal memotong stok di " + sheetName + ": " + e.message);
  }
}

// =========================================================================
// ENGINE OTOMATISASI PERHITUNGAN JASA MEDIS (JM)
// =========================================================================
function hitungDanCatatJasaMedis(ctx) {
  try {
    const idPembayaran = DB_CONFIG.PEMBAYARAN;
    const sheetJM = getSheetEksternal(idPembayaran, "Rekap_Jasa_Medis");
    if (!sheetJM) return;

    if (sheetJM.getLastRow() === 0) {
      sheetJM.appendRow([
        "ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item",
        "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan",
        "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat",
        "Bagian_Klinik", "Status_JM", "Waktu_Hitung"
      ]);
    }

    // Ambil Data Referensi: Tindakan, Dokter, Tarif Khusus
    const listTindakan = (typeof getDaftarTindakanLengkap === 'function') ? getDaftarTindakanLengkap() : [];
    const listDokter = (typeof getDaftarDokterSIP === 'function') ? getDaftarDokterSIP() : [];
    const listTarifKhusus = (typeof getTarifKhususDokter === 'function') ? getTarifKhususDokter() : [];

    // Cari Rate Default Dokter Terpilih (Default fallback 40% jika tidak ditemukan)
    let dokObj = listDokter.find(d => d.nama === ctx.dokter);
    let defaultRateDokter = (dokObj && dokObj.persenJM !== undefined && dokObj.persenJM !== null) ? dokObj.persenJM : 0.40;

    let rowsJM = [];

    // 1. PROSES ITEM TINDAKAN
    (ctx.tindakan || []).forEach(t => {
      let namaTindakan = t.nama || "";
      let tarifKotor = parseFloat(t.grandTotal || t.harga || 0);
      let biayaLab = parseFloat(t.labor || 0);
      let namaPerawat = t.perawat || "";

      // Cari master tindakan untuk cek Labor dan default rate
      let masterT = listTindakan.find(x => x.nama === namaTindakan);
      let isNeedLab = masterT ? (masterT.perluLab === 'Ya') : (biayaLab > 0);

      // Cek Hierarki Persentase
      let finalPersen = defaultRateDokter;
      let tipeAturan = "Default Dokter (" + Math.round(defaultRateDokter * 100) + "%)";

      // Tingkat 1: Cek apakah tindakan mengunci rate global (misal: Rontgen 15%)
      if (masterT && masterT.persenJMDefault !== null && masterT.persenJMDefault !== undefined && masterT.persenJMDefault > 0) {
        finalPersen = masterT.persenJMDefault;
        tipeAturan = "Kunci Tindakan Global (" + Math.round(finalPersen * 100) + "%)";
      } else {
        // Tingkat 2: Cek apakah dokter punya Tarif Khusus untuk tindakan ini
        let exc = listTarifKhusus.find(x => x.dokter === ctx.dokter && (x.nama === namaTindakan || (masterT && x.kode === masterT.kode)));
        if (exc && exc.persenJM !== undefined && exc.persenJM !== null) {
          finalPersen = exc.persenJM;
          tipeAturan = "Tarif Khusus Dokter (" + Math.round(finalPersen * 100) + "%)";
        }
      }

      // Validasi Syarat LAB
      let statusJM = "SIAP_CAIR";
      let dasarBagiHasil = Math.max(0, tarifKotor - biayaLab);

      if (isNeedLab && biayaLab <= 0) {
        statusJM = "PENDING_LAB";
      }

      let jmDokterKotor = 0;
      let potonganPerawat = 0;
      let jmDokterBersih = 0;
      let jmPerawat = 0;
      let bagianKlinik = tarifKotor;

      if (statusJM === "SIAP_CAIR") {
        jmDokterKotor = Math.round(dasarBagiHasil * finalPersen);

        // Cek jika tindakan melibatkan perawat (misal paket behel include scaling oleh perawat)
        let namaTindakanLower = namaTindakan.toLowerCase();
        if (namaPerawat && namaPerawat.trim() !== "" && (namaTindakanLower.includes("behel") || namaTindakanLower.includes("ortho") || namaTindakanLower.includes("orto"))) {
          potonganPerawat = Math.min(jmDokterKotor, 50000); // Rp 50.000 jasa scaling perawat
          tipeAturan += " + Asistensi Perawat Rp 50k";
        }

        jmPerawat = potonganPerawat;
        jmDokterBersih = Math.max(0, jmDokterKotor - potonganPerawat);
        bagianKlinik = Math.max(0, tarifKotor - jmDokterBersih - jmPerawat - biayaLab);
      } else {
        // Status PENDING_LAB: JM ditahan sementara 0
        jmDokterKotor = 0;
        jmDokterBersih = 0;
        jmPerawat = 0;
      }

      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, namaPerawat, "Tindakan", namaTindakan,
        tarifKotor, biayaLab, dasarBagiHasil, finalPersen, tipeAturan,
        jmDokterKotor, potonganPerawat, jmDokterBersih, jmPerawat,
        bagianKlinik, statusJM, ctx.waktuSistem || new Date()
      ]);
    });

    // 2. PROSES ITEM OBAT (0% UNTUK DOKTER)
    (ctx.obat || []).forEach(o => {
      let total = parseFloat(o.grandTotal || o.harga || 0);
      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, "", "Obat", o.nama || "Obat",
        total, 0, total, 0, "Obat (0% Dokter)",
        0, 0, 0, 0, total, "NON_JM", ctx.waktuSistem || new Date()
      ]);
    });

    // 3. PROSES ITEM BMHP (0% UNTUK DOKTER)
    (ctx.bmhp || []).forEach(b => {
      let total = parseFloat(b.grandTotal || b.harga || 0);
      rowsJM.push([
        ctx.idInvoice, ctx.tanggal, ctx.dokter, "", "BMHP", b.nama || "BMHP",
        total, 0, total, 0, "BMHP (0% Dokter)",
        0, 0, 0, 0, total, "NON_JM", ctx.waktuSistem || new Date()
      ]);
    });

    if (rowsJM.length > 0) {
      sheetJM.getRange(sheetJM.getLastRow() + 1, 1, rowsJM.length, rowsJM[0].length).setValues(rowsJM);
    }
  } catch(e) {
    Logger.log("Error hitungDanCatatJasaMedis: " + e.message);
  }
}

function getRekapJasaMedis(filterBulanTahun) {
  try {
    const v = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
    if (!v || v.length <= 1) return [];
    let h = v[0];
    let idInv = getColIdx(h, ['idinvoice', 'id_invoice']); if (idInv === -1) idInv = 0;
    let idTgl = getColIdx(h, ['tanggal', 'tgl']); if (idTgl === -1) idTgl = 1;
    let idDok = getColIdx(h, ['dokter']); if (idDok === -1) idDok = 2;
    let idPer = getColIdx(h, ['perawat']); if (idPer === -1) idPer = 3;
    let idKat = getColIdx(h, ['kategoriitem', 'kategori_item']); if (idKat === -1) idKat = 4;
    let idItem = getColIdx(h, ['namaitem', 'nama_item']); if (idItem === -1) idItem = 5;
    let idTarif = getColIdx(h, ['tarifkotor', 'tarif_kotor']); if (idTarif === -1) idTarif = 6;
    let idLab = getColIdx(h, ['biayalab', 'biaya_lab']); if (idLab === -1) idLab = 7;
    let idDasar = getColIdx(h, ['dasarbagihasil', 'dasar_bagi_hasil']); if (idDasar === -1) idDasar = 8;
    let idPersen = getColIdx(h, ['persenjm', 'persen_jm']); if (idPersen === -1) idPersen = 9;
    let idAturan = getColIdx(h, ['tipeaturan', 'tipe_aturan']); if (idAturan === -1) idAturan = 10;
    let idJMBersih = getColIdx(h, ['jmdokterbersih', 'jm_dokter_bersih']); if (idJMBersih === -1) idJMBersih = 13;
    let idJMPer = getColIdx(h, ['jmperawat', 'jm_perawat']); if (idJMPer === -1) idJMPer = 14;
    let idKlinik = getColIdx(h, ['bagianklinik', 'bagian_klinik']); if (idKlinik === -1) idKlinik = 15;
    let idStatus = getColIdx(h, ['statusjm', 'status_jm']); if (idStatus === -1) idStatus = 16;

    let res = [];
    for (let i = 1; i < v.length; i++) {
      let r = v[i];
      if (!r[idInv]) continue;
      res.push({
        idInvoice: String(r[idInv] || ""),
        tanggal: String(r[idTgl] || ""),
        dokter: String(r[idDok] || ""),
        perawat: String(r[idPer] || ""),
        kategori: String(r[idKat] || ""),
        namaItem: String(r[idItem] || ""),
        tarifKotor: Number(r[idTarif] || 0),
        biayaLab: Number(r[idLab] || 0),
        dasarBagiHasil: Number(r[idDasar] || 0),
        persenJM: Number(r[idPersen] || 0),
        tipeAturan: String(r[idAturan] || ""),
        jmDokterBersih: Number(r[idJMBersih] || 0),
        jmPerawat: Number(r[idJMPer] || 0),
        bagianKlinik: Number(r[idKlinik] || 0),
        statusJM: String(r[idStatus] || "")
      });
    }
    return res;
  } catch(e) {
    return [];
  }
}
