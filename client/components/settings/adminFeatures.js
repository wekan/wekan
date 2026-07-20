import { ReactiveCache } from '/imports/reactiveCache';
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

Template.adminFeatures.helpers({
  isPerformanceActive() {
    return Template.instance().activePane.get() === 'performance';
  },
  isSecurityActive() {
    return Template.instance().activePane.get() === 'security';
  },
  isNotificationsActive() {
    return Template.instance().activePane.get() === 'notifications';
  },
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
});

// Toggle one boolean setting field, saving immediately.
function toggleSettingField(field) {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting) {
    Settings.update(setting._id, { $set: { [field]: !setting[field] } });
  }
}

Template.adminFeatures.events({
  'click .js-features-menu'(event, tpl) {
    tpl.activePane.set(event.currentTarget.dataset.id);
  },
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
});
