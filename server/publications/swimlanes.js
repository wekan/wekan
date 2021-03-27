Meteor.methods({
  moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = Swimlanes.findOne(swimlaneId);
    const fromBoard = Boards.findOne(swimlane.boardId);
    const toBoard = Boards.findOne(toBoardId);

    if (swimlane && toBoard) {
      swimlane.lists().forEach(list => {
        const toList = Lists.findOne({
          boardId: toBoardId,
          title: list.title,
          archived: false,
        });

        let toListId;
        if (toList) {
          toListId = toList._id;
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
      fromBoard.getDefaultSwimline();

      return true;
    }

    return false;
  },
});
