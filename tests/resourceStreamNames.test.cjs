'use strict';
// The resource and speed monitors report how busy the machine is, not a
// vulnerability. Their rows were named like Hall of Fame entries - RamBleed,
// CpuBleed, DiskBleed, SlowBleed, with CWE-400 - so a laptop with many programs
// open read as an attack in Admin Panel -> Problems (2026-11-19). They are named
// for what happened, carry no CWE, and old rows are renamed at startup.
// Run: node --test tests/resourceStreamNames.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const STREAMS = [
  ['server/lib/ramLog.js', 'ram', 'HighRamUsage', 'RamBleed'],
  ['server/lib/cpuLog.js', 'cpu', 'HighCpuUsage', 'CpuBleed'],
  ['server/lib/diskLog.js', 'disk', 'HighDiskUsage', 'DiskBleed'],
];

test('each monitor names its rows for what happened, and renames the old ones', () => {
  for (const [file, stream, name, legacy] of STREAMS) {
    assert.match(read(file), new RegExp(`stream: '${stream}'[^}]*bleed: '${name}', legacyBleed: '${legacy}'`), file);
  }
  const log = read('server/lib/resourceLog.js');
  assert.match(log, /renameLegacyRows\(defaults\.stream, defaults\.legacyBleed, defaults\.bleed\)/);
  assert.match(log, /updateMany\(\{ stream, bleed: from \}, \{ \$set: \{ bleed: to \}/);
  const speed = read('server/lib/speedLog.js');
  assert.match(speed, /bleed: evt\.bleed \|\| 'SlowRequest'/);
  assert.match(speed, /renameLegacyRows\('speed', 'SlowBleed', 'SlowRequest'\)/);
});

test('negative: no monitor row is named or classed like a vulnerability', () => {
  const log = read('server/lib/resourceLog.js');
  assert.doesNotMatch(log, /cwe: evt\.cwe \|\| 'CWE-400'/, 'no CWE by default');
  for (const file of ['server/lib/ramLog.js', 'server/lib/cpuLog.js', 'server/lib/diskLog.js', 'server/lib/speedLog.js',
    'server/lib/ramMonitor.js', 'server/lib/cpuMonitor.js', 'server/lib/diskMonitor.js']) {
    const code = read(file).replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(code, /bleed: (?:evt\.bleed \|\| )?'[A-Za-z]*Bleed'/, file);
  }
});
