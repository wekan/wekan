Cards = new Mongo.Collection('cards');

// XXX To improve pub/sub performances a card document should include a
// de-normalized number of comments so we don't have to publish the whole list
// of comments just to display the number of them in the board view.
Cards.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  listId: {
    type: String,
  },
  friendlyId: {
    type: String,
    optional: true,
  },
  // The system could work without this `boardId` information (we could deduce
  // the board identifier from the card), but it would make the system more
  // difficult to manage and less efficient.
  boardId: {
    type: String,
  },
  coverId: {
    type: String,
    optional: true,
  },
  createdAt: {
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  dateLastActivity: {
    type: Date,
    autoValue() {
      return new Date();
    },
  },
  description: {
    type: String,
    optional: true,
  },
  labelIds: {
    type: [String],
    optional: true,
  },
  members: {
    type: [String],
    optional: true,
  },
  // XXX Should probably be called `authorId`. Is it even needed since we have
  // the `members` field?
  userId: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return this.userId;
      }
    },
  },
  sort: {
    type: Number,
    decimal: true,
  },
}));

Cards.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Cards.helpers({
  list() {
    return Lists.findOne(this.listId);
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  user() {
    return Users.findOne(this.userId);
  },

  isAssigned(memberId) {
    return _.contains(this.members, memberId);
  },

  activities() {
    return Activities.find({ cardId: this._id }, { sort: { createdAt: -1 }});
  },

  comments() {
    return CardComments.find({ cardId: this._id }, { sort: { createdAt: -1 }});
  },

  attachments() {
    return Attachments.find({ cardId: this._id }, { sort: { uploadedAt: -1 }});
  },

  cover() {
    const cover = Attachments.findOne(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.url() && cover;
  },

  absoluteUrl() {
    const board = this.board();
    return FlowRouter.url('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
    });
  },
});

Meteor.methods({
  //Each Board is a Spark Room - this initializes the room
  'cards.removeLabel'(cardId) {
    check(cardId, String);
    Cards.update({_id: cardId}, {$pop: {labelIds: 1}});
  }
})//methods


Cards.mutations({
  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },

  setTitle(title) {
    return { $set: { title }};
  },

  setDescription(description) {
    return { $set: { description }};
  },

  move(listId, sortIndex) {
    const mutatedFields = { listId };
    if (sortIndex) {
      mutatedFields.sort = sortIndex;
    }
    return { $set: mutatedFields };
  },

  addLabel(labelId) {
    //send labelId to label.js for actions
    var sparkBoard = Boards.findOne({_id: this.boardId}).sparkId;
    var label;
    var cardId = this._id;
    var title = this.title;
    var members = this.members;
    var friendlyId = this.friendlyId;
    var labelName = Boards.findOne({labels: {$elemMatch: {_id: labelId}}}).labels;
    for (i=0; i < labelName.length; i++) {
       if (labelName[i]._id === labelId) {
           label = labelName[i].name;
       }
     }
    Meteor.call(
      'label.which',
      label,
      sparkBoard,
      members,
      title,
      friendlyId,
      labelId,
      cardId,
      function(err,res){
        if(err){
        } else{
        }
      }
    )//call to label.action
    return { $addToSet: { labelIds: labelId }};
  },

  removeLabel(labelId) {
//    console.log("removed a label")
    return { $pull: { labelIds: labelId }};
  },

  toggleLabel(labelId) {
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {
      //add code here for action when label is removed
//      console.log("i removed a label");
      return this.removeLabel(labelId);
    } else {
      //add code here for action for when a label is added
//      console.log("i added a label");
      return this.addLabel(labelId);
    }
  },

  assignMember(memberId) {
    //Alert In Spark of Task Assignment
    var sparkRoom = Boards.findOne({_id: this.boardId}).sparkId;
    var createdBy = Users.findOne({_id: this.userId}).username;
    var userName = Users.findOne({_id: memberId}).username;
    var yourAssigned = "Hey **" + userName + "**, you've been assigned a new task: **" + this.title + "** by: **" + createdBy+"**";
      Meteor.call(
       'spark.msgRoom',
        sparkRoom,
        yourAssigned,
         function(err, res) {
           if(err) {
             console.log(err);
           } else {
                }
              }
        );//call to msgRoom
    return { $addToSet: { members: memberId }};
  },

  unassignMember(memberId) {
    var sparkRoom = Boards.findOne({_id: this.boardId}).sparkId;
    var createdBy = Users.findOne({_id: this.userId}).username;
    var userName = Users.findOne({_id: memberId}).username;
    var yourAssigned = "Hey **" + userName + "**, you've been unassigned a task: **" + this.title + " ** by: **" + createdBy;
      Meteor.call(
       'spark.msgRoom',
        sparkRoom,
        yourAssigned,
         function(err, res) {
           if(err) {
             console.log(err);
           } else {
                }
              }
        );//call to msgRoom
    return { $pull: { members: memberId }};
  },

  toggleMember(memberId) {
    if (this.members && this.members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  setCover(coverId) {
    return { $set: { coverId }};
  },

  unsetCover() {
    return { $unset: { coverId: '' }};
  },
});

if (Meteor.isServer) {
  // Cards are often fetched within a board, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    Cards._collection._ensureIndex({ boardId: 1 });
  });

  Cards.after.insert((userId, doc) => {
    //add friendlyId and set to the current index value
    var index = Cards.find().fetch().length;
      Cards.update({_id: doc._id}, {$set: {friendlyId: index}});
      console.log(doc.boardId);
    Activities.insert({
      userId,
      activityType: 'createCard',
      boardId: doc.boardId,
      listId: doc.listId,
      cardId: doc._id,
    });
  });

  // New activity for card (un)archivage
  Cards.after.update((userId, doc, fieldNames) => {
    if (_.contains(fieldNames, 'archived')) {
      if (doc.archived) {
        Activities.insert({
          userId,
          activityType: 'archivedCard',
          boardId: doc.boardId,
          listId: doc.listId,
          cardId: doc._id,
        });
      } else {
        Activities.insert({
          userId,
          activityType: 'restoredCard',
          boardId: doc.boardId,
          listId: doc.listId,
          cardId: doc._id,
        });
      }
    }
  });

  // New activity for card moves
  Cards.after.update(function(userId, doc, fieldNames) {
    const oldListId = this.previous.listId;
    if (_.contains(fieldNames, 'listId') && doc.listId !== oldListId) {
      Activities.insert({
        userId,
        oldListId,
        activityType: 'moveCard',
        listId: doc.listId,
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  });

  // Add a new activity if we add or remove a member to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members'))
      return;
    let memberId;
    // Say hello to the new member
    if (modifier.$addToSet && modifier.$addToSet.members) {
      memberId = modifier.$addToSet.members;
      if (!_.contains(doc.members, memberId)) {
        Activities.insert({
          userId,
          memberId,
          activityType: 'joinMember',
          boardId: doc.boardId,
          cardId: doc._id,
        });
      }
    }

    // Say goodbye to the former member
    if (modifier.$pull && modifier.$pull.members) {
      memberId = modifier.$pull.members;
      Activities.insert({
        userId,
        memberId,
        activityType: 'unjoinMember',
        boardId: doc.boardId,
        cardId: doc._id,
      });
    }
  });

  // Remove all activities associated with a card if we remove the card
  Cards.after.remove((userId, doc) => {
    Activities.remove({
      cardId: doc._id,
    });
  });
}
