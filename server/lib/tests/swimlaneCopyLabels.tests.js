/* eslint-env mocha */
import { expect } from 'chai';
import { remapLabelIds } from '../labelRemap';

// #5158 "Copy Swimlane does not copy labels".
// The swimlane copy uses remapLabelIds() to discover which source-board labels
// referenced by the swimlane's cards are missing on the destination board, so
// they can be created before the per-card by-name remap runs.
describe('labelRemap.remapLabelIds (#5158)', function() {
  it('maps matching names to destination label ids', function() {
    const sourceLabels = [
      { _id: 'src-red', name: 'Red', color: 'red' },
      { _id: 'src-blue', name: 'Blue', color: 'blue' },
    ];
    const destLabels = [
      { _id: 'dst-red', name: 'Red', color: 'red' },
      { _id: 'dst-blue', name: 'Blue', color: 'blue' },
    ];
    const { mappedIds, missingNames } = remapLabelIds(
      sourceLabels,
      ['src-red', 'src-blue'],
      destLabels,
    );
    expect(mappedIds).to.have.members(['dst-red', 'dst-blue']);
    expect(missingNames).to.deep.equal([]);
  });

  it('skips unnamed labels so they do not select unnamed dest labels', function() {
    const sourceLabels = [
      { _id: 'src-unnamed', name: '', color: 'green' },
      { _id: 'src-red', name: 'Red', color: 'red' },
    ];
    const destLabels = [
      { _id: 'dst-unnamed', name: '', color: 'green' },
      { _id: 'dst-red', name: 'Red', color: 'red' },
    ];
    const { mappedIds, missingNames } = remapLabelIds(
      sourceLabels,
      ['src-unnamed', 'src-red'],
      destLabels,
    );
    // Only the named "Red" label is mapped; the unnamed one is ignored.
    expect(mappedIds).to.deep.equal(['dst-red']);
    expect(missingNames).to.deep.equal([]);
  });

  it('reports names missing on the destination board', function() {
    const sourceLabels = [
      { _id: 'src-red', name: 'Red', color: 'red' },
      { _id: 'src-purple', name: 'Purple', color: 'purple' },
    ];
    const destLabels = [{ _id: 'dst-red', name: 'Red', color: 'red' }];
    const { mappedIds, missingNames } = remapLabelIds(
      sourceLabels,
      ['src-red', 'src-purple'],
      destLabels,
    );
    expect(mappedIds).to.deep.equal(['dst-red']);
    expect(missingNames).to.deep.equal(['Purple']);
  });

  it('only considers referenced source label ids', function() {
    const sourceLabels = [
      { _id: 'src-red', name: 'Red', color: 'red' },
      { _id: 'src-blue', name: 'Blue', color: 'blue' },
    ];
    const destLabels = [{ _id: 'dst-blue', name: 'Blue', color: 'blue' }];
    const { mappedIds, missingNames } = remapLabelIds(
      sourceLabels,
      ['src-blue'],
      destLabels,
    );
    expect(mappedIds).to.deep.equal(['dst-blue']);
    expect(missingNames).to.deep.equal([]);
  });

  it('does not report the same missing name twice', function() {
    const sourceLabels = [
      { _id: 'src-a', name: 'Dup', color: 'red' },
      { _id: 'src-b', name: 'Dup', color: 'blue' },
    ];
    const { mappedIds, missingNames } = remapLabelIds(
      sourceLabels,
      ['src-a', 'src-b'],
      [],
    );
    expect(mappedIds).to.deep.equal([]);
    expect(missingNames).to.deep.equal(['Dup']);
  });

  it('tolerates non-array inputs', function() {
    const { mappedIds, missingNames } = remapLabelIds(null, null, null);
    expect(mappedIds).to.deep.equal([]);
    expect(missingNames).to.deep.equal([]);
  });
});
