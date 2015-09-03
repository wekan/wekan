Template.headerTitle.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'archivedBoards';
  },

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
        const boardId = this.currentData()._id;
        Boards.update(boardId, {
          $set: {
            archived: false,
          },
        });
        Utils.goBoardId(boardId);
      },
    }];
  },
}).register('archivedBoards');
