Triggers = new Mongo.Collection('triggers');



Triggers.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Triggers.allow({
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


Triggers.helpers({


  description(){
    if(this.activityType == "createCard"){
      if(this.listName == "*"){
        return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-added-to').toLowerCase() + " " + TAPi18n.__('r-the-board');
      }else{
        return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-added-to').toLowerCase() + " " + TAPi18n.__('r-list') + " " +this.listName;
      }
    }
    if(this.activityType == "removeCard"){
      if(this.listName == "*"){
        return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-removed-from') + " " +  TAPi18n.__('r-the-board');
      }else{
        return TAPi18n.__('r-when-a-card-is') + " " +  TAPi18n.__('r-removed-from') + " " +  TAPi18n.__('r-list') + " " +this.listName;
      }
    }
    if(this.activityType == "moveCard"){
      if(this.listName = "*"){
        return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-moved-from') + " " + this.oldListName;
      }else{
        return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-moved-to') + " " + this.listName;
      }
      
    }
    if(this.activityType = "archivedCard"){
     return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-archived');
   }
   if(this.activityType = "restoredCard"){
     return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-unarchived');
   }
   if(this.activityType = "addedLabel"){
    if(this.labelId == "*"){
      return TAPi18n.__('r-when-a-label-is') + " " + TAPi18n.__('r-added-to') + " " + TAPi18n.__('r-a-card');
    }else{
      const board = Boards.findOne(Session.get('currentBoard'));
      const label = board.getLabelById(this.labelId);
      let name;
      if(label.name == "" || label.name == undefined){
        name = label.color.toUpperCase();
      }else{
        name = label.name;
      }
    }
  }
  if(this.activityType = "restoredCard"){
   return TAPi18n.__('r-when-a-card-is') + " " + TAPi18n.__('r-unarchived');
 }



 return "No description found";
},

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





