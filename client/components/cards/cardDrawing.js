import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import { buildAttachmentUploadConfig } from '/client/lib/attachmentUploadConfig';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { openWhiteboard } from '/client/components/cards/whiteboard';

const d = require('/models/lib/cardDrawing');
const W = 800;
const H = 500;

function pathD(points) {
  if (points.length === 1) return `M${points[0][0]} ${points[0][1]}l0.1 0`;
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
}

// The drawing as a PNG file, the size it is drawn at - for the popup's Save
// and the whiteboard's Save picture (docs/Features/Cards/Whiteboard.md).
export async function drawingPngFile(target, strokes, { width = W, height = H } = {}) {
  const svg = d.strokesToSvg(strokes, { width, height });
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  return new File([png], `${(target.title || 'drawing').slice(0, 60)}.png`, { type: 'image/png' });
}

// #6802: the drawing as an SVG file, for a new drawing from Add Card or Add
// attachment. The server sanitizes every SVG it is given (models/lib/sanitizeSvg.js);
// this one is lines only.
export function drawingSvgFile(target, strokes, { width = W, height = H } = {}) {
  const svg = d.strokesToSvg(strokes, { width, height });
  return new File([svg], `${(target.title || 'drawing').slice(0, 60)}.svg`, { type: 'image/svg+xml' });
}

// #6802: the custom colors beside the palette. A signed-in user keeps them
// with the account (profile.drawingColors, the setDrawingColors method), so
// they follow the user to every browser; someone drawing on a public board
// without signing in keeps them in this browser.
const CUSTOM_COLORS_KEY = 'wekan-drawing-custom-colors';
function loadBrowserColors() {
  try { return d.addCustomColor(JSON.parse(window.localStorage.getItem(CUSTOM_COLORS_KEY) || '[]'), null); } catch (e) { return []; }
}

// Reactive: the account's colors, or this browser's.
function customColorsOf(tpl) {
  const user = ReactiveCache.getCurrentUser();
  if (user) return d.addCustomColor((user.profile && user.profile.drawingColors) || [], null);
  return tpl.customColors.get();
}

function saveCustomColors(tpl, list) {
  if (Meteor.userId()) {
    Meteor.callAsync('setDrawingColors', list).catch(error => {
      tpl.message.set((error && (error.reason || error.message)) || 'error');
    });
    return;
  }
  tpl.customColors.set(list);
  try { window.localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(list)); } catch (e) { /* a preference */ }
}

const WHEEL = 160;

// The color wheel at brightness `v`, with a ring where `hex` sits on it.
function paintWheel(canvas, v, hex) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const r = WHEEL / 2;
  const image = ctx.createImageData(WHEEL, WHEEL);
  for (let y = 0; y < WHEEL; y += 1) {
    for (let x = 0; x < WHEEL; x += 1) {
      const i = (y * WHEEL + x) * 4;
      if (Math.hypot(x - r, y - r) > r) { image.data[i + 3] = 0; continue; }
      const c = d.wheelColor(x, y, r, v);
      image.data[i] = parseInt(c.slice(1, 3), 16);
      image.data[i + 1] = parseInt(c.slice(3, 5), 16);
      image.data[i + 2] = parseInt(c.slice(5, 7), 16);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const at = d.wheelPoint(hex, r);
  if (at) {
    ctx.beginPath();
    ctx.arc(at.x, at.y, 6, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = v > 0.5 ? '#000000' : '#ffffff';
    ctx.stroke();
  }
}

// A new drawing is the card's cover image (docs/Features/Cards/Drawing.md).
function coverOf(attachmentId) {
  return attachmentId ? { coverId: attachmentId } : {};
}

// Upload a drawing's PNG as a card attachment; resolves with its id.
export async function uploadDrawingPng(target, file) {
  const uploader = await Attachments.insertAsync(buildAttachmentUploadConfig({ file, meta: Utils.getCommonAttachmentMetaFrom(target) }), false);
  return new Promise((resolve, reject) => {
    uploader.on('end', (error, fileRef) => (error ? reject(error) : resolve(fileRef && fileRef._id)));
    uploader.start();
  });
}

// #1178: Template.currentData() is the card.
Template.cardDrawingPopup.onCreated(function () {
  this.strokes = new ReactiveVar([]);
  this.current = null;
  this.color = new ReactiveVar(d.COLORS[0]);
  this.width = new ReactiveVar(d.WIDTHS[1]);
  this.editingId = new ReactiveVar(null);
  this.saving = new ReactiveVar(false);
  this.message = new ReactiveVar('');
  this.erasing = new ReactiveVar(false);
  // #6802, the lasso: a loop selects lines; the selection moves, resizes,
  // groups and changes layer (models/lib/cardDrawing.js).
  this.lasso = new ReactiveVar(false);
  this.loop = new ReactiveVar(null);
  this.selection = new ReactiveVar([]);
  this.drag = null;
  // Undo steps back through every change - a line, an erase, a move - and,
  // with nothing left to step back to, takes away the last line as before.
  this.history = [];
  // Palm rejection (models/lib/cardDrawing.js pointerDraws).
  this.pointer = { penSeen: false, activePointerId: null };
  // #6802: the drawing's own size, in drawing units, and how large it is shown.
  this.size = new ReactiveVar({ width: W, height: H });
  this.zoom = new ReactiveVar(1);
  // Colors: the custom ones, the wheel and code editor, the eyedropper.
  this.customColors = new ReactiveVar(loadBrowserColors());
  this.colorEditor = new ReactiveVar(false);
  this.brightness = new ReactiveVar(1);
  this.picking = new ReactiveVar(false);
});

// The room the drawing area has on the screen.
function stageRoom(tpl) {
  const stage = tpl.find('.js-drawing-stage');
  if (!stage) return null;
  // Less its padding (room for the corner handle) and the surface's border.
  return { width: Math.max(0, stage.clientWidth - 14), height: Math.max(0, stage.clientHeight - 14) };
}

// A NEW drawing takes the room there is; an existing one keeps its size and
// is zoomed to fit.
function fitToStage(tpl, size) {
  const room = stageRoom(tpl);
  if (!room || room.width < 50 || room.height < 50) return;
  if (!size) {
    tpl.size.set(d.drawingSize(room.width, room.height));
    tpl.zoom.set(1);
    return;
  }
  tpl.size.set(d.drawingSize(size.width, size.height));
  const z = Math.min(room.width / size.width, room.height / size.height);
  tpl.zoom.set(Math.round(Math.min(d.ZOOM_MAX, Math.max(d.ZOOM_MIN, z)) * 1000) / 1000);
}

Template.cardDrawingPopup.onRendered(function () {
  // After the popup has maximized (popup.js does that after a flush), and once
  // the layout has settled.
  const tpl = this;
  Tracker.afterFlush(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!tpl.view.isDestroyed && !tpl.strokes.get().length && !tpl.editingId.get()) fitToStage(tpl, null);
  })));
  // ...and again whenever that room changes while the drawing is still new,
  // empty and not sized or zoomed by hand. Opened from another popup (the
  // card's + Add, Add attachment) the popup is the SAME rendered one, and its
  // maximize follows reactively - after the fit above had already taken the
  // un-maximized 820px, so a new drawing kept about 784px of a 1280px window.
  // The same refit follows the window being resized or the popup maximized.
  const stage = this.find('.js-drawing-stage');
  if (stage && typeof ResizeObserver !== 'undefined') {
    let lastRoom = '';
    this.stageObserver = new ResizeObserver(() => {
      const room = stageRoom(tpl);
      const key = room ? `${room.width}x${room.height}` : '';
      if (key === lastRoom) return;
      lastRoom = key;
      if (tpl.view.isDestroyed || tpl.sizedByHand || tpl.strokes.get().length || tpl.editingId.get()) return;
      fitToStage(tpl, null);
    });
    this.stageObserver.observe(stage);
  }
  // The color wheel follows the brightness and the color.
  this.autorun(() => {
    if (!tpl.colorEditor.get()) return;
    const v = tpl.brightness.get();
    const hex = tpl.color.get();
    Tracker.afterFlush(() => paintWheel(tpl.find('.js-drawing-wheel'), v, hex));
  });
});

// Picks `hex` as the pen color, and shows it in the editor.
function useColor(tpl, hex) {
  const c = d.cleanColor(hex);
  if (!c) return;
  tpl.color.set(c);
  const hsv = d.hexToHsv(c);
  if (hsv) tpl.brightness.set(hsv.v);
}

const HISTORY = 100;
const HANDLE = 12;

// Before a change: remember the strokes, for Undo.
function remember(tpl, strokes = tpl.strokes.get()) {
  tpl.history.push(strokes);
  if (tpl.history.length > HISTORY) tpl.history.shift();
}

function setTool(tpl, tool) {
  tpl.erasing.set(tool === 'eraser');
  tpl.lasso.set(tool === 'lasso');
  tpl.picking.set(false);
  tpl.selection.set([]);
  tpl.loop.set(null);
}

// The selection's box, with the resize handle at its bottom-right corner.
function selectionBox(tpl) {
  const b = d.selectionBounds(tpl.strokes.get(), tpl.selection.get());
  return b && { ...b, hx: b.x + b.width - HANDLE / 2, hy: b.y + b.height - HANDLE / 2, size: HANDLE };
}

// What a press at `p` does with the lasso: resize by the handle, move inside
// the selection, or start a new loop.
function lassoAction(box, p) {
  if (box && Math.abs(p[0] - (box.x + box.width)) <= HANDLE && Math.abs(p[1] - (box.y + box.height)) <= HANDLE) return 'resize';
  if (box && p[0] >= box.x - 4 && p[0] <= box.x + box.width + 4 && p[1] >= box.y - 4 && p[1] <= box.y + box.height + 4) return 'move';
  return 'loop';
}

function card(tpl) {
  return ReactiveCache.getCard(tpl.data._id) || tpl.data;
}

// The drawing's size, for every operation that keeps lines inside it.
function bounds(tpl) {
  return tpl.size.get();
}

// A pointer position in drawing units: the surface is shown at the drawing's
// size times the zoom, so a fraction of its box is the same fraction of the
// drawing.
function pointFrom(tpl, event) {
  const svg = tpl.find('.js-drawing-surface');
  const rect = svg.getBoundingClientRect();
  const e = event.originalEvent || event;
  const { width, height } = bounds(tpl);
  return [Math.round(((e.clientX - rect.left) / rect.width) * width * 10) / 10, Math.round(((e.clientY - rect.top) / rect.height) * height * 10) / 10];
}

Template.cardDrawingPopup.onDestroyed(function () {
  if (this.stageObserver) this.stageObserver.disconnect();
});

Template.cardDrawingPopup.helpers({
  drawings() { return (card(Template.instance()).drawings || []); },
  isEditing() { return Template.instance().editingId.get() === this._id; },
  thumbSvg() { return d.strokesToSvg(this.strokes, { width: this.width || W, height: this.height || H }); },
  colors() { return d.COLORS; },
  customColors() { return customColorsOf(Template.instance()); },
  isCustom(c) { return customColorsOf(Template.instance()).includes(c); },
  currentColor() { return Template.instance().color.get(); },
  colorEditorOpen() { return Template.instance().colorEditor.get(); },
  brightnessPercent() { return Math.round(Template.instance().brightness.get() * 100); },
  picking() { return Template.instance().picking.get(); },
  drawingWidth() { return Template.instance().size.get().width; },
  drawingHeight() { return Template.instance().size.get().height; },
  canvasWidth() { const tpl = Template.instance(); return Math.round(tpl.size.get().width * tpl.zoom.get()); },
  canvasHeight() { const tpl = Template.instance(); return Math.round(tpl.size.get().height * tpl.zoom.get()); },
  zoomPercent() { return Math.round(Template.instance().zoom.get() * 100); },
  widths() { return d.WIDTHS; },
  isColor(c) { return Template.instance().color.get() === c; },
  isWidth(w) { return Template.instance().width.get() === w; },
  strokes() {
    return Template.instance().strokes.get().map(s => ({ ...s, pathD: pathD(s.points) }));
  },
  saving() { return Template.instance().saving.get(); },
  newFile() { return Boolean(Template.instance().data && Template.instance().data.drawingNewFile); },
  showDrawingList() {
    const tpl = Template.instance();
    return !(tpl.data && tpl.data.drawingNewFile) && (card(tpl).drawings || []).length > 0;
  },
  erasing() { return Template.instance().erasing.get(); },
  lassoOn() { return Template.instance().lasso.get(); },
  lassoPath() {
    const loop = Template.instance().loop.get();
    return loop && loop.length > 1 ? `${pathD(loop)}Z` : null;
  },
  selectionBox() { return selectionBox(Template.instance()); },
  hasSelection() { return Template.instance().selection.get().length > 0; },
  selectionGrouped() {
    const tpl = Template.instance();
    const strokes = tpl.strokes.get();
    return tpl.selection.get().some(i => strokes[i] && strokes[i].group);
  },
  message() { return Template.instance().message.get(); },
});

Template.cardDrawingPopup.events({
  // A color is picked, and the wheel and the HTML code open to change it.
  'click .js-drawing-color'(event, tpl) {
    event.preventDefault();
    useColor(tpl, event.currentTarget.dataset.color);
    tpl.colorEditor.set(true);
  },
  'click .js-drawing-custom-color'(event, tpl) { event.preventDefault(); tpl.colorEditor.set(!tpl.colorEditor.get()); },
  'click .js-drawing-close-colors'(event, tpl) { event.preventDefault(); tpl.colorEditor.set(false); },
  'click .js-drawing-add-color'(event, tpl) {
    event.preventDefault();
    saveCustomColors(tpl, d.addCustomColor(customColorsOf(tpl), tpl.color.get()));
  },
  'click .js-drawing-remove-color'(event, tpl) {
    event.preventDefault();
    saveCustomColors(tpl, d.removeCustomColor(customColorsOf(tpl), tpl.color.get()));
  },
  'input .js-drawing-hex, change .js-drawing-hex'(event, tpl) {
    let v = String(event.currentTarget.value || '').trim();
    if (/^[0-9a-f]{6}$/i.test(v)) v = `#${v}`;
    if (d.cleanColor(v)) useColor(tpl, v);
  },
  'input .js-drawing-brightness'(event, tpl) {
    const v = Number(event.currentTarget.value) / 100;
    const hsv = d.hexToHsv(tpl.color.get()) || { h: 0, s: 0 };
    tpl.brightness.set(v);
    tpl.color.set(d.hsvToHex(hsv.h, hsv.s, v));
  },
  'pointerdown .js-drawing-wheel, pointermove .js-drawing-wheel'(event, tpl) {
    const e = event.originalEvent || event;
    if (event.type === 'pointermove' && !e.buttons) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WHEEL;
    const y = ((e.clientY - rect.top) / rect.height) * WHEEL;
    tpl.color.set(d.wheelColor(x, y, WHEEL / 2, tpl.brightness.get()));
  },
  // The eyedropper: from anywhere on the screen where the browser allows it,
  // from the drawing otherwise.
  async 'click .js-drawing-eyedropper'(event, tpl) {
    event.preventDefault();
    if (typeof window.EyeDropper === 'function') {
      try {
        const result = await new window.EyeDropper().open();
        useColor(tpl, result && result.sRGBHex);
      } catch (error) { /* cancelled */ }
      return;
    }
    tpl.picking.set(!tpl.picking.get());
  },
  // A zoom or a corner resize is the user's choice of size: from then on a
  // change of the room no longer refits the drawing (onRendered's observer).
  'click .js-drawing-zoom-in'(event, tpl) { event.preventDefault(); tpl.sizedByHand = true; tpl.zoom.set(d.nextZoom(tpl.zoom.get(), 1)); },
  'click .js-drawing-zoom-out'(event, tpl) { event.preventDefault(); tpl.sizedByHand = true; tpl.zoom.set(d.nextZoom(tpl.zoom.get(), -1)); },
  // The drawing area grows (or shrinks, never cutting a line) from its corner.
  'pointerdown .js-drawing-canvas-resize'(event, tpl) {
    const e = event.originalEvent || event;
    if (e.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.currentTarget.setPointerCapture?.(e.pointerId); } catch (error) { /* resized without capture */ }
    // Right to left, the handle is at the bottom-left and grows the drawing leftwards.
    const direction = window.getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
    tpl.sizedByHand = true;
    tpl.canvasResize = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, size: tpl.size.get(), zoom: tpl.zoom.get(), direction };
  },
  'pointermove .js-drawing-canvas-resize'(event, tpl) {
    const e = event.originalEvent || event;
    const r = tpl.canvasResize;
    if (!r || r.pointerId !== e.pointerId) return;
    event.preventDefault();
    const min = d.minimumDrawingSize(tpl.strokes.get());
    const next = d.drawingSize(r.size.width + (r.direction * (e.clientX - r.x)) / r.zoom, r.size.height + (e.clientY - r.y) / r.zoom);
    tpl.size.set({ width: Math.max(min.width, next.width), height: Math.max(min.height, next.height) });
  },
  'pointerup .js-drawing-canvas-resize, pointercancel .js-drawing-canvas-resize, lostpointercapture .js-drawing-canvas-resize'(event, tpl) {
    tpl.canvasResize = null;
  },
  'keydown .js-drawing-canvas-resize'(event, tpl) {
    const steps = { ArrowRight: [50, 0], ArrowLeft: [-50, 0], ArrowDown: [0, 50], ArrowUp: [0, -50] };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    tpl.sizedByHand = true;
    const min = d.minimumDrawingSize(tpl.strokes.get());
    const size = tpl.size.get();
    const next = d.drawingSize(size.width + step[0], size.height + step[1]);
    tpl.size.set({ width: Math.max(min.width, next.width), height: Math.max(min.height, next.height) });
  },
  'click .js-drawing-width'(event, tpl) { event.preventDefault(); tpl.width.set(Number(event.currentTarget.dataset.width)); },
  'click .js-drawing-undo'(event, tpl) {
    event.preventDefault();
    tpl.selection.set([]);
    tpl.strokes.set(tpl.history.length ? tpl.history.pop() : tpl.strokes.get().slice(0, -1));
  },
  'click .js-drawing-clear'(event, tpl) { event.preventDefault(); remember(tpl); tpl.selection.set([]); tpl.strokes.set([]); },
  'click .js-drawing-eraser'(event, tpl) { event.preventDefault(); setTool(tpl, tpl.erasing.get() ? 'pen' : 'eraser'); },
  'click .js-drawing-lasso'(event, tpl) { event.preventDefault(); setTool(tpl, tpl.lasso.get() ? 'pen' : 'lasso'); },
  'click .js-drawing-group'(event, tpl) {
    event.preventDefault();
    const sel = tpl.selection.get();
    if (sel.length < 2) return;
    remember(tpl);
    tpl.strokes.set(d.groupStrokes(tpl.strokes.get(), sel, Random.id()));
  },
  'click .js-drawing-ungroup'(event, tpl) {
    event.preventDefault();
    remember(tpl);
    tpl.strokes.set(d.ungroupStrokes(tpl.strokes.get(), tpl.selection.get()));
  },
  'click .js-drawing-layer'(event, tpl) {
    event.preventDefault();
    const sel = tpl.selection.get();
    if (!sel.length) return;
    remember(tpl);
    const { strokes, selection } = d.reorderStrokes(tpl.strokes.get(), sel, event.currentTarget.dataset.layer);
    tpl.strokes.set(strokes);
    tpl.selection.set(selection);
  },
  // docs/Features/Cards/Whiteboard.md
  'click .js-open-whiteboard'(event, tpl) {
    event.preventDefault();
    openWhiteboard(card(tpl)._id, event.currentTarget.dataset.id);
    Popup.close();
  },
  'click .js-new-drawing'(event, tpl) {
    event.preventDefault();
    tpl.editingId.set(null);
    tpl.history = [];
    tpl.selection.set([]);
    tpl.strokes.set([]);
    tpl.sizedByHand = false;
    fitToStage(tpl, null);
  },
  'click .js-edit-drawing'(event, tpl) {
    event.preventDefault();
    const drawing = (card(tpl).drawings || []).find(x => x._id === event.currentTarget.dataset.id);
    if (!drawing) return;
    // A drawing keeps the size it was made at (older ones are 800 x 500).
    const size = d.drawingSize(drawing.width || W, drawing.height || H);
    tpl.editingId.set(drawing._id);
    tpl.history = [];
    tpl.selection.set([]);
    tpl.size.set(size);
    tpl.strokes.set(d.cleanStrokes(drawing.strokes, size));
    fitToStage(tpl, size);
  },
  'pointerdown .js-drawing-surface'(event, tpl) {
    const e = event.originalEvent || event;
    if (e.pointerType === 'pen') tpl.pointer.penSeen = true;
    if (!d.pointerDraws(e, tpl.pointer)) return;
    event.preventDefault();
    tpl.pointer.activePointerId = e.pointerId;
    // Capture keeps a line going past the edge; failing to capture must not
    // stop the line from starting.
    try { event.currentTarget.setPointerCapture?.(e.pointerId); } catch (error) { /* drawn without capture */ }
    const point = pointFrom(tpl, event);
    // The eyedropper on the drawing: the color under the pointer.
    if (tpl.picking.get()) {
      useColor(tpl, d.colorAt(tpl.strokes.get(), point));
      tpl.picking.set(false);
      tpl.pointer.activePointerId = null;
      return;
    }
    if (tpl.lasso.get()) {
      const box = selectionBox(tpl);
      const kind = lassoAction(box, point);
      if (kind === 'loop') {
        tpl.selection.set([]);
        tpl.loop.set([point]);
      }
      tpl.drag = { kind, start: point, base: tpl.strokes.get(), box };
      return;
    }
    remember(tpl);
    tpl.selection.set([]);
    if (tpl.erasing.get()) {
      tpl.erasingNow = true;
      tpl.strokes.set(d.eraseAt(tpl.strokes.get(), pointFrom(tpl, event)));
      return;
    }
    tpl.current = { color: tpl.color.get(), width: tpl.width.get(), points: [pointFrom(tpl, event)] };
    tpl.strokes.set([...tpl.strokes.get(), tpl.current]);
  },
  'pointermove .js-drawing-surface'(event, tpl) {
    const e = event.originalEvent || event;
    if (e.pointerId !== tpl.pointer.activePointerId) return;
    if (tpl.drag) {
      const p = pointFrom(tpl, event);
      const { kind, start, base, box } = tpl.drag;
      if (kind === 'loop') {
        tpl.loop.set([...(tpl.loop.get() || []), p]);
        return;
      }
      // A move or a resize is one Undo step, from where it started.
      if (!tpl.drag.changed) { remember(tpl, base); tpl.drag.changed = true; }
      if (kind === 'move') {
        tpl.strokes.set(d.moveStrokes(base, tpl.selection.get(), p[0] - start[0], p[1] - start[1], bounds(tpl)));
      } else if (kind === 'resize' && box) {
        // From the box's top-left corner, as far as the pointer went.
        const fx = box.width > 0 ? (p[0] - box.x) / box.width : 0;
        const fy = box.height > 0 ? (p[1] - box.y) / box.height : 0;
        const factor = Math.max(fx, fy);
        if (factor > 0) tpl.strokes.set(d.scaleStrokes(base, tpl.selection.get(), factor, bounds(tpl)));
      }
      return;
    }
    if (tpl.erasingNow) {
      tpl.strokes.set(d.eraseAt(tpl.strokes.get(), pointFrom(tpl, event)));
      return;
    }
    if (!tpl.current) return;
    tpl.current.points.push(pointFrom(tpl, event));
    const list = tpl.strokes.get().slice(0, -1);
    tpl.strokes.set([...list, { ...tpl.current }]);
  },
  'pointerup .js-drawing-surface, pointerleave .js-drawing-surface, pointercancel .js-drawing-surface'(event, tpl) {
    const e = event.originalEvent || event;
    if (tpl.pointer.activePointerId !== null && e.pointerId !== tpl.pointer.activePointerId) return;
    if (tpl.drag && tpl.drag.kind === 'loop') {
      tpl.selection.set(d.lassoSelect(tpl.strokes.get(), tpl.loop.get() || []));
      tpl.loop.set(null);
    }
    tpl.drag = null;
    tpl.current = null;
    tpl.erasingNow = false;
    tpl.pointer.activePointerId = null;
  },
  'click .js-drawing-download-svg'(event, tpl) {
    event.preventDefault();
    const blob = new Blob([d.strokesToSvg(tpl.strokes.get(), bounds(tpl))], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(card(tpl).title || 'drawing').slice(0, 60)}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  // Keep the strokes on the card, and upload the PNG as an attachment.
  async 'click .js-drawing-save'(event, tpl) {
    event.preventDefault();
    const target = card(tpl);
    const size = bounds(tpl);
    const strokes = d.cleanStrokes(tpl.strokes.get(), size);
    if (!target || !strokes.length) return;
    tpl.saving.set(true);
    // #6802: a new drawing becomes an SVG attachment of the card, and is kept
    // on the card too, so the Drawing popup can edit it later.
    if (tpl.data && tpl.data.drawingNewFile) {
      try {
        const id = Random.id();
        const svgAttachmentId = await uploadDrawingPng(target, drawingSvgFile(target, strokes, size));
        const drawing = { _id: id, strokes, width: size.width, height: size.height, svgAttachmentId, updatedAt: new Date() };
        // A new drawing is the card's cover image.
        await Cards.updateAsync(target._id, { $set: { drawings: d.drawingsAfterSave(target.drawings, drawing), ...coverOf(svgAttachmentId) } });
        tpl.saving.set(false);
        Popup.close();
      } catch (error) {
        tpl.saving.set(false);
        tpl.message.set((error && (error.reason || error.message)) || 'error');
      }
      return;
    }
    try {
      const file = await drawingPngFile(target, strokes, size);
      const isNew = !tpl.editingId.get();
      const id = tpl.editingId.get() || Random.id();
      const pngAttachmentId = await uploadDrawingPng(target, file);
      tpl.saving.set(false);
      const drawing = { _id: id, strokes, width: size.width, height: size.height, pngAttachmentId, updatedAt: new Date() };
      // A NEW drawing is the card's cover image; saving an edit leaves the cover.
      await Cards.updateAsync(target._id, { $set: { drawings: d.drawingsAfterSave(target.drawings, drawing), ...(isNew ? coverOf(pngAttachmentId) : {}) } });
      tpl.editingId.set(id);
      tpl.message.set(TAPi18n.__('card-drawing-saved'));
    } catch (error) {
      tpl.saving.set(false);
      tpl.message.set((error && (error.reason || error.message)) || 'error');
    }
  },
});
