// Budget and billing page (docs/Features/Billing/Billing.md). It asks the
// server for the numbers (billingBoards / billingBoard, server/billing.js) and
// writes through the other billing* methods.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
// The payment methods' labels and placeholders, and their QR codes and
// barcode as SVG, are shared with Board View / Shop (client/lib/paymentCodeSvg.js).
import { METHOD_KEYS, FIELD_KEYS, PLACEHOLDERS, qrSvg, barcodeSvg } from '/client/lib/paymentCodeSvg';
const { formatMoney, EXPENSE_CATEGORIES, LINE_KIND_LABEL_KEYS } = require('/models/lib/billing');
const { minorToText } = require('/models/lib/currencies');
const { PAYMENT_METHODS, formatReference, formatIban } = require('/models/lib/paymentCodes');

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

const STATE_KEYS = {
  draft: 'billing-status-draft', sent: 'billing-status-sent', paid: 'billing-status-paid', void: 'billing-status-void',
  credited: 'billing-status-credited', partial: 'billing-status-partial', overdue: 'billing-status-overdue',
};
const NEXT = { draft: ['sent', 'void'], sent: ['paid', 'draft', 'void'], paid: [], void: [], credited: [] };
const ACTION_KEYS = { sent: 'billing-mark-sent', paid: 'billing-mark-paid', void: 'billing-void', draft: 'billing-back-to-draft' };
// A quote's statuses, and what each may become (models/lib/billing.js).
const QUOTE_STATE_KEYS = { draft: 'billing-status-draft', sent: 'billing-status-sent', accepted: 'billing-quote-accepted', declined: 'billing-quote-declined' };
const QUOTE_NEXT = { draft: ['sent', 'declined'], sent: ['accepted', 'declined', 'draft'], accepted: [], declined: [] };
const QUOTE_ACTION_KEYS = { sent: 'billing-mark-sent', accepted: 'accept', declined: 'decline', draft: 'billing-back-to-draft' };
function download(name, mime, { text, base64 }) {
  let blob;
  if (base64) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
  } else {
    blob = new Blob([text], { type: mime });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- the page

Template.billing.onCreated(function () {
  this.loading = new ReactiveVar(true);
  this.error = new ReactiveVar('');
  this.boards = new ReactiveVar([]);
  this.isAdmin = new ReactiveVar(false);
  this.allBoards = new ReactiveVar(false);
  this.selected = new ReactiveVar(null);
  this.detail = new ReactiveVar(null);
  this.period = new ReactiveVar({ periodStart: '', periodEnd: '', includeUndated: false });
  // The spinner of this load takes the board pane down with it, so a save
  // refreshes through reload below, never through this.
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
    const p = this.period.get();
    const period = {};
    if (p.periodStart) period.periodStart = p.periodStart;
    if (p.periodEnd) period.periodEnd = p.periodEnd;
    if (p.includeUndated) period.includeUndated = true;
    return Meteor.callAsync('billingBoard', boardId, period).then(detail => this.detail.set(detail))
      .catch(error => this.error.set(errorText(error)));
  };
  // After a save only the open board is read again, and its row in the list
  // takes the numbers from that answer: reading every board after each save
  // ran into billingBoards' rate limit (server/billing.js) within a minute of
  // filling in a few forms.
  this.reload = () => this.loadDetail().then(() => {
    const detail = this.detail.get();
    if (!detail) return;
    this.boards.set(this.boards.get().map(b => (b._id === detail.board._id
      ? { ...b, budget: detail.budget, finance: detail.finance } : b)));
  });
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
  period: () => Template.instance().period.get(),
  reload() {
    const tpl = Template.instance();
    return () => tpl.reload();
  },
  setPeriod() {
    const tpl = Template.instance();
    return period => { tpl.period.set(period); tpl.loadDetail(); };
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
  this.methodType = new ReactiveVar('sepa');
  this.done = promise => promise.then(result => {
    this.actionError.set('');
    // The instance's own data context: inside a promise there is no current
    // template, and the current-data lookup is null there - which left the
    // page unrefreshed after every save.
    const { reload } = this.data || {};
    if (typeof reload === 'function') reload();
    return result;
  }).catch(error => this.actionError.set(errorText(error)));
});

function detail() {
  return Template.currentData().detail;
}

function methodTitle(type) {
  return t(METHOD_KEYS[type] || type);
}

function signedMoney(invoice, minor) {
  return money(invoice.kind === 'credit' ? -minor : minor, invoice.currency);
}

function stateLabel(state, kind) {
  if (kind === 'quote') return t(QUOTE_STATE_KEYS[state] || state);
  return t(STATE_KEYS[state] || state);
}

Template.billingBoard.helpers({
  money,
  signedMoney,
  hours: value => `${Math.round((Number(value) || 0) * 100) / 100} ${t('workload-hours-short')}`,
  hasBudget: () => !!detail().budget,
  budgetAmount() {
    const b = detail().budget;
    return b && typeof b.amountMinor === 'number' ? minorToText(b.amountMinor, b.currency) : '';
  },
  budgetCurrency() {
    const d = detail();
    return (d.budget && d.budget.currency) || d.finance.currency || '';
  },
  draftTotal() {
    const d = detail();
    return d.draft ? money(d.draft.netMinor, d.draft.currency) : '';
  },
  cannotInvoice() {
    const d = detail();
    return !(d.draft && d.draft.lines.length);
  },
  today: () => new Date().toISOString().slice(0, 10),
  referenceTypes: () => [
    { value: 'rf', label: t('billing-reference-rf') }, { value: 'fi', label: t('billing-reference-fi') },
    { value: 'be', label: t('billing-reference-be') }, { value: 'no', label: t('billing-reference-no') },
    { value: 'se', label: t('billing-reference-se') }, { value: 'none', label: t('billing-reference-none') },
  ],
  methodTypes: () => Object.keys(PAYMENT_METHODS).map(value => ({ value, label: methodTitle(value) })),
  methodType: () => Template.instance().methodType.get(),
  methodFields() {
    const spec = PAYMENT_METHODS[Template.instance().methodType.get()];
    return (spec ? spec.fields : []).map(name => ({ name, label: t(FIELD_KEYS[name] || name), placeholder: PLACEHOLDERS[name] || '' }));
  },
  paymentMethods() {
    return (detail().profile.paymentMethods || []).map((m, index) => ({
      index, title: m.label || methodTitle(m.type),
      summary: m.iban ? formatIban(m.iban) : (m.payee || m.key || m.vpa || m.address || m.user || m.url || m.details || ''),
    }));
  },
  statusLabel: state => t(STATE_KEYS[state] || state),
  nextStatuses: invoice => (invoice.kind === 'credit' ? [] : (NEXT[invoice.status] || [])).map(value => ({ value, label: t(ACTION_KEYS[value]) })),
  canCredit: invoice => invoice.kind !== 'credit' && ['sent', 'paid'].includes(invoice.status),
  fileFormats: () => [
    { value: 'pdf', label: 'PDF', icon: 'fa-file-pdf-o' }, { value: 'svg', label: 'SVG', icon: 'fa-file-image-o' },
    { value: 'xlsx', label: 'Excel', icon: 'fa-file-excel-o' },
    { value: 'csv', label: 'CSV', icon: 'fa-file-text-o' }, { value: 'ubl', label: t('billing-e-invoice'), icon: 'fa-file-code-o' },
  ],
  printed: () => Template.instance().printed.get(),
  // The parent's reload, handed on by a helper: written `reload=reload`,
  // Spacebars would call the function it finds in this data context instead
  // of passing it on.
  reloadFn: () => Template.currentData().reload,
  setPrinted() {
    const tpl = Template.instance();
    return invoice => tpl.printed.set(invoice);
  },
  actionError: () => Template.instance().actionError.get(),
  isNegative: value => typeof value === 'number' && value < 0,
  isNumber: value => typeof value === 'number',
  billsTime: () => detail().profile.billTime !== false,
  quoteValidDays: () => detail().profile.quoteValidDays || 30,
  expenseCategories: () => EXPENSE_CATEGORIES.map(value => ({ value, label: t(`billing-expense-${value}`) })),
  expenseCategory: value => t(`billing-expense-${value}`),
  lineKind: line => line.kind || 'time',
  lineKindLabel: line => t(LINE_KIND_LABEL_KEYS[line.kind] || 'billing-line-fee'),
  quoteStatusLabel: status => stateLabel(status, 'quote'),
  nextQuoteStatuses: quote => (QUOTE_NEXT[quote.status] || []).map(value => ({ value, label: t(QUOTE_ACTION_KEYS[value]) })),
  quoteFormats: () => [
    { value: 'pdf', label: 'PDF', icon: 'fa-file-pdf-o' }, { value: 'svg', label: 'SVG', icon: 'fa-file-image-o' },
    { value: 'xlsx', label: 'Excel', icon: 'fa-file-excel-o' }, { value: 'csv', label: 'CSV', icon: 'fa-file-text-o' },
  ],
});

function field(form, name) {
  const el = form.elements[name];
  return el ? String(el.value).trim() : '';
}

function numberOrUndefined(value) {
  return value === '' ? undefined : parseFloat(value);
}

function saveProfile(tpl, changes) {
  const current = detail().profile || {};
  return tpl.done(Meteor.callAsync('billingSetProfile', detail().board._id, { ...current, ...changes }));
}

function openQuote(tpl, id) {
  return Meteor.callAsync('billingQuote', id)
    .then(quote => tpl.printed.set(quote))
    .catch(error => tpl.actionError.set(errorText(error)));
}

function openInvoice(tpl, id) {
  return Meteor.callAsync('billingInvoice', id)
    .then(invoice => tpl.printed.set(invoice))
    .catch(error => tpl.actionError.set(errorText(error)));
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
    if (field(form, 'costRate')) rate.costRate = parseFloat(field(form, 'costRate'));
    tpl.done(Meteor.callAsync('billingSetRate', detail().board._id, rate).then(() => form.reset()));
  },
  'click .js-billing-remove-rate'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingRemoveRate', evt.currentTarget.getAttribute('data-id')));
  },
  'submit .js-billing-profile'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const changes = {};
    for (const name of ['issuerName', 'issuerAddress', 'issuerCountry', 'businessId', 'vatId', 'email', 'phone', 'website', 'referenceType', 'footer',
      'customer', 'customerCountry', 'customerVatId']) {
      changes[name] = field(form, name);
    }
    changes.vatPercent = numberOrUndefined(field(form, 'vatPercent')) || 0;
    changes.paymentTermsDays = parseInt(field(form, 'paymentTermsDays'), 10);
    if (!Number.isInteger(changes.paymentTermsDays)) changes.paymentTermsDays = 14;
    changes.penaltyInterestPercent = numberOrUndefined(field(form, 'penaltyInterestPercent')) || 0;
    changes.reverseCharge = form.elements.reverseCharge.checked === true;
    changes.billTime = form.elements.billTime.checked === true;
    changes.approveTime = form.elements.approveTime.checked === true;
    changes.quoteValidDays = parseInt(field(form, 'quoteValidDays'), 10);
    if (!Number.isInteger(changes.quoteValidDays)) changes.quoteValidDays = 30;
    saveProfile(tpl, changes);
  },
  'submit .js-billing-expense'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const expense = { date: field(form, 'date'), amount: parseFloat(field(form, 'amount')), currency: field(form, 'currency'),
      category: field(form, 'category'), description: field(form, 'description'), billable: form.elements.billable.checked === true };
    if (field(form, 'markupPercent')) expense.markupPercent = parseFloat(field(form, 'markupPercent'));
    for (const name of ['cardId', 'userId']) if (field(form, name)) expense[name] = field(form, name);
    tpl.done(Meteor.callAsync('billingAddExpense', detail().board._id, expense).then(() => form.reset()));
  },
  'click .js-billing-remove-expense'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingRemoveExpense', evt.currentTarget.getAttribute('data-id')));
  },
  'submit .js-billing-fee'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const fee = { title: field(form, 'title'), amount: parseFloat(field(form, 'amount')), currency: field(form, 'currency'),
      date: field(form, 'date'), recurring: field(form, 'recurring') };
    if (fee.recurring === 'monthly' && field(form, 'end')) fee.end = field(form, 'end');
    tpl.done(Meteor.callAsync('billingAddFee', detail().board._id, fee).then(() => form.reset()));
  },
  'click .js-billing-remove-fee'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingRemoveFee', evt.currentTarget.getAttribute('data-id')));
  },
  'click .js-billing-decide'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget.closest('form');
    const entryIds = [...form.querySelectorAll('input[name=entry]:checked')].map(el => el.value);
    if (!entryIds.length) return;
    const approval = { entryIds, decision: evt.currentTarget.getAttribute('data-decision') };
    if (field(form, 'note')) approval.note = field(form, 'note');
    tpl.done(Meteor.callAsync('billingApproveTime', detail().board._id, approval));
  },
  'submit .js-billing-quote'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const request = {};
    for (const name of ['customer', 'issueDate', 'validUntil', 'notes']) if (field(form, name)) request[name] = field(form, name);
    tpl.done(Meteor.callAsync('billingCreateQuote', detail().board._id, request).then(id => { form.reset(); return openQuote(tpl, id); }));
  },
  'click .js-billing-quote-status'(evt, tpl) {
    evt.preventDefault();
    const el = evt.currentTarget;
    const status = el.getAttribute('data-status');
    const box = tpl.find('.js-billing-accept-budget');
    const options = status === 'accepted' && box && box.checked ? { setBudget: true } : undefined;
    tpl.done(Meteor.callAsync('billingSetQuoteStatus', el.getAttribute('data-id'), status, options));
  },
  'click .js-billing-quote-open'(evt, tpl) {
    evt.preventDefault();
    openQuote(tpl, evt.currentTarget.getAttribute('data-id'));
  },
  'click .js-billing-quote-file'(evt, tpl) {
    evt.preventDefault();
    const el = evt.currentTarget;
    Meteor.callAsync('billingQuoteFile', el.getAttribute('data-id'), el.getAttribute('data-format'))
      .then(file => download(file.name, file.mime, file))
      .catch(error => tpl.actionError.set(errorText(error)));
  },
  'change .js-billing-method-type'(evt, tpl) {
    tpl.methodType.set(evt.currentTarget.value);
  },
  'submit .js-billing-method'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const type = field(form, 'type');
    const method = { type };
    for (const name of PAYMENT_METHODS[type].fields) method[name] = field(form, name);
    const methods = [...(detail().profile.paymentMethods || []), method];
    saveProfile(tpl, { paymentMethods: methods }).then(() => form.reset());
  },
  'click .js-billing-remove-method'(evt, tpl) {
    evt.preventDefault();
    const index = parseInt(evt.currentTarget.getAttribute('data-index'), 10);
    saveProfile(tpl, { paymentMethods: (detail().profile.paymentMethods || []).filter((m, i) => i !== index) });
  },
  'change .js-billing-period'(evt) {
    const form = evt.currentTarget;
    const { setPeriod } = Template.currentData();
    setPeriod({ periodStart: field(form, 'periodStart'), periodEnd: field(form, 'periodEnd'), includeUndated: form.elements.includeUndated.checked === true });
  },
  'submit .js-billing-invoice'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const request = {};
    for (const name of ['customer', 'customerCountry', 'customerVatId', 'reference', 'notes', 'issueDate', 'dueDate']) {
      if (field(form, name)) request[name] = field(form, name);
    }
    if (field(form, 'vatPercent')) request.vatPercent = parseFloat(field(form, 'vatPercent'));
    const p = Template.currentData().period || {};
    if (p.periodStart) request.periodStart = p.periodStart;
    if (p.periodEnd) request.periodEnd = p.periodEnd;
    if (p.includeUndated) request.includeUndated = true;
    tpl.done(Meteor.callAsync('billingCreateInvoice', detail().board._id, request).then(id => { form.reset(); return openInvoice(tpl, id); }));
  },
  'click .js-billing-status'(evt, tpl) {
    evt.preventDefault();
    const el = evt.currentTarget;
    tpl.done(Meteor.callAsync('billingSetInvoiceStatus', el.getAttribute('data-id'), el.getAttribute('data-status')));
  },
  'click .js-billing-credit'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('billingCreditInvoice', evt.currentTarget.getAttribute('data-id'), {}).then(id => openInvoice(tpl, id)));
  },
  'click .js-billing-open'(evt, tpl) {
    evt.preventDefault();
    openInvoice(tpl, evt.currentTarget.getAttribute('data-id'));
  },
  'click .js-billing-file'(evt, tpl) {
    evt.preventDefault();
    const el = evt.currentTarget;
    Meteor.callAsync('billingInvoiceFile', el.getAttribute('data-id'), el.getAttribute('data-format'))
      .then(file => download(file.name, file.mime, file))
      .catch(error => tpl.actionError.set(errorText(error)));
  },
});

// ---------------------------------------------------------------- the invoice

Template.billingInvoicePrint.helpers({
  money,
  signedMoney,
  statusLabel: (state, kind) => stateLabel(state, typeof kind === 'string' ? kind : ''),
  isInvoice: invoice => (invoice.kind || 'invoice') === 'invoice',
  methodTitle: item => item.label || methodTitle(item.type),
  formattedReference() {
    return formatReference(Template.currentData().invoice.paymentReference);
  },
  qrSvg: item => qrSvg(item.qr, item.swissCross),
  barcodeSvg,
  today: () => new Date().toISOString().slice(0, 10),
  dueAmount() {
    const inv = Template.currentData().invoice;
    return minorToText(inv.dueMinor, inv.currency);
  },
});

// The board template keeps the open invoice; it hands down setPrinted.
function reloadInvoice() {
  const data = Template.currentData();
  if (typeof data.reload === 'function') data.reload();
  return Meteor.callAsync('billingInvoice', data.invoice._id).then(invoice => data.setPrinted(invoice));
}

Template.billingInvoicePrint.events({
  'submit .js-billing-payment'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const payment = { date: form.elements.date.value, amount: parseFloat(form.elements.amount.value) };
    if (form.elements.method.value.trim()) payment.method = form.elements.method.value.trim();
    Meteor.callAsync('billingAddPayment', Template.currentData().invoice._id, payment).then(() => reloadInvoice())
      .catch(error => { form.querySelector('[name=amount]').setCustomValidity(errorText(error)); form.reportValidity(); });
  },
  'click .js-billing-remove-payment'(evt, tpl) {
    evt.preventDefault();
    Meteor.callAsync('billingRemovePayment', Template.currentData().invoice._id, evt.currentTarget.getAttribute('data-id')).then(() => reloadInvoice());
  },
  'click .js-billing-print-now'(evt) {
    evt.preventDefault();
    window.print();
  },
  'click .js-billing-print-close'(evt) {
    evt.preventDefault();
    Template.currentData().setPrinted(null);
  },
});
