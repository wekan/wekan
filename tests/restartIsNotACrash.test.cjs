'use strict';

// Two Admin Panel reports full of things that never happened, from a server
// running WeKan 10.90 Snap. Run: node tests/restartIsNotACrash.test.cjs
//
// FILESYSTEM INTEGRITY, over and over:
//
//   availability  DowntimeBleed  high  failed  uptime
//     the previous run STOPPED WITHOUT SHUTTING DOWN CLEANLY, and this server
//     was down for about 4 minute(s)
//
// on a snap that was refreshed, not crashed. Two faults, and the second is the
// one that also made the downtime real:
//
//   1. `IntegrityKeys.update()` is not synchronous in Meteor 3. It starts a
//      write and hands back a promise nobody waited for, so the clean-shutdown
//      mark was never on disk when the process went. Every stop looked unclean.
//   2. Registering ANY SIGTERM listener replaces Node's default behaviour, which
//      is to terminate. Nothing in that listener exited, so WeKan ignored
//      SIGTERM: systemd/snapd waited out the stop timeout and used SIGKILL -
//      which is the minutes of "downtime" in those rows AND a genuinely unclean
//      kill.
//
// SECURITY REPORT, over and over:
//
//   spoofing  MetricsBleed  medium  detected  canary:spoof.forwarded-header
//     127.0.0.1  sent a forwarded-for header that is not trusted here
//
// "Nothing legitimate sends a forwarded-for header here" is wrong: every reverse
// proxy adds one to everything it forwards. A Prometheus scrape through a local
// proxy, on a server whose allowlist does not cover it, is an ordinary refusal.
// The spoof has a signature - the header NAMES an allowlisted address while the
// connection is not from one - and only that is a canary now.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const uptime = read('server/lib/uptimeWatch.js');
const metrics = read('models/server/metrics.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('restartIsNotACrash:');

// ── the clean-shutdown mark ─────────────────────────────────────────────────

test('the mark is written with the async API', () => {
  assert.ok(/IntegrityKeys\.updateAsync\(/.test(uptime),
    'a fire-and-forget update() leaves the mark unwritten, which is the bug');
  const code = uptime.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  assert.ok(!/IntegrityKeys\.update\(/.test(code),
    'and no synchronous update() may come back');
});

test('SIGTERM still terminates', () => {
  // The one that turns a restart into minutes of downtime: a listener silences
  // the default, so if the handler does not exit, nothing does.
  const fn = uptime.slice(uptime.indexOf('const markCleanAndExit'));
  const body = fn.slice(0, fn.indexOf("process.once('SIGTERM'"));
  assert.ok(/process\.exit\(0\)/.test(body), 'the handler exits');
  assert.ok(/exit\(0\)/.test(body) && !/exit\(1\)|exit\(143\)/.test(body),
    'with 0, or systemd marks the service failed on every ordinary restart');
  for (const signal of ['SIGTERM', 'SIGINT']) {
    assert.ok(new RegExp(`process\\.once\\('${signal}', markCleanAndExit\\)`).test(uptime),
      `${signal} must reach the handler that exits`);
  }
});

test('a write that cannot finish does not hold the shutdown open (negative)', () => {
  const fn = uptime.slice(uptime.indexOf('const markCleanAndExit'));
  const body = fn.slice(0, fn.indexOf("process.once('SIGTERM'"));
  assert.ok(/setTimeout\(finish, MARK_TIMEOUT_MS\)/.test(body),
    'the exit happens even with the database gone - which is exactly when a '
    + 'shutdown is most likely to be happening');
  assert.ok(/\.catch\(\(\) =>/.test(body), 'and a failed write is not thrown at an exiting process');
  assert.ok(/if \(finished\) return;/.test(body) && /if \(stopping\) return;/.test(body),
    'exactly once, however many signals arrive');
});

test('the classification itself is unchanged', () => {
  // The rows were wrong because the input was wrong, not the rule. A "fix" that
  // stopped calling a crash a crash would hide the next real one.
  const { classifyPreviousRun } = requireClassifier();
  const now = Date.now();
  assert.strictEqual(classifyPreviousRun({ at: new Date(now - 60000), cleanShutdown: true }, now).kind,
    'clean', 'a marked stop is clean');
  assert.strictEqual(classifyPreviousRun({ at: new Date(now - 60000) }, now).kind,
    'restart', 'a short unmarked gap is still only a restart');
  assert.strictEqual(classifyPreviousRun({ at: new Date(now - 10 * 60000) }, now).kind,
    'crash', 'and a long unmarked gap is still a crash');
  assert.strictEqual(classifyPreviousRun(null, now).kind, 'first-run');
});

function requireClassifier() {
  // The module imports Meteor, so read the pure function out of the source
  // rather than loading it: the classifier is self-contained.
  const src = uptime.slice(uptime.indexOf('export function classifyPreviousRun'));
  const body = src.slice(0, src.indexOf('\nconst SEVERITY_OF'));
  const DOWNTIME_THRESHOLD_MS = 3 * 60 * 1000;
  // eslint-disable-next-line no-new-func
  const factory = new Function('DOWNTIME_THRESHOLD_MS',
    `${body.replace('export function', 'function')}; return classifyPreviousRun;`);
  return { classifyPreviousRun: factory(DOWNTIME_THRESHOLD_MS) };
}

// ── the /metrics canary ─────────────────────────────────────────────────────

test('a forwarded header alone is no longer a spoofing report (negative)', () => {
  const branch = metrics.slice(metrics.indexOf('const forwardedFor = req.headers'));
  const block = branch.slice(0, branch.indexOf('res.writeHead(401)'));
  assert.ok(/const impersonating =/.test(block), 'the decision has a name');
  assert.ok(/claimed\.some\(addr => acceptedIpAddress\(addr\)\)/.test(block),
    'the header must NAME an allowlisted address - that is the impersonation');
  assert.ok(/!acceptedIpAddress\(req\.socket\.remoteAddress\)/.test(block),
    'and the connection itself must not be from one, or nothing is being faked');
  assert.ok(/if \(impersonating\)/.test(block),
    'the canary trips only then');
});

test('the refusal itself is unchanged, and says what to fix', () => {
  assert.ok(/res\.writeHead\(401\)/.test(metrics), 'still a 401');
  assert.ok(/METRICS_TRUST_PROXY/.test(metrics) && /METRICS_ACCEPTED_IP_ADDRESS/.test(metrics),
    'and the answer names both settings, because the address in it is the proxy');
  const body = metrics.slice(metrics.indexOf("res.end(\n          'IpAddress: '"));
  assert.ok(/forwardedFor && !process\.env\.METRICS_TRUST_PROXY/.test(body),
    'only when a proxy is actually in the picture - a direct request needs no hint');
});

test('the canary is still wired for the case it is for', () => {
  assert.ok(/tripCanary\('spoof\.forwarded-header'/.test(metrics),
    'MetricsBleed must still have somewhere to be reported from');
  assert.ok(/naming an allowed address/.test(metrics),
    'and the detail now says what was actually seen');
});

console.log(`\nrestartIsNotACrash: ${passed} tests passed`);
