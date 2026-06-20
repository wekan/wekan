/* eslint-env mocha */
import { expect } from 'chai';
import {
  ALLOWED_LIST_COLORS,
  normalizeListColor,
} from '../listColors';

/**
 * Unit tests for list / swimlane color normalization (#5382).
 *
 * Bug: selecting the `silver` color for a list (and swimlane) saved/displayed
 * it as `None` instead of silver, because an offered-but-unsupported color fell
 * back to None. The canonical `ALLOWED_LIST_COLORS` list must include `silver`
 * (and every other color the picker offers), and `normalizeListColor` must
 * return an allowed color unchanged while normalizing unknown colors to ''
 * (None).
 */
describe('list/swimlane color normalization (#5382)', function() {
  it('includes silver in the canonical allowed colors', function() {
    expect(ALLOWED_LIST_COLORS).to.include('silver');
  });

  it('accepts silver and returns it unchanged', function() {
    expect(normalizeListColor('silver')).to.equal('silver');
  });

  it('returns "" (None) for an unknown color', function() {
    expect(normalizeListColor('notacolor')).to.equal('');
  });

  it('keeps existing/standard colors allowed', function() {
    ['white', 'green', 'yellow', 'red', 'blue', 'black', 'silver'].forEach(
      color => {
        expect(ALLOWED_LIST_COLORS, color).to.include(color);
        expect(normalizeListColor(color), color).to.equal(color);
      },
    );
  });

  it('every offered allowed color round-trips through normalizeListColor', function() {
    ALLOWED_LIST_COLORS.forEach(color => {
      expect(normalizeListColor(color), color).to.equal(color);
    });
  });

  it('normalizes empty / null / non-string input to "" (None)', function() {
    expect(normalizeListColor('')).to.equal('');
    expect(normalizeListColor(null)).to.equal('');
    expect(normalizeListColor(undefined)).to.equal('');
    expect(normalizeListColor(123)).to.equal('');
  });
});
