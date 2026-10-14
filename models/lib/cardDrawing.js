'use strict';

// #1178: drawing onto a card - handwriting, sketches - saved as both PNG and
// SVG and editable later. The drawing code is the dependency overlay's
// ("Red Strings", #3392): strokes are SVG paths. A drawing is kept on the
// card as its strokes (`drawings`: [{ _id, strokes, width, height,
// pngAttachmentId, updatedAt }]), so it opens again for editing; its PNG is a
// card attachment like any picture, and its SVG is built from the strokes,
// for download, so nothing a member typed ever becomes SVG markup.
// Pure: tests/cardDrawing.test.cjs.

const COLORS = Object.freeze(['#000000', '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#ffffff']);
const WIDTHS = Object.freeze([2, 4, 8, 16]);
const MAX_STROKES = 2000;
const MAX_POINTS = 5000;
const MAX_DRAWINGS = 20;

function num(v, max) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(0, n)) * 10) / 10 : null;
}

// Keep only well-formed strokes: an allowed colour and width, points inside
// the drawing.
function cleanStrokes(input, { width = 800, height = 500 } = {}) {
  const out = [];
  for (const s of (Array.isArray(input) ? input : []).slice(0, MAX_STROKES)) {
    if (!s || !COLORS.includes(s.color) || !WIDTHS.includes(s.width)) continue;
    const points = [];
    for (const p of (Array.isArray(s.points) ? s.points : []).slice(0, MAX_POINTS)) {
      const x = num(p && p[0], width);
      const y = num(p && p[1], height);
      if (x !== null && y !== null) points.push([x, y]);
    }
    if (points.length) out.push({ color: s.color, width: s.width, points });
  }
  return out;
}

function pathData(points) {
  if (points.length === 1) return `M${points[0][0]} ${points[0][1]}l0.1 0`;
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
}

function strokesToSvg(strokes, { width = 800, height = 500 } = {}) {
  const w = num(width, 4000) || 800;
  const h = num(height, 4000) || 500;
  const paths = cleanStrokes(strokes, { width: w, height: h }).map(s =>
    `<path d="${pathData(s.points)}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<rect width="100%" height="100%" fill="#ffffff"/>${paths.join('')}</svg>`;
}

// The card's drawings after saving `drawing` (a new one, or an edit of one).
function drawingsAfterSave(current, drawing) {
  const list = (Array.isArray(current) ? current : []).filter(d => d && d._id !== drawing._id);
  return [...list, drawing].slice(-MAX_DRAWINGS);
}

module.exports = { COLORS, WIDTHS, MAX_DRAWINGS, cleanStrokes, strokesToSvg, drawingsAfterSave };
