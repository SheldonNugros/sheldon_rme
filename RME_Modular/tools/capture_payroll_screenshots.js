const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/nugros/.gemini/antigravity/brain/b24fe73f-91aa-4cbf-b11b-30a65e096bd5';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;
const INDEX_URL = `file://${path.resolve(__dirname, '../../index.html')}`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Launching Headless Chrome on port', PORT);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,960',
    INDEX_URL
  ]);

  chrome.stderr.on('data', d => {});
  chrome.stdout.on('data', d => {});

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        wsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    chrome.kill();
    process.exit(1);
  }

  console.log('Connected to CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(resolve => ws.onopen = resolve);

  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');
  await sendCommand('Runtime.enable');

  await sleep(1500);

  // 1. Bypass login & activate session, switch to Payroll Tab 1
  console.log('Activating session and navigating to Payroll Tab 1...');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        localStorage.setItem("sheldon_user_session", JSON.stringify({
          username: "superadmin",
          namaAccount: "drg. V. Asung Nugroho, Sp.Ort",
          role: "Super User"
        }));
        window.activeAccount = "superadmin";
        window.activeNamaAccount = "drg. V. Asung Nugroho, Sp.Ort";
        window.activeUserRole = "Super User";

        let loginScr = document.getElementById('loginScreen');
        if (loginScr) loginScr.classList.add('hidden');
        let appCont = document.getElementById('appContainer');
        if (appCont) appCont.classList.remove('hidden');

        if (typeof switchMenu === 'function') switchMenu('payroll');
        if (typeof initPayrollModule === 'function') initPayrollModule();
        if (typeof switchPayrollTab === 'function') switchPayrollTab('dokter');
        if (typeof renderAllPayrollTables === 'function') renderAllPayrollTables();
      })()
    `
  });

  await sleep(1500);

  // Highlight tombol Tab 1
  await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        let btn = document.querySelector("#panelPay-dokter button[onclick*='switchPayrollTab']");
        if (btn) {
          btn.style.outline = "4px solid #ef4444";
          btn.style.outlineOffset = "4px";
          btn.style.boxShadow = "0 0 25px rgba(239, 68, 68, 0.8)";
          btn.style.transform = "scale(1.08)";
          btn.style.transition = "all 0.3s ease";
          
          let badge = document.createElement("div");
          badge.id = "highlightBadge1";
          badge.innerHTML = "👇 <b>TOMBOL INI:</b> [⚙️ Atur / Tambah Tarif Shift]";
          badge.style.position = "absolute";
          badge.style.background = "#ef4444";
          badge.style.color = "#ffffff";
          badge.style.padding = "8px 16px";
          badge.style.borderRadius = "12px";
          badge.style.fontSize = "13px";
          badge.style.fontWeight = "bold";
          badge.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
          badge.style.zIndex = "99999";
          let rect = btn.getBoundingClientRect();
          badge.style.top = (window.scrollY + rect.top - 46) + "px";
          badge.style.left = (window.scrollX + rect.left - 30) + "px";
          document.body.appendChild(badge);
        }
      })()
    `
  });

  await sleep(500);

  // Capture Screenshot 1
  console.log('Capturing Screenshot 1 (Tab 1 Penggajian)...');
  const snap1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const file1 = path.join(ARTIFACT_DIR, 'screenshot_tombol_payroll_tab1.png');
  fs.writeFileSync(file1, Buffer.from(snap1.result.data, 'base64'));
  console.log('Saved Screenshot 1 to:', file1);

  // 2. Switch to Tab 4 (Pengaturan Tarif Shift & Gaji)
  console.log('Switching to Tab 4 (Pengaturan Tarif Shift)...');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        let oldBadge = document.getElementById("highlightBadge1");
        if (oldBadge) oldBadge.remove();

        if (typeof switchPayrollTab === 'function') switchPayrollTab('tarif');

        let formCard = document.getElementById('cardFormTarifShift');
        if (formCard) {
          formCard.style.outline = "4px solid #4f46e5";
          formCard.style.outlineOffset = "4px";
          formCard.style.boxShadow = "0 0 25px rgba(79, 70, 229, 0.4)";
        }

        let newBadgeForm = document.createElement("div");
        newBadgeForm.innerHTML = "📌 <b>FORM INPUT DI SINI:</b> Form Lengkap Atur Tarif Shift, Role Otomatis, & ID Aturan";
        newBadgeForm.style.background = "#4f46e5";
        newBadgeForm.style.color = "#ffffff";
        newBadgeForm.style.padding = "8px 14px";
        newBadgeForm.style.borderRadius = "8px";
        newBadgeForm.style.fontSize = "11px";
        newBadgeForm.style.fontWeight = "bold";
        newBadgeForm.style.marginBottom = "12px";
        if (formCard) formCard.insertBefore(newBadgeForm, formCard.firstChild);

        let btnNew = document.querySelector("#panelPay-tarif button[onclick*='resetFormTarifShiftBaru']");
        if (btnNew) {
          btnNew.style.outline = "4px solid #10b981";
          btnNew.style.outlineOffset = "4px";
          btnNew.style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.8)";
          btnNew.style.transform = "scale(1.08)";

          let badgeBtn = document.createElement("div");
          badgeBtn.innerHTML = "👇 <b>TOMBOL INI:</b> [➕ Input Tarif Shift Baru]";
          badgeBtn.style.position = "absolute";
          badgeBtn.style.background = "#10b981";
          badgeBtn.style.color = "#ffffff";
          badgeBtn.style.padding = "8px 16px";
          badgeBtn.style.borderRadius = "12px";
          badgeBtn.style.fontSize = "13px";
          badgeBtn.style.fontWeight = "bold";
          badgeBtn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
          badgeBtn.style.zIndex = "99999";
          let rect2 = btnNew.getBoundingClientRect();
          badgeBtn.style.top = (window.scrollY + rect2.top - 46) + "px";
          badgeBtn.style.left = (window.scrollX + rect2.left - 40) + "px";
          document.body.appendChild(badgeBtn);
        }
      })()
    `
  });

  await sleep(600);

  // Capture Screenshot 2
  console.log('Capturing Screenshot 2 (Tab 4 Form & Button)...');
  const snap2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const file2 = path.join(ARTIFACT_DIR, 'screenshot_form_dan_tombol_tab4.png');
  fs.writeFileSync(file2, Buffer.from(snap2.result.data, 'base64'));
  console.log('Saved Screenshot 2 to:', file2);

  chrome.kill();
  console.log('Done capturing screenshots!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
