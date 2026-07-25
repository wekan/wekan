'use strict';

// Admin Panel / Settings / Translation.
//
// Two things were reported: the table showed no rows and no way to add one, and the
// Search button was BLACK.
//
//   * The rows. `translationList` is a helper of Template.translationSettings, but
//     `each translation in translationList` is written inside translationGeneral - a
//     DIFFERENT template. Blaze resolves a name against the current template's
//     helpers, the global helpers and the data context; it never searches an
//     enclosing template. So the list came out undefined and the table body was
//     empty. This is the same bug that emptied Organizations, Teams and People
//     (tests/tablePage.test.cjs), from the same cause.
//
//   * The button. forms.css styles every bare <button> from
//     `var(--theme-accent, #000)`, and with no per-user theme chosen that fallback is
//     literally black. It now takes the same colours as the other admin buttons.
//
// Run: node tests/translationPane.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const jade = read('client/components/settings/translationBody.jade');
const js = read('client/components/settings/translationBody.js');
const css = read('client/components/settings/translationBody.css');
const forms = read('client/components/forms/forms.css');

function template(name) {
  const start = jade.indexOf(`template(name="${name}")`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = jade.indexOf('\ntemplate(name=', start + 1);
  return jade.slice(start, after === -1 ? undefined : after);
}

console.log('translationPane:');

test('the list is handed to the template that iterates it', () => {
  // The helper is on the parent...
  assert.ok(/Template\.translationSettings\.helpers\(\{[\s\S]*?translationList\(\)/.test(js),
    'translationList is a helper of translationSettings');
  // ...so the child cannot look it up itself and must be given it.
  assert.ok(/\+translationGeneral\(translationList=translationList\)/.test(jade),
    'translationGeneral must be passed the list, not left to find it');
  const general = template('translationGeneral');
  assert.ok(/each translation in translationList/.test(general),
    'and it iterates what it was given');
  // It must NOT be a helper of the child - that would be a second source of truth.
  assert.ok(!/Template\.translationGeneral\.helpers/.test(js),
    'no duplicate helper on the child');
});

test('rows and the add button have working handlers', () => {
  // The + New link lives in the header cell; edit and the overflow menu on each row.
  assert.ok(/template\(name="newTranslationRow"\)/.test(jade), 'the add row exists');
  assert.ok(/a\.new-translation/.test(jade), 'with a + New link');
  assert.ok(/Template\.newTranslationRow\.events\(\{[\s\S]*?'click a\.new-translation'/.test(js),
    'the add link opens its popup, registered on the template that renders it');
  assert.ok(/Template\.translationRow\.events\(\{[\s\S]*?'click a\.edit-translation'/.test(js),
    'and each row can be edited');
  // The popups it opens have to exist, or the click does nothing visible.
  for (const popup of ['newTranslationPopup', 'editTranslationPopup']) {
    assert.ok(jade.includes(`template(name="${popup}")`), `${popup} must exist`);
  }
  // The new-translation form asks for language and text, which is what is added.
  const newPopup = template('newTranslationPopup');
  for (const field of ['js-translation-language', 'js-translation-text',
    'js-translation-translation-text']) {
    assert.ok(newPopup.includes(field), `${field} must be on the new-translation form`);
  }
});

test('the Search button follows the theme instead of being black', () => {
  // This is the shape being overridden.
  assert.ok(/button \{[\s\S]{0,120}background: var\(--theme-accent, #000\)/.test(forms),
    'forms.css really does default a bare button to black');
  const rule = /#translation-setting button#searchTranslationButton \{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the Search button must be themed');
  assert.ok(/background: var\(--theme-accent, #005377\)/.test(rule[1]),
    'the per-user accent wins, falling back to the WeKan button blue - not black');
  assert.ok(/color: #fff/.test(rule[1]), 'with white text on it');
});

test('every state is overridden, not just the resting one', () => {
  // forms.css sets :hover, :focus and :active from the same variable with their own
  // black-ish fallbacks, so overriding only the base leaves a button that turns black
  // the moment you touch it.
  for (const state of [':hover', ':focus', ':active']) {
    assert.ok(css.includes(`button#searchTranslationButton${state}`),
      `${state} must be overridden too`);
  }
  // ...including the compound one, which forms.css also styles.
  assert.ok(css.includes('button#searchTranslationButton:active:hover'),
    ':active:hover is a separate rule in forms.css and needs the same treatment');
  // No black BACKGROUND left in this pane. Black text is a different thing and is
  // used legitimately for the table, so this checks backgrounds only.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const black = code.split('\n').filter(l => /background[^:]*:\s*[^;]*#000\b/.test(l));
  assert.deepStrictEqual(black, [], 'no black button backgrounds:\n  ' + black.join('\n  '));
});

console.log(`\ntranslationPane: ${passed} tests passed`);
