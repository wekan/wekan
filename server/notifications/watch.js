import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  async watch(watchableType, id, level) {
    check(watchableType, String);
    check(id, String);
    check(level, Match.OneOf(String, null));

    const userId = Meteor.userId();

    let watchableObj = null;
    let board = null;
    if (watchableType === 'board') {
      watchableObj = await ReactiveCache.getBoard(id);
      if (!watchableObj) throw new Meteor.Error('error-board-doesNotExist');
      board = watchableObj;
    } else if (watchableType === 'list') {
      watchableObj = await ReactiveCache.getList(id);
      if (!watchableObj) throw new Meteor.Error('error-list-doesNotExist');
      board = await watchableObj.board();
    } else if (watchableType === 'card') {
      watchableObj = await ReactiveCache.getCard(id);
      if (!watchableObj) throw new Meteor.Error('error-card-doesNotExist');
      board = await watchableObj.board();
    } else {
      throw new Meteor.Error('error-json-schema');
    }

    if (board.permission === 'private' && !board.hasMember(userId))
      throw new Meteor.Error('error-board-notAMember');

    await watchableObj.setWatcher(userId, level);
    return true;
  },
});
