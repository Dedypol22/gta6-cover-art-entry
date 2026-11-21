// renderer.js — menggambar cover multi-panel gaya poster GTA 6 ke canvas.
// Murni menggambar: tanpa DOM, tanpa jaringan. Dipakai pratinjau live,
// export PNG, dan mode screenshot (?shot=cover).

export const PANEL_NAMES = ['Hero', 'Panel 2', 'Panel 3'];

export function layoutRects(layout, w, h) {
  const frame = Math.max(10, Math.round(Math.min(w, h) * 0.014));
  const gut = Math.max(6, Math.round(Math.min(w, h) * 0.008));
  const x0 = frame, y0 = frame, x1 = w - frame, y1 = h - frame;
  if (layout === 'duo') {
    const mid = (x0 + x1) / 2;
    return [
      { x: x0, y: y0, w: mid - x0 - gut / 2, h: y1 - y0 },
      { x: mid + gut / 2, y: y0, w: x1 - mid - gut / 2, h: y1 - y0 },
    ];
  }
  if (layout === 'solo') {
    return [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  }
  // Trio: hero besar di atas + 2 panel bawah.
  const heroH = (y1 - y0) * 0.62;
  const mid = (x0 + x1) / 2;
  return [
    { x: x0, y: y0, w: x1 - x0, h: heroH },
    { x: x0, y: y0 + heroH + gut, w: mid - x0 - gut / 2, h: y1 - y0 - heroH - gut },
    { x: mid + gut / 2, y: y0 + heroH + gut, w: x1 - mid - gut / 2, h: y1 - y0 - heroH - gut },
  ];
}

function drawPhotoCover(ctx, img, rect, panel) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = '#241a3a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#8d7fb5';
    ctx.font = `700 ${Math.round(rect.h * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('FOTO BELUM DIPILIH', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const zoom = panel.zoom || 1;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const cx = rect.x + rect.w / 2 + (panel.offsetX || 0) * rect.w * 0.008;
  const cy = rect.y + rect.h / 2 + (panel.offsetY || 0) * rect.h * 0.008;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  // Bayangan bawah tipis agar caption terbaca.
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.55, rect.w, rect.h * 0.45);
  ctx.restore();
}

function applyGrade(ctx, w, h, grade, frame) {
  if (!grade || grade === 'none') return;
  ctx.save();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,122,61,0.20)');
    g.addColorStop(0.5, 'rgba(255,46,136,0.10)');
    g.addColorStop(1, 'rgba(255,210,63,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    const sun = ctx.createRadialGradient(w * 0.72, h * 0.22, 10, w * 0.72, h * 0.22, w * 0.42);
    sun.addColorStop(0, 'rgba(255,214,120,0.30)');
    sun.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(55,230,255,0.16)');
    g.addColorStop(0.55, 'rgba(255,46,136,0.08)');
    g.addColorStop(1, 'rgba(120,60,255,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    // Vignette.
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(4,0,24,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'malam') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(24,16,80,0.34)');
    g.addColorStop(1, 'rgba(8,4,32,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(frame, frame, w - 2 * frame, h - 2 * frame);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.12, 10, w * 0.5, h * 0.12, w * 0.5);
    glow.addColorStop(0, 'rgba(55,230,255,0.22)');
    glow.addColorStop(1, 'rgba(55,230,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function drawCaption(ctx, state, w, h, frame) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (!title && !subtitle) return;
  const scale = w / 1920;
  const size = Math.max(28, (state.titleSize || 96) * scale);
  const atTop = state.titlePosition === 'top';
  // Subjudul selalu di luar badan huruf judul: di bawah judul bila judul di
  // atas, di atas judul (dengan jarak satu tinggi huruf) bila judul di bawah.
  const baseY = atTop ? frame + size * 0.95 : h - frame - size * 0.18;
  const subY = atTop ? baseY + size * 0.48 : baseY - size * 1.08;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (title) {
    ctx.font = `900 ${Math.round(size)}px "Arial Narrow", Impact, "Helvetica Neue", sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = Math.round(size * 0.14);
    ctx.shadowOffsetY = Math.round(size * 0.05);
    ctx.lineWidth = Math.max(4, Math.round(size * 0.09));
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.strokeText(title, w / 2, baseY);
    ctx.fillStyle = state.textColor || '#ffffff';
    ctx.fillText(title, w / 2, baseY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (subtitle) {
    const subSize = Math.max(14, size * 0.26);
    ctx.font = `800 ${Math.round(subSize)}px "Arial Narrow", Impact, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch (_) { /* canvas lama */ }
    ctx.lineWidth = Math.max(3, Math.round(subSize * 0.22));
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.strokeText(subtitle, w / 2, subY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, w / 2, subY);
    try { ctx.letterSpacing = '0px'; } catch (_) { /* abaikan */ }
  }
  ctx.restore();
}

// Gambar cover lengkap ke ctx pada ukuran w x h.
// state: { layout, title, subtitle, titleSize, titlePosition, textColor,
//          grade, compareOriginal, panels: [{zoom, offsetX, offsetY}] }
// images: array HTMLImageElement (atau null) sejajar dengan panel.
export function drawCover(ctx, state, images, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout || 'trio', w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const panel = panels[i] || { zoom: 1, offsetX: 0, offsetY: 0 };
    drawPhotoCover(ctx, images ? images[i] : null, rect, panel);
  });
  // Bingkai luar putih tebal + garis antar panel.
  const frame = Math.max(10, Math.round(Math.min(w, h) * 0.014));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  ctx.lineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.006));
  rects.forEach((rect) => ctx.strokeRect(rect.x, rect.y, rect.w, rect.h));
  if (!state.compareOriginal) applyGrade(ctx, w, h, state.grade || 'sunset', frame);
  drawCaption(ctx, state, w, h, frame);
  return rects;
}
