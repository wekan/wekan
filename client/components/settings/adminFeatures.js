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
  cardsLoadingOptions() {
    const current = (ReactiveCache.getCurrentSetting() || {}).cardsLoading || 'all';
    return [
      { value: 'all', label: 'cards-loading-all', selected: current === 'all' },
      { value: 'lazy', label: 'cards-loading-lazy', selected: current === 'lazy' },
    ];
  },
  renderLinksAsPlainText() {
    return (ReactiveCache.getCurrentSetting() || {}).renderLinksAsPlainText;
  },
});

Template.adminFeatures.events({
  'click .js-features-menu'(event, tpl) {
    tpl.activePane.set(event.currentTarget.dataset.id);
  },
  'change .js-cards-loading'(event) {
    const value = event.currentTarget.value === 'lazy' ? 'lazy' : 'all';
    const setting = ReactiveCache.getCurrentSetting();
    if (setting) {
      Settings.update(setting._id, { $set: { cardsLoading: value } });
    }
  },
  'click .js-toggle-render-links-as-plain-text'() {
    const setting = ReactiveCache.getCurrentSetting();
    if (setting) {
      Settings.update(setting._id, {
        $set: { renderLinksAsPlainText: !setting.renderLinksAsPlainText },
      });
    }
  },
});
