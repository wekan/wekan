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
import { boardMemberRoleToFlags, allowIsBoardAdmin } from '/server/lib/utils';
import EmailLocalization from '/server/lib/emailLocalization';
import { ensureIndex } from '/server/lib/mongoStartup';
import { BOARD_COLORS } from '/models/metadata/colors';
import { isValidCustomColors } from '/models/lib/themeCategories';
import { isKnownFont, isKnownFontSize, isHexColor6 } from '/models/lib/uiFonts';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

// Security (reported by meifukun): defence-in-depth throttle on account creation
// so invitation-code sign-up (and any other registration) attempts cannot be
// hammered. The invitation code itself is now a 128-bit CSPRNG value (see
// server/models/settings.js generateInvitationCode) so it is not brute-forceable;
// this rule additionally bounds abuse — at most 10 createUser attempts per 60s per
// client address.
if (Meteor.isServer) {
  DDPRateLimiter.addRule(
    {
      type: 'method',
      name: 'createUser',
      clientAddress() {
        return true;
      },
    },
    10,
    60 * 1000,
  );
}

// Security (reported by meifukun): profile.avatarUrl is rendered as an <img src>
// and, once external, is fetched by the server for localization. Only accept an
// http(s) URL, a data:image URI, an empty value (clearing), or a WeKan-local
// relative path (e.g. /cdn/storage/avatars/…). Reject javascript:, data:text/html,
// file:, protocol-relative //host and every other active/foreign scheme at write
// time so a hostile scheme can never be stored.
function assertSafeAvatarUrl(avatarUrl) {
  if (avatarUrl === '') return;
  if (avatarUrl.startsWith('/') && !avatarUrl.startsWith('//')) return;
  const m = /^([a-z][a-z0-9+.\-]*):/i.exec(avatarUrl);
  const scheme = m ? m[1].toLowerCase() : '';
  if (scheme === 'http' || scheme === 'https') return;
  if (scheme === 'data' && /^data:image\//i.test(avatarUrl)) return;
  try {
    require('/server/lib/securityLog').record({
      key: 'file.avatar-url', action: 'blocked', source: 'setAvatarUrl',
      detail: `rejected avatar url scheme "${scheme || '(none)'}"`,
    });
  } catch (e) { /* logging must never break the guard */ }
  throw new Meteor.Error(
    'invalid-avatar-url',
    'Avatar URL must be an http(s) URL, a data:image URI, or a local path',
  );
}
import ImpersonatedUsers from '/models/impersonatedUsers';
import Avatars from '/models/avatars';
import Boards from '/models/boards';
import InvitationCodes from '/models/invitationCodes';
import InviteToBoardRolesSettings from '/models/inviteToBoardRolesSettings';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Users, { allowedSortValues, allowedAllBoardsSortValues } from '/models/users';
import { expiredNotificationActivityIds } from '/models/lib/notificationCleanup';
import { chooseInviteEmailLanguage } from '/models/lib/inviteEmailLanguage';
import { paginateDomains } from '/models/lib/domainTablePage';
import { orgsToAutoAddForEmail } from '/models/lib/orgAutoAddByDomain';
import {
  gainedTeamIds,
  newTeamBoardMemberEntry,
  boardsToAddMemberTo,
} from '/models/lib/teamBoardMemberSync';

// #4593: when a team is assigned to a board (addBoardTeamPopup), every user in
// the team at that moment is pushed into board.members as a normal member — but
// a user added to the team afterwards never was, so they ended up with strictly
// less authority than their teammates: the publications let them view the board
// (teams.teamId match) while every interaction gate (board.hasMember,
// allowIsBoardMember*, Attachments.protected, board.isVisibleBy for export)
// only looks at board.members. This grants a user who just gained team(s) the
// same normal membership on every board those teams are assigned to. Existing
// member entries (even deactivated ones) are never touched, template boards are
// skipped, and team REMOVAL intentionally does not remove board members (a
// member may also have been invited individually; explicit cleanup remains the
// board admin's removeBoardTeamPopup action). Failures are logged, never fatal
// to the user update that triggered the sync.
const addUserToTeamBoards = async (userId, oldTeams, newTeams) => {
  try {
    const gained = gainedTeamIds(oldTeams, newTeams);
    if (!gained.length) return;
    const boards = await ReactiveCache.getBoards(
      { teams: { $elemMatch: { teamId: { $in: gained }, isActive: true } } },
      { fields: { _id: 1, type: 1, teams: 1, members: 1 } },
    );
    for (const boardId of boardsToAddMemberTo(boards, userId, gained)) {
      // Guarded push: never create a duplicate entry if the user became a
      // member through another path between the read above and this write.
      await Boards.updateAsync(
        { _id: boardId, 'members.userId': { $ne: userId } },
        { $push: { members: newTeamBoardMemberEntry(userId) } },
      );
    }
  } catch (error) {
    console.error('addUserToTeamBoards failed:', error);
  }
};

const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

Meteor.methods({
  // Lazily create the per-user templates-container board on first use (#2339,
  // #5850). New users no longer get one auto-created at signup; this method is
  // called right before a template is actually saved/copied. If the current
  // user already has profile.templatesBoardId, it is returned unchanged.
  // Otherwise the Templates board and its three swimlanes ('Card Templates',
  // 'List Templates', 'Board Templates'), all of type 'template-container', are
  // created exactly as the removed signup hook did, and the id is returned.
  async ensureTemplatesBoard() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');

    const existing = await Users.findOneAsync(this.userId, {
      fields: { 'profile.templatesBoardId': 1 },
    });
    const existingId =
      existing && existing.profile && existing.profile.templatesBoardId;
    if (existingId) {
      // Make sure the board still exists; if it was deleted, recreate below.
      const board = await Boards.findOneAsync(existingId);
      if (board) {
        return existingId;
      }
    }

    const fakeUser = {
      extendAutoValueContext: {
        userId: this.userId,
      },
    };

    let createdId;
    await fakeUserId.withValue(this.userId, async () => {
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

      await Users.updateAsync(this.userId, {
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
      await Users.updateAsync(this.userId, {
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
      await Users.updateAsync(this.userId, {
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
      await Users.updateAsync(this.userId, {
        $set: { 'profile.boardTemplatesSwimlaneId': boardSwimlaneId },
      });

      createdId = boardId;
    });

    return createdId;
  },
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

    // #4593: a user who just gained team(s) must also gain membership of the
    // boards those teams are assigned to, like the team's original members did.
    if (updateData.teams !== undefined) {
      await addUserToTeamBoards(targetUserId, targetUser.teams, updateData.teams);
    }
  },

  async setListSortBy(value) {
    check(value, String);
    (await ReactiveCache.getCurrentUser()).setListSortBy(value);
  },

  // #5799: persist the All Boards page sort mode for the current user.
  async setAllBoardsSortBy(value) {
    check(value, String);
    if (!allowedAllBoardsSortValues.includes(value)) {
      throw new Meteor.Error('invalid-sort', 'Invalid All Boards sort value');
    }
    await (await ReactiveCache.getCurrentUser()).setAllBoardsSortBy(value);
  },

  async setAvatarUrl(avatarUrl) {
    check(avatarUrl, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    assertSafeAvatarUrl(avatarUrl);
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
    assertSafeAvatarUrl(avatarUrl);
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

  // #2220: toggle the board that opens after login (the user's "home" board).
  async toggleDefaultBoard(boardId) {
    check(boardId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    const isDefault = (user.profile && user.profile.defaultBoardId) === boardId;
    const updateObject = isDefault
      ? { $unset: { 'profile.defaultBoardId': '' } }
      : { $set: { 'profile.defaultBoardId': boardId } };

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

  // #5778: set (or clear, when null/'') the caller's global theme color override.
  // Validated against the known board colors so a client cannot inject an arbitrary
  // CSS class name. Optional customColors (docs/Theme/Theme.md) are accepted only for
  // flat/clear themes and only as #rrggbb hex — validated via isValidCustomColors so
  // there is no CSS-injection surface.
  async setGlobalThemeColor(color, customColors) {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    check(color, Match.OneOf(String, null, undefined));
    check(customColors, Match.OneOf([String], null, undefined));

    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    if (color) {
      if (!BOARD_COLORS.includes(color)) {
        throw new Meteor.Error('invalid-color', 'Unknown theme color');
      }
      const modifier = { $set: { 'profile.globalThemeColor': color } };
      if (customColors && customColors.length && isValidCustomColors(color, customColors)) {
        modifier.$set['profile.globalThemeCustomColors'] = customColors;
      } else {
        modifier.$unset = { 'profile.globalThemeCustomColors': '' };
      }
      await Users.updateAsync(this.userId, modifier);
      return color;
    }
    await Users.updateAsync(this.userId, {
      $unset: { 'profile.globalThemeColor': '', 'profile.globalThemeCustomColors': '' },
    });
    return null;
  },

  // #4759: set (or clear, when null/'') the caller's UI font. Validated against the
  // curated whitelist (models/lib/uiFonts.js) so no arbitrary string can reach a CSS
  // font-family — the value is only ever a known, safe font name.
  async setUiFont(font) {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    check(font, Match.OneOf(String, null, undefined));

    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    if (font) {
      if (!isKnownFont(font)) {
        throw new Meteor.Error('invalid-font', 'Unknown font');
      }
      await Users.updateAsync(this.userId, { $set: { 'profile.uiFont': font } });
      return font;
    }
    await Users.updateAsync(this.userId, { $unset: { 'profile.uiFont': '' } });
    return null;
  },

  // #4759: set (or clear) the caller's UI font-size preset. Validated against the
  // named presets (no free numbers); 'default'/null/'' unsets (stock size).
  async setUiFontSize(size) {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    check(size, Match.OneOf(String, null, undefined));

    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    if (size && size !== 'default') {
      if (!isKnownFontSize(size)) {
        throw new Meteor.Error('invalid-font-size', 'Unknown font size');
      }
      await Users.updateAsync(this.userId, { $set: { 'profile.uiFontSize': size } });
      return size;
    }
    await Users.updateAsync(this.userId, { $unset: { 'profile.uiFontSize': '' } });
    return null;
  },

  // #4759: set (or clear) the caller's custom UI text color and text background
  // color. Each is validated as #rrggbb hex; a null/empty/invalid value unsets that
  // color (back to default). Only strict hex ever reaches a CSS value.
  async setUiColors(textColor, bgColor) {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    check(textColor, Match.OneOf(String, null, undefined));
    check(bgColor, Match.OneOf(String, null, undefined));

    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');

    const $set = {};
    const $unset = {};
    if (isHexColor6(textColor)) $set['profile.uiTextColor'] = textColor;
    else $unset['profile.uiTextColor'] = '';
    if (isHexColor6(bgColor)) $set['profile.uiTextBgColor'] = bgColor;
    else $unset['profile.uiTextBgColor'] = '';

    const modifier = {};
    if (Object.keys($set).length) modifier.$set = $set;
    if (Object.keys($unset).length) modifier.$unset = $unset;
    await Users.updateAsync(this.userId, modifier);
    return {
      textColor: $set['profile.uiTextColor'] || null,
      bgColor: $set['profile.uiTextBgColor'] || null,
    };
  },

  async toggleDesktopDragHandles() {
    const user = await ReactiveCache.getCurrentUser();
    user.toggleDesktopHandles(user.hasShowDesktopDragHandles());
  },

  // Per-user "submit editors on plain Enter" preference (Member Settings).
  // Off by default; when on, plain Enter submits and Shift+Enter is a newline.
  async toggleSubmitOnEnter() {
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'User must be logged in');
    const user = await Users.findOneAsync(this.userId);
    if (!user) throw new Meteor.Error('user-not-found', 'User not found');
    const current = !!((user.profile || {}).submitOnEnter);
    await Users.updateAsync(this.userId, { $set: { 'profile.submitOnEnter': !current } });
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
    if (!this.userId) return;
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    user.toggleHideCheckedItems();
  },

  async toggleCustomFieldsGrid() {
    if (!this.userId) return;
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    user.toggleFieldsGrid(user.hasCustomFieldsGrid());
  },

  async toggleCardMaximized() {
    if (!this.userId) return;
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    user.toggleCardMaximized(user.hasCardMaximized());
  },

  async setCardCollapsed(value) {
    check(value, Boolean);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    await Users.updateAsync(this.userId, { $set: { 'profile.cardCollapsed': value } });
  },

  async setMapProvider(provider) {
    check(provider, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    if (
      ![
        // USA
        'google',
        'bing',
        'apple',
        'waze',
        // Europe
        'openstreetmap',
        'here',
        'yandex',
        'mapy',
        '2gis',
        // Asia
        'baidu',
        'amap',
      ].includes(provider)
    ) {
      throw new Meteor.Error('invalid-map-provider');
    }
    await Users.updateAsync(this.userId, { $set: { 'profile.mapProvider': provider } });
  },

  async toggleMinicardLabelText() {
    if (!this.userId) return;
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    user.toggleLabelText(user.hasHiddenMinicardLabelText());
  },

  async toggleRescueCardDescription() {
    if (!this.userId) return;
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
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
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    user.setDateFormat(dateFormat);
  },

  async applyListWidth(boardId, listId, width, constraint) {
    check(boardId, String);
    check(listId, String);
    check(width, Number);
    check(constraint, Number);
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }
    // list.width/constraint are per-board fields shared with all users, so
    // only board members may change them, and only on the list's own board.
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.hasMember(this.userId)) {
      throw new Meteor.Error('error-notAuthorized');
    }
    const list = await ReactiveCache.getList(listId);
    if (!list || list.boardId !== boardId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    try {
      // #6409: only the shared per-board width is stored on the list. The old
      // `constraint` (max-width) is no longer used; the param is kept for
      // backwards compatibility with existing callers but ignored.
      Lists.updateAsync(listId, { $set: { width: width } });
      return true;
    } catch (error) {
      console.error('Error updating list width:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async setBoardAutoWidth(boardId, autoWidth) {
    check(boardId, String);
    check(autoWidth, Boolean);
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }
    // Shared (per-board) auto-width affects everyone, so only board members may
    // change it (parity with applyListWidth). See #6409.
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.hasMember(this.userId)) {
      throw new Meteor.Error('error-notAuthorized');
    }
    await Boards.updateAsync(boardId, { $set: { autoWidth: !!autoWidth } });
    return true;
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

  // Persist the right board sidebar width (px) for a logged-in user. Anonymous
  // users on public boards keep it in localStorage on the client instead.
  async setSidebarWidth(width) {
    check(width, Number);
    const user = await ReactiveCache.getCurrentUser();
    if (user) {
      await user.setSidebarWidth(width);
    }
  },

  // #5729 Enable/disable the per-user "same width for all lists" mode for a
  // board. This is a personal viewer setting (like personal list widths), so any
  // logged-in user may toggle it for any board they can view.
  async setFixedListWidthEnabled(boardId, enabled) {
    check(boardId, String);
    check(enabled, Boolean);
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    await user.setFixedListWidthEnabled(boardId, enabled);
    return true;
  },

  // #5729 Set the single width applied to every list when fixed width mode is on.
  async setFixedListWidth(boardId, width) {
    check(boardId, String);
    check(width, Number);
    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }
    // #6465: keep in sync with MIN_LIST_WIDTH in models/lib/listWidth.js (200).
    if (width < 200) {
      throw new Meteor.Error('invalid-width', 'Width must be >= 200');
    }
    const user = await ReactiveCache.getCurrentUser();
    if (!user) return;
    await user.setFixedListWidth(boardId, width);
    return true;
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
    // Must be awaited: the helper returns Users.updateAsync(...), so without await the
    // method resolves (and the client reloads) before profile.boardView is written —
    // and a rejected schema/write never surfaces. This made switching the board view
    // (e.g. to the new Statistics view) unreliable.
    await user.setBoardView(view);
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
          // #4593: a user created directly into team(s) must gain membership of
          // the boards those teams are assigned to, like the teams' existing
          // members already have.
          await addUserToTeamBoards(user._id, [], userTeamsArray);
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
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const currentUser = await Users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    if (!currentUser?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }

    if (typeof Accounts.setPasswordAsync === 'function') {
      await Accounts.setPasswordAsync(userId, newPassword);
    } else if (typeof Accounts.setPassword === 'function') {
      Accounts.setPassword(userId, newPassword);
    } else {
      throw new Meteor.Error('set-password-unavailable', 'Accounts password API is not available');
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

    // Global site admins (Admin Panel users) always have all rights and bypass
    // both the board-membership and the configurable per-role check below.
    if (!inviter.isAdmin) {
      const member = board.members.find(memberItem => memberItem.userId === inviter._id);
      if (!member || !member.isActive) throw new Meteor.Error('error-board-notAMember');
      // Enforce the Admin Panel / People / Roles policy: only the configured
      // board roles are allowed to invite users to a board.
      const allowedRoles = await InviteToBoardRolesSettings.allowedRoles();
      if (!allowedRoles.includes(board.memberRole(inviter._id))) {
        throw new Meteor.Error('error-notAllowed');
      }
    }

    this.unblock();

    const posAt = username.indexOf('@');
    let user = null;
    // #5664: existing invitee => their own language; new invitee => inviter's.
    let isNewUser = false;
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
      // #1894: do not add a deactivated account to a board.
      if (user.loginDisabled) throw new Meteor.Error('error-user-disabled');
    } else {
      if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
      if ((await ReactiveCache.getCurrentSetting()).disableRegistration) {
        throw new Meteor.Error('error-user-notCreated');
      }
      const email = username.toLowerCase();
      // #619: the invitee's username is derived from the email local part; a
      // collision with an existing user (e.g. cats@foo.com then
      // cats@facebook.com) made Accounts.createUser throw a raw
      // "403 Username already exists". Probe cats, cats1, cats2, ... instead.
      const { deriveUniqueInviteeUsername } = require('/models/lib/inviteeUsername');
      username = await deriveUniqueInviteeUsername(
        email,
        async candidate => !!(await ReactiveCache.getUser({ username: candidate })),
      );
      if (username === null) throw new Meteor.Error('error-username-taken');
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
      isNewUser = true;
    }

    // #6116: when the global admin setting is enabled, only allow adding a user
    // who shares at least one Organization OR one Team with the inviter (or with
    // any active board member). Site admins always bypass this restriction.
    if (!inviter.isAdmin) {
      const setting = await ReactiveCache.getCurrentSetting();
      if (setting && setting.boardMembersFromSameOrgOrTeamOnly) {
        let shares = inviter.sharesOrgOrTeamWith(user);
        if (!shares) {
          // Fall back to any active board member sharing an org/team, so an
          // inviter without orgs/teams set can still add same-org/team users.
          for (const m of board.members) {
            if (!m.isActive || m.userId === inviter._id) continue;
            const existingMember = await ReactiveCache.getUser(m.userId);
            if (existingMember && existingMember.sharesOrgOrTeamWith(user)) {
              shares = true;
              break;
            }
          }
        }
        if (!shares) {
          throw new Meteor.Error('error-user-notSameOrgOrTeam');
        }
      }
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
      // #5664: pick the invite email's language — the existing recipient's own
      // profile language, or (for a newly created invitee) the inviter's.
      const lang = chooseInviteEmailLanguage({
        isNewUser,
        inviterLanguage: inviter.getLanguage(),
        recipientLanguage: user.getLanguage(),
      });

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

// #5351: honour the Organization setting "Automatically add users with the
// domain name". Each org may store a domain in `orgAutoAddUsersWithDomainName`;
// when a new user signs up, every org whose configured domain matches the
// domain part of the user's email(s) must gain that user as a member. The
// membership shape is the same `{ orgId, orgDisplayName }` used everywhere else
// (see editUser / admin People UI). This mutates `user.orgs` in place BEFORE the
// document is inserted, so the membership is stored atomically with the user and
// existing entries are never duplicated. Failures are logged, never fatal to
// sign-up.
const autoAddOrgsByDomain = async user => {
  try {
    const emails = Array.isArray(user.emails) ? user.emails : [];
    if (!emails.length) return;

    const orgs = await ReactiveCache.getOrgs({
      orgAutoAddUsersWithDomainName: { $exists: true, $nin: [null, ''] },
    });
    if (!orgs || !orgs.length) return;

    const seen = new Set(
      (user.orgs || []).map(o => o && o.orgId).filter(Boolean),
    );
    const toAdd = [];
    emails.forEach(e => {
      orgsToAutoAddForEmail(e && e.address, orgs).forEach(orgId => {
        if (seen.has(orgId)) return;
        seen.add(orgId);
        const org = orgs.find(o => o._id === orgId);
        toAdd.push({
          orgId,
          orgDisplayName:
            (org && (org.orgDisplayName || org.orgShortName)) || orgId,
        });
      });
    });

    if (toAdd.length) {
      user.orgs = (user.orgs || []).concat(toAdd);
    }
  } catch (error) {
    console.error('autoAddOrgsByDomain failed:', error);
  }
};

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

    // #5876: optional OAUTH2_ADMIN_GROUPS (mirrors LDAP_SYNC_ADMIN_GROUPS).
    // When the env var is set (comma- and/or whitespace-separated list of group
    // names), make the new OIDC user a Wekan admin iff their OIDC `groups` claim
    // intersects that list. The groups claim may be an array of strings OR an
    // array of objects carrying a displayName (see wekan-oidc/oidc_server.js),
    // so handle both forms. When OAUTH2_ADMIN_GROUPS is empty/unset (default),
    // leave user.isAdmin untouched so existing behavior is unchanged.
    const oauth2AdminGroups = (process.env.OAUTH2_ADMIN_GROUPS || '')
      .split(/[\s,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    if (oauth2AdminGroups.length) {
      const oidcGroups = Array.isArray(user.services.oidc.groups)
        ? user.services.oidc.groups
        : [];
      const userGroupNames = oidcGroups
        .map(group => {
          if (typeof group === 'string') return group;
          if (group && typeof group === 'object') return group.displayName || group.name || '';
          return '';
        })
        .filter(name => name.length > 0);
      user.isAdmin = userGroupNames.some(name => oauth2AdminGroups.includes(name));
    }

    // SECURITY (GHSA-mp7g-hj5q-gxhq): Do not silently take over an existing
    // local account from an OIDC login.
    //
    // The previous code unconditionally merged the incoming OIDC identity into
    // any existing account whose email OR username matched the (attacker
    // controlled) OIDC claims, with no ownership check and no email
    // verification. That allowed full account takeover: an attacker presenting
    // a matching `email`/`username` claim inherited the victim's _id, boards,
    // attachments, API tokens and admin status.
    //
    // Fail closed, mirroring LDAP_MERGE_EXISTING_USERS in wekan-ldap:
    //   * Match an existing account by email only (never by username — a
    //     username collision carries no proof of email ownership).
    //   * Auto-linking is opt-in via OAUTH2_MERGE_EXISTING_USERS and is OFF by
    //     default, so the default deployment never merges.
    //   * Even when opted in, the OIDC provider must assert email_verified.
    //   * Otherwise reject the login instead of creating/merging an account,
    //     so no takeover and no confusing duplicate occurs.
    const existingUser = await ReactiveCache.getUser({
      'emails.address': email,
    });

    // #4736: optionally refuse to auto-create accounts for unknown OIDC logins.
    // When OAUTH2_AUTO_REGISTRATION is 'false', a first-time OIDC login that does
    // not already match a Wekan account (by verified email — the secure key the
    // merge logic below also uses; never by username, to avoid the takeover /
    // collision pitfalls documented above) is rejected instead of silently
    // creating a new account. This lets an instance allow only already-
    // provisioned users (e.g. synced from LDAP) to log in via OAuth2. Default
    // keeps the previous behaviour (auto-create on first login).
    const autoRegistrationDisabled =
      process.env.OAUTH2_AUTO_REGISTRATION === 'false' ||
      process.env.OAUTH2_AUTO_REGISTRATION === false;
    if (autoRegistrationDisabled && !existingUser) {
      throw new Meteor.Error(
        'oidc-registration-disabled',
        'OIDC login succeeded, but automatic registration is disabled ' +
          '(OAUTH2_AUTO_REGISTRATION=false) and no existing Wekan account has ' +
          'this email. Ask an administrator to create the account first.',
      );
    }

    if (!existingUser) {
      await autoAddOrgsByDomain(user);
      return user;
    }

    const mergeExistingUsers =
      process.env.OAUTH2_MERGE_EXISTING_USERS === 'true' ||
      process.env.OAUTH2_MERGE_EXISTING_USERS === true;
    const emailVerified = user.services.oidc.email_verified === true;
    if (!mergeExistingUsers || !emailVerified) {
      throw new Meteor.Error(
        'oidc-email-already-in-use',
        'OIDC login succeeded, but there is already a Wekan account with this ' +
          'email. Account linking is disabled; set OAUTH2_MERGE_EXISTING_USERS=true ' +
          '(and ensure the provider sends email_verified) to allow it.',
      );
    }

    const service = Object.keys(user.services)[0];
    existingUser.services[service] = user.services[service];
    existingUser.emails = user.emails;
    existingUser.username = user.username;
    // #4560 ("User Profile is reset when changing the authentication method
    // from LDAP to OIDC"): merge the profile, do not replace it. The previous
    // wholesale `existingUser.profile = user.profile` re-inserted the linked
    // account with ONLY the freshly built OIDC profile (initials, fullname,
    // boardView), wiping profile.avatarUrl, profile.templatesBoardId and the
    // template swimlane ids, language, notification/preference fields, etc. —
    // the reporter's "templates and avatars disappeared". Keep every existing
    // profile field, fill gaps from the OIDC-derived profile, and take the
    // provider's fullname/initials only when the provider actually asserted a
    // fullname (otherwise user.profile.fullname is just a fallback to the
    // username and must not overwrite a real stored name).
    existingUser.profile = {
      ...user.profile,
      ...(existingUser.profile || {}),
    };
    if (user.services.oidc.fullname) {
      existingUser.profile.fullname = user.profile.fullname;
      existingUser.profile.initials = user.profile.initials;
    }
    existingUser.authenticationMethod = user.authenticationMethod;

    await Meteor.users.removeAsync({ _id: user._id });
    await Meteor.users.removeAsync({ _id: existingUser._id });
    return existingUser;
  }

  if (options.from === 'admin') {
    user.createdThroughApi = true;
    return user;
  }

  // #5351: auto-add this user to organizations whose configured domain matches
  // their email domain. Applies to every non-admin sign-up path below (password
  // registration, LDAP, invitation-code); admin-created users are handled above
  // where the admin sets orgs explicitly.
  await autoAddOrgsByDomain(user);

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

  // #4043: do NOT delete the invitation code here — this hook runs BEFORE the
  // account insert is committed, so a failed insert (duplicate username/email,
  // validation error) used to destroy the code anyway and every retry got
  // "The invitation code doesn't exist". Consumption is handled after a
  // SUCCESSFUL insert by Users.after.insert, which marks the code used; and a
  // re-invite now regenerates a stale code (models/lib/invitationCodeEmail.js).
  return user;
});

let notificationCleanupIntervalId = null;

const runNotificationCleanup = async function runNotificationCleanup() {
  const envRemoveAge =
    process.env.NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE;
  const defaultRemoveAge = 2;
  const removeAge = parseInt(envRemoveAge, 10) || defaultRemoveAge;
  const now = new Date();

  // #5685: only scan users that actually have notifications, and prune each
  // user's stale notifications in a SINGLE awaited `$pull … $in` instead of one
  // un-awaited `removeNotification()` per entry. That collapses K Users-collection
  // writes (and the K publication observer re-runs they triggered — the churn
  // behind the "Removed nonexistent document" crash) into one.
  const users = await ReactiveCache.getUsers({
    'profile.notifications': { $exists: true, $ne: [] },
  });
  for (const user of users) {
    const activityIds = expiredNotificationActivityIds(
      user.profile && user.profile.notifications,
      removeAge,
      now,
    );
    if (activityIds.length === 0) continue;
    try {
      await Users.updateAsync(user._id, {
        $pull: {
          'profile.notifications': { activity: { $in: activityIds } },
        },
      });
    } catch (error) {
      console.error(
        'Notification cleanup: failed to prune notifications for user',
        user._id,
        error,
      );
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

// Repair avatar URLs left pointing at a deleted legacy CollectionFS avatar after
// a CFS -> Meteor-Files migration. The user's profile.avatarUrl is still the
// legacy '/cfs/files/avatars/<oldId>' form, but that filerecord was deleted by
// the migration and the avatar now lives in Meteor-Files under a new id, so the
// avatar renders broken. Point profile.avatarUrl at the user's migrated
// Meteor-Files avatar. Idempotent: once rewritten the URL no longer matches.
async function repairLegacyAvatarUrls() {
  try {
    let repaired = 0;
    const cursor = Users.find(
      { 'profile.avatarUrl': { $regex: '/cfs/files/avatars/' } },
      { fields: { _id: 1, 'profile.avatarUrl': 1 } },
    );
    await cursor.forEachAsync(async user => {
      const url = (user.profile && user.profile.avatarUrl) || '';
      const match = url.match(/\/avatars\/([^/?#-]+)/);
      const oldId = match && match[1];

      let avatar = null;
      // 1) Precise: the migration stamped the source id it came from, so we can
      //    repoint to the exact avatar that replaced this one.
      if (oldId) {
        avatar = await Avatars.collection.findOneAsync(
          { 'meta.migratedFromId': oldId },
          { fields: { _id: 1 } },
        );
      }
      // 2) Best-effort for avatars migrated before that stamp existed: the user's
      //    OWN migrated avatar (matched strictly by userId, newest first) — never
      //    another user's avatar.
      if (!avatar) {
        avatar =
          (await Avatars.collection.findOneAsync(
            { userId: user._id, 'meta.source': 'storage-migrate' },
            { sort: { uploadedAtOstrio: -1 }, fields: { _id: 1 } },
          )) ||
          (await Avatars.collection.findOneAsync(
            { userId: user._id },
            { sort: { uploadedAtOstrio: -1 }, fields: { _id: 1 } },
          ));
      }

      if (avatar && avatar._id) {
        await Users.updateAsync(user._id, {
          $set: { 'profile.avatarUrl': `/cdn/storage/avatars/${avatar._id}` },
        });
        repaired += 1;
      }
    });
    if (repaired > 0) {
      console.log(`[users] Repaired ${repaired} legacy avatar URL(s) to migrated Meteor-Files avatars.`);
    }
  } catch (error) {
    console.error('[users] Failed to repair legacy avatar URLs:', error);
  }
}

Meteor.startup(async () => {
  for (const value of allowedSortValues) {
    await ensureIndex(Lists, value);
  }
  await ensureIndex(Users, { modifiedAt: -1 });
  Meteor.defer(() => {
    repairLegacyAvatarUrls();
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

// NOTE: New users no longer get an auto-created "Templates" board at signup
// (#2339, #5850). The templates-container board is now created lazily on first
// use via the `ensureTemplatesBoard` Meteor method below, so accounts created
// through any authentication method (password, LDAP, OAuth2) start clean and
// the container is only materialized when a template is actually saved/copied.

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
    await Authentication.checkUserId(req.userId);
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
    await Authentication.checkUserId(req.userId);
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
    await Authentication.checkUserId(req.userId);
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
    const userId = req.params.userId;
    const boardId = req.params.boardId;
    const action = req.body.action;
    // Issue #5998: adding a board member requires board admin (or site admin).
    // Awaited + explicit status: a denied caller gets a clean 401/403 instead of
    // an un-awaited rejection that previously surfaced as an HTTP 503.
    if (!req.userId) {
      sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
      return;
    }
    const authBoard = await ReactiveCache.getBoard(boardId);
    const isBoardAdmin = allowIsBoardAdmin(req.userId, authBoard);
    const isSiteAdmin = isBoardAdmin
      ? true
      : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
    if (!isBoardAdmin && !isSiteAdmin) {
      sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can add board members' } });
      return;
    }
    // Issue #5998: accept a single named `role` (admin/commentOnly/...)
    // as an alternative to the eight boolean flags. When `role` is present it
    // wins; otherwise the individual flags are used as before.
    let roleFlags = null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      roleFlags = boardMemberRoleToFlags(req.body.role);
      if (roleFlags === null) {
        sendJsonResult(res, { code: 400, data: { error: `invalid role: ${req.body.role}` } });
        return;
      }
    }
    const {
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
      isNormalAssignedOnly,
      isCommentAssignedOnly,
      isReadOnly,
      isReadAssignedOnly,
    } = roleFlags === null ? req.body : roleFlags;
    let data = await ReactiveCache.getUser(userId);
    // #1894: do not add a deactivated account to a board.
    if (data !== undefined && action === 'add' && data.loginDisabled) {
      sendJsonResult(res, { code: 400, data: { error: 'User is disabled' } });
      return;
    }
    if (data !== undefined && action === 'add') {
      const boards = await ReactiveCache.getBoards({ _id: boardId });
      data = [];
      for (const board of boards) {
        const hasMember = board.members.some(m => m.userId === userId && m.isActive);
        if (!hasMember) {
          // Tolerate both real booleans (from a named `role`) and 'true'/'false'
          // strings (from individual flag params).
          const isTrue = value => value === true || String(value).toLowerCase() === 'true';
          const memberFlags = {
            isAdmin: isTrue(isAdmin),
            isNoComments: isTrue(isNoComments),
            isCommentOnly: isTrue(isCommentOnly),
            isWorker: isTrue(isWorker),
            isNormalAssignedOnly: isTrue(isNormalAssignedOnly),
            isCommentAssignedOnly: isTrue(isCommentAssignedOnly),
            isReadOnly: isTrue(isReadOnly),
            isReadAssignedOnly: isTrue(isReadAssignedOnly),
          };
          const memberIndex = board.members.findIndex(m => m.userId === userId);
          if (memberIndex >= 0) {
            // Re-activate an existing (inactive) member and apply the new flags.
            const flagSet = { [`members.${memberIndex}.isActive`]: true };
            for (const [flag, value] of Object.entries(memberFlags)) {
              flagSet[`members.${memberIndex}.${flag}`] = value;
            }
            await Boards.updateAsync(boardId, { $set: flagSet });
          } else {
            // Brand-new member: push the member document with its flags applied
            // atomically. Computing the index after the push would read a stale
            // in-memory `board.members`, so the flags must be part of the $push.
            await Boards.updateAsync(boardId, {
              $push: { members: { userId, isActive: true, ...memberFlags } },
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
    const userId = req.params.userId;
    const boardId = req.params.boardId;
    const action = req.body.action;
    // Issue #5998: removing a board member requires board admin (or site admin).
    if (!req.userId) {
      sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
      return;
    }
    const authBoard = await ReactiveCache.getBoard(boardId);
    const isBoardAdmin = allowIsBoardAdmin(req.userId, authBoard);
    const isSiteAdmin = isBoardAdmin
      ? true
      : !!(await ReactiveCache.getUser({ _id: req.userId, isAdmin: true }));
    if (!isBoardAdmin && !isSiteAdmin) {
      sendJsonResult(res, { code: 403, data: { error: 'Only a board admin can remove board members' } });
      return;
    }
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

WebApp.handlers.post('/api/users/', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
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
    await Authentication.checkUserId(req.userId);
    const id = req.params.userId;
    await Meteor.users.removeAsync({ _id: id });
    sendJsonResult(res, { code: 200, data: { _id: id } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

WebApp.handlers.post('/api/createtoken/:userId', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
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
    await Authentication.checkUserId(req.userId);

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

  // #5850: Admin Panel > People > Domains. Returns the list of email-address
  // domains across all users and the count of users per domain (each user
  // counted once by their primary email's domain), sorted by count desc then
  // domain. Admin-only.
  async getDomainsWithUserCounts() {
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

    const users = await Users.find({}, { fields: { emails: 1 } }).fetchAsync();
    const counts = {};
    for (const u of users) {
      const addr = (u.emails && u.emails[0] && u.emails[0].address) || '';
      const at = addr.lastIndexOf('@');
      if (at === -1) continue;
      const domain = addr.slice(at + 1).toLowerCase().trim();
      if (!domain) continue;
      counts[domain] = (counts[domain] || 0) + 1;
    }
    return Object.keys(counts)
      .map(domain => ({ domain, count: counts[domain] }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
  },

  // Paginated / searchable / column-sortable variant of getDomainsWithUserCounts
  // for the Admin Panel Domains table. The aggregation still scans all users on
  // the SERVER, but only one small page of rows is returned to the browser
  // (matching the Board Table view). `paginateDomains` (pure, unit-tested) does
  // the search + sort + slice; this method only does the auth check and the
  // domain/count aggregation.
  async getDomainsWithUserCountsPage(params = {}) {
    check(params, Match.ObjectIncluding({
      search: Match.Optional(String),
      page: Match.Optional(Number),
      perPage: Match.Optional(Number),
    }));
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

    const users = await Users.find({}, { fields: { emails: 1 } }).fetchAsync();
    const counts = {};
    for (const u of users) {
      const addr = (u.emails && u.emails[0] && u.emails[0].address) || '';
      const at = addr.lastIndexOf('@');
      if (at === -1) continue;
      const domain = addr.slice(at + 1).toLowerCase().trim();
      if (!domain) continue;
      counts[domain] = (counts[domain] || 0) + 1;
    }
    const rows = Object.keys(counts).map(domain => ({
      domain,
      count: counts[domain],
    }));

    // Fixed order (domain ascending) — column-header sorting was removed.
    return paginateDomains(rows, {
      search: params.search,
      page: params.page,
      perPage: params.perPage,
    });
  },

  // Feature #3313 "Shared templates": admin-only.
  // For every user whose Templates board is NON-EMPTY (contains at least one
  // shared template board), return the data the Admin Panel needs to group the
  // users by Organization / Team / email Domain and to list & link their
  // shared template boards.
  //
  // A user's template boards are stored as cards of type 'cardType-linkedBoard'
  // inside the "Board Templates" swimlane of their Templates container board
  // (profile.templatesBoardId / profile.boardTemplatesSwimlaneId). Each such
  // card's `linkedId` points at the actual template board (type 'template-board')
  // we link to. See server/models/users.js Users.after.insert and
  // client/components/lists/listBody.js for how these are created.
  async adminSharedTemplates() {
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

    const users = await ReactiveCache.getUsers(
      { 'profile.templatesBoardId': { $exists: true, $nin: [null, ''] } },
      {
        fields: {
          username: 1,
          'profile.fullname': 1,
          'profile.templatesBoardId': 1,
          'profile.boardTemplatesSwimlaneId': 1,
          orgs: 1,
          teams: 1,
          emails: 1,
        },
      },
    );

    const result = [];
    for (const user of users) {
      const profile = user.profile || {};
      const templatesBoardId = profile.templatesBoardId;
      if (!templatesBoardId) continue;

      // Enumerate the user's shared template boards: linked-board cards in the
      // Board Templates swimlane of their Templates container board.
      const cardQuery = {
        boardId: templatesBoardId,
        type: 'cardType-linkedBoard',
        archived: false,
      };
      if (profile.boardTemplatesSwimlaneId) {
        cardQuery.swimlaneId = profile.boardTemplatesSwimlaneId;
      }
      const cards = await ReactiveCache.getCards(cardQuery, {
        fields: { title: 1, linkedId: 1, sort: 1 },
        sort: { sort: 1 },
      });

      if (!cards || cards.length === 0) continue; // empty Templates board -> exclude

      const templateBoards = [];
      for (const card of cards) {
        let slug = '';
        if (card.linkedId) {
          const board = await ReactiveCache.getBoard(card.linkedId);
          if (board) slug = board.slug || '';
        }
        templateBoards.push({
          cardId: card._id,
          title: card.title || '',
          boardId: card.linkedId || '',
          slug,
        });
      }

      const emails = (user.emails || []).map(e => e.address).filter(Boolean);
      const domains = [
        ...new Set(
          emails
            .map(addr => (addr.indexOf('@') >= 0 ? addr.split('@')[1].toLowerCase() : ''))
            .filter(Boolean),
        ),
      ];

      result.push({
        userId: user._id,
        username: user.username || '',
        fullname: (profile.fullname) || '',
        orgs: (user.orgs || []).map(o => ({
          orgId: o.orgId,
          orgDisplayName: o.orgDisplayName,
        })),
        teams: (user.teams || []).map(t => ({
          teamId: t.teamId,
          teamDisplayName: t.teamDisplayName,
        })),
        domains,
        templateBoards,
      });
    }

    return result;
  },

  async searchUsers(query, boardId) {
    check(query, String);
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-logged-in', 'User must be logged in');
    }

    const currentUser = await ReactiveCache.getCurrentUser();
    const board = await ReactiveCache.getBoard(boardId);
    // Global site admins bypass the board-membership check, mirroring
    // inviteUserToBoard.
    if (!currentUser.isAdmin) {
      const member = board.members.find(memberItem => memberItem.userId === currentUser._id);
      if (!member || !member.isActive) {
        throw new Meteor.Error('not-authorized', 'User is not a member of this board');
      }
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
          // #6116: needed for the same-org/same-team typeahead filter below.
          orgs: 1,
          teams: 1,
        },
        limit: 5,
      },
    );

    // #6116: when the global admin setting is enabled, restrict the typeahead to
    // users sharing an Organization or Team with the caller (or an active board
    // member). Site admins are not filtered. Mirrors inviteUserToBoard so the UI
    // never offers a candidate the server would later reject.
    let filteredUsers = users;
    if (!currentUser.isAdmin) {
      const setting = await ReactiveCache.getCurrentSetting();
      if (setting && setting.boardMembersFromSameOrgOrTeamOnly) {
        const activeMemberUsers = [];
        for (const m of board.members) {
          if (!m.isActive) continue;
          const memberUser =
            m.userId === currentUser._id
              ? currentUser
              : await ReactiveCache.getUser(m.userId);
          if (memberUser) activeMemberUsers.push(memberUser);
        }
        filteredUsers = users.filter(candidate =>
          activeMemberUsers.some(memberUser =>
            memberUser.sharesOrgOrTeamWith(candidate),
          ),
        );
      }
    }

    return filteredUsers.map(user => sanitizeUserForSearch(user));
  },
});

/**
 * @operation get_admin_domains
 * @tag Users
 *
 * @summary List email domains with their user counts (GlobalAdmin)
 *
 * @description Only the global admin can call this. Counts every user by the
 * domain part of their primary email address (the first address in `emails`),
 * mirroring the Admin Panel > People domain grouping. Domains are returned
 * sorted by descending count, then alphabetically.
 *
 * @return_type [{domain: string, count: number}]
 */
WebApp.handlers.get('/api/admin/domains', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const users = await Users.find({}, { fields: { emails: 1 } }).fetchAsync();
    const counts = {};
    for (const u of users) {
      const addr = (u.emails && u.emails[0] && u.emails[0].address) || '';
      const at = addr.lastIndexOf('@');
      if (at === -1) continue;
      const domain = addr.slice(at + 1).toLowerCase().trim();
      if (!domain) continue;
      counts[domain] = (counts[domain] || 0) + 1;
    }
    const data = Object.keys(counts)
      .map(domain => ({ domain, count: counts[domain] }))
      .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
