BlazeComponent.extendComponent({
  template: function() {
    return 'boardList';
  },

  boards: function() {
    return Boards.find({}, {
      sort: ['title']
    });
  },

  isStarred: function() {
    var user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  events: function() {
    return [{
      'click .js-add-board': Popup.open('createBoard'),
      'click .js-star-board': function(evt) {
        var boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      }
    }];
  }
}).register('boardList');
