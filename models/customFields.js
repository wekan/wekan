CustomFields = new Mongo.Collection('customFields');

CustomFields.attachSchema(new SimpleSchema({
  boardId: {
    type: String,
  },
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  showOnCard: {
    type: Boolean,
  }
}));

CustomFields.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

// not sure if we need this?
//CustomFields.hookOptions.after.update = { fetchPrevious: false };

function customFieldCreation(userId, doc){
  Activities.insert({
    userId,
    activityType: 'createCustomField',
    boardId: doc.boardId,
    customFieldId: doc._id,
  });
}

if (Meteor.isServer) {
  // Comments are often fetched within a card, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    CardComments._collection._ensureIndex({ cardId: 1, createdAt: -1 });
  });

  CustomFields.after.insert((userId, doc) => {
    customFieldCreation(userId, doc);
  });

  CustomFields.after.remove((userId, doc) => {
    const activity = Activities.findOne({ customFieldId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}

//CUSTOM FIELD REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.find({ boardId: paramBoardId })
    });
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/comments/:customFieldId', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.findOne({ _id: paramCustomFieldId, boardId: paramBoardId }),
    });
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/custom-fields', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = CustomFields.direct.insert({
      name: req.body.name,
      type: req.body.type,
      showOnCard: req.body.showOnCard,
      boardId: paramBoardId,
    });

    const customField = CustomFields.findOne({_id: id, cardId:paramCardId, boardId: paramBoardId });
    customFieldCreation(req.body.authorId, customField);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res, next) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = req.params.customFieldId;
    CustomFields.remove({ _id: id, boardId: paramBoardId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });
}
