import {Teams} from '/imports/model/teams';
import '/models/users';

const schema = {
  'profile.invitedTeams': {
    type: [String],
    optional: true,
  },
};

Users.attachSchema(schema);

Users.helpers({
  teams() {
    return Teams.find({members: this._id}, {sort: {name: 1}});
  },
  invitedTeams() {
    const {invitedTeams = []} = this.profile;
    return Teams.find({_id: {$in: invitedTeams}});
  },
  hasInvitedTeams() {
    const {invitedTeams = []} = this.profile;
    return invitedTeams.length !== 0;
  },
});

Users.mutations({
  addInviteToTeam(teamId) {
    return {
      $addToSet: {
        'profile.invitedTeams': teamId,
      },
    };
  },

  removeInviteToTeam(teamId) {
    return {
      $pull: {
        'profile.invitedTeams': teamId,
      },
    };
  },
});
