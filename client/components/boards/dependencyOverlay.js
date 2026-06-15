import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
import {
  DEPENDENCY_ICON_CHOICES,
  DEPENDENCY_TYPES,
  dependencyTypeMeta,
  normalizeDependencies,
} from '/models/metadata/dependencies';

// #3392: PI Program Board "Red Strings".
// Draw colored, typed connection lines (SVG paths) between cards that declare
// cardDependencies. The board stays fully usable (cards clickable) — drawing a
// new link is initiated from a small connect handle on each minicard (drag it
// onto another card, piplanning.io / Kendis / Miro style), and a link can be
// edited/deleted by clicking its line. The overlay SVG itself stays
// pointer-events:none; only the lines (and the minicard handles) capture events.
//
// Coordinates are computed from the live DOM (getBoundingClientRect of
// [data-card-id] minicards) translated into the overlay SVG's own coordinate
// space, so scrolling/resizing is handled by recomputing relative to the SVG's
// current bounding rect.

// Stable, css-safe marker id for an arrowhead of a given color.
function markerIdForColor(color) {
  return `dependency-arrowhead-${String(color).replace(/[^a-zA-Z0-9]/g, '')}`;
}

Template.dependencyOverlay.onCreated(function () {
  this.lines = new ReactiveVar([]);
  this.markers = new ReactiveVar([]);
  this.tempLine = new ReactiveVar(null); // line being drawn while dragging
  // Guard against deferred (rAF / setTimeout) callbacks touching the DOM after
  // the overlay is destroyed ("Can't select in removed DomRange").
  this._overlayDestroyed = false;

  // Rect of a card relative to the overlay SVG, or null if not rendered.
  this.rectOf = (cardId, svgRect) => {
    const el = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { x: r.left - svgRect.left, y: r.top - svgRect.top, w: r.width, h: r.height };
  };

  this.recompute = () => {
    if (this._overlayDestroyed || !this.view || this.view.isDestroyed) {
      return;
    }
    const svg = this.find('.js-dependency-overlay');
    if (!svg) {
      return;
    }
    const board = Utils.getCurrentBoard();
    if (!board) {
      this.lines.set([]);
      return;
    }

    const svgRect = svg.getBoundingClientRect();
    const centerOf = cardId => this.rectOf(cardId, svgRect);

    const cards = ReactiveCache.getCards({
      boardId: board._id,
      archived: false,
    });

    const lines = [];
    const markerColors = new Set();
    cards.forEach(card => {
      const deps = normalizeDependencies(card.cardDependencies);
      if (deps.length === 0) {
        return;
      }
      const sourceRect = centerOf(card._id);
      if (!sourceRect) {
        return;
      }
      deps.forEach(dep => {
        const targetRect = centerOf(dep.cardId);
        if (!targetRect) {
          return;
        }
        const meta = dependencyTypeMeta(dep.type);
        // Draw the arrow from the prerequisite card's right edge to the
        // dependent card's left edge. For forward relations (blocks/fixes/
        // related-to) the source card is the prerequisite; for the reverse
        // relations (is-blocked-by/is-fixed-by) the target is.
        const prereq = meta.forward ? sourceRect : targetRect;
        const dependent = meta.forward ? targetRect : sourceRect;
        const x1 = prereq.x + prereq.w;
        const y1 = prereq.y + prereq.h / 2;
        const x2 = dependent.x;
        const y2 = dependent.y + dependent.h / 2;
        const dx = Math.max(40, Math.abs(x2 - x1) / 2);
        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        const markerId = markerIdForColor(dep.color);
        if (meta.directed) {
          markerColors.add(dep.color);
        }
        lines.push({
          path,
          color: dep.color,
          type: dep.type,
          icon: dep.icon,
          directed: meta.directed,
          markerId: meta.directed ? markerId : '',
          // Source card (owns the dependency) and target card.
          fromId: card._id,
          toId: dep.cardId,
        });
      });
    });
    this.lines.set(lines);
    this.markers.set(
      [...markerColors].map(color => ({
        color,
        markerId: markerIdForColor(color),
      })),
    );
  };

  this.scheduleRecompute = () => {
    if (this._overlayDestroyed) return;
    if (this._raf) {
      window.cancelAnimationFrame(this._raf);
    }
    this._raf = window.requestAnimationFrame(() => {
      this._raf = null;
      this.recompute();
    });
  };
});

Template.dependencyOverlay.onRendered(function () {
  const instance = this;
  const svg = this.find('.js-dependency-overlay');
  this.scrollEl = svg ? this.firstNode.closest('.board-canvas') : null;

  this.autorun(() => {
    const board = Utils.getCurrentBoard();
    if (board) {
      ReactiveCache.getCards({ boardId: board._id, archived: false });
    }
    instance.scheduleRecompute();
  });

  this.onScroll = () => instance.scheduleRecompute();
  this.onResize = () => instance.scheduleRecompute();

  if (this.scrollEl) {
    this.scrollEl.addEventListener('scroll', this.onScroll, { passive: true });
  }
  window.addEventListener('scroll', this.onScroll, { passive: true });
  window.addEventListener('resize', this.onResize);

  // --- drag-to-connect (from a minicard's connect handle) -----------------
  // Find the card under a viewport point. The overlay is pointer-events:none,
  // so elementsFromPoint returns the minicards directly.
  const cardIdAtPoint = (clientX, clientY) => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      if (svg && svg.contains(el)) continue;
      const card = el.closest && el.closest('[data-card-id]');
      if (card) return card.getAttribute('data-card-id');
    }
    return null;
  };

  this.onMouseDown = e => {
    if (e.button !== 0) return;
    const handle =
      e.target.closest && e.target.closest('.js-dependency-connect-handle');
    if (!handle) return;
    const cardEl = handle.closest('[data-card-id]');
    if (!cardEl) return;
    // Beat the card drag-sort: capture-phase + stop propagation.
    e.preventDefault();
    e.stopPropagation();
    instance.dragSourceId = cardEl.getAttribute('data-card-id');
  };

  this.onMouseMove = e => {
    if (!instance.dragSourceId || !svg) return;
    const svgRect = svg.getBoundingClientRect();
    const from = instance.rectOf(instance.dragSourceId, svgRect);
    if (!from) return;
    const x1 = from.x + from.w;
    const y1 = from.y + from.h / 2;
    const x2 = e.clientX - svgRect.left;
    const y2 = e.clientY - svgRect.top;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    instance.tempLine.set(
      `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
    );
  };

  this.onMouseUp = e => {
    if (!instance.dragSourceId) return;
    const sourceId = instance.dragSourceId;
    instance.dragSourceId = null;
    instance.tempLine.set(null);
    const targetId = cardIdAtPoint(e.clientX, e.clientY);
    if (targetId && targetId !== sourceId) {
      const card = ReactiveCache.getCard(sourceId);
      if (card && typeof card.addDependency === 'function') {
        card.addDependency(targetId);
      }
    }
  };

  // Capture phase so the connect drag starts before the sortable grabs the card.
  document.addEventListener('mousedown', this.onMouseDown, true);
  document.addEventListener('mousemove', this.onMouseMove);
  document.addEventListener('mouseup', this.onMouseUp);

  this._initTimeout = Meteor.setTimeout(() => instance.scheduleRecompute(), 300);
});

Template.dependencyOverlay.onDestroyed(function () {
  this._overlayDestroyed = true;
  if (this.scrollEl) {
    this.scrollEl.removeEventListener('scroll', this.onScroll);
  }
  window.removeEventListener('scroll', this.onScroll);
  window.removeEventListener('resize', this.onResize);
  if (this.onMouseDown) document.removeEventListener('mousedown', this.onMouseDown, true);
  if (this.onMouseMove) document.removeEventListener('mousemove', this.onMouseMove);
  if (this.onMouseUp) document.removeEventListener('mouseup', this.onMouseUp);
  if (this._raf) {
    window.cancelAnimationFrame(this._raf);
  }
  if (this._initTimeout) {
    Meteor.clearTimeout(this._initTimeout);
  }
});

Template.dependencyOverlay.helpers({
  dependencyLines() {
    return Template.instance().lines.get();
  },
  dependencyMarkers() {
    return Template.instance().markers.get();
  },
  tempLine() {
    return Template.instance().tempLine.get();
  },
  markerUrl() {
    return this.markerId ? `url(#${this.markerId})` : '';
  },
});

Template.dependencyOverlay.events({
  'click .dependency-line'(event) {
    event.preventDefault();
    event.stopPropagation();
    // `this` is the line data object (fromId/toId/type/color/icon).
    Popup.open('dependencyLine').call(this, event);
  },
});

// #3392: popup to edit or delete an on-board dependency line. Data context is the
// line object { fromId, toId, type, color, icon }.
Template.dependencyLinePopup.helpers({
  typeOption() {
    const current = this.type;
    return DEPENDENCY_TYPES.map(t => ({
      id: t.id,
      label: `dependency-type-${t.id}`,
      selected: t.id === current,
    }));
  },
  color() {
    return this.color;
  },
  dependencyIcons() {
    const current = this.icon;
    return DEPENDENCY_ICON_CHOICES.map(name => ({ name, selected: name === current }));
  },
});

Template.dependencyLinePopup.events({
  'change .js-line-type'(event) {
    const card = ReactiveCache.getCard(this.fromId);
    if (card) card.setDependencyProps(this.toId, { type: event.currentTarget.value });
  },
  'change .js-line-color'(event) {
    const card = ReactiveCache.getCard(this.fromId);
    if (card) card.setDependencyProps(this.toId, { color: event.currentTarget.value });
  },
  'click .js-line-icon'(event) {
    const card = ReactiveCache.getCard(this.fromId);
    if (card) card.setDependencyProps(this.toId, { icon: event.currentTarget.dataset.icon });
  },
  'click .js-line-delete'() {
    const card = ReactiveCache.getCard(this.fromId);
    if (card) card.removeDependency(this.toId);
    Popup.back();
  },
});
