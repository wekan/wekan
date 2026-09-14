import Boards from '/models/boards';
import Cards from '/models/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { sourceRoleBlocksDelegation, recordLinkedWriteDenial } from '/models/lib/linkedWritePolicy';

// Editing a linked card is delegated by the board that contains the link. A
// user may therefore edit the source when they can write either the source
// board itself or at least one board containing a live link to that source.
// Merely knowing a source id is insufficient: the linked Card document must
// exist and its destination board must grant write access.
export async function canEditCardOrLinkedCard(userId, card, knownSourceBoard) {
  if (!userId || !card) return false;

  const sourceBoard = knownSourceBoard || await Boards.findOneAsync(card.boardId);
  if (allowIsBoardMemberWithWriteAccess(userId, sourceBoard)) return true;
  // An explicit non-writing source role is a ceiling, including for links
  // minted before link creation was restricted. A self-owned destination must
  // not turn source comment/read access into general source write access.
  if (sourceRoleBlocksDelegation(userId, sourceBoard)) {
    recordLinkedWriteDenial('linked-card:source-write');
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
