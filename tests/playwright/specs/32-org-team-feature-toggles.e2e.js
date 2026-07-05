'use strict';

/**
 * Spec 32 — #4737/#5850 per-organization / per-team feature toggle methods
 *
 * Admin Panel > People > Organizations / Teams exposes three boolean feature
 * columns per record (SharedTemplates, PropagateMembersToBoards,
 * SyncMembersFromAuth) plus a select-all / unselect-all bulk action per column.
 * This exercises the server methods that back those toggles directly:
 *  - each per-org / per-team setter flips its own field (admin only),
 *  - the bulk setAllOrgsFeature / setAllTeamsFeature set the field on ALL records,
 *  - each per-record method takes the org/team as a Mongo SELECTOR ({_id: <id>}),
 *  - a non-admin client call is a silent no-op (NOT an error): the flag is left
 *    unchanged because of the `(await ReactiveCache.getCurrentUser())?.isAdmin`
 *    gate.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

function callMethod(page, name, ...args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        Meteor.call(name, ...args, (err, res) =>
          resolve(err ? { error: err.reason || err.error || err.message } : { result: res ?? null }),
        );
      }),
    { name, args },
  );
}

test.describe('#4737/#5850 per-org/team feature toggle methods', () => {
  // This spec exercises GLOBAL server mutations: setAllOrgsFeature /
  // setAllTeamsFeature run Org/Team.updateAsync({}, ..., { multi: true }), i.e.
  // they write EVERY org/team row. The parallel test run launches Chromium /
  // Firefox / WebKit as separate processes against ONE shared server+DB, so two
  // browsers running these bulk tests concurrently clobber each other's rows
  // (one process sets all-true while another asserts all-false, and vice versa)
  // — a race no amount of unique per-test data can fix. The methods are
  // browser-agnostic, so we run this spec in a single project (Chromium) only;
  // Firefox/WebKit skip it. That removes the cross-process contention while
  // keeping full coverage of the server logic.
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'server-method spec: single browser avoids cross-process global-write races',
    );
  });

  test('admin sets each per-org feature flag', async ({ page, adminUser }) => {
    const orgDisplayName = db.uid('FeatOrg');
    const orgId = db.uid('org');
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);

      db.insertOne('org', { _id: orgId, orgDisplayName, orgShortName: orgDisplayName, orgIsActive: true });
      expect(db.findOne('org', { _id: orgId })).toBeTruthy();

      let r = await callMethod(page, 'setOrgSharedTemplates', { _id: orgId }, true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: orgId }).orgSharedTemplates).toBe(true);

      r = await callMethod(page, 'setOrgPropagateMembersToBoards', { _id: orgId }, true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: orgId }).orgPropagateMembersToBoards).toBe(true);

      r = await callMethod(page, 'setOrgSyncMembersFromAuth', { _id: orgId }, true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: orgId }).orgSyncMembersFromAuth).toBe(true);

      // Set one back to false and assert it cleared.
      r = await callMethod(page, 'setOrgSharedTemplates', { _id: orgId }, false);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: orgId }).orgSharedTemplates).toBe(false);
    } finally {
      db.deleteMany('org', { orgDisplayName });
    }
  });

  test('select-all / unselect-all sets the flag on all orgs', async ({ page, adminUser }) => {
    const orgDisplayNameA = db.uid('FeatOrgAllA');
    const orgDisplayNameB = db.uid('FeatOrgAllB');
    const a = db.uid('orgA');
    const b = db.uid('orgB');
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);

      db.insertOne('org', { _id: a, orgDisplayName: orgDisplayNameA, orgShortName: orgDisplayNameA, orgIsActive: true });
      db.insertOne('org', { _id: b, orgDisplayName: orgDisplayNameB, orgShortName: orgDisplayNameB, orgIsActive: true });

      let r = await callMethod(page, 'setAllOrgsFeature', 'orgSharedTemplates', true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: a }).orgSharedTemplates).toBe(true);
      expect(db.findOne('org', { _id: b }).orgSharedTemplates).toBe(true);

      r = await callMethod(page, 'setAllOrgsFeature', 'orgSharedTemplates', false);
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: a }).orgSharedTemplates).toBe(false);
      expect(db.findOne('org', { _id: b }).orgSharedTemplates).toBe(false);
    } finally {
      db.deleteMany('org', { orgDisplayName: { $in: [orgDisplayNameA, orgDisplayNameB] } });
    }
  });

  test('team per-record toggle works', async ({ page, adminUser }) => {
    const teamDisplayName = db.uid('FeatTeam');
    const teamDisplayName2 = db.uid('FeatTeamAll');
    const teamId = db.uid('team');
    const teamId2 = db.uid('team2');
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);

      db.insertOne('team', { _id: teamId, teamDisplayName, teamShortName: teamDisplayName, teamIsActive: true });
      db.insertOne('team', { _id: teamId2, teamDisplayName: teamDisplayName2, teamShortName: teamDisplayName2, teamIsActive: true });

      let r = await callMethod(page, 'setTeamSyncMembersFromAuth', { _id: teamId }, true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('team', { _id: teamId }).teamSyncMembersFromAuth).toBe(true);

      r = await callMethod(page, 'setAllTeamsFeature', 'teamSharedTemplates', true);
      expect(r.error).toBeUndefined();
      expect(db.findOne('team', { _id: teamId }).teamSharedTemplates).toBe(true);
      expect(db.findOne('team', { _id: teamId2 }).teamSharedTemplates).toBe(true);
    } finally {
      db.deleteMany('team', { teamDisplayName: { $in: [teamDisplayName, teamDisplayName2] } });
    }
  });

  test('non-admin call does not change the flag', async ({ page, user }) => {
    const orgDisplayName = db.uid('FeatOrgNonAdmin');
    const orgId = db.uid('org');
    try {
      // We insert the org directly, then log in as the NON-admin `user` to make
      // the method call, which must be a silent no-op.
      db.insertOne('org', { _id: orgId, orgDisplayName, orgShortName: orgDisplayName, orgIsActive: true });

      await loginWithToken(page, user.id, user.token);

      const r = await callMethod(page, 'setOrgSharedTemplates', { _id: orgId }, true);
      // Silent no-op: not an error, but the flag must remain unchanged (falsy).
      expect(r.error).toBeUndefined();
      expect(db.findOne('org', { _id: orgId }).orgSharedTemplates).toBeFalsy();
    } finally {
      db.deleteMany('org', { orgDisplayName });
    }
  });
});
