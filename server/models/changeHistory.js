import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ChangeHistory from '/models/changeHistory';
import { ensureIndex } from '/server/lib/mongoStartup';
import { pickUndo, pickRedo } from '/models/lib/undoRedoSelection';
import {
  scopeSelector,
  matchesSearch,
  selectionToIds,
} from '/models/lib/changeHistoryQuery';
import { valueFromContent } from '/models/lib/changeHistoryGroups';
import { pageInfo } from '/models/lib/tablePage';

// Server side of the universal change history
// (docs/Features/Reports/History/History.md): the read method, the restore, and
// the undo/redo stack that generalises #6478 from position moves to every
// recorded change.
//
// This file may import every model it needs BECAUSE NOTHING IMPORTS IT. The
// collection itself (models/changeHistory.js) imports none of them, so the
// mutation paths can import the collection normally - which is the whole reason
// the position history before it recorded nothing.

Meteor.startup(async () => {
  // The columns the scopes filter on, newest first, which is every query the
  // read method makes.
  await ensureIndex(ChangeHistory, { boardId: 1, createdAt: -1 });
  await ensureIndex(ChangeHistory, { cardId: 1, group: 1, createdAt: -1 });
  await ensureIndex(ChangeHistory, { listId: 1, createdAt: -1 });
  await ensureIndex(ChangeHistory, { swimlaneId: 1, createdAt: -1 });
  await ensureIndex(ChangeHistory, { userId: 1, createdAt: -1 });
  // The undo/redo stack: this user, this board, not yet undone / most recently
  // undone.
  await ensureIndex(ChangeHistory, { userId: 1, boardId: 1, undone: 1, createdAt: -1 });
  await ensureIndex(ChangeHistory, { userId: 1, boardId: 1, undone: 1, undoneAt: -1 });
});

const requireBoardVisible = async (userId, boardId) => {
  if (!boardId) return;
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.isVisibleBy({ _id: userId })) {
    throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
  }
};

const requireBoardWrite = async (userId, boardId) => {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.hasMember(userId) || board.hasCommentOnly(userId)) {
    throw new Meteor.Error('not-authorized', 'You cannot change this board.');
  }
};

// ---- appliers: how each kind of change is put back ---------------------------
//
// History.md §8.2: a restore re-applies content through the SAME setters an
// ordinary edit uses, so validation, hooks and Activities all still run. An
// applier therefore never writes a raw selector; it calls the model.
//
// Each returns true when it applied something. Anything it cannot apply - the
// entity is gone, the content is not the shape it expects - returns false, and
// the caller reports that rather than pretending the undo worked.

/*
 * The generic case: a row recorded by the field-diffing hook carries
 * `{ field, value }`, so putting it back is writing that field. This goes
 * through the collection rather than a per-field setter, which History.md §8.2
 * asks for and which is satisfied here because WeKan's Activities are generated
 * by `after.update` collection hooks - a collection update runs exactly the
 * same hooks, validation and activity logging an ordinary edit does. `.direct`
 * would be the thing that skipped them, and is not used.
 */
async function applyFieldContent(collection, row, content) {
  if (!content || typeof content.field !== 'string') return false;
  const value = valueFromContent(content);
  if (value === undefined) return false;
  const existing = await collection.findOneAsync(row.entityId);
  if (!existing) return false;
  await collection.updateAsync(row.entityId, { $set: { [content.field]: value } });
  return true;
}

async function applyCardContent(row, content) {
  const card = await ReactiveCache.getCard(row.entityId);
  if (!card) return false;
  // A move is the one card change that is not a single field: it is four of
  // them that only mean anything together, so it goes back through Card.move
  // rather than as four writes.
  if (row.group === 'position') {
    if (!content) return false;
    await card.move(
      content.boardId || card.boardId,
      content.swimlaneId,
      content.listId,
      content.sort,
    );
    return true;
  }
  return applyFieldContent(Cards, row, content);
}

async function applyListContent(row, content) {
  const list = await ReactiveCache.getList(row.entityId);
  if (!list) return false;
  if (row.group === 'position') {
    if (!content) return false;
    const set = {};
    if (content.sort !== undefined) set.sort = content.sort;
    if (content.swimlaneId !== undefined) set.swimlaneId = content.swimlaneId;
    if (Object.keys(set).length === 0) return false;
    await Lists.updateAsync(list._id, { $set: set });
    return true;
  }
  if (row.group === 'lifecycle' && content && content.deleted !== undefined) {
    // A soft delete and its restore are the same row read in two directions.
    if (content && content.deleted === true) {
      await Lists.updateAsync(list._id, {
        $set: { deletedAt: content.deletedAt || new Date(), deletedBy: row.userId },
      });
    } else {
      await Lists.updateAsync(list._id, {
        $set: { deletedAt: null, deletedBy: null },
      });
    }
    return true;
  }
  return applyFieldContent(Lists, row, content);
}

async function applySwimlaneContent(row, content) {
  const swimlane = await ReactiveCache.getSwimlane(row.entityId);
  if (!swimlane) return false;
  if (row.group === 'position' && content && content.sort !== undefined) {
    await Swimlanes.updateAsync(swimlane._id, { $set: { sort: content.sort } });
    return true;
  }
  return applyFieldContent(Swimlanes, row, content);
}

const APPLIERS = {
  card: applyCardContent,
  list: applyListContent,
  swimlane: applySwimlaneContent,
  checklist: (row, content) => applyFieldContent(Checklists, row, content),
  checklistItem: (row, content) => applyFieldContent(ChecklistItems, row, content),
  comment: (row, content) => applyFieldContent(CardComments, row, content),
};

/*
 * Apply one row in a direction. 'undo' puts previousContent back; 'redo' puts
 * newContent back. That single rule covers every changeType, which is why undo
 * did not need a case per action: an 'added' row has previousContent null, so
 * undoing it means applying null - handled by each applier as "there is nothing
 * to put back", and by lifecycle rows as the delete flag itself.
 */
async function applyRow(row, direction) {
  const applier = APPLIERS[row.entityType];
  if (!applier) return false;
  const content = direction === 'undo' ? row.previousContent : row.newContent;
  if (content === null || content === undefined) return false;
  try {
    return await applier(row, content);
  } catch (error) {
    console.warn('changeHistory: could not apply a row:', error && error.message);
    return false;
  }
}

// ---- the read method ---------------------------------------------------------

const MAX_PAGE_SIZE = 200;

Meteor.methods({
  /*
   * One paginated, searchable read for every History view (History.md §6). The
   * card-group popup, the whole-card view, Member settings, Board settings and
   * the swimlane/list menus are all this method with a different scope.
   */
  async 'changeHistory.page'(request) {
    check(request, Match.ObjectIncluding({
      scope: Match.Optional(Match.OneOf(String, null)),
      scopeId: Match.Optional(Match.OneOf(String, null)),
      group: Match.Optional(Match.OneOf(String, null)),
      userId: Match.Optional(Match.OneOf(String, null)),
      entityType: Match.Optional(Match.OneOf(String, null)),
      entityId: Match.Optional(Match.OneOf(String, null)),
      search: Match.Optional(Match.OneOf(String, null)),
      page: Match.Optional(Number),
      pageSize: Match.Optional(Number),
    }));
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    let selector;
    try {
      selector = scopeSelector(request);
    } catch (error) {
      throw new Meteor.Error('bad-scope', error.message);
    }

    /*
     * Permission. A board scope is checked directly. Any other scope is
     * resolved to its board first, because "can you see this list's history"
     * is the same question as "can you see its board" - and a caller who names
     * a swimlane on a board they cannot see must not learn anything from the
     * answer, not even how many rows there are.
     */
    if (request.scope === 'board') {
      await requireBoardVisible(this.userId, request.scopeId);
    } else if (request.scope) {
      const owner = request.scope === 'card'
        ? await ReactiveCache.getCard(request.scopeId)
        : request.scope === 'list'
          ? await ReactiveCache.getList(request.scopeId)
          : await ReactiveCache.getSwimlane(request.scopeId);
      if (!owner) throw new Meteor.Error('not-found', 'No such scope.');
      await requireBoardVisible(this.userId, owner.boardId);
    } else if (request.userId && request.userId !== this.userId) {
      // The Member view of somebody else. Restrict it to the boards this caller
      // can see, so it can never become "show me everything that person did".
      const boardIds = await Boards.userBoardIds(this.userId);
      selector.boardId = { $in: boardIds };
    } else if (!request.userId) {
      throw new Meteor.Error('bad-scope', 'Ask for a scope or a user.');
    }

    const pageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, request.pageSize || 25));
    const search = request.search || '';

    // Search is applied in JS because it spans a blackbox field: the content of
    // a change has no fixed shape, so there is nothing to index and nothing a
    // Mongo regex could reliably look inside. The scope selector above has
    // already narrowed this to one card / list / swimlane / board.
    const all = await ChangeHistory.find(selector, { sort: { createdAt: -1 } }).fetchAsync();
    const filtered = search ? all.filter(row => matchesSearch(row, search)) : all;

    const info = pageInfo(filtered.length, request.page || 1, pageSize);
    const rows = filtered.slice(info.skip, info.skip + pageSize);

    // The left-column avatar list: who contributed to THIS scope, and how much.
    const counts = new Map();
    for (const row of filtered) {
      counts.set(row.userId, (counts.get(row.userId) || 0) + 1);
    }
    const contributors = [...counts.entries()]
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    return {
      rows,
      total: filtered.length,
      page: info.page,
      pageSize,
      contributors,
    };
  },

  /*
   * Restore selected rows (History.md §8). Multiple rows apply oldest to newest
   * under one batchId, so a multi-select restore undoes as the single logical
   * change the user made.
   */
  async 'changeHistory.restore'(selected) {
    check(selected, Match.OneOf(String, [String], Object));
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    const ids = selectionToIds(selected);
    if (ids.length === 0) return { restored: 0, skipped: 0 };

    const rows = await ChangeHistory.find({ _id: { $in: ids } }).fetchAsync();
    rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const batchId = `restore-${Date.now()}-${this.userId}`;
    let restored = 0;
    let skipped = 0;
    for (const row of rows) {
      await requireBoardWrite(this.userId, row.boardId);
      const applied = await applyRow(row, 'undo');
      if (!applied) { skipped++; continue; }
      restored++;

      // Two rows, per §8.3: one attributed to whoever made the change being
      // restored, one to whoever pressed Restore. Both carry restoredFromId, so
      // the provenance survives even after the row scrolls out of the page.
      const common = {
        boardId: row.boardId,
        swimlaneId: row.swimlaneId,
        listId: row.listId,
        cardId: row.cardId,
        entityType: row.entityType,
        entityId: row.entityId,
        group: row.group,
        changeType: 'restored',
        previousContent: row.newContent,
        newContent: row.previousContent,
        batchId,
        restoredFromId: row._id,
        restoredByUserId: this.userId,
      };
      await ChangeHistory.record({ ...common, userId: row.userId });
      if (row.userId !== this.userId) {
        await ChangeHistory.record({ ...common, userId: this.userId });
      }
    }
    return { restored, skipped };
  },

  /*
   * Undo / redo (History.md §7c). These REPLACE
   * userPositionHistory.undoLast/redoLast: same keyboard shortcuts, same
   * selection rule (the pure pickUndo/pickRedo), but over every recorded change
   * rather than positions only.
   */
  async 'changeHistory.undoLast'(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    await requireBoardWrite(this.userId, boardId);

    const candidates = await ChangeHistory.find(
      { userId: this.userId, boardId, undone: false },
      { sort: { createdAt: -1 }, limit: 50 },
    ).fetchAsync();
    const row = pickUndo(candidates);
    if (!row) return { undone: false };

    const applied = await applyRow(row, 'undo');
    if (!applied) return { undone: false, reason: 'not-applicable' };
    await ChangeHistory.updateAsync(row._id, {
      $set: { undone: true, undoneAt: new Date() },
    });
    return {
      undone: true,
      entityType: row.entityType,
      entityId: row.entityId,
      group: row.group,
    };
  },

  async 'changeHistory.redoLast'(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }
    await requireBoardWrite(this.userId, boardId);

    const candidates = await ChangeHistory.find(
      { userId: this.userId, boardId, undone: true },
      { sort: { undoneAt: -1 }, limit: 50 },
    ).fetchAsync();
    const row = pickRedo(candidates);
    if (!row) return { redone: false };

    const applied = await applyRow(row, 'redo');
    if (!applied) return { redone: false, reason: 'not-applicable' };
    await ChangeHistory.updateAsync(row._id, {
      $set: { undone: false, undoneAt: null },
    });
    return {
      redone: true,
      entityType: row.entityType,
      entityId: row.entityId,
      group: row.group,
    };
  },
});

export default ChangeHistory;
