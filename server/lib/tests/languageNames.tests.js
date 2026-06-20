/* eslint-env mocha */
// Regression test for issue #3265:
// "Incorrect namestring for Latvian language in the menu".
//
// The supported-language list lives in imports/i18n/languages.js as a default
// export. Each entry's `load` is a lazy `() => import(...)`, so importing the
// module does NOT trigger any JSON load — the entry objects (code/tag/name) are
// available directly. We assert the Latvian entry has code "lv" and the correct
// native name "Latviešu valoda".
import { expect } from 'chai';
import languages from '/imports/i18n/languages';

// Pure helper: the correct native name for Latvian (issue #3265).
export function latvianName() {
  return 'Latviešu valoda';
}

describe('language names (#3265)', function() {
  it('pure helper returns the correct Latvian native name', function() {
    expect(latvianName()).to.equal('Latviešu valoda');
  });

  it('has a Latvian entry with code "lv"', function() {
    expect(languages).to.have.property('lv');
    expect(languages.lv.code).to.equal('lv');
  });

  it('shows the correct native name for Latvian', function() {
    expect(languages.lv.name).to.equal(latvianName());
  });
});
