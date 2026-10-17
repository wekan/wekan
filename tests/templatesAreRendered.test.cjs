'use strict';

// Every Jade template under client/ must be drawn from somewhere: included
// (+name), opened as a popup (Popup.open('name') draws namePopup), rendered by
// name from code ('name' in a string), or built by one of the name patterns
// below. A template nothing draws is markup, helpers and events that do
// nothing while looking like a feature - the attachment settings pane in
// settingBody.js (S3, transfer limits, storage paths), the date badges
// dateBadge / dateCustomField / cardCustomFieldDate, orgAvatar / teamAvatar,
// three *ModalTitle templates, boardLists, boardCreateRulePopup,
// addMemberPopupTest and the subtasksItems chain were all of that and were
// removed.
//
// The negative sweep fails when another template is left drawn by nothing.
// The only exceptions are the name patterns and the list below, each with
// its reason.
//
// Run: node tests/templatesAreRendered.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['_build', 'node_modules', '.npm']);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(js|jade|html)$/.test(e.name)) out.push(full);
  }
  return out;
}

// Names built at runtime: `${view}Sidebar` (sidebar.js), `spinner${name}`
// (settingBody.js, the wait spinners), `cardCustomField-${type}`
// (cardCustomFields.js).
const BUILT = [/Sidebar$/, /^spinner[A-Z]/, /^cardCustomField-/];

// Kept on purpose, not drawn by name.
const PENDING = {
  // An extension point: FilterProviderRegistry entries name the template
  // they render, and tests/filterProviders.test.cjs registers this one.
  textFilterProvider: 'filter-provider extension point',
};

const templates = new Map();
const parts = [];
for (const file of ['client', 'config', 'models', 'server', 'imports', 'packages']
  .flatMap(top => walk(path.join(ROOT, top)))) {
  let src = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.jade')) {
    for (const m of src.matchAll(/^template\(name=["']([^"']+)["']\)/gm)) {
      templates.set(m[1], path.relative(ROOT, file));
    }
    // To a fixed point: removing one declaration must not splice its
    // neighbours into another (CodeQL js/incomplete-multi-character-
    // sanitization, alert #588 - see tests/tagStrippingFixedPoint.test.cjs).
    let previousJade;
    do {
      previousJade = src;
      src = src.replace(/^template\(name=["'][^"']+["']\)/gm, '');
    } while (src !== previousJade);
  }
  // A template's own helpers/events are not somebody drawing it.
  let previous;
  do {
    previous = src;
    src = src.replace(/Template(?:\.\w+|\[['"][^'"]+['"]\])\.(?:helpers|events|onCreated|onRendered|onDestroyed)/g, '');
  } while (src !== previous);
  parts.push(src);
}
const corpus = parts.join('\n');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function drawn(name) {
  const quoted = n => new RegExp(`['"\`]${esc(n)}['"\`]`).test(corpus);
  return new RegExp(`\\+${esc(name)}\\b`).test(corpus)
    || quoted(name)
    || new RegExp(`Template\\.${esc(name)}\\b`).test(corpus)
    || (name.endsWith('Popup') && quoted(name.slice(0, -'Popup'.length)));
}

console.log('templatesAreRendered:');

test('the scan sees the templates', () => {
  assert.ok(templates.size > 500, `found only ${templates.size} templates`);
  assert.ok(drawn('cardDetails') && drawn('setting'), 'and recognises drawn ones');
});

test('the removed templates stay removed', () => {
  for (const gone of ['attachmentSettings', 'storageSettings', 'attachmentMigration',
    'attachmentMonitoring', 'dateBadge', 'dateCustomField', 'cardCustomFieldDate',
    'orgAvatar', 'teamAvatar', 'globalSearchModalTitle', 'dueCardsModalTitle',
    'myCardsModalTitle', 'boardLists', 'boardCreateRulePopup', 'addMemberPopupTest',
    'subtasksItems', 'subtaskItemDetail', 'addSubtaskItemForm',
    // Original positions are the board menu's originalPositionsSidebar now;
    // the per-item component repeated what that lists and was never placed.
    'originalPositionsView', 'originalPosition']) {
    assert.ok(!templates.has(gone), `${gone} was drawn by nothing and was removed`);
  }
});

test('each pending exception still exists, so the list cannot go stale', () => {
  for (const name of Object.keys(PENDING)) {
    assert.ok(templates.has(name), `${name} is listed as pending but no longer exists`);
  }
});

test('every other template is drawn from somewhere (negative)', () => {
  const undrawn = [...templates].filter(([name]) => !drawn(name)
    && !BUILT.some(re => re.test(name)) && !(name in PENDING))
    .map(([name, file]) => `${file}: ${name}`);
  assert.deepStrictEqual(undrawn, [], 'nothing draws these templates');
});

console.log(`\ntemplatesAreRendered: ${passed} tests passed`);
