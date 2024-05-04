import { ReactiveCache } from '/imports/reactiveCache';
import { ALLOWED_COLORS } from '/config/const';

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
       * the swimlane associated to this list. Used for templates
       */
      type: String,
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
    collapsed: {
      /**
       * is the list collapsed
       */
      type: Boolean,
      defaultValue: false,
    },
  }),
);

Lists.allow({
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

Lists.helpers({
  copy(boardId, swimlaneId) {
    const oldId = this._id;
    const oldSwimlaneId = this.swimlaneId || null;
    this.boardId = boardId;
    this.swimlaneId = swimlaneId;

    let _id = null;
    const existingListWithSameName = ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    if (existingListWithSameName) {
      _id = existingListWithSameName._id;
    } else {
      delete this._id;
      delete this.swimlaneId;
      _id = Lists.insert(this);
    }

    // Copy all cards in list
    ReactiveCache.getCards({
      swimlaneId: oldSwimlaneId,
      listId: oldId,
      archived: false,
    }).forEach(card => {
      card.copy(boardId, swimlaneId, _id);
    });
  },

  move(boardId, swimlaneId) {
    const boardList = ReactiveCache.getList({
      boardId,
      title: this.title,
      archived: false,
    });
    let listId;
    if (boardList) {
      listId = boardList._id;
      this.cards().forEach(card => {
        card.move(boardId, this._id, boardList._id);
      });
    } else {
      console.log('list.title:', this.title);
      console.log('boardList:', boardList);
      listId = Lists.insert({
        title: this.title,
        boardId,
        type: this.type,
        archived: false,
        wipLimit: this.wipLimit,
      });
    }

    this.cards(swimlaneId).forEach(card => {
      card.move(boardId, swimlaneId, listId);
    });
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
  remove() {
    Lists.remove({ _id: this._id });
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title } };
  },
  star(enable = true) {
    return { $set: { starred: !!enable } };
  },
  collapse(enable = true) {
    return { $set: { collapsed: !!enable } };
  },

  archive() {
    if (this.isTemplateList()) {
      this.cards().forEach(card => {
        return card.archive();
      });
    }
    return { $set: { archived: true, archivedAt: new Date() } };
  },

  restore() {
    if (this.isTemplateList()) {
      this.allCards().forEach(card => {
        return card.restore();
      });
    }
    return { $set: { archived: false } };
  },

  toggleSoftLimit(toggle) {
    return { $set: { 'wipLimit.soft': toggle } };
  },

  toggleWipLimit(toggle) {
    return { $set: { 'wipLimit.enabled': toggle } };
  },

  setWipLimit(limit) {
    return { $set: { 'wipLimit.value': limit } };
  },

  setColor(newColor) {
    return {
      $set: {
        color: newColor,
      },
    };
  },
});

Lists.userArchivedLists = userId => {
  return ReactiveCache.getLists({
    boardId: { $in: Boards.userBoardIds(userId, null) },
    archived: true,
  })
};

Lists.userArchivedListIds = () => {
  return Lists.userArchivedLists().map(list => { return list._id; });
};

Lists.archivedLists = () => {
  return ReactiveCache.getLists({ archived: true });
};

Lists.archivedListIds = () => {
  return Lists.archivedLists().map(list => {
    return list._id;
  });
};

Meteor.methods({
  applyWipLimit(listId, limit) {
    check(listId, String);
    check(limit, Number);
    if (limit === 0) {
      limit = 1;
    }
    ReactiveCache.getList(listId).setWipLimit(limit);
  },

  enableWipLimit(listId) {
    check(listId, String);
    const list = ReactiveCache.getList(listId);
    if (list.getWipLimit('value') === 0) {
      list.setWipLimit(1);
    }
    list.toggleWipLimit(!list.getWipLimit('enabled'));
  },

  enableSoftLimit(listId) {
    check(listId, String);
    const list = ReactiveCache.getList(listId);
    list.toggleSoftLimit(!list.getWipLimit('soft'));
  },

  myLists() {
    // my lists
    return _.uniq(
      ReactiveCache.getLists(
        {
          boardId: { $in: Boards.userBoardIds(this.userId) },
          archived: false,
        },
        {
          fields: { title: 1 },
        },
      )
        .map(list => {
          return list.title;
        }),
    ).sort();
  },
});

Lists.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(() => {
    Lists._collection.createIndex({ modifiedAt: -1 });
    Lists._collection.createIndex({ boardId: 1 });
    Lists._collection.createIndex({ archivedAt: -1 });
  });

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
  });

  Lists.before.remove((userId, doc) => {
    const cards = ReactiveCache.getCards({ listId: doc._id });
    if (cards) {
      cards.forEach(card => {
        Cards.remove(card._id);
      });
    }
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'removeList',
      boardId: doc.boardId,
      listId: doc._id,
      title: doc.title,
    });
  });

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
    } else if (doc.archived)  {
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
    } else if (fieldNames.includes('archived'))  {
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
  });
}

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
  JsonRoutes.add('GET', '/api/boards/:boardId/lists', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getLists({ boardId: paramBoardId, archived: false }).map(
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
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId', function(
    req,
    res,
  ) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: ReactiveCache.getList({
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
  JsonRoutes.add('POST', '/api/boards/:boardId/lists', function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess(req.userId, paramBoardId);
      const board = ReactiveCache.getBoard(paramBoardId);
      const id = Lists.insert({
        title: req.body.title,
        boardId: paramBoardId,
        sort: board.lists().length,
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
      Authentication.checkBoardAccess(req.userId, paramBoardId);
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

export default Lists;
