/* eslint-env mocha */
import { expect } from 'chai';
import { formatNumberValue } from '../customNumberFormat';

/**
 * Unit tests for custom-field number formatting (#2091).
 *
 * "Custom number field displays as NaN if set blank after already being set":
 * once a number Custom Field is given a value and then cleared, the blank /
 * non-numeric value must render as an empty string rather than "NaN".
 */
describe('custom number field formatting (#2091)', function() {
  it('renders an empty string for blank input', function() {
    expect(formatNumberValue('')).to.equal('');
  });

  it('renders an empty string for null', function() {
    expect(formatNumberValue(null)).to.equal('');
  });

  it('renders an empty string for undefined', function() {
    expect(formatNumberValue(undefined)).to.equal('');
  });

  it('renders an empty string for non-numeric text (never "NaN")', function() {
    expect(formatNumberValue('abc')).to.equal('');
    expect(formatNumberValue(NaN)).to.equal('');
  });

  it('renders zero as "0"', function() {
    expect(formatNumberValue(0)).to.equal('0');
  });

  it('renders a decimal number unchanged', function() {
    expect(formatNumberValue(12.5)).to.equal('12.5');
  });

  it('accepts numeric strings', function() {
    expect(formatNumberValue('42')).to.equal('42');
  });
});
