/* global describe it */
import { Meteor } from 'meteor/meteor';
import { ensureDependency } from 'meteor-globals';
import { chai } from 'meteor/practicalmeteor:chai';

describe('ensureDependency', () => {
  it('should ensure a dependency', () => {
    chai.assert.equal(ensureDependency('tracker'), false);
    chai.assert.equal(ensureDependency('tracker@1.1.3'), false);
    if (Meteor.isServer) {
      const trackerDep = ensureDependency('tracker@10.0.0');
      chai.assert.equal(trackerDep.name, 'tracker');
      chai.assert.equal(trackerDep.neededVersion, '10.0.0');
      chai.assert.equal(trackerDep.installedVersion, '1.1.3');
    }
  });
});
