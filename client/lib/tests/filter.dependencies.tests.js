/* eslint-env mocha */
import { expect } from 'chai';
import { Filter } from '/client/lib/filter';

// #3392: the board Filter sidebar can filter cards by dependency relation type.
describe('Filter.cardDependencies', function () {
  afterEach(function () {
    // Leave the global Filter clean for other tests.
    if (Filter.cardDependencies._isActive()) {
      Filter.cardDependencies.reset();
    }
  });

  it('is registered as a filterable field', function () {
    expect(Filter._fields).to.include('cardDependencies');
    expect(Filter.cardDependencies).to.be.an('object');
  });

  it('toggles a relation type on and off', function () {
    expect(Filter.cardDependencies._isActive()).to.equal(false);
    Filter.cardDependencies.toggle('blocks');
    expect(Filter.cardDependencies.isSelected('blocks')).to.equal(true);
    expect(Filter.cardDependencies._isActive()).to.equal(true);
    Filter.cardDependencies.toggle('blocks');
    expect(Filter.cardDependencies.isSelected('blocks')).to.equal(false);
    expect(Filter.cardDependencies._isActive()).to.equal(false);
  });

  it('builds a mongo selector on cardDependencies.type', function () {
    Filter.cardDependencies.toggle('blocks');
    const selector = JSON.stringify(Filter._getMongoSelector());
    expect(selector).to.contain('cardDependencies.type');
    expect(selector).to.contain('blocks');
  });
});
