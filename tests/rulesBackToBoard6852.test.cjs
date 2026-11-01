'use strict';

// #6852: "in rule page there is no back icon". The Rules page lost its Back
// with its own sidebar; only the trigger, action and rule details pages kept
// one, to the rules list. The rules list and its views now link back to the
// board, and the three sub-pages show no second Back.
// Run: node tests/rulesBackToBoard6852.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('the Rules page links back to the board, as a real link', () => {
  const jade = read('client/components/rules/rulesMain.jade');
  assert.match(jade,
    /\.rules-page\(class=currentBoard\.colorClass\)\n(?:\s+\/\/-[^\n]*\n(?:\s{8}[^\n]*\n)*)?\s+if showBackToBoard\n\s+\.rules-back-to-board\n\s+a\.js-rules-back-to-board\(href="\{\{pathFor 'board' id=currentBoard\._id slug=currentBoard\.slug\}\}"[^\n]*\)\n\s+i\.fa\.fa-arrow-left\n\s+\| \{\{_ 'back'\}\}/,
    'first on the page, before every view and every access level');
  // The board route the link names exists.
  assert.match(read('config/router.js'), /FlowRouter\.route\('\/b\/:id\/:slug', \{\n\s+name: 'board',/);
});

test('it is shown on the list and its views, not on the three sub-pages', () => {
  const js = read('client/components/rules/rulesMain.js');
  const body = js.match(/showBackToBoard\(\) \{\n([\s\S]*?)\n  \},/);
  assert.ok(body, 'showBackToBoard helper');
  // eslint-disable-next-line no-new-func
  const show = tab => new Function('Template', body[1])({ instance: () => ({ rulesCurrentTab: { get: () => tab } }) });
  assert.equal(show('rulesList'), true, 'the list, and Workflow / Bots / Blocks / History, which are list views');
  for (const tab of ['trigger', 'action', 'ruleDetails']) {
    assert.equal(show(tab), false, `negative: ${tab} keeps only its own Back, to the list`);
  }
  // Those three still have their own Back.
  for (const file of ['rulesTriggers.jade', 'rulesActions.jade', 'ruleDetails.jade']) {
    assert.match(read(`client/components/rules/${file}`), /button\.primary\.wide\.js-goback/, file);
  }
});

test('the link is drawn as the primary buttons beside it', () => {
  const css = read('client/components/rules/rules.css');
  assert.match(css, /\.rules-back-to-board \.js-rules-back-to-board \{[^}]*background: var\(--theme-accent, #005377\);[^}]*color: #fff;/);
});
