'use strict';

// Admin Panel / Settings / Translation — what is specific to THIS pane.
//
// The pane renders through the shared table page now
// (docs/Features/Page/Table.md): the title, the search box, the pager, the total and
// the table itself are that design's, and tests/tablePage.test.cjs owns them —
// including that this pane subscribes to ONE page server-side and gets its total
// from a count method. Nothing here may restate those.
//
// What is left, and is only true of Translation:
//
//   * the four columns, the interactive row and the "New" link in the header;
//   * the three popups behind them and the handlers that open them, each
//     registered on the template that actually renders the link — Blaze resolves a
//     name against the current template, never an enclosing one, which is how this
//     pane once ended up with an empty table and a dead + New link;
//   * the admin-only model methods the popups call;
//   * no black button background left over from the hand-written pane. forms.css
//     styles every bare <button> from `var(--theme-accent, #000)`, and with no
//     per-user theme chosen that fallback is literally black — which is what the
//     pane's own Search button used to be. That button is gone (the shared row
//     searches on Enter), so its themed-button rules had to go with it rather than
//     linger as dead CSS.
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
const model = read('server/models/translation.js');

function template(name) {
  const start = jade.indexOf(`template(name="${name}")`);
  assert.ok(start >= 0, `template ${name} must exist`);
  const after = jade.indexOf('\ntemplate(name=', start + 1);
  return jade.slice(start, after === -1 ? undefined : after);
}

console.log('translationPane:');

test('the pane is the shared table page, plus its own columns', () => {
  const pane = template('translationSettings');
  assert.ok(/\+tablePage\(tablePageData\)/.test(pane),
    'the pane renders the shared table page and nothing else');
  // Hand-written markup, as JADE TAGS - `table`, `thead`, `tbody` at the start of
  // a line, or an id'd input/button. Matching the bare word "table" also matched
  // the `+tablePage(tablePageData)` include that this very test requires, so the
  // pane could not satisfy both halves at once.
  assert.ok(!/(^|\n)\s*(table|thead|tbody)\b/.test(pane.replace(/\+tablePage\([^)]*\)/g, '')),
    'no hand-written table may come back');
  assert.ok(!/(input|button)#/.test(pane),
    'and no hand-written search box or button');
  // Four columns: the actions column whose header is the "New" link, then language,
  // text and translation.
  for (const key of ["labelKey: 'language'", "labelKey: 'text'",
    "labelKey: 'translation-text'", "headerTemplate: 'newTranslationRow'"]) {
    assert.ok(js.includes(key), `the column spec must have ${key}`);
  }
  // "New" is the FIRST column, as on every other Admin Panel table page
  // (Organizations, Teams, People) - at the far right it read as belonging to the
  // last column rather than to the table.
  assert.ok(js.indexOf("headerTemplate: 'newTranslationRow'") < js.indexOf("labelKey: 'language'"),
    'the New column must be leftmost');
  // The helper belongs to the template that renders it: Blaze never looks at an
  // enclosing template, and a missing context draws the chrome and no table.
  assert.ok(/Template\.translationSettings\.helpers\(\{[\s\S]*?tablePageData\(\)/.test(js),
    'tablePageData must be a helper of translationSettings itself');
  // The old parent/child split that emptied this table is gone entirely.
  assert.ok(!/translationGeneral/.test(jade) && !/translationGeneral/.test(js),
    'the intermediate template must be gone, not left unused');
});

test('the row matches the header, and its cells come from the row context', () => {
  const row = template('translationRow');
  assert.strictEqual((row.match(/^    td/gm) || []).length, 4,
    'a row template owns its <tr> and must match the four columns');
  // …and the row matches that order: its actions cell comes first.
  assert.ok(row.indexOf('a.edit-translation') < row.indexOf('translationData.language'),
    'the actions cell sits under the New header, leftmost');
  for (const field of ['translationData.language', 'translationData.text',
    'translationData.translationText']) {
    assert.ok(row.includes(field), `${field} must be shown`);
  }
  assert.ok(/Template\.translationRow\.helpers\(\{[\s\S]*?translationData\(\)/.test(js),
    'and that helper is registered on the row template');
  // The row context is what the popups read, so it has to be the id.
  assert.ok(/docs: translations\.map\(translation => \(\{ translationId: translation\._id \}\)\)/.test(js),
    'each row is given { translationId }, which its popups look up');
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
  for (const popup of ['newTranslationPopup', 'editTranslationPopup',
    'settingsTranslationPopup']) {
    assert.ok(jade.includes(`template(name="${popup}")`), `${popup} must exist`);
  }
  // The new-translation form asks for language and text, which is what is added.
  const newPopup = template('newTranslationPopup');
  for (const field of ['js-translation-language', 'js-translation-text',
    'js-translation-translation-text']) {
    assert.ok(newPopup.includes(field), `${field} must be on the new-translation form`);
  }
});

test('an empty pane can still add the FIRST translation', () => {
  // The + New link is a column HEADER. The shared table page used to render no
  // table at all when there were no rows, so a pane with no custom strings had no
  // New link and no way to get one. The table is unconditional now.
  const tableJade = read('client/components/settings/tablePage.jade');
  const at = tableJade.indexOf('.table-page-table-wrap');
  assert.ok(at > 0);
  assert.ok(!/if rowCount/.test(tableJade.slice(0, at)),
    'the table - and with it this header - must render even with zero rows');
});

test('every method behind the popups is admin-only', () => {
  for (const method of ['setCreateTranslation', 'setTranslationText',
    'deleteTranslation', 'getTranslationsCollectionCount']) {
    const at = model.indexOf(`async ${method}(`);
    assert.ok(at > 0, `${method} must exist`);
    const body = model.slice(at, at + 700);
    assert.ok(/isAdmin/.test(body) && /not-authorized/.test(body),
      `${method} must refuse a non-admin caller`);
  }
  // Creating a duplicate string for the same language is rejected, and the popup
  // shows that instead of silently doing nothing.
  assert.ok(/text-already-taken/.test(model), 'a duplicate must be refused');
  assert.ok(/text-already-taken/.test(js), 'and the form must show it');
});

test('no black button background is left in this pane', () => {
  // This is the shape that would be inherited.
  assert.ok(/button \{[\s\S]{0,120}background: var\(--theme-accent, #000\)/.test(forms),
    'forms.css really does default a bare button to black');
  // The pane has no button of its own any more - it searches on Enter, like every
  // table page - so it must carry no button rules at all, themed or not.
  assert.ok(!/searchTranslationButton/.test(css) && !/searchTranslationButton/.test(jade),
    'the pane Search button and its stylesheet rules are gone together');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const black = code.split('\n').filter(l => /background[^:]*:\s*[^;]*#000\b/.test(l));
  assert.deepStrictEqual(black, [], 'no black button backgrounds:\n  ' + black.join('\n  '));
  // ...and what is left in this app-wide stylesheet must not reach a table page.
  for (const line of code.split('\n')) {
    assert.ok(!/^table[ ,{]/.test(line),
      `"${line.trim()}" is an app-wide table rule - scope it with :not(.table-page-table)`);
  }
});

console.log(`\ntranslationPane: ${passed} tests passed`);
