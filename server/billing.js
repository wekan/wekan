// Budget and billing (docs/Features/Billing/Billing.md).
//
// Money is a board admin's business: every method here answers only a board's
// active admins and site administrators, for that board - members, even with
// write access, do not see rates, budgets or invoices. The numbers are
// computed by models/lib/billing.js from the board's cards; nothing is
// published.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { BillingBudgets, BillingRates, BillingInvoices } from '/models/billing';
import { featureOnFor } from '/server/lib/assistGate';
const {
  normalizeRate, normalizeBudget, normalizeInvoiceRequest, normalizeInvoiceStatus,
  boardFinance, draftInvoiceLines, canChangeStatus, invoiceNumber, invoiceCsv,
} = require('/models/lib/billing');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

const MAX_BOARDS = 500;
const MAX_CARDS = 20000;
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

async function boardCards(boardId) {
  return Cards.find({ boardId, type: 'cardType-card' }, {
    fields: { _id: 1, title: 1, spentTime: 1, estimatedHours: 1, dueComplete: 1, archived: 1, assignees: 1, members: 1, billable: 1 },
    limit: MAX_CARDS,
  }).fetchAsync();
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

function names(users) {
  return new Map(users.map(u => [u._id, (u.profile && u.profile.fullname) || u.username || u._id]));
}

async function memberNames(board) {
  const ids = (board.members || []).filter(m => m && m.isActive !== false).map(m => m.userId);
  const users = await Meteor.users.find({ _id: { $in: ids } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync();
  const byId = names(users);
  return ids.map(id => ({ userId: id, name: byId.get(id) || id }));
}

function invoiceSummary(invoice) {
  return {
    _id: invoice._id, number: invoice.number, status: invoice.status, currency: invoice.currency,
    customer: invoice.customer || '', issueDate: invoice.issueDate || null, dueDate: invoice.dueDate || null,
    totalMinor: invoice.totalMinor, totalHours: invoice.totalHours,
  };
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
      out.push({ _id: board._id, title: board.title || '', slug: board.slug || 'board',
        budget: money.budget, finance: boardFinance(money) });
    }
    return { boards: out, isAdmin };
  },

  // One board in full: budget, rates, numbers and invoices.
  async billingBoard(boardId) {
    check(boardId, String);
    const userId = await signedIn(this.userId);
    const board = await managedBoard(userId, boardId);
    const money = await boardMoney(boardId);
    const members = await memberNames(board);
    const byId = new Map(members.map(m => [m.userId, m.name]));
    return {
      board: { _id: board._id, title: board.title || '', slug: board.slug || 'board' },
      members,
      budget: money.budget,
      rates: money.rates.map(r => ({ _id: r._id, userId: r.userId || null, name: r.userId ? (byId.get(r.userId) || r.userId) : '',
        hourlyRateMinor: r.hourlyRateMinor, currency: r.currency })),
      finance: boardFinance(money),
      draft: (() => { try { return draftInvoiceLines(money); } catch (e) { return null; } })(),
      invoices: money.invoices.map(invoiceSummary),
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
    const existing = await BillingBudgets.findOneAsync({ boardId });
    if (existing) {
      await BillingBudgets.removeAsync({ _id: existing._id });
    }
    await BillingBudgets.insertAsync(doc);
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

  // A draft invoice of the billable hours not invoiced yet.
  async billingCreateInvoice(boardId, request) {
    check(boardId, String);
    check(request, Object);
    const userId = await signedIn(this.userId);
    await managedBoard(userId, boardId);
    const header = validated(() => normalizeInvoiceRequest(request));
    const money = await boardMoney(boardId);
    const draft = validated(() => draftInvoiceLines(money));
    if (!draft.lines.length) invalid(new Error('There are no billable hours left to invoice'));
    const year = (header.issueDate || new Date().toISOString().slice(0, 10)).slice(0, 4);
    // The number is the next of its year; a unique index settles a race.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await BillingInvoices.find({ number: { $regex: `^INV-${year}-` } }).countAsync();
      const number = invoiceNumber(year, count + 1 + attempt);
      const doc = {
        boardId, number, status: 'draft', currency: draft.currency, lines: draft.lines.map(line => {
          const l = { ...line };
          if (!l.userId) delete l.userId;
          return l;
        }),
        totalMinor: draft.totalMinor, totalHours: draft.totalHours, createdBy: userId,
      };
      for (const key of ['customer', 'reference', 'notes', 'issueDate', 'dueDate']) if (header[key]) doc[key] = header[key];
      try {
        return await BillingInvoices.insertAsync(doc);
      } catch (e) {
        if (!/duplicate key|E11000/i.test(String(e && e.message))) throw e;
      }
    }
    return invalid(new Error('Could not number the invoice; try again'));
  },

  async billingSetInvoiceStatus(invoiceId, status) {
    check(invoiceId, String);
    check(status, String);
    const userId = await signedIn(this.userId);
    const invoice = await BillingInvoices.findOneAsync(invoiceId);
    if (!invoice) invalid(new Error('No such invoice'));
    await managedBoard(userId, invoice.boardId);
    const next = validated(() => normalizeInvoiceStatus(status));
    if (!canChangeStatus(invoice.status, next)) invalid(new Error(`An invoice that is ${invoice.status} cannot become ${next}`));
    await BillingInvoices.updateAsync(invoiceId, { $set: { status: next, statusChangedAt: new Date() } });
    return next;
  },

  // One invoice in full, for printing.
  async billingInvoice(invoiceId) {
    check(invoiceId, String);
    const userId = await signedIn(this.userId);
    const invoice = await BillingInvoices.findOneAsync(invoiceId);
    if (!invoice) invalid(new Error('No such invoice'));
    const board = await managedBoard(userId, invoice.boardId);
    const byId = new Map((await memberNames(board)).map(m => [m.userId, m.name]));
    return {
      ...invoiceSummary(invoice),
      reference: invoice.reference || '', notes: invoice.notes || '',
      boardTitle: board.title || '',
      lines: invoice.lines.map(l => ({ ...l, name: l.userId ? (byId.get(l.userId) || '') : '' })),
    };
  },

  async billingInvoiceCsv(invoiceId) {
    check(invoiceId, String);
    const userId = await signedIn(this.userId);
    const invoice = await BillingInvoices.findOneAsync(invoiceId);
    if (!invoice) invalid(new Error('No such invoice'));
    const board = await managedBoard(userId, invoice.boardId);
    const byId = new Map((await memberNames(board)).map(m => [m.userId, m.name]));
    return invoiceCsv(invoice, id => (id ? byId.get(id) || '' : ''));
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'billingBoards', connectionId() { return true; } }, 20, 60000);

// Invoices of a deleted board go with it; budgets and rates too.
if (Boards.after && typeof Boards.after.remove === 'function') {
  Boards.after.remove(async (currentUserId, doc) => {
    try {
      if (!doc || typeof doc._id !== 'string') return;
      await BillingBudgets.removeAsync({ boardId: doc._id });
      await BillingRates.removeAsync({ boardId: doc._id });
    } catch (e) {
      console.error('[billing] Failed to remove the budget and rates of a deleted board', doc && doc._id, e);
    }
  });
}

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(BillingBudgets, { boardId: 1 });
  await ensureIndex(BillingRates, { boardId: 1, userId: 1 });
  await ensureIndex(BillingInvoices, { number: 1 }, { unique: true });
  await ensureIndex(BillingInvoices, { boardId: 1, createdAt: -1 });
});
