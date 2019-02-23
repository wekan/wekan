Checklists = new Mongo.Collection('checklists');

/**
 * A Checklist
 */
Checklists.attachSchema(new SimpleSchema({
  cardId: {
    /**
     * The ID of the card the checklist is in
     */
    type: String,
  },
  title: {
    /**
     * the title of the checklist
     */
    type: String,
    defaultValue: 'Checklist',
  },
  finishedAt: {
    /**
     * When was the checklist finished
     */
    type: Date,
    optional: true,
  },
  createdAt: {
    /**
     * Creation date of the checklist
     */
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
    /**
     * sorting value of the checklist
     */
    type: Number,
    decimal: true,
  },
}));

Checklists.helpers({
  copy(newCardId) {
    const oldChecklistId = this._id;
    this._id = null;
    this.cardId = newCardId;
    const newChecklistId = Checklists.insert(this);
    ChecklistItems.find({checklistId: oldChecklistId}).forEach((item) => {
      item._id = null;
      item.checklistId = newChecklistId;
      item.cardId = newCardId;
      ChecklistItems.insert(item);
    });
  },

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
  checkAllItems(){
    const checkItems = ChecklistItems.find({checklistId: this._id});
    checkItems.forEach(function(item){
      item.check();
    });
  },
  uncheckAllItems(){
    const checkItems = ChecklistItems.find({checklistId: this._id});
    checkItems.forEach(function(item){
      item.uncheck();
    });
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
      checklistName:doc.title,
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
      checklistName:doc.title,
    });


  });
}

if (Meteor.isServer) {
  /**
   * @operation get_all_checklists
   * @summary Get the list of checklists attached to a card
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @return_type [{_id: string,
   *                title: string}]
   */
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

  /**
   * @operation get_checklist
   * @summary Get a checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist
   * @return_type {cardId: string,
   *               title: string,
   *               finishedAt: string,
   *               createdAt: string,
   *               sort: number,
   *               items: [{_id: string,
   *                        title: string,
   *                        isFinished: boolean}]}
   */
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

  /**
   * @operation new_checklist
   * @summary create a new checklist
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} title the title of the new checklist
   * @return_type {_id: string}
   */
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

  /**
   * @operation delete_checklist
   * @summary Delete a checklist
   *
   * @description The checklist will be removed, not put in the recycle bin.
   *
   * @param {string} boardId the board ID
   * @param {string} cardId the card ID
   * @param {string} checklistId the ID of the checklist to remove
   * @return_type {_id: string}
   */
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
