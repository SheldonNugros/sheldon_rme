with open('src/frontend/PembayaranJS.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update onInputDatalistChange to store data-kode and data-stok
old_onInput = '''  function onInputDatalistChange(el, type) {
    let val = el.value, obj = null;
    if (type === 'tindakan') obj = window.KlinikData.tindakan.find(x => x.nama === val);
    else if (type === 'obat') obj = window.KlinikData.obat.find(x => x.nama === val);
    else if (type === 'bmhp') obj = window.KlinikData.bmhp.find(x => x.nama === val);


    let row = el.closest('tr');
    if (obj) { row.querySelector('.val-harga').value = formatRpKSR(obj.harga); } else { row.querySelector('.val-harga').value = '0'; }
    hitungRowKSR(row, type);
  }'''

new_onInput = '''  function onInputDatalistChange(el, type) {
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
  }'''

assert old_onInput in c, 'old_onInput not found'
c = c.replace(old_onInput, new_onInput)

# 2. Update hitungRowKSR to check max stock
old_hitungRow = '''  function hitungRowKSR(row, type) {
    let hrg = parseUangKSR(row.querySelector('.val-harga').value);
    let qty = parseInt(row.querySelector('.val-qty').value) || 0;
    let disc = parseFloat(row.querySelector('.val-disc').value) || 0;
    if (disc > 100) { disc = 100; row.querySelector('.val-disc').value = 100; }
   
    let total = hrg * qty;
    let grand = total - (total * (disc / 100)); // Labor diabaikan dari rumus total
    row.querySelector('.val-grand').value = grand === 0 ? '0' : formatRpKSR(grand);
    hitungGrandTotalSemua();
  }'''

new_hitungRow = '''  function hitungRowKSR(row, type) {
    let hrg = parseUangKSR(row.querySelector('.val-harga').value);
    let qtyInput = row.querySelector('.val-qty');
    let qty = parseInt(qtyInput.value) || 0;
    let disc = parseFloat(row.querySelector('.val-disc').value) || 0;
    if (disc > 100) { disc = 100; row.querySelector('.val-disc').value = 100; }

    if (type === 'obat' || type === 'bmhp') {
      let inpNama = row.querySelector('.val-nama');
      let maxStok = parseFloat(inpNama.getAttribute('data-stok'));
      if (!isNaN(maxStok) && qty > maxStok) {
        if (typeof showToast === 'function') {
          showToast('warning', 'Perhatian: Qty melebihi stok yang tersedia (' + maxStok + ')!');
        }
        qtyInput.classList.add('border-rose-500', 'bg-rose-50');
      } else {
        qtyInput.classList.remove('border-rose-500', 'bg-rose-50');
      }
    }
   
    let total = hrg * qty;
    let grand = total - (total * (disc / 100)); // Labor diabaikan dari rumus total
    row.querySelector('.val-grand').value = grand === 0 ? '0' : formatRpKSR(grand);
    hitungGrandTotalSemua();
  }'''

assert old_hitungRow in c, 'old_hitungRow not found'
c = c.replace(old_hitungRow, new_hitungRow)

# 3. Update addKasirObat and addKasirBMHP to include val-stok-label
old_addObat = '''  function addKasirObat() {
    let tb = document.getElementById('ksrTbodyObat');
    let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-obat";
    tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlObatKasir" onchange="onInputDatalistChange(this, 'obat')" placeholder="Ketik/Cari Obat..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-right font-black text-emerald-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
    tb.appendChild(tr);
  }'''

new_addObat = '''  function addKasirObat() {
    let tb = document.getElementById('ksrTbodyObat');
    let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-obat";
    tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlObatKasir" onchange="onInputDatalistChange(this, 'obat')" placeholder="Ketik/Cari Obat..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-emerald-500"><span class="val-stok-label text-[9px] text-slate-400 block mt-0.5"></span></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'obat')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-emerald-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-right font-black text-emerald-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
    tb.appendChild(tr);
  }'''

assert old_addObat in c, 'old_addObat not found'
c = c.replace(old_addObat, new_addObat)

old_addBmhp = '''  function addKasirBMHP() {
    let tb = document.getElementById('ksrTbodyBMHP');
    let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-bmhp";
    tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlBMHPKasir" onchange="onInputDatalistChange(this, 'bmhp')" placeholder="Ketik/Cari BMHP..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-right font-black text-amber-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
    tb.appendChild(tr);
  }'''

new_addBmhp = '''  function addKasirBMHP() {
    let tb = document.getElementById('ksrTbodyBMHP');
    let tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 border-b border-slate-100 row-bmhp";
    tr.innerHTML = `<td class="p-1.5"><input type="text" list="dlBMHPKasir" onchange="onInputDatalistChange(this, 'bmhp')" placeholder="Ketik/Cari BMHP..." class="val-nama w-full px-2 py-1.5 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-amber-500"><span class="val-stok-label text-[9px] text-slate-400 block mt-0.5"></span></td><td class="p-1.5"><input type="text" readonly class="val-harga w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600 outline-none" value="0"></td><td class="p-1.5"><input type="text" maxlength="2" value="1" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-qty w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" maxlength="3" value="0" oninput="this.value=this.value.replace(/[^0-9]/g,''); hitungRowKSR(this.closest('tr'), 'bmhp')" class="val-disc w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-center outline-none focus:ring-1 focus:ring-amber-500"></td><td class="p-1.5"><input type="text" readonly class="val-grand w-full px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-right font-black text-amber-700 outline-none" value="0"></td><td class="p-1.5 text-center"><button type="button" onclick="this.closest('tr').remove(); hitungGrandTotalSemua();" class="w-7 h-7 bg-rose-100 text-rose-600 rounded font-black hover:bg-rose-200">X</button></td>`;
    tb.appendChild(tr);
  }'''

assert old_addBmhp in c, 'old_addBmhp not found'
c = c.replace(old_addBmhp, new_addBmhp)

# 4. Update simpanBillingFinal to extract kode and check stock
old_simpan_loop = '''    let tTindakan = []; document.querySelectorAll('.row-tindakan').forEach(tr => { let n = tr.querySelector('.val-nama').value; if(n){ tTindakan.push({ nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, labor: parseUangKSR(tr.querySelector('.val-labor').value), diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value), perawat: tr.querySelector('.val-perawat').value }); } else { errTbl = true; } });
    let tObat = []; document.querySelectorAll('.row-obat').forEach(tr => { let n = tr.querySelector('.val-nama').value; if(n){ tObat.push({ nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value) }); } else { errTbl = true; } });
    let tBMHP = []; document.querySelectorAll('.row-bmhp').forEach(tr => { let n = tr.querySelector('.val-nama').value; if(n){ tBMHP.push({ nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value) }); } else { errTbl = true; } });'''

new_simpan_loop = '''    let tTindakan = []; document.querySelectorAll('.row-tindakan').forEach(tr => {
      let inp = tr.querySelector('.val-nama');
      let n = inp.value;
      if(n){
        let kd = inp.getAttribute('data-kode') || '';
        tTindakan.push({ kode: kd, nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, labor: parseUangKSR(tr.querySelector('.val-labor').value), diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value), perawat: tr.querySelector('.val-perawat').value });
      } else { errTbl = true; }
    });
    let tObat = []; document.querySelectorAll('.row-obat').forEach(tr => {
      let inp = tr.querySelector('.val-nama');
      let n = inp.value;
      if(n){
        let kd = inp.getAttribute('data-kode') || '';
        tObat.push({ kode: kd, nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value) });
      } else { errTbl = true; }
    });
    let tBMHP = []; document.querySelectorAll('.row-bmhp').forEach(tr => {
      let inp = tr.querySelector('.val-nama');
      let n = inp.value;
      if(n){
        let kd = inp.getAttribute('data-kode') || '';
        tBMHP.push({ kode: kd, nama: n, harga: parseUangKSR(tr.querySelector('.val-harga').value), qty: tr.querySelector('.val-qty').value, diskon: tr.querySelector('.val-disc').value, grandTotal: parseUangKSR(tr.querySelector('.val-grand').value) });
      } else { errTbl = true; }
    });'''

assert old_simpan_loop in c, 'old_simpan_loop not found'
c = c.replace(old_simpan_loop, new_simpan_loop)

# 5. Update datalist rendering to include stock info in label/value
old_dl_init = '''    let dlObat = document.getElementById('dlObatKasir'); if(dlObat) dlObat.innerHTML = window.KlinikData.obat.map(o => `<option value="${o.nama}">`).join('');
    let dlBMHP = document.getElementById('dlBMHPKasir'); if(dlBMHP) dlBMHP.innerHTML = window.KlinikData.bmhp.map(b => `<option value="${b.nama}">`).join('');'''

new_dl_init = '''    let dlObat = document.getElementById('dlObatKasir'); if(dlObat) dlObat.innerHTML = (window.KlinikData.obat || []).map(o => `<option value="${o.nama}">${o.nama} (Stok: ${o.stok !== undefined ? o.stok : 0} ${o.satuan || 'Pcs'})</option>`).join('');
    let dlBMHP = document.getElementById('dlBMHPKasir'); if(dlBMHP) dlBMHP.innerHTML = (window.KlinikData.bmhp || []).map(b => `<option value="${b.nama}">${b.nama} (Stok: ${b.stok !== undefined ? b.stok : 0} ${b.satuan || 'Unit'})</option>`).join('');'''

assert old_dl_init in c, 'old_dl_init not found'
c = c.replace(old_dl_init, new_dl_init)

with open('src/frontend/PembayaranJS.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('Updated PembayaranJS.html successfully')
