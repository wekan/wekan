Team = new Mongo.Collection('team');

/**
 * A Team in Wekan. Organization in Trello.
 */
Team.attachSchema(
  new SimpleSchema({
    teamDisplayName: {
      /**
       * the name to display for the team
       */
      type: String,
      optional: true,
    },
    teamDesc: {
      /**
       * the description the team
       */
      type: String,
      optional: true,
      max: 190,
    },
    teamShortName: {
      /**
       * short name of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    teamWebsite: {
      /**
       * website of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    teamIsActive: {
      /**
       * status of the team
       */
      type: Boolean,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the team
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

if (Meteor.isServer) {
  Team.allow({
    insert(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    update(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    remove(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    fetch: [],
  });

  Meteor.methods({
    setCreateTeam(
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    ) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(teamDisplayName, String);
        check(teamDesc, String);
        check(teamShortName, String);
        check(teamWebsite, String);
        check(teamIsActive, Boolean);

        const nTeamNames = Team.find({ teamShortName }).count();
        if (nTeamNames > 0) {
          throw new Meteor.Error('teamname-already-taken');
        } else {
          Team.insert({
            teamDisplayName,
            teamDesc,
            teamShortName,
            teamWebsite,
            teamIsActive,
          });
        }
      }
    },

    setTeamDisplayName(team, teamDisplayName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(team, Object);
        check(teamDisplayName, String);
        Team.update(team, {
          $set: { teamDisplayName: teamDisplayName },
        });
      }
    },

    setTeamDesc(team, teamDesc) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(team, Object);
        check(teamDesc, String);
        Team.update(team, {
          $set: { teamDesc: teamDesc },
        });
      }
    },

    setTeamShortName(team, teamShortName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(team, Object);
        check(teamShortName, String);
        Team.update(team, {
          $set: { teamShortName: teamShortName },
        });
      }
    },

    setTeamIsActive(team, teamIsActive) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(team, Object);
        check(teamIsActive, Boolean);
        Team.update(team, {
          $set: { teamIsActive: teamIsActive },
        });
      }
    },

    setTeamAllFields(
      team,
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    ) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(team, Object);
        check(teamDisplayName, String);
        check(teamDesc, String);
        check(teamShortName, String);
        check(teamWebsite, String);
        check(teamIsActive, Boolean);
        Team.update(team, {
          $set: {
            teamDisplayName: teamDisplayName,
            teamDesc: teamDesc,
            teamShortName: teamShortName,
            teamWebsite: teamWebsite,
            teamIsActive: teamIsActive,
          },
        });
      }
    },
  });
}

if (Meteor.isServer) {
  // Index for Team name.
  Meteor.startup(() => {
    Team._collection._ensureIndex({ teamDisplayName: -1 });
  });
}

export default Team;
