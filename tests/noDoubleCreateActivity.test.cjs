'use strict';

// #6823: a card inserted through the Cards collection gets its "created"
// activity from Cards.after.insert. The Version Control view's New issue and
// the REST route that creates a linked card recorded it a second time, so each
// of those cards had two "created" activities and its watchers got two
// notifications. Cards inserted with Cards.direct (no hooks) still record it
// themselves.
// Run: node tests/noDoubleCreateActivity.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

function jsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsFiles(rel));
    else if (/\.(js|cjs|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('the hook records creation, with the card author when no method user is known', () => {
  assert.match(read('server/models/cards.js'),
    /Cards\.after\.insert\(async \(userId, doc\) => \{[\s\S]{0,300}?await cardCreation\(userId \|\| doc\.userId, doc\);/);
});

test('New issue and the REST linked card no longer record it again', () => {
  assert.doesNotMatch(read('server/versionControlView.js'), /cardCreation/);
  const src = read('server/models/cards.js');
  const at = src.indexOf("noteAuthorSpoof(req, 'POST cards (linked)');");
  assert.ok(at > 0, 'the linked-card branch of POST cards was not found');
  assert.doesNotMatch(src.slice(at, src.indexOf('return;', at)), /cardCreation\(/);
});

test('negative: anywhere in server/ and models/, an explicit cardCreation follows a Cards.direct insert', () => {
  let explicit = 0;
  for (const file of [...jsFiles('server'), ...jsFiles('models')]) {
    const src = read(file);
    const re = /await cardCreation\(/g;
    let m;
    while ((m = re.exec(src))) {
      // the hook itself
      if (src.slice(Math.max(0, m.index - 60), m.index).includes('deferSyncRecording')) continue;
      explicit += 1;
      const before = src.slice(Math.max(0, m.index - 3000), m.index);
      const direct = before.lastIndexOf('Cards.direct.insertAsync(');
      const hooked = before.lastIndexOf(' Cards.insertAsync(');
      assert.ok(direct >= 0, `${file}: cardCreation with no Cards.direct insert before it`);
      assert.ok(direct > hooked, `${file}: cardCreation after a hooked Cards insert - the hook already recorded it`);
    }
  }
  // REST create, REST bulk create, email view, email to card
  assert.ok(explicit >= 4, `expected the four Cards.direct callers, saw ${explicit}`);
});

console.log(`\n${passed} tests passed`);
