/* eslint-env mocha */
import { expect } from 'chai';
import {
  buildUserAnonymizationMap,
  anonymizeUserDoc,
  rewriteMentionsInText,
  anonymizeIdentityValue,
  anonymizeBoardTextInPlace,
} from '/models/lib/importExportSecurity';

// Unit tests for the Admin Panel / Features / Security "anonymize import/export
// users" helpers. These are the pure functions that scrub user identity out of an
// exported / imported board. Both positive (does anonymize) and negative (must NOT
// touch unrelated data) cases are covered.
describe('importExportSecurity — user anonymization helpers', function() {
  const users = [
    { _id: 'bbb', username: 'bob', profile: { fullname: 'Bob Real', initials: 'BR' } },
    { _id: 'aaa', username: 'alice', profile: { fullname: 'Alice Real', initials: 'AR' } },
  ];

  describe('buildUserAnonymizationMap', function() {
    it('assigns user1, user2 in deterministic _id order', function() {
      const map = buildUserAnonymizationMap(users, 'user');
      // Sorted by _id: 'aaa' -> user1, 'bbb' -> user2.
      expect(map.byId.get('aaa').username).to.equal('user1');
      expect(map.byId.get('bbb').username).to.equal('user2');
      expect(map.byId.get('aaa').initials).to.equal('U1');
      expect(map.byUsername.get('alice')).to.equal('user1');
      expect(map.byUsername.get('bob')).to.equal('user2');
    });

    it('uses the translated word for the placeholder prefix', function() {
      const map = buildUserAnonymizationMap(users, 'käyttäjä');
      expect(map.byId.get('aaa').username).to.equal('käyttäjä1');
      expect(map.byId.get('aaa').initials).to.equal('K1');
    });

    it('falls back to "user" when no word is given', function() {
      const map = buildUserAnonymizationMap([{ _id: 'x', username: 'z' }]);
      expect(map.byId.get('x').username).to.equal('user1');
    });

    it('skips entries without an _id (negative)', function() {
      const map = buildUserAnonymizationMap([null, {}, { username: 'no-id' }], 'user');
      expect(map.byId.size).to.equal(0);
      expect(map.byUsername.size).to.equal(0);
    });
  });

  describe('anonymizeUserDoc', function() {
    it('replaces identity fields and drops all avatar fields', function() {
      const map = buildUserAnonymizationMap(users, 'user');
      const doc = {
        _id: 'aaa',
        username: 'alice',
        profile: {
          fullname: 'Alice Real',
          initials: 'AR',
          avatarUrl: '/cdn/storage/avatars/xyz',
          avatarFile: 'BASE64',
          avatarFileName: 'a.png',
          avatarFileType: 'image/png',
        },
      };
      anonymizeUserDoc(doc, map);
      expect(doc.username).to.equal('user1');
      expect(doc.profile.fullname).to.equal('user1');
      expect(doc.profile.initials).to.equal('U1');
      expect(doc.profile.avatarUrl).to.equal(undefined);
      expect(doc.profile.avatarFile).to.equal(undefined);
      expect(doc.profile.avatarFileName).to.equal(undefined);
      expect(doc.profile.avatarFileType).to.equal(undefined);
    });

    it('leaves a user not present in the map unchanged (negative)', function() {
      const map = buildUserAnonymizationMap(users, 'user');
      const doc = { _id: 'zzz', username: 'zoe', profile: { fullname: 'Zoe' } };
      anonymizeUserDoc(doc, map);
      expect(doc.username).to.equal('zoe');
      expect(doc.profile.fullname).to.equal('Zoe');
    });
  });

  describe('rewriteMentionsInText', function() {
    let byUsername;
    beforeEach(function() {
      byUsername = buildUserAnonymizationMap(users, 'user').byUsername;
    });

    it('rewrites a known @mention', function() {
      expect(rewriteMentionsInText('hi @alice and @bob', byUsername))
        .to.equal('hi @user1 and @user2');
    });

    it('leaves an unknown @mention untouched (negative)', function() {
      expect(rewriteMentionsInText('hi @carol', byUsername)).to.equal('hi @carol');
    });

    it('does not treat an email address as a mention (negative)', function() {
      expect(rewriteMentionsInText('mail alice@bob.com', byUsername))
        .to.equal('mail alice@bob.com');
    });

    it('returns empty / non-string text unchanged (negative)', function() {
      expect(rewriteMentionsInText('', byUsername)).to.equal('');
      expect(rewriteMentionsInText(null, byUsername)).to.equal(null);
      expect(rewriteMentionsInText(undefined, byUsername)).to.equal(undefined);
    });

    it('returns text unchanged when the map is empty (negative)', function() {
      expect(rewriteMentionsInText('hi @alice', new Map())).to.equal('hi @alice');
    });
  });

  describe('anonymizeIdentityValue', function() {
    it('replaces a value that exactly matches a known username', function() {
      const byUsername = buildUserAnonymizationMap(users, 'user').byUsername;
      expect(anonymizeIdentityValue('alice', byUsername)).to.equal('user1');
    });

    it('leaves a non-matching value unchanged (negative)', function() {
      const byUsername = buildUserAnonymizationMap(users, 'user').byUsername;
      expect(anonymizeIdentityValue('someone-else', byUsername)).to.equal('someone-else');
      expect(anonymizeIdentityValue(undefined, byUsername)).to.equal(undefined);
    });
  });

  describe('anonymizeBoardTextInPlace', function() {
    it('rewrites card title/description + requestedBy/assignedBy and comment text', function() {
      const byUsername = buildUserAnonymizationMap(users, 'user').byUsername;
      const board = {
        cards: [{ title: 'for @alice', description: 'ping @bob', requestedBy: 'alice', assignedBy: 'bob' }],
        comments: [{ text: '@alice look' }],
      };
      anonymizeBoardTextInPlace(board, byUsername);
      expect(board.cards[0].title).to.equal('for @user1');
      expect(board.cards[0].description).to.equal('ping @user2');
      expect(board.cards[0].requestedBy).to.equal('user1');
      expect(board.cards[0].assignedBy).to.equal('user2');
      expect(board.comments[0].text).to.equal('@user1 look');
    });

    it('does not throw on a board with no cards/comments (negative)', function() {
      expect(() => anonymizeBoardTextInPlace({}, new Map())).to.not.throw();
      expect(() => anonymizeBoardTextInPlace(null, new Map())).to.not.throw();
    });
  });
});
