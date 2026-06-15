/* eslint-env mocha */
import { expect } from 'chai';
import {
  DEFAULT_DEPENDENCY_COLOR,
  DEFAULT_DEPENDENCY_ICON,
  DEFAULT_DEPENDENCY_TYPE,
  DEPENDENCY_TYPE_IDS,
  DEPENDENCY_TYPE_INVERSE,
  dependencyTypeMeta,
  normalizeDependency,
  normalizeDependencies,
} from '/models/metadata/dependencies';

// #3392: pure-logic tests for the typed card-dependency ("Red Strings") helpers.
describe('dependencies metadata', function () {
  describe('normalizeDependency', function () {
    it('upgrades a legacy bare-string card id to a full object', function () {
      expect(normalizeDependency('card123')).to.deep.equal({
        cardId: 'card123',
        type: DEFAULT_DEPENDENCY_TYPE,
        color: DEFAULT_DEPENDENCY_COLOR,
        icon: DEFAULT_DEPENDENCY_ICON,
      });
    });

    it('fills missing fields with defaults', function () {
      expect(normalizeDependency({ cardId: 'c1' })).to.deep.equal({
        cardId: 'c1',
        type: DEFAULT_DEPENDENCY_TYPE,
        color: DEFAULT_DEPENDENCY_COLOR,
        icon: DEFAULT_DEPENDENCY_ICON,
      });
    });

    it('keeps a valid type/color/icon', function () {
      expect(
        normalizeDependency({ cardId: 'c1', type: 'blocks', color: '#2196f3', icon: 'lock' }),
      ).to.deep.equal({ cardId: 'c1', type: 'blocks', color: '#2196f3', icon: 'lock' });
    });

    it('falls back to the default type for an unknown type', function () {
      expect(normalizeDependency({ cardId: 'c1', type: 'bogus' }).type).to.equal(
        DEFAULT_DEPENDENCY_TYPE,
      );
    });

    it('returns null for entries without a card id', function () {
      expect(normalizeDependency(null)).to.equal(null);
      expect(normalizeDependency({})).to.equal(null);
      expect(normalizeDependency('')).to.equal(null);
    });
  });

  describe('normalizeDependencies', function () {
    it('normalizes a mixed legacy/object array and drops invalid entries', function () {
      const out = normalizeDependencies(['a', { cardId: 'b', type: 'fixes' }, {}, null]);
      expect(out).to.have.length(2);
      expect(out[0].cardId).to.equal('a');
      expect(out[1]).to.deep.include({ cardId: 'b', type: 'fixes' });
    });

    it('returns [] for undefined', function () {
      expect(normalizeDependencies(undefined)).to.deep.equal([]);
    });
  });

  describe('dependencyTypeMeta direction', function () {
    it('blocks / fixes are directed and forward', function () {
      expect(dependencyTypeMeta('blocks')).to.include({ directed: true, forward: true });
      expect(dependencyTypeMeta('fixes')).to.include({ directed: true, forward: true });
    });

    it('is-blocked-by / is-fixed-by are directed and reversed', function () {
      expect(dependencyTypeMeta('is-blocked-by')).to.include({ directed: true, forward: false });
      expect(dependencyTypeMeta('is-fixed-by')).to.include({ directed: true, forward: false });
    });

    it('related-to is undirected', function () {
      expect(dependencyTypeMeta('related-to').directed).to.equal(false);
    });

    it('an unknown type falls back to the default type meta', function () {
      expect(dependencyTypeMeta('nope').id).to.equal(DEFAULT_DEPENDENCY_TYPE);
    });
  });

  describe('DEPENDENCY_TYPE_INVERSE', function () {
    it('maps every type to a valid inverse, and inverting twice is identity', function () {
      DEPENDENCY_TYPE_IDS.forEach(id => {
        const inv = DEPENDENCY_TYPE_INVERSE[id];
        expect(DEPENDENCY_TYPE_IDS).to.include(inv);
        expect(DEPENDENCY_TYPE_INVERSE[inv]).to.equal(id);
      });
    });
  });
});
