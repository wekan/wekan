import { ReactiveVar } from 'meteor/reactive-var';
import { updatePopupMenuColumns } from '/client/lib/popupMenuLayout';
import { CSSEvents } from '/client/lib/cssEvents';
import { isMobileViewportNow } from '/client/lib/responsiveUtils';
import { trapTabKey } from '/client/lib/accessibility';
import { keptInside } from '/client/lib/popupBounds';

// Anchor the opposite edge while dragging the bottom inline-end corner.
function resizeDatePopup(element, width, height) {
  const bounds = element.getBoundingClientRect();
  const rtl = window.getComputedStyle(element).direction === 'rtl';
  const right = bounds.left + bounds.width;
  const availableWidth = Math.max(0, rtl ? right - 12 : window.innerWidth - bounds.left - 12);
  const availableHeight = Math.max(0, window.innerHeight - bounds.top - 12);
  const minimumHeight = Number(element.dataset.resizeMinimumHeight) || Math.min(160, bounds.height);
  element.dataset.resizeMinimumHeight = String(minimumHeight);
  const nextWidth = Math.min(availableWidth, Math.max(Math.min(320, availableWidth), width));
  const nextHeight = Math.min(availableHeight, Math.max(Math.min(minimumHeight, availableHeight), height));
  element.dataset.userResized = 'true';
  // Existing popup types may use centered logical insets or fullscreen sizes.
  // Freeze viewport coordinates before applying the user's dimensions.
  const styles = {
    position: 'fixed', 'inset-inline-start': 'auto', 'inset-inline-end': 'auto',
    right: 'auto', bottom: 'auto', left: `${rtl ? right - nextWidth : bounds.left}px`,
    top: `${bounds.top}px`, margin: '0', 'min-width': '0', 'min-height': '0',
    'max-width': `${availableWidth}px`, 'max-height': `${availableHeight}px`,
    width: `${nextWidth}px`, height: `${nextHeight}px`,
  };
  Object.entries(styles).forEach(([key, value]) => element.style.setProperty(key, value, 'important'));
}

// #6839: EVERY popup is moved like the opened card: by its title bar when drag
// handles are off, by the drag handle before its title when they are on - the
// handle alone, then, as the card's. These are the popups that may also GROW
// past the window while open (Drawing replacing a menu), so they are kept
// inside it as they grow; so is any popup the user has dragged.
const MOVABLE_POPUPS = new Set(['boardViewSettingsPopup', 'cardDrawingPopup', 'boardCardSettingsPopup']);
// Popups with the opened card's maximize / minimize button.
const MAXIMIZABLE_POPUPS = new Set(['cardDrawingPopup', 'boardCardSettingsPopup']);

const maximizedKey = name => `wekan-popup-maximized-${name}`;
function rememberedMaximized(name) {
  try { return window.localStorage.getItem(maximizedKey(name)) === 'true'; } catch (e) { return false; }
}
function rememberMaximized(name, on) {
  try { window.localStorage.setItem(maximizedKey(name), on ? 'true' : 'false'); } catch (e) { /* a preference */ }
}

// Maximizing takes the popup out of wherever it was dragged or resized to: the
// inline !important coordinates those leave would beat the stylesheet. They are
// kept, and minimizing puts the popup back exactly there.
function setPopupMaximized(element, on) {
  if (!element) return;
  if (on && !element.classList.contains('pop-over--maximized')) {
    element.dataset.restoreStyle = element.getAttribute('style') || '';
    ['left', 'top', 'right', 'bottom', 'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
      'inset-inline-start', 'inset-inline-end', 'margin', 'position'].forEach(p => element.style.removeProperty(p));
    element.classList.add('pop-over--maximized');
  } else if (!on && element.classList.contains('pop-over--maximized')) {
    element.classList.remove('pop-over--maximized');
    element.setAttribute('style', element.dataset.restoreStyle || '');
    delete element.dataset.restoreStyle;
  }
}

Popup.template.onCreated(function () {
  this.popupMaximized = new ReactiveVar(false);
});

Popup.template.helpers({
  popupMovable() {
    return true;
  },
  popupMaximizable() {
    return MAXIMIZABLE_POPUPS.has(this.popupName);
  },
  popupMaximized() {
    return Template.instance().popupMaximized.get();
  },
});

Popup.template.events({
  'click .js-popup-maximize, click .js-popup-minimize'(evt, tpl) {
    evt.preventDefault(); evt.stopPropagation();
    const on = evt.currentTarget.classList.contains('js-popup-maximize');
    setPopupMaximized(evt.currentTarget.closest('.pop-over'), on);
    tpl.popupMaximized.set(on);
    rememberMaximized(this.popupName, on);
  },
  'pointerdown .header'(evt, tpl) {
    const element = evt.currentTarget.closest('.pop-over');
    // A maximized popup has no place to be dragged to.
    // With drag handles on, the handle is the only thing that moves it.
    const handle = element.querySelector('.js-popup-drag-handle');
    if (evt.button !== 0 || element.classList.contains('pop-over--maximized') ||
        (handle && !evt.target.closest('.js-popup-drag-handle')) ||
        evt.target.closest('a, button, input, select')) return;
    evt.preventDefault(); evt.stopPropagation();
    const bounds = element.getBoundingClientRect();
    // Pin it where it is before it moves. A popup is placed by its margins, by
    // inset-inline-end (the member menu, at the right edge) or by left/top, so
    // `left: bounds.left` alone put some of them elsewhere - one jumped across
    // the window as the drag began. Set it, see where it went, and correct.
    const place = (left, top) => {
      element.style.setProperty('inset-inline-start', 'auto', 'important');
      element.style.setProperty('inset-inline-end', 'auto', 'important');
      element.style.setProperty('left', `${left}px`, 'important');
      element.style.setProperty('top', `${top}px`, 'important');
    };
    place(bounds.left, bounds.top);
    const placed = element.getBoundingClientRect();
    const left = bounds.left + (bounds.left - placed.left);
    const top = bounds.top + (bounds.top - placed.top);
    place(left, top);
    element.dataset.userMoved = 'true';
    tpl._dateMove = { element, pointerId: evt.pointerId, x: evt.clientX, y: evt.clientY,
      left, top, width: bounds.width, height: bounds.height,
      // The clamp keeps the popup's VISIBLE box 12px inside the window.
      dx: bounds.left - left, dy: bounds.top - top };
    evt.currentTarget.setPointerCapture(evt.pointerId);
  },
  'pointermove .header'(evt, tpl) {
    const drag = tpl._dateMove;
    if (!drag || drag.pointerId !== evt.pointerId) return;
    evt.preventDefault(); evt.stopPropagation();
    const boxLeft = Math.max(12, Math.min(window.innerWidth - drag.width - 12, drag.left + drag.dx + evt.clientX - drag.x));
    const boxTop = Math.max(12, Math.min(window.innerHeight - drag.height - 12, drag.top + drag.dy + evt.clientY - drag.y));
    const left = boxLeft - drag.dx;
    const top = boxTop - drag.dy;
    // Dragging uses physical pointer coordinates in either text direction.
    drag.element.style.setProperty('inset-inline-start', 'auto', 'important');
    drag.element.style.setProperty('inset-inline-end', 'auto', 'important');
    drag.element.style.setProperty('left', `${left}px`, 'important');
    drag.element.style.setProperty('top', `${top}px`, 'important');
  },
  'pointerup .header, pointercancel .header, lostpointercapture .header'(evt, tpl) {
    tpl._dateMove = null;
  },
  'pointerdown .js-date-popup-resize'(evt, tpl) {
    if (evt.button !== 0) return;
    evt.preventDefault(); evt.stopPropagation();
    const element = evt.currentTarget.closest('.pop-over');
    const bounds = element.getBoundingClientRect();
    tpl._dateResize = { element, pointerId: evt.pointerId, x: evt.clientX, y: evt.clientY,
      width: bounds.width, height: bounds.height,
      direction: window.getComputedStyle(element).direction === 'rtl' ? -1 : 1 };
    evt.currentTarget.setPointerCapture(evt.pointerId);
  },
  'pointermove .js-date-popup-resize'(evt, tpl) {
    const drag = tpl._dateResize;
    if (!drag || drag.pointerId !== evt.pointerId) return;
    evt.preventDefault(); evt.stopPropagation();
    resizeDatePopup(drag.element, drag.width + drag.direction * (evt.clientX - drag.x), drag.height + evt.clientY - drag.y);
  },
  'pointerup .js-date-popup-resize, pointercancel .js-date-popup-resize, lostpointercapture .js-date-popup-resize'(evt, tpl) {
    tpl._dateResize = null;
  },
  'click .js-date-popup-resize'(evt) { evt.preventDefault(); evt.stopPropagation(); },
  'keydown .js-date-popup-resize'(evt) {
    const offsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (!offsets[evt.key]) return;
    evt.preventDefault(); evt.stopPropagation();
    const element = evt.currentTarget.closest('.pop-over');
    const bounds = element.getBoundingClientRect();
    const [width, height] = offsets[evt.key];
    const direction = window.getComputedStyle(element).direction === 'rtl' ? -1 : 1;
    resizeDatePopup(element, bounds.width + direction * width, bounds.height + height);
  },
  'click .js-back-view'() {
    Popup.back();
  },
  'click .js-close-pop-over'() {
    Popup.close();
  },
  'click .js-confirm'() {
    // #6479: the action is stored on the Popup instance (see Popup.afterConfirm),
    // not on this data context, so a re-rendered/immutable context can't lose it.
    // Fall back to the legacy per-context field for any external caller.
    const action = Popup._afterConfirmAction || this.__afterConfirmAction;
    if (typeof action === 'function') {
      action.call(this);
    }
  },
  // #5942: On mobile/touch, tapping inside the card-detail sub-popups (assign
  // user / set due date) made the popup DISAPPEAR. The document-level
  // click-outside handler (EscapeActions in client/lib/popup.js) closes the
  // popup, and on touch some freshly-rendered children (avatars, native date
  // inputs) generated events that were not recognised as "inside the popup",
  // closing it before the tap could register. Stop touch/pointer events that
  // originate inside the popup from bubbling to that document handler so the
  // popup stays open and usable on mobile. Scoped to mobile viewports so the
  // desktop click-outside-to-close behaviour is untouched.
  'touchstart .pop-over, pointerdown .pop-over'(evt) {
    if (isMobileViewportNow()) {
      evt.stopPropagation();
    }
  },
  // This handler intends to solve a pretty tricky bug with our popup
  // transition. The transition is implemented using a large container
  // (.content-container) that is moved on the x-axis (from 0 to n*PopupSize)
  // inside a wrapper (.container-wrapper) with a hidden overflow. The problem
  // is that sometimes the wrapper is scrolled -- even if there are no
  // scrollbars. This happen for instance when the newly opened popup has some
  // focused field, the browser will automatically scroll the wrapper, resulting
  // in moving the whole popup container outside of the popup wrapper. To
  // disable this behavior we have to manually reset the scrollLeft position
  // whenever it is modified.
  'scroll .content-wrapper'(evt) {
    evt.currentTarget.scrollLeft = 0;
  },
});

// When a popup content is removed (ie, when the user press the "back" button),
// we need to wait for the container translation to end before removing the
// actual DOM element. For that purpose we use the undocumented `_uihooks` API.
Popup.template.onRendered(function () {
  this._popupElement = this.find('.js-pop-over');
  // A popup left maximized opens maximized again, and a new drawing (#6802,
  // client/lib/newDrawing.js) always does: the whole window. Reactive, because a
  // popup opened from another one - Drawing from the card's menu - replaces it in
  // the SAME rendered popup, and going back to the menu is not maximizable.
  this.autorun(() => {
    const data = Template.currentData() || {};
    const name = data.popupName;
    const newDrawing = Boolean(data.dataContext && data.dataContext.drawingNewFile);
    const maximized = MAXIMIZABLE_POPUPS.has(name) && (newDrawing || rememberedMaximized(name));
    this.popupMaximized.set(maximized);
    Tracker.afterFlush(() => setPopupMaximized(this._popupElement, maximized));
  });
  this._focusTrap = event => trapTabKey(event, this._popupElement);
  this._popupElement?.addEventListener('keydown', this._focusTrap);
  if (this._popupElement) {
    const update = () => {
      this._menuLayoutFrame = null;
      updatePopupMenuColumns(this._popupElement);
    };
    this._menuLayoutObserver = new MutationObserver(() => {
      if (this._menuLayoutFrame == null) this._menuLayoutFrame = requestAnimationFrame(update);
    });
    this._menuLayoutObserver.observe(this._popupElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    update();
    // A movable popup that grows - Drawing replacing the card's menu in this
    // same popup, at min(820px, 90vw) - is kept inside the window, by the
    // rule a drag keeps it there (client/lib/popupBounds.js). Not when
    // maximized: then it is the window.
    if (typeof ResizeObserver !== 'undefined') {
      const element = this._popupElement;
      this._boundsObserver = new ResizeObserver(() => {
        if (!(MOVABLE_POPUPS.has(element.dataset.popup) || element.dataset.userMoved)
          || element.classList.contains('pop-over--maximized')) return;
        const box = element.getBoundingClientRect();
        const moved = keptInside(box, window.innerWidth, window.innerHeight);
        if (!moved) return;
        element.style.setProperty('inset-inline-start', 'auto', 'important');
        element.style.setProperty('inset-inline-end', 'auto', 'important');
        element.style.setProperty('left', `${moved.left}px`, 'important');
        element.style.setProperty('top', `${moved.top}px`, 'important');
      });
      this._boundsObserver.observe(element);
    }
  }


  const container = this.find('.content-container');
  if (!container) {
    return;
  }
  container._uihooks = {
    removeElement(node) {
      $(node).addClass('no-height');
      $(container).one(CSSEvents.transitionend, () => {
        node.parentNode.removeChild(node);
      });
    },
  };
});

Popup.template.onDestroyed(function () {
  this._menuLayoutObserver?.disconnect();
  this._boundsObserver?.disconnect();
  if (this._menuLayoutFrame != null) cancelAnimationFrame(this._menuLayoutFrame);
  this._popupElement?.removeEventListener('keydown', this._focusTrap);
});
