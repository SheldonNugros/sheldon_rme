#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agent Nadhif - Generator & Validator Bulk Data RME Sheldon 2026
Hanya membaca dan menulis di dalam folder workspace Antigravity RME.
Memastikan seluruh 11 Spreadsheet CSV di RME_Modular/csv_spreadsheets/
terisi data bulk yang akurat, tervalidasi, dan sesuai skema SPREADSHEET_DEFINITIONS.
"""

import os
import csv
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(BASE_DIR, "csv_spreadsheets")

def write_csv(subfolder, filename, headers, rows):
    folder = os.path.join(CSV_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        if headers:
            writer.writerow(headers)
        for r in rows:
            writer.writerow(r)
    return len(rows)

def main():
    print("=== AGENT NADHIF: MEMPOPULASI BULK DATA KE CSV_SPREADSHEETS (ANTIGRAVITY RME) ===")

    # -------------------------------------------------------------------------
    # 1. 06 MASTER USER & ROLE (MASTER/Data.csv)
    # Headers: ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"]
    # -------------------------------------------------------------------------
    master_headers = ["Nama_Pekerja", "Username", "Kategori_Role", "Password", "Status", "No_Registrasi", "No_HP", "Persen_JM_Dokter", "Email"]
    master_rows = [
        ["Administrator Sistem", "admin", "Super User", "admin123", "Aktif", "-", "081234567890", "0", "vembrian@gmail.com"],
        ["drg. V. Asung Nugroho, Sp.Ort", "asung", "Owner", "admin123", "Aktif", "503/SIP-DRG/000/2026", "081234567800", "0.65", "v.asungnugroho@gmail.com"],
        ["drg. Sheldon Cooper, Sp.Ort", "sheldon", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/001/2026", "081234567801", "0.50", "sheldon@sheldon.id"],
        ["drg. Leonard Hofstadter", "leonard", "Dokter Gigi Umum", "1111", "Aktif", "503/SIP-DRG/002/2026", "081234567802", "0.40", "leonard@sheldon.id"],
        ["drg. Rahma Yulinda D, Sp. BMM", "rahma", "Dokter Gigi Spesialis", "1234", "Aktif", "503/SIP-DRG/003/2026", "081234567803", "0.65", "rahma@sheldon.id"],
        ["drg. Regyana Oktavaria", "regyana", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/004/2026", "081234567804", "0.40", "regyana@sheldon.id"],
        ["drg. Latifah Mulyana", "latifah", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/005/2026", "081234567805", "0.40", "latifah@sheldon.id"],
        ["drg. Tia Ardhana R", "tia", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/006/2026", "081234567806", "0.50", "tia@sheldon.id"],
        ["drg. Danny", "danny", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/007/2026", "081234567807", "0.65", "danny@sheldon.id"],
        ["drg. Astri", "astri", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/008/2026", "081234567808", "0.65", "astri@sheldon.id"],
        ["drg. Rizka", "rizka", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/009/2026", "081234567809", "0.65", "rizka@sheldon.id"],
        ["drg. Nanda", "nanda", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/010/2026", "081234567810", "0.65", "nanda@sheldon.id"],
        ["drg. Aviva", "aviva", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/011/2026", "081234567811", "0.65", "aviva@sheldon.id"],
        ["drg. Erien", "erien", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/012/2026", "081234567812", "0.50", "erien@sheldon.id"],
        ["drg.g.p Dinda", "dinda", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/013/2026", "081234567813", "0.55", "dinda@sheldon.id"],
        ["drg.g.p Fathya", "fathya", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/014/2026", "081234567814", "0.40", "fathya@sheldon.id"],
        ["drg.g.p Belinda", "belinda", "Dokter Gigi Umum", "1234", "Aktif", "503/SIP-DRG/015/2026", "081234567815", "0.40", "belinda@sheldon.id"],
        ["Bernadette Rostenkowski", "bernadette", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/001/2026", "081234567893", "0", "bernadette@sheldon.id"],
        ["Wulan", "wulan", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/002/2026", "081234567895", "0", "wulan@sheldon.id"],
        ["Dina", "dina", "Perawat Gigi", "3333", "Aktif", "503/STR-PRW/003/2026", "081234567896", "0", "dina@sheldon.id"],
        ["Penny Teller", "penny", "Perawat Umum", "2222", "Aktif", "-", "081234567892", "0", "penny@sheldon.id"],
        ["Howard Wolowitz", "howard", "Admin", "4444", "Aktif", "-", "081234567894", "0", "howard@sheldon.id"]
    ]
    write_csv("MASTER", "Data.csv", master_headers, master_rows)

    # -------------------------------------------------------------------------
    # 2. 05 DATABASE TINDAKAN (DATABASE/Kategori.csv, Tindakan.csv, Tarif_Khusus_Dokter.csv)
    # -------------------------------------------------------------------------
    write_csv("DATABASE", "Kategori.csv", ["Kategori", "Kode"], [
        ["Umum", "UMM"],
        ["Dokter Gigi Umum", "DGU"],
        ["Dokter Gigi Spesialis", "DGS"],
        ["Dokter Gigi Spesialis Ortodonti", "ORT"],
        ["Bedah Mulut", "BMU"]
    ])

    tindakan_catalog = [
        # Core items used by test suite & clinical workflows
        ("TND-001", "Scaling Gigi Rahang Atas & Bawah", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("TND-002", "Penambalan Komposit Light-Cure", "Dokter Gigi Umum", 300000, "Tidak", ""),
        ("TND-003", "Pencabutan Gigi Permanen Ringan", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("TND-004", "Pemasangan Kawat Gigi Ortho Standard", "Dokter Gigi Spesialis Ortodonti", 5000000, "Tidak", ""),
        ("TND-005", "Foto Rontgen Periapikal Digital", "Umum", 100000, "Tidak", "0.15"),
        ("TND-006", "Perawatan Saluran Akar (PSA) Molar", "Dokter Gigi Spesialis Ortodonti", 1200000, "Tidak", ""),
        ("TND-007", "Pemasangan Mahkota PFM (Crown)", "Dokter Gigi Spesialis Ortodonti", 1500000, "Ya", ""),
        # Full SHELDON 2026 DB_TINDAKAN catalog
        ("DGU-0001", "Tumpat Komposit Kecil", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("DGU-0002", "Tumpat Komposit Sedang", "Dokter Gigi Umum", 300000, "Tidak", ""),
        ("DGU-0003", "Tumpat Komposit Besar", "Dokter Gigi Umum", 350000, "Tidak", ""),
        ("DGU-0004", "Tumpat GIC Kecil", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0005", "Tumpat GIC Sedang", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("DGU-0006", "Tumpat GIC Besar", "Dokter Gigi Umum", 300000, "Tidak", ""),
        ("DGU-0007", "Veneer Direct Composite", "Dokter Gigi Umum", 600000, "Tidak", ""),
        ("DGS-0008", "Veneer Indirect Porcelain", "Dokter Gigi Spesialis", 2500000, "Ya", ""),
        ("DGU-0009", "Scalling Ringan", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0010", "Scalling Sedang", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("DGU-0011", "Scalling Berat", "Dokter Gigi Umum", 350000, "Tidak", ""),
        ("DGU-0012", "Scalling Perawat", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0013", "Stain Remover", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0014", "Kuretase Gingiva per Regio", "Dokter Gigi Umum", 300000, "Tidak", ""),
        ("DGU-0015", "Splinting Periodontal", "Dokter Gigi Umum", 450000, "Tidak", ""),
        ("DGU-0016", "Open Bur + Medikasi", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0017", "Devitalisasi Pulpa", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0018", "Pulpectomi / Ekstirpasi Pulpa", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0019", "Sterilisasi Saluran Akar (Dressing)", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0020", "Obturasi Saluran Akar Tunggal", "Dokter Gigi Umum", 350000, "Tidak", ""),
        ("DGS-0021", "Obturasi Saluran Akar Ganda/Molar", "Dokter Gigi Spesialis", 550000, "Tidak", ""),
        ("DGS-0022", "PSA 1x Kunjungan (One Visit Endodontic)", "Dokter Gigi Spesialis", 1500000, "Tidak", ""),
        ("DGU-0023", "Pasak Fiber (Fiber Post)", "Dokter Gigi Umum", 450000, "Tidak", ""),
        ("DGU-0024", "Exo Anak Tanpa Injeksi (Topikal)", "Dokter Gigi Umum", 100000, "Tidak", ""),
        ("DGU-0025", "Exo Anak Dengan Injeksi", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0026", "Exo Dewasa Ringan (Akar Tunggal)", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("DGU-0027", "Exo Dewasa Sedang (Molar/Premolar)", "Dokter Gigi Umum", 350000, "Tidak", ""),
        ("DGS-0028", "Exo Dewasa Komplikasi / Separasi", "Dokter Gigi Spesialis", 500000, "Tidak", ""),
        ("DGS-0029", "Odontektomi Kelas I Ringan", "Dokter Gigi Spesialis", 1800000, "Tidak", ""),
        ("DGS-0030", "Odontektomi Kelas II/III Impaksi", "Dokter Gigi Spesialis", 2500000, "Tidak", ""),
        ("DGU-0031", "Operculektomi", "Dokter Gigi Umum", 350000, "Tidak", ""),
        ("DGS-0032", "Alveolektomi per Regio", "Dokter Gigi Spesialis", 600000, "Tidak", ""),
        ("DGU-0033", "Insisi Abses Intraoral", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("DGU-0034", "Hecting / Jahit Luka", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0035", "Aff Hecting / Lepas Jahitan", "Dokter Gigi Umum", 100000, "Tidak", ""),
        ("DGS-0036", "Pemasangan Ortho Metal Standar RA+RB", "Dokter Gigi Spesialis", 4500000, "Tidak", ""),
        ("DGS-0037", "Pemasangan Ortho Ceramic Estetik RA+RB", "Dokter Gigi Spesialis", 6500000, "Tidak", ""),
        ("DGS-0038", "Pemasangan Ortho Self-Ligating Damon", "Dokter Gigi Spesialis", 9500000, "Tidak", ""),
        ("DGU-0039", "Kontrol Ortho Rutin (Ganti Karet/Power O)", "Dokter Gigi Umum", 150000, "Tidak", ""),
        ("DGU-0040", "Kontrol Ortho Ganti Kawat (NiTi/SS)", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0041", "Lem Bracket Lepas per Gigi", "Dokter Gigi Umum", 50000, "Tidak", ""),
        ("DGU-0042", "Lepas Bracket Ortho RA+RB", "Dokter Gigi Umum", 500000, "Tidak", ""),
        ("DGS-0043", "Retainer Clear / Hawley per Rahang", "Dokter Gigi Spesialis", 750000, "Ya", ""),
        ("DGS-0044", "Crown PFM (Porcelain Fused to Metal)", "Dokter Gigi Spesialis", 1500000, "Ya", ""),
        ("DGS-0045", "Crown Zirconia All-Ceramic", "Dokter Gigi Spesialis", 2800000, "Ya", ""),
        ("DGS-0046", "Crown E-Max Full Porcelain", "Dokter Gigi Spesialis", 2600000, "Ya", ""),
        ("DGU-0047", "Crown Acrylic Sementara (Temporary)", "Dokter Gigi Umum", 350000, "Ya", ""),
        ("DGS-0048", "GTSL Acrylic Plat Dasar + 1 Gigi", "Dokter Gigi Spesialis", 900000, "Ya", ""),
        ("DGS-0049", "GTSL Valplast Fleksibel + 1 Gigi", "Dokter Gigi Spesialis", 1800000, "Ya", ""),
        ("DGS-0050", "GTL (Gigi Tiruan Lengkap) 1 Rahang", "Dokter Gigi Spesialis", 3000000, "Ya", ""),
        ("DGS-0051", "GTL (Gigi Tiruan Lengkap) RA + RB", "Dokter Gigi Spesialis", 5500000, "Ya", ""),
        ("DGU-0052", "Rebasing / Relining Protesa", "Dokter Gigi Umum", 450000, "Ya", ""),
        ("DGU-0053", "Reparasi Protesa Patah", "Dokter Gigi Umum", 350000, "Ya", ""),
        ("DGU-0054", "Bleaching Office (In-Office Whitening)", "Dokter Gigi Umum", 1800000, "Tidak", ""),
        ("DGU-0055", "Bleaching Home Kit + Tray", "Dokter Gigi Umum", 1200000, "Ya", ""),
        ("DGU-0056", "Pasang Diamond Gigi (Skyce)", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0057", "Fissure Sealant Gigi Anak", "Dokter Gigi Umum", 200000, "Tidak", ""),
        ("DGU-0058", "Topikal Aplikasi Fluor (TAF) RA+RB", "Dokter Gigi Umum", 250000, "Tidak", ""),
        ("UMM-0059", "Rontgen Periapikal Digital", "Umum", 100000, "Tidak", "0.15"),
        ("UMM-0060", "Konsultasi & Pemeriksaan Lengkap", "Umum", 50000, "Tidak", "")
    ]
    write_csv("DATABASE", "Tindakan.csv", ["Kode_Tindakan", "Nama_Tindakan", "Kategori", "Tarif", "Labor", "Persen_JM_Default"], tindakan_catalog)

    write_csv("DATABASE", "Tarif_Khusus_Dokter.csv", ["ID_Aturan", "Nama_Dokter", "Kode_Tindakan", "Nama_Tindakan", "Persen_JM_Dokter", "Keterangan"], [
        ["EXC-0001", "drg. Sheldon Cooper, Sp.Ort", "TND-006", "Perawatan Saluran Akar (PSA) Molar", "0.55", "Tarif Khusus PSA Molar 55%"],
        ["EXC-0002", "drg. Tia Ardhana R", "TND-006", "Perawatan Saluran Akar (PSA) Molar", "0.55", "drg. Tia Ardhana R: PSA Molar JM Khusus 55%"],
        ["EXC-0003", "drg. Tia Ardhana R", "DGS-0030", "Odontektomi Kelas II/III Impaksi", "0.55", "drg. Tia Ardhana R: Bedah Minor JM Khusus 55%"],
        ["EXC-0004", "drg. Tia Ardhana R", "TND-007", "Pemasangan Mahkota PFM (Crown)", "0.55", "drg. Tia Ardhana R: Crown PFM JM Khusus 55% setelah potong Lab"]
    ])

    # -------------------------------------------------------------------------
    # 3. 08 GUDANG OBAT & 09 GUDANG BMHP
    # -------------------------------------------------------------------------
    obat_headers = ["ID_Obat", "Nama_Obat", "Kandungan_Obat", "Satuan_Beli", "Isi_Per_Satuan", "Harga_Beli_Satuan", "HPP_Pcs", "Margin_Persen", "Harga_Jual", "Stock_Tersedia", "Stock_Minimum", "Terjual"]
    obat_rows = [
        ["OBT-0001", "Amoxicillin 500 mg", "Amoxicillin Trihydrate 500mg", "Box", "100", "80000", "800", "150%", "2000", "500", "50", "45"],
        ["OBT-0002", "Asam Mefenamat 500 mg", "Mefenamic Acid 500mg", "Box", "100", "50000", "500", "200%", "1500", "500", "50", "82"],
        ["OBT-0003", "Paracetamol 500 mg", "Paracetamol 500mg", "Box", "100", "30000", "300", "233.3%", "1000", "600", "50", "60"],
        ["OBT-0004", "Metronidazole 500 mg", "Metronidazole 500mg", "Box", "100", "60000", "600", "200%", "1800", "300", "30", "28"],
        ["OBT-0005", "Ibuprofen 400 mg", "Ibuprofen 400mg", "Box", "100", "45000", "450", "233.3%", "1500", "400", "40", "34"],
        ["OBT-0006", "Kalium Diklofenak 50 mg", "Diclofenac Potassium 50mg", "Box", "50", "75000", "1500", "100%", "3000", "250", "30", "40"],
        ["OBT-0007", "Clindamycin 300 mg", "Clindamycin HCl 300mg", "Box", "50", "110000", "2200", "81.8%", "4000", "200", "25", "19"],
        ["OBT-0008", "Cefadroxil 500 mg", "Cefadroxil Monohydrate 500mg", "Box", "100", "130000", "1300", "130.8%", "3000", "300", "30", "22"],
        ["OBT-0009", "Dexamethasone 0.5 mg", "Dexamethasone 0.5mg", "Box", "100", "25000", "250", "300%", "1000", "400", "40", "35"],
        ["OBT-0010", "Methylprednisolone 4 mg", "Methylprednisolone 4mg", "Box", "100", "90000", "900", "122.2%", "2000", "300", "30", "25"],
        ["OBT-0011", "Chlorhexidine Gluconate 0.2% Gargle", "Chlorhexidine Digluconate 0.2%", "Botol", "1", "22000", "22000", "59.1%", "35000", "80", "15", "18"],
        ["OBT-0012", "Aloclair Plus Gel 8 ml", "Aloe Vera + Sodium Hyaluronate", "Tube", "1", "65000", "65000", "38.5%", "90000", "40", "10", "12"]
    ]
    write_csv("OBAT", "Master_Obat.csv", obat_headers, obat_rows)

    bmhp_headers = ["Kode_Item", "Nama_Barang", "Satuan", "HPP", "Harga_Jual", "Stok_Tersedia", "Stok_Minimum", "Total_Terjual", "Expired_Date", "Supplier"]
    bmhp_rows = [
        ["BMH-0001", "Sarung Tangan Lateks (Handscoon)", "Pasang", "1500", "5000", "500", "100", "120", "30-06-2028", "PT Medika Alkesindo"],
        ["BMH-0002", "Masker Medis 3-Ply Earloop", "Pcs", "700", "2500", "500", "100", "140", "30-06-2028", "PT Medika Alkesindo"],
        ["BMH-0003", "Cotton Roll Dental", "Pcs", "100", "500", "1000", "200", "310", "30-06-2028", "PT Dental Jaya"],
        ["BMH-0004", "Lidocaine Compositum Cartridge", "Cartridge", "6000", "15000", "180", "30", "45", "30-06-2027", "PT Septodont Indo"],
        ["BMH-0005", "Needle Disposable Citoject 30G", "Pcs", "1500", "5000", "250", "40", "45", "30-06-2028", "PT Septodont Indo"],
        ["BMH-0006", "Saliva Ejector Suction Tip", "Pcs", "800", "2000", "400", "80", "110", "30-12-2028", "PT Dental Jaya"],
        ["BMH-0007", "Spuit Disposable 3cc OneMed", "Pcs", "1200", "3500", "300", "50", "60", "30-12-2028", "PT Medika Alkesindo"],
        ["BMH-0008", "Gelas Kumur Plastik Disposable", "Pcs", "300", "1000", "800", "150", "220", "30-12-2029", "PT Dental Jaya"],
        ["BMH-0009", "Polibib / Dental Bib Celemek", "Lembar", "600", "2000", "450", "80", "130", "30-12-2029", "PT Dental Jaya"],
        ["BMH-0010", "Spons Hemostatik (Spongostan)", "Cube", "12000", "25000", "60", "15", "14", "30-06-2027", "PT Medika Alkesindo"]
    ]
    write_csv("BMHP", "Master_BMHP.csv", bmhp_headers, bmhp_rows)

    # -------------------------------------------------------------------------
    # 4. 01 PASIEN (PASIEN/Data_Pasien.csv) -> 124 Pasien Tervalidasi
    # Headers (21 kolom): ["ID_Pasien", "Nama_Pasien", "No_RM", "Jenis_Kelamin", "Tempat_Lahir", "Tanggal_Lahir", "Umur", "Agama", "Golongan_Darah", "Pekerjaan", "NIK", "Alamat", "Provinsi", "Kabupaten", "Kecamatan", "Kelurahan", "WhatsApp", "Alergi", "Riwayat_Penyakit", "Catatan", "Tanggal_Daftar"]
    # -------------------------------------------------------------------------
    pasien_headers = [
        "ID_Pasien", "Nama_Pasien", "No_RM", "Jenis_Kelamin", "Tempat_Lahir",
        "Tanggal_Lahir", "Umur", "Agama", "Golongan_Darah", "Pekerjaan",
        "NIK", "Alamat", "Provinsi", "Kabupaten", "Kecamatan",
        "Kelurahan", "WhatsApp", "Alergi", "Riwayat_Penyakit", "Catatan", "Tanggal_Daftar"
    ]

    # Preserved 4 seed patients required by automated test suite
    pasien_rows = [
        ["P-0001", "Budi Santoso", "RM-0001", "Laki-Laki", "Payakumbuh", "15-08-1988", "36", "Islam", "O", "PNS", "1376011508880001", "Jl. Sudirman No. 45, Payakumbuh", "Sumatera Barat", "Kota Payakumbuh", "Payakumbuh Barat", "Daya Bangun", "081234567890", "Penicillin", "Hipertensi", "Pasien kooperatif", "01-01-2024"],
        ["P-0002", "Siti Rahmawati", "RM-0002", "Perempuan", "Bukittinggi", "22-11-1995", "29", "Islam", "A", "Wiraswasta", "1376012211950002", "Jl. A. Yani No. 12, Bukittinggi", "Sumatera Barat", "Kota Bukittinggi", "Guguk Panjang", "Benteng", "081398765432", "Tidak Ada", "Asma", "Kontrol rutin", "05-01-2024"],
        ["P-0003", "Ahmad Fauzi", "RM-0003", "Laki-Laki", "Padang", "10-04-2000", "24", "Islam", "B", "Mahasiswa", "1376011004000003", "Jl. Khatib Sulaiman, Padang", "Sumatera Barat", "Kota Padang", "Padang Utara", "Lolong Belanti", "082155667788", "Tidak Ada", "Tidak Ada", "Pemeriksaan pertama", "12-02-2024"],
        ["P-0004", "Hendra Wijaya", "RM-0004", "Laki-Laki", "Payakumbuh", "15-05-1990", "34", "Islam", "AB", "Karyawan Swasta", "1376011505900004", "Jl. Tan Malaka No. 88, Payakumbuh", "Sumatera Barat", "Kota Payakumbuh", "Payakumbuh Utara", "Taruko", "081267891234", "Tidak Ada", "Gastritis", "Kasus orto dan estetik", "10-10-2026"]
    ]

    # 120 Data Pasien Bulk dari SHELDON 2026
    bulk_names = [
        ("Nadia Putri Pratama", "N-0101", "Perempuan", "12-03-1998", "B", "Karyawan Swasta", "Jl. Soekarno Hatta No. 14"),
        ("Rizky Ramadhan", "R-0102", "Laki-Laki", "04-07-1993", "O", "Wiraswasta", "Jl. Veteran No. 21"),
        ("Aulia Zahra", "A-0103", "Perempuan", "19-11-2001", "A", "Pelajar/Mahasiswa", "Jl. Pemuda No. 8"),
        ("Fajar Nugraha", "F-0104", "Laki-Laki", "28-02-1987", "AB", "PNS", "Jl. Diponegoro No. 55"),
        ("Dewi Kartika Sari", "D-0105", "Perempuan", "15-06-1991", "O", "Ibu Rumah Tangga", "Jl. Imam Bonjol No. 32"),
        ("Bagus Setiawan", "B-0106", "Laki-Laki", "09-09-1995", "A", "Karyawan Swasta", "Jl. Gajah Mada No. 19"),
        ("Intan Permata", "I-0107", "Perempuan", "23-01-1999", "B", "Guru/Dosen", "Jl. Pahlawan No. 40"),
        ("Dimas Aditya", "D-0108", "Laki-Laki", "17-04-1992", "O", "Wiraswasta", "Jl. Kartini No. 11"),
        ("Rina Wulandari", "R-0109", "Perempuan", "30-08-1989", "A", "PNS", "Jl. Ahmad Yani No. 73"),
        ("Eko Prasetyo", "E-0110", "Laki-Laki", "11-12-1985", "B", "TNI/Polri", "Jl. Hasanuddin No. 29"),
        ("Maya Anggraini", "M-0111", "Perempuan", "05-05-1997", "O", "Karyawan Swasta", "Jl. Cendrawasih No. 6"),
        ("Andi Wijaya Kusuma", "A-0112", "Laki-Laki", "21-10-1990", "AB", "Wiraswasta", "Jl. Merpati No. 18"),
        ("Putri Maharani", "P-0113", "Perempuan", "14-02-2002", "A", "Pelajar/Mahasiswa", "Jl. Melati No. 25"),
        ("Reza Pahlevi", "R-0114", "Laki-Laki", "08-07-1994", "O", "Karyawan Swasta", "Jl. Kenanga No. 12"),
        ("Fitriani Nur", "F-0115", "Perempuan", "27-09-1996", "B", "Ibu Rumah Tangga", "Jl. Anggrek No. 31"),
        ("Wahyu Hidayat", "W-0116", "Laki-Laki", "03-03-1988", "A", "PNS", "Jl. Mawar No. 9"),
        ("Nisa Amelia", "N-0117", "Perempuan", "18-06-2000", "O", "Pelajar/Mahasiswa", "Jl. Dahlia No. 44"),
        ("Arif Budiman", "A-0118", "Laki-Laki", "25-11-1983", "B", "Wiraswasta", "Jl. Flamboyan No. 17"),
        ("Diana Puspita", "D-0119", "Perempuan", "07-01-1993", "AB", "Guru/Dosen", "Jl. Bougenville No. 22"),
        ("Galih Prakoso", "G-0120", "Laki-Laki", "16-08-1996", "O", "Karyawan Swasta", "Jl. Teratai No. 5"),
        ("Lestari Handayani", "L-0121", "Perempuan", "29-04-1986", "A", "Ibu Rumah Tangga", "Jl. Kamboja No. 15"),
        ("Yusuf Maulana", "Y-0122", "Laki-Laki", "12-10-1991", "B", "Karyawan Swasta", "Jl. Cemara No. 38"),
        ("Citra Kirana", "C-0123", "Perempuan", "02-02-1999", "O", "Wiraswasta", "Jl. Beringin No. 10"),
        ("Taufik Hidayatullah", "T-0124", "Laki-Laki", "20-05-1989", "A", "PNS", "Jl. Jati No. 27"),
        ("Safira Salsabila", "S-0125", "Perempuan", "09-12-2003", "B", "Pelajar/Mahasiswa", "Jl. Mahoni No. 13"),
        ("Bayu Pamungkas", "B-0126", "Laki-Laki", "14-07-1995", "O", "Karyawan Swasta", "Jl. Pinus No. 8"),
        ("Mega Utami", "M-0127", "Perempuan", "26-03-1992", "AB", "Guru/Dosen", "Jl. Akasia No. 19"),
        ("Irfan Hakim", "I-0128", "Laki-Laki", "01-09-1987", "A", "Wiraswasta", "Jl. Rasamala No. 41"),
        ("Vina Panduwinata", "V-0129", "Perempuan", "17-11-1994", "O", "Karyawan Swasta", "Jl. Cempaka No. 3"),
        ("Deni Cagur Saputra", "D-0130", "Laki-Laki", "22-06-1990", "B", "Wiraswasta", "Jl. Seruni No. 28")
    ]

    for idx_b in range(120):
        base_info = bulk_names[idx_b % len(bulk_names)]
        p_num = idx_b + 5
        id_pas = f"P-{p_num:04d}"
        suffix_batch = "" if idx_b < len(bulk_names) else f" ({idx_b // len(bulk_names) + 1})"
        nama_p = base_info[0] + suffix_batch
        initial = nama_p[0].upper()
        no_rm = f"{initial}-{100 + p_num:04d}"
        jk = base_info[2]
        tgl_lahir = base_info[3]
        thn_l = int(tgl_lahir.split("-")[2])
        umur = str(2026 - thn_l)
        goldar = base_info[4]
        pekerjaan = base_info[5]
        nik = f"137601{p_num:010d}"
        alamat = f"{base_info[6]}, Payakumbuh"
        wa = f"08128899{p_num:04d}"
        day_d = (idx_b % 28) + 1
        month_d = ((idx_b // 12) % 10) + 1
        tgl_daftar = f"{day_d:02d}-{month_d:02d}-2026"

        pasien_rows.append([
            id_pas, nama_p, no_rm, jk, "Payakumbuh",
            tgl_lahir, umur, "Islam", goldar, pekerjaan,
            nik, alamat, "Sumatera Barat", "Kota Payakumbuh", "Payakumbuh Barat",
            "Daya Bangun", wa, "Tidak Ada", "Tidak Ada", "Data Bulk SHELDON 2026", tgl_daftar
        ])

    write_csv("PASIEN", "Data_Pasien.csv", pasien_headers, pasien_rows)

    # -------------------------------------------------------------------------
    # 5. 02 PEMBAYARAN (Data_Pembayaran.csv & Rekap_Jasa_Medis.csv)
    # -------------------------------------------------------------------------
    bayar_headers = [
        "ID_Invoice", "Tanggal_Tindakan", "ID_Pasien", "No_RM", "Nama_Pasien",
        "Dokter_Pemeriksa", "Kategori_Item", "Nama_Item", "Harga_Satuan", "Qty",
        "Labor", "Diskon_Persen", "Grand_Total_Item", "Perawat", "Total_Invoice",
        "Metode_Bayar", "Status_Pembayaran", "Keterangan", "Kasir_Bertugas", "Waktu_Sistem"
    ]
    jm_headers = [
        "ID_Invoice", "Tanggal", "Dokter", "Perawat", "Kategori_Item",
        "Nama_Item", "Tarif_Kotor", "Biaya_Lab", "Dasar_Bagi_Hasil", "Persen_JM",
        "Tipe_Aturan", "JM_Dokter_Kotor", "Potongan_Perawat", "JM_Dokter_Bersih", "JM_Perawat",
        "Bagian_Klinik", "Status_JM", "Waktu_Hitung"
    ]

    # Preserved 5 seed rows + 160 bulk rows from SHELDON 2026
    bayar_rows = [
        ["INV/SHELDON/0001/1026", "05-10-2026", "P-0001", "RM-0001", "Budi Santoso", "drg. Sheldon Cooper, Sp.Ort", "Tindakan", "Pemasangan Mahkota PFM (Crown)", "1500000", "1", "350000", "0", "1500000", "Bernadette Rostenkowski", "1515000", "Transfer Bank", "Lunas", "Crown PFM Gigi 46 Lunas", "Penny Teller", "05-10-2026 10:15:00"],
        ["INV/SHELDON/0001/1026", "05-10-2026", "P-0001", "RM-0001", "Budi Santoso", "drg. Sheldon Cooper, Sp.Ort", "Obat", "Amoxicillin 500 mg", "15000", "1", "0", "0", "15000", "Bernadette Rostenkowski", "1515000", "Transfer Bank", "Lunas", "Resep antibiotik pasca preparasi", "Penny Teller", "05-10-2026 10:15:00"],
        ["INV/SHELDON/0002/1026", "05-10-2026", "P-0002", "RM-0002", "Siti Rahmawati", "drg. Leonard Hofstadter", "Tindakan", "Foto Rontgen Periapikal Digital", "100000", "1", "0", "0", "100000", "Bernadette Rostenkowski", "100000", "QRIS", "Lunas", "Evaluasi periapikal gigi 36", "Penny Teller", "05-10-2026 11:20:00"],
        ["INV/SHELDON/0003/1026", "05-10-2026", "P-0003", "RM-0003", "Ahmad Fauzi", "drg. Sheldon Cooper, Sp.Ort", "Tindakan", "Perawatan Saluran Akar (PSA) Molar", "1500000", "1", "0", "0", "1500000", "Bernadette Rostenkowski", "1500000", "Transfer Bank", "Lunas", "PSA Kunjungan Pertama", "Penny Teller", "05-10-2026 14:05:00"],
        ["INV/SHELDON/0004/1026", "05-10-2026", "P-0004", "RM-0004", "Hendra Wijaya", "drg. Sheldon Cooper, Sp.Ort", "Tindakan", "Pemasangan Behel Standar (Include Scaling)", "5000000", "1", "0", "0", "5000000", "Bernadette Rostenkowski", "5000000", "Tunai", "Lunas", "Scaling dibantu perawat Bernadette", "Penny Teller", "05-10-2026 16:30:00"]
    ]

    jm_rows = [
        ["INV/SHELDON/0001/1026", "05-10-2026", "drg. Sheldon Cooper, Sp.Ort", "Bernadette Rostenkowski", "Tindakan", "Pemasangan Mahkota PFM (Crown)", "1500000", "350000", "1150000", "0.50", "Default Dokter (50%)", "575000", "0", "575000", "0", "575000", "Siap Cair", "05-10-2026 10:15:05"],
        ["INV/SHELDON/0001/1026", "05-10-2026", "drg. Sheldon Cooper, Sp.Ort", "Bernadette Rostenkowski", "Obat", "Amoxicillin 500 mg", "15000", "0", "15000", "0", "Non-JM (Obat/BMHP)", "0", "0", "0", "0", "15000", "Final", "05-10-2026 10:15:05"],
        ["INV/SHELDON/0002/1026", "05-10-2026", "drg. Leonard Hofstadter", "Bernadette Rostenkowski", "Tindakan", "Foto Rontgen Periapikal Digital", "100000", "0", "100000", "0.15", "Tarif Rontgen (15%)", "15000", "0", "15000", "0", "85000", "Siap Cair", "05-10-2026 11:20:05"],
        ["INV/SHELDON/0003/1026", "05-10-2026", "drg. Sheldon Cooper, Sp.Ort", "Bernadette Rostenkowski", "Tindakan", "Perawatan Saluran Akar (PSA) Molar", "1500000", "0", "1500000", "0.55", "Tarif Khusus Dokter (55%)", "825000", "0", "825000", "0", "675000", "Siap Cair", "05-10-2026 14:05:05"],
        ["INV/SHELDON/0004/1026", "05-10-2026", "drg. Sheldon Cooper, Sp.Ort", "Bernadette Rostenkowski", "Tindakan", "Pemasangan Behel Standar (Include Scaling)", "5000000", "0", "5000000", "0.50", "Default Dokter (50%)", "2500000", "50000", "2450000", "50000", "2500000", "Siap Cair", "05-10-2026 16:30:05"]
    ]

    dokter_pool = [
        ("drg. Danny", 0.65),
        ("drg. Astri", 0.65),
        ("drg. Rizka", 0.65),
        ("drg. Nanda", 0.65),
        ("drg. Aviva", 0.65),
        ("drg. Erien", 0.50),
        ("drg.g.p Dinda", 0.55),
        ("drg.g.p Fathya", 0.40),
        ("drg.g.p Belinda", 0.40),
        ("drg. Rahma Yulinda D, Sp. BMM", 0.65),
        ("drg. Tia Ardhana R", 0.50)
    ]
    perawat_pool = ["Wulan", "Dina", "Bernadette Rostenkowski"]
    metode_pool = ["Tunai", "Transfer Bank", "QRIS", "Kartu Debit/Kredit"]

    sample_procedures = [
        ("Tindakan", "Tumpat Komposit Sedang", 300000, 0, "K02.1", "Caries of dentine", "23.2"),
        ("Tindakan", "Scalling Sedang", 250000, 0, "K05.1", "Chronic gingivitis", "96.54"),
        ("Tindakan", "Exo Dewasa Ringan (Akar Tunggal)", 250000, 0, "K01.1", "Impacted / Retained tooth", "23.01"),
        ("Tindakan", "Kontrol Ortho Rutin (Ganti Karet/Power O)", 150000, 0, "K07.2", "Anomalies of dental arch", "24.7"),
        ("Tindakan", "Rontgen Periapikal Digital", 100000, 0, "K04.0", "Pulpitis", "89.31"),
        ("Tindakan", "Scalling Perawat", 150000, 0, "K05.1", "Chronic gingivitis", "96.54"),
        ("Tindakan", "Crown PFM (Porcelain Fused to Metal)", 1500000, 350000, "K08.1", "Loss of teeth", "23.41"),
        ("Tindakan", "PSA 1x Kunjungan (One Visit Endodontic)", 1500000, 0, "K04.0", "Pulpitis irreversibel", "23.70"),
        ("Tindakan", "Odontektomi Kelas I Ringan", 1800000, 0, "K01.1", "Impacted teeth", "23.19"),
        ("Tindakan", "Tumpat GIC Sedang", 250000, 0, "K02.1", "Caries of dentine", "23.2")
    ]

    # -------------------------------------------------------------------------
    # 6. 03 REKAM MEDIS (Data_Rekam_Medis.csv)
    # Headers (13 kolom): ["ID_RM_Klinis", "ID_Pasien", "No_RM", "Nama_Pasien", "Tanggal_Pemeriksaan", "Dokter_Pemeriksa", "Anamnesis_JSON", "Fisik_JSON", "Odontogram_JSON", "Tindakan_JSON", "Resep_Obat_JSON", "Catatan_Edukasi", "Waktu_Simpan"]
    # -------------------------------------------------------------------------
    rm_headers = [
        "ID_RM_Klinis", "ID_Pasien", "No_RM", "Nama_Pasien", "Tanggal_Pemeriksaan",
        "Dokter_Pemeriksa", "Anamnesis_JSON", "Fisik_JSON", "Odontogram_JSON",
        "Tindakan_JSON", "Resep_Obat_JSON", "Catatan_Edukasi", "Waktu_Simpan"
    ]
    rm_rows = [
        [
            "EMR-2026-0001", "P-0001", "RM-0001", "Budi Santoso", "10-10-2026", "drg. Sheldon Cooper, Sp.Ort",
            json.dumps({"cc": "Gigi 46 pasca PSA ingin dibuatkan mahkota jaket/PFM", "diagnosaICD": ["K02.1 - Caries of dentine"], "riwayatPenyakit": "Hipertensi terkontrol"}),
            json.dumps({"kesan": "Baik", "tensi": "120/80", "nadi": "78", "suhu": "36.5"}),
            json.dumps({"46": {"generalCondition": "acr", "surfaces": {"occlusal": "acr"}}}),
            json.dumps(["23.41 - Pemasangan Mahkota PFM (Crown)"]),
            json.dumps([{"obat": "Amoxicillin 500 mg", "qty": 10, "ket": "3x1 sesudah makan"}]),
            "Pasien dijadwalkan pasang crown definitif 7 hari lagi saat hasil lab selesai.",
            "10-10-2026 10:15:00"
        ],
        [
            "EMR-2026-0002", "P-0002", "RM-0002", "Siti Rahmawati", "10-10-2026", "drg. Leonard Hofstadter",
            json.dumps({"cc": "Pemeriksaan foto rontgen periapikal untuk cek akar gigi 36", "diagnosaICD": ["K04.0 - Pulpitis irreversibel"], "riwayatPenyakit": "Asma"}),
            json.dumps({"kesan": "Baik", "tensi": "115/75", "nadi": "80", "suhu": "36.6"}),
            json.dumps({}),
            json.dumps(["89.31 - Foto Rontgen Periapikal Digital"]),
            json.dumps([]),
            "Hasil rontgen menunjukkan lesi periapikal mengecil, respon baik.",
            "10-10-2026 11:20:00"
        ],
        [
            "EMR-2026-0003", "P-0003", "RM-0003", "Ahmad Fauzi", "10-10-2026", "drg. Sheldon Cooper, Sp.Ort",
            json.dumps({"cc": "Gigi 16 ngilu berdenyut hebat malam hari, karies profunda", "diagnosaICD": ["K04.0 - Pulpitis irreversibel"], "riwayatPenyakit": "Tidak Ada"}),
            json.dumps({"kesan": "Baik", "tensi": "120/80", "nadi": "76", "suhu": "36.7"}),
            json.dumps({"16": {"generalCondition": "car", "surfaces": {"occlusal": "car"}}}),
            json.dumps(["23.70 - Perawatan Saluran Akar (PSA) Molar"]),
            json.dumps([{"obat": "Asam Mefenamat 500 mg", "qty": 10, "ket": "3x1 jika nyeri"}]),
            "Hindari mengunyah makanan keras di sisi kanan.",
            "10-10-2026 14:05:00"
        ],
        [
            "EMR-2026-0004", "P-0004", "RM-0004", "Hendra Wijaya", "10-10-2026", "drg. Sheldon Cooper, Sp.Ort",
            json.dumps({"cc": "Pemasangan kawat gigi behel atas dan bawah, gigi berjejal", "diagnosaICD": ["K07.2 - Anomalies of dental arch relationship"], "riwayatPenyakit": "Gastritis"}),
            json.dumps({"kesan": "Baik", "tensi": "125/80", "nadi": "78", "suhu": "36.5"}),
            json.dumps({}),
            json.dumps(["96.54 - Pemasangan Behel Standar (Include Scaling)"]),
            json.dumps([]),
            "Scaling dibantu oleh perawat Bernadette sebelum pemasangan bracket.",
            "10-10-2026 16:30:00"
        ]
    ]

    # Generate 120 Bulk Invoices & EMR records linked to P-0005..P-0124
    for idx_b in range(120):
        p_row = pasien_rows[idx_b + 4]
        id_pas = p_row[0]
        nama_p = p_row[1]
        no_rm = p_row[2]
        tgl_trx = p_row[20]
        mmyy = tgl_trx.split("-")[1] + tgl_trx.split("-")[2][-2:]
        inv_num = idx_b + 5
        id_inv = f"INV/SHELDON/{inv_num:04d}/{mmyy}"

        dok_name, dok_pct = dokter_pool[idx_b % len(dokter_pool)]
        prw_name = perawat_pool[idx_b % len(perawat_pool)]
        metode = metode_pool[idx_b % len(metode_pool)]
        proc = sample_procedures[idx_b % len(sample_procedures)]
        kat_item, nama_item, hrg, lab_fee, icd10_code, icd10_desc, icd9_code = proc

        # Every 3rd invoice also includes a Medikasi (Obat) line item to test multi-item invoice audit & Non-JM Obat
        has_medikasi = (idx_b % 3 == 0)
        obat_hrg = 35000 if has_medikasi else 0
        total_inv = hrg + obat_hrg

        bayar_rows.append([
            id_inv, tgl_trx, id_pas, no_rm, nama_p,
            dok_name, kat_item, nama_item, str(hrg), "1",
            str(lab_fee), "0", str(hrg), prw_name, str(total_inv),
            metode, "Lunas", "Transaksi Bulk SHELDON 2026", prw_name, f"{tgl_trx} 15:30:00"
        ])

        is_rontgen = ("rontgen" in nama_item.lower())
        is_scaling_prw = ("scalling perawat" in nama_item.lower())
        eff_pct = 0.15 if is_rontgen else dok_pct
        tipe_aturan = "Tarif Rontgen (15%)" if is_rontgen else f"Persentase Dokter ({int(eff_pct*100)}%)"
        dasar_jm = max(0, hrg - lab_fee)
        jm_kotor = round(dasar_jm * eff_pct)
        pot_prw = 25000 if is_scaling_prw else 0
        jm_bersih = max(0, jm_kotor - pot_prw)
        bag_klinik = max(0, dasar_jm - jm_bersih - pot_prw)

        jm_rows.append([
            id_inv, tgl_trx, dok_name, prw_name, kat_item,
            nama_item, str(hrg), str(lab_fee), str(dasar_jm), str(eff_pct),
            tipe_aturan, str(jm_kotor), str(pot_prw), str(jm_bersih), str(pot_prw),
            str(bag_klinik), "Siap Cair", f"{tgl_trx} 15:30:05"
        ])

        if has_medikasi:
            bayar_rows.append([
                id_inv, tgl_trx, id_pas, no_rm, nama_p,
                dok_name, "Obat", "Medikasi (Asam Mefenamat 500 mg + Amoxicillin 500 mg)", str(obat_hrg), "1",
                "0", "0", str(obat_hrg), prw_name, str(total_inv),
                metode, "Lunas", "Medikasi Oral Pasca Tindakan", prw_name, f"{tgl_trx} 15:30:00"
            ])
            jm_rows.append([
                id_inv, tgl_trx, dok_name, prw_name, "Obat",
                "Medikasi (Asam Mefenamat 500 mg + Amoxicillin 500 mg)", str(obat_hrg), "0", str(obat_hrg), "0",
                "Non-JM (Obat/BMHP)", "0", "0", "0", "0",
                str(obat_hrg), "Final", f"{tgl_trx} 15:30:05"
            ])

        emr_id = f"EMR-2026-{inv_num:04d}"
        rm_rows.append([
            emr_id, id_pas, no_rm, nama_p, tgl_trx,
            dok_name,
            json.dumps({"cc": f"Pasien datang untuk {nama_item}", "diagnosaICD": [f"{icd10_code} - {icd10_desc}"], "riwayatPenyakit": "Tidak Ada"}),
            json.dumps({"kesan": "Baik", "tensi": "120/80", "nadi": "80", "suhu": "36.5"}),
            json.dumps({"36": {"generalCondition": "car", "surfaces": {"occlusal": "car"}}}),
            json.dumps([f"{icd9_code} - {nama_item}"]),
            json.dumps([{"obat": "Asam Mefenamat 500 mg", "qty": 10, "ket": "3x1 sesudah makan"}]),
            "Kontrol kembali bila ada keluhan.",
            f"{tgl_trx} 15:30:00"
        ])

    write_csv("PEMBAYARAN", "Data_Pembayaran.csv", bayar_headers, bayar_rows)
    write_csv("PEMBAYARAN", "Rekap_Jasa_Medis.csv", jm_headers, jm_rows)
    write_csv("REKAM_MEDIS", "Data_Rekam_Medis.csv", rm_headers, rm_rows)

    # -------------------------------------------------------------------------
    # 7. 11 PAYROLL & HONOR DOKTER (PAYROLL/*.csv)
    # -------------------------------------------------------------------------
    tarif_headers = ["ID_Aturan", "Role", "Nama_Pekerja", "Tipe_Kompensasi", "Tarif_Shift_1", "Tarif_Shift_2", "Gaji_Pokok_Bulanan", "Keterangan", "Status"]
    tarif_rows = []
    for u_idx, u in enumerate(master_rows):
        nama_u = u[0]
        role_u = u[2]
        status_u = u[4] or "Aktif"
        id_at = f"TARIF-{u_idx+1:03d}"
        r_low = role_u.lower()
        if "dokter" in r_low or "spesialis" in r_low:
            tipe = "Kombinasi Shift & Tindakan"
            s1 = "55000"
            s2 = "55000"
            gp = "0"
            try:
                pjm_val = float(u[7]) if u[7] else 0.40
                pct = int(pjm_val * 100) if pjm_val <= 1 else int(pjm_val)
            except Exception:
                pct = 40
            ket = f"2 Shift: Rp 55.000/shift + JM {pct}% (Rontgen 15%)"
        elif "perawat" in r_low:
            tipe = "Uang Harian Shift"
            s1 = "45000"
            s2 = "45000"
            gp = "0"
            ket = "2 Shift: Rp 45.000/shift (dihitung berdasarkan absensi kehadiran)"
        elif "admin" in r_low or "kasir" in r_low:
            tipe = "Gaji Bulanan Tetap"
            s1 = "0"
            s2 = "0"
            gp = "1200000"
            ket = "Gaji Bulanan Tetap Rp 1.200.000/bulan (Non-Shift)"
        else: # Owner / Super User
            tipe = "Kombinasi Shift & Tindakan"
            s1 = "55000"
            s2 = "55000"
            gp = "0"
            ket = "2 Shift: Rp 55.000/shift + JM 65%"
        tarif_rows.append([id_at, role_u, nama_u, tipe, s1, s2, gp, ket, status_u])
    write_csv("MASTER", "Pengaturan_Tarif_Shift.csv", tarif_headers, tarif_rows)

    presensi_headers = ["ID_Presensi", "Tanggal", "ID_Pekerja", "Nama_Pekerja", "Role", "Shift", "Jam_Masuk", "Jam_Pulang", "Status_Kehadiran", "Uang_Harian_Didapat", "Verifikator", "Waktu_Sistem"]
    presensi_rows = []
    for d_idx in range(1, 31):
        tgl_p = f"{d_idx:02d}-01-2026"
        dok_s1 = dokter_pool[d_idx % len(dokter_pool)][0]
        dok_s2 = dokter_pool[(d_idx + 1) % len(dokter_pool)][0]
        prw_s1 = perawat_pool[d_idx % len(perawat_pool)]
        prw_s2 = perawat_pool[(d_idx + 1) % len(perawat_pool)]
        presensi_rows.append([f"ATT-202601-{len(presensi_rows)+1:03d}", tgl_p, f"DOK-{(d_idx%6)+1:03d}", dok_s1, "Dokter Gigi Umum", "Shift 1", "09:00", "15:00", "Hadir", "55000", "Howard Wolowitz", f"{tgl_p} 15:05:00"])
        presensi_rows.append([f"ATT-202601-{len(presensi_rows)+1:03d}", tgl_p, f"DOK-{((d_idx+1)%6)+1:03d}", dok_s2, "Dokter Gigi Umum", "Shift 2", "15:00", "21:00", "Hadir", "55000", "Howard Wolowitz", f"{tgl_p} 21:05:00"])
        presensi_rows.append([f"ATT-202601-{len(presensi_rows)+1:03d}", tgl_p, f"PRW-{(d_idx%3)+1:03d}", prw_s1, "Perawat Gigi", "Shift 1", "08:50", "15:00", "Hadir", "45000", "Howard Wolowitz", f"{tgl_p} 15:05:00"])
        presensi_rows.append([f"ATT-202601-{len(presensi_rows)+1:03d}", tgl_p, f"PRW-{((d_idx+1)%3)+1:03d}", prw_s2, "Perawat Gigi", "Shift 2", "14:55", "21:05", "Hadir", "45000", "Howard Wolowitz", f"{tgl_p} 21:05:00"])
    write_csv("PAYROLL", "Presensi_Shift_Harian.csv", presensi_headers, presensi_rows)

    print(f"✅ Selesai! Pasien: {len(pasien_rows)} | Pembayaran: {len(bayar_rows)} | JM: {len(jm_rows)} | EMR: {len(rm_rows)} | Tindakan: {len(tindakan_catalog)} | Presensi: {len(presensi_rows)}")

if __name__ == "__main__":
    main()
