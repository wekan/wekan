// Cloud Panel page (docs/Features/Admin-Panel/Cloud-Panel.md). Everything is
// read and written through the cloudPanel* methods of server/cloudPanel.js,
// which also decide who may see what; nothing is subscribed.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';
import { buildHeader, pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
const { formatMoney } = require('/models/lib/billing');
const { TICKET_STATES, SUPPORT_LISTS } = require('/models/lib/cloudPanel');
const { normalizeAllowedAddresses, addressAllowed } = require('/models/lib/cloudAddresses');

function errorText(error) {
  return error ? (error.reason || error.message || String(error)) : '';
}

function language() {
  try { return TAPi18n.getLanguage ? TAPi18n.getLanguage() : undefined; } catch (e) { return undefined; }
}

function field(form, name) {
  const el = form.elements[name];
  return el ? String(el.value).trim() : '';
}

function list(value) {
  return String(value || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
}

// Every pane reports through this one place, shown above the pane. It is a
// module value, not a function handed down in a data context: Spacebars calls
// a function it finds in a data context when it passes it on, so `done=done`
// called done() with nothing and the domain form never rendered.
const panelError = new ReactiveVar('');
function report(promise) {
  return promise.then(result => { panelError.set(''); return result; })
    .catch(error => { panelError.set(errorText(error)); });
}

// ---------------------------------------------------------------- the page

// Admin Panel / Cloud, for a Cloud Admin; /cloud shows a customer their own.
const ADMIN_MENU = [
  { id: 'domains', icon: 'fa-globe', labelKey: 'domains' },
  { id: 'invoices', icon: 'fa-file-text-o', labelKey: 'billing-invoices' },
  { id: 'tickets', icon: 'fa-ticket', labelKey: 'tickets' },
  { id: 'chat', icon: 'fa-comments', labelKey: 'board-view-chat' },
  { id: 'cloudflare', icon: 'fa-cloud', label: 'Cloudflare' },
  { id: 'caddy', icon: 'fa-server', label: 'Caddy' },
  { id: 'allowed-addresses', icon: 'fa-shield', labelKey: 'cloud-allowed-addresses' },
];
const CUSTOMER_MENU = [
  { id: 'info', icon: 'fa-info-circle', labelKey: 'info' },
  ...ADMIN_MENU.filter(item => ['invoices', 'tickets', 'chat'].includes(item.id)),
];

function menu(info) {
  return info.isCloudAdmin ? ADMIN_MENU : CUSTOMER_MENU;
}

// The pane to show: on Admin Panel / Cloud the one its address names, on
// /cloud the one last clicked; one the menu does not have opens the first.
function currentPane(tpl) {
  const items = menu(tpl.info.get());
  const wanted = FlowRouter.getRouteName() === 'cloud-admin' ? Session.get('cloudOpenPane') : tpl.pane.get();
  return items.some(item => item.id === wanted) ? wanted : items[0].id;
}

// Every domain, for a Cloud Admin's pickers: the table's pages, one by one.
function allDomains() {
  return Meteor.callAsync('cloudPanelDomainsCount', '')
    .then(total => Promise.all(Array.from({ length: Math.ceil(total / TABLE_PAGE_ROWS_PER_PAGE) }, (_, i) =>
      Meteor.callAsync('cloudPanelDomainsPage', { page: i + 1 }))))
    .then(pages => pages.flat());
}

function boardPathOf(board) {
  return board && board.boardId ? `/b/${board.boardId}/${board.boardSlug || 'board'}` : '';
}

Template.cloudPanel.onCreated(function () {
  this.loading = new ReactiveVar(true);
  this.info = new ReactiveVar({ enabled: false, onCloudHost: false, isCloudAdmin: false, domains: [] });
  this.config = new ReactiveVar(null);
  this.pane = new ReactiveVar('');
  panelError.set('');
  this.loadConfig = () => Meteor.callAsync('cloudPanelConfig').then(config => this.config.set(config));
  Meteor.callAsync('cloudPanelWhoAmI')
    .then(info => {
      this.info.set(info);
      return info.isCloudAdmin ? this.loadConfig() : null;
    })
    .catch(error => panelError.set(errorText(error)))
    .finally(() => this.loading.set(false));
});

Template.cloudPanel.helpers({
  loading: () => Template.instance().loading.get(),
  info: () => Template.instance().info.get(),
  config: () => Template.instance().config.get(),
  pane: () => currentPane(Template.instance()),
  actionError: () => panelError.get(),
  // No CLOUD on this server, not at its address, or neither a Cloud Admin
  // nor a customer here.
  notAllowed() {
    const info = Template.instance().info.get();
    return !info.enabled || !info.onCloudHost || !(info.isCloudAdmin || info.domains.length > 0);
  },
  menuItems() {
    const tpl = Template.instance();
    return leftMenuData(menu(tpl.info.get()), currentPane(tpl), 'js-cloud-menu');
  },
  paneTitleData() {
    const tpl = Template.instance();
    return paneTitle(menu(tpl.info.get()), currentPane(tpl));
  },
  reload() {
    const tpl = Template.instance();
    return () => tpl.loadConfig();
  },
});

Template.cloudPanel.events({
  'click a.js-cloud-menu'(event, tpl) {
    event.preventDefault();
    panelError.set('');
    const id = event.currentTarget.getAttribute('data-id');
    if (FlowRouter.getRouteName() === 'cloud-admin') FlowRouter.go(`/admin/cloud/${id}`);
    else tpl.pane.set(id);
  },
});

// ---------------------------------------------------------------- Cloudflare

Template.cloudPanelCloudflare.onCreated(function () {
  this.plan = new ReactiveVar(null);
});

Template.cloudPanelCloudflare.helpers({
  plan: () => Template.instance().plan.get(),
});

Template.cloudPanelCloudflare.events({
  'submit .js-cloud-cloudflare'(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { reload } = Template.currentData();
    report(Meteor.callAsync('cloudPanelSetCloudflare', {
      apiToken: field(form, 'apiToken'), zoneId: field(form, 'zoneId'), target: field(form, 'target'),
      proxied: form.elements.proxied.checked === true,
    }).then(() => { form.elements.apiToken.value = ''; return reload(); }));
  },
  'click .js-cloud-dns-plan'(event, tpl) {
    event.preventDefault();
    report(Meteor.callAsync('cloudPanelDnsPlan').then(plan => tpl.plan.set(plan)));
  },
  'click .js-cloud-dns-apply'(event, tpl) {
    event.preventDefault();
    report(Meteor.callAsync('cloudPanelDnsApply').then(() => Meteor.callAsync('cloudPanelDnsPlan')).then(plan => tpl.plan.set(plan)));
  },
});

// ---------------------------------------------------------------- Caddy

Template.cloudPanelCaddy.onCreated(function () {
  this.caddyfile = new ReactiveVar('');
  this.pushed = new ReactiveVar(false);
});

Template.cloudPanelCaddy.helpers({
  caddyfile: () => Template.instance().caddyfile.get(),
  pushed: () => Template.instance().pushed.get(),
});

Template.cloudPanelCaddy.events({
  'submit .js-cloud-caddy'(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { reload } = Template.currentData();
    report(Meteor.callAsync('cloudPanelSetCaddy', {
      adminUrl: field(form, 'adminUrl'), sharedUpstream: field(form, 'sharedUpstream'), email: field(form, 'email'),
    }).then(() => reload()));
  },
  'click .js-cloud-caddyfile'(event, tpl) {
    event.preventDefault();
    report(Meteor.callAsync('cloudPanelCaddyfile').then(text => tpl.caddyfile.set(text)));
  },
  'click .js-cloud-caddy-push'(event, tpl) {
    event.preventDefault();
    tpl.pushed.set(false);
    report(Meteor.callAsync('cloudPanelPushCaddy').then(() => tpl.pushed.set(true)));
  },
});

// ---------------------------------------------------------------- Domains

// Weddy's Domains columns (caddy-wekan-plugin), and what WeKan adds: where
// the domain's data is.
const DOMAIN_COLUMNS = [
  { labelKey: 'domain', headerTemplate: 'cloudPanelDomainNew' },
  { labelKey: 'cloud-customer-name' },
  { labelKey: 'cloud-customer-email' },
  { labelKey: 'cloud-start-date' },
  { labelKey: 'cloud-end-date' },
  { labelKey: 'cloud-panel-mode' },
  { labelKey: 'cloud-panel-database' },
  { label: '' },
];

// The domain being edited, shared with the header's "New domain" link: a
// table page's header template takes its own clicks (as People's "New" rows
// do), so the link and the pane meet here.
const editingDomain = new ReactiveVar(null);

Template.cloudPanelDomainNew.events({
  'click .js-cloud-domain-new'(event) {
    event.preventDefault();
    editingDomain.set({ mode: 'own', database: {}, customerUsernames: [], cloudflare: true });
  },
});

Template.cloudPanelDomains.onCreated(function () {
  editingDomain.set(null);
  this.editing = editingDomain;
  this.searchTerm = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.total = new ReactiveVar(0);
  this.rows = new ReactiveVar([]);
  this.report = new ReactiveVar(null);
  this.loadPage = () => Meteor.callAsync('cloudPanelDomainsPage', { search: this.searchTerm.get(), page: this.page.get() })
    .then(rows => this.rows.set(rows));
  // The total only when the pane opens or the search changes, never per page.
  this.loadAll = () => Meteor.callAsync('cloudPanelDomainsCount', this.searchTerm.get())
    .then(total => { this.total.set(total); return this.loadPage(); });
  this.loadAll();
});

Template.cloudPanelDomains.helpers({
  tablePageData() {
    const tpl = Template.instance();
    const info = pageInfo(tpl.total.get(), tpl.page.get(), TABLE_PAGE_ROWS_PER_PAGE);
    const rows = tpl.rows.get();
    return {
      emptyKey: 'no-items-message',
      searchTerm: tpl.searchTerm.get(),
      header: buildHeader(DOMAIN_COLUMNS),
      rowTemplate: 'cloudPanelDomainRow',
      docs: rows.map(domain => ({ domain })),
      rowCount: rows.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      total: info.total,
      totalLabelKey: 'domains',
    };
  },
  editing: () => Template.instance().editing.get(),
  report: () => Template.instance().report.get(),
  reportCollections() {
    const report = Template.instance().report.get();
    return Object.entries((report && report.collections) || {}).map(([name, c]) => ({ name, ...c }));
  },
  reportIsDryRun: () => !!(Template.instance().report.get() || {}).dryRun,
  reportDomainId: () => (Template.instance().report.get() || {}).domainId,
  close() {
    const tpl = Template.instance();
    return saved => { tpl.editing.set(null); if (saved) tpl.loadAll(); };
  },
});

Template.cloudPanelDomains.events({
  'keydown .js-table-page-search'(event, tpl) {
    if (event.keyCode !== 13 || event.shiftKey) return;
    event.preventDefault();
    tpl.searchTerm.set(event.currentTarget.value || '');
    tpl.page.set(1);
    tpl.loadAll();
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    if (tpl.page.get() > 1) { tpl.page.set(tpl.page.get() - 1); tpl.loadPage(); }
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    const { totalPages } = pageInfo(tpl.total.get(), tpl.page.get(), TABLE_PAGE_ROWS_PER_PAGE);
    if (tpl.page.get() < totalPages) { tpl.page.set(tpl.page.get() + 1); tpl.loadPage(); }
  },
  'click .js-cloud-domain-edit'(event, tpl) {
    event.preventDefault();
    report(Meteor.callAsync('cloudPanelDomain', event.currentTarget.getAttribute('data-id'))
      .then(domain => tpl.editing.set({ ...domain, database: domain.database || {} })));
  },
  'click .js-cloud-domain-import'(event, tpl) {
    event.preventDefault();
    const domainId = event.currentTarget.getAttribute('data-id');
    // A dry run first: what would be copied, and nothing written.
    report(Meteor.callAsync('cloudPanelImportDomain', domainId, { dryRun: true })
      .then(report => tpl.report.set({ ...report, dryRun: true, domainId })));
  },
  'click .js-cloud-import-now'(event, tpl) {
    event.preventDefault();
    const domainId = event.currentTarget.getAttribute('data-id');
    report(Meteor.callAsync('cloudPanelImportDomain', domainId, { dryRun: false })
      .then(report => { tpl.report.set({ ...report, dryRun: false, domainId }); return tpl.loadAll(); }));
  },
});

Template.cloudPanelDomainRow.onCreated(function () {
  this.tested = new ReactiveVar('');
});

Template.cloudPanelDomainRow.helpers({
  tested: () => Template.instance().tested.get(),
  databaseLabel(db) {
    if (!db) return '—';
    if (db.uri) return db.uri;
    return `${db.username ? `${db.username}@` : ''}${db.host}:${db.port}/${db.database}`;
  },
});

Template.cloudPanelDomainRow.events({
  'click .js-cloud-domain-test'(event, tpl) {
    event.preventDefault();
    tpl.tested.set('…');
    Meteor.callAsync('cloudPanelTestDatabase', event.currentTarget.getAttribute('data-id'))
      .then(r => tpl.tested.set(TAPi18n.__('cloud-panel-test-ok', { users: r.users, boards: r.boards, cards: r.cards })))
      .catch(error => tpl.tested.set(errorText(error)));
  },
});

Template.cloudPanelDomainForm.helpers({
  customers: () => (Template.currentData().domain.customerUsernames || []).join(', '),
  cloudflareOn: () => Template.currentData().domain.cloudflare !== false,
});

Template.cloudPanelDomainForm.events({
  'submit .js-cloud-domain'(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { domain, close } = Template.currentData();
    const database = {};
    if (field(form, 'uri')) database.uri = field(form, 'uri');
    else if (field(form, 'host')) {
      database.host = field(form, 'host');
      if (field(form, 'port')) database.port = parseInt(field(form, 'port'), 10);
      database.database = field(form, 'database');
      for (const name of ['username', 'authSource', 'replicaSet']) if (field(form, name)) database[name] = field(form, name);
      if (form.elements.password.value) database.password = form.elements.password.value;
      if (form.elements.tls.checked) database.tls = true;
    }
    const value = {
      domain: field(form, 'domain'), customerName: field(form, 'customerName'), mode: field(form, 'mode'),
      customerEmail: field(form, 'customerEmail'), billingEmail: field(form, 'billingEmail'),
      startDate: field(form, 'startDate'), endDate: field(form, 'endDate'),
      upstream: field(form, 'upstream'), customerUsernames: list(field(form, 'customerUsernames')),
      notes: field(form, 'notes'), cloudflare: form.elements.cloudflare.checked === true,
    };
    if (Object.keys(database).length) value.database = database;
    report(Meteor.callAsync('cloudPanelSaveDomain', domain._id || null, value).then(() => close(true)));
  },
  'click .js-cloud-domain-close'(event) {
    event.preventDefault();
    Template.currentData().close(false);
  },
  'click .js-cloud-domain-remove'(event) {
    event.preventDefault();
    const { close } = Template.currentData();
    report(Meteor.callAsync('cloudPanelRemoveDomain', event.currentTarget.getAttribute('data-id')).then(() => close(true)));
  },
});

// ---------------------------------------------------------------- Invoices

const INVOICE_STATE_KEYS = { open: 'cloud-panel-invoice-open', paid: 'billing-status-paid', void: 'billing-status-void' };

Template.cloudPanelInvoices.onCreated(function () {
  this.invoices = new ReactiveVar([]);
  this.allDomains = new ReactiveVar([]);
  this.load = () => Meteor.callAsync('cloudPanelInvoices').then(invoices => this.invoices.set(invoices));
  this.load();
  if (Template.currentData().isCloudAdmin) allDomains().then(domains => this.allDomains.set(domains));
});

Template.cloudPanelInvoices.helpers({
  invoices: () => Template.instance().invoices.get(),
  allDomains: () => Template.instance().allDomains.get(),
  money: (minor, currency) => formatMoney(minor, currency, language()),
  statusLabel: status => TAPi18n.__(INVOICE_STATE_KEYS[status] || status),
});

Template.cloudPanelInvoices.events({
  'submit .js-cloud-invoice'(event, tpl) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = { number: field(form, 'number'), issueDate: field(form, 'issueDate'), amount: parseFloat(field(form, 'amount')),
      currency: field(form, 'currency'), status: field(form, 'status') };
    for (const name of ['dueDate', 'paidDate', 'description', 'link']) if (field(form, name)) value[name] = field(form, name);
    report(Meteor.callAsync('cloudPanelSaveInvoice', field(form, 'domainId'), null, value).then(() => { form.reset(); return tpl.load(); }));
  },
  'click .js-cloud-invoice-remove'(event, tpl) {
    event.preventDefault();
    report(Meteor.callAsync('cloudPanelRemoveInvoice', event.currentTarget.getAttribute('data-id')).then(() => tpl.load()));
  },
});

// ---------------------------------------------------------------- Chat

Template.cloudPanelChat.onCreated(function () {
  this.domains = new ReactiveVar(Template.currentData().domains || []);
  this.domainId = new ReactiveVar((this.domains.get()[0] || {})._id || '');
  this.messages = new ReactiveVar([]);
  this.imported = new ReactiveVar(0);
  this.boardPath = new ReactiveVar('');
  this.load = () => {
    const id = this.domainId.get();
    if (!id) return Promise.resolve();
    return Meteor.callAsync('cloudPanelChat', id).then(messages => this.messages.set(messages));
  };
  // The support board itself, to open in Board View / Chat.
  this.autorun(() => {
    const id = this.domainId.get();
    if (!id) return;
    Meteor.callAsync('cloudPanelTickets', id).then(board => this.boardPath.set(boardPathOf(board))).catch(() => this.boardPath.set(''));
  });
  if (Template.currentData().isCloudAdmin) {
    allDomains().then(domains => {
      this.domains.set(domains);
      if (!this.domainId.get() && domains[0]) this.domainId.set(domains[0]._id);
      return this.load();
    });
  } else {
    this.load();
  }
  // The chat is read again every 15 seconds while the pane is open.
  this.poll = Meteor.setInterval(() => this.load(), 15000);
});

Template.cloudPanelChat.onDestroyed(function () {
  Meteor.clearInterval(this.poll);
});

Template.cloudPanelChat.helpers({
  chatDomains: () => Template.instance().domains.get(),
  domainId: () => Template.instance().domainId.get(),
  messages: () => Template.instance().messages.get(),
  imported: () => Template.instance().imported.get(),
  boardPath: () => Template.instance().boardPath.get(),
  when: at => (at ? new Date(at).toLocaleString(language()) : ''),
});

Template.cloudPanelChat.events({
  'change .js-cloud-chat-domain'(event, tpl) {
    tpl.domainId.set(event.currentTarget.value);
    tpl.load();
  },
  'submit .js-cloud-chat-send'(event, tpl) {
    event.preventDefault();
    const form = event.currentTarget;
    report(Meteor.callAsync('cloudPanelSendChat', tpl.domainId.get(), { text: form.elements.text.value })
      .then(() => { form.reset(); return tpl.load(); }));
  },
  'submit .js-cloud-chat-import'(event, tpl) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.file.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const zipBase64 = String(reader.result).split(',')[1] || '';
      report(Meteor.callAsync('cloudPanelImportChat', tpl.domainId.get(), field(form, 'source'), { zipBase64 })
        .then(result => { tpl.imported.set(result.imported); form.reset(); return tpl.load(); }));
    };
    reader.readAsDataURL(file);
  },
});

// ---------------------------------------------------------------- Tickets

Template.cloudPanelTickets.onCreated(function () {
  this.domains = new ReactiveVar(Template.currentData().domains || []);
  this.domainId = new ReactiveVar((this.domains.get()[0] || {})._id || '');
  this.board = new ReactiveVar(null);
  this.load = () => {
    const id = this.domainId.get();
    if (!id) return Promise.resolve();
    return report(Meteor.callAsync('cloudPanelTickets', id).then(board => this.board.set(board)));
  };
  if (Template.currentData().isCloudAdmin) {
    allDomains().then(domains => {
      this.domains.set(domains);
      if (!this.domainId.get() && domains[0]) this.domainId.set(domains[0]._id);
      return this.load();
    });
  } else {
    this.load();
  }
  this.poll = Meteor.setInterval(() => this.load(), 30000);
});

Template.cloudPanelTickets.onDestroyed(function () {
  Meteor.clearInterval(this.poll);
});

const COLUMN_KEYS = Object.fromEntries(SUPPORT_LISTS.map(list => [list.key, list.titleKey]));

Template.cloudPanelTickets.helpers({
  ticketDomains: () => Template.instance().domains.get(),
  domainId: () => Template.instance().domainId.get(),
  board: () => Template.instance().board.get(),
  states: () => TICKET_STATES,
  columnTitle: key => TAPi18n.__(COLUMN_KEYS[key] || key),
  boardPath: () => boardPathOf(Template.instance().board.get()),
  when: at => (at ? new Date(at).toLocaleString(language()) : ''),
});

Template.cloudPanelTickets.events({
  'change .js-cloud-tickets-domain'(event, tpl) {
    tpl.domainId.set(event.currentTarget.value);
    tpl.board.set(null);
    tpl.load();
  },
  'submit .js-cloud-ticket-add'(event, tpl) {
    event.preventDefault();
    const form = event.currentTarget;
    report(Meteor.callAsync('cloudPanelAddTicket', tpl.domainId.get(), { title: field(form, 'title'), description: field(form, 'description') })
      .then(() => { form.reset(); return tpl.load(); }));
  },
  'change .js-cloud-ticket-move'(event, tpl) {
    report(Meteor.callAsync('cloudPanelMoveTicket', tpl.domainId.get(), event.currentTarget.getAttribute('data-id'), event.currentTarget.value)
      .then(() => tpl.load()));
  },
});

// ---------------------------------------------------------------- Allowed addresses

Template.cloudPanelAllowedAddresses.onCreated(function () {
  this.text = new ReactiveVar(null);
  this.saved = new ReactiveVar(false);
});

// Would this list lock the Cloud Admin out? The same rule the server applies
// when it refuses to save it.
function locksOut(text, yourAddress) {
  let list;
  try { list = normalizeAllowedAddresses(text); } catch (e) { return false; }
  return list.length > 0 && !addressAllowed(yourAddress, list);
}

Template.cloudPanelAllowedAddresses.helpers({
  addressesText() {
    const config = Template.currentData().config;
    return ((config && config.allowedAddresses) || []).join('\n');
  },
  lockout() {
    const tpl = Template.instance();
    const config = Template.currentData().config || {};
    const text = tpl.text.get();
    return text !== null && locksOut(text, config.yourAddress);
  },
  saved: () => Template.instance().saved.get(),
});

Template.cloudPanelAllowedAddresses.events({
  'input .js-cloud-addresses-text'(event, tpl) {
    tpl.saved.set(false);
    tpl.text.set(event.currentTarget.value);
  },
  'submit .js-cloud-addresses'(event, tpl) {
    event.preventDefault();
    const form = event.currentTarget;
    const { reload } = Template.currentData();
    tpl.saved.set(false);
    report(Meteor.callAsync('cloudPanelSetAllowedAddresses', form.elements.addresses.value)
      .then(() => { tpl.saved.set(true); tpl.text.set(null); return reload(); }));
  },
});
