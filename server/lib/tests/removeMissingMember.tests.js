/* eslint-env mocha */
import { expect } from 'chai';
import { pullMemberById } from '../removeMember';

// Issue #5330: removing a board member whose user account has been deleted did
// nothing. The member entry references the user only by userId, so removal must
// work purely on that id, whether or not the Users document still exists.
describe('removeMember (issue #5330)', function() {
  describe(pullMemberById.name, function() {
    it('removes the entry matching the userId', function() {
      const members = [
        { userId: 'alice', isAdmin: true },
        { userId: 'ghost', isAdmin: false },
      ];
      const result = pullMemberById(members, 'ghost');
      expect(result.map(m => m.userId)).to.deep.equal(['alice']);
    });

    it('removes a deleted user even when only the userId is known', function() {
      // "ghost" has no corresponding Users document anymore; matching is purely
      // by the stored userId so the entry is still pulled.
      const members = [{ userId: 'ghost' }];
      expect(pullMemberById(members, 'ghost')).to.deep.equal([]);
    });

    it('leaves the other members untouched', function() {
      const members = [
        { userId: 'alice', isAdmin: true },
        { userId: 'bob', isAdmin: false },
        { userId: 'ghost' },
      ];
      const result = pullMemberById(members, 'ghost');
      expect(result).to.deep.equal([
        { userId: 'alice', isAdmin: true },
        { userId: 'bob', isAdmin: false },
      ]);
    });

    it('is a no-op when the userId is not present', function() {
      const members = [{ userId: 'alice' }, { userId: 'bob' }];
      const result = pullMemberById(members, 'nobody');
      expect(result.map(m => m.userId)).to.deep.equal(['alice', 'bob']);
    });

    it('tolerates an empty or missing members array', function() {
      expect(pullMemberById([], 'ghost')).to.deep.equal([]);
      expect(pullMemberById(undefined, 'ghost')).to.deep.equal([]);
      expect(pullMemberById(null, 'ghost')).to.deep.equal([]);
    });
  });
});
