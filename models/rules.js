Rules = new Mongo.Collection('rules');

Rules.attachSchema(new SimpleSchema({
  title: {
    type: String,
    optional: false,
  },
  triggerId: {
    type: String,
    optional: false,
  },
  actionId: {
    type: String,
    optional: false,
  },
  boardId: {
    type: String,
    optional: false,
  },
}));

Rules.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Rules.helpers({
  getAction(){
    return Actions.findOne({_id:this.actionId});
  },
  getTrigger(){
    return Triggers.findOne({_id:this.triggerId});
  }
});



Rules.allow({
  insert(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  }
});
