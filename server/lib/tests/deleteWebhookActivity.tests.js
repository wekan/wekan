/* eslint-env mocha */
import { expect } from 'chai';
import {
  buildDeleteCardActivity,
  buildDeleteBoardActivity,
} from '../deleteActivities';

describe('deleteActivities', function() {
  describe(buildDeleteCardActivity.name, function() {
    it('builds a deleteCard activity with the card/list/swimlane/board ids', function() {
      const activity = buildDeleteCardActivity({
        userId: 'u1',
        cardId: 'c1',
        boardId: 'b1',
        listId: 'l1',
        swimlaneId: 's1',
        cardTitle: 'My card',
      });
      expect(activity).to.deep.equal({
        userId: 'u1',
        activityType: 'deleteCard',
        boardId: 'b1',
        listId: 'l1',
        cardId: 'c1',
        swimlaneId: 's1',
        cardTitle: 'My card',
      });
    });

    it('uses the deleteCard activityType so the outgoing webhook description is act-deleteCard', function() {
      const activity = buildDeleteCardActivity({ cardId: 'c1', boardId: 'b1' });
      expect(activity.activityType).to.equal('deleteCard');
    });

    it('omits cardTitle when not provided', function() {
      const activity = buildDeleteCardActivity({
        userId: 'u1',
        cardId: 'c1',
        boardId: 'b1',
        listId: 'l1',
        swimlaneId: 's1',
      });
      expect(activity).to.not.have.property('cardTitle');
      expect(activity.cardId).to.equal('c1');
    });

    it('tolerates being called with no argument', function() {
      const activity = buildDeleteCardActivity();
      expect(activity.activityType).to.equal('deleteCard');
      expect(activity.cardId).to.equal(undefined);
    });
  });

  describe(buildDeleteBoardActivity.name, function() {
    it('builds a deleteBoard activity mirroring the createBoard shape', function() {
      const activity = buildDeleteBoardActivity({ userId: 'u1', boardId: 'b1' });
      expect(activity).to.deep.equal({
        userId: 'u1',
        type: 'board',
        activityType: 'deleteBoard',
        activityTypeId: 'b1',
        boardId: 'b1',
      });
    });

    it('uses the deleteBoard activityType so the outgoing webhook description is act-deleteBoard', function() {
      const activity = buildDeleteBoardActivity({ boardId: 'b1' });
      expect(activity.activityType).to.equal('deleteBoard');
      expect(activity.activityTypeId).to.equal('b1');
    });

    it('tolerates being called with no argument', function() {
      const activity = buildDeleteBoardActivity();
      expect(activity.activityType).to.equal('deleteBoard');
      expect(activity.boardId).to.equal(undefined);
    });
  });
});
