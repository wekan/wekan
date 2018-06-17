Subtasks = new Mongo.Collection('subtasks');

Subtasks.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  sort: {
    type: Number,
    decimal: true,
  },
  isFinished: {
    type: Boolean,
    defaultValue: false,
  },
  cardId: {
    type: String,
  },
}));

Subtasks.allow({
  insert(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

Subtasks.before.insert((userId, doc) => {
  if (!doc.userId) {
    doc.userId = userId;
  }
});

// Mutations
Subtasks.mutations({
  setTitle(title) {
    return { $set: { title } };
  },
  toggleItem() {
    return { $set: { isFinished: !this.isFinished } };
  },
  move(sortIndex) {
    const mutatedFields = {
      sort: sortIndex,
    };

    return {$set: mutatedFields};
  },
});

// Activities helper
function itemCreation(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  Activities.insert({
    userId,
    activityType: 'addSubtaskItem',
    cardId: doc.cardId,
    boardId,
    subtaskItemId: doc._id,
  });
}

function itemRemover(userId, doc) {
  Activities.remove({
    subtaskItemId: doc._id,
  });
}

// Activities
if (Meteor.isServer) {
  Meteor.startup(() => {
    Subtasks._collection._ensureIndex({ cardId: 1 });
  });

  Subtasks.after.insert((userId, doc) => {
    itemCreation(userId, doc);
  });

  Subtasks.after.remove((userId, doc) => {
    itemRemover(userId, doc);
  });
}

// APIs
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/subtasks/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    const subtaskItem = Subtasks.findOne({ _id: paramItemId });
    if (subtaskItem) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: subtaskItem,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('PUT', '/api/boards/:boardId/cards/:cardId/subtasks/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);

    const paramItemId = req.params.itemId;

    if (req.body.hasOwnProperty('isFinished')) {
      Subtasks.direct.update({_id: paramItemId}, {$set: {isFinished: req.body.isFinished}});
    }
    if (req.body.hasOwnProperty('title')) {
      Subtasks.direct.update({_id: paramItemId}, {$set: {title: req.body.title}});
    }

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/subtasks/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    Subtasks.direct.remove({ _id: paramItemId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  });
}
