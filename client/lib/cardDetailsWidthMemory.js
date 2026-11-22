// #6939: the card details window opens at the width its user dragged it to, else
// at the Admin Panel's default percentage of the window, else 520px. The
// decision is models/lib/cardDetailsWidth.js; this is the browser half - the
// CSS custom property every window reads, and noticing that the resize handle
// was dragged. docs/Features/Cards/Card-Details-Width.md
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';

const widths = require('/models/lib/cardDetailsWidth');

// The Session answers at once after a drag, before the profile comes back; it
// holds a number, or null for "forgotten". Unset = read the stored one.
const SESSION_KEY = 'cardDetailsWidth';

function storedWidth() {
  const session = Session.get(SESSION_KEY);
  if (typeof session === 'number' || session === null) return session;
  const user = ReactiveCache.getCurrentUser();
  if (user && user.getCardDetailsWidth) return user.getCardDetailsWidth() ?? null;
  return Users.getPublicCardDetailsWidth ? Users.getPublicCardDetailsWidth() : null;
}

export function hasCardDetailsWidth() {
  return widths.clampUserWidth(storedWidth()) !== null;
}

export function saveCardDetailsWidth(width) {
  const value = width === null ? null : widths.clampUserWidth(width);
  if (width !== null && value === null) return;
  Session.set(SESSION_KEY, value);
  if (ReactiveCache.getCurrentUser()) {
    Meteor.call('setCardDetailsWidth', value);
  } else if (Users.setPublicCardDetailsWidth) {
    Users.setPublicCardDetailsWidth(value);
  }
}

// Forget the dragged width; the open windows go back to the default at once.
export function resetCardDetailsWidth() {
  saveCardDetailsWidth(null);
  document.querySelectorAll('.card-details').forEach(el => {
    el.style.width = '';
    el.style.height = '';
  });
  // Re-placed once the property is gone (the autorun below runs at the flush),
  // or they would measure the old width again (cardDetails.js resize handler).
  Tracker.afterFlush(() => window.dispatchEvent(new Event('resize')));
}

Meteor.startup(() => {
  Tracker.autorun(() => {
    const css = widths.cardDetailsWidthCss({
      userWidth: storedWidth(),
      defaultPercent: ReactiveCache.getCurrentSetting()?.cardDetailsDefaultWidthPercent,
    });
    const root = document.documentElement;
    if (css) root.style.setProperty(widths.CSS_PROPERTY, css);
    else root.style.removeProperty(widths.CSS_PROPERTY);
  });
});

const BOUND = 'data-wekan-width-memory';

// A press on the window's resize handle, then the release: the width it was
// dragged to is kept. A double-click on the handle forgets it. Not for the
// maximized card, nor in the mobile view, which have no handle.
export function rememberCardDetailsWidth(el) {
  if (!el || el.getAttribute(BOUND)) return;
  el.setAttribute(BOUND, '1');
  const rtl = () => document.documentElement.dir === 'rtl';
  const usable = () => document.body.classList.contains('desktop-mode')
    && !el.classList.contains('card-details-maximized');
  el.addEventListener('pointerdown', event => {
    if (!usable() || !widths.onResizeHandle(el.getBoundingClientRect(), event.clientX, event.clientY, rtl())) return;
    const before = el.getBoundingClientRect().width;
    // The browser resizes the window itself and sends the card no mousemove,
    // so its own drag flag is never set: a resize that ended with the mouse
    // outside the card - every one that makes it wider - closed the card.
    // Marked here as the resize it is, in a flag of its own: the card's
    // mousedown, which comes after this pointerdown, clears its drag flag.
    // The close handler in cardDetails.js reads both.
    Session.set('cardDetailsIsResizing', true);
    const done = () => {
      window.removeEventListener('pointerup', done, true);
      window.removeEventListener('pointercancel', done, true);
      // Cleared once the release's mouseup AND click have been handled: the
      // close handler runs for each of them.
      setTimeout(() => Session.set('cardDetailsIsResizing', false), 0);
      if (!el.isConnected) return;
      const after = el.getBoundingClientRect().width;
      if (widths.widthChanged(before, after)) saveCardDetailsWidth(after);
    };
    window.addEventListener('pointerup', done, true);
    window.addEventListener('pointercancel', done, true);
  });
  el.addEventListener('dblclick', event => {
    if (usable() && widths.onResizeHandle(el.getBoundingClientRect(), event.clientX, event.clientY, rtl())) {
      event.preventDefault();
      resetCardDetailsWidth();
    }
  });
}
