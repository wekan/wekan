import Boards from '/models/boards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

export async function canWriteSubtaskDeposit(userId, boardId) {
  if (!userId || typeof boardId !== 'string' || !boardId) return false;
  return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(boardId));
}

export function recordSubtaskDepositDenial(source) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.subtask-deposit', action: 'blocked', source,
      detail: 'Subtask deposit reference or creation denied because the destination is not writable.',
    });
  } catch (e) { /* logging must never break the guard */ }
}
