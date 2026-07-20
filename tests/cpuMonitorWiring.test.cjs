'use strict';

// Source guards for the CPU monitor + governor + Admin Panel / Problems / CPU
// usage report (Meteor/ESM modules that cannot be require()d under plain Node).
//
// Run: node tests/cpuMonitorWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cpuMonitorWiring:');

check('monitor samples system CPU and records only start/end to the cpu stream', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/os\.cpus\(\)/.test(m) && /idle/.test(m), 'measures system-wide CPU from os.cpus()');
  assert.ok(/HighCpuTracker/.test(m), 'uses the start/end tracker');
  assert.ok(/setInterval/.test(m), 'samples on an interval');
  assert.ok(/'start'/.test(m) && /'end'/.test(m), 'records start and end only');
  const log = read('server/lib/cpuLog.js');
  assert.ok(/stream: 'cpu'/.test(log), 'writes to the cpu event stream');
});

check('governor lets long operations slow down when CPU is high', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/export function isHighCpu/.test(m) && /export function pauseIfBusy/.test(m), 'isHighCpu + pauseIfBusy');
  const c = read('server/migrations/correctFileExtensions.js');
  assert.ok(/pauseIfBusy/.test(c) && /setActivity/.test(c), 'batch corrector pauses + labels activity');
});

check('the detail says what WeKan was doing during high CPU', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/currentActivity/.test(m) && /load/.test(m), 'includes activity label + load average');
});

check('logs the automatic mitigation taken and whether it lowered CPU', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/action: 'rate-limited'/.test(m), 'writes a "mitigation taken" row');
  assert.ok(/automatic mitigation: slowing down/.test(m), 'says what was slowed down');
  assert.ok(/mitigationSummary/.test(m), 'end row reports mitigation effect');
  assert.ok(/mitigationStartPct/.test(m) && /minPctAfterMitigation/.test(m), 'measures CPU before vs after');
  assert.ok(/noticeably lower/.test(m), 'states whether pausing helped');
});

check('on high CPU, WeKan asks FerretDB what it is doing and to slow down, and logs it', () => {
  const g = read('server/lib/ferretdbGovernor.js');
  assert.ok(/throttle: 1/.test(g), 'calls the general FerretDB throttle command');
  assert.ok(/export function slowDownFerretDb/.test(g) && /export function resumeFerretDb/.test(g),
    'slow-down + resume');
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/governFerretStart/.test(m) && /governFerretEnd/.test(m), 'wired into start/end');
  assert.ok(/asked FerretDB to slow down/.test(m), 'logs what FerretDB was asked');
  assert.ok(/commandsProcessed/.test(m), 'logs FerretDB activity');
  assert.ok(/asked FerretDB to resume/.test(m), 'FerretDB resumes when CPU drops');
});

check('the FerretDB slow-down escalates until CPU has headroom, then holds', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/governFerretAdjust/.test(m), 'adaptive adjust each sample');
  assert.ok(/FERRET_SLOWDOWN_MAX_MS/.test(m) && /CPU_TARGET_PCT/.test(m), 'escalation cap + headroom target');
  assert.ok(/increased FerretDB slow-down/.test(m), 'logs each increase of the delay');
  assert.ok(/enough CPU is now free for other processes/.test(m), 'logs when the target is reached');
  assert.ok(/did not free enough CPU/.test(m), 'logs when even max delay is not enough');
  assert.ok(/\* 2/.test(m), 'delay increases (doubles) between operations');
});

check('WeKan rate-limits asks, times out, backs off, and logs the outage start→end', () => {
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/FERRET_ASK_MIN_INTERVAL_MS/.test(m), 'minimum gap between FerretDB asks (no flooding)');
  assert.ok(/ferretDbInCooldown/.test(m), 'does not ask while backing off');
  assert.ok(/became unresponsive/.test(m), 'logs when FerretDB stops answering (with start time)');
  assert.ok(/ferretUnavailableSince/.test(m), 'remembers when unresponsiveness started');
  assert.ok(/responded again/.test(m), 'logs recovery');
  assert.ok(/unresponsive \$\{fmtAt\(since\)\} → \$\{fmtAt\(new Date\(\)\)\}/.test(m), 'recovery row reports start→end span');
  assert.ok(/operationsSummary/.test(m), 'recovery row includes what FerretDB was doing');
  const g = read('server/lib/ferretdbGovernor.js');
  assert.ok(/withTimeout/.test(g) && /COMMAND_TIMEOUT_MS/.test(g), 'per-call timeout');
  assert.ok(/COOLDOWN_MS/.test(g) && /cooldownUntil/.test(g), 'cooldown back-off after failure');
  assert.ok(/export function ferretDbInCooldown/.test(g) && /export function ferretDbUnavailable/.test(g), 'state accessors');
});

check('FerretDB self-regulates its own CPU and reports its operations summary', () => {
  const s = read('FerretDB/internal/handler/selfregulate.go');
  assert.ok(/nextAutoSlowdown/.test(s) && /autoSlowdownMs/.test(s), 'autonomous delay decision');
  assert.ok(/procStatCPU/.test(s) && /\/proc\/stat/.test(s), 'measures host CPU itself');
  assert.ok(/runSelfRegulation/.test(s), 'background loop');
  const t = read('FerretDB/internal/handler/throttle.go');
  assert.ok(/effectiveDelay/.test(t) && /autoSlowdownMs/.test(t), 'effective delay = max(client, self-regulated)');
  assert.ok(/commandSummary/.test(t) && /commandCounts/.test(t), 'per-command summary of what FerretDB is doing');
  const mt = read('FerretDB/internal/handler/msg_throttle.go');
  assert.ok(/operationsSummary/.test(mt), 'summary returned in the throttle response');
});

check('CPU usage report is wired into Admin Panel / Problems', () => {
  assert.ok(/'security', 'speed', 'tests', 'cpu'/.test(read('models/eventLog.js')), 'cpu event stream registered');
  const jade = read('client/components/settings/adminReports.jade');
  assert.ok(/js-report-cpu/.test(jade) && /stream="cpu"/.test(jade), 'menu item + report template');
  const js = read('client/components/settings/adminReports.js');
  assert.ok(/showCpu/.test(js) && /cpuReportTitle/.test(js), 'show state + title');
  assert.ok(/"cpuReportTitle": "CPU usage"/.test(read('imports/i18n/data/en.i18n.json')), 'title string');
});

console.log(`\ncpuMonitorWiring: ${passed} checks passed`);
