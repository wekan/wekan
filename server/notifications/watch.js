import { ReactiveCache } from '/imports/reactiveCache';

Meteor.methods({
  watch(watchableType, id, level) {
    check(watchableType, String);
    check(id, String);
    check(level, Match.OneOf(String, null));

    const userId = Meteor.userId();

    let watchableObj = null;
    let board = null;
    if (watchableType === 'board') {
      watchableObj = ReactiveCache.getBoard(id);
      if (!watchableObj) throw new Meteor.Error('error-board-doesNotExist');
      board = watchableObj;
    } else if (watchableType === 'list') {
      watchableObj = ReactiveCache.getList(id);
      if (!watchableObj) throw new Meteor.Error('error-list-doesNotExist');
      board = watchableObj.board();
    } else if (watchableType === 'card') {
      watchableObj = ReactiveCache.getCard(id);
      if (!watchableObj) throw new Meteor.Error('error-card-doesNotExist');
      board = watchableObj.board();
    } else {
      throw new Meteor.Error('error-json-schema');
    }

    if (board.permission === 'private' && !board.hasMember(userId))
      throw new Meteor.Error('error-board-notAMember');

    watchableObj.setWatcher(userId, level);
    return true;
  },
});
