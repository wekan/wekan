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



if (Meteor.isServer) {
  Meteor.startup(() => {
    const rules = Triggers.findOne({});
    if(!rules){
       Triggers.insert({group: "cards", activityType: "moveCard","fromId":-1,"toId":-1 });
    }
  });
}



  Activities.after.insert((userId, doc) => {
  		const activity = Activities._transform(doc);
  		const matchedTriggers = Triggers.find({activityType: activity.activityType,fromId:activity.oldListId,toId:activity.listId})
  		if(matchedTriggers.count() > 0){
	  		const card = activity.card();
	  		const oldTitle = card.title;
	  		const fromListTitle = activity.oldList().title;
			Cards.direct.update({_id: card._id, listId: card.listId, boardId: card.boardId, archived: false},
	        {$set: {title: "[From "+fromListTitle +"] "+ oldTitle}});
  		}
  });







