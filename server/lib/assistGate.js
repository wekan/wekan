import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';

// The server half of hiding the helpers that need no AI
// (docs/Features/Assistants/README.md). A hidden helper answers
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

// The same question for a server path of an Admin Panel / Settings / Features
// entry (models/lib/featureServerGates.js SERVER_PATHS), answered for a
// signed-in caller. An off feature is refused and recorded: no screen offers
// its path then, only a page open from before the change or a crafted call
// reaches it. Without a login the path's own login check answers, as before.
export async function featureAllowed(userId, key, source) {
  if (!userId) return true;
  if (await featureOnFor(userId, key)) return true;
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.disabled-setting', action: 'blocked', source, userId,
      detail: `Admin Panel / Settings / Features: ${key} is turned off.`,
    });
  } catch (e) { /* logging must never break the guard */ }
  return false;
}

// For a Meteor method: throws 'feature-disabled' when the feature is off.
export async function requireFeature(userId, key, source) {
  if (await featureAllowed(userId, key, source)) return;
  const { FEATURE_DISABLED } = require('/models/lib/featureServerGates');
  throw new Meteor.Error(FEATURE_DISABLED.error, FEATURE_DISABLED.reason);
}

// For a Boards / Lists deny rule: true (deny) when a client write turns on a
// field of a feature that is off for this user (models/lib/featureServerGates.js
// boardWriteFeatures / listWriteFeatures). Recorded once per write.
export async function deniedByOffFeatures(userId, keys, source) {
  for (const key of keys || []) {
    if (!(await featureAllowed(userId, key, source))) return true;
  }
  return false;
}
