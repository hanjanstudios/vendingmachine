/* ============================================================
   Pick a Can — low-poly vending machine
   Can/button data, responsive stage scaling, dispense animation.
   No build step, no external JS.

   NOTE: swap every url: '#' below for the real destination once
   you have it. Everything else (flavor names, colors, order) can
   be edited here without touching the HTML/CSS.
   ============================================================ */

const CANS = [
  {
    id: 'cherry',
    name: 'Cherry Bliss',
    tool: 'ArtForge',
    main: '#ff4d6d', light: '#ff9db0', dark: '#c62b48',
    url: '#',
  },
  {
    id: 'lime',
    name: 'Lime Rush',
    tool: 'ArtLab',
    main: '#7ed957', light: '#c1f2a8', dark: '#4c9a2a',
    url: '#',
  },
  {
    id: 'grape',
    name: 'Grape Static',
    tool: 'Coloring Book Spacer',
    main: '#8c52ff', light: '#c6a8ff', dark: '#5e28c2',
    url: '#',
  },
  {
    id: 'razz',
    name: 'Blue Razz',
    tool: 'Realtor AI',
    main: '#3fa9ff', light: '#a3d9ff', dark: '#1f6fb8',
    url: '#',
  },
  {
    id: 'sunny',
    name: 'Sunny Crush',
    tool: 'Blog',
    main: '#ffb443', light: '#ffdca0', dark: '#d98a1a',
    url: 'https://hannahjanicke.com',
  },
];

function canGradient(c) {
  return `linear-gradient(100deg, ${c.light} 0%, ${c.light} 16%, ${c.main} 16%, ${c.main} 78%, ${c.dark} 78%, ${c.dark} 100%)`;
}

/* ---------- Build windows, buttons + code labels ---------- */
const cansRow = document.getElementById('cansRow');
const buttonRow = document.getElementById('buttonRow');
const codeRow = document.getElementById('codeRow');
const canEls = {};
const btnEls = {};

CANS.forEach((c, i) => {
  const win = document.createElement('div');
  win.className = 'window';

  const can = document.createElement('div');
  can.className = 'can';
  can.id = `can-${c.id}`;
  can.style.background = canGradient(c);
  can.setAttribute('aria-hidden', 'true');
  win.appendChild(can);
  cansRow.appendChild(win);
  canEls[c.id] = can;

  const btn = document.createElement('button');
  btn.className = 'btn-can';
  btn.type = 'button';
  btn.style.setProperty('--main', c.main);
  btn.style.setProperty('--dark', c.dark);
  btn.setAttribute('aria-label', `Get a ${c.name} can — links to ${c.tool}`);
  btn.addEventListener('pointerenter', () => highlightCan(c.id, c.light));
  btn.addEventListener('pointerleave', () => unhighlightCan(c.id));
  btn.addEventListener('focus', () => highlightCan(c.id, c.light));
  btn.addEventListener('blur', () => unhighlightCan(c.id));
  btn.addEventListener('click', () => dispense(c));
  buttonRow.appendChild(btn);
  btnEls[c.id] = btn;

  const code = document.createElement('span');
  code.className = 'code-chip';
  code.textContent = `B${i + 1}`;
  codeRow.appendChild(code);
});

function highlightCan(id, glow) {
  const can = canEls[id];
  can.classList.add('is-highlight');
  can.style.setProperty('--glow', glow);
}
function unhighlightCan(id) {
  canEls[id].classList.remove('is-highlight');
}

/* ---------- Dispense flow ---------- */
const stage = document.getElementById('stage');
const fallingCan = document.getElementById('fallingCan');
const tray = document.getElementById('tray');
const trayHint = document.getElementById('trayHint');
const trayChip = document.getElementById('trayChip');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let busy = false;

function dispense(c) {
  if (busy) return;
  busy = true;
  Object.values(btnEls).forEach((b) => (b.disabled = true));

  const btn = btnEls[c.id];
  btn.classList.add('is-pressed');
  setTimeout(() => btn.classList.remove('is-pressed'), 160);

  const can = canEls[c.id];
  can.classList.add('is-dispensed');

  if (reducedMotion) {
    finishDispense(c);
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const canRect = can.getBoundingClientRect();
  const trayRect = tray.getBoundingClientRect();
  const scale = stageRect.width / stage.offsetWidth || 1;

  const startLeft = (canRect.left - stageRect.left) / scale;
  const startTop = (canRect.top - stageRect.top) / scale;
  const endLeft = (trayRect.left - stageRect.left) / scale + trayRect.width / scale / 2 - 28;
  const endTop = (trayRect.top - stageRect.top) / scale + 4;

  fallingCan.style.background = canGradient(c);
  fallingCan.style.left = `${startLeft}px`;
  fallingCan.style.top = `${startTop}px`;
  fallingCan.style.transform = 'rotate(0deg)';
  fallingCan.style.opacity = '1';
  fallingCan.hidden = false;

  requestAnimationFrame(() => {
    fallingCan.style.transition = 'top 0.6s cubic-bezier(.4,0,.7,1), left 0.6s cubic-bezier(.4,0,.7,1), transform 0.6s ease-out';
    fallingCan.style.left = `${endLeft}px`;
    fallingCan.style.top = `${endTop}px`;
    fallingCan.style.transform = 'rotate(340deg)';
  });

  setTimeout(() => {
    fallingCan.style.transition = 'opacity 0.25s';
    fallingCan.style.opacity = '0';
    setTimeout(() => {
      fallingCan.hidden = true;
      finishDispense(c);
    }, 250);
  }, 620);
}

function finishDispense(c) {
  trayHint.hidden = true;
  trayChip.hidden = false;
  trayChip.href = c.url;
  trayChip.textContent = `🥤 ${c.name} — tap to open →`;
  trayChip.style.animation = 'none';
  requestAnimationFrame(() => { trayChip.style.animation = ''; });

  Object.values(btnEls).forEach((b) => (b.disabled = false));
  busy = false;
}

/* ---------- Confetti ---------- */
const confettiWrap = document.getElementById('confetti');
const confettiColors = ['#ff8fa3', '#8ff5e8', '#ffd58a', '#c6a8ff', '#a3d9ff'];
for (let i = 0; i < 14; i++) {
  const el = document.createElement('div');
  const isTri = i % 2 === 0;
  el.className = `confetto ${isTri ? 'tri' : 'dot'}`;
  el.style.left = `${Math.random() * 100}%`;
  el.style.top = `${Math.random() * 70 + 5}%`;
  el.style.setProperty('--c', confettiColors[i % confettiColors.length]);
  el.style.setProperty('--dur', `${5 + Math.random() * 5}s`);
  el.style.setProperty('--delay', `${Math.random() * 4}s`);
  confettiWrap.appendChild(el);
}

/* ---------- Droplets ---------- */
const dropletsWrap = document.getElementById('droplets');
for (let i = 0; i < 22; i++) {
  const el = document.createElement('div');
  el.className = 'droplet';
  const size = 3 + Math.random() * 7;
  el.style.width = `${size}px`;
  el.style.height = `${size * (1.2 + Math.random() * 0.6)}px`;
  el.style.left = `${Math.random() * 96}%`;
  el.style.top = `${Math.random() * 96}%`;
  el.style.opacity = `${0.3 + Math.random() * 0.4}`;
  dropletsWrap.appendChild(el);
}

/* ---------- Responsive stage scaling ---------- */
const sceneWrap = document.getElementById('sceneWrap');
const STAGE_W = 540;
const STAGE_H = 980;

function fitStage() {
  const available = Math.min(sceneWrap.clientWidth - 20, STAGE_W);
  const scale = Math.max(0.5, Math.min(1, available / STAGE_W));
  stage.style.setProperty('--scale', scale);
  sceneWrap.style.height = `${STAGE_H * scale + 20}px`;
}

window.addEventListener('resize', fitStage);
fitStage();

document.getElementById('year').textContent = new Date().getFullYear();
