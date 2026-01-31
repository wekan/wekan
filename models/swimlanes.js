import { ReactiveCache } from '/imports/reactiveCache';
import { ALLOWED_COLORS } from '/config/const';
import PositionHistory from './positionHistory';

Swimlanes = new Mongo.Collection('swimlanes');

/**
 * A swimlane is an line in the kaban board.
 */
Swimlanes.attachSchema(
  new SimpleSchema({
    title: {
      /**
       * the title of the swimlane
       */
      type: String,
    },
    archived: {
      /**
       * is the swimlane archived?
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
       * latest archiving date of the swimlane
       */
      type: Date,
      optional: true,
    },
    boardId: {
      /**
       * the ID of the board the swimlane is attached to
       */
      type: String,
    },
    createdAt: {
      /**
       * creation date of the swimlane
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
       * the sort value of the swimlane
       */
      type: Number,
      decimal: true,
      // XXX We should probably provide a default
      optional: true,
    },
    color: {
      /**
       * the color of the swimlane
       */
      type: String,
      optional: true,
      // silver is the default
      allowedValues: ALLOWED_COLORS,
    },
    updatedAt: {
      /**
       * when was the swimlane last edited
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
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    type: {
      /**
       * The type of swimlane
       */
      type: String,
      defaultValue: 'swimlane',
    },
    height: {
      /**
       * The height of the swimlane in pixels.
       * -1 = auto-height (default)
       * 50-2000 = fixed height in pixels
       */
      type: Number,
      optional: true,
      defaultValue: -1,
      custom() {
        const h = this.value;
        if (h !== -1 && (h < 50 || h > 2000)) {
          return 'heightOutOfRange';
        }
      },
    },
    // NOTE: collapsed state is per-user only, stored in user profile.collapsedSwimlanes
    // and localStorage for non-logged-in users
    // NOTE: height is per-board (shared with all users), stored in swimlanes.height
  }),
);

Swimlanes.allow({
  async insert(userId, doc) {
    // ReadOnly and CommentOnly users cannot create swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await ReactiveCache.getBoard(doc.boardId));
  },
  async update(userId, doc) {
    // ReadOnly and CommentOnly users cannot edit swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await ReactiveCache.getBoard(doc.boardId));
  },
  async remove(userId, doc) {
    // ReadOnly and CommentOnly users cannot delete swimlanes
    return allowIsBoardMemberWithWriteAccess(userId, await ReactiveCache.getBoard(doc.boardId));
  },
  fetch: ['boardId'],
});

Swimlanes.helpers({
  async copy(boardId) {
    const oldId = this._id;
    const oldBoardId = this.boardId;
    this.boardId = boardId;
    delete this._id;
    const _id = await Swimlanes.insertAsync(this);

    const query = {
      swimlaneId: { $in: [oldId, ''] },
      archived: false,
    };
    if (oldBoardId) {
      query.boardId = oldBoardId;
    }

    // Copy all lists in swimlane
    const lists = await ReactiveCache.getLists(query);
    for (const list of lists) {
      list.type = 'list';
      list.swimlaneId = oldId;
      list.boardId = boardId;
      await list.copy(boardId, _id);
    }
  },

  async move(toBoardId) {
    for (const list of await this.lists()) {
      const toList = await ReactiveCache.getList({
        boardId: toBoardId,
        title: list.title,
        archived: false,
      });

      let toListId;
      if (toList) {
        toListId = toList._id;
      } else {
        toListId = await Lists.insertAsync({
          title: list.title,
          boardId: toBoardId,
          type: list.type,
          archived: false,
          wipLimit: list.wipLimit,
          swimlaneId: this._id,
        });
      }

      const cards = await ReactiveCache.getCards({
        listId: list._id,
        swimlaneId: this._id,
      });
      for (const card of cards) {
        await card.move(toBoardId, this._id, toListId);
      }
    }

    await Swimlanes.updateAsync(this._id, {
      $set: {
        boardId: toBoardId,
      },
    });

    // make sure there is a default swimlane
    (await this.board()).getDefaultSwimline();
  },

  async cards() {
    const ret = await ReactiveCache.getCards(
      Filter.mongoSelector({
        swimlaneId: this._id,
        archived: false,
      }),
      { sort: ['sort'] },
    );
    return ret;
  },

  async lists() {
    return await this.draggableLists();
  },
  async newestLists() {
    // Revert to shared lists across swimlanes: filter by board only
    return await ReactiveCache.getLists(
      {
        boardId: this.boardId,
        archived: false,
      },
      { sort: { modifiedAt: -1 } },
    );
  },
  async draggableLists() {
    // Revert to shared lists across swimlanes: filter by board only
    return await ReactiveCache.getLists(
      {
        boardId: this.boardId,
        //archived: false,
      },
      { sort: ['sort'] },
    );
  },

  async myLists() {
    // Return per-swimlane lists: provide lists specific to this swimlane
    return await ReactiveCache.getLists(
      {
        boardId: this.boardId,
        swimlaneId: this._id,
        archived: false
      },
      { sort: ['sort'] },
    );
  },

  async allCards() {
    const ret = await ReactiveCache.getCards({ swimlaneId: this._id });
    return ret;
  },

  async isCollapsed() {
    if (Meteor.isClient) {
      const user = await ReactiveCache.getCurrentUser();
      if (user && user.getCollapsedSwimlaneFromStorage) {
        const stored = user.getCollapsedSwimlaneFromStorage(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
      if (!user && Users.getPublicCollapsedSwimlane) {
        const stored = Users.getPublicCollapsedSwimlane(this.boardId, this._id);
        if (typeof stored === 'boolean') {
          return stored;
        }
      }
    }
    return this.collapsed === true;
  },

  async board() {
    return await ReactiveCache.getBoard(this.boardId);
  },

  colorClass() {
    if (this.color) return `swimlane-${this.color}`;
    return '';
  },

  isTemplateSwimlane() {
    return this.type === 'template-swimlane';
  },

  isTemplateContainer() {
    return this.type === 'template-container';
  },

  async isListTemplatesSwimlane() {
    const user = await ReactiveCache.getCurrentUser();
    return (user.profile || {}).listTemplatesSwimlaneId === this._id;
  },

  async isCardTemplatesSwimlane() {
    const user = await ReactiveCache.getCurrentUser();
    return (user.profile || {}).cardTemplatesSwimlaneId === this._id;
  },

  async isBoardTemplatesSwimlane() {
    const user = await ReactiveCache.getCurrentUser();
    return (user.profile || {}).boardTemplatesSwimlaneId === this._id;
  },

  async remove() {
    return await Swimlanes.removeAsync({ _id: this._id });
  },

  async rename(title) {
    return await Swimlanes.updateAsync(this._id, { $set: { title } });
  },

  // NOTE: collapse() removed - collapsed state is per-user only
  // Use user.setCollapsedSwimlane(boardId, swimlaneId, collapsed) instead

  async archive() {
    if (this.isTemplateSwimlane()) {
      for (const list of await this.myLists()) {
        await list.archive();
      }
    }
    return await Swimlanes.updateAsync(this._id, { $set: { archived: true, archivedAt: new Date() } });
  },

  async restore() {
    if (this.isTemplateSwimlane()) {
      for (const list of await this.myLists()) {
        await list.restore();
      }
    }
    return await Swimlanes.updateAsync(this._id, { $set: { archived: false } });
  },

  async setColor(newColor) {
    return await Swimlanes.updateAsync(this._id, { $set: { color: newColor } });
  },
});

Swimlanes.userArchivedSwimlanes = async userId => {
  return await ReactiveCache.getSwimlanes({
    boardId: { $in: await Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Swimlanes.userArchivedSwimlaneIds = async () => {
  const swimlanes = await Swimlanes.userArchivedSwimlanes();
  return swimlanes.map(swim => { return swim._id; });
};

Swimlanes.archivedSwimlanes = async () => {
  return await ReactiveCache.getSwimlanes({ archived: true });
};

Swimlanes.archivedSwimlaneIds = async () => {
  const swimlanes = await Swimlanes.archivedSwimlanes();
  return swimlanes.map(swim => {
    return swim._id;
  });
};

Swimlanes.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(async () => {
    await Swimlanes._collection.createIndexAsync({ modifiedAt: -1 });
    await Swimlanes._collection.createIndexAsync({ boardId: 1 });
  });

  Swimlanes.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'swimlane',
      activityType: 'createSwimlane',
      boardId: doc.boardId,
      swimlaneId: doc._id,
    });

    // Track original position for new swimlanes
    Meteor.setTimeout(() => {
      const swimlane = Swimlanes.findOne(doc._id);
      if (swimlane) {
        swimlane.trackOriginalPosition();
      }
    }, 100);
  });

  Swimlanes.before.remove(async function(userId, doc) {
    const lists = await ReactiveCache.getLists(
      {
        boardId: doc.boardId,
        swimlaneId: { $in: [doc._id, ''] },
        archived: false,
      },
      { sort: ['sort'] },
    );

    if (lists.length < 2) {
      for (const list of lists) {
        await list.remove();
      }
    } else {
      await Cards.removeAsync({ swimlaneId: doc._id });
    }

    await Activities.insertAsync({
      userId,
      type: 'swimlane',
      activityType: 'removeSwimlane',
      boardId: doc.boardId,
      swimlaneId: doc._id,
      title: doc.title,
    });
  });

  Swimlanes.after.update((userId, doc, fieldNames) => {
    if (fieldNames.includes('title')) {
      Activities.insert({
        userId,
        type: 'swimlane',
        activityType: 'changedSwimlaneTitle',
        listId: doc._id,
        boardId: doc.boardId,
        // this preserves the name so that the activity can be useful after the
        // list is deleted
        title: doc.title,
      });
    } else if (doc.archived)  {
      Activities.insert({
        userId,
        type: 'swimlane',
        activityType: 'archivedSwimlane',
        listId: doc._id,
        boardId: doc.boardId,
        // this preserves the name so that the activity can be useful after the
        // list is deleted
        title: doc.title,
      });
    } else if (fieldNames.includes('archived'))  {
      Activities.insert({
        userId,
        type: 'swimlane',
        activityType: 'restoredSwimlane',
        listId: doc._id,
        boardId: doc.boardId,
        // this preserves the name so that the activity can be useful after the
        // list is deleted
        title: doc.title,
      });
    }
  });
}

//SWIMLANE REST API
if (Meteor.isServer) {
  /**
   * @operation get_all_swimlanes
   *
   * @summary Get the list of swimlanes attached to a board
   *
   * @param {string} boardId the ID of the board
   * @return_type [{_id: string,
   *                title: string}]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      const swimlanes = await ReactiveCache.getSwimlanes({ boardId: paramBoardId, archived: false });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: swimlanes.map(
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
   * @operation get_swimlane
   *
   * @summary Get a swimlane
   *
   * @param {string} boardId the ID of the board
   * @param {string} swimlaneId the ID of the swimlane
   * @return_type Swimlanes
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes/:swimlaneId', async function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: await ReactiveCache.getSwimlane({
          _id: paramSwimlaneId,
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
   * @operation new_swimlane
   *
   * @summary Add a swimlane to a board
   *
   * @param {string} boardId the ID of the board
   * @param {string} title the new title of the swimlane
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/swimlanes', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardWriteAccess(req.userId, paramBoardId);

      const board = await ReactiveCache.getBoard(paramBoardId);
      const id = await Swimlanes.insertAsync({
        title: req.body.title,
        boardId: paramBoardId,
        sort: board.swimlanes().length,
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
   * @operation edit_swimlane
   *
   * @summary Edit the title of a swimlane
   *
   * @param {string} boardId the ID of the board
   * @param {string} swimlaneId the ID of the swimlane to edit
   * @param {string} title the new title of the swimlane
   * @return_type {_id: string}
   */
  JsonRoutes.add('PUT', '/api/boards/:boardId/swimlanes/:swimlaneId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      const board = await ReactiveCache.getBoard(paramBoardId);
      const swimlane = await ReactiveCache.getSwimlane({
        _id: paramSwimlaneId,
        boardId: paramBoardId,
      });
      if (!swimlane) {
        throw new Meteor.Error('not-found', 'Swimlane not found');
      }
      Swimlanes.direct.update(
        { _id: paramSwimlaneId },
        { $set: { title: req.body.title } }
      );
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramSwimlaneId,
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
   * @operation delete_swimlane
   *
   * @summary Delete a swimlane
   *
   * @description The swimlane will be deleted, not moved to the recycle bin
   *
   * @param {string} boardId the ID of the board
   * @param {string} swimlaneId the ID of the swimlane
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/swimlanes/:swimlaneId',
    function(req, res) {
      try {
        const paramBoardId = req.params.boardId;
        const paramSwimlaneId = req.params.swimlaneId;
        Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
        Swimlanes.remove({ _id: paramSwimlaneId, boardId: paramBoardId });
        JsonRoutes.sendResult(res, {
          code: 200,
          data: {
            _id: paramSwimlaneId,
          },
        });
      } catch (error) {
        JsonRoutes.sendResult(res, {
          code: 200,
          data: error,
        });
      }
    },
  );
}

// Position history tracking methods
Swimlanes.helpers({
  /**
   * Track the original position of this swimlane
   */
  trackOriginalPosition() {
    const existingHistory = PositionHistory.findOne({
      boardId: this.boardId,
      entityType: 'swimlane',
      entityId: this._id,
    });

    if (!existingHistory) {
      PositionHistory.insert({
        boardId: this.boardId,
        entityType: 'swimlane',
        entityId: this._id,
        originalPosition: {
          sort: this.sort,
          title: this.title,
        },
        originalTitle: this.title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },

  /**
   * Get the original position history for this swimlane
   */
  getOriginalPosition() {
    return PositionHistory.findOne({
      boardId: this.boardId,
      entityType: 'swimlane',
      entityId: this._id,
    });
  },

  /**
   * Check if this swimlane has moved from its original position
   */
  hasMovedFromOriginalPosition() {
    const history = this.getOriginalPosition();
    if (!history) return false;
    
    return history.originalPosition.sort !== this.sort;
  },

  /**
   * Get a description of the original position
   */
  getOriginalPositionDescription() {
    const history = this.getOriginalPosition();
    if (!history) return 'No original position data';
    
    return `Original position: ${history.originalPosition.sort || 0}`;
  },
});

export default Swimlanes;
