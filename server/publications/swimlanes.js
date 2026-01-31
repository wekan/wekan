import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  async copySwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = await ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      swimlane.copy(toBoardId);
      ret = true;
    }

    return ret;
  },

  async moveSwimlane(swimlaneId, toBoardId) {
    check(swimlaneId, String);
    check(toBoardId, String);

    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = await ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      await swimlane.move(toBoardId);

      ret = true;
    }

    return ret;
  },
});
