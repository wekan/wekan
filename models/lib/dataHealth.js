'use strict';

// Data health: data WeKan itself should never write - a card on a list of
// another board, a checklist item whose checklist is gone, a board member whose
// account was deleted - found by a read-only scan and shown in Admin Panel /
// Problems / Summary, with a Repair button where the repair is safe.
//
// "Broken cards" (models/lib/brokenCardsRepair.js) only sees EMPTY ids. On one
// production database (32,612 boards, 1.1 million cards) a scan like this one
// found 706 cards on a list of another board (invisible everywhere), 842 card
// numbers used twice, 2,335 checklist items of deleted checklists and 110 custom
// field values of fields not on the card's board - each of which turned out to be
// a bug that was still happening.
//
// Pure: it takes the MongoDB driver `Db` (server/lib/mongoStartup.js getRawDb())
// and uses only find() with projections, distinct(), updateOne/updateMany/
// deleteMany/insertOne and, for one check, aggregate(), so it also runs on
// FerretDB and is tested with plain Node (tests/dataHealth6818.test.cjs). Memory
// is bounded by the number of boards, lists, swimlanes and custom fields - never
// by the number of cards or of things under them, which are streamed and looked
// up a chunk at a time.
//
// The card list and swimlane repairs are not written here a second time: they
// run the startup upgrade steps that already fix exactly that
// (server/lib/schemaUpgradeSteps.js card-list-other-board, swimlane-structure),
// so a fix to one is a fix to both. Every other repair changes only what it
// found ($pull of the entries it read, or an update guarded by the value it
// read), so an edit made while it runs is never overwritten.
//
// The scan reads ids, never titles or contents. Examples are ids only.

const EXAMPLES = 3;
const CHUNK = 1000;

// Every check: what it is, what it means for users, what to do, and whether a
// Repair button may fix it. repair: 'safe' (puts things where they belong,
// deletes nothing anyone can see), 'confirm' (deletes data that is no longer
// shown anywhere - asks first), or null (look, do not touch).
const CHECKS = [
  { id: 'board-duplicate-member', title: 'Boards listing the same member twice',
    means: 'The member list shows the person twice; their role can differ per entry.',
    todo: 'Repair keeps one entry per person: an active board admin, else an active one, else the first.', repair: 'safe' },
  { id: 'board-ghost-member', title: 'Board members whose account no longer exists',
    means: 'Deleting an account did not remove it from the boards it was on.',
    todo: 'Repair removes those entries from the member lists.', repair: 'safe' },
  { id: 'board-no-admin', title: 'Open boards without an active board admin',
    means: 'Nobody can change the board settings or its members.',
    todo: 'Make a member board admin (Admin Panel / People, or the board\'s member menu).', repair: null },
  { id: 'swimlane-no-board', title: 'Swimlanes on a board that does not exist',
    means: 'Left over from a deleted board; not shown anywhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'list-no-board', title: 'Lists on a board that does not exist',
    means: 'Left over from a deleted board; not shown anywhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'list-missing-swimlane', title: 'Lists bound to a swimlane that does not exist',
    means: 'The list and its cards are shown in no swimlane.',
    todo: 'Repair makes these lists shared, so they show in every swimlane.', repair: 'safe' },
  { id: 'list-foreign-swimlane', title: 'Lists bound to a swimlane of another board',
    means: 'The list and its cards are shown in no swimlane of their own board.',
    todo: 'Repair makes these lists shared, so they show in every swimlane.', repair: 'safe' },
  { id: 'sort-not-a-number', title: 'Lists, swimlanes or cards with a sort that is not a number',
    means: 'Ordering breaks; a board can hang while loading, and FerretDB refuses the value.',
    todo: 'The startup upgrade step nonfinite-sort-repair fixes these at the next WeKan upgrade.', repair: null },
  { id: 'card-no-board', title: 'Cards on a board that does not exist',
    means: 'Not shown anywhere. Also counted in Broken cards when the board id is empty.',
    todo: 'Nothing can tell which board they belonged to.', repair: null },
  { id: 'card-missing-list', title: 'Cards on a list that does not exist',
    means: 'Not shown anywhere on their board.',
    todo: 'Repair runs the startup upgrade step swimlane-structure: the first list of their board (or a new "Rescued Data" list).', repair: 'safe' },
  { id: 'card-foreign-list', title: 'Cards on a list of ANOTHER board',
    means: 'Not shown anywhere: their board shows only its own lists. A card moved to another board kept the list it had.',
    todo: 'Repair runs the startup upgrade steps card-list-other-board and swimlane-structure: the first list of their own board (or a new "Rescued Data" list), and a swimlane of that board.', repair: 'safe' },
  { id: 'card-missing-swimlane', title: 'Open cards in a swimlane that does not exist',
    means: 'Not shown in the Swimlanes view.',
    todo: 'Repair runs the startup upgrade step swimlane-structure, which puts them in the first swimlane of their board.', repair: 'safe' },
  { id: 'card-foreign-swimlane', title: 'Open cards in a swimlane of another board',
    means: 'Not shown in the Swimlanes view of their board.',
    todo: 'Repair runs the startup upgrade step swimlane-structure, which puts them in the first swimlane of their board.', repair: 'safe' },
  { id: 'card-no-archived-flag', title: 'Cards without the archived field',
    means: 'Views ask for archived: false, so these cards are shown nowhere.',
    todo: 'The startup upgrade step archived-flag-backfill fixes these.', repair: null },
  { id: 'card-duplicate-number', title: 'Card numbers used by more than one open card on a board',
    means: 'Two cards answer to the same number, in search and in links.',
    todo: 'Not repaired: card numbers may already be written down elsewhere. Examples are board ids.', repair: null },
  { id: 'card-link-gone', title: 'Linked cards or boards whose original is gone',
    means: 'The link opens nothing.', todo: 'Archive or delete the linked card.', repair: null },
  { id: 'card-parent-gone', title: 'Subtasks whose parent card is gone',
    means: 'The subtask shows a parent that cannot be opened.', todo: 'Nothing urgent.', repair: null },
  { id: 'card-dead-field-values', title: 'Cards with values for a custom field that is not on their board',
    means: 'The value is shown nowhere, and copying or linking the card was refused before WeKan v12.63.',
    todo: 'Repair removes those values after you confirm. Values of fields on the card\'s board are kept.', repair: 'confirm' },
  { id: 'checklist-card-gone', title: 'Checklists whose card is gone', means: 'Shown nowhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'checklist-wrong-board', title: 'Checklists with another board than their card',
    means: 'Not shown on the card\'s board.', todo: 'The startup upgrade step card-children-boardid fixes these.', repair: null },
  { id: 'comment-card-gone', title: 'Comments whose card is gone', means: 'Shown nowhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'comment-wrong-board', title: 'Comments with another board than their card',
    means: 'Not shown on the card\'s board.', todo: 'The startup upgrade step card-children-boardid fixes these.', repair: null },
  { id: 'text-note-card-gone', title: 'Text notes whose card is gone', means: 'Shown nowhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'text-note-wrong-board', title: 'Text notes with another board than their card',
    means: 'Not shown on the card\'s board.', todo: 'The startup upgrade step card-children-boardid fixes these.', repair: null },
  { id: 'checklist-item-orphan', title: 'Checklist items whose checklist is gone',
    means: 'Deleting a checklist did not delete its items. They are shown nowhere.',
    todo: 'Repair deletes them after you confirm.', repair: 'confirm' },
  { id: 'checklist-item-other-card', title: 'Checklist items on another card than their checklist',
    means: 'The item is counted on one card and shown on another.', todo: 'Nothing urgent.', repair: null },
  { id: 'attachment-card-gone', title: 'Attachments (not deleted) whose card is gone',
    means: 'The file still takes disk space and is shown nowhere.',
    todo: 'Attachment retention (Admin Panel / Attachments) or the card\'s board admin can remove them.', repair: null },
  { id: 'customfield-no-board', title: 'Custom fields on no board at all', means: 'Shown nowhere.', todo: 'Nothing urgent.', repair: null },
  { id: 'customfield-dead-board', title: 'Custom fields listing a board that does not exist',
    means: 'Deleting a board did not remove it from the custom fields it used.',
    todo: 'Repair removes the deleted boards from those fields; nothing else changes.', repair: 'safe' },
  { id: 'user-duplicate-email', title: 'Accounts sharing an e-mail address (upper/lower case aside)',
    means: 'Logging in, inviting and password reset can pick the wrong account.',
    todo: 'Merge or rename one of the accounts in Admin Panel / People.', repair: null },
];
const CHECK_BY_ID = new Map(CHECKS.map(c => [c.id, c]));

const finite = v => typeof v !== 'number' || Number.isFinite(v);
const filled = v => !(v === null || v === undefined || (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0));
const str = v => (v === null || v === undefined ? '' : String(v));

// The boards a custom field is on. Current WeKan writes an array `boardIds`;
// fields from before v2.49 (mutate-boardIds-in-customfields, now the startup
// step customfields-boardIds) carry a scalar `boardId`, and a string
// `boardIds` has been seen too. A field on a live board through any of these
// shapes is on that board.
function fieldBoardIds(f) {
  const ids = Array.isArray(f.boardIds) ? f.boardIds.slice() : (f.boardIds ? [f.boardIds] : []);
  if (f.boardId) ids.push(f.boardId);
  return ids.map(str);
}

function tally() {
  const counts = new Map(CHECKS.map(c => [c.id, { id: c.id, count: 0, examples: [] }]));
  return {
    add(id, example) {
      const row = counts.get(id);
      row.count += 1;
      if (row.examples.length < EXAMPLES && example !== undefined) row.examples.push(str(example));
    },
    set(id, count, examples) {
      Object.assign(counts.get(id), { count, examples: examples.slice(0, EXAMPLES).map(str) });
    },
    rows: () => [...counts.values()],
  };
}

// Stream `coll` in chunks; for each chunk call `lookup(chunk)`.
async function inChunks(cursor, pause, handle) {
  let chunk = [];
  for await (const doc of cursor) {
    chunk.push(doc);
    if (chunk.length >= CHUNK) { await handle(chunk); chunk = []; await pause(); }
  }
  if (chunk.length) await handle(chunk);
}

async function byIds(db, coll, ids, projection) {
  const unique = [...new Set(ids.filter(Boolean).map(str))];
  if (!unique.length) return new Map();
  const found = await db.collection(coll).find({ _id: { $in: unique } }, { projection }).toArray();
  return new Map(found.map(d => [str(d._id), d]));
}

// The parents everything else is checked against. Bounded by boards, lists,
// swimlanes and custom fields.
async function loadParents(db) {
  const boards = new Set((await db.collection('boards').distinct('_id')).map(str));
  const badSort = [];
  const swimlanes = new Map();
  for (const s of await db.collection('swimlanes').find({}, { projection: { boardId: 1, sort: 1 } }).toArray()) {
    swimlanes.set(str(s._id), str(s.boardId));
    if (!finite(s.sort)) badSort.push(s._id);
  }
  const lists = new Map();
  for (const l of await db.collection('lists').find({}, { projection: { boardId: 1, swimlaneId: 1, sort: 1 } }).toArray()) {
    lists.set(str(l._id), { boardId: str(l.boardId), swimlaneId: str(l.swimlaneId) });
    if (!finite(l.sort)) badSort.push(l._id);
  }
  const fieldBoards = new Map();
  for (const f of await db.collection('customFields').find({}, { projection: { boardIds: 1, boardId: 1 } }).toArray()) {
    fieldBoards.set(str(f._id), fieldBoardIds(f));
  }
  return { boards, swimlanes, lists, fieldBoards, badSort };
}

// Which members of a board entry list to keep: one per user - an active board
// admin, else an active member, else the first entry - so removing a duplicate
// never takes board-admin rights away from somebody who had them. "Active" is
// isActive === true, as Boards.hasAdmin() reads it. Returns null when nothing
// changes.
const memberRank = m => (m.isActive === true ? 2 : 0) + (m.isActive === true && m.isAdmin === true ? 1 : 0);
function dedupeMembers(members) {
  const list = Array.isArray(members) ? members : [];
  const keep = new Map();
  for (const m of list) {
    if (!m || !m.userId) continue;
    const had = keep.get(m.userId);
    if (!had || memberRank(m) > memberRank(had)) keep.set(m.userId, m);
  }
  const kept = list.filter(m => !m || !m.userId || keep.get(m.userId) === m);
  return kept.length === list.length ? null : kept;
}

function deadFieldValues(card, fieldBoards) {
  return (card.customFields || []).filter(v => v && filled(v.value) &&
    !(v._id && (fieldBoards.get(str(v._id)) || []).includes(str(card.boardId))));
}

async function scanDataHealth(db, { pause = async () => {} } = {}) {
  const startedAt = new Date();
  const t = tally();
  const { boards, swimlanes, lists, fieldBoards, badSort } = await loadParents(db);
  const users = new Set((await db.collection('users').distinct('_id')).map(str));

  // ---- boards --------------------------------------------------------------
  for await (const b of db.collection('boards').find({}, { projection: { members: 1, archived: 1, type: 1 } })) {
    const members = Array.isArray(b.members) ? b.members : [];
    if (dedupeMembers(members)) t.add('board-duplicate-member', b._id);
    if (members.some(m => m && m.userId && !users.has(str(m.userId)))) t.add('board-ghost-member', b._id);
    if (!b.archived && (b.type || 'board') === 'board' && members.length &&
        !members.some(m => m && m.isAdmin === true && m.isActive === true && users.has(str(m.userId)))) {
      t.add('board-no-admin', b._id);
    }
  }
  await pause();

  // ---- swimlanes and lists -------------------------------------------------
  for (const [id, boardId] of swimlanes) if (!boards.has(boardId)) t.add('swimlane-no-board', id);
  for (const [id, l] of lists) {
    if (!boards.has(l.boardId)) { t.add('list-no-board', id); continue; }
    if (!l.swimlaneId) continue;
    if (!swimlanes.has(l.swimlaneId)) t.add('list-missing-swimlane', id);
    else if (swimlanes.get(l.swimlaneId) !== l.boardId) t.add('list-foreign-swimlane', id);
  }
  for (const id of badSort) t.add('sort-not-a-number', id);
  await pause();

  // ---- cards ---------------------------------------------------------------
  // [cardId, kind, targetId]: looked up and cleared every CHUNK, so memory does
  // not grow with the number of cards.
  let pointers = [];
  const lookUpPointers = async () => {
    if (!pointers.length) return;
    const part = pointers;
    pointers = [];
    const found = await byIds(db, 'cards', part.map(p => p[2]), { _id: 1 });
    for (const [cardId, kind, target] of part) if (!found.has(target)) t.add(kind, cardId);
  };
  const cards = db.collection('cards').find({}, { projection: {
    boardId: 1, listId: 1, swimlaneId: 1, sort: 1, archived: 1, type: 1, linkedId: 1, parentId: 1, customFields: 1 } });
  let seen = 0;
  for await (const c of cards) {
    if ((seen += 1) % CHUNK === 0) await pause();
    const boardId = str(c.boardId);
    if (!boards.has(boardId)) { if (boardId) t.add('card-no-board', c._id); continue; }
    const listId = str(c.listId);
    if (listId) {
      const l = lists.get(listId);
      if (!l) t.add('card-missing-list', c._id);
      else if (l.boardId !== boardId) t.add('card-foreign-list', c._id);
    }
    // Open cards only: an archived card is shown in no swimlane anyway, and
    // swimlane-structure (the repair) moves only open ones.
    const swimlaneId = str(c.swimlaneId);
    if (swimlaneId && c.archived === false) {
      if (!swimlanes.has(swimlaneId)) t.add('card-missing-swimlane', c._id);
      else if (swimlanes.get(swimlaneId) !== boardId) t.add('card-foreign-swimlane', c._id);
    }
    if (!finite(c.sort)) t.add('sort-not-a-number', c._id);
    if (c.archived === undefined) t.add('card-no-archived-flag', c._id);
    if (c.type === 'cardType-linkedBoard' && c.linkedId && !boards.has(str(c.linkedId))) t.add('card-link-gone', c._id);
    if (c.type === 'cardType-linkedCard' && c.linkedId) pointers.push([c._id, 'card-link-gone', str(c.linkedId)]);
    if (c.parentId) pointers.push([c._id, 'card-parent-gone', str(c.parentId)]);
    if (deadFieldValues(c, fieldBoards).length) t.add('card-dead-field-values', c._id);
    if (pointers.length >= CHUNK) await lookUpPointers();
  }
  await lookUpPointers();
  await pause();

  // Duplicate card numbers: grouped by the database. Skipped (count null) where
  // aggregate() is not available.
  try {
    const groups = await db.collection('cards').aggregate([
      { $match: { archived: false, cardNumber: { $gt: 0 } } },
      { $group: { _id: { b: '$boardId', n: '$cardNumber' }, c: { $sum: 1 } } },
      { $match: { c: { $gt: 1 } } },
    ], { allowDiskUse: true }).toArray();
    t.set('card-duplicate-number', groups.length, groups.map(g => g._id && g._id.b));
  } catch (_) {
    t.set('card-duplicate-number', null, []);
  }
  await pause();

  // ---- things under a card -------------------------------------------------
  for (const [coll, gone, wrong] of [
    ['checklists', 'checklist-card-gone', 'checklist-wrong-board'],
    ['card_comments', 'comment-card-gone', 'comment-wrong-board'],
    ['card_text_notes', 'text-note-card-gone', 'text-note-wrong-board'],
  ]) {
    await inChunks(db.collection(coll).find({}, { projection: { cardId: 1, boardId: 1 } }), pause, async chunk => {
      const owners = await byIds(db, 'cards', chunk.map(d => d.cardId), { boardId: 1 });
      for (const d of chunk) {
        if (!d.cardId) continue;
        const card = owners.get(str(d.cardId));
        if (!card) t.add(gone, d._id);
        else if (d.boardId && str(d.boardId) !== str(card.boardId)) t.add(wrong, d._id);
      }
    });
  }
  await inChunks(db.collection('checklistItems').find({}, { projection: { checklistId: 1, cardId: 1 } }), pause, async chunk => {
    const owners = await byIds(db, 'checklists', chunk.map(d => d.checklistId), { cardId: 1 });
    for (const d of chunk) {
      const checklist = owners.get(str(d.checklistId));
      if (!checklist) t.add('checklist-item-orphan', d._id);
      else if (str(d.cardId) !== str(checklist.cardId)) t.add('checklist-item-other-card', d._id);
    }
  });
  await inChunks(db.collection('attachments').find(
    { 'meta.cardId': { $exists: true, $nin: [null, ''] }, deletedAt: null },
    { projection: { 'meta.cardId': 1 } },
  ), pause, async chunk => {
    const owners = await byIds(db, 'cards', chunk.map(d => d.meta && d.meta.cardId), { _id: 1 });
    for (const d of chunk) if (!owners.has(str(d.meta && d.meta.cardId))) t.add('attachment-card-gone', d._id);
  });

  // ---- custom fields and users ---------------------------------------------
  for (const [id, ids] of fieldBoards) {
    if (!ids.length) t.add('customfield-no-board', id);
    else if (ids.some(b => !boards.has(b))) t.add('customfield-dead-board', id);
  }
  const emails = new Map();
  for await (const u of db.collection('users').find({}, { projection: { 'emails.address': 1 } })) {
    for (const e of u.emails || []) {
      const key = str(e && e.address).trim().toLowerCase();
      if (!key) continue;
      if (emails.has(key) && emails.get(key) !== str(u._id)) t.add('user-duplicate-email', u._id);
      else emails.set(key, str(u._id));
    }
  }

  const finishedAt = new Date();
  return { at: finishedAt, startedAt, durationMs: finishedAt - startedAt, results: t.rows() };
}

// ---- repairs -----------------------------------------------------------------
// Each repair finds its targets again (never trusts the stored scan) and returns
// how many documents it changed. None of them writes back a whole array it read
// earlier: entries are removed with $pull of exactly the ones found, and the
// one rewrite (member dedupe) is guarded by the array it read, so an edit made
// meanwhile makes it skip that board rather than undo the edit.

// The startup upgrade steps (server/lib/schemaUpgradeSteps.js), run the way
// runSchemaUpgrade() runs them: check(), and run() only when check() found
// work. Neither card-list-other-board nor swimlane-structure reads ctx; it gets
// the runner's log so a later step that does can be added here unchanged.
// Required lazily: the module is plain CommonJS, used by the server only.
async function runUpgradeSteps(db, names, { log = () => {} } = {}) {
  const { steps } = require('../../server/lib/schemaUpgradeSteps');
  const ctx = { log };
  let fixed = 0;
  for (const name of names) {
    const step = steps.find(s => s.name === name);
    if (!step) throw new Error(`no upgrade step ${name}`);
    if (!(await step.check(db, ctx))) continue;
    const res = await step.run(db, ctx);
    fixed += (res && res.fixed) || 0;
  }
  return fixed;
}

const REPAIRS = {
  async 'board-duplicate-member'(db) {
    let fixed = 0;
    for (const b of await db.collection('boards').find({}, { projection: { members: 1 } }).toArray()) {
      const kept = dedupeMembers(b.members);
      if (!kept) continue;
      // Guarded by the members array as read: a member added, removed or given
      // another role meanwhile leaves this board for the next scan.
      const r = await db.collection('boards').updateOne({ _id: b._id, members: b.members }, { $set: { members: kept } });
      fixed += (r && r.modifiedCount) || 0;
    }
    return fixed;
  },
  async 'board-ghost-member'(db) {
    const users = new Set((await db.collection('users').distinct('_id')).map(str));
    let fixed = 0;
    for (const b of await db.collection('boards').find({}, { projection: { members: 1 } }).toArray()) {
      const members = Array.isArray(b.members) ? b.members : [];
      const ghostIds = [...new Set(members.filter(m => m && m.userId && !users.has(str(m.userId))).map(m => m.userId))];
      if (!ghostIds.length) continue;
      const r = await db.collection('boards').updateOne({ _id: b._id }, { $pull: { members: { userId: { $in: ghostIds } } } });
      fixed += (r && r.modifiedCount) || 0;
    }
    return fixed;
  },
  async 'list-missing-swimlane'(db) { return repairListSwimlanes(db, false); },
  async 'list-foreign-swimlane'(db) { return repairListSwimlanes(db, true); },
  async 'card-missing-list'(db, opts) { return runUpgradeSteps(db, ['swimlane-structure'], opts); },
  // card-list-other-board first, as the runner orders them (#6814): a rescued
  // card keeps the swimlane of the board it left until swimlane-structure moves it.
  async 'card-foreign-list'(db, opts) { return runUpgradeSteps(db, ['card-list-other-board', 'swimlane-structure'], opts); },
  async 'card-missing-swimlane'(db, opts) { return runUpgradeSteps(db, ['swimlane-structure'], opts); },
  async 'card-foreign-swimlane'(db, opts) { return runUpgradeSteps(db, ['swimlane-structure'], opts); },
  async 'card-dead-field-values'(db, { pause = async () => {} } = {}) {
    const { fieldBoards } = await loadParents(db);
    let fixed = 0;
    for await (const c of db.collection('cards').find({ 'customFields.0': { $exists: true } }, { projection: { boardId: 1, customFields: 1 } })) {
      const dead = deadFieldValues(c, fieldBoards);
      if (!dead.length) continue;
      const deadIds = [...new Set(dead.filter(v => v._id).map(v => v._id))];
      // a value with no field id belongs to no field: $in null matches those
      if (dead.some(v => !v._id)) deadIds.push(null);
      const r = await db.collection('cards').updateOne({ _id: c._id }, { $pull: { customFields: { _id: { $in: deadIds } } } });
      fixed += (r && r.modifiedCount) || 0;
      if (fixed && fixed % CHUNK === 0) await pause();
    }
    return fixed;
  },
  async 'checklist-item-orphan'(db, { pause = async () => {} } = {}) {
    let fixed = 0;
    await inChunks(db.collection('checklistItems').find({}, { projection: { checklistId: 1 } }), pause, async chunk => {
      const owners = await byIds(db, 'checklists', chunk.map(d => d.checklistId), { _id: 1 });
      const ids = chunk.filter(d => !owners.has(str(d.checklistId))).map(d => d._id);
      if (!ids.length) return;
      const r = await db.collection('checklistItems').deleteMany({ _id: { $in: ids } });
      fixed += (r && r.deletedCount) || 0;
    });
    return fixed;
  },
  async 'customfield-dead-board'(db) {
    const boards = new Set((await db.collection('boards').distinct('_id')).map(str));
    let fixed = 0;
    for (const f of await db.collection('customFields').find({}, { projection: { boardIds: 1, boardId: 1 } }).toArray()) {
      const ids = fieldBoardIds(f);
      // a field on deleted boards only is left for the admin (customfield-no-board after)
      if (!ids.some(b => boards.has(b)) || ids.every(b => boards.has(b))) continue;
      const update = {};
      if (Array.isArray(f.boardIds)) {
        const deadBoards = f.boardIds.filter(b => !boards.has(str(b)));
        if (deadBoards.length) update.$pull = { boardIds: { $in: deadBoards } };
      }
      // the legacy shapes: unset only when they still hold the dead board read here
      const filter = { _id: f._id };
      const unset = {};
      if (f.boardIds && !Array.isArray(f.boardIds) && !boards.has(str(f.boardIds))) { unset.boardIds = ''; filter.boardIds = f.boardIds; }
      if (f.boardId && !boards.has(str(f.boardId))) { unset.boardId = ''; filter.boardId = f.boardId; }
      if (Object.keys(unset).length) update.$unset = unset;
      if (!Object.keys(update).length) continue;
      const r = await db.collection('customFields').updateOne(filter, update);
      fixed += (r && r.modifiedCount) || 0;
    }
    return fixed;
  },
};

async function repairListSwimlanes(db, foreign) {
  const swimlanes = new Map();
  for (const s of await db.collection('swimlanes').find({}, { projection: { boardId: 1 } }).toArray()) swimlanes.set(str(s._id), str(s.boardId));
  const ids = (await db.collection('lists').find({ swimlaneId: { $nin: [null, ''] } }, { projection: { boardId: 1, swimlaneId: 1 } }).toArray())
    .filter(l => (foreign
      ? swimlanes.has(str(l.swimlaneId)) && swimlanes.get(str(l.swimlaneId)) !== str(l.boardId)
      : !swimlanes.has(str(l.swimlaneId))))
    .map(l => l._id);
  if (!ids.length) return 0;
  const r = await db.collection('lists').updateMany({ _id: { $in: ids } }, { $set: { swimlaneId: '' } });
  return (r && r.modifiedCount) || 0;
}

// options.confirmed must be true for a repair that deletes data ('confirm'):
// the page asks with a second click, and the server refuses without it
// (server/methods/dataHealth.js passes it on).
async function repairDataHealth(db, checkId, options = {}) {
  const check = CHECK_BY_ID.get(checkId);
  if (!check || !check.repair || !REPAIRS[checkId]) throw new Error(`no repair for ${checkId}`);
  if (check.repair === 'confirm' && options.confirmed !== true) throw new Error(`repair ${checkId} deletes data and needs confirmation`);
  return REPAIRS[checkId](db, options);
}

// The scan's findings as Problems / Summary rows (models/lib/problemsOverview.js
// extraProblems). Only checks that found something.
function dataHealthProblems(scan) {
  if (!scan || !Array.isArray(scan.results)) return [];
  return scan.results.filter(r => r && r.count > 0).map(r => {
    const c = CHECK_BY_ID.get(r.id) || { title: r.id, means: '', todo: '', repair: null };
    const examples = r.examples && r.examples.length ? ` e.g. ${r.examples.join(', ')}.` : '';
    return {
      id: `data-health:${r.id}`,
      checkId: r.id,
      severity: c.repair ? 'warning' : 'info',
      count: r.count,
      title: `Data health: ${c.title}`,
      detail: `${c.means} ${c.todo}${examples}`.trim(),
      repair: c.repair,
    };
  });
}

module.exports = { CHECKS, scanDataHealth, repairDataHealth, dataHealthProblems, dedupeMembers };
