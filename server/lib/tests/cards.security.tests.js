/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Random } from 'meteor/random';
import { canUpdateCard } from '/server/permissions/cards';
import Boards from '/models/boards';

// Unit tests for canUpdateCard policy (deny direct vote updates)
describe('cards security', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe(canUpdateCard.name, function() {
    const userId = 'user1';

    it('denies anonymous users', async function() {
      expect(await canUpdateCard(null, {}, ['title'])).to.equal(false);
    });

    it('denies direct vote updates', async function() {
      expect(await canUpdateCard(userId, {}, ['vote'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['vote', 'modifiedAt', 'dateLastActivity'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['vote.positive'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['vote.negative'])).to.equal(false);
    });

    it('denies direct poker updates', async function() {
      expect(await canUpdateCard(userId, {}, ['poker'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['poker.one'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['poker.allowNonBoardMembers'])).to.equal(false);
      expect(await canUpdateCard(userId, {}, ['poker.end'])).to.equal(false);
    });

    it('allows member updates when not touching vote', async function() {
      const board = {
        members: [{ userId, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false }],
      };
      sinon.stub(Boards, 'findOneAsync').resolves(board);
      const doc = { boardId: 'board1' };
      expect(await canUpdateCard(userId, doc, ['title'])).to.equal(true);
      expect(await canUpdateCard(userId, doc, ['description', 'modifiedAt'])).to.equal(true);
    });

    it('denies non-members even when not touching vote', async function() {
      const board = {
        members: [{ userId: 'other-user', isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false }],
      };
      sinon.stub(Boards, 'findOneAsync').resolves(board);
      const nonMemberId = Random.id();
      expect(await canUpdateCard(nonMemberId, { boardId: 'board1' }, ['title'])).to.equal(false);
    });
  });
});
