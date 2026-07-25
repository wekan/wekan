import { ReactiveCache } from '/imports/reactiveCache';
import { leftMenuData } from '/models/lib/leftMenu';
import { ReactiveVar } from 'meteor/reactive-var';
import Settings from '/models/settings';

// Admin Panel / Features — a home for optional / performance / tier-gated
// capabilities. First entry: "Card loading" (all | lazy), which also mirrors the
// CARDS_LOADING env var. Grouped by category in the side menu so more feature
// toggles (and, later, pricing-tier gating) can be added here.
Template.adminFeatures.onCreated(function () {
  this.activePane = new ReactiveVar('performance');
  Meteor.subscribe('setting');
});

// The Features side menu, as data (docs/Design/Page/Left-Menu.md).
// Admin Panel / Features has no panes of its own any more: Performance, Security and
// Notifications all moved to Admin Panel / Problems, below Summary. The page and its
// menu stay so nothing that links here breaks, and so a future feature has a home.
const FEATURES_MENU = [];

Template.adminFeatures.helpers({  menuItems() {
    return leftMenuData(FEATURES_MENU, Template.instance().activePane.get(), 'js-features-menu');
  },
  isPerformanceActive() {
    return Template.instance().activePane.get() === 'performance';
  },
  isSecurityActive() {
    return Template.instance().activePane.get() === 'security';
  },
  isNotificationsActive() {
    return Template.instance().activePane.get() === 'notifications';
  },
});

// Toggle one boolean setting field, saving immediately.
function toggleSettingField(field) {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting) {
    Settings.update(setting._id, { $set: { [field]: !setting[field] } });
  }
}

Template.adminFeatures.events({  'click .js-features-menu'(event, tpl) {
    tpl.activePane.set(event.currentTarget.dataset.id);
  },
});

// The three panes moved to Admin Panel / Problems, which renders them from
// adminReports.jade. Blaze resolves a helper, and delivers an event, against the
// template the element is IN - never an enclosing one - so each pane needs these ON
// it. One shared pair registered on all three: a handler whose element is not in a
// given pane simply never fires there, so splitting them per pane would buy nothing.
const featurePaneHelpers = {
  renderLinksAsPlainText() {
    return (ReactiveCache.getCurrentSetting() || {}).renderLinksAsPlainText;
  },
  alwaysShowCodeAsText() {
    return (ReactiveCache.getCurrentSetting() || {}).alwaysShowCodeAsText;
  },
  disableAllImport() {
    return (ReactiveCache.getCurrentSetting() || {}).disableAllImport;
  },
  disableAllExport() {
    return (ReactiveCache.getCurrentSetting() || {}).disableAllExport;
  },
  disableImportAvatars() {
    return (ReactiveCache.getCurrentSetting() || {}).disableImportAvatars;
  },
  disableExportAvatars() {
    return (ReactiveCache.getCurrentSetting() || {}).disableExportAvatars;
  },
  anonymizeImportUsers() {
    return (ReactiveCache.getCurrentSetting() || {}).anonymizeImportUsers;
  },
  anonymizeExportUsers() {
    return (ReactiveCache.getCurrentSetting() || {}).anonymizeExportUsers;
  },
  disableActivities() {
    return (ReactiveCache.getCurrentSetting() || {}).disableActivities;
  },
  disableNotifications() {
    return (ReactiveCache.getCurrentSetting() || {}).disableNotifications;
  },
  disableWatch() {
    return (ReactiveCache.getCurrentSetting() || {}).disableWatch;
  },
};
const featurePaneEvents = {
  'click .js-toggle-render-links-as-plain-text'() {
    toggleSettingField('renderLinksAsPlainText');
  },
  'click .js-toggle-always-show-code-as-text'() {
    toggleSettingField('alwaysShowCodeAsText');
  },
  'click .js-toggle-disable-all-import'() {
    toggleSettingField('disableAllImport');
  },
  'click .js-toggle-disable-all-export'() {
    toggleSettingField('disableAllExport');
  },
  'click .js-toggle-disable-import-avatars'() {
    toggleSettingField('disableImportAvatars');
  },
  'click .js-toggle-disable-export-avatars'() {
    toggleSettingField('disableExportAvatars');
  },
  'click .js-toggle-anonymize-import-users'() {
    toggleSettingField('anonymizeImportUsers');
  },
  'click .js-toggle-anonymize-export-users'() {
    toggleSettingField('anonymizeExportUsers');
  },
  'click .js-toggle-disable-activities'() {
    toggleSettingField('disableActivities');
  },
  'click .js-toggle-disable-notifications'() {
    toggleSettingField('disableNotifications');
  },
  'click .js-toggle-disable-watch'() {
    toggleSettingField('disableWatch');
  },
};
for (const tpl of [Template.featuresPerformance, Template.featuresSecurity,
  Template.featuresNotifications]) {
  tpl.helpers(featurePaneHelpers);
  tpl.events(featurePaneEvents);
}
