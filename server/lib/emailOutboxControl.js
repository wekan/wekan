const { withSyncLease } = require('./syncLease');
const { matchesEmailCommand } = require('./emailReceiptIdentity');
const ACTIONS = ['pause', 'resume', 'cancel', 'retry'];
const REQUEST_ID = /^[A-Za-z0-9_-]{20,64}$/;
const PAYLOAD_FIELDS = { html: '', text: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '', failedAt: '' };

// A stable request receipt prevents a reconnect from repeating an old cancel
// against mail queued later. Generation fencing also makes an interrupted old
// request harmless after a newer operator action has already taken effect.
async function controlEmailOutbox({ jobs, controls, commands, leases, userId, action, requestId, actorId,
  assertAdmin, now = () => new Date(), leaseOptions = {} }) {
  if (typeof userId !== 'string' || !userId || userId.length > 200 ||
      !ACTIONS.includes(action) || typeof requestId !== 'string' || !REQUEST_ID.test(requestId) ||
      typeof actorId !== 'string' || !actorId || typeof assertAdmin !== 'function') throw new Error('invalid-email-control');
  return withSyncLease(leases, userId, async ({ assertCurrent }) => {
    const guard = async () => { await assertCurrent(); await assertAdmin(); };
    await guard();
    let command = await commands.findOne({ _id: requestId });
    if (command && !matchesEmailCommand(command, { requestId, userId, action, actorId })) {
      throw new Error('email-control-identity-mismatch');
    }
    if (command?.status === 'completed' || command?.status === 'superseded') return { status: command.status };
    let current = await controls.findOne({ _id: userId });
    if (!command) {
      command = { _id: requestId, userId, action, actorId, cutoff: now(),
        generation: (current?.generation || 0) + 1, status: 'pending' };
      try { await commands.insertOne(command); }
      catch (error) {
        const saved = await commands.findOne({ _id: requestId });
        if (!saved || saved.userId !== userId || saved.action !== action || saved.actorId !== actorId ||
            saved.generation !== command.generation || +saved.cutoff !== +command.cutoff) throw error;
      }
      const saved = await commands.findOne({ _id: requestId });
      if (!saved || saved.generation !== command.generation || +saved.cutoff !== +command.cutoff) throw new Error('email-control-not-stored');
    }
    await guard();
    const finish = async status => {
      try { await commands.updateOne({ _id: requestId, status: 'pending' }, { $set: { status, finishedAt: now() } }); }
      catch (error) {
        if ((await commands.findOne({ _id: requestId }))?.status !== status) throw error;
      }
      if ((await commands.findOne({ _id: requestId }))?.status !== status) throw new Error('email-control-not-confirmed');
      await guard();
      return { status };
    };
    if ((current?.generation || 0) > command.generation ||
        (current?.generation === command.generation && current.lastRequestId !== requestId)) {
      return finish('superseded');
    }
    if ((current?.generation || 0) < command.generation) {
      if ((current?.generation || 0) !== command.generation - 1) throw new Error('email-control-generation-mismatch');
      const set = { generation: command.generation, lastRequestId: requestId,
        lastAction: action, changedAt: command.cutoff, changedBy: actorId };
      if (action === 'pause' || action === 'resume') set.paused = action === 'pause';
      if (action === 'cancel') set.cancelBefore = new Date(Math.max(+current?.cancelBefore || 0, +command.cutoff));
      const selector = { _id: userId, generation: current?.generation ?? { $exists: false } };
      try {
        await controls.updateOne(selector, { $set: set, $inc: { [`${action}Count`]: 1 } }, { upsert: true });
      } catch (error) {
        const saved = await controls.findOne({ _id: userId });
        if (saved?.generation !== command.generation || saved.lastRequestId !== requestId) throw error;
      }
      current = await controls.findOne({ _id: userId });
    }
    if (current?.generation !== command.generation || current.lastRequestId !== requestId) {
      throw new Error('email-control-generation-mismatch');
    }
    await guard();
    const pending = { userId, state: 'pending', createdAt: { $lte: command.cutoff } };
    if (action === 'cancel') {
      pending.state = { $in: ['pending', 'failed'] };
      try { await jobs.updateMany(pending, { $set: { state: 'cancelled', finishedAt: now() }, $unset: PAYLOAD_FIELDS }); }
      catch (error) { if (await jobs.countDocuments(pending)) throw error; }
      if (await jobs.countDocuments(pending)) throw new Error('email-control-cancel-incomplete');
    } else if (action === 'retry') {
      const failed = { userId, state: 'failed', createdAt: { $lte: command.cutoff }, retryRequestId: { $ne: requestId } };
      try {
        await jobs.updateMany(failed, { $set: { state: 'pending', cycleAttempts: 0,
          retryRequestId: requestId, nextAttemptAt: command.cutoff },
        $unset: { failedAt: '', lastFailure: '', attemptId: '' } });
      } catch (error) { if (await jobs.countDocuments(failed)) throw error; }
      if (await jobs.countDocuments(failed)) throw new Error('email-control-retry-incomplete');
    } else if (action === 'resume') {
      const waiting = { ...pending, nextAttemptAt: { $gt: command.cutoff } };
      try { await jobs.updateMany(pending, { $set: { nextAttemptAt: command.cutoff } }); }
      catch (error) { if (await jobs.countDocuments(waiting)) throw error; }
      if (await jobs.countDocuments(waiting)) throw new Error('email-control-resume-incomplete');
    }
    return finish('completed');
  }, { ...leaseOptions, now });
}
module.exports = { controlEmailOutbox, ACTIONS, PAYLOAD_FIELDS };
