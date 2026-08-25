'use strict';

// Run a touch bridge's end handler while suppressing only the click it emits
// synchronously after a completed drag. Ordinary taps do not pass wasDragging,
// and later independent clicks are unaffected because the listener is removed
// before this function returns.
function runTouchEndWithoutPostDragClick(wasDragging, target, touchEnd) {
  if (!wasDragging || !target || typeof target.addEventListener !== 'function') {
    return touchEnd();
  }

  const suppressClick = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const listenerOptions = { capture: true };
  target.addEventListener('click', suppressClick, listenerOptions);
  try {
    return touchEnd();
  } finally {
    target.removeEventListener('click', suppressClick, listenerOptions);
  }
}

module.exports = { runTouchEndWithoutPostDragClick };
