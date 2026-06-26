import dragscroll from '@wekanteam/dragscroll';
import '/client/lib/dragscrollTouch';

// Enable / disable mouse drag-to-scroll for whole-page layouts (All Boards,
// My Cards, Login, Register).
//
// The dragscroll library scrolls whichever element carries the `dragscroll`
// class AND is the actual scroll container. Which element that is depends on
// the layout and on mobile vs desktop mode:
//
//   * Login / Register (userFormsLayout) have no `#content`; the page scroll
//     container is `<body>` in both modes (it has `overflow-y: auto` and a
//     `100vh` height).
//   * All Boards / My Cards (defaultLayout) render inside `#content`. On
//     desktop the scroll container is `<body>`; in mobile mode `<body>` becomes
//     `position: fixed` and `#content` becomes the scroller
//     (`overflow-y: auto; height: calc(100vh - 48px)`), so tagging only
//     `<body>` would never scroll on a phone.
//
// To cover every case we tag BOTH `<body>` and `#content` (when present). Only
// the element that actually overflows scrolls, so there is no double-scroll:
// on desktop `<body>` scrolls and `#content` (no vertical overflow) is a no-op;
// in mobile mode `#content` scrolls and `<body>` (fixed, no overflow) is a
// no-op. dragscroll has a dedicated `el == document.body` branch for the body
// case. dragscroll.reset() re-scans the DOM and (re)binds the mouse listeners.
// One-finger touch scrolling is handled by client/lib/dragscrollTouch.js, which
// picks the nearest scrollable `.dragscroll` ancestor (so `#content` wins over
// `<body>` when both are tagged).

function pageScrollEls() {
  const els = [document.body];
  const content = document.getElementById('content');
  if (content) els.push(content);
  return els;
}

export function enablePageDragscroll() {
  pageScrollEls().forEach(el => el.classList.add('dragscroll'));
  dragscroll.reset();
}

export function disablePageDragscroll() {
  pageScrollEls().forEach(el => el.classList.remove('dragscroll'));
  dragscroll.reset();
}
