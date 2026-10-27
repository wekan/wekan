'use strict';

// CustomFieldBleed and GlobalBleed, from the GitHub Security Lab report in the
// Hall of Fame dated 2026-02-12 (fixed at WeKan v8.34): five findings,
// GHSL-2026-035 ... -045.
// Run: node tests/customFieldGlobalBleed.test.cjs
//
//   GHSL-2026-035 CursorBleed - still recorded as a gap in
//                  tests/securityRegressionCoverage.test.cjs; not covered here
//   GHSL-2026-036 WatchBleed  - the board publication sent integration tokens;
//                  pinned by tests/webhookUrlPublication.test.cjs
//   GHSL-2026-037 GlobalBleed - the `globalwebhooks` publication had no auth
//                  check and published every global webhook, token included,
//                  to anybody - logged out too. Pinned HERE.
//   GHSL-2026-044 CustomFieldBleed - the REST custom-field write routes checked
//                  access to the :boardId in the URL, then updated the field
//                  by `_id` ALONE, so a member of board A could rename,
//                  retype, reconfigure or empty the dropdown of a custom field
//                  that belongs to board B. Pinned HERE.
//   GHSL-2026-045 ImportLegacyBleed - SSRF through attachment URLs of an
//                  imported board; pinned by tests/followbleed.test.cjs
//                  (every importer downloads through the hop-validating
//                  fetchImportedAttachment / fetchSafe).
//
// No Problems key: GlobalBleed's guard answers an empty publication, which a
// non-admin page subscription can legitimately reach, and CustomFieldBleed's
// scope turns a cross-board write into a no-op update - neither refusal can
// be told apart from ordinary use.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Split a file into its REST handler sections.
function handlerSections(src) {
  const starts = [...src.matchAll(/WebApp\.handlers\.(get|post|put|delete|patch|use)\(/g)].map(m => m.index);
  return starts.map((at, i) => src.slice(at, starts[i + 1] ?? src.length));
}

// Every CustomFields write call in a text, with its selector argument.
function customFieldWrites(src) {
  const out = [];
  for (const m of src.matchAll(/CustomFields\.(?:direct\.)?(update|updateAsync|remove|removeAsync|upsert|upsertAsync)\(/g)) {
    let depth = 0;
    let i = m.index + m[0].length;
    const from = i;
    for (; i < src.length; i += 1) {
      const c = src[i];
      if (c === '{' || c === '(' || c === '[') depth += 1;
      else if (c === '}' || c === ')' || c === ']') { if (depth === 0) break; depth -= 1; }
      else if (c === ',' && depth === 0) break;
    }
    out.push({ op: m[1], selector: src.slice(from, i).trim() });
  }
  return out;
}

const SCOPED = /boardIds: \{ \$in: \[paramBoardId\] \}/;

test('CustomFieldBleed: every REST custom-field write is scoped to the URL board', () => {
  const src = code(read('server/models/customFields.js'));
  const sections = handlerSections(src).filter(s => /'\/api\/boards\/:boardId\/custom-fields/.test(s.slice(0, 200)));
  const writing = sections.filter(s => customFieldWrites(s).length);
  assert.ok(writing.length >= 5, `expected the five custom-field write routes, found ${writing.length}`);
  for (const section of writing) {
    const route = section.slice(0, section.indexOf('async function'));
    assert.match(section, /await Authentication\.checkBoardWriteAccess\(req\.userId, paramBoardId\)/,
      `${route}: write routes require write access to the URL board`);
    for (const { op, selector } of customFieldWrites(section)) {
      if (selector === 'boardScopedField') {
        assert.match(section, /const boardScopedField = \{\s*_id: paramFieldId,\s*boardIds: \{ \$in: \[paramBoardId\] \},\s*\}/, route);
        continue;
      }
      assert.match(selector, SCOPED, `${route}: ${op}(${selector}) must also match boardIds of the URL board`);
    }
  }
  // The PUT route still applies its fields through the scoped selector.
  const put = sections.find(s => s.startsWith("WebApp.handlers.put('/api/boards/:boardId/custom-fields/:customFieldId'"));
  assert.ok(put, 'the custom-field PUT route exists');
  assert.ok(customFieldWrites(put).length >= 8, 'PUT updates each supported field');
  assert.ok(customFieldWrites(put).every(w => w.selector === 'boardScopedField'));
});

test('CustomFieldBleed: the selector logic itself refuses a field of another board', () => {
  // The REST selector is { _id, boardIds: { $in: [paramBoardId] } }; model it
  // as Mongo would match an array field against $in.
  const matches = (doc, boardId, id) => doc._id === id && doc.boardIds.includes(boardId);
  const fieldOfB = { _id: 'cf1', boardIds: ['boardB'] };
  assert.equal(matches(fieldOfB, 'boardA', 'cf1'), false, 'attacker passes their own board A in the URL');
  assert.equal(matches(fieldOfB, 'boardB', 'cf1'), true, 'the field still updates through its own board');
});

test('CustomFieldBleed negative: no REST handler anywhere writes a custom field by _id alone', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (['tests', 'node_modules', '_build', '.build'].includes(e.name)) return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(rel) ? [rel] : []);
  });
  const offenders = [];
  for (const file of ['server', 'models', 'imports'].flatMap(walk)) {
    const src = code(read(file));
    if (!/WebApp\.handlers\./.test(src)) continue;
    for (const section of handlerSections(src)) {
      for (const { op, selector } of customFieldWrites(section)) {
        if (selector === 'boardScopedField' || /boardIds:/.test(selector)) continue;
        offenders.push(`${file}: ${op}(${selector.slice(0, 60)})`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'a REST custom-field write must name the board as well as the field');
});

test('GlobalBleed: globalwebhooks is published to logged-in site admins only, without tokens', () => {
  const src = code(read('server/publications/settings.js'));
  const at = src.indexOf("Meteor.publish('globalwebhooks'");
  assert.ok(at >= 0, 'the globalwebhooks publication exists');
  const body = src.slice(at, src.indexOf('\n});', at));
  assert.match(body, /async function\(\)/, 'a function, not an arrow, so this.userId is the subscriber');
  assert.match(body, /if \(!this\.userId\) \{\s*return this\.ready\(\);/);
  assert.match(body, /if \(!user \|\| !user\.isAdmin\) \{\s*return this\.ready\(\);/);
  assert.ok(body.indexOf('this.ready()') < body.indexOf('getIntegrations('), 'the checks run before the query');
  assert.match(body, /fields: \{\s*token: 0,\s*\}/, 'the webhook token is never published');
});

test('GlobalBleed negative: no publication sends the GLOBAL webhooks without an admin check', () => {
  const dir = path.join(ROOT, 'server/publications');
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    const src = code(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const m of src.matchAll(/GLOBAL_WEBHOOK_ID/g)) {
      const pubAt = src.lastIndexOf('Meteor.publish(', m.index);
      const pub = src.slice(pubAt, src.indexOf('\n});', m.index));
      assert.match(pub, /isAdmin/, `${file}: a publication reading the global webhooks must check site admin`);
      assert.match(pub, /token: 0/, `${file}: and must not publish their token`);
    }
  }
});

console.log(`customFieldGlobalBleed: ${passed} checks passed`);
