import dragscroll from '@wekanteam/dragscroll';
import '/client/lib/dragscrollTouch';

// Enable / disable mouse drag-to-scroll for whole-page layouts.
//
// On pages like All Boards, Login and Register the scroll container is the
// <body> element itself (it has `overflow-y: auto; height: 100vh`), not an
// inner board canvas or swimlane. The dragscroll library scrolls whichever
// element carries the `dragscroll` class and has a dedicated `el ==
// document.body` branch that also scrolls document.documentElement, so tagging
// <body> makes dragging empty page space scroll the page — the same gesture
// that already works on the board swimlanes view.
//
// The class is toggled per template (onRendered / onDestroyed) so it only
// applies on those pages; dragscroll.reset() re-scans the DOM and (re)binds the
// mouse listeners after the class is added or removed. Touch (one-finger)
// scrolling is handled separately by client/lib/dragscrollTouch.js.

export function enablePageDragscroll() {
  document.body.classList.add('dragscroll');
  dragscroll.reset();
}

export function disablePageDragscroll() {
  document.body.classList.remove('dragscroll');
  dragscroll.reset();
}
