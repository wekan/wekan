import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { deleteTeamForAdmin, setBoardMembersSameTeamForAdmin } from '/server/lib/adminTeams';

Meteor.methods({
  async setBoardMembersSameTeam(value) {
    check(value, Boolean);
    return setBoardMembersSameTeamForAdmin(this.userId, value);
  },
  async deleteTeam(teamId) {
    check(teamId, String);
    return deleteTeamForAdmin(this.userId, teamId);
  },
});
