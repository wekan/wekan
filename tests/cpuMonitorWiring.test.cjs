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
  assert.ok(/wekanThrottle/.test(g), 'calls the custom FerretDB wekanThrottle command');
  assert.ok(/export function slowDownFerretDb/.test(g) && /export function resumeFerretDb/.test(g),
    'slow-down + resume');
  const m = read('server/lib/cpuMonitor.js');
  assert.ok(/governFerretStart/.test(m) && /governFerretEnd/.test(m), 'wired into start/end');
  assert.ok(/asked FerretDB to slow down/.test(m), 'logs what FerretDB was asked');
  assert.ok(/commandsProcessed/.test(m), 'logs FerretDB activity');
  assert.ok(/asked FerretDB to resume/.test(m), 'logs resume when CPU drops');
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
