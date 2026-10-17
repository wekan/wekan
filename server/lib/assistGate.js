import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';

// The server half of hiding the helpers that need no AI
// (docs/Features/General/Assistants/Assistants.md). A hidden helper answers
// nothing, whoever calls it: the interface not drawing it is the visible half,
// this is the half a crafted call meets.
const { isCardFieldEnabled } = require('/models/lib/cardFieldVisibility');
const { isFeatureAvailable } = require('/models/lib/instanceFeatures');

// The board, when this user may read it and a card helper is on for that side:
// the board's Board Settings / Card flag (on unless set false) and the
// Admin Panel / Settings / Visibility / Features / Card fields tick.
export async function boardForCardHelper(userId, boardId, cardField, boardFlag) {
  if (!userId || typeof boardId !== 'string') return null;
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !canReadBoard(userId, board)) return null;
  if (board[boardFlag] === false) return null;
  const setting = await ReactiveCache.getCurrentSetting();
  if (!isCardFieldEnabled(setting, cardField)) return null;
  return board;
}

// Whether an Admin Panel / Settings / Visibility / Features entry is on for
// this user (or they preview it).
export async function featureOnFor(userId, key) {
  if (!userId) return false;
  const [setting, user] = await Promise.all([
    ReactiveCache.getCurrentSetting(),
    ReactiveCache.getUser(userId),
  ]);
  return isFeatureAvailable(setting, user, key);
}
