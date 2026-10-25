import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Random } from 'meteor/random';
import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import { boardFlagOn } from '/client/lib/boardFlagOn';
import { Utils } from '/client/lib/utils';
import { drawingPngFile, uploadDrawingPng } from '/client/components/cards/cardDrawing';
import './whiteboard.jade';

// docs/Features/Cards/Whiteboard.md. One whiteboard is open at a time:
// openWhiteboard(cardId, drawingId). Each finished line is sent on its own
// (cards.whiteboardAddStroke); it stays drawn here as "pending" until the
// card's publication brings it back, so drawing never waits for the network.
const d = require('/models/lib/cardDrawing');

const state = new ReactiveDict();

export function openWhiteboard(cardId, drawingId) {
  state.set('target', { cardId, drawingId });
}

export function closeWhiteboard() {
  state.set('target', null);
}

function target() {
  return state.get('target');
}

function drawingOf(tpl) {
  const t = target();
  const card = t && ReactiveCache.getCard(t.cardId);
  const drawing = card && (card.drawings || []).find(x => x && x._id === t.drawingId);
  return { card, drawing };
}

function pathD(points) {
  if (points.length === 1) return `M${points[0][0]} ${points[0][1]}l0.1 0`;
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
}

function size(drawing) {
  return { width: (drawing && drawing.width) || 800, height: (drawing && drawing.height) || 500 };
}

// The point under the pointer in the drawing's own coordinates, letterbox and all.
function pointFrom(tpl, event) {
  const svg = tpl.find('.js-whiteboard-surface');
  const e = event.originalEvent || event;
  const matrix = svg.getScreenCTM();
  if (!matrix) return [0, 0];
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
  const { width, height } = size(drawingOf(tpl).drawing);
  const clamp = (v, max) => Math.round(Math.min(max, Math.max(0, v)) * 10) / 10;
  return [clamp(p.x, width), clamp(p.y, height)];
}

Template.cardWhiteboard.onCreated(function () {
  this.color = new ReactiveVar(d.COLORS[0]);
  this.width = new ReactiveVar(d.WIDTHS[1]);
  this.current = new ReactiveVar(null);
  this.pending = new ReactiveVar([]);
  this.saving = new ReactiveVar(false);
  this.message = new ReactiveVar('');
  this.top = new ReactiveVar(0);
  this.onKey = event => { if (event.key === 'Escape' && target()) closeWhiteboard(); };
  document.addEventListener('keydown', this.onKey);
  // Under the header bar, whatever its height on this screen.
  this.autorun(() => {
    if (!target()) return;
    // The header is one bar or two (#header-quick-access, #header-main-bar).
    const bottoms = [...document.querySelectorAll('#header-quick-access, #header-main-bar')]
      .map(el => el.getBoundingClientRect())
      .filter(r => r.height > 0)
      .map(r => r.bottom);
    this.top.set(bottoms.length ? Math.round(Math.max(...bottoms)) : 0);
    this.pending.set([]);
    this.message.set('');
  });
});

Template.cardWhiteboard.onDestroyed(function () {
  document.removeEventListener('keydown', this.onKey);
});

Template.cardWhiteboard.helpers({
  open() {
    const t = target();
    if (!t) return false;
    const { card, drawing } = drawingOf(Template.instance());
    return !!(card && drawing && boardFlagOn('allowsWhiteboardOnCard', card.boardId));
  },
  top() { return Template.instance().top.get(); },
  cardTitle() { return (drawingOf(Template.instance()).card || {}).title; },
  width() { return size(drawingOf(Template.instance()).drawing).width; },
  height() { return size(drawingOf(Template.instance()).drawing).height; },
  canDraw() {
    // The same decision as the card's own edit controls; the server's
    // canEditCardOrLinkedCard decides again for every line.
    const { card } = drawingOf(Template.instance());
    return !!card && Utils.canModifyCard(card);
  },
  colors() { return d.COLORS; },
  widths() { return d.WIDTHS; },
  isColor(c) { return Template.instance().color.get() === c; },
  isWidth(w) { return Template.instance().width.get() === w; },
  strokes() {
    const tpl = Template.instance();
    const { drawing } = drawingOf(tpl);
    const saved = (drawing && drawing.strokes) || [];
    const ids = new Set(saved.map(s => s && s._id).filter(Boolean));
    const pending = tpl.pending.get().filter(s => !ids.has(s._id));
    const current = tpl.current.get();
    return [...saved, ...pending, ...(current ? [current] : [])]
      .filter(s => s && Array.isArray(s.points) && s.points.length)
      .map(s => ({ color: s.color, width: s.width, pathD: pathD(s.points) }));
  },
  saving() { return Template.instance().saving.get(); },
  message() { return Template.instance().message.get(); },
});

Template.cardWhiteboard.events({
  'click .js-whiteboard-close'(event) { event.preventDefault(); closeWhiteboard(); },
  'click .js-whiteboard-color'(event, tpl) { event.preventDefault(); tpl.color.set(event.currentTarget.dataset.color); },
  'click .js-whiteboard-width'(event, tpl) { event.preventDefault(); tpl.width.set(Number(event.currentTarget.dataset.width)); },
  'click .js-whiteboard-undo'(event) {
    event.preventDefault();
    const t = target();
    if (t) Meteor.call('cards.whiteboardUndo', t.cardId, t.drawingId);
  },
  'click .js-whiteboard-clear'(event) {
    event.preventDefault();
    const t = target();
    if (t) Meteor.call('cards.whiteboardClear', t.cardId, t.drawingId);
  },
  'pointerdown .js-whiteboard-surface.can-draw'(event, tpl) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.((event.originalEvent || event).pointerId);
    tpl.current.set({ _id: Random.id(), color: tpl.color.get(), width: tpl.width.get(), points: [pointFrom(tpl, event)] });
  },
  'pointermove .js-whiteboard-surface.can-draw'(event, tpl) {
    const current = tpl.current.get();
    if (!current || current.points.length >= 5000) return;
    tpl.current.set({ ...current, points: [...current.points, pointFrom(tpl, event)] });
  },
  'pointerup .js-whiteboard-surface, pointercancel .js-whiteboard-surface'(event, tpl) {
    const stroke = tpl.current.get();
    tpl.current.set(null);
    const t = target();
    if (!stroke || !t) return;
    tpl.pending.set([...tpl.pending.get(), stroke]);
    Meteor.call('cards.whiteboardAddStroke', t.cardId, t.drawingId, stroke, err => {
      if (!err) return;
      tpl.pending.set(tpl.pending.get().filter(s => s._id !== stroke._id));
      tpl.message.set(err.reason || err.message);
    });
  },
  async 'click .js-whiteboard-save'(event, tpl) {
    event.preventDefault();
    const t = target();
    const { card, drawing } = drawingOf(tpl);
    if (!t || !card || !drawing) return;
    tpl.saving.set(true);
    try {
      const file = await drawingPngFile(card, d.cleanStrokes(drawing.strokes, size(drawing)), size(drawing));
      const attachmentId = await uploadDrawingPng(card, file);
      await Meteor.callAsync('cards.whiteboardSetPicture', t.cardId, t.drawingId, attachmentId);
      tpl.message.set(TAPi18n.__('card-drawing-saved'));
    } catch (error) {
      tpl.message.set((error && (error.reason || error.message)) || 'error');
    } finally {
      tpl.saving.set(false);
    }
  },
});
