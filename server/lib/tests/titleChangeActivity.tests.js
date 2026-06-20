/* eslint-env mocha */
import { expect } from 'chai';
import { titleChanged } from '../titleChangeActivity';

describe('titleChangeActivity', function() {
  describe(titleChanged.name, function() {
    it('returns true when the modifier changes title to a different value', function() {
      const oldDoc = { title: 'Old title' };
      const modifier = { $set: { title: 'New title' } };
      expect(titleChanged(oldDoc, modifier)).to.equal(true);
    });

    it('returns false when title is absent from the modifier', function() {
      const oldDoc = { title: 'Old title' };
      const modifier = { $set: { description: 'changed' } };
      expect(titleChanged(oldDoc, modifier)).to.equal(false);
    });

    it('returns false when the title is unchanged', function() {
      const oldDoc = { title: 'Same title' };
      const modifier = { $set: { title: 'Same title' } };
      expect(titleChanged(oldDoc, modifier)).to.equal(false);
    });

    it('returns true when a title is set on a card that had none', function() {
      const oldDoc = {};
      const modifier = { $set: { title: 'First title' } };
      expect(titleChanged(oldDoc, modifier)).to.equal(true);
    });

    it('returns false for falsy / malformed modifiers', function() {
      expect(titleChanged({ title: 'x' }, undefined)).to.equal(false);
      expect(titleChanged({ title: 'x' }, null)).to.equal(false);
      expect(titleChanged({ title: 'x' }, {})).to.equal(false);
      expect(titleChanged({ title: 'x' }, { $set: {} })).to.equal(false);
    });

    it('tolerates a missing oldDoc', function() {
      const modifier = { $set: { title: 'New title' } };
      expect(titleChanged(undefined, modifier)).to.equal(true);
      expect(titleChanged(null, modifier)).to.equal(true);
    });
  });
});
