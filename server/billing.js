// Budget and billing (docs/Features/Billing/README.md).
//
// Money is a board admin's business: every method here answers only a board's
// active admins and site administrators, for that board - members, even with
// write access, do not see rates, budgets or invoices. The numbers are
// computed by models/lib/billing.js from the board's cards and time entries;
// nothing is published.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import TimeEntries from '/models/timeEntries';
import { BillingBudgets, BillingRates, BillingInvoices, BillingProfiles, BillingExpenses, BillingFees, BillingQuotes } from '/models/billing';
import { featureOnFor } from '/server/lib/assistGate';
import { invoiceLabels, invoicePdf, invoiceXlsx, invoiceUbl, invoiceSvg } from '/server/lib/invoiceFiles';
const {
  normalizeRate, normalizeBudget, normalizeProfile, normalizeInvoiceRequest, normalizeInvoiceStatus, normalizePayment,
  boardFinance, draftInvoiceLines, invoiceTotals, invoiceState, paidOf, canChangeStatus, invoiceNumber, paymentReference,
  defaultDueDate, invoiceCsv, normalizeExpense, normalizeFee, normalizeApproval, normalizeQuoteRequest, expenseCharge,
  feeOccurrences, invoicedFeeKeys, draftQuoteLines, canChangeQuoteStatus, quoteNumber, QUOTE_STATUSES,
} = require('/models/lib/billing');
const { paymentInstructions } = require('/models/lib/paymentCodes');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

const MAX_BOARDS = 500;
const MAX_CARDS = 20000;
const MAX_ENTRIES = 100000;
const MAX_INVOICES = 2000;
const MAX_EXPENSES = 5000;
const MAX_FEES = 200;
const MAX_PENDING = 500;

function denied() {
  throw new Meteor.Error('not-authorized', 'You may not do that');
}

function invalid(error) {
  throw new Meteor.Error('invalid-input', (error && error.message) || 'Invalid input');
}

function validated(fn) {
  try { return fn(); } catch (e) { return invalid(e); }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Every method: signed in, and Budget and billing on for this user (Admin
// Panel / Settings / Visibility / Features). Returns the user id.
async function signedIn(userId) {
  if (!userId) denied();
  if (!(await featureOnFor(userId, 'billing'))) throw new Meteor.Error('feature-disabled', 'Budget and billing is turned off');
  return userId;
}

async function siteAdmin(userId) {
  const user = await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  return !!(user && user.isAdmin === true && user.loginDisabled !== true);
}

function boardAdmin(board, userId) {
  // An assigned-only admin sees only their own cards, so not the board's cost.
  return (board.members || []).some(m => m && m.userId === userId && m.isActive !== false && m.isAdmin === true)
    && !isAssignedOnlyMember(board, userId);
}

// The board, when this user may see and change its money; refused otherwise.
async function managedBoard(userId, boardId) {
  const board = await Boards.findOneAsync(boardId, { fields: { title: 1, slug: 1, members: 1, archived: 1 } });
  if (!board || !(boardAdmin(board, userId) || await siteAdmin(userId))) denied();
  return board;
}

async function managedInvoice(userId, invoiceId) {
  const invoice = await BillingInvoices.findOneAsync(invoiceId);
  if (!invoice) invalid(new Error('No such invoice'));
  const board = await managedBoard(userId, invoice.boardId);
  return { invoice, board };
}

async function boardCards(boardId) {
  return Cards.find({ boardId, type: 'cardType-card' }, {
    fields: { _id: 1, title: 1, spentTime: 1, estimatedHours: 1, dueComplete: 1, archived: 1, assignees: 1, members: 1, billable: 1 },
    limit: MAX_CARDS,
  }).fetchAsync();
}

async function boardProfile(boardId) {
  const doc = await BillingProfiles.findOneAsync({ boardId });
  return doc ? doc.profile : normalizeProfile({});
}

async function boardMoney(boardId) {
  const [budget, rates, invoices, cards, expenses, fees] = await Promise.all([
    BillingBudgets.findOneAsync({ boardId }),
    BillingRates.find({ boardId }).fetchAsync(),
    BillingInvoices.find({ boardId }, { sort: { createdAt: -1 }, limit: MAX_INVOICES }).fetchAsync(),
    boardCards(boardId),
    BillingExpenses.find({ boardId }, { sort: { date: -1 }, limit: MAX_EXPENSES }).fetchAsync(),
    BillingFees.find({ boardId }, { limit: MAX_FEES }).fetchAsync(),
  ]);
  return { budget: budget || null, rates, invoices, cards, expenses, fees };
}

// A document without its empty fields: collection2 stores what is given.
function compact(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) if (v !== undefined && v !== null && v !== '') out[k] = v;
  return out;
}

async function memberNames(board) {
  const ids = (board.members || []).filter(m => m && m.isActive !== false).map(m => m.userId);
  const users = await Meteor.users.find({ _id: { $in: ids } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync();
  const byId = new Map(users.map(u => [u._id, (u.profile && u.profile.fullname) || u.username || u._id]));
  return ids.map(id => ({ userId: id, name: byId.get(id) || id }));
}

async function draftFor(boardId, money, period, profile) {
  const entries = await TimeEntries.find({ boardId, invoiceId: { $exists: false } }, { limit: MAX_ENTRIES }).fetchAsync();
  return draftInvoiceLines({ ...money, entries, period, billTime: !profile || profile.billTime !== false,
    approveTime: !!(profile && profile.approveTime), today: today() });
}

// The value of what is billable and not invoiced yet: work in progress.
async function unbilledOf(boardId, money, profile) {
  try {
    return (await draftFor(boardId, money, { includeUndated: true }, { ...profile, approveTime: false })).netMinor;
  } catch (e) {
    return 0;
  }
}

function invoiceSummary(invoice, profile) {
  const state = invoiceState(invoice, today(), profile && profile.penaltyInterestPercent);
  return {
    _id: invoice._id, number: invoice.number, kind: invoice.kind || 'invoice', status: invoice.status, state: state.state,
    currency: invoice.currency, customer: invoice.customer || '', issueDate: invoice.issueDate || null, dueDate: invoice.dueDate || null,
    periodStart: invoice.periodStart || null, periodEnd: invoice.periodEnd || null,
    netMinor: invoice.netMinor, vatMinor: invoice.vatMinor || 0, totalMinor: invoice.totalMinor, totalHours: invoice.totalHours,
    paidMinor: state.paidMinor, dueMinor: state.dueMinor, daysOverdue: state.daysOverdue, interestMinor: state.interestMinor,
    creditOfNumber: invoice.creditOfNumber || null,
  };
}

// The next number of a year, settled by the unique index when two race.
async function insertNumbered(year, kind, build) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await BillingInvoices.find({ number: { $regex: `^(INV|CRN)-${year}-` } }).countAsync();
    const sequence = count + 1 + attempt;
    const doc = build(invoiceNumber(year, sequence, kind), sequence);
    try {
      const id = await BillingInvoices.insertAsync(doc);
      return { id, doc };
    } catch (e) {
      if (!/duplicate key|E11000/i.test(String(e && e.message))) throw e;
    }
  }
  return invalid(new Error('Could not number the invoice; try again'));
}

// Everything a file of the invoice needs, in the user's language.
async function invoiceDocument(userId, invoice, board) {
  const byId = new Map((await memberNames(board)).map(m => [m.userId, m.name]));
  const profile = invoice.issuer || await boardProfile(invoice.boardId);
  const paid = paidOf(invoice);
  const doc = {
    ...invoice,
    kind: invoice.kind || 'invoice',
    paidMinor: paid,
    amountDueMinor: Math.max((invoice.totalMinor || 0) - paid, 0),
    issuerName: profile.issuerName,
    lines: (invoice.lines || []).map(l => ({ ...l, name: l.userId ? (byId.get(l.userId) || '') : '' })),
  };
  const instructions = (profile.paymentMethods || []).map(m => paymentInstructions(m, doc));
  const user = await Meteor.users.findOneAsync(userId, { fields: { 'profile.language': 1 } });
  const language = (user && user.profile && user.profile.language) || 'en';
  return { doc, profile, instructions, language, names: byId };
}

async function freeEntries(invoiceId) {
  await TimeEntries.updateAsync({ invoiceId }, { $unset: { invoiceId: '' } }, { multi: true });
  await BillingExpenses.updateAsync({ invoiceId }, { $unset: { invoiceId: '' } }, { multi: true });
}

async function managedQuote(userId, quoteId) {
  const quote = await BillingQuotes.findOneAsync(quoteId);
  if (!quote) invalid(new Error('No such quote'));
  const board = await managedBoard(userId, quote.boardId);
  return { quote, board };
}

function quoteSummary(quote) {
  return {
    _id: quote._id, number: quote.number, kind: 'quote', status: quote.status, state: quote.status, currency: quote.currency,
    customer: quote.customer || '', issueDate: quote.issueDate, validUntil: quote.validUntil || null, dueDate: quote.validUntil || null,
    netMinor: quote.netMinor, vatMinor: quote.vatMinor || 0, totalMinor: quote.totalMinor, totalHours: quote.totalHours,
    expired: quote.status === 'sent' && !!quote.validUntil && quote.validUntil < today(),
  };
}

// The time waiting for a board admin's approval, with its card and person.
async function pendingTime(boardId, cards, names) {
  const titles = new Map(cards.map(c => [c._id, c]));
  const entries = await TimeEntries.find({ boardId, invoiceId: { $exists: false }, approval: { $exists: false } },
    { sort: { date: 1 }, limit: MAX_PENDING * 4 }).fetchAsync();
  return entries.filter(e => e.date && titles.has(e.cardId) && titles.get(e.cardId).billable !== false).slice(0, MAX_PENDING)
    .map(e => ({ _id: e._id, date: e.date, hours: e.hours, note: e.note || '', cardId: e.cardId, title: titles.get(e.cardId).title || '',
      userId: e.userId || null, name: e.userId ? names.get(e.userId) || '' : '' }));
}

let fontCache = null;
async function pdfFonts() {
  if (!fontCache) {
    fontCache = {
      main: await Assets.getBinaryAsync('fonts/unifont/unifont-17.0.05.otf'),
      upper: await Assets.getBinaryAsync('fonts/unifont/unifont_upper-17.0.05.otf'),
    };
  }
  return fontCache;
}

Meteor.methods({
  // The boards this user manages the money of, each with its numbers.
  async billingBoards(params) {
    check(params, Match.Optional({ allBoards: Match.Optional(Boolean) }));
    const userId = await signedIn(this.userId);
    const isAdmin = await siteAdmin(userId);
    const selector = { archived: { $ne: true }, type: { $nin: ['template-container'] } };
    if (!(isAdmin && params && params.allBoards)) {
      selector.members = { $elemMatch: { userId, isActive: true, isAdmin: true } };
    }
    const boards = (await Boards.find(selector, { fields: { title: 1, slug: 1, members: 1 }, limit: MAX_BOARDS }).fetchAsync())
      .filter(board => (isAdmin && params && params.allBoards) || boardAdmin(board, userId));
    const out = [];
    for (const board of boards) {
      const money = await boardMoney(board._id);
      const profile = await boardProfile(board._id);
      const overdue = money.invoices.filter(i => invoiceState(i, today()).state === 'overdue').length;
      out.push({ _id: board._id, title: board.title || '', slug: board.slug || 'board',
        budget: money.budget, finance: boardFinance(money), overdueInvoices: overdue, hasProfile: !!profile.issuerName });
    }
    return { boards: out, isAdmin };
  },

  // One board in full: budget, rates, profile, numbers, the draft and invoices.
  async billingBoard(boardId, period) {
    check(boardId, String);
    check(period, Match.Optional({ periodStart: Match.Optional(String), periodEnd: Match.Optional(String), includeUndated: Match.Optional(Boolean) }));
    const userId = await signedIn(this.userId);
    const board = await managedBoard(userId, boardId);
    const money = await boardMoney(boardId);
    const members = await memberNames(board);
    const byId = new Map(members.map(m => [m.userId, m.name]));
    const profile = await boardProfile(boardId);
    const p = period || {};
    let draft = null;
    try {
      draft = await draftFor(boardId, money, { start: p.periodStart || null, end: p.periodEnd || null, includeUndated: p.includeUndated === true }, profile);
    } catch (e) { draft = null; }
    const unbilledMinor = await unbilledOf(boardId, money, profile);
    const billedKeys = invoicedFeeKeys(money.invoices);
    const quotes = await BillingQuotes.find({ boardId }, { sort: { createdAt: -1 }, limit: MAX_INVOICES }).fetchAsync();
    const cardTitles = new Map(money.cards.map(c => [c._id, c.title || '']));
    return {
      board: { _id: board._id, title: board.title || '', slug: board.slug || 'board' },
      members,
      budget: money.budget,
      profile,
      rates: money.rates.map(r => ({ _id: r._id, userId: r.userId || null, name: r.userId ? (byId.get(r.userId) || r.userId) : '',
        hourlyRateMinor: r.hourlyRateMinor, costRateMinor: typeof r.costRateMinor === 'number' ? r.costRateMinor : null, currency: r.currency })),
      finance: boardFinance({ ...money, unbilledMinor }),
      draft: draft && { ...draft, lines: draft.lines.map(l => ({ ...l, name: l.userId ? byId.get(l.userId) || '' : '' })) },
      invoices: money.invoices.map(i => invoiceSummary(i, profile)),
      expenses: money.expenses.map(e => ({ _id: e._id, date: e.date, amountMinor: e.amountMinor, chargeMinor: expenseCharge(e),
        currency: e.currency, category: e.category, description: e.description || '', billable: e.billable !== false,
        markupPercent: e.markupPercent || 0, cardTitle: e.cardId ? cardTitles.get(e.cardId) || '' : '',
        name: e.userId ? byId.get(e.userId) || '' : '', invoiced: !!e.invoiceId })),
      fees: money.fees.map(f => {
        const due = feeOccurrences(f, today());
        return { _id: f._id, title: f.title, amountMinor: f.amountMinor, currency: f.currency, date: f.date, recurring: f.recurring,
          end: f.end || null, dueCount: due.length, billedCount: due.filter(o => billedKeys.has(o.key)).length };
      }),
      pendingTime: profile.approveTime ? await pendingTime(boardId, money.cards, byId) : [],
      quotes: quotes.map(quoteSummary),
      cards: money.cards.filter(c => !c.archived).slice(0, 2000).map(c => ({ _id: c._id, title: c.title || '' })),
    };
  },

  async billingSetBudget(boardId, budget) {
    check(boardId, String);
    check(budget, Match.OneOf(null, Object));
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    if (budget === null) {
      await BillingBudgets.removeAsync({ boardId });
      return null;
    }
    const value = validated(() => normalizeBudget(budget));
    const doc = { boardId, ...value, createdBy: userId };
    for (const key of Object.keys(doc)) if (doc[key] === null || doc[key] === '') delete doc[key];
    await BillingBudgets.removeAsync({ boardId });
    await BillingBudgets.insertAsync(doc);
    return value;
  },

  async billingSetProfile(boardId, profile) {
    check(boardId, String);
    check(profile, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const value = validated(() => normalizeProfile(profile));
    await BillingProfiles.removeAsync({ boardId });
    await BillingProfiles.insertAsync({ boardId, profile: value, createdBy: userId });
    return value;
  },

  async billingSetRate(boardId, rate) {
    check(boardId, String);
    check(rate, Object);
    const userId = await signedIn(this.userId);
    const board = await managedBoard(userId, boardId);
    const value = validated(() => normalizeRate(rate));
    if (value.userId && !(board.members || []).some(m => m && m.userId === value.userId && m.isActive !== false)) {
      invalid(new Error('That person is not a member of this board'));
    }
    const selector = value.userId ? { boardId, userId: value.userId } : { boardId, userId: { $exists: false } };
    await BillingRates.removeAsync(selector);
    const doc = { boardId, hourlyRateMinor: value.hourlyRateMinor, currency: value.currency, createdBy: userId };
    if (value.userId) doc.userId = value.userId;
    if (typeof value.costRateMinor === 'number') doc.costRateMinor = value.costRateMinor;
    return await BillingRates.insertAsync(doc);
  },

  async billingRemoveRate(rateId) {
    check(rateId, String);
    const userId = await signedIn(this.userId);
    const rate = await BillingRates.findOneAsync(rateId);
    if (!rate) return false;
    await managedBoard(userId, rate.boardId);
    await BillingRates.removeAsync(rateId);
    return true;
  },

  // A draft invoice of the billable time entries not invoiced yet, of a period.
  async billingCreateInvoice(boardId, request) {
    check(boardId, String);
    check(request, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const header = validated(() => normalizeInvoiceRequest(request));
    const profile = await boardProfile(boardId);
    const money = await boardMoney(boardId);
    let draft;
    try {
      draft = await draftFor(boardId, money, { start: header.periodStart, end: header.periodEnd, includeUndated: header.includeUndated }, profile);
    } catch (e) { invalid(e); }
    if (!draft.lines.length) invalid(new Error('There is no billable time left to invoice'));
    const issueDate = header.issueDate || today();
    const dueDate = header.dueDate || defaultDueDate(issueDate, profile.paymentTermsDays);
    const vatPercent = profile.reverseCharge ? 0 : (header.vatPercent === null ? profile.vatPercent : header.vatPercent);
    const totals = invoiceTotals(draft.netMinor, vatPercent);
    const year = issueDate.slice(0, 4);
    const { id } = await insertNumbered(year, 'invoice', (number, sequence) => {
      const doc = {
        boardId, number, kind: 'invoice', status: 'draft', currency: draft.currency, issueDate, dueDate,
        lines: draft.lines.map(compact),
        ...totals, totalHours: draft.totalHours, reverseCharge: profile.reverseCharge || undefined,
        paymentReference: paymentReference(year, sequence, profile.referenceType) || undefined,
        issuer: profile, payments: [], createdBy: userId,
      };
      for (const key of ['customer', 'customerCountry', 'customerVatId', 'reference', 'notes', 'periodStart', 'periodEnd']) {
        if (header[key]) doc[key] = header[key];
      }
      // The board's customer, when the invoice names none.
      if (!header.customer && profile.customer) {
        doc.customer = profile.customer;
        if (!header.customerCountry && profile.customerCountry) doc.customerCountry = profile.customerCountry;
        if (!header.customerVatId && profile.customerVatId) doc.customerVatId = profile.customerVatId;
      }
      if (header.includeUndated) doc.includeUndated = true;
      return doc;
    });
    // The entries and expenses are now on this invoice, and are not billed again.
    await TimeEntries.updateAsync({ _id: { $in: draft.entryIds }, invoiceId: { $exists: false } }, { $set: { invoiceId: id } }, { multi: true });
    if (draft.expenseIds.length) {
      await BillingExpenses.updateAsync({ _id: { $in: draft.expenseIds }, invoiceId: { $exists: false } }, { $set: { invoiceId: id } }, { multi: true });
    }
    return id;
  },

  async billingSetInvoiceStatus(invoiceId, status) {
    check(invoiceId, String);
    check(status, String);
    const userId = await signedIn(this.userId);
    const { invoice } = await managedInvoice(userId, invoiceId);
    const next = validated(() => normalizeInvoiceStatus(status));
    if (next === 'credited') invalid(new Error('Make a credit note to credit an invoice'));
    if (!canChangeStatus(invoice.status, next)) invalid(new Error(`An invoice that is ${invoice.status} cannot become ${next}`));
    await BillingInvoices.updateAsync(invoiceId, { $set: { status: next, statusChangedAt: new Date() } });
    // A voided invoice frees its time for a new one.
    if (next === 'void' && invoice.kind !== 'credit') await freeEntries(invoiceId);
    return next;
  },

  // A credit note of a sent or paid invoice: the same lines, crediting it in
  // full. The invoice becomes credited and its time is free to invoice again.
  async billingCreditInvoice(invoiceId, request) {
    check(invoiceId, String);
    check(request, Match.Optional(Object));
    const userId = await signedIn(this.userId);
    const { invoice } = await managedInvoice(userId, invoiceId);
    if (invoice.kind === 'credit') invalid(new Error('A credit note is not credited'));
    if (!canChangeStatus(invoice.status, 'credited')) invalid(new Error(`An invoice that is ${invoice.status} cannot be credited`));
    const header = validated(() => normalizeInvoiceRequest({ notes: (request && request.notes) || '', issueDate: request && request.issueDate }));
    const issueDate = header.issueDate || today();
    const { id } = await insertNumbered(issueDate.slice(0, 4), 'credit', number => ({
      boardId: invoice.boardId, number, kind: 'credit', status: 'sent', currency: invoice.currency, issueDate,
      creditOf: invoice._id, creditOfNumber: invoice.number, lines: invoice.lines,
      netMinor: invoice.netMinor, vatPercent: invoice.vatPercent, vatMinor: invoice.vatMinor, totalMinor: invoice.totalMinor,
      totalHours: invoice.totalHours, customer: invoice.customer, customerCountry: invoice.customerCountry,
      customerVatId: invoice.customerVatId, reference: invoice.reference, notes: header.notes || undefined,
      reverseCharge: invoice.reverseCharge, issuer: invoice.issuer, payments: [], createdBy: userId,
    }));
    await BillingInvoices.updateAsync(invoiceId, { $set: { status: 'credited', creditedBy: id, statusChangedAt: new Date() } });
    await freeEntries(invoiceId);
    return id;
  },

  // A payment received. When the payments reach the total, the invoice is paid.
  async billingAddPayment(invoiceId, payment) {
    check(invoiceId, String);
    check(payment, Object);
    const userId = await signedIn(this.userId);
    const { invoice } = await managedInvoice(userId, invoiceId);
    if (invoice.kind === 'credit' || !['sent', 'paid'].includes(invoice.status)) invalid(new Error('Payments are recorded on a sent invoice'));
    const value = validated(() => normalizePayment(payment, invoice.currency));
    const payments = [...(invoice.payments || []), { id: Random.id(), ...value, method: value.method || undefined, note: value.note || undefined }];
    const paid = payments.reduce((s, p) => s + p.amountMinor, 0);
    const $set = { payments };
    if (paid >= invoice.totalMinor && invoice.status === 'sent') Object.assign($set, { status: 'paid', statusChangedAt: new Date() });
    await BillingInvoices.updateAsync(invoiceId, { $set });
    return paid;
  },

  async billingRemovePayment(invoiceId, paymentId) {
    check(invoiceId, String);
    check(paymentId, String);
    const userId = await signedIn(this.userId);
    const { invoice } = await managedInvoice(userId, invoiceId);
    const payments = (invoice.payments || []).filter(p => p.id !== paymentId);
    const paid = payments.reduce((s, p) => s + p.amountMinor, 0);
    const $set = { payments };
    if (invoice.status === 'paid' && paid < invoice.totalMinor) Object.assign($set, { status: 'sent', statusChangedAt: new Date() });
    await BillingInvoices.updateAsync(invoiceId, { $set });
    return paid;
  },

  // One invoice in full, for the page and for printing.
  async billingInvoice(invoiceId) {
    check(invoiceId, String);
    const userId = await signedIn(this.userId);
    const { invoice, board } = await managedInvoice(userId, invoiceId);
    const { doc, profile, instructions } = await invoiceDocument(userId, invoice, board);
    return {
      ...invoiceSummary(invoice, profile),
      reference: invoice.reference || '', notes: invoice.notes || '', boardTitle: board.title || '',
      customerVatId: invoice.customerVatId || '', paymentReference: invoice.paymentReference || '',
      vatPercent: invoice.vatPercent || 0, reverseCharge: !!invoice.reverseCharge,
      payments: invoice.payments || [], lines: doc.lines, profile,
      instructions: instructions.map(i => ({ type: i.method.type, label: i.method.label || '', lines: i.lines || [], link: i.link || '',
        qr: i.qr || '', barcode: i.barcode || '', swissCross: !!i.swissCross, error: i.error || '' })),
    };
  },

  // The invoice as a file: pdf, svg, xlsx, csv or ubl (Peppol BIS 3.0 XML).
  async billingInvoiceFile(invoiceId, format) {
    check(invoiceId, String);
    check(format, Match.OneOf('pdf', 'xlsx', 'csv', 'ubl', 'svg'));
    const userId = await signedIn(this.userId);
    const { invoice, board } = await managedInvoice(userId, invoiceId);
    const { doc, profile, instructions, language, names } = await invoiceDocument(userId, invoice, board);
    const labels = invoiceLabels(language);
    const base = doc.number;
    if (format === 'csv') {
      return { name: `${base}.csv`, mime: 'text/csv;charset=utf-8', text: invoiceCsv(doc, id => (id ? names.get(id) || '' : '')) };
    }
    if (format === 'ubl') {
      return { name: `${base}.xml`, mime: 'application/xml;charset=utf-8', text: invoiceUbl(doc, profile) };
    }
    if (format === 'svg') {
      return { name: `${base}.svg`, mime: 'image/svg+xml;charset=utf-8', text: invoiceSvg(doc, profile, instructions, labels, language) };
    }
    if (format === 'xlsx') {
      const buffer = await invoiceXlsx(doc, profile, labels);
      return { name: `${base}.xlsx`, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', base64: buffer.toString('base64') };
    }
    const buffer = await invoicePdf(doc, profile, instructions, labels, await pdfFonts(), language);
    return { name: `${base}.pdf`, mime: 'application/pdf', base64: buffer.toString('base64') };
  },

  // An expense of the board's work: a day, an amount, what it was for.
  async billingAddExpense(boardId, expense) {
    check(boardId, String);
    check(expense, Object);
    const userId = await signedIn(this.userId);
    const board = await managedBoard(userId, boardId);
    const value = validated(() => normalizeExpense(expense));
    if (value.userId && !(board.members || []).some(m => m && m.userId === value.userId && m.isActive !== false)) {
      invalid(new Error('That person is not a member of this board'));
    }
    if (value.cardId && !(await Cards.findOneAsync({ _id: value.cardId, boardId }))) invalid(new Error('That card is not on this board'));
    if (await BillingExpenses.find({ boardId }).countAsync() >= MAX_EXPENSES) invalid(new Error('Too many expenses'));
    return await BillingExpenses.insertAsync(compact({ boardId, ...value, billable: value.billable, markupPercent: value.markupPercent,
      createdBy: userId }));
  },

  // Not one that is on an invoice: that is a record.
  async billingRemoveExpense(expenseId) {
    check(expenseId, String);
    const userId = await signedIn(this.userId);
    const expense = await BillingExpenses.findOneAsync(expenseId);
    if (!expense) return false;
    await managedBoard(userId, expense.boardId);
    if (expense.invoiceId) invalid(new Error('This expense is on an invoice'));
    await BillingExpenses.removeAsync(expenseId);
    return true;
  },

  // A milestone or fixed price, or a monthly retainer.
  async billingAddFee(boardId, fee) {
    check(boardId, String);
    check(fee, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const value = validated(() => normalizeFee(fee));
    if (await BillingFees.find({ boardId }).countAsync() >= MAX_FEES) invalid(new Error('Too many fees'));
    return await BillingFees.insertAsync(compact({ boardId, ...value, createdBy: userId }));
  },

  // The invoices that billed a fee keep their lines.
  async billingRemoveFee(feeId) {
    check(feeId, String);
    const userId = await signedIn(this.userId);
    const fee = await BillingFees.findOneAsync(feeId);
    if (!fee) return false;
    await managedBoard(userId, fee.boardId);
    await BillingFees.removeAsync(feeId);
    return true;
  },

  // Approve time logged on the board, send it back, or take the decision
  // back. Time already on an invoice is a record and keeps its decision.
  async billingApproveTime(boardId, approval) {
    check(boardId, String);
    check(approval, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const value = validated(() => normalizeApproval(approval));
    const selector = { _id: { $in: value.entryIds }, boardId, invoiceId: { $exists: false } };
    const count = await TimeEntries.find(selector).countAsync();
    if (value.decision === 'pending') {
      await TimeEntries.updateAsync(selector, { $unset: { approval: '', approvalNote: '', approvedBy: '', approvedAt: '' } }, { multi: true });
    } else {
      const $set = { approval: value.decision, approvedBy: userId, approvedAt: new Date() };
      const modifier = { $set };
      if (value.note) $set.approvalNote = value.note;
      else modifier.$unset = { approvalNote: '' };
      await TimeEntries.updateAsync(selector, modifier, { multi: true });
    }
    return count;
  },

  // A quote of the work still to do and the fees not billed yet.
  async billingCreateQuote(boardId, request) {
    check(boardId, String);
    check(request, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const header = validated(() => normalizeQuoteRequest(request));
    const profile = await boardProfile(boardId);
    const money = await boardMoney(boardId);
    const draft = validated(() => draftQuoteLines(money));
    if (!draft.lines.length) invalid(new Error('There is no estimated work or fee to quote'));
    const issueDate = header.issueDate || today();
    const validUntil = header.validUntil || defaultDueDate(issueDate, profile.quoteValidDays || 30);
    const vatPercent = profile.reverseCharge ? 0 : (header.vatPercent === null ? profile.vatPercent : header.vatPercent);
    const year = issueDate.slice(0, 4);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await BillingQuotes.find({ number: { $regex: `^QUO-${year}-` } }).countAsync();
      const doc = compact({
        boardId, number: quoteNumber(year, count + 1 + attempt), status: 'draft', currency: draft.currency, issueDate, validUntil,
        lines: draft.lines.map(compact), ...invoiceTotals(draft.netMinor, vatPercent), totalHours: draft.totalHours,
        reverseCharge: profile.reverseCharge || undefined, issuer: profile, createdBy: userId,
        customer: header.customer || profile.customer, customerCountry: header.customer ? header.customerCountry : (header.customerCountry || profile.customerCountry),
        customerVatId: header.customer ? header.customerVatId : (header.customerVatId || profile.customerVatId),
        reference: header.reference, notes: header.notes,
      });
      if (!doc.vatMinor) doc.vatMinor = 0;
      if (!doc.vatPercent) doc.vatPercent = 0;
      if (!doc.totalHours) doc.totalHours = 0;
      try {
        return await BillingQuotes.insertAsync(doc);
      } catch (e) {
        if (!/duplicate key|E11000/i.test(String(e && e.message))) throw e;
      }
    }
    return invalid(new Error('Could not number the quote; try again'));
  },

  // Sent, accepted or declined. Accepting can make the quote the board's
  // money budget.
  async billingSetQuoteStatus(quoteId, status, options) {
    check(quoteId, String);
    check(status, String);
    check(options, Match.Optional({ setBudget: Match.Optional(Boolean) }));
    const userId = await signedIn(this.userId);
    const { quote } = await managedQuote(userId, quoteId);
    if (!QUOTE_STATUSES.includes(status)) invalid(new Error('Invalid quote status'));
    if (!canChangeQuoteStatus(quote.status, status)) invalid(new Error(`A quote that is ${quote.status} cannot become ${status}`));
    await BillingQuotes.updateAsync(quoteId, { $set: { status, statusChangedAt: new Date() } });
    if (status === 'accepted' && options && options.setBudget) {
      const budget = await BillingBudgets.findOneAsync({ boardId: quote.boardId });
      const doc = compact({ ...(budget || {}), _id: undefined, createdAt: undefined, modifiedAt: undefined, boardId: quote.boardId,
        amountMinor: quote.netMinor, currency: quote.currency, createdBy: userId });
      await BillingBudgets.removeAsync({ boardId: quote.boardId });
      await BillingBudgets.insertAsync(doc);
    }
    return status;
  },

  // One quote in full, for the page and for printing.
  async billingQuote(quoteId) {
    check(quoteId, String);
    const userId = await signedIn(this.userId);
    const { quote, board } = await managedQuote(userId, quoteId);
    const { doc, profile } = await invoiceDocument(userId, { ...quote, kind: 'quote', payments: [] }, board);
    return {
      ...quoteSummary(quote), reference: quote.reference || '', notes: quote.notes || '', boardTitle: board.title || '',
      customerVatId: quote.customerVatId || '', vatPercent: quote.vatPercent || 0, reverseCharge: !!quote.reverseCharge,
      payments: [], paidMinor: 0, dueMinor: 0, lines: doc.lines, profile, instructions: [],
    };
  },

  // The quote as a file: pdf, svg, xlsx or csv.
  async billingQuoteFile(quoteId, format) {
    check(quoteId, String);
    check(format, Match.OneOf('pdf', 'xlsx', 'csv', 'svg'));
    const userId = await signedIn(this.userId);
    const { quote, board } = await managedQuote(userId, quoteId);
    const { doc, profile, language, names } = await invoiceDocument(userId,
      { ...quote, kind: 'quote', dueDate: quote.validUntil, payments: [] }, board);
    const labels = invoiceLabels(language);
    const base = doc.number;
    if (format === 'csv') {
      return { name: `${base}.csv`, mime: 'text/csv;charset=utf-8', text: invoiceCsv(doc, id => (id ? names.get(id) || '' : '')) };
    }
    if (format === 'svg') {
      return { name: `${base}.svg`, mime: 'image/svg+xml;charset=utf-8', text: invoiceSvg(doc, profile, [], labels, language) };
    }
    if (format === 'xlsx') {
      const buffer = await invoiceXlsx(doc, profile, labels);
      return { name: `${base}.xlsx`, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', base64: buffer.toString('base64') };
    }
    const buffer = await invoicePdf(doc, profile, [], labels, await pdfFonts(), language);
    return { name: `${base}.pdf`, mime: 'application/pdf', base64: buffer.toString('base64') };
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'billingBoards', connectionId() { return true; } }, 20, 60000);
DDPRateLimiter.addRule({ type: 'method', name: 'billingInvoiceFile', connectionId() { return true; } }, 30, 60000);
DDPRateLimiter.addRule({ type: 'method', name: 'billingQuoteFile', connectionId() { return true; } }, 30, 60000);

// A deleted board's budget, rates and profile go with it; invoices are records.
if (Boards.after && typeof Boards.after.remove === 'function') {
  Boards.after.remove(async (currentUserId, doc) => {
    try {
      if (!doc || typeof doc._id !== 'string') return;
      await BillingBudgets.removeAsync({ boardId: doc._id });
      await BillingRates.removeAsync({ boardId: doc._id });
      await BillingProfiles.removeAsync({ boardId: doc._id });
      await BillingFees.removeAsync({ boardId: doc._id });
      await BillingExpenses.removeAsync({ boardId: doc._id, invoiceId: { $exists: false } });
    } catch (e) {
      console.error('[billing] Failed to remove the budget and rates of a deleted board', doc && doc._id, e);
    }
  });
}

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(BillingBudgets, { boardId: 1 });
  await ensureIndex(BillingRates, { boardId: 1, userId: 1 });
  await ensureIndex(BillingProfiles, { boardId: 1 });
  await ensureIndex(BillingInvoices, { number: 1 }, { unique: true });
  await ensureIndex(BillingInvoices, { boardId: 1, createdAt: -1 });
  await ensureIndex(BillingExpenses, { boardId: 1, date: -1 });
  await ensureIndex(BillingExpenses, { invoiceId: 1 });
  await ensureIndex(BillingFees, { boardId: 1 });
  await ensureIndex(BillingQuotes, { number: 1 }, { unique: true });
  await ensureIndex(BillingQuotes, { boardId: 1, createdAt: -1 });
});
