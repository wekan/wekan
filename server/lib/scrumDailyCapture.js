const { createHash } = require('node:crypto');
const { sprintSnapshot, DEFAULT_SCRUM_SETTINGS } = require('../../models/lib/scrum');
function dailyObservationId(sprintId, startedAt, day) {
  return createHash('sha256').update(JSON.stringify([sprintId, new Date(startedAt).toISOString(), day])).digest('hex');
}

// Observations are recorded at their actual capture time. Never backfill a
// missing day with today's state or replace an earlier observation on retry.
// `rows`, when given, stores the snapshot's rows outside the observation
// (server/lib/scrumSnapshotStore.js) and returns its header; `discard` forgets
// them when another capture of the same day won.
async function captureDailySprint({ sprint, cards, lists, snapshots, at = new Date(), rows = null, discard = null }) {
  if (sprint.scrumImportPending || sprint.state !== 'active' || !sprint.startSnapshot) return { skipped: true };
  const start = new Date(sprint.startSnapshot.at);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(at.getTime()) || at < start) {
    throw new Error('Invalid daily Scrum observation timestamp');
  }
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
  if (rows) document.snapshot = await rows({ boardId: sprint.boardId, sprintId: sprint._id, kind: 'daily', snapshot: document.snapshot });
  try {
    await snapshots.insertAsync(document);
    return { captured: true };
  } catch (error) {
    if (error.code === 11000) {
      if (discard) await discard({ sprintId: sprint._id, kind: 'daily', at });
      return { captured: false };
    }
    throw error;
  }
}

module.exports = { captureDailySprint, dailyObservationId };
