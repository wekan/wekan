/* global describe it */
import chai from 'chai';
import { reactiveField } from 'meteor-reactive-cache';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

describe('reactiveField', () => {
  it('should be reactive', (done) => {
    const reactiveDict = new ReactiveDict();
    reactiveDict.set('foo', '000');
    let numGets = 0;
    const field = reactiveField((key) => {
      numGets += 1;
      return reactiveDict.get(key);
    }, {
      timeout: 10,
    });

    let runs = 0;
    const computation = Tracker.autorun(() => {
      runs += 1;
      const value = field('foo'); // eslint-disable-line
    });

    chai.assert.equal(field('foo'), '000');
    chai.assert.equal(numGets, 1);
    chai.assert.equal(runs, 1);

    reactiveDict.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(field('foo'), 'bar');
    chai.assert.equal(numGets, 2);
    chai.assert.equal(runs, 2);

    reactiveDict.set('foo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(field('foo'), 'bar');
    chai.assert.equal(numGets, 2);
    chai.assert.equal(runs, 2);


    computation.stop();

    chai.assert.equal(field('foo'), 'bar');
    chai.assert.equal(numGets, 2);

    Meteor.setTimeout(() => {
      chai.assert.equal(field('foo'), 'bar');
      chai.assert.equal(numGets, 3);
      done();
    }, 50);
  });

  it('should be reactive with complex values', () => {
    const reactiveDict = new ReactiveDict();
    reactiveDict.set('foo', { date: new Date('2018-01-01') });
    let numGets = 0;
    const field = reactiveField((key) => {
      numGets += 1;
      return reactiveDict.get(key);
    }, {
      timeout: 10,
    });

    let runs = 0;
    const computation = Tracker.autorun(() => {
      runs += 1;
      const value = field('foo'); // eslint-disable-line
    });

    chai.assert.instanceOf(field('foo').date, Date);
    chai.assert.equal(numGets, 1);
    chai.assert.equal(runs, 1);

    reactiveDict.set('foo', { date: new Date('2018-01-02') });
    Tracker.flush({ _throwFirstError: true });
    chai.assert.instanceOf(field('foo').date, Date);
    chai.assert.equal(numGets, 2);
    chai.assert.equal(runs, 2);

    computation.stop();
  });

  it('should work with multiple parameters', () => {
    const reactiveDict = new ReactiveDict();
    reactiveDict.set('foofoo', '000');
    reactiveDict.set('foobar', '000');
    reactiveDict.set('barbar', '000');
    let numGets = 0;
    const field = reactiveField((val1, val2) => {
      numGets += 1;
      return reactiveDict.get(`${val1}${val2}`);
    }, {
      timeout: 100,
    });

    const runs = {
      foofoo: 0,
      foobar: 0,
      barbar: 0,
    };

    Tracker.autorun(() => {
      runs.foofoo += 1;
      const value = field('foo', 'foo'); // eslint-disable-line
    });
    Tracker.autorun(() => {
      runs.foobar += 1;
      const value = field('foo', 'bar'); // eslint-disable-line
    });
    Tracker.autorun(() => {
      runs.barbar += 1;
      const value = field('bar', 'bar'); // eslint-disable-line
    });

    chai.assert.equal(field('foo', 'foo'), '000');
    chai.assert.equal(numGets, 3);
    chai.assert.equal(runs.foofoo, 1);

    chai.assert.equal(field('foo', 'bar'), '000');
    chai.assert.equal(numGets, 3);
    chai.assert.equal(runs.foobar, 1);

    chai.assert.equal(field('bar', 'bar'), '000');
    chai.assert.equal(numGets, 3);
    chai.assert.equal(runs.barbar, 1);

    reactiveDict.set('foofoo', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(field('foo', 'foo'), 'bar');
    chai.assert.equal(numGets, 4);
    chai.assert.equal(runs.foofoo, 2);
    chai.assert.equal(runs.foobar, 1);
    chai.assert.equal(runs.barbar, 1);

    reactiveDict.set('foobar', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(field('foo', 'bar'), 'bar');
    chai.assert.equal(numGets, 5);
    chai.assert.equal(runs.foofoo, 2);
    chai.assert.equal(runs.foobar, 2);
    chai.assert.equal(runs.barbar, 1);

    reactiveDict.set('barbar', 'bar');
    Tracker.flush({ _throwFirstError: true });
    chai.assert.equal(field('bar', 'bar'), 'bar');
    chai.assert.equal(numGets, 6);
    chai.assert.equal(runs.foofoo, 2);
    chai.assert.equal(runs.foobar, 2);
    chai.assert.equal(runs.barbar, 2);
  });
});
