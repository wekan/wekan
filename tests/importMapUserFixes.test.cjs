'use strict';

// Regression for #6508 (import / map imported users later): two console-crash bugs.
//   A) Import "map members": clicking a search result threw
//      "Cannot read properties of undefined (reading '_id')" at click .js-select-import,
//      because it read Template.currentData()._id — undefined when the click lands on a
//      child node (the avatar or the name span). Read the _id from the anchor's data-id.
//   B) Admin Panel / People: saving an IMPORTED (placeholder) user as active with an
//      email threw "Cannot read properties of undefined (reading '0')" because the
//      submit handler read user.emails[0] and a placeholder user has no `emails` array.
// Run: node tests/importMapUserFixes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

check('A: .js-select-import maps by the anchor data-id, not Template.currentData()', () => {
  const js = read('client/components/import/import.js');
  const at = js.indexOf("'click .js-select-import'");
  assert.ok(at > -1, 'the select-import handler exists');
  const block = js.slice(at, at + 700);
  assert.ok(/event\.currentTarget\.getAttribute\('data-id'\)/.test(block),
    'reads the _id from the anchor data-id');
  assert.ok(/if \(id\) importMapToUser\(id\)/.test(block), 'guards the id before mapping');
  assert.ok(!/Template\.currentData\(\)\._id/.test(js),
    'must not read _id from Template.currentData() (undefined on a child click)');
});

check('B: People submit reads the primary email defensively (no unguarded emails[0])', () => {
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/Array\.isArray\(user\.emails\) && user\.emails\.length \? user\.emails\[0\] : null/.test(js),
    'primary email is read defensively (missing / empty emails array)');
  assert.ok(/primaryEmail \? primaryEmail\.verified : undefined/.test(js), 'verified compares against the guarded email');
  assert.ok(/primaryEmail \? primaryEmail\.address\.toLowerCase\(\) : false/.test(js), 'address compares against the guarded email');
  // The old unguarded access must be gone.
  assert.ok(!/verified !== user\.emails\[0\]\.verified/.test(js), 'the unguarded user.emails[0].verified access is removed');
});

console.log(`\nimportMapUserFixes: ${passed} checks passed`);
