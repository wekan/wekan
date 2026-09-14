import { requireBoardMutation } from '/models/lib/boardMutationGuard';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import { allowIsBoardMember, allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

Meteor.methods({
  async copySwimlane(swimlaneId, toBoardId, targetSwimlaneId = null, position = 'below', title = '') {
    check(swimlaneId, String);
    check(toBoardId, String);
    check(targetSwimlaneId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf('above', 'below'));
    check(title, Match.OneOf(String, null, undefined));

    if (!this.userId) throw new Meteor.Error('not-authorized');
    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    if (!swimlane) throw new Meteor.Error('not-found');
    const sourceBoard = await Boards.findOneAsync(swimlane.boardId);
    if (!allowIsBoardMember(this.userId, sourceBoard))
      throw new Meteor.Error('not-authorized');
    const toBoard = await ReactiveCache.getBoard(toBoardId);
    if (!toBoard) throw new Meteor.Error('not-found');
    if (!allowIsBoardMemberWithWriteAccess(this.userId, toBoard))
      throw new Meteor.Error('not-authorized');

    await swimlane.copy(toBoardId, targetSwimlaneId, position, title);
    return true;
  },

  async moveSwimlane(swimlaneId, toBoardId, targetSwimlaneId = null, position = 'below', title = '') {
    check(swimlaneId, String);
    check(toBoardId, String);
    check(targetSwimlaneId, Match.OneOf(String, null, undefined));
    check(position, Match.OneOf('above', 'below'));
    check(title, Match.OneOf(String, null, undefined));

    if (!this.userId) throw new Meteor.Error('not-authorized');
    const swimlane = await ReactiveCache.getSwimlane(swimlaneId);
    if (!swimlane) throw new Meteor.Error('not-found');
    const sourceBoard = await Boards.findOneAsync(swimlane.boardId);
    requireBoardMutation(this.userId, sourceBoard, 'moveSwimlane:source', Meteor);
    const toBoard = await ReactiveCache.getBoard(toBoardId);
    if (!toBoard) throw new Meteor.Error('not-found');
    requireBoardMutation(this.userId, toBoard, 'moveSwimlane:destination', Meteor);

    await swimlane.move(toBoardId, targetSwimlaneId, position, title);
    return true;
  },
});
