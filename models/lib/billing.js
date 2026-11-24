'use strict';

// Budget and billing (docs/Features/Billing/README.md): what a board's work
// costs, against its budget, and the invoices of the time spent on it.
//
// Pure - no Meteor, no database - so the money is tested as arithmetic
// (tests/billing.test.cjs) and server/billing.js only gathers the documents
// and stores what this module returns.
//
// Money is kept in integer MINOR units (cents) with an ISO 4217 currency
// code, never as a float: 0.1 + 0.2 is not 0.3, and an invoice has to add up.
// Hours are numbers of hours. An invoice is made of time entries
// (models/lib/timeEntries.js), each with its day and who logged it, so it can
// cover a period and charge each person at their own rate.

const { finnishReference, rfReference, normalizePaymentMethod } = require('./paymentCodes');
const { entriesInPeriod } = require('./timeEntries');
const { toMinorUnits, fromMinorUnits, minorToText, minorUnits } = require('./currencies');

const MAX_MINOR = 1e13; // 100 000 000 000.00 of any currency
const MAX_HOURS = 1e6;
const INVOICE_STATUSES = Object.freeze(['draft', 'sent', 'paid', 'void', 'credited']);
// The kinds of an invoice line, the one list (models/billing.js's schema,
// the Budget and billing page, the e-invoice): time (hours at a rate; a line
// with no kind is time), a fixed fee, an expense, and a product sold in Board
// View / Shop (a quantity at a unit price, models/lib/shop.js invoiceLinesOf).
// tests/billingLineKinds.test.cjs fails when a place listing them forgets one.
const INVOICE_LINE_KINDS = Object.freeze(['time', 'fee', 'expense', 'product']);
// The label of each kind a line names (time lines show their hours instead).
const LINE_KIND_LABEL_KEYS = Object.freeze({ fee: 'billing-line-fee', expense: 'billing-line-expense', product: 'billing-line-product' });

function isInvoiceLineKind(kind) {
  return kind === undefined || INVOICE_LINE_KINDS.includes(kind);
}
const CURRENCY = /^[A-Z]{3}$/;

function fail(message) { throw new Error(message); }

function plainObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected an object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`Unsupported field: ${key}`);
  return value;
}

function text(value, max, message) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail(message);
  return value.trim();
}

function currency(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!CURRENCY.test(code)) fail('Use a three-letter currency code, such as EUR or USD');
  return code;
}

// A money amount given in major units (12.5 EUR, 1000 JPY) to the integer of
// its currency's minor unit (models/lib/currencies.js): 1250, 1000.
function toMinor(amount, cur = 'EUR') {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) fail('An amount is a number of at least 0');
  const minor = toMinorUnits(amount, cur);
  if (minor > MAX_MINOR) fail('The amount is too large');
  return minor;
}

// An ISO 3166 two-letter country code, or '' when not given.
function country(value) {
  if (value === undefined || value === null || value === '') return '';
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z]{2}$/.test(code)) fail('Use a two-letter country code, such as FI or DE');
  return code;
}

function percent(value, message) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) fail(message);
  return Math.round(value * 100) / 100;
}

function day(value, message = 'Use a date written YYYY-MM-DD') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) fail(message);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('Invalid calendar date');
  return value;
}

function addDays(value, n) {
  return new Date(Date.parse(`${value}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- inputs

// An hourly rate on a board: a member's, or - with no person - the board's
// default for everybody without one of their own.
function normalizeRate(value) {
  const v = plainObject(value, ['userId', 'hourlyRate', 'currency', 'costRate']);
  const userId = v.userId === undefined || v.userId === null || v.userId === '' ? null : text(v.userId, 100, 'Invalid person');
  const cur = currency(v.currency);
  const out = { userId, hourlyRateMinor: toMinor(v.hourlyRate, cur), currency: cur };
  // What an hour of this person costs the company (salary and overheads), for
  // the margin; never on an invoice.
  if (v.costRate !== undefined && v.costRate !== null && v.costRate !== '') out.costRateMinor = toMinor(v.costRate, cur);
  return out;
}

// Expenses: what was spent on a board's work besides time - travel, a hotel,
// materials, a subcontractor - in money, on a day.
const EXPENSE_CATEGORIES = Object.freeze(['travel', 'accommodation', 'meals', 'materials', 'subcontracting', 'software', 'other']);

function optionalId(value) {
  return value === undefined || value === null || value === '' ? null : text(value, 100, 'Invalid id');
}

function normalizeExpense(value) {
  const v = plainObject(value, ['date', 'amount', 'currency', 'category', 'description', 'billable', 'markupPercent', 'cardId', 'userId']);
  const date = day(v.date);
  if (!date) fail('An expense has a date');
  const cur = currency(v.currency);
  const amountMinor = toMinor(v.amount, cur);
  if (amountMinor < 1) fail('An expense is more than 0');
  const category = v.category === undefined || v.category === '' ? 'other' : v.category;
  if (!EXPENSE_CATEGORIES.includes(category)) fail('Invalid expense category');
  return {
    date, amountMinor, currency: cur, category,
    description: text(v.description, 200, 'The description is too long'),
    billable: v.billable !== false,
    markupPercent: percent(v.markupPercent, 'Markup is 0 to 100 %') || 0,
    cardId: optionalId(v.cardId),
    userId: optionalId(v.userId),
  };
}

// What an expense is billed at: its amount and the markup.
function expenseCharge(expense) {
  return Math.round((expense.amountMinor || 0) * (100 + (expense.markupPercent || 0)) / 100);
}

// A fixed fee: a milestone or a fixed price, billed once on its day, or a
// retainer, billed every month from its day until its end.
function normalizeFee(value) {
  const v = plainObject(value, ['title', 'amount', 'currency', 'date', 'recurring', 'end']);
  const title = text(v.title, 200, 'The title is too long');
  if (!title) fail('A fee has a title');
  const cur = currency(v.currency);
  const amountMinor = toMinor(v.amount, cur);
  if (amountMinor < 1) fail('A fee is more than 0');
  const date = day(v.date);
  if (!date) fail('A fee has a date');
  const recurring = v.recurring === undefined || v.recurring === '' ? 'none' : v.recurring;
  if (!['none', 'monthly'].includes(recurring)) fail('A fee is billed once or monthly');
  const end = recurring === 'monthly' ? day(v.end) : null;
  if (end && end < date) fail('The end must not be before the start');
  return { title, amountMinor, currency: cur, date, recurring, end };
}

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The days a fee is due on, up to `until`: once on its day, or monthly on the
 * same day of each month (the last day of a shorter month). Each occurrence
 * has a key, so an invoice can say which it billed.
 */
function feeOccurrences(fee, until) {
  if (!fee || !fee.date) return [];
  if (fee.recurring !== 'monthly') {
    return until && fee.date > until ? [] : [{ key: String(fee._id || ''), date: fee.date }];
  }
  const out = [];
  const [y0, m0, d0] = fee.date.split('-').map(Number);
  const stop = [fee.end, until].filter(Boolean).sort()[0] || null;
  if (!stop) return out; // a retainer with no end is billed up to a day, never forever
  for (let i = 0; i < 1200; i += 1) {
    const year = y0 + Math.floor((m0 - 1 + i) / 12);
    const month = ((m0 - 1 + i) % 12) + 1;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(d0, lastDayOfMonth(year, month))).padStart(2, '0')}`;
    if (date > stop) break;
    out.push({ key: `${fee._id || ''}:${date.slice(0, 7)}`, date });
  }
  return out;
}

// The fee occurrences already on an invoice that still stands: a voided or
// credited invoice frees them.
function invoicedFeeKeys(invoices) {
  const keys = new Set();
  for (const invoice of invoices || []) {
    if (!invoice || invoice.kind === 'credit' || ['void', 'credited'].includes(invoice.status)) continue;
    for (const line of invoice.lines || []) if (line && line.feeKey) keys.add(line.feeKey);
  }
  return keys;
}

// A board admin's decision on time logged: approved, or sent back.
function normalizeApproval(value) {
  const v = plainObject(value, ['entryIds', 'decision', 'note']);
  if (!Array.isArray(v.entryIds) || !v.entryIds.length || v.entryIds.length > 500) fail('Choose 1 to 500 entries');
  const entryIds = [...new Set(v.entryIds.map(id => text(id, 100, 'Invalid id')))];
  if (!['approved', 'rejected', 'pending'].includes(v.decision)) fail('Invalid decision');
  return { entryIds, decision: v.decision, note: text(v.note, 200, 'The note is too long') };
}

// A board's budget: money, hours or both, for an optional period.
function normalizeBudget(value) {
  const v = plainObject(value, ['amount', 'currency', 'hours', 'start', 'end', 'name']);
  const hasAmount = v.amount !== undefined && v.amount !== null && v.amount !== '';
  const hasHours = v.hours !== undefined && v.hours !== null && v.hours !== '';
  if (!hasAmount && !hasHours) fail('A budget has an amount, hours, or both');
  const start = day(v.start);
  const end = day(v.end);
  if (start && end && end < start) fail('The end must not be before the start');
  let hours = null;
  if (hasHours) {
    if (typeof v.hours !== 'number' || !Number.isFinite(v.hours) || v.hours < 0 || v.hours > MAX_HOURS) fail('Hours must be between 0 and 1000000');
    hours = v.hours;
  }
  const cur = hasAmount ? currency(v.currency) : (v.currency ? currency(v.currency) : null);
  return {
    name: text(v.name, 100, 'The name is too long'),
    amountMinor: hasAmount ? toMinor(v.amount, cur) : null,
    currency: cur,
    hours,
    start,
    end,
  };
}

// Who sends a board's invoices, and how they are paid: the issuer's details,
// the default VAT and payment terms, the payment methods offered, and the kind
// of payment reference the invoices carry.
function normalizeProfile(value) {
  const v = plainObject(value, ['issuerName', 'issuerAddress', 'issuerCountry', 'businessId', 'vatId', 'email', 'phone', 'website',
    'vatPercent', 'paymentTermsDays', 'penaltyInterestPercent', 'referenceType', 'footer', 'paymentMethods', 'reverseCharge',
    'billTime', 'approveTime', 'customer', 'customerCountry', 'customerVatId', 'quoteValidDays']);
  const validDays = v.quoteValidDays === undefined || v.quoteValidDays === null || v.quoteValidDays === '' ? 30 : v.quoteValidDays;
  if (!Number.isInteger(validDays) || validDays < 1 || validDays > 365) fail('A quote is valid 1 to 365 days');
  const terms = v.paymentTermsDays === undefined || v.paymentTermsDays === null || v.paymentTermsDays === '' ? 14 : v.paymentTermsDays;
  if (!Number.isInteger(terms) || terms < 0 || terms > 365) fail('Payment terms are 0 to 365 days');
  const referenceType = v.referenceType === undefined ? 'rf' : v.referenceType;
  if (!['fi', 'rf', 'be', 'no', 'se', 'none'].includes(referenceType)) fail('Invalid reference type');
  const methods = v.paymentMethods === undefined ? [] : v.paymentMethods;
  if (!Array.isArray(methods) || methods.length > 20) fail('At most 20 payment methods');
  return {
    issuerName: text(v.issuerName, 200, 'The issuer name is too long'),
    issuerAddress: text(v.issuerAddress, 500, 'The address is too long'),
    issuerCountry: country(v.issuerCountry),
    businessId: text(v.businessId, 50, 'The business ID is too long'),
    vatId: text(v.vatId, 50, 'The VAT ID is too long'),
    email: text(v.email, 200, 'The email is too long'),
    phone: text(v.phone, 50, 'The phone is too long'),
    website: text(v.website, 200, 'The website is too long'),
    vatPercent: percent(v.vatPercent, 'VAT is 0 to 100 %') || 0,
    paymentTermsDays: terms,
    penaltyInterestPercent: percent(v.penaltyInterestPercent, 'Penalty interest is 0 to 100 %') || 0,
    referenceType,
    reverseCharge: v.reverseCharge === true,
    footer: text(v.footer, 1000, 'The footer is too long'),
    paymentMethods: methods.map(normalizePaymentMethod),
    // Time is billed by the hour, unless the board is a fixed price - then
    // only its fees and expenses are invoiced.
    billTime: v.billTime !== false,
    // Only time a board admin has approved is invoiced.
    approveTime: v.approveTime === true,
    // The board's customer, filled in on each new invoice and quote.
    customer: text(v.customer, 500, 'The customer is too long'),
    customerCountry: country(v.customerCountry),
    customerVatId: text(v.customerVatId, 50, 'The VAT ID is too long'),
    quoteValidDays: validDays,
  };
}

function normalizeQuoteRequest(value) {
  const v = plainObject(value, ['customer', 'customerCountry', 'customerVatId', 'reference', 'notes', 'issueDate', 'validUntil', 'vatPercent']);
  const issueDate = day(v.issueDate);
  const validUntil = day(v.validUntil);
  if (issueDate && validUntil && validUntil < issueDate) fail('A quote must not expire before it is made');
  return {
    customer: text(v.customer, 500, 'The customer is too long'),
    customerCountry: country(v.customerCountry),
    customerVatId: text(v.customerVatId, 50, 'The VAT ID is too long'),
    reference: text(v.reference, 100, 'The reference is too long'),
    notes: text(v.notes, 2000, 'The notes are too long'),
    issueDate,
    validUntil,
    vatPercent: percent(v.vatPercent, 'VAT is 0 to 100 %'),
  };
}

function normalizeInvoiceRequest(value) {
  const v = plainObject(value, ['customer', 'customerCountry', 'customerVatId', 'reference', 'notes', 'issueDate', 'dueDate',
    'periodStart', 'periodEnd', 'includeUndated', 'vatPercent']);
  const issueDate = day(v.issueDate);
  const dueDate = day(v.dueDate);
  if (issueDate && dueDate && dueDate < issueDate) fail('The due date must not be before the issue date');
  const periodStart = day(v.periodStart);
  const periodEnd = day(v.periodEnd);
  if (periodStart && periodEnd && periodEnd < periodStart) fail('The period must not end before it starts');
  return {
    customer: text(v.customer, 500, 'The customer is too long'),
    customerCountry: country(v.customerCountry),
    customerVatId: text(v.customerVatId, 50, 'The VAT ID is too long'),
    reference: text(v.reference, 100, 'The reference is too long'),
    notes: text(v.notes, 2000, 'The notes are too long'),
    issueDate,
    dueDate,
    periodStart,
    periodEnd,
    includeUndated: v.includeUndated === true,
    vatPercent: percent(v.vatPercent, 'VAT is 0 to 100 %'),
  };
}

function normalizeInvoiceStatus(value) {
  if (!INVOICE_STATUSES.includes(value)) fail('Invalid invoice status');
  return value;
}

// A payment received against an invoice, in the invoice's currency.
function normalizePayment(value, cur = 'EUR') {
  const v = plainObject(value, ['date', 'amount', 'method', 'note']);
  const date = day(v.date);
  if (!date) fail('A payment has a date');
  const amountMinor = toMinor(v.amount, cur);
  if (amountMinor < 1) fail('A payment is more than 0');
  return { date, amountMinor, method: text(v.method, 50, 'Invalid method'), note: text(v.note, 200, 'The note is too long') };
}

// ---------------------------------------------------------------- cost

function hoursOf(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

// Who a card's hours are charged as, when an entry does not say: its
// assignees, or its members, shared equally; with nobody, the board's default.
function cardPeople(card) {
  const assignees = ((card && card.assignees) || []).filter(Boolean);
  return [...new Set(assignees.length ? assignees : ((card && card.members) || []).filter(Boolean))];
}

// The rate for a person on a board: their own, else the board default, else
// none. Rates of another currency than the board's are not mixed in.
function rateFor(rates, userId, boardCurrency) {
  const own = (rates || []).find(r => r.userId && r.userId === userId && (!boardCurrency || r.currency === boardCurrency));
  if (own) return own;
  return (rates || []).find(r => !r.userId && (!boardCurrency || r.currency === boardCurrency)) || null;
}

// The currency a board is billed in: its budget's, else its default rate's,
// else the first rate's.
function boardCurrency(rates, budget) {
  if (budget && budget.currency) return budget.currency;
  const def = (rates || []).find(r => !r.userId);
  if (def) return def.currency;
  return (rates || [])[0] ? rates[0].currency : null;
}

function chargedShares(card, hours, rates, cur) {
  if (!(hours > 0)) return [];
  const people = cardPeople(card);
  const carriers = people.length ? people : [null];
  return carriers.map(userId => {
    const rate = rateFor(rates, userId, cur);
    return { userId, hours: hours / carriers.length, rateMinor: rate ? rate.hourlyRateMinor : null };
  });
}

function amountMinor(hours, rateMinor) {
  return rateMinor === null ? 0 : Math.round(hours * rateMinor);
}

function isBillable(card) {
  return !card || card.billable !== false;
}

// The net of an invoice for the board's numbers: a credit note takes off.
function invoiceNet(invoice) {
  const net = typeof invoice.netMinor === 'number' ? invoice.netMinor : (invoice.totalMinor || 0);
  return invoice.kind === 'credit' ? -net : net;
}

/**
 * What a board's work costs, against its budget.
 *
 * @param {Object} input
 * @param {Array}  input.cards    [{ _id, spentTime, estimatedHours, dueComplete, archived, assignees, members, billable }]
 * @param {Array}  input.rates    [{ userId|null, hourlyRateMinor, currency }]
 * @param {Object} input.budget   { amountMinor|null, currency|null, hours|null } or null
 * @param {Array}  input.invoices [{ status, kind, netMinor, totalMinor, currency, payments }]
 */
function boardFinance({ cards = [], rates = [], budget = null, invoices = [], expenses = [], unbilledMinor = 0 }) {
  const cur = boardCurrency(rates, budget);
  let spentHours = 0;
  let remainingHours = 0;
  let spentMinor = 0;
  let remainingMinor = 0;
  let billableHours = 0;
  let unratedHours = 0;
  let laborCostMinor = 0;
  let uncostedHours = 0;
  for (const card of cards) {
    const spent = hoursOf(card.spentTime);
    const estimate = hoursOf(card.estimatedHours);
    const remaining = card.dueComplete === true || card.archived === true ? 0 : Math.max(estimate - spent, 0);
    spentHours += spent;
    remainingHours += remaining;
    if (isBillable(card)) billableHours += spent;
    for (const share of chargedShares(card, spent, rates, cur)) {
      if (share.rateMinor === null) unratedHours += share.hours;
      spentMinor += amountMinor(share.hours, share.rateMinor);
      const rate = rateFor(rates, share.userId, cur);
      if (rate && typeof rate.costRateMinor === 'number') laborCostMinor += Math.round(share.hours * rate.costRateMinor);
      else uncostedHours += share.hours;
    }
    for (const share of chargedShares(card, remaining, rates, cur)) {
      remainingMinor += amountMinor(share.hours, share.rateMinor);
    }
  }
  // Expenses spend the budget at what they cost; billed, they bring in their
  // charge with the markup.
  const ownExpenses = (expenses || []).filter(e => e && (!cur || e.currency === cur));
  const expenseMinor = ownExpenses.reduce((s, e) => s + (e.amountMinor || 0), 0);
  spentMinor += expenseMinor;
  const live = invoices.filter(i => !['void', 'draft'].includes(i.status) && (!cur || i.currency === cur));
  const invoicedMinor = live.reduce((s, i) => s + invoiceNet(i), 0);
  const paidMinor = live.filter(i => i.kind !== 'credit').reduce((s, i) => s + paidOf(i), 0);
  const forecastMinor = spentMinor + remainingMinor;
  // Profitability: what the work brings in - invoiced, and billable but not
  // invoiced yet (work in progress) - less what it cost: the hours at their
  // cost rates and the expenses.
  const revenueMinor = invoicedMinor + (unbilledMinor || 0);
  const costMinor = laborCostMinor + expenseMinor;
  const marginMinor = revenueMinor - costMinor;
  const forecastHours = spentHours + remainingHours;
  const round = n => Math.round(n * 100) / 100;
  const result = {
    currency: cur,
    spentHours: round(spentHours),
    remainingHours: round(remainingHours),
    forecastHours: round(forecastHours),
    billableHours: round(billableHours),
    unratedHours: round(unratedHours),
    spentMinor,
    remainingMinor,
    forecastMinor,
    invoicedMinor,
    paidMinor,
    budgetMinor: budget && budget.amountMinor !== null && budget.amountMinor !== undefined ? budget.amountMinor : null,
    budgetHours: budget && typeof budget.hours === 'number' ? budget.hours : null,
    expenseMinor,
    unbilledMinor: unbilledMinor || 0,
    laborCostMinor,
    uncostedHours: round(uncostedHours),
    hasCostRates: (rates || []).some(r => typeof r.costRateMinor === 'number'),
    revenueMinor,
    costMinor,
    marginMinor,
    marginPercent: revenueMinor > 0 ? Math.round(marginMinor / revenueMinor * 100) : null,
  };
  result.usedPercent = result.budgetMinor ? Math.round(spentMinor / result.budgetMinor * 100)
    : (result.budgetHours ? Math.round(spentHours / result.budgetHours * 100) : null);
  result.forecastPercent = result.budgetMinor ? Math.round(forecastMinor / result.budgetMinor * 100)
    : (result.budgetHours ? Math.round(forecastHours / result.budgetHours * 100) : null);
  result.leftMinor = result.budgetMinor === null ? null : result.budgetMinor - spentMinor;
  result.leftHours = result.budgetHours === null ? null : round(result.budgetHours - spentHours);
  result.overBudget = (result.budgetMinor !== null && forecastMinor > result.budgetMinor)
    || (result.budgetHours !== null && forecastHours > result.budgetHours + 1e-9);
  return result;
}

// ---------------------------------------------------------------- invoices

/**
 * The lines of a new invoice: the billable time entries of the period that
 * are on no invoice yet, per card and person, at that person's rate. Entries
 * a person logged are charged at their rate; undated time from before entries
 * were kept is charged as the card's carriers, and taken only when asked.
 * Cards marked not billable are left out. Time with no rate in the board's
 * currency is reported as `unratedHours`, so nobody bills it at zero by
 * accident.
 */
function draftInvoiceLines({ cards = [], entries = [], rates = [], budget = null, period = {}, expenses = [], fees = [],
  invoices = [], billTime = true, approveTime = false, today = null }) {
  const cur = boardCurrency(rates, budget) || ((fees || [])[0] || {}).currency || ((expenses || [])[0] || {}).currency || null;
  if (!cur) fail('Set an hourly rate for this board first');
  const byCard = new Map(cards.map(c => [c._id, c]));
  const billableOpen = billTime ? entriesInPeriod(entries.filter(e => e && !e.invoiceId), period)
    .filter(e => byCard.has(e.cardId) && isBillable(byCard.get(e.cardId))) : [];
  // With approval on, only approved time is billed; the rest waits.
  const open = approveTime ? billableOpen.filter(e => e.approval === 'approved') : billableOpen;
  const unapprovedHours = approveTime ? billableOpen.filter(e => e.approval !== 'approved').reduce((s, e) => s + e.hours, 0) : 0;
  const groups = new Map();
  let undatedHours = 0;
  for (const entry of open) {
    const card = byCard.get(entry.cardId);
    if (!entry.date) undatedHours += entry.hours;
    const shares = entry.userId ? [{ userId: entry.userId, hours: entry.hours }]
      : (cardPeople(card).length ? cardPeople(card) : [null]).map((userId, i, all) => ({ userId, hours: entry.hours / all.length }));
    for (const share of shares) {
      const key = `${entry.cardId}\u0000${share.userId || ''}`;
      const g = groups.get(key) || { cardId: entry.cardId, title: String(card.title || '').slice(0, 500), userId: share.userId, hours: 0, entryIds: new Set(),
        first: null, last: null };
      g.hours += share.hours;
      g.entryIds.add(entry._id);
      if (entry.date) {
        if (!g.first || entry.date < g.first) g.first = entry.date;
        if (!g.last || entry.date > g.last) g.last = entry.date;
      }
      groups.set(key, g);
    }
  }
  const lines = [];
  const used = new Set();
  let unratedHours = 0;
  for (const g of groups.values()) {
    const hours = Math.round(g.hours * 10000) / 10000;
    if (!(hours > 1e-9)) continue; // corrections that net to nothing stay open
    const rate = rateFor(rates, g.userId, cur);
    if (!rate) { unratedHours += hours; continue; }
    for (const id of g.entryIds) used.add(id);
    lines.push({ cardId: g.cardId, title: g.title, userId: g.userId, hours, rateMinor: rate.hourlyRateMinor,
      amountMinor: amountMinor(hours, rate.hourlyRateMinor), firstDate: g.first, lastDate: g.last });
  }
  lines.sort((a, b) => (a.title || '').localeCompare(b.title || '') || String(a.userId).localeCompare(String(b.userId)));
  // Fixed fees due in the period that no standing invoice has billed.
  const until = period.end || today;
  const billed = invoicedFeeKeys(invoices);
  for (const fee of fees || []) {
    if (!fee || fee.currency !== cur) continue;
    for (const o of feeOccurrences(fee, until)) {
      if (billed.has(o.key) || (period.start && o.date < period.start)) continue;
      lines.push({ kind: 'fee', feeId: fee._id, feeKey: o.key, title: String(fee.title || '').slice(0, 500), amountMinor: fee.amountMinor,
        firstDate: o.date, lastDate: o.date });
    }
  }
  // Billable expenses of the period not invoiced yet, at their charge.
  const expenseIds = [];
  let otherCurrencyExpenses = 0;
  for (const e of entriesInPeriod((expenses || []).filter(x => x && !x.invoiceId && x.billable !== false), period)) {
    if (e.currency !== cur) { otherCurrencyExpenses += 1; continue; }
    expenseIds.push(e._id);
    lines.push({ kind: 'expense', expenseId: e._id, category: e.category, title: String(e.description || e.category || '').slice(0, 500),
      cardId: e.cardId || undefined, userId: e.userId || undefined, amountMinor: expenseCharge(e), firstDate: e.date, lastDate: e.date });
  }
  const netMinor = lines.reduce((s, l) => s + l.amountMinor, 0);
  const totalHours = Math.round(lines.reduce((s, l) => s + (l.hours || 0), 0) * 100) / 100;
  return { currency: cur, lines, netMinor, totalHours, entryIds: [...used], expenseIds, otherCurrencyExpenses,
    unratedHours: Math.round(unratedHours * 100) / 100, undatedHours: Math.round(undatedHours * 100) / 100,
    unapprovedHours: Math.round(unapprovedHours * 100) / 100 };
}

/**
 * The lines of a quote: the work still to do on the board's open, billable
 * cards - each card's estimate less the time spent - at its carriers' rates,
 * and the fixed fees not invoiced yet (a retainer to its end).
 */
function draftQuoteLines({ cards = [], rates = [], budget = null, fees = [], invoices = [] }) {
  const cur = boardCurrency(rates, budget) || ((fees || [])[0] || {}).currency || null;
  if (!cur) fail('Set an hourly rate for this board first');
  const lines = [];
  let unratedHours = 0;
  for (const card of cards) {
    if (!card || card.dueComplete === true || card.archived === true || !isBillable(card)) continue;
    const remaining = Math.max(hoursOf(card.estimatedHours) - hoursOf(card.spentTime), 0);
    if (!(remaining > 1e-9)) continue;
    for (const share of chargedShares(card, remaining, rates, cur)) {
      const hours = Math.round(share.hours * 10000) / 10000;
      if (share.rateMinor === null) { unratedHours += hours; continue; }
      const line = { cardId: card._id, title: String(card.title || '').slice(0, 500), hours, rateMinor: share.rateMinor,
        amountMinor: amountMinor(hours, share.rateMinor) };
      if (share.userId) line.userId = share.userId;
      lines.push(line);
    }
  }
  lines.sort((a, b) => (a.title || '').localeCompare(b.title || '') || String(a.userId).localeCompare(String(b.userId)));
  const billed = invoicedFeeKeys(invoices);
  for (const fee of fees || []) {
    if (!fee || fee.currency !== cur) continue;
    for (const o of feeOccurrences(fee, fee.recurring === 'monthly' ? fee.end : null)) {
      if (billed.has(o.key)) continue;
      lines.push({ kind: 'fee', feeId: fee._id, title: String(fee.title || '').slice(0, 500), amountMinor: fee.amountMinor,
        firstDate: o.date, lastDate: o.date });
    }
  }
  const netMinor = lines.reduce((s, l) => s + l.amountMinor, 0);
  const totalHours = Math.round(lines.reduce((s, l) => s + (l.hours || 0), 0) * 100) / 100;
  return { currency: cur, lines, netMinor, totalHours, unratedHours: Math.round(unratedHours * 100) / 100 };
}

const QUOTE_STATUSES = Object.freeze(['draft', 'sent', 'accepted', 'declined']);
const QUOTE_TRANSITIONS = Object.freeze({ draft: ['sent', 'declined'], sent: ['accepted', 'declined', 'draft'], accepted: [], declined: [] });
function canChangeQuoteStatus(from, to) {
  return (QUOTE_TRANSITIONS[from] || []).includes(to);
}

// "QUO-2027-0007": quotes have a sequence of their own.
function quoteNumber(year, sequence) {
  return `QUO-${year}-${String(sequence).padStart(4, '0')}`;
}

// VAT on a net amount: rounded once, on the total, as an invoice states it.
function invoiceTotals(netMinor, vatPercent) {
  const vat = Math.round(netMinor * (vatPercent || 0) / 100);
  return { netMinor, vatPercent: vatPercent || 0, vatMinor: vat, totalMinor: netMinor + vat };
}

function paidOf(invoice) {
  return (invoice.payments || []).reduce((s, p) => s + (p.amountMinor || 0), 0);
}

/**
 * Where an invoice stands, on a day: what is paid, what is still due, and its
 * state - draft, sent, partially paid, paid, overdue, void or credited - with
 * the days overdue and the penalty interest so far (simple interest a year).
 */
function invoiceState(invoice, today, penaltyInterestPercent = 0) {
  const paid = paidOf(invoice);
  const total = invoice.totalMinor || 0;
  const due = Math.max(total - paid, 0);
  let state = invoice.status;
  let daysOverdue = 0;
  let interestMinor = 0;
  if (invoice.status === 'sent') {
    if (paid > 0 && due > 0) state = 'partial';
    if (due > 0 && invoice.dueDate && today > invoice.dueDate) {
      daysOverdue = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${invoice.dueDate}T00:00:00Z`)) / 86400000);
      state = 'overdue';
      interestMinor = Math.round(due * (penaltyInterestPercent || 0) / 100 * daysOverdue / 365);
    }
  }
  return { paidMinor: paid, dueMinor: due, state, daysOverdue, interestMinor };
}

// What a status may become. Paid, void and credited are final; a sent invoice
// is paid, credited (with a credit note), voided or taken back to draft.
const TRANSITIONS = Object.freeze({ draft: ['sent', 'void'], sent: ['paid', 'void', 'draft', 'credited'], paid: ['credited'], void: [], credited: [] });
function canChangeStatus(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// "INV-2027-0042"; a credit note "CRN-2027-0043".
function invoiceNumber(year, sequence, kind = 'invoice') {
  return `${kind === 'credit' ? 'CRN' : 'INV'}-${year}-${String(sequence).padStart(4, '0')}`;
}

// The payment reference of an invoice from its year and sequence: a Finnish
// reference number, or the same digits as an RF creditor reference.
function paymentReference(year, sequence, type) {
  if (type === 'none') return '';
  const base = `${year}${String(sequence).padStart(5, '0')}`;
  const R = require('./regionalPaymentCodes');
  if (type === 'be') return R.belgianStructuredReference(base);
  if (type === 'no') return R.norwegianKid(base);
  if (type === 'se') return R.swedishOcr(base);
  const fi = finnishReference(base);
  return type === 'fi' ? fi : rfReference(fi);
}

function defaultDueDate(issueDate, days) {
  return addDays(issueDate, days);
}

// Money for display, in the viewer's language: 1234567 EUR -> "12 345,67 €".
function formatMoney(minor, cur, locale) {
  if (minor === null || minor === undefined || !cur) return '';
  try {
    const digits = minorUnits(cur);
    return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: cur, minimumFractionDigits: digits,
      maximumFractionDigits: digits }).format(fromMinorUnits(minor, cur));
  } catch (e) {
    return `${minorToText(minor, cur)} ${cur}`;
  }
}

// One CSV field: quoted, and never a formula a spreadsheet would run.
function csvField(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function invoiceCsv(invoice, nameOf = id => id || '') {
  const rows = [['number', 'card', 'person', 'from', 'to', 'hours', 'rate', 'amount', 'currency']];
  for (const line of invoice.lines || []) {
    const hasRate = typeof line.rateMinor === 'number';
    rows.push([invoice.number, line.title, nameOf(line.userId), line.firstDate || '', line.lastDate || '', hasRate ? line.hours : '',
      hasRate ? minorToText(line.rateMinor, invoice.currency) : '', minorToText(line.amountMinor, invoice.currency), invoice.currency]);
  }
  const net = typeof invoice.netMinor === 'number' ? invoice.netMinor : invoice.totalMinor;
  const m = minor => minorToText(minor || 0, invoice.currency);
  rows.push([invoice.number, 'net', '', '', '', invoice.totalHours, '', m(net), invoice.currency]);
  rows.push([invoice.number, `VAT ${invoice.vatPercent || 0} %`, '', '', '', '', '', m(invoice.vatMinor), invoice.currency]);
  rows.push([invoice.number, 'total', '', '', '', '', '', m(invoice.totalMinor), invoice.currency]);
  return `${rows.map(r => r.map(csvField).join(',')).join('\r\n')}\r\n`;
}

module.exports = {
  INVOICE_STATUSES, QUOTE_STATUSES, EXPENSE_CATEGORIES, MAX_MINOR, INVOICE_LINE_KINDS, LINE_KIND_LABEL_KEYS, isInvoiceLineKind,
  toMinor, normalizeRate, normalizeBudget, normalizeProfile, normalizeInvoiceRequest, normalizeInvoiceStatus, normalizePayment,
  normalizeExpense, normalizeFee, normalizeApproval, normalizeQuoteRequest, expenseCharge, feeOccurrences, invoicedFeeKeys,
  draftQuoteLines, canChangeQuoteStatus, quoteNumber,
  rateFor, boardCurrency, boardFinance, draftInvoiceLines, invoiceTotals, invoiceState, paidOf,
  canChangeStatus, invoiceNumber, paymentReference, defaultDueDate, formatMoney, csvField, invoiceCsv,
};
