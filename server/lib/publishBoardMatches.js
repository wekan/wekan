import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { canReadBoard } from '/models/lib/boardVisibility';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

// The board's access fields are also re-read on this interval. The board
// observer below is what normally reports a membership change, but on a busy
// test server (polling, no oplog) one stalled for good: a member's
// assigned-only restriction was lifted and the matches never widened again,
// and the same stall would have kept a NARROWED member's old matches. A
// missed observer event must not decide what a member may see.
const ACCESS_RECHECK_MS = 10000;
const accessSignature = (board, boardFields) => JSON.stringify(board ? [board.permission, board.members,
  ...Object.keys(boardFields).sort().map(field => board[field])] : null);

// Shared authorized, reactive ID-only publication for board filter providers.
export async function publishBoardMatches({ publication, boardId, key, identity,
  collectionName, children, cardFields = {}, boardFields = {}, snapshot = false, prepare, findMatches }) {
  let stopped = false, initializing = true, running = false, pending = false, revision = 0;
  const handles = [], published = new Set();
  let pagePublished = false;
  // The access fields the published result was computed from.
  let seenAccess;
  let accessTimer;
  const pageCards = new Map();
  const watches = new Map();
  const rowId = cardId => JSON.stringify([boardId, key, cardId]);
  const clear = () => {
    for (const id of published) publication.removed(collectionName, rowId(id));
    published.clear();
    if (pagePublished) publication.removed(collectionName, rowId('page'));
    pagePublished = false;
    for (const id of pageCards.keys()) publication.removed('cards', id);
    pageCards.clear();
  };
  publication.onStop(() => {
    stopped = true;
    if (accessTimer) Meteor.clearInterval(accessTimer);
    for (const handle of handles) handle.stop();
    for (const { handle } of watches.values()) handle.stop();
    watches.clear();
  });
  const watch = async (name, key, cursor) => {
    if (stopped || watches.get(name)?.key === key) return;
    let starting = true;
    const invalidate = () => { if (!starting) boardChanged(); };
    const handle = await cursor.observeChangesAsync({ added: invalidate, changed: invalidate, removed: invalidate });
    starting = false;
    if (stopped) { handle.stop(); return; }
    watches.get(name)?.handle.stop();
    watches.set(name, { key, handle });
  };
  const refresh = async () => {
    pending = true;
    if (running || initializing || stopped) return;
    running = true;
    try {
      while (pending && !stopped) {
        pending = false;
        const version = revision;
        const board = await Boards.findOneAsync(boardId);
        if (stopped) return;
        if (!canReadBoard(publication.userId, board)) { seenAccess = accessSignature(board, boardFields); clear(); continue; }
        const scope = { boardId, archived: false, ...assignedOnlyCardScope(board, publication.userId) };
        const isStopped = () => stopped || revision !== version;
        const prepared = prepare ? await prepare({ scope, board, watch, stopped: isStopped }) : undefined;
        if (isStopped()) { pending = !stopped; continue; }
        const ids = await findMatches({ scope, board, prepared, stopped: isStopped });
        if (stopped) return;
        if (revision !== version) { pending = true; continue; }
        // Authorization is re-read after the asynchronous scan, not only when
        // the subscription starts. A concurrent policy change forces a retry.
        const latest = await Boards.findOneAsync(boardId);
        if (stopped) return;
        if (!canReadBoard(publication.userId, latest)) { seenAccess = accessSignature(latest, boardFields); clear(); continue; }
        if (revision !== version || JSON.stringify(latest.members) !== JSON.stringify(board.members)) {
          pending = true; continue;
        }
        seenAccess = accessSignature(latest, boardFields);
        if (prepared?.isCurrent && !(await prepared.isCurrent())) { clear(); pending = true; continue; }
        if (isStopped()) { pending = !stopped; continue; }
        if (snapshot) {
          const { cards, ...fields } = ids;
          const next = new Map(cards.map(card => [card._id, card]));
          for (const id of pageCards.keys()) if (!next.has(id)) publication.removed('cards', id);
          for (const [id, card] of next) {
            const { _id, ...data } = card;
            if (!pageCards.has(id)) publication.added('cards', id, data);
            else {
              const previous = pageCards.get(id);
              for (const field of Object.keys(previous)) if (field !== '_id' && !(field in data)) data[field] = undefined;
              publication.changed('cards', id, data);
            }
          }
          pageCards.clear(); for (const [id, card] of next) pageCards.set(id, card);
          publication[pagePublished ? 'changed' : 'added'](collectionName, rowId('page'), { boardId, ...identity, ...fields });
          pagePublished = true;
          continue;
        }
        const next = new Set(ids);
        for (const id of published) if (!next.has(id)) {
          publication.removed(collectionName, rowId(id)); published.delete(id);
        }
        for (const id of next) if (!published.has(id)) {
          publication.added(collectionName, rowId(id), { boardId, ...identity, cardId: id }); published.add(id);
        }
      }
      if (!stopped) publication.ready();
    } catch (error) {
      if (!stopped) { clear(); publication.error(new Meteor.Error('card-filter-failed', 'Card filtering failed')); }
    } finally { running = false; }
  };
  const changed = () => { revision++; void refresh(); };
  const boardChanged = () => { if (!stopped) clear(); changed(); };
  const observe = async (cursor, callback) => {
    const handle = await cursor.observeChangesAsync({ added: callback, changed: callback, removed: callback });
    if (stopped) handle.stop(); else handles.push(handle);
  };
  // Observe before scanning so an edit during a batch invalidates that result.
  try {
    await observe(Boards.find({ _id: boardId }, { fields: { ...boardFields, permission: 1, members: 1 } }), boardChanged);
    const board = await Boards.findOneAsync(boardId);
    if (!canReadBoard(publication.userId, board)) { publication.ready(); return; }
    await observe(Cards.find({ boardId }, cardFields === null ? {} : { fields: { ...cardFields, archived: 1, assignees: 1 } }), changed);
    for (const { model, fields, selector = {} } of children) {
      await observe(model.find({ ...selector, boardId }, { fields: { ...fields, cardId: 1 } }), changed);
    }
    initializing = false;
    await refresh();
    if (!stopped) accessTimer = Meteor.setInterval(async () => {
      if (stopped || running || seenAccess === undefined) return;
      try {
        const latest = await Boards.findOneAsync(boardId);
        if (!stopped && accessSignature(latest, boardFields) !== seenAccess) boardChanged();
      } catch (error) { /* the next tick, or the observer, tries again */ }
    }, ACCESS_RECHECK_MS);
  } catch (error) {
    if (!stopped) publication.error(new Meteor.Error('card-filter-failed', 'Card filtering failed'));
  }
}
