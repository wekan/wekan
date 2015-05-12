Template.filterSidebar.events({
  'click .js-toggle-label-filter': function(event) {
    Filter.labelIds.toogle(this._id);
    Filter.resetExceptions();
    event.preventDefault();
  },
  'click .js-toogle-member-filter': function(event) {
    Filter.members.toogle(this._id);
    Filter.resetExceptions();
    event.preventDefault();
  },
  'click .js-clear-all': function(event) {
    Filter.reset();
    event.preventDefault();
  }
});

var getMemberIndex = function(board, searchId) {
  for (var i = 0; i < board.members.length; i++) {
    if (board.members[i].userId === searchId)
      return i;
  }
  throw new Meteor.Error('Member not found');
};

Template.memberPopup.events({
  'click .js-filter-member': function() {
    Filter.members.toogle(this.userId);
    Popup.close();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    var memberIndex = getMemberIndex(currentBoard, this.userId);
    var setQuery = {};
    setQuery[['members', memberIndex, 'isActive'].join('.')] = false;
    Boards.update(currentBoard._id, { $set: setQuery });
    Popup.close();
  }),
  'click .js-leave-member': function() {
    // @TODO
    Popup.close();
  }
});

Template.membersWidget.events({
  'click .js-open-manage-board-members': Popup.open('addMember'),
  'click .member': Popup.open('member')
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel')
});

// Template.addMemberPopup.events({
//   'click .pop-over-member-list li:not(.disabled)': function(event, t) {
//     var userId = this._id;
//     var boardId = t.data.board._id;
//     var currentMembersIds = _.pluck(t.data.board.members, 'userId');
//     if (currentMembersIds.indexOf(userId) === -1) {
//       Boards.update(boardId, {
//         $push: {
//           members: {
//             userId: userId,
//             isAdmin: false,
//             isActive: true
//           }
//         }
//       });
//     } else {
//       var memberIndex = getMemberIndex(t.data.board, userId);
//       var setQuery = {};
//       setQuery[['members', memberIndex, 'isActive'].join('.')] = true;
//       Boards.update(boardId, { $set: setQuery });
//     }
//     Popup.close();
//   }
// });

// Template.changePermissionsPopup.events({
//   'click .js-set-admin, click .js-set-normal': function(event) {
//     var currentBoard = Boards.findOne(Session.get('currentBoard'));
//     var memberIndex = getMemberIndex(currentBoard, this.user._id);
//     var isAdmin = $(event.currentTarget).hasClass('js-set-admin');
//     var setQuery = {};
//     setQuery[['members', memberIndex, 'isAdmin'].join('.')] = isAdmin;
//     Boards.update(currentBoard._id, {
//       $set: setQuery
//     });
//     Popup.back(1);
//   }
// });
