'use strict';

const NOTIFYING_LEVELS = new Set(['watching', 'tracking']);

/**
 * Keep notification candidates who are active board members and whose board
 * watch level permits notifications. A missing watcher entry has the board's
 * default `muted` meaning and must not be bypassed by assignment, mentions,
 * card/list watching or BIGEVENTS_PATTERN.
 */
function boardNotificationRecipients(candidates, members, boardWatchers) {
  const activeMemberIds = new Set(
    (members || []).filter(member => member.isActive === true).map(member => member.userId),
  );
  const notifyingUserIds = new Set(
    (boardWatchers || [])
      .filter(watcher => NOTIFYING_LEVELS.has(watcher.level))
      .map(watcher => watcher.userId),
  );

  return [...new Set(candidates || [])].filter(
    userId => activeMemberIds.has(userId) && notifyingUserIds.has(userId),
  );
}

module.exports = { boardNotificationRecipients };
