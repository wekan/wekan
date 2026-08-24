'use strict';

// Which permission-override attempts are watched, and can any of them tell the
// attacker they were seen? (design: docs/Security/Remediation/WeKan.md §12)
//
// A canary is worth nothing in two situations, and this suite exists for both:
//
//   1. It is not there. A guard that refuses silently records nothing, so the
//      admin never learns that somebody spent an afternoon trying to move cards
//      into a board they cannot read. Below: every server-side detectable
//      hall-of-fame attempt has a canary at the point that refuses it.
//   2. It announces itself. If a canaried refusal differs from an ordinary one -
//      a different message, a different status, a delay, a thrown error - a probe
//      simply learns which paths are watched and avoids them. Below: no call site
//      returns anything but the refusal it returned before.
//
// Run: node tests/canaryCoverage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { canaryIds, canaryFor } = require('../models/lib/canaryTokens');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Every canary, the file that trips it, and the published vulnerability whose
// attempt it watches. "-" means it watches a class with no single *Bleed.
const WIRED = [
  ['card.cross-board-move',            'server/permissions/cards.js',                 'BoardBleed'],
  ['card.invisible-parent',            'server/permissions/cards.js',                 'ParentBleed'],
  ['card.vote-field',                  'server/permissions/cards.js',                 '-'],
  ['card.poker-field',                 'server/permissions/cards.js',                 '-'],
  ['user.miniprofile-without-login',  'server/publications/users.js',                'MiniProfileBleed'],
  ['history.cross-board',              'server/permissions/userPositionHistory.js',   'PositionHistoryBleed'],
  ['cas.account-conflict',             'packages/wekan-accounts-cas/cas_server.js',    'CasBleed'],
  ['list.cross-board-move',            'server/permissions/lists.js',                 'BoardBleed'],
  ['swimlane.cross-board-move',        'server/permissions/swimlanes.js',             'BoardBleed'],
  ['checklist.cross-board-move',       'server/permissions/checklists.js',            'ChecklistBleed'],
  ['checklist-item.cross-board-move',  'server/permissions/checklistItems.js',        'ChecklistBleed'],
  ['avatar.version-path',              'server/permissions/avatars.js',               'PathBleed'],
  ['avatar.restricted-field',          'server/permissions/avatars.js',               'PathBleed'],
  ['avatar.not-owner',                 'server/permissions/avatars.js',               'PathBleed'],
  ['attachment.version-path',          'server/permissions/attachments.js',           'PathBleed'],
  ['attachment.restricted-field',      'server/permissions/attachments.js',           'PathBleed'],
  ['reaction.foreign',                 'server/permissions/cardCommentReactions.js',  '-'],
  ['comment.foreign-delete',           'server/models/cardComments.js',               'CommentBleed'],
  ['calendar.import-without-write',    'server/methods/icsImport.js',                  'CalendarBleed'],
  ['board.write-without-capability',   'server/authentication.js',                     'AssignedBleed'],
  ['tenant.mutate-without-admin',      'server/lib/adminCollectionPermission.js',      'TenantBleed'],
  ['export.path-outside-storage',      'models/exporter.js',                          'PathBleed'],
  ['database.canary',                  'server/lib/databaseProblems.js',              '-'],
  // Injection - the attacker sends a query instead of a value.
  // GHSA-phm4-4v26-j2vq: this trip moved OUT of cardsWindow.js into the shared
  // guard, because eight other handlers needed the same check and a second copy
  // of it would be the same bug set up to happen again.
  ['injection.nosql-selector',         'server/lib/selectorGuard.js',                '-'],
  ['injection.nosql-operator',         'models/lib/injectionDetect.js',               '-'],
  ['injection.sql-statement',          'server/lib/databaseProblems.js',              'EscapeBleed'],
  // Sanitization - something DANGEROUS had to be removed, not merely tidied.
  ['sanitize.dangerous-filename',      'server/lib/filenameSanitizeLog.js',           'FileBleed'],
  ['sanitize.path-traversal',          'server/lib/filenameSanitizeLog.js',           'FileBleed'],
  ['sanitize.dangerous-content',       'models/lib/sanitizeUploadedFile.js',          'SpaceBleed'],
  ['sanitize.dangerous-text',          'models/cardComments.js',                      'InputBleed'],
  // Other common attacks.
  ['spoof.forwarded-header',           'models/server/metrics.js',                    'MetricsBleed'],
  ['brute.login-lockout',              'server/apiAuthRoutes.js',                     'LockoutBleed'],
];

// One canary above is declared where its DETECTOR lives rather than at a call
// site. `injection.nosql-operator` is the id a caller passes when it finds an
// operator object on an input path it owns - the detector and the id belong
// together, and naming it there keeps the catalog honest (every id has a home)
// while the table below stays the list of places that actually trip one.
const DECLARED_NOT_TRIPPED = new Set(['injection.nosql-operator']);

test('every catalogued canary is actually wired somewhere', () => {
  const wiredIds = new Set(WIRED.map(w => w[0]));
  const orphans = canaryIds().filter(id => !wiredIds.has(id));
  assert.deepStrictEqual(orphans, [],
    'a canary in the catalog that nothing trips is a tripwire nobody laid');
});

test('every wired canary is in the catalog, and its file names it', () => {
  const { CANARY_IDS } = require('../models/lib/injectionDetect');
  // A call site may spell the id literally, or reach it through the CANARY_IDS
  // map that lives beside the detector which produced the finding. Both are
  // "naming it"; a call site that names neither is a canary nobody can trace
  // back to its catalog entry.
  const namedBy = (src, id) => {
    if (src.includes(`'${id}'`)) return true;
    const alias = Object.keys(CANARY_IDS).find(k => CANARY_IDS[k] === id);
    return !!alias && src.includes(`CANARY_IDS.${alias}`);
  };

  WIRED.forEach(([id, file]) => {
    assert.ok(canaryFor(id).known, `${id} is tripped in ${file} but is not catalogued`);
    const src = read(file);
    assert.ok(namedBy(src, id), `${file} must name ${id}`);
    if (!DECLARED_NOT_TRIPPED.has(id)) {
      assert.ok(/tripCanary|tripCanaryDeny/.test(src), `${file} must actually trip a canary`);
    }
  });
});

test('the CANARY_IDS aliases resolve to real catalogued canaries', () => {
  const { CANARY_IDS } = require('../models/lib/injectionDetect');
  Object.entries(CANARY_IDS).forEach(([alias, id]) => {
    assert.ok(canaryFor(id).known, `CANARY_IDS.${alias} points at "${id}", which is not catalogued`);
  });
});

test('the attempts behind published vulnerabilities are watched', () => {
  // Not every hall-of-fame entry can be watched server-side - a fixed XSS leaves
  // nothing to detect at runtime - but every one whose ATTEMPT still reaches a
  // permission check should trip something.
  const watched = new Set(WIRED.map(w => w[2]).filter(b => b !== '-'));
  ['BoardBleed', 'ChecklistBleed', 'PathBleed', 'ParentBleed', 'CommentBleed',
    'CalendarBleed', 'AssignedBleed', 'TenantBleed', 'MiniProfileBleed',
    'PositionHistoryBleed', 'CasBleed'].forEach(bleed => {
    assert.ok(watched.has(bleed), `${bleed}'s attempt has no canary`);
  });
});

// ------------------------------------------------------- it must stay silent

test('SILENT: no canary call site changes what the caller gets back', () => {
  // tripCanary returns false and tripCanaryDeny returns true, so a call site
  // reads as the refusal it replaced. Anything else - a throw, a different
  // status, an added message - would be the tell.
  const files = [...new Set(WIRED.map(w => w[1]))];
  files.forEach(file => {
    const src = read(file);
    const calls = src.match(/trip(Canary|CanaryDeny)\([^;]*?\)/g) || [];
    calls.forEach(call => {
      assert.ok(!/throw/.test(call), `${file}: a canary must not throw: ${call}`);
    });
  });
});

test('SILENT: the deny rules still refuse by returning true, allow rules by false', () => {
  const cards = read('server/permissions/cards.js');
  // The allow rule's vote/poker branches replaced `return false` - the refusal
  // is identical, and the canary is the only thing added.
  assert.ok(/return tripCanary\('card\.vote-field'/.test(cards));
  assert.ok(/return tripCanary\('card\.poker-field'/.test(cards));
  // The deny rules replaced `return true`.
  assert.ok(/return tripCanaryDeny\('card\.cross-board-move'/.test(cards));
  assert.ok(/return tripCanaryDeny\('card\.invisible-parent'/.test(cards));
});

test('SILENT: the REST comment delete still throws the SAME refusal', () => {
  const src = read('server/models/cardComments.js');
  const block = src.match(/if \(comment\.userId && comment\.userId !== req\.userId\)[\s\S]*?\n      \}/)[0];
  // The canary is recorded and the original refusal is re-thrown untouched, so
  // the caller sees the same 403 with the same message as before.
  assert.ok(/catch \(refusal\) \{/.test(block));
  assert.ok(/tripCanary\('comment\.foreign-delete'/.test(block));
  assert.ok(/throw refusal;/.test(block), 'the original error is re-thrown, not a new one');
  assert.ok(!/sendJsonResult/.test(block), 'no new response shape is introduced');
});

test('SILENT: the export drops the file exactly as it did before', () => {
  const src = read('models/exporter.js');
  const block = src.match(/if \(!isReadableStoredFilePath\(storedPath\)\)[\s\S]*?return;\n      \}/)[0];
  assert.ok(/tripCanary\('export\.path-outside-storage'/.test(block));
  assert.ok(/callback\(null, null\);/.test(block), 'the same "no file" answer as before');
  assert.ok(/catch \(e\) \{ \/\* never break an export to report on it \*\/ \}/.test(block));
});

test('SILENT: nothing tells the caller a canary exists', () => {
  const files = [...new Set(WIRED.map(w => w[1]))].concat(['server/lib/canary.js']);
  files.forEach(file => {
    const src = read(file);
    // The words that would leak into a message. Comments are fine - they do not
    // cross the wire - so only string literals are checked.
    const literals = src.match(/(['"`])(?:\\.|(?!\1).)*\1/g) || [];
    literals.forEach(lit => {
      const low = lit.toLowerCase();
      if (low.includes('canary:')) return;               // the FerretDB marker
      // The PHRASES that would tell somebody they were watched. Deliberately
      // specific: "You've been logged out" is an ordinary message that happens
      // to contain "logged", and a guard that fails on it would be turned off.
      const leaks = [
        'has been recorded', 'have been recorded', 'was recorded',
        'has been reported', 'was reported', 'we detected', 'attempt detected',
        'this attempt', 'security team', 'administrator has been',
        'your ip has', 'you have been flagged', 'tripwire',
      ];
      leaks.forEach(phrase => {
        assert.ok(!low.includes(phrase),
          `${file}: a message reveals detection ("${phrase}"): ${lit}`);
      });
    });
  });
});

// --------------------------------------------------------- it must stay cheap

test('BOUNDED: every trip goes through the one rate-limited entry point', () => {
  // A guard that called securityLog.record directly for an attacker-controlled
  // path would be an unbounded write, which is the thing the limiter exists to
  // prevent. Canary sites use tripCanary, never the raw logger.
  [...new Set(WIRED.map(w => w[1]))].forEach(file => {
    if (file === 'server/lib/databaseProblems.js') return;  // records other streams too
    const src = read(file);
    assert.ok(!/securityLog\.record\(/.test(src),
      `${file} must trip canaries, not write events itself`);
  });
});

test('BOUNDED: the limiter is a single shared instance, not one per call', () => {
  const src = read('server/lib/canary.js');
  const news = src.match(/new CanaryRateLimiter\(/g) || [];
  assert.strictEqual(news.length, 1, 'one limiter for the process, or the caps mean nothing');
  assert.ok(/^const limiter = new CanaryRateLimiter\(\);$/m.test(src));
});

test('BOUNDED: idle pairs are swept on a timer', () => {
  const src = read('server/lib/canary.js');
  assert.ok(/Meteor\.setInterval\(/.test(src));
  assert.ok(/limiter\.sweep\(Date\.now\(\), IDLE_MS\)/.test(src));
  assert.ok(/catch \(e\)/.test(src), 'a sweeper that throws must not take the timer down');
});

// ---------------------------------------------------- it must stay attributed

test('ATTRIBUTED: the event carries the account, the name and the address', () => {
  const src = read('server/lib/canary.js');
  const report = src.match(/function report\(canaryId, context\)[\s\S]*?\n\}/)[0];
  ['userId:', 'username:', 'ip:', 'count:'].forEach(field => {
    assert.ok(report.includes(field), `the recorded event must carry ${field}`);
  });
});

test('ATTRIBUTED: the schema and the logger both know the new fields', () => {
  const schema = read('models/eventLog.js');
  ['username:', 'ip:', 'count:'].forEach(f => assert.ok(schema.includes(f),
    `models/eventLog.js schema must declare ${f} - collection2 drops what it does not know`));
  const logger = read('server/lib/securityLog.js');
  assert.ok(/doc\.username = String\(m\.username\)\.slice/.test(logger));
  assert.ok(/doc\.ip = String\(m\.ip\)\.slice/.test(logger));
});

test('ATTRIBUTED: the Admin Panel shows them, and they are searchable', () => {
  const reports = read('client/components/settings/adminProblems.js');
  // Two address columns, not one: an instance reached over IPv6 and one reached
  // over IPv4 are different situations, and a column that sometimes holds one
  // and sometimes the other cannot be scanned down.
  assert.ok(/labelKey: 'event-ipv4'/.test(reports), 'an IPv4 column');
  assert.ok(/labelKey: 'event-ipv6'/.test(reports), 'an IPv6 column');
  assert.ok(/labelKey: 'event-attempts'/.test(reports), 'an attempts column');
  assert.ok(/r\.username \|\| userName\(r\.userId\)/.test(reports),
    'the stored username wins over a lookup, so a rename does not rewrite history');
  const model = read('models/eventLog.js');
  assert.ok(/\{ username: rx \}, \{ ip: rx \}/.test(model),
    'searching the table for an address or an account must find its rows');
  const i18n = require('../imports/i18n/data/en.i18n.json');
  assert.ok(i18n['event-ip'] && i18n['event-attempts'], 'both columns have English labels');
});

// -------------------------------------------------------------- the database

test('the FerretDB canary marker is parsed the same way on both sides', () => {
  const { databaseCanaryId } = requireDatabaseProblemsHelpers();
  assert.strictEqual(databaseCanaryId('operation not supported by this build (canary:db.javascript eval)'),
    'db.javascript');
  assert.strictEqual(databaseCanaryId({ message: 'x (canary:db.drop-database dropdatabase)' }),
    'db.drop-database');
  // Not one of ours.
  assert.strictEqual(databaseCanaryId('some unrelated failure'), '');
  assert.strictEqual(databaseCanaryId(null), '');
  // A marker that is not an identifier is not a marker: an error string is
  // attacker-influenced and must not choose a category.
  assert.strictEqual(databaseCanaryId('canary:<script>'), '');
  assert.strictEqual(databaseCanaryId('canary:' + 'a'.repeat(200)), '');
});

test('an unrecognised database canary id is recorded generically, not trusted', () => {
  const src = read('server/lib/databaseProblems.js');
  assert.ok(/KNOWN_DB_CANARIES/.test(src));
  assert.ok(/unrecognised database canary/.test(src));
  // The id is chosen first (SQL injection gets its own), then tripped through
  // the ordinary path, so a database canary is rate-limited and attributed
  // exactly like every other one.
  assert.ok(/'database\.canary'/.test(src) && /'injection\.sql-statement'/.test(src));
  assert.ok(/tripCanary\(canaryId, \{/.test(src),
    'it goes through the rate-limited canary path like every other one');
  assert.ok(/if \(recordDatabaseCanary\(error, options\)\) return null;/.test(src),
    'and does not also land in the database-problem stream');
});

test('FerretDB refuses these operations and marks the refusal', () => {
  const go = path.join(repoRoot, '.tools/FerretDB/internal/util/canary/canary.go');
  if (!fs.existsSync(go)) {
    console.log('  -- .tools/FerretDB not cloned; skipping the Go side');
    return;
  }
  const src = fs.readFileSync(go, 'utf8');
  assert.ok(/const Marker = "canary:"/.test(src), 'the marker both sides agree on');
  ['db.javascript', 'db.result-to-collection', 'db.drop-database', 'db.server-admin']
    .forEach(id => assert.ok(src.includes(`"${id}"`), `FerretDB must define ${id}`));
  // CLAUDE.md: FerretDB .go files carry no application-specific names.
  assert.ok(!/wekan|WeKan|WEKAN/.test(src), 'no application name in a FerretDB source file');
  // It must write nothing: the client decides what is recorded.
  assert.ok(!/os\.OpenFile|sql\.Open|log\.New\(/.test(src),
    'the canary package must not store anything itself');
});

function requireDatabaseProblemsHelpers() {
  // databaseProblems.js is an ES module full of Meteor imports, so it cannot be
  // require()d here. Its extractor is small and self-contained, so the guard
  // evaluates that ONE function out of the source - which also means the test
  // fails if the function is renamed or its shape changes.
  const src = read('server/lib/databaseProblems.js');
  const marker = src.match(/const FERRETDB_CANARY_MARKER = '[^']+';/)[0];
  const fn = src.match(/export function databaseCanaryId\(error\) \{[\s\S]*?\n\}/)[0]
    .replace('export function', 'function');
  // eslint-disable-next-line no-new-func
  return new Function(`${marker}\n${fn}\nreturn { databaseCanaryId };`)();
}

console.log(`\n${passed} tests passed`);
