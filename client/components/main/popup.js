import { CSSEvents } from '/client/lib/cssEvents';
import { isMobileViewportNow } from '/client/lib/responsiveUtils';

Popup.template.events({
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
