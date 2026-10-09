/* global describe it */
import { getGlobal } from 'meteor-globals';
import { Meteor } from 'meteor/meteor';
import { chai } from 'meteor/practicalmeteor:chai';

describe('getGlobal', () => {
  it('should get a Meteor global', () => {
    const meteor = getGlobal('meteor', 'Meteor');
    chai.assert.equal(meteor.isClient, Meteor.isClient);
    chai.assert.equal(meteor.isServer, Meteor.isServer);
  });
});
