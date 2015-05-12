var toggleBoardStar = function(boardId) {
  var queryType = Meteor.user().hasStarred(boardId) ? '$pull' : '$addToSet';
  var query = {};
  query[queryType] = {
    'profile.starredBoards': boardId
  };
  Meteor.users.update(Meteor.userId(), query);
};

Template.boards.events({
  'click .js-star-board': function(evt) {
    toggleBoardStar(this._id);
    evt.preventDefault();
  }
});

Template.headerBoard.events({
  'click .js-star-board': function() {
    toggleBoardStar(this._id);
  },
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click #permission-level:not(.no-edit)': Popup.open('boardChangePermission'),
  'click .js-filter-cards-indicator': function(evt) {
    Session.set('currentWidget', 'filter');
    evt.preventDefault();
  },
  'click .js-filter-card-clear': function(evt) {
    Filter.reset();
    evt.stopPropagation();
  }
});

Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-change-board-color': Popup.open('boardChangeColor')
});

Template.createBoardPopup.events({
  'submit #CreateBoardForm': function(evt, t) {
    var title = t.$('#boardNewTitle');

    // trim value title
    if ($.trim(title.val())) {
      // İnsert Board title
      var boardId = Boards.insert({
        title: title.val(),
        permission: 'public'
      });

      // Go to Board _id
      Utils.goBoardId(boardId);
    }
    evt.preventDefault();
  }
});

Template.boardChangeTitlePopup.events({
  'submit #ChangeBoardTitleForm': function(evt, t) {
    var title = t.$('.js-board-name').val().trim();
    if (title) {
      Boards.update(this._id, {
        $set: {
          title: title
        }
      });
      Popup.close();
    }
    evt.preventDefault();
  }
});

Template.boardChangePermissionPopup.events({
  'click .js-select': function(evt) {
    var $this = $(evt.currentTarget);
    var permission = $this.attr('name');

    Boards.update(this._id, {
      $set: {
        permission: permission
      }
    });
    Popup.close();
  }
});

Template.boardChangeColorPopup.events({
  'click .js-select-background': function(evt) {
    var currentBoardId = Session.get('currentBoard');
    Boards.update(currentBoardId, {
      $set: {
        color: this.toString()
      }
    });
    evt.preventDefault();
  }
});
