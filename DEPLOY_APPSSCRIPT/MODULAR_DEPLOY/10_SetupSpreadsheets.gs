// =========================================================================
// SCRIPT OTOMATIS: GENERATOR 10 SPREADSHEET RME KLINIK SHELDON
// =========================================================================

/**
 * DEFINISI STRUKTUR GLOBAL 10 SPREADSHEET
 * Dapat diakses dari seluruh modul backend (Utils, Kasir, dsb).
 */
const SPREADSHEET_DEFINITIONS = {
  "PASIEN": {
      "title": "RME Sheldon - 01 Pasien",
      "sheets": [
        {
          "name": "Data_Pasien",
          "headers": ["ID_Pasien", "Nama_Pasien", "No_RM", "Jenis_Kelamin", "Tempat_Lahir", "Tanggal_Lahir", "Umur", "Agama", "Golongan_Darah", "Pekerjaan", "NIK", "Alamat", "Provinsi", "Kabupaten", "Kecamatan", "Kelurahan", "WhatsApp", "Alergi", "Riwayat_Penyakit", "Catatan", "Tanggal_Daftar"],
          "formats": { "F": "dd-mm-yyyy", "K": "@", "Q": "@", "U": "dd-mm-yyyy" },
          "validations": {
            "D": ["Laki-Laki", "Perempuan"],
            "H": ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"],
            "I": ["A", "B", "AB", "O"]
          }
        },
        {
          "name": "Statistik_Pasien",
          "grid": [
            ["Metrik", "Nilai", "", "No_RM", "Nama_Pasien", "Umur_Saat_Ini"],
            ["Total Pasien", "=COUNTA(Data_Pasien!A2:A)", "", "={\"\",\"\",\"\";ARRAYFORMULA(IF(Data_Pasien!A2:A=\"\",\"\",{Data_Pasien!C2:C,Data_Pasien!B2:B,IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\")&\" Tahun\",\"-\")}))}", "", ""],
            ["Laki-Laki", "=COUNTIF(Data_Pasien!D2:D,\"Laki-Laki\")", "", "", "", ""],
            ["Perempuan", "=COUNTIF(Data_Pasien!D2:D,\"Perempuan\")", "", "", "", ""],
            ["Pasien Baru Bulan Ini", "=COUNTIFS(Data_Pasien!U2:U,\">=\"&(EOMONTH(TODAY(),-1)+1),Data_Pasien!U2:U,\"<=\"&EOMONTH(TODAY(),0))", "", "", "", ""],
            ["Rata-rata Umur (Tahun)", "=IFERROR(ROUND(AVERAGE(FILTER(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),ISNUMBER(Data_Pasien!F2:F))),1),\"-\")", "", "", "", ""],
            ["Anak (< 12 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<12)),0)", "", "", "", ""],
            ["Remaja (12-17 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=12)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<18)),0)", "", "", "", ""],
            ["Dewasa (18-59 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=18)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),999)<60)),0)", "", "", "", ""],
            ["Lansia (>= 60 th)", "=IFERROR(SUMPRODUCT(ISNUMBER(Data_Pasien!F2:F)*(IFERROR(DATEDIF(Data_Pasien!F2:F,TODAY(),\"Y\"),-1)>=60)),0)", "", "", "", ""]
          ]
        }
      ]
    },

    "PEMBAYARAN": {
      "title": "RME Sheldon - 02 Pembayaran",
      "sheets": [
        {
          "name": "Data_Pembayaran",
          "headers": ["ID_Invoice", "Tanggal_Tindakan", "ID_Pasien", "No_RM", "Nama_Pasien", "Dokter_Pemeriksa", "Kategori_Item", "Nama_Item", "Harga_Satuan", "Qty", "Labor", "Diskon_Persen", "Grand_Total_Item", "Perawat", "Total_Invoice", "Metode_Bayar", "Status_Pembayaran", "Keterangan", "Kasir_Bertugas", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "I": "#,##0", "K": "#,##0", "M": "#,##0", "O": "#,##0", "T": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "G": ["Tindakan", "Obat", "BMHP"],
            "P": ["Tunai", "Transfer Bank", "QRIS", "Kartu Debit/Kredit", "Asuransi"],
            "Q": ["Lunas", "Uang Muka", "Pelunasan"]
          }
        },
        {
          "name": "Rekap_Invoice",
          "grid": [
            ["=QUERY(Data_Pembayaran!A1:T,\"select A, B, E, F, max(O), P, Q, S, sum(M), count(H) where A is not null group by A, B, E, F, P, Q, S order by B desc label max(O) 'Total_Invoice', sum(M) 'Total_Item', count(H) 'Jumlah_Item'\",1)", "", "", "", "", "", "", "", "", "", "={\"Audit\";ARRAYFORMULA(IF(A2:A=\"\",\"\",IF(E2:E=I2:I,\"OK\",\"SELISIH\")))}"]
          ]
        },
        {
          "name": "Rekap_Harian",
          "grid": [
            ["=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select B, count(A), sum(E) where A is not null group by B order by B desc label count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Belum ada transaksi\")", "", "", "", "=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select year(B), month(B)+1, count(A), sum(E) where B is not null group by year(B), month(B)+1 order by year(B) desc, month(B)+1 desc label year(B) 'Tahun', month(B)+1 'Bulan', count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Kolom Tanggal_Tindakan harus berformat tanggal\")"]
          ]
        },
        {
          "name": "Rekap_Jasa_Medis",
          "headers": ["ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item", "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan", "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat", "Bagian_Klinik", "Status_JM", "Waktu_Hitung"],
          "formats": { "B": "dd-mm-yyyy", "G": "#,##0", "H": "#,##0", "I": "#,##0", "J": "0.0%", "L": "#,##0", "M": "#,##0", "N": "#,##0", "O": "#,##0", "P": "#,##0", "R": "dd-mm-yyyy hh:mm:ss" }
        }
      ]
    },

    "REKAM_MEDIS": {
      "title": "RME Sheldon - 03 Rekam Medis",
      "sheets": [
        {
          "name": "Data_Rekam_Medis",
          "headers": ["ID_RM_Klinis", "ID_Pasien", "No_RM", "Nama_Pasien", "Tanggal_Pemeriksaan", "Dokter_Pemeriksa", "Anamnesis_JSON", "Fisik_JSON", "Odontogram_JSON", "Tindakan_JSON", "Resep_Obat_JSON", "Catatan_Edukasi", "Waktu_Simpan"],
          "formats": { "E": "dd-mm-yyyy", "M": "dd-mm-yyyy hh:mm:ss" }
        },
        {
          "name": "Rekap_Kunjungan",
          "grid": [
            ["=IFERROR(QUERY(Data_Rekam_Medis!A1:M,\"select F, count(A) where A is not null group by F order by count(A) desc label count(A) 'Jumlah_Pemeriksaan'\",1),\"-\")", "", "", "=IFERROR(QUERY(Data_Rekam_Medis!A1:M,\"select year(E), month(E)+1, count(A) where E is not null group by year(E), month(E)+1 order by year(E) desc, month(E)+1 desc label year(E) 'Tahun', month(E)+1 'Bulan', count(A) 'Jumlah_Kunjungan'\",1),\"-\")"]
          ]
        }
      ]
    },

    "SURAT": {
      "title": "RME Sheldon - 04 Surat",
      "sheets": [
        { "name": "Surat_Sakit", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Lama_Hari", "Tgl_Mulai", "Tgl_Selesai", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Kontrol", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Diagnosis", "Tindakan", "Tgl_Kontrol", "Dokter_Tujuan", "Alasan", "Waktu_Sistem", "Pembuat"] },
        { "name": "Resume_Medis", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tgl_Kunjungan", "Anamnesis", "Penunjang", "Diagnosis", "Tindakan", "Obat", "Hasil", "Keperluan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Rujukan", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Anamnesa", "Fisik", "Diagnosis", "Terapi", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Lab", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Diagnosis", "Pemeriksaan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        { "name": "Surat_Radiologi", "headers": ["ID_Pasien", "No_RM", "Nama_Pasien", "No_Surat", "Tgl_Cetak", "Tujuan", "Diagnosis", "Pemeriksaan", "Dokter", "Waktu_Sistem", "Pembuat"] },
        {
          "name": "Rekap_Surat",
          "grid": [
            ["Jenis_Surat", "Kode", "Sheet", "Jumlah_Terbit", "No_Surat_Terakhir"],
            ["Surat Keterangan Sakit", "SKS", "Surat_Sakit", "=COUNTA(Surat_Sakit!D2:D)", "=IFERROR(INDEX(Surat_Sakit!D2:D,COUNTA(Surat_Sakit!D2:D)),\"-\")"],
            ["Surat Kontrol", "SKP", "Surat_Kontrol", "=COUNTA(Surat_Kontrol!D2:D)", "=IFERROR(INDEX(Surat_Kontrol!D2:D,COUNTA(Surat_Kontrol!D2:D)),\"-\")"],
            ["Resume Medis", "RMP", "Resume_Medis", "=COUNTA(Resume_Medis!D2:D)", "=IFERROR(INDEX(Resume_Medis!D2:D,COUNTA(Resume_Medis!D2:D)),\"-\")"],
            ["Surat Rujukan", "SRP", "Surat_Rujukan", "=COUNTA(Surat_Rujukan!D2:D)", "=IFERROR(INDEX(Surat_Rujukan!D2:D,COUNTA(Surat_Rujukan!D2:D)),\"-\")"],
            ["Pengantar Laboratorium", "SPL", "Surat_Lab", "=COUNTA(Surat_Lab!D2:D)", "=IFERROR(INDEX(Surat_Lab!D2:D,COUNTA(Surat_Lab!D2:D)),\"-\")"],
            ["Pengantar Radiologi", "SPR", "Surat_Radiologi", "=COUNTA(Surat_Radiologi!D2:D)", "=IFERROR(INDEX(Surat_Radiologi!D2:D,COUNTA(Surat_Radiologi!D2:D)),\"-\")"]
          ]
        }
      ]
    },

    "DATABASE": {
      "title": "RME Sheldon - 05 Database Tindakan",
      "sheets": [
        {
          "name": "Kategori",
          "headers": ["Kategori", "Kode"],
          "seedRows": [
            ["Umum", "UMM"],
            ["Dokter Gigi Umum", "DGU"],
            ["Dokter Gigi Spesialis", "DGS"]
          ]
        },
        {
          "name": "Tindakan",
          "headers": ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"],
          "formats": { "D": "#,##0", "F": "0.0%" },
          "validations": {
            "E": ["Ya", "Tidak"]
          },
          "seedRows": [
            ["UMM-0001", "Konsultasi Dokter Gigi", "Umum", 50000, "Tidak", ""],
            ["UMM-0002", "Foto Rontgen Periapikal Digital", "Umum", 100000, "Tidak", 0.15],
            ["DGU-0001", "Penambalan Komposit Light-Cure", "Dokter Gigi Umum", 250000, "Tidak", ""],
            ["DGU-0002", "Scaling Rahang Atas & Bawah", "Dokter Gigi Umum", 300000, "Tidak", ""],
            ["DGU-0003", "Pencabutan Gigi Permanen Ringan", "Dokter Gigi Umum", 200000, "Tidak", ""],
            ["DGS-0001", "Perawatan Saluran Akar (PSA) Molar", "Dokter Gigi Spesialis", 1500000, "Tidak", ""],
            ["DGS-0002", "Odontektomi Gigi Impaksi M3", "Dokter Gigi Spesialis", 2500000, "Tidak", ""],
            ["DGS-0003", "Pemasangan Behel Standar (Include Scaling)", "Dokter Gigi Spesialis", 5000000, "Tidak", ""],
            ["LAB-0001", "Pemasangan Mahkota PFM (Crown)", "Dokter Gigi Spesialis", 1500000, "Ya", ""],
            ["LAB-0002", "Gigi Tiruan Sebagian Lepasan (Valplast)", "Dokter Gigi Spesialis", 1800000, "Ya", ""]
          ]
        },
        {
          "name": "Tarif_Khusus_Dokter",
          "headers": ["ID_Aturan", "Nama_Dokter", "Kode_Tindakan", "Nama_Tindakan", "Persen_JM_Dokter", "Keterangan"],
          "formats": { "E": "0.0%" },
          "seedRows": [
            ["EXC-0001", "drg. Tia Ardhana R", "DGS-0001", "Perawatan Saluran Akar (PSA) Molar", 0.55, "drg. Tia Ardhana R: PSA Molar JM Khusus 55% (Default 50%)"],
            ["EXC-0002", "drg. Tia Ardhana R", "DGS-0002", "Odontektomi Gigi Impaksi M3", 0.55, "drg. Tia Ardhana R: Bedah Minor JM Khusus 55% (Default 50%)"],
            ["EXC-0003", "drg. Tia Ardhana R", "LAB-0001", "Pemasangan Mahkota PFM (Crown)", 0.55, "drg. Tia Ardhana R: Crown PFM JM Khusus 55% setelah potong Lab (Default 50%)"]
          ]
        }
      ]
    },

    "MASTER": {
      "title": "RME Sheldon - 06 Master User & Role",
      "sheets": [
        {
          "name": "Data",
          "headers": ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"],
          "formats": { "H": "0.0%" },
          "seedRows": [
            ["Administrator Sistem", "admin", "Super User", "admin123", "Aktif", "-", "08123456789", "", "admin@sheldon.id"],
            ["drg. Rahma Yulinda D, Sp. BMM", "rahma", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2026", "081234567801", 0.65, "rahma@sheldon.id"],
            ["drg. Regyana Oktavaria", "regyana", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/002/2026", "081234567802", 0.40, "regyana@sheldon.id"],
            ["drg. Latifah Mulyana", "latifah", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/003/2026", "081234567803", 0.40, "latifah@sheldon.id"],
            ["drg. Tia Ardhana R", "tia", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/004/2026", "081234567804", 0.50, "tia@sheldon.id"],
            ["Bernadette Rostenkowski", "bernadette", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/003/2024", "081234567893", "", "bernadette@sheldon.id"],
            ["Howard Wolowitz", "howard", "Admin", "4444", "Aktif", "-", "081234567894", "", "howard@sheldon.id"]
          ],
          "validations": {
            "C": ["Super User", "Owner", "Dokter Gigi Umum", "Dokter Gigi Spesialis", "Perawat Gigi", "Perawat Umum", "Admin", "Kasir", "Staff"],
            "E": ["Aktif", "Non Aktif", "Tidak Aktif"]
          }
        },
        {
          "name": "Pengaturan_Tarif_Shift",
          "headers": ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0" },
          "validations": {
            "B": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "D": ["Uang Harian Shift", "Gaji Bulanan Tetap", "Kombinasi Shift & Tindakan"]
          },
          "seedRows": [
            ["TARIF-001", "Dokter Gigi Spesialis", "drg. Rahma Yulinda D, Sp. BMM", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 65% (Rontgen 15%)"],
            ["TARIF-002", "Dokter Gigi Umum", "drg. Regyana Oktavaria", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-003", "Dokter Gigi Umum", "drg. Latifah Mulyana", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-004", "Dokter Gigi Umum", "drg. Tia Ardhana R", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 50% / 55% (Rontgen 15%)"],
            ["TARIF-005", "Perawat Gigi", "Bernadette Rostenkowski", "Uang Harian Shift", 45000, 45000, 0, "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)"],
            ["TARIF-006", "Admin", "Howard Wolowitz", "Gaji Bulanan Tetap", 0, 0, 1200000, "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)"]
          ]
        },
        {
          "name": "Presensi_Shift_Harian",
          "headers": ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "J": "#,##0", "L": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "E": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "F": ["Shift 1", "Shift 2", "Non-Shift"],
            "I": ["Hadir", "Izin", "Sakit", "Cuti"]
          },
          "seedRows": [
            ["ATT-202610-001", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I2=\"Hadir\",IF(F2=\"Shift 1\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F2=\"Shift 2\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-002", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I3=\"Hadir\",IF(F3=\"Shift 1\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F3=\"Shift 2\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-003", "01-10-2026", "DOK-002", "drg. Regyana Oktavaria", "Dokter Gigi Umum", "Shift 1", "08:50", "15:00", "Hadir", "=IF(I4=\"Hadir\",IF(F4=\"Shift 1\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F4=\"Shift 2\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-004", "01-10-2026", "DOK-003", "drg. Latifah Mulyana", "Dokter Gigi Umum", "Shift 2", "14:55", "21:00", "Hadir", "=IF(I5=\"Hadir\",IF(F5=\"Shift 1\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F5=\"Shift 2\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-005", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I6=\"Hadir\",IF(F6=\"Shift 1\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F6=\"Shift 2\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-006", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I7=\"Hadir\",IF(F7=\"Shift 1\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F7=\"Shift 2\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-007", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 1", "08:45", "15:00", "Hadir", "=IF(I8=\"Hadir\",IF(F8=\"Shift 1\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F8=\"Shift 2\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-008", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 2", "15:00", "21:05", "Hadir", "=IF(I9=\"Hadir\",IF(F9=\"Shift 1\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F9=\"Shift 2\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 21:10:00"]
          ]
        }
      ]
    },

    "LOG": {
      "title": "RME Sheldon - 07 Log & Referensi",
      "sheets": [
        { "name": "Log_Aktivitas", "headers": ["Waktu_Aktivitas", "Nama_Account", "Aksi", "Detail"] },
        {
          "name": "pekerjaan",
          "headers": ["Nama_Pekerjaan"],
          "seedRows": [["Belum/Tidak Bekerja"], ["Pelajar/Mahasiswa"], ["Ibu Rumah Tangga"], ["PNS"], ["TNI/Polri"], ["Karyawan Swasta"], ["Wiraswasta"], ["Buruh"], ["Guru/Dosen"], ["Lainnya"]]
        }
      ]
    },

    "OBAT": {
      "title": "RME Sheldon - 08 Gudang Obat",
      "sheets": [
        {
          "name": "Master_Obat",
          "headers": ["ID_Obat", "Nama_Obat", "Kandungan_Obat", "Satuan_Beli", "Isi_Per_Satuan", "Harga_Beli_Satuan", "HPP_Pcs", "Margin_Persen", "Harga_Jual", "Stock_Tersedia", "Stock_Minimum", "Terjual", "Status_Stok", "Nilai_Persediaan"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "0.0%", "I": "#,##0", "N": "#,##0" },
          "seedRows": [
            ["OBT-0001", "Amoxicillin 500 mg", "Amoxicillin Trihydrate 500mg", "Box", 100, 80000, 800, 1.5, 2000, 500, 50, 0, "AMAN", 400000],
            ["OBT-0002", "Asam Mefenamat 500 mg", "Mefenamic Acid 500mg", "Box", 100, 50000, 500, 2.0, 1500, 500, 50, 0, "AMAN", 250000],
            ["OBT-0003", "Paracetamol 500 mg", "Paracetamol 500mg", "Box", 100, 30000, 300, 2.33, 1000, 600, 50, 0, "AMAN", 180000]
          ]
        },
        {
          "name": "Riwayat_Pembelian",
          "headers": ["Tanggal", "No_Faktur", "ID_Obat", "Nama_Obat", "Harga", "Tanggal_Kadaluarsa", "Jumlah_Beli", "Total_Beli", "Supplier", "Petugas", "Waktu_Sistem"],
          "formats": { "D": "#,##0" },
          "seedRows": [
            ["01-10-2026", "INV-KF-001", "OBT-0001", "Amoxicillin 500 mg", 80000, "31-12-2027", 5, 500, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
            ["01-10-2026", "INV-KF-002", "OBT-0002", "Asam Mefenamat 500 mg", 50000, "31-12-2027", 5, 500, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
            ["01-10-2026", "INV-KF-003", "OBT-0003", "Paracetamol 500 mg", 30000, "31-12-2027", 6, 600, "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"]
          ]
        },
        {
          "name": "Rekap_Obat",
          "grid": [
            ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_Obat!A1:N,\"select A, B, J, K, M where M = 'KRITIS' or M = 'HABIS' order by J asc\",1),\"Semua stok obat aman\")"],
            ["Total Item Obat", "=COUNTA(Master_Obat!B2:B)", "", ""],
            ["Total Fisik Stok Tersedia (Pcs)", "=SUM(Master_Obat!J2:J)", "", ""],
            ["Total Obat Terjual (Pcs)", "=SUM(Master_Obat!L2:L)", "", ""],
            ["Jumlah Stok Kritis", "=COUNTIFS(Master_Obat!J2:J,\"<=\"&Master_Obat!K2:K,Master_Obat!J2:J,\">0\")", "", ""],
            ["Jumlah Stok Habis", "=COUNTIF(Master_Obat!J2:J,\"<=0\")", "", ""],
            ["Total Nilai Persediaan (Rp)", "=SUMPRODUCT(Master_Obat!J2:J,Master_Obat!G2:G)", "", ""],
            ["Total Pengeluaran Pembelian (Rp)", "=SUM(Riwayat_Pembelian!D2:D*Riwayat_Pembelian!F2:F)", "", ""]
          ]
        }
      ]
    },

    "BMHP": {
      "title": "RME Sheldon - 09 Gudang BMHP",
      "sheets": [
        {
          "name": "Master_BMHP",
          "headers": ["Kode_Item", "Nama_Barang", "Satuan", "HPP", "Harga_Jual", "Stok_Tersedia", "Stok_Minimum", "Total_Terjual", "Expired_Date", "Supplier"],
          "formats": { "D": "#,##0", "E": "#,##0", "I": "dd-mm-yyyy" },
          "seedRows": [
            ["BMH-0001", "Sarung Tangan Lateks", "Pasang", 1500, 5000, 500, 100, 0, "2028-06-30", "SUPPLIER ALKES"],
            ["BMH-0002", "Masker Medis", "Pcs", 700, 2500, 500, 100, 0, "2028-06-30", "SUPPLIER ALKES"]
          ]
        },
        { "name": "Riwayat_Pembelian", "headers": ["Tanggal", "Kode_Item", "Nama_Item", "Qty", "Harga_Beli", "Subtotal", "Supplier", "Expired_Date", "Petugas", "Waktu_Sistem"] },
        {
          "name": "Rekap_Stok",
          "grid": [
            ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_BMHP!A1:M,\"select A, B, F, G, I, L where L = 'KRITIS' or L = 'HABIS' or L = 'KADALUARSA' order by F asc\",1),\"Semua stok aman\")"],
            ["Total Item", "=COUNTA(Master_BMHP!B2:B)", "", ""],
            ["Stok Kritis", "=COUNTIF(Master_BMHP!L2:L,\"KRITIS\")", "", ""],
            ["Stok Habis", "=COUNTIF(Master_BMHP!L2:L,\"HABIS\")", "", ""],
            ["Kadaluarsa", "=COUNTIF(Master_BMHP!L2:L,\"KADALUARSA\")", "", ""],
            ["Nilai Persediaan (HPP)", "=SUM(Master_BMHP!M2:M)", "", ""],
            ["Total Terjual (Unit)", "=SUM(Master_BMHP!H2:H)", "", ""],
            ["Pembelian Bulan Ini (Rp)", "=SUMIFS(Riwayat_Pembelian!F2:F,Riwayat_Pembelian!A2:A,\">=\"&(EOMONTH(TODAY(),-1)+1),Riwayat_Pembelian!A2:A,\"<=\"&EOMONTH(TODAY(),0))", "", ""]
          ]
        }
      ]
    },

    "ICD10": {
      "title": "RME Sheldon - 10 ICD-10",
      "sheets": [
        {
          "name": "ICD_10",
          "headers": ["ICD10_Code", "Disease_Description"],
          "seedRows": [
            ["K02.1", "Caries of dentine"],
            ["K04.0", "Pulpitis"],
            ["K04.1", "Necrosis of pulp"],
            ["K05.1", "Chronic gingivitis"],
            ["K05.3", "Chronic periodontitis"],
            ["S02.5", "Fracture of tooth"]
          ]
        }
      ]
    },

    "PAYROLL": {
      "title": "RME Sheldon - 11 Payroll & Honor Dokter",
      "sheets": [
        {
          "name": "Pengaturan_Tarif_Shift",
          "headers": ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0" },
          "validations": {
            "B": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "D": ["Uang Harian Shift", "Gaji Bulanan Tetap", "Kombinasi Shift & Tindakan"]
          },
          "seedRows": [
            ["TARIF-001", "Dokter Gigi Spesialis", "drg. Rahma Yulinda D, Sp. BMM", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 65% (Rontgen 15%)"],
            ["TARIF-002", "Dokter Gigi Umum", "drg. Regyana Oktavaria", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-003", "Dokter Gigi Umum", "drg. Latifah Mulyana", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)"],
            ["TARIF-004", "Dokter Gigi Umum", "drg. Tia Ardhana R", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 50% / 55% (Rontgen 15%)"],
            ["TARIF-005", "Perawat Gigi", "Bernadette Rostenkowski", "Uang Harian Shift", 45000, 45000, 0, "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)"],
            ["TARIF-006", "Admin", "Howard Wolowitz", "Gaji Bulanan Tetap", 0, 0, 1200000, "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)"]
          ]
        },
        {
          "name": "Presensi_Shift_Harian",
          "headers": ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "J": "#,##0", "L": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "E": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "F": ["Shift 1", "Shift 2", "Non-Shift"],
            "I": ["Hadir", "Izin", "Sakit", "Cuti"]
          },
          "seedRows": [
            ["ATT-202610-001", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I2=\"Hadir\",IF(F2=\"Shift 1\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F2=\"Shift 2\",IFERROR(VLOOKUP(D2,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-002", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I3=\"Hadir\",IF(F3=\"Shift 1\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F3=\"Shift 2\",IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-003", "01-10-2026", "DOK-002", "drg. Regyana Oktavaria", "Dokter Gigi Umum", "Shift 1", "08:50", "15:00", "Hadir", "=IF(I4=\"Hadir\",IF(F4=\"Shift 1\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F4=\"Shift 2\",IFERROR(VLOOKUP(D4,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-004", "01-10-2026", "DOK-003", "drg. Latifah Mulyana", "Dokter Gigi Umum", "Shift 2", "14:55", "21:00", "Hadir", "=IF(I5=\"Hadir\",IF(F5=\"Shift 1\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F5=\"Shift 2\",IFERROR(VLOOKUP(D5,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-005", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I6=\"Hadir\",IF(F6=\"Shift 1\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F6=\"Shift 2\",IFERROR(VLOOKUP(D6,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-006", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I7=\"Hadir\",IF(F7=\"Shift 1\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,3,FALSE),55000),IF(F7=\"Shift 2\",IFERROR(VLOOKUP(D7,Pengaturan_Tarif_Shift!C:F,4,FALSE),55000),0)),0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-007", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 1", "08:45", "15:00", "Hadir", "=IF(I8=\"Hadir\",IF(F8=\"Shift 1\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F8=\"Shift 2\",IFERROR(VLOOKUP(D8,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-008", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 2", "15:00", "21:05", "Hadir", "=IF(I9=\"Hadir\",IF(F9=\"Shift 1\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,3,FALSE),45000),IF(F9=\"Shift 2\",IFERROR(VLOOKUP(D9,Pengaturan_Tarif_Shift!C:F,4,FALSE),45000),0)),0)", "Admin", "01-10-2026 21:10:00"]
          ]
        },
        {
          "name": "Penggajian_Dokter",
          "headers": ["ID_Payroll", "Periode_Bulan", "ID_Dokter", "Nama_Dokter", "Total_Pasien", "Total_Tindakan_Bruto", "Total_Biaya_Lab", "Dasar_JM_Bersih", "Total_JM_Dokter", "Hadir_Shift_1", "Hadir_Shift_2", "Total_Uang_Harian_Shift", "Bonus_Insentif", "Potongan_PPh21", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Catatan", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "G": "#,##0", "H": "#,##0", "I": "#,##0", "L": "#,##0", "M": "#,##0", "N": "#,##0", "O": "#,##0", "P": "#,##0", "T": "dd-mm-yyyy", "V": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "S": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-DR-202610-001", "Oktober 2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", 2, 2600000, 0, 2600000, 1640000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I2+L2+M2)-(N2+O2)", "BCA", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 65% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-002", "Oktober 2026", "DOK-002", "drg. Regyana Oktavaria", 2, 400000, 0, 400000, 135000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D3,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I3+L3+M3)-(N3+O3)", "Mandiri", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 40% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-003", "Oktober 2026", "DOK-003", "drg. Latifah Mulyana", 1, 250000, 0, 250000, 100000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D4,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I4+L4+M4)-(N4+O4)", "BRI", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 40% (Rontgen 15%)", "10-10-2026 10:00:00"],
            ["PAY-DR-202610-004", "Oktober 2026", "DOK-004", "drg. Tia Ardhana R", 3, 1900000, 0, 1900000, 990000, "=COUNTIFS(Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D5,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, "=(I5+L5+M5)-(N5+O5)", "BNI", "-", "Draft", "", "Otomatis dari Absensi Shift (Rp 55.000/shift) + JM 50%/55% (Rontgen 15%)", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Honor_Perawat_Staff",
          "headers": ["ID_Payroll_Staff", "Periode_Bulan", "ID_Staff", "Nama_Staff", "Role", "Gaji_Pokok_Bulanan", "Hadir_Shift_1", "Hadir_Shift_2", "Total_Uang_Harian_Shift", "Total_Fee_Tindakan", "Uang_Makan_Transport", "Lembur", "Potongan_Kasbon", "Total_Diterima_THP", "Bank_Tujuan", "No_Rekening", "Status_Transfer", "Tanggal_Transfer", "Catatan", "Waktu_Sistem"],
          "formats": { "F": "#,##0", "I": "#,##0", "J": "#,##0", "K": "#,##0", "L": "#,##0", "M": "#,##0", "N": "#,##0", "R": "dd-mm-yyyy", "T": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "Q": ["Draft", "Approved", "Paid"]
          },
          "seedRows": [
            ["PAY-STF-202610-001", "Oktober 2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", 0, "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 1\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=COUNTIFS(Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!F:F,\"Shift 2\",Presensi_Shift_Harian!I:I,\"Hadir\")", "=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D2,Presensi_Shift_Harian!I:I,\"Hadir\")", 0, 0, 0, 0, "=(F2+I2+J2+K2+L2)-M2", "BSI", "-", "Draft", "", "Perawat (2 Shift): Rp 45.000/shift dihitung otomatis dari Absensi Kehadiran", "10-10-2026 10:00:00"],
            ["PAY-STF-202610-002", "Oktober 2026", "ADM-001", "Howard Wolowitz", "Admin", "=IFERROR(VLOOKUP(D3,Pengaturan_Tarif_Shift!C:G,5,FALSE),1200000)", 0, 0, 0, 0, 0, 0, 0, "=(F3+I3+J3+K3+L3)-M3", "Mandiri", "-", "Draft", "", "Admin (Non-Shift): Gaji Pokok Bulanan Tetap Rp 1.200.000/bulan", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Tagihan_Vendor_Lab",
          "headers": ["ID_Tagihan_Lab", "Periode_Bulan", "Nama_Vendor_Lab", "Jumlah_Pekerjaan", "Total_Biaya_Lab", "Potongan_Retur", "Total_Tagihan_Bersih", "Status_Bayar", "Tanggal_Bayar", "Metode_Bayar", "No_Faktur_Lab", "Catatan", "Waktu_Sistem"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0", "I": "dd-mm-yyyy", "M": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "H": ["Belum Lunas", "Lunas", "Dibatalkan"]
          },
          "seedRows": [
            ["LAB-BILL-202610-001", "Oktober 2026", "Dental Lab Padang Mandiri", 3, 1050000, 0, 1050000, "Belum Lunas", "", "Transfer Bank", "FAK-LAB-8912", "Pekerjaan PFM Crown 2 unit, Valplast 1 unit", "10-10-2026 10:00:00"]
          ]
        },
        {
          "name": "Slip_Gaji_Arsip",
          "headers": ["No_Slip", "Tanggal_Terbit", "Penerima", "Kategori", "Periode", "Total_THP", "File_PDF_Url", "Dikirim_Ke", "Status_Kirim", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "F": "#,##0", "J": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "D": ["Dokter", "Perawat", "Admin", "Staff"],
            "I": ["Draft", "Terkirim", "Gagal"]
          },
          "seedRows": [
            ["SLIP/DR/202610/001", "31-10-2026", "drg. Rahma Yulinda D, Sp. BMM", "Dokter", "Oktober 2026", 1750000, "https://drive.google.com/file/d/slip-rahma-okt-2026", "081234567801", "Draft", "31-10-2026 17:00:00"],
            ["SLIP/STF/202610/001", "31-10-2026", "Bernadette Rostenkowski", "Perawat", "Oktober 2026", 90000, "https://drive.google.com/file/d/slip-bernadette-okt-2026", "081234567893", "Draft", "31-10-2026 17:00:00"],
            ["SLIP/ADM/202610/001", "31-10-2026", "Howard Wolowitz", "Admin", "Oktober 2026", 1200000, "https://drive.google.com/file/d/slip-howard-okt-2026", "081234567894", "Draft", "31-10-2026 17:00:00"]
          ]
        }
      ]
    }
  };

/**
 * Helper: Mendapatkan folder tempat kumpulan Spreadsheet RME berada
 * (mengambil parent folder dari Spreadsheet MASTER / PASIEN / PEMBAYARAN yang sudah ada).
 */
function _getDatabaseParentFolder() {
  const refKeys = ["MASTER", "PASIEN", "PEMBAYARAN", "DATABASE", "REKAM_MEDIS", "OBAT"];
  for (let i = 0; i < refKeys.length; i++) {
    let k = refKeys[i];
    let id = (DB_CONFIG && DB_CONFIG[k]) ? String(DB_CONFIG[k]).trim() : "";
    if (!id) continue;
    try {
      let file = DriveApp.getFileById(id);
      let parents = file.getParents();
      while (parents.hasNext()) {
        let folder = parents.next();
        // Prioritaskan folder khusus (bukan Root Drive यदि ada sub-folder)
        if (folder.getId() !== DriveApp.getRootFolder().getId()) {
          return folder;
        }
      }
      // Fallback ke parent pertama
      let parents2 = file.getParents();
      if (parents2.hasNext()) return parents2.next();
    } catch (e) {}
  }
  return null;
}

/**
 * Helper: Memindahkan file Spreadsheet ke dalam folder database RME (bukan di Root Drive).
 */
function _moveFileToDatabaseFolder(fileId, targetFolder) {
  try {
    let folder = targetFolder || _getDatabaseParentFolder();
    if (!folder) return false;
    if (folder.getId() === DriveApp.getRootFolder().getId()) return false;
    let file = DriveApp.getFileById(fileId);
    let alreadyInFolder = false;
    let parents = file.getParents();
    while (parents.hasNext()) {
      let p = parents.next();
      if (p.getId() === folder.getId()) {
        alreadyInFolder = true;
        break;
      }
    }
    if (!alreadyInFolder) {
      file.moveTo(folder);
      return true;
    }
  } catch (e) {
    Logger.log("Info _moveFileToDatabaseFolder: " + e.message);
  }
  return false;
}

/**
 * Helper: Mencari Spreadsheet yang sudah ada (berdasarkan ID di DB_CONFIG, ScriptProperties,
 * atau nama file di dalam folder database yang sama maupun di Drive), lalu memindahkannya
 * ke folder yang sama jika masih berada di Root. Hanya membuat baru jika benar-benar belum ada.
 */
function _findOrCreateSpreadsheetInFolder(key, title) {
  let folder = _getDatabaseParentFolder();
  let prop = PropertiesService.getScriptProperties();
  let propKey = "RME_SS_ID_" + key;
  let ss = null;
  let ssId = "";
  let isBaru = false;

  // 1. Cek dari DB_CONFIG[key]
  if (DB_CONFIG && DB_CONFIG[key] && String(DB_CONFIG[key]).trim() !== "") {
    let candidateId = String(DB_CONFIG[key]).trim();
    try {
      let f = DriveApp.getFileById(candidateId);
      if (!f.isTrashed()) {
        ss = SpreadsheetApp.openById(candidateId);
        ssId = candidateId;
      }
    } catch (e) {
      ss = null;
    }
  }

  // 2. Cek dari ScriptProperties
  if (!ss) {
    let savedId = prop.getProperty(propKey) || (key === "PAYROLL" ? prop.getProperty("RME_PAYROLL_SS_ID") : "");
    if (savedId && savedId.trim() !== "") {
      try {
        let f = DriveApp.getFileById(savedId.trim());
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(savedId.trim());
          ssId = savedId.trim();
        }
      } catch (e) {
        ss = null;
      }
    }
  }

  // 3. Cari berdasarkan nama di dalam folder yang sama terlebih dahulu
  if (!ss && folder) {
    try {
      let filesInFolder = folder.getFilesByName(title);
      while (filesInFolder.hasNext()) {
        let f = filesInFolder.next();
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(f.getId());
          ssId = f.getId();
          break;
        }
      }
    } catch (e) {}
  }

  // 4. Cari berdasarkan nama di seluruh Google Drive (jika sebelumnya terbuat di Root)
  if (!ss) {
    try {
      let allFiles = DriveApp.getFilesByName(title);
      while (allFiles.hasNext()) {
        let f = allFiles.next();
        if (!f.isTrashed()) {
          ss = SpreadsheetApp.openById(f.getId());
          ssId = f.getId();
          break;
        }
      }
    } catch (e) {}
  }

  // 5. Jika benar-benar belum ada, baru buat Spreadsheet baru
  if (!ss) {
    ss = SpreadsheetApp.create(title);
    ssId = ss.getId();
    isBaru = true;
  }

  // Pastikan file berada di dalam folder database yang sama (bukan di Root)
  if (ssId && folder) {
    _moveFileToDatabaseFolder(ssId, folder);
  }

  // Simpan ID ke memori & ScriptProperties
  try {
    if (DB_CONFIG) DB_CONFIG[key] = ssId;
    prop.setProperty(propKey, ssId);
    if (key === "PAYROLL") prop.setProperty("RME_PAYROLL_SS_ID", ssId);
  } catch (e) {}

  return { ss: ss, ssId: ssId, isBaru: isBaru, folderName: folder ? folder.getName() : "Root" };
}

/**
 * Buka Apps Script Editor -> Pilih fungsi `setupAllSpreadsheets` -> Klik RUN.
 * Jika Spreadsheet sudah ada, fungsi ini akan MENG-UPDATE spreadsheet yang sudah ada
 * dan menempatkannya di dalam folder yang sama (tidak membuat duplikat di Root).
 */
function setupAllSpreadsheets() {
  Logger.log("=== MEMULAI SINKRONISASI / SETUP SPREADSHEET RME SHELDON ===");
  let newConfig = {};

  Object.keys(SPREADSHEET_DEFINITIONS).forEach(key => {
    let def = SPREADSHEET_DEFINITIONS[key];
    let found = _findOrCreateSpreadsheetInFolder(key, def.title);
    let ss = found.ss;
    newConfig[key] = found.ssId;
    Logger.log((found.isBaru ? "✅ Membuat Baru: " : "🔄 Mengupdate yang Sudah Ada: ") + def.title + " (ID: " + found.ssId + " | Folder: " + found.folderName + ")");

    def.sheets.forEach((shDef, idx) => {
      let sheet = ss.getSheetByName(shDef.name);
      if (!sheet) {
        if (idx === 0 && found.isBaru && ss.getSheets().length === 1) {
          sheet = ss.getSheets()[0];
          sheet.setName(shDef.name);
        } else {
          sheet = ss.insertSheet(shDef.name);
        }
      }

      // 1. Headers
      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      // 2. Seed Rows (hanya jika sheet masih kosong agar data lama tidak tertimpa)
      if (shDef.seedRows && shDef.seedRows.length > 0 && sheet.getLastRow() <= 1) {
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      // 3. Grid / Formulas (Normalisasi Jumlah Kolom Per Baris)
      if (shDef.grid && shDef.grid.length > 0) {
        let maxCols = 0;
        shDef.grid.forEach(row => {
          if (row.length > maxCols) maxCols = row.length;
        });

        let normalizedGrid = shDef.grid.map(row => {
          let r = [...row];
          while (r.length < maxCols) r.push("");
          return r;
        });

        sheet.getRange(1, 1, normalizedGrid.length, maxCols).setValues(normalizedGrid);
        sheet.getRange(1, 1, 1, maxCols).setFontWeight("bold");
      }

      // 4. Data Validation Dropdowns
      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      // 5. Number Formats
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          let fmt = shDef.formats[colLetter];
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(fmt);
        });
      }
    });
  });

  Logger.log("\n=== PASTE OBJEK DB_CONFIG INI KE `00_Config.gs` ===");
  Logger.log(JSON.stringify(newConfig, null, 2));
  return newConfig;
}

/**
 * FUNGSI MIGRASI / SETUP LANGSUNG:
 * Buka Apps Script Editor -> Pilih `setupDatabaseGudangObat` -> Klik Run.
 * Fungsi ini langsung memperbarui Spreadsheet RME Sheldon - 08 Gudang Obat (ID: DB_CONFIG.OBAT)
 * dengan susunan Master Obat, Riwayat Pembelian, dan Rekap Obat lengkap dengan rumus otomatis.
 */
function setupDatabaseGudangObat() {
  Logger.log("=== MEMULAI PEMBARUAN SPREADSHEET RME SHELDON - 08 GUDANG OBAT ===");
  const idObat = DB_CONFIG.OBAT.trim();
  const ss = SpreadsheetApp.openById(idObat);
  
  // -------------------------------------------------------------
  // 1. SETUP TAB: Master_Obat
  // -------------------------------------------------------------
  let sheetMaster = ss.getSheetByName("Master_Obat") || ss.getSheetByName("Master Obat");
  if (!sheetMaster) {
    sheetMaster = ss.insertSheet("Master_Obat");
  } else {
    sheetMaster.setName("Master_Obat");
  }
  
  const headersMaster = [
    "ID_Obat", "Nama_Obat", "Kandungan_Obat", "Satuan_Beli", "Isi_Per_Satuan",
    "Harga_Beli_Satuan", "HPP_Pcs", "Margin_Persen", "Harga_Jual",
    "Stock_Tersedia", "Stock_Minimum", "Terjual", "Status_Stok", "Nilai_Persediaan"
  ];
  
  sheetMaster.getRange(1, 1, 1, headersMaster.length).setValues([headersMaster]);
  sheetMaster.getRange(1, 1, 1, headersMaster.length)
    .setFontWeight("bold")
    .setBackground("#3730A3")
    .setFontColor("#FFFFFF");
  
  if (sheetMaster.getLastRow() <= 1) {
    const seedMaster = [
      ["OBT-0001", "Amoxicillin 500 mg", "Amoxicillin Trihydrate 500mg", "Box", 100, 80000, "=IFERROR(F2/E2,800)", 1.5, "=IFERROR(ROUNDUP(G2*(1+H2),-2),2000)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A2)-L2,500)", 50, 0, "=IF(B2=\"\",\"\",IF(J2<=0,\"HABIS\",IF(J2<=K2,\"KRITIS\",\"AMAN\")))", "=IF(B2=\"\",\"\",J2*G2)"],
      ["OBT-0002", "Asam Mefenamat 500 mg", "Mefenamic Acid 500mg", "Box", 100, 50000, "=IFERROR(F3/E3,500)", 2.0, "=IFERROR(ROUNDUP(G3*(1+H3),-2),1500)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A3)-L3,500)", 50, 0, "=IF(B3=\"\",\"\",IF(J3<=0,\"HABIS\",IF(J3<=K3,\"KRITIS\",\"AMAN\")))", "=IF(B3=\"\",\"\",J3*G3)"],
      ["OBT-0003", "Paracetamol 500 mg", "Paracetamol 500mg", "Box", 100, 30000, "=IFERROR(F4/E4,300)", 2.33, "=IFERROR(ROUNDUP(G4*(1+H4),-2),1000)", "=IFERROR(SUMIFS(Riwayat_Pembelian!H:H,Riwayat_Pembelian!C:C,A4)-L4,600)", 50, 0, "=IF(B4=\"\",\"\",IF(J4<=0,\"HABIS\",IF(J4<=K4,\"KRITIS\",\"AMAN\")))", "=IF(B4=\"\",\"\",J4*G4)"]
    ];
    sheetMaster.getRange(2, 1, seedMaster.length, headersMaster.length).setValues(seedMaster);
  }
  
  sheetMaster.getRange("F2:G").setNumberFormat("#,##0");
  sheetMaster.getRange("H2:H").setNumberFormat("0.0%");
  sheetMaster.getRange("I2:I").setNumberFormat("#,##0");
  sheetMaster.getRange("N2:N").setNumberFormat("#,##0");
  
  // -------------------------------------------------------------
  // 2. SETUP TAB: Riwayat_Pembelian
  // -------------------------------------------------------------
  let sheetRiwayat = ss.getSheetByName("Riwayat_Pembelian") || ss.getSheetByName("Riwayat Pembelian");
  if (!sheetRiwayat) {
    sheetRiwayat = ss.insertSheet("Riwayat_Pembelian");
  } else {
    sheetRiwayat.setName("Riwayat_Pembelian");
  }
  
  const headersRiwayat = [
    "Tanggal", "No_Faktur", "ID_Obat", "Nama_Obat", "Harga", "Tanggal_Kadaluarsa",
    "Jumlah_Beli", "Total_Beli", "Supplier", "Petugas", "Waktu_Sistem"
  ];
  sheetRiwayat.getRange(1, 1, 1, headersRiwayat.length).setValues([headersRiwayat]);
  sheetRiwayat.getRange(1, 1, 1, headersRiwayat.length)
    .setFontWeight("bold")
    .setBackground("#047857")
    .setFontColor("#FFFFFF");
    
  if (sheetRiwayat.getLastRow() <= 1) {
    const seedRiwayat = [
      ["01-10-2026", "OBT-0001", "=IFERROR(VLOOKUP(B2,Master_Obat!A:B,2,FALSE),\"Amoxicillin 500 mg\")", 80000, "31-12-2027", 5, "=IFERROR(F2*VLOOKUP(B2,Master_Obat!A:E,5,FALSE),500)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
      ["01-10-2026", "OBT-0002", "=IFERROR(VLOOKUP(B3,Master_Obat!A:B,2,FALSE),\"Asam Mefenamat 500 mg\")", 50000, "31-12-2027", 5, "=IFERROR(F3*VLOOKUP(B3,Master_Obat!A:E,5,FALSE),500)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"],
      ["01-10-2026", "OBT-0003", "=IFERROR(VLOOKUP(B4,Master_Obat!A:B,2,FALSE),\"Paracetamol 500 mg\")", 30000, "31-12-2027", 6, "=IFERROR(F4*VLOOKUP(B4,Master_Obat!A:E,5,FALSE),600)", "PT Kimia Farma", "Super User", "01-10-2026 09:00:00"]
    ];
    sheetRiwayat.getRange(2, 1, seedRiwayat.length, headersRiwayat.length).setValues(seedRiwayat);
  }
  sheetRiwayat.getRange("D2:D").setNumberFormat("#,##0");
  
  // -------------------------------------------------------------
  // 3. SETUP TAB: Rekap_Obat
  // -------------------------------------------------------------
  let sheetRekap = ss.getSheetByName("Rekap_Obat") || ss.getSheetByName("Rekap Obat") || ss.getSheetByName("Rekap_Stok");
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet("Rekap_Obat");
  } else {
    sheetRekap.setName("Rekap_Obat");
  }
  
  const gridRekap = [
    ["Metrik", "Nilai", "", "=IFERROR(QUERY(Master_Obat!A1:N,\"select A, B, J, K, M where M = 'KRITIS' or M = 'HABIS' order by J asc\",1),\"Semua stok obat aman\")"],
    ["Total Item Obat", "=COUNTA(Master_Obat!B2:B)", "", ""],
    ["Total Fisik Stok Tersedia (Pcs)", "=SUM(Master_Obat!J2:J)", "", ""],
    ["Total Obat Terjual (Pcs)", "=SUM(Master_Obat!L2:L)", "", ""],
    ["Jumlah Stok Kritis", "=COUNTIFS(Master_Obat!J2:J,\"<=\"&Master_Obat!K2:K,Master_Obat!J2:J,\">0\")", "", ""],
    ["Jumlah Stok Habis", "=COUNTIF(Master_Obat!J2:J,\"<=0\")", "", ""],
    ["Total Nilai Persediaan (Rp)", "=SUMPRODUCT(Master_Obat!J2:J,Master_Obat!G2:G)", "", ""],
    ["Total Pengeluaran Pembelian (Rp)", "=SUM(Riwayat_Pembelian!D2:D*Riwayat_Pembelian!F2:F)", "", ""]
  ];
  sheetRekap.getRange(1, 1, gridRekap.length, 4).setValues(gridRekap);
  sheetRekap.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#0F172A").setFontColor("#FFFFFF");
  sheetRekap.getRange("B7:B8").setNumberFormat("#,##0");
  
  SpreadsheetApp.flush();
  Logger.log("=== SPREADSHEET 08 GUDANG OBAT BERHASIL DIPERBARUI LENGKAP ===");
  return {
    success: true,
    message: "Spreadsheet RME Sheldon - 08 Gudang Obat berhasil diperbarui (Master Obat, Riwayat Pembelian, Rekap Obat)!"
  };
}

/**
 * FUNGSI PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN:
 * Buka Apps Script Editor -> Pilih `repairDatabasePembayaran` -> Klik Run.
 * Fungsi ini otomatis merapikan header kolom, validasi data, format nominal, dan formula tab rekap
 * pada Spreadsheet RME Sheldon - 02 Pembayaran (ID: DB_CONFIG.PEMBAYARAN).
 */
function repairDatabasePembayaran() {
  Logger.log("=== MEMULAI PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN ===");
  const idPembayaran = DB_CONFIG.PEMBAYARAN.trim();
  const ss = SpreadsheetApp.openById(idPembayaran);

  // 1. CEK & RAPATKAN TAB: Data_Pembayaran
  let sheetBayar = ss.getSheetByName("Data_Pembayaran") || ss.getSheetByName("Data Pembayaran");
  if (!sheetBayar) {
    sheetBayar = ss.insertSheet("Data_Pembayaran");
  } else {
    sheetBayar.setName("Data_Pembayaran");
  }

  const standardHeaders = [
    'ID_Invoice', 'Tanggal_Tindakan', 'ID_Pasien', 'No_RM', 'Nama_Pasien',
    'Dokter_Pemeriksa', 'Kategori_Item', 'Nama_Item', 'Harga_Satuan', 'Qty',
    'Labor', 'Diskon_Persen', 'Grand_Total_Item', 'Perawat', 'Total_Invoice',
    'Metode_Bayar', 'Status_Pembayaran', 'Keterangan', 'Kasir_Bertugas', 'Waktu_Sistem'
  ];

  // Set header baris 1
  sheetBayar.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sheetBayar.getRange(1, 1, 1, standardHeaders.length)
    .setFontWeight("bold")
    .setBackground("#1e293b")
    .setFontColor("#ffffff");
  sheetBayar.setFrozenRows(1);

  // Format kolom
  sheetBayar.getRange("B2:B").setNumberFormat("dd-mm-yyyy");
  sheetBayar.getRange("I2:I").setNumberFormat("#,##0");
  sheetBayar.getRange("K2:K").setNumberFormat("#,##0");
  sheetBayar.getRange("M2:M").setNumberFormat("#,##0");
  sheetBayar.getRange("O2:O").setNumberFormat("#,##0");
  sheetBayar.getRange("T2:T").setNumberFormat("dd-mm-yyyy hh:mm:ss");

  // Validasi Dropdown Kolom
  let ruleKat = SpreadsheetApp.newDataValidation().requireValueInList(["Tindakan", "Obat", "BMHP"], true).build();
  sheetBayar.getRange("G2:G1000").setDataValidation(ruleKat);

  let ruleMetode = SpreadsheetApp.newDataValidation().requireValueInList(["Cash", "Transfer", "QRIS", "Debit/Kredit", "Asuransi"], true).build();
  sheetBayar.getRange("P2:P1000").setDataValidation(ruleMetode);

  let ruleStatus = SpreadsheetApp.newDataValidation().requireValueInList(["Lunas", "Uang Muka", "Pelunasan"], true).build();
  sheetBayar.getRange("Q2:Q1000").setDataValidation(ruleStatus);

  // 2. CEK & PASANG FORMULA REKAP INVOICE
  let sheetRekapInv = ss.getSheetByName("Rekap_Invoice") || ss.getSheetByName("Rekap Invoice");
  if (!sheetRekapInv) {
    sheetRekapInv = ss.insertSheet("Rekap_Invoice");
  } else {
    sheetRekapInv.setName("Rekap_Invoice");
  }

  sheetRekapInv.getRange("A1").setValue("=QUERY(Data_Pembayaran!A1:T,\"select A, B, E, F, max(O), P, Q, S, sum(M), count(H) where A is not null group by A, B, E, F, P, Q, S order by B desc label max(O) 'Total_Invoice', sum(M) 'Total_Item', count(H) 'Jumlah_Item'\",1)");
  sheetRekapInv.getRange("K1").setValue("={\"Audit\";ARRAYFORMULA(IF(A2:A=\"\",\"\",IF(E2:E=I2:I,\"OK\",\"SELISIH\")))}");

  // 3. CEK & PASANG FORMULA REKAP HARIAN & BULANAN
  let sheetRekapHarian = ss.getSheetByName("Rekap_Harian") || ss.getSheetByName("Rekap Harian");
  if (!sheetRekapHarian) {
    sheetRekapHarian = ss.insertSheet("Rekap_Harian");
  } else {
    sheetRekapHarian.setName("Rekap_Harian");
  }

  sheetRekapHarian.getRange("A1").setValue("=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select B, count(A), sum(E) where A is not null group by B order by B desc label count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Belum ada transaksi\")");
  sheetRekapHarian.getRange("E1").setValue("=IFERROR(QUERY(Rekap_Invoice!A1:J,\"select year(B), month(B)+1, count(A), sum(E) where B is not null group by year(B), month(B)+1 order by year(B) desc, month(B)+1 desc label year(B) 'Tahun', month(B)+1 'Bulan', count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'\",1),\"Kolom Tanggal_Tindakan harus berformat tanggal\")");

  SpreadsheetApp.flush();
  Logger.log("=== PERBAIKAN STRUKTUR SPREADSHEET PEMBAYARAN SELESAI SUKSES ===");
  return {
    success: true,
    message: "Struktur Spreadsheet Pembayaran (Data_Pembayaran, Rekap_Invoice, Rekap_Harian) berhasil diperbaiki dan disinkronkan!"
  };
}

/**
 * =========================================================================
 * FITUR OTOMATIS: SINKRONISASI SEMUA SHEET PADA SELURUH SPREADSHEET (ONE-CLICK)
 * =========================================================================
 * Menjamin 100% semua sheet yang didefinisikan di sistem (seperti Tarif_Khusus_Dokter,
 * Rekap_Jasa_Medis, dsb) otomatis terbuat di Google Drive jika belum ada.
 */
function sinkronkanSemuaSheetOtomatis() {
  Logger.log("=== MEMULAI SINKRONISASI OTOMATIS SELURUH SHEET SPREADSHEET RME ===");
  let laporan = [];

  for (let key in SPREADSHEET_DEFINITIONS) {
    let def = SPREADSHEET_DEFINITIONS[key];

    try {
      // Gunakan _findOrCreateSpreadsheetInFolder agar:
      // 1) Jika spreadsheet sudah ada di folder yang sama / di Drive, langsung di-update (TIDAK buat baru)
      // 2) Jika file berada di Root Drive, otomatis dipindahkan ke dalam folder database RME yang sama
      let found = _findOrCreateSpreadsheetInFolder(key, def.title);
      let ss = found.ss;
      if (found.isBaru) {
        laporan.push("🆕 Dibuat Spreadsheet di Folder [" + found.folderName + "]: " + def.title);
      }

      def.sheets.forEach((shDef, idx) => {
        let sheet = ss.getSheetByName(shDef.name) || 
                    ss.getSheetByName(shDef.name.replace(/\s+/g, '_')) || 
                    ss.getSheetByName("Data_" + shDef.name);

        if (!sheet) {
          if (idx === 0 && found.isBaru && ss.getSheets().length === 1) {
            sheet = ss.getSheets()[0];
            sheet.setName(shDef.name);
          } else {
            sheet = ss.insertSheet(shDef.name);
          }
          laporan.push("➕ Ditambahkan Sheet Baru: [" + def.title + " -> " + shDef.name + "]");
        }

        // Cek Headers
        if (shDef.headers && shDef.headers.length > 0) {
          if (sheet.getLastRow() === 0) {
            sheet.appendRow(shDef.headers);
            sheet.getRange(1, 1, 1, shDef.headers.length)
              .setFontWeight("bold")
              .setBackground("#1e293b")
              .setFontColor("#ffffff");
            sheet.setFrozenRows(1);
          } else {
            // Sinkronkan kolom baru yang belum ada di header baris 1
            let curH = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            let curHNormalized = curH.map(x => String(x).toLowerCase().replace(/[\s_.]/g, ''));
            shDef.headers.forEach(hName => {
              let hNorm = hName.toLowerCase().replace(/[\s_.]/g, '');
              if (!curHNormalized.includes(hNorm)) {
                let nextCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, nextCol).setValue(hName)
                  .setFontWeight("bold")
                  .setBackground("#1e293b")
                  .setFontColor("#ffffff");
                laporan.push("   ↳ Ditambahkan Kolom Baru: " + hName + " di [" + shDef.name + "]");
              }
            });
          }
        }

        // Seed Rows (jika sheet masih kosong / hanya berisi header)
        if (shDef.seedRows && shDef.seedRows.length > 0 && sheet.getLastRow() <= 1) {
          sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
        }

        // Validations
        if (shDef.validations) {
          Object.keys(shDef.validations).forEach(colLetter => {
            let listValues = shDef.validations[colLetter];
            let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
            sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
          });
        }

        // Formats
        if (shDef.formats) {
          Object.keys(shDef.formats).forEach(colLetter => {
            sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
          });
        }
      });
    } catch(err) {
      laporan.push("⚠️ Gagal akses [" + def.title + "]: " + err.message);
    }
  }

  SpreadsheetApp.flush();
  Logger.log("Laporan Sinkronisasi:\n" + laporan.join("\n"));
  return {
    success: true,
    message: laporan.length > 0 ? ("Sinkronisasi selesai (semua file ditempatkan di folder yang sama & di-update):\n" + laporan.join("\n")) : "Semua spreadsheet & sheet sudah lengkap dan sinkron di dalam folder yang sama!"
  };
}


// =========================================================================
// FITUR OTOMATIS: GENERATOR SPREADSHEET PAYROLL & TUTUP BUKU JASA MEDIS
// =========================================================================

/**
 * Helper privat: Memastikan 2 sheet (Pengaturan_Tarif_Shift & Presensi_Shift_Harian)
 * juga dibuat & diisi di dalam Spreadsheet "RME Sheldon - 06 Master User & Role"
 * agar pengguna yang membuka Master User & Role langsung melihatnya.
 */
function _sinkronkanShiftKeMasterUser() {
  try {
    const defMaster = SPREADSHEET_DEFINITIONS["MASTER"];
    if (!defMaster || !defMaster.sheets) return;
    let foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", defMaster.title);
    const ssMaster = foundMaster.ss;

    defMaster.sheets.forEach(shDef => {
      if (shDef.name !== "Pengaturan_Tarif_Shift" && shDef.name !== "Presensi_Shift_Harian") return;
      let sheet = ssMaster.getSheetByName(shDef.name) || ssMaster.insertSheet(shDef.name);

      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      if (shDef.seedRows && shDef.seedRows.length > 0) {
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });
  } catch (e) {
    Logger.log("Info _sinkronkanShiftKeMasterUser: " + e.message);
  }
}

/**
 * Otomatis meng-update atau membuat Spreadsheet "RME Sheldon - 11 Payroll & Honor Dokter"
 * di dalam FOLDER YANG SAMA dengan spreadsheet RME lainnya (bukan di Root Drive).
 * Lengkap dengan 6 sheet:
 * 1. Pengaturan_Tarif_Shift
 * 2. Presensi_Shift_Harian
 * 3. Penggajian_Dokter
 * 4. Honor_Perawat_Staff
 * 5. Tagihan_Vendor_Lab
 * 6. Slip_Gaji_Arsip
 */
function setupPayrollSpreadsheet() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    let found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    let ss = found.ss;
    let ssId = found.ssId;
    let isBaru = found.isBaru;

    // Bangun seluruh sheet berdasarkan nama (sehingga spreadsheet yang sudah ada langsung di-update)
    let firstSheet = ss.getSheets()[0];
    def.sheets.forEach((shDef, idx) => {
      let sheet = ss.getSheetByName(shDef.name);
      if (!sheet) {
        if (idx === 0 && isBaru && firstSheet) {
          sheet = firstSheet;
          sheet.setName(shDef.name);
        } else {
          sheet = ss.insertSheet(shDef.name, idx);
        }
      }

      // Headers
      if (shDef.headers) {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(shDef.headers);
        } else {
          sheet.getRange(1, 1, 1, shDef.headers.length).setValues([shDef.headers]);
        }
        sheet.getRange(1, 1, 1, shDef.headers.length)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }

      // Seed Rows (Tulis / perbarui contoh aturan shift 55rb Dokter, 45rb Perawat, 1,2jt Admin)
      if (shDef.seedRows && shDef.seedRows.length > 0) {
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        sheet.getRange(2, 1, shDef.seedRows.length, shDef.seedRows[0].length).setValues(shDef.seedRows);
      }

      // Validasi Dropdown
      if (shDef.validations) {
        Object.keys(shDef.validations).forEach(colLetter => {
          let listValues = shDef.validations[colLetter];
          let rule = SpreadsheetApp.newDataValidation().requireValueInList(listValues, true).build();
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setDataValidation(rule);
        });
      }

      // Format Rupiah & Tanggal
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });

    // Pastikan juga terbuat di "RME Sheldon - 06 Master User & Role"
    _sinkronkanShiftKeMasterUser();

    SpreadsheetApp.flush();
    return {
      success: true,
      spreadsheetId: ssId,
      url: ss.getUrl(),
      message: (isBaru ? "Spreadsheet baru berhasil dibuat di folder [" + found.folderName + "]: " : "Spreadsheet yang sudah ada berhasil di-update di folder [" + found.folderName + "]: ") + def.title + " (ID: " + ssId + ")\n\n" +
               "• Sheet 1 (Pengaturan_Tarif_Shift) & Sheet 2 (Presensi_Shift_Harian) telah di-update di [RME Sheldon - 06 Master User & Role] dan [RME Sheldon - 11 Payroll & Honor Dokter]!\n" +
               "• Dokter: Rp 55.000/shift (2 shift), Perawat: Rp 45.000/shift (2 shift), Admin: Rp 1.200.000/bulan (Non-Shift)"
    };
  } catch (err) {
    return { success: false, message: "Gagal membuat/mengupdate spreadsheet Payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Otomatisasi Rekap Tutup Buku Bulanan:
 * Menarik seluruh tindakan ber-JM dari sheet Rekap_Jasa_Medis
 * lalu membuat draft slip gaji di sheet Penggajian_Dokter.
 */
function generatePayrollPeriode(periodeBulan) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const targetBulan = periodeBulan || Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");
    
    // 1. Baca Rekap_Jasa_Medis
    const rawJM = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
    if (rawJM.length <= 1) {
      return { success: false, message: "Belum ada data tindakan di Rekap_Jasa_Medis." };
    }

    const hJM = rawJM[0];
    const idxDokter = getColIdx(hJM, ['dokter', 'nama_dokter']);
    const idxBruto = getColIdx(hJM, ['tarif_kotor', 'tarif']);
    const idxLab = getColIdx(hJM, ['biaya_lab', 'lab']);
    const idxDasar = getColIdx(hJM, ['dasar_bagi_hasil', 'dasar_jm']);
    const idxJMDokter = getColIdx(hJM, ['jm_dokter_bersih', 'jm_dokter']);

    // Agregasi per dokter
    let dokterMap = {};
    for (let i = 1; i < rawJM.length; i++) {
      let r = rawJM[i];
      let dokName = r[idxDokter] ? String(r[idxDokter]).trim() : "";
      if (!dokName || dokName === "" || dokName === "-") continue;

      if (!dokterMap[dokName]) {
        dokterMap[dokName] = {
          pasienCount: 0,
          bruto: 0,
          lab: 0,
          dasar: 0,
          jm: 0
        };
      }

      dokterMap[dokName].pasienCount += 1;
      dokterMap[dokName].bruto += Number(r[idxBruto]) || 0;
      dokterMap[dokName].lab += Number(r[idxLab]) || 0;
      dokterMap[dokName].dasar += Number(r[idxDasar]) || 0;
      dokterMap[dokName].jm += Number(r[idxJMDokter]) || 0;
    }

    // 2. Baca Data Presensi_Shift_Harian & Pengaturan_Tarif_Shift jika ada
    let ssPayrollId = (DB_CONFIG && DB_CONFIG.PAYROLL) ? DB_CONFIG.PAYROLL.trim() : "";
    if (!ssPayrollId) {
      let initRes = setupPayrollSpreadsheet();
      ssPayrollId = initRes.spreadsheetId;
    }

    // Ambil data tarif shift
    let tarifMap = {};
    try {
      const rawTarif = readFast(ssPayrollId, "Pengaturan_Tarif_Shift");
      if (rawTarif && rawTarif.length > 1) {
        const hTarif = rawTarif[0];
        const idxNama = getColIdx(hTarif, ['nama_pekerja', 'nama']);
        const idxS1 = getColIdx(hTarif, ['tarif_shift_1', 'shift_1']);
        const idxS2 = getColIdx(hTarif, ['tarif_shift_2', 'shift_2']);
        const idxGajiPokok = getColIdx(hTarif, ['gaji_pokok_bulanan', 'gaji_pokok']);

        for (let t = 1; t < rawTarif.length; t++) {
          let rowT = rawTarif[t];
          let namaT = rowT[idxNama] ? String(rowT[idxNama]).trim() : "";
          if (namaT) {
            tarifMap[namaT] = {
              shift1: Number(rowT[idxS1]) || 0,
              shift2: Number(rowT[idxS2]) || 0,
              gajiPokok: Number(rowT[idxGajiPokok]) || 0
            };
          }
        }
      }
    } catch (eTarif) {
      Logger.log("Info: Belum ada Pengaturan_Tarif_Shift: " + eTarif.message);
    }

    // Ambil data presensi kehadiran shift
    let presensiMap = {};
    try {
      const rawPresensi = readFast(ssPayrollId, "Presensi_Shift_Harian");
      if (rawPresensi && rawPresensi.length > 1) {
        const hPres = rawPresensi[0];
        const idxNamaPres = getColIdx(hPres, ['nama_pekerja', 'nama']);
        const idxShiftPres = getColIdx(hPres, ['shift']);
        const idxStatusPres = getColIdx(hPres, ['status_kehadiran', 'status']);
        const idxUangPres = getColIdx(hPres, ['uang_harian_didapat', 'uang_harian']);

        for (let p = 1; p < rawPresensi.length; p++) {
          let rowP = rawPresensi[p];
          let namaP = rowP[idxNamaPres] ? String(rowP[idxNamaPres]).trim() : "";
          let shiftP = rowP[idxShiftPres] ? String(rowP[idxShiftPres]).trim() : "";
          let statusP = rowP[idxStatusPres] ? String(rowP[idxStatusPres]).trim() : "Hadir";
          let uangP = Number(rowP[idxUangPres]) || 0;

          if (namaP && statusP.toLowerCase() === "hadir") {
            if (!presensiMap[namaP]) {
              presensiMap[namaP] = { s1: 0, s2: 0, totalUangHarian: 0 };
            }
            if (shiftP.toLowerCase().indexOf("1") !== -1) {
              presensiMap[namaP].s1 += 1;
            } else if (shiftP.toLowerCase().indexOf("2") !== -1) {
              presensiMap[namaP].s2 += 1;
            }
            presensiMap[namaP].totalUangHarian += uangP;
          }
        }
      }
    } catch (ePres) {
      Logger.log("Info: Belum ada Presensi_Shift_Harian: " + ePres.message);
    }

    const sheetPayroll = getSheetEksternal(ssPayrollId, "Penggajian_Dokter");
    let countGenerated = 0;

    for (let dok in dokterMap) {
      let d = dokterMap[dok];
      let idPay = "PAY-DR-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(countGenerated + 1).padStart(3, '0');
      
      let pres = presensiMap[dok] || { s1: 0, s2: 0, totalUangHarian: 0 };
      let hadirs1 = pres.s1;
      let hadirs2 = pres.s2;
      let totalUangHarian = pres.totalUangHarian;
      
      // Jika uang harian di presensi 0 tapi ada hitungan shift & master tarif
      if (totalUangHarian === 0 && tarifMap[dok]) {
        totalUangHarian = (hadirs1 * tarifMap[dok].shift1) + (hadirs2 * tarifMap[dok].shift2);
      }

      let bonusInsentif = 0;
      let dasarPajak = d.jm + totalUangHarian + bonusInsentif;
      let pph21 = Math.round(dasarPajak * 0.025); // Estimasi PPh 21 tarif efektif
      let kasbon = 0;
      let thp = (d.jm + totalUangHarian + bonusInsentif) - (pph21 + kasbon);

      let catatanPresensi = "Uang Harian: " + hadirs1 + "x Shift 1, " + hadirs2 + "x Shift 2 = Rp " + totalUangHarian.toLocaleString('id-ID') + " + JM";

      sheetPayroll.appendRow([
        idPay,
        targetBulan,
        "DOK-" + String(countGenerated + 1).padStart(3, '0'),
        dok,
        d.pasienCount,
        d.bruto,
        d.lab,
        d.dasar,
        d.jm,
        hadirs1,
        hadirs2,
        totalUangHarian,
        bonusInsentif,
        pph21,
        kasbon,
        thp,
        "Bank Mandiri / BCA",
        "-",
        "Draft",
        "",
        catatanPresensi,
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ]);
      countGenerated++;
    }

    return {
      success: true,
      count: countGenerated,
      message: "Berhasil menghasilkan " + countGenerated + " draft payroll dokter (terintegrasi Presensi Shift & Jasa Medis) untuk periode: " + targetBulan
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================================================================
 * FUNGSI SIMULASI OTOMATIS: ISI DATABASE PEMBAGIAN JM DOKTER & SHIFT KE SPREADSHEET
 * =========================================================================
 * Mengisi otomatis:
 * 1. RME Sheldon - 06 Master User & Role (Sheet: Data) -> 4 Dokter + Persen_JM_Dokter (65%, 40%, 40%, 50%)
 * 2. RME Sheldon - 05 Database Tindakan (Sheet: Tindakan) -> Foto Rontgen Periapikal Digital (Persen_JM_Default = 15% untuk semua dokter)
 * 3. RME Sheldon - 05 Database Tindakan (Sheet: Tarif_Khusus_Dokter) -> Tindakan khusus drg. Tia Ardhana R (55%)
 * 4. RME Sheldon - 02 Pembayaran (Sheet: Rekap_Jasa_Medis) -> Contoh simulasi perhitungan bagi hasil JM ke-4 dokter
 * 5. RME Sheldon - 11 Payroll & Honor Dokter -> Pengaturan_Tarif_Shift (Dokter 55.000/shift, Perawat 45.000/shift, Admin 1.200.000/bln), Presensi_Shift_Harian, Penggajian_Dokter, & Honor_Perawat_Staff
 */
function isiSimulasiJMDokter() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    let ringkasan = [];

    // -------------------------------------------------------------------------
    // 1. ISI / UPDATE 4 DOKTER DI SPREADSHEET 06 MASTER USER & ROLE (Sheet: Data)
    // -------------------------------------------------------------------------
    const foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", "RME Sheldon - 06 Master User & Role");
    const ssMaster = foundMaster.ss;
    let shMaster = ssMaster.getSheetByName("Data") || ssMaster.insertSheet("Data");
    const masterHeaders = ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"];
    if (shMaster.getLastRow() === 0) {
      shMaster.appendRow(masterHeaders);
    }
    let hM = shMaster.getRange(1, 1, 1, Math.max(shMaster.getLastColumn(), masterHeaders.length)).getValues()[0];
    masterHeaders.forEach((colName, idx) => {
      if (!hM[idx] || String(hM[idx]).trim() === "") {
        shMaster.getRange(1, idx + 1).setValue(colName);
      }
    });
    shMaster.getRange(1, 1, 1, masterHeaders.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shMaster.setFrozenRows(1);

    const dokterSimulasi = [
      ["drg. Rahma Yulinda D, Sp. BMM", "rahma", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2026", "081234567801", 0.65, "rahma@sheldon.id"],
      ["drg. Regyana Oktavaria", "regyana", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/002/2026", "081234567802", 0.40, "regyana@sheldon.id"],
      ["drg. Latifah Mulyana", "latifah", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/003/2026", "081234567803", 0.40, "latifah@sheldon.id"],
      ["drg. Tia Ardhana R", "tia", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/004/2026", "081234567804", 0.50, "tia@sheldon.id"]
    ];

    let dataM = shMaster.getDataRange().getValues();
    dokterSimulasi.forEach(dok => {
      let foundRow = -1;
      for (let i = 1; i < dataM.length; i++) {
        let existingUser = String(dataM[i][1] || "").trim().toLowerCase();
        let existingNama = String(dataM[i][0] || "").trim().toLowerCase();
        if (existingUser === dok[1].toLowerCase() || existingNama === dok[0].toLowerCase()) {
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow > 1) {
        shMaster.getRange(foundRow, 1, 1, dok.length).setValues([dok]);
      } else {
        shMaster.appendRow(dok);
        foundRow = shMaster.getLastRow();
      }
      shMaster.getRange(foundRow, 4).setNumberFormat("@");
      shMaster.getRange(foundRow, 8).setNumberFormat("0.0%");
    });
    ringkasan.push("✅ [06 Master User & Role -> Sheet: Data]\n   • drg. Rahma Yulinda D, Sp. BMM = 65%\n   • drg. Regyana Oktavaria = 40%\n   • drg. Latifah Mulyana = 40%\n   • drg. Tia Ardhana R = 50% (Default)");

    // -------------------------------------------------------------------------
    // 2. ISI SPREADSHEET 05 DATABASE TINDAKAN (Sheet: Tindakan & Tarif_Khusus_Dokter)
    // -------------------------------------------------------------------------
    const foundDb = _findOrCreateSpreadsheetInFolder("DATABASE", "RME Sheldon - 05 Database Tindakan");
    const ssDb = foundDb.ss;
    let shTindakan = ssDb.getSheetByName("Tindakan") || ssDb.insertSheet("Tindakan");
    const headersTindakan = ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"];
    if (shTindakan.getLastRow() === 0) {
      shTindakan.appendRow(headersTindakan);
    } else {
      shTindakan.getRange(1, 1, 1, headersTindakan.length).setValues([headersTindakan]);
    }
    shTindakan.getRange(1, 1, 1, headersTindakan.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shTindakan.setFrozenRows(1);

    const sampelTindakan = [
      ["UMM-0001", "Konsultasi Dokter Gigi", "Umum", 50000, "Tidak", ""],
      ["UMM-0002", "Foto Rontgen Periapikal Digital", "Umum", 100000, "Tidak", 0.15],
      ["UMM-0003", "Foto Rontgen Panoramik", "Umum", 200000, "Tidak", 0.15],
      ["DGU-0001", "Penambalan Komposit Light-Cure", "Dokter Gigi Umum", 250000, "Tidak", ""],
      ["DGU-0002", "Scaling Rahang Atas & Bawah", "Dokter Gigi Umum", 300000, "Tidak", ""],
      ["DGU-0003", "Pencabutan Gigi Permanen Ringan", "Dokter Gigi Umum", 250000, "Tidak", ""],
      ["DGS-0001", "Perawatan Saluran Akar (PSA) Molar", "Dokter Gigi Spesialis", 1500000, "Tidak", ""],
      ["DGS-0002", "Odontektomi Gigi Impaksi M3", "Dokter Gigi Spesialis", 2500000, "Tidak", ""],
      ["LAB-0001", "Pemasangan Mahkota PFM (Crown)", "Dokter Gigi Spesialis", 1500000, "Ya", ""]
    ];

    let dataT = shTindakan.getDataRange().getValues();
    sampelTindakan.forEach(tRow => {
      let foundIdx = -1;
      for (let i = 1; i < dataT.length; i++) {
        if (String(dataT[i][0] || "").trim().toUpperCase() === tRow[0] ||
            String(dataT[i][1] || "").trim().toLowerCase() === tRow[1].toLowerCase()) {
          foundIdx = i + 1;
          break;
        }
      }
      if (foundIdx > 1) {
        shTindakan.getRange(foundIdx, 1, 1, tRow.length).setValues([tRow]);
      } else {
        shTindakan.appendRow(tRow);
      }
    });

    // Pastikan setiap tindakan yang mengandung kata "Rontgen" / "Radiologi" otomatis terisi 15% di kolom F
    let updatedT = shTindakan.getDataRange().getValues();
    for (let i = 1; i < updatedT.length; i++) {
      let nm = String(updatedT[i][1] || "").toLowerCase();
      if (nm.includes("rontgen") || nm.includes("ronten") || nm.includes("radiologi") || nm.includes("x-ray")) {
        shTindakan.getRange(i + 1, 6).setValue(0.15);
      }
    }
    shTindakan.getRange("D2:D1000").setNumberFormat("#,##0");
    shTindakan.getRange("F2:F1000").setNumberFormat("0.0%");
    ringkasan.push("✅ [05 Database Tindakan -> Sheet: Tindakan]\n   • Kolom F (Persen_JM_Default) pada tindakan Rontgen diisi 15% (berlaku mengunci 15% untuk SEMUA dokter).");

    // Sheet: Tarif_Khusus_Dokter (Untuk drg. Tia Ardhana R yang mendapat 55% di tindakan tertentu)
    let shKhusus = ssDb.getSheetByName("Tarif_Khusus_Dokter") || ssDb.insertSheet("Tarif_Khusus_Dokter");
    const headersKhusus = ["ID_Aturan", "Nama_Dokter", "Kode_Tindakan", "Nama_Tindakan", "Persen_JM_Dokter", "Keterangan"];
    shKhusus.clearContents();
    shKhusus.appendRow(headersKhusus);
    shKhusus.getRange(1, 1, 1, headersKhusus.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    shKhusus.setFrozenRows(1);

    const aturanKhususTia = [
      ["EXC-0001", "drg. Tia Ardhana R", "DGS-0001", "Perawatan Saluran Akar (PSA) Molar", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% (Default beliau 50%)"],
      ["EXC-0002", "drg. Tia Ardhana R", "DGS-0002", "Odontektomi Gigi Impaksi M3", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% (Default beliau 50%)"],
      ["EXC-0003", "drg. Tia Ardhana R", "LAB-0001", "Pemasangan Mahkota PFM (Crown)", 0.55, "Simulasi: drg. Tia Ardhana R mendapat JM Khusus 55% setelah dikurangi Biaya Lab"]
    ];
    shKhusus.getRange(2, 1, aturanKhususTia.length, headersKhusus.length).setValues(aturanKhususTia);
    shKhusus.getRange("E2:E100").setNumberFormat("0.0%");
    ringkasan.push("✅ [05 Database Tindakan -> Sheet: Tarif_Khusus_Dokter]\n   • Diisi 3 tindakan khusus untuk drg. Tia Ardhana R dengan JM 55% (PSA Molar, Odontektomi M3, Crown PFM).");

    // -------------------------------------------------------------------------
    // 3. BUAT CONTOH HASIL PERHITUNGAN DI SPREADSHEET 02 PEMBAYARAN (Sheet: Rekap_Jasa_Medis)
    // -------------------------------------------------------------------------
    const foundBayar = _findOrCreateSpreadsheetInFolder("PEMBAYARAN", "RME Sheldon - 02 Pembayaran");
    const ssBayar = foundBayar.ss;
    let shJM = ssBayar.getSheetByName("Rekap_Jasa_Medis") || ssBayar.insertSheet("Rekap_Jasa_Medis");
    const headersJM = [
      "ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item",
      "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan",
      "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat",
      "Bagian_Klinik", "Status_JM", "Waktu_Hitung"
    ];
    if (shJM.getLastRow() === 0) {
      shJM.appendRow(headersJM);
      shJM.getRange(1, 1, 1, headersJM.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      shJM.setFrozenRows(1);
    }

    // Hapus baris simulasi sebelumnya jika ada (INV/SIMULASI/*)
    let existingJM = shJM.getDataRange().getValues();
    for (let r = existingJM.length - 1; r >= 1; r--) {
      if (String(existingJM[r][0] || "").indexOf("INV/SIMULASI/") === 0) {
        shJM.deleteRow(r + 1);
      }
    }

    const tglSim = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");
    const waktuSim = new Date();
    const rowsSimulasiJM = [
      ["INV/SIMULASI/001", tglSim, "drg. Rahma Yulinda D, Sp. BMM", "Bernadette Rostenkowski", "Tindakan", "Odontektomi Gigi Impaksi M3", 2500000, 0, 2500000, 0.65, "Default Dokter (65%)", 1625000, 0, 1625000, 0, 875000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/001", tglSim, "drg. Rahma Yulinda D, Sp. BMM", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/002", tglSim, "drg. Regyana Oktavaria", "Bernadette Rostenkowski", "Tindakan", "Scaling Rahang Atas & Bawah", 300000, 0, 300000, 0.40, "Default Dokter (40%)", 120000, 0, 120000, 0, 180000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/002", tglSim, "drg. Regyana Oktavaria", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/003", tglSim, "drg. Latifah Mulyana", "Bernadette Rostenkowski", "Tindakan", "Penambalan Komposit Light-Cure", 250000, 0, 250000, 0.40, "Default Dokter (40%)", 100000, 0, 100000, 0, 150000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Scaling Rahang Atas & Bawah", 300000, 0, 300000, 0.50, "Default Dokter (50%)", 150000, 0, 150000, 0, 150000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Perawatan Saluran Akar (PSA) Molar", 1500000, 0, 1500000, 0.55, "Tarif Khusus Dokter (55%)", 825000, 0, 825000, 0, 675000, "SIAP_CAIR", waktuSim],
      ["INV/SIMULASI/004", tglSim, "drg. Tia Ardhana R", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", 100000, 0, 100000, 0.15, "Kunci Tindakan Global (15%)", 15000, 0, 15000, 0, 85000, "SIAP_CAIR", waktuSim]
    ];

    shJM.getRange(shJM.getLastRow() + 1, 1, rowsSimulasiJM.length, headersJM.length).setValues(rowsSimulasiJM);
    shJM.getRange("G2:I1000").setNumberFormat("#,##0");
    shJM.getRange("J2:J1000").setNumberFormat("0.0%");
    shJM.getRange("L2:P1000").setNumberFormat("#,##0");
    ringkasan.push("✅ [02 Pembayaran -> Sheet: Rekap_Jasa_Medis]\n   • Ditambahkan 8 baris contoh perhitungan simulasi (INV/SIMULASI/001 s.d. 004).");

    // -------------------------------------------------------------------------
    // 4. SINKRONKAN SPREADSHEET 11 PAYROLL & HONOR DOKTER (SHIFT 55RB, PERAWAT 45RB, ADMIN 1,2JT)
    // -------------------------------------------------------------------------
    let resPay = setupPayrollSpreadsheet();
    if (resPay && resPay.success) {
      ringkasan.push("✅ [11 Payroll & Honor Dokter]\n   • Pengaturan_Tarif_Shift: Dokter Rp 55.000/shift (2 shift), Perawat Rp 45.000/shift (2 shift), Admin Rp 1.200.000/bulan (Non-Shift)\n   • Presensi_Shift_Harian, Penggajian_Dokter & Honor_Perawat_Staff terisi rumus otomatis dari absensi!" + (resPay.url ? "\n   • Link Payroll: " + resPay.url : ""));
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      urlPayroll: resPay ? resPay.url : "",
      message: "SIMULASI JM DOKTER, SHIFT, & GAJI BERHASIL DIISI KE SPREADSHEET!\n\n" + ringkasan.join("\n\n")
    };
  } catch (err) {
    return { success: false, message: "Gagal mengisi simulasi JM Dokter & Shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

