import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  copySwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = ReactiveCache.getBoard(toBoardId);

    if (swimlane && toBoard) {
      swimlane.copy(toBoardId);
      return true;
    }

    return false;
  },

  moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = ReactiveCache.getBoard(toBoardId);

    if (swimlane && toBoard) {
      swimlane.move(toBoardId);

      return true;
    }

    return false;
  },
});
