import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';

// A Board Settings / Card flag that is on unless the board set it false, read
// through the client's board read - so a field the administrator unticked in
// Admin Panel / Settings / Visibility / Features / Card fields reads as off too
// (models/lib/cardFieldVisibility.js). The helpers that need no AI use it:
// docs/Features/General/Assistants/Assistants.md
export function boardFlagOn(field, boardId = Session.get('currentBoard')) {
  const board = ReactiveCache.getBoard(boardId);
  return !!board && board[field] !== false;
}
