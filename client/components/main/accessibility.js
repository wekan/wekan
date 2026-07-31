import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import AccessibilitySettings from '/models/accessibilitySettings';

// Shared helpers for both accessibility templates
import { accessibilityPageTitle } from '/client/lib/pageTitleSources';

const accessibilityHelpers = {
  accessibilityTitle() {
    return accessibilityPageTitle() || TAPi18n.__('accessibility-title');
  },
  accessibilityContent() {
    const setting = AccessibilitySettings.findOne({});
    return setting && setting.body ? setting.body : TAPi18n.__('accessibility-content');
  },
  isAccessibilityEnabled() {
    const setting = AccessibilitySettings.findOne({});
    return setting && setting.enabled;
  }
};

// Main accessibility page component
Template.accessibility.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);

  Meteor.subscribe('setting');
  Meteor.subscribe('accessibilitySettings');
});

Template.accessibility.helpers(accessibilityHelpers);

// The subscription the header bar used to make; the top header bar names this
// page from the same setting.
Template.accessibility.onCreated(function () {
  Meteor.subscribe('accessibilitySettings');
});
