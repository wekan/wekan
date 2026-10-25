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
export async function drawingPngFile(target, strokes) {
  const svg = d.strokesToSvg(strokes, { width: W, height: H });
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.getContext('2d').drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  return new File([png], `${(target.title || 'drawing').slice(0, 60)}.png`, { type: 'image/png' });
}

// #6802: the drawing as an SVG file, for a new drawing from Add Card or Add
// attachment. The server sanitizes every SVG it is given (models/lib/sanitizeSvg.js);
// this one is lines only.
export function drawingSvgFile(target, strokes) {
  const svg = d.strokesToSvg(strokes, { width: W, height: H });
  return new File([svg], `${(target.title || 'drawing').slice(0, 60)}.svg`, { type: 'image/svg+xml' });
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
});

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

function pointFrom(tpl, event) {
  const svg = tpl.find('.js-drawing-surface');
  const rect = svg.getBoundingClientRect();
  const e = event.originalEvent || event;
  return [Math.round(((e.clientX - rect.left) / rect.width) * W * 10) / 10, Math.round(((e.clientY - rect.top) / rect.height) * H * 10) / 10];
}

Template.cardDrawingPopup.helpers({
  drawings() { return (card(Template.instance()).drawings || []); },
  isEditing() { return Template.instance().editingId.get() === this._id; },
  thumbSvg() { return d.strokesToSvg(this.strokes, { width: this.width || W, height: this.height || H }); },
  colors() { return d.COLORS; },
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
  'click .js-drawing-color'(event, tpl) { event.preventDefault(); tpl.color.set(event.currentTarget.dataset.color); },
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
  'click .js-new-drawing'(event, tpl) { event.preventDefault(); tpl.editingId.set(null); tpl.history = []; tpl.selection.set([]); tpl.strokes.set([]); },
  'click .js-edit-drawing'(event, tpl) {
    event.preventDefault();
    const drawing = (card(tpl).drawings || []).find(x => x._id === event.currentTarget.dataset.id);
    if (!drawing) return;
    tpl.editingId.set(drawing._id);
    tpl.history = [];
    tpl.selection.set([]);
    tpl.strokes.set(d.cleanStrokes(drawing.strokes, { width: W, height: H }));
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
        tpl.strokes.set(d.moveStrokes(base, tpl.selection.get(), p[0] - start[0], p[1] - start[1], { width: W, height: H }));
      } else if (kind === 'resize' && box) {
        // From the box's top-left corner, as far as the pointer went.
        const fx = box.width > 0 ? (p[0] - box.x) / box.width : 0;
        const fy = box.height > 0 ? (p[1] - box.y) / box.height : 0;
        const factor = Math.max(fx, fy);
        if (factor > 0) tpl.strokes.set(d.scaleStrokes(base, tpl.selection.get(), factor, { width: W, height: H }));
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
    const blob = new Blob([d.strokesToSvg(tpl.strokes.get(), { width: W, height: H })], { type: 'image/svg+xml' });
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
    const strokes = d.cleanStrokes(tpl.strokes.get(), { width: W, height: H });
    if (!target || !strokes.length) return;
    tpl.saving.set(true);
    // #6802: a new drawing becomes an SVG attachment of the card, and is kept
    // on the card too, so the Drawing popup can edit it later.
    if (tpl.data && tpl.data.drawingNewFile) {
      try {
        const id = Random.id();
        const svgAttachmentId = await uploadDrawingPng(target, drawingSvgFile(target, strokes));
        const drawing = { _id: id, strokes, width: W, height: H, svgAttachmentId, updatedAt: new Date() };
        await Cards.updateAsync(target._id, { $set: { drawings: d.drawingsAfterSave(target.drawings, drawing) } });
        tpl.saving.set(false);
        Popup.close();
      } catch (error) {
        tpl.saving.set(false);
        tpl.message.set((error && (error.reason || error.message)) || 'error');
      }
      return;
    }
    try {
      const file = await drawingPngFile(target, strokes);
      const id = tpl.editingId.get() || Random.id();
      const pngAttachmentId = await uploadDrawingPng(target, file);
      tpl.saving.set(false);
      const drawing = { _id: id, strokes, width: W, height: H, pngAttachmentId, updatedAt: new Date() };
      await Cards.updateAsync(target._id, { $set: { drawings: d.drawingsAfterSave(target.drawings, drawing) } });
      tpl.editingId.set(id);
      tpl.message.set(TAPi18n.__('card-drawing-saved'));
    } catch (error) {
      tpl.saving.set(false);
      tpl.message.set((error && (error.reason || error.message)) || 'error');
    }
  },
});
