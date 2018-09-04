Swimlanes = new Mongo.Collection('swimlanes');

Swimlanes.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  boardId: {
    type: String,
  },
  createdAt: {
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
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true,
  },
  updatedAt: {
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
  cards() {
    return Cards.find(Filter.mongoSelector({
      swimlaneId: this._id,
      archived: false,
    }), { sort: ['sort'] });
  },

  allCards() {
    return Cards.find({ swimlaneId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },
});

Swimlanes.mutations({
  rename(title) {
    return { $set: { title } };
  },

  archive() {
    return { $set: { archived: true } };
  },

  restore() {
    return { $set: { archived: false } };
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

  JsonRoutes.add('POST', '/api/boards/:boardId/swimlanes', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const id = Swimlanes.insert({
        title: req.body.title,
        boardId: paramBoardId,
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
