Lists = new Mongo.Collection('lists');

/**
 * A list (column) in the Wekan board.
 */
Lists.attachSchema(new SimpleSchema({
  title: {
    /**
     * the title of the list
     */
    type: String,
  },
  archived: {
    /**
     * is the list archived
     */
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
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
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
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
    autoValue() { // eslint-disable-line consistent-return
      if (this.isUpdate) {
        return new Date();
      } else {
        this.unset();
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
    // silver is the default, so it is left out
    allowedValues: [
      'white', 'green', 'yellow', 'orange', 'red', 'purple',
      'blue', 'sky', 'lime', 'pink', 'black',
      'peachpuff', 'crimson', 'plum', 'darkgreen',
      'slateblue', 'magenta', 'gold', 'navy', 'gray',
      'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo',
    ],
  },
  type: {
    /**
     * The type of list
     */
    type: String,
    defaultValue: 'list',
  },
}));

Lists.allow({
  insert(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Lists.helpers({
  copy(swimlaneId) {
    const oldId = this._id;
    const oldSwimlaneId = this.swimlaneId || null;
    let _id = null;
    existingListWithSameName = Lists.findOne({
      boardId: this.boardId,
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
    Cards.find({
      swimlaneId: oldSwimlaneId,
      listId: oldId,
      archived: false,
    }).forEach((card) => {
      card.type = 'cardType-card';
      card.listId = _id;
      card.boardId = this.boardId;
      card.swimlaneId = swimlaneId;
      card.copy();
    });
  },

  cards(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId)
      selector.swimlaneId = swimlaneId;
    return Cards.find(Filter.mongoSelector(selector),
      { sort: ['sort'] });
  },

  cardsUnfiltered(swimlaneId) {
    const selector = {
      listId: this._id,
      archived: false,
    };
    if (swimlaneId)
      selector.swimlaneId = swimlaneId;
    return Cards.find(selector,
      { sort: ['sort'] });
  },

  allCards() {
    return Cards.find({ listId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  getWipLimit(option){
    const list = Lists.findOne({ _id: this._id });
    if(!list.wipLimit) { // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
      return 0;
    } else if(!option) {
      return list.wipLimit;
    } else {
      return list.wipLimit[option] ? list.wipLimit[option] : 0; // Necessary check to avoid exceptions for the case where the doc doesn't have the wipLimit field yet set
    }
  },

  colorClass() {
    if (this.color)
      return this.color;
    return '';
  },

  isTemplateList() {
    return this.type === 'template-list';
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title } };
  },

  archive() {
    if (this.isTemplateList()) {
      this.cards().forEach((card) => {
        return card.archive();
      });
    }
    return { $set: { archived: true } };
  },

  restore() {
    if (this.isTemplateList()) {
      this.allCards().forEach((card) => {
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
    if (newColor === 'silver') {
      newColor = null;
    }
    return {
      $set: {
        color: newColor,
      },
    };
  },
});

Meteor.methods({
  applyWipLimit(listId, limit){
    check(listId, String);
    check(limit, Number);
    if(limit === 0){
      limit = 1;
    }
    Lists.findOne({ _id: listId }).setWipLimit(limit);
  },

  enableWipLimit(listId) {
    check(listId, String);
    const list = Lists.findOne({ _id: listId });
    if(list.getWipLimit('value') === 0){
      list.setWipLimit(1);
    }
    list.toggleWipLimit(!list.getWipLimit('enabled'));
  },

  enableSoftLimit(listId) {
    check(listId, String);
    const list = Lists.findOne({ _id: listId });
    list.toggleSoftLimit(!list.getWipLimit('soft'));
  },
});

Lists.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(() => {
    Lists._collection._ensureIndex({ boardId: 1 });
  });

  Lists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'createList',
      boardId: doc.boardId,
      listId: doc._id,
    });
  });

  Lists.before.remove((userId, doc) => {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'removeList',
      boardId: doc.boardId,
      listId: doc._id,
      title: doc.title,
    });
  });

  Lists.after.update((userId, doc) => {
    if (doc.archived) {
      Activities.insert({
        userId,
        type: 'list',
        activityType: 'archivedList',
        listId: doc._id,
        boardId: doc.boardId,
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
  JsonRoutes.add('GET', '/api/boards/:boardId/lists', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Lists.find({ boardId: paramBoardId, archived: false }).map(function (doc) {
          return {
            _id: doc._id,
            title: doc.title,
          };
        }),
      });
    }
    catch (error) {
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
  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Lists.findOne({ _id: paramListId, boardId: paramBoardId, archived: false }),
      });
    }
    catch (error) {
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
  JsonRoutes.add('POST', '/api/boards/:boardId/lists', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const board = Boards.findOne(paramBoardId);
      const id = Lists.insert({
        title: req.body.title,
        boardId: paramBoardId,
        sort: board.lists().count(),
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    }
    catch (error) {
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
  JsonRoutes.add('DELETE', '/api/boards/:boardId/lists/:listId', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Lists.remove({ _id: paramListId, boardId: paramBoardId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramListId,
        },
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

}
