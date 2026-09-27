const { createHash } = require('node:crypto');
const { sprintSnapshot, DEFAULT_SCRUM_SETTINGS } = require('../../models/lib/scrum');
function dailyObservationId(sprintId, startedAt, day) {
  return createHash('sha256').update(JSON.stringify([sprintId, new Date(startedAt).toISOString(), day])).digest('hex');
}

// Observations are recorded at their actual capture time. Never backfill a
// missing day with today's state or replace an earlier observation on retry.
async function captureDailySprint({ sprint, cards, lists, snapshots, at = new Date() }) {
  if (sprint.scrumImportPending || sprint.state !== 'active' || !sprint.startSnapshot) return { skipped: true };
  const start = new Date(sprint.startSnapshot.at);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(at.getTime()) || at < start) {
    throw new Error('Invalid daily Scrum observation timestamp');
  }
  if (cards.length > 10000 || lists.length > 10000) throw new Error('Daily Scrum observation exceeds its board-size limit');
  const policy = sprint.startSnapshot;
  if (!['poker', 'customField'].includes(policy.estimateSource) ||
    !['dueComplete', 'doneLists'].includes(policy.completionPolicy) || !policy.unit) {
    throw new Error('Daily Scrum observation requires the recorded sprint policy');
  }
  const settings = { ...DEFAULT_SCRUM_SETTINGS,
    estimateSource: policy.estimateSource, estimateCustomFieldId: policy.estimateCustomFieldId,
    estimateUnit: policy.unit, completionPolicy: policy.completionPolicy,
    workingDays: policy.workingDays || DEFAULT_SCRUM_SETTINGS.workingDays };
  const day = at.toISOString().slice(0, 10);
  const epoch = start.toISOString();
  const _id = dailyObservationId(sprint._id, epoch, day);
  const document = { _id, boardId: sprint.boardId, sprintId: sprint._id,
    startedAt: start, day, capturedAt: at, consistency: 'observed',
    snapshot: sprintSnapshot(cards, settings, lists, at) };
  if (policy.partial) document.snapshot.partial = true;
  try {
    await snapshots.insertAsync(document);
    return { captured: true };
  } catch (error) {
    if (error.code === 11000) return { captured: false };
    throw error;
  }
}

module.exports = { captureDailySprint, dailyObservationId };
