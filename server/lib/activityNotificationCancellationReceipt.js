'use strict';
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const fail = () => { throw new Error('activity-cancellation-cleanup-invalid'); };
function validateCancelledActivityNotificationIntent(row, intentId) {
  if (!row || row._id !== intentId || row.state !== 'cancelled' || row.version !== 1 ||
      !text(row.activityId) || !hash(row.activityHash) || !text(row.writerId) ||
      !(row.dispatchUserId === null || text(row.dispatchUserId)) ||
      !(row.boardId === null || text(row.boardId)) || !(row.cardId === null || text(row.cardId)) ||
      !(row.createdAt instanceof Date) || !Number.isFinite(+row.createdAt) ||
      row._id !== sha256(canonical(['activity-notification-intent', row.activityId])) ||
      Object.keys(row).sort().join(',') !== '_id,activityHash,activityId,boardId,cardId,createdAt,dispatchUserId,state,version,writerId') fail();
  return row;
}
module.exports = { validateCancelledActivityNotificationIntent };
