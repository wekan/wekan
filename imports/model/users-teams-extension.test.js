import { expect } from 'meteor/practicalmeteor:chai';
import { it, describe, beforeEach, afterEach } from 'meteor/practicalmeteor:mocha';
import { sinon, stubs } from 'meteor/practicalmeteor:sinon';
import { Teams } from '/imports/model/teams';
import '/imports/model/users-teams-extension';

describe('Users', () => {
  const userId = '12345-test-user';
  let user;

  describe('helpers', () => {

    beforeEach(() => {
      user = Users._transform({
        _id: userId,
      });
    });

    afterEach(() => {
      stubs.restoreAll();
    });

    it('teams() should query "Teams" collection', function () {
      Teams.find = sinon.stub().returns({});
      user.teams();
      expect(Teams.find).calledWith({ members: userId });
    });
  });
});
