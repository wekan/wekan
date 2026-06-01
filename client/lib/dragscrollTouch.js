// Native one-finger touch scrolling for `.dragscroll` containers.
//
// The @wekanteam/dragscroll library only listens for mouse events
// (mousedown / mousemove / mouseup). On iPad / iPhone Safari finger
// scrolling of those containers works anyway, because they are also native
// overflow scrollers with momentum scrolling. But on Fairphone 4 postmarketOS
// Firefox and on the newer Ubuntu Touch Morph Browser, dragging a finger over
// a `.dragscroll` container (All Boards list, board canvas, swimlanes, lists,
// calendar) did not scroll it, because those browsers do not emit the
// synthetic mouse events dragscroll relies on.
//
// This module adds real touch handling so a one-finger drag scrolls the
// nearest `.dragscroll` ancestor on every touch browser. It mirrors the
// behaviour of dragscroll's mouse handler (same `.nodragscroll` / form-field
// exclusions) and is delegated on `document`, so it also covers `.dragscroll`
// elements that are added or replaced reactively without needing a reset.
//
// iOS is intentionally skipped: there finger scrolling already works natively
// (with momentum), and taking it over with preventDefault would only remove
// that momentum.

const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);

let active = null;

function isExcluded(target) {
  return !!(
    target.closest &&
    target.closest(
      // Form fields and editors must keep their own touch behaviour, and
      // `.nodragscroll` opts an element out explicitly. `.handle` (the
      // swimlane/list drag handles, .js-swimlane-header-handle /
      // .js-list-handle) must be excluded too: those start a jQuery UI
      // sortable reorder via touch-punch, and hijacking the touch to scroll
      // here would block dragging the handle to reorder swimlanes/lists.
      'input, select, textarea, .note-editable, .nodragscroll, .handle, .ui-sortable-handle',
    )
  );
}

function canScroll(el) {
  return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
}

function onTouchStart(e) {
  active = null;
  if (e.touches.length !== 1) return;
  const target = e.target;
  if (isExcluded(target)) return;
  const el = target.closest && target.closest('.dragscroll');
  if (!el || !canScroll(el)) return;
  const touch = e.touches[0];
  active = {
    el,
    startX: touch.clientX,
    startY: touch.clientY,
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop,
  };
}

function onTouchMove(e) {
  if (!active || e.touches.length !== 1) return;
  const touch = e.touches[0];
  const el = active.el;
  el.scrollLeft = active.scrollLeft - (touch.clientX - active.startX);
  el.scrollTop = active.scrollTop - (touch.clientY - active.startY);
  // We own the gesture: suppress page rubber-banding and the synthetic mouse
  // events that would otherwise double-scroll through dragscroll.
  if (e.cancelable) e.preventDefault();
}

function onTouchEnd() {
  active = null;
}

// Guard so importing this module from more than one place (boardBody,
// boardsList, ...) still only attaches the listeners once.
if (!isIOS && typeof document !== 'undefined' && !window.__wekanDragscrollTouch) {
  window.__wekanDragscrollTouch = true;
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', onTouchEnd, { passive: true });
}
