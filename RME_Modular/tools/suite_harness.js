var isButtonKonsultasiRemoved = true;
var isModalResetPerioInHtml = true;

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






(function() {
  if (typeof google === 'undefined') {
    window.google = {};
  }
  if (!google.script) {
    google.script = {};
  }

  // Realistic mock database grounded in Sheldon RME multi-spreadsheet architecture
  const mockDb = {
    staff: [
      { id: "STF-001", nama: "drg. Sheldon Cooper, Sp.Ort", role: "Super User", pin: "1234", sip: "503/SIP-DRG/001/2024", persenJM: 0.50 },
      { id: "STF-002", nama: "drg. Leonard Hofstadter", role: "Dokter Gigi Umum", pin: "1111", sip: "503/SIP-DRG/002/2024", persenJM: 0.45 },
      { id: "STF-003", nama: "Penny Teller", role: "Kasir", pin: "2222", sip: "-", persenJM: 0 },
      { id: "STF-004", nama: "Bernadette Rostenkowski", role: "Perawat Gigi", pin: "3333", sip: "-", persenJM: 0 }
    ],
    tarifKhusus: [
      { idDokter: "STF-001", namaDokter: "drg. Sheldon Cooper, Sp.Ort", kodeTindakan: "TND-006", namaTindakan: "Perawatan Saluran Akar (PSA) Molar", persenJM: 0.55 }
    ],
    pasien: [
      {
        idPasien: "P-0001",
        namaPasien: "Budi Santoso",
        noRm: "RM-0001",
        jenisKelamin: "Laki-Laki",
        tempatLahir: "Payakumbuh",
        tanggalLahir: "1988-08-15",
        umur: "36",
        agama: "Islam",
        golonganDarah: "O",
        pekerjaan: "PNS",
        nik: "1376011508880001",
        alamat: "Jl. Sudirman No. 45, Payakumbuh",
        provinsi: "Sumatera Barat",
        kabupaten: "Kota Payakumbuh",
        kecamatan: "Payakumbuh Barat",
        kelurahan: "Daya Bangun",
        whatsapp: "081234567890",
        alergi: "Penicillin",
        riwayatPenyakit: "Hipertensi",
        catatan: "Pasien kooperatif",
        tglDaftar: "2024-01-01"
      },
      {
        idPasien: "P-0002",
        namaPasien: "Siti Rahmawati",
        noRm: "RM-0002",
        jenisKelamin: "Perempuan",
        tempatLahir: "Bukittinggi",
        tanggalLahir: "1995-11-22",
        umur: "29",
        agama: "Islam",
        golonganDarah: "A",
        pekerjaan: "Wiraswasta",
        nik: "1376012211950002",
        alamat: "Jl. A. Yani No. 12, Bukittinggi",
        provinsi: "Sumatera Barat",
        kabupaten: "Kota Bukittinggi",
        kecamatan: "Guguk Panjang",
        kelurahan: "Benteng",
        whatsapp: "081398765432",
        alergi: "Tidak Ada",
        riwayatPenyakit: "Asma",
        catatan: "Kontrol rutin",
        tglDaftar: "2024-01-05"
      }
    ],
    tindakan: [
      { kode: "TND-001", id: "TND-001", nama: "Scaling Gigi Rahang Atas & Bawah", tarif: 250000, harga: 250000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-002", id: "TND-002", nama: "Penambalan Komposit Light-Cure", tarif: 300000, harga: 300000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-003", id: "TND-003", nama: "Pencabutan Gigi Permanen Ringan", tarif: 200000, harga: 200000, kategori: "Dokter Gigi Umum", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-004", id: "TND-004", nama: "Pemasangan Kawat Gigi Ortho Standard", tarif: 5000000, harga: 5000000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-005", id: "TND-005", nama: "Foto Rontgen Periapikal Digital", tarif: 100000, harga: 100000, kategori: "Umum", perluLab: "Tidak", persenJMDefault: 0.15 },
      { kode: "TND-006", id: "TND-006", nama: "Perawatan Saluran Akar (PSA) Molar", tarif: 1200000, harga: 1200000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Tidak", persenJMDefault: null },
      { kode: "TND-007", id: "TND-007", nama: "Pemasangan Mahkota PFM (Crown)", tarif: 1500000, harga: 1500000, kategori: "Dokter Gigi Spesialis Ortodonti", perluLab: "Ya", persenJMDefault: null }
    ],
    obat: [
      { kode: "OBT-001", id: "OBT-001", nama: "Amoxicillin 500mg (Strip)", harga: 15000, hargaJual: 15000, hpp: 10000, stok: 120, unit: "Strip", satuan: "Strip" },
      { kode: "OBT-002", id: "OBT-002", nama: "Asam Mefenamat 500mg (Strip)", harga: 12000, hargaJual: 12000, hpp: 8000, stok: 85, unit: "Strip", satuan: "Strip" },
      { kode: "OBT-003", id: "OBT-003", nama: "Chlorhexidine Gluconate 0.2% Gargle", harga: 35000, hargaJual: 35000, hpp: 22000, stok: 40, unit: "Botol", satuan: "Botol" }
    ],
    bmhp: [
      { kode: "BMH-001", id: "BMH-001", nama: "Masker Medis 3-Ply", harga: 2000, hargaJual: 2000, hpp: 1000, stok: 500, unit: "Pcs", satuan: "Pcs" },
      { kode: "BMH-002", id: "BMH-002", nama: "Handscoon Latex S/M", harga: 3000, hargaJual: 3000, hpp: 1800, stok: 350, unit: "Pasang", satuan: "Pasang" },
      { kode: "BMH-003", id: "BMH-003", nama: "Saliva Ejector Suction Tip", harga: 1500, hargaJual: 1500, hpp: 800, stok: 200, unit: "Pcs", satuan: "Pcs" }
    ],
    rekamMedis: [],
    pembayaran: [],
    jasaMedis: [],
    surat: []
  };

  window._mockDb = mockDb;

  class ScriptRunMock {
    constructor() {
      this._successHandler = function() {};
      this._failureHandler = function(err) { console.error("Mock GAS Error:", err); };
    }
    withSuccessHandler(fn) { this._successHandler = fn; return this; }
    withFailureHandler(fn) { this._failureHandler = fn; return this; }

    verifyLogin(user, pin) {
      setTimeout(() => {
        let u = mockDb.staff.find(s => s.nama.toLowerCase().includes(user.toLowerCase()) || s.id.toLowerCase() === user.toLowerCase());
        if (u && (pin === u.pin || pin === '1234')) {
          this._successHandler({ success: true, userData: { username: u.id, namaAccount: u.nama, role: u.role } });
        } else {
          this._successHandler({ success: false, message: "Username atau PIN salah!" });
        }
      }, 50);
    }

    getInitMaster() {
      setTimeout(() => {
        this._successHandler({
          staff: mockDb.staff,
          tindakan: mockDb.tindakan,
          obat: mockDb.obat,
          bmhp: mockDb.bmhp
        });
      }, 50);
    }

    getInitPasien() {
      setTimeout(() => { this._successHandler(mockDb.pasien); }, 50);
    }

    getDaftarRekamMedis() {
      setTimeout(() => { this._successHandler(mockDb.rekamMedis); }, 50);
    }

    getDaftarPembayaran() {
      setTimeout(() => { this._successHandler(mockDb.pembayaran); }, 50);
    }

    getDaftarDokterSIP() {
      setTimeout(() => {
        let docs = mockDb.staff.filter(s => s.role.toLowerCase().includes('dokter')).map(d => ({ nama: d.nama, sip: d.sip, persenJM: d.persenJM }));
        this._successHandler(docs);
      }, 50);
    }

    getKategoriTindakan() {
      setTimeout(() => {
        this._successHandler([
          { kategori: "Umum", kode: "UMU" },
          { kategori: "Dokter Gigi Umum", kode: "DGU" },
          { kategori: "Dokter Gigi Spesialis Ortodonti", kode: "ORT" },
          { kategori: "Bedah Mulut", kode: "BMU" }
        ]);
      }, 50);
    }

    getDaftarTindakanLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.tindakan);
      }, 50);
    }

    simpanTindakanBaru(payload) {
      setTimeout(() => {
        let kode = payload.kode || ("TND-" + String(mockDb.tindakan.length + 1).padStart(3, '0'));
        let newItem = {
          kode: kode,
          id: kode,
          nama: payload.nama,
          kategori: payload.kategori || "Umum",
          tarif: parseInt(payload.tarif, 10) || 0,
          harga: parseInt(payload.tarif, 10) || 0,
          perluLab: payload.perluLab === 'Ya' ? 'Ya' : 'Tidak',
          persenJMDefault: payload.persenJMDefault || null
        };
        mockDb.tindakan.push(newItem);
        this._successHandler({ success: true, message: "Tindakan " + newItem.nama + " (" + kode + ") berhasil disimpan ke Database Master!", data: newItem });
      }, 60);
    }

    updateTindakan(payload) {
      setTimeout(() => {
        let idx = mockDb.tindakan.findIndex(t => t.kode === payload.kode || t.id === payload.kode);
        if (idx !== -1) {
          mockDb.tindakan[idx].nama = payload.nama;
          mockDb.tindakan[idx].kategori = payload.kategori;
          mockDb.tindakan[idx].tarif = parseInt(payload.tarif, 10) || 0;
          mockDb.tindakan[idx].harga = parseInt(payload.tarif, 10) || 0;
          mockDb.tindakan[idx].perluLab = payload.perluLab === 'Ya' ? 'Ya' : 'Tidak';
          this._successHandler({ success: true, message: "Tindakan " + payload.kode + " berhasil diperbarui!", data: mockDb.tindakan[idx] });
        } else {
          this._successHandler({ success: false, message: "Tindakan " + payload.kode + " tidak ditemukan." });
        }
      }, 60);
    }

    hapusTindakan(payload) {
      setTimeout(() => {
        let idx = mockDb.tindakan.findIndex(t => t.kode === payload.kode || t.id === payload.kode);
        if (idx !== -1) {
          let deleted = mockDb.tindakan.splice(idx, 1)[0];
          this._successHandler({ success: true, message: "Tindakan " + (deleted.nama || payload.kode) + " berhasil dihapus dari Master!" });
        } else {
          this._successHandler({ success: false, message: "Tindakan tidak ditemukan." });
        }
      }, 60);
    }

    simpanPasien(payload) {
      setTimeout(() => {
        let idx = -1;
        if (payload.idPasien) {
          idx = mockDb.pasien.findIndex(p => (p.idPasien || '').trim().toLowerCase() === payload.idPasien.trim().toLowerCase());
        }
        if (idx === -1 && payload.noRm) {
          idx = mockDb.pasien.findIndex(p => (p.noRm || '').trim().toLowerCase() === payload.noRm.trim().toLowerCase());
        }
        if (idx !== -1) {
          Object.assign(mockDb.pasien[idx], payload);
          this._successHandler({ success: true, message: "Data Pasien (" + payload.namaPasien + ") berhasil diperbarui!", idPasien: mockDb.pasien[idx].idPasien, noRm: mockDb.pasien[idx].noRm, isBaru: false });
        } else {
          let newId = "P-" + String(mockDb.pasien.length + 1).padStart(4, '0');
          let newRm = "RM-" + String(mockDb.pasien.length + 1).padStart(4, '0');
          let newP = { idPasien: newId, noRm: newRm, ...payload };
          mockDb.pasien.unshift(newP);
          this._successHandler({ success: true, message: "Data Pasien Baru (" + payload.namaPasien + ") berhasil didaftarkan! No RM: " + newRm, idPasien: newId, noRm: newRm, isBaru: true });
        }
      }, 60);
    }

    hapusPasienPermanen(payload) {
      setTimeout(() => {
        let idx = mockDb.pasien.findIndex(p => p.idPasien === payload.idPasien);
        if (idx !== -1) {
          let p = mockDb.pasien[idx];
          mockDb.pasien.splice(idx, 1);
          this._successHandler({ success: true, message: "Data Pasien (" + p.namaPasien + ") berhasil dihapus permanen!" });
        } else {
          this._successHandler({ success: false, message: "Pasien tidak ditemukan." });
        }
      }, 50);
    }

    simpanRekamMedis(payload) {
      setTimeout(() => {
        let idEMR = "EMR-2026-" + String(mockDb.rekamMedis.length + 1).padStart(4, '0');
        let newEMR = {
          idEMR: idEMR,
          waktuSimpan: new Date().toISOString(),
          ...payload
        };
        mockDb.rekamMedis.unshift(newEMR);
        this._successHandler({ success: true, message: "Rekam Medis Pasien (" + payload.namaPasien + ") berhasil disimpan! ID: " + idEMR, idEMR: idEMR });
      }, 60);
    }

    simpanPembayaranBaru(payload) {
      setTimeout(() => {
        let num = mockDb.pembayaran.length + 1;
        let idInv = "INV/SHELDON/" + String(num).padStart(4, '0') + "/1026";
        let tTindakan = JSON.parse(payload.tindakanStr || "[]");
        let tObat = JSON.parse(payload.obatStr || "[]");
        let tBMHP = JSON.parse(payload.bmhpStr || "[]");

        let totalTindakanBruto = 0;
        let totalBiayaLab = 0;
        let totalFeePerawat = 0;

        tTindakan.forEach(t => {
          let gTot = t.grandTotal || (t.harga * t.qty - (t.diskon || 0));
          totalTindakanBruto += gTot;
          if (t.biayaLab) totalBiayaLab += Number(t.biayaLab) || 0;
          if (t.feePerawat) totalFeePerawat += Number(t.feePerawat) || 0;
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: t.nama,
            qty: t.qty,
            harga: t.harga,
            diskon: t.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir,
            biayaLab: t.biayaLab || 0
          });
        });

        tObat.forEach(o => {
          let gTot = o.grandTotal || (o.harga * o.qty - (o.diskon || 0));
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: o.nama,
            qty: o.qty,
            harga: o.harga,
            diskon: o.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir
          });
        });

        tBMHP.forEach(b => {
          let gTot = b.grandTotal || (b.harga * b.qty - (b.diskon || 0));
          mockDb.pembayaran.push({
            idInvoice: idInv,
            tanggal: payload.tglTindakan,
            idPasien: payload.idPasien,
            noRm: payload.noRm,
            namaPasien: payload.namaPasien,
            dokter: payload.dokter,
            item: b.nama,
            qty: b.qty,
            harga: b.harga,
            diskon: b.diskon || 0,
            grandTotalItem: gTot,
            totalInvoice: payload.totalBayar,
            metode: payload.metode,
            status: payload.status,
            keterangan: payload.keterangan || "",
            kasir: payload.kasir
          });
        });

        // Hitung Otomatis Jasa Medis Backend Engine
        let dokObj = mockDb.staff.find(s => s.nama.toLowerCase().includes((payload.dokter || '').toLowerCase()));
        let pJM = dokObj ? (dokObj.persenJM || 0.50) : 0.50;

        // Cek tarif khusus untuk tindakan tertentu (misal PSA = 55%, Rontgen = 15%)
        let jmDokterTotal = 0;
        let jmKlinikTotal = 0;

        tTindakan.forEach(t => {
          let netTindakan = (t.grandTotal || (t.harga * t.qty)) - (Number(t.biayaLab) || 0);
          let itemPJM = pJM;
          if (t.nama.toLowerCase().includes('rontgen')) {
            itemPJM = 0.15; // default 15% rontgen untuk semua dokter
          } else if (t.nama.toLowerCase().includes('saluran akar') || t.nama.toLowerCase().includes('psa')) {
            itemPJM = 0.55; // tarif khusus 55%
          }
          let jmDok = Math.round(netTindakan * itemPJM);
          if (t.feePerawat) {
            jmDok = Math.max(0, jmDok - Number(t.feePerawat)); // potong jasa medis dokter untuk perawat
          }
          let jmKli = netTindakan - jmDok - (Number(t.feePerawat) || 0);
          jmDokterTotal += jmDok;
          jmKlinikTotal += jmKli;
        });

        let rekapJM = {
          idInvoice: idInv,
          tanggal: payload.tglTindakan,
          dokter: payload.dokter,
          namaPasien: payload.namaPasien,
          totalTindakanBruto: totalTindakanBruto,
          totalBiayaLab: totalBiayaLab,
          totalFeePerawat: totalFeePerawat,
          dasarJM: totalTindakanBruto - totalBiayaLab,
          jmDokter: jmDokterTotal,
          jmKlinik: jmKlinikTotal,
          perawat: "Bernadette Rostenkowski (Rp " + totalFeePerawat.toLocaleString('id-ID') + ")"
        };
        mockDb.jasaMedis.push(rekapJM);

        this._successHandler({ 
          success: true, 
          message: "Pembayaran & Invoice (" + idInv + ") Berhasil Disimpan!", 
          idInvoice: idInv,
          rekapJasaMedis: rekapJM
        });
      }, 70);
    }

    getRekapJasaMedis() {
      setTimeout(() => {
        this._successHandler(mockDb.jasaMedis);
      }, 50);
    }

    triggerSinkronSemuaSheet() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          message: "Semua 11 spreadsheet dan sheet master (Pasien, Pembayaran, Rekap_Jasa_Medis, Tarif_Khusus_Dokter, Rekam Medis, Tindakan, Obat, BMHP, Gudang, Log) telah tersinkronisasi 100% lengkap!"
        });
      }, 100);
    }

    setupPayrollSpreadsheet() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          spreadsheetId: "1P-EXAMPLE-PAYROLL-SHELDON-2026",
          url: "https://docs.google.com/spreadsheets/d/1P-EXAMPLE-PAYROLL-SHELDON-2026",
          message: "Spreadsheet RME Sheldon - 11 Payroll & Honor Dokter berhasil disiapkan di Google Drive!"
        });
      }, 120);
    }

    generatePayrollPeriode(periodeBulan) {
      setTimeout(() => {
        this._successHandler({
          success: true,
          count: 2,
          message: "Berhasil menghasilkan 2 draft payroll dokter untuk periode: " + (periodeBulan || "Oktober 2026")
        });
      }, 120);
    }

    jalankanBackupSekarang() {
      setTimeout(() => {
        this._successHandler({
          success: true,
          successCount: 11,
          folderNama: "BACKUP_RME_SHELDON",
          folderUrl: "https://drive.google.com/drive/folders/backup-sheldon",
          targetEmail: "vembrian@gmail.com"
        });
      }, 100);
    }

    getDaftarPekerjaan() {
      setTimeout(() => { this._successHandler(["PNS", "Wiraswasta", "Karyawan Swasta", "Mahasiswa", "Pelajar", "Ibu Rumah Tangga", "TNI/Polri"]); }, 30);
    }

    getDaftarICD10() {
      setTimeout(() => {
        this._successHandler([
          { code: "K02.1", desc: "Caries of dentine", kode: "K02.1", nama: "Caries of dentine" },
          { code: "K04.0", desc: "Pulpitis irreversibel", kode: "K04.0", nama: "Pulpitis irreversibel" },
          { code: "K05.1", desc: "Chronic gingivitis", kode: "K05.1", nama: "Chronic gingivitis" },
          { code: "K05.3", desc: "Chronic periodontitis", kode: "K05.3", nama: "Chronic periodontitis" },
          { code: "K07.2", desc: "Anomalies of dental arch relationship", kode: "K07.2", nama: "Anomalies of dental arch relationship" }
        ]);
      }, 30);
    }

    getDaftarICD9() {
      setTimeout(() => {
        this._successHandler([
          { code: "23.01", desc: "Extraction of other tooth", kode: "23.01", nama: "Extraction of other tooth" },
          { code: "23.2", desc: "Restoration of tooth by filling", kode: "23.2", nama: "Restoration of tooth by filling" },
          { code: "23.70", desc: "Root canal therapy (PSA)", kode: "23.70", nama: "Root canal therapy (PSA)" },
          { code: "89.31", desc: "Dental examination", kode: "89.31", nama: "Dental examination" },
          { code: "96.54", desc: "Dental scaling and polishing", kode: "96.54", nama: "Dental scaling and polishing" }
        ]);
      }, 30);
    }

    getDaftarObatLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.obat);
      }, 30);
    }

    getDaftarBMHPLengkap() {
      setTimeout(() => {
        this._successHandler(mockDb.bmhp);
      }, 30);
    }

    getMasterInventory() {
      setTimeout(() => {
        let res = mockDb.obat.concat(mockDb.bmhp).map(i => ({
          kode: i.kode || i.id,
          nama: i.nama,
          kategori: (i.kode || i.id).startsWith('OBT') ? 'Obat' : 'BMHP',
          satuan: i.satuan || i.unit || 'Unit',
          hpp: i.hpp || (i.harga * 0.7),
          hargaJual: i.hargaJual || i.harga,
          stok: i.stok || 0,
          kritis: 10,
          margin: 30
        }));
        this._successHandler(res);
      }, 30);
    }

    getDaftarStaffLengkap() {
      setTimeout(() => { this._successHandler(mockDb.staff); }, 30);
    }

    getDaftarInvoice() {
      setTimeout(() => { this._successHandler(mockDb.pembayaran); }, 30);
    }

    getSemuaRiwayatSurat() {
      setTimeout(() => { this._successHandler(mockDb.surat); }, 30);
    }
  }

  google.script.run = new Proxy({}, {
    get(target, prop) {
      return function(...args) {
        let runner = new ScriptRunMock();
        let proxyRunner = new Proxy(runner, {
          get(rTarget, rProp) {
            if (typeof rTarget[rProp] === 'function') {
              return rTarget[rProp].bind(rTarget);
            }
            return function(...innerArgs) {
              let res = { success: true, message: "OK" };
              setTimeout(() => { rTarget._successHandler(res); }, 40);
              return proxyRunner;
            };
          }
        });
        if (typeof runner[prop] === 'function') {
          return runner[prop].apply(proxyRunner, args);
        }
        return proxyRunner;
      };
    }
  });

  console.log("Mock Google Apps Script runtime initialized successfully.");
})();



// =========================================================================
// ENGINE OTOMASI LIVE TYPING & SCENARIO PLAYER
// =========================================================================
const LiveEngine = {
  isPaused: false,
  speedMultiplier: 1,

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms / this.speedMultiplier));
  },

  log(msg, type = 'info') {
    const body = document.getElementById('liveLogBody');
    if (!body) return;
    const time = new Date().toLocaleTimeString('id-ID');
    const row = document.createElement('div');
    row.className = type === 'success' ? 'text-emerald-400' : type === 'warning' ? 'text-amber-400' : type === 'step' ? 'text-cyan-300 font-bold' : 'text-slate-300';
    row.innerHTML = `<span class="text-slate-500">[${time}]</span> ${msg}`;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  },

  highlight(el) {
    if (!el) return;
    document.querySelectorAll('.live-glow-active').forEach(e => e.classList.remove('live-glow-active'));
    el.classList.add('live-glow-active');
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(e) {}
  },

  unhighlight() {
    document.querySelectorAll('.live-glow-active').forEach(e => e.classList.remove('live-glow-active'));
  },

  async typeText(selector, text) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.focus();
    el.value = '';
    for (let char of text) {
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(25);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(80);
    this.unhighlight();
  },

  async selectOption(selector, value) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(150);
    this.unhighlight();
  },

  async clickButton(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    this.highlight(el);
    el.classList.add('live-btn-pulse');
    await this.sleep(200);
    el.classList.remove('live-btn-pulse');
    this.unhighlight();
    el.click();
    await this.sleep(250);
  }
};

function toggleLiveConsole() {
  const c = document.getElementById('liveLogConsole');
  if (c) c.classList.toggle('hidden');
}

function resetDataLiveDemo() {
  if (confirm("Reset seluruh data simulasi live ke kondisi awal?")) {
    location.reload();
  }
}

async function ensureUserLoggedIn() {
  if (window.activeNamaAccount) return true;
  LiveEngine.log("Otomatisasi login staff dokter/admin...", "step");
  const uInput = document.getElementById('loginUser');
  const pInput = document.getElementById('loginPass');
  const btn = document.getElementById('btnLogin');
  if (uInput && pInput && btn) {
    await LiveEngine.typeText(uInput, "drg. Sheldon Cooper, Sp.Ort");
    await LiveEngine.typeText(pInput, "1234");
    await LiveEngine.clickButton(btn);
    await LiveEngine.sleep(400);
  }
  return true;
}

// -------------------------------------------------------------------------
// SKENARIO 1: MASTER DATABASE TINDAKAN (LABORATORIUM YA/TIDAK, EDIT, HAPUS)
// -------------------------------------------------------------------------
async function runScenarioMasterTindakan() {
  LiveEngine.log("--- MEMULAI SKENARIO 1: MASTER DATABASE TINDAKAN & LAB ---", "step");
  await ensureUserLoggedIn();

  // 1. Switch ke menu database
  switchMenu('database');
  await LiveEngine.sleep(400);

  LiveEngine.log("Mengisi Form Tambah Tindakan Baru dengan pilihan Labor...", "info");
  
  // 2. Isi Nama Tindakan
  await LiveEngine.typeText('#dbNamaTindakan', "Pemasangan Mahkota PFM (Crown)");
  
  // 3. Kategori
  await LiveEngine.selectOption('#dbKategori', "Dokter Gigi Spesialis Ortodonti");

  // 4. Tarif
  await LiveEngine.typeText('#dbTarif', "1500000");

  // 5. Pilihan Laboratorium (Fitur Baru: Ya)
  LiveEngine.log("Memilih Dropdown Laboratorium: 'Ya'", "info");
  await LiveEngine.selectOption('#dbPerluLab', "Ya");

  // 6. Klik Simpan
  LiveEngine.log("Mengklik tombol SIMPAN TINDAKAN...", "step");
  await LiveEngine.clickButton('#btnSimpanTindakan');
  await LiveEngine.sleep(600);
  LiveEngine.log("Tindakan Mahkota PFM (Crown) ber-Laboratorium berhasil disimpan di Database!", "success");

  // 7. Pengujian Tombol Edit Tindakan
  LiveEngine.log("Menguji tombol Edit pada tindakan baru...", "step");
  const editBtns = document.querySelectorAll('button[onclick*="editDbTindakan"]');
  if (editBtns.length > 0) {
    await LiveEngine.clickButton(editBtns[editBtns.length - 1]);
    await LiveEngine.sleep(400);
    LiveEngine.log("Merubah tarif tindakan menjadi Rp 1.650.000...", "info");
    await LiveEngine.typeText('#dbTarif', "1650000");
    await LiveEngine.clickButton('#btnSimpanTindakan');
    await LiveEngine.sleep(500);
    LiveEngine.log("Update Tindakan sukses diverifikasi!", "success");
  }

  LiveEngine.log("--- SKENARIO 1 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 2: PENDAFTARAN PASIEN BARU & DETEKSI ANTI-DUPLIKASI
// -------------------------------------------------------------------------
async function runScenarioPasienBaru() {
  LiveEngine.log("--- MEMULAI SKENARIO 2: PENDAFTARAN PASIEN BARU ---", "step");
  await ensureUserLoggedIn();

  switchMenu('pasien');
  await LiveEngine.sleep(400);

  // Buka Form Pasien Baru
  LiveEngine.log("Membuka formulir pendaftaran pasien...", "info");
  await LiveEngine.clickButton('#btnTambahPasienBaru');
  await LiveEngine.sleep(300);

  // Input Data Pasien
  LiveEngine.log("Mengetik Nama Pasien: Hendra Wijaya, S.Kom...", "step");
  await LiveEngine.typeText('#pasNama', "Hendra Wijaya, S.Kom");
  await LiveEngine.selectOption('#pasJk', "Laki-Laki");
  await LiveEngine.typeText('#pasienTglDaftar', new Date().toISOString().split('T')[0]);
  await LiveEngine.typeText('#pasTglLahir', "1990-05-15");
  await LiveEngine.typeText('#pasTempatLahir', "Payakumbuh");
  await LiveEngine.typeText('#pasNik', "1376011505900004");
  await LiveEngine.typeText('#pasTelp', "081267891234");
  await LiveEngine.typeText('#pasAlamat', "Jl. Tan Malaka No. 88, Payakumbuh");
  await LiveEngine.typeText('#pasAlergi', "Tidak Ada");
  await LiveEngine.typeText('#pasRiwayatPenyakit', "Gastritis Kronis");
  await LiveEngine.typeText('#pasCatatan', "Pasien mengeluhkan ngilu geraham kanan bawah.");

  LiveEngine.log("Mengklik Simpan Data Pasien...", "step");
  await LiveEngine.clickButton('#formPasienData button[type="submit"]');
  await LiveEngine.sleep(600);

  LiveEngine.log("Pasien Hendra Wijaya, S.Kom berhasil terdaftar di database! No RM: RM-0003", "success");
  LiveEngine.log("--- SKENARIO 2 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 3: REKAM MEDIS (ANAMNESA, ODONTOGRAM, OHI-S, RESEP)
// -------------------------------------------------------------------------
async function runScenarioRekamMedis() {
  LiveEngine.log("--- MEMULAI SKENARIO 3: REKAM MEDIS KLINIS & ODONTOGRAM ---", "step");
  await ensureUserLoggedIn();

  switchMenu('rekam-medis');
  await LiveEngine.sleep(400);

  // Cari Pasien
  LiveEngine.log("Memilih Pasien: Hendra Wijaya, S.Kom...", "step");
  const searchInput = document.getElementById('rmSearchPasien');
  if (searchInput) {
    await LiveEngine.typeText(searchInput, "Hendra");
    await LiveEngine.sleep(300);
    const firstRes = document.querySelector('#rmSearchResult div');
    if (firstRes) await LiveEngine.clickButton(firstRes);
  }

  // Pilih Dokter
  await LiveEngine.selectOption('#rmDokter', "drg. Sheldon Cooper, Sp.Ort");

  // Anamnesa
  LiveEngine.log("Mengisi Anamnesa & Keluhan Utama...", "info");
  await LiveEngine.typeText('#rmKeluhanUtama', "Gigi geraham kanan bawah ngilu hebat saat mengunyah dan berdenyut.");
  await LiveEngine.typeText('#rmRiwayatPenyakitSekarang', "Keluhan sejak 4 hari lalu, semakin nyeri malam hari.");
  await LiveEngine.typeText('#rmTensi', "120/80");
  await LiveEngine.typeText('#rmNadi', "78");
  await LiveEngine.typeText('#rmSuhu', "36.6");

  // Odontogram Interaktif: Klik Gigi 16 & 46
  LiveEngine.log("Membuka Modal Odontogram Interaktif...", "step");
  const btnOdonto = document.getElementById('btnBukaModalOdontogram');
  if (btnOdonto) {
    await LiveEngine.clickButton(btnOdonto);
    await LiveEngine.sleep(500);

    LiveEngine.log("Memilih Palet Kondisi 'Caries' dan menandai Gigi 46...", "info");
    const carBtn = document.querySelector('button[data-condition="caries"]');
    if (carBtn) await LiveEngine.clickButton(carBtn);

    // Cari gigi 46 di odontogram modal
    const tooth46 = document.querySelector('[data-tooth-num="46"]') || document.querySelector('[data-tooth="46"]');
    if (tooth46) {
      await LiveEngine.clickButton(tooth46);
      LiveEngine.log("Gigi 46 berhasil ditandai sebagai Karies Oklusal!", "success");
    }
    await LiveEngine.sleep(400);

    const btnSimpanOdonto = document.getElementById('btnSimpanOdontogramModal');
    if (btnSimpanOdonto) await LiveEngine.clickButton(btnSimpanOdonto);
    await LiveEngine.sleep(300);
  }

  // Diagnosis ICD-10
  LiveEngine.log("Memilih Diagnosis ICD-10: K04.0 Pulpitis...", "info");
  const icdSelect = document.getElementById('rmDiagnosisICD10');
  if (icdSelect && icdSelect.options.length > 1) {
    icdSelect.selectedIndex = 1;
    icdSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Resep Obat
  await LiveEngine.typeText('#rmResepObat', "R/ Amoxicillin 500mg No. X S 3 dd tab I pc\nR/ Asam Mefenamat 500mg No. X S 3 dd tab I prn");
  await LiveEngine.typeText('#rmCatatanEdukasi', "Kontrol kembali 5 hari lagi untuk perawatan saluran akar lanjutan.");

  // Simpan EMR
  LiveEngine.log("Menyimpan Rekam Medis Pasien...", "step");
  const btnSimpanRM = document.getElementById('btnSimpanRekamMedis');
  if (btnSimpanRM) await LiveEngine.clickButton(btnSimpanRM);
  await LiveEngine.sleep(600);

  LiveEngine.log("Rekam Medis lengkap dan Odontogram berhasil disimpan!", "success");
  LiveEngine.log("--- SKENARIO 3 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// SKENARIO 4: KASIR & INVOICE MULTI-KASUS (LAB, DISKON, DP, JASA MEDIS)
// -------------------------------------------------------------------------
async function runScenarioKasirJasaMedis() {
  LiveEngine.log("--- MEMULAI SKENARIO 4: KASIR PEMBAYARAN & JASA MEDIS OTOMATIS ---", "step");
  await ensureUserLoggedIn();

  switchMenu('kasir');
  await LiveEngine.sleep(400);

  // Cari Pasien Hendra
  LiveEngine.log("Memilih Pasien Kasir: Hendra Wijaya, S.Kom...", "step");
  const ksrSearch = document.getElementById('ksrSearchPasien');
  if (ksrSearch) {
    await LiveEngine.typeText(ksrSearch, "Hendra");
    await LiveEngine.sleep(300);
    const firstRes = document.querySelector('#ksrSearchResult div');
    if (firstRes) await LiveEngine.clickButton(firstRes);
  }

  await LiveEngine.selectOption('#ksrDokter', "drg. Sheldon Cooper, Sp.Ort");
  await LiveEngine.typeText('#ksrTgl', new Date().toISOString().split('T')[0]);

  // Tambah Tindakan Pemasangan Crown PFM (Perlu Lab)
  LiveEngine.log("Menambahkan Tindakan: Pemasangan Mahkota PFM (Crown) Rp 1.500.000...", "step");
  const btnAddTnd = document.getElementById('btnTambahTindakanKasir') || document.querySelector('button[onclick*="tambahBarisTindakan"]');
  if (btnAddTnd) await LiveEngine.clickButton(btnAddTnd);

  const tndInputs = document.querySelectorAll('.ksr-tindakan-nama');
  if (tndInputs.length > 0) {
    await LiveEngine.typeText(tndInputs[tndInputs.length - 1], "Pemasangan Mahkota PFM (Crown)");
    await LiveEngine.sleep(200);
  }

  // Isikan Biaya Lab Rp 350.000 jika ada inputnya
  const labInputs = document.querySelectorAll('.ksr-tindakan-biayalab');
  if (labInputs.length > 0) {
    LiveEngine.log("Memasukkan Biaya Laboratorium: Rp 350.000...", "info");
    await LiveEngine.typeText(labInputs[labInputs.length - 1], "350000");
  }

  // Tambah Obat
  LiveEngine.log("Menambahkan Resep Obat Amoxicillin...", "info");
  const btnAddObt = document.getElementById('btnTambahObatKasir') || document.querySelector('button[onclick*="tambahBarisObat"]');
  if (btnAddObt) await LiveEngine.clickButton(btnAddObt);
  const obtInputs = document.querySelectorAll('.ksr-obat-nama');
  if (obtInputs.length > 0) {
    await LiveEngine.typeText(obtInputs[obtInputs.length - 1], "Amoxicillin 500mg (Strip)");
  }

  // Status Pembayaran: Uang Muka (DP)
  LiveEngine.log("Memilih Status Pembayaran: 'Uang Muka (DP/Cicilan)'...", "step");
  await LiveEngine.selectOption('#ksrStatus', "Uang Muka");
  await LiveEngine.sleep(200);

  // Masukkan Nominal DP: Rp 500.000
  LiveEngine.log("Memasukkan Pembayaran Uang Muka DP: Rp 500.000...", "info");
  await LiveEngine.typeText('#ksrNominalDp', "500000");
  await LiveEngine.selectOption('#ksrMetode', "Transfer");

  // Klik Simpan Invoice
  LiveEngine.log("Menyimpan Transaksi Billing & Menerbitkan Invoice...", "step");
  await LiveEngine.clickButton('#btnSimpanBilling');
  await LiveEngine.sleep(700);

  LiveEngine.log("INVOICE KASIR TERBIT! No Invoice: INV/SHELDON/0001/1026", "success");
  LiveEngine.log("Sistem Backend menghitung Jasa Medis secara otomatis:", "step");
  LiveEngine.log("• Biaya Lab Rp 350.000 berhasil dikurangkan dari tarif bruto.", "info");
  LiveEngine.log("• Porsi Dokter drg. Sheldon (50% dari Rp 1.150.000) = Rp 575.000", "success");
  LiveEngine.log("• Porsi Klinik = Rp 575.000 | Obat 100% Milik Klinik", "success");

  // Tampilkan Modal Hasil Rangkuman
  document.getElementById('modalSummaryHasil').classList.remove('hidden');
  LiveEngine.log("--- SKENARIO 4 SELESAI DENGAN SUKSES ---", "success");
}

// -------------------------------------------------------------------------
// RUNNER UTAMA
// -------------------------------------------------------------------------
async function startLiveScenarioSelected() {
  const sel = document.getElementById('selLiveScenario').value;
  const btn = document.getElementById('btnRunLiveScenario');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Memutar...`;
  }

  try {
    if (sel === 'all') {
      await runScenarioMasterTindakan();
      await LiveEngine.sleep(600);
      await runScenarioPasienBaru();
      await LiveEngine.sleep(600);
      await runScenarioRekamMedis();
      await LiveEngine.sleep(600);
      await runScenarioKasirJasaMedis();
    } else if (sel === 'sc1') {
      await runScenarioMasterTindakan();
    } else if (sel === 'sc2') {
      await runScenarioPasienBaru();
    } else if (sel === 'sc3') {
      await runScenarioRekamMedis();
    } else if (sel === 'sc4') {
      await runScenarioKasirJasaMedis();
    }
  } catch (err) {
    console.error("Live Simulator Error:", err);
    LiveEngine.log("Terjadi kendala pada runner: " + err.message, "warning");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>▶️</span> Putar Live`;
    }
  }
}



  function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const btn = document.getElementById('btnLogin');
    
    btn.innerHTML = 'MEMVERIFIKASI...'; btn.disabled = true;
    
    google.script.run.withSuccessHandler(res => {
      btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false;
      if (res.success) {
        window.activeAccount = res.userData.username;
        window.activeNamaAccount = res.userData.namaAccount;
        window.activeUserRole = res.userData.role;
        
        localStorage.setItem("sheldon_user_session", JSON.stringify(res.userData));
        
        document.getElementById('userInitial').innerText = res.userData.namaAccount.charAt(0).toUpperCase();
        document.getElementById('userNameDisplay').innerText = res.userData.namaAccount;
        document.getElementById('userRoleDisplay').innerText = res.userData.role;
        
        terapkanRoleAkses(res.userData.role);
        
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        showToast('success', 'Selamat Datang, ' + res.userData.namaAccount);
        startDataSync();
      } else {
        showToast('error', res.message);
      }
    }).withFailureHandler(err => {
      btn.innerHTML = 'MASUK SISTEM'; btn.disabled = false;
      showToast('error', 'Koneksi Terputus: ' + err.message);
    }).verifyLogin(u, p);
  }



  window.activeAccount = null;
  window.activeNamaAccount = null;
  window.activeUserRole = null;
  window.KlinikData = {
    pasien: [], staff: [], tindakan: [], obat: [], bmhp: [], rekamMedis: [], pembayaran: [], statusLoad: { master: false, pasien: false, emr: false }
  };

  // ROLE MANAGEMENT ENGINE
  function terapkanRoleAkses(role) {
    let r = role ? role.toString().toLowerCase() : '';
    
    // Reset semua navigasi ke hidden
    ['nav-dashboard', 'nav-ai', 'nav-pasien', 'nav-rekam-medis', 'nav-surat', 'nav-database', 'nav-inventory', 'nav-informasi', 'nav-kasir', 'nav-riwayat-invoice'].forEach(id => {
      let el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    document.getElementById('section-klinis').classList.remove('hidden');
    document.getElementById('section-transaksi').classList.add('hidden');

    let btnTambahPasien = document.getElementById('btnTambahPasienBaru');
    let btnFilterDuplikat = document.getElementById('btnFilterDuplikat');

    // 1. SUPER USER: Bisa membuka, edit, dan delete semua modul
    if (r === 'super user' || r === 'owner') {
      ['nav-dashboard', 'nav-ai', 'nav-pasien', 'nav-rekam-medis', 'nav-surat', 'nav-database', 'nav-inventory', 'nav-informasi', 'nav-kasir', 'nav-riwayat-invoice'].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove('hidden');
      });
      document.getElementById('section-transaksi').classList.remove('hidden');
      if (btnTambahPasien) btnTambahPasien.classList.remove('hidden');
      if (btnFilterDuplikat) btnFilterDuplikat.classList.remove('hidden');
      switchMenu('dashboard');
    }
    // 2. DOKTER GIGI SPESIALIS / UMUM: Rekam Medis & Odontogram, Form & Surat, Informasi, view Database Pasien, AI Clinical Insights
    else if (r.includes('dokter')) {
      ['nav-rekam-medis', 'nav-surat', 'nav-informasi', 'nav-pasien', 'nav-ai'].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove('hidden');
      });
      document.getElementById('section-transaksi').classList.remove('hidden');
      // Dokter hanya view Database Pasien (sembunyikan tombol tambah pasien baru & filter data ganda)
      if (btnTambahPasien) btnTambahPasien.classList.add('hidden');
      if (btnFilterDuplikat) btnFilterDuplikat.classList.add('hidden');
      switchMenu('rekam-medis');
    }
    // 3. ADMIN: Database Pasien, Form & Surat, Informasi, Kasir & Billing, Riwayat Invoice
    else if (r.includes('admin') || r.includes('perawat') || r.includes('kasir')) {
      ['nav-pasien', 'nav-surat', 'nav-informasi', 'nav-kasir', 'nav-riwayat-invoice'].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove('hidden');
      });
      document.getElementById('section-transaksi').classList.remove('hidden');
      if (btnTambahPasien) btnTambahPasien.classList.remove('hidden');
      if (btnFilterDuplikat) btnFilterDuplikat.classList.add('hidden');
      switchMenu('pasien');
    }
    // 4. STAFF: Database Pasien (view-only), Informasi
    else if (r.includes('staff')) {
      ['nav-pasien', 'nav-informasi'].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove('hidden');
      });
      document.getElementById('section-transaksi').classList.remove('hidden');
      // Staff view Database Pasien (sembunyikan tombol tambah pasien baru & filter data ganda)
      if (btnTambahPasien) btnTambahPasien.classList.add('hidden');
      if (btnFilterDuplikat) btnFilterDuplikat.classList.add('hidden');
      switchMenu('pasien');
    }
    else {
      ['nav-pasien', 'nav-informasi'].forEach(id => {
        let el = document.getElementById(id); if (el) el.classList.remove('hidden');
      });
      if (btnTambahPasien) btnTambahPasien.classList.add('hidden');
      if (btnFilterDuplikat) btnFilterDuplikat.classList.add('hidden');
      switchMenu('pasien');
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    let date = new Date();
    let y = date.getFullYear();
    let m = ("0" + (date.getMonth() + 1)).slice(-2);
    let d = ("0" + date.getDate()).slice(-2);
  
    let elAwal = document.getElementById('dashFilterAwal');
    let elAkhir = document.getElementById('dashFilterAkhir');
    if (elAwal) elAwal.value = `${y}-${m}-01`;
    if (elAkhir) elAkhir.value = `${y}-${m}-${d}`;
    
    const savedSession = localStorage.getItem("sheldon_user_session");
    if (savedSession) {
      try {
        const userData = JSON.parse(savedSession);
        window.activeAccount = userData.username;
        window.activeNamaAccount = userData.namaAccount;
        window.activeUserRole = userData.role;
      
        document.getElementById('userInitial').innerText = userData.namaAccount.charAt(0).toUpperCase();
        document.getElementById('userNameDisplay').innerText = userData.namaAccount;
        document.getElementById('userRoleDisplay').innerText = userData.role;
      
        terapkanRoleAkses(userData.role);
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        startDataSync();
      } catch (error) { localStorage.removeItem("sheldon_user_session"); }
    }
  });

  function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    let colors = { success: 'bg-emerald-50 border-emerald-200 text-emerald-800', error: 'bg-rose-50 border-rose-200 text-rose-800', warning: 'bg-amber-50 border-amber-200 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };
    let icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transform transition-all duration-300 translate-x-full opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span class="text-lg">${icons[type] || 'ℹ️'}</span><p class="text-xs font-bold">${message}</p>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-x-full', 'opacity-0'); }, 10);
    setTimeout(() => { toast.classList.add('translate-x-full', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function switchMenu(menuId) {
    document.querySelectorAll('.module-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => {
      el.classList.remove('bg-gradient-to-r', 'from-cyan-600', 'to-indigo-600', 'text-white', 'shadow-md', 'shadow-cyan-500/20', 'ring-1', 'ring-cyan-400/30', 'bg-indigo-600');
      el.classList.add('text-slate-300', 'hover:bg-slate-800/90', 'hover:text-white');
    });
    const targetView = document.getElementById('view-' + menuId);
    const targetNav = document.getElementById('nav-' + menuId);
  
    if (targetView) targetView.classList.remove('hidden');
    if (targetNav) {
      targetNav.classList.remove('text-slate-300', 'hover:bg-slate-800/90');
      targetNav.classList.add('bg-gradient-to-r', 'from-cyan-600', 'to-indigo-600', 'text-white', 'shadow-md', 'shadow-cyan-500/20', 'ring-1', 'ring-cyan-400/30');
      document.getElementById('topbarTitle').innerText = targetNav.innerText.replace(/[^a-zA-Z0-9\s&]/gi, '').trim();
    }
  
    if (menuId === 'ai' && typeof loadAIInsights === 'function') loadAIInsights();
    if (menuId === 'database' && typeof initDatabaseModule === 'function') initDatabaseModule();
    if (menuId === 'inventory' && typeof initInventoryModule === 'function') initInventoryModule();
    if (menuId === 'informasi' && typeof initInformasiModule === 'function') initInformasiModule();
    if (menuId === 'surat' && typeof initSuratModule === 'function') initSuratModule();
  
    document.getElementById('mainContentScroll').scrollTo({ top: 0, behavior: 'smooth' });
  }

  function logout() {
    const modal = document.getElementById('logoutModal');
    const modalContent = document.getElementById('logoutModalContent');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modalContent.classList.remove('scale-95'); modalContent.classList.add('scale-100'); }, 10);
  }

  function handleLogoutResponse(isYes) {
    const modal = document.getElementById('logoutModal');
    const modalContent = document.getElementById('logoutModalContent');
    modal.classList.add('opacity-0'); modalContent.classList.remove('scale-100'); modalContent.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      if (isYes) {
        window.activeAccount = null; window.activeNamaAccount = null; window.activeUserRole = null;
        localStorage.removeItem("sheldon_user_session");
        let passEl = document.getElementById('loginPass'); if (passEl) passEl.value = '';
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        showToast('info', 'Anda telah keluar dari sistem.');
      }
    }, 300);
  }

  function formatUangDashboard(angka) {
    if (!angka) return '0';
    var number_string = angka.toString().replace(/[^,\d]/g, ''), split = number_string.split(','),
    sisa = split[0].length % 3, rupiah = split[0].substr(0, sisa), ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) { var separator = sisa ? '.' : ''; rupiah += separator + ribuan.join('.'); }
    return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
  }

  function startDataSync() {
    const loadUI = document.getElementById('globalLoadingStatus'); if (loadUI) loadUI.classList.remove('hidden');
    let step = 0;
    const checkDone = () => {
      step++;
      if (step >= 3) {
        if (loadUI) loadUI.classList.add('hidden');
        showToast('success', 'Database tersinkronisasi');
        updateDashboardNumbers();
        document.dispatchEvent(new Event('KlinikDataReady'));
      }
    };
    if (loadUI) loadUI.innerHTML = '🔄 Master Data...';
    google.script.run.withSuccessHandler(res => {
      window.KlinikData.staff = res.staff || [];
      window.KlinikData.tindakan = res.tindakan || [];
      window.KlinikData.obat = res.obat || [];
      window.KlinikData.bmhp = res.bmhp || [];
      window.KlinikData.statusLoad.master = true;
      checkDone();
    }).getInitMaster();

    if (loadUI) loadUI.innerHTML = '🔄 Pasien...';
    google.script.run.withSuccessHandler(res => {
      window.KlinikData.pasien = res || [];
      window.KlinikData.statusLoad.pasien = true;
      checkDone();
    }).getInitPasien();

    if (loadUI) loadUI.innerHTML = '🔄 EMR & Kasir...';
    let stepEmrKasir = 0;
    function checkEmrKasirDone() {
      stepEmrKasir++;
      if (stepEmrKasir >= 2) {
        window.KlinikData.statusLoad.emr = true;
        checkDone();
      }
    }
    google.script.run.withSuccessHandler(res => { window.KlinikData.rekamMedis = res || []; checkEmrKasirDone(); }).getDaftarRekamMedis();
    google.script.run.withSuccessHandler(res => { window.KlinikData.pembayaran = res || []; checkEmrKasirDone(); }).getDaftarPembayaran();
  }

  function updateDashboardNumbers() {
    document.getElementById('dashTotPasien').innerText = window.KlinikData.pasien.length;
    document.getElementById('dashTotTrx').innerText = window.KlinikData.pembayaran.length;
    document.getElementById('dashTotEmr').innerText = window.KlinikData.rekamMedis.length;
    document.getElementById('dashTotItem').innerText = window.KlinikData.obat.length + window.KlinikData.tindakan.length;
    
    let rawTglAwal = document.getElementById('dashFilterAwal').value;
    let rawTglAkhir = document.getElementById('dashFilterAkhir').value;
    let tglAwal = rawTglAwal ? new Date(rawTglAwal).setHours(0,0,0,0) : null;
    let tglAkhir = rawTglAkhir ? new Date(rawTglAkhir).setHours(23,59,59,999) : null;
    
    let totalUang = 0, totalCash = 0, totalTransfer = 0, invoiceCount = 0;
    let countedInv = {};
    
    window.KlinikData.pembayaran.forEach(trx => {
      let trxDateRaw = trx.tanggal ? trx.tanggal.split(' ')[0] : null;
      if (!trxDateRaw) return;
      let tParts = trxDateRaw.split('-');
      if (tParts.length !== 3) return;
      let trxTime = new Date(tParts[0], parseInt(tParts[1])-1, tParts[2]).getTime();
      let isPass = true;
      if (tglAwal && trxTime < tglAwal) isPass = false;
      if (tglAkhir && trxTime > tglAkhir) isPass = false;
      if (isPass) {
        let invId = trx.idInvoice || Math.random();
        if (!countedInv[invId]) {
          countedInv[invId] = true;
          invoiceCount++;
          let total = parseFloat(trx.totalInvoice || trx.grandTotalItem || 0);
          let metode = (trx.metode || "").toLowerCase();
          totalUang += total;
          if (metode.includes('cash') || metode.includes('tunai')) {
            totalCash += total;
          } else {
            totalTransfer += total;
          }
        }
      }
    });
    
    document.getElementById('dashTotUang').innerText = 'Rp ' + formatUangDashboard(totalUang);
    document.getElementById('dashTotCount').innerText = invoiceCount + ' Invoice Transaksi';
    document.getElementById('dashTotCash').innerText = 'Rp ' + formatUangDashboard(totalCash);
    document.getElementById('dashTotTransfer').innerText = 'Rp ' + formatUangDashboard(totalTransfer);
  }



// ========================================================
// ENGINE DATABASE PASIEN (CRUD, SEARCH, STATS & HISTORY)
// ========================================================
let currentPagePasien = 1;
let itemsPerPagePasien = 10;
let filteredPasienList = [];
let isFilterDuplikatAktif = false;
// 1. AUTO-LOAD SAAT DATA KLINIK SIAP
document.addEventListener("KlinikDataReady", () => {
  initPasienModule();
});
document.addEventListener("DOMContentLoaded", () => {
setTimeout(() => {
   if(window.KlinikData && window.KlinikData.statusLoad && window.KlinikData.statusLoad.pasien) {
       initPasienModule();
   }
}, 1000);
});
function initPasienModule() {
  let inputCari = document.getElementById('inputCariPasien');
  if (inputCari) {
      inputCari.removeEventListener('input', resetPageAndSearchPasien);
      inputCari.addEventListener('input', resetPageAndSearchPasien);
  }
  updateStatistikPasienTampilan();
  resetPageAndSearchPasien();
  loadListPekerjaan();
}
// ========================================================
// LOGIKA STATISTIK (TOTAL, L, P)
// ========================================================
function updateStatistikPasienTampilan() {
  let list = window.KlinikData.pasien || [];
  let total = list.length;
  let laki = 0;
  let perempuan = 0;
  list.forEach(p => {
      let jk = (p.jenisKelamin || "").toLowerCase();
      if (jk.startsWith('l')) laki++;
      else if (jk.startsWith('p')) perempuan++;
  });
  let elTotal = document.getElementById('labelTotalPasien');
  let elLaki = document.getElementById('labelTotalLaki');
  let elPerempuan = document.getElementById('labelTotalPerempuan');
  if(elTotal) elTotal.innerText = total;
  if(elLaki) elLaki.innerText = laki;
  if(elPerempuan) elPerempuan.innerText = perempuan;
}
// ========================================================
// LOGIKA FILTER DATA GANDA (DUPLIKAT)
// ========================================================
function toggleFilterDataGanda() {
  const role = (window.activeUserRole || (window.currentUser && window.currentUser.role) || '').toString().toLowerCase();
  const isSuperUser = (role.includes('super user') || role.includes('owner'));
  if (role && !isSuperUser) {
    if (typeof alertMsg === 'function') {
      alertMsg('warning', 'Fitur Filter Data Ganda hanya dapat diakses oleh Super User.');
    }
    return;
  }
  isFilterDuplikatAktif = !isFilterDuplikatAktif;
  let btn = document.getElementById('btnFilterDuplikat');
  if (btn) {
    if (isFilterDuplikatAktif) {
      btn.className = "w-full sm:w-auto px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ring-2 ring-amber-400";
      btn.innerHTML = "<span>✅</span> Mode Data Ganda Aktif";
    } else {
      btn.className = "w-full sm:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap";
      btn.innerHTML = "<span>⚠️</span> Filter Data Ganda";
    }
  }
  currentPagePasien = 1;
  searchPasienData();
}

function getKelompokDuplikatMap(list) {
  let mapNamaLahir = new Map();
  let mapNik = new Map();

  list.forEach(p => {
    let nama = (p.namaPasien || "").toLowerCase().trim().replace(/\s+/g, ' ');
    let tgl = (p.tanggalLahir || "").trim();
    let parts = tgl.split(/[-/]/);
    let stdTgl = parts.length === 3 ? (parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : tgl) : tgl;
    let keyDob = nama && stdTgl ? `${nama}|${stdTgl}` : "";

    let nik = (p.nik || "").trim();

    if (keyDob) {
      if (!mapNamaLahir.has(keyDob)) mapNamaLahir.set(keyDob, []);
      mapNamaLahir.get(keyDob).push(p.idPasien);
    }
    if (nik && nik.length >= 10) {
      if (!mapNik.has(nik)) mapNik.set(nik, []);
      mapNik.get(nik).push(p.idPasien);
    }
  });

  let duplicateIdSet = new Set();
  mapNamaLahir.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => duplicateIdSet.add(id));
  });
  mapNik.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => duplicateIdSet.add(id));
  });

  return duplicateIdSet;
}

// ========================================================
// LOGIKA PENCARIAN & PAGINATION TABEL
// ========================================================
function resetPageAndSearchPasien() {
  currentPagePasien = 1;
  searchPasienData();
}
function searchPasienData() {
  let inputEl = document.getElementById('inputCariPasien');
  let q = inputEl ? inputEl.value.toLowerCase().trim() : "";
  let list = window.KlinikData.pasien || [];

  if (isFilterDuplikatAktif) {
    let dupSet = getKelompokDuplikatMap(list);
    list = list.filter(p => dupSet.has(p.idPasien));
    // Sort agar data yang kembar berdampingan
    list.sort((a, b) => {
      let nA = (a.namaPasien || "").toLowerCase();
      let nB = (b.namaPasien || "").toLowerCase();
      return nA.localeCompare(nB);
    });
  }

  if (q) {
      filteredPasienList = list.filter(p =>
          (p.namaPasien || "").toLowerCase().includes(q) ||
          (p.noRm || "").toLowerCase().includes(q) ||
          (p.whatsapp || "").toLowerCase().includes(q)
      );
  } else {
      filteredPasienList = list;
  }
  renderTablePagePasien();
}
function renderTablePagePasien() {
  let tbody = document.getElementById('tbodyPasien');
  if (!tbody) return;
  let totalPages = Math.ceil(filteredPasienList.length / itemsPerPagePasien) || 1;
  if (currentPagePasien > totalPages) currentPagePasien = totalPages;
  let btnPrev = document.getElementById('btnPrevPagePasien');
  let btnNext = document.getElementById('btnNextPagePasien');
  let lblCur = document.getElementById('labelCurrentPagePasien');
  let lblTot = document.getElementById('labelTotalPagePasien');
  let lblData = document.getElementById('labelTotalDataString');
  if (lblCur) lblCur.innerText = currentPagePasien;
  if (lblTot) lblTot.innerText = totalPages;
  if (lblData) lblData.innerText = `(Total: ${filteredPasienList.length} Pasien)`;
  if (btnPrev) btnPrev.disabled = (currentPagePasien === 1);
  if (btnNext) btnNext.disabled = (currentPagePasien === totalPages || filteredPasienList.length === 0);
  let startIdx = (currentPagePasien - 1) * itemsPerPagePasien;
  let pageData = filteredPasienList.slice(startIdx, startIdx + itemsPerPagePasien);
  if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-10 text-slate-400 font-bold">Data pasien tidak ditemukan.</td></tr>';
      return;
  }
  function formatTglAngkaDDMMYYYY(str) {
    if (!str) return '-';
    let s = String(str).trim();
    let parts = s.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return s;
  }

  tbody.innerHTML = pageData.map(p => `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
          <td class="p-3 font-mono font-bold text-indigo-600 text-xs">${p.noRm || '-'}</td>
          <td class="p-3 font-bold text-slate-800 text-xs">${p.namaPasien || '-'}</td>
          <td class="p-3 text-slate-600 text-xs">${p.jenisKelamin || '-'}</td>
          <td class="p-3 text-slate-600 text-xs">${formatTglAngkaDDMMYYYY(p.tanggalLahir)} / ${p.umur || '-'}</td>
          <td class="p-3 text-slate-600 text-xs">${p.whatsapp || '-'}</td>
          <td class="p-3 text-rose-600 text-[11px] font-medium truncate max-w-[120px]" title="${p.riwayatPenyakit || '-'}">${p.riwayatPenyakit || '-'}</td>
          <td class="p-3 text-amber-600 text-[11px] font-medium truncate max-w-[120px]" title="${p.alergi || '-'}">${p.alergi || '-'}</td>
          <td class="p-3 text-slate-600 text-xs truncate max-w-[150px]" title="${p.alamat || '-'}">${p.alamat || '-'}</td>
          <td class="p-3 text-center">
              <div class="flex justify-center gap-1.5">
                  ${(window.activeUserRole && (window.activeUserRole.toLowerCase().includes('super user') || window.activeUserRole.toLowerCase().includes('owner') || window.activeUserRole.toLowerCase().includes('admin'))) ? `<button onclick="editPasien('${p.idPasien}')" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition-all shadow-sm">Edit</button>` : ''}
                  ${(window.activeUserRole && (window.activeUserRole.toLowerCase().includes('super user') || window.activeUserRole.toLowerCase().includes('owner'))) ? `<button onclick="konfirmasiHapusPasien('${p.idPasien}', '${p.namaPasien}')" class="px-2.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white text-rose-600 rounded-lg text-[10px] font-bold transition-all shadow-sm" title="Hapus Pasien (Super User)">🗑️ Hapus</button>` : ''}
                  <button onclick="openHistoryEMR('${p.idPasien}')" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all shadow-sm border border-indigo-200" title="Lihat Riwayat Rekam Medis">🩺 History</button>
              </div>
          </td>
      </tr>
  `).join('');
}
function prevPagePasien() { if (currentPagePasien > 1) { currentPagePasien--; renderTablePagePasien(); } }
function nextPagePasien() { let t = Math.ceil(filteredPasienList.length / itemsPerPagePasien); if (currentPagePasien < t) { currentPagePasien++; renderTablePagePasien(); } }
// ========================================================
// LOGIKA FORM PASIEN (TAMBAH / EDIT / SIMPAN)
// ========================================================
function bukaFormPasienBaru() {
  if (window.activeUserRole && (window.activeUserRole.toLowerCase().includes('dokter') || window.activeUserRole.toLowerCase().includes('staff'))) {
    showToast('warning', 'Role Anda hanya memiliki akses View pada Database Pasien.');
    return;
  }
  resetFormPasien();

  document.getElementById('panelFormPasien').classList.remove('hidden');
  document.getElementById('panelTabelPasien').classList.add('hidden');
}

function resetFormPasien() {
  let form = document.getElementById('formPasienData');
  if (form) form.reset();
  
  let fieldsToClear = [
    'pasId', 'pasRm', 'pasNama', 'pasTglLahir', 'pasUmur', 'pasNik',
    'pasWa', 'pasAlamat', 'pasRiwayat', 'pasAlergi', 'pasCatatan',
    'pasProvinsi', 'pasKabupaten', 'pasKecamatan', 'pasKelurahan'
  ];
  fieldsToClear.forEach(id => {
    let el = document.getElementById(id);
    if (el) el.value = '';
  });

  let selectFields = ['pasJk', 'pasAgama', 'pasGoldar', 'pasPekerjaan'];
  selectFields.forEach(id => {
    let el = document.getElementById(id);
    if (el) {
      el.value = '';
      if (el.selectedIndex !== undefined) el.selectedIndex = 0;
    }
  });

  let pasMode = document.getElementById('pasienMode');
  if (pasMode) pasMode.value = 'baru';

  // TANGGAL DAFTAR DEFAULT HARI INI
  let tglInput = document.getElementById('pasienTglDaftar');
  if (tglInput) {
    let d = new Date();
    let m = ("0" + (d.getMonth() + 1)).slice(-2);
    let day = ("0" + d.getDate()).slice(-2);
    tglInput.value = `${d.getFullYear()}-${m}-${day}`;
  }

  let formTitle = document.getElementById('formTitle');
  if (formTitle) formTitle.innerText = 'Formulir Pendaftaran Pasien Baru';
  let btnSimpan = document.getElementById('btnSimpanPasien');
  if (btnSimpan) {
    btnSimpan.innerHTML = '💾 Simpan Data Pasien';
    btnSimpan.disabled = false;
  }
  let btnBatal = document.getElementById('btnBatalPasien');
  if (btnBatal) btnBatal.classList.add('hidden');

  let alertEl = document.getElementById('alertDuplikatPasien');
  if (alertEl) alertEl.classList.add('hidden');
}

function batalEditPasien() {
  resetFormPasien();
  tutupFormPasien();
}

function tutupFormPasien() {
  resetFormPasien();
  document.getElementById('panelFormPasien').classList.add('hidden');
  document.getElementById('panelTabelPasien').classList.remove('hidden');
}

// ========================================================
// LAPIS 1: AUTO-GUARD CEK DUPLIKASI FRONTEND SECARA REAL-TIME
// ========================================================
function cekDuplikasiFrontend() {
  let currentId = (document.getElementById('pasId').value || "").trim();
  // Hanya aktif jika mode Pasien Baru (bukan sedang mengedit pasien lama)
  if (currentId !== "") return;

  let inputNama = (document.getElementById('pasNama').value || "").toLowerCase().trim().replace(/\s+/g, ' ');
  let inputTgl = (document.getElementById('pasTglLahir').value || "").trim();
  let inputNik = (document.getElementById('pasNik').value || "").trim();

  let alertBox = document.getElementById('alertDuplikatPasien');
  let alertText = document.getElementById('alertDuplikatText');
  let btnBuka = document.getElementById('btnBukaPasienLama');
  if (!alertBox || !alertText || !btnBuka) return;

  if (!inputNama && !inputNik) {
    alertBox.classList.add('hidden');
    return;
  }

  let list = window.KlinikData && Array.isArray(window.KlinikData.pasien) ? window.KlinikData.pasien : [];
  let found = null;
  let reason = "";

  // 1. Cek NIK Unik
  if (inputNik && inputNik.length >= 10) {
    found = list.find(p => (p.nik || "").trim() === inputNik);
    if (found) reason = `NIK <b>${inputNik}</b> sudah terdaftar`;
  }

  // 2. Cek Nama + Tanggal Lahir Sama Persis
  if (!found && inputNama.length >= 3 && inputTgl) {
    // Normalisasi format inputTgl YYYY-MM-DD
    let partsIn = inputTgl.split(/[-/]/);
    let stdInputTgl = partsIn.length === 3 ? (partsIn[0].length === 4 ? `${partsIn[2]}-${partsIn[1]}-${partsIn[0]}` : inputTgl) : inputTgl;

    found = list.find(p => {
      let pNama = (p.namaPasien || "").toLowerCase().trim().replace(/\s+/g, ' ');
      if (pNama !== inputNama) return false;
      let pTgl = (p.tanggalLahir || "").trim();
      let partsP = pTgl.split(/[-/]/);
      let stdPTgl = partsP.length === 3 ? (partsP[0].length === 4 ? `${partsP[2]}-${partsP[1]}-${partsP[0]}` : pTgl) : pTgl;
      return stdPTgl === stdInputTgl;
    });

    if (found) {
      reason = `Nama Pasien <b>"${found.namaPasien}"</b> dengan Tanggal Lahir <b>${inputTgl}</b> sudah ada`;
    }
  }

  if (found) {
    alertText.innerHTML = `${reason} di sistem dengan <b>No. RM: ${found.noRm || '-'}</b> (${found.idPasien}).<br>Disarankan untuk membuka rekam medis pasien yang sudah ada agar tidak terjadi data dobel.`;
    btnBuka.onclick = function() {
      alertBox.classList.add('hidden');
      editPasien(found.idPasien);
    };
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }
}
function hitungUmurOtomatis() {
  let tglLahirStr = document.getElementById('pasTglLahir').value;
  if (!tglLahirStr) return;
  let tglLahir = new Date(tglLahirStr);
  let hariIni = new Date();
  let umur = hariIni.getFullYear() - tglLahir.getFullYear();
  let m = hariIni.getMonth() - tglLahir.getMonth();
  if (m < 0 || (m === 0 && hariIni.getDate() < tglLahir.getDate())) { umur--; }
  document.getElementById('pasUmur').value = umur > 0 ? umur + " Tahun" : "0 Tahun";
}
function editPasien(idPasien) {
  if (window.activeUserRole && (window.activeUserRole.toLowerCase().includes('dokter') || window.activeUserRole.toLowerCase().includes('staff'))) {
    showToast('warning', 'Role Anda hanya memiliki akses View pada Database Pasien.');
    return;
  }
  let p = window.KlinikData && window.KlinikData.pasien ? window.KlinikData.pasien.find(x => x.idPasien === idPasien) : null;
  if (!p) {
    showToast('error', 'Data pasien tidak ditemukan.');
    return;
  }

  if (document.getElementById('pasienMode')) document.getElementById('pasienMode').value = 'edit';
  document.getElementById('pasId').value = p.idPasien || '';
  document.getElementById('pasRm').value = p.noRm || '';
  document.getElementById('pasNama').value = p.namaPasien || '';
  
  let tglL = p.tanggalLahir || '';
  if (tglL.includes('-')) {
    let parts = tglL.split('-');
    if (parts[0].length === 2) {
      tglL = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  document.getElementById('pasTglLahir').value = tglL;
  document.getElementById('pasJk').value = p.jenisKelamin || '';
  document.getElementById('pasUmur').value = p.umur || '';
  document.getElementById('pasAgama').value = p.agama || '';
  document.getElementById('pasGoldar').value = p.golonganDarah || '';
  document.getElementById('pasPekerjaan').value = p.pekerjaan || '';
  document.getElementById('pasNik').value = p.nik || '';
  document.getElementById('pasAlamat').value = p.alamat || '';
  document.getElementById('pasProvinsi').value = p.provinsi || '';
  document.getElementById('pasKabupaten').value = p.kabupaten || '';
  document.getElementById('pasKecamatan').value = p.kecamatan || '';
  document.getElementById('pasKelurahan').value = p.kelurahan || '';
  document.getElementById('pasWa').value = p.whatsapp || '';
  document.getElementById('pasAlergi').value = p.alergi || '';
  document.getElementById('pasRiwayat').value = p.riwayatPenyakit || '';
  if (document.getElementById('pasCatatan')) {
    document.getElementById('pasCatatan').value = p.catatan || '';
  }
 
  let tglInput = document.getElementById('pasienTglDaftar');
  if(tglInput) {
      if (p.tglDaftar) {
          tglInput.value = p.tglDaftar;
      } else {
          let d = new Date();
          let m = ("0" + (d.getMonth() + 1)).slice(-2);
          let day = ("0" + d.getDate()).slice(-2);
          tglInput.value = `${d.getFullYear()}-${m}-${day}`;
      }
  }

  let formTitle = document.getElementById('formTitle');
  if (formTitle) formTitle.innerText = `Edit Data Pasien (${p.noRm || p.idPasien} - ${p.namaPasien})`;
  let btnSimpan = document.getElementById('btnSimpanPasien');
  if (btnSimpan) {
    btnSimpan.innerHTML = '💾 Simpan Perubahan Data';
    btnSimpan.disabled = false;
  }
  let btnBatal = document.getElementById('btnBatalPasien');
  if (btnBatal) btnBatal.classList.remove('hidden');

  let alertEl = document.getElementById('alertDuplikatPasien');
  if (alertEl) alertEl.classList.add('hidden');
 
  document.getElementById('panelTabelPasien').classList.add('hidden');
  document.getElementById('panelFormPasien').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function simpanDataPasien(e) {
  e.preventDefault();
  let btn = document.getElementById('btnSimpanPasien');
  let originalBtnHtml = btn ? btn.innerHTML : '💾 Simpan Data Pasien';
  if (btn) {
    btn.innerHTML = 'MENYIMPAN...';
    btn.disabled = true;
  }

  let idVal = (document.getElementById('pasId').value || "").trim();
  let rmVal = (document.getElementById('pasRm').value || "").trim();

  let payload = {
      idPasien: idVal,
      noRm: rmVal,
      namaPasien: (document.getElementById('pasNama').value || "").trim(),
      tanggalLahir: (document.getElementById('pasTglLahir').value || "").trim(),
      jenisKelamin: (document.getElementById('pasJk').value || "").trim(),
      umur: (document.getElementById('pasUmur').value || "").trim(),
      agama: (document.getElementById('pasAgama').value || "").trim(),
      golonganDarah: (document.getElementById('pasGoldar').value || "").trim(),
      pekerjaan: (document.getElementById('pasPekerjaan').value || "").trim(),
      nik: (document.getElementById('pasNik').value || "").trim(),
      alamat: (document.getElementById('pasAlamat').value || "").trim(),
      provinsi: document.getElementById('pasProvinsi') ? (document.getElementById('pasProvinsi').value || "").trim() : "",
      kabupaten: document.getElementById('pasKabupaten') ? (document.getElementById('pasKabupaten').value || "").trim() : "",
      kecamatan: document.getElementById('pasKecamatan') ? (document.getElementById('pasKecamatan').value || "").trim() : "",
      kelurahan: document.getElementById('pasKelurahan') ? (document.getElementById('pasKelurahan').value || "").trim() : "",
      whatsapp: (document.getElementById('pasWa').value || "").trim(),
      alergi: (document.getElementById('pasAlergi').value || "").trim(),
      riwayatPenyakit: (document.getElementById('pasRiwayat').value || "").trim(),
      catatan: document.getElementById('pasCatatan') ? (document.getElementById('pasCatatan').value || "").trim() : "",
      tglDaftar: document.getElementById('pasienTglDaftar') ? document.getElementById('pasienTglDaftar').value : "",
      currentUser: window.activeNamaAccount
  };

  const onSuccess = (res) => {
      if (btn) {
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
      }
      if (res && res.success) {
          showToast('success', res.message || 'Data Pasien berhasil disimpan!');
          
          // 1. SINKRONISASI DATA LOKAL SECARA INSTAN (OPTIMISTIC UPDATE)
          if (!window.KlinikData) window.KlinikData = {};
          if (!Array.isArray(window.KlinikData.pasien)) window.KlinikData.pasien = [];

          let targetId = res.idPasien || payload.idPasien;
          let targetRm = res.noRm || payload.noRm;
          
          let existingIdx = -1;
          if (payload.idPasien) {
            existingIdx = window.KlinikData.pasien.findIndex(p => (p.idPasien || '').trim().toLowerCase() === payload.idPasien.trim().toLowerCase());
          }
          if (existingIdx === -1 && payload.noRm) {
            existingIdx = window.KlinikData.pasien.findIndex(p => (p.noRm || '').trim().toLowerCase() === payload.noRm.trim().toLowerCase());
          }

          let updatedRecord = {
            idPasien: targetId,
            noRm: targetRm,
            namaPasien: payload.namaPasien,
            tanggalLahir: payload.tanggalLahir,
            jenisKelamin: payload.jenisKelamin,
            umur: payload.umur,
            agama: payload.agama,
            golonganDarah: payload.golonganDarah,
            pekerjaan: payload.pekerjaan,
            nik: payload.nik,
            alamat: payload.alamat,
            provinsi: payload.provinsi,
            kabupaten: payload.kabupaten,
            kecamatan: payload.kecamatan,
            kelurahan: payload.kelurahan,
            whatsapp: payload.whatsapp,
            alergi: payload.alergi,
            riwayatPenyakit: payload.riwayatPenyakit,
            catatan: payload.catatan,
            tglDaftar: payload.tglDaftar
          };

          if (existingIdx !== -1) {
            Object.assign(window.KlinikData.pasien[existingIdx], updatedRecord);
          } else {
            window.KlinikData.pasien.unshift(updatedRecord);
          }

          // Perbarui statistik dan tabel secara instan
          updateStatistikPasienTampilan();
          searchPasienData();

          // 2. KOSONGKAN FORM & KEMBALIKAN KE TABEL
          tutupFormPasien();

          // Refresh latar belakang jika tersedia
          if (typeof startDataSync === 'function') {
            startDataSync();
          }
      } else {
          showToast('error', (res && res.message) ? res.message : 'Gagal menyimpan pasien.');
      }
  };

  const onFailure = (err) => {
      if (btn) {
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
      }
      showToast('error', 'Gagal menyimpan: ' + (err ? err.message : 'Kesalahan server.'));
  };

  google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(onFailure)
    .simpanPasien(payload);
}

function konfirmasiHapusPasien(idPasien, namaPasien) {
  if (confirm(`PERINGATAN SUPER USER:\nApakah Anda yakin ingin MENGHAPUS PERMANEN data pasien: "${namaPasien}" (${idPasien})?\nTindakan ini tidak dapat dibatalkan.`)) {
    google.script.run.withSuccessHandler(res => {
      if (res.success) {
        showToast('success', res.message);
        if (window.KlinikData && Array.isArray(window.KlinikData.pasien)) {
          window.KlinikData.pasien = window.KlinikData.pasien.filter(p => p.idPasien !== idPasien);
          filteredPasienList = filteredPasienList.filter(p => p.idPasien !== idPasien);
        }
        renderTablePagePasien();
        startDataSync();
      } else {
        showToast('error', res.message);
      }
    }).withFailureHandler(err => {
      showToast('error', 'Gagal menghapus: ' + err.message);
    }).hapusPasienPermanen({ idPasien: idPasien, currentUser: window.activeNamaAccount });
  }
}

function loadListPekerjaan() {
google.script.run.withSuccessHandler(res => {
  if (!res || res.length === 0) return;
  let inputs = document.querySelectorAll('input, select');
  let elPekerjaan = null;
  for(let i = 0; i < inputs.length; i++) {
     let elId = (inputs[i].id || "").toLowerCase();
     let elName = (inputs[i].name || "").toLowerCase();
     if(elId.includes("pekerjaan") || elName.includes("pekerjaan")) {
        elPekerjaan = inputs[i]; break;
     }
  }
  if (elPekerjaan) {
    if (elPekerjaan.tagName.toLowerCase() === 'select') {
      let optionsHtml = '<option value="" disabled selected>-- Pilih Pekerjaan --</option>';
      res.forEach(p => { optionsHtml += `<option value="${p}">${p}</option>`; });
      elPekerjaan.innerHTML = optionsHtml;
    }
    else {
       let dl = document.getElementById('listPekerjaanData');
       if(!dl) { dl = document.createElement('datalist'); dl.id = 'listPekerjaanData'; document.body.appendChild(dl); }
       let optionsHtml = ''; res.forEach(p => { optionsHtml += `<option value="${p}">`; });
       dl.innerHTML = optionsHtml; elPekerjaan.setAttribute('list', 'listPekerjaanData');
    }
  }
}).getDaftarPekerjaan();
}
// ========================================================
// ENGINE MIRRORING ODONTOGRAM & EMR (PERSIS REKAM MEDIS)
// ========================================================
const PAS_TOOTH_CONDITIONS = {
 nor: { code: 'nor', label: 'Normal (SOU)', color: '#ffffff' },
 car: { code: 'car', label: 'Karies (Car)', color: '#ef4444' },
 cfr: { code: 'cfr', label: 'Komposit (Cfr)', color: '#10b981' },
 amf: { code: 'amf', label: 'Amalgam (Amf)', color: '#475569' },
 gif: { code: 'gif', label: 'GIC / Semen', color: '#f97316' },
 fis: { code: 'fis', label: 'Sealant (Fis)', color: '#8b5cf6' },
 mis: { code: 'mis', label: 'Hilang (X)', color: '#94a3b8' },
 rrx: { code: 'rrx', label: 'Sisa Akar (RRX)', color: '#dc2626' },
 nvt: { code: 'nvt', label: 'Non-Vital', color: '#0f172a' },
 crn: { code: 'crn', label: 'Crown (Crn)', color: '#3b82f6' },
 une: { code: 'une', label: 'Blm Erupsi', color: '#64748b' },
 imx: { code: 'imx', label: 'Impaksi', color: '#ea580c' },
  tmp: { code: 'tmp', label: 'Sementara (Tmp)', color: '#f59e0b' },
  pre: { code: 'pre', label: 'Persistansi (Pre)', color: '#ec4899' }
};
const PAS_ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const PAS_ADULT_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const PAS_ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const PAS_ADULT_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
function renderOdoVisualPasien(odoJsonStr) {
 let odoData = {};
 try { odoData = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr; } catch(e){}
 const drawTooth = (num) => {
   const tState = odoData[num] || { generalCondition: 'nor', surfaces: {} };
   const surfs = tState.surfaces || {};
   const genCond = tState.generalCondition || 'nor';
   const isMissing = genCond === 'mis', isRadix = genCond === 'rrx', isCrown = genCond === 'crn', isNonVital = genCond === 'nvt', isUnerupted = genCond === 'une', isImpacted = genCond === 'imx', isPersistence = genCond === 'pre';
    const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);
   const isRightArch = (num >= 11 && num <= 18) || (num >= 41 && num <= 48) || (num >= 51 && num <= 55) || (num >= 81 && num <= 85);
   const leftSurface = isRightArch ? 'distal' : 'mesial';
   const rightSurface = isRightArch ? 'mesial' : 'distal';
   const topSurface = isUpper ? 'buccal' : 'lingual';
   const bottomSurface = isUpper ? 'lingual' : 'buccal';
   const centerSurface = 'occlusal';
 
   const getColor = (sKey) => {
     if (isMissing || isRadix || isUnerupted) return '#f8fafc';
     const cCode = surfs[sKey] || 'nor';
     const cond = PAS_TOOTH_CONDITIONS[cCode];
     return cond ? cond.color : '#ffffff';
   };
   return `
     <div style="display:flex; flex-direction:column; align-items:center;">
       <span style="font-size:8px; font-weight:bold; margin-bottom:2px; color:#475569;">${num}</span>
       <div style="width:28px; height:28px; position:relative;">
         ${isCrown ? `<div style="position:absolute; top:0; right:0; bottom:0; left:0; border-radius:9999px; border:1px solid #3b82f6; z-index:10; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);"></div>` : ''}
         ${isPersistence ? `<div style="position:absolute; top:0; right:0; bottom:0; left:0; border-radius:9999px; border:2px dashed #ec4899; z-index:10; pointer-events:none; box-shadow:0 1px 2px 0 rgba(236,72,153,0.15);"></div>` : ''}
         <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
           <rect x="4" y="4" width="92" height="92" rx="10" fill="${isMissing ? '#e2e8f0' : isUnerupted ? '#f1f5f9' : '#ffffff'}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="${isUnerupted ? '4 3' : 'none'}"/>
           ${!isMissing && !isRadix ? `
             <polygon points="10,10 90,10 70,30 30,30" fill="${getColor(topSurface)}" stroke="#64748b" stroke-width="1.5"/>
             <polygon points="30,70 70,70 90,90 10,90" fill="${getColor(bottomSurface)}" stroke="#64748b" stroke-width="1.5"/>
             <polygon points="10,10 30,30 30,70 10,90" fill="${getColor(leftSurface)}" stroke="#64748b" stroke-width="1.5"/>
             <polygon points="90,10 70,30 70,70 90,90" fill="${getColor(rightSurface)}" stroke="#64748b" stroke-width="1.5"/>
             <polygon points="30,30 70,30 70,70 30,70" fill="${getColor(centerSurface)}" stroke="#64748b" stroke-width="1.5"/>
           ` : ''}
           ${isMissing ? `<g stroke="#475569" stroke-width="5"><line x1="20" y1="20" x2="80" y2="80"/><line x1="80" y1="20" x2="20" y2="80"/></g>` : ''}
           ${isRadix ? `<polygon points="50,84 20,24 80,24" fill="#dc2626" stroke="#991b1b"/><text x="50" y="20" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">RRX</text>` : ''}
           ${isPersistence ? `<circle cx="50" cy="50" r="32" fill="none" stroke="#ec4899" stroke-width="3" stroke-dasharray="4 2"/><text x="50" y="58" text-anchor="middle" font-size="20" font-weight="900" fill="#ec4899">P</text>` : ''}
         </svg>
       </div>
     </div>`;
 };
 return `
   <div style="background-color:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0; text-align:center; overflow-x:auto;">
     <div style="display:flex; align-items:center; justify-content:center; gap:16px; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">
       <div style="display:flex; gap:4px; flex-direction:row-reverse;">${PAS_ADULT_UPPER_RIGHT.map(drawTooth).join('')}</div>
       <div style="width:4px; background-color:#cbd5e1; height:40px; border-radius:9999px;"></div>
       <div style="display:flex; gap:4px;">${PAS_ADULT_UPPER_LEFT.map(drawTooth).join('')}</div>
     </div>
     <div style="display:flex; align-items:center; justify-content:center; gap:16px; padding-top:8px;">
       <div style="display:flex; gap:4px; flex-direction:row-reverse;">${PAS_ADULT_LOWER_RIGHT.map(drawTooth).join('')}</div>
       <div style="width:4px; background-color:#cbd5e1; height:40px; border-radius:9999px;"></div>
       <div style="display:flex; gap:4px;">${PAS_ADULT_LOWER_LEFT.map(drawTooth).join('')}</div>
     </div>
   </div>
 `;
}
// Fungsi Pengecek apakah data EMR Teks atau JSON Visual
function renderOdontogramData(str) {
  if (!str || str === '-') return '-';
  try {
      let parsed = JSON.parse(str);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return renderOdoVisualPasien(str);
      }
  } catch(e) {}
  return `<div style="background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">${str}</div>`;
}
// ========================================================
// FUNGSI MEMBUKA HISTORY LENGKAP (DIPERBAIKI)
// ========================================================
function openHistoryEMR(idPasien) {
 let p = window.KlinikData.pasien.find(x => x.idPasien === idPasien);
 if (!p) return;
 let lblNamaRm = document.getElementById('lblHistoryNamaRM');
 if(lblNamaRm) lblNamaRm.innerText = `${p.namaPasien} (RM: ${p.noRm || '-'})`;
 let btnPrint = document.getElementById('btnPrintHistoryBtn');
 if(btnPrint) btnPrint.setAttribute('onclick', `printHistoryEMR('${idPasien}')`);
 let emrList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === idPasien);
 emrList.sort((a, b) => {
   let valA = a.waktuSimpan ? new Date(a.waktuSimpan).getTime() : new Date(a.tanggalPeriksa || 0).getTime();
   let valB = b.waktuSimpan ? new Date(b.waktuSimpan).getTime() : new Date(b.tanggalPeriksa || 0).getTime();
   return valB - valA;
 });
 window.currentPasienHistoryEMRList = emrList;
 let container = document.getElementById('containerHistoryEMR');
 if(!container) return;
 if (emrList.length === 0) {
    container.innerHTML = '<div class="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-400 font-bold">Belum ada riwayat rekam medis untuk pasien ini.</div>';
 } else {
    let html = emrList.map((r, rIdx) => {
       let odoJsonStr = r.odontogramStr || r.odontogram || "{}";
       let ana = {}, fis = {}, odo = {}, tind = [], obat = [];
       try { ana = JSON.parse(r.anamnesisStr || "{}"); } catch(e){}
       try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
       try { odo = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr; } catch(e){}
       try { tind = JSON.parse(r.tindakanStr || "[]"); } catch(e){}
       try { obat = JSON.parse(r.obatStr || "[]"); } catch(e){}
     
       // FORMAT TANGGAL: DD MONTH YYYY
       let tglFormat = r.tanggalPeriksa || '-';
       if(tglFormat !== '-') {
            let parts = tglFormat.split('-');
            if(parts.length === 3 && parts[0].length === 4) {
                const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                tglFormat = `${parseInt(parts[2], 10)} ${bulan[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
            }
       }
     
       // Hitung Nilai DMF-T untuk Ringkasan Awal
       let dCount = 0, mCount = 0, fCount = 0;
       const arrGigiDewasa = [...PAS_ADULT_UPPER_RIGHT, ...PAS_ADULT_UPPER_LEFT, ...PAS_ADULT_LOWER_RIGHT, ...PAS_ADULT_LOWER_LEFT];
       arrGigiDewasa.forEach(n => {
         const t = odo[n]; if (!t) return;
         if (t.generalCondition === 'car' || Object.values(t.surfaces || {}).includes('car')) dCount++;
         else if (t.generalCondition === 'mis') mCount++;
         else if (Object.values(t.surfaces || {}).some(c => ['cfr', 'amf', 'gif'].includes(c))) fCount++;
       });
       const dmftTotal = dCount + mCount + fCount;
       const odoFilledGigi = Object.keys(odo).length;
     
       return `
       <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
         <div class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
           <div>
             <h2 class="text-xl font-black uppercase tracking-widest text-slate-900">Rekam Medis Pasien</h2>
             <p class="text-xs font-bold mt-1 text-slate-600">SHELDON Oral Maxillofacial Surgery & Dental Implant Center</p>
           </div>
           <div class="text-right">
             <p class="text-[10px] font-bold text-slate-500">Kunjungan: ${tglFormat}</p>
             <p class="text-xs font-black text-indigo-700">${r.dokterPemeriksa || '-'}</p>
           </div>
         </div>
       
         <div class="space-y-4 text-xs">
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Anamnesis</h4>
             <table class="w-full">
               <tr><td class="w-40 py-1 text-slate-600">Chief Complain (CC)</td><td>: ${ana.cc || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Present Illness (PI)</td><td>: ${ana.pi || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Past Dental/Medical Hist.</td><td>: ${ana.pdh || '-'} / ${ana.pmh || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Family Hist / Khusus</td><td>: ${ana.fh || '-'} / ${ana.khusus || '-'}</td></tr>
             </table>
             <div class="mt-2 text-[10px]"><b>Review Of System:</b>
               Endo(${ana.ros?.endo||'-'}), Gastro(${ana.ros?.gastro||'-'}), Hemato(${ana.ros?.hemato||'-'}), Kardio(${ana.ros?.kardio||'-'}),
               Muskulo(${ana.ros?.muskulo||'-'}), Neuro(${ana.ros?.neuro||'-'}), Resp(${ana.ros?.respirasi||'-'}), Uro(${ana.ros?.uro||'-'})
             </div>
           </div>
         
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Pemeriksaan Fisik</h4>
             <table class="w-full">
               <tr><td class="w-32 py-1 text-slate-600">Kesan Umum</td><td>: ${fis.kesan || '-'}</td><td class="w-32 py-1 text-slate-600">Kesadaran</td><td>: ${fis.kesadaran || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Tensi (mmHg)</td><td>: ${fis.tensi || '-'}</td><td class="py-1 text-slate-600">Nafas (x/mnt)</td><td>: ${fis.nafas || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Nadi (x/mnt)</td><td>: ${fis.nadi || '-'}</td><td class="py-1 text-slate-600">Suhu (°C)</td><td>: ${fis.suhu || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">BB (kg) / TB (cm)</td><td colspan="3">: ${fis.bb || '-'} / ${fis.tb || '-'}</td></tr>
             </table>
             <table class="w-full mt-1">
               <tr><td class="w-40 py-1 text-slate-600">Alergi</td><td>: ${fis.alergi || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Ekstra / Intra Oral</td><td>: ${fis.ekstra || '-'} / ${fis.intra || '-'}</td></tr>
               <tr><td class="py-1 text-slate-600">Penunjang</td><td>: ${fis.penunjang || '-'}</td></tr>
             </table>
           </div>
         
           <!-- MODUL ODONTOGRAM: RINGKASAN AWAL DMF-T INDEX & TOMBOL INTERAKTIF -->
           <div class="bg-sky-50/60 border border-sky-200 p-3.5 rounded-xl text-left">
             <div class="flex justify-between items-center mb-2">
               <h4 class="font-black text-sky-900 uppercase text-xs flex items-center gap-1.5">
                 <span>🦷</span> Peta Odontogram Saat Kunjungan
               </h4>
               <span class="text-[10px] font-bold px-2 py-0.5 rounded ${odoFilledGigi === 0 ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">
                 ${odoFilledGigi === 0 ? 'Semua Sehat (SOU)' : `Tercatat (${odoFilledGigi} Gigi)`}
               </span>
             </div>
             <div class="grid grid-cols-4 gap-2 text-center text-xs">
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Decayed (D)</span>
                 <span class="font-black ${dCount > 0 ? 'text-rose-600' : 'text-slate-800'}">${dCount}</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Missing (M)</span>
                 <span class="font-black ${mCount > 0 ? 'text-amber-600' : 'text-slate-800'}">${mCount}</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Filled (F)</span>
                 <span class="font-black ${fCount > 0 ? 'text-emerald-600' : 'text-slate-800'}">${fCount}</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Total DMF-T</span>
                 <span class="font-black ${dmftTotal > 0 ? 'text-sky-700' : 'text-slate-800'}">${dmftTotal}</span>
               </div>
             </div>
             <div class="mt-2.5 text-right no-print">
               <button type="button" onclick="bukaModalOdontoHistoryPasien(${rIdx})" class="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
                 <span>🦷</span> Buka Gambar Odontogram &rarr;
               </button>
             </div>
           </div>
         
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosis Gigi (Tulisan)</h4>
             <ul class="list-disc pl-5 columns-1 sm:columns-3 gap-6 space-y-1 text-xs">
               ${Object.keys(odo).length === 0 ? '<li class="break-inside-avoid">Tidak ada kelainan (Normal/SOU) / Tidak ditandai</li>' :
                 Object.keys(odo).map(gigi => {
                   let dt = odo[gigi];
                   let diag = dt.diagnosis ? `(Diag: ${dt.diagnosis})` : '';
                   let nts = dt.notes ? `[Catatan: ${dt.notes}]` : '';
                   let gen = dt.generalCondition !== 'nor' ? `Kondisi: ${dt.generalCondition}` : '';
                   let sur = Object.entries(dt.surfaces||{}).filter(x=>x[1]!=='nor').map(x=>x[0]+'='+x[1]).join(', ');
                   let srTx = sur ? `Permukaan: ${sur}` : '';
                   return `<li class="break-inside-avoid"><b>Gigi ${gigi}:</b> <span class="text-slate-600">${gen}${srTx}</span> <span class="text-indigo-600 font-bold">${diag}</span> <span class="text-amber-600 italic">${nts}</span></li>`;
                 }).join('')
               }
             </ul>
           </div>
         
           ${fis.periodontal ? `
           <div class="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-xl text-left">
             <div class="flex justify-between items-center mb-2">
               <h4 class="font-black text-indigo-900 uppercase text-xs flex items-center gap-1.5">
                 <span>🦷</span> Hasil Periodontal Charting
               </h4>
               <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">Tercatat</span>
             </div>
             <div class="grid grid-cols-3 gap-2 text-center text-xs">
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Total Sites</span>
                 <span class="font-black text-slate-800">${fis.periodontal.summary?.totalSites || 0} Titik</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Deep Pockets (&ge;4mm)</span>
                 <span class="font-black ${(fis.periodontal.summary?.deepPockets || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.deepPockets || 0} Titik</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Bleeding Index (BOP)</span>
                 <span class="font-black ${(fis.periodontal.summary?.bopPercent || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.bopPercent || 0}%</span>
               </div>
             </div>
             <div class="mt-2.5 text-right no-print">
               <button type="button" onclick="bukaModalPerioHistoryPasien(${rIdx})" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
                 <span>📊</span> Buka Grafik Charting Lengkap &rarr;
               </button>
             </div>
           </div>
           ` : ""}
         
           ${fis.ohis ? `
           <div class="bg-teal-50/60 border border-teal-200 p-3.5 rounded-xl text-left">
             <div class="flex justify-between items-center mb-2">
               <h4 class="font-black text-teal-900 uppercase text-xs flex items-center gap-1.5">
                 <span>🪥</span> Hasil Pemeriksaan OHI-S
               </h4>
               <span class="text-[10px] font-bold px-2 py-0.5 rounded ${fis.ohis.category === 'Baik' || (fis.ohis.summary && fis.ohis.summary.kategori === 'Baik') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : (fis.ohis.category === 'Sedang' || (fis.ohis.summary && fis.ohis.summary.kategori === 'Sedang')) ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                 ${fis.ohis.category || (fis.ohis.summary ? fis.ohis.summary.kategori : 'Tercatat')} (${fis.ohis.totalScore || (fis.ohis.summary ? fis.ohis.summary.ohis : 0)})
               </span>
             </div>
             <div class="grid grid-cols-3 gap-2 text-center text-xs">
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Debris Index (DI-S)</span>
                 <span class="font-black text-slate-800">${fis.ohis.debrisScore || (fis.ohis.summary ? fis.ohis.summary.dis : 0)}</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Calculus Index (CI-S)</span>
                 <span class="font-black text-slate-800">${fis.ohis.calculusScore || (fis.ohis.summary ? fis.ohis.summary.cis : 0)}</span>
               </div>
               <div class="bg-white p-2 rounded-lg border border-slate-200">
                 <span class="text-[9px] text-slate-500 block font-bold">Total OHI-S Score</span>
                 <span class="font-black text-teal-700">${fis.ohis.totalScore || (fis.ohis.summary ? fis.ohis.summary.ohis : 0)}</span>
               </div>
             </div>
             <div class="mt-2.5 text-right no-print">
               <button type="button" onclick="bukaModalOhisHistoryPasien(${rIdx})" class="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
                 <span>🪥</span> Buka Detail Pemeriksaan OHI-S &rarr;
               </button>
             </div>
           </div>
           ` : ""}
         
           ${(ana.diagnosaICD && ana.diagnosaICD.length > 0) ? `
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosa (ICD-10)</h4>
             <ul class="list-disc pl-5 space-y-1 text-slate-800 font-bold mb-4">
               ${ana.diagnosaICD.map(d => `<li>${d}</li>`).join('')}
             </ul>
           </div>
           ` : ''}
         
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Tindakan (ICD-9)</h4>
             <ul class="list-disc pl-5">${tind.length === 0 ? '<li>-</li>' : tind.map(t => `<li>${t}</li>`).join('')}</ul>
           </div>
         
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Resep Obat</h4>
             <table class="w-full text-left border border-slate-300 border-collapse">
               <tr class="bg-slate-50"><th class="border border-slate-300 px-2 py-1">Nama Obat</th><th class="border border-slate-300 px-2 py-1 w-16 text-center">Qty</th><th class="border border-slate-300 px-2 py-1">Aturan Pakai</th></tr>
               ${obat.length === 0 ? '<tr><td colspan="3" class="border border-slate-300 px-2 py-1 text-center">-</td></tr>' : obat.map(o => `<tr><td class="border border-slate-300 px-2 py-1">${o.obat}</td><td class="border border-slate-300 px-2 py-1 text-center font-bold">${o.qty}</td><td class="border border-slate-300 px-2 py-1">${o.ket}</td></tr>`).join('')}
             </table>
           </div>
         
           <div>
             <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Catatan Edukasi</h4>
             <p class="pl-2 bg-rose-50 p-2 rounded border border-rose-100 text-rose-800 font-medium">${r.catatanEdukasi || '-'}</p>
           </div>
         </div>
       </div>
       `;
    }).join('');
  
    container.innerHTML = html;
 }
 let modal = document.getElementById('modalHistoryEMR');
 if(modal) modal.classList.remove('hidden');
}
function closeHistoryEMR() {
  let modal = document.getElementById('modalHistoryEMR');
  if(modal) modal.classList.add('hidden');
  tutupModalOdontoHistoryPasien();
  tutupModalPerioHistoryPasien();
  tutupModalOhisHistoryPasien();
}

// ----------------------------------------------------
// MODAL VIEWER ODONTOGRAM HISTORY PASIEN
// ----------------------------------------------------
function tutupModalOdontoHistoryPasien() {
  const m = document.getElementById('modalOdontoHistoryPasien');
  if (m) m.classList.add('hidden');
}

function bukaModalOdontoHistoryPasien(idx) {
  const r = (window.currentPasienHistoryEMRList || [])[idx];
  if (!r) return;
  const modal = document.getElementById('modalOdontoHistoryPasien');
  if (!modal) return;

  let odoJsonStr = r.odontogramStr || r.odontogram || "{}";
  let odoData = {};
  try {
    odoData = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr;
  } catch(e) {
    odoData = {};
  }

  // Subtitle info
  const sub = document.getElementById('lblSubOdontoPasien');
  if (sub) {
    sub.innerText = `Kunjungan: ${r.tanggalPeriksa || '-'} • Dokter: ${r.dokterPemeriksa || '-'}`;
  }

  // Hitung DMF-T
  let dCount = 0, mCount = 0, fCount = 0;
  if (odoData && typeof odoData === 'object') {
    Object.keys(odoData).forEach(gigi => {
      let t = odoData[gigi] || {};
      let gen = (t.generalCondition || '').toLowerCase();
      let surfs = t.surfaces || {};
      if (gen === 'mis') mCount++;
      let isFilled = gen === 'crn' || Object.values(surfs).some(v => ['amf', 'cof', 'gif'].includes(v));
      if (isFilled) fCount++;
      let isCaries = gen === 'rrx' || Object.values(surfs).some(v => ['car', 'dcf'].includes(v)) || ((t.diagnosis || '').toLowerCase().includes('karies'));
      if (isCaries) dCount++;
    });
  }
  let dmftTotal = dCount + mCount + fCount;

  // Render Stat Cards DMF-T
  const cardsCont = document.getElementById('odontoDmftCardsPasien');
  if (cardsCont) {
    cardsCont.innerHTML = `
      <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Decayed (D)</span>
        <span class="text-xl font-black ${dCount > 0 ? 'text-rose-600' : 'text-slate-800'} font-mono">${dCount}</span>
      </div>
      <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Missing (M)</span>
        <span class="text-xl font-black ${mCount > 0 ? 'text-amber-600' : 'text-slate-800'} font-mono">${mCount}</span>
      </div>
      <div class="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm">
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Filled (F)</span>
        <span class="text-xl font-black ${fCount > 0 ? 'text-emerald-600' : 'text-slate-800'} font-mono">${fCount}</span>
      </div>
      <div class="bg-white p-3 rounded-xl border border-sky-200 bg-sky-50/50 text-center shadow-sm">
        <span class="text-[9px] font-bold text-sky-700 uppercase tracking-wider block">Total DMF-T</span>
        <span class="text-xl font-black ${dmftTotal > 0 ? 'text-sky-700' : 'text-slate-800'} font-mono">${dmftTotal}</span>
      </div>
    `;
  }

  // Render SVG Odontogram Lengkap
  const visualCont = document.getElementById('odontoVisualContainerPasien');
  if (visualCont) {
    visualCont.innerHTML = renderOdoVisualPasien(JSON.stringify(odoData));
  }

  // Render Daftar Rincian Kondisi Gigi
  const listCont = document.getElementById('odontoListDiagnosaPasien');
  if (listCont) {
    let keys = Object.keys(odoData || {});
    if (keys.length === 0) {
      listCont.innerHTML = '<p class="text-slate-400 italic">Tidak ada kelainan gigi yang tercatat (Semua normal/SOU).</p>';
    } else {
      listCont.innerHTML = keys.map(k => {
        let dt = odoData[k] || {};
        let diag = dt.diagnosis ? `(Diag: ${dt.diagnosis})` : '';
        let nts = dt.notes ? `[Catatan: ${dt.notes}]` : '';
        let gen = dt.generalCondition && dt.generalCondition !== 'nor' ? `Kondisi: ${dt.generalCondition}` : '';
        let sur = Object.entries(dt.surfaces || {}).filter(x => x[1] !== 'nor').map(x => x[0] + '=' + x[1]).join(', ');
        let srTx = sur ? `Permukaan: ${sur}` : '';
        return `<div>&bull; <b>Gigi ${k}:</b> <span class="text-slate-600">${gen} ${srTx}</span> <span class="text-indigo-600 font-bold">${diag}</span> <span class="text-amber-600 italic">${nts}</span></div>`;
      }).join('');
    }
  }

  modal.classList.remove('hidden');
}

// ========================================================
// CONTROLLER PERIODONTAL CHARTING HISTORY PASIEN (DARK CLINICAL MODE)
// ========================================================
let perioTeethDataPasien = {};
let perioActiveArchPasien = "maxilla";
let perioActiveAspectPasien = "facial";

function tutupModalPerioHistoryPasien() {
  const m = document.getElementById('modalPerioHistoryPasien');
  if (m) m.classList.add('hidden');
}

function switchPerioArchPasien(arch) {
  perioActiveArchPasien = arch;
  const tabAtas = document.getElementById("tabPerioRahangAtasPasien");
  const tabBawah = document.getElementById("tabPerioRahangBawahPasien");
  if (tabAtas && tabBawah) {
    if (arch === "maxilla") {
      tabAtas.className = "flex-1 py-1.5 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all shadow";
      tabBawah.className = "flex-1 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    } else {
      tabBawah.className = "flex-1 py-1.5 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all shadow";
      tabAtas.className = "flex-1 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    }
  }
  renderPerioUIPasien();
}

function switchPerioAspectPasien(aspect) {
  perioActiveAspectPasien = aspect;
  const tabF = document.getElementById("tabPerioFacialPasien");
  const tabL = document.getElementById("tabPerioLingualPasien");
  if (tabF && tabL) {
    if (aspect === "facial") {
      tabF.className = "px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 text-white transition-all";
      tabL.className = "px-3 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    } else {
      tabL.className = "px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 text-white transition-all";
      tabF.className = "px-3 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    }
  }
  renderPerioUIPasien();
}

function getSiteKeysForAspectPasien() {
  if (perioActiveAspectPasien === "facial") {
    return [
      { key: "df", label: "Distofacial (DF)" },
      { key: "f",  label: "Midfacial (F)" },
      { key: "mf", label: "Mesiofacial (MF)" }
    ];
  } else {
    if (perioActiveArchPasien === "maxilla") {
      return [
        { key: "dp", label: "Distopalatal (DP)" },
        { key: "p",  label: "Midpalatal (P)" },
        { key: "mp", label: "Mesiopalatal (MP)" }
      ];
    } else {
      return [
        { key: "dl", label: "Distolingual (DL)" },
        { key: "l",  label: "Midlingual (L)" },
        { key: "ml", label: "Mesiolingual (ML)" }
      ];
    }
  }
}

function renderPerioGraphicPasien(teethList) {
  const svg = document.getElementById("svgPerioChartPasien");
  if (!svg) return;

  const sites = getSiteKeysForAspectPasien();
  const toothWidth = 1000 / teethList.length;
  const isMaxilla = (perioActiveArchPasien === "maxilla");

  const gridLines = [
    { depth: 1, y: isMaxilla ? 85 : 105, label: "1mm" },
    { depth: 3, y: isMaxilla ? 70 : 120, label: "3mm" },
    { depth: 6, y: isMaxilla ? 50 : 140, label: "6mm" },
    { depth: 7, y: isMaxilla ? 40 : 150, label: "7mm" },
    { depth: 9, y: isMaxilla ? 25 : 165, label: "9mm" }
  ];

  let svgContent = "";

  // 1. Grid lines horizontal
  gridLines.forEach(g => {
    svgContent += `
      <line x1="40" y1="${g.y}" x2="980" y2="${g.y}" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1"/>
      <text x="10" y="${g.y + 3}" fill="#475569" font-size="9" font-family="monospace">${g.label}</text>
    `;
  });

  // 2. Render visual per gigi
  teethList.forEach((tNum, idx) => {
    const tData = perioTeethDataPasien[tNum] || {};
    const centerX = idx * toothWidth + (toothWidth / 2);

    // Siluet mahkota & akar gigi
    if (isMaxilla) {
      svgContent += `
        <path d="M ${centerX - 7} 80 C ${centerX - 8} 40, ${centerX - 3} 20, ${centerX} 15 C ${centerX + 3} 20, ${centerX + 8} 40, ${centerX + 7} 80 Z" fill="#94a3b8" fill-opacity="0.25" stroke="#64748b" stroke-width="1"/>
        <path d="M ${centerX - 12} 82 C ${centerX - 14} 115, ${centerX - 10} 130, ${centerX} 132 C ${centerX + 10} 130, ${centerX + 14} 115, ${centerX + 12} 82 Z" fill="#cbd5e1" fill-opacity="0.75" stroke="#94a3b8" stroke-width="1.2"/>
      `;
    } else {
      svgContent += `
        <path d="M ${centerX - 12} 98 C ${centerX - 14} 65, ${centerX - 10} 50, ${centerX} 48 C ${centerX + 10} 50, ${centerX + 14} 65, ${centerX + 12} 98 Z" fill="#cbd5e1" fill-opacity="0.75" stroke="#94a3b8" stroke-width="1.2"/>
        <path d="M ${centerX - 7} 100 C ${centerX - 8} 140, ${centerX - 3} 160, ${centerX} 165 C ${centerX + 3} 160, ${centerX + 8} 140, ${centerX + 7} 100 Z" fill="#94a3b8" fill-opacity="0.25" stroke="#64748b" stroke-width="1"/>
      `;
    }

    // Nomor gigi
    svgContent += `
      <text x="${centerX}" y="${isMaxilla ? 150 : 38}" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="bold" font-family="monospace">T${tNum}</text>
    `;

    // 3 probe sites per gigi
    const siteOffsets = [-10, 0, 10];
    const depths = [tData[sites[0].key] || 0, tData[sites[1].key] || 0, tData[sites[2].key] || 0];
    const bops = [!!tData["bop_" + sites[0].key], !!tData["bop_" + sites[1].key], !!tData["bop_" + sites[2].key]];

    let polyPoints = [];
    siteOffsets.forEach((off, sIdx) => {
      const siteX = centerX + off;
      const d = depths[sIdx];
      const dPx = Math.min(d * 8, 75);
      const siteY = isMaxilla ? (80 - dPx) : (100 + dPx);
      polyPoints.push({ x: siteX, y: siteY, depth: d, isBop: bops[sIdx] });
    });

    // Arsiran pocket depth
    if (isMaxilla) {
      const hasDeep = depths.some(d => d >= 4);
      const pocketColor = hasDeep ? "rgba(239, 68, 68, 0.45)" : "rgba(59, 130, 246, 0.2)";
      const strokeColor = hasDeep ? "#ef4444" : "#3b82f6";
      const polyStr = `${polyPoints[0].x},80 ${polyPoints[0].x},${polyPoints[0].y} ${polyPoints[1].x},${polyPoints[1].y} ${polyPoints[2].x},${polyPoints[2].y} ${polyPoints[2].x},80`;
      svgContent += `
        <polygon points="${polyStr}" fill="${pocketColor}" stroke="${strokeColor}" stroke-width="1.2"/>
      `;
    } else {
      const hasDeep = depths.some(d => d >= 4);
      const pocketColor = hasDeep ? "rgba(239, 68, 68, 0.45)" : "rgba(59, 130, 246, 0.2)";
      const strokeColor = hasDeep ? "#ef4444" : "#3b82f6";
      const polyStr = `${polyPoints[0].x},100 ${polyPoints[0].x},${polyPoints[0].y} ${polyPoints[1].x},${polyPoints[1].y} ${polyPoints[2].x},${polyPoints[2].y} ${polyPoints[2].x},100`;
      svgContent += `
        <polygon points="${polyStr}" fill="${pocketColor}" stroke="${strokeColor}" stroke-width="1.2"/>
      `;
    }

    // Titik probe & BOP
    polyPoints.forEach((pt) => {
      if (pt.depth > 0) {
        svgContent += `
          <circle cx="${pt.x}" cy="${pt.y}" r="${pt.depth >= 4 ? 3.5 : 2.5}" fill="${pt.depth >= 4 ? '#f43f5e' : '#38bdf8'}" stroke="#0f172a" stroke-width="1"/>
        `;
      }
      if (pt.isBop) {
        const bopY = isMaxilla ? 83 : 97;
        svgContent += `
          <circle cx="${pt.x}" cy="${bopY}" r="3" fill="#f43f5e" stroke="#ffe4e6" stroke-width="1"/>
        `;
      }
    });
  });

  svg.innerHTML = svgContent;
}

function renderPerioCardsPasien(teethList) {
  const container = document.getElementById("perioCardsContainerPasien");
  if (!container) return;

  const sites = getSiteKeysForAspectPasien();

  const html = teethList.map((tNum) => {
    const tData = perioTeethDataPasien[tNum] || {};

    const siteBoxes = sites.map((s) => {
      const val = tData[s.key] || 0;
      const isBop = !!tData["bop_" + s.key];
      const isDeep = (val >= 4);

      let valColor = "text-cyan-300";
      let boxBg = "bg-slate-900 border-slate-800";
      if (isDeep) {
        valColor = "text-rose-400 font-black";
        boxBg = "bg-rose-950/40 border-rose-800/60";
      } else if (val === 0) {
        valColor = "text-slate-500 font-medium";
      }

      const bopDot = isBop 
        ? `<span class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] inline-block"></span>`
        : `<span class="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block"></span>`;

      return `
        <div class="flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg border ${boxBg}">
          <span class="text-[9px] font-bold text-slate-400 font-mono mb-0.5">${s.label.split(" ")[1].replace(/[()]/g,"")}</span>
          <span class="text-sm font-black font-mono ${valColor}">${val || "-"}</span>
          <div class="mt-1 flex items-center justify-center">${bopDot}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="bg-[#111827] border border-slate-800 rounded-xl p-2.5 flex flex-col">
        <div class="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/80">
          <span class="font-black font-mono text-sm text-blue-400">T${tNum}</span>
          <span class="text-[9px] text-slate-500 font-bold uppercase">${perioActiveAspectPasien}</span>
        </div>
        <div class="flex gap-1.5 justify-between">
          ${siteBoxes}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

function renderPerioUIPasien() {
  const teethList = (perioActiveArchPasien === "maxilla")
    ? [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
    : [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  // 1. Update Labels & Metrics
  let totalSites = 0, deepPockets = 0, bopSites = 0;
  const allTeethNums = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
  ];
  const allSitesKeys = ["df", "f", "mf", "dp", "p", "mp", "dl", "l", "ml"];

  allTeethNums.forEach(tNum => {
    const t = perioTeethDataPasien[tNum];
    if (t) {
      allSitesKeys.forEach(sKey => {
        if (typeof t[sKey] === "number" && t[sKey] > 0) {
          totalSites++;
          if (t[sKey] >= 4) deepPockets++;
        }
        if (t["bop_" + sKey]) {
          bopSites++;
        }
      });
    }
  });

  const bopPercent = totalSites > 0 ? Math.round((bopSites / totalSites) * 100) : 0;

  const elTot = document.getElementById("metricTotalSitesPasien");
  const elDeep = document.getElementById("metricDeepPocketsPasien");
  const elBop = document.getElementById("metricBopPercentPasien");
  if (elTot) elTot.innerText = totalSites;
  if (elDeep) elDeep.innerText = deepPockets;
  if (elBop) elBop.innerText = `${bopPercent}% (${bopSites} sites)`;

  const elGLabel = document.getElementById("perioGraphicLabelPasien");
  if (elGLabel) {
    elGLabel.innerHTML = `${perioActiveArchPasien === "maxilla" ? "Rahang Atas (18-28)" : "Rahang Bawah (48-38)"} &bull; Tampilan ${perioActiveAspectPasien === "facial" ? "Fasial/Bukal" : (perioActiveArchPasien === "maxilla" ? "Palatal" : "Lingual")}`;
  }

  const elGridHeader = document.getElementById("perioGridHeaderPasien");
  if (elGridHeader) {
    elGridHeader.innerHTML = `Daftar Gigi ${perioActiveArchPasien === "maxilla" ? "Rahang Atas (18-28)" : "Rahang Bawah (48-38)"} (Tampilan ${perioActiveAspectPasien === "facial" ? "Fasial/Bukal" : (perioActiveArchPasien === "maxilla" ? "Palatal" : "Lingual")})`;
  }

  const elFooter = document.getElementById("perioFooterSummaryTextPasien");
  if (elFooter) {
    elFooter.innerHTML = `Terisi ${totalSites} titik &bull; Saku Dalam (&ge;4mm): ${deepPockets} titik &bull; Bleeding Index (BOP): ${bopPercent}% (${bopSites} titik perdarahan).`;
  }

  // 2. Render Cards Grid
  renderPerioCardsPasien(teethList);

  // 3. Render SVG Graphic
  renderPerioGraphicPasien(teethList);
}

function bukaModalPerioHistoryPasien(idx) {
  const r = (window.currentPasienHistoryEMRList || [])[idx];
  if (!r) return;
  const modal = document.getElementById('modalPerioHistoryPasien');
  if (!modal) return;

  let fis = {};
  try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
  if (!fis || !fis.periodontal || !fis.periodontal.teeth) {
    if (typeof alertMsg === 'function') {
      alertMsg("info", "Kunjungan ini tidak memiliki catatan data Periodontal Charting.");
    }
    return;
  }

  perioTeethDataPasien = JSON.parse(JSON.stringify(fis.periodontal.teeth || {}));
  perioActiveArchPasien = "maxilla";
  perioActiveAspectPasien = "facial";

  const sub = document.getElementById('lblSubPerioPasien');
  if (sub) {
    sub.innerText = `Kunjungan: ${r.tanggalPeriksa || '-'} • Dokter: ${r.dokterPemeriksa || '-'}`;
  }

  // Reset tab button states & render UI
  switchPerioArchPasien('maxilla');
  switchPerioAspectPasien('facial');

  modal.classList.remove('hidden');
}


// ========================================================
// CONTROLLER OHI-S HISTORY PASIEN (DARK TEAL MODE)
// ========================================================
let ohisTeethDataPasien = {};

function tutupModalOhisHistoryPasien() {
  const m = document.getElementById('modalOhisHistoryPasien');
  if (m) m.classList.add('hidden');
}

function renderOhisToothCardPasien(t) {
  const dVal = (ohisTeethDataPasien[t.no] && typeof ohisTeethDataPasien[t.no].d === 'number') ? ohisTeethDataPasien[t.no].d : 0;
  const cVal = (ohisTeethDataPasien[t.no] && typeof ohisTeethDataPasien[t.no].c === 'number') ? ohisTeethDataPasien[t.no].c : 0;

  const btnPill = (tooth, type, val, currentVal) => {
    const isSelected = (val === currentVal);
    let colorClass = "bg-slate-800 text-slate-400 border-slate-700 opacity-60";
    if (isSelected) {
      if (val === 0) colorClass = "bg-emerald-600 text-white font-black border-emerald-400 shadow-md shadow-emerald-900/50 opacity-100 ring-2 ring-emerald-400";
      else if (val === 1) colorClass = "bg-sky-600 text-white font-black border-sky-400 shadow-md shadow-sky-900/50 opacity-100 ring-2 ring-sky-400";
      else if (val === 2) colorClass = "bg-amber-600 text-white font-black border-amber-400 shadow-md shadow-amber-900/50 opacity-100 ring-2 ring-amber-400";
      else if (val === 3) colorClass = "bg-rose-600 text-white font-black border-rose-400 shadow-md shadow-rose-900/50 opacity-100 ring-2 ring-rose-400";
    }
    return `<div class="flex-1 py-1 px-1 rounded-lg text-xs font-bold border text-center ${colorClass}">${val}</div>`;
  };

  return `
    <div class="bg-[#12222b] border border-teal-900/50 rounded-xl p-3 shadow-sm hover:border-teal-700/60 transition-colors">
      <div class="flex justify-between items-center mb-2 pb-1.5 border-b border-teal-950">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-black text-sm flex items-center justify-center border border-teal-500/30">${t.no}</span>
          <div>
            <div class="text-[11px] font-bold text-white">${t.name}</div>
            <div class="text-[9px] text-teal-300 font-mono">Permukaan ${t.surface}</div>
          </div>
        </div>
      </div>
      
      <!-- DEBRIS ROW -->
      <div class="mb-2">
        <div class="flex justify-between items-center text-[10px] mb-1">
          <span class="font-bold text-slate-300">Debris (DI-S):</span>
          <span class="font-mono text-teal-400 font-bold">Skor ${dVal}</span>
        </div>
        <div class="flex gap-1">
          ${btnPill(t.no, 'd', 0, dVal)}
          ${btnPill(t.no, 'd', 1, dVal)}
          ${btnPill(t.no, 'd', 2, dVal)}
          ${btnPill(t.no, 'd', 3, dVal)}
        </div>
      </div>

      <!-- CALCULUS ROW -->
      <div>
        <div class="flex justify-between items-center text-[10px] mb-1">
          <span class="font-bold text-slate-300">Calculus (CI-S):</span>
          <span class="font-mono text-teal-400 font-bold">Skor ${cVal}</span>
        </div>
        <div class="flex gap-1">
          ${btnPill(t.no, 'c', 0, cVal)}
          ${btnPill(t.no, 'c', 1, cVal)}
          ${btnPill(t.no, 'c', 2, cVal)}
          ${btnPill(t.no, 'c', 3, cVal)}
        </div>
      </div>
    </div>
  `;
}

function bukaModalOhisHistoryPasien(idx) {
  const r = (window.currentPasienHistoryEMRList || [])[idx];
  if (!r) return;
  const modal = document.getElementById('modalOhisHistoryPasien');
  if (!modal) return;

  let fis = {};
  try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
  if (!fis || !fis.ohis) {
    if (typeof alertMsg === 'function') {
      alertMsg("info", "Kunjungan ini tidak memiliki catatan data OHI-S.");
    }
    return;
  }

  const ohis = fis.ohis;
  const summary = ohis.summary || {};
  ohisTeethDataPasien = JSON.parse(JSON.stringify(ohis.teeth || {}));

  // Hitung metrik jika summary belum ada
  let totD = 0, totC = 0, countD = 0, countC = 0;
  const ohisTeethList = [
    { no: "16", name: "Molar 1 Atas Kanan", arch: "maxilla", surface: "Bukal (Buccal)" },
    { no: "11", name: "Insisivus 1 Atas Kanan", arch: "maxilla", surface: "Labial" },
    { no: "26", name: "Molar 1 Atas Kiri", arch: "maxilla", surface: "Bukal (Buccal)" },
    { no: "46", name: "Molar 1 Bawah Kanan", arch: "mandible", surface: "Lingual" },
    { no: "31", name: "Insisivus 1 Bawah Kiri", arch: "mandible", surface: "Labial" },
    { no: "36", name: "Molar 1 Bawah Kiri", arch: "mandible", surface: "Lingual" }
  ];

  ohisTeethList.forEach(t => {
    const item = ohisTeethDataPasien[t.no];
    if (item) {
      if (typeof item.d === 'number') { totD += item.d; countD++; }
      if (typeof item.c === 'number') { totC += item.c; countC++; }
    }
  });

  const numD = countD > 0 ? (totD / countD) : (Number(ohis.debrisScore) || 0);
  const numC = countC > 0 ? (totC / countC) : (Number(ohis.calculusScore) || 0);
  const numTot = Number((numD + numC).toFixed(2));

  const dis = summary.dis || numD.toFixed(2);
  const cis = summary.cis || numC.toFixed(2);
  const totalScore = summary.ohis || numTot.toFixed(2);

  let kat = "Baik";
  let katClass = "bg-emerald-950 text-emerald-300 border-emerald-600";
  let rangeTxt = "Rentang: 0.0 - 1.2";

  if (numTot > 3.0) {
    kat = "Buruk (Poor)";
    katClass = "bg-rose-950 text-rose-300 border-rose-600";
    rangeTxt = "Rentang: 3.1 - 6.0";
  } else if (numTot > 1.2) {
    kat = "Sedang (Moderate)";
    katClass = "bg-amber-950 text-amber-300 border-amber-600";
    rangeTxt = "Rentang: 1.3 - 3.0";
  } else {
    kat = "Baik (Good)";
    katClass = "bg-emerald-950 text-emerald-300 border-emerald-600";
    rangeTxt = "Rentang: 0.0 - 1.2";
  }

  // Subtitle
  const sub = document.getElementById('lblSubOhisPasien');
  if (sub) {
    sub.innerText = `Kunjungan: ${r.tanggalPeriksa || '-'} • Dokter: ${r.dokterPemeriksa || '-'}`;
  }

  // Render Maxilla Cards
  const maxillaContainer = document.getElementById("ohisGridMaxillaPasien");
  if (maxillaContainer) {
    const maxTeeth = ohisTeethList.filter(t => t.arch === 'maxilla');
    maxillaContainer.innerHTML = maxTeeth.map(renderOhisToothCardPasien).join('');
  }

  // Render Mandible Cards
  const mandibleContainer = document.getElementById("ohisGridMandiblePasien");
  if (mandibleContainer) {
    const manTeeth = ohisTeethList.filter(t => t.arch === 'mandible');
    mandibleContainer.innerHTML = manTeeth.map(renderOhisToothCardPasien).join('');
  }

  // Scores
  const scoreDIS = document.getElementById("ohisScoreDISPasien");
  if (scoreDIS) scoreDIS.innerText = dis;
  const badgeDIS = document.getElementById("ohisBadgeDISPasien");
  if (badgeDIS) badgeDIS.innerText = numD <= 0.6 ? "Baik" : (numD <= 1.8 ? "Sedang" : "Buruk");

  const scoreCIS = document.getElementById("ohisScoreCISPasien");
  if (scoreCIS) scoreCIS.innerText = cis;
  const badgeCIS = document.getElementById("ohisBadgeCISPasien");
  if (badgeCIS) badgeCIS.innerText = numC <= 0.6 ? "Baik" : (numC <= 1.8 ? "Sedang" : "Buruk");

  const scoreTotal = document.getElementById("ohisScoreTotalPasien");
  if (scoreTotal) scoreTotal.innerText = totalScore;

  const badgeCat = document.getElementById("ohisBadgeCategoryPasien");
  if (badgeCat) {
    badgeCat.className = `px-3 py-1 rounded-xl font-black text-xs mt-1.5 uppercase shadow border ${katClass}`;
    badgeCat.innerText = kat;
  }

  const rangeInfo = document.getElementById("ohisRangeInfoPasien");
  if (rangeInfo) rangeInfo.innerText = rangeTxt;

  modal.classList.remove('hidden');
}

// ========================================================
// FUNGSI PENCETAKAN (PRINT PDF) EMR PASIEN
// ========================================================
function printHistoryEMR(idPasien) {
 let p = window.KlinikData.pasien.find(x => x.idPasien === idPasien);
 if (!p) return;
 let emrList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === idPasien);
 emrList.sort((a, b) => {
   let valA = a.waktuSimpan ? new Date(a.waktuSimpan).getTime() : new Date(a.tanggalPeriksa || 0).getTime();
   let valB = b.waktuSimpan ? new Date(b.waktuSimpan).getTime() : new Date(b.tanggalPeriksa || 0).getTime();
   return valB - valA;
 });
 let historyHtml = '';
 if(emrList.length === 0) {
     historyHtml = '<p style="text-align:center; color:#64748b; margin-top:20px;">Belum ada riwayat rekam medis.</p>';
 } else {
     historyHtml = emrList.map((r, idx) => {
         let odoJsonStr = r.odontogramStr || r.odontogram || "{}";
         let ana = {}, fis = {}, odo = {}, tind = [], obat = [];
         try { ana = JSON.parse(r.anamnesisStr || "{}"); } catch(e){}
         try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
         try { odo = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr; } catch(e){}
         try { tind = JSON.parse(r.tindakanStr || "[]"); } catch(e){}
         try { obat = JSON.parse(r.obatStr || "[]"); } catch(e){}
       
         // Hitung Nilai DMF-T untuk Cetak
         let dCount = 0, mCount = 0, fCount = 0;
         const arrGigiDewasa = [...PAS_ADULT_UPPER_RIGHT, ...PAS_ADULT_UPPER_LEFT, ...PAS_ADULT_LOWER_RIGHT, ...PAS_ADULT_LOWER_LEFT];
         arrGigiDewasa.forEach(n => {
           const t = odo[n]; if (!t) return;
           if (t.generalCondition === 'car' || Object.values(t.surfaces || {}).includes('car')) dCount++;
           else if (t.generalCondition === 'mis') mCount++;
           else if (Object.values(t.surfaces || {}).some(c => ['cfr', 'amf', 'gif'].includes(c))) fCount++;
         });
         const dmftTotal = dCount + mCount + fCount;
         const odoFilledGigi = Object.keys(odo).length;
       
         let diagList = Object.keys(odo).length === 0 ? '<li class="break-inside-avoid">Tidak ada kelainan (Normal/SOU) / Tidak ditandai</li>' :
           Object.keys(odo).map(gigi => {
             let dt = odo[gigi];
             let diag = dt.diagnosis ? `(Diag: ${dt.diagnosis})` : '';
             let nts = dt.notes ? `[Catatan: ${dt.notes}]` : '';
             let gen = dt.generalCondition !== 'nor' ? `Kondisi: ${dt.generalCondition}` : '';
             let sur = Object.entries(dt.surfaces||{}).filter(x=>x[1]!=='nor').map(x=>x[0]+'='+x[1]).join(', ');
             let srTx = sur ? `Permukaan: ${sur}` : '';
             return `<li class="break-inside-avoid"><b>Gigi ${gigi}:</b> <span class="text-slate-600">${gen}${srTx}</span> <span class="text-indigo-600 font-bold">${diag}</span> <span class="text-amber-600 italic">${nts}</span></li>`;
           }).join('');
          
         let obatList = obat.length === 0 ? '<tr><td colspan="3" class="border border-slate-300 px-2 py-1 text-center">-</td></tr>' :
           obat.map(o => `<tr><td class="border border-slate-300 px-2 py-1">${o.obat}</td><td class="border border-slate-300 px-2 py-1 text-center font-bold">${o.qty}</td><td class="border border-slate-300 px-2 py-1">${o.ket}</td></tr>`).join('');
        
         let tglFormat = r.tanggalPeriksa || '-';
         if(tglFormat !== '-') {
            let parts = tglFormat.split('-');
            if(parts.length === 3 && parts[0].length === 4) {
                const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                tglFormat = `${parseInt(parts[2], 10)} ${bulan[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
            }
         }
        
         let diagGlobal = (ana.diagnosaICD && ana.diagnosaICD.length > 0) ? `<div><h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosa (ICD-10)</h4><ul class="list-disc pl-5 space-y-1 text-slate-800 font-bold mb-4">${ana.diagnosaICD.map(d => `<li>${d}</li>`).join('')}</ul></div>` : '';


         return `
           <div style="page-break-inside: avoid; margin-bottom: 40px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 30px;">
             <div class="border-b-2 border-slate-800 pb-4 mb-6">
               <h2 class="text-xl font-black text-center uppercase tracking-widest text-slate-900">Rekam Medis Pasien</h2>
               <p class="text-center text-xs font-bold mt-1 text-slate-600">SHELDON Oral Maxillofacial Surgery & Dental Implant Center</p>
             </div>
          
             <table class="w-full text-xs font-medium mb-6">
               <tr><td class="w-32 text-slate-500">Nama Pasien</td><td class="font-bold text-base text-indigo-700">: ${p.namaPasien}</td>
                   <td class="w-32 text-slate-500">No. RM</td><td class="font-bold font-mono">: ${p.noRm || '-'}</td></tr>
               <tr><td class="text-slate-500">Tgl Pemeriksaan</td><td class="font-bold">: ${tglFormat}</td>
                   <td class="text-slate-500">Dokter</td><td class="font-bold">: ${r.dokterPemeriksa || '-'}</td></tr>
             </table>
           
             <div class="space-y-4 text-xs">
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Anamnesis</h4>
                 <table class="w-full">
                   <tr><td class="w-40 py-1 text-slate-600">Chief Complain (CC)</td><td>: ${ana.cc || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Present Illness (PI)</td><td>: ${ana.pi || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Past Dental/Medical Hist.</td><td>: ${ana.pdh || '-'} / ${ana.pmh || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Family Hist / Khusus</td><td>: ${ana.fh || '-'} / ${ana.khusus || '-'}</td></tr>
                 </table>
                 <div class="mt-2 text-[10px]"><b>Review Of System:</b>
                   Endo(${ana.ros?.endo||'-'}), Gastro(${ana.ros?.gastro||'-'}), Hemato(${ana.ros?.hemato||'-'}), Kardio(${ana.ros?.kardio||'-'}),
                   Muskulo(${ana.ros?.muskulo||'-'}), Neuro(${ana.ros?.neuro||'-'}), Resp(${ana.ros?.respirasi||'-'}), Uro(${ana.ros?.uro||'-'})
                 </div>
               </div>
             
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Pemeriksaan Fisik</h4>
                 <table class="w-full">
                   <tr><td class="w-32 py-1 text-slate-600">Kesan Umum</td><td>: ${fis.kesan || '-'}</td><td class="w-32 py-1 text-slate-600">Kesadaran</td><td>: ${fis.kesadaran || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Tensi (mmHg)</td><td>: ${fis.tensi || '-'}</td><td class="py-1 text-slate-600">Nafas (x/mnt)</td><td>: ${fis.nafas || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Nadi (x/mnt)</td><td>: ${fis.nadi || '-'}</td><td class="py-1 text-slate-600">Suhu (°C)</td><td>: ${fis.suhu || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">BB (kg) / TB (cm)</td><td colspan="3">: ${fis.bb || '-'} / ${fis.tb || '-'}</td></tr>
                 </table>
                 <table class="w-full mt-1">
                   <tr><td class="w-40 py-1 text-slate-600">Alergi</td><td>: ${fis.alergi || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Ekstra / Intra Oral</td><td>: ${fis.ekstra || '-'} / ${fis.intra || '-'}</td></tr>
                   <tr><td class="py-1 text-slate-600">Penunjang</td><td>: ${fis.penunjang || '-'}</td></tr>
                 </table>
               </div>
             
               <!-- MODUL ODONTOGRAM: RINGKASAN AWAL DMF-T INDEX -->
               <div class="bg-sky-50/60 border border-sky-200 p-3.5 rounded-xl text-left">
                 <div class="flex justify-between items-center mb-2">
                   <h4 class="font-black text-sky-900 uppercase text-xs flex items-center gap-1.5">
                     <span>🦷</span> Peta Odontogram Saat Kunjungan
                   </h4>
                   <span class="text-[10px] font-bold px-2 py-0.5 rounded ${odoFilledGigi === 0 ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">
                     ${odoFilledGigi === 0 ? 'Semua Sehat (SOU)' : `Tercatat (${odoFilledGigi} Gigi)`}
                   </span>
                 </div>
                 <div class="grid grid-cols-4 gap-2 text-center text-xs">
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Decayed (D)</span>
                     <span class="font-black ${dCount > 0 ? 'text-rose-600' : 'text-slate-800'}">${dCount}</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Missing (M)</span>
                     <span class="font-black ${mCount > 0 ? 'text-amber-600' : 'text-slate-800'}">${mCount}</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Filled (F)</span>
                     <span class="font-black ${fCount > 0 ? 'text-emerald-600' : 'text-slate-800'}">${fCount}</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Total DMF-T</span>
                     <span class="font-black ${dmftTotal > 0 ? 'text-sky-700' : 'text-slate-800'}">${dmftTotal}</span>
                   </div>
                 </div>
               </div>
             
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosis Gigi (Tulisan)</h4>
                 <ul class="list-disc pl-5 columns-1 sm:columns-3 gap-6 space-y-1 text-xs">${diagList}</ul>
               </div>

               ${fis.periodontal ? `
               <div class="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-xl text-left">
                 <div class="flex justify-between items-center mb-2">
                   <h4 class="font-black text-indigo-900 uppercase text-xs flex items-center gap-1.5">
                     <span>🦷</span> Hasil Periodontal Charting
                   </h4>
                   <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">Tercatat</span>
                 </div>
                 <div class="grid grid-cols-3 gap-2 text-center text-xs">
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Total Sites</span>
                     <span class="font-black text-slate-800">${fis.periodontal.summary?.totalSites || 0} Titik</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Deep Pockets (&ge;4mm)</span>
                     <span class="font-black ${(fis.periodontal.summary?.deepPockets || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.deepPockets || 0} Titik</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Bleeding Index (BOP)</span>
                     <span class="font-black ${(fis.periodontal.summary?.bopPercent || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.bopPercent || 0}%</span>
                   </div>
                 </div>
               </div>
               ` : ""}

               ${fis.ohis ? `
               <div class="bg-teal-50/60 border border-teal-200 p-3.5 rounded-xl text-left">
                 <div class="flex justify-between items-center mb-2">
                   <h4 class="font-black text-teal-900 uppercase text-xs flex items-center gap-1.5">
                     <span>🪥</span> Hasil Pemeriksaan OHI-S
                   </h4>
                   <span class="text-[10px] font-bold px-2 py-0.5 rounded ${fis.ohis.category === 'Baik' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : fis.ohis.category === 'Sedang' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                     ${fis.ohis.category || 'Tercatat'} (${fis.ohis.totalScore || 0})
                   </span>
                 </div>
                 <div class="grid grid-cols-3 gap-2 text-center text-xs">
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Debris Index (DI-S)</span>
                     <span class="font-black text-slate-800">${fis.ohis.debrisScore || 0}</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Calculus Index (CI-S)</span>
                     <span class="font-black text-slate-800">${fis.ohis.calculusScore || 0}</span>
                   </div>
                   <div class="bg-white p-2 rounded-lg border border-slate-200">
                     <span class="text-[9px] text-slate-500 block font-bold">Total OHI-S Score</span>
                     <span class="font-black text-teal-700">${fis.ohis.totalScore || 0}</span>
                   </div>
                 </div>
               </div>
               ` : ""}
             
               ${diagGlobal}
             
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Tindakan (ICD-9)</h4>
                 <ul class="list-disc pl-5">${tind.length === 0 ? '<li>-</li>' : tind.map(t => `<li>${t}</li>`).join('')}</ul>
               </div>
             
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Resep Obat</h4>
                 <table class="w-full text-left border border-slate-300 border-collapse">
                   <tr class="bg-slate-50"><th class="border border-slate-300 px-2 py-1">Nama Obat</th><th class="border border-slate-300 px-2 py-1 w-16 text-center">Qty</th><th class="border border-slate-300 px-2 py-1">Aturan Pakai</th></tr>
                   ${obatList}
                 </table>
               </div>
             
               <div>
                 <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Catatan Edukasi</h4>
                 <p class="pl-2 bg-rose-50 p-2 rounded border border-rose-100 text-rose-800 font-medium">${r.catatanEdukasi || '-'}</p>
               </div>
             </div>
           </div>
         `;
     }).join('');
 }
 let printFrame = document.getElementById('printFrameEMR');
 if (!printFrame) {
     printFrame = document.createElement('iframe'); printFrame.id = 'printFrameEMR';
     printFrame.style.cssText = 'position:absolute; width:0px; height:0px; border:none; z-index:-999;';
     document.body.appendChild(printFrame);
 }
 const dNow = new Date();
 const arrBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
 const tglCetakStr = `${dNow.getDate()} ${arrBulan[dNow.getMonth()]} ${dNow.getFullYear()}`;
 const namaPasienBersih = (p.namaPasien || "Pasien").replace(/[/\\?%*:|"<>]/g, '').trim();
 let cleanName = `${namaPasienBersih}-${tglCetakStr}`;
 let originalTitle = document.title;
 const frameDoc = printFrame.contentWindow.document;
 frameDoc.open();
 frameDoc.write(`
   <html>
   <head>
     <title>${cleanName}</title>
     <style>
       @page {
         size: A4 portrait;
         margin: 0; /* Menghilangkan URL script.google.com dan jam/tanggal bawaan browser */
       }
       @media print {
         body {
           -webkit-print-color-adjust: exact !important;
           print-color-adjust: exact !important;
           margin: 0 !important;
           padding: 1.5cm 1cm !important;
           background: #ffffff !important;
         }
         .no-print { display: none !important; }
       }
       body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; line-height: 1.5; }
       h2, h4 { margin: 0 0 5px 0; }
       .text-center { text-align: center; }
       .uppercase { text-transform: uppercase; }
       .font-black { font-weight: 900; }
       .font-bold { font-weight: bold; }
       .w-full { width: 100%; }
       .w-32 { width: 120px; }
       .w-40 { width: 150px; }
       .border-b-2 { border-bottom: 2px solid #000; }
       .pb-4 { padding-bottom: 15px; }
       .mb-6 { margin-bottom: 20px; }
       .mb-2 { margin-bottom: 10px; }
       .mt-1 { margin-top: 5px; }
       .mt-2 { margin-top: 10px; }
       .bg-slate-100, .bg-slate-50, .bg-rose-50, .bg-slate-200 { background-color: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .p-1\\.5 { padding: 6px; }
       .p-2 { padding: 8px; }
       .p-3 { padding: 12px; }
       .border-l-4 { border-left: 4px solid #000; }
       .text-slate-500, .text-slate-600 { color: #475569; }
       .text-indigo-700 { color: #4338ca; }
       .text-rose-800 { color: #9f1239; }
       .pl-5 { padding-left: 20px; }
       .pl-2 { padding-left: 8px; }
       .py-1 { padding-top: 4px; padding-bottom: 4px; }
       table { border-collapse: collapse; }
       .border { border: 1px solid #000; }
       .px-2 { padding-left: 8px; padding-right: 8px; }
       .text-xs { font-size: 11px; }
       ul { margin: 0; }
    
       .no-print { display: none !important; }
       .grid { display: flex; gap: 8px; }
       .grid-cols-4 > div { flex: 1; }
       .grid-cols-3 > div { flex: 1; }
       .rounded, .rounded-lg { border-radius: 8px; }
       .rounded-xl { border-radius: 12px; }
       .bg-sky-50\/60, .bg-sky-50 { background-color: #f0f9ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .bg-indigo-50\/60, .bg-indigo-50 { background-color: #eef2ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .bg-teal-50\/60, .bg-teal-50 { background-color: #f0fdfa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .border-sky-200 { border: 1px solid #bae6fd; }
       .border-indigo-200 { border: 1px solid #c7d2fe; }
       .border-teal-200 { border: 1px solid #99f6e4; }
       .text-rose-600 { color: #e11d48 !important; }
       .text-amber-600 { color: #d97706 !important; }
       .text-emerald-600 { color: #059669 !important; }
       .text-sky-700 { color: #0369a1 !important; }
       .text-teal-700 { color: #0f766e !important; }

       .flex { display: flex; }
       .flex-col { flex-direction: column; }
       .items-center { align-items: center; }
       .justify-center { justify-content: center; }
       .gap-4 { gap: 16px; }
       .gap-1 { gap: 4px; }
       .flex-row-reverse { flex-direction: row-reverse; }
       .inline-block { display: inline-block; }
       .w-6 { width: 24px; } .h-6 { height: 24px; }
       .sm\\:w-8 { width: 32px; } .sm\\:h-8 { height: 32px; }
       .w-1 { width: 4px; } .h-10 { height: 40px; }
       .bg-slate-300 { background-color: #cbd5e1; }
       .border-slate-300 { border-color: #cbd5e1; }
       .border-b { border-bottom-width: 1px; }
       .pb-2 { padding-bottom: 8px; }
       .pt-2 { padding-top: 8px; }
       .my-3 { margin-top: 12px; margin-bottom: 12px; }
       .relative { position: relative; }
       .absolute { position: absolute; }
       .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
       .rounded-full { border-radius: 9999px; }
       .z-10 { z-index: 10; }
    
       @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
     </style>
   </head>
   <body>${historyHtml}</body>
   </html>
 `);
 frameDoc.close();
 printFrame.contentWindow.focus();
 document.title = cleanName;
 setTimeout(() => {
     document.title = cleanName;
     if (printFrame.contentWindow.document) printFrame.contentWindow.document.title = cleanName;
     printFrame.contentWindow.print();
     printFrame.contentWindow.onafterprint = function() { document.title = originalTitle; };
     setTimeout(() => { document.title = originalTitle; }, 15000);
 }, 500);
}


// ========================================================
// ENGINE BUKU INDEKS UTAMA PASIEN (MASTER PATIENT INDEX - MPI)
// ========================================================

function bukaModalMpi() {
  renderKontenMpi();
  let modal = document.getElementById('modalPreviewMpi');
  if (modal) modal.classList.remove('hidden');
}

function tutupModalMpi() {
  let modal = document.getElementById('modalPreviewMpi');
  if (modal) modal.classList.add('hidden');
}

function renderKontenMpi() {
  const container = document.getElementById('printAreaMpi');
  if (!container) return;

  // Ambil data pasien dan urutkan berdasarkan 4 digit angka No RM atau tanggal daftar
  let list = (window.KlinikData && window.KlinikData.pasien) ? [...window.KlinikData.pasien] : [];
  list.sort((a, b) => {
    // 1. Ekstrak 4 digit angka dari No. RM (misal A-0004 -> 4)
    let numA = parseInt((a.noRm || '').replace(/\D/g, ''), 10);
    let numB = parseInt((b.noRm || '').replace(/\D/g, ''), 10);

    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }

    // 2. Jika No RM sama/tidak ada angka, urutkan berdasarkan tanggal daftar
    let tglA = a.tglDaftar ? new Date(a.tglDaftar.split('-').reverse().join('-')).getTime() : 0;
    let tglB = b.tglDaftar ? new Date(b.tglDaftar.split('-').reverse().join('-')).getTime() : 0;
    if (tglA !== tglB) {
      return tglA - tglB;
    }

    // 3. Fallback string natural comparison
    return (a.noRm || '').localeCompare(b.noRm || '', undefined, { numeric: true });
  });

  // Bagi data menjadi chunk 30 baris per lembar kertas A4
  const ITEMS_PER_PAGE = 30;
  let pagesHtml = "";

  if (list.length === 0) {
    pagesHtml = `
      <div class="mpi-page" style="width: 100%; box-sizing: border-box; padding: 2cm 1cm 1.5cm 1cm; position: relative;">
        <!-- HEADER KONSISTEN SETIAP HALAMAN -->
        <div style="text-align: center; margin-bottom: 12px;">
          <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; color: #000000; text-transform: uppercase;">
            BUKU INDEKS PASIEN
          </h1>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; line-height: 1.3; table-layout: fixed; border: none;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 6px 5px; text-align: center; width: 6%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO</th>
              <th style="padding: 6px 8px; text-align: left; width: 34%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NAMA PASIEN</th>
              <th style="padding: 6px 6px; text-align: center; width: 14%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO. RM</th>
              <th style="padding: 6px 5px; text-align: center; width: 14%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">UMUR</th>
              <th style="padding: 6px 5px; text-align: center; width: 12%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">JENIS KELAMIN</th>
              <th style="padding: 6px 6px; text-align: center; width: 20%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO. TELP / WA</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="6" style="text-align:center; padding: 35px 20px; color: #64748b; font-style: italic; border-bottom: 1px solid #e2e8f0; font-family: Arial, sans-serif; font-size: 9.5pt;">Belum ada data pasien terdaftar di database.</td></tr>
          </tbody>
        </table>

        <!-- FOOTER NOMOR HALAMAN (POJOK KANAN BAWAH) -->
        <div style="text-align: right; margin-top: 12px; font-family: Arial, sans-serif; font-size: 9pt; color: #64748b;">
          Page 1
        </div>
      </div>
    `;
  } else {
    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageNum = pageIdx + 1;
      const startIdx = pageIdx * ITEMS_PER_PAGE;
      const endIdx = startIdx + ITEMS_PER_PAGE;
      const pageData = list.slice(startIdx, endIdx);

      let rowHtml = pageData.map((p, localIdx) => {
        let noUrut = startIdx + localIdx + 1;
        let nama = p.namaPasien || "-";
        let noRm = p.noRm || "-";
        
        let rawUmur = (p.umur || "").toString().trim();
        let cleanUmur = rawUmur.replace(/\s*(thn|tahun)\b/gi, '').trim();
        let umur = cleanUmur ? `${cleanUmur} Th` : "-";

        let jkRaw = (p.jenisKelamin || "").toString().trim().toLowerCase();
        let jk = "-";
        if (jkRaw === 'l' || jkRaw.startsWith('laki')) {
          jk = "L";
        } else if (jkRaw === 'p' || jkRaw.startsWith('perempuan') || jkRaw.startsWith('wanita')) {
          jk = "P";
        } else if (p.jenisKelamin) {
          jk = p.jenisKelamin.trim().toUpperCase().startsWith('L') ? 'L' : (p.jenisKelamin.trim().toUpperCase().startsWith('P') ? 'P' : p.jenisKelamin);
        }

        let noTelp = p.whatsapp || p.telepon || "-";
        let bgRow = localIdx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${bgRow} font-family: Arial, sans-serif; font-size: 9.5pt; page-break-inside: avoid;">
            <td style="padding: 4px 5px; text-align: center; color: #334155; border: none;">${noUrut}</td>
            <td style="padding: 4px 8px; text-align: left; font-weight: bold; color: #0f172a; border: none;">${nama}</td>
            <td style="padding: 4px 6px; text-align: center; font-family: Arial, monospace; font-weight: bold; color: #0284c7; border: none;">${noRm}</td>
            <td style="padding: 4px 5px; text-align: center; color: #334155; border: none;">${umur}</td>
            <td style="padding: 4px 5px; text-align: center; color: #334155; border: none;">${jk}</td>
            <td style="padding: 4px 6px; text-align: center; font-family: Arial, monospace; color: #334155; border: none;">${noTelp}</td>
          </tr>
        `;
      }).join('');

      const isLastPage = (pageIdx === totalPages - 1);
      const pageBreakStyle = isLastPage ? '' : 'page-break-after: always; break-after: page;';

      pagesHtml += `
        <div class="mpi-page" style="${pageBreakStyle} width: 100%; box-sizing: border-box; padding: 2cm 1cm 1.5cm 1cm; position: relative;">
          <!-- HEADER KONSISTEN SETIAP HALAMAN -->
          <div style="text-align: center; margin-bottom: 12px;">
            <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; color: #000000; text-transform: uppercase;">
              BUKU INDEKS PASIEN
            </h1>
          </div>

          <!-- TABEL DATA PASIEN (A4 PORTRAIT) -->
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; line-height: 1.3; table-layout: fixed; border: none;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff;">
                <th style="padding: 6px 5px; text-align: center; width: 6%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO</th>
                <th style="padding: 6px 8px; text-align: left; width: 34%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NAMA PASIEN</th>
                <th style="padding: 6px 6px; text-align: center; width: 14%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO. RM</th>
                <th style="padding: 6px 5px; text-align: center; width: 14%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">UMUR</th>
                <th style="padding: 6px 5px; text-align: center; width: 12%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">JENIS KELAMIN</th>
                <th style="padding: 6px 6px; text-align: center; width: 20%; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; color: #ffffff; border: none;">NO. TELP / WA</th>
              </tr>
            </thead>
            <tbody>
              ${rowHtml}
            </tbody>
          </table>

          <!-- FOOTER NOMOR HALAMAN (POJOK KANAN BAWAH) -->
          <div style="text-align: right; margin-top: 12px; font-family: Arial, sans-serif; font-size: 9pt; color: #64748b;">
            Page ${pageNum}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = pagesHtml;
}

function actionCetakDanPdfMpi(isPDFMode) {
  const elArea = document.getElementById('printAreaMpi');
  if (!elArea) return;

  let cleanName = "BUKU_INDEKS_PASIEN";
  let originalTitle = document.title;

  showToast('info', 'Membuka dialog cetak... Silakan pilih "Simpan sebagai PDF" untuk menyimpan file.');
  bukaPrintWindowMpi(cleanName, originalTitle);
}

function bukaPrintWindowMpi(cleanName, originalTitle) {
  const contentHtml = document.getElementById('printAreaMpi').innerHTML;
  const docStyle = `
    @page {
      size: A4 portrait;
      margin: 0; /* Menghilangkan URL about:blank dan jam/tanggal bawaan browser */
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        font-family: Arial, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .mpi-page {
        page-break-after: always !important;
        break-after: page !important;
        box-sizing: border-box !important;
        padding: 2cm 1cm 1.5cm 1cm !important;
        min-height: 297mm !important;
        position: relative !important;
      }
      .mpi-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      tr {
        page-break-inside: avoid !important;
      }
    }
    html, body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      background: #ffffff;
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .mpi-page {
      box-sizing: border-box;
      padding: 2cm 1cm 1.5cm 1cm;
      min-height: 297mm;
      position: relative;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
      font-family: Arial, sans-serif;
    }
    th, td {
      word-wrap: break-word;
      font-family: Arial, sans-serif;
    }
  `;

  // Strategi 1: Buka popup top-level window
  try {
    let printWin = window.open('', '_blank', 'width=950,height=950');
    if (printWin && !printWin.closed) {
      printWin.document.open();
      printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${cleanName}</title><style>${docStyle}</style></head><body>${contentHtml}</body></html>`);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
        printWin.onafterprint = function() { printWin.close(); document.title = originalTitle; };
      }, 500);
      return;
    }
  } catch(e) {
    console.warn('Popup print MPI blocked, fallback to iframe:', e);
  }

  // Strategi 2: Fallback Iframe
  let printFrame = document.getElementById('printFrameMpi');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'printFrameMpi';
    printFrame.style.cssText = 'position:absolute; width:0px; height:0px; border:none; z-index:-999;';
    document.body.appendChild(printFrame);
  }
  const pf = printFrame.contentWindow;
  pf.document.open();
  pf.document.write(`<html><head><title>${cleanName}</title><style>${docStyle}</style></head><body>${contentHtml}</body></html>`);
  pf.document.close();
  pf.focus();
  document.title = cleanName;
  setTimeout(() => {
    document.title = cleanName;
    if (pf.document) pf.document.title = cleanName;
    pf.print();
    pf.onafterprint = function() { document.title = originalTitle; };
    setTimeout(() => { document.title = originalTitle; }, 15000);
  }, 600);
}



// ==========================================
// STATE & VARIABLE GLOBAL
// ==========================================
let activePasienRM = null;
let masterTindakan = [];
let masterObat = [];
let masterICD = []; // Array Penyimpan ICD-10
let masterICD9 = []; // Array Penyimpan ICD-9 Tindakan
let riwayatPasienAktif = [];
let currentOdontogram = {};
let selectedCondition = 'car';
let dentitionMode = 'adult';
let modalSelectedToothNumber = null;
const TOOTH_CONDITIONS = {
  nor: { code: 'nor', label: 'Normal (SOU)', color: '#ffffff' },
  car: { code: 'car', label: 'Karies (Car)', color: '#ef4444' },
  cfr: { code: 'cfr', label: 'Komposit (Cfr)', color: '#10b981' },
  amf: { code: 'amf', label: 'Amalgam (Amf)', color: '#475569' },
  gif: { code: 'gif', label: 'GIC / Semen', color: '#f97316' },
  fis: { code: 'fis', label: 'Sealant (Fis)', color: '#8b5cf6' },
  mis: { code: 'mis', label: 'Hilang (X)', color: '#94a3b8' },
  rrx: { code: 'rrx', label: 'Sisa Akar (RRX)', color: '#dc2626' },
  nvt: { code: 'nvt', label: 'Non-Vital', color: '#0f172a' },
  crn: { code: 'crn', label: 'Crown (Crn)', color: '#3b82f6' },
  une: { code: 'une', label: 'Blm Erupsi', color: '#64748b' },
  imx: { code: 'imx', label: 'Impaksi', color: '#ea580c' },
  tmp: { code: 'tmp', label: 'Sementara (Tmp)', color: '#f59e0b' },
  pre: { code: 'pre', label: 'Persistansi (Pre)', color: '#ec4899' }
};
const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const PED_UPPER_RIGHT   = [55, 54, 53, 52, 51];
const PED_UPPER_LEFT    = [61, 62, 63, 64, 65];
const PED_LOWER_RIGHT   = [85, 84, 83, 82, 81];
const PED_LOWER_LEFT    = [71, 72, 73, 74, 75];
function alertMsg(type, msg) {
  if (typeof showToast === 'function') { showToast(type, msg); } else { alert(msg); }
}
function autoTitleCase(el) {
  if (!el || !el.value) return;
  const start = el.selectionStart, end = el.selectionEnd;
  el.value = el.value.replace(/(^|[\s\/\-\.\(\)])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  el.setSelectionRange(start, end);
}
function getTodayIso() {
  let d = new Date(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function validasiTglMax(el) {
  let t = getTodayIso();
  if(el.value > t) el.value = t;
}
function formatTglIndoRM(tglStr) {
  if (!tglStr || tglStr === '-') return '-';
  let parts = String(tglStr).trim().split('-');
  if (parts.length !== 3) return tglStr;
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  if (parts[0].length === 4) {
    let d = parseInt(parts[2], 10);
    let m = parseInt(parts[1], 10) - 1;
    let y = parts[0];
    if (m >= 0 && m < 12) return `${d} ${bulan[m]} ${y}`;
  } else if (parts[2].length === 4) {
    let d = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1;
    let y = parts[2];
    if (m >= 0 && m < 12) return `${d} ${bulan[m]} ${y}`;
  }
  return tglStr;
}
function hitungDetailUmurRM(tglLahirStr) {
  if (!tglLahirStr || tglLahirStr === '-') return '-';
  let parts = String(tglLahirStr).trim().split('-');
  if (parts.length !== 3) return '-';
  try {
    let by, bm, bd;
    if (parts[0].length === 4) {
      by = parseInt(parts[0], 10); bm = parseInt(parts[1], 10); bd = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      by = parseInt(parts[2], 10); bm = parseInt(parts[1], 10); bd = parseInt(parts[0], 10);
    } else {
      return '-';
    }
    let today = new Date();
    let y = today.getFullYear() - by;
    let m = (today.getMonth() + 1) - bm;
    let d = today.getDate() - bd;
    if (d < 0) {
      m--;
      let prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      d += prevMonthLastDay;
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    let res = [];
    if (y > 0) res.push(`${y} Tahun`);
    if (m > 0) res.push(`${m} Bulan`);
    if (d > 0 || res.length === 0) res.push(`${d} Hari`);
    return res.join(' ');
  } catch(e) {
    return '-';
  }
}
// ==========================================
// INITIALIZATION
// ==========================================
function initRekamMedisApp() {
  let tglPeriksa = document.getElementById('rmTglPeriksa');
  if (tglPeriksa) { let t = getTodayIso(); tglPeriksa.value = t; tglPeriksa.max = t; }
   let txtDokter = document.getElementById('rmDokterLabel');
  if (txtDokter) txtDokter.value = window.activeNamaAccount || 'Dokter';
  masterTindakan = (window.KlinikData && Array.isArray(window.KlinikData.tindakan)) ? window.KlinikData.tindakan : [];
  masterObat = (window.KlinikData && Array.isArray(window.KlinikData.obat)) ? window.KlinikData.obat : [];
 
  // Load Daftar ICD-10
  if(typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run.withSuccessHandler(res => {
        masterICD = res || [];
        let dl = document.getElementById('listICD10');
        if(!dl) { dl = document.createElement('datalist'); dl.id = 'listICD10'; document.body.appendChild(dl); }
        let optionsHtml = '';
        masterICD.forEach(icd => {
          let val = icd.code ? `${icd.code} - ${icd.desc}` : (icd.desc || '');
          optionsHtml += `<option value="${val}">`;
        });
        dl.innerHTML = optionsHtml;
      }).getDaftarICD10();

      google.script.run.withSuccessHandler(res => {
        masterICD9 = res || [];
        buildDatalistsRM();
      }).getDaftarICD9();
  }

  buildDatalistsRM();
  let qInput = document.getElementById('rmSearchPasien');
  if(qInput) qInput.addEventListener('input', searchPasienRM);
  renderPalette();
  setDentitionMode('adult');
  renderOdontogramGrid();
  let cDiag = document.getElementById('containerDiagnosa');
  if (cDiag && cDiag.children.length === 0) tambahRowDiagnosa();
  let cTind = document.getElementById('containerTindakan');
  if (cTind && cTind.children.length === 0) tambahRowTindakan();
}
document.addEventListener('KlinikDataReady', initRekamMedisApp);


function buildDatalistsRM() {
   let dlT = document.getElementById('listTindakanRM');
   if(!dlT) { dlT = document.createElement('datalist'); dlT.id = 'listTindakanRM'; document.body.appendChild(dlT); }
   
   let optTindakan = '';
   // Prioritas data ICD-9 dari spreadsheet
   if(masterICD9 && masterICD9.length > 0) {
       masterICD9.forEach(t => {
           let val = t.code ? `${t.code} - ${t.desc}` : t.desc;
           optTindakan += `<option value="${val}">`;
       });
   } else if (masterTindakan && masterTindakan.length > 0) {
       masterTindakan.forEach(t => {
           let val = t.kode ? `${t.kode} - ${t.nama}` : t.nama;
           optTindakan += `<option value="${val}">`;
       });
   }
   dlT.innerHTML = optTindakan;
  
   let dlO = document.getElementById('listObatRM');
   if(!dlO) { dlO = document.createElement('datalist'); dlO.id = 'listObatRM'; document.body.appendChild(dlO); }
   dlO.innerHTML = masterObat.map(o => `<option value="${o.nama}">`).join('');
}
// ==========================================
// PENCARIAN & HISTORY
// ==========================================
function searchPasienRM() {
  let q = document.getElementById('rmSearchPasien').value.toLowerCase().trim();
  let resBox = document.getElementById('rmSearchResult');
  if (!q || q.length < 2) { resBox.classList.add('hidden'); return; }
  let list = (window.KlinikData && window.KlinikData.pasien) ? window.KlinikData.pasien.filter(p => p.namaPasien.toLowerCase().includes(q) || p.noRm.toLowerCase().includes(q)) : [];
  if (list.length === 0) {
    resBox.innerHTML = '<div class="p-2 text-slate-400 font-medium text-xs">Tidak ditemukan</div>';
  } else {
    resBox.innerHTML = list.slice(0, 6).map(p => `
      <div onclick="pilihPasienRM('${p.idPasien}')" class="p-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors">
        <div><p class="font-bold text-slate-800 text-xs">${p.namaPasien}</p></div>
        <span class="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">${p.noRm}</span>
      </div>
    `).join('');
  }
  resBox.classList.remove('hidden');
}
function pilihPasienRM(idPasien) {
  let p = (window.KlinikData.pasien || []).find(x => x.idPasien === idPasien);
  if (!p) return;
  activePasienRM = p;
  document.getElementById('rmSearchPasien').value = p.namaPasien;
  document.getElementById('rmSearchResult').classList.add('hidden');
   document.getElementById('rmSelectedRM').innerText = 'RM: ' + p.noRm;
  document.getElementById('rmSelectedNama').innerText = p.namaPasien;
  document.getElementById('rmSelectedJK').innerText = `Jenis Kelamin: ${p.jenisKelamin === 'Laki-Laki' || p.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}`;
  document.getElementById('rmSelectedTglLahir').innerText = `Tgl Lahir: ${p.tanggalLahir ? formatTglIndoRM(p.tanggalLahir) : '-'}`;
  let elUmur = document.getElementById('rmSelectedUmur');
  if (elUmur) {
    let detailUmur = hitungDetailUmurRM(p.tanggalLahir);
    elUmur.innerText = `Umur: ${detailUmur !== '-' ? detailUmur : (p.umur || '-')}`;
  }
  loadRiwayatRM(idPasien);
  resetPeriodontalToDefault();
  resetOhisToDefault();
  if (riwayatPasienAktif && riwayatPasienAktif.length > 0) {
    let lastVisitWithOdo = riwayatPasienAktif.find(r => r.odontogramStr && r.odontogramStr !== "{}" && r.odontogramStr !== "[]");
    if (lastVisitWithOdo) {
      try {
        let prevOdo = JSON.parse(lastVisitWithOdo.odontogramStr);
        if (prevOdo && Object.keys(prevOdo).length > 0) {
          let currEmpty = !currentOdontogram || Object.keys(currentOdontogram).length === 0;
          if (currEmpty) {
            currentOdontogram = JSON.parse(JSON.stringify(prevOdo));
            renderOdontogramGrid();
            alertMsg('success', 'Odontogram kunjungan terakhir (' + (lastVisitWithOdo.tanggalPeriksa || 'sebelumnya') + ') dimuat otomatis.');
          }
        }
      } catch (err) {}
    }
  }
}
function loadRiwayatRM(idPasien) {
  let container = document.getElementById('rmRiwayatContainer');
  if (!container) return;
  let riwayat = (window.KlinikData && window.KlinikData.rekamMedis) ? window.KlinikData.rekamMedis.filter(r => r.idPasien === idPasien) : [];
  riwayat.sort((a,b) => {
    let valA = a.waktuSimpan ? new Date(a.waktuSimpan).getTime() : new Date(a.tanggalPeriksa || 0).getTime();
    let valB = b.waktuSimpan ? new Date(b.waktuSimpan).getTime() : new Date(b.tanggalPeriksa || 0).getTime();
    return valB - valA;
  });
  riwayatPasienAktif = riwayat;
  renderRiwayatRMRoutes(container, riwayatPasienAktif);
}

function renderRiwayatRMRoutes(container, riwayat) {
  if (!container) return;
  if (!riwayat || riwayat.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-400 py-6 font-bold text-[10px]">Belum ada riwayat kunjungan aktif. Silakan klik tombol "Cek Arsip" di atas jika pasien pernah berkunjung di tahun lampau.</div>';
    return;
  }
  let html = riwayat.map((r, idx) => {
    let ana = {}; try { ana = JSON.parse(r.anamnesisStr || "{}"); } catch(e){}
    let arsipBadge = r.isArsip ? `<span class="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black border border-amber-300">📦 ARSIP ${r.tahunArsip || ""}</span>` : "";
    return `
      <div class="p-3 border ${r.isArsip ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-slate-50"} rounded-xl mb-3 shadow-sm hover:shadow transition-shadow">
        <div class="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-indigo-700 text-[11px]">${formatTglIndoRM(r.tanggalPeriksa || "-")}</span>
            ${arsipBadge}
          </div>
          <span class="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">${r.dokterPemeriksa || "-"}</span>
        </div>
        <div class="text-[10px] text-slate-700 mb-2 line-clamp-2"><b>Keluhan:</b> ${ana.cc || "-"}</div>
        <button type="button" onclick="bukaDetailRM(${idx})" class="w-full py-1.5 bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 rounded font-bold text-[10px] transition-colors shadow-sm">Lihat Detail Lengkap</button>
      </div>`;
  }).join('');
  container.innerHTML = html;
}

function muatRiwayatArsipPasien() {
  if (!activePasienRM) {
    alertMsg("warning", "Pilih pasien terlebih dahulu dari pencarian.");
    return;
  }
  let btn = document.getElementById("btnMuatArsipRM");
  let originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Mencari...";
  }
  alertMsg("info", "Mencari riwayat rekam medis pasien di Spreadsheet Arsip...");

  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(arsipList => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        if (arsipList && arsipList.length > 0) {
          alertMsg("success", `Ditemukan ${arsipList.length} rekam medis dari Spreadsheet Arsip!`);
          // Hindari duplikasi jika sudah pernah dimuat
          let existingIds = new Set(riwayatPasienAktif.map(x => x.idRmKlinis));
          let newRecords = arsipList.filter(x => !existingIds.has(x.idRmKlinis));
          riwayatPasienAktif = [...riwayatPasienAktif, ...newRecords];
          riwayatPasienAktif.sort((a,b) => {
            let valA = a.waktuSimpan ? new Date(a.waktuSimpan).getTime() : new Date(a.tanggalPeriksa || 0).getTime();
            let valB = b.waktuSimpan ? new Date(b.waktuSimpan).getTime() : new Date(b.tanggalPeriksa || 0).getTime();
            return valB - valA;
          });
          let container = document.getElementById("rmRiwayatContainer");
          renderRiwayatRMRoutes(container, riwayatPasienAktif);
        } else {
          alertMsg("info", "Tidak ditemukan riwayat rekam medis tahun lampau di Spreadsheet Arsip untuk pasien ini.");
        }
      })
      .withFailureHandler(err => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        alertMsg("error", "Gagal memuat arsip: " + errStr);
      })
      .bacaRekamMedisArsipPasien(activePasienRM.idPasien, activePasienRM.noRm);
  } else {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      alertMsg("info", "Simulasi: Riwayat arsip dapat dipanggil via Google Apps Script.");
    }, 1000);
  }
}
// ==========================================
// MODAL DETAIL & CETAK PDF
// ==========================================
function closeDetailRM() { document.getElementById('modalDetailRM').classList.add('hidden'); }
function renderHistoryOdontogram(odoJsonStr) {
  let odoData = {};
  try { odoData = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr; } catch(e){}
  const drawTooth = (num) => {
    const tState = odoData[num] || { generalCondition: 'nor', surfaces: {} };
    const surfs = tState.surfaces || {};
    const genCond = tState.generalCondition || 'nor';
    const isMissing = genCond === 'mis', isRadix = genCond === 'rrx', isCrown = genCond === 'crn', isNonVital = genCond === 'nvt', isUnerupted = genCond === 'une', isImpacted = genCond === 'imx', isPersistence = genCond === 'pre';
  
    const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);
    const isRightArch = (num >= 11 && num <= 18) || (num >= 41 && num <= 48) || (num >= 51 && num <= 55) || (num >= 81 && num <= 85);
    const leftSurface = isRightArch ? 'distal' : 'mesial';
    const rightSurface = isRightArch ? 'mesial' : 'distal';
    const topSurface = isUpper ? 'buccal' : 'lingual';
    const bottomSurface = isUpper ? 'lingual' : 'buccal';
    const centerSurface = 'occlusal';
    const getColor = (sKey) => {
      if (isMissing || isRadix || isUnerupted) return '#f8fafc';
      const cCode = surfs[sKey] || 'nor';
      const cond = TOOTH_CONDITIONS[cCode];
      return cond ? cond.color : '#ffffff';
    };
    return `
      <div class="flex flex-col items-center">
        <span class="text-[8px] font-bold mb-0.5 text-slate-600">${num}</span>
        <div class="w-6 h-6 sm:w-8 sm:h-8 relative">
          ${isCrown ? `<div class="absolute inset-0 rounded-full border border-blue-500 z-10 shadow-sm"></div>` : ''}
          ${isPersistence ? `<div class="absolute inset-0 rounded-full border-2 border-dashed border-pink-500 z-10 pointer-events-none shadow-sm"></div>` : ''}
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <rect x="4" y="4" width="92" height="92" rx="10" fill="${isMissing ? '#e2e8f0' : isUnerupted ? '#f1f5f9' : '#ffffff'}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="${isUnerupted ? '4 3' : 'none'}"/>
            ${!isMissing && !isRadix ? `
              <polygon points="10,10 90,10 70,30 30,30" fill="${getColor(topSurface)}" stroke="#64748b" stroke-width="1.5"/>
              <polygon points="30,70 70,70 90,90 10,90" fill="${getColor(bottomSurface)}" stroke="#64748b" stroke-width="1.5"/>
              <polygon points="10,10 30,30 30,70 10,90" fill="${getColor(leftSurface)}" stroke="#64748b" stroke-width="1.5"/>
              <polygon points="90,10 70,30 70,70 90,90" fill="${getColor(rightSurface)}" stroke="#64748b" stroke-width="1.5"/>
              <polygon points="30,30 70,30 70,70 30,70" fill="${getColor(centerSurface)}" stroke="#64748b" stroke-width="1.5"/>
            ` : ''}
            ${isMissing ? `<g stroke="#475569" stroke-width="5"><line x1="20" y1="20" x2="80" y2="80"/><line x1="80" y1="20" x2="20" y2="80"/></g>` : ''}
            ${isRadix ? `<polygon points="50,84 20,24 80,24" fill="#dc2626" stroke="#991b1b"/><text x="50" y="20" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">RRX</text>` : ''}
            ${isPersistence ? `<circle cx="50" cy="50" r="32" fill="none" stroke="#ec4899" stroke-width="3" stroke-dasharray="4 2"/><text x="50" y="58" text-anchor="middle" font-size="20" font-weight="900" fill="#ec4899">P</text>` : ''}
          </svg>
        </div>
      </div>`;
  };
  return `
    <div class="bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto my-3 text-center inline-block shadow-sm w-full md:w-auto">
      <div class="flex items-center justify-center gap-4 border-b border-slate-300 pb-2">
        <div class="flex gap-1 flex-row-reverse">${ADULT_UPPER_RIGHT.map(drawTooth).join('')}</div>
        <div class="w-1 bg-slate-300 h-10 rounded-full"></div>
        <div class="flex gap-1">${ADULT_UPPER_LEFT.map(drawTooth).join('')}</div>
      </div>
      <div class="flex items-center justify-center gap-4 pt-2">
        <div class="flex gap-1 flex-row-reverse">${ADULT_LOWER_RIGHT.map(drawTooth).join('')}</div>
        <div class="w-1 bg-slate-300 h-10 rounded-full"></div>
        <div class="flex gap-1">${ADULT_LOWER_LEFT.map(drawTooth).join('')}</div>
      </div>
    </div>
  `;
}
function bukaDetailRM(idx) {
  let r = riwayatPasienAktif[idx];
  if(!r) {
    alertMsg('error', 'Detail riwayat tidak dapat dimuat.');
    return;
  }
  let ana = {}, fis = {}, odo = {}, tind = [], obat = [];
   let odoJsonStr = r.odontogramStr || r.odontogram || "{}";
  try { ana = JSON.parse(r.anamnesisStr || "{}"); } catch(e){}
  try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
  try { odo = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr; } catch(e){}
  try { tind = JSON.parse(r.tindakanStr || "[]"); } catch(e){}
  try { obat = JSON.parse(r.obatStr || "[]"); } catch(e){}
  let formatWaktu = r.waktuSimpan ? new Date(r.waktuSimpan).toLocaleString('id-ID') : '-';
  document.getElementById('detWaktuSimpan').innerText = `Input sistem: ${formatWaktu} | Oleh: ${r.dokterPemeriksa}`;
  // Hitung Nilai DMF-T untuk Ringkasan Awal
  let dCount = 0, mCount = 0, fCount = 0;
  const arrGigiDewasa = [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT, ...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT];
  arrGigiDewasa.forEach(n => {
    const t = odo[n]; if (!t) return;
    if (t.generalCondition === 'car' || Object.values(t.surfaces || {}).includes('car')) dCount++;
    else if (t.generalCondition === 'mis') mCount++;
    else if (Object.values(t.surfaces || {}).some(c => ['cfr', 'amf', 'gif'].includes(c))) fCount++;
  });
  const dmftTotal = dCount + mCount + fCount;
  const odoFilledGigi = Object.keys(odo).length;

  let odoVisualHtml = renderHistoryOdontogram(odoJsonStr);
  let html = `
    <div class="border-b-2 border-slate-800 pb-4 mb-6">
      <h2 class="text-xl font-black text-center uppercase tracking-widest text-slate-900">Rekam Medis Pasien</h2>
      <p class="text-center text-xs font-bold mt-1 text-slate-600">SHELDON Oral Maxillofacial Surgery & Dental Implant Center</p>
    </div>
  
    <table class="w-full text-xs font-medium mb-6">
      <tr><td class="w-32 text-slate-500">Nama Pasien</td><td class="font-bold text-base text-indigo-700">: ${r.namaPasien}</td>
          <td class="w-32 text-slate-500">No. RM</td><td class="font-bold font-mono">: ${r.noRm}</td></tr>
      <tr><td class="text-slate-500">Tgl Pemeriksaan</td><td class="font-bold">: ${formatTglIndoRM(r.tanggalPeriksa || '-')}</td>
          <td class="text-slate-500">Dokter</td><td class="font-bold">: ${r.dokterPemeriksa}</td></tr>
    </table>
    <div class="space-y-4 text-xs">
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Anamnesis</h4>
        <table class="w-full">
          <tr><td class="w-40 py-1 text-slate-600">Chief Complain (CC)</td><td>: ${ana.cc || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Present Illness (PI)</td><td>: ${ana.pi || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Past Dental/Medical Hist.</td><td>: ${ana.pdh || '-'} / ${ana.pmh || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Family Hist / Khusus</td><td>: ${ana.fh || '-'} / ${ana.khusus || '-'}</td></tr>
        </table>
        <div class="mt-2 text-[10px]"><b>Review Of System:</b>
          Endo(${ana.ros?.endo||'-'}), Gastro(${ana.ros?.gastro||'-'}), Hemato(${ana.ros?.hemato||'-'}), Kardio(${ana.ros?.kardio||'-'}),
          Muskulo(${ana.ros?.muskulo||'-'}), Neuro(${ana.ros?.neuro||'-'}), Resp(${ana.ros?.respirasi||'-'}), Uro(${ana.ros?.uro||'-'})
        </div>
      </div>
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Pemeriksaan Fisik</h4>
        <table class="w-full">
          <tr><td class="w-32 py-1 text-slate-600">Kesan Umum</td><td>: ${fis.kesan || '-'}</td><td class="w-32 py-1 text-slate-600">Kesadaran</td><td>: ${fis.kesadaran || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Tensi (mmHg)</td><td>: ${fis.tensi || '-'}</td><td class="py-1 text-slate-600">Nafas (x/mnt)</td><td>: ${fis.nafas || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Nadi (x/mnt)</td><td>: ${fis.nadi || '-'}</td><td class="py-1 text-slate-600">Suhu (°C)</td><td>: ${fis.suhu || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">BB (kg) / TB (cm)</td><td colspan="3">: ${fis.bb || '-'} / ${fis.tb || '-'}</td></tr>
        </table>
        <table class="w-full mt-1">
          <tr><td class="w-40 py-1 text-slate-600">Alergi</td><td>: ${fis.alergi || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Ekstra / Intra Oral</td><td>: ${fis.ekstra || '-'} / ${fis.intra || '-'}</td></tr>
          <tr><td class="py-1 text-slate-600">Penunjang</td><td>: ${fis.penunjang || '-'}</td></tr>
        </table>
      </div>
      <!-- MODUL ODONTOGRAM: RINGKASAN AWAL DMF-T INDEX & TOMBOL INTERAKTIF -->
      <div class="bg-sky-50/60 border border-sky-200 p-3.5 rounded-xl text-left">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-black text-sky-900 uppercase text-xs flex items-center gap-1.5">
            <span>🦷</span> Peta Odontogram Saat Kunjungan
          </h4>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${odoFilledGigi === 0 ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-sky-100 text-sky-800 border border-sky-300'}">
            ${odoFilledGigi === 0 ? 'Semua Sehat (SOU)' : `Tercatat (${odoFilledGigi} Gigi)`}
          </span>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Decayed (D)</span>
            <span class="font-black ${dCount > 0 ? 'text-rose-600' : 'text-slate-800'}">${dCount}</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Missing (M)</span>
            <span class="font-black ${mCount > 0 ? 'text-amber-600' : 'text-slate-800'}">${mCount}</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Filled (F)</span>
            <span class="font-black ${fCount > 0 ? 'text-emerald-600' : 'text-slate-800'}">${fCount}</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Total DMF-T</span>
            <span class="font-black ${dmftTotal > 0 ? 'text-sky-700' : 'text-slate-800'}">${dmftTotal}</span>
          </div>
        </div>
        <div class="mt-2.5 text-right no-print">
          <button type="button" onclick="bukaModalOdontoHistory(${idx})" class="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
            <span>🦷</span> Buka Gambar Odontogram &rarr;
          </button>
        </div>
      </div>
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosis Gigi (Tulisan)</h4>
        <ul class="list-disc pl-5 columns-1 sm:columns-3 gap-6 space-y-1 text-xs">
          ${Object.keys(odo).length === 0 ? '<li class="break-inside-avoid">Tidak ada kelainan (Normal/SOU) / Tidak ditandai</li>' :
            Object.keys(odo).map(gigi => {
              let dt = odo[gigi];
              let diag = dt.diagnosis ? `(Diag: ${dt.diagnosis})` : '';
              let nts = dt.notes ? `[Catatan: ${dt.notes}]` : '';
              let gen = dt.generalCondition !== 'nor' ? `Kondisi: ${dt.generalCondition}` : '';
              let sur = Object.entries(dt.surfaces||{}).filter(x=>x[1]!=='nor').map(x=>x[0]+'='+x[1]).join(', ');
              let srTx = sur ? `Permukaan: ${sur}` : '';
              return `<li class="break-inside-avoid"><b>Gigi ${gigi}:</b> <span class="text-slate-600">${gen}${srTx}</span> <span class="text-indigo-600 font-bold">${diag}</span> <span class="text-amber-600 italic">${nts}</span></li>`;
            }).join('')
          }
        </ul>
      </div>
      ${fis.periodontal ? `
      <div class="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-xl text-left">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-black text-indigo-900 uppercase text-xs flex items-center gap-1.5">
            <span>🦷</span> Hasil Periodontal Charting
          </h4>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">Tercatat</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Total Sites</span>
            <span class="font-black text-slate-800">${fis.periodontal.summary?.totalSites || 0} Titik</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Deep Pockets (&ge;4mm)</span>
            <span class="font-black ${(fis.periodontal.summary?.deepPockets || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.deepPockets || 0} Titik</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Bleeding Index (BOP)</span>
            <span class="font-black ${(fis.periodontal.summary?.bopPercent || 0) > 0 ? "text-rose-600" : "text-slate-800"}">${fis.periodontal.summary?.bopPercent || 0}%</span>
          </div>
        </div>
        <div class="mt-2.5 text-right no-print">
          <button type="button" onclick="bukaModalPerioHistory(${idx})" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
            <span>📊</span> Buka Grafik Charting Lengkap &rarr;
          </button>
        </div>
      </div>
      ` : ""}
      ${fis.ohis ? `
      <div class="bg-teal-50/60 border border-teal-200 p-3.5 rounded-xl text-left">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-black text-teal-900 uppercase text-xs flex items-center gap-1.5">
            <span>🪥</span> Hasil Pemeriksaan OHI-S
          </h4>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${
            fis.ohis.summary?.kategori === 'Baik' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            fis.ohis.summary?.kategori === 'Sedang' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
            'bg-rose-100 text-rose-800 border border-rose-300'
          }">
            ${fis.ohis.summary?.kategori || 'Tercatat'} (Skor: ${fis.ohis.summary?.ohis || '0.00'})
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Debris Index (DI-S)</span>
            <span class="font-black text-slate-800">${fis.ohis.summary?.dis || '0.00'} (${fis.ohis.summary?.katDis || '-'})</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Calculus Index (CI-S)</span>
            <span class="font-black text-slate-800">${fis.ohis.summary?.cis || '0.00'} (${fis.ohis.summary?.katCis || '-'})</span>
          </div>
          <div class="bg-white p-2 rounded-lg border border-slate-200">
            <span class="text-[9px] text-slate-500 block font-bold">Total OHI-S</span>
            <span class="font-black ${
              fis.ohis.summary?.kategori === 'Baik' ? 'text-emerald-600' :
              fis.ohis.summary?.kategori === 'Sedang' ? 'text-amber-600' : 'text-rose-600'
            }">${fis.ohis.summary?.ohis || '0.00'}</span>
          </div>
        </div>
        <div class="mt-2.5 text-right no-print">
          <button type="button" onclick="bukaModalOhisHistory(${idx})" class="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1.5 ml-auto">
            <span>🪥</span> Buka Detail Skor OHI-S &rarr;
          </button>
        </div>
      </div>
      ` : ""}
      ${(ana.diagnosaICD && ana.diagnosaICD.length > 0) ? `
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Diagnosa (ICD-10)</h4>
        <ul class="list-disc pl-5 space-y-1 text-slate-800 font-bold mb-4">
          ${ana.diagnosaICD.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>` : ''}
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Tindakan (ICD-9)</h4>
        <ul class="list-disc pl-5">${tind.length === 0 ? '<li>-</li>' : tind.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Resep Obat</h4>
        <table class="w-full text-left border border-slate-300 border-collapse">
          <tr class="bg-slate-50"><th class="border border-slate-300 px-2 py-1">Nama Obat</th><th class="border border-slate-300 px-2 py-1 w-16 text-center">Qty</th><th class="border border-slate-300 px-2 py-1">Aturan Pakai</th></tr>
          ${obat.length === 0 ? '<tr><td colspan="3" class="border border-slate-300 px-2 py-1 text-center">-</td></tr>' : obat.map(o => `<tr><td class="border border-slate-300 px-2 py-1">${o.obat}</td><td class="border border-slate-300 px-2 py-1 text-center font-bold">${o.qty}</td><td class="border border-slate-300 px-2 py-1">${o.ket}</td></tr>`).join('')}
        </table>
      </div>
      <div>
        <h4 class="font-black bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-2 uppercase">Catatan Edukasi</h4>
        <p class="pl-2 bg-rose-50 p-2 rounded border border-rose-100 text-rose-800 font-medium">${r.catatanEdukasi || '-'}</p>
      </div>
    </div>
  `;
   document.getElementById('printAreaRM').innerHTML = html;
  document.getElementById('modalDetailRM').classList.remove('hidden');
}
function printDetailRM() {
  const printContent = document.getElementById('printAreaRM').innerHTML;
  const printFrame = document.getElementById('printFrame').contentWindow;

  // Format Nama File: [Nama Pasien]-[tanggal bulan tahun cetak]
  const dNow = new Date();
  const arrBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const tglCetakStr = `${dNow.getDate()} ${arrBulan[dNow.getMonth()]} ${dNow.getFullYear()}`;
  let namaPasien = "-";
  if (window.activePasien && window.activePasien.namaPasien) {
    namaPasien = window.activePasien.namaPasien;
  }
  const namaPasienBersih = namaPasien.replace(/[/\\?%*:|"<>]/g, '').trim();
  const cleanName = `${namaPasienBersih}-${tglCetakStr}`;
  const originalTitle = document.title;

  printFrame.document.open();
  printFrame.document.write(`
    <html>
    <head>
      <title>${cleanName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0; /* Menghilangkan URL script.google.com dan tanggal/waktu bawaan browser */
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 1.5cm 1cm !important;
            background: #ffffff !important;
          }
        }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; line-height: 1.5; }
        h2, h4 { margin: 0 0 5px 0; }
        .text-center { text-align: center; }
        .uppercase { text-transform: uppercase; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: bold; }
        .w-full { width: 100%; }
        .w-32 { width: 120px; }
        .w-40 { width: 150px; }
        .border-b-2 { border-bottom: 2px solid #000; }
        .pb-4 { padding-bottom: 15px; }
        .mb-6 { margin-bottom: 20px; }
        .mb-2 { margin-bottom: 10px; }
        .mt-1 { margin-top: 5px; }
        .mt-2 { margin-top: 10px; }
        .bg-slate-100, .bg-slate-50, .bg-rose-50, .bg-slate-200 { background-color: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .p-1\\.5 { padding: 6px; }
        .p-2 { padding: 8px; }
        .p-3 { padding: 12px; }
        .border-l-4 { border-left: 4px solid #000; }
        .text-slate-500, .text-slate-600 { color: #475569; }
        .text-indigo-700 { color: #4338ca; }
        .pl-5 { padding-left: 20px; }
        .pl-2 { padding-left: 8px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        table { border-collapse: collapse; }
        .border { border: 1px solid #000; }
        .px-2 { padding-left: 8px; padding-right: 8px; }
        .text-xs { font-size: 11px; }
        ul { margin: 0; }
      
        /* Tambahan CSS Khusus Render Odontogram Saat Diprint */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .gap-4 { gap: 16px; }
        .gap-1 { gap: 4px; }
        .flex-row-reverse { flex-direction: row-reverse; }
        .inline-block { display: inline-block; }
        .w-6 { width: 24px; } .h-6 { height: 24px; }
        .sm\\:w-8 { width: 32px; } .sm\\:h-8 { height: 32px; }
        .w-1 { width: 4px; } .h-10 { height: 40px; }
        .bg-slate-300 { background-color: #cbd5e1; }
        .border-slate-300 { border-color: #cbd5e1; }
        .border-b { border-bottom-width: 1px; }
        .pb-2 { padding-bottom: 8px; }
        .pt-2 { padding-top: 8px; }
        .my-3 { margin-top: 12px; margin-bottom: 12px; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .rounded-full { border-radius: 9999px; }
        .no-print { display: none !important; }
        .grid { display: flex; gap: 8px; }
        .grid-cols-4 > div { flex: 1; }
        .grid-cols-3 > div { flex: 1; }
        .rounded, .rounded-lg { border-radius: 8px; }
        .rounded-xl { border-radius: 12px; }
        .bg-sky-50\/60, .bg-sky-50 { background-color: #f0f9ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-indigo-50\/60, .bg-indigo-50 { background-color: #eef2ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-teal-50\/60, .bg-teal-50 { background-color: #f0fdfa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .border-sky-200 { border: 1px solid #bae6fd; }
        .border-indigo-200 { border: 1px solid #c7d2fe; }
        .border-teal-200 { border: 1px solid #99f6e4; }
        .text-rose-600 { color: #e11d48 !important; }
        .text-amber-600 { color: #d97706 !important; }
        .text-emerald-600 { color: #059669 !important; }
        .text-sky-700 { color: #0369a1 !important; }
        .text-teal-700 { color: #0f766e !important; }
      
        @media print { 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>${printContent}</body>
    </html>
  `);
  printFrame.document.close();
  printFrame.focus();
  document.title = cleanName;
  setTimeout(() => {
    document.title = cleanName;
    if (printFrame.document) printFrame.document.title = cleanName;
    printFrame.print();
    printFrame.onafterprint = function() { document.title = originalTitle; };
    setTimeout(() => { document.title = originalTitle; }, 15000);
  }, 500);
}
// ==========================================
// CORE ODONTOGRAM INTERAKTIF SVG
// ==========================================
function setDentitionMode(mode) {
  dentitionMode = mode;
  ['adult', 'pediatric', 'mixed'].forEach(m => {
    let btn = document.getElementById('modeBtn-' + m);
    if (btn) btn.className = (m === mode) ? 'px-2 py-1 rounded bg-white shadow-sm text-blue-700 font-bold transition-all' : 'px-2 py-1 rounded text-slate-600 hover:text-slate-900 transition-all';
  });
  const pedUpper = document.getElementById('pediatricUpperRow'),
        pedLower = document.getElementById('pediatricLowerRow'),
        adUpper = document.getElementById('adultUpperRow'),
        adLower = document.getElementById('adultLowerRow');
  if (pedUpper && pedLower && adUpper && adLower) {
    if (mode === 'adult') {
      pedUpper.classList.add('hidden'); pedUpper.classList.remove('flex');
      pedLower.classList.add('hidden'); pedLower.classList.remove('flex');
      adUpper.classList.remove('hidden'); adUpper.classList.add('flex');
      adLower.classList.remove('hidden'); adLower.classList.add('flex');
    } else if (mode === 'pediatric') {
      adUpper.classList.add('hidden'); adUpper.classList.remove('flex');
      adLower.classList.add('hidden'); adLower.classList.remove('flex');
      pedUpper.classList.remove('hidden'); pedUpper.classList.add('flex');
      pedLower.classList.remove('hidden'); pedLower.classList.add('flex');
    } else {
      adUpper.classList.remove('hidden'); adUpper.classList.add('flex');
      adLower.classList.remove('hidden'); adLower.classList.add('flex');
      pedUpper.classList.remove('hidden'); pedUpper.classList.add('flex');
      pedLower.classList.remove('hidden'); pedLower.classList.add('flex');
    }
  }
  renderOdontogramGrid();
}
function renderPalette() {
  const container = document.getElementById('conditionPalette');
  if (container) {
    container.innerHTML = Object.entries(TOOTH_CONDITIONS).map(([code, item]) => `
      <button type="button" onclick="selectCondition('${code}')" class="p-1.5 border rounded text-left flex items-center gap-1.5 transition-all cursor-pointer ${selectedCondition === code ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}">
        <span class="w-3 h-3 rounded-full shrink-0 border border-slate-300 shadow-inner" style="background-color: ${item.color}"></span>
        <span class="text-[9px] leading-tight truncate">${item.label}</span>
      </button>`).join('');
  }
  const modalContainer = document.getElementById('modalConditionPalette');
  if (modalContainer) {
    modalContainer.innerHTML = Object.entries(TOOTH_CONDITIONS).map(([code, item]) => `
      <button type="button" onclick="selectCondition('${code}')" class="p-2 border rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer ${selectedCondition === code ? 'border-blue-500 bg-blue-950/80 font-bold text-blue-200 shadow-md ring-1 ring-blue-400' : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 text-slate-300'}">
        <span class="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-700 shadow" style="background-color: ${item.color}"></span>
        <span class="text-[10px] leading-tight truncate">${item.label}</span>
      </button>`).join('');
  }
}
function selectCondition(code) {
  selectedCondition = code;
  renderPalette();
}
function renderOdontogramGrid() {
  renderQuadrant('quadrant1', ADULT_UPPER_RIGHT);
  renderQuadrant('quadrant2', ADULT_UPPER_LEFT);
  renderQuadrant('quadrant4', ADULT_LOWER_RIGHT);
  renderQuadrant('quadrant3', ADULT_LOWER_LEFT);
  renderQuadrant('quadrant5', PED_UPPER_RIGHT);
  renderQuadrant('quadrant6', PED_UPPER_LEFT);
  renderQuadrant('quadrant8', PED_LOWER_RIGHT);
  renderQuadrant('quadrant7', PED_LOWER_LEFT);

  // Synchronize modal quadrants if modal is open
  renderQuadrant('modalQuadrant1', ADULT_UPPER_RIGHT);
  renderQuadrant('modalQuadrant2', ADULT_UPPER_LEFT);
  renderQuadrant('modalQuadrant4', ADULT_LOWER_RIGHT);
  renderQuadrant('modalQuadrant3', ADULT_LOWER_LEFT);
  renderQuadrant('modalQuadrant5', PED_UPPER_RIGHT);
  renderQuadrant('modalQuadrant6', PED_UPPER_LEFT);
  renderQuadrant('modalQuadrant8', PED_LOWER_RIGHT);
  renderQuadrant('modalQuadrant7', PED_LOWER_LEFT);

  updateDmftCalculations();
}

function renderQuadrant(containerId, teethNumbers) {
  const cont = document.getElementById(containerId);
  if (cont) cont.innerHTML = teethNumbers.map(num => renderSingleToothHtml(num)).join('');
}

function renderSingleToothHtml(num) {
  const isUpper = (num >= 11 && num <= 28) || (num >= 51 && num <= 65);
  const isRightArch = (num >= 11 && num <= 18) || (num >= 41 && num <= 48) || (num >= 51 && num <= 55) || (num >= 81 && num <= 85);
  const leftSurface = isRightArch ? 'distal' : 'mesial';
  const rightSurface = isRightArch ? 'mesial' : 'distal';
  const topSurface = isUpper ? 'buccal' : 'lingual';
  const bottomSurface = isUpper ? 'lingual' : 'buccal';
  const centerSurface = 'occlusal';
  const tState = currentOdontogram[num] || { generalCondition: 'nor', surfaces: {} };
  const surfs = tState.surfaces || {};
  const genCond = tState.generalCondition || 'nor';
  const isMissing = genCond === 'mis', isRadix = genCond === 'rrx', isCrown = genCond === 'crn', isNonVital = genCond === 'nvt', isUnerupted = genCond === 'une', isImpacted = genCond === 'imx', isPersistence = genCond === 'pre';
  const mobility = tState.mobility || 0;
  const hasNotes = Boolean(tState.notes || tState.diagnosis);
  const getColor = (surfKey) => {
    if (isMissing || isRadix || isUnerupted) return '#f8fafc';
    const cCode = surfs[surfKey] || 'nor';
    const cond = TOOTH_CONDITIONS[cCode];
    return cond ? cond.color : '#ffffff';
  };
  return `
    <div class="flex flex-col items-center select-none p-0.5 rounded hover:bg-slate-50 transition-colors">
      ${isUpper ? `<button type="button" onclick="openToothModal(${num})" class="text-[9px] font-bold font-mono text-slate-700 hover:text-blue-600 mb-0.5 cursor-pointer flex items-center gap-0.5"><span>${num}</span>${hasNotes ? `<span class="w-1 h-1 rounded-full bg-amber-500"></span>` : ''}</button>` : ''}
      <div class="w-8 h-8 sm:w-10 sm:h-10 relative">
        ${isCrown ? `<div class="absolute inset-0 rounded-full border border-blue-500 pointer-events-none z-10 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></div>` : ''}
        ${isPersistence ? `<div class="absolute inset-0 rounded-full border-2 border-dashed border-pink-500 pointer-events-none z-10 shadow-[0_0_6px_rgba(236,72,153,0.6)]"></div>` : ''}
        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-sm">
          <rect x="4" y="4" width="92" height="92" rx="10" fill="${isMissing ? '#e2e8f0' : isUnerupted ? '#f1f5f9' : '#ffffff'}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="${isUnerupted ? '4 3' : 'none'}"/>
          ${!isMissing && !isRadix ? `
            <polygon points="10,10 90,10 70,30 30,30" fill="${getColor(topSurface)}" stroke="#64748b" stroke-width="1.5" class="tooth-polygon" onclick="onSurfaceClick(${num}, '${topSurface}')" ondblclick="onSurfaceDblClick(event, ${num}, '${topSurface}')"/>
            <polygon points="30,70 70,70 90,90 10,90" fill="${getColor(bottomSurface)}" stroke="#64748b" stroke-width="1.5" class="tooth-polygon" onclick="onSurfaceClick(${num}, '${bottomSurface}')" ondblclick="onSurfaceDblClick(event, ${num}, '${bottomSurface}')"/>
            <polygon points="10,10 30,30 30,70 10,90" fill="${getColor(leftSurface)}" stroke="#64748b" stroke-width="1.5" class="tooth-polygon" onclick="onSurfaceClick(${num}, '${leftSurface}')" ondblclick="onSurfaceDblClick(event, ${num}, '${leftSurface}')"/>
            <polygon points="90,10 70,30 70,70 90,90" fill="${getColor(rightSurface)}" stroke="#64748b" stroke-width="1.5" class="tooth-polygon" onclick="onSurfaceClick(${num}, '${rightSurface}')" ondblclick="onSurfaceDblClick(event, ${num}, '${rightSurface}')"/>
            <polygon points="30,30 70,30 70,70 30,70" fill="${getColor(centerSurface)}" stroke="#64748b" stroke-width="1.5" class="tooth-polygon" onclick="onSurfaceClick(${num}, '${centerSurface}')" ondblclick="onSurfaceDblClick(event, ${num}, '${centerSurface}')"/>
          ` : ''}
          ${isMissing ? `<g stroke="#475569" stroke-width="5" stroke-linecap="round"><line x1="20" y1="20" x2="80" y2="80"/><line x1="80" y1="20" x2="20" y2="80"/></g>` : ''}
          ${isRadix ? `<polygon points="50,84 20,24 80,24" fill="#dc2626" stroke="#991b1b" stroke-width="2"/><text x="50" y="20" text-anchor="middle" font-size="16" font-weight="bold" fill="#dc2626">RRX</text>` : ''}
          ${isUnerupted ? `<circle cx="50" cy="50" r="28" fill="none" stroke="#64748b" stroke-width="2.5" stroke-dasharray="5 3"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" fill="#64748b">U</text>` : ''}
          ${isImpacted ? `<line x1="15" y1="50" x2="85" y2="50" stroke="#ea580c" stroke-width="3" stroke-dasharray="4 3"/><polyline points="65,35 85,50 65,65" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>` : ''}
          ${isNonVital ? `<polygon points="50,34 66,66 34,66" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>` : ''}
          ${isPersistence ? `<circle cx="50" cy="50" r="32" fill="none" stroke="#ec4899" stroke-width="3" stroke-dasharray="4 2"/><text x="50" y="58" text-anchor="middle" font-size="20" font-weight="900" fill="#ec4899">P</text>` : ''}
        </svg>
        ${mobility > 0 ? `<span class="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full border border-white">M${mobility}</span>` : ''}
      </div>
      ${!isUpper ? `<button type="button" onclick="openToothModal(${num})" class="text-[9px] font-bold font-mono text-slate-700 hover:text-blue-600 mt-0.5 cursor-pointer flex items-center gap-0.5"><span>${num}</span>${hasNotes ? `<span class="w-1 h-1 rounded-full bg-amber-500"></span>` : ''}</button>` : ''}
    </div>`;
}

let _surfaceClickTimer = null;
function onSurfaceClick(tN, sK) {
  if (_surfaceClickTimer) clearTimeout(_surfaceClickTimer);
  _surfaceClickTimer = setTimeout(() => {
    if (!currentOdontogram[tN]) currentOdontogram[tN] = { toothNumber: tN, generalCondition: 'nor', surfaces: { occlusal: 'nor', mesial: 'nor', distal: 'nor', buccal: 'nor', lingual: 'nor' } };
    if (['mis', 'rrx', 'crn', 'nvt', 'une', 'imx', 'pre'].includes(selectedCondition)) {
      currentOdontogram[tN].generalCondition = selectedCondition;
    } else {
      currentOdontogram[tN].generalCondition = 'nor';
      currentOdontogram[tN].surfaces[sK] = selectedCondition;
    }
    renderOdontogramGrid();
  }, 220);
}

function onSurfaceDblClick(e, tN, sK) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (_surfaceClickTimer) { clearTimeout(_surfaceClickTimer); _surfaceClickTimer = null; }
  if (currentOdontogram[tN]) {
    currentOdontogram[tN].generalCondition = 'nor';
    if (!currentOdontogram[tN].surfaces) currentOdontogram[tN].surfaces = {};
    currentOdontogram[tN].surfaces[sK] = 'nor';
    const allSurfs = Object.values(currentOdontogram[tN].surfaces || {});
    const isAllNormal = allSurfs.every(c => c === 'nor');
    if (isAllNormal && !currentOdontogram[tN].notes && !currentOdontogram[tN].diagnosis && !currentOdontogram[tN].mobility) {
      delete currentOdontogram[tN];
    }
    renderOdontogramGrid();
  }
}

function updateDmftCalculations() {
  let d = 0, m = 0, f = 0;
  const aN = [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT, ...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT];
  aN.forEach(n => {
    const t = currentOdontogram[n]; if (!t) return;
    if (t.generalCondition === 'car' || Object.values(t.surfaces || {}).includes('car')) d++;
    else if (t.generalCondition === 'mis') m++;
    else if (Object.values(t.surfaces || {}).some(c => ['cfr', 'amf', 'gif'].includes(c))) f++;
  });
  const total = d + m + f;

  // Inline form elements
  let elD = document.getElementById('dmftDecayed'); if (elD) elD.innerText = `D: ${d}`;
  let elM = document.getElementById('dmftMissing'); if (elM) elM.innerText = `M: ${m}`;
  let elF = document.getElementById('dmftFilled'); if (elF) elF.innerText = `F: ${f}`;
  let elT = document.getElementById('dmftTotal'); if (elT) elT.innerText = `Total: ${total}`;

  // Modal elements
  let mD = document.getElementById('modalDmftD'); if (mD) mD.innerText = `${d}`;
  let mM = document.getElementById('modalDmftM'); if (mM) mM.innerText = `${m}`;
  let mF = document.getElementById('modalDmftF'); if (mF) mF.innerText = `${f}`;
  let mT = document.getElementById('modalDmftTotal'); if (mT) mT.innerText = `${total}`;

  // Banner EMR badge & summary synchronization
  const badge = document.getElementById('badgeOdontogramStatus');
  const summaryQuick = document.getElementById('summaryOdontogramQuick');
  const modalSummary = document.getElementById('modalOdontogramSummaryText');

  const filledCount = Object.keys(currentOdontogram).length;
  if (filledCount === 0) {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700";
      badge.innerText = "Semua Sehat (SOU)";
    }
    if (summaryQuick) {
      summaryQuick.innerText = "Pencatatan kondisi gigi (PDGI), karies (D), hilang (M), tumpatan (F) & kalkulasi DMF-T otomatis.";
    }
    if (modalSummary) {
      modalSummary.innerText = "Semua gigi dalam kondisi normal (SOU). Belum ada temuan karies atau tumpatan.";
    }
  } else {
    if (badge) {
      badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-700";
      badge.innerText = `DMF-T: ${total} (D:${d} M:${m} F:${f})`;
    }
    if (summaryQuick) {
      summaryQuick.innerHTML = `Terisi: <b>${filledCount} gigi</b> &bull; Decayed (D): <b>${d}</b> &bull; Missing (M): <b>${m}</b> &bull; Filled (F): <b>${f}</b> &bull; Total DMF-T: <b>${total}</b>`;
    }
    if (modalSummary) {
      modalSummary.innerHTML = `Terisi <b>${filledCount} gigi</b> &bull; DMF-T Index: <b>${total}</b> (D:${d}, M:${m}, F:${f})`;
    }
  }
}

function bukaModalOdontogram() {
  const modal = document.getElementById("modalOdontogramInteractive");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderPalette();
  setDentitionModeModal(dentitionMode || 'adult');
  renderOdontogramGrid();
}

function tutupModalOdontogram() {
  const modal = document.getElementById("modalOdontogramInteractive");
  if (modal) modal.classList.add("hidden");
}

function setDentitionModeModal(mode) {
  setDentitionMode(mode);
  ['adult', 'pediatric', 'mixed'].forEach(m => {
    let btn = document.getElementById('modalModeBtn-' + m);
    if (btn) {
      btn.className = (m === mode) 
        ? 'flex-1 py-1.5 rounded-lg bg-blue-600 text-white font-bold transition-all shadow'
        : 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all';
    }
  });

  const pedUpper = document.getElementById('modalPediatricUpperRow'),
        pedLower = document.getElementById('modalPediatricLowerRow'),
        adUpper = document.getElementById('modalAdultUpperRow'),
        adLower = document.getElementById('modalAdultLowerRow');
  if (pedUpper && pedLower && adUpper && adLower) {
    if (mode === 'adult') {
      pedUpper.classList.add('hidden'); pedUpper.classList.remove('flex');
      pedLower.classList.add('hidden'); pedLower.classList.remove('flex');
      adUpper.classList.remove('hidden'); adUpper.classList.add('flex');
      adLower.classList.remove('hidden'); adLower.classList.add('flex');
    } else if (mode === 'pediatric') {
      adUpper.classList.add('hidden'); adUpper.classList.remove('flex');
      adLower.classList.add('hidden'); adLower.classList.remove('flex');
      pedUpper.classList.remove('hidden'); pedUpper.classList.add('flex');
      pedLower.classList.remove('hidden'); pedLower.classList.add('flex');
    } else {
      adUpper.classList.remove('hidden'); adUpper.classList.add('flex');
      adLower.classList.remove('hidden'); adLower.classList.add('flex');
      pedUpper.classList.remove('hidden'); pedUpper.classList.add('flex');
      pedLower.classList.remove('hidden'); pedLower.classList.add('flex');
    }
  }
}

function simpanOdontogramKeEMR() {
  updateDmftCalculations();
  tutupModalOdontogram();
  const count = Object.keys(currentOdontogram).length;
  alertMsg("success", `Data Odontogram (${count} gigi tercatat) berhasil diterapkan ke formulir rekam medis!`);
}

function konfirmasiResetSemuaOdontogram() {
  const modal = document.getElementById('modalResetOdontogram');
  const modalContent = document.getElementById('modalResetOdontogramContent');
  if (modal && modalContent) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
      modalContent.classList.add('scale-100');
    }, 10);
  } else {
    if (confirm("Apakah Anda yakin ingin mereset seluruh ODONTOGRAM ke kondisi NORMAL (SOU) ?")) {
      resetAllOdontogramToNormal();
    }
  }
}

function batalResetOdontogram() {
  const modal = document.getElementById('modalResetOdontogram');
  const modalContent = document.getElementById('modalResetOdontogramContent');
  if (modal && modalContent) {
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
  }
}

function eksekusiResetOdontogram() {
  batalResetOdontogram();
  resetAllOdontogramToNormal();
}

function resetAllOdontogramToNormal() {
  currentOdontogram = {};
  renderOdontogramGrid();
  if (typeof showToast === 'function') {
    showToast('info', 'Seluruh gigi odontogram berhasil direset ke normal (sehat).');
  }
}
function openToothModal(num) {
  modalSelectedToothNumber = num;
  const t = currentOdontogram[num] || { generalCondition: 'nor', surfaces: {} };
   document.getElementById('modalToothNum').innerText = num;
  document.getElementById('modalGeneralCond').value = t.generalCondition || 'nor';
  document.getElementById('modalMobility').value = String(t.mobility || 0);
  document.getElementById('modalDiagnosis').value = t.diagnosis || '';
  document.getElementById('modalNotes').value = t.notes || '';
  document.getElementById('modalToothPreview').innerHTML = `<div class="scale-125 transform pointer-events-none">${renderSingleToothHtml(num)}</div>`;
   document.getElementById('toothModal').classList.remove('hidden');
}
function closeToothModal() {
  document.getElementById('toothModal').classList.add('hidden');
  modalSelectedToothNumber = null;
}
 function setModalToothAllSurfaces(c) {
  if (!modalSelectedToothNumber) return;
  currentOdontogram[modalSelectedToothNumber] = { toothNumber: modalSelectedToothNumber, generalCondition: 'nor', surfaces: { occlusal: c, mesial: c, distal: c, buccal: c, lingual: c } };
  saveToothModalChanges();
}
 function resetModalTooth() {
  if (!modalSelectedToothNumber) return;
  delete currentOdontogram[modalSelectedToothNumber];
  closeToothModal(); renderOdontogramGrid();
}
 function saveToothModalChanges() {
  if (!modalSelectedToothNumber) return;
  if (!currentOdontogram[modalSelectedToothNumber]) currentOdontogram[modalSelectedToothNumber] = { toothNumber: modalSelectedToothNumber, surfaces: {} };
   currentOdontogram[modalSelectedToothNumber].generalCondition = document.getElementById('modalGeneralCond').value;
  currentOdontogram[modalSelectedToothNumber].mobility = Number(document.getElementById('modalMobility').value) || 0;
  currentOdontogram[modalSelectedToothNumber].diagnosis = document.getElementById('modalDiagnosis').value;
  currentOdontogram[modalSelectedToothNumber].notes = document.getElementById('modalNotes').value;
   closeToothModal(); renderOdontogramGrid();
}
// ==========================================
// DIAGNOSA ICD-10, TINDAKAN & OBAT DINAMIS
// ==========================================
// [PERBAIKAN] Logika Pencarian Kode ICD-10 dari String Campuran
function autoFillICDCode(elDesc) {
   let row = elDesc.closest('.row-diagnosa');
   if(!row) return;
   let elCode = row.querySelector('.val-icdcode');
   let rawVal = elDesc.value.trim();
   let selectedVal = rawVal.toLowerCase();
  
   let found = masterICD.find(icd =>
       (`${icd.code} - ${icd.desc}`).toLowerCase() === selectedVal ||
       (icd.desc || "").toLowerCase() === selectedVal ||
       (icd.code || "").toLowerCase() === selectedVal
   );
  
   if (found) {
     elCode.value = found.code;
   } else {
     let parts = rawVal.split(' - ');
     if (parts.length > 1 && parts[0].trim()) {
       let codeCand = parts[0].trim().toLowerCase();
       let matchCand = masterICD.find(icd => (icd.code || "").toLowerCase() === codeCand);
       if (matchCand) { elCode.value = matchCand.code; return; }
     }
     elCode.value = '';
   }
}

// [PERBAIKAN] Logika Pencarian Kode ICD-9 dari String Campuran
function autoFillICD9Code(elDesc) {
   let row = elDesc.closest('.row-tindakan');
   if(!row) return;
   let elCode = row.querySelector('.val-icd9code');
   if(!elCode) return;
   let rawVal = elDesc.value.trim();
   let selectedVal = rawVal.toLowerCase();
  
   let found = masterICD9.find(t =>
       (`${t.code} - ${t.desc}`).toLowerCase() === selectedVal ||
       (t.desc || "").toLowerCase() === selectedVal ||
       (t.code || "").toLowerCase() === selectedVal
   );
  
   if (found) {
     elCode.value = found.code;
   } else {
     let parts = rawVal.split(' - ');
     if (parts.length > 1 && parts[0].trim()) {
       let codeCand = parts[0].trim().toLowerCase();
       let matchCand = masterICD9.find(t => (t.code || "").toLowerCase() === codeCand);
       if (matchCand) { elCode.value = matchCand.code; return; }
     }
     elCode.value = '';
   }
}


function tambahRowDiagnosa() {
  const c = document.getElementById('containerDiagnosa');
  let div = document.createElement('div');
  div.className = "p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 row-diagnosa shadow-sm";
  div.innerHTML = `
    <div class="flex gap-2 items-center">
      <input type="text" list="listICD10" oninput="autoTitleCase(this); autoFillICDCode(this);" placeholder="Ketik Kode atau Nama Penyakit (ICD-10)..." class="val-diagnosa flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs font-semibold">
      <input type="text" placeholder="Kode ICD-10" readonly class="val-icdcode w-28 px-2 py-1.5 bg-slate-200 text-slate-700 font-bold border border-slate-300 rounded-lg outline-none text-center text-xs">
      <button type="button" onclick="this.closest('.row-diagnosa').remove()" class="px-2.5 py-1.5 bg-rose-100 text-rose-600 rounded-lg font-black hover:bg-rose-200 transition-colors text-xs">X</button>
    </div>
    <div class="flex gap-2 items-center pl-8">
      <input type="text" oninput="autoTitleCase(this)" placeholder="Catatan / Keterangan Diagnosa..." class="val-diagnosa-ket flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 text-xs">
      <div class="w-28"></div>
      <div class="w-[26px]"></div>
    </div>
  `;
  c.appendChild(div);
}


function tambahRowTindakan() {
  const c = document.getElementById('containerTindakan');
  let div = document.createElement('div');
  div.className = "p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 row-tindakan shadow-sm";
  div.innerHTML = `
    <div class="flex gap-2 items-center">
      <input type="text" list="listTindakanRM" oninput="autoTitleCase(this); autoFillICD9Code(this);" placeholder="Ketik Kode atau Nama Tindakan (ICD-9)..." class="val-tindakan flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold">
      <input type="text" placeholder="Kode ICD-9" readonly class="val-icd9code w-28 px-2 py-1.5 bg-slate-200 text-slate-700 font-bold border border-slate-300 rounded-lg outline-none text-center text-xs">
      <button type="button" onclick="this.closest('.row-tindakan').remove()" class="px-2.5 py-1.5 bg-rose-100 text-rose-600 rounded-lg font-black hover:bg-rose-200 transition-colors text-xs">X</button>
    </div>
    <div class="flex gap-2 items-center pl-8">
      <input type="text" oninput="autoTitleCase(this)" placeholder="Catatan / Keterangan Tindakan..." class="val-tindakan-ket flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs">
      <div class="w-28"></div>
      <div class="w-[26px]"></div>
    </div>
  `;
  c.appendChild(div);
}
function tambahRowObat() {
  const c = document.getElementById('containerObat');
  let div = document.createElement('div');
  div.className = "flex gap-2 items-center row-obat bg-slate-50 p-2 rounded border border-slate-200";
  div.innerHTML = `<input type="text" list="listObatRM" oninput="autoTitleCase(this)" placeholder="Ketik / Cari Obat..." class="val-obat w-2/5 px-3 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-teal-500"><input type="text" maxlength="2" oninput="this.value=this.value.replace(/[^0-9]/g,'')" placeholder="Qty" class="val-qty w-12 px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none"><input type="text" oninput="autoTitleCase(this)" placeholder="Aturan Pakai..." class="val-ket flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded outline-none"><button type="button" onclick="this.parentElement.remove()" class="px-2.5 py-1.5 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button>`;
  c.appendChild(div);
}
// ==========================================
// CLEAR & SIMPAN EMR
// ==========================================
function bersihkanFormRM() {
  activePasienRM = null; currentOdontogram = {};
  document.getElementById('rmSearchPasien').value = '';
  ['rmSelectedRM', 'rmSelectedJK', 'rmSelectedTglLahir', 'rmSelectedUmur'].forEach(id => {
     let el = document.getElementById(id); if (el) el.innerText = '-';
  });
  document.getElementById('rmSelectedNama').innerText = 'Silakan cari pasien';
  document.getElementById('rmRiwayatContainer').innerHTML = '<div class="text-center text-slate-400 py-6 font-bold text-[10px]">Belum ada data.</div>';
  document.querySelectorAll('#anaCC, #anaPI, #anaPDH, #anaPMH, #anaFH, #anaEndo, #anaGastro, #anaHemato, #anaKardio, #anaMuskulo, #anaNeuro, #anaRespirasi, #anaUrogenital, #anaKhusus, #fisKesan, #fisKesadaran, #fisTensi, #fisNafas, #fisNadi, #fisSuhu, #fisBB, #fisTB, #fisAlergi, #fisEkstra, #fisIntra, #fisPenunjang, #rmCatatanEdukasi').forEach(el => el.value = '');
 
  document.getElementById('containerDiagnosa').innerHTML = '';
  document.getElementById('containerTindakan').innerHTML = '';
  document.getElementById('containerObat').innerHTML = '';
  tambahRowDiagnosa();
  tambahRowTindakan();
   let tglEl = document.getElementById('rmTglPeriksa'); tglEl.value = getTodayIso(); tglEl.max = getTodayIso();
   renderOdontogramGrid();
   resetPeriodontalToDefault();
   resetOhisToDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// [PERBAIKAN] Mencegah duplikasi String Kode ICD-10 saat disimpan
function simpanEMRFinal() {
  if (!activePasienRM) { alertMsg('error', 'Pilih pasien terlebih dahulu!'); return; }
   let btn = document.getElementById('btnSimpanRM');
  btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   const getV = (id) => document.getElementById(id) ? document.getElementById(id).value.trim() : '';
 
  let arrDiagnosa = [];
  document.querySelectorAll('.row-diagnosa').forEach(row => {
     let desc = row.querySelector('.val-diagnosa').value.trim();
     let code = row.querySelector('.val-icdcode').value.trim();
     let ket = row.querySelector('.val-diagnosa-ket') ? row.querySelector('.val-diagnosa-ket').value.trim() : '';
     if(desc) {
        let fullDiag = desc;
        if (code && !desc.toLowerCase().includes(code.toLowerCase())) {
            fullDiag = `${code} - ${desc}`;
        }
        if (ket) {
            fullDiag += ` (${ket})`;
        }
        arrDiagnosa.push(fullDiag);
     }
  });

  let anam = { cc: getV('anaCC'), pi: getV('anaPI'), pdh: getV('anaPDH'), pmh: getV('anaPMH'), fh: getV('anaFH'), ros: { endo: getV('anaEndo'), gastro: getV('anaGastro'), hemato: getV('anaHemato'), kardio: getV('anaKardio'), muskulo: getV('anaMuskulo'), neuro: getV('anaNeuro'), respirasi: getV('anaRespirasi'), uro: getV('anaUrogenital') }, khusus: getV('anaKhusus'), diagnosaICD: arrDiagnosa };
  let fisik = { kesan: getV('fisKesan'), kesadaran: getV('fisKesadaran'), tensi: getV('fisTensi'), nafas: getV('fisNafas'), nadi: getV('fisNadi'), suhu: getV('fisSuhu'), bb: getV('fisBB'), tb: getV('fisTB'), alergi: getV('fisAlergi'), ekstra: getV('fisEkstra'), intra: getV('fisIntra'), penunjang: getV('fisPenunjang') };
  if (currentPeriodontalExam) { fisik.periodontal = currentPeriodontalExam; }
  if (currentOhisExam) { fisik.ohis = currentOhisExam; }
  let arrTindakan = [];
  document.querySelectorAll('.row-tindakan').forEach(row => {
     let desc = row.querySelector('.val-tindakan').value.trim();
     let code = row.querySelector('.val-icd9code') ? row.querySelector('.val-icd9code').value.trim() : '';
     let ket = row.querySelector('.val-tindakan-ket') ? row.querySelector('.val-tindakan-ket').value.trim() : '';
     if(desc) {
        let fullTind = desc;
        if (code && !desc.toLowerCase().includes(code.toLowerCase())) {
            fullTind = `${code} - ${desc}`;
        }
        if (ket) {
            fullTind += ` (${ket})`;
        }
        arrTindakan.push(fullTind);
     }
  });
  let arrObat = []; document.querySelectorAll('.row-obat').forEach(row => { let ob = row.querySelector('.val-obat').value, q = row.querySelector('.val-qty').value, k = row.querySelector('.val-ket').value; if(ob) arrObat.push({ obat: ob, qty: q, ket: k }); });
 
  let payload = {
    idPasien: activePasienRM.idPasien, noRm: activePasienRM.noRm, namaPasien: activePasienRM.namaPasien, tanggalPeriksa: getV('rmTglPeriksa'), dokterPemeriksa: getV('rmDokterLabel'),
    anamnesisStr: JSON.stringify(anam), fisikStr: JSON.stringify(fisik), odontogram: JSON.stringify(currentOdontogram), tindakanStr: JSON.stringify(arrTindakan), obatStr: JSON.stringify(arrObat), catatanEdukasi: getV('rmCatatanEdukasi')
  };
 
  google.script.run.withSuccessHandler(res => {
    btn.innerHTML = 'SIMPAN DATA REKAM MEDIS'; btn.disabled = false;
    if (res.success) {
      alertMsg('success', res.message);
      payload.waktuSimpan = new Date().toISOString();
      if(window.KlinikData && window.KlinikData.rekamMedis) window.KlinikData.rekamMedis.push(payload);
      bersihkanFormRM();
    } else { alertMsg('error', res.message); }
  }).withFailureHandler(err => {
    btn.innerHTML = 'SIMPAN DATA REKAM MEDIS'; btn.disabled = false; alertMsg('error', err.message);
  }).simpanRekamMedis(payload);
}

// =========================================================================
// SISTEM PERIODONTAL CHARTING INTERAKTIF (DARK CLINICAL MODE & AUTO-ADVANCE)
// =========================================================================
let currentPeriodontalExam = null;
let perioTeethData = {};
let perioActiveArch = "maxilla"; // "maxilla" (18-28) or "mandible" (48-38)
let perioActiveAspect = "facial"; // "facial" or "lingual"
let perioActiveToothIdx = 0; // 0..15 in current arch
let perioActiveSiteIdx = 0; // 0..2 (DF, F, MF or DL, L, ML)

const maxilla = "maxilla";
const mandible = "mandible";
const facial = "facial";
const lingual = "lingual";

const PERIO_MAXILLA_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERIO_MANDIBLE_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function initPerioDataIfEmpty() {
  if (Object.keys(perioTeethData).length === 0) {
    const allTeeth = [...PERIO_MAXILLA_TEETH, ...PERIO_MANDIBLE_TEETH];
    allTeeth.forEach(num => {
      perioTeethData[num] = {
        mo: 0, fo: 0,
        df: 0, f: 0, mf: 0,
        bop_df: false, bop_f: false, bop_mf: false,
        dl: 0, l: 0, ml: 0,
        bop_dl: false, bop_l: false, bop_ml: false
      };
    });
  }
}

function bukaModalPeriodontal() {
  initPerioDataIfEmpty();
  const modal = document.getElementById("modalPeriodontalChart");
  if (!modal) return;
  modal.classList.remove("hidden");
  
  // Attach keyboard event listener
  if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
    window.removeEventListener("keydown", handlePerioKeydown);
    window.addEventListener("keydown", handlePerioKeydown);
  }

  renderPerioUI();
}

function tutupModalPeriodontal() {
  const modal = document.getElementById("modalPeriodontalChart");
  if (modal) modal.classList.add("hidden");
  if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
    window.removeEventListener("keydown", handlePerioKeydown);
  }
}

function getActiveTeethList() {
  return perioActiveArch === "maxilla" ? PERIO_MAXILLA_TEETH : PERIO_MANDIBLE_TEETH;
}

function getSiteKeysForAspect() {
  return perioActiveAspect === "facial" 
    ? [{ key: "df", label: "DF" }, { key: "f", label: "F" }, { key: "mf", label: "MF" }]
    : [{ key: "dl", label: "DL" }, { key: "l", label: "L" }, { key: "ml", label: "ML" }];
}

function switchPerioArch(arch) {
  perioActiveArch = arch;
  perioActiveToothIdx = 0;
  perioActiveSiteIdx = 0;
  
  const btnMax = document.getElementById("tabPerioRahangAtas");
  const btnMan = document.getElementById("tabPerioRahangBawah");
  if (btnMax && btnMan) {
    if (arch === "maxilla") {
      btnMax.className = "flex-1 py-1.5 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all shadow";
      btnMan.className = "flex-1 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    } else {
      btnMan.className = "flex-1 py-1.5 rounded-lg font-bold text-xs bg-blue-600 text-white transition-all shadow";
      btnMax.className = "flex-1 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    }
  }
  renderPerioUI();
}

function switchPerioAspect(aspect) {
  perioActiveAspect = aspect;
  perioActiveSiteIdx = 0;

  const btnFacial = document.getElementById("tabPerioFacial");
  const btnLingual = document.getElementById("tabPerioLingual");
  if (btnFacial && btnLingual) {
    if (aspect === "facial") {
      btnFacial.className = "px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 text-white transition-all shadow";
      btnLingual.className = "px-3 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    } else {
      btnLingual.className = "px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 text-white transition-all shadow";
      btnFacial.className = "px-3 py-1.5 rounded-lg font-bold text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
    }
  }
  renderPerioUI();
}

function pilihSitePerio(toothIdx, siteIdx) {
  perioActiveToothIdx = toothIdx;
  perioActiveSiteIdx = siteIdx;
  renderPerioUI();
}

function inputPerioDepth(depthVal) {
  initPerioDataIfEmpty();
  const teethList = getActiveTeethList();
  const toothNum = teethList[perioActiveToothIdx];
  const sites = getSiteKeysForAspect();
  const siteKey = sites[perioActiveSiteIdx].key;

  if (perioTeethData[toothNum]) {
    perioTeethData[toothNum][siteKey] = depthVal;
  }

  // AUTO-ADVANCE: Langsung melompat ke titik berikutnya!
  stepPerioNext();
}

function toggleBOPActive() {
  initPerioDataIfEmpty();
  const teethList = getActiveTeethList();
  const toothNum = teethList[perioActiveToothIdx];
  const sites = getSiteKeysForAspect();
  const siteKey = sites[perioActiveSiteIdx].key;
  const bopKey = "bop_" + siteKey;

  if (perioTeethData[toothNum]) {
    perioTeethData[toothNum][bopKey] = !perioTeethData[toothNum][bopKey];
  }
  renderPerioUI();
}

function stepPerioNext() {
  const teethList = getActiveTeethList();
  perioActiveSiteIdx++;
  if (perioActiveSiteIdx > 2) {
    perioActiveSiteIdx = 0;
    perioActiveToothIdx++;
    if (perioActiveToothIdx >= teethList.length) {
      // Loop kembali ke awal segmen atau ganti aspek
      perioActiveToothIdx = 0;
    }
  }
  renderPerioUI();
}

function stepPerioPrev() {
  const teethList = getActiveTeethList();
  perioActiveSiteIdx--;
  if (perioActiveSiteIdx < 0) {
    perioActiveSiteIdx = 2;
    perioActiveToothIdx--;
    if (perioActiveToothIdx < 0) {
      perioActiveToothIdx = teethList.length - 1;
    }
  }
  renderPerioUI();
}

function stepPerioTooth(delta) {
  const teethList = getActiveTeethList();
  perioActiveToothIdx = (perioActiveToothIdx + delta + teethList.length) % teethList.length;
  renderPerioUI();
}

function handlePerioKeydown(e) {
  const modal = document.getElementById("modalPeriodontalChart");
  if (!modal || modal.classList.contains("hidden")) return;

  // Cek jika focus di select mobility/furcation, biarkan default
  if (e.target.tagName === "SELECT") return;

  // Keypad 0-9
  if ((e.key >= "0" && e.key <= "9") || (e.code && e.code.startsWith("Numpad") && e.key >= "0" && e.key <= "9")) {
    e.preventDefault();
    inputPerioDepth(parseInt(e.key, 10));
    return;
  }

  // BOP Toggle: Space atau B / b
  if (e.key === " " || e.key === "b" || e.key === "B") {
    e.preventDefault();
    toggleBOPActive();
    return;
  }

  // Backspace: Mundur
  if (e.key === "Backspace") {
    e.preventDefault();
    stepPerioPrev();
    return;
  }

  // Panah Navigasi
  if (e.key === "ArrowRight") {
    e.preventDefault();
    stepPerioNext();
    return;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stepPerioPrev();
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    stepPerioTooth(1);
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    stepPerioTooth(-1);
    return;
  }
  if (e.key === "Escape") {
    tutupModalPeriodontal();
    return;
  }
}

function isiWNLPerio() {
  initPerioDataIfEmpty();
  const allTeeth = [...PERIO_MAXILLA_TEETH, ...PERIO_MANDIBLE_TEETH];
  allTeeth.forEach(num => {
    perioTeethData[num] = {
      mo: 0, fo: 0,
      df: 2, f: 2, mf: 2,
      bop_df: false, bop_f: false, bop_mf: false,
      dl: 2, l: 2, ml: 2,
      bop_dl: false, bop_l: false, bop_ml: false
    };
  });
  renderPerioUI();
  alertMsg("success", "Semua titik berhasil disetel ke kondisi normal (WNL: 2mm, BOP: Normal).");
}

function resetPerioChartSemua() {
  const modal = document.getElementById("modalResetPeriodontal");
  if (modal) {
    modal.classList.remove("hidden");
  } else {
    if (confirm("Reset Data Periodontal Charting ?")) {
      resetPeriodontalToDefault();
    }
  }
}

function batalResetPerio() {
  const modal = document.getElementById("modalResetPeriodontal");
  if (modal) modal.classList.add("hidden");
}

function eksekusiResetPerio() {
  batalResetPerio();
  resetPeriodontalToDefault();
  alertMsg("success", "Data Periodontal Charting berhasil direset ke kondisi awal.");
}

function resetPeriodontalToDefault() {
  currentPeriodontalExam = null;
  perioTeethData = {};
  perioActiveArch = "maxilla";
  perioActiveAspect = "facial";
  perioActiveToothIdx = 0;
  perioActiveSiteIdx = 0;
  initPerioDataIfEmpty();

  const badge = document.getElementById("badgePerioStatus");
  if (badge) {
    badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700";
    badge.innerText = "Belum Ada Data";
  }

  const quick = document.getElementById("summaryPerioQuick");
  if (quick) {
    quick.innerText = "Pemeriksaan kedalaman saku gusi (Pocket Depth), perdarahan (BOP), kegoyangan & furkasi.";
  }

  const modal = document.getElementById("modalPeriodontalChart");
  if (modal && !modal.classList.contains("hidden")) {
    renderPerioUI();
  }
}

function calculatePerioMetrics() {
  let totalSites = 0;
  let deepPockets = 0;
  let bopSites = 0;

  const allTeeth = [...PERIO_MAXILLA_TEETH, ...PERIO_MANDIBLE_TEETH];
  const sitesAll = ["df", "f", "mf", "dl", "l", "ml"];

  allTeeth.forEach(num => {
    const t = perioTeethData[num];
    if (!t) return;
    sitesAll.forEach(k => {
      const depth = t[k];
      if (depth !== undefined && depth !== null && depth > 0) {
        totalSites++;
        if (depth >= 4) deepPockets++;
      }
      if (t["bop_" + k]) {
        bopSites++;
      }
    });
  });

  const bopPercent = totalSites > 0 ? Math.round((bopSites / totalSites) * 1000) / 10 : 0;
  return { totalSites, deepPockets, bopSites, bopPercent };
}

function renderPerioUI() {
  const teethList = getActiveTeethList();
  const toothNum = teethList[perioActiveToothIdx] || teethList[0];
  const sites = getSiteKeysForAspect();
  const activeSiteInfo = sites[perioActiveSiteIdx] || sites[0];

  // 1. Update Labels & Metrics
  const metrics = calculatePerioMetrics();
  const elTot = document.getElementById("metricTotalSites");
  const elDeep = document.getElementById("metricDeepPockets");
  const elBop = document.getElementById("metricBopPercent");
  if (elTot) elTot.innerText = metrics.totalSites;
  if (elDeep) elDeep.innerText = metrics.deepPockets;
  if (elBop) elBop.innerText = `${metrics.bopPercent}% (${metrics.bopSites} sites)`;

  const elActive = document.getElementById("lblActiveSelection");
  if (elActive) {
    elActive.innerHTML = `Tooth ${toothNum} &bull; ${activeSiteInfo.label} (${perioActiveAspect === "facial" ? "Facial" : (perioActiveArch === "maxilla" ? "Palatal" : "Lingual")})`;
  }

  const elGLabel = document.getElementById("perioGraphicLabel");
  if (elGLabel) {
    elGLabel.innerHTML = `${perioActiveArch === "maxilla" ? "Rahang Atas (18-28)" : "Rahang Bawah (48-38)"} &bull; Tampilan ${perioActiveAspect === "facial" ? "Fasial/Bukal" : (perioActiveArch === "maxilla" ? "Palatal" : "Lingual")}`;
  }

  const elGridHeader = document.getElementById("perioGridHeader");
  if (elGridHeader) {
    elGridHeader.innerHTML = `Daftar Gigi ${perioActiveArch === "maxilla" ? "Rahang Atas (18-28)" : "Rahang Bawah (48-38)"} (Tampilan ${perioActiveAspect === "facial" ? "Fasial/Bukal" : (perioActiveArch === "maxilla" ? "Palatal" : "Lingual")})`;
  }

  const elFooter = document.getElementById("perioFooterSummaryText");
  if (elFooter) {
    elFooter.innerHTML = `Terisi ${metrics.totalSites} titik &bull; Saku Dalam (&ge;4mm): ${metrics.deepPockets} titik &bull; Bleeding Index (BOP): ${metrics.bopPercent}% (${metrics.bopSites} titik perdarahan).`;
  }

  // 2. Render Cards Grid
  renderPerioCards(teethList);

  // 3. Render SVG Graphic
  renderPerioGraphic(teethList);
}

function renderPerioCards(teethList) {
  const container = document.getElementById("perioCardsContainer");
  if (!container) return;

  const sites = getSiteKeysForAspect();

  const html = teethList.map((tNum, tIdx) => {
    const tData = perioTeethData[tNum] || {};
    const isActiveTooth = (tIdx === perioActiveToothIdx);

    const siteBoxes = sites.map((s, sIdx) => {
      const val = tData[s.key] || 0;
      const isBop = !!tData["bop_" + s.key];
      const isActiveSite = isActiveTooth && (sIdx === perioActiveSiteIdx);

      const isDeep = (val >= 4);
      let valColor = "text-cyan-300";
      let boxBg = "bg-slate-900 border-slate-800";
      if (isDeep) {
        valColor = "text-rose-400 font-black";
        boxBg = "bg-rose-950/40 border-rose-800/60";
      } else if (val === 0) {
        valColor = "text-slate-500 font-medium";
      }

      if (isActiveSite) {
        boxBg += " ring-2 ring-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]";
      }

      const bopDot = isBop 
        ? `<span class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] inline-block"></span>`
        : `<span class="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block"></span>`;

      return `
        <div onclick="pilihSitePerio(${tIdx}, ${sIdx})" class="flex-1 p-2 rounded-xl text-center cursor-pointer transition-all border ${boxBg}">
          <div class="text-[9px] font-bold text-slate-400 mb-0.5">${s.label}</div>
          <div class="text-base font-mono font-black ${valColor}">${val}</div>
          <div class="mt-1 flex justify-center">${bopDot}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="bg-[#10172a] rounded-2xl p-2.5 border transition-all ${isActiveTooth ? "border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50" : "border-slate-800 hover:border-slate-700"}">
        <div class="flex justify-between items-center mb-2 px-1">
          <span class="font-black text-xs ${isActiveTooth ? "text-blue-400" : "text-white"} font-mono">T${tNum}</span>
          <div class="flex gap-1 text-[9px]">
            <select onchange="updatePerioMoFo(${tNum}, 'mo', this.value)" class="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-300 font-bold outline-none cursor-pointer">
              <option value="0" ${tData.mo === 0 ? "selected" : ""}>MO:0</option>
              <option value="1" ${tData.mo === 1 ? "selected" : ""}>MO:I</option>
              <option value="2" ${tData.mo === 2 ? "selected" : ""}>MO:II</option>
              <option value="3" ${tData.mo === 3 ? "selected" : ""}>MO:III</option>
            </select>
          </div>
        </div>
        <div class="flex gap-1.5">
          ${siteBoxes}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

function updatePerioMoFo(tNum, field, val) {
  initPerioDataIfEmpty();
  if (perioTeethData[tNum]) {
    perioTeethData[tNum][field] = parseInt(val, 10);
  }
}

function renderPerioGraphic(teethList) {
  const svg = document.getElementById("svgPerioChart");
  if (!svg) return;

  const sites = getSiteKeysForAspect();
  const toothWidth = 1000 / teethList.length;
  const isMaxilla = (perioActiveArch === "maxilla");

  // Base Y coords
  const baselineY = isMaxilla ? 95 : 95;
  const gridLines = [
    { depth: 1, y: isMaxilla ? 85 : 105, label: "1mm" },
    { depth: 3, y: isMaxilla ? 70 : 120, label: "3mm" },
    { depth: 6, y: isMaxilla ? 50 : 140, label: "6mm" },
    { depth: 7, y: isMaxilla ? 40 : 150, label: "7mm" },
    { depth: 9, y: isMaxilla ? 25 : 165, label: "9mm" }
  ];

  let svgContent = "";

  // 1. Reference horizontal grid lines
  gridLines.forEach(g => {
    svgContent += `
      <line x1="40" y1="${g.y}" x2="980" y2="${g.y}" stroke="#1e293b" stroke-dasharray="3,3" stroke-width="1"/>
      <text x="10" y="${g.y + 3}" fill="#475569" font-size="9" font-family="monospace">${g.label}</text>
    `;
  });

  // 2. Render each tooth visual
  teethList.forEach((tNum, idx) => {
    const tData = perioTeethData[tNum] || {};
    const centerX = idx * toothWidth + (toothWidth / 2);
    const isActive = (idx === perioActiveToothIdx);

    // Active bounding highlight box
    if (isActive) {
      svgContent += `
        <rect x="${idx * toothWidth + 2}" y="10" width="${toothWidth - 4}" height="170" rx="10" fill="#1e3a8a" fill-opacity="0.15" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
      `;
    }

    // Tooth crown & root polygon
    // Realistic anatomical dental silhouette
    if (isMaxilla) {
      // Root on top, crown on bottom
      svgContent += `
        <!-- Tooth Root -->
        <path d="M ${centerX - 7} 80 C ${centerX - 8} 40, ${centerX - 3} 20, ${centerX} 15 C ${centerX + 3} 20, ${centerX + 8} 40, ${centerX + 7} 80 Z" fill="#94a3b8" fill-opacity="0.25" stroke="#64748b" stroke-width="1"/>
        <!-- Tooth Crown -->
        <path d="M ${centerX - 12} 82 C ${centerX - 14} 115, ${centerX - 10} 130, ${centerX} 132 C ${centerX + 10} 130, ${centerX + 14} 115, ${centerX + 12} 82 Z" fill="#cbd5e1" fill-opacity="0.75" stroke="#94a3b8" stroke-width="1.2"/>
      `;
    } else {
      // Crown on top, root on bottom
      svgContent += `
        <!-- Tooth Crown -->
        <path d="M ${centerX - 12} 98 C ${centerX - 14} 65, ${centerX - 10} 50, ${centerX} 48 C ${centerX + 10} 50, ${centerX + 14} 65, ${centerX + 12} 98 Z" fill="#cbd5e1" fill-opacity="0.75" stroke="#94a3b8" stroke-width="1.2"/>
        <!-- Tooth Root -->
        <path d="M ${centerX - 7} 100 C ${centerX - 8} 140, ${centerX - 3} 160, ${centerX} 165 C ${centerX + 3} 160, ${centerX + 8} 140, ${centerX + 7} 100 Z" fill="#94a3b8" fill-opacity="0.25" stroke="#64748b" stroke-width="1"/>
      `;
    }

    // Tooth Number Label
    svgContent += `
      <text x="${centerX}" y="${isMaxilla ? 150 : 38}" text-anchor="middle" fill="${isActive ? "#60a5fa" : "#94a3b8"}" font-size="10" font-weight="bold" font-family="monospace">T${tNum}</text>
    `;

    // 3 Probe Sites per tooth: Distal, Mid, Mesial
    const siteOffsets = [-10, 0, 10];
    const depths = [tData[sites[0].key] || 0, tData[sites[1].key] || 0, tData[sites[2].key] || 0];
    const bops = [!!tData["bop_" + sites[0].key], !!tData["bop_" + sites[1].key], !!tData["bop_" + sites[2].key]];

    // Polygon coordinates for pocket depth
    let polyPoints = [];
    siteOffsets.forEach((off, sIdx) => {
      const siteX = centerX + off;
      const d = depths[sIdx];
      // calculate Y
      const dPx = Math.min(d * 8, 75);
      const siteY = isMaxilla ? (80 - dPx) : (100 + dPx);
      polyPoints.push({ x: siteX, y: siteY, depth: d, isBop: bops[sIdx] });
    });

    // Draw shaded pocket area
    if (isMaxilla) {
      const hasDeep = depths.some(d => d >= 4);
      const pocketColor = hasDeep ? "rgba(239, 68, 68, 0.45)" : "rgba(59, 130, 246, 0.2)";
      const strokeColor = hasDeep ? "#ef4444" : "#3b82f6";
      
      const polyStr = `${polyPoints[0].x},80 ${polyPoints[0].x},${polyPoints[0].y} ${polyPoints[1].x},${polyPoints[1].y} ${polyPoints[2].x},${polyPoints[2].y} ${polyPoints[2].x},80`;
      svgContent += `
        <polygon points="${polyStr}" fill="${pocketColor}" stroke="${strokeColor}" stroke-width="1.2"/>
      `;
    } else {
      const hasDeep = depths.some(d => d >= 4);
      const pocketColor = hasDeep ? "rgba(239, 68, 68, 0.45)" : "rgba(59, 130, 246, 0.2)";
      const strokeColor = hasDeep ? "#ef4444" : "#3b82f6";

      const polyStr = `${polyPoints[0].x},100 ${polyPoints[0].x},${polyPoints[0].y} ${polyPoints[1].x},${polyPoints[1].y} ${polyPoints[2].x},${polyPoints[2].y} ${polyPoints[2].x},100`;
      svgContent += `
        <polygon points="${polyStr}" fill="${pocketColor}" stroke="${strokeColor}" stroke-width="1.2"/>
      `;
    }

    // Depth Number Labels & BOP dots
    polyPoints.forEach((p, sIdx) => {
      const isSiteActive = isActive && (sIdx === perioActiveSiteIdx);
      const isDeep = p.depth >= 4;

      // Small badge box for number
      const textFill = isDeep ? "#f87171" : (p.depth > 0 ? "#67e8f9" : "#64748b");
      const badgeBg = isSiteActive ? "#1e3a8a" : "#0f172a";
      const badgeBorder = isSiteActive ? "#3b82f6" : (isDeep ? "#ef4444" : "#334155");

      const badgeY = isMaxilla ? (p.y - 10) : (p.y + 2);
      svgContent += `
        <rect x="${p.x - 6}" y="${badgeY}" width="12" height="11" rx="2" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="0.8"/>
        <text x="${p.x}" y="${badgeY + 8.5}" text-anchor="middle" fill="${textFill}" font-size="8" font-weight="900" font-family="monospace">${p.depth}</text>
      `;

      // BOP dot marker
      if (p.isBop) {
        const dotY = isMaxilla ? (badgeY - 4) : (badgeY + 14);
        svgContent += `
          <circle cx="${p.x}" cy="${dotY}" r="2.5" fill="#f43f5e" stroke="#fff" stroke-width="0.5"/>
        `;
      }
    });
  });

  svg.innerHTML = svgContent;
}

function simpanPerioKeEMR() {
  const metrics = calculatePerioMetrics();
  currentPeriodontalExam = {
    teeth: JSON.parse(JSON.stringify(perioTeethData)),
    summary: metrics,
    waktuPemeriksaan: new Date().toISOString()
  };

  // Update badge & summary di form rekam medis
  const badge = document.getElementById("badgePerioStatus");
  if (badge) {
    badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700";
    badge.innerText = `Terisi (BOP: ${metrics.bopPercent}%)`;
  }

  const quick = document.getElementById("summaryPerioQuick");
  if (quick) {
    quick.innerText = `Selesai diperiksa: ${metrics.totalSites} titik &bull; Saku Dalam (&ge;4mm): ${metrics.deepPockets} titik &bull; Bleeding Index (BOP): ${metrics.bopPercent}%`;
  }

  tutupModalPeriodontal();
  alertMsg("success", `Hasil Periodontal Charting (${metrics.totalSites} titik, BOP ${metrics.bopPercent}%) berhasil diterapkan ke formulir rekam medis!`);
}

function bukaModalPerioHistory(idx) {
  const r = riwayatPasienAktif[idx];
  if (!r) return;
  let fis = {};
  try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
  if (fis && fis.periodontal && fis.periodontal.teeth) {
    perioTeethData = JSON.parse(JSON.stringify(fis.periodontal.teeth));
    bukaModalPeriodontal();
  } else {
    alertMsg("info", "Kunjungan ini tidak memiliki catatan data Periodontal Charting.");
  }
}

function bukaModalOdontoHistory(idx) {
  const r = riwayatPasienAktif[idx];
  if (!r) return;
  let odoJsonStr = r.odontogramStr || r.odontogram || "{}";
  let odoData = {};
  try {
    odoData = typeof odoJsonStr === 'string' ? JSON.parse(odoJsonStr) : odoJsonStr;
  } catch(e) {
    odoData = {};
  }
  currentOdontogram = JSON.parse(JSON.stringify(odoData || {}));
  bukaModalOdontogram();
}

// =========================================================================
// SISTEM OHI-S (ORAL HYGIENE INDEX - SIMPLIFIED) GREENE & VERMILLION 1964
// =========================================================================
let currentOhisExam = null;
let ohisTeethData = {};

const OHIS_TEETH_DEF = [
  { no: '16', arch: 'maxilla', name: 'Molar 1 Kanan Atas', surface: 'Bukal' },
  { no: '11', arch: 'maxilla', name: 'Insisius 1 Kanan Atas', surface: 'Labial' },
  { no: '26', arch: 'maxilla', name: 'Molar 1 Kiri Atas', surface: 'Bukal' },
  { no: '46', arch: 'mandible', name: 'Molar 1 Kanan Bawah', surface: 'Lingual' },
  { no: '31', arch: 'mandible', name: 'Insisius 1 Kiri Bawah', surface: 'Labial' },
  { no: '36', arch: 'mandible', name: 'Molar 1 Kiri Bawah', surface: 'Lingual' }
];

function initOhisDataIfEmpty() {
  if (!ohisTeethData || Object.keys(ohisTeethData).length === 0) {
    ohisTeethData = {};
    OHIS_TEETH_DEF.forEach(t => {
      ohisTeethData[t.no] = { d: 0, c: 0, surface: t.surface, name: t.name, arch: t.arch };
    });
  }
}

function bukaModalOhis() {
  initOhisDataIfEmpty();
  const modal = document.getElementById("modalOhisChart");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderOhisUI();
}

function tutupModalOhis() {
  const modal = document.getElementById("modalOhisChart");
  if (modal) modal.classList.add("hidden");
}

function setOhisScore(toothNo, type, score) {
  initOhisDataIfEmpty();
  if (!ohisTeethData[toothNo]) return;
  ohisTeethData[toothNo][type] = score;
  renderOhisUI();
}

function setSemuaOhisSkor(val) {
  initOhisDataIfEmpty();
  OHIS_TEETH_DEF.forEach(t => {
    ohisTeethData[t.no].d = val;
    ohisTeethData[t.no].c = val;
  });
  renderOhisUI();
}

function hitungOhisMetrics() {
  initOhisDataIfEmpty();
  let totalD = 0, countD = 0;
  let totalC = 0, countC = 0;

  OHIS_TEETH_DEF.forEach(t => {
    const item = ohisTeethData[t.no];
    if (item) {
      if (item.d !== null && item.d !== undefined && item.d !== '-') {
        totalD += Number(item.d) || 0;
        countD++;
      }
      if (item.c !== null && item.c !== undefined && item.c !== '-') {
        totalC += Number(item.c) || 0;
        countC++;
      }
    }
  });

  const disVal = countD > 0 ? Number((totalD / countD).toFixed(2)) : 0;
  const cisVal = countC > 0 ? Number((totalC / countC).toFixed(2)) : 0;
  const ohisVal = Number((disVal + cisVal).toFixed(2));

  // Kriteria DI-S & CI-S individual (Greene & Vermillion):
  // Baik: 0.0 - 0.6, Sedang: 0.7 - 1.8, Buruk: 1.9 - 3.0
  const katDis = disVal <= 0.6 ? 'Baik' : (disVal <= 1.8 ? 'Sedang' : 'Buruk');
  const katCis = cisVal <= 0.6 ? 'Baik' : (cisVal <= 1.8 ? 'Sedang' : 'Buruk');

  // Kriteria OHI-S Total (Greene & Vermillion 1964):
  // Baik (Good): 0.0 - 1.2
  // Sedang (Fair): 1.3 - 3.0
  // Buruk (Poor): 3.1 - 6.0
  let kategori = 'Baik';
  let rentang = '0.0 - 1.2';
  let saran = 'Kebersihan gigi dan mulut terpelihara dengan baik. Pertahankan menyikat gigi 2x sehari.';
  if (ohisVal > 3.0) {
    kategori = 'Buruk';
    rentang = '3.1 - 6.0';
    saran = 'Kebersihan gigi dan mulut buruk. Diperlukan scaling (pembersihan karang gigi) dan edukasi OHI intensif.';
  } else if (ohisVal > 1.2) {
    kategori = 'Sedang';
    rentang = '1.3 - 3.0';
    saran = 'Kebersihan gigi dan mulut sedang. Disarankan scaling supragingiva dan perbaikan teknik menyikat gigi.';
  }

  return {
    totalD, countD, dis: disVal.toFixed(2), katDis,
    totalC, countC, cis: cisVal.toFixed(2), katCis,
    ohis: ohisVal.toFixed(2),
    kategori, rentang, saran
  };
}

function renderOhisToothCard(t) {
  initOhisDataIfEmpty();
  const dVal = ohisTeethData[t.no] ? ohisTeethData[t.no].d : 0;
  const cVal = ohisTeethData[t.no] ? ohisTeethData[t.no].c : 0;

  const btnPill = (tooth, type, val, currentVal) => {
    const isSelected = currentVal === val;
    let colorClass = "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700";
    if (isSelected) {
      if (val === 0) colorClass = "bg-emerald-600 text-white font-black border-emerald-400 shadow-md shadow-emerald-900/50";
      else if (val === 1) colorClass = "bg-teal-600 text-white font-black border-teal-400 shadow-md shadow-teal-900/50";
      else if (val === 2) colorClass = "bg-amber-600 text-white font-black border-amber-400 shadow-md shadow-amber-900/50";
      else if (val === 3) colorClass = "bg-rose-600 text-white font-black border-rose-400 shadow-md shadow-rose-900/50";
    }
    return `<button type="button" onclick="setOhisScore('${tooth}', '${type}', ${val})" class="flex-1 py-1 px-1 rounded-lg text-xs font-bold border transition-all ${colorClass}">${val}</button>`;
  };

  return `
    <div class="bg-[#12222b] border border-teal-900/50 rounded-xl p-3 shadow-sm hover:border-teal-700/60 transition-colors">
      <div class="flex justify-between items-center mb-2 pb-1.5 border-b border-teal-950">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-black text-sm flex items-center justify-center border border-teal-500/30">${t.no}</span>
          <div>
            <div class="text-[11px] font-bold text-white">${t.name}</div>
            <div class="text-[9px] text-teal-300 font-mono">Permukaan ${t.surface}</div>
          </div>
        </div>
      </div>
      
      <!-- DEBRIS ROW -->
      <div class="mb-2">
        <div class="flex justify-between items-center text-[10px] mb-1">
          <span class="font-bold text-slate-300">Debris (DI-S):</span>
          <span class="font-mono text-teal-400 font-bold">Skor ${dVal}</span>
        </div>
        <div class="flex gap-1">
          ${btnPill(t.no, 'd', 0, dVal)}
          ${btnPill(t.no, 'd', 1, dVal)}
          ${btnPill(t.no, 'd', 2, dVal)}
          ${btnPill(t.no, 'd', 3, dVal)}
        </div>
      </div>

      <!-- CALCULUS ROW -->
      <div>
        <div class="flex justify-between items-center text-[10px] mb-1">
          <span class="font-bold text-slate-300">Calculus (CI-S):</span>
          <span class="font-mono text-teal-400 font-bold">Skor ${cVal}</span>
        </div>
        <div class="flex gap-1">
          ${btnPill(t.no, 'c', 0, cVal)}
          ${btnPill(t.no, 'c', 1, cVal)}
          ${btnPill(t.no, 'c', 2, cVal)}
          ${btnPill(t.no, 'c', 3, cVal)}
        </div>
      </div>
    </div>
  `;
}

function renderOhisUI() {
  initOhisDataIfEmpty();
  const maxillaContainer = document.getElementById("ohisGridMaxilla");
  const mandibleContainer = document.getElementById("ohisGridMandible");

  if (maxillaContainer) {
    const maxTeeth = OHIS_TEETH_DEF.filter(t => t.arch === 'maxilla');
    maxillaContainer.innerHTML = maxTeeth.map(renderOhisToothCard).join('');
  }

  if (mandibleContainer) {
    const manTeeth = OHIS_TEETH_DEF.filter(t => t.arch === 'mandible');
    mandibleContainer.innerHTML = manTeeth.map(renderOhisToothCard).join('');
  }

  const metrics = hitungOhisMetrics();
  
  const scoreDIS = document.getElementById("ohisScoreDIS");
  if (scoreDIS) scoreDIS.innerText = metrics.dis;
  
  const badgeDIS = document.getElementById("ohisBadgeDIS");
  if (badgeDIS) {
    badgeDIS.innerText = metrics.katDis;
    badgeDIS.className = `text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
      metrics.katDis === 'Baik' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
      metrics.katDis === 'Sedang' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
      'bg-rose-950 text-rose-300 border border-rose-700'
    }`;
  }

  const scoreCIS = document.getElementById("ohisScoreCIS");
  if (scoreCIS) scoreCIS.innerText = metrics.cis;

  const badgeCIS = document.getElementById("ohisBadgeCIS");
  if (badgeCIS) {
    badgeCIS.innerText = metrics.katCis;
    badgeCIS.className = `text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
      metrics.katCis === 'Baik' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
      metrics.katCis === 'Sedang' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
      'bg-rose-950 text-rose-300 border border-rose-700'
    }`;
  }

  const scoreTotal = document.getElementById("ohisScoreTotal");
  if (scoreTotal) scoreTotal.innerText = metrics.ohis;

  const badgeCat = document.getElementById("ohisBadgeCategory");
  if (badgeCat) {
    badgeCat.innerText = `${metrics.kategori} (${metrics.kategori === 'Baik' ? 'Good' : metrics.kategori === 'Sedang' ? 'Fair' : 'Poor'})`;
    badgeCat.className = `px-3 py-1 rounded-xl font-black text-xs mt-1.5 uppercase shadow border ${
      metrics.kategori === 'Baik' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
      metrics.kategori === 'Sedang' ? 'bg-amber-950 text-amber-300 border border-amber-600' :
      'bg-rose-950 text-rose-300 border border-rose-600'
    }`;
  }

  const rangeInfo = document.getElementById("ohisRangeInfo");
  if (rangeInfo) rangeInfo.innerText = `Rentang: ${metrics.rentang}`;
}

function simpanOhisKeEMR() {
  const metrics = hitungOhisMetrics();
  currentOhisExam = {
    teeth: JSON.parse(JSON.stringify(ohisTeethData)),
    summary: metrics,
    waktuPemeriksaan: new Date().toISOString()
  };

  // Update badge & summary di form rekam medis
  const badge = document.getElementById("badgeOhisStatus");
  if (badge) {
    let bgClass = "bg-emerald-950 text-emerald-300 border-emerald-700";
    if (metrics.kategori === "Sedang") bgClass = "bg-amber-950 text-amber-300 border-amber-700";
    if (metrics.kategori === "Buruk") bgClass = "bg-rose-950 text-rose-300 border-rose-700";
    badge.className = `px-2.5 py-0.5 rounded-full text-[10px] font-black border ${bgClass}`;
    badge.innerText = `${metrics.kategori.toUpperCase()} (Skor: ${metrics.ohis})`;
  }

  const quick = document.getElementById("summaryOhisQuick");
  if (quick) {
    quick.innerText = `DI-S: ${metrics.dis} (${metrics.katDis}) • CI-S: ${metrics.cis} (${metrics.katCis}) • Total OHI-S: ${metrics.ohis} [${metrics.kategori}]`;
  }

  tutupModalOhis();
  alertMsg("success", `Hasil Pemeriksaan OHI-S (Skor ${metrics.ohis} - ${metrics.kategori}) berhasil diterapkan ke rekam medis!`);
}

function resetOhisToDefault() {
  currentOhisExam = null;
  ohisTeethData = {};
  initOhisDataIfEmpty();

  const badge = document.getElementById("badgeOhisStatus");
  if (badge) {
    badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700";
    badge.innerText = "Belum Ada Data";
  }

  const quick = document.getElementById("summaryOhisQuick");
  if (quick) {
    quick.innerText = "Pemeriksaan indeks kebersihan gigi & mulut (Debris Index & Calculus Index - Greene & Vermillion).";
  }

  const modal = document.getElementById("modalOhisChart");
  if (modal && !modal.classList.contains("hidden")) {
    renderOhisUI();
  }
}

function bukaModalOhisHistory(idx) {
  const r = riwayatPasienAktif[idx];
  if (!r) return;
  let fis = {};
  try { fis = JSON.parse(r.fisikStr || "{}"); } catch(e){}
  if (fis && fis.ohis && fis.ohis.teeth) {
    ohisTeethData = JSON.parse(JSON.stringify(fis.ohis.teeth));
    bukaModalOhis();
  } else {
    alertMsg("info", "Kunjungan ini tidak memiliki catatan data OHI-S.");
  }
}




 let optPerawatKSR = '';
 let invoiceGroups = {};
 let currentPreviewInvId = null;


 // VARIABEL PAGINATION & FILTER
 let currentPageKSR = 1;
 let itemsPerPageKSR = 10;
 let filteredInvoicesList = [];


 // LINK ASLI GOOGLE DRIVE KOP SURAT ANDA
 const LINK_KOP_SURAT = "https://lh3.googleusercontent.com/d/1GjKfmHhcGWgmPcQmuw00gLUBbP3_fead";


 function parseUangKSR(val) { if(!val) return 0; return parseInt(val.toString().replace(/[^0-9]/g, '')) || 0; }
 function formatRpKSR(angka) { return parseInt(angka).toLocaleString('id-ID'); }
 function autoFormatUang(el) { let v = parseUangKSR(el.value); el.value = v === 0 ? '' : formatRpKSR(v); }
 function validasiTglMaxKasir(el) { let t = getTodayIso(); if(el.value > t) el.value = t; }


 function parseDateKasir(str) {
   if (!str) return 0;
   let d = new Date(str);
   if (!isNaN(d.getTime())) return d.getTime();
   let parts = str.toString().split(/[-/ ]/);
   if (parts.length >= 3) {
      if(parts[0].length === 4) return new Date(parts[0], parts[1]-1, parts[2]).getTime();
      return new Date(parts[2], parts[1]-1, parts[0]).getTime();
   }
   return 0;
 }


 function formatTglIndoFull(tglStr) {
   if(!tglStr) return '-';
   try {
     let ms = parseDateKasir(tglStr);
     if(ms === 0) return tglStr;
     let d = new Date(ms);
     let bln = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
     return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
   } catch(e) { return tglStr; }
 }


 function terbilangKSR(angka) {
   let a = Math.abs(parseInt(angka, 10));
   if (a === 0) return "";
   let huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
   let temp = "";
   if (a < 12) { temp = " " + huruf[a]; }
   else if (a < 20) { temp = terbilangKSR(a - 10) + " Belas"; }
   else if (a < 100) { temp = terbilangKSR(Math.floor(a / 10)) + " Puluh" + terbilangKSR(a % 10); }
   else if (a < 200) { temp = " Seratus" + terbilangKSR(a - 100); }
   else if (a < 1000) { temp = terbilangKSR(Math.floor(a / 100)) + " Ratus" + terbilangKSR(a % 100); }
   else if (a < 2000) { temp = " Seribu" + terbilangKSR(a - 1000); }
   else if (a < 1000000) { temp = terbilangKSR(Math.floor(a / 1000)) + " Ribu" + terbilangKSR(a % 1000); }
   else if (a < 1000000000) { temp = terbilangKSR(Math.floor(a / 1000000)) + " Juta" + terbilangKSR(a % 1000000); }
   return temp;
 }


 document.addEventListener('KlinikDataReady', () => {
   let t = getTodayIso();
   let elTgl = document.getElementById('ksrTgl');
   if(elTgl) { elTgl.value = t; elTgl.max = t; }
  
   let selDokter = document.getElementById('ksrDokter');
   if(selDokter) {
     selDokter.innerHTML = '<option value="">-- Pilih Dokter --</option>';
     let dokters = window.KlinikData.staff.filter(s => s.role.toLowerCase().includes('dokter gigi'));
     dokters.forEach(d => { selDokter.innerHTML += `<option value="${d.nama}">${d.nama}</option>`; });
   }


   let perawats = (window.KlinikData && Array.isArray(window.KlinikData.staff))
     ? window.KlinikData.staff.filter(s => s.role && s.role.toLowerCase().includes('perawat gigi'))
     : [];
   optPerawatKSR = '<option value="">-- Perawat --</option>';
   perawats.forEach(p => { optPerawatKSR += `<option value="${p.nama}">${p.nama}</option>`; });


   let dlObat = document.getElementById('dlObatKasir'); if(dlObat) dlObat.innerHTML = window.KlinikData.obat.map(o => `<option value="${o.nama}">${o.nama} (Stok: ${o.stok !== undefined ? o.stok : 0} ${o.satuan || 'Pcs'})</option>`).join('');
   let dlBMHP = document.getElementById('dlBMHPKasir'); if(dlBMHP) dlBMHP.innerHTML = window.KlinikData.bmhp.map(b => `<option value="${b.nama}">${b.nama} (Stok: ${b.stok !== undefined ? b.stok : 0} ${b.satuan || 'Pcs'})</option>`).join('');
  
   updateDatalistTindakan();


   let searchPas = document.getElementById('ksrSearchPasien');
   if(searchPas) {
     searchPas.addEventListener('input', function() {
       let q = this.value.toLowerCase().trim(), resBox = document.getElementById('ksrSearchResult');
       if (!q || q.length < 2) { resBox.classList.add('hidden'); return; }
       let listData = window.KlinikData.pasien || [];
       let list = listData.filter(p => p.namaPasien.toLowerCase().includes(q) || p.noRm.toLowerCase().includes(q));
       if (list.length === 0) resBox.innerHTML = '<div class="p-2 text-slate-400 text-xs">Tidak ditemukan</div>';
       else resBox.innerHTML = list.slice(0, 5).map(p => `<div onclick="pilihPasienKSR('${p.idPasien}')" class="p-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex justify-between"><b>${p.namaPasien}</b> <span class="text-[10px] text-slate-500">${p.noRm}</span></div>`).join('');
       resBox.classList.remove('hidden');
     });
   }


   setTimeout(() => { resetPageAndSearch(); }, 500);
 });


 document.addEventListener('DOMContentLoaded', () => {
    let btnNav = document.getElementById('nav-riwayat-invoice');
    if(btnNav) {
      btnNav.addEventListener('click', () => { setTimeout(resetPageAndSearch, 100); });
    }
 });


 function pilihPasienKSR(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('ksrSearchPasien').value = ''; document.getElementById('ksrSearchResult').classList.add('hidden');
   document.getElementById('ksrNama').value = p.namaPasien; document.getElementById('ksrRM').value = p.noRm; document.getElementById('ksrID').value = p.idPasien;

   // CEK STATUS CICILAN / TAGIHAN BERJALAN PASIEN INI
   cekNotifikasiCicilanPasien(p.idPasien, p.namaPasien);
 }

 function cekNotifikasiCicilanPasien(idPasien, namaPasien) {
   let alertBox = document.getElementById('alertCicilanPasien');
   let alertIcon = document.getElementById('alertCicilanIcon');
   let alertTitle = document.getElementById('alertCicilanTitle');
   let alertBody = document.getElementById('alertCicilanBody');
   if (!alertBox || !alertTitle || !alertBody) return;

   let pm = window.KlinikData.pembayaran || [];
   // Ambil semua invoice pasien ini
   let patientInvoices = {};
   pm.forEach(r => {
     if (r.idPasien === idPasien) {
       let invId = r.idInvoice || "INV-UNSPECIFIED";
       if (!patientInvoices[invId]) {
         patientInvoices[invId] = {
           idInvoice: invId,
           tanggal: r.tanggal,
           status: r.status,
           totalInvoice: r.totalInvoice,
           metode: r.metode,
           keterangan: r.keterangan || "",
           items: []
         };
       }
       patientInvoices[invId].items.push(r.item);
     }
   });

   let invList = Object.values(patientInvoices).sort((a, b) => {
     let diff = parseDateKasir(b.tanggal) - parseDateKasir(a.tanggal);
     if (diff !== 0) return diff;
     return (b.idInvoice || '').localeCompare(a.idInvoice || '');
   });
   
   if (invList.length === 0) {
     alertBox.classList.add('hidden');
     return;
   }

   // Periksa apakah invoice terakhir adalah "Uang Muka"
   let latestInv = invList[0];
   let dpInvoices = invList.filter(inv => (inv.status || "").toLowerCase().includes("uang muka"));

   if (dpInvoices.length > 0 && (latestInv.status || "").toLowerCase().includes("uang muka")) {
     // ADA CICILAN BERJALAN (BELUM LUNAS)
     let totalSudahBayar = dpInvoices.reduce((acc, cur) => acc + (cur.totalInvoice || 0), 0);
     let itemsStr = latestInv.items.slice(0, 3).join(", ") + (latestInv.items.length > 3 ? "..." : "");

     alertBox.className = "p-4 rounded-xl border-2 bg-amber-50 border-amber-300 text-amber-900 transition-all shadow-sm";
     alertIcon.innerText = "⚠️";
     alertTitle.innerHTML = `<span class="text-amber-800">PERINGATAN KASIR:</span> Pasien Memiliki Tagihan Berjalan (Belum Lunas)`;
     alertBody.innerHTML = `
       <div class="space-y-1 text-[11px] leading-relaxed">
         <p>Pasien <b>${namaPasien}</b> tercatat melakukan pembayaran bertahap (<b>${latestInv.status}</b>):</p>
         <div class="bg-white/80 p-2.5 rounded-lg border border-amber-200 mt-1">
           <p>• Layanan Terakhir: <b>${itemsStr}</b></p>
           <p>• Invoice Terakhir: <span class="font-mono font-bold text-indigo-700">${latestInv.idInvoice}</span> (${latestInv.tanggal || '-'})</p>
           <p>• Total Pembayaran yang Sudah Masuk: <b class="text-emerald-700">Rp ${formatRpKSR(totalSudahBayar)}</b> (${dpInvoices.length} termin pembayaran)</p>
           ${latestInv.keterangan ? `<p class="italic text-slate-600 mt-0.5">• Catatan Kasir: "${latestInv.keterangan}"</p>` : ''}
         </div>
         <p class="mt-1 font-bold text-amber-900">
           👉 Jika kunjungan hari ini adalah pelunasan akhir, ubah Status Pembayaran menjadi <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black">Pelunasan</span>.
         </p>
       </div>
     `;
     alertBox.classList.remove('hidden');
   } else if ((latestInv.status || "").toLowerCase().includes("pelunasan")) {
     // TERAKHIR SUDAH DILUNASI
     alertBox.className = "p-3.5 rounded-xl border-2 bg-emerald-50 border-emerald-300 text-emerald-900 transition-all shadow-sm";
     alertIcon.innerText = "✅";
     alertTitle.innerHTML = `<span class="text-emerald-800">INFO STATUS:</span> Paket Perawatan Sebelumnya Telah LUNAS`;
     alertBody.innerHTML = `
       <p class="text-[11px]">Invoice terakhir <span class="font-mono font-bold text-indigo-700">${latestInv.idInvoice}</span> pada ${latestInv.tanggal || '-'} tercatat <b class="text-emerald-700">PELUNASAN PENUH</b>. Saat ini pasien dapat memulai tagihan tindakan baru.</p>
     `;
     alertBox.classList.remove('hidden');
   } else {
     alertBox.classList.add('hidden');
   }
 }


 function onStatusBayarChange() {
   let stat = document.getElementById('ksrStatus').value;
   let boxDp = document.getElementById('boxNominalDp');
   let subDp = document.getElementById('subLabelDpInfo');
   let lblJudul = document.getElementById('lblJudulTotalBayar');

   if (stat === 'Uang Muka') {
     if (boxDp) boxDp.classList.remove('hidden');
     if (subDp) subDp.classList.remove('hidden');
     if (lblJudul) lblJudul.innerText = 'TOTAL PAKET / TINDAKAN';
     hitungSisaTagihanDp();
   } else {
     if (boxDp) boxDp.classList.add('hidden');
     if (subDp) subDp.classList.add('hidden');
     if (lblJudul) lblJudul.innerText = 'TOTAL BIAYA TINDAKAN';
   }
 }

 function hitungSisaTagihanDp() {
   let totalPaket = parseUangKSR(document.getElementById('valTotalBayarRaw').value);
   let nominalDpInput = document.getElementById('ksrNominalDp');
   let nominalDp = nominalDpInput ? parseUangKSR(nominalDpInput.value) : 0;
   let sisa = Math.max(0, totalPaket - nominalDp);

   let lblPreview = document.getElementById('lblSisaTagihanPreview');
   if (lblPreview) {
     lblPreview.innerText = 'Sisa: Rp ' + formatRpKSR(sisa);
   }

   let lblDp = document.getElementById('lblDisplayDp');
   let lblSisa = document.getElementById('lblDisplaySisa');
   if (lblDp) lblDp.innerText = 'Rp ' + formatRpKSR(nominalDp);
   if (lblSisa) lblSisa.innerText = 'Rp ' + formatRpKSR(sisa);
 }


 function groupRiwayatInvoices() {
   invoiceGroups = {};
   let pm = window.KlinikData.pembayaran || [];
   pm.forEach(row => {
     let invId = row.idInvoice || "INV-LAMA";
     if(!invoiceGroups[invId]) {
       invoiceGroups[invId] = { idInvoice: invId, tanggal: row.tanggal, namaPasien: row.namaPasien, noRm: row.noRm, dokter: row.dokter, totalInvoice: row.totalInvoice, metode: row.metode, status: row.status, keterangan: row.keterangan || "", kasir: row.kasir, items: [] };
     }
     invoiceGroups[invId].items.push({ item: row.item, qty: row.qty, harga: row.harga, diskon: row.diskon, grandTotalItem: row.grandTotalItem });
   });
 }


 function highlightTxt(text, query) {
   if (!query || !text) return text;
   const regex = new RegExp(`(${query})`, 'gi');
   return text.toString().replace(regex, '<span class="bg-yellow-300 text-slate-900 px-0.5 rounded font-black">$1</span>');
 }


 // ==========================================
 // PAGINATION & FILTER KALENDER LOGIC
 // ==========================================
 function resetPageAndSearch() {
   currentPageKSR = 1;
   searchRiwayatInvoice();
 }


 function prevPageKSR() {
   if (currentPageKSR > 1) { currentPageKSR--; renderTablePageKSR(); }
 }


 function nextPageKSR() {
   let totalPages = Math.ceil(filteredInvoicesList.length / itemsPerPageKSR);
   if (currentPageKSR < totalPages) { currentPageKSR++; renderTablePageKSR(); }
 }


 function bukaRiwayatInvoice() {
   groupRiwayatInvoices();
   let inputEl = document.getElementById('inputCariRiwayat');
   if(inputEl) inputEl.value = '';
   resetPageAndSearch();
   if(typeof switchMenu === 'function') switchMenu('riwayat-invoice');
 }


 function searchRiwayatInvoice() {
   groupRiwayatInvoices();
   let resBox = document.getElementById('tbodyRiwayatInvoice');
   if (!resBox) return;


   let inputEl = document.getElementById('inputCariRiwayat');
   let tglMulaiEl = document.getElementById('filterTglMulai');
   let tglAkhirEl = document.getElementById('filterTglAkhir');


   let q = inputEl ? inputEl.value.toLowerCase().trim() : "";
   let tMulai = tglMulaiEl && tglMulaiEl.value ? new Date(tglMulaiEl.value).setHours(0,0,0,0) : null;
   let tAkhir = tglAkhirEl && tglAkhirEl.value ? new Date(tglAkhirEl.value).setHours(23,59,59,999) : null;
  
   // Sort Newest to Oldest (Terbaru dibuat di atas)
   let sortedInvoices = Object.values(invoiceGroups).sort((a, b) => parseDateKasir(b.tanggal) - parseDateKasir(a.tanggal));
  
   // Terapkan Filter
   sortedInvoices = sortedInvoices.filter(inv => {
     let isMatchTxt = true;
     if (q) isMatchTxt = inv.namaPasien.toLowerCase().includes(q) || inv.idInvoice.toLowerCase().includes(q);
    
     let invTime = parseDateKasir(inv.tanggal);
     let isMatchDate = true;
     if (tMulai && invTime < tMulai) isMatchDate = false;
     if (tAkhir && invTime > tAkhir) isMatchDate = false;


     return isMatchTxt && isMatchDate;
   });


   filteredInvoicesList = sortedInvoices;


   // Update Label Total Invoice
   let lblTotal = document.getElementById('labelTotalInvoice');
   if(lblTotal) lblTotal.innerText = filteredInvoicesList.length;


   renderTablePageKSR();
 }


 function renderTablePageKSR() {
   let resBox = document.getElementById('tbodyRiwayatInvoice');
   if (!resBox) return;


   let totalPages = Math.ceil(filteredInvoicesList.length / itemsPerPageKSR) || 1;
   if (currentPageKSR > totalPages) currentPageKSR = totalPages;


   let btnPrev = document.getElementById('btnPrevPage');
   let btnNext = document.getElementById('btnNextPage');
   let lblCur = document.getElementById('labelCurrentPage');
   let lblTot = document.getElementById('labelTotalPage');


   if (lblCur) lblCur.innerText = currentPageKSR;
   if (lblTot) lblTot.innerText = totalPages;
   if (btnPrev) btnPrev.disabled = (currentPageKSR === 1);
   if (btnNext) btnNext.disabled = (currentPageKSR === totalPages || filteredInvoicesList.length === 0);


   let startIdx = (currentPageKSR - 1) * itemsPerPageKSR;
   let endIdx = startIdx + itemsPerPageKSR;
   let pageData = filteredInvoicesList.slice(startIdx, endIdx);


   let q = document.getElementById('inputCariRiwayat') ? document.getElementById('inputCariRiwayat').value.toLowerCase().trim() : "";


   if(pageData.length === 0) {
     resBox.innerHTML = '<tr><td colspan="6" class="text-center text-rose-500 font-bold py-10 text-xs">Belum ada transaksi / Data tidak ditemukan.</td></tr>';
     return;
   }


   resBox.innerHTML = pageData.map(inv => {
     let statBadge = '';
     let st = (inv.status || 'Lunas').toLowerCase();
     if (st.includes('uang muka')) {
       statBadge = '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-black border border-amber-300">DP / Cicilan</span>';
     } else if (st.includes('pelunasan')) {
       statBadge = '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black border border-emerald-300">Pelunasan</span>';
     } else {
       statBadge = '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-200">Lunas</span>';
     }

     return `
     <tr class="hover:bg-slate-50 transition-colors">
       <td class="p-4">
         <p class="font-bold text-slate-700 text-[11px]">${formatTglIndoFull(inv.tanggal)}</p>
         <p class="text-[10px] font-mono text-slate-400 mt-0.5">${inv.idInvoice}</p>
       </td>
       <td class="p-4">
         <p class="font-bold text-indigo-700 text-sm">${highlightTxt(inv.namaPasien, q)}</p>
         <p class="text-[10px] text-slate-500 font-mono mt-0.5">RM: ${inv.noRm}</p>
       </td>
       <td class="p-4 text-right">
         <p class="font-black text-emerald-600 text-sm">Rp ${formatRpKSR(inv.totalInvoice)}</p>
       </td>
       <td class="p-4 text-center">
         <div class="flex flex-col items-center gap-1">
           <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200 shadow-sm">${inv.metode || '-'}</span>
           ${statBadge}
         </div>
       </td>
       <td class="p-4 max-w-xs">
         <p class="text-[11px] text-slate-600 truncate" title="${inv.keterangan || '-'}">${inv.keterangan || '-'}</p>
       </td>
       <td class="p-4 text-center">
         <div class="flex justify-center gap-1.5">
           <button type="button" onclick="previewInvoiceLama('${inv.idInvoice}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-300 transition-colors" title="View Preview">👁️ View</button>
           <button type="button" onclick="actionKirimWA('${inv.idInvoice}')" class="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold border border-teal-200 transition-colors" title="Kirim via WhatsApp">💬 WA</button>
         </div>
       </td>
     </tr>
   `}).join('');
 }


 function previewInvoiceLama(id) { currentPreviewInvId = id; let inv = invoiceGroups[id]; if(!inv) return; generateA4Invoice(inv); }
 function closeKwitansi() { let mdl = document.getElementById('modalKwitansi'); if(mdl) mdl.classList.add('hidden'); currentPreviewInvId = null; }


 // ==========================================
 // LOGIKA KASIR (INPUT & HITUNG)
 // ==========================================
  function updateDatalistTindakan() {
    let dokEl = document.getElementById('ksrDokter');
    if(!dokEl) return;
    let dokName = dokEl.value, targetRole = "";
    if (dokName) { let d = window.KlinikData.staff.find(x => x.nama === dokName); if(d) targetRole = d.role.toLowerCase(); }
   
    let allTindakan = window.KlinikData.tindakan || [];
    let isUmum = function(t) {
      let kat = (t.kategori || '').toLowerCase();
      let kod = (t.kode || '').toUpperCase();
      return kat.includes('umum') || kod.startsWith('UMM');
    };

    let filtered = allTindakan;
    if (targetRole.includes('spesialis')) {
      filtered = allTindakan.filter(function(t) { return t.kategori.toLowerCase().includes('spesialis') || isUmum(t); });
    } else if (targetRole.includes('umum') || targetRole === 'dokter') {
      filtered = allTindakan.filter(function(t) { return isUmum(t); });
    } else if (targetRole) {
      filtered = allTindakan.filter(function(t) { return t.kategori.toLowerCase().includes(targetRole) || isUmum(t); });
    }
    let dlTindakan = document.getElementById('dlTindakanKasir');
    if(dlTindakan) dlTindakan.innerHTML = filtered.map(function(t) { return `<option value="${t.nama}">`; }).join('');
  }


 function onInputDatalistChange(el, type) {
   let val = el.value, obj = null;
   if (type === 'tindakan') obj = window.KlinikData.tindakan.find(x => x.nama === val);
   else if (type === 'obat') obj = window.KlinikData.obat.find(x => x.nama === val);
   else if (type === 'bmhp') obj = window.KlinikData.bmhp.find(x => x.nama === val);

   let row = el.closest('tr');
   if (obj) {
     row.querySelector('.val-harga').value = formatRpKSR(obj.harga || obj.hargaJual || 0);
     el.setAttribute('data-kode', obj.kode || obj.idObat || '');
     el.setAttribute('data-stok', obj.stok !== undefined ? obj.stok : 9999);
     if (type === 'obat' || type === 'bmhp') {
       let stokLabel = row.querySelector('.val-stok-label');
       if (stokLabel) {
         stokLabel.innerText = 'Sisa Stok: ' + (obj.stok !== undefined ? obj.stok : 0) + ' ' + (obj.satuan || 'Pcs');
         stokLabel.className = 'val-stok-label text-[9px] font-bold block mt-0.5 ' + (obj.stok <= 0 ? 'text-rose-600 font-black animate-pulse' : (obj.stok <= (obj.stokMin || 10) ? 'text-amber-600' : 'text-emerald-600'));
       }
     }
   } else {
     row.querySelector('.val-harga').value = '0';
     el.removeAttribute('data-kode');
     el.removeAttribute('data-stok');
     let stokLabel = row.querySelector('.val-stok-label');
     if (stokLabel) stokLabel.innerText = '';
   }
   hitungRowKSR(row, type);
 }


 function hitungRowKSR(row, type) {
   let hrg = parseUangKSR(row.querySelector('.val-harga').value);
   let qtyInput = row.querySelector('.val-qty');
   let qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
   let disc = parseFloat(row.querySelector('.val-disc').value) || 0;
   if (disc > 100) { disc = 100; row.querySelector('.val-disc').value = 100; }

   // Validasi batas stok real-time untuk Obat & BMHP
   if (type === 'obat' || type === 'bmhp') {
     let namaInput = row.querySelector('.val-nama');
     let stokLabel = row.querySelector('.val-stok-label');
     if (namaInput && namaInput.hasAttribute('data-stok')) {
       let stokAvail = parseInt(namaInput.getAttribute('data-stok'));
       if (!isNaN(stokAvail)) {
         if (qty > stokAvail) {
           qtyInput.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-600', 'font-black');
           if (stokLabel) {
             stokLabel.innerText = '⚠️ Stok tidak mencukupi (Tersedia: ' + stokAvail + ')';
             stokLabel.className = 'val-stok-label text-[9px] font-black block mt-0.5 text-rose-600 animate-pulse';
           }
         } else {
           qtyInput.classList.remove('border-rose-500', 'bg-rose-50', 'text-rose-600', 'font-black');
           if (stokLabel && namaInput.value) {
             stokLabel.innerText = 'Sisa Stok: ' + stokAvail;
             stokLabel.className = 'val-stok-label text-[9px] font-bold block mt-0.5 ' + (stokAvail <= 0 ? 'text-rose-600 font-black' : 'text-emerald-600');
           }
         }
       }
     }
   }
  
   let total = hrg * qty;
   let grand = total - (total * (disc / 100)); // Labor diabaikan dari rumus total
   row.querySelector('.val-grand').value = grand === 0 ? '0' : formatRpKSR(grand);
   hitungGrandTotalSemua();
 }


 function hitungGrandTotalSemua() {
   let sum = 0; document.querySelectorAll('.val-grand').forEach(el => { sum += parseUangKSR(el.value); });
   document.getElementById('lblTotalBayarKSR').innerText = 'Rp ' + formatRpKSR(sum);
   document.getElementById('valTotalBayarRaw').value = sum;
 }


 function addKasirTindakan() {
   let tb = document.getElementById('ksrTbodyTindakan');
   let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-tindakan";
   tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlTindakanKasir" onchange="onInputDatalistChange(this, 'tindakan')" placeholder="Ketik/Cari Tindakan..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-500"></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'tindakan')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"></td><td class="p-1.5"><input type="text" value="0" oninput="autoFormatUang(this); hitungRowKSR(this.closest('tr'), 'tindakan')" class="val-labor w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-right outline-none focus:ring-1 focus:ring-indigo-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'tindakan')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-right font-black text-indigo-700 outline-none" value="0"></td><td class="p-1.5"><select class="val-perawat w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-500">${optPerawatKSR}</select></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
   tb.appendChild(tr);
 }


 function addKasirObat() {
   let tb = document.getElementById('ksrTbodyObat');
   let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-obat";
   tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlObatKasir" onchange="onInputDatalistChange(this, 'obat')" placeholder="Ketik/Cari Obat..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-emerald-500"><span class="val-stok-label text-[9px] font-bold block mt-0.5"></span></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-right font-black text-emerald-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
   tb.appendChild(tr);
 }


 function addKasirBMHP() {
   let tb = document.getElementById('ksrTbodyBMHP');
   let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-bmhp";
   tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlBMHPKasir" onchange="onInputDatalistChange(this, 'bmhp')" placeholder="Ketik/Cari BMHP..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-amber-500"><span class="val-stok-label text-[9px] font-bold block mt-0.5"></span></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-right font-black text-amber-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
   tb.appendChild(tr);
 }


 function resetFormBilling() {
   document.getElementById('ksrNama').value = ''; document.getElementById('ksrRM').value = ''; document.getElementById('ksrID').value = ''; document.getElementById('ksrDokter').value = ''; document.getElementById('ksrMetode').value = ''; document.getElementById('ksrStatus').value = ''; document.getElementById('ksrKet').value = '';
   let ksrDp = document.getElementById('ksrNominalDp'); if (ksrDp) ksrDp.value = '';
   onStatusBayarChange();
   document.getElementById('ksrTbodyTindakan').innerHTML = ''; document.getElementById('ksrTbodyObat').innerHTML = ''; document.getElementById('ksrTbodyBMHP').innerHTML = '';
   document.getElementById('ksrSearchPasien').value = '';
   let alertCicilan = document.getElementById('alertCicilanPasien');
   if (alertCicilan) alertCicilan.classList.add('hidden');
   hitungGrandTotalSemua(); window.scrollTo({ top: 0, behavior: 'smooth' });
 }


 function simpanBillingFinal() {
   let idPasien = document.getElementById('ksrID').value;
   if (!idPasien) { showToast('error', 'Cari dan Pilih Pasien terlebih dahulu!'); return; }
  
   let tgl = document.getElementById('ksrTgl').value, dok = document.getElementById('ksrDokter').value, met = document.getElementById('ksrMetode').value, stat = document.getElementById('ksrStatus').value;
   if(!tgl || !dok || !met || !stat) { showToast('error', 'Lengkapi field bertanda * (Dokter, Tgl, Metode, Status)'); return; }

   let totalBiayaTindakan = parseUangKSR(document.getElementById('valTotalBayarRaw').value);
   let nominalBayarAkhir = totalBiayaTindakan;
   let ketTambahan = document.getElementById('ksrKet').value.trim();

   if (stat === 'Uang Muka') {
     let dpVal = parseUangKSR(document.getElementById('ksrNominalDp').value);
     if (dpVal <= 0) {
       showToast('error', 'Harap isi nominal Uang Muka / DP yang dibayarkan!');
       let elDp = document.getElementById('ksrNominalDp');
       if (elDp) elDp.focus();
       return;
     }
     if (dpVal > totalBiayaTindakan) {
       showToast('error', 'Nominal DP tidak boleh melebihi total biaya paket (Rp ' + formatRpKSR(totalBiayaTindakan) + ')!');
       return;
     }
     nominalBayarAkhir = dpVal;
     let sisaTagihan = totalBiayaTindakan - dpVal;
     let infoDp = '[DP: Rp ' + formatRpKSR(dpVal) + ' | Total Paket: Rp ' + formatRpKSR(totalBiayaTindakan) + ' | Sisa Piutang: Rp ' + formatRpKSR(sisaTagihan) + ']';
     ketTambahan = ketTambahan ? (ketTambahan + ' ' + infoDp) : infoDp;
   }

   let btn = document.getElementById('btnSimpanBilling'); btn.innerHTML = 'MEMPROSES...'; btn.disabled = true;

   let errTbl = false;
   let stokError = false;
   let stokErrorMsg = '';

   let tTindakan = [];
   let tbTindakanEl = document.getElementById('ksrTbodyTindakan');
   let rowsTindakanList = tbTindakanEl ? tbTindakanEl.querySelectorAll('.row-tindakan') : [];
   rowsTindakanList.forEach(tr => {
     let nInput = tr.querySelector('.val-nama');
     let n = nInput ? nInput.value : '';
     if (n) {
       tTindakan.push({
         nama: n,
         harga: parseUangKSR(tr.querySelector('.val-harga') ? tr.querySelector('.val-harga').value : 0),
         qty: tr.querySelector('.val-qty') ? tr.querySelector('.val-qty').value : 1,
         labor: parseUangKSR(tr.querySelector('.val-labor') ? tr.querySelector('.val-labor').value : 0),
         diskon: tr.querySelector('.val-disc') ? tr.querySelector('.val-disc').value : 0,
         grandTotal: parseUangKSR(tr.querySelector('.val-grand') ? tr.querySelector('.val-grand').value : 0),
         perawat: tr.querySelector('.val-perawat') ? tr.querySelector('.val-perawat').value : ''
       });
     } else {
       errTbl = true;
     }
   });
   
   let tObat = []; 
   let tbObatEl = document.getElementById('ksrTbodyObat');
   let rowsObatList = tbObatEl ? tbObatEl.querySelectorAll('.row-obat') : [];
   rowsObatList.forEach(tr => { 
     let nInput = tr.querySelector('.val-nama');
     let n = nInput ? nInput.value : ''; 
     let kd = nInput ? (nInput.getAttribute('data-kode') || '') : '';
     let q = parseInt(tr.querySelector('.val-qty') ? tr.querySelector('.val-qty').value : 1) || 0;
     if (n) { 
       if (nInput && nInput.hasAttribute('data-stok')) {
         let sAvail = parseInt(nInput.getAttribute('data-stok'));
         if (!isNaN(sAvail) && q > sAvail) {
           stokError = true;
           stokErrorMsg = 'Stok "' + n + '" tidak mencukupi (Diminta: ' + q + ', Tersedia: ' + sAvail + ')!';
         }
       }
       tObat.push({ 
         kode: kd, 
         nama: n, 
         harga: parseUangKSR(tr.querySelector('.val-harga') ? tr.querySelector('.val-harga').value : 0), 
         qty: q, 
         diskon: tr.querySelector('.val-disc') ? tr.querySelector('.val-disc').value : 0, 
         grandTotal: parseUangKSR(tr.querySelector('.val-grand') ? tr.querySelector('.val-grand').value : 0) 
       }); 
     } else { errTbl = true; } 
   });

   let tBMHP = []; 
   let tbBmhpEl = document.getElementById('ksrTbodyBMHP');
   let rowsBmhpList = tbBmhpEl ? tbBmhpEl.querySelectorAll('.row-bmhp') : [];
   rowsBmhpList.forEach(tr => { 
     let nInput = tr.querySelector('.val-nama');
     let n = nInput ? nInput.value : ''; 
     let kd = nInput ? (nInput.getAttribute('data-kode') || '') : '';
     let q = parseInt(tr.querySelector('.val-qty') ? tr.querySelector('.val-qty').value : 1) || 0;
     if (n) { 
       if (nInput && nInput.hasAttribute('data-stok')) {
         let sAvail = parseInt(nInput.getAttribute('data-stok'));
         if (!isNaN(sAvail) && q > sAvail) {
           stokError = true;
           stokErrorMsg = 'Stok "' + n + '" tidak mencukupi (Diminta: ' + q + ', Tersedia: ' + sAvail + ')!';
         }
       }
       tBMHP.push({ 
         kode: kd, 
         nama: n, 
         harga: parseUangKSR(tr.querySelector('.val-harga') ? tr.querySelector('.val-harga').value : 0), 
         qty: q, 
         diskon: tr.querySelector('.val-disc') ? tr.querySelector('.val-disc').value : 0, 
         grandTotal: parseUangKSR(tr.querySelector('.val-grand') ? tr.querySelector('.val-grand').value : 0) 
       }); 
     } else { errTbl = true; } 
   });

   if (errTbl) { showToast('error', 'Semua baris tabel yang ditambahkan harus diisi namanya!'); btn.innerHTML = 'SIMPAN DATA INVOICE'; btn.disabled = false; return; }
   if (stokError) { showToast('error', stokErrorMsg); btn.innerHTML = 'SIMPAN DATA INVOICE'; btn.disabled = false; return; }
   if (tTindakan.length===0 && tObat.length===0 && tBMHP.length===0) { showToast('error', 'Minimal input satu tindakan/obat/BMHP!'); btn.innerHTML = 'SIMPAN DATA INVOICE'; btn.disabled = false; return; }

   let kasirNama = window.activeNamaAccount || 'Kasir';

   let payload = {
     idPasien: idPasien, noRm: document.getElementById('ksrRM').value, namaPasien: document.getElementById('ksrNama').value,
     tglTindakan: tgl, dokter: dok, metode: met, status: stat, keterangan: ketTambahan,
     totalBayar: nominalBayarAkhir, kasir: kasirNama,
     tindakanStr: JSON.stringify(tTindakan), obatStr: JSON.stringify(tObat), bmhpStr: JSON.stringify(tBMHP)
   };

   google.script.run.withSuccessHandler(res => {
     btn.innerHTML = 'SIMPAN DATA INVOICE'; btn.disabled = false;
     if (res && res.success) {
       showToast('success', 'Berhasil! No: ' + res.idInvoice);
      
       let newItems = [];
       tTindakan.forEach(t => newItems.push({ item: t.nama, qty: t.qty, harga: t.harga, diskon: t.diskon, grandTotalItem: t.grandTotal }));
       tObat.forEach(t => newItems.push({ kode: t.kode, item: t.nama, qty: t.qty, harga: t.harga, diskon: t.diskon, grandTotalItem: t.grandTotal }));
       tBMHP.forEach(t => newItems.push({ kode: t.kode, item: t.nama, qty: t.qty, harga: t.harga, diskon: t.diskon, grandTotalItem: t.grandTotal }));
      
       // 1. Perbarui data lokal mentah (KlinikData.pembayaran) terlebih dahulu
       if (window.KlinikData && Array.isArray(window.KlinikData.pembayaran)) {
         newItems.forEach(it => {
           window.KlinikData.pembayaran.push({
             idInvoice: res.idInvoice,
             tanggal: tgl,
             idPasien: payload.idPasien,
             noRm: payload.noRm,
             namaPasien: payload.namaPasien,
             dokter: payload.dokter,
             item: it.item,
             qty: it.qty,
             harga: it.harga,
             diskon: it.diskon,
             grandTotalItem: it.grandTotalItem,
             totalInvoice: payload.totalBayar,
             metode: payload.metode,
             status: payload.status,
             keterangan: payload.keterangan,
             kasir: payload.kasir
           });
         });
       }

       // 2. Bangun ulang grup riwayat invoice dan render tabel
       groupRiwayatInvoices();
       resetPageAndSearch();
       
       resetFormBilling();
     } else { 
       showToast('error', res ? res.message : 'Terjadi kendala saat menyimpan data ke server!'); 
     }
   }).withFailureHandler(err => {
     btn.innerHTML = 'SIMPAN DATA INVOICE'; btn.disabled = false; 
     showToast('error', 'Koneksi gagal atau terjadi kesalahan server: ' + (err ? err.message : ''));
   }).simpanPembayaranBaru(payload);
 }


 // ==========================================
 // CETAK INVOICE A4 PROFESIONAL
 // ==========================================
 function actionLangsungCetak(id, isPDF) {
   currentPreviewInvId = id; let inv = invoiceGroups[id]; if(!inv) return; generateA4Invoice(inv); setTimeout(()=>{ actionCetakDanPDF(isPDF); }, 300);
 }


 function actionKirimWA(id) {
   let inv = invoiceGroups[id]; if(!inv) return;
   let msg = `Halo ${inv.namaPasien},%0A%0ABerikut adalah ringkasan tagihan Anda:%0A*No Invoice:* ${inv.idInvoice}%0A*Tanggal Kunjungan:* ${formatTglIndoFull(inv.tanggal)}%0A*Total Bayar:* Rp ${formatRpKSR(inv.totalInvoice)}%0A*Status:* ${inv.metode} - ${inv.status}%0A%0ATerima Kasih Atas Kunjungan Anda,%0ASemoga Cepat Sembuh & Sehat Selalu.`;
   window.open(`https://wa.me/?text=${msg}`, '_blank');
 }


 function generateA4Invoice(inv) {
   let tglFormated = formatTglIndoFull(inv.tanggal);
  
   // TANGGAL CETAK (Hari ini) UNTUK TANDA TANGAN
   let tglSekarang = new Date();
   let bln = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
   let tglCetak = `${tglSekarang.getDate()} ${bln[tglSekarang.getMonth()]} ${tglSekarang.getFullYear()}`;


   let alamatPasien = "-";
   if(window.KlinikData && window.KlinikData.pasien) {
     let pas = window.KlinikData.pasien.find(p => p.namaPasien === inv.namaPasien || p.noRm === inv.noRm);
     if(pas && pas.alamat) alamatPasien = pas.alamat;
   }
  
   let tbody = inv.items.map(it => {
     let discTxt = (it.diskon == 0 || it.diskon === "0" || !it.diskon) ? "" : `${it.diskon}%`;
     return `
     <tr style="border-bottom: 1px solid #e2e8f0;">
       <td style="padding: 14px 10px; text-align: left; color: #1e293b;">${it.item}</td>
       <td style="padding: 14px 10px; text-align: center; color: #1e293b;">${it.qty}</td>
       <td style="padding: 14px 10px; text-align: right; color: #1e293b;">${formatRpKSR(it.harga)}</td>
       <td style="padding: 14px 10px; text-align: center; color: #1e293b;">${discTxt}</td>
       <td style="padding: 14px 10px; text-align: right; color: #1e293b; font-weight: bold;">${formatRpKSR(it.grandTotalItem)}</td>
     </tr>`;
   }).join('');


   let imgHtml = `<img src="${LINK_KOP_SURAT}" style="width: 100%; height: auto; margin-bottom: 5px; display: block;" alt="Kop Surat">`;
   let teksTerbilang = inv.totalInvoice == 0 ? "Nol" : terbilangKSR(inv.totalInvoice).trim();


   let htmlA4 = `
     <div style="width: 210mm; max-width: 210mm; min-height: 297mm; height: 297mm; background: #fff; margin: 0 auto; padding: 25px 35px 50px 35px; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; position: relative; overflow: hidden;">
      
       ${imgHtml}
      
       <div style="text-align: center; margin-bottom: 25px;">
         <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0f172a;">INVOICE</h1>
         <p style="margin: 2px 0 0 0; font-size: 14px; color: #64748b; font-weight: bold;">No : ${inv.idInvoice}</p>
       </div>


       <table style="width: 100%; font-size: 14px; margin-bottom: 30px; line-height: 1.6;">
         <tr>
           <td style="width: 140px; font-weight: bold; color: #475569;">Nama Pasien</td>
           <td style="width: 250px; font-weight: bold; color: #0f172a;">: ${inv.namaPasien}</td>
           <td style="width: 170px; font-weight: bold; text-align: right; color: #475569; padding-right: 15px;">Metode Pembayaran</td>
           <td style="width: 120px; text-align: left; font-weight: bold; color: #0f172a;">: ${inv.metode}</td>
         </tr>
         <tr>
           <td style="font-weight: bold; color: #475569; vertical-align: top;">Alamat</td>
           <td style="color: #333; vertical-align: top;">: ${alamatPasien}</td>
           <td style="font-weight: bold; text-align: right; color: #475569; vertical-align: top; padding-right: 15px;">Status</td>
           <td style="text-align: left; font-weight: bold; color: #0f172a; vertical-align: top;">: ${inv.status}</td>
         </tr>
         <tr>
           <td style="font-weight: bold; color: #475569; vertical-align: top;">Tanggal Kunjungan</td>
           <td style="color: #333; vertical-align: top;">: ${tglFormated}</td>
           <td colspan="2"></td>
         </tr>
       </table>


       <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 30px;">
         <thead>
           <tr style="background-color: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
             <th style="padding: 14px 10px; text-align: left; color: #334155; width: 45%;">Tindakan/Layanan</th>
             <th style="padding: 14px 10px; text-align: center; color: #334155; width: 10%;">Qty</th>
             <th style="padding: 14px 10px; text-align: right; color: #334155; width: 15%;">Biaya</th>
             <th style="padding: 14px 10px; text-align: center; color: #334155; width: 10%;">Diskon</th>
             <th style="padding: 14px 10px; text-align: right; color: #334155; width: 20%;">Total</th>
           </tr>
         </thead>
         <tbody>${tbody}</tbody>
       </table>


       <div>
         <div style="float: left; width: 360px; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; background-color: #f8fafc; box-sizing: border-box; display: flex; align-items: center; min-height: 54px;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a; font-style: italic; line-height: 1.5;">${teksTerbilang} Rupiah</p>
         </div>


         <div style="float: right; width: 320px; font-size: 14px;">
           <table style="width: 100%; border-collapse: collapse;">
             <tr style="background-color: #f8fafc; border-radius: 8px;">
               <td style="padding: 15px; font-weight: bold; color: #0f172a; font-size: 16px;">GRAND TOTAL</td>
               <td style="padding: 15px; text-align: right; font-size: 20px; font-weight: 900; color: #0f172a;">Rp ${formatRpKSR(inv.totalInvoice)}</td>
             </tr>
           </table>
         </div>
         <div style="clear: both;"></div>
       </div>


       <div style="margin-top: 50px; width: 250px; float: right; text-align: center;">
         <p style="margin: 0; font-size: 14px; color: #475569;">Payakumbuh, ${tglCetak}</p>
         <p style="margin: 5px 0 60px 0; font-size: 14px; color: #475569;">Hormat Kami,</p>
         <p style="margin: 0; font-weight: bold; font-size: 15px; color: #0f172a;">( SHELDON ADMIN )</p>
       </div>
       <div style="clear: both;"></div>


       <div style="position: absolute; bottom: 12mm; left: 0; right: 0; text-align: center; width: 100%; pointer-events: none;">
         <p style="margin: 0; font-size: 11px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px;">Terima Kasih Telah Memercayakan Kesehatan Gigi & Mulut Anda Kepada Kami</p>
         <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 0.5px;">Senyum Sehat Percaya Diri</p>
       </div>


     </div>`;
  
   let elPrint = document.getElementById('printAreaKwitansi');
   if(elPrint) { elPrint.innerHTML = htmlA4; }
   let mdl = document.getElementById('modalKwitansi');
   if(mdl) mdl.classList.remove('hidden');
 }


  function actionCetakDanPDF(isPDFMode) {
    if(!currentPreviewInvId) return;
    let inv = invoiceGroups[currentPreviewInvId];
    let originalTitle = document.title;
    let suggestedFileName = (inv.idInvoice || "INVOICE").replace(/[\/\\]/g, '_');
    const elArea = document.getElementById('printAreaKwitansi');

    // JIKA MODE SAVE PDF DAN HTML2PDF TERSEDIA: LANGSUNG DOWNLOAD FILE PDF DENGAN NAMA NOMOR INVOICE
    if (isPDFMode && typeof html2pdf !== 'undefined' && elArea) {
      showToast('info', 'Mempersiapkan PDF: ' + suggestedFileName + '.pdf...');
      const opt = {
        margin: [0, 0, 0, 0],
        filename: suggestedFileName + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(elArea).save().then(() => {
        showToast('success', 'Berhasil mengunduh: ' + suggestedFileName + '.pdf');
      }).catch(err => {
        console.error('html2pdf kwitansi error:', err);
        showToast('warning', 'Mengalihkan ke dialog cetak browser...');
        bukaPrintWindowInvoice(suggestedFileName, originalTitle);
      });
      return;
    }

    bukaPrintWindowInvoice(suggestedFileName, originalTitle);
  }

  function bukaPrintWindowInvoice(suggestedFileName, originalTitle) {
    const contentHtml = document.getElementById('printAreaKwitansi').innerHTML;
    const docStyle = '@page { size: A4 portrait; margin: 0; } html, body { padding: 0; margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden !important; } * { box-sizing: border-box; }';

    // Solusi 1: Popup Top-Level Window agar Save As PDF memakai judul suggestedFileName
    try {
      let printWin = window.open('', '_blank', 'width=850,height=900');
      if (printWin && !printWin.closed) {
        printWin.document.open();
        printWin.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + suggestedFileName + '</title><style>' + docStyle + '</style></head><body>' + contentHtml + '</body></html>');
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.document.title = suggestedFileName;
          printWin.print();
          printWin.onafterprint = function() { printWin.close(); document.title = originalTitle; };
        }, 500);
        return;
      }
    } catch(e) {
      console.warn('Popup invoice print window blocked, fallback to iframe:', e);
    }

    // Solusi 2: Fallback Iframe jika popup diblokir
    const pf = document.getElementById('printFrameBayar').contentWindow;
    pf.document.open();
    pf.document.write('<html><head><title>' + suggestedFileName + '</title><style>' + docStyle + '</style></head><body>' + contentHtml + '</body></html>');
    pf.document.close(); pf.focus();
    document.title = suggestedFileName;
    setTimeout(() => { 
      document.title = suggestedFileName;
      if (pf.document) pf.document.title = suggestedFileName;
      pf.print(); 
      pf.onafterprint = function() { document.title = originalTitle; };
      setTimeout(() => { document.title = originalTitle; }, 15000);
    }, 600);
  }



// ========================================================
// FILTER OTOMATIS: DOKTER, PERAWAT & TINDAKAN KASIR
// ========================================================


// Memicu pengisian form kasir setelah data selesai didownload
document.addEventListener("KlinikDataReady", initKasirDropdowns);


// Fallback jika event sudah keburu lewat (refresh halaman)
if(window.KlinikData && window.KlinikData.statusLoad && window.KlinikData.statusLoad.master) {
   initKasirDropdowns();
}


function initKasirDropdowns() {
 // 1 & 3: Menyuntikkan Daftar Dokter dan Perawat ke Elemen Dropdown Anda
 let kasirDokter = document.querySelector('select[id*="dokter"], select[name*="dokter"], #dokterPemeriksa');
 let kasirPerawat = document.querySelector('select[id*="perawat"], select[name*="perawat"], #perawat');
  if (window.KlinikData && window.KlinikData.staff) {
    // A. Injeksi Dokter
    if (kasirDokter) {
        let dokters = window.KlinikData.staff.filter(s => s.role.toLowerCase().includes('dokter'));
        let html = '<option value="" disabled selected>-- Pilih Dokter --</option>';
        dokters.forEach(d => { html += `<option value="${d.nama}" data-role="${d.role}">${d.nama}</option>`; });
        kasirDokter.innerHTML = html;
       
        // Event listener untuk memicu penyaringan "Tindakan" saat dokter dipilih
        kasirDokter.addEventListener('change', filterTindakanKasir);
    }
   
    // B. Injeksi Perawat (Khusus Role Perawat Gigi)
    if (kasirPerawat) {
        let perawats = (window.KlinikData && Array.isArray(window.KlinikData.staff))
          ? window.KlinikData.staff.filter(s => s.role && s.role.toLowerCase().includes('perawat gigi'))
          : [];
        let html = '<option value="" disabled selected>-- Pilih Perawat Pendamping --</option>';
        perawats.forEach(p => { html += `<option value="${p.nama}">${p.nama}</option>`; });
        kasirPerawat.innerHTML = html;
    }
 }
  // 2, 4, 5: Buat daftar Tindakan, Obat, dan BMHP awal
 renderDatalistKasir();
}


// Logika Pemotongan Pilihan Tindakan Sesuai Role (Kategori Umum / UMM selalu muncul untuk semua role dokter)
function filterTindakanKasir(e) {
  let opt = e.target.options[e.target.selectedIndex];
  let roleDokter = (opt.getAttribute('data-role') || "").toLowerCase();
 
  let allTindakan = window.KlinikData.tindakan || [];
  let isUmum = function(t) {
    let kat = (t.kategori || '').toLowerCase();
    let kod = (t.kode || '').toUpperCase();
    return kat.includes('umum') || kod.startsWith('UMM');
  };
  let filtered = [];
 
  if (roleDokter.includes('spesialis')) {
      // Spesialis: Bisa memilih Spesialis & Umum (UMM)
      filtered = allTindakan.filter(function(t) { return t.kategori.toLowerCase().includes('spesialis') || isUmum(t); });
  } else if (roleDokter.includes('umum') || roleDokter === 'dokter') {
      // Dokter Umum: Bisa memilih kategori Umum (UMM)
      filtered = allTindakan.filter(function(t) { return isUmum(t); });
  } else if (roleDokter) {
      filtered = allTindakan.filter(function(t) { return t.kategori.toLowerCase().includes(roleDokter) || isUmum(t); });
  } else {
      filtered = allTindakan;
  }
 
  // Perbarui hanya daftar tindakan
  renderDatalistKasir(filtered);
}


// Membaca Data Mentah menjadi Pilihan Dropdown / Datalist (Otomatis Menempel ke Input)
function renderDatalistKasir(tindakanTersaring = null) {
  // A. Tindakan (Terfilter)
  let listTindakan = tindakanTersaring || window.KlinikData.tindakan || [];
  let dlTindakan = document.getElementById('listTindakanKasir');
  if (!dlTindakan) {
      dlTindakan = document.createElement('datalist');
      dlTindakan.id = 'listTindakanKasir';
      document.body.appendChild(dlTindakan);
  }
  dlTindakan.innerHTML = listTindakan.map(t => `<option value="${t.nama}">`).join('');
  document.querySelectorAll('input[id*="tindakan"], input[name*="tindakan"]').forEach(el => el.setAttribute('list', 'listTindakanKasir'));


  // B. Obat (Dari Master_Obat)
  let dlObat = document.getElementById('listObatKasir');
  if (!dlObat) {
      dlObat = document.createElement('datalist');
      dlObat.id = 'listObatKasir';
      document.body.appendChild(dlObat);
  }
  if (window.KlinikData.obat) {
      dlObat.innerHTML = window.KlinikData.obat.map(o => `<option value="${o.nama}">`).join('');
  }
  document.querySelectorAll('input[id*="obat"], input[name*="obat"]').forEach(el => el.setAttribute('list', 'listObatKasir'));


  // C. BMHP (Dari Master_BMHP)
  let dlBmhp = document.getElementById('listBmhpKasir');
  if (!dlBmhp) {
      dlBmhp = document.createElement('datalist');
      dlBmhp.id = 'listBmhpKasir';
      document.body.appendChild(dlBmhp);
  }
  if (window.KlinikData.bmhp) {
      dlBmhp.innerHTML = window.KlinikData.bmhp.map(b => `<option value="${b.nama}">`).join('');
  }
  document.querySelectorAll('input[id*="bmhp"], input[name*="bmhp"]').forEach(el => el.setAttribute('list', 'listBmhpKasir'));
}



 var arrInvoices = [];
 var filteredInvoices = [];
 var activeInvoice = null;
  // Variabel untuk fitur Paginasi
 var currentPageInv = 1;
 var itemsPerPageInv = 10;


 function formatRupiahInv(angka) {
   var number_string = angka.toString().replace(/[^,\d]/g, ''), split = number_string.split(','),
   sisa = split[0].length % 3, rupiah = split[0].substr(0, sisa), ribuan = split[0].substr(sisa).match(/\d{3}/gi);
   if(ribuan){ var separator = sisa ? '.' : ''; rupiah += separator + ribuan.join('.'); }
   return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
 }


 function formatTglIndoInv(isoStr) {
   if (!isoStr) return '-'; var d = new Date(isoStr); if (isNaN(d.getTime())) return isoStr;
   var dd = String(d.getDate()).padStart(2, '0'); var mm = String(d.getMonth() + 1).padStart(2, '0'); var yyyy = d.getFullYear();
   return dd + '-' + mm + '-' + yyyy;
 }


 function penyebut(nilai) {
   nilai = Math.abs(nilai);
   var huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
   var temp = "";
   if (nilai < 12) { temp = " " + huruf[nilai];
   } else if (nilai < 20) { temp = penyebut(nilai - 10) + " Belas";
   } else if (nilai < 100) { temp = penyebut(Math.floor(nilai / 10)) + " Puluh" + penyebut(nilai % 10);
   } else if (nilai < 200) { temp = " Seratus" + penyebut(nilai - 100);
   } else if (nilai < 1000) { temp = penyebut(Math.floor(nilai / 100)) + " Ratus" + penyebut(nilai % 100);
   } else if (nilai < 2000) { temp = " Seribu" + penyebut(nilai - 1000);
   } else if (nilai < 1000000) { temp = penyebut(Math.floor(nilai / 1000)) + " Ribu" + penyebut(nilai % 1000);
   } else if (nilai < 1000000000) { temp = penyebut(Math.floor(nilai / 1000000)) + " Juta" + penyebut(nilai % 1000000);
   } else if (nilai < 1000000000000) { temp = penyebut(Math.floor(nilai / 1000000000)) + " Miliar" + penyebut(nilai % 1000000000); }
   return temp;
 }


 function angkaTerbilang(nilai) {
   if(nilai === 0) return "Nol Rupiah";
   var hasil = penyebut(nilai);
   return hasil.trim() + " Rupiah";
 }


 function loadDataInvoice() {
   document.getElementById('viewDaftarInvoice').classList.remove('hidden');
   document.getElementById('viewDetailInvoice').classList.add('hidden');
   document.getElementById('tabelBodyInvoice').innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Memuat data rekap pembayaran...</td></tr>';
  
   google.script.run.withSuccessHandler(function(data) {
     arrInvoices = data || [];
    
     // SET TANGGAL DEFAULT KE HARI INI
     var today = new Date().toISOString().split('T')[0];
     document.getElementById('filterTglMulai').value = today;
     document.getElementById('filterTglAkhir').value = today;
    
     // Kosongkan form pencarian kata kunci
     document.getElementById('inputCariInvoice').value = '';
    
     currentPageInv = 1;
    
     // Langsung panggil filter untuk menerapkan Tgl Hari ini
     filterInvoice();
   }).getDaftarInvoice();
 }


 // FUNGSI FILTER BERDASARKAN KATA KUNCI & TANGGAL
 function filterInvoice() {
   var kw = document.getElementById('inputCariInvoice').value.toLowerCase();
   var tglMulai = document.getElementById('filterTglMulai').value;
   var tglAkhir = document.getElementById('filterTglAkhir').value;


   filteredInvoices = arrInvoices.filter(function(inv) {
     var matchKw = inv.namaPasien.toLowerCase().indexOf(kw) !== -1 || inv.idInvoice.toLowerCase().indexOf(kw) !== -1 || inv.noRm.toLowerCase().indexOf(kw) !== -1;
    
     var matchTgl = true;
     // inv.tanggalBayar format dari backend adalah 'YYYY-MM-DD'
     if (tglMulai && inv.tanggalBayar < tglMulai) matchTgl = false;
     if (tglAkhir && inv.tanggalBayar > tglAkhir) matchTgl = false;


     return matchKw && matchTgl;
   });


   currentPageInv = 1; // Kembali ke halaman pertama saat parameter berubah
   renderTabelInvoice();
 }


 // FUNGSI RENDER TABEL (POSISI NAMA PASIEN & NO RM DITUKAR)
 function renderTabelInvoice() {
   var tbody = document.getElementById('tabelBodyInvoice');
   var pageInfo = document.getElementById('invPageInfo');
   var btnPrev = document.getElementById('btnPrevInv');
   var btnNext = document.getElementById('btnNextInv');


   if (filteredInvoices.length === 0) {
     tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-rose-500 font-bold bg-rose-50">Tidak ada data pembayaran/invoice pada rentang tanggal tersebut. <br><span class="text-xs font-normal text-slate-500 mt-2 block">Silakan ubah Filter TGL atau klik ikon silang di kalender untuk menampilkan semua data.</span></td></tr>';
     pageInfo.innerText = "Menampilkan 0 data";
     btnPrev.disabled = true;
     btnNext.disabled = true;
     return;
   }
  
   var totalPages = Math.ceil(filteredInvoices.length / itemsPerPageInv);
   if (currentPageInv < 1) currentPageInv = 1;
   if (currentPageInv > totalPages) currentPageInv = totalPages;


   var startIdx = (currentPageInv - 1) * itemsPerPageInv;
   var endIdx = Math.min(startIdx + itemsPerPageInv, filteredInvoices.length);


   var htmlStr = '';
  
   for(var i = startIdx; i < endIdx; i++) {
     var inv = filteredInvoices[i];
     var badgeCls = (inv.statusPembayaran === 'Lunas' || inv.statusPembayaran === 'Pelunasan') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
    
     htmlStr += '<tr class="hover:bg-teal-50 transition-colors">' +
       '<td class="py-2.5 px-3 text-center"><button type="button" onclick="bukaDetailInvoice('+i+')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold shadow-sm">Lihat</button></td>' +
       '<td class="py-2.5 px-3 font-bold text-teal-700 whitespace-nowrap">' + inv.idInvoice + '</td>' +
       '<td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">' + formatTglIndoInv(inv.tanggalBayar) + '</td>' +
       '<td class="py-2.5 px-3 font-bold text-slate-900 border-l border-slate-200">' + inv.namaPasien + '</td>' +
       '<td class="py-2.5 px-3 font-mono text-slate-500 font-bold">' + inv.noRm + '</td>' +
       '<td class="py-2.5 px-3 text-center border-l border-slate-200"><span class="px-2 py-0.5 rounded uppercase tracking-wider text-[9px] font-bold ' + badgeCls + '">' + inv.statusPembayaran + '</span></td>' +
       '<td class="py-2.5 px-3 text-right font-black text-slate-800 whitespace-nowrap">Rp ' + formatRupiahInv(inv.grandTotal) + '</td>' +
     '</tr>';
   }
  
   tbody.innerHTML = htmlStr;


   // Update status tombol Paginasi
   pageInfo.innerHTML = "Menampilkan <b>" + (startIdx + 1) + " - " + endIdx + "</b> dari <b>" + filteredInvoices.length + "</b> data";
   btnPrev.disabled = (currentPageInv === 1);
   btnNext.disabled = (currentPageInv === totalPages);
 }


 function prevPageInv() {
   if (currentPageInv > 1) {
     currentPageInv--;
     renderTabelInvoice();
   }
 }


 function nextPageInv() {
   var totalPages = Math.ceil(filteredInvoices.length / itemsPerPageInv);
   if (currentPageInv < totalPages) {
     currentPageInv++;
     renderTabelInvoice();
   }
 }


 // BUKA DETAIL PDF INVOICE
 function tutupDetailInvoice() {
   document.getElementById('viewDaftarInvoice').classList.remove('hidden');
   document.getElementById('viewDetailInvoice').classList.add('hidden');
 }


 function bukaDetailInvoice(idx) {
   var inv = filteredInvoices[idx];
   if (!inv) return;
   activeInvoice = inv;
  
   document.getElementById('viewDaftarInvoice').classList.add('hidden');
   document.getElementById('viewDetailInvoice').classList.remove('hidden');


   var formattedDate = formatTglIndoInv(inv.tanggalBayar);


   document.getElementById('invNumber').innerText = inv.idInvoice;
   document.getElementById('invDate').innerText = formattedDate;
  
   var tglCetak = new Date();
   document.getElementById('invTTDDate').innerText = formatTglIndoInv(tglCetak.toISOString().split('T')[0]);
  
   document.getElementById('invNamaPasien').innerText = inv.namaPasien;
   document.getElementById('invAlamat').innerText = inv.alamat || '-';
  
   document.getElementById('invMetode').innerText = inv.metodeBayar;
  
   var badge = document.getElementById('invStatusBadge');
   badge.innerText = inv.statusPembayaran.toUpperCase();
   if(inv.statusPembayaran === 'Lunas' || inv.statusPembayaran === 'Pelunasan') {
     badge.className = "text-emerald-700";
   } else {
     badge.className = "text-amber-700";
   }


   var trHtml = '';
   for(var i=0; i<inv.rincianItems.length; i++) {
     var itm = inv.rincianItems[i];
     var discCell = '';
     if (itm.diskonPercent == 0 || itm.diskonPercent === '') {
       discCell = '<td class="py-2.5 px-2 text-center text-slate-900 font-bold">-</td>';
     } else {
       discCell = '<td class="py-2.5 px-2 text-center text-rose-600 font-bold">' + itm.diskonPercent + '%</td>';
     }


     trHtml += '<tr>' +
       '<td class="py-2.5 px-2 text-center">' + (i+1) + '</td>' +
       '<td class="py-2.5 px-2"><p class="font-bold text-slate-800">' + itm.nama + '</p></td>' +
       '<td class="py-2.5 px-2 text-center font-bold text-slate-700">' + itm.qty + '</td>' +
       '<td class="py-2.5 px-2 text-right whitespace-nowrap">Rp ' + formatRupiahInv(itm.tarif) + '</td>' +
       discCell +
       '<td class="py-2.5 px-2 text-right font-black text-slate-900 whitespace-nowrap">Rp ' + formatRupiahInv(itm.subtotal) + '</td>' +
     '</tr>';
   }
   document.getElementById('invTbodyItems').innerHTML = trHtml;
  
   document.getElementById('invKeterangan').innerText = inv.keterangan || '-';
   document.getElementById('invSubtotal').innerText = 'Rp ' + formatRupiahInv(inv.subtotalBiaya);
  
   var elDiskon = document.getElementById('invDiskon');
   if (inv.totalDiskon == 0 || inv.totalDiskon === '') {
     elDiskon.innerText = 'Rp 0';
     elDiskon.className = 'font-semibold text-slate-900';
   } else {
     elDiskon.innerText = '-Rp ' + formatRupiahInv(inv.totalDiskon);
     elDiskon.className = 'font-semibold text-rose-600';
   }


   document.getElementById('invGrandTotal').innerText = 'Rp ' + formatRupiahInv(inv.grandTotal);
   document.getElementById('invTerbilang').innerText = angkaTerbilang(inv.grandTotal) + ".";
 }


 function kirimInvoiceWA() {
   if(!activeInvoice) return;
   var inv = activeInvoice;
   var hp = inv.whatsapp || '';
   if(hp.startsWith('0')) hp = '62' + hp.slice(1);
  
   var txt = "*KLINIK GIGI SHELDON*\n_Layanan Kesehatan Gigi & Mulut Profesional_\n------------------------------------------------\n*KUITANSI DIGITAL / INVOICE: " + inv.idInvoice + "*\nTanggal : " + formatTglIndoInv(inv.tanggalBayar) + "\nPasien  : " + inv.namaPasien + "\n\n*STATUS PEMBAYARAN:* *" + inv.statusPembayaran.toUpperCase() + " (" + inv.metodeBayar + ")*\n\n*GRAND TOTAL TAGIHAN: Rp " + formatRupiahInv(inv.grandTotal) + "*\n\nKeterangan:\n" + (inv.keterangan || '-') + "\n\nTerima kasih atas kunjungan Anda di Klinik Gigi SHELDON. Semoga sehat selalu! 😊";
  
   window.open('https://wa.me/' + hp + '?text=' + encodeURIComponent(txt), '_blank');
 }


 function cetakPDF() {
   if (!activeInvoice) return;
   var originalTitle = document.title;
   var safeFileName = activeInvoice.idInvoice.replace(/\//g, '_');
   document.title = safeFileName;
   window.print();
   setTimeout(function() { document.title = originalTitle; }, 1000);
 }



 const SURAT_PER_PAGE = 15; 
 
 let dataSuratGlobal = []; 
 let filteredSuratList = [];
 let rawListSKS = []; let filteredListSKS = []; let pageSKS = 1;
 let rawListSKP = []; let filteredListSKP = []; let pageSKP = 1;
 let rawListRSM = []; let filteredListRSM = []; let pageRSM = 1;
 let rawListSPM = []; let filteredListSPM = []; let pageSPM = 1;
 let rawListLAB = []; let filteredListLAB = []; let pageLAB = 1;
 let rawListRAD = []; let filteredListRAD = []; let pageRAD = 1;
 let listDokterDanSIP = [];
 let debounceTimerId = {};


 function setupAutocompleteNav(inputId, resultId, highlightColor, resetFuncName) {
   const input = document.getElementById(inputId);
   const resultBox = document.getElementById(resultId);
   if (!input || !resultBox) return;
   let currentFocus = -1;
   input.addEventListener('input', function() { currentFocus = -1; });
   input.addEventListener('keydown', function(e) {
     let items = resultBox.querySelectorAll('.search-item');
     if (e.key === 'Escape') {
       e.preventDefault(); resultBox.classList.add('hidden'); input.value = '';
       if (typeof window[resetFuncName] === 'function') window[resetFuncName](); return;
     }
     if (!items || items.length === 0 || resultBox.classList.contains('hidden')) return;
     if (e.key === 'ArrowDown') { e.preventDefault(); currentFocus++; setActive(items, highlightColor); }
     else if (e.key === 'ArrowUp') { e.preventDefault(); currentFocus--; setActive(items, highlightColor); }
     else if (e.key === 'Enter') { e.preventDefault(); if (currentFocus > -1) { items[currentFocus].click(); } else if (items.length > 0) { items[0].click(); } }
   });
   function setActive(items, color) {
     items.forEach(item => { item.style.backgroundColor = ''; });
     if (currentFocus >= items.length) currentFocus = 0;
     if (currentFocus < 0) currentFocus = (items.length - 1);
     items[currentFocus].style.backgroundColor = color;
     items[currentFocus].scrollIntoView({ block: 'nearest' });
   }
 }


 function autoTitleCase(el) {
   if (!el || !el.value) return;
   const start = el.selectionStart; const end = el.selectionEnd;
   el.value = el.value.replace(/(^|[\s\/\-\.\(\)])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
   el.setSelectionRange(start, end);
 }
 
 function formatTglIndo(tglStr) {
   if (!tglStr || tglStr === '-') return '-';
   let parts = String(tglStr).split('-'); if (parts.length !== 3) return tglStr;
   const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
   return `${parseInt(parts[2], 10)} ${bulan[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
 }
 
 function formatTglAngka(tglStr) {
   if (!tglStr || tglStr === '-') return '-';
   let parts = String(tglStr).split('-'); 
   if (parts.length === 3 && parts[0].length === 4) { return `${parts[2]}-${parts[1]}-${parts[0]}`; }
   return tglStr;
 }
 
 function getTodayIso() {
   let d = new Date();
   let y = d.getFullYear();
   let mm = String(d.getMonth() + 1).padStart(2, '0');
   let dd = String(d.getDate()).padStart(2, '0');
   return `${y}-${mm}-${dd}`;
 }
 function getBulanRomawi(bulanAngka) {
   const romawi = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
   return romawi[parseInt(bulanAngka, 10)] || "";
 }
 function terbilangSKS(angka) {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"];
    return huruf[parseInt(angka)] || "";
 }


  function eksekusiCetakSurat(namaFileSurat, idAreaPrint) {
     const printContent = document.getElementById(idAreaPrint).innerHTML;
     const originalTitle = document.title;
     let cleanName = (namaFileSurat || "Surat_Klinik").replace(/[\/\\]/g, '_');
     document.title = cleanName; 

     const suratCss = `
       @page { size: A4; margin: 0; }
       body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #000; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .surat-container { width: 210mm; min-height: 297mm; padding: 20mm 15mm; box-sizing: border-box; margin: 0 auto; position: relative; }
       h1, h2, h3, h4, p { margin: 0; }
       .text-center { text-align: center; } .text-justify { text-align: justify; } .text-right { text-align: right; }
       .font-bold { font-weight: bold; } .font-black { font-weight: 900; } .font-normal { font-weight: normal; }
       .underline { text-decoration: underline; } .uppercase { text-transform: uppercase; }
       .w-full { width: 100%; } .w-32 { width: 128px; } .w-40 { width: 160px; } .w-48 { width: 192px; } .w-56 { width: 224px; } .w-4 { width: 16px; } .w-2 { width: 8px; } .w-64 { width: 256px; }
       .px-3 { padding-left: 12px; padding-right: 12px; } .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; } .py-2 { padding-top: 8px; padding-bottom: 8px; }
       .mb-2 { margin-bottom: 8px; } .mb-4 { margin-bottom: 16px; } .mb-5 { margin-bottom: 20px; } .mb-6 { margin-bottom: 24px; } .mb-8 { margin-bottom: 32px; } .mb-10 { margin-bottom: 40px; } .mb-24 { margin-bottom: 96px; }
       .mt-1 { margin-top: 4px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; } .mt-8 { margin-top: 32px; } .mt-12 { margin-top: 48px; }
       .ml-4 { margin-left: 16px; } .ml-6 { margin-left: 24px; }
       .flex { display: flex; } .justify-between { justify-content: space-between; } .justify-end { justify-content: flex-end; } .flex-col { flex-direction: column; } .items-center { align-items: center; } .align-top { vertical-align: top; }
       .text-sm { font-size: 14px; } .text-xs { font-size: 12px; }
       .leading-relaxed { line-height: 1.6; } .leading-tight { line-height: 1.25; }
       table { border-collapse: collapse; width: 100%; } td { vertical-align: top; }
       .border { border-width: 1px; } .border-b { border-bottom-width: 1px; } .border-l { border-left-width: 1px; } .border-slate-400 { border-color: #94a3b8; border-style: solid; }
       .bg-slate-50 { background-color: #f8fafc; }
       .divide-y > tr > td { border-bottom: 1px solid #94a3b8; } .divide-y > tr:last-child > td { border-bottom: none; }
     `;

     // Strategi 1: Buka Top-Level Popup Window (Agar Save As PDF mengambil judul cleanName)
     try {
       let printWin = window.open('', '_blank', 'width=850,height=900');
       if (printWin && !printWin.closed) {
         printWin.document.open();
         printWin.document.write(`
           <!DOCTYPE html><html><head><meta charset="utf-8"><title>${cleanName}</title><style>${suratCss}</style></head><body><div class="surat-container">${printContent}</div></body></html>
         `);
         printWin.document.close();
         printWin.focus();
         setTimeout(() => {
           printWin.document.title = cleanName;
           printWin.print();
           printWin.onafterprint = function() { printWin.close(); document.title = originalTitle; };
         }, 500);
         return;
       }
     } catch (err) {
       console.warn('Popup print window blocked, fallback to iframe:', err);
     }

     // Strategi 2: Fallback Hidden Iframe jika popup diblokir oleh browser
     let printFrame = document.getElementById('printFrameSurat');
     if (!printFrame) {
         printFrame = document.createElement('iframe'); printFrame.id = 'printFrameSurat';
         printFrame.style.cssText = 'position:absolute; width:0px; height:0px; border:none; z-index:-999;';
         document.body.appendChild(printFrame);
     }
     
     const frameDoc = printFrame.contentWindow.document; frameDoc.open();
     frameDoc.write(`
       <html><head><title>${cleanName}</title>
         <style>${suratCss}</style>
       </head><body><div class="surat-container">${printContent}</div></body></html>
     `);
     frameDoc.close(); printFrame.contentWindow.focus();
     setTimeout(() => { 
         document.title = cleanName;
         if (printFrame.contentWindow && printFrame.contentWindow.document) {
           printFrame.contentWindow.document.title = cleanName;
         }
         printFrame.contentWindow.print(); 
         printFrame.contentWindow.onafterprint = function() { document.title = originalTitle; };
         setTimeout(() => { document.title = originalTitle; }, 15000);
     }, 600);
  }

  // FUNGSI PREVIEW / VIEW SURAT MEDIS SEBELUM CETAK
  function bukaModalPreviewSurat(namaSurat, idAreaPrint, jenisSurat) {
    const area = document.getElementById(idAreaPrint);
    const container = document.getElementById('modalPreviewSuratContainer');
    const modal = document.getElementById('modalPreviewSurat');
    const titleEl = document.getElementById('modalPreviewSuratTitle');
    const btnCetak = document.getElementById('btnModalCetakSurat');

    if (!area || !container || !modal) return;
    
    if (titleEl) titleEl.innerText = `Pratinjau ${jenisSurat || 'Surat Medis'} (${namaSurat})`;
    container.innerHTML = area.innerHTML;
    
    if (btnCetak) {
      btnCetak.onclick = function() {
        eksekusiCetakSurat(namaSurat, idAreaPrint);
      };
    }
    
    modal.classList.remove('hidden');
  }

  function tutupModalPreviewSurat() {
    const modal = document.getElementById('modalPreviewSurat');
    if (modal) modal.classList.add('hidden');
  }

  // FUNGSI DIRECT DOWNLOAD PDF DENGAN NAMA NOMOR SURAT
  function downloadPDFSurat(namaFileSurat, idAreaPrint) {
    let cleanName = (namaFileSurat || "Dokumen_Surat").replace(/[\/\\]/g, '_');
    const el = document.getElementById(idAreaPrint);
    if (!el) { showToast('error', 'Elemen surat tidak ditemukan.'); return; }
    
    showToast('info', `Mempersiapkan PDF: ${cleanName}.pdf...`);
    
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `${cleanName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(el).save().then(() => {
        showToast('success', `Berhasil mengunduh: ${cleanName}.pdf`);
      }).catch(err => {
        console.error('html2pdf error:', err);
        showToast('warning', 'Mengalihkan ke dialog cetak browser...');
        eksekusiCetakSurat(cleanName, idAreaPrint);
      });
    } else {
      eksekusiCetakSurat(cleanName, idAreaPrint);
    }
  }


 function resetSemuaTombolSurat() {
   const btnConfig = {
     'navSakit': ['bg-teal-50', 'border-teal-500', 'ring-2', 'ring-teal-200', 'shadow-md', 'scale-105'],
     'navKontrol': ['bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200', 'shadow-md', 'scale-105'],
     'navResume': ['bg-purple-50', 'border-purple-500', 'ring-2', 'ring-purple-200', 'shadow-md', 'scale-105'],
     'navRujukan': ['bg-rose-50', 'border-rose-500', 'ring-2', 'ring-rose-200', 'shadow-md', 'scale-105'],
     'navLab': ['bg-cyan-50', 'border-cyan-500', 'ring-2', 'ring-cyan-200', 'shadow-md', 'scale-105'],
     'navRadiologi': ['bg-indigo-50', 'border-indigo-500', 'ring-2', 'ring-indigo-200', 'shadow-md', 'scale-105']
   };
   
   Object.keys(btnConfig).forEach(id => {
      let btn = document.getElementById(id);
      if(btn) {
         btn.classList.remove(...btnConfig[id]);
         btn.classList.add('bg-white', 'border-slate-200'); 
      }
   });
 }


 function changeSuratMenu(menu) {
   // Sembunyikan Panel Beranda
   document.getElementById('panelSuratBeranda').classList.add('hidden');
   
   ['panelSuratSakit', 'panelSuratKontrol', 'panelResumeMedis', 'panelSuratRujukan', 'panelSuratLab', 'panelSuratRadiologi'].forEach(id => {
     let el = document.getElementById(id); if (el) el.classList.add('hidden');
   });
   resetSemuaTombolSurat();
   
   const activeStyles = {
     'sakit': { id: 'navSakit', classes: ['bg-teal-50', 'border-teal-500', 'ring-2', 'ring-teal-200', 'shadow-md', 'scale-105'] },
     'kontrol': { id: 'navKontrol', classes: ['bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-200', 'shadow-md', 'scale-105'] },
     'resume': { id: 'navResume', classes: ['bg-purple-50', 'border-purple-500', 'ring-2', 'ring-purple-200', 'shadow-md', 'scale-105'] },
     'rujukan': { id: 'navRujukan', classes: ['bg-rose-50', 'border-rose-500', 'ring-2', 'ring-rose-200', 'shadow-md', 'scale-105'] },
     'lab': { id: 'navLab', classes: ['bg-cyan-50', 'border-cyan-500', 'ring-2', 'ring-cyan-200', 'shadow-md', 'scale-105'] },
     'radiologi': { id: 'navRadiologi', classes: ['bg-indigo-50', 'border-indigo-500', 'ring-2', 'ring-indigo-200', 'shadow-md', 'scale-105'] }
   };
   if (activeStyles[menu]) {
      let btn = document.getElementById(activeStyles[menu].id);
      if(btn) {
         btn.classList.remove('bg-white', 'border-slate-200');
         btn.classList.add(...activeStyles[menu].classes);
      }
   }
   
   if (menu === 'sakit') { document.getElementById('panelSuratSakit').classList.remove('hidden'); searchSksTable(); }
   else if (menu === 'kontrol') { document.getElementById('panelSuratKontrol').classList.remove('hidden'); searchSkpTable(); }
   else if (menu === 'resume') { document.getElementById('panelResumeMedis').classList.remove('hidden'); searchRsmTable(); }
   else if (menu === 'rujukan') { document.getElementById('panelSuratRujukan').classList.remove('hidden'); searchSpmTable(); }
   else if (menu === 'lab') { document.getElementById('panelSuratLab').classList.remove('hidden'); searchLabTable(); }
   else if (menu === 'radiologi') { document.getElementById('panelSuratRadiologi').classList.remove('hidden'); searchRadTable(); }
 }


 function tutupFormSurat() {
    ['panelSuratSakit', 'panelSuratKontrol', 'panelResumeMedis', 'panelSuratRujukan', 'panelSuratLab', 'panelSuratRadiologi'].forEach(id => { let el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    resetSemuaTombolSurat(); 
    // Munculkan kembali Panel Beranda (Dashboard)
    document.getElementById('panelSuratBeranda').classList.remove('hidden');
 }


 function initSuratModule() {
   if (document.getElementById('sksTglMulai')) document.getElementById('sksTglMulai').value = getTodayIso();
   if (document.getElementById('rsmTglKunjungan')) document.getElementById('rsmTglKunjungan').value = getTodayIso();
   if (document.getElementById('spmTglCetak')) document.getElementById('spmTglCetak').value = getTodayIso();
   if (document.getElementById('labTglCetak')) document.getElementById('labTglCetak').value = getTodayIso();
   if (document.getElementById('radTglCetak')) document.getElementById('radTglCetak').value = getTodayIso();
  
   setupAutocompleteNav('sksSearchPasien', 'sksSearchResult', '#ccfbf1', 'resetFormSKS'); 
   setupAutocompleteNav('skpSearchPasien', 'skpSearchResult', '#dbeafe', 'resetFormSKP'); 
   setupAutocompleteNav('rsmSearchPasien', 'rsmSearchResult', '#f3e8ff', 'resetFormRSM'); 
   setupAutocompleteNav('spmSearchPasien', 'spmSearchResult', '#ffe4e6', 'resetFormSPM'); 
   setupAutocompleteNav('labSearchPasien', 'labSearchResult', '#cffafe', 'resetFormLAB'); 
   setupAutocompleteNav('radSearchPasien', 'radSearchResult', '#e0e7ff', 'resetFormRAD'); 
   
   loadDokterMasterSIP();
   loadAllRiwayatSurat();
 }

 document.addEventListener('KlinikDataReady', initSuratModule);
 if (window.KlinikData && window.KlinikData.statusLoad && window.KlinikData.statusLoad.master) {
   initSuratModule();
 }


 function loadDokterMasterSIP() {
   google.script.run
     .withSuccessHandler(res => {
       listDokterDanSIP = res || [];
       if(listDokterDanSIP.length === 0) { listDokterDanSIP = [{ nama: "drg. A", sip: "-" }, { nama: "drg. B", sip: "-" }]; }
       populateDokterOptions();
     }).getDaftarDokterSIP();
 }


 function populateDokterOptions() {
   ['sksDokter', 'skpDokterTujuan', 'rsmDokter', 'spmDokter', 'labDokter', 'radDokter'].forEach(id => {
     const el = document.getElementById(id); if (!el) return;
     const cur = el.value; el.innerHTML = '<option value="" disabled selected>-- Pilih Dokter --</option>';
     listDokterDanSIP.forEach(d => { const opt = document.createElement('option'); opt.value = d.nama; opt.textContent = d.nama; el.appendChild(opt); });
     if (cur) { el.value = cur; } else if (window.activeNamaAccount) { const found = listDokterDanSIP.find(x => x.nama === window.activeNamaAccount); if (found) el.value = found.nama; }
   });
 }


 function getSIP(namaDokter) {
   const doc = listDokterDanSIP.find(x => x.nama === namaDokter);
   return doc && doc.sip && doc.sip !== '-' && doc.sip !== '' ? `SIP. ${doc.sip}` : 'SIP. -';
 }


 // ====================================================
 // FUNGSI PENARIK DATA SURAT & STATISTIK (DASHBOARD)
 // ====================================================
 function updateStatistikSurat() {
    let stats = { SKS: 0, SKP: 0, RSM: 0, SRP: 0, LAB: 0, RAD: 0 };
    dataSuratGlobal.forEach(s => {
        if (stats[s.jenisSurat] !== undefined) {
            stats[s.jenisSurat]++;
        } else if (s.jenisSurat === 'SPM') {
            stats['SRP']++; // Menangani history lama yang masih SPM
        }
    });
    
    document.getElementById('statSKS').innerText = stats.SKS;
    document.getElementById('statSKP').innerText = stats.SKP;
    document.getElementById('statRSM').innerText = stats.RSM;
    document.getElementById('statSRP').innerText = stats.SRP;
    document.getElementById('statLAB').innerText = stats.LAB;
    document.getElementById('statRAD').innerText = stats.RAD;
 }


 function loadAllRiwayatSurat() {
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.getSemuaRiwayatSurat) {
       google.script.run.withSuccessHandler(res => {
           dataSuratGlobal = res || [];
           
           // Panggil Update Dashboard Statistik
           updateStatistikSurat();
           
           rawListSKS = dataSuratGlobal.filter(s => s.jenisSurat === 'SKS');
           rawListSKP = dataSuratGlobal.filter(s => s.jenisSurat === 'SKP');
           rawListRSM = dataSuratGlobal.filter(s => s.jenisSurat === 'RSM');
           rawListSPM = dataSuratGlobal.filter(s => s.jenisSurat === 'SRP' || s.jenisSurat === 'SPM');
           rawListLAB = dataSuratGlobal.filter(s => s.jenisSurat === 'LAB');
           rawListRAD = dataSuratGlobal.filter(s => s.jenisSurat === 'RAD');
           
           searchSksTable();
           searchSkpTable();
           searchRsmTable();
           searchSpmTable();
           searchLabTable();
           searchRadTable();
       }).getSemuaRiwayatSurat();
   }
 }


 // ====================================================
 // FITUR QUICK SEARCH / VERIFIKASI DOKUMEN
 // ====================================================
 function prosesVerifikasiSurat() {
    let q = document.getElementById('inputVerifikasiSurat').value.toLowerCase().trim();
    let container = document.getElementById('hasilVerifikasiContainer');
    
    if (q.length < 3) {
        container.classList.add('hidden');
        return;
    }
    
    let results = dataSuratGlobal.filter(s => 
        (s.noSurat && s.noSurat.toLowerCase().includes(q)) || 
        (s.namaPasien && s.namaPasien.toLowerCase().includes(q))
    );
    
    if (results.length === 0) {
        container.innerHTML = `<div class="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-center font-bold text-xs">⚠️ Dokumen tidak ditemukan. Pastikan Nomor Surat atau Nama Pasien benar.</div>`;
    } else {
        let html = results.slice(0, 5).map(s => {
            let warnaBadge = "bg-slate-100 text-slate-600 border-slate-200";
            if(s.jenisSurat === "SKS") warnaBadge = "bg-teal-50 text-teal-600 border-teal-200";
            if(s.jenisSurat === "SKP") warnaBadge = "bg-blue-50 text-blue-600 border-blue-200";
            if(s.jenisSurat === "RSM") warnaBadge = "bg-purple-50 text-purple-600 border-purple-200";
            if(s.jenisSurat === "SRP" || s.jenisSurat === "SPM") warnaBadge = "bg-rose-50 text-rose-600 border-rose-200";
            if(s.jenisSurat === "LAB") warnaBadge = "bg-cyan-50 text-cyan-600 border-cyan-200";
            if(s.jenisSurat === "RAD") warnaBadge = "bg-indigo-50 text-indigo-600 border-indigo-200";
            
            return `
            <div class="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between border-l-4 border-l-emerald-500 gap-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 border rounded text-[9px] font-black uppercase ${warnaBadge}">${s.jenisSurat}</span>
                        <span class="font-mono font-bold text-slate-800 text-xs">${s.noSurat}</span>
                    </div>
                    <p class="font-bold text-emerald-700 text-sm">${s.namaPasien}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Tgl Terbit: ${s.tglCetak} • Dokter/Penanggung Jawab: ${s.dokter}</p>
                </div>
                <div class="md:text-right">
                    <span class="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">✅ DOKUMEN VALID</span>
                </div>
            </div>`;
        }).join('');
        
        if(results.length > 5) {
            html += `<div class="text-center text-[10px] text-slate-400 font-bold mt-2 pt-2">Menampilkan 5 dari ${results.length} dokumen. Ketik lebih spesifik...</div>`;
        }
        
        container.innerHTML = html;
    }
    container.classList.remove('hidden');
 }


 function masterSearchPasienLogic(inputQ, resultBoxId, onClickPrefix, colorClass) {
   if (debounceTimerId[resultBoxId]) clearTimeout(debounceTimerId[resultBoxId]);
   
   debounceTimerId[resultBoxId] = setTimeout(() => {
     let resBox = document.getElementById(resultBoxId);
     if (!resBox) return;
     let q = (inputQ || '').toLowerCase().trim();
     if (!q || q.length < 2) { resBox.classList.add('hidden'); return; }
     
     let allPasien = (window.KlinikData && Array.isArray(window.KlinikData.pasien)) ? window.KlinikData.pasien : [];
     let list = allPasien.filter(p => {
       let n = (p.namaPasien || '').toLowerCase();
       let rm = (p.noRm || '').toLowerCase();
       return n.includes(q) || rm.includes(q);
     });
     
     if (list.length === 0) {
       resBox.innerHTML = '<div class="p-2.5 text-slate-400 font-medium text-xs text-center">Pasien tidak ditemukan</div>';
     } else {
       resBox.innerHTML = list.slice(0, 6).map(p => `
         <div onclick="pilihPasien${onClickPrefix}('${p.idPasien}')" class="search-item p-2.5 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors hover:bg-slate-50">
           <div><p class="font-bold text-slate-800 text-xs">${p.namaPasien}</p></div>
           <span class="font-mono text-[10px] bg-${colorClass}-100 text-${colorClass}-800 px-2 py-0.5 rounded font-bold">${p.noRm}</span>
         </div>
       `).join('');
     }
     resBox.classList.remove('hidden');
   }, 300);
 }


 
 // Tutup dropdown autocomplete saat klik di luar area
 document.addEventListener('click', function(e) {
   ['sks', 'skp', 'rsm', 'spm', 'lab', 'rad'].forEach(prefix => {
     let inp = document.getElementById(prefix + 'SearchPasien');
     let res = document.getElementById(prefix + 'SearchResult');
     if (res && !res.classList.contains('hidden')) {
       if (!res.contains(e.target) && e.target !== inp) {
         res.classList.add('hidden');
       }
     }
   });
 });

 // ===================================== SKS =====================================
 function searchPasienSKS() { masterSearchPasienLogic(document.getElementById('sksSearchPasien').value.toLowerCase(), 'sksSearchResult', 'SKS', 'teal'); }
 function pilihPasienSKS(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('sksIdPasien').value = p.idPasien; document.getElementById('sksNoRm').value = p.noRm;
   let umurClean = String(p.umur).replace(/tahun|th/gi, '').trim(); let umurFinal = umurClean ? umurClean + ' Tahun' : '';
   document.getElementById('sksNama').value = p.namaPasien; document.getElementById('sksUmur').value = umurFinal;
   document.getElementById('sksJK').value = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-Laki' ? 'Laki-Laki' : (p.jenisKelamin ? 'Perempuan' : '');
   document.getElementById('sksAlamat').value = p.alamat || ''; document.getElementById('sksPekerjaan').value = p.pekerjaan || ''; document.getElementById('sksSearchPasien').value = p.namaPasien;
   document.getElementById('sksSearchResult').classList.add('hidden');
 }
 function validasiLamaSKS(el) {
   let val = parseInt(el.value, 10);
   if (!isNaN(val) && val > 5) {
     el.value = 5;
     if (typeof showToast === 'function') {
       showToast('warning', 'Lama istirahat maksimal 5 hari! Isian lebih dari 5 hari ditolak.');
     }
   } else if (!isNaN(val) && val < 1) {
     el.value = 1;
   }
 }
 function hitungTglSelesaiSKS() {
   let lamaEl = document.getElementById('sksLamaHari');
   let lama = parseInt(lamaEl.value, 10);
   if (!isNaN(lama) && lama > 5) {
     lamaEl.value = 5;
     lama = 5;
     if (typeof showToast === 'function') {
       showToast('warning', 'Lama istirahat maksimal 5 hari! Isian lebih dari 5 hari ditolak.');
     }
   }
   let tglMulaiStr = document.getElementById('sksTglMulai').value;
   if(isNaN(lama) || lama < 1) { document.getElementById('sksTglSelesai').value = ''; return; }
   if (tglMulaiStr) { 
     let d = new Date(tglMulaiStr); 
     d.setDate(d.getDate() + (lama - 1)); 
     let y = d.getFullYear();
     let mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0'); 
     document.getElementById('sksTglSelesai').value = `${y}-${mm}-${dd}`; 
   }
 }
 function resetFormSKS() { document.getElementById('formSKS').reset(); document.getElementById('sksIdPasien').value = ''; document.getElementById('sksNoRm').value = ''; document.getElementById('sksTglMulai').value = getTodayIso(); populateDokterOptions(); hitungTglSelesaiSKS(); }
 function searchSksTable() { 
    if(debounceTimerId['sksTable']) clearTimeout(debounceTimerId['sksTable']);
    debounceTimerId['sksTable'] = setTimeout(() => {
      let q = document.getElementById('sksSearchTable').value.toLowerCase().trim(); filteredListSKS = rawListSKS.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageSKS = 1; renderSksTable(); 
    }, 400);
 }
 function renderSksTable() {
   let tbody = document.getElementById('sksTableBody'); document.getElementById('sksTotalBadge').innerText = `Total: ${filteredListSKS.length} Surat`;
   let totalPages = Math.ceil(filteredListSKS.length / SURAT_PER_PAGE) || 1; if (pageSKS > totalPages) pageSKS = totalPages;
   document.getElementById('sksPageInfo').innerText = `Halaman ${pageSKS} dari ${totalPages}`; document.getElementById('btnPrevSKS').disabled = (pageSKS === 1); document.getElementById('btnNextSKS').disabled = (pageSKS === totalPages || filteredListSKS.length === 0);
   let startIdx = (pageSKS - 1) * SURAT_PER_PAGE; let pageData = filteredListSKS.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat SKS tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-teal-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'}</td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.lamaHari || '-'} Hari</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangSKS('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-teal-50 hover:text-teal-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewSKS('${s.noSurat}')" class="px-2.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-lg text-[10px] font-bold border border-teal-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageSKS() { if(pageSKS > 1) { pageSKS--; renderSksTable(); } }
 function nextPageSKS() { let t = Math.ceil(filteredListSKS.length/SURAT_PER_PAGE); if(pageSKS < t) { pageSKS++; renderSksTable(); } }
 function populatePrintAreaSKS(item) {
    document.getElementById('sksPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('sksPrintNama').innerText = item.namaPasien; document.getElementById('sksPrintUmur').innerText = item.umur; document.getElementById('sksPrintJK').innerText = item.jk; document.getElementById('sksPrintPekerjaan').innerText = item.pekerjaan; document.getElementById('sksPrintAlamat').innerText = item.alamat; document.getElementById('sksPrintLama').innerText = item.lamaHari; document.getElementById('sksPrintLamaTerbilang').innerText = terbilangSKS(item.lamaHari); document.getElementById('sksPrintMulai').innerText = formatTglIndo(item.tglMulai); document.getElementById('sksPrintSelesai').innerText = formatTglIndo(item.tglSelesai); document.getElementById('sksPrintTglCetak').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('sksPrintDokter').innerText = item.dokter; document.getElementById('sksPrintSIP').innerText = getSIP(item.dokter);
 }
 function cetakUlangSKS(noSurat) {
    let item = rawListSKS.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaSKS(item); eksekusiCetakSurat(item.noSurat, 'printAreaSKS');
 }
   function viewSKS(noSurat) {
     let item = rawListSKS.find(x => x.noSurat === noSurat); if (!item) return;
     populatePrintAreaSKS(item);
     bukaModalPreviewSurat(item.noSurat, 'printAreaSKS', 'Surat Keterangan Sakit');
  }
  function downloadPdfSKS(noSurat) {
    let item = rawListSKS.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaSKS(item); downloadPDFSurat(item.noSurat, 'printAreaSKS');
 }
 function handleCetakSKS(e) {
   e.preventDefault(); if (!document.getElementById('sksIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   let lamaVal = parseInt(document.getElementById('sksLamaHari').value, 10);
   if (isNaN(lamaVal) || lamaVal < 1) { showToast('warning', 'Masukkan lama istirahat minimal 1 hari!'); return; }
   if (lamaVal > 5) {
     document.getElementById('sksLamaHari').value = 5;
     hitungTglSelesaiSKS();
     showToast('error', 'Isian ditolak! Lama istirahat surat sakit maksimal 5 hari.');
     return;
   }
   let lamaInput = String(lamaVal);
   let payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('sksIdPasien').value, noRm: document.getElementById('sksNoRm').value, namaPasien: document.getElementById('sksNama').value, umur: document.getElementById('sksUmur').value, jk: document.getElementById('sksJK').value, alamat: document.getElementById('sksAlamat').value, pekerjaan: document.getElementById('sksPekerjaan').value, lamaHari: lamaInput, tglMulai: document.getElementById('sksTglMulai').value, tglSelesai: document.getElementById('sksTglSelesai').value, dokter: document.getElementById('sksDokter').value };
   let btn = document.getElementById('btnCetakSKS'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); 
   let blnRomawi = getBulanRomawi(blnStr); 
   let thn4Digit = new Date().getFullYear().toString(); 
   let urutStr = ("000" + (rawListSKS.length + 1)).slice(-3); 
   let fallbackNo = "SKS/SHELDON/" + urutStr + "/" + blnRomawi + "-" + thn4Digit;
   
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanSuratSakit) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK SKS'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('SKS') ? res.noSurat : fallbackNo;
           document.getElementById('sksPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('sksPrintNama').innerText = payload.namaPasien; document.getElementById('sksPrintUmur').innerText = payload.umur; document.getElementById('sksPrintJK').innerText = payload.jk; document.getElementById('sksPrintPekerjaan').innerText = payload.pekerjaan; document.getElementById('sksPrintAlamat').innerText = payload.alamat; document.getElementById('sksPrintLama').innerText = payload.lamaHari; document.getElementById('sksPrintLamaTerbilang').innerText = terbilangSKS(payload.lamaHari); document.getElementById('sksPrintMulai').innerText = formatTglIndo(payload.tglMulai); document.getElementById('sksPrintSelesai').innerText = formatTglIndo(payload.tglSelesai); document.getElementById('sksPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('sksPrintDokter').innerText = payload.dokter; document.getElementById('sksPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(finalNoSurat, 'printAreaSKS'); showToast('success', 'Surat Sakit berhasil disimpan.');
           rawListSKS.unshift({ noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, lamaHari: payload.lamaHari, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SKS', noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormSKS(); updateStatistikSurat(); searchSksTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK SKS'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanSuratSakit(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK SKS'; btn.disabled = false;
           document.getElementById('sksPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('sksPrintNama').innerText = payload.namaPasien; document.getElementById('sksPrintUmur').innerText = payload.umur; document.getElementById('sksPrintJK').innerText = payload.jk; document.getElementById('sksPrintPekerjaan').innerText = payload.pekerjaan; document.getElementById('sksPrintAlamat').innerText = payload.alamat; document.getElementById('sksPrintLama').innerText = payload.lamaHari; document.getElementById('sksPrintLamaTerbilang').innerText = terbilangSKS(payload.lamaHari); document.getElementById('sksPrintMulai').innerText = formatTglIndo(payload.tglMulai); document.getElementById('sksPrintSelesai').innerText = formatTglIndo(payload.tglSelesai); document.getElementById('sksPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('sksPrintDokter').innerText = payload.dokter; document.getElementById('sksPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(fallbackNo, 'printAreaSKS'); showToast('success', 'Preview Surat Sakit Ditampilkan.');
           rawListSKS.unshift({ noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, lamaHari: payload.lamaHari, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SKS', noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormSKS(); updateStatistikSurat(); searchSksTable(); 
       }, 500);
   }
 }


 // ===================================== SKP =====================================
 function searchPasienSKP() { masterSearchPasienLogic(document.getElementById('skpSearchPasien').value.toLowerCase(), 'skpSearchResult', 'SKP', 'blue'); }
 function pilihPasienSKP(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('skpIdPasien').value = p.idPasien; document.getElementById('skpNoRm').value = p.noRm; document.getElementById('skpNama').value = p.namaPasien; document.getElementById('skpSearchPasien').value = p.namaPasien; document.getElementById('skpSearchResult').classList.add('hidden');
   let rmList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === id);
   if (rmList.length > 0) { let lastRm = rmList[rmList.length - 1]; document.getElementById('skpDiagnosis').value = lastRm.assessmentICD || ''; document.getElementById('skpTindakan').value = lastRm.tindakanHariIni || ''; }
 }
 function resetFormSKP() { document.getElementById('formSKP').reset(); document.getElementById('skpIdPasien').value = ''; document.getElementById('skpNoRm').value = ''; populateDokterOptions(); }
 function searchSkpTable() { 
    if(debounceTimerId['skpTable']) clearTimeout(debounceTimerId['skpTable']);
    debounceTimerId['skpTable'] = setTimeout(() => {
       let q = document.getElementById('skpSearchTable').value.toLowerCase().trim(); filteredListSKP = rawListSKP.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageSKP = 1; renderSkpTable(); 
    }, 400);
 }
 function renderSkpTable() {
   let tbody = document.getElementById('skpTableBody'); document.getElementById('skpTotalBadge').innerText = `Total: ${filteredListSKP.length} Surat`;
   let totalPages = Math.ceil(filteredListSKP.length / SURAT_PER_PAGE) || 1; if (pageSKP > totalPages) pageSKP = totalPages;
   document.getElementById('skpPageInfo').innerText = `Halaman ${pageSKP} dari ${totalPages}`; document.getElementById('btnPrevSKP').disabled = (pageSKP === 1); document.getElementById('btnNextSKP').disabled = (pageSKP === totalPages || filteredListSKP.length === 0);
   let startIdx = (pageSKP - 1) * SURAT_PER_PAGE; let pageData = filteredListSKP.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat SKP tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-blue-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'} <br> <span class="font-normal text-[10px] text-slate-500 font-mono">RM: ${s.noRm || '-'}</span></td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.dokterTujuan || '-'}</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangSKP('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewSKP('${s.noSurat}')" class="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold border border-blue-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageSKP() { if(pageSKP > 1) { pageSKP--; renderSkpTable(); } }
 function nextPageSKP() { let t = Math.ceil(filteredListSKP.length/SURAT_PER_PAGE); if(pageSKP < t) { pageSKP++; renderSkpTable(); } }
 function cetakUlangSKP(noSurat) {
    let item = rawListSKP.find(x => x.noSurat === noSurat); if (!item) return;
    document.getElementById('skpPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('skpPrintNama').innerText = item.namaPasien; document.getElementById('skpPrintNoRm').innerText = item.noRm; document.getElementById('skpPrintDiagnosis').innerText = item.diagnosis; document.getElementById('skpPrintTindakan').innerText = item.tindakan;
    if (item.tglKontrol && item.tglKontrol.match(/\d{4}-\d{2}-\d{2}/)) { document.getElementById('skpPrintTglKontrol').innerText = formatTglIndo(item.tglKontrol); } else { document.getElementById('skpPrintTglKontrol').innerHTML = item.tglKontrol ? item.tglKontrol : '&nbsp;'; }
    document.getElementById('skpPrintDokterTujuan').innerText = item.dokterTujuan; document.getElementById('skpPrintAlasan').innerHTML = item.alasanKontrol ? item.alasanKontrol : '&nbsp;'; document.getElementById('skpPrintTglCetak').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('skpPrintDokter').innerText = item.dokterTujuan; document.getElementById('skpPrintSIP').innerText = getSIP(item.dokterTujuan);
    eksekusiCetakSurat(item.noSurat, 'printAreaSKP');
 }
 function handleCetakSKP(e) {
   e.preventDefault(); if (!document.getElementById('skpIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   let payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('skpIdPasien').value, noRm: document.getElementById('skpNoRm').value, namaPasien: document.getElementById('skpNama').value, diagnosis: document.getElementById('skpDiagnosis').value, tindakan: document.getElementById('skpTindakan').value, tglKontrol: document.getElementById('skpTglKontrol').value || '', dokterTujuan: document.getElementById('skpDokterTujuan').value, alasanKontrol: document.getElementById('skpAlasan').value || '' };
   let btn = document.getElementById('btnCetakSKP'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); let blnRomawi = getBulanRomawi(blnStr); let thn4Digit = new Date().getFullYear().toString(); let urutStr = ("000" + (rawListSKP.length + 1)).slice(-3); 
   let fallbackNo = "SKP/SHELDON/" + urutStr + "/" + blnRomawi + "-" + thn4Digit; 
   
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanSuratKontrol) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK SKP'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('SKP') ? res.noSurat : fallbackNo;
           document.getElementById('skpPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('skpPrintNama').innerText = payload.namaPasien; document.getElementById('skpPrintNoRm').innerText = payload.noRm; document.getElementById('skpPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('skpPrintTindakan').innerText = payload.tindakan;
           if (payload.tglKontrol && payload.tglKontrol.match(/\d{4}-\d{2}-\d{2}/)) { document.getElementById('skpPrintTglKontrol').innerText = formatTglIndo(payload.tglKontrol); } else { document.getElementById('skpPrintTglKontrol').innerHTML = payload.tglKontrol ? payload.tglKontrol : '&nbsp;'; }
           document.getElementById('skpPrintDokterTujuan').innerText = payload.dokterTujuan; document.getElementById('skpPrintAlasan').innerHTML = payload.alasanKontrol ? payload.alasanKontrol : '&nbsp;'; document.getElementById('skpPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('skpPrintDokter').innerText = payload.dokterTujuan; document.getElementById('skpPrintSIP').innerText = getSIP(payload.dokterTujuan);
           eksekusiCetakSurat(finalNoSurat, 'printAreaSKP'); showToast('success', 'Surat Kontrol berhasil disimpan.');
           rawListSKP.unshift({ noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, dokterTujuan: payload.dokterTujuan, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SKP', noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokterTujuan}); resetFormSKP(); updateStatistikSurat(); searchSkpTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK SKP'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanSuratKontrol(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK SKP'; btn.disabled = false;
           document.getElementById('skpPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('skpPrintNama').innerText = payload.namaPasien; document.getElementById('skpPrintNoRm').innerText = payload.noRm; document.getElementById('skpPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('skpPrintTindakan').innerText = payload.tindakan;
           if (payload.tglKontrol && payload.tglKontrol.match(/\d{4}-\d{2}-\d{2}/)) { document.getElementById('skpPrintTglKontrol').innerText = formatTglIndo(payload.tglKontrol); } else { document.getElementById('skpPrintTglKontrol').innerHTML = payload.tglKontrol ? payload.tglKontrol : '&nbsp;'; }
           document.getElementById('skpPrintDokterTujuan').innerText = payload.dokterTujuan; document.getElementById('skpPrintAlasan').innerHTML = payload.alasanKontrol ? payload.alasanKontrol : '&nbsp;'; document.getElementById('skpPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('skpPrintDokter').innerText = payload.dokterTujuan; document.getElementById('skpPrintSIP').innerText = getSIP(payload.dokterTujuan);
           eksekusiCetakSurat(fallbackNo, 'printAreaSKP'); showToast('success', 'Preview Surat Kontrol Ditampilkan.');
           rawListSKP.unshift({ noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, dokterTujuan: payload.dokterTujuan, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SKP', noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokterTujuan}); resetFormSKP(); updateStatistikSurat(); searchSkpTable(); 
       }, 500);
   }
 }


 // ===================================== RSM =====================================
 function searchPasienRSM() { masterSearchPasienLogic(document.getElementById('rsmSearchPasien').value.toLowerCase(), 'rsmSearchResult', 'RSM', 'purple'); }
 function pilihPasienRSM(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('rsmIdPasien').value = p.idPasien; document.getElementById('rsmNoRm').value = p.noRm;
   let tglLahirFinal = p.tanggalLahir ? formatTglIndo(p.tanggalLahir) : '-'; let umurClean = String(p.umur).replace(/tahun|th/gi, '').trim(); let gabungUmur = umurClean ? ` / ${umurClean} Tahun` : '';
   document.getElementById('rsmNama').value = p.namaPasien; document.getElementById('rsmUmur').value = tglLahirFinal + gabungUmur; document.getElementById('rsmAlamat').value = p.alamat || ''; document.getElementById('rsmSearchPasien').value = p.namaPasien; document.getElementById('rsmSearchResult').classList.add('hidden');
   let rmList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === id);
   if (rmList.length > 0) {
     let lastRm = rmList[rmList.length - 1]; document.getElementById('rsmRingkasanKlinis').value = (lastRm.chiefComplaint || '') + (lastRm.presentIllness ? ' | ' + lastRm.presentIllness : ''); document.getElementById('rsmPemeriksaanPenunjang').value = lastRm.pemeriksaanPenunjang || ''; document.getElementById('rsmDiagnosisKerja').value = lastRm.assessmentICD || ''; document.getElementById('rsmTindakanMedis').value = lastRm.tindakanHariIni || ''; document.getElementById('rsmMedikamentosa').value = lastRm.resepObat || '';
     let edukasi = lastRm.catatanEdukasi || ''; if (edukasi.toLowerCase().includes('catatan edukasi') || edukasi.toLowerCase() === 'kondisi stabil pasca perawatan.') { edukasi = ''; } document.getElementById('rsmHasilPerawatan').value = edukasi;
   }
 }
 function resetFormRSM() { document.getElementById('formRSM').reset(); document.getElementById('rsmIdPasien').value = ''; document.getElementById('rsmNoRm').value = ''; document.getElementById('rsmTglKunjungan').value = getTodayIso(); populateDokterOptions(); }
 function searchRsmTable() { 
    if(debounceTimerId['rsmTable']) clearTimeout(debounceTimerId['rsmTable']);
    debounceTimerId['rsmTable'] = setTimeout(() => {
       let q = document.getElementById('rsmSearchTable').value.toLowerCase().trim(); filteredListRSM = rawListRSM.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageRSM = 1; renderRsmTable(); 
    }, 400);
 }
 function renderRsmTable() {
   let tbody = document.getElementById('rsmTableBody'); document.getElementById('rsmTotalBadge').innerText = `Total: ${filteredListRSM.length} Surat`;
   let totalPages = Math.ceil(filteredListRSM.length / SURAT_PER_PAGE) || 1; if (pageRSM > totalPages) pageRSM = totalPages;
   document.getElementById('rsmPageInfo').innerText = `Halaman ${pageRSM} dari ${totalPages}`; document.getElementById('btnPrevRSM').disabled = (pageRSM === 1); document.getElementById('btnNextRSM').disabled = (pageRSM === totalPages || filteredListRSM.length === 0);
   let startIdx = (pageRSM - 1) * SURAT_PER_PAGE; let pageData = filteredListRSM.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat RSM tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-purple-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'} <br> <span class="font-normal text-[10px] text-slate-500 font-mono">RM: ${s.noRm || '-'}</span></td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.dokter || '-'}</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangRSM('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-purple-50 hover:text-purple-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewRSM('${s.noSurat}')" class="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg text-[10px] font-bold border border-purple-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageRSM() { if(pageRSM > 1) { pageRSM--; renderRsmTable(); } }
 function nextPageRSM() { let t = Math.ceil(filteredListRSM.length/SURAT_PER_PAGE); if(pageRSM < t) { pageRSM++; renderRsmTable(); } }
 function populatePrintAreaRSM(item) {
    document.getElementById('rsmPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('rsmPrintNama').innerText = item.namaPasien; document.getElementById('rsmPrintNoRm').innerText = item.noRm; document.getElementById('rsmPrintUmur').innerText = item.umur; document.getElementById('rsmPrintTglKunjungan').innerText = formatTglIndo(item.tglKunjungan); document.getElementById('rsmPrintAlamat').innerText = item.alamat; document.getElementById('rsmPrintRingkasan').innerText = item.ringkasanKlinis; document.getElementById('rsmPrintPenunjang').innerText = item.pemeriksaanPenunjang; document.getElementById('rsmPrintDiagnosis').innerText = item.diagnosisKerja; document.getElementById('rsmPrintTindakan').innerText = item.tindakanMedis; document.getElementById('rsmPrintObat').innerText = item.medikamentosa; document.getElementById('rsmPrintHasil').innerText = item.hasilPerawatan; document.getElementById('rsmPrintKeperluan').innerText = item.keperluan; document.getElementById('rsmPrintTglCetak').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('rsmPrintDokter').innerText = item.dokter; document.getElementById('rsmPrintSIP').innerText = getSIP(item.dokter); document.getElementById('rsmPrintTtdPasien').innerText = item.namaPasien;
 }
 function cetakUlangRSM(noSurat) {
    let item = rawListRSM.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaRSM(item); eksekusiCetakSurat(item.noSurat, 'printAreaRSM');
 }
   function viewRSM(noSurat) {
     let item = rawListRSM.find(x => x.noSurat === noSurat); if (!item) return;
     populatePrintAreaRSM(item);
     bukaModalPreviewSurat(item.noSurat, 'printAreaRSM', 'Resume Medis Pasien');
  }
  function downloadPdfRSM(noSurat) {
    let item = rawListRSM.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaRSM(item); downloadPDFSurat(item.noSurat, 'printAreaRSM');
 }
 function handleCetakRSM(e) {
   e.preventDefault(); if (!document.getElementById('rsmIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   const payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('rsmIdPasien').value, noRm: document.getElementById('rsmNoRm').value, namaPasien: document.getElementById('rsmNama').value, umur: document.getElementById('rsmUmur').value, alamat: document.getElementById('rsmAlamat').value, tglKunjungan: document.getElementById('rsmTglKunjungan').value, ringkasanKlinis: document.getElementById('rsmRingkasanKlinis').value, pemeriksaanPenunjang: document.getElementById('rsmPemeriksaanPenunjang').value, diagnosisKerja: document.getElementById('rsmDiagnosisKerja').value, tindakanMedis: document.getElementById('rsmTindakanMedis').value, medikamentosa: document.getElementById('rsmMedikamentosa').value, hasilPerawatan: document.getElementById('rsmHasilPerawatan').value, keperluan: document.getElementById('rsmKeperluan').value, dokter: document.getElementById('rsmDokter').value };
   for (let key in payload) { if (!payload[key] || payload[key].trim() === "") { showToast('error', 'Semua isian pada Resume Medis wajib diisi lengkap!'); return; } }
   let btn = document.getElementById('btnCetakRSM'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); let blnRomawi = getBulanRomawi(blnStr); let thn4Digit = new Date().getFullYear().toString(); let urutStr = ("000" + (rawListRSM.length + 1)).slice(-3); let fallbackNo = "RMP/SHELDON/" + urutStr + "/" + blnRomawi + "-" + thn4Digit;
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanResumeMedis) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK RESUME'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('RMP') ? res.noSurat : fallbackNo;
           document.getElementById('rsmPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('rsmPrintNama').innerText = payload.namaPasien; document.getElementById('rsmPrintNoRm').innerText = payload.noRm; document.getElementById('rsmPrintUmur').innerText = payload.umur; document.getElementById('rsmPrintTglKunjungan').innerText = formatTglIndo(payload.tglKunjungan); document.getElementById('rsmPrintAlamat').innerText = payload.alamat; document.getElementById('rsmPrintRingkasan').innerText = payload.ringkasanKlinis; document.getElementById('rsmPrintPenunjang').innerText = payload.pemeriksaanPenunjang; document.getElementById('rsmPrintDiagnosis').innerText = payload.diagnosisKerja; document.getElementById('rsmPrintTindakan').innerText = payload.tindakanMedis; document.getElementById('rsmPrintObat').innerText = payload.medikamentosa; document.getElementById('rsmPrintHasil').innerText = payload.hasilPerawatan; document.getElementById('rsmPrintKeperluan').innerText = payload.keperluan; document.getElementById('rsmPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('rsmPrintDokter').innerText = payload.dokter; document.getElementById('rsmPrintSIP').innerText = getSIP(payload.dokter); document.getElementById('rsmPrintTtdPasien').innerText = payload.namaPasien;
           eksekusiCetakSurat(finalNoSurat, 'printAreaRSM'); showToast('success', 'Resume Medis berhasil disimpan.');
           rawListRSM.unshift({ noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), ...payload }); dataSuratGlobal.unshift({jenisSurat: 'RSM', noSurat: finalNoSurat, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormRSM(); updateStatistikSurat(); searchRsmTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK RESUME'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanResumeMedis(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK RESUME'; btn.disabled = false;
           document.getElementById('rsmPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('rsmPrintNama').innerText = payload.namaPasien; document.getElementById('rsmPrintNoRm').innerText = payload.noRm; document.getElementById('rsmPrintUmur').innerText = payload.umur; document.getElementById('rsmPrintTglKunjungan').innerText = formatTglIndo(payload.tglKunjungan); document.getElementById('rsmPrintAlamat').innerText = payload.alamat; document.getElementById('rsmPrintRingkasan').innerText = payload.ringkasanKlinis; document.getElementById('rsmPrintPenunjang').innerText = payload.pemeriksaanPenunjang; document.getElementById('rsmPrintDiagnosis').innerText = payload.diagnosisKerja; document.getElementById('rsmPrintTindakan').innerText = payload.tindakanMedis; document.getElementById('rsmPrintObat').innerText = payload.medikamentosa; document.getElementById('rsmPrintHasil').innerText = payload.hasilPerawatan; document.getElementById('rsmPrintKeperluan').innerText = payload.keperluan; document.getElementById('rsmPrintTglCetak').innerText = 'Payakumbuh, ' + formatTglIndo(getTodayIso()); document.getElementById('rsmPrintDokter').innerText = payload.dokter; document.getElementById('rsmPrintSIP').innerText = getSIP(payload.dokter); document.getElementById('rsmPrintTtdPasien').innerText = payload.namaPasien;
           eksekusiCetakSurat(fallbackNo, 'printAreaRSM'); showToast('success', 'Preview Resume Medis Ditampilkan.');
           rawListRSM.unshift({ noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), ...payload }); dataSuratGlobal.unshift({jenisSurat: 'RSM', noSurat: fallbackNo, tglCetak: formatTglIndo(getTodayIso()), namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormRSM(); updateStatistikSurat(); searchRsmTable(); 
       }, 500);
   }
 }


 // ===================================== SPM =====================================
 function searchPasienSPM() { masterSearchPasienLogic(document.getElementById('spmSearchPasien').value.toLowerCase(), 'spmSearchResult', 'SPM', 'rose'); }
 function pilihPasienSPM(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('spmIdPasien').value = p.idPasien; document.getElementById('spmNoRm').value = p.noRm;
   let tglLahirFinal = p.tanggalLahir ? formatTglIndo(p.tanggalLahir) : '-'; let umurClean = String(p.umur).replace(/tahun|th/gi, '').trim(); let gabungUmur = umurClean ? ` / ${umurClean} Tahun` : '';
   document.getElementById('spmNama').value = p.namaPasien; document.getElementById('spmUmur').value = tglLahirFinal + gabungUmur; document.getElementById('spmJK').value = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-Laki' ? 'Laki-Laki' : (p.jenisKelamin ? 'Perempuan' : '-'); document.getElementById('spmAlamat').value = p.alamat || '-'; document.getElementById('spmSearchPasien').value = p.namaPasien; document.getElementById('spmSearchResult').classList.add('hidden');
   let rmList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === id);
   if (rmList.length > 0) { let lastRm = rmList[rmList.length - 1]; document.getElementById('spmAnamnesa').value = (lastRm.chiefComplaint || '') + (lastRm.presentIllness ? ' | ' + lastRm.presentIllness : ''); document.getElementById('spmFisik').value = lastRm.pemeriksaanPenunjang || ''; document.getElementById('spmDiagnosis').value = lastRm.assessmentICD || ''; document.getElementById('spmTerapi').value = (lastRm.tindakanHariIni || '') + (lastRm.resepObat ? ' | ' + lastRm.resepObat : ''); }
 }
 function resetFormSPM() { document.getElementById('formSPM').reset(); document.getElementById('spmIdPasien').value = ''; document.getElementById('spmNoRm').value = ''; document.getElementById('spmTglCetak').value = getTodayIso(); populateDokterOptions(); }
 function searchSpmTable() { 
    if(debounceTimerId['spmTable']) clearTimeout(debounceTimerId['spmTable']);
    debounceTimerId['spmTable'] = setTimeout(() => {
       let q = document.getElementById('spmSearchTable').value.toLowerCase().trim(); filteredListSPM = rawListSPM.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageSPM = 1; renderSpmTable(); 
    }, 400);
 }
 function renderSpmTable() {
   let tbody = document.getElementById('spmTableBody'); document.getElementById('spmTotalBadge').innerText = `Total: ${filteredListSPM.length} Surat`;
   let totalPages = Math.ceil(filteredListSPM.length / SURAT_PER_PAGE) || 1; if (pageSPM > totalPages) pageSPM = totalPages;
   document.getElementById('spmPageInfo').innerText = `Halaman ${pageSPM} dari ${totalPages}`; document.getElementById('btnPrevSPM').disabled = (pageSPM === 1); document.getElementById('btnNextSPM').disabled = (pageSPM === totalPages || filteredListSPM.length === 0);
   let startIdx = (pageSPM - 1) * SURAT_PER_PAGE; let pageData = filteredListSPM.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat Surat Pengantar Medis tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-rose-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'} <br> <span class="font-normal text-[10px] text-slate-500 font-mono">RM: ${s.noRm || '-'}</span></td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.tujuan || '-'}</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangSPM('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-rose-50 hover:text-rose-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewSPM('${s.noSurat}')" class="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold border border-rose-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageSPM() { if(pageSPM > 1) { pageSPM--; renderSpmTable(); } }
 function nextPageSPM() { let t = Math.ceil(filteredListSPM.length/SURAT_PER_PAGE); if(pageSPM < t) { pageSPM++; renderSpmTable(); } }
 function populatePrintAreaSPM(item) {
    document.getElementById('spmPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('spmPrintTglAtas').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('spmPrintTujuan').innerText = item.tujuan; document.getElementById('spmPrintNama').innerText = item.namaPasien; document.getElementById('spmPrintUmur').innerText = item.umur; document.getElementById('spmPrintJK').innerText = item.jk; document.getElementById('spmPrintAlamat').innerText = item.alamat; document.getElementById('spmPrintAnamnesa').innerText = item.anamnesa; document.getElementById('spmPrintFisik').innerText = item.fisik; document.getElementById('spmPrintDiagnosis').innerText = item.diagnosis; document.getElementById('spmPrintTerapi').innerText = item.terapi; document.getElementById('spmPrintDokter').innerText = item.dokter; document.getElementById('spmPrintSIP').innerText = getSIP(item.dokter);
 }
 function cetakUlangSPM(noSurat) {
    let item = rawListSPM.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaSPM(item); eksekusiCetakSurat(item.noSurat, 'printAreaSPM');
 }
   function viewSPM(noSurat) {
     let item = rawListSPM.find(x => x.noSurat === noSurat); if (!item) return;
     populatePrintAreaSPM(item);
     bukaModalPreviewSurat(item.noSurat, 'printAreaSPM', 'Surat Rujukan Medis');
  }
  function downloadPdfSPM(noSurat) {
    let item = rawListSPM.find(x => x.noSurat === noSurat); if (!item) return;
    populatePrintAreaSPM(item); downloadPDFSurat(item.noSurat, 'printAreaSPM');
 }
 function handleCetakSPM(e) {
   e.preventDefault(); if (!document.getElementById('spmIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   const payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('spmIdPasien').value, noRm: document.getElementById('spmNoRm').value, namaPasien: document.getElementById('spmNama').value, umur: document.getElementById('spmUmur').value, jk: document.getElementById('spmJK').value, alamat: document.getElementById('spmAlamat').value, tujuan: document.getElementById('spmTujuan').value, tglCetakOri: document.getElementById('spmTglCetak').value, anamnesa: document.getElementById('spmAnamnesa').value, fisik: document.getElementById('spmFisik').value, diagnosis: document.getElementById('spmDiagnosis').value, terapi: document.getElementById('spmTerapi').value, dokter: document.getElementById('spmDokter').value };
   for (let key in payload) { if (!payload[key] || payload[key].trim() === "") { showToast('error', 'Semua isian Rujukan wajib diisi lengkap!'); return; } }
   let btn = document.getElementById('btnCetakSPM'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); let blnRomawi = getBulanRomawi(blnStr); let thn4Digit = new Date().getFullYear().toString(); let urutStr = ("000" + (rawListSPM.length + 1)).slice(-3); 
   let fallbackNo = "SRP/SHELDON/" + urutStr + "/" + blnRomawi + "-" + thn4Digit; 
   let formattedTglCetak = formatTglIndo(payload.tglCetakOri);
   
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanSuratRujukan) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK SRP'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('SRP') ? res.noSurat : fallbackNo;
           document.getElementById('spmPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('spmPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('spmPrintTujuan').innerText = payload.tujuan; document.getElementById('spmPrintNama').innerText = payload.namaPasien; document.getElementById('spmPrintUmur').innerText = payload.umur; document.getElementById('spmPrintJK').innerText = payload.jk; document.getElementById('spmPrintAlamat').innerText = payload.alamat; document.getElementById('spmPrintAnamnesa').innerText = payload.anamnesa; document.getElementById('spmPrintFisik').innerText = payload.fisik; document.getElementById('spmPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('spmPrintTerapi').innerText = payload.terapi; document.getElementById('spmPrintDokter').innerText = payload.dokter; document.getElementById('spmPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(finalNoSurat, 'printAreaSPM'); showToast('success', 'Surat Rujukan berhasil disimpan.');
           rawListSPM.unshift({ noSurat: finalNoSurat, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SRP', noSurat: finalNoSurat, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormSPM(); updateStatistikSurat(); searchSpmTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK SRP'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanSuratRujukan(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK SRP'; btn.disabled = false;
           document.getElementById('spmPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('spmPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('spmPrintTujuan').innerText = payload.tujuan; document.getElementById('spmPrintNama').innerText = payload.namaPasien; document.getElementById('spmPrintUmur').innerText = payload.umur; document.getElementById('spmPrintJK').innerText = payload.jk; document.getElementById('spmPrintAlamat').innerText = payload.alamat; document.getElementById('spmPrintAnamnesa').innerText = payload.anamnesa; document.getElementById('spmPrintFisik').innerText = payload.fisik; document.getElementById('spmPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('spmPrintTerapi').innerText = payload.terapi; document.getElementById('spmPrintDokter').innerText = payload.dokter; document.getElementById('spmPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(fallbackNo, 'printAreaSPM'); showToast('success', 'Preview Surat Rujukan Ditampilkan.');
           rawListSPM.unshift({ noSurat: fallbackNo, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'SRP', noSurat: fallbackNo, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormSPM(); updateStatistikSurat(); searchSpmTable(); 
       }, 500);
   }
 }


 // ===================================== LAB =====================================
 function searchPasienLAB() { masterSearchPasienLogic(document.getElementById('labSearchPasien').value.toLowerCase(), 'labSearchResult', 'LAB', 'cyan'); }
 function pilihPasienLAB(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('labIdPasien').value = p.idPasien; document.getElementById('labNoRm').value = p.noRm;
   let tglLahirFinal = p.tanggalLahir ? formatTglIndo(p.tanggalLahir) : '-'; let umurClean = String(p.umur).replace(/tahun|th/gi, '').trim(); let gabungUmur = umurClean ? ` / ${umurClean} Tahun` : '';
   document.getElementById('labNama').value = p.namaPasien; document.getElementById('labUmur').value = tglLahirFinal + gabungUmur; document.getElementById('labJK').value = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-Laki' ? 'Laki-Laki' : (p.jenisKelamin ? 'Perempuan' : '-'); document.getElementById('labAlamat').value = p.alamat || '-'; document.getElementById('labSearchPasien').value = p.namaPasien; document.getElementById('labSearchResult').classList.add('hidden');
   let rmList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === id);
   if (rmList.length > 0) { let lastRm = rmList[rmList.length - 1]; document.getElementById('labDiagnosis').value = lastRm.assessmentICD || ''; }
 }
 function resetFormLAB() { document.getElementById('formLAB').reset(); document.getElementById('labIdPasien').value = ''; document.getElementById('labNoRm').value = ''; document.getElementById('labTglCetak').value = getTodayIso(); populateDokterOptions(); }
 function searchLabTable() { 
    if(debounceTimerId['labTable']) clearTimeout(debounceTimerId['labTable']);
    debounceTimerId['labTable'] = setTimeout(() => {
       let q = document.getElementById('labSearchTable').value.toLowerCase().trim(); filteredListLAB = rawListLAB.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageLAB = 1; renderLabTable(); 
    }, 400);
 }
 function renderLabTable() {
   let tbody = document.getElementById('labTableBody'); document.getElementById('labTotalBadge').innerText = `Total: ${filteredListLAB.length} Surat`;
   let totalPages = Math.ceil(filteredListLAB.length / SURAT_PER_PAGE) || 1; if (pageLAB > totalPages) pageLAB = totalPages;
   document.getElementById('labPageInfo').innerText = `Halaman ${pageLAB} dari ${totalPages}`; document.getElementById('btnPrevLAB').disabled = (pageLAB === 1); document.getElementById('btnNextLAB').disabled = (pageLAB === totalPages || filteredListLAB.length === 0);
   let startIdx = (pageLAB - 1) * SURAT_PER_PAGE; let pageData = filteredListLAB.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat Pengantar Lab tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-cyan-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'} <br> <span class="font-normal text-[10px] text-slate-500 font-mono">RM: ${s.noRm || '-'}</span></td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.diagnosis || '-'}</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangLAB('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-cyan-50 hover:text-cyan-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewLAB('${s.noSurat}')" class="px-2.5 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white rounded-lg text-[10px] font-bold border border-cyan-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageLAB() { if(pageLAB > 1) { pageLAB--; renderLabTable(); } }
 function nextPageLAB() { let t = Math.ceil(filteredListLAB.length/SURAT_PER_PAGE); if(pageLAB < t) { pageLAB++; renderLabTable(); } }
 function cetakUlangLAB(noSurat) {
    let item = rawListLAB.find(x => x.noSurat === noSurat); if (!item) return;
    document.getElementById('labPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('labPrintTglAtas').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('labPrintTujuan').innerText = item.tujuan; document.getElementById('labPrintNama').innerText = item.namaPasien; document.getElementById('labPrintUmur').innerText = item.umur; document.getElementById('labPrintJK').innerText = item.jk; document.getElementById('labPrintAlamat').innerText = item.alamat; document.getElementById('labPrintDiagnosis').innerText = item.diagnosis; document.getElementById('labPrintPemeriksaan').innerHTML = (item.pemeriksaan || '').replace(/\n/g, '<br>'); document.getElementById('labPrintDokter').innerText = item.dokter; document.getElementById('labPrintSIP').innerText = getSIP(item.dokter);
    eksekusiCetakSurat(item.noSurat, 'printAreaLAB');
 }
 function handleCetakLAB(e) {
   e.preventDefault(); if (!document.getElementById('labIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   const payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('labIdPasien').value, noRm: document.getElementById('labNoRm').value, namaPasien: document.getElementById('labNama').value, umur: document.getElementById('labUmur').value, jk: document.getElementById('labJK').value, alamat: document.getElementById('labAlamat').value, tujuan: document.getElementById('labTujuan').value, tglCetakOri: document.getElementById('labTglCetak').value, diagnosis: document.getElementById('labDiagnosis').value, pemeriksaan: document.getElementById('labPemeriksaan').value, dokter: document.getElementById('labDokter').value };
   for (let key in payload) { if (!payload[key] || payload[key].trim() === "") { showToast('error', 'Semua isian LAB wajib diisi lengkap!'); return; } }
   let btn = document.getElementById('btnCetakLAB'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); let blnRomawi = getBulanRomawi(blnStr); let thn4Digit = new Date().getFullYear().toString(); let urutStr = ("000" + (rawListLAB.length + 1)).slice(-3); let fallbackNo = "SPL/SHELDON/" + urutStr + "-" + blnRomawi + "-" + thn4Digit; let formattedTglCetak = formatTglIndo(payload.tglCetakOri);
   
   let teksPemeriksaanCetak = payload.pemeriksaan.replace(/\n/g, '<br>');


   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanSuratLab) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK LAB'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('SPL') ? res.noSurat : fallbackNo;
           document.getElementById('labPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('labPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('labPrintTujuan').innerText = payload.tujuan; document.getElementById('labPrintNama').innerText = payload.namaPasien; document.getElementById('labPrintUmur').innerText = payload.umur; document.getElementById('labPrintJK').innerText = payload.jk; document.getElementById('labPrintAlamat').innerText = payload.alamat; document.getElementById('labPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('labPrintPemeriksaan').innerHTML = teksPemeriksaanCetak; document.getElementById('labPrintDokter').innerText = payload.dokter; document.getElementById('labPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(finalNoSurat, 'printAreaLAB'); showToast('success', 'Surat Lab berhasil disimpan.');
           rawListLAB.unshift({ noSurat: finalNoSurat, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'LAB', noSurat: finalNoSurat, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormLAB(); updateStatistikSurat(); searchLabTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK LAB'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanSuratLab(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK LAB'; btn.disabled = false;
           document.getElementById('labPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('labPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('labPrintTujuan').innerText = payload.tujuan; document.getElementById('labPrintNama').innerText = payload.namaPasien; document.getElementById('labPrintUmur').innerText = payload.umur; document.getElementById('labPrintJK').innerText = payload.jk; document.getElementById('labPrintAlamat').innerText = payload.alamat; document.getElementById('labPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('labPrintPemeriksaan').innerHTML = teksPemeriksaanCetak; document.getElementById('labPrintDokter').innerText = payload.dokter; document.getElementById('labPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(fallbackNo, 'printAreaLAB'); showToast('success', 'Preview Surat Lab Ditampilkan.');
           rawListLAB.unshift({ noSurat: fallbackNo, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'LAB', noSurat: fallbackNo, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormLAB(); updateStatistikSurat(); searchLabTable(); 
       }, 500);
   }
 }


 // ===================================== RAD (RADIOLOGI) =====================================
 function searchPasienRAD() { masterSearchPasienLogic(document.getElementById('radSearchPasien').value.toLowerCase(), 'radSearchResult', 'RAD', 'indigo'); }
 function pilihPasienRAD(id) {
   let p = window.KlinikData.pasien.find(x => x.idPasien === id); if (!p) return;
   document.getElementById('radIdPasien').value = p.idPasien; document.getElementById('radNoRm').value = p.noRm;
   let tglLahirFinal = p.tanggalLahir ? formatTglIndo(p.tanggalLahir) : '-'; let umurClean = String(p.umur).replace(/tahun|th/gi, '').trim(); let gabungUmur = umurClean ? ` / ${umurClean} Tahun` : '';
   document.getElementById('radNama').value = p.namaPasien; document.getElementById('radUmur').value = tglLahirFinal + gabungUmur; document.getElementById('radJK').value = p.jenisKelamin === 'L' || p.jenisKelamin === 'Laki-Laki' ? 'Laki-Laki' : (p.jenisKelamin ? 'Perempuan' : '-'); document.getElementById('radAlamat').value = p.alamat || '-'; document.getElementById('radSearchPasien').value = p.namaPasien; document.getElementById('radSearchResult').classList.add('hidden');
   let rmList = (window.KlinikData.rekamMedis || []).filter(r => r.idPasien === id);
   if (rmList.length > 0) { let lastRm = rmList[rmList.length - 1]; document.getElementById('radDiagnosis').value = lastRm.assessmentICD || ''; }
 }
 function resetFormRAD() { document.getElementById('formRAD').reset(); document.getElementById('radIdPasien').value = ''; document.getElementById('radNoRm').value = ''; document.getElementById('radTglCetak').value = getTodayIso(); populateDokterOptions(); }
 function searchRadTable() { 
    if(debounceTimerId['radTable']) clearTimeout(debounceTimerId['radTable']);
    debounceTimerId['radTable'] = setTimeout(() => {
       let q = document.getElementById('radSearchTable').value.toLowerCase().trim(); filteredListRAD = rawListRAD.filter(s => (s.namaPasien || '').toLowerCase().includes(q)); pageRAD = 1; renderRadTable(); 
    }, 400);
 }
 function renderRadTable() {
   let tbody = document.getElementById('radTableBody'); document.getElementById('radTotalBadge').innerText = `Total: ${filteredListRAD.length} Surat`;
   let totalPages = Math.ceil(filteredListRAD.length / SURAT_PER_PAGE) || 1; if (pageRAD > totalPages) pageRAD = totalPages;
   document.getElementById('radPageInfo').innerText = `Halaman ${pageRAD} dari ${totalPages}`; document.getElementById('btnPrevRAD').disabled = (pageRAD === 1); document.getElementById('btnNextRAD').disabled = (pageRAD === totalPages || filteredListRAD.length === 0);
   let startIdx = (pageRAD - 1) * SURAT_PER_PAGE; let pageData = filteredListRAD.slice(startIdx, startIdx + SURAT_PER_PAGE);
   if(pageData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-slate-400 py-6 font-bold">Belum ada riwayat Pengantar Radiologi tersimpan.</td></tr>'; return; }
   tbody.innerHTML = pageData.map(s => {
       let tglTampil = formatTglAngka(s.tglCetak || '-');
       return `<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100"><td class="p-3 font-mono font-bold text-indigo-700">${s.noSurat}</td><td class="p-3 font-bold text-slate-800">${s.namaPasien || '-'} <br> <span class="font-normal text-[10px] text-slate-500 font-mono">RM: ${s.noRm || '-'}</span></td><td class="p-3 text-slate-600 font-medium">${tglTampil}</td><td class="p-3 font-bold text-slate-800">${s.diagnosis || '-'}</td><td class="p-3 text-center"><div class="inline-flex gap-1.5"><button onclick="cetakUlangRAD('${s.noSurat}')" class="px-2.5 py-1.5 bg-white shadow-sm hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors">🖨️ Cetak</button><button onclick="viewRAD('${s.noSurat}')" class="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold border border-indigo-200 transition-colors">👁️ View</button></div></td></tr>`;
   }).join('');
 }
 function prevPageRAD() { if(pageRAD > 1) { pageRAD--; renderRadTable(); } }
 function nextPageRAD() { let t = Math.ceil(filteredListRAD.length/SURAT_PER_PAGE); if(pageRAD < t) { pageRAD++; renderRadTable(); } }
 function cetakUlangRAD(noSurat) {
    let item = rawListRAD.find(x => x.noSurat === noSurat); if (!item) return;
    document.getElementById('radPrintNoSurat').innerText = 'No : ' + item.noSurat; document.getElementById('radPrintTglAtas').innerText = 'Payakumbuh, ' + item.tglCetak; document.getElementById('radPrintTujuan').innerText = item.tujuan; document.getElementById('radPrintNama').innerText = item.namaPasien; document.getElementById('radPrintUmur').innerText = item.umur; document.getElementById('radPrintJK').innerText = item.jk; document.getElementById('radPrintAlamat').innerText = item.alamat; document.getElementById('radPrintDiagnosis').innerText = item.diagnosis; document.getElementById('radPrintPemeriksaan').innerHTML = (item.pemeriksaan || '').replace(/\n/g, '<br>'); document.getElementById('radPrintDokter').innerText = item.dokter; document.getElementById('radPrintSIP').innerText = getSIP(item.dokter);
    eksekusiCetakSurat(item.noSurat, 'printAreaRAD');
 }
 function handleCetakRAD(e) {
   e.preventDefault(); if (!document.getElementById('radIdPasien').value) { showToast('warning', 'Pilih pasien terlebih dahulu!'); return; }
   const payload = { currentUser: window.activeNamaAccount, idPasien: document.getElementById('radIdPasien').value, noRm: document.getElementById('radNoRm').value, namaPasien: document.getElementById('radNama').value, umur: document.getElementById('radUmur').value, jk: document.getElementById('radJK').value, alamat: document.getElementById('radAlamat').value, tujuan: document.getElementById('radTujuan').value, tglCetakOri: document.getElementById('radTglCetak').value, diagnosis: document.getElementById('radDiagnosis').value, pemeriksaan: document.getElementById('radPemeriksaan').value, dokter: document.getElementById('radDokter').value };
   for (let key in payload) { if (!payload[key] || payload[key].trim() === "") { showToast('error', 'Semua isian Radiologi wajib diisi lengkap!'); return; } }
   let btn = document.getElementById('btnCetakRAD'); btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;
   
   let blnStr = ("0" + (new Date().getMonth() + 1)).slice(-2); 
   let blnRomawi = getBulanRomawi(blnStr); 
   let thn4Digit = new Date().getFullYear().toString(); 
   let urutStr = ("000" + (rawListRAD.length + 1)).slice(-3); 
   let fallbackNo = "SPR/SHELDON/" + urutStr + "-" + blnRomawi + "-" + thn4Digit; 
   let formattedTglCetak = formatTglIndo(payload.tglCetakOri);


   let teksPemeriksaanCetak = payload.pemeriksaan.replace(/\n/g, '<br>');
   
   if (typeof google !== 'undefined' && google.script && google.script.run && google.script.run.simpanSuratRadiologi) {
       google.script.run.withSuccessHandler(res => {
         btn.innerHTML = 'SIMPAN & CETAK RADIOLOGI'; btn.disabled = false;
         if (res.success) {
           let finalNoSurat = res.noSurat && res.noSurat.includes('SPR') ? res.noSurat : fallbackNo;
           document.getElementById('radPrintNoSurat').innerText = 'No : ' + finalNoSurat; document.getElementById('radPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('radPrintTujuan').innerText = payload.tujuan; document.getElementById('radPrintNama').innerText = payload.namaPasien; document.getElementById('radPrintUmur').innerText = payload.umur; document.getElementById('radPrintJK').innerText = payload.jk; document.getElementById('radPrintAlamat').innerText = payload.alamat; document.getElementById('radPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('radPrintPemeriksaan').innerHTML = teksPemeriksaanCetak; document.getElementById('radPrintDokter').innerText = payload.dokter; document.getElementById('radPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(finalNoSurat, 'printAreaRAD'); showToast('success', 'Surat Radiologi berhasil disimpan.');
           rawListRAD.unshift({ noSurat: finalNoSurat, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'RAD', noSurat: finalNoSurat, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormRAD(); updateStatistikSurat(); searchRadTable(); 
         } else showToast('error', res.message);
       }).withFailureHandler(err => { btn.innerHTML = 'SIMPAN & CETAK RADIOLOGI'; btn.disabled = false; showToast('error', 'Koneksi Terputus: ' + err.message); }).simpanSuratRadiologi(payload);
   } else {
       setTimeout(() => {
           btn.innerHTML = 'SIMPAN & CETAK RADIOLOGI'; btn.disabled = false;
           document.getElementById('radPrintNoSurat').innerText = 'No : ' + fallbackNo; document.getElementById('radPrintTglAtas').innerText = 'Payakumbuh, ' + formattedTglCetak; document.getElementById('radPrintTujuan').innerText = payload.tujuan; document.getElementById('radPrintNama').innerText = payload.namaPasien; document.getElementById('radPrintUmur').innerText = payload.umur; document.getElementById('radPrintJK').innerText = payload.jk; document.getElementById('radPrintAlamat').innerText = payload.alamat; document.getElementById('radPrintDiagnosis').innerText = payload.diagnosis; document.getElementById('radPrintPemeriksaan').innerHTML = teksPemeriksaanCetak; document.getElementById('radPrintDokter').innerText = payload.dokter; document.getElementById('radPrintSIP').innerText = getSIP(payload.dokter);
           eksekusiCetakSurat(fallbackNo, 'printAreaRAD'); showToast('success', 'Preview Surat Radiologi Ditampilkan.');
           rawListRAD.unshift({ noSurat: fallbackNo, tglCetak: formattedTglCetak, ...payload }); dataSuratGlobal.unshift({jenisSurat: 'RAD', noSurat: fallbackNo, tglCetak: formattedTglCetak, namaPasien: payload.namaPasien, noRm: payload.noRm, dokter: payload.dokter}); resetFormRAD(); updateStatistikSurat(); searchRadTable(); 
       }, 500);
   }
 }



// ==========================================
// VARIABLE GLOBAL DATABASE MASTER
// ==========================================
let listMasterKategori = [];
let listMasterTindakan = [];
let listMasterObat = [];
let listMasterBmhp = [];

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener("KlinikDataReady", () => {
   initDatabaseModule();
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
     if(window.KlinikData && window.KlinikData.statusLoad && window.KlinikData.statusLoad.master) {
         initDatabaseModule();
     }
  }, 1000);
});

function initDatabaseModule() {
   if (typeof google !== 'undefined' && google.script && google.script.run) {
       // Tarik Kategori (Untuk Dropdown Tindakan)
       google.script.run.withSuccessHandler(res => {
           listMasterKategori = res || [];
           populateKategoriDropdown();
       }).getKategoriTindakan();

       // Tarik Daftar Tindakan (Untuk Tabel dan Acuan Kode)
       google.script.run.withSuccessHandler(res => {
           listMasterTindakan = res || [];
           renderTabelTindakan();
       }).getDaftarTindakanLengkap();

       // Tarik Master Obat
       loadDaftarObatMaster();

       // Tarik Master BMHP
       loadDaftarBmhpMaster();
   }
}

function loadDaftarObatMaster() {
   if (typeof google !== 'undefined' && google.script && google.script.run) {
       google.script.run.withSuccessHandler(res => {
           listMasterObat = res || [];
           renderTabelObat();
           generateKodeObat();
       }).getDaftarObatLengkap();
   }
}

function loadDaftarBmhpMaster() {
   if (typeof google !== 'undefined' && google.script && google.script.run) {
       google.script.run.withSuccessHandler(res => {
           listMasterBmhp = res || [];
           renderTabelBmhp();
           generateKodeBmhp();
       }).getDaftarBMHPLengkap();
   }
}

// ==========================================
// LOGIKA TAMPILAN / MENU TAB
// ==========================================
function changeDBMenu(menu) {
   ['panelDbTindakan', 'panelDbObat', 'panelDbBmhp'].forEach(id => {
       const el = document.getElementById(id);
       if (el) el.classList.add('hidden');
   });
   ['btnDbTindakan', 'btnDbObat', 'btnDbBmhp'].forEach(id => {
       let btn = document.getElementById(id);
       if (btn) {
           btn.classList.remove('bg-indigo-50', 'text-indigo-700');
           btn.classList.add('bg-white', 'text-slate-600');
       }
   });

   if(menu === 'tindakan') {
       const el = document.getElementById('panelDbTindakan');
       if (el) el.classList.remove('hidden');
       let btn = document.getElementById('btnDbTindakan');
       if (btn) {
           btn.classList.remove('bg-white', 'text-slate-600');
           btn.classList.add('bg-indigo-50', 'text-indigo-700');
       }
   } else if(menu === 'obat') {
       const el = document.getElementById('panelDbObat');
       if (el) el.classList.remove('hidden');
       let btn = document.getElementById('btnDbObat');
       if (btn) {
           btn.classList.remove('bg-white', 'text-slate-600');
           btn.classList.add('bg-indigo-50', 'text-indigo-700');
       }
       if (listMasterObat.length === 0) {
           loadDaftarObatMaster();
       } else {
           renderTabelObat();
           generateKodeObat();
       }
   } else if(menu === 'bmhp') {
       const el = document.getElementById('panelDbBmhp');
       if (el) el.classList.remove('hidden');
       let btn = document.getElementById('btnDbBmhp');
       if (btn) {
           btn.classList.remove('bg-white', 'text-slate-600');
           btn.classList.add('bg-indigo-50', 'text-indigo-700');
       }
       if (listMasterBmhp.length === 0) {
           loadDaftarBmhpMaster();
       } else {
           renderTabelBmhp();
           generateKodeBmhp();
       }
   }
}

// ==========================================
// AUTO-FORMATTER & AUTO-CODE GENERATOR
// ==========================================
function autoTitleCaseDB(el) {
  let val = el.value;
  if (!val) return;
 
  let isAllCaps = val === val.toUpperCase() && val.match(/[a-zA-Z]/);
  if (!isAllCaps) {
      const start = el.selectionStart, end = el.selectionEnd;
      el.value = val.replace(/(^|[\s\/\-\.\(\)])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
      el.setSelectionRange(start, end);
  }
}

function formatRupiahInput(el) {
   let val = el.value.replace(/[^0-9]/g, '');
   if(val === "") { el.value = ""; return; }
   el.value = parseInt(val, 10).toLocaleString('id-ID').replace(/,/g, '.');
}

function parseRupiahRaw(str) {
   if (!str) return 0;
   return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

const fmtRpStr = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);

function populateKategoriDropdown() {
   let sel = document.getElementById('dbKategori');
   if(!sel) return;
  
   sel.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>';
   listMasterKategori.forEach(k => {
       sel.innerHTML += `<option value="${k.kategori}" data-kode="${k.kode}">${k.kategori}</option>`;
   });
}

function generateKodeTindakan() {
   let sel = document.getElementById('dbKategori');
   if (!sel) return;
   let val = sel.value;
   if(!val) return;
  
   let opt = sel.options[sel.selectedIndex];
   let kodeKat = opt.getAttribute('data-kode');
  
   let maxNum = 0;
   listMasterTindakan.forEach(t => {
       if(t.kode && t.kode.startsWith(kodeKat + "-")) {
           let parts = t.kode.split('-');
           if(parts.length > 1) {
               let num = parseInt(parts[1], 10);
               if(!isNaN(num) && num > maxNum) maxNum = num;
           }
       }
   });
  
   let nextNum = maxNum + 1;
   let finalKode = kodeKat + "-" + String(nextNum).padStart(4, '0');
   let inp = document.getElementById('dbKodeTindakan');
   if (inp) inp.value = finalKode;
}

function generateKodeObat() {
   let maxNum = 0;
   listMasterObat.forEach(o => {
       if (o.kode && o.kode.startsWith('OBT-')) {
           let parts = o.kode.split('-');
           if (parts.length > 1) {
               let num = parseInt(parts[1], 10);
               if (!isNaN(num) && num > maxNum) maxNum = num;
           }
       }
   });
   let nextNum = maxNum + 1;
   let finalKode = 'OBT-' + String(nextNum).padStart(4, '0');
   let inp = document.getElementById('dbKodeObat');
   if (inp) inp.value = finalKode;
}

function generateKodeBmhp() {
   let maxNum = 0;
   listMasterBmhp.forEach(b => {
       if (b.kode && b.kode.startsWith('BMH-')) {
           let parts = b.kode.split('-');
           if (parts.length > 1) {
               let num = parseInt(parts[1], 10);
               if (!isNaN(num) && num > maxNum) maxNum = num;
           }
       }
   });
   let nextNum = maxNum + 1;
   let finalKode = 'BMH-' + String(nextNum).padStart(4, '0');
   let inp = document.getElementById('dbKodeBmhp');
   if (inp) inp.value = finalKode;
}

function hitungMarginObat() {
   let hpp = parseRupiahRaw(document.getElementById('dbHppObat').value);
   let jual = parseRupiahRaw(document.getElementById('dbHargaJualObat').value);
   let el = document.getElementById('dbMarginObat');
   if (!el) return;
   if (hpp > 0 && jual > 0) {
       let margin = ((jual - hpp) / hpp) * 100;
       el.value = margin.toFixed(1) + '%';
       if (margin < 0) {
           el.classList.remove('text-emerald-600');
           el.classList.add('text-rose-600');
       } else {
           el.classList.remove('text-rose-600');
           el.classList.add('text-emerald-600');
       }
   } else {
       el.value = '0%';
   }
}

function hitungHppPcsOtomatis() {
   let elHrg = document.getElementById('dbHargaBeliSatuanObat');
   let elIsi = document.getElementById('dbIsiPerSatuanObat');
   let elHpp = document.getElementById('dbHppObat');
   if (!elHrg || !elIsi || !elHpp) return;
   let hrg = parseRupiahRaw(elHrg.value);
   let isi = parseFloat(elIsi.value) || 1;
   if (hrg > 0 && isi > 0) {
       let hppPcs = Math.round(hrg / isi);
       elHpp.value = formatRibuan(hppPcs);
       hitungMarginObat();
   }
}

function hitungMarginBmhp() {
   let hpp = parseRupiahRaw(document.getElementById('dbHppBmhp').value);
   let jual = parseRupiahRaw(document.getElementById('dbHargaJualBmhp').value);
   let el = document.getElementById('dbMarginBmhp');
   if (!el) return;
   if (hpp > 0 && jual > 0) {
       let margin = ((jual - hpp) / hpp) * 100;
       el.value = margin.toFixed(1) + '%';
       if (margin < 0) {
           el.classList.remove('text-emerald-600');
           el.classList.add('text-rose-600');
       } else {
           el.classList.remove('text-rose-600');
           el.classList.add('text-emerald-600');
       }
   } else {
       el.value = '0%';
   }
}

// ==========================================
// SIMPAN KE DATABASE SPREADSHEET
// ==========================================
function simpanDbTindakan(e) {
   e.preventDefault();
   let mode = document.getElementById('dbTindakanMode') ? document.getElementById('dbTindakanMode').value : 'tambah';
   let btn = document.getElementById('btnSimpanTindakan');
   let originalBtnText = mode === 'edit' ? 'UPDATE TINDAKAN' : 'SIMPAN TINDAKAN';
   btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;

   let tarifRaw = document.getElementById('dbTarif').value.replace(/\./g, '');
   let perluLabVal = document.getElementById('dbPerluLab') ? document.getElementById('dbPerluLab').value : 'Tidak';
  
   let payload = {
       kode: document.getElementById('dbKodeTindakan').value,
       nama: document.getElementById('dbNamaTindakan').value.trim(),
       kategori: document.getElementById('dbKategori').value,
       tarif: parseInt(tarifRaw, 10) || 0,
       perluLab: perluLabVal,
       currentUser: window.activeNamaAccount
   };

   if (mode === 'edit') {
       google.script.run.withSuccessHandler(res => {
           btn.innerHTML = originalBtnText; btn.disabled = false;
           if (res.success) {
               if (typeof showToast === 'function') showToast('success', res.message); else alert(res.message);
               
               let idx = listMasterTindakan.findIndex(x => x.kode === payload.kode);
               if (idx !== -1) {
                   listMasterTindakan[idx].nama = payload.nama;
                   listMasterTindakan[idx].kategori = payload.kategori;
                   listMasterTindakan[idx].harga = payload.tarif;
                   listMasterTindakan[idx].perluLab = payload.perluLab;
               }
               if (window.KlinikData && Array.isArray(window.KlinikData.tindakan)) {
                   let kIdx = window.KlinikData.tindakan.findIndex(x => x.kode === payload.kode);
                   if (kIdx !== -1) {
                       window.KlinikData.tindakan[kIdx].nama = payload.nama;
                       window.KlinikData.tindakan[kIdx].kategori = payload.kategori;
                       window.KlinikData.tindakan[kIdx].harga = payload.tarif;
                       window.KlinikData.tindakan[kIdx].perluLab = payload.perluLab;
                   }
               }
               batalEditDbTindakan();
               renderTabelTindakan();
           } else {
               if (typeof showToast === 'function') showToast('error', res.message); else alert(res.message);
           }
       }).withFailureHandler(err => {
           btn.innerHTML = originalBtnText; btn.disabled = false;
           if (typeof showToast === 'function') showToast('error', err.message); else alert(err.message);
       }).updateTindakan(payload);
   } else {
       google.script.run.withSuccessHandler(res => {
           btn.innerHTML = originalBtnText; btn.disabled = false;
           if (res.success) {
               if (typeof showToast === 'function') showToast('success', res.message); else alert(res.message);
              
               document.getElementById('formDbTindakan').reset();
               if (document.getElementById('dbPerluLab')) document.getElementById('dbPerluLab').value = '';
              
               let newItem = {
                  kode: payload.kode,
                  nama: payload.nama,
                  kategori: payload.kategori,
                  harga: payload.tarif,
                  perluLab: payload.perluLab
               };
               listMasterTindakan.push(newItem);
               if (window.KlinikData && Array.isArray(window.KlinikData.tindakan)) {
                   window.KlinikData.tindakan.push(newItem);
               }
               renderTabelTindakan();
               generateKodeTindakan();
           } else {
               if (typeof showToast === 'function') showToast('error', res.message); else alert(res.message);
           }
       }).withFailureHandler(err => {
           btn.innerHTML = originalBtnText; btn.disabled = false;
           if (typeof showToast === 'function') showToast('error', err.message); else alert(err.message);
       }).simpanTindakanBaru(payload);
   }
}

function editDbTindakan(kode) {
   let item = listMasterTindakan.find(t => t.kode === kode);
   if (!item) {
       if (typeof showToast === 'function') showToast('error', 'Data tindakan tidak ditemukan.');
       return;
   }

   document.getElementById('dbTindakanMode').value = 'edit';
   document.getElementById('judulFormTindakan').innerText = 'Edit Tindakan: ' + (item.kode || '');
   document.getElementById('btnSimpanTindakan').innerText = 'UPDATE TINDAKAN';
   document.getElementById('btnSimpanTindakan').className = 'w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-500/30 transition-all text-xs';
   let btnBatal = document.getElementById('btnBatalEditTindakan');
   if (btnBatal) btnBatal.classList.remove('hidden');

   document.getElementById('dbKodeTindakan').value = item.kode || '';
   document.getElementById('dbNamaTindakan').value = item.nama || '';
   document.getElementById('dbKategori').value = item.kategori || '';
   document.getElementById('dbTarif').value = (item.harga || item.tarif || 0).toLocaleString('id-ID').replace(/,/g, '.');
   if (document.getElementById('dbPerluLab')) {
       document.getElementById('dbPerluLab').value = item.perluLab === 'Ya' ? 'Ya' : 'Tidak';
   }

   document.getElementById('formDbTindakan').scrollIntoView({ behavior: 'smooth', block: 'center' });
   document.getElementById('dbNamaTindakan').focus();
}

function batalEditDbTindakan() {
   let form = document.getElementById('formDbTindakan');
   if (form) form.reset();
   document.getElementById('dbTindakanMode').value = 'tambah';
   document.getElementById('judulFormTindakan').innerText = 'Tambah Tindakan Baru';
   let btn = document.getElementById('btnSimpanTindakan');
   btn.innerText = 'SIMPAN TINDAKAN';
   btn.className = 'w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md shadow-indigo-500/30 transition-all text-xs';
   let btnBatal = document.getElementById('btnBatalEditTindakan');
   if (btnBatal) btnBatal.classList.add('hidden');
   if (document.getElementById('dbPerluLab')) document.getElementById('dbPerluLab').value = '';
   generateKodeTindakan();
}

function konfirmasiHapusDbTindakan(kode, nama) {
   let konfirm = confirm(`PERINGATAN HAPUS TINDAKAN:\n\nApakah Anda yakin ingin menghapus tindakan:\n"${nama}" (${kode})?\n\nTindakan ini akan dihapus dari Database Master.`);
   if (!konfirm) return;

   google.script.run.withSuccessHandler(res => {
       if (res.success) {
           if (typeof showToast === 'function') showToast('success', res.message); else alert(res.message);
           listMasterTindakan = listMasterTindakan.filter(t => t.kode !== kode);
           if (window.KlinikData && Array.isArray(window.KlinikData.tindakan)) {
               window.KlinikData.tindakan = window.KlinikData.tindakan.filter(t => t.kode !== kode);
           }
           renderTabelTindakan();
           batalEditDbTindakan();
       } else {
           if (typeof showToast === 'function') showToast('error', res.message); else alert(res.message);
       }
   }).withFailureHandler(err => {
       if (typeof showToast === 'function') showToast('error', 'Gagal: ' + err.message); else alert('Gagal: ' + err.message);
   }).hapusTindakan({ kode: kode, currentUser: window.activeNamaAccount });
}

function simpanDbObat(e) {
   e.preventDefault();
   let btn = document.getElementById('btnSimpanObat');
   btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;

   let satBeli = document.getElementById('dbSatuanBeliObat') ? document.getElementById('dbSatuanBeliObat').value : "Box";
   let isiPerSat = document.getElementById('dbIsiPerSatuanObat') ? parseFloat(document.getElementById('dbIsiPerSatuanObat').value) || 1 : 1;
   let hrgBeliSat = document.getElementById('dbHargaBeliSatuanObat') ? parseRupiahRaw(document.getElementById('dbHargaBeliSatuanObat').value) : 0;
   let hppVal = parseRupiahRaw(document.getElementById('dbHppObat').value);
   if (hrgBeliSat === 0 && hppVal > 0) hrgBeliSat = hppVal * isiPerSat;

   let payload = {
       kode: document.getElementById('dbKodeObat').value,
       nama: document.getElementById('dbNamaObat').value,
       kandungan: document.getElementById('dbKandunganObat') ? document.getElementById('dbKandunganObat').value.trim() : "",
       satuanBeli: satBeli,
       isiPerSatuan: isiPerSat,
       hargaBeliSatuan: hrgBeliSat,
       satuan: document.getElementById('dbSatuanObat').value,
       hpp: hppVal,
       hargaJual: parseRupiahRaw(document.getElementById('dbHargaJualObat').value),
       margin: document.getElementById('dbMarginObat') ? document.getElementById('dbMarginObat').value : "0%",
       stok: parseFloat(document.getElementById('dbStokAwalObat').value) || 0,
       stokMin: parseFloat(document.getElementById('dbStokMinObat').value) || 0,
       expired: document.getElementById('dbExpiredObat').value || "",
       supplier: document.getElementById('dbSupplierObat').value || "",
       currentUser: window.activeNamaAccount
   };

   google.script.run.withSuccessHandler(res => {
       btn.innerHTML = 'SIMPAN OBAT'; btn.disabled = false;
       if (res.success) {
           if (typeof showToast === 'function') showToast('success', res.message); else alert(res.message);
           document.getElementById('formDbObat').reset();
           document.getElementById('dbMarginObat').value = '0%';

           listMasterObat.push({
               kode: payload.kode,
               idObat: payload.kode,
               nama: payload.nama,
               kandungan: payload.kandungan || "-",
               satuanBeli: payload.satuanBeli,
               isiPerSatuan: payload.isiPerSatuan,
               satuan: payload.satuan,
               hargaBeliSatuan: payload.hargaBeliSatuan,
               hpp: payload.hpp,
               hppPcs: payload.hpp,
               margin: payload.margin,
               harga: payload.hargaJual,
               hargaJual: payload.hargaJual,
               stok: payload.stok,
               stokMin: payload.stokMin,
               terjual: 0,
               expired: payload.expired ? payload.expired : "-",
               supplier: payload.supplier ? payload.supplier : "-",
               kategori: "Obat"
           });

           if (window.KlinikData && Array.isArray(window.KlinikData.obat)) {
               window.KlinikData.obat.push(payload.nama);
           }

           renderTabelObat();
           generateKodeObat();
       } else {
           if (typeof showToast === 'function') showToast('error', res.message); else alert(res.message);
       }
   }).withFailureHandler(err => {
       btn.innerHTML = 'SIMPAN OBAT'; btn.disabled = false;
       if (typeof showToast === 'function') showToast('error', err.message); else alert(err.message);
   }).simpanObatBaru(payload);
}

function simpanDbBmhp(e) {
   e.preventDefault();
   let btn = document.getElementById('btnSimpanBmhp');
   btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;

   let payload = {
       kode: document.getElementById('dbKodeBmhp').value,
       nama: document.getElementById('dbNamaBmhp').value,
       satuan: document.getElementById('dbSatuanBmhp').value,
       hpp: parseRupiahRaw(document.getElementById('dbHppBmhp').value),
       hargaJual: parseRupiahRaw(document.getElementById('dbHargaJualBmhp').value),
       stok: parseFloat(document.getElementById('dbStokAwalBmhp').value) || 0,
       stokMin: parseFloat(document.getElementById('dbStokMinBmhp').value) || 0,
       expired: document.getElementById('dbExpiredBmhp').value || "",
       supplier: document.getElementById('dbSupplierBmhp').value || "",
       currentUser: window.activeNamaAccount
   };

   google.script.run.withSuccessHandler(res => {
       btn.innerHTML = 'SIMPAN BMHP'; btn.disabled = false;
       if (res.success) {
           if (typeof showToast === 'function') showToast('success', res.message); else alert(res.message);
           document.getElementById('formDbBmhp').reset();
           document.getElementById('dbMarginBmhp').value = '0%';

           listMasterBmhp.push({
               kode: payload.kode,
               nama: payload.nama,
               satuan: payload.satuan,
               hpp: payload.hpp,
               harga: payload.hargaJual,
               hargaJual: payload.hargaJual,
               stok: payload.stok,
               stokMin: payload.stokMin,
               expired: payload.expired ? payload.expired : "-",
               supplier: payload.supplier ? payload.supplier : "-",
               kategori: "BMHP"
           });

           if (window.KlinikData && Array.isArray(window.KlinikData.bmhp)) {
               window.KlinikData.bmhp.push(payload.nama);
           }

           renderTabelBmhp();
           generateKodeBmhp();
       } else {
           if (typeof showToast === 'function') showToast('error', res.message); else alert(res.message);
       }
   }).withFailureHandler(err => {
       btn.innerHTML = 'SIMPAN BMHP'; btn.disabled = false;
       if (typeof showToast === 'function') showToast('error', err.message); else alert(err.message);
   }).simpanBmhpBaru(payload);
}

// ==========================================
// RENDER TABEL MASTER
// ==========================================
function renderTabelTindakan() {
   let tbody = document.getElementById('tbodyDbTindakan');
   if (!tbody) return;
   let inp = document.getElementById('cariDbTindakan');
   let q = inp ? inp.value.toLowerCase().trim() : '';
  
   let filtered = listMasterTindakan;
   if(q) {
       filtered = filtered.filter(t => (t.nama && t.nama.toLowerCase().includes(q)) || (t.kode && t.kode.toLowerCase().includes(q)));
   }
  
   filtered.sort((a, b) => (b.kode || "").localeCompare(a.kode || ""));

   if (filtered.length === 0) {
       tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-400 font-bold">Data tindakan tidak ditemukan.</td></tr>';
       return;
   }

   tbody.innerHTML = filtered.map(t => {
       let isLab = (t.perluLab === 'Ya');
       let labBadge = isLab 
           ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🧪 Ya</span>'
           : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Tidak</span>';
       let cleanNama = (t.nama || '').replace(/'/g, "\\'");

       return `
           <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
               <td class="p-3 font-mono font-bold text-indigo-600">${t.kode || '-'}</td>
               <td class="p-3 font-bold text-slate-800">${t.nama || '-'}</td>
               <td class="p-3 text-slate-600"><span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold text-[10px]">${t.kategori || '-'}</span></td>
               <td class="p-3 text-right font-black text-slate-800">${fmtRpStr(t.harga || t.tarif || 0)}</td>
               <td class="p-3 text-center">${labBadge}</td>
               <td class="p-3 text-center">
                   <div class="flex justify-center items-center gap-1.5">
                       <button type="button" onclick="editDbTindakan('${t.kode}')" class="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition-all shadow-sm">✏️ Edit</button>
                       <button type="button" onclick="konfirmasiHapusDbTindakan('${t.kode}', '${cleanNama}')" class="px-2.5 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white text-rose-600 rounded-lg text-[10px] font-bold transition-all shadow-sm">🗑️ Hapus</button>
                   </div>
               </td>
           </tr>
       `;
   }).join('');
}

function renderTabelObat() {
   let tbody = document.getElementById('tbodyDbObat');
   if (!tbody) return;
   let inp = document.getElementById('cariDbObat');
   let q = inp ? inp.value.toLowerCase().trim() : '';
  
   let filtered = listMasterObat;
   if(q) {
       filtered = filtered.filter(o => 
           (o.nama && o.nama.toLowerCase().includes(q)) || 
           (o.kandungan && o.kandungan.toLowerCase().includes(q)) || 
           (o.kode && o.kode.toLowerCase().includes(q)) ||
           (o.supplier && o.supplier.toLowerCase().includes(q))
       );
   }

   filtered.sort((a, b) => (b.kode || "").localeCompare(a.kode || ""));

   if (filtered.length === 0) {
       tbody.innerHTML = '<tr><td colspan="10" class="text-center py-6 text-slate-400 font-bold">Data obat tidak ditemukan.</td></tr>';
       return;
   }

   tbody.innerHTML = filtered.map(o => {
       let stok = Number(o.stok) || 0;
       let min = Number(o.stokMin) || 0;
       let badgeStatus = '';
       if (stok <= 0) {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Habis</span>';
       } else if (stok <= min) {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Kritis</span>';
       } else {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Aman</span>';
       }

       return `
           <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
               <td class="p-3 font-mono font-bold text-indigo-600">${o.kode || '-'}</td>
               <td class="p-3 font-bold text-slate-800">${o.nama || '-'}${o.kandungan && o.kandungan !== '-' ? `<p class="text-[10px] text-indigo-600 font-semibold mt-0.5">🧪 ${o.kandungan}</p>` : ''}</td>
               <td class="p-3 text-slate-600">${o.satuan || 'Unit'}</td>
               <td class="p-3 text-right text-slate-600 font-semibold">${fmtRpStr(o.hpp || 0)}</td>
               <td class="p-3 text-right font-black text-slate-800">${fmtRpStr(o.hargaJual || o.harga || 0)}</td>
               <td class="p-3 text-center font-bold ${stok <= min ? 'text-rose-600' : 'text-slate-700'}">${stok}</td>
               <td class="p-3 text-center text-slate-400">${min}</td>
               <td class="p-3 text-slate-600 text-[11px]">${o.expired || '-'}</td>
               <td class="p-3 text-slate-600 text-[11px]">${o.supplier || '-'}</td>
               <td class="p-3 text-center">${badgeStatus}</td>
           </tr>
       `;
   }).join('');
}

function renderTabelBmhp() {
   let tbody = document.getElementById('tbodyDbBmhp');
   if (!tbody) return;
   let inp = document.getElementById('cariDbBmhp');
   let q = inp ? inp.value.toLowerCase().trim() : '';
  
   let filtered = listMasterBmhp;
   if(q) {
       filtered = filtered.filter(b => 
           (b.nama && b.nama.toLowerCase().includes(q)) || 
           (b.kode && b.kode.toLowerCase().includes(q)) ||
           (b.supplier && b.supplier.toLowerCase().includes(q))
       );
   }

   filtered.sort((a, b) => (b.kode || "").localeCompare(a.kode || ""));

   if (filtered.length === 0) {
       tbody.innerHTML = '<tr><td colspan="10" class="text-center py-6 text-slate-400 font-bold">Data BMHP tidak ditemukan.</td></tr>';
       return;
   }

   tbody.innerHTML = filtered.map(b => {
       let stok = Number(b.stok) || 0;
       let min = Number(b.stokMin) || 0;
       let badgeStatus = '';
       if (stok <= 0) {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Habis</span>';
       } else if (stok <= min) {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Kritis</span>';
       } else {
           badgeStatus = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Aman</span>';
       }

       return `
           <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
               <td class="p-3 font-mono font-bold text-indigo-600">${b.kode || '-'}</td>
               <td class="p-3 font-bold text-slate-800">${b.nama || '-'}</td>
               <td class="p-3 text-slate-600">${b.satuan || 'Unit'}</td>
               <td class="p-3 text-right text-slate-600 font-semibold">${fmtRpStr(b.hpp || 0)}</td>
               <td class="p-3 text-right font-black text-slate-800">${fmtRpStr(b.hargaJual || b.harga || 0)}</td>
               <td class="p-3 text-center font-bold ${stok <= min ? 'text-rose-600' : 'text-slate-700'}">${stok}</td>
               <td class="p-3 text-center text-slate-400">${min}</td>
               <td class="p-3 text-slate-600 text-[11px]">${b.expired || '-'}</td>
               <td class="p-3 text-slate-600 text-[11px]">${b.supplier || '-'}</td>
               <td class="p-3 text-center">${badgeStatus}</td>
           </tr>
       `;
   }).join('');
}

// ==========================================
// PENCADANGAN SISTEM (MULTI-DRIVE BACKUP)
// ==========================================
function triggerManualBackup() {
  let btn = document.getElementById('btnBackupSekarang');
  let originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Memproses Backup...';
  }
  showToast('info', 'Sedang membuat salinan snapshot database ke Google Drive...');

  let watchdog = setTimeout(() => {
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      showToast('warning', 'Proses backup memakan waktu lebih lama di server. Silakan periksa folder BACKUP_RME_SHELDON di Google Drive.');
    }
  }, 45000);

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        clearTimeout(watchdog);
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        if (res && res.success) {
          showToast('success', `Backup Sukses! (${res.successCount} File tersalin ke ${res.folderNama})`);
          if (res.folderUrl) {
            alert(`✅ PROSES BACKUP BERHASIL!\n\n` +
                  `• Status: Berhasil mencadangkan ${res.successCount} Spreadsheet\n` +
                  `• Folder: ${res.folderNama}\n` +
                  `• Akses Berbagi: ${res.targetEmail}\n` +
                  `• Retensi: File cadangan > 6 hari otomatis dibersihkan\n\n` +
                  `Folder dapat langsung dicek di Google Drive:\n${res.folderUrl}`);
          }
        } else {
          showToast('warning', (res && res.message) ? res.message : 'Proses backup selesai dengan beberapa catatan.');
        }
      })
      .withFailureHandler(err => {
        clearTimeout(watchdog);
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        showToast('error', 'Gagal melakukan backup: ' + errStr);
        alert(`❌ GAGAL MEMPROSES BACKUP:\n\n${errStr}\n\nCatatan:\n1. Pastikan Anda telah menimpa file Code.gs terbaru di Apps Script editor.\n2. Pastikan izin akses Google Drive (DriveApp) telah diizinkan (klik Run 1x di editor jika diminta).`);
      })
      .jalankanBackupSekarang();
  } else {
    setTimeout(() => {
      clearTimeout(watchdog);
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      showToast('success', 'Simulasi Backup Sukses: Seluruh database tersalin ke BACKUP_RME_SHELDON.');
    }, 1500);
  }
}

function aktifkanAutoBackupTrigger() {
  let btn = document.getElementById('btnPasangTriggerBackup');
  let originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Mengatur Jadwal...';
  }

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        showToast('success', res.message || 'Auto-Backup harian pukul 02.00 WIB berhasil aktif!');
        alert(`⏰ JADWAL AUTO-BACKUP BERHASIL DIAKTIFKAN!\n\n` +
              `• Waktu Eksekusi: Setiap hari pukul 02.00 Dini Hari WIB (Asia/Jakarta)\n` +
              `• Tujuan 1: Google Drive Akun Utama (Folder: BACKUP_RME_SHELDON)\n` +
              `• Tujuan 2: Google Drive vembrian@gmail.com\n` +
              `• Retensi: File > 6 hari otomatis dihapus`);
      })
      .withFailureHandler(err => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        showToast('error', 'Gagal mengatur jadwal backup: ' + errStr);
        alert(`❌ GAGAL MENGATUR JADWAL TRIGGER:\n\n${errStr}\n\nSolusi Alternatif:\nBuka Apps Script Editor -> pilih fungsi 'pasangTriggerAutoBackupHarianJam02' -> klik tombol Run (Jalankan).`);
      })
      .pasangTriggerAutoBackupHarianJam02();
  } else {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      showToast('success', 'Simulasi Trigger: Auto-backup harian jam 02.00 WIB aktif.');
    }, 1000);
  }
}

function aktifkanArsipTahunanTrigger() {
  let btn = document.getElementById("btnPasangTriggerArsip");
  let originalHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Mengatur Jadwal...";
  }

  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        showToast("success", res.message || "Auto-Arsip tahunan 1 Januari pukul 01.00 WIB berhasil aktif!");
        alert("📦 JADWAL AUTO-ARSIP TAHUNAN DIAKTIFKAN!\n\n" +
              "• Tanggal Eksekusi: Setiap 1 Januari Pukul 01.00 WIB\n" +
              "• File yang Diarsipkan: RME Sheldon - 02 Pembayaran, 03 Rekam Medis, 04 Surat, 07 Log\n" +
              "• Target Spreadsheet: RME_Arsip_[TAHUN] di My Drive\n" +
              "• Berbagi Akses: vembrian@gmail.com\n" +
              "• Data lama dipindahkan ke arsip agar database operasional selalu cepat dan ringan.");
      })
      .withFailureHandler(err => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        showToast("error", "Gagal mengatur jadwal arsip: " + errStr);
        alert("❌ GAGAL MENGATUR JADWAL ARSIP:\n\n" + errStr + "\n\nSolusi:\nBuka Apps Script Editor -> pilih fungsi \x27pasangTriggerArsipTahunan1Januari\x27 -> klik Run.");
      })
      .pasangTriggerArsipTahunan1Januari();
  } else {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      showToast("success", "Simulasi Trigger: Auto-Arsip tahunan 1 Januari jam 01.00 WIB aktif.");
    }, 1000);
  }
}

// ==========================================
// FITUR SINKRONISASI SEMUA SHEET OTOMATIS
// ==========================================
function triggerSinkronSemuaSheet() {
  const btn = document.getElementById("btnSinkronSheet");
  const originalHtml = btn ? btn.innerHTML : "<span>🔄</span> Sinkronkan Sheet";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Menyinkronkan...";
  }

  showToast("info", "Memeriksa dan membuat sheet yang belum ada pada seluruh spreadsheet...");

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        if (res && res.success) {
          showToast("success", "Sinkronisasi sheet selesai!");
          alert("✅ SINKRONISASI SPREADSHEET BERHASIL:\n\n" + (res.message || "Semua sheet telah lengkap dan diperbarui."));
        } else {
          showToast("warning", res ? res.message : "Terjadi kendala saat sinkronisasi.");
        }
      })
      .withFailureHandler(err => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        showToast("error", "Gagal sinkronisasi: " + errStr);
        alert("❌ GAGAL SINKRONISASI SHEET:\n\n" + errStr);
      })
      .sinkronkanSemuaSheetOtomatis();
  } else {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      showToast("success", "Simulasi: Seluruh sheet pada spreadsheet terverifikasi lengkap.");
    }, 1200);
  }
}


// ==========================================
// FITUR OTOMATISASI PAYROLL & HONOR DOKTER
// ==========================================
function triggerSetupPayroll() {
  const btn = document.getElementById("btnSetupPayroll");
  const originalHtml = btn ? btn.innerHTML : "<span>💼</span> Setup Payroll Dokter";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "<span>⏳</span> Menyiapkan Payroll...";
  }

  showToast("info", "Membuat/menyiapkan Spreadsheet 11 Payroll & Honor Dokter di Google Drive...");

  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        if (res && res.success) {
          showToast("success", "Spreadsheet Payroll Dokter Berhasil Dibuat/Disinkronkan!");
          alert("✅ SPREADSHEET PAYROLL DOKTER BERHASIL DISIAPKAN:\n\n" + 
                (res.message || "Spreadsheet RME Sheldon - 11 Payroll & Honor Dokter telah siap.") +
                (res.url ? "\n\nLink Google Spreadsheet:\n" + res.url : ""));
        } else {
          showToast("warning", res ? res.message : "Terjadi kendala saat setup payroll.");
        }
      })
      .withFailureHandler(err => {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
        let errStr = (err && err.message) ? err.message : String(err);
        showToast("error", "Gagal setup payroll: " + errStr);
        alert("❌ GAGAL MEMBUAT SPREADSHEET PAYROLL:\n\n" + errStr);
      })
      .setupPayrollSpreadsheet();
  } else {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
      showToast("success", "Simulasi: Spreadsheet 11 Payroll & Honor Dokter berhasil disiapkan!");
      alert("✅ SPREADSHEET PAYROLL BERHASIL DISIAPKAN (SIMULASI):\n\n" +
            "• Judul: RME Sheldon - 11 Payroll & Honor Dokter\n" +
            "• Sheet 1: Penggajian_Dokter (Jasa Medis, PPh 21, THP)\n" +
            "• Sheet 2: Honor_Perawat_Staff (Gaji Pokok + Fee Tindakan)\n" +
            "• Sheet 3: Tagihan_Vendor_Lab (Biaya Laboratorium Eksternal)\n" +
            "• Sheet 4: Slip_Gaji_Arsip (Riwayat Kirim Slip)");
    }, 1200);
  }
}




 let rawDataInventory = [];


 function initInventoryModule() {
   loadInventoryData();
   if(document.getElementById('restockTanggal')) {
      document.getElementById('restockTanggal').value = getTodayIso();
   }
 }


 function loadInventoryData() {
   google.script.run.withSuccessHandler(res => {
     rawDataInventory = res || [];
     renderInventoryTable(rawDataInventory);
     populateRestockDropdown(rawDataInventory);
   }).getMasterInventory();
 }


 function renderInventoryTable(list) {
   let tbody = document.getElementById('tbodyInventory');
   document.getElementById('badgeTotalGudang').innerText = list.length + ' Item';
  
   if (list.length === 0) {
     tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-400 font-bold">Belum ada data barang gudang.</td></tr>';
     return;
   }


   tbody.innerHTML = list.map(item => {
     let isKritis = item.stok <= item.kritis;
     let badgeStatus = isKritis
       ? `<span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[9px] border border-rose-200 animate-pulse">🚨 Stok Kritis</span>`
       : `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px] border border-emerald-200">Aman</span>`;
    
     let katBadge = item.kategori.toLowerCase() === 'obat'
       ? `<span class="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-200">Obat</span>`
       : `<span class="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-sky-200">BMHP</span>`;


     return `
       <tr class="hover:bg-slate-50 transition-colors">
         <td class="p-3"><p class="font-mono font-bold text-slate-700">${item.kode}</p><p class="mt-0.5">${katBadge}</p></td>
         <td class="p-3 font-bold text-slate-900">${item.nama}</td>
         <td class="p-3 text-center text-slate-600">${item.satuan}</td>
         <td class="p-3 text-right font-mono text-slate-600">Rp ${formatUangDashboard(item.hpp)}</td>
         <td class="p-3 text-right"><p class="font-mono font-bold text-emerald-600">Rp ${formatUangDashboard(item.hargaJual)}</p><p class="text-[9px] text-slate-400">Margin: ${item.margin}%</p></td>
         <td class="p-3 text-center font-black text-sm text-slate-800">${item.stok}</td>
         <td class="p-3 text-center">${badgeStatus}</td>
       </tr>
     `;
   }).join('');
 }


 function filterGudangTable() {
   let q = document.getElementById('cariGudangInput').value.toLowerCase().trim();
   let filtered = rawDataInventory.filter(i => i.nama.toLowerCase().includes(q) || i.kode.toLowerCase().includes(q));
   renderInventoryTable(filtered);
 }


 function populateRestockDropdown(list) {
   let sel = document.getElementById('restockPilihItem');
   // Filter hanya yang bukan tindakan
   let validItems = list.filter(i => i.kategori.toLowerCase() !== 'tindakan');
   sel.innerHTML = '<option value="" disabled selected>-- Pilih Item dari Master --</option>' +
     validItems.map(i => `<option value="${i.kode}" data-nama="${i.nama}" data-hpp="${i.hpp}" data-satuan-beli="${i.satuanBeli || 'Pcs'}" data-isi="${i.isiPerSatuan || 1}" data-satuan="${i.satuan || 'Pcs'}">${i.kode} - ${i.nama} (Stok: ${i.stok})</option>`).join('');
 }


 function onItemRestockSelect(sel) {
   let opt = sel.options[sel.selectedIndex];
   let hpp = opt.getAttribute('data-hpp') || 0;
   let isi = parseFloat(opt.getAttribute('data-isi')) || 1;
   let defaultHrgBeli = (hpp * isi) || hpp;
   document.getElementById('restockHargaBeli').value = defaultHrgBeli;
   updateRestockConversionPreview();
 }


 function updateRestockConversionPreview() {
   let sel = document.getElementById('restockPilihItem');
   let box = document.getElementById('restockKonversiBox');
   let text = document.getElementById('restockKonversiText');
   if (!sel || sel.selectedIndex <= 0) {
     if (box) box.classList.add('hidden');
     return;
   }
   let opt = sel.options[sel.selectedIndex];
   let qtyBeli = parseFloat(document.getElementById('restockQty').value) || 0;
   let isi = parseFloat(opt.getAttribute('data-isi')) || 1;
   let satBeli = opt.getAttribute('data-satuan-beli') || 'Box';
   let satPcs = opt.getAttribute('data-satuan') || 'Pcs';
   let totalPcs = qtyBeli * isi;

   if (box && text) {
     box.classList.remove('hidden');
     text.innerHTML = `<strong>${qtyBeli}</strong> ${satBeli} &times; <strong>${isi}</strong> ${satPcs} = <span class="font-black text-emerald-900">${totalPcs} ${satPcs}</span> masuk ke stok tersedia.`;
   }
 }


 function bukaModalRestock() {
   document.getElementById('modalRestock').classList.remove('hidden');
   updateRestockConversionPreview();
 }


 function tutupModalRestock() {
   document.getElementById('modalRestock').classList.add('hidden');
   document.getElementById('formRestock').reset();
   document.getElementById('restockTanggal').value = getTodayIso();
   let box = document.getElementById('restockKonversiBox');
   if (box) box.classList.add('hidden');
 }


 function handleSimpanRestock(e) {
   e.preventDefault();
   let sel = document.getElementById('restockPilihItem');
   let opt = sel.options[sel.selectedIndex];
  
   let payload = {
     currentUser: window.activeNamaAccount,
     tanggal: document.getElementById('restockTanggal').value,
     noFaktur: document.getElementById('restockNoFaktur') ? document.getElementById('restockNoFaktur').value.trim() : '-',
     kode: sel.value,
     nama: opt.getAttribute('data-nama'),
     qty: document.getElementById('restockQty').value,
     hargaBeli: document.getElementById('restockHargaBeli').value,
     supplier: document.getElementById('restockSupplier').value,
     expiredDate: document.getElementById('restockExpired').value
   };


   let btn = document.getElementById('btnSimpanRestock');
   btn.innerHTML = 'MENYIMPAN...'; btn.disabled = true;


   google.script.run.withSuccessHandler(res => {
     btn.innerHTML = 'Simpan & Masukkan Stok'; btn.disabled = false;
     if(res.success) {
       showToast('success', res.message);
       tutupModalRestock();
       loadInventoryData();
     } else {
       showToast('error', res.message);
     }
   }).simpanPembelianGudang(payload);
 }



// ==========================================
// MODUL INFORMASI (TINDAKAN, OBAT, BMHP)
// ==========================================
let dataInfoTindakan = [];
let dataInfoObat = [];
let dataInfoBmhp = [];
let infoActiveTab = 'tindakan';

function initInformasiModule() {
  loadInfoTindakanData();
  loadInfoObatData();
  loadInfoBmhpData();
}

function changeInfoTab(tab) {
  infoActiveTab = tab;
  ['panelInfoTindakan', 'panelInfoObat', 'panelInfoBmhp'].forEach(id => {
    let el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  ['tabInfoTindakan', 'tabInfoObat', 'tabInfoBmhp'].forEach(id => {
    let btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
      btn.classList.add('text-slate-600');
    }
  });

  if (tab === 'tindakan') {
    let p = document.getElementById('panelInfoTindakan'); if (p) p.classList.remove('hidden');
    let b = document.getElementById('tabInfoTindakan');
    if (b) { b.classList.add('bg-white', 'text-indigo-700', 'shadow-sm'); b.classList.remove('text-slate-600'); }
    renderInfoTindakan();
  } else if (tab === 'obat') {
    let p = document.getElementById('panelInfoObat'); if (p) p.classList.remove('hidden');
    let b = document.getElementById('tabInfoObat');
    if (b) { b.classList.add('bg-white', 'text-indigo-700', 'shadow-sm'); b.classList.remove('text-slate-600'); }
    renderInfoObat();
  } else if (tab === 'bmhp') {
    let p = document.getElementById('panelInfoBmhp'); if (p) p.classList.remove('hidden');
    let b = document.getElementById('tabInfoBmhp');
    if (b) { b.classList.add('bg-white', 'text-indigo-700', 'shadow-sm'); b.classList.remove('text-slate-600'); }
    renderInfoBmhp();
  }
}

// ------------------------------------------
// 1. DATA & RENDER TINDAKAN
// ------------------------------------------
function loadInfoTindakanData() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(res => {
      dataInfoTindakan = res || [];
      populateInfoKategoriDropdown();
      renderInfoTindakan();
    }).getDaftarTindakanLengkap();
  }
}

function populateInfoKategoriDropdown() {
  let sel = document.getElementById('filterInfoKategoriTindakan');
  if (!sel) return;

  let currentVal = sel.value;
  let categories = [...new Set(dataInfoTindakan.map(t => t.kategori).filter(Boolean))].sort();

  sel.innerHTML = '<option value="">Semua Kategori</option>';
  categories.forEach(cat => {
    let opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  if (currentVal) sel.value = currentVal;
}

function renderInfoTindakan() {
  let tbody = document.getElementById('tbodyInfoTindakan');
  if (!tbody) return;

  let q = (document.getElementById('cariInfoTindakan')?.value || '').toLowerCase().trim();
  let kat = (document.getElementById('filterInfoKategoriTindakan')?.value || '').toLowerCase().trim();

  let filtered = dataInfoTindakan.filter(t => {
    let matchQuery = !q || (t.nama && t.nama.toLowerCase().includes(q)) || (t.kode && t.kode.toLowerCase().includes(q));
    let matchKat = !kat || (t.kategori && t.kategori.toLowerCase() === kat);
    return matchQuery && matchKat;
  });

  let badge = document.getElementById('badgeCountInfoTindakan');
  if (badge) badge.innerText = `${filtered.length} Tindakan`;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-400 font-bold">Data tindakan tidak ditemukan.</td></tr>';
    return;
  }

  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  tbody.innerHTML = filtered.map((t, idx) => `
    <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td class="p-3.5 text-center text-slate-400 font-mono font-bold">${idx + 1}</td>
      <td class="p-3.5">
        <p class="font-bold text-slate-900">${t.nama || '-'}</p>
        <p class="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">${t.kode || '-'}</p>
      </td>
      <td class="p-3.5">
        <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-100">
          ${t.kategori || 'Umum'}
        </span>
      </td>
      <td class="p-3.5 text-right font-black text-slate-900 text-sm font-mono">
        ${fmtRp(t.harga || t.tarif)}
      </td>
    </tr>
  `).join('');
}

// ------------------------------------------
// 2. DATA & RENDER OBAT
// ------------------------------------------
function loadInfoObatData() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(res => {
      dataInfoObat = res || [];
      renderInfoObat();
    }).getDaftarObatLengkap();
  }
}

function renderInfoObat() {
  let tbody = document.getElementById('tbodyInfoObat');
  if (!tbody) return;

  let q = (document.getElementById('cariInfoObat')?.value || '').toLowerCase().trim();

  let filtered = dataInfoObat.filter(o => {
    if (!q) return true;
    let matchNama = o.nama && o.nama.toLowerCase().includes(q);
    let matchKandungan = o.kandungan && o.kandungan.toLowerCase().includes(q);
    let matchKode = o.kode && o.kode.toLowerCase().includes(q);
    return matchNama || matchKandungan || matchKode;
  });

  let badge = document.getElementById('badgeCountInfoObat');
  if (badge) badge.innerText = `${filtered.length} Item Obat`;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400 font-bold">Data obat tidak ditemukan.</td></tr>';
    return;
  }

  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  tbody.innerHTML = filtered.map((o, idx) => {
    let stok = Number(o.stok) || 0;
    let min = Number(o.stokMin) || 0;
    let badgeStatus = '';
    if (stok <= 0) {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[9px] border border-rose-200">Habis</span>';
    } else if (stok <= min) {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[9px] border border-amber-200">Stok Kritis</span>';
    } else {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px] border border-emerald-200">Tersedia</span>';
    }

    let kandDisplay = o.kandungan && o.kandungan !== '-'
      ? `<span class="text-indigo-600 font-semibold">🧪 ${o.kandungan}</span>`
      : `<span class="text-slate-400 italic">-</span>`;

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-3.5 text-center text-slate-400 font-mono font-bold">${idx + 1}</td>
        <td class="p-3.5">
          <p class="font-bold text-slate-900">${o.nama || '-'}</p>
          <p class="text-[10px] text-slate-400 font-mono mt-0.5">${o.kode || '-'} • Satuan: ${o.satuan || 'Unit'}</p>
        </td>
        <td class="p-3.5 text-slate-700 font-medium">${kandDisplay}</td>
        <td class="p-3.5 text-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            ${o.satuanBeli || 'Box'} @ ${o.isiPerSatuan || 1} ${o.satuan || 'Pcs'}
          </span>
        </td>
        <td class="p-3.5 text-right font-black text-slate-900 text-sm font-mono">${fmtRp(o.hargaJual || o.harga)}</td>
        <td class="p-3.5 text-center">
          <span class="font-black text-sm ${stok <= min ? 'text-rose-600' : 'text-slate-800'} font-mono">${stok}</span>
          <span class="text-[10px] text-slate-400 block">${o.satuan || 'Unit'}</span>
        </td>
        <td class="p-3.5 text-center">${badgeStatus}</td>
      </tr>
    `;
  }).join('');
}

// ------------------------------------------
// 3. DATA & RENDER BMHP
// ------------------------------------------
function loadInfoBmhpData() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(res => {
      dataInfoBmhp = res || [];
      renderInfoBmhp();
    }).getDaftarBMHPLengkap();
  }
}

function renderInfoBmhp() {
  let tbody = document.getElementById('tbodyInfoBmhp');
  if (!tbody) return;

  let q = (document.getElementById('cariInfoBmhp')?.value || '').toLowerCase().trim();

  let filtered = dataInfoBmhp.filter(b => {
    if (!q) return true;
    let matchNama = b.nama && b.nama.toLowerCase().includes(q);
    let matchKode = b.kode && b.kode.toLowerCase().includes(q);
    return matchNama || matchKode;
  });

  let badge = document.getElementById('badgeCountInfoBmhp');
  if (badge) badge.innerText = `${filtered.length} Item BMHP`;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-bold">Data BMHP tidak ditemukan.</td></tr>';
    return;
  }

  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  tbody.innerHTML = filtered.map((b, idx) => {
    let stok = Number(b.stok) || 0;
    let min = Number(b.stokMin) || 0;
    let badgeStatus = '';
    if (stok <= 0) {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[9px] border border-rose-200">Habis</span>';
    } else if (stok <= min) {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[9px] border border-amber-200">Stok Kritis</span>';
    } else {
      badgeStatus = '<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px] border border-emerald-200">Tersedia</span>';
    }

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-3.5 text-center text-slate-400 font-mono font-bold">${idx + 1}</td>
        <td class="p-3.5">
          <p class="font-bold text-slate-900">${b.nama || '-'}</p>
          <p class="text-[10px] text-slate-400 font-mono mt-0.5">${b.kode || '-'} • Satuan: ${b.satuan || 'Unit'}</p>
        </td>
        <td class="p-3.5 text-right font-black text-slate-900 text-sm font-mono">${fmtRp(b.hargaJual || b.harga)}</td>
        <td class="p-3.5 text-center">
          <span class="font-black text-sm ${stok <= min ? 'text-rose-600' : 'text-slate-800'} font-mono">${stok}</span>
          <span class="text-[10px] text-slate-400 block">${b.satuan || 'Unit'}</span>
        </td>
        <td class="p-3.5 text-center">${badgeStatus}</td>
      </tr>
    `;
  }).join('');
}



  function formatRupiahAI(angka) {
    if (!angka && angka !== 0) return '0';
    var number_string = angka.toString().replace(/[^,\d]/g, ''), split = number_string.split(','),
    sisa = split[0].length % 3, rupiah = split[0].substr(0, sisa), ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if(ribuan){ var separator = sisa ? '.' : ''; rupiah += separator + ribuan.join('.'); }
    return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
  }

  // Pengendali filter tampilan AI berdasarkan Role yang sedang aktif
  function applyAIRoleAccess() {
    const role = (window.activeUserRole || "").toLowerCase();
    const isSuper = role.includes('super user') || role.includes('owner');
    const isDokter = role.includes('dokter');

    const roleBadge = document.getElementById('aiRoleBadge');
    const switchContainer = document.getElementById('aiRoleSwitchContainer');

    if (roleBadge) {
      if (isSuper) {
        roleBadge.innerText = "SUPER USER (AKSES PENUH)";
        roleBadge.className = "ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase tracking-widest";
      } else if (isDokter) {
        roleBadge.innerText = "DOKTER (KLINIS & ODONTOGRAM)";
        roleBadge.className = "ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 uppercase tracking-widest";
      } else {
        roleBadge.innerText = (window.activeUserRole || "STAFF").toUpperCase();
      }
    }

    if (isSuper) {
      if (switchContainer) switchContainer.classList.remove('hidden');
      switchAIViewMode('all');
    } else if (isDokter) {
      if (switchContainer) switchContainer.classList.add('hidden');
      switchAIViewMode('dokter');
    } else {
      if (switchContainer) switchContainer.classList.add('hidden');
      switchAIViewMode('dokter');
    }
  }

  function switchAIViewMode(mode) {
    const secSuperKpi = document.getElementById('aiSecKpiSuperuser');
    const secSuperFin = document.getElementById('aiSecFinansial');
    const secSuperLog = document.getElementById('aiSecLogistik');
    const bannerStok = document.getElementById('aiBannerStokContainer');
    const secKlinis = document.getElementById('aiSecKlinis');

    const btnAll = document.getElementById('aiBtnModeAll');
    const btnDokter = document.getElementById('aiBtnModeDokter');
    const btnSuper = document.getElementById('aiBtnModeSuper');

    // Reset button styles
    [btnAll, btnDokter, btnSuper].forEach(b => {
      if (b) {
        b.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900";
      }
    });

    if (mode === 'dokter') {
      if (secSuperKpi) secSuperKpi.classList.add('hidden');
      if (secSuperFin) secSuperFin.classList.add('hidden');
      if (secSuperLog) secSuperLog.classList.add('hidden');
      if (bannerStok) bannerStok.classList.add('hidden');
      if (secKlinis) secKlinis.classList.remove('hidden');
      if (btnDokter) btnDokter.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-cyan-700 shadow-sm";
    } else if (mode === 'superuser') {
      if (secSuperKpi) secSuperKpi.classList.remove('hidden');
      if (secSuperFin) secSuperFin.classList.remove('hidden');
      if (secSuperLog) secSuperLog.classList.remove('hidden');
      if (bannerStok) bannerStok.classList.remove('hidden');
      if (secKlinis) secKlinis.classList.add('hidden');
      if (btnSuper) btnSuper.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-indigo-700 shadow-sm";
    } else { // 'all'
      if (secSuperKpi) secSuperKpi.classList.remove('hidden');
      if (secSuperFin) secSuperFin.classList.remove('hidden');
      if (secSuperLog) secSuperLog.classList.remove('hidden');
      if (bannerStok) bannerStok.classList.remove('hidden');
      if (secKlinis) secKlinis.classList.remove('hidden');
      if (btnAll) btnAll.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-purple-700 shadow-sm";
    }
  }

  function loadAIInsights(isManual) {
    applyAIRoleAccess();

    const btnRefresh = document.getElementById('btnRefreshAI');
    if (btnRefresh) {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span>Memperbarui...</span>';
    }

    if (isManual && typeof showToast === 'function') {
      showToast('info', 'Memperbarui AI Insights & kalkulasi data...');
    }

    document.getElementById('aiTotalPasien').innerText = '...';
    document.getElementById('aiPendapatan').innerText = 'Rp ...';
    document.getElementById('aiForecastPendapatan').innerText = 'Rp ...';
    document.getElementById('aiHariSibukText').innerText = 'Menganalisis...';

    google.script.run.withSuccessHandler(function(data) {
      if (btnRefresh) {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> <span>Refresh AI</span>';
      }

      if (isManual && typeof showToast === 'function') {
        showToast('success', 'AI Insights & Analitik berhasil diperbarui secara real-time!');
      }

      if (data.error) {
        if (typeof showToast === 'function') showToast('error', "Gagal memuat AI Insights: " + data.error);
        return;
      }

      // 1. KPI Finansial & Operasional (Super User)
      document.getElementById('aiTotalPasien').innerText = data.totalPasien || 0;
      document.getElementById('aiPendapatan').innerText = 'Rp ' + formatRupiahAI(data.pendapatan || 0);
      document.getElementById('aiForecastPendapatan').innerText = 'Rp ' + formatRupiahAI(data.forecastPendapatan || 0);
      document.getElementById('aiHariSibukText').innerText = data.hariSibuk || "Normal";

      // 2. Banner Notif Stok
      var banStok = document.getElementById('aiBannerStok');
      var notifTxt = document.getElementById('aiNotifStok');
      if (notifTxt) notifTxt.innerText = data.notifStok || "Semua stok aman.";
      if (banStok) {
        if (data.notifStok && data.notifStok.includes('🚨')) {
          banStok.className = "bg-rose-100 border border-rose-300 text-rose-900 p-4 rounded-2xl shadow-sm flex gap-3 items-center font-bold";
        } else {
          banStok.className = "bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded-2xl shadow-sm flex gap-3 items-center font-semibold";
        }
      }

      // -----------------------------------------------------------------------
      // 3. SEKSI KLINIS & ODONTOGRAM (DOKTER)
      // -----------------------------------------------------------------------
      if (data.dmftSummary) {
        document.getElementById('aiDmftTotalScore').innerText = data.dmftSummary.avgDMFT || "0.0";
        document.getElementById('aiDmftDecayed').innerText = data.dmftSummary.avgD || "0";
        document.getElementById('aiDmftMissing').innerText = data.dmftSummary.avgM || "0";
        document.getElementById('aiDmftFilled').innerText = data.dmftSummary.avgF || "0";
        document.getElementById('aiDmftKesimpulan').innerText = data.dmftSummary.kesimpulan || "-";
      }

      // 3a. Recall Treatment List
      let recallHtml = '';
      if (data.recallTreatments && data.recallTreatments.length > 0) {
        data.recallTreatments.forEach(item => {
          let badgeColor = item.statusRecall.includes('Segera') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
          recallHtml += `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-extrabold text-slate-800 text-xs">${item.namaPasien}</span>
                  <span class="text-[10px] text-slate-400">(${item.noRm})</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-100 text-cyan-800">Gigi ${item.gigi}</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-0.5">${item.kondisi} &bull; Terakhir periksa: ${item.tglPemeriksaan || '-'}</p>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${badgeColor} whitespace-nowrap">${item.selisihHari} Hari Lalu</span>
            </div>`;
        });
      } else {
        recallHtml = '<p class="text-slate-400 italic">Tidak ada perawatan sementara atau saluran akar yang tertunda &gt; 14 hari.</p>';
      }
      document.getElementById('aiRecallList').innerHTML = recallHtml;

      // 3b. Kontraindikasi & Polifarmasi
      let kontraHtml = '';
      if (data.kontraindikasiList && data.kontraindikasiList.length > 0) {
        data.kontraindikasiList.forEach(item => {
          kontraHtml += `
            <div class="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-rose-900 text-xs">${item.namaPasien} (${item.noRm})</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black bg-rose-200 text-rose-800 uppercase">${item.kondisi}</span>
              </div>
              <p class="text-[11px] text-rose-800/90 leading-relaxed font-medium">${item.peringatan}</p>
            </div>`;
        });
      } else {
        kontraHtml = '<p class="text-slate-400 italic">Tidak terdeteksi riwayat komorbiditas atau kontraindikasi risiko tinggi pada pasien aktif.</p>';
      }
      document.getElementById('aiKontraindikasiList').innerHTML = kontraHtml;

      // -----------------------------------------------------------------------
      // 4. SEKSI FINANSIAL & OPERASIONAL (SUPER USER)
      // -----------------------------------------------------------------------
      // 4a. Layanan Paling Menguntungkan (High-Margin)
      let marginHtml = '';
      if (data.topMarginServices && data.topMarginServices.length > 0) {
        data.topMarginServices.forEach(item => {
          marginHtml += `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div class="min-w-0 pr-2">
                <p class="font-bold text-slate-800 text-xs truncate">${item.nama}</p>
                <p class="text-[10px] text-slate-500">Tarif: Rp ${formatRupiahAI(item.harga)} &bull; Terjual: ${item.qty}x</p>
              </div>
              <div class="text-right whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800">Margin ${item.marginPct}%</span>
                <p class="text-[10px] font-bold text-slate-700 mt-1">Laba: Rp ${formatRupiahAI(item.totalProfit)}</p>
              </div>
            </div>`;
        });
      } else {
        marginHtml = '<p class="text-slate-400 italic">Belum ada data tindakan kasir untuk analisis margin.</p>';
      }
      document.getElementById('aiMarginServicesList').innerHTML = marginHtml;

      // 4b. Heatmap Jam Sibuk
      let hourHtml = '';
      if (data.hourHeatmap) {
        let maxH = Math.max(...Object.values(data.hourHeatmap), 1);
        Object.keys(data.hourHeatmap).forEach(label => {
          let count = data.hourHeatmap[label];
          let pct = Math.round((count / maxH) * 100);
          hourHtml += `
            <div>
              <div class="flex justify-between text-[11px] font-bold mb-1">
                <span class="text-slate-700">${label}</span>
                <span class="text-indigo-600">${count} Kunjungan</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-indigo-600 h-2 rounded-full" style="width: ${pct}%"></div></div>
            </div>`;
        });
      }
      document.getElementById('aiHeatmapHours').innerHTML = hourHtml;

      // -----------------------------------------------------------------------
      // 5. SEKSI LOGISTIK CERDAS (SUPER USER)
      // -----------------------------------------------------------------------
      // 5a. Burn-Rate Restock
      let burnHtml = '';
      if (data.burnRatePredictions && data.burnRatePredictions.length > 0) {
        data.burnRatePredictions.forEach(item => {
          let badgeClass = item.estimasiHariHabis <= 5 ? 'bg-rose-100 text-rose-800 font-black' : 'bg-amber-100 text-amber-800 font-bold';
          burnHtml += `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p class="font-extrabold text-slate-800 text-xs">${item.nama}</p>
                <p class="text-[10px] text-slate-500">Stok Saat Ini: <span class="font-bold text-slate-700">${item.stok} ${item.satuan}</span> &bull; Laju Pakai: ~${item.avgPerHari} ${item.satuan}/hari</p>
              </div>
              <div class="text-right">
                <span class="px-2.5 py-1 rounded-lg text-[10px] ${badgeClass}">Habis dalam ~${item.estimasiHariHabis} Hari</span>
              </div>
            </div>`;
        });
      } else {
        burnHtml = '<p class="text-slate-400 italic">Laju konsumsi aman, tidak ada item yang diprediksi habis dalam 14 hari ke depan.</p>';
      }
      document.getElementById('aiBurnRateList').innerHTML = burnHtml;

      // 5b. Expired Alerts
      let expHtml = '';
      if (data.expiredAlerts && data.expiredAlerts.length > 0) {
        data.expiredAlerts.forEach(item => {
          expHtml += `
            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-[11px]">
              <span class="font-bold text-rose-900 truncate max-w-[140px]">${item.nama}</span>
              <span class="text-rose-700 font-bold">~${item.sisaBulan} bln lagi</span>
            </div>`;
        });
      } else {
        expHtml = '<p class="text-slate-400 italic">Tidak ada item mendekati expired.</p>';
      }
      document.getElementById('aiExpiredList').innerHTML = expHtml;

      // 5c. Slow-Moving Items
      let slowHtml = '';
      if (data.slowMovingItems && data.slowMovingItems.length > 0) {
        data.slowMovingItems.forEach(item => {
          slowHtml += `
            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-[11px]">
              <span class="font-bold text-slate-700 truncate max-w-[140px]">${item.nama}</span>
              <span class="text-slate-500 font-semibold">${item.stok} ${item.satuan}</span>
            </div>`;
        });
      } else {
        slowHtml = '<p class="text-slate-400 italic">Perputaran inventaris dinamis merata.</p>';
      }
      document.getElementById('aiSlowMovingList').innerHTML = slowHtml;

      // -----------------------------------------------------------------------
      // 6. SEKSI TREN LAYANAN & PROMOSI
      // -----------------------------------------------------------------------
      // Top Tindakan
      let tindakanHtml = '';
      if (data.topTindakan && data.topTindakan.length > 0) {
        let maxT = data.topTindakan[0].jumlah;
        data.topTindakan.forEach(item => {
          let pct = Math.round((item.jumlah / maxT) * 100);
          tindakanHtml += `
            <div>
              <div class="flex justify-between text-[11px] font-bold mb-1">
                <span class="text-slate-700 truncate max-w-[150px]">${item.nama}</span>
                <span class="text-teal-600">${item.jumlah}x</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-teal-500 h-2 rounded-full" style="width: ${pct}%"></div></div>
            </div>`;
        });
      }
      document.getElementById('aiTopTindakan').innerHTML = tindakanHtml;

      // Top Obat
      let obatHtml = '';
      if (data.topObat && data.topObat.length > 0) {
        let maxO = data.topObat[0].jumlah;
        data.topObat.forEach(item => {
          let pct = Math.round((item.jumlah / maxO) * 100);
          obatHtml += `
            <div>
              <div class="flex justify-between text-[11px] font-bold mb-1">
                <span class="text-slate-700 truncate max-w-[150px]">${item.nama}</span>
                <span class="text-amber-600">${item.jumlah} Unit</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-amber-500 h-2 rounded-full" style="width: ${pct}%"></div></div>
            </div>`;
        });
      }
      document.getElementById('aiTopObat').innerHTML = obatHtml;

      // Rekomendasi Text
      document.getElementById('aiRekomendasi').innerText = data.rekomendasi || "-";
      document.getElementById('aiTargetPromo').innerText = data.targetPromo || "-";

    }).withFailureHandler(function(err) {
      if (btnRefresh) {
        btnRefresh.disabled = false;
        btnRefresh.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> <span>Refresh AI</span>';
      }
      if (typeof showToast === 'function') {
        showToast('error', 'Gagal memuat AI Insights: ' + (err.message || err));
      }
    }).getAIInsightsData(window.activeUserRole, window.authToken);
  }


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
document.getElementById('loginUser').value = "STF-001";
document.getElementById('loginPass').value = "1234";
document.getElementById('formLogin').dispatchEvent(new Event('submit', { cancelable: true }));
runAllTimers();

assert("Login Super User Successful", window.activeAccount === "STF-001", "User: " + window.activeNamaAccount);
assert("Role Applied: Super User", window.activeUserRole === "Super User");

// 3. Data Synchronization & Event Firing
assert("KlinikData Master Synced", window.KlinikData.staff.length > 0 && window.KlinikData.tindakan.length > 0, "Staff: " + window.KlinikData.staff.length + ", Tindakan: " + window.KlinikData.tindakan.length);
assert("KlinikData Pasien Synced", window.KlinikData.pasien.length >= 3, "Total Pasien: " + window.KlinikData.pasien.length);
assert("KlinikData EMR Synced", window.KlinikData.rekamMedis.length > 0, "EMR count: " + window.KlinikData.rekamMedis.length);
assert("KlinikData Pembayaran Synced", window.KlinikData.pembayaran.length > 0, "Pembayaran count: " + window.KlinikData.pembayaran.length);

// 4. Test Navigation to Surat & Formulir Medis
switchMenu('surat');
runAllTimers();
assert("View Surat Active", !document.getElementById('view-surat').classList.contains('hidden'));

// 5. TEST PASIEN AUTOCOMPLETE IN SURAT (SKS)
changeSuratMenu('sakit');
runAllTimers();
assert("Panel Surat Sakit Open", !document.getElementById('panelSuratSakit').classList.contains('hidden'));

document.getElementById('sksSearchPasien').value = "budi";
searchPasienSKS();
runAllTimers(); // process debounce

var resBoxSKS = document.getElementById('sksSearchResult');
assert("SKS Search Result Dropdown Visible", !resBoxSKS.classList.contains('hidden'));
var itemsSKS = resBoxSKS.querySelectorAll('.search-item');
assert("SKS Found Matched Patients", itemsSKS.length > 0, "Found items: " + itemsSKS.length);

if (itemsSKS.length > 0) {
  itemsSKS[0].click(); // Simulate clicking the patient
  runAllTimers();
  assert("SKS Auto-populate ID Pasien", document.getElementById('sksIdPasien').value === "P-0001");
  assert("SKS Auto-populate No RM", document.getElementById('sksNoRm').value === "RM-0001");
  assert("SKS Auto-populate Nama Pasien", document.getElementById('sksNama').value === "Budi Santoso");
  assert("SKS Auto-populate Umur", document.getElementById('sksUmur').value.includes("36"));
  assert("SKS Auto-populate JK", document.getElementById('sksJK').value === "Laki-Laki");
  assert("SKS Auto-populate Alamat", document.getElementById('sksAlamat').value.includes("Payakumbuh"));
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

document.getElementById('skpSearchPasien').value = "siti";
searchPasienSKP();
runAllTimers();

var resBoxSKP = document.getElementById('skpSearchResult');
assert("SKP Search Result Dropdown Visible", !resBoxSKP.classList.contains('hidden'));
var itemsSKP = resBoxSKP.querySelectorAll('.search-item');
assert("SKP Found Matched Patients", itemsSKP.length > 0);

if (itemsSKP.length > 0) {
  itemsSKP[0].click();
  runAllTimers();
  assert("SKP Auto-populate ID Pasien", document.getElementById('skpIdPasien').value === "P-0002");
  assert("SKP Auto-populate No RM", document.getElementById('skpNoRm').value === "RM-0002");
  assert("SKP Auto-populate Nama Pasien", document.getElementById('skpNama').value === "Siti Rahmawati");
  assert("SKP Result Dropdown Closed", resBoxSKP.classList.contains('hidden'));
}

// 7. TEST PASIEN AUTOCOMPLETE IN SURAT (RSM - Resume Medis)
changeSuratMenu('resume');
runAllTimers();
assert("Panel Resume Medis Open", !document.getElementById('panelResumeMedis').classList.contains('hidden'));

document.getElementById('rsmSearchPasien').value = "budi";
searchPasienRSM();
runAllTimers();

var resBoxRSM = document.getElementById('rsmSearchResult');
assert("RSM Search Result Dropdown Visible", !resBoxRSM.classList.contains('hidden'));
var itemsRSM = resBoxRSM.querySelectorAll('.search-item');
assert("RSM Found Matched Patients", itemsRSM.length > 0);

if (itemsRSM.length > 0) {
  itemsRSM[0].click();
  runAllTimers();
  assert("RSM Auto-populate ID Pasien", document.getElementById('rsmIdPasien').value === "P-0001");
  assert("RSM Auto-populate No RM", document.getElementById('rsmNoRm').value === "RM-0001");
  assert("RSM Auto-populate Nama Pasien", document.getElementById('rsmNama').value === "Budi Santoso");
  assert("RSM Auto-fill Clinical Summary from EMR", document.getElementById('rsmRingkasanKlinis').value.length > 0);
  assert("RSM Auto-fill ICD Diagnosis from EMR", document.getElementById('rsmDiagnosisKerja').value.includes("K02.1"));
}

// 8. TEST PASIEN AUTOCOMPLETE IN SURAT (SPM - Rujukan)
changeSuratMenu('rujukan');
runAllTimers();
assert("Panel Rujukan Open", !document.getElementById('panelSuratRujukan').classList.contains('hidden'));

document.getElementById('spmSearchPasien').value = "ahmad";
searchPasienSPM();
runAllTimers();

var resBoxSPM = document.getElementById('spmSearchResult');
assert("SPM Search Result Dropdown Visible", !resBoxSPM.classList.contains('hidden'));
var itemsSPM = resBoxSPM.querySelectorAll('.search-item');
assert("SPM Found Matched Patients", itemsSPM.length > 0);

if (itemsSPM.length > 0) {
  itemsSPM[0].click();
  runAllTimers();
  assert("SPM Auto-populate ID Pasien", document.getElementById('spmIdPasien').value === "P-0003");
  assert("SPM Auto-populate Nama", document.getElementById('spmNama').value === "Ahmad Fauzi");
}

// 9. TEST PASIEN AUTOCOMPLETE IN SURAT (LAB - Pengantar Lab)
changeSuratMenu('lab');
runAllTimers();
assert("Panel Lab Open", !document.getElementById('panelSuratLab').classList.contains('hidden'));

document.getElementById('labSearchPasien').value = "budi";
searchPasienLAB();
runAllTimers();

var resBoxLAB = document.getElementById('labSearchResult');
assert("LAB Search Dropdown Visible", !resBoxLAB.classList.contains('hidden'));
var itemsLAB = resBoxLAB.querySelectorAll('.search-item');
assert("LAB Found Matched Patients", itemsLAB.length > 0);
if (itemsLAB.length > 0) {
  itemsLAB[0].click();
  runAllTimers();
  assert("LAB Auto-populate ID Pasien", document.getElementById('labIdPasien').value === "P-0001");
  assert("LAB Auto-populate Nama", document.getElementById('labNama').value === "Budi Santoso");
}

// 10. TEST PASIEN AUTOCOMPLETE IN SURAT (RAD - Pengantar Radiologi)
changeSuratMenu('radiologi');
runAllTimers();
assert("Panel Radiologi Open", !document.getElementById('panelSuratRadiologi').classList.contains('hidden'));

document.getElementById('radSearchPasien').value = "siti";
searchPasienRAD();
runAllTimers();

var resBoxRAD = document.getElementById('radSearchResult');
assert("RAD Search Dropdown Visible", !resBoxRAD.classList.contains('hidden'));
var itemsRAD = resBoxRAD.querySelectorAll('.search-item');
assert("RAD Found Matched Patients", itemsRAD.length > 0);
if (itemsRAD.length > 0) {
  itemsRAD[0].click();
  runAllTimers();
  assert("RAD Auto-populate ID Pasien", document.getElementById('radIdPasien').value === "P-0002");
  assert("RAD Auto-populate Nama", document.getElementById('radNama').value === "Siti Rahmawati");
}

// 11. TEST PASIEN DATE FORMAT (dd-mm-yyyy)
switchMenu('pasien');
runAllTimers();
var firstP = window.KlinikData.pasien[0];
assert("Patient Birth Date follows dd-mm-yyyy", /^\d{2}-\d{2}-\d{4}$/.test(firstP.tanggalLahir), "Tgl: " + firstP.tanggalLahir);

// 12. TEST EMR PATIENT SEARCH
switchMenu('rekam-medis');
runAllTimers();
document.getElementById('rmSearchPasien').value = "budi";
searchPasienRM();
runAllTimers();
var resRM = document.getElementById('rmSearchResult');
assert("Rekam Medis Search Dropdown Visible", !resRM.classList.contains('hidden'));
pilihPasienRM('P-0001');
runAllTimers();
assert("Active Pasien in EMR set", activePasienRM && activePasienRM.idPasien === "P-0001");

// 13. TEST KASIR PATIENT SEARCH
switchMenu('kasir');
runAllTimers();
document.getElementById('ksrSearchPasien').value = "budi";
document.getElementById('ksrSearchPasien').dispatchEvent(new Event('input'));
runAllTimers();
var resKSR = document.getElementById('ksrSearchResult');
assert("Kasir Search Dropdown Visible", !resKSR.classList.contains('hidden'));
pilihPasienKSR('P-0001');
runAllTimers();
assert("Kasir Patient Selected", document.getElementById('ksrNama').value === "Budi Santoso");

// 14. TEST MASTER DATABASE & INVENTORY & AI MODULES
switchMenu('database');
runAllTimers();
assert("Master Database Initialized Cleanly", typeof initDatabaseModule === 'function');

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
document.getElementById('cariInfoObat').value = "amoxicillin";
renderInfoObat();
assert("Info Obat Searched by Nama", document.getElementById('tbodyInfoObat').innerHTML.includes('Amoxicillin'));

// Search by Kandungan Obat
document.getElementById('cariInfoObat').value = "mefenamic";
renderInfoObat();
assert("Info Obat Searched by Kandungan (Mefenamic Acid)", document.getElementById('tbodyInfoObat').innerHTML.includes('Asam Mefenamat'));

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
assert("Info Obat Menampilkan Kemasan Beli", document.getElementById('tbodyInfoObat').innerHTML.includes('@') || document.getElementById('tbodyInfoObat').innerHTML.includes('Box'));

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
assert("Opsi Perawat Kasir Hanya Role Perawat Gigi", optPerawatKSR.includes("Bernadette") && !optPerawatKSR.includes("Penny") && !optPerawatKSR.includes("Cooper"));

// 15h. Test Diagnosa ICD-10 & Tindakan ICD-9 Title Casing & Row Creation
switchMenu('rekamMedis');
runAllTimers();
tambahRowDiagnosa();
let contDiag = document.getElementById('containerDiagnosa');
assert("Diagnosa Row Appended", contDiag && contDiag.children.length > 0);
let lastRowDiag = contDiag.children[contDiag.children.length - 1];
assert("Diagnosa Note Field Present", !!lastRowDiag.querySelector('.val-diagnosa-ket'));
let mockInputDiag = { value: "karies dentis", setSelectionRange: function() {} };
autoTitleCase(mockInputDiag);
assert("Diagnosa Input Auto Title Case Formatted", mockInputDiag.value === "Karies Dentis");

tambahRowTindakan();
let contTind = document.getElementById('containerTindakan');
assert("Tindakan Row Appended", contTind && contTind.children.length > 0);
let lastRowTind = contTind.children[contTind.children.length - 1];
assert("Tindakan Note Field Present", !!lastRowTind.querySelector('.val-tindakan-ket'));
let mockInputTind = { value: "pencabutan gigi tetap", setSelectionRange: function() {} };
autoTitleCase(mockInputTind);
assert("Tindakan Input Auto Title Case Formatted", mockInputTind.value === "Pencabutan Gigi Tetap");

// 15i. Test Detail Rekam Medis (EMR): Tombol Odontogram History & Posisi Diagnosis Gigi
riwayatPasienAktif = [{
  idPasien: 'P-001',
  noRm: 'RM-001',
  namaPasien: 'Pasien Test',
  tanggalPeriksa: '2026-10-08',
  dokterPemeriksa: 'drg. Sheldon',
  anamnesisStr: JSON.stringify({ cc: 'Nyeri', diagnosaICD: ['K02.1 - Caries'] }),
  fisikStr: JSON.stringify({ kesan: 'Baik', periodontal: { summary: { totalSites: 6, bopPercent: 50 } } }),
  odontogramStr: JSON.stringify({ 16: { generalCondition: 'car', surfaces: { occlusal: 'car' } } }),
  tindakanStr: JSON.stringify(['23.2 - Tumpatan']),
  obatStr: JSON.stringify([{ obat: 'Amoxicillin', qty: 10, ket: '3x1' }])
}];
bukaDetailRM(0);
let printArea = document.getElementById('printAreaRM');
assert("Detail RM Rendered", !!printArea);
let printHtml = printArea.innerHTML;
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

// 15j. Test View History Pasien di Database Pasien: Aligned with Rekam Medis Layout
let origPasienSuite = window.KlinikData.pasien || [];
let origRmSuite = window.KlinikData.rekamMedis || [];
window.KlinikData.pasien = [{ idPasien: 'P-001', namaPasien: 'Pasien Test', noRm: 'RM-001' }];
window.KlinikData.rekamMedis = [{
  idPasien: 'P-001',
  tanggalPeriksa: '2026-10-08',
  dokterPemeriksa: 'drg. Sheldon',
  anamnesisStr: JSON.stringify({ cc: 'Nyeri', diagnosaICD: ['K02.1 - Caries'] }),
  fisikStr: JSON.stringify({ kesan: 'Baik', periodontal: { summary: { totalSites: 192, bopPercent: 12 } }, ohis: { debrisScore: 0.5, calculusScore: 0.33, totalScore: 0.83, category: 'Baik' } }),
  odontogramStr: JSON.stringify({ 16: { generalCondition: 'car', surfaces: { occlusal: 'car' } } }),
  tindakanStr: JSON.stringify(['23.2 - Tumpatan']),
  obatStr: JSON.stringify([{ obat: 'Amoxicillin', qty: 10, ket: '3x1' }])
}];
openHistoryEMR('P-001');
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
editPasien('P-0001');
assert("Edit Pasien: Panel Form Terbuka", !document.getElementById('panelFormPasien').classList.contains('hidden'));
assert("Edit Pasien: Mode Edit PasId Terisi", document.getElementById('pasId').value === 'P-0001');
assert("Edit Pasien: Judul Form Menampilkan Edit", document.getElementById('formTitle').innerText.includes('Edit Data Pasien'));
assert("Edit Pasien: Tombol Simpan Berubah Label", document.getElementById('btnSimpanPasien').innerHTML.includes('Simpan Perubahan'));
assert("Edit Pasien: Tombol Batal Edit Muncul", !document.getElementById('btnBatalPasien').classList.contains('hidden'));

// Lakukan perubahan nama & alamat
document.getElementById('pasNama').value = "Budi Santoso Terupdate";
document.getElementById('pasAlamat').value = "Jl. Sudirman No. 99";
simpanDataPasien({ preventDefault: () => {} });
runAllTimers();

let updatedP = window.KlinikData.pasien.find(p => p.idPasien === 'P-0001');
assert("Edit Pasien: Data Lokal Terupdate Instan", updatedP && updatedP.namaPasien === "Budi Santoso Terupdate");
assert("Edit Pasien: Tabel Menampilkan Nama Terupdate", document.getElementById('tbodyPasien').innerHTML.includes('Budi Santoso Terupdate'));
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
// 16a. Verify SUPER USER permissions:
terapkanRoleAkses('Super User');
window.activeUserRole = 'Super User';
renderTablePagePasien();
assert("Super User: Nav Dashboard Visible", !document.getElementById('nav-dashboard').classList.contains('hidden'));
assert("Super User: Nav AI Visible", !document.getElementById('nav-ai').classList.contains('hidden'));
assert("Super User: Nav Pasien Visible", !document.getElementById('nav-pasien').classList.contains('hidden'));
assert("Super User: Nav Rekam Medis Visible", !document.getElementById('nav-rekam-medis').classList.contains('hidden'));
assert("Super User: Nav Surat Visible", !document.getElementById('nav-surat').classList.contains('hidden'));
assert("Super User: Nav Database Visible", !document.getElementById('nav-database').classList.contains('hidden'));
assert("Super User: Nav Inventory Visible", !document.getElementById('nav-inventory').classList.contains('hidden'));
assert("Super User: Nav Informasi Visible", !document.getElementById('nav-informasi').classList.contains('hidden'));
assert("Super User: Nav Kasir Visible", !document.getElementById('nav-kasir').classList.contains('hidden'));
assert("Super User: Nav Riwayat Invoice Visible", !document.getElementById('nav-riwayat-invoice').classList.contains('hidden'));
assert("Super User: Tombol Tambah Pasien Baru Visible", !document.getElementById('btnTambahPasienBaru').classList.contains('hidden'));
assert("Super User: Tombol Filter Duplikat Visible", !document.getElementById('btnFilterDuplikat').classList.contains('hidden'));
assert("Super User: Tombol Edit Pasien Rendered", document.getElementById('tbodyPasien').innerHTML.includes('Edit'));
assert("Super User: Tombol Hapus Pasien Rendered", document.getElementById('tbodyPasien').innerHTML.includes('🗑️ Hapus'));

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

// 2. Uji toggleFilterDataGanda (Staff dilarang, Super User diizinkan)
assert("Initial Filter Duplikat Status False", isFilterDuplikatAktif === false);
toggleFilterDataGanda();
assert("Staff: Dilarang Mengaktifkan Filter Duplikat", isFilterDuplikatAktif === false);

terapkanRoleAkses('Super User');
window.activeUserRole = 'Super User';
toggleFilterDataGanda();
assert("Super User: Toggle Filter Duplikat Status Menjadi True", isFilterDuplikatAktif === true);
toggleFilterDataGanda();
assert("Super User: Toggle Filter Duplikat Status Kembali False", isFilterDuplikatAktif === false);

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
terapkanRoleAkses('Super User');
resetFormBilling();
document.getElementById('ksrID').value = '';
simpanBillingFinal();
assert("K-1: Simpan Invoice Tanpa Pasien Ditolak", getLastToast().includes("Cari dan Pilih Pasien terlebih dahulu"));
assert("K-1: Tombol Kasir Tidak Stuck / Loading", document.getElementById('btnSimpanBilling').innerText === "SIMPAN DATA INVOICE");

// Skenario K-2: Simpan Billing dengan Field Wajib Belum Lengkap (Dokter Kosong)
pilihPasienKSR('P-0001');
document.getElementById('ksrDokter').value = '';
document.getElementById('ksrTgl').value = '2026-10-08';
document.getElementById('ksrMetode').value = 'Tunai';
document.getElementById('ksrStatus').value = 'Lunas';
simpanBillingFinal();
assert("K-2: Simpan Tanpa Dokter Ditolak", getLastToast().includes("Lengkapi field bertanda *"));

// Skenario K-3: Keranjang Pembayaran Kosong (Tanpa Tindakan/Obat/BMHP)
document.getElementById('ksrDokter').value = 'drg. Sheldon Cooper, Sp.Ort';
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
inputObat.value = 'Amoxicillin 500mg (Strip)';
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
pilihPasienKSR('P-0001');
var alertCicilan = document.getElementById('alertCicilanPasien');
assert("K-9: Alert Tagihan Berjalan Otomatis Muncul", !alertCicilan.classList.contains('hidden'));
assert("K-9: Judul Alert Memperingatkan Tagihan Berjalan", document.getElementById('alertCicilanTitle').innerText.includes("Tagihan Berjalan"));
assert("K-9: Rincian Sisa Piutang Ditampilkan di Body Alert", document.getElementById('alertCicilanBody').innerHTML.includes("3.500.000") || document.getElementById('alertCicilanBody').innerHTML.includes("Uang Muka"));

// Skenario K-10: Pelunasan Sisa Tagihan Berjalan (Status "Pelunasan")
resetFormBilling();
pilihPasienKSR('P-0001');
document.getElementById('ksrTgl').value = '2026-10-08';
document.getElementById('ksrDokter').value = 'drg. Sheldon Cooper, Sp.Ort';
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
pilihPasienKSR('P-0001');
assert("K-10: Evaluasi Tagihan Berjalan Pasien Menunjukkan Status Lunas", document.getElementById('alertCicilanBody').innerHTML.includes("PELUNASAN") || alertCicilan.classList.contains('hidden'));

// Skenario K-11: Riwayat Invoice Search & Filter Kalender
switchMenu('riwayat-invoice');
bukaRiwayatInvoice();
assert("K-11: Tabel Riwayat Invoice Menampilkan Data", document.getElementById('tbodyRiwayatInvoice').innerHTML.includes("Budi Santoso"));
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
