import { Template } from 'meteor/templating';
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
// docs/Design/Page/Left-Menu.md

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
