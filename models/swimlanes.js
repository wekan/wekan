Swimlanes = new Mongo.Collection('swimlanes');

/**
 * A swimlane is an line in the kaban board.
 */
Swimlanes.attachSchema(new SimpleSchema({
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
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
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
    // silver is the default, so it is left out
    allowedValues: [
      'white', 'green', 'yellow', 'orange', 'red', 'purple',
      'blue', 'sky', 'lime', 'pink', 'black',
      'peachpuff', 'crimson', 'plum', 'darkgreen',
      'slateblue', 'magenta', 'gold', 'navy', 'gray',
      'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo',
    ],
  },
  updatedAt: {
    /**
     * when was the swimlane last edited
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
  type: {
    /**
     * The type of swimlane
     */
    type: String,
    defaultValue: 'swimlane',
  },
}));

Swimlanes.allow({
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

Swimlanes.helpers({
  copy() {
    const oldId = this._id;
    this._id = null;
    const _id = Swimlanes.insert(this);

    // Copy all lists in swimlane
    Lists.find({
      swimlaneId: oldId,
      archived: false,
    }).forEach((list) => {
      list.type = 'list';
      list.swimlaneId = _id;
      list.boardId = this.boardId;
      list.copy();
    });
  },

  cards() {
    return Cards.find(Filter.mongoSelector({
      swimlaneId: this._id,
      archived: false,
    }), { sort: ['sort'] });
  },

  lists() {
    return Lists.find(Filter.mongoSelector({
      swimlaneId: this._id,
      archived: false,
    }), { sort: ['sort'] });
  },

  allLists() {
    return Lists.find({ swimlaneId: this._id });
  },

  allCards() {
    return Cards.find({ swimlaneId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  colorClass() {
    if (this.color)
      return this.color;
    return '';
  },

  isTemplateSwimlane() {
    return this.type === 'template-swimlane';
  },

  isTemplateContainer() {
    return this.type === 'template-container';
  },

  isListTemplatesSwimlane() {
    const user = Users.findOne(Meteor.userId());
    return user.profile.listTemplatesSwimlaneId === this._id;
  },

  isCardTemplatesSwimlane() {
    const user = Users.findOne(Meteor.userId());
    return user.profile.cardTemplatesSwimlaneId === this._id;
  },

  isBoardTemplatesSwimlane() {
    const user = Users.findOne(Meteor.userId());
    return user.profile.boardTemplatesSwimlaneId === this._id;
  },
});

Swimlanes.mutations({
  rename(title) {
    return { $set: { title } };
  },

  archive() {
    if (this.isTemplateSwimlane()) {
      this.lists().forEach((list) => {
        return list.archive();
      });
    }
    return { $set: { archived: true } };
  },

  restore() {
    if (this.isTemplateSwimlane()) {
      this.allLists().forEach((list) => {
        return list.restore();
      });
    }
    return { $set: { archived: false } };
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

Swimlanes.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(() => {
    Swimlanes._collection._ensureIndex({ boardId: 1 });
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

  Swimlanes.before.remove((userId, doc) => {
    Activities.insert({
      userId,
      type: 'swimlane',
      activityType: 'removeSwimlane',
      boardId: doc.boardId,
      swimlaneId: doc._id,
      title: doc.title,
    });
  });

  Swimlanes.after.update((userId, doc) => {
    if (doc.archived) {
      Activities.insert({
        userId,
        type: 'swimlane',
        activityType: 'archivedSwimlane',
        swimlaneId: doc._id,
        boardId: doc.boardId,
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
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Swimlanes.find({ boardId: paramBoardId, archived: false }).map(function (doc) {
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
   * @operation get_swimlane
   *
   * @summary Get a swimlane
   *
   * @param {string} boardId the ID of the board
   * @param {string} swimlaneId the ID of the swimlane
   * @return_type Swimlanes
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/swimlanes/:swimlaneId', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Swimlanes.findOne({ _id: paramSwimlaneId, boardId: paramBoardId, archived: false }),
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
   * @operation new_swimlane
   *
   * @summary Add a swimlane to a board
   *
   * @param {string} boardId the ID of the board
   * @param {string} title the new title of the swimlane
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/swimlanes', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const board = Boards.findOne(paramBoardId);
      const id = Swimlanes.insert({
        title: req.body.title,
        boardId: paramBoardId,
        sort: board.swimlanes().count(),
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
  JsonRoutes.add('DELETE', '/api/boards/:boardId/swimlanes/:swimlaneId', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const paramSwimlaneId = req.params.swimlaneId;
      Swimlanes.remove({ _id: paramSwimlaneId, boardId: paramBoardId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramSwimlaneId,
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
