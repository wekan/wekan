import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';

// Collapsing the left menu, for both pages that have one.
//
// The same gesture a LIST has on a board (`client/components/lists/listHeader.js`):
// a caret pointing down when the thing is open and right when it is folded away,
// clicked to switch. It is the collapse gesture WeKan already has, so it needs no
// learning - and it is stored the same way, a Session value for the fold itself
// and the user document behind it so it survives a reload.
//
// Folded, the menu is not drawn at all - no column, no strip - so the caret that
// brings it back rides at the inline start of the PANE TITLE, and the caret and
// the title are one target. Both carets are the same template, and this one
// handler serves both because they carry the same `js-collapse-left-menu`.
//
// ONE state for both pages. All Boards and the Admin Panel draw one menu, and a
// reader who folds it away on one of them has said what they want on the other.
//
// The helper is GLOBAL because the element that takes the `collapsed` class is a
// different one in a different template on each page - `.side-menu` here,
// `.boards-left-menu` in boardsList.jade - and a helper registered on one of
// them cannot be read by the other.
// docs/Features/Page/Left-Menu.md

Template.registerHelper('isLeftMenuCollapsed', () => Utils.getLeftMenuCollapseState());

Template.leftMenuCollapse.helpers({
  // What the control DOES, for the tooltip and for a screen reader - the same
  // two words a list's caret uses.
  //
  // Beside a pane title the anchor holds the heading's own text, and an
  // `aria-label` REPLACES what is inside the element: labelled with the bare
  // word, the pane's name would be the one thing not announced. So the name is
  // part of the label there, and the label is the bare word only where the
  // caret stands alone, at the top of the open menu.
  collapseLabel() {
    const action = TAPi18n.__(Utils.getLeftMenuCollapseState() ? 'uncollapse' : 'collapse');
    const data = Template.currentData() || {};
    const pane = data.paneTitleKey ? TAPi18n.__(data.paneTitleKey) : data.paneLabel;
    return pane ? `${action}: ${pane}` : action;
  },
});

function toggleLeftMenu(evt) {
  evt.preventDefault();
  Utils.setLeftMenuCollapseState(!Utils.getLeftMenuCollapseState());
}

Template.leftMenuCollapse.events({
  'click .js-collapse-left-menu': toggleLeftMenu,
  // The caret is an anchor with no href - it goes nowhere, it folds something -
  // so the browser gives it neither keyboard focus nor the Enter that a link or
  // a button answers by itself. `tabindex` in the template gives it the focus;
  // this gives it the two keys, which is what `role="button"` beside them
  // promises. Without it the menu could be folded away with a mouse and only
  // with a mouse.
  'keydown .js-collapse-left-menu'(evt) {
    if (evt.key === 'Enter' || evt.key === ' ' || evt.key === 'Spacebar') {
      toggleLeftMenu(evt);
    }
  },
});

// ── Dragging the menu's inner edge to change its width ───────────────────────
//
// The same gesture the right board sidebar has (client/components/sidebar/
// sidebar.js): press the grip on the panel's inner edge, move, and the width is
// saved when let go. Stored the same three ways the fold is - Session, then the
// user's profile, then a cookie for a reader who is not signed in.
//
// The width reaches the CSS as a custom property on <html> rather than as an
// inline style on the menu, because the menu is a DIFFERENT element in a
// different template on each page, and on All Boards the grid track has to
// follow it too. One property, read by every rule that needs the number.
//
// Not on a phone: there the menu is full width above the content (the ≤800px
// rules), so there is no inner edge to drag and nothing a width would mean.
// docs/Features/Page/Left-Menu.md

const LEFT_MENU_WIDTH_PROPERTY = '--wekan-left-menu-width';
// A menu narrower than this cannot show its longest label, and one wider than
// the max is a menu that has eaten the page it is a menu for.
const MIN_LEFT_MENU_WIDTH = 160;
const isPhoneLayout = () => window.innerWidth <= 800;
const maxLeftMenuWidth = () =>
  Math.max(MIN_LEFT_MENU_WIDTH, Math.min(600, window.innerWidth - 240));

function applyLeftMenuWidth(width) {
  const root = document.documentElement;
  if (typeof width !== 'number' || !Number.isFinite(width)) {
    // Nobody has dragged it: the property goes away and the stylesheet's own
    // default applies, which is the one place that number lives.
    root.style.removeProperty(LEFT_MENU_WIDTH_PROPERTY);
    return;
  }
  const clamped = Math.max(MIN_LEFT_MENU_WIDTH, Math.min(maxLeftMenuWidth(), width));
  root.style.setProperty(LEFT_MENU_WIDTH_PROPERTY, `${Math.round(clamped)}px`);
}

Meteor.startup(() => {
  // Re-runs when the width changes AND when the user document arrives, which is
  // what carries a saved width into a page that has already rendered.
  Tracker.autorun(() => {
    applyLeftMenuWidth(Utils.getLeftMenuWidth());
  });
  // A saved width that no longer fits is clamped against the window it is being
  // shown in, not the one it was dragged in.
  window.addEventListener('resize', () => {
    applyLeftMenuWidth(Utils.getLeftMenuWidth());
  });
});

function pageXOf(evt) {
  const oe = evt.originalEvent || evt;
  if (oe.touches && oe.touches.length) return oe.touches[0].pageX;
  if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].pageX;
  return evt.pageX;
}

// The menu sits at the logical inline START, so its grip is on the inline END:
// dragging AWAY from that start widens it. Reading left to right that is a drag
// to the right; under a right-to-left language the whole row is mirrored, the
// menu is on the right, and the same drag goes the other way.
const isRtlLayout = () =>
  (document.documentElement.getAttribute('dir') || document.dir) === 'rtl';

// The width the menu is at right now: what was saved, or - the first time it is
// dragged - what the stylesheet made it, measured from the menu itself rather
// than guessed at, so the drag starts where the edge actually is.
function currentLeftMenuWidth() {
  const saved = Utils.getLeftMenuWidth();
  if (typeof saved === 'number') return saved;
  const menu = document.querySelector('.side-menu, .boards-left-menu');
  return menu ? menu.getBoundingClientRect().width : MIN_LEFT_MENU_WIDTH;
}

Template.leftMenuResize.onRendered(function() {
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  let lastWidth = 0;

  // Only what a drag put in place is ever taken down or saved. Without the flag
  // the cleanup below would "finish" a drag that never started and save the
  // width it was initialised with, which is no width at all.
  const releaseDocument = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    $('body').removeClass('left-menu-resizing-active');
  };

  const onMove = evt => {
    if (!isResizing) return;
    const delta = (pageXOf(evt) - startX) * (isRtlLayout() ? -1 : 1);
    lastWidth = Math.max(MIN_LEFT_MENU_WIDTH,
      Math.min(maxLeftMenuWidth(), startWidth + delta));
    // Straight onto the property while dragging: the edge follows the pointer
    // without a write to the database - and to a Session value - per pixel.
    document.documentElement.style.setProperty(
      LEFT_MENU_WIDTH_PROPERTY, `${Math.round(lastWidth)}px`);
    evt.preventDefault();
  };

  const onEnd = evt => {
    if (!isResizing) return;
    isResizing = false;
    releaseDocument();
    // Saved once, at the end. Session first, so the width does not jump back
    // while the server is answering.
    Utils.setLeftMenuWidth(lastWidth);
    if (evt && evt.preventDefault) evt.preventDefault();
  };

  const onStart = evt => {
    if (isPhoneLayout()) return;
    isResizing = true;
    startX = pageXOf(evt);
    startWidth = currentLeftMenuWidth();
    lastWidth = startWidth;
    // The whole page shows the resize cursor and stops selecting text, the same
    // way the right sidebar's drag does - without it the drag selects every
    // label it passes over.
    $('body').addClass('left-menu-resizing-active');
    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
    evt.preventDefault();
    evt.stopPropagation();
  };

  const handle = this.find('.js-left-menu-resize');
  if (!handle) return;
  handle.addEventListener('mousedown', onStart, { passive: false });
  // Native, not a Blaze event map, so `{ passive: false }` applies and the
  // touch drag can stop the page from scrolling under it.
  handle.addEventListener('touchstart', onStart, { passive: false });
  this._leftMenuResizeCleanup = () => {
    isResizing = false;
    releaseDocument();
  };
});

Template.leftMenuResize.onDestroyed(function() {
  // A drag that was still going when the page changed leaves its document
  // listeners behind otherwise, and they would keep resizing a menu that is no
  // longer there. The width is NOT saved from here: what a half-finished drag
  // was passing through is not what the reader chose.
  if (this._leftMenuResizeCleanup) this._leftMenuResizeCleanup();
});
