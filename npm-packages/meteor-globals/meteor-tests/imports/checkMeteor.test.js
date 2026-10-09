/* global describe it */
import { checkMeteor } from 'meteor-globals';
import { chai } from 'meteor/practicalmeteor:chai';

describe('checkMeteor', () => {
  it('should check if executed from meteor project', () => {
    chai.assert.equal(checkMeteor(), true);
    chai.assert.equal(checkMeteor({ fileCheck: true }), true);
    chai.assert.equal(checkMeteor({ globalCheck: true }), true);
  });
});
