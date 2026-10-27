'use strict';

// #6810: "[Text] title" in Add card turned Text into a board label (#3986) for
// everyone, silently - a title pasted from a ticket system or a mail
// ("[Follower] #123456 - ...", "[EXTERNAL] ...") lost its prefix and filled the
// board with labels. It is a Member Settings switch now, off by default.
// Run: node tests/titleBracketLabel6810.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

(async () => {
  const { quickAddTitleParts } = await import('../models/lib/quickAddCardLabel.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  console.log('titleBracketLabel6810:');

  test('off (the default): the reporter\'s paste is kept as it is, no label', () => {
    for (const title of ['[Follower] #123456 - Issue description', '[prtg.example.com (master)] Ping lost', '[EXTERNAL] Re: invoice']) {
      assert.deepStrictEqual(quickAddTitleParts(title, false), { title, labelName: null });
    }
    assert.deepStrictEqual(quickAddTitleParts(undefined, false), { title: '', labelName: null });
  });

  test('on: the #3986 behaviour, as before', () => {
    assert.deepStrictEqual(quickAddTitleParts('[Fedora] Do a thing', true), { title: 'Do a thing', labelName: 'Fedora' });
    // Negative: a title that is not a prefix is untouched either way.
    assert.strictEqual(quickAddTitleParts('Do [this] thing', true).labelName, null);
  });

  test('a Member Settings switch, off unless explicitly on', () => {
    const users = read('models/users.js');
    assert.match(users, /'profile\.titleBracketLabel': \{[\s\S]{0,400}type: Boolean,\n\s+optional: true,/);
    assert.match(users, /hasTitleBracketLabel\(\) \{\n\s+return \(this\.profile \|\| \{\}\)\.titleBracketLabel === true;/);
    const server = read('server/models/users.js');
    assert.match(server, /async toggleTitleBracketLabel\(\) \{\n\s+if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/);
    assert.match(server, /\$set: \{ 'profile\.titleBracketLabel': \(user\.profile \|\| \{\}\)\.titleBracketLabel !== true \}/);
    const jade = read('client/components/users/userHeader.jade');
    assert.match(jade, /a\.js-toggle-title-bracket-label\(title="\{\{_ 'title-bracket-label-description'\}\}"\)\n\s+i\.fa\.fa-tag\n\s+\| \{\{_ 'title-bracket-label'\}\}\n\s+if isTitleBracketLabel\n\s+i\.fa\.fa-check/);
    assert.match(read('client/components/users/userHeader.js'), /'click \.js-toggle-title-bracket-label'\(\) \{\n\s+if \(ReactiveCache\.getCurrentUser\(\)\) Meteor\.call\('toggleTitleBracketLabel'\);/);
  });

  test('negative: Add card parses the prefix only through the switch', () => {
    const body = read('client/components/lists/listBody.js');
    assert.match(body, /quickAddTitleParts\(rawTitle, titleBracketLabelOn\(\)\)/);
    assert.match(body, /const titleBracketLabelOn = \(\) => \{\n\s+const user = ReactiveCache\.getCurrentUser\(\);\n\s+return Boolean\(user && typeof user\.hasTitleBracketLabel === 'function' && user\.hasTitleBracketLabel\(\)\);/);
    // No other caller turns a typed title's prefix into a label behind its back.
    const walk = dir => fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true }).flatMap(e => {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) return ['node_modules', '_build', '.build', '.tools'].includes(e.name) ? [] : walk(rel);
      return /\.js$/.test(e.name) ? [rel] : [];
    });
    for (const file of walk('client')) {
      assert.ok(!/parseQuickAddCardLabel\(/.test(read(file)), `${file} parses a title prefix without the switch`);
    }
  });

  test('both texts in every language', () => {
    const dir = path.join(__dirname, '..', 'imports/i18n/data');
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    const keys = Object.keys(en);
    assert.strictEqual(keys.indexOf('title-bracket-label'), keys.indexOf('keep-title-tags-description') + 1);
    for (const file of fs.readdirSync(dir)) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      for (const key of ['title-bracket-label', 'title-bracket-label-description']) {
        assert.ok(data[key] && data[key].trim(), `${file} ${key}`);
        if (!file.startsWith('en')) assert.notStrictEqual(data[key], en[key], `${file} ${key} is translated`);
      }
    }
  });

  console.log(`titleBracketLabel6810: ${passed} passed`);
})().catch(error => { console.error(error); process.exit(1); });
