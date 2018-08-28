Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('archivedBoards');
  },

  archivedBoards() {
    return Boards.find({ archived: true }, {
      sort: ['title'],
    });
  },

  events() {
    return [{
      'click .js-restore-board'() {
        // TODO : Make isSandstorm variable global
        const isSandstorm = Meteor.settings && Meteor.settings.public &&
          Meteor.settings.public.sandstorm;
        if (isSandstorm && Session.get('currentBoard')) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          currentBoard.archive();
        }
        const board = this.currentData();
        board.restore();
        Utils.goBoardId(board._id);
      },
      // TO DO: Need a pop-up or warning before board deletion - this.currentData() doesn't work after the popup.
      //'click .js-delete-board': Popup.afterConfirm('boardDelete', function() {
      //  Popup.close();
      'click .js-delete-board'(){
        const isSandstorm = Meteor.settings && Meteor.settings.public &&
          Meteor.settings.public.sandstorm;
        if (isSandstorm && Session.get('currentBoard')) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          Boards.remove(currentBoard._id);
        }
        const board = this.currentData();
        Boards.remove(board._id);
        FlowRouter.go('home');
      },
      //}),
    }];
  },
}).register('archivedBoards');
