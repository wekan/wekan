import { ReactiveCache } from '/imports/reactiveCache';
import { ALLOWED_COLORS } from '/config/const';
import PositionHistory from './positionHistory';

Lists = new Mongo.Collection('lists');

/**
 * A list (column) in the Wekan board.
 */
Lists.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the title of the list
       */
      type: String,
    },
    starred: {
      /**
       * if a list is stared
       * then we put it on the top
       */
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    archived: {
      /**
       * is the list archived
       */
      type: Boolean,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return false;
        }
      },
    },
    archivedAt: {
      /**
       * latest archiving date
       */
      type: Date,
      optional: true,
    },
    boardId: {
      /**
       * the board associated to this list
       */
      type: String,
    },
    swimlaneId: {
      /**
       * the swimlane associated to this list. Optional for backward compatibility
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    createdAt: {
      /**
       * creation date
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    sort: {
      /**
       * is the list sorted
       */
      type: Number,
      decimal: true,
      // XXX We should probably provide a default
      optional: true,
    },
    updatedAt: {
      /**
       * last update of the list
       */
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isUpdate || this.isUpsert || this.isInsert) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        // this is redundant with updatedAt
        /*if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }*/
        if (!this.isSet) {
          return new Date();
        }
      },
    },
    wipLimit: {
      /**
       * WIP object, see below
       */
      type: Object,
      optional: true,
    },
    'wipLimit.value': {
      /**
       * value of the WIP
       */
      type: Number,
      decimal: false,
      defaultValue: 1,
    },
    'wipLimit.enabled': {
      /**
       * is the WIP enabled
       */
      type: Boolean,
      defaultValue: false,
    },
    'wipLimit.soft': {
      /**
       * is the WIP a soft or hard requirement
       */
      type: Boolean,
      defaultValue: false,
    },
    color: {
      /**
       * the color of the list
       */
      type: String,
      optional: true,
      // silver is the default
      allowedValues: ALLOWED_COLORS,
    },
    type: {
      /**
       * The type of list
       */
      type: String,
      defaultValue: 'list',
    },
    width: {
      /**
       * The width of the list in pixels (100-1000).
       * Default width is 272 pixels.
       */
      type: Number,
      optional: true,
      defaultValue: 272,
      custom() {
        const w = this.value;
        if (w < 100 || w > 1000) {
          return 'widthOutOfRange';
        }
      },
    },
    // NOTE: collapsed state is per-user only, stored in user profile.collapsedLists
    // and localStorage for non-logged-in users
    // NOTE: width is per-board (shared with all users), stored in lists.width
  }),
);

Lists.allow({
  insert(userId, doc) {
    // ReadOnly and CommentOnly users cannot create lists
    return allowIsBoardMemberWithWriteAccess(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    // ReadOnly and CommentOnly users cannot edit lists
    return allowIsBoardMemberWithWriteAccess(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    // ReadOnly and CommentOnly users cannot delete lists
    return allowIsBoardMemberWithWriteAccess(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Lists.helpers({
  async copy(boardId, swimlaneId) {
    const oldId = this._id;
    const oldSwimlaneId = this.swimlaneId || null;
    this.boardId = boardId;
    this.swimlaneId = swimlaneId;

    let _id = null;
    const existingListWithSameName = await ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    if (existingListWithSameName) {
      _id = existingListWithSameName._id;
    } else {
      delete this._id;
      this.swimlaneId = swimlaneId; // Set the target swimlane for the copied list
      _id = await Lists.insertAsync(this);
    }

    // Copy all cards in list
    const cards = await ReactiveCache.getCards({
      swimlaneId: oldSwimlaneId,
      listId: oldId,
      archived: false,
    });
    for (const card of cards) {
      await card.copy(boardId, swimlaneId, _id);
    }

    return _id;
  },

  async move(boardId, swimlaneId) {
    const boardList = await ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    let listId;
    if (boardList) {
      listId = boardList._id;
      for (const card of await this.cards()) {
        await card.move(boardId, this._id, boardList._id);
      }
    } else {
      console.log('list.title:', this.title);
      console.log('boardList:', boardList);
      listId = await Lists.insertAsync({
        title: this.title,
        boardId,
        type: this.type,
        archived: false,
        wipLimit: this.wipLimit,
        swimlaneId: swimlaneId, // Set the target swimlane for the moved list
      });
    }

    for (const card of await this.cards(swimlaneId)) {
      await card.move(boardId, swimlaneId, listId);
    }
  },

  cards(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId) selector.swimlaneId = swimlaneId;
    const ret = ReactiveCache.getCards(Filter.mongoSelector(selector), { sort: ['sort'] });
    return ret;
  },

  cardsUnfiltered(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId) selector.swimlaneId = swimlaneId;
    const ret = ReactiveCache.getCards(selector, { sort: ['sort'] });
    return ret;
  },

  allCards() {
    const ret = ReactiveCache.getCards({ listId: this._id });
    return ret;
  },

  board() {
    return ReactiveCache.getBoard(this.boardId);
  },

  getWipLimit(option) {
    const list = ReactiveCache.getList(this._id);
    if (!list.wipLimit) {
      // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
      return 0;
    } else if (!option) {
      return list.wipLimit;
    } else {
      return list.wipLimit[option] ? list.wipLimit[option] : 0; // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
    }
  },

  colorClass() {
    if (this.color) return `list-header-${this.color}`;
    return '';
  },

  isTemplateList() {
    return this.type === 'template-list';
  },

  isStarred() {
    return this.starred === true;
  },

  isCollapsed() {
    if (Meteor.isClient) {
      const user = ReactiveCache.getCurrentUser();
      // Logged-in users: prefer profile/cookie-backed state
      if (user && user.getCollapsedListFromStorage) {
        const stored = user.getCollapsedListFromStorage(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
      // Public users: fallback to cookie if available
      if (!user && Users.getPublicCollapsedList) {
        const stored = Users.getPublicCollapsedList(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
    }
    return this.collapsed === true;
  },

  absoluteUrl() {
    const card = ReactiveCache.getCard({ listId: this._id });
    return card && card.absoluteUrl();
  },
  originRelativeUrl() {
    const card = ReactiveCache.getCard({ listId: this._id });
    return card && card.originRelativeUrl();
  },
  async remove() {
    return await Lists.removeAsync({ _id: this._id });
  },

  async rename(title) {
    // Basic client-side validation - server will handle full sanitization
    if (typeof title === 'string') {
      // Basic length check to prevent abuse
      const sanitizedTitle = title.length > 1000 ? title.substring(0, 1000) : title;
      return await Lists.updateAsync(this._id, { $set: { title: sanitizedTitle } });
    }
    return await Lists.updateAsync(this._id, { $set: { title } });
  },
  async star(enable = true) {
    return await Lists.updateAsync(this._id, { $set: { starred: !!enable } });
  },
  async collapse(enable = true) {
    return await Lists.updateAsync(this._id, { $set: { collapsed: !!enable } });
  },

  async archive() {
    if (this.isTemplateList()) {
      for (const card of await this.cards()) {
        await card.archive();
      }
    }
    return await Lists.updateAsync(this._id, { $set: { archived: true, archivedAt: new Date() } });
  },

  async restore() {
    if (this.isTemplateList()) {
      for (const card of await this.allCards()) {
        await card.restore();
      }
    }
    return await Lists.updateAsync(this._id, { $set: { archived: false } });
  },

  async toggleSoftLimit(toggle) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.soft': toggle } });
  },

  async toggleWipLimit(toggle) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.enabled': toggle } });
  },

  async setWipLimit(limit) {
    return await Lists.updateAsync(this._id, { $set: { 'wipLimit.value': limit } });
  },

  async setColor(newColor) {
    return await Lists.updateAsync(this._id, { $set: { color: newColor } });
  },
});

Lists.userArchivedLists = async userId => {
  return await ReactiveCache.getLists({
    boardId: { $in: await Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Lists.userArchivedListIds = async () => {
  const lists = await Lists.userArchivedLists();
  return lists.map(list => { return list._id; });
};

Lists.archivedLists = async () => {
  return await ReactiveCache.getLists({ archived: true });
};

Lists.archivedListIds = async () => {
  const lists = await Lists.archivedLists();
  return lists.map(list => {
    return list._id;
  });
};

Meteor.methods({
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
    // my lists
    const lists = await ReactiveCache.getLists(
      {
        boardId: { $in: await Boards.userBoardIds(this.userId) },
        archived: false,
      },
      {
        fields: { title: 1 },
      },
    );
    return _.uniq(lists.map(list => list.title)).sort();
  },

  async updateListSort(listId, boardId, updateData) {
    check(listId, String);
    check(boardId, String);
    check(updateData, Object);

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    if (Meteor.isServer) {
      if (typeof allowIsBoardMember === 'function') {
        if (!allowIsBoardMember(this.userId, board)) {
          throw new Meteor.Error('permission-denied', 'User does not have permission to modify this board');
        }
      }
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

if (Meteor.isServer) {
  Meteor.startup(async () => {
    await Lists._collection.rawCollection().createIndex({ modifiedAt: -1 });
    await Lists._collection.rawCollection().createIndex({ boardId: 1 });
    await Lists._collection.rawCollection().createIndex({ archivedAt: -1 });
  });
}

Lists.after.insert((userId, doc) => {
  Activities.insert({
    userId,
    type: 'list',
    activityType: 'createList',
    boardId: doc.boardId,
    listId: doc._id,
    // this preserves the name so that the activity can be useful after the
    // list is deleted
    title: doc.title,
  });

  // Track original position for new lists
  Meteor.setTimeout(() => {
    const list = Lists.findOne(doc._id);
    if (list) {
      list.trackOriginalPosition();
    }
  }, 100);
});

Lists.before.remove(async (userId, doc) => {
  const cards = await ReactiveCache.getCards({ listId: doc._id });
  if (cards) {
    for (const card of cards) {
      await Cards.removeAsync(card._id);
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

// Ensure we don't fetch previous doc in after.update hook
Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.after.update((userId, doc, fieldNames) => {
  if (fieldNames.includes('title')) {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'changedListTitle',
      listId: doc._id,
      boardId: doc.boardId,
      // this preserves the name so that the activity can be useful after the
      // list is deleted
      title: doc.title,
    });
  } else if (doc.archived) {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'archivedList',
      listId: doc._id,
      boardId: doc.boardId,
      // this preserves the name so that the activity can be useful after the
      // list is deleted
      title: doc.title,
    });
  } else if (fieldNames.includes('archived')) {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'restoredList',
      listId: doc._id,
      boardId: doc.boardId,
      // this preserves the name so that the activity can be useful after the
      // list is deleted
      title: doc.title,
    });
  }

  // When sort or swimlaneId change, trigger a pub/sub refresh marker
  if (fieldNames.includes('sort') || fieldNames.includes('swimlaneId')) {
    Lists.direct.update(
      { _id: doc._id },
      { $set: { _updatedAt: new Date() } },
    );
  }
});

//LISTS REST API
if (Meteor.isServer) {
  /**
   * @operation get_all_lists
   * @summary Get the list of Lists attached to a board
   *
   * @param {string} boardId the board ID
   * @return_type [{_id: string,
   *           title: string}]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/lists', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: (await ReactiveCache.getLists({ boardId: paramBoardId, archived: false })).map(
          function(doc) {
            return {
              _id: doc._id,
              title: doc.title,
            };
          },
        ),
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_list
   * @summary Get a List attached to a board
   *
   * @param {string} boardId the board ID
   * @param {string} listId the List ID
   * @return_type Lists
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: await ReactiveCache.getList({
          _id: paramListId,
          boardId: paramBoardId,
          archived: false,
        }),
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation new_list
   * @summary Add a List to a board
   *
   * @param {string} boardId the board ID
   * @param {string} title the title of the List
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/lists', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      const board = await ReactiveCache.getBoard(paramBoardId);
      const id = await Lists.insertAsync({
        title: req.body.title,
        boardId: paramBoardId,
        sort: board.lists().length,
        swimlaneId: req.body.swimlaneId || board.getDefaultSwimline()._id, // Use provided swimlaneId or default
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation edit_list
   * @summary Edit a List
   *
   * @description This updates a list on a board.
   * You can update the title, color, wipLimit, starred, and collapsed properties.
   *
   * @param {string} boardId the board ID
   * @param {string} listId the ID of the list to update
   * @param {string} [title] the new title of the list
   * @param {string} [color] the new color of the list
   * @param {Object} [wipLimit] the WIP limit configuration
   * @param {boolean} [starred] whether the list is starred
   * @param {boolean} [collapsed] whether the list is collapsed
   * @return_type {_id: string}
   */
  JsonRoutes.add('PUT', '/api/boards/:boardId/lists/:listId', async function(
    req,
    res,
  ) {
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
        JsonRoutes.sendResult(res, {
          code: 404,
          data: { error: 'List not found' },
        });
        return;
      }

      // Update title if provided
      if (req.body.title) {
        // Basic client-side validation - server will handle full sanitization
        const newTitle = req.body.title.length > 1000 ? req.body.title.substring(0, 1000) : req.body.title;

        if (process.env.DEBUG === 'true' && newTitle !== req.body.title) {
          console.warn('Sanitized list title input:', req.body.title, '->', newTitle);
        }

        Lists.direct.update(
          {
            _id: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              title: newTitle,
            },
          },
        );
        updated = true;
      }

      // Update color if provided
      if (req.body.color) {
        const newColor = req.body.color;
        Lists.direct.update(
          {
            _id: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              color: newColor,
            },
          },
        );
        updated = true;
      }

      // Update starred status if provided
      if (req.body.hasOwnProperty('starred')) {
        const newStarred = req.body.starred;
        Lists.direct.update(
          {
            _id: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              starred: newStarred,
            },
          },
        );
        updated = true;
      }

      // NOTE: collapsed state removed from board-level
      // It's per-user only - use user profile methods instead

      // Update wipLimit if provided
      if (req.body.wipLimit) {
        const newWipLimit = req.body.wipLimit;
        Lists.direct.update(
          {
            _id: paramListId,
            boardId: paramBoardId,
            archived: false,
          },
          {
            $set: {
              wipLimit: newWipLimit,
            },
          },
        );
        updated = true;
      }

      // Check if update is true or false
      if (!updated) {
        JsonRoutes.sendResult(res, {
          code: 404,
          data: {
            message: 'Error',
          },
        });
        return;
      }

      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramListId,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation delete_list
   * @summary Delete a List
   *
   * @description This **deletes** a list from a board.
   * The list is not put in the recycle bin.
   *
   * @param {string} boardId the board ID
   * @param {string} listId the ID of the list to remove
   * @return_type {_id: string}
   */
  JsonRoutes.add('DELETE', '/api/boards/:boardId/lists/:listId', function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      Lists.remove({ _id: paramListId, boardId: paramBoardId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramListId,
        },
      });
    } catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
}

// Position history tracking methods
Lists.helpers({
  /**
   * Track the original position of this list
   */
  trackOriginalPosition() {
    const existingHistory = PositionHistory.findOne({
      boardId: this.boardId,
      entityType: 'list',
      entityId: this._id,
    });

    if (!existingHistory) {
      PositionHistory.insert({
        boardId: this.boardId,
        entityType: 'list',
        entityId: this._id,
        originalPosition: {
          sort: this.sort,
          title: this.title,
        },
        originalSwimlaneId: this.swimlaneId || null,
        originalTitle: this.title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },

  /**
   * Get the original position history for this list
   */
  getOriginalPosition() {
    return PositionHistory.findOne({
      boardId: this.boardId,
      entityType: 'list',
      entityId: this._id,
    });
  },

  /**
   * Check if this list has moved from its original position
   */
  hasMovedFromOriginalPosition() {
    const history = this.getOriginalPosition();
    if (!history) return false;

    const currentSwimlaneId = this.swimlaneId || null;
    return history.originalPosition.sort !== this.sort ||
           history.originalSwimlaneId !== currentSwimlaneId;
  },

  /**
   * Get a description of the original position
   */
  getOriginalPositionDescription() {
    const history = this.getOriginalPosition();
    if (!history) return 'No original position data';

    const swimlaneInfo = history.originalSwimlaneId ?
      ` in swimlane ${history.originalSwimlaneId}` :
      ' in default swimlane';
    return `Original position: ${history.originalPosition.sort || 0}${swimlaneInfo}`;
  },

  /**
   * Get the effective swimlane ID (for backward compatibility)
   */
  getEffectiveSwimlaneId() {
    return this.swimlaneId || null;
  },
});

export default Lists;
