import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { buildHeader, pageInfo } from '/models/lib/tablePage';

const { CATEGORIES, ACTIONS } = require('/models/lib/emailBounce');

// Admin Panel -> E-mail -> Bounces (emailBounces.jade, server/emailBounces.js).
// The rules are edited in place and saved with Save; the bounced addresses are
// the shared table page, one page fetched from the server at a time.

const COLUMNS = [
  { labelKey: 'email-bounces-address' },
  { labelKey: 'email-bounces-category' },
  { labelKey: 'email-bounces-counts' },
  { labelKey: 'email-bounces-last' },
  { labelKey: 'email-bounces-status' },
  { label: '' },
];
const actionKey = action => `email-bounces-action-${action}`;

function load(tpl) {
  Meteor.call('getEmailBounceSettings', (error, result) => {
    if (error) tpl.message.set(TAPi18n.__(String(error.error || 'error-notAuthorized')));
    else tpl.settings.set(result);
  });
}

function loadPage(tpl) {
  Meteor.call('emailBouncesPage', { page: tpl.page.get(), search: tpl.search.get(), stoppedOnly: tpl.stoppedOnly.get() },
    (error, result) => {
      if (!error && result) { tpl.rows.set(result.rows); tpl.total.set(result.total); }
    });
}

Template.emailBounces.onCreated(function () {
  this.settings = new ReactiveVar(null);
  this.message = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.search = new ReactiveVar('');
  this.stoppedOnly = new ReactiveVar(false);
  this.rows = new ReactiveVar([]);
  this.total = new ReactiveVar(0);
  load(this);
  this.autorun(() => { this.page.get(); this.search.get(); this.stoppedOnly.get(); loadPage(this); });
});

Template.emailBounces.helpers({
  settings() { return Template.instance().settings.get(); },
  message() { return Template.instance().message.get(); },
  stoppedOnly() { return Template.instance().stoppedOnly.get(); },
  actionColumns() { return ACTIONS.map(action => ({ action, labelKey: actionKey(action) })); },
  ruleRows() {
    const settings = Template.instance().settings.get();
    return CATEGORIES.map(category => {
      const rule = settings.rules[category];
      return {
        category,
        labelKey: `email-bounces-category-${category}`,
        descKey: `email-bounces-category-${category}-desc`,
        threshold: rule.threshold,
        actions: ACTIONS.map(action => ({ action, labelKey: actionKey(action), on: rule.actions.includes(action) })),
      };
    });
  },
  // The sending services, by the names they use for themselves.
  providerRows() {
    const settings = Template.instance().settings.get();
    const labels = { mailgun: 'Mailgun', sendgrid: 'SendGrid', postmark: 'Postmark', brevo: 'Brevo', mailjet: 'Mailjet',
      sparkpost: 'SparkPost', mandrill: 'Mandrill (Mailchimp Transactional)', resend: 'Resend' };
    return Object.keys(settings.providers || {}).map(name => ({ name, label: labels[name] || name, ...settings.providers[name] }));
  },
  topicsText() {
    const settings = Template.instance().settings.get();
    return (settings.sesTopicArns || []).join('\n');
  },
  tablePageData() {
    const tpl = Template.instance();
    const info = pageInfo(tpl.total.get(), tpl.page.get());
    const docs = tpl.rows.get().map(row => ({
      email: row.email,
      stopped: row.stopped,
      categoryKey: `email-bounces-category-${row.lastCategory}`,
      countsText: CATEGORIES.filter(c => row.counts && row.counts[c])
        .map(c => `${TAPi18n.__(`email-bounces-category-${c}`)} ${row.counts[c]}`).join(', '),
      lastAt: row.lastAt ? new Date(row.lastAt).toLocaleString() : '',
      lastDiagnostic: row.lastDiagnostic || row.lastStatus || '',
    }));
    return {
      header: buildHeader(COLUMNS),
      rowTemplate: 'emailBounceRow',
      docs,
      rowCount: docs.length,
      total: tpl.total.get(),
      searchTerm: tpl.search.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      emptyKey: 'email-bounces-none',
    };
  },
});

function editRules(tpl, fn) {
  const settings = tpl.settings.get();
  const rules = JSON.parse(JSON.stringify(settings.rules));
  fn(rules);
  tpl.settings.set({ ...settings, rules });
}

Template.emailBounces.events({
  'click .js-bounce-enabled'(event, tpl) {
    event.preventDefault();
    const settings = tpl.settings.get();
    tpl.settings.set({ ...settings, enabled: !settings.enabled });
  },
  'click .js-bounce-action'(event, tpl) {
    event.preventDefault();
    const { category, action } = event.currentTarget.dataset;
    editRules(tpl, rules => {
      const list = rules[category].actions;
      if (list.includes(action)) {
        rules[category].actions = list.filter(a => a !== action);
      } else if (action === 'ignore') {
        // Ignoring means doing nothing else.
        rules[category].actions = ['ignore'];
      } else {
        rules[category].actions = [...list.filter(a => a !== 'ignore'), action];
      }
      if (!rules[category].actions.length) rules[category].actions = ['record'];
    });
  },
  'change .js-bounce-threshold'(event, tpl) {
    const { category } = event.currentTarget.dataset;
    const n = Math.max(1, Math.min(100, Math.floor(Number(event.currentTarget.value)) || 1));
    editRules(tpl, rules => { rules[category].threshold = n; });
  },
  'click .js-bounce-provider'(event, tpl) {
    event.preventDefault();
    const name = event.currentTarget.dataset.provider;
    const settings = tpl.settings.get();
    const providers = { ...settings.providers, [name]: { ...settings.providers[name], enabled: !settings.providers[name].enabled } };
    tpl.settings.set({ ...settings, providers });
  },
  'click .js-bounce-save'(event, tpl) {
    event.preventDefault();
    const settings = tpl.settings.get();
    const sesTopicArns = String(tpl.$('.js-bounce-topics').val() || '').split(/\s+/).map(s => s.trim()).filter(Boolean);
    const providers = {};
    const providerSecrets = {};
    for (const name of Object.keys(settings.providers || {})) {
      providers[name] = { enabled: !!settings.providers[name].enabled };
      const typed = String(tpl.$(`.js-bounce-provider-secret[data-provider="${name}"]`).val() || '');
      if (typed) providerSecrets[name] = typed;
    }
    Meteor.call('saveEmailBounceSettings', { enabled: settings.enabled, rules: settings.rules, sesTopicArns, providers, providerSecrets }, (error, result) => {
      if (error) {
        tpl.message.set(TAPi18n.__(String(error.error || 'error-notAuthorized')));
        return;
      }
      tpl.$('.js-bounce-provider-secret').val('');
      tpl.settings.set({ ...settings, ...result });
      tpl.message.set(TAPi18n.__('email-to-card-saved'));
    });
  },
  'click .js-bounce-stopped-only'(event, tpl) {
    event.preventDefault();
    tpl.stoppedOnly.set(!tpl.stoppedOnly.get());
    tpl.page.set(1);
  },
  'click .js-bounce-clear'(event, tpl) {
    event.preventDefault();
    Meteor.call('clearEmailBounce', event.currentTarget.dataset.email, () => loadPage(tpl));
  },
  'keydown .js-table-page-search'(event, tpl) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    tpl.search.set(event.currentTarget.value || '');
    tpl.page.set(1);
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    tpl.page.set(Math.max(1, tpl.page.get() - 1));
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    if (pageInfo(tpl.total.get(), tpl.page.get()).hasNext) tpl.page.set(tpl.page.get() + 1);
  },
});
