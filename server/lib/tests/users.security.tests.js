/* eslint-env mocha */
import { expect } from 'chai';
import { isUserUpdateAllowed, hasForbiddenUserUpdateField } from '/models/users';

describe('users security', function() {
  describe('isUserUpdateAllowed', function() {
    it('allows username update', function() {
      expect(isUserUpdateAllowed(['username'])).to.equal(true);
    });
    it('allows profile updates', function() {
      expect(isUserUpdateAllowed(['profile.fullname'])).to.equal(true);
      expect(isUserUpdateAllowed(['profile.avatarUrl', 'profile.language'])).to.equal(true);
    });
    it('denies other top-level fields', function() {
      expect(isUserUpdateAllowed(['orgs'])).to.equal(false);
      expect(isUserUpdateAllowed(['teams'])).to.equal(false);
      expect(isUserUpdateAllowed(['loginDisabled'])).to.equal(false);
      expect(isUserUpdateAllowed(['authenticationMethod'])).to.equal(false);
      expect(isUserUpdateAllowed(['services'])).to.equal(false);
      expect(isUserUpdateAllowed(['emails'])).to.equal(false);
      expect(isUserUpdateAllowed(['isAdmin'])).to.equal(false);
    });
  });

  describe('hasForbiddenUserUpdateField', function() {
    it('flags forbidden sensitive fields', function() {
      expect(hasForbiddenUserUpdateField(['orgs'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['teams'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['loginDisabled'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['authenticationMethod'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['services.facebook'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['emails.0.verified'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['roles'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['isAdmin'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['createdThroughApi'])).to.equal(true);
      expect(hasForbiddenUserUpdateField(['sessionData.totalHits'])).to.equal(true);
    });
    it('does not flag allowed fields', function() {
      expect(hasForbiddenUserUpdateField(['username'])).to.equal(false);
      expect(hasForbiddenUserUpdateField(['profile.fullname'])).to.equal(false);
    });
  });
});
