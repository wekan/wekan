/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Lists from '/models/lists';
import { Exporter } from '/models/exporter';
// Register the Meteor methods under test. The meteor-test entry only loads what
// test files import; the app registers these via server/main.js → /server/imports.
import '/models/import';            // cloneBoard
import '/server/models/boards';     // getBackgroundImageURL
import '/server/models/users';      // applyListWidth
import '/server/models/lists';      // updateListSort
import '/server/models/checklists'; // moveChecklist
import '/server/models/userPositionHistory'; // userPositionHistory.*

// Regression tests for the CloneBleed group of authorization fixes:
// server-side methods whose access checks were missing or silently never ran.
// See docs/hall-of-fame/clonebleed/ and the Upcoming release CHANGELOG entry.
describe('CloneBleed authorization', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('cloneBoard (models/import.js) — GHSA-qfqv-42qw-vvwh', function() {
    const handler = () => Meteor.server.method_handlers['cloneBoard'];

    it('is registered as a Meteor method', function() {
      expect(handler()).to.be.a('function');
    });

    it('denies anonymous (not logged in) callers', async function() {
      let thrown;
      try {
        await handler().apply({ userId: null }, ['target-board', null]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
    });

    it('denies a user who is not allowed to export (read) the source board', async function() {
      sinon.stub(ReactiveCache, 'getUser').resolves({ _id: 'attacker' });
      // canExport is the same guard the REST export route uses; here it denies.
      sinon.stub(Exporter.prototype, 'canExport').resolves(false);
      // build() must never be reached when canExport denies.
      const buildStub = sinon.stub(Exporter.prototype, 'build').resolves({});

      let thrown;
      try {
        await handler().apply({ userId: 'attacker' }, ['private-board', null]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
      expect(buildStub.called).to.equal(false);
    });
  });

  describe('getBackgroundImageURL (server/models/boards.js)', function() {
    const handler = () => Meteor.server.method_handlers['getBackgroundImageURL'];

    it('denies returning the background of a board the caller cannot see', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves({ isVisibleBy: () => false });
      let thrown;
      try {
        await handler().apply({ userId: 'outsider' }, ['private-board']);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
    });

    it('returns the board background when the caller may see the board', async function() {
      const board = { isVisibleBy: () => true, backgroundImageUrl: 'https://example/bg.png' };
      sinon.stub(ReactiveCache, 'getBoard').resolves(board);
      const result = await handler().apply({ userId: 'member' }, ['board-1']);
      expect(result).to.equal(board);
    });
  });

  describe('applyListWidth (server/models/users.js)', function() {
    const handler = () => Meteor.server.method_handlers['applyListWidth'];

    it('denies anonymous (not logged in) callers — anonymous view changes stay in localStorage, never MongoDB', async function() {
      let thrown;
      try {
        await handler().apply({ userId: null }, ['board-1', 'list-1', 100, 0]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-logged-in');
    });

    it('denies non-members from changing per-board list width', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasMember: () => false });
      let thrown;
      try {
        await handler().apply({ userId: 'outsider' }, ['board-1', 'list-1', 100, 0]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
    });

    it('denies updating a list that does not belong to the named board', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasMember: () => true });
      sinon.stub(ReactiveCache, 'getList').resolves({ boardId: 'other-board' });
      let thrown;
      try {
        await handler().apply({ userId: 'member' }, ['board-1', 'list-1', 100, 0]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
    });

    it('allows a member to update width of a list on the board', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasMember: () => true });
      sinon.stub(ReactiveCache, 'getList').resolves({ boardId: 'board-1' });
      const updateStub = sinon.stub(Lists, 'updateAsync').resolves(1);
      const result = await handler().apply({ userId: 'member' }, ['board-1', 'list-1', 120, 0]);
      expect(result).to.equal(true);
      expect(updateStub.calledOnce).to.equal(true);
    });
  });

  describe('updateListSort (server/models/lists.js)', function() {
    const handler = () => Meteor.server.method_handlers['updateListSort'];
    // updateListSort gates on hasBoardWriteAccess, which (when the optional
    // allowIsBoardMemberWithWriteAccess helper is not present) calls board
    // predicate methods — so the mock must expose them, not just a members array.
    const writeMember = (userId) => {
      const members = [{ userId, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false }];
      const flag = (id, key) => { const m = members.find(x => x.userId === id); return !!(m && m[key]); };
      return {
        members,
        hasMember: id => members.some(m => m.userId === id && m.isActive),
        hasNoComments: id => flag(id, 'isNoComments'),
        hasCommentOnly: id => flag(id, 'isCommentOnly'),
        hasWorker: id => flag(id, 'isWorker'),
        hasReadOnly: id => flag(id, 'isReadOnly'),
        hasReadAssignedOnly: id => flag(id, 'isReadAssignedOnly'),
      };
    };

    it('denies anonymous callers', async function() {
      let thrown;
      try {
        await handler().apply({ userId: null }, ['list-1', 'board-1', { sort: 1 }]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-authorized');
    });

    it('denies callers without board write access', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves(writeMember('someone-else'));
      let thrown;
      try {
        await handler().apply({ userId: 'attacker' }, ['list-1', 'board-1', { sort: 1 }]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('permission-denied');
    });

    it('denies sorting a list that does not belong to the named board', async function() {
      sinon.stub(ReactiveCache, 'getBoard').resolves(writeMember('member'));
      sinon.stub(ReactiveCache, 'getList').resolves({ boardId: 'other-board' });
      let thrown;
      try {
        await handler().apply({ userId: 'member' }, ['list-1', 'board-1', { sort: 1 }]);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('permission-denied');
    });
  });

  describe('userPositionHistory.* (server/models/userPositionHistory.js) — PositionHistoryBleed class', function() {
    const names = [
      'userPositionHistory.createCheckpoint',
      'userPositionHistory.getRecent',
      'userPositionHistory.getCheckpoints',
    ];
    const argsFor = {
      'userPositionHistory.createCheckpoint': ['private-board', 'cp'],
      'userPositionHistory.getRecent': ['private-board', 10],
      'userPositionHistory.getCheckpoints': ['private-board'],
    };

    names.forEach(name => {
      it(`${name} denies callers who cannot see the board`, async function() {
        const handler = Meteor.server.method_handlers[name];
        expect(handler).to.be.a('function');
        sinon.stub(ReactiveCache, 'getBoard').resolves({ isVisibleBy: () => false });
        let thrown;
        try {
          await handler.apply({ userId: 'outsider' }, argsFor[name]);
        } catch (error) {
          thrown = error;
        }
        expect(thrown).to.exist;
        expect(thrown.error).to.equal('not-authorized');
      });
    });
  });

  describe('moveChecklist (server/models/checklists.js)', function() {
    const handler = () => Meteor.server.method_handlers['moveChecklist'];

    it('denies anonymous callers', async function() {
      let thrown;
      try {
        await handler().apply({ userId: null }, ['checklist-1', 'card-1']);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-authorized');
    });

    it('denies moving a checklist from a source card on a board the caller cannot access', async function() {
      sinon.stub(ReactiveCache, 'getChecklist').resolves({ _id: 'checklist-1', cardId: 'source-card' });
      sinon.stub(ReactiveCache, 'getCard').resolves({ _id: 'card', boardId: 'board-1' });
      // allowIsBoardMemberByCard resolves the board via Boards.findOneAsync; deny membership.
      sinon.stub(Boards, 'findOneAsync').resolves({ hasMember: () => false });

      let thrown;
      try {
        await handler().apply({ userId: 'outsider' }, ['checklist-1', 'target-card']);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('not-authorized');
    });
  });
});
