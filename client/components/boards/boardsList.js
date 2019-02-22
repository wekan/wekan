const subManager = new SubsManager();

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.boardListHeaderBar.helpers({
  templatesBoardId() {
      return Meteor.user().getTemplatesBoard().id;
  },
  templatesBoardSlug() {
      return Meteor.user().getTemplatesBoard().slug;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      type: 'board',
    }, {
      sort: ['title'],
    });
  },

  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  hasOvertimeCards() {
    subManager.subscribe('board', this.currentData()._id);
    return this.currentData().hasOvertimeCards();
  },

  hasSpentTimeCards() {
    subManager.subscribe('board', this.currentData()._id);
    return this.currentData().hasSpentTimeCards();
  },

  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [{
      'click .js-add-board': Popup.open('createBoard'),
      'click .js-star-board'(evt) {
        const boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      },
      'click .js-accept-invite'() {
        const boardId = this.currentData()._id;
        Meteor.user().removeInvite(boardId);
      },
      'click .js-decline-invite'() {
        const boardId = this.currentData()._id;
        Meteor.call('quitBoard', boardId, (err, ret) => {
          if (!err && ret) {
            Meteor.user().removeInvite(boardId);
            FlowRouter.go('home');
          }
        });
      },
    }];
  },
}).register('boardList');
