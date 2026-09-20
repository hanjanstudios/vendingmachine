/* ============================================================
   Hannah Janicke — vending machine
   Type a code (A1–A6), press OK — the can drops into the tray.
   Click the can in the tray to open its link.
   No build step, no external JS.
   ============================================================ */

const ITEMS = [
  { code: 'A1', label: 'BLOG', color: '#d9362c', ink: '#fff', url: 'https://hannahjanicke.com' },
  { code: 'A2', label: 'TOOL', color: '#2f6fb3', ink: '#fff', url: 'https://tool.hannahjanicke.com' },
  { code: 'A3', label: 'ARTLAB', color: '#e8842a', ink: '#fff', url: 'https://artlab.hannahjanicke.com' },
  { code: 'A4', label: 'REALTY', color: '#2f7d4f', ink: '#fff', url: 'https://realty.hannahjanicke.com' },
  { code: 'A5', label: 'PDFSPACE', color: '#7c3fa1', ink: '#fff', url: 'http://pdfspace.hannahjanicke.com' },
  { code: 'A6', label: 'ARTFORGE', color: '#e0b93c', ink: '#1c1c1c', url: 'https://artforge-hannah-5d0e.vercel.app' },
];

const KEYS = ['A', 'B', 'C', '1', '2', '3', '4', '5', '6', '⌫', '0', 'OK'];

const cansGrid = document.getElementById('cansGrid');
const keypad = document.getElementById('keypad');
const menuList = document.getElementById('menuList');
const lcd = document.getElementById('lcd');
const statusStrip = document.getElementById('statusStrip');
const tray = document.querySelector('.tray');
const trayLabel = document.getElementById('trayLabel');
const trayCanWrap = document.getElementById('trayCanWrap');
const trayCan = document.getElementById('trayCan');

const cellByCode = {};
let buffer = '';
let busy = false;
let currentTrayItem = null;
let lcdRevertTimer = null;
let statusRevertTimer = null;
let defaultStatusText = 'enter code to dispense';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Build cans ---------- */
ITEMS.forEach((item) => {
  const cell = document.createElement('div');
  cell.className = 'can-cell';
  cell.dataset.code = item.code;

  const can = document.createElement('span');
  can.className = 'can';
  can.style.setProperty('--can', item.color);
  can.style.setProperty('--can-ink', item.ink);

  const cap = document.createElement('span');
  cap.className = 'can-cap';
  can.appendChild(cap);

  const label = document.createElement('span');
  label.className = 'can-label';
  label.textContent = item.label;
  can.appendChild(label);

  const code = document.createElement('span');
  code.className = 'can-code';
  code.textContent = item.code;

  cell.appendChild(can);
  cell.appendChild(code);
  cell.addEventListener('click', () => nudgeForCode(cell));
  cansGrid.appendChild(cell);
  cellByCode[item.code] = cell;
});

/* ---------- Build menu ---------- */
ITEMS.forEach((item) => {
  const li = document.createElement('li');
  const swatch = document.createElement('span');
  swatch.className = 'menu-swatch';
  swatch.style.background = item.color;
  const code = document.createElement('span');
  code.className = 'menu-code';
  code.textContent = item.code;
  const label = document.createElement('span');
  label.textContent = item.label;
  li.append(swatch, code, label);
  menuList.appendChild(li);
});

/* ---------- Build keypad ---------- */
KEYS.forEach((k) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'key';
  if (k === 'OK') btn.classList.add('key-ok');
  if (k === '⌫') btn.classList.add('key-back');
  btn.textContent = k;
  btn.setAttribute('aria-label', k === '⌫' ? 'Backspace' : k === 'OK' ? 'Submit code' : `Key ${k}`);
  btn.addEventListener('click', () => onKey(k, btn));
  keypad.appendChild(btn);
});

function onKey(k, btn) {
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), 120);

  if (k === '⌫') {
    buffer = buffer.slice(0, -1);
    renderLcd();
    return;
  }
  if (k === 'OK') {
    submitCode();
    return;
  }
  if (buffer.length < 2) {
    buffer += k;
    renderLcd();
  }
}

function setStatus(text) {
  clearTimeout(statusRevertTimer);
  defaultStatusText = text;
  statusStrip.classList.remove('is-invalid');
  statusStrip.textContent = text;
}

function nudgeForCode(cell) {
  clearTimeout(statusRevertTimer);
  statusStrip.classList.add('is-invalid');
  statusStrip.textContent = 'please enter code';

  cell.classList.add('is-shake');
  setTimeout(() => cell.classList.remove('is-shake'), 320);

  statusRevertTimer = setTimeout(() => {
    statusStrip.classList.remove('is-invalid');
    statusStrip.textContent = defaultStatusText;
  }, 1600);
}

function renderLcd() {
  clearTimeout(lcdRevertTimer);
  lcd.classList.remove('is-invalid');
  lcd.textContent = buffer || 'INSERT CODE';
}

function flashLcd(text, opts = {}) {
  clearTimeout(lcdRevertTimer);
  lcd.textContent = text;
  lcd.classList.toggle('is-invalid', !!opts.invalid);
  lcdRevertTimer = setTimeout(() => {
    lcd.classList.remove('is-invalid');
    renderLcd();
  }, opts.duration || 1400);
}

function submitCode() {
  if (busy) return;
  if (!buffer) return;
  const item = ITEMS.find((i) => i.code === buffer.toUpperCase());
  buffer = '';
  if (!item) {
    flashLcd('INVALID CODE', { invalid: true });
    return;
  }
  dropIntoTray(item);
}

function dropIntoTray(item) {
  const cell = cellByCode[item.code];
  flashLcd(`${item.code} DISPENSING`, { duration: 1800 });
  setStatus(`${item.label} is dropping…`);

  if (reducedMotion) {
    placeInTray(item);
    return;
  }

  busy = true;
  cell.classList.add('is-launching');

  const canEl = cell.querySelector('.can');
  const startRect = canEl.getBoundingClientRect();
  const trayRect = tray.getBoundingClientRect();

  const flying = document.createElement('div');
  flying.className = 'flying-can';
  flying.style.background = item.color;
  flying.style.width = `${startRect.width}px`;
  flying.style.height = `${startRect.height}px`;
  flying.style.left = `${startRect.left}px`;
  flying.style.top = `${startRect.top}px`;
  flying.style.transform = 'rotate(0deg)';
  document.body.appendChild(flying);

  const endLeft = trayRect.left + trayRect.width / 2 - startRect.width / 2;
  const endTop = trayRect.top + trayRect.height / 2 - startRect.height / 2;

  requestAnimationFrame(() => {
    flying.style.transition = 'left 0.55s cubic-bezier(.4,0,.7,1), top 0.55s cubic-bezier(.4,0,.7,1), transform 0.55s ease-out, opacity 0.15s 0.4s';
    flying.style.left = `${endLeft}px`;
    flying.style.top = `${endTop}px`;
    flying.style.transform = 'rotate(320deg)';
    flying.style.opacity = '0';
  });

  setTimeout(() => {
    flying.remove();
    cell.classList.remove('is-launching');
    placeInTray(item);
    busy = false;
  }, 560);
}

function placeInTray(item) {
  currentTrayItem = item;
  trayLabel.hidden = true;
  trayCanWrap.hidden = false;
  trayCanWrap.style.animation = 'none';
  requestAnimationFrame(() => { trayCanWrap.style.animation = ''; });

  trayCan.style.setProperty('--can', item.color);
  trayCan.style.setProperty('--can-ink', item.ink);
  trayCan.dataset.label = item.label;
  trayCan.href = item.url || '#';
  trayCan.setAttribute('aria-label', `Open ${item.label}`);

  renderLcd();
  setStatus(`${item.label} in the tray — click it →`);
}

trayCan.addEventListener('click', (e) => {
  if (!currentTrayItem) {
    e.preventDefault();
    return;
  }
  if (!currentTrayItem.url || currentTrayItem.url === '#') {
    e.preventDefault();
    flashLcd('LINK COMING SOON', { invalid: true, duration: 1600 });
    return;
  }
  trayCan.classList.add('is-clicked');
  setTimeout(() => trayCan.classList.remove('is-clicked'), 200);
});

/* ---------- Physical keyboard passthrough ---------- */
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if (['A', 'B', 'C', '0', '1', '2', '3', '4', '5', '6'].includes(k)) {
    onKey(k);
  } else if (e.key === 'Backspace') {
    onKey('⌫');
  } else if (e.key === 'Enter') {
    onKey('OK');
  }
});

renderLcd();
