import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Team from '/models/team';

// #4737: server-side helper that syncs a user's LDAP groups into Wekan
// Organizations or Teams. It is called only server-to-server from the
// wekan-ldap package via Meteor.callAsync (where `this.connection` is null);
// any client-originated call is rejected. It finds the Org/Team by display
// name, creates it (active) if missing, and adds it to the user's membership.
// The update is add-only: existing memberships — including ones assigned
// manually or from another source — are preserved, so enabling LDAP org/team
// sync never removes a user's other memberships.
Meteor.methods({
  async setUserOrgsTeamsFromLdap(userId, groupNames, asOrganization) {
    // Reject calls that originate from a client connection; only the
    // server-side LDAP sync (connection === null) may use this method.
    if (this.connection !== null) {
      throw new Meteor.Error('forbidden', 'Server-only method');
    }
    check(userId, String);
    check(groupNames, [String]);
    check(asOrganization, Boolean);

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
          });
          org = { _id: orgId };
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
          });
          team = { _id: teamId };
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
