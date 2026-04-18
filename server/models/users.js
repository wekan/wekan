import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import { check, Match } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import { CollectionHooks } from 'meteor/matb33:collection-hooks';
import { ReactiveCache } from '/imports/reactiveCache';
import { debounce } from '/imports/lib/collectionHelpers';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import EmailLocalization from '/server/lib/emailLocalization';
import ImpersonatedUsers from '/models/impersonatedUsers';
import Boards from '/models/boards';
import InvitationCodes from '/models/invitationCodes';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Users, { allowedSortValues } from '/models/users';

const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

Meteor.methods({
  async deleteWorkspace(workspaceId) {
    check(workspaceId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');

    const user =
      (await Users.findOneAsync(this.userId, {
        fields: {
          'profile.boardWorkspacesTree': 1,
          'profile.boardWorkspaceAssignments': 1,
        },
      })) || {};

    const tree =
      user.profile && user.profile.boardWorkspacesTree
        ? EJSON.clone(user.profile.boardWorkspacesTree)
        : [];
    const assignments = {
      ...((user.profile && user.profile.boardWorkspaceAssignments) || {}),
    };
    const removedWorkspaceIds = [];

    const collectWorkspaceIds = node => {
      removedWorkspaceIds.push(node.id);
      if (node.children && node.children.length) {
        node.children.forEach(collectWorkspaceIds);
      }
    };

    const removeWorkspaceFromTree = nodes => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === workspaceId) {
          collectWorkspaceIds(nodes[i]);
          nodes.splice(i, 1);
          return true;
        }
        if (nodes[i].children && nodes[i].children.length) {
          if (removeWorkspaceFromTree(nodes[i].children)) {
            return true;
          }
        }
      }
      return false;
    };

    removeWorkspaceFromTree(tree);

    Object.keys(assignments).forEach(boardId => {
      if (removedWorkspaceIds.includes(assignments[boardId])) {
        delete assignments[boardId];
      }
    });

    await Users.updateAsync(this.userId, {
      $set: {
        'profile.boardWorkspacesTree': tree,
        'profile.boardWorkspaceAssignments': assignments,
      },
    });

    return true;
  },

  async removeUser(targetUserId) {
    check(targetUserId, String);

    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }

    const currentUser = await ReactiveCache.getUser(currentUserId);
    if (!currentUser) {
      throw new Meteor.Error('not-authorized', 'Current user not found');
    }

    const targetUser = await ReactiveCache.getUser(targetUserId);
    if (!targetUser) {
      throw new Meteor.Error('user-not-found', 'Target user not found');
    }

    if (currentUserId === targetUserId) {
      await Users.removeAsync(targetUserId);
      return { success: true, message: 'User deleted successfully' };
    }

    if (!currentUser.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only administrators can delete other users');
    }

    const adminsNumber = (await ReactiveCache.getUsers({ isAdmin: true })).length;
    if (adminsNumber === 1 && targetUser.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Cannot delete the last administrator');
    }

    await Users.removeAsync(targetUserId);
    return { success: true, message: 'User deleted successfully' };
  },

  async editUser(targetUserId, updateData) {
    check(targetUserId, String);
    check(updateData, Object);

    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }

    const currentUser = await ReactiveCache.getUser(currentUserId);
    if (!currentUser || !currentUser.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only administrators can edit other users');
    }

    const targetUser = await ReactiveCache.getUser(targetUserId);
    if (!targetUser) {
      throw new Meteor.Error('user-not-found', 'Target user not found');
    }

    const updateObject = {};
    if (updateData.fullname !== undefined) updateObject['profile.fullname'] = updateData.fullname;
    if (updateData.initials !== undefined) updateObject['profile.initials'] = updateData.initials;
    if (updateData.isAdmin !== undefined) updateObject.isAdmin = updateData.isAdmin;
    if (updateData.loginDisabled !== undefined) updateObject.loginDisabled = updateData.loginDisabled;
    if (updateData.authenticationMethod !== undefined) {
      updateObject.authenticationMethod = updateData.authenticationMethod;
    }
    if (updateData.importUsernames !== undefined) updateObject.importUsernames = updateData.importUsernames;
    if (updateData.teams !== undefined) updateObject.teams = updateData.teams;
    if (updateData.orgs !== undefined) updateObject.orgs = updateData.orgs;

    await Users.updateAsync(targetUserId, { $set: updateObject });
  },

  async setListSortBy(value) {
    check(value, String);
    (await ReactiveCache.getCurrentUser()).setListSortBy(value);
  },

  async setAvatarUrl(avatarUrl) {
    check(avatarUrl, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    await Users.updateAsync(this.userId, { $set: { 'profile.avatarUrl': avatarUrl } });
  },

  async adminSetAvatarUrl(targetUserId, avatarUrl) {
    check(targetUserId, String);
    check(avatarUrl, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const currentUser = await Users.findOneAsync(this.userId);
    if (!currentUser || !currentUser.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only admins can change user avatars');
    }
    const targetUser = await Users.findOneAsync(targetUserId);
    if (!targetUser) throw new Meteor.Error('user-not-found', 'Target user not found');
    await Users.updateAsync(targetUserId, { $set: { 'profile.avatarUrl': avatarUrl } });
  },

  async toggleBoardStar(boardId) {
    check(boardId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    const starredBoards = (user.profile && user.profile.starredBoards) || [];
    const isStarred = starredBoards.includes(boardId);
    const updateObject = isStarred
      ? { $pull: { 'profile.starredBoards': boardId } }
      : { $addToSet: { 'profile.starredBoards': boardId } };

    await Users.updateAsync(this.userId, updateObject);
  },

  async toggleGreyIcons(value) {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    if (value !== undefined) check(value, Boolean);

    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    const current = (user.profile && user.profile.GreyIcons) || false;
    const newValue = value !== undefined ? value : !current;

    await Users.updateAsync(this.userId, { $set: { 'profile.GreyIcons': newValue } });
    return newValue;
  },

  async toggleDesktopDragHandles() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleDesktopHandles(user.hasShowDesktopDragHandles());
  },

  async createWorkspace(params) {
    check(params, Object);
    const { parentId = null, name } = params;
    check(parentId, Match.OneOf(String, null));
    check(name, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const user = (await Users.findOneAsync(this.userId)) || {};
    const tree =
      user.profile && user.profile.boardWorkspacesTree
        ? EJSON.clone(user.profile.boardWorkspacesTree)
        : [];

    const newNode = { id: Random.id(), name, children: [] };

    if (!parentId) {
      tree.push(newNode);
    } else {
      const insertInto = nodes => {
        for (const n of nodes) {
          if (n.id === parentId) {
            n.children = n.children || [];
            n.children.push(newNode);
            return true;
          }
          if (n.children && n.children.length && insertInto(n.children)) {
            return true;
          }
        }
        return false;
      };
      insertInto(tree);
    }

    await Users.updateAsync(this.userId, { $set: { 'profile.boardWorkspacesTree': tree } });
    return newNode;
  },

  async setWorkspacesTree(newTree) {
    check(newTree, Array);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    await Users.updateAsync(this.userId, { $set: { 'profile.boardWorkspacesTree': newTree } });
    return true;
  },

  async assignBoardToWorkspace(boardId, spaceId) {
    check(boardId, String);
    check(spaceId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');

    const user = await Users.findOneAsync(this.userId, { fields: { 'profile.boardWorkspaceAssignments': 1 } });
    const assignments = user.profile?.boardWorkspaceAssignments || {};
    assignments[boardId] = spaceId;

    await Users.updateAsync(this.userId, {
      $set: { 'profile.boardWorkspaceAssignments': assignments },
    });
    return true;
  },

  async unassignBoardFromWorkspace(boardId) {
    check(boardId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');

    const user = await Users.findOneAsync(this.userId, { fields: { 'profile.boardWorkspaceAssignments': 1 } });
    const assignments = user.profile?.boardWorkspaceAssignments || {};
    delete assignments[boardId];

    await Users.updateAsync(this.userId, {
      $set: { 'profile.boardWorkspaceAssignments': assignments },
    });
    return true;
  },

  async toggleHideCheckedItems() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleHideCheckedItems();
  },

  async toggleCustomFieldsGrid() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleFieldsGrid(user.hasCustomFieldsGrid());
  },

  async toggleCardMaximized() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleCardMaximized(user.hasCardMaximized());
  },

  async setCardCollapsed(value) {
    check(value, Boolean);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    await Users.updateAsync(this.userId, { $set: { 'profile.cardCollapsed': value } });
  },

  async toggleMinicardLabelText() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleLabelText(user.hasHiddenMinicardLabelText());
  },

  async toggleRescueCardDescription() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleRescueCardDescription(user.hasRescuedCardDescription());
  },

  async changeLimitToShowCardsCount(limit) {
    check(limit, Number);
    (await ReactiveCache.getCurrentUser()).setShowCardsCountAt(limit);
  },

  async changeStartDayOfWeek(startDay) {
    check(startDay, Number);
    (await ReactiveCache.getCurrentUser()).setStartDayOfWeek(startDay);
  },

  async changeDateFormat(dateFormat) {
    check(dateFormat, String);
    (await ReactiveCache.getCurrentUser()).setDateFormat(dateFormat);
  },

  applyListWidth(boardId, listId, width, constraint) {
    check(boardId, String);
    check(listId, String);
    check(width, Number);
    check(constraint, Number);
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }
    try {
      Lists.updateAsync(listId, { $set: { width: width, constraint: constraint } });
      return true;
    } catch (error) {
      console.error('Error updating list width:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async setListCollapsedState(boardId, listId, collapsed) {
    check(boardId, String);
    check(listId, String);
    check(collapsed, Boolean);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');
    const current = (user.profile && user.profile.collapsedLists) || {};
    if (!current[boardId]) current[boardId] = {};
    current[boardId][listId] = !!collapsed;
    await Users.updateAsync(this.userId, { $set: { 'profile.collapsedLists': current } });
  },

  async applySwimlaneHeight(boardId, swimlaneId, height) {
    check(boardId, String);
    check(swimlaneId, String);
    check(height, Number);
    const user = await ReactiveCache.getCurrentUser();
    user.setSwimlaneHeight(boardId, swimlaneId, height);
  },

  async setSwimlaneCollapsedState(boardId, swimlaneId, collapsed) {
    check(boardId, String);
    check(swimlaneId, String);
    check(collapsed, Boolean);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');
    const current = (user.profile && user.profile.collapsedSwimlanes) || {};
    if (!current[boardId]) current[boardId] = {};
    current[boardId][swimlaneId] = !!collapsed;
    await Users.updateAsync(this.userId, { $set: { 'profile.collapsedSwimlanes': current } });
  },

  async applySwimlaneHeightToStorage(boardId, swimlaneId, height) {
    check(boardId, String);
    check(swimlaneId, String);
    check(height, Number);
    const user = await ReactiveCache.getCurrentUser();
    if (user) {
      user.setSwimlaneHeightToStorage(boardId, swimlaneId, height);
    }
  },

  async applyListWidthToStorage(boardId, listId, width, constraint) {
    check(boardId, String);
    check(listId, String);
    check(width, Number);
    check(constraint, Number);
    const user = await ReactiveCache.getCurrentUser();
    if (user) {
      user.setListWidthToStorage(boardId, listId, width);
      user.setListConstraintToStorage(boardId, listId, constraint);
    }
  },

  async setZoomLevel(level) {
    check(level, Number);
    const user = await ReactiveCache.getCurrentUser();
    user.setZoomLevel(level);
  },

  async setMobileMode(enabled) {
    check(enabled, Boolean);
    const user = await ReactiveCache.getCurrentUser();
    user.setMobileMode(enabled);
  },

  async setBoardView(view) {
    check(view, String);
    const user = await ReactiveCache.getCurrentUser();
    if (!user) throw new Meteor.Error('not-authorized', 'Must be logged in');
    user.setBoardView(view);
  },

  async setCreateUser(
    fullname,
    username,
    initials,
    password,
    isAdmin,
    isActive,
    email,
    importUsernames,
    userOrgsArray,
    userTeamsArray,
  ) {
    check(fullname, String);
    check(username, String);
    check(initials, String);
    check(password, String);
    check(isAdmin, String);
    check(isActive, String);
    check(email, String);
    check(importUsernames, Array);
    check(userOrgsArray, Array);
    check(userTeamsArray, Array);
    if (
      fullname.includes('/') ||
      username.includes('/') ||
      email.includes('/') ||
      initials.includes('/')
    ) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      const nUsersWithUsername = (await ReactiveCache.getUsers({ username })).length;
      const nUsersWithEmail = (await ReactiveCache.getUsers({ email })).length;
      if (nUsersWithUsername > 0) {
        throw new Meteor.Error('username-already-taken');
      } else if (nUsersWithEmail > 0) {
        throw new Meteor.Error('email-already-taken');
      } else {
        Accounts.createUser({
          username,
          password,
          isAdmin,
          isActive,
          email: email.toLowerCase(),
          from: 'admin',
        });
        const user =
          (await ReactiveCache.getUser(username)) ||
          (await ReactiveCache.getUser({ username }));
        if (user) {
          await Users.updateAsync(user._id, {
            $set: {
              'profile.fullname': fullname,
              importUsernames,
              'profile.initials': initials,
              orgs: userOrgsArray,
              teams: userTeamsArray,
            },
          });
        }
      }
    }
  },

  async setUsername(username, userId) {
    check(username, String);
    check(userId, String);
    if (username.includes('/') || userId.includes('/')) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      const nUsersWithUsername = (await ReactiveCache.getUsers({ username })).length;
      if (nUsersWithUsername > 0) {
        throw new Meteor.Error('username-already-taken');
      } else {
        await Users.updateAsync(userId, { $set: { username } });
      }
    }
  },

  async setEmail(email, userId) {
    check(email, String);
    check(userId, String);
    if (userId.includes('/') || email.includes('/')) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      if (Array.isArray(email)) {
        email = email.shift();
      }
      const existingUser = await ReactiveCache.getUser(
        { 'emails.address': email },
        { fields: { _id: 1 } },
      );
      if (existingUser) {
        throw new Meteor.Error('email-already-taken');
      } else {
        await Users.updateAsync(userId, {
          $set: {
            emails: [{ address: email, verified: false }],
          },
        });
      }
    }
  },

  async setUsernameAndEmail(username, email, userId) {
    check(username, String);
    check(email, String);
    check(userId, String);
    if (username.includes('/') || email.includes('/') || userId.includes('/')) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      if (Array.isArray(email)) {
        email = email.shift();
      }
      await Meteor.callAsync('setUsername', username, userId);
      await Meteor.callAsync('setEmail', email, userId);
    }
  },

  async setPassword(newPassword, userId) {
    check(userId, String);
    check(newPassword, String);
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      Accounts.setPassword(userId, newPassword);
    }
  },

  async setEmailVerified(email, verified, userId) {
    check(email, String);
    check(verified, Boolean);
    check(userId, String);
    if (email.includes('/') || userId.includes('/')) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      await Users.updateAsync(userId, {
        $set: {
          emails: [{ address: email, verified }],
        },
      });
    }
  },

  async setInitials(initials, userId) {
    check(initials, String);
    check(userId, String);
    if (initials.includes('/') || userId.includes('/')) {
      return false;
    }
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      await Users.updateAsync(userId, { $set: { 'profile.initials': initials } });
    }
  },

  async inviteUserToBoard(username, boardId) {
    check(username, String);
    check(boardId, String);
    if (username.includes('/') || boardId.includes('/')) {
      return false;
    }
    const inviter = await ReactiveCache.getCurrentUser();
    const board = await ReactiveCache.getBoard(boardId);
    const member = board.members.find(memberItem => memberItem.userId === inviter._id);
    if (!member || !member.isActive) throw new Meteor.Error('error-board-notAMember');

    this.unblock();

    const posAt = username.indexOf('@');
    let user = null;
    if (posAt >= 0) {
      user = await ReactiveCache.getUser({
        emails: { $elemMatch: { address: username } },
      });
    } else {
      user =
        (await ReactiveCache.getUser(username)) ||
        (await ReactiveCache.getUser({ username }));
    }
    if (user) {
      if (user._id === inviter._id) throw new Meteor.Error('error-user-notAllowSelf');
    } else {
      if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
      if ((await ReactiveCache.getCurrentSetting()).disableRegistration) {
        throw new Meteor.Error('error-user-notCreated');
      }
      const email = username.toLowerCase();
      username = email.substring(0, posAt);
      if (username.includes('/') || email.includes('/')) {
        return false;
      }
      const newUserId = Accounts.createUser({ username, email });
      if (!newUserId) throw new Meteor.Error('error-user-notCreated');
      if (inviter.profile && inviter.profile.language) {
        await Users.updateAsync(newUserId, { $set: { 'profile.language': inviter.profile.language } });
      }
      Accounts.sendEnrollmentEmail(newUserId);
      user = await ReactiveCache.getUser(newUserId);
    }

    const memberIndex = board.members.findIndex(m => m.userId === user._id);
    if (memberIndex >= 0) {
      await Boards.updateAsync(boardId, {
        $set: { [`members.${memberIndex}.isActive`]: true, modifiedAt: new Date() },
      });
    } else {
      await Boards.updateAsync(boardId, {
        $push: {
          members: {
            userId: user._id,
            isAdmin: false,
            isActive: true,
            isNoComments: false,
            isCommentOnly: false,
            isWorker: false,
            isNormalAssignedOnly: false,
            isCommentAssignedOnly: false,
            isReadOnly: false,
            isReadAssignedOnly: false,
          },
        },
        $set: { modifiedAt: new Date() },
      });
    }
    await Users.updateAsync(user._id, { $push: { 'profile.invitedBoards': boardId } });

    if (board.subtasksDefaultBoardId) {
      const subBoard = await ReactiveCache.getBoard(board.subtasksDefaultBoardId);
      if (subBoard) {
        const subMemberIndex = subBoard.members.findIndex(m => m.userId === user._id);
        if (subMemberIndex >= 0) {
          await Boards.updateAsync(board.subtasksDefaultBoardId, {
            $set: { [`members.${subMemberIndex}.isActive`]: true, modifiedAt: new Date() },
          });
        } else {
          await Boards.updateAsync(board.subtasksDefaultBoardId, {
            $push: {
              members: {
                userId: user._id,
                isAdmin: false,
                isActive: true,
                isNoComments: false,
                isCommentOnly: false,
                isWorker: false,
                isNormalAssignedOnly: false,
                isCommentAssignedOnly: false,
                isReadOnly: false,
                isReadAssignedOnly: false,
              },
            },
            $set: { modifiedAt: new Date() },
          });
        }
        await Users.updateAsync(user._id, { $push: { 'profile.invitedBoards': subBoard._id } });
      }
    }

    try {
      const fullName =
        inviter.profile !== undefined && inviter.profile.fullname !== undefined
          ? inviter.profile.fullname
          : '';
      const userFullName =
        user.profile !== undefined && user.profile.fullname !== undefined
          ? user.profile.fullname
          : '';
      const params = {
        user: userFullName !== '' ? `${userFullName} (${user.username} )` : user.username,
        inviter: fullName !== '' ? `${fullName} (${inviter.username} )` : inviter.username,
        board: board.title,
        url: board.absoluteUrl(),
      };
      const lang = user.getLanguage();

      if (typeof EmailLocalization !== 'undefined') {
        await EmailLocalization.sendEmail({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: 'email-invite-subject',
          text: 'email-invite-text',
          params,
          language: lang,
          userId: user._id,
        });
      } else {
        await Email.sendAsync({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: getTAPi18n().__('email-invite-subject', params, lang),
          text: getTAPi18n().__('email-invite-text', params, lang),
        });
      }
    } catch (e) {
      throw new Meteor.Error('email-fail', e.message);
    }
    return {
      username: user.username,
      email: user.emails[0].address,
    };
  },

  async impersonate(userId) {
    check(userId, String);

    if (!(await ReactiveCache.getUser(userId))) {
      throw new Meteor.Error(404, 'User not found');
    }
    if (!(await ReactiveCache.getCurrentUser()).isAdmin) {
      throw new Meteor.Error(403, 'Permission denied');
    }

    await ImpersonatedUsers.insertAsync({
      adminId: (await ReactiveCache.getCurrentUser())._id,
      userId,
      reason: 'clickedImpersonate',
    });
    this.setUserId(userId);
  },

  async isImpersonated(userId) {
    check(userId, String);
    return await ReactiveCache.getImpersonatedUser({ userId });
  },

  async setUsersTeamsTeamDisplayName(teamId, teamDisplayName) {
    check(teamId, String);
    check(teamDisplayName, String);
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      for (const user of await ReactiveCache.getUsers({
        teams: { $elemMatch: { teamId } },
      })) {
        await Users.updateAsync(
          { _id: user._id, teams: { $elemMatch: { teamId } } },
          { $set: { 'teams.$.teamDisplayName': teamDisplayName } },
        );
      }
    }
  },

  async setUsersOrgsOrgDisplayName(orgId, orgDisplayName) {
    check(orgId, String);
    check(orgDisplayName, String);
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      for (const user of await ReactiveCache.getUsers({
        orgs: { $elemMatch: { orgId } },
      })) {
        await Users.updateAsync(
          { _id: user._id, orgs: { $elemMatch: { orgId } } },
          { $set: { 'orgs.$.orgDisplayName': orgDisplayName } },
        );
      }
    }
  },
});

Accounts.onCreateUser(async (options, user) => {
  const usersCursor = await ReactiveCache.getUsers({}, {}, true);
  const userCount = typeof usersCursor.countAsync === 'function' ? await usersCursor.countAsync() : usersCursor.count();
  user.isAdmin = userCount === 0;

  if (user.services.oidc) {
    let email = user.services.oidc.email;
    if (Array.isArray(email)) {
      email = email.shift();
    }
    email = (email || '').toLowerCase();
    user.username = user.services.oidc.username || user.services.oidc.id || email.split('@')[0] || Random.id();
    user.emails = [{ address: email, verified: true }];

    if (user.username.includes('/') || email.includes('/')) {
      return false;
    }

    const fullname = user.services.oidc.fullname || user.username;
    const initials = fullname
      .split(/\s+/)
      .reduce((memo, word) => memo + word[0], '')
      .toUpperCase();
    user.profile = {
      initials,
      fullname,
      boardView: 'board-view-swimlanes',
    };
    user.authenticationMethod = 'oauth2';

    const existingUser = await ReactiveCache.getUser({
      $or: [{ 'emails.address': email }, { username: user.username }],
    });
    if (!existingUser) return user;

    const service = Object.keys(user.services)[0];
    existingUser.services[service] = user.services[service];
    existingUser.emails = user.emails;
    existingUser.username = user.username;
    existingUser.profile = user.profile;
    existingUser.authenticationMethod = user.authenticationMethod;

    await Meteor.users.removeAsync({ _id: user._id });
    await Meteor.users.removeAsync({ _id: existingUser._id });
    return existingUser;
  }

  if (options.from === 'admin') {
    user.createdThroughApi = true;
    return user;
  }

  const disableRegistration = (await ReactiveCache.getCurrentSetting()).disableRegistration;
  if (disableRegistration && options && options.ldap) {
    user.authenticationMethod = 'ldap';
    return user;
  }

  if (!disableRegistration) {
    return user;
  }

  if (!options || !options.profile) {
    throw new Meteor.Error('error-invitation-code-blank', 'The invitation code is required');
  }
  const invitationCode = await ReactiveCache.getInvitationCode({
    code: options.profile.invitationcode,
    email: options.email,
    valid: true,
  });
  if (!invitationCode) {
    throw new Meteor.Error('error-invitation-code-not-exist', "The invitation code doesn't exist");
  }

  user.profile = {
    icode: options.profile.invitationcode,
    boardView: 'board-view-swimlanes',
  };

  Meteor.setTimeout(() => {
    InvitationCodes.removeAsync({ _id: invitationCode._id }).catch(error => {
      console.error('Failed to remove invitation code after signup:', error);
    });
  }, 200);
  return user;
});

let notificationCleanupIntervalId = null;

const runNotificationCleanup = async function runNotificationCleanup() {
  const envRemoveAge =
    process.env.NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE;
  const defaultRemoveAge = 2;
  const removeAge = parseInt(envRemoveAge, 10) || defaultRemoveAge;

  for (const user of await ReactiveCache.getUsers()) {
    if (!user.profile || !user.profile.notifications) continue;
    for (const notification of user.profile.notifications) {
      if (notification && notification.read) {
        const removeDate = new Date(notification.read);
        removeDate.setDate(removeDate.getDate() + removeAge);
        if (removeDate <= new Date()) {
          user.removeNotification(notification.activity);
        }
      }
    }
  }
};

const startNotificationCleanup = debounce(
  function startNotificationCleanupDebounced() {
    if (notificationCleanupIntervalId) {
      return;
    }

    const oneDayMs = 24 * 60 * 60 * 1000;

    Meteor.defer(() => {
      runNotificationCleanup().catch(error => {
        console.error('Notification cleanup failed:', error);
      });
    });

    notificationCleanupIntervalId = Meteor.setInterval(() => {
      runNotificationCleanup().catch(error => {
        console.error('Notification cleanup failed:', error);
      });
    }, oneDayMs);
  },
  500,
);

Meteor.startup(async () => {
  for (const value of allowedSortValues) {
    await Lists._collection.createIndexAsync(value);
  }
  await Users._collection.createIndexAsync({ modifiedAt: -1 });
  Users.find({ 'profile.avatarUrl': { $regex: '/cfs/files/avatars/' } }).forEach(doc => {
    doc.profile.avatarUrl = doc.profile.avatarUrl.replace(
      '/cfs/files/avatars/',
      '/cdn/storage/avatars/',
    );
  });
  Meteor.defer(() => {
    startNotificationCleanup();
  });
});

Users.after.update(function(userId, user, fieldNames) {
  if (!fieldNames.includes('profile')) return;

  function getStarredBoardsIds(doc) {
    const starredBoards = doc.profile && doc.profile.starredBoards;
    return Array.isArray(starredBoards) ? starredBoards : [];
  }

  const oldIds = getStarredBoardsIds(this.previous);
  const newIds = getStarredBoardsIds(user);

  function incrementBoards(boardsIds, inc) {
    boardsIds.forEach(boardId => {
      Boards.updateAsync(boardId, { $inc: { stars: inc } }).catch(error => {
        console.error('Failed to update board stars:', error);
      });
    });
  }

  incrementBoards(oldIds.filter(x => !newIds.includes(x)), -1);
  incrementBoards(newIds.filter(x => !oldIds.includes(x)), +1);
});

const fakeUserId = new Meteor.EnvironmentVariable();
const getUserId = CollectionHooks.getUserId;
CollectionHooks.getUserId = () => {
  return fakeUserId.get() || getUserId();
};

if (!isSandstorm) {
  Users.after.insert(async (userId, doc) => {
    const fakeUser = {
      extendAutoValueContext: {
        userId: doc._id,
      },
    };

    await fakeUserId.withValue(doc._id, async () => {
      const boardId = await Boards.insertAsync(
        {
          title:
            getTAPi18n() && getTAPi18n().i18n
              ? getTAPi18n().__('templates')
              : 'Templates',
          permission: 'private',
          type: 'template-container',
        },
        fakeUser,
      );

      await Users.updateAsync(fakeUserId.get(), {
        $set: { 'profile.templatesBoardId': boardId },
      });

      const cardSwimlaneId = await Swimlanes.insertAsync(
        {
          title:
            getTAPi18n() && getTAPi18n().i18n
              ? getTAPi18n().__('card-templates-swimlane')
              : 'Card Templates',
          boardId,
          sort: 1,
          type: 'template-container',
        },
        fakeUser,
      );
      await Users.updateAsync(fakeUserId.get(), {
        $set: { 'profile.cardTemplatesSwimlaneId': cardSwimlaneId },
      });

      const listSwimlaneId = await Swimlanes.insertAsync(
        {
          title:
            getTAPi18n() && getTAPi18n().i18n
              ? getTAPi18n().__('list-templates-swimlane')
              : 'List Templates',
          boardId,
          sort: 2,
          type: 'template-container',
        },
        fakeUser,
      );
      await Users.updateAsync(fakeUserId.get(), {
        $set: { 'profile.listTemplatesSwimlaneId': listSwimlaneId },
      });

      const boardSwimlaneId = await Swimlanes.insertAsync(
        {
          title:
            getTAPi18n() && getTAPi18n().i18n
              ? getTAPi18n().__('board-templates-swimlane')
              : 'Board Templates',
          boardId,
          sort: 3,
          type: 'template-container',
        },
        fakeUser,
      );
      await Users.updateAsync(fakeUserId.get(), {
        $set: { 'profile.boardTemplatesSwimlaneId': boardSwimlaneId },
      });
    });
  });
}

Users.after.insert(async (userId, doc) => {
  doc = await ReactiveCache.getUser(doc._id);
  if (doc.createdThroughApi) {
    await Users.updateAsync(doc._id, { $set: { createdThroughApi: '' } });
    return;
  }

  const disableRegistration = (await ReactiveCache.getCurrentSetting()).disableRegistration;
  if (doc.authenticationMethod !== 'ldap' && disableRegistration) {
    let invitationCode = null;
    if (doc.authenticationMethod.toLowerCase() === 'oauth2') {
      invitationCode = await ReactiveCache.getInvitationCode({
        email: doc.emails[0].address.toLowerCase(),
        valid: true,
      });
    } else {
      invitationCode = await ReactiveCache.getInvitationCode({
        code: doc.profile.icode,
        valid: true,
      });
    }
    if (!invitationCode) {
      throw new Meteor.Error('error-invitation-code-not-exist');
    } else {
      for (const boardId of invitationCode.boardsToBeInvited) {
        const board = await ReactiveCache.getBoard(boardId);
        const memberIndex = board.members.findIndex(m => m.userId === doc._id);
        if (memberIndex >= 0) {
          await Boards.updateAsync(boardId, { $set: { [`members.${memberIndex}.isActive`]: true } });
        } else {
          await Boards.updateAsync(boardId, {
            $push: {
              members: {
                userId: doc._id,
                isAdmin: false,
                isActive: true,
                isNoComments: false,
                isCommentOnly: false,
                isWorker: false,
                isNormalAssignedOnly: false,
                isCommentAssignedOnly: false,
                isReadOnly: false,
                isReadAssignedOnly: false,
              },
            },
          });
        }
      }
      if (!doc.profile) {
        doc.profile = {};
      }
      doc.profile.invitedBoards = invitationCode.boardsToBeInvited;
      await Users.updateAsync(doc._id, { $set: { profile: doc.profile } });
      await InvitationCodes.updateAsync(invitationCode._id, { $set: { valid: false } });
    }
  }
});

WebApp.handlers.get('/api/user', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const data = await ReactiveCache.getUser({ _id: req.userId });
    delete data.services;

    let boards = await ReactiveCache.getBoards(
      { type: 'board', 'members.userId': req.userId },
      { fields: { _id: 1, members: 1 } },
    );
    boards = boards.map(b => {
      const u = b.members.find(m => m.userId === req.userId);
      delete u.userId;
      u.boardId = b._id;
      return u;
    });

    data.boards = boards;
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.get('/api/users', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const usersCursor = Meteor.users.find({}, { fields: { _id: 1, username: 1 } });
    const users = typeof usersCursor.fetchAsync === 'function' ? await usersCursor.fetchAsync() : usersCursor.fetch();
    sendJsonResult(res, {
      code: 200,
      data: users.map(doc => ({ _id: doc._id, username: doc.username })),
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.get('/api/users/:userId', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    let id = req.params.userId;
    let user = await ReactiveCache.getUser({ _id: id });
    if (!user) {
      user = await ReactiveCache.getUser({ username: id });
      id = user._id;
    }

    let boards = await ReactiveCache.getBoards(
      { type: 'board', 'members.userId': id },
      { fields: { _id: 1, members: 1 } },
    );
    boards = boards.map(b => {
      const u = b.members.find(m => m.userId === id);
      delete u.userId;
      u.boardId = b._id;
      return u;
    });

    user.boards = boards;
    sendJsonResult(res, { code: 200, data: user });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.put('/api/users/:userId', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const id = req.params.userId;
    const action = req.body.action;
    let data = await ReactiveCache.getUser({ _id: id });
    if (data !== undefined) {
      if (action === 'takeOwnership') {
        const boards = await ReactiveCache.getBoards(
          { 'members.userId': id, 'members.isAdmin': true },
          { sort: { sort: 1 } },
        );
        data = [];
        for (const board of boards) {
          if (board.hasMember(req.userId)) {
            await board.removeMember(req.userId);
          }
          board.changeOwnership(id, req.userId);
          data.push({ _id: board._id, title: board.title });
        }
      } else {
        if (action === 'disableLogin' && id !== req.userId) {
          await Users.updateAsync({ _id: id }, { $set: { loginDisabled: true, 'services.resume.loginTokens': '' } });
        } else if (action === 'enableLogin') {
          await Users.updateAsync({ _id: id }, { $set: { loginDisabled: '' } });
        }
        data = await ReactiveCache.getUser(id);
      }
    }
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/boards/:boardId/members/:userId/add', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const userId = req.params.userId;
    const boardId = req.params.boardId;
    const action = req.body.action;
    const {
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
      isNormalAssignedOnly,
      isCommentAssignedOnly,
      isReadOnly,
      isReadAssignedOnly,
    } = req.body;
    let data = await ReactiveCache.getUser(userId);
    if (data !== undefined && action === 'add') {
      const boards = await ReactiveCache.getBoards({ _id: boardId });
      data = [];
      for (const board of boards) {
        const hasMember = board.members.some(m => m.userId === userId && m.isActive);
        if (!hasMember) {
          const memberIndex = board.members.findIndex(m => m.userId === userId);
          if (memberIndex >= 0) {
            await Boards.updateAsync(boardId, { $set: { [`members.${memberIndex}.isActive`]: true } });
          } else {
            await Boards.updateAsync(boardId, {
              $push: {
                members: {
                  userId,
                  isAdmin: false,
                  isActive: true,
                  isNoComments: false,
                  isCommentOnly: false,
                  isWorker: false,
                  isNormalAssignedOnly: false,
                  isCommentAssignedOnly: false,
                  isReadOnly: false,
                  isReadAssignedOnly: false,
                },
              },
            });
          }

          const isTrue = value => value.toLowerCase() === 'true';
          const memberIndex2 = board.members.findIndex(m => m.userId === userId);
          if (memberIndex2 >= 0) {
            await Boards.updateAsync(boardId, {
              $set: {
                [`members.${memberIndex2}.isAdmin`]: isTrue(isAdmin),
                [`members.${memberIndex2}.isNoComments`]: isTrue(isNoComments),
                [`members.${memberIndex2}.isCommentOnly`]: isTrue(isCommentOnly),
                [`members.${memberIndex2}.isWorker`]: isTrue(isWorker),
                [`members.${memberIndex2}.isNormalAssignedOnly`]: isTrue(isNormalAssignedOnly),
                [`members.${memberIndex2}.isCommentAssignedOnly`]: isTrue(isCommentAssignedOnly),
                [`members.${memberIndex2}.isReadOnly`]: isTrue(isReadOnly),
                [`members.${memberIndex2}.isReadAssignedOnly`]: isTrue(isReadAssignedOnly),
              },
            });
          }
        }
        data.push({ _id: board._id, title: board.title });
      }
    }
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/boards/:boardId/members/:userId/remove', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const userId = req.params.userId;
    const boardId = req.params.boardId;
    const action = req.body.action;
    let data = await ReactiveCache.getUser(userId);
    if (data !== undefined && action === 'remove') {
      const boards = await ReactiveCache.getBoards({ _id: boardId });
      data = [];
      for (const board of boards) {
        const hasMember = board.members.some(m => m.userId === userId && m.isActive);
        if (hasMember) {
          const memberIndex = board.members.findIndex(m => m.userId === userId);
          if (memberIndex >= 0) {
            const member = board.members[memberIndex];
            const activeAdmins = board.members.filter(m => m.isActive && m.isAdmin);
            const allowRemove = !member.isAdmin || activeAdmins.length > 1;
            if (!allowRemove) {
              await Boards.updateAsync(boardId, { $set: { [`members.${memberIndex}.isActive`]: true } });
            } else {
              await Boards.updateAsync(boardId, {
                $set: {
                  [`members.${memberIndex}.isActive`]: false,
                  [`members.${memberIndex}.isAdmin`]: false,
                },
              });
            }
          }
        }
        data.push({ _id: board._id, title: board.title });
      }
    }
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/users/', function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const id = Accounts.createUser({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      from: 'admin',
    });
    sendJsonResult(res, { code: 200, data: { _id: id } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.delete('/api/users/:userId', async function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const id = req.params.userId;
    await Meteor.users.removeAsync({ _id: id });
    sendJsonResult(res, { code: 200, data: { _id: id } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/createtoken/:userId', function(req, res) {
  try {
    Authentication.checkUserId(req.userId);
    const id = req.params.userId;
    const token = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(id, token);

    sendJsonResult(res, {
      code: 200,
      data: {
        _id: id,
        authToken: token.token,
      },
    });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/deletetoken', async function(req, res) {
  try {
    const { userId, token } = req.body;
    Authentication.checkUserId(req.userId);

    let data = {
      message: 'Expected a userId to be set but received none.',
    };

    if (token && userId) {
      Accounts.destroyToken(userId, token);
      data.message = `Delete token: [${token}] from user: ${userId}`;
    } else if (userId) {
      check(userId, String);
      await Users.updateAsync(
        { _id: userId },
        { $set: { 'services.resume.loginTokens': '' } },
      );
      data.message = `Delete all token from user: ${userId}`;
    }

    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

const sanitizeUserForSearch = userData => {
  const safeFields = {
    _id: 1,
    username: 1,
    'profile.fullname': 1,
    'profile.avatarUrl': 1,
    'profile.initials': 1,
    'emails.address': 1,
    'emails.verified': 1,
    authenticationMethod: 1,
    isAdmin: 1,
    loginDisabled: 1,
    teams: 1,
    orgs: 1,
  };

  const sanitized = {};
  for (const field of Object.keys(safeFields)) {
    if (userData[field] !== undefined) {
      sanitized[field] = userData[field];
    }
  }

  delete sanitized.services;
  delete sanitized.resume;
  delete sanitized.email;
  delete sanitized.createdAt;
  delete sanitized.modifiedAt;
  delete sanitized.sessionData;
  delete sanitized.importUsernames;

  if (process.env.DEBUG === 'true') {
    console.log('Sanitized user data for search:', Object.keys(sanitized));
  }

  return sanitized;
};

Meteor.methods({
  sanitizeUserForSearch(userData) {
    check(userData, Object);
    return sanitizeUserForSearch(userData);
  },

  async getUsersCollectionCount(query = {}) {
    check(query, Match.OneOf(Object, null, undefined));

    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }

    const currentUser = await ReactiveCache.getUser(
      { _id: this.userId },
      { fields: { isAdmin: 1 } },
    );

    if (!currentUser || !currentUser.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    const cursor = await ReactiveCache.getUsers(query || {}, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },

  async searchUsers(query, boardId) {
    check(query, String);
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }

    const currentUser = await ReactiveCache.getCurrentUser();
    const board = await ReactiveCache.getBoard(boardId);
    const member = board.members.find(memberItem => memberItem.userId === currentUser._id);
    if (!member || !member.isActive) {
      throw new Meteor.Error('not-authorized', 'User is not a member of this board');
    }

    if (query.length < 2) {
      return [];
    }

    const searchRegex = new RegExp(query, 'i');
    const users = await ReactiveCache.getUsers(
      {
        $or: [
          { username: searchRegex },
          { 'profile.fullname': searchRegex },
          { 'emails.address': searchRegex },
        ],
      },
      {
        fields: {
          _id: 1,
          username: 1,
          'profile.fullname': 1,
          'profile.avatarUrl': 1,
          'profile.initials': 1,
          'emails.address': 1,
        },
        limit: 5,
      },
    );

    return users.map(user => sanitizeUserForSearch(user));
  },
});
