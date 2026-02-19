/* global describe it */
import chai from 'chai';
import { ReactiveCache } from 'meteor-reactive-cache';
import { Tracker } from 'meteor/tracker';
import isEqual from 'lodash.isequal';

describe('ReactiveCache', () => {
  it('should be reactive', () => {
    const reactiveCache = new ReactiveCache();

    let runs = 0;
    Tracker.autorun(() => {
      runs += 1;
      const value = reactiveCache.get('foo'); // eslint-disable-line
    });

    chai.assert.equal(typeof reactiveCache.get('foo'), 'undefined');
    chai.assert.equal(runs, 1);

    reactiveCache.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(runs, 2);

    reactiveCache.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(runs, 2);

    reactiveCache.del('foo');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(typeof reactiveCache.get('foo'), 'undefined');
    chai.assert.equal(runs, 3);
  });

  it('should be reactive with custom compare', () => {
    const reactiveCache = new ReactiveCache();
    const reactiveObjCache = new ReactiveCache((a, b) => isEqual(a, b));

    reactiveCache.set('foo', { test: true });
    reactiveObjCache.set('foo', { test: true });

    let runs = 0;
    Tracker.autorun(() => {
      runs += 1;
      const value = reactiveCache.get('foo'); // eslint-disable-line
    });

    let runsObj = 0;
    Tracker.autorun(() => {
      runsObj += 1;
      const value = reactiveObjCache.get('foo'); // eslint-disable-line
    });

    chai.assert.equal(runs, 1);
    chai.assert.equal(runsObj, 1);

    reactiveCache.set('foo', { test: true });
    reactiveObjCache.set('foo', { test: true });
    Tracker.flush({ _throwFirstError: true });

    chai.assert.equal(runs, 2);
    chai.assert.equal(runsObj, 1);
  });

  it('gets invalidated if computation stops', (done) => {
    const reactiveCache = new ReactiveCache();

    let runs = 0;
    const computation = Tracker.autorun(() => {
      runs += 1;
      const value = reactiveCache.get('foo'); // eslint-disable-line
    });

    chai.assert.equal(typeof reactiveCache.get('foo'), 'undefined');
    chai.assert.equal(runs, 1);

    reactiveCache.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(reactiveCache.get('foo'), 'bar');
    chai.assert.equal(runs, 2);

    computation.stop();
    chai.assert.equal(typeof reactiveCache.get('foo'), 'undefined');
    setTimeout(() => {
      done();
    }, 200);
  });
});
