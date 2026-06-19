import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Team from '/models/team';

// #4737: helper that syncs a user's LDAP groups into Wekan Organizations or
// Teams. It is called server-to-server from the wekan-ldap package via
// Meteor.callAsync (where `this.connection` is null), and may also be called by
// an admin (admins already manage orgs/teams in the Admin Panel). Any other
// client-originated call is rejected. It finds the Org/Team by display name,
// creates it (active) if missing, and adds it to the user's membership. The
// update is add-only: existing memberships — including ones assigned manually or
// from another source — are preserved, so enabling LDAP org/team sync never
// removes a user's other memberships.
Meteor.methods({
  async setUserOrgsTeamsFromLdap(userId, groupNames, asOrganization) {
    // Check ALL arguments first, unconditionally: audit-argument-checks throws
    // "Did not check() all arguments" otherwise, and that rejection (when the
    // admin guard below throws first) escapes as an unhandledRejection that
    // SyncedCron's global handler turns into a full app crash.
    check(userId, String);
    check(groupNames, [String]);
    check(asOrganization, Boolean);
    // Allow server-to-server calls (connection === null, used by the LDAP sync)
    // and admins; reject any other client-originated call.
    if (this.connection !== null) {
      const caller = this.userId
        ? await ReactiveCache.getUser({ _id: this.userId }, { fields: { isAdmin: 1 } })
        : null;
      if (!caller || caller.isAdmin !== true) {
        throw new Meteor.Error('forbidden', 'Not authorized');
      }
    }

    const user = await ReactiveCache.getUser(userId);
    if (!user) {
      return;
    }

    // De-duplicate and drop empties so a group is not processed twice.
    const names = [...new Set(groupNames.map(n => (n || '').trim()).filter(Boolean))];

    for (const name of names) {
      if (asOrganization) {
        let org = await Org.findOneAsync({ orgDisplayName: name });
        if (!org) {
          const orgId = await Org.insertAsync({
            orgDisplayName: name,
            orgShortName: name,
            orgIsActive: true,
            // #5850: the auth sync marks the orgs it manages.
            orgSyncMembersFromAuth: true,
          });
          org = { _id: orgId };
        } else if (org.orgSyncMembersFromAuth !== true) {
          await Org.updateAsync({ _id: org._id }, { $set: { orgSyncMembersFromAuth: true } });
        }
        const alreadyMember = (user.orgs || []).some(o => o.orgId === org._id);
        if (!alreadyMember) {
          await Meteor.users.updateAsync(
            { _id: userId },
            { $push: { orgs: { orgId: org._id, orgDisplayName: name } } },
          );
        }
      } else {
        let team = await Team.findOneAsync({ teamDisplayName: name });
        if (!team) {
          const teamId = await Team.insertAsync({
            teamDisplayName: name,
            teamShortName: name,
            teamIsActive: true,
            // #5850: the auth sync marks the teams it manages.
            teamSyncMembersFromAuth: true,
          });
          team = { _id: teamId };
        } else if (team.teamSyncMembersFromAuth !== true) {
          await Team.updateAsync({ _id: team._id }, { $set: { teamSyncMembersFromAuth: true } });
        }
        const alreadyMember = (user.teams || []).some(t => t.teamId === team._id);
        if (!alreadyMember) {
          await Meteor.users.updateAsync(
            { _id: userId },
            { $push: { teams: { teamId: team._id, teamDisplayName: name } } },
          );
        }
      }
    }
  },
});
