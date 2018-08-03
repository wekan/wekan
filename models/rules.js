Rules = new Mongo.Collection('rules');

Rules.attachSchema(new SimpleSchema({
  title: {
    type: String,
    optional: true,
  },
  description: {
    type: String,
    optional: true,
  },
}));

Rules.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Rules.allow({
    update: function () {
    // add custom authentication code here
    return true;
  },
});




if (Meteor.isServer) {
  Meteor.startup(() => {
    const rules = Rules.findOne({});
    if(!rules){
      Rules.insert({title: "regola1", description: "bella"});
      Rules.insert({title: "regola2", description: "bella2"});
    }
  });
}
