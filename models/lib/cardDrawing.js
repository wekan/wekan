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

const GROUP_ID = /^[A-Za-z0-9_-]{1,40}$/;

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
    if (!points.length) continue;
    const stroke = { color: s.color, width: s.width, points };
    // #6802: lines grouped with the lasso move, resize and stack together.
    if (typeof s.group === 'string' && GROUP_ID.test(s.group)) stroke.group = s.group;
    out.push(stroke);
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

// The whiteboard (docs/Features/Cards/Whiteboard.md): one line at a time,
// each with its own id and its author, so several people add lines to the
// same drawing at once and each can undo or clear only their own.
const ID = /^[A-Za-z0-9_-]{1,40}$/;

function whiteboardStroke(input, userId, { width = 800, height = 500 } = {}) {
  if (!input || typeof userId !== 'string' || !ID.test(String(input._id || ''))) return null;
  const [clean] = cleanStrokes([input], { width, height });
  return clean ? { _id: input._id, userId, ...clean } : null;
}

// The id of `userId`'s last line, for Undo.
function lastStrokeOf(strokes, userId) {
  const own = (Array.isArray(strokes) ? strokes : []).filter(s => s && s.userId === userId && s._id);
  return own.length ? own[own.length - 1]._id : null;
}

// #6802: the eraser takes away every line that passes within `radius` of a
// point - measured to the line's segments, its own width included - and leaves
// the rest as they are.
function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function strokeTouches(stroke, point, radius) {
  const pts = (stroke && stroke.points) || [];
  const reach = radius + (Number(stroke && stroke.width) || 0) / 2;
  if (pts.length === 1) return Math.hypot(point[0] - pts[0][0], point[1] - pts[0][1]) <= reach;
  for (let i = 1; i < pts.length; i += 1) {
    if (segmentDistance(point, pts[i - 1], pts[i]) <= reach) return true;
  }
  return false;
}

function eraseAt(strokes, point, radius = 10) {
  return (Array.isArray(strokes) ? strokes : []).filter(s => !strokeTouches(s, point, radius));
}

// #6802, palm rejection: once a pen has drawn, a touch does not - the hand
// resting on a tablet leaves no marks - and while one pointer draws, no other
// pointer starts a second line. A mouse always draws.
function pointerDraws({ pointerType, pointerId } = {}, state = {}) {
  if (state.activePointerId !== undefined && state.activePointerId !== null && pointerId !== state.activePointerId) {
    return false;
  }
  if (pointerType === 'touch' && state.penSeen) return false;
  return true;
}

// #6802, the lasso: a loop drawn around lines selects them, and what is
// selected moves, resizes, groups and changes layer together. A selection is
// a sorted list of indexes into the strokes, which are drawn in order - the
// last one on top.

// Whether a point is inside a polygon (even-odd rule).
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Every line inside the loop is selected - all of its points - and a line
// that is part of a group brings the whole group with it.
function lassoSelect(strokes, loop) {
  const list = Array.isArray(strokes) ? strokes : [];
  if (!Array.isArray(loop) || loop.length < 3) return [];
  const picked = [];
  list.forEach((s, i) => {
    const pts = (s && s.points) || [];
    if (pts.length && pts.every(p => pointInPolygon(p, loop))) picked.push(i);
  });
  return withGroups(list, picked);
}

// The selection with every line of each group it touches.
function withGroups(strokes, indexes) {
  const list = Array.isArray(strokes) ? strokes : [];
  const set = new Set((indexes || []).filter(i => Number.isInteger(i) && i >= 0 && i < list.length));
  const groups = new Set([...set].map(i => list[i].group).filter(Boolean));
  list.forEach((s, i) => { if (s.group && groups.has(s.group)) set.add(i); });
  return [...set].sort((a, b) => a - b);
}

// The bounding box of the selected lines, their width included.
function selectionBounds(strokes, indexes) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const i of indexes || []) {
    const s = strokes[i];
    if (!s) continue;
    const r = (Number(s.width) || 0) / 2;
    for (const [x, y] of s.points) {
      x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r);
      x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r);
    }
  }
  if (x0 === Infinity) return null;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

const round1 = v => Math.round(v * 10) / 10;

// The points' own box, without the line width: what must stay in the drawing.
function pointBounds(strokes, indexes) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const i of indexes || []) {
    for (const [x, y] of (strokes[i] && strokes[i].points) || []) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}

// The selected lines moved by (dx, dy), as far as the drawing allows: the
// selection stops at the edge, keeping its shape.
function moveStrokes(strokes, indexes, dx, dy, { width = 800, height = 500 } = {}) {
  const list = Array.isArray(strokes) ? strokes : [];
  const b = pointBounds(list, indexes);
  if (!b) return list;
  const mx = Math.min(width - b.x1, Math.max(-b.x0, Number(dx) || 0));
  const my = Math.min(height - b.y1, Math.max(-b.y0, Number(dy) || 0));
  const sel = new Set(indexes);
  return list.map((s, i) => (sel.has(i)
    ? { ...s, points: s.points.map(([x, y]) => [round1(x + mx), round1(y + my)]) }
    : s));
}

// The width in WIDTHS nearest to `w`.
function nearestWidth(w) {
  return WIDTHS.reduce((best, v) => (Math.abs(v - w) < Math.abs(best - w) ? v : best), WIDTHS[0]);
}

// The selected lines scaled by `factor` from the top-left corner of their box,
// line widths too (to the nearest allowed one); the factor is limited so the
// selection stays inside the drawing and no smaller than MIN_SIZE.
const MIN_SIZE = 4;
function scaleStrokes(strokes, indexes, factor, { width = 800, height = 500 } = {}) {
  const list = Array.isArray(strokes) ? strokes : [];
  const b = pointBounds(list, indexes);
  let f = Number(factor);
  if (!b || !Number.isFinite(f) || f <= 0) return list;
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  const largest = Math.max(w, h);
  if (largest > 0) {
    f = Math.max(f, Math.min(1, MIN_SIZE / largest));
    if (w > 0) f = Math.min(f, (width - b.x0) / w);
    if (h > 0) f = Math.min(f, (height - b.y0) / h);
  }
  const sel = new Set(indexes);
  return list.map((s, i) => (sel.has(i)
    ? {
      ...s,
      width: nearestWidth(s.width * f),
      points: s.points.map(([x, y]) => [round1(b.x0 + (x - b.x0) * f), round1(b.y0 + (y - b.y0) * f)]),
    }
    : s));
}

// The selected lines as one group (`id`), or with their groups taken away.
function groupStrokes(strokes, indexes, id) {
  if (!GROUP_ID.test(String(id || ''))) return strokes;
  const sel = new Set(indexes);
  return strokes.map((s, i) => (sel.has(i) ? { ...s, group: id } : s));
}

function ungroupStrokes(strokes, indexes) {
  const sel = new Set(indexes);
  return strokes.map((s, i) => {
    if (!sel.has(i) || !s.group) return s;
    const { group, ...rest } = s;
    return rest;
  });
}

// Layer order. `front` and `back` move the selection above or below every
// other line; `forward` and `backward` one line past the nearest unselected
// one. The selection keeps its own order. Returns the strokes and where the
// selected ones are now.
function reorderStrokes(strokes, indexes, how) {
  const list = Array.isArray(strokes) ? strokes : [];
  const sel = new Set(indexes);
  const tagged = list.map((s, i) => ({ s, picked: sel.has(i) }));
  let out;
  if (how === 'front') out = [...tagged.filter(t => !t.picked), ...tagged.filter(t => t.picked)];
  else if (how === 'back') out = [...tagged.filter(t => t.picked), ...tagged.filter(t => !t.picked)];
  else if (how === 'forward' || how === 'backward') {
    out = how === 'forward' ? tagged.slice() : tagged.slice().reverse();
    // From the top down, each selected line swaps with the unselected one
    // above it, once.
    for (let i = out.length - 2; i >= 0; i -= 1) {
      if (out[i].picked && !out[i + 1].picked) {
        let j = i;
        while (j >= 0 && out[j].picked) j -= 1;
        // The run of selected lines j+1..i moves above out[i + 1].
        const run = out.splice(j + 1, i - j);
        out.splice(j + 2, 0, ...run);
        i = j + 1;
      }
    }
    if (how === 'backward') out.reverse();
  } else return { strokes: list, selection: [...sel].sort((a, b) => a - b) };
  return {
    strokes: out.map(t => t.s),
    selection: out.map((t, i) => (t.picked ? i : -1)).filter(i => i !== -1),
  };
}

module.exports = {
  COLORS, WIDTHS, MAX_DRAWINGS, MAX_STROKES, cleanStrokes, strokesToSvg, drawingsAfterSave, whiteboardStroke,
  lastStrokeOf, eraseAt, strokeTouches, pointerDraws,
  pointInPolygon, lassoSelect, withGroups, selectionBounds, moveStrokes, scaleStrokes, groupStrokes, ungroupStrokes,
  reorderStrokes,
};
