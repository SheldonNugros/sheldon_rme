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
            "E": ["Aktif", "Tidak Aktif"]
          }
        },
        {
          "name": "Pengaturan_Tarif_Shift",
          "headers": ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan", "Status"],
          "formats": { "E": "#,##0", "F": "#,##0", "G": "#,##0" },
          "validations": {
            "B": ["Super User", "Owner", "Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin", "Kasir", "Staff"],
            "D": ["Uang Harian Shift", "Gaji Bulanan Tetap", "Kombinasi Shift & Tindakan"],
            "I": ["Aktif", "Tidak Aktif"]
          },
          "seedRows": [
            ["TARIF-001", "Dokter Gigi Spesialis", "drg. Rahma Yulinda D, Sp. BMM", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 65% (Rontgen 15%)", "Aktif"],
            ["TARIF-002", "Dokter Gigi Umum", "drg. Regyana Oktavaria", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)", "Aktif"],
            ["TARIF-003", "Dokter Gigi Umum", "drg. Latifah Mulyana", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 40% (Rontgen 15%)", "Aktif"],
            ["TARIF-004", "Dokter Gigi Umum", "drg. Tia Ardhana R", "Kombinasi Shift & Tindakan", 55000, 55000, 0, "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM 50% / 55% (Rontgen 15%)", "Aktif"],
            ["TARIF-005", "Perawat Gigi", "Bernadette Rostenkowski", "Uang Harian Shift", 45000, 45000, 0, "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)", "Aktif"],
            ["TARIF-006", "Admin", "Howard Wolowitz", "Gaji Bulanan Tetap", 0, 0, 1200000, "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)", "Aktif"]
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
          "name": "Presensi_Shift_Harian",
          "headers": ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"],
          "formats": { "B": "dd-mm-yyyy", "J": "#,##0", "L": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "E": ["Dokter Gigi Spesialis", "Dokter Gigi Umum", "Perawat Gigi", "Perawat Umum", "Admin"],
            "F": ["Shift 1", "Shift 2", "Non-Shift"],
            "I": ["Hadir", "Izin", "Sakit", "Cuti"]
          },
          "seedRows": [
            ["ATT-202610-001", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I2=\"Hadir\",55000,0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-002", "01-10-2026", "DOK-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Gigi Spesialis", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I3=\"Hadir\",55000,0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-003", "01-10-2026", "DOK-002", "drg. Regyana Oktavaria", "Dokter Gigi Umum", "Shift 1", "08:50", "15:00", "Hadir", "=IF(I4=\"Hadir\",55000,0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-004", "01-10-2026", "DOK-003", "drg. Latifah Mulyana", "Dokter Gigi Umum", "Shift 2", "14:55", "21:00", "Hadir", "=IF(I5=\"Hadir\",55000,0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-005", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 1", "08:55", "15:00", "Hadir", "=IF(I6=\"Hadir\",55000,0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-006", "01-10-2026", "DOK-004", "drg. Tia Ardhana R", "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "=IF(I7=\"Hadir\",55000,0)", "Admin", "01-10-2026 21:05:00"],
            ["ATT-202610-007", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 1", "08:45", "15:00", "Hadir", "=IF(I8=\"Hadir\",45000,0)", "Admin", "01-10-2026 15:05:00"],
            ["ATT-202610-008", "01-10-2026", "PRW-001", "Bernadette Rostenkowski", "Perawat Gigi", "Shift 2", "15:00", "21:05", "Hadir", "=IF(I9=\"Hadir\",45000,0)", "Admin", "01-10-2026 21:10:00"]
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
            ["PAY-STF-202610-002", "Oktober 2026", "ADM-001", "Howard Wolowitz", "Admin", 1200000, 0, 0, 0, 0, 0, 0, 0, "=(F3+I3+J3+K3+L3)-M3", "Mandiri", "-", "Draft", "", "Admin (Non-Shift): Gaji Pokok Bulanan Tetap Rp 1.200.000/bulan", "10-10-2026 10:00:00"]
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
    },
    "ABSENSI": {
      "title": "RME Sheldon - 12 Presensi & Absensi Pegawai",
      "sheets": [
        {
          "name": "Presensi_Harian",
          "headers": ["ID_Presensi", "Tanggal", "Hari", "Shift", "Jam_Mulai", "Jam_Selesai", "ID_Pekerja", "Nama_Pekerja", "Role", "Status_Absensi", "Keterangan", "Verifikator", "Waktu_Input"],
          "formats": { "B": "dd-mm-yyyy", "E": "hh:mm", "F": "hh:mm", "M": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "D": ["Pagi", "Sore"],
            "J": ["Hadir", "Tidak"]
          },
          "seedRows": [
            ["ATT-20261015-001", "15-10-2026", "Kamis", "Pagi", "10:00", "15:00", "USR-STF-001", "Bernadette Rostenkowski", "Perawat", "Hadir", "Tepat waktu", "Admin", "15-10-2026 10:05:00"],
            ["ATT-20261015-002", "15-10-2026", "Kamis", "Pagi", "10:00", "15:00", "USR-ADM-001", "Howard Wolowitz", "Admin", "Hadir", "Tepat waktu", "Admin", "15-10-2026 10:02:00"],
            ["ATT-20261015-003", "15-10-2026", "Kamis", "Pagi", "10:00", "15:00", "DRG-001", "drg. Rahma Yulinda D, Sp. BMM", "Dokter Spesialis", "Hadir", "Tepat waktu", "Admin", "15-10-2026 10:10:00"]
          ]
        },
        {
          "name": "Kalender_Hari_Libur",
          "headers": ["Tanggal", "Hari", "Kategori_Libur", "Nama_Hari_Libur", "Status_Operasional", "Keterangan", "Dibuat_Oleh", "Waktu_Update"],
          "formats": { "A": "dd-mm-yyyy", "H": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "C": ["Libur Rutin Minggu", "Libur Nasional", "Cuti Bersama", "Libur Khusus Klinik"],
            "E": ["Tutup", "Buka Terbatas", "Buka Normal"]
          },
          "seedRows": [
            ["01-01-2026", "Kamis", "Libur Nasional", "Tahun Baru Masehi 2026", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["16-01-2026", "Jumat", "Libur Nasional", "Isra Mi'raj Nabi Muhammad SAW", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["17-02-2026", "Selasa", "Libur Nasional", "Tahun Baru Imlek 2577", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["20-03-2026", "Jumat", "Libur Nasional", "Hari Suci Nyepi (Tahun Baru Saka 1948)", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["21-03-2026", "Sabtu", "Libur Nasional", "Hari Raya Idul Fitri 1447 H (Hari ke-1)", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["22-03-2026", "Minggu", "Libur Nasional", "Hari Raya Idul Fitri 1447 H (Hari ke-2)", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["03-04-2026", "Jumat", "Libur Nasional", "Wafat Yesus Kristus", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["01-05-2026", "Jumat", "Libur Nasional", "Hari Buruh Internasional", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["14-05-2026", "Kamis", "Libur Nasional", "Kenaikan Yesus Kristus", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["27-05-2026", "Rabu", "Libur Nasional", "Hari Raya Idul Adha 1447 H", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["01-06-2026", "Senin", "Libur Nasional", "Hari Lahir Pancasila", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["16-06-2026", "Selasa", "Libur Nasional", "Tahun Baru Islam 1448 H", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["17-08-2026", "Senin", "Libur Nasional", "Hari Kemerdekaan RI Ke-81", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["25-08-2026", "Selasa", "Libur Nasional", "Maulid Nabi Muhammad SAW", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"],
            ["25-12-2026", "Jumat", "Libur Nasional", "Hari Raya Natal", "Tutup", "Libur Nasional Kalender", "Sistem", "01-01-2026 00:00:00"]
          ]
        },
        {
          "name": "Rekap_Bulanan",
          "headers": ["Periode_Bulan", "Nama_Pekerja", "Role", "Hari_Kerja", "Total_Shift_Pagi", "Total_Shift_Sore", "Total_Hadir", "Total_Tidak_Hadir", "Persentase_Kehadiran", "Terakhir_Diperbarui"],
          "formats": { "D": "0", "I": "0.0%", "J": "dd-mm-yyyy hh:mm:ss" },
          "validations": {
            "C": ["Dokter Spesialis", "Dokter Gigi", "Perawat", "Admin", "Staff"]
          },
          "seedRows": [
            ["Oktober 2026", "Bernadette Rostenkowski", "Perawat", 27, 10, 8, 18, 0, "100.0%", "15-10-2026 15:00:00"],
            ["Oktober 2026", "Howard Wolowitz", "Admin", 27, 12, 6, 18, 0, "100.0%", "15-10-2026 15:00:00"]
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
    let savedId = prop.getProperty(propKey) || (key === "PAYROLL" ? prop.getProperty("RME_PAYROLL_SS_ID") : (key === "ABSENSI" ? prop.getProperty("RME_ABSENSI_SS_ID") : ""));
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
    if (key === "ABSENSI") prop.setProperty("RME_ABSENSI_SS_ID", ssId);
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

    // Pembersihan sheet yang dipindahkan sesuai arsitektur database Sheldon:
    // 1. Hapus sheet Presensi_Shift_Harian dari 06 Master User & Role jika masih ada
    if (key === "MASTER") {
      try {
        let delPres = ss.getSheetByName("Presensi_Shift_Harian");
        if (delPres && ss.getSheets().length > 1) {
          ss.deleteSheet(delPres);
          Logger.log("🗑️ Berhasil menghapus sheet Presensi_Shift_Harian dari RME Sheldon - 06 Master User & Role");
        }
      } catch (eDel) {}
    }
    // 2. Hapus sheet Pengaturan_Tarif_Shift dari 11 Payroll & Honor Dokter jika masih ada
    if (key === "PAYROLL") {
      try {
        let delTarif = ss.getSheetByName("Pengaturan_Tarif_Shift");
        if (delTarif && ss.getSheets().length > 1) {
          ss.deleteSheet(delTarif);
          Logger.log("🗑️ Berhasil menghapus sheet Pengaturan_Tarif_Shift dari RME Sheldon - 11 Payroll & Honor Dokter");
        }
      } catch (eDel) {}
    }
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

      // Penegakan arsitektur database:
      // 1. Spreadsheet 06 Master: pastikan Presensi_Shift_Harian DIHAPUS jika ada
      if (key === "MASTER") {
        try {
          let delPres = ss.getSheetByName("Presensi_Shift_Harian");
          if (delPres && ss.getSheets().length > 1) {
            ss.deleteSheet(delPres);
            laporan.push("🗑️ Dihapus sheet Presensi_Shift_Harian dari " + def.title);
          }
        } catch (eDelPres) {}
      }
      // 2. Spreadsheet 11 Payroll: pastikan Pengaturan_Tarif_Shift DIHAPUS jika ada
      if (key === "PAYROLL") {
        try {
          let delTarif = ss.getSheetByName("Pengaturan_Tarif_Shift");
          if (delTarif && ss.getSheets().length > 1) {
            ss.deleteSheet(delTarif);
            laporan.push("🗑️ Dihapus sheet Pengaturan_Tarif_Shift dari " + def.title);
          }
        } catch (eDelTarif) {}
      }
    } catch(err) {
      laporan.push("⚠️ Gagal akses [" + def.title + "]: " + err.message);
    }
  }


  SpreadsheetApp.flush();
  Logger.log("Laporan Sinkronisasi:\n" + laporan.join("\n"));
  return {
    success: true,
    message: laporan.length > 0 ? ("Sinkronisasi selesai (seluruh sheet sinkron & sheet usang dibersihkan):\n" + laporan.join("\n")) : "Semua spreadsheet & sheet sudah lengkap, sinkron, dan bersih!"
  };
}


// =========================================================================
// FITUR OTOMATIS: GENERATOR SPREADSHEET PAYROLL & TUTUP BUKU JASA MEDIS
// =========================================================================

/**
 * Helper privat: Memastikan sheet (Pengaturan_Tarif_Shift)
 * dibuat & diisi di dalam Spreadsheet "RME Sheldon - 06 Master User & Role".
 * Menghapus sheet Presensi_Shift_Harian dari Master User & Role jika masih ada.
 */
function _sinkronkanShiftKeMasterUser() {
  try {
    const defMaster = SPREADSHEET_DEFINITIONS["MASTER"];
    if (!defMaster || !defMaster.sheets) return;
    let foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", defMaster.title);
    const ssMaster = foundMaster.ss;

    // Hapus Presensi_Shift_Harian dari 06 Master jika ada
    try {
      let legacyPresM = ssMaster.getSheetByName("Presensi_Shift_Harian");
      if (legacyPresM && ssMaster.getSheets().length > 1) {
        ssMaster.deleteSheet(legacyPresM);
      }
    } catch (eDelM) {}

    defMaster.sheets.forEach(shDef => {
      if (shDef.name !== "Pengaturan_Tarif_Shift") return;
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

    // Hapus sheet Pengaturan_Tarif_Shift dari 11 Payroll jika masih ada
    try {
      let legacyTarifP = ss.getSheetByName("Pengaturan_Tarif_Shift");
      if (legacyTarifP && ss.getSheets().length > 1) {
        ss.deleteSheet(legacyTarifP);
      }
    } catch (eDelTarifP) {}

    // Pastikan juga terbuat di "RME Sheldon - 06 Master User & Role"
    _sinkronkanShiftKeMasterUser();

    SpreadsheetApp.flush();
    return {
      success: true,
      spreadsheetId: ssId,
      url: ss.getUrl(),
      message: (isBaru ? "Spreadsheet baru berhasil dibuat di folder [" + found.folderName + "]: " : "Spreadsheet yang sudah ada berhasil di-update di folder [" + found.folderName + "]: ") + def.title + " (ID: " + ssId + ")\n\n" +
               "• Sheet Pengaturan_Tarif_Shift tersimpan di [RME Sheldon - 06 Master User & Role]!\n" +
               "• Sheet Presensi_Shift_Harian & Modul Payroll tersimpan di [RME Sheldon - 11 Payroll & Honor Dokter]!\n" +
               "• Dokter: Rp 55.000/shift (2 shift), Perawat: Rp 45.000/shift (2 shift), Admin: Rp 1.200.000/bulan (Non-Shift)"
    };
  } catch (err) {
    return { success: false, message: "Gagal membuat/mengupdate spreadsheet Payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: Mengambil atau membuat Spreadsheet 12 Presensi & Absensi Pegawai.
 */
function getSpreadsheetAbsensi_() {
  const def = SPREADSHEET_DEFINITIONS["ABSENSI"];
  const found = _findOrCreateSpreadsheetInFolder("ABSENSI", def.title);
  return { ss: found.ss, ssId: found.ssId, url: found.ss.getUrl() };
}

/**
 * Setup atau perbarui struktur Spreadsheet 12 Presensi & Absensi Pegawai.
 */
function setupAbsensiSpreadsheet() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const def = SPREADSHEET_DEFINITIONS["ABSENSI"];
    let found = _findOrCreateSpreadsheetInFolder("ABSENSI", def.title);
    let ss = found.ss;
    let ssId = found.ssId;
    let isBaru = found.isBaru;

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

      // Seed Rows jika kosong
      if (shDef.seedRows && shDef.seedRows.length > 0 && sheet.getLastRow() <= 1) {
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

      // Format Angka & Tanggal
      if (shDef.formats) {
        Object.keys(shDef.formats).forEach(colLetter => {
          sheet.getRange(colLetter + "2:" + colLetter + "1000").setNumberFormat(shDef.formats[colLetter]);
        });
      }
    });

    SpreadsheetApp.flush();
    return {
      success: true,
      spreadsheetId: ssId,
      url: ss.getUrl(),
      message: (isBaru ? "Spreadsheet baru berhasil dibuat: " : "Spreadsheet berhasil di-update: ") + def.title + " (ID: " + ssId + ")"
    };
  } catch (err) {
    return { success: false, message: "Gagal membuat/mengupdate spreadsheet Absensi: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil data modul Absensi & Presensi:
 * - Daftar nama pekerja aktif diambil dari Spreadsheet 06 Master User & Role sheet Pengaturan_Tarif_Shift.
 *   (Jika status pekerja 'Tidak Aktif', pekerja tersebut diabaikan / tidak muncul di absen).
 * - Shift Senin - Jumat: Pagi (10.00 - 15.00), Sore (16.00 - 20.00).
 * - Shift Sabtu: Pagi (10.00 - 14.00), Sore (14.00 - 18.00).
 * - Hari Minggu: Libur Rutin.
 * - Hari Libur Nasional / Cuti Bersama: Diambil dari sheet Kalender_Hari_Libur (dan bisa diedit manual).
 * - Riwayat Presensi pada tanggal yang dipilih.
 */
function getAbsensiModuleData(dateStr) {
  try {
    const absensiRef = getSpreadsheetAbsensi_();
    const ssA = absensiRef.ss;
    const ssId = absensiRef.ssId;

    // 1. Parsing Tanggal & Hari
    let now = new Date();
    let targetDate = now;
    if (dateStr) {
      if (String(dateStr).indexOf('-') !== -1) {
        let parts = String(dateStr).split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // DD-MM-YYYY
          targetDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    }
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayIndex = targetDate.getDay();
    const namaHari = dayNames[dayIndex];
    const formattedDate = Utilities.formatDate(targetDate, "Asia/Jakarta", "dd-MM-yyyy");
    const isMinggu = (dayIndex === 0);

    // 2. Tentukan Jadwal Shift berdasarkan hari
    let shiftSchedules = {
      "Pagi": { jamMulai: "10:00", jamSelesai: (dayIndex === 6 ? "14:00" : "15:00") },
      "Sore": { jamMulai: (dayIndex === 6 ? "14:00" : "16:00"), jamSelesai: (dayIndex === 6 ? "18:00" : "20:00") }
    };

    // 3. Ambil Kalender Hari Libur dari sheet Kalender_Hari_Libur
    let kalenderLibur = [];
    let isLiburNasional = false;
    let infoLibur = null;
    let shLibur = ssA.getSheetByName("Kalender_Hari_Libur");
    if (shLibur && shLibur.getLastRow() > 1) {
      let vLibur = shLibur.getRange(2, 1, shLibur.getLastRow() - 1, shLibur.getLastColumn()).getValues();
      vLibur.forEach(r => {
        let tglRaw = r[0];
        let tglStr = "";
        if (tglRaw instanceof Date) {
          tglStr = Utilities.formatDate(tglRaw, "Asia/Jakarta", "dd-MM-yyyy");
        } else {
          tglStr = String(tglRaw || "").trim();
        }
        let item = {
          tanggal: tglStr,
          hari: String(r[1] || ""),
          kategoriLibur: String(r[2] || ""),
          namaHariLibur: String(r[3] || ""),
          statusOperasional: String(r[4] || "Tutup"),
          keterangan: String(r[5] || ""),
          dibuatOleh: String(r[6] || ""),
          waktuUpdate: String(r[7] || "")
        };
        kalenderLibur.push(item);
        if (tglStr === formattedDate) {
          isLiburNasional = true;
          infoLibur = item;
        }
      });
    }

    if (isMinggu && !infoLibur) {
      infoLibur = {
        tanggal: formattedDate,
        hari: "Minggu",
        kategoriLibur: "Libur Rutin Minggu",
        namaHariLibur: "Libur Rutin Akhir Pekan (Minggu)",
        statusOperasional: "Tutup",
        keterangan: "Klinik Libur Rutin Hari Minggu"
      };
    }

    // 4. Ambil Daftar Pegawai dari Spreadsheet 06 Master User & Role sheet Pengaturan_Tarif_Shift
    // Syarat Wajib: Pekerja dengan status "Tidak Aktif" TIDAK AKAN MUNCUL di absen!
    const defM = SPREADSHEET_DEFINITIONS["MASTER"];
    const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
    const ssM = foundM.ss;
    let shTarif = ssM.getSheetByName("Pengaturan_Tarif_Shift");
    let activeWorkers = [];

    // Fallback sync jika belum tersinkron
    try {
      if (typeof syncAllUsersToPayrollTarifShift === 'function') {
        syncAllUsersToPayrollTarifShift();
      }
    } catch(eSync) {}

    if (shTarif && shTarif.getLastRow() > 1) {
      let vTarif = shTarif.getRange(2, 1, shTarif.getLastRow() - 1, shTarif.getLastColumn()).getValues();
      vTarif.forEach(r => {
        let rawNama = String(r[2] || "").trim();
        let rawRole = String(r[1] || "").trim();
        let rawStatus = String(r[8] || "Aktif").trim().toLowerCase();
        let isInactive = (rawStatus === "tidak aktif" || rawStatus === "non aktif" || rawStatus === "nonaktif" || rawStatus === "inactive");

        // HANYA pekerja yang AKTIF yang dimasukkan ke daftar absensi
        if (rawNama !== "" && !isInactive) {
          activeWorkers.push({
            idAturan: String(r[0] || ""),
            role: rawRole,
            namaPekerja: rawNama,
            tipeKompensasi: String(r[3] || ""),
            tarifShift1: Number(r[4]) || 0,
            tarifShift2: Number(r[5]) || 0,
            gajiPokokBulanan: Number(r[6]) || 0,
            status: "Aktif"
          });
        }
      });
    }

    // 5. Ambil data Presensi yang sudah tersimpan untuk tanggal ini
    let presensiHariIni = [];
    let shPres = ssA.getSheetByName("Presensi_Harian");
    if (shPres && shPres.getLastRow() > 1) {
      let vPres = shPres.getRange(2, 1, shPres.getLastRow() - 1, shPres.getLastColumn()).getValues();
      vPres.forEach(r => {
        let tglPres = r[1];
        let tglPresStr = (tglPres instanceof Date) ? Utilities.formatDate(tglPres, "Asia/Jakarta", "dd-MM-yyyy") : String(tglPres || "").trim();
        if (tglPresStr === formattedDate) {
          presensiHariIni.push({
            idPresensi: String(r[0] || ""),
            tanggal: tglPresStr,
            hari: String(r[2] || ""),
            shift: String(r[3] || ""),
            jamMulai: String(r[4] || ""),
            jamSelesai: String(r[5] || ""),
            idPekerja: String(r[6] || ""),
            namaPekerja: String(r[7] || ""),
            role: String(r[8] || ""),
            statusAbsensi: String(r[9] || "Hadir"),
            keterangan: String(r[10] || ""),
            verifikator: String(r[11] || ""),
            waktuInput: String(r[12] || "")
          });
        }
      });
    }

    // 6. Ambil Rekap Bulanan
    let targetPeriodeBulan = Utilities.formatDate(targetDate, "Asia/Jakarta", "MMMM yyyy");
    let infoHariKerjaBulanIni = hitungHariKerjaBulan_(targetPeriodeBulan, kalenderLibur);

    let rekapBulanan = [];
    let shRekap = ssA.getSheetByName("Rekap_Bulanan");
    if (shRekap && shRekap.getLastRow() > 1) {
      let vRekap = shRekap.getRange(2, 1, shRekap.getLastRow() - 1, shRekap.getLastColumn()).getValues();
      vRekap.forEach(r => {
        let pBulan = String(r[0] || targetPeriodeBulan);
        let hk = Number(r[3]);
        if (isNaN(hk) || hk <= 0) {
          hk = hitungHariKerjaBulan_(pBulan, kalenderLibur).hariKerja;
        }
        rekapBulanan.push({
          periodeBulan: pBulan,
          namaPekerja: String(r[1] || ""),
          role: String(r[2] || ""),
          hariKerja: hk,
          totalShiftPagi: Number(r[4]) || 0,
          totalShiftSore: Number(r[5]) || 0,
          totalHadir: Number(r[6]) || 0,
          totalTidakHadir: Number(r[7]) || 0,
          persentase: String(r[8] || "100%"),
          terakhirUpdate: String(r[9] || "")
        });
      });
    }

    return {
      success: true,
      spreadsheetId: ssId,
      spreadsheetUrl: ssA.getUrl(),
      date: formattedDate,
      dayName: namaHari,
      isMinggu: isMinggu,
      isLibur: (isMinggu || isLiburNasional),
      infoLibur: infoLibur,
      shiftSchedules: shiftSchedules,
      activeWorkers: activeWorkers,
      presensiHariIni: presensiHariIni,
      kalenderLibur: kalenderLibur,
      rekapBulanan: rekapBulanan,
      infoHariKerja: infoHariKerjaBulanIni
    };
  } catch (err) {
    return { success: false, message: "Gagal memuat modul Absensi: " + err.message };
  }
}

/**
 * Helper: Menghitung jumlah Hari Kerja dalam suatu bulan.
 * Hari Kerja = (Jumlah hari dalam bulan tersebut) - (Jumlah hari libur).
 * Hari libur meliputi:
 * - Setiap hari Minggu rutin pada bulan tersebut
 * - Setiap tanggal libur nasional / cuti / khusus klinik yang berstatus "Tutup"
 *   (tidak dihitung dobel jika hari libur bertepatan dengan hari Minggu).
 */
function hitungHariKerjaBulan_(periodeBulan, kalenderLibur) {
  try {
    let now = new Date();
    let monthIdx = now.getMonth();
    let year = now.getFullYear();

    const bulanIndoMap = {
      "januari": 0, "februari": 1, "maret": 2, "april": 3, "mei": 4, "juni": 5,
      "juli": 6, "agustus": 7, "september": 8, "oktober": 9, "november": 10, "desember": 11
    };

    if (periodeBulan) {
      let parts = String(periodeBulan).trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        if (bulanIndoMap[parts[0]] !== undefined) monthIdx = bulanIndoMap[parts[0]];
        let yParsed = parseInt(parts[1], 10);
        if (!isNaN(yParsed)) year = yParsed;
      }
    }

    // Jumlah hari dalam bulan tersebut (misal 31 untuk Oktober)
    let totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    // Kumpulkan set tanggal libur unik dalam format DD-MM-YYYY
    let holidayDatesSet = {};

    // 1. Hari Minggu rutin
    for (let day = 1; day <= totalDaysInMonth; day++) {
      let d = new Date(year, monthIdx, day);
      if (d.getDay() === 0) { // 0 = Minggu
        let key = String(day).padStart(2, '0') + '-' + String(monthIdx + 1).padStart(2, '0') + '-' + year;
        holidayDatesSet[key] = true;
      }
    }

    // 2. Hari Libur dari Kalender_Hari_Libur dengan statusOperasional === "Tutup"
    if (Array.isArray(kalenderLibur)) {
      kalenderLibur.forEach(h => {
        let opStatus = String(h.statusOperasional || "Tutup").trim();
        if (opStatus.toLowerCase() === "tutup") {
          let tglStr = String(h.tanggal || "").trim();
          if (tglStr.indexOf('-') !== -1) {
            let p = tglStr.split('-');
            let dObj = (p[0].length === 4)
              ? new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10))
              : new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));

            if (dObj.getMonth() === monthIdx && dObj.getFullYear() === year) {
              let key = String(dObj.getDate()).padStart(2, '0') + '-' + String(monthIdx + 1).padStart(2, '0') + '-' + year;
              holidayDatesSet[key] = true;
            }
          }
        }
      });
    }

    let totalHariLibur = Object.keys(holidayDatesSet).length;
    let hariKerja = Math.max(0, totalDaysInMonth - totalHariLibur);

    return {
      totalDaysInMonth: totalDaysInMonth,
      totalHariLibur: totalHariLibur,
      hariKerja: hariKerja
    };
  } catch (e) {
    return { totalDaysInMonth: 30, totalHariLibur: 4, hariKerja: 26 };
  }
}

/**
 * Menyimpan data presensi shift pegawai (Pagi atau Sore).
 * Status absensi dibatasi: Hadir / Tidak.
 */
function simpanAbsensiShift(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const absensiRef = getSpreadsheetAbsensi_();
    const ss = absensiRef.ss;
    let sh = ss.getSheetByName("Presensi_Harian") || ss.insertSheet("Presensi_Harian");

    const tanggal = String(payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy")).trim();
    const hari = String(payload.hari || "Senin").trim();
    const shift = String(payload.shift || "Pagi").trim();
    const jamMulai = String(payload.jamMulai || "10:00").trim();
    const jamSelesai = String(payload.jamSelesai || "15:00").trim();
    const verifikator = String(payload.verifikator || "Admin").trim();
    const waktuInput = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    const records = Array.isArray(payload.records) ? payload.records : [payload];
    if (records.length === 0) {
      return { success: false, message: "Tidak ada baris data presensi yang dikirim." };
    }

    // Baca data yang ada untuk menghindari duplikasi
    let existingValues = [];
    if (sh.getLastRow() > 1) {
      existingValues = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    }

    let savedCount = 0;
    records.forEach(rec => {
      let namaPekerja = String(rec.namaPekerja || "").trim();
      if (!namaPekerja) return;

      let idPekerja = String(rec.idPekerja || "STF-001").trim();
      let role = String(rec.role || "Staff").trim();
      let statusAbsensi = String(rec.statusAbsensi || "Hadir").trim();
      // Validasi Ketat: Hanya 'Hadir' atau 'Tidak'
      if (statusAbsensi !== "Hadir" && statusAbsensi !== "Tidak") {
        statusAbsensi = (statusAbsensi.toLowerCase().indexOf("hadir") !== -1) ? "Hadir" : "Tidak";
      }
      let keterangan = String(rec.keterangan || "").trim();

      // Cek apakah sudah ada baris (Tanggal, Shift, Nama_Pekerja)
      let matchedRowIdx = -1;
      for (let i = 0; i < existingValues.length; i++) {
        let rowTgl = existingValues[i][1];
        let rowTglStr = (rowTgl instanceof Date) ? Utilities.formatDate(rowTgl, "Asia/Jakarta", "dd-MM-yyyy") : String(rowTgl || "").trim();
        let rowShift = String(existingValues[i][3] || "").trim();
        let rowNama = String(existingValues[i][7] || "").trim();

        if (rowTglStr === tanggal && rowShift.toLowerCase() === shift.toLowerCase() && rowNama.toLowerCase() === namaPekerja.toLowerCase()) {
          matchedRowIdx = i + 2;
          break;
        }
      }

      if (matchedRowIdx !== -1) {
        // Update baris yang sudah ada
        sh.getRange(matchedRowIdx, 5).setValue(jamMulai);
        sh.getRange(matchedRowIdx, 6).setValue(jamSelesai);
        sh.getRange(matchedRowIdx, 9).setValue(role);
        sh.getRange(matchedRowIdx, 10).setValue(statusAbsensi);
        sh.getRange(matchedRowIdx, 11).setValue(keterangan);
        sh.getRange(matchedRowIdx, 12).setValue(verifikator);
        sh.getRange(matchedRowIdx, 13).setValue(waktuInput);
      } else {
        // Baris baru
        let newId = "ATT-" + tanggal.replace(/[^0-9]/g, '') + "-" + String(sh.getLastRow()).padStart(3, '0');
        sh.appendRow([
          newId,
          tanggal,
          hari,
          shift,
          jamMulai,
          jamSelesai,
          idPekerja,
          namaPekerja,
          role,
          statusAbsensi,
          keterangan,
          verifikator,
          waktuInput
        ]);
      }
      savedCount++;
    });

    SpreadsheetApp.flush();
    return {
      success: true,
      count: savedCount,
      message: "Presensi Shift " + shift + " tanggal " + tanggal + " (" + savedCount + " pegawai) berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan presensi shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan / memperbarui tanggal libur khusus, libur nasional, atau cuti bersama
 * di sheet Kalender_Hari_Libur.
 */
function simpanKalenderLibur(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const absensiRef = getSpreadsheetAbsensi_();
    const ss = absensiRef.ss;
    let sh = ss.getSheetByName("Kalender_Hari_Libur") || ss.insertSheet("Kalender_Hari_Libur");

    const tanggal = String(payload.tanggal || "").trim();
    if (!tanggal) {
      return { success: false, message: "Tanggal libur wajib diisi (format DD-MM-YYYY)." };
    }

    const namaHariLibur = String(payload.namaHariLibur || "Libur Klinik").trim();
    const kategoriLibur = String(payload.kategoriLibur || "Libur Khusus Klinik").trim();
    const statusOperasional = String(payload.statusOperasional || "Tutup").trim();
    const keterangan = String(payload.keterangan || "").trim();
    const dibuatOleh = String(payload.user || "Admin").trim();
    const waktuUpdate = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    // Hitung hari dari tanggal
    let namaHari = String(payload.hari || "").trim();
    if (!namaHari && tanggal.indexOf('-') !== -1) {
      let p = tanggal.split('-');
      let dObj = (p[0].length === 4) ? new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)) : new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      namaHari = dayNames[dObj.getDay()] || "Senin";
    }

    // Cek apakah tanggal sudah terdaftar
    let matchedRow = -1;
    if (sh.getLastRow() > 1) {
      let v = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < v.length; i++) {
        let curTgl = v[i][0];
        let curTglStr = (curTgl instanceof Date) ? Utilities.formatDate(curTgl, "Asia/Jakarta", "dd-MM-yyyy") : String(curTgl || "").trim();
        if (curTglStr === tanggal) {
          matchedRow = i + 2;
          break;
        }
      }
    }

    if (matchedRow !== -1) {
      sh.getRange(matchedRow, 1, 1, 8).setValues([[
        tanggal, namaHari, kategoriLibur, namaHariLibur, statusOperasional, keterangan, dibuatOleh, waktuUpdate
      ]]);
    } else {
      sh.appendRow([
        tanggal, namaHari, kategoriLibur, namaHariLibur, statusOperasional, keterangan, dibuatOleh, waktuUpdate
      ]);
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Hari libur [" + namaHariLibur + "] tanggal " + tanggal + " berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan kalender libur: " + err.message };
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
    
    // 1. Baca Rekap_Jasa_Medis jika ada
    let dokterMap = {};
    try {
      const rawJM = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
      if (rawJM && rawJM.length > 1) {
        const hJM = rawJM[0];
        const idxDokter = getColIdx(hJM, ['dokter', 'nama_dokter']);
        const idxBruto = getColIdx(hJM, ['tarif_kotor', 'tarif']);
        const idxLab = getColIdx(hJM, ['biaya_lab', 'lab']);
        const idxDasar = getColIdx(hJM, ['dasar_bagi_hasil', 'dasar_jm']);
        const idxJMDokter = getColIdx(hJM, ['jm_dokter_bersih', 'jm_dokter']);

        // Agregasi per dokter
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
      }
    } catch (eJM) {
      Logger.log("Info: Belum ada Rekap_Jasa_Medis: " + eJM.message);
    }

    // 2. Baca Data Presensi_Shift_Harian (dari PAYROLL) & Pengaturan_Tarif_Shift (dari MASTER)
    let ssPayrollId = (DB_CONFIG && DB_CONFIG.PAYROLL) ? DB_CONFIG.PAYROLL.trim() : "";
    if (!ssPayrollId) {
      let initRes = setupPayrollSpreadsheet();
      ssPayrollId = initRes.spreadsheetId;
    }
    let ssMasterId = (DB_CONFIG && DB_CONFIG.MASTER) ? DB_CONFIG.MASTER.trim() : "";
    if (!ssMasterId) {
      try {
        const defM = SPREADSHEET_DEFINITIONS["MASTER"];
        const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
        ssMasterId = foundM.ssId;
      } catch (eM) {}
    }

    // Ambil data tarif shift dari 06 Master User & Role
    let tarifMap = {};
    let rawTarif = null;
    try {
      if (ssMasterId) {
        rawTarif = readFast(ssMasterId, "Pengaturan_Tarif_Shift");
        if (rawTarif && rawTarif.length > 1) {
          const hTarif = rawTarif[0];
          const idxNama = getColIdx(hTarif, ['nama_pekerja', 'nama']);
          const idxS1 = getColIdx(hTarif, ['tarif_shift_1', 'shift_1']);
          const idxS2 = getColIdx(hTarif, ['tarif_shift_2', 'shift_2']);
          const idxGajiPokok = getColIdx(hTarif, ['gaji_pokok_bulanan', 'gaji_pokok']);

          const idxStatus = getColIdx(hTarif, ['status']);

          for (let t = 1; t < rawTarif.length; t++) {
            let rowT = rawTarif[t];
            let namaT = rowT[idxNama] ? String(rowT[idxNama]).trim() : "";
            let rawSt = (idxStatus !== -1 && rowT[idxStatus]) ? String(rowT[idxStatus]).trim().toLowerCase() : "aktif";
            let normSt = (rawSt === "tidak aktif" || rawSt === "non aktif" || rawSt === "nonaktif" || rawSt === "inactive") ? "Tidak Aktif" : "Aktif";
            if (namaT) {
              tarifMap[namaT] = {
                shift1: Number(rowT[idxS1]) || 0,
                shift2: Number(rowT[idxS2]) || 0,
                gajiPokok: Number(rowT[idxGajiPokok]) || 0,
                status: normSt
              };
            }
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

    // Ambil seluruh daftar pekerja (Dokter dan Staff) langsung dari Pengaturan_Tarif_Shift
    let doctorList = [];
    let staffList = [];
    let seenDoctors = new Set();

    if (rawTarif && rawTarif.length > 1) {
      const hTarif = rawTarif[0];
      const idxNama = getColIdx(hTarif, ['nama_pekerja', 'nama']);
      const idxRole = getColIdx(hTarif, ['role']);
      const idxStatus = getColIdx(hTarif, ['status']);

      for (let t = 1; t < rawTarif.length; t++) {
        let rowT = rawTarif[t];
        let namaT = rowT[idxNama] ? String(rowT[idxNama]).trim() : "";
        let roleT = (idxRole !== -1 && rowT[idxRole]) ? String(rowT[idxRole]).trim() : "";
        let rawSt = (idxStatus !== -1 && rowT[idxStatus]) ? String(rowT[idxStatus]).trim().toLowerCase() : "aktif";
        let isAktif = !(rawSt === "tidak aktif" || rawSt === "non aktif" || rawSt === "nonaktif" || rawSt === "inactive");

        if (!namaT) continue;
        let isDok = roleT.toLowerCase().includes("dokter") || namaT.toLowerCase().startsWith("drg");
        if (isDok) {
          doctorList.push({ nama: namaT, role: roleT, isAktif: isAktif });
          seenDoctors.add(namaT.toLowerCase());
        } else {
          staffList.push({ nama: namaT, role: roleT, isAktif: isAktif });
        }
      }
    }

    // Pastikan jika ada dokter dari Rekap_Jasa_Medis yang belum tercatat tetap diikutsertakan
    for (let dok in dokterMap) {
      if (!seenDoctors.has(dok.toLowerCase())) {
        doctorList.push({ nama: dok, role: "Dokter Gigi Umum", isAktif: true });
        seenDoctors.add(dok.toLowerCase());
      }
    }

    const sheetPayroll = getSheetEksternal(ssPayrollId, "Penggajian_Dokter");
    let countGenerated = 0;

    // 1. Sinkronkan Penggajian_Dokter berdasarkan nama-nama di Pengaturan_Tarif_Shift
    for (let i = 0; i < doctorList.length; i++) {
      let dokItem = doctorList[i];
      let dok = dokItem.nama;
      let isDokAktif = dokItem.isAktif;

      // Validasi keaktifan dokter: Jika Tidak Aktif, JANGAN muncul di payroll
      if (!isDokAktif) {
        // Hapus dari sheet Penggajian_Dokter jika ada rekam lama untuk periode berjalan
        try {
          let curPay = sheetPayroll.getDataRange().getValues();
          for (let rIdx = 1; rIdx < curPay.length; rIdx++) {
            if (String(curPay[rIdx][1] || "").trim().toLowerCase() === targetBulan.toLowerCase() &&
                String(curPay[rIdx][3] || "").trim().toLowerCase() === dok.toLowerCase()) {
              sheetPayroll.deleteRow(rIdx + 1);
              break;
            }
          }
        } catch(eDelDok) {}
        continue;
      }

      let d = dokterMap[dok] || { pasienCount: 0, bruto: 0, lab: 0, dasar: 0, jm: 0 };
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
      let pph21 = 0; // Default 0
      let kasbon = 0;
      let thp = (d.jm + totalUangHarian + bonusInsentif) - (pph21 + kasbon);

      let catatanPresensi = "Uang Harian: " + hadirs1 + "x Shift 1, " + hadirs2 + "x Shift 2 = Rp " + totalUangHarian.toLocaleString('id-ID') + (d.jm > 0 ? " + JM" : "");

      // Cek apakah baris dokter pada periode yang sama sudah ada agar di-update (bukan duplikat)
      let existingPayData = sheetPayroll.getDataRange().getValues();
      let foundDokRow = -1;
      for (let rIdx = 1; rIdx < existingPayData.length; rIdx++) {
        if (String(existingPayData[rIdx][1] || "").trim().toLowerCase() === targetBulan.toLowerCase() &&
            String(existingPayData[rIdx][3] || "").trim().toLowerCase() === dok.toLowerCase()) {
          foundDokRow = rIdx + 1;
          idPay = String(existingPayData[rIdx][0] || idPay);
          break;
        }
      }

      let rowDokNum = foundDokRow > 1 ? foundDokRow : (sheetPayroll.getLastRow() + 1);
      let rowDokValues = [
        idPay,
        targetBulan,
        "DOK-" + String(countGenerated + 1).padStart(3, '0'),
        dok,
        d.pasienCount,
        d.bruto,
        d.lab,
        d.dasar,
        d.jm,
        `=COUNTIFS(Presensi_Shift_Harian!D:D,D${rowDokNum},Presensi_Shift_Harian!F:F,"Shift 1",Presensi_Shift_Harian!I:I,"Hadir")`,
        `=COUNTIFS(Presensi_Shift_Harian!D:D,D${rowDokNum},Presensi_Shift_Harian!F:F,"Shift 2",Presensi_Shift_Harian!I:I,"Hadir")`,
        `=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D${rowDokNum},Presensi_Shift_Harian!I:I,"Hadir")`,
        bonusInsentif,
        pph21,
        kasbon,
        `=(I${rowDokNum}+L${rowDokNum}+M${rowDokNum})-(N${rowDokNum}+O${rowDokNum})`,
        "Bank Mandiri / BCA",
        "-",
        "Draft",
        "",
        catatanPresensi,
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      ];

      if (foundDokRow > 1) {
        sheetPayroll.getRange(foundDokRow, 1, 1, rowDokValues.length).setValues([rowDokValues]);
      } else {
        sheetPayroll.appendRow(rowDokValues);
      }
      countGenerated++;
    }

    // 2. Sinkronkan Honor_Perawat_Staff berdasarkan nama-nama di Pengaturan_Tarif_Shift
    try {
      const sheetStaff = getSheetEksternal(ssPayrollId, "Honor_Perawat_Staff");
      if (sheetStaff && staffList.length > 0) {
        let existingStf = sheetStaff.getDataRange().getValues();
        let stfCounter = 1;
        for (let s = 0; s < staffList.length; s++) {
          let stfItem = staffList[s];
          let namaT = stfItem.nama;
          let roleT = stfItem.role;
          let isStfAktif = stfItem.isAktif;

          // Jika status Tidak Aktif, JANGAN muncul di payroll
          if (!isStfAktif) {
            try {
              for (let sIdx = 1; sIdx < existingStf.length; sIdx++) {
                if (String(existingStf[sIdx][1] || "").trim().toLowerCase() === targetBulan.toLowerCase() &&
                    String(existingStf[sIdx][3] || "").trim().toLowerCase() === namaT.toLowerCase()) {
                  sheetStaff.deleteRow(sIdx + 1);
                  break;
                }
              }
            } catch(eDelStf) {}
            continue;
          }

          let isAdminRole = roleT.toLowerCase().includes("admin");
          let gajiPokokVal = (tarifMap[namaT] && tarifMap[namaT].gajiPokok) ? tarifMap[namaT].gajiPokok : (isAdminRole ? 1200000 : 0);
          let idStfPay = "PAY-STF-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(stfCounter).padStart(3, '0');
          let foundStfRow = -1;
          for (let sIdx = 1; sIdx < existingStf.length; sIdx++) {
            if (String(existingStf[sIdx][1] || "").trim().toLowerCase() === targetBulan.toLowerCase() &&
                String(existingStf[sIdx][3] || "").trim().toLowerCase() === namaT.toLowerCase()) {
              foundStfRow = sIdx + 1;
              idStfPay = String(existingStf[sIdx][0] || idStfPay);
              break;
            }
          }

          let rNum = foundStfRow > 1 ? foundStfRow : (sheetStaff.getLastRow() + 1);
          let stfRowValues = [
            idStfPay,
            targetBulan,
            (isAdminRole ? "ADM-" : "PRW-") + String(stfCounter).padStart(3, '0'),
            namaT,
            roleT,
            isAdminRole ? gajiPokokVal : 0,
            isAdminRole ? 0 : `=COUNTIFS(Presensi_Shift_Harian!D:D,D${rNum},Presensi_Shift_Harian!F:F,"Shift 1",Presensi_Shift_Harian!I:I,"Hadir")`,
            isAdminRole ? 0 : `=COUNTIFS(Presensi_Shift_Harian!D:D,D${rNum},Presensi_Shift_Harian!F:F,"Shift 2",Presensi_Shift_Harian!I:I,"Hadir")`,
            isAdminRole ? 0 : `=SUMIFS(Presensi_Shift_Harian!J:J,Presensi_Shift_Harian!D:D,D${rNum},Presensi_Shift_Harian!I:I,"Hadir")`,
            0, 0, 0, 0,
            `=(F${rNum}+I${rNum}+J${rNum}+K${rNum}+L${rNum})-M${rNum}`,
            "Mandiri / BSI",
            "-",
            "Draft",
            "",
            isAdminRole ? "Admin (Non-Shift): Gaji Pokok Bulanan Tetap Rp 1.200.000/bulan" : "Perawat (2 Shift): Rp 45.000/shift dihitung otomatis dari Absensi Kehadiran",
            Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
          ];

          if (foundStfRow > 1) {
            sheetStaff.getRange(foundStfRow, 1, 1, stfRowValues.length).setValues([stfRowValues]);
          } else {
            sheetStaff.appendRow(stfRowValues);
          }
          stfCounter++;
        }
      }
    } catch (eStf) {
      Logger.log("Info sinkronisasi Honor_Perawat_Staff: " + eStf.message);
    }

    return {
      success: true,
      count: countGenerated,
      message: "Berhasil menghasilkan & memperbarui " + countGenerated + " rekap payroll dokter + honor perawat & admin untuk periode: " + targetBulan
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}


/**
 * =========================================================================
 * FUNGSI API MODUL VIEW PAYROLL & PRESENSI SHIFT (FRONTEND <-> SHEETS)
 * =========================================================================
 */

/**
 * Mengambil seluruh data Payroll untuk ditampilkan di PayrollView:
 * - Pengaturan_Tarif_Shift
 * - Presensi_Shift_Harian
 * - Penggajian_Dokter
 * - Honor_Perawat_Staff
 * - Rekap_Jasa_Medis (dari Spreadsheet 02 Pembayaran)
 */
function getPayrollModuleData() {
  try {
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;
    const ssId = found.ssId;

    // Hapus sheet Pengaturan_Tarif_Shift di spreadsheet 11 Payroll jika masih ada
    try {
      let legacyTarifInPayroll = ss.getSheetByName("Pengaturan_Tarif_Shift");
      if (legacyTarifInPayroll && ss.getSheets().length > 1) {
        ss.deleteSheet(legacyTarifInPayroll);
      }
    } catch (eDelP) {}

    // Spreadsheet 06 Master User & Role
    const defM = SPREADSHEET_DEFINITIONS["MASTER"];
    const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
    const ssM = foundM.ss;

    // Hapus sheet Presensi_Shift_Harian di spreadsheet 06 Master User & Role jika masih ada
    try {
      let legacyPresInMaster = ssM.getSheetByName("Presensi_Shift_Harian");
      if (legacyPresInMaster && ssM.getSheets().length > 1) {
        ssM.deleteSheet(legacyPresInMaster);
      }
    } catch (eDelM) {}

    const readSheetRowsFrom = (targetSs, sheetName) => {
      let sh = targetSs.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() <= 1) return [];
      return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    };

    const readSheetRows = (sheetName) => readSheetRowsFrom(ss, sheetName);

    // Otomatis sinkronkan pekerja dari Master User & Role ke Pengaturan_Tarif_Shift di Spreadsheet MASTER
    try {
      syncAllUsersToPayrollTarifShift();
    } catch(eSyncAuto) {}

    // Pengaturan_Tarif_Shift disimpan dan dibaca dari Spreadsheet 06 Master User & Role
    const tarifShift = readSheetRowsFrom(ssM, "Pengaturan_Tarif_Shift").map(r => {
      let rawSt = String(r[8] || "Aktif").trim().toLowerCase();
      let stVal = (rawSt === "tidak aktif" || rawSt === "non aktif" || rawSt === "nonaktif" || rawSt === "inactive") ? "Tidak Aktif" : "Aktif";
      return {
        idAturan: String(r[0] || ""),
        role: String(r[1] || ""),
        namaPekerja: String(r[2] || ""),
        tipeKompensasi: String(r[3] || ""),
        tarifShift1: Number(r[4]) || 0,
        tarifShift2: Number(r[5]) || 0,
        gajiPokokBulanan: Number(r[6]) || 0,
        keterangan: String(r[7] || ""),
        status: stVal
      };
    }).filter(x => x.namaPekerja !== "");

    // Map status pekerja untuk memfilter modul payroll (Pekerja Tidak Aktif tidak muncul di payroll)
    const mapStatusPekerja = {};
    tarifShift.forEach(t => {
      mapStatusPekerja[t.namaPekerja.toLowerCase()] = t.status;
    });

    const isWorkerActive = (nama) => {
      let key = String(nama || "").trim().toLowerCase();
      if (!key) return false;
      return mapStatusPekerja[key] !== "Tidak Aktif";
    };

    const presensiHarian = readSheetRows("Presensi_Shift_Harian").map(r => ({
      idPresensi: String(r[0] || ""),
      tanggal: fDate(r[1]),
      idPekerja: String(r[2] || ""),
      namaPekerja: String(r[3] || ""),
      role: String(r[4] || ""),
      shift: String(r[5] || ""),
      jamMasuk: String(r[6] || ""),
      jamPulang: String(r[7] || ""),
      statusKehadiran: String(r[8] || "Hadir"),
      uangHarianDidapat: Number(r[9]) || 0,
      verifikator: String(r[10] || "")
    })).filter(x => x.namaPekerja !== "" && isWorkerActive(x.namaPekerja));

    const penggajianDokter = readSheetRows("Penggajian_Dokter").map(r => ({
      idPayroll: String(r[0] || ""),
      periodeBulan: String(r[1] || ""),
      idDokter: String(r[2] || ""),
      namaDokter: String(r[3] || ""),
      totalPasien: Number(r[4]) || 0,
      totalTindakanBruto: Number(r[5]) || 0,
      totalBiayaLab: Number(r[6]) || 0,
      dasarJMBersih: Number(r[7]) || 0,
      totalJMDokter: Number(r[8]) || 0,
      hadirShift1: Number(r[9]) || 0,
      hadirShift2: Number(r[10]) || 0,
      totalUangHarianShift: Number(r[11]) || 0,
      bonusInsentif: Number(r[12]) || 0,
      potonganPPh21: Number(r[13]) || 0,
      potonganKasbon: Number(r[14]) || 0,
      totalDiterimaTHP: Number(r[15]) || 0,
      bankTujuan: String(r[16] || "-"),
      noRekening: String(r[17] || "-"),
      statusTransfer: String(r[18] || "Draft"),
      tanggalTransfer: fDate(r[19]),
      catatan: String(r[20] || "")
    })).filter(x => x.namaDokter !== "" && isWorkerActive(x.namaDokter));

    let honorStaff = readSheetRows("Honor_Perawat_Staff").map(r => ({
      idPayrollStaff: String(r[0] || ""),
      periodeBulan: String(r[1] || ""),
      idStaff: String(r[2] || ""),
      namaStaff: String(r[3] || ""),
      role: String(r[4] || ""),
      gajiPokokBulanan: Number(r[5]) || 0,
      hadirShift1: Number(r[6]) || 0,
      hadirShift2: Number(r[7]) || 0,
      totalUangHarianShift: Number(r[8]) || 0,
      totalFeeTindakan: Number(r[9]) || 0,
      uangMakanTransport: Number(r[10]) || 0,
      lembur: Number(r[11]) || 0,
      potonganKasbon: Number(r[12]) || 0,
      totalDiterimaTHP: Number(r[13]) || 0,
      bankTujuan: String(r[14] || "-"),
      noRekening: String(r[15] || "-"),
      statusTransfer: String(r[16] || "Draft"),
      tanggalTransfer: fDate(r[17]),
      catatan: String(r[18] || "")
    })).filter(x => x.namaStaff !== "" && isWorkerActive(x.namaStaff));

    // Pastikan seluruh dokter aktif dari Pengaturan_Tarif_Shift terwakili di Penggajian_Dokter
    const activeDocNames = new Set(penggajianDokter.map(d => d.namaDokter.toLowerCase()));
    tarifShift.forEach((t) => {
      let isDoc = (t.role.toLowerCase().includes("dokter") || t.namaPekerja.toLowerCase().startsWith("drg"));
      if (isDoc && isWorkerActive(t.namaPekerja) && !activeDocNames.has(t.namaPekerja.toLowerCase())) {
        penggajianDokter.push({
          idPayroll: "PAY-DR-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(penggajianDokter.length + 1).padStart(3, '0'),
          periodeBulan: Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy"),
          idDokter: "DOK-" + String(penggajianDokter.length + 1).padStart(3, '0'),
          namaDokter: t.namaPekerja,
          totalPasien: 0,
          totalTindakanBruto: 0,
          totalBiayaLab: 0,
          dasarJMBersih: 0,
          totalJMDokter: 0,
          hadirShift1: 0,
          hadirShift2: 0,
          totalUangHarianShift: 0,
          bonusInsentif: 0,
          potonganPPh21: 0,
          potonganKasbon: 0,
          totalDiterimaTHP: 0,
          bankTujuan: "BCA / Mandiri",
          noRekening: "-",
          statusTransfer: "Draft",
          tanggalTransfer: "",
          catatan: "Diambil dari Pengaturan_Tarif_Shift (06 Master User & Role)"
        });
        activeDocNames.add(t.namaPekerja.toLowerCase());
      }
    });

    // Pastikan seluruh staff aktif dari Pengaturan_Tarif_Shift terwakili di Honor_Perawat_Staff
    const activeStaffNames = new Set(honorStaff.map(s => s.namaStaff.toLowerCase()));
    tarifShift.forEach((t) => {
      let isDoc = (t.role.toLowerCase().includes("dokter") || t.namaPekerja.toLowerCase().startsWith("drg"));
      if (!isDoc && isWorkerActive(t.namaPekerja) && !activeStaffNames.has(t.namaPekerja.toLowerCase())) {
        let isAdmin = t.role.toLowerCase().includes("admin");
        let gp = t.gajiPokokBulanan || (isAdmin ? 1200000 : 0);
        honorStaff.push({
          idPayrollStaff: "PAY-STF-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMM") + "-" + String(honorStaff.length + 1).padStart(3, '0'),
          periodeBulan: Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy"),
          idStaff: (isAdmin ? "ADM-" : "PRW-") + String(honorStaff.length + 1).padStart(3, '0'),
          namaStaff: t.namaPekerja,
          role: t.role,
          gajiPokokBulanan: gp,
          hadirShift1: 0,
          hadirShift2: 0,
          totalUangHarianShift: 0,
          totalFeeTindakan: 0,
          uangMakanTransport: 0,
          lembur: 0,
          potonganKasbon: 0,
          totalDiterimaTHP: gp,
          bankTujuan: "Mandiri / BSI",
          noRekening: "-",
          statusTransfer: "Draft",
          tanggalTransfer: "",
          catatan: "Diambil dari Pengaturan_Tarif_Shift (06 Master User & Role)"
        });
        activeStaffNames.add(t.namaPekerja.toLowerCase());
      }
    });

    let rekapJM = [];
    try {
      const rawJM = readFast(DB_CONFIG.PEMBAYARAN, "Rekap_Jasa_Medis");
      for (let i = 1; i < rawJM.length; i++) {
        let r = rawJM[i];
        if (!r[0] && !r[2]) continue;
        rekapJM.push({
          idInvoice: String(r[0] || ""),
          tanggal: fDate(r[1]),
          dokter: String(r[2] || ""),
          perawat: String(r[3] || ""),
          kategoriItem: String(r[4] || ""),
          namaItem: String(r[5] || ""),
          tarifKotor: Number(r[6]) || 0,
          biayaLab: Number(r[7]) || 0,
          dasarBagiHasil: Number(r[8]) || 0,
          persenJM: Number(r[9]) || 0,
          tipeAturan: String(r[10] || ""),
          jmDokterBersih: Number(r[13]) || Number(r[11]) || 0,
          bagianKlinik: Number(r[15]) || 0,
          statusJM: String(r[16] || "SIAP_CAIR")
        });
      }
    } catch (eJM) {}

    return {
      success: true,
      spreadsheetId: ssId,
      spreadsheetUrl: ss.getUrl(),
      tarifShift: tarifShift,
      presensiHarian: presensiHarian,
      penggajianDokter: penggajianDokter,
      honorStaff: honorStaff,
      rekapJM: rekapJM
    };
  } catch (err) {
    return { success: false, message: "Gagal memuat data Payroll: " + err.message };
  }
}

/**
 * Menyimpan presensi kehadiran shift baru ke Presensi_Shift_Harian
 * (baik di Spreadsheet 11 Payroll maupun 06 Master User & Role).
 */
function simpanPresensiShift(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;
    let sh = ss.getSheetByName("Presensi_Shift_Harian") || ss.insertSheet("Presensi_Shift_Harian");

    // Hapus sheet Presensi_Shift_Harian di spreadsheet 06 Master User & Role jika masih ada
    try {
      const defM = SPREADSHEET_DEFINITIONS["MASTER"];
      const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
      let legacyPresM = foundM.ss.getSheetByName("Presensi_Shift_Harian");
      if (legacyPresM && foundM.ss.getSheets().length > 1) {
        foundM.ss.deleteSheet(legacyPresM);
      }
    } catch (eDelM) {}

    const nextRow = sh.getLastRow() + 1;
    const idPresensi = payload.idPresensi || ("ATT-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + String(nextRow - 1).padStart(3, '0'));
    const tanggal = payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");
    const idPekerja = payload.idPekerja || "STF-001";
    const namaPekerja = String(payload.namaPekerja || "").trim();
    const role = String(payload.role || "Dokter Gigi Umum").trim();
    const shift = String(payload.shift || "Shift 1").trim();
    const jamMasuk = String(payload.jamMasuk || "09:00").trim();
    const jamPulang = String(payload.jamPulang || "15:00").trim();
    const status = String(payload.statusKehadiran || "Hadir").trim();
    const defaultTarif = role.toLowerCase().includes("dokter") ? 55000 : (role.toLowerCase().includes("perawat") ? 45000 : 0);

    let uangHarian = defaultTarif;
    if (status !== "Hadir") {
      uangHarian = 0;
    } else {
      // Ambil tarif shift pekerja dari Pengaturan_Tarif_Shift di Spreadsheet 06 Master User & Role
      try {
        const defM = SPREADSHEET_DEFINITIONS["MASTER"];
        const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
        const shTarif = foundM.ss.getSheetByName("Pengaturan_Tarif_Shift");
        if (shTarif) {
          let tData = shTarif.getDataRange().getValues();
          for (let ti = 1; ti < tData.length; ti++) {
            if (String(tData[ti][2] || "").trim().toLowerCase() === namaPekerja.toLowerCase()) {
              uangHarian = shift === "Shift 2" ? (Number(tData[ti][5]) || defaultTarif) : (Number(tData[ti][4]) || defaultTarif);
              break;
            }
          }
        }
      } catch (eTarif) {}
    }

    const verifikator = String(payload.verifikator || "Admin").trim();
    const waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    const rowData = [idPresensi, tanggal, idPekerja, namaPekerja, role, shift, jamMasuk, jamPulang, status, uangHarian, verifikator, waktu];
    sh.appendRow(rowData);

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Presensi kehadiran " + namaPekerja + " (" + shift + " - " + status + ") berhasil disimpan!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan presensi shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyimpan atau memperbarui aturan tarif shift / gaji pokok di Pengaturan_Tarif_Shift
 * pada Spreadsheet RME Sheldon - 06 Master User & Role.
 */
function simpanTarifShift(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    // Simpan di Spreadsheet 06 Master User & Role (Sheet: Pengaturan_Tarif_Shift)
    const defM = SPREADSHEET_DEFINITIONS["MASTER"];
    const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
    const ssM = foundM.ss;
    let sh = ssM.getSheetByName("Pengaturan_Tarif_Shift") || ssM.insertSheet("Pengaturan_Tarif_Shift");
    let sheetData = ssM.getSheetByName("Data");

    if (!sheetData || sheetData.getLastRow() <= 1) {
      return { success: false, message: "Sheet Data pengguna di Master User & Role tidak ditemukan atau masih kosong." };
    }

    const namaPekerja = String(payload.namaPekerja || "").trim();
    if (!namaPekerja) {
      return { success: false, message: "Nama pekerja wajib diisi." };
    }

    // 1. Validasi Ketat: Nama di sheet Pengaturan_Tarif_Shift harus sudah terdaftar di Sheet Data.
    // Jika namanya tidak ada di sheet data, TOLAK!
    const vData = sheetData.getDataRange().getValues();
    const hData = vData[0];
    let idNamaColData = getColIdx(hData, ['namapekerja', 'nama']); if (idNamaColData === -1) idNamaColData = 0;
    let idRoleColData = getColIdx(hData, ['kategorirole', 'role', 'kategori']); if (idRoleColData === -1) idRoleColData = 2;
    let idStatusColData = getColIdx(hData, ['status']); if (idStatusColData === -1) idStatusColData = 4;

    let foundInSheetData = null;
    for (let i = 1; i < vData.length; i++) {
      let curNm = String(vData[i][idNamaColData] || "").trim();
      if (curNm.toLowerCase() === namaPekerja.toLowerCase()) {
        foundInSheetData = {
          nama: curNm,
          role: String(vData[i][idRoleColData] || "Admin").trim(),
          status: String(vData[i][idStatusColData] || "Aktif").trim()
        };
        break;
      }
    }

    if (!foundInSheetData) {
      return {
        success: false,
        message: "Nama [" + namaPekerja + "] belum terdaftar di Sheet Data. Pendaftaran tarif shift ditolak! Daftarkan pekerja di Master User terlebih dahulu."
      };
    }

    // 2. Masukkan secara otomatis Role dari Nama Pekerja (diambil resmi dari Sheet Data)
    const role = foundInSheetData.role;

    // Hapus sheet Pengaturan_Tarif_Shift di spreadsheet 11 Payroll jika masih ada
    try {
      const defP = SPREADSHEET_DEFINITIONS["PAYROLL"];
      const foundP = _findOrCreateSpreadsheetInFolder("PAYROLL", defP.title);
      let legacyP = foundP.ss.getSheetByName("Pengaturan_Tarif_Shift");
      if (legacyP && foundP.ss.getSheets().length > 1) {
        foundP.ss.deleteSheet(legacyP);
      }
    } catch (eDelP) {}

    // Pastikan header lengkap
    if (sh.getLastRow() === 0) {
      const headers = ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan", "Status"];
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e2e8f0");
      sh.setFrozenRows(1);
    }

    let data = sh.getDataRange().getValues();
    let foundRow = -1;
    let maxIdNum = 0;
    for (let i = 1; i < data.length; i++) {
      let curId = String(data[i][0] || "");
      let match = curId.match(/TARIF-(\d+)/i);
      if (match) {
        let n = parseInt(match[1], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
      if (String(data[i][2] || "").trim().toLowerCase() === namaPekerja.toLowerCase()) {
        foundRow = i + 1;
      }
    }

    // 3. Isi ID_Aturan secara otomatis (TARIF-001, TARIF-002, dst)
    let idAturan = "";
    if (foundRow > 1) {
      idAturan = String(data[foundRow - 1][0] || "").trim();
    }
    if (!idAturan) {
      maxIdNum++;
      idAturan = "TARIF-" + String(maxIdNum).padStart(3, '0');
    }

    let tipe = String(payload.tipeKompensasi || "").trim();
    if (!tipe) {
      let rLower = role.toLowerCase();
      if (rLower.includes("dokter")) tipe = "Kombinasi Shift & Tindakan";
      else if (rLower.includes("perawat")) tipe = "Uang Harian Shift";
      else if (rLower.includes("admin") || rLower.includes("kasir")) tipe = "Gaji Bulanan Tetap";
      else tipe = "Uang Harian Shift";
    }

    const s1 = payload.tarifShift1 !== undefined ? (Number(payload.tarifShift1) || 0) : (role.toLowerCase().includes("dokter") ? 55000 : (role.toLowerCase().includes("perawat") ? 45000 : 0));
    const s2 = payload.tarifShift2 !== undefined ? (Number(payload.tarifShift2) || 0) : (role.toLowerCase().includes("dokter") ? 55000 : (role.toLowerCase().includes("perawat") ? 45000 : 0));
    const gp = payload.gajiPokokBulanan !== undefined ? (Number(payload.gajiPokokBulanan) || 0) : (role.toLowerCase().includes("admin") ? 1200000 : 0);
    const ket = String(payload.keterangan || "").trim();
    const rawStatus = String(payload.status || foundInSheetData.status || "Aktif").trim().toLowerCase();
    const status = (rawStatus === "tidak aktif" || rawStatus === "non aktif" || rawStatus === "nonaktif" || rawStatus === "inactive") ? "Tidak Aktif" : "Aktif";

    const rowValues = [idAturan, role, foundInSheetData.nama, tipe, s1, s2, gp, ket, status];

    if (foundRow > 1) {
      sh.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sh.appendRow(rowValues);
    }

    SpreadsheetApp.flush();
    return {
      success: true,
      idAturan: idAturan,
      role: role,
      message: "Pengaturan tarif shift & gaji untuk " + foundInSheetData.nama + " (Role: " + role + ", ID: " + idAturan + ") berhasil disimpan di 06 Master User & Role!"
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan pengaturan tarif shift: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Otomatis menyinkronkan data pengguna baru/update di RME Sheldon - 06 Master User & Role
 * ke sheet Pengaturan_Tarif_Shift (di dalam spreadsheet 06 Master User & Role).
 * Menginput Nama Pekerja, Role, dan Status secara otomatis saat Super Admin input data.
 */
function syncUserToPayrollTarifShift(userData) {
  if (!userData || !userData.nama) return { success: false, message: "Data pekerja tidak lengkap" };
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    // Simpan di Spreadsheet 06 Master User & Role (Sheet: Pengaturan_Tarif_Shift)
    const defM = SPREADSHEET_DEFINITIONS["MASTER"];
    const foundM = _findOrCreateSpreadsheetInFolder("MASTER", defM.title);
    const ssM = foundM.ss;
    let sh = ssM.getSheetByName("Pengaturan_Tarif_Shift") || ssM.insertSheet("Pengaturan_Tarif_Shift");

    // Hapus sheet Pengaturan_Tarif_Shift di spreadsheet 11 Payroll jika masih ada
    try {
      const defP = SPREADSHEET_DEFINITIONS["PAYROLL"];
      const foundP = _findOrCreateSpreadsheetInFolder("PAYROLL", defP.title);
      let legacyP = foundP.ss.getSheetByName("Pengaturan_Tarif_Shift");
      if (legacyP && foundP.ss.getSheets().length > 1) {
        foundP.ss.deleteSheet(legacyP);
      }
    } catch (eDelP) {}

    // Hapus sheet Presensi_Shift_Harian di spreadsheet 06 Master User & Role jika masih ada
    try {
      let legacyPresM = ssM.getSheetByName("Presensi_Shift_Harian");
      if (legacyPresM && ssM.getSheets().length > 1) {
        ssM.deleteSheet(legacyPresM);
      }
    } catch (eDelPres) {}

    const namaPekerja = String(userData.nama || "").trim();
    const role = String(userData.role || "Admin").trim();
    const rawStatus = String(userData.status || "Aktif").trim().toLowerCase();
    const status = (rawStatus === "tidak aktif" || rawStatus === "non aktif" || rawStatus === "nonaktif" || rawStatus === "inactive") ? "Tidak Aktif" : "Aktif";

    // Pastikan header memiliki kolom Status (Kolom 9)
    if (sh.getLastRow() === 0) {
      const headers = ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan", "Status"];
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e2e8f0");
      sh.setFrozenRows(1);
    } else {
      let hRow = sh.getRange(1, 1, 1, Math.max(9, sh.getLastColumn())).getValues()[0];
      let idStatCol = getColIdx(hRow, ["status"]);
      if (idStatCol === -1) {
        sh.getRange(1, 9).setValue("Status").setFontWeight("bold").setBackground("#e2e8f0");
      }
    }

    let data = sh.getDataRange().getValues();
    let h = data[0];
    let idIdCol = getColIdx(h, ["id_aturan", "idaturan", "id"]); if (idIdCol === -1) idIdCol = 0;
    let idRoleCol = getColIdx(h, ["role"]); if (idRoleCol === -1) idRoleCol = 1;
    let idNamaCol = getColIdx(h, ["namapekerja", "nama"]); if (idNamaCol === -1) idNamaCol = 2;
    let idTipeCol = getColIdx(h, ["tipekompensasi", "tipe"]); if (idTipeCol === -1) idTipeCol = 3;
    let idS1Col = getColIdx(h, ["tarifshift1", "tarif_shift_1"]); if (idS1Col === -1) idS1Col = 4;
    let idS2Col = getColIdx(h, ["tarifshift2", "tarif_shift_2"]); if (idS2Col === -1) idS2Col = 5;
    let idGpCol = getColIdx(h, ["gajipokokbulanan", "gaji_pokok_bulanan"]); if (idGpCol === -1) idGpCol = 6;
    let idKetCol = getColIdx(h, ["keterangan"]); if (idKetCol === -1) idKetCol = 7;
    let idStatCol = getColIdx(h, ["status"]); if (idStatCol === -1) idStatCol = 8;

    let foundRow = -1;
    let maxIdNum = 0;
    for (let i = 1; i < data.length; i++) {
      let curId = String(data[i][idIdCol] || "");
      let match = curId.match(/TARIF-(\d+)/i);
      if (match) {
        let n = parseInt(match[1], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
      if (String(data[i][idNamaCol] || "").trim().toLowerCase() === namaPekerja.toLowerCase()) {
        foundRow = i + 1;
      }
    }

    if (foundRow > 1) {
      // Update data: Role dan Status selalu di-sync
      sh.getRange(foundRow, idRoleCol + 1).setValue(role);
      sh.getRange(foundRow, idStatCol + 1).setValue(status);
      let curIdVal = String(data[foundRow - 1][idIdCol] || "").trim();
      if (!curIdVal) {
        maxIdNum++;
        sh.getRange(foundRow, idIdCol + 1).setValue("TARIF-" + String(maxIdNum).padStart(3, '0'));
      }
      if (userData.tipeKompensasi) sh.getRange(foundRow, idTipeCol + 1).setValue(userData.tipeKompensasi);
      if (userData.tarifShift1 !== undefined) sh.getRange(foundRow, idS1Col + 1).setValue(Number(userData.tarifShift1) || 0);
      if (userData.tarifShift2 !== undefined) sh.getRange(foundRow, idS2Col + 1).setValue(Number(userData.tarifShift2) || 0);
      if (userData.gajiPokokBulanan !== undefined) sh.getRange(foundRow, idGpCol + 1).setValue(Number(userData.gajiPokokBulanan) || 0);
      if (userData.keterangan) sh.getRange(foundRow, idKetCol + 1).setValue(userData.keterangan);
    } else {
      // Tambah baris aturan baru dengan default kompensasi berbasis role
      let tipeKompensasi = "Uang Harian Shift";
      let s1 = 45000;
      let s2 = 45000;
      let gp = 0;
      let ket = "";

      let rLower = role.toLowerCase();
      if (rLower.includes("dokter")) {
        tipeKompensasi = "Kombinasi Shift & Tindakan";
        s1 = 55000;
        s2 = 55000;
        gp = 0;
        ket = "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM Tindakan";
      } else if (rLower.includes("perawat")) {
        tipeKompensasi = "Uang Harian Shift";
        s1 = 45000;
        s2 = 45000;
        gp = 0;
        ket = "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)";
      } else if (rLower.includes("admin") || rLower.includes("kasir")) {
        tipeKompensasi = "Gaji Bulanan Tetap";
        s1 = 0;
        s2 = 0;
        gp = 1200000;
        ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)";
      } else if (rLower.includes("owner")) {
        if (namaPekerja.toLowerCase().startsWith("drg")) {
          tipeKompensasi = "Kombinasi Shift & Tindakan";
          s1 = 55000;
          s2 = 55000;
          gp = 0;
          ket = "Owner / Dokter Gigi Spesialis + JM 65%";
        } else {
          tipeKompensasi = "Gaji Bulanan Tetap";
          s1 = 0;
          s2 = 0;
          gp = 0;
          ket = "Owner / Manajemen";
        }
      } else {
        tipeKompensasi = "Uang Harian Shift";
        s1 = 40000;
        s2 = 40000;
        gp = 0;
        ket = "Staff Umum / Operasional";
      }

      if (userData.tipeKompensasi) tipeKompensasi = userData.tipeKompensasi;
      if (userData.tarifShift1 !== undefined) s1 = Number(userData.tarifShift1) || 0;
      if (userData.tarifShift2 !== undefined) s2 = Number(userData.tarifShift2) || 0;
      if (userData.gajiPokokBulanan !== undefined) gp = Number(userData.gajiPokokBulanan) || 0;
      if (userData.keterangan) ket = userData.keterangan;

      maxIdNum++;
      const idAturan = "TARIF-" + String(maxIdNum).padStart(3, '0');
      let newRow = new Array(Math.max(9, h.length)).fill("");
      newRow[0] = idAturan;
      newRow[idRoleCol] = role;
      newRow[idNamaCol] = namaPekerja;
      newRow[idTipeCol] = tipeKompensasi;
      newRow[idS1Col] = s1;
      newRow[idS2Col] = s2;
      newRow[idGpCol] = gp;
      newRow[idKetCol] = ket;
      newRow[idStatCol] = status;

      sh.appendRow(newRow);
      let newLastRow = sh.getLastRow();
      sh.getRange(newLastRow, idS1Col + 1).setNumberFormat("#,##0");
      sh.getRange(newLastRow, idS2Col + 1).setNumberFormat("#,##0");
      sh.getRange(newLastRow, idGpCol + 1).setNumberFormat("#,##0");
      sh.getRange(newLastRow, 1).setHorizontalAlignment("center");
      sh.getRange(newLastRow, idStatCol + 1).setHorizontalAlignment("center");
    }

    // Set Data Validation Dropdown: Aktif / Tidak Aktif
    try {
      const ruleStatus = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Aktif", "Tidak Aktif"], true)
        .setAllowInvalid(false)
        .build();
      sh.getRange(2, idStatCol + 1, Math.max(50, sh.getLastRow()), 1).setDataValidation(ruleStatus);
    } catch(eVal) {}

    SpreadsheetApp.flush();
    return { success: true, message: "Sinkronisasi user ke Pengaturan_Tarif_Shift berhasil: " + namaPekerja };
  } catch (err) {
    Logger.log("Error syncUserToPayrollTarifShift: " + err.message);
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menyinkronkan seluruh daftar pekerja dari RME Sheldon - 06 Master User & Role (Sheet: Data)
 * ke sheet Pengaturan_Tarif_Shift (di dalam Spreadsheet 06 Master User & Role).
 * - Otomatis mengambil Nama Pekerja dan Role dari Sheet Data.
 * - Otomatis mengisi ID_Aturan (format TARIF-001, TARIF-002, dst).
 * - Status pilihan strictly: Aktif dan Tidak Aktif.
 * - Pekerja berstatus Tidak Aktif tidak akan muncul lagi di Payroll.
 */
function syncAllUsersToPayrollTarifShift() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ssM = SpreadsheetApp.openById(DB_CONFIG.MASTER.trim());
    const sheetData = ssM.getSheetByName("Data");
    if (!sheetData || sheetData.getLastRow() <= 1) return { success: false, message: "Data Master User kosong." };

    let shTarif = ssM.getSheetByName("Pengaturan_Tarif_Shift") || ssM.insertSheet("Pengaturan_Tarif_Shift");

    // Bersihkan sheet usang jika masih ada
    try {
      let legacyPresM = ssM.getSheetByName("Presensi_Shift_Harian");
      if (legacyPresM && ssM.getSheets().length > 1) {
        ssM.deleteSheet(legacyPresM);
      }
    } catch (eDelM) {}

    try {
      if (DB_CONFIG && DB_CONFIG.PAYROLL) {
        let ssPay = SpreadsheetApp.openById(DB_CONFIG.PAYROLL.trim());
        let legacyTarifPay = ssPay.getSheetByName("Pengaturan_Tarif_Shift");
        if (legacyTarifPay && ssPay.getSheets().length > 1) {
          ssPay.deleteSheet(legacyTarifPay);
        }
      }
    } catch (eDelP) {}

    // Ambil data pekerja dari Sheet Data
    const vData = sheetData.getDataRange().getValues();
    const hData = vData[0];
    let idNama = getColIdx(hData, ['namapekerja', 'nama']); if (idNama === -1) idNama = 0;
    let idRole = getColIdx(hData, ['kategorirole', 'role', 'kategori']); if (idRole === -1) idRole = 2;
    let idStatus = getColIdx(hData, ['status']); if (idStatus === -1) idStatus = 4;

    const headers = ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan", "Status"];

    // Ambil data yang sudah ada di Pengaturan_Tarif_Shift
    let existingTarif = [];
    if (shTarif.getLastRow() > 1) {
      existingTarif = shTarif.getRange(2, 1, shTarif.getLastRow() - 1, Math.max(9, shTarif.getLastColumn())).getValues();
    }

    let mapTarif = {};
    let maxIdNum = 0;
    for (let i = 0; i < existingTarif.length; i++) {
      let r = existingTarif[i];
      let idStr = String(r[0] || "");
      let match = idStr.match(/TARIF-(\d+)/i);
      if (match) {
        let n = parseInt(match[1], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
      let nm = String(r[2] || "").trim().toLowerCase();
      if (nm) {
        let curSt = String(r[8] || "Aktif").trim().toLowerCase();
        let normSt = (curSt === "tidak aktif" || curSt === "non aktif" || curSt === "nonaktif" || curSt === "inactive") ? "Tidak Aktif" : "Aktif";
        mapTarif[nm] = {
          idAturan: idStr,
          role: String(r[1] || ""),
          namaPekerja: String(r[2] || ""),
          tipeKompensasi: String(r[3] || ""),
          tarifShift1: Number(r[4]) || 0,
          tarifShift2: Number(r[5]) || 0,
          gajiPokokBulanan: Number(r[6]) || 0,
          keterangan: String(r[7] || ""),
          status: normSt
        };
      }
    }

    let finalRows = [];
    let processedNames = new Set();

    // 1. Sinkronkan dari sheet Data
    for (let i = 1; i < vData.length; i++) {
      let r = vData[i];
      let nama = String(r[idNama] || "").trim();
      if (!nama) continue;
      let nmKey = nama.toLowerCase();
      if (processedNames.has(nmKey)) continue;
      processedNames.add(nmKey);

      let role = r[idRole] ? String(r[idRole]).trim() : "Admin";
      let rawStatus = r[idStatus] ? String(r[idStatus]).trim().toLowerCase() : "aktif";
      let status = (rawStatus === "tidak aktif" || rawStatus === "non aktif" || rawStatus === "nonaktif" || rawStatus === "inactive") ? "Tidak Aktif" : "Aktif";

      if (mapTarif[nmKey]) {
        let curr = mapTarif[nmKey];
        if (!curr.idAturan) {
          maxIdNum++;
          curr.idAturan = "TARIF-" + String(maxIdNum).padStart(3, '0');
        }
        curr.role = role;
        curr.namaPekerja = nama;
        curr.status = status;
        finalRows.push([
          curr.idAturan,
          curr.role,
          curr.namaPekerja,
          curr.tipeKompensasi,
          curr.tarifShift1,
          curr.tarifShift2,
          curr.gajiPokokBulanan,
          curr.keterangan,
          curr.status
        ]);
      } else {
        // Otomatis isi ID_Aturan dan default tarif berdasarkan Role
        maxIdNum++;
        let newIdAturan = "TARIF-" + String(maxIdNum).padStart(3, '0');
        let tipeKompensasi = "Uang Harian Shift";
        let s1 = 45000;
        let s2 = 45000;
        let gp = 0;
        let ket = "";

        let rLower = role.toLowerCase();
        if (rLower.includes("dokter")) {
          tipeKompensasi = "Kombinasi Shift & Tindakan";
          s1 = 55000;
          s2 = 55000;
          gp = 0;
          ket = "2 Shift: Rp 55.000/shift (berdasarkan absensi) + JM Tindakan";
        } else if (rLower.includes("perawat")) {
          tipeKompensasi = "Uang Harian Shift";
          s1 = 45000;
          s2 = 45000;
          gp = 0;
          ket = "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)";
        } else if (rLower.includes("admin") || rLower.includes("kasir")) {
          tipeKompensasi = "Gaji Bulanan Tetap";
          s1 = 0;
          s2 = 0;
          gp = 1200000;
          ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)";
        } else if (rLower.includes("owner")) {
          if (nama.toLowerCase().startsWith("drg")) {
            tipeKompensasi = "Kombinasi Shift & Tindakan";
            s1 = 55000;
            s2 = 55000;
            gp = 0;
            ket = "Owner / Dokter Gigi Spesialis + JM 65%";
          } else {
            tipeKompensasi = "Gaji Bulanan Tetap";
            s1 = 0;
            s2 = 0;
            gp = 0;
            ket = "Owner / Manajemen";
          }
        } else {
          tipeKompensasi = "Uang Harian Shift";
          s1 = 40000;
          s2 = 40000;
          gp = 0;
          ket = "Staff Umum / Operasional";
        }

        finalRows.push([
          newIdAturan,
          role,
          nama,
          tipeKompensasi,
          s1,
          s2,
          gp,
          ket,
          status
        ]);
      }
    }

    // 2. Pekerja yang tidak terdaftar di Sheet Data otomatis ditolak / tidak dimasukkan ke Pengaturan_Tarif_Shift
    // Tulis ulang seluruh sheet Pengaturan_Tarif_Shift secara rapi
    shTarif.clear();
    shTarif.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e2e8f0");
    shTarif.setFrozenRows(1);

    if (finalRows.length > 0) {
      shTarif.getRange(2, 1, finalRows.length, headers.length).setValues(finalRows);
      shTarif.getRange(2, 5, finalRows.length, 3).setNumberFormat("#,##0");
      shTarif.getRange(2, 1, finalRows.length, 1).setHorizontalAlignment("center");
      shTarif.getRange(2, 9, finalRows.length, 1).setHorizontalAlignment("center");
    }

    // Validasi Data Dropdown Status: Aktif / Tidak Aktif
    try {
      const ruleStatus = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Aktif", "Tidak Aktif"], true)
        .setAllowInvalid(false)
        .build();
      shTarif.getRange(2, 9, Math.max(50, finalRows.length + 20), 1).setDataValidation(ruleStatus);
    } catch(eVal) {}

    SpreadsheetApp.flush();
    return {
      success: true,
      count: finalRows.length,
      message: "Berhasil menyinkronkan " + finalRows.length + " pekerja ke Pengaturan_Tarif_Shift."
    };
  } catch (err) {
    Logger.log("Error syncAllUsersToPayrollTarifShift: " + err.message);
    return { success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengubah status pembayaran payroll (Draft / Approved / Paid) di Penggajian_Dokter atau Honor_Perawat_Staff.
 */
function updateStatusPayroll(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const def = SPREADSHEET_DEFINITIONS["PAYROLL"];
    const found = _findOrCreateSpreadsheetInFolder("PAYROLL", def.title);
    const ss = found.ss;

    const targetSheet = payload.kategori === "staff" ? "Honor_Perawat_Staff" : "Penggajian_Dokter";
    const idTarget = String(payload.idPayroll || "").trim();
    const statusBaru = String(payload.statusTransfer || "Paid").trim();
    const tglTransfer = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy");

    let sh = ss.getSheetByName(targetSheet);
    if (!sh) return { success: false, message: "Sheet " + targetSheet + " tidak ditemukan." };

    let data = sh.getDataRange().getValues();
    let colStatus = payload.kategori === "staff" ? 17 : 19; // 1-indexed
    let colTgl = payload.kategori === "staff" ? 18 : 20;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || "").trim() === idTarget) {
        sh.getRange(i + 1, colStatus).setValue(statusBaru);
        if (statusBaru === "Paid") {
          sh.getRange(i + 1, colTgl).setValue(tglTransfer);
        }
        SpreadsheetApp.flush();
        return { success: true, message: "Status Payroll [" + idTarget + "] berhasil diubah menjadi " + statusBaru + "!" };
      }
    }
    return { success: false, message: "ID Payroll tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal update status payroll: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// AGENT NADHIF: BULK DATA IMPORTER DARI "Copy of SHELDON 2026" (ANTIGRAVITY RME)
// =========================================================================

/**
 * Helper: Konversi nilai tanggal (Date object, Excel serial number, atau string) ke format dd-MM-yyyy.
 */
function _normDateSheldon(val, fallbackStr) {
  if (!val && val !== 0) return fallbackStr || "01-01-2026";
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
    return Utilities.formatDate(val, "Asia/Jakarta", "dd-MM-yyyy");
  }
  if (typeof val === "number" && val > 10000 && val < 80000) {
    let utcDays = Math.floor(val - 25569);
    let d = new Date(utcDays * 86400 * 1000);
    return Utilities.formatDate(d, "Asia/Jakarta", "dd-MM-yyyy");
  }
  let s = String(val).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    let p = s.split("-");
    return p[2] + "-" + p[1] + "-" + p[0];
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    let p = s.split("/");
    return String(p[0]).padStart(2, "0") + "-" + String(p[1]).padStart(2, "0") + "-" + p[2];
  }
  return fallbackStr || "01-01-2026";
}

/**
 * Helper: Kategorisasi dan penentuan kode tindakan & ICD otomatis berdasarkan nama tindakan.
 */
function _classifyTindakanSheldon(namaTindakan) {
  let n = String(namaTindakan || "").trim();
  let nl = n.toLowerCase();
  if (nl === "medikasi" || nl.indexOf("obat") !== -1) {
    return { kategori: "Obat", katTindakan: "Umum", icd10: "K04.0", diag: "Pulpitis / Medikasi Oral", icd9: "96.59", proc: "Other dental medication" };
  }
  if (nl.indexOf("rontgen") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Radiologi", icd10: "Z01.2", diag: "Pemeriksaan Radiologi Gigi", icd9: "87.11", proc: "Full dental x-ray" };
  }
  if (nl.indexOf("ortho") !== -1 || nl.indexOf("retainer") !== -1 || nl.indexOf("bracket") !== -1 || nl.indexOf("behel") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Orthodonti", icd10: "K07.3", diag: "Anomali Posisi Gigi (Maloklusi)", icd9: "24.7", proc: "Application of orthodontic appliance" };
  }
  if (nl.indexOf("scalling") !== -1 || nl.indexOf("scaling") !== -1 || nl.indexOf("stain") !== -1 || nl.indexOf("kuretase") !== -1 || nl.indexOf("splinting") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Periodonti", icd10: "K05.0", diag: "Gingivitis & Calculus Dentalis", icd9: "96.54", proc: "Dental scaling and polishing" };
  }
  if (nl.indexOf("exo") !== -1 || nl.indexOf("odontektomi") !== -1 || nl.indexOf("operculektomi") !== -1 || nl.indexOf("alveolektomi") !== -1 || nl.indexOf("insisi") !== -1 || nl.indexOf("hecting") !== -1 || nl.indexOf("aff") !== -1 || nl.indexOf("pencabutan") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Bedah Mulut", icd10: "K01.1", diag: "Impaksi / Ekstraksi Gigi", icd9: "23.19", proc: "Other surgical extraction of tooth" };
  }
  if (nl.indexOf("crown") !== -1 || nl.indexOf("bridge") !== -1 || nl.indexOf("gtl") !== -1 || nl.indexOf("gtsl") !== -1 || nl.indexOf("valplast") !== -1 || nl.indexOf("acrilyc") !== -1 || nl.indexOf("protesa") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Prosthodonti", icd10: "K08.1", diag: "Kehilangan Gigi Akibat Ekstraksi/Karies", icd9: "23.41", proc: "Application of crown / dental prosthesis" };
  }
  if (nl.indexOf("psa") !== -1 || nl.indexOf("endodontik") !== -1 || nl.indexOf("pulpectomi") !== -1 || nl.indexOf("devitalisasi") !== -1 || nl.indexOf("sterilisasi") !== -1 || nl.indexOf("obturasi") !== -1 || nl.indexOf("open bur") !== -1 || nl.indexOf("komposit") !== -1 || nl.indexOf("gic") !== -1 || nl.indexOf("inlay") !== -1 || nl.indexOf("onlay") !== -1 || nl.indexOf("veneer") !== -1 || nl.indexOf("tambal") !== -1 || nl.indexOf("tumpat") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Konservasi Gigi", icd10: "K02.1", diag: "Karies Dentin / Pulpitis", icd9: "23.2", proc: "Restoration of tooth by filling / root canal" };
  }
  if (nl.indexOf("bleaching") !== -1 || nl.indexOf("diamond") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Estetik", icd10: "K03.7", diag: "Perubahan Warna Gigi Posteruptif", icd9: "23.49", proc: "Other dental restoration / cosmetic" };
  }
  if (nl.indexOf("anak") !== -1 || nl.indexOf("fissure") !== -1 || nl.indexOf("fluor") !== -1) {
    return { kategori: "Tindakan", katTindakan: "Pedodonti", icd10: "K02.0", diag: "Karies Email Gigi Anak", icd9: "23.2", proc: "Preventive dental restoration" };
  }
  return { kategori: "Tindakan", katTindakan: "Umum", icd10: "Z01.2", diag: "Pemeriksaan & Konsultasi Gigi", icd9: "89.31", proc: "Dental examination" };
}

/**
 * Mengimpor seluruh data bulk dari file "Copy of SHELDON 2026" di dalam folder Antigravity RME
 * ke dalam 11 Spreadsheet Database RME Sheldon secara tervalidasi dan sesuai skema SPREADSHEET_DEFINITIONS.
 */
function importBulkDataSheldon2026(options) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    options = options || {};
    const maxPasien = Number(options.maxPasien) || 2500;
    const maxPembayaran = Number(options.maxPembayaran) || 2500;
    const maxEmr = Number(options.maxEmr) || 400;

    // 1. Buka Spreadsheet Sumber "Copy of SHELDON 2026" HANYA dari folder Antigravity RME / DB_CONFIG.SOURCE_BULK_2026
    let sourceId = (DB_CONFIG && DB_CONFIG.SOURCE_BULK_2026) ? String(DB_CONFIG.SOURCE_BULK_2026).trim() : "1BaMZosOuB6eu5kV0sIiFMCLNBer1e4X7gibmBoKweV0";
    let ssSource = null;
    try {
      ssSource = SpreadsheetApp.openById(sourceId);
    } catch (eOpen) {
      let folder = _getDatabaseParentFolder();
      if (folder) {
        let fIter = folder.getFilesByName("Copy of SHELDON 2026");
        if (fIter.hasNext()) {
          ssSource = SpreadsheetApp.openById(fIter.next().getId());
        }
      }
    }
    if (!ssSource) {
      return {
        success: false,
        message: "Spreadsheet sumber 'Copy of SHELDON 2026' (ID: " + sourceId + ") tidak ditemukan di folder Antigravity RME."
      };
    }

    let stats = {
      sourceTitle: ssSource.getName(),
      sourceId: ssSource.getId(),
      usersImported: 0,
      tindakanImported: 0,
      pasienImported: 0,
      pembayaranImported: 0,
      invoiceCount: 0,
      jmImported: 0,
      emrGenerated: 0,
      presensiImported: 0
    };

    // 2. BACA SHEET "DATABASE" (Dokter, Perawat, Jasa Medis)
    let shDb = ssSource.getSheetByName("DATABASE");
    let dbRows = shDb ? shDb.getDataRange().getValues() : [];
    let dokterList = [];
    let perawatList = [];
    let dokterJmMap = {};
    for (let i = 1; i < dbRows.length; i++) {
      let dName = String(dbRows[i][0] || "").trim();
      let pName = String(dbRows[i][1] || "").trim();
      let jmVal = dbRows[i][2];
      if (dName) {
        dokterList.push(dName);
        let pctDec = 0.65;
        if (typeof jmVal === "number") {
          pctDec = jmVal > 1 ? (jmVal / 100) : jmVal;
        } else if (jmVal) {
          let parsed = parseFloat(String(jmVal).replace("%", "").trim());
          if (!isNaN(parsed)) pctDec = parsed > 1 ? (parsed / 100) : parsed;
        }
        dokterJmMap[dName.toLowerCase()] = pctDec;
      }
      if (pName) {
        perawatList.push(pName);
      }
    }

    // 3. SINKRONISASI KE 06 MASTER USER & ROLE (Sheet: Data -> 9 kolom)
    // Headers: ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"]
    const foundMaster = _findOrCreateSpreadsheetInFolder("MASTER", SPREADSHEET_DEFINITIONS["MASTER"].title);
    const ssMaster = foundMaster.ss;
    let shUser = ssMaster.getSheetByName("Data");
    if (shUser) {
      let existingUsers = shUser.getDataRange().getValues();
      let existingNames = {};
      for (let i = 1; i < existingUsers.length; i++) {
        existingNames[String(existingUsers[i][0] || "").trim().toLowerCase()] = true;
      }
      let newUserRows = [];
      let userCounter = existingUsers.length;
      dokterList.forEach(d => {
        if (!existingNames[d.toLowerCase()]) {
          let cleanU = d.toLowerCase().replace(/[^a-z0-9]/g, "");
          let pJmDec = dokterJmMap[d.toLowerCase()] || 0.65;
          newUserRows.push([
            d,
            cleanU,
            "Dokter Gigi Umum",
            "1234",
            "Aktif",
            "503/SIP-DRG/" + String(100 + userCounter++) + "/2026",
            "'08123456" + String(1000 + userCounter),
            pJmDec,
            cleanU + "@sheldon.id"
          ]);
          existingNames[d.toLowerCase()] = true;
        }
      });
      perawatList.forEach(p => {
        if (!existingNames[p.toLowerCase()]) {
          let cleanU = p.toLowerCase().replace(/[^a-z0-9]/g, "");
          newUserRows.push([
            p,
            cleanU,
            "Perawat Gigi",
            "3333",
            "Aktif",
            "503/STR-PRW/" + String(200 + userCounter++) + "/2026",
            "'08134567" + String(1000 + userCounter),
            "",
            cleanU + "@sheldon.id"
          ]);
          existingNames[p.toLowerCase()] = true;
        }
      });
      if (newUserRows.length > 0) {
        shUser.getRange(shUser.getLastRow() + 1, 1, newUserRows.length, 9).setValues(newUserRows);
      }
      stats.usersImported = dokterList.length + perawatList.length;
    }

    // 4. BACA SHEET "PEMBAYARAN" & "DB_TINDAKAN" UNTUK HARGA REFERENSI & KATALOG TINDAKAN (05 Database Tindakan)
    // Sheet Tindakan Headers (6 kolom): ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"]
    let shBayarSrc = ssSource.getSheetByName("PEMBAYARAN");
    let bayarSrcRows = shBayarSrc ? shBayarSrc.getDataRange().getValues() : [];
    let hargaRefMap = {};
    let labRefMap = {};
    for (let i = 2; i < bayarSrcRows.length; i++) {
      let r = bayarSrcRows[i];
      let tName = String(r[4] || "").trim();
      let hrg = Number(r[5]) || 0;
      let lb = Number(r[8]) || 0;
      if (tName && hrg > 0 && !hargaRefMap[tName.toLowerCase()]) {
        hargaRefMap[tName.toLowerCase()] = hrg;
        labRefMap[tName.toLowerCase()] = (tName.toLowerCase() === "medikasi") ? 0 : lb;
      }
    }

    let shTindSrc = ssSource.getSheetByName("DB_TINDAKAN");
    let tindSrcRows = shTindSrc ? shTindSrc.getDataRange().getValues() : [];
    const foundTind = _findOrCreateSpreadsheetInFolder("DATABASE", SPREADSHEET_DEFINITIONS["DATABASE"].title);
    const ssTind = foundTind.ss;
    let shTind = ssTind.getSheetByName("Tindakan");
    let tindakanCodeMap = {};
    if (shTind && tindSrcRows.length > 1) {
      let newTindRows = [];
      for (let i = 1; i < tindSrcRows.length; i++) {
        let noUrut = Number(tindSrcRows[i][0]) || i;
        let namaT = String(tindSrcRows[i][1] || "").trim();
        if (!namaT) continue;
        let cls = _classifyTindakanSheldon(namaT);
        let isRontgen = namaT.toLowerCase().indexOf("rontgen") !== -1;
        let isSpec = (cls.katTindakan === "Orthodonti" || cls.katTindakan === "Bedah Mulut" || cls.katTindakan === "Prosthodonti");
        let katDb = isRontgen ? "Umum" : (isSpec ? "Dokter Gigi Spesialis" : "Dokter Gigi Umum");
        let prefixKode = isRontgen ? "UMM-" : (isSpec ? "DGS-" : "DGU-");
        let kodeT = prefixKode + String(noUrut).padStart(4, "0");
        let hrgDefault = hargaRefMap[namaT.toLowerCase()] || (cls.katTindakan === "Orthodonti" ? 2500000 : (cls.katTindakan === "Bedah Mulut" ? 500000 : (cls.katTindakan === "Prosthodonti" ? 1500000 : 250000)));
        let labDefault = labRefMap[namaT.toLowerCase()] || 0;
        let perluLab = labDefault > 0 ? "Ya" : "Tidak";
        let jmDef = isRontgen ? 0.15 : "";
        newTindRows.push([kodeT, namaT, katDb, hrgDefault, perluLab, jmDef]);
        tindakanCodeMap[namaT.toLowerCase()] = { kode: kodeT, harga: hrgDefault, lab: labDefault, kategori: cls.kategori, cls: cls };
      }
      if (newTindRows.length > 0) {
        if (shTind.getLastRow() > 1) {
          shTind.getRange(2, 1, shTind.getLastRow() - 1, 6).clearContent();
        }
        shTind.getRange(2, 1, newTindRows.length, 6).setValues(newTindRows);
        stats.tindakanImported = newTindRows.length;
      }
    }

    // 5. BACA & IMPOR SHEET "PASIEN" KE 01 PASIEN (Data_Pasien -> 21 kolom)
    // Headers: ["ID_Pasien", "Nama_Pasien", "No_RM", "Jenis_Kelamin", "Tempat_Lahir", "Tanggal_Lahir", "Umur", "Agama", "Golongan_Darah", "Pekerjaan", "NIK", "Alamat", "Provinsi", "Kabupaten", "Kecamatan", "Kelurahan", "WhatsApp", "Alergi", "Riwayat_Penyakit", "Catatan", "Tanggal_Daftar"]
    let shPasienSrc = ssSource.getSheetByName("PASIEN");
    let pasienSrcRows = shPasienSrc ? shPasienSrc.getDataRange().getValues() : [];
    const foundPasien = _findOrCreateSpreadsheetInFolder("PASIEN", SPREADSHEET_DEFINITIONS["PASIEN"].title);
    const ssPasien = foundPasien.ss;
    let shPasien = ssPasien.getSheetByName("Data_Pasien");
    let pasienRowsOut = [];
    let rmToPasienMap = {};

    for (let i = 2; i < pasienSrcRows.length && pasienRowsOut.length < maxPasien; i++) {
      let r = pasienSrcRows[i];
      let nama = String(r[1] || "").trim();
      let noRm = String(r[2] || "").trim();
      if (!nama && !noRm) continue;
      if (!noRm) noRm = (nama.charAt(0).toUpperCase() || "P") + "-" + String(pasienRowsOut.length + 1).padStart(4, "0");

      let rawJk = String(r[3] || "").trim().toLowerCase();
      let jk = (rawJk.indexOf("perempuan") !== -1 || rawJk === "p" || rawJk === "wanita") ? "Perempuan" : "Laki-Laki";
      let tglDaftar = _normDateSheldon(r[4], "02-01-2026");
      let tglLahir = _normDateSheldon(r[5], "15-05-1995");

      let idPasien = "P-" + String(pasienRowsOut.length + 1).padStart(4, "0");
      let thnLahir = parseInt(tglLahir.split("-")[2], 10) || 1995;
      let umurCalc = String(Math.max(1, 2026 - thnLahir));

      let rawNik = String(r[7] || "").replace(/[^0-9]/g, "");
      let nik = rawNik.length >= 10 ? ("'" + rawNik) : ("'137601" + String(1000000000 + pasienRowsOut.length + 1));

      let rawGol = String(r[8] || "O").trim().toUpperCase();
      let golDarah = (["A", "B", "AB", "O"].indexOf(rawGol) !== -1) ? rawGol : "O";

      let pekerjaan = String(r[9] || "Karyawan Swasta").trim() || "Karyawan Swasta";
      let rawTelp = String(r[10] || "").replace(/[^0-9+]/g, "");
      if (rawTelp && rawTelp.charAt(0) === "8") rawTelp = "0" + rawTelp;
      let noTelp = rawTelp ? ("'" + rawTelp) : "'081200000000";

      let alamat = String(r[11] || "Jl. Sudirman, Payakumbuh").trim() || "Jl. Sudirman, Payakumbuh";
      let catatan = String(r[12] || "Pasien SHELDON 2026").trim() || "Pasien SHELDON 2026";

      pasienRowsOut.push([
        idPasien,
        nama,
        noRm,
        jk,
        "Payakumbuh",
        tglLahir,
        umurCalc,
        "Islam",
        golDarah,
        pekerjaan,
        nik,
        alamat,
        "Sumatera Barat",
        "Kota Payakumbuh",
        "Payakumbuh Barat",
        "Daya Bangun",
        noTelp,
        "Tidak Ada",
        "Tidak Ada",
        catatan,
        tglDaftar
      ]);
      rmToPasienMap[noRm.toUpperCase()] = { idPasien: idPasien, nama: nama, noRm: noRm, jk: jk, tglLahir: tglLahir, alergi: "Tidak Ada" };
    }

    if (shPasien && pasienRowsOut.length > 0) {
      if (shPasien.getLastRow() > 1) {
        shPasien.getRange(2, 1, shPasien.getLastRow() - 1, 21).clearContent();
      }
      shPasien.getRange(2, 1, pasienRowsOut.length, 21).setValues(pasienRowsOut);
      stats.pasienImported = pasienRowsOut.length;
    }

    // 6. BACA & IMPOR SHEET "PEMBAYARAN" KE 02 PEMBAYARAN (Data_Pembayaran -> 20 kolom & Rekap_Jasa_Medis -> 18 kolom)
    // Data_Pembayaran Headers: ["ID_Invoice", "Tanggal_Tindakan", "ID_Pasien", "No_RM", "Nama_Pasien", "Dokter_Pemeriksa", "Kategori_Item", "Nama_Item", "Harga_Satuan", "Qty", "Labor", "Diskon_Persen", "Grand_Total_Item", "Perawat", "Total_Invoice", "Metode_Bayar", "Status_Pembayaran", "Keterangan", "Kasir_Bertugas", "Waktu_Sistem"]
    // Rekap_Jasa_Medis Headers: ["ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item", "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan", "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat", "Bagian_Klinik", "Status_JM", "Waktu_Hitung"]
    let invoiceGroups = {};
    let invoiceOrder = [];
    let rawBayarItems = [];

    for (let i = 2; i < bayarSrcRows.length && rawBayarItems.length < maxPembayaran; i++) {
      let r = bayarSrcRows[i];
      let namaP = String(r[2] || "").trim();
      let noRm = String(r[3] || "").trim();
      let namaTind = String(r[4] || "").trim();
      if (!namaP && !namaTind) continue;

      let tgl = _normDateSheldon(r[1], "02-01-2026");
      let hargaBruto = Number(r[5]) || 0;
      let discNominal = Number(r[6]) || 0;
      let totalRow = Number(r[7]);
      if (isNaN(totalRow) || totalRow === 0) totalRow = Math.max(0, hargaBruto - discNominal);

      let rawLab = Number(r[8]) || 0;
      let dokter = String(r[9] || "drg. Danny").trim() || "drg. Danny";
      let perawat = String(r[10] || "Wulan").trim() || "Wulan";
      let caraCode = String(r[12] || "C").trim().toUpperCase();
      let caraBayar = "Tunai";
      if (caraCode === "T" || caraCode.indexOf("TRANSFER") !== -1) caraBayar = "Transfer Bank";
      else if (caraCode === "Q" || caraCode.indexOf("QRIS") !== -1) caraBayar = "QRIS";
      else if (caraCode === "D" || caraCode.indexOf("DEBIT") !== -1 || caraCode.indexOf("KREDIT") !== -1) caraBayar = "Kartu Debit/Kredit";

      let note = String(r[13] || "").trim();
      let clsInfo = _classifyTindakanSheldon(namaTind);
      let isMedikasi = (clsInfo.kategori === "Obat");
      let laborClean = isMedikasi ? 0 : rawLab;

      let pInfo = rmToPasienMap[(noRm || "").toUpperCase()];
      let idPasien = pInfo ? pInfo.idPasien : "P-0001";

      let groupKey = tgl + "|" + (noRm || namaP).toUpperCase() + "|" + dokter.toUpperCase();
      if (!invoiceGroups[groupKey]) {
        let dp = tgl.split("-");
        let mmyy = (dp.length === 3) ? (dp[1] + dp[2].slice(-2)) : "0126";
        let invNo = "INV/SHELDON/" + String(invoiceOrder.length + 1).padStart(4, "0") + "/" + mmyy;
        invoiceGroups[groupKey] = {
          idInvoice: invNo,
          tgl: tgl,
          idPasien: idPasien,
          noRm: noRm || "-",
          namaP: namaP || "Pasien Umum",
          dokter: dokter,
          perawat: perawat,
          caraBayar: caraBayar,
          totalInvoice: 0,
          items: []
        };
        invoiceOrder.push(groupKey);
      }

      let grp = invoiceGroups[groupKey];
      grp.totalInvoice += totalRow;
      let discPersen = (hargaBruto > 0 && discNominal > 0) ? Math.round((discNominal / hargaBruto) * 100) : 0;

      let itemObj = {
        grp: grp,
        tgl: tgl,
        idPasien: idPasien,
        noRm: noRm || "-",
        namaP: namaP || "Pasien Umum",
        dokter: dokter,
        perawat: perawat,
        kategoriItem: clsInfo.kategori,
        namaItem: namaTind,
        qty: 1,
        hargaSatuan: hargaBruto,
        diskonPersen: discPersen,
        diskonNominal: discNominal,
        labor: laborClean,
        grandTotal: totalRow,
        caraBayar: caraBayar,
        note: note,
        clsInfo: clsInfo
      };
      grp.items.push(itemObj);
      rawBayarItems.push(itemObj);
    }

    const foundBayar = _findOrCreateSpreadsheetInFolder("PEMBAYARAN", SPREADSHEET_DEFINITIONS["PEMBAYARAN"].title);
    const ssBayar = foundBayar.ss;
    let shDataBayar = ssBayar.getSheetByName("Data_Pembayaran");
    let shRekapJM = ssBayar.getSheetByName("Rekap_Jasa_Medis");

    let bayarRowsOut = [];
    let jmRowsOut = [];

    for (let i = 0; i < rawBayarItems.length; i++) {
      let it = rawBayarItems[i];
      bayarRowsOut.push([
        it.grp.idInvoice,
        it.tgl,
        it.idPasien,
        it.noRm,
        it.namaP,
        it.dokter,
        it.kategoriItem,
        it.namaItem,
        it.hargaSatuan,
        it.qty,
        it.labor,
        it.diskonPersen,
        it.grandTotal,
        it.perawat,
        it.grp.totalInvoice,
        it.caraBayar,
        "Lunas",
        it.note || "Transaksi SHELDON 2026",
        it.perawat,
        it.tgl + " 16:00:00"
      ]);

      // Baris Rekap_Jasa_Medis (18 kolom)
      // ["ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item", "Nama_Item", "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM", "Tipe_Aturan", "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat", "Bagian_Klinik", "Status_JM", "Waktu_Hitung"]
      let nl = it.namaItem.toLowerCase();
      let isRontgen = nl.indexOf("rontgen") !== -1;
      let isScalingPrw = nl.indexOf("scalling perawat") !== -1 || nl.indexOf("scaling perawat") !== -1;
      let isNonJM = (it.kategoriItem === "Obat" || it.kategoriItem === "BMHP");

      let dPctDec = dokterJmMap[it.dokter.toLowerCase()] || 0.65;
      let persenDec = isNonJM ? 0 : (isRontgen ? 0.15 : dPctDec);
      let tipeAturan = isNonJM ? "Non-JM (Obat/BMHP)" : (isRontgen ? "Tarif Rontgen (15%)" : ("Persentase Dokter (" + Math.round(persenDec * 100) + "%)"));

      let dasarBagi = Math.max(0, it.grandTotal - it.labor);
      let jmDokKotor = Math.round(dasarBagi * persenDec);
      let potPerawat = isScalingPrw ? 25000 : 0;
      let jmDokBersih = Math.max(0, jmDokKotor - potPerawat);
      let jmPerawat = potPerawat;
      let bagianKlinik = Math.max(0, dasarBagi - jmDokBersih - jmPerawat);

      jmRowsOut.push([
        it.grp.idInvoice,
        it.tgl,
        it.dokter,
        it.perawat,
        it.kategoriItem,
        it.namaItem,
        it.grandTotal,
        it.labor,
        dasarBagi,
        persenDec,
        tipeAturan,
        jmDokKotor,
        potPerawat,
        jmDokBersih,
        jmPerawat,
        bagianKlinik,
        "Final",
        it.tgl + " 16:00:00"
      ]);
    }

    if (shDataBayar && bayarRowsOut.length > 0) {
      if (shDataBayar.getLastRow() > 1) {
        shDataBayar.getRange(2, 1, shDataBayar.getLastRow() - 1, 20).clearContent();
      }
      shDataBayar.getRange(2, 1, bayarRowsOut.length, 20).setValues(bayarRowsOut);
      stats.pembayaranImported = bayarRowsOut.length;
      stats.invoiceCount = invoiceOrder.length;
    }

    if (shRekapJM && jmRowsOut.length > 0) {
      if (shRekapJM.getLastRow() > 1) {
        shRekapJM.getRange(2, 1, shRekapJM.getLastRow() - 1, 18).clearContent();
      }
      shRekapJM.getRange(2, 1, jmRowsOut.length, 18).setValues(jmRowsOut);
      stats.jmImported = jmRowsOut.length;
    }

    // 7. GENERATE REKAM MEDIS (Data_Rekam_Medis -> 13 kolom)
    // Headers: ["ID_RM_Klinis", "ID_Pasien", "No_RM", "Nama_Pasien", "Tanggal_Pemeriksaan", "Dokter_Pemeriksa", "Anamnesis_JSON", "Fisik_JSON", "Odontogram_JSON", "Tindakan_JSON", "Resep_Obat_JSON", "Catatan_Edukasi", "Waktu_Simpan"]
    const foundRM = _findOrCreateSpreadsheetInFolder("REKAM_MEDIS", SPREADSHEET_DEFINITIONS["REKAM_MEDIS"].title);
    const ssRM = foundRM.ss;
    let shRM = ssRM.getSheetByName("Data_Rekam_Medis");
    let rmRowsOut = [];

    for (let gIdx = 0; gIdx < invoiceOrder.length && rmRowsOut.length < maxEmr; gIdx++) {
      let grp = invoiceGroups[invoiceOrder[gIdx]];
      let firstTind = grp.items[0];
      for (let k = 0; k < grp.items.length; k++) {
        if (grp.items[k].kategoriItem === "Tindakan") {
          firstTind = grp.items[k];
          break;
        }
      }
      let cls = firstTind.clsInfo;
      let allTindArr = grp.items.filter(x => x.kategoriItem === "Tindakan").map(x => cls.icd9 + " - " + x.namaItem);
      if (allTindArr.length === 0) allTindArr = [cls.icd9 + " - " + firstTind.namaItem];
      let allObatArr = grp.items.filter(x => x.kategoriItem === "Obat").map(x => ({ obat: x.namaItem, qty: 1, ket: "Sesuai resep" }));
      if (allObatArr.length === 0) allObatArr = [{ obat: "Asam Mefenamat 500 mg", qty: 10, ket: "3x1 sesudah makan" }];

      let idKlinis = "EMR-2026-" + String(gIdx + 1).padStart(4, "0");
      let anamnesisJson = JSON.stringify({
        cc: "Pasien datang untuk perawatan: " + grp.items.map(x => x.namaItem).join(", "),
        diagnosaICD: [cls.icd10 + " - " + cls.diag],
        alergi: "Tidak Ada"
      });
      let fisikJson = JSON.stringify({
        kesan: "Baik, Compos Mentis",
        td: "120/80",
        nadi: "80",
        suhu: "36.5",
        rr: "18"
      });
      let odontoJson = JSON.stringify({
        "36": { generalCondition: "car", surfaces: { occlusal: "car" }, note: firstTind.namaItem }
      });

      rmRowsOut.push([
        idKlinis,
        grp.idPasien,
        grp.noRm,
        grp.namaP,
        grp.tgl,
        grp.dokter,
        anamnesisJson,
        fisikJson,
        odontoJson,
        JSON.stringify(allTindArr),
        JSON.stringify(allObatArr),
        firstTind.note || "Kontrol berkala 6 bulan sekali / bila keluhan berlanjut",
        grp.tgl + " 16:00:00"
      ]);
    }

    if (shRM && rmRowsOut.length > 0) {
      if (shRM.getLastRow() > 1) {
        shRM.getRange(2, 1, shRM.getLastRow() - 1, 13).clearContent();
      }
      shRM.getRange(2, 1, rmRowsOut.length, 13).setValues(rmRowsOut);
      stats.emrGenerated = rmRowsOut.length;
    }

    // 8. BACA SHEET "ABSEN" & SINKRONISASI KE 11 PAYROLL & HONOR DOKTER
    const foundPayroll = _findOrCreateSpreadsheetInFolder("PAYROLL", SPREADSHEET_DEFINITIONS["PAYROLL"].title);
    const ssPayroll = foundPayroll.ss;
    let shPresensi = ssPayroll.getSheetByName("Presensi_Shift_Harian");
    let shAbsenSrc = ssSource.getSheetByName("ABSEN");
    if (shPresensi && shAbsenSrc) {
      let absenData = shAbsenSrc.getDataRange().getValues();
      let presensiOut = [];
      let attCounter = 1;
      for (let rIdx = 2; rIdx < Math.min(absenData.length, 60); rIdx++) {
        let rowA = absenData[rIdx];
        let labelShift = String(rowA[0] || "").trim().toUpperCase();
        if (labelShift !== "SHIFT 1" && labelShift !== "SHIFT 2") continue;
        let shiftNorm = (labelShift === "SHIFT 1") ? "Shift 1" : "Shift 2";
        for (let c = 1; c <= 31 && c < rowA.length; c++) {
          let valH = String(rowA[c] || "").trim().toUpperCase();
          if (valH === "H" && presensiOut.length < 300) {
            let dayStr = String(c).padStart(2, "0");
            let tglAbsen = dayStr + "-01-2026";
            let pekerjaName = dokterList[(rIdx + c) % Math.max(1, dokterList.length)] || "drg. Danny";
            let isPrw = (rIdx >= 9);
            if (isPrw && perawatList.length > 0) {
              pekerjaName = perawatList[(rIdx + c) % perawatList.length];
            }
            let roleP = isPrw ? "Perawat Gigi" : "Dokter Gigi Umum";
            let idPekerja = isPrw ? ("PRW-00" + ((c % 2) + 1)) : ("DOK-00" + ((c % 6) + 1));
            let pRowIdx = presensiOut.length + 2;
            let defTarif = isPrw ? 45000 : 55000;
            let fUangShift = defTarif;
            presensiOut.push([
              "ATT-202601" + dayStr + "-" + String(attCounter++).padStart(3, "0"),
              tglAbsen,
              idPekerja,
              pekerjaName,
              roleP,
              shiftNorm,
              shiftNorm === "Shift 1" ? "09:00" : "15:00",
              shiftNorm === "Shift 1" ? "15:00" : "21:00",
              "Hadir",
              fUangShift,
              "Admin",
              tglAbsen + " 21:00:00"
            ]);
          }
        }
      }
      if (presensiOut.length > 0) {
        if (shPresensi.getLastRow() > 1) {
          shPresensi.getRange(2, 1, shPresensi.getLastRow() - 1, 12).clearContent();
        }
        shPresensi.getRange(2, 1, presensiOut.length, 12).setValues(presensiOut);
        stats.presensiImported = presensiOut.length;
      }
    }

    // 9. CATAT KE LOG AKTIVITAS (07 LOG & REFERENSI -> 4 kolom: ["Waktu_Aktivitas", "Nama_Account", "Aksi", "Detail"])
    try {
      const foundLog = _findOrCreateSpreadsheetInFolder("LOG", SPREADSHEET_DEFINITIONS["LOG"].title);
      let shLog = foundLog.ss.getSheetByName("Log_Aktivitas");
      if (shLog) {
        let nowStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");
        shLog.appendRow([
          nowStr,
          "Agent Nadhif (Super User)",
          "IMPORT_BULK_SHELDON_2026",
          "Impor Bulk Data dari Copy of SHELDON 2026 (" + stats.pasienImported + " Pasien, " + stats.pembayaranImported + " Transaksi, " + stats.tindakanImported + " Tindakan, " + stats.emrGenerated + " EMR)"
        ]);
      }
    } catch (eLog) {}

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "✅ Agent Nadhif: Import Bulk Data dari 'Copy of SHELDON 2026' (Folder Antigravity RME) berhasil disinkronkan ke seluruh 11 Spreadsheet Database!",
      stats: stats
    };
  } catch (err) {
    return {
      success: false,
      message: "Gagal menjalankan importBulkDataSheldon2026: " + err.message
    };
  } finally {
    lock.releaseLock();
  }
}



