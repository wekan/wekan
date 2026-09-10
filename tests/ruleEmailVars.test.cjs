'use strict';

// #3304 / #3301: the Rules "send an email" action used to send a bare
// message with no reference to the card that triggered it - no title, no
// link, no template variables. This exercises:
//  - models/lib/ruleVarsSubstitute.js's substituteVars(), the pure {token}
//    replacement function server/rulesHelper.js uses for the email
//    subject/body (and other action text fields),
//  - that server/rulesHelper.js always appends the card title + link to a
//    "send email" action's body, even with no user-configured template,
//  - that the new {card}/{cardLink}/{list}/{board}/{member} tokens are
//    documented in en.i18n.json's r-email-vars-hint and translated
//    everywhere else.
//
// Run: node tests/ruleEmailVars.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const { substituteVars } = require(path.join(repoRoot, 'models/lib/ruleVarsSubstitute.js'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('substitutes each documented token', () => {
  const vars = {
    card: 'Fix the leak',
    cardlink: 'https://example.com/b/board1/my-board/card1',
    list: 'Doing',
    board: 'Plumbing',
    member: 'alice',
  };
  const result = substituteVars(
    'Card {card} on {board}/{list} was updated by {member}. Link: {cardLink}',
    vars,
  );
  assert.strictEqual(
    result,
    'Card Fix the leak on Plumbing/Doing was updated by alice. Link: https://example.com/b/board1/my-board/card1',
  );
});

test('token names are case-insensitive ({cardLink} matches vars.cardlink)', () => {
  const result = substituteVars('{CARD} {CardLink}', { card: 'X', cardlink: 'Y' });
  assert.strictEqual(result, 'X Y');
});

test('unknown tokens are left as literal text rather than crashing', () => {
  const result = substituteVars('Hello {nosuchvar} and {card}', { card: 'Widget' });
  assert.strictEqual(result, 'Hello {nosuchvar} and Widget');
});

test('malformed / non-token braces are left untouched', () => {
  const inputs = ['{ card }', '{card', 'card}', '{{card}}', '{}'];
  for (const input of inputs) {
    // None of these match \{(\w+)\} as a whole token, or (for {{card}})
    // resolve to something other than what a literal replace would do -
    // either way substituteVars must not throw.
    assert.doesNotThrow(() => substituteVars(input, { card: 'X' }));
  }
  assert.strictEqual(substituteVars('{ card }', { card: 'X' }), '{ card }');
  assert.strictEqual(substituteVars('{}', { card: 'X' }), '{}');
});

test('non-string input is returned unchanged', () => {
  assert.strictEqual(substituteVars(undefined, {}), undefined);
  assert.strictEqual(substituteVars(null, {}), null);
  assert.strictEqual(substituteVars(42, {}), 42);
});

test('missing vars object does not throw', () => {
  assert.strictEqual(substituteVars('{card}', undefined), '{card}');
});

// --- server/rulesHelper.js: card link is appended automatically ---

const rulesHelperSrc = fs.readFileSync(path.join(repoRoot, 'server/rulesHelper.js'), 'utf8');

test('rulesHelper.js imports substituteVars from the pure module (no duplicate copy)', () => {
  assert.ok(
    /from ['"]\/models\/lib\/ruleVarsSubstitute['"]/.test(rulesHelperSrc),
    'server/rulesHelper.js should import substituteVars from models/lib/ruleVarsSubstitute',
  );
});

test('the sendEmail action appends the card title and link, even with no user template', () => {
  const sendEmailBlock = rulesHelperSrc.slice(rulesHelperSrc.indexOf("actionType === 'sendEmail'"));
  assert.ok(/ruleVars\.cardname/.test(sendEmailBlock), 'appends the card title');
  assert.ok(/ruleVars\.cardlink/.test(sendEmailBlock), 'appends the card link');
});

test('buildRuleVars resolves card.absoluteUrl() for {cardLink}, reusing the existing helper', () => {
  assert.ok(
    /card\.absoluteUrl\(/.test(rulesHelperSrc),
    'should reuse Card.absoluteUrl() (models/lib/cardUrl.js), not a new URL builder',
  );
});

test('buildRuleVars exposes the short {card}/{list}/{board}/{member} aliases', () => {
  const buildRuleVarsBlock = rulesHelperSrc.slice(
    rulesHelperSrc.indexOf('async function buildRuleVars'),
    rulesHelperSrc.indexOf('export const RulesHelper'),
  );
  for (const alias of ['vars.card =', 'vars.list =', 'vars.board =', 'vars.member =']) {
    assert.ok(buildRuleVarsBlock.includes(alias), `missing alias: ${alias}`);
  }
});

// --- i18n: the hint documenting the tokens exists and is translated ---

const i18nDir = path.join(repoRoot, 'imports/i18n/data');
const en = JSON.parse(fs.readFileSync(path.join(i18nDir, 'en.i18n.json'), 'utf8'));

test('en.i18n.json documents the available tokens in r-email-vars-hint', () => {
  const hint = en['r-email-vars-hint'];
  assert.ok(hint, 'r-email-vars-hint key exists');
  for (const token of ['{card}', '{cardLink}', '{list}', '{board}', '{member}']) {
    assert.ok(hint.includes(token), `hint should mention ${token}`);
  }
});

test('r-email-vars-hint is translated (not left as the English string) in most locales', () => {
  const files = fs.readdirSync(i18nDir).filter(
    f => f.endsWith('.i18n.json') && f !== 'en.i18n.json'
      && !f.startsWith('en-') && !f.startsWith('en_'),
  );
  let translated = 0;
  for (const f of files) {
    const json = JSON.parse(fs.readFileSync(path.join(i18nDir, f), 'utf8'));
    const value = json['r-email-vars-hint'];
    assert.ok(value, `${f}: missing r-email-vars-hint`);
    // The literal tokens must always be preserved untouched.
    for (const token of ['{card}', '{cardLink}', '{list}', '{board}', '{member}']) {
      assert.ok(value.includes(token), `${f}: r-email-vars-hint should keep token ${token}`);
    }
    if (value !== en['r-email-vars-hint']) translated += 1;
  }
  assert.ok(translated > 100, `only ${translated} locales have a real (non-English) translation`);
});

test('the key sits right after r-subject in every locale file, as in en.i18n.json', () => {
  const enKeys = Object.keys(en);
  const index = enKeys.indexOf('r-email-vars-hint');
  assert.ok(index > 0);
  assert.strictEqual(enKeys[index - 1], 'r-subject');
  // Locale files are not all fully key-complete with en.i18n.json (some are
  // missing unrelated keys elsewhere), so the ABSOLUTE index can differ; what
  // must hold everywhere is the RELATIVE order versus its neighbour, same as
  // tests/boardItemLinks.test.cjs checks for copy-link-to-clipboard.
  const files = fs.readdirSync(i18nDir).filter(f => f.endsWith('.i18n.json') && f !== 'en.i18n.json');
  for (const f of files) {
    if (f.startsWith('en-') || f.startsWith('en_')) continue; // English variants: key intentionally absent
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(i18nDir, f), 'utf8')));
    const hintIdx = keys.indexOf('r-email-vars-hint');
    const subjectIdx = keys.indexOf('r-subject');
    assert.ok(hintIdx > -1, `${f}: missing r-email-vars-hint`);
    if (subjectIdx > -1) {
      assert.strictEqual(hintIdx, subjectIdx + 1, `${f}: not right after r-subject`);
    }
  }
});

// --- UI: the hint text is wired into the send-email action template ---

test('mailActions.jade shows the r-email-vars-hint text next to the email fields', () => {
  const jade = fs.readFileSync(
    path.join(repoRoot, 'client/components/rules/actions/mailActions.jade'),
    'utf8',
  );
  assert.ok(/r-email-vars-hint/.test(jade));
});

console.log(`\nruleEmailVars: ${passed} tests passed`);
