/* global describe it */
import chai from 'chai';
import { DataCache } from 'meteor-reactive-cache';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';

describe('DataCache', () => {
  it('should be reactive', (done) => {
    const reactiveDict = new ReactiveDict();
    reactiveDict.set('foo', '000');
    let numGets = 0;
    const reactiveCache = new DataCache((key) => {
      numGets += 1;
      return reactiveDict.get(key);
    }, {
      timeout: 10,
    });

    let runs = 0;
    const computation = Tracker.autorun(() => {
      runs += 1;
      const value = reactiveCache.get('foo'); // eslint-disable-line
    });

    chai.assert.equal(reactiveCache.get('foo'), '000');
    chai.assert.equal(numGets, 1);
    chai.assert.equal(runs, 1);

    reactiveDict.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(numGets, 2);
    chai.assert.equal(runs, 2);

    reactiveDict.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(numGets, 2);
    chai.assert.equal(runs, 2);


    computation.stop();

    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(numGets, 2);

    Meteor.setTimeout(() => {
      chai.assert.equal(reactiveCache.get('foo'), 'bar');
      chai.assert.equal(numGets, 3);
      done();
    }, 50);
  });
});
