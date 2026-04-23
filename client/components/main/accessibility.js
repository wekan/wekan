import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import AccessibilitySettings from '/models/accessibilitySettings';

// Shared helpers for both accessibility templates
const accessibilityHelpers = {
  accessibilityTitle() {
    const setting = AccessibilitySettings.findOne({});
    return setting && setting.title ? setting.title : TAPi18n.__('accessibility-title');
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

// Header bar component
Template.accessibilityHeaderBar.onCreated(function () {
  Meteor.subscribe('accessibilitySettings');
});

Template.accessibilityHeaderBar.helpers(accessibilityHelpers);
