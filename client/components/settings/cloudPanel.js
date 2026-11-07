// The Cloud Panel and Admin Panel / People / Cloud (cloudPanel.jade,
// docs/Platforms/FOSS/Weddy/Cloud-Panel.md). The server checks every call again
// (server/methods/cloudPanel.js); this only draws.
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from '/imports/i18n';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';
import { buildHeader, pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
import { DOMAIN_FIELDS } from '/models/lib/cloudPanel';
import { cloudStatus, refreshCloudStatus } from '/client/lib/cloudStatus';

const errorText = e => (e && (e.reason || e.error)) || String(e);

// Admin Panel / People / Cloud
Template.cloudSettings.onCreated(function () {
  this.message = new ReactiveVar('');
  refreshCloudStatus();
});
Template.cloudSettings.helpers({
  status: () => cloudStatus.get(),
  message: () => Template.instance().message.get(),
});
Template.cloudSettings.events({
  async 'click .js-cloud-save'(event, tpl) {
    event.preventDefault();
    try {
      await Meteor.callAsync('cloudSaveSettings', tpl.$('.js-cloud-panel-domain').val() || '',
        tpl.$('.js-cloud-superadmin').val() || '');
      tpl.message.set(TAPi18n.__('cloud-saved'));
      refreshCloudStatus();
    } catch (e) {
      tpl.message.set(errorText(e));
    }
  },
});

// The Cloud Panel
const MENU = [
  { id: 'cloud-domains', icon: 'fa-globe', labelKey: 'domains' },
  { id: 'cloud-cloudflare', icon: 'fa-cloud', label: 'CloudFlare' },
];
const openPane = new ReactiveVar('cloud-domains');

Template.cloudPanel.onCreated(() => refreshCloudStatus());
Template.cloudPanel.helpers({
  status: () => cloudStatus.get(),
  menuItems: () => leftMenuData(MENU, openPane.get()),
  paneTitleData: () => paneTitle(MENU, openPane.get()),
  domainsOpen: () => openPane.get() === 'cloud-domains',
});
Template.cloudPanel.events({
  'click .js-left-menu-item'(event) {
    event.preventDefault();
    openPane.set(String(event.currentTarget.getAttribute('data-id') || 'cloud-domains'));
  },
});

const COLUMNS = [
  { labelKey: 'domain' }, { labelKey: 'cloud-customer-name' }, { labelKey: 'cloud-customer-email' },
  { labelKey: 'cloud-billing-email' }, { labelKey: 'cloud-start-date' }, { labelKey: 'cloud-end-date' },
  { label: 'TLS' }, { labelKey: 'actions' },
];

Template.cloudDomainsPane.onCreated(function () {
  this.rows = new ReactiveVar([]);
  this.editing = new ReactiveVar({});
  this.message = new ReactiveVar('');
  this.search = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.load = async () => {
    try {
      this.rows.set(await Meteor.callAsync('cloudDomains'));
    } catch (e) {
      this.message.set(errorText(e));
    }
  };
  this.load();
});
Template.cloudDomainsPane.helpers({
  editing: () => Template.instance().editing.get(),
  message: () => Template.instance().message.get(),
  tablePageData() {
    const tpl = Template.instance();
    const term = tpl.search.get().trim().toLowerCase();
    const all = tpl.rows.get().filter(r => !term || DOMAIN_FIELDS.some(f => String(r[f] || '').toLowerCase().includes(term)));
    const info = pageInfo(all.length, tpl.page.get());
    const docs = all.slice((info.page - 1) * TABLE_PAGE_ROWS_PER_PAGE, info.page * TABLE_PAGE_ROWS_PER_PAGE);
    return {
      searchTerm: tpl.search.get(),
      header: buildHeader(COLUMNS),
      rowTemplate: 'cloudDomainRow',
      docs,
      rowCount: docs.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      total: all.length,
      emptyKey: 'no-items-message',
    };
  },
});
Template.cloudDomainsPane.events({
  'keyup .js-table-page-search, change .js-table-page-search'(event, tpl) {
    tpl.search.set(event.currentTarget.value || '');
    tpl.page.set(1);
  },
  'click .js-table-page-prev'(event, tpl) { tpl.page.set(Math.max(1, tpl.page.get() - 1)); },
  'click .js-table-page-next'(event, tpl) { tpl.page.set(tpl.page.get() + 1); },
  'click .js-cloud-domain-edit'(event, tpl) {
    event.preventDefault();
    const id = event.currentTarget.getAttribute('data-id');
    tpl.editing.set({ ...(tpl.rows.get().find(r => r._id === id) || {}) });
    tpl.message.set('');
  },
  'click .js-cloud-domain-cancel'(event, tpl) {
    event.preventDefault();
    tpl.editing.set({});
  },
  async 'click .js-cloud-domain-save'(event, tpl) {
    event.preventDefault();
    const row = {};
    tpl.$('.js-cloud-field').each((i, el) => { row[el.getAttribute('data-field')] = el.value || ''; });
    try {
      await Meteor.callAsync('cloudSaveDomain', tpl.editing.get()._id || null, row);
      tpl.editing.set({});
      tpl.$('.js-cloud-field').val('');
      tpl.message.set(TAPi18n.__('cloud-saved'));
      await tpl.load();
    } catch (e) {
      tpl.message.set(errorText(e));
    }
  },
  async 'click .js-cloud-domain-remove'(event, tpl) {
    event.preventDefault();
    const id = event.currentTarget.getAttribute('data-id');
    const row = tpl.rows.get().find(r => r._id === id);
    // eslint-disable-next-line no-alert
    if (!row || !window.confirm(`${TAPi18n.__('delete')} ${row.domain}?`)) return;
    try {
      await Meteor.callAsync('cloudRemoveDomain', id);
      await tpl.load();
    } catch (e) {
      tpl.message.set(errorText(e));
    }
  },
});

Template.cloudflarePane.onCreated(function () {
  this.message = new ReactiveVar('');
});
Template.cloudflarePane.helpers({
  status: () => cloudStatus.get(),
  message: () => Template.instance().message.get(),
});
async function saveToken(tpl, token) {
  try {
    await Meteor.callAsync('cloudSetCloudflareToken', token);
    tpl.$('.js-cloudflare-token').val('');
    tpl.message.set(TAPi18n.__('cloud-saved'));
    refreshCloudStatus();
  } catch (e) {
    tpl.message.set(errorText(e));
  }
}
Template.cloudflarePane.events({
  'click .js-cloudflare-save'(event, tpl) {
    event.preventDefault();
    const token = tpl.$('.js-cloudflare-token').val() || '';
    if (token.trim()) saveToken(tpl, token);
  },
  'click .js-cloudflare-remove'(event, tpl) {
    event.preventDefault();
    saveToken(tpl, '');
  },
});
