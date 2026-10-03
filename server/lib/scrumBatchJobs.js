// Undo and redo of a large Scrum History batch as a background job
// (maintainer decision of 2026-10-03): a sprint close over many thousands of
// cards is recorded as many rows of one batch, and walking them one by one
// with every guard takes longer than a browser should wait on one call. The
// call applies the first row; this job applies the rest, one per step, as the
// user who asked, and keeps its progress in one document per board, so the
// Scrum view can show it and a restart resumes it. While it runs, undo and
// redo on that board wait for it.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { DDP } from 'meteor/ddp';

export const ScrumBatchJobs = new Mongo.Collection('scrumBatchJobs');
ScrumBatchJobs.deny({ insert: () => true, update: () => true, remove: () => true });

const running = new Map();
let stepper = null;
// server/models/changeHistory.js registers how one row is applied.
export function setBatchStepper(step) { stepper = step; }

const asUser = (userId, work) => {
  const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
  return DDP._CurrentMethodInvocation.withValue(context, () => work(context));
};

async function run(boardId) {
  for (;;) {
    const job = await ScrumBatchJobs.findOneAsync(boardId);
    if (!job) return;
    let more;
    try { more = await asUser(job.userId, context => stepper(context, job)); }
    catch (error) {
      await ScrumBatchJobs.rawCollection().updateOne({ _id: boardId },
        { $set: { state: 'failed', error: String(error.reason || error.message || error).slice(0, 500) } });
      throw error;
    }
    if (!more) { await ScrumBatchJobs.rawCollection().deleteOne({ _id: boardId }); return; }
    await ScrumBatchJobs.rawCollection().updateOne({ _id: boardId }, { $inc: { done: 1, index: 1 }, $set: { state: 'running' }, $unset: { error: '' } });
  }
}
export function runBatchJob(boardId) {
  if (!running.has(boardId)) {
    const job = run(boardId).finally(() => running.delete(boardId));
    running.set(boardId, job);
  }
  return running.get(boardId);
}
// For tests and callers that must wait.
export function batchJob(boardId) { return (running.get(boardId) || Promise.resolve()).catch(() => {}); }

export async function startBatchJob({ boardId, userId, direction, batchId, requestId, total }) {
  await ScrumBatchJobs.rawCollection().insertOne({ _id: boardId, boardId, userId, direction, batchId, requestId: requestId || null,
    index: 1, done: 1, total, state: 'running', startedAt: new Date() });
  runBatchJob(boardId).catch(() => {});
}

// A job on this board: running here, failed, or left by a restart. Undo and
// redo wait for it; a stopped one is resumed by the next press.
export async function assertNoBatchJob(boardId) {
  const job = await ScrumBatchJobs.findOneAsync(boardId);
  if (!job) return;
  if (!running.has(boardId)) runBatchJob(boardId).catch(() => {});
  throw new Meteor.Error('scrum-history-running', 'A large undo or redo is still running on this board.');
}

Meteor.startup(async () => {
  for (const job of await ScrumBatchJobs.find({}, { fields: { _id: 1 } }).fetchAsync()) runBatchJob(job._id).catch(() => {});
});
