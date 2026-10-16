import Boards from '/models/boards';
import Cards from '/models/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { sourceRoleBlocksDelegation, recordLinkedWriteDenial } from '/models/lib/linkedWritePolicy';
import { listException } from '/server/lib/listPermissionGate';
import Lists from '/models/lists';
const { exceptionFor } = require('/models/lib/listPermissions');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

// Board roles apply to every view of a board (GHSA-r4gm-mjj9-g3x8): an
// assigned-only member reads and edits only the cards assigned to them. Their
// role carries `write`, which is a BOARD answer; this is the card one. A caller
// may pass a card fetched with only a few fields (the Cards allow rule fetches
// boardId), so the assignees are read when they are not there.
async function assignedCardIdSet(cards, userId) {
  const known = cards.filter(card => Array.isArray(card.assignees));
  const mine = new Set(known.filter(card => card.assignees.includes(userId)).map(card => card._id));
  const unknown = cards.filter(card => !Array.isArray(card.assignees) && card._id).map(card => card._id);
  if (unknown.length) {
    const read = await Cards.find({ _id: { $in: unknown }, assignees: userId }, { fields: { _id: 1 } }).fetchAsync();
    for (const card of read) mine.add(card._id);
  }
  return mine;
}

// Editing a linked card is delegated by the board that contains the link. A
// user may therefore edit the source when they can write either the source
// board itself or at least one board containing a live link to that source.
// Merely knowing a source id is insufficient: the linked Card document must
// exist and its destination board must grant write access.
export async function canEditCardOrLinkedCard(userId, card, knownSourceBoard, { recordDenial = true } = {}) {
  if (!userId || !card) return false;

  const sourceBoard = knownSourceBoard || await Boards.findOneAsync(card.boardId);
  if (isAssignedOnlyMember(sourceBoard, userId) && !(await assignedCardIdSet([card], userId)).has(card._id)) {
    // No view lists another member's card to them, so this is an attempt.
    if (recordDenial) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.assigned', action: 'blocked', source: 'card:edit', userId,
          detail: 'Assigned-only member tried to change a card not assigned to them.',
        });
      } catch (e) { /* logging must never break the guard */ }
    }
    return false;
  }
  // #4527: the card's list may say otherwise for this user's role, either way.
  // A list that refuses is final - a link on another board is not a way round it.
  const listRule = await listException(userId, sourceBoard, card.listId, 'write');
  if (listRule !== undefined) return listRule;
  if (allowIsBoardMemberWithWriteAccess(userId, sourceBoard)) return true;
  // An explicit non-writing source role is a ceiling, including for links
  // minted before link creation was restricted. A self-owned destination must
  // not turn source comment/read access into general source write access.
  if (sourceRoleBlocksDelegation(userId, sourceBoard)) {
    if (recordDenial) recordLinkedWriteDenial('linked-card:source-write');
    return false;
  }
  // Delegation applies only to a link whose source is still visible. If source
  // access is revoked, a stale link on another board must not remain a write
  // tunnel into the now-hidden card.
  if (!(await canUserSeeBoard(userId, card.boardId))) return false;

  const links = await Cards.find(
    {
      linkedId: card._id,
      type: 'cardType-linkedCard',
      archived: { $ne: true },
    },
    { fields: { boardId: 1 } },
  ).fetchAsync();
  if (!links.length) return false;

  const boards = await Boards.find(
    { _id: { $in: [...new Set(links.map(link => link.boardId))] } },
    { fields: { members: 1 } },
  ).fetchAsync();
  return boards.some(board =>
    allowIsBoardMemberWithWriteAccess(userId, board));
}

// canEditCardOrLinkedCard for every card of ONE board at once, without its
// denial logging: the ids of the ones the user may edit. A board's Scrum view
// asks this for all its cards, and one query per card - the links of each,
// then their boards - was the cost of opening it on a large board. The same
// rules: board writers edit them all, an explicit non-writing role edits none,
// otherwise a card is editable through a link on a board the user may write.
export async function editableCardIds(userId, cards, sourceBoard) {
  if (!userId || !sourceBoard || !cards.length) return new Set();
  // The same card rule as canEditCardOrLinkedCard, for the whole batch.
  if (isAssignedOnlyMember(sourceBoard, userId)) {
    const mine = await assignedCardIdSet(cards, userId);
    cards = cards.filter(card => mine.has(card._id));
    if (!cards.length) return new Set();
  }
  // #4527: cards in a list with an exception for this user's role are decided
  // by it; the rest by the rules below.
  const excepted = await Lists.find({ boardId: sourceBoard._id, roleExceptions: { $exists: true } },
    { fields: { roleExceptions: 1 } }).fetchAsync();
  const listRule = new Map(excepted.map(list => [list._id, exceptionFor(sourceBoard, list, userId, 'write')]));
  const decided = new Set();
  for (const card of cards) {
    const rule = listRule.get(card.listId);
    if (rule === true) decided.add(card._id);
  }
  const open = cards.filter(card => listRule.get(card.listId) === undefined);
  const ids = open.map(card => card._id);
  if (!ids.length) return decided;
  if (allowIsBoardMemberWithWriteAccess(userId, sourceBoard)) return new Set([...decided, ...ids]);
  if (sourceRoleBlocksDelegation(userId, sourceBoard) || !(await canUserSeeBoard(userId, sourceBoard._id))) return decided;
  const links = await Cards.find({ linkedId: { $in: ids }, type: 'cardType-linkedCard', archived: { $ne: true } },
    { fields: { boardId: 1, linkedId: 1 } }).fetchAsync();
  if (!links.length) return decided;
  const boards = await Boards.find({ _id: { $in: [...new Set(links.map(link => link.boardId))] } },
    { fields: { members: 1 } }).fetchAsync();
  const writable = new Set(boards.filter(board => allowIsBoardMemberWithWriteAccess(userId, board)).map(board => board._id));
  return new Set([...decided, ...links.filter(link => writable.has(link.boardId)).map(link => link.linkedId)]);
}
