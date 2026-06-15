import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Utils } from '/client/lib/utils';

// #3392: PI Program Board "Red Strings".
// Draw colored connection lines (SVG paths) between cards that declare
// cardDependencies. Coordinates are computed from the live DOM
// (getBoundingClientRect of [data-card-id] minicards) translated into the
// overlay SVG's own coordinate space, so scrolling/resizing is handled by
// recomputing relative to the SVG's current bounding rect.

Template.dependencyOverlay.onCreated(function () {
  this.lines = new ReactiveVar([]);

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
    cards.forEach(card => {
      const deps = card.cardDependencies || [];
      if (deps.length === 0) {
        return;
      }
      const from = centerOf(card._id);
      if (!from) {
        return;
      }
      deps.forEach(targetId => {
        const to = centerOf(targetId);
        if (!to) {
          return;
        }
        // Connect from the right edge of the source card to the left edge
        // of the target card, with a horizontal cubic curve for readability.
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y + to.h / 2;
        const dx = Math.max(40, Math.abs(x2 - x1) / 2);
        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        lines.push({ path });
      });
    });
    this.lines.set(lines);
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
});
