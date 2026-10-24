'use strict';

// Turn the speedtest-<label>.json files of one run into Results.md.
//
//   node docs/Databases/FerretDB/1/SpeedTest/report.cjs --dir .tools/log/test-db-speedtest/<datetime> \
//        --results docs/Databases/FerretDB/1/SpeedTest/Results.md
//
// - the speed table: one row per database, fastest at the top, one column per
//   common WeKan query (the median time of one call);
// - the load table: how long loading the data and creating WeKan's indexes took;
// - the same-data table: whether every answer - and what the writes stored - is
//   the same as MongoDB's.
//
// Exits 1 when any database answered any query differently, so a run that is
// fast because it is wrong does not pass.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { QUERIES } = require('./queries.cjs');
const { PRODUCTION } = require('./data.cjs');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// MongoDB is what WeKan's queries are written for, so it is the reference; the
// newest version WeKan's Mocha tests run on first. SQLite only when no MongoDB ran.
const REFERENCE_ORDER = ['mongodb8', 'mongodb7', 'mongodb9', 'mongodb6', 'sqlite'];

function loadRuns(dir) {
  return fs.readdirSync(dir)
    .filter(f => /^speedtest-.+\.json$/.test(f))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function ms(v) {
  if (v === undefined || v === null || Number.isNaN(v)) return '-';
  if (v < 10) return v.toFixed(2);
  if (v < 100) return v.toFixed(1);
  return Math.round(v).toLocaleString('en-US');
}
function seconds(v) {
  return v === undefined ? '-' : `${(v / 1000).toFixed(1)} s`;
}

function total(run) {
  let sum = 0;
  for (const q of QUERIES) {
    const r = run.queries[q.id];
    if (!r || r.error || r.average === undefined) return Infinity;
    sum += r.average;
  }
  return sum;
}

// Per query: does each parameter's answer match the reference's?
function compare(runs, reference) {
  const ref = runs.find(r => r.label === reference);
  const out = {};
  for (const run of runs) {
    const differ = [];
    for (const q of QUERIES) {
      const mine = run.queries[q.id];
      const theirs = ref && ref.queries[q.id];
      if (!mine || !theirs) { differ.push({ query: q.id, why: 'not run' }); continue; }
      const n = Math.max(mine.answers.length, theirs.answers.length);
      for (let i = 0; i < n; i += 1) {
        const a = mine.answers[i];
        const b = theirs.answers[i];
        if (!a || !b) { differ.push({ query: q.id, param: i, why: 'missing answer' }); break; }
        if (a.error || b.error) {
          if (a.error !== b.error) { differ.push({ query: q.id, param: i, why: a.error ? `error: ${a.error}` : `reference error: ${b.error}` }); break; }
          continue;
        }
        if (a.sha256 !== b.sha256) {
          differ.push({ query: q.id, param: i, why: `${a.size ?? ''} vs ${b.size ?? ''} - ${a.sample.slice(0, 160)}`.trim() });
          break;
        }
      }
    }
    if (ref && (!run.written || !ref.written || run.written.sha256 !== ref.written.sha256)) {
      differ.push({ query: 'stored writes', why: 'the cards the writes changed differ' });
    }
    out[run.label] = differ;
  }
  return out;
}

function machine() {
  const cpus = os.cpus();
  return `${cpus[0] ? cpus[0].model.trim() : os.arch()}, ${cpus.length} threads, ` +
    `${Math.round(os.totalmem() / 2 ** 30)} GiB RAM, Linux ${os.release()}`;
}

function render(runs, sameness, reference, dir) {
  const sorted = [...runs].sort((a, b) => total(a) - total(b) || a.label.localeCompare(b.label));
  const first = runs.map(r => r.started).sort()[0] || '';
  const sizes = (runs[0] && runs[0].sizes) || {};
  const lines = [];
  lines.push('# WeKan database speed test results', '');
  lines.push(`Run ${first.slice(0, 10)} on ${machine()}, by`);
  lines.push('[speedtest.sh](speedtest.sh). How it works, and what was improved because of it:');
  lines.push('[the README](.).', '');
  lines.push(`The data is twice a production WeKan: ${['users', 'boards', 'lists', 'swimlanes', 'cards']
    .map(c => `${(sizes[c] || 0).toLocaleString('en-US')} ${c}`).join(', ')}` +
    ` (production: ${PRODUCTION.cards.toLocaleString('en-US')} cards). Every database got identical`);
  lines.push('documents and WeKan\'s own indexes, and was asked identical questions.', '');

  const table = (field, totalOf) => {
    const head = ['Database', 'Total', ...QUERIES.map(q => q.title)];
    lines.push(`| ${head.join(' | ')} |`);
    lines.push(`| ${head.map((_, i) => (i === 0 ? '---' : '---:')).join(' | ')} |`);
    for (const run of sorted) {
      const t = totalOf(run);
      const cells = QUERIES.map((q) => {
        const r = run.queries[q.id];
        if (!r) return '-';
        if (r.error) return 'error';
        return ms(r[field]);
      });
      lines.push(`| ${run.engine} | ${Number.isFinite(t) ? `**${ms(t)}**` : 'incomplete'} | ${cells.join(' | ')} |`);
    }
    lines.push('');
  };
  lines.push('## Speed', '');
  lines.push('Milliseconds for one call - smaller is faster. Each query is asked with 15 parameters (the');
  lines.push('3 biggest boards or busiest users and 12 ordinary ones, see below); a cell is the average of');
  lines.push('the 15 per-parameter medians. **Total** is the sum of a row, and the table is ordered by it:');
  lines.push('fastest database at the top.', '');
  table('average', total);
  lines.push('### The slowest parameter', '');
  lines.push('The same, for the slowest of the 15 parameters - nearly always the biggest board or the');
  lines.push('busiest user. This is how long the person who waits longest waits. Same row order.', '');
  table('slowest', (run) => QUERIES.reduce((sum, q) => {
    const r = run.queries[q.id];
    return r && !r.error && r.slowest !== undefined ? sum + r.slowest : Infinity;
  }, 0));

  lines.push('## Loading the data', '');
  lines.push('Inserting the documents in batches of 1,000, then creating every index WeKan creates.', '');
  lines.push('| Database | users | boards | lists | swimlanes | cards | Indexes | Index errors |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const run of sorted) {
    const l = run.load || {};
    const ixErrors = Object.entries(run.indexes || {}).filter(([, v]) => v.error).map(([k]) => k.replace(/\|/g, '\\|'));
    lines.push(`| ${run.engine} | ${['users', 'boards', 'lists', 'swimlanes', 'cards'].map(c => seconds(l[c] && l[c].ms)).join(' | ')} | ` +
      `${seconds(run.indexTotalMs)} | ${ixErrors.length ? ixErrors.join(', ') : 'none'} |`);
  }
  lines.push('');

  lines.push('## Same data', '');
  const refRun = runs.find(r => r.label === reference);
  lines.push(`Every answer of every query, for every parameter, and the cards the writes left behind,`);
  lines.push(`compared with **${refRun ? refRun.engine : reference}**. Answers are compared as typed values with`);
  lines.push('sorted keys; a query whose order WeKan relies on must also return the same order.', '');
  lines.push('| Database | Same answers | Different |');
  lines.push('| --- | --- | --- |');
  for (const run of sorted) {
    const d = sameness[run.label] || [];
    const answered = QUERIES.length + 1 - d.length;
    lines.push(`| ${run.engine} | ${answered} of ${QUERIES.length + 1} | ${d.length ? d.map(x => `${x.query}${x.param !== undefined ? ` #${x.param}` : ''}: ${String(x.why).replace(/\|/g, '\\|').replace(/\n/g, ' ')}`).join('<br>') : 'none'} |`);
  }
  lines.push('');

  lines.push('## The queries', '');
  lines.push('Each is the query WeKan itself sends; see [queries.cjs](queries.cjs).', '');
  lines.push('| Column | Query | Asked for |');
  lines.push('| --- | --- | --- |');
  for (const q of QUERIES) {
    lines.push(`| ${q.title} | ${q.what.replace(/\|/g, '\\|')} | ${{ users: 'the 3 users on most boards + 12 others', boards: 'the 3 biggest boards + 12 others', pages: 'pages 1, 2, the middle and the last' }[q.params]} |`);
  }
  lines.push('');
  const calls = runs.length ? Object.values(runs[0].queries).map(r => r.calls).filter(Boolean) : [];
  lines.push(`Each query is first run once per parameter to warm up (those answers are the ones compared),`);
  lines.push(`then repeated for up to 5 passes or 10 seconds; ${calls.length ? `${Math.min(...calls)}-${Math.max(...calls)}` : 'the'} calls per query were timed.`);
  lines.push('A query too slow to be repeated in that time keeps its warm-up time.');
  lines.push(`Raw results: \`${path.relative(path.resolve(__dirname, '../../../../..'), dir) || dir}/speedtest-<database>.json\`.`, '');
  return `${lines.join('\n')}\n`;
}

function main() {
  const dir = arg('dir', '.');
  const results = arg('results', path.join(__dirname, 'Results.md'));
  const runs = loadRuns(dir);
  if (!runs.length) {
    console.error(`No speedtest-*.json in ${dir}.`);
    process.exit(1);
  }
  const reference = REFERENCE_ORDER.find(l => runs.some(r => r.label === l)) || runs[0].label;
  const sameness = compare(runs, reference);
  fs.writeFileSync(results, render(runs, sameness, reference, dir));
  console.log(`Wrote ${results}`);
  let failed = false;
  for (const run of runs) {
    const d = sameness[run.label];
    console.log(`${d.length ? 'DIFFERENT' : 'SAME     '} ${run.engine}${d.length ? `: ${d.map(x => x.query).join(', ')}` : ''}`);
    if (d.length) failed = true;
    if (run.errors && run.errors.some(e => e.where === 'run')) { console.log(`ERROR     ${run.engine}: the run did not finish`); failed = true; }
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();

module.exports = { compare, render, total, REFERENCE_ORDER };
