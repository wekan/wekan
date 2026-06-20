/* eslint-env mocha */
/* global describe, it */

// Regression guard for WeKan issue #5188:
// "Rule 'When a card is moved to Archive' can not be activated".
//
// Root cause was a CSS class-name drift between the jade template and the JS
// event handler: the jade used `js-add-arch-trigger` while the handler listened
// on `js-add-arc-trigger` (missing the 'h'), so the click handler never fired.
//
// This test reads both files from disk and asserts that every
// `js-add-*-trigger` class referenced in the jade template has a matching
// event-handler selector in the JS file. It is self-contained (only uses the
// node `fs`/`path` builtins plus chai).

const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const jadePath = path.join(
  repoRoot,
  'client',
  'components',
  'rules',
  'triggers',
  'boardTriggers.jade',
);
const jsPath = path.join(
  repoRoot,
  'client',
  'components',
  'rules',
  'triggers',
  'boardTriggers.js',
);

// Collect every distinct `js-add-<name>-trigger` token in a file.
function triggerClasses(contents) {
  const re = /js-add-[a-z-]*?-trigger/g;
  return new Set(contents.match(re) || []);
}

describe('boardTriggers template/handler class wiring (#5188)', function() {
  const jade = fs.readFileSync(jadePath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  const jadeClasses = triggerClasses(jade);
  const jsClasses = triggerClasses(js);

  it('jade and js both define trigger classes', function() {
    expect(jadeClasses.size).to.be.greaterThan(0);
    expect(jsClasses.size).to.be.greaterThan(0);
  });

  it('every jade js-add-*-trigger class has a matching js handler selector', function() {
    const missing = [...jadeClasses].filter(cls => !jsClasses.has(cls));
    expect(
      missing,
      `These trigger classes are referenced in boardTriggers.jade but have no matching handler in boardTriggers.js: ${missing.join(
        ', ',
      )}`,
    ).to.deep.equal([]);
  });

  it('archive trigger class is present in BOTH files (the #5188 regression)', function() {
    expect(jade).to.contain('js-add-arch-trigger');
    expect(js).to.contain('js-add-arch-trigger');
    // The old, mismatched spelling must not reappear.
    expect(js).to.not.contain('js-add-arc-trigger');
  });
});
