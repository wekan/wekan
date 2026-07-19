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
check('sanitizeDetail on control-chars-only yields empty (negative)', () => {
  assert.strictEqual(fmt.sanitizeDetail('\n\t\r\x00\x1f\x7f'), '');
  assert.strictEqual(fmt.sanitizeDetail('   '), '');
});
check('categoryFor never crashes on empty/undefined key (negative)', () => {
  assert.strictEqual(cats.categoryFor('').bleed, 'Generic');
  assert.strictEqual(cats.categoryFor(undefined).category, 'unknown');
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
  assert.ok(/eventLogProblemAreas\(\)/.test(src) && /acknowledgeEventLog\(streams\)/.test(src));
  assert.ok(/user\.isAdmin/.test(src), 'methods must be admin-gated');
  assert.ok(/\$gt: ack\.at/.test(src), 'count must be events newer than the ack');
});
check('argument-taking methods check() every arg BEFORE requireAdmin (audit-argument-checks)', () => {
  // Meteor's audit-argument-checks reports "Did not check() all arguments"
  // (masking the real error) if a method throws — e.g. requireAdmin for a
  // non-admin — before check()ing its arguments. Every method that takes
  // arguments must call check() first.
  const src = read('models/eventLog.js');
  for (const sig of ['eventLogCount(stream, search)', 'eventLogPage(stream, limit, skip, search)', 'acknowledgeEventLog(streams)']) {
    const start = src.indexOf('async ' + sig);
    assert.ok(start >= 0, `method ${sig} must exist`);
    const body = src.slice(start, start + 400);
    const firstCheck = body.indexOf('check(');
    const firstAdmin = body.indexOf('requireAdmin(');
    assert.ok(firstCheck >= 0 && firstCheck < firstAdmin,
      `${sig}: check() must come before requireAdmin()`);
  }
});
check('Admin Panel has a Problems button (right of Info) and no Reports button', () => {
  const jade = read('client/components/settings/settingHeader.jade');
  assert.ok(/setting-header-btn\.problems/.test(jade), 'Problems button present');
  assert.ok(/problemsClass/.test(jade), 'red-when-problems class');
  assert.ok(!/isAdminReportsActive/.test(jade) && !/'reports'/.test(jade), 'Reports button removed');
  const hjs = read('client/components/settings/settingHeader.js');
  assert.ok(/eventLogProblemAreas/.test(hjs) && /has-problems/.test(hjs), 'header polls problems + red class');
});
check('Problems page: Summary/Security/Speed/Tests menu + read-only stream table', () => {
  const rj = read('client/components/settings/adminReports.jade');
  for (const id of ['report-summary','report-security','report-speed','report-tests']) {
    assert.ok(new RegExp('js-'+id.replace('report-','report-')).test(rj), id+' menu entry');
  }
  assert.ok(/\+problemsSummary/.test(rj) && /\+eventStreamReport/.test(rj), 'summary + stream views');
  const rjs = read('client/components/settings/adminReports.js');
  assert.ok(/eventLogPage/.test(rjs) && /eventLogCount/.test(rjs), 'stream table reads via methods');
  assert.ok(!/js-ack/.test(rj), 'no acknowledge control on the report pages (read-only)');
});
check('Summary page is a checkbox list with ONE acknowledge button', () => {
  const jade = read('client/components/settings/problemsSummary.jade');
  assert.ok(/input\.js-problem-check\(type="checkbox"/.test(jade), 'each area has a checkbox');
  assert.ok((jade.match(/js-ack-checked/g) || []).length === 1, 'exactly one acknowledge button');
  const js = read('client/components/settings/problemsSummary.js');
  assert.ok(/js-problem-check:checked/.test(js), 'button acknowledges the checked streams');
  // acknowledge lives ONLY in the banner — the method accepts an array of streams
  assert.ok(/Match\.OneOf\(String, \[String\]\)/.test(read('models/eventLog.js')));
});

// ── more remediation points wired to the security log ──────────────────────
check('upload rejections are logged (fileValidation)', () => {
  const src = read('models/fileValidation.js');
  assert.ok(/logUploadBlock\('xss\.mime'/.test(src), 'dangerous-content rejection logged');
  assert.ok(/logUploadBlock\('file\.mime'/.test(src), 'mime-not-allowed rejection logged');
  assert.ok(/logUploadBlock\('file\.size'/.test(src), 'oversize rejection logged');
});
check('forged X-Forwarded-For denial is logged (metrics)', () => {
  const src = read('models/server/metrics.js');
  assert.ok(/key: 'spoofing\.xff'/.test(src) && /x-forwarded-for/.test(src));
});
check('export authorization denials are logged (export.js)', () => {
  const src = read('models/export.js');
  assert.ok(/key: 'authz\.export'/.test(src), 'export denial keyed authz.export');
  assert.ok((src.match(/logExportDenied\(\);/g) || []).length >= 4, 'all export denial paths logged');
});

check('slow HTTP requests are recorded to the speed stream', () => {
  const src = read('server/lib/speedMiddleware.js');
  assert.ok(/WEKAN_SLOW_REQUEST_MS/.test(src) && /category: 'slow-request'/.test(src));
  assert.ok(/speedRecord/.test(src) && /WebApp\.handlers\.use/.test(src));
  assert.ok(/import '\/server\/lib\/speedMiddleware'/.test(read('server/imports.js')), 'must be loaded');
});

check('runtime self-checks feed the Tests stream WITHOUT Playwright', () => {
  const src = read('server/lib/selfChecks.js');
  assert.ok(/runSelfChecks/.test(src) && /recordFailure/.test(src), 'records failures to the Tests stream');
  assert.ok(/database-roundtrip/.test(src) && /writable-path/.test(src), 'has runtime checks');
  assert.ok(/user\.isAdmin/.test(src), 'on-demand method is admin-gated');
  assert.ok(!/require\(['"]playwright|from ['"]playwright/.test(src), 'self-checks never import Playwright');
  assert.ok(/import '\/server\/lib\/selfChecks'/.test(read('server/imports.js')), 'must be loaded');
});
check('WeKan runtime code never imports Playwright', () => {
  for (const dir of ['server', 'models', 'imports']) {
    const walk = (d) => {
      for (const e of fs.readdirSync(path.join(__dirname, '..', d), { withFileTypes: true })) {
        const rel = path.join(d, e.name);
        if (e.isDirectory()) { if (!/tests?$|playwright/.test(e.name)) walk(rel); continue; }
        if (/\.(js|jade)$/.test(e.name)) {
          assert.ok(!/require\(['"]playwright|from ['"]playwright/.test(read(rel)),
            `${rel} must not import playwright`);
        }
      }
    };
    walk(dir);
  }
});

console.log(`\nsecurityLog: ${passed} checks passed`);
