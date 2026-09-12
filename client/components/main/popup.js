import { CSSEvents } from '/client/lib/cssEvents';
import { isMobileViewportNow } from '/client/lib/responsiveUtils';
import { trapTabKey } from '/client/lib/accessibility';

// Keep the popup anchored while resizing and retain every control at its
// initial height. Pointer capture prevents releasing outside from closing it.
function resizeDatePopup(element, width, height) {
  const bounds = element.getBoundingClientRect();
  const availableWidth = Math.max(0, window.innerWidth - bounds.left - 12);
  const availableHeight = Math.max(0, window.innerHeight - bounds.top - 12);
  const minimumHeight = Number(element.dataset.resizeMinimumHeight) || bounds.height;
  element.dataset.resizeMinimumHeight = String(minimumHeight);
  element.style.setProperty('width', `${Math.min(availableWidth, Math.max(Math.min(320, availableWidth), width))}px`, 'important');
  element.style.setProperty('height', `${Math.min(availableHeight, Math.max(Math.min(minimumHeight, availableHeight), height))}px`, 'important');
}

Popup.template.events({
  'pointerdown .header'(evt, tpl) {
    const element = evt.currentTarget.closest('.pop-over');
    if (evt.button !== 0 || !element.querySelector('.edit-date') ||
        evt.target.closest('a, button, input, select')) return;
    evt.preventDefault(); evt.stopPropagation();
    const bounds = element.getBoundingClientRect();
    tpl._dateMove = { element, pointerId: evt.pointerId, x: evt.clientX, y: evt.clientY,
      left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    evt.currentTarget.setPointerCapture(evt.pointerId);
  },
  'pointermove .header'(evt, tpl) {
    const drag = tpl._dateMove;
    if (!drag || drag.pointerId !== evt.pointerId) return;
    evt.preventDefault(); evt.stopPropagation();
    const left = Math.max(12, Math.min(window.innerWidth - drag.width - 12, drag.left + evt.clientX - drag.x));
    const top = Math.max(12, Math.min(window.innerHeight - drag.height - 12, drag.top + evt.clientY - drag.y));
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
      width: bounds.width, height: bounds.height };
    evt.currentTarget.setPointerCapture(evt.pointerId);
  },
  'pointermove .js-date-popup-resize'(evt, tpl) {
    const drag = tpl._dateResize;
    if (!drag || drag.pointerId !== evt.pointerId) return;
    evt.preventDefault(); evt.stopPropagation();
    resizeDatePopup(drag.element, drag.width + evt.clientX - drag.x, drag.height + evt.clientY - drag.y);
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
    resizeDatePopup(element, bounds.width + width, bounds.height + height);
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
  this._focusTrap = event => trapTabKey(event, this._popupElement);
  this._popupElement?.addEventListener('keydown', this._focusTrap);

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
  this._popupElement?.removeEventListener('keydown', this._focusTrap);
});
