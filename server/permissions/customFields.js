import Boards from '/models/boards';
import CustomFields from '/models/customFields';
import { allowIsAnyBoardMemberWithWriteAccess, allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

// ReadOnly / CommentOnly / Worker members must not be able to create, modify or
// delete Custom Fields (which define board-wide schema). Use the write-access
// variant, not bare membership — the same read-only-write privilege escalation
// class as GHSA-6733 (which fixed the REST path; this is the allow/deny path).
CustomFields.allow({
  async insert(userId, doc) {
    const boards = await Boards.find({
      _id: { $in: doc.boardIds },
    }).fetchAsync();
    if (!allowIsAnyBoardMemberWithWriteAccess(userId, boards)) {
      return false;
    }
    // #3141: creating a field with `adminOnly: true` already set is the same
    // grant as toggling it afterwards - only a board admin may do it.
    if (doc.adminOnly) {
      return boards.some(board => board && board.hasAdmin(userId));
    }
    return true;
  },
  async update(userId, doc, fields) {
    const boards = await Boards.find({
      _id: { $in: doc.boardIds },
    }).fetchAsync();
    if (!allowIsAnyBoardMemberWithWriteAccess(userId, boards)) {
      return false;
    }
    // #3141: the "Admin only" flag itself may only be toggled by a board
    // admin - it decides who else may see or edit the field's value, so a
    // non-admin write-access member (a normal board member) must not be able
    // to grant themselves that gate by simply not turning it on for anyone.
    if (fields && fields.includes('adminOnly')) {
      return boards.some(board => board && board.hasAdmin(userId));
    }
    return true;
  },
  async remove(userId, doc) {
    return allowIsAnyBoardMemberWithWriteAccess(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  fetch: ['userId', 'boardIds'],
});

// AdminFieldBleed: protect shared definitions before allow/deny returns, so an
// explicit attempt to remove the value boundary is also visible in Problems.
CustomFields.deny({
  async insert(userId, doc) {
    if (!doc.adminOnly) return false;
    const { fieldPolicy, fieldWriteDenied } = require('/server/lib/adminOnlyCustomFields');
    const { adminBoards } = await fieldPolicy(userId);
    if (!doc.boardIds?.length || doc.boardIds.some(id => !adminBoards.has(id))) {
      fieldWriteDenied(userId, 'ddp:customFields.definition');
    }
    return false;
  },
  async update(userId, doc, fields, modifier) {
    const { fieldPolicy, modifiedCard, fieldWriteDenied } = require('/server/lib/adminOnlyCustomFields');
    const after = modifiedCard(doc, modifier);
    if (!doc.adminOnly && !after.adminOnly) return false;
    const { adminBoards } = await fieldPolicy(userId);
    if ([...(doc.boardIds || []), ...(after.boardIds || [])].some(id => !adminBoards.has(id))) {
      fieldWriteDenied(userId, 'ddp:customFields.definition');
    }
    return false;
  },
  async remove(userId, doc) {
    if (!doc.adminOnly) return false;
    const { fieldPolicy, fieldWriteDenied } = require('/server/lib/adminOnlyCustomFields');
    const { adminBoards } = await fieldPolicy(userId);
    if ((doc.boardIds || []).some(id => !adminBoards.has(id))) fieldWriteDenied(userId, 'ddp:customFields.definition');
    return false;
  },
  fetch: ['boardIds', 'adminOnly'],
});

// RepointBleed: the allow rules accept a field when the caller can write to ANY
// of its boards, so a field could be inserted onto, or $push'd to, somebody
// else's private board - where an always-on field writes into every card - or
// $pull'd from a board shared with someone who cannot stop it. Every board a
// field is created on, added to or removed from needs write access. The UI only
// ever names the current board.
async function boardsWithoutWrite(userId, boardIds) {
  const ids = [...new Set(boardIds)];
  if (!ids.length) return [];
  const boards = await Boards.find({ _id: { $in: ids } }).fetchAsync();
  return ids.filter(id => !allowIsBoardMemberWithWriteAccess(userId, boards.find(board => board._id === id)));
}
function recordFieldRepoint(userId, source) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.repoint', action: 'blocked', source, userId,
      detail: 'Tried to put a custom field on, or take it off, a board without write access there.',
    });
  } catch (e) { /* logging must never break the guard */ }
}
CustomFields.deny({
  async insert(userId, doc) {
    if (!(await boardsWithoutWrite(userId, doc.boardIds || [])).length) return false;
    recordFieldRepoint(userId, 'ddp:customFields.insert');
    return true;
  },
  async update(userId, doc, fieldNames, modifier) {
    if (!fieldNames.includes('boardIds')) return false;
    const { modifiedCard } = require('/server/lib/adminOnlyCustomFields');
    const before = doc.boardIds || [];
    const after = modifiedCard(doc, modifier).boardIds || [];
    const changed = [...before.filter(id => !after.includes(id)), ...after.filter(id => !before.includes(id))];
    if (!(await boardsWithoutWrite(userId, changed)).length) return false;
    recordFieldRepoint(userId, 'ddp:customFields.update');
    return true;
  },
  fetch: ['boardIds'],
});
