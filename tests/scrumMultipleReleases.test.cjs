'use strict';
// More than one release per card (2026-10-08). A card's releases are
// `scrum.releaseIds`, with `scrum.releaseId` kept as the first entry and read
// for cards written before (models/lib/scrum.js cardReleaseIds). Every reader
// and writer: the method's merge, the board-reference check, copy and move by
// name, the native transfer, Jira import and export, release reports, the
// rule e-mail details, Scrum History's checks and the card UI.
// Run: node tests/scrumMultipleReleases.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../models/lib/scrum');
const { boardScrum, copiedScrumMetadata, movedScrumMetadata } = require('../models/lib/scrumCopy');
const { normalizeScrumTransfer, remapScrumTransfer } = require('../models/lib/scrumTransfer');
const { jiraScrumPlanning } = require('../models/lib/jiraScrumPlanning');
const { jiraScrumMetadataExport } = require('../models/lib/jiraScrumMetadata');
const { releaseReports } = require('../models/lib/scrumReports');
const { appendRuleCardScrum } = require('../server/lib/ruleCardScrum');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('reading: the list, the legacy single release, and both at once', () => {
  assert.deepEqual(S.cardReleaseIds(undefined), []);
  assert.deepEqual(S.cardReleaseIds({}), []);
  assert.deepEqual(S.cardReleaseIds({ releaseId: 'a' }), ['a'], 'a card from before reads as its one release');
  assert.deepEqual(S.cardReleaseIds({ releaseId: null }), []);
  assert.deepEqual(S.cardReleaseIds({ releaseId: 'a', releaseIds: ['a', 'b'] }), ['a', 'b']);
  // An older writer that knew only `releaseId` changed it: that release is
  // read, first, and nothing in the list is lost.
  assert.deepEqual(S.cardReleaseIds({ releaseId: 'c', releaseIds: ['a', 'b'] }), ['c', 'a', 'b']);
  assert.deepEqual(S.cardReleaseIds({ releaseIds: ['a', 'a', '', null, 7, 'b', 'a'] }), ['a', 'b'], 'duplicates and junk collapse');
});

test('the stored form is idempotent', () => {
  for (const scrum of [{ releaseId: 'a' }, { releaseIds: ['b', 'a', 'b'] }, { releaseId: 'c', releaseIds: ['a'] }, {}]) {
    const once = S.withCardReleaseIds(scrum, S.cardReleaseIds(scrum));
    const twice = S.withCardReleaseIds(once, S.cardReleaseIds(once));
    assert.deepEqual(twice, once, JSON.stringify(scrum));
    assert.equal(once.releaseId, once.releaseIds[0] ?? null, 'releaseId is the first of the list');
  }
});

test('a write: the list replaces, the legacy field addresses the first release, nothing else changes', () => {
  const two = { releaseId: 'a', releaseIds: ['a', 'b'], issueType: 'Story' };
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseIds: ['c', 'a'] }),
    { releaseId: 'c', releaseIds: ['c', 'a'], issueType: 'Story' });
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseIds: [] }), { releaseId: null, releaseIds: [], issueType: 'Story' });
  // An older client (or REST caller) sends the release it showed - the first.
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseId: 'a' }).releaseIds, ['a', 'b'], 'unchanged: the others stay');
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseId: 'x' }).releaseIds, ['x', 'b'], 'the first replaced');
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseId: null }).releaseIds, [], '"no release" clears them');
  assert.deepEqual(S.applyCardReleaseChange(two, { releaseIds: ['b', 'c'], releaseId: 'b' }).releaseIds, ['b', 'c']);
  // A legacy card is brought to the stored form by any write, once.
  assert.deepEqual(S.applyCardReleaseChange({ releaseId: 'a' }, { issueType: 'Bug' }),
    { releaseId: 'a', releaseIds: ['a'], issueType: 'Bug' });
  // A card without releases does not grow the fields.
  assert.deepEqual(S.applyCardReleaseChange({ sprintId: 's' }, { issueType: 'Bug' }), { sprintId: 's', issueType: 'Bug' });
});

test('negative: contradictions, duplicates and bad lists', () => {
  assert.throws(() => S.applyCardReleaseChange({}, { releaseIds: ['a', 'b'], releaseId: 'b' }), /first of releaseIds/);
  assert.throws(() => S.applyCardReleaseChange({}, { releaseIds: [], releaseId: 'a' }), /first of releaseIds/);
  assert.deepEqual(S.normalizeScrumMetadata('card', { releaseIds: ['a', 'b', 'a'] }), { releaseIds: ['a', 'b'] }, 'collapsed');
  for (const bad of ['a', null, [null], [''], [1], Array.from({ length: S.MAX_CARD_RELEASES + 1 }, (_, i) => `r${i}`)]) {
    assert.throws(() => S.normalizeScrumMetadata('card', { releaseIds: bad }), JSON.stringify(bad).slice(0, 40));
  }
  assert.throws(() => S.normalizeScrumMetadata('swimlane', { releaseIds: ['a'] }), /Unsupported field/,
    'a swimlane keeps one release');
});

test('the method checks every release against the board, in one read, and merges with the helper', () => {
  const src = read('server/scrum.js');
  const refs = src.split('async function references(')[1].split('\n}\n')[0];
  assert.match(refs, /const releaseIds = cardReleaseIds\(metadata\);/);
  assert.match(refs, /ScrumReleases\.find\(\{ _id: \{ \$in: releaseIds \}, boardId \}/);
  assert.match(refs, /countAsync\(\) !== releaseIds\.length\) \{\n\s+invalid\('Reference does not belong to this board'\)/,
    'a release of another board (or none) is refused');
  assert.match(src, /kind === 'card' \? validate\(\(\) => applyCardReleaseChange\(before\.scrum \|\| \{\}, clean\)\)/);
  assert.match(src, /const scrum = kind === 'card'[^\n]*\n\s+await references\(boardId, scrum\);/, 'checked after the merge');
});

const planning = {
  from: { sprints: [], releases: [{ _id: 'a', name: '1.0' }, { _id: 'b', name: '2.0' }, { _id: 'c', name: 'Only here' }] },
  to: { sprints: [], releases: [{ _id: 'A', name: '1.0', state: 'planned' }, { _id: 'B', name: ' 2.0 ', state: 'released' }] },
};

test('copy and move to another board link each release by name, drop the rest', () => {
  const card = { boardId: 'one', scrum: { releaseId: 'a', releaseIds: ['a', 'c', 'b'], issueType: 'Bug' } };
  assert.deepEqual(copiedScrumMetadata(card, 'two', { planning }).scrum,
    { issueType: 'Bug', releaseId: 'A', releaseIds: ['A', 'B'] });
  assert.deepEqual(movedScrumMetadata(card, 'two', planning).scrum, { issueType: 'Bug', releaseId: 'A', releaseIds: ['A', 'B'] });
  // Same board: unchanged, and a copy of the list rather than the same array.
  const same = copiedScrumMetadata(card, 'one').scrum;
  assert.deepEqual(same, card.scrum); same.releaseIds.push('z'); assert.deepEqual(card.scrum.releaseIds, ['a', 'c', 'b']);
  // A legacy card stays legacy-shaped; a swimlane too.
  assert.deepEqual(boardScrum({ releaseId: 'b', purpose: 'Team' }, planning), { purpose: 'Team', releaseId: 'B' });
  // Negative: nothing matches, a cancelled release, no planning.
  assert.deepEqual(boardScrum({ releaseIds: ['c'], releaseId: 'c' }, planning), { releaseId: null, releaseIds: [] });
  const cancelled = { ...planning, to: { sprints: [], releases: [{ _id: 'A', name: '1.0', state: 'cancelled' }] } };
  assert.deepEqual(boardScrum({ releaseIds: ['a'], releaseId: 'a' }, cancelled).releaseIds, []);
  assert.deepEqual(boardScrum({ releaseIds: ['a'], releaseId: 'a', issueType: 'X' }, null), { issueType: 'X' });
});

test('the server hooks load the planning for a card with releases in the list only', () => {
  for (const file of ['server/models/cards.js', 'server/models/swimlanes.js', 'server/notifications/storedRulePlans.js']) {
    const src = read(file);
    assert.doesNotMatch(src, /scrum\.sprintId \|\| (doc|raw)\.scrum\.releaseId\)/, file);
    assert.match(src, /cardReleaseIds\((doc|raw)\.scrum\)\.length/, file);
  }
});

const transfer = cards => ({ format: 'wekan-scrum-2', settings: {}, sprints: [], events: [], lists: [], swimlanes: [],
  releases: [{ _id: 'r1', name: '1.0', state: 'planned' }, { _id: 'r2', name: '2.0', state: 'planned' }], cards });

test('the native transfer: portable form, every release remapped', () => {
  const t = normalizeScrumTransfer(transfer([
    { _id: 'c1', scrum: { releaseId: 'r1', releaseIds: ['r1', 'r2', 'r1'] } },
    { _id: 'c2', scrum: { releaseIds: ['r2'], releaseId: 'r2' } },
    { _id: 'c3', scrum: { releaseId: 'r1' } },
    { _id: 'c4', scrum: { releaseIds: [], releaseId: null, issueType: 'Bug' } },
  ]));
  assert.deepEqual(t.cards.map(c => c.scrum), [{ releaseId: 'r1', releaseIds: ['r1', 'r2'] }, { releaseId: 'r2' },
    { releaseId: 'r1' }, { issueType: 'Bug' }], 'one release is written exactly as an older reader expects');
  const maps = Object.fromEntries([['releases', ['r1', 'r2']], ['cards', ['c1', 'c2', 'c3', 'c4']]]
    .map(([kind, ids]) => [kind, new Map(ids.map(id => [id, `new-${id}`]))]));
  const { transfer: out, losses } = remapScrumTransfer(t, maps);
  assert.deepEqual(losses, []);
  assert.deepEqual(out.cards[0].scrum, { releaseId: 'new-r1', releaseIds: ['new-r1', 'new-r2'] });
  assert.deepEqual(out.cards[2].scrum, { releaseId: 'new-r1' });
});

test('negative: a release that is not in the file is refused, in the list as in the single field', () => {
  assert.throws(() => normalizeScrumTransfer(transfer([{ _id: 'c', scrum: { releaseIds: ['r1', 'elsewhere'] } }])),
    /foreign planning reference elsewhere/);
  assert.throws(() => normalizeScrumTransfer(transfer([{ _id: 'c', scrum: { releaseId: 'elsewhere' } }])), /foreign planning reference/);
});

test('the transfer export collects every release and writes the portable form', () => {
  const src = read('server/lib/scrumTransferExport.js');
  assert.match(src, /for \(const id of cardReleaseIds\(row\.scrum\)\) releaseIds\.add\(id\);/);
  assert.match(src, /cards: cards\.map\(row => \(\{ _id: row\._id, scrum: portableCardReleases\(row\.scrum\) \}\)\)/);
});

test('Jira: every fix version is a release of the card, the same one once', () => {
  const plan = jiraScrumPlanning({ issues: [
    { key: 'P-1', fields: { fixVersions: [{ id: '1', name: '1.0' }, { id: '2', name: '2.0', released: true }, { id: '1', name: '1.0' }] } },
    { key: 'P-2', fields: { fixVersions: [{ id: '2', name: '2.0', released: true }] } },
    { key: 'P-3', fields: { fixVersions: [] } },
  ] });
  const byKey = Object.fromEntries(plan.transfer.cards.map(card => [card._id, card.scrum]));
  assert.deepEqual(byKey['P-1'], { releaseId: 'jira-version-1', releaseIds: ['jira-version-1', 'jira-version-2'] });
  assert.deepEqual(byKey['P-2'], { releaseId: 'jira-version-2' });
  assert.equal(byKey['P-3'], undefined);
  assert.deepEqual(plan.losses, []);
  assert.doesNotThrow(() => normalizeScrumTransfer(plan.transfer));
});

test('Jira export: every release of the card is a fix version, and reads back the same', () => {
  const releases = new Map([
    ['a', { _id: 'a', boardId: 'b', name: '1.0', state: 'released', plannedEnd: new Date('2026-08-30T00:00:00Z'),
      provenance: { system: 'jira', recordId: '100' } }],
    ['b', { _id: 'b', boardId: 'b', name: '2.0', state: 'planned', notes: 'Next' }],
    ['x', { _id: 'x', boardId: 'other', name: 'Foreign', state: 'planned' }],
  ]);
  const card = { boardId: 'b', scrum: { releaseId: 'a', releaseIds: ['a', 'b', 'x', 'gone'] } };
  const exported = jiraScrumMetadataExport(card, null, null, releases);
  assert.deepEqual(exported.fixVersions, [{ id: '100', name: '1.0', released: true, releaseDate: '2026-08-30' },
    { id: 'b', name: '2.0', released: false, description: 'Next' }], 'not another board\'s, not a missing one');
  assert.deepEqual(jiraScrumMetadataExport({ boardId: 'b', scrum: { releaseId: 'b' } }, null, null, releases).fixVersions.map(v => v.name),
    ['2.0'], 'a legacy card exports its one release');
  assert.deepEqual(jiraScrumMetadataExport(card, null, new Set(['dates']), releases), {}, 'Scrum not selected');
  const back = jiraScrumPlanning({ issues: [{ key: 'W-1', fields: { fixVersions: exported.fixVersions } }] });
  assert.deepEqual(back.transfer.releases.map(r => [r.name, r.state]), [['1.0', 'released'], ['2.0', 'planned']]);
  assert.equal(back.transfer.cards[0].scrum.releaseIds.length, 2);
  assert.match(read('models/lib/externalExportFormatters.js'), /i\.jiraScrum\?\.fixVersions \? \{ fixVersions: i\.jiraScrum\.fixVersions \}/);
  assert.match(read('models/lib/externalExporters.js'), /jiraScrumMetadataExport\(c, listRecords\.get\(c\.listId\), wanted, releases\)/);
});

test('release reports count a card in each of its releases', () => {
  const releases = [{ _id: 'r1', name: '1.0', state: 'planned' }, { _id: 'r2', name: '2.0', state: 'planned' },
    { _id: 'r3', name: 'Empty', state: 'planned' }];
  const cards = [
    { _id: 'both', scrum: { releaseId: 'r1', releaseIds: ['r1', 'r2', 'r1'] }, poker: { estimation: 3 }, dueComplete: true },
    { _id: 'legacy', scrum: { releaseId: 'r1' }, poker: { estimation: 5 } },
    { _id: 'unknown', scrum: { releaseIds: ['r2'], releaseId: 'r2' } },
    { _id: 'archived', archived: true, scrum: { releaseIds: ['r1'], releaseId: 'r1' }, poker: { estimation: 8 } },
    { _id: 'foreign', scrum: { releaseIds: ['elsewhere'] }, poker: { estimation: 13 } },
  ];
  const settings = { ...S.DEFAULT_SCRUM_SETTINGS };
  const byId = Object.fromEntries(releaseReports(releases, cards, settings).map(row => [row.releaseId, row]));
  assert.deepEqual(byId.r1.scope, { count: 2, estimate: 8, unknown: 0 }, 'the two-release card counts once here');
  assert.deepEqual(byId.r1.done, { count: 1, estimate: 3, unknown: 0 });
  assert.deepEqual(byId.r2.scope, { count: 2, estimate: 3, unknown: 1 }, 'and once here too');
  assert.deepEqual(byId.r3.scope, { count: 0, estimate: 0, unknown: 0 });
  const lists = [{ _id: 'done', scrum: { category: 'done' } }];
  const done = releaseReports(releases, [{ ...cards[1], listId: 'done' }], { ...settings, completionPolicy: 'doneLists' }, lists);
  assert.equal(done[0].done.count, 1, 'the board\'s completion policy decides what is done');
});

test('rule e-mail details name every release of the card, same board only', async () => {
  const lines = [];
  const records = { r1: { _id: 'r1', boardId: 'b', name: '1.0' }, r2: { _id: 'r2', boardId: 'b', name: '2.0' },
    x: { _id: 'x', boardId: 'other', name: 'SECRET' } };
  const check = await appendRuleCardScrum({ card: { boardId: 'b', scrum: { releaseId: 'r1', releaseIds: ['r1', 'x', 'r2'] } },
    board: { scrum: { visibility: { cardRelease: true } } }, readRecord: async (kind, id) => records[id],
    add: (label, value) => lines.push([label, value]) });
  assert.deepEqual(lines, [['Scrum release', ['1.0', '2.0']]]);
  await check();
});

test('Scrum History checks every release and guards each against deletion', () => {
  const src = read('server/lib/scrumHistory.js');
  assert.match(src, /for \(const id of cardReleaseIds\(metadata\)\) await reference\('scrum-release', id\);/);
  assert.match(src, /selector\.\$or = \[\{ 'scrum\.releaseId': entry\.id \}, \{ 'scrum\.releaseIds': entry\.id \}\]/);
  assert.match(src, /field === 'releaseId' && cardReleaseIds\(meta\)\.includes\(entry\.id\)/);
});

test('the card UI edits the list with a multiple select', () => {
  const fields = read('client/components/boards/scrum/scrumFields.js');
  assert.match(fields, /\['Release', 'releaseIds', 'scrum-release'\]/);
  assert.match(fields, /metadata\.releaseIds = form\.getAll\('releaseIds'\)\.filter\(Boolean\)/);
  assert.match(read('client/components/boards/scrum/scrumFields.jade'), /select\(name=field multiple=multiple\)/);
  const view = read('client/components/boards/scrum/scrumView.js');
  assert.match(view, /getAll\('releaseIds'\)\.filter\(Boolean\)/);
  assert.match(view, /'scrum\.updateCard', card\._id, \{ sprintId: nullable\(values\.sprintId\), releaseIds,/);
  assert.match(read('client/components/boards/scrum/scrumView.jade'), /select\(name="releaseIds" multiple\)/);
  assert.match(view, /releaseReports\(result\.releases, result\.cards/);
});

// Negative, across the tree: nothing reads a card's release from the single
// field alone any more - every reader goes through cardReleaseIds, which reads
// both. The one place that names the legacy field on purpose is the helper.
test('negative: no reader of the single legacy field is left', () => {
  const roots = ['client', 'server', 'models', 'imports'];
  const skip = new Set(['models/lib/scrum.js']);
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (!['tests', 'i18n', 'node_modules'].includes(entry.name)) walk(rel); continue; }
      if (!/\.(js|cjs|mjs)$/.test(entry.name) || skip.has(rel)) continue;
      read(rel).split('\n').forEach((line, index) => {
        const code = line.replace(/\/\/.*$/, '');
        if (/\bscrum\??\.releaseId\b(?!s)|\.scrum\??\.\[?['"]?releaseId['"]?\]?\b(?!s)|['"]scrum\.releaseId['"]/.test(code) && !/releaseIds/.test(code)) {
          offenders.push(`${rel}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  };
  roots.forEach(walk);
  assert.deepEqual(offenders, []);
});
