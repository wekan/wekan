import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Team from '/models/team';
import { ensureIndex } from '/server/lib/mongoStartup';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';

// #5850: reliable admin check from a method's this.userId (Meteor.user() can
// return null inside an async method after an await).
async function callerIsAdmin(userId) {
  if (!userId) return false;
  const u = await ReactiveCache.getUser({ _id: userId }, { fields: { isAdmin: 1 } });
  return !!(u && u.isAdmin);
}

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
    check(team, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Team.updateAsync(team, { $set: { teamSharedTemplates: value } });
    }
  },

  async setTeamPropagateMembersToBoards(team, value) {
    check(team, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Team.updateAsync(team, { $set: { teamPropagateMembersToBoards: value } });
    }
  },

  async setTeamSyncMembersFromAuth(team, value) {
    check(team, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Team.updateAsync(team, { $set: { teamSyncMembersFromAuth: value } });
    }
  },

  // Bulk select-all / unselect-all for one of the team feature columns.
  async setAllTeamsFeature(field, value) {
    check(field, String);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
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

// #4737/#5850: per-team feature toggles exposed over the GlobalAdmin REST API.
const TEAM_FEATURE_FIELDS = [
  'teamSharedTemplates',
  'teamPropagateMembersToBoards',
  'teamSyncMembersFromAuth',
];

/**
 * @operation get_admin_teams
 * @tag Teams
 *
 * @summary List teams with their feature toggles (GlobalAdmin)
 *
 * @description Only the global admin can call this. Returns every team with
 * its identifying fields and the per-team feature toggles shown as columns in
 * Admin Panel > People > Teams.
 *
 * @return_type [{_id: string, teamDisplayName: string, teamShortName: string, teamSharedTemplates: boolean, teamPropagateMembersToBoards: boolean, teamSyncMembersFromAuth: boolean}]
 */
WebApp.handlers.get('/api/admin/teams', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const teams = await Team.find(
      {},
      {
        fields: {
          teamDisplayName: 1,
          teamShortName: 1,
          teamSharedTemplates: 1,
          teamPropagateMembersToBoards: 1,
          teamSyncMembersFromAuth: 1,
        },
      },
    ).fetchAsync();
    const data = teams.map(team => ({
      _id: team._id,
      teamDisplayName: team.teamDisplayName,
      teamShortName: team.teamShortName,
      teamSharedTemplates: !!team.teamSharedTemplates,
      teamPropagateMembersToBoards: !!team.teamPropagateMembersToBoards,
      teamSyncMembersFromAuth: !!team.teamSyncMembersFromAuth,
    }));
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_admin_team_features
 * @tag Teams
 *
 * @summary Set feature toggles on one team (GlobalAdmin)
 *
 * @description Only the global admin can call this. The request body may
 * contain any of `teamSharedTemplates`, `teamPropagateMembersToBoards` and
 * `teamSyncMembersFromAuth` (booleans); only those whitelisted fields are
 * `$set` on the team. Returns the updated team.
 *
 * @param {string} teamId the ID of the team
 * @param {Object} features the feature toggles to set
 * @return_type Object
 */
WebApp.handlers.put('/api/admin/teams/:teamId/features', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const teamId = req.params.teamId;
    const body = req.body || {};
    const $set = {};
    TEAM_FEATURE_FIELDS.forEach(field => {
      if (body[field] !== undefined) {
        $set[field] = !!body[field];
      }
    });
    if (Object.keys($set).length > 0) {
      await Team.updateAsync(teamId, { $set });
    }
    const updated = await Team.findOneAsync(teamId);
    sendJsonResult(res, { code: 200, data: updated });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_all_admin_team_features
 * @tag Teams
 *
 * @summary Set one feature toggle on all teams (GlobalAdmin)
 *
 * @description Only the global admin can call this. The request body is
 * `{ field, value }` where `field` is one of `teamSharedTemplates`,
 * `teamPropagateMembersToBoards` or `teamSyncMembersFromAuth` and `value` is a
 * boolean. The field is `$set` on ALL teams. Returns the number of teams
 * updated.
 *
 * @param {string} field the feature field to set
 * @param {boolean} value the value to set
 * @return_type {updated: number}
 */
WebApp.handlers.put('/api/admin/teams/features', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const body = req.body || {};
    const field = body.field;
    if (!TEAM_FEATURE_FIELDS.includes(field)) {
      sendJsonResult(res, { code: 200, data: { error: 'invalid-field' } });
      return;
    }
    const value = !!body.value;
    const updated = await Team.updateAsync(
      {},
      { $set: { [field]: value } },
      { multi: true },
    );
    sendJsonResult(res, { code: 200, data: { updated } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
