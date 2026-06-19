import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Team from '/models/team';
import { ensureIndex } from '/server/lib/mongoStartup';

Meteor.methods({
  async setCreateTeam(
    teamDisplayName,
    teamDesc,
    teamShortName,
    teamWebsite,
    teamIsActive,
  ) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(teamDisplayName, String);
      check(teamDesc, String);
      check(teamShortName, String);
      check(teamWebsite, String);
      check(teamIsActive, Boolean);

      const nTeamNames = (await ReactiveCache.getTeams({ teamShortName })).length;
      if (nTeamNames > 0) {
        throw new Meteor.Error('teamname-already-taken');
      }

      await Team.insertAsync({
        teamDisplayName,
        teamDesc,
        teamShortName,
        teamWebsite,
        teamIsActive,
      });
    }
  },

  async setCreateTeamFromOidc(
    teamDisplayName,
    teamDesc,
    teamShortName,
    teamWebsite,
    teamIsActive,
  ) {
    // SECURITY (GHSA-cv95-8h7c-2ffq): This *FromOidc method is an internal
    // helper invoked only server-side during the OIDC login flow (via
    // Meteor.callAsync from packages/wekan-oidc/loginHandler.js). It performs
    // a privileged team write with no per-user authorization, so it must never
    // be callable directly by a client over DDP — otherwise any authenticated
    // user could create teams, bypassing the admin-only check on
    // setCreateTeam/setTeamAllFields. A server-side method call has
    // this.connection === null; a direct client call has a non-null
    // connection. Reject the latter.
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
    check(teamDisplayName, String);
    check(teamDesc, String);
    check(teamShortName, String);
    check(teamWebsite, String);
    check(teamIsActive, Boolean);

    const nTeamNames = (await ReactiveCache.getTeams({ teamShortName })).length;
    if (nTeamNames > 0) {
      throw new Meteor.Error('teamname-already-taken');
    }

    await Team.insertAsync({
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    });
  },

  async setTeamDisplayName(team, teamDisplayName) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(teamDisplayName, String);
      await Team.updateAsync(team, {
        $set: { teamDisplayName },
      });
      await Meteor.callAsync('setUsersTeamsTeamDisplayName', team._id, teamDisplayName);
    }
  },

  async setTeamDesc(team, teamDesc) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(teamDesc, String);
      await Team.updateAsync(team, {
        $set: { teamDesc },
      });
    }
  },

  async setTeamShortName(team, teamShortName) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(teamShortName, String);
      await Team.updateAsync(team, {
        $set: { teamShortName },
      });
    }
  },

  async setTeamIsActive(team, teamIsActive) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(teamIsActive, Boolean);
      await Team.updateAsync(team, {
        $set: { teamIsActive },
      });
    }
  },

  // #4737/#5850: per-team feature toggles shown as columns in Admin Panel >
  // People > Teams. All default off.
  async setTeamSharedTemplates(team, value) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(value, Boolean);
      await Team.updateAsync(team, { $set: { teamSharedTemplates: value } });
    }
  },

  async setTeamPropagateMembersToBoards(team, value) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(value, Boolean);
      await Team.updateAsync(team, { $set: { teamPropagateMembersToBoards: value } });
    }
  },

  async setTeamSyncMembersFromAuth(team, value) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(value, Boolean);
      await Team.updateAsync(team, { $set: { teamSyncMembersFromAuth: value } });
    }
  },

  // Bulk select-all / unselect-all for one of the team feature columns.
  async setAllTeamsFeature(field, value) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(field, String);
      check(value, Boolean);
      const allowed = [
        'teamSharedTemplates',
        'teamPropagateMembersToBoards',
        'teamSyncMembersFromAuth',
      ];
      if (!allowed.includes(field)) {
        throw new Meteor.Error('invalid-field');
      }
      await Team.updateAsync({}, { $set: { [field]: value } }, { multi: true });
    }
  },

  async setTeamAllFieldsFromOidc(
    team,
    teamDisplayName,
    teamDesc,
    teamShortName,
    teamWebsite,
    teamIsActive,
  ) {
    // SECURITY (GHSA-cv95-8h7c-2ffq): Internal OIDC-login-only helper (called
    // server-side from packages/wekan-oidc/loginHandler.js). Performs a
    // privileged team update of an arbitrary _id with no per-user
    // authorization, so reject direct client/DDP calls (this.connection
    // non-null) to keep the admin-only restriction of setTeamAllFields intact.
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
    check(team, Object);
    check(teamDisplayName, String);
    check(teamDesc, String);
    check(teamShortName, String);
    check(teamWebsite, String);
    check(teamIsActive, Boolean);
    await Team.updateAsync(team, {
      $set: {
        teamDisplayName,
        teamDesc,
        teamShortName,
        teamWebsite,
        teamIsActive,
      },
    });
    await Meteor.callAsync('setUsersTeamsTeamDisplayName', team._id, teamDisplayName);
  },

  async setTeamAllFields(
    team,
    teamDisplayName,
    teamDesc,
    teamShortName,
    teamWebsite,
    teamIsActive,
  ) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(team, Object);
      check(teamDisplayName, String);
      check(teamDesc, String);
      check(teamShortName, String);
      check(teamWebsite, String);
      check(teamIsActive, Boolean);
      await Team.updateAsync(team, {
        $set: {
          teamDisplayName,
          teamDesc,
          teamShortName,
          teamWebsite,
          teamIsActive,
        },
      });
      await Meteor.callAsync('setUsersTeamsTeamDisplayName', team._id, teamDisplayName);
    }
  },

  async getTeamsCollectionCount(query = {}) {
    check(query, Match.OneOf(Object, null, undefined));
    if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await ReactiveCache.getTeams(query || {}, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await ensureIndex(Team, { teamDisplayName: 1 });
});
