'use strict';

// #2713: the "send email" rule action already appended the card's title and
// link automatically (#3301), but not its description - a recipient still
// had to open the card to see what it actually said. This pins that the
// description is appended too, alongside a negative check that the older
// title/link behaviour was not removed while adding it.
//
// Run: node tests/ruleEmailIncludesDescription.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const rulesHelperSrc = fs.readFileSync(path.join(repoRoot, 'server/rulesHelper.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('buildRuleVars exposes the description on ruleVars', () => {
  const buildRuleVarsBlock = rulesHelperSrc.slice(
    rulesHelperSrc.indexOf('async function buildRuleVars'),
    rulesHelperSrc.indexOf('export const RulesHelper'),
  );
  assert.ok(
    /vars\.description\s*=\s*card\.description/.test(buildRuleVarsBlock),
    'buildRuleVars should set vars.description from card.description',
  );
});

test('the sendEmail action appends title, description and link automatically', () => {
  const sendEmailBlock = rulesHelperSrc.slice(
    rulesHelperSrc.indexOf("actionType === 'sendEmail'"),
    rulesHelperSrc.indexOf("if (action.actionType === 'setDate')"),
  );
  assert.ok(/ruleVars\.cardname/.test(sendEmailBlock), 'still appends the card title (#3301)');
  assert.ok(/ruleVars\.description/.test(sendEmailBlock), 'appends the card description');
  assert.ok(/ruleVars\.cardlink/.test(sendEmailBlock), 'still appends the card link (#3301)');
  // Negative: the description line must not have replaced the title/link
  // lines - all three "Card:"/"Description:"/"Link:" footer lines must be
  // built, not just one swapped in for another.
  const footerLabels = ['Card:', 'Description:', 'Link:'];
  for (const label of footerLabels) {
    assert.ok(
      sendEmailBlock.includes(label),
      `sendEmail footer is missing the "${label}" line`,
    );
  }
});

test('the description line is appended only when non-empty, same as the existing title/link lines', () => {
  const sendEmailBlock = rulesHelperSrc.slice(rulesHelperSrc.indexOf("actionType === 'sendEmail'"));
  const descLine = sendEmailBlock.match(/if \(ruleVars\.description\)[^\n]*\n/);
  assert.ok(descLine, 'expected an `if (ruleVars.description)` guard, not an unconditional push');
});

console.log(`\nruleEmailIncludesDescription: ${passed} tests passed`);
