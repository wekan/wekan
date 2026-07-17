import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check, Match } from 'meteor/check';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists, { normalizeListColor } from '/models/lists';
import UserPositionHistory from '/models/userPositionHistory';
import { ensureIndex } from '/server/lib/mongoStartup';
import { computeSortForIndex } from '/server/lib/utils';
import { buildListPutUpdate } from '/models/lib/listApiUpdate';
import { Random } from 'meteor/random';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { softDeleteSet, restoreModifier, canPurge } from '/models/lib/softDelete';

const hasBoardWriteAccess = (userId, board) => {
  if (!userId || !board) {
    return false;
  }

  if (typeof allowIsBoardMemberWithWriteAccess === 'function') {
    return allowIsBoardMemberWithWriteAccess(userId, board);
  }

  return (
    board.hasMember(userId) &&
    !board.hasNoComments(userId) &&
    !board.hasCommentOnly(userId) &&
    !board.hasWorker(userId) &&
    !board.hasReadOnly(userId) &&
    !board.hasReadAssignedOnly(userId)
  );
};

// Soft delete (docs/Features/Undo/Undo.md): mark a list — and cascade-mark its live
// cards with the SAME deleteBatchId — instead of destroying them, and record a
// reversible 'delete' in position history. Restore/undo is all-or-nothing per batch.
// Shared by the `lists.softRemove` method and the REST DELETE endpoint. Returns the
// batchId. Best-effort history: a recording failure never fails the delete.
async function softRemoveList({ userId, list }) {
  const at = new Date();
  const batchId = Random.id();
  await Cards.updateAsync(
    { listId: list._id, boardId: list.boardId, deletedAt: null },
    { $set: softDeleteSet(userId, batchId, at) },
    { multi: true },
  );
  await Lists.updateAsync(list._id, { $set: softDeleteSet(userId, batchId, at) });
  try {
    await UserPositionHistory.trackChange({
      userId,
      boardId: list.boardId,
      entityType: 'list',
      entityId: list._id,
      actionType: 'delete',
      previousState: { swimlaneId: list.swimlaneId, sort: list.sort, boardId: list.boardId },
      newState: { deletedAt: at },
      batchId,
    });
  } catch (e) {
    // best-effort: never fail the delete because history recording failed
  }
  return batchId;
}

Meteor.methods({
  // Soft-delete a list (the ordinary "Delete list" action). Marks it + its cards
  // deleted; restorable from the Recycle Bin / undo. Idempotent.
  async 'lists.softRemove'(listId) {
    check(listId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const list = await Lists.findOneAsync(listId);
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }
    const board = await ReactiveCache.getBoard(list.boardId);
    if (!hasBoardWriteAccess(this.userId, board)) {
      throw new Meteor.Error('not-authorized', 'You cannot modify this board.');
    }
    if (list.deletedAt) {
      return { deleted: true, batchId: list.deleteBatchId }; // already soft-deleted
    }
    const batchId = await softRemoveList({ userId: this.userId, list });
    return { deleted: true, batchId };
  },

  // Restore a soft-deleted list and every card deleted alongside it (same batch).
  async 'lists.restore'(listId) {
    check(listId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const list = await Lists.findOneAsync(listId);
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }
    const board = await ReactiveCache.getBoard(list.boardId);
    if (!hasBoardWriteAccess(this.userId, board)) {
      throw new Meteor.Error('not-authorized', 'You cannot modify this board.');
    }
    const batchId = list.deleteBatchId;
    await Lists.updateAsync(list._id, restoreModifier());
    if (batchId) {
      await Cards.updateAsync({ deleteBatchId: batchId }, restoreModifier(), { multi: true });
    }
    try {
      await UserPositionHistory.trackChange({
        userId: this.userId,
        boardId: list.boardId,
        entityType: 'list',
        entityId: list._id,
        actionType: 'restore',
        previousState: { deletedAt: list.deletedAt },
        newState: { deletedAt: null },
        batchId,
      });
    } catch (e) {
      // best-effort
    }
    return { restored: true };
  },

  // PERMANENTLY delete a soft-deleted list + its batch cards. The ONLY physical
  // list delete in ordinary use — gated on Global Admin AND the Admin Panel /
  // Features / Delete "Enable permanent delete" flag (models/lib/softDelete canPurge).
  async 'lists.purge'(listId) {
    check(listId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await Meteor.users.findOneAsync(this.userId);
    const flags = getFeatureFlags();
    if (!canPurge(user, flags.enablePermanentDelete)) {
      throw new Meteor.Error('not-authorized', 'Permanent delete is disabled.');
    }
    const list = await Lists.findOneAsync(listId);
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }
    if (!list.deletedAt) {
      throw new Meteor.Error('not-deleted', 'Only soft-deleted lists can be permanently deleted.');
    }
    const batchId = list.deleteBatchId;
    if (batchId) {
      await Cards.removeAsync({ deleteBatchId: batchId });
    }
    await Lists.removeAsync({ _id: list._id });
    return { purged: true };
  },

  async createListAfter(params) {
    // Match.Optional (not a bare Match.OneOf) so a caller may OMIT these keys — a
    // missing object key throws "Match failed" for any non-Optional sub-pattern.
    // The #6465 inline composer sends no nextListId, which previously 400'd here.
    check(params, {
      title: String,
      boardId: String,
      swimlaneId: Match.Optional(Match.OneOf(String, null)),
      afterListId: Match.Optional(Match.OneOf(String, null)),
      nextListId: Match.Optional(Match.OneOf(String, null)),
      type: Match.Optional(String),
    });

    const {
      title,
      boardId,
      swimlaneId = null,
      afterListId = null,
      nextListId = null,
      type = 'list',
    } = params;

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    try {
      if (Authentication?.checkBoardWriteAccess) {
        await Authentication.checkBoardWriteAccess(this.userId, boardId);
      } else if (!hasBoardWriteAccess(this.userId, board)) {
        throw new Meteor.Error('not-authorized', 'Access denied');
      }
    } catch (error) {
      throw new Meteor.Error('not-authorized', 'Access denied');
    }

    const normalizeSwimlaneId = value => value || '';
    const getResolvedSwimlaneId = (list, fallback = '') => {
      if (!list) return normalizeSwimlaneId(fallback);
      if (typeof list.getEffectiveSwimlaneId === 'function') {
        return normalizeSwimlaneId(list.getEffectiveSwimlaneId() || fallback);
      }
      return normalizeSwimlaneId(list.swimlaneId || fallback);
    };

    const defaultSwimlane = board.getDefaultSwimlineAsync
      ? await board.getDefaultSwimlineAsync()
      : board.getDefaultSwimline
        ? board.getDefaultSwimline()
        : null;
    let targetSwimlaneId = normalizeSwimlaneId(swimlaneId || (defaultSwimlane && defaultSwimlane._id));

    let sort = 0;
    if (afterListId) {
      const selectedList = await ReactiveCache.getList({
        _id: afterListId,
        boardId,
        archived: false,
      });

      if (!selectedList) {
        throw new Meteor.Error('list-not-found', 'Selected list not found');
      }

      targetSwimlaneId = getResolvedSwimlaneId(selectedList, targetSwimlaneId);

      const swimlaneLists = (await ReactiveCache.getLists({
        boardId,
        archived: false,
      }))
        .filter(list => getResolvedSwimlaneId(list, targetSwimlaneId) === targetSwimlaneId)
        .sort((a, b) => a.sort - b.sort);

      let nextList = null;
      if (nextListId) {
        nextList = await ReactiveCache.getList({
          _id: nextListId,
          boardId,
          archived: false,
        });
        if (nextList) {
          const nextSwimlaneId = getResolvedSwimlaneId(nextList, targetSwimlaneId);
          if (nextSwimlaneId !== targetSwimlaneId) {
            nextList = null;
          }
        }
      }

      if (!nextList) {
        const selectedIndex = swimlaneLists.findIndex(list => list._id === selectedList._id);
        nextList = selectedIndex >= 0 ? swimlaneLists[selectedIndex + 1] : null;
      }

      if (
        nextList &&
        Number.isFinite(selectedList.sort) &&
        nextList.sort > selectedList.sort
      ) {
        sort = selectedList.sort + (nextList.sort - selectedList.sort) / 2;
      } else if (Number.isFinite(selectedList.sort)) {
        sort = selectedList.sort + 1;
      } else {
        const last = swimlaneLists[swimlaneLists.length - 1];
        sort = Number.isFinite(last?.sort) ? last.sort + 1 : 0;
      }
    } else {
      const swimlaneLists = (await ReactiveCache.getLists({
        boardId,
        archived: false,
      }))
        .filter(list => getResolvedSwimlaneId(list, targetSwimlaneId) === targetSwimlaneId)
        .sort((a, b) => a.sort - b.sort);

      const last = swimlaneLists[swimlaneLists.length - 1];
      sort = Number.isFinite(last?.sort) ? last.sort + 1 : 0;
    }

    return await Lists.insertAsync({
      title,
      boardId,
      sort,
      type,
      swimlaneId: targetSwimlaneId,
    });
  },

  async copyList(listId, boardId, swimlaneId, title, neighborListId, position) {
    check(listId, String);
    check(boardId, String);
    check(swimlaneId, String);
    check(title, String);
    check(neighborListId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf(String, null, undefined));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }

    const sourceBoard = await Boards.findOneAsync(list.boardId);
    if (!sourceBoard || !sourceBoard.hasMember(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Not a member of the source board.');
    }

    const targetBoard = await ReactiveCache.getBoard(boardId);
    if (!targetBoard) {
      throw new Meteor.Error('board-not-found', 'Target board not found');
    }

    if (!hasBoardWriteAccess(this.userId, targetBoard)) {
      throw new Meteor.Error('not-authorized', 'Not a member of the target board.');
    }

    let sort = (await ReactiveCache.getLists({ boardId, archived: false })).length;
    if (neighborListId) {
      const neighborList = await ReactiveCache.getList({ _id: neighborListId, boardId, archived: false });
      if (neighborList && Number.isFinite(neighborList.sort)) {
        const allLists = (await ReactiveCache.getLists({ boardId, swimlaneId, archived: false }))
          .sort((a, b) => a.sort - b.sort);
        const neighborIndex = allLists.findIndex(l => l._id === neighborListId);
        if (position === 'left') {
          const prev = allLists[neighborIndex - 1];
          sort = prev && Number.isFinite(prev.sort)
            ? (prev.sort + neighborList.sort) / 2
            : neighborList.sort - 1;
        } else {
          const next = allLists[neighborIndex + 1];
          sort = next && Number.isFinite(next.sort)
            ? (neighborList.sort + next.sort) / 2
            : neighborList.sort + 1;
        }
      }
    }

    const newListId = await Lists.insertAsync({
      title: title || list.title,
      boardId,
      swimlaneId,
      type: list.type,
      archived: false,
      wipLimit: list.wipLimit,
      sort,
    });

    const cards = await ReactiveCache.getCards({ listId: list._id, archived: false });
    for (const card of cards) {
      await card.copy(boardId, swimlaneId, newListId);
    }

    return newListId;
  },

  async moveList(listId, boardId, swimlaneId, neighborListId, position, title) {
    check(listId, String);
    check(boardId, String);
    check(swimlaneId, String);
    check(neighborListId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf(String, null, undefined));
    check(title, Match.OneOf(String, null, undefined));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }

    const sourceBoard = await Boards.findOneAsync(list.boardId);
    if (!sourceBoard || !sourceBoard.hasMember(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Not a member of the source board.');
    }

    const desiredTitle = typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : list.title;

    const targetBoard = await ReactiveCache.getBoard(boardId);
    if (!targetBoard) {
      throw new Meteor.Error('board-not-found', 'Target board not found');
    }

    if (!hasBoardWriteAccess(this.userId, targetBoard)) {
      throw new Meteor.Error('not-authorized', 'Not a member of the target board.');
    }

    list.title = desiredTitle;
    await list.move(boardId, swimlaneId);

    if (neighborListId) {
      const movedList = await ReactiveCache.getList({ boardId, title: desiredTitle, archived: false });
      const neighborList = await ReactiveCache.getList({ _id: neighborListId, boardId, archived: false });
      if (movedList && neighborList && Number.isFinite(neighborList.sort)) {
        const allLists = (await ReactiveCache.getLists({ boardId, swimlaneId, archived: false }))
          .filter(l => l._id !== movedList._id)
          .sort((a, b) => a.sort - b.sort);
        const neighborIndex = allLists.findIndex(l => l._id === neighborListId);
        let newSort;
        if (position === 'left') {
          const prev = allLists[neighborIndex - 1];
          newSort = prev && Number.isFinite(prev.sort)
            ? (prev.sort + neighborList.sort) / 2
            : neighborList.sort - 1;
        } else {
          const next = allLists[neighborIndex + 1];
          newSort = next && Number.isFinite(next.sort)
            ? (neighborList.sort + next.sort) / 2
            : neighborList.sort + 1;
        }
        await Lists.updateAsync(movedList._id, { $set: { sort: newSort } });
      }
    }

    await list.archive();
  },

  async applyWipLimit(listId, limit) {
    check(listId, String);
    check(limit, Number);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }

    const board = await ReactiveCache.getBoard(list.boardId);
    if (!board || !board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to modify WIP limits.');
    }

    if (limit === 0) {
      limit = 1;
    }
    await list.setWipLimit(limit);
  },

  async enableWipLimit(listId) {
    check(listId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }

    const board = await ReactiveCache.getBoard(list.boardId);
    if (!board || !board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to modify WIP limits.');
    }

    if ((await list.getWipLimit('value')) === 0) {
      await list.setWipLimit(1);
    }
    await list.toggleWipLimit(!(await list.getWipLimit('enabled')));
  },

  async enableSoftLimit(listId) {
    check(listId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }

    const board = await ReactiveCache.getBoard(list.boardId);
    if (!board || !board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'You must be a board admin to modify WIP limits.');
    }

    await list.toggleSoftLimit(!(await list.getWipLimit('soft')));
  },

  async myLists() {
    const lists = await ReactiveCache.getLists(
      {
        boardId: { $in: await Boards.userBoardIds(this.userId) },
        archived: false,
      },
      { fields: { title: 1 } },
    );
    return [...new Set(lists.map(list => list.title))].sort();
  },

  async updateListSort(listId, boardId, updateData) {
    check(listId, String);
    check(boardId, String);
    check(updateData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    // Reordering / re-assigning lists is a write operation, so require board
    // write access. (The previous guard referenced an unimported
    // `allowIsBoardMember`, so `typeof ... === 'function'` was always false and
    // the check never ran — any caller could mutate any board's lists by ID.)
    if (!hasBoardWriteAccess(this.userId, board)) {
      throw new Meteor.Error('permission-denied', 'User does not have permission to modify this board');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
    }
    if (list.boardId !== boardId) {
      throw new Meteor.Error('permission-denied', 'List does not belong to this board');
    }

    const validUpdateFields = ['sort', 'swimlaneId', 'updatedAt', 'modifiedAt'];
    Object.keys(updateData).forEach(field => {
      if (!validUpdateFields.includes(field)) {
        throw new Meteor.Error('invalid-field', `Field ${field} is not allowed`);
      }
    });

    if (updateData.swimlaneId) {
      const swimlane = await ReactiveCache.getSwimlane(updateData.swimlaneId);
      if (!swimlane || swimlane.boardId !== boardId) {
        throw new Meteor.Error('invalid-swimlane', 'Invalid swimlane for this board');
      }
    }

    // #6478: capture the pre-move position so the change is UNDOABLE. A list
    // dragged to another swimlane (especially an accidental one on mobile) can be
    // reverted from the position history, like card moves already are.
    const previousState = {
      sort: list.sort,
      swimlaneId: list.swimlaneId,
      boardId: list.boardId,
    };

    await Lists.updateAsync(
      listId,
      {
        $set: {
          ...updateData,
          modifiedAt: new Date(),
        },
      },
    );

    // #6478: record the list move in the undo/redo position history (best-effort;
    // never fail the reorder if history recording throws).
    if (typeof UserPositionHistory !== 'undefined') {
      try {
        await UserPositionHistory.trackChange({
          userId: this.userId,
          boardId,
          entityType: 'list',
          entityId: listId,
          actionType: 'move',
          previousState,
          newState: {
            boardId,
            swimlaneId: updateData.swimlaneId !== undefined ? updateData.swimlaneId : list.swimlaneId,
            sort: updateData.sort !== undefined ? updateData.sort : list.sort,
          },
        });
      } catch (e) {
        console.warn('Failed to track list move in history:', e);
      }
    }

    return {
      success: true,
      listId,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString(),
    };
  },
});

Meteor.startup(async () => {
  await ensureIndex(Lists, { modifiedAt: -1 });
  await ensureIndex(Lists, { updatedAt: 1, deleted: 1 });
  await ensureIndex(Lists, { boardId: 1 });
  await ensureIndex(Lists, { archivedAt: -1 });
});

Lists.after.insert(async (userId, doc) => {
  await Activities.insertAsync({
    userId,
    type: 'list',
    activityType: 'createList',
    boardId: doc.boardId,
    listId: doc._id,
    title: doc.title,
  });

  Meteor.setTimeout(() => {
    Lists.findOneAsync(doc._id).then(list => {
      if (list) {
        Promise.resolve(list.trackOriginalPosition()).catch(error => {
          console.error('Failed to track original list position:', error);
        });
      }
    }).catch(error => {
      console.error('Failed to load list for original position tracking:', error);
    });
  }, 100);
});

Lists.before.remove(async (userId, doc) => {
  const cards = await ReactiveCache.getCards({ listId: doc._id });
  if (cards) {
    for (const card of cards) {
      if (!doc.archived) {
        await Cards.removeAsync(card._id);
        continue;
      }

      const listArchivedAt = doc.archivedAt;
      const cardArchivedAt = card.archivedAt;
      const shouldDeleteCard =
        !listArchivedAt ||
        !card.archived ||
        !cardArchivedAt ||
        cardArchivedAt >= listArchivedAt;

      if (shouldDeleteCard) {
        await Cards.removeAsync(card._id);
      }
    }
  }
  await Activities.insertAsync({
    userId,
    type: 'list',
    activityType: 'removeList',
    boardId: doc.boardId,
    listId: doc._id,
    title: doc.title,
  });
});

Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.after.update(async (userId, doc, fieldNames) => {
  if (fieldNames.includes('title')) {
    await Activities.insertAsync({
      userId,
      type: 'list',
      activityType: 'changedListTitle',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  } else if (doc.archived) {
    await Activities.insertAsync({
      userId,
      type: 'list',
      activityType: 'archivedList',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  } else if (fieldNames.includes('archived')) {
    await Activities.insertAsync({
      userId,
      type: 'list',
      activityType: 'restoredList',
      listId: doc._id,
      boardId: doc.boardId,
      title: doc.title,
    });
  }

  if (fieldNames.includes('sort') || fieldNames.includes('swimlaneId')) {
    await Lists.direct.updateAsync(
      { _id: doc._id },
      { $set: { _updatedAt: new Date() } },
    );
  }
});

WebApp.handlers.get('/api/boards/:boardId/lists', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);

    sendJsonResult(res, {
      code: 200,
      data: (await ReactiveCache.getLists({ boardId: paramBoardId, archived: false })).map(doc => ({
        _id: doc._id,
        title: doc.title,
      })),
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.get('/api/boards/:boardId/lists/:listId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    sendJsonResult(res, {
      code: 200,
      data: await ReactiveCache.getList({
        _id: paramListId,
        boardId: paramBoardId,
        archived: false,
      }),
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/boards/:boardId/lists', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const board = await ReactiveCache.getBoard(paramBoardId);
    const defaultSwimlane = board.getDefaultSwimlineAsync
      ? await board.getDefaultSwimlineAsync()
      : board.getDefaultSwimline();
    const id = await Lists.insertAsync({
      title: req.body.title,
      boardId: paramBoardId,
      sort: board.lists().length,
      swimlaneId: req.body.swimlaneId || defaultSwimlane?._id,
    });
    sendJsonResult(res, { code: 200, data: { _id: id } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.put('/api/boards/:boardId/lists/:listId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    let updated = false;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const list = await ReactiveCache.getList({
      _id: paramListId,
      boardId: paramBoardId,
      archived: false,
    });

    if (!list) {
      sendJsonResult(res, { code: 404, data: { error: 'List not found' } });
      return;
    }

    // #5396: edit a list's title/color (and starred/wipLimit) via the REST API,
    // like cards can be edited. The color is validated with normalizeListColor
    // (named palette color OR custom '#rrggbb' hex); a bad color is rejected
    // with a clear 4xx rather than being silently stored as None. The pure
    // field/validation logic lives in models/lib/listApiUpdate.js so it is unit
    // testable without Meteor.
    const { set, error } = buildListPutUpdate(req.body, normalizeListColor);

    if (error) {
      sendJsonResult(res, { code: 400, data: { error } });
      return;
    }

    if (Object.keys(set).length > 0) {
      await Lists.direct.updateAsync(
        { _id: paramListId, boardId: paramBoardId, archived: false },
        { $set: set },
      );
      updated = true;
    }

    if (!updated) {
      sendJsonResult(res, { code: 404, data: { message: 'Error' } });
      return;
    }

    sendJsonResult(res, { code: 200, data: { _id: paramListId } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.delete('/api/boards/:boardId/lists/:listId', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    // Soft delete (docs/Features/Undo/Undo.md): mark deleted + cascade, don't destroy.
    const list = await Lists.findOneAsync({ _id: paramListId, boardId: paramBoardId });
    if (list && !list.deletedAt) {
      await softRemoveList({ userId: req.userId, list });
    }
    sendJsonResult(res, { code: 200, data: { _id: paramListId } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

// Reposition a list at a 0-based `position` counted from the left of the
// destination board, by setting its sort between siblings.
async function repositionList(listId, toBoardId, position) {
  if (position === undefined || position === null) {
    return;
  }
  const siblings = await ReactiveCache.getLists(
    { boardId: toBoardId, archived: false, _id: { $ne: listId } },
    { sort: { sort: 1 } },
  );
  const newSort = computeSortForIndex(siblings, Number(position));
  await Lists.direct.updateAsync({ _id: listId }, { $set: { sort: newSort } });
}

// Copy a list (deep copy: its cards) to the same or a different board, at a
// 0-based `position` from the left. Body: { toBoardId?, toSwimlaneId?, position? }
WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/copy',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const toBoardId = req.body.toBoardId || paramBoardId;
    await Authentication.checkBoardWriteAccess(req.userId, toBoardId);
    const list = await ReactiveCache.getList({ _id: paramListId, boardId: paramBoardId });
    if (!list) {
      sendJsonResult(res, { code: 404, data: { error: 'List not found' } });
      return;
    }
    const newId = await list.copy(toBoardId, req.body.toSwimlaneId);
    await repositionList(newId, toBoardId, req.body.position);
    sendJsonResult(res, { code: 200, data: { _id: newId } });
  },
);

// Move a list (with its cards) to the same or a different board, at a 0-based
// `position` from the left. Body: { toBoardId?, toSwimlaneId?, position? }
// NOTE: List.move merges into an existing same-titled list on the destination
// board when one exists; otherwise it recreates the list there.
WebApp.handlers.post(
  '/api/boards/:boardId/lists/:listId/move',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramListId = req.params.listId;
    await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    const toBoardId = req.body.toBoardId || paramBoardId;
    await Authentication.checkBoardWriteAccess(req.userId, toBoardId);
    const list = await ReactiveCache.getList({ _id: paramListId, boardId: paramBoardId });
    if (!list) {
      sendJsonResult(res, { code: 404, data: { error: 'List not found' } });
      return;
    }
    if (toBoardId === paramBoardId) {
      // Same-board move is purely a reposition (and optional swimlane change).
      if (req.body.toSwimlaneId) {
        await Lists.direct.updateAsync(
          { _id: paramListId },
          { $set: { swimlaneId: req.body.toSwimlaneId } },
        );
      }
      await repositionList(paramListId, toBoardId, req.body.position);
      sendJsonResult(res, { code: 200, data: { _id: paramListId } });
      return;
    }
    await list.move(toBoardId, req.body.toSwimlaneId);
    sendJsonResult(res, { code: 200, data: { _id: paramListId } });
  },
);
