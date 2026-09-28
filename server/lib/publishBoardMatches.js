import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { canReadBoard } from '/models/lib/boardVisibility';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

// Shared authorized, reactive ID-only publication for board filter providers.
export async function publishBoardMatches({ publication, boardId, key, identity,
  collectionName, children, cardFields = {}, findMatches }) {
  let stopped = false, initializing = true, running = false, pending = false, revision = 0;
  const handles = [], published = new Set();
  const rowId = cardId => JSON.stringify([boardId, key, cardId]);
  const clear = () => {
    for (const id of published) publication.removed(collectionName, rowId(id));
    published.clear();
  };
  publication.onStop(() => { stopped = true; for (const handle of handles) handle.stop(); });
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
        if (!canReadBoard(publication.userId, board)) { clear(); continue; }
        const scope = { boardId, archived: false, ...assignedOnlyCardScope(board, publication.userId) };
        const ids = await findMatches({ scope, stopped: () => stopped || revision !== version });
        if (stopped) return;
        if (revision !== version) { pending = true; continue; }
        // Authorization is re-read after the asynchronous scan, not only when
        // the subscription starts. A concurrent policy change forces a retry.
        const latest = await Boards.findOneAsync(boardId);
        if (stopped) return;
        if (!canReadBoard(publication.userId, latest)) { clear(); continue; }
        if (revision !== version || JSON.stringify(latest.members) !== JSON.stringify(board.members)) {
          pending = true; continue;
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
    await observe(Boards.find({ _id: boardId }, { fields: { permission: 1, members: 1 } }), boardChanged);
    const board = await Boards.findOneAsync(boardId);
    if (!canReadBoard(publication.userId, board)) { publication.ready(); return; }
    await observe(Cards.find({ boardId }, { fields: { ...cardFields, archived: 1, assignees: 1 } }), changed);
    for (const { model, fields, selector = {} } of children) {
      await observe(model.find({ ...selector, boardId }, { fields: { ...fields, cardId: 1 } }), changed);
    }
    initializing = false;
    await refresh();
  } catch (error) {
    if (!stopped) publication.error(new Meteor.Error('card-filter-failed', 'Card filtering failed'));
  }
}
