Meteor.methods({
  moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = Swimlanes.findOne(swimlaneId);
    const board = Boards.findOne(toBoardId);

    if (swimlane && board) {
      swimlane.lists().forEach(list => {
        const boardList = Lists.findOne({
          boardId: toBoardId,
          title: list.title,
          archived: false,
        });

        let toListId;
        if (boardList) {
          toListId = boardList._id;
        } else {
          toListId = Lists.insert({
            title: list.title,
            boardId: toBoardId,
            type: list.type,
            archived: false,
            wipLimit: list.wipLimit,
          });
        }

        Cards.find({
          listId: list._id,
          swimlaneId,
        }).forEach(card => {
          card.move(toBoardId, swimlaneId, toListId);
        });
      });

      Swimlanes.update(swimlaneId, {
        $set: {
          boardId: toBoardId,
        },
      });

      // make sure there is a default swimlane
      this.board().getDefaultSwimline();

      return true;
    }

    return false;
  },
});
