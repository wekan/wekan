CardComments = new Mongo.Collection('card_comments');

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

CardComments.allow({
  insert(userId, doc) {
    // // todo: separate permision for list comment, chat last condition to Meteor.user().isBoardMember(doc.boardId)))
    if( Boards.findOne(doc.boardId).isPublic() || Boards.findOne(doc.boardId).isPrivate())
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    else if( Boards.findOne(doc.boardId).isCollaborate() ) {
      if( ( Cards.findOne(cardId).list().permission === 'admn' &&Meteor.user().isBoardAdmin(doc.boardId) )||
        ( Cards.findOne(cardId).list().permission === 'registered' && Meteor.user()) || 
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

CardComments.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

CardComments.hookOptions.after.update = { fetchPrevious: false };

CardComments.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.userId = userId;
});

if (Meteor.isServer) {
  CardComments.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addComment',
      boardId: doc.boardId,
      cardId: doc.cardId,
      commentId: doc._id,
    });
  });

  CardComments.after.remove((userId, doc) => {
    const activity = Activities.findOne({ commentId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}
