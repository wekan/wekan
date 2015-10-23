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
  },
  listId: {
    type: String,
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
    denyUpdate: true,
  },
  dateLastActivity: {
    type: Date,
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
  },
  votes: {
    type: Number,
    decimal: true
  },
  sort: {
    type: Number,
    decimal: true,
  },
}));

Cards.allow({
  insert(userId, doc) {
    if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    else if( Boards.findOne(doc.boardId).isCollaborate() ) {
      if( Meteor.user().isBoardAdmin(doc.boardId) )
        return true;
      else if( ( Lists.findOne(doc.listId).permission === 'registered' && Meteor.user()) || 
        ( Lists.findOne(doc.listId).permission === 'member' && Meteor.user().isBoardMember(doc.boardId)))
        return true;
      else
        return false;
    }
  },
  update(userId, doc) {
    if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    else if( Boards.findOne(doc.boardId).isCollaborate() ) {
      if( Meteor.user().isBoardAdmin(doc.boardId) )
        return true;
      else if( userId === doc.userId)
        return true;
      else
        return false;
    }      
  },
  remove(userId, doc) {
    if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    else if( Boards.findOne(doc.boardId).isCollaborate() ) {
      if( Meteor.user().isBoardAdmin(doc.boardId) )
        return true;
      else if( userId === doc.userId)
        return true;
      else
        return false;
    }
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
    return Attachments.findOne(this.coverId);
  },

  absoluteUrl() {
    const board = this.board();
    return FlowRouter.path('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
    });
  },

  rootUrl() {
    return Meteor.absoluteUrl(this.absoluteUrl().replace('/', ''));
  },
});

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
    return { $addToSet: { labelIds: labelId }};
  },

  removeLabel(labelId) {
    return { $pull: { labelIds: labelId }};
  },

  toggleLabel(labelId) {
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {
      return this.removeLabel(labelId);
    } else {
      return this.addLabel(labelId);
    }
  },

  assignMember(memberId) {
    return { $addToSet: { members: memberId }};
  },

  unassignMember(memberId) {
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

Cards.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.dateLastActivity = new Date();
  doc.archived = false;
  doc.votes = 0;

  if (!doc.userId) 
    doc.userId = userId;
});


if (Meteor.isServer) {
  Cards.after.insert((userId, doc) => {
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
    if (_.contains(fieldNames, 'description')) 
      Cards.update(doc._id,{$set: {dateLastActivity: new Date()}});
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
