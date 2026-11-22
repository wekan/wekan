import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// The ? of a feature place and its popup (docs/Features/General/Help-Button.md).
// Which help a place shows is data: models/lib/featureHelp.js.
const {
  featureHelp,
  hasFeature,
  boardViewHelpId,
  sidebarViewHelpId,
  popupHelpId,
  cardSectionHelpId,
  paneHelpId,
} = require('/models/lib/featureHelp');

Template.featureHelp.helpers({
  hasHelp() {
    return hasFeature(this.id);
  },
});

Template.featureHelp.events({
  'click .js-open-feature-help'(event) {
    // The ? sits inside headings that do something on a click of their own -
    // a card section folds - and the click is for the ? alone.
    event.preventDefault();
    event.stopPropagation();
    const help = featureHelp(event.currentTarget.dataset.featureHelp);
    if (!help) return;
    // Titled "How it works" by the popup convention, featureHelpPopup-title.
    Popup.open('featureHelp', {
      dataContext: help,
      // A ? inside a popup opens its help as a sub-popup; Escape goes BACK to
      // that popup, where the button that opened the help gets the focus.
      returnFocusSelector: `.js-pop-over .js-open-feature-help[data-feature-help="${help.id}"]`,
    }).call(this, event);
  },
});

// The places that show the help of whatever is open in them.
Template.registerHelper('boardViewHelpId', view => boardViewHelpId(view));
Template.registerHelper('sidebarViewHelpId', view => sidebarViewHelpId(view));
Template.registerHelper('popupHelpId', popupName => popupHelpId(popupName));
Template.registerHelper('cardSectionHelpId', section => cardSectionHelpId(section));
Template.registerHelper('paneHelpId', paneId => paneHelpId(FlowRouter.getRouteName(), paneId));
