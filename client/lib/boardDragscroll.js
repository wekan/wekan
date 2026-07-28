import dragscroll from '@wekanteam/dragscroll';

// ============================================================================
// Drag-to-scroll stands down while something is being DRAGGED (#6558).
//
// "Moving cards behaves weirdly": on a board large enough to have scrollbars in
// both directions, dragging a card sometimes moved the card, sometimes scrolled
// the list, sometimes scrolled the whole board - and often several of those at
// the same time, which makes dropping a card where it was aimed nearly
// impossible.
//
// Why: a board has SEVERAL nested elements carrying the `dragscroll` class -
// `.board-canvas`, every `.swimlane` and every `.js-lists` lane. The library
// binds its own mousedown/mousemove to each of them independently, so ONE press
// can start a pan on the lane AND on the canvas, while jQuery UI sortable is
// dragging the card with the same pointer. Three things then move at once.
//
// swimlanes.js already tried to disable dragscroll while a LIST is dragged, but
// in the wrong order: it called `dragscroll.reset()` first and removed the class
// afterwards. reset() unbinds what it bound before and re-binds whatever carries
// the class AT THAT MOMENT, so removing the class after it changed nothing - the
// listeners stayed. The class has to go first, and the canvas has to be included,
// which is what this module does. Cards had no such attempt at all, which is why
// the report is about cards.
//
// suspend() remembers exactly which elements were tagged and restores that same
// set, so nothing becomes drag-scrollable that was not before (the board routes
// deliberately leave <body>/#content untagged - see client/lib/pageDragscroll.js).
// It is a no-op when already suspended, so nested drags cannot lose the original
// set. A window-level mouseup/touchend/dragend restores as well, so a drag that
// ends without its sortable `stop` - a re-render or sortable('destroy') mid-drag
// - can never leave the board unable to pan.
// ============================================================================

// The elements whose `dragscroll` class we took away, or null when not suspended.
let suspendedEls = null;

function restore() {
  if (!suspendedEls) return;
  const els = suspendedEls;
  suspendedEls = null;
  els.forEach(el => el.classList.add('dragscroll'));
  try {
    dragscroll.reset();
  } catch (e) {
    /* the library is not loaded in tests / SSR */
  }
}

function onPointerEnd() {
  restore();
}

export function suspendBoardDragscroll() {
  if (suspendedEls || typeof document === 'undefined') return;

  suspendedEls = Array.prototype.slice.call(
    document.getElementsByClassName('dragscroll'),
  );
  suspendedEls.forEach(el => el.classList.remove('dragscroll'));
  // AFTER the class is gone: reset() re-binds to what is tagged now, i.e. to
  // nothing on the board, which also cancels a pan that is already under way.
  try {
    dragscroll.reset();
  } catch (e) {
    /* the library is not loaded in tests / SSR */
  }

  // Safety net for a drag that never reaches its `stop` handler.
  window.addEventListener('mouseup', onPointerEnd, true);
  window.addEventListener('touchend', onPointerEnd, true);
  window.addEventListener('dragend', onPointerEnd, true);
}

export function resumeBoardDragscroll() {
  window.removeEventListener('mouseup', onPointerEnd, true);
  window.removeEventListener('touchend', onPointerEnd, true);
  window.removeEventListener('dragend', onPointerEnd, true);
  restore();
}

export function isBoardDragscrollSuspended() {
  return suspendedEls !== null;
}

// dragscroll.reset() for callers that re-scan the board when its DOM changes
// (boardBody.js). While a drag is suspended, a swimlane or lane re-rendered
// mid-drag arrives with `dragscroll` in its markup again; binding it would put
// a pan back under the pointer that is dragging a card. Take the class off the
// newcomers too - and remember them, so they are restored with the rest.
export function resetBoardDragscroll() {
  if (typeof document !== 'undefined' && suspendedEls) {
    const tagged = Array.prototype.slice.call(
      document.getElementsByClassName('dragscroll'),
    );
    tagged.forEach(el => {
      el.classList.remove('dragscroll');
      if (!suspendedEls.includes(el)) suspendedEls.push(el);
    });
  }
  try {
    dragscroll.reset();
  } catch (e) {
    /* the library is not loaded in tests / SSR */
  }
}
