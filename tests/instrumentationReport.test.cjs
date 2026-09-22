const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createInstrumentationSummary } = require('../server/lib/instrumentationSummary.cjs');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('summarizes method, publication and DDP events without retaining payloads', () => {
  let clock = 1000;
  const summary = createInstrumentationSummary({ now: () => clock });
  summary.record({ type: 'ddp.connection.open', connectionId: 'secret' });
  summary.record({ type: 'method.start', name: 'cards.load', userId: 'secret', args: ['secret'] });
  clock = 1010;
  summary.record({ type: 'method.end', name: 'cards.load', durationMs: 10, result: 'secret' });
  summary.record({ type: 'publication.start', name: 'boards', clientAddress: 'secret' });
  summary.record({ type: 'publication.error', name: 'boards', durationMs: 5, error: { message: 'secret' } });
  summary.record({ type: 'ddp.connection.close', connectionId: 'secret' });
  const data = summary.snapshot();
  assert.deepEqual(data.connections, { opened: 1, closed: 1, active: 0 });
  assert.deepEqual(data.operations.map(({ kind, name, calls, completed, errors, averageMs }) =>
    ({ kind, name, calls, completed, errors, averageMs })), [
    { kind: 'Method', name: 'cards.load', calls: 1, completed: 1, errors: 0, averageMs: 10 },
    { kind: 'Publication', name: 'boards', calls: 1, completed: 0, errors: 1, averageMs: 5 },
  ]);
  assert.ok(!JSON.stringify(data).includes('secret'));
});

test('ignores dashboard polling, invalid durations, and excess operation names', () => {
  const summary = createInstrumentationSummary({ maxOperations: 1 });
  summary.record({ type: 'method.start', name: 'getInstrumentationReport' });
  summary.record({ type: 'method.start', name: 'one' });
  summary.record({ type: 'method.error', name: 'one', durationMs: -1 });
  summary.record({ type: 'method.start', name: 'two' });
  assert.deepEqual(summary.snapshot().operations.map(row => row.name), ['one']);
  assert.equal(summary.snapshot().operations[0].averageMs, null);
});

test('admin-only method and Problems pane are wired', () => {
  const method = read('server/methods/instrumentationReport.js');
  assert.match(method, /findOneAsync\(this\.userId/);
  assert.match(method, /if \(!user\?\.isAdmin\) throw new Meteor\.Error/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/instrumentationReport'/);
  assert.match(read('models/lib/adminUrls.js'), /instrumentation: 'report-instrumentation'/);
  assert.match(read('client/components/settings/adminProblems.jade'), /isPane 'report-instrumentation'[\s\S]*\+instrumentationReport/);
});
