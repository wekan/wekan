import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Team from '/models/team';

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

  async setTeamAllFieldsFromOidc(
    team,
    teamDisplayName,
    teamDesc,
    teamShortName,
    teamWebsite,
    teamIsActive,
  ) {
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
    if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    check(query, Match.OneOf(Object, null, undefined));
    const cursor = await ReactiveCache.getTeams(query || {}, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await Team._collection.createIndexAsync({ teamDisplayName: 1 });
});
