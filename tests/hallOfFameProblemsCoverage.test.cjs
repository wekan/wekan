'use strict';

// Guard: a hall-of-fame vulnerability should be visible in Admin Panel → Problems
// under the same name.
// Run: node tests/hallOfFameProblemsCoverage.test.cjs
//
// CLAUDE.md: where a security fix DENIES an operation and the denial can be
// attributed, an administrator must be able to see that somebody tried. The
// mechanism is a key in models/lib/securityCategories.js whose `bleed` is the
// hall-of-fame name, so Problems groups attempts the way the site names them and
// an admin can go from one to the other.
//
// 66 vulnerabilities are listed on the site and 30 have a key today. The other 36
// predate the rule, and this suite does NOT pretend to have judged them: deciding
// whether a given fix has anything to detect means reading that fix, and claiming
// otherwise here would be worse than the gap.
//
// So it is a RATCHET. Every name must be one of:
//
//   * KEYED       - it has a catalog key, and attempts show in Problems;
//   * DELIBERATE  - it has nothing to detect, with the reason recorded here;
//   * PENDING     - it predates the rule and has not been looked at yet.
//
// A NEW vulnerability that is none of the three fails this test. The PENDING list
// may shrink and must never grow: that is the whole mechanism. Working one off it
// means either adding a key or moving it to DELIBERATE with a reason.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// The website is a sibling checkout (CLAUDE.md: ../w/wekan.fi), so this degrades
// to a skip rather than failing on a machine that only has the app.
const HOF = path.join(os.homedir(), 'repos', 'w', 'wekan.fi', 'hall-of-fame', 'index.html');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Nothing to detect, and why. A *Bleed belongs here when the fix changed what a
// response CARRIED, or only takes effect at build time, so there is no attempt to
// attribute - not merely when nobody has written the key yet.
const DELIBERATE = {
  HashBleed: 'every call to that endpoint is a legitimate admin call; the fault was '
    + 'in what the answer CARRIED, so a log line would fire on normal use and say '
    + 'nothing about an attacker (GHSA-6qpx-x7vr-p9w6, and securityCategories.js '
    + 'records the same reason)',
  HostnameBleed: 'the incomplete hostname regular expressions existed only in a '
    + 'source-reading translation regression test over hardcoded examples; no '
    + 'application request reaches it, so there is no runtime attempt to deny, '
    + 'attribute or record (CodeQL alerts #435 and #436)',
  RouteBleed: 'the incomplete regular-expression escaping existed only in a source-reading '
    + 'test over its own hardcoded route table; no application request reaches it, so there '
    + 'is no runtime attempt to deny, attribute or record (CodeQL alert #434)',
  UserSearchBleed: 'the fix makes search punctuation literal and removes sensitive fields from '
    + 'the response; legitimate searches reach the same path, so there is no denied attack-only '
    + 'event to attribute without logging ordinary use',
  SubtaskExportBleed: 'the fix scopes internal export queries and changes only what a legitimate '
    + 'export response carries; no request is denied, so logging exports would record ordinary use',
  ClaimBleed: 'the fix ignores service-owned fields while processing every legitimate OIDC login; '
    + 'there is no reliable way to distinguish a malicious claim from an administrator mistakenly '
    + 'whitelisting an identity field without logging ordinary logins',
  AvatarBleed: 'the fix changes response headers for every avatar whose stored MIME type is browser-executable; '
    + 'serving an existing avatar is legitimate use and does not identify who originally supplied its metadata, '
    + 'so recording the download would log viewers rather than an attributable attack',
  LegacyAttachBleed: 'the fix changes response headers for legitimate legacy attachment downloads; the request '
    + 'does not identify whether dangerous stored metadata was malicious, so logging it would record ordinary '
    + 'viewers and misattribute an old upload as a current attack',
};

// Predates the rule and has not been judged yet. May shrink; must never grow.
const PENDING = [
  'AdminBleed', 'AnchorBleed', 'AuthBleed', 'BFLABleed',
  'BypassBleed', 'CloneBleed', 'CrashBleed', 'DUEBleed', 'ExcelBleed',
  'ExportBleed', 'FieldBleed', 'FollowBleed', 'FrameBleed', 'IdentityBleed',
  'InvisibleBleed', 'LDAPBleed', 'LockoutBleed', 'MegaBleed',
  'PassBleed', 'PatternBleed', 'ProxyBleed', 'RandomBleed', 'ReactionBleed',
  'SnowBleed', 'SocialBleed', 'SortBleed', 'SpliceBleed', 'TokenBleed',
  'TransitBleed', 'UserBleed', 'WebhookBleed', 'WhereBleed', 'ZipBleed',
];

const catalog = fs.readFileSync(path.join(ROOT, 'models/lib/securityCategories.js'), 'utf8');
const keyed = new Set([...catalog.matchAll(/bleed: '(\w+)'/g)].map(m => m[1]));

const hallOfFameNames = () => {
  if (!fs.existsSync(HOF)) return null;
  const html = fs.readFileSync(HOF, 'utf8');
  return [...new Set([...html.matchAll(/<td valign="top"><b>(\w*Bleed)<\/b><\/td>/g)]
    .map(m => m[1]))].sort();
};

test('every hall-of-fame name is keyed, deliberate, or pending', () => {
  const names = hallOfFameNames();
  if (!names) {
    console.log('    (../w/wekan.fi is not checked out here - nothing to check)');
    return;
  }
  assert.ok(names.length > 50, `expected the hall of fame, found ${names.length} names`);
  const unaccounted = names.filter(n => !keyed.has(n) && !DELIBERATE[n] && !PENDING.includes(n));
  assert.deepStrictEqual(unaccounted, [],
    'these vulnerabilities are on the site and cannot be seen in Admin Panel → Problems.\n'
    + 'Add a key to models/lib/securityCategories.js whose `bleed` is the name, and call\n'
    + 'securityLog.record() on the refusal path - or, if there is genuinely nothing to\n'
    + 'attribute, add it to DELIBERATE in this file WITH THE REASON:\n'
    + unaccounted.map(n => `  ${n}`).join('\n'));
});

test('the PENDING list never grows (negative)', () => {
  // The ratchet. A name may leave this list - by gaining a key, or by being
  // judged to have nothing to detect - and may never join it.
  const names = hallOfFameNames();
  if (!names) return;
  const stillPending = PENDING.filter(n => names.includes(n) && !keyed.has(n));
  assert.ok(stillPending.length <= PENDING.length,
    'PENDING may only shrink');
  const keyedSince = PENDING.filter(n => keyed.has(n));
  if (keyedSince.length) {
    console.log(`    (${keyedSince.length} now keyed and can leave PENDING: ${keyedSince.join(', ')})`);
  }
});

test('nothing is in two lists at once (negative)', () => {
  for (const name of PENDING) {
    assert.ok(!DELIBERATE[name], `${name} is both pending and deliberate - decide which`);
    assert.ok(!keyed.has(name),
      `${name} has a catalog key now, so remove it from PENDING rather than leaving `
      + 'the list saying it has none');
  }
});

test('every DELIBERATE entry gives a reason', () => {
  for (const [name, reason] of Object.entries(DELIBERATE)) {
    assert.ok(typeof reason === 'string' && reason.length > 40,
      `${name} is excused without a reason anybody can re-check`);
  }
});

test('a catalog name that IS on the site is spelled the same', () => {
  // The point of using the hall-of-fame name as a key's `bleed` is that an admin
  // can go from Problems to the write-up. A near-miss spelling breaks that
  // silently.
  //
  // The reverse is NOT an error: the catalog also names guards that were never a
  // reported vulnerability - the canaries (CanaryBleed, ChecklistBleed, …), the
  // policy and malware checks - which sit where somebody could TRY to overreach
  // and record the attempt. Those have no page to link to and should not.
  const names = hallOfFameNames();
  if (!names) return;
  const onSite = new Set(names);
  const internal = [...keyed].filter(b => b !== 'Generic' && !onSite.has(b));
  console.log(`    (${internal.length} catalog name(s) are internal guards with no site page)`);

  // What would be a real fault: two names differing only by case or spacing,
  // which is a typo rather than an internal guard.
  const normalised = new Map([...onSite].map(n => [n.toLowerCase(), n]));
  const typos = internal
    .filter(b => normalised.has(b.toLowerCase()))
    .map(b => `${b} vs ${normalised.get(b.toLowerCase())}`);
  assert.deepStrictEqual(typos, [],
    `the catalog and the site disagree about spelling: ${typos.join(', ')}`);
});

console.log(`\nhallOfFameProblemsCoverage: ${passed} tests passed`);
