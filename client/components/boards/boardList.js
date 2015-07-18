BlazeComponent.extendComponent({
  template: function() {
    return 'boardList';
  },

  boards: function() {
    return Boards.find({}, {
      sort: ['title']
    });
  },

  starredBoards: function() {
    var cursor = Boards.find({
      _id: { $in: Meteor.user().profile.starredBoards || [] }
    }, {
      sort: ['title']
    });
    return cursor.count() === 0 ? null : cursor;
  },

  isStarred: function() {
    var user = Meteor.user();
    return user && user.hasStarred(this._id);
  },

  events: function() {
    return [{
      'click .js-add-board': Popup.open('createBoard'),
      'click .js-star-board': function(evt) {
        Meteor.user().toggleBoardStar(this._id);
        evt.preventDefault();
      }
    }];
  }
}).register('boardList');
