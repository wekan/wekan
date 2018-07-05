/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
// import { Factory } from 'meteor/dburles:factory';
import { expect, should as shouldFunc } from 'meteor/practicalmeteor:chai';
import { Meteor } from 'meteor/meteor';

/*const should = */shouldFunc();

describe('Initial state', () => {
  it('has settings on server', () => {
    expect(Settings.find().count()).to.be.equal(Meteor.isServer ? 1 : 0);
    if (Meteor.isServer) {
      const stgs = Settings.findOne();
      expect(stgs.disableRegistration).to.be.false;
      expect(stgs.mailServer.username).to.be.empty;
      expect(stgs.mailServer.password).to.be.empty;
      expect(stgs.mailServer.host).to.be.empty;
      expect(stgs.mailServer.port).to.be.empty;
      expect(stgs.mailServer.enableTLS).to.be.false;
      expect(stgs.mailServer.from).to.startsWith('Wekan <wekan@');
      stgs.createdAt.should.be.a('date');
      stgs.modifiedAt.should.be.a('date');
    }
  });
});
