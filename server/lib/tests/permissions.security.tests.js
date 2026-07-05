/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { allowIsAnyBoardMemberWithWriteAccess } from '/server/lib/utils';
// Register the Meteor methods under test (meteor-test loads only what tests
// import; the app registers these via server/main.js → /server/imports).
import '/server/models/boards';   // archiveBoard
import '/server/models/settings'; // sendSMTPTestEmail

// Tests that client-side permission gates are also enforced server-side.
// See the "client-side permissions verified server-side" audit.
describe('server-side permission enforcement', function() {
  afterEach(function() {
    sinon.restore();
  });

  // Helper: build a board whose single member has the given role flags.
  const boardWithMember = (userId, flags = {}) => ({
    members: [Object.assign(
      { userId, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false, isReadOnly: false, isReadAssignedOnly: false },
      flags,
    )],
  });

  describe('allowIsAnyBoardMemberWithWriteAccess (CustomFields / multi-board write)', function() {
    it('denies a read-only member on every board', function() {
      const userId = 'ro';
      const boards = [boardWithMember(userId, { isReadOnly: true }), boardWithMember(userId, { isReadOnly: true })];
      expect(allowIsAnyBoardMemberWithWriteAccess(userId, boards)).to.equal(false);
    });

    it('denies comment-only and worker members', function() {
      const userId = 'co';
      expect(allowIsAnyBoardMemberWithWriteAccess(userId, [boardWithMember(userId, { isCommentOnly: true })])).to.equal(false);
      expect(allowIsAnyBoardMemberWithWriteAccess(userId, [boardWithMember(userId, { isWorker: true })])).to.equal(false);
    });

    it('denies a non-member', function() {
      expect(allowIsAnyBoardMemberWithWriteAccess('outsider', [boardWithMember('someone-else')])).to.equal(false);
    });

    it('allows a member with write access on at least one board', function() {
      const userId = 'writer';
      const boards = [boardWithMember(userId, { isReadOnly: true }), boardWithMember(userId)];
      expect(allowIsAnyBoardMemberWithWriteAccess(userId, boards)).to.equal(true);
    });
  });

  describe('archiveBoard (server/models/boards.js) — board-admin only', function() {
    const handler = () => Meteor.server.method_handlers['archiveBoard'];

    it('denies a non-admin board member', async function() {
      const archiveStub = sinon.stub().resolves();
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasAdmin: () => false, archive: archiveStub });
      sinon.stub(ReactiveCache, 'getUser').resolves({ isAdmin: false });
      let thrown;
      try {
        await handler().apply({ userId: 'member' }, ['board-1']);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-board-notAdmin');
      expect(archiveStub.called).to.equal(false);
    });

    it('allows a board admin', async function() {
      const archiveStub = sinon.stub().resolves();
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasAdmin: (id) => id === 'admin', archive: archiveStub });
      sinon.stub(ReactiveCache, 'getUser').resolves({ isAdmin: false });
      const result = await handler().apply({ userId: 'admin' }, ['board-1']);
      expect(result).to.equal(true);
      expect(archiveStub.calledOnce).to.equal(true);
    });

    it('allows a global admin who is not a board member', async function() {
      const archiveStub = sinon.stub().resolves();
      sinon.stub(ReactiveCache, 'getBoard').resolves({ hasAdmin: () => false, archive: archiveStub });
      sinon.stub(ReactiveCache, 'getUser').resolves({ isAdmin: true });
      const result = await handler().apply({ userId: 'siteadmin' }, ['board-1']);
      expect(result).to.equal(true);
      expect(archiveStub.calledOnce).to.equal(true);
    });
  });

  describe('sendSMTPTestEmail (server/models/settings.js) — global-admin only', function() {
    const handler = () => Meteor.server.method_handlers['sendSMTPTestEmail'];

    it('denies a non-admin authenticated user', async function() {
      sinon.stub(ReactiveCache, 'getCurrentUser').resolves({
        isAdmin: false,
        emails: [{ address: 'user@example.com' }],
        getLanguage: () => 'en',
      });
      let thrown;
      try {
        await handler().apply({ userId: 'user-1', unblock: () => {} }, []);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(thrown.error).to.equal('error-notAuthorized');
    });
  });
});
