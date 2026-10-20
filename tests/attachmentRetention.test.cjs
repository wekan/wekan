'use strict';

// Attachment retention (models/lib/attachmentRetention.js,
// server/attachmentRetention.js): ATTACHMENTS_RETENTION_DAYS soft-deletes card
// attachments after N days (mode uploaded or card-inactive),
// ATTACHMENTS_PURGE_DELETED_AFTER_DAYS removes soft-deleted ones for good.
// Run: node tests/attachmentRetention.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const R = require('../models/lib/attachmentRetention.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const NOW = new Date('2026-10-20T03:45:00Z');
const daysAgo = n => new Date(NOW.getTime() - n * R.DAY_MS);
const att = (over = {}) => ({ _id: 'a1', name: 'f.pdf', meta: { cardId: 'c1', boardId: 'b1' }, uploadedAtOstrio: daysAgo(800), ...over });
const board = { _id: 'b1', type: 'board', createdBy: 'creator' };

test('settings: off unless a positive whole number of days', () => {
  assert.strictEqual(R.normalizeRetentionDays('730'), 730);
  assert.strictEqual(R.normalizeRetentionDays(' "30" '), 30);
  for (const off of [undefined, null, '', '0', '-1', '1.5', '2y', 'true', '99999999']) {
    assert.strictEqual(R.normalizeRetentionDays(off), 0, String(off));
  }
});

test('settings: mode, dry run and per-run cap', () => {
  assert.strictEqual(R.normalizeRetentionMode('card-inactive'), 'card-inactive');
  assert.strictEqual(R.normalizeRetentionMode(' Card-Inactive '), 'card-inactive');
  for (const v of [undefined, '', 'uploaded', 'bogus']) assert.strictEqual(R.normalizeRetentionMode(v), 'uploaded');
  assert.strictEqual(R.normalizeBoolean('true'), true);
  assert.strictEqual(R.normalizeBoolean('"1"'), true);
  assert.strictEqual(R.normalizeBoolean(undefined), false);
  assert.strictEqual(R.normalizeBoolean('false'), false);
  assert.strictEqual(R.normalizeMaxPerRun(undefined), R.DEFAULT_MAX_PER_RUN);
  assert.strictEqual(R.normalizeMaxPerRun('0'), R.DEFAULT_MAX_PER_RUN);
  assert.strictEqual(R.normalizeMaxPerRun('250'), 250);
  assert.strictEqual(R.normalizeMaxPerRun('9999999'), 100000);
});

test('settings: read together from one lookup, everything off by default', () => {
  assert.deepStrictEqual(R.retentionSettings(() => undefined), {
    retentionDays: 0, mode: 'uploaded', purgeDeletedAfterDays: 0, dryRun: false, maxPerRun: 1000,
  });
  const env = { ATTACHMENTS_RETENTION_DAYS: '730', ATTACHMENTS_RETENTION_MODE: 'card-inactive',
    ATTACHMENTS_PURGE_DELETED_AFTER_DAYS: '30', ATTACHMENTS_RETENTION_DRY_RUN: 'true',
    ATTACHMENTS_RETENTION_MAX_PER_RUN: '50' };
  assert.deepStrictEqual(R.retentionSettings(n => env[n]), {
    retentionDays: 730, mode: 'card-inactive', purgeDeletedAfterDays: 30, dryRun: true, maxPerRun: 50,
  });
});

test('uploaded mode: expired at N days, not before', () => {
  assert.strictEqual(R.isExpired({ attachment: att({ uploadedAtOstrio: daysAgo(730) }), card: {}, board, days: 730, now: NOW }), true);
  assert.strictEqual(R.isExpired({ attachment: att({ uploadedAtOstrio: daysAgo(729) }), card: {}, board, days: 730, now: NOW }), false);
});

test('a migrated attachment uses its original upload date', () => {
  const a = att({ uploadedAtOstrio: undefined, uploadedAt: daysAgo(900) });
  assert.strictEqual(R.isExpired({ attachment: a, card: {}, board, days: 730, now: NOW }), true);
});

test('unknown upload date, board-level attachments and templates are never expired', () => {
  const noDate = att({ uploadedAtOstrio: undefined });
  assert.strictEqual(R.isExpired({ attachment: noDate, card: {}, board, days: 1, now: NOW }), false);
  const background = att({ meta: { boardId: 'b1' } });
  assert.strictEqual(R.isExpired({ attachment: background, card: null, board, days: 1, now: NOW }), false);
  for (const type of ['template-board', 'template-container']) {
    assert.strictEqual(R.isExpired({ attachment: att(), card: {}, board: { ...board, type }, days: 1, now: NOW }), false);
  }
  assert.strictEqual(R.isExpired({ attachment: att(), card: { type: 'template-card' }, board, days: 1, now: NOW }), false);
});

test('already deleted attachments are not deleted again; off means nothing', () => {
  assert.strictEqual(R.isExpired({ attachment: att({ deletedAt: daysAgo(1) }), card: {}, board, days: 1, now: NOW }), false);
  assert.strictEqual(R.isExpired({ attachment: att(), card: {}, board, days: 0, now: NOW }), false);
});

test('card-inactive mode: an old attachment on a card in use is kept', () => {
  const opts = { attachment: att(), board, days: 730, mode: 'card-inactive', now: NOW };
  assert.strictEqual(R.isExpired({ ...opts, card: { dateLastActivity: daysAgo(3) } }), false);
  assert.strictEqual(R.isExpired({ ...opts, card: { dateLastActivity: daysAgo(731) } }), true);
  // Unknown card activity is not a reason to delete; a card that is gone is.
  assert.strictEqual(R.isExpired({ ...opts, card: {} }), false);
  assert.strictEqual(R.isExpired({ ...opts, card: null }), true);
  // The upload must be old too, whatever the card does.
  assert.strictEqual(R.isExpired({ ...opts, attachment: att({ uploadedAtOstrio: daysAgo(10) }), card: { dateLastActivity: daysAgo(900) } }), false);
});

test('expired selector: live card attachments uploaded before the cutoff', () => {
  const sel = R.expiredCandidateSelector(730, NOW);
  assert.strictEqual(sel.deletedAt, null);
  assert.deepStrictEqual(sel['meta.cardId'], { $exists: true, $nin: [null, ''] });
  assert.deepStrictEqual(sel.$or[0].uploadedAtOstrio.$lte, daysAgo(730));
  assert.deepStrictEqual(sel.$or[1], { uploadedAtOstrio: { $exists: false }, uploadedAt: { $lte: daysAgo(730) } });
});

test('purge: only attachments soft-deleted at least N days ago', () => {
  assert.deepStrictEqual(R.purgeCandidateSelector(30, NOW), { deletedAt: { $lte: daysAgo(30) } });
  assert.strictEqual(R.isPurgeable({ attachment: att({ deletedAt: daysAgo(31) }), days: 30, now: NOW }), true);
  assert.strictEqual(R.isPurgeable({ attachment: att({ deletedAt: daysAgo(29) }), days: 30, now: NOW }), false);
  assert.strictEqual(R.isPurgeable({ attachment: att(), days: 30, now: NOW }), false, 'a live attachment is never purged');
  assert.strictEqual(R.isPurgeable({ attachment: att({ deletedAt: daysAgo(99) }), days: 0, now: NOW }), false);
});

test('the soft delete is recorded as the board creator, else the uploader', () => {
  assert.strictEqual(R.retentionActorId({ attachment: att({ userId: 'up' }), board }), 'creator');
  assert.strictEqual(R.retentionActorId({ attachment: att({ userId: 'up' }), board: null }), 'up');
});

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('the job soft-deletes through the card Delete and purges with a re-checked selector', () => {
  const job = read('server/attachmentRetention.js');
  assert.match(job, /import \{ softDeleteAttachment \} from '\/server\/attachmentSoftDelete'/);
  assert.match(job, /await softDeleteAttachment\(\{ userId: retentionActorId\(\{ attachment, board \}\), attachment \}\)/);
  assert.match(job, /Attachments\.removeAsync\(\{ _id: attachment\._id, deletedAt: selector\.deletedAt \}\)/);
  // Dry run returns before every write.
  const dryRunGuards = job.match(/if \(dryRun\) \{[\s\S]*?continue;\s*\}/g) || [];
  assert.strictEqual(dryRunGuards.length, 2);
  assert.match(read('server/imports.js'), /import '\/server\/attachmentRetention';/);
});

test('every docker-compose file, start script and the snap config document the settings', () => {
  // The same compose files that list the other nightly account/data settings.
  const files = fs.readdirSync(path.join(__dirname, '..'))
    .filter(f => /^docker-compose.*\.yml$/.test(f) && read(f).includes('USERS_DISABLE_INACTIVE_AFTER_DAYS'));
  assert.ok(files.length > 0);
  for (const f of [...files, 'start-wekan.sh', 'start-wekan.bat', 'snap-src/bin/config']) {
    const src = read(f);
    for (const name of ['ATTACHMENTS_RETENTION_DAYS', 'ATTACHMENTS_RETENTION_MODE',
      'ATTACHMENTS_PURGE_DELETED_AFTER_DAYS', 'ATTACHMENTS_RETENTION_DRY_RUN', 'ATTACHMENTS_RETENTION_MAX_PER_RUN']) {
      assert.ok(src.includes(name), `${f} lacks ${name}`);
    }
  }
});

// Admin Panel / Attachments / Retention overrides each environment variable,
// through the same catalog, form and run-time resolver as the login settings.
test('every retention setting is in Admin Panel / Attachments / Retention', () => {
  const { AUTH_CONFIG_SECTIONS } = require('../models/lib/authConfigCatalog.js');
  const section = AUTH_CONFIG_SECTIONS.attachmentRetention;
  assert.ok(section, 'a catalog section');
  assert.deepStrictEqual(section.fields.map(f => f.envVar).sort(), [
    'ATTACHMENTS_PURGE_DELETED_AFTER_DAYS', 'ATTACHMENTS_RETENTION_DAYS', 'ATTACHMENTS_RETENTION_DRY_RUN',
    'ATTACHMENTS_RETENTION_MAX_PER_RUN', 'ATTACHMENTS_RETENTION_MODE']);
  assert.deepStrictEqual(section.fields.find(f => f.envVar === 'ATTACHMENTS_RETENTION_MODE').choices, ['uploaded', 'card-inactive']);
  assert.ok(section.fields.every(f => !f.restart), 'every change applies at the next run');
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const job = read('server/attachmentRetention.js');
  assert.match(job, /const currentSettings = \(\) => retentionSettings\(authEnv\);/);
  assert.match(job, /await authConfigReady;\n\s+return runAttachmentRetention\(currentSettings\(\), new Date\(\)\);/);
  // negative: the job never reads the environment around the Admin Panel
  assert.doesNotMatch(job, /process\.env\.ATTACHMENTS_/);
  assert.doesNotMatch(job, /retentionSettings\(\)/);
  const menu = read('client/components/settings/attachments.js');
  assert.match(menu, /\{ id: 'retention', icon: 'fa-calendar-times-o', labelKey: 'attachment-retention'/);
  assert.match(menu, /section: 'attachmentRetention',/);
  assert.match(read('client/components/settings/attachments.jade'), /else if isRetentionActive\n\s+\+authProviderSettings\(retentionSettingsData\)/);
  assert.match(read('models/settings.js'), /attachmentRetention: \{ type: Object, optional: true, blackbox: true \}/);
});

console.log(`\n${passed} tests passed`);
