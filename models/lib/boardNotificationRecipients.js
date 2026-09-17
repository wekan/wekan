'use strict';

const NOTIFYING_LEVELS = new Set(['watching', 'tracking']);

/**
 * Keep notification candidates who are active board members and whose board
 * watch level permits notifications. Explicit list/card subscriptions opt in
 * to that narrower scope even when the board itself is muted. Assignment,
 * mentions and BIGEVENTS_PATTERN alone must not bypass a muted board.
 */
function boardNotificationRecipients(candidates, members, boardWatchers, scopedWatchers = []) {
  const activeMemberIds = new Set(
    (members || []).filter(member => member.isActive === true).map(member => member.userId),
  );
  const notifyingUserIds = new Set(
    (boardWatchers || [])
      .filter(watcher => NOTIFYING_LEVELS.has(watcher.level))
      .map(watcher => watcher.userId),
  );
  scopedWatchers.forEach(userId => notifyingUserIds.add(userId));

  return [...new Set(candidates || [])].filter(
    userId => activeMemberIds.has(userId) && notifyingUserIds.has(userId),
  );
}

module.exports = { boardNotificationRecipients };
