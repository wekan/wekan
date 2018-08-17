Checklists = new Mongo.Collection('checklists');

Checklists.attachSchema(new SimpleSchema({
  cardId: {
    type: String,
  },
  title: {
    type: String,
    defaultValue: 'Checklist',
  },
  finishedAt: {
    type: Date,
    optional: true,
  },
  createdAt: {
    type: Date,
    denyUpdate: false,
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
  },
}));

Checklists.helpers({
  itemCount() {
    return ChecklistItems.find({ checklistId: this._id }).count();
  },
  items() {
    return ChecklistItems.find({
      checklistId: this._id,
    }, { sort: ['sort'] });
  },
  finishedCount() {
    return ChecklistItems.find({
      checklistId: this._id,
      isFinished: true,
    }).count();
  },
  isFinished() {
    return 0 !== this.itemCount() && this.itemCount() === this.finishedCount();
  },
  itemIndex(itemId) {
    const items = self.findOne({_id : this._id}).items;
    return _.pluck(items, '_id').indexOf(itemId);
  },
});

Checklists.allow({
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

Checklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});

Checklists.mutations({
  setTitle(title) {
    return { $set: { title } };
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Checklists._collection._ensureIndex({ cardId: 1, createdAt: 1 });
  });

  Checklists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      cardId: doc.cardId,
      boardId: Cards.findOne(doc.cardId).boardId,
      checklistId: doc._id,
      checklistName:doc.title
    });
  });

  Checklists.before.remove((userId, doc) => {
    const activities = Activities.find({ checklistId: doc._id });
    if (activities) {
      activities.forEach((activity) => {
        Activities.remove(activity._id);
      });
    }
    Activities.insert({
      userId,
      activityType: 'removeChecklist',
      cardId: doc.cardId,
      boardId: Cards.findOne(doc.cardId).boardId,
      checklistId: doc._id,
      checklistName:doc.title
    });


  });
}

if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramCardId = req.params.cardId;
    const checklists = Checklists.find({ cardId: paramCardId }).map(function (doc) {
      return {
        _id: doc._id,
        title: doc.title,
      };
    });
    if (checklists) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklists,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramChecklistId = req.params.checklistId;
    const paramCardId = req.params.cardId;
    const checklist = Checklists.findOne({ _id: paramChecklistId, cardId: paramCardId });
    if (checklist) {
      checklist.items = ChecklistItems.find({checklistId: checklist._id}).map(function (doc) {
        return {
          _id: doc._id,
          title: doc.title,
          isFinished: doc.isFinished,
        };
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklist,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res) {
    Authentication.checkUserId( req.userId);

    const paramCardId = req.params.cardId;
    const id = Checklists.insert({
      title: req.body.title,
      cardId: paramCardId,
      sort: 0,
    });
    if (id) {
      req.body.items.forEach(function (item, idx) {
        ChecklistItems.insert({
          cardId: paramCardId,
          checklistId: id,
          title: item.title,
          sort: idx,
        });
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 400,
      });
    }
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramChecklistId = req.params.checklistId;
    Checklists.remove({ _id: paramChecklistId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramChecklistId,
      },
    });
  });
}
