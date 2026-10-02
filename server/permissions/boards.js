import Boards from '/models/boards';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { findWhere, where } from '/imports/lib/collectionHelpers';
import { allowIsBoardAdminOrSiteAdmin, canUpdateBoardSort, canUpdateBoardSameWidthValue } from '/server/lib/utils';
import { canWriteSubtaskDeposit, recordSubtaskDepositDenial } from '/server/lib/subtaskDepositAccess';
const { isOpenPermission } = require('/models/lib/boardPermission');

Boards.deny({
  async insert(userId, doc) {
    // OwnerBleed, DDP sibling (2026-10-02): the REST fix ignores owner fields,
    // but a client insert could still carry its own members list - naming
    // somebody else as the board's admin, or adding people who never agreed
    // to be members. The UI sends no members (the schema makes the creator
    // the only admin), so any member but the creator is an attempt.
    if (Array.isArray(doc.members) && doc.members.some(member => !member || member.userId !== userId)) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.board-owner', action: 'blocked', source: 'ddp:boards.insert', userId,
          detail: 'A client board insert named members other than its creator.',
        });
      } catch (e) { /* logging must never break the guard */ }
      return true;
    }
    if (!doc.subtasksDefaultBoardId) return false;
    if (await canWriteSubtaskDeposit(userId, doc.subtasksDefaultBoardId)) return false;
    recordSubtaskDepositDenial('ddp:board-insert');
    return true;
  },
  async update(userId, doc, fields, modifier) {
    if (modifier.$rename && Object.values(modifier.$rename).includes('subtasksDefaultBoardId')) {
      recordSubtaskDepositDenial('ddp:board-deposit-rename');
      return true;
    }
    const id = modifier.$set && modifier.$set.subtasksDefaultBoardId;
    if (!id) return false;
    if (await canWriteSubtaskDeposit(userId, id)) return false;
    recordSubtaskDepositDenial('ddp:board-deposit');
    return true;
  },
});

// BackgroundBleed: backgroundImageId may name only an attachment of this same
// board. The UI sets it from the board's own background picker, so pointing it
// anywhere else is an attempt to read another board's file through the
// background download API.
Boards.deny({
  async update(userId, doc, fields, modifier) {
    const renamed = modifier.$rename && Object.values(modifier.$rename).includes('backgroundImageId');
    const id = modifier.$set && modifier.$set.backgroundImageId;
    if (!renamed && !id) return false;
    if (!renamed) {
      const Attachments = require('/models/attachments').default;
      const attachment = await Attachments.findOneAsync({ _id: id });
      if (require('/models/lib/boardBackgroundOwnership').isOwnBoardBackground(doc, attachment)) return false;
    }
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.background', action: 'blocked', source: 'ddp:boards.update', userId,
        detail: 'Tried to set a board background to an attachment of another board.',
      });
    } catch (e) { /* logging must never break the guard */ }
    return true;
  },
});

Boards.allow({
  async insert(userId, doc) {
    // Check if user is logged in
    if (!userId) return false;

    // If allowPrivateOnly is enabled, only allow private boards
    const allowPrivateOnly = (await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly'))?.booleanValue;
    // #3249: an 'instance' board is not private either.
    if (allowPrivateOnly && isOpenPermission(doc.permission)) {
      return false;
    }

    return true;
  },
  // #3249: also let a global Admin Panel admin (Meteor.user().isAdmin) edit or
  // delete a board they are not themselves a member/admin of - the case that
  // matters is a board whose creator left and took the only admin membership
  // with them, leaving nobody who could otherwise touch its settings.
  update: allowIsBoardAdminOrSiteAdmin,
  remove: allowIsBoardAdminOrSiteAdmin,
  fetch: ['members'],
});

// All logged in users are allowed to reorder boards by dragging at All Boards page and Public Boards page.
// SortBleed (GHSA-xm8x-c8wg-jhmf): canUpdateBoardSort only approves updates that
// touch the 'sort' field and NOTHING else, so a board member can never smuggle a
// members/permission/title change into the same modifier as sort.
Boards.allow({
  update(userId, board, fieldNames) {
    return canUpdateBoardSort(userId, board, fieldNames);
  },
  // Need members to verify membership in policy
  fetch: ['members'],
});

// #6680: dragging the board-wide "same width for all lists" handle updates
// ONLY sameWidthForAllListsValue, and needs write access, not board-admin -
// same shape and the same reason as the 'sort' rule above.
Boards.allow({
  update(userId, board, fieldNames) {
    return canUpdateBoardSameWidthValue(userId, board, fieldNames);
  },
  fetch: ['members'],
});

// The number of users that have starred this board is managed by trusted code
// and the user is not allowed to update it
Boards.deny({
  update(userId, board, fieldNames) {
    return (fieldNames || []).includes('stars');
  },
  fetch: [],
});

// We can't remove a member if it is the last administrator
Boards.deny({
  update(userId, doc, fieldNames, modifier) {
    if (!(fieldNames || []).includes('members')) return false;

    // Defense in depth (SortBleed, GHSA-xm8x-c8wg-jhmf): a wholesale
    // `$set: { members: [...] }` rewrite bypasses the $pull check below, so it
    // could drop the last active admin (evicting the legitimate owner). Reject
    // any $set of the members array that does not keep at least one active
    // admin, whenever the board currently has one.
    const setMembers = modifier.$set && modifier.$set.members;
    if (Array.isArray(setMembers)) {
      const hadAdmin =
        where(doc.members, { isActive: true, isAdmin: true }).length > 0;
      const keepsAdmin =
        where(setMembers, { isActive: true, isAdmin: true }).length > 0;
      if (hadAdmin && !keepsAdmin) return true;
    }

    // We only care in case of a $pull operation, ie remove a member
    const pullMembers = modifier.$pull && modifier.$pull.members;
    if (!(typeof pullMembers === 'object' && pullMembers !== null)) return false;

    // If there is more than one admin, it's ok to remove anyone
    const nbAdmins = where(doc.members, { isActive: true, isAdmin: true })
      .length;
    if (nbAdmins > 1) return false;

    // If all the previous conditions were verified, we can't remove
    // a user if it's an admin
    const removedMemberId = modifier.$pull.members.userId;
    return Boolean(
      findWhere(doc.members, {
        userId: removedMemberId,
        isAdmin: true,
      }),
    );
  },
  fetch: ['members'],
});

// Deny changing permission to public if allowPrivateOnly is enabled
Boards.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (!(fieldNames || []).includes('permission')) return false;

    const allowPrivateOnly = (await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly'))?.booleanValue;
    if (allowPrivateOnly && modifier.$set && isOpenPermission(modifier.$set.permission)) {
      return true;
    }

    return false;
  },
  fetch: [],
});
