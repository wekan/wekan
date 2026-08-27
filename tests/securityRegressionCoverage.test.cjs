'use strict';

// Every published vulnerability must have a regression test, or a recorded
// reason why it does not.
//
// WeKan publishes its fixed vulnerabilities at https://wekan.fi/hall-of-fame/ ,
// each with a name. Whether a given one still has a test guarding it was, until
// this file, unanswerable: some suites name the vulnerability they belong to,
// most do not, and the Hall of Fame lives in a different repository that CI
// never checks out. So "are the security tests enough" could only be answered by
// reading 58 pages and 300 suites by hand, which means in practice it was never
// answered at all - and a regression test that quietly stops existing is worth
// nothing, which is the failure mode tests/testsAreRegistered.test.cjs already
// caught once (two *bleed suites had drifted out of the mocha index).
//
// So the list lives HERE, in the repository that has the tests, and this guard
// keeps the two in step:
//
//   * GUARDED   - the vulnerability is named by at least one test file, and that
//                 file still exists. Naming is the whole mechanism: a test that
//                 does not say which published vulnerability it belongs to
//                 cannot be checked against the published list.
//   * RECORDED  - no test names it, and the reason is written down. This is the
//                 CHANGELOG's "TODO Later" pattern applied to tests: a gap with
//                 a reason is a decision, a gap without one is a surprise.
//
// The list may only move in one direction. Adding a vulnerability to RECORDED is
// allowed and expected when it is published; moving one from RECORDED to GUARDED
// is the work. The count below fails if RECORDED grows, so a new vulnerability
// cannot be published with no test and no note.
//
// Run: node tests/securityRegressionCoverage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SUITE_DIRS = ['tests', 'server/lib/tests', 'client/lib/tests'];

// Files that mention a vulnerability name for bookkeeping rather than testing
// it. They must not be accepted as coverage, or this guard would pass itself.
const NOT_COVERAGE = new Set([
  'securityRegressionCoverage.test.cjs',   // this file
  'testsAreRegistered.test.cjs',           // checks registration, not behaviour
  // Names every vulnerability that has NO Admin Panel -> Problems key yet, which
  // is the opposite of testing it. Counting those as guarded would mark 35
  // untested vulnerabilities as covered, which is worse than the gap it tracks.
  'hallOfFameProblemsCoverage.test.cjs',
  'index.js',
  'index.test.js',
]);

// ─────────────────────────────────────────────────────────────────────────────
// GUARDED: vulnerability -> the suite(s) that name it.
// ─────────────────────────────────────────────────────────────────────────────
const GUARDED = {
  boardbleed: ['tests/crossBoardParentCardLeak.test.cjs'],
  casbleed: ['tests/securityMeifukun.test.cjs'],
  checklistbleed: ['server/lib/tests/checklistbleed.security.tests.js'],
  clonebleed: ['server/lib/tests/clonebleed.security.tests.js'],
  commentbleed: ['tests/restCommentDeleteAcl.test.cjs'],
  crashbleed: ['tests/exportTokenGuard.test.cjs'],
  dnsbleed: ['server/lib/tests/dnsbleed.security.tests.js'],
  exportbleed: ['tests/exportHTMLXss.test.cjs'],
  followbleed: ['tests/followbleed.test.cjs'],
  identitybleed: ['tests/noIdentityReplacement.test.cjs'],
  importbleed: [
    'tests/importBleed.test.cjs',
    'tests/playwright/specs/42-import-bleed.e2e.js',
  ],
  // Moved up from RECORDED: the guard is repo-wide rather than per-site - every
  // place that folds random bytes onto an alphabet has to reject the bytes that
  // would bias it, and every file that makes a secret has to use a cryptographic
  // source. That is what RandomBleed (CWE-1204) was.
  randombleed: ['tests/fixedVulnerabilityClasses.test.cjs'],
  impersonatebleed: ['tests/securityMeifukun.test.cjs'],
  integrationbleed: ['server/lib/tests/dnsbleed.security.tests.js'],
  invitebleed: ['tests/securityMeifukun.test.cjs'],
  livebleed: ['tests/followbleed.test.cjs', 'tests/securityMeifukun.test.cjs'],
  lockoutbleed: [
    'tests/loginFailureDecision.test.cjs',
    'tests/loginTimingDefense.test.cjs',
    'tests/loginAttemptThrottle.test.cjs',
    'tests/loginBruteForceEnumerationWiring.test.cjs',
  ],
  metricsbleed: ['tests/securityMeifukun.test.cjs'],
  mimebleed: ['server/lib/tests/fileValidationBypass.security.tests.js'],
  oidcbleed: ['tests/securityMeifukun.test.cjs'],
  parentbleed: ['tests/crossBoardParentCardLeak.test.cjs'],
  pathbleed: ['tests/avatarVersionPathTraversal.test.cjs'],
  patternbleed: ['tests/noIdentityReplacement.test.cjs'],
  proxybleed: ['server/lib/tests/proxybleed.security.tests.js'],
  redirectbleed: ['tests/securityLog.test.cjs', 'tests/securityMeifukun.test.cjs'],
  revokebleed: ['tests/boardShareRevokeBypass.test.cjs'],
  routebleed: [
    'tests/boardExportScope.test.cjs',
    'tests/noIncompleteRegExpEscaping.test.cjs',
  ],
  sortbleed: ['server/lib/tests/boards.security.tests.js'],
  sourcebleed: ['tests/securityMeifukun.test.cjs'],
  sessionbleed: ['tests/searchPaginationAuthorization.test.cjs'],
  transitbleed: ['tests/transitbleed.test.cjs'],
  webhookbleed: ['server/lib/tests/dnsbleed.security.tests.js'],
  zipbleed: ['tests/zipbleed.test.cjs'],

  // Guarded by ATTEMPT DETECTION rather than by a fix-regression test: a canary
  // sits where the attack is tried, and tests/canaryCoverage.test.cjs pins that
  // the canary is there, is silent, and is attributed
  // (docs/Security/Remediation/WeKan.md §12). That is weaker than a test of the
  // fix itself - it proves an attempt is SEEN, not that it still fails - so
  // these stay candidates for a real regression test. It is stronger than
  // nothing, which is what they had.
  escapebleed: ['tests/canaryCoverage.test.cjs'],
  filebleed: ['tests/canaryCoverage.test.cjs'],
  inputbleed: ['tests/canaryCoverage.test.cjs'],
  spacebleed: ['tests/canaryCoverage.test.cjs'],
};

// ─────────────────────────────────────────────────────────────────────────────
// RECORDED: published, fixed, and no test names it - with why.
//
// Most of these are older fixes from before WeKan tested its security fixes at
// all. They are NOT known to be unprotected; they are known to be unchecked,
// which is a different and more honest statement. Whoever writes one of these
// tests moves the entry up into GUARDED.
// ─────────────────────────────────────────────────────────────────────────────
const RECORDED = {
  adminbleed: 'privilege escalation to Admin; needs a running instance to reproduce, no source guard written',
  anchorbleed: 'GHSL-2026-035 CursorBleed; reported before the *bleed suites existed',
  authbleed: 'unauthenticated getServiceConfiguration leaked the OIDC client secret; needs a DDP test',
  avatarbleed: 'predates the test suites; superseded in part by tests/avatarUrlSafety.test.cjs, which does not name it',
  bflableed: '48 REST endpoints missing await on the access check - wants a source sweep over every route, not one test',
  brutebleed: 'user data published unconditionally; overlaps userbleed, both need a publication test',
  bypassbleed: 'authentication bypass; predates the *bleed test suites, no source guard was written',
  duebleed: 'Due Cards showed other users\' private board cards to an Admin; needs a publication test',
  emailbleed: 'SMTP password readable behind the asterisks in Admin Panel; a UI-only fix',
  excelbleed: 'un-awaited access-control guard in the Excel export route; same class as bflableed',
  fieldbleed: 'JavaScript stored in a field ran when the page was reloaded; predates the *bleed test suites',
  floppybleed: 'FileBleed variant; predates the *bleed test suites, no source guard was written',
  framebleed: 'cross-frame scripting; a header fix with no test',
  invisiblebleed: 'HTML comments were not visible in rendered content; predates the *bleed test suites',
  ldapbleed: 'LDAP TLS certificate validation off by default; needs an LDAP stack to test',
  megableed: 'IDOR in setCreateTranslation; needs a DDP method test',
  reactionbleed: 'XSS in comment reactions; predates the *bleed test suites - note the reaction OWNERSHIP hole found in this round is a different bug and is guarded by tests/reactionOwnership.test.cjs',
  readonlybleed: 'read-only members could write Custom Fields; needs a permissions test',
  scannerbleed: 'CVE-2026-68560 shell injection via an upload filename in the antivirus scanner command; needs a source guard on the command path',
  snowbleed: 'MigrationsBleed - a database migration fix; predates the *bleed test suites',
  socialbleed: 'social media links on wekan.fi - a website fix, not a WeKan one',
  splicebleed: 'incomplete multi-character sanitization stripping markup from a shown filename; tests/fileNameDisplay.test.cjs is the likely guard but does not name it',
  tokenbleed: 'predates the *bleed test suites; the REST token paths are exercised by 23-rest-api-more.e2e.js, which does not name it',
  userbleed: 'user data published unconditionally; overlaps brutebleed',
};

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const readSuite = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Every suite file in the tree, by basename, with its text.
function allSuites() {
  const out = new Map();
  SUITE_DIRS.forEach(dir => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    fs.readdirSync(abs).forEach(f => {
      if (!f.endsWith('.cjs') && !f.endsWith('.js')) return;
      out.set(path.join(dir, f), fs.readFileSync(path.join(abs, f), 'utf8'));
    });
  });
  return out;
}

test('every GUARDED vulnerability has a suite that exists and names it', () => {
  Object.entries(GUARDED).forEach(([vuln, suites]) => {
    assert.ok(suites.length > 0, `${vuln} lists no suite`);
    suites.forEach(rel => {
      const abs = path.join(ROOT, rel);
      assert.ok(fs.existsSync(abs), `${vuln}: ${rel} does not exist`);
      const text = readSuite(rel).toLowerCase();
      assert.ok(
        text.includes(vuln),
        `${rel} must NAME ${vuln} - a test that does not say which published ` +
        `vulnerability it guards cannot be checked against the published list`,
      );
    });
  });
});

test('no vulnerability is both guarded and recorded as a gap', () => {
  const both = Object.keys(GUARDED).filter(v => v in RECORDED);
  assert.deepStrictEqual(both, [], 'a vulnerability is either tested or it is not');
});

test('every recorded gap says WHY, in a sentence', () => {
  Object.entries(RECORDED).forEach(([vuln, reason]) => {
    assert.strictEqual(typeof reason, 'string', `${vuln} needs a reason`);
    assert.ok(reason.length >= 25,
      `${vuln}: "${reason}" is too short to be a reason somebody can act on`);
  });
});

test('a recorded gap is not silently guarded after all', () => {
  // If a suite starts naming a vulnerability that is listed as a gap, the entry
  // belongs in GUARDED - and leaving it in RECORDED would understate coverage.
  const suites = allSuites();
  const wrong = [];
  Object.keys(RECORDED).forEach(vuln => {
    suites.forEach((text, rel) => {
      if (NOT_COVERAGE.has(path.basename(rel))) return;
      if (text.toLowerCase().includes(vuln)) wrong.push(`${vuln} is named by ${rel}`);
    });
  });
  assert.deepStrictEqual(wrong, [],
    'these are tested after all - move them from RECORDED to GUARDED');
});

test('the gap list may not grow', () => {
  // Publishing a vulnerability with neither a test nor a note must fail here.
  // Lower this number when a gap is closed; raising it is the thing this guard
  // exists to make deliberate.
  // 25 -> 24: randombleed moved to GUARDED when the repo-wide class guard
  // (tests/fixedVulnerabilityClasses.test.cjs) started holding the rejection
  // sampling that CWE-1204 was about, everywhere rather than in one file.
  assert.strictEqual(Object.keys(RECORDED).length, 24,
    'the number of published vulnerabilities with no regression test changed');
});

test('the whole published list is accounted for', () => {
  const total = Object.keys(GUARDED).length + Object.keys(RECORDED).length;
  // https://wekan.fi/hall-of-fame/ - one directory per vulnerability. Raise this
  // when a new one is published, and put it in GUARDED or RECORDED at the same
  // time; the two assertions together are what make "every published
  // vulnerability is accounted for" a fact rather than a hope.
  assert.strictEqual(total, 61, 'the Hall of Fame and this list disagree on how many there are');
});

test('the five newest advisories are guarded, not recorded', () => {
  // The ones this round fixed. If any of these ever slips into RECORDED, the
  // fix has lost its test.
  ['pathbleed', 'revokebleed', 'parentbleed', 'commentbleed',
    'sessionbleed'].forEach(v => {
    assert.ok(v in GUARDED, `${v} must stay guarded`);
  });
});

test('negative: a suite that only registers others is not counted as coverage', () => {
  // server/lib/tests/index.js names checklistbleed and proxybleed in its import
  // list. Importing a suite is not testing a vulnerability, and counting it
  // would make this guard pass on the strength of a filename.
  assert.ok(NOT_COVERAGE.has('index.js'));
  assert.ok(NOT_COVERAGE.has('testsAreRegistered.test.cjs'));
  Object.values(GUARDED).flat().forEach(rel => {
    assert.ok(!NOT_COVERAGE.has(path.basename(rel)),
      `${rel} is bookkeeping, not a regression test`);
  });
});

console.log(`\n${passed} tests passed`);
console.log(
  `\n  ${Object.keys(GUARDED).length} of ` +
  `${Object.keys(GUARDED).length + Object.keys(RECORDED).length} published ` +
  `vulnerabilities have a named regression test; ` +
  `${Object.keys(RECORDED).length} are recorded gaps.`,
);
