'use strict';

/**
 * Spec 30 — #4737 setUserOrgsTeamsFromLdap
 *
 * The LDAP package can't run in these tests, but the app-side method that does
 * the actual create-and-assign is callable by an admin (and server-to-server by
 * the LDAP sync). This exercises that method directly:
 *  - a group name is created as a Team / Organization (active) if missing,
 *  - it is added to the target user's membership,
 *  - the assignment is add-only (existing memberships are preserved),
 *  - it is idempotent (no duplicate org/team or membership on repeat),
 *  - a non-admin client call is rejected.
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

test.describe('#4737 sync LDAP groups as Organizations/Teams', () => {
  test('admin syncs a group as a Team: created, assigned, add-only, idempotent', async ({ page, adminUser, user }) => {
    const teamName = db.uid('LdapTeam');
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);

      // Pre-seed a manual team membership to prove the sync is add-only.
      db.updateOne('users', { _id: user.id }, {
        $set: { teams: [{ teamId: 'manual-team-id', teamDisplayName: 'Manual Team' }] },
      });

      const r1 = await callMethod(page, 'setUserOrgsTeamsFromLdap', user.id, [teamName], false);
      expect(r1.error).toBeUndefined();

      // The Team was created, active.
      const teams = db.find('team', { teamDisplayName: teamName });
      expect(teams.length).toBe(1);
      expect(teams[0].teamIsActive).toBe(true);
      const teamId = teams[0]._id;

      // The user got the new team AND kept the manual one (add-only).
      let u = db.findOne('users', { _id: user.id });
      expect(u.teams.some(t => t.teamId === teamId)).toBe(true);
      expect(u.teams.some(t => t.teamId === 'manual-team-id')).toBe(true);

      // Idempotent: a second call creates no duplicate team or membership.
      const r2 = await callMethod(page, 'setUserOrgsTeamsFromLdap', user.id, [teamName], false);
      expect(r2.error).toBeUndefined();
      expect(db.find('team', { teamDisplayName: teamName }).length).toBe(1);
      u = db.findOne('users', { _id: user.id });
      expect(u.teams.filter(t => t.teamId === teamId).length).toBe(1);
    } finally {
      db.deleteMany('team', { teamDisplayName: teamName });
    }
  });

  test('admin syncs a group as an Organization', async ({ page, adminUser, user }) => {
    const orgName = db.uid('LdapOrg');
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);

      const r = await callMethod(page, 'setUserOrgsTeamsFromLdap', user.id, [orgName], true);
      expect(r.error).toBeUndefined();

      const orgs = db.find('org', { orgDisplayName: orgName });
      expect(orgs.length).toBe(1);
      expect(orgs[0].orgIsActive).toBe(true);

      const u = db.findOne('users', { _id: user.id });
      expect(u.orgs.some(o => o.orgId === orgs[0]._id)).toBe(true);
    } finally {
      db.deleteMany('org', { orgDisplayName: orgName });
    }
  });

  test('non-admin client call is rejected and creates nothing', async ({ loggedInPage, user }) => {
    const teamName = db.uid('LdapTeamForbidden');
    const r = await callMethod(loggedInPage, 'setUserOrgsTeamsFromLdap', user.id, [teamName], false);
    expect(r.error).toBeTruthy();
    expect(db.find('team', { teamDisplayName: teamName }).length).toBe(0);
  });
});
