// Time entries (models/lib/timeEntries.js, docs/Features/Billing/README.md).
//
// A card's spentTime is the total; the entries are its days. Two ways in:
//
//   - the methods below: a person logs time on a day (or removes an entry of
//     theirs), which adds to or takes from the card's spentTime as well;
//   - any other write of spentTime - the Time popup, the timers, the REST API,
//     an import - is caught by the hook below, which records the difference
//     as an entry of that day by that user. Time spent before entries were
//     kept becomes one undated entry, once.
//
// Logging and reading follow the card: who may change the card may log time on
// it, who may see it may read its entries. An entry already on an invoice is a
// record and is not removed.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import TimeEntries from '/models/timeEntries';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
const { normalizeTimeEntry, reconcile, sumHours } = require('/models/lib/timeEntries');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

function denied() {
  throw new Meteor.Error('not-authorized', 'You may not do that');
}

function invalid(error) {
  throw new Meteor.Error('invalid-input', (error && error.message) || 'Invalid input');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// The card whose time this is: a linked card's time is the card it links to.
async function realCard(cardId) {
  const card = await Cards.findOneAsync(cardId, { fields: { boardId: 1, listId: 1, type: 1, linkedId: 1, assignees: 1, members: 1, spentTime: 1 } });
  if (!card) return null;
  if (card.type === 'cardType-linkedCard' && card.linkedId) {
    return Cards.findOneAsync(card.linkedId, { fields: { boardId: 1, listId: 1, type: 1, assignees: 1, members: 1, spentTime: 1 } });
  }
  return card;
}

async function mayRead(userId, card) {
  if (!userId || !card) return false;
  if (await canEditCardOrLinkedCard(userId, card, undefined, { recordDenial: false })) return true;
  const board = await Boards.findOneAsync(card.boardId, { fields: { members: 1, permission: 1 } });
  if (!board || isAssignedOnlyMember(board, userId)) return false;
  return canUserSeeBoard(userId, card.boardId);
}

async function boardAdmin(userId, boardId) {
  const board = await Boards.findOneAsync(boardId, { fields: { members: 1 } });
  if ((board && (board.members || []).some(m => m && m.userId === userId && m.isActive !== false && m.isAdmin === true))) return true;
  const user = await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  return !!(user && user.isAdmin === true);
}

// Bring the entries of a card in step with its spentTime.
export async function reconcileCardEntries(card, previous, userId) {
  if (!card || !card._id) return [];
  const entries = await TimeEntries.find({ cardId: card._id }, { fields: { hours: 1, source: 1 } }).fetchAsync();
  const add = reconcile(previous, card.spentTime, entries, today());
  for (const entry of add) {
    const doc = { cardId: card._id, boardId: card.boardId, hours: entry.hours, source: entry.source };
    if (entry.date) doc.date = entry.date;
    if (userId && entry.source !== 'legacy') doc.userId = userId;
    await TimeEntries.insertAsync(doc);
  }
  return add;
}

Cards.after.update(async function (userId, doc, fieldNames) {
  if (!fieldNames.includes('spentTime')) return;
  const previous = (this.previous || {}).spentTime;
  if ((previous || 0) === (doc.spentTime || 0)) return;
  try {
    await reconcileCardEntries(doc, previous, userId);
  } catch (e) {
    console.error('[timeEntries] Could not record the time of card', doc._id, e);
  }
});

// A card moved to another board takes its entries with it.
Cards.after.update(async function (userId, doc, fieldNames) {
  if (!fieldNames.includes('boardId')) return;
  const before = (this.previous || {}).boardId;
  if (!before || before === doc.boardId) return;
  await TimeEntries.updateAsync({ cardId: doc._id }, { $set: { boardId: doc.boardId } }, { multi: true });
});

Meteor.methods({
  // Log time on a day: the entry, and the card's total with it.
  async timeEntryAdd(cardId, entry) {
    check(cardId, String);
    check(entry, Object);
    const userId = this.userId;
    if (!userId) denied();
    const card = await realCard(cardId);
    if (!card || !(await canEditCardOrLinkedCard(userId, card))) denied();
    let value;
    try { value = normalizeTimeEntry(entry); } catch (e) { invalid(e); }
    // Time already spent with no entry becomes the undated entry first, so the
    // hook below has nothing to add.
    await reconcileCardEntries({ ...card, spentTime: card.spentTime || 0 }, card.spentTime || 0, userId);
    const id = await TimeEntries.insertAsync({
      cardId: card._id, boardId: card.boardId, userId, date: value.date, hours: value.hours,
      note: value.note || undefined, source: 'manual',
    });
    await Cards.updateAsync(card._id, { $inc: { spentTime: value.hours } });
    return id;
  },

  // Remove an entry: one's own, or any as the board's admin. Not one on an invoice.
  async timeEntryRemove(entryId) {
    check(entryId, String);
    const userId = this.userId;
    if (!userId) denied();
    const entry = await TimeEntries.findOneAsync(entryId);
    if (!entry) return false;
    const card = await realCard(entry.cardId);
    if (!card || !(await canEditCardOrLinkedCard(userId, card))) denied();
    if (entry.userId !== userId && !(await boardAdmin(userId, entry.boardId))) denied();
    if (entry.invoiceId) invalid(new Error('This time is on an invoice'));
    // Approved time is what the board will bill: it stays as it was approved.
    if (entry.approval === 'approved') invalid(new Error('This time is approved'));
    await TimeEntries.removeAsync(entryId);
    await Cards.updateAsync(card._id, { $inc: { spentTime: -entry.hours } });
    return true;
  },

  // A card's entries, newest first, with who logged them.
  async timeEntriesOfCard(cardId) {
    check(cardId, String);
    const userId = this.userId;
    if (!userId) denied();
    const card = await realCard(cardId);
    if (!(await mayRead(userId, card))) denied();
    const entries = await TimeEntries.find({ cardId: card._id }, { sort: { date: -1, createdAt: -1 }, limit: 500 }).fetchAsync();
    const ids = [...new Set(entries.map(e => e.userId).filter(Boolean))];
    const users = await Meteor.users.find({ _id: { $in: ids } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync();
    const name = new Map(users.map(u => [u._id, (u.profile && u.profile.fullname) || u.username || u._id]));
    return {
      total: sumHours(entries),
      entries: entries.map(e => ({
        _id: e._id, date: e.date || null, hours: e.hours, note: e.note || '', source: e.source,
        userId: e.userId || null, name: e.userId ? name.get(e.userId) || '' : '',
        invoiced: !!e.invoiceId, mine: e.userId === userId,
        // A board admin's decision, when the board approves time (server/billing.js).
        approval: e.approval || null, approvalNote: e.approval === 'rejected' ? e.approvalNote || '' : '',
      })),
    };
  },
});

// A deleted card's entries go with it - unless they are on an invoice.
if (Cards.after && typeof Cards.after.remove === 'function') {
  Cards.after.remove(async (currentUserId, doc) => {
    try {
      if (doc && typeof doc._id === 'string') await TimeEntries.removeAsync({ cardId: doc._id, invoiceId: { $exists: false } });
    } catch (e) {
      console.error('[timeEntries] Could not remove the entries of a deleted card', doc && doc._id, e);
    }
  });
}

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(TimeEntries, { cardId: 1, date: 1 });
  await ensureIndex(TimeEntries, { boardId: 1, date: 1 });
  await ensureIndex(TimeEntries, { invoiceId: 1 });
});
