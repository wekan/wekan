import { ReactiveVar } from 'meteor/reactive-var';

// Creation-time stack tracking which basicTabs is currently being rendered.
// Blaze creates parent views before children, so when tabContent.onCreated fires,
// its parent basicTabs instance is on top of this stack.
// This is necessary because Blaze content blocks render with parentView pointing
// back to the calling context (e.g. membersWidget), not the basicTabs template —
// so walking the view tree cannot find the basicTabs instance.
const _creatingStack = [];

Template.basicTabs.onCreated(function () {
  const activeTab = this.data.activeTab
    ? { slug: this.data.activeTab }
    : this.data.tabs[0];
  this._activeTab = new ReactiveVar(activeTab);

  this.isActiveSlug = (slug) => {
    const current = this._activeTab.get();
    return current && current.slug === slug;
  };

  _creatingStack.push(this);
});

Template.basicTabs.onRendered(function () {
  const idx = _creatingStack.lastIndexOf(this);
  if (idx !== -1) _creatingStack.splice(idx, 1);
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

Template.tabContent.onCreated(function () {
  // Capture the parent basicTabs instance at creation time via the stack.
  // isActiveSlug reads a ReactiveVar on the basicTabs instance, so the
  // isActiveTab helper below will re-run reactively when the tab changes.
  this._basicTabsInst = _creatingStack[_creatingStack.length - 1] || null;
});

Template.tabContent.helpers({
  isActiveTab(slug) {
    const inst = Template.instance()._basicTabsInst;
    if (inst && inst.isActiveSlug(slug)) return 'active';
  },
});
