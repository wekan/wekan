import { Template } from 'meteor/templating';
import { Utils } from '/client/lib/utils';

// Collapsing the left menu, for both pages that have one.
//
// The same gesture a LIST has on a board (`client/components/lists/listHeader.js`):
// a caret at the top, pointing down when the thing is open and right when it is
// folded away, clicked to switch. It is the collapse gesture WeKan already has,
// so it needs no learning - and it is stored the same way, a Session value for
// the fold itself and the user document behind it so it survives a reload.
//
// ONE state for both pages. All Boards and the Admin Panel draw one menu, and a
// reader who folds it away on one of them has said what they want on the other.
//
// The helper is GLOBAL because the panel that takes the `collapsed` class is a
// different element in a different template on each page - `.side-menu` here,
// `.boards-left-menu` in boardsList.jade - and a helper registered on one of
// them cannot be read by the other.
// docs/Design/Page/Left-Menu.md

Template.registerHelper('isLeftMenuCollapsed', () => Utils.getLeftMenuCollapseState());

Template.leftMenuCollapse.events({
  'click .js-collapse-left-menu'(evt) {
    evt.preventDefault();
    Utils.setLeftMenuCollapseState(!Utils.getLeftMenuCollapseState());
  },
});
