import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

// Admin Panel / People / Audit log: pages of server/adminAudit.js's trail.
Template.adminAuditLog.onCreated(function () {
  this.page = new ReactiveVar(1);
  this.search = new ReactiveVar('');
  this.result = new ReactiveVar({ rows: [], total: 0, page: 1, perPage: 50 });
  this.loading = new ReactiveVar(true);
  this.autorun(() => {
    const options = { page: this.page.get(), search: this.search.get() };
    this.loading.set(true);
    Meteor.call('adminAuditLogPage', options, (error, result) => {
      this.loading.set(false);
      if (!error && result) this.result.set(result);
    });
  });
});

Template.adminAuditLog.helpers({
  loading() { return Template.instance().loading.get(); },
  rows() { return Template.instance().result.get().rows; },
  total() { return Template.instance().result.get().total; },
  page() { return Template.instance().page.get(); },
  search() { return Template.instance().search.get(); },
  pages() {
    const { total, perPage } = Template.instance().result.get();
    return Math.max(1, Math.ceil(total / perPage));
  },
  noPrev() { return Template.instance().page.get() <= 1; },
  noNext() {
    const { total, perPage } = Template.instance().result.get();
    return Template.instance().page.get() >= Math.ceil(total / perPage);
  },
  when(at) { return at ? new Date(at).toLocaleString() : ''; },
});

let searchTimer = null;
Template.adminAuditLog.events({
  'input .js-admin-audit-search'(event, tpl) {
    const value = event.currentTarget.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { tpl.page.set(1); tpl.search.set(value); }, 300);
  },
  'click .js-admin-audit-prev'(event, tpl) { tpl.page.set(Math.max(1, tpl.page.get() - 1)); },
  'click .js-admin-audit-next'(event, tpl) { tpl.page.set(tpl.page.get() + 1); },
});
