import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { check, Match } from 'meteor/check';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';

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

Meteor.methods({
  async createListAfter(params) {
    check(params, {
      title: String,
      boardId: String,
      swimlaneId: Match.OneOf(String, null, undefined),
      afterListId: Match.OneOf(String, null, undefined),
      nextListId: Match.OneOf(String, null, undefined),
      type: Match.Maybe(String),
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
        Number.isFinite(nextList.sort) &&
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

    const targetBoard = await ReactiveCache.getBoard(boardId);
    if (!targetBoard) {
      throw new Meteor.Error('board-not-found', 'Target board not found');
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
    const desiredTitle = typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : list.title;

    const targetBoard = await ReactiveCache.getBoard(boardId);
    if (!targetBoard) {
      throw new Meteor.Error('board-not-found', 'Target board not found');
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

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    if (typeof allowIsBoardMember === 'function' && !allowIsBoardMember(this.userId, board)) {
      throw new Meteor.Error('permission-denied', 'User does not have permission to modify this board');
    }

    const list = await ReactiveCache.getList(listId);
    if (!list) {
      throw new Meteor.Error('list-not-found', 'List not found');
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

    await Lists.updateAsync(
      listId,
      {
        $set: {
          ...updateData,
          modifiedAt: new Date(),
        },
      },
    );

    return {
      success: true,
      listId,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString(),
    };
  },
});

Meteor.startup(async () => {
  await Lists._collection.rawCollection().createIndex({ modifiedAt: -1 });
  await Lists._collection.rawCollection().createIndex({ boardId: 1 });
  await Lists._collection.rawCollection().createIndex({ archivedAt: -1 });
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
    Authentication.checkBoardAccess(req.userId, paramBoardId);

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
    Authentication.checkBoardAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

    const list = await ReactiveCache.getList({
      _id: paramListId,
      boardId: paramBoardId,
      archived: false,
    });

    if (!list) {
      sendJsonResult(res, { code: 404, data: { error: 'List not found' } });
      return;
    }

    if (req.body.title) {
      const newTitle = req.body.title.length > 1000 ? req.body.title.substring(0, 1000) : req.body.title;
      await Lists.direct.updateAsync(
        { _id: paramListId, boardId: paramBoardId, archived: false },
        { $set: { title: newTitle } },
      );
      updated = true;
    }

    if (req.body.color) {
      await Lists.direct.updateAsync(
        { _id: paramListId, boardId: paramBoardId, archived: false },
        { $set: { color: req.body.color } },
      );
      updated = true;
    }

    if (req.body.hasOwnProperty('starred')) {
      await Lists.direct.updateAsync(
        { _id: paramListId, boardId: paramBoardId, archived: false },
        { $set: { starred: req.body.starred } },
      );
      updated = true;
    }

    if (req.body.wipLimit) {
      await Lists.direct.updateAsync(
        { _id: paramListId, boardId: paramBoardId, archived: false },
        { $set: { wipLimit: req.body.wipLimit } },
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
    Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
    await Lists.removeAsync({ _id: paramListId, boardId: paramBoardId });
    sendJsonResult(res, { code: 200, data: { _id: paramListId } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
