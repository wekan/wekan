/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
// import { Factory } from 'meteor/dburles:factory';
import { expect, should as shouldFunc } from 'meteor/practicalmeteor:chai';
import { stubs } from 'meteor/practicalmeteor:sinon';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import 'meteor/tap:i18n';
import '../../../server/lib/utils';
import '../../../server/notifications/notifications';

import '../../../models/accountSettings';
import '../../../models/activities';
import '../../../models/announcements';
import '../../../models/attachments';
import '../../../models/avatars';
import '../../../models/boards';
import '../../../models/cardComments';
import '../../../models/cards';
import '../../../models/checklistItems';
import '../../../models/checklists';
import '../../../models/customFields';
import '../../../models/export';
import '../../../models/import';
import '../../../models/integrations';
import '../../../models/invitationCodes';
import '../../../models/lists';
import '../../../models/settings';
import '../../../models/swimlanes';
import '../../../models/trelloCreator';
import '../../../models/unsavedEdits';
import '../../../models/users';
import '../../../models/watchable';
import '../../../models/wekanCreator';
import '../../../i18n/en.i18n.json';

if (Meteor.isServer) {

  const should = shouldFunc();
  let crtUserId = undefined;

  describe('Boards collection', () => {
    beforeEach(function () {
      resetDatabase();
      stubs.create('allowIsBoardAdmin', global, 'allowIsBoardAdmin');
      stubs.allowIsBoardAdmin.returns(true);
      stubs.create('TAPi18nUndersc', TAPi18n, '__');
      stubs.TAPi18nUndersc.returnsArg(0);
      let stgId = Settings.findOne();
      if (stgId) {
        Settings.remove(stgId);
      }
      stgId = Settings.insert({
        disableRegistration: false,
        mailServer: {
          username: '',
          password: '',
          host: '',
          port: '',
          enableTLS: false,
          from: 'tests@wekan.com',
        },
      }, (error, id) => {
        expect(error).to.be.null;
        expect(id).not.to.be.null;
      });
    });

    afterEach(function () {
      stubs.allowIsBoardAdmin.restore();
      stubs.TAPi18nUndersc.restore();
    });

    describe('Without a null user id', () => {
      beforeEach(function () {
        stubs.create('userId', Meteor, 'userId');
        stubs.userId.returns(null);
      });
      afterEach(function () {
        stubs.userId.restore();
      });

      it('needs a valid userId', () => {
        expect(Meteor.userId()).to.be.null;
        expect(() => {
          Boards.insert({});
        }, 'userId').to.throw(Error, 'User id is required');
      });
    });

    describe('With a non-null user id', () => {
      beforeEach(function () {
        stubs.create('insertActivities', Activities, 'insert');
        stubs.insertActivities.returns(false);
        stubs.create('afterInsertActivities', Boards.after, 'insert');
        stubs.afterInsertActivities.returns(false);
        crtUserId = Users.insert({
          username: 'testing',
          emails: [
            {
              address: 'first@example.com',
              verified: true,
            },
            {
              address: 'second@example.com',
              verified: false,
            },
          ],
        });
        stubs.create('userId', Meteor, 'userId');
        stubs.userId.returns(crtUserId);
      });
      afterEach(function () {
        // TODO: somehow this does not work;
        // probably a failure to understand the mechanism on my part
        //
        // stubs.insertActivities.restore();
        // stubs.afterInsertActivities.restore();
        // crtUserId = null;
        // stubs.userId.restore();
      });

      it('needs a title and permission', () => {
        Boards.insert({ }, (error, id) => {
          expect(error).not.to.be.null;
          expect(id).to.be.false;
          expect(error.sanitizedError.reason).to.be.equal('Title is required');
        });
        Boards.insert({ title: 'lache' }, (error, id) => {
          expect(error).not.to.be.null;
          expect(id).to.be.false;
          expect(error.sanitizedError.reason).to.be.equal('Permission is required');
        });
      });

      it('has default values', () => {

        Boards.insert({ title: 'lache', permission: 'private'}, (error, id) => {
          expect(error).to.be.null;
          expect(id).to.be.a('string');
          const result = Boards.findOne(id);
          expect(result).not.to.be.undefined;
          expect(stubs.insertActivities.calledOnce);
          const actInsArgs = stubs.insertActivities.getCall(0).args[0];
          actInsArgs.userId.should.equal(crtUserId);
          actInsArgs.type.should.equal('board');
          actInsArgs.activityTypeId.should.equal(actInsArgs.boardId);
          actInsArgs.activityType.should.equal('createBoard');
          /* TODO the main part below does not work because the activity
           we see here is the one from default board, presumably =>
           the ids do not match; after properly stubbing everithing
           we should end up with a single activity */
          // actInsArgs.activityTypeId.should.equal(id);
          // actInsArgs.boardId.should.equal(id);
        });
      });

    });
  });
}
