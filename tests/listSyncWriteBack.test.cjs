'use strict';

// #2698: List Sync's write-back to GitLab - the plan (models/lib/listSyncWriteBack.js)
// with GitLab's issue shapes, and the wiring that keeps it opt-in, fenced and
// off the read path. server/lib/tests/listSyncWriteBack.tests.js runs it end
// to end against a fake GitLab; releases/live-tests/gitlab-write-back.mjs
// (build.sh / build.bat) against gitlab.com.
// Run: node tests/listSyncWriteBack.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  WRITE_BACK_SOURCES, MAX_WRITES_PER_RUN, gitlabDescriptionFooter, gitlabCardDescription, gitlabIssueDescription,
  planGitlabWriteBack, gitlabRequest,
} = require('../models/lib/listSyncWriteBack.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SINCE = '2026-10-14T10:00:00Z';
const AFTER = '2026-10-14T11:00:00Z';
const BEFORE = '2026-10-14T09:00:00Z';

(async () => {
  const { parseGitlab } = await import('../models/lib/externalParsers.js');
  const web = 'https://gitlab.com/team/app/-/issues/7';
  const issue = { iid: 7, title: 'Pump', description: 'Old text', state: 'opened', web_url: web, references: { full: 'team/app#7' } };

  // The footer is exactly the one the parser adds, so stripping it is exact.
  for (const sample of [issue, { ...issue, description: '' }, { iid: 8, title: 'x', description: 'y', state: 'opened' }, { iid: 9, title: 'z', state: 'opened' }]) {
    assert.equal(gitlabCardDescription(sample, sample.description), parseGitlab([sample]).tasks[0].description, JSON.stringify(sample));
    assert.equal(gitlabIssueDescription(sample, gitlabCardDescription(sample, sample.description)), sample.description || '');
  }
  assert.equal(gitlabDescriptionFooter(issue), `Source: team/app#7 ${web}`);
  assert.equal(gitlabIssueDescription(issue, 'Text without the footer'), 'Text without the footer', 'a removed footer is sent as it is');
  assert.equal(gitlabIssueDescription(issue, `Source: team/app#7 ${web}`), '');
  console.log('  ok - the description footer Sync adds is the parser\'s, and is not sent back');

  const baseline = { title: 'Pump', description: gitlabCardDescription(issue, 'Old text') };
  const card = { _id: 'c7', syncExternalId: '7', title: 'Pump', description: baseline.description, archived: false, syncLastSource: baseline };
  const plan = (cards, comments = [], issues = [issue], since = SINCE) => planGitlabWriteBack({ issues, cards, comments, since }).operations;

  // Text: only a local-only edit.
  assert.deepEqual(plan([card]), [], 'nothing changed, nothing written');
  assert.deepEqual(plan([{ ...card, title: 'Pump v2', description: gitlabCardDescription(issue, 'New text') }]), [
    { kind: 'text', cardId: 'c7', iid: 7, set: { title: 'Pump v2', description: 'New text' },
      card: { title: 'Pump v2', description: gitlabCardDescription(issue, 'New text') } }]);
  // Negative: both sides changed - a conflict, never written over.
  assert.deepEqual(plan([{ ...card, title: 'Pump (WeKan)' }], [], [{ ...issue, title: 'Pump (GitLab)' }]), []);
  // Negative: no baseline (a legacy card) - nothing is guessed.
  assert.deepEqual(plan([{ ...card, title: 'Pump v2', syncLastSource: undefined }]), []);
  // Negative: an empty title is not sent; an archived card's text is not sent.
  assert.deepEqual(plan([{ ...card, title: '   ' }]), []);
  assert.deepEqual(plan([{ ...card, title: 'Pump v2', archived: true, archivedAt: BEFORE }]), []);
  // Negative: a card whose issue is gone, or another list's card, writes nothing.
  assert.deepEqual(plan([{ ...card, title: 'Pump v2' }], [], []), []);
  assert.deepEqual(plan([{ ...card, syncExternalId: '8', title: 'Pump v2' }]), []);
  console.log('  ok - a local-only edit is written; a conflict, a legacy card, an empty title are not');

  // Close and reopen.
  assert.deepEqual(plan([{ ...card, archived: true, archivedAt: AFTER }]), [{ kind: 'close', cardId: 'c7', iid: 7 }]);
  // Negative: archived before write-back was switched on, or without a date.
  assert.deepEqual(plan([{ ...card, archived: true, archivedAt: BEFORE }]), []);
  assert.deepEqual(plan([{ ...card, archived: true }]), []);
  // Negative: already closed.
  assert.deepEqual(plan([{ ...card, archived: true, archivedAt: AFTER }], [], [{ ...issue, state: 'closed' }]), []);
  assert.deepEqual(plan([{ ...card, syncClosedByWeKan: true }], [], [{ ...issue, state: 'closed' }]), [{ kind: 'reopen', cardId: 'c7', iid: 7 }]);
  // Negative: an issue GitLab closed is not reopened by WeKan.
  assert.deepEqual(plan([card], [], [{ ...issue, state: 'closed' }]), []);
  console.log('  ok - archived in WeKan closes, restored reopens what WeKan closed, nothing else');

  // Comments.
  const comment = { _id: 'm1', cardId: 'c7', text: 'Checked the seals', createdAt: AFTER };
  assert.deepEqual(plan([card], [comment]), [{ kind: 'comment', cardId: 'c7', iid: 7, commentId: 'm1', body: 'Checked the seals' }]);
  for (const bad of [{ ...comment, createdAt: BEFORE }, { ...comment, syncCommentId: '55' }, { ...comment, text: '  ' },
    { ...comment, cardId: 'other' }, { ...comment, createdAt: 'not a date' }]) {
    assert.deepEqual(plan([card], [bad]), [], JSON.stringify(bad));
  }
  // Negative: switched off (no since) - nothing at all.
  assert.deepEqual(planGitlabWriteBack({ issues: [issue], cards: [{ ...card, title: 'Pump v2' }], comments: [comment] }).operations, []);
  console.log('  ok - new comments become notes; old, synced, empty or foreign ones do not');

  // A run is bounded.
  const many = Array.from({ length: MAX_WRITES_PER_RUN + 5 }, (_, i) => ({ ...comment, _id: `m${i}` }));
  const bounded = planGitlabWriteBack({ issues: [issue], cards: [card], comments: many, since: SINCE });
  assert.equal(bounded.operations.length, MAX_WRITES_PER_RUN);
  assert.equal(bounded.skipped, 5, 'the rest wait for the next run');

  assert.deepEqual(gitlabRequest({ kind: 'text', iid: 7, set: { title: 'T' } }), ['PUT', 'issues/7', { title: 'T' }]);
  assert.deepEqual(gitlabRequest({ kind: 'close', iid: 7 }), ['PUT', 'issues/7', { state_event: 'close' }]);
  assert.deepEqual(gitlabRequest({ kind: 'reopen', iid: 7 }), ['PUT', 'issues/7', { state_event: 'reopen' }]);
  assert.deepEqual(gitlabRequest({ kind: 'comment', iid: 7, body: 'b' }), ['POST', 'issues/7/notes', { body: 'b' }]);
  assert.throws(() => gitlabRequest({ kind: 'delete', iid: 7 }));
  assert.deepEqual(WRITE_BACK_SOURCES, ['gitlab']);
  console.log('  ok - bounded runs, and only these four requests');

  // The wiring.
  const fetchSrc = read('server/lib/listSyncFetch.js');
  assert.match(fetchSrc, /export async function gitlabWrite\(syncSource, credential, method, path, body\)/);
  assert.match(fetchSrc, /if \(inGrain\(\)\) throw new Error\('Writing back to GitLab is not available in Sandstorm\.'\);/);
  // Negative: no other method, and no path but an issue or its notes.
  assert.match(fetchSrc, /if \(!\['PUT', 'POST'\]\.includes\(method\) \|\| !\/\^issues\\\/\[1-9\]\[0-9\]\{0,15\}\(\?:\\\/notes\)\?\$\/\.test\(path\)\)/);
  assert.match(fetchSrc, /maxRedirects: 0, maxResponseBytes: MAX_RESPONSE_BYTES,\s*recordBlocked: false/);
  const sync = read('server/listSync.js');
  assert.match(sync, /if \(recordCoverage && !dryRun && !resolution && !conflictScope && source\.writeBack === true\) \{/,
    'once a run, never for a preview, a resolution or an assigned-only member');
  assert.ok(sync.indexOf('await writeBackToGitlab(') < sync.indexOf('const raw = await fetcher('), 'before the run fetches');
  assert.match(sync, /if \(writeError instanceof Meteor\.Error\) throw writeError;/, 'a lost reservation still stops the run');
  assert.match(sync, /\$set: \{ syncWriteBackError: String/);
  // Negative: the error is beside syncSource, never in it (the run's list writes match syncSource whole).
  assert.doesNotMatch(sync, /syncSource\.lastWriteBackError|'syncSource\.syncWriteBackError'/);
  const executor = read('server/lib/listSyncWriteBack.js');
  assert.match(executor, /await assertCurrent\(\);\s*\/\/ eslint-disable-next-line no-await-in-loop\s*const answer = await write\(/, 'every write fenced');
  assert.match(executor, /syncCommentId: \{ \$exists: false \} \},\s*\{ \$set: \{ syncCommentId: String\(answer\.id\) \} \}/);
  assert.match(executor, /createdAt: \{ \$gte: new Date\(source\.writeBackSince\) \}/);
  const methods = read('server/methods/listSync.js');
  assert.match(methods, /writeBack: Match\.Optional\(Boolean\)/);
  assert.match(methods, /config\.writeBack === true && WRITE_BACK_SOURCES\.includes\(source\.type\)/, 'off unless chosen, GitLab only');
  assert.match(methods, /list\.syncSource\?\.writeBack === true && list\.syncSource\.writeBackSince && oldKey === sourceKey/);
  assert.match(read('models/lists.js'), /'syncSource\.writeBack': \{ type: Boolean, optional: true \}/);
  assert.match(read('models/cards.js'), /syncClosedByWeKan: \{ type: Boolean, optional: true \}/);
  // A copy is independent work: it never reopens the original's issue.
  assert.match(read('models/cards.js'), /delete cardData\.syncClosedByWeKan;/);
  assert.match(read('server/lib/syncRuleCopyCardCommand.js'), /'syncClosedByWeKan'\]\) delete doc\[key\]/);
  const header = read('client/components/lists/listHeader.js');
  assert.match(header, /\{ operation: 'writeBack', label: 'sync-write-back', checked: selected\.writeBack \}/);
  assert.match(read('client/components/lists/listHeader.jade'), /if listSyncWriteBackError\s*\n\s*p\.list-sync-error \{\{_ 'sync-write-back-error'\}\}/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['sync-write-back', 'sync-write-back-error']) assert.equal(typeof en[key], 'string', key);
  assert.match(read('server/lib/tests/index.js'), /^import '\.\/listSyncWriteBack\.tests';$/m);
  // The live test, from both build menus, with the mirror's GitLab login.
  const live = read('releases/live-tests/gitlab-write-back.mjs');
  assert.match(live, /glab/);
  assert.match(live, /planGitlabWriteBack/);
  // The runner runs every test in its directory, and both menus run the runner.
  assert.match(read('releases/live-tests/run.mjs'), /fs\.readdirSync\(DIR\)\.filter\(file => file\.endsWith\('\.mjs'\) && file !== 'run\.mjs'\)/);
  assert.match(read('build.sh'), /node "\$WEKAN_DIR\/releases\/live-tests\/run\.mjs"/);
  assert.match(read('build.bat'), /node "%REPO%\\releases\\live-tests\\run\.mjs"/);
  // Negative: no automatic run calls them - they write to real services.
  for (const auto of ['tests/run-node-suites.cjs', 'package.json']) assert.doesNotMatch(read(auto), /live-tests/, auto);
  console.log('  ok - opt-in, GitLab only, fenced, before the fetch, beside syncSource, in both build menus');

  console.log('\nlistSyncWriteBack: all tests passed');
})().catch(error => { console.error(error); process.exit(1); });
