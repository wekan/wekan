import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';
import {
  dependencyTypeMeta,
  normalizeDependencies,
} from '/models/metadata/dependencies';

// #3392: PI Program Board "Red Strings".
// Draw colored, typed connection lines (SVG paths) between cards that declare
// cardDependencies. Coordinates are computed from the live DOM
// (getBoundingClientRect of [data-card-id] minicards) translated into the
// overlay SVG's own coordinate space, so scrolling/resizing is handled by
// recomputing relative to the SVG's current bounding rect. Each line uses the
// dependency's color, and directed relations (blocks/fixes and their reverses)
// draw an arrowhead pointing from the prerequisite card to the dependent card.

// Stable, css-safe marker id for an arrowhead of a given color.
function markerIdForColor(color) {
  return `dependency-arrowhead-${String(color).replace(/[^a-zA-Z0-9]/g, '')}`;
}

Template.dependencyOverlay.onCreated(function () {
  this.lines = new ReactiveVar([]);
  this.markers = new ReactiveVar([]);

  this.recompute = () => {
    const svg = this.find('.js-dependency-overlay');
    if (!svg) {
      return;
    }
    const board = Utils.getCurrentBoard();
    if (!board) {
      this.lines.set([]);
      return;
    }

    // Origin of the overlay in viewport coordinates; subtracting this from
    // card rects gives coordinates inside the SVG regardless of scroll.
    const svgRect = svg.getBoundingClientRect();

    const centerOf = cardId => {
      const el = document.querySelector(`[data-card-id="${cardId}"]`);
      if (!el) {
        return null;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        return null;
      }
      return {
        rect: r,
        x: r.left - svgRect.left,
        y: r.top - svgRect.top,
        w: r.width,
        h: r.height,
      };
    };

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
          directed: meta.directed,
          markerId: meta.directed ? markerId : '',
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
  this.scrollEl = this.find('.js-dependency-overlay')
    ? this.firstNode.closest('.board-canvas')
    : null;

  // Reactively recompute when card data (positions/dependencies) changes.
  this.autorun(() => {
    const board = Utils.getCurrentBoard();
    if (board) {
      // Touch reactive sources so we recompute on any card change.
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

  // Recompute shortly after render to catch late layout (minicards mounting).
  Meteor.setTimeout(() => instance.scheduleRecompute(), 300);
});

Template.dependencyOverlay.onDestroyed(function () {
  if (this.scrollEl) {
    this.scrollEl.removeEventListener('scroll', this.onScroll);
  }
  window.removeEventListener('scroll', this.onScroll);
  window.removeEventListener('resize', this.onResize);
  if (this._raf) {
    window.cancelAnimationFrame(this._raf);
  }
});

Template.dependencyOverlay.helpers({
  dependencyLines() {
    return Template.instance().lines.get();
  },
  dependencyMarkers() {
    return Template.instance().markers.get();
  },
  markerUrl() {
    // `this` is a line; reference its arrowhead marker (empty for undirected).
    return this.markerId ? `url(#${this.markerId})` : '';
  },
});
