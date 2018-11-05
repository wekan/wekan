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
    allowedValues: ['text', 'number', 'date', 'dropdown'],
  },
  settings: {
    type: Object,
  },
  'settings.dropdownItems': {
    type: [Object],
    optional: true,
  },
  'settings.dropdownItems.$': {
    type: new SimpleSchema({
      _id: {
        type: String,
      },
      name: {
        type: String,
      },
    }),
  },
  showOnCard: {
    type: Boolean,
  },
  automaticallyOnCard: {
    type: Boolean,
  },
  showLabelOnMiniCard: {
    type: Boolean,
  },
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
  fetch: ['userId', 'boardId'],
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
  /*Meteor.startup(() => {
    CustomFields._collection._ensureIndex({ boardId: 1});
  });*/

  CustomFields.after.insert((userId, doc) => {
    customFieldCreation(userId, doc);
  });

  CustomFields.after.remove((userId, doc) => {
    Activities.remove({
      customFieldId: doc._id,
    });

    Cards.update(
      {'boardId': doc.boardId, 'customFields._id': doc._id},
      {$pull: {'customFields': {'_id': doc._id}}},
      {multi: true}
    );
  });
}

//CUSTOM FIELD REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.find({ boardId: paramBoardId }).map(function (cf) {
        return {
          _id: cf._id,
          name: cf.name,
          type: cf.type,
        };
      }),
    });
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.findOne({ _id: paramCustomFieldId, boardId: paramBoardId }),
    });
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = CustomFields.direct.insert({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
      showOnCard: req.body.showOnCard,
      automaticallyOnCard: req.body.automaticallyOnCard,
      showLabelOnMiniCard: req.body.showLabelOnMiniCard,
      boardId: paramBoardId,
    });

    const customField = CustomFields.findOne({_id: id, boardId: paramBoardId });
    customFieldCreation(req.body.authorId, customField);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res) {
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
