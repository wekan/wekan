Rules = new Mongo.Collection('rules');

Rules.attachSchema(new SimpleSchema({
  title: {
    type: String,
    optional: true,
  },
  triggerId: {
    type: String,
    optional: true,
  },
  actionId: {
    type: String,
    optional: true,
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
});



Rules.allow({
    update: function () {
    // add custom authentication code here
    return true;
  },
    remove: function () {
    // add custom authentication code here
    return true;
  },
    insert: function () {
    // add custom authentication code here
    return true;
  },
});

