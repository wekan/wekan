'use strict';

// The RAM and Disk usage monitors, wired like the CPU one
// (docs/Features/Admin-Panel/Problems/RAM-usage.md, Disk-usage.md): loaded by
// the server, writing their own event stream through the shared recorder,
// reachable from Admin Panel → Problems and its URLs, with a live status line.
// The three monitors read their settings with one intEnv and record with one
// resourceRecorder; the negative checks keep a second copy of either out.
//
// Run: node tests/resourceMonitorsWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('resourceMonitorsWiring:');

test('the server loads both monitors beside the CPU one', () => {
  const imports = read('server/imports.js');
  for (const m of ['cpuMonitor', 'ramMonitor', 'diskMonitor']) {
    assert.ok(imports.includes(`import '/server/lib/${m}';`), `${m} is imported`);
  }
});

test('each monitor samples on an interval and records only start and end', () => {
  const ram = read('server/lib/ramMonitor.js');
  assert.match(ram, /readFileSync\('\/proc\/meminfo'/);
  assert.match(ram, /HighRamTracker/);
  const disk = read('server/lib/diskMonitor.js');
  assert.match(disk, /fs\.statfsSync\(watched\.path\)/);
  assert.match(disk, /DiskEpisodes/);
  assert.match(disk, /fs\.statSync\(watched\.path\)\.dev/, 'one line per filesystem, not per path');
  for (const [file, src, prefix] of [['ramMonitor', ram, 'RAM'], ['diskMonitor', disk, 'disk']]) {
    assert.match(src, /Meteor\.setInterval\(/, `${file} samples on an interval`);
    assert.match(src, /res\.event === 'start'/);
    assert.match(src, /res\.event === 'end'/);
    assert.match(src, new RegExp(`high ${prefix} usage started`));
    assert.match(src, new RegExp(`high ${prefix} usage ended after`));
    assert.match(src, /severity: 'info'/, `${file}'s end row is not a new problem`);
    assert.match(src, /WEKAN_(RAM|DISK)_MONITOR \|\| 'true'/, `${file} can be turned off`);
  }
});

test('they write the ram and disk streams the event log accepts', () => {
  assert.match(read('models/eventLog.js'),
    /EVENT_STREAMS = \['security', 'speed', 'tests', 'cpu', 'ram', 'disk',/);
  assert.match(read('server/lib/ramLog.js'), /stream: 'ram'/);
  assert.match(read('server/lib/diskLog.js'), /stream: 'disk'/);
  assert.match(read('server/lib/cpuLog.js'), /stream: 'cpu'/);
});

test('Admin Panel → Problems has both reports, with a URL, a title and a live line', () => {
  const menu = read('client/components/settings/adminProblems.js');
  assert.match(menu, /\{ id: 'report-ram', icon: 'fa-microchip', labelKey: 'memory-usage' \}/);
  assert.match(menu, /\{ id: 'report-disk', icon: 'fa-hdd-o', labelKey: 'sandstorm-disk-usage' \}/);
  assert.match(menu, /'report-ram', 'report-disk',/, 'they load themselves');
  assert.match(menu, /this\.stream === 'ram' \|\| this\.stream === 'disk'/);
  const jade = read('client/components/settings/adminProblems.jade');
  assert.match(jade, /isPane 'report-ram'\n\s*\+eventStreamReport\(stream="ram"\)/);
  assert.match(jade, /isPane 'report-disk'\n\s*\+eventStreamReport\(stream="disk"\)/);
  assert.match(jade, /template\(name="ramCurrentStatus"\)/);
  assert.match(jade, /template\(name="diskCurrentStatus"\)/);
  const urls = read('models/lib/adminUrls.js');
  assert.match(urls, /ram: 'report-ram',/);
  assert.match(urls, /disk: 'report-disk',/);
  const status = read('server/methods/systemStatus.js');
  assert.match(status, /if \(area === 'ram'\) return \{ area: 'ram', current: getCurrentMemory\(\) \};/);
  assert.match(status, /if \(area === 'disk'\) return \{ area: 'disk', current: getCurrentDisks\(\) \};/);
});

test('the labels are keys every language already translates', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const fi = JSON.parse(read('imports/i18n/data/fi.i18n.json'));
  for (const key of ['memory-usage', 'sandstorm-disk-usage']) {
    assert.ok(en[key], `${key} exists`);
    assert.ok(fi[key] && fi[key] !== en[key], `${key} is translated`);
  }
});

test('the docs say the monitors are implemented', () => {
  for (const page of ['RAM-usage.md', 'Disk-usage.md']) {
    const doc = read(`docs/Features/Admin-Panel/Problems/${page}`);
    assert.match(doc, /Status: \*\*Implemented\*\*/, `${page} is not a design any more`);
    assert.ok(!/Design \(proposed\)/.test(doc));
  }
});

test('one intEnv and one recorder, no copies (negative)', () => {
  const copies = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['_build', 'node_modules'].includes(e.name)) walk(rel); }
      else if (rel.endsWith('.js')) {
        const src = read(rel);
        if (/function intEnv\(/.test(src) && rel !== path.join('models', 'lib', 'intEnv.js')) copies.push(`${rel}: intEnv`);
        if (/EventLog\.insertAsync\(doc\)/.test(src) && /stream: '(cpu|ram|disk)'/.test(src)) copies.push(`${rel}: recorder`);
      }
    }
  };
  walk('server');
  walk('models');
  assert.deepStrictEqual(copies, []);
});

console.log(`\nresourceMonitorsWiring: ${passed} tests passed`);
