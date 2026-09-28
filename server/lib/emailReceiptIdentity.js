'use strict';
const { createHash } = require('node:crypto');
const hash = values => createHash('sha256').update(JSON.stringify(values)).digest('hex');
const idFor = (userId, eventId) => hash([userId, eventId]);
const commandIdentity = (userId, action, actorId) => hash([userId, action, actorId]);
const keysAre = (row, keys) => Object.keys(row).sort().join(',') === [...keys].sort().join(',');
const terminalJob = state => ['sent', 'cancelled'].includes(state);
const terminalCommand = status => ['completed', 'superseded'].includes(status);
function matchesEmailJob(row, userId, eventId) {
  if (!row || row._id !== idFor(userId, eventId)) return false;
  if (!Object.hasOwn(row, 'compactReceiptVersion')) return row.userId === userId && row.eventId === eventId;
  return row.compactReceiptVersion === 1 && terminalJob(row.state) &&
    keysAre(row, ['_id', 'state', 'compactReceiptVersion']);
}
function matchesEmailCommand(row, { requestId, userId, action, actorId }) {
  if (!row || row._id !== requestId) return false;
  if (!Object.hasOwn(row, 'compactReceiptVersion')) {
    return row.userId === userId && row.action === action && row.actorId === actorId;
  }
  return row.compactReceiptVersion === 1 && terminalCommand(row.status) &&
    row.identityHash === commandIdentity(userId, action, actorId) &&
    keysAre(row, ['_id', 'status', 'identityHash', 'compactReceiptVersion']);
}
module.exports = { idFor, commandIdentity, matchesEmailJob, matchesEmailCommand, terminalJob, terminalCommand };
