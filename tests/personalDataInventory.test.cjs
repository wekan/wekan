'use strict';

// Guard: every MongoDB collection WeKan defines is in the personal-data
// inventory, models/lib/personalDataInventory.js (docs/Compliance/README.md
// rows 2.1 and 2.2, work package WP-3), and docs/Compliance/Data-Inventory.md
// is exactly what releases/compliance/data-inventory.mjs writes from it.
// Run: node tests/personalDataInventory.test.cjs
//
// Erasure (WP-4), the personal-data export (WP-5) and the privacy pages (WP-6)
// are driven from that inventory, so a collection added without an entry is a
// collection none of them know about. The scan is of the source, the same way
// for every collection: `new Mongo.Collection('x')` (or a constant holding the
// name, resolved in the same file), Meteor-Files `collectionName: 'x'`, and
// `rawDatabase().collection('x')`, in models/, server/ and packages/, skipping
// node_modules, every rspack output directory (`_build*`), .build, .tools and
// the test suites.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const inventory = require(path.join(ROOT, 'models/lib/personalDataInventory.js'));

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const SCAN_DIRS = ['models', 'server', 'packages'];
const SKIP_DIRS = new Set(['node_modules', '.build', '.tools', 'tests', '.git']);
const isTestFile = name => /(?:[._]tests?)\.js$/.test(name);
// The inventory itself quotes the patterns in its comment.
const SKIP_FILES = new Set(['models/lib/personalDataInventory.js']);

function walk(rel, out) {
  for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
    const name = entry.name;
    if (SKIP_DIRS.has(name) || name.startsWith('_build')) continue;
    const child = `${rel}/${name}`;
    if (entry.isDirectory()) walk(child, out);
    else if (/\.(js|cjs|mjs)$/.test(name) && !isTestFile(name) && !SKIP_FILES.has(child)) out.push(child);
  }
  return out;
}

// Every collection name `text` defines, as [{ collection, file }]. A
// `new Mongo.Collection(NAME)` whose NAME cannot be resolved to a string in the
// same file is reported as unresolved, so a definition cannot hide from the
// scan by using a variable.
function scanText(text, file) {
  const found = [];
  const unresolved = [];
  const literal = /new\s+Mongo\.Collection\(\s*(['"`])([^'"`]+)\1/g;
  const named = /new\s+Mongo\.Collection\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
  const files = /(?<![\w$])collectionName\s*:\s*(['"`])([^'"`]+)\1/g;
  const raw = /rawDatabase\(\)\s*\.collection\(\s*(['"`])([^'"`]+)\1/g;
  for (const re of [literal, files, raw]) {
    for (const m of text.matchAll(re)) found.push({ collection: m[2], file });
  }
  for (const m of text.matchAll(named)) {
    if (m[1] === 'null' || m[1] === 'undefined') continue; // client-only, not stored
    const def = new RegExp(`(?:const|let|var)\\s+${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*(['"\`])([^'"\`]+)\\1`).exec(text);
    if (def) found.push({ collection: def[2], file });
    else unresolved.push(`${file}: new Mongo.Collection(${m[1]})`);
  }
  return { found, unresolved };
}

function scanTree() {
  const found = [];
  const unresolved = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(dir, [])) {
      const r = scanText(fs.readFileSync(path.join(ROOT, file), 'utf8'), file);
      found.push(...r.found);
      unresolved.push(...r.unresolved);
    }
  }
  return { found, unresolved };
}

// The collections of `found` that the inventory does not classify, sorted.
function unclassified(found, inv) {
  const known = new Set(inv.map(e => e.collection));
  return [...new Set(found.map(f => f.collection))].filter(c => !known.has(c)).sort();
}

// The WP-4 work list: collections whose erasure should delete or anonymise,
// and that nothing erases today. It may only SHRINK: a fix in WP-4 sets the
// entry's erasureWhere and removes the name here; a new collection with the
// gap fails the test instead of joining the list quietly.
const KNOWN_WP4_GAPS = [
  'activityNotificationIntents',
  'activityNotificationPlans',
  'activityPubFollowers',
  'billingRates',
  'board_email_addresses',
  'card_comment_reactions',
  'cfs.avatars.filerecord',
  'checklistItems',
  'cloudChatMessages',
  'email_bounces',
  'eventlog',
  'github_import_jobs',
  'idleSessions',
  'invitation_codes',
  'listSyncCredentials',
  'listSyncNotificationPlans',
  'listSyncRuleEmailCommands',
  'listSyncRuleEmailOutcomes',
  'loginAddresses',
  'notificationEmailCommands',
  'notificationEmailControls',
  'notificationEmailJobs',
  'notificationEmailLeases',
  'notificationTrayReceipts',
  'notificationWebhookJobs',
  'orgUser',
  'passkeyChallenges',
  'presences',
  'recoveryEvents',
  'sandstorm_api_grants',
  'sessiondata',
  'shortPasswordLogins',
  'sqrlSessions',
  'timeEntries',
  'trello_api_credentials',
  'trello_export_jobs',
  'trello_import_jobs',
  'unsaved-edits',
  'userPositionHistory',
  'windowsSsoTokens',
];

(async () => {
  const { found, unresolved } = scanTree();
  const scanned = new Map();
  for (const f of found) {
    if (!scanned.has(f.collection)) scanned.set(f.collection, new Set());
    scanned.get(f.collection).add(f.file);
  }

  test('the scan finds the collections (it is not silently empty)', () => {
    assert.ok(scanned.size >= 170, `expected at least 170 collections, found ${scanned.size}`);
    for (const c of ['users', 'boards', 'cards', 'workloadAbsences', 'loginAddresses']) {
      assert.ok(inventory.entryFor(c), `${c} is in the inventory`);
    }
    assert.ok(scanned.has('archivedSwimlaneIds'), 'a name held in a constant is resolved');
  });

  test('every Mongo.Collection is defined by a name the scan can read', () => {
    assert.deepStrictEqual(unresolved, [],
      'use a string literal or a same-file const for the name:\n  ' + unresolved.join('\n  '));
  });

  test('every collection found in the tree is classified', () => {
    const missing = unclassified(found, inventory.INVENTORY);
    assert.deepStrictEqual(missing, [],
      'add an entry to models/lib/personalDataInventory.js for each of these, then run ' +
      'node releases/compliance/data-inventory.mjs:\n  ' + missing.join('\n  '));
  });

  test('negative: a new unclassified collection fails, and is named', () => {
    const fake = scanText(
      "export const Things = new Mongo.Collection('brandNewThings');\n" +
      "const NAME = 'otherNewThings';\nconst Other = new Mongo.Collection(NAME, { idGeneration: 'STRING' });\n" +
      "const Files = new FilesCollection({ collectionName: 'newUploads' });\n" +
      "const Hidden = new Mongo.Collection(dynamicName);\n" +
      "const Client = new Mongo.Collection(null);\n" +
      "doc._collectionName = 'x'; const y = { _collectionName: 'notACollection' };\n",
      'models/fake.js');
    assert.deepStrictEqual(unclassified([...found, ...fake.found], inventory.INVENTORY),
      ['brandNewThings', 'newUploads', 'otherNewThings']);
    assert.deepStrictEqual(fake.unresolved, ['models/fake.js: new Mongo.Collection(dynamicName)']);
    assert.ok(isTestFile('livedata_server_tests.js') && isTestFile('x.tests.js') && !isTestFile('tests.js.map'));
  });

  test('no entry names a collection that no longer exists', () => {
    const gone = [];
    for (const e of inventory.INVENTORY) {
      if (scanned.has(e.collection)) {
        if (!scanned.get(e.collection).has(e.definedIn)) {
          gone.push(`${e.collection}: definedIn ${e.definedIn}, but it is defined in ${[...scanned.get(e.collection)].join(', ')}`);
        }
        continue;
      }
      // Meteor.users and GridFS buckets have no `new Mongo.Collection` line:
      // their entry names the text that defines them.
      const file = path.join(ROOT, e.definedIn);
      if (!e.definedBy || !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(e.definedBy)) {
        gone.push(`${e.collection} (${e.definedIn}${e.definedBy ? `, "${e.definedBy}"` : ''})`);
      }
    }
    assert.deepStrictEqual(gone, [], 'remove or correct these entries:\n  ' + gone.join('\n  '));
  });

  test('each collection has one entry, in name order', () => {
    const names = inventory.INVENTORY.map(e => e.collection);
    assert.strictEqual(new Set(names).size, names.length, 'duplicate entries');
    assert.deepStrictEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  test('every entry is complete, its categories and erasure are from the lists, and its paths exist', () => {
    const problems = [];
    const exists = rel => fs.existsSync(path.join(ROOT, rel));
    for (const e of inventory.INVENTORY) {
      const id = e.collection;
      if (!Array.isArray(e.categories) || e.categories.length === 0) problems.push(`${id}: no categories`);
      for (const c of e.categories || []) {
        if (!inventory.CATEGORIES.includes(c)) problems.push(`${id}: unknown category ${c}`);
      }
      if (e.categories.includes('none') && (e.categories.length !== 1 || e.erasure !== 'n/a')) {
        problems.push(`${id}: 'none' stands alone, with erasure 'n/a'`);
      }
      if (!inventory.ERASURE.includes(e.erasure)) problems.push(`${id}: unknown erasure ${e.erasure}`);
      if (typeof e.notes !== 'string') problems.push(`${id}: notes is not a string`);
      for (const k of ['purpose', 'legalBasisHint', 'definedIn']) {
        if (typeof e[k] !== 'string' || !e[k].trim()) problems.push(`${id}: empty ${k}`);
      }
      if (e.subjectField !== null && (typeof e.subjectField !== 'string' || !e.subjectField)) problems.push(`${id}: subjectField`);
      if (!e.retention || typeof e.retention.default !== 'string' || !e.retention.default) problems.push(`${id}: retention.default`);
      for (const [k, rel] of [['definedIn', e.definedIn], ['retention.where', e.retention && e.retention.where], ['erasureWhere', e.erasureWhere]]) {
        if (rel !== null && rel !== undefined && !exists(rel)) problems.push(`${id}: ${k} ${rel} does not exist`);
      }
    }
    assert.deepStrictEqual(problems, []);
  });

  test('health and financial data are marked as such', () => {
    const health = inventory.entriesWithCategory('health');
    assert.ok(health.some(e => e.collection === 'workloadAbsences'), 'workload absences have a sick type');
    for (const e of health) assert.match(e.notes, /Art\. 9/, `${e.collection} says it is GDPR Art. 9 data`);
    const financial = inventory.entriesWithCategory('financial');
    for (const c of ['billingInvoices', 'billingRates', 'timeEntries']) {
      assert.ok(financial.some(e => e.collection === c), `${c} is financial`);
    }
    for (const e of financial) assert.match(e.notes, /FINANCIAL/i, `${e.collection} says it is financial`);
    for (const c of ['loginAddresses', 'users']) {
      assert.ok(inventory.entryFor(c).categories.includes('network'), `${c} holds addresses`);
    }
    assert.ok(inventory.entryFor('card_comments').categories.includes('content'));
    assert.ok(inventory.entryFor('notificationEmailJobs').categories.includes('contact'));
  });

  test('the erasure gaps are exactly the known WP-4 list, which may only shrink', () => {
    const gaps = inventory.erasureGaps();
    const added = gaps.filter(c => !KNOWN_WP4_GAPS.includes(c));
    assert.deepStrictEqual(added, [],
      'these collections should be deleted or anonymised on erasure but nothing does it; ' +
      'add the erasure (models/lib/userDeletionCleanup.js) and set erasureWhere, rather than growing the list:\n  ' +
      added.join('\n  '));
    const fixed = KNOWN_WP4_GAPS.filter(c => !gaps.includes(c));
    assert.deepStrictEqual(fixed, [], 'these are erased now (or gone): remove them from KNOWN_WP4_GAPS:\n  ' + fixed.join('\n  '));
    assert.deepStrictEqual(inventory.erasureGaps([
      { collection: 'a', erasure: 'delete', erasureWhere: null },
      { collection: 'b', erasure: 'anonymize', erasureWhere: 'models/lib/userAnonymization.js' },
      { collection: 'c', erasure: 'keep-pseudonymous', erasureWhere: null },
    ]), ['a']);
  });

  test('docs/Compliance/Data-Inventory.md is exactly what data-inventory.mjs writes', async () => {
    const gen = await import(path.join(ROOT, 'releases/compliance/data-inventory.mjs'));
    const have = fs.readFileSync(path.join(ROOT, gen.DOC), 'utf8');
    assert.strictEqual(have, gen.dataInventoryMarkdown(), 'run node releases/compliance/data-inventory.mjs');
    for (const e of inventory.INVENTORY) assert.ok(have.includes(`| \`${e.collection}\` |`), e.collection);
  });

  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`personalDataInventory: ${passed} passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
