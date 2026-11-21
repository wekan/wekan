'use strict';

// Budget and billing (docs/Features/Billing/Billing.md): what a board's work
// costs, against its budget, and the invoices of the hours spent on it.
//
// Pure - no Meteor, no database - so the money is tested as arithmetic
// (tests/billing.test.cjs) and server/billing.js only gathers the documents
// and stores what this module returns.
//
// Money is kept in integer MINOR units (cents) with an ISO 4217 currency
// code, never as a float: 0.1 + 0.2 is not 0.3, and an invoice has to add up.
// Hours are numbers of hours (models/cards.js spentTime / estimatedHours).

const MAX_MINOR = 1e13; // 100 000 000 000.00 of any currency
const MAX_HOURS = 1e6;
const INVOICE_STATUSES = Object.freeze(['draft', 'sent', 'paid', 'void']);
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

// A money amount given in major units (12.5 = 12.50) to integer minor units.
function toMinor(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) fail('An amount is a number of at least 0');
  const minor = Math.round(amount * 100);
  if (minor > MAX_MINOR) fail('The amount is too large');
  return minor;
}

function day(value, message = 'Use a date written YYYY-MM-DD') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) fail(message);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('Invalid calendar date');
  return value;
}

// ---------------------------------------------------------------- inputs

// An hourly rate on a board: a member's, or - with no person - the board's
// default for everybody without one of their own.
function normalizeRate(value) {
  const v = plainObject(value, ['userId', 'hourlyRate', 'currency']);
  const userId = v.userId === undefined || v.userId === null || v.userId === '' ? null : text(v.userId, 100, 'Invalid person');
  return { userId, hourlyRateMinor: toMinor(v.hourlyRate), currency: currency(v.currency) };
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
  return {
    name: text(v.name, 100, 'The name is too long'),
    amountMinor: hasAmount ? toMinor(v.amount) : null,
    currency: hasAmount ? currency(v.currency) : (v.currency ? currency(v.currency) : null),
    hours,
    start,
    end,
  };
}

function normalizeInvoiceRequest(value) {
  const v = plainObject(value, ['customer', 'reference', 'notes', 'issueDate', 'dueDate']);
  const issueDate = day(v.issueDate);
  const dueDate = day(v.dueDate);
  if (issueDate && dueDate && dueDate < issueDate) fail('The due date must not be before the issue date');
  return {
    customer: text(v.customer, 500, 'The customer is too long'),
    reference: text(v.reference, 100, 'The reference is too long'),
    notes: text(v.notes, 2000, 'The notes are too long'),
    issueDate,
    dueDate,
  };
}

function normalizeInvoiceStatus(value) {
  if (!INVOICE_STATUSES.includes(value)) fail('Invalid invoice status');
  return value;
}

// ---------------------------------------------------------------- cost

function hoursOf(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

// Who a card's hours are charged as: its assignees, or its members, shared
// equally; with nobody, the board's default rate.
function cardPeople(card) {
  const assignees = (card.assignees || []).filter(Boolean);
  return [...new Set(assignees.length ? assignees : (card.members || []).filter(Boolean))];
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

// Hours split over the people who carry the card, each with a rate.
// Returns [{ userId|null, hours, rateMinor|null }].
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
  return card.billable !== false;
}

/**
 * What a board's work costs, against its budget.
 *
 * @param {Object} input
 * @param {Array}  input.cards    [{ _id, spentTime, estimatedHours, dueComplete, archived, assignees, members, billable }]
 * @param {Array}  input.rates    [{ userId|null, hourlyRateMinor, currency }]
 * @param {Object} input.budget   { amountMinor|null, currency|null, hours|null } or null
 * @param {Array}  input.invoices [{ status, totalMinor, currency }]
 */
function boardFinance({ cards = [], rates = [], budget = null, invoices = [] }) {
  const cur = boardCurrency(rates, budget);
  let spentHours = 0;
  let remainingHours = 0;
  let spentMinor = 0;
  let remainingMinor = 0;
  let billableHours = 0;
  let unratedHours = 0;
  for (const card of cards) {
    const spent = hoursOf(card.spentTime);
    const estimate = hoursOf(card.estimatedHours);
    // Work still to do: on an open card, the estimate less the time spent.
    const remaining = card.dueComplete === true || card.archived === true ? 0 : Math.max(estimate - spent, 0);
    spentHours += spent;
    remainingHours += remaining;
    if (isBillable(card)) billableHours += spent;
    for (const share of chargedShares(card, spent, rates, cur)) {
      if (share.rateMinor === null) unratedHours += share.hours;
      spentMinor += amountMinor(share.hours, share.rateMinor);
    }
    for (const share of chargedShares(card, remaining, rates, cur)) {
      remainingMinor += amountMinor(share.hours, share.rateMinor);
    }
  }
  const live = invoices.filter(i => i.status !== 'void' && (!cur || i.currency === cur));
  const invoicedMinor = live.reduce((s, i) => s + (i.totalMinor || 0), 0);
  const paidMinor = live.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalMinor || 0), 0);
  const forecastMinor = spentMinor + remainingMinor;
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
  };
  // Used and forecast as a percent of the budget, and whether the forecast is over.
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

// The hours of each card already on an invoice that is not void.
function invoicedHoursByCard(invoices) {
  const out = new Map();
  for (const invoice of invoices || []) {
    if (!invoice || invoice.status === 'void') continue;
    for (const line of invoice.lines || []) {
      if (!line.cardId) continue;
      out.set(line.cardId, (out.get(line.cardId) || 0) + hoursOf(line.hours));
    }
  }
  return out;
}

/**
 * The lines of a new invoice: the billable hours spent on each card and not
 * yet invoiced, per person, at their rate. Cards marked not billable, and
 * hours with no rate in the board's currency, are left out - the second are
 * reported as `unrated` so nobody bills them at zero by accident.
 */
function draftInvoiceLines({ cards = [], rates = [], budget = null, invoices = [] }) {
  const cur = boardCurrency(rates, budget);
  if (!cur) fail('Set an hourly rate for this board first');
  const already = invoicedHoursByCard(invoices);
  const lines = [];
  let unratedHours = 0;
  for (const card of cards) {
    if (!isBillable(card)) continue;
    const open = hoursOf(card.spentTime) - (already.get(card._id) || 0);
    if (!(open > 1e-9)) continue;
    for (const share of chargedShares(card, open, rates, cur)) {
      if (share.rateMinor === null) { unratedHours += share.hours; continue; }
      lines.push({
        cardId: card._id,
        title: String(card.title || '').slice(0, 500),
        userId: share.userId,
        hours: Math.round(share.hours * 10000) / 10000,
        rateMinor: share.rateMinor,
        amountMinor: amountMinor(share.hours, share.rateMinor),
      });
    }
  }
  const totalMinor = lines.reduce((s, l) => s + l.amountMinor, 0);
  const totalHours = Math.round(lines.reduce((s, l) => s + l.hours, 0) * 100) / 100;
  return { currency: cur, lines, totalMinor, totalHours, unratedHours: Math.round(unratedHours * 100) / 100 };
}

// What a status may become: a draft is sent or voided; a sent invoice is paid
// or voided; paid and void are final.
const TRANSITIONS = Object.freeze({ draft: ['sent', 'void'], sent: ['paid', 'void', 'draft'], paid: [], void: [] });
function canChangeStatus(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// "INV-2027-0042"
function invoiceNumber(year, sequence) {
  return `INV-${year}-${String(sequence).padStart(4, '0')}`;
}

// Money for display, in the viewer's language: 1234567 EUR -> "12 345,67 €".
function formatMoney(minor, cur, locale) {
  if (minor === null || minor === undefined || !cur) return '';
  try {
    return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: cur }).format(minor / 100);
  } catch (e) {
    return `${(minor / 100).toFixed(2)} ${cur}`;
  }
}

// One CSV field: quoted, and never a formula a spreadsheet would run.
function csvField(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function invoiceCsv(invoice, nameOf = id => id || '') {
  const rows = [['number', 'card', 'person', 'hours', 'rate', 'amount', 'currency']];
  for (const line of invoice.lines || []) {
    rows.push([invoice.number, line.title, nameOf(line.userId), line.hours,
      (line.rateMinor / 100).toFixed(2), (line.amountMinor / 100).toFixed(2), invoice.currency]);
  }
  rows.push([invoice.number, '', '', invoice.totalHours, '', (invoice.totalMinor / 100).toFixed(2), invoice.currency]);
  return `${rows.map(r => r.map(csvField).join(',')).join('\r\n')}\r\n`;
}

module.exports = {
  INVOICE_STATUSES, MAX_MINOR,
  toMinor, normalizeRate, normalizeBudget, normalizeInvoiceRequest, normalizeInvoiceStatus,
  rateFor, boardCurrency, boardFinance, draftInvoiceLines, invoicedHoursByCard,
  canChangeStatus, invoiceNumber, formatMoney, csvField, invoiceCsv,
};
