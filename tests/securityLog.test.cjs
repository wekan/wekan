'use strict';

// Unit + negative tests for the event-log detail sanitizer + category catalog,
// and source-guards that the loggers record into the existing WeKan database
// (models/eventLog.js) via Meteor JS queries — no new files/DBs.
// See docs/Security/Remediation/WeKan.md. Runs under plain node.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const fmt = require('../models/lib/securityLogFormat.js');
const cats = require('../models/lib/securityCategories.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

// ── category catalog ────────────────────────────────────────────────────────
check('categoryFor maps a known key to its Bleed name', () => {
  const c = cats.categoryFor('ssrf.redirect');
  assert.strictEqual(c.category, 'ssrf');
  assert.strictEqual(c.bleed, 'RedirectBleed');
  assert.strictEqual(c.severity, 'high');
});
check('categoryFor falls back to a generic entry for unknown keys', () => {
  const c = cats.categoryFor('nope');
  assert.strictEqual(c.category, 'unknown');
  assert.strictEqual(c.bleed, 'Generic');
});
check('every catalog entry has category+bleed+severity', () => {
  for (const [k, v] of Object.entries(cats.CATALOG)) {
    assert.ok(v.category && v.bleed && v.severity, `catalog ${k} incomplete`);
  }
});

// ── sanitizeDetail (hostile inputs) ─────────────────────────────────────────
check('sanitizeDetail strips control chars/newlines to one line', () => {
  assert.strictEqual(fmt.sanitizeDetail('a\nb\tc\r\nd\x00e'), 'a b c d e');
});
check('sanitizeDetail truncates an oversize detail', () => {
  const out = fmt.sanitizeDetail('x'.repeat(1000));
  assert.ok(out.length <= fmt.MAX_DETAIL && out.endsWith('…'));
});
check('sanitizeDetail handles null/undefined', () => {
  assert.strictEqual(fmt.sanitizeDetail(null), '');
  assert.strictEqual(fmt.sanitizeDetail(undefined), '');
});
check('securityLogFormat has NO file/path/sqlite helpers (DB-only storage)', () => {
  const src = read('models/lib/securityLogFormat.js');
  assert.ok(!/dbPathFor|filesRoot|EVENTS_SCHEMA|statfs|\.sqlite/.test(src), 'must not reference files/sqlite');
});

// ── storage is the existing WeKan DB collection, via JS query ───────────────
check('eventLog defines a single Mongo collection with a stream field', () => {
  const src = read('models/eventLog.js');
  assert.ok(/new Mongo\.Collection\('eventlog'\)/.test(src));
  assert.ok(/stream:\s*{\s*type:\s*String/.test(src), 'must have a stream discriminator');
});
check('loggers insert into EventLog via Meteor JS query (fire-and-forget)', () => {
  for (const [f, stream] of [['securityLog.js', 'security'], ['speedLog.js', 'speed'], ['testLog.js', 'tests']]) {
    const src = read('server/lib/' + f);
    assert.ok(/from '\/models\/eventLog'/.test(src), `${f} must import EventLog`);
    assert.ok(/EventLog\.insertAsync\(/.test(src), `${f} must insert via Meteor query`);
    assert.ok(new RegExp(`stream:\\s*'${stream}'`).test(src), `${f} must set stream '${stream}'`);
    assert.ok(/\.catch\(\(\) => \{\}\)/.test(src), `${f} insert must be fire-and-forget`);
  }
});
check('no new files/DBs are created under WRITABLE_PATH', () => {
  for (const f of ['server/lib/securityLog.js', 'server/lib/speedLog.js', 'server/lib/testLog.js']) {
    const src = read(f);
    assert.ok(!/\.sqlite|writeFileSync|appendFileSync|mkdirSync|WRITABLE_PATH/.test(src),
      `${f} must not touch the filesystem`);
  }
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'server', 'lib', 'eventStore.js')),
    'the node:sqlite eventStore must be gone');
});

// ── Admin Panel problem banner (per-area new-problem counts + acknowledge) ──
check('eventLog defines acks collection + admin methods', () => {
  const src = read('models/eventLog.js');
  assert.ok(/new Mongo\.Collection\('eventlogAcks'\)/.test(src));
  assert.ok(/eventLogProblemAreas\(\)/.test(src) && /acknowledgeEventLog\(stream\)/.test(src));
  assert.ok(/user\.isAdmin/.test(src), 'methods must be admin-gated');
  assert.ok(/\$gt: ack\.at/.test(src), 'count must be events newer than the ack');
});
check('the banner is included at the top of the Admin Panel', () => {
  assert.ok(/\+adminProblemBanner/.test(read('client/components/settings/settingHeader.jade')));
  const js = read('client/components/settings/adminProblemBanner.js');
  assert.ok(/eventLogProblemAreas/.test(js) && /acknowledgeEventLog/.test(js));
  assert.ok(/js-ack-problems/.test(read('client/components/settings/adminProblemBanner.jade')));
  const feat = read('client/features/settings.js');
  assert.ok(/adminProblemBanner\.jade/.test(feat) && /adminProblemBanner\.js/.test(feat), 'must be imported');
});

console.log(`\nsecurityLog: ${passed} checks passed`);
