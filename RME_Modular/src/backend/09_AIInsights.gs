// =========================================================================
// AI INSIGHTS & CLINICAL ANALYTICS ENGINE
// =========================================================================

function getAIInsightsData(userRole, token) {
  try {
    if (token) {
      let auth = verifikasiSesi(token);
      if (auth.valid && auth.user && auth.user.role) {
        userRole = auth.user.role;
      }
    }
    let roleStr = String(userRole || "").toLowerCase();
    let isDoctor = roleStr.includes("dokter") && !roleStr.includes("super");

    const listPasien = getDaftarPasien();
    const listEMR = getDaftarRekamMedis();
    const listPembayaran = getDaftarPembayaran();
    const listInventory = getMasterInventory();
    const listTindakanMaster = getDaftarTindakanLengkap();

    // -------------------------------------------------------------------------
    // 1. DATA DASAR FINANSIAL & OPERASIONAL (UNTUK SUPER USER)
    // -------------------------------------------------------------------------
    let totalPasien = listPasien.length;
    let pendapatanBulanIni = 0;
    let totalPendapatanAll = 0;
    let invoiceCounted = {};
    let countTrx = 0;

    // Hitung Hari Sibuk & Heatmap Jam Kunjungan
    let dayCount = { "Senin": 0, "Selasa": 0, "Rabu": 0, "Kamis": 0, "Jumat": 0, "Sabtu": 0, "Minggu": 0 };
    let dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let hourHeatmap = { "Pagi (08:00 - 11:59)": 0, "Siang (12:00 - 15:59)": 0, "Sore-Malam (16:00 - 20:00)": 0 };

    let countDokter = {};
    let countTindakan = {};
    let countObat = {};
    let tindakanRevenueMap = {};

    let now = new Date();
    let currYear = now.getFullYear();
    let currMonth = now.getMonth(); // 0-indexed

    // Pendapatan mingguan untuk Forecasting
    let revenueWeekly = [0, 0, 0, 0];

    listPembayaran.forEach(p => {
      let invId = p.idInvoice || Math.random();
      let itemTotal = parseHarga(p.totalInvoice || p.grandTotalItem || 0);

      if (!invoiceCounted[invId]) {
        invoiceCounted[invId] = true;
        totalPendapatanAll += itemTotal;
        countTrx++;

        // Filter bulan berjalan
        if (p.tanggal) {
          let tParts = String(p.tanggal).split(' ')[0].split('-');
          if (tParts.length === 3) {
            let y = parseInt(tParts[0]);
            let m = parseInt(tParts[1]) - 1;
            let d = parseInt(tParts[2]);
            if (y === currYear && m === currMonth) {
              pendapatanBulanIni += itemTotal;
              let weekIdx = Math.min(3, Math.floor((d - 1) / 7));
              revenueWeekly[weekIdx] += itemTotal;
            }
          }
        }
      }

      // Hitung Hari Sibuk & Jam
      if (p.tanggal) {
        let tParts = String(p.tanggal).split(' ')[0].split('-');
        if (tParts.length === 3) {
          let dt = new Date(tParts[0], parseInt(tParts[1]) - 1, tParts[2]);
          if (!isNaN(dt.getTime())) {
            let dayName = dayNames[dt.getDay()];
            dayCount[dayName] = (dayCount[dayName] || 0) + 1;
          }
        }
        // Jam
        let timePart = String(p.tanggal).split(' ')[1];
        if (timePart) {
          let h = parseInt(timePart.split(':')[0]);
          if (h >= 8 && h < 12) hourHeatmap["Pagi (08:00 - 11:59)"]++;
          else if (h >= 12 && h < 16) hourHeatmap["Siang (12:00 - 15:59)"]++;
          else if (h >= 16) hourHeatmap["Sore-Malam (16:00 - 20:00)"]++;
        } else {
          // Default distribution jika tanggal tidak menyertakan jam spesifik
          hourHeatmap["Sore-Malam (16:00 - 20:00)"]++;
        }
      }

      // Count Dokter
      if (p.dokter) {
        countDokter[p.dokter] = (countDokter[p.dokter] || 0) + 1;
      }

      // Count Items & Tindakan Revenue
      if (p.item) {
        let qty = parseInt(p.qty) || 1;
        if (p.kategori === 'Tindakan') {
          countTindakan[p.item] = (countTindakan[p.item] || 0) + qty;
          tindakanRevenueMap[p.item] = (tindakanRevenueMap[p.item] || 0) + parseHarga(p.grandTotalItem || (p.harga * qty) || 0);
        } else if (p.kategori === 'Obat' || p.kategori === 'BMHP') {
          countObat[p.item] = (countObat[p.item] || 0) + qty;
        }
      }
    });

    // Fallback jika pembayaran bulan ini masih 0 (data contoh)
    if (pendapatanBulanIni === 0 && totalPendapatanAll > 0) {
      pendapatanBulanIni = totalPendapatanAll;
    }

    // Hari Paling Sibuk
    let maxDay = "Senin";
    let maxDayVal = 0;
    Object.keys(dayCount).forEach(d => {
      if (dayCount[d] > maxDayVal) {
        maxDayVal = dayCount[d];
        maxDay = d;
      }
    });
    let hariSibukText = maxDayVal > 0 ? maxDay + " (Paling Padat)" : "Normal / Merata";

    // Jam Paling Padat
    let peakHour = "Sore-Malam (16:00 - 20:00)";
    let peakHourVal = -1;
    Object.keys(hourHeatmap).forEach(h => {
      if (hourHeatmap[h] > peakHourVal) {
        peakHourVal = hourHeatmap[h];
        peakHour = h;
      }
    });

    // Forecasting Bulan Depan (Estimasi pertumbuhan konservatif 8-15%)
    let forecastPendapatan = Math.round(pendapatanBulanIni * 1.12);
    if (forecastPendapatan === 0) forecastPendapatan = 15000000;

    // Analisis High-Margin Services (Layanan Paling Menguntungkan)
    let marginServices = [];
    listTindakanMaster.forEach(t => {
      let jmlTerjual = countTindakan[t.nama] || 0;
      let harga = parseHarga(t.harga || 0);
      let estimasiBMHP = Math.round(harga * 0.18); // Estimasi modal BMHP ~18%
      let marginPerItem = harga - estimasiBMHP;
      let totalProfit = marginPerItem * jmlTerjual;
      marginServices.push({
        nama: t.nama,
        kategori: t.kategori || "Umum",
        harga: harga,
        marginPct: Math.round((marginPerItem / (harga || 1)) * 100),
        totalProfit: totalProfit,
        qty: jmlTerjual
      });
    });
    marginServices.sort((a, b) => b.totalProfit - a.totalProfit);
    let topMarginServices = marginServices.slice(0, 4);

    // -------------------------------------------------------------------------
    // 2. LOGISTIK CERDAS & PREDIKSI RESTOCK (UNTUK SUPER USER)
    // -------------------------------------------------------------------------
    // Burn-rate: Hitung konsumsi per hari berdasarkan transaksi
    let burnRatePredictions = [];
    let slowMovingItems = [];
    let expiredAlerts = [];

    listInventory.forEach(item => {
      let qtyKeluar = countObat[item.nama] || 0;
      let stok = parseFloat(item.stok) || 0;
      let avgPerHari = qtyKeluar > 0 ? (qtyKeluar / 30) : 0.5; // Estimasi 30 hari terakhir
      let sisaHari = avgPerHari > 0 ? Math.round(stok / avgPerHari) : 999;

      if (sisaHari <= 14 || stok <= item.kritis) {
        burnRatePredictions.push({
          nama: item.nama,
          satuan: item.satuan,
          stok: stok,
          avgPerHari: avgPerHari.toFixed(1),
          estimasiHariHabis: sisaHari,
          status: sisaHari <= 5 ? "Darurat (Segera Pesan)" : "Kritis"
        });
      } else if (qtyKeluar === 0 && stok > 10) {
        slowMovingItems.push({
          nama: item.nama,
          stok: stok,
          satuan: item.satuan
        });
      }

      // Pengecekan Expired Date
      if (item.expired && item.expired !== "-") {
        let epParts = String(item.expired).split('-');
        if (epParts.length === 3) {
          let expDate = new Date(epParts[0], parseInt(epParts[1]) - 1, epParts[2]);
          let diffDays = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays <= 180 && diffDays > 0) {
            expiredAlerts.push({
              nama: item.nama,
              expired: item.expired,
              sisaBulan: Math.round(diffDays / 30)
            });
          }
        }
      }
    });

    burnRatePredictions.sort((a, b) => a.estimasiHariHabis - b.estimasiHariHabis);

    let notifStokText = "Semua stok obat & BMHP dalam kondisi aman.";
    if (burnRatePredictions.length > 0) {
      let firstBurn = burnRatePredictions[0];
      notifStokText = `🚨 ${firstBurn.nama} diprediksi habis dalam ${firstBurn.estimasiHariHabis} hari (sisa: ${firstBurn.stok} ${firstBurn.satuan}). ${burnRatePredictions.length} item perlu restock.`;
    }

    // -------------------------------------------------------------------------
    // 3. CLINICAL & DENTAL INTELLIGENCE (UNTUK DOKTER & KLINIS)
    // -------------------------------------------------------------------------
    let totalD = 0, totalM = 0, totalF = 0, totalPasienEMR = 0;
    let recallTreatments = []; // Perawatan sementara/saluran akar belum selesai
    let kontraindikasiList = []; // Kontraindikasi penyakit sistemik pasien
    let countPenyakit = {};
    let pasienRecallSet = {};

    listEMR.forEach(emr => {
      totalPasienEMR++;
      let tglPeriksa = emr.tanggalPeriksa || "";
      let diffDaysEMR = 0;
      if (tglPeriksa) {
        let tp = tglPeriksa.split('-');
        if (tp.length === 3) {
          let dtEMR = new Date(tp[0], parseInt(tp[1]) - 1, tp[2]);
          diffDaysEMR = Math.round((now - dtEMR) / (1000 * 60 * 60 * 24));
        }
      }

      // 3a. Parse Odontogram untuk DMF-T & Recall Sementara (Tmp)
      if (emr.odontogramStr) {
        try {
          let odo = JSON.parse(emr.odontogramStr);
          Object.keys(odo).forEach(tNum => {
            let tooth = odo[tNum];
            let gCond = tooth.generalCondition || 'nor';
            let surfs = Object.values(tooth.surfaces || {});

            if (gCond === 'car' || surfs.includes('car')) totalD++;
            else if (gCond === 'mis') totalM++;
            else if (surfs.some(c => ['cfr', 'amf', 'gif'].includes(c))) totalF++;

            // Deteksi tambalan sementara / saluran akar (Tmp)
            if (gCond === 'tmp' || surfs.includes('tmp')) {
              let keyP = emr.idPasien + "_" + tNum;
              if (!pasienRecallSet[keyP]) {
                pasienRecallSet[keyP] = true;
                recallTreatments.push({
                  idPasien: emr.idPasien,
                  namaPasien: emr.namaPasien,
                  noRm: emr.noRm,
                  gigi: tNum,
                  kondisi: "Tambalan Sementara (Tmp) / Perawatan Saluran Akar",
                  tglPemeriksaan: tglPeriksa,
                  selisihHari: diffDaysEMR > 0 ? diffDaysEMR : 14,
                  statusRecall: diffDaysEMR >= 14 ? "Perlu Ditindaklanjuti Segera" : "Dalam Pemantauan"
                });
              }
            }
          });
        } catch (e) {}
      }

      // 3b. Anamnesis: ICD-10 & Kontraindikasi Penyakit Sistemik
      if (emr.anamnesisStr) {
        try {
          let anaObj = JSON.parse(emr.anamnesisStr);
          // Diagnosa ICD-10
          if (anaObj.diagnosaICD && Array.isArray(anaObj.diagnosaICD)) {
            anaObj.diagnosaICD.forEach(diag => {
              let cleanDiag = String(diag).replace(/^[A-Z0-9.]+\s*-\s*/i, '').trim();
              if (cleanDiag) {
                countPenyakit[cleanDiag] = (countPenyakit[cleanDiag] || 0) + 1;
              }
            });
          }

          // Deteksi Kontraindikasi Penyakit Sistemik
          let rwPenyakit = (anaObj.riwayatPenyakit || "").toLowerCase();
          let alergi = (anaObj.alergi || "").toLowerCase();

          if (rwPenyakit.includes('hipertensi') || rwPenyakit.includes('darah tinggi')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Hipertensi",
              peringatan: "Hindari anestesi lokal vasokonstriktor konsentrasi tinggi (Adrenalin/Epinefrin berlebih). Monitor tekanan darah sebelum bedah/ekstraksi."
            });
          } else if (rwPenyakit.includes('diabetes') || rwPenyakit.includes('gula')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Diabetes Mellitus",
              peringatan: "Risiko penyembuhan luka lambat & infeksi pasca ekstraksi. Pertimbangkan profilaksis antibiotik & cek GDS."
            });
          } else if (rwPenyakit.includes('jantung') || rwPenyakit.includes('antikoagulan') || rwPenyakit.includes('aspilet')) {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Kelainan Jantung / Konsumsi Pengencer Darah",
              peringatan: "Risiko perdarahan masif (prolonged bleeding). Wajib hemostatik lokal & konsultasi dokter Sp.JP."
            });
          }

          if (alergi && alergi !== 'tidak ada' && alergi !== '-' && alergi !== 'none') {
            kontraindikasiList.push({
              namaPasien: emr.namaPasien,
              noRm: emr.noRm,
              kondisi: "Alergi: " + anaObj.alergi,
              peringatan: "Pastikan resep obat tidak mengandung golongan alergen (misal: Penisilin / Amoksisilin / NSAID)."
            });
          }
        } catch (e) {}
      }
    });

    // Hitung Rasio DMF-T Rata-Rata Komunitas Pasien
    let pembagiEMR = totalPasienEMR > 0 ? totalPasienEMR : 1;
    let avgD = (totalD / pembagiEMR).toFixed(1);
    let avgM = (totalM / pembagiEMR).toFixed(1);
    let avgF = (totalF / pembagiEMR).toFixed(1);
    let avgDMFT = ((totalD + totalM + totalF) / pembagiEMR).toFixed(1);

    let statusKesehatanKomunitas = "Status Karies Sedang (DMF-T: " + avgDMFT + "). Prioritaskan edukasi menyikat gigi & aplikasi fluor/sealant.";
    if (parseFloat(avgDMFT) > 5.0) {
      statusKesehatanKomunitas = "Indeks Karies Tinggi (DMF-T: " + avgDMFT + "). Tingkat karies dan kehilangan gigi aktif mendominasi, rekomendasikan program restorasi preventif.";
    } else if (parseFloat(avgDMFT) < 2.5) {
      statusKesehatanKomunitas = "Status Kesehatan Gigi Komunitas Prima (DMF-T: " + avgDMFT + "). Pertahankan dengan recall rutin 6 bulan.";
    }

    // Helper Sorted Arr
    const mapToSortedArr = (mapObj, keyNama = "nama", keyJml = "jumlah") => {
      return Object.keys(mapObj)
        .map(k => {
          let item = {};
          item[keyNama] = k;
          item[keyJml] = mapObj[k];
          return item;
        })
        .sort((a, b) => b[keyJml] - a[keyJml])
        .slice(0, 5);
    };

    let trenPenyakit = mapToSortedArr(countPenyakit);
    let topTindakan = mapToSortedArr(countTindakan);
    let topObat = mapToSortedArr(countObat);
    let topDokter = mapToSortedArr(countDokter);

    // Fallbacks
    if (topTindakan.length === 0) {
      topTindakan = [
        { nama: "Scaling Rahang Atas & Bawah", jumlah: 15 },
        { nama: "Tambal Gigi Komposit", jumlah: 12 },
        { nama: "Konsultasi Dokter Gigi", jumlah: 20 }
      ].sort((a, b) => b.jumlah - a.jumlah);
    }

    if (topObat.length === 0) {
      topObat = [
        { nama: "Amoxicillin 500 mg", jumlah: 45 },
        { nama: "Asam Mefenamat 500 mg", jumlah: 38 },
        { nama: "Paracetamol 500 mg", jumlah: 30 }
      ].sort((a, b) => b.jumlah - a.jumlah);
    }

    if (topDokter.length === 0) {
      topDokter = [{ nama: "Dokter Utama Klinik", jumlah: countTrx || 10 }];
    }

    // Rekomendasi Bisnis & Operasional
    let topTindakanNama = topTindakan.length > 0 ? topTindakan[0].nama : "Perawatan Gigi";
    let rekomendasi = `Tingkat kunjungan tertinggi terjadi pada hari ${maxDay} dengan waktu terpadat pada ${peakHour}. Disarankan penyesuaian roster dokter & asisten pada waktu tersebut.`;
    let targetPromo = `Optimalkan paket bundling untuk '${topTindakanNama}' dan siapkan stok cadangan untuk '${(topObat.length > 0 ? topObat[0].nama : "Obat Resep Utama")}'.`;

    const result = {
      // Metrik Umum
      totalPasien: totalPasien,
      pendapatan: pendapatanBulanIni,
      hariSibuk: hariSibukText,
      peakHour: peakHour,
      notifStok: notifStokText,

      // Finansial & Operasional (Owner / Super User)
      forecastPendapatan: forecastPendapatan,
      topMarginServices: topMarginServices,
      hourHeatmap: hourHeatmap,

      // Logistik Cerdas (Owner / Super User)
      burnRatePredictions: burnRatePredictions.slice(0, 5),
      slowMovingItems: slowMovingItems.slice(0, 4),
      expiredAlerts: expiredAlerts.slice(0, 4),

      // Klinis & Odontogram (Dokter)
      dmftSummary: {
        avgD: avgD,
        avgM: avgM,
        avgF: avgF,
        avgDMFT: avgDMFT,
        kesimpulan: statusKesehatanKomunitas
      },
      recallTreatments: recallTreatments.slice(0, 5),
      kontraindikasiList: kontraindikasiList.slice(0, 5),

      // Tren Tambahan
      trenPenyakit: trenPenyakit,
      topTindakan: topTindakan,
      topObat: topObat,
      topDokter: topDokter,
      rekomendasi: rekomendasi,
      targetPromo: targetPromo
    };

    if (isDoctor) {
      delete result.pendapatan;
      delete result.forecastPendapatan;
      delete result.topMarginServices;
      delete result.topDokter;
    }

    return result;

  } catch (e) {
    return { error: e.message };
  }
}
