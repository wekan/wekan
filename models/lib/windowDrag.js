'use strict';

// Moving a window - the opened card, a popup - with a finger as well as a mouse.
// The decisions only, apart from the DOM, so plain Node tests can drive them.
//
// A mouse sends mousedown / mousemove / mouseup; a finger sends none of them while it
// moves (only a click after a tap), so a window moved by those events could not be
// moved on an iPad at all, while the page behind it scrolled. Pointer Events carry
// both, and a drag area also needs `touch-action: none`, or the browser takes the
// gesture for a scroll and cancels the pointer.

const TOUCH_THRESHOLD = 8; // px a finger may wobble in a tap
const MOUSE_THRESHOLD = 4;

// What a press on the card's header row does. All booleans are about the pressed
// element:
//   onEditable      an input, textarea, select or option, or the open title editor:
//                   the browser keeps those (text selection, caret)
//   onTitleEditZone the title, which edits - all of it
//   onHandle        the drag handle
//   cardHasHandle   drag handles are on for this card: the handle is then the only
//                   thing that moves the window
//   onControl       a link or button (the collapse caret, close, maximize, menu):
//                   a tap does its job, a DRAG moves the window
// Returns { start, deferred }: whether the press can move the window, and whether it
// waits for the finger or mouse to move first (so a tap on a control still works).
function cardHeaderPress({ onEditable, onTitleEditZone, onHandle, cardHasHandle, onControl }) {
  if (onHandle) return { start: true, deferred: false };
  if (onEditable || onTitleEditZone) return { start: false, deferred: false };
  if (cardHasHandle) return { start: false, deferred: false };

  return { start: true, deferred: !!onControl };
}

function dragThreshold(pointerType, deferred) {
  if (!deferred) return 0;

  return pointerType === 'mouse' ? MOUSE_THRESHOLD : TOUCH_THRESHOLD;
}

function passedThreshold(dx, dy, threshold) {
  return Math.hypot(dx, dy) >= threshold;
}

// Keeps a window where it can be found again: at least `keep` px of its top-left
// strip stays inside the viewport, so its header can always be grabbed.
function clampWindow(left, top, width, viewport, keep = 48) {
  const minLeft = keep - width;
  const maxLeft = viewport.width - keep;
  const maxTop = viewport.height - keep;

  return {
    left: Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft)),
    top: Math.min(Math.max(top, 0), Math.max(0, maxTop)),
  };
}

module.exports = { cardHeaderPress, dragThreshold, passedThreshold, clampWindow, TOUCH_THRESHOLD, MOUSE_THRESHOLD };
