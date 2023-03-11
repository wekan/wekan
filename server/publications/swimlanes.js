import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  copySwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      swimlane.copy(toBoardId);
      ret = true;
    }

    return ret;
  },

  moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      swimlane.move(toBoardId);

      ret = true;
    }

    return ret;
  },
});
