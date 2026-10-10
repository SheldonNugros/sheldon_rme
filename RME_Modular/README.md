# Documentation & Deployment Guide - RME Klinik Sheldon Enterprise v3.0

Sistem Rekam Medis Elektronik (RME) Klinik Sheldon berbasis **Google Apps Script** dan **Google Sheets** sebagai database terdistribusi. Proyek ini telah dirancang ulang secara **modular**, aman, dan memiliki tata kelola peranan (RBAC) serta otomatisasi formula spreadsheet.

---

## 📁 Struktur Direktori Proyek Modular

```
RME_Modular/
├── README.md                      # Dokumentasi & Panduan Lengkap
├── csv_spreadsheets/              # File CSV Terpisah per Spreadsheet & Sheet
│   ├── 01_PASIEN/
│   │   ├── Data_Pasien.csv
│   │   └── Statistik_Pasien.csv
│   ├── 02_PEMBAYARAN/
│   │   ├── Data_Pembayaran.csv
│   │   ├── Rekap_Invoice.csv
│   │   ├── Rekap_Harian.csv
│   │   ├── Rekap_Metode_Dokter.csv
│   │   └── Rekap_Item.csv
│   ├── 03_REKAM_MEDIS/
│   │   ├── Data_Rekam_Medis.csv
│   │   └── Rekap_Kunjungan.csv
│   ├── 04_SURAT/
│   │   ├── Surat_Sakit.csv
│   │   ├── Surat_Kontrol.csv
│   │   ├── Resume_Medis.csv
│   │   ├── Surat_Rujukan.csv
│   │   ├── Surat_Lab.csv
│   │   ├── Surat_Radiologi.csv
│   │   └── Rekap_Surat.csv
│   ├── 05_DATABASE/
│   │   ├── Kategori.csv
│   │   ├── Tindakan.csv
│   │   └── Rekap_Tindakan.csv
│   ├── 06_MASTER/
│   │   ├── Data.csv
│   │   ├── Matriks_Role.csv
│   │   └── Rekap_Staff.csv
│   ├── 07_LOG/
│   │   ├── Log_Aktivitas.csv
│   │   ├── pekerjaan.csv
│   │   └── Rekap_Log.csv
│   ├── 08_OBAT/
│   │   ├── Master_Obat.csv
│   │   ├── Riwayat_Pembelian.csv
│   │   └── Rekap_Stok.csv
│   ├── 09_BMHP/
│   │   ├── Master_BMHP.csv
│   │   ├── Riwayat_Pembelian.csv
│   │   └── Rekap_Stok.csv
│   └── 10_ICD10/
│       └── ICD_10.csv
├── src/
│   ├── backend/                   # Script Google Apps Script (.gs)
│   │   ├── 00_Config.gs           # ID Spreadsheet & Role Rules Matrix
│   │   ├── 01_Utils.gs            # Helper: doGet, include, readFast, catatLog, getColIdx, Date & Currency
│   │   ├── 02_Auth.gs             # verifyLogin & Session verification
│   │   ├── 03_Pasien.gs           # Registration & Anti-Recycle ID (PS-MMYY-XXXX / No RM)
│   │   ├── 04_RekamMedis.gs       # EMR, Odontogram Grid, & ICD-10 Loader
│   │   ├── 05_KasirPembayaran.gs  # Billing, Invoice Generation, & Potong Stok Gudang
│   │   ├── 06_InventoryGudang.gs  # Gudang Obat & BMHP, Margin, & Restock Purchase
│   │   ├── 07_MasterDatabase.gs   # Master Tindakan, Kategori, Dokter SIP, & Staff
│   │   ├── 08_Surat.gs            # Generator Surat Sakit (SKS), Kontrol (SKP), Resume (RMP), Rujukan, Lab, Rad
│   │   ├── 09_AIInsights.gs       # Analytics Engine: Disease Trends, Peak Days, Stock Alert & Recommendations
│   │   └── 10_SetupSpreadsheets.gs# Script Otomatis Pembuat 10 Spreadsheet di Google Drive
│   └── frontend/                  # Tampilan & Komponen Web UI (.html)
│       ├── Index.html             # Shell Layout Utama, Navigation & Sidebar
│       ├── LoginView.html          # Form Login & Authentication UI
│       ├── PasienView.html        # Form Input Pasien & Tabel Pasien
│       ├── PasienJS.html          # Logic Javascript Pasien & Datar Pekerjaan
│       ├── RekamMedisView.html    # Layout EMR, Odontogram Grid 32/20 Gigi
│       ├── RekamMedisJS.html      # Logic Odontogram, Surface State & EMR Payload
│       ├── PembayaranView.html    # Form Billing Kasir & Kwitansi Invoice A4
│       ├── PembayaranJS.html      # Logic Hitung Kasir, Diskon, & Print/PDF Engine
│       ├── RiwayatInvoiceView.html# Tabel History Invoice & Filter Tanggal
│       ├── InvoiceJS.html         # Data Loader Riwayat Invoice
│       ├── InventoryView.html     # Dashboard Gudang & Form Restock
│       ├── InventoryJS.html       # Logic Stock Badge, Kritis Alert & Restock
│       ├── DatabaseView.html      # Master Data Tindakan UI
│       ├── DatabaseJS.html        # Auto Kode Generator (KODE-000X) & Title Case
│       ├── SuratView.html         # Tab Multi-Surat Klinis UI
│       ├── SuratJS.html           # Format Nomor Surat (SKS/SHELDON/001/X-2026)
│       ├── AIView.html            # Dashboard Analytics & Bar Charts UI
│       └── AIInsightsJS.html      # Data Fetcher AI Analytics & Cards
└── tools/
    └── schema.json                # Single Source of Truth Definisi Schema & Formats
```

---

## 🔐 Matriks Hak Akses / Role Management Engine

Sistem mengelompokkan pengguna berdasarkan `Kategori_Role` yang tercatat di **Master Data (Sheet Data)**:

| Grup Role | Role yang Cocok | Akses Modul / Menu | Hak Akses Khusus |
| :--- | :--- | :--- | :--- |
| **SUPER USER** | `Super User`, `Owner` | **Semua Modul** (Dashboard Finansial, AI Insights, Pasien, Rekam Medis, Surat, Database Master, Gudang, Kasir, Riwayat Invoice) | Full Admin Access & Finansial Overview |
| **DOKTER** | `Dokter Gigi Umum`, `Dokter Gigi Spesialis`, `Dokter` | Database Pasien, Rekam Medis & Odontogram, Form & Surat | Menulis EMR, Mengisi Odontogram, Menerbitkan Surat Medis |
| **ADMIN & KASIR** | `Admin`, `Perawat Umum`, `Kasir`, `Staff` | Database Pasien, Form & Surat, Database Master, Gudang & Restock, Kasir & Billing, Riwayat Invoice | Mendaftarkan Pasien, Menerima Pembayaran, Restock Gudang |
| **DEFAULT** | Role lainnya | Database Pasien | View Only / Basic Access |

---

## 📐 Formula & Aturan Perhitungan Spreadsheet

### 1. Auto-Increase Nomor RM & ID Pasien (Anti-Recycle)
* **ID Pasien Format**: `PS-MMYY-XXXX` (Tahun, bulan & nomor urut 4 digit).
* **No RM Format**: `[Inisial Nama]-[0000]` (Contoh: `A-0001` untuk Ani).
* **Nomor Terakhir**: Menggunakan `PropertiesService.getScriptProperties()` internal sehingga saat data baris dihapus, nomor urut **tidak pernah didaur ulang**.

### 2. Formulasi Stok & Margin Gudang (Obat & BMHP)
* **Status Stok**:
  ```excel
  =IF(B2:B="","",IF((I2:I<>"")*(I2:I<TODAY()),"KADALUARSA",IF(F2:F<=0,"HABIS",IF(F2:F<=G2:G,"KRITIS","AMAN"))))
  ```
* **Margin (%)**:
  ```excel
  =IF(B2:B="","",IFERROR(ROUND((Harga_Jual - HPP) / HPP * 100, 1), 0))
  ```
* **Nilai Persediaan**:
  ```excel
  =F2:F * D2:D  (Stok Tersedia * HPP)
  ```

### 3. Formulasi Umur Pasien Real-Time
* **Umur (Tahun)**:
  ```excel
  =IFERROR(DATEDIF(Tanggal_Lahir, TODAY(), "Y") & " Tahun", "-")
  ```

### 4. Formulasi Rekap Invoice & Harian
* **Query Rekap Harian**:
  ```excel
  =QUERY(Rekap_Invoice!A1:J, "select B, count(A), sum(E) where A is not null group by B order by B desc label count(A) 'Jumlah_Invoice', sum(E) 'Total_Pendapatan'", 1)
  ```

---

## 🚀 Panduan Setup & Deploy ke Google Apps Script

### Langkah 1: Buat 10 Spreadsheet Otomatis
1. Buka [Google Drive](https://drive.google.com).
2. Buat **Google Apps Script** baru (*New -> More -> Google Apps Script*).
3. Salin isi file `src/backend/10_SetupSpreadsheets.gs` ke Apps Script Editor.
4. Pilih fungsi `setupAllSpreadsheets` lalu klik **Run** (Jalankan).
5. Pada log konsol Apps Script, salin objek `DB_CONFIG` baru yang dihasilkan.

### Langkah 2: Salin Kode Backend & Frontend
1. Tempel objek `DB_CONFIG` baru ke file `src/backend/00_Config.gs`.
2. Buat file `.gs` di Apps Script Editor sesuai struktur di `src/backend/` (`01_Utils.gs`, `02_Auth.gs`, dst).
3. Buat file `.html` di Apps Script Editor sesuai struktur di `src/frontend/` (`Index.html`, `LoginView.html`, `PasienView.html`, dst).

### Langkah 3: Deploy sebagai Web App
1. Klik tombol **Deploy** di kanan atas editor -> **New Deployment**.
2. Pilih jenis: **Web app**.
3. Set **Execute as**: `Me` (Akun Google Anda).
4. Set **Who has access**: `Anyone` atau `Anyone with Google account`.
5. Klik **Deploy** dan buka URL Web App RME Klinik Sheldon Enterprise!
