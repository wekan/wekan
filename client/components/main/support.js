import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// Shared helpers for both support templates
// The page's name. An admin can rename it, so the top header bar has to ask
// rather than assume - exported for that. models/lib/pageTitles.js
export function supportPageTitle() {
  const setting = ReactiveCache.getCurrentSetting();
  return (setting && setting.supportTitle) || '';
}

const supportHelpers = {
  supportTitle() {
    return supportPageTitle() || TAPi18n.__('support');
  },
  supportContent() {
    const setting = ReactiveCache.getCurrentSetting();
    return setting && setting.supportPageText ? setting.supportPageText : TAPi18n.__('support-info-not-added-yet');
  },
  isSupportEnabled() {
    const setting = ReactiveCache.getCurrentSetting();
    return setting && setting.supportPageEnabled;
  },
  isSupportPublic() {
    const setting = ReactiveCache.getCurrentSetting();
    return setting && setting.supportPagePublic;
  }
};

// Main support page component
Template.support.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);

  Meteor.subscribe('setting');
});

Template.support.helpers(supportHelpers);

// The subscription the header bar used to make. The top header bar names this
// page from the same setting, so it still has to be here.
Template.support.onCreated(function () {
  Meteor.subscribe('setting');
});
