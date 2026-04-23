import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  async copySwimlane(swimlaneId, toBoardId, targetSwimlaneId = null, position = 'below', title = '') {
    check(swimlaneId, String);
    check(toBoardId, String);
    check(targetSwimlaneId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf('above', 'below'));
    check(title, Match.OneOf(String, null, undefined));

    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = await ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      await swimlane.copy(toBoardId, targetSwimlaneId, position, title);
      ret = true;
    }

    return ret;
  },

  async moveSwimlane(swimlaneId, toBoardId, targetSwimlaneId = null, position = 'below', title = '') {
    check(swimlaneId, String);
    check(toBoardId, String);
    check(targetSwimlaneId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf('above', 'below'));
    check(title, Match.OneOf(String, null, undefined));

    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    const toBoard = await ReactiveCache.getBoard(toBoardId);

    let ret = false;
    if (swimlane && toBoard) {
      await swimlane.move(toBoardId, targetSwimlaneId, position, title);

      ret = true;
    }

    return ret;
  },
});
