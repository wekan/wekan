Actions = new Mongo.Collection('actions');



Actions.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Actions.allow({
  update: function () {
    // add custom authentication code here
    return true;
  },
  insert: function () {
    // add custom authentication code here
    return true;
  }
});


Actions.helpers({
  fromList() {
    return Lists.findOne(this.fromId);
  },

  toList() {
    return Lists.findOne(this.toId);
  },

  findList(title) {
    return Lists.findOne({title:title});
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  }});












