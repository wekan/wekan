import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/kadira:flow-router';
import '/models/boards';
import '/models/users';

export const Teams = new Mongo.Collection('teams');

const schema = {
  name: {
    type: String,
  },
  members: {
    type: [String],
  },
};

Teams.attachSchema(schema);

Teams.exists = existsTeam;

const searchInFields = ['name'];
Teams.initEasySearch(searchInFields, {
  use: 'mongo-db',
  returnFields: [...searchInFields],
});

Teams.helpers({
  memberUsers,
  boards,
  getName,
  hasMember,
});

Teams.mutations({
  addMember,
  removeMember,
  setName: setTeamname,
});

if (Meteor.isServer) {
  Teams.helpers({
    allowInvite,
    allowDelete,
  });

  Teams.allow({
    insert: Meteor.userId,
    update: allowIsTeamMember,
    remove: allowIsTeamMember,
    fetch: ['members'],
  });

  Teams.deny({
    insert(userId, doc) {
      if (!doc.members || doc.members.length === 0) {
        return false;
      }
      return isTeamnameInUse(doc.name);
    },
    fetch: [],
  });

  Meteor.methods({
    inviteTeamToBoard,
    inviteUserToTeam,
    removeUserFromTeam,
    deleteTeam,
  });
}

function allowIsTeamMember(userId, doc) {
  return _.contains(doc.members, userId);
}

function memberUsers() {
  return Users.find({ _id: { $in: this.members } });
}

function boards() {
  return Boards.find({
    members: {
      $elemMatch: {
        userId: this._id,
        isTeam: true,
      },
    },
  });
}

function getName() {
  return this.name;
}
function hasMember(userId) {
  return _.contains(this.members, userId);
}

function addMember(memberId) {
  if (!Teams.exists(memberId)) {
    return {
      $addToSet: {
        members: memberId,
      },
    };
  }
  return false;
}

function removeMember(memberId) {
  const allowRemove = _.contains(this.members, memberId) && this.members.length > 1;
  if (allowRemove) {
    return {
      $pull: {
        members: memberId,
      },
    };
  }

  return null;
}

function existsTeam(teamId) {
  return Teams.find({ _id: teamId }, { limit: 1 }).count() !== 0;
}

function isTeamnameInUse(teamname) {
  return (Teams.find({ name: teamname }, { limit: 1 })).count() !== 0;
}

function setTeamname(teamname) {
  if (!isTeamnameInUse(teamname)) {
    return { $set: { name: teamname } };
  }
  return null;
}

Teams.prepareInviteToToTeamEmail = function (user, inviter, team) {
  function getName(user) {
    return user.getName() || user.username;
  }

  return {
    username: getName(user),
    inviter: getName(inviter),
    language: user.getLanguage(),
    team: team.name,
    url: FlowRouter.url('/'),         // Wekan Startpage
  };
};

function inviteUserToTeam(idNameEmail, teamId) {
  check(idNameEmail, String);
  check(teamId, String);

  const inviter = Meteor.user();
  const team = Teams.findOne(teamId);

  if (!team || !team.allowInvite(inviter)) {
    throw new Meteor.Error('error-team-notAAdmin');
  }

  this.unblock();

  let user = Users.findForInvite(idNameEmail);
  if (user) {
    if (user._id === inviter._id) {
      throw new Meteor.Error('error-user-notAllowSelf');
    }
    if (user.services && user.services.status === 'deactivated') {
      throw new Meteor.Error('error-user-deactivated');
    }
  } else {
    user = Users.inviteNewUser(idNameEmail, inviter.profile && inviter.profile.language);
  }

  team.addMember(user._id);
  user.addInviteToTeam(team._id);

  // Info E-Mail an Benutzer senden
  try {
    const params = Teams.prepareInviteToToTeamEmail(user, inviter, team);
    Email.send({
      from: Accounts.emailTemplates.from,
      to: user.emails[0].address,
      subject: TAPi18n.__('email-invite-to-team-subject', params, params.language),
      text: TAPi18n.__('email-invite-to-team-text', params, params.language),
    });

  } catch (e) {
    throw new Meteor.Error('email-fail', e.message);
  }

  return {
    username: user.username,
    email: user.emails[0].address,
  };
}

function allowInvite(inviter) {
  return this.hasMember(inviter._id);
}

function removeUserFromTeam(userId, teamId) {
  check(userId, String);
  check(teamId, String);

  const user = Users.findOne(userId);
  const team = Teams.findOne(teamId);
  team.removeMember(userId);
  user.removeInviteToTeam(teamId);
}

function inviteTeamToBoard(teamId, boardId) {
  check(teamId, String);
  check(boardId, String);

  const board = Boards.findOne(boardId);

  board.addTeam(teamId);

  //TODO send Emails
}

function deleteTeam(teamId) {
  check(teamId, String);

  const team = Teams.findOne(teamId);

  if (!team || !team.allowDelete(Meteor.userId())) {
    throw new Meteor.Error('error-team-notAAdmin');
  }

  team.boards().forEach(function (board) {
    // Remove team from board
    board.removeMember(team._id);

    // Remove user from board and trigger Update-Hook
    team.memberUsers().forEach(function (user) {
      board.removeMember(user._id);
    });
  });

  // Delete pending group invitations
  team.memberUsers().forEach(function (user) {
    user.removeInviteToTeam(teamId);
  });

  Teams.remove(teamId);

  return { teamId };
}

function allowDelete(userId) {
  return this.hasMember(userId);
}
