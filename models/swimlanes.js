import { ReactiveCache } from '/imports/reactiveCache';
import { ALLOWED_COLORS } from '/config/const';

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
    collapsed: {
      /**
       * is the swimlane collapsed
       */
      type: Boolean,
      defaultValue: false,
    },
  }),
);

Swimlanes.allow({
  insert(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, ReactiveCache.getBoard(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, ReactiveCache.getBoard(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, ReactiveCache.getBoard(doc.boardId));
  },
  fetch: ['boardId'],
});

Swimlanes.helpers({
  copy(boardId) {
    const oldId = this._id;
    const oldBoardId = this.boardId;
    this.boardId = boardId;
    delete this._id;
    const _id = Swimlanes.insert(this);

    const query = {
      swimlaneId: { $in: [oldId, ''] },
      archived: false,
    };
    if (oldBoardId) {
      query.boardId = oldBoardId;
    }

    // Copy all lists in swimlane
    ReactiveCache.getLists(query).forEach(list => {
      list.type = 'list';
      list.swimlaneId = oldId;
      list.boardId = boardId;
      list.copy(boardId, _id);
    });
  },

  move(toBoardId) {
    this.lists().forEach(list => {
      const toList = ReactiveCache.getList({
        boardId: toBoardId,
        title: list.title,
        archived: false,
      });

      let toListId;
      if (toList) {
        toListId = toList._id;
      } else {
        toListId = Lists.insert({
          title: list.title,
          boardId: toBoardId,
          type: list.type,
          archived: false,
          wipLimit: list.wipLimit,
        });
      }

      ReactiveCache.getCards({
        listId: list._id,
        swimlaneId: this._id,
      }).forEach(card => {
        card.move(toBoardId, this._id, toListId);
      });
    });

    Swimlanes.update(this._id, {
      $set: {
        boardId: toBoardId,
      },
    });

    // make sure there is a default swimlane
    this.board().getDefaultSwimline();
  },

  cards() {
    const ret = ReactiveCache.getCards(
      Filter.mongoSelector({
        swimlaneId: this._id,
        archived: false,
      }),
      { sort: ['sort'] },
    );
    return ret;
  },

  lists() {
    return this.draggableLists();
  },
  newestLists() {
    // sorted lists from newest to the oldest, by its creation date or its cards' last modification date
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        swimlaneId: { $in: [this._id, ''] },
        archived: false,
      },
      { sort: { modifiedAt: -1 } },
    );
  },
  draggableLists() {
    return ReactiveCache.getLists(
      {
        boardId: this.boardId,
        swimlaneId: { $in: [this._id, ''] },
        //archived: false,
      },
      { sort: ['sort'] },
    );
  },

  myLists() {
    return ReactiveCache.getLists({ swimlaneId: this._id });
  },

  allCards() {
    const ret = ReactiveCache.getCards({ swimlaneId: this._id });
    return ret;
  },

  isCollapsed() {
    return this.collapsed === true;
  },

  board() {
    return ReactiveCache.getBoard(this.boardId);
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

  isListTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).listTemplatesSwimlaneId === this._id;
  },

  isCardTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).cardTemplatesSwimlaneId === this._id;
  },

  isBoardTemplatesSwimlane() {
    const user = ReactiveCache.getCurrentUser();
    return (user.profile || {}).boardTemplatesSwimlaneId === this._id;
  },

  remove() {
    Swimlanes.remove({ _id: this._id });
  },
});

Swimlanes.mutations({
  rename(title) {
    return { $set: { title } };
  },

  collapse(enable = true) {
    return { $set: { collapsed: !!enable } };
  },

  archive() {
    if (this.isTemplateSwimlane()) {
      this.myLists().forEach(list => {
        return list.archive();
      });
    }
    return { $set: { archived: true, archivedAt: new Date() } };
  },

  restore() {
    if (this.isTemplateSwimlane()) {
      this.myLists().forEach(list => {
        return list.restore();
      });
    }
    return { $set: { archived: false } };
  },

  setColor(newColor) {
    return {
      $set: {
        color: newColor,
      },
    };
  },
});

Swimlanes.userArchivedSwimlanes = userId => {
  return ReactiveCache.getSwimlanes({
    boardId: { $in: Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Swimlanes.userArchivedSwimlaneIds = () => {
  return Swimlanes.userArchivedSwimlanes().map(swim => { return swim._id; });
};

Swimlanes.archivedSwimlanes = () => {
  return ReactiveCache.getSwimlanes({ archived: true });
};

Swimlanes.archivedSwimlaneIds = () => {
  return Swimlanes.archivedSwimlanes().map(swim => {
    return swim._id;
  });
};

Swimlanes.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(() => {
    Swimlanes._collection.createIndex({ modifiedAt: -1 });
    Swimlanes._collection.createIndex({ boardId: 1 });
  });

  Swimlanes.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'swimlane',
      activityType: 'createSwimlane',
      boardId: doc.boardId,
      swimlaneId: doc._id,
    });
  });

  Swimlanes.before.remove(function(userId, doc) {
    const lists = ReactiveCache.getLists(
      {
        boardId: doc.boardId,
        swimlaneId: { $in: [doc._id, ''] },
        archived: false,
      },
      { sort: ['sort'] },
    );

    if (lists.length < 2) {
      lists.forEach(list => {
        list.remove();
      });
    } else {
      Cards.remove({ swimlaneId: doc._id });
    }

    Activities.insert({
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
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getSwimlanes({ boardId: paramBoardId, archived: false }).map(
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
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes/:swimlaneId', function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getSwimlane({
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
  JsonRoutes.add('POST', '/api/boards/:boardId/swimlanes', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      const board = ReactiveCache.getBoard(paramBoardId);
      const id = Swimlanes.insert({
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
  JsonRoutes.add('PUT', '/api/boards/:boardId/swimlanes/:swimlaneId', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const board = ReactiveCache.getBoard(paramBoardId);
      const swimlane = ReactiveCache.getSwimlane({
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
        Authentication.checkBoardAccess(req.userId, paramBoardId);
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

export default Swimlanes;
