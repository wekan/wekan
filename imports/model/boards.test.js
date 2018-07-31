import {expect} from 'meteor/practicalmeteor:chai';
import {describe, it, afterEach} from 'meteor/practicalmeteor:mocha';
import {sinon, stubs} from 'meteor/practicalmeteor:sinon';
import {Meteor} from 'meteor/meteor';

if (Meteor.isServer) {
  require('../../server/lib/utils');
  require('../../models/boards');

  describe('Boards', function () {

    afterEach(function () {
      stubs.restoreAll();
    });

    it('insert() should fail for anonymous user', function () {
      Meteor.userId = sinon.stub().returns(undefined);
      expect(function () {
        Boards.insert({title: 'empty board'});
      }).to.throw(Error, /User id is required/);
    });

    describe('utils', function () {

      const userId = 'editingUserId';

      it('allowIsBoardAdmin() returns false if board does not exist', function () {
        expect(!!allowIsBoardAdmin(userId, undefined)).to.be.false;
        expect(!!allowIsBoardAdmin(userId, null)).to.be.false;
      });

      it('allowIsBoardAdmin() checks board.hasAdmin(userId)', function () {
        const board = Boards._transform({});

        board.hasAdmin = sinon.stub().returns(false);
        expect(allowIsBoardAdmin(userId, board)).to.be.false;

        board.hasAdmin = sinon.stub().returns(true);
        expect(allowIsBoardAdmin(userId, board)).to.be.true;
      });
    });
  });
}
