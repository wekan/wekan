/* eslint-env mocha */
import { expect } from 'chai';
import {
  filterCopiedLabelIds,
  resolveRealCardId,
  remapCoverId,
} from '../cardCopyHelpers';

/**
 * Unit tests for the pure helpers behind three card fixes:
 *   #2970 Copy card selects all labels
 *   #4561 link card due date bug
 *   #5364 Copy card: show as thumb / cover not cloned
 *
 * The helpers are Meteor-free so these tests run standalone (mocha + chai).
 */
describe('card copy / due-date fixes', function() {
  // --- #2970: only named destination labels matching source names ---
  describe('filterCopiedLabelIds', function() {
    it('maps destination labels whose name matches a source label name', function() {
      const destLabels = [
        { _id: 'd1', name: 'Bug' },
        { _id: 'd2', name: 'Feature' },
        { _id: 'd3', name: 'Other' },
      ];
      const sourceNames = ['Bug', 'Feature'];
      expect(filterCopiedLabelIds(destLabels, sourceNames)).to.deep.equal(['d1', 'd2']);
    });

    it('SKIPS unnamed destination labels even if a source label is unnamed', function() {
      // The bug (#2970): unnamed destination labels were wrongly selected.
      const destLabels = [
        { _id: 'd1', name: 'Bug' },
        { _id: 'd2', name: '' },        // empty name -> must be skipped
        { _id: 'd3' },                  // missing name -> must be skipped
        { _id: 'd4', name: undefined }, // undefined name -> must be skipped
      ];
      const sourceNames = ['Bug', '', undefined];
      expect(filterCopiedLabelIds(destLabels, sourceNames)).to.deep.equal(['d1']);
    });

    it('returns an empty array when there are no matches', function() {
      const destLabels = [{ _id: 'd1', name: 'Bug' }];
      expect(filterCopiedLabelIds(destLabels, ['Nope'])).to.deep.equal([]);
    });

    it('is null/undefined safe', function() {
      expect(filterCopiedLabelIds(null, null)).to.deep.equal([]);
      expect(filterCopiedLabelIds(undefined, ['Bug'])).to.deep.equal([]);
      expect(filterCopiedLabelIds([{ _id: 'd1', name: 'Bug' }], null)).to.deep.equal([]);
    });
  });

  // --- #4561: due-date unset must target the real card id ---
  describe('resolveRealCardId', function() {
    it('returns linkedId for a linked card', function() {
      const linked = { _id: 'placeholder', linkedId: 'realCard', type: 'cardType-linkedCard' };
      expect(resolveRealCardId(linked)).to.equal('realCard');
    });

    it('returns _id for a normal card', function() {
      const normal = { _id: 'realCard', type: 'cardType-card' };
      expect(resolveRealCardId(normal)).to.equal('realCard');
    });

    it('returns _id when type is absent (defaults to normal card)', function() {
      expect(resolveRealCardId({ _id: 'realCard' })).to.equal('realCard');
    });

    it('is null-safe', function() {
      expect(resolveRealCardId(null)).to.equal(undefined);
    });
  });

  // --- #5364: cover must be remapped to the new attachment id ---
  describe('remapCoverId', function() {
    it('maps the cover to the new attachment id when a cover is set', function() {
      const map = { oldAtt: 'newAtt' };
      expect(remapCoverId('oldAtt', map)).to.equal('newAtt');
    });

    it('leaves undefined when no cover is set', function() {
      expect(remapCoverId(undefined, { oldAtt: 'newAtt' })).to.equal(undefined);
      expect(remapCoverId('', { oldAtt: 'newAtt' })).to.equal(undefined);
      expect(remapCoverId(null, { oldAtt: 'newAtt' })).to.equal(undefined);
    });

    it('returns undefined when the cover has no mapping (attachment not copied)', function() {
      expect(remapCoverId('oldAtt', {})).to.equal(undefined);
      expect(remapCoverId('oldAtt', null)).to.equal(undefined);
    });
  });
});
