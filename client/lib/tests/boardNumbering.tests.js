/* eslint-env mocha */
import { expect } from 'chai';
import { boardOptionLabel } from '/client/components/boards/boardLabelHelpers';

/**
 * Unit tests for board/list/swimlane option label building.
 *
 * Regression #6135: numbering prepended to option labels broke first-letter
 * keyboard navigation and readability of boards whose name starts with a
 * number. Numbering must be OFF by default and, when enabled, must not be a
 * prefix.
 */
describe('boardOptionLabel (#6135)', function() {
  describe('default (numbering off)', function() {
    it('returns the name unchanged', function() {
      expect(boardOptionLabel('My Board', 0)).to.equal('My Board');
      expect(boardOptionLabel('My Board', 4)).to.equal('My Board');
    });

    it('keeps first-letter navigation: label starts with the name', function() {
      const name = 'Zebra';
      const label = boardOptionLabel(name, 7);
      expect(label.charAt(0)).to.equal(name.charAt(0));
      expect(label.indexOf(name)).to.equal(0);
    });

    it('does not prepend a number to names that start with a digit', function() {
      const name = '2024 Roadmap';
      const label = boardOptionLabel(name, 2);
      expect(label).to.equal(name);
      expect(label.charAt(0)).to.equal('2');
    });

    it('treats an explicit numbered:false the same as the default', function() {
      expect(boardOptionLabel('Alpha', 3, { numbered: false })).to.equal('Alpha');
    });

    it('handles empty / nullish names safely', function() {
      expect(boardOptionLabel('', 0)).to.equal('');
      expect(boardOptionLabel(null, 0)).to.equal('');
      expect(boardOptionLabel(undefined, 0)).to.equal('');
    });
  });

  describe('numbering on', function() {
    it('still STARTS with the name (number is a suffix, not a prefix)', function() {
      const name = 'Projects';
      const label = boardOptionLabel(name, 0, { numbered: true });
      expect(label.indexOf(name)).to.equal(0);
      expect(label.charAt(0)).to.equal(name.charAt(0));
    });

    it('appends the 1-based position', function() {
      expect(boardOptionLabel('Projects', 0, { numbered: true })).to.equal('Projects (1)');
      expect(boardOptionLabel('Projects', 4, { numbered: true })).to.equal('Projects (5)');
    });

    it('preserves first-letter navigation even for digit-named boards', function() {
      const name = '2024 Roadmap';
      const label = boardOptionLabel(name, 1, { numbered: true });
      expect(label.charAt(0)).to.equal('2');
      expect(label.indexOf(name)).to.equal(0);
    });
  });
});
