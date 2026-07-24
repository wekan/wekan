// Touch -> HTML5 drag-and-drop bridge.
//
// HTML5 drag-and-drop (`draggable="true"` + dragstart/dragover/drop) never fires
// from touch in any browser, so on a touchscreen you cannot drag the things that
// use it - the All Boards board icons, and a few other HTML5-DnD spots. This
// module makes a finger drive those SAME handlers: a long press on a draggable
// element starts a synthetic drag that dispatches real, bubbling
// dragstart/dragenter/dragover/dragleave/drop/dragend DOM events (with a
// dataTransfer shim), so every existing delegated DnD handler works unchanged.
//
// Design choices that matter:
//   * LONG PRESS to start (250 ms). A quick swipe on a draggable element still
//     scrolls; only a deliberate hold-then-move begins a drag. Without this you
//     could not scroll a list of draggable tiles by touch.
//   * It dispatches a `mousedown` on the pressed element first, so handlers that
//     record where the press began (e.g. the board reorder's handle gate, which
//     reads `mousedown .js-board`) see the right target from touch too.
//   * setDragImage from a handler is honoured, so the drag ghost is centred on
//     the finger exactly as it is centred on the cursor for a mouse.
//   * It coexists with dragscrollTouch.js: that module already skips
//     `.nodragscroll` / `.handle` (which the board tiles and handle carry), and
//     this one only acts once a drag has actually started, calling
//     preventDefault so the two never both own a gesture.
//
// Unlike dragscrollTouch, this is NOT skipped on iOS - touch DnD is needed there.

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 10; // finger moving this far before the hold = a scroll

// Never start a touch-drag from these - form fields keep their own behaviour,
// and jQuery-UI sortables (lists / swimlanes / cards) already have touch via
// touch-punch, so leave them to it.
const EXCLUDE =
  'input, select, textarea, .note-editable, .ui-sortable, .ui-sortable-handle';

function draggableAncestor(el) {
  while (el && el !== document.body) {
    if (el.getAttribute && el.getAttribute('draggable') === 'true') return el;
    el = el.parentNode;
  }
  return null;
}

// Minimal dataTransfer: enough for the handlers in this app (get/setData,
// dropEffect/effectAllowed, setDragImage, types).
function makeDataTransfer() {
  const store = {};
  const dt = {
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    setData(type, val) {
      store[type] = String(val);
    },
    getData(type) {
      return Object.prototype.hasOwnProperty.call(store, type) ? store[type] : '';
    },
    clearData(type) {
      if (type) delete store[type];
      else Object.keys(store).forEach((k) => delete store[k]);
    },
    setDragImage(img, x, y) {
      dt._dragImage = { img, x: x || 0, y: y || 0 };
    },
  };
  Object.defineProperty(dt, 'types', {
    get() {
      return Object.keys(store);
    },
  });
  return dt;
}

// Dispatch a native, bubbling drag event of `type` on `target`, carrying our
// dataTransfer shim and the finger's coordinates, so delegated jQuery/Blaze
// handlers reading evt.originalEvent.{dataTransfer,clientX,clientY} work.
function fireDnD(type, target, dataTransfer, clientX, clientY, relatedTarget) {
  if (!target) return null;
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer, enumerable: true });
  ev.clientX = clientX;
  ev.clientY = clientY;
  ev.pageX = clientX + window.scrollX;
  ev.pageY = clientY + window.scrollY;
  if (relatedTarget) ev.relatedTarget = relatedTarget;
  target.dispatchEvent(ev);
  return ev;
}

let pending = null; // { srcEl, startTouchTarget, startX, startY, timer, armed }
let drag = null; // active drag: { srcEl, dt, ghost, offX, offY, lastTarget }

function makeGhost(srcEl, dt, clientX, clientY) {
  const spec = dt._dragImage;
  const model = (spec && spec.img) || srcEl;
  const rect = model.getBoundingClientRect();
  const ghost = model.cloneNode(true);
  ghost.style.position = 'fixed';
  ghost.style.left = '0';
  ghost.style.top = '0';
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.margin = '0';
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.75';
  ghost.style.zIndex = '100000';
  ghost.style.transition = 'none';
  ghost.classList.add('touch-drag-ghost');
  document.body.appendChild(ghost);
  // Offset of the finger within the ghost: honour setDragImage, else centre it.
  const offX = spec ? spec.x : rect.width / 2;
  const offY = spec ? spec.y : rect.height / 2;
  return { ghost, offX, offY };
}

function moveGhost() {
  if (!drag || !drag.ghost) return;
  drag.ghost.style.transform =
    `translate(${drag.lastX - drag.offX}px, ${drag.lastY - drag.offY}px)`;
}

function elementUnder(x, y) {
  if (drag && drag.ghost) drag.ghost.style.display = 'none';
  const el = document.elementFromPoint(x, y);
  if (drag && drag.ghost) drag.ghost.style.display = '';
  return el;
}

function startDrag(clientX, clientY) {
  const srcEl = pending.srcEl;
  const dt = makeDataTransfer();
  // Let a handler that keys off the press location (the board reorder handle
  // gate) see where the finger actually pressed.
  fireDnD('mousedown', pending.startTouchTarget, dt, clientX, clientY);
  const startEv = fireDnD('dragstart', srcEl, dt, clientX, clientY);
  if (!startEv || startEv.defaultPrevented) {
    // A handler cancelled the drag (e.g. drag handles ON and the press was not
    // on the handle): behave like no drag.
    return false;
  }
  const { ghost, offX, offY } = makeGhost(srcEl, dt, clientX, clientY);
  drag = { srcEl, dt, ghost, offX, offY, lastTarget: null, lastX: clientX, lastY: clientY };
  moveGhost();
  return true;
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  const target = e.target;
  if (target.closest && target.closest(EXCLUDE)) return;
  const srcEl = draggableAncestor(target);
  if (!srcEl) return;
  pending = {
    srcEl,
    startTouchTarget: target,
    startX: t.clientX,
    startY: t.clientY,
    armed: false,
    timer: setTimeout(() => {
      if (pending) pending.armed = true;
    }, LONG_PRESS_MS),
  };
}

function onTouchMove(e) {
  if (drag) {
    // A drag is in progress: we own the gesture.
    const t = e.touches[0];
    drag.lastX = t.clientX;
    drag.lastY = t.clientY;
    moveGhost();
    const under = elementUnder(t.clientX, t.clientY);
    if (under !== drag.lastTarget) {
      if (drag.lastTarget) fireDnD('dragleave', drag.lastTarget, drag.dt, t.clientX, t.clientY, under);
      if (under) fireDnD('dragenter', under, drag.dt, t.clientX, t.clientY, drag.lastTarget);
      drag.lastTarget = under;
    }
    if (under) fireDnD('dragover', under, drag.dt, t.clientX, t.clientY);
    if (e.cancelable) e.preventDefault(); // stop scrolling while dragging
    return;
  }
  if (!pending) return;
  const t = e.touches[0];
  const moved = Math.hypot(t.clientX - pending.startX, t.clientY - pending.startY);
  if (!pending.armed) {
    // Moved before the long press completed => treat as a scroll, not a drag.
    if (moved > MOVE_CANCEL_PX) {
      clearTimeout(pending.timer);
      pending = null;
    }
    return;
  }
  // Armed (held long enough) and now moving => begin the drag.
  const ok = startDrag(t.clientX, t.clientY);
  clearTimeout(pending.timer);
  pending = null;
  if (ok && e.cancelable) e.preventDefault();
}

function endDrag(clientX, clientY) {
  const t = drag;
  drag = null;
  const under = elementUnder(clientX, clientY);
  if (under) fireDnD('drop', under, t.dt, clientX, clientY);
  fireDnD('dragend', t.srcEl, t.dt, clientX, clientY);
  if (t.ghost && t.ghost.parentNode) t.ghost.parentNode.removeChild(t.ghost);
}

function onTouchEnd(e) {
  if (pending) {
    clearTimeout(pending.timer);
    pending = null;
  }
  if (drag) {
    const t = (e.changedTouches && e.changedTouches[0]) || {};
    endDrag(t.clientX || drag.lastX, t.clientY || drag.lastY);
  }
}

function onTouchCancel() {
  if (pending) {
    clearTimeout(pending.timer);
    pending = null;
  }
  if (drag) {
    // Cancelled: end the source's drag and drop nothing.
    fireDnD('dragend', drag.srcEl, drag.dt, drag.lastX, drag.lastY);
    if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    drag = null;
  }
}

// Attach once, even if imported from several places.
if (typeof document !== 'undefined' && !window.__wekanDragDropTouch) {
  window.__wekanDragDropTouch = true;
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', onTouchCancel, { passive: true });
}
