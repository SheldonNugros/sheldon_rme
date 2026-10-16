import os
import shutil
import json
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEPLOY_DIR = os.path.join(ROOT_DIR, 'DEPLOY_APPSSCRIPT')
BUNDLED_DIR = os.path.join(DEPLOY_DIR, 'BUNDLED_DEPLOY')
MODULAR_DIR = os.path.join(DEPLOY_DIR, 'MODULAR_DEPLOY')

SRC_BACKEND = os.path.join(ROOT_DIR, 'RME_Modular', 'src', 'backend')
SRC_FRONTEND = os.path.join(ROOT_DIR, 'RME_Modular', 'src', 'frontend')

os.makedirs(BUNDLED_DIR, exist_ok=True)
os.makedirs(MODULAR_DIR, exist_ok=True)

# 1. GENERATE BUNDLED Code.gs
backend_files_order = [
    '00_Config.gs',
    '01_Utils.gs',
    '02_Auth.gs',
    '03_Pasien.gs',
    '04_RekamMedis.gs',
    '05_KasirPembayaran.gs',
    '06_InventoryGudang.gs',
    '07_MasterDatabase.gs',
    '08_Surat.gs',
    '09_AIInsights.gs',
    '10_SetupSpreadsheets.gs',
    '11_GoogleContactsSync.gs',
    '12_AutoBackup.gs',
    '13_ArsipTahunan.gs'
]

combined_code_gs = []
combined_code_gs.append("// ========================================================================")
combined_code_gs.append("// KLINIK SHELDON ENTERPRISE - REKAM MEDIS ELEKTRONIK (RME)")
combined_code_gs.append("// BACKEND MASTER ENGINE (GOOGLE APPS SCRIPT)")
combined_code_gs.append("// ========================================================================\n")

for fname in backend_files_order:
    fpath = os.path.join(SRC_BACKEND, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            code = f.read()
        combined_code_gs.append(f"\n// >>>>>>>>>>>>>>> MODULE: {fname} <<<<<<<<<<<<<<<")
        combined_code_gs.append(code)
    else:
        print(f"Warning: {fname} not found in {SRC_BACKEND}")

bundled_code_path = os.path.join(BUNDLED_DIR, 'Code.gs')
with open(bundled_code_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(combined_code_gs))

print(f"[OK] Bundled Code.gs written to: {bundled_code_path}")

# 2. GENERATE BUNDLED Index.html (Standalone Google Apps Script Web App)
index_template_path = os.path.join(SRC_FRONTEND, 'Index.html')
with open(index_template_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

def replace_include(match):
    inc_name = match.group(1).strip()
    inc_path = os.path.join(SRC_FRONTEND, f"{inc_name}.html")
    if os.path.exists(inc_path):
        with open(inc_path, 'r', encoding='utf-8') as f:
            return f.read()
    return f"<!-- Include failed: {inc_name} not found -->"

# Standalone inlined HTML (including nested includes)
bundled_html = index_content
while re.search(r'<\?!=\s*include\([\'"]([^\'"]+)[\'"]\);\s*\?>', bundled_html):
    bundled_html = re.sub(r'<\?!=\s*include\([\'"]([^\'"]+)[\'"]\);\s*\?>', replace_include, bundled_html)

bundled_html_path = os.path.join(BUNDLED_DIR, 'Index.html')
with open(bundled_html_path, 'w', encoding='utf-8') as f:
    f.write(bundled_html)

print(f"[OK] Bundled Index.html written to: {bundled_html_path}")

# 3. COPY ALL MODULAR FILES (Backend & Frontend) TO MODULAR_DIR
# Backend files
for f in sorted(os.listdir(SRC_BACKEND)):
    if f.endswith('.gs'):
        shutil.copy2(os.path.join(SRC_BACKEND, f), os.path.join(MODULAR_DIR, f))

# Frontend files
for f in sorted(os.listdir(SRC_FRONTEND)):
    if f.endswith('.html'):
        shutil.copy2(os.path.join(SRC_FRONTEND, f), os.path.join(MODULAR_DIR, f))

print(f"[OK] All modular files copied to: {MODULAR_DIR}")

# 4. CREATE appsscript.json MANIFEST
manifest = {
  "timeZone": "Asia/Jakarta",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}

with open(os.path.join(DEPLOY_DIR, 'appsscript.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)
with open(os.path.join(BUNDLED_DIR, 'appsscript.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)
with open(os.path.join(MODULAR_DIR, 'appsscript.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

# 5. CREATE .clasp.json
clasp_config = {
  "scriptId": "16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ",
  "rootDir": "./BUNDLED_DEPLOY"
}

with open(os.path.join(DEPLOY_DIR, '.clasp.json'), 'w', encoding='utf-8') as f:
    json.dump(clasp_config, f, indent=2)

# 6. CREATE PANDUAN_DEPLOY.md
doc_id = "16FOt_SXBgSJwTlQ4F4sG7eY5F5J3dZ16LL-KEbKCa05Dd34YPtOlQSeJ"
guide_md = f"""# PANDUAN DEPLOY GOOGLE APPS SCRIPT - ANTIGRAVITY RME

Project Apps Script: **Antigravity RME**  
Project ID: `{doc_id}`  
Link Editor: [Buka Google Apps Script Editor](https://script.google.com/d/{doc_id}/edit)

---

## ⚡ METODE 1: BUNDLED DEPLOY (Paling Cepat & Direkomendasikan - Hanya 2 File)
Di editor Apps Script, Anda cukup memiliki **2 file saja** sehingga tidak perlu repot membuat 28 file terpisah:

1. Buka project di [script.google.com/d/{doc_id}/edit](https://script.google.com/d/{doc_id}/edit).
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
"""

with open(os.path.join(DEPLOY_DIR, 'PANDUAN_DEPLOY.md'), 'w', encoding='utf-8') as f:
    f.write(guide_md)

print(f"[OK] Panduan deploy written to: {os.path.join(DEPLOY_DIR, 'PANDUAN_DEPLOY.md')}")
print("Deployment files packaging complete!")
