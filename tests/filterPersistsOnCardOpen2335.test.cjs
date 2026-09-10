'use strict';

// #2335: "opening a card (to edit it) while a board Filter is active RESETS
// the filter, forcing the user to reapply it".
//
// Investigation: the `Filter` object (client/lib/filter.js) is a plain
// module-level singleton, not keyed by route or Session. Opening/closing a
// card is a FlowRouter navigation handled by client/components/cards/
// cardDetails.js, which never touches `Filter` at all except to call
// `Filter.addException(...)` (to keep a just-created/linked/moved card
// visible despite the active filter) - it never calls `Filter.reset()` or
// any other filter-clearing method.
//
// The only three call sites of `Filter.reset()` in the whole client are all
// explicit user actions unrelated to opening a card:
//   - boardHeader.js  `click .js-filter-reset`  (the "clear filter" button)
//   - sidebarFilters.js `click .js-clear-all`   (the "clear all" button)
//   - keyboard.js     the `x` hotkey            (explicit keyboard shortcut)
//
// So today, opening a card does NOT reset the board filter. What can look
// like a reset is a different, correct behavior: the filtered card list is
// reactive, so if editing the open card changes a field the active filter
// matches on (e.g. removing the very label being filtered on), the card
// legitimately drops out of the filtered view - that is filtering working
// as designed, not a bug.
//
// This is a source-pattern regression test (no client/Blaze runtime is
// available under plain Node), guarding both facts: (1) no card-open/close
// code path calls Filter.reset()/clear, and (2) the only reset call sites
// remain the known, explicit, user-initiated ones.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

(() => {
  const cardDetails = read('client/components/cards/cardDetails.js');

  // Card open/close must never call Filter.reset() or clear the filter.
  assert.doesNotMatch(
    cardDetails,
    /Filter\.reset\(\)/,
    'cardDetails.js (card open/edit/close) must never call Filter.reset()',
  );
  assert.doesNotMatch(
    cardDetails,
    /Filter\.clear\(/,
    'cardDetails.js must never call a Filter.clear(...)-style method',
  );

  // It IS expected to use Filter.addException(...) to keep an affected card
  // visible despite the active filter (e.g. after linking/copying/moving),
  // which is unrelated to resetting the filter itself.
  assert.match(
    cardDetails,
    /Filter\.addException\(/,
    'cardDetails.js is expected to use Filter.addException(...) for affected cards',
  );

  // Enumerate every Filter.reset() call site in the client tree and assert
  // it is one of the three known, explicit, user-initiated actions. Any new
  // call site (in particular one reachable from card open/close) must be
  // deliberately reviewed and added here, so a future regression is caught
  // even if it lands somewhere other than cardDetails.js.
  const knownResetSites = [
    {
      file: 'client/components/boards/boardHeader.js',
      context: /'click \.js-filter-reset'\(event\) \{[\s\S]{0,400}?Filter\.reset\(\);/,
    },
    {
      file: 'client/components/sidebar/sidebarFilters.js',
      context: /'click \.js-clear-all'\(evt\) \{[\s\S]{0,200}?Filter\.reset\(\);/,
    },
    {
      file: 'client/lib/keyboard.js',
      context: /hotkeys\('x', \(event\) => \{[\s\S]{0,200}?Filter\.reset\(\);/,
    },
  ];

  for (const site of knownResetSites) {
    const content = read(site.file);
    assert.match(
      content,
      site.context,
      `${site.file} must call Filter.reset() only from its known, explicit user action`,
    );
  }

  // Walk client/ + imports/ and require every Filter.reset() call site to be
  // one of the files above - nowhere else, in particular nowhere in the
  // card-open/close path.
  const allowedFiles = new Set(knownResetSites.map(s => s.file));

  function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '_build') continue;
        walk(full, out);
      } else if (entry.isFile() && /\.js$/.test(entry.name)) {
        out.push(full);
      }
    }
  }

  const files = [];
  walk(path.join(repoRoot, 'client'), files);
  walk(path.join(repoRoot, 'imports'), files);

  for (const file of files) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    if (rel.startsWith('client/lib/filter.js')) continue; // the definition itself
    if (rel.startsWith('client/lib/tests/')) continue; // unit tests for filter.js
    const content = fs.readFileSync(file, 'utf8');
    if (/Filter\.reset\(\)/.test(content)) {
      assert.ok(
        allowedFiles.has(rel),
        `unexpected Filter.reset() call site found in ${rel} - if this is a ` +
          'new, deliberate user action add it to knownResetSites above; if ' +
          'it is reachable from card open/close, it reintroduces #2335',
      );
    }
  }

  console.log(
    'filterPersistsOnCardOpen2335: card open/close never resets the Filter; ' +
      'all Filter.reset() call sites remain the known explicit user actions',
  );
})();
