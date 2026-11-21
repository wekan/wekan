// Budget and billing (docs/Features/Billing/Billing.md).
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
import { BillingBudgets, BillingRates, BillingInvoices, BillingProfiles } from '/models/billing';
import { featureOnFor } from '/server/lib/assistGate';
import { invoiceLabels, invoicePdf, invoiceXlsx, invoiceUbl, invoiceSvg } from '/server/lib/invoiceFiles';
const {
  normalizeRate, normalizeBudget, normalizeProfile, normalizeInvoiceRequest, normalizeInvoiceStatus, normalizePayment,
  boardFinance, draftInvoiceLines, invoiceTotals, invoiceState, paidOf, canChangeStatus, invoiceNumber, paymentReference,
  defaultDueDate, invoiceCsv,
} = require('/models/lib/billing');
const { paymentInstructions } = require('/models/lib/paymentCodes');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

const MAX_BOARDS = 500;
const MAX_CARDS = 20000;
const MAX_ENTRIES = 100000;
const MAX_INVOICES = 2000;

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
  const [budget, rates, invoices, cards] = await Promise.all([
    BillingBudgets.findOneAsync({ boardId }),
    BillingRates.find({ boardId }).fetchAsync(),
    BillingInvoices.find({ boardId }, { sort: { createdAt: -1 }, limit: MAX_INVOICES }).fetchAsync(),
    boardCards(boardId),
  ]);
  return { budget: budget || null, rates, invoices, cards };
}

async function memberNames(board) {
  const ids = (board.members || []).filter(m => m && m.isActive !== false).map(m => m.userId);
  const users = await Meteor.users.find({ _id: { $in: ids } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync();
  const byId = new Map(users.map(u => [u._id, (u.profile && u.profile.fullname) || u.username || u._id]));
  return ids.map(id => ({ userId: id, name: byId.get(id) || id }));
}

async function draftFor(boardId, money, period) {
  const entries = await TimeEntries.find({ boardId, invoiceId: { $exists: false } }, { limit: MAX_ENTRIES }).fetchAsync();
  return draftInvoiceLines({ ...money, entries, period });
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
      draft = await draftFor(boardId, money, { start: p.periodStart || null, end: p.periodEnd || null, includeUndated: p.includeUndated === true });
    } catch (e) { draft = null; }
    return {
      board: { _id: board._id, title: board.title || '', slug: board.slug || 'board' },
      members,
      budget: money.budget,
      profile,
      rates: money.rates.map(r => ({ _id: r._id, userId: r.userId || null, name: r.userId ? (byId.get(r.userId) || r.userId) : '',
        hourlyRateMinor: r.hourlyRateMinor, currency: r.currency })),
      finance: boardFinance(money),
      draft: draft && { ...draft, lines: draft.lines.map(l => ({ ...l, name: l.userId ? byId.get(l.userId) || '' : '' })) },
      invoices: money.invoices.map(i => invoiceSummary(i, profile)),
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
      draft = await draftFor(boardId, money, { start: header.periodStart, end: header.periodEnd, includeUndated: header.includeUndated });
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
        lines: draft.lines.map(line => {
          const l = { ...line };
          for (const k of ['userId', 'firstDate', 'lastDate']) if (!l[k]) delete l[k];
          return l;
        }),
        ...totals, totalHours: draft.totalHours, reverseCharge: profile.reverseCharge || undefined,
        paymentReference: paymentReference(year, sequence, profile.referenceType) || undefined,
        issuer: profile, payments: [], createdBy: userId,
      };
      for (const key of ['customer', 'customerCountry', 'customerVatId', 'reference', 'notes', 'periodStart', 'periodEnd']) {
        if (header[key]) doc[key] = header[key];
      }
      if (header.includeUndated) doc.includeUndated = true;
      return doc;
    });
    // The entries are now on this invoice, and are not billed again.
    await TimeEntries.updateAsync({ _id: { $in: draft.entryIds }, invoiceId: { $exists: false } }, { $set: { invoiceId: id } }, { multi: true });
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
    const value = validated(() => normalizePayment(payment));
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
});

DDPRateLimiter.addRule({ type: 'method', name: 'billingBoards', connectionId() { return true; } }, 20, 60000);
DDPRateLimiter.addRule({ type: 'method', name: 'billingInvoiceFile', connectionId() { return true; } }, 30, 60000);

// A deleted board's budget, rates and profile go with it; invoices are records.
if (Boards.after && typeof Boards.after.remove === 'function') {
  Boards.after.remove(async (currentUserId, doc) => {
    try {
      if (!doc || typeof doc._id !== 'string') return;
      await BillingBudgets.removeAsync({ boardId: doc._id });
      await BillingRates.removeAsync({ boardId: doc._id });
      await BillingProfiles.removeAsync({ boardId: doc._id });
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
});
