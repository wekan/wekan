import { Meteor } from 'meteor/meteor';
import { Teams } from './teams';
import '/models/users';

Meteor.publish('teams', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Teams.find({
    members: this.userId,
  }, {
    fields: {
      _id: 1,
      name: 1,
      members: 1,
    },
  });
});

Meteor.publish('team-members', function (memberIds) {
  check(memberIds, [String]);

  return Users.find({
    _id: { $in: memberIds },
  }, {
    fields: {
      _id: 1,
      username: 1,
    },
  });
});

Meteor.publish('board-team-members', function (boardId) {
  check(boardId, String);
  const board = Boards.findOne(boardId);
  const teams = _.filter(board.members, (member) => member.isTeam && member.isActive).map((team) => team.userId);
  const teamMembers = _.flatten(Teams.find({
    _id: { $in: teams },
  }, {
    fields: {
      members: 1,
    },
  }).fetch().map((team) => team.members));

  return Users.find({
    _id: { $in: teamMembers },
  }, {
    fields: {
      'username': 1,
      'profile.fullname': 1,
      'profile.avatarUrl': 1,
    },
  });
});

Meteor.publish('allteams', function () {
  return Teams.find({});
});
