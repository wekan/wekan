Checklists = new Mongo.Collection('checklists');

Checklists.attachSchema(new SimpleSchema({
  cardId: {
    type: String,
  },
  title: {
    type: String,
  },
  items: {
    type: [Object],
    defaultValue: [],
  },
  'items.$._id': {
    type: String,
  },
  'items.$.title': {
    type: String,
  },
  'items.$.isFinished': {
    type: Boolean,
    defaultValue: false,
  },
  finishedAt: {
    type: Date,
    optional: true,
  },
  createdAt: {
    type: Date,
    denyUpdate: false,
  },
}));

Checklists.helpers({
  itemCount () {
    return this.items.length;
  },
  finishedCount () {
    return this.items.filter((item) => {
      return item.isFinished;
    }).length;
  },
  isFinished () {
    return 0 !== this.itemCount() && this.itemCount() === this.finishedCount();
  },
  getItem (_id) {
    return _.findWhere(this.items, { _id });
  },
  itemIndex(itemId) {
    return _.pluck(this.items, '_id').indexOf(itemId);
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
  //for checklist itself
  setTitle(title){
    return { $set: { title }};
  },
  //for items in checklist
  addItem(title) {
    const itemCount = this.itemCount();
    const _id = `${this._id}${itemCount}`;
    return { $addToSet: {items: {_id, title, isFinished: false}} };
  },
  removeItem(itemId) {
    return {$pull: {items: {_id : itemId}}};
  },
  editItem(itemId, title) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.title`]: title,
        },
      };
    }
    return {};
  },
  finishItem(itemId) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: true,
        },
      };
    }
    return {};
  },
  resumeItem(itemId) {
    if (this.getItem(itemId)) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: false,
        },
      };
    }
    return {};
  },
  toggleItem(itemId) {
    const item = this.getItem(itemId);
    if (item) {
      const itemIndex = this.itemIndex(itemId);
      return {
        $set: {
          [`items.${itemIndex}.isFinished`]: !item.isFinished,
        },
      };
    }
    return {};
  },
});

if (Meteor.isServer) {
  Checklists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      cardId: doc.cardId,
      boardId: Cards.findOne(doc.cardId).boardId,
      checklistId: doc._id,
    });
  });

  //TODO: so there will be no activity for adding item into checklist, maybe will be implemented in the future.
  // Checklists.after.update((userId, doc) => {
  //   console.log('update:', doc)
    // Activities.insert({
    //   userId,
    //   activityType: 'addChecklist',
    //   boardId: doc.boardId,
    //   cardId: doc.cardId,
    //   checklistId: doc._id,
    // });
  // });

  Checklists.before.remove((userId, doc) => {
    const activity = Activities.findOne({ checklistId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}
