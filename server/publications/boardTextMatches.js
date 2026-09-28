import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { canReadBoard } from '/models/lib/boardVisibility';
import { boardTextSearch } from '/server/lib/boardTextSearch';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

Meteor.publish('boardTextMatches', async function(boardId, term) {
  check(boardId, String); check(term, String);
  if (!boardId || !term.trim() || term.length > 512) return this.ready();
  const publication = this;
  const children = [
    { model: CardComments, field: 'text' },
    { model: Checklists, field: 'title' },
    { model: ChecklistItems, field: 'title' },
  ];
  let stopped = false, initializing = true, running = false, pending = false, revision = 0;
  const handles = [], published = new Set();
  const rowId = cardId => JSON.stringify([boardId, term, cardId]);
  const clear = () => {
    for (const id of published) publication.removed('boardTextMatches', rowId(id));
    published.clear();
  };
  this.onStop(() => { stopped = true; for (const handle of handles) handle.stop(); });
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
        const ids = await boardTextSearch({ cards: Cards.rawCollection(),
          children: children.map(({ model, field }) => ({ collection: model.rawCollection(), field })),
          scope, term, stopped: () => stopped || revision !== version });
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
          publication.removed('boardTextMatches', rowId(id)); published.delete(id);
        }
        for (const id of next) if (!published.has(id)) {
          publication.added('boardTextMatches', rowId(id), { boardId, term, cardId: id }); published.add(id);
        }
      }
      if (!stopped) publication.ready();
    } catch (error) {
      if (!stopped) { clear(); publication.error(new Meteor.Error('text-filter-failed', 'Card text filtering failed')); }
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
    if (!canReadBoard(this.userId, board)) { this.ready(); return; }
    await observe(Cards.find({ boardId }, { fields: { title: 1, description: 1, archived: 1, assignees: 1 } }), changed);
    for (const { model, field } of children) {
      await observe(model.find({ boardId }, { fields: { cardId: 1, [field]: 1 } }), changed);
    }
    initializing = false;
    await refresh();
  } catch (error) {
    if (!stopped) this.error(new Meteor.Error('text-filter-failed', 'Card text filtering failed'));
  }
});
