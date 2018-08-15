Triggers = new Mongo.Collection('triggers');



Triggers.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Triggers.allow({
  update: function () {
    // add custom authentication code here
    return true;
  },
  insert: function () {
    // add custom authentication code here
    return true;
  }
});


Triggers.helpers({


  getRule(){
    return Rules.findOne({triggerId:this._id});
  },

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





