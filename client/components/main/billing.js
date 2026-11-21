// Budget and billing page (docs/Features/Billing/Billing.md). It asks the
// server for the numbers (billingBoards / billingBoard, server/billing.js) and
// writes through the other billing* methods.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
const { formatMoney } = require('/models/lib/billing');

function t(key, options) {
  return TAPi18n.__(key, options);
}

function errorText(error) {
  return error ? (error.reason || error.message || String(error)) : '';
}

function language() {
  try { return TAPi18n.getLanguage ? TAPi18n.getLanguage() : undefined; } catch (e) { return undefined; }
}

function money(minor, currency) {
  return formatMoney(minor, currency, language());
}

const STATUS_KEYS = { draft: 'billing-status-draft', sent: 'billing-status-sent', paid: 'billing-status-paid', void: 'billing-status-void' };
const NEXT = { draft: ['sent', 'void'], sent: ['paid', 'draft', 'void'], paid: [], void: [] };
const ACTION_KEYS = { sent: 'billing-mark-sent', paid: 'billing-mark-paid', void: 'billing-void', draft: 'billing-back-to-draft' };

Template.billing.onCreated(function () {
  this.loading = new ReactiveVar(true);
  this.error = new ReactiveVar('');
  this.boards = new ReactiveVar([]);
  this.isAdmin = new ReactiveVar(false);
  this.allBoards = new ReactiveVar(false);
  this.selected = new ReactiveVar(null);
  this.detail = new ReactiveVar(null);
  this.loadBoards = () => {
    this.loading.set(true);
    return Meteor.callAsync('billingBoards', { allBoards: this.allBoards.get() })
      .then(result => {
        this.boards.set(result.boards);
        this.isAdmin.set(result.isAdmin === true);
        this.error.set('');
      })
      .catch(error => this.error.set(errorText(error)))
      .finally(() => this.loading.set(false));
  };
  this.loadDetail = () => {
    const boardId = this.selected.get();
    if (!boardId) { this.detail.set(null); return Promise.resolve(); }
    return Meteor.callAsync('billingBoard', boardId).then(detail => this.detail.set(detail))
      .catch(error => this.error.set(errorText(error)));
  };
  this.reload = () => Promise.all([this.loadBoards(), this.loadDetail()]);
  this.loadBoards();
});

Template.billing.helpers({
  loading: () => Template.instance().loading.get(),
  error: () => Template.instance().error.get(),
  boards: () => Template.instance().boards.get(),
  isAdmin: () => Template.instance().isAdmin.get(),
  allBoards: () => Template.instance().allBoards.get(),
  selectedBoardId: () => Template.instance().selected.get(),
  detail: () => Template.instance().detail.get(),
  reload() {
    const tpl = Template.instance();
    return () => tpl.reload();
  },
  money,
  budgetLabel(board) {
    const b = board.budget;
    if (!b) return '—';
    const parts = [];
    if (typeof b.amountMinor === 'number') parts.push(money(b.amountMinor, b.currency));
    if (typeof b.hours === 'number') parts.push(`${b.hours} ${t('workload-hours-short')}`);
    return parts.join(' · ');
  },
  barWidth(percent) {
    return Math.max(0, Math.min(100, Number(percent) || 0));
  },
});

Template.billing.events({
  'click .js-billing-board'(evt, tpl) {
    evt.preventDefault();
    tpl.selected.set(evt.currentTarget.getAttribute('data-id'));
    tpl.loadDetail();
  },
  'change .js-billing-all-boards'(evt, tpl) {
    tpl.allBoards.set(evt.currentTarget.checked === true);
    tpl.loadBoards();
  },
});

// ---------------------------------------------------------------- one board

Template.billingBoard.onCreated(function () {
  this.printed = new ReactiveVar(null);
  this.actionError = new ReactiveVar('');
  this.done = promise => promise.then(result => {
    this.actionError.set('');
    const { reload } = Template.currentData() || {};
    if (typeof reload === 'function') reload();
    return result;
  }).catch(error => this.actionError.set(errorText(error)));
});

function detail() {
  return Template.currentData().detail;
}

Template.billingBoard.helpers({
  money,
  hours: value => `${Math.round((Number(value) || 0) * 100) / 100} ${t('workload-hours-short')}`,
  hasBudget: () => !!detail().budget,
  budgetAmount() {
    const b = detail().budget;
    return b && typeof b.amountMinor === 'number' ? (b.amountMinor / 100).toFixed(2) : '';
  },
  budgetCurrency() {
    const d = detail();
    return (d.budget && d.budget.currency) || d.finance.currency || '';
  },
  draftTotal() {
    const d = detail();
    return d.draft ? money(d.draft.totalMinor, d.draft.currency) : '';
  },
  cannotInvoice() {
    const d = detail();
    return !(d.draft && d.draft.lines.length);
  },
  today: () => new Date().toISOString().slice(0, 10),
  statusLabel: status => t(STATUS_KEYS[status] || status),
  nextStatuses: status => (NEXT[status] || []).map(value => ({ value, label: t(ACTION_KEYS[value]) })),
  printed: () => Template.instance().printed.get(),
  actionError: () => Template.instance().actionError.get(),
});

function field(form, name) {
  const el = form.elements[name];
  return el ? String(el.value).trim() : '';
}

function numberOrUndefined(value) {
  return value === '' ? undefined : parseFloat(value);
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

Template.billingBoard.events({
  'submit .js-billing-budget'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const budget = {
      amount: numberOrUndefined(field(form, 'amount')),
      currency: field(form, 'currency') || undefined,
      hours: numberOrUndefined(field(form, 'hours')),
      start: field(form, 'start') || undefined,
      end: field(form, 'end') || undefined,
    };
    for (const key of Object.keys(budget)) if (budget[key] === undefined) delete budget[key];
    tpl.done(Meteor.callAsync('billingSetBudget', detail().board._id, budget));
  },
  'click .js-billing-remove-budget'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingSetBudget', detail().board._id, null));
  },
  'submit .js-billing-rate'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const rate = { hourlyRate: parseFloat(field(form, 'hourlyRate')), currency: field(form, 'currency') };
    if (field(form, 'userId')) rate.userId = field(form, 'userId');
    tpl.done(Meteor.callAsync('billingSetRate', detail().board._id, rate).then(() => form.reset()));
  },
  'click .js-billing-remove-rate'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingRemoveRate', evt.currentTarget.getAttribute('data-id')));
  },
  'submit .js-billing-invoice'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const request = {};
    for (const name of ['customer', 'reference', 'notes', 'issueDate', 'dueDate']) {
      if (field(form, name)) request[name] = field(form, name);
    }
    tpl.done(Meteor.callAsync('billingCreateInvoice', detail().board._id, request).then(() => form.reset()));
  },
  'click .js-billing-status'(evt, tpl) {
    evt.preventDefault();
    const el = evt.currentTarget;
    tpl.done(Meteor.callAsync('billingSetInvoiceStatus', el.getAttribute('data-id'), el.getAttribute('data-status')));
  },
  'click .js-billing-print'(evt, tpl) {
    evt.preventDefault();
    Meteor.callAsync('billingInvoice', evt.currentTarget.getAttribute('data-id'))
      .then(invoice => tpl.printed.set(invoice))
      .catch(error => tpl.actionError.set(errorText(error)));
  },
  'click .js-billing-csv'(evt, tpl) {
    evt.preventDefault();
    const id = evt.currentTarget.getAttribute('data-id');
    const invoice = detail().invoices.find(i => i._id === id);
    Meteor.callAsync('billingInvoiceCsv', id)
      .then(csv => download(`${(invoice && invoice.number) || 'invoice'}.csv`, csv, 'text/csv;charset=utf-8'))
      .catch(error => tpl.actionError.set(errorText(error)));
  },
  'click .js-billing-print-now'(evt) {
    evt.preventDefault();
    window.print();
  },
  'click .js-billing-print-close'(evt, tpl) {
    evt.preventDefault();
    tpl.printed.set(null);
  },
});

Template.billingInvoicePrint.helpers({
  money,
  statusLabel: status => t(STATUS_KEYS[status] || status),
});
