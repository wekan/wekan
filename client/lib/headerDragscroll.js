// Drag-to-scroll starting on the two top header bars.
//
// Everywhere else a drag scrolls: `.board-canvas.dragscroll` on a board, and
// `<body>` / `#content` on the whole-page layouts (see client/lib/pageDragscroll.js).
// The header bars were the one dead area - grabbing the quick-access bar or the
// board bar and dragging did nothing, so on a phone, where those two bars take a
// large share of the screen, most of what you could put a finger on was unscrollable.
//
// They cannot simply be tagged `.dragscroll`: that class scrolls the element that
// carries it, and neither bar is a scroll container - `#header` has no overflow and
// sits OUTSIDE `#content` and outside the board canvas. So a drag that starts here
// is forwarded to whichever element actually scrolls:
//
//   1. a scrollable container under the pointer, inside the header itself - the
//      starred-boards list is `overflow-x: auto` and does overflow once you star a
//      few boards, so dragging it scrolls it sideways rather than the page;
//   2. otherwise the board canvas, when we are on a board;
//   3. otherwise the page scroller: `#content` in mobile mode (where `<body>` is
//      position:fixed), `<body>` on desktop.
//
// Mouse and touch are both handled here. The @wekanteam/dragscroll library is
// mouse-only and element-bound, and client/lib/dragscrollTouch.js only picks
// `.dragscroll` ancestors, so neither can express "drag here, scroll there".
//
// Clicks still work: scrolling only begins after the pointer has moved past a small
// threshold, and only then is the click that ends the gesture swallowed - otherwise
// dragging across the bar would fire whatever button you happened to let go over.

const HEADER_SELECTOR = '#header-quick-access, #header';

// Threshold in px before a press becomes a drag. Small enough to feel immediate,
// large enough that a tap with a shaky finger is still a tap.
const DRAG_THRESHOLD = 4;

let active = null;
let dragged = false;

function isExcluded(target) {
  return !!(
    target.closest &&
    // Form fields keep their own behaviour (the zoom-level input lives in the
    // quick-access bar), and `.nodragscroll` opts an element out explicitly.
    target.closest('input, select, textarea, .note-editable, .nodragscroll')
  );
}

function canScroll(el) {
  return (
    el && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
  );
}

// A scroll container between the pointer and the header bar - the starred-boards
// list. Walking up ourselves rather than using closest() because we are looking for
// a computed property, not a class.
function scrollableInsideHeader(target, header) {
  let el = target;
  while (el && el !== header) {
    if (el.nodeType === 1 && canScroll(el)) {
      const overflow = getComputedStyle(el).overflow + getComputedStyle(el).overflowX;
      if (/auto|scroll/.test(overflow)) return el;
    }
    el = el.parentElement;
  }
  return null;
}

// Where a drag on the header should send its scrolling.
export function resolveScrollTarget(target, header) {
  const inside = scrollableInsideHeader(target, header);
  if (inside) return inside;
  const canvas = document.querySelector('.board-canvas');
  if (canScroll(canvas)) return canvas;
  const content = document.getElementById('content');
  if (canScroll(content)) return content;
  return document.scrollingElement || document.body;
}

function start(clientX, clientY, target) {
  active = null;
  dragged = false;
  if (isExcluded(target)) return;
  const header = target.closest && target.closest(HEADER_SELECTOR);
  if (!header) return;
  const el = resolveScrollTarget(target, header);
  if (!el) return;
  active = {
    el,
    startX: clientX,
    startY: clientY,
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop,
  };
}

// Returns true once the gesture counts as a drag, so the caller can suppress the
// browser's own default (text selection, page rubber-banding).
function move(clientX, clientY) {
  if (!active) return false;
  const dx = clientX - active.startX;
  const dy = clientY - active.startY;
  if (!dragged && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
    return false;
  }
  dragged = true;
  active.el.scrollLeft = active.scrollLeft - dx;
  active.el.scrollTop = active.scrollTop - dy;
  return true;
}

function onMouseDown(e) {
  // Left button only: a right-click opens the context menu, a middle-click pastes.
  if (e.button !== 0) return;
  start(e.clientX, e.clientY, e.target);
}

function onMouseMove(e) {
  // Stop the browser selecting the header text under the moving pointer.
  if (move(e.clientX, e.clientY)) e.preventDefault();
}

function onMouseUp() {
  active = null;
}

// A drag must not also activate the button it ends on. Capture phase, so this runs
// before the component's own click handler.
function onClick(e) {
  if (!dragged) return;
  dragged = false;
  e.preventDefault();
  e.stopPropagation();
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  start(touch.clientX, touch.clientY, e.target);
}

function onTouchMove(e) {
  if (!active || e.touches.length !== 1) return;
  const touch = e.touches[0];
  // We own the gesture once it is a drag: suppress rubber-banding and the
  // synthetic mouse events that would otherwise scroll a second time.
  if (move(touch.clientX, touch.clientY) && e.cancelable) e.preventDefault();
}

function onTouchEnd() {
  active = null;
}

// Guard so importing this from more than one place still attaches the listeners once.
if (typeof document !== 'undefined' && !window.__wekanHeaderDragscroll) {
  window.__wekanHeaderDragscroll = true;
  document.addEventListener('mousedown', onMouseDown, { passive: true });
  document.addEventListener('mousemove', onMouseMove, { passive: false });
  document.addEventListener('mouseup', onMouseUp, { passive: true });
  document.addEventListener('click', onClick, true);
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', onTouchEnd, { passive: true });
}
