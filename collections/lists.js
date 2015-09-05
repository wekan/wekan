Lists = new Mongo.Collection('lists');

Lists.attachSchema(new SimpleSchema({
  title: {
    type: String
  },
  archived: {
    type: Boolean
  },
  boardId: {
    type: String
  },
  createdAt: {
    type: Date,
    denyUpdate: true
  },
  
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true
  },
  updatedAt: {
    type: Date,
    denyInsert: true,
    optional: true
  }
}));

if (Meteor.isServer) {
  Lists.allow({
    insert: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    update: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    remove: function(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    fetch: ['boardId']
  });
}

Lists.helpers({
  cards: function() { 
    var sortType = Session.get("currentBoardSort");

    if( !sortType )
      sortType = this.board.sortType;
    if( !sortType )
      sortType = 'sort';

    var slector = {
      listId: this._id,
      archived: false
    };

    // var ret = new Mongo.Collection("");
    // var cards = Cards.find(Filter.mongoSelector(slector), { sort: [sortType] });

    // // miniMongo dont have index now!
    // var searchText = Session.get('currentBoardSearchText');
    // if( searchText ){
    //   for( var i=cards.length-1;i--;i>=0)
    //       {
            
    //         if( cards[i].title.indexOf(text) > 0 )
    //           //cards.splice(i,1); 
    //           ret
             
    //       }    
    // }
    // else
    //   ret = cards;
       
    return Cards.find(Filter.mongoSelector(slector), { sort: [sortType] });
  },
  board: function() {
    return Boards.findOne(this.boardId);
  }
});

// HOOKS
Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.before.insert(function(userId, doc) {
  doc.createdAt = new Date();
  doc.archived = false;

  if (! doc.userId)
    doc.userId = userId;
});

Lists.before.update(function(userId, doc, fieldNames, modifier) {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Lists.after.insert(function(userId, doc) {
    Activities.insert({
      type: 'list',
      activityType: 'createList',
      boardId: doc.boardId,
      listId: doc._id,
      userId: userId
    });
  });

  Lists.after.update(function(userId, doc) {
    if (doc.archived) {
      Activities.insert({
        type: 'list',
        activityType: 'archivedList',
        listId: doc._id,
        boardId: doc.boardId,
        userId: userId
      });
    }
  });
}
