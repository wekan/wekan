const { ReactiveVar } = require('meteor/reactive-var');

Template.basicTabs.onCreated(function () {
  const activeTab = this.data.activeTab
    ? { slug: this.data.activeTab }
    : this.data.tabs[0];
  this._activeTab = new ReactiveVar(activeTab);

  this.isActiveSlug = (slug) => {
    const current = this._activeTab.get();
    return current && current.slug === slug;
  };
});

Template.basicTabs.helpers({
  isActiveTab(slug) {
    if (Template.instance().isActiveSlug(slug)) {
      return 'active';
    }
  },
});

Template.basicTabs.events({
  'click .tab-item'(e, t) {
    t._activeTab.set(this);
  },
});

function findBasicTabsInstance() {
  let view = Blaze.currentView;
  while (view) {
    if (view.name === 'Template.basicTabs' && view.templateInstance) {
      const inst = view.templateInstance();
      if (inst && inst.isActiveSlug) {
        return inst;
      }
    }
    view = view.parentView;
  }
  return null;
}

Template.tabContent.helpers({
  isActiveTab(slug) {
    const inst = findBasicTabsInstance();
    if (inst && inst.isActiveSlug(slug)) {
      return 'active';
    }
  },
});
