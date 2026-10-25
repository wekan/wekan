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
  // Palm rejection (models/lib/cardDrawing.js pointerDraws).
  this.pointer = { penSeen: false, activePointerId: null };
});

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
  message() { return Template.instance().message.get(); },
});

Template.cardDrawingPopup.events({
  'click .js-drawing-color'(event, tpl) { event.preventDefault(); tpl.color.set(event.currentTarget.dataset.color); },
  'click .js-drawing-width'(event, tpl) { event.preventDefault(); tpl.width.set(Number(event.currentTarget.dataset.width)); },
  'click .js-drawing-undo'(event, tpl) { event.preventDefault(); tpl.strokes.set(tpl.strokes.get().slice(0, -1)); },
  'click .js-drawing-clear'(event, tpl) { event.preventDefault(); tpl.strokes.set([]); },
  'click .js-drawing-eraser'(event, tpl) { event.preventDefault(); tpl.erasing.set(!tpl.erasing.get()); },
  // docs/Features/Cards/Whiteboard.md
  'click .js-open-whiteboard'(event, tpl) {
    event.preventDefault();
    openWhiteboard(card(tpl)._id, event.currentTarget.dataset.id);
    Popup.close();
  },
  'click .js-new-drawing'(event, tpl) { event.preventDefault(); tpl.editingId.set(null); tpl.strokes.set([]); },
  'click .js-edit-drawing'(event, tpl) {
    event.preventDefault();
    const drawing = (card(tpl).drawings || []).find(x => x._id === event.currentTarget.dataset.id);
    if (!drawing) return;
    tpl.editingId.set(drawing._id);
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
