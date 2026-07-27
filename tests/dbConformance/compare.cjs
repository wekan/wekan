'use strict';

// Did every database answer the same?
//
//   node tests/dbConformance/compare.cjs --dir ../log/2026-07-28_12-00-00 \
//        [--reference sqlite]
//
// Reads every db-conformance-<label>.json in <dir>, compares each case against
// the reference backend, and writes db-conformance-report.md beside them. Exits
// non-zero when a backend disagrees with the reference on a case that is supposed
// to be identical - which is the whole point of running this.
//
// The comparison itself is a pure function (compareRuns), so it is unit-tested
// without a database: tests/dbConformanceWiring.test.cjs.

const fs = require('fs');
const path = require('path');

// ── the pure part ───────────────────────────────────────────────────────────

// Deep equality on the already-normalised values run.cjs wrote.
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Compare every run against the reference run.
//
// Returns { reference, labels, cases: [{id, group, name, compare, verdict,
//   perLabel: {label: 'same'|'different'|'error'|'missing'}}], summary }
//
// verdict is:
//   'agree'     - every backend gave the same answer (or all agreed it errors)
//   'differ'    - at least one backend's answer differs from the reference
//   'error'     - at least one backend could not answer at all
// A case whose `compare` is 'ok' only has to have been answered.
function compareRuns(runs, referenceLabel) {
  const byLabel = new Map(runs.map(r => [r.label, r]));
  const reference = byLabel.has(referenceLabel) ? referenceLabel : runs[0] && runs[0].label;
  const ref = byLabel.get(reference);
  if (!ref) return { reference: null, labels: [], cases: [], summary: { agree: 0, differ: 0, error: 0 } };

  const labels = runs.map(r => r.label);
  const cases = [];
  const summary = { agree: 0, differ: 0, error: 0 };

  for (const refCase of ref.results) {
    const perLabel = {};
    let differ = false;
    let error = 'error' in refCase;

    for (const label of labels) {
      const run = byLabel.get(label);
      const mine = (run.results || []).find(x => x.id === refCase.id);
      if (!mine) { perLabel[label] = 'missing'; differ = true; continue; }
      if ('error' in mine) {
        // Two backends failing the SAME way is agreement about a limitation,
        // which is worth knowing and is not a difference between them.
        perLabel[label] = ('error' in refCase && mine.error === refCase.error) ? 'same-error' : 'error';
        if (perLabel[label] === 'error') error = true;
        continue;
      }
      if ('error' in refCase) { perLabel[label] = 'answered'; differ = true; continue; }
      if (refCase.compare === 'ok') { perLabel[label] = 'answered'; continue; }
      perLabel[label] = same(mine.value, refCase.value) ? 'same' : 'different';
      if (perLabel[label] === 'different') differ = true;
    }

    const verdict = differ ? 'differ' : (error ? 'error' : 'agree');
    summary[verdict] += 1;
    cases.push({ id: refCase.id, group: refCase.group, name: refCase.name,
      compare: refCase.compare, verdict, perLabel });
  }

  return { reference, labels, cases, summary };
}

// The report, as text. Pure, so the test can read it.
function renderReport(cmp, meta = {}) {
  const lines = [];
  lines.push('# FerretDB v1: do all backends answer the same?');
  lines.push('');
  if (meta.when) lines.push(`Run: ${meta.when}`);
  if (meta.platform) lines.push(`Platform: ${meta.platform}`);
  lines.push(`Reference backend: **${cmp.reference}**`);
  lines.push(`Backends compared: ${cmp.labels.join(', ')}`);
  lines.push('');
  lines.push(`| Verdict | Cases |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Same answer everywhere | ${cmp.summary.agree} |`);
  lines.push(`| **Different** | ${cmp.summary.differ} |`);
  lines.push(`| Errored somewhere | ${cmp.summary.error} |`);
  lines.push('');

  const bad = cmp.cases.filter(c => c.verdict !== 'agree');
  if (!bad.length) {
    lines.push('Every backend answered every case the same way.');
  } else {
    lines.push('## Where they disagree');
    lines.push('');
    lines.push(`| Case | ${cmp.labels.join(' | ')} |`);
    lines.push(`| --- | ${cmp.labels.map(() => '---').join(' | ')} |`);
    for (const c of bad) {
      lines.push(`| ${c.id} | ${cmp.labels.map(l => c.perLabel[l] || '-').join(' | ')} |`);
    }
    lines.push('');
    lines.push('`different` = answered, but not the same as the reference. `error` = ' +
      'could not answer. `same-error` = failed the same way as the reference, which ' +
      'is agreement about a limitation rather than a difference.');
  }
  lines.push('');
  lines.push('## Every case');
  lines.push('');
  let group = null;
  for (const c of cmp.cases) {
    if (c.group !== group) { group = c.group; lines.push(`### ${group}`); lines.push(''); }
    const mark = c.verdict === 'agree' ? 'same' : c.verdict;
    lines.push(`- ${mark === 'same' ? 'OK  ' : mark.toUpperCase()} ${c.name}`);
  }
  lines.push('');
  return lines.join('\n');
}

module.exports = { compareRuns, renderReport, same };

// ── the script part ─────────────────────────────────────────────────────────
if (require.main === module) {
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
  };
  const dir = arg('dir', '.');
  const reference = arg('reference', 'sqlite');

  const runs = fs.readdirSync(dir)
    .filter(f => /^db-conformance-.*\.json$/.test(f))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (!runs.length) {
    console.error(`No db-conformance-*.json in ${dir} - nothing to compare.`);
    process.exit(1);
  }

  const cmp = compareRuns(runs, reference);
  const report = renderReport(cmp, {
    when: new Date().toISOString(),
    platform: `${process.platform}/${process.arch}`,
  });
  const out = path.join(dir, 'db-conformance-report.md');
  fs.writeFileSync(out, report);

  console.log(report.split('\n## Every case')[0]);
  console.log(`Full report: ${out}`);

  if (runs.length === 1) {
    console.log('Only one backend ran, so there was nothing to compare it with.');
    process.exit(0);
  }
  process.exit(cmp.summary.differ > 0 ? 1 : 0);
}
