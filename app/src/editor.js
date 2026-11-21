// editor.js — state + interaksi Leonida Cover Studio.
// Membaca ?shot=cover|editor untuk screenshot headless, memuat foto contoh
// dari app/samples/, dan merender lewat renderer.js. Semua foto dibaca lokal.

import { drawCover, layoutRects, PANEL_NAMES } from './renderer.js';

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const shotCanvas = $('shotCanvas');
const ctx = canvas.getContext('2d');

const SAMPLES = { pier: 'samples/pier.jpg', boulevard: 'samples/boulevard.jpg' };

// Default = keadaan editor untuk screenshot 2 (Trio, Boulevard, Neon).
function defaultPanels(layout) {
  // Foto contoh berbentuk potret/persegi; panel lebar memotong pita tengah
  // foto, jadi offsetY positif menggeser foto ke bawah agar kepala subjek
  // (di bagian atas foto) masuk bingkai — hero close-up, bukan torso tanpa kepala.
  if (layout === 'trio') return [
    { zoom: 1.0, offsetX: 0, offsetY: 80 },
    { zoom: 1.0, offsetX: 0, offsetY: 30 },
    { zoom: 1.0, offsetX: 0, offsetY: 30 },
  ];
  if (layout === 'duo') return [
    { zoom: 1.2, offsetX: 0, offsetY: 40 },
    { zoom: 1.2, offsetX: 0, offsetY: 40 },
  ];
  return [{ zoom: 1.0, offsetX: 0, offsetY: 40 }];
}

const state = {
  layout: 'trio',
  title: 'BOULEVARD QUEEN',
  subtitle: 'VICE CITY \u2022 LEONIDA',
  titleSize: 96,
  titlePosition: 'bottom',
  textColor: '#ffffff',
  grade: 'neon',
  compareOriginal: false,
  exportSize: '1920x1080',
  selectedPanel: 0,
  panels: defaultPanels('trio'),
  photoNames: ['boulevard', 'boulevard', 'boulevard'],
};

const images = [null, null, null];
const cache = new Map();
let currentRects = [];

function loadImage(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

async function setPanelPhoto(index, src, name) {
  const img = await loadImage(src);
  if (img) {
    images[index] = img;
    state.photoNames[index] = name || src;
  }
  render();
}

async function fillAllWith(src, name) {
  const count = layoutRects(state.layout, 1920, 1080).length;
  for (let i = 0; i < count; i++) await setPanelPhoto(i, src, name);
}

function render(target) {
  const c = target || canvas;
  const w = c.width, h = c.height;
  const g = c.getContext('2d');
  currentRects = drawCover(g, state, images, w, h);
  if (!target) {
    const [sw, sh] = state.exportSize.split('x').map(Number);
    $('sizeLabel').textContent = `${sw} \u00d7 ${sh}`;
  }
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.grade === state.grade));
  document.querySelectorAll('.size-btn').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.size === state.exportSize));
  document.querySelectorAll('.panel-btn').forEach((b) =>
    b.classList.toggle('is-active', Number(b.dataset.panel) === state.selectedPanel));
  document.querySelectorAll('.swatch').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.color === state.textColor));
  const p = state.panels[state.selectedPanel] || { zoom: 1, offsetX: 0, offsetY: 0 };
  $('zoomRange').value = p.zoom;
  $('xRange').value = p.offsetX;
  $('yRange').value = p.offsetY;
  $('zoomOut').textContent = `${p.zoom.toFixed(2).replace('.', ',')}\u00d7`;
  $('xOut').textContent = String(p.offsetX);
  $('yOut').textContent = String(p.offsetY);
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('titleSizeRange').value = state.titleSize;
  $('titleSizeOut').textContent = String(state.titleSize);
  $('titlePosSelect').value = state.titlePosition;
  $('compareToggle').checked = state.compareOriginal;
  const name = PANEL_NAMES[state.selectedPanel] || `Panel ${state.selectedPanel + 1}`;
  $('panelLabel').textContent = `Panel terpilih: ${name}${state.layout === 'trio' && state.selectedPanel === 0 ? ' (atas)' : ''}`;
}

function applyLayout(layout) {
  state.layout = layout;
  state.panels = defaultPanels(layout);
  if (state.selectedPanel >= layoutRects(layout, 1920, 1080).length) state.selectedPanel = 0;
  // Isi panel baru dengan foto yang sedang dipakai di panel pertama.
  const first = images[0];
  const rects = layoutRects(layout, 1920, 1080);
  rects.forEach((_, i) => { if (!images[i] && first) images[i] = first; });
  syncControls();
  render();
}

async function exportPNG() {
  const [w, h] = state.exportSize.split('x').map(Number);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), state, images, w, h);
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `leonida-cover-${state.exportSize}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function bindEditor() {
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.addEventListener('click', () => applyLayout(b.dataset.layout)));
  document.querySelectorAll('.grade-btn').forEach((b) =>
    b.addEventListener('click', () => { state.grade = b.dataset.grade; syncControls(); render(); }));
  document.querySelectorAll('.size-btn').forEach((b) =>
    b.addEventListener('click', () => { state.exportSize = b.dataset.size; syncControls(); render(); }));
  document.querySelectorAll('.panel-btn').forEach((b) =>
    b.addEventListener('click', () => { state.selectedPanel = Number(b.dataset.panel); syncControls(); render(); }));
  document.querySelectorAll('.swatch').forEach((b) =>
    b.addEventListener('click', () => { state.textColor = b.dataset.color; syncControls(); render(); }));
  document.querySelectorAll('[data-sample]').forEach((b) =>
    b.addEventListener('click', () => fillAllWith(SAMPLES[b.dataset.sample], b.dataset.sample)));
  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      const img = await loadImage(url);
      if (img) {
        const idx = Math.min(state.selectedPanel + i, images.length - 1);
        images[idx] = img;
        state.photoNames[idx] = files[i].name;
      }
    }
    render();
  });
  $('zoomRange').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].zoom = Number(e.target.value);
    syncControls(); render();
  });
  $('xRange').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].offsetX = Number(e.target.value);
    syncControls(); render();
  });
  $('yRange').addEventListener('input', (e) => {
    state.panels[state.selectedPanel].offsetY = Number(e.target.value);
    syncControls(); render();
  });
  $('resetTransform').addEventListener('click', () => {
    state.panels[state.selectedPanel] = { zoom: 1, offsetX: 0, offsetY: 0 };
    syncControls(); render();
  });
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('titleSizeRange').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value); syncControls(); render();
  });
  $('titlePosSelect').addEventListener('change', (e) => {
    state.titlePosition = e.target.value; render();
  });
  $('compareToggle').addEventListener('change', (e) => {
    state.compareOriginal = e.target.checked; render();
  });
  $('downloadBtn').addEventListener('click', exportPNG);
  $('downloadTop').addEventListener('click', exportPNG);

  // Drag di canvas: geser crop panel yang diklik.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const idx = currentRects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
    if (idx >= 0) {
      state.selectedPanel = idx;
      dragging = { x, y, ox: state.panels[idx].offsetX, oy: state.panels[idx].offsetY, rect: currentRects[idx] };
      canvas.setPointerCapture(e.pointerId);
      syncControls();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const p = state.panels[state.selectedPanel];
    p.offsetX = Math.max(-100, Math.min(100, dragging.ox + ((x - dragging.x) / dragging.rect.w) * 250));
    p.offsetY = Math.max(-100, Math.min(100, dragging.oy + ((y - dragging.y) / dragging.rect.h) * 250));
    syncControls(); render();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
}

// Parameter URL (?shot=...) — nilai tak dikenal diabaikan dengan aman.
function applyQuery() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  const layout = q.get('layout');
  if (layout === 'trio' || layout === 'duo' || layout === 'solo') {
    state.layout = layout;
    state.panels = defaultPanels(layout);
  }
  const photo = q.get('photo');
  if (photo === 'pier' || photo === 'boulevard') {
    state.photoNames = state.photoNames.map(() => photo);
  }
  const caption = q.get('caption');
  if (caption) state.title = caption.slice(0, 28);
  const grade = q.get('grade');
  if (grade === 'sunset' || grade === 'neon' || grade === 'malam') state.grade = grade;
  const size = q.get('size');
  if (/^\d+x\d+$/.test(size || '')) state.exportSize = size;
  return shot;
}

async function init() {
  const shot = applyQuery();
  bindEditor();
  const photo = state.photoNames[0];
  await fillAllWith(SAMPLES[photo] || SAMPLES.boulevard, photo);
  syncControls();
  render();
  if (shot === 'cover') {
    // Mode cover: sembunyikan editor, tampilkan cover memenuhi viewport.
    document.body.classList.add('shot-cover');
    $('coverRoot').hidden = false;
    const [w, h] = state.exportSize.split('x').map(Number);
    shotCanvas.width = w; shotCanvas.height = h;
    drawCover(shotCanvas.getContext('2d'), state, images, w, h);
    document.title = `Cover — ${state.title}`;
  } else {
    // ?shot=editor maupun tanpa parameter: tampilkan editor lengkap.
    document.body.classList.remove('shot-cover');
    $('coverRoot').hidden = true;
    render();
  }
  window.__leonidaReady = true;
}

init();
