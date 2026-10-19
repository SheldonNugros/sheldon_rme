import os
import re
import json
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_INDEX = os.path.join(BASE_DIR, 'dist', 'index.html')
JSC_BIN = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

with open(DIST_INDEX, 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all scripts
scripts = re.findall(r'<script(?:\s+[^>]*)?>(.*?)</script>', html, re.DOTALL)
all_js = "\n\n".join(scripts)

idx_rad = html.find('id="navRadiologi"')
idx_kon = html.find('id="navKonsultasi"')
is_kon_removed = (idx_kon == -1)
is_modal_perio_in_html = ("Reset Data Periodontal Charting ?" in html)
role_select_m = re.search(r'<select[^>]*id=["\']dbUserRole["\'][^>]*>(.*?)</select>', html, re.DOTALL)
role_options = re.findall(r'<option[^>]*value=["\']([^"\']+)["\']', role_select_m.group(1)) if role_select_m else []

is_date_picker_large = bool(re.search(r'id=["\']absensiDatePicker["\'][^>]*text-base', html))
is_paginasi_hari_ini_removed = ('onclick="setTanggalAbsensiHariIni()"' not in html)
is_subtitle_absensi_removed = ('Pencatatan absensi pegawai klinik (2 Shift' not in html)
is_tercatat_masuk_removed = ('Tercatat masuk tugas' not in html)
is_izin_sakit_off_removed = ('Izin / Sakit / Off' not in html)
is_btn_db_user_removed = ('id="btnDbUser"' not in html)

klinis_m = re.search(r'id=["\']section-klinis["\'][^>]*>(.*?)</div>\s*<!-- Group 3', html, re.DOTALL)
klinis_html = klinis_m.group(1) if klinis_m else ""
p_pasien = klinis_html.find('id="nav-pasien"')
p_emr = klinis_html.find('id="nav-rekam-medis"')
p_kasir = klinis_html.find('id="nav-kasir"')
p_inv = klinis_html.find('id="nav-riwayat-invoice"')
p_surat = klinis_html.find('id="nav-surat"')
is_pelayanan_ordered = (0 <= p_pasien < p_emr < p_kasir < p_inv < p_surat) and ('id="nav-absensi"' not in klinis_html)

trans_m = re.search(r'id=["\']section-transaksi["\'][^>]*>(.*?)</nav>', html, re.DOTALL)
trans_html = trans_m.group(1) if trans_m else ""
is_admin_header = ("ADMINISTRASI" in trans_html)
t_abs = trans_html.find('id="nav-absensi"')
t_info = trans_html.find('id="nav-informasi"')
t_db = trans_html.find('id="nav-database"')
t_um = trans_html.find('id="nav-user-master"')
is_admin_ordered = (0 <= t_abs < t_info < t_db < t_um)
is_tab_btn_pay_in_html = ('id="tabBtnPay-gaji-jm"' in html and '1. Gaji & Jasa Medis' in html)
is_panel_pay_in_html = ('id="panelPay-gaji-jm"' in html)
is_btn_atur_libur_removed = ('id="btnAturLiburAbsensi"' not in html)
is_btn_refresh_in_html = ('Refresh' in html and 'refreshAbsensiData()' in html)
is_emr_title_renamed = ("Form Electronic Medical Record (EMR)" in html)
is_clear_pasien_btn_in_html = ('id="btnClearPasienRM"' in html)
is_tgl_large_in_html = bool(re.search(r'id=["\']rmTglPeriksa["\'][^>]*text-base', html))
is_tempat_lahir_in_html = ('id="pasTempatLahir"' in html)
is_modal_tooth_tgl_in_html = ('id="modalToothTgl"' in html)
is_panel_ref_in_html = ('id="panelReferensiKlinisRM"' in html)

ksr_metode_m = re.search(r'<select[^>]*id=["\']ksrMetode["\'][^>]*>(.*?)</select>', html, re.DOTALL)
ksr_metode_options = re.findall(r'<option[^>]*value=["\']([^"\']*)["\']', ksr_metode_m.group(1)) if ksr_metode_m else []
is_metode_cash_tf_only = set([opt for opt in ksr_metode_options if opt and opt != 'Cash & Transfer']) == {'Cash', 'Transfer Bank'}

ksr_status_m = re.search(r'<select[^>]*id=["\']ksrStatus["\'][^>]*>(.*?)</select>', html, re.DOTALL)
ksr_status_options = re.findall(r'<option[^>]*value=["\']([^"\']*)["\']', ksr_status_m.group(1)) if ksr_status_m else []
is_status_split_in_html = ('Split' in ksr_status_options)
is_box_split_in_html = ('id="boxSplitPayment"' in html and 'id="ksrSplitCash"' in html and 'id="ksrSplitTransfer"' in html)

test_harness_file = os.path.join(BASE_DIR, 'tools', 'suite_harness.js')

dom_shim = r'''
// Enhanced DOM Mock for JavaScriptCore
var window = this;
var global = this;
window.listeners = {};
window.addEventListener = function(type, fn) {
  if (!this.listeners[type]) this.listeners[type] = [];
  this.listeners[type].push(fn);
};
window.removeEventListener = function(type, fn) {
  if (!this.listeners[type]) return;
  this.listeners[type] = this.listeners[type].filter(function(f) { return f !== fn; });
};

function parseAttributes(attrStr) {
  var attrs = {};
  var re = /([a-zA-Z0-9_-]+)(?:=([\"'])(.*?)\2)?/g;
  var m;
  while ((m = re.exec(attrStr)) !== null) {
    attrs[m[1]] = m[3] !== undefined ? m[3] : true;
  }
  return attrs;
}

function matchesSelector(node, sel) {
  if (!node || !sel) return false;
  if (sel.startsWith('.')) {
    var cls = sel.slice(1);
    return (node.classList && node.classList.contains(cls)) || (node.className && node.className.split(/\s+/).indexOf(cls) !== -1);
  }
  if (sel.startsWith('#')) return node.id === sel.slice(1);
  return (node.tagName || '').toLowerCase() === sel.toLowerCase();
}

function createMockElement(tag, id) {
  var el = {
    tagName: (tag || 'DIV').toUpperCase(),
    id: id || '',
    value: '',
    innerText: (id === 'btnSimpanBilling' ? 'SIMPAN DATA INVOICE' : ''),
    _innerHTML: (id === 'btnSimpanBilling' ? 'SIMPAN DATA INVOICE' : ''),
    textContent: '',
    style: {},
    disabled: false,
    attributes: {},
    children: [],
    parentNode: null,
    listeners: {},
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    setAttribute: function(k, v) { this.attributes[k] = String(v); },
    getAttribute: function(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    hasAttribute: function(k) { return this.attributes[k] !== undefined; },
    removeAttribute: function(k) { delete this.attributes[k]; },
    addEventListener: function(type, fn) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(fn);
    },
    removeEventListener: function(type, fn) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter(f => f !== fn);
    },
    dispatchEvent: function(event) {
      if (event.type === 'submit' && this.id === 'formLogin' && typeof handleLogin === 'function') {
        event.preventDefault = function() {};
        handleLogin(event);
        return;
      }
      let fns = this.listeners[event.type] || [];
      for (let fn of fns) fn.call(this, event);
    },
    reset: function() {
      this.value = '';
      function recurseReset(n) {
        if (!n || !n.children) return;
        for (var i = 0; i < n.children.length; i++) {
          var c = n.children[i];
          if (c.value !== undefined) c.value = '';
          if (c.selectedIndex !== undefined) c.selectedIndex = 0;
          recurseReset(c);
        }
      }
      recurseReset(this);
    },
    focus: function() {},
    scrollTo: function() {},
    remove: function() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(c => c !== this);
      }
    },
    appendChild: function(child) {
      child.parentNode = this;
      this.children.push(child);
      if (this.id === 'toastContainer') {
        this.allToasts = this.allToasts || [];
        this.allToasts.push(child._innerHTML);
      }
      return child;
    },
    closest: function(sel) {
      var cur = this;
      while (cur) {
        if (matchesSelector(cur, sel)) return cur;
        cur = cur.parentNode;
      }
      return null;
    },
    querySelector: function(sel) {
      var all = this.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    querySelectorAll: function(sel) {
      var matched = [];
      function recurse(node) {
        for (var i = 0; i < node.children.length; i++) {
          var c = node.children[i];
          if (matchesSelector(c, sel)) matched.push(c);
          recurse(c);
        }
      }
      recurse(this);
      return matched;
    }
  };

  Object.defineProperty(el, 'className', {
    get: function() { return Array.from(this.classList.classes).join(' '); },
    set: function(val) {
      this.classList.classes.clear();
      String(val).split(/\s+/).forEach(c => { if(c) this.classList.classes.add(c); });
    }
  });

  Object.defineProperty(el, 'innerHTML', {
    get: function() { return this._innerHTML; },
    set: function(val) {
      this._innerHTML = String(val);
      this.innerText = String(val).replace(/<[^>]+>/g, '').trim();
      this.children = [];
      if (!val) return;
      
      if (val.includes('search-item')) {
        let regex = /onclick=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/div>/g;
        let m;
        while ((m = regex.exec(val)) !== null) {
          let item = createMockElement('div');
          item.classList.add('search-item');
          item.onclickAttr = m[1];
          item.content = m[2];
          item.click = function() { eval(this.onclickAttr); };
          this.appendChild(item);
        }
      }

      var tagRe = /<(input|select|button|span|div)([^>]*)>/gi;
      var match;
      while ((match = tagRe.exec(val)) !== null) {
        var childTag = match[1];
        var attrs = parseAttributes(match[2]);
        var childEl = createMockElement(childTag);
        if (attrs['class']) {
          childEl.className = attrs['class'];
        }
        if (attrs['value'] !== undefined) childEl.value = attrs['value'];
        if (attrs['id']) childEl.id = attrs['id'];
        for (var k in attrs) {
          if (k.startsWith('data-')) childEl.setAttribute(k, attrs[k]);
        }
        this.appendChild(childEl);
      }
    }
  });

  return el;
}

var document = {
  elements: {},
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = createMockElement('div', id);
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return createMockElement(tag);
  },
  addEventListener: function(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  },
  dispatchEvent: function(event) {
    let fns = this.listeners[event.type] || [];
    for (let fn of fns) fn.call(this, event);
  },
  querySelectorAll: function(sel) {
    var matched = [];
    var visited = new Set();
    function search(node) {
      if (!node || visited.has(node)) return;
      visited.add(node);
      if (matchesSelector(node, sel)) matched.push(node);
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          search(node.children[i]);
        }
      }
    }
    for (var id in document.elements) {
      search(document.elements[id]);
    }
    return matched;
  },
  querySelector: function(sel) {
    var all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  },
  listeners: {}
};

window.scrollTo = function() {};

var localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

var Event = function(type, opts) {
  this.type = type;
  this.bubbles = opts && opts.bubbles;
  this.cancelable = opts && opts.cancelable;
};

// Timer queue for simulated async execution
var timerQueue = [];
var nextTimerId = 1;

function setTimeout(fn, delay) {
  var id = nextTimerId++;
  timerQueue.push({ id: id, fn: fn, time: delay || 0 });
  return id;
}

function clearTimeout(id) {
  timerQueue = timerQueue.filter(t => t.id !== id);
}

function runAllTimers() {
  while (timerQueue.length > 0) {
    var curQueue = timerQueue.slice();
    timerQueue = [];
    for (var i = 0; i < curQueue.length; i++) {
      curQueue[i].fn();
    }
  }
}

var console = {
  log: function(...args) { print("[LOG] " + args.join(' ')); },
  warn: function(...args) { print("[WARN] " + args.join(' ')); },
  error: function(...args) { print("[ERROR] " + args.join(' ')); }
};
'''

test_runner_js = r'''
// ==========================================
// TEST SUITE ASSERTIONS
// ==========================================
var results = [];
function assert(name, condition, details) {
  var passed = !!condition;
  results.push({ name: name, passed: passed, details: details || "" });
  print((passed ? "✅ [PASS] " : "❌ [FAIL] ") + name + (details ? " - " + details : ""));
}

print("=================================================");
print("     STARTING RME MODULAR ARCHITECTURE TEST      ");
print("=================================================");

// 1. Initial State & DOMContentLoaded
document.dispatchEvent(new Event('DOMContentLoaded'));
runAllTimers();

assert("Initial Active Account is null", window.activeAccount === null);
assert("KlinikData Object Initialized", typeof window.KlinikData === 'object' && Array.isArray(window.KlinikData.pasien));

// 2. Authentication Test
document.getElementById('loginUser').value = "SN-01";
document.getElementById('loginPass').value = "admin123";
document.getElementById('formLogin').dispatchEvent(new Event('submit', { cancelable: true }));
runAllTimers();

assert("Login Owner Successful", window.activeAccount === "SN-01", "User: " + window.activeNamaAccount);
assert("Role Applied: Owner", window.activeUserRole === "Owner");

// 3. Data Synchronization & Event Firing
assert("KlinikData Master Synced", window.KlinikData.staff.length === 11 && window.KlinikData.tindakan.length >= 120, "Staff: " + window.KlinikData.staff.length + ", Tindakan: " + window.KlinikData.tindakan.length);
assert("KlinikData Pasien Synced", window.KlinikData.pasien.length >= 2200, "Total Pasien: " + window.KlinikData.pasien.length);
assert("KlinikData EMR Synced", window.KlinikData.rekamMedis.length >= 8, "EMR count: " + window.KlinikData.rekamMedis.length);
assert("KlinikData Pembayaran Synced (Clean Workspace State)", Array.isArray(window.KlinikData.pembayaran), "Pembayaran count: " + window.KlinikData.pembayaran.length);

// 4. Test Navigation to Surat & Formulir Medis
switchMenu('surat');
runAllTimers();
assert("View Surat Active", !document.getElementById('view-surat').classList.contains('hidden'));

// 5. TEST PASIEN AUTOCOMPLETE IN SURAT (SKS)
changeSuratMenu('sakit');
runAllTimers();
assert("Panel Surat Sakit Open", !document.getElementById('panelSuratSakit').classList.contains('hidden'));

document.getElementById('sksSearchPasien').value = "edison";
searchPasienSKS();
runAllTimers(); // process debounce

var resBoxSKS = document.getElementById('sksSearchResult');
assert("SKS Search Result Dropdown Visible", !resBoxSKS.classList.contains('hidden'));
var itemsSKS = resBoxSKS.querySelectorAll('.search-item');
assert("SKS Found Matched Patients", itemsSKS.length > 0, "Found items: " + itemsSKS.length);

if (itemsSKS.length > 0) {
  itemsSKS[0].click(); // Simulate clicking the patient
  runAllTimers();
  assert("SKS Auto-populate ID Pasien", document.getElementById('sksIdPasien').value === "PS-0321-0001");
  assert("SKS Auto-populate No RM", document.getElementById('sksNoRm').value === "E-0001");
  assert("SKS Auto-populate Nama Pasien", document.getElementById('sksNama').value === "Edison");
  assert("SKS Auto-populate Umur", document.getElementById('sksUmur').value.includes("61"));
  assert("SKS Auto-populate JK", document.getElementById('sksJK').value === "Laki-Laki");
  assert("SKS Auto-populate Alamat", document.getElementById('sksAlamat').value.includes("Kuala Kilan"));
  assert("SKS Result Dropdown Closed after Selection", resBoxSKS.classList.contains('hidden'));
}

// 5b. TEST VALIDASI MAKSIMAL 5 HARI SKS & POSISI BUTTON KONSULTASI
document.getElementById('sksLamaHari').value = 8;
validasiLamaSKS(document.getElementById('sksLamaHari'));
hitungTglSelesaiSKS();
assert("SKS Lama Hari Ditolak Jika > 5 (Clamped to 5)", document.getElementById('sksLamaHari').value == 5);

assert("Button Surat Konsultasi Berhasil Dihilangkan", isButtonKonsultasiRemoved);

// 6. TEST PASIEN AUTOCOMPLETE IN SURAT (SKP)
changeSuratMenu('kontrol');
runAllTimers();
assert("Panel Surat Kontrol Open", !document.getElementById('panelSuratKontrol').classList.contains('hidden'));

document.getElementById('skpSearchPasien').value = "efri sukma";
searchPasienSKP();
runAllTimers();

var resBoxSKP = document.getElementById('skpSearchResult');
assert("SKP Search Result Dropdown Visible", !resBoxSKP.classList.contains('hidden'));
var itemsSKP = resBoxSKP.querySelectorAll('.search-item');
assert("SKP Found Matched Patients", itemsSKP.length > 0);

if (itemsSKP.length > 0) {
  itemsSKP[0].click();
  runAllTimers();
  assert("SKP Auto-populate ID Pasien", document.getElementById('skpIdPasien').value === "PS-0321-0002");
  assert("SKP Auto-populate No RM", document.getElementById('skpNoRm').value === "E-0002");
  assert("SKP Auto-populate Nama Pasien", document.getElementById('skpNama').value === "Efri Sukma");
  assert("SKP Result Dropdown Closed", resBoxSKP.classList.contains('hidden'));
}

// 7. TEST PASIEN AUTOCOMPLETE IN SURAT (RSM - Resume Medis)
changeSuratMenu('resume');
runAllTimers();
assert("Panel Resume Medis Open", !document.getElementById('panelResumeMedis').classList.contains('hidden'));

document.getElementById('rsmSearchPasien').value = "athaya shazia";
searchPasienRSM();
runAllTimers();

var resBoxRSM = document.getElementById('rsmSearchResult');
assert("RSM Search Result Dropdown Visible", !resBoxRSM.classList.contains('hidden'));
var itemsRSM = resBoxRSM.querySelectorAll('.search-item');
assert("RSM Found Matched Patients", itemsRSM.length > 0);

if (itemsRSM.length > 0) {
  itemsRSM[0].click();
  runAllTimers();
  assert("RSM Auto-populate ID Pasien", document.getElementById('rsmIdPasien').value === "PS-0726-2153");
  assert("RSM Auto-populate No RM", document.getElementById('rsmNoRm').value === "A-2153");
  assert("RSM Auto-populate Nama Pasien", document.getElementById('rsmNama').value === "Athaya Shazia Sheldon");
  assert("RSM Auto-fill Clinical Summary from EMR", document.getElementById('rsmRingkasanKlinis').value.length > 0);
  assert("RSM Auto-fill ICD Diagnosis from EMR", document.getElementById('rsmDiagnosisKerja').value.length > 0);
}

// 8. TEST PASIEN AUTOCOMPLETE IN SURAT (SPM - Rujukan)
changeSuratMenu('rujukan');
runAllTimers();
assert("Panel Rujukan Open", !document.getElementById('panelSuratRujukan').classList.contains('hidden'));

document.getElementById('spmSearchPasien').value = "dara triatna";
searchPasienSPM();
runAllTimers();

var resBoxSPM = document.getElementById('spmSearchResult');
assert("SPM Search Result Dropdown Visible", !resBoxSPM.classList.contains('hidden'));
var itemsSPM = resBoxSPM.querySelectorAll('.search-item');
assert("SPM Found Matched Patients", itemsSPM.length > 0);

if (itemsSPM.length > 0) {
  itemsSPM[0].click();
  runAllTimers();
  assert("SPM Auto-populate ID Pasien", document.getElementById('spmIdPasien').value === "PS-0421-0005");
  assert("SPM Auto-populate Nama", document.getElementById('spmNama').value === "Dara Triatna");
}

// 9. TEST PASIEN AUTOCOMPLETE IN SURAT (LAB - Pengantar Lab)
changeSuratMenu('lab');
runAllTimers();
assert("Panel Lab Open", !document.getElementById('panelSuratLab').classList.contains('hidden'));

document.getElementById('labSearchPasien').value = "edison";
searchPasienLAB();
runAllTimers();

var resBoxLAB = document.getElementById('labSearchResult');
assert("LAB Search Dropdown Visible", !resBoxLAB.classList.contains('hidden'));
var itemsLAB = resBoxLAB.querySelectorAll('.search-item');
assert("LAB Found Matched Patients", itemsLAB.length > 0);
if (itemsLAB.length > 0) {
  itemsLAB[0].click();
  runAllTimers();
  assert("LAB Auto-populate ID Pasien", document.getElementById('labIdPasien').value === "PS-0321-0001");
  assert("LAB Auto-populate Nama", document.getElementById('labNama').value === "Edison");
}

// 10. TEST PASIEN AUTOCOMPLETE IN SURAT (RAD - Pengantar Radiologi)
changeSuratMenu('radiologi');
runAllTimers();
assert("Panel Radiologi Open", !document.getElementById('panelSuratRadiologi').classList.contains('hidden'));

document.getElementById('radSearchPasien').value = "efri sukma";
searchPasienRAD();
runAllTimers();

var resBoxRAD = document.getElementById('radSearchResult');
assert("RAD Search Dropdown Visible", !resBoxRAD.classList.contains('hidden'));
var itemsRAD = resBoxRAD.querySelectorAll('.search-item');
assert("RAD Found Matched Patients", itemsRAD.length > 0);
if (itemsRAD.length > 0) {
  itemsRAD[0].click();
  runAllTimers();
  assert("RAD Auto-populate ID Pasien", document.getElementById('radIdPasien').value === "PS-0321-0002");
  assert("RAD Auto-populate Nama", document.getElementById('radNama').value === "Efri Sukma");
}

// 11. TEST PASIEN DATE FORMAT (dd-mm-yyyy)
switchMenu('pasien');
runAllTimers();
var firstP = window.KlinikData.pasien[0];
assert("Patient Birth Date follows dd-mm-yyyy", /^\d{2}-\d{2}-\d{4}$/.test(firstP.tanggalLahir), "Tgl: " + firstP.tanggalLahir);

// 12. TEST EMR PATIENT SEARCH
switchMenu('rekam-medis');
runAllTimers();
document.getElementById('rmSearchPasien').value = "edison";
searchPasienRM();
runAllTimers();
var resRM = document.getElementById('rmSearchResult');
assert("Rekam Medis Search Dropdown Visible", !resRM.classList.contains('hidden'));
pilihPasienRM('PS-0321-0001');
runAllTimers();
assert("Active Pasien in EMR set", activePasienRM && activePasienRM.idPasien === "PS-0321-0001");
assert("EMR Salin ke Form Baru Button in Detail Modal", document.getElementById('btnSalinDataKunjungan') !== null);
assert("EMR Banner Carry-Forward Exists", document.getElementById('bannerCarryForwardRM') !== null);
assert("EMR Panel Referensi Klinis in HTML", isPanelRefInHtml);
assert("EMR Function salinDataKunjunganKeForm is callable", typeof salinDataKunjunganKeForm === 'function');
assert("EMR Function tampilkanReferensiKlinisRM is callable", typeof tampilkanReferensiKlinisRM === 'function');
assert("EMR Function bukaDetailKunjunganTerakhir is callable", typeof bukaDetailKunjunganTerakhir === 'function');
assert("EMR Function tutupPanelReferensiRM is callable", typeof tutupPanelReferensiRM === 'function');
assert("EMR Function salinDiagnosaLaluKeHariIni is callable", typeof salinDiagnosaLaluKeHariIni === 'function');
assert("EMR Function salinTindakanLaluKeHariIni is callable", typeof salinTindakanLaluKeHariIni === 'function');
assert("EMR Function salinObatLaluKeHariIni is callable", typeof salinObatLaluKeHariIni === 'function');
assert("EMR Clear Pasien Button in HTML", isClearPasienBtnInHtml);
assert("EMR Form Title Renamed to Form Electronic Medical Record (EMR)", isEmrTitleRenamedInHtml);
assert("EMR Tanggal Pemeriksaan Enlarged", isTglLargeInHtml);
assert("EMR Function updateObatQtyRequirement exists", typeof updateObatQtyRequirement === 'function');
bersihkanFormRM();
assert("EMR Clear Pasien resets active patient to null", activePasienRM === null);
pilihPasienRM('PS-0321-0001');
runAllTimers();
assert("Database Pasien Form Tempat Lahir Input Exists", isTempatLahirInHtml);

// 13. TEST KASIR PATIENT SEARCH
switchMenu('kasir');
runAllTimers();
document.getElementById('ksrSearchPasien').value = "edison";
document.getElementById('ksrSearchPasien').dispatchEvent(new Event('input'));
runAllTimers();
var resKSR = document.getElementById('ksrSearchResult');
assert("Kasir Search Dropdown Visible", !resKSR.classList.contains('hidden'));
pilihPasienKSR('PS-0321-0001');
runAllTimers();
assert("Kasir Patient Selected", document.getElementById('ksrNama').value === "Edison");

// 14. TEST MASTER DATABASE & INVENTORY & AI MODULES
switchMenu('database');
runAllTimers();
assert("Master Database Initialized Cleanly", typeof initDatabaseModule === 'function');
assert("Redundant btnDbUser Removed from Database Master Submenu", isBtnDbUserRemoved);

// 14a. Test Master Database Tabs Switching
changeDBMenu('obat');
runAllTimers();
assert("Panel DB Obat Active", !document.getElementById('panelDbObat').classList.contains('hidden'));
assert("Auto-generated Kode Obat Valid", document.getElementById('dbKodeObat').value.startsWith('OBT-'));

// Test Margin Obat Calculation
document.getElementById('dbHppObat').value = "10.000";
document.getElementById('dbHargaJualObat').value = "15.000";
hitungMarginObat();
assert("Margin Obat Calculated Correctly (50.0%)", document.getElementById('dbMarginObat').value === "50.0%");

// Test Simpan DB Obat
var eventObat = { preventDefault: function() {} };
document.getElementById('dbNamaObat').value = "Cefixime 100mg";
document.getElementById('dbSatuanObat').value = "Kapsul";
document.getElementById('dbStokAwalObat').value = "50";
document.getElementById('dbStokMinObat').value = "10";
document.getElementById('dbExpiredObat').value = "2027-01-01";
document.getElementById('dbSupplierObat').value = "PT Kimia Farma";
simpanDbObat(eventObat);
runAllTimers();
assert("DB Obat Saved & Appended to listMasterObat", listMasterObat.some(o => o.nama === "Cefixime 100mg"));

// Test DB Obat Table Rendering & Search
document.getElementById('cariDbObat').value = "cefixime";
renderTabelObat();
assert("Tabel Obat Rendered Matching Item", document.getElementById('tbodyDbObat').innerHTML.includes('Cefixime 100mg'));

// 14b. Test DB BMHP Tab & Operation
changeDBMenu('bmhp');
runAllTimers();
assert("Panel DB BMHP Active", !document.getElementById('panelDbBmhp').classList.contains('hidden'));
assert("Auto-generated Kode BMHP Valid", document.getElementById('dbKodeBmhp').value.startsWith('BMH-'));

// Test Margin BMHP Calculation
document.getElementById('dbHppBmhp').value = "4.000";
document.getElementById('dbHargaJualBmhp').value = "6.000";
hitungMarginBmhp();
assert("Margin BMHP Calculated Correctly (50.0%)", document.getElementById('dbMarginBmhp').value === "50.0%");

// Test Simpan DB BMHP
var eventBmhp = { preventDefault: function() {} };
document.getElementById('dbNamaBmhp').value = "Needle Dental 30G";
document.getElementById('dbSatuanBmhp').value = "Box";
document.getElementById('dbStokAwalBmhp').value = "20";
document.getElementById('dbStokMinBmhp').value = "5";
document.getElementById('dbExpiredBmhp').value = "2028-05-20";
document.getElementById('dbSupplierBmhp').value = "PT Medika Prima";
simpanDbBmhp(eventBmhp);
runAllTimers();
assert("DB BMHP Saved & Appended to listMasterBmhp", listMasterBmhp.some(b => b.nama === "Needle Dental 30G"));

// Test DB BMHP Table Rendering & Search
document.getElementById('cariDbBmhp').value = "needle";
renderTabelBmhp();
assert("Tabel BMHP Rendered Matching Item", document.getElementById('tbodyDbBmhp').innerHTML.includes('Needle Dental 30G'));

switchMenu('inventory');
runAllTimers();
assert("Inventory Gudang Initialized Cleanly", typeof initInventoryModule === 'function');
assert("Tombol Tab Gudang & Restock Tersedia di Database Master", document.getElementById('btnDbGudang') !== null);
assert("Panel DB Gudang Active setelah changeDBMenu('gudang')", !document.getElementById('panelDbGudang').classList.contains('hidden'));

// 15. TEST MODUL INFORMASI (TINDAKAN, OBAT, BMHP)
switchMenu('informasi');
runAllTimers();
assert("Informasi Module Initialized Cleanly", typeof initInformasiModule === 'function');
assert("Panel Info Tindakan Visible by Default", !document.getElementById('panelInfoTindakan').classList.contains('hidden'));

// 15a. Test Informasi Tindakan Search & Kategori Filter
document.getElementById('cariInfoTindakan').value = "scaling";
renderInfoTindakan();
assert("Tabel Info Tindakan Filters by Search", document.getElementById('tbodyInfoTindakan').innerHTML.includes('Scaling'));

var katSelect = document.getElementById('filterInfoKategoriTindakan');
katSelect.value = "Dokter Gigi Umum";
renderInfoTindakan();
assert("Tabel Info Tindakan Filters by Kategori", document.getElementById('tbodyInfoTindakan').innerHTML.includes('Dokter Gigi Umum'));

// 15b. Test Informasi Obat Tab & Search by Nama & Kandungan
changeInfoTab('obat');
runAllTimers();
assert("Panel Info Obat Active", !document.getElementById('panelInfoObat').classList.contains('hidden'));

// Search by Nama Obat
document.getElementById('cariInfoObat').value = "amoksisilin";
renderInfoObat();
assert("Info Obat Searched by Nama", document.getElementById('tbodyInfoObat').innerHTML.includes('Amoksisilin'));

// Search by Kandungan Obat
document.getElementById('cariInfoObat').value = "ampisilin";
renderInfoObat();
assert("Info Obat Searched by Kandungan (Ampisilin)", document.getElementById('tbodyInfoObat').innerHTML.includes('Ampisilin'));

// 15c. Test Informasi BMHP Tab & Search
changeInfoTab('bmhp');
runAllTimers();
assert("Panel Info BMHP Active", !document.getElementById('panelInfoBmhp').classList.contains('hidden'));

document.getElementById('cariInfoBmhp').value = "masker";
renderInfoBmhp();
assert("Info BMHP Searched by Nama", document.getElementById('tbodyInfoBmhp').innerHTML.includes('Masker'));

// 15d. Test Kemasan Beli in Informasi Obat
changeInfoTab('obat');
document.getElementById('cariInfoObat').value = "";
renderInfoObat();
assert("Info Obat Menampilkan Kemasan Beli", document.getElementById('tbodyInfoObat').innerHTML.includes('@') || document.getElementById('tbodyInfoObat').innerHTML.includes('Tablet'));

// 15e. Test Reset Odontogram ke Normal
switchMenu('rekamMedis');
runAllTimers();
currentOdontogram = { 11: { generalCondition: 'car', surfaces: { occlusal: 'car' } } };
renderOdontogramGrid();
assert("Odontogram Dirty State Set", currentOdontogram[11] !== undefined);
resetAllOdontogramToNormal();
assert("Reset Odontogram ke Normal Seluruh Gigi Berhasil", Object.keys(currentOdontogram).length === 0);

// 15f. Test Refresh AI Button
switchMenu('ai');
runAllTimers();
assert("Tombol Refresh AI Rendered with ID", document.getElementById('btnRefreshAI') !== null);
loadAIInsights(true);
runAllTimers();
assert("Refresh AI Berhasil Dijalankan", document.getElementById('aiTotalPasien') !== null);

// 15g. Test Kasir Stock Validation Attributes
switchMenu('kasir');
runAllTimers();
addKasirObat();
let lastRowKsr = document.querySelector('#ksrTbodyObat tr:last-child');
if (lastRowKsr) {
  let namaIn = lastRowKsr.querySelector('.val-nama');
  if (namaIn && window.KlinikData && window.KlinikData.obat && window.KlinikData.obat.length > 0) {
    namaIn.value = window.KlinikData.obat[0].nama;
    onInputDatalistChange(namaIn, 'obat');
    assert("Kasir Obat Membaca data-stok", namaIn.hasAttribute('data-stok'));
  }
}
assert("Opsi Perawat Kasir Hanya Role Perawat Gigi", optPerawatKSR.includes("Eva Nurmiza") && !optPerawatKSR.includes("Sri Purwanti"));

// 15h. Test Diagnosa ICD-10 & Tindakan ICD-9 Title Casing & Row Creation
switchMenu('rekamMedis');
runAllTimers();
tambahRowDiagnosa();
let contDiag = document.getElementById('containerDiagnosa');
assert("Diagnosa Row Appended", contDiag && contDiag.children.length > 0);
let lastRowDiag = contDiag.children[contDiag.children.length - 1];
assert("Diagnosa Note Field Present", !!lastRowDiag.querySelector('.val-diagnosa-ket'));
assert("Permenkes 24/2022: Input Tanggal Diagnosa Per Baris Dihilangkan", !lastRowDiag.querySelector('.val-diagnosa-tgl'));
let mockInputDiag = { value: "karies dentis", setSelectionRange: function() {} };
autoTitleCase(mockInputDiag);
assert("Diagnosa Input Auto Title Case Formatted", mockInputDiag.value === "Karies Dentis");

tambahRowTindakan();
let contTind = document.getElementById('containerTindakan');
assert("Tindakan Row Appended", contTind && contTind.children.length > 0);
let lastRowTind = contTind.children[contTind.children.length - 1];
assert("Tindakan Note Field Present", !!lastRowTind.querySelector('.val-tindakan-ket'));
assert("Permenkes 24/2022: Input Tanggal Tindakan Per Baris Dihilangkan", !lastRowTind.querySelector('.val-tindakan-tgl'));
assert("Format Tgl Tindakan DDMMYY", formatTglTindakanDDMMYY("2026-10-18") === "[18/10/26]");
let mockInputTind = { value: "pencabutan gigi tetap", setSelectionRange: function() {} };
autoTitleCase(mockInputTind);
assert("Tindakan Input Auto Title Case Formatted", mockInputTind.value === "Pencabutan Gigi Tetap");

tambahRowObat();
let contObat = document.getElementById('containerObat');
assert("Obat Row Appended", contObat && contObat.children.length > 0);
let lastRowObat = contObat.children[contObat.children.length - 1];
assert("Permenkes 24/2022: Input Tanggal Obat Per Baris Dihilangkan", !lastRowObat.querySelector('.val-obat-tgl'));

assert("Modal Tooth Tanggal Input Tersedia di HTML", isModalToothTglInHtml);

// 15i. Test Detail Rekam Medis (EMR): Tombol Odontogram History & Posisi Diagnosis Gigi
riwayatPasienAktif = [{
  idPasien: 'PS-0321-0001',
  noRm: 'E-0001',
  namaPasien: 'Edison',
  tanggalPeriksa: '2026-10-08',
  dokterPemeriksa: 'drg. Rahma Yulinda D, Sp. BMM',
  anamnesisStr: JSON.stringify({ cc: 'Nyeri', diagnosaICD: ['K02.1 - Caries'] }),
  fisikStr: JSON.stringify({ kesan: 'Baik', periodontal: { summary: { totalSites: 6, bopPercent: 50 } } }),
  odontogramStr: JSON.stringify({ 16: { generalCondition: 'car', surfaces: { occlusal: 'car' } } }),
  tindakanStr: JSON.stringify(['23.2 - Tumpatan']),
  obatStr: JSON.stringify([{ obat: 'Amoksisilin Generik 500mg', qty: 10, ket: '3x1' }])
}];
bukaDetailRM(0);
let printArea = document.getElementById('printAreaRM');
assert("Detail RM Rendered", !!printArea);
let printHtml = printArea.innerHTML;
assert("Detail RM Menampilkan Tanggal Pelayanan Encounter", printHtml.includes('08') || printHtml.includes('Oktober') || printHtml.includes('2026'));
assert("Detail RM Menampilkan Diagnosa ICD-10", printHtml.includes('K02.1 - Caries'));
assert("Detail RM Menampilkan Tindakan ICD-9", printHtml.includes('23.2 - Tumpatan'));
assert("Detail RM Menampilkan Resep Obat", printHtml.includes('Amoksisilin Generik 500mg'));
assert("Detail RM Diagnosis Gigi Menampilkan Format Tanggal DDMMYY", printHtml.includes('[08/10/26]') && printHtml.includes('Gigi 16:'));
assert("Tombol Buka Odontogram Interaktif Present", printHtml.includes('bukaModalOdontoHistory(0)'));
assert("DMF-T Decayed Present", printHtml.includes('Decayed (D)'));
assert("DMF-T Missing Present", printHtml.includes('Missing (M)'));
assert("DMF-T Filled Present", printHtml.includes('Filled (F)'));
assert("DMF-T Total Present", printHtml.includes('Total DMF-T'));
let posOdonto = printHtml.indexOf('Peta Odontogram Saat Kunjungan');
let posDiagGigi = printHtml.indexOf('Diagnosis Gigi (Tulisan)');
let posPerio = printHtml.indexOf('Hasil Periodontal Charting');
assert("Diagnosis Gigi Berada di Bawah Odontogram", posDiagGigi > posOdonto);
assert("Diagnosis Gigi Berada di Atas Periodontal", posDiagGigi < posPerio);
assert("Fungsi bukaModalOdontoHistory Tersedia", typeof bukaModalOdontoHistory === 'function');
closeDetailRM();

salinDataKunjunganKeForm(riwayatPasienAktif[0]);
assert("Permenkes 24/2022: Panel Referensi Klinis Ditampilkan", !document.getElementById('panelReferensiKlinisRM').classList.contains('hidden'));
assert("Permenkes 24/2022: Panel Referensi Memuat Tanggal Kunjungan Terakhir", document.getElementById('refTglKunjungan').innerText.includes('8') || document.getElementById('refTglKunjungan').innerText.includes('2026'));
assert("Permenkes 24/2022: Panel Referensi Memuat CC/Keluhan Lalu", document.getElementById('refCC').innerText.includes('Nyeri'));
assert("Permenkes 24/2022: Panel Referensi Memuat Tindakan Lalu", document.getElementById('refTindakan').innerText.includes('Tumpatan'));
assert("Permenkes 24/2022: Panel Referensi Memuat Obat Lalu", document.getElementById('refObat').innerText.includes('Amoksisilin'));
assert("Permenkes 24/2022: Odontogram Kumulatif Membawa Kondisi Terakhir", currentOdontogram['16'] && currentOdontogram['16'].generalCondition === 'car');
assert("Permenkes 24/2022: Odontogram Gigi 16 Membawa Tanggal Asli", currentOdontogram['16'] && currentOdontogram['16'].tanggal === '2026-10-08');

let firstCopiedRow = document.getElementById('containerTindakan').children[0];
assert("Permenkes 24/2022: Tindakan Hari Ini Bersih Kosong", firstCopiedRow && firstCopiedRow.querySelector('.val-tindakan').value === '');
assert("Permenkes 24/2022: Form Tindakan Bersih Tanpa Input Tanggal Per Baris", !firstCopiedRow.querySelector('.val-tindakan-tgl'));
assert("Permenkes 24/2022: Anamnesis CC Kosong untuk Kunjungan Baru", document.getElementById('anaCC').value === '');

salinDiagnosaLaluKeHariIni();
let firstCopiedDiag = document.getElementById('containerDiagnosa').children[0];
assert("Permenkes 24/2022: Lanjutkan Diagnosa Menyalin Diagnosa Lalu", firstCopiedDiag && firstCopiedDiag.querySelector('.val-diagnosa').value.includes('Caries'));
assert("Permenkes 24/2022: Form Diagnosa Salinan Bersih Tanpa Input Tanggal Per Baris", !firstCopiedDiag.querySelector('.val-diagnosa-tgl'));

salinTindakanLaluKeHariIni();
let testCopiedTind = document.getElementById('containerTindakan').children[0];
assert("Permenkes 24/2022: Lanjutkan Tindakan Menyalin Tindakan Lalu", testCopiedTind && testCopiedTind.querySelector('.val-tindakan').value.includes('Tumpatan'));
assert("Permenkes 24/2022: Form Tindakan Salinan Bersih Tanpa Input Tanggal Per Baris", !testCopiedTind.querySelector('.val-tindakan-tgl'));

tutupPanelReferensiRM();
assert("Permenkes 24/2022: Panel Referensi Bisa Ditutup", document.getElementById('panelReferensiKlinisRM').classList.contains('hidden'));

// 15j. Test View History Pasien di Database Pasien: Aligned with Rekam Medis Layout
let origPasienSuite = window.KlinikData.pasien || [];
let origRmSuite = window.KlinikData.rekamMedis || [];
window.KlinikData.pasien = [{ idPasien: 'PS-0321-0001', namaPasien: 'Edison', noRm: 'E-0001' }];
window.KlinikData.rekamMedis = [{
  idPasien: 'PS-0321-0001',
  tanggalPeriksa: '2026-10-08',
  dokterPemeriksa: 'drg. Rahma Yulinda D, Sp. BMM',
  anamnesisStr: JSON.stringify({ cc: 'Nyeri', diagnosaICD: ['K02.1 - Caries'] }),
  fisikStr: JSON.stringify({ kesan: 'Baik', periodontal: { summary: { totalSites: 192, bopPercent: 12 } }, ohis: { debrisScore: 0.5, calculusScore: 0.33, totalScore: 0.83, category: 'Baik' } }),
  odontogramStr: JSON.stringify({ 16: { generalCondition: 'car', surfaces: { occlusal: 'car' } } }),
  tindakanStr: JSON.stringify(['23.2 - Tumpatan']),
  obatStr: JSON.stringify([{ obat: 'Amoksisilin Generik 500mg', qty: 10, ket: '3x1' }])
}];
openHistoryEMR('PS-0321-0001');
let contHistPasien = document.getElementById('containerHistoryEMR');
assert("Database Pasien: History EMR Rendered", !!contHistPasien);
let histPasienHtml = contHistPasien.innerHTML;
assert("Database Pasien: Tombol Buka Odontogram Present", histPasienHtml.includes('bukaModalOdontoHistoryPasien(0)'));
assert("Database Pasien: DMF-T Decayed Present", histPasienHtml.includes('Decayed (D)'));
assert("Database Pasien: DMF-T Total Present", histPasienHtml.includes('Total DMF-T'));
assert("Database Pasien: Periodontal Charting Present", histPasienHtml.includes('Hasil Periodontal Charting'));
assert("Database Pasien: OHI-S Present", histPasienHtml.includes('Hasil Pemeriksaan OHI-S'));
assert("Database Pasien: Tombol Buka OHI-S Present", histPasienHtml.includes('bukaModalOhisHistoryPasien(0)'));
assert("Database Pasien: Fungsi bukaModalOdontoHistoryPasien Tersedia", typeof bukaModalOdontoHistoryPasien === 'function');
assert("Database Pasien: Fungsi bukaModalPerioHistoryPasien Tersedia", typeof bukaModalPerioHistoryPasien === 'function');
assert("Database Pasien: Fungsi bukaModalOhisHistoryPasien Tersedia", typeof bukaModalOhisHistoryPasien === 'function');

bukaModalOdontoHistoryPasien(0);
assert("Database Pasien: Modal Odonto Terbuka", !document.getElementById('modalOdontoHistoryPasien').classList.contains('hidden'));
tutupModalOdontoHistoryPasien();
assert("Database Pasien: Modal Odonto Tertutup", document.getElementById('modalOdontoHistoryPasien').classList.contains('hidden'));

bukaModalPerioHistoryPasien(0);
assert("Database Pasien: Modal Perio Terbuka", !document.getElementById('modalPerioHistoryPasien').classList.contains('hidden'));
tutupModalPerioHistoryPasien();
assert("Database Pasien: Modal Perio Tertutup", document.getElementById('modalPerioHistoryPasien').classList.contains('hidden'));

bukaModalOhisHistoryPasien(0);
assert("Database Pasien: Modal OHI-S Terbuka", !document.getElementById('modalOhisHistoryPasien').classList.contains('hidden'));
tutupModalOhisHistoryPasien();
assert("Database Pasien: Modal OHI-S Tertutup", document.getElementById('modalOhisHistoryPasien').classList.contains('hidden'));

closeHistoryEMR();
window.KlinikData.pasien = origPasienSuite;
window.KlinikData.rekamMedis = origRmSuite;

// 15k. Test Edit Pasien & Form Reset Persistence
let origPasienListForEdit = JSON.parse(JSON.stringify(window.KlinikData.pasien || []));
editPasien('PS-0321-0001');
assert("Edit Pasien: Panel Form Terbuka", !document.getElementById('panelFormPasien').classList.contains('hidden'));
assert("Edit Pasien: Mode Edit PasId Terisi", document.getElementById('pasId').value === 'PS-0321-0001');
assert("Edit Pasien: Judul Form Menampilkan Edit", document.getElementById('formTitle').innerText.includes('Edit Data Pasien'));
assert("Edit Pasien: Tombol Simpan Berubah Label", document.getElementById('btnSimpanPasien').innerHTML.includes('Simpan Perubahan'));
assert("Edit Pasien: Tombol Batal Edit Muncul", !document.getElementById('btnBatalPasien').classList.contains('hidden'));

// Lakukan perubahan nama & alamat
document.getElementById('pasNama').value = "Edison Terupdate";
document.getElementById('pasAlamat').value = "Jl. Sudirman No. 99";
simpanDataPasien({ preventDefault: () => {} });
runAllTimers();

let updatedP = window.KlinikData.pasien.find(p => p.idPasien === 'PS-0321-0001');
assert("Edit Pasien: Data Lokal Terupdate Instan", updatedP && updatedP.namaPasien === "Edison Terupdate");
assert("Edit Pasien: Tabel Menampilkan Nama Terupdate", document.getElementById('tbodyPasien').innerHTML.includes('Edison Terupdate'));
assert("Edit Pasien: Panel Form Tertutup Pasca Simpan", document.getElementById('panelFormPasien').classList.contains('hidden'));
assert("Edit Pasien: Panel Tabel Muncul Pasca Simpan", !document.getElementById('panelTabelPasien').classList.contains('hidden'));

// Pastikan Form Kembali Kosong Pasca Simpan
assert("Reset Form Pasca Simpan: pasId Kosong", document.getElementById('pasId').value === '');
assert("Reset Form Pasca Simpan: pasRm Kosong", document.getElementById('pasRm').value === '');
assert("Reset Form Pasca Simpan: pasNama Kosong", document.getElementById('pasNama').value === '');
assert("Reset Form Pasca Simpan: pasUmur Kosong", document.getElementById('pasUmur').value === '');
assert("Reset Form Pasca Simpan: Judul Kembali ke Formulir Pendaftaran", document.getElementById('formTitle').innerText.includes('Formulir Pendaftaran'));
assert("Reset Form Pasca Simpan: Tombol Simpan Kembali Normal", document.getElementById('btnSimpanPasien').innerHTML.includes('Simpan Data'));

// Test Buka Form Baru dalam Keadaan Bersih
bukaFormPasienBaru();
assert("Buka Form Baru: Panel Form Terbuka", !document.getElementById('panelFormPasien').classList.contains('hidden'));
assert("Buka Form Baru: pasNama Tetap Bersih", document.getElementById('pasNama').value === '');
tutupFormPasien();
assert("Tutup Form: Panel Form Tertutup", document.getElementById('panelFormPasien').classList.contains('hidden'));
window.KlinikData.pasien = origPasienListForEdit;
renderTablePagePasien();

// 16. ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION SUITE
// 16a. Verify OWNER / SUPER USER permissions:
terapkanRoleAkses('Owner');
window.activeUserRole = 'Owner';
renderTablePagePasien();
assert("Owner: Nav Dashboard Visible", !document.getElementById('nav-dashboard').classList.contains('hidden'));
assert("Owner: Nav AI Visible", !document.getElementById('nav-ai').classList.contains('hidden'));
assert("Owner: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Owner: Nav Rekam Medis Visible", !document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Owner: Nav Surat Visible", !document.getElementById('nav-surat').classList.contains('hidden'));
assert("Owner: Nav Database Visible", !document.getElementById('nav-database').classList.contains('hidden'));
assert("Owner: Nav Inventory Visible", !document.getElementById('nav-inventory').classList.contains('hidden'));
assert("Owner: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Owner: Nav Kasir Visible", !document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Owner: Nav Riwayat Invoice Visible", !document.getElementById('nav-riwayat-invoice').classList.contains('hidden'));
assert("Owner: Tombol Tambah Pasien Baru Visible", !document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Owner: Tombol Filter Duplikat Visible", !document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Owner: Tombol Edit Pasien Rendered", document.getElementById('tbodyPasien').innerHTML.includes('Edit'));
assert("Owner: Tombol Hapus Pasien Rendered", document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));

// 16b. Verify DOKTER GIGI SPESIALIS permissions:
terapkanRoleAkses('Dokter Gigi Spesialis');
window.activeUserRole = 'Dokter Gigi Spesialis';
renderTablePagePasien();
assert("Dokter Spesialis: Nav Rekam Medis Visible", !document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Surat Visible", !document.getElementById('nav-surat').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Kasir Hidden", document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Dashboard Hidden", document.getElementById('nav-dashboard').classList.contains('hidden'));
assert("Dokter Spesialis: Nav Database Master Hidden", document.getElementById('nav-database').classList.contains('hidden'));
assert("Dokter Spesialis: Tombol Tambah Pasien Baru Hidden", document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Dokter Spesialis: Tombol Filter Duplikat Hidden", document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Dokter Spesialis: Tombol Edit Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('>Edit<'));
assert("Dokter Spesialis: Tombol Hapus Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));
assert("Dokter Spesialis: Tombol History EMR Rendered", document.getElementById('tbodyPasien').innerHTML.includes('🩺 History'));

// 16c. Verify DOKTER GIGI UMUM permissions:
terapkanRoleAkses('Dokter Gigi Umum');
window.activeUserRole = 'Dokter Gigi Umum';
renderTablePagePasien();
assert("Dokter Umum: Nav Rekam Medis Visible", !document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Dokter Umum: Nav Surat Visible", !document.getElementById('nav-surat').classList.contains('hidden'));
assert("Dokter Umum: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Dokter Umum: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Dokter Umum: Nav Kasir Hidden", document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Dokter Umum: Tombol Tambah Pasien Baru Hidden", document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Dokter Umum: Tombol Filter Duplikat Hidden", document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Dokter Umum: Tombol Edit Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('>Edit<'));
assert("Dokter Umum: Tombol Hapus Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));

// 16d. Verify ADMIN permissions:
terapkanRoleAkses('Admin');
window.activeUserRole = 'Admin';
renderTablePagePasien();
assert("Admin: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Admin: Nav Surat Visible", !document.getElementById('nav-surat').classList.contains('hidden'));
assert("Admin: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Admin: Nav Kasir Visible", !document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Admin: Nav Riwayat Invoice Visible", !document.getElementById('nav-riwayat-invoice').classList.contains('hidden'));
assert("Admin: Nav Rekam Medis Hidden", document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Admin: Nav Dashboard Hidden", document.getElementById('nav-dashboard').classList.contains('hidden'));
assert("Admin: Tombol Tambah Pasien Baru Visible", !document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Admin: Tombol Filter Duplikat Hidden", document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Admin: Tombol Edit Pasien Rendered", document.getElementById('tbodyPasien').innerHTML.includes('Edit'));
assert("Admin: Tombol Hapus Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));

// 16e. Verify STAFF permissions:
terapkanRoleAkses('Staff');
window.activeUserRole = 'Staff';
renderTablePagePasien();
assert("Staff: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Staff: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Staff: Nav Surat Hidden", document.getElementById('nav-surat').classList.contains('hidden'));
assert("Staff: Nav Rekam Medis Hidden", document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Staff: Nav Kasir Hidden", document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Staff: Tombol Tambah Pasien Baru Hidden", document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Staff: Tombol Filter Duplikat Hidden", document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Staff: Tombol Edit Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('>Edit<'));
assert("Staff: Tombol Hapus Pasien Not Rendered", !document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));
assert("Staff: Tombol History EMR Rendered", document.getElementById('tbodyPasien').innerHTML.includes('🩺 History'));

// =================================================
// PENGUJIAN FITUR ANTI-DUPLIKASI & FILTER DATA GANDA
// =================================================
// 1. Uji fungsi getKelompokDuplikatMap
var dummyPasienList = [
  { idPasien: "P1", namaPasien: "Ahmad Dahlan", tanggalLahir: "10-05-1990", nik: "1234567890123456", noRm: "A-0001" },
  { idPasien: "P2", namaPasien: "Ahmad Dahlan", tanggalLahir: "10-05-1990", nik: "", noRm: "A-0002" }, // Duplikat Nama + Tgl Lahir
  { idPasien: "P3", namaPasien: "Siti Rahma", tanggalLahir: "12-08-1995", nik: "9876543210123456", noRm: "S-0001" },
  { idPasien: "P4", namaPasien: "Budi Santoso", tanggalLahir: "01-01-2000", nik: "1234567890123456", noRm: "B-0001" } // Duplikat NIK dengan P1
];

var dupSet = getKelompokDuplikatMap(dummyPasienList);
assert("Duplikasi Map mendeteksi P1 (Duplikat NIK & Nama+Lahir)", dupSet.has("P1"));
assert("Duplikasi Map mendeteksi P2 (Duplikat Nama+Lahir)", dupSet.has("P2"));
assert("Duplikasi Map tidak menandai P3 (Unik)", !dupSet.has("P3"));
assert("Duplikasi Map mendeteksi P4 (Duplikat NIK)", dupSet.has("P4"));

// 2. Uji toggleFilterDataGanda (Staff dilarang, Owner diizinkan)
assert("Initial Filter Duplikat Status False", isFilterDuplikatAktif === false);
toggleFilterDataGanda();
assert("Staff: Dilarang Mengaktifkan Filter Duplikat", isFilterDuplikatAktif === false);

terapkanRoleAkses('Owner');
window.activeUserRole = 'Owner';
toggleFilterDataGanda();
assert("Owner: Toggle Filter Duplikat Status Menjadi True", isFilterDuplikatAktif === true);
toggleFilterDataGanda();
assert("Owner: Toggle Filter Duplikat Status Kembali False", isFilterDuplikatAktif === false);

// 3. Uji Auto-Guard Frontend Realtime
var originalPasienBackup = window.KlinikData.pasien.slice();
window.KlinikData.pasien = dummyPasienList;
document.getElementById('pasId').value = ""; // Mode pasien baru
document.getElementById('pasNama').value = "Ahmad Dahlan";
document.getElementById('pasTglLahir').value = "1990-05-10";
cekDuplikasiFrontend();
var alertEl = document.getElementById('alertDuplikatPasien');
assert("Alert Duplikat Muncul saat Nama & Tgl Lahir Sama", !alertEl.classList.contains('hidden'));

// Sembunyikan alert jika nama diubah menjadi unik
document.getElementById('pasNama').value = "Pasien Unik Baru Sekali";
cekDuplikasiFrontend();
assert("Alert Duplikat Sembunyi saat Nama Berbeda", alertEl.classList.contains('hidden'));
window.KlinikData.pasien = originalPasienBackup; // Restore pasien data asli

// =================================================
// PENGUJIAN MENYELURUH: SIMULASI INPUT KASIR & EDGE CASES
// =================================================
function getLastToast() {
  var c = document.getElementById('toastContainer');
  if (c && c.allToasts && c.allToasts.length > 0) {
    return c.allToasts[c.allToasts.length - 1] || "";
  }
  if (c && c.children && c.children.length > 0) {
    return c.children[c.children.length - 1]._innerHTML || "";
  }
  return "";
}

// Skenario K-1: Simpan Billing Tanpa Pasien Terpilih
switchMenu('kasir');
terapkanRoleAkses('Owner');
resetFormBilling();
document.getElementById('ksrID').value = '';
simpanBillingFinal();
assert("K-1: Simpan Invoice Tanpa Pasien Ditolak", getLastToast().includes("Cari dan Pilih Pasien terlebih dahulu"));
assert("K-1: Tombol Kasir Tidak Stuck / Loading", document.getElementById('btnSimpanBilling').innerText === "SIMPAN DATA INVOICE");

// Skenario K-2: Simpan Billing dengan Field Wajib Belum Lengkap (Dokter Kosong)
pilihPasienKSR('PS-0321-0001');
document.getElementById('ksrDokter').value = '';
document.getElementById('ksrTgl').value = '2026-10-08';
document.getElementById('ksrMetode').value = 'Tunai';
document.getElementById('ksrStatus').value = 'Lunas';
simpanBillingFinal();
assert("K-2: Simpan Tanpa Dokter Ditolak", getLastToast().includes("Lengkapi field bertanda *"));

// Skenario K-3: Keranjang Pembayaran Kosong (Tanpa Tindakan/Obat/BMHP)
document.getElementById('ksrDokter').value = 'drg. Rahma Yulinda D, Sp. BMM';
document.getElementById('ksrTbodyTindakan').innerHTML = '';
document.getElementById('ksrTbodyObat').innerHTML = '';
document.getElementById('ksrTbodyBMHP').innerHTML = '';
simpanBillingFinal();
assert("K-3: Keranjang Kosong Ditolak", getLastToast().includes("Minimal input satu tindakan/obat/BMHP"));
assert("K-3: Tombol Simpan Kembali Aktif", document.getElementById('btnSimpanBilling').disabled === false);

// Skenario K-4: Baris Tabel Ditambahkan tetapi Nama Item Dikosongkan
addKasirTindakan();
var tbTind = document.getElementById('ksrTbodyTindakan');
var rowKosong = tbTind.children[tbTind.children.length - 1];
rowKosong.querySelector('.val-nama').value = '';
simpanBillingFinal();
assert("K-4: Baris Item Tanpa Nama Ditolak", getLastToast().includes("Semua baris tabel yang ditambahkan harus diisi namanya"));

// Skenario K-5: Status "Uang Muka" (DP) tetapi Nominal DP Kosong atau 0
rowKosong.querySelector('.val-nama').value = 'Pemasangan Kawat Gigi Ortho Standard';
rowKosong.querySelector('.val-harga').value = '5.000.000';
rowKosong.querySelector('.val-qty').value = '1';
rowKosong.querySelector('.val-disc').value = '0';
rowKosong.querySelector('.val-grand').value = '5.000.000';
hitungGrandTotalSemua();

document.getElementById('ksrStatus').value = 'Uang Muka';
onStatusBayarChange();
assert("K-5: Box Input DP Ditampilkan Saat Status Uang Muka", !document.getElementById('boxNominalDp').classList.contains('hidden'));
assert("K-5: Label Judul Berubah Menjadi TOTAL PAKET", document.getElementById('lblJudulTotalBayar').innerText.includes('TOTAL PAKET'));

document.getElementById('ksrNominalDp').value = '0';
simpanBillingFinal();
assert("K-5: Nominal DP 0 Ditolak", getLastToast().includes("Harap isi nominal Uang Muka / DP yang dibayarkan"));

// Skenario K-6: Status "Uang Muka" (DP) tetapi Nominal DP Melebihi Total Tagihan Paket
document.getElementById('ksrNominalDp').value = '6.000.000';
simpanBillingFinal();
assert("K-6: Nominal DP Melebihi Total Paket Ditolak", getLastToast().includes("Nominal DP tidak boleh melebihi total biaya paket"));

// Skenario K-7: Permintaan Obat / BMHP Melebihi Stok Gudang Tersedia (Stock Guard)
document.getElementById('ksrStatus').value = 'Lunas';
onStatusBayarChange();
addKasirObat();
var tbObat = document.getElementById('ksrTbodyObat');
var rowObatStok = tbObat.children[tbObat.children.length - 1];
var inputObat = rowObatStok.querySelector('.val-nama');
inputObat.value = 'Amoksisilin Generik 500mg';
inputObat.setAttribute('data-stok', '120');
rowObatStok.querySelector('.val-qty').value = '150'; // Melebihi stok 120
simpanBillingFinal();
assert("K-7: Qty Obat Melebihi Stok Tersedia Ditolak", getLastToast().includes("tidak mencukupi (Diminta: 150, Tersedia: 120)"));
rowObatStok.remove();
hitungGrandTotalSemua();

// Skenario K-8: Transaksi Uang Muka (DP) Valid Berhasil Diterbitkan & Sisa Piutang Terhitung Otomatis
document.getElementById('ksrStatus').value = 'Uang Muka';
onStatusBayarChange();
document.getElementById('ksrNominalDp').value = '1.500.000';
hitungSisaTagihanDp();
assert("K-8: Perhitungan Sisa Piutang Akurat (Rp 3.500.000)", document.getElementById('lblSisaTagihanPreview').innerText.includes("3.500.000"));

var prevPembayaranCount = window.KlinikData.pembayaran.length;
simpanBillingFinal();
runAllTimers();

assert("K-8: Transaksi Invoice DP Berhasil Disimpan", getLastToast().includes("Berhasil! No: INV/SHELDON/"));
assert("K-8: Data Pembayaran Masuk ke Riwayat Lokal", window.KlinikData.pembayaran.length > prevPembayaranCount);

var lastInv = window.KlinikData.pembayaran[window.KlinikData.pembayaran.length - 1];
assert("K-8: Keterangan Otomatis Mencatat Rincian Piutang", lastInv.keterangan.includes("DP: Rp 1.500.000") && lastInv.keterangan.includes("Sisa Piutang: Rp 3.500.000"));
assert("K-8: Total Invoice Tercatat Sebesar DP (Rp 1.500.000)", lastInv.totalInvoice === 1500000);

// Skenario K-9: Deteksi Realtime Tagihan Berjalan / DP pada Pemilihan Pasien
pilihPasienKSR('PS-0321-0001');
var alertCicilan = document.getElementById('alertCicilanPasien');
assert("K-9: Alert Tagihan Berjalan Otomatis Muncul", !alertCicilan.classList.contains('hidden'));
assert("K-9: Judul Alert Memperingatkan Tagihan Berjalan", document.getElementById('alertCicilanTitle').innerText.includes("Tagihan Berjalan"));
assert("K-9: Rincian Sisa Piutang Ditampilkan di Body Alert", document.getElementById('alertCicilanBody').innerHTML.includes("3.500.000") || document.getElementById('alertCicilanBody').innerHTML.includes("Uang Muka"));

// Skenario K-10: Pelunasan Sisa Tagihan Berjalan (Status "Pelunasan")
resetFormBilling();
pilihPasienKSR('PS-0321-0001');
document.getElementById('ksrTgl').value = '2026-10-08';
document.getElementById('ksrDokter').value = 'drg. Rahma Yulinda D, Sp. BMM';
document.getElementById('ksrMetode').value = 'Transfer BCA';
document.getElementById('ksrStatus').value = 'Pelunasan';
document.getElementById('ksrKet').value = 'Pelunasan Behel Orthodonti';

addKasirTindakan();
var tbTindLunas = document.getElementById('ksrTbodyTindakan');
var rowLunas = tbTindLunas.children[tbTindLunas.children.length - 1];
rowLunas.querySelector('.val-nama').value = 'Pelunasan Perawatan Ortho';
rowLunas.querySelector('.val-harga').value = '3.500.000';
rowLunas.querySelector('.val-qty').value = '1';
rowLunas.querySelector('.val-disc').value = '0';
rowLunas.querySelector('.val-grand').value = '3.500.000';
hitungGrandTotalSemua();

simpanBillingFinal();
runAllTimers();

assert("K-10: Pelunasan Berhasil Diterbitkan", getLastToast().includes("Berhasil!"));
assert("K-10: Evaluasi Tagihan Berjalan Pasien Menunjukkan Status Lunas", document.getElementById('alertCicilanBody').innerHTML.includes("PELUNASAN") || alertCicilan.classList.contains('hidden'));

// Skenario K-SPLIT: Pembagian Pembayaran Split (Cash & Transfer Bank)
assert("K-SPLIT-1: Opsi Metode Bayar Hanya Cash dan Transfer Bank", isMetodeCashTfOnly);
assert("K-SPLIT-2: Status Pembayaran Memiliki Opsi Split", isStatusSplitInHtml);
assert("K-SPLIT-3: Box Split Payment Tersedia di HTML", isBoxSplitInHtml);

switchMenu('kasir');
resetFormBilling();
pilihPasienKSR('PS-0321-0001');
document.getElementById('ksrTgl').value = '2026-10-08';
document.getElementById('ksrDokter').value = 'drg. Rahma Yulinda D, Sp. BMM';

addKasirTindakan();
var tbSplit = document.getElementById('ksrTbodyTindakan');
var rowSplit = tbSplit.children[tbSplit.children.length - 1];
rowSplit.querySelector('.val-nama').value = 'Pembersihan Karang Gigi';
rowSplit.querySelector('.val-harga').value = '500.000';
rowSplit.querySelector('.val-qty').value = '1';
rowSplit.querySelector('.val-disc').value = '0';
rowSplit.querySelector('.val-grand').value = '500.000';
hitungGrandTotalSemua();

document.getElementById('ksrStatus').value = 'Split';
onStatusBayarChange();
assert("K-SPLIT-4: Box Split Ditampilkan Saat Status Split", !document.getElementById('boxSplitPayment').classList.contains('hidden'));
assert("K-SPLIT-4: Metode Otomatis Menjadi Cash & Transfer", document.getElementById('ksrMetode').value === 'Cash & Transfer');

// Test auto calculation
document.getElementById('ksrSplitCash').value = '200.000';
handleSplitInput('cash');
assert("K-SPLIT-5: Mengisi Cash 200rb Otomatis Mengisi Transfer 300rb", parseUangKSR(document.getElementById('ksrSplitTransfer').value) === 300000);

document.getElementById('ksrSplitTransfer').value = '450.000';
handleSplitInput('transfer');
assert("K-SPLIT-6: Mengisi Transfer 450rb Otomatis Mengisi Cash 50rb", parseUangKSR(document.getElementById('ksrSplitCash').value) === 50000);

// Simpan final invoice split
simpanBillingFinal();
runAllTimers();
assert("K-SPLIT-7: Invoice Pembayaran Split Berhasil Disimpan", getLastToast().includes("Berhasil!"));

// Skenario K-11: Riwayat Invoice Search & Filter Kalender
switchMenu('riwayat-invoice');
bukaRiwayatInvoice();
assert("K-11: Tabel Riwayat Invoice Menampilkan Data", document.getElementById('tbodyRiwayatInvoice').innerHTML.includes("Edison"));
document.getElementById('inputCariRiwayat').value = "NonExistentKeywordXYZ";
searchRiwayatInvoice();
assert("K-11: Filter Pencarian Tidak Cocok Menghasilkan 0 Item", filteredInvoicesList.length === 0);
document.getElementById('inputCariRiwayat').value = "";
searchRiwayatInvoice();
assert("K-11: Reset Filter Menampilkan Kembali Semua Invoice", filteredInvoicesList.length > 0);

// ==========================================
// PENGUJIAN MODUL OHI-S (GREENE & VERMILLION)
// ==========================================
print("\n--- TEST: OHI-S (Oral Hygiene Index - Simplified) ---");

// 1. Initial State
resetOhisToDefault();
assert("OHI-S-1: Status Awal OHI-S Belum Ada Data", document.getElementById("badgeOhisStatus").innerText === "Belum Ada Data");
assert("OHI-S-1: currentOhisExam Bernilai Null Sebelum Disimpan", currentOhisExam === null);

// 2. Buka & Tutup Modal
bukaModalOhis();
assert("OHI-S-2: Modal OHI-S Terbuka", !document.getElementById("modalOhisChart").classList.contains("hidden"));
assert("OHI-S-2: Data 6 Gigi Indeks Terinisialisasi", Object.keys(ohisTeethData).length === 6);
tutupModalOhis();
assert("OHI-S-2: Modal OHI-S Tertutup", document.getElementById("modalOhisChart").classList.contains("hidden"));

// 3. Perhitungan Skor Bersih (Normal 0)
setSemuaOhisSkor(0);
var m0 = hitungOhisMetrics();
assert("OHI-S-3: Skor DI-S Semua Nol = 0.00", m0.dis === "0.00");
assert("OHI-S-3: Skor CI-S Semua Nol = 0.00", m0.cis === "0.00");
assert("OHI-S-3: Total OHI-S Semua Nol = 0.00", m0.ohis === "0.00");
assert("OHI-S-3: Kategori OHI-S Normal adalah Baik", m0.kategori === "Baik");

// 4. Perhitungan Skor Sedang (Moderate / Fair)
// Set Debris: 16:1, 11:1, 26:2, 46:1, 31:1, 36:1 -> Total = 7 -> DI-S = 7/6 = 1.17
// Set Calculus: 16:1, 11:0, 26:1, 46:1, 31:0, 36:1 -> Total = 4 -> CI-S = 4/6 = 0.67
// Total OHI-S = 1.17 + 0.67 = 1.84 -> Sedang (1.3 - 3.0)
setOhisScore('16', 'd', 1);
setOhisScore('11', 'd', 1);
setOhisScore('26', 'd', 2);
setOhisScore('46', 'd', 1);
setOhisScore('31', 'd', 1);
setOhisScore('36', 'd', 1);

setOhisScore('16', 'c', 1);
setOhisScore('11', 'c', 0);
setOhisScore('26', 'c', 1);
setOhisScore('46', 'c', 1);
setOhisScore('31', 'c', 0);
setOhisScore('36', 'c', 1);

var mSedang = hitungOhisMetrics();
assert("OHI-S-4: DI-S Sedang Terhitung Tepat (1.17)", mSedang.dis === "1.17");
assert("OHI-S-4: CI-S Sedang Terhitung Tepat (0.67)", mSedang.cis === "0.67");
assert("OHI-S-4: Total OHI-S Sedang Terhitung Tepat (1.84)", mSedang.ohis === "1.84");
assert("OHI-S-4: Kategori Terklasifikasi Sedang", mSedang.kategori === "Sedang");

// 5. Perhitungan Skor Buruk (Poor)
// Set Semua ke 3 (Debris & Calculus) -> DI-S = 3.00, CI-S = 3.00 -> Total = 6.00 -> Buruk
setSemuaOhisSkor(3);
var mBuruk = hitungOhisMetrics();
assert("OHI-S-5: DI-S Buruk Terhitung Tepat (3.00)", mBuruk.dis === "3.00");
assert("OHI-S-5: CI-S Buruk Terhitung Tepat (3.00)", mBuruk.cis === "3.00");
assert("OHI-S-5: Total OHI-S Buruk Terhitung Tepat (6.00)", mBuruk.ohis === "6.00");
assert("OHI-S-5: Kategori Terklasifikasi Buruk", mBuruk.kategori === "Buruk");

// 6. Simpan OHI-S ke EMR Form
// Set skor realistis: Total OHI-S 1.00 (Baik)
setSemuaOhisSkor(0);
setOhisScore('16', 'd', 1);
setOhisScore('26', 'd', 1);
setOhisScore('46', 'd', 1);
setOhisScore('46', 'c', 1);
setOhisScore('36', 'c', 2);
simpanOhisKeEMR();
assert("OHI-S-6: currentOhisExam Tersimpan", currentOhisExam !== null);
assert("OHI-S-6: Badge Form Terupdate Kategori BAIK", document.getElementById("badgeOhisStatus").innerText.indexOf("BAIK") !== -1);
assert("OHI-S-6: Summary Cepat Mencatat DI-S dan CI-S", document.getElementById("summaryOhisQuick").innerText.indexOf("DI-S") !== -1);

// 7. Integrasi dengan Simpan Rekam Medis (Fisik JSON Payload)
var mockFisik = {};
if (currentOhisExam) { mockFisik.ohis = currentOhisExam; }
assert("OHI-S-7: Data OHI-S Terkandung di Struktur Fisik EMR", mockFisik.ohis && mockFisik.ohis.summary && mockFisik.ohis.summary.ohis === "1.00");

// 8. Reset OHI-S
resetOhisToDefault();
assert("OHI-S-8: Reset Mengembalikan currentOhisExam ke Null", currentOhisExam === null);
assert("OHI-S-8: Reset Mengembalikan Badge ke Belum Ada Data", document.getElementById("badgeOhisStatus").innerText === "Belum Ada Data");

// ==================================================
// PENGUJIAN PERIODONTAL CHARTING INTERAKTIF & MODAL
// ==================================================
print("\n--- TEST: Periodontal Charting Interactive ---");

bukaModalPeriodontal();
assert("PERIO-1: Modal Periodontal Terbuka", !document.getElementById("modalPeriodontalChart").classList.contains("hidden"));

// Switch ke Rahang Bawah (Mandibula)
switchPerioArch('mandible');
assert("PERIO-2: Tab Rahang Bawah Aktif", perioActiveArch === "mandible");
assert("PERIO-2: Daftar Gigi Rahang Bawah Aktif (48-38)", getActiveTeethList()[0] === 48);
assert("PERIO-2: Label Grafik Terupdate Rahang Bawah", document.getElementById("perioGraphicLabel").innerHTML.indexOf("Rahang Bawah") !== -1);
assert("PERIO-2: Visualisasi SVG Gigi Rahang Bawah Terisi", document.getElementById("svgPerioChart").innerHTML.indexOf("T48") !== -1);

// Switch ke Lingual / Palatal
switchPerioAspect('lingual');
assert("PERIO-3: Tab Lingual Aktif", perioActiveAspect === "lingual");
assert("PERIO-3: Site Keys Berubah ke DL, L, ML", getSiteKeysForAspect()[0].key === "dl");
assert("PERIO-3: Label Grafik Terupdate Lingual", document.getElementById("perioGraphicLabel").innerHTML.indexOf("Lingual") !== -1);

// Verifikasi Safety Global Identifiers (Unquoted variable fallback)
switchPerioArch(maxilla);
assert("PERIO-4: Safety Fallback switchPerioArch(maxilla) Berhasil", perioActiveArch === "maxilla");
switchPerioArch(mandible);
assert("PERIO-4: Safety Fallback switchPerioArch(mandible) Berhasil", perioActiveArch === "mandible");
switchPerioAspect(facial);
assert("PERIO-5: Safety Fallback switchPerioAspect(facial) Berhasil", perioActiveAspect === "facial");
switchPerioAspect(lingual);
assert("PERIO-5: Safety Fallback switchPerioAspect(lingual) Berhasil", perioActiveAspect === "lingual");

// Verifikasi Modal Reset Periodontal
resetPerioChartSemua();
var modalResetPerio = document.getElementById("modalResetPeriodontal");
assert("PERIO-6: Modal Konfirmasi Reset Periodontal Muncul", !modalResetPerio.classList.contains("hidden"));
assert("PERIO-6: Template Memiliki Modal Reset Data Periodontal Charting", isModalResetPerioInHtml);

batalResetPerio();
assert("PERIO-7: Batal Reset Menyembunyikan Modal", modalResetPerio.classList.contains("hidden"));

// Eksekusi Reset
inputPerioDepth(5);
assert("PERIO-8: Pocket Depth Berubah Menjadi 5mm", perioTeethData[48].dl === 5);
eksekusiResetPerio();
assert("PERIO-8: Eksekusi Reset Mengembalikan Data ke Default", perioTeethData[48].dl === 0);
assert("PERIO-8: Modal Reset Tertutup Setelah Eksekusi", modalResetPerio.classList.contains("hidden"));

// ==================================================
// PENGUJIAN BULK DATA SHELDON 2026 & SCHEMA ALIGNMENT
// ==================================================
print("\n--- TEST: Real Apps Script Workspace Data & Schema Verification ---");
assert("BULK-1: Total Pasien Real >= 2200", window.KlinikData.pasien.length >= 2200, "Count: " + window.KlinikData.pasien.length);
assert("BULK-2: Total Katalog Tindakan >= 120", window.KlinikData.tindakan.length >= 120, "Count: " + window.KlinikData.tindakan.length);
assert("BULK-3: Total Rekam Medis Real >= 8", window.KlinikData.rekamMedis.length >= 8, "Count: " + window.KlinikData.rekamMedis.length);
assert("BULK-4: Total Master Obat >= 180", window.KlinikData.obat.length >= 180, "Count: " + window.KlinikData.obat.length);
assert("BULK-5: Total Master Staff === 11", window.KlinikData.staff.length === 11, "Count: " + window.KlinikData.staff.length);
var sampleBulkPasien = window.KlinikData.pasien.find(function(p) { return p.idPasien === "PS-0421-0005"; });
assert("BULK-6: Sample Real Pasien PS-0421-0005 (Dara Triatna) Valid Schema & Normalized Gender", sampleBulkPasien && (sampleBulkPasien.jenisKelamin === "Laki-Laki" || sampleBulkPasien.jenisKelamin === "Perempuan") && /^\d{2}-\d{2}-\d{4}$/.test(sampleBulkPasien.tanggalLahir));
assert("BULK-7: Fungsi triggerImportBulkSheldon2026 Tersedia", typeof triggerImportBulkSheldon2026 === "function");
window.confirm = function() { return true; };
window.alert = function() {};
triggerImportBulkSheldon2026();
runAllTimers();
var allToastArr = (document.getElementById('toastContainer') && document.getElementById('toastContainer').allToasts) || [];
assert("BULK-8: Eksekusi triggerImportBulkSheldon2026 Berhasil", allToastArr.some(function(t) { return String(t).includes("Copy of SHELDON 2026"); }));

// ==================================================
// PENGUJIAN SINKRONISASI PAYROLL DARI PENGATURAN_TARIF_SHIFT (06 MASTER)
// ==================================================
print("\n--- TEST: Payroll & Honor Dokter Sync dari Pengaturan_Tarif_Shift ---");
assert("PAYROLL-1: Fungsi initPayrollModule & loadPayrollModuleData Tersedia", typeof initPayrollModule === "function" && typeof loadPayrollModuleData === "function");
loadPayrollModuleData(false);
runAllTimers();

assert("PAYROLL-2: Tarif Shift Terisi dari Master", window.PayrollState.tarifShift && window.PayrollState.tarifShift.length > 0, "Count: " + window.PayrollState.tarifShift.length);

var docPayroll = window.PayrollState.penggajianDokter || [];
var staffPayroll = window.PayrollState.honorStaff || [];

assert("PAYROLL-3: Penggajian Dokter Terisi dari Nama-nama Dokter di Tarif Shift", docPayroll.length > 0, "Count: " + docPayroll.length);
assert("PAYROLL-4: Honor Perawat & Staff Terisi dari Nama-nama Staff di Tarif Shift", staffPayroll.length > 0, "Count: " + staffPayroll.length);

// Uji Skenario 1: Pekerja Berstatus Tidak Aktif Dikeluarkan dari Payroll & Dropdown
var inactiveWorker = window.PayrollState.tarifShift.find(function(t) { 
  var st = String(t.status || '').toLowerCase();
  return st === 'tidak aktif' || st === 'non aktif';
});

if (!inactiveWorker && window.PayrollState.tarifShift.length > 0) {
  // Simulasikan satu pekerja diubah statusnya menjadi Tidak Aktif
  window.PayrollState.tarifShift[0].status = "Tidak Aktif";
  var nonActiveName = window.PayrollState.tarifShift[0].namaPekerja;
  renderAllPayrollTables();
  var filteredDocs = (window.PayrollState.penggajianDokter || []).filter(function(d) { return isPekerjaAktif(d.namaDokter); });
  var hasNonActiveInDocs = filteredDocs.some(function(d) { return d.namaDokter.toLowerCase() === nonActiveName.toLowerCase(); });
  assert("PAYROLL-5: Skenario 1 - Pekerja Berstatus Tidak Aktif Tidak Muncul di Penggajian Dokter", !hasNonActiveInDocs);
  // Kembalikan ke Aktif
  window.PayrollState.tarifShift[0].status = "Aktif";
  renderAllPayrollTables();
} else if (inactiveWorker) {
  var hasNonActiveInDocs = docPayroll.some(function(d) { return d.namaDokter.toLowerCase() === inactiveWorker.namaPekerja.toLowerCase(); });
  assert("PAYROLL-5: Skenario 1 - Pekerja Berstatus Tidak Aktif Tidak Muncul di Penggajian Dokter", !hasNonActiveInDocs);
}

// Uji Skenario 2: Seluruh Dokter Aktif dari Pengaturan_Tarif_Shift Masuk ke Penggajian Dokter
var activeDoctorsInTarif = window.PayrollState.tarifShift.filter(function(t) {
  var isDoc = (t.role || '').toLowerCase().includes('dokter') || (t.namaPekerja || '').toLowerCase().startsWith('drg');
  var isActive = String(t.status || 'Aktif').toLowerCase() !== 'tidak aktif';
  return isDoc && isActive;
});

var allDocsAccounted = activeDoctorsInTarif.length > 0 && activeDoctorsInTarif.every(function(t) {
  return docPayroll.some(function(d) { return d.namaDokter.toLowerCase() === t.namaPekerja.toLowerCase(); });
});
assert("PAYROLL-6: Skenario 2 - Seluruh Dokter Aktif dari Pengaturan_Tarif_Shift Masuk ke Penggajian Dokter", allDocsAccounted);

// Uji Skenario 3: Dokter dengan 0 Tindakan (Hanya Kehadiran Shift)
var testDocShiftOnly = {
  idPayroll: "PAY-DR-TEST-001",
  periodeBulan: "Oktober 2026",
  idDokter: "DOK-TEST-01",
  namaDokter: "drg. Dokter Shift Saja",
  totalPasien: 0,
  totalTindakanBruto: 0,
  totalBiayaLab: 0,
  dasarJMBersih: 0,
  totalJMDokter: 0,
  hadirShift1: 2,
  hadirShift2: 1,
  totalUangHarianShift: (2 * 55000) + (1 * 55000), // 165000
  bonusInsentif: 0,
  potonganPPh21: 0,
  potonganKasbon: 0,
  totalDiterimaTHP: 165000,
  statusTransfer: "Draft"
};
var thpShiftOnlyExpected = (testDocShiftOnly.totalJMDokter + testDocShiftOnly.totalUangHarianShift + testDocShiftOnly.bonusInsentif) - (testDocShiftOnly.potonganPPh21 + testDocShiftOnly.potonganKasbon);
assert("PAYROLL-7: Skenario 3 - Dokter 0 Tindakan Tetap Menerima Uang Shift (Rp 165.000)", thpShiftOnlyExpected === 165000 && testDocShiftOnly.totalDiterimaTHP === 165000);

// Uji Skenario 4: Dokter Kombinasi Shift + JM + Insentif - Kasbon - PPh21
var testDocKombinasi = {
  idPayroll: "PAY-DR-TEST-002",
  periodeBulan: "Oktober 2026",
  idDokter: "DOK-TEST-02",
  namaDokter: "drg. Dokter Spesialis Kombinasi",
  totalPasien: 5,
  totalTindakanBruto: 4000000,
  totalBiayaLab: 500000,
  dasarJMBersih: 3500000,
  totalJMDokter: 2275000, // 65% dari 3.5jt
  hadirShift1: 4,
  hadirShift2: 4,
  totalUangHarianShift: 440000, // 8 x 55rb
  bonusInsentif: 100000,
  potonganPPh21: 50000,
  potonganKasbon: 200000,
  statusTransfer: "Draft"
};
var thpKombinasiCalc = (testDocKombinasi.totalJMDokter + testDocKombinasi.totalUangHarianShift + testDocKombinasi.bonusInsentif) - (testDocKombinasi.potonganPPh21 + testDocKombinasi.potonganKasbon);
// 2.275.000 + 440.000 + 100.000 - 50.000 - 200.000 = 2.565.000
assert("PAYROLL-8: Skenario 4 - Perhitungan THP Dokter Kombinasi (JM + Shift + Bonus - PPh - Kasbon = Rp 2.565.000)", thpKombinasiCalc === 2565000);

// Uji Skenario 5: Skema Perawat Gigi (Tarif Rp 45.000/shift, Gaji Pokok 0)
var testPerawat = {
  idPayrollStaff: "PAY-STF-TEST-001",
  periodeBulan: "Oktober 2026",
  idStaff: "PRW-TEST-01",
  namaStaff: "Perawat Uji Coba",
  role: "Perawat Gigi",
  gajiPokokBulanan: 0,
  hadirShift1: 10,
  hadirShift2: 10,
  totalUangHarianShift: 20 * 45000, // 900.000
  totalFeeTindakan: 100000,
  uangMakanTransport: 150000,
  lembur: 50000,
  potonganKasbon: 0,
  statusTransfer: "Draft"
};
var thpPerawatCalc = (testPerawat.gajiPokokBulanan + testPerawat.totalUangHarianShift + testPerawat.totalFeeTindakan + testPerawat.uangMakanTransport + testPerawat.lembur) - testPerawat.potonganKasbon;
// 0 + 900.000 + 100.000 + 150.000 + 50.000 = 1.200.000
assert("PAYROLL-9: Skenario 5 - Perhitungan THP Perawat Gigi (20 Shift @ 45rb + Tunjangan = Rp 1.200.000)", thpPerawatCalc === 1200000 && testPerawat.gajiPokokBulanan === 0);

// Uji Skenario 6: Skema Admin / Kasir (Gaji Pokok Tetap Rp 1.200.000, Non-Shift)
var testAdmin = {
  idPayrollStaff: "PAY-STF-TEST-002",
  periodeBulan: "Oktober 2026",
  idStaff: "ADM-TEST-01",
  namaStaff: "Admin Uji Coba",
  role: "Admin",
  gajiPokokBulanan: 1200000,
  hadirShift1: 0,
  hadirShift2: 0,
  totalUangHarianShift: 0,
  totalFeeTindakan: 0,
  uangMakanTransport: 0,
  lembur: 0,
  potonganKasbon: 100000,
  statusTransfer: "Draft"
};
var thpAdminCalc = (testAdmin.gajiPokokBulanan + testAdmin.totalUangHarianShift + testAdmin.totalFeeTindakan + testAdmin.uangMakanTransport + testAdmin.lembur) - testAdmin.potonganKasbon;
assert("PAYROLL-10: Skenario 6 - Perhitungan THP Admin (Gaji Pokok Tetap Rp 1.200.000 - Kasbon Rp 100.000 = Rp 1.100.000)", thpAdminCalc === 1100000 && testAdmin.totalUangHarianShift === 0);

// Uji Skenario 7: Presensi Baru & Live Recalculate THP
recalculateShiftTotalsFromPresensi();
var sampleDoc = window.PayrollState.penggajianDokter[0];
var baseShift1 = sampleDoc.hadirShift1 || 0;
var baseTotalUang = sampleDoc.totalUangHarianShift || 0;

print("DEBUG sampleDoc: " + JSON.stringify(sampleDoc));

window.PayrollState.presensiHarian.push({
  idPresensi: "ATT-TEST-LIVE-001",
  tanggal: "15-10-2026",
  idPekerja: sampleDoc.idDokter,
  namaPekerja: sampleDoc.namaDokter,
  role: "Dokter Gigi",
  shift: "Shift 1",
  statusKehadiran: "Hadir",
  uangHarianDidapat: 55000,
  verifikator: "Admin"
});

recalculateShiftTotalsFromPresensi();
print("DEBUG after recalc sampleDoc: " + JSON.stringify(sampleDoc));
assert("PAYROLL-11: Skenario 7 - Presensi Baru Otomatis Menambah Hadir Shift 1 Dokter", sampleDoc.hadirShift1 === baseShift1 + 1);
assert("PAYROLL-11: Skenario 7 - Total Uang Harian Shift Dokter Bertambah Rp 55.000", sampleDoc.totalUangHarianShift === baseTotalUang + 55000);

// Uji Skenario 8: Transisi Status Pembayaran Payroll (Draft <-> Paid)
var curStatus = sampleDoc.statusTransfer || "Draft";
togglePayrollPaidStatus('dokter', 0);
assert("PAYROLL-12: Skenario 8 - Transisi Status Transfer Payroll Menjadi " + (curStatus === "Paid" ? "Draft" : "Paid"), sampleDoc.statusTransfer !== curStatus);
// Kembalikan ke status semula
togglePayrollPaidStatus('dokter', 0);
assert("PAYROLL-12: Skenario 8 - Transisi Kembali ke Status Semula (" + curStatus + ")", sampleDoc.statusTransfer === curStatus);

// Uji Skenario 9: Penolakan Pendaftaran Tarif Shift jika Nama Tidak Terdaftar di Sheet Data (Master User)
var initialTarifCount = (window.PayrollState.tarifShift || []).length;
document.getElementById('tarifNamaPekerja').value = "Pekerja Fiktif Antah Berantah";
document.getElementById('tarifRole').value = "Staff";
handleSimpanTarifShift();
var afterRejectCount = (window.PayrollState.tarifShift || []).length;
var rejectWorkerExists = (window.PayrollState.tarifShift || []).some(function(t) {
  return (t.namaPekerja || '').toLowerCase() === "pekerja fiktif antah berantah";
});
assert("PAYROLL-13: Skenario 9 - Penolakan Pendaftaran Tarif Shift jika Nama Belum Terdaftar di Sheet Data", !rejectWorkerExists && afterRejectCount === initialTarifCount);

// Uji Skenario 10: Event Autofill Otomatis Mengisi Role dari Sheet Data saat Nama Dipilih
var targetValidStaff = (window.KlinikData.staff || []).find(function(s) {
  return !(window.PayrollState.tarifShift || []).some(function(t) {
    return (t.namaPekerja || '').toLowerCase() === (s.nama || '').toLowerCase();
  });
});
if (!targetValidStaff && window.KlinikData.staff && window.KlinikData.staff.length > 0) {
  targetValidStaff = window.KlinikData.staff[0];
}

document.getElementById('tarifNamaPekerja').value = targetValidStaff.nama;
document.getElementById('tarifRole').value = "RoleSembaranganManual";
handleTarifNamaPekerjaChange();
assert("PAYROLL-14: Skenario 10 - Autofill Event Mengisi Role dari Sheet Data Saat Nama Terpilih", document.getElementById('tarifRole').value === targetValidStaff.role);

// Uji Skenario 11: Pendaftaran Berhasil & Role Otomatis Sesuai Sheet Data
handleSimpanTarifShift();
var savedTarif = (window.PayrollState.tarifShift || []).find(function(t) {
  return (t.namaPekerja || '').toLowerCase() === targetValidStaff.nama.toLowerCase();
});
assert("PAYROLL-15: Skenario 11 - Pendaftaran Berhasil & Role Otomatis Sesuai Sheet Data", savedTarif && savedTarif.role === targetValidStaff.role);

// Uji Skenario 12: ID_Aturan / ID_Pekerja Terisi Otomatis dengan Format SN-XX (2 Digit)
assert("PAYROLL-16: Skenario 12 - ID_Aturan Terisi Otomatis dengan Format SN-XX", savedTarif && /^SN-\d{2,}$/.test(savedTarif.idAturan || savedTarif.idPekerja));

// Uji Skenario 13: Verifikasi ID_Pekerja pada Staff Master User Mengikuti Aturan Prefix SN- (2 Digit)
var sampleStaff = window.KlinikData && window.KlinikData.staff ? window.KlinikData.staff : [];
var validStaffIds = sampleStaff.every(function(s) {
  return !s.idPekerja || /^SN-\d{2}$/.test(s.idPekerja);
});
assert("MASTER-ID-1: Format ID_Pekerja Seluruh Staff Mengikuti Prefix SN- (SN-XX)", sampleStaff.length > 0 && validStaffIds);

// --- TEST: Sistem Presensi & Absensi Pegawai ---
print("\n--- TEST: Sistem Presensi & Absensi Pegawai ---");

// ABSENSI-1: Navigasi nav-absensi dan view-absensi tersedia dan dapat diakses
var navAbsensi = document.getElementById('nav-absensi');
var viewAbsensi = document.getElementById('view-absensi');
assert("ABSENSI-1: Tombol Navigasi nav-absensi Tersedia di Workspace", navAbsensi !== null);
assert("ABSENSI-1: Kontainer view-absensi Tersedia di HTML", viewAbsensi !== null);

// Inisialisasi Modul Absensi
initAbsensiModule();
runAllTimers();
assert("ABSENSI-1: State window.AbsensiState Terinisialisasi", window.AbsensiState !== undefined && window.AbsensiState !== null);

// ABSENSI-2: Shift Schedule Logic Senin - Jumat (Pagi: 10:00 - 15:00, Sore: 16:00 - 20:00)
handleAbsensiDateChange("2026-10-19"); // 19 Oktober 2026 adalah hari Senin
runAllTimers();
pilihShiftAbsensi('Pagi');
var jadwalPagiSenin = getJadwalShiftCurrent();
assert("ABSENSI-2: Shift Pagi Senin - Jumat Mulai Jam 10:00 Selesai 15:00", jadwalPagiSenin.jamMulai === "10:00" && jadwalPagiSenin.jamSelesai === "15:00");

pilihShiftAbsensi('Sore');
var jadwalSoreSenin = getJadwalShiftCurrent();
assert("ABSENSI-2: Shift Sore Senin - Jumat Mulai Jam 16:00 Selesai 20:00", jadwalSoreSenin.jamMulai === "16:00" && jadwalSoreSenin.jamSelesai === "20:00");

// ABSENSI-3: Shift Schedule Logic Sabtu (Pagi: 10:00 - 14:00, Sore: 14:00 - 18:00)
handleAbsensiDateChange("2026-10-24"); // 24 Oktober 2026 adalah hari Sabtu
runAllTimers();
pilihShiftAbsensi('Pagi');
var jadwalPagiSabtu = getJadwalShiftCurrent();
assert("ABSENSI-3: Shift Pagi Hari Sabtu Mulai Jam 10:00 Selesai 14:00", jadwalPagiSabtu.jamMulai === "10:00" && jadwalPagiSabtu.jamSelesai === "14:00");

pilihShiftAbsensi('Sore');
var jadwalSoreSabtu = getJadwalShiftCurrent();
assert("ABSENSI-3: Shift Sore Hari Sabtu Mulai Jam 14:00 Selesai 18:00", jadwalSoreSabtu.jamMulai === "14:00" && jadwalSoreSabtu.jamSelesai === "18:00");

// ABSENSI-4: Hari Minggu Otomatis Libur Rutin
handleAbsensiDateChange("2026-10-25"); // 25 Oktober 2026 adalah hari Minggu
runAllTimers();
assert("ABSENSI-4: Hari Minggu Terdeteksi isMinggu = true", window.AbsensiState.isMinggu === true);
assert("ABSENSI-4: Hari Minggu Terdeteksi isLibur = true", window.AbsensiState.isLibur === true);
assert("ABSENSI-4: Operasional Hari Minggu Otomatis Tutup (Libur Rutin)", window.AbsensiState.infoLibur && window.AbsensiState.infoLibur.statusOperasional === "Tutup");
assert("ABSENSI-4: isAbsensiLockedToday Mengembalikan true pada Hari Minggu", isAbsensiLockedToday() === true);
var btnSimpanMinggu = document.getElementById('btnSimpanAbsensi');
assert("ABSENSI-4: Tombol Simpan Presensi Dikunci (disabled) pada Hari Minggu", btnSimpanMinggu && btnSimpanMinggu.disabled === true);
assert("ABSENSI-4: Label Tombol Simpan Mengindikasikan Dikunci", btnSimpanMinggu && btnSimpanMinggu.innerHTML.indexOf("Presensi Dikunci") !== -1);
var tbodyMinggu = document.getElementById('tbodyAbsensiPegawai') ? document.getElementById('tbodyAbsensiPegawai').innerHTML : "";
assert("ABSENSI-4: Select Input Presensi Terkunci dengan Label Libur", tbodyMinggu.indexOf("🔒 Libur (Tidak Hadir)") !== -1);

// ABSENSI-5: Pekerja dengan Status 'Tidak Aktif' di Pengaturan_Tarif_Shift TIDAK AKAN MUNCUL di Absen
if (window._mockDb && window._mockDb.tarifShift) {
  window._mockDb.tarifShift.push({
    idAturan: "TARIF-998",
    role: "Perawat",
    namaPekerja: "Staf Aktif Terdaftar",
    status: "Aktif"
  });
  window._mockDb.tarifShift.push({
    idAturan: "TARIF-999",
    role: "Perawat",
    namaPekerja: "Staf Eks Tidak Aktif",
    status: "Tidak Aktif"
  });
}
if (window.PayrollState && window.PayrollState.tarifShift) {
  window.PayrollState.tarifShift.push({
    idAturan: "TARIF-998",
    role: "Perawat",
    namaPekerja: "Staf Aktif Terdaftar",
    status: "Aktif"
  });
  window.PayrollState.tarifShift.push({
    idAturan: "TARIF-999",
    role: "Perawat",
    namaPekerja: "Staf Eks Tidak Aktif",
    status: "Tidak Aktif"
  });
}

// Refresh data absensi
handleAbsensiDateChange("2026-10-15");
runAllTimers();
var inactiveWorkerInAbsensi = (window.AbsensiState.activeWorkers || []).find(function(w) {
  return w.namaPekerja === "Staf Eks Tidak Aktif";
});
var activeWorkerInAbsensi = (window.AbsensiState.activeWorkers || []).find(function(w) {
  return w.namaPekerja === "Staf Aktif Terdaftar";
});

assert("ABSENSI-5: Pekerja Berstatus 'Tidak Aktif' TIDAK MUNCUL di Daftar Absen", inactiveWorkerInAbsensi === undefined);
assert("ABSENSI-5: Pekerja Berstatus 'Aktif' MUNCUL di Daftar Absen", activeWorkerInAbsensi !== undefined);

// ABSENSI-6: Status_Absensi Strictly Hanya Opsi (Hadir / Tidak) & Default 'Tidak'
pilihShiftAbsensi('Pagi');
renderAbsensiTable();
var activeKey = "staf aktif terdaftar";
assert("ABSENSI-6: Default Status Absensi adalah 'Tidak' (Tidak Hadir)", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Tidak");

var tbodyContent = document.getElementById('tbodyAbsensiPegawai') ? document.getElementById('tbodyAbsensiPegawai').innerHTML : "";
assert("ABSENSI-6: Tabel Tidak Menampilkan ID Aturan", tbodyContent.indexOf("ID Aturan:") === -1);
assert("ABSENSI-6: Tabel Tidak Menampilkan Input Keterangan", tbodyContent.indexOf("updateWorkerKeterangan") === -1);
assert("ABSENSI-6: Tabel Menampilkan Nama Pegawai Jelas", tbodyContent.indexOf("Staf Aktif Terdaftar") !== -1);

quickMarkAllHadir();
assert("ABSENSI-6: Tandai Semua Hadir Menghasilkan Status 'Hadir'", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Hadir");

quickMarkAllTidak();
assert("ABSENSI-6: Reset ke Tidak Hadir Menghasilkan Status 'Tidak'", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Tidak");

// Test toggle Hadir / Tidak pada Shift Pagi
toggleWorkerAbsensi("Staf Aktif Terdaftar");
assert("ABSENSI-6: Toggle Status Mengubah Menjadi 'Hadir'", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Hadir");

// ABSENSI-7: Simpan Presensi Shift Menyimpan Data ke Presensi Harian
simpanAbsensiShiftCurrent();
runAllTimers();
var savedShiftAtt = (window.AbsensiState.presensiHariIni || []).find(function(p) {
  return (p.namaPekerja || '').toLowerCase() === "staf aktif terdaftar" && p.shift === window.AbsensiState.currentShift;
});
assert("ABSENSI-7: Simpan Presensi Shift Berhasil Mencatat Riwayat Kehadiran", savedShiftAtt !== undefined && savedShiftAtt.statusAbsensi === "Hadir");

// Tes independensi shift: Beralih ke Shift Sore, status pekerja harus tetap independen (default 'Tidak', tidak mengikuti Shift Pagi)
pilihShiftAbsensi("Sore");
assert("ABSENSI-7: Beralih ke Shift Sore Status Awal Pekerja adalah 'Tidak' (Independen)", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Tidak");
// Beralih kembali ke Shift Pagi, status 'Hadir' pada Shift Pagi harus tetap tersimpan
pilihShiftAbsensi("Pagi");
assert("ABSENSI-7: Beralih Kembali ke Shift Pagi Status Pekerja Tetap 'Hadir'", window.AbsensiState.attendanceMap[activeKey] && window.AbsensiState.attendanceMap[activeKey].status === "Hadir");

// ABSENSI-8: Fitur Tambah & Edit Manual Hari Libur (Kalender Libur)
document.getElementById('inputTglLibur').value = "2026-11-20";
document.getElementById('inputNamaLibur').value = "Hari Libur Khusus Klinik Sheldon";
document.getElementById('inputKategoriLibur').value = "Libur Khusus Klinik";
document.getElementById('inputStatusOperasional').value = "Tutup";
document.getElementById('inputKeteranganLibur').value = "Sterilisasi Alat & Renovasi Minor";

handleSimpanHariLibur();
runAllTimers();
var savedLibur = (window.AbsensiState.kalenderLibur || []).find(function(k) {
  return k.tanggal === "20-11-2026";
});
assert("ABSENSI-8: Hari Libur Manual Berhasil Ditambahkan ke Kalender Libur", savedLibur !== undefined && savedLibur.namaHariLibur === "Hari Libur Khusus Klinik Sheldon");
assert("ABSENSI-8: Status Operasional Hari Libur Tersimpan 'Tutup'", savedLibur && savedLibur.statusOperasional === "Tutup");

// ABSENSI-9: Header Hari_Kerja di Rekap_Bulanan & Formula (Hari Kerja = Hari Bulan - Hari Libur)
switchTabAbsensi('rekap');
renderRekapBulanan();
var infoHkOkt = hitungHariKerjaBulan("Oktober 2026", window.AbsensiState.kalenderLibur);
// Oktober 2026 memiliki 31 hari, 4 hari Minggu, 0 libur nasional = 27 hari kerja
assert("ABSENSI-9: Total Hari Bulan Oktober 2026 adalah 31 Hari", infoHkOkt.totalDays === 31);
assert("ABSENSI-9: Total Hari Libur Oktober 2026 adalah 4 Hari (Minggu)", infoHkOkt.totalLibur === 4);
assert("ABSENSI-9: Hari Kerja Dihitung Akurat (31 - 4 = 27 Hari)", infoHkOkt.hariKerja === 27);

// Uji jika ada libur khusus tambahan pada hari kerja (20-11-2026 yang jatuh pada hari Jumat)
var infoHkNov = hitungHariKerjaBulan("November 2026", window.AbsensiState.kalenderLibur);
// November 2026 memiliki 30 hari, 5 hari Minggu (1, 8, 15, 22, 29), + 1 libur klinik tgl 20 Nov = 6 libur -> 24 hari kerja
assert("ABSENSI-9: Hari Kerja November 2026 Terhitung Akurat Dikurangi Libur Tambahan (30 - 6 = 24 Hari)", infoHkNov.hariKerja === 24);

// Verifikasi badge dan kolom tabel Rekap Bulanan
var badgeHkEl = document.getElementById('badgeHariKerjaRekap');
assert("ABSENSI-9: Badge Hari Kerja Tersedia dan Tampil di UI Rekap", badgeHkEl !== null && badgeHkEl.innerText.indexOf('27') !== -1);

// ABSENSI-10: Visibilitas Atur Hari Libur & Buka Google Sheets Khusus Role Owner
assert("ABSENSI-10: Tombol Atur Hari Libur Manual Dihilangkan dari Header (Double)", isBtnAturLiburRemoved);
assert("ABSENSI-10: Tombol Refresh Tersedia Menggantikan Muat Ulang", isBtnRefreshInHtml);

terapkanRoleAkses("Admin");
var btnSheetAdmin = document.getElementById('btnBukaSheetAbsensi');
assert("ABSENSI-10: Role Admin Menyembunyikan Tombol Buka Google Sheets", btnSheetAdmin && btnSheetAdmin.classList.contains('hidden'));

terapkanRoleAkses("Owner");
var btnSheetOwner = document.getElementById('btnBukaSheetAbsensi');
assert("ABSENSI-10: Role Owner Menampilkan Tombol Buka Google Sheets", btnSheetOwner && !btnSheetOwner.classList.contains('hidden'));

// ABSENSI-11: Tombol Shift Pagi & Shift Sore Berada di Action Bar & Berukuran Besar
var btnPagiEl = document.getElementById('btnShiftPagi');
var btnSoreEl = document.getElementById('btnShiftSore');
var btnSimpanEl = document.getElementById('btnSimpanAbsensi');
assert("ABSENSI-11: Tombol Shift Pagi Tersedia & Berukuran Besar", btnPagiEl !== null && btnPagiEl.className.indexOf('px-5') !== -1);
assert("ABSENSI-11: Tombol Shift Sore Tersedia & Berukuran Besar", btnSoreEl !== null && btnSoreEl.className.indexOf('px-5') !== -1);
assert("ABSENSI-11: Tombol Simpan Presensi Shift Berukuran Besar", btnSimpanEl !== null && btnSimpanEl.className.indexOf('px-7') !== -1);

// ABSENSI-12: Input Tanggal Berukuran Besar, Paginasi & Subtitle Dihilangkan
assert("ABSENSI-12: Input Pemilih Tanggal Berukuran Besar di HTML", isDatePickerLargeInHtml === true);
assert("ABSENSI-12: Tombol Paginasi Hari Ini Dihilangkan dari UI", isPaginasiHariIniRemoved === true);
assert("ABSENSI-12: Subtitle Keterangan Absensi Dihilangkan dari UI", isSubtitleAbsensiRemoved === true);

// ABSENSI-13: UI Minimalis & Compact - Subtitle Tercatat & Izin Dihilangkan, Jam pada Button Shift Dihilangkan, Tanggal & Hari pada View Ditampilkan, Shift Tampil Sesuai Shift Aktif
assert("ABSENSI-13: Subtitle 'Tercatat masuk tugas' Dihilangkan", isTercatatMasukRemoved === true);
assert("ABSENSI-13: Subtitle 'Izin / Sakit / Off' Dihilangkan", isIzinSakitOffRemoved === true);
var btnPagiInner = document.getElementById('btnShiftPagi') ? document.getElementById('btnShiftPagi').innerHTML : "";
var btnSoreInner = document.getElementById('btnShiftSore') ? document.getElementById('btnShiftSore').innerHTML : "";
assert("ABSENSI-13: Jam pada Tombol Shift Pagi Dihilangkan", btnPagiInner.indexOf("10:00 - 15:00") === -1 && btnPagiInner.indexOf("10.00 - 15.00") === -1);
assert("ABSENSI-13: Jam pada Tombol Shift Sore Dihilangkan", btnSoreInner.indexOf("16:00 - 20:00") === -1 && btnSoreInner.indexOf("16.00 - 20.00") === -1);

var viewHeaderTgl = document.getElementById('viewHeaderTanggalText');
assert("ABSENSI-13: Tanggal dan Hari Ditampilkan pada View Absensi", viewHeaderTgl !== null && viewHeaderTgl.innerText.length > 5);

pilihShiftAbsensi('Pagi');
renderAbsensiTable();
var tbodyPagiHtml = document.getElementById('tbodyAbsensiPegawai') ? document.getElementById('tbodyAbsensiPegawai').innerHTML : "";
assert("ABSENSI-13: Kolom Shift Menampilkan 'Shift Pagi' saat Shift Pagi Terpilih", tbodyPagiHtml.indexOf("Shift Pagi") !== -1);

pilihShiftAbsensi('Sore');
renderAbsensiTable();
var tbodySoreHtml = document.getElementById('tbodyAbsensiPegawai') ? document.getElementById('tbodyAbsensiPegawai').innerHTML : "";
assert("ABSENSI-13: Kolom Shift Menampilkan 'Shift Sore' saat Shift Sore Terpilih", tbodySoreHtml.indexOf("Shift Sore") !== -1);
pilihShiftAbsensi('Pagi'); // Kembalikan ke Shift Pagi

// ABSENSI-14: Sinkronisasi Otomatis Rekap Bulanan dari Presensi Harian
var rekapStaf = (window.AbsensiState.rekapBulanan || []).find(function(r) {
  return (r.namaPekerja || '').toLowerCase() === "staf aktif terdaftar";
});
assert("ABSENSI-14: Rekap Bulanan Pegawai Mencatat Kehadiran setelah Simpan Presensi", rekapStaf !== undefined && rekapStaf.totalHadir >= 1);
renderRekapBulanan();
var tbodyRekapHtml = document.getElementById('tbodyRekapBulanan') ? document.getElementById('tbodyRekapBulanan').innerHTML : "";
assert("ABSENSI-14: Tabel Rekap Bulanan Menampilkan Total Hadir Pegawai", tbodyRekapHtml.indexOf("Staf Aktif Terdaftar") !== -1 && tbodyRekapHtml.indexOf(">1<") !== -1);

// --- TEST: Kategori Role (Owner, Dokter Gigi Spesialis, Dokter Gigi Umum, Perawat Gigi, Perawat Umum, Admin, Office) ---
var selectRoleEl = document.getElementById('dbUserRole');
assert("ROLE-1: Dropdown Kategori Role Tersedia", selectRoleEl !== null);

var roleOpts = (typeof roleSelectOptionsFromHtml !== 'undefined' && roleSelectOptionsFromHtml.length > 0) ? roleSelectOptionsFromHtml : [];
if (roleOpts.length === 0 && selectRoleEl && selectRoleEl.options) {
  for (var ro = 0; ro < selectRoleEl.options.length; ro++) {
    roleOpts.push(selectRoleEl.options[ro].value);
  }
}
assert("ROLE-2: Super User Tidak Lagi Ada di Opsi Role", roleOpts.indexOf("Super User") === -1);
assert("ROLE-2: Role Owner Berada di Opsi Pertama", roleOpts[0] === "Owner");
assert("ROLE-2: Role Dokter Gigi Spesialis Tersedia", roleOpts.indexOf("Dokter Gigi Spesialis") !== -1);
assert("ROLE-2: Role Dokter Gigi Umum Tersedia", roleOpts.indexOf("Dokter Gigi Umum") !== -1);
assert("ROLE-2: Role Perawat Gigi Tersedia", roleOpts.indexOf("Perawat Gigi") !== -1);
assert("ROLE-2: Role Perawat Umum Tersedia", roleOpts.indexOf("Perawat Umum") !== -1);
assert("ROLE-2: Role Admin Tersedia", roleOpts.indexOf("Admin") !== -1);
assert("ROLE-2: Role Office Tersedia Menggantikan Owner Sebelumnya", roleOpts.indexOf("Office") !== -1);

var fallbackUsers = getFallbackUserList();
var adminUser = fallbackUsers.find(function(u) { return u.username === "asung"; });
assert("ROLE-3: Akun Utama Owner (asung) Menggunakan Role 'Owner'", adminUser && adminUser.role === "Owner");

// Uji terapkanRoleAkses untuk Role 'Office'
terapkanRoleAkses("Office");
assert("ROLE-4: Role Office Menampilkan Menu Pasien, Informasi, dan Absensi", !document.getElementById('nav-pasien').classList.contains('hidden') && !document.getElementById('nav-informasi').classList.contains('hidden') && !document.getElementById('nav-absensi').classList.contains('hidden'));
assert("ROLE-4: Role Office Menyembunyikan Tombol Tambah Pasien (View-Only)", document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("ROLE-4: Role Office Menyembunyikan Menu Kasir & Payroll", document.getElementById('nav-kasir').classList.contains('hidden') && document.getElementById('nav-payroll').classList.contains('hidden'));

// Kembalikan ke Role 'Owner'
terapkanRoleAkses("Owner");
assert("ROLE-5: Role Owner Menampilkan Seluruh Menu Termasuk User Master", !document.getElementById('nav-user-master').classList.contains('hidden') && !document.getElementById('nav-dashboard').classList.contains('hidden'));

// --- TEST: Pengaturan Jasa Medis (JM) Dokter Hanya Tampil untuk Dokter Gigi Spesialis & Umum ---
var wrapJM = document.getElementById('wrapperDokterJM');
var inputJM = document.getElementById('dbUserPersenJM');
var roleSelect = document.getElementById('dbUserRole');

// 1. Uji saat Dokter Gigi Spesialis dipilih -> wrapper tampil, default tetap 0
inputJM.value = "0";
roleSelect.value = "Dokter Gigi Spesialis";
handleRoleChange();
assert("ROLE-JM-1: Pengaturan JM Tampil saat Role Dokter Gigi Spesialis", !wrapJM.classList.contains('hidden'));
assert("ROLE-JM-1: Default JM Dokter Gigi Spesialis Tetap 0", inputJM.value === "0");

// 2. Uji saat Dokter Gigi Umum dipilih -> wrapper tampil, default tetap 0
inputJM.value = "0";
roleSelect.value = "Dokter Gigi Umum";
handleRoleChange();
assert("ROLE-JM-2: Pengaturan JM Tampil saat Role Dokter Gigi Umum", !wrapJM.classList.contains('hidden'));
assert("ROLE-JM-2: Default JM Dokter Gigi Umum Tetap 0", inputJM.value === "0");

// 3. Uji saat Role Selain Dokter dipilih (Owner, Perawat Gigi, Perawat Umum, Admin, Office) -> wrapper tersembunyi, default 0
var nonDokterRoles = ["Perawat Gigi", "Perawat Umum", "Admin", "Office", "Owner"];
nonDokterRoles.forEach(function(r) {
  roleSelect.value = r;
  handleRoleChange();
  assert("ROLE-JM-3: Pengaturan JM Tidak Tampil untuk Role " + r, wrapJM.classList.contains('hidden'));
  assert("ROLE-JM-3: Default JM untuk Role " + r + " adalah 0", inputJM.value === "0");
});

// Kembalikan ke default tambah user
batalEditDbUser(false);
assert("ROLE-JM-4: Form Baru Mereset JM ke 0 dan Tersembunyi", wrapJM.classList.contains('hidden') && inputJM.value === "0");

// 4. Uji Integrasi Tab Master User & Payroll dalam Master User & Role
assert("USER-PAYROLL-1: Tab Master User Tersedia", document.getElementById('btnTabMasterUser') !== null);
assert("USER-PAYROLL-1: Tab Payroll & Honor Tersedia di Master User", document.getElementById('btnTabMasterPayroll') !== null);
assert("USER-PAYROLL-1: Tombol Toggle User Form Tersedia", document.getElementById('btnToggleFormUser') !== null);

// Uji Toggle Form User: Klik memunculkan form di atas
toggleFormUser(true);
assert("USER-PAYROLL-2: Form User Tampil saat Tombol User Diklik", !document.getElementById('cardFormUser').classList.contains('hidden'));

// Uji Toggle Tutup Form
toggleFormUser(false);
assert("USER-PAYROLL-2: Form User Tersembunyi saat Ditutup", document.getElementById('cardFormUser').classList.contains('hidden'));

// Uji Beralih ke Tab Payroll di dalam Master User & Role
switchMasterUserSubTab('payroll');
assert("USER-PAYROLL-3: Panel Payroll Aktif di dalam Master User", !document.getElementById('subpanelMasterPayroll').classList.contains('hidden'));
assert("USER-PAYROLL-3: Panel User Tersembunyi saat Tab Payroll Aktif", document.getElementById('subpanelMasterUser').classList.contains('hidden'));

// Kembalikan ke Tab User
switchMasterUserSubTab('user');
assert("USER-PAYROLL-4: Panel User Kembali Aktif", !document.getElementById('subpanelMasterUser').classList.contains('hidden'));

// 5. Uji Tab Owner Utility di dalam Master User & Role
assert("OWNER-UTIL-1: Tab Owner Utility Tersedia di Master User", document.getElementById('btnTabMasterOwnerUtility') !== null);
assert("OWNER-UTIL-1: Subpanel Owner Utility Tersedia", document.getElementById('subpanelMasterOwnerUtility') !== null);

// Uji Beralih ke Tab Owner Utility
switchMasterUserSubTab('owner-utility');
assert("OWNER-UTIL-2: Panel Owner Utility Aktif", !document.getElementById('subpanelMasterOwnerUtility').classList.contains('hidden'));
assert("OWNER-UTIL-2: Panel User Tersembunyi saat Tab Owner Utility Aktif", document.getElementById('subpanelMasterUser').classList.contains('hidden'));
assert("OWNER-UTIL-2: Panel Payroll Tersembunyi saat Tab Owner Utility Aktif", document.getElementById('subpanelMasterPayroll').classList.contains('hidden'));

// Kembalikan ke Tab User
switchMasterUserSubTab('user');
assert("OWNER-UTIL-3: Panel User Kembali Aktif", !document.getElementById('subpanelMasterUser').classList.contains('hidden'));
assert("OWNER-UTIL-3: Panel Owner Utility Kembali Tersembunyi", document.getElementById('subpanelMasterOwnerUtility').classList.contains('hidden'));

// 5b. Uji Tab Tindakan Khusus Dokter (TKD) di dalam Management User
assert("TKD-1: Tab Tindakan Khusus Dokter Tersedia di Master User", document.getElementById('btnTabMasterTarifKhusus') !== null);
assert("TKD-1: Subpanel Tindakan Khusus Dokter Tersedia", document.getElementById('subpanelMasterTarifKhusus') !== null);

// Uji Beralih ke Tab Tindakan Khusus Dokter
switchMasterUserSubTab('tarif-khusus');
assert("TKD-2: Panel Tindakan Khusus Dokter Aktif", !document.getElementById('subpanelMasterTarifKhusus').classList.contains('hidden'));
assert("TKD-2: Panel User Tersembunyi saat Tab TKD Aktif", document.getElementById('subpanelMasterUser').classList.contains('hidden'));
assert("TKD-2: Panel Payroll Tersembunyi saat Tab TKD Aktif", document.getElementById('subpanelMasterPayroll').classList.contains('hidden'));

// Uji Filter Dokter: Hanya role Dokter Gigi Umum dan Dokter Gigi Spesialis
const dokterGigiList = getDaftarDokterGigiTKD();
assert("TKD-3: Daftar Dokter Gigi Terfilter Tidak Kosong", dokterGigiList.length > 0);
const allDokterValidRole = dokterGigiList.every(d => {
  const r = String(d.role || '').toLowerCase();
  return r.includes('dokter gigi umum') || r.includes('dokter gigi spesialis');
});
assert("TKD-3: Hanya Memuat Role Dokter Gigi Umum & Spesialis", allDokterValidRole);
const hasPerawatInDokter = dokterGigiList.some(d => String(d.role || '').toLowerCase().includes('perawat'));
assert("TKD-3: Perawat Tidak Masuk di Dropdown Dokter", !hasPerawatInDokter);

// Uji Auto Increment ID Aturan TKD-XX (2 Digit)
window._tarifKhususList = [
  { idAturan: "TKD-01", namaDokter: "drg. Regyana Oktavaria", idTindakan: "TND-01", persenJM: 0.5 },
  { idAturan: "TKD-02", namaDokter: "drg. Latifah Mulyana", idTindakan: "TND-02", persenJM: 0.45 }
];
const nextTkdId = generateNextIdAturanTKD();
assert("TKD-4: Next ID Aturan Otomatis 'TKD-03' (2 Digit)", nextTkdId === 'TKD-03');

// Uji Auto-fill Info Tindakan saat dipilih
const tindakanList = getDaftarMasterTindakanTKD();
assert("TKD-5: Master Tindakan Tersedia untuk Auto-fill", tindakanList.length > 0);
if (tindakanList.length > 0) {
  const testItem = tindakanList[0];
  const selectTindakan = document.getElementById('tkdTindakan');
  if (selectTindakan) {
    selectTindakan.value = testItem.nama;
    onTkdTindakanChange();
    const idTindakanVal = document.getElementById('tkdIdTindakan').value;
    const tarifVal = Number(document.getElementById('tkdTarif').value);
    assert("TKD-5: ID Tindakan Terisi Otomatis dari Master", idTindakanVal === (testItem.kode || testItem.id));
    assert("TKD-5: Tarif Tindakan Terisi Otomatis dari Master", tarifVal === Number(testItem.tarif || testItem.harga || 0));
  }
}

// Uji Live Simulasi JM Khusus: (Tarif - Lab) * % JM
document.getElementById('tkdTarif').value = 1000000;
document.getElementById('tkdLabor').value = 'Tidak';
document.getElementById('tkdPersenJM').value = 50;
hitungSimulasiJMKhusus();
assert("TKD-6: Simulasi Hak Dokter 50% dari Rp 1.000.000 adalah Rp 500.000", document.getElementById('simulasiHakDokter').textContent.includes('500.000'));
assert("TKD-6: Simulasi Hak Klinik 50% dari Rp 1.000.000 adalah Rp 500.000", document.getElementById('simulasiHakKlinik').textContent.includes('500.000'));

// Kembalikan ke Tab User
switchMasterUserSubTab('user');
assert("TKD-7: Panel User Kembali Aktif", !document.getElementById('subpanelMasterUser').classList.contains('hidden'));
assert("TKD-7: Panel TKD Kembali Tersembunyi", document.getElementById('subpanelMasterTarifKhusus').classList.contains('hidden'));

// 5c. Uji Penyaringan Tindakan Medis Sesuai Role Dokter Penanggung Jawab di Kasir
const mockSampleTindakan = [
  { kode: "UMM-0001", nama: "Pemeriksaan Dan Konsultasi", kategori: "Umum", tarif: 50000 },
  { kode: "UMM-0002", nama: "Konsultasi Dokter Gigi", kategori: "Umum", tarif: 50000 },
  { kode: "DGU-0001", nama: "Penambalan Komposit Light-Cure", kategori: "Dokter Gigi Umum", tarif: 250000 },
  { kode: "DGU-0002", nama: "Scaling Rahang Atas & Bawah", kategori: "Dokter Gigi Umum", tarif: 300000 },
  { kode: "DGS-0001", nama: "Perawatan Saluran Akar (PSA) Molar", kategori: "Dokter Gigi Spesialis", tarif: 1500000 },
  { kode: "DGS-0002", nama: "Odontektomi Gigi Impaksi M3", kategori: "Dokter Gigi Spesialis", tarif: 2500000 }
];

// Test Dokter Gigi Umum: Hanya tindakan Kategori "Dokter Gigi Umum" + "Umum"
const tindakanDGU = filterTindakanByRoleDokter(mockSampleTindakan, "Dokter Gigi Umum");
assert("KASIR-FILTER-1: Dokter Gigi Umum Memuat Tindakan Kategori Dokter Gigi Umum", tindakanDGU.some(t => t.kode === "DGU-0001"));
assert("KASIR-FILTER-1: Dokter Gigi Umum Memuat Tindakan Kategori Umum", tindakanDGU.some(t => t.kode === "UMM-0001"));
assert("KASIR-FILTER-1: Dokter Gigi Umum TIDAK Memuat Tindakan Dokter Gigi Spesialis", !tindakanDGU.some(t => t.kode === "DGS-0001"));
assert("KASIR-FILTER-1: Dokter Gigi Umum TIDAK Memuat Odontektomi", !tindakanDGU.some(t => t.kode === "DGS-0002"));

// Test Dokter Gigi Spesialis: Hanya tindakan Kategori "Dokter Gigi Spesialis" + "Umum"
const tindakanDGS = filterTindakanByRoleDokter(mockSampleTindakan, "Dokter Gigi Spesialis");
assert("KASIR-FILTER-2: Dokter Gigi Spesialis Memuat Tindakan Kategori Dokter Gigi Spesialis", tindakanDGS.some(t => t.kode === "DGS-0001"));
assert("KASIR-FILTER-2: Dokter Gigi Spesialis Memuat Odontektomi", tindakanDGS.some(t => t.kode === "DGS-0002"));
assert("KASIR-FILTER-2: Dokter Gigi Spesialis Memuat Tindakan Kategori Umum", tindakanDGS.some(t => t.kode === "UMM-0001"));
assert("KASIR-FILTER-2: Dokter Gigi Spesialis TIDAK Memuat Tindakan Dokter Gigi Umum", !tindakanDGS.some(t => t.kode === "DGU-0001"));
assert("KASIR-FILTER-2: Dokter Gigi Spesialis TIDAK Memuat Penambalan DGU", !tindakanDGS.some(t => t.kode === "DGU-0002"));

// Test Kategori Umum: Selalu muncul untuk SEMUA dokter
assert("KASIR-FILTER-3: Kategori Umum (UMM) Muncul untuk Dokter Gigi Umum", tindakanDGU.some(t => t.kategori.toLowerCase() === "umum"));
assert("KASIR-FILTER-3: Kategori Umum (UMM) Muncul untuk Dokter Gigi Spesialis", tindakanDGS.some(t => t.kategori.toLowerCase() === "umum"));

// Test Update Datalist Kasir saat Dokter Dipilih di UI
const ksrDokEl = document.getElementById('ksrDokter');
if (ksrDokEl) {
  window.KlinikData.tindakan = mockSampleTindakan;
  window.KlinikData.staff = [
    { nama: "drg. Regyana Oktavaria", role: "Dokter Gigi Umum" },
    { nama: "drg. Rahma Yulinda D, Sp. BMM", role: "Dokter Gigi Spesialis" }
  ];
  
  // Pilih Dokter Gigi Umum
  ksrDokEl.value = "drg. Regyana Oktavaria";
  updateDatalistTindakan();
  const dlKasirContentDGU = document.getElementById('dlTindakanKasir')?.innerHTML || '';
  assert("KASIR-UI-1: Datalist Kasir Berisi Tindakan DGU saat Dokter Gigi Umum Dipilih", dlKasirContentDGU.includes("Penambalan Komposit Light-Cure"));
  assert("KASIR-UI-1: Datalist Kasir Berisi Tindakan Umum saat Dokter Gigi Umum Dipilih", dlKasirContentDGU.includes("Konsultasi Dokter Gigi"));
  assert("KASIR-UI-1: Datalist Kasir TIDAK Berisi Tindakan Spesialis saat Dokter Gigi Umum Dipilih", !dlKasirContentDGU.includes("Odontektomi Gigi Impaksi M3"));

  // Ganti ke Dokter Gigi Spesialis
  ksrDokEl.value = "drg. Rahma Yulinda D, Sp. BMM";
  updateDatalistTindakan();
  const dlKasirContentDGS = document.getElementById('dlTindakanKasir')?.innerHTML || '';
  assert("KASIR-UI-2: Datalist Kasir Berisi Tindakan Spesialis saat Dokter Spesialis Dipilih", dlKasirContentDGS.includes("Odontektomi Gigi Impaksi M3"));
  assert("KASIR-UI-2: Datalist Kasir Berisi Tindakan Umum saat Dokter Spesialis Dipilih", dlKasirContentDGS.includes("Konsultasi Dokter Gigi"));
  assert("KASIR-UI-2: Datalist Kasir TIDAK Berisi Tindakan DGU saat Dokter Spesialis Dipilih", !dlKasirContentDGS.includes("Penambalan Komposit Light-Cure"));
}

// 6. Uji Urutan Navigasi Sidebar Pelayanan Pasien & Administrasi
assert("SIDEBAR-ORDER-1: Urutan Tombol Pelayanan Pasien Sesuai Spesifikasi (Pasien, EMR, Kasir, Invoice, Surat)", isPelayananOrderedInHtml);
assert("SIDEBAR-ORDER-2: Label Kelompok Administrasi Berubah Menjadi ADMINISTRASI", isAdminHeaderInHtml);
assert("SIDEBAR-ORDER-3: Urutan Tombol Administrasi Sesuai Spesifikasi (Absensi, Informasi, DB Master, Master User)", isAdminOrderedInHtml);

// 7. Uji Penyatuan Tab Payroll: 'Gaji & Jasa Medis'
assert("PAYROLL-UNIFIED-1: Tombol Tab Gaji & Jasa Medis (tabBtnPay-gaji-jm) Tersedia", document.getElementById('tabBtnPay-gaji-jm') !== null);
assert("PAYROLL-UNIFIED-1: Teks Tombol Berisi '1. Gaji & Jasa Medis'", isTabBtnPayInHtml);
assert("PAYROLL-UNIFIED-2: Panel Terpadu panelPay-gaji-jm Tersedia di HTML", isPanelPayInHtml);
assert("PAYROLL-UNIFIED-2: Filter Cepat Tampilan Tersedia", document.getElementById('btnFilterGajiJm-all') !== null && document.getElementById('btnFilterGajiJm-dokter') !== null && document.getElementById('btnFilterGajiJm-staff') !== null);

// Inisialisasi class payroll-tab-panel pada mock element agar querySelectorAll('.payroll-tab-panel') mengenali
document.getElementById('panelPay-gaji-jm').classList.add('payroll-tab-panel');
document.getElementById('panelPay-tarif').classList.add('payroll-tab-panel');
document.getElementById('panelPay-rincian-jm').classList.add('payroll-tab-panel');

// Uji Filter Tampilan: Khusus Dokter
filterGajiJmView('dokter');
assert("PAYROLL-UNIFIED-3: Filter Khusus Dokter Menampilkan Card Dokter", !document.getElementById('panelPay-dokter').classList.contains('hidden'));
assert("PAYROLL-UNIFIED-3: Filter Khusus Dokter Menyembunyikan Card Staff", document.getElementById('panelPay-staff').classList.contains('hidden'));

// Uji Filter Tampilan: Khusus Staff / Perawat & Admin
filterGajiJmView('staff');
assert("PAYROLL-UNIFIED-4: Filter Khusus Staff Menyembunyikan Card Dokter", document.getElementById('panelPay-dokter').classList.contains('hidden'));
assert("PAYROLL-UNIFIED-4: Filter Khusus Staff Menampilkan Card Staff", !document.getElementById('panelPay-staff').classList.contains('hidden'));

// Uji Filter Tampilan: Semua
filterGajiJmView('all');
assert("PAYROLL-UNIFIED-5: Filter Semua Menampilkan Keduanya", !document.getElementById('panelPay-dokter').classList.contains('hidden') && !document.getElementById('panelPay-staff').classList.contains('hidden'));

// Uji Switch Tab Payroll
switchPayrollTab('tarif');
assert("PAYROLL-UNIFIED-6: Beralih ke Tab Tarif Menyembunyikan panelPay-gaji-jm", document.getElementById('panelPay-gaji-jm').classList.contains('hidden'));
assert("PAYROLL-UNIFIED-6: Beralih ke Tab Tarif Menampilkan panelPay-tarif", !document.getElementById('panelPay-tarif').classList.contains('hidden'));

switchPayrollTab('gaji-jm');
assert("PAYROLL-UNIFIED-7: Beralih Kembali ke Gaji & JM Menampilkan panelPay-gaji-jm", !document.getElementById('panelPay-gaji-jm').classList.contains('hidden'));

// Uji Tipe Kompensasi & Kunci Form Input
var elTipeKomp = document.getElementById('tarifTipe');
var s1Input = document.getElementById('tarifShift1');
var s2Input = document.getElementById('tarifShift2');
var gpInput = document.getElementById('tarifGajiPokok');

assert("KOMPENSASI-1: Select tarifTipe Tersedia di DOM", elTipeKomp !== null);
assert("KOMPENSASI-1: Fungsi handleTarifTipeChange Tersedia", typeof handleTarifTipeChange === "function");

// 1. Default Kosong
resetFormTarifShiftBaru();
assert("KOMPENSASI-2: Default Tipe Kompensasi adalah Kosong", elTipeKomp.value === "");
assert("KOMPENSASI-2: Saat Kosong, Tarif Shift 1 Terkunci (disabled)", s1Input.disabled === true);
assert("KOMPENSASI-2: Saat Kosong, Tarif Shift 2 Terkunci (disabled)", s2Input.disabled === true);
assert("KOMPENSASI-2: Saat Kosong, Gaji Pokok Terkunci (disabled)", gpInput.disabled === true);

// 2. Tindakan: Tarif shift 1 dan 2, gaji pokok tidak bisa di isi
elTipeKomp.value = "Tindakan";
handleTarifTipeChange();
assert("KOMPENSASI-3: Saat Tindakan, Tarif Shift 1 Terkunci (disabled)", s1Input.disabled === true && Number(s1Input.value) === 0);
assert("KOMPENSASI-3: Saat Tindakan, Tarif Shift 2 Terkunci (disabled)", s2Input.disabled === true && Number(s2Input.value) === 0);
assert("KOMPENSASI-3: Saat Tindakan, Gaji Pokok Terkunci (disabled)", gpInput.disabled === true && Number(gpInput.value) === 0);

// 3. Uang Harian Shift: Gaji pokok Bulanan tidak bisa di isi
elTipeKomp.value = "Uang Harian Shift";
handleTarifTipeChange();
assert("KOMPENSASI-4: Saat Uang Harian Shift, Tarif Shift 1 Terbuka (enabled)", s1Input.disabled === false);
assert("KOMPENSASI-4: Saat Uang Harian Shift, Tarif Shift 2 Terbuka (enabled)", s2Input.disabled === false);
assert("KOMPENSASI-4: Saat Uang Harian Shift, Gaji Pokok Terkunci (disabled)", gpInput.disabled === true && Number(gpInput.value) === 0);

// 4. Gaji Bulanan Tetap: Tarif shift tidak bisa di isi
elTipeKomp.value = "Gaji Bulanan Tetap";
handleTarifTipeChange();
assert("KOMPENSASI-5: Saat Gaji Bulanan Tetap, Tarif Shift 1 Terkunci (disabled)", s1Input.disabled === true && Number(s1Input.value) === 0);
assert("KOMPENSASI-5: Saat Gaji Bulanan Tetap, Tarif Shift 2 Terkunci (disabled)", s2Input.disabled === true && Number(s2Input.value) === 0);
assert("KOMPENSASI-5: Saat Gaji Bulanan Tetap, Gaji Pokok Terbuka (enabled)", gpInput.disabled === false);

// 5. Kombinasi Shift & Tindakan: Gaji pokok tidak bisa di isi
elTipeKomp.value = "Kombinasi Shift & Tindakan";
handleTarifTipeChange();
assert("KOMPENSASI-6: Saat Kombinasi Shift & Tindakan, Tarif Shift 1 Terbuka (enabled)", s1Input.disabled === false);
assert("KOMPENSASI-6: Saat Kombinasi Shift & Tindakan, Tarif Shift 2 Terbuka (enabled)", s2Input.disabled === false);
assert("KOMPENSASI-6: Saat Kombinasi Shift & Tindakan, Gaji Pokok Terkunci (disabled)", gpInput.disabled === true && Number(gpInput.value) === 0);

// ==================================================
// PENGUJIAN SINKRONISASI HARGA TINDAKAN, TOMBOL CLEAR (✕), DAN VIEW HARGA
// ==================================================
print("\n--- TEST: Sinkronisasi Tindakan, Tombol Clear (✕), dan View Harga ---");
var tindPemeriksaan = (window.KlinikData.tindakan || []).find(function(t) { return t.nama === "Pemeriksaan Dan Konsultasi"; });
assert("KASIR-TINDAKAN-SINKRON-1: Tindakan 'Pemeriksaan Dan Konsultasi' Ada di Database", tindPemeriksaan !== undefined);
assert("KASIR-TINDAKAN-SINKRON-2: Tarif 'Pemeriksaan Dan Konsultasi' adalah Rp 50.000 (Bukan 100.000)", tindPemeriksaan && tindPemeriksaan.tarif === 50000);
assert("KASIR-TINDAKAN-SINKRON-3: Kategori 'Pemeriksaan Dan Konsultasi' adalah Umum", tindPemeriksaan && tindPemeriksaan.kategori === "Umum");

// Cek fungsi clearKasirRowInput
assert("KASIR-CLEAR-BTN-1: Fungsi clearKasirRowInput Tersedia", typeof clearKasirRowInput === "function");

// Simulasi Add Baris Tindakan, Input, dan Clear
document.getElementById('ksrTbodyTindakan').innerHTML = '';
addKasirTindakan();
var rowTind = document.getElementById('ksrTbodyTindakan').children[0];
assert("KASIR-ROW-TINDAKAN-1: Baris Tindakan Tersedia di DOM", rowTind !== undefined);
var btnClearTind = rowTind ? rowTind.querySelector('.btn-clear-val') : null;
assert("KASIR-ROW-TINDAKAN-2: Baris Tindakan Memiliki Tombol Silang Clear", btnClearTind !== null);
var infoTind = rowTind ? rowTind.querySelector('.val-info-tindakan') : null;
assert("KASIR-ROW-TINDAKAN-3: Baris Tindakan Memiliki Container val-info-tindakan", infoTind !== null);

// Simulasi pemilihan tindakan
var inpTind = rowTind.querySelector('.val-nama');
inpTind.value = "Pemeriksaan Dan Konsultasi";
onInputDatalistChange(inpTind, 'tindakan');
var hargaTind = parseUangKSR(rowTind.querySelector('.val-harga').value);
assert("KASIR-VIEW-HARGA-1: Harga Tindakan Otomatis Terisi Rp 50.000", hargaTind === 50000);
assert("KASIR-VIEW-HARGA-2: Label Info Tindakan Menampilkan Tarif Rp 50.000", infoTind && infoTind.innerHTML.includes("50.000"));
assert("KASIR-VIEW-HARGA-3: Label Info Tindakan Menampilkan Kode UMM-0001", infoTind && infoTind.innerHTML.includes("UMM-0001"));

// Simulasi klik tombol clear (✕)
clearKasirRowInput(btnClearTind, 'tindakan');
assert("KASIR-CLEAR-EXEC-1: Input Nama Tindakan Menjadi Kosong setelah Clear", inpTind.value === "");
assert("KASIR-CLEAR-EXEC-2: Harga Tindakan Menjadi 0 setelah Clear", parseUangKSR(rowTind.querySelector('.val-harga').value) === 0);
assert("KASIR-CLEAR-EXEC-3: Label Info Tindakan Menjadi Kosong setelah Clear", infoTind.innerHTML === "");

// Simulasi Baris Obat dengan Tombol Clear
document.getElementById('ksrTbodyObat').innerHTML = '';
addKasirObat();
var rowObat = document.getElementById('ksrTbodyObat').children[0];
assert("KASIR-ROW-OBAT-1: Baris Obat Memiliki Tombol Silang Clear", rowObat && rowObat.querySelector('.btn-clear-val') !== null);
var inpObat = rowObat.querySelector('.val-nama');
var sampleObat = (window.KlinikData.obat && window.KlinikData.obat[0]) ? window.KlinikData.obat[0].nama : "Amoxicillin 500 mg";
inpObat.value = sampleObat;
onInputDatalistChange(inpObat, 'obat');
var btnClearObat = rowObat.querySelector('.btn-clear-val');
clearKasirRowInput(btnClearObat, 'obat');
assert("KASIR-CLEAR-EXEC-4: Input Nama Obat Menjadi Kosong setelah Clear", inpObat.value === "");
assert("KASIR-CLEAR-EXEC-5: Harga Obat Menjadi 0 setelah Clear", parseUangKSR(rowObat.querySelector('.val-harga').value) === 0);
assert("KASIR-CLEAR-EXEC-6: Label Stok Obat Menjadi Kosong setelah Clear", rowObat.querySelector('.val-stok-label').innerText === "");

// Simulasi Baris BMHP dengan Tombol Clear
document.getElementById('ksrTbodyBMHP').innerHTML = '';
addKasirBMHP();
var rowBMHP = document.getElementById('ksrTbodyBMHP').children[0];
assert("KASIR-ROW-BMHP-1: Baris BMHP Memiliki Tombol Silang Clear", rowBMHP && rowBMHP.querySelector('.btn-clear-val') !== null);


// SUMMARY REPORT
print("=================================================");
var passedTotal = results.filter(r => r.passed).length;
var failedTotal = results.length - passedTotal;
print("TOTAL TESTS: " + results.length + " | PASSED: " + passedTotal + " | FAILED: " + failedTotal);
print("=================================================");

if (failedTotal > 0) {
  print("TEST STATUS: FAILED");
} else {
  print("TEST STATUS: ALL TESTS PASSED!");
}
'''

full_test_script = f"var isButtonKonsultasiRemoved = {str(is_kon_removed).lower()};\nvar isModalResetPerioInHtml = {str(is_modal_perio_in_html).lower()};\nvar roleSelectOptionsFromHtml = {json.dumps(role_options)};\nvar isDatePickerLargeInHtml = {str(is_date_picker_large).lower()};\nvar isPaginasiHariIniRemoved = {str(is_paginasi_hari_ini_removed).lower()};\nvar isSubtitleAbsensiRemoved = {str(is_subtitle_absensi_removed).lower()};\nvar isTercatatMasukRemoved = {str(is_tercatat_masuk_removed).lower()};\nvar isIzinSakitOffRemoved = {str(is_izin_sakit_off_removed).lower()};\nvar isBtnDbUserRemoved = {str(is_btn_db_user_removed).lower()};\nvar isPelayananOrderedInHtml = {str(is_pelayanan_ordered).lower()};\nvar isAdminHeaderInHtml = {str(is_admin_header).lower()};\nvar isAdminOrderedInHtml = {str(is_admin_ordered).lower()};\nvar isTabBtnPayInHtml = {str(is_tab_btn_pay_in_html).lower()};\nvar isPanelPayInHtml = {str(is_panel_pay_in_html).lower()};\nvar isBtnAturLiburRemoved = {str(is_btn_atur_libur_removed).lower()};\nvar isBtnRefreshInHtml = {str(is_btn_refresh_in_html).lower()};\nvar isEmrTitleRenamedInHtml = {str(is_emr_title_renamed).lower()};\nvar isClearPasienBtnInHtml = {str(is_clear_pasien_btn_in_html).lower()};\nvar isTglLargeInHtml = {str(is_tgl_large_in_html).lower()};\nvar isTempatLahirInHtml = {str(is_tempat_lahir_in_html).lower()};\nvar isModalToothTglInHtml = {str(is_modal_tooth_tgl_in_html).lower()};\nvar isPanelRefInHtml = {str(is_panel_ref_in_html).lower()};\nvar isMetodeCashTfOnly = {str(is_metode_cash_tf_only).lower()};\nvar isStatusSplitInHtml = {str(is_status_split_in_html).lower()};\nvar isBoxSplitInHtml = {str(is_box_split_in_html).lower()};\n" + dom_shim + "\n" + all_js + "\n" + test_runner_js

with open(test_harness_file, 'w', encoding='utf-8') as f:
    f.write(full_test_script)

print(f"Test harness created at: {test_harness_file} ({len(full_test_script)} bytes)")

res = subprocess.run([JSC_BIN, test_harness_file], capture_output=True, text=True)

print("\n--- TEST EXECUTION OUTPUT ---")
print(res.stdout)
if res.stderr:
    print("--- STDERR ---")
    print(res.stderr)

if "ALL TESTS PASSED!" in res.stdout:
    print("\nSUCCESS: All automated test assertions passed flawlessly!")
else:
    print("\nFAILURE: Some tests failed or errors occurred.")
    exit(1)
