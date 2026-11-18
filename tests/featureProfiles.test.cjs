'use strict';
// #6837 (decided 2026-11-18): feature profiles, opt-in. A user with no profile
// sees everything; a profile hides only catalog features, for the users, teams
// and organizations it is assigned to, and the user is told so.
// Run: node --test tests/featureProfiles.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../models/lib/featureProfiles');
const { FEATURE_KEYS, isFeatureAvailable, isBoardViewAvailable } = require('../models/lib/instanceFeatures');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let n = 0;
const newId = () => `p${++n}`;
const setting = { featureProfiles: [
  { _id: 'starter', name: 'Starter', hidden: ['views-gantt', 'views-scrum'], teamIds: ['t1'], orgIds: [] },
  { _id: 'office', name: 'Office', hidden: ['views-map'], teamIds: ['t1'], orgIds: ['o1'] },
] };

test('which profile applies: the user\'s own, else a team\'s, else an organization\'s', () => {
  assert.strictEqual(P.profileForUser(setting, { featureProfileId: 'office', teams: [{ teamId: 't1' }] })._id, 'office');
  assert.strictEqual(P.profileForUser(setting, { teams: [{ teamId: 't1' }], orgs: [{ orgId: 'o1' }] })._id, 'starter');
  assert.strictEqual(P.profileForUser(setting, { orgs: [{ orgId: 'o1' }] })._id, 'office');
  // An assignment to a profile that was removed falls back to the groups.
  assert.strictEqual(P.profileForUser(setting, { featureProfileId: 'gone', orgs: [{ orgId: 'o1' }] })._id, 'office');
});

test('a profile hides its features from its users, through the one availability decision', () => {
  const user = { featureProfileId: 'starter' };
  assert.strictEqual(isFeatureAvailable(setting, user, 'views-gantt'), false);
  assert.strictEqual(isBoardViewAvailable(setting, user, 'board-view-gantt'), false);
  assert.strictEqual(isFeatureAvailable(setting, user, 'views-map'), true);
  // On purpose: it applies to a pilot user too.
  assert.strictEqual(isFeatureAvailable(setting, { ...user, featurePreview: true }, 'views-gantt'), false);
  assert.deepStrictEqual(P.featureProfileNotice(setting, user), { name: 'Starter', hiddenCount: 2 });
});

test('negative: nobody without a profile is affected, and nothing is said to them', () => {
  for (const user of [{}, { teams: [{ teamId: 'other' }] }, { featureProfileId: 'gone' }, null]) {
    for (const key of FEATURE_KEYS) assert.strictEqual(isFeatureAvailable(setting, user, key), true, key);
    assert.strictEqual(P.featureProfileNotice(setting, user), null);
  }
  for (const empty of [{}, { featureProfiles: 'x' }, null]) {
    assert.strictEqual(P.profileForUser(empty, { featureProfileId: 'starter' }), null);
  }
  // A profile that hides nothing is not announced.
  assert.strictEqual(P.featureProfileNotice({ featureProfiles: [{ _id: 'x', name: 'X', hidden: [] }] }, { featureProfileId: 'x' }), null);
});

test('saving cleans the profiles: catalog features only, unique names, ids kept or made', () => {
  const { profiles } = P.cleanProfiles([
    { _id: 'starter', name: '  Starter ', hidden: ['views-scrum', 'views-gantt', 'views-gantt'], teamIds: ['t1', 't1', 'bad id!'] },
    { name: 'Office', hidden: [] },
  ], FEATURE_KEYS, newId);
  assert.deepStrictEqual(profiles[0], { _id: 'starter', name: 'Starter', hidden: ['views-gantt', 'views-scrum'], teamIds: ['t1'], orgIds: [] });
  assert.match(profiles[1]._id, /^p\d+$/);
  assert.deepStrictEqual(P.cleanProfiles([{ name: 'A', hidden: ['admin-panel'] }], FEATURE_KEYS, newId),
    { error: 'unknown-feature', keys: ['admin-panel'] });
  assert.strictEqual(P.cleanProfiles([{ name: 'A', hidden: [] }, { name: 'a', hidden: [] }], FEATURE_KEYS, newId).error, 'profile-name-taken');
  assert.strictEqual(P.cleanProfiles([{ name: ' ', hidden: [] }], FEATURE_KEYS, newId).error, 'profile-name-required');
  assert.strictEqual(P.cleanProfiles('x', FEATURE_KEYS, newId).error, 'invalid');
  assert.strictEqual(P.cleanProfiles(Array.from({ length: P.MAX_PROFILES + 1 }, (_, i) => ({ name: `n${i}`, hidden: [] })),
    FEATURE_KEYS, newId).error, 'too-many-profiles');
  assert.deepStrictEqual(P.parseNames('Sales Team\nSupport, Sales Team;;'), ['Sales Team', 'Support']);
});

test('only a site admin saves profiles, and a user cannot change their own', () => {
  const methods = read('server/methods/instanceFeatures.js');
  for (const name of ['getFeatureProfiles', 'saveFeatureProfiles']) {
    const body = methods.slice(methods.indexOf(`async ${name}(`), methods.indexOf('\n  },', methods.indexOf(`async ${name}(`)));
    assert.match(body, /^\s*async \w+\([^)]*\) \{\s*await requireSiteAdmin\(\);/, name);
  }
  // The client may write only username and profile.*: featureProfileId is neither.
  assert.match(read('server/permissions/users.js'), /isUserUpdateAllowed\(fields\)/);
  assert.match(read('server/publications/users.js'), /featureProfileId: 1,/);
  assert.match(read('server/publications/settings.js'), /featureProfiles: 1,/);
});

test('the page edits the profiles and the member menu tells the user', () => {
  const page = read('client/components/settings/settingBody.jade');
  for (const cls of ['js-feature-profile-name', 'js-feature-profile-hide', 'js-feature-profile-users',
    'js-feature-profile-teams', 'js-feature-profile-orgs', 'js-feature-profile-add', 'js-feature-profiles-save']) {
    assert.ok(page.includes(cls), cls);
  }
  assert.match(read('client/components/users/userHeader.jade'), /with featureProfileNotice\n\s+p\.feature-profile-notice/);
  assert.match(read('client/lib/instanceFeatures.js'), /'featureProfileId', 'teams', 'orgs'/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.match(en['feature-profile-notice'], /__name__[\s\S]*__count__/);
});
