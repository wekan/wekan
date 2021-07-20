Meteor.methods({
  copySwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = Swimlanes.findOne(swimlaneId);
    const toBoard = Boards.findOne(toBoardId);

    if (swimlane && toBoard) {
      swimlane.copy(toBoardId);
      return true;
    }

    return false;
  },

  moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = Swimlanes.findOne(swimlaneId);
    const toBoard = Boards.findOne(toBoardId);

    if (swimlane && toBoard) {
      swimlane.move(toBoardId);

      return true;
    }

    return false;
  },
});
