# PANDUAN DEPLOY GOOGLE APPS SCRIPT - ANTIGRAVITY RME

Project Apps Script: **Antigravity RME**  
Project ID: `16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ`  
Link Editor: [Buka Google Apps Script Editor](https://script.google.com/d/16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ/edit)

---

## ⚡ METODE 1: BUNDLED DEPLOY (Paling Cepat & Direkomendasikan - Hanya 2 File)
Di editor Apps Script, Anda cukup memiliki **2 file saja** sehingga tidak perlu repot membuat 28 file terpisah:

1. Buka project di [script.google.com/d/16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ/edit](https://script.google.com/d/16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ/edit).
2. Di file **`Code.gs`**:
   - Hapus seluruh isi lama.
   - Buka file `DEPLOY_APPSSCRIPT/BUNDLED_DEPLOY/Code.gs`, **Copy All** dan **Paste** ke editor.
3. Di file **`Index.html`**:
   - Jika belum ada, klik tombol **+ (Add a file)** -> pilih **HTML** -> beri nama `Index`.
   - Buka file `DEPLOY_APPSSCRIPT/BUNDLED_DEPLOY/Index.html`, **Copy All** dan **Paste** ke editor.
4. Klik ikon **Save** (Ctrl+S / Cmd+S).
5. Klik **Deploy** (Pojok Kanan Atas) -> **Manage deployments** (atau **New deployment**):
   - Type: **Web app**
   - Execute as: **Me (email Anda)**
   - Who has access: **Anyone** (atau Anyone with Google account)
   - Klik **Deploy**.
6. Selesai! Buka link Web App yang diberikan Google.

---

## 📂 METODE 2: MODULAR DEPLOY (Jika Ingin Tab Terpisah di Editor)
Jika Anda ingin kode tetap terpisah di editor Apps Script:
- File backend (`.gs`) ada di: `DEPLOY_APPSSCRIPT/MODULAR_DEPLOY/*.gs` (11 file)
- File frontend (`.html`) ada di: `DEPLOY_APPSSCRIPT/MODULAR_DEPLOY/*.html` (18 file)

---

## ✅ PERBAIKAN YANG SUDAH DITERAPKAN & DIVERIFIKASI
1. **Pencarian Pasien Surat & Formulir Medis**:
   - Fungsi autocomplete di Keterangan Sakit (SKS), Surat Kontrol (SKP), Resume Medis (RSM), Rujukan (SPM), Lab, dan Radiologi sudah 100% aktif dan mengisi data pasien otomatis.
2. **Format Tanggal**:
   - Seluruh tanggal tampil berformat Indonesia `dd-mm-yyyy`.
3. **Database ID Terhubung**:
   - Seluruh 10 spreadsheet Google Drive klinik sudah terhubung di `DB_CONFIG`.
4. **Semua 57 Unit Tests E2E PASS (100%)**.
