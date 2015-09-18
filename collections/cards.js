Cards = new Mongo.Collection('cards');
CardComments = new Mongo.Collection('card_comments');

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

CardComments.attachSchema(new SimpleSchema({
  boardId: {
    type: String,
  },
  cardId: {
    type: String,
  },
  // XXX Rename in `content`? `text` is a bit vague...
  text: {
    type: String,
  },
  // XXX We probably don't need this information here, since we already have it
  // in the associated comment creation activity
  createdAt: {
    type: Date,
    denyUpdate: false,
  },
  // XXX Should probably be called `authorId`
  userId: {
    type: String,
  },
}));

if (Meteor.isServer) {
  Cards.allow({
    insert(userId, doc) {
      if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
        return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
      else if( Boards.findOne(doc.boardId).isCollaborate() ) {
        if( Meteor.user().isBoardAdmin(doc.boardId) )
          return true;
        else if( ( this.list().permission === 'registered' && Meteor.user()) || 
          ( this.list().permission === 'member' && Meteor.user().isBoardMember(doc.boardId)))
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

  CardComments.allow({
    insert(userId, doc) {
      if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
        return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
      else if( Boards.findOne(doc.boardId).isCollaborate() ) {
        if( Meteor.user().isBoardAdmin(doc.boardId) )
          return true;
        else if( ( Cards.findOne(cardId).list().permission === 'registered' && Meteor.user()) || 
          ( Cards.findOne(cardId).list().permission === 'member' && Meteor.user().isBoardMember(doc.boardId)))
          return true;
        else
          return false;
      } 
    },
    update(userId, doc) {
      return userId === doc.userId;
    },
    remove(userId, doc) {
      return userId === doc.userId;
    },
    fetch: ['userId', 'boardId'],
  });
}

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

CardComments.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

CardComments.hookOptions.after.update = { fetchPrevious: false };
Cards.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.dateLastActivity = new Date();

  // defaults
  doc.archived = false;
  doc.votes = 0;

  // userId native set.
  if (!doc.userId)
    doc.userId = userId;
});

CardComments.before.insert((userId, doc) => {
  doc.createdAt = new Date();
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

  CardComments.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addComment',
      boardId: doc.boardId,
      cardId: doc.cardId,
      commentId: doc._id,
    });
    Cards.update(doc.cardId, {$set: {dateLastActivity: new Date()}});
  });

  CardComments.after.remove((userId, doc) => {
    const activity = Activities.findOne({ commentId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}
